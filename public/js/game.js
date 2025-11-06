import { TowerManager } from './towers/TowerManager.js';
import { EnemyManager } from './enemies/EnemyManager.js';
import { Level1 } from './levels/Level1.js'; // Import Level1 instead of Level
import { GameState } from './GameState.js';
import { GameStateManager } from './GameStateManager.js';
import { StartScreen } from './StartScreen.js';
import { LevelSelect } from './LevelSelect.js';

class GameplayState {
    constructor(stateManager) {
        console.log('GameplayState: Initializing...');
        this.stateManager = stateManager;
        this.gameState = new GameState();
        this.level = new Level1(); // Use Level1 instead of Level
        this.towerManager = new TowerManager(this.gameState, this.level); // Pass level reference
        this.enemyManager = new EnemyManager(this.level.worldPath); // Use worldPath from Level1
        this.selectedTowerType = null;
        
        console.log('GameplayState: Level created with path length:', this.level.worldPath.length);
        console.log('GameplayState: Level dimensions:', this.level.cols, 'x', this.level.rows);
        
        // Setup level scaling for proper rendering
        this.setupLevelScaling();
    }
    
    setupLevelScaling() {
        const canvas = this.stateManager.canvas;
        const levelWidth = this.level.cols * this.level.gridSize;
        const levelHeight = this.level.rows * this.level.gridSize;
        
        console.log('GameplayState: Setting up scaling for level size:', levelWidth, 'x', levelHeight);
        console.log('GameplayState: Canvas size:', canvas.width, 'x', canvas.height);
        
        // Calculate scale to fit level in canvas with some padding
        const scaleX = (canvas.width - 40) / levelWidth;
        const scaleY = (canvas.height - 40) / levelHeight;
        const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
        
        // Center the level
        const offsetX = (canvas.width - levelWidth * scale) / 2;
        const offsetY = (canvas.height - levelHeight * scale) / 2;
        
        console.log('GameplayState: Applied scale:', scale, 'offset:', offsetX, offsetY);
        
        // Store scaling info on canvas for level to use
        canvas.levelScale = {
            scaleX: scale,
            scaleY: scale,
            offsetX: offsetX,
            offsetY: offsetY
        };
    }
    
    enter() {
        console.log('GameplayState: Entering game state');
        
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
        
        this.setupEventListeners();
        this.updateUI();
        this.startWave();
        
        // Update level scaling when entering
        this.setupLevelScaling();
    }
    
    exit() {
        // Clean up event listeners when leaving game state
        this.removeEventListeners();
    }
    
    setupEventListeners() {
        // Remove existing listeners first to avoid duplicates
        this.removeEventListeners();
        
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
    }
    
    removeEventListeners() {
        // Clean up event listeners
        document.querySelectorAll('.tower-btn').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });
    }
    
    selectTower(btn) {
        const towerType = btn.dataset.type;
        const cost = parseInt(btn.dataset.cost);
        
        // Check if player can afford this tower
        if (!this.gameState.canAfford(cost)) {
            return;
        }
        
        // Update selection
        document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedTowerType = towerType;
        
        this.showTowerInfo(towerType);
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
    
    handleClick(x, y) {
        if (!this.selectedTowerType) return;
        
        // Pass the rendering context for proper coordinate conversion
        if (this.towerManager.placeTower(this.selectedTowerType, x, y, this.stateManager.ctx)) {
            this.updateUI();
        }
    }
    
    startWave() {
        this.enemyManager.spawnWave(this.gameState.wave, 10);
    }
    
    update(deltaTime) {
        this.enemyManager.update(deltaTime);
        this.towerManager.update(deltaTime, this.enemyManager.enemies);
        
        const reachedEnd = this.enemyManager.checkReachedEnd();
        if (reachedEnd > 0) {
            this.gameState.health -= reachedEnd;
            this.updateUI();
            
            if (this.gameState.health <= 0) {
                alert('Game Over!');
                this.stateManager.changeState('start');
                return;
            }
        }
        
        const killedEnemies = this.enemyManager.removeDeadEnemies();
        if (killedEnemies > 0) {
            this.gameState.gold += killedEnemies * 10;
            this.updateUI();
        }
        
        if (this.enemyManager.enemies.length === 0 && !this.enemyManager.spawning) {
            this.gameState.wave++;
            this.updateUI();
            setTimeout(() => this.startWave(), 2000);
        }
    }
    
    render(ctx) {
        try {
            // Update scaling on each render in case window was resized
            this.setupLevelScaling();
            
            // Clear canvas with a test color to verify rendering is working
            ctx.fillStyle = '#222';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            
            this.level.render(ctx);
            this.towerManager.render(ctx);
            this.enemyManager.render(ctx);
        } catch (error) {
            console.error('GameplayState: Error during render:', error);
        }
    }
    
    updateUI() {
        document.getElementById('health').textContent = this.gameState.health;
        document.getElementById('gold').textContent = this.gameState.gold;
        document.getElementById('wave').textContent = this.gameState.wave;
        document.getElementById('enemies-remaining').textContent = 
            `Enemies: ${this.enemyManager.enemies.length}`;
        
        // Update tower button states based on available gold
        document.querySelectorAll('.tower-btn').forEach(btn => {
            const cost = parseInt(btn.dataset.cost);
            if (this.gameState.canAfford(cost)) {
                btn.classList.remove('disabled');
            } else {
                btn.classList.add('disabled');
            }
        });
    }
}

class Game {
    constructor() {
        console.log('Game: Initializing...');
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        if (!this.canvas || !this.ctx) {
            console.error('Game: Failed to get canvas or context');
            return;
        }
        
        console.log('Game: Canvas and context obtained');
        
        // Detect and apply UI scaling based on screen resolution
        this.applyUIScaling();
        
        this.resizeCanvas();
        
        this.stateManager = new GameStateManager(this.canvas, this.ctx);
        
        // Add states
        this.stateManager.addState('start', new StartScreen(this.stateManager));
        this.stateManager.addState('levelSelect', new LevelSelect(this.stateManager));
        this.stateManager.addState('game', new GameplayState(this.stateManager));
        
        console.log('Game: States added');
        
        // Initialize with start state
        this.stateManager.changeState('start');
        console.log('Game: Changed to start state');
        
        this.lastTime = 0;
        
        this.setupEventListeners();
        this.gameLoop(0);
        
        console.log('Game: Initialization complete');
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
        
        this.canvas.width = window.innerWidth - sidebarWidth;
        this.canvas.height = window.innerHeight - statsBarHeight;
        
        // Update level scaling when canvas is resized
        if (this.stateManager.states.game && this.stateManager.currentState === 'game') {
            this.stateManager.states.game.setupLevelScaling();
        }
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.applyUIScaling();
            this.resizeCanvas();
        });
        
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.stateManager.handleClick(x, y);
        });
    }
    
    gameLoop(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Clear the canvas with a dark background
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        try {
            this.stateManager.update(deltaTime);
            this.stateManager.render();
        } catch (error) {
            console.error('Game: Error in game loop:', error);
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Ensure DOM is loaded before starting the game
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, starting game...');
        new Game();
    });
} else {
    console.log('DOM already loaded, starting game...');
    new Game();
}
