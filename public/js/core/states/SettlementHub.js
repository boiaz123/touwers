import { SaveSystem } from '../systems/SaveSystem.js';
import { GameStatistics } from '../systems/GameStatistics.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import { AchievementPanel } from '../ui/AchievementPanel.js';
import { TrainingGrounds } from '../../entities/buildings/TrainingGrounds.js';
import { TowerForge } from '../../entities/buildings/TowerForge.js';
import { MagicAcademy } from '../../entities/buildings/MagicAcademy.js';
import { Castle } from '../../entities/buildings/Castle.js';
import { GuardPost } from '../../entities/towers/GuardPost.js';
import { SettlementBuildingVisuals, ensureSettlementStaticBake } from '../render/SettlementBuildingVisuals.js';
import { UpgradeSystem } from '../systems/UpgradeSystem.js';
import { MarketplaceSystem } from '../systems/MarketplaceSystem.js';
import { SirFrogerty } from '../../ui/SirFrogerty.js';
import { CampaignRegistry } from '../../game/CampaignRegistry.js';
import { WorkshopSystem } from '../systems/WorkshopSystem.js';
import { WorkshopMenu } from '../ui/WorkshopMenu.js';
import { WorkshopHall } from '../../entities/buildings/WorkshopHall.js';
import * as TerrainRenderer from '../render/TerrainRenderer.js';
import { MusicalScoresMenu } from '../ui/panels/MusicalScoresMenu.js';
import { ArcaneLibraryMenu } from '../ui/panels/ArcaneLibraryMenu.js';
import { ManageSettlementMenu } from '../ui/panels/ManageSettlementMenu.js';
import { UpgradesMenu } from '../ui/panels/UpgradesMenu.js';

/**
 * SettlementHub State
 * Main hub screen displayed after save slot selection or loading a game
 * Features a medieval settlement with interactive buildings and UI elements
 */
export class SettlementHub {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.animationTime = 0;
        this.showContent = true; // Show immediately, no initial delay
        this.contentOpacity = 1; // Fully opaque from the start
        this.fadeInOpacity = 0; // For optional fade-in overlay
        this.enableFadeInOverlay = true; // Professional fade-in effect overlay
        this.lastLoadedSaveSlot = null; // Track which save slot is loaded
        
        // Create actual building instances positioned INSIDE the settlement
        this.settlementBuildings = [];
        
        // Building interactivity - three main buildings are clickable
        this.buildings = [
            { id: 'trainingGrounds', name: 'Training Grounds', action: 'levelSelect', x: 0, y: 0, width: 80, height: 60, hovered: false },
            { id: 'towerForge', name: 'Tower Forge', action: 'upgrades', x: 0, y: 0, width: 80, height: 60, hovered: false },
            { id: 'arcaneLibrary', name: 'Arcane Library', action: 'arcaneLibrary', x: 0, y: 0, width: 80, height: 60, hovered: false },
        ];

        // UI state
        this.activePopup = null;
        this.upgradesPopup = null;
        this.optionsPopup = null;
        this.arcaneLibraryPopup = null;
        this.musicalScoresPopup = null;
        this.achievementPanelPopup = null;
        this.workshopPopup = null;
        this.buildingPositions = {};
        
        // Animation state
        this.buildingAnimations = {};
        
        // Pre-rendered scene for instant loading
        this.preRenderedScene = null;
        this.isFirstRender = true;
        
        // Track settlement start time for playtime statistics
        this.settlementStartTime = 0;

        // Sir Frogerty - the frog adviser
        this.sirFrogerty = null;

