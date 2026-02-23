import { TowerManager } from '../../entities/towers/TowerManager.js';
import { EnemyManager } from '../../entities/enemies/EnemyManager.js';
import { EnemyRegistry } from '../../entities/enemies/EnemyRegistry.js';
import { TowerRegistry } from '../../entities/towers/TowerRegistry.js';
import { BuildingRegistry } from '../../entities/buildings/BuildingRegistry.js';
import { CastleDefender } from '../../entities/defenders/CastleDefender.js';
import { LevelRegistry } from '../../entities/levels/LevelRegistry.js';
import { UIManager } from '../../ui/UIManager.js';
import { SaveSystem } from '../SaveSystem.js';
import { PerformanceMonitor } from '../PerformanceMonitor.js';
import { ResultsScreen } from './ResultsScreen.js';
import { LootManager } from '../../entities/loot/LootManager.js';

export class GameplayState {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.gameState = this.createGameState();
        this.level = null;
        this.towerManager = null;
        this.enemyManager = null;
        this.lootManager = new LootManager();
        this.uiManager = null;
        this.selectedTowerType = null;
        this.selectedBuildingType = null;
        this.currentLevel = 1;
        this.waveIndex = 0;
        this.waveInProgress = false;
        this.waveCompleted = false;
        this.superWeaponLab = null;
        
        // Wave cooldown system
        this.waveCooldownTimer = 30; // 30 seconds at start, 15 between waves
        this.waveCooldownDuration = 30; // Initial cooldown duration
        this.isInWaveCooldown = true; // Start in cooldown
        this.maxWavesForLevel = 10;
        
        // Statistics tracking for results screen
        this.enemiesDefeated = 0;
        this.totalEnemiesSpawned = 0; // Track total enemies spawned across all waves
        this.goldEarnedThisLevel = 0;
        this.startingGold = 100;
        
        // Results screen for level completion / game over
        this.resultsScreen = new ResultsScreen(stateManager);
        
        // Level completion delay (5 seconds of real time before showing results)
        this.levelCompletionDelay = 0;
        this.levelCompletionTimestampStart = undefined;
        
        // Pending damage to apply during update (for delayed damage like meteor strikes)
        this.pendingDamage = [];
        
        // Spell effects for visual rendering
        this.spellEffects = [];
        
        // Loot multiplier flags for this level
        this.applyRabbitsFoot = false; // Rabbit's Foot: doubles normal loot chance
        this.applyTalisman = false; // Strange Talisman: rare loot drops 2 items
        
        // NEW: Speed control (3 fixed speeds instead of cycling)
        this.gameSpeed = 1.0; // 1x, 2x, or 3x
        
        // NEW: Pause system
        this.isPaused = false;
        
        // Track real time for results screen (independent of game speed)
        this.lastRealTime = 0;
        
        // Track real timestamp for wave cooldown (independent of game speed)
        // This will be initialized when a level starts, not when the game boots
        this.lastRealTimestamp = 0;
        
        // Track level start time for statistics
        this.levelStartTime = 0;
        
        // Performance Monitor
        this.performanceMonitor = new PerformanceMonitor();
        this.performanceMonitor.enable(); // Enable by default to show FPS
        
        // Placement flags to prevent menu opening immediately after placement
        this.justPlacedTower = false;
        this.justPlacedBuilding = false;
        
        // Performance optimization: Cache guard posts and defenders to avoid expensive loops
        this.cachedGuardPosts = null;
        this.lastTowerCount = 0;
        this.lastGuardPostTowerCount = 0;
        this.defendersCacheNeedsUpdate = true;
        this.guardPostDefenderCache = null;
        
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

    getRealDeltaTime(adjustedDeltaTime) {
        // Reverse the game speed adjustment to get real deltaTime
        // This is used for results screen and other UI that should run in real time
        if (this.isPaused) {
            // If paused, use the adjusted time (which would be 0) 
            // but we still want results screen to update
            // So we estimate based on last adjustment
            return adjustedDeltaTime > 0 ? adjustedDeltaTime / this.gameSpeed : 0.016;
        }
        // Reverse the speed multiplier to get real time
        return adjustedDeltaTime / this.gameSpeed;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        return this.isPaused;
    }

    setPaused(paused) {
        this.isPaused = paused;
    }

    /**
     * Create a new game state with initial values
     * Consolidated from GameState.js
     */
    createGameState() {
        // CRITICAL: Always create a fresh, clean game state with default values
        const state = {
            health: 20,  // Default castle health
            gold: 100,   // Default starting gold (before upgrades)
            wave: 1,     // ALWAYS start at wave 1
            canAfford: function(cost) {
                return this.gold >= cost;
            },
            spend: function(amount) {
                if (this.canAfford(amount)) {
                    this.gold -= amount;
                    return true;
                }
                return false;
            },
            reset: function() {
                this.health = 20;
                this.gold = 100;
                this.wave = 1;
            }
        };
        return state;
    }
    
