import { TowerManager } from '../../entities/towers/TowerManager.js';
import { EnemyManager } from '../../entities/enemies/EnemyManager.js';
import { EnemyRegistry } from '../../entities/enemies/EnemyRegistry.js';
import { TowerRegistry } from '../../entities/towers/TowerRegistry.js';
import { BuildingRegistry } from '../../entities/buildings/BuildingRegistry.js';
import { MarketplaceRegistry } from '../registries/MarketplaceRegistry.js';
import { CastleDefender } from '../../entities/defenders/CastleDefender.js';
import { LevelRegistry } from '../../entities/levels/LevelRegistry.js';
import { UIManager } from '../../ui/UIManager.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import {
    normalizeEternalOptions, canSaveEternalRun, eternalHighScoreField,
    UNLIMITED_GOLD, UNLIMITED_GOLD_AMOUNT
} from '../systems/EternalOptions.js';
import {
    captureEternalSnapshot, restoreEternalSnapshot, isValidEternalSnapshot
} from '../systems/EternalSnapshot.js';

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
import { ObjectPool } from '../utils/ObjectPool.js';
import { PerformanceMonitor } from '../utils/PerformanceMonitor.js';
import { Container } from 'pixi.js';

const INITIAL_WAVE_COOLDOWN = 30;
const BETWEEN_WAVE_COOLDOWN = 15;
const ENEMY_CLICK_RADIUS = 28;

// Most enemies a single frame will hand to Pixi for the first time (see _syncEnemyPixi).
// Ordinary waves trickle in one at a time, so this never matters for them - it's for bursts,
// chiefly a Goliath Frog's 20-strong brood appearing in a single frame: building 20 fresh
// per-frog Graphics at once was a 10-40ms hitch, while 5 a frame is a barely-visible ~4 frame
// stagger (the rest just show up a few frames later, still simulated normally meanwhile).
const MAX_NEW_ENEMY_PIXI_REGISTRATIONS_PER_FRAME = 5;

// Meteor Strike's impact radius in px. Shared by the damage check, the impact ring and the
// targeting preview (see getSpellCastRadius) so they can't drift apart. Unlike Arcane Blast /
// Frozen Nova this isn't part of the spell's own data (spell.radius) and Spell Power
// upgrades don't change it.
const METEOR_STRIKE_RADIUS = 80;

// "r, g, b" per super weapon spell for the targeting overlay (see renderSpellTargeting) -
// matches the hue of each spell's icon and cast effect.
const SPELL_TARGET_COLORS = {
    arcaneBlast: '168, 85, 247',
    frostNova: '96, 213, 250',
    meteorStrike: '249, 115, 22',
    chainLightning: '253, 224, 71'
};

// Dev-only stress-spawn enemy roster (see _devStressSpawn below) - unrelated to sandbox
// mode's actual wave format, which now comes from SandboxLevel.getWaveConfig() like any
// other level.
const SANDBOX_ENEMY_PATTERN = ['basic', 'villager', 'beefyenemy', 'archer', 'mage', 'knight', 'frog'];

