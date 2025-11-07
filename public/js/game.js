import { TowerManager } from './towers/TowerManager.js';
import { BuildingManager } from './buildings/BuildingManager.js';
import { EnemyManager } from './enemies/EnemyManager.js';
import { Level } from './Level.js';
import { GameState } from './GameState.js';
import { GameStateManager } from './GameStateManager.js';
import { StartScreen } from './StartScreen.js';
import { LevelSelect } from './LevelSelect.js';

class GameplayState {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.gameState = new GameState();
        this.level = new Level();
        this.towerManager = new TowerManager(this.gameState, this.level);
        this.buildingManager = new BuildingManager(this.gameState, this.level);
        this.enemyManager = null;
        this.selectedTowerType = null;
        this.selectedBuildingType = null;
        this.currentLevel = 1; // Track current level
        this.maxWavesForLevel = 10; // Level 1 has 10 waves
        this.waveInProgress = false;
        this.waveCompleted = false;
        this.isTestLevel = false;
        console.log('GameplayState constructor completed');
    }
    
    enter() {
        console.log('GameplayState: entering');
        
        // Check if this is a test level
        this.isTestLevel = this.stateManager.selectedLevelInfo?.isTest || false;
        
        // Reset game state for new level
        this.gameState = new GameState();
        
        // Test level gets infinite resources
        if (this.isTestLevel) {
            this.gameState.gold = 999999;
            this.gameState.health = 999999;
            this.currentLevel = 0; // Special test level
            this.maxWavesForLevel = 999999;
        } else {
            this.currentLevel = 1;
            this.maxWavesForLevel = 10;
        }
        
        this.waveInProgress = false;
        this.waveCompleted = false;
        
        // Ensure UI is visible
        const statsBar = document.getElementById('stats-bar');
        const sidebar = document.getElementById('tower-sidebar');
        
        if (statsBar) {
            statsBar.style.display = 'flex';
            console.log('GameplayState: Stats bar shown');
        }
        if (sidebar) {
            sidebar.style.display = 'flex';
            console.log('GameplayState: Sidebar shown');
        }
        
        // Initialize level for current canvas size first
        console.log('GameplayState: Initializing level for canvas:', this.stateManager.canvas.width, 'x', this.stateManager.canvas.height);
        this.level.initializeForCanvas(this.stateManager.canvas.width, this.stateManager.canvas.height);
        
        // Create new enemy manager with the properly initialized path
        console.log('GameplayState: Creating enemy manager with path:', this.level.path);
        this.enemyManager = new EnemyManager(this.level.path);
        
        // Recreate managers to ensure they have the updated level reference
        this.towerManager = new TowerManager(this.gameState, this.level);
        this.buildingManager = new BuildingManager(this.gameState, this.level);
        
        this.setupEventListeners();
        this.updateUI();
        this.startWave();
        console.log('GameplayState: enter completed');
    }
    
    exit() {
        // Clean up event listeners when leaving game state
        this.removeEventListeners();
    }
    
    setupEventListeners() {
        // Remove existing listeners first to avoid duplicates
        this.removeEventListeners();
        
        // Tower buttons
        document.querySelectorAll('.tower-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectTower(e.currentTarget);
            });
            
            // Show tower info on hover/touch
            btn.addEventListener('mouseenter', (e) => {
                this.showTowerInfo(e.currentTarget.dataset.type);
            });
            
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.showTowerInfo(e.currentTarget.dataset.type);
            });
        });
        
        // Building buttons
        document.querySelectorAll('.building-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectBuilding(e.currentTarget);
            });
            
            // Show building info on hover/touch
            btn.addEventListener('mouseenter', (e) => {
                this.showBuildingInfo(e.currentTarget.dataset.type);
            });
            
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.showBuildingInfo(e.currentTarget.dataset.type);
            });
        });
        
        // Add mouse move listener for placement preview
        this.mouseMoveHandler = (e) => this.handleMouseMove(e);
        this.stateManager.canvas.addEventListener('mousemove', this.mouseMoveHandler);
    }
    
    removeEventListeners() {
        // Clean up event listeners
        document.querySelectorAll('.tower-btn, .building-btn').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });
        
        if (this.mouseMoveHandler) {
            this.stateManager.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
        }
    }
    
    handleMouseMove(e) {
        if (!this.selectedTowerType && !this.selectedBuildingType) {
            this.level.setPlacementPreview(0, 0, false);
            return;
        }
        
        const rect = this.stateManager.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.selectedBuildingType) {
            this.level.setPlacementPreview(x, y, true, this.buildingManager, 'building');
        } else {
            this.level.setPlacementPreview(x, y, true, this.towerManager, 'tower');
        }
    }
    
    selectTower(btn) {
        const towerType = btn.dataset.type;
        const cost = parseInt(btn.dataset.cost);
        
        // Check if player can afford this tower (unless test level)
        if (!this.isTestLevel && !this.gameState.canAfford(cost)) {
            return;
        }
        
        // Clear building selection
        this.selectedBuildingType = null;
        document.querySelectorAll('.building-btn').forEach(b => b.classList.remove('selected'));
        
        // Update tower selection
        document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedTowerType = towerType;
        
        this.showTowerInfo(towerType);
    }
    
    selectBuilding(btn) {
        const buildingType = btn.dataset.type;
        const cost = parseInt(btn.dataset.cost);
        
        // Check if player can afford this building (unless test level)
        if (!this.isTestLevel && !this.gameState.canAfford(cost)) {
            return;
        }
        
        // Clear tower selection
        this.selectedTowerType = null;
        document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
        
        // Update building selection
        document.querySelectorAll('.building-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedBuildingType = buildingType;
        
        this.showBuildingInfo(buildingType);
    }
    
    showTowerInfo(towerType) {
        const info = this.towerManager.getTowerInfo(towerType);
        if (!info) return;
        
        const infoPanel = document.getElementById('tower-info');
        infoPanel.innerHTML = `
            <div class="info-title">${info.name}</div>
            <div class="info-stats">
                <div>Damage: ${info.damage}</div>
                <div>Range: ${info.range}</div>
                <div>Rate: ${info.fireRate}</div>
            </div>
            <div style="margin-top: 4px; font-size: 8px; color: #a88;">${info.description}</div>
        `;
    }
    
    showBuildingInfo(buildingType) {
        const info = this.buildingManager.getBuildingInfo(buildingType);
        if (!info) return;
        
        const infoPanel = document.getElementById('tower-info');
        infoPanel.innerHTML = `
            <div class="info-title">${info.name}</div>
            <div class="info-stats">
                <div>Effect: ${info.effect}</div>
                <div>Range: ${info.range}</div>
                ${info.maxLevel ? `<div>Max Level: ${info.maxLevel}</div>` : ''}
            </div>
            <div style="margin-top: 4px; font-size: 8px; color: #a88;">${info.description}</div>
        `;
    }
    
    handleClick(x, y) {
        if (this.selectedTowerType) {
            const { gridX, gridY } = this.level.screenToGrid(x, y);
            
            if (this.level.canPlaceTower(gridX, gridY, this.towerManager)) {
                const { screenX, screenY } = this.level.gridToScreen(gridX, gridY);
                
                if (this.towerManager.placeTower(this.selectedTowerType, screenX, screenY, gridX, gridY)) {
                    this.level.placeTower(gridX, gridY);
                    
                    // Test level maintains infinite gold
                    if (this.isTestLevel) {
                        this.gameState.gold = 999999;
                    }
                    
                    this.updateUI();
                    
                    // Clear selection after placing tower
                    this.selectedTowerType = null;
                    document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
                    this.level.setPlacementPreview(0, 0, false);
                }
            }
        } else if (this.selectedBuildingType) {
            const { gridX, gridY } = this.level.screenToGrid(x, y);
            
            if (this.level.canPlaceBuilding(gridX, gridY, this.buildingManager)) {
                const { screenX, screenY } = this.level.gridToScreenBuilding(gridX, gridY);
                
                if (this.buildingManager.placeBuilding(this.selectedBuildingType, screenX, screenY, gridX, gridY)) {
                    this.level.placeBuilding(gridX, gridY);
                    
                    // Test level maintains infinite gold
                    if (this.isTestLevel) {
                        this.gameState.gold = 999999;
                    }
                    
                    this.updateUI();
                    
                    // Clear selection after placing building
                    this.selectedBuildingType = null;
                    document.querySelectorAll('.building-btn').forEach(b => b.classList.remove('selected'));
                    this.level.setPlacementPreview(0, 0, false);
                }
            }
        }
    }
    
    getWaveConfig(level, wave) {
        // Level 1 wave configuration - 10 waves with gradual difficulty increase
        if (level === 1) {
            const baseEnemies = 5;
            const baseHealth = 40;
            const baseSpeed = 45;
            
            return {
                enemyCount: baseEnemies + Math.floor(wave * 1.5), // 5, 6, 8, 9, 11, 12, 14, 15, 17, 18
                enemyHealth: baseHealth + (wave - 1) * 8, // 40, 48, 56, 64, 72, 80, 88, 96, 104, 112
                enemySpeed: baseSpeed + (wave - 1) * 3, // 45, 48, 51, 54, 57, 60, 63, 66, 69, 72
                spawnInterval: Math.max(0.5, 1.2 - (wave - 1) * 0.05) // 1.2s down to 0.75s
            };
        }
        
        // Default fallback (for future levels)
        return {
            enemyCount: 10,
            enemyHealth: 100,
            enemySpeed: 50,
            spawnInterval: 1.0
        };
    }
    
    startWave() {
        if (this.gameState.wave > this.maxWavesForLevel) {
            this.completeLevel();
            return;
        }
        
        console.log(`Starting wave ${this.gameState.wave} of level ${this.currentLevel}`);
        this.waveInProgress = true;
        this.waveCompleted = false;
        
        const waveConfig = this.getWaveConfig(this.currentLevel, this.gameState.wave);
        this.enemyManager.spawnWave(
            this.gameState.wave, 
            waveConfig.enemyCount,
            waveConfig.enemyHealth,
            waveConfig.enemySpeed,
            waveConfig.spawnInterval
        );
        
        this.updateUI();
    }
    
    completeLevel() {
        alert(`Congratulations! You completed Level ${this.currentLevel}!\n\nFinal Stats:\n- Waves Completed: ${this.maxWavesForLevel}\n- Health Remaining: ${this.gameState.health}\n- Gold Earned: ${this.gameState.gold}`);
        this.stateManager.changeState('levelSelect');
    }
    
    update(deltaTime) {
        this.enemyManager.update(deltaTime);
        this.towerManager.update(deltaTime, this.enemyManager.enemies);
        this.buildingManager.update(deltaTime, this.towerManager.towers, this.enemyManager.enemies);
        
        const reachedEnd = this.enemyManager.checkReachedEnd();
        if (reachedEnd > 0) {
            if (!this.isTestLevel) {
                this.gameState.health -= reachedEnd;
                this.updateUI();
                
                if (this.gameState.health <= 0) {
                    alert(`Game Over!\n\nYou reached Wave ${this.gameState.wave} of Level ${this.currentLevel}\nTry again!`);
                    this.stateManager.changeState('start');
                    return;
                }
            }
        }
        
        const killedEnemies = this.enemyManager.removeDeadEnemies();
        if (killedEnemies > 0) {
            // Gold reward scales slightly with wave number
            const goldPerEnemy = 10 + Math.floor(this.gameState.wave / 2);
            this.gameState.gold += killedEnemies * goldPerEnemy;
            
            // Test level maintains infinite gold
            if (this.isTestLevel) {
                this.gameState.gold = 999999;
            }
            
            this.updateUI();
        }
        
        // Check if wave is completed
        if (this.waveInProgress && this.enemyManager.enemies.length === 0 && !this.enemyManager.spawning) {
            this.waveInProgress = false;
            this.waveCompleted = true;
            
            console.log(`Wave ${this.gameState.wave} completed`);
            
            // Move to next wave after a short delay
            setTimeout(() => {
                this.gameState.wave++;
                this.startWave();
            }, this.isTestLevel ? 1000 : 2000); // Faster waves in test level
        }
    }
    
    render(ctx) {
        this.level.render(ctx);
        this.buildingManager.render(ctx);
        this.towerManager.render(ctx);
        this.enemyManager.render(ctx);
        
        // Test level indicator
        if (this.isTestLevel) {
            ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
            ctx.font = 'bold 24px serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('TEST MODE', 20, 20);
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.font = '16px serif';
            ctx.fillText('∞ Resources • Endless Waves', 20, 50);
        }
    }
    
    updateUI() {
        document.getElementById('health').textContent = this.isTestLevel ? '∞' : this.gameState.health;
        document.getElementById('gold').textContent = this.isTestLevel ? '∞' : this.gameState.gold;
        
        if (this.isTestLevel) {
            document.getElementById('wave').textContent = `${this.gameState.wave} (TEST)`;
        } else {
            document.getElementById('wave').textContent = `${this.gameState.wave}/${this.maxWavesForLevel}`;
        }
        
        let statusText = `Enemies: ${this.enemyManager.enemies.length}`;
        if (this.waveCompleted) {
            statusText = 'Wave Complete!';
        } else if (!this.waveInProgress && this.enemyManager.enemies.length === 0) {
            statusText = 'Preparing...';
        }
        
        document.getElementById('enemies-remaining').textContent = statusText;
        
        // Update button states based on available gold (unless test level)
        document.querySelectorAll('.tower-btn, .building-btn').forEach(btn => {
            const cost = parseInt(btn.dataset.cost);
            if (this.isTestLevel || this.gameState.canAfford(cost)) {
                btn.classList.remove('disabled');
            } else {
                btn.classList.add('disabled');
            }
        });
    }
}

