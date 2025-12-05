import { TowerManager } from './towers/TowerManager.js';
import { EnemyManager } from './enemies/EnemyManager.js';
import { LevelFactory } from './LevelFactory.js';
import { GameState } from './GameState.js';

export class GameplayState {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.gameState = new GameState();
        this.level = null;
        this.towerManager = null;
        this.enemyManager = null;
        this.selectedTowerType = null;
        this.selectedBuildingType = null;
        this.currentLevel = 1;
        this.waveInProgress = false;
        this.waveCompleted = false;
        this.superWeaponLab = null;
        
        // NEW: Speed control
        this.gameSpeed = 1.0; // 1x, 2x, 3x, or 10x
        this.speedMultiplier = [1, 2, 3, 10, 30]; // Available speeds
        this.currentSpeedIndex = 0;
        
        console.log('GameplayState constructor completed');
    }
    
    async enter() {
        console.log('GameplayState: entering');
        
        // Get level info from state manager
        const levelInfo = this.stateManager.selectedLevelInfo || { id: 'level1', name: 'The King\'s Road', type: 'campaign' };
        
        // Create the level using LevelFactory
        try {
            this.level = await LevelFactory.createLevel(levelInfo.id);
            console.log(`GameplayState: Level created - ${this.level.levelName}`);
        } catch (error) {
            console.error('GameplayState: Failed to create level:', error);
            this.level = null;
            return;
        }
        
        // Reset game state for new level
        this.gameState = new GameState();
        this.currentLevel = levelInfo.id;
        this.levelType = levelInfo.type || 'campaign';
        this.levelName = levelInfo.name || 'Unknown Level';
        
        // Configure level-specific settings
        this.isSandbox = (this.levelType === 'sandbox');
        
        if (this.isSandbox) {
            this.gameState.gold = 100000;
            this.maxWavesForLevel = Infinity;
        } else {
            this.maxWavesForLevel = 100;
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
        
        // New: Initialize unlock system with superweapon unlocked in sandbox
        if (this.isSandbox) {
            const unlockSystem = this.towerManager.getUnlockSystem();
            unlockSystem.superweaponUnlocked = true;
            console.log('GameplayState: SANDBOX MODE - superweapon unlocked');
        }
        
        // SANDBOX: Force gem initialization IMMEDIATELY after tower manager creation
        if (this.isSandbox) {
            console.log('GameplayState: SANDBOX MODE - Initializing gems immediately');
            this.initializeSandboxGems();
        }
        
        this.setupEventListeners();
        this.setupSpellUI(); // New: Setup spell UI
        this.updateUI();
        this.startWave();
        console.log(`GameplayState: Initialized ${this.levelName} (${this.levelType})`);
        console.log('GameplayState: enter completed');
    }
    
    initializeSandboxGems() {
        // Called ONLY in sandbox mode to force gem initialization
        console.log('GameplayState: initializeSandboxGems called');
        
        // Access building manager directly
        if (!this.towerManager || !this.towerManager.buildingManager) {
            console.error('GameplayState: Tower manager or building manager not available!');
            return;
        }
        
        const buildingManager = this.towerManager.buildingManager;
        console.log('GameplayState: Building manager found, buildings:', buildingManager.buildings.length);
        
        // Find academy
        let academy = buildingManager.buildings.find(b => b.constructor.name === 'MagicAcademy');
        
        if (academy) {
            console.log('GameplayState: Academy found! Initializing gems...');
            
            // Force initialize all gem values
            if (!academy.gems) {
                academy.gems = {};
            }
            
            academy.gems.fire = 100;
            academy.gems.water = 100;
            academy.gems.air = 100;
            academy.gems.earth = 100;
            academy.gems.diamond = 100;
            
            // Unlock diamond mining
            academy.diamondMiningUnlocked = true;
            
            // Do NOT set gemMiningResearched - keep it as an available research
            academy.gemMiningResearched = false;
            
            console.log('GameplayState: Sandbox gems initialized:', academy.gems);
            console.log('GameplayState: Diamond mining unlocked:', academy.diamondMiningUnlocked);
            
            // Enable gem toggle on all existing mines
            buildingManager.buildings.forEach(building => {
                if (building.constructor.name === 'GoldMine') {
                    building.setAcademy(academy);
                    building.gemMiningUnlocked = true; // Force enable toggle
                    console.log('GameplayState: Mine gem toggle enabled for sandbox');
                }
            });
            
            console.log('GameplayState: Sandbox gem initialization complete!');
        } else {
            console.error('GameplayState: Academy NOT FOUND in building manager!');
            console.log('GameplayState: Available buildings:', 
                buildingManager.buildings.map(b => b.constructor.name)
            );
            console.log('GameplayState: Will retry gem initialization when academy is built');
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
        
        // PERMANENT: Event delegation for dynamically created spell buttons
        // This listener stays active for the entire game session
        const spellGrid = document.getElementById('spell-grid');
        if (spellGrid && !spellGrid.dataset.delegationSetup) {
            console.log('GameplayState: Setting up PERMANENT spell button delegation');
            spellGrid.addEventListener('click', (e) => {
                console.log('GameplayState: Spell grid clicked, target:', e.target.className);
                const spellBtn = e.target.closest('.spell-btn.ready');
                if (spellBtn && !spellBtn.disabled) {
                    console.log('GameplayState: ✓ SPELL BUTTON CLICKED via delegation');
                    const spellId = spellBtn.dataset.spellId;
                    console.log(`GameplayState: Spell ID: ${spellId}`);
                    this.activateSpellTargeting(spellId);
                } else {
                    console.log('GameplayState: Click was on non-ready spell button or not a spell button');
                }
            });
            spellGrid.dataset.delegationSetup = 'true';
        }
        
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
                    this.showCombinationTowerMenu(clickResult);
                    return;
                } else if (clickResult.type === 'basic_tower_stats') {
                    this.showBasicTowerStatsMenu(clickResult);
                    return;
                } else if (clickResult.type === 'superweapon_menu') {
                    this.showSuperWeaponMenu(clickResult);
                    return;
                } else if (typeof clickResult === 'number') {
                    this.gameState.gold += clickResult;
                    this.updateUI();
                    return;
                }
            }
            
            // Handle regular tower/building placement
            this.handleClick(canvasX, canvasY);
        };
        this.stateManager.canvas.addEventListener('click', this.clickHandler);
        
        // NEW: Speed control button
        const speedBtn = document.getElementById('speed-control-btn');
        if (speedBtn) {
            speedBtn.addEventListener('click', () => {
                this.cycleGameSpeed();
            });
        }
    }
    
    removeEventListeners() {
        // Clean up event listeners properly
        document.querySelectorAll('.tower-btn, .building-btn, .spell-btn').forEach(btn => {
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
        
        // Clear any active menus when starting tower placement
        this.clearActiveMenus();
        
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
        
        // Check if building is disabled
        const buildingBtn = document.querySelector(`.building-btn[data-type="${buildingType}"]`);
        let disabledNote = '';
        
        if (buildingType === 'superweapon') {
            const unlockSystem = this.towerManager.getUnlockSystem();
            if (!unlockSystem.superweaponUnlocked) {
                disabledNote = '<div style="color: #ff6b6b; margin-top: 8px; font-size: 10px;">⚠️ Unlock at Academy Level 3</div>';
            }
        }
        
        infoPanel.innerHTML = `
            <div class="info-title">${info.name}</div>
            <div class="info-stats">
                <div>Effect: ${info.effect}</div>
                <div>Size: ${info.size}</div>
                <div>Cost: $${info.cost}</div>
            </div>
            <div style="margin-top: 4px; font-size: 8px; color: #a88;">${info.description}</div>
            ${disabledNote}
        `;
    }
    
    setupSpellUI() {
        // Spells are now integrated into the sidebar, no floating panel needed
        // Spell buttons will be created dynamically when super weapon lab is built
    }
    
    updateSpellUI() {
        const spellSection = document.getElementById('spell-section');
        const spellGrid = document.getElementById('spell-grid');
        
        // Find super weapon lab
        this.superWeaponLab = this.towerManager.buildingManager.buildings.find(
            b => b.constructor.name === 'SuperWeaponLab'
        );
        
        if (!this.superWeaponLab) {
            if (spellSection) spellSection.style.display = 'none';
            return;
        }
        
        spellSection.style.display = 'block';
        
        const availableSpells = this.superWeaponLab.getAvailableSpells();
        
        // IMPORTANT: Only update if spell states have actually changed
        // Check if we need to rebuild the UI
        const currentButtonCount = spellGrid.querySelectorAll('.spell-btn').length;
        const currentReadyCount = spellGrid.querySelectorAll('.spell-btn.ready').length;
        
        // Only rebuild if the number of ready spells changed or button count is 0
        const needsRebuild = currentButtonCount === 0 || this.lastSpellReadyCount !== currentReadyCount;
        
        if (!needsRebuild) {
            // Just update cooldown displays without rebuilding buttons
            availableSpells.forEach(spell => {
                const btn = spellGrid.querySelector(`[data-spell-id="${spell.id}"]`);
                if (btn) {
                    const isReady = spell.currentCooldown === 0;
                    const cooldownDisplay = btn.querySelector('.spell-cooldown');
                    
                    if (isReady && !btn.classList.contains('ready')) {
                        btn.classList.remove('cooling');
                        btn.classList.add('ready');
                        btn.disabled = false;
                        if (cooldownDisplay) cooldownDisplay.remove();
                    } else if (!isReady && btn.classList.contains('ready')) {
                        btn.classList.remove('ready');
                        btn.classList.add('cooling');
                        btn.disabled = true;
                        if (!cooldownDisplay) {
                            const div = document.createElement('div');
                            div.className = 'spell-cooldown';
                            div.textContent = Math.ceil(spell.currentCooldown) + 's';
                            btn.appendChild(div);
                        } else {
                            cooldownDisplay.textContent = Math.ceil(spell.currentCooldown) + 's';
                        }
                    } else if (!isReady && cooldownDisplay) {
                        cooldownDisplay.textContent = Math.ceil(spell.currentCooldown) + 's';
                    }
                }
            });
            return;
        }
        
        // REBUILD: Only happens when spells are newly unlocked
        console.log('GameplayState: Rebuilding spell UI - spell state changed');
        
        spellGrid.innerHTML = availableSpells.map(spell => {
            const isReady = spell.currentCooldown === 0;
            
            return `
                <button class="spell-btn ${isReady ? 'ready' : 'cooling'}" 
                        data-spell-id="${spell.id}"
                        ${!isReady ? 'disabled' : ''}
                        title="${spell.name}: ${spell.description}">
                    <div class="spell-icon">${spell.icon}</div>
                    <div class="spell-name">${spell.name}</div>
                    ${!isReady ? `<div class="spell-cooldown">${Math.ceil(spell.currentCooldown)}s</div>` : ''}
                </button>
            `;
        }).join('');
        
        this.lastSpellReadyCount = currentReadyCount;
        
        const buttons = spellGrid.querySelectorAll('.spell-btn.ready');
        console.log(`GameplayState: Rebuilt UI with ${buttons.length} ready spell buttons`);
    }
    
    activateSpellTargeting(spellId) {
        this.selectedSpell = spellId;
        this.stateManager.canvas.style.cursor = 'crosshair';
        
        // Add temporary click handler for spell targeting
        this.spellTargetHandler = (e) => {
            const rect = this.stateManager.canvas.getBoundingClientRect();
            const scaleX = this.stateManager.canvas.width / rect.width;
            const scaleY = this.stateManager.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            this.castSpellAtPosition(this.selectedSpell, x, y);
            this.cancelSpellTargeting();
        };
        
        this.stateManager.canvas.addEventListener('click', this.spellTargetHandler, { once: true });
        
        // Allow right-click to cancel
        this.spellCancelHandler = (e) => {
            e.preventDefault();
            this.cancelSpellTargeting();
        };
        this.stateManager.canvas.addEventListener('contextmenu', this.spellCancelHandler, { once: true });
    }
    
    cancelSpellTargeting() {
        this.selectedSpell = null;
        this.stateManager.canvas.style.cursor = 'default';
        
        if (this.spellTargetHandler) {
            this.stateManager.canvas.removeEventListener('click', this.spellTargetHandler);
            this.spellTargetHandler = null;
        }
        if (this.spellCancelHandler) {
            this.stateManager.canvas.removeEventListener('contextmenu', this.spellCancelHandler);
            this.spellCancelHandler = null;
        }
    }
    
    castSpellAtPosition(spellId, x, y) {
        if (!this.superWeaponLab) return;
        
        const result = this.superWeaponLab.castSpell(spellId, this.enemyManager.enemies, x, y);
        if (!result) return;
        
        const { spell } = result;
        
        // Apply spell effects to enemies
        switch(spellId) {
            case 'arcaneBlast':
                this.enemyManager.enemies.forEach(enemy => {
                    const dist = Math.hypot(enemy.x - x, enemy.y - y);
                    if (dist <= spell.radius) {
                        const damage = spell.damage * (1 - dist / spell.radius * 0.5);
                        enemy.takeDamage(damage);
                    }
                });
                this.createSpellEffect('arcaneBlast', x, y, spell);
                break;
                
            case 'frostNova':
                this.enemyManager.enemies.forEach(enemy => {
                    const dist = Math.hypot(enemy.x - x, enemy.y - y);
                    if (dist <= spell.radius) {
                        enemy.freezeTimer = spell.freezeDuration;
                        enemy.originalSpeed = enemy.originalSpeed || enemy.speed;
                        enemy.speed = 0;
                    }
                });
                this.createSpellEffect('frostNova', x, y, spell);
                break;
                
            case 'meteorStrike':
                // Delayed damage for meteor
                setTimeout(() => {
                    this.enemyManager.enemies.forEach(enemy => {
                        const dist = Math.hypot(enemy.x - x, enemy.y - y);
                        if (dist <= 80) {
                            enemy.takeDamage(spell.damage);
                            enemy.burnTimer = spell.burnDuration;
                            enemy.burnDamage = spell.burnDamage;
                        }
                    });
                }, 500);
                this.createSpellEffect('meteorStrike', x, y, spell);
                break;
                
            case 'chainLightning':
                let targets = [...this.enemyManager.enemies]
                    .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))
                    .slice(0, spell.chainCount);
                
                targets.forEach((enemy, index) => {
                    setTimeout(() => {
                        enemy.takeDamage(spell.damage * Math.pow(0.8, index));
                    }, index * 100);
                });
                this.createSpellEffect('chainLightning', x, y, spell, targets);
                break;
        }
        
        this.updateSpellUI();
    }
    
    createSpellEffect(type, x, y, spell, targets) {
        // Visual spell effects would be rendered here
        // For now, just log
        console.log(`Spell effect: ${type} at (${x}, ${y})`);
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
                this.showCombinationTowerMenu(clickResult);
                return;
            } else if (clickResult.type === 'basic_tower_stats') {
                this.showBasicTowerStatsMenu(clickResult);
                return;
            } else if (clickResult.type === 'superweapon_menu') {
                this.showSuperWeaponMenu(clickResult);
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
                    
                    // SANDBOX: If academy was just built, initialize gems immediately
                    if (this.isSandbox && this.selectedBuildingType === 'academy') {
                        console.log('GameplayState: Academy just built in sandbox, initializing gems...');
                        setTimeout(() => this.initializeSandboxGems(), 50); // Small delay to ensure building is registered
                    }
                    
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
                
                // Map gem types to their icons
                const gemIcons = {
                    fire: '🔥',
                    water: '💧',
                    air: '💨',
                    earth: '🪨'
                };
                
                for (const [gemType, amount] of Object.entries(upgrade.cost)) {
                    const gemCount = academyData.academy.gems[gemType] || 0;
                    const icon = gemIcons[gemType] || gemType[0];
                    gemCosts.push(`${icon}${amount}`);
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
                <button class="close-btn">×</button>
            </div>
            <div class="upgrade-list">
                ${upgradeListHTML}
            </div>
        `;
        
        document.body.appendChild(menu);
        
        // Add close button handler FIRST
        menu.querySelector('.close-btn').addEventListener('click', () => {
            menu.remove();
        });
        
        // Add upgrade button handlers - GET FRESH REFERENCE TO academy
        menu.querySelectorAll('.upgrade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const upgradeId = e.target.dataset.upgrade;
                
                if (upgradeId === 'academy_upgrade') {
                    console.log(`GameplayState: Attempting academy upgrade purchase`);
                    
                    // Purchase FIRST
                    const purchased = academyData.academy.purchaseAcademyUpgrade(this.gameState);
                    console.log(`GameplayState: Purchase returned: ${purchased}`);
                    
                    if (purchased) {
                        console.log(`GameplayState: Purchase succeeded`);
                        const newLevel = academyData.academy.academyLevel;
                        console.log(`GameplayState: Academy new level: ${newLevel}`);
                        
                        // NOW unlock
                        if (newLevel === 3) {
                            console.log('GameplayState: *** LEVEL 3 REACHED - UNLOCKING SUPERWEAPON ***');
                            const unlockSystem = this.towerManager.getUnlockSystem();
                            unlockSystem.onAcademyLevelThree();
                            console.log(`GameplayState: After unlock, superweaponUnlocked is: ${unlockSystem.superweaponUnlocked}`);
                        }
                        
                        this.updateUI();
                        this.updateUIAvailability();
                        
                        // Refresh menu
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
    
    showBasicTowerStatsMenu(towerData) {
        // New: Compact menu positioned next to the tower
        this.clearActiveMenus();
        
        console.log('GameplayState: Showing basic tower stats menu', towerData);
        
        const menu = document.createElement('div');
        menu.id = 'basic-tower-stats-menu';
        menu.className = 'upgrade-menu';
        menu.style.minWidth = '200px'; // Make more compact
        menu.style.position = 'absolute'; // Position absolutely
        
        // Position next to the tower (above it)
        const canvasRect = this.stateManager.canvas.getBoundingClientRect();
        const scaleX = this.stateManager.canvas.width / canvasRect.width;
        const scaleY = this.stateManager.canvas.height / canvasRect.height;
        const screenX = canvasRect.left + (towerData.position.x / scaleX);
        const screenY = canvasRect.top + (towerData.position.y / scaleY) - 120; // Position above tower
        
        menu.style.left = `${screenX}px`;
        menu.style.top = `${screenY}px`;
        menu.style.transform = 'none'; // Remove center transform
        
        const tower = towerData.tower;
        const stats = {
            name: 'Basic Tower',
            damage: tower.damage,
            range: tower.range,
            fireRate: tower.fireRate,
            description: 'A reliable wooden watchtower with defenders hurling rocks.',
            cost: tower.constructor.getInfo().cost
        };
        
        menu.innerHTML = `
            <div style="padding: 10px; font-size: 12px;">
                <div style="font-weight: bold; margin-bottom: 5px; color: #FFD700;">${stats.name}</div>
                <div style="color: #c9a876; margin-bottom: 8px;">Damage: ${stats.damage}</div>
                <div style="color: #c9a876; margin-bottom: 8px;">Range: ${stats.range}</div>
                <div style="color: #c9a876; margin-bottom: 8px;">Fire Rate: ${stats.fireRate}/sec</div>
                <div style="margin-bottom: 8px; font-size: 11px; color: #a88; line-height: 1.3; padding-right: 50px;">${stats.description}</div>
                <div style="display: flex; gap: 3px; justify-content: flex-end;">
                    <button class="sell-btn" style="background: #ff4444; color: white; border: none; padding: 3px 6px; border-radius: 3px; cursor: pointer; font-size: 9px; white-space: nowrap;">Sell</button>
                    <button class="close-btn" style="background: #666; color: white; border: none; padding: 3px 6px; border-radius: 3px; cursor: pointer; font-size: 9px; white-space: nowrap; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">✕</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(menu);
        
        // Add sell button handler
        menu.querySelector('.sell-btn').addEventListener('click', () => {
            this.towerManager.sellTower(tower);
            this.updateUI();
            menu.remove();
        });
        
        // Add close button handler
        menu.querySelector('.close-btn').addEventListener('click', () => {
            tower.isSelected = false;
            tower.showRange = false;
            menu.remove();
        });
        
        this.activeMenu = menu;
    }
    
    showSuperWeaponMenu(menuData) {
        this.clearActiveMenus();
        
        console.log('GameplayState: showSuperWeaponMenu called with:', menuData);
        
        const menu = document.createElement('div');
        menu.id = 'superweapon-upgrade-menu';
        menu.className = 'upgrade-menu';
        
        let upgradeListHTML = '';
        
        // Add lab level upgrade
        const labUpgrade = menuData.building.getLabUpgradeOption();
        if (labUpgrade) {
            console.log('GameplayState: Adding lab upgrade option:', labUpgrade);
            upgradeListHTML += `
                <div class="upgrade-item">
                    <div class="upgrade-icon">${labUpgrade.icon}</div>
                    <div class="upgrade-details">
                        <div class="upgrade-name">${labUpgrade.name}</div>
                        <div class="upgrade-desc">${labUpgrade.description}</div>
                        <div class="upgrade-next">${labUpgrade.nextUnlock}</div>
                        <div class="upgrade-level">Level: ${labUpgrade.level}/${labUpgrade.maxLevel}</div>
                    </div>
                    <div class="upgrade-cost">$${labUpgrade.cost}</div>
                    <button class="upgrade-btn" data-upgrade="lab_upgrade" 
                            ${this.gameState.gold < labUpgrade.cost ? 'disabled' : ''}>
                        Upgrade
                    </button>
                </div>
            `;
        }
        
        // Add spell unlocks and upgrades
        console.log('GameplayState: Processing spells:', menuData.spells.length);
        menuData.spells.forEach((spell, index) => {
            console.log(`GameplayState: Spell ${index}:`, spell.id, 'unlocked:', spell.unlocked, 'level:', spell.level);
            
            if (!spell.unlocked) {
                // Unlock option - use unique data attribute
                console.log(`GameplayState: Creating unlock button for ${spell.id}`);
                upgradeListHTML += `
                    <div class="upgrade-item locked">
                        <div class="upgrade-icon">${spell.icon}</div>
                        <div class="upgrade-details">
                            <div class="upgrade-name">${spell.name}</div>
                            <div class="upgrade-desc">${spell.description}</div>
                            <div class="upgrade-level">🔒 Locked</div>
                        </div>
                        <div class="upgrade-cost">$${spell.unlockCost}</div>
                        <button class="upgrade-btn" data-spell-unlock="${spell.id}"
                                ${this.gameState.gold < spell.unlockCost ? 'disabled' : ''}>
                            Unlock
                        </button>
                    </div>
                `;
            } else {
                // Upgrade option
                const upgradeCost = spell.upgradeCost * spell.level;
                const isMaxed = spell.level >= spell.maxLevel;
                
                console.log(`GameplayState: Creating upgrade button for ${spell.id}, cost: ${upgradeCost}, maxed: ${isMaxed}`);
                upgradeListHTML += `
                    <div class="upgrade-item ${isMaxed ? 'maxed' : ''}">
                        <div class="upgrade-icon">${spell.icon}</div>
                        <div class="upgrade-details">
                            <div class="upgrade-name">${spell.name}</div>
                            <div class="upgrade-desc">${spell.description}</div>
                            <div class="upgrade-level">Level: ${spell.level}/${spell.maxLevel}</div>
                            <div class="upgrade-current">Cooldown: ${spell.cooldown.toFixed(1)}s</div>
                        </div>
                        <div class="upgrade-cost">${isMaxed ? 'MAX' : `$${upgradeCost}`}</div>
                        <button class="upgrade-btn" data-spell-upgrade="${spell.id}"
                                ${isMaxed || this.gameState.gold < upgradeCost ? 'disabled' : ''}>
                            ${isMaxed ? 'MAX' : 'Upgrade'}
                        </button>
                    </div>
                `;
            }
        });
        
        menu.innerHTML = `
            <div class="menu-header">
                <h3>🗼 Super Weapon Lab</h3>
                <button class="close-btn">×</button>
            </div>
            <div class="upgrade-list">
                ${upgradeListHTML}
            </div>
        `;
        
        document.body.appendChild(menu);
        console.log('GameplayState: Super Weapon menu appended to DOM');
        
        // Close button handler
        menu.querySelector('.close-btn').addEventListener('click', () => {
            console.log('GameplayState: Close button clicked');
            menu.remove();
        });
        
        // Upgrade handlers - SPELL UNLOCK BUTTONS - use event delegation
        const allUnlockButtons = menu.querySelectorAll('[data-spell-unlock]');
        console.log(`GameplayState: Found ${allUnlockButtons.length} unlock buttons`);
        allUnlockButtons.forEach(btn => {
            console.log(`GameplayState: Attaching handler to unlock button for:`, btn.dataset.spellUnlock);
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const spellId = e.currentTarget.dataset.spellUnlock;
                console.log(`GameplayState: UNLOCK BUTTON CLICKED for: ${spellId}`);
                
                if (menuData.building.unlockSpell(spellId, this.gameState)) {
                    console.log(`GameplayState: Successfully unlocked ${spellId}`);
                    this.updateUI();
                    this.updateSpellUI();
                    this.showSuperWeaponMenu({
                        type: 'superweapon_menu',
                        building: menuData.building,
                        spells: menuData.building.getAllSpells(),
                        labLevel: menuData.building.labLevel,
                        maxLabLevel: menuData.building.maxLabLevel
                    });
                } else {
                    console.error(`GameplayState: Failed to unlock ${spellId}`);
                }
            });
        });
        
        // SPELL UPGRADE BUTTONS
        const allUpgradeButtons = menu.querySelectorAll('[data-spell-upgrade]');
        console.log(`GameplayState: Found ${allUpgradeButtons.length} upgrade buttons`);
        allUpgradeButtons.forEach(btn => {
            console.log(`GameplayState: Attaching handler to upgrade button for:`, btn.dataset.spellUpgrade);
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const spellId = e.currentTarget.dataset.spellUpgrade;
                console.log(`GameplayState: UPGRADE BUTTON CLICKED for: ${spellId}`);
                
                if (menuData.building.upgradeSpell(spellId, this.gameState)) {
                    console.log(`GameplayState: Successfully upgraded ${spellId}`);
                    this.updateUI();
                    this.showSuperWeaponMenu({
                        type: 'superweapon_menu',
                        building: menuData.building,
                        spells: menuData.building.getAllSpells(),
                        labLevel: menuData.building.labLevel,
                        maxLabLevel: menuData.building.maxLabLevel
                    });
                } else {
                    console.error(`GameplayState: Failed to upgrade ${spellId}`);
                }
            });
        });
        
        // LAB UPGRADE BUTTON
        const labBtn = menu.querySelector('[data-upgrade="lab_upgrade"]');
        if (labBtn) {
            console.log('GameplayState: Attaching handler to lab upgrade button');
            labBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('GameplayState: LAB UPGRADE BUTTON CLICKED');
                
                if (menuData.building.purchaseLabUpgrade(this.gameState)) {
                    console.log('GameplayState: Successfully upgraded lab');
                    this.updateUI();
                    this.showSuperWeaponMenu({
                        type: 'superweapon_menu',
                        building: menuData.building,
                        spells: menuData.building.getAllSpells(),
                        labLevel: menuData.building.labLevel,
                        maxLabLevel: menuData.building.maxLabLevel
                    });
                } else {
                    console.error('GameplayState: Failed to upgrade lab');
                }
            });
        }
        
        this.activeMenu = menu;
        console.log('GameplayState: Super Weapon menu ready with all handlers attached');
    }
    
    // NEW: Speed control methods
    cycleGameSpeed() {
        this.currentSpeedIndex = (this.currentSpeedIndex + 1) % this.speedMultiplier.length;
        this.gameSpeed = this.speedMultiplier[this.currentSpeedIndex];
        
        const speedDisplay = document.getElementById('speed-display');
        if (speedDisplay) {
            speedDisplay.textContent = `${this.gameSpeed}x`;
        }
        
        console.log(`GameplayState: Game speed changed to ${this.gameSpeed}x`);
    }
    
    getAdjustedDeltaTime(deltaTime) {
        return deltaTime * this.gameSpeed;
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
            const baseHealth_multiplier = 1.0;
            const baseSpeed = 40;
            
            return {
                enemyCount: baseEnemies + Math.floor(wave * 1.2),
                enemyHealth_multiplier: baseHealth_multiplier + (wave - 1) * 0.05,
                enemySpeed: Math.min(100, baseSpeed + (wave - 1) * 2),
                spawnInterval: Math.max(0.3, 1.0 - (wave - 1) * 0.03)
            };
        }
        
        // Get wave config from the level itself
        if (this.level && typeof this.level.getWaveConfig === 'function') {
            const config = this.level.getWaveConfig(wave);
            return {
                enemyCount: config.enemyCount,
                enemyHealth_multiplier: config.enemyHealth_multiplier,
                enemySpeed: config.enemySpeed,
                spawnInterval: config.spawnInterval,
                wavePattern: config.pattern
            };
        }
        
        // Fallback default
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
        
        if (this.isSandbox) {
            // Sandbox mode: continuous spawning with all enemy types
            console.log('GameplayState: Starting sandbox continuous spawn mode');
            this.enemyManager.startContinuousSpawn(0.6, ['basic', 'villager', 'beefyenemy', 'archer', 'mage', 'knight', 'shieldknight', 'frog']);
        } else {
            // Campaign mode: traditional wave spawning
            const waveConfig = this.getWaveConfig(this.currentLevel, this.gameState.wave);
            
            if (waveConfig.wavePattern) {
                // Use custom pattern from level
                this.enemyManager.spawnWaveWithPattern(
                    this.gameState.wave,
                    waveConfig.enemyCount,
                    waveConfig.enemyHealth_multiplier,
                    waveConfig.enemySpeed,
                    waveConfig.spawnInterval,
                    waveConfig.wavePattern
                );
            } else {
                // Use standard spawning
                this.enemyManager.spawnWave(
                    this.gameState.wave, 
                    waveConfig.enemyCount,
                    waveConfig.enemyHealth_multiplier,
                    waveConfig.enemySpeed,
                    waveConfig.spawnInterval
                );
            }
        }
        
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
        
        // Update freeze timers and handle castle attacks
        this.enemyManager.enemies.forEach(enemy => {
            if (enemy.freezeTimer > 0) {
                enemy.freezeTimer -= deltaTime;
                if (enemy.freezeTimer <= 0 && enemy.originalSpeed) {
                    enemy.speed = enemy.originalSpeed;
                }
            }
            
            // Have enemies attack the castle if they reached the end
            if (enemy.reachedEnd && this.level.castle) {
                enemy.isAttackingCastle = true;
                enemy.attackCastle(this.level.castle, deltaTime);
            }
        });
        
        // Check if castle is destroyed
        if (this.level.castle && this.level.castle.isDestroyed()) {
            this.gameOver();
            return;
        }
        
        const killedEnemies = this.enemyManager.removeDeadEnemies();
        if (killedEnemies > 0) {
            const goldPerEnemy = 10 + Math.floor(this.gameState.wave / 2);
            this.gameState.gold += killedEnemies * goldPerEnemy;
            this.updateUI();
        }
        
        // Check if wave is completed
        if (this.waveInProgress && this.enemyManager.enemies.length === 0 && !this.enemyManager.spawning) {
            this.waveInProgress = false;
            this.waveCompleted = true;
            
            console.log(`Wave ${this.gameState.wave} completed`);
            
            setTimeout(() => {
                this.gameState.wave++;
                this.startWave();
            }, 2000);
        }
        
        // Update spell UI - only updates displays, doesn't recreate every frame
        this.updateSpellUI();
    }
    
    gameOver() {
        console.log('Game Over! Castle destroyed.');
        this.waveInProgress = false;
        this.stateManager.changeState('levelSelect');
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
        
        // Update gem display in top bar - force check for sandbox
        const gems = this.towerManager.getGemStocks();
        const gemsElement = document.getElementById('gems');
        if (gemsElement) {
            // In sandbox, show gems even if all are 0 (they should be 100)
            let gemText = `🔥${gems.fire || 0} 💧${gems.water || 0} 💨${gems.air || 0} 🪨${gems.earth || 0}`;
            
            // Always show diamond count in sandbox
            if (gems.diamond !== undefined || this.isSandbox) {
                gemText += ` 💎${gems.diamond || 0}`;
            }
            
            gemsElement.textContent = gemText;
            
            // Debug logging for sandbox
            if (this.isSandbox) {
                console.log('GameplayState: updateUI - Current gems:', gems);
            }
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
        
        // Update building button states - SAME LOGIC FOR ALL BUILDINGS
        document.querySelectorAll('.building-btn').forEach(btn => {
            const type = btn.dataset.type;
            const cost = parseInt(btn.dataset.cost);
            const info = this.towerManager.getBuildingInfo(type);
            
            if (!info) {
                btn.style.display = 'none';
                return;
            }
            
            // Use info.unlocked for ALL buildings (same as mines, forge, academy)
            const isUnlocked = info.unlocked;
            
            if (!isUnlocked) {
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
        this.towerManager.updatePositions(this.level);
    }
}