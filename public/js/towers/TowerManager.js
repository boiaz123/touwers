import { BasicTower } from './BasicTower.js';
import { CannonTower } from './CannonTower.js';
import { ArcherTower } from './ArcherTower.js';
import { MagicTower } from './MagicTower.js';
import { BarricadeTower } from './BarricadeTower.js';
import { PoisonArcherTower } from './PoisonArcherTower.js';
import { BuildingManager } from '../buildings/BuildingManager.js';
import { UnlockSystem } from '../UnlockSystem.js';

export class TowerManager {
    constructor(gameState, level) {
        this.gameState = gameState;
        this.level = level;
        this.towers = [];
        this.towerTypes = {
            'basic': { class: BasicTower, cost: 50 },
            'cannon': { class: CannonTower, cost: 100 },
            'archer': { class: ArcherTower, cost: 75 },
            'magic': { class: MagicTower, cost: 150 },
            'barricade': { class: BarricadeTower, cost: 90 },
            'poison': { class: PoisonArcherTower, cost: 120 }
        };
        
        // Initialize unlock system and building manager
        this.unlockSystem = new UnlockSystem();
        this.buildingManager = new BuildingManager(gameState, level);
        
        // Track occupied grid positions by towers only
        this.occupiedPositions = new Set();
    }
    
    placeTower(type, x, y, gridX, gridY) {
        // Check if tower type is unlocked
        if (!this.unlockSystem.canBuildTower(type)) {
            console.log(`TowerManager: ${type} tower not yet unlocked`);
            return false;
        }
        
        const towerType = this.towerTypes[type];
        if (!towerType) return false;
        
        // Check if the position is already occupied by another tower
        if (this.isTowerPositionOccupied(gridX, gridY)) {
            console.log('TowerManager: Position already occupied by another tower');
            return false;
        }
        
        if (this.gameState.spend(towerType.cost)) {
            const tower = new towerType.class(x, y, gridX, gridY);
            this.towers.push(tower);
            
            // Mark the 2x2 area as occupied by this tower
            this.markTowerPosition(gridX, gridY);
            
            console.log(`TowerManager: Placed ${type} tower at grid (${gridX}, ${gridY})`);
            return true;
        }
        return false;
    }
    
    placeBuilding(type, x, y, gridX, gridY) {
        // Check if building type is unlocked
        if (!this.unlockSystem.canBuildBuilding(type)) {
            console.log(`TowerManager: ${type} building not yet unlocked or limit reached`);
            return false;
        }
        
        const result = this.buildingManager.placeBuilding(type, x, y, gridX, gridY);
        
        // Handle building placement for unlock system
        if (result) {
            if (type === 'forge') {
                this.unlockSystem.onForgeBuilt();
                console.log('TowerManager: Forge built, new content unlocked');
            } else if (type === 'mine') {
                this.unlockSystem.onMineBuilt();
                console.log('TowerManager: Mine built');
            } else if (type === 'academy') {
                this.unlockSystem.onAcademyBuilt();
                console.log('TowerManager: Academy built, Magic Tower unlocked');
            }
        }
        
        return result;
    }
    
    isBuildingPositionOccupied(gridX, gridY, size) {
        return this.buildingManager.isBuildingPositionOccupied(gridX, gridY, size);
    }
    
