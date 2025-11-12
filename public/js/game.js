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
        
        // Configure level-specific settings - STORE sandbox flag BEFORE creating managers
        this.isSandbox = (this.levelType === 'sandbox');
        
        if (this.isSandbox) {
            this.gameState.gold = 100000;
            this.maxWavesForLevel = Infinity;
        } else {
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
        
        // Recreate tower manager to ensure it has the updated level reference
        this.towerManager = new TowerManager(this.gameState, this.level);
        
        // SANDBOX: Force initialize gems right after tower manager is created
        if (this.isSandbox) {
            console.log('GameplayState: SANDBOX MODE - Forcing gem initialization');
            
            // Use setTimeout to ensure building manager is fully initialized
            setTimeout(() => {
                this.forceSandboxGemInitialization();
            }, 0);
        }
        
        this.setupEventListeners();
        this.updateUI();
        this.startWave();
        console.log(`GameplayState: Initialized ${this.levelName} (${this.levelType})`);
        console.log('GameplayState: enter completed');
    }
    
    forceSandboxGemInitialization() {
        console.log('GameplayState: Force initializing sandbox gems...');
        
        // Find academy in building manager
        const academy = this.towerManager?.buildingManager?.buildings?.find(b => 
            b.constructor.name === 'MagicAcademy'
        );
        
        if (academy) {
            console.log('GameplayState: Found academy, initializing gems...');
            
            // Force set gems
            academy.gems.fire = 100;
            academy.gems.water = 100;
            academy.gems.air = 100;
            academy.gems.earth = 100;
            academy.gems.diamond = 100;
            
            // Unlock features
            academy.diamondMiningUnlocked = true;
            academy.gemMiningResearched = false; // Keep as research option
            
            console.log('GameplayState: Academy gems set to:', academy.gems);
            
            // Enable gem mining toggle on all mines
            this.towerManager.buildingManager.buildings.forEach(building => {
                if (building.constructor.name === 'GoldMine') {
                    building.setAcademy(academy);
                    building.gemMiningUnlocked = true;
                    console.log('GameplayState: Mine gem toggle enabled');
                }
            });
            
            // Force UI update
            this.updateUI();
            console.log('GameplayState: Sandbox gems initialized successfully!');
        } else {
            console.error('GameplayState: NO ACADEMY FOUND! Cannot initialize gems.');
            console.log('GameplayState: Available buildings:', 
                this.towerManager?.buildingManager?.buildings?.map(b => b.constructor.name)
            );
        }
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
        
        // FIXED: Unified click handler that properly routes all menu types
        this.clickHandler = (e) => {
            const rect = this.stateManager.canvas.getBoundingClientRect();
            const canvasX = e.clientX - rect.left;
            const canvasY = e.clientY - rect.top;
            
            // Check for building/tower clicks first
            const clickResult = this.towerManager.handleClick(canvasX, canvasY, rect);
            
            if (clickResult) {
                if (clickResult.type === 'forge_menu') {
                    this.showForgeUpgradeMenu(clickResult);
                    return;
                } else if (clickResult.type === 'academy_menu') {
                    this.showAcademyUpgradeMenu(clickResult);
                    return;
                } else if (clickResult.type === 'magic_tower_menu') {
                    this.showMagicTowerElementMenu(clickResult);
                    return;
                } else if (clickResult.type === 'combination_tower_menu') {
                    // New: Handle combination tower menu
                    this.showCombinationTowerMenu(clickResult);
                    return;
                } else if (typeof clickResult === 'number') {
                    // Gold/gem collection from mine
                    this.gameState.gold += clickResult;
                    this.updateUI(); // Immediately update UI after collection (includes gems)
                    return;
                }
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
        // Account for CSS scaling
        const scaleX = this.stateManager.canvas.width / rect.width;
        const scaleY = this.stateManager.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
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
        const clickResult = this.towerManager.handleClick(x, y, { 
            width: this.stateManager.canvas.width, 
            height: this.stateManager.canvas.height 
        });
        
        if (clickResult) {
            if (clickResult.type === 'forge_menu') {
                this.showForgeUpgradeMenu(clickResult);
                return;
            } else if (clickResult.type === 'academy_menu') {
                this.showAcademyUpgradeMenu(clickResult);
                return;
            } else if (clickResult.type === 'magic_tower_menu') {
                this.showMagicTowerElementMenu(clickResult);
                return;
            } else if (clickResult.type === 'combination_tower_menu') {
                // New: Handle combination tower menu
                this.showCombinationTowerMenu(clickResult);
                return;
            } else if (typeof clickResult === 'number') {
                this.gameState.gold += clickResult;
                this.updateUI();
                return;
            }
        }
        
        // Handle regular tower/building placement
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
        
        // Get unlock system from tower manager
        const unlockSystem = this.towerManager.getUnlockSystem();
        
        // Filter available upgrades based on unlock system
        const availableUpgrades = forgeData.upgrades.filter(upgrade => 
            unlockSystem.canUseUpgrade(upgrade.id)
        );
        
        // Create upgrade menu with proper currency check
        const menu = document.createElement('div');
        menu.id = 'forge-upgrade-menu';
        menu.className = 'upgrade-menu';
        
        let upgradeListHTML = '';
        
        // Add forge level upgrade first if available
        if (forgeData.forgeUpgrade) {
            const forgeUpgrade = forgeData.forgeUpgrade;
            upgradeListHTML += `
                <div class="upgrade-item forge-upgrade ${forgeUpgrade.level >= forgeUpgrade.maxLevel ? 'maxed' : ''}">
                    <div class="upgrade-icon">${forgeUpgrade.icon}</div>
                    <div class="upgrade-details">
                        <div class="upgrade-name">${forgeUpgrade.name}</div>
                        <div class="upgrade-desc">${forgeUpgrade.description}</div>
                        <div class="upgrade-next">${forgeUpgrade.nextUnlock}</div>
                        <div class="upgrade-level">Level: ${forgeUpgrade.level}/${forgeUpgrade.maxLevel}</div>
                    </div>
                    <div class="upgrade-cost">
                        ${forgeUpgrade.cost ? `$${forgeUpgrade.cost}` : 'MAX'}
                    </div>
                    <button class="upgrade-btn" 
                            data-upgrade="${forgeUpgrade.id}" 
                            ${(!forgeUpgrade.cost || this.gameState.gold < forgeUpgrade.cost) ? 'disabled' : ''}>
                        ${forgeUpgrade.cost ? 'Upgrade' : 'MAX'}
                    </button>
                </div>
            `;
        }
        
        // Add tower upgrades
        upgradeListHTML += availableUpgrades.map(upgrade => `
            <div class="upgrade-item ${upgrade.level >= upgrade.maxLevel ? 'maxed' : ''}">
                <div class="upgrade-icon">${upgrade.icon}</div>
                <div class="upgrade-details">
                    <div class="upgrade-name">${upgrade.name}</div>
                    <div class="upgrade-desc">${upgrade.description}</div>
                    <div class="upgrade-level">Level: ${upgrade.level}/${upgrade.maxLevel}</div>
                    <div class="upgrade-current">Current: ${this.getUpgradeCurrentEffect(upgrade)}</div>
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
        `).join('');
        
        menu.innerHTML = `
            <div class="menu-header">
                <h3>🔨 Tower Forge Upgrades</h3>
                <button class="close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="upgrade-list">
                ${upgradeListHTML}
            </div>
        `;
        
        document.body.appendChild(menu);
        
        // Add upgrade button handlers with immediate menu refresh
        menu.querySelectorAll('.upgrade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const upgradeId = e.target.dataset.upgrade;
                
                if (upgradeId === 'forge_level') {
                    // Handle forge level upgrade
                    if (forgeData.forge.purchaseForgeUpgrade(this.gameState)) {
                        // Notify unlock system of forge upgrade
                        unlockSystem.onForgeUpgraded(forgeData.forge.getForgeLevel());
                        this.updateUI();
                        this.updateUIAvailability(); // Update button visibility
                        
                        // Refresh the menu
                        this.showForgeUpgradeMenu({
                            type: 'forge_menu',
                            forge: forgeData.forge,
                            upgrades: forgeData.forge.getUpgradeOptions(),
                            forgeUpgrade: forgeData.forge.getForgeUpgradeOption()
                        });
                    }
                } else {
                    // Handle tower upgrades
                    if (forgeData.forge.purchaseUpgrade(upgradeId, this.gameState)) {
                        this.updateUI();
                        
                        // Refresh the menu
                        this.showForgeUpgradeMenu({
                            type: 'forge_menu',
                            forge: forgeData.forge,
                            upgrades: forgeData.forge.getUpgradeOptions(),
                            forgeUpgrade: forgeData.forge.getForgeUpgradeOption()
                        });
                    }
                }
            });
        });
        
        this.activeMenu = menu;
    }
    
    showAcademyUpgradeMenu(academyData) {
        // Clear existing menus
        this.clearActiveMenus();
        
        console.log('GameplayState: Showing academy upgrade menu', academyData);
        
        // Create upgrade menu using the same structure as forge
        const menu = document.createElement('div');
        menu.id = 'academy-upgrade-menu';
        menu.className = 'upgrade-menu';
        
        let upgradeListHTML = '';
        
        // Add academy building upgrades first
        const academyUpgrade = academyData.academy.getAcademyUpgradeOption();
        if (academyData.academy.academyLevel < academyData.academy.maxAcademyLevel) {
            const isDisabled = !academyUpgrade.cost || this.gameState.gold < academyUpgrade.cost;
            upgradeListHTML += `
                <div class="upgrade-item ${academyData.academy.academyLevel >= academyData.academy.maxAcademyLevel ? 'maxed' : ''}">
                    <div class="upgrade-icon">${academyUpgrade.icon}</div>
                    <div class="upgrade-details">
                        <div class="upgrade-name">${academyUpgrade.name}</div>
                        <div class="upgrade-desc">${academyUpgrade.description}</div>
                        <div class="upgrade-next">${academyUpgrade.nextUnlock}</div>
                        <div class="upgrade-level">Level: ${academyUpgrade.level}/${academyUpgrade.maxLevel}</div>
                    </div>
                    <div class="upgrade-cost">
                        ${academyUpgrade.cost ? `$${academyUpgrade.cost}` : 'MAX'}
                    </div>
                    <button class="upgrade-btn" 
                            data-upgrade="academy_upgrade" 
                            ${isDisabled ? 'disabled' : ''}>
                        ${academyUpgrade.cost ? 'Upgrade' : 'MAX'}
                    </button>
                </div>
            `;
        }
        
        // Add elemental upgrades
        upgradeListHTML += academyData.upgrades.map(upgrade => {
            if (upgrade.isAcademyUpgrade) return '';
            
            let isDisabled = false;
            let costDisplay = '';
            
            // New: Handle combination spell unlocks
            if (upgrade.isCombinationUnlock) {
                let allGemsAvailable = true;
                const gemCosts = [];
                
                for (const [gemType, amount] of Object.entries(upgrade.cost)) {
                    const gemCount = academyData.academy.gems[gemType] || 0;
                    gemCosts.push(`${upgrade.icon || gemType[0]}${amount}`);
                    if (gemCount < amount) {
                        allGemsAvailable = false;
                    }
                }
                
                isDisabled = !allGemsAvailable;
                costDisplay = gemCosts.join(' + ');
            } else if (upgrade.isResearch) {
                isDisabled = !upgrade.cost || this.gameState.gold < upgrade.cost;
                costDisplay = upgrade.cost ? `$${upgrade.cost}` : 'MAX';
            } else {
                const gemCount = academyData.academy.gems[upgrade.gemType] || 0;
                isDisabled = !upgrade.cost || gemCount < upgrade.cost;
                costDisplay = upgrade.cost ? `${upgrade.icon}${upgrade.cost}` : 'MAX';
            }
            
            return `
                <div class="upgrade-item ${upgrade.level >= upgrade.maxLevel ? 'maxed' : ''}">
                    <div class="upgrade-icon">${upgrade.icon}</div>
                    <div class="upgrade-details">
                        <div class="upgrade-name">${upgrade.name}</div>
                        <div class="upgrade-desc">${upgrade.description}</div>
                        <div class="upgrade-level">${upgrade.isCombinationUnlock ? 'Investment' : 'Level'}: ${upgrade.level}/${upgrade.maxLevel}</div>
                    </div>
                    <div class="upgrade-cost">
                        ${costDisplay}
                    </div>
                    <button class="upgrade-btn" 
                            data-upgrade="${upgrade.id}" 
                            ${isDisabled ? 'disabled' : ''}>
                        ${upgrade.cost ? (upgrade.isCombinationUnlock ? 'Unlock' : 'Upgrade') : 'MAX'}
                    </button>
                </div>
            `;
        }).join('');
        
        menu.innerHTML = `
            <div class="menu-header">
                <h3>🎓 Magic Academy Upgrades</h3>
                <button class="close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="upgrade-list">
                ${upgradeListHTML}
            </div>
        `;
        
        document.body.appendChild(menu);
        
        // Add upgrade button handlers
        menu.querySelectorAll('.upgrade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const upgradeId = e.target.dataset.upgrade;
                
                console.log(`GameplayState: Academy upgrade clicked: ${upgradeId}`);
                
                if (upgradeId === 'academy_upgrade') {
                    // New: Handle academy level upgrade
                    if (academyData.academy.purchaseAcademyUpgrade(this.gameState)) {
                        this.updateUI();
                        this.updateUIAvailability();
                        
                        // Refresh the menu
                        this.showAcademyUpgradeMenu({
                            type: 'academy_menu',
                            academy: academyData.academy,
                            upgrades: academyData.academy.getElementalUpgradeOptions()
                        });
                    }
                } else if (upgradeId.startsWith('unlock_')) {
                    // New: Handle combination spell unlocks
                    const result = academyData.academy.purchaseElementalUpgrade(upgradeId, this.gameState);
                    if (result && result.success) {
                        // Notify unlock system of the spell unlock
                        this.towerManager.getUnlockSystem().onCombinationSpellUnlocked(result.spellId);
                        this.updateUI();
                        this.updateUIAvailability();
                        
                        this.showAcademyUpgradeMenu({
                            type: 'academy_menu',
                            academy: academyData.academy,
                            upgrades: academyData.academy.getElementalUpgradeOptions()
                        });
                    }
                } else if (upgradeId === 'gemMiningTools') {
                    // Handle gem mining tools research
                    if (academyData.academy.researchGemMiningTools(this.gameState)) {
                        // Notify unlock system
                        this.towerManager.getUnlockSystem().onGemMiningResearched();
                        
                        // Update ALL mines with academy reference immediately
                        this.towerManager.buildingManager.buildings.forEach(building => {
                            if (building.constructor.name === 'GoldMine') {
                                building.setAcademy(academyData.academy);
                                console.log('GameplayState: Updated mine with academy reference, gemMiningUnlocked:', building.gemMiningUnlocked);
                            }
                        });
                        
                        this.updateUI();
                        this.updateUIAvailability();
                        
                        // Refresh the menu
                        this.showAcademyUpgradeMenu({
                            type: 'academy_menu',
                            academy: academyData.academy,
                            upgrades: academyData.academy.getElementalUpgradeOptions()
                        });
                    }
                } else {
                    // Handle elemental upgrades
                    if (academyData.academy.purchaseElementalUpgrade(upgradeId, this.gameState)) {
                        this.updateUI();
                        
                        // Refresh the menu
                        this.showAcademyUpgradeMenu({
                            type: 'academy_menu',
                            academy: academyData.academy,
                            upgrades: academyData.academy.getElementalUpgradeOptions()
                        });
                    }
                }
            });
        });
        
        this.activeMenu = menu;
    }
    
    showMagicTowerElementMenu(towerData) {
        // Clear existing menus
        this.clearActiveMenus();
        
        console.log('GameplayState: Showing magic tower element menu', towerData);
        
        // Create element selection menu
        const menu = document.createElement('div');
        menu.id = 'magic-tower-menu';
        menu.className = 'upgrade-menu';
        
        let elementListHTML = '';
        
        elementListHTML += towerData.elements.map(element => {
            // Use provided icon (already has 🪨 for earth)
            const icon = element.icon;
            
            return `
                <div class="upgrade-item ${element.id === towerData.currentElement ? 'selected-element' : ''}">
                    <div class="upgrade-icon">${icon}</div>
                    <div class="upgrade-details">
                        <div class="upgrade-name">${element.name} Element</div>
                        <div class="upgrade-desc">${element.description}</div>
                        ${element.id === towerData.currentElement ? '<div class="upgrade-current">Currently Selected</div>' : ''}
                    </div>
                    <div class="upgrade-cost">
                        Free
                    </div>
                    <button class="upgrade-btn" 
                            data-element="${element.id}" 
                            ${element.id === towerData.currentElement ? 'disabled' : ''}>
                        ${element.id === towerData.currentElement ? 'Active' : 'Select'}
                    </button>
                </div>
            `;
        }).join('');
        
        menu.innerHTML = `
            <div class="menu-header">
                <h3>⚡ Magic Tower Elements</h3>
                <button class="close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="upgrade-list">
                ${elementListHTML}
            </div>
        `;
        
        document.body.appendChild(menu);
        
        // Add element selection handlers
        menu.querySelectorAll('.upgrade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const elementId = e.target.dataset.element;
                
                console.log(`GameplayState: Magic tower element selected: ${elementId}`);
                
                if (this.towerManager.selectMagicTowerElement(towerData.tower, elementId)) {
                    // Refresh the menu
                    this.showMagicTowerElementMenu({
                        type: 'magic_tower_menu',
                        tower: towerData.tower,
                        elements: towerData.elements,
                        currentElement: elementId
                    });
                }
            });
        });
        
        this.activeMenu = menu;
    }
    
    showCombinationTowerMenu(towerData) {
        // New: Menu for selecting combination spells
        this.clearActiveMenus();
        
        console.log('GameplayState: Showing combination tower spell menu', towerData);
        
        const menu = document.createElement('div');
        menu.id = 'combination-tower-menu';
        menu.className = 'upgrade-menu';
        
        let spellListHTML = '';
        
        spellListHTML += towerData.spells.map(spell => {
            return `
                <div class="upgrade-item ${spell.id === towerData.currentSpell ? 'selected-element' : ''}">
                    <div class="upgrade-icon">${spell.icon}</div>
                    <div class="upgrade-details">
                        <div class="upgrade-name">${spell.name} Spell</div>
                        <div class="upgrade-desc">${spell.description}</div>
                        ${spell.id === towerData.currentSpell ? '<div class="upgrade-current">Currently Active</div>' : ''}
                    </div>
                    <div class="upgrade-cost">
                        Free
                    </div>
                    <button class="upgrade-btn" 
                            data-spell="${spell.id}" 
                            ${spell.id === towerData.currentSpell ? 'disabled' : ''}>
                        ${spell.id === towerData.currentSpell ? 'Active' : 'Select'}
                    </button>
                </div>
            `;
        }).join('');
        
        menu.innerHTML = `
            <div class="menu-header">
                <h3>✨ Combination Tower Spells</h3>
                <button class="close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="upgrade-list">
                ${spellListHTML}
            </div>
        `;
        
        document.body.appendChild(menu);
        
        menu.querySelectorAll('.upgrade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const spellId = e.target.dataset.spell;
                
                console.log(`GameplayState: Combination tower spell selected: ${spellId}`);
                
                if (this.towerManager.selectCombinationTowerSpell(towerData.tower, spellId)) {
                    this.showCombinationTowerMenu({
                        type: 'combination_tower_menu',
                        tower: towerData.tower,
                        spells: towerData.spells,
                        currentSpell: spellId
                    });
                }
            });
        });
        
        this.activeMenu = menu;
    }
    
    getUpgradeCurrentEffect(upgrade) {
        switch (upgrade.id) {
            case 'towerRange':
                return `+${(upgrade.level * 5)}% range`;
            case 'poisonDamage':
                return `+${upgrade.level * 3} poison damage`;
            case 'barricadeDamage':
                return `+${upgrade.level * 8} damage`;
            case 'fireArrows':
                return upgrade.level > 0 ? 'Active' : 'Inactive';
            case 'explosiveRadius':
                return `+${upgrade.level * 15}px radius`;
            default:
                return '';
        }
    }
    
    getAcademyUpgradeCurrentEffect(upgrade) {
        if (upgrade.isResearch) {
            return upgrade.level > 0 ? 'Researched' : 'Not Researched';
        }
        
        switch (upgrade.id) {
            case 'fire':
                return `+${upgrade.level * 5} fire damage`;
            case 'water':
                return `+${(upgrade.level * 10)}% slow effect`;
            case 'air':
                return `+${upgrade.level * 20}px chain range`;
            case 'earth':
                return `+${upgrade.level * 3} armor piercing`;
            default:
                return '';
        }
    }
    
    clearActiveMenus() {
        const existingMenus = document.querySelectorAll('.upgrade-menu');
        existingMenus.forEach(menu => menu.remove());
        if (this.activeMenu) {
            this.activeMenu.remove();
            this.activeMenu = null;
        }
    }
    
    getBuildingCost(buildingType) {
        const costs = {
            'mine': 200,
            'forge': 300,
            'academy': 250,
            'superweapon': 500
        };
        return costs[buildingType] || 0;
    }
    
    getWaveConfig(level, wave) {
        if (this.levelType === 'sandbox') {
            // Sandbox mode: continuously increasing difficulty
            const baseEnemies = 8;
            const baseHealth = 50;
            const baseSpeed = 40;
            
            return {
                enemyCount: baseEnemies + Math.floor(wave * 1.2), // Gradual increase
                enemyHealth: baseHealth + (wave - 1) * 5, // Slower health scaling
                enemySpeed: Math.min(100, baseSpeed + (wave - 1) * 2), // Cap speed at 100
                spawnInterval: Math.max(0.3, 1.0 - (wave - 1) * 0.03) // Faster spawning over time
            };
        }
        
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
        if (!this.isSandbox && this.gameState.wave > this.maxWavesForLevel) {
            this.completeLevel();
            return;
        }
        
        console.log(`Starting wave ${this.gameState.wave} of ${this.levelName}`);
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
        if (this.isSandbox) {
            // Sandbox mode doesn't end, just continue
            return;
        }
        alert(`Congratulations! You completed Level ${this.currentLevel}!\n\nFinal Stats:\n- Waves Completed: ${this.maxWavesForLevel}\n- Health Remaining: ${this.gameState.health}\n- Gold Earned: ${this.gameState.gold}`);
        this.stateManager.changeState('levelSelect');
    }
    
    update(deltaTime) {
        this.enemyManager.update(deltaTime);
        this.towerManager.update(deltaTime, this.enemyManager.enemies);
        
        const reachedEnd = this.enemyManager.checkReachedEnd();
        if (reachedEnd > 0) {
            this.gameState.health -= reachedEnd;
            this.updateUI();
            
            if (this.gameState.health <= 0) {
                alert(`Game Over!\n\nYou reached Wave ${this.gameState.wave} of Level ${this.currentLevel}\nTry again!`);
                this.stateManager.changeState('start');
                return;
            }
        }
        
        const killedEnemies = this.enemyManager.removeDeadEnemies();
        if (killedEnemies > 0) {
            // Gold reward scales slightly with wave number
            const goldPerEnemy = 10 + Math.floor(this.gameState.wave / 2);
            this.gameState.gold += killedEnemies * goldPerEnemy;
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
            }, 2000);
        }
    }
    
    render(ctx) {
        this.level.render(ctx);
        this.towerManager.render(ctx);
        this.enemyManager.render(ctx);
    }
    
    updateUI() {
        document.getElementById('health').textContent = this.gameState.health;
        document.getElementById('gold').textContent = Math.floor(this.gameState.gold);
        
        // Show wave info differently for sandbox mode
        if (this.isSandbox) {
            document.getElementById('wave').textContent = `${this.gameState.wave} (∞)`;
        } else {
            document.getElementById('wave').textContent = `${this.gameState.wave}/${this.maxWavesForLevel}`;
        }
        
        let statusText = `Enemies: ${this.enemyManager.enemies.length}`;
        if (this.waveCompleted) {
            statusText = this.isSandbox ? 'Next Wave...' : 'Wave Complete!';
        } else if (!this.waveInProgress && this.enemyManager.enemies.length === 0) {
            statusText = 'Preparing...';
        }
        
        document.getElementById('enemies-remaining').textContent = statusText;
        
        // Update gem display in top bar - now includes diamonds
        const gems = this.towerManager.getGemStocks();
        const gemsElement = document.getElementById('gems');
        if (gemsElement) {
            let gemText = `🔥${gems.fire} 💧${gems.water} 💨${gems.air} 🪨${gems.earth}`;
            // Always show diamond count if available
            if (gems.diamond !== undefined) {
                gemText += ` 💎${gems.diamond}`;
            }
            gemsElement.textContent = gemText;
        }
        
        this.updateUIAvailability();
    }
    
    updateUIAvailability() {
        const unlockSystem = this.towerManager.getUnlockSystem();
        
        // Update tower button states
        document.querySelectorAll('.tower-btn').forEach(btn => {
            const type = btn.dataset.type;
            const cost = parseInt(btn.dataset.cost);
            const unlocked = unlockSystem.canBuildTower(type);
            
            if (!unlocked) {
                btn.style.display = 'none';
            } else {
                btn.style.display = '';
                if (this.gameState.canAfford(cost)) {
                    btn.classList.remove('disabled');
                } else {
                    btn.classList.add('disabled');
                }
            }
        });
        
        // Update building button states
        document.querySelectorAll('.building-btn').forEach(btn => {
            const type = btn.dataset.type;
            const cost = parseInt(btn.dataset.cost);
            const info = this.towerManager.getBuildingInfo(type);
            
            if (!info || !info.unlocked) {
                btn.style.display = 'none';
            } else {
                btn.style.display = '';
                
                if (info.disabled) {
                    btn.classList.add('disabled');
                    btn.title = info.disableReason || '';
                } else if (this.gameState.canAfford(cost)) {
                    btn.classList.remove('disabled');
                    btn.title = '';
                } else {
                    btn.classList.add('disabled');
                    btn.title = 'Not enough gold';
                }
            }
        });
    }
    
    resize() {
        this.level.initializeForCanvas(this.stateManager.canvas.width, this.stateManager.canvas.height);
        this.buildingManager.updatePositions(this.level);
        this.towerManager.updatePositions(this.level);
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
            
            // Show error on screen
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
            
            // Start with the start screen AFTER all states are added
            console.log('Game: Changing to start state');
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
            
            console.log('Game: UI scaling applied');
        } catch (error) {
            console.error('Game: Error applying UI scaling:', error);
        }
    }
    
    resizeCanvas() {
        // Prevent resize loops
        if (this.isResizing) {
            return;
        }
        
        this.isResizing = true;
        
        try {
            const sidebar = document.getElementById('tower-sidebar');
            const statsBar = document.getElementById('stats-bar');
            
            // Only account for visible UI elements
            const sidebarWidth = (sidebar && sidebar.style.display !== 'none') ? sidebar.offsetWidth : 0;
            const statsBarHeight = (statsBar && statsBar.style.display !== 'none') ? statsBar.offsetHeight : 0;
            
            const oldWidth = this.canvas.width;
            const oldHeight = this.canvas.height;
            
            const newWidth = Math.max(800, window.innerWidth - sidebarWidth); // Minimum size
            const newHeight = Math.max(600, window.innerHeight - statsBarHeight); // Minimum size
            
            // Only resize if there's a significant change
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
                // Debounce resize events
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    if (!this.isResizing) {
                        this.applyUIScaling();
                        this.resizeCanvas();
                    }
                }, 100); // Wait 100ms after resize stops
            });
            
            this.canvas.addEventListener('click', (e) => {
                try {
                    const rect = this.canvas.getBoundingClientRect();
                    // Account for CSS scaling
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
            // Don't process if not initialized
            if (!this.isInitialized) {
                requestAnimationFrame((time) => this.gameLoop(time));
                return;
            }
            
            const deltaTime = Math.min(0.016, (currentTime - this.lastTime) / 1000);
            this.lastTime = currentTime;
            
            // Clear the canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Update and render current state
            if (this.stateManager && this.stateManager.currentState) {
                this.stateManager.update(deltaTime);
                this.stateManager.render();
            } else {
                // Show loading state if state manager isn't ready
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
