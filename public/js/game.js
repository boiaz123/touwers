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
        this.towerManager = new TowerManager(this.gameState, this.level);
        this.enemyManager = null;
        this.selectedTowerType = null;
        this.selectedBuildingType = null;
        this.currentLevel = 1; // Track current level
        this.maxWavesForLevel = 10; // Level 1 has 10 waves
        this.waveInProgress = false;
        this.waveCompleted = false;
        console.log('GameplayState constructor completed');
    }
    
    enter() {
        console.log('GameplayState: entering');
        
        // Get level info from state manager
        const levelInfo = this.stateManager.selectedLevelInfo || { name: 'The King\'s Road', type: 'campaign' };
        
        // Reset game state for new level
        this.gameState = new GameState();
        this.currentLevel = 1;
        this.levelType = levelInfo.type || 'campaign';
        this.levelName = levelInfo.name || 'Unknown Level';
        
        // Configure level-specific settings
        if (this.levelType === 'sandbox') {
            this.gameState.gold = 10000; // High starting gold for testing
            this.maxWavesForLevel = Infinity; // No wave limit
            this.isSandbox = true;
        } else {
            this.maxWavesForLevel = 10; // Level 1 has 10 waves
            this.isSandbox = false;
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
        
        // Recreate tower manager to ensure it has the updated level reference
        this.towerManager = new TowerManager(this.gameState, this.level);
        
        this.setupEventListeners();
        this.updateUI();
        this.startWave();
        console.log(`GameplayState: Initialized ${this.levelName} (${this.levelType})`);
        console.log('GameplayState: enter completed');
    }
    
    exit() {
        // Clean up event listeners when leaving game state
        this.removeEventListeners();
    }
    
    setupEventListeners() {
        // Remove existing listeners first to avoid duplicates
        this.removeEventListeners();
        
        // Tower button listeners
        document.querySelectorAll('.tower-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectTower(e.currentTarget);
            });
            
            btn.addEventListener('mouseenter', (e) => {
                this.showTowerInfo(e.currentTarget.dataset.type);
            });
            
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.showTowerInfo(e.currentTarget.dataset.type);
            });
        });
        
        // Building button listeners
        document.querySelectorAll('.building-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectBuilding(e.currentTarget);
            });
            
            btn.addEventListener('mouseenter', (e) => {
                this.showBuildingInfo(e.currentTarget.dataset.type);
            });
            
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.showBuildingInfo(e.currentTarget.dataset.type);
            });
        });
        
        // Mouse move listener for placement preview
        this.mouseMoveHandler = (e) => this.handleMouseMove(e);
        this.stateManager.canvas.addEventListener('mousemove', this.mouseMoveHandler);
        
        // Single unified click handler - removed duplicate
        this.clickHandler = (e) => {
            const rect = this.stateManager.canvas.getBoundingClientRect();
            const canvasX = e.clientX - rect.left;
            const canvasY = e.clientY - rect.top;
            
            // Check for forge upgrade menu first
            const clickResult = this.towerManager.handleClick(canvasX, canvasY, rect);
            if (clickResult && clickResult.type === 'forge_menu') {
                this.showForgeUpgradeMenu(clickResult);
                return;
            }
            
            // Handle regular tower/building placement
            this.handleClick(canvasX, canvasY);
        };
        this.stateManager.canvas.addEventListener('click', this.clickHandler);
    }
    
    removeEventListeners() {
        // Clean up event listeners properly
        document.querySelectorAll('.tower-btn, .building-btn').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });
        
        if (this.mouseMoveHandler) {
            this.stateManager.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
            this.mouseMoveHandler = null;
        }
        
        if (this.clickHandler) {
            this.stateManager.canvas.removeEventListener('click', this.clickHandler);
            this.clickHandler = null;
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
        
        const size = this.selectedBuildingType ? 4 : 2;
        this.level.setPlacementPreview(x, y, true, this.towerManager, size);
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
        
        // Clear building selection
        this.selectedBuildingType = null;
        document.querySelectorAll('.building-btn').forEach(b => b.classList.remove('selected'));
        
        this.showTowerInfo(towerType);
    }
    
    selectBuilding(btn) {
        const buildingType = btn.dataset.type;
        const cost = parseInt(btn.dataset.cost);
        
        // Check if player can afford this building
        if (!this.gameState.canAfford(cost)) {
            return;
        }
        
        // Update selection
        document.querySelectorAll('.building-btn').forEach(b => b.classList.remove('selected'));
        document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        
        // Clear tower selection
        this.selectedTowerType = null;
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
        const info = this.towerManager.getBuildingInfo(buildingType);
        if (!info) return;
        
        const infoPanel = document.getElementById('tower-info');
        infoPanel.innerHTML = `
            <div class="info-title">${info.name}</div>
            <div class="info-stats">
                <div>Effect: ${info.effect}</div>
                <div>Size: ${info.size}</div>
                <div>Cost: $${info.cost}</div>
            </div>
            <div style="margin-top: 4px; font-size: 8px; color: #a88;">${info.description}</div>
        `;
    }
    
    handleClick(x, y) {
        // First check if clicking on a building (like gold mine)
        const goldCollected = this.towerManager.handleClick(x, y, { 
            width: this.stateManager.canvas.width, 
            height: this.stateManager.canvas.height 
        });
        
        if (goldCollected > 0) {
            this.gameState.gold += goldCollected;
            this.updateUI();
            return;
        }
        
        if (this.selectedTowerType) {
            const { gridX, gridY } = this.level.screenToGrid(x, y);
            
            if (this.level.canPlaceTower(gridX, gridY, this.towerManager)) {
                const { screenX, screenY } = this.level.gridToScreen(gridX, gridY);
                
                if (this.towerManager.placeTower(this.selectedTowerType, screenX, screenY, gridX, gridY)) {
                    this.level.placeTower(gridX, gridY);
                    this.updateUI();
                    
                    this.selectedTowerType = null;
                    document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
                    this.level.setPlacementPreview(0, 0, false);
                }
            }
        } else if (this.selectedBuildingType) {
            const { gridX, gridY } = this.level.screenToGrid(x, y);
            
            if (this.level.canPlaceBuilding(gridX, gridY, 4, this.towerManager)) {
                const { screenX, screenY } = this.level.gridToScreen(gridX, gridY, 4);
                
                if (this.towerManager.placeBuilding(this.selectedBuildingType, screenX, screenY, gridX, gridY)) {
                    this.level.placeBuilding(gridX, gridY, 4);
                    this.updateUI();
                    
                    this.selectedBuildingType = null;
                    document.querySelectorAll('.building-btn').forEach(b => b.classList.remove('selected'));
                    this.level.setPlacementPreview(0, 0, false);
                }
            }
        }
    }
    
    showForgeUpgradeMenu(forgeData) {
        // Clear existing menus
        this.clearActiveMenus();
        
        // Create upgrade menu with proper currency check
        const menu = document.createElement('div');
        menu.id = 'forge-upgrade-menu';
        menu.className = 'upgrade-menu';
        menu.innerHTML = `
            <div class="menu-header">
                <h3>🔨 Tower Forge Upgrades</h3>
                <button class="close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="upgrade-list">
                ${forgeData.upgrades.map(upgrade => `
                    <div class="upgrade-item ${upgrade.level >= upgrade.maxLevel ? 'maxed' : ''}">
                        <div class="upgrade-icon">${upgrade.icon}</div>
                        <div class="upgrade-details">
                            <div class="upgrade-name">${upgrade.name}</div>
                            <div class="upgrade-desc">${upgrade.description}</div>
                            <div class="upgrade-level">Level: ${upgrade.level}/${upgrade.maxLevel}</div>
                        </div>
                        <div class="upgrade-cost">
                            ${upgrade.cost ? `$${upgrade.cost}` : 'MAX'}
                        </div>
                        <button class="upgrade-btn" 
                                data-upgrade="${upgrade.id}" 
                                ${(!upgrade.cost || this.gameState.gold < upgrade.cost) ? 'disabled' : ''}>
                            ${upgrade.cost ? 'Upgrade' : 'MAX'}
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
        
        document.body.appendChild(menu);
        
        // Add upgrade button handlers
        menu.querySelectorAll('.upgrade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const upgradeId = e.target.dataset.upgrade;
                if (forgeData.forge.purchaseUpgrade(upgradeId, this.gameState)) {
                    this.updateUI();
                    this.showForgeUpgradeMenu(forgeData); // Refresh menu
                }
            });
        });
        
        this.activeMenu = menu;
    }
    
    clearActiveMenus() {
        const existingMenus = document.querySelectorAll('.upgrade-menu');
        existingMenus.forEach(menu => menu.remove());
        if (this.activeMenu) {
            this.activeMenu.remove();
            this.activeMenu = null;
        }
    }
}