// Visual theme for the top-right "active boons" HUD cards (see renderActiveBoons /
// _renderBoonBox below). Each entry supplies the worn-wood gradient stops, bronze/gold
// accent colors and reminder subtitle for one marketplace boon; the item's real name and
// hand-drawn icon come from MarketplaceRegistry itself so the HUD always matches the
// marketplace listing. Module-level so it's built once, never re-allocated per frame.
const ACTIVE_BOON_THEME = {
    'frog-king-bane': {
        accent: '#FF8C00', accentDark: '#7A3D00', textColor: '#FFD700',
        bgTop: 'rgba(62, 40, 16, 0.95)', bgMid: 'rgba(38, 22, 8, 0.96)', bgBottom: 'rgba(16, 8, 2, 0.97)',
        glowTop: 'rgba(255, 140, 0, 0.16)',
        subtitle: 'The spirits of the woods protect you'
    },
    'strange-talisman': {
        accent: '#9D4EDD', accentDark: '#4A1D75', textColor: '#E0AAFF',
        bgTop: 'rgba(42, 22, 58, 0.95)', bgMid: 'rgba(26, 12, 38, 0.96)', bgBottom: 'rgba(12, 5, 20, 0.97)',
        glowTop: 'rgba(157, 78, 221, 0.18)',
        subtitle: 'Legendary loot fortune is doubled'
    },
    'rabbits-foot': {
        accent: '#FFD700', accentDark: '#7A5F00', textColor: '#FFED4E',
        bgTop: 'rgba(58, 46, 10, 0.95)', bgMid: 'rgba(36, 28, 4, 0.96)', bgBottom: 'rgba(16, 12, 0, 0.97)',
        glowTop: 'rgba(255, 215, 0, 0.15)',
        subtitle: 'Treasure fortune is doubled'
    }
};

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
        // Super weapon spell armed for casting on the next canvas click (see
        // activateSpellTargeting), and whether the pointer is currently over the canvas -
        // the targeting overlay is only drawn while it is.
        this.selectedSpell = null;
        this._pointerOverCanvas = false;
        this.currentLevel = 1;
        this.waveIndex = 0;
        this.waveInProgress = false;
        this.waveCompleted = false;
        this.superWeaponLab = null;

        // Eternal Mode: the run's options (Ranked / Hardcore / Custom - see EternalOptions.js),
        // the saved run being resumed (if any), and the snapshot taken when the last wave was
        // completed, which is what the pause menu's Save Progress writes.
        this.eternalOptions = null;
        this.eternalResume = null;
        this._eternalCheckpoint = null;

        // Wave cooldown system
        this.waveCooldownTimer = INITIAL_WAVE_COOLDOWN;
        this.waveCooldownDuration = INITIAL_WAVE_COOLDOWN;
        this.isInWaveCooldown = true; // Start in cooldown
        this.maxWavesForLevel = 10;
        
        // Statistics tracking for results screen
        this.enemiesDefeated = 0;
        this.totalEnemiesSpawned = 0; // Track total enemies spawned across all waves
        this.goldEarnedThisLevel = 0;
        this.startingGold = 200;
        
        // Results screen for level completion / game over. The battlefield UI stays fully
        // usable until it actually appears (level completion waits a few real seconds first so
        // loot can be picked up) and is shut down at that exact moment - see _onResultsScreenShown.
        this.resultsScreen = new ResultsScreen(stateManager);
        this.resultsScreen.onShown = () => this._onResultsScreenShown();

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
            gold: 200,   // Default starting gold (before upgrades)
            wave: 1,     // ALWAYS start at wave 1
            // Eternal Mode custom runs can start with unlimited gold: spending never lowers
            // it, and update() holds `gold` at UNLIMITED_GOLD_AMOUNT so the many places that
            // subtract from it directly can't run it dry either.
            unlimitedGold: false,
            canAfford: function(cost) {
                return this.gold >= cost;
            },
            spend: function(amount) {
                if (this.canAfford(amount)) {
                    if (!this.unlimitedGold) this.gold -= amount;
                    return true;
                }
                return false;
            },
            reset: function() {
                this.health = 20;
                this.gold = 200;
                this.wave = 1;
                this.unlimitedGold = false;
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

        // Reset pause state when entering a new level (bypasses UIManager.setPaused's
        // caller-side hooks, so also clear the CSS hook they'd normally clear - see
        // UIManager.updatePanelPauseState)
        this.isPaused = false;
        document.body.classList.remove('game-paused');

        // Fresh level: forget any results screen (or pending level-complete delay) left over
        // from the last one and give the battlefield UI back - see _onResultsScreenShown
        this.resultsScreen.reset();
        document.body.classList.remove('results-showing');

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

        // Eternal Mode run options (Ranked by default) and the saved run being resumed, if any.
        // A saved run always plays under the options it was saved with.
        this.eternalOptions = null;
        this.eternalResume = null;
        this._eternalCheckpoint = null;
        if (this.levelType === 'sandbox') {
            this.eternalOptions = normalizeEternalOptions(levelInfo.eternalOptions);
            if (levelInfo.eternalResume) {
                if (isValidEternalSnapshot(levelInfo.eternalResume)) {
                    this.eternalResume = levelInfo.eternalResume;
                    this.eternalOptions = normalizeEternalOptions(levelInfo.eternalResume.options);
                } else {
                    console.warn('GameplayState: ignoring an Eternal Mode save this version cannot load');
                }
            }
        }
        const customEternalRun = !!this.eternalOptions && !this.eternalOptions.ranked;

        if (customEternalRun) {
            // Custom run: the player picked the exact starting gold - the settlement's
            // starting-gold bonus doesn't apply on top of it.
            if (this.eternalOptions.startingGold === UNLIMITED_GOLD) {
                this.gameState.unlimitedGold = true;
                this.gameState.gold = UNLIMITED_GOLD_AMOUNT;
            } else {
                this.gameState.gold = this.eternalOptions.startingGold;
            }
        } else if (this.stateManager.upgradeSystem) {
            // Apply upgrade bonuses to starting gold
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
            // Eternal Mode starts exactly like any other level - same starting gold (see
            // `gold: 200` default above, plus the same upgrade bonus applied above), no
            // resources pre-unlocked. The only structural difference is that it never
            // completes (maxWavesForLevel stays Infinity).
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
        // Workshop tokens only drop once the Commander's Workshop upgrade has been purchased,
        // and never for an enemy type the player has already unlocked in the Workshop (see
        // EnemyManager._applyEnemyDefaults)
        this.enemyManager.workshopUnlocked = !!(this.stateManager.upgradeSystem &&
            this.stateManager.upgradeSystem.hasUpgrade('commanders-workshop'));
        this.enemyManager.workshopSystem = this.stateManager.workshopSystem;
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

        // Eternal Mode custom option: every tower and building available from the start
        if (this.eternalOptions && this.eternalOptions.unlockAll) {
            this.towerManager.unlockSystem.unlockEverything();
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

        // Resuming a saved Eternal Mode run: put back everything that was built, then carry
        // on from the start of the wave after the one the save was taken at.
        if (this.eternalResume) {
            try {
                restoreEternalSnapshot(this, this.eternalResume);
                this.waveInProgress = false;
                this.waveCompleted = true;
                this.isInWaveCooldown = true;
                this.waveCooldownTimer = BETWEEN_WAVE_COOLDOWN;
                this.waveCooldownDuration = BETWEEN_WAVE_COOLDOWN;
                // Until the next wave completes, the loaded state is itself the latest checkpoint
                // (so saving straight after loading keeps the run rather than failing).
                this._eternalCheckpoint = this.eternalResume;
                this.uiManager.forceSpellUIRebuild = true;
                this.uiManager.setupSpellUI();
                this.uiManager.updateUI();
                this.uiManager.updateUIAvailability();
            } catch (error) {
                console.error('GameplayState: failed to restore the saved Eternal Mode run:', error);
            }
        }

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
        // Track free placements available this level
        this.freeBuildingPlacements = {};
        this.freeTowerPlacements = {};
        this.applyRabbitsFoot = false;
        this.applyTalisman = false;

        if (!this.stateManager.marketplaceSystem) {
            console.warn('GameplayState: No marketplace system available');
            return;
        }

        const marketplace = this.stateManager.marketplaceSystem;

        // Eternal Mode is meant to test a build on its own merits, so purchased
        // consumables/boons never apply here - and since we never call resetForNewLevel(),
        // nothing gets marked as used either, so nothing is silently wasted on a run
        // that was never going to consume it. (A custom run can opt back in to them.)
        if (this.isSandbox && !(this.eternalOptions && this.eternalOptions.allowConsumables)) {
            marketplace.clearPerLevelState();
            marketplace.rabbitFootActive = false;
            return;
        }

        // Initialize marketplace system for this level
        marketplace.resetForNewLevel();

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
            if (!towerType) return true;
            if (!this.gameState.canAfford(towerType.cost)) return false;
            // Magic Towers past the free-with-gold cap also need a full set of elemental
            // gems (see TowerManager.getMagicTowerGemCost) - factor that in too so the
            // preview doesn't show green while gems are still short.
            if (this.selectedTowerType === 'magic' && this.towerManager) {
                const gemCost = this.towerManager.getMagicTowerGemCost();
                if (gemCost && !this.towerManager.hasEnoughGems(gemCost)) return false;
            }
            // Combination Towers past the free-with-gold cap also need a diamond (see
            // TowerManager.getCombinationTowerDiamondCost) - same treatment as Magic Tower gems.
            if (this.selectedTowerType === 'combination' && this.towerManager) {
                const diamondCost = this.towerManager.getCombinationTowerDiamondCost();
                if (diamondCost && !this.towerManager.hasEnoughGems(diamondCost)) return false;
            }
            return true;
        }
        if (this.selectedBuildingType) {
            if (this.hasFreePlacement(this.selectedBuildingType, false)) return true;
            const buildingType = BuildingRegistry.getBuildingType(this.selectedBuildingType);
            if (!buildingType) return true;
            if (!this.gameState.canAfford(buildingType.cost)) return false;
            // Super Weapon Lab also requires 5 diamonds up front (see
            // BuildingManager.placeBuilding) - factor that in too so the preview doesn't
            // show green while diamonds are still short.
            if (this.selectedBuildingType === 'superweapon' && this.towerManager) {
                const diamondCount = this.towerManager.getGemStocks().diamond || 0;
                if (diamondCount < 5) return false;
            }
            return true;
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

        // Leaving gameplay (e.g. via the results screen's buttons) - drop the results-screen UI lock
        document.body.classList.remove('results-showing');

        // Restore settlement gold to stateManager before leaving
        if (this.settlementGoldBackup !== undefined) {
            this.stateManager.playerGold = this.settlementGoldBackup;
        }
        
        // Commit consumables if they haven't been consumed yet (a mid-level quit - if the
        // level actually ended, completeLevel()/gameOver() already consumed them before
        // this runs, so there's nothing left to commit here).
        if (this.stateManager.marketplaceSystem) {
            const hasConsumablesToCommit = this.stateManager.marketplaceSystem.consumablesToCommit &&
                                          this.stateManager.marketplaceSystem.consumablesToCommit.size > 0;

            if (hasConsumablesToCommit) {
                this.stateManager.marketplaceSystem.commitUsedConsumables();

                // Mirror the updated marketplace/statistics state into the in-memory
                // currentSaveData snapshot only - deliberately NOT written to
                // SaveSystem/localStorage here. Quitting mid-level (as opposed to
                // finishing it, which does checkpoint-save via completeLevel()/gameOver())
                // must stay live-only until the player explicitly saves, otherwise
                // "Quit without saving" silently persists the consumed item anyway.
                if (this.stateManager.currentSaveData && this.stateManager.currentSaveSlot) {
                    this.stateManager.currentSaveData.marketplace = this.stateManager.marketplaceSystem.serialize();

                    if (this.stateManager.gameStatistics) {
                        this.stateManager.currentSaveData.statistics = this.stateManager.gameStatistics.serialize();
                    }
                }
            }
        } else {
            console.warn('  WARNING: No marketplace system available!');
        }
        
        // Transition from level music to settlement music - playDifferentSettlementTheme()
        // crossfades smoothly into the new track instead of hard-cutting.
        // Also stop any victory/defeat sting still playing - it lives on the SFX pool,
        // not the music element, so leaving via a route other than the results-screen
        // buttons (e.g. the pause menu's "quit to menu") would otherwise let it play on.
        if (this.stateManager.audioManager) {
            this.stateManager.audioManager.stopSFXTune();
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
        if (this.defenderRenderAdapter) {
            for (const defender of Array.from(this.defenderRenderAdapter._entries.keys())) {
                this.defenderRenderAdapter.unregister(defender);
            }
            this.defenderRenderAdapter = null;
        }
        // Shared sortable layer the four adapters above add their per-entity containers
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
        this.selectedSpell = null;
        this._pointerOverCanvas = false;
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
        // Fires when the pointer moves onto any element overlapping the canvas too (sidebar,
        // panels, top bar), which is exactly when a spell's casting area should disappear:
        // clicking there can't cast.
        this.mouseLeaveHandler = () => { this._pointerOverCanvas = false; };
        this.stateManager.canvas.addEventListener('mouseleave', this.mouseLeaveHandler);

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

        if (this.mouseLeaveHandler) {
            this.stateManager.canvas.removeEventListener('mouseleave', this.mouseLeaveHandler);
            this.mouseLeaveHandler = null;
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
        // the cached rect (kept fresh by Game's ResizeObserver + resize/orientation
        // listeners - see Game.getCachedCanvasRect).
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
        this._pointerOverCanvas = true;

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
        this._pointerOverCanvas = true;

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
        // Placement and spell targeting are mutually exclusive - both would otherwise want
        // the next canvas click and draw their own preview under the pointer.
        this.clearPlacementSelection();
        this.selectedSpell = spellId;
        
        // Deselect all towers and buildings during spell targeting
        if (this.towerManager) {
            this.towerManager.towers.forEach(tower => tower.isSelected = false);
            this.towerManager.buildingManager.buildings.forEach(building => {
                if (building.deselect) building.deselect();
            });
        }
        
        // Spell targeting is handled inside handleClick() (gated on this.selectedSpell) so it
        // always runs before any other click logic, regardless of listener registration order.
        // The pointer itself becomes the spell's icon (see cursorIcon) with its casting area
        // drawn around it (see renderSpellTargeting). Right-click deselects via
        // cancelSelection() - a `contextmenu` listener on the canvas can't do that job, since
        // game.js swallows that event in the capture phase before it ever reaches the canvas.
    }
    
    cancelSpellTargeting() {
        this.selectedSpell = null;
    }

    /**
     * Icon the pointer should be drawn as right now, or null for the normal sword cursor.
     * Read every frame by CursorOverlay (which owns the game's cursor - see its render()) -
     * while a spell is armed the pointer becomes that spell's icon.
     */
    get cursorIcon() {
        if (!this.selectedSpell || this.isPaused) return null;
        if (this.resultsScreen && this.resultsScreen.isShowing) return null;
        const spell = this.superWeaponLab && this.superWeaponLab.spells[this.selectedSpell];
        return spell ? { id: spell.id, svg: spell.icon } : null;
    }

    /**
     * Radius (px) of the area a spell hits around its cast point, or 0 for a spell with no
     * area (Chain Lightning strikes its nearest targets map-wide instead - see
     * findChainLightningTargets). What the targeting overlay outlines.
     */
    getSpellCastRadius(spell) {
        switch (spell.id) {
            case 'meteorStrike': return METEOR_STRIKE_RADIUS;
            case 'chainLightning': return 0;
            default: return spell.radius || 0;
        }
    }

    /**
     * The `chainCount` enemies nearest to (x, y), nearest first - who Chain Lightning hits,
     * in that order (each successive hit is weaker, see castSpellAtPosition). Used by the cast
     * itself and by the targeting preview so the preview always shows exactly who will be hit.
     *
     * Chain lightning has unlimited range by design (SuperWeaponLab.js's spell definition has
     * no range cap, only chainCount), so it must consider every enemy - SpatialGrid's cell
     * partitioning can't narrow the search the way tower targeting does when the query has to
     * cover the whole map anyway. The actual cost was the full array copy plus O(N log N)
     * sort (with a Math.hypot call per comparison) just to grab the nearest few; a bounded
     * top-K selection removes both without changing which enemies get hit, since chainCount
     * is single digits.
     */
    findChainLightningTargets(x, y, chainCount) {
        const enemies = this.enemyManager.enemies;
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
                if (bestIdx === -1) break; // only enemies with non-finite positions left
                used[bestIdx] = true;
                targets.push(enemies[bestIdx]);
            }
        }
        return targets;
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

        // Bonus levels (e.g. Frog King's Realm) auto-grant a free Super Weapon Lab with a
        // trivial spell cooldown, so casts here shouldn't count toward the Arcane Library
        // achievements ("Construct the Super Weapon Lab", frost-shatter, 100 casts) -
        // those are meant to reflect progression actually earned in a normal campaign level.
        const isBonusLevel = !!this.level?.levelFlags?.isBonusLevel;

        if (!isBonusLevel && this.stateManager.gameStatistics) {
            this.stateManager.gameStatistics.addSuperWeaponSpellCast(1);
        }

        // Apply spell effects to enemies
        switch(spellId) {
            case 'arcaneBlast':
                this.stateManager.audioManager.playSFX('arcane-blast');
                this.enemyManager.enemies.forEach(enemy => {
                    const dist = Math.hypot(enemy.x - x, enemy.y - y);
                    if (dist <= spell.radius) {
                        if (!isBonusLevel && enemy.freezeTimer > 0 && this.stateManager.gameStatistics) {
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
                        // Freeze only - this is a crowd-control spell, not a damage spell
                        // (direct speed manipulation - affects all enemies including frogs)
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
                                if (dist <= METEOR_STRIKE_RADIUS) {
                                    if (!isBonusLevel && enemy.freezeTimer > 0 && this.stateManager.gameStatistics) {
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
                const targets = this.findChainLightningTargets(x, y, spell.chainCount);

                targets.forEach((enemy, index) => {
                    setTimeout(() => {
                        if (!isBonusLevel && enemy.freezeTimer > 0 && this.stateManager.gameStatistics) {
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
        // This auto-place path only runs for levels with the autoPlaceSuperWeaponLab flag
        // (bonus levels like Frog King's Realm), so the free lab shouldn't count toward the
        // "Construct the Super Weapon Lab" Arcane Library achievement - guard explicitly
        // rather than relying on that flag always implying isBonusLevel.
        if (!this.level?.levelFlags?.isBonusLevel && this.stateManager.gameStatistics) {
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
            impact.maxRadius = METEOR_STRIKE_RADIUS;
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

                    // Barricade doesn't aim at enemies - it throws onto a fixed patch
                    // anchored to the path (see BarricadeTower.setPath), so a spot too far
                    // from any path can't reach it at all. Mirrors the same check the
                    // placement preview already renders (LevelBase.barricadeReachesPath),
                    // so a click can never place a tower the preview showed as invalid.
                    const reachesPath = this.selectedTowerType !== 'barricade' ||
                        this.level.barricadeReachesPath(screenX, screenY, this.towerManager);

                    if (reachesPath && this.towerManager.placeTower(this.selectedTowerType, screenX, screenY, gridX, gridY)) {
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
            // Get the actual building size from registry instead of hardcoding 4
            const buildingType = BuildingRegistry.getBuildingType(this.selectedBuildingType);
            const buildingSize = buildingType ? buildingType.size : 4;
            const { gridX, gridY } = this.level.screenToGrid(x, y, buildingSize);

            if (this.level.canPlaceBuilding(gridX, gridY, buildingSize, this.towerManager)) {
                const { screenX, screenY } = this.level.gridToScreen(gridX, gridY, buildingSize);
                
                if (this.towerManager.placeBuilding(this.selectedBuildingType, screenX, screenY, gridX, gridY)) {
                    this.level.placeBuilding(gridX, gridY, buildingSize);

                    // Buildings whose baked art carries its own decorative ring of trees
                    // (Academy, GoldMine) clear real level terrain out of that ring's
                    // footprint on placement - see Building.getClearingRadius's doc
                    // comment for why a Y-sort against real terrain can't do this instead.
                    const placedBuilding = this.towerManager.buildingManager.buildings[this.towerManager.buildingManager.buildings.length - 1];
                    if (placedBuilding && typeof placedBuilding.getClearingRadius === 'function') {
                        const clearingRadius = placedBuilding.getClearingRadius();
                        if (clearingRadius > 0) {
                            const removedTerrain = this.level.clearTerrainNear(gridX, gridY, buildingSize, clearingRadius);
                            if (this.terrainRenderAdapter) {
                                for (const el of removedTerrain) {
                                    this.terrainRenderAdapter.unregister(el);
                                }
                            }
                        }
                    }

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
                        // Bonus levels shouldn't feed the "Construct the Super Weapon Lab"
                        // Arcane Library achievement, since one is already auto-placed for free.
                        if (!this.level?.levelFlags?.isBonusLevel && this.stateManager.gameStatistics) {
                            this.stateManager.gameStatistics.markSuperWeaponLabBuilt();
                        }
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
            if (clickedLoot.isWorkshopToken) {
                this.lootManager.collectToken(clickedLoot);
                if (this.stateManager.workshopSystem) {
                    this.stateManager.workshopSystem.addToken(clickedLoot.enemyType, 1);
                }
            } else {
                this.lootManager.collectLoot(clickedLoot);
            }
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
        // No menus once the results screen is up (the victory animation / defeat screen)
        if (this.resultsScreen && this.resultsScreen.isShowing) return false;
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

    /** Drop any tower/building picked from the sidebar for placement, and its preview. */
    clearPlacementSelection() {
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
    }

    /** Right-click on the canvas (and touch long-press): deselect whatever is armed and close open menus. */
    cancelSelection() {
        // Disarm a super weapon spell (drops its icon cursor and casting area)
        if (this.selectedSpell) {
            this.cancelSpellTargeting();
        }

        this.clearPlacementSelection();

        // Close any open menus
        this.uiManager.closeAllPanels();
    }

    /**
     * The results screen just appeared - the first frame of the victory animation, or the
     * defeat screen. This is THE moment the battlefield is finished with: drop any armed
     * placement/spell, close every open panel and hover info panel, and make the rest of the
     * in-game UI (sidebar, spell hotbar, wave button, pause/speed controls) inert. It stays that
     * way - menus can't be reopened - until the next level's enter().
     */
    _onResultsScreenShown() {
        this.cancelSelection();
        if (this.uiManager) this.uiManager.lockForResults();
    }

    getWaveConfig(level, wave) {
        // Get wave config from the level itself (sandbox included - SandboxLevel defines
        // its own 100-wave getWaveConfig() just like a campaign level).
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
        
        // Traditional wave spawning, driven entirely by the level's getWaveConfig() -
        // sandbox included (SandboxLevel.getWaveConfig() clamps to its last defined wave
        // and keeps reusing it, which is how sandbox stays endless even though
        // maxWavesForLevel is Infinity and completeLevel() never fires for it).
        const waveConfig = this.getWaveConfig(this.currentLevel, this.gameState.wave);

        if (waveConfig && waveConfig.enemyCount > 0) {
            // Track total enemies spawned across all waves
            this.totalEnemiesSpawned += waveConfig.enemyCount;

            // Frog King boss fanfare - plays once when he spawns in the space campaign's final level.
            // preservePlaylistMode=true keeps the campaign-4 playlist active underneath this one-off
            // track (its category, 'boss-fanfare', doesn't match campaign-4, which would otherwise
            // make AudioManager.playMusic() exit playlist mode - see its docs) so that once the
            // fanfare finishes, playback hands back into a random campaign-4 track instead of going
            // silent.
            if (this.currentCampaignId === 'campaign-4' && this.currentLevel === 'level8' &&
                waveConfig.wavePattern && waveConfig.wavePattern.includes('frogking')) {
                this.stateManager.audioManager.playMusic('frog-king-theme', false, true);
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

        // Open panels / armed placement are deliberately NOT cleared here: the player keeps
        // full control of the battlefield through the results screen's delay, and the UI is shut
        // down when the victory animation actually starts (see _onResultsScreenShown).

        // --- Campaign completion detection (single source of truth for this whole method) ---
        // Derived from SaveSystem.getCampaignLevelSequence(), the same ordered level list
        // that already drives level-unlocking, so there's one place to update per campaign.
        const campaignSequence = this.currentCampaignId
            ? SaveSystem.getCampaignLevelSequence(this.currentCampaignId)
            : [];
        const lastLevelForCampaign = campaignSequence[campaignSequence.length - 1];
        const isLastLevel = !!lastLevelForCampaign && (this.currentLevel === lastLevelForCampaign) && !this.isSandbox;
        // Bonus levels (e.g. Frog King's Realm, reached via a realm shard) aren't part of any
        // campaign sequence - the results screen should still only offer "RETURN TO SETTLEMENT",
        // but this must NOT feed into the campaign-completion logic below (isLastLevel stays as-is).
        const isBonusLevel = !!this.level?.levelFlags?.isBonusLevel;
        // Only trigger the Frogerty "campaign complete" narrative and unlock toast the first
        // time this campaign is completed - replaying the last level shouldn't re-fire it.
        const wasAlreadyCompleted = !!(this.stateManager.currentSaveData
            && this.stateManager.currentSaveData.completedCampaigns
            && this.stateManager.currentSaveData.completedCampaigns.includes(this.currentCampaignId));

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
            if (this.stateManager.workshopSystem) {
                saveData.workshop = this.stateManager.workshopSystem.serialize();
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
            const runTimeTaken = Math.round((Date.now() / 1000) - this.levelStartTime);
            const runScore = ResultsScreen.calculateBattleScore({
                enemiesSlain: this.totalEnemiesSpawned,
                timeTaken: runTimeTaken,
                goldRemaining: this.gameState.gold,
                goldEarned: this.goldEarnedThisLevel
            });
            saveData.levelHighScores = SaveSystem.recordLevelHighScore(
                this.currentLevel, this.currentCampaignId, runScore, saveData.levelHighScores || {},
                runTimeTaken, saveData.levelHighScoreTimes || (saveData.levelHighScoreTimes = {})
            );

            // Unlock next level
            saveData.unlockedLevels = SaveSystem.unlockNextLevel(this.currentLevel, saveData.unlockedLevels, this.currentCampaignId);
            
            // Update last played level
            saveData.lastPlayedLevel = this.currentLevel;

            // --- Campaign completion (uses isLastLevel/wasAlreadyCompleted computed above) ---
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

                // Signal to SettlementHub that a campaign was just completed - only on the
                // first-ever completion, so replays don't re-trigger Sir Frogerty's dialogue
                if (!wasAlreadyCompleted) {
                    this.stateManager.justCompletedCampaignId = this.currentCampaignId;
                }
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
        this.resultsScreen.show('levelComplete', {
            level: this.currentLevel,
            wavesCompleted: this.maxWavesForLevel,
            health: this.gameState.health,
            gold: this.gameState.gold,
            enemiesSlain: this.totalEnemiesSpawned, // Use total enemies spawned (all killed to win)
            goldEarned: this.goldEarnedThisLevel,
            currentGold: this.gameState.gold,
            timeTaken: Math.round((Date.now() / 1000) - this.levelStartTime),
            noNextLevel: isLastLevel || isBonusLevel
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

        // deltaTime here is already speed-scaled by game.js's gameLoop (which calls
        // getAdjustedDeltaTime before invoking stateManager.update). Do not scale again -
        // doing so previously squared the multiplier (x3 simulated as x9).
        const adjustedDeltaTime = deltaTime;

        // Unlimited-gold Eternal Mode run: everything that spends gold - including the many
        // places that subtract from it directly - is topped back up here every frame.
        if (this.gameState.unlimitedGold) {
            this.gameState.gold = UNLIMITED_GOLD_AMOUNT;
        }

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
        const tokenDrops = deathResult.tokenDrops || [];

        // Workshop tokens are now a world pickup like loot bags/realm shards - spawn the
        // coin drop here, but only grant it (see the loot-click handling below) once the
        // player actually clicks it to collect it.
        if (tokenDrops.length > 0 && this.stateManager.workshopSystem) {
            for (const drop of tokenDrops) {
                this.lootManager.spawnToken(drop.x, drop.y, drop.enemyType);
            }
        }

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
        }

        if (this._checkWaveCompletion()) return;

        // Run every frame, unconditionally, rather than only after the specific actions
        // that spend/earn gold or gems (tower placement, mine/gem collection, purchases,
        // etc.) - those call sites are easy to miss (e.g. gem collection used to update
        // gold/gem text but not button state), which left tower/building buttons out of
        // sync with the player's actual gold/gem balance until their next unrelated click.
        this.uiManager.updateButtonStates();
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

            // Update freeze timers (Frost Nova's full stop - see TowerManager's per-frame
            // slow resolver for Super Poison/BarricadeTower/Magic Tower water, which all
            // leave freezeTimer alone and defer to it while it's active)
            if (enemy.freezeTimer > 0) {
                enemy.freezeTimer -= deltaTime;
                if (enemy.freezeTimer <= 0 && enemy.originalSpeed) {
                    // Snap back to whatever other slow (if any) is still active instead of
                    // straight to full speed, so ending the freeze doesn't momentarily wipe
                    // out an ongoing Super Poison/BarricadeTower/water slow.
                    const resolvedMult = this.towerManager
                        ? this.towerManager.getResolvedSlowMultiplier(enemy)
                        : 1;
                    enemy.speed = enemy.originalSpeed * resolvedMult;
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
                this._captureEternalCheckpoint();
            }
        }
        return false;
    }

    /**
     * Eternal Mode: remembers the run exactly as it stands the moment a wave is completed -
     * the battlefield is empty, so it's a state that can be resumed faithfully - ready for
     * the pause menu's Save Progress. Nothing is kept for Hardcore runs (no saving there).
     */
    _captureEternalCheckpoint() {
        if (!this.isSandbox || !canSaveEternalRun(this.eternalOptions)) return;
        try {
            this._eternalCheckpoint = captureEternalSnapshot(this);
        } catch (error) {
            console.error('GameplayState: failed to capture the Eternal Mode checkpoint:', error);
        }
    }

    /** Whether the pause menu should offer Save Progress: Eternal Mode, and not Hardcore. */
    canSaveRun() {
        return this.isSandbox && canSaveEternalRun(this.eternalOptions);
    }

    /**
     * The snapshot Save Progress would write right now, or null if there isn't one yet.
     * Between waves the live state already is "the start of the next wave", so it's captured
     * fresh - purchases made during the cooldown are kept. While a wave is being fought,
     * the checkpoint from when the last wave completed is used instead.
     */
    getEternalSaveSnapshot() {
        if (!this.canSaveRun()) return null;
        if (this.isInWaveCooldown && !this.waveInProgress) {
            try {
                return captureEternalSnapshot(this);
            } catch (error) {
                console.error('GameplayState: failed to capture the Eternal Mode run:', error);
            }
        }
        return this._eternalCheckpoint;
    }

    /**
     * Writes the run to the current save slot (Save Progress in the pause menu). Only the
     * saved run itself is written - the rest of the save file is left exactly as it is.
     * @returns {{ok: boolean, wave?: number, reason?: string}}
     */
    saveEternalRun() {
        if (!this.canSaveRun()) return { ok: false, reason: 'not-allowed' };

        const snapshot = this.getEternalSaveSnapshot();
        if (!snapshot) return { ok: false, reason: 'no-checkpoint' };

        const sm = this.stateManager;
        if (!sm.currentSaveData || !sm.currentSaveSlot) return { ok: false, reason: 'no-slot' };

        sm.currentSaveData.eternalSave = snapshot;
        if (!SaveSystem.updateAndSaveSettlementData(sm.currentSaveSlot, { eternalSave: snapshot })) {
            return { ok: false, reason: 'write-failed' };
        }
        // Desktop build: also refresh the on-disk .sav file, as the settlement's own save does
        SaveSystem.persistToFile(sm.currentSaveSlot);
        return { ok: true, wave: snapshot.wave };
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

        // (The battlefield UI is shut down by _onResultsScreenShown() as the defeat screen
        // appears at the end of this method - same moment as the victory animation's start.)

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

            // Sandbox never "completes" (see completeLevel()'s early return above), so
            // gameOver (castle destroyed) is the only run-ending event it ever reaches -
            // record the run's result here, keeping only the best (highest wave) attempt.
            // Ranked and Hardcore Ranked runs each have their own hiscore line; Custom
            // (unranked) runs aren't recorded at all.
            if (this.isSandbox) {
                const scoreField = eternalHighScoreField(this.eternalOptions);
                if (scoreField) {
                    const runTimeTaken = Math.round((Date.now() / 1000) - this.levelStartTime);
                    this.stateManager.currentSaveData[scoreField] = SaveSystem.recordSandboxHighScore(
                        this.gameState.wave, this.enemiesDefeated, runTimeTaken,
                        this.stateManager.currentSaveData[scoreField]
                    );
                }
            }

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
    
    /**
     * Shows where the armed super weapon spell (see activateSpellTargeting) will land: its
     * casting area outlined around the pointer for Arcane Blast / Frozen Nova / Meteor
     * Strike; for Chain Lightning, which has no area, the enemies it would strike instead.
     * Drawn on the Canvas2D layer, which paints above Pixi, in canvas coordinates - the very
     * space the cast's distance checks run in, so the outline is the real radius with no
     * scaling. Only drawn while the pointer is over the canvas (clicking anywhere else can't
     * cast); the pointer itself is drawn as the spell's icon by CursorOverlay.
     */
    renderSpellTargeting(ctx) {
        if (!this.selectedSpell || !this._pointerOverCanvas || this.isPaused || !this.superWeaponLab) return;
        if (this.resultsScreen && this.resultsScreen.isShowing) return;

        const spell = this.superWeaponLab.spells[this.selectedSpell];
        if (!spell) return;

        const x = this.lastMouseX;
        const y = this.lastMouseY;
        const rgb = SPELL_TARGET_COLORS[spell.id] || '255, 255, 255';

        ctx.save();
        if (spell.id === 'chainLightning') {
            this._renderChainLightningPreview(ctx, spell, x, y, rgb);
        } else {
            const radius = this.getSpellCastRadius(spell);
            if (radius > 0) {
                const fill = ctx.createRadialGradient(x, y, 0, x, y, radius);
                fill.addColorStop(0, `rgba(${rgb}, 0.06)`);
                fill.addColorStop(1, `rgba(${rgb}, 0.26)`);
                ctx.fillStyle = fill;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();

                // Marching dashes, so it reads as a live targeting overlay rather than a
                // static shape sitting on the map.
                ctx.strokeStyle = `rgba(${rgb}, 0.9)`;
                ctx.lineWidth = 2;
                ctx.setLineDash([8, 6]);
                ctx.lineDashOffset = -(performance.now() / 40) % 14;
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    /** Chain Lightning has no area: ring the enemies it would strike and link them in strike order, fading with the same 0.8x-per-hit falloff the damage uses. */
    _renderChainLightningPreview(ctx, spell, x, y, rgb) {
        const targets = this.findChainLightningTargets(x, y, spell.chainCount);
        ctx.lineWidth = 2;

        let fromX = x;
        let fromY = y;
        for (let i = 0; i < targets.length; i++) {
            const enemy = targets[i];
            const strength = Math.pow(0.8, i);
            ctx.strokeStyle = `rgba(${rgb}, ${0.35 + 0.55 * strength})`;

            ctx.setLineDash([6, 5]);
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(enemy.x, enemy.y);
            ctx.stroke();

            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, 16, 0, Math.PI * 2);
            ctx.stroke();

            fromX = enemy.x;
            fromY = enemy.y;
        }
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
            this._enemyPixiRegistrationsLeft = MAX_NEW_ENEMY_PIXI_REGISTRATIONS_PER_FRAME;
            for (let i = 0; i < enemies.length; i++) {
                const enemy = enemies[i];
                // Without this, a brand new enemy's first render(ctx) call draws its body
                // to the Canvas2D canvas (skipCanvas2DBodyRender is only flipped by
                // _syncEnemyPixi AFTER this call) - since that canvas paints above Pixi's,
                // the enemy flashes in front of any tree/tower it should spawn behind for
                // one frame. render(ctx) still caches _lastRenderSize unconditionally, so
                // pre-empting the flag here loses nothing.
                if (pixiActive && !enemy.skipCanvas2DBodyRender && typeof enemy.renderStaticBack === 'function') {
                    enemy.skipCanvas2DBodyRender = true;
                }
                // Hit splatters are drawn by enemy.render() itself (every enemy class does),
                // so drawing them again here just doubled the Canvas2D work - and the glow
                // opacity - of every splatter on screen.
                enemy.render(ctx);
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
                    // Draw so the element's actual visual ground-contact point lands on
                    // the center of the single cell markTerrainCells() actually blocks,
                    // not the raw gridX*cellSize grid-line corner - see
                    // LevelBase.getTerrainElementRenderGrid's doc comment (matches
                    // TerrainRenderAdapter.register()'s use of the same helper).
                    // Substitute-and-restore mirrors the trick TerrainRenderAdapter's
                    // bake step already uses to reposition this shared renderer without
                    // touching its internal per-type shift formula.
                    const realGridX = el.gridX, realGridY = el.gridY;
                    const renderGrid = this.level.getTerrainElementRenderGrid(el);
                    el.gridX = renderGrid.gridX;
                    el.gridY = renderGrid.gridY;
                    try {
                        this.level.renderSingleTerrainElement(ctx, el);
                    } finally {
                        el.gridX = realGridX;
                        el.gridY = realGridY;
                    }
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

        // Casting area of the armed super weapon spell, centered on the pointer
        this.renderSpellTargeting(ctx);

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
            // Enemies (not loot bags, which have no such burst and would flash on Canvas2D in
            // the meantime) get a per-frame registration budget - see the constant's doc.
            // Over budget: skip for now, it's still unregistered and picked up next frame.
            if (entity.lootId === undefined) {
                if (this._enemyPixiRegistrationsLeft <= 0) return;
                this._enemyPixiRegistrationsLeft--;
            }
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
            this.defenderRenderAdapter = new DefenderRenderAdapter(this._getPixiEntityLayer(), this.pixiTextureCache);
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

        // Render boon indicators stacked in the top-right area of the screen
        const boxWidth = 280;
        const boxHeight = 60;
        const boxGap = 10;
        const startX = ctx.canvas.width - 300;
        const startY = 20;

        ctx.save();
        ctx.globalAlpha = 0.97;

        let yPos = startY;
        for (const boonId of activeBoons) {
            const theme = ACTIVE_BOON_THEME[boonId];
            if (!theme) continue;
            this._renderBoonBox(ctx, boonId, theme, startX, yPos, boxWidth, boxHeight);
            yPos += boxHeight + boxGap;
        }

        ctx.restore();
    }

    /**
     * Draw one "active boon" HUD card: a worn-wood/gold-trim ornamented panel (matching
     * the game's other HUD chrome - see .control-btn in style.css and the corner trim on
     * AchievementPanel's canvas popups) with a real hand-drawn medallion icon reused from
     * MarketplaceRegistry, instead of the old flat rect + colored dot. Called at most a
     * few times per frame (one per active boon), so per-frame gradients/paths here are
     * fine - the same pattern the marketplace icon drawers themselves already use.
     */
    _renderBoonBox(ctx, boonId, theme, x, y, w, h) {
        const itemDef = MarketplaceRegistry.getItem(boonId);
        const r = 8;

        // Drop shadow + worn-wood gradient panel background
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 3;
        const bg = ctx.createLinearGradient(x, y, x, y + h);
        bg.addColorStop(0, theme.bgTop);
        bg.addColorStop(0.55, theme.bgMid);
        bg.addColorStop(1, theme.bgBottom);
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.fill();
        ctx.restore();

        // Faint accent-colored sheen along the top edge, echoing control-btn's highlight
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.clip();
        const glow = ctx.createLinearGradient(x, y, x, y + h * 0.5);
        glow.addColorStop(0, theme.glowTop);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(x, y, w, h * 0.5);
        ctx.restore();

        // Bronze outer border + brighter accent hairline just inside it
        ctx.beginPath();
        ctx.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, r);
        ctx.strokeStyle = theme.accentDark;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x + 2.5, y + 2.5, w - 5, h - 5, Math.max(r - 2, 2));
        ctx.strokeStyle = theme.accent;
        ctx.globalAlpha *= 0.6;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // Gold corner flourishes on the two top corners
        this._drawBoonCornerTrim(ctx, x, y, 10, true, false);
        this._drawBoonCornerTrim(ctx, x + w, y, 10, false, true);

        // Icon medallion: a recessed socket ring holding the item's real vector icon
        const cx = x + 27;
        const cy = y + h / 2;
        const ringR = 19;
        const socket = ctx.createRadialGradient(cx, cy, 1, cx, cy, ringR);
        socket.addColorStop(0, 'rgba(0, 0, 0, 0.05)');
        socket.addColorStop(0.7, 'rgba(0, 0, 0, 0.35)');
        socket.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.fillStyle = socket;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = theme.accentDark;
        ctx.stroke();
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, ringR - 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = theme.accent;
        ctx.globalAlpha *= 0.8;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        if (itemDef && typeof itemDef.drawIcon === 'function') {
            itemDef.drawIcon(ctx, cx, cy, 30);
        } else {
            // Fallback dot, kept only in case a boon ever lacks a registry icon
            ctx.beginPath();
            ctx.arc(cx, cy, 6, 0, Math.PI * 2);
            ctx.fillStyle = theme.accent;
            ctx.fill();
        }

        // Title (item name) + reminder subtitle
        const textX = x + 54;
        ctx.textAlign = 'left';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetY = 1;

        ctx.font = 'bold 13px Georgia, serif';
        ctx.fillStyle = theme.textColor;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(itemDef ? itemDef.name : boonId, textX, y + 25);

        ctx.font = '11px Georgia, serif';
        ctx.fillStyle = 'rgba(230, 214, 186, 0.85)';
        ctx.fillText(theme.subtitle, textX, y + 42);

        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
    }

    /** Small gold L-shaped corner flourish for a boon card, adapted from AchievementPanel's drawCornerTrim. */
    _drawBoonCornerTrim(ctx, x, y, size, isLeft, isRight) {
        ctx.fillStyle = 'rgba(212, 175, 55, 0.9)';
        if (isLeft) {
            ctx.fillRect(x + 4, y + 4, size, 2);
            ctx.fillRect(x + 4, y + 4, 2, size);
        } else if (isRight) {
            ctx.fillRect(x - 4 - size, y + 4, size, 2);
            ctx.fillRect(x - 6, y + 4, 2, size);
        }
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
