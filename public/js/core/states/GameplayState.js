import { TowerManager } from '../../entities/towers/TowerManager.js';
import { EnemyManager } from '../../entities/enemies/EnemyManager.js';
import { EnemyRegistry } from '../../entities/enemies/EnemyRegistry.js';
import { TowerRegistry } from '../../entities/towers/TowerRegistry.js';
import { BuildingRegistry } from '../../entities/buildings/BuildingRegistry.js';
import { CastleDefender } from '../../entities/defenders/CastleDefender.js';
import { LevelFactory } from '../../game/LevelFactory.js';
import { GameState } from './GameState.js';
import { UIManager } from '../../ui/UIManager.js';
import { SaveSystem } from '../SaveSystem.js';
import { PerformanceMonitor } from '../PerformanceMonitor.js';
import { ResultsScreen } from './ResultsScreen.js';

export class GameplayState {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.gameState = new GameState();
        this.level = null;
        this.towerManager = null;
        this.enemyManager = null;
        this.uiManager = null;
        this.selectedTowerType = null;
        this.selectedBuildingType = null;
        this.currentLevel = 1;
        this.waveIndex = 0;
        this.waveInProgress = false;
        this.waveCompleted = false;
        this.superWeaponLab = null;
        
        // Results screen for level completion / game over
        this.resultsScreen = new ResultsScreen(stateManager);
        
        // Spell effects
        this.spellEffects = [];
        
        // Pending damage to apply during update (for delayed damage like meteor strikes)
        this.pendingDamage = [];
        
        // NEW: Speed control (3 fixed speeds instead of cycling)
        this.gameSpeed = 1.0; // 1x, 2x, or 3x
        
        // NEW: Pause system
        this.isPaused = false;
        