class Game {
    constructor() {
        console.log('Game: Starting initialization');
        
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        if (!this.canvas || !this.ctx) {
            console.error('Failed to get canvas or context');
            return;
        }
        
        console.log('Game: Canvas found, setting up...');
        
        // Detect and apply UI scaling based on screen resolution
        this.applyUIScaling();
        
        // Initial canvas resize
        this.resizeCanvas();
        console.log('Game: Canvas initial size:', this.canvas.width, 'x', this.canvas.height);
        
        // Initialize states immediately instead of waiting for animation frame
        this.initializeStates();
    }
    
    initializeStates() {
        console.log('Game: Initializing states with canvas size:', this.canvas.width, 'x', this.canvas.height);
        
        try {
            this.stateManager = new GameStateManager(this.canvas, this.ctx);
            console.log('Game: GameStateManager created');
            
            // Add states
            this.stateManager.addState('start', new StartScreen(this.stateManager));
            console.log('Game: StartScreen state added');
            
            this.stateManager.addState('levelSelect', new LevelSelect(this.stateManager));
            console.log('Game: LevelSelect state added');
            
            this.stateManager.addState('game', new GameplayState(this.stateManager));
            console.log('Game: GameplayState added');
            
            this.lastTime = 0;
            
            this.setupEventListeners();
            console.log('Game: Event listeners set up');
            
            // Start with the start screen
            console.log('Game: Starting with start screen');
            this.stateManager.changeState('start');
            
            // Start game loop immediately
            console.log('Game: Starting game loop');
            requestAnimationFrame((time) => this.gameLoop(time));
            
        } catch (error) {
            console.error('Error during state initialization:', error);
            // Show error on canvas
            this.showError(`Initialization failed: ${error.message}`);
        }
    }
    
