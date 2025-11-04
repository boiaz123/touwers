import { TowerManager } from './towers/TowerManager.js';
import { EnemyManager } from './enemies/EnemyManager.js';
import { LevelManager } from './LevelManager.js';
import { GameState } from './GameState.js';
import { GameStateManager } from './GameStateManager.js';
import { StartScreen } from './StartScreen.js';
import { LevelSelect } from './LevelSelect.js';

class GameplayState {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.gameState = new GameState();
        this.levelManager = new LevelManager();
        this.towerManager = new TowerManager(this.gameState);
        this.enemyManager = null;
        this.selectedTowerType = null;
        this.hoveredGridCell = null;
    }
    
    enter() {
        // Load the first level
        if (!this.levelManager.loadLevel(1)) {
            console.error('Failed to load level 1');
            this.stateManager.changeState('start');
            return;
        }
        
        // Initialize enemy manager with the level's path
        this.enemyManager = new EnemyManager(this.levelManager.getPath());
        
        // Ensure UI is visible
        document.getElementById('stats-bar').style.display = 'flex';
        document.getElementById('tower-sidebar').style.display = 'flex';
        
        this.setupEventListeners();
        this.updateUI();
        this.startWave();
        
        // Setup mouse move for grid highlighting
        this.setupMouseMove();
    }
    
    exit() {
        this.removeEventListeners();
        this.removeMouseMove();
    }
    
    setupMouseMove() {
        this.mouseMoveHandler = (e) => {
            if (!this.selectedTowerType) {
                this.hoveredGridCell = null;
                return;
            }
            
            const rect = this.stateManager.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const level = this.levelManager.getCurrentLevel();
            if (level && level.canPlaceTower(x, y)) {
                this.hoveredGridCell = level.getGridCenterPosition(x, y);
            } else {
                this.hoveredGridCell = null;
            }
        };
        this.stateManager.canvas.addEventListener('mousemove', this.mouseMoveHandler);
    }
    
    removeMouseMove() {
        if (this.mouseMoveHandler) {
            this.stateManager.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
        }
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
        
        const placementResult = this.levelManager.placeTower(x, y);
        if (placementResult) {
            if (this.towerManager.placeTower(this.selectedTowerType, placementResult.x, placementResult.y)) {
                this.updateUI();
                this.hoveredGridCell = null;
            }
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
        this.levelManager.render(ctx);
        
        // Draw hover indicator
        if (this.hoveredGridCell && this.selectedTowerType) {
            const level = this.levelManager.getCurrentLevel();
            const towerType = this.towerManager.towerTypes[this.selectedTowerType];
            
            ctx.fillStyle = this.gameState.canAfford(towerType.cost) ? 
                'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)';
            
            ctx.fillRect(
                this.hoveredGridCell.x - level.gridSize / 2,
                this.hoveredGridCell.y - level.gridSize / 2,
                level.gridSize,
                level.gridSize
            );
            
            // Draw preview tower
            if (this.gameState.canAfford(towerType.cost)) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.beginPath();
                ctx.arc(this.hoveredGridCell.x, this.hoveredGridCell.y, 15, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        this.towerManager.render(ctx);
        if (this.enemyManager) {
            this.enemyManager.render(ctx);
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
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Detect and apply UI scaling based on screen resolution
        this.applyUIScaling();
        
        this.resizeCanvas();
        
        this.stateManager = new GameStateManager(this.canvas, this.ctx);
        
        // Add states
        this.stateManager.addState('start', new StartScreen(this.stateManager));
        this.stateManager.addState('levelSelect', new LevelSelect(this.stateManager));
        this.stateManager.addState('game', new GameplayState(this.stateManager));
        
        this.lastTime = 0;
        
        this.setupEventListeners();
        this.gameLoop(0);
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
        
        // Set canvas size to accommodate the larger map
        const availableWidth = window.innerWidth - sidebarWidth;
        const availableHeight = window.innerHeight - statsBarHeight;
        
        // Level is 40x30 cells at 40px each = 1600x1200 pixels
        const levelWidth = 40 * 40; // 1600px
        const levelHeight = 30 * 40; // 1200px
        
        // Scale canvas to fit the level while maintaining aspect ratio
        const scaleX = availableWidth / levelWidth;
        const scaleY = availableHeight / levelHeight;
        const scale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 1:1
        
        this.canvas.width = Math.max(availableWidth, levelWidth);
        this.canvas.height = Math.max(availableHeight, levelHeight);
        
        // If the level is larger than available space, we might need scrolling
        // For now, just use the available space
        if (this.canvas.width > availableWidth) {
            this.canvas.width = availableWidth;
        }
        if (this.canvas.height > availableHeight) {
            this.canvas.height = availableHeight;
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
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.stateManager.update(deltaTime);
        this.stateManager.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

new Game();