        // Performance Monitor
        this.performanceMonitor = new PerformanceMonitor();
        this.performanceMonitor.enable(); // Enable by default to show FPS
        
    }

    setGameSpeed(speed) {
        this.gameSpeed = speed;
        this.uiManager.setGameSpeedButtonState(speed);
    }

    getAdjustedDeltaTime(deltaTime) {
        // Return 0 delta time when paused
        if (this.isPaused) {
            return 0;
        }
        return deltaTime * this.gameSpeed;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        return this.isPaused;
    }

    setPaused(paused) {
        this.isPaused = paused;
    }
    
    async enter() {
        
        // Reset pause state when entering a new level
        this.isPaused = false;
        
        // Get level info from state manager
        const levelInfo = this.stateManager.selectedLevelInfo || { id: 'level1', name: 'The King\'s Road', type: 'campaign' };
        
        // Create the level using LevelFactory
        try {
            this.level = await LevelFactory.createLevel(levelInfo.id);
        } catch (error) {
            console.error('GameplayState: Failed to create level:', error);
            this.level = null;
            return;
        }
        
        // Check if we're resuming from a mid-game save
        const midGameState = this.stateManager.currentMidGameState;
        const isMidGameResume = midGameState !== undefined && midGameState !== null;
        
        console.log('GameplayState: Entering gameplay state');
        console.log('GameplayState: isMidGameResume =', isMidGameResume);
        console.log('GameplayState: midGameState =', midGameState);
        
        if (isMidGameResume) {
            // Restore game state from mid-game save
            this.gameState = new GameState();
            this.gameState.health = midGameState.gameState.health;
            this.gameState.gold = midGameState.gameState.gold;
            this.currentLevel = levelInfo.id;
            this.levelType = levelInfo.type || 'campaign';
            this.levelName = levelInfo.name || 'Unknown Level';
            // Get maxWaves from level, will be set after level is created
            this.maxWavesForLevel = this.level?.maxWaves || 10;
            this.waveInProgress = midGameState.gameState.waveInProgress;
            this.waveCompleted = midGameState.gameState.waveCompleted;
            // Current wave is restored through enemy spawn data
            this.isSandbox = false;
        } else {
            // Normal level start - reset game state
            this.gameState = new GameState();
            this.currentLevel = levelInfo.id;
            this.levelType = levelInfo.type || 'campaign';
            this.levelName = levelInfo.name || 'Unknown Level';
            
            // Configure level-specific settings
            this.isSandbox = (this.levelType === 'sandbox');
            
            if (this.isSandbox) {
                this.gameState.gold = 100000;
                this.maxWavesForLevel = Infinity;
            } else {
                // Get maxWaves from level, will be set after level is created
                this.maxWavesForLevel = this.level?.maxWaves || 10;
            }
            
            this.waveInProgress = false;
            this.waveCompleted = false;
        }
        
        // Ensure UI is visible
        const statsBar = document.getElementById('stats-bar');
        const sidebar = document.getElementById('tower-sidebar');
        
        if (statsBar) {
            statsBar.style.display = 'flex';
        }
        if (sidebar) {
            sidebar.style.display = 'flex';
        }
        
        // Initialize level for current canvas size first
        this.level.initializeForCanvas(this.stateManager.canvas.width, this.stateManager.canvas.height, this.stateManager.resolutionManager);
        
        // Wait for castle to be fully loaded before continuing
        if (this.level.castleLoadPromise) {
            try {
                await this.level.castleLoadPromise;
                console.log('GameplayState: Castle fully loaded');
            } catch (error) {
                console.warn('GameplayState: Castle load failed, using fallback:', error);
            }
        }
        
        // Now that level is initialized, set maxWavesForLevel from level.maxWaves
        if (!this.isSandbox) {
            this.maxWavesForLevel = this.level?.maxWaves || 10;
            console.log('GameplayState: Level has', this.maxWavesForLevel, 'waves');
        }
        
        // Create new enemy manager with the properly initialized path
        this.enemyManager = new EnemyManager(this.level.path);
        
        // Recreate tower manager to ensure it has the updated level reference
        this.towerManager = new TowerManager(this.gameState, this.level);
        
        // SANDBOX: Force gem initialization IMMEDIATELY after tower manager creation
        if (this.isSandbox) {
            this.initializeSandboxGems();
        }
        
        // Reserve castle space in the building manager to prevent placement on top
        if (this.level.castle && this.towerManager.buildingManager) {
            this.towerManager.buildingManager.reserveCastleSpace(this.level.castle);
        }
        
        // Build enhanced path with any existing guard posts (for save/load scenarios)
        const enhancedPath = this.level.buildEnhancedPathWithGuardPosts(this.towerManager.towers);
        this.enemyManager.updatePath(enhancedPath);
        
        // Initialize UI Manager
        this.uiManager = new UIManager(this);
        
        this.setupEventListeners();
        this.uiManager.setupSpellUI(); // Setup spell UI through UIManager
        this.uiManager.updateUI(); // Initial UI update through UIManager
        this.uiManager.showSpeedControls(); // Show speed controls during gameplay
        
        // Restore mid-game state if applicable
        if (isMidGameResume) {
            this.restoreMidGameState(midGameState);
        } else {
            this.startWave();
        }
        
        // Clear the mid-game state from state manager after loading
        this.stateManager.currentMidGameState = null;
    }
    
    initializeSandboxGems() {
        // Called ONLY in sandbox mode to force gem initialization
        
        // Access building manager directly
        if (!this.towerManager || !this.towerManager.buildingManager) {
            console.error('GameplayState: Tower manager or building manager not available!');
            return;
        }
        
        const buildingManager = this.towerManager.buildingManager;
        
        // Find academy
        let academy = buildingManager.buildings.find(b => b.constructor.name === 'MagicAcademy');
        
        if (academy) {
            
            // Force initialize all gem values
            if (!academy.gems) {
                academy.gems = {};
            }
            
            academy.gems.fire = 100;
            academy.gems.water = 100;
            academy.gems.air = 100;
            academy.gems.earth = 100;
            academy.gems.diamond = 100;
            
            // Unlock diamond mining
            academy.diamondMiningUnlocked = true;
            
            // Do NOT set gemMiningResearched - keep it as an available research
            academy.gemMiningResearched = false;
            
            
            // Enable gem toggle on all existing mines
            buildingManager.buildings.forEach(building => {
                if (building.constructor.name === 'GoldMine') {
                    building.setAcademy(academy);
                    building.gemMiningUnlocked = true; // Force enable toggle
                }
            });
            
        } else {
            console.error('GameplayState: Academy NOT FOUND in building manager!');
            //     buildingManager.buildings.map(b => b.constructor.name)
            // );
        }
    }

    /**
     * Restore complete game state from mid-game save
     * Reconstructs towers, enemies, and buildings to their saved state
     */
    restoreMidGameState(midGameState) {
        if (!midGameState) {
            console.error('GameplayState: No mid-game state to restore');
            this.startWave();
            return;
        }

        try {
            // Restore game state (health, gold, wave)
            if (midGameState.gameState) {
                this.gameState.health = midGameState.gameState.health || 100;
                this.gameState.gold = midGameState.gameState.gold || 0;
                this.gameState.wave = midGameState.gameState.wave || 0;
            }

            // Restore castle health and defender state
            if (midGameState.castle && this.level?.castle) {
                console.log('GameplayState: Restoring castle from save. Data:', midGameState.castle);
                const castle = this.level.castle;
                // Use explicit null/undefined check to preserve 0 health values
                castle.health = (midGameState.castle.health !== undefined && midGameState.castle.health !== null) 
                    ? midGameState.castle.health 
                    : (midGameState.castle.maxHealth || 100);
                castle.maxHealth = midGameState.castle.maxHealth || 100;
                castle.defenderDeadCooldown = midGameState.castle.defenderDeadCooldown || 0;
                castle.maxDefenderCooldown = midGameState.castle.maxDefenderCooldown || 10;
                console.log('GameplayState: Restored castle health to', castle.health);
                
                // Restore castle defender if present
                if (midGameState.castle.defender) {
                    console.log('GameplayState: Restoring castle defender from save:', midGameState.castle.defender);
                    const defData = midGameState.castle.defender;
                    const defender = new CastleDefender(defData.level);
                    defender.x = defData.x;
                    defender.y = defData.y;
                    // Use explicit null/undefined check to preserve 0 health values
                    defender.health = (defData.health !== undefined && defData.health !== null) ? defData.health : defender.maxHealth;
                    if (defData.maxHealth !== undefined) {
                        defender.maxHealth = defData.maxHealth;
                    }
                    defender.attackCooldown = defData.attackCooldown || 0;
                    defender.isAttacking = defData.isAttacking || false;
                    defender.animationTime = defData.animationTime || 0;
                    castle.defender = defender;
                    console.log('GameplayState: Restored castle defender level', defData.level, 'with health', defender.health);
                } else {
                    console.log('GameplayState: No castle defender in save data');
                    castle.defender = null;
                }
            } else {
                console.log('GameplayState: No castle save data found. midGameState.castle:', midGameState.castle, 'level.castle:', this.level?.castle);
            }

            // Restore unlock system - complete state restoration
            const unlockSystem = this.towerManager?.unlockSystem;
            if (unlockSystem) {
                // Restore building count limits and state
                if (midGameState.unlockSystem) {
                    const us = midGameState.unlockSystem;
                    unlockSystem.forgeLevel = us.forgeLevel || 0;
                    unlockSystem.hasForge = us.hasForge || false;
                    unlockSystem.forgeCount = us.forgeCount || 0;
                    unlockSystem.mineCount = us.mineCount || 0;
                    unlockSystem.academyCount = us.academyCount || 0;
                    unlockSystem.trainingGroundsCount = us.trainingGroundsCount || 0;
                    unlockSystem.superweaponCount = us.superweaponCount || 0;
                    unlockSystem.guardPostCount = us.guardPostCount || 0;
                    unlockSystem.maxGuardPosts = us.maxGuardPosts || 0;
                    unlockSystem.superweaponUnlocked = us.superweaponUnlocked || false;
                    unlockSystem.gemMiningResearched = us.gemMiningResearched || false;
                    
                    console.log('GameplayState: Restored UnlockSystem state:', {
                        forgeLevel: unlockSystem.forgeLevel,
                        forgeCount: unlockSystem.forgeCount,
                        mineCount: unlockSystem.mineCount,
                        academyCount: unlockSystem.academyCount,
                        trainingGroundsCount: unlockSystem.trainingGroundsCount,
                        superweaponCount: unlockSystem.superweaponCount,
                        guardPostCount: unlockSystem.guardPostCount,
                        superweaponUnlocked: unlockSystem.superweaponUnlocked
                    });
                }
                
                // Restore unlocked towers
                if (midGameState.unlockSystem?.unlockedTowers && Array.isArray(midGameState.unlockSystem.unlockedTowers)) {
                    midGameState.unlockSystem.unlockedTowers.forEach(tower => {
                        unlockSystem.unlockedTowers.add(tower);
                    });
                } else if (midGameState.unlockedTowers && Array.isArray(midGameState.unlockedTowers)) {
                    // Fallback for backward compatibility
                    midGameState.unlockedTowers.forEach(tower => {
                        unlockSystem.unlockedTowers.add(tower);
                    });
                }
                
                // Restore unlocked buildings
                if (midGameState.unlockSystem?.unlockedBuildings && Array.isArray(midGameState.unlockSystem.unlockedBuildings)) {
                    midGameState.unlockSystem.unlockedBuildings.forEach(building => {
                        unlockSystem.unlockedBuildings.add(building);
                    });
                } else if (midGameState.unlockedBuildings && Array.isArray(midGameState.unlockedBuildings)) {
                    // Fallback for backward compatibility
                    midGameState.unlockedBuildings.forEach(building => {
                        unlockSystem.unlockedBuildings.add(building);
                    });
                }
                
                // Restore unlocked upgrades
                if (midGameState.unlockSystem?.unlockedUpgrades && Array.isArray(midGameState.unlockSystem.unlockedUpgrades)) {
                    midGameState.unlockSystem.unlockedUpgrades.forEach(upgrade => {
                        unlockSystem.unlockedUpgrades.add(upgrade);
                    });
                }
                
                // Restore unlocked combination spells
                if (midGameState.unlockSystem?.unlockedCombinationSpells && Array.isArray(midGameState.unlockSystem.unlockedCombinationSpells)) {
                    midGameState.unlockSystem.unlockedCombinationSpells.forEach(spell => {
                        unlockSystem.unlockedCombinationSpells.add(spell);
                    });
                }
            }

            // Restore towers directly without spending gold again
            if (midGameState.towers && Array.isArray(midGameState.towers)) {
                midGameState.towers.forEach(towerData => {
                    try {
                        // If we have grid coordinates, use them; otherwise use pixel coordinates
                        let x = towerData.x;
                        let y = towerData.y;
                        let gridX = towerData.gridX;
                        let gridY = towerData.gridY;
                        
                        // If grid coordinates are missing but we have pixel coordinates, try to convert
                        if ((gridX === null || gridX === undefined) && x !== undefined && y !== undefined) {
                            const gridCoords = this.level.screenToGrid(x, y);
                            gridX = gridCoords.gridX;
                            gridY = gridCoords.gridY;
                        }
                        
                        // If we have grid coordinates but not pixel coordinates, convert
                        if ((x === null || x === undefined) && gridX !== undefined && gridY !== undefined) {
                            const screenCoords = this.level.gridToScreen(gridX, gridY, 2);
                            x = screenCoords.screenX;
                            y = screenCoords.screenY;
                        }
                        
                        // Create tower directly without spending gold
                        const tower = TowerRegistry.createTower(towerData.type, x, y, gridX, gridY);
                        if (tower) {
                            this.towerManager.towers.push(tower);
                            // Mark the position as occupied
                            this.towerManager.markTowerPosition(gridX, gridY);
                            // Restore tower level and health
                            if (towerData.level) tower.level = towerData.level;
                            if (towerData.health) tower.health = Math.min(towerData.health, tower.maxHealth || 999999);
                            if (towerData.targetingMode !== undefined) tower.targetingMode = towerData.targetingMode;
                            if (towerData.upgrades) tower.upgrades = { ...towerData.upgrades };
                            
                            // Restore GuardPost defender if present
                            if (towerData.type === 'guard-post' && towerData.defender) {
                                try {
                                    const defData = towerData.defender;
                                    const defender = new Defender(defData.level);
                                    defender.x = defData.x;
                                    defender.y = defData.y;
                                    // Use explicit null/undefined check to preserve 0 health values
                                    defender.health = (defData.health !== undefined && defData.health !== null) ? defData.health : defender.maxHealth;
                                    if (defData.maxHealth !== undefined) {
                                        defender.maxHealth = defData.maxHealth;
                                    }
                                    defender.attackCooldown = defData.attackCooldown || 0;
                                    defender.isAttacking = defData.isAttacking || false;
                                    defender.animationTime = defData.animationTime || 0;
                                    tower.defender = defender;
                                    tower.defenderDeadCooldown = towerData.defenderDeadCooldown || 0;
                                    console.log('GameplayState: Restored GuardPost defender level', defData.level, 'with health', defender.health);
                                } catch (defenderError) {
                                    console.warn('GameplayState: Failed to restore GuardPost defender:', defenderError);
                                }
                            }
                            
                            console.log('GameplayState: Restored tower:', towerData.type);
                        }
                    } catch (e) {
                        console.warn('GameplayState: Failed to restore tower:', towerData, e);
                    }
                });
            }

            // Restore buildings directly without spending gold again
            if (midGameState.buildings && Array.isArray(midGameState.buildings)) {
                const buildingManager = this.towerManager.buildingManager;
                
                midGameState.buildings.forEach(buildingData => {
                    try {
                        // Convert grid coordinates to screen coordinates
                        const screenCoords = this.level.gridToScreen(buildingData.gridX, buildingData.gridY, 4);
                        const x = screenCoords.screenX;
                        const y = screenCoords.screenY;
                        
                        // Create building directly without spending gold
                        const building = BuildingRegistry.createBuilding(
                            buildingData.type,
                            x,
                            y,
                            buildingData.gridX,
                            buildingData.gridY
                        );
                        
                        if (building) {
                            buildingManager.buildings.push(building);
                            // Mark the positions as occupied
                            const buildingType = BuildingRegistry.getBuildingType(buildingData.type);
                            if (buildingType) {
                                buildingManager.markBuildingPosition(buildingData.gridX, buildingData.gridY, buildingType.size);
                            }
                            
                            // Apply building effects
                            building.applyEffect(buildingManager);
                            
                            // Restore building level and state
                            if (buildingData.level) building.level = buildingData.level;
                            // Restore building-specific data like gems and research
                            if (buildingData.gems) building.gems = { ...buildingData.gems };
                            if (buildingData.researchProgress) building.researchProgress = { ...buildingData.researchProgress };
                            if (buildingData.incomeMultiplier !== undefined) building.incomeMultiplier = buildingData.incomeMultiplier;
                            
                            // Restore TowerForge state
                            if (buildingData.forgeLevel !== undefined) building.forgeLevel = buildingData.forgeLevel;
                            if (buildingData.upgrades) building.upgrades = JSON.parse(JSON.stringify(buildingData.upgrades));
                            
                            // Restore TrainingGrounds state
                            if (buildingData.trainingLevel !== undefined) building.trainingLevel = buildingData.trainingLevel;
                            if (buildingData.defenderUnlocked !== undefined) building.defenderUnlocked = buildingData.defenderUnlocked;
                            if (buildingData.defenderMaxLevel !== undefined) building.defenderMaxLevel = buildingData.defenderMaxLevel;
                            if (buildingData.guardPostUnlocked !== undefined) building.guardPostUnlocked = buildingData.guardPostUnlocked;
                            if (buildingData.maxGuardPosts !== undefined) building.maxGuardPosts = buildingData.maxGuardPosts;
                            if (buildingData.rangeUpgrades) building.rangeUpgrades = JSON.parse(JSON.stringify(buildingData.rangeUpgrades));
                            
                            // Restore MagicAcademy state
                            if (buildingData.manaRegenRate !== undefined) building.manaRegenRate = buildingData.manaRegenRate;
                            if (buildingData.currentMana !== undefined) building.currentMana = buildingData.currentMana;
                            if (buildingData.maxMana !== undefined) building.maxMana = buildingData.maxMana;
                            if (buildingData.academyLevel !== undefined) building.academyLevel = buildingData.academyLevel;
                            if (buildingData.elementalUpgrades) building.elementalUpgrades = JSON.parse(JSON.stringify(buildingData.elementalUpgrades));
                            if (buildingData.unlockedCombinations && Array.isArray(buildingData.unlockedCombinations)) {
                                building.unlockedCombinations = new Set(buildingData.unlockedCombinations);
                            }
                            if (buildingData.combinationSpellsUnlocked !== undefined) building.combinationSpellsUnlocked = buildingData.combinationSpellsUnlocked;
                            
                            // Restore SuperWeaponLab state
                            if (buildingData.labLevel !== undefined) building.labLevel = buildingData.labLevel;
                            if (buildingData.spells) building.spells = JSON.parse(JSON.stringify(buildingData.spells));
                            
                            // Assign restored SuperWeaponLab to this.superWeaponLab for spell casting
                            if (buildingData.type === 'superweapon') {
                                this.superWeaponLab = building;
                                console.log('GameplayState: Assigned restored SuperWeaponLab for spell casting');
                            }
                            
                            // Restore GoldMine state
                            if (buildingData.gemMiningUnlocked !== undefined) building.gemMiningUnlocked = buildingData.gemMiningUnlocked;
                            if (buildingData.diamondMiningUnlocked !== undefined) building.diamondMiningUnlocked = buildingData.diamondMiningUnlocked;
                            if (buildingData.gemMiningResearched !== undefined) building.gemMiningResearched = buildingData.gemMiningResearched;
                            // Restore mining progress
                            if (buildingData.goldReady !== undefined) building.goldReady = buildingData.goldReady;
                            if (buildingData.currentProduction !== undefined) building.currentProduction = buildingData.currentProduction;
                            if (buildingData.gemMode !== undefined) building.gemMode = buildingData.gemMode;
                            if (buildingData.currentGemType !== undefined) building.currentGemType = buildingData.currentGemType;
                            
                            if (buildingData.type === 'gold-mine') {
                                console.log('GameplayState: Restored GoldMine - goldReady:', building.goldReady, 'progress:', building.currentProduction, 'gemMode:', building.gemMode);
                            }
                            
                            console.log('GameplayState: Restored building:', buildingData.type);
                        }
                    } catch (e) {
                        console.warn('GameplayState: Failed to restore building:', buildingData, e);
                    }
                });
            }

            // Restore enemies - these are already spawned in the level
            if (midGameState.enemies && Array.isArray(midGameState.enemies)) {
                console.log('GameplayState: Restoring enemies. Total to restore:', midGameState.enemies.length);
                
                midGameState.enemies.forEach((enemyData, index) => {
                    try {
                        // Use EnemyRegistry to create enemy at correct position
                        const enemy = EnemyRegistry.createEnemy(enemyData.type, this.level.path, 1, enemyData.speed);
                        if (enemy) {
                            // Restore position and path progress
                            // Set currentPathIndex to the saved waypoint index
                            enemy.currentPathIndex = enemyData.currentPathIndex || 0;
                            // Clamp to valid range
                            enemy.currentPathIndex = Math.max(0, Math.min(enemy.currentPathIndex, this.level.path.length - 2));
                            
                            // Restore pixel position
                            enemy.x = enemyData.x || 0;
                            enemy.y = enemyData.y || 0;
                            
                            // Restore health
                            if (enemyData.health) {
                                enemy.health = Math.min(enemyData.health, enemy.maxHealth);
                            }
                            this.enemyManager.enemies.push(enemy);
                            console.log('GameplayState: Successfully restored enemy:', enemy.type, 'at waypoint', enemy.currentPathIndex);
                        } else {
                            console.warn('GameplayState: Failed to create enemy from registry with type:', enemyData.type);
                        }
                    } catch (e) {
                        console.warn('GameplayState: Failed to restore enemy:', enemyData, e);
                    }
                });
            }

            // Restore spawn queue for remaining enemies in the wave
            if (midGameState.spawnQueue && Array.isArray(midGameState.spawnQueue)) {
                console.log('GameplayState: Restoring spawn queue with', midGameState.spawnQueue.length, 'enemies to spawn');
                this.enemyManager.spawnQueue = [...midGameState.spawnQueue];
            }

            // Restore wave progression state - DO NOT start a new wave
            // The current wave is stored in gameState.wave which was already restored above
            this.waveInProgress = midGameState.gameState?.waveInProgress || false;
            this.waveCompleted = midGameState.gameState?.waveCompleted || false;
            
            // If a wave is in progress, ensure EnemyManager is NOT in continuous mode
            if (this.waveInProgress && this.enemyManager) {
                this.enemyManager.continuousMode = false;
                this.enemyManager.spawning = true;
            }
            
            console.log('GameplayState: Wave state restored - wave:', this.gameState.wave, 'inProgress:', this.waveInProgress, 'completed:', this.waveCompleted);
            
            console.log('GameplayState: Mid-game state restored successfully');
            console.log('Restored:', {
                health: this.gameState.health,
                gold: this.gameState.gold,
                towers: midGameState.towers?.length || 0,
                buildings: midGameState.buildings?.length || 0,
                enemies: midGameState.enemies?.length || 0,
                waveInProgress: this.waveInProgress
            });
            
            // Force spell UI rebuild on next update to fix event listener closures after loading
            if (this.uiManager) {
                this.uiManager.forceSpellUIRebuild = true;
                // Update UI immediately to show spell menu if spells were restored
                this.uiManager.updateSpellUI();
                this.uiManager.updateUI();
                console.log('GameplayState: Flagged spell UI for rebuild and updated immediately');
            }
        } catch (error) {
            console.error('GameplayState: Error restoring mid-game state:', error);
            // Fallback to normal wave start
            this.startWave();
            return;
        }

        // If wave is not in progress, start next wave
        // Otherwise keep game in current wave state
        if (!this.waveInProgress) {
            this.startWave();
        }
    }
    
    exit() {
        // Clean up event listeners when leaving game state
        this.removeEventListeners();
        if (this.uiManager) {
            this.uiManager.removeUIEventListeners();
            this.uiManager.hideSpeedControls(); // Hide speed controls when leaving gameplay
            this.uiManager.resetGameSpeed(); // Reset speed to 1x when leaving
        }
        
        // Hide spell buttons when exiting gameplay
        const spellButtonsContainer = document.getElementById('spell-buttons-container');
        if (spellButtonsContainer) {
            spellButtonsContainer.style.display = 'none';
        }
    }
    
    setupEventListeners() {
        // Remove existing listeners first to avoid duplicates
        this.removeEventListeners();
        
        // Setup UI event listeners through UIManager
        if (this.uiManager) {
            this.uiManager.setupUIEventListeners();
        }
        
        // Setup resolution button
        const resolutionBtn = document.getElementById('resolution-btn');
        if (resolutionBtn) {
            resolutionBtn.addEventListener('click', () => {
                if (this.stateManager && this.stateManager.game && this.stateManager.game.showResolutionSelector) {
                    this.stateManager.game.showResolutionSelector();
                }
            });
        }
        
        // Mouse move listener for placement preview
        this.mouseMoveHandler = (e) => this.handleMouseMove(e);
        this.stateManager.canvas.addEventListener('mousemove', this.mouseMoveHandler);
        
        // FIXED: Unified click handler that properly routes all menu types
        this.clickHandler = (e) => {
            const rect = this.stateManager.canvas.getBoundingClientRect();
            const canvasX = e.clientX - rect.left;
            const canvasY = e.clientY - rect.top;
            
            // All click handling is now done in handleClick method, which prioritizes placement
            this.handleClick(canvasX, canvasY);
        };
        this.stateManager.canvas.addEventListener('click', this.clickHandler);
    }
    
    removeEventListeners() {
        // Clean up event listeners properly
        document.querySelectorAll('.tower-btn, .building-btn, .spell-btn').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });
        
        if (this.mouseMoveHandler) {
            this.stateManager.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
            this.mouseMoveHandler = null;
        }
        
        if (this.clickHandler) {
            this.stateManager.canvas.removeEventListener('click', this.clickHandler);
            this.clickHandler = null;
        }
    }
    
    handleMouseMove(e) {
        if (!this.selectedTowerType && !this.selectedBuildingType) {
            this.level.setPlacementPreview(0, 0, false);
            return;
        }
        
        const rect = this.stateManager.canvas.getBoundingClientRect();
        // Account for CSS scaling
        const scaleX = this.stateManager.canvas.width / rect.width;
        const scaleY = this.stateManager.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        const size = this.selectedBuildingType ? 4 : 2;
        this.level.setPlacementPreview(x, y, true, this.towerManager, size);
    }
    
    activateSpellTargeting(spellId) {
        this.selectedSpell = spellId;
        this.stateManager.canvas.style.cursor = 'crosshair';
        console.log('GameplayState: Activated spell targeting for spell:', spellId);
        
        // Add temporary click handler for spell targeting
        this.spellTargetHandler = (e) => {
            console.log('GameplayState: Spell target clicked at:', e.clientX, e.clientY);
            const rect = this.stateManager.canvas.getBoundingClientRect();
            const scaleX = this.stateManager.canvas.width / rect.width;
            const scaleY = this.stateManager.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            console.log('GameplayState: Casting spell at position:', x, y);
            this.castSpellAtPosition(this.selectedSpell, x, y);
            // Note: cancelSpellTargeting() is called at the end of castSpellAtPosition()
        };
        
        this.stateManager.canvas.addEventListener('click', this.spellTargetHandler, { once: true });
        
        // Allow right-click to cancel
        this.spellCancelHandler = (e) => {
            e.preventDefault();
            console.log('GameplayState: Spell targeting cancelled');
            this.cancelSpellTargeting();
        };
        this.stateManager.canvas.addEventListener('contextmenu', this.spellCancelHandler, { once: true });
    }
    
    cancelSpellTargeting() {
        this.selectedSpell = null;
        this.stateManager.canvas.style.cursor = 'default';
        
        if (this.spellTargetHandler) {
            this.stateManager.canvas.removeEventListener('click', this.spellTargetHandler);
            this.spellTargetHandler = null;
        }
        if (this.spellCancelHandler) {
            this.stateManager.canvas.removeEventListener('contextmenu', this.spellCancelHandler);
            this.spellCancelHandler = null;
        }
    }
    
    castSpellAtPosition(spellId, x, y) {
        console.log('GameplayState: castSpellAtPosition called for spell:', spellId, 'at position:', x, y);
        console.log('GameplayState: this.superWeaponLab exists:', !!this.superWeaponLab);
        
        if (!this.superWeaponLab) {
            console.error('GameplayState: No SuperWeaponLab available for spell casting!');
            return;
        }
        
        const result = this.superWeaponLab.castSpell(spellId, this.enemyManager.enemies, x, y);
        console.log('GameplayState: castSpell result:', result);
        if (!result) {
            console.warn('GameplayState: Spell cast failed or on cooldown');
            return;
        }
        
        const { spell } = result;
        
        // Apply spell effects to enemies
        switch(spellId) {
            case 'arcaneBlast':
                this.enemyManager.enemies.forEach(enemy => {
                    const dist = Math.hypot(enemy.x - x, enemy.y - y);
                    if (dist <= spell.radius) {
                        const damage = spell.damage * (1 - dist / spell.radius * 0.5);
                        enemy.takeDamage(damage, false, 'arcane');
                    }
                });
                this.createSpellEffect('arcaneBlast', x, y, spell);
                break;
                
            case 'frostNova':
                this.enemyManager.enemies.forEach(enemy => {
                    const dist = Math.hypot(enemy.x - x, enemy.y - y);
                    if (dist <= spell.radius) {
                        enemy.freezeTimer = spell.freezeDuration;
                        enemy.originalSpeed = enemy.originalSpeed || enemy.speed;
                        enemy.speed = 0;
                    }
                });
                this.createSpellEffect('frostNova', x, y, spell);
                break;
                
            case 'meteorStrike':
                // Queue delayed damage for meteor to be applied during update loop
                this.pendingDamage.push({
                    time: 0.5, // Delay of 0.5 seconds
                    callback: () => {
                        // Find alive enemies in the impact area
                        this.enemyManager.enemies.forEach(enemy => {
                            if (!enemy.isDead()) {
                                const dist = Math.hypot(enemy.x - x, enemy.y - y);
                                if (dist <= 80) {
                                    enemy.takeDamage(spell.damage, false, 'fire');
                                    enemy.burnTimer = spell.burnDuration;
                                    enemy.burnDamage = spell.burnDamage;
                                }
                            }
                        });
                    }
                });
                this.createSpellEffect('meteorStrike', x, y, spell);
                break;
                
            case 'chainLightning':
                let targets = [...this.enemyManager.enemies]
                    .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))
                    .slice(0, spell.chainCount);
                
                targets.forEach((enemy, index) => {
                    setTimeout(() => {
                        enemy.takeDamage(spell.damage * Math.pow(0.8, index), false, 'electricity');
                    }, index * 100);
                });
                this.createSpellEffect('chainLightning', x, y, spell, targets);
                break;
        }
        
        this.uiManager.updateSpellUI();
        // Cancel spell targeting after successful cast to return to normal mode
        this.cancelSpellTargeting();
    }
    
    createSpellEffect(type, x, y, spell, targets) {
        // Create visual spell effects at the cast location
        
        if (type === 'arcaneBlast') {
            // Purple/blue expanding blast with particles
            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                this.spellEffects.push({
                    type: 'arcaneBlast',
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * 150,
                    vy: Math.sin(angle) * 150,
                    life: 0.6,
                    maxLife: 0.6,
                    size: 4,
                    color: '#8B5CF6'
                });
            }
            // Add expanding ring
            this.spellEffects.push({
                type: 'arcaneBlastRing',
                x: x,
                y: y,
                maxRadius: spell.radius,
                life: 0.4,
                maxLife: 0.4,
                color: '#A78BFA'
            });
        } else if (type === 'frostNova') {
            // Blue/cyan expanding particles with ice effect
            for (let i = 0; i < 20; i++) {
                const angle = (i / 20) * Math.PI * 2;
                this.spellEffects.push({
                    type: 'frostNova',
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * 120,
                    vy: Math.sin(angle) * 120,
                    life: 0.8,
                    maxLife: 0.8,
                    size: 3,
                    color: '#06B6D4'
                });
            }
            // Add frost ring
            this.spellEffects.push({
                type: 'frostNovaRing',
                x: x,
                y: y,
                maxRadius: spell.radius,
                life: 0.6,
                maxLife: 0.6,
                color: '#22D3EE'
            });
        } else if (type === 'meteorStrike') {
            // Orange/red explosion with falling particles
            for (let i = 0; i < 25; i++) {
                const angle = (i / 25) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
                const speed = 80 + Math.random() * 60;
                this.spellEffects.push({
                    type: 'meteorStrike',
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 50,
                    life: 1.0,
                    maxLife: 1.0,
                    size: 5 + Math.random() * 3,
                    color: ['#DC2626', '#EA580C', '#FB923C'][Math.floor(Math.random() * 3)]
                });
            }
            // Add impact circle
            this.spellEffects.push({
                type: 'meteorStrikeImpact',
                x: x,
                y: y,
                maxRadius: 80,
                life: 0.3,
                maxLife: 0.3,
                color: '#F97316'
            });
        } else if (type === 'chainLightning') {
            // Lightning effects between targets
            if (targets && targets.length > 0) {
                for (let i = 0; i < targets.length - 1; i++) {
                    const target1 = targets[i];
                    const target2 = targets[i + 1];
                    this.spellEffects.push({
                        type: 'chainLightningBolt',
                        x1: target1.x,
                        y1: target1.y,
                        x2: target2.x,
                        y2: target2.y,
                        life: 0.15,
                        maxLife: 0.15
                    });
                }
            }
            // Lightning particles at cast location
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                this.spellEffects.push({
                    type: 'chainLightning',
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * 100,
                    vy: Math.sin(angle) * 100,
                    life: 0.5,
                    maxLife: 0.5,
                    size: 2,
                    color: '#FBBF24'
                });
            }
        }
    }
    
    handleClick(x, y) {
        // If results screen is showing, let it handle the click
        if (this.resultsScreen && this.resultsScreen.isShowing) {
            this.resultsScreen.handleClick(x, y);
            return;
        }
        
        // Prevent any interactions when game is paused
        if (this.isPaused) {
            return;
        }
        
        // Skip all normal click handling if spell targeting is active
        // The spell target handler will take over
        if (this.selectedSpell) {
            return;
        }
        
        // Handle regular tower/building placement first, before showing any menus
        if (this.selectedTowerType) {
            // Guard posts need special handling - use raw click coordinates
            if (this.selectedTowerType === 'guard-post') {
                if (this.towerManager.placeTower(this.selectedTowerType, x, y, 0, 0)) {
                    // After placing guard post, rebuild the enemy path to include the new waypoint
                    const enhancedPath = this.level.buildEnhancedPathWithGuardPosts(this.towerManager.towers);
                    this.enemyManager.updatePath(enhancedPath);
                    
                    // Update all existing enemies to use the new path
                    this.enemyManager.enemies.forEach(enemy => {
                        enemy.path = enhancedPath;
                    });
                    
                    this.uiManager.updateUI();
                    
                    this.selectedTowerType = null;
                    document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
                    this.level.setPlacementPreview(0, 0, false);
                    return; // Exit after placement - don't open menus
                }
            } else {
                // Regular towers use grid coordinates
                const { gridX, gridY } = this.level.screenToGrid(x, y);
                
                if (this.level.canPlaceTower(gridX, gridY, this.towerManager)) {
                    const { screenX, screenY } = this.level.gridToScreen(gridX, gridY);
                    
                    if (this.towerManager.placeTower(this.selectedTowerType, screenX, screenY, gridX, gridY)) {
                        this.level.placeTower(gridX, gridY);
                        this.uiManager.updateUI();
                        
                        this.selectedTowerType = null;
                        document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
                        this.level.setPlacementPreview(0, 0, false);
                        return; // Exit after placement - don't open menus
                    }
                }
            }
            return; // Exit if placement check failed - don't open menus
        } else if (this.selectedBuildingType) {
            const { gridX, gridY } = this.level.screenToGrid(x, y);
            
            if (this.level.canPlaceBuilding(gridX, gridY, 4, this.towerManager)) {
                const { screenX, screenY } = this.level.gridToScreen(gridX, gridY, 4);
                
                if (this.towerManager.placeBuilding(this.selectedBuildingType, screenX, screenY, gridX, gridY)) {
                    this.level.placeBuilding(gridX, gridY, 4);
                    
                    // Store reference to SuperWeaponLab if it was just built
                    if (this.selectedBuildingType === 'superweapon') {
                        const newBuilding = this.towerManager.buildingManager.buildings.find(
                            b => b.constructor.name === 'SuperWeaponLab' && b.x === screenX && b.y === screenY
                        );
                        if (newBuilding) {
                            this.superWeaponLab = newBuilding;
                        }
                    }
                    
                    // SANDBOX: If academy was just built, initialize gems immediately
                    if (this.isSandbox && this.selectedBuildingType === 'academy') {
                        setTimeout(() => this.initializeSandboxGems(), 50); // Small delay to ensure building is registered
                    }
                    
                    this.uiManager.updateUI();
                    this.uiManager.updateButtonStates();
                    
                    this.selectedBuildingType = null;
                    document.querySelectorAll('.building-btn').forEach(b => b.classList.remove('selected'));
                    this.level.setPlacementPreview(0, 0, false);
                    return; // Exit after placement - don't open menus
                }
            }
            return; // Exit if placement check failed - don't open menus
        }
        
        // Only show menus if not in placement mode
        const clickResult = this.towerManager.handleClick(x, y, { 
            width: this.stateManager.canvas.width, 
            height: this.stateManager.canvas.height 
        });
        
        
        if (clickResult) {
            if (clickResult.type === 'forge_menu') {
                this.uiManager.showForgeUpgradeMenu(clickResult);
                return;
            } else if (clickResult.type === 'academy_menu') {
                this.uiManager.showAcademyUpgradeMenu(clickResult);
                return;
            } else if (clickResult.type === 'castle_menu') {
                this.uiManager.showCastleUpgradeMenu(clickResult);
                return;
            } else if (clickResult.type === 'magic_tower_menu') {
                this.uiManager.showMagicTowerElementMenu(clickResult);
                return;
            } else if (clickResult.type === 'combination_tower_menu') {
                this.uiManager.showCombinationTowerMenu(clickResult);
                return;
            } else if (clickResult.type === 'basic_tower_stats') {
                this.uiManager.showBasicTowerStatsMenu(clickResult);
                return;
            } else if (clickResult.type === 'tower_stats') {
                this.uiManager.showTowerStatsMenu(clickResult);
                return;
            } else if (clickResult.type === 'guard_post_menu') {
                this.uiManager.showGuardPostMenu(clickResult);
                return;
            } else if (clickResult.type === 'superweapon_menu') {
                this.uiManager.showSuperWeaponMenu(clickResult);
                return;
            } else if (clickResult.type === 'training_menu') {
                this.uiManager.showTrainingGroundsMenu(clickResult);
                return;
            } else if (clickResult.type === 'goldmine_menu') {
                this.uiManager.showGoldMineMenu(clickResult);
                return;
            } else if (typeof clickResult === 'number') {
                this.gameState.gold += clickResult;
                this.uiManager.updateUI();
                return;
            } else if (typeof clickResult === 'object' && (clickResult.fire !== undefined || clickResult.diamond !== undefined)) {
                // Gem collection from gold mine
                //console.log('[GameplayState] Gem collection detected:', clickResult);
                const academies = this.towerManager.buildingManager.buildings.filter(b => 
                    b.constructor.name === 'MagicAcademy'
                );
                //console.log('[GameplayState] Found academies:', academies.length);
                if (academies.length > 0) {
                    const academy = academies[0];
                    // Add collected gems to academy
                    if (clickResult.fire) academy.gems.fire += clickResult.fire;
                    if (clickResult.water) academy.gems.water += clickResult.water;
                    if (clickResult.air) academy.gems.air += clickResult.air;
                    if (clickResult.earth) academy.gems.earth += clickResult.earth;
                    if (clickResult.diamond) academy.gems.diamond += clickResult.diamond;
                    
                    //console.log('[GameplayState] Academy gems updated:', academy.gems);
                    
                    // Show gem collection popup
                    this.showGemCollectionPopup(clickResult);
                }
                this.uiManager.updateUI();
                return;
            }
        }
    }
    
    showGemCollectionPopup(gemsCollected) {
        // Create a visual popup showing the gems collected
        const gemTexts = [];
        const types = ['fire', 'water', 'air', 'earth', 'diamond'];
        const icons = { fire: '🔥', water: '💧', air: '💨', earth: '🪨', diamond: '💎' };
        
        types.forEach(type => {
            if (gemsCollected[type] > 0) {
                gemTexts.push(`${icons[type]} +${gemsCollected[type]} ${type.toUpperCase()}`);
            }
        });
        
        // Display notification (you can enhance this with better UI)
        if (gemTexts.length > 0) {
            // For now, we'll just log it - the floating text on the mine shows the collection
            //console.log('Gems collected:', gemTexts.join(', '));
        }
    }
    
    cancelSelection() {
        // Cancel tower selection
        if (this.selectedTowerType) {
            this.selectedTowerType = null;
            document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
            this.level.setPlacementPreview(0, 0, false);
        }
        
        // Cancel building selection
        if (this.selectedBuildingType) {
            this.selectedBuildingType = null;
            document.querySelectorAll('.building-btn').forEach(b => b.classList.remove('selected'));
            this.level.setPlacementPreview(0, 0, false);
        }
        
        // Close any open menus
        this.uiManager.closeAllPanels();
    }
    
    getBuildingCost(buildingType) {
        const costs = {
            'mine': 200,
            'forge': 300,
            'academy': 250,
            'superweapon': 500
        };
        return costs[buildingType] || 0;
    }
    
    getWaveConfig(level, wave) {
        if (this.levelType === 'sandbox') {
            // Sandbox mode: continuously increasing difficulty
            const baseEnemies = 8;
            const baseHealth_multiplier = 1.0;
            const baseSpeed = 40;
            
            return {
                enemyCount: baseEnemies + Math.floor(wave * 1.2),
                enemyHealth_multiplier: baseHealth_multiplier + (wave - 1) * 0.05,
                enemySpeed: Math.min(100, baseSpeed + (wave - 1) * 2),
                spawnInterval: Math.max(0.3, 1.0 - (wave - 1) * 0.03)
            };
        }
        
        // Get wave config from the level itself - MUST exist, no fallback waves
        if (this.level && typeof this.level.getWaveConfig === 'function') {
            const config = this.level.getWaveConfig(wave);
            if (config) {
                return {
                    enemyCount: config.enemyCount,
                    enemyHealth_multiplier: config.enemyHealth_multiplier,
                    enemySpeed: config.enemySpeed,
                    spawnInterval: config.spawnInterval,
                    wavePattern: config.pattern
                };
            }
        }
        
        // No fallback - if we get here, something is wrong. Level exceeded maxWaves
        console.error('GameplayState: No wave config found for wave', wave, '- level may have fewer waves than expected');
        // Return empty config that won't spawn enemies
        return {
            enemyCount: 0,
            enemyHealth_multiplier: 1,
            enemySpeed: 0,
            spawnInterval: 1.0
        };
    }
    
    startWave() {
        // For campaign levels, check if we've exceeded the level's wave count
        if (!this.isSandbox && this.gameState.wave > this.maxWavesForLevel) {
            console.log('GameplayState: Wave', this.gameState.wave, 'exceeds maxWaves', this.maxWavesForLevel);
            this.completeLevel();
            return;
        }
        
        this.waveInProgress = true;
        this.waveCompleted = false;
        
        if (this.isSandbox) {
            // Sandbox mode: continuous spawning with all enemy types
            this.enemyManager.startContinuousSpawn(0.6, ['basic', 'villager', 'beefyenemy', 'archer', 'mage', 'knight','frog']);
        } else {
            // Campaign mode: traditional wave spawning
            const waveConfig = this.getWaveConfig(this.currentLevel, this.gameState.wave);
            
            if (waveConfig.wavePattern) {
                // Use custom pattern from level
                this.enemyManager.spawnWaveWithPattern(
                    this.gameState.wave,
                    waveConfig.enemyCount,
                    waveConfig.enemyHealth_multiplier,
                    waveConfig.enemySpeed,
                    waveConfig.spawnInterval,
                    waveConfig.wavePattern
                );
            } else {
                // Use standard spawning
                this.enemyManager.spawnWave(
                    this.gameState.wave, 
                    waveConfig.enemyCount,
                    waveConfig.enemyHealth_multiplier,
                    waveConfig.enemySpeed,
                    waveConfig.spawnInterval
                );
            }
        }
        
        this.uiManager.updateUI();
    }
    
    completeLevel() {
        if (this.isSandbox) {
            // Sandbox mode doesn't end, just continue
            return;
        }

        // Update save data with level completion (only level progress, not mid-game state)
        if (this.stateManager.currentSaveData) {
            const saveData = this.stateManager.currentSaveData;
            
            // Mark level as completed
            saveData.completedLevels = SaveSystem.markLevelCompleted(this.currentLevel, saveData.completedLevels);
            
            // Unlock next level
            saveData.unlockedLevels = SaveSystem.unlockNextLevel(this.currentLevel, saveData.unlockedLevels);
            
            // Update last played level
            saveData.lastPlayedLevel = this.currentLevel;
            
            // Clear mid-game state since level is complete
            saveData.isMidGameSave = false;
            delete saveData.midGameState;
            
            // Save to current slot if available
            if (this.stateManager.currentSaveSlot) {
                SaveSystem.saveGame(this.stateManager.currentSaveSlot, saveData);
            }
        }

        // Show custom results screen with statistics
        this.resultsScreen.show('levelComplete', {
            level: this.currentLevel,
            wavesCompleted: this.maxWavesForLevel,
            health: this.gameState.health,
            gold: this.gameState.gold
        });
    }
    
    update(deltaTime) {
        // Update results screen if showing
        if (this.resultsScreen && this.resultsScreen.isShowing) {
            this.resultsScreen.update(deltaTime);
            return; // Don't update game state while results are showing
        }
        
        // Process pending damage (delayed spell effects)
        this.pendingDamage = this.pendingDamage.filter(damage => {
            damage.time -= deltaTime;
            if (damage.time <= 0) {
                damage.callback();
                return false; // Remove from pending list
            }
            return true;
        });
        
        // Update castle first so it's ready for defender positioning
        if (this.level.castle) {
            this.level.castle.update(deltaTime);
            this.level.castle.checkDefenderDeath();
        }
        
        // Update castle defender position BEFORE checking enemy engagement
        // This ensures the defender position is current when distance checks happen
        if (this.level.castle && this.level.castle.defender && !this.level.castle.defender.isDead()) {
            const defender = this.level.castle.defender;
            // Position defender in front of castle
            defender.x = this.level.castle.x - 60;
            defender.y = this.level.castle.y + 40;
        }
        
        // Update guard post defender positions BEFORE checking enemy engagement
        // This ensures they're at the correct waypoint location for distance checks
        if (this.towerManager && this.towerManager.towers) {
            this.towerManager.towers.forEach(tower => {
                if (tower.type === 'guard-post' && tower.defender && !tower.defender.isDead()) {
                    // Maintain defender position on the path
                    tower.defender.x = tower.defenderSpawnX;
                    tower.defender.y = tower.defenderSpawnY;
                }
            });
        }
        
        // FIRST: Register path defenders and waypoints on enemies
        // This allows enemies to know where to stop and engage path defenders
        if (this.enemyManager && this.enemyManager.enemies && this.towerManager) {
            this.enemyManager.enemies.forEach((enemy) => {
                // Register guard post defenders and their waypoints
                if (this.towerManager.towers) {
                    for (let tower of this.towerManager.towers) {
                        if (tower.type === 'guard-post') {
                            const defender = tower.getDefender();
                            if (defender) {
                                // Add defender to the enemy's list of available path defenders
                                if (!enemy.pathDefenders) {
                                    enemy.pathDefenders = [];
                                }
                                if (!enemy.pathDefenders.find(d => d === defender)) {
                                    enemy.pathDefenders.push(defender);
                                }
                                
                                // Register the exact waypoint where this defender is stationed
                                // Enemies will use this to know where to stop and engage
                                const waypoint = tower.getDefenderWaypoint();
                                if (waypoint && !enemy.defenderWaypoint) {
                                    enemy.defenderWaypoint = waypoint;
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // UPDATE DEFENDERS FIRST
        // Update castle defender
        if (this.level.castle && this.level.castle.defender && !this.level.castle.defender.isDead()) {
            const defender = this.level.castle.defender;
            defender.update(deltaTime, this.enemyManager.enemies);
        }
        
        // Update guard posts and their defenders
        if (this.towerManager && this.towerManager.towers) {
            this.towerManager.towers.forEach(tower => {
                if (tower.type === 'guard-post') {
                    tower.update(deltaTime, this.enemyManager.enemies, this.gameState);
                }
            });
        }
        
        // THEN update enemy positions
        if (this.enemyManager) {
            this.enemyManager.update(deltaTime);
            if (this.towerManager) this.towerManager.update(deltaTime, this.enemyManager.enemies);
        }
        
        
        // Clean up dead path defenders
        // When all defenders at a waypoint are dead, enemies can resume moving
        this.enemyManager.enemies.forEach(enemy => {
            if (enemy.pathDefenders && enemy.pathDefenders.length > 0) {
                // Remove dead defenders from the enemy's list
                enemy.pathDefenders = enemy.pathDefenders.filter(d => !d.isDead());
                
                // If all path defenders are dead, allow enemy to resume
                if (enemy.pathDefenders.length === 0) {
                    if (enemy.isAttackingDefender) {
                        // Defender died - reset combat state
                        enemy.isAttackingDefender = false;
                        enemy.defenderTarget = null;
                        enemy.reachedEnd = false; // Resume moving
                    }
                    // Clear the waypoint reference
                    enemy.defenderWaypoint = null;
                }
            }
        });
        
        // Update freeze timers and handle combat
        this.enemyManager.enemies.forEach(enemy => {
            if (enemy.freezeTimer > 0) {
                enemy.freezeTimer -= deltaTime;
                if (enemy.freezeTimer <= 0 && enemy.originalSpeed) {
                    enemy.speed = enemy.originalSpeed;
                }
            }
            
            // Handle burn damage over time
            if (enemy.burnTimer > 0) {
                enemy.burnTimer -= deltaTime;
                enemy.burnTickTimer = (enemy.burnTickTimer || 0) - deltaTime;
                
                if (enemy.burnTickTimer <= 0) {
                    const burnDamage = enemy.burnDamage || 2;
                    enemy.takeDamage(burnDamage, false, 'fire', true); // true = follow target
                    enemy.burnTickTimer = 0.5; // Tick every 0.5 seconds
                }
                
                if (enemy.burnTimer <= 0) {
                    enemy.burnTimer = 0;
                }
            }
            
            // Handle damage to defenders and castle
            if (enemy.isAttackingDefender && enemy.defenderTarget) {
                enemy.attackDefender(enemy.defenderTarget, deltaTime);
            } else if (enemy.reachedEnd) {
                // Enemy has reached end of path - either at a path defender waypoint or castle
                let targetDefender = null;
                
                // PATH DEFENDER LOGIC: If there's a defenderWaypoint, engage path defenders there
                if (enemy.defenderWaypoint && enemy.pathDefenders && enemy.pathDefenders.length > 0) {
                    // Find first alive path defender in the list
                    for (let defender of enemy.pathDefenders) {
                        if (!defender.isDead()) {
                            targetDefender = defender;
                            break;
                        }
                    }
                    
                    if (targetDefender) {
                        // Engage with path defender at waypoint
                        enemy.isAttackingDefender = true;
                        enemy.defenderTarget = targetDefender;
                        enemy.isAttackingCastle = false;
                        enemy.attackDefender(targetDefender, deltaTime);
                        return;
                    }
                }
                
                // CASTLE DEFENDER LOGIC: If no path defender, engage castle defender if available
                if (this.level.castle && this.level.castle.defender && !this.level.castle.defender.isDead()) {
                    targetDefender = this.level.castle.defender;
                    enemy.isAttackingDefender = true;
                    enemy.defenderTarget = targetDefender;
                    enemy.isAttackingCastle = false;
                    enemy.attackDefender(targetDefender, deltaTime);
                } else if (this.level.castle) {
                    // No defenders available, attack castle directly
                    enemy.isAttackingCastle = true;
                    enemy.isAttackingDefender = false;
                    enemy.attackCastle(this.level.castle, deltaTime);
                }
            }
        });
        
        // Check if castle is destroyed
        if (this.level.castle && this.level.castle.isDestroyed()) {
            this.gameOver();
            return;
        }
        
        const goldFromEnemies = this.enemyManager.removeDeadEnemies();
        if (goldFromEnemies > 0) {
            this.gameState.gold += goldFromEnemies;
            this.uiManager.updateUI();
            this.uiManager.updateButtonStates();
        }
        
        // Check if wave is completed
        if (this.waveInProgress && this.enemyManager.enemies.length === 0 && !this.enemyManager.spawning) {
            this.waveInProgress = false;
            this.waveCompleted = true;
            
            
            setTimeout(() => {
                this.gameState.wave++;
                this.startWave();
            }, 2000);
        }
        
        // Update spell UI - only updates displays, doesn't recreate every frame
        this.uiManager.updateSpellUI();
        
        // Update active menu if one is open (for real-time resource availability)
        this.uiManager.updateActiveMenuIfNeeded(deltaTime);
        
        // Update spell effects
        this.spellEffects = this.spellEffects.filter(effect => {
            effect.life -= deltaTime;
            if (effect.x !== undefined && effect.vx !== undefined) {
                effect.x += effect.vx * deltaTime;
                effect.y += effect.vy * deltaTime;
                effect.vy += 100 * deltaTime; // gravity
            }
            return effect.life > 0;
        });
    }
    
    gameOver() {
        this.waveInProgress = false;
        
        // Show custom results screen instead of alert
        this.resultsScreen.show('gameOver', {
            level: this.currentLevel,
            wave: this.gameState.wave,
            gold: this.gameState.gold
        });
    }
    
    render(ctx) {
        if (!this.level || !this.towerManager || !this.enemyManager) {
            return; // Skip rendering if not fully initialized
        }
        this.level.render(ctx);
        this.towerManager.render(ctx);
        this.enemyManager.render(ctx);
        
        // Render castle on top of buildings/towers to ensure it appears in front
        // This prevents buildings placed "behind" the castle from appearing on top of it
        if (this.level.castle) {
            this.level.castle.render(ctx);
        }
        
        // Render defender if active
        if (this.level.castle && this.level.castle.defender && !this.level.castle.defender.isDead()) {
            this.level.castle.defender.render(ctx);
        }
        
        // Render guard post defenders
        if (this.towerManager && this.towerManager.towers) {
            this.towerManager.towers.forEach(tower => {
                if (tower.type === 'guard-post' && tower.defender && !tower.defender.isDead()) {
                    tower.defender.render(ctx);
                }
            });
        }
        
        this.renderSpellEffects(ctx);
        
        // Render performance monitor
        this.performanceMonitor.render(ctx, 10, 10);
        
        // Render results screen on top if showing
        if (this.resultsScreen && this.resultsScreen.isShowing) {
            this.resultsScreen.render(ctx);
        }
    }
    
    renderSpellEffects(ctx) {
        this.spellEffects.forEach(effect => {
            const alpha = effect.life / effect.maxLife;
            ctx.globalAlpha = alpha;
            
            if (effect.type === 'arcaneBlast') {
                // Purple particle
                ctx.fillStyle = effect.color;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Glow effect
                ctx.strokeStyle = effect.color;
                ctx.lineWidth = 1;
                ctx.globalAlpha = alpha * 0.5;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.size + 2, 0, Math.PI * 2);
                ctx.stroke();
            } else if (effect.type === 'arcaneBlastRing') {
                // Expanding ring
                const progress = 1 - (effect.life / effect.maxLife);
                const radius = effect.maxRadius * progress;
                ctx.strokeStyle = effect.color;
                ctx.lineWidth = 2;
                ctx.globalAlpha = alpha * (1 - progress);
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
                ctx.stroke();
            } else if (effect.type === 'frostNova') {
                // Cyan particle
                ctx.fillStyle = effect.color;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Add crystalline effect
                ctx.strokeStyle = effect.color;
                ctx.lineWidth = 1;
                ctx.globalAlpha = alpha * 0.7;
                for (let i = 0; i < 4; i++) {
                    const angle = (i / 4) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.moveTo(effect.x, effect.y);
                    ctx.lineTo(
                        effect.x + Math.cos(angle) * effect.size * 2,
                        effect.y + Math.sin(angle) * effect.size * 2
                    );
                    ctx.stroke();
                }
            } else if (effect.type === 'frostNovaRing') {
                // Expanding ice ring
                const progress = 1 - (effect.life / effect.maxLife);
                const radius = effect.maxRadius * progress;
                ctx.strokeStyle = effect.color;
                ctx.lineWidth = 3;
                ctx.globalAlpha = alpha * (1 - progress);
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
                ctx.stroke();
            } else if (effect.type === 'meteorStrike') {
                // Orange/red particle with rotation
                ctx.fillStyle = effect.color;
                ctx.save();
                ctx.translate(effect.x, effect.y);
                ctx.rotate(Date.now() / 100);
                ctx.fillRect(-effect.size / 2, -effect.size / 2, effect.size, effect.size);
                ctx.restore();
                
                // Glow
                ctx.fillStyle = effect.color;
                ctx.globalAlpha = alpha * 0.3;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.size * 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (effect.type === 'meteorStrikeImpact') {
                // Impact circle with rings
                const progress = 1 - (effect.life / effect.maxLife);
                const radius = effect.maxRadius * progress;
                
                ctx.strokeStyle = effect.color;
                ctx.lineWidth = 3;
                ctx.globalAlpha = alpha * (1 - progress);
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
                ctx.stroke();
                
                // Inner ring
                ctx.lineWidth = 1;
                ctx.globalAlpha = alpha * 0.5 * (1 - progress);
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, radius * 0.6, 0, Math.PI * 2);
                ctx.stroke();
            } else if (effect.type === 'chainLightning') {
                // Yellow lightning particle
                ctx.fillStyle = effect.color;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Star effect
                ctx.strokeStyle = effect.color;
                ctx.lineWidth = 1;
                ctx.globalAlpha = alpha * 0.6;
                for (let i = 0; i < 4; i++) {
                    const angle = (i / 4) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.moveTo(effect.x, effect.y);
                    ctx.lineTo(
                        effect.x + Math.cos(angle) * effect.size * 3,
                        effect.y + Math.sin(angle) * effect.size * 3
                    );
                    ctx.stroke();
                }
            } else if (effect.type === 'chainLightningBolt') {
                // Lightning bolt between two targets
                ctx.strokeStyle = '#FBBF24';
                ctx.lineWidth = 3;
                
                // Main bolt
                ctx.beginPath();
                ctx.moveTo(effect.x1, effect.y1);
                ctx.lineTo(effect.x2, effect.y2);
                ctx.stroke();
                
                // Inner bright bolt
                ctx.strokeStyle = '#FCDC5C';
                ctx.lineWidth = 1;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.moveTo(effect.x1, effect.y1);
                ctx.lineTo(effect.x2, effect.y2);
                ctx.stroke();
            }
            
            ctx.globalAlpha = 1;
        });
    }
    
    resize() {
        this.level.initializeForCanvas(this.stateManager.canvas.width, this.stateManager.canvas.height, this.stateManager.resolutionManager);
        this.towerManager.updatePositions(this.level);
    }
}
