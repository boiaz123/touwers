import { TowerManager } from '../../entities/towers/TowerManager.js';
import { EnemyManager } from '../../entities/enemies/EnemyManager.js';
import { EnemyRegistry } from '../../entities/enemies/EnemyRegistry.js';
import { TowerRegistry } from '../../entities/towers/TowerRegistry.js';
import { BuildingRegistry } from '../../entities/buildings/BuildingRegistry.js';
import { CastleDefender } from '../../entities/defenders/CastleDefender.js';
import { LevelRegistry } from '../../entities/levels/LevelRegistry.js';
import { UIManager } from '../../ui/UIManager.js';
import { SaveSystem } from '../SaveSystem.js';
import { AchievementSystem } from '../AchievementSystem.js';

import { ResultsScreen } from './ResultsScreen.js';
import { LootManager } from '../../entities/loot/LootManager.js';
import { CampaignRegistry } from '../../game/CampaignRegistry.js';
import { BackgroundRenderAdapter } from '../render/adapters/BackgroundRenderAdapter.js';
import { TowerRenderAdapter } from '../render/adapters/TowerRenderAdapter.js';
import { BuildingRenderAdapter } from '../render/adapters/BuildingRenderAdapter.js';
import { EnemyRenderAdapter } from '../render/adapters/EnemyRenderAdapter.js';
import { SpellEffectRenderAdapter } from '../render/adapters/SpellEffectRenderAdapter.js';
import { DefenderRenderAdapter } from '../render/adapters/DefenderRenderAdapter.js';
import { TerrainRenderAdapter } from '../render/adapters/TerrainRenderAdapter.js';
import { PixiTextureCache } from '../render/PixiTextureCache.js';
import { ObjectPool } from '../ObjectPool.js';
import { PerformanceMonitor } from '../PerformanceMonitor.js';
import { Container } from 'pixi.js';

const INITIAL_WAVE_COOLDOWN = 30;
const BETWEEN_WAVE_COOLDOWN = 15;
const ENEMY_CLICK_RADIUS = 28;

// Sandbox mode: endless discrete waves cycling this fixed enemy roster (same mix the old
// continuous-spawn stream used), gradually scaled up in health each wave rather than enemy
// count - see startWave()'s isSandbox branch.
const SANDBOX_ENEMY_PATTERN = ['basic', 'villager', 'beefyenemy', 'archer', 'mage', 'knight', 'frog'];
const SANDBOX_WAVE_ENEMY_COUNT = 20;
const SANDBOX_SPAWN_INTERVAL = 0.6;
const SANDBOX_HEALTH_GROWTH_PER_WAVE = 0.08; // +8% enemy health per wave, compounding

export class GameplayState {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.gameState = this.createGameState();
        this.level = null;
        this.towerManager = null;
        this.enemyManager = null;
        this.lootManager = new LootManager();
        this.performanceMonitor = new PerformanceMonitor();

        // Dev-only performance stress-test harness (see setupEventListeners /
        // _devStressSpawn below). Inert unless the page was loaded with ?stresstest
        // in the URL, so it can never be triggered by a player in a normal build.
        this._stressTestEnabled = new URLSearchParams(window.location.search).has('stresstest');
        this.uiManager = null;
        this.selectedTowerType = null;
        this.selectedBuildingType = null;
        this.currentLevel = 1;
        this.waveIndex = 0;
        this.waveInProgress = false;
        this.waveCompleted = false;
        this.superWeaponLab = null;
        
        // Wave cooldown system
        this.waveCooldownTimer = INITIAL_WAVE_COOLDOWN;
        this.waveCooldownDuration = INITIAL_WAVE_COOLDOWN;
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
        // Phase 6: reuse spell-effect objects across casts instead of allocating a fresh
        // literal every time - acquire() at each push() site in createSpellEffect(),
        // release() once an entry is dropped from _updateSpellEffects()'s compaction loop.
        // One shared pool/factory across every effect `type`, since they're all drawn by
        // the same renderSpellEffects(ctx) switch and only ever live in this one array -
        // the factory's fields are the union of every field any effect type sets.
        this._spellEffectPool = new ObjectPool(() => ({
            type: '', x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, size: 0, color: '',
            maxRadius: 0, x1: 0, y1: 0, x2: 0, y2: 0
        }));
        
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

        // Ensure achievement system exists (normally created by SettlementHub on load)
        if (!this.stateManager.achievementSystem) {
            this.stateManager.achievementSystem = new AchievementSystem();
        }
        if (this.stateManager.audioManager) {
            this.stateManager.achievementSystem.setAudioManager(this.stateManager.audioManager);
        }

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
        this.waveCooldownTimer = INITIAL_WAVE_COOLDOWN;
        this.waveCooldownDuration = INITIAL_WAVE_COOLDOWN;
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

        // Unlock Magic Academy if player has purchased the blueprint upgrade (requires Campaign 1 cleared)
        if (this.stateManager.upgradeSystem && this.stateManager.upgradeSystem.hasUpgrade('magic-academy-unlock')) {
            this.towerManager.unlockSystem.onMagicAcademyUnlockPurchased();
        }

        // Unlock Super Weapon Lab if player has purchased the plans upgrade (requires Campaign 2 cleared)
        if (this.stateManager.upgradeSystem && this.stateManager.upgradeSystem.hasUpgrade('superweapon-lab-unlock')) {
            this.towerManager.unlockSystem.onSuperweaponLabUnlockPurchased();
        }

        // Apply campaign-specific loot drop rates to the enemy manager
        this.enemyManager.campaignLootConfig = this.getCampaignLootConfig(this.currentCampaignId);
        
        // Initialize UI Manager
        this.uiManager = new UIManager(this);
        
        this.setupEventListeners();

        this.uiManager.setupSpellUI(); // Setup spell UI through UIManager
        this.uiManager.updateUI(); // Initial UI update through UIManager
        this.uiManager.updateUIAvailability(); // Update button visibility based on unlocks
        this.uiManager.showSpeedControls(); // Show speed controls during gameplay