    showError(message) {
        console.error('Game: Showing error on canvas:', message);
        if (this.ctx) {
            this.ctx.fillStyle = '#ff0000';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    applyUIScaling() {
        const width = window.screen.width;
        const height = window.screen.height;
        const dpr = window.devicePixelRatio || 1;
        
        // Calculate effective resolution
        const effectiveWidth = width * dpr;
        const effectiveHeight = height * dpr;
        
        // Add scaling class to body based on resolution
        document.body.classList.remove('scale-1x', 'scale-1-5x', 'scale-2x', 'scale-2-5x');
        
        if (effectiveWidth >= 7680 || effectiveHeight >= 4320) {
            // 8K+ displays
            document.body.classList.add('scale-2-5x');
        } else if (effectiveWidth >= 3840 || effectiveHeight >= 2160) {
            // 4K displays
            document.body.classList.add('scale-2x');
        } else if (effectiveWidth >= 2560 || effectiveHeight >= 1440) {
            // 1440p+ displays
            document.body.classList.add('scale-1-5x');
        } else {
            // 1080p and below
            document.body.classList.add('scale-1x');
        }
    }
    
    resizeCanvas() {
        const gameArea = document.getElementById('game-area');
        const sidebar = document.getElementById('tower-sidebar');
        const statsBar = document.getElementById('stats-bar');
        
        // Only account for visible UI elements
        const sidebarWidth = (sidebar && sidebar.style.display !== 'none') ? sidebar.offsetWidth : 0;
        const statsBarHeight = (statsBar && statsBar.style.display !== 'none') ? statsBar.offsetHeight : 0;
        
        const oldWidth = this.canvas.width;
        const oldHeight = this.canvas.height;
        
        this.canvas.width = window.innerWidth - sidebarWidth;
        this.canvas.height = window.innerHeight - statsBarHeight;
        
        // Only update game elements if we're in the game state and the state manager is initialized
        if (this.stateManager && 
            this.stateManager.currentState === 'game' && 
            this.stateManager.states.game && 
            this.stateManager.states.game.level &&
            this.stateManager.states.game.level.isInitialized) {
            
            const gameState = this.stateManager.states.game;
            const sizeChangeThreshold = 50;
            
            if (Math.abs(oldWidth - this.canvas.width) > sizeChangeThreshold ||
                Math.abs(oldHeight - this.canvas.height) > sizeChangeThreshold) {
                
                console.log('Game: Significant canvas resize detected, updating level and enemies');
                
                // Reinitialize level for new canvas size
                gameState.level.initializeForCanvas(this.canvas.width, this.canvas.height);
                
                // Update enemy manager with new path
                if (gameState.enemyManager) {
                    gameState.enemyManager.updatePath(gameState.level.path);
                    
                    // Update existing enemies to use new path if any exist
                    gameState.enemyManager.enemies.forEach(enemy => {
                        if (enemy.updatePath) {
                            enemy.updatePath(gameState.level.path);
                        } else {
                            // Fallback: reset enemy path reference
                            enemy.path = gameState.level.path;
                            // Ensure enemy position is still valid
                            if (enemy.currentPathIndex >= enemy.path.length - 1) {
                                enemy.currentPathIndex = Math.max(0, enemy.path.length - 2);
                            }
                        }
                    });
                }
            }
        }
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.applyUIScaling();
            this.resizeCanvas();
        });
        
        // Canvas click events
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            console.log('Game: Canvas click at', x, y, 'current state:', this.stateManager?.currentState);
            if (this.stateManager) {
                this.stateManager.handleClick(x, y);
            }
        });
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            console.log('Game: Canvas touch at', x, y);
            if (this.stateManager) {
                this.stateManager.handleClick(x, y);
            }
        });
        
        // Keyboard support for start screen
        document.addEventListener('keydown', (e) => {
            if (this.stateManager?.currentState === 'start' && 
                (e.key === 'Enter' || e.key === ' ')) {
                console.log('Game: Keyboard input detected on start screen');
                if (this.stateManager) {
                    this.stateManager.handleClick(0, 0); // Trigger click handler
                }
            }
        });
    }
    
    gameLoop(currentTime) {
        const deltaTime = Math.min(0.016, (currentTime - this.lastTime) / 1000); // Cap at 60fps
        this.lastTime = currentTime;
        
        try {
            // Clear canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Update and render current state
            if (this.stateManager) {
                this.stateManager.update(deltaTime);
                this.stateManager.render();
            } else {
                // Show loading message if state manager not ready
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('Loading...', this.canvas.width / 2, this.canvas.height / 2);
            }
        } catch (error) {
            console.error('Error in game loop:', error);
            this.showError(`Game loop error: ${error.message}`);
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Simplified initialization - remove the duplicate at the bottom
console.log('Starting game initialization');

// Single initialization point
function initializeGame() {
    console.log('DOM ready, creating game');
    try {
        new Game();
    } catch (error) {
        console.error('Failed to create game:', error);
        // Show error in the page
        document.body.innerHTML = `<div style="color: red; text-align: center; margin-top: 50px;">
            <h1>Game Failed to Load</h1>
            <p>Error: ${error.message}</p>
            <p>Check the console for more details.</p>
        </div>`;
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    console.log('Waiting for DOM...');
    document.addEventListener('DOMContentLoaded', initializeGame);
} else {
    console.log('DOM already ready, starting game immediately');
    initializeGame();
}
