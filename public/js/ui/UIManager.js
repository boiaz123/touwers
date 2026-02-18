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
            
            // Check if this tower has a free placement available (without consuming it)
            const isFreeFromMarketplace = this.gameplayState && this.gameplayState.hasFreePlacement(towerType, true);
            
            // Special handling for magic tower: show if free placement is available OR if academy built it
            if (towerType === 'magic') {
                const isUnlockedByAcademy = this.towerManager.unlockSystem.magicTowerUnlockedByAcademy;
                // Magic tower is shown if EITHER free placement is available OR academy has built it
                isUnlocked = isFreeFromMarketplace || isUnlockedByAcademy;
                // Determine if it can be built
                if (isUnlockedByAcademy) {
                    // If academy built it, use normal unlock logic
                    canBuild = this.towerManager.unlockSystem.canBuildTower(towerType);
                } else if (isFreeFromMarketplace) {
                    // If only free placement available, allow building
                    canBuild = true;
                } else {
                    canBuild = false;
                }
            }
            
            // Hide if not unlocked, show if unlocked
            if (!isUnlocked) {
                btn.style.display = 'none';
                btn.disabled = true;
                btn.classList.remove('free-placement');
            } else {
                btn.style.display = 'flex';
                // Check if affordable (or free from marketplace)
                const canAfford = this.gameState.canAfford(cost) || isFreeFromMarketplace;
                
                // Determine if button should be disabled (limit or affordability)
                if (!canAfford || !canBuild) {
                    btn.classList.add('disabled');
                    btn.disabled = true;
                    btn.classList.remove('free-placement');
                } else {
                    btn.classList.remove('disabled');
                    btn.disabled = false;
                    // Add free-placement class if this is a free build
                    if (isFreeFromMarketplace) {
                        btn.classList.add('free-placement');
                    } else {
                        btn.classList.remove('free-placement');
                    }
                }
            }
        });

        // Update building buttons
        document.querySelectorAll('.building-btn').forEach(btn => {
            const buildingType = btn.dataset.type;
            const cost = parseInt(btn.dataset.cost);
            
            // Check if building is unlocked (separate from whether it can be built)
            const isUnlocked = this.towerManager.unlockSystem.isBuildingUnlocked(buildingType);
            
            // Check if this building has a free placement available (without consuming it)
            const isFreeFromMarketplace = this.gameplayState && this.gameplayState.hasFreePlacement(buildingType, false);
            
            // Hide if not unlocked, show if unlocked
            if (!isUnlocked) {
                btn.style.display = 'none';
                btn.disabled = true;
                btn.classList.remove('free-placement');
            } else {
                btn.style.display = 'flex';
                // Check if it can be built (not at limit) and affordable (or free from marketplace)
                const canBuild = this.towerManager.unlockSystem.canBuildBuilding(buildingType);
                const canAfford = this.gameState.canAfford(cost) || isFreeFromMarketplace;
                
                // Determine if button should be disabled
                if (!canBuild || !canAfford) {
                    btn.classList.add('disabled');
                    btn.disabled = true;
                    btn.classList.remove('free-placement');
                } else {
                    btn.classList.remove('disabled');
                    btn.disabled = false;
                    // Add free-placement class if this is a free build
                    if (isFreeFromMarketplace) {
                        btn.classList.add('free-placement');
                    } else {
                        btn.classList.remove('free-placement');
                    }
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

        // ============ WAVE COUNTDOWN BUTTON ============
        const waveCountdownBtn = document.getElementById('wave-countdown-btn');
        if (waveCountdownBtn) {
            waveCountdownBtn.addEventListener('click', () => {
                // Play button click SFX
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
                // Skip the cooldown and start the next wave immediately
                this.gameplayState.skipWaveCooldown();
            });
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
        const speedControls = document.getElementById('speed-controls-top');
        if (speedControls) {
            speedControls.classList.add('visible');
        }
    }

    hideSpeedControls() {
        const speedControls = document.getElementById('speed-controls-top');
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
        
        // Check if player can afford this tower OR if it's free from marketplace
        const isFree = this.gameplayState.hasFreePlacement(towerType, true);
        if (!isFree && !this.gameState.canAfford(cost)) {
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
        
        // Check if player can afford this building OR if it's free from marketplace
        const isFree = this.gameplayState.hasFreePlacement(buildingType, false);
        if (!isFree && !this.gameState.canAfford(cost)) {
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
                    // Prevent spell casting when game is paused
                    if (this.gameplayState.isPaused) {
                        return;
                    }
                    if (spell.currentCooldown === 0) {
                        this.gameplayState.activateSpellTargeting(spell.id);
                    } else {
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
        // CRITICAL: Only update UI if in gameplay state with valid game state
        if (!this.gameplayState || !this.gameplayState.gameState) {
            return; // Not in gameplay, don't update
        }
        
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
        
        this.updateButtonStates();
    }

    updateUIAvailability() {
        const unlockSystem = this.towerManager.getUnlockSystem();
        
        // Update tower button states - show only when unlocked, disable based on resources
        document.querySelectorAll('.tower-btn').forEach(btn => {
            const type = btn.dataset.type;
            const cost = parseInt(btn.dataset.cost);
            const isUnlocked = unlockSystem.unlockedTowers.has(type);
            const canBuild = unlockSystem.canBuildTower(type);
            
            // Check if this tower has a free placement available (without consuming it)
            const isFreeFromMarketplace = this.gameplayState && this.gameplayState.hasFreePlacement(type, true);
            
            // Hide if not unlocked, show if unlocked
            if (!isUnlocked) {
                btn.style.display = 'none';
                btn.classList.add('disabled');
                btn.disabled = true;
                btn.classList.remove('free-placement');
            } else {
                btn.style.display = 'flex';
                // Button is unlocked, now check if it can be built (not at limit) and affordable
                const canAfford = this.gameState.canAfford(cost) || isFreeFromMarketplace;
                if (!canBuild || !canAfford) {
                    btn.classList.add('disabled');
                    btn.disabled = true;
                    btn.classList.remove('free-placement');
                } else {
                    btn.classList.remove('disabled');
                    btn.disabled = false;
                    // Add free-placement class if this is a free build
                    if (isFreeFromMarketplace) {
                        btn.classList.add('free-placement');
                    } else {
                        btn.classList.remove('free-placement');
                    }
                }
            }
        });
        
        // Update building button states - show when unlocked, disable based on limits and resources
        document.querySelectorAll('.building-btn').forEach(btn => {
            const type = btn.dataset.type;
            const cost = parseInt(btn.dataset.cost);
            
            // Check if building is unlocked (not if it can be built - that's different)
            const isUnlocked = unlockSystem.isBuildingUnlocked(type);
            
            // Check if this building has a free placement available (without consuming it)
            const isFreeFromMarketplace = this.gameplayState && this.gameplayState.hasFreePlacement(type, false);
            
            // Debug superweapon button
            if (type === 'superweapon') {
            }
            
            // Hide if not unlocked, show if unlocked
            if (!isUnlocked) {
                btn.style.display = 'none';
                btn.classList.add('disabled');
                btn.disabled = true;
                btn.classList.remove('free-placement');
            } else {
                btn.style.display = 'flex';
                // Building is unlocked, check if it can be built (at limit or affordable)
                const canBuild = unlockSystem.canBuildBuilding(type);
                const canAfford = this.gameState.canAfford(cost) || isFreeFromMarketplace;
                
                if (!canBuild || !canAfford) {
                    btn.classList.add('disabled');
                    btn.disabled = true;
                    btn.classList.remove('free-placement');
                } else {
                    btn.classList.remove('disabled');
                    btn.disabled = false;
                    // Add free-placement class if this is a free build
                    if (isFreeFromMarketplace) {
                        btn.classList.add('free-placement');
                    } else {
                        btn.classList.remove('free-placement');
                    }
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

    updateWaveCooldownDisplay() {
        // CRITICAL: Don't update if not in gameplay state or if gameplayState is null
        if (!this.gameplayState) {
            // Hide the wave countdown if no gameplay state
            const container = document.getElementById('wave-countdown-container');
            if (container) {
                container.classList.remove('visible');
                container.style.display = ''; // Clear inline style to use CSS default
            }
            return;
        }
        
        const container = document.getElementById('wave-countdown-container');
        const textEl = document.getElementById('wave-countdown-text');
        const timerEl = document.getElementById('wave-countdown-timer');
        
        if (!container || !textEl || !timerEl) {
            return; // Elements don't exist yet
        }
        
        if (this.gameplayState && this.gameplayState.isInWaveCooldown) {
            // Show countdown timer - add visible class and clear inline styles
            container.classList.add('visible');
            container.style.display = ''; // Clear inline style to use CSS
            const seconds = Math.ceil(this.gameplayState.waveCooldownTimer);
            textEl.textContent = 'Next Wave';
            timerEl.textContent = `${seconds}s`;
        } else {
            // Hide the container during active waves or when not in cooldown
            container.classList.remove('visible');
            container.style.display = ''; // Clear inline style to use CSS default (none)
        }
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
        
        // Build upgraded HTML with professional header + upgrades layout
        let contentHTML = '';
        
        // BUILD HEADER SECTION - Professional top panel with forge stats
        if (forgeData.forgeUpgrade || forgeData.forge) {
            const forgeUpgrade = forgeData.forgeUpgrade;
            const forge = forgeData.forge;
            const isMaxed = forge && forge.forgeLevel >= forge.maxForgeLevel;
            const canAfford = forgeUpgrade && forgeUpgrade.cost && this.gameState.gold >= forgeUpgrade.cost;
            
            // Build effects list based on active upgrades
            let effectsList = [];
            
            if (forge.upgrades.basic.level > 0) {
                effectsList.push(`⚔️ Basic: +${forge.upgrades.basic.level * 8}`);
            }
            
            if (forge.upgrades.archer.level > 0) {
                effectsList.push(`🏹 Archer: +${forge.upgrades.archer.level * 8}`);
            }
            
            if (forge.upgrades.barricade_effectiveness.level > 0) {
                const capacity = 4 + Math.round(forge.upgrades.barricade_effectiveness.level * 1.8);
                const duration = 4 + forge.upgrades.barricade_effectiveness.level * 1.0;
                effectsList.push(`🛡️ Barricade: ${capacity} (${duration.toFixed(1)}s)`);
            }
            
            if (forge.forgeLevel >= 2 && forge.upgrades.poison.level > 0) {
                let poisonDamage = 0;
                const poisonEffects = [1, 2, 2, 3, 5];
                for (let i = 0; i < forge.upgrades.poison.level && i < poisonEffects.length; i++) {
                    poisonDamage += poisonEffects[i];
                }
                effectsList.push(`☠️ Poison: +${poisonDamage}`);
            }
            
            if (forge.forgeLevel >= 3 && forge.upgrades.cannon.level > 0) {
                effectsList.push(`💥 Trebuchet: +${forge.upgrades.cannon.level * 10}`);
            }
            
            // Calculate forge-level benefits
            const goldMineCount = forge.forgeLevel >= 5 ? 3 : (forge.forgeLevel >= 3 ? 3 : 1);
            const incomeMultiplier = forge.getMineIncomeMultiplier();
            
            contentHTML += `
                <div class="forge-panel-header">
                    <div class="forge-header-top">
                        <div class="forge-icon-display">🔨</div>
                        <div class="forge-info-wrapper">
                            <div class="forge-title-row">
                                <div class="forge-name">Tower Forge</div>
                                <div class="forge-level-badge">Level ${forge.forgeLevel}/${forge.maxForgeLevel}</div>
                            </div>
                            <div class="forge-level-bar">
                                <div class="forge-level-bar-fill" style="width: ${(forge.forgeLevel / forge.maxForgeLevel) * 100}%"></div>
                            </div>
                            <div class="forge-effects-row">
                                ${effectsList.map(effect => `<span class="effect-badge">${effect}</span>`).join('')}
                            </div>
                            <div class="forge-benefits-list">
                                <div class="forge-benefit-item">
                                    <span class="forge-benefit-label">Gold Mines:</span>
                                    <span class="forge-benefit-value">${goldMineCount}</span>
                                </div>
                                <div class="forge-benefit-item">
                                    <span class="forge-benefit-label">Income:</span>
                                    <span class="forge-benefit-value">x${incomeMultiplier.toFixed(1)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button class="forge-upgrade-btn forge-level-upgrade-btn panel-upgrade-btn ${isMaxed ? 'maxed' : ''}" 
                            data-upgrade="${forgeUpgrade ? forgeUpgrade.id : 'forge_level'}" 
                            data-forge-level="true"
                            ${!isMaxed && !canAfford ? 'disabled' : ''}
                            ${isMaxed ? 'disabled' : ''}>
                        <div class="forge-upgrade-btn-content">
                            ${isMaxed ? '<span class="max-level-text">MAX LEVEL REACHED</span>' : '<span class="btn-label">FORGE UPGRADE</span>'}
                            <span class="btn-cost">${isMaxed ? 'LV ' + forge.forgeLevel : (forgeUpgrade && forgeUpgrade.cost ? '$ ' + forgeUpgrade.cost : '—')}</span>
                        </div>
                    </button>
                </div>
            `;
        }
        
        // BUILD TOWER UPGRADES SECTION - Compact list
        if (forgeData.upgrades && forgeData.upgrades.length > 0) {
            contentHTML += `<div class="upgrade-category compact-upgrades">
                <div class="upgrade-category-header">⚙️ TOWER ENHANCEMENTS</div>`;
            
            // Define base tower stats
            const baseTowerStats = {
                'basic': { damage: 20 },
                'archer': { damage: 15 },
                'barricade_effectiveness': { capacity: 4 },
                'poison': { damage: 18 },
                'cannon': { damage: 40, radius: 35 },
                'reinforce_wall': { health: 300 }
            };
            
            forgeData.upgrades.forEach(upgrade => {
                const isMaxed = upgrade.level >= upgrade.maxLevel;
                const canAfford = upgrade.cost && this.gameState.gold >= upgrade.cost;
                const forge = forgeData.forge;
                
                let currentValue = '';
                let nextValue = '';
                
                if (upgrade.id === 'basic') {
                    const baseDmg = baseTowerStats.basic.damage;
                    const currentBonus = forge.upgrades.basic.level * 8;
                    const nextBonus = (forge.upgrades.basic.level + 1) * 8;
                    currentValue = `${baseDmg + currentBonus}`;
                    nextValue = `${baseDmg + nextBonus}`;
                } else if (upgrade.id === 'archer') {
                    const baseDmg = baseTowerStats.archer.damage;
                    const baseArmorPierce = 0;
                    const currentDmgBonus = forge.upgrades.archer.level * 8;
                    const nextDmgBonus = (forge.upgrades.archer.level + 1) * 8;
                    const currentPierce = baseArmorPierce + (forge.upgrades.archer.level * 5);
                    const nextPierce = baseArmorPierce + ((forge.upgrades.archer.level + 1) * 5);
                    currentValue = `${baseDmg + currentDmgBonus} (+${currentPierce}%)`;
                    nextValue = `${baseDmg + nextDmgBonus} (+${nextPierce}%)`;
                } else if (upgrade.id === 'barricade_effectiveness') {
                    const baseCapacity = baseTowerStats.barricade_effectiveness.capacity;
                    const currentCapacity = baseCapacity + Math.round(forge.upgrades.barricade_effectiveness.level * 1.8);
                    const nextCapacity = baseCapacity + Math.round((forge.upgrades.barricade_effectiveness.level + 1) * 1.8);
                    const baseDuration = 4; // Base slow duration in seconds
                    const currentDuration = baseDuration + forge.upgrades.barricade_effectiveness.level * 1.0;
                    const nextDuration = baseDuration + (forge.upgrades.barricade_effectiveness.level + 1) * 1.0;
                    currentValue = `${currentCapacity} (${currentDuration.toFixed(1)}s)`;
                    nextValue = `${nextCapacity} (${nextDuration.toFixed(1)}s)`;
                } else if (upgrade.id === 'poison') {
                    const baseDmg = baseTowerStats.poison.damage;
                    const currentBonus = this.calculatePoisonBonus(forge.upgrades.poison.level);
                    const nextBonus = this.calculatePoisonBonus(forge.upgrades.poison.level + 1);
                    currentValue = `${baseDmg + currentBonus}`;
                    nextValue = `${baseDmg + nextBonus}`;
                } else if (upgrade.id === 'cannon') {
                    const baseDmg = baseTowerStats.cannon.damage;
                    const baseRadius = baseTowerStats.cannon.radius;
                    const currentDmgBonus = forge.upgrades.cannon.level * 10;
                    const nextDmgBonus = (forge.upgrades.cannon.level + 1) * 10;
                    const currentRadius = baseRadius + (forge.upgrades.cannon.level * 5);
                    const nextRadius = baseRadius + ((forge.upgrades.cannon.level + 1) * 5);
                    currentValue = `${baseDmg + currentDmgBonus} (R${currentRadius})`;
                    nextValue = `${baseDmg + nextDmgBonus} (R${nextRadius})`;
                    upgrade.name = 'Trebuchet Tower Upgrade';
                } else if (upgrade.id === 'reinforce_wall') {
                    const baseHealth = baseTowerStats.reinforce_wall.health;
                    const currentBonus = forge.upgrades.poison ? forge.upgrades.poison.level * 50 : 0;
                    const nextBonus = forge.upgrades.poison ? (forge.upgrades.poison.level + 1) * 50 : 50;
                    currentValue = `${baseHealth + currentBonus}`;
                    nextValue = `${baseHealth + nextBonus}`;
                }
                
                contentHTML += `
                    <div class="compact-upgrade-item ${isMaxed ? 'maxed' : ''}" data-upgrade-id="${upgrade.id}">
                        <div class="compact-upgrade-left">
                            <span class="compact-upgrade-icon">${upgrade.icon}</span>
                            <div class="compact-upgrade-info">
                                <div class="compact-upgrade-name">${upgrade.name}</div>
                                <div class="compact-upgrade-values">
                                    <span class="current-value">${currentValue}</span>
                                    ${!isMaxed && nextValue ? `<span class="next-value-arrow">→</span><span class="next-value">${nextValue}</span>` : '<span class="maxed-text">MAX</span>'}
                                </div>
                            </div>
                        </div>
                        <button class="compact-upgrade-btn panel-upgrade-btn" 
                                data-upgrade="${upgrade.id}" 
                                ${isMaxed || !canAfford ? 'disabled' : ''}>
                            ${isMaxed ? 'MAX' : (upgrade.cost ? `$${upgrade.cost}` : '—')}
                        </button>
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

    calculatePoisonBonus(level) {
        const poisonEffects = [1, 2, 2, 3, 5];
        let total = 0;
        for (let i = 0; i < level && i < poisonEffects.length; i++) {
            total += poisonEffects[i];
        }
        return total;
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
                const upgradeId = e.currentTarget.dataset.upgrade;
                const isForgeLevel = e.currentTarget.dataset.forgeLevel === 'true';
                
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
        
        // Upgrade hover info listeners
        panel.querySelectorAll('.compact-upgrade-item').forEach(item => {
            const upgradeId = item.dataset.upgradeId;
            const upgrade = forgeData.upgrades.find(u => u.id === upgradeId);
            
            item.addEventListener('mouseenter', () => {
                if (!upgrade || !upgrade.description) return;
                
                // Clear existing tooltips
                const existingTooltips = document.querySelectorAll('[data-forge-tooltip]');
                existingTooltips.forEach(tooltip => tooltip.remove());
                
                // Create hover menu
                const menu = document.createElement('div');
                menu.className = 'building-info-menu';
                menu.setAttribute('data-forge-tooltip', 'true');
                menu.innerHTML = `
                    <div class="info-title">${upgrade.name}</div>
                    <div class="info-description">${upgrade.description}</div>
                `;
                
                document.body.appendChild(menu);
                
                // Position the menu
                const itemRect = item.getBoundingClientRect();
                const menuWidth = menu.offsetWidth;
                
                // Position to the left of item
                let left = itemRect.left - menuWidth - 15;
                let top = itemRect.top;
                
                // Adjust if menu goes off screen
                if (left < 10) {
                    left = itemRect.right + 15;
                }
                
                if (top + menu.offsetHeight > window.innerHeight) {
                    top = window.innerHeight - menu.offsetHeight - 10;
                }
                
                menu.style.left = left + 'px';
                menu.style.top = top + 'px';
            });
            
            item.addEventListener('mouseleave', () => {
                const tooltips = document.querySelectorAll('[data-forge-tooltip]');
                tooltips.forEach(tooltip => tooltip.remove());
            });
        });
        
        // Forge level upgrade button hover
        const forgeLevelBtn = panel.querySelector('.forge-level-upgrade-btn');
        if (forgeLevelBtn && forgeData.forgeUpgrade) {
            forgeLevelBtn.addEventListener('mouseenter', () => {
                // Clear existing tooltips
                const existingTooltips = document.querySelectorAll('[data-forge-tooltip]');
                existingTooltips.forEach(tooltip => tooltip.remove());
                
                // Create hover menu
                const menu = document.createElement('div');
                menu.className = 'building-info-menu';
                menu.setAttribute('data-forge-tooltip', 'true');
                menu.innerHTML = `
                    <div class="info-title">${forgeData.forgeUpgrade.name}</div>
                    <div class="info-description">${forgeData.forgeUpgrade.description}</div>
                    ${forgeData.forgeUpgrade.nextUnlock ? `<div style="border-top: 1px solid rgba(255, 215, 0, 0.3); padding-top: 0.3rem; margin-top: 0.3rem; color: #FFD700; font-size: 0.85rem;">${forgeData.forgeUpgrade.nextUnlock}</div>` : ''}
                `;
                
                document.body.appendChild(menu);
                
                // Position the menu
                const btnRect = forgeLevelBtn.getBoundingClientRect();
                const menuWidth = menu.offsetWidth;
                const menuHeight = menu.offsetHeight;
                const panelRect = panel.getBoundingClientRect();
                
                // Priority: Position to the left with good clearance from the panel
                let left = panelRect.left - menuWidth - 30;
                let top = btnRect.top;
                
                // If not enough space to the left, try above
                if (left < 10) {
                    left = Math.max(10, panelRect.left - menuWidth - 10);
                    top = btnRect.top - menuHeight - 10;
                }
                
                // Adjust if menu goes off bottom
                if (top + menuHeight > window.innerHeight) {
                    top = Math.max(10, btnRect.top - menuHeight - 10);
                }
                
                menu.style.left = left + 'px';
                menu.style.top = top + 'px';
            });
            
            forgeLevelBtn.addEventListener('mouseleave', () => {
                const tooltips = document.querySelectorAll('[data-forge-tooltip]');
                tooltips.forEach(tooltip => tooltip.remove());
            });
        }
        
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
            'goldmine-panel',
            'diamond-press-panel'
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
            'goldmine-panel',
            'diamond-press-panel'
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
        
        // Add castle upgrade options
        let castleUpgrades = castle.getUpgradeOptions().filter(u => u.id === 'fortification');
        
        // Add reinforcement upgrade if forge level is 5+
        if (forgeLevel >= 5) {
            castleUpgrades = castleUpgrades.concat(castle.getUpgradeOptions().filter(u => u.id === 'reinforce_wall'));
        }
        
        if (castleUpgrades.length > 0) {
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
        
        // Play training ground SFX only if not a menu refresh from an upgrade (skipSFX flag) and menu type is changing
        if (this.stateManager.audioManager && !trainingData.skipSFX && this.activeMenuType !== 'training') {
            this.stateManager.audioManager.playSFX('training-ground');
        }
        
        // Track this as the active menu for real-time updates
        this.activeMenuType = 'training';
        this.activeMenuData = trainingData;
        this.lastGoldValue = this.gameState.gold;
        
        const panel = document.getElementById('training-panel');
        const upgradesContainer = document.getElementById('training-panel-content');
        
        if (!panel || !upgradesContainer) {
            console.error('UIManager: Training panel elements not found');
            return;
        }
        
        const trainingGrounds = trainingData.trainingGrounds;
        const isMaxed = trainingGrounds.trainingLevel >= trainingGrounds.maxTrainingLevel;
        const trainingUpgrade = trainingData.trainingUpgrade;
        const canAfford = trainingUpgrade && trainingUpgrade.cost && this.gameState.gold >= trainingUpgrade.cost;
        
        // Build effects list based on active upgrades
        let effectsList = [];
        
        if (trainingGrounds.rangeUpgrades.archerTower.level > 0) {
            effectsList.push(`🏹 Archer: +${trainingGrounds.rangeUpgrades.archerTower.level * 15}px`);
        }
        
        if (trainingGrounds.rangeUpgrades.basicTower.level > 0) {
            effectsList.push(`⚔️ Basic: +${trainingGrounds.rangeUpgrades.basicTower.level * 15}px`);
        }
        
        if (trainingGrounds.rangeUpgrades.cannonTower.level > 0) {
            effectsList.push(`🔫 Cannon: +${trainingGrounds.rangeUpgrades.cannonTower.level * 15}px`);
        }
        
        if (trainingGrounds.upgrades.barricadeFireRate.level > 0) {
            const fireRate = (0.2 + trainingGrounds.upgrades.barricadeFireRate.level * 0.1).toFixed(1);
            effectsList.push(`🛡️ Barricade: ${fireRate}/sec`);
        }
        
        if (trainingGrounds.upgrades.poisonArcherTowerFireRate.level > 0) {
            const fireRate = (0.8 + trainingGrounds.upgrades.poisonArcherTowerFireRate.level * 0.08).toFixed(2);
            effectsList.push(`☠️ Poison: ${fireRate}/sec`);
        }
        
        // Build HTML with professional header
        let contentHTML = `
            <div class="forge-panel-header">
                <div class="forge-header-top">
                    <div class="forge-icon-display">🏛️</div>
                    <div class="forge-info-wrapper">
                        <div class="forge-title-row">
                            <div class="forge-name">Training Grounds</div>
                            <div class="forge-level-badge">Level ${trainingGrounds.trainingLevel}/${trainingGrounds.maxTrainingLevel}</div>
                        </div>
                        <div class="forge-level-bar">
                            <div class="forge-level-bar-fill" style="width: ${(trainingGrounds.trainingLevel / trainingGrounds.maxTrainingLevel) * 100}%"></div>
                        </div>
                        <div class="forge-effects-row">
                            ${effectsList.map(effect => `<span class="effect-badge">${effect}</span>`).join('')}
                        </div>
                        <div class="forge-benefits-list">
                            <div class="forge-benefit-item">
                                <span class="forge-benefit-label">Range Levels:</span>
                                <span class="forge-benefit-value">${trainingGrounds.rangeUpgrades.archerTower.level}/5</span>
                            </div>
                            <div class="forge-benefit-item">
                                <span class="forge-benefit-label">Fire Rate Levels:</span>
                                <span class="forge-benefit-value">${trainingGrounds.upgrades.barricadeFireRate.level}/5</span>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="forge-upgrade-btn forge-level-upgrade-btn panel-upgrade-btn ${isMaxed ? 'maxed' : ''}" 
                        data-upgrade="${trainingUpgrade ? trainingUpgrade.id : 'training_level'}" 
                        data-training-level="true"
                        ${!isMaxed && !canAfford ? 'disabled' : ''}
                        ${isMaxed ? 'disabled' : ''}>
                    <div class="forge-upgrade-btn-content">
                        ${isMaxed ? '<span class="max-level-text">MAX LEVEL REACHED</span>' : '<span class="btn-label">TRAINING UPGRADE</span>'}
                        <span class="btn-cost">${isMaxed ? 'LV ' + trainingGrounds.trainingLevel : (trainingUpgrade && trainingUpgrade.cost ? '$ ' + trainingUpgrade.cost : '—')}</span>
                    </div>
                </button>
            </div>
        `;
        
        // Add tower training upgrades section - Compact list
        if (trainingData.upgrades && trainingData.upgrades.length > 0) {
            contentHTML += `<div class="upgrade-category compact-upgrades">
                <div class="upgrade-category-header">⚙️ TOWER TRAINING</div>`;
            
            trainingData.upgrades.forEach(upgrade => {
                const isMaxed = upgrade.level >= upgrade.maxLevel;
                const canAfford = upgrade.cost && this.gameState.gold >= upgrade.cost;
                
                let currentValue = '';
                let nextValue = '';
                let description = '';
                
                if (upgrade.id.startsWith('range_')) {
                    // Range upgrades
                    const baseRange = 150;
                    const effect = upgrade.effect || 15;
                    const currentRange = baseRange + (upgrade.level * effect);
                    const nextRange = baseRange + ((upgrade.level + 1) * effect);
                    currentValue = `${currentRange}px`;
                    nextValue = `${nextRange}px`;
                    description = upgrade.description || `Increase ${upgrade.name} by ${effect}px per level`;
                } else if (upgrade.id === 'barricadeFireRate') {
                    const currentRate = (0.2 + upgrade.level * 0.1).toFixed(1);
                    const nextRate = (0.2 + (upgrade.level + 1) * 0.1).toFixed(1);
                    currentValue = `${currentRate}/sec`;
                    nextValue = `${nextRate}/sec`;
                    description = 'Barricade Tower barrel rolling speed';
                } else if (upgrade.id === 'poisonArcherTowerFireRate') {
                    const currentRate = (0.8 + upgrade.level * 0.08).toFixed(2);
                    const nextRate = (0.8 + (upgrade.level + 1) * 0.08).toFixed(2);
                    currentValue = `${currentRate}/sec`;
                    nextValue = `${nextRate}/sec`;
                    description = 'Poison Archer Tower fire rate';
                }
                
                const isUnlocked = upgrade.isUnlocked !== false;
                const isDisabled = isMaxed || !canAfford || !isUnlocked;
                
                if (!isUnlocked) {
                    currentValue = 'LOCKED';
                    nextValue = '';
                }
                
                contentHTML += `
                    <div class="compact-upgrade-item ${isMaxed ? 'maxed' : (!isUnlocked ? 'locked' : '')}" data-upgrade-id="${upgrade.id}" title="${description}">
                        <div class="compact-upgrade-left">
                            <span class="compact-upgrade-icon">${upgrade.icon}</span>
                            <div class="compact-upgrade-info">
                                <div class="compact-upgrade-name">${upgrade.name}</div>
                                <div class="compact-upgrade-values">
                                    <span class="current-value">${currentValue}</span>
                                    ${!isMaxed && nextValue ? `<span class="next-value-arrow">→</span><span class="next-value">${nextValue}</span>` : '<span class="maxed-text">MAX</span>'}
                                </div>
                                <div class="compact-upgrade-description">${description}</div>
                            </div>
                        </div>
                        <button class="compact-upgrade-btn panel-upgrade-btn" 
                                data-upgrade="${upgrade.id}" 
                                ${isDisabled ? 'disabled' : ''}>
                            ${isMaxed ? 'MAX' : !isUnlocked ? 'LOCKED' : (upgrade.cost ? `$${upgrade.cost}` : '—')}
                        </button>
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
        
        // Update container
        upgradesContainer.innerHTML = contentHTML;
        
        // Show the panel with animation
        panel.style.display = 'flex';
        panel.classList.remove('closing');
        
        // Setup event listeners
        this.setupTrainingPanelListeners(trainingData);
    }
    
    setupTrainingPanelListeners(trainingData) {
        const panel = document.getElementById('training-panel');
        if (!panel) return;
        
        // Get unlock system for tower unlock notifications
        const unlockSystem = this.towerManager.getUnlockSystem();
        
        // Close button
        const closeBtn = panel.querySelector('.panel-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closePanelWithAnimation('training-panel');
            }, { once: true });
        }
        
        // Upgrade buttons
        panel.querySelectorAll('.panel-upgrade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const upgradeId = e.currentTarget.dataset.upgrade;
                const isTrainingLevel = e.currentTarget.dataset.trainingLevel === 'true';
                
                if (isTrainingLevel) {
                    // Handle training level upgrade
                    if (trainingData.trainingGrounds.purchaseUpgrade(upgradeId, this.gameState)) {
                        // Play upgrade SFX
                        if (this.stateManager.audioManager) {
                            this.stateManager.audioManager.playSFX('upgrade');
                        }
                        
                        // Notify unlock system of training grounds upgrade
                        unlockSystem.onTrainingGroundsUpgraded(trainingData.trainingGrounds.trainingLevel);
                        this.updateUI();
                        this.updateUIAvailability();
                        
                        // Refresh the panel (with skipSFX flag to prevent building sound from playing)
                        this.showTrainingGroundsUpgradeMenu({
                            trainingGrounds: trainingData.trainingGrounds,
                            upgrades: trainingData.trainingGrounds.getUpgradeOptions(),
                            trainingUpgrade: trainingData.trainingGrounds.getTrainingLevelUpgradeOption(),
                            skipSFX: true
                        });
                    }
                } else {
                    // Handle all tower training upgrades
                    if (trainingData.trainingGrounds.purchaseUpgrade(upgradeId, this.gameState)) {
                        // Play upgrade SFX
                        if (this.stateManager.audioManager) {
                            this.stateManager.audioManager.playSFX('upgrade');
                        }
                        
                        this.updateUI();
                        
                        // Refresh the panel (with skipSFX flag to prevent building sound from playing)
                        this.showTrainingGroundsUpgradeMenu({
                            trainingGrounds: trainingData.trainingGrounds,
                            upgrades: trainingData.trainingGrounds.getUpgradeOptions(),
                            trainingUpgrade: trainingData.trainingGrounds.getTrainingLevelUpgradeOption(),
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

    showDiamondPressMenu(menuData) {
        // Close other panels to prevent stacking
        this.closeOtherPanelsImmediate('diamond-press-panel');

        const panel = document.getElementById('diamond-press-panel');
        if (!panel) {
            console.error('UIManager: Diamond Press panel not found');
            return;
        }

        // Get the academy for gem counts
        const academy = this.towerManager.buildingManager.buildings.find(b =>
            b.constructor.name === 'MagicAcademy'
        );

        // Get current gem counts
        const fire = academy ? (academy.gems.fire || 0) : 0;
        const water = academy ? (academy.gems.water || 0) : 0;
        const air = academy ? (academy.gems.air || 0) : 0;
        const earth = academy ? (academy.gems.earth || 0) : 0;
        const diamond = academy ? (academy.gems.diamond || 0) : 0;

        // Check if exchange is possible
        const canExchange = fire >= 3 && water >= 3 && air >= 3 && earth >= 3;

        // Build the menu HTML
        let contentHTML = `
            <div style="padding: 0.85rem; color: #ddd; display: flex; flex-direction: column; gap: 0.6rem;">
                <div class="upgrade-category-header" style="padding: 0 0 0.6rem 0; color: #FFD700; font-weight: bold; border-bottom: 1px solid rgba(255, 215, 0, 0.3); margin: 0; font-size: 1.1rem; text-align: center;">
                    💎 Gem Exchange
                </div>

                <div style="background: rgba(0, 0, 0, 0.4); padding: 0.5rem; border-radius: 6px; border: 1px solid rgba(150, 150, 150, 0.2); text-align: center;">
                    <div style="font-size: 0.8rem; color: #bbb; margin-bottom: 0.4rem; letter-spacing: 0.5px;">Required Gems</div>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.3rem; font-size: 0.75rem;">
                        <div style="padding: 0.45rem 0.2rem; background: rgba(255, 100, 0, 0.35); border: 1px solid rgba(255, 100, 0, 0.5); border-radius: 4px; text-align: center;">
                            <div style="font-size: 1rem; margin-bottom: 0.2rem;">🔥</div>
                            <div style="color: ${fire >= 3 ? '#FFD700' : '#aaa'}; font-weight: bold; font-size: 0.9rem;">${fire}<span style="font-size: 0.75rem; color: #888;">/ 3</span></div>
                        </div>
                        <div style="padding: 0.45rem 0.2rem; background: rgba(100, 150, 255, 0.35); border: 1px solid rgba(100, 150, 255, 0.5); border-radius: 4px; text-align: center;">
                            <div style="font-size: 1rem; margin-bottom: 0.2rem;">💧</div>
                            <div style="color: ${water >= 3 ? '#FFD700' : '#aaa'}; font-weight: bold; font-size: 0.9rem;">${water}<span style="font-size: 0.75rem; color: #888;">/ 3</span></div>
                        </div>
                        <div style="padding: 0.45rem 0.2rem; background: rgba(200, 200, 255, 0.35); border: 1px solid rgba(200, 200, 255, 0.5); border-radius: 4px; text-align: center;">
                            <div style="font-size: 1rem; margin-bottom: 0.2rem;">💨</div>
                            <div style="color: ${air >= 3 ? '#FFD700' : '#aaa'}; font-weight: bold; font-size: 0.9rem;">${air}<span style="font-size: 0.75rem; color: #888;">/ 3</span></div>
                        </div>
                        <div style="padding: 0.45rem 0.2rem; background: rgba(100, 200, 100, 0.35); border: 1px solid rgba(100, 200, 100, 0.5); border-radius: 4px; text-align: center;">
                            <div style="font-size: 1rem; margin-bottom: 0.2rem;">🌍</div>
                            <div style="color: ${earth >= 3 ? '#FFD700' : '#aaa'}; font-weight: bold; font-size: 0.9rem;">${earth}<span style="font-size: 0.75rem; color: #888;">/ 3</span></div>
                        </div>
                    </div>
                </div>

                <div style="background: rgba(100, 200, 255, 0.25); padding: 0.5rem; border-radius: 6px; border: 1px solid rgba(100, 200, 255, 0.4); text-align: center;">
                    <div style="font-size: 0.8rem; color: #bbb; margin-bottom: 0.3rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Output</div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: #64dfff;">💎 ${diamond}</div>
                </div>

                <button id="exchange-gems-btn" class="upgrade-button panel-upgrade-btn" style="width: 100%; padding: 0.65rem; font-size: 0.95rem; font-weight: 600; margin: 0.2rem 0 0 0; ${!canExchange ? 'opacity: 0.5; cursor: not-allowed;' : ''}" ${!canExchange ? 'disabled' : ''}>
                    ${canExchange ? '⚙️ Exchange for Diamond' : '⛔ Need 3 of each gem'}
                </button>

                <div style="padding: 0.5rem 0; border-top: 1px solid rgba(255, 255, 255, 0.1); display: flex; gap: 0.4rem;">
                    <button class="upgrade-button sell-building-btn" style="background: rgba(255, 50, 50, 0.6); flex: 1; padding: 0.5rem; margin: 0; font-size: 0.9rem; font-weight: 600; border: 1px solid rgba(255, 50, 50, 0.4);">
                        💰 Sell
                    </button>
                </div>
            </div>
        `;

        // Update panel title and content
        const titleElement = panel.querySelector('.panel-title');
        if (titleElement) titleElement.textContent = '💎 Diamond Press';

        const contentContainer = panel.querySelector('#diamond-press-panel-content');
        if (contentContainer) {
            contentContainer.innerHTML = contentHTML;
        }

        // Setup button click handlers
        const exchangeBtn = panel.querySelector('#exchange-gems-btn');
        if (exchangeBtn && canExchange) {
            exchangeBtn.addEventListener('click', () => {
                if (academy && fire >= 3 && water >= 3 && air >= 3 && earth >= 3) {
                    // Deduct gems from academy
                    academy.gems.fire -= 3;
                    academy.gems.water -= 3;
                    academy.gems.air -= 3;
                    academy.gems.earth -= 3;

                    // Add diamond
                    academy.gems.diamond = (academy.gems.diamond || 0) + 1;

                    // Play sound effect
                    if (this.stateManager.audioManager) {
                        this.stateManager.audioManager.playSFX('upgrade');
                    }

                    // Show floating text on press
                    if (menuData.diamondPress) {
                        menuData.diamondPress.exchangeGems({ fire, water, air, earth });
                    }

                    // Update UI and menu
                    this.updateUI();
                    this.showDiamondPressMenu(menuData);
                }
            });
        }

        // Setup sell button
        const sellBtn = panel.querySelector('.sell-building-btn');
        if (sellBtn) {
            sellBtn.addEventListener('click', () => {
                this.towerManager.sellBuilding(menuData.diamondPress);
                this.updateUI();
                this.level.setPlacementPreview(0, 0, false);
                this.closePanelWithAnimation('diamond-press-panel');
            });
        }

        // Setup close button
        const closeBtn = panel.querySelector('.panel-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closePanelWithAnimation('diamond-press-panel'), { once: true });
        }

        // Show the panel
        panel.style.display = 'flex';
        panel.classList.remove('closing');
    }

    updateGoldMineTimerDisplay(goldMine) {
        // SIMPLE: Only update timer and progress bar values in the existing menu
        const panel = document.getElementById('goldmine-panel');
        if (!panel || panel.style.display === 'none') {

            return; // Menu not visible, nothing to update
        }



        // Calculate current values
        const progressPercent = (goldMine.currentProduction / goldMine.productionTime) * 100;
        const timeRemaining = Math.max(0, goldMine.productionTime - goldMine.currentProduction);
        const readyStatus = goldMine.goldReady ? '✅ READY' : `⏳ ${Math.ceil(timeRemaining)}s`;
        const readyColor = goldMine.goldReady ? '#4CAF50' : '#FFB800';

        // 1. Update progress bar
        const progressBar = panel.querySelector('#goldmine-progress-bar');
        if (progressBar) {
            progressBar.style.width = Math.min(100, progressPercent) + '%';

        } else {

        }

        // 2. Update timer text
        const timerDiv = panel.querySelector('#goldmine-timer');
        if (timerDiv) {
            timerDiv.textContent = readyStatus;
            timerDiv.style.color = readyColor;

        } else {

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
            
            // Get campaign progress from current save data
            const lastPlayedLevel = this.stateManager.currentSaveData?.lastPlayedLevel || 'level1';
            const unlockedLevels = this.stateManager.currentSaveData?.unlockedLevels || ['level1'];
            const completedLevels = this.stateManager.currentSaveData?.completedLevels || [];
            
            // Build save data - use new helper method to preserve commander name and campaign data
            const saveData = {
                playerGold: this.stateManager.playerGold || 0,
                playerInventory: this.stateManager.playerInventory || [],
                upgrades: this.stateManager.upgradeSystem ? this.stateManager.upgradeSystem.serialize() : { purchasedUpgrades: [] },
                marketplace: this.stateManager.marketplaceSystem ? this.stateManager.marketplaceSystem.serialize() : { consumables: {} },
                statistics: this.stateManager.gameStatistics ? this.stateManager.gameStatistics.serialize() : {},
                lastPlayedLevel: lastPlayedLevel,
                unlockedLevels: unlockedLevels,
                completedLevels: completedLevels,
                unlockSystem: unlockState
            };
            
            // Use new helper to save while preserving commander name and campaign progress
            SaveSystem.updateAndSaveSettlementData(this.stateManager.currentSaveSlot, saveData);
            
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
        
        // CRITICAL: Save settlement state before quitting (gold, inventory, marketplace, stats)
        if (this.gameplayState && this.stateManager.currentSaveSlot && this.stateManager.currentSaveData) {
            // Update settlement data with current level progress
            this.stateManager.currentSaveData.playerGold = this.stateManager.playerGold || 0;
            this.stateManager.currentSaveData.playerInventory = this.stateManager.playerInventory || [];
            
            // Save upgrades and marketplace with consumed items
            if (this.stateManager.upgradeSystem) {
                this.stateManager.currentSaveData.upgrades = this.stateManager.upgradeSystem.serialize();
            }
            if (this.stateManager.marketplaceSystem) {
                this.stateManager.currentSaveData.marketplace = this.stateManager.marketplaceSystem.serialize();
            }
            
            // Save statistics so far in this level
            if (this.stateManager.gameStatistics) {
                this.stateManager.currentSaveData.statistics = this.stateManager.gameStatistics.serialize();
            }
            
            // Save the quit state
            SaveSystem.updateAndSaveSettlementData(this.stateManager.currentSaveSlot, this.stateManager.currentSaveData);
        }
        
        // Unpause the game before quitting
        this.gameplayState.setPaused(false);
        
        // Small delay to ensure menu closes visually before state change
        setTimeout(() => {
            // Change to settlement state (this will also call GameplayState.exit())
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
