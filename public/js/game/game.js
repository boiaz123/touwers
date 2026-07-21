import { GameStateManager } from '../core/states/GameStateManager.js';
import { LoadGame } from '../core/states/LoadGame.js';
import { SaveSlotSelection } from '../core/states/SaveSlotSelection.js';
import { OptionsMenu } from '../core/states/OptionsMenu.js';
import { MainMenu } from '../core/states/MainMenu.js';
import { SplashScreen } from '../core/states/SplashScreen.js';
import { CampaignMenu } from '../core/states/CampaignMenu.js';
import { Campaign1 } from '../entities/campaigns/Campaign1.js';
import { Campaign2 } from '../entities/campaigns/Campaign2.js';
import { Campaign3 } from '../entities/campaigns/Campaign3.js';
import { Campaign4 } from '../entities/campaigns/Campaign4.js';
import { PlayerWorkshop } from '../entities/campaigns/PlayerWorkshop.js';
import { LevelDesignerState } from '../core/states/LevelDesignerState.js';
import { GameplayState } from '../core/states/GameplayState.js';
import { SettlementHub } from '../core/states/SettlementHub.js';
import { SaveSystem } from '../core/SaveSystem.js';
import { ResolutionManager } from '../core/ResolutionManager.js';
import { ResolutionSettings } from '../core/ResolutionSettings.js';
import { CampaignRegistry } from './CampaignRegistry.js';
import { LevelRegistry } from '../entities/levels/LevelRegistry.js';
import { SandboxLevel } from '../entities/levels/SandboxLevel.js';
import { AudioManager } from '../core/AudioManager.js';
import { MusicRegistry, initializeMusicRegistry } from '../core/MusicRegistry.js';
import { SFXRegistry, initializeSFXRegistry } from '../core/SFXRegistry.js';
import { InputManager } from '../core/InputManager.js';
import { CursorOverlay } from '../core/CursorOverlay.js';
import { PixiApp } from '../core/render/PixiApp.js';

