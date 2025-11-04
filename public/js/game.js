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
    }
    
    enter() {
        this.setupEventListeners();
        this.updateUI();
        this.startWave();
    }
    
    setupEventListeners() {
        document.querySelectorAll('.tower-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
                this.selectedTowerType = e.target.dataset.type;
            });
        });
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
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight - 60;
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
