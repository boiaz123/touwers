import { SaveSystem } from '../core/SaveSystem.js';
import { MusicPlayer } from './MusicPlayer.js';

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
        
        // Music player - created if Musical Equipment upgrade is purchased
        this.musicPlayer = null;
        this.initializeMusicPlayerIfUnlocked();
    }

    initializeMusicPlayerIfUnlocked() {
        // Check if player has purchased the Musical Equipment upgrade
        const upgradeSystem = this.stateManager?.upgradeSystem;
        if (upgradeSystem && upgradeSystem.hasUpgrade('musical-equipment')) {
            this.musicPlayer = new MusicPlayer(this);
        }
    }

    // ============ BUTTON STATE MANAGEMENT ============

    /**
     * Update the enabled/disabled state of all tower and building buttons
     * based on unlock status, resource availability, and build limits
     */
    updateButtonStates() {
        // Update tower buttons
        document.querySelectorAll('.tower-btn').forEach(btn => {
            const towerType = btn.dataset.type;
            const cost = parseInt(btn.dataset.cost);
            
            // For guard-post, check if unlocked separately from limit
            let isUnlocked = this.towerManager.unlockSystem.unlockedTowers.has(towerType);
            let canBuild = this.towerManager.unlockSystem.canBuildTower(towerType);
            
            // Hide if not unlocked, show if unlocked
            if (!isUnlocked) {
                btn.style.display = 'none';
                btn.disabled = true;
            } else {
                btn.style.display = 'flex';
                // Check if affordable
                const canAfford = this.gameState.canAfford(cost);
                
                // Determine if button should be disabled (limit or affordability)
                if (!canAfford || !canBuild) {
                    btn.classList.add('disabled');
                    btn.disabled = true;
                } else {
                    btn.classList.remove('disabled');
                    btn.disabled = false;
                }
            }
        });

        // Update building buttons
        document.querySelectorAll('.building-btn').forEach(btn => {
            const buildingType = btn.dataset.type;
            const cost = parseInt(btn.dataset.cost);
            
            // Check if building is unlocked (separate from whether it can be built)
            const isUnlocked = this.towerManager.unlockSystem.isBuildingUnlocked(buildingType);
            
            // Debug superweapon button
            if (buildingType === 'superweapon') {
            }
            
            // Hide if not unlocked, show if unlocked
            if (!isUnlocked) {
                btn.style.display = 'none';
                btn.disabled = true;
            } else {
                btn.style.display = 'flex';
                // Check if it can be built (not at limit) and affordable
                const canBuild = this.towerManager.unlockSystem.canBuildBuilding(buildingType);
                const canAfford = this.gameState.canAfford(cost);
                
                // Determine if button should be disabled
                if (!canBuild || !canAfford) {
                    btn.classList.add('disabled');
                    btn.disabled = true;
                } else {
                    btn.classList.remove('disabled');
                    btn.disabled = false;
                }
            }
        });
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
                // Play button click SFX
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
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
                // Play button click SFX
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
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
                    // Play button click SFX
                    if (this.stateManager.audioManager) {
                        this.stateManager.audioManager.playSFX('button-click');
                    }
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
        const quitBtn = document.getElementById('quit-btn');
        const optionsBtn = document.getElementById('options-btn');
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
                // Play button click SFX
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
                this.togglePauseGame();
            });
        }

        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                // Play button click SFX
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
                this.openPauseMenu();
            });
        }

        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                // Play button click SFX
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
                this.closePauseMenu();
            });
        }

        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                // Play button click SFX
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
                this.restartLevel();
            });
        }

        if (quitBtn) {
            quitBtn.addEventListener('click', () => {
                // Play button click SFX
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
                this.quitLevel();
            });
        }

        if (optionsBtn) {
            optionsBtn.addEventListener('click', () => {
                // Play button click SFX
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
                this.openInGameOptions();
            });
        }

        // Close modal when clicking overlay
        if (pauseMenuOverlay) {
            pauseMenuOverlay.addEventListener('click', () => {
                // Play button click SFX
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
                this.closePauseMenu();
            });
        }

        // Setup in-game options panel
        this.setupInGameOptions();

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
        
        const quitBtn = document.getElementById('quit-btn');
        if (quitBtn) {
            quitBtn.replaceWith(quitBtn.cloneNode(true));
        }
        
        const optionsBtn = document.getElementById('options-btn');
        if (optionsBtn) {
            optionsBtn.replaceWith(optionsBtn.cloneNode(true));
        }
        
        const pauseMenuOverlay = document.getElementById('pause-menu-overlay');
        if (pauseMenuOverlay) {
            pauseMenuOverlay.replaceWith(pauseMenuOverlay.cloneNode(true));
        }

        const ingameOptionsOverlay = document.getElementById('ingame-options-overlay');
        if (ingameOptionsOverlay) {
            ingameOptionsOverlay.replaceWith(ingameOptionsOverlay.cloneNode(true));
        }

        const ingameOptionsBackBtn = document.getElementById('ingame-options-back-btn');
        if (ingameOptionsBackBtn) {
            ingameOptionsBackBtn.replaceWith(ingameOptionsBackBtn.cloneNode(true));
        }

        const quitConfirmBtn = document.getElementById('quit-confirm-btn');
        if (quitConfirmBtn) {
            quitConfirmBtn.replaceWith(quitConfirmBtn.cloneNode(true));
        }

        const quitCancelBtn = document.getElementById('quit-cancel-btn');
        if (quitCancelBtn) {
            quitCancelBtn.replaceWith(quitCancelBtn.cloneNode(true));
        }

        const quitWarningOverlay = document.getElementById('quit-warning-overlay');
        if (quitWarningOverlay) {
            quitWarningOverlay.replaceWith(quitWarningOverlay.cloneNode(true));
        }

        const restartConfirmBtn = document.getElementById('restart-confirm-btn');
        if (restartConfirmBtn) {
            restartConfirmBtn.replaceWith(restartConfirmBtn.cloneNode(true));
        }

        const restartCancelBtn = document.getElementById('restart-cancel-btn');
        if (restartCancelBtn) {
            restartCancelBtn.replaceWith(restartCancelBtn.cloneNode(true));
        }

        const restartWarningOverlay = document.getElementById('restart-warning-overlay');
        if (restartWarningOverlay) {
            restartWarningOverlay.replaceWith(restartWarningOverlay.cloneNode(true));
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
        
        // Deselect all towers and buildings when starting placement
        if (this.towerManager) {
            this.towerManager.towers.forEach(tower => tower.isSelected = false);
            this.towerManager.buildingManager.buildings.forEach(building => {
                if (building.deselect) building.deselect();
            });
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
        
        // Deselect all towers and buildings when starting placement
        if (this.towerManager) {
            this.towerManager.towers.forEach(tower => tower.isSelected = false);
            this.towerManager.buildingManager.buildings.forEach(building => {
                if (building.deselect) building.deselect();
            });
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
        const info = this.towerManager.getTowerInfo(towerType);
        if (!info) return;
        
        // Get the tower button
        const towerBtn = document.querySelector(`.tower-btn[data-type="${towerType}"]`);
        if (!towerBtn) return;
        
        // Clear existing menu
        this.clearTowerInfoMenu();
        
        // Create hover menu
        const menu = document.createElement('div');
        menu.className = 'building-info-menu';
        menu.id = 'tower-info-hover';
        menu.innerHTML = `
            <div class="info-title">${info.name}</div>
            <div class="info-stats">
                <div><span>Damage:</span> <span>${info.damage}</span></div>
                <div><span>Range:</span> <span>${info.range}</span></div>
                <div><span>Speed:</span> <span>${info.fireRate}</span></div>
            </div>
            <div class="info-description">${info.description}</div>
            ${info.upgradeInfo ? `<div class="info-upgrade" style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid rgba(255, 215, 0, 0.3); color: #FFD700; font-size: 0.85rem;">${info.upgradeInfo}</div>` : ''}
        `;
        
        document.body.appendChild(menu);
        
        // Position the menu near the button
        const btnRect = towerBtn.getBoundingClientRect();
        const menuWidth = menu.offsetWidth;
        
        // Position to the left of button (outside sidebar)
        let left = btnRect.left - menuWidth - 10;
        let top = btnRect.top;
        
        // Adjust if menu goes off screen
        if (left < 10) {
            left = btnRect.right + 10;
        }
        
        if (top + menu.offsetHeight > window.innerHeight) {
            top = window.innerHeight - menu.offsetHeight - 10;
        }
        
        menu.style.left = left + 'px';
        menu.style.top = top + 'px';
        
        // Clean up on mouse leave
        towerBtn.addEventListener('mouseleave', () => {
            this.clearTowerInfoMenu();
        }, { once: true });
    }

    clearTowerInfoMenu() {
        const existingMenu = document.getElementById('tower-info-hover');
        if (existingMenu) {
            existingMenu.remove();
        }
    }

    showBuildingInfo(buildingType) {
        const info = this.towerManager.getBuildingInfo(buildingType);
        if (!info) return;
        
        // Get the building button
        const buildingBtn = document.querySelector(`.building-btn[data-type="${buildingType}"]`);
        if (!buildingBtn) return;
        
        // Clear existing menu
        this.clearBuildingInfoMenu();
        
        // Check if building is disabled
        let disabledNote = '';
        if (buildingType === 'superweapon') {
            const unlockSystem = this.towerManager.getUnlockSystem();
            if (!unlockSystem.superweaponUnlocked) {
                disabledNote = '<div style="color: #ff6b6b;">⚠️ Unlock at Academy Level 3</div>';
            } else {
                // Check for diamond cost
                const academy = this.towerManager.buildingManager.buildings.find(b => b.constructor.name === 'MagicAcademy');
                const diamondCount = academy ? (academy.gems.diamond || 0) : 0;
                const needsDiamonds = diamondCount < 5;
                if (needsDiamonds) {
                    disabledNote = `<div style="color: #ff9999;">⚠️ Requires 5 💎 (have ${diamondCount})</div>`;
                }
            }
        }
        
        // Build cost string with additional resources
        let costString = `$${info.cost}`;
        if (buildingType === 'superweapon' && info.diamondCost) {
            costString += ` + 💎${info.diamondCost}`;
        }
        
        // Create hover menu
        const menu = document.createElement('div');
        menu.className = 'building-info-menu';
        menu.id = 'building-info-hover';
        menu.innerHTML = `
            <div class="info-title">${info.name}</div>
            <div class="info-stats">
                <div><span>Effect:</span> <span>${info.effect}</span></div>
                <div><span>Size:</span> <span>${info.size}</span></div>
                <div><span>Cost:</span> <span>${costString}</span></div>
            </div>
            <div class="info-description">${info.description}</div>
            ${disabledNote}
        `;
        
        document.body.appendChild(menu);
        
        // Position the menu near the button
        const btnRect = buildingBtn.getBoundingClientRect();
        const menuWidth = menu.offsetWidth;
        
        // Position to the left of button (outside sidebar)
        let left = btnRect.left - menuWidth - 10;
        let top = btnRect.top;
        
        // Adjust if menu goes off screen
        if (left < 10) {
            left = btnRect.right + 10;
        }
        
        if (top + menu.offsetHeight > window.innerHeight) {
            top = window.innerHeight - menu.offsetHeight - 10;
        }
        
        menu.style.left = left + 'px';
        menu.style.top = top + 'px';
        
        // Clean up on mouse leave
        buildingBtn.addEventListener('mouseleave', () => {
            this.clearBuildingInfoMenu();
        }, { once: true });
    }

    clearBuildingInfoMenu() {
        const existingMenu = document.getElementById('building-info-hover');
        if (existingMenu) {
            existingMenu.remove();
        }
    }

    // ============ SPELL UI ============

    updateSpellUI() {
        const spellButtonsList = document.getElementById('spell-buttons-list');
        
        if (!spellButtonsList) {
            return;
        }
        
        // Find super weapon lab
        const superWeaponLab = this.towerManager.buildingManager.buildings.find(
            b => b.constructor.name === 'SuperWeaponLab'
        );
        
        if (!superWeaponLab) {
            spellButtonsList.innerHTML = '';
            return;
        }
        
        const availableSpells = superWeaponLab.getAvailableSpells();
        const currentButtonCount = spellButtonsList.querySelectorAll('.spell-btn').length;
        
        // Only rebuild if the number of spells changed (new unlock) OR if we have a flag to force rebuild
        // The forceRebuild flag is set after loading to ensure event listeners reference current spell objects
        if (currentButtonCount !== availableSpells.length || this.forceSpellUIRebuild) {
            console.log('UIManager: Rebuilding spell buttons. Available spells:', availableSpells.length, 'forceRebuild:', !!this.forceSpellUIRebuild);
            spellButtonsList.innerHTML = '';
            
            // Create a button for each unlocked spell
            availableSpells.forEach(spell => {
                const btn = document.createElement('button');
                btn.className = 'spell-btn';
                btn.dataset.spellId = spell.id;
                btn.title = `${spell.name}: ${spell.description}`;
                btn.innerHTML = `<span>${spell.icon}</span>`;
                
                // Add click listener with proper closure
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('UIManager: Spell button clicked:', spell.id, 'cooldown:', spell.currentCooldown);
                    // Prevent spell casting when game is paused
                    if (this.gameplayState.isPaused) {
                        console.log('UIManager: Game is paused, spell blocked');
                        return;
                    }
                    if (spell.currentCooldown === 0) {
                        console.log('UIManager: Activating spell targeting for:', spell.id);
                        this.gameplayState.activateSpellTargeting(spell.id);
                    } else {
                        console.log('UIManager: Spell is on cooldown:', spell.currentCooldown);
                    }
                });
                
                spellButtonsList.appendChild(btn);
            });
            
            // Clear the force rebuild flag after rebuilding
            this.forceSpellUIRebuild = false;
        }
        
        // Update button states (cooldown/ready) without recreating
        availableSpells.forEach(spell => {
            const btn = spellButtonsList.querySelector(`[data-spell-id="${spell.id}"]`);
            if (btn) {
                const isReady = spell.currentCooldown === 0;
                
                // Update disabled state
                btn.disabled = !isReady;
                
                // Update class
                if (isReady && btn.classList.contains('cooling')) {
                    btn.classList.remove('cooling');
                } else if (!isReady && !btn.classList.contains('cooling')) {
                    btn.classList.add('cooling');
                }
                
                // Update cooldown display
                let cooldownDisplay = btn.querySelector('.spell-cooldown');
                if (!isReady) {
                    if (!cooldownDisplay) {
                        cooldownDisplay = document.createElement('div');
                        cooldownDisplay.className = 'spell-cooldown';
                        btn.appendChild(cooldownDisplay);
                    }
                    cooldownDisplay.textContent = Math.ceil(spell.currentCooldown) + 's';
                    cooldownDisplay.style.position = 'absolute';
                    cooldownDisplay.style.fontSize = '0.7em';
                    cooldownDisplay.style.fontWeight = 'bold';
                } else {
                    if (cooldownDisplay) {
                        cooldownDisplay.remove();
                    }
                }
            }
        });
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
        const unlockSystem = this.towerManager.getUnlockSystem();
        
        // Update tower button states - show only when unlocked, disable based on resources
        document.querySelectorAll('.tower-btn').forEach(btn => {
            const type = btn.dataset.type;
            const cost = parseInt(btn.dataset.cost);
            const isUnlocked = unlockSystem.unlockedTowers.has(type);
            const canBuild = unlockSystem.canBuildTower(type);
            
            // Hide if not unlocked, show if unlocked
            if (!isUnlocked) {
                btn.style.display = 'none';
                btn.classList.add('disabled');
                btn.disabled = true;
            } else {
                btn.style.display = 'flex';
                // Button is unlocked, now check if it can be built (not at limit) and affordable
                if (!canBuild || !this.gameState.canAfford(cost)) {
                    btn.classList.add('disabled');
                    btn.disabled = true;
                } else {
                    btn.classList.remove('disabled');
                    btn.disabled = false;
                }
            }
        });
        
        // Update building button states - show when unlocked, disable based on limits and resources
        document.querySelectorAll('.building-btn').forEach(btn => {
            const type = btn.dataset.type;
            const cost = parseInt(btn.dataset.cost);
            
            // Check if building is unlocked (not if it can be built - that's different)
            const isUnlocked = unlockSystem.isBuildingUnlocked(type);
            
            // Debug superweapon button
            if (type === 'superweapon') {
            }
            
            // Hide if not unlocked, show if unlocked
            if (!isUnlocked) {
                btn.style.display = 'none';
                btn.classList.add('disabled');
                btn.disabled = true;
            } else {
                btn.style.display = 'flex';
                // Building is unlocked, check if it can be built (at limit or affordable)
                const canBuild = unlockSystem.canBuildBuilding(type);
                
                if (!canBuild || !this.gameState.canAfford(cost)) {
                    btn.classList.add('disabled');
                    btn.disabled = true;
                } else {
                    btn.classList.remove('disabled');
                    btn.disabled = false;
                }
            }
        });
        
        // Update spell buttons visibility - only show when spells are actually unlocked
        const spellButtonsContainer = document.getElementById('spell-buttons-container');
        
        if (spellButtonsContainer) {
            const superWeaponLab = this.towerManager.buildingManager.buildings.find(
                b => b.constructor.name === 'SuperWeaponLab'
            );
            
            let hasAvailableSpells = false;
            if (superWeaponLab) {
                const availableSpells = superWeaponLab.getAvailableSpells();
                hasAvailableSpells = availableSpells && availableSpells.length > 0;
            }
            
            spellButtonsContainer.style.display = hasAvailableSpells ? 'flex' : 'none';
        }
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
     * This ensures menus show real-time gold/gem availability and upgrade progress
     */
    updateActiveMenuIfNeeded(deltaTime) {
        if (!this.activeMenuType || !this.activeMenuData) {
            return; // No menu open
        }

        this.menuRefreshTimer -= deltaTime;
        if (this.menuRefreshTimer > 0) {
            return; // Not time to refresh yet
        }

        this.menuRefreshTimer = this.menuRefreshInterval;

        // SPECIAL CASE: For goldmine, only update timer - NEVER recreate menu
        if (this.activeMenuType === 'goldmine' && this.activeMenuData.goldMine) {
            this.updateGoldMineTimerDisplay(this.activeMenuData.goldMine);
            return; // STOP - don't recreate menu!
        }

        // Check if resources have changed
        const currentGold = this.gameState.gold;
        const currentGems = this.towerManager.getGemStocks();

        let hasResourcesChanged = currentGold !== this.lastGoldValue;
        
        if (!hasResourcesChanged) {
            for (const gemType of ['fire', 'water', 'air', 'earth', 'diamond']) {
                if (currentGems[gemType] !== this.lastGemValues[gemType]) {
                    hasResourcesChanged = true;
                    break;
                }
            }
        }

        if (!hasResourcesChanged) {
            return; // Resources haven't changed, no need to refresh
        }

        // Update last known values
        this.lastGoldValue = currentGold;
        this.lastGemValues = { ...currentGems };

        // OPTIMIZATION: Only update button states, don't recreate entire menu
        // This prevents DOM flickering while still keeping buttons up-to-date
        this.updateMenuButtonStates();
    }

    /**
     * Update only the button affordability in the active menu
     * without recreating the entire menu (prevents flickering)
     */
    updateMenuButtonStates() {
        const upgradeButtons = document.querySelectorAll('.panel-upgrade-btn');
        if (!upgradeButtons.length) return;

        const currentGold = this.gameState.gold;
        const currentGems = this.towerManager.getGemStocks();

        upgradeButtons.forEach(btn => {
            const costText = btn.parentElement?.querySelector('.upgrade-cost-display');
            if (!costText) return;

            const costMatch = costText.textContent.match(/\$(\d+)/);
            if (!costMatch) return;

            const cost = parseInt(costMatch[1]);
            const canAfford = currentGold >= cost;

            // Update button disabled state
            if (btn.disabled && !btn.textContent.includes('MAX') && canAfford) {
                btn.disabled = false;
                costText.classList.add('affordable');
                costText.classList.remove('affordable');  // Toggle to trigger any CSS changes
            } else if (!btn.disabled && !canAfford && !btn.textContent.includes('MAX')) {
                btn.disabled = true;
                costText.classList.remove('affordable');
            }
        });
    }

    // ============ UPGRADE MENUS ============

    showForgeUpgradeMenu(forgeData) {
        // Close other panels to prevent stacking
        this.closeOtherPanelsImmediate('forge-panel');
        
        // Play tower forge SFX only if not a menu refresh from an upgrade (skipSFX flag) and menu type is changing
        if (this.stateManager.audioManager && !forgeData.skipSFX && this.activeMenuType !== 'forge') {
            this.stateManager.audioManager.playSFX('tower-forge');
        }
        
        // Track this as the active menu for real-time updates
        this.activeMenuType = 'forge';
        this.activeMenuData = forgeData;
        this.lastGoldValue = this.gameState.gold;
        this.lastGemValues = { ...this.towerManager.getGemStocks() };
        
        // Store current forge data for this session
        this.currentForgeData = forgeData;
        
        // Get unlock system from tower manager
        const unlockSystem = this.towerManager.getUnlockSystem();
        
        // Get panel and container
        const panel = document.getElementById('forge-panel');
        const upgradesContainer = document.getElementById('forge-panel-upgrades');
        
        if (!panel || !upgradesContainer) {
            console.error('UIManager: Forge panel elements not found');
            return;
        }
        
        // Build upgraded HTML with better visual structure
        let contentHTML = '';
        
        // Forge Level Section - Special styling
        if (forgeData.forgeUpgrade) {
            const forgeUpgrade = forgeData.forgeUpgrade;
            const isMaxed = forgeUpgrade.level >= forgeUpgrade.maxLevel;
            const canAfford = forgeUpgrade.cost && this.gameState.gold >= forgeUpgrade.cost;
            
            contentHTML += `
                <div class="upgrade-category forge-level-upgrade">
                    <div class="panel-upgrade-item forge-level-upgrade ${isMaxed ? 'maxed' : ''}">
                        <div class="upgrade-header-row">
                            <div class="upgrade-icon-section">${forgeUpgrade.icon}</div>
                            <div class="upgrade-info-section">
                                <div class="upgrade-name">${forgeUpgrade.name}</div>
                                <div class="upgrade-description">${forgeUpgrade.description}</div>
                                <div class="upgrade-level-display">
                                    Level: ${forgeUpgrade.level}/${forgeUpgrade.maxLevel}
                                    <div class="upgrade-level-bar">
                                        <div class="upgrade-level-bar-fill" style="width: ${(forgeUpgrade.level / forgeUpgrade.maxLevel) * 100}%"></div>
                                    </div>
                                </div>
                                <div style="font-size: 0.8rem; color: rgba(200, 180, 120, 0.9); margin-top: 0.3rem;">${forgeUpgrade.nextUnlock}</div>
                            </div>
                        </div>
                        <div class="upgrade-action-row">
                            <div class="upgrade-cost-display ${isMaxed ? 'maxed' : canAfford ? 'affordable' : ''}">
                                ${isMaxed ? 'MAX' : `$${forgeUpgrade.cost}`}
                            </div>
                            <button class="upgrade-button panel-upgrade-btn" 
                                    data-upgrade="${forgeUpgrade.id}" 
                                    data-forge-level="true"
                                    ${isMaxed || !canAfford ? 'disabled' : ''}>
                                ${isMaxed ? 'MAX' : 'Upgrade Forge'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Tower Upgrades Section - Organized by availability
        if (forgeData.upgrades && forgeData.upgrades.length > 0) {
            contentHTML += `<div class="upgrade-category">
                <div class="upgrade-category-header">Tower Upgrades</div>`;
            
            forgeData.upgrades.forEach(upgrade => {
                const isMaxed = upgrade.level >= upgrade.maxLevel;
                const canAfford = upgrade.cost && this.gameState.gold >= upgrade.cost;
                
                // Calculate what the stats WILL BE after upgrade
                let currentEffect = '';
                let nextLevelEffect = '';
                let buttonText = '';
                
                if (upgrade.id === 'basic' || upgrade.id === 'archer') {
                    currentEffect = `Current Damage: +${upgrade.level * 8}`;
                    nextLevelEffect = `After Upgrade: +${(upgrade.level + 1) * 8}`;
                    buttonText = isMaxed ? 'MAX' : `Upgrade (→ +${(upgrade.level + 1) * 8})`;
                } else if (upgrade.id === 'barricade_effectiveness') {
                    const currentCapacity = 4 + Math.round(upgrade.level * 1.8);
                    const nextCapacity = 4 + Math.round((upgrade.level + 1) * 1.8);
                    const currentDuration = (4 + upgrade.level * 1.0).toFixed(1);
                    const nextDuration = (4 + (upgrade.level + 1) * 1.0).toFixed(1);
                    currentEffect = `Currently: ${currentCapacity} enemies for ${currentDuration}s`;
                    nextLevelEffect = `After Upgrade: ${nextCapacity} enemies for ${nextDuration}s`;
                    buttonText = isMaxed ? 'MAX' : `Upgrade to Level ${upgrade.level + 1}`;
                } else if (upgrade.id === 'archer_armor_pierce') {
                    currentEffect = `Current Armor Pierce: +${upgrade.level * 5}%`;
                    nextLevelEffect = `After Upgrade: +${(upgrade.level + 1) * 5}%`;
                    buttonText = isMaxed ? 'MAX' : `Upgrade (→ +${(upgrade.level + 1) * 5}%)`;
                } else if (upgrade.id === 'poison') {
                    currentEffect = `Current Poison: +${upgrade.level * 5}`;
                    nextLevelEffect = `After Upgrade: +${(upgrade.level + 1) * 5}`;
                    buttonText = isMaxed ? 'MAX' : `Upgrade (→ +${(upgrade.level + 1) * 5})`;
                } else if (upgrade.id === 'cannon') {
                    currentEffect = `Current Damage: +${upgrade.level * 10}`;
                    nextLevelEffect = `After Upgrade: +${(upgrade.level + 1) * 10}`;
                    buttonText = isMaxed ? 'MAX' : `Upgrade (→ +${(upgrade.level + 1) * 10})`;
                } else if (upgrade.id === 'reinforce_wall') {
                    currentEffect = `Current Health: +${upgrade.level * 50}`;
                    nextLevelEffect = `After Upgrade: +${(upgrade.level + 1) * 50}`;
                    buttonText = isMaxed ? 'MAX' : `Upgrade (→ +${(upgrade.level + 1) * 50})`;
                }
                
                contentHTML += `
                    <div class="panel-upgrade-item ${isMaxed ? 'maxed' : ''}">
                        <div class="upgrade-header-row">
                            <div class="upgrade-icon-section">${upgrade.icon}</div>
                            <div class="upgrade-info-section">
                                <div class="upgrade-name">${upgrade.name}</div>
                                <div class="upgrade-description">${upgrade.description}</div>
                                <div class="upgrade-level-display">
                                    Level: ${upgrade.level}/${upgrade.maxLevel}
                                    <div class="upgrade-level-bar">
                                        <div class="upgrade-level-bar-fill" style="width: ${(upgrade.level / upgrade.maxLevel) * 100}%"></div>
                                    </div>
                                </div>
                                ${currentEffect ? `<div style="font-size: 0.8rem; color: rgba(200, 200, 200, 0.8); margin-top: 0.3rem;">${currentEffect}</div>` : ''}
                                ${nextLevelEffect && !isMaxed ? `<div style="font-size: 0.8rem; color: #FFD700; margin-top: 0.2rem;">${nextLevelEffect}</div>` : ''}
                            </div>
                        </div>
                        <div class="upgrade-action-row">
                            <div class="upgrade-cost-display ${isMaxed ? 'maxed' : canAfford ? 'affordable' : ''}">
                                ${isMaxed ? 'MAX' : `$${upgrade.cost}`}
                            </div>
                            <button class="upgrade-button panel-upgrade-btn" 
                                    data-upgrade="${upgrade.id}" 
                                    ${isMaxed || !canAfford ? 'disabled' : ''}>
                                ${buttonText}
                            </button>
                        </div>
                    </div>
                `;
            });
            
            contentHTML += `</div>`;
        }
        
        // Add sell button for forge
        contentHTML += `
            <div style="padding: 0.6rem 0.85rem; border-top: 1px solid rgba(255, 215, 0, 0.2); display: flex; gap: 0.5rem; justify-content: flex-end;">
                <button class="upgrade-button sell-building-btn" data-building-id="forge" style="background: #ff4444; flex: 1; margin: 0;">
                    💰 Sell Forge
                </button>
            </div>
        `;
        
        // Update container
        upgradesContainer.innerHTML = contentHTML;
        
        // Show the panel with animation
        panel.style.display = 'flex';
        panel.classList.remove('closing');
        
        // Setup event listeners
        this.setupForgePanelListeners(forgeData, unlockSystem);
    }

    setupForgePanelListeners(forgeData, unlockSystem) {
        const panel = document.getElementById('forge-panel');
        if (!panel) return;
        
        // Close button
        const closeBtn = panel.querySelector('.panel-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeForgePanelWithAnimation();
            }, { once: true });
        }
        
        // Upgrade buttons
        panel.querySelectorAll('.panel-upgrade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const upgradeId = e.target.dataset.upgrade;
                const isForgeLevel = e.target.dataset.forgeLevel === 'true';
                
                if (isForgeLevel) {
                    // Handle forge level upgrade
                    if (forgeData.forge.purchaseForgeUpgrade(this.gameState)) {
                        // Play upgrade SFX
                        if (this.stateManager.audioManager) {
                            this.stateManager.audioManager.playSFX('upgrade');
                        }
                        
                        // Notify unlock system of forge upgrade
                        unlockSystem.onForgeUpgraded(forgeData.forge.getForgeLevel());
                        this.updateUI();
                        this.updateUIAvailability();
                        
                        // Refresh the panel (with skipSFX flag to prevent building sound from playing)
                        this.showForgeUpgradeMenu({
                            type: 'forge_menu',
                            forge: forgeData.forge,
                            upgrades: forgeData.forge.getUpgradeOptions(),
                            forgeUpgrade: forgeData.forge.getForgeUpgradeOption(),
                            skipSFX: true
                        });
                    }
                } else {
                    // Handle tower upgrades
                    if (forgeData.forge.purchaseUpgrade(upgradeId, this.gameState)) {
                        // Play upgrade SFX
                        if (this.stateManager.audioManager) {
                            this.stateManager.audioManager.playSFX('upgrade');
                        }
                        
                        // Special handling for reinforce_wall upgrade - apply to castle
                        if (upgradeId === 'reinforce_wall' && forgeData.castle) {
                            const healthBonus = 50; // From TowerForge.upgrades['reinforce_wall'].effect
                            forgeData.castle.maxHealth += healthBonus;
                            forgeData.castle.health = Math.min(forgeData.castle.health + healthBonus, forgeData.castle.maxHealth);
                        }
                        
                        this.updateUI();
                        
                        // Refresh the panel (with skipSFX flag to prevent building sound from playing)
                        this.showForgeUpgradeMenu({
                            type: 'forge_menu',
                            forge: forgeData.forge,
                            upgrades: forgeData.forge.getUpgradeOptions(),
                            forgeUpgrade: forgeData.forge.getForgeUpgradeOption(),
                            castle: forgeData.castle,
                            skipSFX: true
                        });
                    }
                }
            });
        });
        
        // Add sell button listener
        const sellBtn = panel.querySelector('.sell-building-btn');
        if (sellBtn) {
            sellBtn.addEventListener('click', () => {
                this.towerManager.sellBuilding(forgeData.forge);
                this.updateUI();
                this.level.setPlacementPreview(0, 0, false);
                this.closeForgePanelWithAnimation();
            }, { once: true });
        }
    }

    closeForgePanelWithAnimation() {
        const panel = document.getElementById('forge-panel');
        if (!panel) return;
        
        if (panel.style.display === 'none') return; // Already closed
        
        panel.classList.add('closing');
        setTimeout(() => {
            panel.style.display = 'none';
            panel.classList.remove('closing');
            this.currentForgeData = null;
        }, 250);
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
        this.closeOtherPanelsImmediate('academy-panel');
        
        // Play academy SFX only if menu type is changing
        if (this.stateManager.audioManager && this.activeMenuType !== 'academy') {
            this.stateManager.audioManager.playSFX('academy');
        }
        
        // Track this as the active menu for real-time updates
        this.activeMenuType = 'academy';
        this.activeMenuData = academyData;
        this.lastGoldValue = this.gameState.gold;
        this.lastGemValues = { ...this.towerManager.getGemStocks() };
        
        const panel = document.getElementById('academy-panel');
        if (!panel) {
            console.error('UIManager: Academy panel not found');
            return;
        }
        
        let contentHTML = '';
        
        // Add academy building upgrades first
        const academyUpgrade = academyData.academy.getAcademyUpgradeOption();
        if (academyData.academy.academyLevel < academyData.academy.maxAcademyLevel) {
            const isMaxed = academyData.academy.academyLevel >= academyData.academy.maxAcademyLevel;
            const canAfford = academyUpgrade.cost && this.gameState.gold >= academyUpgrade.cost;
            
            contentHTML += `
                <div class="upgrade-category">
                    <div class="panel-upgrade-item ${isMaxed ? 'maxed' : ''}">
                        <div class="upgrade-header-row">
                            <div class="upgrade-icon-section">${academyUpgrade.icon}</div>
                            <div class="upgrade-info-section">
                                <div class="upgrade-name">${academyUpgrade.name}</div>
                                <div class="upgrade-description">${academyUpgrade.description}</div>
                                <div class="upgrade-level-display">
                                    Level: ${academyUpgrade.level}/${academyUpgrade.maxLevel}
                                    <div class="upgrade-level-bar">
                                        <div class="upgrade-level-bar-fill" style="width: ${(academyUpgrade.level / academyUpgrade.maxLevel) * 100}%"></div>
                                    </div>
                                </div>
                                <div style="font-size: 0.8rem; color: rgba(200, 180, 120, 0.9); margin-top: 0.3rem;">${academyUpgrade.nextUnlock}</div>
                            </div>
                        </div>
                        <div class="upgrade-action-row">
                            <div class="upgrade-cost-display ${isMaxed ? 'maxed' : canAfford ? 'affordable' : ''}">
                                ${isMaxed ? 'MAX' : `$${academyUpgrade.cost}`}
                            </div>
                            <button class="upgrade-button panel-upgrade-btn" 
                                    data-upgrade="academy_upgrade" 
                                    ${isMaxed || !canAfford ? 'disabled' : ''}>
                                ${isMaxed ? 'MAX' : 'Upgrade'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Add elemental upgrades section
        if (academyData.upgrades && academyData.upgrades.length > 0) {
            contentHTML += `<div class="upgrade-category"><div class="upgrade-category-header">Elemental & Research</div>`;
            
            academyData.upgrades.forEach(upgrade => {
                if (upgrade.isAcademyUpgrade) return;
                
                let isDisabled = false;
                let costDisplay = '';
                let canAfford = false;
                
                // Handle combination spell unlocks
                if (upgrade.isCombinationUnlock) {
                    let allGemsAvailable = true;
                    const gemCosts = [];
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
                    canAfford = allGemsAvailable;
                } else if (upgrade.isResearch) {
                    canAfford = upgrade.cost && this.gameState.gold >= upgrade.cost;
                    isDisabled = !canAfford || upgrade.level >= upgrade.maxLevel;
                    costDisplay = upgrade.cost ? `$${upgrade.cost}` : 'MAX';
                } else {
                    const gemCount = academyData.academy.gems[upgrade.gemType] || 0;
                    canAfford = upgrade.cost && gemCount >= upgrade.cost;
                    isDisabled = !canAfford || upgrade.level >= upgrade.maxLevel;
                    costDisplay = upgrade.cost ? `${upgrade.icon}${upgrade.cost}` : 'MAX';
                }
                
                const isMaxed = upgrade.level >= upgrade.maxLevel;
                
                contentHTML += `
                    <div class="panel-upgrade-item ${isMaxed ? 'maxed' : ''}">
                        <div class="upgrade-header-row">
                            <div class="upgrade-icon-section">${upgrade.icon}</div>
                            <div class="upgrade-info-section">
                                <div class="upgrade-name">${upgrade.name}</div>
                                <div class="upgrade-description">${upgrade.description}</div>
                                <div class="upgrade-level-display">
                                    ${upgrade.isCombinationUnlock ? 'Investment' : 'Level'}: ${upgrade.level}/${upgrade.maxLevel}
                                    <div class="upgrade-level-bar">
                                        <div class="upgrade-level-bar-fill" style="width: ${(upgrade.level / upgrade.maxLevel) * 100}%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="upgrade-action-row">
                            <div class="upgrade-cost-display ${isMaxed ? 'maxed' : canAfford ? 'affordable' : ''}">
                                ${isMaxed ? 'MAX' : costDisplay}
                            </div>
                            <button class="upgrade-button panel-upgrade-btn" 
                                    data-upgrade="${upgrade.id}" 
                                    ${isDisabled ? 'disabled' : ''}>
                                ${isMaxed ? 'MAX' : (upgrade.isCombinationUnlock ? 'Unlock' : 'Upgrade')}
                            </button>
                        </div>
                    </div>
                `;
            });
            
            contentHTML += `</div>`;
        }
        
        // Add sell button for academy
        contentHTML += `
            <div style="padding: 0.6rem 0.85rem; border-top: 1px solid rgba(255, 215, 0, 0.2); display: flex; gap: 0.5rem; justify-content: flex-end;">
                <button class="upgrade-button sell-building-btn" data-building-id="academy" style="background: #ff4444; flex: 1; margin: 0;">
                    💰 Sell Academy
                </button>
            </div>
        `;
        
        // Update panel title and content
        const titleElement = panel.querySelector('.panel-title');
        if (titleElement) titleElement.textContent = '🎓 Magic Academy';
        
        const contentContainer = panel.querySelector('#academy-panel-upgrades') || panel.querySelector('.panel-content');
        if (contentContainer) {
            contentContainer.innerHTML = contentHTML;
        }
        
        // Show the panel
        panel.style.display = 'flex';
        panel.classList.remove('closing');
        
        // Setup close button
        const closeBtn = panel.querySelector('.panel-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closePanelWithAnimation('academy-panel'), { once: true });
        }
        
        // Setup button listeners
        panel.querySelectorAll('.panel-upgrade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const upgradeId = e.target.dataset.upgrade;
                
                if (upgradeId === 'academy_upgrade') {
                    if (academyData.academy.purchaseAcademyUpgrade(this.gameState)) {
                        // Play upgrade SFX
                        if (this.stateManager.audioManager) {
                            this.stateManager.audioManager.playSFX('upgrade');
                        }
                        
                        const newLevel = academyData.academy.academyLevel;
                        if (newLevel === 3) {
                            this.towerManager.getUnlockSystem().onAcademyLevelThree();
                        }
                        this.updateUI();
                        this.updateUIAvailability();
                        this.showAcademyUpgradeMenu({
                            type: 'academy_menu',
                            academy: academyData.academy,
                            upgrades: academyData.academy.getElementalUpgradeOptions()
                        });
                    }
                } else if (upgradeId.startsWith('unlock_')) {
                    const result = academyData.academy.purchaseElementalUpgrade(upgradeId, this.gameState);
                    if (result && result.success) {
                        // Play upgrade SFX
                        if (this.stateManager.audioManager) {
                            this.stateManager.audioManager.playSFX('upgrade');
                        }
                        
                        this.towerManager.getUnlockSystem().onCombinationSpellUnlocked(result.spellId);
                        this.updateUI();
                        this.updateUIAvailability();
                        this.showAcademyUpgradeMenu({
                            type: 'academy_menu',
                            academy: academyData.academy,
                            upgrades: academyData.academy.getElementalUpgradeOptions()
                        });
                    }
                } else {
                    if (academyData.academy.purchaseElementalUpgrade(upgradeId, this.gameState)) {
                        // Play upgrade SFX
                        if (this.stateManager.audioManager) {
                            this.stateManager.audioManager.playSFX('upgrade');
                        }
                        
                        this.updateUI();
                        this.showAcademyUpgradeMenu({
                            type: 'academy_menu',
                            academy: academyData.academy,
                            upgrades: academyData.academy.getElementalUpgradeOptions()
                        });
                    }
                }
            }, { once: true });
        });
        
        // Add sell button listener
        const sellBtn = panel.querySelector('.sell-building-btn');
        if (sellBtn) {
            sellBtn.addEventListener('click', () => {
                this.towerManager.sellBuilding(academyData.academy);
                this.updateUI();
                this.level.setPlacementPreview(0, 0, false);
                this.closePanelWithAnimation('academy-panel');
            }, { once: true });
        }
    }

    showMagicTowerElementMenu(towerData) {
        // Close other panels to prevent stacking
        this.closeOtherPanelsImmediate('magic-tower-panel');
        
        // Track this as the active menu for real-time updates
        this.activeMenuType = 'magic-tower';
        this.activeMenuData = towerData;
        this.lastGoldValue = this.gameState.gold;
        this.lastGemValues = { ...this.towerManager.getGemStocks() };
        
        const panel = document.getElementById('magic-tower-panel');
        if (!panel) {
            console.error('UIManager: Magic tower panel not found');
            return;
        }
        
        
        // Generate panel content with element selection
        let contentHTML = '';
        
        towerData.elements.forEach(element => {
            const isCurrent = element.id === towerData.currentElement;
            contentHTML += `
                <div class="upgrade-category">
                    <div class="panel-upgrade-item ${isCurrent ? 'selected-element' : ''}">
                        <div class="upgrade-header-row">
                            <div class="upgrade-icon-section">${element.icon}</div>
                            <div class="upgrade-info-section">
                                <div class="upgrade-name">${element.name} Element</div>
                                <div class="upgrade-description">${element.description}</div>
                                ${isCurrent ? '<div class="upgrade-current">Currently Selected</div>' : ''}
                            </div>
                        </div>
                        <div class="upgrade-action-row">
                            <div class="upgrade-cost-display">Free</div>
                            <button class="upgrade-button panel-element-btn" data-element="${element.id}" ${isCurrent ? 'disabled' : ''}>
                                ${isCurrent ? 'Active' : 'Select'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        // Add sell button for tower
        contentHTML += `
            <div style="padding: 0.6rem 0.85rem; border-top: 1px solid rgba(255, 215, 0, 0.2); display: flex; gap: 0.5rem; justify-content: flex-end;">
                <button class="upgrade-button sell-tower-btn" style="background: #ff4444; flex: 1; margin: 0;">
                    💰 Sell Tower
                </button>
            </div>
        `;
        
        // Update panel title and content
        const titleElement = panel.querySelector('.panel-title');
        if (titleElement) titleElement.textContent = '⚡ Magic Tower Elements';
        
        const contentContainer = panel.querySelector('[id$="-content"], [id$="-upgrades"]');
        if (contentContainer) {
            contentContainer.innerHTML = contentHTML;
        }
        
        // Show the panel
        panel.style.display = 'flex';
        panel.classList.remove('closing');
        
        // Setup close button
        const closeBtn = panel.querySelector('.panel-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closePanelWithAnimation('magic-tower-panel'), { once: true });
        }
        
        // Add element selection handlers
        panel.querySelectorAll('.panel-element-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const elementId = e.target.dataset.element;
                
                
                if (this.towerManager.selectMagicTowerElement(towerData.tower, elementId)) {
                    // Refresh the menu
                    this.showMagicTowerElementMenu({
                        type: 'magic_tower_menu',
                        tower: towerData.tower,
                        elements: towerData.elements,
                        currentElement: elementId
                    });
                }
            }, { once: true });
        });
        
        // Add sell button listener
        const sellBtn = panel.querySelector('.sell-tower-btn');
        if (sellBtn) {
            sellBtn.addEventListener('click', () => {
                this.towerManager.sellTower(towerData.tower);
                this.updateUI();
                this.level.setPlacementPreview(0, 0, false);
                this.closePanelWithAnimation('magic-tower-panel');
            }, { once: true });
        }
    }

    showCombinationTowerMenu(towerData) {
        // Close other panels to prevent stacking
        this.closeOtherPanelsImmediate('combination-tower-panel');
        
        // Track this as the active menu for real-time updates
        this.activeMenuType = 'combination-tower';
        this.activeMenuData = towerData;
        this.lastGoldValue = this.gameState.gold;
        this.lastGemValues = { ...this.towerManager.getGemStocks() };
        
        const panel = document.getElementById('combination-tower-panel');
        if (!panel) {
            console.error('UIManager: Combination tower panel not found');
            return;
        }
        
        
        // Generate panel content with spell selection
        let contentHTML = '';
        
        towerData.spells.forEach(spell => {
            const isCurrent = spell.id === towerData.currentSpell;
            contentHTML += `
                <div class="upgrade-category">
                    <div class="panel-upgrade-item ${isCurrent ? 'selected-element' : ''}">
                        <div class="upgrade-header-row">
                            <div class="upgrade-icon-section">${spell.icon}</div>
                            <div class="upgrade-info-section">
                                <div class="upgrade-name">${spell.name} Spell</div>
                                <div class="upgrade-description">${spell.description}</div>
                                ${isCurrent ? '<div class="upgrade-current">Currently Active</div>' : ''}
                            </div>
                        </div>
                        <div class="upgrade-action-row">
                            <div class="upgrade-cost-display">Free</div>
                            <button class="upgrade-button panel-spell-btn" data-spell="${spell.id}" ${isCurrent ? 'disabled' : ''}>
                                ${isCurrent ? 'Active' : 'Select'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        // Add sell button for tower
        contentHTML += `
            <div style="padding: 0.6rem 0.85rem; border-top: 1px solid rgba(255, 215, 0, 0.2); display: flex; gap: 0.5rem; justify-content: flex-end;">
                <button class="upgrade-button sell-tower-btn" style="background: #ff4444; flex: 1; margin: 0;">
                    💰 Sell Tower
                </button>
            </div>
        `;
        
        // Update panel title and content
        const titleElement = panel.querySelector('.panel-title');
        if (titleElement) titleElement.textContent = '✨ Combination Tower Spells';
        
        const contentContainer = panel.querySelector('[id$="-content"], [id$="-upgrades"]');
        if (contentContainer) {
            contentContainer.innerHTML = contentHTML;
        }
        
        // Show the panel
        panel.style.display = 'flex';
        panel.classList.remove('closing');
        
        // Setup close button
        const closeBtn = panel.querySelector('.panel-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closePanelWithAnimation('combination-tower-panel'), { once: true });
        }
        
        // Add spell selection handlers
        panel.querySelectorAll('.panel-spell-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const spellId = e.target.dataset.spell;
                
                
                if (this.towerManager.selectCombinationTowerSpell(towerData.tower, spellId)) {
                    this.showCombinationTowerMenu({
                        type: 'combination_tower_menu',
                        tower: towerData.tower,
                        spells: towerData.spells,
                        currentSpell: spellId
                    });
                }
            }, { once: true });
        });
        
        // Add sell button listener
        const sellBtn = panel.querySelector('.sell-tower-btn');
        if (sellBtn) {
            sellBtn.addEventListener('click', () => {
                this.towerManager.sellTower(towerData.tower);
                this.updateUI();
                this.level.setPlacementPreview(0, 0, false);
                this.closePanelWithAnimation('combination-tower-panel');
            }, { once: true });
        }
    }

    showGuardPostMenu(towerData) {
        // Close other panels to prevent stacking
        this.closeOtherPanelsImmediate('basic-tower-panel');
        
        // Track this as the active menu for real-time updates
        this.activeMenuType = 'guard-post';
        this.activeMenuData = towerData;
        this.lastGoldValue = this.gameState.gold;
        this.lastGemValues = { ...this.towerManager.getGemStocks() };
        
        const panel = document.getElementById('basic-tower-panel');
        if (!panel) {
            console.error('UIManager: Panel not found for Guard Post menu');
            return;
        }


        const tower = towerData.tower;
        const towerInfo = tower.constructor.getInfo();
        const gameState = towerData.gameState;
        const trainingGrounds = towerData.trainingGrounds;
        
        let contentHTML = `
            <div class="upgrade-category">
                <div class="panel-upgrade-item">
                    <div class="upgrade-header-row">
                        <div class="upgrade-icon-section">${towerInfo.icon}</div>
                        <div class="upgrade-info-section">
                            <div class="upgrade-name">${towerInfo.name}</div>
                            <div class="upgrade-description">${towerInfo.description}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Defender hiring section
        if (!tower.defender || tower.defender.isDead()) {
            if (tower.defenderDeadCooldown > 0) {
                // Show cooldown message
                contentHTML += `
                    <div class="upgrade-category" style="padding: 0.6rem 0.85rem; border-top: 1px solid rgba(255, 215, 0, 0.2);">
                        <div class="panel-upgrade-item">
                            <div class="upgrade-header-row">
                                <div class="upgrade-icon-section">⏱️</div>
                                <div class="upgrade-info-section">
                                    <div class="upgrade-name">Defender Cooldown</div>
                                    <div class="upgrade-description">Wait before hiring another defender</div>
                                </div>
                            </div>
                            <div class="upgrade-action-row">
                                <div class="upgrade-cost-display" style="color: #ff9999;">${tower.defenderDeadCooldown.toFixed(1)}s</div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // Show hiring options for available defender levels
                const maxDefenderLevel = (trainingGrounds && trainingGrounds.defenderMaxLevel) ? trainingGrounds.defenderMaxLevel : 1;
                const defenderCosts = [100, 150, 200];
                const defenderLabels = ['Level 1', 'Level 2 - Medium', 'Level 3 - Heavy'];
                const defenderDescriptions = [
                    'Fast, weak defender. Good for early game.',
                    'Balanced defender with moderate stats.',
                    'Slow, heavily armored tank. Maximum strength.'
                ];
                
                for (let level = 1; level <= maxDefenderLevel; level++) {
                    const cost = defenderCosts[level - 1];
                    const canAfford = gameState.gold >= cost;
                    contentHTML += `
                        <div class="upgrade-category" style="padding: 0.6rem 0.85rem; border-top: 1px solid rgba(255, 215, 0, 0.2);">
                            <div class="panel-upgrade-item">
                                <div class="upgrade-header-row">
                                    <div class="upgrade-icon-section">🛡️</div>
                                    <div class="upgrade-info-section">
                                        <div class="upgrade-name">Hire ${defenderLabels[level - 1]}</div>
                                        <div class="upgrade-description">${defenderDescriptions[level - 1]}</div>
                                    </div>
                                </div>
                                <div class="upgrade-action-row">
                                    <div class="upgrade-cost-display">$${cost}</div>
                                    <button class="upgrade-button hire-defender-btn" data-level="${level}" ${!canAfford ? 'disabled' : ''}>
                                        ${canAfford ? 'Hire' : 'Not Enough Gold'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }
            }
        } else {
            // Defender is active
            contentHTML += `
                <div class="upgrade-category" style="padding: 0.6rem 0.85rem; border-top: 1px solid rgba(255, 215, 0, 0.2);">
                    <div class="panel-upgrade-item">
                        <div class="upgrade-header-row">
                            <div class="upgrade-icon-section">✅</div>
                            <div class="upgrade-info-section">
                                <div class="upgrade-name">Defender Active (Level ${tower.defender.level})</div>
                                <div class="upgrade-description">A defender is currently stationed here</div>
                            </div>
                        </div>
                        <div class="upgrade-action-row">
                            <div class="upgrade-cost-display">${tower.defender.health}/${tower.defender.maxHealth} HP</div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Add sell button
        contentHTML += `
            <div style="padding: 0.6rem 0.85rem; border-top: 1px solid rgba(255, 215, 0, 0.2); display: flex; gap: 0.5rem; justify-content: flex-end;">
                <button class="upgrade-button sell-tower-btn" style="background: #ff4444; flex: 1; margin: 0;">
                    💰 Sell Guard Post
                </button>
            </div>
        `;

        // Update panel title and content
        const titleElement = panel.querySelector('.panel-title');
        if (titleElement) titleElement.textContent = '🛡️ Guard Post';

        const contentContainer = panel.querySelector('[id$="-content"], [id$="-upgrades"]');
        if (contentContainer) {
            contentContainer.innerHTML = contentHTML;
        }

        // Show the panel
        panel.style.display = 'flex';
        panel.classList.remove('closing');

        // Setup close button
        const closeBtn = panel.querySelector('.panel-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closePanelWithAnimation('basic-tower-panel'), { once: true });
        }

        // Setup hire defender buttons - handle multiple levels
        const hireBtns = panel.querySelectorAll('.hire-defender-btn');
        hireBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const level = parseInt(btn.getAttribute('data-level')) || 1;
                if (tower.hireDefender(gameState, level)) {
                    // Play hiring defender SFX
                    if (this.stateManager.audioManager) {
                        this.stateManager.audioManager.playSFX('hiring-defender');
                    }
                    this.updateUI();
                    // Refresh menu
                    this.showGuardPostMenu(towerData);
                }
            }, { once: true });
        });

        // Setup sell button
        const sellBtn = panel.querySelector('.sell-tower-btn');
        if (sellBtn) {
            sellBtn.addEventListener('click', () => {
                this.towerManager.sellTower(tower);
                this.updateUI();
                this.level.setPlacementPreview(0, 0, false);
                this.closePanelWithAnimation('basic-tower-panel');
            }, { once: true });
        }
    }

    showTowerStatsMenu(towerData) {
        // Close other panels to prevent stacking
        this.closeOtherPanelsImmediate('basic-tower-panel');
        
        // Set active menu type to keep towers selected
        this.activeMenuType = 'tower-stats';
        this.activeMenuData = towerData;
        
        // Generic tower stats menu for any tower type
        
        const tower = towerData.tower;
        const towerInfo = tower.constructor.getInfo();
        
        const stats = {
            name: towerInfo.name,
            damage: towerInfo.damage || tower.damage,
            range: towerInfo.range || tower.range,
            fireRate: towerInfo.fireRate || tower.fireRate,
            description: towerInfo.description,
            cost: towerInfo.cost,
            icon: towerInfo.icon || '🏰'
        };
        
        let contentHTML = `
            <div class="upgrade-category">
                <div class="panel-upgrade-item">
                    <div class="upgrade-header-row">
                        <div class="upgrade-icon-section">${stats.icon}</div>
                        <div class="upgrade-info-section">
                            <div class="upgrade-name">${stats.name}</div>
                            <div class="upgrade-description">${stats.description}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="upgrade-category" style="padding: 0.6rem 0.85rem; border-top: 1px solid rgba(255, 215, 0, 0.2);">
                <div style="font-size: 0.8rem; color: #c9a876; margin-bottom: 0.4rem;">⚔️ Damage: <span style="color: #FFD700; font-weight: bold;">${stats.damage}</span></div>
                <div style="font-size: 0.8rem; color: #c9a876; margin-bottom: 0.4rem;">🎯 Range: <span style="color: #FFD700; font-weight: bold;">${stats.range}</span></div>
                <div style="font-size: 0.8rem; color: #c9a876; margin-bottom: 0.4rem;">⚡ Attack Speed: <span style="color: #FFD700; font-weight: bold;">${typeof stats.fireRate === 'number' ? stats.fireRate.toFixed(1) : stats.fireRate}</span></div>
            </div>
            <div class="upgrade-category" style="padding: 0.6rem 0.85rem; border-top: 1px solid rgba(255, 215, 0, 0.2); display: flex; gap: 0.5rem; justify-content: flex-end;">
                <button id="sell-tower-btn-${tower.gridX}-${tower.gridY}" class="upgrade-button" style="background: #ff4444; flex: 1; margin: 0;">
                    💰 Sell Tower
                </button>
            </div>
        `;
        
        // Display in panel using the non-closing method so menu stays open when clicking towers
        this.showPanelWithoutClosing('basic-tower-panel', `${stats.icon} Tower Stats`, contentHTML);
        
        // Add sell button handler
        const sellBtn = document.getElementById(`sell-tower-btn-${tower.gridX}-${tower.gridY}`);
        if (sellBtn) {
            sellBtn.addEventListener('click', () => {
                this.towerManager.sellTower(tower);
                this.updateUI();
                this.level.setPlacementPreview(0, 0, false);
                this.closePanelWithAnimation('basic-tower-panel');
            });
        }
    }

    showBasicTowerStatsMenu(towerData) {
        // Close other panels to prevent stacking
        this.closeOtherPanelsImmediate('basic-tower-panel');
        
        // Set active menu type to keep towers selected
        this.activeMenuType = 'basic-tower-stats';
        this.activeMenuData = towerData;
        
        // Basic tower stats menu - using panel-based system
        
        
        const tower = towerData.tower;
        const stats = {
            name: 'Basic Tower',
            damage: tower.damage,
            range: tower.range,
            fireRate: tower.fireRate,
            description: 'A reliable wooden watchtower with defenders hurling rocks.',
            cost: tower.constructor.getInfo().cost
        };
        
        let contentHTML = `
            <div class="upgrade-category">
                <div class="panel-upgrade-item">
                    <div class="upgrade-header-row">
                        <div class="upgrade-icon-section">🏹</div>
                        <div class="upgrade-info-section">
                            <div class="upgrade-name">${stats.name}</div>
                            <div class="upgrade-description">${stats.description}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="upgrade-category" style="padding: 0.6rem 0.85rem; border-top: 1px solid rgba(255, 215, 0, 0.2);">
                <div style="font-size: 0.8rem; color: #c9a876; margin-bottom: 0.4rem;">⚔️ Damage: <span style="color: #FFD700; font-weight: bold;">${stats.damage}</span></div>
                <div style="font-size: 0.8rem; color: #c9a876; margin-bottom: 0.4rem;">🎯 Range: <span style="color: #FFD700; font-weight: bold;">${stats.range}</span></div>
                <div style="font-size: 0.8rem; color: #c9a876; margin-bottom: 0.4rem;">💨 Fire Rate: <span style="color: #FFD700; font-weight: bold;">${stats.fireRate}/sec</span></div>
            </div>
        `;
        
        // Display in panel with close button
        this.showPanel('basic-tower-panel', '🏹 Tower Stats', contentHTML);
        
        // Add sell button to the panel's action row
        const panel = document.getElementById('basic-tower-panel');
        const panelContent = panel.querySelector('.panel-content');
        
        // Create sell button container
        const sellContainer = document.createElement('div');
        sellContainer.style.cssText = 'padding: 0.6rem 0.85rem; border-top: 1px solid rgba(255, 215, 0, 0.2); display: flex; gap: 0.5rem; justify-content: flex-end;';
        sellContainer.innerHTML = `
            <button class="upgrade-button sell-tower-btn" style="background: #ff4444; flex: 1; margin: 0;">
                💰 Sell Tower
            </button>
        `;
        panelContent.appendChild(sellContainer);
        
        // Add sell button handler
        panel.querySelector('.sell-tower-btn').addEventListener('click', () => {
            this.towerManager.sellTower(tower);
            this.updateUI();
            this.level.setPlacementPreview(0, 0, false);
            this.closePanelWithAnimation('basic-tower-panel');
        });
    }

    showSuperWeaponMenu(menuData) {
        // Close other panels to prevent stacking
        this.closeOtherPanelsImmediate('superweapon-panel');
        
        // Play superweapon SFX only if menu type is changing
        if (this.stateManager.audioManager && this.activeMenuType !== 'superweapon') {
            this.stateManager.audioManager.playSFX('superweaponlab');
        }
        
        // Track this as the active menu for real-time updates
        this.activeMenuType = 'superweapon';
        this.activeMenuData = menuData;
        this.lastGoldValue = this.gameState.gold;
        this.lastGemValues = { ...this.towerManager.getGemStocks() };
        
        const panel = document.getElementById('superweapon-panel');
        if (!panel) {
            console.error('UIManager: SuperWeapon panel not found');
            return;
        }
        
        let contentHTML = '';
        
        // 1. Add lab level upgrade at top
        const labUpgrade = menuData.building.getLabUpgradeOption();
        if (labUpgrade) {
            const isMaxed = labUpgrade.level >= labUpgrade.maxLevel;
            const labCost = isMaxed ? 0 : labUpgrade.cost;
            
            contentHTML += `
                <div class="upgrade-category">
                    <div class="panel-upgrade-item ${isMaxed ? 'maxed' : ''}">
                        <div class="upgrade-header-row">
                            <div class="upgrade-icon-section">${labUpgrade.icon}</div>
                            <div class="upgrade-info-section">
                                <div class="upgrade-name">${labUpgrade.name}</div>
                                <div class="upgrade-description">${labUpgrade.description}</div>
                                <div class="upgrade-level-display">
                                    Level: ${labUpgrade.level}/${labUpgrade.maxLevel}
                                    <div class="upgrade-level-bar">
                                        <div class="upgrade-level-bar-fill" style="width: ${(labUpgrade.level / labUpgrade.maxLevel) * 100}%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="upgrade-action-row">
                            <div class="upgrade-cost-display ${isMaxed ? 'maxed' : (this.gameState.gold >= labUpgrade.cost && (menuData.academy && menuData.academy.gems.diamond >= (labUpgrade.diamondCost || 0)) ? 'affordable' : 'unavailable')}">
                                ${isMaxed ? 'MAX' : `$${labUpgrade.cost} + 💎${labUpgrade.diamondCost || 0}`}
                            </div>
                            <button class="upgrade-button panel-upgrade-btn" data-upgrade="lab_upgrade" 
                                    ${isMaxed || this.gameState.gold < labUpgrade.cost || (menuData.academy && (menuData.academy.gems.diamond || 0) < (labUpgrade.diamondCost || 0)) ? 'disabled' : ''}>
                                ${isMaxed ? 'MAX' : 'Upgrade'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // 2. Add main spell upgrade panel (compact progress bars)
        const mainSpells = Object.values(menuData.building.spells);
        if (mainSpells.length > 0) {
            contentHTML += `<div class="upgrade-category-header" style="padding: 0.6rem 0.85rem; color: #FFD700; font-weight: bold; border-bottom: 1px solid rgba(255, 215, 0, 0.3); margin-top: 0.6rem;">⚡ Lab Spells</div>`;
            
            contentHTML += `<div class="spell-bars-container" style="padding: 0.6rem 0.85rem; display: flex; flex-direction: column; gap: 0.6rem;">`;
            
            mainSpells.forEach(spell => {
                const isUnlocked = spell.unlocked;
                const progressPercent = (spell.upgradeLevel / spell.maxUpgradeLevel) * 100;
                const canUpgrade = menuData.building.labLevel >= 4 && isUnlocked && spell.upgradeLevel < spell.maxUpgradeLevel && (menuData.academy && (menuData.academy.gems.diamond || 0) >= 1);
                
                // Build tooltip text with spell stats
                let tooltipText = `<div style="font-weight: bold; margin-bottom: 0.3rem;">${spell.name}</div>`;
                tooltipText += `<div style="font-size: 0.75rem; color: #ddd; margin-bottom: 0.4rem;">${spell.description || ''}</div>`;
                tooltipText += `<div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 0.3rem; font-size: 0.75rem;">`;
                
                // Show current stats
                if (spell.damage) tooltipText += `<div>❖ Damage: <span style="color: #FFD700;">${Math.floor(spell.damage)}</span></div>`;
                if (spell.radius) tooltipText += `<div>◯ Radius: <span style="color: #FFD700;">${Math.floor(spell.radius)}px</span></div>`;
                if (spell.freezeDuration) tooltipText += `<div>❄️ Freeze: <span style="color: #FFD700;">${spell.freezeDuration.toFixed(1)}s</span></div>`;
                if (spell.burnDuration) tooltipText += `<div>🔥 Burn: <span style="color: #FFD700;">${spell.burnDuration}s</span> (${Math.floor(spell.burnDamage)}/s)</div>`;
                if (spell.chainCount) tooltipText += `<div>⚡ Chains: <span style="color: #FFD700;">${spell.chainCount}</span></div>`;
                tooltipText += `<div>⏱️ Cooldown: <span style="color: #FFD700;">${spell.cooldown.toFixed(1)}s</span></div>`;
                
                // Show upgrade effects
                if (isUnlocked && spell.upgradeLevel < spell.maxUpgradeLevel) {
                    tooltipText += `<div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 0.3rem; margin-top: 0.3rem; color: #aaffaa;">`;
                    tooltipText += `<div style="font-weight: bold;">Next Upgrade (+1):</div>`;
                    if (spell.damage) tooltipText += `<div>Damage: +${(spell.damage * 0.15).toFixed(0)} (×1.15)</div>`;
                    if (spell.freezeDuration) tooltipText += `<div>Freeze Duration: +0.5s</div>`;
                    if (spell.burnDamage) tooltipText += `<div>Burn Damage: +2 per tick</div>`;
                    if (spell.chainCount) tooltipText += `<div>Chain Targets: +1</div>`;
                    if (spell.radius) tooltipText += `<div>Radius: +10px</div>`;
                    tooltipText += `</div>`;
                }
                
                tooltipText += `</div>`;
                
                contentHTML += `
                    <div class="spell-bar-item" style="display: flex; align-items: center; gap: 0.5rem; opacity: ${isUnlocked ? '1' : '0.5'}; position: relative;">
                        <div style="font-size: 1.2rem; flex-shrink: 0; cursor: help;" class="spell-icon-hover" data-tooltip="${tooltipText.replace(/"/g, '&quot;')}">${spell.icon}</div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-size: 0.75rem; color: #aaa; margin-bottom: 0.2rem;">${spell.name}</div>
                            <div style="height: 12px; background: rgba(0,0,0,0.5); border-radius: 2px; overflow: hidden; border: 1px solid #666; position: relative;">
                                <div style="height: 100%; width: ${progressPercent}%; background: linear-gradient(90deg, #FFD700, #FFA500); transition: width 0.3s ease;"></div>
                                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 0.6rem; color: #fff; font-weight: bold; text-shadow: 0 0 2px #000;">${spell.upgradeLevel}/${spell.maxUpgradeLevel}</div>
                            </div>
                            <div style="font-size: 0.65rem; color: #aaa; margin-top: 0.1rem;">${isUnlocked ? '' : `Unlocks at Level ${spell.baseLevel}`}</div>
                        </div>
                        ${isUnlocked ? `<button class="spell-upgrade-btn panel-upgrade-btn" data-main-spell="${spell.id}" style="flex-shrink: 0; padding: 0.4rem 0.6rem; font-size: 1rem; background: ${canUpgrade ? '#FFD700' : '#666'}; color: ${canUpgrade ? '#000' : '#999'}; border: none; border-radius: 4px; cursor: ${canUpgrade ? 'pointer' : 'not-allowed'}; font-weight: bold;" ${!canUpgrade ? 'disabled' : ''}>
                            ${spell.upgradeLevel >= spell.maxUpgradeLevel ? '✓' : '+'}
                        </button>` : ''}
                    </div>
                `;
            });
            
            contentHTML += `</div>`;
        }
        
        // 3. Add combination tower upgrades (below main spells)
        const combinationUpgrades = menuData.building.getCombinationUpgradeOptions(menuData.academy);
        if (combinationUpgrades.length > 0) {
            contentHTML += `<div class="upgrade-category-header" style="padding: 0.6rem 0.85rem; color: #FF6BA6; font-weight: bold; border-bottom: 1px solid rgba(255, 107, 166, 0.3); margin-top: 0.6rem;">🔮 Combination Spells</div>`;
            
            combinationUpgrades.forEach(upgrade => {
                const progressPercent = (upgrade.upgradeLevel / upgrade.maxUpgradeLevel) * 100;
                const canUpgrade = upgrade.upgradeLevel < upgrade.maxUpgradeLevel && this.gameState.gold >= (upgrade.goldCost || 50);
                
                contentHTML += `
                    <div class="upgrade-category" style="margin-bottom: 0.5rem;">
                        <div class="panel-upgrade-item">
                            <div class="upgrade-header-row">
                                <div class="upgrade-icon-section">${upgrade.icon}</div>
                                <div class="upgrade-info-section">
                                    <div class="upgrade-name">${upgrade.name}</div>
                                    <div class="upgrade-description">${upgrade.description}</div>
                                    <div style="font-size: 0.75rem; color: #aaa; margin-top: 0.3rem;">Upgrades: ${upgrade.upgradeLevel}/${upgrade.maxUpgradeLevel}</div>
                                </div>
                            </div>
                            <div style="padding: 0 0.6rem 0.5rem 0.6rem;">
                                <div style="height: 16px; background: rgba(0,0,0,0.5); border-radius: 3px; overflow: hidden; border: 1px solid #666;">
                                    <div style="height: 100%; width: ${progressPercent}%; background: linear-gradient(90deg, #FF6BA6, #FF1493); display: flex; align-items: center; justify-content: center;">
                                        <span style="font-size: 0.65rem; color: #000; font-weight: bold;">${upgrade.upgradeLevel}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="upgrade-action-row">
                                <div class="upgrade-cost-display ${canUpgrade ? 'affordable' : 'unavailable'}">
                                    ${upgrade.upgradeLevel >= upgrade.maxUpgradeLevel ? 'MAX' : `$${upgrade.goldCost || 50}`}
                                </div>
                                <button class="upgrade-button panel-upgrade-btn" data-combo-spell="${upgrade.id}" 
                                        ${!canUpgrade ? 'disabled' : ''}>
                                    ${upgrade.upgradeLevel >= upgrade.maxUpgradeLevel ? 'MAX' : 'Upgrade'}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        
        // Add sell button
        contentHTML += `
            <div style="padding: 0.6rem 0.85rem; border-top: 1px solid rgba(255, 215, 0, 0.2); display: flex; gap: 0.5rem; justify-content: flex-end;">
                <button class="upgrade-button sell-building-btn" data-building-id="superweapon" style="background: #ff4444; flex: 1; margin: 0;">
                    💰 Sell Lab
                </button>
            </div>
        `;
        
        // Update panel title and content
        const titleElement = panel.querySelector('.panel-title');
        if (titleElement) titleElement.textContent = '💥 Super Weapon Lab';
        
        const contentContainer = panel.querySelector('[id$="-content"], [id$="-upgrades"]');
        if (contentContainer) {
            contentContainer.innerHTML = contentHTML;
        }
        
        // Setup spell icon hover tooltips
        const setupSpellTooltips = () => {
            const spellIcons = contentContainer.querySelectorAll('.spell-icon-hover');
            
            spellIcons.forEach(icon => {
                let tooltipTimeout;
                
                icon.addEventListener('mouseenter', (e) => {
                    // Cancel any pending hide
                    clearTimeout(tooltipTimeout);
                    
                    // Remove existing tooltips first
                    const existingTooltips = document.querySelectorAll('[data-panel-tooltip]');
                    existingTooltips.forEach(tooltip => tooltip.remove());
                    
                    const tooltipHTML = icon.dataset.tooltip;
                    if (!tooltipHTML) return;
                    
                    // Create tooltip element
                    const tooltip = document.createElement('div');
                    tooltip.setAttribute('data-panel-tooltip', 'true');
                    tooltip.innerHTML = tooltipHTML;
                    tooltip.style.cssText = `
                        position: fixed;
                        background: rgba(10, 10, 20, 0.95);
                        border: 2px solid #FFD700;
                        border-radius: 6px;
                        padding: 0.8rem;
                        font-size: 0.75rem;
                        color: #ddd;
                        max-width: 250px;
                        z-index: 10001;
                        box-shadow: 0 0 20px rgba(255, 215, 0, 0.3), inset 0 0 10px rgba(255, 215, 0, 0.1);
                        pointer-events: auto;
                    `;
                    
                    document.body.appendChild(tooltip);
                    
                    // Position tooltip near icon
                    const rect = icon.getBoundingClientRect();
                    tooltip.style.left = (rect.right + 10) + 'px';
                    tooltip.style.top = (rect.top - tooltip.offsetHeight / 2 + rect.height / 2) + 'px';
                    
                    // Adjust if tooltip goes off screen
                    const tooltipRect = tooltip.getBoundingClientRect();
                    if (tooltipRect.right > window.innerWidth) {
                        tooltip.style.left = (rect.left - tooltip.offsetWidth - 10) + 'px';
                    }
                    if (tooltipRect.bottom > window.innerHeight) {
                        tooltip.style.top = (window.innerHeight - tooltip.offsetHeight - 10) + 'px';
                    }
                    if (tooltipRect.top < 0) {
                        tooltip.style.top = '10px';
                    }
                    
                    // Keep tooltip visible if hovering over it
                    tooltip.addEventListener('mouseenter', () => {
                        clearTimeout(tooltipTimeout);
                    });
                    
                    tooltip.addEventListener('mouseleave', () => {
                        tooltipTimeout = setTimeout(() => {
                            tooltip.remove();
                        }, 100);
                    });
                });
                
                icon.addEventListener('mouseleave', () => {
                    tooltipTimeout = setTimeout(() => {
                        const activeTooltips = document.querySelectorAll('[data-panel-tooltip]');
                        activeTooltips.forEach(tooltip => tooltip.remove());
                    }, 100);
                });
            });
        };
        
        setupSpellTooltips();
        
        // Show the panel
        panel.style.display = 'flex';
        panel.classList.remove('closing');
        
        // Setup close button
        const closeBtn = panel.querySelector('.panel-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closePanelWithAnimation('superweapon-panel'), { once: true });
        }
        
        // Add button handlers - use delegation to support dynamic updates
        const handleButtonClick = (e) => {
            const btn = e.target.closest('.panel-upgrade-btn');
            if (!btn || btn.disabled) return;
            
            // Prevent multiple clicks
            btn.disabled = true;
            setTimeout(() => { btn.disabled = false; }, 100);
            
            if (btn.dataset.upgrade === 'lab_upgrade') {
                if (menuData.building.purchaseLabUpgrade(this.gameState)) {
                    // Play upgrade SFX
                    if (this.stateManager.audioManager) {
                        this.stateManager.audioManager.playSFX('upgrade');
                    }
                    this.updateUI();
                    this.showSuperWeaponMenu(menuData);
                }
            } else if (btn.dataset.mainSpell) {
                const spellId = btn.dataset.mainSpell;
                const diamondCost = 1;
                if (menuData.building.upgradeMainSpell(spellId, diamondCost)) {
                    // Play upgrade SFX
                    if (this.stateManager.audioManager) {
                        this.stateManager.audioManager.playSFX('upgrade');
                    }
                    this.updateUI();
                    this.showSuperWeaponMenu(menuData);
                }
            } else if (btn.dataset.comboSpell) {
                const spellId = btn.dataset.comboSpell;
                const goldCost = 50;
                const spell = menuData.building.combinationSpells.find(s => s.id === spellId);
                if (spell && this.gameState.gold >= goldCost && spell.upgradeLevel < spell.maxUpgradeLevel) {
                    this.gameState.spend(goldCost);
                    spell.upgradeLevel++;
                    
                    // Refresh all combination towers to apply the new upgrades
                    this.towerManager.towers.forEach(tower => {
                        if (tower.constructor.name === 'CombinationTower') {
                            this.towerManager.applyTowerBonuses(tower);
                        }
                    });
                    
                    this.updateUI();
                    this.showSuperWeaponMenu(menuData);
                }
            }
        };
        
        // Remove any previous handler and add fresh one
        panel.removeEventListener('click', handleButtonClick);
        panel.addEventListener('click', handleButtonClick);
        
        // Add sell button listener
        const sellBtn = panel.querySelector('.sell-building-btn');
        if (sellBtn) {
            sellBtn.addEventListener('click', () => {
                this.towerManager.sellBuilding(menuData.building);
                this.updateUI();
                this.level.setPlacementPreview(0, 0, false);
                this.closePanelWithAnimation('superweapon-panel');
            }, { once: true });
        }
    }

    showCastleUpgradeMenu(castleData) {
        // Close other panels to prevent stacking
        this.closeOtherPanelsImmediate('castle-panel');
        
        // Play castle SFX only if menu type is changing
        if (this.stateManager.audioManager && this.activeMenuType !== 'castle') {
            this.stateManager.audioManager.playSFX('castle-select');
        }
        
        // Track this as the active menu for real-time updates
        this.activeMenuType = 'castle';
        this.activeMenuData = castleData;
        this.lastGoldValue = this.gameState.gold;
        this.lastGemValues = { ...this.towerManager.getGemStocks() };
        
        // Castle upgrades menu - using panel-based system
        
        let contentHTML = '';
        
        const castle = castleData.castle;
        const trainingGrounds = castleData.trainingGrounds;
        const forgeLevel = castleData.forgeLevel || 0;
        
        // Add castle health display and wall visual
        const maxHealth = castle.maxHealth;
        const currentHealth = castle.health;
        const healthPercent = (currentHealth / maxHealth) * 100;
        
        contentHTML += `
            <div class="upgrade-category">
                <div class="panel-upgrade-item">
                    <div class="upgrade-header-row">
                        <div class="upgrade-icon-section">🏰</div>
                        <div class="upgrade-info-section">
                            <div class="upgrade-name">Castle Wall</div>
                            <div class="upgrade-description">Current condition of the castle defenses</div>
                            <div class="upgrade-level-display">
                                Health: ${currentHealth}/${maxHealth}
                                <div class="upgrade-level-bar">
                                    <div class="upgrade-level-bar-fill" style="width: ${healthPercent}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add castle upgrade options (fortification only, available at forge level 5+)
        const castleUpgrades = castle.getUpgradeOptions().filter(u => u.id === 'fortification');
        
        if (forgeLevel >= 5 && castleUpgrades.length > 0) {
            contentHTML += `<div class="upgrade-category"><div class="upgrade-category-header">Castle Upgrades</div>`;
            
            castleUpgrades.forEach(upgrade => {
                const isMaxed = upgrade.level >= upgrade.maxLevel;
                const canAfford = upgrade.cost && this.gameState.gold >= upgrade.cost;
                
                contentHTML += `
                    <div class="panel-upgrade-item ${isMaxed ? 'maxed' : ''}">
                        <div class="upgrade-header-row">
                            <div class="upgrade-icon-section">${upgrade.icon}</div>
                            <div class="upgrade-info-section">
                                <div class="upgrade-name">${upgrade.name}</div>
                                <div class="upgrade-description">${upgrade.description}</div>
                                <div class="upgrade-level-display">
                                    Level: ${upgrade.level}/${upgrade.maxLevel}
                                    <div class="upgrade-level-bar">
                                        <div class="upgrade-level-bar-fill" style="width: ${(upgrade.level / upgrade.maxLevel) * 100}%"></div>
                                    </div>
                                </div>
                                <div style="font-size: 0.8rem; color: rgba(200, 200, 200, 0.8); margin-top: 0.3rem;">${upgrade.currentEffect}</div>
                            </div>
                        </div>
                        <div class="upgrade-action-row">
                            <div class="upgrade-cost-display ${isMaxed ? 'maxed' : canAfford ? 'affordable' : ''}">
                                ${isMaxed ? 'MAX' : upgrade.cost ? `$${upgrade.cost}` : 'N/A'}
                            </div>
                            <button class="upgrade-button panel-upgrade-btn" 
                                    data-castle-upgrade="${upgrade.id}" 
                                    ${isMaxed || !canAfford ? 'disabled' : ''}>
                                ${isMaxed ? 'MAX' : 'Upgrade'}
                            </button>
                        </div>
                    </div>
                `;
            });
            
            contentHTML += `</div>`;
        }
        
        // Add defender hiring section if Training Grounds is available
        if (trainingGrounds && trainingGrounds.defenderUnlocked) {
            const defenderOptions = castle.getDefenderHiringOptions(trainingGrounds);
            
            contentHTML += `<div class="upgrade-category"><div class="upgrade-category-header">Defender Hiring</div>`;
            
            defenderOptions.forEach(option => {
                if (option.type === 'defender_status') {
                    // Status messages (active, cooldown, locked)
                    contentHTML += `
                        <div class="panel-upgrade-item">
                            <div class="upgrade-header-row">
                                <div class="upgrade-icon-section">${option.icon}</div>
                                <div class="upgrade-info-section">
                                    <div class="upgrade-name">${option.name}</div>
                                    <div class="upgrade-description">${option.description}</div>
                                </div>
                            </div>
                        </div>
                    `;
                } else if (option.type === 'defender_hire' && option.canHire) {
                    // Hiring options
                    const canAfford = this.gameState.gold >= option.cost;
                    const statusClass = canAfford ? 'affordable' : 'unaffordable';
                    
                    contentHTML += `
                        <div class="panel-upgrade-item ${statusClass}">
                            <div class="upgrade-header-row">
                                <div class="upgrade-icon-section">${option.icon}</div>
                                <div class="upgrade-info-section">
                                    <div class="upgrade-name">${option.name}</div>
                                    <div class="upgrade-description">${option.description}</div>
                                </div>
                            </div>
                            <div class="upgrade-action-row">
                                <div class="upgrade-cost-display ${canAfford ? 'affordable' : ''}">
                                    $${option.cost}
                                </div>
                                <button class="upgrade-button panel-upgrade-btn" 
                                        data-defender-level="${option.level}" 
                                        ${!canAfford ? 'disabled' : ''}>
                                    Hire Level ${option.level}
                                </button>
                            </div>
                        </div>
                    `;
                }
            });
            
            contentHTML += `</div>`;
        }
        
        this.showPanelWithoutClosing('castle-panel', '🏰 Castle Upgrades', contentHTML);
        
        // Add event listeners for castle upgrades
        document.querySelectorAll('[data-castle-upgrade]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const upgradeId = btn.dataset.castleUpgrade;
                if (castle.purchaseUpgrade(upgradeId, this.gameState)) {
                    // Play upgrade SFX
                    if (this.stateManager.audioManager) {
                        this.stateManager.audioManager.playSFX('upgrade');
                    }
                    
                    this.updateUI();
                    this.updateButtonStates();
                    // Refresh the menu to show updated state
                    this.showCastleUpgradeMenu(castleData);
                } else {
                }
            }, { once: true });
        });
        
        // Add event listeners for defender hiring
        if (trainingGrounds && trainingGrounds.defenderUnlocked) {
            document.querySelectorAll('[data-defender-level]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const level = parseInt(btn.dataset.defenderLevel);
                    if (castle.hireDefender(level, this.gameState)) {
                        // Play hiring defender SFX
                        if (this.stateManager.audioManager) {
                            this.stateManager.audioManager.playSFX('hiring-defender');
                        }
                        
                        this.updateUI();
                        this.updateButtonStates();
                        this.closePanelWithAnimation('castle-panel');
                    } else {
                    }
                }, { once: true });
            });
        }
    }

    showTrainingGroundsUpgradeMenu(trainingData) {
        // Close other panels to prevent stacking
        this.closeOtherPanelsImmediate('training-panel');
        
        // Play training ground SFX only if not a menu refresh from an upgrade (skipSFX flag)
        if (this.stateManager.audioManager && !trainingData.skipSFX) {
            this.stateManager.audioManager.playSFX('training-ground');
        }
        
        const panel = document.getElementById('training-panel');
        if (!panel) {
            console.error('UIManager: Training panel not found');
            return;
        }
        
        
        let contentHTML = '';
        
        // Add training grounds building level upgrade first
        if (trainingData.trainingUpgrade) {
            const upgrade = trainingData.trainingUpgrade;
            const isMaxed = upgrade.level >= upgrade.maxLevel;
            const canAfford = upgrade.cost && this.gameState.gold >= upgrade.cost;
            
            contentHTML += `
                <div class="upgrade-category training-level-upgrade">
                    <div class="panel-upgrade-item training-level-upgrade ${isMaxed ? 'maxed' : ''}">
                        <div class="upgrade-header-row">
                            <div class="upgrade-icon-section">${upgrade.icon}</div>
                            <div class="upgrade-info-section">
                                <div class="upgrade-name">${upgrade.name}</div>
                                <div class="upgrade-description">${upgrade.description}</div>
                                <div class="upgrade-level-display">
                                    Level: ${upgrade.level}/${upgrade.maxLevel}
                                    <div class="upgrade-level-bar">
                                        <div class="upgrade-level-bar-fill" style="width: ${(upgrade.level / upgrade.maxLevel) * 100}%"></div>
                                    </div>
                                </div>
                                <div style="font-size: 0.8rem; color: rgba(200, 180, 120, 0.9); margin-top: 0.3rem;">${upgrade.nextUnlock}</div>
                            </div>
                        </div>
                        <div class="upgrade-action-row">
                            <div class="upgrade-cost-display ${isMaxed ? 'maxed' : canAfford ? 'affordable' : ''}">
                                ${isMaxed ? 'MAX' : `$${upgrade.cost}`}
                            </div>
                            <button class="upgrade-button panel-upgrade-btn" 
                                    data-upgrade="training_level" 
                                    ${isMaxed || !canAfford ? 'disabled' : ''}>
                                ${isMaxed ? 'MAX' : 'Upgrade Training'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Add range upgrades section
        if (trainingData.rangeUpgrades && trainingData.rangeUpgrades.length > 0) {
            contentHTML += `<div class="upgrade-category"><div class="upgrade-category-header">Manned Tower Range Training</div>`;
            
            trainingData.rangeUpgrades.forEach(upgrade => {
                const isMaxed = upgrade.level >= upgrade.maxLevel;
                const canAfford = upgrade.cost && this.gameState.gold >= upgrade.cost;
                const isUnlocked = upgrade.isUnlocked;
                const isDisabled = isMaxed || !canAfford || !isUnlocked;
                
                let statusClass = '';
                if (isMaxed) {
                    statusClass = 'maxed';
                } else if (!isUnlocked) {
                    statusClass = 'locked';
                } else if (!canAfford) {
                    statusClass = 'unaffordable';
                } else {
                    statusClass = 'affordable';
                }
                
                contentHTML += `
                    <div class="panel-upgrade-item ${statusClass}">
                        <div class="upgrade-header-row">
                            <div class="upgrade-icon-section">${upgrade.icon}</div>
                            <div class="upgrade-info-section">
                                <div class="upgrade-name">${upgrade.name}</div>
                                <div class="upgrade-description">${upgrade.description}</div>
                                <div class="upgrade-level-display">
                                    Level: ${upgrade.level}/${upgrade.maxLevel}
                                    <div class="upgrade-level-bar">
                                        <div class="upgrade-level-bar-fill" style="width: ${(upgrade.level / upgrade.maxLevel) * 100}%"></div>
                                    </div>
                                </div>
                                ${!isUnlocked ? `<div style="font-size: 0.8rem; color: #ff6b6b; margin-top: 0.3rem;">⚠️ Unlock at Training Level ${upgrade.level + 1}</div>` : ''}
                            </div>
                        </div>
                        <div class="upgrade-action-row">
                            <div class="upgrade-cost-display ${isDisabled ? (isMaxed ? 'maxed' : 'unavailable') : canAfford ? 'affordable' : 'unaffordable'}">
                                ${isMaxed ? 'MAX' : isUnlocked ? (canAfford ? `$${upgrade.cost}` : `$${upgrade.cost}`) : 'LOCKED'}
                            </div>
                            <button class="upgrade-button panel-upgrade-btn" 
                                    data-upgrade="${upgrade.id}" 
                                    data-tower-type="${upgrade.towerType}"
                                    ${isDisabled ? 'disabled' : ''}>
                                ${isMaxed ? 'MAX' : isUnlocked ? 'Train Range' : 'LOCKED'}
                            </button>
                        </div>
                    </div>
                `;
            });
            
            contentHTML += `</div>`;
        }
        
        // Add tower-specific upgrades section
        if (trainingData.towerUpgrades && trainingData.towerUpgrades.length > 0) {
            contentHTML += `<div class="upgrade-category"><div class="upgrade-category-header">Tower Combat Training</div>`;
            
            trainingData.towerUpgrades.forEach(upgrade => {
                const isMaxed = upgrade.level >= upgrade.maxLevel;
                const canAfford = upgrade.cost && this.gameState.gold >= upgrade.cost;
                
                // Calculate what the stats WILL BE after upgrade
                let currentEffect = '';
                let nextLevelEffect = '';
                let buttonText = '';
                
                if (upgrade.id === 'damageTraining') {
                    currentEffect = `Current bonus: +${upgrade.level * 5}`;
                    nextLevelEffect = `After Upgrade: +${(upgrade.level + 1) * 5}`;
                    buttonText = isMaxed ? 'MAX' : `Upgrade to Level ${upgrade.level + 1}`;
                } else if (upgrade.id === 'speedTraining') {
                    const currentBonus = ((upgrade.level * 1.05 - 1) * 100).toFixed(0);
                    const nextBonus = (((upgrade.level + 1) * 1.05 - 1) * 100).toFixed(0);
                    currentEffect = `Current fire rate: +${currentBonus}%`;
                    nextLevelEffect = `After Upgrade: +${nextBonus}%`;
                    buttonText = isMaxed ? 'MAX' : `Upgrade to Level ${upgrade.level + 1}`;
                } else if (upgrade.id === 'accuracyTraining') {
                    const currentReduction = ((1 - upgrade.level * 0.95) * 100).toFixed(0);
                    const nextReduction = ((1 - (upgrade.level + 1) * 0.95) * 100).toFixed(0);
                    currentEffect = `Current reload time: -${currentReduction}%`;
                    nextLevelEffect = `After Upgrade: -${nextReduction}%`;
                    buttonText = isMaxed ? 'MAX' : `Upgrade to Level ${upgrade.level + 1}`;
                } else if (upgrade.id === 'staminaTraining') {
                    const currentBonus = ((upgrade.level * 1.1 - 1) * 100).toFixed(0);
                    const nextBonus = (((upgrade.level + 1) * 1.1 - 1) * 100).toFixed(0);
                    currentEffect = `Current durability: +${currentBonus}%`;
                    nextLevelEffect = `After Upgrade: +${nextBonus}%`;
                    buttonText = isMaxed ? 'MAX' : `Upgrade to Level ${upgrade.level + 1}`;
                } else if (upgrade.id === 'barricadeFireRate') {
                    const currentFireRate = (0.2 + upgrade.level * 0.1).toFixed(1);
                    const nextFireRate = (0.2 + (upgrade.level + 1) * 0.1).toFixed(1);
                    currentEffect = `Current fire rate: ${currentFireRate}/sec`;
                    nextLevelEffect = `After Upgrade: ${nextFireRate}/sec`;
                    buttonText = isMaxed ? 'MAX' : `Upgrade to Level ${upgrade.level + 1}`;
                }
                
                contentHTML += `
                    <div class="panel-upgrade-item ${isMaxed ? 'maxed' : ''}">
                        <div class="upgrade-header-row">
                            <div class="upgrade-icon-section">${upgrade.icon}</div>
                            <div class="upgrade-info-section">
                                <div class="upgrade-name">${upgrade.name}</div>
                                <div class="upgrade-description">${upgrade.description}</div>
                                <div class="upgrade-level-display">
                                    Level: ${upgrade.level}/${upgrade.maxLevel}
                                    <div class="upgrade-level-bar">
                                        <div class="upgrade-level-bar-fill" style="width: ${(upgrade.level / upgrade.maxLevel) * 100}%"></div>
                                    </div>
                                </div>
                                ${currentEffect ? `<div style="font-size: 0.8rem; color: rgba(200, 200, 200, 0.8); margin-top: 0.3rem;">${currentEffect}</div>` : ''}
                                ${nextLevelEffect && !isMaxed ? `<div style="font-size: 0.8rem; color: #FFD700; margin-top: 0.2rem;">${nextLevelEffect}</div>` : ''}
                            </div>
                        </div>
                        <div class="upgrade-action-row">
                            <div class="upgrade-cost-display ${isMaxed ? 'maxed' : canAfford ? 'affordable' : ''}">
                                ${isMaxed ? 'MAX' : `$${upgrade.cost}`}
                            </div>
                            <button class="upgrade-button panel-upgrade-btn" 
                                    data-upgrade="${upgrade.id}" 
                                    ${isMaxed || !canAfford ? 'disabled' : ''}>
                                ${buttonText}
                            </button>
                        </div>
                    </div>
                `;
            });
            
            contentHTML += `</div>`;
        }
        
        // Add sell button
        contentHTML += `
            <div style="padding: 0.6rem 0.85rem; border-top: 1px solid rgba(255, 215, 0, 0.2); display: flex; gap: 0.5rem; justify-content: flex-end;">
                <button class="upgrade-button sell-building-btn" data-building-id="training" style="background: #ff4444; flex: 1; margin: 0;">
                    💰 Sell Training Grounds
                </button>
            </div>
        `;
        
        // Update panel title and content
        const titleElement = panel.querySelector('.panel-title');
        if (titleElement) titleElement.textContent = '🏛️ Training Grounds';
        
        const contentContainer = panel.querySelector('#training-panel-content');
        if (contentContainer) {
            contentContainer.innerHTML = contentHTML;
        }
        
        // Show the panel
        panel.style.display = 'flex';
        panel.classList.remove('closing');
        
        // Setup close button
        const closeBtn = panel.querySelector('.panel-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closePanelWithAnimation('training-panel'), { once: true });
        }
        
        // Get unlock system for tower unlock notifications
        const unlockSystem = this.towerManager.getUnlockSystem();
        
        // Add button handlers for upgrades
        panel.querySelectorAll('.panel-upgrade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const upgradeId = e.target.dataset.upgrade;
                const towerType = e.target.dataset.towerType;
                
                
                let success = false;
                if (upgradeId === 'training_level') {
                    success = trainingData.trainingGrounds.purchaseTrainingLevelUpgrade(this.gameState);
                    // Notify unlock system of training grounds upgrade
                    if (success) {
                        // Play upgrade SFX
                        if (this.stateManager.audioManager) {
                            this.stateManager.audioManager.playSFX('upgrade');
                        }
                        unlockSystem.onTrainingGroundsUpgraded(trainingData.trainingGrounds.trainingLevel);
                    }
                } else if (towerType) {
                    // Range upgrade for specific tower type
                    success = trainingData.trainingGrounds.purchaseRangeUpgrade(towerType, this.gameState);
                    if (success) {
                        // Play upgrade SFX
                        if (this.stateManager.audioManager) {
                            this.stateManager.audioManager.playSFX('upgrade');
                        }
                    }
                } else if (upgradeId) {
                    // Tower-specific upgrade (e.g., barricadeFireRate)
                    success = trainingData.trainingGrounds.purchaseUpgrade(upgradeId, this.gameState);
                    if (success) {
                        // Play upgrade SFX
                        if (this.stateManager.audioManager) {
                            this.stateManager.audioManager.playSFX('upgrade');
                        }
                    }
                }
                
                if (success) {
                    this.updateUI();
                    this.updateUIAvailability();
                    // Refresh the menu without playing the training ground SFX again
                    this.showTrainingGroundsUpgradeMenu({
                        trainingGrounds: trainingData.trainingGrounds,
                        rangeUpgrades: trainingData.trainingGrounds.getRangeUpgradeOptions(),
                        towerUpgrades: trainingData.trainingGrounds.getUpgradeOptions(),
                        trainingUpgrade: trainingData.trainingGrounds.getTrainingLevelUpgradeOption(),
                        skipSFX: true
                    });
                }
            }, { once: true });
        });
        
        // Add sell button listener
        const sellBtn = panel.querySelector('.sell-building-btn');
        if (sellBtn) {
            sellBtn.addEventListener('click', () => {
                this.towerManager.sellBuilding(trainingData.trainingGrounds);
                this.updateUI();
                this.level.setPlacementPreview(0, 0, false);
                this.closePanelWithAnimation('training-panel');
            }, { once: true });
        }
    }

    showTrainingGroundsMenu(trainingData) {
        // Redirect to the proper upgrade menu handler
        this.showTrainingGroundsUpgradeMenu(trainingData);
    }

    showGoldMineMenu(goldMineData) {
        const goldMine = goldMineData.goldMine;
        
        // CRITICAL: Never show menu if goldmine is ready - only collection should happen
        if (goldMine && goldMine.goldReady === true) {
            // Don't open menu, don't set active menu tracking
            return;
        }
        
        // CRITICAL: Never show menu if collection just happened - prevent reopening on same click
        if (goldMine && goldMine.collectionJustHappened === true) {
            // Don't open menu after collection
            return;
        }
        
        // Close other panels to prevent stacking
        this.closeOtherPanelsImmediate('goldmine-panel');
        
        // Play goldmine SFX only if menu type is changing
        if (this.stateManager.audioManager && this.activeMenuType !== 'goldmine') {
            this.stateManager.audioManager.playSFX('minegoldclick');
        }
        
        // Track this as the active menu for real-time updates
        this.activeMenuType = 'goldmine';
        this.activeMenuData = goldMineData;
        
        const panel = document.getElementById('goldmine-panel');
        if (!panel) {
            console.error('UIManager: Gold Mine panel not found');
            return;
        }
        const incomeInfo = goldMine.getBaseIncome();
        const modeIcon = goldMine.gemMode ? '💎' : '💰';
        const modeText = goldMine.gemMode ? 'Gem Mining' : 'Gold Mining';
        
        // Calculate progress information
        const progressPercent = (goldMine.currentProduction / goldMine.productionTime) * 100;
        const timeRemaining = Math.max(0, goldMine.productionTime - goldMine.currentProduction);
        const readyStatus = goldMine.goldReady ? '✅ READY' : `⏳ ${Math.ceil(timeRemaining)}s`;
        const readyColor = goldMine.goldReady ? '#4CAF50' : '#FFB800';
        
        let contentHTML = `
            <div class="upgrade-category">
                <div class="panel-upgrade-item">
                    <div class="upgrade-header-row">
                        <div class="upgrade-icon-section">⛏️</div>
                        <div class="upgrade-info-section">
                            <div class="upgrade-name">Gold Mine</div>
                            <div class="upgrade-description">${modeText} - ${incomeInfo}/cycle</div>
                            <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.4rem;">
                                <div style="font-size: 1.2rem; min-width: 2rem;">${modeIcon}</div>
                                <div style="flex: 1;">
                                    <div style="height: 16px; background: rgba(0,0,0,0.5); border-radius: 3px; overflow: hidden; border: 1px solid #666;">
                                        <div id="goldmine-progress-bar" style="height: 100%; width: ${progressPercent}%; background: linear-gradient(90deg, #FFB800, #FFD700); display: flex; align-items: center; justify-content: flex-end; padding-right: 4px;">
                                        </div>
                                    </div>
                                </div>
                                <div id="goldmine-timer" style="font-size: 0.75rem; color: ${readyColor}; font-weight: bold; min-width: 3.5rem; text-align: right;">${readyStatus}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add gem mining toggle if gem mining is unlocked
        if (goldMine.gemMiningUnlocked) {
            const toggleText = goldMine.gemMode ? '💰 Switch to Gold' : '💎 Switch to Gems';
            contentHTML += `
                <div style="padding: 0.6rem 0.85rem; border-top: 1px solid rgba(255, 215, 0, 0.2); display: flex; gap: 0.5rem;">
                    <button class="upgrade-button toggle-mine-mode-btn" style="background: ${goldMine.gemMode ? '#4169E1' : '#FFB800'}; flex: 1; margin: 0;">
                        ${toggleText}
                    </button>
                </div>
            `;
        }
        
        // Add collect and sell buttons
        contentHTML += `
            <div style="padding: 0.6rem 0.85rem; border-top: 1px solid rgba(255, 215, 0, 0.2); display: flex; gap: 0.5rem; justify-content: flex-end;">
        `;
        
        // Add collect button if ready
        if (goldMine.goldReady) {
            contentHTML += `
                <button class="upgrade-button collect-gold-btn" style="background: #44aa44; flex: 1; margin: 0;">
                    💰 Collect Now
                </button>
            `;
        }
        
        contentHTML += `
                <button class="upgrade-button sell-building-btn" data-building-id="goldmine" style="background: #ff4444; flex: 1; margin: 0;">
                    💰 Sell Mine
                </button>
            </div>
        `;
        
        // Update panel title and content - set it directly, no fancy comparison
        const titleElement = panel.querySelector('.panel-title');
        if (titleElement) titleElement.textContent = '⛏️ Gold Mine';
        
        const contentContainer = panel.querySelector('#goldmine-panel-content') || panel.querySelector('.panel-content');
        if (contentContainer) {
            contentContainer.innerHTML = contentHTML;
        }
        
        // Attach event listeners (they will be destroyed when content updates)
        const closeBtn = panel.querySelector('.panel-close-btn');
        if (closeBtn) {
            closeBtn.onclick = () => this.closePanelWithAnimation('goldmine-panel');
        }
        
        // Add toggle gem mining button listener
        const toggleBtn = panel.querySelector('.toggle-mine-mode-btn');
        if (toggleBtn) {
            toggleBtn.onclick = () => {
                goldMine.gemMode = !goldMine.gemMode;
                goldMine.currentProduction = 0; // Reset production cycle when switching modes
                this.updateUI();
                this.showGoldMineMenu(goldMineData);
            };
        }
        
        // Add collect button listener if button exists
        const collectBtn = panel.querySelector('.collect-gold-btn');
        if (collectBtn) {
            collectBtn.onclick = () => {
                if (goldMine.gemMode) {
                    // Collect gems - need to distribute them to academy
                    const academies = this.towerManager.buildingManager.buildings.filter(b => 
                        b.constructor.name === 'MagicAcademy'
                    );
                    if (academies.length > 0) {
                        const collectedGems = goldMine.collectGems();
                        academies[0].gems.fire += collectedGems.fire || 0;
                        academies[0].gems.water += collectedGems.water || 0;
                        academies[0].gems.air += collectedGems.air || 0;
                        academies[0].gems.earth += collectedGems.earth || 0;
                    }
                } else {
                    const collected = goldMine.collectGold();
                    this.gameState.gold += collected;
                }
                this.updateUI();
                this.closePanelWithAnimation('goldmine-panel');
            };
        }
        
        // Add sell button listener
        const sellBtn = panel.querySelector('.sell-building-btn');
        if (sellBtn) {
            sellBtn.onclick = () => {
                this.towerManager.sellBuilding(goldMine);
                this.updateUI();
                this.level.setPlacementPreview(0, 0, false);
                this.closePanelWithAnimation('goldmine-panel');
            };
        }
        
        // Show the panel
        panel.style.display = 'flex';
        panel.classList.remove('closing');
    }

    updateGoldMineTimerDisplay(goldMine) {
        // SIMPLE: Only update timer and progress bar values in the existing menu
        const panel = document.getElementById('goldmine-panel');
        if (!panel || panel.style.display === 'none') {
            console.log('[Timer Update] Panel not visible');
            return; // Menu not visible, nothing to update
        }

        console.log('[Timer Update] Updating...');

        // Calculate current values
        const progressPercent = (goldMine.currentProduction / goldMine.productionTime) * 100;
        const timeRemaining = Math.max(0, goldMine.productionTime - goldMine.currentProduction);
        const readyStatus = goldMine.goldReady ? '✅ READY' : `⏳ ${Math.ceil(timeRemaining)}s`;
        const readyColor = goldMine.goldReady ? '#4CAF50' : '#FFB800';

        // 1. Update progress bar
        const progressBar = panel.querySelector('#goldmine-progress-bar');
        if (progressBar) {
            progressBar.style.width = Math.min(100, progressPercent) + '%';
            console.log('[Timer Update] Progress bar:', progressPercent + '%');
        } else {
            console.log('[Timer Update] Progress bar element not found');
        }

        // 2. Update timer text
        const timerDiv = panel.querySelector('#goldmine-timer');
        if (timerDiv) {
            timerDiv.textContent = readyStatus;
            timerDiv.style.color = readyColor;
            console.log('[Timer Update] Timer text:', readyStatus);
        } else {
            console.log('[Timer Update] Timer element not found');
        }
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
        }
        
        // Close options menu if open
        const ingameOptionsModal = document.getElementById('ingame-options-modal');
        if (ingameOptionsModal) {
            ingameOptionsModal.classList.remove('show');
        }
        
        // Resume the game at 1x speed
        this.gameplayState.setPaused(false);
        this.gameplayState.setGameSpeed(1.0);
        this.updateSpeedCircles(1);
        
        // Update pause button to show pause icon (game is now playing)
        const speedPauseBtn = document.getElementById('speed-pause-btn');
        if (speedPauseBtn) {
            const icon = speedPauseBtn.querySelector('.pause-play-icon');
            if (icon) {
                icon.textContent = '⏸';
                speedPauseBtn.title = 'Pause Game';
            }
        }
    }

    restartLevel() {
        // Show restart warning modal instead of restarting directly
        const restartWarningModal = document.getElementById('restart-warning-modal');
        if (restartWarningModal) {
            restartWarningModal.classList.add('show');
        }
    }

    confirmRestartLevel() {
        // Close warning modal
        const restartWarningModal = document.getElementById('restart-warning-modal');
        if (restartWarningModal) {
            restartWarningModal.classList.remove('show');
        }
        
        // Close pause menu
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

    cancelRestartLevel() {
        // Close warning modal
        const restartWarningModal = document.getElementById('restart-warning-modal');
        if (restartWarningModal) {
            restartWarningModal.classList.remove('show');
        }
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
            
            // Prepare unlock system state for saving
            const unlockSystem = this.towerManager?.unlockSystem;
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
            
            // Save only settlement data - NOT mid-game level state
            SaveSystem.saveSettlementData(
                this.stateManager.currentSaveSlot,
                {
                    playerGold: this.gameState.gold || 0,
                    playerInventory: this.stateManager.playerInventory || [],
                    upgrades: this.stateManager.upgradeSystem ? this.stateManager.upgradeSystem.serialize() : { purchasedUpgrades: [] },
                    lastPlayedLevel: this.gameplayState.currentLevel,
                    unlockedLevels: this.stateManager.currentSaveData?.unlockedLevels || [],
                    completedLevels: this.stateManager.currentSaveData?.completedLevels || [],
                    unlockSystem: unlockState
                }
            );
            
            // Show save confirmation
            const saveBtn = document.getElementById('save-btn');
            if (saveBtn) {
                const originalText = saveBtn.textContent;
                saveBtn.textContent = 'Game Saved!';
                
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

    quitLevel() {
        // Show quit warning modal instead of quitting directly
        const quitWarningModal = document.getElementById('quit-warning-modal');
        if (quitWarningModal) {
            quitWarningModal.classList.add('show');
        }
    }

    confirmQuitLevel() {
        // Close warning modal
        const quitWarningModal = document.getElementById('quit-warning-modal');
        if (quitWarningModal) {
            quitWarningModal.classList.remove('show');
        }
        
        // Close pause menu
        this.closePauseMenu();
        
        // Unpause the game before quitting
        this.gameplayState.setPaused(false);
        
        // Small delay to ensure menu closes visually
        setTimeout(() => {
            // Change to settlement state
            this.stateManager.changeState('settlementHub');
        }, 100);
    }

    cancelQuitLevel() {
        // Close warning modal
        const quitWarningModal = document.getElementById('quit-warning-modal');
        if (quitWarningModal) {
            quitWarningModal.classList.remove('show');
        }
    }

    openInGameOptions() {
        const ingameOptionsModal = document.getElementById('ingame-options-modal');
        if (ingameOptionsModal) {
            ingameOptionsModal.classList.add('show');
            // Populate the options panel content
            this.populateInGameOptionsPanel();
        }
    }

    closeInGameOptions() {
        const ingameOptionsModal = document.getElementById('ingame-options-modal');
        if (ingameOptionsModal) {
            ingameOptionsModal.classList.remove('show');
        }
    }

    setupInGameOptions() {
        const ingameOptionsBackBtn = document.getElementById('ingame-options-back-btn');
        const ingameOptionsOverlay = document.getElementById('ingame-options-overlay');
        
        if (ingameOptionsBackBtn) {
            ingameOptionsBackBtn.addEventListener('click', () => {
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
                this.closeInGameOptions();
            });
        }

        if (ingameOptionsOverlay) {
            ingameOptionsOverlay.addEventListener('click', () => {
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
                this.closeInGameOptions();
            });
        }

        // Setup quit warning modal listeners
        const quitConfirmBtn = document.getElementById('quit-confirm-btn');
        const quitCancelBtn = document.getElementById('quit-cancel-btn');
        const quitWarningOverlay = document.getElementById('quit-warning-overlay');

        if (quitConfirmBtn) {
            quitConfirmBtn.addEventListener('click', () => {
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
                this.confirmQuitLevel();
            });
        }

        if (quitCancelBtn) {
            quitCancelBtn.addEventListener('click', () => {
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
                this.cancelQuitLevel();
            });
        }

        if (quitWarningOverlay) {
            quitWarningOverlay.addEventListener('click', () => {
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
                this.cancelQuitLevel();
            });
        }

        // Setup restart warning modal listeners
        const restartConfirmBtn = document.getElementById('restart-confirm-btn');
        const restartCancelBtn = document.getElementById('restart-cancel-btn');
        const restartWarningOverlay = document.getElementById('restart-warning-overlay');

        if (restartConfirmBtn) {
            restartConfirmBtn.addEventListener('click', () => {
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
                this.confirmRestartLevel();
            });
        }

        if (restartCancelBtn) {
            restartCancelBtn.addEventListener('click', () => {
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
                this.cancelRestartLevel();
            });
        }

        if (restartWarningOverlay) {
            restartWarningOverlay.addEventListener('click', () => {
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
                this.cancelRestartLevel();
            });
        }
    }

    populateInGameOptionsPanel() {
        const content = document.getElementById('ingame-options-content');
        if (!content) return;

        // Clear existing content
        content.innerHTML = '';

        // Create volume controls and other options
        const optionsHTML = `
            <div style="color: var(--primary-gold-light); font-family: Arial, sans-serif;">
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Music Volume</label>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <input type="range" id="music-volume-slider" min="0" max="100" value="70" style="flex: 1; cursor: pointer;">
                        <span id="music-volume-display" style="width: 50px; text-align: right;">70%</span>
                    </div>
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">SFX Volume</label>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <input type="range" id="sfx-volume-slider" min="0" max="100" value="100" style="flex: 1; cursor: pointer;">
                        <span id="sfx-volume-display" style="width: 50px; text-align: right;">100%</span>
                    </div>
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Graphics Quality</label>
                    <div style="display: flex; gap: 0.8rem;">
                        <button id="graphics-low-btn" class="graphics-option-btn" data-quality="low" style="padding: 0.6rem 1rem; background: rgba(74, 58, 47, 0.95); border: 2px solid #d4af37; color: var(--primary-gold-light); cursor: pointer; border-radius: 0.3rem; font-weight: bold;">Low</button>
                        <button id="graphics-med-btn" class="graphics-option-btn" data-quality="medium" style="padding: 0.6rem 1rem; background: rgba(74, 58, 47, 0.95); border: 2px solid #d4af37; color: var(--primary-gold-light); cursor: pointer; border-radius: 0.3rem; font-weight: bold;">Medium</button>
                        <button id="graphics-high-btn" class="graphics-option-btn" data-quality="high" style="padding: 0.6rem 1rem; background: rgba(74, 58, 47, 0.95); border: 2px solid #d4af37; color: var(--primary-gold-light); cursor: pointer; border-radius: 0.3rem; font-weight: bold;">High</button>
                    </div>
                </div>
            </div>
        `;

        content.innerHTML = optionsHTML;

        // Setup slider handlers
        const musicSlider = document.getElementById('music-volume-slider');
        const sfxSlider = document.getElementById('sfx-volume-slider');
        const musicDisplay = document.getElementById('music-volume-display');
        const sfxDisplay = document.getElementById('sfx-volume-display');

        if (musicSlider) {
            musicSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                musicDisplay.textContent = value + '%';
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.setMusicVolume(value / 100);
                }
            });
        }

        if (sfxSlider) {
            sfxSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                sfxDisplay.textContent = value + '%';
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.setSFXVolume(value / 100);
                }
            });
        }

        // Setup graphics quality buttons
        const graphicsButtons = document.querySelectorAll('.graphics-option-btn');
        graphicsButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
                const quality = btn.getAttribute('data-quality');
                // Placeholder for graphics quality setting
                console.log('Graphics quality set to:', quality);
            });

            btn.addEventListener('mouseenter', () => {
                btn.style.background = 'linear-gradient(135deg, rgba(90, 74, 63, 0.98) 0%, rgba(74, 58, 47, 0.98) 100%)';
                btn.style.borderColor = '#ffe700';
                btn.style.color = '#ffe700';
                btn.style.boxShadow = '0 0 20px rgba(212, 175, 55, 0.5)';
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'rgba(74, 58, 47, 0.95)';
                btn.style.borderColor = '#d4af37';
                btn.style.color = 'var(--primary-gold-light)';
                btn.style.boxShadow = 'none';
            });
        });
    }
}