class Game {
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
            
            // Set initial canvas size
            this.resizeCanvas();
            console.log('Game: Canvas resized to:', this.canvas.width, 'x', this.canvas.height);
            
            // Prevent infinite resize loops
            this.isResizing = false;
            
            this.stateManager = new GameStateManager(this.canvas, this.ctx);
            console.log('Game: GameStateManager created');
            
            // Add states with comprehensive error handling
            console.log('Game: Adding states...');
            
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
            
            this.lastTime = 0;
            this.setupEventListeners();
            
            // Start with the start screen
            console.log('Game: Changing to start state');
            const stateChanged = this.stateManager.changeState('start');
            
            if (!stateChanged) {
                throw new Error('Failed to change to start state');
            }
            
            console.log('Game: Starting game loop');
            this.startGameLoop();
            
        } catch (error) {
            console.error('Game: Critical error during initialization:', error);
            console.error('Stack trace:', error.stack);
            
            // Show error on screen
            if (this.canvas && this.ctx) {
                this.showError(error.message);
            }
        }
    }
    
    startGameLoop() {
        console.log('Game: Game loop starting');
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    showError(message) {
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
    }
    
    gameLoop(currentTime) {
        try {
            const deltaTime = Math.min(0.016, (currentTime - this.lastTime) / 1000);
            this.lastTime = currentTime;
            
            // Clear the canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Update and render current state
            if (this.stateManager) {
                this.stateManager.update(deltaTime);
                this.stateManager.render();
            } else {
                // Fallback if state manager is not available
                this.ctx.fillStyle = '#ff0000';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('State Manager Error', this.canvas.width / 2, this.canvas.height / 2);
            }
            
        } catch (error) {
            console.error('Game: Error in game loop:', error);
            this.showError('Game loop error: ' + error.message);
        }
        
        // Continue the game loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Add comprehensive error handling for the initialization
window.addEventListener('load', () => {
    console.log('Window loaded, starting game initialization');
    
    try {
        new Game();
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Critical error initializing game:', error);
        console.error('Stack trace:', error.stack);
        
        // Show error message on page if canvas is available
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
