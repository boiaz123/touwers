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
        
        // Sandbox academy reference for gem display
        this.sandboxAcademy = null;
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
                
                // Set academy reference on newly built mine
                const newMine = this.buildingManager.buildings[this.buildingManager.buildings.length - 1];
                if (this.sandboxAcademy) {
                    // Use sandbox academy if available
                    newMine.setAcademy(this.sandboxAcademy);
                    newMine.gemMiningUnlocked = this.sandboxAcademy.gemMiningToolsResearched;
                    console.log('TowerManager: Set sandbox academy reference on new mine');
                } else {
                    // Find real academy
                    const academies = this.buildingManager.buildings.filter(building =>
                        building.constructor.name === 'MagicAcademy'
                    );
                    if (academies.length > 0) {
                        newMine.setAcademy(academies[0]);
                        console.log('TowerManager: Set real academy reference on new mine');
                    }
                }
            } else if (type === 'academy') {
                this.unlockSystem.onAcademyBuilt();
                console.log('TowerManager: Academy built, Magic Tower unlocked');
                
                // When real academy is built, update all existing mines and replace sandbox academy
                const realAcademy = this.buildingManager.buildings[this.buildingManager.buildings.length - 1];
                
                // If we had a sandbox academy, copy its gems to the real academy
                if (this.sandboxAcademy) {
                    Object.assign(realAcademy.gems, this.sandboxAcademy.gems);
                    realAcademy.elementalLevels = { ...this.sandboxAcademy.elementalLevels };
                    realAcademy.academyLevel = this.sandboxAcademy.academyLevel;
                    realAcademy.gemMiningToolsResearched = this.sandboxAcademy.gemMiningToolsResearched;
                    realAcademy.diamondMiningUnlocked = this.sandboxAcademy.diamondMiningUnlocked;
                    if (this.sandboxAcademy.unlockedCombinationSpells) {
                        realAcademy.unlockedCombinationSpells = new Set(this.sandboxAcademy.unlockedCombinationSpells);
                    }
                    console.log('TowerManager: Transferred sandbox academy data to real academy');
                    this.sandboxAcademy = null; // Clear sandbox academy
                }
                
                // Update all existing mines with real academy reference
                this.buildingManager.buildings.forEach(building => {
                    if (building.constructor.name === 'GoldMine') {
                        building.setAcademy(realAcademy);
                        console.log('TowerManager: Updated mine with real academy reference');
                    }
                });
            } else if (type === 'superweapon') {
                this.unlockSystem.onSuperWeaponBuilt();
                console.log('TowerManager: Super Weapon Lab built');
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
            // Get elemental bonuses from academies (real or sandbox)
            let elementalBonuses = {};
            
            if (this.sandboxAcademy && this.sandboxAcademy.getElementalBonuses) {
                elementalBonuses = this.sandboxAcademy.getElementalBonuses();
            } else {
                const academies = this.buildingManager.buildings.filter(building =>
                    building.constructor.name === 'MagicAcademy'
                );
                
                if (academies.length > 0) {
                    elementalBonuses = academies[0].getElementalBonuses();
                }
            }
            
            tower.applyElementalBonuses(elementalBonuses);
        }
        
        // Apply combination spell bonuses to Combination Towers
        if (tower.constructor.name === 'CombinationTower') {
            let academy = null;
            
            // Check sandbox academy first, then real academy
            if (this.sandboxAcademy) {
                academy = this.sandboxAcademy;
            } else {
                const academies = this.buildingManager.buildings.filter(building =>
                    building.constructor.name === 'MagicAcademy'
                );
                if (academies.length > 0) {
                    academy = academies[0];
                }
            }
            
            if (academy && academy.combinationSpells) {
                // Set available spells from academy
                const availableSpells = academy.combinationSpells.filter(spell =>
                    academy.unlockedCombinations && academy.unlockedCombinations.has(spell.id)
                );
                tower.setAvailableSpells(availableSpells);
                
                // Apply bonuses based on elemental upgrades
                const elementalBonuses = academy.getElementalBonuses ? academy.getElementalBonuses() : {};
                tower.applySpellBonuses(elementalBonuses);
                
                console.log(`TowerManager: Set ${availableSpells.length} available spells for combination tower`);
            }
        }
    }
    
    // New: Get gem stocks for UI display
    getGemStocks() {
        // Check sandbox academy first, then real academy
        if (this.sandboxAcademy) {
            return {
                fire: this.sandboxAcademy.gems?.fire || 0,
                water: this.sandboxAcademy.gems?.water || 0,
                air: this.sandboxAcademy.gems?.air || 0,
                earth: this.sandboxAcademy.gems?.earth || 0,
                diamond: this.sandboxAcademy.gems?.diamond || 0
            };
        }
        
        // Find academy building
        const academy = this.buildingManager.buildings.find(building => 
            building.constructor.name === 'MagicAcademy'
        );
        
        if (academy) {
            return {
                fire: academy.gems?.fire || 0,
                water: academy.gems?.water || 0,
                air: academy.gems?.air || 0,
                earth: academy.gems?.earth || 0,
                diamond: academy.gems?.diamond || 0
            };
        }
        
        return {
            fire: 0,
            water: 0, 
            air: 0,
            earth: 0,
            diamond: 0
        };
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
        if (!info) return null;
        
        // Check unlock status from unlock system
        const unlocked = this.unlockSystem.canBuildBuilding(type);
        const disabled = !unlocked;
        
        let disableReason = '';
        if (!unlocked) {
            // Get the specific reason from unlock system
            switch (type) {
                case 'mine':
                    if (this.unlockSystem.mineCount >= this.unlockSystem.getMaxMines()) {
                        disableReason = `Max mines: ${this.unlockSystem.getMaxMines()}`;
                    } else {
                        disableReason = 'Requires Tower Forge';
                    }
                    break;
                case 'academy':
                    if (this.unlockSystem.academyCount >= 1) {
                        disableReason = 'Only 1 academy allowed';
                    } else {
                        disableReason = 'Requires Forge level 4';
                    }
                    break;
                case 'superweapon':
                    disableReason = 'Requires Academy level 3';
                    break;
                case 'forge':
                    if (this.unlockSystem.forgeCount >= this.unlockSystem.maxForges) {
                        disableReason = 'Only 1 forge allowed';
                    }
                    break;
                default:
                    disableReason = 'Not unlocked yet';
                    break;
            }
        }
        
        return {
            ...info,
            unlocked,
            disabled,
            disableReason
        };
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
}
