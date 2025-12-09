import { GameStateManager } from '../core/states/GameStateManager.js';
import { MainMenu } from '../core/states/MainMenu.js';
import { LoadGame } from '../core/states/LoadGame.js';
import { OptionsMenu } from '../core/states/OptionsMenu.js';
import { StartScreen } from '../core/states/StartScreen.js';
import { LevelSelect } from '../core/states/LevelSelect.js';
import { GameplayState } from '../core/states/GameplayState.js';
import { SaveSystem } from '../core/SaveSystem.js';
import { ResolutionManager } from '../core/ResolutionManager.js';
import { ResolutionSettings } from '../core/ResolutionSettings.js';
import { ResolutionSelector } from '../ui/ResolutionSelector.js';

export class Game {
    constructor() {
        console.log('Game: Starting initialization');
        
        try {
            this.canvas = document.getElementById('gameCanvas');
            this.ctx = this.canvas.getContext('2d');
            
            if (!this.canvas) {
                throw new Error('Canvas element not found');
            }
            if (!this.ctx) {
                throw new Error('Canvas context not available');
            }
            
            console.log('Game: Canvas found, initial size:', this.canvas.width, 'x', this.canvas.height);
            
            // Detect and apply UI scaling based on screen resolution
            this.applyUIScaling();
            
            // Apply fixed resolution from saved settings
            const savedResolution = ResolutionSettings.getSavedResolution();
            const resolution = ResolutionSettings.getResolution(savedResolution);
            this.canvas.width = resolution.width;
            this.canvas.height = resolution.height;
            console.log('Game: Canvas set to fixed resolution:', this.canvas.width, 'x', this.canvas.height);
            
            // Prevent infinite resize loops
            this.isResizing = false;
            
            // Initialize resolution manager with current canvas size
            this.resolutionManager = new ResolutionManager(this.canvas.width, this.canvas.height);
            
            // Attach resolution manager to canvas for easy access from rendering code
            this.canvas.resolutionManager = this.resolutionManager;
            this.ctx.resolutionManager = this.resolutionManager;
            
            // Create state manager AFTER canvas is properly sized
            this.stateManager = new GameStateManager(this.canvas, this.ctx);
            this.stateManager.SaveSystem = SaveSystem;
            this.stateManager.resolutionManager = this.resolutionManager;
            this.stateManager.game = this; // Set game reference for resolution selector access
            console.log('Game: GameStateManager created with SaveSystem and ResolutionManager');
            
            // Initialize game loop timing
            this.lastTime = 0;
            this.isInitialized = false;
            
            // Create resolution selector
            this.resolutionSelector = new ResolutionSelector(this);
            
            // Setup event listeners early
            this.setupEventListeners();
            
            // Add states with comprehensive error handling
            this.initializeStates();
            
        } catch (error) {
            console.error('Game: Critical error during initialization:', error);
            console.error('Stack trace:', error.stack);
            
            if (this.canvas && this.ctx) {
                this.showError(error.message);
            }
        }
    }
    
    initializeStates() {
        console.log('Game: Adding states...');
        
        try {
            const mainMenu = new MainMenu(this.stateManager);
            this.stateManager.addState('mainMenu', mainMenu);
            console.log('Game: MainMenu state added');

            const loadGame = new LoadGame(this.stateManager);
            this.stateManager.addState('loadGame', loadGame);
            console.log('Game: LoadGame state added');

            const optionsMenu = new OptionsMenu(this.stateManager);
            this.stateManager.addState('options', optionsMenu);
            console.log('Game: OptionsMenu state added');
            
            const startScreen = new StartScreen(this.stateManager);
            this.stateManager.addState('start', startScreen);
            console.log('Game: StartScreen state added');
            
            const levelSelect = new LevelSelect(this.stateManager);
            this.stateManager.addState('levelSelect', levelSelect);
            console.log('Game: LevelSelect state added');
            
            const gameplayState = new GameplayState(this.stateManager);
            this.stateManager.addState('game', gameplayState);
            console.log('Game: GameplayState added');
            
            console.log('Game: All states added successfully');
            
            const stateChanged = this.stateManager.changeState('start');
            
            if (!stateChanged) {
                throw new Error('Failed to change to start state');
            }
            
            this.isInitialized = true;
            console.log('Game: State initialization complete, starting game loop');
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
            
            console.log('Game: UI scaling applied');
        } catch (error) {
            console.error('Game: Error applying UI scaling:', error);
        }
    }
    
    resizeCanvas() {
        // For fixed resolution mode, canvas size is no longer dynamic
        // This method is kept for compatibility but does not resize on window resize
        console.log('Game: Canvas is using fixed resolution mode');
    }
    
    setupEventListeners() {
        try {
            let resizeTimeout;
            
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    if (!this.isResizing) {
                        this.applyUIScaling();
                        this.resizeCanvas();
                    }
                }, 100);
            });
            
            this.canvas.addEventListener('click', (e) => {
                try {
                    const rect = this.canvas.getBoundingClientRect();
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
            
            // Prevent right-click context menu on canvas
            this.canvas.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
            
            console.log('Game: Event listeners set up successfully');
        } catch (error) {
            console.error('Game: Error setting up event listeners:', error);
        }
    }
    
    /**
     * Apply a new resolution and re-initialize game if needed
     */
    applyResolution(width, height) {
        try {
            console.log(`Game: Applying resolution ${width}x${height}`);
            
            // Update canvas dimensions
            this.canvas.width = width;
            this.canvas.height = height;
            
            // Recreate resolution manager with new dimensions
            this.resolutionManager = new ResolutionManager(width, height);
            this.canvas.resolutionManager = this.resolutionManager;
            this.ctx.resolutionManager = this.resolutionManager;
            if (this.stateManager) {
                this.stateManager.resolutionManager = this.resolutionManager;
            }
            
            // Trigger resize on current state if available
            if (this.stateManager && this.stateManager.currentState && this.stateManager.currentState.resize) {
                this.stateManager.currentState.resize();
                console.log('Game: Current state resized to new resolution');
            }
        } catch (error) {
            console.error('Game: Error applying resolution:', error);
        }
    }
    
    /**
     * Show the resolution selector dialog
     */
    showResolutionSelector() {
        if (this.resolutionSelector) {
            this.resolutionSelector.show();
        }
    }
    
    startGameLoop() {
        console.log('Game: Game loop starting');
        requestAnimationFrame((time) => this.gameLoop(time));
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
        try {
            if (!this.isInitialized) {
                requestAnimationFrame((time) => this.gameLoop(time));
                return;
            }
            
            let deltaTime = Math.min(0.016, (currentTime - this.lastTime) / 1000);
            this.lastTime = currentTime;
            
            // NEW: Apply game speed multiplier if in gameplay state
            if (this.stateManager.currentStateName === 'game' && this.stateManager.currentState.getAdjustedDeltaTime) {
                deltaTime = this.stateManager.currentState.getAdjustedDeltaTime(deltaTime);
            }
            
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            if (this.stateManager && this.stateManager.currentState) {
                this.stateManager.update(deltaTime);
                this.stateManager.render();
            } else {
                this.ctx.fillStyle = '#1a0f0a';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.fillStyle = '#d4af37';
                this.ctx.font = '24px serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('Loading...', this.canvas.width / 2, this.canvas.height / 2);
            }
            
        } catch (error) {
            console.error('Game: Error in game loop:', error);
            this.showError('Game loop error: ' + error.message);
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Initialize game on window load
window.addEventListener('load', () => {
    console.log('Window loaded, starting game initialization');
    
    try {
        new Game();
        console.log('Game initialized successfully');
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