        // Apply level-specific flags (e.g. no-tower-building, auto-placed superweapon)
        if (this.level && this.level.levelFlags) {
            const flags = this.level.levelFlags;
            // Place the lab first so updateUIAvailability can detect it for spell UI
            if (flags.autoPlaceSuperWeaponLab) {
                this._autoPlaceRealmLab(flags.autoPlaceSuperWeaponLab);
            }
            if (flags.realmLootConfig) {
                this.enemyManager.campaignLootConfig = flags.realmLootConfig;
            }
            // Re-run availability so the spell-buttons-container becomes visible
            this.uiManager.updateUIAvailability();
            // Now hide tower/building buttons (must happen after updateUIAvailability)
            if (flags.noTowerBuilding) {
                this.uiManager.hideAllPlacementButtons();
            }
        }
        
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
            // Levels can pin a specific track (e.g. bonus levels) instead of using campaign-random music
            const forcedTrack = this.level && this.level.levelFlags && this.level.levelFlags.musicTrack;
            if (forcedTrack) {
                // Exit category playlist mode so the forced track loops itself
                // instead of the 'ended' handler picking a random track from the old category
                this.stateManager.audioManager.musicPlaylistMode = false;
                this.stateManager.audioManager.currentMusicCategory = null;
                this.stateManager.audioManager.playMusic(forcedTrack);
            } else {
                // Use the stored campaign ID for music selection
                this.stateManager.audioManager.playMusicCategory(this.currentCampaignId);
            }
        }
        
        // Wave system starts in cooldown mode - don't call startWave() here
        // The wave cooldown will trigger the first wave after 30 seconds
        
        // Reset real time tracking for wave cooldown
        this.lastRealTimestamp = performance.now() / 1000;
    }
    
    /**
     * Return campaign-specific base loot drop config.
     * normalChance and rareChance are the per-enemy drop probabilities.
     * Base rates: 1/100 normal, 1/1000 rare. Scales up per campaign.
     */
    getCampaignLootConfig(campaignId) {
        switch (campaignId) {
            case 'campaign-1': return { normalChance: 0.0225,  rareChance: 0.0,   realmShardChance: 0.002      };
            case 'campaign-2': return { normalChance: 0.0225,  rareChance: 0.003, realmShardChance: 0.002      }; 
            case 'campaign-3': return { normalChance: 0.04, rareChance: 0.004,    realmShardChance: 0.002      }; 
            case 'campaign-4': return { normalChance: 0.07,  rareChance: 0.006,   realmShardChance: 0.002  }; 
            case 'campaign-5': return { normalChance: 0.02,  rareChance: 0.002,   realmShardChance: 0.002  }; 
            default:           return { normalChance: 0.01,  rareChance: 0.001,   realmShardChance: 0      };
        }
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
     * Whether the currently selected tower/building can actually be afforded
     * right now (or is free from a marketplace consumable). Used to drive the
     * red/green placement preview so players can stay in placement mode while
     * saving up gold.
     */
    canAffordSelectedPlacement() {
        if (this.selectedTowerType) {
            if (this.hasFreePlacement(this.selectedTowerType, true)) return true;
            const towerType = TowerRegistry.getTowerType(this.selectedTowerType);
            return towerType ? this.gameState.canAfford(towerType.cost) : true;
        }
        if (this.selectedBuildingType) {
            if (this.hasFreePlacement(this.selectedBuildingType, false)) return true;
            const buildingType = BuildingRegistry.getBuildingType(this.selectedBuildingType);
            return buildingType ? this.gameState.canAfford(buildingType.cost) : true;
        }
        return true;
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
        }
    }

    exit(levelCompleted = false) {

        // render(ctx) sets ctx.level = this.level on the single shared canvas context
        // (stateManager.ctx, reused by every state) so towers/buildings can read
        // campaign-appropriate vegetation - never cleared, so it silently leaked into
        // every other state's render(ctx) afterward (e.g. the Settlement Hub's Magic
        // Academy picking up whatever campaign was last actually played instead of its
        // own hardcoded forest fallback). Pre-existing bug, unrelated to rendering engine.
        if (this.stateManager.ctx) {
            this.stateManager.ctx.level = null;
        }

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
            }
        } else {
            console.warn('  WARNING: No marketplace system available!');
        }
        
        // Transition from level music to settlement music - playDifferentSettlementTheme()
        // crossfades smoothly into the new track instead of hard-cutting.
        if (this.stateManager.audioManager) {
            this.stateManager.audioManager.playDifferentSettlementTheme();
        }
        
        // Clean up free placement flags
        this.freeBuildingPlacements = {};
        this.freeTowerPlacements = {};
        
        // Clean up event listeners when leaving game state
        this.removeEventListeners();
        if (this.uiManager) {
            this.uiManager.closeAllPanels();
            this.uiManager.activeMenuType = null;
            this.uiManager.activeMenuData = null;
            this.uiManager.removeUIEventListeners();
            this.uiManager.hideSpeedControls(); // Hide speed controls when leaving gameplay
            this.uiManager.resetGameSpeed(); // Reset speed to 1x when leaving
        }

        // Remove any tooltips still attached to document body
        document.querySelectorAll('[data-panel-tooltip]').forEach(t => t.remove());
        
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
        
        // Tear down the Pixi background adapter (if the Pixi renderer was active) so the
        // next level starts with a fresh bake instead of holding stale GPU textures.
        if (this.backgroundRenderAdapter) {
            this.backgroundRenderAdapter.destroy();
            this.backgroundRenderAdapter = null;
        }

        // Same for the tower adapter - per-instance containers are destroyed; baked
        // back/front textures live in pixiTextureCache and are intentionally kept (shared
        // by type+campaign, cheap to keep across levels of the same campaign).
        if (this.towerRenderAdapter) {
            for (const tower of Array.from(this.towerRenderAdapter._entries.keys())) {
                this.towerRenderAdapter.unregister(tower);
            }
            this.towerRenderAdapter = null;
        }
        if (this.buildingRenderAdapter) {
            for (const building of Array.from(this.buildingRenderAdapter._entries.keys())) {
                this.buildingRenderAdapter.unregister(building);
            }
            this.buildingRenderAdapter = null;
        }
        if (this.enemyRenderAdapter) {
            for (const entity of Array.from(this.enemyRenderAdapter._entries.keys())) {
                this.enemyRenderAdapter.unregister(entity);
            }
            this.enemyRenderAdapter = null;
        }
        // Shared sortable layer the three adapters above add their per-entity containers
        // into (see _getPixiEntityLayer) - all entries are already unregistered by this
        // point, so this is just removing the now-empty wrapper, matching
        // BackgroundRenderAdapter's per-level destroy/recreate pattern.
        if (this._pixiEntityLayer) {
            this._pixiEntityLayer.destroy({ children: true });
            this._pixiEntityLayer = null;
        }
        if (this.spellEffectRenderAdapter) {
            this.spellEffectRenderAdapter.destroy();
            this.spellEffectRenderAdapter = null;
        }
        if (this.defenderRenderAdapter) {
            for (const defender of Array.from(this.defenderRenderAdapter._entries.keys())) {
                this.defenderRenderAdapter.unregister(defender);
            }
            this.defenderRenderAdapter.destroy();
            this.defenderRenderAdapter = null;
        }
        if (this.terrainRenderAdapter) {
            for (const element of Array.from(this.terrainRenderAdapter._entries.keys())) {
                this.terrainRenderAdapter.unregister(element);
            }
            this.terrainRenderAdapter = null;
        }

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
        this.waveCooldownTimer = INITIAL_WAVE_COOLDOWN;
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

        // NOTE: no click listener registered here - game.js already has a single global
        // canvas 'click' listener that routes through GameStateManager.handleClick() to
        // this.handleClick(). Adding a second one here fired handleClick() twice per click
        // (e.g. a spell-cast click would cast the spell, clear selectedSpell, then the
        // second call would fall through to the enemy-intel check and reopen that panel).

        // Dev-only stress-test hotkeys (see constructor's ?stresstest gate):
        // Ctrl+Alt+S spawns a batch of enemies+towers (repeatable to ramp up further),
        // Ctrl+Alt+C clears them, Ctrl+Alt+D dumps the perf history to console.table.
        if (this._stressTestEnabled) {
            this._stressTestKeyHandler = (e) => {
                if (!e.ctrlKey || !e.altKey) return;
                if (e.code === 'KeyS') { e.preventDefault(); this._devStressSpawn(150, 20); }
                else if (e.code === 'KeyC') { e.preventDefault(); this._devStressClear(); }
                else if (e.code === 'KeyD') { e.preventDefault(); this.performanceMonitor.dumpHistory(); }
            };
            document.addEventListener('keydown', this._stressTestKeyHandler);
        }
    }

    removeEventListeners() {
        if (this.mouseMoveHandler) {
            this.stateManager.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
            this.mouseMoveHandler = null;
        }

        if (this._stressTestKeyHandler) {
            document.removeEventListener('keydown', this._stressTestKeyHandler);
            this._stressTestKeyHandler = null;
        }
    }

    /**
     * Dev-only: injects a batch of synthetic enemies+towers directly into the live
     * managers (bypassing spawn timers/gold/unlocks entirely) so PerformanceMonitor's
     * per-system slots can be observed at scales normal play never reaches. Repeatable -
     * each call adds another batch, so pressing Ctrl+Alt+S repeatedly ramps up the count
     * for a Phase 3-style stress run. See plan doc for the profiling methodology.
     */
    _devStressSpawn(enemyCount = 150, towerCount = 20) {
        if (!this.enemyManager || !this.towerManager || !this.level) return;

        const enemyTypes = SANDBOX_ENEMY_PATTERN;
        for (let i = 0; i < enemyCount; i++) {
            const type = enemyTypes[i % enemyTypes.length];
            const speed = EnemyRegistry.getDefaultSpeed(type) || 50;
            const enemy = EnemyRegistry.createEnemy(type, this.enemyManager.path, 1, speed);
            if (!enemy) continue;
            if (this.stateManager.audioManager) enemy.audioManager = this.stateManager.audioManager;
            this.enemyManager.enemies.push(enemy);
        }

        // guard-post excluded: it places on the path itself via a different call convention
        const towerTypes = ['basic', 'cannon', 'archer', 'magic', 'barricade', 'poison', 'combination'];
        const level = this.level;
        const cellSize = level.cellSize || 20;
        let placed = 0;
        for (let gy = 0; gy < level.gridHeight - 1 && placed < towerCount; gy += 2) {
            for (let gx = 0; gx < level.gridWidth - 1 && placed < towerCount; gx += 2) {
                if (this.towerManager.isTowerPositionOccupied(gx, gy)) continue;
                if (level.occupiedCells.has(`${gx},${gy}`) || level.occupiedCells.has(`${gx + 1},${gy}`) ||
                    level.occupiedCells.has(`${gx},${gy + 1}`) || level.occupiedCells.has(`${gx + 1},${gy + 1}`)) continue;

                const type = towerTypes[placed % towerTypes.length];
                const x = (gx + 1) * cellSize;
                const y = (gy + 1) * cellSize;
                const tower = TowerRegistry.createTower(type, x, y, gx, gy);
                if (!tower) continue;
                if (this.towerManager.audioManager) tower.audioManager = this.towerManager.audioManager;
                this.towerManager.towers.push(tower);
                this.towerManager.markTowerPosition(gx, gy);
                placed++;
            }
        }

        console.log(`[stress-test] +${enemyCount} enemies, +${placed} towers ` +
            `(totals: ${this.enemyManager.enemies.length} enemies, ${this.towerManager.towers.length} towers)`);
    }

    /** Dev-only: clears everything _devStressSpawn added, for a clean re-run between tiers. */
    _devStressClear() {
        if (this.enemyManager) this.enemyManager.enemies.length = 0;
        if (this.towerManager) {
            this.towerManager.towers.length = 0;
            this.towerManager.occupiedPositions.clear();
        }
        console.log('[stress-test] cleared enemies/towers');
    }
    
    handleMouseMove(e) {
        // getBoundingClientRect() forces a synchronous layout read; this fires on
        // every mousemove while dragging a tower/building placement preview, so use
        // the cached rect (invalidated only on actual resize/orientation change).
        const rect = this.stateManager.game
            ? this.stateManager.game.getCachedCanvasRect()
            : this.stateManager.canvas.getBoundingClientRect();
        // Account for CSS scaling
        const scaleX = this.stateManager.canvas.width / rect.width;
        const scaleY = this.stateManager.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        this.lastMouseX = x;
        this.lastMouseY = y;

        if (!this.selectedTowerType && !this.selectedBuildingType) {
            this.level.setPlacementPreview(0, 0, false);
            return;
        }
        
        let size = 2; // Default tower size
        if (this.selectedBuildingType) {
            // Get building size from registry
            const buildingType = BuildingRegistry.getBuildingType(this.selectedBuildingType);
            size = buildingType?.size || 4;
        }
        this.level.setPlacementPreview(x, y, true, this.towerManager, size, this.selectedTowerType, () => this.canAffordSelectedPlacement());
    }

    refreshPlacementPreview() {
        if (!this.selectedTowerType && !this.selectedBuildingType) return;
        if (!this.level) return;
        let size = 2;
        if (this.selectedBuildingType) {
            const buildingType = BuildingRegistry.getBuildingType(this.selectedBuildingType);
            size = buildingType?.size || 4;
        }
        const x = this.lastMouseX || 0;
        const y = this.lastMouseY || 0;
        this.level.setPlacementPreview(x, y, true, this.towerManager, size, this.selectedTowerType, () => this.canAffordSelectedPlacement());
    }
    
    /**
     * Handle touch move for placement preview (coordinates already in canvas space)
     */
    handleTouchMove(x, y) {
        this.lastMouseX = x;
        this.lastMouseY = y;

        if (!this.selectedTowerType && !this.selectedBuildingType) {
            this.level.setPlacementPreview(0, 0, false);
            return;
        }
        
        let size = 2;
        if (this.selectedBuildingType) {
            const buildingType = BuildingRegistry.getBuildingType(this.selectedBuildingType);
            size = buildingType?.size || 4;
        }
        this.level.setPlacementPreview(x, y, true, this.towerManager, size, this.selectedTowerType, () => this.canAffordSelectedPlacement());
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
        
        // Spell targeting is handled inside handleClick() (gated on this.selectedSpell) so it
        // always runs before any other click logic, regardless of listener registration order.

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

        if (this.stateManager.gameStatistics) {
            this.stateManager.gameStatistics.addSuperWeaponSpellCast(1);
        }

        // Apply spell effects to enemies
        switch(spellId) {
            case 'arcaneBlast':
                this.stateManager.audioManager.playSFX('arcane-blast');
                this.enemyManager.enemies.forEach(enemy => {
                    const dist = Math.hypot(enemy.x - x, enemy.y - y);
                    if (dist <= spell.radius) {
                        if (enemy.freezeTimer > 0 && this.stateManager.gameStatistics) {
                            this.stateManager.gameStatistics.markFrostShatter();
                        }
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
                        // Apply freeze (direct speed manipulation - affects all enemies including frogs)
                        enemy.freezeTimer = spell.freezeDuration;
                        enemy.originalSpeed = enemy.originalSpeed || enemy.speed;
                        enemy.speed = 0;
                        // Apply ice damage for visual feedback (elemental frogs are immune to ice but still get frozen)
                        const iceDamage = (spell.damage || 25) * (1 - dist / spell.radius * 0.5);
                        enemy.takeDamage(iceDamage, 0, 'ice');
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
                                    if (enemy.freezeTimer > 0 && this.stateManager.gameStatistics) {
                                        this.stateManager.gameStatistics.markFrostShatter();
                                    }
                                    // Fire elemental damage - immune frogs (except AirFrog) take no damage but burn still applies via 'fire' ticks
                                    enemy.takeDamage(spell.damage, 0, 'fire');
                                    enemy.burnTimer = spell.burnDuration;
                                    enemy.burnDamage = spell.burnDamage;
                                }
                            }
                        });
                    }
                });
                this.createSpellEffect('meteorStrike', x, y, spell);
                break;
                
            case 'chainLightning': {
                this.stateManager.audioManager.playSFX('chain-lightning');
                // Chain lightning has unlimited range by design (SuperWeaponLab.js's
                // spell definition has no range cap, only chainCount), so it must
                // consider every enemy - SpatialGrid's cell partitioning can't narrow
                // the search the way tower targeting does when the query has to cover
                // the whole map anyway. The actual cost was the full array copy plus
                // O(N log N) sort (with a Math.hypot call per comparison) just to grab
                // the nearest few; a bounded top-K selection removes both without
                // changing which enemies get hit, since chainCount is single digits.
                const enemies = this.enemyManager.enemies;
                const chainCount = spell.chainCount;
                const targets = [];
                const pickCount = Math.min(chainCount, enemies.length);
                if (pickCount > 0) {
                    const distSq = new Array(enemies.length);
                    for (let i = 0; i < enemies.length; i++) {
                        const dx = enemies[i].x - x;
                        const dy = enemies[i].y - y;
                        distSq[i] = dx * dx + dy * dy;
                    }
                    const used = new Array(enemies.length).fill(false);
                    for (let k = 0; k < pickCount; k++) {
                        let bestIdx = -1;
                        let bestDist = Infinity;
                        for (let i = 0; i < enemies.length; i++) {
                            if (!used[i] && distSq[i] < bestDist) {
                                bestDist = distSq[i];
                                bestIdx = i;
                            }
                        }
                        used[bestIdx] = true;
                        targets.push(enemies[bestIdx]);
                    }
                }

                targets.forEach((enemy, index) => {
                    setTimeout(() => {
                        if (enemy.freezeTimer > 0 && this.stateManager.gameStatistics) {
                            this.stateManager.gameStatistics.markFrostShatter();
                        }
                        // Electricity damage - elemental frogs are immune (only magic + their element passes through)
                        enemy.takeDamage(spell.damage * Math.pow(0.8, index), 0, 'electricity');
                    }, index * 100);
                });
                this.createSpellEffect('chainLightning', x, y, spell, targets);
                break;
            }
        }
        
        this.uiManager.updateSpellUI();
        // If the level overrides spell cooldowns, apply the override after casting
        if (this.level && this.level.levelFlags && this.level.levelFlags.spellCooldownOverride != null && this.superWeaponLab) {
            const cd = this.level.levelFlags.spellCooldownOverride;
            Object.values(this.superWeaponLab.spells).forEach(s => { s.currentCooldown = cd; });
            this.uiManager.updateSpellUI();
        }
        // Cancel spell targeting after successful cast to return to normal mode
        this.cancelSpellTargeting();
    }

    _autoPlaceRealmLab(config) {
        const { gridX, gridY } = config;
        const cellSize = this.level.cellSize;
        const screenX = gridX * cellSize + cellSize * 2;
        const screenY = gridY * cellSize + cellSize * 2;
        const building = BuildingRegistry.createBuilding('superweapon', screenX, screenY, gridX, gridY);
        if (!building) return;
        // Unlock all spells
        building.labLevel = 4;
        if (building.spells) {
            if (building.spells.frostNova) building.spells.frostNova.unlocked = true;
            if (building.spells.meteorStrike) building.spells.meteorStrike.unlocked = true;
            if (building.spells.chainLightning) building.spells.chainLightning.unlocked = true;
        }
        const bm = this.towerManager.buildingManager;
        bm.buildings.push(building);
        if (!bm._sortedBuildings) bm._sortedBuildings = [];
        bm._sortedBuildings.push(building);
        bm._sortedBuildings.sort((a, b) => a.y - b.y);
        if (bm.markBuildingPosition) bm.markBuildingPosition(gridX, gridY, building.size || 4);
        bm.superWeaponUnlocked = true;
        if (bm._upgradesDirty !== undefined) bm._upgradesDirty = true;
        if (building.applyEffect) building.applyEffect(bm);
        this.superWeaponLab = building;
        if (this.stateManager.gameStatistics) {
            this.stateManager.gameStatistics.markSuperWeaponLabBuilt();
        }
        if (this.uiManager) this.uiManager.updateSpellUI();
    }
    
    createSpellEffect(type, x, y, spell, targets) {
        // Create visual spell effects at the cast location
        
        if (type === 'arcaneBlast') {
            // Purple/blue expanding blast with particles
            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                const effect = this._spellEffectPool.acquire();
                effect.type = 'arcaneBlast';
                effect.x = x;
                effect.y = y;
                effect.vx = Math.cos(angle) * 150;
                effect.vy = Math.sin(angle) * 150;
                effect.life = 0.6;
                effect.maxLife = 0.6;
                effect.size = 4;
                effect.color = '#8B5CF6';
                this.spellEffects.push(effect);
            }
            // Add expanding ring. vx/vy explicitly undefined - _updateSpellEffects() uses
            // that to distinguish stationary effects (rings/impacts/bolts) from moving
            // particles; without resetting it here, a reused pooled object could carry a
            // stale non-zero velocity from whatever particle type last occupied it.
            const ring = this._spellEffectPool.acquire();
            ring.type = 'arcaneBlastRing';
            ring.x = x;
            ring.y = y;
            ring.vx = undefined;
            ring.vy = undefined;
            ring.maxRadius = spell.radius;
            ring.life = 0.4;
            ring.maxLife = 0.4;
            ring.color = '#A78BFA';
            this.spellEffects.push(ring);
        } else if (type === 'frostNova') {
            // Blue/cyan expanding particles with ice effect
            for (let i = 0; i < 20; i++) {
                const angle = (i / 20) * Math.PI * 2;
                const effect = this._spellEffectPool.acquire();
                effect.type = 'frostNova';
                effect.x = x;
                effect.y = y;
                effect.vx = Math.cos(angle) * 120;
                effect.vy = Math.sin(angle) * 120;
                effect.life = 0.8;
                effect.maxLife = 0.8;
                effect.size = 3;
                effect.color = '#06B6D4';
                this.spellEffects.push(effect);
            }
            // Add frost ring. vx/vy explicitly undefined - see arcaneBlastRing comment above.
            const ring = this._spellEffectPool.acquire();
            ring.type = 'frostNovaRing';
            ring.x = x;
            ring.y = y;
            ring.vx = undefined;
            ring.vy = undefined;
            ring.maxRadius = spell.radius;
            ring.life = 0.6;
            ring.maxLife = 0.6;
            ring.color = '#22D3EE';
            this.spellEffects.push(ring);
        } else if (type === 'meteorStrike') {
            // Orange/red explosion with falling particles
            for (let i = 0; i < 25; i++) {
                const angle = (i / 25) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
                const speed = 80 + Math.random() * 60;
                const effect = this._spellEffectPool.acquire();
                effect.type = 'meteorStrike';
                effect.x = x;
                effect.y = y;
                effect.vx = Math.cos(angle) * speed;
                effect.vy = Math.sin(angle) * speed - 50;
                effect.life = 1.0;
                effect.maxLife = 1.0;
                effect.size = 5 + Math.random() * 3;
                effect.color = ['#DC2626', '#EA580C', '#FB923C'][Math.floor(Math.random() * 3)];
                this.spellEffects.push(effect);
            }
            // Add impact circle. vx/vy explicitly undefined - see arcaneBlastRing comment above.
            const impact = this._spellEffectPool.acquire();
            impact.type = 'meteorStrikeImpact';
            impact.x = x;
            impact.y = y;
            impact.vx = undefined;
            impact.vy = undefined;
            impact.maxRadius = 80;
            impact.life = 0.3;
            impact.maxLife = 0.3;
            impact.color = '#F97316';
            this.spellEffects.push(impact);
        } else if (type === 'chainLightning') {
            // Lightning effects between targets
            if (targets && targets.length > 0) {
                for (let i = 0; i < targets.length - 1; i++) {
                    const target1 = targets[i];
                    const target2 = targets[i + 1];
                    // vx/vy explicitly undefined - see arcaneBlastRing comment above.
                    const bolt = this._spellEffectPool.acquire();
                    bolt.type = 'chainLightningBolt';
                    bolt.x1 = target1.x;
                    bolt.y1 = target1.y;
                    bolt.x2 = target2.x;
                    bolt.y2 = target2.y;
                    bolt.vx = undefined;
                    bolt.vy = undefined;
                    bolt.life = 0.15;
                    bolt.maxLife = 0.15;
                    this.spellEffects.push(bolt);
                }
            }
            // Lightning particles at cast location
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const effect = this._spellEffectPool.acquire();
                effect.type = 'chainLightning';
                effect.x = x;
                effect.y = y;
                effect.vx = Math.cos(angle) * 100;
                effect.vy = Math.sin(angle) * 100;
                effect.life = 0.5;
                effect.maxLife = 0.5;
                effect.size = 2;
                effect.color = '#FBBF24';
                this.spellEffects.push(effect);
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
        
        // If spell targeting is active, this click casts the spell and nothing else
        // (checked first so it can never also open the enemy intel panel on the same click)
        if (this.selectedSpell) {
            this.castSpellAtPosition(this.selectedSpell, x, y);
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
                    this.uiManager.updateButtonStates();
                    
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
                        this.uiManager.updateButtonStates();
                        
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
                        } else if (this.selectedBuildingType === 'diamond-press') {
                            this.stateManager.audioManager.playSFX('diamond-press');
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
                        if (this.stateManager.gameStatistics) {
                            this.stateManager.gameStatistics.markSuperWeaponLabBuilt();
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
            if (this.stateManager.gameStatistics) {
                this.stateManager.gameStatistics.addLootCollected(1);
            }
            return; // Don't proceed to other interactions
        }

        // Check if player clicked on an enemy to show intel panel
        // (some levels, e.g. the Frog King's Realm bonus level, disable this)
        const enemyInfoDisabled = this.level && this.level.levelFlags && this.level.levelFlags.disableEnemyInfo;
        if (!enemyInfoDisabled) {
            const clickedEnemy = this.getEnemyAtPosition(x, y);
            if (clickedEnemy) {
                this.uiManager.showEnemyIntelMenu(clickedEnemy);
                return;
            }
        }

        // Only show menus if not in placement mode
        const clickResult = this.towerManager.handleClick(x, y, this.level.resolutionManager);

        // Track that a selection was made so deselection only runs when needed
        if (clickResult) {
            this._hasSelection = true;
        }
        this.dispatchBuildingClickResult(clickResult);
    }

    // Routes a tower/building click result (from TowerManager.handleClick, or from a building
    // hotkey re-invoking building.onClick() directly) to the right menu/collection handling.
    // Returns true if the result was handled (a menu opened or gold/gems were collected).
    // closePanelOnCollect controls whether a gold/gem collection result closes whatever panel
    // is currently open - true for a direct click on a mine (matches prior behavior), false for
    // the collectGold hotkey, which should never dismiss a menu the player has open elsewhere.
    dispatchBuildingClickResult(clickResult, { closePanelOnCollect = true } = {}) {
        if (!clickResult) return false;
        if (clickResult.type === 'forge_menu') {
            this.uiManager.showForgeUpgradeMenu(clickResult);
            return true;
        } else if (clickResult.type === 'academy_menu') {
            this.uiManager.showAcademyUpgradeMenu(clickResult);
            return true;
        } else if (clickResult.type === 'castle_menu') {
            this.uiManager.showCastleUpgradeMenu(clickResult);
            return true;
        } else if (clickResult.type === 'magic_tower_menu') {
            this.uiManager.showMagicTowerElementMenu(clickResult);
            return true;
        } else if (clickResult.type === 'combination_tower_menu') {
            this.uiManager.showCombinationTowerMenu(clickResult);
            return true;
        } else if (clickResult.type === 'basic_tower_stats') {
            this.uiManager.showBasicTowerStatsMenu(clickResult);
            return true;
        } else if (clickResult.type === 'tower_stats') {
            this.uiManager.showTowerStatsMenu(clickResult);
            return true;
        } else if (clickResult.type === 'guard_post_menu') {
            this.uiManager.showGuardPostMenu(clickResult);
            return true;
        } else if (clickResult.type === 'superweapon_menu') {
            this.uiManager.showSuperWeaponMenu(clickResult);
            return true;
        } else if (clickResult.type === 'diamond_press_menu') {
            if (this.stateManager.audioManager) {
                this.stateManager.audioManager.playSFX('diamond-press');
            }
            this.uiManager.showDiamondPressMenu(clickResult);
            return true;
        } else if (clickResult.type === 'training_menu') {
            this.uiManager.showTrainingGroundsMenu(clickResult);
            return true;
        } else if (clickResult.type === 'goldmine_menu') {
            // Only show goldmine menu if mine is NOT ready
            // If mine is ready, clicking should ONLY collect (handled elsewhere)
            if (clickResult.goldMine && clickResult.goldMine.goldReady !== true) {
                this.uiManager.showGoldMineMenu(clickResult);
            }
            return true;
        } else if (typeof clickResult === 'number') {
            // Gold collection - close any open goldmine menu
            if (this.stateManager.audioManager) {
                this.stateManager.audioManager.playSFX('minegoldclick');
            }
            if (closePanelOnCollect) this.uiManager.closeAllPanels();
            this.gameState.gold += clickResult;
            this.uiManager.updateUI();
            this.uiManager.updateButtonStates();
            return true;
        } else if (typeof clickResult === 'object' && (clickResult.fire !== undefined || clickResult.diamond !== undefined)) {
            // Gem collection from gold mine - close any open goldmine menu
            if (closePanelOnCollect) this.uiManager.closeAllPanels();
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
            return true;
        }
        return false;
    }

    // Building hotkeys: if the building type already exists on the field, interact with it
    // directly (open its menu) instead of entering placement mode. Gold mines are excluded
    // by the caller since they use a dedicated collect-gold hotkey instead (see collectAllReadyMines).
    // Returns true if the hotkey was handled here (caller should not fall back to placement).
    handleBuildingHotkey(type) {
        const classNames = {
            forge: 'TowerForge',
            academy: 'MagicAcademy',
            training: 'TrainingGrounds',
            superweapon: 'SuperWeaponLab',
            'diamond-press': 'DiamondPress'
        };
        const className = classNames[type];
        if (!className) return false;
        const building = this.towerManager.buildingManager.buildings.find(b => b.constructor.name === className);
        if (!building) return false;
        // Deselect other buildings first, matching normal click behavior
        this.towerManager.buildingManager.buildings.forEach(b => {
            if (b !== building && b.deselect) b.deselect();
        });
        const result = this.towerManager.getBuildingMenuResult(building);
        if (result) this._hasSelection = true;
        return this.dispatchBuildingClickResult(result);
    }

    // Collects gold/gems from every ready gold mine at once (bound to the dedicated
    // collectGold hotkey), without ever opening a gold mine menu.
    collectAllReadyMines() {
        const mines = this.towerManager.buildingManager.buildings.filter(b => b.constructor.name === 'GoldMine');
        if (mines.length === 0) return false;
        mines.filter(mine => mine.goldReady === true).forEach(mine => {
            this.dispatchBuildingClickResult(mine.onClick(), { closePanelOnCollect: false });
        });
        return true;
    }
    
    showGemCollectionPopup(gemsCollected) {
        // Create a visual popup showing the gems collected
        const gemTexts = [];
        const types = ['fire', 'water', 'air', 'earth', 'diamond'];
        const icons = { fire: 'F', water: 'W', air: 'A', earth: 'E', diamond: '◆' };
        
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

    getEnemyAtPosition(x, y) {
        if (!this.enemyManager || !this.enemyManager.enemies) return null;
        for (const enemy of this.enemyManager.enemies) {
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            if (dx * dx + dy * dy <= ENEMY_CLICK_RADIUS * ENEMY_CLICK_RADIUS) {
                return enemy;
            }
        }
        return null;
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
    
    getWaveConfig(level, wave) {
        if (this.levelType === 'sandbox') {
            // Sandbox mode: continuously increasing difficulty
            const baseEnemies = 8;
            const baseHealth_multiplier = 1.0;
            const baseSpeed = 40;
            
            return {
                enemyCount: baseEnemies + Math.floor(wave * 1.2),
                enemyHealth_multiplier: baseHealth_multiplier + (wave - 1) * 0.05,
                speedMultiplier: Math.min(2.0, 0.8 + (wave - 1) * 0.04),
                spawnInterval: Math.max(0.3, 1.0 - (wave - 1) * 0.03)
            };
        }
        
        // Get wave config from the level itself
        if (this.level && typeof this.level.getWaveConfig === 'function') {
            const config = this.level.getWaveConfig(wave);
            if (config) {
                let enemyCount = config.enemyCount;
                // For new pattern format (array of {type,count} objects), derive enemyCount from sum
                if (!enemyCount && config.pattern && config.pattern.length > 0 && typeof config.pattern[0] === 'object') {
                    enemyCount = config.pattern.reduce((sum, e) => sum + e.count, 0);
                }
                if (enemyCount && enemyCount > 0) {
                    return {
                        enemyCount,
                        enemyHealth_multiplier: config.enemyHealth_multiplier || 1,
                        speedMultiplier: config.speedMultiplier || 1.0,
                        spawnInterval: config.spawnInterval || 1.0,
                        wavePattern: config.pattern
                    };
                }
            }
        }
        
        // Fallback: return a basic wave if level returns nothing or empty config
        console.warn('GameplayState: No valid wave config for wave', wave, '- using default');
        return {
            enemyCount: 10,
            enemyHealth_multiplier: 1,
            speedMultiplier: 1.0,
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
            // Sandbox mode: endless discrete waves (same enemy-manager wave path as
            // campaign levels, so it naturally hooks into the existing wave-complete/
            // cooldown/next-wave cycle in _checkWaveCompletion() - maxWavesForLevel is
            // Infinity for sandbox so that cycle just never terminates). Enemy count per
            // wave stays fixed; health compounds each wave so it keeps getting harder
            // instead of the old flat forever-stream.
            const healthMultiplier = Math.pow(1 + SANDBOX_HEALTH_GROWTH_PER_WAVE, this.gameState.wave - 1);
            this.enemyManager.spawnWaveWithPattern(
                this.gameState.wave,
                SANDBOX_WAVE_ENEMY_COUNT,
                healthMultiplier,
                1.0,
                SANDBOX_SPAWN_INTERVAL,
                SANDBOX_ENEMY_PATTERN
            );
        } else {
            // Campaign mode: traditional wave spawning
            const waveConfig = this.getWaveConfig(this.currentLevel, this.gameState.wave);
            
            if (waveConfig && waveConfig.enemyCount > 0) {
                // Track total enemies spawned across all waves
                this.totalEnemiesSpawned += waveConfig.enemyCount;

                // Frog King boss fanfare - plays once when he spawns in the space campaign's final level
                if (this.currentCampaignId === 'campaign-4' && this.currentLevel === 'level8' &&
                    waveConfig.wavePattern && waveConfig.wavePattern.includes('frogking')) {
                    this.stateManager.audioManager.playMusic('frog-king-theme');
                }

                if (waveConfig.wavePattern) {
                    // Use custom pattern from level
                    this.enemyManager.spawnWaveWithPattern(
                        this.gameState.wave,
                        waveConfig.enemyCount,
                        waveConfig.enemyHealth_multiplier,
                        waveConfig.speedMultiplier,
                        waveConfig.spawnInterval,
                        waveConfig.wavePattern
                    );
                } else {
                    // Use standard spawning
                    this.enemyManager.spawnWave(
                        this.gameState.wave, 
                        waveConfig.enemyCount,
                        waveConfig.enemyHealth_multiplier,
                        waveConfig.speedMultiplier,
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

        // Close any open building/tower panels and clear placement selection so the
        // victory screen shows a clean battlefield instead of a stuck-open menu
        this.cancelSelection();

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
            saveData.completedLevels = SaveSystem.markLevelCompleted(this.currentLevel, saveData.completedLevels, this.currentCampaignId);

            // Record this run's battle score against the level's best (same formula the
            // results screen animates - see ResultsScreen.calculateBattleScore). completeLevel()
            // already returned early above for sandbox runs, so every path reaching here is a
            // real campaign level.
            const runScore = ResultsScreen.calculateBattleScore({
                enemiesSlain: this.totalEnemiesSpawned,
                timeTaken: Math.round((Date.now() / 1000) - this.levelStartTime),
                goldRemaining: this.gameState.gold,
                goldEarned: this.goldEarnedThisLevel
            });
            saveData.levelHighScores = SaveSystem.recordLevelHighScore(
                this.currentLevel, this.currentCampaignId, runScore, saveData.levelHighScores || {}
            );

            // Unlock next level
            saveData.unlockedLevels = SaveSystem.unlockNextLevel(this.currentLevel, saveData.unlockedLevels, this.currentCampaignId);
            
            // Update last played level
            saveData.lastPlayedLevel = this.currentLevel;

            // --- Campaign completion detection ---
            // Last level varies per campaign: Forest/Mountain = 12, Desert = 10, Space = 8
            const campaignLastLevel = {
                'campaign-1': 'level12',
                'campaign-2': 'level12',
                'campaign-3': 'level10',
                'campaign-4': 'frog-kings-realm'
            };
            const lastLevelForCampaign = campaignLastLevel[this.currentCampaignId] || 'level12';
            const isLastLevel = (this.currentLevel === lastLevelForCampaign) && !this.isSandbox;
            if (isLastLevel && this.currentCampaignId) {
                if (!saveData.completedCampaigns) saveData.completedCampaigns = [];
                if (!saveData.unlockedCampaigns) saveData.unlockedCampaigns = ['campaign-1'];

                // Mark campaign as completed
                saveData.completedCampaigns = SaveSystem.markCampaignCompleted(
                    this.currentCampaignId, saveData.completedCampaigns
                );

                // Unlock the next campaign in the chain
                const nextCampaignId = CampaignRegistry.unlockNextCampaign(this.currentCampaignId);
                if (nextCampaignId) {
                    saveData.unlockedCampaigns = SaveSystem.unlockCampaign(
                        nextCampaignId, saveData.unlockedCampaigns
                    );
                }

                // Signal to SettlementHub that a campaign was just completed
                this.stateManager.justCompletedCampaignId = this.currentCampaignId;
            }
            // --- End campaign completion ---
            
            // Clear mid-game state since level is complete
            saveData.isMidGameSave = false;
            delete saveData.midGameState;

            // Check achievements now that stats and campaign data are fully updated
            if (this.stateManager.achievementSystem && this.stateManager.gameStatistics) {
                this.stateManager.achievementSystem.checkAchievements(
                    this.stateManager.gameStatistics, saveData
                );
                saveData.achievements = this.stateManager.achievementSystem.serialize();
            }

            // Save to current slot if available using helper to ensure commander name is preserved
            if (this.stateManager.currentSaveSlot) {
                SaveSystem.updateAndSaveSettlementData(this.stateManager.currentSaveSlot, saveData);
            }
        }

        // Show custom results screen with statistics
        const campaignLastLevel2 = {
            'campaign-1': 'level12',
            'campaign-2': 'level12',
            'campaign-3': 'level10',
            'campaign-4': 'frog-kings-realm'
        };
        const lastLevelForCampaign2 = campaignLastLevel2[this.currentCampaignId] || 'level12';
        const isLastLevel2 = (this.currentLevel === lastLevelForCampaign2) && !this.isSandbox;
        this.resultsScreen.show('levelComplete', {
            level: this.currentLevel,
            wavesCompleted: this.maxWavesForLevel,
            health: this.gameState.health,
            gold: this.gameState.gold,
            enemiesSlain: this.totalEnemiesSpawned, // Use total enemies spawned (all killed to win)
            goldEarned: this.goldEarnedThisLevel,
            currentGold: this.gameState.gold,
            timeTaken: Math.round((Date.now() / 1000) - this.levelStartTime),
            noNextLevel: isLastLevel2
        }, this.lootManager.getCollectedLoot(), this.lootManager);
    }
    
    update(deltaTime) {
        if (this.resultsScreen && this.resultsScreen.isShowing) {
            this.resultsScreen.update(this.getRealDeltaTime(deltaTime));
            return;
        }

        if (this.resultsScreen && this.resultsScreen.showDelay > 0) {
            this.resultsScreen.update(this.getRealDeltaTime(deltaTime));
        }

        const adjustedDeltaTime = this.getAdjustedDeltaTime(deltaTime);

        this._updateWaveCooldown(adjustedDeltaTime);
        this._updatePendingDamage(adjustedDeltaTime);
        const guardPostTowers = this._updateDefenderPositions(adjustedDeltaTime);
        this._updateGuardPostDefenderCache(guardPostTowers);

        if (this.enemyManager) {
            this.performanceMonitor.beginSlot('enemyUpdate');
            this.enemyManager.update(adjustedDeltaTime);
            this.performanceMonitor.endSlot('enemyUpdate');
            if (this.towerManager) {
                this.performanceMonitor.beginSlot('towerUpdate');
                this.towerManager.update(adjustedDeltaTime, this.enemyManager.enemies);
                this.performanceMonitor.endSlot('towerUpdate');
            }
            this.performanceMonitor.setEntityCounts({
                towers: this.towerManager ? this.towerManager.towers.length : 0,
                enemies: this.enemyManager.enemies.length,
                buildings: this.towerManager && this.towerManager.buildingManager ? this.towerManager.buildingManager.buildings.length : 0,
                loot: this.lootManager ? this.lootManager.lootBags.length : 0,
            });
        }

        if (this.level && typeof this.level.updateRealmEffects === 'function') {
            this.level.updateRealmEffects(adjustedDeltaTime);
        }

        if (this.level.castle && this.level.castle.defender && !this.level.castle.defender.isDead()) {
            this.level.castle.defender.update(deltaTime, this.enemyManager.enemies);
        }

        if (guardPostTowers && this.enemyManager && this.enemyManager.enemies) {
            for (let i = 0; i < guardPostTowers.length; i++) {
                guardPostTowers[i].update(adjustedDeltaTime, this.enemyManager.enemies, this.gameState);
            }
        }

        if (this.lootManager) {
            this.lootManager.update(adjustedDeltaTime, this.stateManager.canvas.height, this.stateManager.canvas.width);
        }

        if (this.towerManager && !this.uiManager.activeMenuType) {
            if (this._hasSelection) {
                const towers = this.towerManager.towers;
                for (let i = 0; i < towers.length; i++) towers[i].isSelected = false;
                const buildings = this.towerManager.buildingManager.buildings;
                for (let i = 0; i < buildings.length; i++) {
                    if (buildings[i].deselect) buildings[i].deselect();
                }
                this._hasSelection = false;
            }
        }

        if (!this.enemyManager || !this.enemyManager.enemies) return;

        this._updateEnemyCombat(deltaTime, adjustedDeltaTime);

        if (this.level.castle && this.level.castle.isDestroyed()) {
            if (this.stateManager.marketplaceSystem && this.stateManager.marketplaceSystem.hasFrogKingBane()) {
                this.stateManager.marketplaceSystem.useFrogKingBaneBoon();
                this.level.castle.revive();
            } else {
                this.gameOver();
                return;
            }
        }

        const deathResult = this.enemyManager.removeDeadEnemies();
        const goldFromEnemies = deathResult.totalGold;
        const lootDrops = deathResult.lootDrops || [];

        if (deathResult.killed > 0) {
            this.enemiesDefeated += deathResult.killed;
            if (this.stateManager.gameStatistics) {
                this.stateManager.gameStatistics.addEnemiesSlain(deathResult.killed);
            }
        }

        this.goldEarnedThisLevel += goldFromEnemies;

        const processedLootDrops = this.applyLootMultipliers(lootDrops);
        for (const lootDrop of processedLootDrops) {
            if (lootDrop.isRealmShard) {
                this.lootManager.spawnRealmShard(lootDrop.x, lootDrop.y, lootDrop.lootId);
            } else {
                this.lootManager.spawnLoot(lootDrop.x, lootDrop.y, lootDrop.lootId, lootDrop.isRare || false);
            }
        }

        if (goldFromEnemies > 0) {
            this.gameState.gold += goldFromEnemies;
            this.uiManager.updateUI();
            this.uiManager.updateButtonStates();
        }

        if (this._checkWaveCompletion()) return;

        this.uiManager.updateSpellUI();
        this.uiManager.updateWaveCooldownDisplay();
        this.uiManager.updateActiveMenuIfNeeded(adjustedDeltaTime);

        this._updateSpellEffects(adjustedDeltaTime);
    }

    _updateWaveCooldown(adjustedDeltaTime) {
        if (this.isInWaveCooldown) {
            this.waveCooldownTimer -= adjustedDeltaTime;
            if (this.waveCooldownTimer <= 0) {
                this.isInWaveCooldown = false;
                this.waveCooldownTimer = 0;
                this.startWave();
            }
        }
    }

    _updatePendingDamage(adjustedDeltaTime) {
        let pendingAlive = 0;
        for (let i = 0; i < this.pendingDamage.length; i++) {
            const damage = this.pendingDamage[i];
            damage.time -= adjustedDeltaTime;
            if (damage.time <= 0) {
                damage.callback();
            } else {
                this.pendingDamage[pendingAlive] = damage;
                pendingAlive++;
            }
        }
        this.pendingDamage.length = pendingAlive;
    }

    _updateDefenderPositions(adjustedDeltaTime) {
        if (this.level && this.level.castle) {
            this.level.castle.update(adjustedDeltaTime);
            this.level.castle.checkDefenderDeath();
        }

        if (this.level && this.level.castle && this.level.castle.defender && !this.level.castle.defender.isDead()) {
            const defender = this.level.castle.defender;
            defender.x = this.level.castle.x - 60;
            defender.y = this.level.castle.y + 40;
        }

        let guardPostTowers = null;
        if (this.towerManager && this.towerManager.towers) {
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
                        tower.defender.x = tower.defenderSpawnX;
                        tower.defender.y = tower.defenderSpawnY;
                    }
                }
            }
        }

        return guardPostTowers;
    }

    _updateGuardPostDefenderCache(guardPostTowers) {
        if (!this.guardPostDefenderCache) {
            this.guardPostDefenderCache = [];
        }

        let activeDefenderCount = 0;
        if (guardPostTowers && guardPostTowers.length > 0) {
            for (let i = 0; i < guardPostTowers.length; i++) {
                const defender = guardPostTowers[i].getDefender();
                if (defender && !defender.isDead()) activeDefenderCount++;
            }
        }

        const guardPostCount = guardPostTowers ? guardPostTowers.length : 0;
        if (activeDefenderCount !== this._lastActiveDefenderCount || guardPostCount !== this._lastGuardPostCount) {
            this._lastActiveDefenderCount = activeDefenderCount;
            this._lastGuardPostCount = guardPostCount;

            this.guardPostDefenderCache.length = 0;

            if (guardPostTowers && guardPostTowers.length > 0) {
                guardPostTowers.forEach(tower => {
                    const defender = tower.getDefender();
                    if (defender) {
                        this.guardPostDefenderCache.push({
                            defender,
                            waypoint: tower.getDefenderWaypoint(),
                            tower,
                            pathIndex: tower.pathIndex
                        });
                    }
                });
            }

            if (this.enemyManager && this.enemyManager.enemies) {
                for (let i = 0; i < this.enemyManager.enemies.length; i++) {
                    const enemy = this.enemyManager.enemies[i];
                    if (!enemy.pathDefenders) enemy.pathDefenders = [];
                    enemy.guardPostCache = this.guardPostDefenderCache;
                    enemy.pathDefenders.length = 0;
                    for (let j = 0; j < this.guardPostDefenderCache.length; j++) {
                        enemy.pathDefenders.push(this.guardPostDefenderCache[j].defender);
                    }
                }
            }
        }

        // Wire newly spawned enemies to the current cache
        if (this.enemyManager && this.enemyManager.enemies) {
            for (let i = 0; i < this.enemyManager.enemies.length; i++) {
                const enemy = this.enemyManager.enemies[i];
                if (!enemy.guardPostCache) {
                    if (!enemy.pathDefenders) enemy.pathDefenders = [];
                    enemy.guardPostCache = this.guardPostDefenderCache;
                    for (let j = 0; j < this.guardPostDefenderCache.length; j++) {
                        enemy.pathDefenders.push(this.guardPostDefenderCache[j].defender);
                    }
                }
                if ((enemy.type === 'mage' || enemy.type === 'frogking') && this.towerManager && enemy._towersRef !== this.towerManager.towers) {
                    enemy._towersRef = this.towerManager.towers;
                }
            }
        }
    }

    _updateEnemyCombat(deltaTime, adjustedDeltaTime) {
        const enemies = this.enemyManager.enemies;

        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];

            // Clean up dead path defenders (compact-in-place)
            if (enemy.pathDefenders && enemy.pathDefenders.length > 0) {
                let aliveCount = 0;
                for (let j = 0; j < enemy.pathDefenders.length; j++) {
                    if (!enemy.pathDefenders[j].isDead()) {
                        enemy.pathDefenders[aliveCount] = enemy.pathDefenders[j];
                        aliveCount++;
                    }
                }
                enemy.pathDefenders.length = aliveCount;

                if (aliveCount === 0 && enemy.isAttackingDefender) {
                    enemy.isAttackingDefender = false;
                    enemy.defenderTarget = null;
                    enemy.reachedEnd = false;
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
                    enemy.takeDamage(enemy.burnDamage || 2, 0, 'fire', true);
                    enemy.burnTickTimer = 0.5;
                }

                if (enemy.burnTimer <= 0) enemy.burnTimer = 0;
            }

            // Handle damage to defenders and castle
            if (enemy.isAttackingDefender && enemy.defenderTarget) {
                if (enemy.defenderTarget.isDead()) {
                    const wasPathDefender = enemy.defenderTarget.type === 'path';
                    enemy.isAttackingDefender = false;
                    enemy.defenderTarget = null;
                    if (wasPathDefender) enemy.reachedEnd = false;
                } else {
                    enemy.attackDefender(enemy.defenderTarget, adjustedDeltaTime);
                }
            }
            if (!enemy.isAttackingDefender && enemy.reachedEnd) {
                if (this.level.levelFlags?.noLoss) {
                    enemy.health = -1;
                    enemy.lootDropChance = 0;
                    enemy.rareLootDropChance = 0;
                    if (enemy.realmShardDropChance !== undefined) enemy.realmShardDropChance = 0;
                    enemy.goldReward = 0;
                    continue;
                }

                let targetDefender = null;

                if (enemy.guardPostCache && enemy.guardPostCache.length > 0 && this.level && this.level.path) {
                    let nextGuardPostDefender = null;
                    let closestDefenderDistance = Infinity;

                    for (let cache of enemy.guardPostCache) {
                        if (!cache.defender.isDead() && cache.waypoint) {
                            const distance = Math.hypot(
                                cache.waypoint.x - enemy.x,
                                cache.waypoint.y - enemy.y
                            );
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

                if (enemy.isAttackingCastle && this.level.castle && this.level.castle.defender && !this.level.castle.defender.isDead()) {
                    targetDefender = this.level.castle.defender;
                    enemy.isAttackingDefender = true;
                    enemy.defenderTarget = targetDefender;
                    enemy.isAttackingCastle = false;
                    enemy.attackDefender(targetDefender, adjustedDeltaTime);
                } else if (this.level.castle) {
                    enemy.isAttackingCastle = true;
                    enemy.isAttackingDefender = false;
                    enemy.attackCastle(this.level.castle, adjustedDeltaTime);
                }
            }
        }
    }

    // Returns true if the level was completed (caller should return from update).
    _checkWaveCompletion() {
        if (this.waveInProgress && this.enemyManager.enemies.length === 0 && !this.enemyManager.spawning) {
            this.waveInProgress = false;
            this.waveCompleted = true;
            if (this.stateManager.gameStatistics) {
                this.stateManager.gameStatistics.addWavesSurvived(1);
            }

            if (this.gameState.wave >= this.maxWavesForLevel) {
                this.completeLevel();
                return true;
            } else {
                this.isInWaveCooldown = true;
                this.waveCooldownTimer = BETWEEN_WAVE_COOLDOWN;
                this.waveCooldownDuration = BETWEEN_WAVE_COOLDOWN;
                this.gameState.wave++;
            }
        }
        return false;
    }

    _updateSpellEffects(adjustedDeltaTime) {
        let aliveEffects = 0;
        for (let i = 0; i < this.spellEffects.length; i++) {
            const effect = this.spellEffects[i];
            effect.life -= adjustedDeltaTime;
            if (effect.x !== undefined && effect.vx !== undefined) {
                effect.x += effect.vx * adjustedDeltaTime;
                effect.y += effect.vy * adjustedDeltaTime;
                effect.vy += 100 * adjustedDeltaTime;
            }
            if (effect.life > 0) {
                this.spellEffects[aliveEffects] = effect;
                aliveEffects++;
            } else {
                this._spellEffectPool.release(effect);
            }
        }
        this.spellEffects.length = aliveEffects;
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

            // Check achievements and persist them
            if (this.stateManager.achievementSystem) {
                this.stateManager.achievementSystem.checkAchievements(
                    this.stateManager.gameStatistics, this.stateManager.currentSaveData
                );
                this.stateManager.currentSaveData.achievements = this.stateManager.achievementSystem.serialize();
            }

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

        // Expose level on ctx so towers/buildings can use campaign-appropriate vegetation
        ctx.level = this.level;

        // Render background terrain/level first. level.skipCanvas2DBackgroundBlit reflects
        // last frame's Pixi bake state (see sync below) - false until the Pixi renderer
        // has finished its async init and baked this level's background+terrain sprites.
        this.level.render(ctx);

        // Hand the static background/terrain layer off to a GPU-composited Pixi sprite.
        if (this.stateManager.pixiApp && this.stateManager.pixiApp.ready) {
            if (!this.backgroundRenderAdapter) {
                this.backgroundRenderAdapter = new BackgroundRenderAdapter(this.stateManager.pixiApp.app.stage);
            }
            this.performanceMonitor.beginSlot('renderSync');
            this.level.skipCanvas2DBackgroundBlit = this.backgroundRenderAdapter.syncLevel(this.level);
            this.performanceMonitor.endSlot('renderSync');
        }

        // Pixi's sortableChildren + per-entity zIndex (set to each entity's y in every
        // _syncXPixi call below) now fully own visual depth ordering across every entity
        // type sharing the entity layer - towers/buildings/enemies/loot/castle/terrain all
        // interleave correctly by Y position regardless of which loop below registers them
        // in which order. The Canvas2D draws that remain per type (attack-radius circles,
        // hit splatters, disabled-overlays - the bits never migrated, see each adapter's
        // doc comment) don't depend on cross-type ordering, so there's no longer any need
        // to merge every entity into one array and sort it by Y before rendering, the way
        // this loop used to when Canvas2D itself still drew entity bodies in that order.
        const pixiActive = this.stateManager.pixiApp && this.stateManager.pixiApp.ready;

        if (this.towerManager && this.towerManager.towers) {
            const towers = this.towerManager.towers;
            for (let i = 0; i < towers.length; i++) {
                const tower = towers[i];
                tower.render(ctx);
                if (tower.isDisabled) {
                    tower.renderDisabledOverlay(ctx);
                }
                if (pixiActive) {
                    this.performanceMonitor.beginSlot('renderSync');
                    this._syncTowerPixi(tower, ctx);
                    this.performanceMonitor.endSlot('renderSync');
                }
            }
        }

        if (this.towerManager && this.towerManager.buildingManager && this.towerManager.buildingManager.buildings) {
            const buildings = this.towerManager.buildingManager.buildings;
            for (let i = 0; i < buildings.length; i++) {
                const building = buildings[i];
                const cellSize = building.getCellSize(ctx);
                const buildingSize = cellSize * building.size;
                ctx.buildingManager = this.towerManager.buildingManager;
                building.render(ctx, buildingSize);
                ctx.buildingManager = null;
                if (pixiActive) {
                    this.performanceMonitor.beginSlot('renderSync');
                    this._syncBuildingPixi(building, buildingSize);
                    this.performanceMonitor.endSlot('renderSync');
                }
            }
        }

        if (this.enemyManager && this.enemyManager.enemies) {
            const enemies = this.enemyManager.enemies;
            for (let i = 0; i < enemies.length; i++) {
                const enemy = enemies[i];
                enemy.render(ctx);
                if (enemy.hitSplatters && enemy.hitSplatters.length > 0) {
                    for (let j = 0; j < enemy.hitSplatters.length; j++) {
                        enemy.hitSplatters[j].render(ctx);
                    }
                }
                if (pixiActive) {
                    this.performanceMonitor.beginSlot('renderSync');
                    this._syncEnemyPixi(enemy, ctx);
                    this.performanceMonitor.endSlot('renderSync');
                }
            }
        }

        if (this.level.castle) {
            this.level.castle.render(ctx);
            if (pixiActive) {
                this.performanceMonitor.beginSlot('renderSync');
                this._syncBuildingPixi(this.level.castle, Math.max(this.level.castle.wallWidth, this.level.castle.towerHeight + 50) * 1.5);
                this.performanceMonitor.endSlot('renderSync');
            }
        }

        if (this.level && this.level.terrainElements) {
            // Pixi path doesn't care about iteration order (zIndex owns layering), but the
            // Canvas2D fallback draws in whatever order it iterates - use the depth-sorted
            // view there so e.g. a rock doesn't draw over a tree it should be behind.
            const terrain = pixiActive ? this.level.terrainElements : this.level.getTerrainElementsSortedByDepth();
            for (let i = 0; i < terrain.length; i++) {
                const el = terrain[i];
                if (el.type === 'water') continue;
                // Terrain has no per-instance flag to gate its own Canvas2D draw (it's a
                // plain data object, not a class instance) - branch here instead. Falls
                // back to Canvas2D only during Pixi's brief async-init window (pixiActive
                // false), matching every other entity type's bootstrap-frame behavior.
                if (pixiActive) {
                    this.performanceMonitor.beginSlot('renderSync');
                    this._syncTerrainPixi(el);
                    this.performanceMonitor.endSlot('renderSync');
                } else {
                    this.level.renderSingleTerrainElement(ctx, el);
                }
            }
        }

        // Loot is drawn after terrain (and everything else above) so it always renders on
        // top and never visually disappears behind trees, rocks or buildings. Under Pixi
        // this is belt-and-suspenders (LOOT_ZINDEX_BOOST in EnemyRenderAdapter already
        // guarantees it); it matters for real during the brief Canvas2D fallback window
        // before Pixi finishes its async init, since Canvas2D draw order IS layering order.
        if (this.lootManager && this.lootManager.lootBags) {
            const bags = this.lootManager.lootBags;
            for (let i = 0; i < bags.length; i++) {
                const bag = bags[i];
                bag.render(ctx);
                if (pixiActive) {
                    this.performanceMonitor.beginSlot('renderSync');
                    this._syncEnemyPixi(bag, ctx);
                    this.performanceMonitor.endSlot('renderSync');
                }
            }
        }

        // Drop Pixi adapter entries for towers/buildings/enemies+loot that were sold,
        // removed, or died since last frame (their managers own removal and don't know
        // about rendering, so this is a cheap per-frame reconciliation instead).
        this.performanceMonitor.beginSlot('renderSync');
        if (this.towerRenderAdapter && this.towerManager && this.towerManager.towers) {
            this._pruneTowerPixiAdapter();
        }
        if (this.buildingRenderAdapter && this.towerManager && this.towerManager.buildingManager) {
            this._pruneBuildingPixiAdapter();
        }
        if (this.enemyRenderAdapter) {
            this._pruneEnemyPixiAdapter();
        }
        this.performanceMonitor.endSlot('renderSync');

        // Render orphaned splatters from dead enemies
        if (this.enemyManager && this.enemyManager.orphanedSplatters) {
            for (let i = 0; i < this.enemyManager.orphanedSplatters.length; i++) {
                this.enemyManager.orphanedSplatters[i].render(ctx);
            }
        }

        // Render defender if active (after all main entities)
        if (this.level.castle && this.level.castle.defender && !this.level.castle.defender.isDead()) {
            this.level.castle.defender.render(ctx);
            if (pixiActive) {
                this.performanceMonitor.beginSlot('renderSync');
                this._syncDefenderPixi(this.level.castle.defender, ctx);
                this.performanceMonitor.endSlot('renderSync');
            }
        }

        // Render guard post defenders
        if (this.towerManager && this.towerManager.towers) {
            const towers = this.towerManager.towers;
            for (let i = 0; i < towers.length; i++) {
                const tower = towers[i];
                if (tower.type === 'guard-post' && tower.defender && !tower.defender.isDead()) {
                    tower.defender.render(ctx);
                    if (pixiActive) {
                        this.performanceMonitor.beginSlot('renderSync');
                        this._syncDefenderPixi(tower.defender, ctx);
                        this.performanceMonitor.endSlot('renderSync');
                    }
                }
            }
        }
        if (this.defenderRenderAdapter) {
            this.performanceMonitor.beginSlot('renderSync');
            this._pruneDefenderPixiAdapter();
            this.performanceMonitor.endSlot('renderSync');
        }

        // Spell/particle effects draw into a Pixi shim via the exact same
        // renderSpellEffects(ctx) method, unmodified - see SpellEffectRenderAdapter.js.
        // Falls back to direct Canvas2D only during Pixi's brief async-init window.
        if (pixiActive) {
            if (!this.spellEffectRenderAdapter) {
                this.spellEffectRenderAdapter = new SpellEffectRenderAdapter(this.stateManager.pixiApp.app.stage);
            }
            this.performanceMonitor.beginSlot('renderSync');
            this.spellEffectRenderAdapter.sync(this.renderSpellEffects.bind(this), this.spellEffects.length > 0);
            this.performanceMonitor.endSlot('renderSync');
        } else {
            this.renderSpellEffects(ctx);
        }

        // Render active boons
        this.renderActiveBoons(ctx);

        // Render results screen overlay on top of the still-visible battlefield
        if (this.resultsScreen && this.resultsScreen.isShowing) {
            this.resultsScreen.render(ctx);
        }

        // Performance overlay — always on top of everything including results screen.
        if (this.performanceMonitor) {
            this.performanceMonitor.render(ctx, 10, 10);
        }
    }

    /**
     * Hand a tower's body+defender+environment off to Pixi (Phase 3 of the migration), if
     * its class follows the renderStaticBack/renderDynamicParts/renderStaticFront
     * convention (see TowerRenderAdapter.js). Tower types that haven't been migrated yet
     * simply don't have these methods - they keep rendering entirely via the Canvas2D
     * tower.render(ctx) call already made above, unaffected.
     */
    /**
     * Lazily create the single Container (sortableChildren=true) that TowerRenderAdapter,
     * BuildingRenderAdapter, and EnemyRenderAdapter all add their per-entity containers
     * into directly. This is the Y-sort cutover: without one shared sortable layer, each
     * adapter would stack as a whole private container on app.stage in lazy-construction
     * order, so e.g. every enemy would draw in front of (or behind) every tower regardless
     * of actual Y position - per-entity zIndex=y only sorts correctly against siblings
     * within the SAME container. BackgroundRenderAdapter stays on its own container
     * directly on app.stage (very negative zIndex), since it's a single full-screen sprite
     * pair that never needs to interleave with individual entities.
     */
    _getPixiEntityLayer() {
        if (!this._pixiEntityLayer) {
            this._pixiEntityLayer = new Container();
            this._pixiEntityLayer.sortableChildren = true;
            // Game uses its own JS click/hit detection - Pixi event traversal is pure overhead.
            this._pixiEntityLayer.eventMode = 'none';
            this.stateManager.pixiApp.app.stage.addChild(this._pixiEntityLayer);
        }
        return this._pixiEntityLayer;
    }

    _syncTowerPixi(tower, ctx) {
        if (typeof tower.renderStaticBack !== 'function') return;

        if (!this.towerRenderAdapter) {
            this.pixiTextureCache = this.pixiTextureCache || new PixiTextureCache();
            this.towerRenderAdapter = new TowerRenderAdapter(this._getPixiEntityLayer(), this.pixiTextureCache);
        }

        const gridSize = tower.getTowerSize(ctx);

        if (!this.towerRenderAdapter.has(tower)) {
            this.towerRenderAdapter.register(tower, this.level.getCampaign(), this.level, gridSize);
        }

        this.towerRenderAdapter.sync(tower, gridSize, this.level);
    }

    _pruneTowerPixiAdapter() {
        if (!this._towerPixiLiveSet) this._towerPixiLiveSet = new Set();
        const liveSet = this._towerPixiLiveSet;
        liveSet.clear();
        const towers = this.towerManager.towers;
        for (let i = 0; i < towers.length; i++) liveSet.add(towers[i]);

        for (const tower of this.towerRenderAdapter._entries.keys()) {
            if (!liveSet.has(tower)) {
                this.towerRenderAdapter.unregister(tower);
            }
        }
    }

    /** Hand a building's body off to Pixi (Phase 3), if its class follows the render convention (see BuildingRenderAdapter.js). Building types not yet migrated simply don't have these methods. */
    _syncBuildingPixi(building, buildingSize) {
        if (typeof building.renderStaticBack !== 'function') return;

        if (!this.buildingRenderAdapter) {
            this.pixiTextureCache = this.pixiTextureCache || new PixiTextureCache();
            this.buildingRenderAdapter = new BuildingRenderAdapter(this._getPixiEntityLayer(), this.pixiTextureCache);
        }

        if (!this.buildingRenderAdapter.has(building)) {
            this.buildingRenderAdapter.register(building, this.level.getCampaign(), this.level, buildingSize);
        }

        this.buildingRenderAdapter.sync(building, buildingSize, this.level);
    }

    _pruneBuildingPixiAdapter() {
        if (!this._buildingPixiLiveSet) this._buildingPixiLiveSet = new Set();
        const liveSet = this._buildingPixiLiveSet;
        liveSet.clear();
        const buildings = this.towerManager.buildingManager.buildings;
        for (let i = 0; i < buildings.length; i++) liveSet.add(buildings[i]);
        // Castle isn't part of buildingManager.buildings but shares this same adapter
        // (see the 'castle' branch in render() above) - keep it out of the prune sweep.
        if (this.level && this.level.castle) liveSet.add(this.level.castle);

        for (const building of this.buildingRenderAdapter._entries.keys()) {
            if (!liveSet.has(building)) {
                this.buildingRenderAdapter.unregister(building);
            }
        }
    }

    /**
     * Hand an enemy or loot bag's body off to Pixi (Phase 4 of the migration), if its
     * class follows the renderStaticBack/renderDynamicParts/renderStaticFront convention
     * (see EnemyRenderAdapter.js - shared across both kinds of entity). Types not yet
     * migrated simply don't have these methods and keep rendering entirely via the
     * Canvas2D entity.render(ctx) call already made above, unaffected.
     */
    _syncEnemyPixi(entity, ctx) {
        if (typeof entity.renderStaticBack !== 'function') return;

        if (!this.enemyRenderAdapter) {
            this.pixiTextureCache = this.pixiTextureCache || new PixiTextureCache();
            this.enemyRenderAdapter = new EnemyRenderAdapter(this._getPixiEntityLayer(), this.pixiTextureCache);
        }

        // Each subclass's render(ctx) computes its own baseSize from the real ctx (clamp
        // ranges/multipliers differ per type, see BasicEnemy.js) and caches it on the
        // instance so Pixi uses the exact same value. Loot bags have no such cache (their
        // renderDynamicParts takes no sizeHint), so a radius-based fallback covers them;
        // a flat default covers anything else not yet following either convention.
        const sizeHint = typeof entity._lastRenderSize === 'number'
            ? entity._lastRenderSize
            : (entity.radius ? entity.radius * 2 : 40);

        if (!this.enemyRenderAdapter.has(entity)) {
            this.enemyRenderAdapter.register(entity, sizeHint);
        }

        this.enemyRenderAdapter.sync(entity, sizeHint);
    }

    /**
     * Drop Pixi adapter entries for enemies that died and loot bags that were collected
     * or expired since last frame (EnemyManager/LootManager own removal/lifecycle and
     * don't know about rendering). Collected/expired bags are deliberately excluded from
     * the live set even while still technically present in lootManager.lootBags during
     * their brief removal window, mirroring LootBag.render()'s own early-return guard.
     */
    _pruneEnemyPixiAdapter() {
        if (!this._enemyPixiLiveSet) this._enemyPixiLiveSet = new Set();
        const liveSet = this._enemyPixiLiveSet;
        liveSet.clear();

        if (this.enemyManager && this.enemyManager.enemies) {
            const enemies = this.enemyManager.enemies;
            for (let i = 0; i < enemies.length; i++) liveSet.add(enemies[i]);
        }
        if (this.lootManager && this.lootManager.lootBags) {
            const bags = this.lootManager.lootBags;
            for (let i = 0; i < bags.length; i++) {
                const bag = bags[i];
                if (!bag.isCollected() && !(bag.lifetime > 0 && bag.age >= bag.lifetime)) {
                    liveSet.add(bag);
                }
            }
        }

        for (const entity of this.enemyRenderAdapter._entries.keys()) {
            if (!liveSet.has(entity)) {
                this.enemyRenderAdapter.unregister(entity);
            }
        }
    }

    /** Hand a defender's body off to Pixi (Phase 7), via the same renderStaticBack/renderDynamicParts/renderStaticFront convention as towers/enemies (see DefenderRenderAdapter.js). */
    _syncDefenderPixi(defender, ctx) {
        if (typeof defender.renderStaticBack !== 'function') return;

        if (!this.defenderRenderAdapter) {
            this.pixiTextureCache = this.pixiTextureCache || new PixiTextureCache();
            this.defenderRenderAdapter = new DefenderRenderAdapter(this.stateManager.pixiApp.app.stage, this.pixiTextureCache);
        }

        const sizeHint = typeof defender._lastRenderSize === 'number' ? defender._lastRenderSize : 40;

        if (!this.defenderRenderAdapter.has(defender)) {
            this.defenderRenderAdapter.register(defender, sizeHint);
        }

        this.defenderRenderAdapter.sync(defender, sizeHint);
    }

    /** Drop Pixi adapter entries for defenders that died or were removed since last frame (at most ~1 castle defender + one per guard-post tower, so a simple linear liveSet rebuild is plenty cheap). */
    _pruneDefenderPixiAdapter() {
        if (!this._defenderPixiLiveSet) this._defenderPixiLiveSet = new Set();
        const liveSet = this._defenderPixiLiveSet;
        liveSet.clear();

        if (this.level && this.level.castle && this.level.castle.defender && !this.level.castle.defender.isDead()) {
            liveSet.add(this.level.castle.defender);
        }
        if (this.towerManager && this.towerManager.towers) {
            const towers = this.towerManager.towers;
            for (let i = 0; i < towers.length; i++) {
                const tower = towers[i];
                if (tower.type === 'guard-post' && tower.defender && !tower.defender.isDead()) {
                    liveSet.add(tower.defender);
                }
            }
        }

        for (const defender of this.defenderRenderAdapter._entries.keys()) {
            if (!liveSet.has(defender)) {
                this.defenderRenderAdapter.unregister(defender);
            }
        }
    }

    /**
     * Hand a terrain element off to Pixi (closes the cross-renderer Y-sort gap - see
     * TerrainRenderAdapter.js). Terrain elements never move or get removed mid-level
     * (level.terrainElements is populated once at level load), so this only ever
     * registers once per element and never needs a per-frame sync or a prune sweep -
     * unlike every other _syncXPixi helper above.
     */
    _syncTerrainPixi(element) {
        if (!this.terrainRenderAdapter) {
            this.pixiTextureCache = this.pixiTextureCache || new PixiTextureCache();
            this.terrainRenderAdapter = new TerrainRenderAdapter(this._getPixiEntityLayer(), this.pixiTextureCache);
        }

        if (!this.terrainRenderAdapter.has(element)) {
            this.terrainRenderAdapter.register(element, this.level);
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
                icon = '';
                text = 'The spirits of the woods protect you';
            } else if (boonId === 'strange-talisman') {
                glowColor = '#9D4EDD';
                borderColor = '#9D4EDD';
                bgColor = 'rgba(15, 5, 30, 0.95)';
                textColor = '#E0AAFF';
                icon = '';
                text = 'Strange Talisman active';
            } else if (boonId === 'rabbits-foot') {
                glowColor = '#FFD700';
                borderColor = '#FFD700';
                bgColor = 'rgba(30, 25, 0, 0.95)';
                textColor = '#FFED4E';
                icon = '';
                text = 'Rabbit\'s Foot active';
            } else {
                continue;
            }
            
            // Border
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(startX, yPos, boxWidth, boxHeight);
            
            // Background
            ctx.fillStyle = bgColor;
            ctx.fillRect(startX, yPos, boxWidth, boxHeight);
            
            // Icon indicator (colored dot)
            ctx.shadowBlur = 0;
            ctx.fillStyle = borderColor;
            ctx.beginPath();
            ctx.arc(startX + 13, yPos + 22, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
            
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
        for (let i = 0; i < this.spellEffects.length; i++) {
            const effect = this.spellEffects[i];
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
                ctx.rotate(effect.life * 20);
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
        }
    }
    
    resize() {
        this.level.initializeForCanvas(this.stateManager.canvas.width, this.stateManager.canvas.height, this.stateManager.resolutionManager);
        this.towerManager.updatePositions(this.level);
    }
}
