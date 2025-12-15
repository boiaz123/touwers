import { SaveSystem } from '../core/SaveSystem.js';
import { ForgeMenu } from './menus/ForgeMenu.js';
import { AcademyMenu } from './menus/AcademyMenu.js';
import { MagicTowerMenu, CombinationTowerMenu, GuardPostMenu } from './menus/TowerMenus.js';
import { SuperWeaponMenu } from './menus/SuperWeaponMenu.js';
import { CastleMenu, TrainingGroundsMenu } from './menus/CastleAndTrainingMenu.js';
import { GoldMineMenu, BasicTowerMenu } from './menus/GoldMineAndTowerMenus.js';
import { PanelManager } from './utils/PanelManager.js';
import { InfoTooltips } from './utils/InfoTooltips.js';
import { ButtonManager } from './utils/ButtonManager.js';
import { SpellUI } from './utils/SpellUI.js';

export class UIManager {
    constructor(gameplayState) {
        this.gameplayState = gameplayState;
        this.towerManager = gameplayState.towerManager;
        this.gameState = gameplayState.gameState;
        this.stateManager = gameplayState.stateManager;
        this.level = gameplayState.level;
        this.activeMenu = null;
        this.currentForgeData = null;
        this.lastSpellReadyCount = 0;
        
        // Menu refresh tracking
        this.activeMenuType = null; // 'superweapon', 'academy', 'forge', etc.
        this.activeMenuData = null; // Data needed to re-render the menu
        this.lastGoldValue = 0;
        this.lastGemValues = { fire: 0, water: 0, air: 0, earth: 0, diamond: 0 };
        this.menuRefreshInterval = 0.1; // Refresh every 100ms to check resource changes
        this.menuRefreshTimer = 0;
        
        // Initialize menu modules
        this.forgeMenu = new ForgeMenu(this.gameState, this.towerManager, this.level);
        this.academyMenu = new AcademyMenu(this.gameState, this.towerManager);
        this.magicTowerMenu = new MagicTowerMenu(this.towerManager, this.level);
        this.combinationTowerMenu = new CombinationTowerMenu(this.towerManager, this.level);
        this.guardPostMenu = new GuardPostMenu(this.towerManager, this.level);
        this.superWeaponMenu = new SuperWeaponMenu(this.gameState, this.towerManager, this.level);
        this.castleMenu = new CastleMenu(this.gameState);
        this.trainingGroundsMenu = new TrainingGroundsMenu(this.gameState, this.towerManager, this.level);
        this.goldMineMenu = new GoldMineMenu(this.gameState, this.towerManager, this.level);
        this.basicTowerMenu = new BasicTowerMenu(this.towerManager, this.level);
        
        // Initialize utility modules
        this.infoTooltips = new InfoTooltips(this.towerManager);
        this.buttonManager = new ButtonManager(this.gameState, this.towerManager);
        this.spellUI = new SpellUI(this.towerManager);
    }

    // ============ BUTTON STATE MANAGEMENT ============

    /**
     * Update the enabled/disabled state of all tower and building buttons
     * based on unlock status, resource availability, and build limits
     */
    updateButtonStates() {
        this.buttonManager.updateButtonStates();
    }

    // ============ SETUP ============
    
    setupSpellUI() {
        // Spells are now integrated into the sidebar, no floating panel needed
        // Spell buttons will be created dynamically when super weapon lab is built
    }

