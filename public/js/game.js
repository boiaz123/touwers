import { TowerManager } from './towers/TowerManager.js';
import { EnemyManager } from './enemies/EnemyManager.js';
import { Level } from './Level.js';
import { LevelManager } from './LevelManager.js';
import { GameState } from './GameState.js';
import { MenuManager } from './MenuManager.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.gameState = new GameState();
        this.levelManager = new LevelManager();
        this.level = new Level(this.levelManager);
        this.towerManager = new TowerManager(this.gameState);
        this.enemyManager = new EnemyManager(this.level.path);
        
        this.selectedTowerType = null;
        this.lastTime = 0;
        this.isMobile = this.detectMobile();
        this.gameRunning = false;
        
        // Initialize menu system
        this.menuManager = new MenuManager(this);
        
        this.setupEventListeners();
        this.resizeCanvas();
    }
    
    startLevel(levelNumber) {
        // Set the specific level
        this.levelManager.setLevel(levelNumber);
        this.level.updateLevel();
        this.enemyManager.updatePath(this.level.path);
        
        // Reset game state for new level
        this.gameState = new GameState();
        this.towerManager = new TowerManager(this.gameState);
        this.enemyManager = new EnemyManager(this.level.path);
        
        this.updateUI();
        this.gameRunning = true;
        
        // Start the game loop if not already running
        if (!this.gameLoopRunning) {
            this.gameLoopRunning = true;
            this.lastTime = 0;
            this.gameLoop(0);
        }
        
        this.startWave();
    }
    
    resetGame() {
        this.gameRunning = false;
        this.enemyManager.enemies = [];
        this.towerManager.towers = [];
        this.enemyManager.spawnQueue = [];
        this.enemyManager.spawning = false;
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.matchMedia('(max-width: 768px)').matches;
    }
    
    resizeCanvas() {
        const ui = document.getElementById('ui');
        const uiHeight = ui.offsetHeight;
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight - uiHeight;
        
        // Scale for high DPI displays
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.ctx.scale(dpr, dpr);
        
        // Update level path to fit new canvas size
        this.level.updatePathForSize(rect.width, rect.height);
        this.enemyManager.updatePath(this.level.path);
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => {
            setTimeout(() => this.resizeCanvas(), 100);
        });
        
        // Handle orientation change on mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.resizeCanvas(), 200);
        });
        
        document.querySelectorAll('.tower-btn').forEach(btn => {
            const addEventListeners = (element) => {
                const selectTower = (e) => {
                    e.preventDefault();
                    document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
                    element.classList.add('selected');
                    this.selectedTowerType = element.dataset.type;
                };
                
                element.addEventListener('click', selectTower);
                element.addEventListener('touchend', selectTower);
            };
            
            addEventListeners(btn);
        });
        
        // Mouse events for desktop
        this.canvas.addEventListener('click', (e) => this.handleInput(e));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleInput(e.touches[0]);
        });
        
        // Prevent scrolling on mobile
        document.addEventListener('touchmove', (e) => {
            if (e.target === this.canvas) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Add back to menu button functionality
        const backBtn = document.getElementById('backToMenuBtn-game');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.menuManager.returnToMenu();
            });
        }
    }
    
    handleInput(inputEvent) {
        if (!this.selectedTowerType) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const x = (inputEvent.clientX - rect.left) * scaleX / (window.devicePixelRatio || 1);
        const y = (inputEvent.clientY - rect.top) * scaleY / (window.devicePixelRatio || 1);
        
        if (this.towerManager.placeTower(this.selectedTowerType, x, y)) {
            this.updateUI();
        }
    }
    
    startWave() {
        this.enemyManager.spawnWave(this.gameState.wave, 10);
    }
    
    gameLoop(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        if (this.gameRunning) {
            this.update(deltaTime);
            this.render();
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        if (!this.gameRunning) return;
        
        this.enemyManager.update(deltaTime);
        this.towerManager.update(deltaTime, this.enemyManager.enemies);
        
        const reachedEnd = this.enemyManager.checkReachedEnd();
        if (reachedEnd > 0) {
            this.gameState.health -= reachedEnd;
            this.updateUI();
            
            if (this.gameState.health <= 0) {
                alert('Game Over!');
                this.menuManager.returnToMenu();
                return;
            }
        }
        
        const killedEnemies = this.enemyManager.removeDeadEnemies();
        if (killedEnemies > 0) {
            this.gameState.gold += killedEnemies * 10;
            this.updateUI();
        }
        
        if (this.enemyManager.enemies.length === 0 && !this.enemyManager.spawning) {
            if (this.gameState.wave >= 5) {
                // Progress to next level every 5 waves
                if (this.level.nextLevel()) {
                    this.gameState.wave = 1;
                    this.enemyManager.updatePath(this.level.path);
                    alert(`Level ${this.levelManager.getLevelNumber()} unlocked!`);
                } else {
                    alert('Congratulations! You completed all levels!');
                    this.menuManager.returnToMenu();
                    return;
                }
            } else {
                this.gameState.wave++;
            }
            this.updateUI();
            setTimeout(() => this.startWave(), 2000);
        }
    }
    
    render() {
        if (!this.gameRunning) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.level.render(this.ctx);
        this.towerManager.render(this.ctx);
        this.enemyManager.render(this.ctx);
    }
    
    updateUI() {
        document.getElementById('health').textContent = this.gameState.health;
        document.getElementById('gold').textContent = this.gameState.gold;
        document.getElementById('wave').textContent = this.gameState.wave;
        document.getElementById('level').textContent = this.levelManager.getLevelNumber();
    }
}

new Game();
