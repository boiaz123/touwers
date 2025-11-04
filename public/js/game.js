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
        this.mouseX = 0;
        this.mouseY = 0;
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
            const rect = this.stateManager.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
            
            if (!this.selectedTowerType) {
                this.hoveredGridCell = null;
                return;
            }
            
            const level = this.levelManager.getCurrentLevel();
            if (level && level.canPlaceTower(this.mouseX, this.mouseY, this.stateManager.ctx)) {
                // Store the actual placement position (grid-aligned center)
                this.hoveredGridCell = level.getGridCenterPosition(this.mouseX, this.mouseY, this.stateManager.ctx);
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
        
        // Draw hover indicator for 2x2 tower placement
        if (this.selectedTowerType) {
            const level = this.levelManager.getCurrentLevel();
            const towerType = this.towerManager.towerTypes[this.selectedTowerType];
            const scale = ctx.canvas.levelScale;
            
            const canPlace = this.hoveredGridCell !== null;
            const canAfford = this.gameState.canAfford(towerType.cost);
            
            // Draw grid highlight centered on grid-aligned position when valid
            if (canPlace) {
                const gridSize = scale ? level.gridSize * scale.scaleX : level.gridSize;
                const towerSize = gridSize * 2; // 2x2 cells
                
                // Convert grid center to screen coordinates for grid highlight
                const gridScreenX = scale ? 
                    this.hoveredGridCell.x * scale.scaleX + scale.offsetX : 
                    this.hoveredGridCell.x;
                const gridScreenY = scale ? 
                    this.hoveredGridCell.y * scale.scaleY + scale.offsetY : 
                    this.hoveredGridCell.y;
                
                // Draw grid highlight centered on the 2x2 area
                ctx.fillStyle = canAfford ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)';
                ctx.fillRect(
                    gridScreenX - towerSize / 2,
                    gridScreenY - towerSize / 2,
                    towerSize,
                    towerSize
                );
                
                // Draw preview tower centered on the grid-aligned position
                ctx.fillStyle = canAfford ? 
                    'rgba(255, 255, 255, 0.7)' : 'rgba(255, 100, 100, 0.5)';
                ctx.strokeStyle = canAfford ? 
                    'rgba(255, 255, 255, 0.9)' : 'rgba(255, 100, 100, 0.7)';
                ctx.lineWidth = 2;
                
                ctx.beginPath();
                const towerRadius = scale ? 30 * scale.scaleX : 30;
                ctx.arc(gridScreenX, gridScreenY, towerRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else {
                // Draw preview tower centered on mouse cursor when placement is invalid
                ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
                ctx.strokeStyle = 'rgba(255, 100, 100, 0.7)';
                ctx.lineWidth = 2;
                
                ctx.beginPath();
                const towerRadius = scale ? 30 * scale.scaleX : 30;
                ctx.arc(this.mouseX, this.mouseY, towerRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // Add a crosshair at mouse position when placement is invalid
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.lineWidth = 1;
                const crossSize = 10;
                
                ctx.beginPath();
                ctx.moveTo(this.mouseX - crossSize, this.mouseY);
                ctx.lineTo(this.mouseX + crossSize, this.mouseY);
                ctx.moveTo(this.mouseX, this.mouseY - crossSize);
                ctx.lineTo(this.mouseX, this.mouseY + crossSize);
                ctx.stroke();
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
        
        // Calculate available space
        const availableWidth = window.innerWidth - sidebarWidth;
        const availableHeight = window.innerHeight - statsBarHeight;
        
        // Set canvas to fill available space exactly
        this.canvas.width = availableWidth;
        this.canvas.height = availableHeight;
        
        // Store scaling information for level rendering
        this.canvas.levelScale = {
            scaleX: availableWidth / (40 * 40), // 40 cols * 40px grid size
            scaleY: availableHeight / (30 * 40), // 30 rows * 40px grid size
            offsetX: 0,
            offsetY: 0
        };
        
        // Use uniform scaling to maintain aspect ratio
        const uniformScale = Math.min(this.canvas.levelScale.scaleX, this.canvas.levelScale.scaleY);
        this.canvas.levelScale.scaleX = uniformScale;
        this.canvas.levelScale.scaleY = uniformScale;
        
        // Center the level in the canvas
        const scaledLevelWidth = 40 * 40 * uniformScale;
        const scaledLevelHeight = 30 * 40 * uniformScale;
        this.canvas.levelScale.offsetX = (availableWidth - scaledLevelWidth) / 2;
        this.canvas.levelScale.offsetY = (availableHeight - scaledLevelHeight) / 2;
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
