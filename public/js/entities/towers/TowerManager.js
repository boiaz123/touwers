import { TowerRegistry } from './TowerRegistry.js';
import { BuildingManager } from '../buildings/BuildingManager.js';
import { UnlockSystem } from '../../core/UnlockSystem.js';

export class TowerManager {
    constructor(gameState, level) {
        this.gameState = gameState;
        this.level = level;
        this.towers = [];
        
        // Initialize unlock system and building manager
        this.unlockSystem = new UnlockSystem();
        this.buildingManager = new BuildingManager(gameState, level);
        
        // Track occupied grid positions by towers only
        this.occupiedPositions = new Set();
    }
    
    placeTower(type, x, y, gridX, gridY) {
        // Check if tower type is unlocked
        if (!this.unlockSystem.canBuildTower(type)) {
            return false;
        }
        
        const towerType = TowerRegistry.getTowerType(type);
        if (!towerType) return false;
        
        // Special handling for guard-post towers
        if (type === 'guard-post') {
            // Guard posts must be placed on the path
            const pathPoint = this.findNearestPathPoint(x, y);
            if (!pathPoint) {
                return false;
            }
            
            // Use UnlockSystem to check limit
            if (!this.unlockSystem.canBuildTower('guard-post')) {
                return false;
            }
            
            // Use path point position instead of grid-based position
            if (this.gameState.spend(towerType.cost)) {
                const GuardPost = towerType.class;
                const tower = new GuardPost(pathPoint.x, pathPoint.y, 1);
                // Set the path on the guard post so it can place defenders on actual path waypoints
                if (this.level && this.level.path) {
                    tower.setPath(this.level.path);
                }
                this.towers.push(tower);
                // Notify unlock system
                this.unlockSystem.onGuardPostBuilt();
                return true;
            }
            return false;
        }
        
        // Normal tower placement for non-guard-post towers
        // Check if the position is already occupied by another tower
        if (this.isTowerPositionOccupied(gridX, gridY)) {
            return false;
        }
        
        if (this.gameState.spend(towerType.cost)) {
            const tower = TowerRegistry.createTower(type, x, y, gridX, gridY);
            this.towers.push(tower);
            
            // Mark the 2x2 area as occupied by this tower
            this.markTowerPosition(gridX, gridY);
            
            return true;
        }
        return false;
    }
    
    /**
     * Find the nearest point on the path to given coordinates
     * Allows placement in the 2x2 border around the path (up to 60px from path center)
     */
    findNearestPathPoint(x, y) {
        if (!this.level || !this.level.path || this.level.path.length < 2) {
            return null;
        }
        
        let nearest = null;
        let minDistance = 60; // Maximum placement distance from path - allows 2x2 border placement
        
        for (let i = 0; i < this.level.path.length - 1; i++) {
            const p1 = this.level.path[i];
            const p2 = this.level.path[i + 1];
            
            // Find closest point on line segment
            const t = Math.max(0, Math.min(1, ((x - p1.x) * (p2.x - p1.x) + (y - p1.y) * (p2.y - p1.y)) / (Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))));
            const closestX = p1.x + t * (p2.x - p1.x);
            const closestY = p1.y + t * (p2.y - p1.y);
            
            const distance = Math.hypot(closestX - x, closestY - y);
            if (distance < minDistance) {
                minDistance = distance;
                // Return the clicked position, not the closest point on path
                // This allows placement in the 2x2 border around the path
                nearest = { x: x, y: y };
            }
        }
        
