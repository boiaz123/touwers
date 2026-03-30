import { SaveSystem } from '../SaveSystem.js';
import { GameStatistics } from '../GameStatistics.js';
import { LootRegistry } from '../../entities/loot/LootRegistry.js';
import { TrainingGrounds } from '../../entities/buildings/TrainingGrounds.js';
import { TowerForge } from '../../entities/buildings/TowerForge.js';
import { MagicAcademy } from '../../entities/buildings/MagicAcademy.js';
import { Castle } from '../../entities/buildings/Castle.js';
import { GuardPost } from '../../entities/towers/GuardPost.js';
import { SettlementBuildingVisuals } from '../SettlementBuildingVisuals.js';
import { UpgradeSystem } from '../UpgradeSystem.js';
import { UpgradeRegistry } from '../UpgradeRegistry.js';
import { MarketplaceSystem } from '../MarketplaceSystem.js';
import { MarketplaceRegistry } from '../MarketplaceRegistry.js';
import { EnemyIntelRegistry } from '../EnemyIntelRegistry.js';
import { SirFrogerty } from '../../ui/SirFrogerty.js';
import { CampaignRegistry } from '../../game/CampaignRegistry.js';

// Import Tauri invoke for app control
let invoke = null;
if (typeof window !== 'undefined') {
    // Try to get invoke from Tauri API - will be null if not in Tauri
    if (window.__TAURI_INTERNALS__?.invoke) {
        invoke = window.__TAURI_INTERNALS__.invoke;
    }
}

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
        
        // Load settlement data from the current save slot
        // This includes gold, inventory, upgrades, and unlock progression
        const currentSaveData = SaveSystem.getSave(this.stateManager.currentSaveSlot);
        
        // Detect if we've switched save slots
        const saveSlotChanged = this.lastLoadedSaveSlot !== this.stateManager.currentSaveSlot;
        const returningFromLevel = this.stateManager.previousState === 'game';
        
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
            
            // Initialize upgrade system - always reinitialize if save slot changed
            if (saveSlotChanged || !this.stateManager.upgradeSystem) {
                this.stateManager.upgradeSystem = new UpgradeSystem();
                if (currentSaveData.upgrades) {
                    this.stateManager.upgradeSystem.restoreFromSave(currentSaveData.upgrades);
                }
            }
            
            // Initialize marketplace system
            // ALWAYS reinitialize if save slot changed, or if returning from a level
            if (saveSlotChanged || !this.stateManager.marketplaceSystem || returningFromLevel) {
                this.stateManager.marketplaceSystem = new MarketplaceSystem();
                if (currentSaveData.marketplace) {
                    this.stateManager.marketplaceSystem.restoreFromSave(currentSaveData.marketplace);
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
            // Always create new statistics for empty slot
            this.stateManager.gameStatistics = new GameStatistics();
        }
        
        // Remember which save slot is loaded
        this.lastLoadedSaveSlot = this.stateManager.currentSaveSlot;

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
            const completionPages = this.getCampaignCompletionPages(justCompletedCampaign);
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
        
        // Settlement boundary (ellipse on ground):
        // Center: (centerX, centerY)
        // Radius X: 360 pixels, Radius Y: 140 pixels
        
        // Main buildings positioned strategically
        // Training Grounds OUTSIDE the settlement to the left (as per user request)
        // Other buildings spread naturally INSIDE the boundary
        this.settlementBuildings = [
            // === MAIN INTERACTIVE BUILDINGS ===
            // Training Grounds - positioned at the black square (far left)
            {
                building: new TrainingGrounds(centerX - 720, centerY - 0, 0, 0),
                scale: 1,
                clickable: true,
                action: 'levelSelect'
            },
            // Tower Forge - inside upper right area
            {
                building: new TowerForge(centerX + 160, centerY - 50, 1, 0),
                scale: 30,
                clickable: true,
                action: 'upgrades'
            },
            // Arcane Library - positioned at purple circle arrow
            {
                building: new MagicAcademy(centerX - 130, centerY - 55, 1, 0),
                scale: 29,
                clickable: true,
                action: 'arcaneLibrary'
            },
            // Castle - positioned to the right side of settlement (clickable)
            {
                building: new Castle(centerX + 700, centerY - 80, 0, 0),
                scale: 29,
                clickable: true,
                action: 'options'
            },

            // === GUARD POST QUARTERS (BARRACKS) ===
            // Left cluster
            {
                building: new GuardPost(centerX - 260, centerY - 20, 0, 0),
                scale: 0.65,
                clickable: false,
                action: null
            },
            {
                building: new GuardPost(centerX - 240, centerY - 60, 0, 0),
                scale: 0.65,
                clickable: false,
                action: null
            },
            {
                building: new GuardPost(centerX - 220, centerY + 20, 0, 0),
                scale: 0.65,
                clickable: false,
                action: null
            },
            {
                building: new GuardPost(centerX - 200, centerY - 30, 0, 0),
                scale: 0.65,
                clickable: false,
                action: null
            },
            {
                building: new GuardPost(centerX - 180, centerY + 15, 0, 0),
                scale: 0.65,
                clickable: false,
                action: null
            },
            // Right cluster
            {
                building: new GuardPost(centerX + 165, centerY + 15, 0, 0),
                scale: 0.65,
                clickable: false,
                action: null
            },
            {
                building: new GuardPost(centerX + 180, centerY + 35, 0, 0),
                scale: 0.65,
                clickable: false,
                action: null
            },
            {
                building: new GuardPost(centerX + 240, centerY + 20, 0, 0),
                scale: 0.65,
                clickable: false,
                action: null
            }
        ];
        
        this.setupMouseListeners();
    }

    exit() {
        // Record settlement time to statistics
        if (this.stateManager.gameStatistics && this.settlementStartTime > 0) {
            const settlementPlaytime = (Date.now() / 1000) - this.settlementStartTime;
            this.stateManager.gameStatistics.addPlaytime(settlementPlaytime);
        }
        
        // Save all settlement data when exiting the settlement hub
        // This captures current state of gold, inventory, upgrades, marketplace, and campaign progress
        if (this.stateManager.currentSaveSlot && this.stateManager.currentSaveData) {
            const settlementData = {
                // Current settlement state
                playerGold: this.stateManager.playerGold,
                playerInventory: this.stateManager.playerInventory,
                upgrades: this.stateManager.upgradeSystem ? this.stateManager.upgradeSystem.serialize() : { purchasedUpgrades: [] },
                marketplace: this.stateManager.marketplaceSystem ? this.stateManager.marketplaceSystem.serialize() : { consumables: {} },
                statistics: this.stateManager.gameStatistics ? this.stateManager.gameStatistics.serialize() : {},
                // Campaign state from current save data
                lastPlayedLevel: this.stateManager.currentSaveData.lastPlayedLevel,
                unlockedLevels: this.stateManager.currentSaveData.unlockedLevels,
                completedLevels: this.stateManager.currentSaveData.completedLevels,
                unlockSystem: this.stateManager.currentSaveData.unlockSystem
            };
            
            // Use helper to save while preserving commander name
            SaveSystem.updateAndSaveSettlementData(this.stateManager.currentSaveSlot, settlementData);
        }
        
        // Clear manual music selection flag when exiting settlement
        if (this.stateManager.audioManager) {
            this.stateManager.audioManager.isManualMusicSelection = false;
        }
        
        this.removeMouseListeners();
    }

    setupMouseListeners() {
        this.mouseMoveHandler = (e) => this.handleMouseMove(e);
        this.clickHandler = (e) => {
            const rect = this.stateManager.canvas.getBoundingClientRect();
            // Account for CSS scaling - same as handleMouseMove
            const scaleX = this.stateManager.canvas.width / rect.width;
            const scaleY = this.stateManager.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            this.handleClick(x, y);
        };
        this.stateManager.canvas.addEventListener('mousemove', this.mouseMoveHandler);
        this.stateManager.canvas.addEventListener('click', this.clickHandler);
        
        // Add wheel event listener for scrolling in upgrade tiles
        this.wheelHandler = (e) => {
            // Only handle wheel events when upgrades panel is open
            if (this.activePopup === 'upgrades' && this.upgradesPopup && this.upgradesPopup.isOpen) {
                e.preventDefault();
                const rect = this.stateManager.canvas.getBoundingClientRect();
                const scaleX = this.stateManager.canvas.width / rect.width;
                const scaleY = this.stateManager.canvas.height / rect.height;
                const x = (e.clientX - rect.left) * scaleX;
                const y = (e.clientY - rect.top) * scaleY;
                this.upgradesPopup.handleWheel(x, y, e.deltaY);
            }
        };
        this.stateManager.canvas.addEventListener('wheel', this.wheelHandler, { passive: false });
    }

    removeMouseListeners() {
        if (this.mouseMoveHandler) {
            this.stateManager.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
        }
        if (this.clickHandler) {
            this.stateManager.canvas.removeEventListener('click', this.clickHandler);
        }
        if (this.wheelHandler) {
            this.stateManager.canvas.removeEventListener('wheel', this.wheelHandler);
        }
    }

    handleMouseMove(e) {
        const rect = this.stateManager.canvas.getBoundingClientRect();
        // Account for CSS scaling
        const scaleX = this.stateManager.canvas.width / rect.width;
        const scaleY = this.stateManager.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // If popup is active, update its hover state
        if (this.activePopup === 'upgrades' && this.upgradesPopup) {
            this.upgradesPopup.updateHoverState(x, y);
        } else if (this.activePopup === 'options' && this.optionsPopup) {
            this.optionsPopup.updateHoverState(x, y);
        } else if (this.activePopup === 'arcaneLibrary' && this.arcaneLibraryPopup) {
            this.arcaneLibraryPopup.updateHoverState(x, y);
        } else {
            // Check settlement building hover states
            let isHoveringBuilding = false;
            this.settlementBuildings.forEach(item => {
                if (item.clickable) {
                    // Get building bounds from buildingPositions if available, else use scale-based sizing
                    let bounds;
                    if (item.building instanceof TrainingGrounds) {
                        // TrainingGrounds has fence perimeter, use actual visual bounds
                        bounds = {
                            x: item.building.x - 150,
                            y: item.building.y - 150,
                            width: 300,
                            height: 300
                        };
                    } else {
                        const size = item.scale * 4;
                        bounds = {
                            x: item.building.x,
                            y: item.building.y,
                            width: size,
                            height: size
                        };
                    }
                    
                    // Check if mouse is within building bounds
                    if (x >= bounds.x && x <= bounds.x + bounds.width &&
                        y >= bounds.y && y <= bounds.y + bounds.height) {
                        isHoveringBuilding = true;
                    }
                }
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
            const bardX = this.stateManager.canvas.width / 2 + 58;
            const bardY = this.stateManager.canvas.height * 0.76 - 15;
            const isHoveringBard = bardUnlocked && Math.hypot(x - bardX, y - bardY) < 22;
            this.bardHovered = isHoveringBard;
            this.stateManager.canvas.style.cursor = isHoveringBuilding || isHoveringBard || this.activePopup ? 'pointer' : 'default';
        }
    }

    handleClick(x, y) {
        // Sir Frogerty intercepts clicks first
        if (this.sirFrogerty && this.sirFrogerty.visible && !this.activePopup) {
            if (this.sirFrogerty.handleClick(x, y, this.stateManager.canvas)) {
                return;
            }
        }

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
        }

        // Check bard click (only if musical-equipment upgrade purchased)
        const canvas = this.stateManager.canvas;
        const bardUpgradeSystem = this.stateManager?.upgradeSystem;
        if (bardUpgradeSystem && bardUpgradeSystem.hasUpgrade('musical-equipment')) {
            const bardX = canvas.width / 2 + 58;
            const bardY = canvas.height * 0.76 - 15;
            if (Math.hypot(x - bardX, y - bardY) < 22) {
                this.onBardClick();
                return;
            }
        }

        // Check settlement building clicks
        this.settlementBuildings.forEach(item => {
            if (item.clickable) {
                // Get building bounds from buildingPositions if available, else use scale-based sizing
                let bounds;
                if (item.building instanceof TrainingGrounds) {
                    // TrainingGrounds has fence perimeter, use actual visual bounds
                    bounds = {
                        x: item.building.x - 150,
                        y: item.building.y - 150,
                        width: 300,
                        height: 300
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
                
                // Check if click is within building bounds
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
        }
    }

    closePopup() {
        this.activePopup = null;
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
        const audioManager = this.stateManager?.audioManager;
        if (!audioManager) return;

        // Settlement tracks are always available; marketplace extras are added on top
        const settlementTracks = audioManager.getSettlementTracks();
        const marketplaceSystem = this.stateManager?.marketplaceSystem;
        const musicItems = MarketplaceRegistry.getItemsByCategory('music');
        const purchasedExtras = Object.entries(musicItems)
            .filter(([id]) => marketplaceSystem && marketplaceSystem.getConsumableCount(id) > 0)
            .map(([, data]) => data.musicId)
            .filter(id => id && !settlementTracks.includes(id));

        const allTracks = [...settlementTracks, ...purchasedExtras];
        if (allTracks.length === 0) return;
        if (allTracks.length === 1) {
            // Only one track available; play it (idempotent)
            audioManager.isManualMusicSelection = true;
            audioManager.playMusic(allTracks[0], true);
            return;
        }

        // Rebuild shuffle queue when empty or when the available track list changes
        const queueKey = allTracks.slice().sort().join(',');
        if (!this.bardShuffleQueue || this.bardShuffleQueue.length === 0 || this._bardQueueKey !== queueKey) {
            this._bardQueueKey = queueKey;
            this.bardShuffleQueue = this._buildBardQueue(allTracks, audioManager.currentMusicTrack);
        }

        const track = this.bardShuffleQueue.shift();
        audioManager.isManualMusicSelection = true;
        audioManager.playMusic(track, true);

        // When queue is exhausted, pre-build the next shuffled round (ensuring no immediate repeat)
        if (this.bardShuffleQueue.length === 0) {
            this.bardShuffleQueue = this._buildBardQueue(allTracks, track);
        }
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

    /**
     * Returns Sir Frogerty dialogue pages for a given campaign completion event.
     * @param {string} campaignId
     * @returns {Array<{title:string,lines:string[]}>|null}
     */
    getCampaignCompletionPages(campaignId) {
        switch (campaignId) {
            case 'campaign-1':
                return [
                    {
                        title: 'The Woodlands Are Saved!',
                        lines: [
                            'Magnificent, Commander! The Verdant Woodlands stand!',
                            "Thine enemies hath retreated — for now. But mine",
                            "royal nose doth detect a foul whiff upon the breeze:",
                            "more of mine former king's soldiers approach from the",
                            "mountains. Fear not — thou art now stronger than ever!",
                        ]
                    },
                    {
                        title: 'New Paths Open Before Thee!',
                        lines: [
                            "The Ironstone Mountains now lie within thy reach!",
                            "Head to the Campaign Map and challenge those peaks.",
                            '',
                            "Also: mine schematics for the grand Magic Academy",
                            "are now available to purchase in the Upgrades shop!",
                            "A worthy investment, I assure thee. *ribbit*",
                        ]
                    }
                ];

            case 'campaign-2':
                return [
                    {
                        title: 'The Mountains Are Yours!',
                        lines: [
                            "By the great lily pad! Thou hath conquered the peaks!",
                            "The cold winds carry the scent of sand and ancient dust —",
                            "the Scorching Sands await thee beyond the passes.",
                            '',
                            "Each victory hath grown thy renown, Commander.",
                            "The realm speaks thy name in hushed, awed tones.",
                        ]
                    },
                    {
                        title: 'Powerful New Weapons Await!',
                        lines: [
                            "The Super Weapon Lab Plans are now for sale!",
                            "Purchase them in the Upgrades shop to unlock",
                            "the most devastating ordnance the realm hath seen.",
                            '',
                            "Also, the Strange Talisman may now be found in the",
                            "Marketplace — tis most useful for rare loot. *ribbit*",
                        ]
                    }
                ];

            case 'campaign-3':
                return [
                    {
                        title: 'The Sands Are Crossed!',
                        lines: [
                            "Thou FOUND it, Commander! The artifact of legend!",
                            "Its power thrums even as I speak… I confess,",
                            "even I — thine most distinguished adviser — feel",
                            "a shiver of awe. These frogs are not of this world.",
                            '',
                            "And mine former king… hath noticed thee. Prepare.",
                        ]
                    },
                    {
                        title: 'The Final Frontier!',
                        lines: [
                            "The Frog King's Domain is now accessible!",
                            "I need not tell thee that this shall be the",
                            "most dangerous campaign thou hath faced.",
                            '',
                            "Stock up well at the Marketplace, Commander.",
                            "And keep mine counsel close. *nervous ribbit*",
                        ]
                    }
                ];

            case 'campaign-4':
                return [
                    {
                        title: 'VICTORY! The King Is Defeated!',
                        lines: [
                            "I… I cannot believe mine own eyes. Thou hath",
                            "done it, Commander. The Frog King falleth!",
                            "His domain crumbles, the rifts seal shut, and",
                            "his armies lay down their arms across every realm.",
                            '',
                            "I, Sir Frogerty, weep tears of absolute joy.",
                        ]
                    },
                    {
                        title: 'A Legend Is Born!',
                        lines: [
                            "History shall remember this day, Commander.",
                            "Thou hath saved not one realm, but ALL realms —",
                            "including mine slimy homeland. I owe thee a debt",
                            "that no amount of advice can ever repay.",
                            '',
                            "Until the next adventure... *celebratory ribbit*",
                        ]
                    }
                ];

            default:
                return null;
        }
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
        }

        // Update Sir Frogerty adviser
        if (this.sirFrogerty) {
            this.sirFrogerty.update(deltaTime);
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
        // Deep sky with gradient
        const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.7);
        skyGradient.addColorStop(0, '#1a4d7a');      // Deep blue sky
        skyGradient.addColorStop(0.4, '#4d9dcc');    // Mid blue
        skyGradient.addColorStop(0.7, '#99ccff');    // Light blue horizon
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height * 0.7);

        // Render sun and sky colors
        this.renderSun(ctx, canvas);
        this.renderClouds(ctx, canvas);

        // Atmospheric haze at horizon
        const hazeGradient = ctx.createLinearGradient(0, canvas.height * 0.5, 0, canvas.height * 0.75);
        hazeGradient.addColorStop(0, 'rgba(200, 220, 255, 0)');
        hazeGradient.addColorStop(1, 'rgba(200, 220, 255, 0.3)');
        ctx.fillStyle = hazeGradient;
        ctx.fillRect(0, canvas.height * 0.5, canvas.width, canvas.height * 0.25);

        // Distant hills/mountains
        this.renderDistantHills(ctx, canvas);

        // Mid-ground forest with depth
        this.renderMidGroundForest(ctx, canvas);

        // Ground terrain with perspective
        const groundGradient = ctx.createLinearGradient(0, canvas.height * 0.6, 0, canvas.height);
        groundGradient.addColorStop(0, '#5fa366');     // Mid grass
        groundGradient.addColorStop(0.4, '#4a8a52');   // Darker grass
        groundGradient.addColorStop(1, '#3d6b42');     // Dark foreground
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);

        // Ground texture/detail
        this.renderGroundDetail(ctx, canvas);
    }

    renderSun(ctx, canvas) {
        // Sun position in upper right area
        const sunX = canvas.width * 0.75;
        const sunY = canvas.height * 0.15;
        const sunRadius = 50;
        
        // Create subtle, slow pulsing effect using animation time
        const flicker = Math.sin(this.animationTime * 0.5) * 0.1 + 0.9; // Subtle pulsing between 0.8 and 1.0

        // Outer glow - very soft, far reaching
        const outerGlow = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.5, sunX, sunY, sunRadius * 4);
        outerGlow.addColorStop(0, 'rgba(255, 180, 80, 0.15)');
        outerGlow.addColorStop(0.5, 'rgba(255, 160, 60, 0.06)');
        outerGlow.addColorStop(1, 'rgba(255, 140, 40, 0)');
        ctx.fillStyle = outerGlow;
        ctx.fillRect(sunX - sunRadius * 4.2, sunY - sunRadius * 4.2, sunRadius * 8.4, sunRadius * 8.4);

        // Mid glow - corona effect (much slower, more natural)
        const coronaGlow = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.8, sunX, sunY, sunRadius * 2.8);
        coronaGlow.addColorStop(0, `rgba(255, 200, 120, ${0.25 * flicker})`);
        coronaGlow.addColorStop(0.6, 'rgba(255, 160, 80, 0.12)');
        coronaGlow.addColorStop(1, 'rgba(255, 120, 60, 0)');
        ctx.fillStyle = coronaGlow;
        ctx.fillRect(sunX - sunRadius * 3, sunY - sunRadius * 3, sunRadius * 6, sunRadius * 6);

        // Sun core with radial gradient for depth - warmer golden tones
        const sunGradient = ctx.createRadialGradient(sunX - 15, sunY - 15, 5, sunX, sunY, sunRadius);
        sunGradient.addColorStop(0, '#fffccc');     // Very light creamy yellow center
        sunGradient.addColorStop(0.25, '#fffa00');  // Bright yellow
        sunGradient.addColorStop(0.5, '#ffd700');   // Golden
        sunGradient.addColorStop(0.75, '#ffb700');  // Golden-orange
        sunGradient.addColorStop(1, '#ff9500');     // Warm orange rim
        ctx.fillStyle = sunGradient;
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
        const outerCorona = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.7, sunX, sunY, sunRadius * 2.2);
        outerCorona.addColorStop(0, `rgba(255, 200, 140, ${0.15 * flicker})`);
        outerCorona.addColorStop(0.5, 'rgba(255, 180, 120, 0.08)');
        outerCorona.addColorStop(1, 'rgba(255, 160, 100, 0)');
        ctx.fillStyle = outerCorona;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius * 2.2, 0, Math.PI * 2);
        ctx.fill();
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
        // Slower birds, less frequently, better V-formation
        
        const flocks = [
            { startTime: 6, duration: 20, yOffset: canvas.height * 0.20, birdCount: 5, cycleLength: 45 },
            { startTime: 31, duration: 20, yOffset: canvas.height * 0.28, birdCount: 4, cycleLength: 70 },
            { startTime: 46, duration: 20, yOffset: canvas.height * 0.15, birdCount: 6, cycleLength: 100 },
        ];
        
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
        
        // Calculate wing positions based on flap
        const wingUp = wingFlap > 0.5;
        const wingAngle = (wingFlap - 0.5) * Math.PI; // 0 to PI for full flap
        
        // Draw left wing
        ctx.strokeStyle = 'rgba(80, 80, 80, 0.8)';
        ctx.lineWidth = 1.5 * scale;
        ctx.beginPath();
        ctx.moveTo(x - 2 * scale, y);
        const leftWingX = x - 8 * scale - Math.abs(Math.sin(wingAngle) * 4 * scale);
        const leftWingY = wingUp ? y - 2 * scale : y + 1 * scale;
        ctx.quadraticCurveTo(x - 5 * scale, leftWingY, leftWingX, leftWingY + 1 * scale);
        ctx.stroke();
        
        // Draw right wing
        ctx.beginPath();
        ctx.moveTo(x + 2 * scale, y);
        const rightWingX = x + 8 * scale + Math.abs(Math.sin(wingAngle) * 4 * scale);
        const rightWingY = wingUp ? y - 2 * scale : y + 1 * scale;
        ctx.quadraticCurveTo(x + 5 * scale, rightWingY, rightWingX, rightWingY + 1 * scale);
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
        // Creates subtle effect that moves slower and more naturally
        
        const gustCycle = (this.animationTime % 15);
        if (gustCycle > 10 && gustCycle < 12) {
            const gustProgress = (gustCycle - 10) / 2;
            const gustOpacity = (Math.sin(gustProgress * Math.PI) * 0.25) * this.contentOpacity;
            
            if (gustOpacity > 0.01) {
                // Multiple longer parallel wind streaks at different heights
                const streakLayers = [
                    { yBase: canvas.height * 0.16, count: 2, spacing: 40 },
                    { yBase: canvas.height * 0.26, count: 2, spacing: 45 },
                    { yBase: canvas.height * 0.33, count: 2, spacing: 38 },
                ];
                
                streakLayers.forEach(layer => {
                    for (let i = 0; i < layer.count; i++) {
                        const y = layer.yBase + (i * layer.spacing);
                        const streakLength = 150 + Math.sin(gustProgress * Math.PI + i * 0.5) * 30;
                        const streakX = -100 + gustProgress * (canvas.width + 200) * 0.8; // Slower movement
                        
                        // Soft gradient wind streak - longer and more subtle
                        const gradient = ctx.createLinearGradient(
                            streakX - streakLength, y,
                            streakX + streakLength, y
                        );
                        gradient.addColorStop(0, `rgba(200, 220, 255, 0)`);
                        gradient.addColorStop(0.2, `rgba(200, 220, 255, ${gustOpacity * 0.5})`);
                        gradient.addColorStop(0.5, `rgba(200, 220, 255, ${gustOpacity})`);
                        gradient.addColorStop(0.8, `rgba(200, 220, 255, ${gustOpacity * 0.5})`);
                        gradient.addColorStop(1, `rgba(200, 220, 255, 0)`);
                        
                        ctx.fillStyle = gradient;
                        ctx.fillRect(streakX - streakLength, y - 1, streakLength * 2, 2);
                    }
                });
            }
        }
    }

    renderDistantHills(ctx, canvas) {
        // Far background hills with atmospheric perspective
        ctx.fillStyle = '#5a7d8a';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height * 0.45);
        ctx.quadraticCurveTo(canvas.width * 0.2, canvas.height * 0.35, canvas.width * 0.4, canvas.height * 0.42);
        ctx.quadraticCurveTo(canvas.width * 0.6, canvas.height * 0.32, canvas.width * 0.8, canvas.height * 0.43);
        ctx.quadraticCurveTo(canvas.width * 0.9, canvas.height * 0.38, canvas.width, canvas.height * 0.45);
        ctx.lineTo(canvas.width, canvas.height * 0.6);
        ctx.lineTo(0, canvas.height * 0.6);
        ctx.fill();

        // Hill shadow/depth
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height * 0.48);
        ctx.quadraticCurveTo(canvas.width * 0.5, canvas.height * 0.38, canvas.width, canvas.height * 0.48);
        ctx.lineTo(canvas.width, canvas.height * 0.6);
        ctx.lineTo(0, canvas.height * 0.6);
        ctx.fill();
    }

    renderMidGroundForest(ctx, canvas) {
        // Trees in middle distance with scale
        const trees = [
            { x: 40, y: canvas.height * 0.48, scale: 0.6, opacity: 0.7 },
            { x: 80, y: canvas.height * 0.52, scale: 0.7, opacity: 0.75 },
            { x: canvas.width - 60, y: canvas.height * 0.50, scale: 0.65, opacity: 0.72 },
            { x: canvas.width - 120, y: canvas.height * 0.54, scale: 0.75, opacity: 0.78 },
        ];

        trees.forEach(tree => {
            ctx.globalAlpha = this.contentOpacity * tree.opacity;
            this.renderDistantTree(ctx, tree.x, tree.y, tree.scale);
        });
        ctx.globalAlpha = this.contentOpacity;
    }

    renderDistantTree(ctx, x, y, scale) {
        // Simplified distant tree with perspective
        ctx.fillStyle = '#2d5a2d';
        ctx.beginPath();
        ctx.arc(x, y - 15 * scale, 18 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Trunk
        ctx.fillStyle = '#4d3d2d';
        ctx.fillRect(x - 3 * scale, y - 5 * scale, 6 * scale, 12 * scale);
    }

    renderGroundDetail(ctx, canvas) {
        // Add subtle grass texture
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.lineWidth = 1;

        for (let i = 0; i < 50; i++) {
            const x = Math.random() * canvas.width;
            const y = canvas.height * 0.65 + Math.random() * (canvas.height * 0.35);
            const length = 3 + Math.random() * 8;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + 1, y - length);
            ctx.stroke();
        }
    }

    renderSettlementScene(ctx, canvas) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height * 0.76;  // Ground level, lower

        // Exterior trees behind the wall — sorted by Y so distant ones draw first
        this.renderSettlementTerrain(ctx, canvas, centerX, centerY);

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
        this.createEllipseClipPath(ctx, centerX, centerY, 358, 138);
        this.renderSettlementPaths(ctx, canvas, centerX, centerY);   // floor surface + fountain
        // Details (crates, barrels, shrubs) drawn ON TOP of paths, still inside wall clip
        this.renderSettlementDetails(ctx, centerX, centerY);
        ctx.restore();

        // Render interior decorative buildings clipped well inside the wall inner face
        ctx.save();
        this.createEllipseClipPath(ctx, centerX, centerY, 356, 136);
        this.renderSettlementBuildings(ctx, canvas, true);
        ctx.restore();

        // Re-render front-arc wall posts + horizontal rail + gate + guard towers on top of
        // all interior content so they correctly occlude interior buildings
        this.renderFrontWallOverlay(ctx, canvas, centerX, centerY);

        // Render exterior/clickable buildings without clipping (TrainingGrounds, Castle — intentionally outside)
        this.renderSettlementBuildings(ctx, canvas, false);

        // Render bard character near the fountain (only if musical-equipment upgrade purchased)
        const upgradeSystem = this.stateManager?.upgradeSystem;
        if (upgradeSystem && upgradeSystem.hasUpgrade('musical-equipment')) {
            this.renderBard(ctx, centerX + 58, centerY - 15);
        }
        
        // Render active boons
        this.renderActiveBoons(ctx, canvas);

        // Ground shadow under settlement
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 50, 340, 120, 0, 0, Math.PI * 2);
        ctx.fill();
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
        const rX = 360;
        const rY = 140;
        const total = 64; // candidate positions around the full perimeter

        for (let i = 0; i < total; i++) {
            const angle = (i / total) * Math.PI * 2;
            const sinA = Math.sin(angle);
            const cosA = Math.cos(angle);

            // Front half: sin > 0  (bottom arc, higher Y, closer to viewer)
            // Back  half: sin <= 0 (top  arc, lower  Y, further from viewer)
            if (frontHalf  && sinA <= 0.05) continue;
            if (!frontHalf && sinA >  0.05) continue;

            // Skip gate gap (bottom-center) — gate is at angle ≈ π/2
            const normAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            if (normAngle > 1.26 && normAngle < 1.88) continue; // ~72-108 deg

            // Skip guard-tower flanking zones (centerX ± ~120 px at the very bottom)
            if (sinA > 0.88 && Math.abs(cosA * rX) < 150) continue;

            // Deterministic LCG values from index — stable across frames
            let s = (i * 1664525 + 1013904223) >>> 0;
            const r1 = (s >>> 0) / 0x100000000;
            s = (s * 1664525 + 1013904223) >>> 0;
            const r2 = (s >>> 0) / 0x100000000;
            s = (s * 1664525 + 1013904223) >>> 0;
            const r3 = (s >>> 0) / 0x100000000;

            // Outset radially from wall surface, with tangential scatter
            const outset  = 20 + r1 * 32;        // 20-52 px outside the wall
            const tangent = (r2 - 0.5) * 22;     // ±11 px tangential jitter
            const wx = centerX + (rX + outset) * cosA + (-sinA) * tangent;
            const wy = centerY + (rY + outset) * sinA + cosA   * tangent;

            // Item type: 0 = medium rock, 1 = shrub, 2 = small rock
            const type = Math.floor(r3 * 3);

            if (type === 1) {
                // Shrub — reuse existing helper
                const r = 5 + r2 * 7;
                this.renderShrub(ctx, wx, wy, r);
            } else {
                // Rock (medium or small)
                const size = type === 0 ? (9 + r1 * 10) : (4 + r2 * 7);
                const tone = 92 + Math.floor(r3 * 32);
                const rot  = r1 * 1.5;

                ctx.fillStyle = `rgb(${tone},${tone - 11},${tone - 24})`;
                ctx.beginPath();
                ctx.ellipse(wx, wy, size * 0.72, size * 0.44, rot, 0, Math.PI * 2);
                ctx.fill();

                // Shadow underside
                ctx.fillStyle = 'rgba(0,0,0,0.22)';
                ctx.beginPath();
                ctx.ellipse(wx + 1, wy + 2, size * 0.66, size * 0.30, rot, 0, Math.PI * 2);
                ctx.fill();

                // Highlight
                ctx.fillStyle = 'rgba(255,255,255,0.13)';
                ctx.beginPath();
                ctx.ellipse(wx - size * 0.18, wy - size * 0.14, size * 0.28, size * 0.16, rot, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    renderEllipticalPalisade(ctx, canvas, centerX, centerY) {
        // Simple vertical stick palisade with 3D trunk texture
        const radiusX = 360;
        const radiusY = 140;
        
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
            const { x, y, i } = post;
            
            // Draw 3D trunk with texture - alternate slightly taller posts for handbuilt look
            const postWidth = 12;
            const postHeight = 60 + (i % 3 === 0 ? 6 : 0);
            
            // Left side shadow (3D depth)
            ctx.fillStyle = '#4a3a2a';
            ctx.fillRect(x - postWidth/2 - 3, y - postHeight, 3, postHeight);
            
            // Main trunk - medium brown
            ctx.fillStyle = '#6b5a47';
            ctx.fillRect(x - postWidth/2, y - postHeight, postWidth, postHeight);
            
            // Right side highlight (3D depth)
            ctx.fillStyle = '#8b7a67';
            ctx.fillRect(x + postWidth/2, y - postHeight, 2, postHeight);
            
            // Vertical grain lines for wood texture
            ctx.strokeStyle = '#4a3a2a';
            ctx.lineWidth = 1;
            for (let g = 0; g < postHeight; g += 6) {
                ctx.beginPath();
                ctx.moveTo(x - postWidth/2 + 2, y - postHeight + g);
                ctx.lineTo(x - postWidth/2 + 2, y - postHeight + g + 4);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(x + postWidth/2 - 2, y - postHeight + g);
                ctx.lineTo(x + postWidth/2 - 2, y - postHeight + g + 4);
                ctx.stroke();
            }
            
            // Post top cap - pointed
            ctx.fillStyle = '#5a4a37';
            ctx.beginPath();
            ctx.moveTo(x - postWidth/2, y - postHeight);
            ctx.lineTo(x, y - postHeight - 5);
            ctx.lineTo(x + postWidth/2, y - postHeight);
            ctx.fill();
        });
        // Note: horizontal rail, gate, and guard towers are rendered in renderFrontWallOverlay
    }
    
    renderFrontWallOverlay(ctx, canvas, centerX, centerY) {
        // Renders the front-facing wall posts, horizontal rail, gate, and guard towers
        // Called AFTER all interior content so these elements always draw on top
        const radiusX = 360;
        const radiusY = 140;

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
            const { x, y, i } = post;
            const postWidth = 12;
            const postHeight = 60 + (i % 3 === 0 ? 6 : 0);

            ctx.fillStyle = '#4a3a2a';
            ctx.fillRect(x - postWidth/2 - 3, y - postHeight, 3, postHeight);

            ctx.fillStyle = '#6b5a47';
            ctx.fillRect(x - postWidth/2, y - postHeight, postWidth, postHeight);

            ctx.fillStyle = '#8b7a67';
            ctx.fillRect(x + postWidth/2, y - postHeight, 2, postHeight);

            ctx.strokeStyle = '#4a3a2a';
            ctx.lineWidth = 1;
            for (let g = 0; g < postHeight; g += 6) {
                ctx.beginPath();
                ctx.moveTo(x - postWidth/2 + 2, y - postHeight + g);
                ctx.lineTo(x - postWidth/2 + 2, y - postHeight + g + 4);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(x + postWidth/2 - 2, y - postHeight + g);
                ctx.lineTo(x + postWidth/2 - 2, y - postHeight + g + 4);
                ctx.stroke();
            }

            ctx.fillStyle = '#5a4a37';
            ctx.beginPath();
            ctx.moveTo(x - postWidth/2, y - postHeight);
            ctx.lineTo(x, y - postHeight - 5);
            ctx.lineTo(x + postWidth/2, y - postHeight);
            ctx.fill();
        });

        // Horizontal connecting rail — drawn over all posts and interior content
        ctx.strokeStyle = '#4a3a2a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - 46, radiusX - 6, radiusY - 6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#7a6040';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - 48, radiusX - 6, radiusY - 6, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Gate and guard towers — always topmost front elements
        this.renderIntegratedGate(ctx, centerX, centerY + radiusY - 5);
        this.renderGuardTowerWithBase(ctx, centerX - 120, centerY + radiusY + 15);
        this.renderGuardTowerWithBase(ctx, centerX + 120, centerY + radiusY + 15);
    }

    renderIntegratedGate(ctx, x, y) {
        // Gate integrated into wall structure - part of the wall
        const gateWidth = 55;
        const gateHeight = 60;
        
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
        
        // Fill gaps between gate and wall with wall pieces (left and right)
        const wallGapSize = 8;
        const wallGapHeight = gateHeight;
        
        // Left wall gap - small wooden fill posts
        for (let i = 0; i < 3; i++) {
            const fillX = x - gateWidth/2 - 5 - (i * 8);
            ctx.fillStyle = '#6b5a47';
            ctx.fillRect(fillX, y - gateHeight, 6, wallGapHeight);
            
            ctx.strokeStyle = '#4a3a2a';
            ctx.lineWidth = 1;
            ctx.strokeRect(fillX, y - gateHeight, 6, wallGapHeight);
            
            // Wood grain
            for (let g = 0; g < wallGapHeight; g += 8) {
                ctx.beginPath();
                ctx.moveTo(fillX + 1, y - gateHeight + g);
                ctx.lineTo(fillX + 5, y - gateHeight + g);
                ctx.stroke();
            }
        }
        
        // Right wall gap - small wooden fill posts
        for (let i = 0; i < 3; i++) {
            const fillX = x + gateWidth/2 + 5 + (i * 8);
            ctx.fillStyle = '#6b5a47';
            ctx.fillRect(fillX, y - gateHeight, 6, wallGapHeight);
            
            ctx.strokeStyle = '#4a3a2a';
            ctx.lineWidth = 1;
            ctx.strokeRect(fillX, y - gateHeight, 6, wallGapHeight);
            
            // Wood grain
            for (let g = 0; g < wallGapHeight; g += 8) {
                ctx.beginPath();
                ctx.moveTo(fillX + 1, y - gateHeight + g);
                ctx.lineTo(fillX + 5, y - gateHeight + g);
                ctx.stroke();
            }
        }
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

    renderGuardTowerWithBase(ctx, x, y) {
        // Guard tower styled like BasicTower - wooden tower with stone base, connected to ground
        const towerSize = 50;
        const towerHeight = 70;
        const baseSize = 60;
        const baseHeight = 12;
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
        
        // Stone base platform - connected to ground
        ctx.fillStyle = '#A9A9A9';
        ctx.fillRect(x - baseSize/2, y - baseHeight, baseSize, baseHeight);
        
        // Base top highlight
        ctx.fillStyle = '#D3D3D3';
        ctx.fillRect(x - baseSize/2, y - baseHeight, baseSize, 2);
        
        // Stone base detail
        ctx.strokeStyle = '#696969';
        ctx.lineWidth = 1;
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
        
        // Tower main fill between posts
        ctx.fillStyle = '#8B7355';
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

    renderSettlementBuildings(ctx, canvas, interiorOnly) {
        // Render all actual building instances with settlement-specific visuals
        // interiorOnly=true  → render only non-clickable decorative interior buildings (clipped)
        // interiorOnly=false → render only clickable exterior buildings (not clipped)
        // interiorOnly=undefined → render everything (legacy call, not used in renderSettlementScene)
        const headers = {
            'TrainingGrounds': 'Campaign',
            'MagicAcademy': 'Arcane Library',
            'TowerForge': 'Buy & Sell',
            'Castle': 'Manage Settlement'
        };

        this.settlementBuildings.forEach(item => {
            if (item.building) {
                // Interior pass (clipped): only non-clickable decorative buildings
                // Exterior pass (unclipped): all clickable buildings (headers must render above walls)
                if (interiorOnly === true && item.clickable) return;
                if (interiorOnly === false && !item.clickable) return;

                ctx.globalAlpha = this.contentOpacity;
                
                // Special handling for TrainingGrounds: render scaled-down version at 70% for settlement
                if (item.building instanceof TrainingGrounds) {
                    this.renderTrainingGroundsSettlement(ctx, item.building);
                } else {
                    const size = item.scale * 4; // Convert scale to building size (4x4 grid)
                    
                    // Use SettlementBuildingVisuals for custom settlement rendering
                    const visuals = new SettlementBuildingVisuals(item.building);
                    visuals.render(ctx, size);
                }
                
                // Render header for clickable buildings
                if (item.clickable && item.action) {
                    const buildingType = item.building.constructor.name;
                    const headerText = headers[buildingType] || '';
                    
                    if (headerText) {
                        const headerX = item.building.x;
                        const headerY = item.building.y - 120;
                        
                        // Special handling for TowerForge with line break
                        if (buildingType === 'TowerForge') {
                            // Header text shadow
                            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                            ctx.font = 'bold 22px Arial';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText('Upgrades &', headerX + 1, headerY - 15 + 1);
                            ctx.fillText('Marketplace', headerX + 1, headerY + 15 + 1);
                            
                            // Header text
                            ctx.fillStyle = '#FFD700';
                            ctx.fillText('Upgrades &', headerX, headerY - 15);
                            ctx.fillText('Marketplace', headerX, headerY + 15);
                        } else {
                            // Header text shadow
                            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                            ctx.font = 'bold 24px Arial';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText(headerText, headerX + 1, headerY + 1);
                            
                            // Header text
                            ctx.fillStyle = '#FFD700';
                            ctx.fillText(headerText, headerX, headerY);
                        }
                    }
                }
                
                ctx.globalAlpha = 1;
            }
        });
    }

    renderTrainingGroundsSettlement(ctx, building) {
        // Render a scaled version of training grounds for the settlement display
        // Base scale is 0.7, then adjusted to fit within the red square area (~0.4x)
        const baseScale = 0.7;
        const settlementScale = 2.2; // Scales it down to fit in the red square
        const scale = baseScale * settlementScale;
        const x = building.x;
        const y = building.y;
        
        // ===== BACKGROUND & TERRAIN =====
        
        // Grass base - 70% of original size
        const grassGradient = ctx.createLinearGradient(
            x - (50 * scale), y - (48 * scale),
            x - (50 * scale), y + (48 * scale)
        );
        grassGradient.addColorStop(0, '#5A7A3A');
        grassGradient.addColorStop(0.5, '#6B8E3A');
        grassGradient.addColorStop(1, '#4A6A2A');
        
        ctx.fillStyle = grassGradient;
        ctx.fillRect(x - (50 * scale), y - (48 * scale), 100 * scale, 96 * scale);
        
        // Dirt wear patches
        const wearPatches = [
            { x: -38, y: -28, width: 27, height: 4, intensity: 0.5 },
            { x: 38, y: -28, width: 27, height: 4, intensity: 0.5 },
            { x: -24, y: 20, width: 18, height: 18, intensity: 0.6 },
            { x: 24, y: 20, width: 18, height: 18, intensity: 0.6 },
            { x: -38, y: 8, width: 13, height: 8, intensity: 0.4 },
            { x: 38, y: 8, width: 13, height: 8, intensity: 0.4 }
        ];
        
        wearPatches.forEach(patch => {
            const dirtGradient = ctx.createRadialGradient(
                x + (patch.x * scale), y + (patch.y * scale), 0,
                x + (patch.x * scale), y + (patch.y * scale), Math.max(patch.width, patch.height)
            );
            dirtGradient.addColorStop(0, `rgba(139, 90, 43, ${patch.intensity})`);
            dirtGradient.addColorStop(0.7, `rgba(139, 90, 43, ${patch.intensity * 0.5})`);
            dirtGradient.addColorStop(1, `rgba(139, 90, 43, 0)`);
            
            ctx.fillStyle = dirtGradient;
            ctx.fillRect(
                x + (patch.x * scale) - (patch.width * scale / 2),
                y + (patch.y * scale) - (patch.height * scale / 2),
                patch.width * scale,
                patch.height * scale
            );
        });
        
        // Grass variations
        const grassVariations = [
            { x: -42, y: -38, radius: 5, opacity: 0.25 },
            { x: 42, y: -38, radius: 5, opacity: 0.25 },
            { x: -42, y: 38, radius: 6, opacity: 0.3 },
            { x: 42, y: 38, radius: 6, opacity: 0.3 }
        ];
        
        grassVariations.forEach(area => {
            const grassVarGradient = ctx.createRadialGradient(
                x + (area.x * scale), y + (area.y * scale), 0,
                x + (area.x * scale), y + (area.y * scale), area.radius * scale
            );
            grassVarGradient.addColorStop(0, `rgba(34, 139, 34, ${area.opacity})`);
            grassVarGradient.addColorStop(1, `rgba(34, 139, 34, 0)`);
            
            ctx.fillStyle = grassVarGradient;
            ctx.beginPath();
            ctx.arc(x + (area.x * scale), y + (area.y * scale), area.radius * scale, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Scattered stones
        const rocks = [
            { x: -47, y: -35, size: 1 },
            { x: 47, y: -35, size: 1 },
            { x: -47, y: 35, size: 1.1 },
            { x: 47, y: 35, size: 1 }
        ];
        
        rocks.forEach(rock => {
            ctx.fillStyle = '#8B8680';
            ctx.strokeStyle = '#696969';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.arc(x + (rock.x * scale), y + (rock.y * scale), rock.size * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
        
        // ===== FENCE & DECORATIONS =====
        
        // Fence perimeter at 70% scale
        const segments = [
            { startX: -50, startY: -48, endX: 50, endY: -48, posts: 13 },
            { startX: 50, startY: -48, endX: 50, endY: 48, posts: 12 },
            { startX: 50, startY: 48, endX: -50, endY: 48, posts: 13 },
            { startX: -50, startY: 48, endX: -50, endY: -48, posts: 12 }
        ];
        
        segments.forEach(segment => {
            const startX = x + (segment.startX * scale);
            const startY = y + (segment.startY * scale);
            const endX = x + (segment.endX * scale);
            const endY = y + (segment.endY * scale);
            
            const angle = Math.atan2(endY - startY, endX - startX);
            const distance = Math.hypot(endX - startX, endY - startY);
            const postSpacing = distance / (segment.posts - 1);
            
            for (let i = 0; i < segment.posts; i++) {
                const postX = startX + Math.cos(angle) * (i * postSpacing);
                const postY = startY + Math.sin(angle) * (i * postSpacing);
                
                // Post shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.fillRect(postX - (1 * scale), postY + (1 * scale), 2 * scale, 1.5 * scale);
                
                // Post
                ctx.fillStyle = '#8B6F47';
                ctx.fillRect(postX - (1.25 * scale), postY - (11 * scale), 2.5 * scale, 12 * scale);
                
                // Post top
                ctx.fillStyle = '#654321';
                ctx.fillRect(postX - (1.75 * scale), postY - (12 * scale), 3.5 * scale, 1.5 * scale);
                
                // Post crossbeams
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 0.5 * scale;
                for (let g = 0; g < 3; g++) {
                    ctx.beginPath();
                    ctx.moveTo(postX - (1.25 * scale), postY - (10 * scale) + (g * 3.5 * scale));
                    ctx.lineTo(postX + (1.25 * scale), postY - (9.5 * scale) + (g * 3.5 * scale));
                    ctx.stroke();
                }
            }
            
            // Rails between posts
            for (let i = 0; i < segment.posts - 1; i++) {
                const railStartX = startX + Math.cos(angle) * (i * postSpacing);
                const railStartY = startY + Math.sin(angle) * (i * postSpacing);
                const railEndX = startX + Math.cos(angle) * ((i + 1) * postSpacing);
                const railEndY = startY + Math.sin(angle) * ((i + 1) * postSpacing);
                
                ctx.strokeStyle = '#CD853F';
                ctx.lineWidth = 1.5 * scale;
                ctx.beginPath();
                ctx.moveTo(railStartX, railStartY - (5 * scale));
                ctx.lineTo(railEndX, railEndY - (5 * scale));
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(railStartX, railStartY - (1.5 * scale));
                ctx.lineTo(railEndX, railEndY - (1.5 * scale));
                ctx.stroke();
            }
        });
        
        // ===== HUTS & STRUCTURES =====
        
        // Wooden hut
        const hutX = x + (-42 * scale);
        const hutY = y + (-38 * scale);
        const hutWidth = 10 * scale;
        const hutHeight = 9 * scale;
        
        // Hut shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(hutX - (hutWidth / 2) + (1 * scale), hutY + (1 * scale), hutWidth, hutHeight);
        
        // Hut main body
        ctx.fillStyle = '#8B6F47';
        ctx.fillRect(hutX - (hutWidth / 2), hutY, hutWidth, hutHeight);
        
        // Hut outline
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 0.5 * scale;
        ctx.strokeRect(hutX - (hutWidth / 2), hutY, hutWidth, hutHeight);
        
        // Hut planks
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 0.2 * scale;
        for (let i = 1; i < 4; i++) {
            const plankY = hutY + (hutHeight * i / 4);
            ctx.beginPath();
            ctx.moveTo(hutX - (hutWidth / 2), plankY);
            ctx.lineTo(hutX + (hutWidth / 2), plankY);
            ctx.stroke();
        }
        
        // Hut roof
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.moveTo(hutX - (hutWidth / 2), hutY);
        ctx.lineTo(hutX, hutY - (4 * scale));
        ctx.lineTo(hutX + (hutWidth / 2), hutY);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 0.5 * scale;
        ctx.stroke();
        
        // ===== TREES AROUND FENCE =====
        
        const trees = [
            { x: -54, y: -52, size: 15 * 1.8 * scale },
            { x: -46, y: -54, size: 15 * 2.0 * scale },
            { x: 54, y: -52, size: 15 * 1.9 * scale },
            { x: 56, y: -48, size: 15 * 1.7 * scale },
            { x: -56, y: 52, size: 15 * 1.95 * scale },
            { x: 54, y: 54, size: 15 * 1.8 * scale }
        ];
        
        trees.forEach((tree, idx) => {
            this.renderSettlementTree(ctx, x, y, tree.x, tree.y, tree.size, scale, idx);
        });
        
        // ===== ROCKS =====
        
        const decorRocks = [
            { x: -60, y: -40, size: 1.75 * scale },
            { x: 60, y: -42, size: 2.0 * scale },
            { x: -60, y: 36, size: 1.9 * scale },
            { x: 60, y: 32, size: 1.6 * scale }
        ];
        
        decorRocks.forEach(rock => {
            ctx.fillStyle = '#696969';
            ctx.strokeStyle = '#2F2F2F';
            ctx.lineWidth = 0.5 * scale;
            ctx.beginPath();
            ctx.arc(x + (rock.x * scale), y + (rock.y * scale), rock.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
        
        // ===== BUSHES =====
        
        const bushes = [
            { x: -57, y: -32, size: 0.6 * scale },
            { x: 58, y: -36, size: 0.65 * scale },
            { x: -56, y: 48, size: 0.55 * scale },
            { x: 57, y: 52, size: 0.7 * scale }
        ];
        
        bushes.forEach(bush => {
            const bushX = x + (bush.x * scale);
            const bushY = y + (bush.y * scale);
            
            ctx.fillStyle = '#1f6f1f';
            ctx.beginPath();
            ctx.arc(bushX, bushY, 2.5 * bush.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#28a028';
            ctx.beginPath();
            ctx.arc(bushX - (1 * bush.size), bushY - (1 * bush.size), 1.75 * bush.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(bushX + (1 * bush.size), bushY - (1 * bush.size), 1.75 * bush.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // ===== BARRELS =====
        
        const barrels = [
            { x: -64, y: -24 },
            { x: 64, y: -22 },
            { x: -62, y: 28 },
            { x: 62, y: 26 }
        ];
        
        barrels.forEach(barrel => {
            const barrelX = x + (barrel.x * scale);
            const barrelY = y + (barrel.y * scale);
            
            // Barrel shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(barrelX - (2.5 * scale), barrelY + (1.5 * scale), 5 * scale, 1.5 * scale);
            
            // Barrel body
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(barrelX - (2.5 * scale), barrelY - (5 * scale), 5 * scale, 6.5 * scale);
            
            // Barrel outline
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 0.75 * scale;
            ctx.strokeRect(barrelX - (2.5 * scale), barrelY - (5 * scale), 5 * scale, 6.5 * scale);
            
            // Barrel bands
            ctx.beginPath();
            ctx.moveTo(barrelX - (2.5 * scale), barrelY - (3 * scale));
            ctx.lineTo(barrelX + (2.5 * scale), barrelY - (3 * scale));
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(barrelX - (2.5 * scale), barrelY - (1 * scale));
            ctx.lineTo(barrelX + (2.5 * scale), barrelY - (1 * scale));
            ctx.stroke();
        });
        
        // ===== ARCHER TRAINING ELEMENTS =====
        
        // Lane dividers
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
        ctx.lineWidth = 0.7;
        ctx.setLineDash([8 * scale, 8 * scale]);
        
        ctx.beginPath();
        ctx.moveTo(x - (48 * scale), y + (-28 * scale));
        ctx.lineTo(x + (48 * scale), y + (-28 * scale));
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x - (48 * scale), y + (8 * scale));
        ctx.lineTo(x + (48 * scale), y + (8 * scale));
        ctx.stroke();
        
        ctx.setLineDash([]);
        
        // Archer targets (left side)
        const targetPositions = [
            { x: -28, y: -28 - 35 },
            { x: -14, y: -28 - 35 },
            { x: 0, y: -28 - 35 },
            { x: 14, y: -28 - 35 },
            { x: 28, y: -28 - 35 }
        ];
        
        targetPositions.forEach(targetPos => {
            this.renderSettlementTarget(ctx, x, y, targetPos.x, targetPos.y, scale);
        });
        
        // Archers
        const archerPositions = [
            { x: -38, y: -28, isLeft: true },
            { x: -22, y: -28, isLeft: true },
            { x: 38, y: -28, isLeft: false },
            { x: 22, y: -28, isLeft: false }
        ];
        
        archerPositions.forEach(archer => {
            this.renderSettlementArcher(ctx, x, y, archer.x, archer.y, archer.isLeft, scale);
        });
        
        // ===== SWORD DUEL CIRCLES =====
        
        const duelCircles = [
            { x: -24, y: 20 },
            { x: 24, y: 20 }
        ];
        
        duelCircles.forEach((circle, circleIdx) => {
            const circleX = x + (circle.x * scale);
            const circleY = y + (circle.y * scale);
            
            ctx.strokeStyle = 'rgba(139, 69, 19, 0.5)';
            ctx.lineWidth = 1 * scale;
            ctx.beginPath();
            ctx.arc(circleX, circleY, 9 * scale, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.strokeStyle = 'rgba(160, 82, 45, 0.3)';
            ctx.lineWidth = 0.5 * scale;
            ctx.beginPath();
            ctx.arc(circleX, circleY, 7 * scale, 0, Math.PI * 2);
            ctx.stroke();
            
            // Render animated sword fighters in each circle
            // Left fighter
            this.renderSwordFighter(ctx, circleX - (4 * scale), circleY, 1, scale);
            // Right fighter
            this.renderSwordFighter(ctx, circleX + (4 * scale), circleY, -1, scale);
        });
        
        // ===== TRAINING DUMMIES =====
        
        const dummyPositions = [
            { x: -38, y: 8 },
            { x: 38, y: 8 }
        ];
        
        dummyPositions.forEach(dummy => {
            this.renderSettlementDummy(ctx, x, y, dummy.x, dummy.y, scale);
        });

        // Render arrow/dust particles — scale transform maps unscaled particle coords to visual scale
        ctx.save();
        ctx.translate(x * (1 - scale), y * (1 - scale));
        ctx.scale(scale, scale);
        building.renderParticles(ctx);
        ctx.restore();
    }
    
    renderSettlementTree(ctx, centerX, centerY, treeOffsetX, treeOffsetY, size, scale, idx) {
        const treeX = centerX + (treeOffsetX * scale);
        const treeY = centerY + (treeOffsetY * scale);
        const treeType = idx % 4;
        
        ctx.save();
        ctx.translate(treeX, treeY);
        
        const trunkWidth = size * 0.25;
        const trunkHeight = size * 0.5;
        
        if (treeType === 0) {
            // Tree type 1
            ctx.fillStyle = '#5D4037';
            ctx.fillRect(-trunkWidth * 0.5, 0, trunkWidth, trunkHeight);
            ctx.fillStyle = '#3E2723';
            ctx.fillRect(0, 0, trunkWidth * 0.5, trunkHeight);
            ctx.fillStyle = '#0D3817';
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.6);
            ctx.lineTo(size * 0.35, -size * 0.1);
            ctx.lineTo(-size * 0.35, -size * 0.1);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#1B5E20';
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.35);
            ctx.lineTo(size * 0.3, size * 0.05);
            ctx.lineTo(-size * 0.3, size * 0.05);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#2E7D32';
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.15);
            ctx.lineTo(size * 0.25, size * 0.2);
            ctx.lineTo(-size * 0.25, size * 0.2);
            ctx.closePath();
            ctx.fill();
        } else if (treeType === 1) {
            // Tree type 2
            ctx.fillStyle = '#6B4423';
            ctx.fillRect(-trunkWidth * 0.5, 0, trunkWidth, trunkHeight);
            ctx.fillStyle = '#8B5A3C';
            ctx.fillRect(-trunkWidth * 0.5 + trunkWidth * 0.6, 0, trunkWidth * 0.4, trunkHeight);
            ctx.fillStyle = '#1B5E20';
            ctx.beginPath();
            ctx.arc(0, -size * 0.1, size * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#2E7D32';
            ctx.beginPath();
            ctx.arc(0, -size * 0.35, size * 0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#43A047';
            ctx.beginPath();
            ctx.arc(0, -size * 0.55, size * 0.2, 0, Math.PI * 2);
            ctx.fill();
        } else if (treeType === 2) {
            // Tree type 3
            ctx.fillStyle = '#795548';
            ctx.fillRect(-trunkWidth * 0.5, -size * 0.2, trunkWidth, size * 0.6);
            ctx.fillStyle = '#4E342E';
            ctx.beginPath();
            ctx.arc(trunkWidth * 0.25, 0, trunkWidth * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#1B5E20';
            ctx.beginPath();
            ctx.arc(-size * 0.28, -size * 0.35, size * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(size * 0.28, -size * 0.3, size * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#2E7D32';
            ctx.beginPath();
            ctx.arc(0, -size * 0.55, size * 0.3, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Tree type 4
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-trunkWidth * 0.5, -size * 0.05, trunkWidth, size * 0.45);
            ctx.fillStyle = '#0D3817';
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.05);
            ctx.lineTo(size * 0.38, size * 0.15);
            ctx.lineTo(-size * 0.38, size * 0.15);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#1B5E20';
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.25);
            ctx.lineTo(size * 0.3, 0);
            ctx.lineTo(-size * 0.3, 0);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#2E7D32';
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.45);
            ctx.lineTo(size * 0.2, -size * 0.15);
            ctx.lineTo(-size * 0.2, -size * 0.15);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#43A047';
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.65);
            ctx.lineTo(size * 0.12, -size * 0.35);
            ctx.lineTo(-size * 0.12, -size * 0.35);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    renderSettlementTarget(ctx, centerX, centerY, targetOffsetX, targetOffsetY, scale) {
        const targetX = centerX + (targetOffsetX * scale);
        const targetY = centerY + (targetOffsetY * scale);
        
        ctx.save();
        ctx.translate(targetX, targetY);
        
        // Target stand
        ctx.fillStyle = '#654321';
        ctx.fillRect(-0.75 * scale, 0, 1.5 * scale, 10 * scale);
        
        ctx.fillStyle = '#5D4E37';
        ctx.fillRect(-2 * scale, 10 * scale, 4 * scale, 1 * scale);
        
        // Target rings
        const rings = [
            { radius: 5.5, color: '#DC143C', shadow: 1 },
            { radius: 3.7, color: '#FFD700', shadow: 0.8 },
            { radius: 2, color: '#DC143C', shadow: 0.6 },
            { radius: 0.8, color: '#FFD700', shadow: 0.4 }
        ];
        
        rings.forEach(ring => {
            ctx.fillStyle = `rgba(0, 0, 0, ${0.15 * ring.shadow})`;
            ctx.beginPath();
            ctx.arc(0.3 * scale, 0.3 * scale, ring.radius * scale, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = ring.color;
            ctx.beginPath();
            ctx.arc(0, 0, ring.radius * scale, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 0.5 * scale;
        ctx.beginPath();
        ctx.arc(0, 0, 6 * scale, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
    
    renderSettlementArcher(ctx, centerX, centerY, archerOffsetX, archerOffsetY, isLeft, scale) {
        const archerX = centerX + (archerOffsetX * scale);
        const archerY = centerY + (archerOffsetY * scale);
        
        // Animate drawback based on settlement animation time
        const drawback = (Math.sin(this.animationTime * 3) + 1) * 0.5;
        
        ctx.save();
        ctx.translate(archerX, archerY);
        
        if (!isLeft) {
            ctx.scale(-1, 1);
        }
        
        // Archer shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0.5 * scale, 0.5 * scale, 2 * scale, 0.7 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Archer body
        ctx.fillStyle = '#2D5016';
        ctx.fillRect(-2.5 * scale, -6.5 * scale, 5 * scale, 8 * scale);
        
        // Archer head
        ctx.fillStyle = '#DDBEA9';
        ctx.beginPath();
        ctx.arc(0, -7.5 * scale, 1.7 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Archer helm
        ctx.fillStyle = '#696969';
        ctx.beginPath();
        ctx.arc(0, -7.8 * scale, 2 * scale, Math.PI, Math.PI * 2);
        ctx.fill();
        
        // Bow
        const bowX = 2.5 * scale;
        const bowDrawAmount = drawback * 2;
        
        ctx.strokeStyle = '#8B6914';
        ctx.lineWidth = 1.2 * scale;
        ctx.beginPath();
        ctx.moveTo(bowX, -5 * scale);
        ctx.quadraticCurveTo(bowX + 2 * scale, -7.5 * scale, bowX + 1.3 * scale, -9 * scale);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(bowX, -5 * scale);
        ctx.quadraticCurveTo(bowX + 2 * scale, -2.5 * scale, bowX + 1.3 * scale, -1 * scale);
        ctx.stroke();
        
        // Bow string with animation
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 0.5 * scale;
        ctx.beginPath();
        ctx.moveTo(bowX + (bowDrawAmount * 0.5), -9 * scale);
        ctx.lineTo(bowX - bowDrawAmount, -5 * scale);
        ctx.lineTo(bowX + (bowDrawAmount * 0.5), -1 * scale);
        ctx.stroke();
        
        ctx.restore();
    }
    
    renderSettlementDummy(ctx, centerX, centerY, dummyOffsetX, dummyOffsetY, scale) {
        const dummyX = centerX + (dummyOffsetX * scale);
        const dummyY = centerY + (dummyOffsetY * scale);
        
        ctx.save();
        ctx.translate(dummyX, dummyY);
        
        // Dummy shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0.5 * scale, 0.5 * scale, 2.5 * scale, 0.8 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Dummy body - wooden post
        ctx.fillStyle = '#8B6F47';
        ctx.fillRect(-1.5 * scale, -5 * scale, 3 * scale, 10 * scale);
        
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 0.5 * scale;
        ctx.strokeRect(-1.5 * scale, -5 * scale, 3 * scale, 10 * scale);
        
        // Dummy crossbar for arms
        ctx.fillStyle = '#8B6F47';
        ctx.fillRect(-3.5 * scale, -1 * scale, 7 * scale, 1.2 * scale);
        
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 0.5 * scale;
        ctx.strokeRect(-3.5 * scale, -1 * scale, 7 * scale, 1.2 * scale);
        
        // Dummy head
        ctx.fillStyle = '#696969';
        ctx.beginPath();
        ctx.arc(0, -6 * scale, 1 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    renderSwordFighter(ctx, fighterX, fighterY, direction, scale) {
        // Animate sword swing based on settlement animation time
        const swingAngle = Math.sin(this.animationTime * 4 + direction) * 0.6;
        const stance = Math.sin(this.animationTime * 2) * 0.3;
        
        // Determine fighter color (alternating red and blue)
        const isRed = direction > 0;
        const bodyColor = isRed ? '#8B0000' : '#000080';
        
        ctx.save();
        ctx.translate(fighterX, fighterY);
        
        // Fighter shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0.3 * scale, 0.5 * scale, 1.8 * scale, 0.6 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Fighter body
        ctx.fillStyle = bodyColor;
        ctx.fillRect(-1.2 * scale, -3.5 * scale, 2.4 * scale, 4.5 * scale);
        
        // Fighter head
        ctx.fillStyle = '#DDBEA9';
        ctx.beginPath();
        ctx.arc(0, -4.2 * scale, 1 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Fighter helm
        ctx.fillStyle = '#696969';
        ctx.beginPath();
        ctx.arc(0, -4.5 * scale, 1.2 * scale, Math.PI, Math.PI * 2);
        ctx.fill();
        
        // Sword - animated swing
        ctx.save();
        ctx.rotate(swingAngle * direction);
        ctx.strokeStyle = '#C0C0C0';
        ctx.lineWidth = 0.6 * scale;
        ctx.beginPath();
        ctx.moveTo(0.8 * scale, -2 * scale);
        ctx.lineTo(1.5 * scale, -4 * scale);
        ctx.stroke();
        
        // Sword guard
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(0.5 * scale, -2.3 * scale, 0.6 * scale, 0.8 * scale);
        ctx.restore();
        
        // Arm holding sword
        ctx.fillStyle = bodyColor;
        ctx.fillRect(0.8 * scale - (0.3 * scale), -3 * scale, 0.8 * scale, 2.5 * scale);
        
        // Other arm
        ctx.fillRect(-1.2 * scale, -2.5 * scale - (stance * scale), 0.8 * scale, 2 * scale);
        
        ctx.restore();
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
            { x: centerX - 350, y: centerY + 45, size: 35 },
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
            { x: centerX - 400, y: centerY + 88, size: 36 },
            
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

        // Render trees with proper z-ordering (by Y position)
        treePositions.sort((a, b) => a.y - b.y);
        
        treePositions.forEach((treePos, index) => {
            // Generate a consistent seed for tree type variation based on position
            const gridX = Math.floor(treePos.x / 50);
            const gridY = Math.floor(treePos.y / 50);
            this.renderTree(ctx, treePos.x, treePos.y, treePos.size, gridX, gridY);
        });

    }

    renderSettlementDetails(ctx, centerX, centerY) {
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

        // Helper: paved strip between two points
        const drawPavedStrip = (p0, p1, width) => {
            const dx = p1.x - p0.x;
            const dy = p1.y - p0.y;
            const angle = Math.atan2(dy, dx);
            const hw = width * 0.5;
            const perpX = -Math.sin(angle) * hw;
            const perpY =  Math.cos(angle) * hw;

            const bx = Math.min(p0.x, p1.x) - hw;
            const by = Math.min(p0.y, p1.y) - hw;
            const bw = Math.abs(p1.x - p0.x) + hw * 2;
            const bh = Math.abs(p1.y - p0.y) + hw * 2;

            drawPaverRegion(() => {
                ctx.beginPath();
                ctx.moveTo(p0.x + perpX, p0.y + perpY);
                ctx.lineTo(p1.x + perpX, p1.y + perpY);
                ctx.lineTo(p1.x - perpX, p1.y - perpY);
                ctx.lineTo(p0.x - perpX, p0.y - perpY);
                ctx.closePath();
            }, bx, by, bw, bh, 0x9137);

            // Curbing edges matching the plaza ring style
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#c4b49a';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(p0.x + perpX, p0.y + perpY); ctx.lineTo(p1.x + perpX, p1.y + perpY); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(p0.x - perpX, p0.y - perpY); ctx.lineTo(p1.x - perpX, p1.y - perpY); ctx.stroke();
            ctx.strokeStyle = pathDark;
            ctx.lineWidth = 2;
            const opx = -Math.sin(angle) * (hw + 1.5);
            const opy =  Math.cos(angle) * (hw + 1.5);
            ctx.beginPath(); ctx.moveTo(p0.x + opx, p0.y + opy); ctx.lineTo(p1.x + opx, p1.y + opy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(p0.x - opx, p0.y - opy); ctx.lineTo(p1.x - opx, p1.y - opy); ctx.stroke();
        };

        // ── 1. PATHS FIRST — plaza is drawn on top so the join looks clean ─────

        // BRANCH 1: starts well inside plaza → Magic Academy (upper-left)
        // Starting point is inside the plaza ellipse (79×59) so the plaza paving caps it cleanly
        drawPavedStrip(
            { x: centerX - 52, y: centerY - 36 },
            { x: centerX - 130, y: centerY - 55 },
            26
        );

        // BRANCH 2: starts well inside plaza → Tower Forge (upper-right)
        drawPavedStrip(
            { x: centerX + 52, y: centerY - 36 },
            { x: centerX + 157, y: centerY - 50 },
            26
        );

        // SHORT SOUTH TRAIL — fades below the plaza toward the gate
        drawPavedStrip(
            { x: centerX, y: centerY + 55 },
            { x: centerX - 2, y: centerY + 105 },
            24
        );

        // ── 2. CENTRAL PLAZA on top — caps path ends with a clean edge ─────────
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

    renderSimpleTree(ctx, x, y, size, darkColor) {
        // Simple tree rendering - trunk and foliage
        const trunkWidth = size * 0.15;
        const trunkHeight = size * 0.35;
        
        // Trunk
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);
        
        // Shadow on trunk
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(x, y, trunkWidth * 0.5, trunkHeight);
        
        // Foliage - top layer
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.45);
        ctx.lineTo(x + size * 0.3, y - size * 0.05);
        ctx.lineTo(x - size * 0.3, y - size * 0.05);
        ctx.closePath();
        ctx.fill();
        
        // Foliage - middle layer
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.25);
        ctx.lineTo(x + size * 0.25, y + size * 0.1);
        ctx.lineTo(x - size * 0.25, y + size * 0.1);
        ctx.closePath();
        ctx.fill();
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
        ctx.globalAlpha = 0.8;
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px serif';
        ctx.fillStyle = '#d4af37';
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 2;
        ctx.fillText('SETTLEMENT', canvas.width / 2, 40);
        ctx.strokeText('SETTLEMENT', canvas.width / 2, 40);

        ctx.font = '16px serif';
        ctx.fillStyle = '#c9a876';
        ctx.fillText('Click buildings to interact', canvas.width / 2, 65);
        ctx.globalAlpha = 1;
    }

    // Tree rendering methods (from LevelBase.js)
    renderTreeType1(ctx, x, y, size) {
        const trunkWidth = size * 0.25;
        const trunkHeight = size * 0.5;
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(x, y, trunkWidth * 0.5, trunkHeight);
        ctx.fillStyle = '#0D3817';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.6);
        ctx.lineTo(x + size * 0.35, y - size * 0.1);
        ctx.lineTo(x - size * 0.35, y - size * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.35);
        ctx.lineTo(x + size * 0.3, y + size * 0.05);
        ctx.lineTo(x - size * 0.3, y + size * 0.05);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.15);
        ctx.lineTo(x + size * 0.25, y + size * 0.2);
        ctx.lineTo(x - size * 0.25, y + size * 0.2);
        ctx.closePath();
        ctx.fill();
    }

    renderTreeType2(ctx, x, y, size) {
        const trunkWidth = size * 0.2;
        const trunkHeight = size * 0.4;
        ctx.fillStyle = '#6B4423';
        ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);
        ctx.fillStyle = '#8B5A3C';
        ctx.fillRect(x - trunkWidth * 0.5 + trunkWidth * 0.6, y, trunkWidth * 0.4, trunkHeight);
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.35, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#43A047';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.55, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    renderTreeType3(ctx, x, y, size) {
        const trunkWidth = size * 0.22;
        ctx.fillStyle = '#795548';
        ctx.fillRect(x - trunkWidth * 0.5, y - size * 0.2, trunkWidth, size * 0.6);
        ctx.fillStyle = '#4E342E';
        ctx.beginPath();
        ctx.arc(x + trunkWidth * 0.25, y, trunkWidth * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.arc(x - size * 0.28, y - size * 0.35, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + size * 0.28, y - size * 0.3, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.55, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    renderTreeType4(ctx, x, y, size) {
        const trunkWidth = size * 0.18;
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - trunkWidth * 0.5, y - size * 0.05, trunkWidth, size * 0.45);
        ctx.fillStyle = '#0D3817';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.05);
        ctx.lineTo(x + size * 0.38, y + size * 0.15);
        ctx.lineTo(x - size * 0.38, y + size * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.25);
        ctx.lineTo(x + size * 0.3, y);
        ctx.lineTo(x - size * 0.3, y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.45);
        ctx.lineTo(x + size * 0.2, y - size * 0.15);
        ctx.lineTo(x - size * 0.2, y - size * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#43A047';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.6);
        ctx.lineTo(x + size * 0.12, y - size * 0.45);
        ctx.lineTo(x - size * 0.12, y - size * 0.45);
        ctx.closePath();
        ctx.fill();
    }

    renderTree(ctx, x, y, size, gridX, gridY) {
        const seed = Math.floor(gridX + gridY) % 4;
        switch(seed) {
            case 0:
                this.renderTreeType1(ctx, x, y, size);
                break;
            case 1:
                this.renderTreeType2(ctx, x, y, size);
                break;
            case 2:
                this.renderTreeType3(ctx, x, y, size);
                break;
            default:
                this.renderTreeType4(ctx, x, y, size);
        }
    }
}

/**
 * Upgrades Menu Popup
 * Allows player to view and unlock tower/building upgrades
 */
class UpgradesMenu {
    constructor(stateManager, settlementHub) {
        this.stateManager = stateManager;
        this.settlementHub = settlementHub;
        this.isOpen = false;
        this.animationProgress = 0;
        this.activeTab = 'buy'; // 'buy' or 'sell'
        this.currentPage = 0;
        this.clickLock = false; // Prevent double-clicks on items
        this.lastPaginationClickTime = 0; // Prevent double-click pagination
        this.lastConsumableCheckTime = 0; // Track last time we checked for marketplace changes
        this.openTime = 0; // Track when menu was opened to prevent click-through
        // Get player gold from stateManager (persistent between levels)
        this.playerGold = stateManager.playerGold || 0;
        
        // Visual effects
        this.floatingGoldEffects = []; // For gold coin splashes on sell
        this.glowEffects = []; // For glow effects on buy
        this.errorEffects = []; // For "Not Enough Gold" error messages
        
        // Initialize marketplace system if not already done
        if (!this.stateManager.marketplaceSystem) {
            this.stateManager.marketplaceSystem = new MarketplaceSystem();
        }
        
        // Initialize item error effects tracking
        this.itemErrorEffects = [];
        this.goldDisplayX = 0;
        this.goldDisplayY = 0;
        
        // Category system for buy tab - now includes upgrades as a category
        this.allBuyItems = this.buildBuyItems();
        this.buyCategories = [
            { label: 'ALL', id: 'all', hovered: false },
            { label: 'BUILDINGS', id: 'building', hovered: false },
            { label: 'CONSUMABLES', id: 'consumable', hovered: false },
            { label: 'INTEL', id: 'intel', hovered: false },
            { label: 'MUSIC', id: 'music', hovered: false },
            { label: 'UPGRADES', id: 'upgrade', hovered: false }
        ];
        this.activeBuyCategory = 'all';
        this.buyItems = this.filterBuyItemsByCategory('all');
        
        // Build all tabs
        this.sellItems = []; // Will be populated dynamically

        // Upgrade scroll state - track scroll position for each upgrade tile on hover
        this.scrollableTiles = new Map(); // Maps item.id to { scrollOffset: 0, maxScroll: 0 }
        
        this.closeButtonHovered = false;
        this.leftArrowHovered = false;
        this.rightArrowHovered = false;
        this.tabButtons = [
            { label: 'BUY', action: 'buy', hovered: false },
            { label: 'SELL', action: 'sell', hovered: false }
        ];
    }

    buildBuyItems() {
        const upgradeSystem = this.stateManager.upgradeSystem || { hasUpgrade: () => false };
        const marketplaceSystem = this.stateManager.marketplaceSystem || { hasUsedConsumable: () => false, isBoonActive: () => false, getConsumableCount: () => 0 };
        const unlockedCampaigns = this.stateManager.currentSaveData?.unlockedCampaigns || ['campaign-1', 'campaign-5'];
        
        const items = [];
        
        // Helper: get the name of the campaign that must be completed to unlock a required campaign id
        const getUnlockPrereqName = (reqId) => {
            const chain = CampaignRegistry.UNLOCK_CHAIN;
            const prereqId = Object.keys(chain).find(k => chain[k] === reqId);
            if (prereqId) {
                const camp = CampaignRegistry.getCampaign(prereqId);
                return camp ? camp.name : 'a previous campaign';
            }
            return 'a previous campaign';
        };
        
        // Add marketplace items from registry
        const allItems = MarketplaceRegistry.getAllItemIds();
        
        for (const itemId of allItems) {
            const itemData = MarketplaceRegistry.getItem(itemId);
            if (!itemData) continue;
            
            let canPurchase = MarketplaceRegistry.canPurchase(itemId, upgradeSystem, marketplaceSystem);
            let requirementMsg = MarketplaceRegistry.getRequirementMessage(itemId, upgradeSystem, marketplaceSystem);
            
            // Check campaign requirement — hide the item entirely if not yet unlocked
            if (itemData.campaignRequirement && !unlockedCampaigns.includes(itemData.campaignRequirement)) {
                continue;
            }

            // Hide items whose upgrade prerequisites are not yet met
            if (itemData.requirements && itemData.requirements.length > 0) {
                const unmet = itemData.requirements.some(req => !upgradeSystem.hasUpgrade(req));
                if (unmet) continue;
            }
            
            // Special check: if it's a music item and player already has it, mark as unavailable
            // Music items should only be purchased once
            if (itemData.category === 'music' && marketplaceSystem.getConsumableCount(itemId) > 0) {
                canPurchase = false;
                requirementMsg = 'Item already owned';
            }
            
            // Special check: if it's an Intel item and player already has it, mark as unavailable
            // Intel items are one-time purchases like music
            if (itemData.category === 'intel' && marketplaceSystem.unlockedEnemyIntel && marketplaceSystem.unlockedEnemyIntel.has(itemId)) {
                canPurchase = false;
                requirementMsg = 'Unlocked';
            }
            
            // Special check: Consumables (forge-materials, magic-tower-flatpack, training-materials, etc.)
            // are stackable but should be greyed out when player already owns one (until it's consumed at level end)
            if (itemData.type === 'consumable' && itemData.category !== 'music' && itemData.category !== 'intel' && marketplaceSystem.getConsumableCount(itemId) > 0) {
                canPurchase = false;
                requirementMsg = 'Item already owned';
            }
            
            // Special check: if it's the Frog King's Bane (boon type), prevent re-purchase
            // Boons are one-time purchases like music and intel
            if (itemId === 'frog-king-bane' && marketplaceSystem.getConsumableCount('frog-king-bane') > 0) {
                canPurchase = false;
                requirementMsg = 'Item already owned';
            }
            
            // Combine loot and boon into consumable category
            // Also move building-type consumables (forge materials, flatpacks, etc.) to consumable tab
            let category = itemData.category;
            if (category === 'loot' || category === 'boon') {
                category = 'consumable';
            } else if (category === 'building' && itemData.type === 'consumable') {
                category = 'consumable';
            }
            
            items.push({
                id: itemId,
                name: itemData.name,
                description: itemData.description,
                cost: itemData.cost,
                drawIcon: itemData.drawIcon,
                category: category,
                type: itemData.type,
                effect: itemData.effect,
                hovered: false,
                canPurchase: canPurchase,
                requirementMsg: requirementMsg
            });
        }
        
        // Add upgrades as items with 'upgrade' category
        const upgradeData = [
            {
                id: 'training-gear',
                name: 'Training Gear',
                description: 'Unlocks the ability to build Training Grounds in levels',
                cost: 500,
                drawIcon(ctx, cx, cy, size) {
                    ctx.save();
                    [[-1, 1], [1, -1]].forEach(([dx]) => {
                        ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 4 * dx);
                        ctx.beginPath();
                        ctx.moveTo(0, -size * 0.38); ctx.lineTo(size * 0.045, -size * 0.1); ctx.lineTo(-size * 0.045, -size * 0.1); ctx.closePath();
                        const sg = ctx.createLinearGradient(-size * 0.045, 0, size * 0.045, 0);
                        sg.addColorStop(0, '#888'); sg.addColorStop(0.5, '#eee'); sg.addColorStop(1, '#666');
                        ctx.fillStyle = sg; ctx.fill(); ctx.strokeStyle = '#444'; ctx.lineWidth = 0.8; ctx.stroke();
                        const gg = ctx.createLinearGradient(-size * 0.14, cy - size * 0.08, size * 0.14, cy);
                        gg.addColorStop(0, '#B8860B'); gg.addColorStop(1, '#8B5E0A');
                        ctx.fillStyle = gg; ctx.fillRect(-size * 0.14, -size * 0.08, size * 0.28, size * 0.06);
                        ctx.strokeStyle = '#5A3808'; ctx.lineWidth = 0.8; ctx.strokeRect(-size * 0.14, -size * 0.08, size * 0.28, size * 0.06);
                        ctx.fillStyle = '#5c3d1f'; ctx.fillRect(-size * 0.04, -size * 0.02, size * 0.08, size * 0.24);
                        ctx.restore();
                    });
                    ctx.restore();
                },
                category: 'building'
            },
            {
                id: 'musical-equipment',
                name: 'Musical Equipment',
                description: 'Places a Bard on the settlement square who plays your unlocked music when clicked',
                cost: 300,
                drawIcon(ctx, cx, cy, size) {
                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.rotate(Math.PI / 5.5);
                    // Lute body
                    ctx.beginPath();
                    ctx.ellipse(0, size * 0.08, size * 0.18, size * 0.24, 0, 0, Math.PI * 2);
                    ctx.fillStyle = '#8B5A1A'; ctx.fill();
                    ctx.strokeStyle = '#5A3008'; ctx.lineWidth = 1; ctx.stroke();
                    // Lute neck
                    ctx.fillStyle = '#A0722A';
                    ctx.fillRect(-size * 0.04, -size * 0.38, size * 0.08, size * 0.34);
                    ctx.strokeStyle = '#5A3008'; ctx.lineWidth = 0.8;
                    ctx.strokeRect(-size * 0.04, -size * 0.38, size * 0.08, size * 0.34);
                    // String
                    ctx.strokeStyle = '#D4D4D4'; ctx.lineWidth = 0.7;
                    ctx.beginPath(); ctx.moveTo(0, -size * 0.36); ctx.lineTo(0, size * 0.28); ctx.stroke();
                    // Music note floating
                    ctx.fillStyle = '#FFD700';
                    ctx.beginPath(); ctx.arc(size * 0.28, -size * 0.24, size * 0.08, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 1.2;
                    ctx.beginPath(); ctx.moveTo(size * 0.355, -size * 0.24); ctx.lineTo(size * 0.355, -size * 0.44); ctx.stroke();
                    ctx.restore();
                },
                category: 'upgrade'
            },
            {
                id: 'wooden-chest',
                name: 'Wooden Chest',
                description: 'Increase starting gold by 100',
                cost: 250,
                drawIcon(ctx, cx, cy, size) {
                    ctx.save();
                    const w = size * 0.78, h = size * 0.58;
                    const bx = cx - w / 2, by = cy - h * 0.4;
                    const bg = ctx.createLinearGradient(cx, by + h * 0.32, cx, by + h);
                    bg.addColorStop(0, '#a07040'); bg.addColorStop(1, '#5c3010');
                    ctx.fillStyle = bg; ctx.fillRect(bx, by + h * 0.32, w, h * 0.68);
                    ctx.strokeStyle = '#3a1e08'; ctx.lineWidth = 1.5; ctx.strokeRect(bx, by + h * 0.32, w, h * 0.68);
                    const lg = ctx.createLinearGradient(cx, by, cx, by + h * 0.34);
                    lg.addColorStop(0, '#c08850'); lg.addColorStop(1, '#7a4a20');
                    ctx.fillStyle = lg; ctx.fillRect(bx, by, w, h * 0.34); ctx.strokeStyle = '#3a1e08'; ctx.lineWidth = 1.5; ctx.strokeRect(bx, by, w, h * 0.34);
                    ctx.beginPath(); ctx.moveTo(bx, by + h * 0.34); ctx.quadraticCurveTo(cx, by - h * 0.08, bx + w, by + h * 0.34);
                    ctx.closePath(); ctx.fillStyle = lg; ctx.fill(); ctx.strokeStyle = '#3a1e08'; ctx.lineWidth = 1; ctx.stroke();
                    ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 1.2;
                    ctx.beginPath(); ctx.moveTo(bx + w * 0.25, by + h * 0.34); ctx.lineTo(bx + w * 0.25, by + h); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(bx + w * 0.75, by + h * 0.34); ctx.lineTo(bx + w * 0.75, by + h); ctx.stroke();
                    ctx.beginPath(); ctx.arc(cx, by + h * 0.32, size * 0.065, 0, Math.PI * 2);
                    ctx.fillStyle = '#D4A020'; ctx.fill(); ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 0.8; ctx.stroke();
                    ctx.restore();
                },
                category: 'upgrade',
                campaignRequirement: 'campaign-1'
            },
            {
                id: 'golden-chest',
                name: 'Golden Chest',
                description: 'Increase starting gold by another 100',
                cost: 400,
                drawIcon(ctx, cx, cy, size) {
                    ctx.save();
                    const coinR = size * 0.22, coinH = size * 0.07;
                    for (let i = 2; i >= 0; i--) {
                        const oy = i * coinH * 1.5;
                        const baseY = cy + size * 0.14 - oy;
                        const eg = ctx.createLinearGradient(cx, baseY, cx, baseY + coinH);
                        eg.addColorStop(0, '#E09000'); eg.addColorStop(1, '#A06000');
                        ctx.fillStyle = eg;
                        ctx.beginPath(); ctx.ellipse(cx, baseY + coinH * 0.5, coinR, coinH * 0.4, 0, 0, Math.PI * 2); ctx.fill();
                        const fg = ctx.createRadialGradient(cx - coinR * 0.25, baseY - coinH * 0.2, coinR * 0.05, cx, baseY, coinR);
                        fg.addColorStop(0, '#FFE060'); fg.addColorStop(0.5, '#E09000'); fg.addColorStop(1, '#A06000');
                        ctx.beginPath(); ctx.ellipse(cx, baseY, coinR, coinR * 0.38, 0, 0, Math.PI * 2);
                        ctx.fillStyle = fg; ctx.fill(); ctx.strokeStyle = '#7A4800'; ctx.lineWidth = 1; ctx.stroke();
                        if (i === 0) {
                            ctx.beginPath(); ctx.ellipse(cx, baseY, coinR * 0.68, coinR * 0.26, 0, 0, Math.PI * 2);
                            ctx.strokeStyle = 'rgba(122,72,0,0.4)'; ctx.lineWidth = 0.8; ctx.stroke();
                        }
                    }
                    ctx.restore();
                },
                category: 'upgrade',
                prerequisite: 'wooden-chest',
                campaignRequirement: 'campaign-2'
            },
            {
                id: 'platinum-chest',
                name: 'Platinum Chest',
                description: 'Increase starting gold by another 100',
                cost: 600,
                drawIcon(ctx, cx, cy, size) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - size * 0.46); ctx.lineTo(cx + size * 0.3, cy - size * 0.08);
                    ctx.lineTo(cx, cy + size * 0.46); ctx.lineTo(cx - size * 0.3, cy - size * 0.08); ctx.closePath();
                    const g = ctx.createLinearGradient(cx, cy - size * 0.46, cx, cy + size * 0.46);
                    g.addColorStop(0, '#E8E8FF'); g.addColorStop(0.35, '#A0A8D8'); g.addColorStop(1, '#5060A0');
                    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#3848A0'; ctx.lineWidth = 1.5; ctx.stroke();
                    ctx.strokeStyle = 'rgba(220,220,255,0.55)'; ctx.lineWidth = 0.8;
                    ctx.beginPath(); ctx.moveTo(cx, cy - size * 0.46); ctx.lineTo(cx + size * 0.3, cy - size * 0.08); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(cx, cy - size * 0.46); ctx.lineTo(cx - size * 0.3, cy - size * 0.08); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(cx + size * 0.3, cy - size * 0.08); ctx.lineTo(cx - size * 0.3, cy - size * 0.08); ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(cx - size * 0.1, cy - size * 0.38); ctx.lineTo(cx, cy - size * 0.2); ctx.lineTo(cx - size * 0.2, cy - size * 0.04);
                    ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,0.24)'; ctx.fill();
                    ctx.restore();
                },
                category: 'upgrade',
                prerequisite: 'golden-chest',
                campaignRequirement: 'campaign-3'
            },
            {
                id: 'diamond-pickaxe',
                name: 'Diamond Pickaxe',
                description: 'Increase gem mining chance in gold mines',
                cost: 800,
                drawIcon(ctx, cx, cy, size) {
                    ctx.save();
                    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-Math.PI / 4);
                    const hg = ctx.createLinearGradient(-size * 0.04, 0, size * 0.04, 0);
                    hg.addColorStop(0, '#5c3d1f'); hg.addColorStop(0.5, '#8B5E30'); hg.addColorStop(1, '#3a2410');
                    ctx.fillStyle = hg; ctx.fillRect(-size * 0.04, -size * 0.36, size * 0.08, size * 0.7);
                    ctx.strokeStyle = '#2a1800'; ctx.lineWidth = 0.8; ctx.strokeRect(-size * 0.04, -size * 0.36, size * 0.08, size * 0.7);
                    ctx.restore();
                    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-Math.PI / 4);
                    ctx.beginPath();
                    ctx.moveTo(0, -size * 0.34); ctx.lineTo(-size * 0.24, -size * 0.14);
                    ctx.lineTo(-size * 0.16, -size * 0.08); ctx.lineTo(-size * 0.02, -size * 0.2);
                    ctx.lineTo(size * 0.14, -size * 0.32); ctx.closePath();
                    const pg = ctx.createLinearGradient(-size * 0.24, 0, size * 0.14, 0);
                    pg.addColorStop(0, '#88CCFF'); pg.addColorStop(0.5, '#EEEEFF'); pg.addColorStop(1, '#5588CC');
                    ctx.fillStyle = pg; ctx.fill(); ctx.strokeStyle = '#2244AA'; ctx.lineWidth = 1; ctx.stroke();
                    ctx.restore();
                    ctx.restore();
                },
                category: 'upgrade',
                prerequisite: 'magic-academy-unlock'
            },
            {
                id: 'magic-academy-unlock',
                name: 'Academy Blueprints',
                description: 'Unlocks the ability to build the Magic Academy in levels',
                cost: 1500,
                drawIcon(ctx, cx, cy, size) {
                    ctx.save();
                    const sw = size * 0.58, sh = size * 0.68;
                    const sx = cx - sw / 2, sy = cy - sh / 2, rr = size * 0.08;
                    const sg = ctx.createLinearGradient(sx, sy, sx + sw, sy + sh);
                    sg.addColorStop(0, '#F5E6B8'); sg.addColorStop(1, '#D4B870');
                    ctx.fillStyle = sg;
                    ctx.beginPath();
                    ctx.moveTo(sx + rr, sy); ctx.lineTo(sx + sw - rr, sy);
                    ctx.arcTo(sx + sw, sy, sx + sw, sy + rr, rr); ctx.lineTo(sx + sw, sy + sh - rr);
                    ctx.arcTo(sx + sw, sy + sh, sx + sw - rr, sy + sh, rr); ctx.lineTo(sx + rr, sy + sh);
                    ctx.arcTo(sx, sy + sh, sx, sy + sh - rr, rr); ctx.lineTo(sx, sy + rr);
                    ctx.arcTo(sx, sy, sx + rr, sy, rr); ctx.closePath();
                    ctx.fill(); ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 1.5; ctx.stroke();
                    ctx.fillStyle = '#DDB858';
                    ctx.fillRect(sx - size * 0.04, sy, sw + size * 0.08, sh * 0.13);
                    ctx.fillRect(sx - size * 0.04, sy + sh - sh * 0.13, sw + size * 0.08, sh * 0.13);
                    ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 1;
                    ctx.strokeRect(sx - size * 0.04, sy, sw + size * 0.08, sh * 0.13);
                    ctx.strokeRect(sx - size * 0.04, sy + sh - sh * 0.13, sw + size * 0.08, sh * 0.13);
                    ctx.strokeStyle = 'rgba(100,70,20,0.5)'; ctx.lineWidth = 0.8;
                    for (let i = 0; i < 3; i++) {
                        const lineY = sy + sh * 0.23 + i * sh * 0.2;
                        ctx.beginPath(); ctx.moveTo(sx + size * 0.06, lineY); ctx.lineTo(sx + sw - size * 0.06, lineY); ctx.stroke();
                    }
                    ctx.restore();
                },
                category: 'building',
                campaignRequirement: 'campaign-2'
            },
            {
                id: 'superweapon-lab-unlock',
                name: 'Super Weapon Lab Plans',
                description: 'Unlocks the ability to build the Super Weapon Lab in levels',
                cost: 2500,
                drawIcon(ctx, cx, cy, size) {
                    ctx.save();
                    const fx = cx - size * 0.14, fy = cy - size * 0.4, fw = size * 0.28;
                    ctx.beginPath();
                    ctx.moveTo(fx, fy); ctx.lineTo(fx + fw, fy);
                    ctx.lineTo(fx + fw, fy + size * 0.3);
                    ctx.lineTo(fx + fw + size * 0.22, fy + size * 0.86);
                    ctx.lineTo(fx - size * 0.22, fy + size * 0.86);
                    ctx.lineTo(fx, fy + size * 0.3); ctx.closePath();
                    const bg = ctx.createLinearGradient(cx, fy, cx, fy + size * 0.86);
                    bg.addColorStop(0, 'rgba(180,200,220,0.9)'); bg.addColorStop(0.4, 'rgba(100,180,220,0.7)'); bg.addColorStop(1, 'rgba(50,100,180,0.9)');
                    ctx.fillStyle = bg; ctx.fill(); ctx.strokeStyle = '#3060A0'; ctx.lineWidth = 1.5; ctx.stroke();
                    const liqY = fy + size * 0.5;
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(fx, fy); ctx.lineTo(fx + fw, fy); ctx.lineTo(fx + fw, fy + size * 0.3);
                    ctx.lineTo(fx + fw + size * 0.22, fy + size * 0.86); ctx.lineTo(fx - size * 0.22, fy + size * 0.86);
                    ctx.lineTo(fx, fy + size * 0.3); ctx.closePath(); ctx.clip();
                    ctx.fillStyle = 'rgba(100,210,100,0.65)';
                    ctx.fillRect(cx - size * 0.5, liqY, size, size * 0.5);
                    ctx.restore();
                    ctx.fillStyle = 'rgba(200,255,200,0.7)';
                    [[cx - size * 0.04, liqY + size * 0.06], [cx + size * 0.08, liqY + size * 0.16], [cx, liqY + size * 0.28]].forEach(([bx, by]) => {
                        ctx.beginPath(); ctx.arc(bx, by, size * 0.03, 0, Math.PI * 2); ctx.fill();
                    });
                    ctx.restore();
                },
                category: 'building',
                campaignRequirement: 'campaign-3'
            }
        ];
        
        for (const upgrade of upgradeData) {
            const isPurchased = upgradeSystem.hasUpgrade(upgrade.id);
            let canPurchase = !isPurchased;
            let requirementMsg = null;
            
            // Check prerequisites — hide upgrade entirely if prerequisite not yet met
            if (!isPurchased && upgrade.prerequisite && !upgradeSystem.hasUpgrade(upgrade.prerequisite)) {
                continue;
            }
            
            // Check campaign requirement — hide the upgrade entirely if not yet unlocked
            if (!isPurchased && upgrade.campaignRequirement && !unlockedCampaigns.includes(upgrade.campaignRequirement)) {
                continue;
            }
            
            // If already purchased, set requirement message to "Purchased"
            if (isPurchased) {
                requirementMsg = 'Purchased';
            }
            
            items.push({
                id: upgrade.id,
                name: upgrade.name,
                description: upgrade.description,
                cost: upgrade.cost,
                drawIcon: upgrade.drawIcon,
                category: upgrade.category,
                type: 'upgrade',
                hovered: false,
                isPurchased: isPurchased,
                canPurchase: canPurchase,
                requirementMsg: requirementMsg
            });
        }
        
        return items;
    }

    filterBuyItemsByCategory(categoryId) {
        if (categoryId === 'all') {
            return this.allBuyItems;
        }
        return this.allBuyItems.filter(item => item.category === categoryId);
    }
    buildSellItems() {
        const items = [];
        const inventory = this.stateManager.playerInventory || [];
        
        
        // Create items from inventory
        for (const inventoryItem of inventory) {
            const lootInfo = this.getLootInfo(inventoryItem.lootId);
            if (!lootInfo) {
                console.warn('Could not find loot info for lootId:', inventoryItem.lootId);
                continue;
            }
            items.push({
                id: inventoryItem.lootId,
                name: lootInfo.name,
                description: lootInfo.description || `A valuable treasure. Sell for ${lootInfo.sellValue} gold.`,
                sellPrice: lootInfo.sellValue,
                drawIcon: lootInfo.drawIcon,
                rarity: lootInfo.rarity,
                lootId: inventoryItem.lootId,
                count: inventoryItem.count || 1,
                hovered: false
            });
        }
        
        return items;
    }

    getLootInfo(lootId) {
        // Use LootRegistry for authoritative loot data
        const lootInfo = LootRegistry.getLootType(lootId);
        if (lootInfo) {
            return {
                name: lootInfo.name,
                description: lootInfo.description || `A ${lootInfo.rarity || 'common'} treasure from fallen enemies.`,
                sellValue: lootInfo.sellValue,
                drawIcon: lootInfo.drawIcon,
                rarity: lootInfo.rarity
            };
        }
        
        // Fallback for any items not in registry
        console.warn('Loot not found in registry:', lootId);
        return { 
            name: 'Unknown Item', 
            sellValue: 0,
            rarity: 'common'
        };
    }

    open() {
        this.isOpen = true;
        this.animationProgress = 0;
        this.activeTab = 'buy';
        this.currentPage = 0;
        this.activeBuyCategory = 'all';
        this.openTime = Date.now(); // Record when menu was opened
        
        // Refresh player gold from stateManager (in case it changed)
        this.playerGold = this.stateManager.playerGold || 0;
        
        // Force immediate refresh of buy/sell items
        this.lastConsumableCheckTime = 0;
        
        // Rebuild buy items to reflect current state
        this.allBuyItems = this.buildBuyItems();
        this.buyItems = this.filterBuyItemsByCategory('all');
        
        // Refresh sell items when opening
        this.sellItems = this.buildSellItems();
    }

    close() {
        this.isOpen = false;
        // Clear effects
        this.floatingGoldEffects = [];
        this.glowEffects = [];
        this.errorEffects = [];
        // Reset scroll states for upgrade tiles
        this.scrollableTiles.clear();
        this.settlementHub.closePopup();
    }

    update(deltaTime) {
        if (this.isOpen && this.animationProgress < 1) {
            this.animationProgress += deltaTime * 2;
        }
        
        // Update visual effects
        this.updateEffects(deltaTime);
        
        // Periodically check if marketplace consumables have changed (e.g., magic flatpack was used)
        // This ensures the panel always shows the current state
        if (!this.lastConsumableCheckTime) {
            this.lastConsumableCheckTime = 0;
        }
        const now = Date.now();
        if (this.isOpen && (now - this.lastConsumableCheckTime) > 500) { // Check every 500ms
            this.lastConsumableCheckTime = now;
            // Preserve hover states before rebuilding
            const oldBuyItems = this.buyItems;
            const hoverStateMap = new Map();
            if (oldBuyItems) {
                oldBuyItems.forEach(item => {
                    if (item.hovered) {
                        hoverStateMap.set(item.id, true);
                    }
                });
            }
            
            // Rebuild items to reflect any changes in marketplace consumables
            this.allBuyItems = this.buildBuyItems();
            this.buyItems = this.filterBuyItemsByCategory(this.activeBuyCategory);
            
            // Restore hover states
            this.buyItems.forEach(item => {
                item.hovered = hoverStateMap.has(item.id);
            });
        }
    }

    wrapText(text, maxCharsPerLine) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        for (const word of words) {
            if ((currentLine + word).length <= maxCharsPerLine) {
                currentLine += (currentLine ? ' ' : '') + word;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines;
    }

    /**
     * Draw decorative golden corner trim on panel corners
     */
    drawCornerTrim(ctx, x, y, size = 20, isTopLeft = true, isTopRight = false, isBottomLeft = false, isBottomRight = false) {
        const cornerSize = size;
        
        // Draw corner rectangle with golden color
        ctx.fillStyle = '#d4af37';
        
        if (isTopLeft) {
            ctx.fillRect(x, y, cornerSize, 3);
            ctx.fillRect(x, y, 3, cornerSize);
        } else if (isTopRight) {
            ctx.fillRect(x - cornerSize, y, cornerSize, 3);
            ctx.fillRect(x - 3, y, 3, cornerSize);
        } else if (isBottomLeft) {
            ctx.fillRect(x, y - 3, cornerSize, 3);
            ctx.fillRect(x, y - cornerSize, 3, cornerSize);
        } else if (isBottomRight) {
            ctx.fillRect(x - cornerSize, y - 3, cornerSize, 3);
            ctx.fillRect(x - 3, y - cornerSize, 3, cornerSize);
        }
        
        // Add a small decorative gem/circle in each corner
        ctx.fillStyle = '#ffd700';
        const gemSize = 5;
        if (isTopLeft) {
            ctx.beginPath();
            ctx.arc(x + gemSize, y + gemSize, gemSize / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (isTopRight) {
            ctx.beginPath();
            ctx.arc(x - gemSize, y + gemSize, gemSize / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (isBottomLeft) {
            ctx.beginPath();
            ctx.arc(x + gemSize, y - gemSize, gemSize / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (isBottomRight) {
            ctx.beginPath();
            ctx.arc(x - gemSize, y - gemSize, gemSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    getMaxPages() {
        if (this.activeTab === 'buy') {
            return Math.ceil(this.buyItems.length / 6); // Dynamic pages based on buy items
        } else if (this.activeTab === 'sell') {
            return Math.ceil(this.sellItems.length / 6);
        }
        return 1;
    }

    getItemsForCurrentPage() {
        const itemsPerPage = 6;
        const startIdx = this.currentPage * itemsPerPage;
        
        if (this.activeTab === 'buy') {
            return this.buyItems.slice(startIdx, startIdx + itemsPerPage);
        } else if (this.activeTab === 'sell') {
            return this.sellItems.slice(startIdx, startIdx + itemsPerPage);
        }
        return [];
    }

    updateHoverState(x, y) {
        const canvas = this.stateManager.canvas;
        const baseWidth = canvas.width - 80;
        const baseHeight = canvas.height - 60;
        const panelWidth = Math.min(baseWidth * 0.85, 1200);
        const panelHeight = Math.min(baseHeight * 0.85, 700);
        const panelX = (canvas.width - panelWidth) / 2;
        const panelY = (canvas.height - panelHeight) / 2;
        
        const tabY = panelY + 42;
        const tabHeight = 32;
        const tabWidth = (panelWidth - 40) / 2;
        const tabGap = 0;
        
        // Check tab buttons
        this.tabButtons.forEach((tab, index) => {
            const tabX = panelX + 20 + index * (tabWidth + tabGap);
            tab.hovered = x >= tabX && x <= tabX + tabWidth && y >= tabY && y <= tabY + tabHeight;
        });
        
        // Check category filter buttons (only visible in buy tab)
        if (this.activeTab === 'buy') {
            const categoryY = panelY + 74;
            const categoryHeight = 25;
            const categoryButtonWidth = (panelWidth - 40) / this.buyCategories.length;
            
            this.buyCategories.forEach((category, index) => {
                const categoryX = panelX + 20 + index * categoryButtonWidth;
                category.hovered = x >= categoryX && x <= categoryX + categoryButtonWidth && 
                                 y >= categoryY && y <= categoryY + categoryHeight;
            });
        }
        
        // Check close button
        const closeX = panelX + panelWidth - 40;
        const closeY = panelY + 12;
        this.closeButtonHovered = x >= closeX && x <= closeX + 25 && y >= closeY && y <= closeY + 25;
        
        // Check arrow buttons
        const arrowY = panelY + panelHeight - 45;
        const arrowSize = 25;
        const leftArrowX = panelX + 20;
        const rightArrowX = panelX + panelWidth - 45;
        this.leftArrowHovered = x >= leftArrowX && x <= leftArrowX + arrowSize && y >= arrowY && y <= arrowY + arrowSize;
        this.rightArrowHovered = x >= rightArrowX && x <= rightArrowX + arrowSize && y >= arrowY && y <= arrowY + arrowSize;
        
        // Check item buttons (for sell and upgrade tabs)
        const contentY = panelY + 78 + (this.activeTab === 'buy' ? 30 : 0);
        const contentHeight = panelHeight - 140 - (this.activeTab === 'buy' ? 30 : 0);
        
        const horizontalPadding = 20;
        const verticalPadding = 15;
        const gridSpacing = 10;
        
        const availableWidth = panelWidth - (horizontalPadding * 2);
        const availableHeight = contentHeight - (verticalPadding * 2);
        
        const itemWidth = (availableWidth - (gridSpacing * 2)) / 3;
        const itemHeight = (availableHeight - gridSpacing) / 2;
        
        const itemsGridStartX = panelX + horizontalPadding;
        const itemsGridStartY = contentY + verticalPadding;
        
        const items = this.getItemsForCurrentPage();
        items.forEach((item, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            const itemX = itemsGridStartX + col * (itemWidth + gridSpacing);
            const itemY = itemsGridStartY + row * (itemHeight + gridSpacing);
            item.hovered = x >= itemX && x <= itemX + itemWidth && y >= itemY && y <= itemY + itemHeight;
        });
        
        this.stateManager.canvas.style.cursor = 
            (this.tabButtons.some(t => t.hovered) || 
             this.buyCategories.some(c => c.hovered) ||
             this.closeButtonHovered || this.leftArrowHovered || this.rightArrowHovered || items.some(i => i.hovered))
            ? 'pointer' : 'default';
    }

    handleClick(x, y) {
        // Prevent registering clicks for 200ms after opening to avoid click-through
        const timeSinceOpen = Date.now() - this.openTime;
        if (timeSinceOpen < 200) {
            return;
        }
        
        const canvas = this.stateManager.canvas;
        const baseWidth = canvas.width - 80;
        const baseHeight = canvas.height - 60;
        const panelWidth = Math.min(baseWidth * 0.85, 1200);
        const panelHeight = Math.min(baseHeight * 0.85, 700);
        const panelX = (canvas.width - panelWidth) / 2;
        const panelY = (canvas.height - panelHeight) / 2;
        
        // Check close button
        const closeX = panelX + panelWidth - 40;
        const closeY = panelY + 12;
        if (x >= closeX && x <= closeX + 25 && y >= closeY && y <= closeY + 25) {
            this.close();
            return;
        }
        
        // Check tab buttons
        const tabY = panelY + 42;
        const tabHeight = 32;
        const tabWidth = (panelWidth - 40) / 2;
        const tabGap = 0;
        
        this.tabButtons.forEach((tab, index) => {
            const tabX = panelX + 20 + index * (tabWidth + tabGap);
            if (x >= tabX && x <= tabX + tabWidth && y >= tabY && y <= tabY + tabHeight) {
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
                this.activeTab = tab.action;
                this.currentPage = 0;
                this.activeBuyCategory = 'all'; // Reset category filter when switching tabs
                
                // Refresh sell items when switching to sell tab
                if (tab.action === 'sell') {
                    this.sellItems = this.buildSellItems();
                }
            }
        });
        
        // Check category filter buttons (only visible in buy tab)
        if (this.activeTab === 'buy') {
            const categoryY = tabY + tabHeight + 10;
            const categoryHeight = 25;
            const categoryButtonWidth = (panelWidth - 40) / this.buyCategories.length;
            
            this.buyCategories.forEach((category, index) => {
                const categoryX = panelX + 20 + index * categoryButtonWidth;
                if (x >= categoryX && x <= categoryX + categoryButtonWidth && 
                    y >= categoryY && y <= categoryY + categoryHeight) {
                    if (this.stateManager.audioManager) {
                        this.stateManager.audioManager.playSFX('button-click');
                    }
                    this.activeBuyCategory = category.id;
                    this.buyItems = this.filterBuyItemsByCategory(category.id);
                    this.currentPage = 0;
                }
            });
        }
        
        // Check arrow buttons
        const arrowY = panelY + panelHeight - 45;
        const arrowSize = 25;
        const leftArrowX = panelX + 20;
        const rightArrowX = panelX + panelWidth - 45;
        const maxPages = this.getMaxPages();
        
        // Prevent double-click by checking time since last click
        const now = Date.now();
        const debounceTime = 200; // milliseconds
        
        if (x >= leftArrowX && x <= leftArrowX + arrowSize && y >= arrowY && y <= arrowY + arrowSize) {
            if (this.currentPage > 0 && (now - this.lastPaginationClickTime) > debounceTime) {
                this.currentPage--;
                this.lastPaginationClickTime = now;
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
            }
            return;
        }
        
        if (x >= rightArrowX && x <= rightArrowX + arrowSize && y >= arrowY && y <= arrowY + arrowSize) {
            if (this.currentPage < maxPages - 1 && (now - this.lastPaginationClickTime) > debounceTime) {
                this.currentPage++;
                this.lastPaginationClickTime = now;
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
            }
            return;
        }
        
        // Check item buttons
        const contentY = panelY + 78 + (this.activeTab === 'buy' ? 30 : 0);
        const contentHeight = panelHeight - 140 - (this.activeTab === 'buy' ? 30 : 0);
        
        const horizontalPadding = 20;
        const verticalPadding = 15;
        const gridSpacing = 10;
        
        const availableWidth = panelWidth - (horizontalPadding * 2);
        const availableHeight = contentHeight - (verticalPadding * 2);
        
        const itemWidth = (availableWidth - (gridSpacing * 2)) / 3;
        const itemHeight = (availableHeight - gridSpacing) / 2;
        
        const itemsGridStartX = panelX + horizontalPadding;
        const itemsGridStartY = contentY + verticalPadding;
        
        const items = this.getItemsForCurrentPage();
        items.forEach((item, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            const itemX = itemsGridStartX + col * (itemWidth + gridSpacing);
            const itemY = itemsGridStartY + row * (itemHeight + gridSpacing);
            
            // Check if click is within button bounds (not entire item)
            const buttonWidth = itemWidth - 14;
            const buttonHeight = 24;
            const buttonX = itemX + 7;
            const buttonY = itemY + itemHeight - 32;
            
            if (x >= buttonX && x <= buttonX + buttonWidth && y >= buttonY && y <= buttonY + buttonHeight) {
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
                this.handleItemAction(item, itemX + itemWidth / 2, itemY + itemHeight / 2);
            }
        });
    }

    handleItemAction(item, itemCenterX, itemCenterY) {
        // Prevent rapid double-clicks
        if (this.clickLock) {
            return;
        }
        this.clickLock = true;
        setTimeout(() => { this.clickLock = false; }, 100); // 100ms debounce
        
        if (this.activeTab === 'buy') {
            // Handle both marketplace items and upgrades (upgrades are now a category in buy tab)
            if (!item.canPurchase) {
                // Show error message centered in the item panel
                if (item.requirementMsg) {
                    this.createItemErrorEffect(item.requirementMsg, itemCenterX, itemCenterY);
                }
                return;
            }
            
            if (this.playerGold < item.cost) {
                // Show "Not Enough Gold" error centered in the item panel
                this.createItemErrorEffect('Not Enough Gold', itemCenterX, itemCenterY);
                return;
            }
            
            // Deduct gold
            this.playerGold -= item.cost;
            this.stateManager.playerGold = this.playerGold;
            
            // Create glow effect with gold amount at player gold display location
            this.createGlowEffect(item.cost, this.goldDisplayX, this.goldDisplayY);
            
            // Handle upgrades separately from marketplace items
            if (item.type === 'upgrade') {
                // Purchase upgrade to upgrade system
                this.stateManager.upgradeSystem.purchaseUpgrade(item.id);
                
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('upgrade');
                }
            } else {
                // Purchase marketplace item
                this.stateManager.marketplaceSystem.addConsumable(item.id, 1);
                
                // Handle Intel pack purchases - unlock corresponding enemy intel
                if (item.category === 'intel') {
                    this.stateManager.marketplaceSystem.unlockEnemyIntel(item.id);
                }
                
                
                if (this.stateManager.audioManager) {
                    // Use upgrade sound for buying in marketplace
                    this.stateManager.audioManager.playSFX('upgrade');
                }
            }
            
            // Update statistics when buying
            if (this.stateManager.gameStatistics) {
                this.stateManager.gameStatistics.totalMoneySpentOnMarketplace += item.cost;
            }
            
            // Rebuild buy items to reflect purchase restrictions and active status
            this.allBuyItems = this.buildBuyItems();
            this.buyItems = this.filterBuyItemsByCategory(this.activeBuyCategory);
        } else if (this.activeTab === 'sell') {
            // Sell the loot item
            this.playerGold += item.sellPrice;
            this.stateManager.playerGold = this.playerGold;
            
            // Create gold add effect at the gold display location
            this.createAddGoldEffect(item.sellPrice, this.goldDisplayX, this.goldDisplayY);
            
            // Update statistics when selling
            if (this.stateManager.gameStatistics) {
                this.stateManager.gameStatistics.totalMoneyEarnedInMarketplace += item.sellPrice;
                this.stateManager.gameStatistics.addItemsSold(1);
            }
            
            // Remove from inventory
            const inventoryIndex = this.stateManager.playerInventory.findIndex(
                inv => inv.lootId === item.lootId
            );
            
            if (inventoryIndex !== -1) {
                this.stateManager.playerInventory[inventoryIndex].count -= 1;
                if (this.stateManager.playerInventory[inventoryIndex].count <= 0) {
                    this.stateManager.playerInventory.splice(inventoryIndex, 1);
                }
            }
            
            // Rebuild sell items to reflect the change
            this.sellItems = this.buildSellItems();
            
            
            if (this.stateManager.audioManager) {
                // Use LootCollect sound for selling (as per user request)
                this.stateManager.audioManager.playSFX('loot-collect');
            }
        }
    }

    handleWheel(x, y, deltaY) {
        // Handle scrolling on upgrade tiles
        const canvas = this.stateManager.canvas;
        const baseWidth = canvas.width - 80;
        const baseHeight = canvas.height - 60;
        const panelWidth = Math.min(baseWidth * 0.85, 1200);
        const panelHeight = Math.min(baseHeight * 0.85, 700);
        const panelX = (canvas.width - panelWidth) / 2;
        const panelY = (canvas.height - panelHeight) / 2;
        
        // Calculate item grid positions (same as in updateHoverState and renderTabContent)
        const contentY = panelY + 78 + (this.activeTab === 'buy' ? 30 : 0);
        const contentHeight = panelHeight - 140 - (this.activeTab === 'buy' ? 30 : 0);
        
        const horizontalPadding = 20;
        const verticalPadding = 15;
        const gridSpacing = 10;
        
        const availableWidth = panelWidth - (horizontalPadding * 2);
        const availableHeight = contentHeight - (verticalPadding * 2);
        
        const itemWidth = (availableWidth - (gridSpacing * 2)) / 3;
        const itemHeight = (availableHeight - gridSpacing) / 2;
        
        const itemsGridStartX = panelX + horizontalPadding;
        const itemsGridStartY = contentY + verticalPadding;
        
        // Find which item is under the mouse
        const items = this.getItemsForCurrentPage();
        for (let index = 0; index < items.length; index++) {
            const item = items[index];
            const row = Math.floor(index / 3);
            const col = index % 3;
            const itemX = itemsGridStartX + col * (itemWidth + gridSpacing);
            const itemY = itemsGridStartY + row * (itemHeight + gridSpacing);
            
            // Check if mouse is within this item bounds
            if (x >= itemX && x <= itemX + itemWidth && y >= itemY && y <= itemY + itemHeight) {
                // Scroll all items that have scroll state
                if (this.scrollableTiles.has(item.id)) {
                    const scrollState = this.scrollableTiles.get(item.id);
                    if (scrollState.maxScroll > 0) {
                        // Scroll up (negative deltaY) or down (positive deltaY)
                        const scrollDirection = deltaY > 0 ? 1 : -1;
                        scrollState.scrollOffset += scrollDirection;
                        // Clamp scroll offset
                        scrollState.scrollOffset = Math.max(0, Math.min(scrollState.scrollOffset, scrollState.maxScroll));
                    }
                }
                break;
            }
        }
    }

    createGoldSplash(originX, originY, amount) {
        // Create multiple gold coin particles that splash outward and fall
        const coinCount = Math.min(100, Math.ceil(amount / 30)); // More coins for higher amounts
        for (let i = 0; i < coinCount; i++) {
            const angle = (i / coinCount) * Math.PI * 2;
            const velocity = {
                x: Math.cos(angle) * (3 + Math.random() * 3),
                y: Math.sin(angle) * (3 + Math.random() * 2) - 2
            };
            this.floatingGoldEffects.push({
                x: originX,
                y: originY,
                velocityX: velocity.x,
                velocityY: velocity.y,
                gravity: 0.15,
                duration: 1.2,
                elapsed: 0,
                rotation: Math.random() * Math.PI * 2,
                rotationVel: (Math.random() - 0.5) * 0.3,
                showText: true,
                textAmount: amount,
                textColor: '#00FF00' // Green for sale (positive)
            });
        }
        
        // Add one text effect at the origin showing the amount
        this.glowEffects.push({
            x: originX,
            y: originY,
            startY: originY,
            duration: 1.5,
            elapsed: 0,
            amount: '+' + amount,
            float: 0,
            floatVel: 0.5,
            color: '#00FF00'
        });
    }

    createGlowEffect(goldAmount, originX, originY) {
        // Create text effect at the gold display location showing the gold spent
        // Animates DOWNWARD and fades out in RED
        this.glowEffects.push({
            x: originX,
            y: originY,
            startY: originY,
            duration: 1.8,
            elapsed: 0,
            amount: '-' + goldAmount,
            float: 0,
            floatVel: -80,  // Negative velocity for downward movement (pixels per second)
            color: '#FF6666'  // Red for spent gold
        });
    }

    createAddGoldEffect(goldAmount, originX, originY) {
        // Create text effect at the gold display location showing the gold added
        // Animates UPWARD and fades out in GREEN
        this.glowEffects.push({
            x: originX,
            y: originY,
            startY: originY,
            duration: 1.8,
            elapsed: 0,
            amount: '+' + goldAmount,
            float: 0,
            floatVel: 80,  // Positive velocity for upward movement (pixels per second)
            color: '#00FF00'  // Green for added gold
        });
    }

    createErrorEffect(message, originX, originY) {
        // Create error message effect
        this.errorEffects.push({
            x: originX,
            y: originY,
            startY: originY,
            duration: 2,
            elapsed: 0,
            message: message,
            float: 0,
            floatVel: 0.3
        });
    }

    createItemErrorEffect(message, itemCenterX, itemCenterY) {
        // Create error message effect displayed in the center of an item panel
        this.itemErrorEffects = this.itemErrorEffects || [];
        this.itemErrorEffects.push({
            x: itemCenterX,
            y: itemCenterY,
            startY: itemCenterY,
            duration: 2,
            elapsed: 0,
            message: message,
            float: 0,
            floatVel: 0.2
        });
    }

    updateEffects(deltaTime) {
        // Update gold splash effects
        this.floatingGoldEffects = this.floatingGoldEffects.filter(effect => {
            effect.elapsed += deltaTime;
            effect.y += effect.velocityY;
            effect.velocityY += effect.gravity;
            effect.x += effect.velocityX;
            effect.rotation += effect.rotationVel;
            return effect.elapsed < effect.duration;
        });
        
        // Update glow effects
        this.glowEffects = this.glowEffects.filter(effect => {
            effect.elapsed += deltaTime;
            effect.float += effect.floatVel * deltaTime;
            return effect.elapsed < effect.duration;
        });
        
        // Update error effects
        this.errorEffects = this.errorEffects.filter(effect => {
            effect.elapsed += deltaTime;
            effect.float += effect.floatVel * deltaTime;
            return effect.elapsed < effect.duration;
        });
        
        // Update item error effects
        if (!this.itemErrorEffects) this.itemErrorEffects = [];
        this.itemErrorEffects = this.itemErrorEffects.filter(effect => {
            effect.elapsed += deltaTime;
            effect.float += effect.floatVel * deltaTime;
            return effect.elapsed < effect.duration;
        });
    }

    renderEffects(ctx) {
        // Render gold splash effects
        this.floatingGoldEffects.forEach(effect => {
            const progress = effect.elapsed / effect.duration;
            const alpha = Math.max(0, 1 - progress); // Fade out
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(effect.x, effect.y);
            ctx.rotate(effect.rotation);
            
            // Draw gold coin
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Coin edge
            ctx.strokeStyle = '#ffed4e';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Coin shine
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(-1.5, -1.5, 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
        
        // Render glow effects
        this.glowEffects.forEach(effect => {
            const progress = effect.elapsed / effect.duration;
            const alpha = Math.max(0, 1 - progress * 1.2); // Fade out
            
            // Draw amount text
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = 'bold 18px Arial';
            ctx.fillStyle = effect.color || '#FFD700';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(effect.amount + 'g', effect.x, effect.y - effect.float);
            ctx.restore();
        });
        
        // Render error effects
        this.errorEffects.forEach(effect => {
            const progress = effect.elapsed / effect.duration;
            const alpha = Math.max(0, 1 - progress); // Fade out
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = '#ff4444';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(effect.message, effect.x, effect.y - effect.float);
            ctx.restore();
        });
        
        // Render item error effects
        if (!this.itemErrorEffects) this.itemErrorEffects = [];
        this.itemErrorEffects.forEach(effect => {
            const progress = effect.elapsed / effect.duration;
            const alpha = Math.max(0, 1 - progress); // Fade out
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = 'bold 15px Arial';
            ctx.fillStyle = '#ff4444';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.fillText(effect.message, effect.x, effect.y - effect.float);
            ctx.restore();
        });
    }


    render(ctx) {
        if (!this.isOpen) return;
        
        const canvas = this.stateManager.canvas;
        const baseWidth = canvas.width - 80;
        const baseHeight = canvas.height - 60;
        const panelWidth = Math.min(baseWidth * 0.85, 1200); // Use more screen space
        const panelHeight = Math.min(baseHeight * 0.85, 700);
        const panelX = (canvas.width - panelWidth) / 2;
        const panelY = (canvas.height - panelHeight) / 2;
        
        // Fade background
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        
        // Panel background
        ctx.globalAlpha = Math.min(1, this.animationProgress);
        ctx.fillStyle = '#2a1a0f';
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        
        // Panel border
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 3;
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // Draw corner trim on all four corners
        this.drawCornerTrim(ctx, panelX, panelY, 20, true, false, false, false);  // Top-left
        this.drawCornerTrim(ctx, panelX + panelWidth, panelY, 20, false, true, false, false);  // Top-right
        this.drawCornerTrim(ctx, panelX, panelY + panelHeight, 20, false, false, true, false);  // Bottom-left
        this.drawCornerTrim(ctx, panelX + panelWidth, panelY + panelHeight, 20, false, false, false, true);  // Bottom-right
        
        // Panel title - inside at top
        ctx.font = 'bold 18px serif';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('Upgrades & Marketplace', panelX + panelWidth / 2, panelY + 12);
        
        // Gold display in top left
        this.renderGoldDisplay(ctx, panelX + 20, panelY + 10);
        
        // Close button
        const closeX = panelX + panelWidth - 40;
        const closeY = panelY + 12;
        ctx.fillStyle = this.closeButtonHovered ? '#ff6666' : '#cc0000';
        ctx.fillRect(closeX, closeY, 25, 25);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(closeX, closeY, 25, 25);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('×', closeX + 12.5, closeY + 12.5);
        
        // Tabs
        const tabY = panelY + 42;
        const tabHeight = 32;
        const tabWidth = (panelWidth - 40) / 2;
        const tabGap = 0;
        
        this.tabButtons.forEach((tab, index) => {
            const tabX = panelX + 20 + index * (tabWidth + tabGap);
            const isActive = tab.action === this.activeTab;
            
            // Tab button with beveled edge effect
            // Background - brighter if hovered
            ctx.fillStyle = isActive ? '#6b5a47' : (tab.hovered ? '#5a4a3a' : '#3a2a1a');
            ctx.fillRect(tabX, tabY, tabWidth, tabHeight);
            
            // Top highlight for active tab
            if (isActive) {
                ctx.fillStyle = '#8b7a67';
                ctx.fillRect(tabX, tabY, tabWidth, 2);
                ctx.fillStyle = '#7b6a57';
                ctx.fillRect(tabX, tabY + 2, tabWidth, 1);
            }
            
            // Bottom shadow
            ctx.fillStyle = '#1a0a00';
            ctx.fillRect(tabX, tabY + tabHeight - 2, tabWidth, 2);
            
            // Left shadow
            ctx.fillStyle = '#1a0a00';
            ctx.fillRect(tabX, tabY, 1, tabHeight);
            
            // Border - brighter if hovered
            ctx.strokeStyle = isActive ? '#ffd700' : (tab.hovered ? '#d4a574' : '#5a4a3a');
            ctx.lineWidth = isActive ? 2 : (tab.hovered ? 2 : 1);
            ctx.strokeRect(tabX, tabY, tabWidth, tabHeight);
            
            // Tab text - brighter if hovered
            ctx.font = isActive ? 'bold 13px Arial' : (tab.hovered ? 'bold 13px Arial' : '13px Arial');
            ctx.fillStyle = isActive ? '#ffd700' : (tab.hovered ? '#d4a574' : '#b89968');
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tab.label, tabX + tabWidth / 2, tabY + tabHeight / 2);
        });
        
        // Render category filter buttons (only in buy tab)
        if (this.activeTab === 'buy') {
            const categoryY = panelY + 74;
            const categoryHeight = 25;
            const categoryButtonWidth = (panelWidth - 40) / this.buyCategories.length;
            
            this.buyCategories.forEach((category, index) => {
                const categoryX = panelX + 20 + index * categoryButtonWidth;
                const isActive = this.activeBuyCategory === category.id;
                
                // Button background
                ctx.fillStyle = isActive ? '#6b5a47' : '#3a2a1a';
                ctx.fillRect(categoryX, categoryY, categoryButtonWidth, categoryHeight);
                
                // Button border
                ctx.strokeStyle = isActive ? '#ffd700' : '#5a4a3a';
                ctx.lineWidth = isActive ? 2 : 1;
                ctx.strokeRect(categoryX, categoryY, categoryButtonWidth, categoryHeight);
                
                // Button text
                ctx.font = isActive ? 'bold 11px Arial' : '11px Arial';
                ctx.fillStyle = isActive ? '#ffd700' : '#b89968';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(category.label, categoryX + categoryButtonWidth / 2, categoryY + categoryHeight / 2);
            });
        }
        
        // Content area based on active tab - expanded to fill space
        const contentY = panelY + 78 + (this.activeTab === 'buy' ? 30 : 0);
        const contentHeight = panelHeight - 140 - (this.activeTab === 'buy' ? 30 : 0);
        
        this.renderTabContent(ctx, panelX, contentY, panelWidth, contentHeight);
        
        // Pagination controls
        const maxPages = this.getMaxPages();
        if (maxPages > 1) {
            this.renderPaginationControls(ctx, panelX, panelY + panelHeight - 50, panelWidth);
        }
        
        // Store panel info for coordinate calculations
        this.lastPanelX = panelX;
        this.lastPanelY = panelY;
        this.lastPanelWidth = panelWidth;
        this.lastPanelHeight = panelHeight;
        
        // Render visual effects
        this.renderEffects(ctx);
        
        ctx.globalAlpha = 1;
    }

    renderGoldDisplay(ctx, x, y) {
        // Draw treasure chest with half-opened lid
        const chestWidth = 35;
        const chestHeight = 25;
        
        // Chest body - main brown color
        ctx.fillStyle = '#8b6f47';
        ctx.fillRect(x, y + 8, chestWidth, chestHeight - 8);
        
        // Chest front face - darker for 3D effect
        ctx.fillStyle = '#6b5a47';
        ctx.fillRect(x, y + 8, chestWidth, 3);
        
        // Chest sides shadow
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(x - 2, y + 8, 2, chestHeight - 8);
        ctx.fillRect(x + chestWidth, y + 8, 2, chestHeight - 8);
        
        // Chest bottom rim
        ctx.fillStyle = '#5a4a37';
        ctx.fillRect(x, y + chestHeight, chestWidth, 2);
        
        // Metal bands on chest
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(x - 2, y + 12, chestWidth + 4, 2);
        ctx.fillRect(x - 2, y + 20, chestWidth + 4, 1);
        
        // Chest lid - half open
        const lidWidth = chestWidth;
        const lidHeight = 8;
        const lidAngle = Math.PI / 6; // 30 degrees open
        
        ctx.save();
        ctx.translate(x, y + 8);
        ctx.rotate(-lidAngle);
        
        // Lid body
        ctx.fillStyle = '#8b6f47';
        ctx.fillRect(0, -lidHeight, lidWidth, lidHeight);
        
        // Lid front edge highlight
        ctx.fillStyle = '#a68f67';
        ctx.fillRect(0, -lidHeight, lidWidth, 2);
        
        // Lid metal hinge
        ctx.fillStyle = '#c4af37';
        ctx.fillRect(0, -2, 4, 4);
        ctx.fillRect(lidWidth - 4, -2, 4, 4);
        
        ctx.restore();
        
        // Gold coins visible inside chest
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.ellipse(x + chestWidth * 0.25, y + 15, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffed4e';
        ctx.beginPath();
        ctx.ellipse(x + chestWidth * 0.5, y + 18, 3, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.ellipse(x + chestWidth * 0.75, y + 16, 3.5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Spilled gold coins around chest
        ctx.fillStyle = '#ffed4e';
        ctx.beginPath();
        ctx.ellipse(x + chestWidth + 6, y + 18, 2.5, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.ellipse(x + chestWidth + 10, y + 20, 2, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Gold amount text next to chest - ENHANCED STYLING
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#ffed4e';  // Brighter gold
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const goldTextX = x + chestWidth + 18;
        const goldTextY = y + 14;
        
        // Add subtle glow/shadow effect
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillText(this.playerGold + ' Gold', goldTextX, goldTextY);
        ctx.shadowColor = 'transparent';
        
        // Store position for gold effect target
        this.goldDisplayX = goldTextX + 20;
        this.goldDisplayY = goldTextY;
    }

    renderTabContent(ctx, panelX, contentY, panelWidth, contentHeight) {
        const items = this.getItemsForCurrentPage();
        
        // Better spacing calculations for 3-column layout
        const horizontalPadding = 20;
        const verticalPadding = 15;
        const gridSpacing = 10;
        
        const availableWidth = panelWidth - (horizontalPadding * 2);
        const availableHeight = contentHeight - (verticalPadding * 2);
        
        const itemWidth = (availableWidth - (gridSpacing * 2)) / 3;
        const itemHeight = (availableHeight - gridSpacing) / 2;
        
        const itemsGridStartX = panelX + horizontalPadding;
        const itemsGridStartY = contentY + verticalPadding;
        
        items.forEach((item, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            const itemX = itemsGridStartX + col * (itemWidth + gridSpacing);
            const itemY = itemsGridStartY + row * (itemHeight + gridSpacing);
            
            this.renderItemTile(ctx, itemX, itemY, itemWidth, itemHeight, item);
        });
    }

    renderItemTile(ctx, x, y, width, height, item) {
        // Handle upgrade tiles differently with new layout
        if (item.type === 'upgrade') {
            return this.renderUpgradeTile(ctx, x, y, width, height, item);
        }
        
        // Standard rendering for marketplace items and loot - NEW LAYOUT: scrollable desc at top, effects at bottom
        const canBuy = this.activeTab === 'buy' && item.canPurchase;
        const isDisabled = this.activeTab === 'buy' && !item.canPurchase;
        ctx.fillStyle = item.hovered && !isDisabled ? '#6b5a47' : '#3a2a1a';
        ctx.fillRect(x, y, width, height);
        
        // Top highlight
        ctx.fillStyle = item.hovered && !isDisabled ? '#8b7a67' : '#4a3a2a';
        ctx.fillRect(x, y, width, 2);
        
        // Border (color by rarity if sell tab, disabled if can't buy)
        let borderColor = item.hovered && !isDisabled ? '#ffd700' : '#5a4a3a';
        if (isDisabled) {
            borderColor = '#5a4a4a'; // Gray for disabled items
        } else if (this.activeTab === 'sell' && item.rarity) {
            const rarityColors = {
                'common': '#C9A961',
                'uncommon': '#4FC3F7',
                'rare': '#AB47BC',
                'epic': '#FF6F00',
                'legendary': '#FFD700'
            };
            borderColor = item.hovered ? rarityColors[item.rarity] : '#5a4a3a';
        }
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = item.hovered && !isDisabled ? 3 : 2;
        ctx.strokeRect(x, y, width, height);
        
        // Extra glow for legendary items
        if (this.activeTab === 'sell' && item.rarity === 'legendary') {
            ctx.strokeStyle = '#FFD700';
            ctx.globalAlpha = 0.3;
            ctx.lineWidth = 1;
            ctx.strokeRect(x - 3, y - 3, width + 6, height + 6);
            ctx.globalAlpha = 1;
        }
        
        // Determine icon size and name font based on tab
        const isSellTab = this.activeTab === 'sell';
        const iconSize = isSellTab ? 28 : 24;
        const nameFontSize = isSellTab ? 12 : 11;
        
        // Icon
        if (typeof item.drawIcon === 'function') {
            item.drawIcon(ctx, x + width / 2, y + 6 + iconSize * 0.5, iconSize);
        } else if (item.icon) {
            ctx.font = `bold ${iconSize}px Arial`;
            ctx.fillStyle = isDisabled ? '#707070' : borderColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(item.icon, x + width / 2, y + 6);
        }
        
        // Count badge (sell tab only) - shown in top-right corner of tile
        if (isSellTab && item.count > 1) {
            const badgeText = '\u00d7' + item.count;
            ctx.font = 'bold 10px Arial';
            const badgeW = ctx.measureText(badgeText).width + 8;
            const badgeH = 14;
            const badgeX = x + width - badgeW - 4;
            const badgeY = y + 4;
            // Badge background
            ctx.fillStyle = item.rarity === 'rare' || item.rarity === 'epic' || item.rarity === 'legendary'
                ? 'rgba(40, 20, 60, 0.9)' : 'rgba(20, 15, 10, 0.9)';
            ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);
            // Badge text
            ctx.fillStyle = '#ffd700';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2);
        }
        
        // Item name
        ctx.font = `bold ${nameFontSize}px Arial`;
        ctx.fillStyle = isDisabled ? '#8a8a8a' : '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        const nameY = y + (isSellTab ? 38 : 32);
        const maxCharsPerLine = 15;
        if (item.name.length > maxCharsPerLine) {
            const words = item.name.split(' ');
            let line1 = '', line2 = '';
            for (const word of words) {
                if ((line1 + word).length <= maxCharsPerLine) {
                    line1 += (line1 ? ' ' : '') + word;
                } else {
                    line2 += (line2 ? ' ' : '') + word;
                }
            }
            ctx.fillText(line1, x + width / 2, nameY);
            if (line2) {
                ctx.fillText(line2, x + width / 2, nameY + 12);
            }
        } else {
            ctx.fillText(item.name, x + width / 2, nameY);
        }
        
        // ===== SCROLLABLE DESCRIPTION BOX AT TOP (SMALLER, FIXED HEIGHT) =====
        const descBoxStartY = nameY + 30;
        const descBoxHeight = 50; // Fixed smaller size for scrollable textbox
        const textPadding = 4;
        
        // Description box background
        ctx.fillStyle = '#2a2010';
        ctx.fillRect(x + 4, descBoxStartY, width - 8, descBoxHeight);
        
        // Description box border
        ctx.strokeStyle = item.hovered && !isDisabled ? '#8b7355' : '#6a5a4a';
        ctx.lineWidth = item.hovered && !isDisabled ? 2 : 1;
        ctx.strokeRect(x + 4, descBoxStartY, width - 8, descBoxHeight);
        
        // Initialize scroll state if not exists
        if (!this.scrollableTiles.has(item.id)) {
            this.scrollableTiles.set(item.id, { scrollOffset: 0, maxScroll: 0 });
        }
        
        const scrollState = this.scrollableTiles.get(item.id);
        
        // Wrap description text
        const charPerLine = Math.floor((width - 16) / 6);
        const lines = this.wrapText(item.description, charPerLine);
        const lineHeight = 11;
        
        // Calculate max scroll
        const maxVisibleLines = Math.floor((descBoxHeight - (textPadding * 2)) / lineHeight) - 1;
        scrollState.maxScroll = Math.max(0, lines.length - maxVisibleLines);
        
        // Render visible portion of description text with clip
        ctx.save();
        ctx.beginPath();
        // Reserve space on the right for scroll bar
        const scrollBarWidth = scrollState.maxScroll > 0 ? 6 : 0;
        ctx.rect(x + 5, descBoxStartY + 2, width - 10 - scrollBarWidth, descBoxHeight - 4);
        ctx.clip();
        
        ctx.font = '9px Arial';
        ctx.fillStyle = isDisabled ? '#9a9a9a' : '#c9a961';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        const startLine = Math.min(scrollState.scrollOffset, scrollState.maxScroll);
        const textX = x + 8;
        const textStartY = descBoxStartY + textPadding - (startLine * lineHeight);
        
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], textX, textStartY + (i * lineHeight));
        }
        
        ctx.restore();
        
        // Draw scroll bar if there's scrollable content
        if (scrollState.maxScroll > 0) {
            const scrollBarX = x + width - 8;
            const scrollBarY = descBoxStartY + 2;
            const scrollBarHeight = descBoxHeight - 4;
            
            // Background of scroll bar track
            ctx.fillStyle = '#1a1010';
            ctx.fillRect(scrollBarX, scrollBarY, 4, scrollBarHeight);
            
            // Calculate scroll thumb position and size
            const thumbHeight = Math.max(8, (maxVisibleLines / lines.length) * (scrollBarHeight - 2));
            const thumbY = scrollBarY + 1 + (scrollState.scrollOffset / scrollState.maxScroll) * (scrollBarHeight - thumbHeight - 2);
            
            // Draw scroll thumb
            ctx.fillStyle = scrollState.maxScroll > 0 ? '#8b7355' : '#5a4a3a';
            ctx.fillRect(scrollBarX + 0.5, thumbY, 3, thumbHeight);
        }
        
        // ===== EFFECTS SECTION AT BOTTOM (BEFORE BUTTON) =====
        const effectBoxStartY = descBoxStartY + descBoxHeight + 2;
        const effectBoxHeight = (height - 32) - (descBoxStartY + descBoxHeight + 2);
        
        // Effects header/content
        if (item.effect) {
            // Effect text with bullet points
            ctx.font = 'bold 10px Arial';
            ctx.fillStyle = '#FFD700';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            
            // Split effect by newlines first, then wrap each line if needed
            const rawEffectLines = item.effect.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            const effectLines = [];
            const effectCharPerLine = Math.floor((width - 16) / 4.5);
            
            for (const rawLine of rawEffectLines) {
                const wrappedLines = this.wrapText(rawLine, effectCharPerLine);
                effectLines.push(...wrappedLines);
            }
            
            const effectTextStartY = effectBoxStartY + 2;
            for (let i = 0; i < Math.min(effectLines.length, 3); i++) {
                const bulletText = '• ' + effectLines[i];
                ctx.fillText(bulletText, x + 8, effectTextStartY + (i * 12));
            }
        }
        
        // Disabled overlay - no message shown here, it will appear as floating text
        if (isDisabled) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(x, y, width, height);
        }
        
        // Action button
        const buttonWidth = width - 14;
        const buttonHeight = 24;
        const buttonX = x + 7;
        const buttonY = y + height - 32;
        
        // Sell tab uses a slightly different button color scheme (amber-green) to indicate receiving gold
        const isSellButton = this.activeTab === 'sell';
        ctx.fillStyle = isDisabled ? '#4a4a4a' : (item.hovered ? (isSellButton ? '#4a6b3a' : '#8b6f47') : (isSellButton ? '#2a4a1e' : '#5a4a3a'));
        ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        // Top highlight
        ctx.fillStyle = isDisabled ? '#5a5a5a' : (item.hovered ? (isSellButton ? '#5a7b4a' : '#9b7f57') : (isSellButton ? '#3a5a2e' : '#6a5a4a'));
        ctx.fillRect(buttonX, buttonY, buttonWidth, 1);
        
        ctx.strokeStyle = isDisabled ? '#5a5a5a' : (item.hovered ? '#ffd700' : (isSellButton ? '#6a9a4a' : '#8b7355'));
        ctx.lineWidth = isDisabled ? 1 : (item.hovered ? 2 : 1);
        ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        // For buy tab, show coin icon + price
        // For sell tab, show SELL label + coin icon + price
        let displayPrice = 0;
        if (this.activeTab === 'buy') {
            displayPrice = item.cost;
        } else if (this.activeTab === 'sell') {
            displayPrice = item.sellPrice;
        }
        
        const buttonCenterY = buttonY + buttonHeight / 2;
        const coinRadius = 5;
        
        if (isSellButton) {
            // Sell button: "SELL" label on left, coin+price on right
            const labelColor = isDisabled ? '#8a8a8a' : (item.hovered ? '#ffd700' : '#a0cc80');
            ctx.font = 'bold 9px Arial';
            ctx.fillStyle = labelColor;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText('SELL', buttonX + 6, buttonCenterY);
            // Coin + price on right side
            const coinX = buttonX + buttonWidth - 28;
            const priceTextX = coinX + coinRadius + 3;
            this.renderCoinIconInline(ctx, coinX, buttonCenterY, coinRadius,
                                      isDisabled ? '#8a8a8a' : (item.hovered ? '#ffd700' : '#d4af37'));
            ctx.font = 'bold 11px Arial';
            ctx.fillStyle = isDisabled ? '#8a8a8a' : (item.hovered ? '#ffd700' : '#d4af37');
            ctx.textAlign = 'left';
            ctx.fillText(displayPrice.toString(), priceTextX, buttonCenterY);
        } else {
            // Buy button: coin icon + price centered
            ctx.font = 'bold 13px Arial';
            ctx.fillStyle = isDisabled ? '#8a8a8a' : (item.hovered ? '#ffd700' : '#d4af37');
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            const coinX = buttonX + buttonWidth / 2 - 12;
            const priceTextX = buttonX + buttonWidth / 2 + 2;
            this.renderCoinIconInline(ctx, coinX, buttonCenterY, coinRadius,
                                      isDisabled ? '#8a8a8a' : (item.hovered ? '#ffd700' : '#d4af37'));
            ctx.textAlign = 'left';
            ctx.fillText(displayPrice.toString(), priceTextX, buttonCenterY);
        }
    }

    renderCoinIconInline(ctx, x, y, radius, color) {
        // Draw a small coin icon (circle with shine)
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add shine effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(x - 1, y - 1, radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    renderUpgradeTile(ctx, x, y, width, height, item) {
        // Render upgrades in the SAME LAYOUT as marketplace items for consistency
        const isDisabled = !item.canPurchase;
        ctx.fillStyle = item.hovered && !isDisabled ? '#6b5a47' : '#3a2a1a';
        ctx.fillRect(x, y, width, height);
        
        // Top highlight
        ctx.fillStyle = item.hovered && !isDisabled ? '#8b7a67' : '#4a3a2a';
        ctx.fillRect(x, y, width, 2);
        
        // Border
        let borderColor = item.hovered && !isDisabled ? '#ffd700' : '#5a4a3a';
        if (isDisabled) {
            borderColor = '#5a4a4a';
        }
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = item.hovered && !isDisabled ? 3 : 2;
        ctx.strokeRect(x, y, width, height);
        
        // Icon - PROMINENT at top
        const iconSize = 28;
        if (typeof item.drawIcon === 'function') {
            item.drawIcon(ctx, x + width / 2, y + 6 + iconSize * 0.5, iconSize);
        } else if (item.icon) {
            ctx.font = `bold ${iconSize}px Arial`;
            ctx.fillStyle = isDisabled ? '#707070' : '#ffd700';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(item.icon, x + width / 2, y + 6);
        }
        
        // Item name - centered below icon
        ctx.font = 'bold 11px Arial';
        ctx.fillStyle = isDisabled ? '#8a8a8a' : '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        const nameY = y + 38;
        const maxCharsPerLine = 15;
        if (item.name.length > maxCharsPerLine) {
            const words = item.name.split(' ');
            let line1 = '', line2 = '';
            for (const word of words) {
                if ((line1 + word).length <= maxCharsPerLine) {
                    line1 += (line1 ? ' ' : '') + word;
                } else {
                    line2 += (line2 ? ' ' : '') + word;
                }
            }
            ctx.fillText(line1, x + width / 2, nameY);
            if (line2) {
                ctx.fillText(line2, x + width / 2, nameY + 12);
            }
        } else {
            ctx.fillText(item.name, x + width / 2, nameY);
        }
        
        // ===== SCROLLABLE DESCRIPTION BOX =====
        const descBoxStartY = nameY + 30;
        const descBoxHeight = 50;
        const textPadding = 4;
        
        // Description box background
        ctx.fillStyle = '#2a2010';
        ctx.fillRect(x + 4, descBoxStartY, width - 8, descBoxHeight);
        
        // Description box border
        ctx.strokeStyle = item.hovered && !isDisabled ? '#8b7355' : '#6a5a4a';
        ctx.lineWidth = item.hovered && !isDisabled ? 2 : 1;
        ctx.strokeRect(x + 4, descBoxStartY, width - 8, descBoxHeight);
        
        // Initialize scroll state if not exists
        if (!this.scrollableTiles.has(item.id)) {
            this.scrollableTiles.set(item.id, { scrollOffset: 0, maxScroll: 0 });
        }
        
        const scrollState = this.scrollableTiles.get(item.id);
        
        // Wrap description text
        const charPerLine = Math.floor((width - 16) / 6);
        const lines = this.wrapText(item.description, charPerLine);
        const lineHeight = 11;
        
        // Calculate max scroll
        const maxVisibleLines = Math.floor((descBoxHeight - (textPadding * 2)) / lineHeight) - 1;
        scrollState.maxScroll = Math.max(0, lines.length - maxVisibleLines);
        
        // Render visible portion of description text with clip
        ctx.save();
        ctx.beginPath();
        // Reserve space on the right for scroll bar
        const scrollBarWidth = scrollState.maxScroll > 0 ? 6 : 0;
        ctx.rect(x + 5, descBoxStartY + 2, width - 10 - scrollBarWidth, descBoxHeight - 4);
        ctx.clip();
        
        ctx.font = '9px Arial';
        ctx.fillStyle = isDisabled ? '#9a9a9a' : '#c9a961';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        const startLine = Math.min(scrollState.scrollOffset, scrollState.maxScroll);
        const textX = x + 8;
        const textStartY = descBoxStartY + textPadding - (startLine * lineHeight);
        
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], textX, textStartY + (i * lineHeight));
        }
        
        ctx.restore();
        
        // Draw scroll bar if there's scrollable content
        if (scrollState.maxScroll > 0) {
            const scrollBarX = x + width - 8;
            const scrollBarY = descBoxStartY + 2;
            const scrollBarHeight = descBoxHeight - 4;
            
            // Background of scroll bar track
            ctx.fillStyle = '#1a1010';
            ctx.fillRect(scrollBarX, scrollBarY, 4, scrollBarHeight);
            
            // Calculate scroll thumb position and size
            const thumbHeight = Math.max(8, (maxVisibleLines / lines.length) * (scrollBarHeight - 2));
            const thumbY = scrollBarY + 1 + (scrollState.scrollOffset / scrollState.maxScroll) * (scrollBarHeight - thumbHeight - 2);
            
            // Draw scroll thumb
            ctx.fillStyle = scrollState.maxScroll > 0 ? '#8b7355' : '#5a4a3a';
            ctx.fillRect(scrollBarX + 0.5, thumbY, 3, thumbHeight);
        }
        
        // ===== EFFECTS SECTION AT BOTTOM =====
        const effectBoxStartY = descBoxStartY + descBoxHeight + 2;
        const effectBoxHeight = (height - 32) - (descBoxStartY + descBoxHeight + 2);
        
        // Effects header/content
        if (item.effect) {
            ctx.font = 'bold 10px Arial';
            ctx.fillStyle = '#FFD700';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            
            // Split effect text by newlines (multi-line bullet format)
            const effectLines = item.effect.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            
            const effectTextStartY = effectBoxStartY + 2;
            const maxEffectLines = 3;
            for (let i = 0; i < Math.min(effectLines.length, maxEffectLines); i++) {
                const bulletText = '• ' + effectLines[i];
                ctx.fillText(bulletText, x + 8, effectTextStartY + (i * 12));
            }
        }
        
        // Disabled overlay and message
        if (isDisabled) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(x, y, width, height);
            
            ctx.font = '8px Arial';
            ctx.fillStyle = '#ffaa00';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const displayMsg = item.requirementMsg || 'Not Available';
            ctx.fillText(displayMsg, x + width / 2, y + height - 18);
        }
        
        // Action button
        const buttonWidth = width - 14;
        const buttonHeight = 24;
        const buttonX = x + 7;
        const buttonY = y + height - 32;
        
        // Button beveled effect
        ctx.fillStyle = isDisabled ? '#4a4a4a' : (item.hovered ? '#8b6f47' : '#5a4a3a');
        ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        // Top highlight
        ctx.fillStyle = isDisabled ? '#5a5a5a' : (item.hovered ? '#9b7f57' : '#6a5a4a');
        ctx.fillRect(buttonX, buttonY, buttonWidth, 1);
        
        ctx.strokeStyle = isDisabled ? '#5a5a5a' : (item.hovered ? '#ffd700' : '#8b7355');
        ctx.lineWidth = isDisabled ? 1 : (item.hovered ? 2 : 1);
        ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        // Render coin icon and price
        ctx.font = 'bold 13px Arial';
        ctx.fillStyle = isDisabled ? '#8a8a8a' : (item.hovered ? '#ffd700' : '#d4af37');
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        
        // Draw coin icon and price text
        const buttonCenterY = buttonY + buttonHeight / 2;
        const coinRadius = 5;
        const coinX = buttonX + buttonWidth / 2 - 12;
        const priceTextX = buttonX + buttonWidth / 2 + 2;
        this.renderCoinIconInline(ctx, coinX, buttonCenterY, coinRadius, 
                                  isDisabled ? '#8a8a8a' : (item.hovered ? '#ffd700' : '#d4af37'));
        ctx.textAlign = 'left';
        ctx.fillText(item.cost.toString(), priceTextX, buttonCenterY);
    }

    renderPaginationControls(ctx, panelX, y, panelWidth) {
        const arrowSize = 25;
        const leftArrowX = panelX + 20;
        const rightArrowX = panelX + panelWidth - 45;
        const maxPages = this.getMaxPages();
        
        // Left arrow with beveled effect
        ctx.fillStyle = this.leftArrowHovered ? '#8b6f47' : '#5a4a3a';
        ctx.fillRect(leftArrowX, y, arrowSize, arrowSize);
        
        // Top highlight
        ctx.fillStyle = this.leftArrowHovered ? '#9b7f57' : '#6a5a4a';
        ctx.fillRect(leftArrowX, y, arrowSize, 1);
        
        ctx.strokeStyle = this.leftArrowHovered ? '#ffd700' : '#5a4a3a';
        ctx.lineWidth = 2;
        ctx.strokeRect(leftArrowX, y, arrowSize, arrowSize);
        
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = this.leftArrowHovered ? '#ffd700' : '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('◀', leftArrowX + arrowSize / 2, y + arrowSize / 2);
        
        // Right arrow
        ctx.fillStyle = this.rightArrowHovered ? '#8b6f47' : '#5a4a3a';
        ctx.fillRect(rightArrowX, y, arrowSize, arrowSize);
        
        // Top highlight
        ctx.fillStyle = this.rightArrowHovered ? '#9b7f57' : '#6a5a4a';
        ctx.fillRect(rightArrowX, y, arrowSize, 1);
        
        ctx.strokeStyle = this.rightArrowHovered ? '#ffd700' : '#5a4a3a';
        ctx.lineWidth = 2;
        ctx.strokeRect(rightArrowX, y, arrowSize, arrowSize);
        
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = this.rightArrowHovered ? '#ffd700' : '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('▶', rightArrowX + arrowSize / 2, y + arrowSize / 2);
        
        // Page indicator
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Page ${this.currentPage + 1} / ${maxPages}`, ctx.canvas.width / 2, y + arrowSize / 2);
    }
}

/**
 * Settlement Options Menu Popup
 * Allows player to save, load, and exit
 */
class SettlementOptionsMenu {
    constructor(stateManager, settlementHub) {
        this.stateManager = stateManager;
        this.settlementHub = settlementHub;
        this.isOpen = false;
        this.animationProgress = 0;
        this.buttons = [
            { label: 'SAVE GAME', action: 'save', hovered: false },
            { label: 'LOAD GAME', action: 'load', hovered: false },
            { label: 'MAIN MENU', action: 'menu', hovered: false },
            { label: 'CLOSE', action: 'close', hovered: false },
        ];
        this.buttonWidth = 180;
        this.buttonHeight = 50;
    }

    open() {
        this.isOpen = true;
        this.animationProgress = 0;
    }

    close() {
        this.isOpen = false;
        this.settlementHub.closePopup();
    }

    update(deltaTime) {
        if (this.isOpen && this.animationProgress < 1) {
            this.animationProgress += deltaTime * 2;
        }
    }

    updateHoverState(x, y) {
        const canvas = this.stateManager.canvas;
        const menuX = canvas.width / 2 - 150;
        const menuY = canvas.height / 2 - 150;

        this.buttons.forEach((button, index) => {
            const buttonX = menuX + 30;
            const buttonY = menuY + 60 + index * 70;
            button.hovered = x >= buttonX && x <= buttonX + this.buttonWidth &&
                           y >= buttonY && y <= buttonY + this.buttonHeight;
        });

        this.stateManager.canvas.style.cursor =
            this.buttons.some(b => b.hovered) ? 'pointer' : 'default';
    }

    handleClick(x, y) {
        const canvas = this.stateManager.canvas;
        const menuX = canvas.width / 2 - 150;
        const menuY = canvas.height / 2 - 150;
        const menuWidth = 300;
        const closeButtonX = menuX + menuWidth - 35;
        const closeButtonY = menuY + 10;
        const closeButtonSize = 25;

        // Check close button first
        if (x >= closeButtonX && x <= closeButtonX + closeButtonSize &&
            y >= closeButtonY && y <= closeButtonY + closeButtonSize) {
            this.close();
            return;
        }

        this.buttons.forEach((button, index) => {
            const buttonX = menuX + 30;
            const buttonY = menuY + 60 + index * 70;

            if (x >= buttonX && x <= buttonX + this.buttonWidth &&
                y >= buttonY && y <= buttonY + this.buttonHeight) {
                this.handleButtonClick(button.action);
            }
        });
    }

    handleButtonClick(action) {
        if (action === 'save') {
            SaveSystem.saveGame(this.stateManager.currentSaveSlot, this.stateManager.currentSaveData);
        } else if (action === 'load') {
            this.stateManager.changeState('loadGame');
        } else if (action === 'menu') {
            this.stateManager.changeState('mainMenu');
        } else if (action === 'close') {
            this.close();
        }
    }

    drawCornerTrim(ctx, x, y, size, isTopLeft, isTopRight, isBottomLeft, isBottomRight) {
        const trimWidth = 20;
        const gemSize = 5;
        const gemColor = '#d4af37';
        
        if (isTopLeft) {
            // Horizontal bar
            ctx.fillStyle = '#d4af37';
            ctx.fillRect(x, y, size, trimWidth);
            // Vertical bar
            ctx.fillRect(x, y, trimWidth, size);
            // Gem
            ctx.fillStyle = gemColor;
            ctx.beginPath();
            ctx.arc(x + gemSize, y + gemSize, gemSize, 0, Math.PI * 2);
            ctx.fill();
        }
        if (isTopRight) {
            // Horizontal bar
            ctx.fillStyle = '#d4af37';
            ctx.fillRect(x + size - trimWidth, y, trimWidth, trimWidth);
            // Vertical bar
            ctx.fillRect(x + size - trimWidth, y, trimWidth, size);
            // Gem
            ctx.fillStyle = gemColor;
            ctx.beginPath();
            ctx.arc(x + size - gemSize, y + gemSize, gemSize, 0, Math.PI * 2);
            ctx.fill();
        }
        if (isBottomLeft) {
            // Horizontal bar
            ctx.fillStyle = '#d4af37';
            ctx.fillRect(x, y + size - trimWidth, trimWidth, trimWidth);
            // Vertical bar
            ctx.fillRect(x, y + size - trimWidth, trimWidth, trimWidth);
            // Gem
            ctx.fillStyle = gemColor;
            ctx.beginPath();
            ctx.arc(x + gemSize, y + size - gemSize, gemSize, 0, Math.PI * 2);
            ctx.fill();
        }
        if (isBottomRight) {
            // Horizontal bar
            ctx.fillStyle = '#d4af37';
            ctx.fillRect(x + size - trimWidth, y + size - trimWidth, trimWidth, trimWidth);
            // Vertical bar
            ctx.fillRect(x + size - trimWidth, y + size - trimWidth, trimWidth, trimWidth);
            // Gem
            ctx.fillStyle = gemColor;
            ctx.beginPath();
            ctx.arc(x + size - gemSize, y + size - gemSize, gemSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    render(ctx) {
        const canvas = this.stateManager.canvas;
        const menuX = canvas.width / 2 - 150;
        const menuY = canvas.height / 2 - 150;
        const menuWidth = 300;
        const menuHeight = 320;

        // Fade background
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;

        // Popup background
        ctx.globalAlpha = Math.min(1, this.animationProgress);
        ctx.fillStyle = '#2a1a0f';
        ctx.fillRect(menuX, menuY, menuWidth, menuHeight);

        // Border
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

        // Corner trim
        ctx.globalAlpha = Math.min(1, this.animationProgress);
        this.drawCornerTrim(ctx, menuX, menuY, menuWidth, true, true, true, true);
        ctx.globalAlpha = 1;

        // Title
        ctx.font = 'bold 22px serif';
        ctx.fillStyle = '#d4af37';
        ctx.textAlign = 'center';
        ctx.fillText('OPTIONS', canvas.width / 2, menuY + 40);

        // Buttons
        this.buttons.forEach((button, index) => {
            const buttonX = menuX + 30;
            const buttonY = menuY + 60 + index * 70;

            // Button background
            ctx.fillStyle = button.hovered ? '#3a2a1a' : '#1a0f05';
            ctx.fillRect(buttonX, buttonY, this.buttonWidth, this.buttonHeight);

            // Button border
            ctx.strokeStyle = button.hovered ? '#d4af37' : '#664422';
            ctx.lineWidth = button.hovered ? 2 : 1;
            ctx.strokeRect(buttonX, buttonY, this.buttonWidth, this.buttonHeight);

            // Button text
            ctx.font = 'bold 16px serif';
            ctx.fillStyle = button.hovered ? '#d4af37' : '#c9a876';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(button.label, buttonX + this.buttonWidth / 2, buttonY + this.buttonHeight / 2);
        });

        // Red X close button at top right
        const closeButtonX = menuX + menuWidth - 35;
        const closeButtonY = menuY + 10;
        const closeButtonSize = 25;
        
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.fillStyle = this.closeButtonHovered ? '#ff6666' : '#cc0000';
        ctx.fillRect(closeButtonX, closeButtonY, closeButtonSize, closeButtonSize);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(closeButtonX, closeButtonY, closeButtonSize, closeButtonSize);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\xD7', closeButtonX + closeButtonSize / 2, closeButtonY + closeButtonSize / 2 + 1);
        ctx.restore();

        ctx.globalAlpha = 1;
    }

}

class StatsPanel {
    constructor(stateManager, settlementHub) {
        this.stateManager = stateManager;
        this.settlementHub = settlementHub;
        this.animationProgress = 0;
        this.targetAnimationProgress = 1;
        this.isOpen = false;
        
        // Get stats from SaveSystem
        const currentSlot = SaveSystem.getCurrentSlot();
        const saveData = SaveSystem.getSave(currentSlot) || {};
        
        this.stats = {
            'Total Enemies Killed': saveData.enemiesKilled || 0,
            'Total Gold Earned': saveData.totalGoldEarned || 0,
            'Level Progress': (saveData.currentLevel || 0) + ' / 5',
            'Time Played': this.formatTime(saveData.timePlayed || 0),
            'Wave Record': saveData.waveRecord || 0,
            'Towers Built': saveData.towersBuild || 0
        };
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m ${secs}s`;
    }

    open() {
        this.isOpen = true;
        this.animationProgress = 0;
        this.targetAnimationProgress = 1;
    }

    close() {
        this.isOpen = false;
        this.targetAnimationProgress = 0;
    }

    update(deltaTime) {
        this.animationProgress += (this.targetAnimationProgress - this.animationProgress) * deltaTime * 5;
    }

    updateHoverState(x, y) {
        // Not needed for stats panel
    }

    handleClick(x, y) {
        const canvas = this.stateManager.canvas;
        const menuX = canvas.width / 2 - 200;
        const menuY = canvas.height / 2 - 150;
        const closeButtonX = menuX + 360;
        const closeButtonY = menuY + 10;
        
        // Check if close button clicked
        if (x >= closeButtonX && x <= closeButtonX + 30 &&
            y >= closeButtonY && y <= closeButtonY + 30) {
            this.close();
            this.settlementHub.closePopup();
        }
    }

    render(ctx) {
        const canvas = this.stateManager.canvas;
        
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;

        const menuX = canvas.width / 2 - 200;
        const menuY = canvas.height / 2 - 150;
        const menuWidth = 400;
        const menuHeight = 300;

        // Popup background
        ctx.globalAlpha = Math.min(1, this.animationProgress);
        ctx.fillStyle = '#2a1a0f';
        ctx.fillRect(menuX, menuY, menuWidth, menuHeight);

        // Border
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

        // Title
        ctx.font = 'bold 22px serif';
        ctx.fillStyle = '#d4af37';
        ctx.textAlign = 'center';
        ctx.fillText('STATS', canvas.width / 2, menuY + 40);

        // Close button
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(menuX + 360, menuY + 10, 30, 30);
        ctx.fillStyle = '#2a1a0f';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('X', menuX + 375, menuY + 25);

        // Stats display
        let yOffset = 70;
        const statSpacing = 35;
        
        Object.entries(this.stats).forEach(([label, value]) => {
            // Label
            ctx.font = '14px serif';
            ctx.fillStyle = '#c9a876';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(label + ':', menuX + 30, menuY + yOffset);

            // Value
            ctx.font = 'bold 14px serif';
            ctx.fillStyle = '#d4af37';
            ctx.textAlign = 'right';
            ctx.fillText(String(value), menuX + menuWidth - 30, menuY + yOffset);

            yOffset += statSpacing;
        });

        ctx.globalAlpha = 1;
    }
}

/**
 * Manage Settlement Menu
 * Allows player to save, load, manage options, and quit
 */
class ManageSettlementMenu {
    constructor(stateManager, settlementHub) {
        this.stateManager = stateManager;
        this.settlementHub = settlementHub;
        this.isOpen = false;
        this.animationProgress = 0;
        this.openTime = 0; // Track when menu was opened to prevent click-through
        this.activeWarningDialog = null; // 'quitSettlement', 'quitTouwers', or null
        
        this.buttons = [
            { label: 'SAVE SETTLEMENT', action: 'save', hovered: false },
            { label: 'LOAD SETTLEMENT', action: 'load', hovered: false },
            { label: 'OPTIONS', action: 'options', hovered: false },
            { label: 'QUIT SETTLEMENT', action: 'quitSettlement', hovered: false },
            { label: 'QUIT TOUWERS', action: 'quitTouwers', hovered: false },
        ];
        this.closeButtonHovered = false;
        this.buttonWidth = 300;
        this.buttonHeight = 52;
        this.buttonMarginTop = 52;
        this.buttonGap = 10;
    }

    open() {
        this.isOpen = true;
        this.animationProgress = 0;
        this.openTime = Date.now(); // Record when menu was opened
        this.activeWarningDialog = null; // Clear any existing warning dialog state
    }

    close() {
        this.isOpen = false;
        this.activeWarningDialog = null;
        this.settlementHub.closePopup();
    }

    update(deltaTime) {
        if (this.isOpen && this.animationProgress < 1) {
            this.animationProgress += deltaTime * 2;
        }
    }

    updateHoverState(x, y) {
        const canvas = this.stateManager.canvas;
        
        if (this.activeWarningDialog) {
            this.updateWarningDialogHoverState(x, y);
            return;
        }
        
        const menuPadding = 30;
        const menuWidth = this.buttonWidth + menuPadding * 2;
        const menuHeight = this.buttons.length * (this.buttonHeight + this.buttonGap) + this.buttonMarginTop + menuPadding * 2;
        const menuX = canvas.width / 2 - menuWidth / 2;
        const menuY = canvas.height / 2 - menuHeight / 2;

        this.buttons.forEach((button, index) => {
            const buttonX = menuX + menuPadding;
            const buttonY = menuY + this.buttonMarginTop + index * (this.buttonHeight + this.buttonGap);
            button.hovered = x >= buttonX && x <= buttonX + this.buttonWidth &&
                           y >= buttonY && y <= buttonY + this.buttonHeight;
        });

        const closeButtonX = menuX + menuWidth - 35;
        const closeButtonY = menuY + 10;
        const closeButtonSize = 25;
        this.closeButtonHovered = x >= closeButtonX && x <= closeButtonX + closeButtonSize &&
                                   y >= closeButtonY && y <= closeButtonY + closeButtonSize;

        this.stateManager.canvas.style.cursor =
            (this.buttons.some(b => b.hovered) || this.closeButtonHovered) ? 'pointer' : 'default';
    }

    updateWarningDialogHoverState(x, y) {
        const canvas = this.stateManager.canvas;
        const dialogWidth = 480;
        const dialogHeight = 220;
        const dialogX = canvas.width / 2 - dialogWidth / 2;
        const dialogY = canvas.height / 2 - dialogHeight / 2;
        const buttonWidth = 130;
        const buttonHeight = 45;
        const buttonGap = 15;
        
        // Button positions in warning dialog
        const totalButtonWidth = buttonWidth * 3 + buttonGap * 2;
        const buttonsStartX = dialogX + (dialogWidth - totalButtonWidth) / 2;
        
        const cancelX = buttonsStartX;
        const cancelY = dialogY + 130;
        
        const saveQuitX = buttonsStartX + buttonWidth + buttonGap;
        const saveQuitY = dialogY + 130;
        
        const quitX = buttonsStartX + (buttonWidth + buttonGap) * 2;
        const quitY = dialogY + 130;
        
        const cancelHovered = x >= cancelX && x <= cancelX + buttonWidth && y >= cancelY && y <= cancelY + buttonHeight;
        const saveQuitHovered = x >= saveQuitX && x <= saveQuitX + buttonWidth && y >= saveQuitY && y <= saveQuitY + buttonHeight;
        const quitHovered = x >= quitX && x <= quitX + buttonWidth && y >= quitY && y <= quitY + buttonHeight;
        
        this.warningCancelHovered = cancelHovered;
        this.warningSaveQuitHovered = saveQuitHovered;
        this.warningQuitHovered = quitHovered;
        
        this.stateManager.canvas.style.cursor = (cancelHovered || saveQuitHovered || quitHovered) ? 'pointer' : 'default';
    }

    handleClick(x, y) {
        // Prevent registering clicks for 200ms after opening to avoid click-through
        const timeSinceOpen = Date.now() - this.openTime;
        if (timeSinceOpen < 200) {
            return;
        }
        
        const canvas = this.stateManager.canvas;
        
        if (this.activeWarningDialog) {
            this.handleWarningDialogClick(x, y);
            return;
        }
        
        const menuPadding = 30;
        const menuWidth = this.buttonWidth + menuPadding * 2;
        const menuHeight = this.buttons.length * (this.buttonHeight + this.buttonGap) + this.buttonMarginTop + menuPadding * 2;
        const menuX = canvas.width / 2 - menuWidth / 2;
        const menuY = canvas.height / 2 - menuHeight / 2;

        const closeButtonX = menuX + menuWidth - 35;
        const closeButtonY = menuY + 10;
        const closeButtonSize = 25;
        if (x >= closeButtonX && x <= closeButtonX + closeButtonSize &&
            y >= closeButtonY && y <= closeButtonY + closeButtonSize) {
            if (this.stateManager.audioManager) {
                this.stateManager.audioManager.playSFX('button-click');
            }
            this.close();
            return;
        }

        for (let i = 0; i < this.buttons.length; i++) {
            const button = this.buttons[i];
            const buttonX = menuX + menuPadding;
            const buttonY = menuY + this.buttonMarginTop + i * (this.buttonHeight + this.buttonGap);

            if (x >= buttonX && x <= buttonX + this.buttonWidth &&
                y >= buttonY && y <= buttonY + this.buttonHeight) {
                
                // Play button click SFX
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
                
                this.handleButtonAction(button.action);
                return;
            }
        }
    }

    handleWarningDialogClick(x, y) {
        const canvas = this.stateManager.canvas;
        const dialogWidth = 480;
        const dialogHeight = 220;
        const dialogX = canvas.width / 2 - dialogWidth / 2;
        const dialogY = canvas.height / 2 - dialogHeight / 2;
        const buttonWidth = 130;
        const buttonHeight = 45;
        const buttonGap = 15;
        
        // Button positions
        const totalButtonWidth = buttonWidth * 3 + buttonGap * 2;
        const buttonsStartX = dialogX + (dialogWidth - totalButtonWidth) / 2;
        
        const cancelX = buttonsStartX;
        const cancelY = dialogY + 130;
        
        const saveQuitX = buttonsStartX + buttonWidth + buttonGap;
        const saveQuitY = dialogY + 130;
        
        const quitX = buttonsStartX + (buttonWidth + buttonGap) * 2;
        const quitY = dialogY + 130;
        
        // Play button click
        if (this.stateManager.audioManager) {
            this.stateManager.audioManager.playSFX('button-click');
        }
        
        // Check Cancel button
        if (x >= cancelX && x <= cancelX + buttonWidth && y >= cancelY && y <= cancelY + buttonHeight) {
            this.activeWarningDialog = null;
            return;
        }
        
        // Check Save & Quit button
        if (x >= saveQuitX && x <= saveQuitX + buttonWidth && y >= saveQuitY && y <= saveQuitY + buttonHeight) {
            this.executeWarningAction('saveAndQuit');
            return;
        }
        
        // Check Quit button
        if (x >= quitX && x <= quitX + buttonWidth && y >= quitY && y <= quitY + buttonHeight) {
            this.executeWarningAction('quit');
            return;
        }
    }

    handleButtonAction(action) {
        switch (action) {
            case 'save':
                this.saveSettlement();
                break;
            case 'load':
                this.loadSettlement();
                break;
            case 'options':
                this.openOptions();
                break;
            case 'quitSettlement':
                this.activeWarningDialog = 'quitSettlement';
                break;
            case 'quitTouwers':
                this.activeWarningDialog = 'quitTouwers';
                break;
            case 'close':
                this.close();
                break;
        }
    }

    saveSettlement() {
        // Save the current game state
        if (this.stateManager.saveSystem) {
            // Save to the current slot (we need to track which slot was used)
            const currentSlot = SaveSystem.getCurrentSlot ? SaveSystem.getCurrentSlot() : 1;
            SaveSystem.saveGame(currentSlot);
        }
        
        // Close the menu
        this.close();
    }

    loadSettlement() {
        // Close menu and transition to load screen
        this.close();
        
        // Set previous state so options menu knows to return here
        this.stateManager.previousState = 'settlementHub';
        this.stateManager.changeState('loadGame');
    }

    openOptions() {
        // Close this menu and open options
        this.close();
        
        // Set previous state so options menu knows to return to settlement hub
        this.stateManager.previousState = 'settlementHub';
        this.stateManager.changeState('options');
    }

    executeWarningAction(action) {
        switch (action) {
            case 'quit':
                if (this.activeWarningDialog === 'quitSettlement') {
                    this.quitSettlement();
                } else if (this.activeWarningDialog === 'quitTouwers') {
                    this.quitTouwers(); // Will execute async in background
                }
                break;
            case 'saveAndQuit':
                if (this.stateManager.saveSystem) {
                    const currentSlot = SaveSystem.getCurrentSlot ? SaveSystem.getCurrentSlot() : 1;
                    SaveSystem.saveGame(currentSlot);
                }
                if (this.activeWarningDialog === 'quitSettlement') {
                    this.quitSettlement();
                } else if (this.activeWarningDialog === 'quitTouwers') {
                    this.quitTouwers(); // Will execute async in background
                }
                break;
        }
    }

    quitSettlement() {
        this.stateManager.changeState('mainMenu');
    }

    async quitTouwers() {
        try {
            
            // Trigger game shutdown cleanup first
            if (this.stateManager && this.stateManager.game && this.stateManager.game.shutdown) {
                this.stateManager.game.shutdown();
            }
            
            // Give a brief moment for cleanup to propagate
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Check if invoke is available
            if (invoke) {
                try {
                    const result = await invoke('close_app');
                } catch (invokeError) {
                    throw invokeError;
                }
            } else {
                // Fallback - attempt window.close() even though it will likely fail
                window.close();
            }
        } catch (error) {
            const errMsg = 'SettlementHub: Error - ' + error.message;
            console.error(errMsg, error);
        }
    }

    render(ctx) {
        const canvas = this.stateManager.canvas;
        
        // Menu dimensions
        const menuPadding = 30;
        const menuWidth = this.buttonWidth + menuPadding * 2;
        const menuHeight = this.buttons.length * (this.buttonHeight + this.buttonGap) + this.buttonMarginTop + menuPadding * 2;
        const menuX = canvas.width / 2 - menuWidth / 2;
        const menuY = canvas.height / 2 - menuHeight / 2;

        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Menu background with border
        ctx.fillStyle = '#2a1a0f';
        ctx.fillRect(menuX, menuY, menuWidth, menuHeight);

        // Menu border
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 3;
        ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

        // Decorative corner accents
        const accentSize = 15;
        const accentColor = '#d4af37';
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        
        // Top-left
        ctx.beginPath();
        ctx.moveTo(menuX, menuY + accentSize);
        ctx.lineTo(menuX, menuY);
        ctx.lineTo(menuX + accentSize, menuY);
        ctx.stroke();
        
        // Top-right
        ctx.beginPath();
        ctx.moveTo(menuX + menuWidth - accentSize, menuY);
        ctx.lineTo(menuX + menuWidth, menuY);
        ctx.lineTo(menuX + menuWidth, menuY + accentSize);
        ctx.stroke();
        
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(menuX, menuY + menuHeight - accentSize);
        ctx.lineTo(menuX, menuY + menuHeight);
        ctx.lineTo(menuX + accentSize, menuY + menuHeight);
        ctx.stroke();
        
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(menuX + menuWidth - accentSize, menuY + menuHeight);
        ctx.lineTo(menuX + menuWidth, menuY + menuHeight);
        ctx.lineTo(menuX + menuWidth, menuY + menuHeight - accentSize);
        ctx.stroke();

        // Menu title
        ctx.font = 'bold 22px serif';
        ctx.fillStyle = '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // Title shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillText('MANAGE SETTLEMENT', menuX + menuWidth / 2 + 1, menuY + 12 + 1);
        
        // Title
        ctx.fillStyle = '#ffd700';
        ctx.fillText('MANAGE SETTLEMENT', menuX + menuWidth / 2, menuY + 12);

        // Render buttons
        this.buttons.forEach((button, index) => {
            const buttonX = menuX + menuPadding;
            const buttonY = menuY + this.buttonMarginTop + index * (this.buttonHeight + this.buttonGap);

            // Button background gradient
            const bgGradient = ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + this.buttonHeight);
            bgGradient.addColorStop(0, button.hovered ? '#5a4030' : '#44301c');
            bgGradient.addColorStop(1, button.hovered ? '#3a2410' : '#261200');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(buttonX, buttonY, this.buttonWidth, this.buttonHeight);

            // Button border - highlight when hovered
            ctx.strokeStyle = button.hovered ? '#ffd700' : '#8b7355';
            ctx.lineWidth = button.hovered ? 3 : 2;
            ctx.strokeRect(buttonX, buttonY, this.buttonWidth, this.buttonHeight);

            // Top highlight line for beveled effect
            ctx.strokeStyle = button.hovered ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(buttonX, buttonY);
            ctx.lineTo(buttonX + this.buttonWidth, buttonY);
            ctx.stroke();

            // Inset shadow
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(buttonX, buttonY + this.buttonHeight);
            ctx.lineTo(buttonX + this.buttonWidth, buttonY + this.buttonHeight);
            ctx.stroke();

            // Button text
            ctx.font = 'bold 15px Trebuchet MS, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Text shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillText(button.label, buttonX + this.buttonWidth / 2 + 1, buttonY + this.buttonHeight / 2 + 1);
            
            // Main text
            ctx.fillStyle = button.hovered ? '#ffd700' : '#d4af37';
            ctx.fillText(button.label, buttonX + this.buttonWidth / 2, buttonY + this.buttonHeight / 2);
        });

        // Close (X) button — top-right corner, same style as other menus
        const closeButtonX = menuX + menuWidth - 35;
        const closeButtonY = menuY + 10;
        const closeButtonSize = 25;
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.fillStyle = this.closeButtonHovered ? '#ff6666' : '#cc0000';
        ctx.fillRect(closeButtonX, closeButtonY, closeButtonSize, closeButtonSize);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(closeButtonX, closeButtonY, closeButtonSize, closeButtonSize);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\xD7', closeButtonX + closeButtonSize / 2, closeButtonY + closeButtonSize / 2 + 1);
        ctx.restore();

        // Render warning dialog if active
        if (this.activeWarningDialog) {
            this.renderWarningDialog(ctx);
        }

        ctx.globalAlpha = 1;
    }

    renderWarningDialog(ctx) {
        const canvas = this.stateManager.canvas;
        const dialogWidth = 480;
        const dialogHeight = 220;
        const dialogX = canvas.width / 2 - dialogWidth / 2;
        const dialogY = canvas.height / 2 - dialogHeight / 2;
        const buttonWidth = 130;
        const buttonHeight = 45;
        const buttonGap = 15;

        // Semi-transparent background (darker)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(dialogX, dialogY, dialogWidth, dialogHeight);

        // Dialog border
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.strokeRect(dialogX, dialogY, dialogWidth, dialogHeight);

        // Dialog title
        const titleText = this.activeWarningDialog === 'quitSettlement' 
            ? 'QUIT SETTLEMENT?' 
            : 'QUIT TOUWERS?';
        
        ctx.font = 'bold 24px serif';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // Title shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillText(titleText, dialogX + dialogWidth / 2 + 1, dialogY + 18 + 1);
        
        // Title
        ctx.fillStyle = '#ffd700';
        ctx.fillText(titleText, dialogX + dialogWidth / 2, dialogY + 18);

        // Warning message
        const messageText = this.activeWarningDialog === 'quitSettlement'
            ? 'Return to main menu?'
            : 'Close the game?';
        
        ctx.font = '16px Arial';
        ctx.fillStyle = '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(messageText, dialogX + dialogWidth / 2, dialogY + 65);

        // Buttons in warning dialog - centered row
        const totalButtonWidth = buttonWidth * 3 + buttonGap * 2;
        const buttonsStartX = dialogX + (dialogWidth - totalButtonWidth) / 2;
        
        const cancelX = buttonsStartX;
        const cancelY = dialogY + 130;
        
        const saveQuitX = buttonsStartX + buttonWidth + buttonGap;
        const saveQuitY = dialogY + 130;
        
        const quitX = buttonsStartX + (buttonWidth + buttonGap) * 2;
        const quitY = dialogY + 130;

        // Helper function to render warning dialog buttons
        const renderWarningButton = (x, y, label, hovered) => {
            // Button background
            const bgGradient = ctx.createLinearGradient(x, y, x, y + buttonHeight);
            bgGradient.addColorStop(0, hovered ? '#5a4030' : '#44301c');
            bgGradient.addColorStop(1, hovered ? '#3a2410' : '#261200');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(x, y, buttonWidth, buttonHeight);

            // Border
            ctx.strokeStyle = hovered ? '#ffd700' : '#8b7355';
            ctx.lineWidth = hovered ? 3 : 2;
            ctx.strokeRect(x, y, buttonWidth, buttonHeight);

            // Top highlight
            ctx.strokeStyle = hovered ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + buttonWidth, y);
            ctx.stroke();

            // Inset shadow
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, y + buttonHeight);
            ctx.lineTo(x + buttonWidth, y + buttonHeight);
            ctx.stroke();

            // Text
            ctx.font = 'bold 13px Trebuchet MS, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillText(label, x + buttonWidth / 2 + 1, y + buttonHeight / 2 + 1);
            ctx.fillStyle = hovered ? '#ffd700' : '#d4af37';
            ctx.fillText(label, x + buttonWidth / 2, y + buttonHeight / 2);
        };

        renderWarningButton(cancelX, cancelY, 'CANCEL', this.warningCancelHovered);
        renderWarningButton(saveQuitX, saveQuitY, 'SAVE & QUIT', this.warningSaveQuitHovered);
        renderWarningButton(quitX, quitY, 'QUIT', this.warningQuitHovered);
    }
}

/**
 * Arcane Knowledge Menu
 * Placeholder menu for tracking magical knowledge, enemy encounters and statistics
 */
class ArcaneLibraryMenu {
    constructor(stateManager, settlementHub) {
        this.stateManager = stateManager;
        this.settlementHub = settlementHub;
        this.isOpen = false;
        this.animationProgress = 0;
        this.openTime = 0; // Track when menu was opened to prevent click-through
        
        // Initialize GameStatistics if not already done
        if (!this.stateManager.gameStatistics) {
            this.stateManager.gameStatistics = new GameStatistics();
        }
        
        // Tab system
        this.tabs = [
            { label: 'STATISTICS', id: 'statistics', hovered: false },
            { label: 'MUSICAL SCORES', id: 'musical-scores', hovered: false },
            { label: 'ACHIEVEMENTS', id: 'achievements', hovered: false },
            { label: 'ENEMY INTEL', id: 'enemy-intel', hovered: false }
        ];
        this.activeTab = 'statistics';
        
        // Pagination for musical scores
        this.musicCurrentPage = 0;
        this.musicItemsPerPage = 6; // 2 rows x 3 columns
        this.unlockedMusicTracks = new Map(); // Track which music the player owns
        
        // Pagination for enemy intel
        this.intelCurrentPage = 0;
        this.intelItemsPerPage = 9; // list view, up to 9 per page
        this.intelLeftArrowHovered = false;
        this.intelRightArrowHovered = false;
        this.hoveredEnemyId = null;
        this.selectedEnemyId = null;
        // Image cache for enemy portraits
        this.enemyImageCache = {};
        this._loadEnemyImages();
        
        // Achievements (placeholder achievements)
        this.achievements = [
            { id: 'first-victory', name: 'First Victory', description: 'Win your first level', icon: '●', unlocked: false },
            { id: 'ten-victories', name: 'Victory Streak', description: 'Win 10 levels', icon: '●', unlocked: false },
            { id: 'fifty-kills', name: 'Deadly Force', description: 'Slay 50 enemies', icon: '▸', unlocked: false },
            { id: 'gold-hoarder', name: 'Gold Hoarder', description: 'Accumulate 5000 gold', icon: '◆', unlocked: false },
            { id: 'collector', name: 'Collector', description: 'Sell 20 items', icon: '◈', unlocked: false },
            { id: 'tower-master', name: 'Tower Master', description: 'Build 100 towers', icon: '■', unlocked: false }
        ];
        
        this.closeButtonHovered = false;
        this.leftArrowHovered = false;
        this.rightArrowHovered = false;
    }

    open() {
        this.isOpen = true;
        this.animationProgress = 0;
        this.openTime = Date.now(); // Record when menu was opened
        this.activeTab = 'statistics';
        this.musicCurrentPage = 0;
        this.intelCurrentPage = 0;
        this.selectedEnemyId = null;
        this.hoveredEnemyId = null;
        this.buildUnlockedMusicList();
    }

    close() {
        this.isOpen = false;
        this.settlementHub.closePopup();
    }

    _loadEnemyImages() {
        const allEnemies = EnemyIntelRegistry.getAllEnemyIntel();
        for (const [id, data] of Object.entries(allEnemies)) {
            if (data.image && !this.enemyImageCache[id]) {
                const img = new Image();
                img.onload = () => { this.enemyImageCache[id] = img; };
                img.onerror = () => { this.enemyImageCache[id] = null; };
                img.src = data.image;
            }
        }
    }

    buildUnlockedMusicList() {
        this.unlockedMusicTracks.clear();
        // Get purchased music items from marketplace system
        if (this.stateManager.marketplaceSystem) {
            const musicItems = MarketplaceRegistry.getItemsByCategory('music');
            for (const [itemId, itemData] of Object.entries(musicItems)) {
                const count = this.stateManager.marketplaceSystem.getConsumableCount(itemId);
                if (count > 0) {
                    this.unlockedMusicTracks.set(itemData.musicId, {
                        id: itemId,
                        name: itemData.name,
                        musicId: itemData.musicId,
                        isPlaying: false
                    });
                }
            }
        }
    }

    update(deltaTime) {
        if (this.isOpen && this.animationProgress < 1) {
            this.animationProgress += deltaTime * 2;
        }
    }

    updateHoverState(x, y) {
        const canvas = this.stateManager.canvas;
        const menuX = canvas.width / 2 - 400;
        const menuY = canvas.height / 2 - 250;
        const menuWidth = 800;
        const menuHeight = 500;
        
        // Close button
        const closeButtonX = menuX + menuWidth - 35;
        const closeButtonY = menuY + 10;
        const closeButtonSize = 25;
        
        this.closeButtonHovered = x >= closeButtonX && x <= closeButtonX + closeButtonSize &&
                                 y >= closeButtonY && y <= closeButtonY + closeButtonSize;
        
        // Tab buttons
        const tabHeight = 35;
        const tabStartY = menuY + 35;
        const tabButtonWidth = menuWidth / 4;
        
        this.tabs.forEach((tab, index) => {
            const tabX = menuX + index * tabButtonWidth;
            const tabY = tabStartY;
            tab.hovered = x >= tabX && x <= tabX + tabButtonWidth &&
                         y >= tabY && y <= tabY + tabHeight;
        });
        
        // Content area hover detection for musical-scores tab
        if (this.activeTab === 'musical-scores') {
            const contentX = menuX + 20;
            const contentY = tabStartY + tabHeight + 20;
            const contentWidth = menuWidth - 40;
            const contentHeight = menuHeight - tabHeight - 80;
            
            // Arrow buttons
            this.leftArrowHovered = false;
            this.rightArrowHovered = false;
            
            // Grid layout matching render method
            const cols = 3;
            const rows = 2;
            const itemSize = 100;
            const padding = 15;
            const startX = contentX + (contentWidth - cols * (itemSize + padding)) / 2;
            const startY = contentY + 20;
            
            const musicArray = Array.from(this.unlockedMusicTracks.values());
            const startIdx = this.musicCurrentPage * this.musicItemsPerPage;
            const endIdx = Math.min(startIdx + this.musicItemsPerPage, musicArray.length);
            
            // Check if hovering over a music item
            let musicItemHovered = false;
            for (let i = startIdx; i < endIdx; i++) {
                const gridIdx = i - startIdx;
                const col = gridIdx % cols;
                const row = Math.floor(gridIdx / cols);
                
                const itemX = startX + col * (itemSize + padding);
                const itemY = startY + row * (itemSize + padding);
                
                if (x >= itemX && x <= itemX + itemSize && y >= itemY && y <= itemY + itemSize) {
                    musicItemHovered = true;
                    break;
                }
            }
            
            const totalPages = Math.ceil(this.unlockedMusicTracks.size / this.musicItemsPerPage);
            if (totalPages > 1) {
                const arrowSize = 30;
                const leftArrowX = contentX - 40;
                const rightArrowX = contentX + contentWidth + 10;
                const arrowY = contentY + (contentHeight / 2) - (arrowSize / 2);
                
                this.leftArrowHovered = x >= leftArrowX && x <= leftArrowX + arrowSize &&
                                      y >= arrowY && y <= arrowY + arrowSize &&
                                      this.musicCurrentPage > 0;
                
                this.rightArrowHovered = x >= rightArrowX && x <= rightArrowX + arrowSize &&
                                        y >= arrowY && y <= arrowY + arrowSize &&
                                        this.musicCurrentPage < totalPages - 1;
            }
            
            this.stateManager.canvas.style.cursor =
                (this.tabs.some(t => t.hovered) || this.closeButtonHovered || 
                 this.leftArrowHovered || this.rightArrowHovered || musicItemHovered) ? 'pointer' : 'default';
            return;
        }
        
        // Content area hover detection for enemy-intel tab
        if (this.activeTab === 'enemy-intel') {
            this.intelLeftArrowHovered = false;
            this.intelRightArrowHovered = false;
            this.hoveredEnemyId = null;
            
            const contentX = menuX + 20;
            const contentY = tabStartY + tabHeight + 20;
            const contentWidth = menuWidth - 40;
            const contentHeight = menuHeight - tabHeight - 80;

            // List panel: left 230px
            const listW = 230;
            const listX = contentX;
            const btnH = 36;
            const btnGap = 4;
            
            // Get unlocked enemy intel
            const unlockedIntelPacks = this.settlementHub?.stateManager?.marketplaceSystem?.getUnlockedEnemyIntel() || [];
            const unlockedEnemies = EnemyIntelRegistry.getUnlockedEnemies(unlockedIntelPacks);
            
            if (unlockedEnemies.length > 0) {
                const itemsPerPage = this.intelItemsPerPage;
                const totalPages = Math.ceil(unlockedEnemies.length / itemsPerPage);
                const startIdx = this.intelCurrentPage * itemsPerPage;
                const endIdx = Math.min(startIdx + itemsPerPage, unlockedEnemies.length);
                let pointerNeeded = false;

                for (let i = startIdx; i < endIdx; i++) {
                    const rowIdx = i - startIdx;
                    const btnY = contentY + 8 + rowIdx * (btnH + btnGap);
                    if (x >= listX && x <= listX + listW && y >= btnY && y <= btnY + btnH) {
                        this.hoveredEnemyId = unlockedEnemies[i];
                        pointerNeeded = true;
                    }
                }

                if (totalPages > 1) {
                    const arrowY = contentY + contentHeight - 34;
                    const leftArrowX = contentX + 8;
                    const rightArrowX = contentX + listW - 34;
                    const arrowSize = 26;
                    this.intelLeftArrowHovered = x >= leftArrowX && x <= leftArrowX + arrowSize &&
                                              y >= arrowY && y <= arrowY + arrowSize &&
                                              this.intelCurrentPage > 0;
                    this.intelRightArrowHovered = x >= rightArrowX && x <= rightArrowX + arrowSize &&
                                                y >= arrowY && y <= arrowY + arrowSize &&
                                                this.intelCurrentPage < totalPages - 1;
                    if (this.intelLeftArrowHovered || this.intelRightArrowHovered) pointerNeeded = true;
                }

                this.stateManager.canvas.style.cursor =
                    (this.tabs.some(t => t.hovered) || this.closeButtonHovered || pointerNeeded) ? 'pointer' : 'default';
            } else {
                this.stateManager.canvas.style.cursor =
                    (this.tabs.some(t => t.hovered) || this.closeButtonHovered) ? 'pointer' : 'default';
            }
            return;
        }
        
        // Default cursor for other tabs
        this.stateManager.canvas.style.cursor = (this.tabs.some(t => t.hovered) || this.closeButtonHovered) ? 'pointer' : 'default';
    }

    handleClick(x, y) {
        // Prevent registering clicks for 200ms after opening to avoid click-through
        const timeSinceOpen = Date.now() - this.openTime;
        if (timeSinceOpen < 200) {
            return;
        }
        
        const canvas = this.stateManager.canvas;
        const menuX = canvas.width / 2 - 400;
        const menuY = canvas.height / 2 - 250;
        const menuWidth = 800;
        const menuHeight = 500;
        
        // Close button
        const closeButtonX = menuX + menuWidth - 35;
        const closeButtonY = menuY + 10;
        const closeButtonSize = 25;
        
        if (x >= closeButtonX && x <= closeButtonX + closeButtonSize &&
            y >= closeButtonY && y <= closeButtonY + closeButtonSize) {
            this.close();
            return;
        }
        
        // Tab buttons
        const tabHeight = 35;
        const tabStartY = menuY + 35;
        const tabButtonWidth = menuWidth / 4;
        
        for (let i = 0; i < this.tabs.length; i++) {
            const tab = this.tabs[i];
            const tabX = menuX + i * tabButtonWidth;
            const tabY = tabStartY;
            
            if (x >= tabX && x <= tabX + tabButtonWidth &&
                y >= tabY && y <= tabY + tabHeight) {
                this.activeTab = tab.id;
                this.musicCurrentPage = 0; // Reset pagination when switching tabs
                return;
            }
        }
        
        // Handle content area clicks
        if (this.activeTab === 'musical-scores') {
            const contentX = menuX + 20;
            const contentY = tabStartY + tabHeight + 20;
            const contentWidth = menuWidth - 40;
            const contentHeight = menuHeight - tabHeight - 80;
            
            // Grid layout matching render method
            const cols = 3;
            const rows = 2;
            const itemSize = 100;
            const padding = 15;
            const startX = contentX + (contentWidth - cols * (itemSize + padding)) / 2;
            const startY = contentY + 20;
            
            const musicArray = Array.from(this.unlockedMusicTracks.values());
            const startIdx = this.musicCurrentPage * this.musicItemsPerPage;
            const endIdx = Math.min(startIdx + this.musicItemsPerPage, musicArray.length);
            
            // Check if clicked on a music item
            for (let i = startIdx; i < endIdx; i++) {
                const gridIdx = i - startIdx;
                const col = gridIdx % cols;
                const row = Math.floor(gridIdx / cols);
                
                const itemX = startX + col * (itemSize + padding);
                const itemY = startY + row * (itemSize + padding);
                
                if (x >= itemX && x <= itemX + itemSize && y >= itemY && y <= itemY + itemSize) {
                    const music = musicArray[i];
                    this.playMusicTrack(music);
                    return;
                }
            }
            
            // Check arrow clicks
            const totalPages = Math.ceil(this.unlockedMusicTracks.size / this.musicItemsPerPage);
            if (totalPages > 1) {
                const arrowSize = 30;
                const leftArrowX = contentX - 40;
                const rightArrowX = contentX + contentWidth + 10;
                const arrowY = contentY + (contentHeight / 2) - (arrowSize / 2);
                
                if (x >= leftArrowX && x <= leftArrowX + arrowSize &&
                    y >= arrowY && y <= arrowY + arrowSize &&
                    this.musicCurrentPage > 0) {
                    this.musicCurrentPage--;
                    return;
                }
                
                if (x >= rightArrowX && x <= rightArrowX + arrowSize &&
                    y >= arrowY && y <= arrowY + arrowSize &&
                    this.musicCurrentPage < totalPages - 1) {
                    this.musicCurrentPage++;
                    return;
                }
            }
        }
        
        // Handle enemy intel tab clicks
        if (this.activeTab === 'enemy-intel') {
            const contentX = menuX + 20;
            const contentY = tabStartY + tabHeight + 20;
            const contentWidth = menuWidth - 40;
            const contentHeight = menuHeight - tabHeight - 80;
            const listW = 230;
            const btnH = 36;
            const btnGap = 4;
            
            // Get unlocked enemy intel
            const unlockedIntelPacks = this.settlementHub?.stateManager?.marketplaceSystem?.getUnlockedEnemyIntel() || [];
            const unlockedEnemies = EnemyIntelRegistry.getUnlockedEnemies(unlockedIntelPacks);
            
            if (unlockedEnemies.length > 0) {
                const itemsPerPage = this.intelItemsPerPage;
                const totalPages = Math.ceil(unlockedEnemies.length / itemsPerPage);
                const startIdx = this.intelCurrentPage * itemsPerPage;
                const endIdx = Math.min(startIdx + itemsPerPage, unlockedEnemies.length);

                // Check enemy button clicks
                for (let i = startIdx; i < endIdx; i++) {
                    const rowIdx = i - startIdx;
                    const btnY = contentY + 8 + rowIdx * (btnH + btnGap);
                    if (x >= contentX && x <= contentX + listW && y >= btnY && y <= btnY + btnH) {
                        this.selectedEnemyId = unlockedEnemies[i];
                        return;
                    }
                }

                // Pagination arrow clicks
                if (totalPages > 1) {
                    const arrowY = contentY + contentHeight - 34;
                    const leftArrowX = contentX + 8;
                    const rightArrowX = contentX + listW - 34;
                    const arrowSize = 26;
                    
                    if (x >= leftArrowX && x <= leftArrowX + arrowSize &&
                        y >= arrowY && y <= arrowY + arrowSize &&
                        this.intelCurrentPage > 0) {
                        this.intelCurrentPage--;
                        this.selectedEnemyId = null;
                        return;
                    }
                    
                    if (x >= rightArrowX && x <= rightArrowX + arrowSize &&
                        y >= arrowY && y <= arrowY + arrowSize &&
                        this.intelCurrentPage < totalPages - 1) {
                        this.intelCurrentPage++;
                        this.selectedEnemyId = null;
                        return;
                    }
                }
            }
        }
    }

    playMusicTrack(music) {
        // Stop playlist mode if active (to play single track on loop)
        if (this.stateManager.audioManager) {
            this.stateManager.audioManager.musicPlaylistMode = false;
        }

        // Play the selected music track on loop
        if (this.stateManager.audioManager) {
            this.stateManager.audioManager.playMusic(music.musicId, false);
            // Mark that we're in manual music selection mode (not auto settlement theme)
            this.stateManager.audioManager.isManualMusicSelection = true;
        }
    }

    /**
     * Draw decorative golden corner trim on panel corners
     */
    drawCornerTrim(ctx, x, y, size = 15, isTopLeft = true, isTopRight = false, isBottomLeft = false, isBottomRight = false) {
        const cornerSize = size;
        
        // Draw corner rectangle with golden color
        ctx.fillStyle = '#d4af37';
        
        if (isTopLeft) {
            ctx.fillRect(x, y, cornerSize, 3);
            ctx.fillRect(x, y, 3, cornerSize);
        } else if (isTopRight) {
            ctx.fillRect(x - cornerSize, y, cornerSize, 3);
            ctx.fillRect(x - 3, y, 3, cornerSize);
        } else if (isBottomLeft) {
            ctx.fillRect(x, y - 3, cornerSize, 3);
            ctx.fillRect(x, y - cornerSize, 3, cornerSize);
        } else if (isBottomRight) {
            ctx.fillRect(x - cornerSize, y - 3, cornerSize, 3);
            ctx.fillRect(x - 3, y - cornerSize, 3, cornerSize);
        }
        
        // Add a small decorative gem/circle in each corner
        ctx.fillStyle = '#ffd700';
        const gemSize = 4;
        if (isTopLeft) {
            ctx.beginPath();
            ctx.arc(x + gemSize, y + gemSize, gemSize / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (isTopRight) {
            ctx.beginPath();
            ctx.arc(x - gemSize, y + gemSize, gemSize / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (isBottomLeft) {
            ctx.beginPath();
            ctx.arc(x + gemSize, y - gemSize, gemSize / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (isBottomRight) {
            ctx.beginPath();
            ctx.arc(x - gemSize, y - gemSize, gemSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    render(ctx) {
        const canvas = this.stateManager.canvas;
        const menuX = canvas.width / 2 - 400;
        const menuY = canvas.height / 2 - 250;
        const menuWidth = 800;
        const menuHeight = 500;
        
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Menu background
        ctx.fillStyle = '#2a1a0f';
        ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
        
        // Menu border
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 2;
        ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);
        
        // Draw corner trim on all four corners
        this.drawCornerTrim(ctx, menuX, menuY, 15, true, false, false, false);  // Top-left
        this.drawCornerTrim(ctx, menuX + menuWidth, menuY, 15, false, true, false, false);  // Top-right
        this.drawCornerTrim(ctx, menuX, menuY + menuHeight, 15, false, false, true, false);  // Bottom-left
        this.drawCornerTrim(ctx, menuX + menuWidth, menuY + menuHeight, 15, false, false, false, true);  // Bottom-right
        
        // Menu title
        ctx.font = 'bold 24px serif';
        ctx.fillStyle = '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('ARCANE LIBRARY', menuX + menuWidth / 2, menuY + 8);
        
        // Render tabs
        const tabHeight = 35;
        const tabStartY = menuY + 35;
        const tabButtonWidth = menuWidth / 4;
        
        this.tabs.forEach((tab, index) => {
            const tabX = menuX + index * tabButtonWidth;
            const tabY = tabStartY;
            
            // Tab background
            const isActive = this.activeTab === tab.id;
            ctx.fillStyle = isActive ? '#3d2817' : '#261200';
            ctx.fillRect(tabX, tabY, tabButtonWidth, tabHeight);
            
            // Tab border
            ctx.strokeStyle = isActive ? '#d4af37' : '#8b7355';
            ctx.lineWidth = isActive ? 2 : 1;
            ctx.strokeRect(tabX, tabY, tabButtonWidth, tabHeight);
            
            // Tab text
            ctx.font = isActive ? 'bold 12px Trebuchet MS, sans-serif' : '12px Trebuchet MS, sans-serif';
            ctx.fillStyle = isActive ? '#ffd700' : '#d4af37';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tab.label, tabX + tabButtonWidth / 2, tabY + tabHeight / 2);
        });
        
        // Content area
        const contentX = menuX + 20;
        const contentY = tabStartY + tabHeight + 20;
        const contentWidth = menuWidth - 40;
        const contentHeight = menuHeight - tabHeight - 80;
        
        // Content background
        ctx.fillStyle = '#1a0f0a';
        ctx.fillRect(contentX, contentY, contentWidth, contentHeight);
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 1;
        ctx.strokeRect(contentX, contentY, contentWidth, contentHeight);
        
        // Render active tab content
        if (this.activeTab === 'statistics') {
            this.renderStatisticsTab(ctx, contentX, contentY, contentWidth, contentHeight);
        } else if (this.activeTab === 'musical-scores') {
            this.renderMusicalScoresTab(ctx, contentX, contentY, contentWidth, contentHeight);
        } else if (this.activeTab === 'achievements') {
            this.renderAchievementsTab(ctx, contentX, contentY, contentWidth, contentHeight);
        } else if (this.activeTab === 'enemy-intel') {
            this.renderEnemyIntelTab(ctx, contentX, contentY, contentWidth, contentHeight);
        }
        
        // Red X close button at top right
        const closeButtonX = menuX + menuWidth - 35;
        const closeButtonY = menuY + 10;
        const closeButtonSize = 25;
        
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.setTransform ? ctx.setTransform(1, 0, 0, 1, 0, 0) : undefined;
        ctx.fillStyle = this.closeButtonHovered ? '#ff6666' : '#cc0000';
        ctx.fillRect(closeButtonX, closeButtonY, closeButtonSize, closeButtonSize);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(closeButtonX, closeButtonY, closeButtonSize, closeButtonSize);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\xD7', closeButtonX + closeButtonSize / 2, closeButtonY + closeButtonSize / 2 + 1);
        ctx.restore();
        
        ctx.globalAlpha = 1;
    }

    renderStatisticsTab(ctx, x, y, width, height) {
        const stats = this.stateManager.gameStatistics || { 
            victories: 0, defeats: 0, totalEnemiesSlain: 0, 
            totalPlaytime: 0, totalItemsConsumed: 0,
            totalMoneySpentOnMarketplace: 0, totalMoneyEarnedInMarketplace: 0,
            totalItemsSold: 0,
            getWinRate: () => 0, getFormattedPlaytime: () => '0s'
        };
        
        const padding = 20;
        const lineHeight = 28;
        let currentY = y + padding;
        
        ctx.font = '14px Trebuchet MS, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        const stats_data = [
            { label: 'Victories:', value: stats.victories },
            { label: 'Defeats:', value: stats.defeats },
            { label: 'Win Rate:', value: stats.getWinRate() + '%' },
            { label: 'Enemies Slain:', value: stats.totalEnemiesSlain },
            { label: 'Playtime:', value: stats.getFormattedPlaytime() },
            { label: 'Items Consumed:', value: stats.totalItemsConsumed },
            { label: 'Items Sold:', value: stats.totalItemsSold },
            { label: 'Marketplace Spent:', value: stats.totalMoneySpentOnMarketplace + ' gold' },
            { label: 'Marketplace Earned:', value: stats.totalMoneyEarnedInMarketplace + ' gold' }
        ];
        
        stats_data.forEach(stat => {
            // Label
            ctx.fillStyle = '#d4af37';
            ctx.fillText(stat.label, x + padding, currentY);
            
            // Value
            ctx.fillStyle = '#ffd700';
            ctx.textAlign = 'right';
            ctx.fillText(String(stat.value), x + width - padding, currentY);
            ctx.textAlign = 'left';
            
            currentY += lineHeight;
        });
    }

    renderMusicalScoresTab(ctx, x, y, width, height) {
        const upgradeSystem = this.stateManager && this.stateManager.upgradeSystem;
        const hasMusicalEquipment = upgradeSystem && upgradeSystem.hasUpgrade('musical-equipment');
        if (!hasMusicalEquipment) {
            ctx.font = '16px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#8b7355';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Musical Equipment has not been purchased yet.', x + width / 2, y + height / 2 - 12);
            ctx.fillText('Buy it in the Upgrades shop to bring a Bard to the square!', x + width / 2, y + height / 2 + 13);
            return;
        }
        if (this.unlockedMusicTracks.size === 0) {
            ctx.font = '16px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#8b7355';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('No musical scores unlocked yet.', x + width / 2, y + height / 2);
            ctx.fillText('Purchase scores at the Marketplace!', x + width / 2, y + height / 2 + 25);
            return;
        }
        
        // Grid layout: 3 columns, 2 rows per page
        const cols = 3;
        const rows = 2;
        const itemSize = 100;
        const padding = 15;
        const startX = x + (width - cols * (itemSize + padding)) / 2;
        const startY = y + 20;
        
        const musicArray = Array.from(this.unlockedMusicTracks.values());
        const startIdx = this.musicCurrentPage * this.musicItemsPerPage;
        const endIdx = Math.min(startIdx + this.musicItemsPerPage, musicArray.length);
        
        for (let i = startIdx; i < endIdx; i++) {
            const music = musicArray[i];
            const gridIdx = i - startIdx;
            const col = gridIdx % cols;
            const row = Math.floor(gridIdx / cols);
            
            const itemX = startX + col * (itemSize + padding);
            const itemY = startY + row * (itemSize + padding);
            
            // Music tile background
            ctx.fillStyle = '#3d2817';
            ctx.fillRect(itemX, itemY, itemSize, itemSize);
            
            // Tile border
            ctx.strokeStyle = '#8b7355';
            ctx.lineWidth = 2;
            ctx.strokeRect(itemX, itemY, itemSize, itemSize);
            
            // Music icon - drawn with canvas
            ctx.save();
            const ncx = itemX + itemSize / 2;
            const ncy = itemY + itemSize / 3;
            const ns = 14;
            ctx.fillStyle = '#d4af37';
            ctx.strokeStyle = '#c8960a';
            ctx.beginPath();
            ctx.ellipse(ncx - ns * 0.08, ncy + ns * 0.28, ns * 0.13, ns * 0.09, -0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(ncx + ns * 0.05, ncy + ns * 0.2);
            ctx.lineTo(ncx + ns * 0.05, ncy - ns * 0.28);
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = ns * 0.04;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(ncx + ns * 0.05, ncy - ns * 0.28);
            ctx.quadraticCurveTo(ncx + ns * 0.35, ncy - ns * 0.05, ncx + ns * 0.22, ncy + ns * 0.12);
            ctx.stroke();
            ctx.restore();
            
            // Music title
            ctx.font = 'bold 10px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#ffd700';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            
            // Wrap text
            const words = music.name.split(' ');
            let line = '';
            let lineY = itemY + itemSize / 2;
            
            words.forEach(word => {
                const testLine = line + (line ? ' ' : '') + word;
                const metrics = ctx.measureText(testLine);
                if (metrics.width > itemSize - 10 && line) {
                    ctx.fillText(line, itemX + itemSize / 2, lineY);
                    line = word;
                    lineY += 12;
                } else {
                    line = testLine;
                }
            });
            ctx.fillText(line, itemX + itemSize / 2, lineY);
            
            // Play button at bottom
            const playButtonSize = 20;
            const playButtonX = itemX + itemSize / 2 - playButtonSize / 2;
            const playButtonY = itemY + itemSize - 25;
            
            // Play button background
            ctx.fillStyle = '#d4af37';
            ctx.fillRect(playButtonX, playButtonY, playButtonSize, playButtonSize);
            
            // Play button border
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.strokeRect(playButtonX, playButtonY, playButtonSize, playButtonSize);
            
            // Play icon (triangle)
            ctx.fillStyle = '#1a0f0a';
            ctx.beginPath();
            ctx.moveTo(playButtonX + 6, playButtonY + 4);
            ctx.lineTo(playButtonX + 6, playButtonY + 16);
            ctx.lineTo(playButtonX + 16, playButtonY + 10);
            ctx.closePath();
            ctx.fill();
        }
        
        // Pagination arrows if needed
        const totalPages = Math.ceil(musicArray.length / this.musicItemsPerPage);
        if (totalPages > 1) {
            const arrowSize = 30;
            const arrowY = y + height / 2 - arrowSize / 2;
            
            // Left arrow
            if (this.musicCurrentPage > 0) {
                ctx.fillStyle = this.leftArrowHovered ? '#ffd700' : '#d4af37';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('<', x - 25, arrowY + arrowSize / 2);
            }
            
            // Right arrow
            if (this.musicCurrentPage < totalPages - 1) {
                ctx.fillStyle = this.rightArrowHovered ? '#ffd700' : '#d4af37';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('>', x + width + 15, arrowY + arrowSize / 2);
            }
            
            // Page indicator
            ctx.font = '12px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#8b7355';
            ctx.textAlign = 'center';
            ctx.fillText(`Page ${this.musicCurrentPage + 1} of ${totalPages}`, x + width / 2, y + height - 15);
        }
    }

    wrapText(text, maxCharsPerLine) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        for (const word of words) {
            if ((currentLine + word).length <= maxCharsPerLine) {
                currentLine += (currentLine ? ' ' : '') + word;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines;
    }

    renderAchievementsTab(ctx, x, y, width, height) {
        // Grid layout: 3 columns, 2 rows per page (matching the screenshot)
        const cols = 3;
        const rows = 2;
        const itemWidth = 110;
        const itemHeight = 160;
        const padding = 15;
        const startX = x + (width - cols * (itemWidth + padding)) / 2;
        const startY = y + 20;
        
        for (let i = 0; i < this.achievements.length; i++) {
            const achievement = this.achievements[i];
            const col = i % cols;
            const row = Math.floor(i / cols);
            
            const itemX = startX + col * (itemWidth + padding);
            const itemY = startY + row * (itemHeight + padding);
            
            // Achievement tile background (greyed out if locked)
            ctx.fillStyle = achievement.unlocked ? '#3d2817' : '#2a1a0f';
            ctx.fillRect(itemX, itemY, itemWidth, itemHeight);
            
            // Tile border (gold if unlocked, brown if locked)
            ctx.strokeStyle = achievement.unlocked ? '#d4af37' : '#6a5a4a';
            ctx.lineWidth = 2;
            ctx.strokeRect(itemX, itemY, itemWidth, itemHeight);
            
            // Achievement icon - larger and centered
            ctx.font = 'bold 50px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = achievement.unlocked ? '#ffd700' : '#5a4a3a';
            ctx.fillText(achievement.icon, itemX + itemWidth / 2, itemY + 35);
            
            // Achievement name
            ctx.font = 'bold 11px Trebuchet MS, sans-serif';
            ctx.fillStyle = achievement.unlocked ? '#c9a876' : '#6a5a4a';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            
            const nameLines = this.wrapText(achievement.name, 11);
            let nameY = itemY + 75;
            for (const line of nameLines) {
                ctx.fillText(line, itemX + itemWidth / 2, nameY);
                nameY += 12;
            }
            
            // Progress bar at bottom
            const progressBarHeight = 8;
            const progressBarWidth = itemWidth - 10;
            const progressBarX = itemX + 5;
            const progressBarY = itemY + itemHeight - 15;
            
            // Progress bar background
            ctx.fillStyle = '#1a0f05';
            ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);
            
            // Progress bar border
            ctx.strokeStyle = achievement.unlocked ? '#d4af37' : '#6a5a4a';
            ctx.lineWidth = 1;
            ctx.strokeRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);
            
            // Progress text (placeholder: "0/10" for first, "0/100" for some, etc.)
            const progressTexts = ['0/1', '0/10', '0/50', '0/5000', '0/20', '0/100'];
            const progressText = progressTexts[i] || '0/1';
            
            ctx.font = 'bold 8px Trebuchet MS, sans-serif';
            ctx.fillStyle = achievement.unlocked ? '#d4af37' : '#8b7355';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(progressText, itemX + itemWidth / 2, progressBarY + progressBarHeight / 2);
            
            // Locked indicator overlay (if not unlocked)
            if (!achievement.unlocked) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fillRect(itemX, itemY, itemWidth, itemHeight);
            }
        }
    }

    renderEnemyIntelTab(ctx, x, y, width, height) {
        // Get unlocked enemy intel from marketplace system
        const unlockedIntelPacks = this.stateManager?.marketplaceSystem?.getUnlockedEnemyIntel() || [];
        const unlockedEnemies = EnemyIntelRegistry.getUnlockedEnemies(unlockedIntelPacks);

        // If no intel unlocked, show message
        if (unlockedEnemies.length === 0) {
            ctx.font = 'bold 14px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#8b7355';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Purchase Intel packs to unlock enemy information', x + width / 2, y + height / 2 - 20);
            ctx.font = '12px Trebuchet MS, sans-serif';
            ctx.fillText('Visit the marketplace to buy spy reports', x + width / 2, y + height / 2 + 20);
            return;
        }

        // Layout: left side = enemy list buttons, right side = detail panel
        const listW = 230;
        const gap = 10;
        const detailX = x + listW + gap;
        const detailW = width - listW - gap;
        const btnH = 36;
        const btnGap = 4;
        const itemsPerPage = this.intelItemsPerPage;
        const totalPages = Math.ceil(unlockedEnemies.length / itemsPerPage);
        const startIdx = this.intelCurrentPage * itemsPerPage;
        const endIdx = Math.min(startIdx + itemsPerPage, unlockedEnemies.length);

        // ── Enemy list buttons ───────────────────────────────────────────────
        for (let i = startIdx; i < endIdx; i++) {
            const rowIdx = i - startIdx;
            const enemyId = unlockedEnemies[i];
            const intel = EnemyIntelRegistry.getEnemyIntel(enemyId);
            if (!intel) continue;

            const btnY = y + 8 + rowIdx * (btnH + btnGap);
            const isSelected = this.selectedEnemyId === enemyId;
            const isHovered = this.hoveredEnemyId === enemyId;

            // Button background
            if (isSelected) {
                const bg = ctx.createLinearGradient(x, btnY, x, btnY + btnH);
                bg.addColorStop(0, '#5a3d1a');
                bg.addColorStop(1, '#3d2410');
                ctx.fillStyle = bg;
            } else if (isHovered) {
                ctx.fillStyle = 'rgba(80, 55, 25, 0.8)';
            } else {
                ctx.fillStyle = 'rgba(30, 18, 8, 0.7)';
            }
            ctx.fillRect(x, btnY, listW, btnH);

            // Button border
            ctx.strokeStyle = isSelected ? '#ffd700' : (isHovered ? '#c8a84b' : 'rgba(140, 110, 50, 0.5)');
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.strokeRect(x, btnY, listW, btnH);

            // Selected indicator bar on the left
            if (isSelected) {
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(x, btnY, 3, btnH);
            }

            // Thumbnail image or placeholder square
            const thumbSize = 26;
            const thumbX = x + 8;
            const thumbY = btnY + (btnH - thumbSize) / 2;
            const cachedImg = this.enemyImageCache[enemyId];
            if (cachedImg) {
                ctx.drawImage(cachedImg, thumbX, thumbY, thumbSize, thumbSize);
            } else {
                ctx.fillStyle = 'rgba(60, 40, 15, 0.9)';
                ctx.fillRect(thumbX, thumbY, thumbSize, thumbSize);
                ctx.strokeStyle = 'rgba(140, 110, 50, 0.6)';
                ctx.lineWidth = 1;
                ctx.strokeRect(thumbX, thumbY, thumbSize, thumbSize);
            }

            // Enemy name
            ctx.font = isSelected ? 'bold 12px Trebuchet MS, sans-serif' : '12px Trebuchet MS, sans-serif';
            ctx.fillStyle = isSelected ? '#ffd700' : (isHovered ? '#e8d49a' : '#c9a876');
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(intel.name, thumbX + thumbSize + 8, btnY + btnH / 2);
        }

        // Pagination arrows (below the list)
        if (totalPages > 1) {
            const arrowY = y + height - 34;
            const arrowSize = 26;
            const leftArrowX = x + 8;
            const rightArrowX = x + listW - arrowSize - 8;

            // Left arrow
            ctx.fillStyle = this.intelCurrentPage > 0
                ? (this.intelLeftArrowHovered ? '#ffd700' : '#c8a84b')
                : '#333333';
            ctx.fillRect(leftArrowX, arrowY, arrowSize, arrowSize);
            ctx.strokeStyle = '#6a501e';
            ctx.lineWidth = 1;
            ctx.strokeRect(leftArrowX, arrowY, arrowSize, arrowSize);
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = this.intelCurrentPage > 0 ? '#1a0f04' : '#555555';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('<', leftArrowX + arrowSize / 2, arrowY + arrowSize / 2);

            // Right arrow
            ctx.fillStyle = this.intelCurrentPage < totalPages - 1
                ? (this.intelRightArrowHovered ? '#ffd700' : '#c8a84b')
                : '#333333';
            ctx.fillRect(rightArrowX, arrowY, arrowSize, arrowSize);
            ctx.strokeStyle = '#6a501e';
            ctx.lineWidth = 1;
            ctx.strokeRect(rightArrowX, arrowY, arrowSize, arrowSize);
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = this.intelCurrentPage < totalPages - 1 ? '#1a0f04' : '#555555';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('>', rightArrowX + arrowSize / 2, arrowY + arrowSize / 2);

            // Page indicator
            ctx.font = '10px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#8b7355';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${this.intelCurrentPage + 1}/${totalPages}`, x + listW / 2, arrowY + arrowSize / 2);
        }

        // ── Detail panel (right side) ────────────────────────────────────────
        // Panel background
        ctx.fillStyle = 'rgba(15, 10, 4, 0.8)';
        ctx.fillRect(detailX, y, detailW, height);
        ctx.strokeStyle = 'rgba(140, 110, 50, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(detailX, y, detailW, height);

        // Show detail for selected enemy only (click to select)
        const displayId = this.selectedEnemyId;
        const intel = displayId ? EnemyIntelRegistry.getEnemyIntel(displayId) : null;

        if (!intel) {
            ctx.font = '13px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#5a4a3a';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Select an enemy to view details', detailX + detailW / 2, y + height / 2);
            return;
        }

        const pad = 14;
        let cy = y + pad;

        // Portrait image
        const portraitSize = Math.min(detailW - pad * 2, 80);
        const portraitX = detailX + (detailW - portraitSize) / 2;
        const cachedPortrait = this.enemyImageCache[displayId];
        const portraitBgX = detailX + (detailW - portraitSize) / 2;

        ctx.fillStyle = 'rgba(40, 25, 10, 0.9)';
        ctx.fillRect(portraitBgX, cy, portraitSize, portraitSize);
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(portraitBgX, cy, portraitSize, portraitSize);

        if (cachedPortrait) {
            ctx.drawImage(cachedPortrait, portraitBgX, cy, portraitSize, portraitSize);
        } else {
            // Placeholder label
            ctx.font = '10px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#4a3a28';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Portrait', portraitBgX + portraitSize / 2, cy + portraitSize / 2);
        }
        cy += portraitSize + 10;

        // Enemy name
        ctx.font = 'bold 15px Georgia, serif';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(intel.name, detailX + detailW / 2, cy);
        cy += 20;

        // Divider
        ctx.strokeStyle = 'rgba(140, 110, 50, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(detailX + pad, cy);
        ctx.lineTo(detailX + detailW - pad, cy);
        ctx.stroke();
        cy += 8;

        // Description (word-wrapped)
        ctx.font = '11px Trebuchet MS, sans-serif';
        ctx.fillStyle = '#b09060';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const descWords = intel.description.split(' ');
        let descLine = '';
        const maxDescW = detailW - pad * 2;
        for (const word of descWords) {
            const test = descLine ? descLine + ' ' + word : word;
            if (ctx.measureText(test).width > maxDescW && descLine) {
                ctx.fillText(descLine, detailX + pad, cy);
                descLine = word;
                cy += 14;
            } else {
                descLine = test;
            }
        }
        if (descLine) { ctx.fillText(descLine, detailX + pad, cy); cy += 14; }
        cy += 6;

        // Stats
        ctx.font = 'bold 11px Trebuchet MS, sans-serif';
        ctx.fillStyle = '#d4af37';
        ctx.textAlign = 'left';
        ctx.fillText('BASE STATS', detailX + pad, cy);
        cy += 14;

        const statColor = { hp: '#7ec87e', spd: '#7eafd4', dmg: '#d47e7e', arm: '#c8c8d4', mag: '#b47ec8' };
        const statRows = [
            { label: 'Health', value: intel.stats.health, color: statColor.hp },
            { label: 'Speed', value: intel.stats.speed, color: statColor.spd },
            { label: 'Armour', value: intel.stats.armour ?? 0, color: statColor.arm },
            { label: 'Damage', value: intel.stats.damage, color: statColor.dmg }
        ];
        for (const stat of statRows) {
            ctx.font = '11px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#8b7355';
            ctx.textAlign = 'left';
            ctx.fillText(stat.label + ':', detailX + pad, cy);
            ctx.fillStyle = stat.color;
            ctx.textAlign = 'right';
            ctx.fillText(String(stat.value), detailX + detailW - pad, cy);
            cy += 14;
        }
        cy += 2;

        // Magic resistance / elemental notes
        const magRes = intel.stats.magicResistance;
        if (typeof magRes === 'number' && magRes !== 0) {
            let magLabel, magColor;
            if (magRes > 0) {
                magLabel = 'Magic Resist: ' + Math.round(magRes * 100) + '%';
                magColor = statColor.mag;
            } else {
                magLabel = 'Magic Weak: +' + Math.round(-magRes * 100) + '%';
                magColor = '#d4827e';
            }
            ctx.font = '10px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#8b7355';
            ctx.textAlign = 'left';
            ctx.fillText('Magic:', detailX + pad, cy);
            ctx.fillStyle = magColor;
            ctx.textAlign = 'right';
            ctx.fillText(magLabel, detailX + detailW - pad, cy);
            cy += 14;
        }
        cy += 4;

        // Abilities
        if (intel.abilities && intel.abilities.length > 0) {
            ctx.font = 'bold 11px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#d4af37';
            ctx.textAlign = 'left';
            ctx.fillText('ABILITIES', detailX + pad, cy);
            cy += 14;
            ctx.font = '10px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#a09060';
            for (const ability of intel.abilities) {
                if (cy > y + height - pad) break;
                ctx.fillText('· ' + ability, detailX + pad + 4, cy);
                cy += 12;
            }
        }
    }

    renderCollectionTab(ctx, x, y, width, height) {
        ctx.font = '16px Trebuchet MS, sans-serif';
        ctx.fillStyle = '#8b7355';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Collection feature coming soon...', x + width / 2, y + height / 2);
    }
}