    setupUIEventListeners() {
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

        
        // Speed control circles - new bottom-left design
        const speedCircles = document.querySelectorAll('.speed-circle');
        
        if (speedCircles.length > 0) {
            speedCircles.forEach(circle => {
                circle.addEventListener('click', (e) => {
                    const speed = parseFloat(e.target.dataset.speed);
                    this.gameplayState.setGameSpeed(speed);
                    this.updateSpeedCircles(speed);
                });
            });
        } else {
        }

        // ============ PAUSE AND MENU BUTTONS ============
        const speedPauseBtn = document.getElementById('speed-pause-btn');
        const menuBtn = document.getElementById('menu-btn');
        const pauseMenuModal = document.getElementById('pause-menu-modal');
        const resumeBtn = document.getElementById('resume-btn');
        const restartBtn = document.getElementById('restart-btn');
        const saveBtn = document.getElementById('save-btn');
        const exitBtn = document.getElementById('exit-btn');
        const pauseMenuOverlay = document.getElementById('pause-menu-overlay');

        // Reset pause button to show pause icon (game is not paused on entry)
        if (speedPauseBtn) {
            const icon = speedPauseBtn.querySelector('.pause-play-icon');
            if (icon) {
                icon.textContent = '⏸';
                speedPauseBtn.title = 'Pause Game';
            }
        }

        if (speedPauseBtn) {
            speedPauseBtn.addEventListener('click', () => {
                this.togglePauseGame();
            });
        }

        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                this.openPauseMenu();
            });
        }

        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                this.closePauseMenu();
            });
        }

        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.restartLevel();
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveGame();
            });
        }

        if (exitBtn) {
            exitBtn.addEventListener('click', () => {
                this.exitToMenu();
            });
        }

        // Close modal when clicking overlay
        if (pauseMenuOverlay) {
            pauseMenuOverlay.addEventListener('click', () => {
                this.closePauseMenu();
            });
        }

        // Initial button state update
        this.updateButtonStates();
    }

    removeUIEventListeners() {
        // Clean up tower, building, and spell buttons
        document.querySelectorAll('.tower-btn, .building-btn, .spell-btn').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });
        
        // Clean up pause and menu buttons by cloning them to remove all listeners
        const speedPauseBtn = document.getElementById('speed-pause-btn');
        if (speedPauseBtn) {
            speedPauseBtn.replaceWith(speedPauseBtn.cloneNode(true));
        }
        
        const menuBtn = document.getElementById('menu-btn');
        if (menuBtn) {
            menuBtn.replaceWith(menuBtn.cloneNode(true));
        }
        
        const resumeBtn = document.getElementById('resume-btn');
        if (resumeBtn) {
            resumeBtn.replaceWith(resumeBtn.cloneNode(true));
        }
        
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.replaceWith(restartBtn.cloneNode(true));
        }
        
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.replaceWith(saveBtn.cloneNode(true));
        }
        
        const exitBtn = document.getElementById('exit-btn');
        if (exitBtn) {
            exitBtn.replaceWith(exitBtn.cloneNode(true));
        }
        
        const pauseMenuOverlay = document.getElementById('pause-menu-overlay');
        if (pauseMenuOverlay) {
            pauseMenuOverlay.replaceWith(pauseMenuOverlay.cloneNode(true));
        }
    }

    // ============ SPEED CONTROLS ============

    showSpeedControls() {
        const speedControls = document.getElementById('speed-controls-bottom');
        if (speedControls) {
            speedControls.classList.add('visible');
        }
    }

    hideSpeedControls() {
        const speedControls = document.getElementById('speed-controls-bottom');
        if (speedControls) {
            speedControls.classList.remove('visible');
        }
    }

    resetGameSpeed() {
        // Reset to 1x speed
        this.gameplayState.setGameSpeed(1.0);
        this.updateSpeedCircles(1);
    }

    // ============ SPELL WHEEL ============

    toggleSpellWheel() {
        const spellWheel = document.getElementById('spell-wheel');
        if (spellWheel.style.display === 'none') {
            spellWheel.style.display = 'block';
        } else {
            spellWheel.style.display = 'none';
        }
    }

    closeSpellWheel() {
        const spellWheel = document.getElementById('spell-wheel');
        spellWheel.style.display = 'none';
    }

    // ============ TOWER/BUILDING SELECTION ============

    selectTower(btn) {
        // Prevent selection when game is paused
        if (this.gameplayState.isPaused) {
            return;
        }
        
        // Prevent selection of disabled buttons
        if (btn.disabled || btn.classList.contains('disabled')) {
            return;
        }

        const towerType = btn.dataset.type;
        const cost = parseInt(btn.dataset.cost);
        
        // Check if player can afford this tower
        if (!this.gameState.canAfford(cost)) {
            return;
        }
        
        // Update selection
        document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.gameplayState.selectedTowerType = towerType;
        
        // Clear building selection
        this.gameplayState.selectedBuildingType = null;
        document.querySelectorAll('.building-btn').forEach(b => b.classList.remove('selected'));
        
        this.showTowerInfo(towerType);
    }

    selectBuilding(btn) {
        // Prevent selection when game is paused
        if (this.gameplayState.isPaused) {
            return;
        }
        
        // Prevent selection of disabled buttons
        if (btn.disabled || btn.classList.contains('disabled')) {
            return;
        }

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
        this.gameplayState.selectedTowerType = null;
        this.gameplayState.selectedBuildingType = buildingType;
        
        this.showBuildingInfo(buildingType);
    }

    showTowerInfo(towerType) {
        this.infoTooltips.showTowerInfo(towerType);
    }

    clearTowerInfoMenu() {
        this.infoTooltips.clearTowerInfoMenu();
    }

    showBuildingInfo(buildingType) {
        this.infoTooltips.showBuildingInfo(buildingType);
    }

    clearBuildingInfoMenu() {
        this.infoTooltips.clearBuildingInfoMenu();
    }

    // ============ SPELL UI ============

    updateSpellUI() {
        this.spellUI.updateSpellUI(this.gameplayState);
    }

    // ============ UPDATE UI ============

    updateUI() {
        document.getElementById('gold').textContent = Math.floor(this.gameplayState.gameState.gold);
        
        // Show wave info differently for sandbox mode
        if (this.gameplayState.isSandbox) {
            document.getElementById('wave').textContent = `${this.gameplayState.gameState.wave} (∞)`;
        } else {
            // Use the actual number of waves from the level
            const maxWaves = this.gameplayState.maxWavesForLevel || this.level?.maxWaves || 10;
            document.getElementById('wave').textContent = `${this.gameplayState.gameState.wave}/${maxWaves}`;
        }
        
        // Show level
        const levelElement = document.getElementById('level');
        if (levelElement) {
            levelElement.textContent = this.level?.levelName || 'Unknown Level';
        }
        
        // Update gem display in top bar with new structure
        const gems = this.towerManager.getGemStocks();
        const gemFireElement = document.getElementById('gems-fire');
        const gemWaterElement = document.getElementById('gems-water');
        const gemAirElement = document.getElementById('gems-air');
        const gemEarthElement = document.getElementById('gems-earth');
        const gemDiamondElement = document.getElementById('gems-diamond');
        
        if (gemFireElement) gemFireElement.textContent = gems.fire || 0;
        if (gemWaterElement) gemWaterElement.textContent = gems.water || 0;
        if (gemAirElement) gemAirElement.textContent = gems.air || 0;
        if (gemEarthElement) gemEarthElement.textContent = gems.earth || 0;
        if (gemDiamondElement) gemDiamondElement.textContent = gems.diamond || 0;
        
        // Debug logging for sandbox
        if (this.gameplayState.isSandbox) {
        }
        
        this.updateUIAvailability();
    }

    updateUIAvailability() {
        this.buttonManager.updateUIAvailability();
    }

    setGameSpeedButtonState(speed) {
        // Update speed circles
        document.querySelectorAll('.speed-circle').forEach(circle => {
            circle.classList.remove('active');
        });
        
        const activeCircle = document.querySelector(`.speed-circle[data-speed="${speed}"]`);
        if (activeCircle) {
            activeCircle.classList.add('active');
        }
    }

    updateSpeedCircles(speed) {
        this.setGameSpeedButtonState(speed);
    }

    /**
     * Update active menu based on resource changes (called from GameplayState update loop)
     * THIS IS DISABLED - Menus now manage their own state independently
     * Calling show() repeatedly was interrupting user interactions
     */
    updateActiveMenuIfNeeded(deltaTime) {
        // Menu updates are now handled by individual menus
        // Don't refresh the menu here - let menu classes handle their own state
    }

    // ============ UPGRADE MENUS ============

    showForgeUpgradeMenu(forgeData) {
        // Close other panels to prevent stacking
        PanelManager.closeOtherPanelsImmediate('forge-panel');
        
        // Track this as the active menu for real-time updates
        this.activeMenuType = 'forge';
        this.activeMenuData = forgeData;
        this.lastGoldValue = this.gameState.gold;
        this.lastGemValues = { ...this.towerManager.getGemStocks() };
        
        // Store current forge data for this session
        this.currentForgeData = forgeData;
        
        // Update UI before showing menu
        this.updateUI();
        this.updateUIAvailability();
        
        // Show the forge menu
        this.forgeMenu.show(forgeData);
    }

    // ============ GENERIC PANEL SYSTEM ============
    
    showPanel(panelId, title, contentHTML) {
        // Close all currently open panels
        this.closeAllPanels();
        
        const panel = document.getElementById(panelId);
        if (!panel) {
            console.error(`UIManager: Panel ${panelId} not found`);
            return;
        }
        
        // Update title
        const titleElement = panel.querySelector('.panel-title');
        if (titleElement) titleElement.textContent = title;
        
        // Update content
        const contentContainer = panel.querySelector('[id$="-content"], [id$="-upgrades"]');
        if (contentContainer) {
            contentContainer.innerHTML = contentHTML;
        }
        
        // Show the panel with animation
        panel.style.display = 'flex';
        panel.classList.remove('closing');
        
        // Setup close button
        const closeBtn = panel.querySelector('.panel-close-btn');
        if (closeBtn && !closeBtn.dataset.hasListener) {
            closeBtn.addEventListener('click', () => this.closePanelWithAnimation(panelId));
            closeBtn.dataset.hasListener = 'true';
        }
    }

    showPanelWithoutClosing(panelId, title, contentHTML) {
        // Show panel WITHOUT closing others - for tower menus that should stay open
        const panel = document.getElementById(panelId);
        if (!panel) {
            console.error(`UIManager: Panel ${panelId} not found`);
            return;
        }
        
        // Update title
        const titleElement = panel.querySelector('.panel-title');
        if (titleElement) titleElement.textContent = title;
        
        // Update content
        const contentContainer = panel.querySelector('[id$="-content"], [id$="-upgrades"]');
        if (contentContainer) {
            contentContainer.innerHTML = contentHTML;
        }
        
        // Show the panel with animation
        panel.style.display = 'flex';
        panel.classList.remove('closing');
        
        // Setup close button
        const closeBtn = panel.querySelector('.panel-close-btn');
        if (closeBtn && !closeBtn.dataset.hasListener) {
            closeBtn.addEventListener('click', () => this.closePanelWithAnimation(panelId));
            closeBtn.dataset.hasListener = 'true';
        }
    }

    closePanelWithAnimation(panelId) {
        const panel = document.getElementById(panelId);
        if (!panel) return;
        
        if (panel.style.display === 'none') return; // Already closed
        
        // Clean up any active tooltips
        const existingTooltips = document.querySelectorAll('[data-panel-tooltip]');
        existingTooltips.forEach(tooltip => tooltip.remove());
        
        // Clear active menu tracking
        this.activeMenuType = null;
        this.activeMenuData = null;
        
        panel.classList.add('closing');
        setTimeout(() => {
            panel.style.display = 'none';
            panel.classList.remove('closing');
        }, 250);
    }

    closeAllPanels() {
        const panelIds = [
            'forge-panel',
            'academy-panel',
            'magic-tower-panel',
            'combination-tower-panel',
            'superweapon-panel',
            'training-panel',
            'castle-panel',
            'basic-tower-panel',
            'goldmine-panel'
        ];
        
        panelIds.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel && panel.style.display !== 'none') {
                this.closePanelWithAnimation(panelId);
            }
        });
    }

    closeOtherPanelsImmediate(panelIdToKeep) {
        const panelIds = [
            'forge-panel',
            'academy-panel',
            'magic-tower-panel',
            'combination-tower-panel',
            'superweapon-panel',
            'training-panel',
            'castle-panel',
            'basic-tower-panel',
            'goldmine-panel'
        ];
        
        panelIds.forEach(panelId => {
            if (panelId !== panelIdToKeep) {
                const panel = document.getElementById(panelId);
                if (panel) {
                    panel.style.display = 'none';
                    panel.classList.remove('closing');
                }
            }
        });
    }

    showAcademyUpgradeMenu(academyData) {
        // Close other panels to prevent stacking
        PanelManager.closeOtherPanelsImmediate('academy-panel');
        
        // Track this as the active menu for real-time updates
        this.activeMenuType = 'academy';
        this.activeMenuData = academyData;
        this.lastGoldValue = this.gameState.gold;
        this.lastGemValues = { ...this.towerManager.getGemStocks() };
        
        // Update UI before showing menu
        this.updateUI();
        this.updateUIAvailability();
        
        // Show the academy menu
        this.academyMenu.show(academyData);
    }

    showMagicTowerElementMenu(towerData) {
        // Close other panels to prevent stacking
        PanelManager.closeOtherPanelsImmediate('magic-tower-panel');
        
        // Track this as the active menu for real-time updates
        this.activeMenuType = 'magic-tower';
        this.activeMenuData = towerData;
        this.lastGoldValue = this.gameState.gold;
        this.lastGemValues = { ...this.towerManager.getGemStocks() };
        
        this.updateUI();
        this.updateUIAvailability();
        
        this.magicTowerMenu.show(towerData);
    }

    showCombinationTowerMenu(towerData) {
        // Close other panels to prevent stacking
        PanelManager.closeOtherPanelsImmediate('combination-tower-panel');
        
        // Track this as the active menu for real-time updates
        this.activeMenuType = 'combination-tower';
        this.activeMenuData = towerData;
        this.lastGoldValue = this.gameState.gold;
        this.lastGemValues = { ...this.towerManager.getGemStocks() };
        
        this.updateUI();
        this.updateUIAvailability();
        
        this.combinationTowerMenu.show(towerData);
    }

    showGuardPostMenu(towerData) {
        // Close other panels to prevent stacking
        PanelManager.closeOtherPanelsImmediate('basic-tower-panel');
        
        // Track this as the active menu for real-time updates
        this.activeMenuType = 'guard-post';
        this.activeMenuData = towerData;
        this.lastGoldValue = this.gameState.gold;
        this.lastGemValues = { ...this.towerManager.getGemStocks() };
        
        this.updateUI();
        this.updateUIAvailability();
        
        this.guardPostMenu.show(towerData);
    }

    showTowerStatsMenu(towerData) {
        // Close other panels to prevent stacking
        PanelManager.closeOtherPanelsImmediate('basic-tower-panel');
        
        this.updateUI();
        this.updateUIAvailability();
        
        this.basicTowerMenu.show(towerData);
    }

    showBasicTowerStatsMenu(towerData) {
        // Close other panels to prevent stacking
        PanelManager.closeOtherPanelsImmediate('basic-tower-panel');
        
        this.updateUI();
        this.updateUIAvailability();
        
        this.basicTowerMenu.show(towerData);
    }

    showSuperWeaponMenu(menuData) {
        // Close other panels to prevent stacking
        PanelManager.closeOtherPanelsImmediate('superweapon-panel');
        
        // Track this as the active menu for real-time updates
        this.activeMenuType = 'superweapon';
        this.activeMenuData = menuData;
        this.lastGoldValue = this.gameState.gold;
        this.lastGemValues = { ...this.towerManager.getGemStocks() };
        
        this.updateUI();
        this.updateUIAvailability();
        
        this.superWeaponMenu.show(menuData);
    }

    showCastleUpgradeMenu(castleData) {
        // Close other panels to prevent stacking
        PanelManager.closeOtherPanelsImmediate('castle-panel');
        
        // Track this as the active menu for real-time updates
        this.activeMenuType = 'castle';
        this.activeMenuData = castleData;
        this.lastGoldValue = this.gameState.gold;
        this.lastGemValues = { ...this.towerManager.getGemStocks() };
        
        this.updateUI();
        this.updateUIAvailability();
        
        this.castleMenu.show(castleData);
    }

    showTrainingGroundsUpgradeMenu(trainingData) {
        // Close other panels to prevent stacking
        PanelManager.closeOtherPanelsImmediate('training-panel');
        
        this.updateUI();
        this.updateUIAvailability();
        
        this.trainingGroundsMenu.show(trainingData);
    }

    showTrainingGroundsMenu(trainingData) {
        // Redirect to the proper upgrade menu handler
        this.showTrainingGroundsUpgradeMenu(trainingData);
    }

    showGoldMineMenu(goldMineData) {
        // Close other panels to prevent stacking
        PanelManager.closeOtherPanelsImmediate('goldmine-panel');
        
        this.updateUI();
        
        this.goldMineMenu.show(goldMineData);
    }

    getUpgradeCurrentEffect(upgrade) {
        if (upgrade.id === 'basic_damage') {
            return `Damage: +${upgrade.level * 2}`;
        } else if (upgrade.id === 'basic_fire_rate') {
            return `Fire Rate: +${(upgrade.level * 0.1).toFixed(1)}/sec`;
        } else if (upgrade.id === 'basic_range') {
            return `Range: +${upgrade.level * 10}px`;
        } else if (upgrade.id === 'archer_armor_pierce') {
            return `Armor Pierce: +${upgrade.level * 5}%`;
        } else if (upgrade.id === 'archer_fire_rate') {
            return `Fire Rate: +${(upgrade.level * 0.15).toFixed(1)}/sec`;
        } else if (upgrade.id === 'poison_damage') {
            return `Poison Damage: +${upgrade.level}`;
        } else if (upgrade.id === 'cannon_aoe') {
            return `AOE Radius: +${upgrade.level * 5}px`;
        } else {
            return `Level ${upgrade.level}`;
        }
    }

    clearActiveMenus() {
        if (this.activeMenu && this.activeMenu.parentElement) {
            this.activeMenu.remove();
            this.activeMenu = null;
        }
        // Also remove any other open menus
        document.querySelectorAll('.upgrade-menu').forEach(menu => menu.remove());
        // Close all side panels
        this.closeAllPanels();
        this.clearBuildingInfoMenu();
        this.clearTowerInfoMenu();
    }

    // ============ PAUSE AND MENU MANAGEMENT ============

    togglePauseGame() {
        const wasPaused = this.gameplayState.togglePause();
        const speedPauseBtn = document.getElementById('speed-pause-btn');
        
        if (speedPauseBtn) {
            const icon = speedPauseBtn.querySelector('.pause-play-icon');
            if (icon) {
                if (wasPaused) {
                    icon.textContent = '▶';
                    speedPauseBtn.title = 'Resume Game';
                } else {
                    icon.textContent = '⏸';
                    speedPauseBtn.title = 'Pause Game';
                }
            }
        }
        
    }

    openPauseMenu() {
        // Pause the game when opening menu
        if (!this.gameplayState.isPaused) {
            this.gameplayState.setPaused(true);
        }
        
        // Update pause button to show correct state (play icon since game is now paused)
        const speedPauseBtn = document.getElementById('speed-pause-btn');
        if (speedPauseBtn) {
            const icon = speedPauseBtn.querySelector('.pause-play-icon');
            if (icon) {
                icon.textContent = '▶';
                speedPauseBtn.title = 'Resume Game';
            }
        }
        
        const pauseMenuModal = document.getElementById('pause-menu-modal');
        if (pauseMenuModal) {
            pauseMenuModal.classList.add('show');
        }
    }

    closePauseMenu() {
        const pauseMenuModal = document.getElementById('pause-menu-modal');
        if (pauseMenuModal) {
            pauseMenuModal.classList.remove('show');
            // Keep game paused when closing menu - only close the menu
            // Game remains in paused state
            
        }
    }

    restartLevel() {
        
        // Close menu first
        this.closePauseMenu();
        
        // Unpause the game before restarting
        this.gameplayState.setPaused(false);
        
        // Small delay to ensure menu closes visually
        setTimeout(() => {
            // Set the selected level info to current level to reload it
            this.stateManager.selectedLevelInfo = this.stateManager.selectedLevelInfo || { id: this.gameplayState.currentLevel };
            // Change to game state which properly resets the game state
            this.stateManager.changeState('game');
        }, 100);
    }

    saveGame() {
        try {
            // Validate that we have a save slot
            if (!this.stateManager.currentSaveSlot || this.stateManager.currentSaveSlot < 1 || this.stateManager.currentSaveSlot > 3) {
                console.error('UIManager: Invalid save slot:', this.stateManager.currentSaveSlot);
                
                // Show error message to player
                const saveBtn = document.getElementById('save-btn');
                if (saveBtn) {
                    const originalText = saveBtn.textContent;
                    saveBtn.textContent = 'Save Error!';
                    
                    setTimeout(() => {
                        const currentBtn = document.getElementById('save-btn');
                        if (currentBtn) {
                            currentBtn.textContent = originalText;
                        }
                    }, 2000);
                }
                return;
            }
            
            // Perform a full mid-game save with complete state
            const buildingManager = this.towerManager?.buildingManager;
            const unlockSystem = this.towerManager?.unlockSystem;
            
            // Prepare unlock system state for saving
            const unlockState = {
                forgeLevel: unlockSystem?.forgeLevel || 0,
                hasForge: unlockSystem?.hasForge || false,
                forgeCount: unlockSystem?.forgeCount || 0,
                mineCount: unlockSystem?.mineCount || 0,
                academyCount: unlockSystem?.academyCount || 0,
                trainingGroundsCount: unlockSystem?.trainingGroundsCount || 0,
                superweaponCount: unlockSystem?.superweaponCount || 0,
                guardPostCount: unlockSystem?.guardPostCount || 0,
                maxGuardPosts: unlockSystem?.maxGuardPosts || 0,
                superweaponUnlocked: unlockSystem?.superweaponUnlocked || false,
                gemMiningResearched: unlockSystem?.gemMiningResearched || false,
                unlockedTowers: unlockSystem?.unlockedTowers ? Array.from(unlockSystem.unlockedTowers) : [],
                unlockedBuildings: unlockSystem?.unlockedBuildings ? Array.from(unlockSystem.unlockedBuildings) : [],
                unlockedUpgrades: unlockSystem?.unlockedUpgrades ? Array.from(unlockSystem.unlockedUpgrades) : [],
                unlockedCombinationSpells: unlockSystem?.unlockedCombinationSpells ? Array.from(unlockSystem.unlockedCombinationSpells) : []
            };
            
            // Debug: Log castle state before saving
            console.log('UIManager.saveGame: this.level exists:', !!this.level);
            console.log('UIManager.saveGame: this.level.castle exists:', !!this.level?.castle);
            if (this.level?.castle) {
                console.log('UIManager.saveGame: Castle health:', this.level.castle.health, 'maxHealth:', this.level.castle.maxHealth);
                console.log('UIManager.saveGame: Castle defender:', this.level.castle.defender);
            }
            
            SaveSystem.saveGame(
                this.stateManager.currentSaveSlot,
                {
                    currentLevel: this.gameplayState.currentLevel,
                    levelType: this.gameplayState.levelType,
                    levelName: this.gameplayState.levelName,
                    // Save game state with wave tracking
                    gameState: {
                        ...this.gameState,
                        waveInProgress: this.gameplayState.waveInProgress,
                        waveCompleted: this.gameplayState.waveCompleted
                    },
                    towerManager: this.towerManager,
                    enemyManager: this.gameplayState.enemyManager,
                    buildingManager: buildingManager,
                    level: this.level,
                    unlockSystem: unlockState,
                    unlockedTowers: unlockState.unlockedTowers,
                    unlockedBuildings: unlockState.unlockedBuildings,
                    unlockedLevels: this.stateManager.currentSaveData?.unlockedLevels || [],
                    completedLevels: this.stateManager.currentSaveData?.completedLevels || []
                }
            );
            
            // Show save confirmation
            const saveBtn = document.getElementById('save-btn');
            if (saveBtn) {
                const originalText = saveBtn.textContent;
                saveBtn.textContent = 'Game Saved!';
                // Don't disable the button - keep it functional
                // Just change the text temporarily
                
                setTimeout(() => {
                    const currentBtn = document.getElementById('save-btn');
                    if (currentBtn) {
                        currentBtn.textContent = originalText;
                    }
                }, 2000);
            }
        } catch (error) {
            console.error('UIManager: Error saving game:', error);
            
            // Show error message to player
            const saveBtn = document.getElementById('save-btn');
            if (saveBtn) {
                const originalText = saveBtn.textContent;
                saveBtn.textContent = 'Save Failed!';
                
                setTimeout(() => {
                    const currentBtn = document.getElementById('save-btn');
                    if (currentBtn) {
                        currentBtn.textContent = originalText;
                    }
                }, 2000);
            }
        }
    }

    exitToMenu() {
        // Close menu first
        this.closePauseMenu();
        
        // Small delay to ensure menu closes visually
        setTimeout(() => {
            // Change to level select state
            this.stateManager.changeState('levelSelect');
        }, 100);
    }
}