export class Game {
    constructor() {
        
        try {
            this.canvas = document.getElementById('gameCanvas');
            
            if (!this.canvas) {
                throw new Error('Canvas element not found');
            }
            
            // Track shutdown state to prevent double-shutdown and continued game loops
            this.isShuttingDown = false;
            this.animationFrameId = null;
            
            // Detect and apply UI scaling based on screen resolution
            this.applyUIScaling();
            this.updateOrientationClass();
            
            // Apply fixed resolution from saved settings
            const savedResolution = ResolutionSettings.getSavedResolution();
            const resolution = ResolutionSettings.getResolution(savedResolution);
            this.canvas.width = resolution.width;
            this.canvas.height = resolution.height;
            
            // Get native Canvas 2D context for direct rendering (no wrapper overhead)
            this.ctx = this.canvas.getContext('2d');
            
            // High-quality image rendering for crisp, smooth visuals
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.imageSmoothingQuality = 'high';
            
            // Prevent infinite resize loops
            this.isResizing = false;

            // Cached canvas bounding rect - getBoundingClientRect() forces a synchronous
            // layout read, and this is queried on every click and (via getCachedCanvasRect)
            // every mousemove during tower/building placement. The canvas's on-screen box
            // only actually changes on resize/orientation change (its drawing buffer is
            // fixed-resolution, see resizeCanvas()), so cache it and invalidate there instead
            // of paying a forced reflow per input event.
            this._canvasRectCache = null;
            
            // Initialize resolution manager with current canvas size
            this.resolutionManager = new ResolutionManager(this.canvas.width, this.canvas.height);

            // Attach resolution manager to canvas for easy access from rendering code
            this.canvas.resolutionManager = this.resolutionManager;
            this.ctx.resolutionManager = this.resolutionManager;

            // Pixi (WebGL) renderer bootstrap - mounted alongside the Canvas2D canvas,
            // which still carries the few elements never migrated (attack-radius
            // circles, hit splatters, results screen, boons overlay - see each
            // adapter's doc comment for why those stay Canvas2D permanently).
            this.pixiApp = new PixiApp();
            const canvasViewport = document.getElementById('canvas-viewport');
            if (canvasViewport) {
                this.pixiApp.init(this.canvas.width, this.canvas.height, canvasViewport)
                    .then(() => {
                        // #gameCanvas's CSS background (style.css) is a ~95%-opaque
                        // gradient meant to show through transparent canvas pixels in
                        // Canvas2D-only mode. With Pixi rendering behind it (see
                        // PixiApp.js's negative z-index), that near-opaque CSS background
                        // would almost completely hide whatever Pixi draws - override it
                        // so the Pixi layer is actually visible.
                        this.canvas.style.background = 'transparent';
                    })
                    .catch(error => {
                        console.error('Game: Pixi renderer failed to initialize:', error);
                    });
            }
            
            // Initialize audio system
            this.audioManager = new AudioManager();
            initializeMusicRegistry();
            initializeSFXRegistry();
            this.audioManager.setMusicRegistry(MusicRegistry.getAllMusic());
            this.audioManager.setSFXRegistry(SFXRegistry.getAllSFX());
            
            // Initialize input manager
            this.inputManager = new InputManager();
            
            // Create state manager AFTER canvas is properly sized
            this.stateManager = new GameStateManager(this.canvas, this.ctx);
            this.stateManager.SaveSystem = SaveSystem;
            this.stateManager.resolutionManager = this.resolutionManager;
            this.stateManager.game = this; // Set game reference for resolution selector access
            this.stateManager.audioManager = this.audioManager; // Set audio manager reference
            this.stateManager.inputManager = this.inputManager; // Set input manager reference
            this.stateManager.pixiApp = this.pixiApp; // Pixi (WebGL) renderer, see PixiApp.js

            // Page-wide custom cursor (replaces the native cursor everywhere, not just over the canvas)
            this.cursorOverlay = new CursorOverlay(this.stateManager);

            // Initialize all save slot files (create empty files if they don't exist)
            SaveSystem.initializeSaveSlots();
            
            // Initialize player progression system (persistent gold and inventory)
            this.stateManager.playerGold = 0; // Start with 0 gold - must earn from loot sales
            this.stateManager.playerInventory = []; // Start with no inventory items
            
            // Initialize game loop timing
            this.lastTime = 0;
            this.isInitialized = false;
            
            // Setup event listeners early
            this.setupEventListeners();
            
            // Setup shutdown handler for graceful cleanup
            this.setupShutdownHandlers();

            // Dev-only: exposes the Game instance for the ?stresstest harness's browser-driven
            // profiling (see GameplayState's _devStressSpawn/_stressTestEnabled) to read
            // PerformanceMonitor stats and trigger stress batches without simulating clicks
            // through the whole canvas-drawn menu chain on every run.
            if (new URLSearchParams(window.location.search).has('stresstest')) {
                window.__gameInstance = this;
            }
            
            // Initialize states and start game loop (async: syncs save files first)
            this.initializeStates().catch(error => {
                console.error('Game: Critical error during state initialization:', error);
                if (this.canvas && this.ctx) {
                    this.showError(error.message);
                }
            });
            
        } catch (error) {
            console.error('Game: Critical error during initialization:', error);
            console.error('Stack trace:', error.stack);
            
            if (this.canvas && this.ctx) {
                this.showError(error.message);
            }
        }
    }
    
