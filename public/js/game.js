import { GameStateManager } from './GameStateManager.js';
import { StartScreen } from './StartScreen.js';
import { LevelSelect } from './LevelSelect.js';
import { GameplayState } from './GameplayState.js';

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
            
            // Set initial canvas size BEFORE creating state manager
            this.resizeCanvas();
            console.log('Game: Canvas resized to:', this.canvas.width, 'x', this.canvas.height);
            
            // Prevent infinite resize loops
            this.isResizing = false;
            
            // Create state manager AFTER canvas is properly sized
            this.stateManager = new GameStateManager(this.canvas, this.ctx);
            console.log('Game: GameStateManager created');
            
            // Initialize game loop timing
            this.lastTime = 0;
            this.isInitialized = false;
            
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
        if (this.isResizing) return;
        
        this.isResizing = true;
        
        try {
            const sidebar = document.getElementById('tower-sidebar');
            const statsBar = document.getElementById('stats-bar');
            
            const sidebarWidth = (sidebar && sidebar.style.display !== 'none') ? sidebar.offsetWidth : 0;
            const statsBarHeight = (statsBar && statsBar.style.display !== 'none') ? statsBar.offsetHeight : 0;
            
            const oldWidth = this.canvas.width;
            const oldHeight = this.canvas.height;
            
            const newWidth = Math.max(800, window.innerWidth - sidebarWidth);
            const newHeight = Math.max(600, window.innerHeight - statsBarHeight);
            
            if (Math.abs(oldWidth - newWidth) > 10 || Math.abs(oldHeight - newHeight) > 10) {
                this.canvas.width = newWidth;
                this.canvas.height = newHeight;
                console.log('Game: Canvas resized from', oldWidth, 'x', oldHeight, 'to', newWidth, 'x', newHeight);
            }
        } catch (error) {
            console.error('Game: Error during resize:', error);
        } finally {
            this.isResizing = false;
        }
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
            
            console.log('Game: Event listeners set up successfully');
        } catch (error) {
            console.error('Game: Error setting up event listeners:', error);
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
            
            const deltaTime = Math.min(0.016, (currentTime - this.lastTime) / 1000);
            this.lastTime = currentTime;
            
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
