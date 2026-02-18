import { TowerRegistry } from './TowerRegistry.js';
import { BuildingManager } from '../buildings/BuildingManager.js';
import { UnlockSystem } from '../../core/UnlockSystem.js';

export class TowerManager {
    constructor(gameState, level) {
        this.gameState = gameState;
        this.level = level;
        this.towers = [];
        this.audioManager = null; // Will be set by GameplayState
        
        // Initialize unlock system and building manager
        this.unlockSystem = new UnlockSystem();
        this.buildingManager = new BuildingManager(gameState, level);
        
        // Track occupied grid positions by towers only
        this.occupiedPositions = new Set();
        
        // Performance optimization: Cache building references
        this.cachedForges = null;
        this.cachedAcademies = null;
        this.cachedTrainingGrounds = null;
        this.cachedLabs = null;
        this.lastBuildingCount = 0;
    }
    
    setStateManager(stateManager) {
        this.stateManager = stateManager;
        this.buildingManager.stateManager = stateManager;
    }
    
    placeTower(type, x, y, gridX, gridY) {
        // Special exception: Allow Magic Tower from consumable flatpack even without academy unlock
        const isFreeFromMarketplace = this.stateManager?.gameplayState?.hasFreePlacement(type, true) || false;
        
        // Check if tower type is unlocked (or has free placement exception)
        if (!isFreeFromMarketplace && !this.unlockSystem.canBuildTower(type)) {
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
            // Check if this is a free placement from marketplace
            const isFree = this.stateManager?.gameplayState?.checkFreePlacement(type, true) || false;
            if (isFree || this.gameState.spend(towerType.cost)) {
                const GuardPost = towerType.class;
                const tower = new GuardPost(pathPoint.x, pathPoint.y, 1);
                
                // Assign audio manager to tower for sound effects
                if (this.audioManager) {
                    tower.audioManager = this.audioManager;
                }
                
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
        
        // Check if this is a free placement from marketplace
        const isFree = this.stateManager?.gameplayState?.checkFreePlacement(type, true) || false;
        if (isFree || this.gameState.spend(towerType.cost)) {
            const tower = TowerRegistry.createTower(type, x, y, gridX, gridY);
            
            // Assign audio manager to tower for sound effects
            if (this.audioManager) {
                tower.audioManager = this.audioManager;
            }
            
            this.towers.push(tower);
            
            // Mark the 2x2 area as occupied by this tower
            this.markTowerPosition(gridX, gridY);
            
            // Play tower build sound
            this.playTowerBuildSound(type);
            
            return true;
        }
        return false;
    }
    
    /**
     * Play the build sound for a specific tower type
     */
    playTowerBuildSound(type) {
        if (!this.audioManager) {
            console.warn('TowerManager: audioManager not available for build sound');
            return;
        }
        
        const soundMap = {
            'basic': 'basic-tower',
            'barricade': 'barricade-tower',
            'archer': 'arrow',
            'magic': 'magic-tower',
            'combination': 'combination-tower',
            'poison': 'poison-tower',
            'cannon': 'trebuchet-launch'
        };
        
        const soundName = soundMap[type];
        if (soundName) {
            this.audioManager.playSFX(soundName);
        }
    }
    
    /**
     * Play sound when a tower is selected (clicked)
     */
    playTowerSelectSound(tower) {
        if (!this.audioManager) return;
        
        const soundMap = {
            'BasicTower': 'basic-tower',
            'BarricadeTower': 'barricade-tower',
            'ArcherTower': 'arrow',
            'MagicTower': 'magic-tower',
            'CombinationTower': 'combination-tower',
            'PoisonArcherTower': 'poison-tower',
            'CannonTower': 'trebuchet-launch'
        };
        
        const soundName = soundMap[tower.constructor.name];
        if (soundName) {
            this.audioManager.playSFX(soundName);
        } else {
            console.warn(`TowerManager: No sound mapped for tower type ${tower.constructor.name}`);
        }
    }
    
    /**
     * Find the nearest point on the path to given coordinates
     * For guard posts, positions them half on/half off the path at the edge
     * Returns null if too far from path (>60px)
     */
    findNearestPathPoint(x, y) {
        if (!this.level || !this.level.path || this.level.path.length < 2) {
            return null;
        }
        
        let nearest = null;
        let minDistance = 60; // Maximum placement distance from path
        let closestSegment = null;
        let closestSegmentIndex = -1;
        let closestT = 0;
        let closestOnPath = null;
        
        for (let i = 0; i < this.level.path.length - 1; i++) {
            const p1 = this.level.path[i];
            const p2 = this.level.path[i + 1];
            
            // Find closest point on line segment
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const lengthSquared = dx * dx + dy * dy;
            
            if (lengthSquared === 0) {
                continue;
            }
            
            let t = ((x - p1.x) * dx + (y - p1.y) * dy) / lengthSquared;
            t = Math.max(0, Math.min(1, t));
            
            const closestX = p1.x + t * dx;
            const closestY = p1.y + t * dy;
            
            const distance = Math.hypot(closestX - x, closestY - y);
            if (distance < minDistance) {
                minDistance = distance;
                closestOnPath = { x: closestX, y: closestY };
                closestSegment = { p1, p2 };
                closestSegmentIndex = i;
                closestT = t;
            }
        }
        
        // Also check the last waypoint
        const lastWaypoint = this.level.path[this.level.path.length - 1];
        const distanceToLast = Math.hypot(lastWaypoint.x - x, lastWaypoint.y - y);
        if (distanceToLast < minDistance) {
            minDistance = distanceToLast;
            closestOnPath = { x: lastWaypoint.x, y: lastWaypoint.y };
            closestSegment = null; // No segment for endpoint
            closestSegmentIndex = this.level.path.length - 1;
        }
        
        if (!closestOnPath || minDistance > 60) {
            return null;
        }
        
        // Position the guard post half on/half off the path
        // Calculate the perpendicular offset from the path
        if (closestSegment) {
            const dx = closestSegment.p2.x - closestSegment.p1.x;
            const dy = closestSegment.p2.y - closestSegment.p1.y;
            const length = Math.hypot(dx, dy);
            
            // Get perpendicular direction (rotated 90 degrees)
            const perpX = -dy / length;
            const perpY = dx / length;
            
            // Determine which side to offset based on click position
            const toClickX = x - closestOnPath.x;
            const toClickY = y - closestOnPath.y;
            const sideIndicator = perpX * toClickX + perpY * toClickY;
            
            const offsetDistance = 25; // Half the guard post width
            const finalX = closestOnPath.x + (sideIndicator > 0 ? offsetDistance : -offsetDistance) * perpX;
            const finalY = closestOnPath.y + (sideIndicator > 0 ? offsetDistance : -offsetDistance) * perpY;
            
            nearest = { x: finalX, y: finalY };
        } else {
            // For endpoints, offset in the direction of the click
            const toClickX = x - closestOnPath.x;
            const toClickY = y - closestOnPath.y;
            const clickDistance = Math.hypot(toClickX, toClickY);
            
            if (clickDistance > 0) {
                const offsetDistance = 25;
                const finalX = closestOnPath.x + (toClickX / clickDistance) * offsetDistance;
                const finalY = closestOnPath.y + (toClickY / clickDistance) * offsetDistance;
                nearest = { x: finalX, y: finalY };
            } else {
                nearest = closestOnPath;
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
            } else if (type === 'training') {
                this.unlockSystem.onTrainingGroundsBuilt();
            } else if (type === 'superweapon') {
                this.unlockSystem.onSuperweaponLabBuilt();
                
                // Set academy reference on newly built super weapon lab
                const academy = this.buildingManager.buildings.find(building =>
                    building.constructor.name === 'MagicAcademy'
                );
                if (academy) {
                    const newLab = this.buildingManager.buildings[this.buildingManager.buildings.length - 1];
                    if (newLab && newLab.constructor.name === 'SuperWeaponLab') {
                        newLab.setAcademy(academy);
                        newLab.unlockSystem = this.unlockSystem; // Set unlock system reference
                        newLab.upgradeSystem = this.stateManager?.upgradeSystem; // Set upgrade system reference
                    }
                }
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
        // OPTIMIZATION: Cache building references instead of filtering every frame
        if (!this.cachedForges || !this.cachedAcademies || !this.cachedTrainingGrounds) {
            this.cachedForges = this.buildingManager.buildings.filter(building => 
                building.constructor.name === 'TowerForge'
            );
            this.cachedAcademies = this.buildingManager.buildings.filter(building =>
                building.constructor.name === 'MagicAcademy'
            );
            this.cachedTrainingGrounds = this.buildingManager.buildings.filter(building => 
                building.constructor.name === 'TrainingGrounds'
            );
            this.cachedLabs = this.buildingManager.buildings.filter(building =>
                building.constructor.name === 'SuperWeaponLab'
            );
        }
        
        // Check if building count changed (indicates new buildings may have been added)
        const currentBuildingCount = this.buildingManager.buildings.length;
        if (this.lastBuildingCount !== currentBuildingCount) {
            this.lastBuildingCount = currentBuildingCount;
            // Rebuild cache on next update
            this.cachedForges = null;
            this.cachedAcademies = null;
            this.cachedTrainingGrounds = null;
            this.cachedLabs = null;
            return; // Skip update this frame to rebuild cache next frame
        }
        
        let upgradesChanged = false;
        for (let i = 0; i < this.cachedForges.length; i++) {
            const forge = this.cachedForges[i];
            if (forge.upgradesChanged) {
                upgradesChanged = true;
                forge.upgradesChanged = false; // Reset flag
            }
        }
        
        // If upgrades changed, recalculate all tower stats
        if (upgradesChanged) {
            this.recalculateAllTowerStats();
        }
        
        // Apply building upgrades to towers
        const upgrades = this.buildingManager.towerUpgrades;
        
        for (let i = 0; i < this.towers.length; i++) {
            const tower = this.towers[i];
            
            // Store original values if not already stored
            if (!tower.originalDamage) {
                tower.originalDamage = tower.damage;
                tower.originalRange = tower.range;
                tower.originalFireRate = tower.fireRate;
            }
            
            // Store barricade-specific original values if not already stored
            if (tower.constructor.name === 'BarricadeTower') {
                if (!tower.originalSlowDuration && tower.hasOwnProperty('slowDuration')) {
                    tower.originalSlowDuration = tower.slowDuration;
                    tower.originalMaxEnemiesSlowed = tower.maxEnemiesSlowed;
                }
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
            
            // Get poison damage bonus for Poison Archer Towers
            let poisonBonus = 0;
            if (tower.constructor.name === 'PoisonArcherTower' && this.cachedForges.length > 0) {
                const multipliers = this.cachedForges[0].getUpgradeMultipliers();
                poisonBonus = multipliers.poisonDamageBonus || 0;
            }
            
            tower.update(deltaTime, enemies, poisonBonus);
        }
        
        // Update building manager
        this.buildingManager.update(deltaTime);
    }
    
    applyAcademyUpgrades(tower) {
        if (tower.constructor.name === 'MagicTower') {
            // Use cached academies
            if (this.cachedAcademies && this.cachedAcademies.length > 0) {
                const elementalBonuses = this.cachedAcademies[0].getElementalBonuses();
                tower.applyElementalBonuses(elementalBonuses);
            }
        }
        
        // New: Apply combination spell bonuses to Combination Towers
        if (tower.constructor.name === 'CombinationTower') {
            if (this.cachedAcademies && this.cachedAcademies.length > 0) {
                const academy = this.cachedAcademies[0];
                
                // Get combination spells from SuperWeaponLab if it exists, otherwise from academy (legacy)
                let combinationSpells = [];
                if (this.cachedLabs && this.cachedLabs.length > 0) {
                    const lab = this.cachedLabs[0];
                    tower.superweaponLab = lab; // Store reference for accessing spell power
                    combinationSpells = lab.combinationSpells || [];
                } else {
                    // Fallback to academy if lab doesn't exist
                    combinationSpells = academy.combinationSpells || [];
                }
                
                // Set available spells
                tower.setAvailableSpells(combinationSpells);
                
                // Build combination spell bonuses from upgrade levels
                const comboSpellBonuses = {
                    steam: { damageBonus: 0, slowBonus: 0 },
                    magma: { damageBonus: 0, piercingBonus: 0 },
                    tempest: { chainRange: 0, slowBonus: 0 },
                    meteor: { chainRange: 0, piercingBonus: 0 }
                };
                
                // Apply bonuses based on combination spell upgrade levels
                for (let i = 0; i < combinationSpells.length; i++) {
                    const spell = combinationSpells[i];
                    if (spell.upgradeLevel > 0) {
                        const upgradeBonus = spell.upgradeLevel; // Each upgrade level = +1 bonus
                        
                        switch(spell.id) {
                            case 'steam':
                                comboSpellBonuses.steam.damageBonus += upgradeBonus * 5;
                                comboSpellBonuses.steam.slowBonus += upgradeBonus * 0.05;
                                break;
                            case 'magma':
                                comboSpellBonuses.magma.damageBonus += upgradeBonus * 5;
                                comboSpellBonuses.magma.piercingBonus += upgradeBonus * 1;
                                break;
                            case 'tempest':
                                comboSpellBonuses.tempest.chainRange += upgradeBonus * 15;
                                comboSpellBonuses.tempest.slowBonus += upgradeBonus * 0.05;
                                break;
                            case 'meteor':
                                comboSpellBonuses.meteor.chainRange += upgradeBonus * 15;
                                comboSpellBonuses.meteor.piercingBonus += upgradeBonus * 1;
                                break;
                        }
                    }
                }
                
                // Also apply elemental upgrades from academy
                const elementalBonuses = academy.getElementalBonuses();
                
                // Merge both bonuses together
                const mergedBonuses = {
                    steam: { 
                        damageBonus: (comboSpellBonuses.steam.damageBonus || 0) + (elementalBonuses.steam?.damageBonus || 0),
                        slowBonus: (comboSpellBonuses.steam.slowBonus || 0) + (elementalBonuses.steam?.slowBonus || 0)
                    },
                    magma: { 
                        damageBonus: (comboSpellBonuses.magma.damageBonus || 0) + (elementalBonuses.magma?.damageBonus || 0),
                        piercingBonus: (comboSpellBonuses.magma.piercingBonus || 0) + (elementalBonuses.magma?.piercingBonus || 0)
                    },
                    tempest: { 
                        chainRange: (comboSpellBonuses.tempest.chainRange || 0) + (elementalBonuses.tempest?.chainRange || 0),
                        slowBonus: (comboSpellBonuses.tempest.slowBonus || 0) + (elementalBonuses.tempest?.slowBonus || 0)
                    },
                    meteor: { 
                        chainRange: (comboSpellBonuses.meteor.chainRange || 0) + (elementalBonuses.meteor?.chainRange || 0),
                        piercingBonus: (comboSpellBonuses.meteor.piercingBonus || 0) + (elementalBonuses.meteor?.piercingBonus || 0)
                    }
                };
                
                tower.applySpellBonuses(mergedBonuses);
            }
        }
    }
    
    // New: Get gem stocks for UI display
    getGemStocks() {
        // Use cached academies if available
        if (this.cachedAcademies && this.cachedAcademies.length > 0) {
            return this.cachedAcademies[0].gems;
        }
        
        // Fallback if no cache
        const academies = this.buildingManager.buildings.filter(building =>
            building.constructor.name === 'MagicAcademy'
        );
        
        if (academies.length > 0) {
            return academies[0].gems;
        }
        
        return { fire: 0, water: 0, air: 0, earth: 0, diamond: 0 };
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
            
            // Reset barricade-specific stats
            if (tower.constructor.name === 'BarricadeTower') {
                if (tower.originalSlowDuration) {
                    tower.slowDuration = tower.originalSlowDuration;
                }
                if (tower.originalMaxEnemiesSlowed) {
                    tower.maxEnemiesSlowed = tower.originalMaxEnemiesSlowed;
                }
            }
        });
    }
    
    applyForgeUpgrades(tower) {
        // Use cached forge references
        if (!this.cachedForges || this.cachedForges.length === 0) return;
        
        const multipliers = this.cachedForges[0].getUpgradeMultipliers();
        const towerType = tower.constructor.name;
        
        // Apply forge upgrades as additive bonuses on top of original damage
        switch (towerType) {
            case 'BasicTower':
                if (multipliers.basicDamageBonus > 0) {
                    tower.damage = tower.originalDamage * this.buildingManager.towerUpgrades.damage + multipliers.basicDamageBonus;
                }
                break;
                
            case 'BarricadeTower':
                // Apply capacity upgrades using original base value
                if (multipliers.barricadeCapacityBonus > 0) {
                    tower.maxEnemiesSlowed = tower.originalMaxEnemiesSlowed + multipliers.barricadeCapacityBonus;
                }
                // Apply duration upgrades using original base value
                if (multipliers.barricadeDurationBonus > 0) {
                    tower.slowDuration = tower.originalSlowDuration + multipliers.barricadeDurationBonus;
                }
                break;
                
            case 'ArcherTower':
                if (multipliers.archerDamageBonus > 0) {
                    tower.damage = tower.originalDamage * this.buildingManager.towerUpgrades.damage + multipliers.archerDamageBonus;
                }
                // Apply armor piercing upgrade if present
                if (multipliers.archerArmorPierceBonus > 0) {
                    tower.armorPiercingPercent = multipliers.archerArmorPierceBonus;
                }
                break;
                
            case 'PoisonArcherTower':
                if (multipliers.poisonDamageBonus > 0) {
                    tower.damage = tower.originalDamage * this.buildingManager.towerUpgrades.damage + multipliers.poisonDamageBonus;
                }
                break;
                
            case 'CannonTower':
                if (multipliers.cannonDamageBonus > 0) {
                    tower.damage = tower.originalDamage * this.buildingManager.towerUpgrades.damage + multipliers.cannonDamageBonus;
                }
                if (multipliers.cannonRadiusBonus > 0) {
                    tower.splashRadius = (tower.originalSplashRadius || 35) + multipliers.cannonRadiusBonus;
                }
                break;
        }
    }
    
    applyTrainingGroundsUpgrades(tower) {
        // Use cached Training Grounds buildings
        if (!this.cachedTrainingGrounds || this.cachedTrainingGrounds.length === 0) return;
        
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
                return; // No upgrades for this tower type
        }
        
        // Apply Training Grounds range upgrades
        for (let i = 0; i < this.cachedTrainingGrounds.length; i++) {
            const grounds = this.cachedTrainingGrounds[i];
            const upgrade = grounds.rangeUpgrades[towerTypeKey];
            if (upgrade && upgrade.level > 0) {
                // Apply range bonus: each level adds 'effect' pixels to range
                tower.range = tower.originalRange + (upgrade.level * upgrade.effect);
            }
            
            // Apply Barricade Tower fire rate upgrade if present
            if (towerType === 'BarricadeTower' && grounds.upgrades.barricadeFireRate && grounds.upgrades.barricadeFireRate.level > 0) {
                tower.fireRate = tower.originalFireRate + (grounds.upgrades.barricadeFireRate.level * grounds.upgrades.barricadeFireRate.effect);
            }
            
            // Apply Poison Archer Tower fire rate upgrade if present
            if (towerType === 'PoisonArcherTower' && grounds.upgrades.poisonArcherTowerFireRate && grounds.upgrades.poisonArcherTowerFireRate.level > 0) {
                tower.fireRate = tower.originalFireRate + (grounds.upgrades.poisonArcherTowerFireRate.level * grounds.upgrades.poisonArcherTowerFireRate.effect);
            }
        }
    }
    
    handleClick(x, y, resolutionManager) {
        // Clear any previous selections
        this.towers.forEach(tower => tower.isSelected = false);
        this.buildingManager.buildings.forEach(building => {
            if (building.deselect) building.deselect();
        });
        
        // Get cell size from ResolutionManager for accurate click detection
        const cellSize = resolutionManager && resolutionManager.cellSize ? resolutionManager.cellSize : 32;
        
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
                    this.playTowerSelectSound(tower);
                    // Get training grounds to pass defender max level info
                    const trainingGrounds = this.buildingManager.buildings.find(b => b.constructor.name === 'TrainingGrounds');
                    const hireOptions = tower.getDefenderHiringOptions(trainingGrounds);
                    return {
                        type: 'guard_post_menu',
                        tower: tower,
                        options: hireOptions,
                        gameState: this.gameState,
                        trainingGrounds: trainingGrounds
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
                
                if (x >= towerLeftEdge && x < towerRightEdge && y >= towerTopEdge && y < towerBottomEdge) {
                    if (tower.constructor.name === 'MagicTower') {
                        tower.isSelected = true;
                        this.playTowerSelectSound(tower);
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
                        this.playTowerSelectSound(tower);
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
                            this.playTowerSelectSound(tower);
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
        const buildingResult = this.buildingManager.handleClick(x, y, resolutionManager);
        if (buildingResult) {
            if (buildingResult.type === 'forge_menu') {
                buildingResult.unlockSystem = this.unlockSystem;
                // Add castle reference for reinforce_wall upgrade
                if (this.level && this.level.castle) {
                    buildingResult.castle = this.level.castle;
                }
                return buildingResult;
            } else if (buildingResult.type === 'academy_menu') {
                buildingResult.unlockSystem = this.unlockSystem;
                return buildingResult;
            } else if (buildingResult.type === 'superweapon_menu') {
                // New: Handle super weapon menu
                return buildingResult;
            } else if (buildingResult.type === 'training_menu') {
                return buildingResult;
            } else if (buildingResult.type === 'diamond_press_menu') {
                // Handle diamond press menu
                return buildingResult;
            } else if (buildingResult.type === 'goldmine_menu') {
                // Handle gold mine menu
                return buildingResult;
            } else if (typeof buildingResult === 'number') {
                // Gold collection
                return buildingResult;
            } else if (typeof buildingResult === 'object' && (buildingResult.fire !== undefined || buildingResult.diamond !== undefined)) {
                // Gem collection from gold mine
                return buildingResult;
            }
        }
        
        // NEW: Check castle click
        if (this.level && this.level.castle) {
            if (this.level.castle.isPointInside(x, y, this.level.cellSize)) {
                // Get training grounds for defender options
                const trainingGrounds = this.buildingManager.buildings.find(b => b.constructor.name === 'TrainingGrounds');
                const castleMenuData = this.level.castle.onClick(trainingGrounds);
                
                // Add forge level for UI reference
                const forge = this.buildingManager.buildings.find(b => b.constructor.name === 'TowerForge');
                if (forge) {
                    castleMenuData.forgeLevel = forge.getForgeLevel();
                }
                
                return castleMenuData;
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
    
    /**
     * Ensure all towers have a reference to the audio manager
     * Called by GameplayState when setting audioManager
     */
    ensureAudioManagerForAllTowers() {
        if (!this.audioManager) return;
        
        this.towers.forEach(tower => {
            if (!tower.audioManager) {
                tower.audioManager = this.audioManager;
            }
        });
    }
    
    getTowerInfo(type) {
        const towerClass = TowerRegistry.getTowerClass(type);
        if (!towerClass || !towerClass.getInfo) return null;
        
        const info = towerClass.getInfo();
        // Add unlock status
        info.unlocked = this.unlockSystem.canBuildTower(type);
        
        // For Barricade Tower, add upgrade information
        if (type === 'barricade' && this.cachedForges && this.cachedForges.length > 0) {
            const forgeMultipliers = this.cachedForges[0].getUpgradeMultipliers();
            const maxEnemies = 4 + forgeMultipliers.barricadeCapacityBonus;
            const duration = 4.0 + forgeMultipliers.barricadeDurationBonus;
            
            // Get fire rate from TrainingGrounds if available
            let fireRate = 0.2;
            if (this.cachedTrainingGrounds && this.cachedTrainingGrounds.length > 0) {
                const trainingUpgrade = this.cachedTrainingGrounds[0].upgrades.barricadeFireRate;
                if (trainingUpgrade) {
                    fireRate = 0.2 + (trainingUpgrade.level * trainingUpgrade.effect);
                }
            }
            
            // Update the display info with upgraded stats
            info.fireRate = fireRate.toFixed(1);
            info.upgradeInfo = `📊 With upgrades: Slows ${Math.round(maxEnemies)} enemies for ${duration.toFixed(1)}s at ${fireRate.toFixed(1)}/sec`;
        }
        
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
        
        // Notify unlock system if selling a guard post
        if (tower.type === 'guard-post') {
            this.unlockSystem.onGuardPostSold();
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