        // Bard character near the fountain
        this.bardNoteAnim = 0;
        this.bardHovered = false;
        // Shuffle queue so the bard never repeats until all tracks have been played
        this.bardShuffleQueue = [];
        // Cooldown to prevent click-through when SirFrogerty closes
        this._postSirFrogertyCooldown = 0;
    }

    enter() {
        // Hide game UI
        const statsBar = document.getElementById('stats-bar');
        const sidebar = document.getElementById('tower-sidebar');

        if (statsBar) {
            statsBar.style.display = 'none';
        }
        if (sidebar) {
            sidebar.style.display = 'none';
        }

        // Track settlement start time for playtime statistics
        this.settlementStartTime = Date.now() / 1000;

        // Reset animation - content is shown immediately
        this.animationTime = 0;
        this.showContent = true;
        this.contentOpacity = 1;
        this.fadeInOpacity = 0; // Fade-in overlay starts transparent
        this.isFirstRender = true; // Force pre-render on next render
        this.activePopup = null;
        this._postSirFrogertyCooldown = 0;
        this._sbCache = null; // Rebuild building sub-caches after settlementBuildings repopulates
        this._sceneBehindCanvas = null; // Rebuild baked static scene layers (terrain/walls/paths)
        this._sceneFrontOverlayCanvas = null;
        
        // Load settlement data from the current save slot
        // This includes gold, inventory, upgrades, and unlock progression
        const currentSaveData = SaveSystem.getSave(this.stateManager.currentSaveSlot);
        this.commanderName = currentSaveData?.commanderName || 'Commander';

        // Detect if we've switched save slots
        const saveSlotChanged = this.lastLoadedSaveSlot !== this.stateManager.currentSaveSlot;
        const returningFromLevel = this.stateManager.previousState === 'game';
        // Detect explicit load-game reload — must always re-initialize session state from save
        const comingFromLoad = this.stateManager.previousState === 'loadGame';
        
        if (currentSaveData) {
            // Initialize player gold from save data, but not if we're returning from a level
            // (in that case, the level exit() already restored the correct gold amount)
            if (!returningFromLevel) {
                this.stateManager.playerGold = currentSaveData.playerGold || 0;
            }
            
            // Load inventory from save, but only if not returning from a level
            // When returning from level, keep the inventory we already have in memory
            if (!returningFromLevel) {
                this.stateManager.playerInventory = currentSaveData.playerInventory || [];
            }
            
            // Initialize upgrade system - always reinitialize if save slot changed or explicit reload
            if (saveSlotChanged || !this.stateManager.upgradeSystem || comingFromLoad) {
                this.stateManager.upgradeSystem = new UpgradeSystem();
                if (currentSaveData.upgrades) {
                    this.stateManager.upgradeSystem.restoreFromSave(currentSaveData.upgrades);
                }
            }
            
            // Initialize marketplace system
            // ALWAYS reinitialize if save slot changed, returning from a level, or explicit reload
            if (saveSlotChanged || !this.stateManager.marketplaceSystem || returningFromLevel || comingFromLoad) {
                this.stateManager.marketplaceSystem = new MarketplaceSystem();
                if (currentSaveData.marketplace) {
                    this.stateManager.marketplaceSystem.restoreFromSave(currentSaveData.marketplace);
                }
            }

            // Initialize Workshop system (unlocked enemy types/campaign themes + tokens)
            if (saveSlotChanged || !this.stateManager.workshopSystem || comingFromLoad) {
                this.stateManager.workshopSystem = new WorkshopSystem();
                if (currentSaveData.workshop) {
                    this.stateManager.workshopSystem.restoreFromSave(currentSaveData.workshop);
                }
            }

            // Initialize game statistics
            // ALWAYS reinitialize if save slot changed, or if not already done, or if returning from level
            if (saveSlotChanged || !this.stateManager.gameStatistics || returningFromLevel) {
                this.stateManager.gameStatistics = new GameStatistics();
                if (currentSaveData.statistics) {
                    this.stateManager.gameStatistics.restoreFromSave(currentSaveData.statistics);
                }
            }

            // Initialize achievement system
            if (saveSlotChanged || !this.stateManager.achievementSystem) {
                this.stateManager.achievementSystem = new AchievementSystem();
                if (currentSaveData.achievements) {
                    this.stateManager.achievementSystem.restoreFromSave(currentSaveData.achievements);
                }
                // Silently mark any achievements already earned from prior play
                this.stateManager.achievementSystem.checkAchievements(
                    this.stateManager.gameStatistics, currentSaveData, true
                );
            }
        } else {
            // No save data found, initialize with defaults
            this.stateManager.playerGold = 0;
            if (!this.stateManager.playerInventory || this.stateManager.playerInventory.length === 0) {
                this.stateManager.playerInventory = [];
            }
            if (saveSlotChanged || !this.stateManager.upgradeSystem) {
                this.stateManager.upgradeSystem = new UpgradeSystem();
            }
            // Always create new marketplace system for empty slot
            this.stateManager.marketplaceSystem = new MarketplaceSystem();
            // Always create new Workshop system for empty slot
            this.stateManager.workshopSystem = new WorkshopSystem();
            // Always create new statistics for empty slot
            this.stateManager.gameStatistics = new GameStatistics();
            // Always create new achievement system for empty slot
            this.stateManager.achievementSystem = new AchievementSystem();
        }
        
        // Remember which save slot is loaded
        this.lastLoadedSaveSlot = this.stateManager.currentSaveSlot;

        // Ensure achievement banners can play their unlock sound
        if (this.stateManager.achievementSystem && this.stateManager.audioManager) {
            this.stateManager.achievementSystem.setAudioManager(this.stateManager.audioManager);
        }

        // Refresh CampaignRegistry lock/unlock state from saved data
        CampaignRegistry.loadFromSaveData(currentSaveData);

        // Ensure Sir Frogerty instance exists (shared across all visits)
        if (!this.sirFrogerty) {
            this.sirFrogerty = new SirFrogerty(this.stateManager);
        }

        // Show Sir Frogerty's intro dialogue when starting a brand-new game
        const isNewGame = this.stateManager.previousState === 'saveSlotSelection';
        if (isNewGame) {
            this.sirFrogerty.show();
        }

        // Show Sir Frogerty campaign-completion dialogue when returning from a completed campaign
        const justCompletedCampaign = this.stateManager.justCompletedCampaignId;
        if (justCompletedCampaign && !isNewGame) {
            const completionPages = this.sirFrogerty.getCampaignCompletionPages(justCompletedCampaign);
            if (completionPages) {
                this.sirFrogerty.showWithPages(completionPages);
            }
            // Clear the flag so it only fires once
            this.stateManager.justCompletedCampaignId = null;
        }
        
        // Reset all popup hover states
        if (this.upgradesPopup && this.upgradesPopup.tabButtons) {
            this.upgradesPopup.tabButtons = this.upgradesPopup.tabButtons.map(b => ({ ...b, hovered: false }));
        }
        if (this.optionsPopup && this.optionsPopup.buttons) {
            this.optionsPopup.buttons = this.optionsPopup.buttons.map(b => ({ ...b, hovered: false }));
            this.optionsPopup.closeButtonHovered = false;
        }
        if (this.arcaneLibraryPopup && this.arcaneLibraryPopup.tabs) {
            this.arcaneLibraryPopup.tabs = this.arcaneLibraryPopup.tabs.map(b => ({ ...b, hovered: false }));
            this.arcaneLibraryPopup.closeButtonHovered = false;
        }
        if (this.workshopPopup && this.workshopPopup.tabs) {
            this.workshopPopup.tabs = this.workshopPopup.tabs.map(b => ({ ...b, hovered: false }));
            this.workshopPopup.closeButtonHovered = false;
        }
        if (this.achievementPanelPopup) {
            this.achievementPanelPopup.closeButtonHovered = false;
        }
        
        // Play settlement theme music - pick random settlement song and loop it
        // BUT: If settlement music is already playing, keep it (don't restart)
        // Also: If player manually selected a music track from Arcane Library, keep it
        if (this.stateManager.audioManager) {
            const currentTrack = this.stateManager.audioManager.getCurrentTrack();
            const settlementTracks = this.stateManager.audioManager.getSettlementTracks();
            const isManualMusic = this.stateManager.audioManager.isManualMusicSelection;
            
            // If a player manually selected music from the library, keep playing it (don't interrupt)
            if (isManualMusic) {
                // Leave it as is - don't change tracks
            }
            // If settlement music is already playing, keep it
            else if (settlementTracks.includes(currentTrack)) {
                // Leave it as is - don't restart
            }
            // Otherwise, start a new settlement theme
            else {
                this.stateManager.audioManager.playRandomSettlementTheme();
            }
        }
        
        // Create settlement building instances positioned WITHIN the settlement boundary
        const canvas = this.stateManager.canvas;
        const centerX = canvas.width / 2;  // Settlement center X
        const centerY = canvas.height * 0.76;  // Settlement center Y - lower on screen
        const sf = canvas.width / 1920;  // Scale factor relative to 1920×1080 base resolution
        this._sf = sf; // Store for use in hit-detection and render helpers

        // Main buildings positioned strategically
        // Training Grounds OUTSIDE the settlement to the left (as per user request)
        // Other buildings spread naturally INSIDE the boundary
        const workshopUnlocked = !!(this.stateManager.upgradeSystem &&
            this.stateManager.upgradeSystem.hasUpgrade('commanders-workshop'));
        this.settlementBuildings = [
            // === MAIN INTERACTIVE BUILDINGS ===
            // Training Grounds - EXTERIOR: outside the wall to the left
            {
                building: new TrainingGrounds(centerX - 720 * sf, centerY, 0, 0),
                scale: 1,
                clickable: true,
                action: 'levelSelect',
                exterior: true
            },
            // Tower Forge - INTERIOR: inside upper right area
            {
                building: new TowerForge(centerX + 160 * sf, centerY - 50 * sf, 1, 0),
                scale: 30 * sf,
                clickable: true,
                action: 'upgrades',
                exterior: false
            },
            // Arcane Library - INTERIOR: inside upper left area
            {
                building: new MagicAcademy(centerX - 130 * sf, centerY - 55 * sf, 1, 0),
                scale: 29 * sf,
                clickable: true,
                action: 'arcaneLibrary',
                exterior: false
            },
            // Castle - EXTERIOR: outside the wall to the right
            {
                building: new Castle(centerX + 700 * sf, centerY - 80 * sf, 0, 0),
                scale: 29 * sf,
                clickable: true,
                action: 'options',
                exterior: true
            },

            // Workshop - EXTERIOR: only appears once the Commander's Workshop upgrade is
            // purchased (see UpgradesMenu.handleItemAction's 'commanders-workshop' branch,
            // which calls _addWorkshopBuilding() to insert this without a full re-enter()).
            ...(workshopUnlocked ? [{
                building: new WorkshopHall(centerX + 440 * sf, centerY + 165 * sf, 0, 0),
                scale: 24 * sf,
                clickable: true,
                action: 'workshop',
                exterior: true
            }] : []),

            // === GUARD POST QUARTERS (BARRACKS) ===
            // Left cluster — a couple of these are town houses instead (see
            // this.townHouses below) so the cluster isn't 8 identical guard posts
            {
                building: new GuardPost(centerX - 260 * sf, centerY - 20 * sf, 0, 0),
                scale: 0.65 * sf,
                clickable: false,
                action: null
            },
            {
                building: new GuardPost(centerX - 220 * sf, centerY + 20 * sf, 0, 0),
                scale: 0.65 * sf,
                clickable: false,
                action: null
            },
            {
                building: new GuardPost(centerX - 180 * sf, centerY + 15 * sf, 0, 0),
                scale: 0.65 * sf,
                clickable: false,
                action: null
            },
            // Right cluster
            {
                building: new GuardPost(centerX + 165 * sf, centerY + 15 * sf, 0, 0),
                scale: 0.65 * sf,
                clickable: false,
                action: null
            },
            {
                building: new GuardPost(centerX + 240 * sf, centerY + 20 * sf, 0, 0),
                scale: 0.65 * sf,
                clickable: false,
                action: null
            }
        ];

        // Decorative town houses — plain descriptors (not building-class instances),
        // rendered through the Y-sorted interior building pass (see
        // renderSettlementBuildings) so they layer correctly with everything else.
        this.townHouses = [
            // Top row — fills the gap between Magic Academy and Tower Forge
            { x: centerX - 74 * sf, y: centerY - 116 * sf, scale: 0.85 * sf, variant: 0 },
            { x: centerX + 2 * sf,  y: centerY - 126 * sf, scale: 0.8 * sf,  variant: 1 },
            { x: centerX + 77 * sf, y: centerY - 113 * sf, scale: 0.85 * sf, variant: 2 },
            // Mixed into the left guard-post cluster for variety
            { x: centerX - 240 * sf, y: centerY - 60 * sf, scale: 0.7 * sf, variant: 1 },
            { x: centerX - 200 * sf, y: centerY - 30 * sf, scale: 0.65 * sf, variant: 2 },
            // Mixed into the right guard-post cluster
            { x: centerX + 180 * sf, y: centerY + 35 * sf, scale: 0.7 * sf, variant: 0 }
        ];
        
        this.setupMouseListeners();
    }

    /**
     * Inserts the Workshop building into the already-built settlementBuildings array
     * immediately after the Commander's Workshop upgrade is purchased, so the player
     * doesn't have to leave and re-enter the Settlement Hub to see it appear.
     * (enter() already inserts it up front on future visits via the workshopUnlocked check.)
     */
    _addWorkshopBuilding() {
        if (this.settlementBuildings.some(item => item.action === 'workshop')) return;
        const canvas = this.stateManager.canvas;
        const sf = this._sf || (canvas.width / 1920);
        const centerX = canvas.width / 2;
        const centerY = canvas.height * 0.76;
        this.settlementBuildings.push({
            building: new WorkshopHall(centerX + 440 * sf, centerY + 165 * sf, 0, 0),
            scale: 24 * sf,
            clickable: true,
            action: 'workshop',
            exterior: true
        });
        // Invalidate the cached filtered/sorted subsets renderSettlementBuildings() builds once
        // and reuses (see its own comment: "buildings never move or change identity at runtime").
        this._sbCache = null;
    }

    exit() {
        // Record settlement time to statistics (in-memory only, not saved here)
        if (this.stateManager.gameStatistics && this.settlementStartTime > 0) {
            const settlementPlaytime = (Date.now() / 1000) - this.settlementStartTime;
            this.stateManager.gameStatistics.addPlaytime(settlementPlaytime);
        }
        
        // NO auto-save on exit — saves happen only via explicit player action
        // (SAVE SETTLEMENT button, SAVE & QUIT button, or level defeat/victory)
        
        // Clear manual music selection flag when exiting settlement
        if (this.stateManager.audioManager) {
            this.stateManager.audioManager.isManualMusicSelection = false;
        }
        
        this.removeMouseListeners();
    }

    setupMouseListeners() {
        this.mouseMoveHandler = (e) => this.handleMouseMove(e);
        // Note: clicks are NOT bound here. game.js's global canvas 'click' listener
        // already routes through GameStateManager.handleClick() to this.handleClick() -
        // binding our own listener too would fire handleClick() twice per click.
        this.stateManager.canvas.addEventListener('mousemove', this.mouseMoveHandler);

        // Add wheel event listener for scrolling in upgrade tiles
        this.wheelHandler = (e) => {
            // Only handle wheel events when upgrades panel is open
            if (this.activePopup === 'upgrades' && this.upgradesPopup && this.upgradesPopup.isOpen) {
                e.preventDefault();
                const rect = this._getCanvasRect();
                const scaleX = this.stateManager.canvas.width / rect.width;
                const scaleY = this.stateManager.canvas.height / rect.height;
                const x = (e.clientX - rect.left) * scaleX;
                const y = (e.clientY - rect.top) * scaleY;
                this.upgradesPopup.handleWheel(x, y, e.deltaY, e.deltaMode);
            }
        };
        this.stateManager.canvas.addEventListener('wheel', this.wheelHandler, { passive: false });
    }

    removeMouseListeners() {
        if (this.mouseMoveHandler) {
            this.stateManager.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
        }
        if (this.wheelHandler) {
            this.stateManager.canvas.removeEventListener('wheel', this.wheelHandler);
        }
    }

    // getBoundingClientRect() forces a synchronous layout read. handleMouseMove fires on
    // every mousemove and wheelHandler above fires on every wheel tick, so both route
    // through Game's cached rect (see Game.getCachedCanvasRect, kept fresh by its
    // ResizeObserver + resize/orientation listeners) instead of paying a forced reflow
    // per input event - the same fix GameplayState.js's handleMouseMove uses (see commit
    // "full screen back, mouse fix?"). This is exactly the mouse-lag bug that fix solved,
    // just left unported to this file - do NOT replace this with a direct
    // canvas.getBoundingClientRect() call, that reintroduces the stutter in the Settlement Hub.
    _getCanvasRect() {
        return this.stateManager.game
            ? this.stateManager.game.getCachedCanvasRect()
            : this.stateManager.canvas.getBoundingClientRect();
    }

    handleMouseMove(e) {
        const rect = this._getCanvasRect();
        // Account for CSS scaling
        const scaleX = this.stateManager.canvas.width / rect.width;
        const scaleY = this.stateManager.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // Achievement banner sits on top of everything (including open popups)
        if (this.stateManager.achievementSystem &&
            this.stateManager.achievementSystem.isBannerHovered(x, y, this.stateManager.canvas)) {
            this.stateManager.canvas.style.cursor = 'pointer';
            return;
        }

        // If popup is active, update its hover state
        if (this.activePopup === 'upgrades' && this.upgradesPopup) {
            this.upgradesPopup.updateHoverState(x, y);
        } else if (this.activePopup === 'options' && this.optionsPopup) {
            this.optionsPopup.updateHoverState(x, y);
        } else if (this.activePopup === 'arcaneLibrary' && this.arcaneLibraryPopup) {
            this.arcaneLibraryPopup.updateHoverState(x, y);
        } else if (this.activePopup === 'musicalScores' && this.musicalScoresPopup) {
            this.musicalScoresPopup.updateHoverState(x, y);
        } else if (this.activePopup === 'achievementPanel' && this.achievementPanelPopup) {
            this.achievementPanelPopup.updateHoverState(x, y);
        } else if (this.activePopup === 'workshop' && this.workshopPopup) {
            this.workshopPopup.updateHoverState(x, y);
        } else {
            // Check settlement building hover states. Hit-tested inline (no per-building
            // bounds object) and via .some() (stops at the first hit) since this reruns on
            // every mousemove - allocating a fresh {x,y,width,height} per building per event
            // was generating constant GC garbage and was a real contributor to the Settlement
            // Hub's mouse lag. Keep it allocation-free if you touch this again.
            const sf = this._sf || 1;
            const isHoveringBuilding = this.settlementBuildings.some(item => {
                if (!item.clickable) return false;
                let hx, hy, hw, hh;
                if (item.building instanceof TrainingGrounds) {
                    const hitR = 150 * sf;
                    hx = item.building.x - hitR;
                    hy = item.building.y - hitR;
                    hw = hitR * 2;
                    hh = hitR * 2;
                } else {
                    const size = item.scale * 4;
                    hx = item.building.x - size / 2;
                    hy = item.building.y - size / 2;
                    hw = size;
                    hh = size;
                }
                return x >= hx && x <= hx + hw && y >= hy && y <= hy + hh;
            });
            // Update Sir Frogerty button hovers
            if (this.sirFrogerty) {
                const overFrog = this.sirFrogerty.handleMouseMove(x, y, this.stateManager.canvas);
                if (overFrog || this.sirFrogerty.prevButtonHovered || this.sirFrogerty.nextButtonHovered || this.sirFrogerty.closeButtonHovered) {
                    this.stateManager.canvas.style.cursor = 'pointer';
                    return;
                }
            }
            // Check bard hover (only if musical-equipment upgrade purchased)
            const upgradeSystem = this.stateManager?.upgradeSystem;
            const bardUnlocked = upgradeSystem && upgradeSystem.hasUpgrade('musical-equipment');
            const _sfBard = this._sf || 1;
            const bardX = this.stateManager.canvas.width / 2 + 58 * _sfBard;
            const bardY = this.stateManager.canvas.height * 0.76 - 15 * _sfBard;
            const isHoveringBard = bardUnlocked && Math.hypot(x - bardX, y - bardY) < 22 * _sfBard;
            this.bardHovered = isHoveringBard;
            this.stateManager.canvas.style.cursor = isHoveringBuilding || isHoveringBard || this.activePopup ? 'pointer' : 'default';
        }
    }

    handleClick(x, y) {
        // Achievement banner sits on top of everything (including open popups)
        // and intercepts clicks first — opens straight to that achievement's detail view.
        if (this.stateManager.achievementSystem) {
            const clickedId = this.stateManager.achievementSystem.handleBannerClick(x, y, this.stateManager.canvas);
            if (clickedId) {
                this.openAchievementPanel(clickedId);
                return;
            }
        }

        // Sir Frogerty intercepts clicks first
        if (this.sirFrogerty && this.sirFrogerty.visible && !this.activePopup) {
            if (this.sirFrogerty.handleClick(x, y, this.stateManager.canvas)) {
                if (!this.sirFrogerty.visible) {
                    this._postSirFrogertyCooldown = 0.5;
                }
                return;
            }
        }

        // Block building clicks briefly after SirFrogerty closes to prevent click-through
        if (this._postSirFrogertyCooldown > 0) return;

        // If popup is active, delegate click to popup
        if (this.activePopup === 'upgrades' && this.upgradesPopup) {
            this.upgradesPopup.handleClick(x, y);
            return;
        } else if (this.activePopup === 'options' && this.optionsPopup) {
            this.optionsPopup.handleClick(x, y);
            return;
        } else if (this.activePopup === 'arcaneLibrary' && this.arcaneLibraryPopup) {
            this.arcaneLibraryPopup.handleClick(x, y);
            return;
        } else if (this.activePopup === 'musicalScores' && this.musicalScoresPopup) {
            this.musicalScoresPopup.handleClick(x, y);
            return;
        } else if (this.activePopup === 'achievementPanel' && this.achievementPanelPopup) {
            this.achievementPanelPopup.handleClick(x, y);
            return;
        } else if (this.activePopup === 'workshop' && this.workshopPopup) {
            this.workshopPopup.handleClick(x, y);
            return;
        }

        // Check bard click (only if musical-equipment upgrade purchased)
        const canvas = this.stateManager.canvas;
        const bardUpgradeSystem = this.stateManager?.upgradeSystem;
        if (bardUpgradeSystem && bardUpgradeSystem.hasUpgrade('musical-equipment')) {
            const _sfClick = this._sf || 1;
            const bardX = canvas.width / 2 + 58 * _sfClick;
            const bardY = canvas.height * 0.76 - 15 * _sfClick;
            if (Math.hypot(x - bardX, y - bardY) < 22 * _sfClick) {
                this.onBardClick();
                return;
            }
        }

        // Check settlement building clicks
        this.settlementBuildings.forEach(item => {
            if (item.clickable) {
                const sf = this._sf || 1;
                let bounds;
                if (item.building instanceof TrainingGrounds) {
                    const hitR = 150 * sf;
                    bounds = {
                        x: item.building.x - hitR,
                        y: item.building.y - hitR,
                        width: hitR * 2,
                        height: hitR * 2
                    };
                } else {
                    const size = item.scale * 4;
                    bounds = {
                        x: item.building.x - size / 2,
                        y: item.building.y - size / 2,
                        width: size,
                        height: size
                    };
                }

                if (x >= bounds.x && x <= bounds.x + bounds.width &&
                    y >= bounds.y && y <= bounds.y + bounds.height) {
                    this.onBuildingClick(item);
                }
            }
        });
    }

    onBuildingClick(buildingItem) {
        if (buildingItem.action === 'levelSelect') {
            this.stateManager.changeState('campaignMenu');
        } else if (buildingItem.action === 'upgrades') {
            this.activePopup = 'upgrades';
            if (!this.upgradesPopup) {
                this.upgradesPopup = new UpgradesMenu(this.stateManager, this);
            }
            this.upgradesPopup.open();
        } else if (buildingItem.action === 'options') {
            this.activePopup = 'options';
            if (!this.optionsPopup) {
                this.optionsPopup = new ManageSettlementMenu(this.stateManager, this);
            }
            this.optionsPopup.open();
        } else if (buildingItem.action === 'arcaneLibrary') {
            this.activePopup = 'arcaneLibrary';
            if (!this.arcaneLibraryPopup) {
                this.arcaneLibraryPopup = new ArcaneLibraryMenu(this.stateManager, this);
            }
            this.arcaneLibraryPopup.open();
        } else if (buildingItem.action === 'workshop') {
            this.activePopup = 'workshop';
            if (!this.workshopPopup) {
                this.workshopPopup = new WorkshopMenu(this.stateManager, this);
            }
            this.workshopPopup.open();
        }
    }

    closePopup() {
        this.activePopup = null;
    }

    /** Opens the standalone Achievement Panel, optionally jumping straight to a
     *  specific achievement's detail view (e.g. when its unlock banner is clicked). */
    openAchievementPanel(focusAchievementId = null) {
        this.activePopup = 'achievementPanel';
        if (!this.achievementPanelPopup) {
            this.achievementPanelPopup = new AchievementPanel(this.stateManager, this);
        }
        this.achievementPanelPopup.open(focusAchievementId);
    }

    renderBard(ctx, x, y) {
        ctx.save();
        const t = this.bardNoteAnim;
        const sway = Math.sin(t * 1.8) * 1.5;

        // Hover highlight ring removed

        // --- Breeches / legs (dark warm brown) ---
        ctx.fillStyle = '#2A1806';
        // Left leg
        ctx.beginPath();
        ctx.moveTo(x - 6, y + 8);
        ctx.lineTo(x - 2, y + 8);
        ctx.lineTo(x - 3, y + 20);
        ctx.lineTo(x - 7, y + 20);
        ctx.closePath();
        ctx.fill();
        // Right leg
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 8);
        ctx.lineTo(x + 6, y + 8);
        ctx.lineTo(x + 7, y + 20);
        ctx.lineTo(x + 3, y + 20);
        ctx.closePath();
        ctx.fill();

        // Stockings below knee (lighter brown)
        ctx.fillStyle = '#3D2809';
        ctx.fillRect(x - 7, y + 16, 5, 5);
        ctx.fillRect(x + 2, y + 16, 5, 5);

        // Knee bands (gold)
        ctx.fillStyle = '#C8951C';
        ctx.fillRect(x - 7, y + 15, 5, 2);
        ctx.fillRect(x + 2, y + 15, 5, 2);

        // Pointed shoes
        ctx.fillStyle = '#150D05';
        // Left shoe — pointed toe
        ctx.beginPath();
        ctx.moveTo(x - 7, y + 21);
        ctx.lineTo(x - 2, y + 21);
        ctx.lineTo(x, y + 23);
        ctx.lineTo(x - 8, y + 23);
        ctx.lineTo(x - 9, y + 22);
        ctx.closePath();
        ctx.fill();
        // Right shoe
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 21);
        ctx.lineTo(x + 7, y + 21);
        ctx.lineTo(x + 9, y + 22);
        ctx.lineTo(x + 8, y + 23);
        ctx.lineTo(x + 2, y + 23);
        ctx.closePath();
        ctx.fill();
        // Small buckles
        ctx.fillStyle = '#C8951C';
        ctx.fillRect(x - 7, y + 21, 2, 1);
        ctx.fillRect(x + 5, y + 21, 2, 1);

        // --- Doublet body (forest green, layered) ---
        const bodyGrad = ctx.createLinearGradient(x - 9, y - 4, x + 9, y + 10);
        bodyGrad.addColorStop(0, '#2E5A18');
        bodyGrad.addColorStop(0.4, '#274E14');
        bodyGrad.addColorStop(1, '#18320C');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.moveTo(x - 9, y - 4);
        ctx.lineTo(x + 9, y - 4);
        ctx.lineTo(x + 8, y + 12);
        ctx.lineTo(x - 8, y + 12);
        ctx.closePath();
        ctx.fill();

        // Gold trim edges on doublet
        ctx.strokeStyle = '#C8951C';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x - 9, y - 4);
        ctx.lineTo(x - 8, y + 12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 9, y - 4);
        ctx.lineTo(x + 8, y + 12);
        ctx.stroke();

        // Center button row
        ctx.fillStyle = '#C8951C';
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(x, y - 2 + i * 3.5, 0.9, 0, Math.PI * 2);
            ctx.fill();
        }

        // Gold belt
        ctx.fillStyle = '#C8951C';
        ctx.fillRect(x - 9, y + 9, 18, 2.5);
        // Belt buckle
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x - 2, y + 9, 4, 2.5);

        // Cream undershirt — visible at sleeves
        ctx.fillStyle = '#F5ECD7';
        ctx.fillRect(x - 11, y, 4, 7);
        ctx.fillRect(x + 7, y, 4, 7);

        // --- Lute (pear-shaped, sways with bard) ---
        const luteAngle = Math.sin(t * 2.5) * 0.2;
        ctx.save();
        ctx.translate(x + 11, y + 3);
        ctx.rotate(luteAngle);
        // Lute body — pear shape
        ctx.beginPath();
        ctx.ellipse(0, 2, 5, 7, 0, 0, Math.PI * 2);
        const luteGrad = ctx.createRadialGradient(-1.5, -1, 1, 0, 2, 7);
        luteGrad.addColorStop(0, '#C8843A');
        luteGrad.addColorStop(0.6, '#8B5A1A');
        luteGrad.addColorStop(1, '#4A2D08');
        ctx.fillStyle = luteGrad;
        ctx.fill();
        ctx.strokeStyle = '#3A2006';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        // Sound hole
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath();
        ctx.arc(0, 3, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#C8843A';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        // Neck
        const neckGrad = ctx.createLinearGradient(-1, -14, 1, -5);
        neckGrad.addColorStop(0, '#B07830');
        neckGrad.addColorStop(1, '#7A4A10');
        ctx.fillStyle = neckGrad;
        ctx.fillRect(-1.5, -13, 3, 10);
        // Peg box at top
        ctx.fillStyle = '#5A3008';
        ctx.fillRect(-2, -16, 4, 4);
        // Frets
        ctx.strokeStyle = 'rgba(200,200,200,0.5)';
        ctx.lineWidth = 0.5;
        for (let f = 0; f < 4; f++) {
            ctx.beginPath();
            ctx.moveTo(-1.5, -11 + f * 2.5);
            ctx.lineTo(1.5, -11 + f * 2.5);
            ctx.stroke();
        }
        // Strings
        ctx.lineWidth = 0.4;
        for (let s = -1; s <= 1; s++) {
            ctx.strokeStyle = s === 0 ? '#E0E0E0' : 'rgba(200,200,200,0.7)';
            ctx.beginPath();
            ctx.moveTo(s * 1.2, -13);
            ctx.lineTo(s * 1.5, 7);
            ctx.stroke();
        }
        ctx.restore();

        // --- Arm holding lute ---
        ctx.strokeStyle = '#2E5A18';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x + 3, y);
        ctx.quadraticCurveTo(x + 8, y + 1, x + 11, y + 3);
        ctx.stroke();
        // Left arm (resting)
        ctx.beginPath();
        ctx.moveTo(x - 3, y);
        ctx.quadraticCurveTo(x - 8, y + 3, x - 9, y + 7);
        ctx.stroke();

        // --- Ruffled cravat / collar ---
        ctx.fillStyle = '#F5F0E8';
        ctx.beginPath();
        ctx.ellipse(x - 3, y - 5, 3.5, 2.5, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 1, y - 6, 3.5, 2.5, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x - 1, y - 4, 2.5, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // --- Head ---
        ctx.beginPath();
        ctx.arc(x + sway * 0.3, y - 12, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#F0C070';
        ctx.fill();
        ctx.strokeStyle = '#C8906A';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        const hx = x + sway * 0.3;
        const hy = y - 12;

        // Rosy cheeks
        ctx.fillStyle = 'rgba(220, 120, 100, 0.15)';
        ctx.beginPath();
        ctx.ellipse(hx - 4.5, hy + 1.5, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(hx + 4.5, hy + 1.5, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyebrows (arched)
        ctx.strokeStyle = '#7A4A18';
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(hx - 5, hy - 3.5);
        ctx.quadraticCurveTo(hx - 3, hy - 5, hx - 1.5, hy - 3.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(hx + 1.5, hy - 3.5);
        ctx.quadraticCurveTo(hx + 3, hy - 5, hx + 5, hy - 3.5);
        ctx.stroke();

        // Eyes — whites, then iris, pupil, highlight
        // Left eye whites
        ctx.fillStyle = '#F5F0E8';
        ctx.beginPath();
        ctx.ellipse(hx - 3, hy - 1.5, 2.2, 2.8, 0, 0, Math.PI * 2);
        ctx.fill();
        // Right eye whites
        ctx.beginPath();
        ctx.ellipse(hx + 3, hy - 1.5, 2.2, 2.8, 0, 0, Math.PI * 2);
        ctx.fill();
        // Left iris
        ctx.fillStyle = '#7A5020';
        ctx.beginPath();
        ctx.arc(hx - 3, hy - 1.2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        // Right iris
        ctx.beginPath();
        ctx.arc(hx + 3, hy - 1.2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        // Left pupil
        ctx.fillStyle = '#160C04';
        ctx.beginPath();
        ctx.arc(hx - 3, hy - 1.2, 0.8, 0, Math.PI * 2);
        ctx.fill();
        // Right pupil
        ctx.beginPath();
        ctx.arc(hx + 3, hy - 1.2, 0.8, 0, Math.PI * 2);
        ctx.fill();
        // Tiny highlights
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.arc(hx - 3.6, hy - 1.8, 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(hx + 2.4, hy - 1.8, 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Nose (small bump)
        ctx.fillStyle = '#D4956A';
        ctx.beginPath();
        ctx.ellipse(hx, hy + 1, 1.2, 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Expression — composed, slight smirk
        ctx.strokeStyle = '#7A3A1C';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(hx - 1.5, hy + 3.5);
        ctx.quadraticCurveTo(hx + 0.8, hy + 4.8, hx + 2.8, hy + 3.2);
        ctx.stroke();

        // Refined Van Dyke goatee
        ctx.fillStyle = '#7A4A20';
        ctx.beginPath();
        ctx.moveTo(hx - 2, hy + 5.8);
        ctx.quadraticCurveTo(hx, hy + 8.2, hx + 2, hy + 5.8);
        ctx.quadraticCurveTo(hx + 0.8, hy + 6.4, hx, hy + 6.5);
        ctx.quadraticCurveTo(hx - 0.8, hy + 6.4, hx - 2, hy + 5.8);
        ctx.fill();

        // --- Robin Hood / Sherwood hat ---
        // Back half of brim (drawn first for depth)
        ctx.beginPath();
        ctx.ellipse(hx, hy - 8, 11, 2.5, -0.06, Math.PI, Math.PI * 2);
        ctx.fillStyle = '#152A0C';
        ctx.fill();

        // Crown — soft asymmetric forward-pointed cap in forest green
        const crownGrad = ctx.createLinearGradient(hx - 7, hy - 8, hx + 5, hy - 19);
        crownGrad.addColorStop(0, '#2E5018');
        crownGrad.addColorStop(0.55, '#3A6424');
        crownGrad.addColorStop(1, '#264010');
        ctx.fillStyle = crownGrad;
        ctx.beginPath();
        ctx.moveTo(hx - 7, hy - 8);
        ctx.quadraticCurveTo(hx - 8, hy - 13, hx - 3, hy - 16);
        ctx.quadraticCurveTo(hx + 0.5, hy - 19, hx + 5, hy - 17);
        ctx.quadraticCurveTo(hx + 7.5, hy - 13, hx + 7, hy - 8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#1A3A0A';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Crown fold / crease shadow
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(hx - 1, hy - 9);
        ctx.quadraticCurveTo(hx + 1.5, hy - 13, hx + 4.5, hy - 17);
        ctx.stroke();

        // Upturned right-side brim flap
        ctx.beginPath();
        ctx.moveTo(hx + 2, hy - 8.5);
        ctx.quadraticCurveTo(hx + 8.5, hy - 9.2, hx + 11, hy - 12);
        ctx.quadraticCurveTo(hx + 9, hy - 8.5, hx + 4, hy - 8);
        ctx.closePath();
        ctx.fillStyle = '#2C4E16';
        ctx.fill();
        ctx.strokeStyle = '#1A3A0A';
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // Gold hat band
        ctx.fillStyle = '#C8951C';
        ctx.beginPath();
        ctx.moveTo(hx - 7, hy - 8.8);
        ctx.lineTo(hx + 7, hy - 8.8);
        ctx.lineTo(hx + 7, hy - 7.2);
        ctx.lineTo(hx - 7, hy - 7.2);
        ctx.closePath();
        ctx.fill();

        // Front brim layer (drawn over crown base)
        ctx.beginPath();
        ctx.ellipse(hx, hy - 8, 11, 2.5, -0.06, 0, Math.PI);
        ctx.fillStyle = '#1A3410';
        ctx.fill();
        ctx.strokeStyle = '#0F1E08';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        // Brim highlight
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.ellipse(hx, hy - 8, 11, 2.5, -0.06, 0.05, Math.PI * 0.85);
        ctx.stroke();

        // Feather plume on right side (animated)
        const featherWave = Math.sin(t * 2.2) * 0.1;
        ctx.save();
        ctx.translate(hx + 6, hy - 10);
        ctx.rotate(featherWave - 0.48);
        // Quill
        ctx.strokeStyle = '#C85A10';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-1, -6, 2, -13);
        ctx.stroke();
        // Vanes
        for (let v = 0; v < 6; v++) {
            const vt = v / 6;
            const vx = -1 + vt * 2.5 + Math.sin(t * 2.2 + vt * 2) * 0.4;
            const vy = -vt * 12;
            ctx.strokeStyle = `rgba(215, ${115 + v * 12}, 18, ${0.72 + v * 0.04})`;
            ctx.lineWidth = 1.4 - vt * 0.6;
            ctx.beginPath();
            ctx.moveTo(vx - 3, vy - 1);
            ctx.lineTo(vx + 3, vy + 1);
            ctx.stroke();
        }
        ctx.restore();

        // --- Floating music note above hat ---
        const notePulse = 0.85 + 0.15 * Math.sin(t * 3);
        const noteAlpha = 0.65 + 0.35 * Math.sin(t * 3 + 1);
        const noteY = y - 48 + Math.sin(t * 2) * 3;
        ctx.save();
        ctx.globalAlpha = noteAlpha;
        ctx.scale(notePulse, notePulse);
        const nx = x / notePulse;
        const ny = noteY / notePulse;
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#C89000';
        ctx.lineWidth = 1;
        // Note head
        ctx.beginPath();
        ctx.ellipse(nx, ny + 4, 4, 3, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Note stem
        ctx.beginPath();
        ctx.moveTo(nx + 3.5, ny + 2);
        ctx.lineTo(nx + 3.5, ny - 6);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Note flag
        ctx.beginPath();
        ctx.moveTo(nx + 3.5, ny - 6);
        ctx.quadraticCurveTo(nx + 8, ny - 4, nx + 6, ny - 1);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();

        ctx.restore();
    }

    onBardClick() {
        this.activePopup = 'musicalScores';
        if (!this.musicalScoresPopup) {
            this.musicalScoresPopup = new MusicalScoresMenu(this.stateManager, this);
        }
        this.musicalScoresPopup.open();
    }

    /**
     * Fisher-Yates shuffle of all tracks, ensuring the banned track is never first.
     * @param {string[]} tracks
     * @param {string|null} bannedFirst - Track that must not be played first
     * @returns {string[]}
     */
    _buildBardQueue(tracks, bannedFirst) {
        const arr = tracks.slice();
        // Fisher-Yates shuffle
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        // If the first element is banned, swap it with any other position
        if (bannedFirst && arr.length > 1 && arr[0] === bannedFirst) {
            const swapIdx = 1 + Math.floor(Math.random() * (arr.length - 1));
            [arr[0], arr[swapIdx]] = [arr[swapIdx], arr[0]];
        }
        return arr;
    }

    update(deltaTime) {
        this.animationTime += deltaTime;
        this.bardNoteAnim += deltaTime;

        // Fade-in overlay effect (professional 0.6 second fade)
        if (this.enableFadeInOverlay && this.fadeInOpacity < 1) {
            this.fadeInOpacity = Math.min(1, this.animationTime / 0.6);
        }

        // Update active popup
        if (this.activePopup === 'upgrades' && this.upgradesPopup) {
            this.upgradesPopup.update(deltaTime);
        } else if (this.activePopup === 'options' && this.optionsPopup) {
            this.optionsPopup.update(deltaTime);
        } else if (this.activePopup === 'arcaneLibrary' && this.arcaneLibraryPopup) {
            this.arcaneLibraryPopup.update(deltaTime);
        } else if (this.activePopup === 'musicalScores' && this.musicalScoresPopup) {
            this.musicalScoresPopup.update(deltaTime);
        } else if (this.activePopup === 'achievementPanel' && this.achievementPanelPopup) {
            this.achievementPanelPopup.update(deltaTime);
        } else if (this.activePopup === 'workshop' && this.workshopPopup) {
            this.workshopPopup.update(deltaTime);
        }

        // Update Sir Frogerty adviser
        if (this.sirFrogerty) {
            this.sirFrogerty.update(deltaTime);
        }

        // Decrement post-SirFrogerty click cooldown
        if (this._postSirFrogertyCooldown > 0) {
            this._postSirFrogertyCooldown -= deltaTime;
        }

        // Update settlement buildings for animations
        this.settlementBuildings.forEach(item => {
            if (item.building && item.building.update) {
                item.building.update(deltaTime);
            }
            // Prevent GoldMine timer from showing in settlement
            if (item.building && item.building.goldReady !== undefined) {
                item.building.goldReady = true;
            }
        });

        // Update achievement banner animation
        if (this.stateManager.achievementSystem) {
            this.stateManager.achievementSystem.update(deltaTime);
        }
    }

    render(ctx) {
        try {
            const canvas = this.stateManager.canvas;

            if (!canvas || !canvas.width || !canvas.height) {
                ctx.fillStyle = '#1a0f0a';
                ctx.fillRect(0, 0, 800, 600);
                return;
            }

            // Reset canvas shadow properties to prevent persistent glow effects
            ctx.shadowColor = 'rgba(0, 0, 0, 0)';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.globalAlpha = 1;

            // Background with depth
            this.renderBackground(ctx, canvas);

            if (this.showContent) {
                ctx.globalAlpha = this.contentOpacity;

                // Render settlement with 3D perspective
                this.renderSettlementScene(ctx, canvas);

                // Render settlement title
                this.renderTitle(ctx, canvas);

                ctx.globalAlpha = 1;
            }

            // Render active popup
            if (this.activePopup === 'upgrades' && this.upgradesPopup) {
                this.upgradesPopup.render(ctx);
            } else if (this.activePopup === 'options' && this.optionsPopup) {
                this.optionsPopup.render(ctx);
            } else if (this.activePopup === 'arcaneLibrary' && this.arcaneLibraryPopup) {
                this.arcaneLibraryPopup.render(ctx);
            } else if (this.activePopup === 'musicalScores' && this.musicalScoresPopup) {
                this.musicalScoresPopup.render(ctx);
            } else if (this.activePopup === 'achievementPanel' && this.achievementPanelPopup) {
                this.achievementPanelPopup.render(ctx);
            } else if (this.activePopup === 'workshop' && this.workshopPopup) {
                this.workshopPopup.render(ctx);
            }

            // Professional fade-in overlay effect (soft, from dark to transparent)
            if (this.enableFadeInOverlay && this.fadeInOpacity < 1) {
                const fadeOpacity = (1 - this.fadeInOpacity) * 0.6; // Fade from 60% dark to transparent
                ctx.fillStyle = `rgba(0, 0, 0, ${fadeOpacity})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            // Sir Frogerty adviser overlay (always on top)
            if (this.sirFrogerty && !this.activePopup) {
                this.sirFrogerty.render(ctx, canvas);
            }

            // Achievement banner (on top of everything including Sir Frogerty)
            if (this.stateManager.achievementSystem) {
                this.stateManager.achievementSystem.render(ctx, canvas);
            }

            ctx.globalAlpha = 1;

        } catch (error) {
            console.error('SettlementHub render error:', error);
            ctx.fillStyle = '#2a1a0f';
            ctx.fillRect(0, 0, ctx.canvas.width || 800, ctx.canvas.height || 600);
            ctx.fillStyle = '#ff0000';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('SettlementHub Error', (ctx.canvas.width || 800) / 2, (ctx.canvas.height || 800) / 2);
        }
    }

    renderBackground(ctx, canvas) {
        // PRE-RENDER OPTIMIZATION: the sky/haze/hills/ground/treeline backdrop never
        // changes frame-to-frame (no animationTime dependence, deterministic tree
        // shapes), but was previously rebuilt — gradients, ~90 tree objects, bezier
        // mountain paths — from scratch every single frame. Cache it to offscreen
        // canvases once and just blit it, keeping only the sun/clouds/birds/wind
        // (which do animate) drawn live, in the exact same z-order as before.
        this._ensureBackdropLayers(canvas);

        ctx.drawImage(this._bgSkyCanvas, 0, 0);
        this.renderSun(ctx, canvas);
        ctx.drawImage(this._bgHillsCanvas, 0, 0);
        this.renderClouds(ctx, canvas);
        ctx.drawImage(this._bgGroundCanvas, 0, 0);
    }

    _ensureBackdropLayers(canvas) {
        const W = canvas.width;
        const H = canvas.height;
        if (this._bgSkyCanvas && this._bgLayerW === W && this._bgLayerH === H) {
            return;
        }
        this._bgLayerW = W;
        this._bgLayerH = H;

        // Layer 1: deep sky gradient
        this._bgSkyCanvas = document.createElement('canvas');
        this._bgSkyCanvas.width = W;
        this._bgSkyCanvas.height = H;
        const skyCtx = this._bgSkyCanvas.getContext('2d');
        const skyGradient = skyCtx.createLinearGradient(0, 0, 0, H * 0.7);
        skyGradient.addColorStop(0, '#1a4d7a');
        skyGradient.addColorStop(0.4, '#4d9dcc');
        skyGradient.addColorStop(0.7, '#99ccff');
        skyCtx.fillStyle = skyGradient;
        skyCtx.fillRect(0, 0, W, H * 0.7);

        // Layer 2: atmospheric haze + mountain backdrop (drawn on transparent
        // canvas so it overlays the live sun render underneath, unchanged)
        this._bgHillsCanvas = document.createElement('canvas');
        this._bgHillsCanvas.width = W;
        this._bgHillsCanvas.height = H;
        const hillsCtx = this._bgHillsCanvas.getContext('2d');
        const hazeGradient = hillsCtx.createLinearGradient(0, H * 0.45, 0, H * 0.62);
        hazeGradient.addColorStop(0, 'rgba(200, 220, 255, 0)');
        hazeGradient.addColorStop(1, 'rgba(200, 220, 255, 0.22)');
        hillsCtx.fillStyle = hazeGradient;
        hillsCtx.fillRect(0, H * 0.45, W, H * 0.17);
        this.renderDistantHills(hillsCtx, canvas);

        // Layer 3: ground gradient + forest floor texture + horizon treeline
        // (also transparent so it overlays the live clouds layer underneath)
        this._bgGroundCanvas = document.createElement('canvas');
        this._bgGroundCanvas.width = W;
        this._bgGroundCanvas.height = H;
        const groundCtx = this._bgGroundCanvas.getContext('2d');
        const groundGradient = groundCtx.createLinearGradient(0, H * 0.57, 0, H);
        groundGradient.addColorStop(0, '#5a9960');
        groundGradient.addColorStop(0.25, '#438a4e');
        groundGradient.addColorStop(0.65, '#317840');
        groundGradient.addColorStop(1, '#246232');
        groundCtx.fillStyle = groundGradient;
        groundCtx.fillRect(0, H * 0.57, W, H - H * 0.57);
        this.renderGroundDetail(groundCtx, canvas);
        this.renderMidGroundForest(groundCtx, canvas);
    }

    renderSun(ctx, canvas) {
        // Sun position in upper right area
        const sunX = canvas.width * 0.75;
        const sunY = canvas.height * 0.15;
        const sunRadius = 50;

        // Create subtle, slow pulsing effect using animation time
        const flicker = Math.sin(this.animationTime * 0.5) * 0.1 + 0.9; // Subtle pulsing between 0.8 and 1.0

        // PRE-RENDER OPTIMIZATION: the sun's position is a pure function of canvas size (never
        // moves frame-to-frame), so its four radial gradients were being recreated from scratch
        // every single frame for no reason - createRadialGradient is one of the pricier Canvas2D
        // calls, and this ran it 4x/frame unconditionally (matches the exact issue renderWindGust
        // right below already avoids via its own "pre-bake gradient once" comment). Cache the
        // gradient objects once per canvas size instead. The two that depend on `flicker` are
        // baked at full (flicker=1) alpha and have the actual flicker applied via ctx.globalAlpha
        // at draw time instead - alpha-scaling a fill this way is visually identical to baking the
        // scaled alpha into the gradient's own color stops, since flicker only ever scales alpha.
        this._ensureSunGradients(ctx, sunX, sunY, sunRadius, canvas);

        // Outer glow - very soft, far reaching (fully static, no flicker)
        ctx.fillStyle = this._sunOuterGlow;
        ctx.fillRect(sunX - sunRadius * 4.2, sunY - sunRadius * 4.2, sunRadius * 8.4, sunRadius * 8.4);

        // Mid glow - corona effect (much slower, more natural)
        ctx.globalAlpha = flicker;
        ctx.fillStyle = this._sunCoronaGlow;
        ctx.fillRect(sunX - sunRadius * 3, sunY - sunRadius * 3, sunRadius * 6, sunRadius * 6);
        ctx.globalAlpha = 1;

        // Sun core with radial gradient for depth - warmer golden tones (fully static)
        ctx.fillStyle = this._sunCore;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();

        // Slow, gentle corona rays emanating from sun
        ctx.strokeStyle = `rgba(255, 160, 80, ${0.25 * flicker})`;
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + this.animationTime * 0.05; // Much slower: 0.05 instead of 0.3
            const rayLength = sunRadius * (1.6 + Math.sin(this.animationTime * 0.3 + i) * 0.2); // Slower: 0.3 instead of 2
            const x1 = sunX + Math.cos(angle) * sunRadius * 0.9;
            const y1 = sunY + Math.sin(angle) * sunRadius * 0.9;
            const x2 = sunX + Math.cos(angle) * rayLength;
            const y2 = sunY + Math.sin(angle) * rayLength;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        // Subtle outer corona (gentle halo effect)
        ctx.globalAlpha = flicker;
        ctx.fillStyle = this._sunOuterCorona;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius * 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    _ensureSunGradients(ctx, sunX, sunY, sunRadius, canvas) {
        if (this._sunGradientsW === canvas.width && this._sunGradientsH === canvas.height) {
            return;
        }
        this._sunGradientsW = canvas.width;
        this._sunGradientsH = canvas.height;

        this._sunOuterGlow = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.5, sunX, sunY, sunRadius * 4);
        this._sunOuterGlow.addColorStop(0, 'rgba(255, 180, 80, 0.15)');
        this._sunOuterGlow.addColorStop(0.5, 'rgba(255, 160, 60, 0.06)');
        this._sunOuterGlow.addColorStop(1, 'rgba(255, 140, 40, 0)');

        this._sunCoronaGlow = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.8, sunX, sunY, sunRadius * 2.8);
        this._sunCoronaGlow.addColorStop(0, 'rgba(255, 200, 120, 0.25)');
        this._sunCoronaGlow.addColorStop(0.6, 'rgba(255, 160, 80, 0.12)');
        this._sunCoronaGlow.addColorStop(1, 'rgba(255, 120, 60, 0)');

        this._sunCore = ctx.createRadialGradient(sunX - 15, sunY - 15, 5, sunX, sunY, sunRadius);
        this._sunCore.addColorStop(0, '#fffccc');     // Very light creamy yellow center
        this._sunCore.addColorStop(0.25, '#fffa00');  // Bright yellow
        this._sunCore.addColorStop(0.5, '#ffd700');   // Golden
        this._sunCore.addColorStop(0.75, '#ffb700');  // Golden-orange
        this._sunCore.addColorStop(1, '#ff9500');     // Warm orange rim

        this._sunOuterCorona = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.7, sunX, sunY, sunRadius * 2.2);
        this._sunOuterCorona.addColorStop(0, 'rgba(255, 200, 140, 0.15)');
        this._sunOuterCorona.addColorStop(0.5, 'rgba(255, 180, 120, 0.08)');
        this._sunOuterCorona.addColorStop(1, 'rgba(255, 160, 100, 0)');
    }

    renderClouds(ctx, canvas) {
        // Render many clouds at different positions with varying sizes
        // Clouds move from left to right with subtle animation
        const cloudSpeed = 8; // pixels per second (subtle speed)
        const cloudDistance = canvas.width + 300; // Distance cloud travels before looping
        
        // Calculate smooth continuous offset
        const offset = (this.animationTime * cloudSpeed) % cloudDistance;
        
        const clouds = [
            // Large clouds - baseX, y position, scale, opacity, parallax speed multiplier
            { baseX: canvas.width * 0.15, y: canvas.height * 0.12, scale: 1.8, opacity: 0.7, speed: 0.8 },
            { baseX: canvas.width * 0.75, y: canvas.height * 0.08, scale: 2.0, opacity: 0.65, speed: 0.9 },
            { baseX: canvas.width * 0.45, y: canvas.height * 0.22, scale: 1.9, opacity: 0.6, speed: 0.7 },
            
            // Medium clouds
            { baseX: canvas.width * 0.35, y: canvas.height * 0.18, scale: 1.2, opacity: 0.6, speed: 1.0 },
            { baseX: canvas.width * 0.55, y: canvas.height * 0.1, scale: 1.3, opacity: 0.65, speed: 0.75 },
            { baseX: canvas.width * 0.85, y: canvas.height * 0.25, scale: 1.4, opacity: 0.65, speed: 0.85 },
            { baseX: canvas.width * 0.25, y: canvas.height * 0.32, scale: 1.1, opacity: 0.55, speed: 1.1 },
            { baseX: canvas.width * 0.65, y: canvas.height * 0.28, scale: 1.2, opacity: 0.6, speed: 0.7 },
            
            // Small clouds for depth
            { baseX: canvas.width * 0.1, y: canvas.height * 0.08, scale: 0.8, opacity: 0.5, speed: 1.2 },
            { baseX: canvas.width * 0.5, y: canvas.height * 0.05, scale: 0.7, opacity: 0.45, speed: 0.6 },
            { baseX: canvas.width * 0.9, y: canvas.height * 0.15, scale: 0.9, opacity: 0.5, speed: 0.95 },
            { baseX: canvas.width * 0.3, y: canvas.height * 0.25, scale: 0.7, opacity: 0.48, speed: 1.15 },
        ];

        clouds.forEach(cloud => {
            // Calculate animated x position with parallax
            let cloudX = cloud.baseX + (offset * cloud.speed);
            
            // Wrap cloud smoothly - only restart when completely off screen (left side)
            if (cloudX > canvas.width + 150) {
                cloudX = cloudX - cloudDistance;
            }
            
            // Only render if cloud is at least partially visible
            if (cloudX > -150) {
                this.renderCloud(ctx, cloudX, cloud.y, cloud.scale, cloud.opacity);
            }
        });

        // Render bird flocks (sporadic)
        this.renderBirds(ctx, canvas);

        // Render wind gust animation (occasional)
        this.renderWindGust(ctx, canvas);
    }

    renderCloud(ctx, x, y, scale, opacity) {
        // Cloud made of overlapping circles with gradient
        ctx.globalAlpha = opacity * this.contentOpacity;
        
        // Cloud shadow/bottom
        ctx.fillStyle = 'rgba(200, 210, 220, 0.3)';
        ctx.beginPath();
        ctx.arc(x - 30 * scale, y + 5 * scale, 20 * scale, 0, Math.PI * 2);
        ctx.arc(x, y + 8 * scale, 22 * scale, 0, Math.PI * 2);
        ctx.arc(x + 30 * scale, y + 5 * scale, 20 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Cloud body - white
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(x - 30 * scale, y, 22 * scale, 0, Math.PI * 2);
        ctx.arc(x, y, 26 * scale, 0, Math.PI * 2);
        ctx.arc(x + 30 * scale, y, 22 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Cloud highlight - light white
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(x - 20 * scale, y - 8 * scale, 15 * scale, 0, Math.PI * 2);
        ctx.arc(x + 20 * scale, y - 6 * scale, 12 * scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = this.contentOpacity;
    }

    renderBirds(ctx, canvas) {
        // Sporadic bird flocks flying across the sky
        // Cache flock config (depends on canvas height)
        if (!this._birdFlocks || this._birdFlocksH !== canvas.height) {
            this._birdFlocksH = canvas.height;
            this._birdFlocks = [
                { startTime: 6,  duration: 20, yOffset: canvas.height * 0.20, birdCount: 5, cycleLength: 45 },
                { startTime: 31, duration: 20, yOffset: canvas.height * 0.28, birdCount: 4, cycleLength: 70 },
                { startTime: 46, duration: 20, yOffset: canvas.height * 0.15, birdCount: 6, cycleLength: 100 },
            ];
        }
        const flocks = this._birdFlocks;
        
        flocks.forEach(flock => {
            // Calculate position in cycle
            const cyclePosition = (this.animationTime % flock.cycleLength);
            
            // Check if flock should be visible
            if (cyclePosition >= flock.startTime && cyclePosition < flock.startTime + flock.duration) {
                const timeInFlock = cyclePosition - flock.startTime;
                
                // Ease in and out
                let visibility = 1.0;
                if (timeInFlock < 0.5) {
                    visibility = timeInFlock / 0.5; // Fade in
                } else if (timeInFlock > flock.duration - 0.5) {
                    visibility = (flock.duration - timeInFlock) / 0.5; // Fade out
                }
                
                // Much slower movement across screen
                const flockX = -80 + (timeInFlock / flock.duration) * (canvas.width + 160);
                
                ctx.globalAlpha = visibility * this.contentOpacity * 0.7;
                
                // Draw bird formation - natural V-shape
                for (let i = 0; i < flock.birdCount; i++) {
                    // Create V-formation: center lead bird, others offset in V pattern
                    let offsetX, offsetY;
                    if (i === 0) {
                        // Lead bird at center front
                        offsetX = 0;
                        offsetY = 0;
                    } else {
                        // Birds arranged in V behind lead
                        const vIndex = i - 1;
                        const side = vIndex % 2; // 0 = left, 1 = right
                        const row = Math.floor(vIndex / 2);
                        offsetX = side === 0 ? -28 - (row * 10) : 28 + (row * 10);
                        offsetY = (row + 1) * 22;
                    }
                    
                    const birdX = flockX + offsetX;
                    const birdY = flock.yOffset + offsetY;
                    
                    if (birdX > -30 && birdX < canvas.width + 30) {
                        // Slower wing flapping animation
                        const wingFlap = Math.sin(this.animationTime * 2.5 + i * 0.3) * 0.5 + 0.5;
                        this.renderBird(ctx, birdX, birdY, 2, wingFlap);
                    }
                }
                
                ctx.globalAlpha = this.contentOpacity;
            }
        });
    }

    renderBird(ctx, x, y, scale, wingFlap) {
        // Bird body with flapping wings
        // wingFlap is 0-1 indicating wing position in flap cycle

        // Calculate wing positions based on flap. wingY is continuously interpolated
        // across the full down->up range (was a hard wingFlap>0.5 threshold before,
        // which snapped the wingtip between two fixed heights instead of flapping
        // smoothly through the midpoint).
        const wingAngle = (wingFlap - 0.5) * Math.PI;
        const wingY = y + (1 * scale) - wingFlap * (3 * scale); // wingFlap 0 -> y+1*scale (down), 1 -> y-2*scale (up)

        // Draw left wing
        ctx.strokeStyle = 'rgba(80, 80, 80, 0.8)';
        ctx.lineWidth = 1.5 * scale;
        ctx.beginPath();
        ctx.moveTo(x - 2 * scale, y);
        const leftWingX = x - 8 * scale - Math.abs(Math.sin(wingAngle) * 4 * scale);
        ctx.quadraticCurveTo(x - 5 * scale, wingY, leftWingX, wingY + 1 * scale);
        ctx.stroke();

        // Draw right wing
        ctx.beginPath();
        ctx.moveTo(x + 2 * scale, y);
        const rightWingX = x + 8 * scale + Math.abs(Math.sin(wingAngle) * 4 * scale);
        ctx.quadraticCurveTo(x + 5 * scale, wingY, rightWingX, wingY + 1 * scale);
        ctx.stroke();
        
        // Draw bird body
        ctx.fillStyle = 'rgba(60, 60, 60, 0.9)';
        ctx.beginPath();
        // Main body (ellipse)
        ctx.ellipse(x, y, 3 * scale, 2 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Bird head
        ctx.beginPath();
        ctx.arc(x + 2.5 * scale, y - 0.5 * scale, 1.2 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye highlight
        ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
        ctx.beginPath();
        ctx.arc(x + 3.2 * scale, y - 0.8 * scale, 0.4 * scale, 0, Math.PI * 2);
        ctx.fill();
    }

    renderWindGust(ctx, canvas) {
        // Occasional wind gust visual effect - longer streaks, fewer lines
        const gustCycle = (this.animationTime % 15);
        if (gustCycle <= 10 || gustCycle >= 12) return;

        const gustProgress = (gustCycle - 10) / 2;
        const gustOpacity = (Math.sin(gustProgress * Math.PI) * 0.25) * this.contentOpacity;
        if (gustOpacity <= 0.01) return;

        // Pre-bake gradient strip once (avoids creating gradient objects every frame)
        if (!this._windStreakCanvas) {
            this._windStreakCanvas = document.createElement('canvas');
            this._windStreakCanvas.width = 400;
            this._windStreakCanvas.height = 2;
            const wc = this._windStreakCanvas.getContext('2d');
            const g = wc.createLinearGradient(0, 0, 400, 0);
            g.addColorStop(0,   'rgba(200, 220, 255, 0)');
            g.addColorStop(0.2, 'rgba(200, 220, 255, 0.5)');
            g.addColorStop(0.5, 'rgba(200, 220, 255, 1)');
            g.addColorStop(0.8, 'rgba(200, 220, 255, 0.5)');
            g.addColorStop(1,   'rgba(200, 220, 255, 0)');
            wc.fillStyle = g;
            wc.fillRect(0, 0, 400, 2);
        }

        // Cache streak layer config (depends on canvas height)
        if (!this._windStreakLayers || this._windStreakLayersH !== canvas.height) {
            this._windStreakLayersH = canvas.height;
            this._windStreakLayers = [
                { yBase: canvas.height * 0.16, count: 2, spacing: 40 },
                { yBase: canvas.height * 0.26, count: 2, spacing: 45 },
                { yBase: canvas.height * 0.33, count: 2, spacing: 38 },
            ];
        }

        ctx.save();
        ctx.globalAlpha = gustOpacity;
        this._windStreakLayers.forEach(layer => {
            for (let i = 0; i < layer.count; i++) {
                const y = layer.yBase + (i * layer.spacing);
                const streakLength = 150 + Math.sin(gustProgress * Math.PI + i * 0.5) * 30;
                const streakX = -100 + gustProgress * (canvas.width + 200) * 0.8;
                ctx.drawImage(this._windStreakCanvas, 0, 0, 400, 2, streakX - streakLength, y - 1, streakLength * 2, 2);
            }
        });
        ctx.restore();
    }

    renderDistantHills(ctx, canvas) {
        const W = canvas.width;
        const H = canvas.height;
        const groundY = H * 0.57;

        // === Far layer: pale atmospheric distant peaks ===
        const farGrad = ctx.createLinearGradient(0, H * 0.12, 0, groundY);
        farGrad.addColorStop(0, '#aec8d8');
        farGrad.addColorStop(1, '#88aabf');
        ctx.fillStyle = farGrad;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(0, H * 0.40);
        // Gently rolling distant ridge with a few modest peaks
        ctx.bezierCurveTo(W * 0.08, H * 0.38, W * 0.14, H * 0.33, W * 0.18, H * 0.36);
        ctx.bezierCurveTo(W * 0.22, H * 0.29, W * 0.26, H * 0.24, W * 0.30, H * 0.28);
        ctx.bezierCurveTo(W * 0.35, H * 0.34, W * 0.40, H * 0.30, W * 0.45, H * 0.22);
        ctx.bezierCurveTo(W * 0.50, H * 0.16, W * 0.54, H * 0.12, W * 0.57, H * 0.15);
        ctx.bezierCurveTo(W * 0.60, H * 0.19, W * 0.65, H * 0.27, W * 0.70, H * 0.32);
        ctx.bezierCurveTo(W * 0.75, H * 0.25, W * 0.80, H * 0.20, W * 0.84, H * 0.23);
        ctx.bezierCurveTo(W * 0.88, H * 0.28, W * 0.93, H * 0.34, W, H * 0.38);
        ctx.lineTo(W, groundY);
        ctx.closePath();
        ctx.fill();

        // Snow cap on tallest far peak
        // Far peak actual apex is at approx W*0.549, H*0.139 (bezier crest)
        // Left slope meets snow line (~H*0.194) at x≈W*0.471; right at x≈W*0.602
        ctx.save();
        ctx.globalAlpha = 0.72;
        ctx.fillStyle = '#edf6ff';
        ctx.beginPath();
        ctx.moveTo(W * 0.471, H * 0.194);
        ctx.bezierCurveTo(W * 0.500, H * 0.162, W * 0.536, H * 0.138, W * 0.549, H * 0.139);
        ctx.bezierCurveTo(W * 0.561, H * 0.140, W * 0.590, H * 0.166, W * 0.602, H * 0.195);
        ctx.bezierCurveTo(W * 0.572, H * 0.204, W * 0.502, H * 0.205, W * 0.471, H * 0.194);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // === Mid layer: main mountain range ===
        const midGrad = ctx.createLinearGradient(0, H * 0.22, 0, groundY);
        midGrad.addColorStop(0, '#5e7080');
        midGrad.addColorStop(0.6, '#4a5e6c');
        midGrad.addColorStop(1, '#3c5058');
        ctx.fillStyle = midGrad;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(0, H * 0.48);
        ctx.bezierCurveTo(W * 0.06, H * 0.44, W * 0.10, H * 0.40, W * 0.14, H * 0.43);
        ctx.bezierCurveTo(W * 0.19, H * 0.36, W * 0.23, H * 0.30, W * 0.27, H * 0.34);
        ctx.bezierCurveTo(W * 0.31, H * 0.39, W * 0.36, H * 0.44, W * 0.40, H * 0.36);
        ctx.bezierCurveTo(W * 0.44, H * 0.28, W * 0.48, H * 0.22, W * 0.52, H * 0.17);
        ctx.bezierCurveTo(W * 0.56, H * 0.22, W * 0.60, H * 0.29, W * 0.64, H * 0.35);
        ctx.bezierCurveTo(W * 0.68, H * 0.41, W * 0.72, H * 0.45, W * 0.76, H * 0.38);
        ctx.bezierCurveTo(W * 0.80, H * 0.30, W * 0.84, H * 0.24, W * 0.87, H * 0.20);
        ctx.bezierCurveTo(W * 0.91, H * 0.26, W * 0.95, H * 0.34, W, H * 0.42);
        ctx.lineTo(W, groundY);
        ctx.closePath();
        ctx.fill();

        // Snow caps on the two dominant mid-range peaks
        // Central peak (apex W*0.52, H*0.17): left slope at H*0.228 → x≈W*0.481; right → x≈W*0.562
        ctx.save();
        ctx.globalAlpha = 0.92;
        ctx.fillStyle = '#f2f9ff';
        ctx.beginPath();
        ctx.moveTo(W * 0.481, H * 0.228);
        ctx.bezierCurveTo(W * 0.494, H * 0.210, W * 0.508, H * 0.186, W * 0.520, H * 0.170);
        ctx.bezierCurveTo(W * 0.533, H * 0.186, W * 0.548, H * 0.210, W * 0.562, H * 0.228);
        ctx.bezierCurveTo(W * 0.540, H * 0.236, W * 0.503, H * 0.236, W * 0.481, H * 0.228);
        ctx.closePath();
        ctx.fill();
        // Cold-shadow on right face of central peak snow
        ctx.globalAlpha = 0.20;
        ctx.fillStyle = '#8aa0c8';
        ctx.beginPath();
        ctx.moveTo(W * 0.520, H * 0.170);
        ctx.bezierCurveTo(W * 0.533, H * 0.186, W * 0.548, H * 0.210, W * 0.562, H * 0.228);
        ctx.bezierCurveTo(W * 0.552, H * 0.234, W * 0.538, H * 0.234, W * 0.526, H * 0.228);
        ctx.bezierCurveTo(W * 0.525, H * 0.210, W * 0.522, H * 0.186, W * 0.520, H * 0.170);
        ctx.closePath();
        ctx.fill();
        // Right peak (apex W*0.87, H*0.20): left slope at H*0.252 → x≈W*0.840; right → x≈W*0.904
        ctx.globalAlpha = 0.92;
        ctx.fillStyle = '#f2f9ff';
        ctx.beginPath();
        ctx.moveTo(W * 0.840, H * 0.252);
        ctx.bezierCurveTo(W * 0.852, H * 0.232, W * 0.862, H * 0.216, W * 0.870, H * 0.200);
        ctx.bezierCurveTo(W * 0.882, H * 0.218, W * 0.893, H * 0.236, W * 0.904, H * 0.252);
        ctx.bezierCurveTo(W * 0.884, H * 0.262, W * 0.858, H * 0.262, W * 0.840, H * 0.252);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // === Near layer: smooth rolling foothills fading into the green ground ===
        const nearGrad = ctx.createLinearGradient(0, H * 0.44, 0, groundY);
        nearGrad.addColorStop(0, '#384e50');
        nearGrad.addColorStop(0.5, '#324a3e');
        nearGrad.addColorStop(1, '#2c4030');
        ctx.fillStyle = nearGrad;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(0, H * 0.535);
        ctx.bezierCurveTo(W * 0.12, H * 0.468, W * 0.22, H * 0.500, W * 0.32, H * 0.478);
        ctx.bezierCurveTo(W * 0.42, H * 0.455, W * 0.50, H * 0.465, W * 0.58, H * 0.448);
        ctx.bezierCurveTo(W * 0.66, H * 0.462, W * 0.74, H * 0.495, W * 0.84, H * 0.468);
        ctx.bezierCurveTo(W * 0.92, H * 0.448, W * 0.97, H * 0.478, W, H * 0.510);
        ctx.lineTo(W, groundY);
        ctx.closePath();
        ctx.fill();

        // Soft AO shadow at base
        const aoGrad = ctx.createLinearGradient(0, groundY - 20, 0, groundY + 8);
        aoGrad.addColorStop(0, 'rgba(0, 8, 4, 0.22)');
        aoGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = aoGrad;
        ctx.fillRect(0, groundY - 20, W, 28);
    }

    renderMidGroundForest(ctx, canvas) {
        // Full-width horizon treeline with natural clustering and size variation
        const W = canvas.width;
        const H = canvas.height;
        const trees = [
            // Dense left edge cluster
            { x: W * 0.002, y: H * 0.595, size: 18, gx: 0,  gy: 10 },
            { x: W * 0.020, y: H * 0.601, size: 22, gx: 1,  gy: 11 },
            { x: W * 0.038, y: H * 0.598, size: 20, gx: 2,  gy: 11 },
            { x: W * 0.055, y: H * 0.606, size: 26, gx: 3,  gy: 12 },
            { x: W * 0.012, y: H * 0.616, size: 28, gx: 1,  gy: 12 },
            { x: W * 0.032, y: H * 0.620, size: 24, gx: 2,  gy: 12 },
            { x: W * 0.072, y: H * 0.612, size: 25, gx: 3,  gy: 12 },
            { x: W * 0.090, y: H * 0.600, size: 22, gx: 4,  gy: 11 },
            { x: W * 0.108, y: H * 0.608, size: 27, gx: 5,  gy: 12 },
            { x: W * 0.065, y: H * 0.628, size: 32, gx: 3,  gy: 13 },
            { x: W * 0.042, y: H * 0.634, size: 30, gx: 2,  gy: 13 },
            { x: W * 0.020, y: H * 0.628, size: 29, gx: 1,  gy: 13 },
            { x: W * 0.085, y: H * 0.636, size: 34, gx: 4,  gy: 14 },
            { x: W * 0.122, y: H * 0.614, size: 26, gx: 6,  gy: 12 },
            { x: W * 0.140, y: H * 0.624, size: 30, gx: 7,  gy: 13 },
            { x: W * 0.158, y: H * 0.618, size: 28, gx: 8,  gy: 12 },
            { x: W * 0.102, y: H * 0.632, size: 33, gx: 5,  gy: 13 },
            { x: W * 0.175, y: H * 0.630, size: 31, gx: 9,  gy: 13 },
            { x: W * 0.192, y: H * 0.644, size: 36, gx: 9,  gy: 14 },
            { x: W * 0.155, y: H * 0.645, size: 35, gx: 8,  gy: 14 },
            // Mid-left sparse scatter
            { x: W * 0.215, y: H * 0.600, size: 21, gx: 10, gy: 11 },
            { x: W * 0.240, y: H * 0.612, size: 24, gx: 11, gy: 12 },
            { x: W * 0.260, y: H * 0.598, size: 19, gx: 12, gy: 11 },
            { x: W * 0.228, y: H * 0.626, size: 29, gx: 11, gy: 13 },
            { x: W * 0.255, y: H * 0.636, size: 32, gx: 12, gy: 13 },
            { x: W * 0.278, y: H * 0.622, size: 27, gx: 13, gy: 12 },
            { x: W * 0.295, y: H * 0.610, size: 23, gx: 14, gy: 12 },
            // Central strip — behind settlement (renders behind settlement)
            { x: W * 0.320, y: H * 0.596, size: 18, gx: 15, gy: 11 },
            { x: W * 0.345, y: H * 0.604, size: 21, gx: 16, gy: 11 },
            { x: W * 0.368, y: H * 0.598, size: 20, gx: 17, gy: 11 },
            { x: W * 0.390, y: H * 0.606, size: 22, gx: 18, gy: 12 },
            { x: W * 0.335, y: H * 0.618, size: 26, gx: 16, gy: 12 },
            { x: W * 0.360, y: H * 0.624, size: 28, gx: 17, gy: 12 },
            { x: W * 0.408, y: H * 0.616, size: 24, gx: 19, gy: 12 },
            { x: W * 0.430, y: H * 0.600, size: 19, gx: 20, gy: 11 },
            { x: W * 0.450, y: H * 0.610, size: 22, gx: 21, gy: 12 },
            { x: W * 0.415, y: H * 0.628, size: 27, gx: 19, gy: 13 },
            { x: W * 0.460, y: H * 0.622, size: 25, gx: 21, gy: 12 },
            { x: W * 0.478, y: H * 0.600, size: 18, gx: 22, gy: 11 },
            { x: W * 0.500, y: H * 0.606, size: 20, gx: 23, gy: 11 },
            { x: W * 0.520, y: H * 0.598, size: 19, gx: 24, gy: 11 },
            { x: W * 0.490, y: H * 0.618, size: 24, gx: 22, gy: 12 },
            { x: W * 0.512, y: H * 0.626, size: 27, gx: 23, gy: 12 },
            { x: W * 0.540, y: H * 0.610, size: 22, gx: 25, gy: 12 },
            { x: W * 0.558, y: H * 0.600, size: 20, gx: 26, gy: 11 },
            { x: W * 0.575, y: H * 0.612, size: 23, gx: 26, gy: 12 },
            { x: W * 0.530, y: H * 0.632, size: 29, gx: 24, gy: 13 },
            { x: W * 0.562, y: H * 0.624, size: 26, gx: 26, gy: 12 },
            // Mid-right sparse scatter
            { x: W * 0.590, y: H * 0.600, size: 18, gx: 27, gy: 11 },
            { x: W * 0.608, y: H * 0.610, size: 21, gx: 28, gy: 12 },
            { x: W * 0.628, y: H * 0.598, size: 19, gx: 29, gy: 11 },
            { x: W * 0.598, y: H * 0.622, size: 25, gx: 27, gy: 12 },
            { x: W * 0.620, y: H * 0.628, size: 28, gx: 28, gy: 13 },
            { x: W * 0.645, y: H * 0.612, size: 23, gx: 30, gy: 12 },
            { x: W * 0.662, y: H * 0.600, size: 20, gx: 31, gy: 11 },
            { x: W * 0.680, y: H * 0.610, size: 24, gx: 32, gy: 12 },
            { x: W * 0.635, y: H * 0.636, size: 31, gx: 29, gy: 13 },
            { x: W * 0.668, y: H * 0.624, size: 27, gx: 31, gy: 12 },
            { x: W * 0.700, y: H * 0.600, size: 19, gx: 33, gy: 11 },
            { x: W * 0.715, y: H * 0.612, size: 22, gx: 33, gy: 12 },
            { x: W * 0.695, y: H * 0.622, size: 26, gx: 32, gy: 12 },
            { x: W * 0.728, y: H * 0.618, size: 24, gx: 34, gy: 12 },
            { x: W * 0.705, y: H * 0.634, size: 30, gx: 33, gy: 13 },
            { x: W * 0.740, y: H * 0.606, size: 21, gx: 35, gy: 11 },
            { x: W * 0.758, y: H * 0.598, size: 18, gx: 36, gy: 11 },
            { x: W * 0.720, y: H * 0.628, size: 28, gx: 34, gy: 13 },
            { x: W * 0.745, y: H * 0.622, size: 25, gx: 35, gy: 12 },
            { x: W * 0.778, y: H * 0.600, size: 19, gx: 37, gy: 11 },
            { x: W * 0.795, y: H * 0.610, size: 22, gx: 37, gy: 12 },
            { x: W * 0.772, y: H * 0.622, size: 27, gx: 36, gy: 12 },
            { x: W * 0.812, y: H * 0.598, size: 20, gx: 38, gy: 11 },
            { x: W * 0.800, y: H * 0.626, size: 29, gx: 38, gy: 13 },
            { x: W * 0.830, y: H * 0.612, size: 24, gx: 39, gy: 12 },
            { x: W * 0.820, y: H * 0.634, size: 31, gx: 38, gy: 13 },
            // Dense right edge cluster
            { x: W * 0.852, y: H * 0.618, size: 26, gx: 40, gy: 12 },
            { x: W * 0.870, y: H * 0.600, size: 22, gx: 41, gy: 11 },
            { x: W * 0.888, y: H * 0.610, size: 25, gx: 41, gy: 12 },
            { x: W * 0.842, y: H * 0.628, size: 30, gx: 40, gy: 13 },
            { x: W * 0.862, y: H * 0.638, size: 34, gx: 40, gy: 14 },
            { x: W * 0.906, y: H * 0.598, size: 21, gx: 43, gy: 11 },
            { x: W * 0.922, y: H * 0.606, size: 24, gx: 44, gy: 11 },
            { x: W * 0.895, y: H * 0.618, size: 28, gx: 42, gy: 12 },
            { x: W * 0.878, y: H * 0.630, size: 33, gx: 41, gy: 13 },
            { x: W * 0.912, y: H * 0.628, size: 30, gx: 43, gy: 13 },
            { x: W * 0.938, y: H * 0.600, size: 22, gx: 44, gy: 11 },
            { x: W * 0.955, y: H * 0.610, size: 26, gx: 45, gy: 12 },
            { x: W * 0.942, y: H * 0.624, size: 31, gx: 44, gy: 12 },
            { x: W * 0.972, y: H * 0.598, size: 20, gx: 46, gy: 11 },
            { x: W * 0.988, y: H * 0.606, size: 23, gx: 47, gy: 11 },
            { x: W * 0.965, y: H * 0.618, size: 28, gx: 45, gy: 12 },
            { x: W * 0.980, y: H * 0.628, size: 32, gx: 46, gy: 13 },
            { x: W * 0.998, y: H * 0.616, size: 24, gx: 47, gy: 12 },
            { x: W * 0.928, y: H * 0.638, size: 35, gx: 43, gy: 14 },
            { x: W * 0.958, y: H * 0.640, size: 36, gx: 45, gy: 14 },
        ];
        trees.sort((a, b) => a.y - b.y);
        trees.forEach(tree => {
            this.renderTree(ctx, tree.x, tree.y, tree.size, tree.gx, tree.gy);
        });
    }

    renderGroundDetail(ctx, canvas) {
        const W = canvas.width;
        const H = canvas.height;
        // Soft radial darker patches — simulate canopy shadows / ground variation
        const patches = [
            [0.10, 0.68, 0.18, 0.055], [0.28, 0.74, 0.14, 0.050],
            [0.45, 0.65, 0.20, 0.060], [0.62, 0.72, 0.16, 0.048],
            [0.78, 0.66, 0.18, 0.055], [0.92, 0.75, 0.13, 0.045],
            [0.05, 0.80, 0.16, 0.052], [0.38, 0.82, 0.19, 0.058],
            [0.55, 0.78, 0.15, 0.050], [0.72, 0.85, 0.17, 0.055],
            [0.20, 0.90, 0.20, 0.060], [0.85, 0.88, 0.14, 0.048],
            [0.48, 0.92, 0.22, 0.065], [0.15, 0.61, 0.12, 0.040],
            [0.70, 0.62, 0.10, 0.038], [0.34, 0.60, 0.11, 0.035],
        ];
        patches.forEach(([fx, fy, fr, alpha]) => {
            const cx = W * fx;
            const cy = H * fy;
            const r = W * fr;
            const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            grd.addColorStop(0, `rgba(0, 20, 5, ${alpha})`);
            grd.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = grd;
            ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        });
        // Sun-dapple lighter clearings
        const dapples = [
            [0.22, 0.69, 0.09, 0.038], [0.50, 0.67, 0.08, 0.035],
            [0.75, 0.71, 0.10, 0.040], [0.07, 0.85, 0.08, 0.032],
            [0.65, 0.88, 0.09, 0.036], [0.40, 0.95, 0.10, 0.040],
        ];
        dapples.forEach(([fx, fy, fr, alpha]) => {
            const cx = W * fx;
            const cy = H * fy;
            const r = W * fr;
            const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            grd.addColorStop(0, `rgba(120, 200, 60, ${alpha})`);
            grd.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = grd;
            ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        });
    }

    renderSettlementScene(ctx, canvas) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height * 0.76;  // Ground level, lower
        const sf = canvas.width / 1920;

        // Terrain/wall/palisade/paths/details/front-wall-overlay are 100% deterministic
        // functions of canvas size (no animationTime, hover, or upgrade-state reads - verified),
        // so they were being replayed as ~1000+ live vector draw calls every frame for no
        // reason. Bake them to offscreen canvases once and blit instead - but only once
        // contentOpacity has reached 1 (steady state; it's set to 1 immediately and never
        // animated elsewhere, so this is effectively always true, kept only as a safety net):
        // baking flattens overlapping semi-transparent shapes before the outer globalAlpha
        // multiply is applied, which is only guaranteed pixel-identical to the original
        // sequential per-shape alpha blending when that multiplier is exactly 1.
        const useCachedStatics = this.contentOpacity >= 1;
        if (useCachedStatics) {
            this._ensureSceneStaticLayers(canvas, centerX, centerY, sf);
        }

        if (useCachedStatics) {
            ctx.drawImage(this._sceneBehindCanvas, 0, 0);
        } else {
            // Exterior trees behind the wall — sorted by Y so distant ones draw first
            this.renderSettlementTerrain(ctx, canvas, centerX, centerY);

            // Ground-contact shadow - part of the terrain, drawn before the wall/trees that
            // stand on it (see renderSettlementGroundShadow's doc comment for why)
            this.renderSettlementGroundShadow(ctx, centerX, centerY, sf);

            // Back-arc (upper/rear half) exterior wall decoration drawn BEFORE the wall
            // so it correctly appears behind the wall structure
            this.renderWallExteriorDecoration(ctx, centerX, centerY, false);

            // Render 3D palisade walls (includes guard towers in front)
            this.renderEllipticalPalisade(ctx, canvas, centerX, centerY);

            // Front-arc (lower/front half) exterior wall decoration drawn AFTER the wall
            // so it correctly appears in front of the wall base for proper perspective
            this.renderWallExteriorDecoration(ctx, centerX, centerY, true);

            // Render interior elements clipped tightly to the wall ellipse
            ctx.save();
            this.createEllipseClipPath(ctx, centerX, centerY, 358 * sf, 138 * sf);
            this.renderSettlementPaths(ctx, canvas, centerX, centerY);   // floor surface + fountain
            // Details (crates, barrels, shrubs) drawn ON TOP of paths, still inside wall clip
            this.renderSettlementDetails(ctx, centerX, centerY);
            ctx.restore();
        }

        // Render ALL interior buildings (forge, academy, guard posts) in one Y-sorted pass.
        // Use a very tall clip so tower tops are never cut off, while the wide
        // radiusX still keeps buildings horizontally inside the wall.
        // Y-sorting (painter's algorithm) ensures correct depth between all buildings.
        ctx.save();
        this.createEllipseClipPath(ctx, centerX, centerY, 356 * sf, 300 * sf);
        this.renderSettlementBuildings(ctx, canvas, 'interior-all');
        ctx.restore();

        // Re-render front-arc wall posts + horizontal rail + gate + guard towers on top of
        // all interior content so they correctly occlude lower building portions.
        if (useCachedStatics) {
            ctx.drawImage(this._sceneFrontOverlayCanvas, 0, 0);
        } else {
            this.renderFrontWallOverlay(ctx, canvas, centerX, centerY);
        }

        // Render exterior buildings (TrainingGrounds, Castle — intentionally outside the wall)
        this.renderSettlementBuildings(ctx, canvas, 'exterior');

        // Render name labels for interior clickable buildings above the wall (unclipped)
        this.renderSettlementBuildings(ctx, canvas, 'headers');

        // Render bard character near the fountain (only if musical-equipment upgrade purchased)
        const upgradeSystem = this.stateManager?.upgradeSystem;
        if (upgradeSystem && upgradeSystem.hasUpgrade('musical-equipment')) {
            this.renderBard(ctx, centerX + 58 * sf, centerY - 15 * sf);
        }

        // Render active boons
        this.renderActiveBoons(ctx, canvas);
    }

    /** Ground-contact shadow, grounding the settlement into the grass around it. Shifted down
     * and shallower than the wall ellipse (radiusX=360*sf, see renderFrontWallOverlay) on
     * purpose - it's a contact shadow, not a silhouette copy - but needs radiusX=410*sf (bigger
     * than the wall's own 360*sf) to actually reach the wall's leftmost/rightmost points: pulled
     * down by the +50*sf offset, a same-size ellipse is narrower than the wall at those points
     * by basic ellipse math, which used to leave two visible gaps of bare, unshadowed ground
     * right at the wall's east/west edges.
     *
     * Drawn here - as part of the ground, right after the background trees and before the wall/
     * palisade/front-tree passes - rather than as a final overlay on top of literally everything:
     * drawn last, its own shape (which reaches past the wall's front edge on purpose) also
     * painted over part of the interior floor near the gate ("leaking" through the wall) and cut
     * a hard edge straight across any tree standing in the ring between the wall and the
     * shadow's own edge, including every tree this file otherwise takes care to draw in front of
     * the wall/Castle. Ground shadows are logically part of the terrain a structure or tree
     * stands on, not a decal painted over both afterward - putting it back in painter's-algorithm
     * order like this means anything drawn after (the wall, front trees, buildings) naturally
     * covers whatever part of it shouldn't show, with no clipping trick needed. */
    renderSettlementGroundShadow(ctx, centerX, centerY, sf) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 50 * sf, 410 * sf, 120 * sf, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Bakes the deterministic (canvas-size-only) parts of the settlement scene to two
     * offscreen canvases: everything that draws behind the buildings (terrain, wall
     * decoration, palisade, paths, details) and the front-wall overlay that draws on
     * top of them. Split in two so buildings can still be drawn live in between, at
     * the exact same point in the paint order as before. Rebuilt only on resize.
     */
    _ensureSceneStaticLayers(canvas, centerX, centerY, sf) {
        if (this._sceneBehindCanvas && this._sceneLayerW === canvas.width && this._sceneLayerH === canvas.height) {
            return;
        }
        this._sceneLayerW = canvas.width;
        this._sceneLayerH = canvas.height;

        this._sceneBehindCanvas = document.createElement('canvas');
        this._sceneBehindCanvas.width = canvas.width;
        this._sceneBehindCanvas.height = canvas.height;
        const bctx = this._sceneBehindCanvas.getContext('2d');
        this.renderSettlementTerrain(bctx, canvas, centerX, centerY);
        this.renderSettlementGroundShadow(bctx, centerX, centerY, sf);
        this.renderWallExteriorDecoration(bctx, centerX, centerY, false);
        this.renderEllipticalPalisade(bctx, canvas, centerX, centerY);
        this.renderWallExteriorDecoration(bctx, centerX, centerY, true);
        bctx.save();
        this.createEllipseClipPath(bctx, centerX, centerY, 358 * sf, 138 * sf);
        this.renderSettlementPaths(bctx, canvas, centerX, centerY);
        this.renderSettlementDetails(bctx, centerX, centerY);
        bctx.restore();

        this._sceneFrontOverlayCanvas = document.createElement('canvas');
        this._sceneFrontOverlayCanvas.width = canvas.width;
        this._sceneFrontOverlayCanvas.height = canvas.height;
        const fctx = this._sceneFrontOverlayCanvas.getContext('2d');
        this.renderFrontWallOverlay(fctx, canvas, centerX, centerY);
    }

    renderActiveBoons(ctx, canvas) {
        if (!this.stateManager.marketplaceSystem) return;
        
        // Show boon status in settlement - only if boon is actually owned (active or not yet used)
        const frogKingBaneCount = this.stateManager.marketplaceSystem.getConsumableCount('frog-king-bane') || 0;
        if (frogKingBaneCount === 0) return;
        
        // Render boon status indicator in top-right corner
        const startX = canvas.width - 300;
        const startY = 60;
        
        ctx.save();
        
        // Draw glowing boon indicator
        const boxWidth = 270;
        const boxHeight = 45;
        
        // Glow effect
        ctx.shadowColor = '#FF8C00';
        ctx.shadowBlur = 15;
        ctx.fillStyle = 'rgba(255, 140, 0, 0.2)';
        ctx.fillRect(startX - 10, startY - 10, boxWidth + 20, boxHeight + 20);
        
        // Border
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = '#FF8C00';
        ctx.lineWidth = 2;
        ctx.strokeRect(startX, startY, boxWidth, boxHeight);
        
        // Background
        ctx.fillStyle = 'rgba(30, 20, 10, 0.9)';
        ctx.fillRect(startX, startY, boxWidth, boxHeight);
        
        // Icon - drawn crown
        (function(ctx, cx, cy, size) {
            ctx.save();
            const cw = size * 0.9, ch = size * 0.6;
            const crownX = cx - cw / 2;
            ctx.beginPath();
            ctx.moveTo(crownX, cy + ch * 0.28);
            ctx.lineTo(crownX, cy - ch * 0.38);
            ctx.lineTo(crownX + cw * 0.22, cy);
            ctx.lineTo(crownX + cw * 0.38, cy - ch);
            ctx.lineTo(crownX + cw * 0.5, cy - ch * 0.26);
            ctx.lineTo(crownX + cw * 0.62, cy - ch);
            ctx.lineTo(crownX + cw * 0.78, cy);
            ctx.lineTo(crownX + cw, cy - ch * 0.38);
            ctx.lineTo(crownX + cw, cy + ch * 0.28);
            ctx.closePath();
            const cg = ctx.createLinearGradient(cx, cy - ch, cx, cy + ch * 0.28);
            cg.addColorStop(0, '#FFE040'); cg.addColorStop(1, '#CC7000');
            ctx.fillStyle = cg; ctx.fill();
            ctx.strokeStyle = '#FF8C00'; ctx.lineWidth = 1; ctx.stroke();
            [0.22, 0.5, 0.78].forEach((p, i) => {
                ctx.beginPath();
                ctx.arc(crownX + cw * p, cy - (i === 1 ? ch * 0.88 : ch * 0.72), size * 0.07, 0, Math.PI * 2);
                ctx.fillStyle = i === 1 ? '#FF4040' : '#3060FF'; ctx.fill();
            });
            ctx.restore();
        })(ctx, startX + 17, startY + 22, 18);
        
        // Text - unified single line: "The spirits of the woods protect you"
        ctx.font = 'bold 11px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('The spirits of the woods protect you', startX + 35, startY + 22);
        
        ctx.restore();
    }

    createEllipseClipPath(ctx, x, y, radiusX, radiusY) {
        // Create a clipping region that is an ellipse - paths will only render inside
        ctx.beginPath();
        ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.clip();
    }

    /**
     * Scatter rocks and small shrubs around the OUTSIDE of the elliptical wall.
     * @param {boolean} frontHalf - true = lower/front arc (rendered after wall),
     *                              false = upper/rear arc (rendered before wall)
     */
    renderWallExteriorDecoration(ctx, centerX, centerY, frontHalf) {
        const sf = this.stateManager.canvas.width / 1920;
        const rX = 360 * sf;
        const rY = 140 * sf;

        // ── Natural clumps of rocks/shrubs/grass tufts, grouped into loose
        // clusters (rather than one item spaced evenly per slot) so the border
        // reads as scattered undergrowth instead of a dotted ring ──────────────
        const clusterTotal = 20; // candidate cluster centers around the full perimeter

        for (let i = 0; i < clusterTotal; i++) {
            const angle = (i / clusterTotal) * Math.PI * 2;
            const sinA = Math.sin(angle);
            const cosA = Math.cos(angle);

            // Front half: sin > 0  (bottom arc, higher Y, closer to viewer)
            // Back  half: sin <= 0 (top  arc, lower  Y, further from viewer)
            if (frontHalf  && sinA <= 0.05) continue;
            if (!frontHalf && sinA >  0.05) continue;

            // Skip gate gap (bottom-center) — gate is at angle ≈ π/2
            const normAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            if (normAngle > 1.20 && normAngle < 1.94) continue; // ~69-111 deg

            // Skip guard-tower flanking zones (centerX ± ~120 px at the very bottom)
            if (sinA > 0.88 && Math.abs(cosA * rX) < 150) continue;

            // Clusters 7, 8 and 9 cover the whole front-left arc between the guard-tower
            // flanking zone and the west point, near the Arcane Library. The wall's rendered
            // band is visually thinner there than the ellipse math assumes, so shrubs from any
            // of these clusters end up partially covered, leaving a stray sliver poking out
            // from underneath the wall.
            if (i === 7 || i === 8 || i === 9) continue;

            // Deterministic LCG seeded from cluster index — stable across frames
            let s = (i * 1664525 + 1013904223) >>> 0;
            const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return (s >>> 0) / 0x100000000; };
            const r1 = rnd(), r2 = rnd(), r3 = rnd();

            // Cluster center — outset radially from wall surface with tangential scatter
            const outset  = 22 + r1 * 30;
            const tangent = (r2 - 0.5) * 20;
            const cx = centerX + (rX + outset) * cosA + (-sinA) * tangent;
            const cy = centerY + (rY + outset) * sinA + cosA   * tangent;

            const itemCount = 2 + Math.floor(r3 * 3); // 2-4 items per clump

            for (let j = 0; j < itemCount; j++) {
                const jr1 = rnd(), jr2 = rnd(), jr3 = rnd();
                // Tight local offset — keeps items visually clumped together
                const localAngle = jr1 * Math.PI * 2;
                const localDist = jr2 * 13 * sf;
                const wx = cx + Math.cos(localAngle) * localDist;
                const wy = cy + Math.sin(localAngle) * localDist * 0.6;

                // First item in every clump anchors as a shrub; the rest are
                // small rocks/grass tucked beside it, like real undergrowth
                const type = j === 0 ? 1 : Math.floor(jr3 * 3);

                if (type === 1) {
                    const r = (5 + jr2 * 6) * sf;
                    this.renderShrub(ctx, wx, wy, r);
                } else if (type === 2) {
                    // Grass tuft — a few thin curved blades
                    ctx.strokeStyle = `rgba(${60 + jr3 * 30 | 0}, ${100 + jr3 * 40 | 0}, ${40 + jr3 * 20 | 0}, 0.85)`;
                    ctx.lineWidth = 1.2 * sf;
                    for (let b = 0; b < 3; b++) {
                        const bAngle = -Math.PI / 2 + (b - 1) * 0.5 + (jr1 - 0.5) * 0.3;
                        const bLen = (6 + jr2 * 5) * sf;
                        ctx.beginPath();
                        ctx.moveTo(wx, wy);
                        ctx.quadraticCurveTo(
                            wx + Math.cos(bAngle) * bLen * 0.6, wy + Math.sin(bAngle) * bLen * 0.6,
                            wx + Math.cos(bAngle) * bLen, wy + Math.sin(bAngle) * bLen
                        );
                        ctx.stroke();
                    }
                } else {
                    // Small rock
                    const size = (5 + jr1 * 8) * sf;
                    const tone = 92 + Math.floor(jr3 * 32);
                    const rot  = jr1 * 1.5;

                    ctx.fillStyle = `rgb(${tone},${tone - 11},${tone - 24})`;
                    ctx.beginPath();
                    ctx.ellipse(wx, wy, size * 0.72, size * 0.44, rot, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = 'rgba(0,0,0,0.22)';
                    ctx.beginPath();
                    ctx.ellipse(wx + 1, wy + 2, size * 0.66, size * 0.30, rot, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = 'rgba(255,255,255,0.13)';
                    ctx.beginPath();
                    ctx.ellipse(wx - size * 0.18, wy - size * 0.14, size * 0.28, size * 0.16, rot, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }

    /**
     * Draws a single palisade stick post with weathering variation, a lashing band
     * (ties it visually to its neighbours instead of reading as a loose stake), and
     * a contact shadow that grounds it against the earth rampart.
     */
    renderPalisadePost(ctx, x, y, i, sf = 1) {
        const postWidth = 12 * sf;
        const postHeight = (60 + (i % 3 === 0 ? 6 : 0)) * sf;

        // Deterministic per-post weathering tone — avoids a uniform "extruded" look
        let s = (i * 2654435761) >>> 0;
        s = (s * 1664525 + 1013904223) >>> 0;
        const w = ((s >>> 0) / 0x100000000 - 0.5) * 20;

        // Contact shadow where the post meets the rampart crest
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(x, y + 1 * sf, postWidth * 0.75, 3 * sf, 0, 0, Math.PI * 2);
        ctx.fill();

        // Left side shadow (3D depth)
        ctx.fillStyle = `rgb(${(74 + w * 0.4) | 0}, ${(58 + w * 0.3) | 0}, ${(42 + w * 0.2) | 0})`;
        ctx.fillRect(x - postWidth / 2 - 3 * sf, y - postHeight, 3 * sf, postHeight);

        // Main trunk - medium brown, weathered per-post
        ctx.fillStyle = `rgb(${(107 + w) | 0}, ${(90 + w * 0.8) | 0}, ${(71 + w * 0.6) | 0})`;
        ctx.fillRect(x - postWidth / 2, y - postHeight, postWidth, postHeight);

        // Right side highlight (3D depth)
        ctx.fillStyle = `rgb(${(139 + w * 0.5) | 0}, ${(122 + w * 0.4) | 0}, ${(103 + w * 0.3) | 0})`;
        ctx.fillRect(x + postWidth / 2, y - postHeight, 2 * sf, postHeight);

        // Vertical grain lines for wood texture
        ctx.strokeStyle = '#4a3a2a';
        ctx.lineWidth = 1;
        for (let g = 0; g < postHeight; g += 6 * sf) {
            ctx.beginPath();
            ctx.moveTo(x - postWidth / 2 + 2 * sf, y - postHeight + g);
            ctx.lineTo(x - postWidth / 2 + 2 * sf, y - postHeight + g + 4 * sf);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x + postWidth / 2 - 2 * sf, y - postHeight + g);
            ctx.lineTo(x + postWidth / 2 - 2 * sf, y - postHeight + g + 4 * sf);
            ctx.stroke();
        }

        // Rope lashing — sits at the same height as the horizontal connecting rail,
        // reinforcing that the posts read as one bound structure, not loose stakes
        const lashY = y - postHeight * 0.68;
        ctx.strokeStyle = '#5c4527';
        ctx.lineWidth = 2.2 * sf;
        ctx.beginPath();
        ctx.moveTo(x - postWidth / 2 - 3 * sf, lashY - 1.2 * sf);
        ctx.lineTo(x + postWidth / 2 + 2 * sf, lashY - 1.2 * sf);
        ctx.stroke();
        ctx.strokeStyle = '#3c2c18';
        ctx.lineWidth = 1 * sf;
        ctx.beginPath();
        ctx.moveTo(x - postWidth / 2 - 3 * sf, lashY + 1.3 * sf);
        ctx.lineTo(x + postWidth / 2 + 2 * sf, lashY + 1.3 * sf);
        ctx.stroke();

        // Post top cap - pointed
        ctx.fillStyle = '#5a4a37';
        ctx.beginPath();
        ctx.moveTo(x - postWidth / 2, y - postHeight);
        ctx.lineTo(x, y - postHeight - 5 * sf);
        ctx.lineTo(x + postWidth / 2, y - postHeight);
        ctx.fill();
    }

    renderEllipticalPalisade(ctx, canvas, centerX, centerY) {
        // Simple vertical stick palisade with 3D trunk texture
        const sf = canvas.width / 1920;
        const radiusX = 360 * sf;
        const radiusY = 140 * sf;
        
        // ─────────────────────────────────────────────────────────────────────────
        // FOUNDATION — prominent earth rampart with stone footing
        // Drawn back-to-front so layers stack correctly
        // ─────────────────────────────────────────────────────────────────────────

        // Outermost cast shadow from the entire rampart mass
        ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
        ctx.beginPath();
        ctx.ellipse(centerX + 6, centerY + 28, radiusX + 34, radiusY + 34, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wide outer earth berm — darkest EARTH colour
        ctx.fillStyle = '#5c4424';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 10, radiusX + 32, radiusY + 32, 0, 0, Math.PI * 2);
        ctx.fill();

        // Second berm layer — mid-earth tone, raised slightly
        ctx.fillStyle = '#7a5c38';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 6, radiusX + 24, radiusY + 24, 0, 0, Math.PI * 2);
        ctx.fill();

        // Rampart face — packed warm earth
        ctx.fillStyle = '#96784c';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 2, radiusX + 16, radiusY + 16, 0, 0, Math.PI * 2);
        ctx.fill();

        // Subtle contour-line shadow (makes the rampart look curved/3-D)
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 4, radiusX + 18, radiusY + 18, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(0,0,0,0.10)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 8, radiusX + 26, radiusY + 26, 0, 0, Math.PI * 2);
        ctx.stroke();

        // ── ROUGH EARTH EDGE — irregular speckled texture on the berm face ──────
        // Instead of a stone block ring (which looks like planks at the front),
        // we speckle small earth-tone patches along the berm to give an organic texture.
        const speckSeed = 7919;
        const speckCount = 90;
        for (let i = 0; i < speckCount; i++) {
            const si = (i * speckSeed) & 0xFFFF;
            // Distribute along perimeter at varying radial depths (inside the berm)
            const ang = (i / speckCount) * Math.PI * 2 + (si % 100) * 0.001;
            const radDepth = 10 + (si % 18);  // 10–28px inside the outer berm edge
            const rX = centerX + (radiusX + 28 - radDepth) * Math.cos(ang);
            const rY = centerY + (radiusY + 28 - radDepth) * Math.sin(ang) + 4;
            const sW = 5 + (si % 7);
            const sH = 3 + (si % 4);
            const tone = 65 + (si % 22);  // dark earth speck colours
            ctx.fillStyle = `rgba(${tone}, ${tone - 8}, ${tone - 18}, 0.55)`;
            ctx.beginPath();
            ctx.ellipse(rX, rY, sW, sH, ang, 0, Math.PI * 2);
            ctx.fill();
        }

        // Berm edge — a ridge line where the outer earth bank peaks
        // Draw as a slightly lighter thick ellipse stroke, no rotation artifacts
        ctx.strokeStyle = '#b09060';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 2, radiusX + 18, radiusY + 18, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Rampart crest — packed-gravel / soil strip, slightly elevated inner shelf
        ctx.fillStyle = '#8a6c44';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - 1, radiusX + 10, radiusY + 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Crest top-light (warm sunlight catching the top of the earth bank)
        ctx.strokeStyle = '#c8a870';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(centerX - 2, centerY - 3, radiusX + 6, radiusY + 4, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Inner soil collar — dark packed earth band immediately inside palisade base
        ctx.fillStyle = '#6e5632';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - 3, radiusX + 3, radiusY + 1, 0, 0, Math.PI * 2);
        ctx.fill();

        // ── STONE FOOTING COURSE — grey stone blocks running the full perimeter
        // just beneath the wood posts, in the same palette as the guard-tower and
        // gate bases (#A9A9A9/#696969). This is what visually ties the wall, the
        // gate and the two flanking towers together into one defensive structure
        // instead of three unrelated props sharing a canvas.
        const footingSpacing = 22;
        const footingPerimeter = Math.PI * (radiusX + radiusY) * 1.5;
        const footingCount = Math.ceil(footingPerimeter / footingSpacing);
        for (let i = 0; i < footingCount; i++) {
            const angle = (i / footingCount) * Math.PI * 2;
            const fx = centerX + radiusX * Math.cos(angle);
            const fy = centerY + radiusY * Math.sin(angle) - 1;

            // Skip the gate gap so footing doesn't cut across the archway
            if (Math.abs(fx - centerX) < 52 && fy > centerY + radiusY - 20) continue;

            const tangent = Math.atan2(radiusY * Math.cos(angle), -radiusX * Math.sin(angle));
            const blockW = 15, blockH = 7;
            ctx.save();
            ctx.translate(fx, fy);
            ctx.rotate(tangent);
            ctx.fillStyle = (i % 2 === 0) ? '#8a8a8a' : '#767676';
            ctx.fillRect(-blockW / 2, -blockH / 2, blockW, blockH);
            ctx.strokeStyle = '#4a4a4a';
            ctx.lineWidth = 1;
            ctx.strokeRect(-blockW / 2, -blockH / 2, blockW, blockH);
            ctx.fillStyle = 'rgba(255,255,255,0.12)';
            ctx.fillRect(-blockW / 2, -blockH / 2, blockW, 1.5);
            ctx.restore();
        }

        // Draw vertical STICK posts around the ellipse with 3D trunk texture
        // Render in proper z-order: back posts first, then sides, then front for natural layering
        const postSpacing = 18; // Vertical sticks
        const perimeter = Math.PI * (radiusX + radiusY) * 1.5;
        const postCount = Math.ceil(perimeter / postSpacing);
        
        // Collect all posts with depth info
        const posts = [];
        for (let i = 0; i < postCount; i++) {
            const angle = (i / postCount) * Math.PI * 2;
            const x = centerX + radiusX * Math.cos(angle);
            const y = centerY + radiusY * Math.sin(angle);
            
            // Skip if this is the center gate area
            const distFromCenterGate = Math.abs(x - centerX);
            if (distFromCenterGate < 50 && y > centerY + radiusY - 20) {
                continue;
            }
            
            posts.push({ x, y, angle, i });
        }
        
        // Sort posts by Y position (depth) - back (smaller Y) to front (larger Y)
        posts.sort((a, b) => a.y - b.y);
        
        // Back-arc posts only — front-arc posts are re-drawn last via renderFrontWallOverlay
        // so they always appear in front of interior settlement buildings
        posts.filter(p => p.y <= centerY).forEach(post => {
            this.renderPalisadePost(ctx, post.x, post.y, post.i, sf);
        });
        // Note: horizontal rail, gate, and guard towers are rendered in renderFrontWallOverlay
    }
    
    renderFrontWallOverlay(ctx, canvas, centerX, centerY) {
        // Renders the front-facing wall posts, horizontal rail, gate, and guard towers
        // Called AFTER all interior content so these elements always draw on top
        const sf = canvas.width / 1920;
        const radiusX = 360 * sf;
        const radiusY = 140 * sf;

        const postSpacing = 18;
        const perimeter = Math.PI * (radiusX + radiusY) * 1.5;
        const postCount = Math.ceil(perimeter / postSpacing);

        const posts = [];
        for (let i = 0; i < postCount; i++) {
            const angle = (i / postCount) * Math.PI * 2;
            const x = centerX + radiusX * Math.cos(angle);
            const y = centerY + radiusY * Math.sin(angle);

            const distFromCenterGate = Math.abs(x - centerX);
            if (distFromCenterGate < 50 && y > centerY + radiusY - 20) continue;

            // Only render the front arc (y > centerY) in this overlay pass
            if (y <= centerY) continue;

            posts.push({ x, y, angle, i });
        }

        posts.sort((a, b) => a.y - b.y);

        posts.forEach(post => {
            this.renderPalisadePost(ctx, post.x, post.y, post.i, sf);
        });

        // Horizontal connecting rail — drawn over all posts and interior content
        ctx.strokeStyle = '#4a3a2a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - 46 * sf, radiusX - 6 * sf, radiusY - 6 * sf, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#7a6040';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - 48 * sf, radiusX - 6 * sf, radiusY - 6 * sf, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Gate and guard towers — always topmost front elements. Towers sit
        // right up against the gate posts so the whole thing reads as one
        // gatehouse structure (tower-archway-tower) instead of a plain gate
        // with two separate towers elsewhere along the wall.
        this.renderIntegratedGate(ctx, centerX, centerY + radiusY - 5 * sf, sf);
        this.renderGuardTowerWithBase(ctx, centerX - 68 * sf, centerY + radiusY + 15 * sf, sf, -1);
        this.renderGuardTowerWithBase(ctx, centerX + 68 * sf, centerY + radiusY + 15 * sf, sf, 1);

        // Foreground trees standing just outside the front wall, drawn last so their
        // canopies overlap the palisade's upper rail. Without this, every exterior tree
        // is drawn once, behind the entire settlement (see renderSettlementTerrain) - the
        // settlement then always paints over all of them, so it reads as a flat disc
        // pasted onto the forest rather than a settlement actually standing among the
        // trees.
        this.renderWallForegroundTrees(ctx);
    }

    /** See renderFrontWallOverlay's call site for why this exists. Draws _frontTreesWall - the
     * real ambient forest trees renderSettlementTerrain classified as standing south of (closer
     * to the viewer than) the wall's own elliptical curve at their particular x, not just a
     * handful of fixed accent positions - any other nearby tree was still silently getting
     * painted over by the wall/palisade, reading as the settlement standing on top of it. */
    renderWallForegroundTrees(ctx) {
        (this._frontTreesWall || []).forEach(t => {
            const gridX = Math.floor(t.x / 50);
            const gridY = Math.floor(t.y / 50);
            this.renderTree(ctx, t.x, t.y, t.size, gridX, gridY);
        });
    }

    renderIntegratedGate(ctx, x, y, sf = 1) {
        // Gate integrated into wall structure - part of the wall
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(sf, sf);
        ctx.translate(-x, -y);
        const gateWidth = 55;
        const gateHeight = 60;

        // Stone footing beneath the gate — same grey palette as the guard-tower
        // bases (#A9A9A9/#696969), spanning tower-to-tower so the gate reads as
        // part of the same structure as the towers flanking it, not a separate
        // wooden prop. The towers redraw their own footing on top of the outer
        // ends, so it's safe to run this the full width between them.
        const footW = 184;
        ctx.fillStyle = '#A9A9A9';
        ctx.fillRect(x - footW / 2, y, footW, 9);
        ctx.fillStyle = '#D3D3D3';
        ctx.fillRect(x - footW / 2, y, footW, 2);
        ctx.strokeStyle = '#696969';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - footW / 2, y, footW, 9);
        for (let i = 1; i < 8; i++) {
            const bx = x - footW / 2 + (footW * i / 8);
            ctx.beginPath();
            ctx.moveTo(bx, y);
            ctx.lineTo(bx, y + 9);
            ctx.stroke();
        }

        // Posts flanking gate (left and right)
        // Left post
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(x - gateWidth/2 - 8, y - gateHeight, 3, gateHeight);
        ctx.fillStyle = '#6b5a47';
        ctx.fillRect(x - gateWidth/2 - 5, y - gateHeight, 10, gateHeight);
        ctx.fillStyle = '#8b7a67';
        ctx.fillRect(x - gateWidth/2 + 5, y - gateHeight, 2, gateHeight);
        
        // Right post
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(x + gateWidth/2 + 5, y - gateHeight, 3, gateHeight);
        ctx.fillStyle = '#6b5a47';
        ctx.fillRect(x + gateWidth/2 - 5, y - gateHeight, 10, gateHeight);
        ctx.fillStyle = '#8b7a67';
        ctx.fillRect(x + gateWidth/2 + 5, y - gateHeight, 2, gateHeight);
        
        // Gate frame - wooden structure
        ctx.fillStyle = '#8b6f47';
        ctx.fillRect(x - gateWidth/2, y - gateHeight, gateWidth, gateHeight);
        
        // Vertical planks on gate
        ctx.strokeStyle = '#5a4630';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const plankX = x - gateWidth/2 + (gateWidth * i / 4);
            ctx.beginPath();
            ctx.moveTo(plankX, y - gateHeight);
            ctx.lineTo(plankX, y);
            ctx.stroke();
        }
        
        // Horizontal support beams
        ctx.lineWidth = 3;
        for (let i = 1; i < 3; i++) {
            const supportY = y - gateHeight + (gateHeight * i / 3);
            ctx.beginPath();
            ctx.moveTo(x - gateWidth/2, supportY);
            ctx.lineTo(x + gateWidth/2, supportY);
            ctx.stroke();
        }
        
        // Gate hinges
        ctx.fillStyle = '#c0a080';
        ctx.fillRect(x - gateWidth/2 - 6, y - gateHeight + 10, 4, 5);
        ctx.fillRect(x - gateWidth/2 - 6, y - 18, 4, 5);
        ctx.fillRect(x + gateWidth/2 + 2, y - gateHeight + 10, 4, 5);
        ctx.fillRect(x + gateWidth/2 + 2, y - 18, 4, 5);
        
        ctx.restore();
    }

    renderWatchtowerStructure(ctx, x, y) {
        // Tower structure based on BasicTower rendering style
        const baseSize = 50;
        const baseHeight = 8;
        const towerSize = 42;
        const towerHeight = 35;
        const platformSize = 48;
        const platformHeight = 5;
        const roofSize = 50;
        const roofHeight = 20;
        
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.save();
        ctx.translate(x + 2, y + 2);
        ctx.scale(1, 0.3);
        ctx.fillRect(-baseSize/2, -baseSize/2, baseSize, baseSize);
        ctx.restore();
        
        // Stone base
        ctx.fillStyle = '#A9A9A9';
        ctx.fillRect(x - baseSize/2, y - baseHeight, baseSize, baseHeight);
        
        // Base top highlight
        ctx.fillStyle = '#D3D3D3';
        ctx.fillRect(x - baseSize/2, y - baseHeight, baseSize, 2);
        
        // Stone lines
        ctx.strokeStyle = '#696969';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - baseSize/2, y - baseHeight, baseSize, baseHeight);
        for (let i = 1; i < 3; i++) {
            const stoneY = y - baseHeight + (baseHeight * i / 3);
            ctx.beginPath();
            ctx.moveTo(x - baseSize/2, stoneY);
            ctx.lineTo(x + baseSize/2, stoneY);
            ctx.stroke();
        }
        
        // Tower structure
        const towerY = y - baseHeight - towerHeight;
        const platformY = towerY - platformHeight;
        const roofY = platformY - roofHeight;
        
        // Four corner posts with wood grain
        const postSize = 4;
        const postOffset = towerSize/2 - postSize/2;
        
        ctx.fillStyle = '#7a3f18';
        const posts = [
            {x: -postOffset}, {x: postOffset}
        ];
        
        posts.forEach(post => {
            // Post
            ctx.fillRect(x + post.x, towerY, postSize, towerHeight);
            
            // Wood grain
            ctx.strokeStyle = '#5a2f10';
            ctx.lineWidth = 1;
            for (let i = 1; i < 5; i++) {
                const grainY = towerY + (towerHeight * i / 6);
                ctx.beginPath();
                ctx.moveTo(x + post.x, grainY);
                ctx.lineTo(x + post.x + postSize, grainY);
                ctx.stroke();
            }
            
            // Metal corner plate
            ctx.fillStyle = '#606060';
            ctx.fillRect(x + post.x - 1, towerY, 5, 8);
            ctx.strokeStyle = '#333';
            ctx.strokeRect(x + post.x - 1, towerY, 5, 8);
        });
        
        // Horizontal braces
        ctx.strokeStyle = '#5b3a24';
        ctx.lineWidth = 2;
        const braceYs = [
            towerY + towerHeight * 0.3,
            towerY + towerHeight * 0.6
        ];
        braceYs.forEach(braceY => {
            ctx.beginPath();
            ctx.moveTo(x - postOffset + 1, braceY);
            ctx.lineTo(x + postOffset - 1, braceY);
            ctx.stroke();
        });
        
        // Platform
        ctx.fillStyle = '#CDAA7A';
        ctx.fillRect(x - platformSize/2, platformY, platformSize, platformHeight);
        
        // Platform top bevel
        ctx.fillStyle = '#DABE94';
        ctx.fillRect(x - platformSize/2, platformY, platformSize, 2);
        
        // Platform planks
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 1;
        const planks = 5;
        for (let i = 0; i < planks; i++) {
            const plankX = x - platformSize/2 + (platformSize * i / planks);
            ctx.beginPath();
            ctx.moveTo(plankX, platformY);
            ctx.lineTo(plankX, platformY + platformHeight);
            ctx.stroke();
        }
        
        // Roof posts
        const roofPostOffset = platformSize/2 - 2;
        ctx.fillStyle = '#5a341d';
        ctx.fillRect(x - roofPostOffset, platformY, 2, -roofHeight);
        ctx.fillRect(x + roofPostOffset, platformY, 2, -roofHeight);
        ctx.fillRect(x, platformY, 2, -roofHeight);

        // ── Peaked triangular roof ────────────────────────────────────────────
        const roofBaseY = platformY;
        const roofPeakY = roofY - 10;
        const roofHalfW = roofSize / 2 + 3;

        // Roof shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.moveTo(x + 2, roofPeakY + 2);
        ctx.lineTo(x - roofHalfW + 2, roofBaseY + 2);
        ctx.lineTo(x + roofHalfW + 2, roofBaseY + 2);
        ctx.closePath();
        ctx.fill();

        // Roof face
        ctx.fillStyle = '#5a341d';
        ctx.strokeStyle = '#3d2010';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, roofPeakY);
        ctx.lineTo(x - roofHalfW, roofBaseY);
        ctx.lineTo(x + roofHalfW, roofBaseY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Shingle lines
        ctx.strokeStyle = '#3d2010';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const t = i / 4;
            const sy = roofPeakY + (roofBaseY - roofPeakY) * t;
            const hw = roofHalfW * t;
            ctx.beginPath();
            ctx.moveTo(x - hw, sy);
            ctx.lineTo(x + hw, sy);
            ctx.stroke();
        }

        // Flagpole at peak
        ctx.strokeStyle = '#5a341d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, roofPeakY);
        ctx.lineTo(x, roofPeakY - 13);
        ctx.stroke();

        // Burgundy pennant
        ctx.fillStyle = '#8B1E3F';
        ctx.beginPath();
        ctx.moveTo(x, roofPeakY - 13);
        ctx.lineTo(x + 9, roofPeakY - 9);
        ctx.lineTo(x, roofPeakY - 5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#5b1028';
        ctx.lineWidth = 0.5;
        ctx.stroke();
    }

    renderGuardTowerWithBase(ctx, x, y, sf = 1, side = 1) {
        // Guard tower styled like BasicTower - wooden tower with stone base, connected to ground.
        // `side` picks which way the 3D depth panels turn: +1 turns them to the
        // right (use for a tower on the right of the gate), -1 turns them to the
        // left (use for a tower on the left) — so the "turned corner" always
        // faces outward, away from the gate, instead of jutting into it.
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(sf, sf);
        ctx.translate(-x, -y);
        const towerSize = 50;
        const towerHeight = 70;
        const baseSize = 60;
        const baseHeight = 16;
        const platformSize = 55;
        const platformHeight = 8;
        const roofSize = 58;
        const roofHeight = 30;

        // Shadow - connected to ground
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.save();
        ctx.translate(x + 3, y + 3);
        ctx.scale(1, 0.3);
        ctx.fillRect(-baseSize/2, -baseSize/2, baseSize, baseSize);
        ctx.restore();

        // Outward-side depth strip — a plain flush-to-the-ground rectangle
        // (same top/bottom as the front face, just narrower and darker), not a
        // skewed diagonal panel, so there's no floating/mismatched-perspective
        // edge where it should meet the ground.
        const baseDepth = baseSize * 0.08;
        const edgeX = x + side * baseSize / 2;
        ctx.fillStyle = '#7c7c7c';
        ctx.fillRect(Math.min(edgeX, edgeX + side * baseDepth), y - baseHeight, baseDepth, baseHeight);
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 1;
        ctx.strokeRect(Math.min(edgeX, edgeX + side * baseDepth), y - baseHeight, baseDepth, baseHeight);

        // Stone base platform - connected to ground, gradient shaded so the
        // outward side reads slightly darker (in shadow) than the gate-facing side
        const baseGrad = ctx.createLinearGradient(x - side * baseSize / 2, 0, x + side * baseSize / 2, 0);
        baseGrad.addColorStop(0, '#c2c2c2');
        baseGrad.addColorStop(0.55, '#A9A9A9');
        baseGrad.addColorStop(1, '#8c8c8c');
        ctx.fillStyle = baseGrad;
        ctx.fillRect(x - baseSize/2, y - baseHeight, baseSize, baseHeight);

        // Base top highlight
        ctx.fillStyle = '#D3D3D3';
        ctx.fillRect(x - baseSize/2, y - baseHeight, baseSize, 2);

        // Coursed masonry blocks — three offset rows instead of a single flat stroke
        ctx.strokeStyle = '#696969';
        ctx.lineWidth = 1;
        const courseRows = 3;
        const courseH = baseHeight / courseRows;
        for (let row = 0; row < courseRows; row++) {
            const rowY = y - baseHeight + row * courseH;
            const off = (row % 2 === 0) ? 0 : baseSize * 0.08;
            const blockW = baseSize / 6;
            for (let col = -1; col < 7; col++) {
                const bx1 = Math.max(x - baseSize / 2 + col * blockW + off, x - baseSize / 2);
                const bx2 = Math.min(x - baseSize / 2 + (col + 1) * blockW + off, x + baseSize / 2);
                if (bx2 > bx1) ctx.strokeRect(bx1, rowY, bx2 - bx1, courseH);
            }
        }
        ctx.strokeRect(x - baseSize/2, y - baseHeight, baseSize, baseHeight);

        // Main tower body - wood
        const towerY = y - baseHeight - towerHeight;

        // Wooden posts at corners — left post at outer left edge, right post at outer right edge
        ctx.fillStyle = '#7a3f18';
        const postSize = 6;
        const postOffset = towerSize/2 - postSize;
        ctx.fillRect(x - towerSize/2, towerY, postSize, towerHeight);  // left post at outer edge
        ctx.fillRect(x + postOffset, towerY, postSize, towerHeight);   // right post at outer edge

        // Wood grain lines across full width
        ctx.strokeStyle = '#5a2f10';
        ctx.lineWidth = 1;
        for (let i = 1; i < 7; i++) {
            const grainY = towerY + (towerHeight * i / 8);
            ctx.beginPath();
            ctx.moveTo(x - towerSize/2, grainY);
            ctx.lineTo(x + postOffset + postSize, grainY);
            ctx.stroke();
        }

        // Tower main fill between posts — gradient shaded for a rounded read
        // instead of a single flat tone
        const towerGrad = ctx.createLinearGradient(x - towerSize / 2, 0, x + towerSize / 2, 0);
        towerGrad.addColorStop(0, '#9c826a');
        towerGrad.addColorStop(0.5, '#8B7355');
        towerGrad.addColorStop(1, '#6f5a45');
        ctx.fillStyle = towerGrad;
        ctx.fillRect(x - towerSize/2 + postSize, towerY, towerSize - (postSize * 2), towerHeight);

        // Tower stones/planks
        ctx.strokeStyle = '#696969';
        ctx.lineWidth = 1;
        for (let i = 0; i < towerHeight; i += 10) {
            ctx.beginPath();
            ctx.moveTo(x - towerSize/2, towerY + i);
            ctx.lineTo(x + towerSize/2, towerY + i);
            ctx.stroke();
        }

        // Corner knee-braces near the base — real timber-framed structural detail
        ctx.strokeStyle = '#5a2f10';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - towerSize / 2 + postSize, towerY + towerHeight * 0.78);
        ctx.lineTo(x - towerSize / 2 + postSize + 10, towerY + towerHeight * 0.98);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + towerSize / 2 - postSize, towerY + towerHeight * 0.78);
        ctx.lineTo(x + towerSize / 2 - postSize - 10, towerY + towerHeight * 0.98);
        ctx.stroke();

        // Metal corner plates — symmetric on both sides
        ctx.fillStyle = '#606060';
        ctx.fillRect(x - towerSize/2 - 1, towerY, 5, 12);
        ctx.fillRect(x + postOffset, towerY, 5, 12);
        ctx.strokeStyle = '#333';
        ctx.strokeRect(x - towerSize/2 - 1, towerY, 5, 12);
        ctx.strokeRect(x + postOffset, towerY, 5, 12);
        
        // Platform at top
        ctx.fillStyle = '#DABE94';
        ctx.fillRect(x - platformSize/2, towerY - platformHeight, platformSize, platformHeight);
        
        // Platform planks
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const plankX = x - platformSize/2 + (platformSize * i / 5);
            ctx.beginPath();
            ctx.moveTo(plankX, towerY - platformHeight);
            ctx.lineTo(plankX, towerY);
            ctx.stroke();
        }
        
        // Platform edge
        ctx.strokeStyle = '#8B6914';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - platformSize/2, towerY - platformHeight, platformSize, platformHeight);
        
        // Roof posts - center and sides
        ctx.fillStyle = '#5a341d';
        ctx.fillRect(x - platformSize/2 + 2, towerY - platformHeight - roofHeight, 3, roofHeight);
        ctx.fillRect(x + platformSize/2 - 5, towerY - platformHeight - roofHeight, 3, roofHeight);
        ctx.fillRect(x - 2, towerY - platformHeight - roofHeight, 3, roofHeight);

        // Arrow slits
        ctx.fillStyle = '#2a2a2a';
        for (let h = 0; h < 3; h++) {
            ctx.fillRect(x - towerSize/4, towerY + 15 + (h * 15), 2, 8);
            ctx.fillRect(x + towerSize/4 - 2, towerY + 15 + (h * 15), 2, 8);
        }

        // ── Peaked triangular roof ────────────────────────────────────────────
        const roofBaseY = towerY - platformHeight;
        const roofPeakY = roofBaseY - roofHeight - 14;
        const roofHalfW = roofSize / 2 + 4;

        // Roof shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.beginPath();
        ctx.moveTo(x + 2, roofPeakY + 2);
        ctx.lineTo(x - roofHalfW + 2, roofBaseY + 2);
        ctx.lineTo(x + roofHalfW + 2, roofBaseY + 2);
        ctx.closePath();
        ctx.fill();

        // Roof face
        ctx.fillStyle = '#5a341d';
        ctx.strokeStyle = '#3d2010';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, roofPeakY);
        ctx.lineTo(x - roofHalfW, roofBaseY);
        ctx.lineTo(x + roofHalfW, roofBaseY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Shingle lines
        ctx.strokeStyle = '#3d2010';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const t = i / 4;
            const sy = roofPeakY + (roofBaseY - roofPeakY) * t;
            const hw = roofHalfW * t;
            ctx.beginPath();
            ctx.moveTo(x - hw, sy);
            ctx.lineTo(x + hw, sy);
            ctx.stroke();
        }

        // Roof depth wedge — wraps the roof around the outward side for a
        // fuller, less paper-thin silhouette
        ctx.fillStyle = '#3d2010';
        ctx.beginPath();
        ctx.moveTo(x + side * roofHalfW, roofBaseY);
        ctx.lineTo(x + side * (roofHalfW + 6), roofBaseY - 3);
        ctx.lineTo(x + side * 6, roofPeakY - 3);
        ctx.lineTo(x, roofPeakY);
        ctx.closePath();
        ctx.fill();

        // Eave highlight
        ctx.strokeStyle = '#7a4a28';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - roofHalfW, roofBaseY);
        ctx.lineTo(x + roofHalfW, roofBaseY);
        ctx.stroke();

        // Flagpole at peak
        ctx.strokeStyle = '#5a341d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, roofPeakY);
        ctx.lineTo(x, roofPeakY - 16);
        ctx.stroke();

        // Burgund pennant
        ctx.fillStyle = '#8B1E3F';
        ctx.beginPath();
        ctx.moveTo(x, roofPeakY - 16);
        ctx.lineTo(x + 11, roofPeakY - 11);
        ctx.lineTo(x, roofPeakY - 6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#5b1028';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.restore();
    }

    renderWoodenPalisadeSide(ctx, x1, y1, x2, y2, side) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const unitX = dx / length;
        const unitY = dy / length;

        // Post spacing
        const postSpacing = 35;
        const postCount = Math.floor(length / postSpacing) + 1;

        for (let i = 0; i < postCount; i++) {
            const px = x1 + unitX * i * postSpacing;
            const py = y1 + unitY * i * postSpacing;

            // Wooden post
            ctx.fillStyle = '#8b6f47';
            ctx.fillRect(px - 4, py - 3, 8, 50);

            // Post detail lines
            ctx.strokeStyle = '#5a4630';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px - 3, py);
            ctx.lineTo(px - 3, py + 50);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(px + 3, py);
            ctx.lineTo(px + 3, py + 50);
            ctx.stroke();

            // Post top
            ctx.fillStyle = '#6b5a42';
            ctx.beginPath();
            ctx.moveTo(px - 4, py - 3);
            ctx.lineTo(px, py - 8);
            ctx.lineTo(px + 4, py - 3);
            ctx.fill();
        }

        // Horizontal beam
        ctx.fillStyle = '#9a7a5a';
        ctx.fillRect(x1, y1 + 20, dx || dy ? length : 1, 4);

        // Beam shadow
        ctx.fillStyle = '#6a5a42';
        ctx.fillRect(x1, y1 + 24, dx || dy ? length : 1, 2);
    }

    renderWoodenGate(ctx, x, y, side) {
        // Gate frame
        ctx.fillStyle = '#8b6f47';
        ctx.fillRect(x - 40, y - 5, 80, 45);

        // Gate boards - vertical
        ctx.strokeStyle = '#5a4630';
        ctx.lineWidth = 2;
        for (let i = 1; i < 4; i++) {
            const boardX = x - 40 + (80 / 4) * i;
            ctx.beginPath();
            ctx.moveTo(boardX, y - 5);
            ctx.lineTo(boardX, y + 40);
            ctx.stroke();
        }

        // Gate door center line
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y - 5);
        ctx.lineTo(x, y + 40);
        ctx.stroke();

        // Gate hinges
        ctx.fillStyle = '#c0a080';
        for (let i = 0; i < 3; i++) {
            const hy = y + 5 + i * 12;
            ctx.fillRect(x - 45, hy, 4, 4);
            ctx.fillRect(x + 41, hy, 4, 4);
        }

        // Gate handle
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(x + 15, y + 15, 6, 12);
    }

    renderSettlementBuildings(ctx, canvas, mode) {
        // mode='interior-all' → ALL non-exterior buildings, Y-sorted (painter's algorithm), in clipped pass
        // mode='exterior'     → only exterior buildings (Castle, TrainingGrounds), unclipped, with headers
        // mode='headers'      → only name labels for interior clickable buildings, unclipped (above wall)

        // Cache filtered/sorted subsets — buildings never move or change identity at runtime.
        if (!this._sbCache) {
            // Town houses are plain decorative props (not building-class instances), but they
            // still need to Y-sort and paint alongside the real buildings/guard posts so the
            // wall/palisade — baked once, behind everything — never ends up drawn on top of
            // them (which happened when they lived in the tightly-clipped static details layer).
            const houseItems = (this.townHouses || []).map(h => ({ isHouse: true, house: h }));
            this._sbCache = {
                headers: {
                    'TrainingGrounds': 'Campaign',
                    'MagicAcademy': 'Arcane Library',
                    'TowerForge': 'Buy & Sell',
                    'Castle': 'Manage Settlement',
                    'WorkshopHall': 'Workshop'
                },
                interior: this.settlementBuildings
                    .filter(item => !item.exterior && item.building)
                    .concat(houseItems)
                    .sort((a, b) => (a.isHouse ? a.house.y : a.building.y) - (b.isHouse ? b.house.y : b.building.y)),
                exterior: this.settlementBuildings.filter(item => item.exterior && item.building),
                headerItems: this.settlementBuildings
                    .filter(item => !item.exterior && item.clickable && item.action && item.building),
            };
        }
        const { headers, interior, exterior, headerItems } = this._sbCache;

        const renderBody = (item) => {
            ctx.globalAlpha = this.contentOpacity;
            if (item.isHouse) {
                this.renderTownHouse(ctx, item.house.x, item.house.y, item.house.scale, item.house.variant);
            } else if (item.building instanceof TrainingGrounds) {
                this.renderTrainingGroundsPreview(ctx, item.building);
            } else {
                const size = item.scale * 4;
                const visuals = new SettlementBuildingVisuals(item.building);
                visuals.render(ctx, size);
            }
            ctx.globalAlpha = 1;
        };

        if (mode === 'interior-all') {
            interior.forEach(renderBody);
        } else if (mode === 'exterior') {
            exterior.forEach(item => {
                renderBody(item);
                this.renderExteriorBuildingForegroundTrees(ctx, item.building);
                if (item.clickable && item.action) this.renderBuildingHeader(ctx, item, headers);
            });
        } else if (mode === 'headers') {
            headerItems.forEach(item => {
                ctx.globalAlpha = this.contentOpacity;
                this.renderBuildingHeader(ctx, item, headers);
                ctx.globalAlpha = 1;
            });
        }
    }

    /** Same idea as renderWallForegroundTrees (see renderFrontWallOverlay's call site): the
     * Castle otherwise always paints over every tree behind it (it's an exterior building,
     * drawn after and on top of the whole terrain bake), so it would read as a cutout pasted
     * onto the forest instead of standing within it. _frontTreesCastle is the real ambient
     * forest trees that renderSettlementTerrain pulled out of that background bake for standing
     * in front of the Castle's base (see its call site) - drawing them here, after the
     * building's own body, puts them back on top. (TrainingGrounds has no front-tree list - its
     * whole surrounding area is kept as a tree-free clearing instead, see renderSettlementTerrain.) */
    renderExteriorBuildingForegroundTrees(ctx, building) {
        if (!(building instanceof Castle)) return;
        const list = this._frontTreesCastle;
        if (!list) return;

        list.forEach(t => {
            const gridX = Math.floor(t.x / 50);
            const gridY = Math.floor(t.y / 50);
            this.renderTree(ctx, t.x, t.y, t.size, gridX, gridY);
        });
    }

    renderBuildingHeader(ctx, item, headers) {
        const buildingType = item.building.constructor.name;
        const headerText = headers[buildingType] || '';
        if (!headerText) return;

        const sf = this._sf || 1;
        const headerX = item.building.x;
        // WorkshopHall is shorter than the other headered buildings, so its default header
        // offset leaves an oversized gap above the building - sits a little lower than the rest.
        const headerOffset = buildingType === 'WorkshopHall' ? 82 : 120;
        const headerY = item.building.y - headerOffset * sf;
        const fontSize = Math.round(22 * sf);

        if (buildingType === 'TowerForge') {
            const lineSpacing = 15 * sf;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Upgrades &', headerX + 1, headerY - lineSpacing + 1);
            ctx.fillText('Marketplace', headerX + 1, headerY + lineSpacing + 1);
            ctx.fillStyle = '#FFD700';
            ctx.fillText('Upgrades &', headerX, headerY - lineSpacing);
            ctx.fillText('Marketplace', headerX, headerY + lineSpacing);
        } else {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.font = `bold ${Math.round(24 * sf)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(headerText, headerX + 1, headerY + 1);
            ctx.fillStyle = '#FFD700';
            ctx.fillText(headerText, headerX, headerY);
        }
    }

    /** Delegates to TrainingGrounds' own renderStaticBack/renderDynamicParts/renderParticles
     * (see TrainingGrounds.js) instead of a hand-duplicated copy of its geometry, so any visual
     * change made there automatically appears in this settlement preview too. */
    renderTrainingGroundsPreview(ctx, building) {
        const sf = this._sf || 1;
        const size = 0.7 * 2.2 * sf * 128; // matches the old duplicate's effective on-screen scale

        building._lastRenderSize = size; // read by update() to scale particle-spawn world positions

        // PRE-RENDER OPTIMIZATION: renderStaticBack is a fully deterministic structure
        // (walls/roof/dummy posts) that was being recomputed from scratch every frame -
        // same issue and same fix as SettlementBuildingVisuals.renderCachedBody, reused
        // here directly since TrainingGrounds bypasses that class (see call site above).
        const cache = ensureSettlementStaticBake(building, size);
        ctx.drawImage(cache.canvas, building.x - cache.origin, building.y - cache.origin);

        building.renderDynamicParts(ctx, size);
        building.renderStaticFront(ctx, size);
        building.renderParticles(ctx);
    }

    renderSettlementTerrain(ctx, canvas, centerX, centerY) {
        // Render only EXTERIOR trees behind the settlement walls.
        // Interior items (guard posts, flower beds, rocks, fountain) are handled
        // in the clipped interior pass inside renderSettlementScene().
        
        // Scattered trees throughout the entire settlement area
        // Create a natural forest feel with many trees in various sizes and depths
        // Settlement boundary: ellipse center (centerX, centerY), radiusX=360, radiusY=140
        // Trees positioned OUTSIDE the walls in the surrounding green area
        // ALL TREES: y-values must be >= centerY - 190 (not reaching into mountains)
        const treePositions = [
            // Far background - smallest trees (y >= centerY - 190)
            { x: centerX - 800, y: centerY - 190, size: 20 },
            { x: centerX - 500, y: centerY - 188, size: 18 },
            { x: centerX - 200, y: centerY - 190, size: 19 },
            { x: centerX + 200, y: centerY - 190, size: 19 },
            { x: centerX + 500, y: centerY - 188, size: 18 },
            { x: centerX + 800, y: centerY - 190, size: 20 },
            { x: centerX - 350, y: centerY - 189, size: 19 },
            { x: centerX + 350, y: centerY - 189, size: 19 },
            
            // Upper left area - outside settlement (x < centerX - 360)
            { x: centerX - 400, y: centerY - 180, size: 24 },
            { x: centerX - 550, y: centerY - 185, size: 22 },
            { x: centerX - 650, y: centerY - 178, size: 23 },
            { x: centerX - 650, y: centerY - 182, size: 21 },
            { x: centerX - 600, y: centerY - 179, size: 22 },
            { x: centerX - 900, y: centerY - 186, size: 21 },
            { x: centerX - 850, y: centerY - 183, size: 22 },
            
            // Upper right area - outside settlement (x > centerX + 360)
            { x: centerX + 700, y: centerY - 180, size: 24 },
            { x: centerX + 550, y: centerY - 185, size: 22 },
            { x: centerX + 750, y: centerY - 178, size: 23 },
            { x: centerX + 650, y: centerY - 182, size: 21 },
            { x: centerX + 600, y: centerY - 179, size: 22 },
            { x: centerX + 900, y: centerY - 186, size: 21 },
            { x: centerX + 850, y: centerY - 183, size: 22 },
            
            // Left side cluster - far outside walls
            { x: centerX - 820, y: centerY - 172, size: 32 },
            { x: centerX - 920, y: centerY - 168, size: 35 },
            { x: centerX - 850, y: centerY - 170, size: 30 },
            { x: centerX - 880, y: centerY - 165, size: 28 },
            { x: centerX - 800, y: centerY - 169, size: 29 },
            { x: centerX - 950, y: centerY - 170, size: 26 },
            { x: centerX - 600, y: centerY - 167, size: 27 },
            
            // Right side cluster - far outside walls
            { x: centerX + 820, y: centerY - 172, size: 32 },
            { x: centerX + 920, y: centerY - 168, size: 35 },
            { x: centerX + 750, y: centerY - 170, size: 30 },
            { x: centerX + 880, y: centerY - 165, size: 28 },
            { x: centerX + 800, y: centerY - 169, size: 29 },
            { x: centerX + 950, y: centerY - 170, size: 26 },
            { x: centerX + 700, y: centerY - 167, size: 27 },
            
            // Far left area
            { x: centerX - 600, y: centerY - 155, size: 31 },
            { x: centerX - 500, y: centerY - 160, size: 28 },
            { x: centerX - 950, y: centerY - 150, size: 33 },
            { x: centerX - 850, y: centerY - 145, size: 26 },
            { x: centerX - 550, y: centerY - 158, size: 27 },
            { x: centerX - 550, y: centerY - 152, size: 25 },
            { x: centerX - 900, y: centerY - 148, size: 29 },
            
            // Far right area
            { x: centerX + 700, y: centerY - 155, size: 31 },
            { x: centerX + 600, y: centerY - 160, size: 28 },
            { x: centerX + 850, y: centerY - 150, size: 33 },
            { x: centerX + 750, y: centerY - 145, size: 26 },
            { x: centerX + 650, y: centerY - 158, size: 27 },
            { x: centerX + 550, y: centerY - 152, size: 25 },
            { x: centerX + 900, y: centerY - 148, size: 29 },
            
            // Middle-left area
            { x: centerX - 550, y: centerY - 130, size: 34 },
            { x: centerX - 500, y: centerY - 125, size: 36 },
            { x: centerX - 450, y: centerY - 135, size: 32 },
            { x: centerX - 600, y: centerY - 128, size: 29 },
            { x: centerX - 900, y: centerY - 132, size: 31 },
            { x: centerX - 480, y: centerY - 118, size: 27 },
            
            // Middle-right area
            { x: centerX + 550, y: centerY - 130, size: 34 },
            { x: centerX + 700, y: centerY - 125, size: 36 },
            { x: centerX + 450, y: centerY - 135, size: 32 },
            { x: centerX + 600, y: centerY - 128, size: 29 },
            { x: centerX + 800, y: centerY - 132, size: 31 },
            { x: centerX + 680, y: centerY - 118, size: 27 },
            
            // Lower-middle left
            { x: centerX - 500, y: centerY - 110, size: 38 },
            { x: centerX - 750, y: centerY - 105, size: 40 },
            { x: centerX - 350, y: centerY - 115, size: 35 },
            { x: centerX - 650, y: centerY - 100, size: 32 },
            { x: centerX - 900, y: centerY - 108, size: 36 },
            
            // Lower-middle right
            { x: centerX + 500, y: centerY - 110, size: 38 },
            { x: centerX + 750, y: centerY - 105, size: 40 },
            { x: centerX + 350, y: centerY - 115, size: 35 },
            { x: centerX + 650, y: centerY - 100, size: 32 },
            { x: centerX + 900, y: centerY - 108, size: 36 },
            
            // Distant foreground left
            { x: centerX - 650, y: centerY - 70, size: 40 },
            { x: centerX - 450, y: centerY - 75, size: 38 },
            { x: centerX - 800, y: centerY - 65, size: 39 },
            
            // Distant foreground right
            { x: centerX + 650, y: centerY - 70, size: 40 },
            { x: centerX + 450, y: centerY - 75, size: 38 },
            { x: centerX + 800, y: centerY - 65, size: 39 },
            
            // ===== LOWER GREEN AREA TREES (below settlement) =====
            // Far left lower area
            { x: centerX - 550, y: centerY + 20, size: 36 },
            { x: centerX - 900, y: centerY + 30, size: 38 },
            { x: centerX - 450, y: centerY + 15, size: 34 },
            { x: centerX - 650, y: centerY + 35, size: 37 },
            { x: centerX - 800, y: centerY + 25, size: 39 },
            { x: centerX - 900, y: centerY + 28, size: 40 },
            
            // Far right lower area
            { x: centerX + 550, y: centerY + 20, size: 36 },
            { x: centerX + 700, y: centerY + 30, size: 38 },
            { x: centerX + 450, y: centerY + 15, size: 34 },
            { x: centerX + 650, y: centerY + 35, size: 37 },
            { x: centerX + 800, y: centerY + 25, size: 39 },
            { x: centerX + 900, y: centerY + 28, size: 40 },
            
            // Middle-lower left
            { x: centerX - 600, y: centerY + 50, size: 38 },
            { x: centerX - 850, y: centerY + 55, size: 40 },
            { x: centerX - 350, y: centerY + 45, size: 35, hidden: true }, // stranded right at the wall's west tip, reads as randomly planted against the palisade
            { x: centerX - 500, y: centerY + 60, size: 36 },
            { x: centerX - 850, y: centerY + 52, size: 41 },
            
            // Middle-lower right
            { x: centerX + 600, y: centerY + 50, size: 38 },
            { x: centerX + 750, y: centerY + 55, size: 40 },
            { x: centerX + 350, y: centerY + 45, size: 35 },
            { x: centerX + 500, y: centerY + 60, size: 36 },
            { x: centerX + 850, y: centerY + 52, size: 41 },
            
            // Lower left fringe
            { x: centerX - 900, y: centerY + 70, size: 39 },
            { x: centerX - 550, y: centerY + 75, size: 37 },
            { x: centerX - 850, y: centerY + 65, size: 40 },
            { x: centerX - 450, y: centerY + 72, size: 36 },
            
            // Lower right fringe
            { x: centerX + 700, y: centerY + 70, size: 39 },
            { x: centerX + 550, y: centerY + 75, size: 37 },
            { x: centerX + 850, y: centerY + 65, size: 40 },
            { x: centerX + 450, y: centerY + 72, size: 36 },
            
            // Bottom left corner
            { x: centerX - 600, y: centerY + 85, size: 38 },
            { x: centerX - 950, y: centerY + 80, size: 41 },
            { x: centerX - 400, y: centerY + 88, size: 36, hidden: true }, // its one surviving companion sprite lands behind the wall with just a stump poking out beneath it
            
            // Bottom right corner
            { x: centerX + 600, y: centerY + 85, size: 38 },
            { x: centerX + 750, y: centerY + 80, size: 41 },
            { x: centerX + 400, y: centerY + 88, size: 36 },
            
            // Extra bottom edge left
            { x: centerX - 650, y: centerY + 100, size: 37 },
            { x: centerX - 500, y: centerY + 95, size: 35 },
            
            // Extra bottom edge right
            { x: centerX + 650, y: centerY + 100, size: 37 },
            { x: centerX + 500, y: centerY + 95, size: 35 },
            
            // ===== CAMPAIGN AREA TREES (far left, marked by red square) =====
            // Dense trees in the Campaign/Training Grounds area - larger sizes
            // Upper Campaign area
            { x: centerX - 900, y: centerY + 50, size: 42 },
            { x: centerX - 1000, y: centerY + 45, size: 44 },
            { x: centerX - 800, y: centerY + 35, size: 40 },
            { x: centerX - 1100, y: centerY + 40, size: 43 },
            { x: centerX - 650, y: centerY + 30, size: 38 },
            
            // Mid-upper Campaign area
            { x: centerX - 950, y: centerY + 170, size: 42 },
            { x: centerX - 1050, y: centerY + 150, size: 45 },
            { x: centerX - 850, y: centerY + 160, size: 40 },
            { x: centerX - 900, y: centerY + 180, size: 38 },
            { x: centerX - 1150, y: centerY + 100, size: 41 },
            
            // Mid Campaign area
            { x: centerX - 900, y: centerY + 100, size: 43 },
            { x: centerX - 1000, y: centerY + 150, size: 46 },
            { x: centerX - 800, y: centerY + 105, size: 40 },
            { x: centerX - 1100, y: centerY + 120, size: 42 },
            { x: centerX - 450, y: centerY + 108, size: 39 },
            
            // Mid-lower Campaign area
            { x: centerX - 950, y: centerY + 140, size: 44 },
            { x: centerX - 1050, y: centerY + 145, size: 45 },
            { x: centerX - 850, y: centerY + 135, size: 41 },
            { x: centerX - 600, y: centerY + 142, size: 40 },
            { x: centerX - 1150, y: centerY + 150, size: 43 },
            
            // Lower Campaign area
            { x: centerX - 900, y: centerY + 165, size: 43 },
            { x: centerX - 1000, y: centerY + 170, size: 46 },
            { x: centerX - 800, y: centerY + 160, size: 41 },
            { x: centerX - 1100, y: centerY + 175, size: 42 },
            { x: centerX - 850, y: centerY + 168, size: 40 },
            
            // Bottom Campaign area
            { x: centerX - 950, y: centerY + 190, size: 42 },
            { x: centerX - 1050, y: centerY + 195, size: 44 },
            { x: centerX - 850, y: centerY + 185, size: 39 },
            { x: centerX - 600, y: centerY + 192, size: 38 },
            { x: centerX - 1150, y: centerY + 200, size: 41 },
            
            // Extra Campaign edge trees
            { x: centerX - 1200, y: centerY + 125, size: 40 },
            { x: centerX - 1250, y: centerY + 130, size: 42 },
            { x: centerX - 1200, y: centerY + 170, size: 40 },
            { x: centerX - 1300, y: centerY + 115, size: 43 },

            { x: centerX + 900, y: centerY + 50, size: 42 },
            { x: centerX + 1000, y: centerY + 45, size: 44 },
            { x: centerX + 800, y: centerY + 35, size: 40 },
            { x: centerX + 1100, y: centerY + 40, size: 43 },
            { x: centerX + 750, y: centerY + 30, size: 38 },
            
            // Mid-upper Campaign area
            { x: centerX + 950, y: centerY + 200, size: 42 },
            { x: centerX + 1050, y: centerY + 150, size: 45 },
            { x: centerX + 850, y: centerY + 140, size: 40 },
            { x: centerX + 700, y: centerY + 180, size: 38 },
            { x: centerX + 1150, y: centerY + 100, size: 41 },
            
            // Mid Campaign area
            { x: centerX + 900, y: centerY + 100, size: 43 },
            { x: centerX + 1000, y: centerY + 150, size: 46 },
            { x: centerX + 800, y: centerY + 105, size: 40 },
            { x: centerX + 1100, y: centerY + 120, size: 42 },
            { x: centerX + 750, y: centerY + 108, size: 39 },
            
            // Mid-lower Campaign area
            { x: centerX + 950, y: centerY + 140, size: 44 },
            { x: centerX + 1050, y: centerY + 145, size: 45 },
            { x: centerX + 850, y: centerY + 135, size: 41 },
            { x: centerX + 700, y: centerY + 142, size: 40 },
            { x: centerX + 1150, y: centerY + 150, size: 43 },
            
            // Lower Campaign area
            { x: centerX + 900, y: centerY + 165, size: 43 },
            { x: centerX + 1000, y: centerY + 170, size: 46 },
            { x: centerX + 800, y: centerY + 160, size: 41 },
            { x: centerX + 1100, y: centerY + 175, size: 42 },
            { x: centerX + 750, y: centerY + 168, size: 40 },
            
            // Bottom Campaign area
            { x: centerX + 950, y: centerY + 190, size: 42 },
            { x: centerX + 1050, y: centerY + 195, size: 44 },
            { x: centerX + 850, y: centerY + 185, size: 39 },
            { x: centerX + 700, y: centerY + 192, size: 38 },
            { x: centerX + 1150, y: centerY + 200, size: 41 },
            
            // Extra Campaign edge trees
            { x: centerX + 1200, y: centerY + 125, size: 40 },
            { x: centerX + 1250, y: centerY + 130, size: 42 },
            { x: centerX + 1200, y: centerY + 170, size: 40 },
            { x: centerX + 1300, y: centerY + 115, size: 43 },
        ];

        // Turn the flat, evenly-spaced skeleton above into an actual forest. Foreground trees
        // here used to render at roughly 1/6 the settlement castle's height (size 18-46 next to
        // buildings well over 200px tall), and every position sits on a suspiciously round grid
        // (multiples of 50/100), which reads as a planted orchard rather than woodland. This
        // pass scales trees up (nearer ones more, sharpening the depth cue) and jitters both
        // position and size with a deterministic hash of each tree's index - not Math.random(),
        // since this whole scene gets baked to an offscreen canvas once (see
        // renderSettlementScene's _ensureSceneStaticLayers) and never redrawn from scratch, so
        // the forest needs to look identical every time it's blitted. Companion trees fill the
        // gaps the bigger scale would otherwise leave, offset only a short, capped distance from
        // their anchor's hand-placed (and already collision-checked against the settlement wall/
        // Campaign/Castle footprints) position so they can't drift into a building or the clearing.
        const hash = (n) => {
            const s = Math.sin(n * 12.9898) * 43758.5453;
            return s - Math.floor(s);
        };

        const naturalTrees = [];
        treePositions.forEach((t, i) => {
            if (t.hidden) return; // manually excluded - see the tree's own entry above for why
            const depthT = (t.size - 18) / (46 - 18); // 0 = farthest background, 1 = nearest
            const scaleMul = 1.55 + depthT * 0.85; // nearer trees grow more, sharpening the depth read
            const baseSize = t.size * scaleMul;

            const jx = (hash(i * 3.1 + 0.7) * 2 - 1) * 12;
            const jy = (hash(i * 5.7 + 1.3) * 2 - 1) * 6;
            const js = (hash(i * 7.9 + 2.1) * 2 - 1) * baseSize * 0.12;
            naturalTrees.push({ x: t.x + jx, y: t.y + jy, size: baseSize + js });

            // More candidates than the final forest needs - the spacing pass below thins
            // whichever of these actually collide, so generating a denser pool up front (rather
            // than tuning distance/probability to hit a final count directly) is what makes the
            // result denser without loosening the spacing rule itself.
            const companionRoll = hash(i * 2.3 + 4.4);
            const companions = companionRoll < 0.30 ? 1 : (companionRoll < 0.62 ? 2 : (companionRoll < 0.88 ? 3 : 0));
            for (let c = 0; c < companions; c++) {
                const angle = hash(i * 13.7 + c * 6.6 + 6.6) * Math.PI * 2;
                const dist = 16 + hash(i * 17.3 + c * 8.8 + 7.7) * 26;
                const cx = t.x + Math.cos(angle) * dist;
                const cy = t.y + Math.sin(angle) * dist * 0.45; // flatten to the ground plane
                const cSize = baseSize * (0.5 + hash(i * 21.1 + c * 4.4 + 8.8) * 0.4);
                naturalTrees.push({ x: cx, y: cy, size: cSize });
            }
        });

        // Extra scattered candidates across the open field, on top of the hand-placed clusters
        // above - those clusters were authored around specific landmarks (the wall, Campaign,
        // Castle) and thin out noticeably in the plain grass gaps between them. Same idea as the
        // companion trees above: generate more candidates than the scene needs and let the
        // spacing pass below keep only the ones that don't collide, so this only fills genuinely
        // open ground instead of doubling up density that's already there.
        const fillLeft = centerX - 1450, fillRight = centerX + 1450;
        const fillTop = canvas.height * 0.58, fillBottom = centerY + 230;
        const fillCell = 65;
        let fillSeed = 5000;
        for (let fx = fillLeft; fx < fillRight; fx += fillCell) {
            for (let fy = fillTop; fy < fillBottom; fy += fillCell) {
                fillSeed++;
                if (hash(fillSeed * 0.37) > 0.68) continue; // skip some cells so it isn't a perfect grid
                const jx = (hash(fillSeed * 3.1) * 2 - 1) * fillCell * 0.55;
                const jy = (hash(fillSeed * 5.3) * 2 - 1) * fillCell * 0.55;
                const depthT = Math.max(0, Math.min(1, (fy - fillTop) / (fillBottom - fillTop)));
                const size = (24 + depthT * 58) * (0.75 + hash(fillSeed * 9.7) * 0.5);
                naturalTrees.push({ x: fx + jx, y: fy + jy, size });
            }
        }

        // --- Spacing: no two trees may stand close enough for their canopies to effectively
        // coincide ("a tree standing on top of another tree's base"). `canopyRadius` estimates
        // how far a tree's canopy can reach from its trunk - the broadest shape in
        // TerrainRenderer.js (renderTreeType6's off-center leaf clumps) can reach up to ~0.59x
        // its `size`, so 0.62 keeps a small margin over every tree type rather than fitting the
        // average case and clipping the wide ones. Spacing between any two trees is derived from
        // BOTH their radii, not a flat fraction of one size, so a big tree always keeps its real
        // clearance regardless of what its neighbor's size happens to be. `overlapFactor`
        // controls how much of that combined radius neighbors are allowed to share: <1 forces a
        // gap, close to 1 lets canopies just graze (used for the general backdrop, where a
        // little overlap reads as a natural dense wood), and >1 would allow real overlap (never
        // used here). The same estimate is reused below to decide which trees near the Campaign
        // fence or Castle base are close enough to promote in front of the building - using the
        // same slightly-generous radius there too means a tree is never left stranded half-
        // rendered behind a structure its canopy visibly reaches.
        const canopyRadius = (size) => size * 0.62;
        const declutter = (trees, overlapFactor) => {
            const kept = [];
            [...trees].sort((a, b) => b.size - a.size).forEach(t => {
                const collides = kept.some(k =>
                    Math.hypot(t.x - k.x, t.y - k.y) < (canopyRadius(t.size) + canopyRadius(k.size)) * overlapFactor
                );
                if (!collides) kept.push(t);
            });
            return kept;
        };
        // Companion trees (generated above) cluster tightly around their anchor by design -
        // good for backdrop density, but left unchecked plenty of them land close enough to
        // stack on their own anchor. One global pass over the whole forest first, before
        // anything building-specific happens, keeps every tree in the scene readable as its
        // own tree.
        const spacedTrees = declutter(naturalTrees, 0.62);

        // --- The Campaign (TrainingGrounds) yard stays a clear, open patch: no ambient tree
        // renders anywhere near it, front or back - repeatedly trying to have trees drape over
        // or beside its fence kept producing edge-case artifacts (clipped canopies, bare
        // trunks), so instead of resolving depth against it at all, this just carves out a
        // clearing and leaves it standing in open ground, the way the Castle's own courtyard
        // (paved, walled) already reads as separate from the forest.
        //
        // The Castle is a tall keep, so a tree actually in front of it (closer to the viewer)
        // still needs to be pulled forward to draw over its base - this whole layer bakes once,
        // entirely behind every exterior building (see renderSettlementScene), so without that
        // split such a tree would always be painted over even though it's standing in front of
        // the structure. renderExteriorBuildingForegroundTrees (called right after the Castle's
        // own live render) draws _frontTreesCastle back in on top so it correctly stands in
        // front - a tree genuinely standing behind the keep stays hidden behind it, the same as
        // it would in front of a real building of that height. Reach scales with that tree's own
        // canopyRadius rather than a fixed margin, so the catch region always matches how far
        // that particular tree could actually visually extend.
        const sf = canvas.width / 1920;
        const tgBuilding = (this.settlementBuildings.find(item => item.building instanceof TrainingGrounds) || {}).building;
        const castleBuilding = (this.settlementBuildings.find(item => item.building instanceof Castle) || {}).building;
        const workshopBuilding = (this.settlementBuildings.find(item => item.building instanceof WorkshopHall) || {}).building;
        // Fence is roughly 77x74 (see TG_FENCE_HALF_W/H history in earlier passes); the clearing
        // extends well past that so the yard reads as an open spot, not just tree-free right up
        // to the rail.
        const TG_CLEARING_HALF_W = 140 * sf, TG_CLEARING_HALF_H = 135 * sf;
        // WorkshopHall's own footprint (roof peak + banner pole reach roughly 55px above its
        // anchor, spears/pole reach roughly 35px to either side, at STRUCTURE_SCALE=0.8 - see
        // WorkshopHall.js) - this whole forest layer bakes once, entirely behind every exterior
        // building, so a tree anchored here would otherwise render partly hidden behind the
        // building instead of standing cleanly beside it. Asymmetric like the building itself:
        // mostly tree-free above/beside the anchor, barely anything carved out below it.
        const WORKSHOP_CLEARING_HALF_W = 55 * sf, WORKSHOP_CLEARING_TOP = 85 * sf, WORKSHOP_CLEARING_BOTTOM = 20 * sf;
        // Base platform spans y:[wallHeight/2, wallHeight/2+30] = [40,70] below the Castle's own
        // anchor (see Castle.js's drawCastleBase) - 70 is genuinely where the structure ends.
        const CASTLE_HALF_W = 110, CASTLE_FRONT_EDGE = 70;
        // The elliptical palisade itself (see renderFrontWallOverlay) - any ambient tree whose
        // ground position is south of the wall's own curve at that x is standing in front of it
        // and needs the same front/back split, not just the four hand-placed accent trees this
        // used to be limited to (see renderWallForegroundTrees's history) - anything else nearby
        // still got silently painted over by the wall/palisade, which is what read as "the
        // settlement standing on top of" those trees.
        const WALL_RX = 360 * sf, WALL_RY = 140 * sf;

        const backTrees = [];
        const rawFrontCastle = [];
        const rawFrontWall = [];
        spacedTrees.forEach(t => {
            if (tgBuilding) {
                const dx = t.x - tgBuilding.x, dy = t.y - tgBuilding.y;
                if (Math.abs(dx) < TG_CLEARING_HALF_W && Math.abs(dy) < TG_CLEARING_HALF_H) {
                    return; // inside the Campaign clearing - no tree belongs here
                }
            }
            if (workshopBuilding) {
                const dx = t.x - workshopBuilding.x, dy = t.y - workshopBuilding.y;
                if (Math.abs(dx) < WORKSHOP_CLEARING_HALF_W && dy > -WORKSHOP_CLEARING_TOP && dy < WORKSHOP_CLEARING_BOTTOM) {
                    return; // inside the Workshop's own footprint - no tree belongs here
                }
            }
            // A tree anchored INSIDE the Castle's own footprint (not just near its edge) can't be
            // fixed by clipping alone - for a tree anchored close enough that its trunk sits
            // right on the boundary, that's most or all of the canopy, leaving a bare trunk
            // poking out with no crown ("headless tree"). Requiring the anchor to be genuinely
            // outside the real footprint before promoting it avoids that; `reach` only extends
            // how far *outside* still counts as close enough to catch.
            if (castleBuilding) {
                const reach = canopyRadius(t.size);
                const dx = t.x - castleBuilding.x, dy = t.y - castleBuilding.y;
                if (dy > CASTLE_FRONT_EDGE && Math.abs(dx) < CASTLE_HALF_W + reach && dy < CASTLE_FRONT_EDGE + reach) {
                    rawFrontCastle.push(t);
                    return;
                }
            }
            // Gate is centered at x=centerX (see renderIntegratedGate/renderGuardTowerWithBase
            // in renderFrontWallOverlay) - dropped entirely rather than just left unpromoted:
            // every tree draws its own ground-contact shadow well south of its trunk (see
            // TerrainRenderer.renderTree), so a background tree anchored just behind the gate
            // could still have that shadow poke out past the gate's own base into open ground,
            // even though the tree itself stayed correctly hidden.
            const wdxGate = t.x - centerX;
            if (Math.abs(wdxGate) < 110 * sf && t.y > centerY + 20 * sf && t.y < centerY + WALL_RY + 100 * sf) {
                return;
            }
            const wdx = t.x - centerX;
            if (Math.abs(wdx) >= 95 * sf && Math.abs(wdx) < WALL_RX) {
                const normX = wdx / WALL_RX;
                const wallEdgeY = centerY + WALL_RY * Math.sqrt(Math.max(0, 1 - normX * normX));
                const reach = canopyRadius(t.size);
                if (t.y > wallEdgeY - reach * 0.25 && t.y < wallEdgeY + reach) {
                    rawFrontWall.push(t);
                    return;
                }
            }
            backTrees.push(t);
        });

        // Re-declutter each front group on its own, with almost no allowed overlap (0.95, vs
        // 0.62 for the general backdrop) - standing right in front of a structure is the most
        // visually prominent spot in the whole forest, so it gets the strictest spacing.
        this._frontTreesTG = []; // the Campaign clearing above already excludes every tree near it
        this._frontTreesCastle = declutter(rawFrontCastle, 0.95).sort((a, b) => a.y - b.y);
        this._frontTreesWall = declutter(rawFrontWall, 0.95).sort((a, b) => a.y - b.y);

        // A background tree sitting right next to one that just got promoted to "front" reads
        // as that same tree being simultaneously in front of AND behind the building - correct
        // per-tree occlusion, confusing side by side. Drop any backTrees survivor within
        // spacing range of a front tree so each ground spot has exactly one, unambiguous tree.
        const allFront = [...this._frontTreesCastle, ...this._frontTreesWall];
        const backTreesClean = backTrees.filter(b =>
            !allFront.some(f => Math.hypot(b.x - f.x, b.y - f.y) < (canopyRadius(b.size) + canopyRadius(f.size)) * 0.95)
        );

        // Render trees with proper z-ordering (by Y position)
        // Filter out trees above the green field boundary (horizon zone)
        const horizonY = canvas.height * 0.62;
        const filteredTrees = backTreesClean.filter(t => t.y >= horizonY);
        filteredTrees.sort((a, b) => a.y - b.y);

        filteredTrees.forEach((treePos) => {
            const gridX = Math.floor(treePos.x / 50);
            const gridY = Math.floor(treePos.y / 50);
            // Deterministic size variation for natural look
            const sizeJitter = 1.0 + Math.sin(treePos.x * 0.031 + treePos.y * 0.047) * 0.15;
            this.renderTree(ctx, treePos.x, treePos.y, treePos.size * sizeJitter, gridX, gridY);
        });

    }

    renderSettlementDetails(ctx, centerX, centerY) {
        // Note: town houses used to be drawn here, but this layer is clipped
        // tightly to the wall ellipse and baked *before* the buildings pass —
        // that clipped off house roofs/chimneys and let the wall render on top
        // of them. They now live in this.townHouses and render through the
        // Y-sorted renderSettlementBuildings('interior-all') pass instead,
        // alongside the real buildings and guard posts (see enter()).

        // ── CRATES near TowerForge (right side) ────────────────────────────────
        this.renderCrate(ctx, centerX + 180, centerY - 65, 12);
        this.renderCrate(ctx, centerX + 194, centerY - 65, 12);
        this.renderCrate(ctx, centerX + 187, centerY - 77, 12);  // stacked on top
        this.renderCrate(ctx, centerX + 210, centerY - 72, 10);  // extra crate right

        // ── BARRELS near TowerForge ─────────────────────────────────────────────
        this.renderBarrel(ctx, centerX + 162, centerY - 50, 10);
        this.renderBarrel(ctx, centerX + 173, centerY - 52, 9);
        this.renderBarrel(ctx, centerX + 215, centerY - 52, 10);

        // ── CRATES near Magic Academy (left side) ──────────────────────────────
        this.renderCrate(ctx, centerX - 175, centerY - 68, 11);
        this.renderCrate(ctx, centerX - 163, centerY - 68, 11);
        this.renderCrate(ctx, centerX - 168, centerY - 80, 10); // stacked
        this.renderBarrel(ctx, centerX - 148, centerY - 62, 9);

        // ── BACK OF SETTLEMENT (north, behind buildings) ───────────────────────
        this.renderCrate(ctx, centerX - 265, centerY - 82, 11);
        this.renderBarrel(ctx, centerX - 278, centerY - 78, 9);
        this.renderBarrel(ctx, centerX - 252, centerY - 80, 10);

        this.renderCrate(ctx, centerX + 258, centerY - 84, 11);
        this.renderCrate(ctx, centerX + 272, centerY - 84, 11);
        this.renderBarrel(ctx, centerX + 285, centerY - 80, 9);

        this.renderCrate(ctx, centerX - 50, centerY - 78, 10);
        this.renderCrate(ctx, centerX + 38, centerY - 82, 10);
        this.renderBarrel(ctx, centerX - 5, centerY - 76, 9);

        // ── LEFT INNER AREA – pulled well away from the left wall ──────────────
        this.renderBarrel(ctx, centerX - 280, centerY - 18, 9);
        this.renderCrate(ctx, centerX - 290, centerY - 5, 10);
        this.renderBarrel(ctx, centerX - 270, centerY + 22, 8);
        this.renderCrate(ctx, centerX - 260, centerY + 48, 9);

        // ── RIGHT INNER AREA – pulled well away from the right wall ────────────
        this.renderBarrel(ctx, centerX + 272, centerY - 18, 9);
        this.renderBarrel(ctx, centerX + 285, centerY + 18, 8);
        this.renderCrate(ctx, centerX + 270, centerY + 48, 9);

        // ── SHRUBS/BUSHES – kept safely inside, away from the perimeter ────────
        const shrubs = [
            // Back left cluster
            { x: centerX - 270, y: centerY - 58, r: 9 },
            { x: centerX - 235, y: centerY - 78, r: 8 },
            { x: centerX - 295, y: centerY - 35, r: 9 },
            // Back right cluster
            { x: centerX + 260, y: centerY - 62, r: 9 },
            { x: centerX + 225, y: centerY - 80, r: 8 },
            { x: centerX + 285, y: centerY - 35, r: 9 },
            // Back center
            { x: centerX - 90, y: centerY - 70, r: 7 },
            { x: centerX + 80, y: centerY - 72, r: 7 },
            // Mid left
            { x: centerX - 185, y: centerY + 65, r: 8 },
            { x: centerX - 240, y: centerY + 40, r: 8 },
            // Mid right
            { x: centerX + 190, y: centerY + 60, r: 8 },
            { x: centerX + 240, y: centerY + 35, r: 8 },
            // South inner — only near the sides of the south path, clear of gate
            { x: centerX - 95, y: centerY + 85, r: 7 },
            { x: centerX + 100, y: centerY + 82, r: 7 },
        ];
        shrubs.forEach(s => this.renderShrub(ctx, s.x, s.y, s.r));

        // ── SCATTERED HAY/STRAW PATCHES near buildings ─────────────────────────
        const hayPositions = [
            { x: centerX + 155, y: centerY - 35 },
            { x: centerX - 155, y: centerY - 40 },
            { x: centerX - 275, y: centerY + 10 },
            { x: centerX + 265, y: centerY + 8 },
        ];
        hayPositions.forEach(h => {
            ctx.fillStyle = 'rgba(200, 170, 80, 0.35)';
            ctx.beginPath();
            ctx.ellipse(h.x, h.y, 10, 5, -0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(160, 130, 50, 0.4)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 4; i++) {
                const angle = -0.4 + i * 0.25;
                ctx.beginPath();
                ctx.moveTo(h.x - 5, h.y + 2);
                ctx.lineTo(h.x + Math.cos(angle) * 9, h.y + Math.sin(angle) * 4);
                ctx.stroke();
            }
        });
    }

    renderCrate(ctx, x, y, size) {
        // Wooden crate
        const s = size;
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fillRect(x - s * 0.5 + 2, y + 2, s, s * 0.9);
        // Face
        ctx.fillStyle = '#c8a060';
        ctx.fillRect(x - s * 0.5, y - s * 0.5, s, s);
        // Wood slat lines
        ctx.strokeStyle = '#8a6030';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(x - s * 0.5, y - s * 0.5, s, s);
        // Cross slats
        ctx.beginPath();
        ctx.moveTo(x - s * 0.5, y - s * 0.5 + s * 0.33);
        ctx.lineTo(x + s * 0.5, y - s * 0.5 + s * 0.33);
        ctx.moveTo(x - s * 0.5, y - s * 0.5 + s * 0.66);
        ctx.lineTo(x + s * 0.5, y - s * 0.5 + s * 0.66);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - s * 0.5 + s * 0.33, y - s * 0.5);
        ctx.lineTo(x - s * 0.5 + s * 0.33, y + s * 0.5);
        ctx.stroke();
        // Corner nail dots
        ctx.fillStyle = '#5a3a18';
        [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]].forEach(([dx, dy]) => {
            ctx.beginPath();
            ctx.arc(x + dx * s, y + dy * s, 0.8, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    renderBarrel(ctx, x, y, size) {
        const s = size;
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath();
        ctx.ellipse(x + 1, y + s * 0.55, s * 0.48, s * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        // Barrel body (rounded rect approximated with two rects + ellipses)
        ctx.fillStyle = '#9a6030';
        ctx.fillRect(x - s * 0.42, y - s * 0.45, s * 0.84, s * 0.9);
        // Top/bottom ellipses
        ctx.fillStyle = '#b57840';
        ctx.beginPath();
        ctx.ellipse(x, y - s * 0.45, s * 0.42, s * 0.14, 0, 0, Math.PI * 2);
        ctx.fill();
        // Bottom
        ctx.fillStyle = '#805020';
        ctx.beginPath();
        ctx.ellipse(x, y + s * 0.45, s * 0.42, s * 0.14, 0, 0, Math.PI * 2);
        ctx.fill();
        // Hoops
        ctx.strokeStyle = '#3a2010';
        ctx.lineWidth = 1.5;
        [-0.25, 0, 0.25].forEach(frac => {
            ctx.beginPath();
            ctx.ellipse(x, y + s * frac, s * 0.45, s * 0.12, 0, 0, Math.PI * 2);
            ctx.stroke();
        });
        // Outline
        ctx.strokeStyle = '#5a3010';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(x - s * 0.42, y - s * 0.45, s * 0.84, s * 0.9);
    }

    renderShrub(ctx, x, y, r) {
        // Small bush cluster — 3 overlapping circles
        const colors = ['#1B5E20', '#2E7D32', '#388E3C'];
        const offsets = [[-r * 0.55, r * 0.2], [r * 0.55, r * 0.25], [0, -r * 0.15]];
        offsets.forEach((off, i) => {
            ctx.fillStyle = colors[i];
            ctx.beginPath();
            ctx.arc(x + off[0], y + off[1], r * 0.65, 0, Math.PI * 2);
            ctx.fill();
        });
        // Top highlight circle
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.1, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Small civilian cottage used to fill in the settlement between the main
     * clickable buildings — timber-framed walls, a peaked thatch/shingle roof,
     * a window with shutters and a flower box, and a chimney with static smoke.
     */
    renderTownHouse(ctx, x, y, scale = 1, variant = 0) {
        const palettes = [
            { wall: '#e6dab8', wallShade: '#c9bb92', wallLight: '#f2ead2', beam: '#4a3524', roofLit: '#c9a24a', roofShade: '#8f7025', door: '#5a3a1f', chimney: '#8a8378' },
            { wall: '#d8b98a', wallShade: '#b8996a', wallLight: '#e6cea0', beam: '#3a2a1a', roofLit: '#9a4226', roofShade: '#6a2a16', door: '#3a2410', chimney: '#7a7268' },
            { wall: '#cfc7a8', wallShade: '#aba282', wallLight: '#ddd6ba', beam: '#3f4a2c', roofLit: '#748c4e', roofShade: '#4c5e32', door: '#4a3018', chimney: '#8a8378' }
        ];
        const p = palettes[variant % palettes.length];

        const w = 48 * scale;
        const h = 44 * scale;

        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.26)';
        ctx.beginPath();
        ctx.ellipse(x + w * 0.06, y + h * 0.4, w * 0.56, h * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stone footing — ties the house to the same material language as the
        // town wall/gate/tower footing
        ctx.fillStyle = '#8c8c8c';
        ctx.fillRect(x - w * 0.5, y + h * 0.22, w, h * 0.11);
        ctx.fillStyle = '#a8a8a8';
        ctx.fillRect(x - w * 0.5, y + h * 0.22, w, h * 0.03);
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 0.7 * scale;
        ctx.strokeRect(x - w * 0.5, y + h * 0.22, w, h * 0.11);

        // Wall geometry
        const wl = x - w * 0.44, wr = x + w * 0.44;
        const wt = y - h * 0.2, wb = y + h * 0.22;
        const wallW = wr - wl, wallH = wb - wt;
        const depthW = w * 0.1;

        // Right depth panel — turns the corner for a 3D read
        ctx.fillStyle = p.wallShade;
        ctx.beginPath();
        ctx.moveTo(wr, wt);
        ctx.lineTo(wr + depthW, wt - depthW * 0.5);
        ctx.lineTo(wr + depthW, wb - depthW * 0.5);
        ctx.lineTo(wr, wb);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = p.beam;
        ctx.lineWidth = 0.8 * scale;
        ctx.stroke();

        // Front wall face
        const wallGrad = ctx.createLinearGradient(wl, 0, wr, 0);
        wallGrad.addColorStop(0, p.wallLight);
        wallGrad.addColorStop(0.5, p.wall);
        wallGrad.addColorStop(1, p.wallShade);
        ctx.fillStyle = wallGrad;
        ctx.fillRect(wl, wt, wallW, wallH);
        ctx.strokeStyle = p.beam;
        ctx.lineWidth = 1.3 * scale;
        ctx.strokeRect(wl, wt, wallW, wallH);

        // Half-timber frame accents
        ctx.strokeStyle = p.beam;
        ctx.lineWidth = 2 * scale;
        ctx.beginPath(); ctx.moveTo(wl + wallW * 0.28, wt); ctx.lineTo(wl + wallW * 0.28, wb); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(wl + wallW * 0.72, wt); ctx.lineTo(wl + wallW * 0.72, wb); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(wl, wt + wallH * 0.4); ctx.lineTo(wr, wt + wallH * 0.4); ctx.stroke();

        // Arched door
        const dW = wallW * 0.26, dH = wallH * 0.62;
        const dX = x - wallW * 0.18 - dW / 2, dYb = wb, dYt = dYb - dH;
        ctx.fillStyle = p.door;
        ctx.beginPath();
        ctx.moveTo(dX, dYb);
        ctx.lineTo(dX, dYt + dW * 0.5);
        ctx.arc(dX + dW / 2, dYt + dW * 0.5, dW / 2, Math.PI, 0);
        ctx.lineTo(dX + dW, dYb);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = p.beam;
        ctx.lineWidth = 1 * scale;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = scale * 0.6;
        ctx.beginPath(); ctx.moveTo(dX + dW * 0.5, dYt + dW * 0.5); ctx.lineTo(dX + dW * 0.5, dYb); ctx.stroke();

        // Window with shutters + flower box
        const winCX = x + wallW * 0.22;
        const winW = wallW * 0.22, winH = wallH * 0.28;
        const winX = winCX - winW / 2, winY = wt + wallH * 0.12;
        ctx.fillStyle = '#8ec6dc';
        ctx.fillRect(winX, winY, winW, winH);
        ctx.strokeStyle = p.beam;
        ctx.lineWidth = 1 * scale;
        ctx.strokeRect(winX, winY, winW, winH);
        ctx.beginPath(); ctx.moveTo(winCX, winY); ctx.lineTo(winCX, winY + winH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(winX, winY + winH / 2); ctx.lineTo(winX + winW, winY + winH / 2); ctx.stroke();
        // Shutters
        ctx.fillStyle = p.roofShade;
        ctx.fillRect(winX - winW * 0.28, winY, winW * 0.22, winH);
        ctx.fillRect(winX + winW * 1.06, winY, winW * 0.22, winH);
        // Flower box
        ctx.fillStyle = '#6b4a2a';
        ctx.fillRect(winX - 1, winY + winH + 1, winW + 2, winH * 0.18);
        const flowerColors = ['#e05a5a', '#f0c020', '#e574d6'];
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = flowerColors[(variant + i) % flowerColors.length];
            ctx.beginPath();
            ctx.arc(winX + winW * (0.2 + i * 0.3), winY + winH + 2, 1.6 * scale, 0, Math.PI * 2);
            ctx.fill();
        }

        // Roof
        const roofBase = wt;
        const roofPeak = y - h * 0.62;
        const rHW = w * 0.56;

        ctx.fillStyle = p.roofLit;
        ctx.beginPath();
        ctx.moveTo(x - rHW, roofBase);
        ctx.lineTo(x, roofPeak);
        ctx.lineTo(x, roofBase);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = p.roofShade;
        ctx.beginPath();
        ctx.moveTo(x, roofPeak);
        ctx.lineTo(x + rHW, roofBase);
        ctx.lineTo(x, roofBase);
        ctx.closePath();
        ctx.fill();

        // Thatch/shingle texture rows
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = scale;
        const roofH = roofBase - roofPeak;
        for (let t = 0.22; t < 1.0; t += 0.16) {
            const ly = roofPeak + roofH * t;
            ctx.beginPath();
            ctx.moveTo(x - rHW * t, ly);
            ctx.lineTo(x + rHW * t, ly);
            ctx.stroke();
        }
        ctx.strokeStyle = p.beam;
        ctx.lineWidth = 1.4 * scale;
        ctx.beginPath();
        ctx.moveTo(x - rHW, roofBase);
        ctx.lineTo(x, roofPeak);
        ctx.lineTo(x + rHW, roofBase);
        ctx.stroke();
        // Eave
        ctx.strokeStyle = p.roofShade;
        ctx.lineWidth = 2 * scale;
        ctx.beginPath(); ctx.moveTo(x - rHW, roofBase); ctx.lineTo(x + rHW, roofBase); ctx.stroke();
        // Ridge cap
        ctx.fillStyle = p.roofLit;
        ctx.fillRect(x - w * 0.04, roofPeak - h * 0.015, w * 0.08, h * 0.03);

        // Roof depth side slope
        ctx.fillStyle = p.roofShade;
        ctx.beginPath();
        ctx.moveTo(wr, roofBase);
        ctx.lineTo(wr + depthW, roofBase - depthW * 0.5);
        ctx.lineTo(x + depthW, roofPeak - depthW * 0.5);
        ctx.lineTo(x, roofPeak);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = p.beam;
        ctx.lineWidth = scale * 0.8;
        ctx.stroke();

        // Chimney with a soft static smoke wisp
        const chimX = x + rHW * 0.42;
        const chimYb = roofPeak + roofH * 0.42;
        const chimYt = chimYb - h * 0.34;
        ctx.fillStyle = p.chimney;
        ctx.fillRect(chimX - w * 0.05, chimYt, w * 0.1, chimYb - chimYt);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 0.7 * scale;
        ctx.strokeRect(chimX - w * 0.05, chimYt, w * 0.1, chimYb - chimYt);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(chimX - w * 0.06, chimYt, w * 0.12, h * 0.02);

        [0, 1, 2].forEach(k => {
            ctx.fillStyle = `rgba(220,220,220,${0.22 - k * 0.06})`;
            ctx.beginPath();
            ctx.arc(chimX + k * 2.5 * scale, chimYt - k * 8 * scale - 4, (3 + k * 1.6) * scale, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    renderSmallWatchTower(ctx, x, y, size) {
        // Small tower structure similar to guard post but just decorative
        // Base platform
        ctx.fillStyle = '#7a6b5a';
        ctx.fillRect(x - size * 0.6, y, size * 1.2, size * 0.3);
        
        // Main post
        ctx.fillStyle = '#8b7355';
        ctx.fillRect(x - size * 0.15, y - size * 0.6, size * 0.3, size * 0.7);
        
        // Post detail
        ctx.strokeStyle = '#5a4630';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.1, y - size * 0.6);
        ctx.lineTo(x - size * 0.1, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + size * 0.1, y - size * 0.6);
        ctx.lineTo(x + size * 0.1, y);
        ctx.stroke();
        
        // Small roof/roof peak
        ctx.fillStyle = '#6b5a42';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.25, y - size * 0.6);
        ctx.lineTo(x, y - size * 0.85);
        ctx.lineTo(x + size * 0.25, y - size * 0.6);
        ctx.fill();
        
        // Shadow under base
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(x - size * 0.6, y + size * 0.3, size * 1.2, 3);
    }

    renderWell(ctx, x, y) {
        // Decorative well in settlement center
        // Well structure
        ctx.fillStyle = '#8b7355';
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.fill();
        
        // Well border stone
        ctx.strokeStyle = '#6b5a42';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.stroke();
        
        // Well interior
        ctx.fillStyle = '#3a4a3a';
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.fill();
        
        // Water reflection
        ctx.fillStyle = '#4a6a7a';
        ctx.beginPath();
        ctx.ellipse(x, y - 3, 15, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Rope/wood structure
        ctx.strokeStyle = '#6b5a42';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 20, y - 25);
        ctx.lineTo(x - 25, y - 35);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 20, y - 25);
        ctx.lineTo(x + 25, y - 35);
        ctx.stroke();
        
        // Top bar
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 25, y - 35);
        ctx.lineTo(x + 25, y - 35);
        ctx.stroke();
    }

    renderSettlementPaths(ctx, canvas, centerX, centerY) {
        const pathDark = '#7a6f5d';
        const paverW = 16;
        const paverH = 10;

        // Position-seeded paver draw — same stone at same grid coord regardless of draw order
        const drawPaverRegion = (clipFn, bx, by, bw, bh, seedXor) => {
            ctx.save();
            clipFn();
            ctx.clip();
            ctx.fillStyle = '#9d9181';
            ctx.fillRect(bx - 4, by - 4, bw + 8, bh + 8);

            const colMin = Math.floor((bx - centerX) / paverW) - 1;
            const colMax = Math.ceil((bx + bw - centerX) / paverW) + 1;
            const rowMin = Math.floor((by - centerY) / paverH) - 1;
            const rowMax = Math.ceil((by + bh - centerY) / paverH) + 1;

            for (let row = rowMin; row <= rowMax; row++) {
                for (let col = colMin; col <= colMax; col++) {
                    let ps = (((row * 1031 + col * 1873) ^ seedXor) >>> 0);
                    const pr = () => { ps = (ps * 1664525 + 1013904223) >>> 0; return ps / 0x100000000; };
                    const rowOffset = (row % 2 === 0) ? 0 : paverW * 0.55;
                    const px = centerX + col * paverW + rowOffset + (pr() - 0.5) * 2.2;
                    const py = centerY + row * paverH + (pr() - 0.5) * 1.4;
                    const tone = 68 + Math.floor(pr() * 24);
                    ctx.fillStyle = `rgb(${145 + (tone * 0.3) | 0},${130 + (tone * 0.28) | 0},${110 + (tone * 0.22) | 0})`;
                    const pw2 = paverW - 2.5 - pr() * 1.5;
                    const ph2 = paverH - 2 - pr() * 1;
                    ctx.fillRect(px - pw2 / 2, py - ph2 / 2, pw2, ph2);
                    if (pr() < 0.08) {
                        ctx.fillStyle = 'rgba(60,90,40,0.22)';
                        ctx.fillRect(px - pw2 / 2, py + ph2 * 0.35, pw2 * (0.3 + pr() * 0.6), 1.5);
                    }
                }
            }
            ctx.restore();
        };

        // ── CENTRAL PLAZA — the only paved area in the settlement. No branch
        // paths out to the buildings; just the stone plaza with the fountain.
        drawPaverRegion(() => {
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, 79, 59, 0, 0, Math.PI * 2);
        }, centerX - 80, centerY - 60, 160, 120, 0x9137);

        // Sunlit curbing rim
        ctx.strokeStyle = '#c4b49a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, 78, 58, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Outer edge shadow
        ctx.strokeStyle = pathDark;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, 81, 61, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Natural center wear
        const wearGrad = ctx.createRadialGradient(centerX, centerY, 4, centerX, centerY, 50);
        wearGrad.addColorStop(0,    'rgba(55,42,30,0.16)');
        wearGrad.addColorStop(0.55, 'rgba(55,42,30,0.07)');
        wearGrad.addColorStop(1,    'rgba(55,42,30,0)');
        ctx.fillStyle = wearGrad;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, 52, 42, 0, 0, Math.PI * 2);
        ctx.fill();

        // Fountain / well centerpiece last so it sits on top of the plaza
        this.renderFountainCenterpiece(ctx, centerX, centerY);
    }

    renderFountainCenterpiece(ctx, centerX, centerY) {
        // ── Outer basin shadow ──────────────────────────────────────────────────
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.beginPath();
        ctx.ellipse(centerX + 2, centerY + 6, 34, 24, 0, 0, Math.PI * 2);
        ctx.fill();

        // ── Outer stone basin ───────────────────────────────────────────────────
        const basinGrad = ctx.createRadialGradient(
            centerX - 10, centerY - 8, 0,
            centerX, centerY, 36
        );
        basinGrad.addColorStop(0,   '#c8b89a');
        basinGrad.addColorStop(0.4, '#a89070');
        basinGrad.addColorStop(0.8, '#8a7255');
        basinGrad.addColorStop(1,   '#6a5540');
        ctx.fillStyle = basinGrad;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 2, 34, 23, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stone block rings on basin wall
        ctx.strokeStyle = '#6a5540';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 2, 34, 23, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, 32, 21, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Top rim highlight
        ctx.strokeStyle = '#d4c4a8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - 1, 33, 22, 0, 0, Math.PI * 2);
        ctx.stroke();

        // ── Water surface ───────────────────────────────────────────────────────
        const waterGrad = ctx.createRadialGradient(
            centerX - 6, centerY - 4, 0,
            centerX, centerY, 22
        );
        waterGrad.addColorStop(0,   'rgba(150, 210, 255, 0.80)');
        waterGrad.addColorStop(0.5, 'rgba(80, 155, 215, 0.65)');
        waterGrad.addColorStop(1,   'rgba(40, 100, 170, 0.50)');
        ctx.fillStyle = waterGrad;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 1, 24, 16, 0, 0, Math.PI * 2);
        ctx.fill();

        // Water ripple lines
        ctx.strokeStyle = 'rgba(200, 235, 255, 0.45)';
        ctx.lineWidth = 1;
        for (let r = 1; r <= 3; r++) {
            ctx.beginPath();
            ctx.ellipse(centerX, centerY + 1, 6 * r, 4 * r, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Water highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.ellipse(centerX - 8, centerY - 4, 8, 5, -0.4, 0, Math.PI * 2);
        ctx.fill();

        // ── Central stone plinth ────────────────────────────────────────────────
        // Plinth shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.30)';
        ctx.beginPath();
        ctx.ellipse(centerX + 1, centerY - 6, 7, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Plinth base
        ctx.fillStyle = '#b0a088';
        ctx.beginPath();
        ctx.arc(centerX, centerY - 9, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#6a5540';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Plinth shaft
        ctx.fillStyle = '#9a8870';
        ctx.fillRect(centerX - 3, centerY - 26, 6, 18);
        ctx.strokeStyle = '#6a5540';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(centerX - 3, centerY - 26, 6, 18);

        // Plinth cross strut (decorative)
        ctx.fillStyle = '#a8957a';
        ctx.fillRect(centerX - 6, centerY - 20, 12, 3);
        ctx.strokeStyle = '#6a5540';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(centerX - 6, centerY - 20, 12, 3);

        // Plinth cap top
        ctx.fillStyle = '#c8b89a';
        ctx.beginPath();
        ctx.arc(centerX, centerY - 26, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#6a5540';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Soft water-spout glow at top
        const spoutGlow = ctx.createRadialGradient(
            centerX, centerY - 27, 0,
            centerX, centerY - 27, 10
        );
        spoutGlow.addColorStop(0,   'rgba(150, 210, 255, 0.55)');
        spoutGlow.addColorStop(0.5, 'rgba(100, 180, 240, 0.20)');
        spoutGlow.addColorStop(1,   'rgba(80, 160, 220, 0)');
        ctx.fillStyle = spoutGlow;
        ctx.beginPath();
        ctx.arc(centerX, centerY - 27, 10, 0, Math.PI * 2);
        ctx.fill();

        // ── Four corner accent stones on plaza floor ────────────────────────────
        ctx.fillStyle = '#b0a088';
        ctx.strokeStyle = '#8a7255';
        ctx.lineWidth = 1;
        const cornerD = 26;
        [
            { x: centerX - cornerD, y: centerY - cornerD * 0.55 },
            { x: centerX + cornerD, y: centerY - cornerD * 0.55 },
            { x: centerX - cornerD, y: centerY + cornerD * 0.55 },
            { x: centerX + cornerD, y: centerY + cornerD * 0.55 }
        ].forEach(c => {
            ctx.beginPath();
            ctx.arc(c.x, c.y, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
    }
    
    drawCurvedPath(ctx, points, width, color, darkColor) {
        // Draw a smooth curved path using quadratic curves
        // Main path fill
        ctx.fillStyle = color;
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.beginPath();
        
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            const prevPoint = points[i - 1];
            const currPoint = points[i];
            const nextPoint = points[i + 1];
            
            if (nextPoint) {
                // Calculate control point for smooth curve
                const cpX = currPoint.x;
                const cpY = currPoint.y;
                ctx.quadraticCurveTo(cpX, cpY, 
                    (currPoint.x + nextPoint.x) / 2, 
                    (currPoint.y + nextPoint.y) / 2);
            } else {
                ctx.lineTo(currPoint.x, currPoint.y);
            }
        }
        
        ctx.stroke();
        
        // Path edge for depth - draw offset parallel line
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        ctx.moveTo(points[0].x - width/2.5, points[0].y - width/2.5);
        for (let i = 1; i < points.length; i++) {
            const prevPoint = points[i - 1];
            const currPoint = points[i];
            const nextPoint = points[i + 1];
            
            if (nextPoint) {
                const cpX = currPoint.x - width/2.5;
                const cpY = currPoint.y - width/2.5;
                ctx.quadraticCurveTo(cpX, cpY, 
                    (currPoint.x + nextPoint.x) / 2 - width/2.5, 
                    (currPoint.y + nextPoint.y) / 2 - width/2.5);
            } else {
                ctx.lineTo(currPoint.x - width/2.5, currPoint.y - width/2.5);
            }
        }
        
        ctx.stroke();
    }

    renderGuardPostQuarters(ctx, centerX, centerY) {
        // Render small GuardPost-style structures around the settlement
        // These represent barracks, guard quarters, and living areas
        
        // Create GuardPost instances at various positions around the interior
        const guardPostPositions = [
            // Left side positions
            { x: centerX - 250, y: centerY - 20, scale: 0.65 },
            { x: centerX - 220, y: centerY + 50, scale: 0.65 },
            
            // Right side positions
            { x: centerX + 220, y: centerY + 40, scale: 0.65 },
            { x: centerX + 200, y: centerY - 10, scale: 0.65 },
            
            // Bottom center positions
            { x: centerX - 100, y: centerY + 65, scale: 0.6 },
            { x: centerX + 100, y: centerY + 70, scale: 0.6 },
            
            // Top interior positions
            { x: centerX - 60, y: centerY - 40, scale: 0.6 },
            { x: centerX + 60, y: centerY - 35, scale: 0.6 },
        ];
        
        // Render each guard post
        guardPostPositions.forEach(pos => {
            this.renderGuardPostSmall(ctx, pos.x, pos.y, pos.scale);
        });
    }
    
    renderGuardPostSmall(ctx, x, y, scale = 1.0) {
        scale = scale || 0.6;

        const w = 50 * scale;
        const h = 50 * scale;

        // ── Ground shadow ──────────────────────────────────────────────────────
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.beginPath();
        ctx.ellipse(x + w * 0.06, y + h * 0.34, w * 0.5, h * 0.09, 0, 0, Math.PI * 2);
        ctx.fill();

        // ── Stepped foundation ────────────────────────────────────────────────
        ctx.fillStyle = '#484848';
        ctx.fillRect(x - w * 0.48, y + h * 0.18, w * 0.96, h * 0.14);
        ctx.fillStyle = '#5e5e5e';
        ctx.fillRect(x - w * 0.48, y + h * 0.18, w * 0.96, h * 0.035);
        ctx.strokeStyle = '#303030';
        ctx.lineWidth = scale * 0.8;
        ctx.strokeRect(x - w * 0.48, y + h * 0.18, w * 0.96, h * 0.14);

        ctx.fillStyle = '#525252';
        ctx.fillRect(x - w * 0.4, y + h * 0.08, w * 0.8, h * 0.1);
        ctx.fillStyle = '#686868';
        ctx.fillRect(x - w * 0.4, y + h * 0.08, w * 0.8, h * 0.03);
        ctx.strokeStyle = '#363636';
        ctx.strokeRect(x - w * 0.4, y + h * 0.08, w * 0.8, h * 0.1);

        // ── Wall geometry ──────────────────────────────────────────────────────
        const wl = x - w * 0.36;
        const wr = x + w * 0.36;
        const wt = y - h * 0.22;
        const wb = y + h * 0.08;
        const wallW = wr - wl;
        const wallH = wb - wt;
        const depthW = w * 0.1;

        // Right depth panel
        ctx.fillStyle = '#4e4e4e';
        ctx.beginPath();
        ctx.moveTo(wr, wt);
        ctx.lineTo(wr + depthW, wt - depthW * 0.45);
        ctx.lineTo(wr + depthW, wb - depthW * 0.45);
        ctx.lineTo(wr, wb);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#2e2e2e';
        ctx.lineWidth = scale * 0.8;
        ctx.stroke();

        // Front wall gradient
        const wallGrad = ctx.createLinearGradient(wl, 0, wr, 0);
        wallGrad.addColorStop(0,    '#929292');
        wallGrad.addColorStop(0.18, '#848484');
        wallGrad.addColorStop(0.85, '#686868');
        wallGrad.addColorStop(1,    '#525252');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(wl, wt, wallW, wallH);

        // Stone block courses
        ctx.strokeStyle = 'rgba(42,42,42,0.55)';
        ctx.lineWidth = 0.75 * scale;
        const sW = wallW / 4;
        const sH = wallH / 4;
        for (let row = 0; row < 4; row++) {
            const off = (row % 2 === 0) ? 0 : sW * 0.5;
            for (let col = -1; col < 5; col++) {
                const bx1 = Math.max(wl + col * sW + off, wl);
                const bx2 = Math.min(wl + (col + 1) * sW + off, wr);
                if (bx2 > bx1) ctx.strokeRect(bx1, wt + row * sH, bx2 - bx1, sH);
            }
        }
        // Top stone row highlight
        ctx.fillStyle = 'rgba(160,160,160,0.18)';
        ctx.fillRect(wl, wt, wallW, sH * 0.4);
        // Wall outline
        ctx.strokeStyle = '#2e2e2e';
        ctx.lineWidth = 1.5 * scale;
        ctx.strokeRect(wl, wt, wallW, wallH);

        // ── Arrow slit ────────────────────────────────────────────────────────
        const slitX = wl + wallW * 0.10;
        const slitW2 = wallW * 0.12;
        const slitYt = wt + wallH * 0.10;
        const slitH2 = wallH * 0.52;
        ctx.fillStyle = '#111';
        ctx.fillRect(slitX, slitYt, slitW2, slitH2);
        ctx.fillStyle = 'rgba(160,160,160,0.35)';
        ctx.fillRect(slitX - 1, slitYt - 1, slitW2 + 2, 2);
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = scale * 0.8;
        ctx.strokeRect(slitX, slitYt, slitW2, slitH2);

        // ── Arched door ────────────────────────────────────────────────────────
        const dW  = wallW * 0.32;
        const dH  = wallH * 0.52;
        const dX  = x - dW / 2;
        const dYb = wb;
        const dYt = dYb - dH;
        ctx.fillStyle = '#251508';
        ctx.beginPath();
        ctx.moveTo(dX, dYb);
        ctx.lineTo(dX, dYt + dW / 2);
        ctx.arc(x, dYt + dW / 2, dW / 2, Math.PI, 0);
        ctx.lineTo(dX + dW, dYb);
        ctx.closePath();
        ctx.fill();
        // Arch frame stone
        ctx.strokeStyle = '#6a5030';
        ctx.lineWidth = 1.5 * scale;
        ctx.stroke();
        // Keystone
        ctx.fillStyle = '#8a7055';
        ctx.beginPath();
        ctx.arc(x, dYt + dW * 0.5, dW * 0.12, 0, Math.PI * 2);
        ctx.fill();
        // Door plank lines
        ctx.strokeStyle = 'rgba(90,55,20,0.45)';
        ctx.lineWidth = scale * 0.7;
        ctx.beginPath(); ctx.moveTo(x - dW * 0.08, dYt + dW * 0.55); ctx.lineTo(x - dW * 0.08, dYb); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + dW * 0.08, dYt + dW * 0.55); ctx.lineTo(x + dW * 0.08, dYb); ctx.stroke();

        // ── Battlements ────────────────────────────────────────────────────────
        const mH  = h * 0.08;
        const mW  = wallW / 8;
        const mTop = wt - mH;
        ctx.fillStyle = '#868686';
        ctx.strokeStyle = '#2e2e2e';
        ctx.lineWidth = 0.75 * scale;
        for (let i = 0; i < 4; i++) {
            const mx = wl + i * mW * 2 + mW * 0.1;
            if (mx + mW * 1.8 > wr + 1) continue;
            ctx.fillRect(mx, mTop, mW * 1.8, mH);
            ctx.strokeRect(mx, mTop, mW * 1.8, mH);
        }
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = scale * 0.5;
        for (let i = 0; i < 4; i++) {
            const mx = wl + i * mW * 2 + mW * 0.1;
            if (mx + mW * 1.8 > wr + 1) continue;
            ctx.beginPath(); ctx.moveTo(mx, mTop); ctx.lineTo(mx + mW * 1.8, mTop); ctx.stroke();
        }
        // Depth panel battlement
        ctx.fillStyle = '#585858';
        ctx.fillRect(wr, wt - mH * 0.7, depthW, mH * 0.7);

        // ── Roof ──────────────────────────────────────────────────────────────
        const roofBase = wt;
        const roofPeak = y - h * 0.68;
        const rHW = w * 0.52;

        // Left face (lit)
        ctx.fillStyle = '#8b3a18';
        ctx.beginPath();
        ctx.moveTo(x - rHW, roofBase);
        ctx.lineTo(x, roofPeak);
        ctx.lineTo(x, roofBase);
        ctx.closePath();
        ctx.fill();
        // Right face (shadow)
        ctx.fillStyle = '#5a2410';
        ctx.beginPath();
        ctx.moveTo(x, roofPeak);
        ctx.lineTo(x + rHW, roofBase);
        ctx.lineTo(x, roofBase);
        ctx.closePath();
        ctx.fill();

        // Shingle rows
        ctx.strokeStyle = 'rgba(0,0,0,0.28)';
        ctx.lineWidth = scale;
        const roofH = roofBase - roofPeak;
        for (let t = 0.2; t < 1.0; t += 0.18) {
            const ly = roofPeak + roofH * t;
            ctx.beginPath();
            ctx.moveTo(x - rHW * t, ly);
            ctx.lineTo(x + rHW * t, ly);
            ctx.stroke();
        }
        // Roof outline
        ctx.strokeStyle = '#3a1808';
        ctx.lineWidth = 1.5 * scale;
        ctx.beginPath();
        ctx.moveTo(x - rHW, roofBase);
        ctx.lineTo(x, roofPeak);
        ctx.lineTo(x + rHW, roofBase);
        ctx.stroke();
        // Eave
        ctx.strokeStyle = '#6a3010';
        ctx.lineWidth = 2 * scale;
        ctx.beginPath(); ctx.moveTo(x - rHW, roofBase); ctx.lineTo(x + rHW, roofBase); ctx.stroke();
        // Ridge cap
        ctx.fillStyle = '#aa5428';
        ctx.fillRect(x - w * 0.04, roofPeak - h * 0.02, w * 0.08, h * 0.04);

        // Right side roof depth slope
        ctx.fillStyle = '#6a2c10';
        ctx.beginPath();
        ctx.moveTo(wr, roofBase);
        ctx.lineTo(wr + depthW, roofBase - depthW * 0.45);
        ctx.lineTo(x + depthW, roofPeak - depthW * 0.45);
        ctx.lineTo(x, roofPeak);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#3a1808';
        ctx.lineWidth = scale;
        ctx.stroke();

        // ── Flagpole & burgundy pennant ───────────────────────────────────────
        ctx.strokeStyle = '#5a5a5a';
        ctx.lineWidth = 1.5 * scale;
        ctx.beginPath();
        ctx.moveTo(x, roofPeak);
        ctx.lineTo(x, roofPeak - h * 0.35);
        ctx.stroke();

        ctx.fillStyle = '#8B1E3F';
        ctx.beginPath();
        ctx.moveTo(x, roofPeak - h * 0.33);
        ctx.lineTo(x + 14 * scale, roofPeak - h * 0.23);
        ctx.lineTo(x, roofPeak - h * 0.14);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = scale * 0.5;
        ctx.stroke();
    }

    renderFlowerBeds(ctx, centerX, centerY) {
        // Decorative flower beds positioned within the settlement boundary
        const flowerBeds = [
            { x: centerX - 260, y: centerY - 70, color: '#c74545' },     // Back left
            { x: centerX + 260, y: centerY - 70, color: '#f0a020' },     // Back right
            { x: centerX - 180, y: centerY + 60, color: '#e574d6' },     // Front left
            { x: centerX + 180, y: centerY + 60, color: '#ffd700' }      // Front right
        ];
        
        flowerBeds.forEach(bed => {
            // Flower bed border
            ctx.strokeStyle = '#8b7355';
            ctx.lineWidth = 2;
            ctx.strokeRect(bed.x - 20, bed.y - 10, 40, 20);
            
            // Soil
            ctx.fillStyle = '#6b5344';
            ctx.fillRect(bed.x - 18, bed.y - 8, 36, 16);
            
            // Flowers
            ctx.fillStyle = bed.color;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                const flowerX = bed.x - 10 + i * 10;
                ctx.arc(flowerX, bed.y + 2, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    renderSimpleRock(ctx, x, y, size) {
        // Simple rock rendering
        ctx.fillStyle = '#6b6b6b';
        ctx.beginPath();
        ctx.ellipse(x, y, size * 0.6, size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Rock shadow/depth
        ctx.fillStyle = '#4a4a4a';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.2, y + size * 0.15, size * 0.5, size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlight
        ctx.fillStyle = '#8b8b8b';
        ctx.beginPath();
        ctx.ellipse(x - size * 0.15, y - size * 0.1, size * 0.25, size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    renderTitle(ctx, canvas) {
        const title = `${this.commanderName || 'Commander'}'s Settlement`;
        ctx.globalAlpha = 0.8;
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px serif';
        ctx.fillStyle = '#d4af37';
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 2;
        ctx.fillText(title, canvas.width / 2, 40);
        ctx.strokeText(title, canvas.width / 2, 40);
        ctx.globalAlpha = 1;
    }

    // Delegates to the shared TerrainRenderer forest tree art (see LevelBase.renderTree)
    // instead of the separate, now-removed local copy - keeps the settlement backdrop's
    // trees in sync with actual in-level ones. gridX/gridY are passed through unchanged
    // so TerrainRenderer's own Math.floor(gridX+gridY)%6 hashing picks the exact same
    // tree type per position that the old local copy of that same formula used to.
    renderTree(ctx, x, y, size, gridX, gridY) {
        TerrainRenderer.renderTree(ctx, x, y, size, gridX, gridY);
    }
}