        return nearest;
    }
    
    placeBuilding(type, x, y, gridX, gridY) {
        // NEW: Debug log for superweapon specifically
        if (type === 'superweapon') {
        }
        
        // Check if building type is unlocked
        if (!this.unlockSystem.canBuildBuilding(type)) {
            return false;
        }
        
        const result = this.buildingManager.placeBuilding(type, x, y, gridX, gridY);
        
        // Handle building placement for unlock system
        if (result) {
            if (type === 'forge') {
                this.unlockSystem.onForgeBuilt();
            } else if (type === 'mine') {
                this.unlockSystem.onMineBuilt();
                
                // New: Set academy reference on newly built mine if academy exists and gem mining researched
                const academies = this.buildingManager.buildings.filter(building =>
                    building.constructor.name === 'MagicAcademy'
                );
                if (academies.length > 0) {
                    const newMine = this.buildingManager.buildings[this.buildingManager.buildings.length - 1];
                    newMine.setAcademy(academies[0]);
                }
            } else if (type === 'academy') {
                this.unlockSystem.onAcademyBuilt();
                
                // New: When academy is built, set it as reference on all existing mines
                this.buildingManager.buildings.forEach(building => {
                    if (building.constructor.name === 'GoldMine') {
                        const academy = this.buildingManager.buildings.find(b => b.constructor.name === 'MagicAcademy');
                        if (academy) {
                            building.setAcademy(academy);
                        }
                    }
                });
            } else if (type === 'superweapon') {
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
            
            // Apply Training Grounds range upgrades
            this.applyTrainingGroundsUpgrades(tower);
            
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
    }
    
    applyForgeUpgrades(tower) {
        // Get all forge upgrade multipliers
        const forges = this.buildingManager.buildings.filter(building => 
            building.constructor.name === 'TowerForge'
        );
        
        forges.forEach(forge => {
            const multipliers = forge.getUpgradeMultipliers();
            const towerType = tower.constructor.name;
            
            // Apply forge upgrades as additive bonuses on top of original damage
            switch (towerType) {
                case 'BasicTower':
                    if (multipliers.basicDamageBonus > 0) {
                        tower.damage = tower.originalDamage * this.buildingManager.towerUpgrades.damage + multipliers.basicDamageBonus;
                    }
                    break;
                    
                case 'BarricadeTower':
                    if (multipliers.barricadeDamageBonus > 0) {
                        tower.damage = tower.originalDamage * this.buildingManager.towerUpgrades.damage + multipliers.barricadeDamageBonus;
                    }
                    break;
                    
                case 'ArcherTower':
                    if (multipliers.fireArrowsEnabled) {
                        tower.hasFireArrows = true;
                    }
                    break;
                    
                case 'PoisonArcherTower':
                    if (multipliers.poisonDamageBonus > 0) {
                        tower.damage = tower.originalDamage * this.buildingManager.towerUpgrades.damage + multipliers.poisonDamageBonus;
                    }
                    if (multipliers.fireArrowsEnabled) {
                        tower.hasFireArrows = true;
                    }
                    break;
                    
                case 'CannonTower':
                    if (multipliers.explosiveRadiusBonus > 0) {
                        // Store original splash radius if not already stored
                        if (!tower.originalSplashRadius) {
                            tower.originalSplashRadius = tower.splashRadius;
                        }
                        tower.splashRadius = tower.originalSplashRadius + multipliers.explosiveRadiusBonus;
                    }
                    break;
            }
        });
    }
    
    applyTrainingGroundsUpgrades(tower) {
        // Get all Training Grounds buildings
        const trainingGrounds = this.buildingManager.buildings.filter(building => 
            building.constructor.name === 'TrainingGrounds'
        );
        
        const towerType = tower.constructor.name;
        let towerTypeKey = null;
        
        // Map tower constructor names to range upgrade keys
        switch (towerType) {
            case 'ArcherTower':
                towerTypeKey = 'archerTower';
                break;
            case 'BarricadeTower':
                towerTypeKey = 'barricadeTower';
                break;
            case 'BasicTower':
                towerTypeKey = 'basicTower';
                break;
            case 'PoisonArcherTower':
                towerTypeKey = 'poisonArcherTower';
                break;
            case 'CannonTower':
                towerTypeKey = 'cannonTower';
                break;
            default:
                return; // No range upgrades for this tower type
        }
        
        // Apply Training Grounds range upgrades
        trainingGrounds.forEach(grounds => {
            const upgrade = grounds.rangeUpgrades[towerTypeKey];
            if (upgrade && upgrade.level > 0) {
                // Apply range bonus: each level adds 'effect' pixels to range
                tower.range = tower.originalRange + (upgrade.level * upgrade.effect);
            }
        });
    }
    
    handleClick(x, y, canvasRect) {
        // Clear any previous selections
        this.towers.forEach(tower => tower.isSelected = false);
        this.buildingManager.buildings.forEach(building => {
            if (building.deselect) building.deselect();
        });
        
        // Calculate cellSize for grid-based click detection
        const cellSize = Math.floor(32 * Math.max(0.5, Math.min(2.5, canvasRect.width / 1920)));
        
        for (const tower of this.towers) {
            // Special handling for GuardPost (uses absolute coordinates, not grid)
            if (tower.constructor.name === 'GuardPost') {
                // Use clickBoxWidth/Height if available, otherwise fall back to width/height
                const clickBoxWidth = tower.clickBoxWidth || tower.width || 80;
                const clickBoxHeight = tower.clickBoxHeight || tower.height || 80;
                const guardPostLeft = tower.x - clickBoxWidth / 2;
                const guardPostRight = tower.x + clickBoxWidth / 2;
                const guardPostTop = tower.y - clickBoxHeight / 2;
                const guardPostBottom = tower.y + clickBoxHeight / 2;
                
                if (x >= guardPostLeft && x <= guardPostRight && y >= guardPostTop && y <= guardPostBottom) {
                    tower.isSelected = true;
                    const hireOptions = tower.getDefenderHiringOptions();
                    return {
                        type: 'guard_post_menu',
                        tower: tower,
                        options: hireOptions,
                        gameState: this.gameState
                    };
                }
            } else {
                // Grid-based click detection for regular towers
                const towerGridWidth = cellSize * 2;
                const towerGridHeight = cellSize * 2;
                const towerLeftEdge = tower.gridX * cellSize;
                const towerTopEdge = tower.gridY * cellSize;
                const towerRightEdge = towerLeftEdge + towerGridWidth;
                const towerBottomEdge = towerTopEdge + towerGridHeight;
                
                if (x >= towerLeftEdge && x <= towerRightEdge && y >= towerTopEdge && y <= towerBottomEdge) {
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
                    } else {
                        // Show stats menu for all other tower types
                        if (!this.gameState || !this.gameState.isPlacingTower) {
                            tower.isSelected = true;
                            return {
                                type: 'tower_stats',
                                tower: tower,
                                position: { x: tower.x, y: tower.y }
                            };
                        }
                    }
                    break;
                }
            }
        }
        
        // Then check building icon clicks with improved detection
        const buildingResult = this.buildingManager.handleClick(x, y, canvasRect);
        if (buildingResult) {
            if (buildingResult.type === 'forge_menu') {
                buildingResult.unlockSystem = this.unlockSystem;
                return buildingResult;
            } else if (buildingResult.type === 'academy_menu') {
                buildingResult.unlockSystem = this.unlockSystem;
                return buildingResult;
            } else if (buildingResult.type === 'superweapon_menu') {
                // New: Handle super weapon menu
                return buildingResult;
            } else if (buildingResult.type === 'training_menu') {
                return buildingResult;
            } else if (buildingResult.type === 'goldmine_menu') {
                // Handle gold mine menu
                return buildingResult;
            } else if (typeof buildingResult === 'number') {
                // Gold collection
                return buildingResult;
            }
        }
        
        // NEW: Check castle click
        if (this.level && this.level.castle) {
            if (this.level.castle.isPointInside(x, y, this.level.cellSize)) {
                // Get training grounds for defender options
                const trainingGrounds = this.buildingManager.buildings.find(b => b.constructor.name === 'TrainingGrounds');
                return this.level.castle.onClick(trainingGrounds);
            }
        }
        
        return null;
    }
    
    selectMagicTowerElement(tower, element) {
        if (tower && tower.setElement) {
            tower.setElement(element);
            return true;
        }
        return false;
    }
    
    // New: Select combination tower spell
    selectCombinationTowerSpell(tower, spellId) {
        if (tower && tower.setSpell) {
            tower.setSpell(spellId);
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
        const towerClass = TowerRegistry.getTowerClass(type);
        if (!towerClass || !towerClass.getInfo) return null;
        
        const info = towerClass.getInfo();
        // Add unlock status
        info.unlocked = this.unlockSystem.canBuildTower(type);
        return info;
    }
    
    getBuildingInfo(type) {
        const info = this.buildingManager.getBuildingInfo(type);
        if (info) {
            // Check unlock status for ALL buildings using the same logic
            info.unlocked = this.unlockSystem.canBuildBuilding(type);
            
            // ...existing code for disabled checks...
            if (type === 'forge' && this.unlockSystem.forgeCount >= this.unlockSystem.maxForges) {
                info.disabled = true;
                info.disableReason = "Only 1 forge allowed";
            } else if (type === 'mine' && this.unlockSystem.mineCount >= this.unlockSystem.getMaxMines()) {
                info.disabled = true;
                info.disableReason = `Max ${this.unlockSystem.getMaxMines()} mines allowed`;
            } else if (type === 'academy' && this.unlockSystem.academyCount >= 1) {
                info.disabled = true;
                info.disableReason = "Only 1 academy allowed";
            } else {
                info.disabled = false;
            }
        }
        return info;
    }
    
    getUnlockSystem() {
        return this.unlockSystem;
    }
    
    updatePositions(level) {
        // Update tower positions based on current grid and cellSize
        this.towers.forEach(tower => {
            const { screenX, screenY } = level.gridToScreen(tower.gridX, tower.gridY);
            tower.x = screenX;
            tower.y = screenY;
            // Also keep screenX/screenY for compatibility
            tower.screenX = screenX;
            tower.screenY = screenY;
        });
        
        // Update building positions as well
        if (this.buildingManager) {
            this.buildingManager.updatePositions(level);
        }
    }
    
    sellTower(tower) {
        const refund = Math.floor(tower.constructor.getInfo().cost * 0.7);
        this.gameState.gold += refund;
        
        // Remove from level's occupied cells
        if (this.level) {
            this.level.removeTower(tower.gridX, tower.gridY);
        }
        
        this.removeTower(tower);
    }
    
    sellBuilding(building) {
        if (!building) return false;
        
        const buildingType = building.constructor.name;
        const buildingSize = building.size || 4;
        
        // Handle the sale through building manager
        const result = this.buildingManager.sellBuilding(building);
        
        if (result) {
            // Remove from level's occupied cells
            if (this.level) {
                this.level.removeBuilding(building.gridX, building.gridY, buildingSize);
            }
            
            // Notify unlock system to decrement building counts
            // Map constructor names to building types for unlock system
            let unlocksType = null;
            if (buildingType === 'TowerForge') unlocksType = 'forge';
            else if (buildingType === 'GoldMine') unlocksType = 'mine';
            else if (buildingType === 'MagicAcademy') unlocksType = 'academy';
            else if (buildingType === 'TrainingGrounds') unlocksType = 'training';
            else if (buildingType === 'SuperWeaponLab') unlocksType = 'superweapon';
            
            if (unlocksType) {
                this.unlockSystem.onBuildingSold(unlocksType);
            }
        }
        
        return result;
    }
}