    async initializeStates() {
        
        try {
            const loadGame = new LoadGame(this.stateManager);
            this.stateManager.addState('loadGame', loadGame);

            const saveSlotSelection = new SaveSlotSelection(this.stateManager);
            this.stateManager.addState('saveSlotSelection', saveSlotSelection);

            const optionsMenu = new OptionsMenu(this.stateManager);
            this.stateManager.addState('options', optionsMenu);
            
            const mainMenu = new MainMenu(this.stateManager);
            this.stateManager.addState('mainMenu', mainMenu);

            const splashLily = new SplashScreen(this.stateManager, {
                lines: ["A Lily's Little Adventures Game"],
                nextState: 'splashMusic'
            });
            this.stateManager.addState('splashLily', splashLily);

            const splashMusic = new SplashScreen(this.stateManager, {
                lines: ['Music and Sound by Joost'],
                nextState: 'mainMenu'
            });
            this.stateManager.addState('splashMusic', splashMusic);

            const settlementHub = new SettlementHub(this.stateManager);
            this.stateManager.addState('settlementHub', settlementHub);
            
            const campaignMenu = new CampaignMenu(this.stateManager);
            this.stateManager.addState('campaignMenu', campaignMenu);
            
            // Register special levels
            LevelRegistry.registerLevel('sandbox', 'sandbox', SandboxLevel, SandboxLevel.levelMetadata);
            
            // Initialize campaign registry with campaign classes
            CampaignRegistry.initialize({ Campaign1, Campaign2, Campaign3, Campaign4, Campaign5: PlayerWorkshop });
            
            // Add campaign states
            const campaign1 = new Campaign1(this.stateManager);
            this.stateManager.addState('levelSelect', campaign1);
            
            const campaign2 = new Campaign2(this.stateManager);
            this.stateManager.addState('campaign-2', campaign2);
            
            const campaign3 = new Campaign3(this.stateManager);
            this.stateManager.addState('campaign-3', campaign3);
            
            const campaign4 = new Campaign4(this.stateManager);
            this.stateManager.addState('campaign-4', campaign4);

            const campaign5 = new PlayerWorkshop(this.stateManager);
            this.stateManager.addState('campaign-5', campaign5);

            const levelDesignerState = new LevelDesignerState(this.stateManager);
            this.stateManager.addState('levelDesigner', levelDesignerState);
            
            const gameplayState = new GameplayState(this.stateManager);
            this.stateManager.addState('game', gameplayState);
            
            // Sync .sav files into localStorage before the player can interact
            // This makes save files the source of truth on each startup
            await SaveSystem.syncAllSlotsFromFiles();
            
            const stateChanged = this.stateManager.changeState('splashLily');
            
            if (!stateChanged) {
                throw new Error('Failed to change to start state');
            }
            
            this.isInitialized = true;
            this.startGameLoop();
        
        } catch (error) {
            console.error('Game: Error initializing states:', error);
            throw error;
        }
    }
    
    applyUIScaling() {
        try {
            const width = window.screen.width;
            const height = window.screen.height;
            const dpr = window.devicePixelRatio || 1;
            
            const effectiveWidth = width * dpr;
            const effectiveHeight = height * dpr;
            
            document.body.classList.remove('scale-1x', 'scale-1-5x', 'scale-2x', 'scale-2-5x');
            
            if (effectiveWidth >= 7680 || effectiveHeight >= 4320) {
                document.body.classList.add('scale-2-5x');
            } else if (effectiveWidth >= 3840 || effectiveHeight >= 2160) {
                document.body.classList.add('scale-2x');
            } else if (effectiveWidth >= 2560 || effectiveHeight >= 1440) {
                document.body.classList.add('scale-1-5x');
            } else {
                document.body.classList.add('scale-1x');
            }
            
        } catch (error) {
            console.error('Game: Error applying UI scaling:', error);
        }
    }
    
    resizeCanvas() {
        // For fixed resolution mode, canvas size is no longer dynamic
        // This method is kept for compatibility but does not resize on window resize
    }

    /**
     * Returns the canvas's bounding rect, computing it lazily and caching it
     * instead of forcing a synchronous layout read on every mousemove/click.
     * Invalidated by handleResizeOrOrientation below, the only place the
     * canvas's on-screen box can actually change.
     */
    getCachedCanvasRect() {
        if (!this._canvasRectCache) {
            this._canvasRectCache = this.canvas.getBoundingClientRect();
        }
        return this._canvasRectCache;
    }

