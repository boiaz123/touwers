import { BasicTower } from './BasicTower.js';
import { CannonTower } from './CannonTower.js';
import { ArcherTower } from './ArcherTower.js';
import { MagicTower } from './MagicTower.js';
import { BarricadeTower } from './BarricadeTower.js';
import { PoisonArcherTower } from './PoisonArcherTower.js';
import { CombinationTower } from './CombinationTower.js';
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
            'poison': { class: PoisonArcherTower, cost: 120 },
            'combination': { class: CombinationTower, cost: 200 }
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
                
                // New: Set academy reference on newly built mine if academy exists and gem mining researched
                const academies = this.buildingManager.buildings.filter(building =>
                    building.constructor.name === 'MagicAcademy'
                );
                if (academies.length > 0) {
                    const newMine = this.buildingManager.buildings[this.buildingManager.buildings.length - 1];
                    newMine.setAcademy(academies[0]);
                    console.log('TowerManager: Set academy reference on new mine');
                }
            } else if (type === 'academy') {
                this.unlockSystem.onAcademyBuilt();
                console.log('TowerManager: Academy built, Magic Tower unlocked');
                
                // New: When academy is built, set it as reference on all existing mines
                this.buildingManager.buildings.forEach(building => {
                    if (building.constructor.name === 'GoldMine') {
                        const academy = this.buildingManager.buildings.find(b => b.constructor.name === 'MagicAcademy');
                        if (academy) {
                            building.setAcademy(academy);
                            console.log('TowerManager: Set academy reference on existing mine');
                        }
                    }
                });
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
        
        // New: Apply combination spell bonuses to Combination Towers
        if (tower.constructor.name === 'CombinationTower') {
            const academies = this.buildingManager.buildings.filter(building =>
                building.constructor.name === 'MagicAcademy'
            );
            
            if (academies.length > 0) {
                const academy = academies[0];
                
                // Set available spells
                const availableSpells = academy.combinationSpells.filter(spell =>
                    academy.unlockedCombinations.has(spell.id)
                );
                tower.setAvailableSpells(availableSpells);
                
                // Apply bonuses based on elemental upgrades
                const elementalBonuses = academy.getElementalBonuses();
                tower.applySpellBonuses(elementalBonuses);
            }
        }
    }
    
    // New: Get gem stocks for UI display
    getGemStocks() {
        const academies = this.buildingManager.buildings.filter(building =>
            building.constructor.name === 'MagicAcademy'
        );
        
        if (academies.length > 0) {
            return academies[0].gems;
        }
        
        return { fire: 0, water: 0, air: 0, earth: 0 };
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
    
    handleClick(x, y, canvasSize) {
        // Clear any previous selections
        this.towers.forEach(tower => tower.isSelected = false);
        this.buildingManager.buildings.forEach(building => {
            if (building.deselect) building.deselect();
        });
        
        // Check tower icon clicks first for element selection
        const cellSize = Math.floor(32 * Math.max(0.5, Math.min(2.5, canvasSize.width / 1920)));
        const iconSize = 30; // Increased for better clickability
        
        for (const tower of this.towers) {
            // Icon position: bottom right of 2x2 grid, slightly floating up
            const iconX = (tower.gridX + 1.5) * cellSize;
            const iconY = (tower.gridY + 1.5) * cellSize - 5;
            
            const clickBuffer = 5;
            if (x >= iconX - (iconSize/2 + clickBuffer) && x <= iconX + (iconSize/2 + clickBuffer) &&
                y >= iconY - (iconSize/2 + clickBuffer) && y <= iconY + (iconSize/2 + clickBuffer)) {
                if (tower.constructor.name === 'MagicTower') {
                    tower.isSelected = true;
                    return {
                        type: 'magic_tower_menu',
                        tower: tower,
                        elements: [
                            { id: 'fire', name: 'Fire', icon: '🔥', description: 'Burn damage over time' },
                            { id: 'water', name: 'Water', icon: '💧', description: 'Slows and freezes enemies' },
                            { id: 'air', name: 'Air', icon: '💨', description: 'Chains to nearby enemies' },
                            { id: 'earth', name: 'Earth', icon: '🌍', description: 'Pierces armor' }
                        ],
                        currentElement: tower.selectedElement
                    };
                } else if (tower.constructor.name === 'CombinationTower') {
                    // New: Handle combination tower spell selection
                    tower.isSelected = true;
                    return {
                        type: 'combination_tower_menu',
                        tower: tower,
                        spells: tower.availableSpells.map(spell => ({
                            id: spell.id,
                            name: spell.name,
                            icon: spell.icon,
                            description: spell.description
                        })),
                        currentSpell: tower.selectedSpell
                    };
                } else if (tower.constructor.name === 'BasicTower') {
                    // New: Only show menu if NOT in placement mode
                    if (!this.gameState || !this.gameState.isPlacingTower) {
                        tower.isSelected = true;
                        tower.showRange = true; // Show range when selected
                        return {
                            type: 'basic_tower_stats',
                            tower: tower,
                            position: { x: tower.x, y: tower.y } // Add position for menu placement
                        };
                    }
                }
                break;
            }
        }
        
        // Then check building icon clicks with improved detection
        const buildingResult = this.buildingManager.handleClick(x, y, canvasSize);
        if (buildingResult) {
            if (buildingResult.type === 'forge_menu') {
                buildingResult.unlockSystem = this.unlockSystem;
                return buildingResult;
            } else if (buildingResult.type === 'academy_menu') {
                buildingResult.unlockSystem = this.unlockSystem;
                console.log('TowerManager: Academy menu requested');
                return buildingResult;
            } else if (typeof buildingResult === 'number') {
                // Gold collection
                return buildingResult;
            }
        }
        
        // Check buildings first (they have interactive elements like toggle icons)
        if (this.buildingManager) {
            for (const building of this.buildingManager.buildings) {
                if (building.isPointInside(x, y, building.size || 256)) {
                    // Pass coordinates to onClick so it can handle toggle icons
                    const result = building.onClick ? building.onClick(x, y, building.size || 256) : null;
                    
                    console.log(`TowerManager: Building clicked at (${x}, ${y}), result:`, result);
                    
                    // Handle different result types
                    if (result !== undefined && result !== null) {
                        if (typeof result === 'number') {
                            return result; // Gold/gem collection
                        } else if (typeof result === 'object') {
                            return result; // Menu data
                        }
                    }
                }
            }
        }
        
        return null;
    }
    
    selectMagicTowerElement(tower, element) {
        if (tower && tower.setElement) {
            tower.setElement(element);
            console.log(`TowerManager: Set magic tower element to ${element}`);
            return true;
        }
        return false;
    }
    
    // New: Select combination tower spell
    selectCombinationTowerSpell(tower, spellId) {
        if (tower && tower.setSpell) {
            tower.setSpell(spellId);
            console.log(`TowerManager: Set combination tower spell to ${spellId}`);
            return true;
        }
        return false;
    }
    
    render(ctx) {
        // Render all towers
        this.towers.forEach(tower => {
            tower.render(ctx);
        });
        
        // Render all buildings
        this.buildingManager.render(ctx);
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
            
            // New: Check super weapon unlock from academy
            if (type === 'superweapon') {
                const academies = this.buildingManager.buildings.filter(building =>
                    building.constructor.name === 'MagicAcademy'
                );
                info.unlocked = academies.length > 0 && academies[0].superWeaponUnlocked;
                
                if (!info.unlocked) {
                    info.disabled = true;
                    info.disableReason = 'Unlock at Academy Level 3';
                }
            } else if (type === 'forge' && this.unlockSystem.forgeCount >= this.unlockSystem.maxForges) {
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
    
    updatePositions(level) {
        this.towers.forEach(tower => {
            const { screenX, screenY } = level.gridToScreen(tower.gridX, tower.gridY);
            tower.screenX = screenX;
            tower.screenY = screenY;
        });
    }
    
    sellTower(tower) {
        const refund = Math.floor(tower.constructor.getInfo().cost * 0.7);
        this.gameState.gold += refund;
        this.removeTower(tower);
        console.log(`TowerManager: Sold ${tower.constructor.name} for $${refund}`);
    }
}