    async enter() {
        
        // Set reference to this GameplayState in stateManager so other systems can access it
        this.stateManager.gameplayState = this;
        
        // Reset pause state when entering a new level
        this.isPaused = false;
        
        // IMPORTANT: Save settlement gold before starting level (so it's not lost)
        const settlementGoldBeforeLevel = this.stateManager.playerGold || 0;
        
        // Get level info from state manager
        const levelInfo = this.stateManager.selectedLevelInfo || { id: 'level1', name: 'The King\'s Road', type: 'campaign', campaignId: 'campaign-1' };
        
        // Create the level using LevelRegistry
        // IMPORTANT: Pass campaignId to ensure correct campaign's level is loaded
        try {
            this.level = LevelRegistry.createLevel(levelInfo.id, levelInfo.campaignId);
        } catch (error) {
            console.error('GameplayState: Failed to create level:', error);
            this.level = null;
            return;
        }
        
        // Check if we're resuming from a mid-game save - NOT SUPPORTED
        // All saves are now settlement-only, levels always start fresh
        const isMidGameResume = false;
        
        
        // Always start fresh - no mid-game restoration
        // Normal level start - reset game state
        this.gameState = this.createGameState();
        this.currentLevel = levelInfo.id;
        this.currentCampaignId = levelInfo.campaignId || 'campaign-1';
        this.levelType = levelInfo.type || 'campaign';
        this.levelName = levelInfo.name || 'Unknown Level';
        
        // Apply upgrade bonuses to starting gold
        if (this.stateManager.upgradeSystem) {
            const goldBonus = this.stateManager.upgradeSystem.getStartingGoldBonus();
            this.gameState.gold += goldBonus;
        }
        
        // Store settlement gold separately (it should be restored when returning)
        this.settlementGoldBackup = settlementGoldBeforeLevel;
        
        // CRITICAL: Reset statistics tracking to ensure clean level state
        this.startingGold = this.gameState.gold;
        this.goldEarnedThisLevel = 0;
        this.enemiesDefeated = 0;
        this.totalEnemiesSpawned = 0; // Reset total enemies counter
        this.levelCompletionDelay = 0;
        this.levelCompletionTimestampStart = undefined;
        this.levelStartTime = Date.now() / 1000; // Record level start time in seconds
        
        // Configure level-specific settings
        this.isSandbox = (this.levelType === 'sandbox');
        
        if (this.isSandbox) {
            this.gameState.gold = 100000;
            this.maxWavesForLevel = Infinity;
        } else {
            // Don't set maxWavesForLevel yet - wait until level is fully initialized
            this.maxWavesForLevel = 10; // Safe default until level is loaded
        }
        
        // CRITICAL: Reset all wave state to ensure fresh level start
        this.waveInProgress = false;
        this.waveCompleted = false;
        this.waveCooldownTimer = 30.0; // Always start at 30 seconds
        this.waveCooldownDuration = 30.0; // Reset duration to 30 seconds
        this.isInWaveCooldown = true; // Always start in cooldown
        this.lastWaveCooldownTime = 0; // Track real time for wave cooldown
        this.waveIndex = 0; // Reset wave index
        this.gameState.wave = 1; // Ensure wave starts at 1
        
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
            } catch (error) {
                console.warn('GameplayState: Castle load failed, using fallback:', error);
            }
        }
        
        // Now that level is initialized, set maxWavesForLevel from level.maxWaves
        if (!this.isSandbox) {
            this.maxWavesForLevel = this.level?.maxWaves || 10;
        }
        
        // Create new enemy manager with the properly initialized path
        this.enemyManager = new EnemyManager(this.level.path);
        
        // Reset loot manager for new level
        this.lootManager = new LootManager();
        
        // Recreate tower manager to ensure it has the updated level reference
        this.towerManager = new TowerManager(this.gameState, this.level);
        this.towerManager.setStateManager(this.stateManager);
        
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
        
        // Set audio manager reference for sound effects
        this.enemyManager.audioManager = this.stateManager.audioManager;
        // Set marketplace system reference for consumable checks on enemy spawn
        this.enemyManager.marketplaceSystem = this.stateManager.marketplaceSystem;
        this.towerManager.audioManager = this.stateManager.audioManager;
        this.lootManager.audioManager = this.stateManager.audioManager;
        // Ensure all existing towers have audio manager (for loaded games)
        this.towerManager.ensureAudioManagerForAllTowers();
        
        // Apply consumable effects BEFORE UI initialization so buttons are unlocked from the start
        this.applyConsumableEffects();
        
        // Unlock buildings based on purchased upgrades
        const hasTrainingGearUpgrade = this.stateManager.upgradeSystem && this.stateManager.upgradeSystem.hasUpgrade('training-gear');
        if (hasTrainingGearUpgrade) {
            this.towerManager.unlockSystem.onTrainingGearUpgradePurchased();
        }
        
        // Initialize UI Manager
        this.uiManager = new UIManager(this);
        
        this.setupEventListeners();
        this.uiManager.setupSpellUI(); // Setup spell UI through UIManager
        this.uiManager.updateUI(); // Initial UI update through UIManager
        this.uiManager.updateUIAvailability(); // Update button visibility based on unlocks
        this.uiManager.showSpeedControls(); // Show speed controls during gameplay
        
        // CRITICAL: Ensure wave countdown container is visible for new level
        const waveCountdownContainer = document.getElementById('wave-countdown-container');
        if (waveCountdownContainer) {
            waveCountdownContainer.style.display = 'block'; // Reset display property
            waveCountdownContainer.classList.remove('visible'); // Will be added by updateWaveCooldownDisplay
        }
        
        // Play level-specific music with category-based looping
        if (this.stateManager.audioManager) {
            // Clear manual music selection flag - we're starting a level, so use campaign music
            this.stateManager.audioManager.isManualMusicSelection = false;
            // Use the stored campaign ID for music selection
            this.stateManager.audioManager.playMusicCategory(this.currentCampaignId);
        }
        
        // Wave system starts in cooldown mode - don't call startWave() here
        // The wave cooldown will trigger the first wave after 30 seconds
        
        // Reset real time tracking for wave cooldown
        this.lastRealTimestamp = performance.now() / 1000;
    }
    
    applyConsumableEffects() {
        // Initialize marketplace system for this level
        if (this.stateManager.marketplaceSystem) {
            this.stateManager.marketplaceSystem.resetForNewLevel();
        }
        
        if (!this.stateManager.marketplaceSystem) {
            console.warn('GameplayState: No marketplace system available');
            return;
        }
        
        const marketplace = this.stateManager.marketplaceSystem;
        
        // Track free placements available this level
        // These are marked available in resetForNewLevel()
        this.freeBuildingPlacements = {};
        this.freeTowerPlacements = {};
        
        // Check if forge materials are available for free placement
        if (marketplace.hasFreePlacement('forge-materials')) {
            this.freeBuildingPlacements['forge'] = true;
            // Unlock the forge building so the button appears
            this.towerManager.unlockSystem.unlockedBuildings.add('forge');
            // NOTE: Do NOT consume here - all consumables are consumed at level end via commitUsedConsumables()
        }
        
        // Check if training materials are available for free placement
        // Also need to check that player has the training-gear upgrade
        const hasTrainingGearUpgrade = this.stateManager.upgradeSystem && this.stateManager.upgradeSystem.hasUpgrade('training-gear');
        if (marketplace.hasFreePlacement('training-materials') && hasTrainingGearUpgrade) {
            this.freeBuildingPlacements['training'] = true;
            // Unlock the training grounds building so the button appears
            this.towerManager.unlockSystem.unlockedBuildings.add('training');
            // NOTE: Do NOT consume here - all consumables are consumed at level end via commitUsedConsumables()
        }
        
        // Check if magic tower flatpack is available for free placement
        if (marketplace.hasFreePlacement('magic-tower-flatpack')) {
            this.freeTowerPlacements['magic'] = true;
            // Unlock the magic tower so the button appears (just like forge and training)
            this.towerManager.unlockSystem.unlockedTowers.add('magic');
            // NOTE: Do NOT consume here - all consumables are consumed at level end via commitUsedConsumables()
        } else {
        }
        
        // Apply loot multiplier effects to enemies
        // Rabbit's Foot: doubles normal loot drop chance for this level
        if (marketplace.getConsumableCount('rabbits-foot') > 0) {
            // Mark marketplace so enemies can check when they spawn
            marketplace.rabbitFootActive = true;
            // Also apply to already-spawned enemies
            if (this.enemyManager && this.enemyManager.enemies) {
                for (const enemy of this.enemyManager.enemies) {
                    if (enemy.lootDropChance !== undefined) {
                        enemy.lootDropChance *= 2; // Double the base loot chance
                    }
                }
            }
            // Mark for post-spawn modification too
            this.applyRabbitsFoot = true;
            // NOTE: Do NOT consume here - all consumables are consumed at level end via commitUsedConsumables()
        } else {
            this.applyRabbitsFoot = false;
            marketplace.rabbitFootActive = false;
        }
        
        // Strange Talisman: drops 2 rare items instead of 1
        if (marketplace.getConsumableCount('strange-talisman') > 0) {
            this.applyTalisman = true;
            // NOTE: Do NOT consume here - all consumables are consumed at level end via commitUsedConsumables()
        } else {
            this.applyTalisman = false;
        }
    }
    
    /**
     * Check if a free placement is available WITHOUT consuming it
     * Used by UI to display free-placement styling
     */
    hasFreePlacement(type, isTower = false) {
        if (isTower && this.freeTowerPlacements && this.freeTowerPlacements[type]) {
            return true;
        }
        if (!isTower && this.freeBuildingPlacements && this.freeBuildingPlacements[type]) {
            return true;
        }
        return false;
    }
    
    checkFreePlacement(type, isTower = false) {
        // Called by TowerManager/BuildingManager to check if placement should be free
        // Consumables are already marked as used in resetForNewLevel(), so just check the flags
        if (isTower && this.freeTowerPlacements && this.freeTowerPlacements[type]) {
            this.freeTowerPlacements[type] = false; // Mark as used this placement
            
            // For magic tower: remove from unlockedTowers ONLY if academy hasn't built it
            // This makes it disappear after flatpack is used, unless academy unlocked it permanently
            if (type === 'magic' && !this.towerManager.unlockSystem.magicTowerUnlockedByAcademy) {
                this.towerManager.unlockSystem.unlockedTowers.delete('magic');
            }
            // NOTE: Consumable already marked as used in resetForNewLevel(), don't call again
            return true;
        }
        if (!isTower && this.freeBuildingPlacements && this.freeBuildingPlacements[type]) {
            this.freeBuildingPlacements[type] = false; // Mark as used this placement
            // NOTE: Consumable already marked as used in resetForNewLevel(), don't call again
            return true;
        }
        return false;
    }
    
    applyLootMultipliers(lootDrops) {
        // Apply loot multipliers from marketplace consumables
        // Rabbit's Foot: doubled normal loot chance is handled by modifying enemy.lootDropChance at wave start
        // Strange Talisman: when rare loot drops, 2 separate loot bags spawn with the same rare item
        
        const processedDrops = [];
        
        for (const lootDrop of lootDrops) {
            if (lootDrop.isRare && this.applyTalisman) {
                // Strange Talisman active: rare loot drops 2 separate bags instead of 1
                // Both bags contain the same rare item but spawn at different locations
                // They will fly in different directions due to random velocity in LootBag
                
                // First bag at slightly offset position (left side)
                processedDrops.push({ 
                    ...lootDrop, 
                    x: lootDrop.x - 15,  // Offset left
                    y: lootDrop.y - 10   // Slightly up
                });
                
                // Second bag at different offset position (right side)
                processedDrops.push({ 
                    ...lootDrop, 
                    x: lootDrop.x + 15,  // Offset right
                    y: lootDrop.y - 10   // Slightly up
                });
                
            } else {
                // Normal processing
                processedDrops.push(lootDrop);
            }
        }
        
        // NOTE: Strange Talisman is consumed in applyConsumableEffects, not here
        // NOTE: Rabbit's Foot is consumed in applyConsumableEffects after modifying enemy chances
        
        return processedDrops;
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
     * Get the audio track name for a specific level
     * Maps level IDs to their corresponding music tracks
     * Each campaign type has access only to its dedicated music folder
     */
    getAudioTrackForLevel(levelId) {
        // Define available music tracks for each campaign
        // Campaign IDs: campaign-1 (Forest), campaign-2 (Mountain), campaign-3 (Desert), campaign-4 (Space), campaign-5 (Level Testing)
        const campaignMusicMap = {
            'campaign-1': ['campaign-1-battle-1', 'campaign-1-battle-2', 'campaign-1-battle-3'],
            'campaign-2': ['campaign-2-battle-1'],
            'campaign-3': ['campaign-3-battle-1', 'campaign-3-battle-2'],
            'campaign-4': ['campaign-4-battle-1', 'campaign-4-battle-2'],
            'campaign-5': ['campaign-5-battle-1', 'campaign-5-battle-2'],
        };
        
        // Extract campaign ID from level ID (e.g., 'campaign-1-level-1' -> 'campaign-1')
        const campaignMatch = levelId.match(/^campaign-\d+/);
        const campaignId = campaignMatch ? campaignMatch[0] : 'campaign-1';
        
        // Get available tracks for this campaign
        const availableTracks = campaignMusicMap[campaignId] || campaignMusicMap['campaign-1'];
        
        // Select a random track from available options
        const randomTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];
        return randomTrack;
    }

    exit(levelCompleted = false) {
        
        // Clear reference to GameplayState
        this.stateManager.gameplayState = null;
        
        // Restore settlement gold to stateManager before leaving
        if (this.settlementGoldBackup !== undefined) {
            this.stateManager.playerGold = this.settlementGoldBackup;
        }
        
        // Commit consumables if they haven't been consumed yet
        // (completeLevel() already consumes them before saving, so check if there's anything to consume)
        if (this.stateManager.marketplaceSystem) {
            const hasConsumablesToCommit = this.stateManager.marketplaceSystem.consumablesToCommit && 
                                          this.stateManager.marketplaceSystem.consumablesToCommit.size > 0;
            
            if (hasConsumablesToCommit) {
                this.stateManager.marketplaceSystem.commitUsedConsumables();
                
                // Save the updated marketplace state (with consumed items) and statistics to the current save slot
                if (this.stateManager.currentSaveData && this.stateManager.currentSaveSlot) {
                    this.stateManager.currentSaveData.marketplace = this.stateManager.marketplaceSystem.serialize();
                    
                    // Also save statistics
                    if (this.stateManager.gameStatistics) {
                        this.stateManager.currentSaveData.statistics = this.stateManager.gameStatistics.serialize();
                    }
                    
                    SaveSystem.updateAndSaveSettlementData(this.stateManager.currentSaveSlot, this.stateManager.currentSaveData);
                }
            } else {
            }
        } else {
            console.warn('  WARNING: No marketplace system available!');
        }
        
        // Stop level music before exiting
        if (this.stateManager.audioManager) {
            this.stateManager.audioManager.stopMusic();
            // Resume settlement music when returning from a level - play a different track than last time
            this.stateManager.audioManager.playDifferentSettlementTheme();
        }
        
        // Clean up free placement flags
        this.freeBuildingPlacements = {};
        this.freeTowerPlacements = {};
        
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
        
        // Hide wave countdown container - CRITICAL: prevent it from persisting to settlement
        const waveCountdownContainer = document.getElementById('wave-countdown-container');
        if (waveCountdownContainer) {
            waveCountdownContainer.classList.remove('visible');
            // Clear inline style to let CSS default (display: none) take over
            waveCountdownContainer.style.display = '';
        }
        
        // Hide stats bar and sidebar
        const statsBar = document.getElementById('stats-bar');
        const sidebar = document.getElementById('tower-sidebar');
        if (statsBar) statsBar.style.display = 'none';
        if (sidebar) sidebar.style.display = 'none';
        
        // CRITICAL: Clear all gameplay state variables to prevent carryover to next session
        // This ensures a completely fresh state when entering a new level
        this.gameState = null;
        this.level = null;
        this.towerManager = null;
        this.enemyManager = null;
        this.lootManager = new LootManager(); // Fresh loot manager
        this.uiManager = null;
        this.selectedTowerType = null;
        this.selectedBuildingType = null;
        this.spellEffects = [];
        this.waveInProgress = false;
        this.waveCompleted = false;
        this.waveCooldownTimer = 30;
        this.isInWaveCooldown = true;
    }
    
    setupEventListeners() {
        // Remove existing listeners first to avoid duplicates
        this.removeEventListeners();
        
        // Setup UI event listeners through UIManager
        if (this.uiManager) {
            this.uiManager.setupUIEventListeners();
        }
        
        // Mouse move listener for placement preview
        this.mouseMoveHandler = (e) => this.handleMouseMove(e);
        this.stateManager.canvas.addEventListener('mousemove', this.mouseMoveHandler);
        
        // FIXED: Unified click handler that properly routes all menu types
        this.clickHandler = (e) => {
            const rect = this.stateManager.canvas.getBoundingClientRect();
            // Account for CSS scaling (same as mousemove handler)
            const scaleX = this.stateManager.canvas.width / rect.width;
            const scaleY = this.stateManager.canvas.height / rect.height;
            const canvasX = (e.clientX - rect.left) * scaleX;
            const canvasY = (e.clientY - rect.top) * scaleY;
            
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
        
        let size = 2; // Default tower size
        if (this.selectedBuildingType) {
            // Get building size from registry
            const buildingType = BuildingRegistry.getBuildingType(this.selectedBuildingType);
            size = buildingType?.size || 4;
        }
        this.level.setPlacementPreview(x, y, true, this.towerManager, size, this.selectedTowerType);
    }
    
    activateSpellTargeting(spellId) {
        this.selectedSpell = spellId;
        this.stateManager.canvas.style.cursor = 'crosshair';
        
        // Deselect all towers and buildings during spell targeting
        if (this.towerManager) {
            this.towerManager.towers.forEach(tower => tower.isSelected = false);
            this.towerManager.buildingManager.buildings.forEach(building => {
                if (building.deselect) building.deselect();
            });
        }
        
        // Add temporary click handler for spell targeting
        this.spellTargetHandler = (e) => {
            const rect = this.stateManager.canvas.getBoundingClientRect();
            const scaleX = this.stateManager.canvas.width / rect.width;
            const scaleY = this.stateManager.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            this.castSpellAtPosition(this.selectedSpell, x, y);
            // Note: cancelSpellTargeting() is called at the end of castSpellAtPosition()
        };
        
        this.stateManager.canvas.addEventListener('click', this.spellTargetHandler, { once: true });
        
        // Allow right-click to cancel
        this.spellCancelHandler = (e) => {
            e.preventDefault();
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
        
        if (!this.superWeaponLab) {
            console.error('GameplayState: No SuperWeaponLab available for spell casting!');
            return;
        }
        
        const result = this.superWeaponLab.castSpell(spellId, this.enemyManager.enemies, x, y);
        if (!result) {
            console.warn('GameplayState: Spell cast failed or on cooldown');
            return;
        }
        
        const { spell } = result;
        
        // Apply spell effects to enemies
        switch(spellId) {
            case 'arcaneBlast':
                this.stateManager.audioManager.playSFX('arcane-blast');
                this.enemyManager.enemies.forEach(enemy => {
                    const dist = Math.hypot(enemy.x - x, enemy.y - y);
                    if (dist <= spell.radius) {
                        const damage = spell.damage * (1 - dist / spell.radius * 0.5);
                        enemy.takeDamage(damage, 0, 'magic');
                    }
                });
                this.createSpellEffect('arcaneBlast', x, y, spell);
                break;
                
            case 'frostNova':
                this.stateManager.audioManager.playSFX('frost-nova');
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
                this.stateManager.audioManager.playSFX('meteor-strike');
                // Queue delayed damage for meteor to be applied during update loop
                this.pendingDamage.push({
                    time: 0.5, // Delay of 0.5 seconds
                    callback: () => {
                        // Find alive enemies in the impact area
                        this.enemyManager.enemies.forEach(enemy => {
                            if (!enemy.isDead()) {
                                const dist = Math.hypot(enemy.x - x, enemy.y - y);
                                if (dist <= 80) {
                                    enemy.takeDamage(spell.damage, 0, 'magic');
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
                this.stateManager.audioManager.playSFX('chain-lightning');
                let targets = [...this.enemyManager.enemies]
                    .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))
                    .slice(0, spell.chainCount);
                
                targets.forEach((enemy, index) => {
                    setTimeout(() => {
                        enemy.takeDamage(spell.damage * Math.pow(0.8, index), 0, 'magic');
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
                    // Mark that placement just happened - prevent menu opening on next click of same location
                    this.justPlacedTower = true;
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
                        // Mark that placement just happened - prevent menu opening on next click of same location
                        this.justPlacedTower = true;
                        return; // Exit after placement - don't open menus
                    }
                }
            }
            return; // Exit if placement check failed - don't open menus
        } else if (this.selectedBuildingType) {
            const { gridX, gridY } = this.level.screenToGrid(x, y);
            
            // Get the actual building size from registry instead of hardcoding 4
            const buildingType = BuildingRegistry.getBuildingType(this.selectedBuildingType);
            const buildingSize = buildingType ? buildingType.size : 4;
            
            if (this.level.canPlaceBuilding(gridX, gridY, buildingSize, this.towerManager)) {
                const { screenX, screenY } = this.level.gridToScreen(gridX, gridY, buildingSize);
                
                if (this.towerManager.placeBuilding(this.selectedBuildingType, screenX, screenY, gridX, gridY)) {
                    this.level.placeBuilding(gridX, gridY, buildingSize);
                    
                    // Play building placement SFX
                    if (this.stateManager.audioManager) {
                        if (this.selectedBuildingType === 'forge') {
                            this.stateManager.audioManager.playSFX('tower-forge');
                        } else if (this.selectedBuildingType === 'training') {
                            this.stateManager.audioManager.playSFX('training-ground');
                        } else if (this.selectedBuildingType === 'academy') {
                            this.stateManager.audioManager.playSFX('academy');
                        } else if (this.selectedBuildingType === 'superweapon') {
                            this.stateManager.audioManager.playSFX('superweaponlab');
                        } else if (this.selectedBuildingType === 'mine') {
                            this.stateManager.audioManager.playSFX('minegoldclick');
                        }
                    }
                    
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
                    this.uiManager.updateUIAvailability();
                    
                    this.selectedBuildingType = null;
                    document.querySelectorAll('.building-btn').forEach(b => b.classList.remove('selected'));
                    this.level.setPlacementPreview(0, 0, false);
                    // Mark that placement just happened - prevent menu opening
                    this.justPlacedBuilding = true;
                    return; // Exit after placement - don't open menus
                }
            }
            return; // Exit if placement check failed - don't open menus
        }
        
        // Skip menu opening if we just placed something
        if (this.justPlacedTower || this.justPlacedBuilding) {
            this.justPlacedTower = false;
            this.justPlacedBuilding = false;
            return;
        }
        
        // Check if player clicked on a loot bag FIRST (highest priority UI interaction)
        const clickedLoot = this.lootManager.getLootAtPosition(x, y);
        if (clickedLoot) {
            this.lootManager.collectLoot(clickedLoot);
            return; // Don't proceed to other interactions
        }
        
        // Only show menus if not in placement mode
        const clickResult = this.towerManager.handleClick(x, y, this.level.resolutionManager);
        
        
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
            } else if (clickResult.type === 'diamond_press_menu') {
                this.uiManager.showDiamondPressMenu(clickResult);
                return;
            } else if (clickResult.type === 'training_menu') {
                this.uiManager.showTrainingGroundsMenu(clickResult);
                return;
            } else if (clickResult.type === 'goldmine_menu') {
                // Only show goldmine menu if mine is NOT ready
                // If mine is ready, clicking should ONLY collect (handled elsewhere)
                if (clickResult.goldMine && clickResult.goldMine.goldReady !== true) {
                    this.uiManager.showGoldMineMenu(clickResult);
                }
                return;
            } else if (typeof clickResult === 'number') {
                // Gold collection - close any open goldmine menu
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('minegoldclick');
                }
                this.uiManager.closeAllPanels();
                this.gameState.gold += clickResult;
                this.uiManager.updateUI();
                return;
            } else if (typeof clickResult === 'object' && (clickResult.fire !== undefined || clickResult.diamond !== undefined)) {
                // Gem collection from gold mine - close any open goldmine menu
                this.uiManager.closeAllPanels();
                const academies = this.towerManager.buildingManager.buildings.filter(b => 
                    b.constructor.name === 'MagicAcademy'
                );
                if (academies.length > 0) {
                    const academy = academies[0];
                    // Add collected gems to academy
                    if (clickResult.fire) academy.gems.fire += clickResult.fire;
                    if (clickResult.water) academy.gems.water += clickResult.water;
                    if (clickResult.air) academy.gems.air += clickResult.air;
                    if (clickResult.earth) academy.gems.earth += clickResult.earth;
                    if (clickResult.diamond) academy.gems.diamond += clickResult.diamond;
                    
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
        
        // Get wave config from the level itself
        if (this.level && typeof this.level.getWaveConfig === 'function') {
            const config = this.level.getWaveConfig(wave);
            if (config && config.enemyCount && config.enemyCount > 0) {
                return {
                    enemyCount: config.enemyCount,
                    enemyHealth_multiplier: config.enemyHealth_multiplier || 1,
                    enemySpeed: config.enemySpeed || 30,
                    spawnInterval: config.spawnInterval || 1.0,
                    wavePattern: config.pattern
                };
            }
        }
        
        // Fallback: return a basic wave if level returns nothing or empty config
        console.warn('GameplayState: No valid wave config for wave', wave, '- using default');
        return {
            enemyCount: 10,
            enemyHealth_multiplier: 1,
            enemySpeed: 30,
            spawnInterval: 1.0
        };
    }
    
    startWave() {
        
        // Check if we've exceeded max waves for campaign levels
        if (!this.isSandbox && this.gameState.wave > this.maxWavesForLevel) {
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
            
            if (waveConfig && waveConfig.enemyCount > 0) {
                // Track total enemies spawned across all waves
                this.totalEnemiesSpawned += waveConfig.enemyCount;
                
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
            } else {
                console.error('startWave: Invalid wave config - no enemies to spawn. Wave:', this.gameState.wave, 'Config:', waveConfig);
            }
        }
        
        this.uiManager.updateUI();
    }
    
    skipWaveCooldown() {
        // Allow player to skip waiting and start next wave immediately
        if (this.isInWaveCooldown) {
            this.isInWaveCooldown = false;
            this.waveCooldownTimer = 0;
            this.startWave();
        }
    }
    
    completeLevel() {
        if (this.isSandbox) {
            // Sandbox mode doesn't end, just continue
            return;
        }

        // Update save data with level completion (only level progress, not mid-game state)
        if (this.stateManager.currentSaveData) {
            const saveData = this.stateManager.currentSaveData;
            
            // CRITICAL: Commit (consume) marketplace items BEFORE saving
            // This ensures consumables are removed from inventory after level completes
            if (this.stateManager.marketplaceSystem) {
                
                // Count items consumed before committing
                const consumedCount = this.stateManager.marketplaceSystem.consumablesToCommit.size;
                
                this.stateManager.marketplaceSystem.commitUsedConsumables();
                
                // Record items consumed to statistics
                if (this.stateManager.gameStatistics && consumedCount > 0) {
                    this.stateManager.gameStatistics.incrementItemsConsumed(consumedCount);
                }
            }
            
            // Record victory and playtime
            if (this.stateManager.gameStatistics) {
                this.stateManager.gameStatistics.recordVictory();
                
                // Add playtime from this level
                const levelPlaytime = (Date.now() / 1000) - this.levelStartTime;
                this.stateManager.gameStatistics.addPlaytime(levelPlaytime);
            }
            
            // CRITICAL: Update save data with current settlement state before saving
            // This ensures gold and inventory earned during level are persisted
            saveData.playerGold = this.stateManager.playerGold || 0;
            saveData.playerInventory = this.stateManager.playerInventory || [];
            
            // Also save upgrades and marketplace system state (with consumed items)
            if (this.stateManager.upgradeSystem) {
                saveData.upgrades = this.stateManager.upgradeSystem.serialize();
            }
            if (this.stateManager.marketplaceSystem) {
                saveData.marketplace = this.stateManager.marketplaceSystem.serialize();
            }
            
            // Save game statistics
            if (this.stateManager.gameStatistics) {
                saveData.statistics = this.stateManager.gameStatistics.serialize();
            }
            
            // Mark level as completed
            saveData.completedLevels = SaveSystem.markLevelCompleted(this.currentLevel, saveData.completedLevels);
            
            // Unlock next level
            saveData.unlockedLevels = SaveSystem.unlockNextLevel(this.currentLevel, saveData.unlockedLevels);
            
            // Update last played level
            saveData.lastPlayedLevel = this.currentLevel;
            
            // Clear mid-game state since level is complete
            saveData.isMidGameSave = false;
            delete saveData.midGameState;
            
            // Save to current slot if available using helper to ensure commander name is preserved
            if (this.stateManager.currentSaveSlot) {
                SaveSystem.updateAndSaveSettlementData(this.stateManager.currentSaveSlot, saveData);
            }
        }

        // Show custom results screen with statistics
        this.resultsScreen.show('levelComplete', {
            level: this.currentLevel,
            wavesCompleted: this.maxWavesForLevel,
            health: this.gameState.health,
            gold: this.gameState.gold,
            enemiesSlain: this.totalEnemiesSpawned, // Use total enemies spawned (all killed to win)
            goldEarned: this.goldEarnedThisLevel,
            currentGold: this.gameState.gold
        }, this.lootManager.getCollectedLoot(), this.lootManager);
    }
    
    update(deltaTime) {
        // Update results screen if showing (but not during delay - game continues normally)
        if (this.resultsScreen && this.resultsScreen.isShowing) {
            const realDeltaTime = this.getRealDeltaTime(deltaTime);
            this.resultsScreen.update(realDeltaTime);
            return; // Only stop game updates when screen is actually visible
        }
        
        // Keep updating ResultsScreen during delay to count down (but don't skip game updates)
        if (this.resultsScreen && this.resultsScreen.showDelay > 0) {
            const realDeltaTime = this.getRealDeltaTime(deltaTime);
            this.resultsScreen.update(realDeltaTime);
            // Continue to normal game updates below - don't return!
        }
        
        // Get the adjusted delta time for game mechanics
        const adjustedDeltaTime = this.getAdjustedDeltaTime(deltaTime);
        
        // Update wave cooldown timer with ADJUSTED time so it respects game speed
        // Wave countdown should speed up/slow down with the game speed multiplier
        if (this.isInWaveCooldown) {
            this.waveCooldownTimer -= adjustedDeltaTime;
            if (this.waveCooldownTimer <= 0) {
                this.isInWaveCooldown = false;
                this.waveCooldownTimer = 0;
                this.startWave();
            }
        }
        
        // Process pending damage (delayed spell effects)
        this.pendingDamage = this.pendingDamage.filter(damage => {
            damage.time -= adjustedDeltaTime;
            if (damage.time <= 0) {
                damage.callback();
                return false; // Remove from pending list
            }
            return true;
        });
        
        // Update castle first so it's ready for defender positioning
        if (this.level.castle) {
            this.level.castle.update(adjustedDeltaTime);
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
        let guardPostTowers = null;
        if (this.towerManager && this.towerManager.towers) {
            // OPTIMIZATION: Only rebuild guard post cache when tower count changes
            const currentTowerCount = this.towerManager.towers.length;
            if (this.lastGuardPostTowerCount !== currentTowerCount) {
                this.cachedGuardPosts = this.towerManager.towers.filter(t => t.type === 'guard-post');
                this.lastGuardPostTowerCount = currentTowerCount;
            }
            
            guardPostTowers = this.cachedGuardPosts;
            
            if (guardPostTowers && guardPostTowers.length > 0) {
                for (let i = 0; i < guardPostTowers.length; i++) {
                    const tower = guardPostTowers[i];
                    if (tower.defender && !tower.defender.isDead()) {
                        // Maintain defender position on the path
                        tower.defender.x = tower.defenderSpawnX;
                        tower.defender.y = tower.defenderSpawnY;
                    }
                }
            }
        }
        
        // OPTIMIZATION: Register path defenders only once per enemy, not every frame
        // Only do this if we don't have defenders cached, or tower count changed
        const currentTowerCount = this.towerManager?.towers?.length || 0;
        if (this.lastTowerCount !== currentTowerCount) {
            this.lastTowerCount = currentTowerCount;
            this.defendersCacheNeedsUpdate = true;
        }
        
        // ALWAYS rebuild the guard post cache - defenders can be hired/fired anytime
        // Initialize cache if needed
        if (!this.guardPostDefenderCache) {
            this.guardPostDefenderCache = [];
        }
        this.guardPostDefenderCache = [];
        
        // Build current cache of all active guard post defenders
        if (guardPostTowers && guardPostTowers.length > 0) {
            guardPostTowers.forEach(tower => {
                const defender = tower.getDefender();
                if (defender) {
                    this.guardPostDefenderCache.push({
                        defender: defender,
                        waypoint: tower.getDefenderWaypoint(),
                        tower: tower,
                        pathIndex: tower.pathIndex
                    });
                }
            });
        }
        
        // ALWAYS ensure all enemies have access to the current guard post cache
        // This is critical so newly spawned enemies get the cache immediately
        if (this.enemyManager && this.enemyManager.enemies) {
            this.enemyManager.enemies.forEach((enemy) => {
                // Ensure enemy has pathDefenders array
                if (!enemy.pathDefenders) {
                    enemy.pathDefenders = [];
                }
                
                // Always assign the current cache (even if empty) to all enemies
                enemy.guardPostCache = this.guardPostDefenderCache;
                
                // Update pathDefenders list to include all active defenders
                this.guardPostDefenderCache.forEach(cache => {
                    if (!enemy.pathDefenders.includes(cache.defender)) {
                        enemy.pathDefenders.push(cache.defender);
                    }
                });
            });
        }
        
        this.defendersCacheNeedsUpdate = false;
        
        // FIRST: Update enemy positions (enemies move to defenders)
        if (this.enemyManager) {
            this.enemyManager.update(adjustedDeltaTime);
            if (this.towerManager) this.towerManager.update(adjustedDeltaTime, this.enemyManager.enemies);
        }
        
        // SECOND: Update defenders AFTER enemies have moved to them
        // This ensures defenders see current enemy positions and can attack
        // Update castle defender
        if (this.level.castle && this.level.castle.defender && !this.level.castle.defender.isDead()) {
            const defender = this.level.castle.defender;
            defender.update(deltaTime, this.enemyManager.enemies);
        }
        
        // Update guard posts and their defenders
        if (guardPostTowers && this.enemyManager && this.enemyManager.enemies) {
            for (let i = 0; i < guardPostTowers.length; i++) {
                guardPostTowers[i].update(adjustedDeltaTime, this.enemyManager.enemies, this.gameState);
            }
        }
        
        // Update loot bags
        if (this.lootManager) {
            this.lootManager.update(adjustedDeltaTime, this.stateManager.canvas.height, this.stateManager.canvas.width);
        }
        
        // Deselect all towers and buildings during normal gameplay (no menu open)
        // This ensures the radius only shows when a tower is selected via clicking
        if (this.towerManager && !this.uiManager.activeMenuType) {
            this.towerManager.towers.forEach(tower => tower.isSelected = false);
            this.towerManager.buildingManager.buildings.forEach(building => {
                if (building.deselect) building.deselect();
            });
        }
        
        // OPTIMIZATION: Consolidate enemy updates into single loop to avoid multiple forEach passes
        let hadGoldFromEnemies = false;
        
        // Only process if enemyManager is initialized
        if (!this.enemyManager || !this.enemyManager.enemies) {
            return;
        }
        
        const enemies = this.enemyManager.enemies;
        
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            
            // Clean up dead path defenders
            if (enemy.pathDefenders && enemy.pathDefenders.length > 0) {
                // Remove dead defenders from the enemy's list
                let aliveCount = 0;
                for (let j = enemy.pathDefenders.length - 1; j >= 0; j--) {
                    if (enemy.pathDefenders[j].isDead()) {
                        enemy.pathDefenders.splice(j, 1);
                    } else {
                        aliveCount++;
                    }
                }
                
                // If all path defenders are dead, allow enemy to resume
                if (aliveCount === 0) {
                    if (enemy.isAttackingDefender) {
                        // Defender died - reset combat state
                        enemy.isAttackingDefender = false;
                        enemy.defenderTarget = null;
                        enemy.reachedEnd = false; // Resume moving
                    }
                }
            }
            
            // Update freeze timers
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
                    enemy.takeDamage(burnDamage, 0, 'fire', true);
                    enemy.burnTickTimer = 0.5; // Tick every 0.5 seconds
                }
                
                if (enemy.burnTimer <= 0) {
                    enemy.burnTimer = 0;
                }
            }
            
            // Handle damage to defenders and castle
            if (enemy.isAttackingDefender && enemy.defenderTarget) {
                enemy.attackDefender(enemy.defenderTarget, adjustedDeltaTime);
            } else if (enemy.reachedEnd) {
                // Enemy has reached end of path - check what's ahead of them
                let targetDefender = null;
                
                // PATH DEFENDER LOGIC: Find the next alive guard post defender ahead of this enemy
                if (enemy.guardPostCache && enemy.guardPostCache.length > 0 && this.level && this.level.path) {
                    // Find the closest alive guard post ahead of the enemy's current position on the path
                    let nextGuardPostDefender = null;
                    let closestDefenderDistance = Infinity;
                    
                    for (let cache of enemy.guardPostCache) {
                        if (!cache.defender.isDead() && cache.waypoint) {
                            // Calculate distance to this guard post
                            const distance = Math.hypot(
                                cache.waypoint.x - enemy.x,
                                cache.waypoint.y - enemy.y
                            );
                            
                            // Only engage with defenders ahead on the path
                            // Check if waypoint is ahead by comparing path indices or distance
                            if (distance < closestDefenderDistance && distance < 100) {
                                closestDefenderDistance = distance;
                                nextGuardPostDefender = cache.defender;
                            }
                        }
                    }
                    
                    if (nextGuardPostDefender) {
                        targetDefender = nextGuardPostDefender;
                        enemy.isAttackingDefender = true;
                        enemy.defenderTarget = targetDefender;
                        enemy.isAttackingCastle = false;
                        enemy.attackDefender(targetDefender, adjustedDeltaTime);
                        continue;
                    }
                }
                
                // CASTLE DEFENDER LOGIC: If no path defenders block, engage castle defender
                if (this.level.castle && this.level.castle.defender && !this.level.castle.defender.isDead()) {
                    targetDefender = this.level.castle.defender;
                    enemy.isAttackingDefender = true;
                    enemy.defenderTarget = targetDefender;
                    enemy.isAttackingCastle = false;
                    enemy.attackDefender(targetDefender, adjustedDeltaTime);
                } else if (this.level.castle) {
                    // No defenders available, attack castle directly
                    enemy.isAttackingCastle = true;
                    enemy.isAttackingDefender = false;
                    enemy.attackCastle(this.level.castle, adjustedDeltaTime);
                }
            }
        }
        
        // Check if castle is destroyed
        if (this.level.castle && this.level.castle.isDestroyed()) {
            // Check if Frog King's Bane boon is active
            if (this.stateManager.marketplaceSystem && this.stateManager.marketplaceSystem.hasFrogKingBane()) {
                // Activate the boon - revive castle
                this.stateManager.marketplaceSystem.useFrogKingBaneBoon();
                this.level.castle.revive();
                // Continue the game
            } else {
                // No boon - game over
                this.gameOver();
                return;
            }
        }
        
        // Remove dead enemies and handle loot drops
        const deathResult = this.enemyManager.removeDeadEnemies();
        const goldFromEnemies = deathResult.totalGold;
        const lootDrops = deathResult.lootDrops || [];
        
        // Track gold earned (enemies defeated count is tracked via totalEnemiesSpawned)
        this.goldEarnedThisLevel += goldFromEnemies;
        
        // Apply loot multipliers from consumables
        const processedLootDrops = this.applyLootMultipliers(lootDrops);
        
        // Spawn loot bags on the ground
        for (const lootDrop of processedLootDrops) {
            this.lootManager.spawnLoot(lootDrop.x, lootDrop.y, lootDrop.lootId, lootDrop.isRare || false);
        }
        
        if (goldFromEnemies > 0) {
            this.gameState.gold += goldFromEnemies;
            // Only update UI when gold changes, not every time
            this.uiManager.updateUI();
            this.uiManager.updateButtonStates();
        }
        
        // Check if wave is completed
        if (this.waveInProgress && this.enemyManager.enemies.length === 0 && !this.enemyManager.spawning) {
            this.waveInProgress = false;
            this.waveCompleted = true;
            
            // Check if this was the last wave
            if (this.gameState.wave >= this.maxWavesForLevel) {
                // Final wave completed - level is finished
                // Show results immediately - game will continue to render
                this.completeLevel();
                return; // Stop game updates but rendering continues
            } else {
                // Enter cooldown between waves (15 seconds)
                this.isInWaveCooldown = true;
                this.waveCooldownTimer = 15;
                this.waveCooldownDuration = 15;
                this.gameState.wave++;
            }
        }
        
        // Update spell UI - only updates displays, doesn't recreate every frame
        this.uiManager.updateSpellUI();
        
        // Update wave countdown display
        this.uiManager.updateWaveCooldownDisplay();
        
        // Update active menu if one is open (for real-time resource availability)
        this.uiManager.updateActiveMenuIfNeeded(adjustedDeltaTime);
        
        // Update spell effects
        this.spellEffects = this.spellEffects.filter(effect => {
            effect.life -= adjustedDeltaTime;
            if (effect.x !== undefined && effect.vx !== undefined) {
                effect.x += effect.vx * adjustedDeltaTime;
                effect.y += effect.vy * adjustedDeltaTime;
                effect.vy += 100 * adjustedDeltaTime; // gravity
            }
            return effect.life > 0;
        });
    }
    
    gameOver() {
        this.waveInProgress = false;
        
        // Record defeat and playtime
        if (this.stateManager.gameStatistics) {
            this.stateManager.gameStatistics.recordDefeat();
            
            // Add playtime from this level
            const levelPlaytime = (Date.now() / 1000) - this.levelStartTime;
            this.stateManager.gameStatistics.addPlaytime(levelPlaytime);
        }
        
        // Commit consumables when game ends
        if (this.stateManager.marketplaceSystem) {
            const consumedCount = this.stateManager.marketplaceSystem.consumablesToCommit.size;
            
            this.stateManager.marketplaceSystem.commitUsedConsumables();
            
            // Record items consumed to statistics
            if (this.stateManager.gameStatistics && consumedCount > 0) {
                this.stateManager.gameStatistics.incrementItemsConsumed(consumedCount);
            }
        }

        // CRITICAL: Save all settlement data (gold, inventory, upgrades, marketplace, AND statistics + campaign progress)
        if (this.stateManager.gameStatistics && this.stateManager.currentSaveData && this.stateManager.currentSaveSlot) {
            // Update settlement state in save data
            this.stateManager.currentSaveData.playerGold = this.stateManager.playerGold || 0;
            this.stateManager.currentSaveData.playerInventory = this.stateManager.playerInventory || [];
            
            // Save upgrades and marketplace with consumed items
            if (this.stateManager.upgradeSystem) {
                this.stateManager.currentSaveData.upgrades = this.stateManager.upgradeSystem.serialize();
            }
            if (this.stateManager.marketplaceSystem) {
                this.stateManager.currentSaveData.marketplace = this.stateManager.marketplaceSystem.serialize();
            }
            
            // Save statistics
            this.stateManager.currentSaveData.statistics = this.stateManager.gameStatistics.serialize();
            
            // Use the new helper method to save while preserving commander name and campaign progress
            SaveSystem.updateAndSaveSettlementData(this.stateManager.currentSaveSlot, this.stateManager.currentSaveData);
        }
        
        // Show custom results screen instead of alert
        this.resultsScreen.show('gameOver', {
            level: this.currentLevel,
            wave: this.gameState.wave,
            gold: this.gameState.gold,
            enemiesSlain: this.enemiesDefeated,
            goldEarned: this.goldEarnedThisLevel,
            currentGold: this.gameState.gold
        });
    }
    
    render(ctx) {
        if (!this.level || !this.towerManager || !this.enemyManager) {
            return; // Skip rendering if not fully initialized
        }
        
        // Render background terrain/level first
        this.level.render(ctx);
        
        // Collect all renderable entities (towers, buildings, enemies, loot, castle) 
        // with their Y positions for unified depth sorting
        const entities = [];
        
        // Add towers with render function
        if (this.towerManager && this.towerManager.towers) {
            this.towerManager.towers.forEach(tower => {
                entities.push({
                    y: tower.y,
                    render: () => tower.render(ctx),
                    type: 'tower'
                });
            });
        }
        
        // Add buildings with render function
        if (this.towerManager && this.towerManager.buildingManager && this.towerManager.buildingManager.buildings) {
            this.towerManager.buildingManager.buildings.forEach(building => {
                entities.push({
                    y: building.y,
                    render: () => {
                        const cellSize = building.getCellSize(ctx);
                        const buildingSize = cellSize * building.size;
                        ctx.buildingManager = this.towerManager.buildingManager;
                        building.render(ctx, buildingSize);
                        delete ctx.buildingManager;
                    },
                    type: 'building'
                });
            });
        }
        
        // Add enemies with render function
        if (this.enemyManager && this.enemyManager.enemies) {
            this.enemyManager.enemies.forEach(enemy => {
                entities.push({
                    y: enemy.y,
                    render: () => {
                        enemy.render(ctx);
                        // Render splatters from this enemy
                        if (enemy.hitSplatters && enemy.hitSplatters.length > 0) {
                            for (let j = 0; j < enemy.hitSplatters.length; j++) {
                                enemy.hitSplatters[j].render(ctx);
                            }
                        }
                    },
                    type: 'enemy'
                });
            });
        }
        
        // Add loot bags with render function
        if (this.lootManager) {
            if (this.lootManager.lootBags) {
                this.lootManager.lootBags.forEach(lootBag => {
                    entities.push({
                        y: lootBag.y,
                        render: () => lootBag.render(ctx),
                        type: 'loot'
                    });
                });
            }
        }
        
        // Add castle with render function
        if (this.level.castle) {
            entities.push({
                y: this.level.castle.y,
                render: () => this.level.castle.render(ctx),
                type: 'castle'
            });
        }
        
        // Sort all entities by Y position for proper depth ordering (bottom-to-top perspective)
        // Entities lower on screen (higher Y) are rendered last (on top)
        entities.sort((a, b) => a.y - b.y);
        
        // Render all entities in sorted order
        entities.forEach(entity => entity.render());
        
        // Render orphaned splatters from dead enemies
        if (this.enemyManager && this.enemyManager.orphanedSplatters) {
            for (let i = 0; i < this.enemyManager.orphanedSplatters.length; i++) {
                this.enemyManager.orphanedSplatters[i].render(ctx);
            }
        }
        
        // Render defender if active (after all main entities)
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
        
        // Render active boons
        this.renderActiveBoons(ctx);
        
        // Render performance monitor
        this.performanceMonitor.render(ctx, 10, 10);
        
        // Render results screen on top if showing
        if (this.resultsScreen && this.resultsScreen.isShowing) {
            this.resultsScreen.render(ctx);
        }
    }
    
    renderActiveBoons(ctx) {
        if (!this.stateManager.marketplaceSystem) return;
        
        const activeBoons = this.stateManager.marketplaceSystem.getActiveBoons();
        if (activeBoons.length === 0) return;
        
        // Render boon indicator in top-right area of screen
        const startX = ctx.canvas.width - 300;
        const startY = 20;
        
        ctx.save();
        ctx.globalAlpha = 0.95;
        
        let yPos = startY;
        for (const boonId of activeBoons) {
            const boxWidth = 270;
            const boxHeight = 45;
            let glowColor, borderColor, bgColor, textColor, icon, text;
            
            if (boonId === 'frog-king-bane') {
                glowColor = '#FF8C00';
                borderColor = '#FF8C00';
                bgColor = 'rgba(30, 15, 5, 0.95)';
                textColor = '#FFD700';
                icon = '👑';
                text = 'The spirits of the woods protect you';
            } else if (boonId === 'strange-talisman') {
                glowColor = '#9D4EDD';
                borderColor = '#9D4EDD';
                bgColor = 'rgba(15, 5, 30, 0.95)';
                textColor = '#E0AAFF';
                icon = '🔮';
                text = 'Strange Talisman active';
            } else if (boonId === 'rabbits-foot') {
                glowColor = '#FFD700';
                borderColor = '#FFD700';
                bgColor = 'rgba(30, 25, 0, 0.95)';
                textColor = '#FFED4E';
                icon = '🐾';
                text = 'Rabbit\'s Foot active';
            } else {
                continue;
            }
            
            // Animated glow effect
            const glowIntensity = 0.3 + Math.sin((this.stateManager.gameState?.timeElapsed || 0) * 2) * 0.2;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 12 + glowIntensity * 8;
            
            // Border
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(startX, yPos, boxWidth, boxHeight);
            
            // Background
            ctx.fillStyle = bgColor;
            ctx.fillRect(startX, yPos, boxWidth, boxHeight);
            
            // Icon
            ctx.font = 'bold 18px Arial';
            ctx.fillStyle = borderColor;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(icon, startX + 8, yPos + 22);
            
            // Text
            ctx.font = 'bold 11px Arial';
            ctx.fillStyle = textColor;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, startX + 35, yPos + 22);
            
            yPos += 55;
        }
        
        ctx.restore();
    }
    
    renderSpellEffects(ctx) {
        if (!this.spellEffects) {
            return;
        }
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