    /**
     * Toggle the body.orientation-portrait class used by the portrait layout
     * CSS, since some sidebar DOM is also driven by UIManager's inline
     * styles and a plain @media (orientation: portrait) query can't reliably
     * win specificity battles against that.
     */
    updateOrientationClass() {
        const isPortrait = window.screen && window.screen.orientation && window.screen.orientation.type
            ? window.screen.orientation.type.startsWith('portrait')
            : window.innerHeight >= window.innerWidth;
        document.body.classList.toggle('orientation-portrait', isPortrait);
    }

    /**
     * Apply a new internal render resolution.
     * The resolution key must already be saved via ResolutionSettings.saveResolution()
     * before this is called (ResolutionSelector does this).  A page reload is the
     * cleanest way to reinitialise all game state at the new canvas dimensions.
     */
    applyResolution(width, height) {
        location.reload();
    }
    
    setupEventListeners() {
        try {
            let resizeTimeout;
            
            const handleResizeOrOrientation = () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    if (!this.isResizing) {
                        this.applyUIScaling();
                        this.updateOrientationClass();
                        this.resizeCanvas();
                        this._canvasRectCache = null;
                    }
                }, 100);
            };
            window.addEventListener('resize', handleResizeOrOrientation);
            // Orientation events can lag the resize event on some Android WebViews,
            // so listen for both and funnel into the same debounced handler.
            window.addEventListener('orientationchange', handleResizeOrOrientation);
            
            this.canvas.addEventListener('click', (e) => {
                try {
                    const rect = this.getCachedCanvasRect();
                    const scaleX = this.canvas.width / rect.width;
                    const scaleY = this.canvas.height / rect.height;
                    const canvasX = (e.clientX - rect.left) * scaleX;
                    const canvasY = (e.clientY - rect.top) * scaleY;
                    this.stateManager.handleClick(canvasX, canvasY);
                } catch (error) {
                    console.error('Game: Error handling click:', error);
                }
            });
            
            // Add right-click handler to cancel tower/building/spell selection
            this.canvas.addEventListener('mousedown', (e) => {
                try {
                    // Check for right-click (button 2)
                    if (e.button === 2) {
                        e.preventDefault();
                        
                        // Call cancel selection on current state
                        if (this.stateManager && this.stateManager.currentState && this.stateManager.currentState.cancelSelection) {
                            this.stateManager.currentState.cancelSelection();
                        }
                    }
                } catch (error) {
                    console.error('Game: Error handling right-click:', error);
                }
            });
            
            // Prevent right-click context menu everywhere in the game
            // Single global handler catches all elements including dynamically created tooltips
            document.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }, true);

            // ============ INPUT MANAGER BINDINGS ============
            // Helper references resolved at action time
            const getGameplayRefs = () => {
                if (!this.stateManager || !this.stateManager.currentState) return null;
                const currentState = this.stateManager.currentState;
                const gameplayState = currentState.gameplayState || currentState;
                const isGameplay = gameplayState && gameplayState.gameState && gameplayState.towerManager;
                if (!isGameplay) return null;
                const uiManager = currentState.uiManager || gameplayState.uiManager;
                return { gameplayState, uiManager, currentState };
            };

            // Speed controls
            this.inputManager.on('speed1', () => {
                const refs = getGameplayRefs();
                if (refs) refs.gameplayState.setGameSpeed(1.0);
            });
            this.inputManager.on('speed2', () => {
                const refs = getGameplayRefs();
                if (refs) refs.gameplayState.setGameSpeed(2.0);
            });
            this.inputManager.on('speed3', () => {
                const refs = getGameplayRefs();
                if (refs) refs.gameplayState.setGameSpeed(3.0);
            });

            // Pause (Space)
            this.inputManager.on('pause', () => {
                const refs = getGameplayRefs();
                if (refs && refs.uiManager && refs.uiManager.togglePauseGame) {
                    refs.uiManager.togglePauseGame();
                }
            });

            // Next Wave (N)
            this.inputManager.on('nextWave', () => {
                const refs = getGameplayRefs();
                if (refs && refs.gameplayState.skipWaveCooldown) {
                    if (this.audioManager) {
                        this.audioManager.playSFX('button-click');
                    }
                    refs.gameplayState.skipWaveCooldown();
                }
            });

            // Cancel / Close (ESC / B button / Android back button)
            // Returns true if something was closed/navigated, false if there was
            // nothing to do (e.g. already at the main menu) - used by
            // window.__ANDROID_BACK__ to decide whether the back press should
            // exit the app instead.
            const handleCancelAction = () => {
                if (!this.stateManager || !this.stateManager.currentState) return false;

                const refs = getGameplayRefs();
                if (refs && refs.uiManager) {
                    // In gameplay: close panels / pause menu / cancel selection
                    if (refs.uiManager.closeAllPanels) {
                        refs.uiManager.closeAllPanels();
                    }
                    if (refs.uiManager.closePauseMenu) {
                        const pauseMenuModal = document.getElementById('pause-menu-modal');
                        if (pauseMenuModal && pauseMenuModal.classList.contains('show')) {
                            refs.uiManager.closePauseMenu();
                        }
                    }
                    if (this.stateManager.currentState.cancelSelection) {
                        this.stateManager.currentState.cancelSelection();
                    }
                    return true;
                }

                // In non-gameplay states: go back to previous state
                const stateName = this.stateManager.currentStateName;
                if (stateName === 'options') {
                    const prev = this.stateManager.previousState || 'mainMenu';
                    this.stateManager.changeState(prev);
                    return true;
                } else if (stateName === 'loadGame' || stateName === 'saveSlotSelection') {
                    this.stateManager.changeState('mainMenu');
                    return true;
                } else if (stateName === 'levelSelect' || stateName === 'campaigns') {
                    this.stateManager.changeState('settlementHub');
                    return true;
                }
                return false;
            };
            this.inputManager.on('cancel', handleCancelAction);

            // Android hardware/gesture back button: MainActivity.kt evaluates this
            // before deciding whether to finish() the Activity (see gen/android
            // app/src/main/java/.../MainActivity.kt onKeyDown).
            window.__ANDROID_BACK__ = handleCancelAction;

            // Menu (M)
            this.inputManager.on('menu', () => {
                const refs = getGameplayRefs();
                if (refs && refs.uiManager && refs.uiManager.openPauseMenu) {
                    refs.uiManager.openPauseMenu();
                }
            });

            // Sell (DEL) - sells whatever tower's upgrade panel is currently open, by reusing
            // that panel's own Sell button (same refund/cleanup logic as clicking it). Special
            // buildings (forge, academy, etc.) are immutable once built and have no sell button.
            this.inputManager.on('sell', () => {
                const refs = getGameplayRefs();
                if (!refs || refs.gameplayState.isPaused) return;
                const sellBtn = Array.from(document.querySelectorAll('.sell-tower-btn'))
                    .find(btn => btn.offsetParent !== null);
                if (sellBtn) {
                    sellBtn.click();
                }
            });

            // Tower hotkeys
            const towerTypes = ['basic', 'cannon', 'archer', 'magic', 'barricade', 'poison', 'combination', 'guard-post'];
            for (const type of towerTypes) {
                this.inputManager.on('tower_' + type, () => {
                    const refs = getGameplayRefs();
                    if (!refs || !refs.uiManager) return;
                    if (refs.gameplayState.isPaused) return;
                    const btn = document.querySelector(`.tower-btn[data-type="${type}"]`);
                    if (btn && !btn.disabled && btn.style.display !== 'none') {
                        refs.uiManager.selectTower(btn);
                    }
                });
            }

            // Collect Gold (G) - collects gold/gems from every ready gold mine at once,
            // without opening the gold mine menu. Z stays dedicated to building mines.
            this.inputManager.on('collectGold', () => {
                const refs = getGameplayRefs();
                if (!refs || !refs.uiManager) return;
                if (refs.gameplayState.isPaused) return;
                refs.gameplayState.collectAllReadyMines();
            });

            // Building hotkeys - if the building already exists on the field, interact with
            // it directly (open its menu) instead of entering placement mode. Gold mines are
            // excluded since they can have multiple instances and have their own dedicated
            // collect-gold hotkey (G), so Z always stays available for building more mines.
            const buildingTypes = ['mine', 'forge', 'academy', 'training', 'superweapon', 'diamond-press'];
            for (const type of buildingTypes) {
                this.inputManager.on('building_' + type, () => {
                    const refs = getGameplayRefs();
                    if (!refs || !refs.uiManager) return;
                    if (refs.gameplayState.isPaused) return;
                    if (type !== 'mine' && refs.gameplayState.handleBuildingHotkey(type)) return;
                    const btn = document.querySelector(`.building-btn[data-type="${type}"]`);
                    if (btn && !btn.disabled && btn.style.display !== 'none') {
                        refs.uiManager.selectBuilding(btn);
                    }
                });
            }

            // Spell hotkeys
            const spellIds = ['arcaneBlast', 'frostNova', 'meteorStrike', 'chainLightning'];
            for (const spellId of spellIds) {
                this.inputManager.on('spell_' + spellId, () => {
                    const refs = getGameplayRefs();
                    if (!refs) return;
                    if (refs.gameplayState.isPaused) return;
                    // Find the Super Weapon Lab and check if spell is available
                    const superWeaponLab = refs.gameplayState.towerManager.buildingManager.buildings.find(
                        b => b.constructor.name === 'SuperWeaponLab'
                    );
                    if (!superWeaponLab) return;
                    const spell = superWeaponLab.spells[spellId];
                    if (spell && spell.unlocked && spell.currentCooldown === 0) {
                        refs.gameplayState.activateSpellTargeting(spellId);
                    }
                });
            }

            // Gamepad shoulder buttons -> cycle through towers/buildings
            this.inputManager.on('gamepad_prev_item', () => {
                const refs = getGameplayRefs();
                if (!refs || !refs.uiManager) return;
                this._cycleSelection(refs.uiManager, -1, refs.gameplayState);
            });
            this.inputManager.on('gamepad_next_item', () => {
                const refs = getGameplayRefs();
                if (!refs || !refs.uiManager) return;
                this._cycleSelection(refs.uiManager, 1, refs.gameplayState);
            });

            // Gamepad triggers -> cycle game speed
            this.inputManager.on('gamepad_speed_down', () => {
                const refs = getGameplayRefs();
                if (!refs || !refs.gameplayState) return;
                const speeds = [1, 2, 3];
                const currentIdx = speeds.indexOf(refs.gameplayState.gameSpeed);
                const newIdx = Math.max(0, currentIdx - 1);
                refs.gameplayState.setGameSpeed(speeds[newIdx]);
            });
            this.inputManager.on('gamepad_speed_up', () => {
                const refs = getGameplayRefs();
                if (!refs || !refs.gameplayState) return;
                const speeds = [1, 2, 3];
                const currentIdx = speeds.indexOf(refs.gameplayState.gameSpeed);
                const newIdx = Math.min(speeds.length - 1, currentIdx + 1);
                refs.gameplayState.setGameSpeed(speeds[newIdx]);
            });

            // Touch tap -> click
            this.inputManager.on('touch_tap', (data) => {
                if (this.stateManager && this.stateManager.currentState) {
                    this.stateManager.handleClick(data.x, data.y);
                }
            });

            // Touch move -> update placement preview 
            this.inputManager.on('touch_move', (data) => {
                if (this.stateManager && this.stateManager.currentState && this.stateManager.currentState.handleTouchMove) {
                    this.stateManager.currentState.handleTouchMove(data.x, data.y);
                }
            });

            // Touch long press -> right-click (cancel selection)
            this.inputManager.on('touch_longpress', () => {
                if (this.stateManager && this.stateManager.currentState && this.stateManager.currentState.cancelSelection) {
                    this.stateManager.currentState.cancelSelection();
                }
            });

            // Gamepad collect nearest loot (X button)
            this.inputManager.on('gamepad_collect_loot', () => {
                const refs = getGameplayRefs();
                if (!refs) return;
                const lootManager = refs.gameplayState.lootManager;
                if (!lootManager) return;
                // Find the nearest clickable loot bag
                let nearestBag = null;
                let nearestDist = Infinity;
                for (const bag of lootManager.lootBags) {
                    if (!bag.isClickable()) continue;
                    const dist = Math.hypot(bag.x - this.inputManager.gamepadCursorX, bag.y - this.inputManager.gamepadCursorY);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearestBag = bag;
                    }
                }
                if (nearestBag) {
                    lootManager.collectLoot(nearestBag);
                }
            });

            // Setup touch on canvas
            this.inputManager.setupTouchHandlers(this.canvas);
            
        } catch (error) {
            console.error('Game: Error setting up event listeners:', error);
        }
    }
    
    setupShutdownHandlers() {
        // Note: beforeunload doesn't fire in Tauri apps the same way
        // Main shutdown is triggered from quitGame() in StartScreen
        window.addEventListener('beforeunload', (e) => {
            this.shutdown();
        });
    }

    /**
     * Cycle through tower/building selection with gamepad shoulder buttons
     */
    _cycleSelection(uiManager, direction, gameplayState) {
        const allBtns = [
            ...document.querySelectorAll('.tower-btn'),
            ...document.querySelectorAll('.building-btn')
        ].filter(btn => !btn.disabled && btn.style.display !== 'none');

        if (allBtns.length === 0) return;

        const currentSelected = document.querySelector('.tower-btn.selected, .building-btn.selected');
        let index = currentSelected ? allBtns.indexOf(currentSelected) : -1;
        index = (index + direction + allBtns.length) % allBtns.length;
        
        const btn = allBtns[index];
        if (btn.classList.contains('tower-btn')) {
            uiManager.selectTower(btn);
        } else {
            uiManager.selectBuilding(btn);
        }

        // Trigger placement preview at the gamepad cursor position
        if (gameplayState && this.inputManager) {
            gameplayState.handleTouchMove(
                this.inputManager.gamepadCursorX,
                this.inputManager.gamepadCursorY
            );
        }
    }
    
    /**
     * Gracefully shutdown the game engine
     * - Stops game loop
     * - Cleans up all managers
     * - Cancels animation frames
     * This ensures no resources continue after app close is initiated
     */
    shutdown() {
        if (this.isShuttingDown) return;
        this.isShuttingDown = true;
        
        // console.log('Game: Initiating graceful shutdown...');
        
        // Cancel animation frame loop immediately
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Cleanup input manager
        if (this.inputManager) {
            this.inputManager.removeTouchHandlers(this.canvas);
            this.inputManager.destroy();
        }

        // Cleanup Pixi renderer (releases the WebGL context)
        if (this.pixiApp) {
            this.pixiApp.destroy();
        }
        
        // Exit current state if any
        if (this.stateManager && this.stateManager.currentState && this.stateManager.currentState.exit) {
            try {
                this.stateManager.currentState.exit();
            } catch (error) {
                console.error('Game: Error exiting current state during shutdown:', error);
            }
        }
        
        // Stop all audio
        if (this.audioManager) {
            try {
                this.audioManager.stopMusic();
                // Stop all sound effects
                if (this.audioManager.soundElements) {
                    Object.values(this.audioManager.soundElements).forEach(audio => {
                        if (audio && typeof audio.pause === 'function') {
                            audio.pause();
                            audio.currentTime = 0;
                        }
                    });
                }
                if (this.audioManager.musicElement) {
                    this.audioManager.musicElement.pause();
                    this.audioManager.musicElement.currentTime = 0;
                }
            } catch (error) {
                console.error('Game: Error stopping audio during shutdown:', error);
            }
        }
        
        // Clear canvas to black
        try {
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } catch (error) {
            console.error('Game: Error clearing canvas during shutdown:', error);
        }
        
        // console.log('Game: Shutdown complete');
    }

    
    startGameLoop() {
        this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    showError(message) {
        try {
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ff0000';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Error:', this.canvas.width / 2, this.canvas.height / 2 - 50);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.fillText('Check console for details', this.canvas.width / 2, this.canvas.height / 2 + 30);
        } catch (renderError) {
            console.error('Game: Error showing error message:', renderError);
        }
    }
    
    gameLoop(currentTime) {
        // Prevent game loop from continuing after shutdown
        if (this.isShuttingDown) {
            return;
        }
        
        try {
            if (!this.isInitialized) {
                this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
                return;
            }
            
            let deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;

            // Cap delta time to prevent physics issues (floor at 30 FPS so a slow frame
            // doesn't cause a huge simulation jump, without throttling normal frame times)
            if (deltaTime > 0.033) {
                deltaTime = 0.033;
            }
            
            // NEW: Apply game speed multiplier if in gameplay state
            if (this.stateManager.currentStateName === 'game' && this.stateManager.currentState.getAdjustedDeltaTime) {
                deltaTime = this.stateManager.currentState.getAdjustedDeltaTime(deltaTime);
            }
            
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Pixi visibility gate - only the 'game' (GameplayState) state ever populates
            // app.stage; every other state (settlement hub, menus, campaign map, etc.)
            // is still pure Canvas2D. Without this gate, a full WebGL clear+composite
            // pass ran every frame regardless of which state was active - wasted work,
            // and the likely cause of "runs poorly" complaints outside of gameplay.
            const pixiShouldRender = this.stateManager.currentStateName === 'game';
            if (this.pixiApp && this.pixiApp.ready) {
                this.pixiApp.setVisible(pixiShouldRender);
            }

            if (this.stateManager && this.stateManager.currentState) {
                this.stateManager.update(deltaTime);
                this.stateManager.render();
                if (this.cursorOverlay) {
                    this.cursorOverlay.render();
                }
            } else {
                this.ctx.fillStyle = '#1a0f0a';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.fillStyle = '#d4af37';
                this.ctx.font = '24px serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('Loading...', this.canvas.width / 2, this.canvas.height / 2);
            }

            // Pixi render pass - must run AFTER stateManager.render() above, since that's
            // what actually populates/updates app.stage for this frame (GameplayState's
            // _syncXPixi calls). Rendering before would always composite last frame's
            // stage contents, one frame stale.
            if (pixiShouldRender && this.pixiApp && this.pixiApp.ready) {
                // This GPU-submit call happens after stateManager.render()'s endRender()
                // measurement window closes, so it was previously invisible to
                // PerformanceMonitor entirely. Recorded against the same monitor instance
                // so it shows up (one frame later) alongside the other per-system slots.
                const perfMonitor = this.stateManager.currentState && this.stateManager.currentState.performanceMonitor;
                if (perfMonitor) {
                    // Not reset in startFrame() - this measurement completes after this
                    // frame's overlay draw, so it must survive to be shown next frame.
                    perfMonitor.slotTimes.pixiSubmit = 0;
                    perfMonitor.beginSlot('pixiSubmit');
                }
                this.pixiApp.resetDrawCallCount();
                this.pixiApp.renderFrame();
                if (perfMonitor) {
                    perfMonitor.endSlot('pixiSubmit');
                    perfMonitor.setDrawCalls(this.pixiApp.getDrawCallCount());
                }
            }

        } catch (error) {
            console.error('Game: Error in game loop:', error);
            this.showError('Game loop error: ' + error.message);
        }
        
        // Store animation frame ID to allow cancellation during shutdown
        if (!this.isShuttingDown) {
            this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
        }
    }
}

// Initialize game on window load
window.addEventListener('load', () => {
    
    try {
        new Game();
    } catch (error) {
        console.error('Critical error initializing game:', error);
        console.error('Stack trace:', error.stack);
        
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#ff0000';
                ctx.font = '24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Failed to Initialize Game', canvas.width / 2, canvas.height / 2);
                ctx.fillStyle = '#ffffff';
                ctx.font = '16px Arial';
                ctx.fillText('Check console for details', canvas.width / 2, canvas.height / 2 + 30);
            }
        }
    }
});
