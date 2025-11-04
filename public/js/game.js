import { TowerManager } from './towers/TowerManager.js';
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
        this.towerManager = new TowerManager(this.gameState);
        this.enemyManager = new EnemyManager(this.level.path);
        this.selectedTowerType = null;
        
        // Tower information database
        this.towerInfo = {
            'basic': {
                name: 'Basic Tower',
                description: 'A reliable defensive structure with moderate damage and range.',
                damage: '20',
                range: '120',
                fireRate: '1.0/sec'
            },
            'cannon': {
                name: 'Cannon Tower',
                description: 'Heavy artillery with high damage but slow fire rate.',
                damage: '50',
                range: '100',
                fireRate: '0.5/sec'
            },
            'archer': {
                name: 'Archer Tower',
                description: 'Fast-firing tower with good range but lower damage.',
                damage: '15',
                range: '140',
                fireRate: '1.5/sec'
            },
            'magic': {
                name: 'Magic Tower',
                description: 'Mystical tower that pierces armor and slows enemies.',
                damage: '30',
                range: '110',
                fireRate: '0.8/sec'
            }
        };
    }
    
    enter() {
        this.setupEventListeners();
        this.updateUI();
        this.startWave();
    }
    
    setupEventListeners() {
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
        const info = this.towerInfo[towerType];
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
        
        if (this.towerManager.placeTower(this.selectedTowerType, x, y)) {
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
        this.level.render(ctx);
        this.towerManager.render(ctx);
        this.enemyManager.render(ctx);
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
    
    resizeCanvas() {
        const gameArea = document.getElementById('game-area');
        const sidebar = document.getElementById('tower-sidebar');
        const sidebarWidth = sidebar ? sidebar.offsetWidth : 0;
        
        this.canvas.width = window.innerWidth - sidebarWidth;
        this.canvas.height = window.innerHeight - 50; // Account for stats bar
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());
        
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