    isTowerPositionOccupied(gridX, gridY) {
        // Check if any part of the 2x2 tower area is occupied
        for (let x = gridX; x < gridX + 2; x++) {
            for (let y = gridY; y < gridY + 2; y++) {
                if (this.occupiedPositions.has(`${x},${y}`)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    markTowerPosition(gridX, gridY) {
        // Mark the 2x2 area as occupied
        for (let x = gridX; x < gridX + 2; x++) {
            for (let y = gridY; y < gridY + 2; y++) {
                this.occupiedPositions.add(`${x},${y}`);
            }
        }
    }
    
    removeTower(tower) {
        const index = this.towers.indexOf(tower);
        if (index !== -1) {
            this.towers.splice(index, 1);
            
            // Free up the occupied positions
            for (let x = tower.gridX; x < tower.gridX + 2; x++) {
                for (let y = tower.gridY; y < tower.gridY + 2; y++) {
                    this.occupiedPositions.delete(`${x},${y}`);
                }
            }
        }
    }
    
    update(deltaTime, enemies) {
        // Check if any forge upgrades have changed
        const forges = this.buildingManager.buildings.filter(building => 
            building.constructor.name === 'TowerForge'
        );
        
        // Check if any academy upgrades have changed  
        const academies = this.buildingManager.buildings.filter(building =>
            building.constructor.name === 'MagicAcademy'
        );
        
        let upgradesChanged = false;
        forges.forEach(forge => {
            if (forge.upgradesChanged) {
                upgradesChanged = true;
                forge.upgradesChanged = false; // Reset flag
            }
        });
        
        // If upgrades changed, recalculate all tower stats
        if (upgradesChanged) {
            this.recalculateAllTowerStats();
        }
        
        // Apply building upgrades to towers
        const upgrades = this.buildingManager.towerUpgrades;
        
        this.towers.forEach(tower => {
            // Store original values if not already stored
            if (!tower.originalDamage) {
                tower.originalDamage = tower.damage;
                tower.originalRange = tower.range;
                tower.originalFireRate = tower.fireRate;
            }
            
            // Apply base building upgrades
            tower.damage = tower.originalDamage * upgrades.damage;
            tower.range = tower.originalRange * upgrades.range;
            tower.fireRate = tower.originalFireRate * upgrades.fireRate;
            
            // Apply forge-specific upgrades
            this.applyForgeUpgrades(tower);
            
            // Apply academy elemental bonuses to Magic Towers
            this.applyAcademyUpgrades(tower);
            
            tower.update(deltaTime, enemies);
        });
        
        // Update building manager
        this.buildingManager.update(deltaTime);
    }
    
    applyAcademyUpgrades(tower) {
        if (tower.constructor.name === 'MagicTower') {
            // Get elemental bonuses from academies
            const academies = this.buildingManager.buildings.filter(building =>
                building.constructor.name === 'MagicAcademy'
            );
            
            if (academies.length > 0) {
                const elementalBonuses = academies[0].getElementalBonuses();
                tower.applyElementalBonuses(elementalBonuses);
            }
        }
    }
    
    recalculateAllTowerStats() {
        // Force recalculation of all tower stats when forge upgrades change
        this.towers.forEach(tower => {
            // Reset to original values first
            if (tower.originalDamage) {
                tower.damage = tower.originalDamage;
                tower.range = tower.originalRange;
                tower.fireRate = tower.originalFireRate;
            }
        });
        console.log('TowerManager: Recalculated all tower stats due to forge upgrade');
    }
    
    applyForgeUpgrades(tower) {
        // Get all forge upgrade multipliers
        const forges = this.buildingManager.buildings.filter(building => 
            building.constructor.name === 'TowerForge'
        );
        
        forges.forEach(forge => {
            const multipliers = forge.getUpgradeMultipliers();
            
            // Apply range upgrade to ALL towers
            tower.range *= multipliers.rangeMultiplier;
            
            // Apply specific upgrades based on tower type and unlock status
            const towerType = tower.constructor.name;
            
            switch (towerType) {
                case 'PoisonArcherTower':
                    if (this.unlockSystem.canUseUpgrade('poisonDamage')) {
                        tower.damage += multipliers.poisonDamageBonus;
                    }
                    if (this.unlockSystem.canUseUpgrade('fireArrows') && multipliers.fireArrowsEnabled) {
                        tower.hasFireArrows = true;
                    }
                    break;
                    
                case 'ArcherTower':
                    if (this.unlockSystem.canUseUpgrade('fireArrows') && multipliers.fireArrowsEnabled) {
                        tower.hasFireArrows = true;
                    }
                    break;
                    
                case 'BarricadeTower':
                case 'BasicTower':
                    if (this.unlockSystem.canUseUpgrade('barricadeDamage')) {
                        tower.damage += multipliers.barricadeDamageBonus;
                    }
                    break;
                    
                case 'CannonTower':
                    if (this.unlockSystem.canUseUpgrade('explosiveRadius') && tower.explosionRadius) {
                        tower.explosionRadius += multipliers.explosiveRadiusBonus;
                    }
                    break;
            }
        });
    }
    
    // NEW: unified icon info generator
    getIconData(entity) {
        const baseResolution = 1920;
        const scaleFactor = Math.max(0.5, Math.min(2.5, this.level.canvasWidth ? this.level.canvasWidth / baseResolution : 1));
        const cellSize = Math.floor(32 * scaleFactor);
        const iconSize = cellSize * 0.9;
        const typeName = entity.constructor.name;
        // Pick symbol
        let symbol = 'ℹ️';
        switch (typeName) {
            case 'BasicTower': symbol = '🏰'; break;
            case 'CannonTower': symbol = '💣'; break;
            case 'ArcherTower': symbol = '🏹'; break;
            case 'MagicTower': symbol = '⚡'; break;
            case 'BarricadeTower': symbol = '🛡️'; break;
            case 'PoisonArcherTower': symbol = '☠️'; break;
            case 'TowerForge': symbol = '🔨'; break;
            case 'GoldMine': symbol = '⛏️'; break;
            case 'MagicAcademy': symbol = '🎓'; break;
            case 'SuperWeapon': symbol = '🚀'; break;
        }
        // Position icon slightly above entity center
        return {
            x: entity.x,
            y: entity.y - cellSize * 1.2,
            r: Math.max(18, cellSize * 0.45),
            symbol,
            entity
        };
    }

    // Helper hit test
    isIconHit(icon, clickX, clickY) {
        return Math.hypot(clickX - icon.x, clickY - icon.y) <= icon.r;
    }

    handleClick(x, y, canvasSize) {
        // Clear previous selection states
        this.towers.forEach(t => t.isSelected = false);
        this.buildingManager.buildings.forEach(b => { if (b.deselect) b.deselect(); });

        // Build icon list (towers + buildings)
        const icons = [];
        this.towers.forEach(t => icons.push(this.getIconData(t)));
        this.buildingManager.buildings.forEach(b => icons.push(this.getIconData(b)));

        // Check icon hits (topmost first => iterate reverse so last drawn has priority)
        for (let i = icons.length - 1; i >= 0; i--) {
            const icon = icons[i];
            if (this.isIconHit(icon, x, y)) {
                const ent = icon.entity;
                const name = ent.constructor.name;

                // Tower interactions
                if (name === 'MagicTower') {
                    ent.isSelected = true;
                    return {
                        type: 'magic_tower_menu',
                        tower: ent,
                        elements: [
                            { id: 'fire', name: 'Fire', icon: '🔥', description: 'Burn damage over time' },
                            { id: 'water', name: 'Water', icon: '💧', description: 'Slows & minor freeze' },
                            { id: 'air', name: 'Air', icon: '💨', description: 'Chains to nearby enemies' },
                            { id: 'earth', name: 'Earth', icon: '🌍', description: 'Armor piercing' }
                        ],
                        currentElement: ent.selectedElement
                    };
                }

                // Buildings use their own onClick() if available
                if (ent.onClick) {
                    return ent.onClick();
                }

                // Fallback generic tower info (no special menu)
                if (ent.constructor.getInfo) {
                    return {
                        type: 'tower_info',
                        tower: ent,
                        info: ent.constructor.getInfo()
                    };
                }
                return null;
            }
        }
        return null;
    }
    
    render(ctx) {
        // Render all towers
        this.towers.forEach(t => t.render(ctx));
        this.buildingManager.render(ctx);

        // AFTER normal render: draw interactable icons
        const baseResolution = 1920;
        const scaleFactor = Math.max(0.5, Math.min(2.5, ctx.canvas.width / baseResolution));
        const fontSize = Math.floor(14 * scaleFactor);

        const drawIcon = (icon) => {
            ctx.save();
            // Background circle
            ctx.beginPath();
            ctx.fillStyle = 'rgba(30,30,30,0.75)';
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 2;
            ctx.arc(icon.x, icon.y, icon.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // Symbol
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(icon.symbol, icon.x, icon.y + 1);
            // Selection glow
            if (icon.entity.isSelected) {
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(icon.x, icon.y, icon.r + 4, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        };

        this.towers.forEach(t => drawIcon(this.getIconData(t)));
        this.buildingManager.buildings.forEach(b => drawIcon(this.getIconData(b)));
    }
    
    getTowerInfo(type) {
        const towerType = this.towerTypes[type];
        if (!towerType || !towerType.class.getInfo) return null;
        
        const info = towerType.class.getInfo();
        // Add unlock status
        info.unlocked = this.unlockSystem.canBuildTower(type);
        return info;
    }
    
    getBuildingInfo(type) {
        const info = this.buildingManager.getBuildingInfo(type);
        if (info) {
            info.unlocked = this.unlockSystem.canBuildBuilding(type);
            
            if (type === 'forge' && this.unlockSystem.forgeCount >= this.unlockSystem.maxForges) {
                info.disabled = true;
                info.disableReason = "Only 1 forge allowed";
            } else if (type === 'mine' && this.unlockSystem.mineCount >= this.unlockSystem.getMaxMines()) {
                info.disabled = true;
                info.disableReason = `Max ${this.unlockSystem.getMaxMines()} mines allowed`;
            } else if (type === 'academy' && this.unlockSystem.academyCount >= 1) {
                info.disabled = true;
                info.disableReason = "Only 1 academy allowed";
            }
        }
        return info;
    }
    
    getUnlockSystem() {
        return this.unlockSystem;
    }
}
