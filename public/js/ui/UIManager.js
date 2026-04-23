import { SaveSystem } from '../core/SaveSystem.js';
import { EnemyIntelRegistry } from '../core/EnemyIntelRegistry.js';
import { InputManager } from '../core/InputManager.js';
import { ControlsScreen } from './ControlsScreen.js';

export class UIManager {
    constructor(gameplayState) {
        this.gameplayState = gameplayState;
        this.towerManager = gameplayState.towerManager;
        this.gameState = gameplayState.gameState;
        this.stateManager = gameplayState.stateManager;
        this.level = gameplayState.level;
        this.activeMenu = null;
        this.currentForgeData = null;
        this.noTowerBuilding = false; // Set to true in realm level to hide all build buttons
        
        // Menu refresh tracking
        this.activeMenuType = null; // 'superweapon', 'academy', 'forge', etc.
        this.activeMenuData = null; // Data needed to re-render the menu
        this.lastGoldValue = 0;
        this.lastGemValues = { fire: 0, water: 0, air: 0, earth: 0, diamond: 0 };
        this.menuRefreshInterval = 0.1; // Refresh every 100ms to check resource changes
        this.menuRefreshTimer = 0;
        
        // Prevent browser context menus on all panels
        this.setupPanelContextMenuHandlers();
    }

    setupPanelContextMenuHandlers() {
        // Context menu prevention is handled globally in game.js
        // This is kept as a no-op for backwards compatibility
    }

    // ============ BUTTON STATE MANAGEMENT ============

    /**
     * Update the enabled/disabled state of all tower and building buttons
     * based on unlock status, resource availability, and build limits
     */
    updateButtonStates() {
        // In no-tower-building levels, keep all placement buttons hidden
        if (this.noTowerBuilding) {
            document.querySelectorAll('.tower-btn, .building-btn').forEach(btn => {
                btn.style.display = 'none';
                btn.disabled = true;
            });
            return;
        }
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

    /**
     * Add keyboard shortcut badges to tower and building buttons
     */
    updateHotkeyBadges() {
        const inputManager = this.stateManager.inputManager;
        if (!inputManager) return;

        // Update tower buttons
        document.querySelectorAll('.tower-btn').forEach(btn => {
            const towerType = btn.dataset.type;
            const action = 'tower_' + towerType;
            const key = inputManager.getBinding(action);
            let badge = btn.querySelector('.hotkey-badge');
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'hotkey-badge';
                btn.appendChild(badge);
            }
            badge.textContent = InputManager.getKeyDisplayName(key);
        });

        // Update building buttons
        document.querySelectorAll('.building-btn').forEach(btn => {
            const buildingType = btn.dataset.type;
            const action = 'building_' + buildingType;
            const key = inputManager.getBinding(action);
            let badge = btn.querySelector('.hotkey-badge');
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'hotkey-badge';
                btn.appendChild(badge);
            }
            badge.textContent = InputManager.getKeyDisplayName(key);
        });

        // Update spell buttons
        document.querySelectorAll('.spell-btn').forEach(btn => {
            const spellId = btn.dataset.spellId;
            const action = 'spell_' + spellId;
            const key = inputManager.getBinding(action);
            let badge = btn.querySelector('.hotkey-badge');
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'hotkey-badge';
                btn.appendChild(badge);
            }
            badge.textContent = InputManager.getKeyDisplayName(key);
        });
    }

    // ============ SETUP ============
    
    setupSpellUI() {
        // Spells are now integrated into the sidebar, no floating panel needed
        // Spell buttons will be created dynamically when super weapon lab is built
    }

    setupUIEventListeners() {
        // Track touch drag-and-drop state for mobile placement
        this._touchDragActive = false;
        this._touchDragType = null; // 'tower' or 'building'
        this._touchDragBtn = null;

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
                // Select the tower and start drag-and-drop mode
                this.selectTower(e.currentTarget);
                if (this.gameplayState.selectedTowerType) {
                    this._touchDragActive = true;
                    this._touchDragType = 'tower';
                    this._touchDragBtn = e.currentTarget;
                }
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
                // Select the building and start drag-and-drop mode
                this.selectBuilding(e.currentTarget);
                if (this.gameplayState.selectedBuildingType) {
                    this._touchDragActive = true;
                    this._touchDragType = 'building';
                    this._touchDragBtn = e.currentTarget;
                }
            });
        });

        // Global touch listeners for drag-and-drop placement across sidebar → canvas
        this._globalTouchMoveHandler = (e) => {
            if (!this._touchDragActive) return;
            e.preventDefault();
            const touch = e.touches[0];
            if (!touch) return;
            const canvas = document.getElementById('gameCanvas');
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (touch.clientX - rect.left) * scaleX;
            const y = (touch.clientY - rect.top) * scaleY;
            // Update placement preview on the canvas
            if (this.gameplayState && this.gameplayState.handleTouchMove) {
                this.gameplayState.handleTouchMove(x, y);
            }
        };
        this._globalTouchEndHandler = (e) => {
            if (!this._touchDragActive) return;
            this._touchDragActive = false;
            this._touchDragBtn = null;
            const touch = e.changedTouches[0];
            if (!touch) return;
            const canvas = document.getElementById('gameCanvas');
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            // Only place if finger ended over the canvas area
            if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const x = (touch.clientX - rect.left) * scaleX;
                const y = (touch.clientY - rect.top) * scaleY;
                if (this.gameplayState && this.gameplayState.handleClick) {
                    this.gameplayState.handleClick(x, y);
                }
            }
        };
        document.addEventListener('touchmove', this._globalTouchMoveHandler, { passive: false });
        document.addEventListener('touchend', this._globalTouchEndHandler, { passive: false });

        
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

        // Add hotkey badges to sidebar buttons
        this.updateHotkeyBadges();
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

        const quitCloseBtn = document.getElementById('quit-close-btn');
        if (quitCloseBtn) {
            quitCloseBtn.replaceWith(quitCloseBtn.cloneNode(true));
        }

        const restartCloseBtn = document.getElementById('restart-close-btn');
        if (restartCloseBtn) {
            restartCloseBtn.replaceWith(restartCloseBtn.cloneNode(true));
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

        // Trigger placement preview immediately at last known mouse position
        if (this.gameplayState.level) {
            this.gameplayState.refreshPlacementPreview();
        }
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

        // Trigger placement preview immediately at last known mouse position
        if (this.gameplayState.level) {
            this.gameplayState.refreshPlacementPreview();
        }
    }

    showTowerInfo(towerType) {
        const info = this.towerManager.getTowerInfo(towerType);
        if (!info) return;
        
        // Get the tower button
        const towerBtn = document.querySelector(`.tower-btn[data-type="${towerType}"]`);
        if (!towerBtn) return;
        
        // Clear existing menu
        this.clearTowerInfoMenu();
        
        // Build rich tooltip content based on tower type using computed upgraded stats
        let statsHTML = '';
        let specialHTML = '';
        let unlockHTML = '';
        
        // Get unlock system for requirement info
        const unlockSystem = this.towerManager.getUnlockSystem();
        const isUnlocked = unlockSystem.canBuildTower(towerType);
        
        // Use computed upgraded stats (numeric, accounts for all upgrades)
        const s = info.upgradedStats;
        
        // Helper to show stat with optional base comparison
        const statVal = (current, base, suffix = '') => {
            const cur = typeof current === 'number' ? Math.round(current) : current;
            const bas = typeof base === 'number' ? Math.round(base) : base;
            if (cur !== bas && bas > 0) {
                return `<span style="color: #FFD700;">${cur}${suffix}</span> <span style="color: #aaffaa; font-size: 0.7em;">(base: ${bas}${suffix})</span>`;
            }
            return `<span style="color: #FFD700;">${cur}${suffix}</span>`;
        };
        const statValDecimal = (current, base, suffix = '') => {
            const cur = typeof current === 'number' ? current.toFixed(1) : current;
            const bas = typeof base === 'number' ? base.toFixed(1) : base;
            if (cur !== bas && parseFloat(bas) > 0) {
                return `<span style="color: #FFD700;">${cur}${suffix}</span> <span style="color: #aaffaa; font-size: 0.7em;">(base: ${bas}${suffix})</span>`;
            }
            return `<span style="color: #FFD700;">${cur}${suffix}</span>`;
        };
        
        // Tower-specific detailed info
        switch (towerType) {
            case 'basic':
                statsHTML = `
                    <div><span>Damage:</span> ${statVal(s.damage, s.baseDamage)}</div>
                    <div><span>Range:</span> ${statVal(s.range, s.baseRange)}</div>
                    <div><span>Attack Speed:</span> ${statValDecimal(s.fireRate, s.baseFireRate, '/sec')}</div>
                `;
                specialHTML = '<div style="color: #aad4ff;">Reliable starter tower. Upgradeable at Tower Forge.</div>';
                break;
            case 'archer':
                statsHTML = `
                    <div><span>Damage:</span> ${statVal(s.damage, s.baseDamage)}</div>
                    <div><span>Range:</span> ${statVal(s.range, s.baseRange)}</div>
                    <div><span>Attack Speed:</span> ${statValDecimal(s.fireRate, s.baseFireRate, '/sec')}</div>
                    ${s.armorPiercing > 0 ? `<div><span>Armor Pierce:</span> <span style="color: #FFD700;">${s.armorPiercing}%</span></div>` : ''}
                `;
                specialHTML = '<div style="color: #aad4ff;">Fast-firing with long range. Gains armor piercing from Forge upgrades.</div>';
                if (!isUnlocked) unlockHTML = '<div style="color: #ff6b6b;">Requires: Tower Forge</div>';
                break;
            case 'cannon':
                statsHTML = `
                    <div><span>Damage:</span> ${statVal(s.damage, s.baseDamage)} <span style="color: #c9a876;">(AoE)</span></div>
                    <div><span>Blast Radius:</span> ${statVal(s.splashRadius, s.baseSplashRadius || 50, 'px')}</div>
                    <div><span>Range:</span> ${statVal(s.range, s.baseRange)}</div>
                    <div><span>Attack Speed:</span> ${statValDecimal(s.fireRate, s.baseFireRate, '/sec')}</div>
                `;
                specialHTML = '<div style="color: #aad4ff;">Area of effect damage. Blast radius upgradeable at Forge.</div>';
                if (!isUnlocked) unlockHTML = '<div style="color: #ff6b6b;">Requires: Forge Level 3</div>';
                break;
            case 'barricade':
                statsHTML = `
                    <div><span>Effect:</span> <span style="color: #FFD700;">Slows enemies</span></div>
                    <div><span>Range:</span> ${statVal(s.range, s.baseRange)}</div>
                    <div><span>Capacity:</span> ${statVal(s.capacity, s.baseCapacity, ' enemies')}</div>
                    <div><span>Duration:</span> ${statValDecimal(s.duration, s.baseDuration, 's')}</div>
                    <div><span>Deploy Rate:</span> ${statValDecimal(s.fireRate, s.baseFireRate, '/sec')}</div>
                `;
                specialHTML = '<div style="color: #aad4ff;">Rolls barrels creating rubble clouds that slow enemies. Capacity and duration upgrade at Forge.</div>';
                break;
            case 'poison':
                statsHTML = `
                    <div><span>Poison Damage:</span> ${statVal(s.poisonTickDamage || 13, s.basePoisonTickDamage || 13, ' /2s')} <span style="color:#aaffaa; font-size:0.7em;">(permanent)</span></div>
                    <div><span>Range:</span> ${statVal(s.range, s.baseRange)}</div>
                    <div><span>Attack Speed:</span> ${statValDecimal(s.fireRate, s.baseFireRate, '/sec')}</div>
                `;
                specialHTML = '<div style="color: #aad4ff;">Creates toxic clouds dealing damage over time. DoT upgradeable at Forge.</div>';
                if (!isUnlocked) unlockHTML = '<div style="color: #ff6b6b;">Requires: Forge Level 2</div>';
                break;
            case 'magic':
                statsHTML = `
                    <div><span>Damage:</span> ${statVal(s.damage, s.baseDamage)}</div>
                    <div><span>Range:</span> ${statVal(s.range, s.baseRange)}</div>
                    <div><span>Attack Speed:</span> ${statValDecimal(s.fireRate, s.baseFireRate, '/sec')}</div>
                `;
                specialHTML = '<div style="color: #aad4ff;">Select element: Fire, Water, Air, Earth. Bonuses from Magic Academy.</div>';
                if (!isUnlocked) unlockHTML = '<div style="color: #ff6b6b;">Requires: Magic Academy</div>';
                break;
            case 'guard-post':
                statsHTML = `
                    <div><span>Type:</span> <span style="color: #FFD700;">Path Defender</span></div>
                    <div><span>Hire Cost:</span> <span style="color: #FFD700;"><span class="coin-xs"></span>100</span></div>
                    <div><span>Respawn CD:</span> <span style="color: #FFD700;">10s</span></div>
                `;
                specialHTML = '<div style="color: #aad4ff;">Place on path to hire a defender that blocks and fights enemies. Defender levels upgrade at Training Grounds.</div>';
                if (!isUnlocked) unlockHTML = '<div style="color: #ff6b6b;">Requires: Forge Level 4</div>';
                break;
            case 'combination':
                statsHTML = `
                    <div><span>Damage:</span> ${statVal(s.damage, s.baseDamage)}</div>
                    <div><span>Range:</span> ${statVal(s.range, s.baseRange)}</div>
                    <div><span>Attack Speed:</span> ${statValDecimal(s.fireRate, s.baseFireRate, '/sec')}</div>
                `;
                specialHTML = '<div style="color: #aad4ff;">Casts powerful combination spells. Unlock spells by investing gems at the Magic Academy.</div>';
                if (!isUnlocked) unlockHTML = '<div style="color: #ff6b6b;">Requires: Super Weapon Lab</div>';
                break;
        }
        
        // Create hover menu
        const menu = document.createElement('div');
        menu.className = 'building-info-menu';
        menu.id = 'tower-info-hover';
        menu.innerHTML = `
            <div class="info-title">${info.icon || ''} ${info.name}</div>
            <div class="info-stats">
                ${statsHTML}
                <div style="border-top: 1px solid rgba(255, 215, 0, 0.2); padding-top: 0.3rem; margin-top: 0.2rem;">
                    <span>Cost:</span> <span style="color: #FFD700;"><span class="coin-xs"></span>${info.cost}</span>
                </div>
            </div>
            <div class="info-description">${info.description}</div>
            ${specialHTML ? `<div style="margin-top: 0.4rem; padding-top: 0.4rem; border-top: 1px solid rgba(255, 215, 0, 0.15); font-size: 0.78rem; line-height: 1.3;">${specialHTML}</div>` : ''}
            ${unlockHTML ? `<div style="margin-top: 0.4rem; padding-top: 0.4rem; border-top: 1px solid rgba(255, 100, 100, 0.3); font-size: 0.8rem;">${unlockHTML}</div>` : ''}
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
        
        // Get unlock system for requirement info
        const unlockSystem = this.towerManager.getUnlockSystem();
        
        // Build detailed stats and special info per building type
        let statsHTML = '';
        let specialHTML = '';
        let unlockHTML = '';
        let costString = `<span class="coin-xs"></span>${info.cost}`;
        
        switch (buildingType) {
            case 'forge':
                statsHTML = `
                    <div><span>Max Level:</span> <span style="color: #FFD700;">5</span></div>
                    <div><span>Size:</span> <span style="color: #FFD700;">${info.size}</span></div>
                    <div><span>Limit:</span> <span style="color: #FFD700;">1 per game</span></div>
                `;
                specialHTML = `<div style="color: #aad4ff;">
                    Core building that unlocks new towers and provides upgrade paths for all tower types.
                    Also increases Gold Mine income and unlocks buildings at higher levels.
                </div>`;
                if (unlockSystem.forgeCount >= unlockSystem.maxForges) {
                    unlockHTML = '<div style="color: #ff6b6b;">Already built (limit 1)</div>';
                }
                break;
            case 'mine':
                const incomeMultiplier = unlockSystem.getMineIncomeMultiplier();
                const maxMines = unlockSystem.getMaxMines();
                statsHTML = `
                    <div><span>Income (<span class="coin-xs"></span>):</span> <span style="color: #FFD700;">Gold every 30s</span></div>
                    <div><span>Forge Bonus:</span> <span style="color: #FFD700;">×${incomeMultiplier.toFixed(1)}</span></div>
                    <div><span>Size:</span> <span style="color: #FFD700;">${info.size}</span></div>
                    <div><span>Limit:</span> <span style="color: #FFD700;">${maxMines} (Forge Level ${unlockSystem.forgeLevel})</span></div>
                `;
                specialHTML = '<div style="color: #aad4ff;">Produces gold periodically. Click to collect. Higher Forge levels increase income and max mine count.</div>';
                if (!unlockSystem.unlockedBuildings.has('mine')) {
                    unlockHTML = '<div style="color: #ff6b6b;">Requires: Tower Forge</div>';
                } else if (unlockSystem.mineCount >= maxMines) {
                    unlockHTML = `<div style="color: #ff6b6b;">Max mines reached (${maxMines})</div>`;
                }
                break;
            case 'academy':
                statsHTML = `
                    <div><span>Max Level:</span> <span style="color: #FFD700;">3</span></div>
                    <div><span>Size:</span> <span style="color: #FFD700;">${info.size}</span></div>
                    <div><span>Limit:</span> <span style="color: #FFD700;">1 per game</span></div>
                `;
                specialHTML = `<div style="color: #aad4ff;">
                    Unlocks Magic Towers and elemental upgrades (Fire/Water/Air/Earth).
                    Higher levels unlock gem mining, combination spells, and the Super Weapon Lab.
                </div>`;
                if (!unlockSystem.unlockedBuildings.has('academy')) {
                    unlockHTML = '<div style="color: #ff6b6b;">Requires: Forge Level 4</div>';
                } else if (unlockSystem.academyCount >= 1) {
                    unlockHTML = '<div style="color: #ff6b6b;">Already built (limit 1)</div>';
                }
                break;
            case 'training':
                statsHTML = `
                    <div><span>Max Level:</span> <span style="color: #FFD700;">5</span></div>
                    <div><span>Size:</span> <span style="color: #FFD700;">${info.size}</span></div>
                    <div><span>Limit:</span> <span style="color: #FFD700;">1 per game</span></div>
                `;
                specialHTML = `<div style="color: #aad4ff;">
                    Provides range upgrades for Archer, Watch, and Trebuchet towers.
                    Also improves Barricade and Poison fire rates, and unlocks path defenders for Guard Posts.
                </div>`;
                if (!unlockSystem.unlockedBuildings.has('training')) {
                    unlockHTML = '<div style="color: #ff6b6b;">Requires: Forge Level 3</div>';
                } else if (unlockSystem.trainingGroundsCount >= 1) {
                    unlockHTML = '<div style="color: #ff6b6b;">Already built (limit 1)</div>';
                }
                break;
            case 'superweapon':
                costString = `<span class="coin-xs"></span>${info.cost}`;
                if (info.diamondCost) {
                    costString += ` + ◆${info.diamondCost}`;
                }
                statsHTML = `
                    <div><span>Max Level:</span> <span style="color: #FFD700;">4</span></div>
                    <div><span>Size:</span> <span style="color: #FFD700;">${info.size}</span></div>
                    <div><span>Limit:</span> <span style="color: #FFD700;">1 per game</span></div>
                `;
                specialHTML = `<div style="color: #aad4ff;">
                    Unlocks devastating area spells: Arcane Blast, Frost Nova, Inferno, Chain Lightning.
                    Higher levels unlock more spells and enable spell upgrades.
                </div>`;
                if (!unlockSystem.superweaponUnlocked) {
                    unlockHTML = '<div style="color: #ff6b6b;">Requires: Academy Level 3</div>';
                } else {
                    const academy = this.towerManager.buildingManager.buildings.find(b => b.constructor.name === 'MagicAcademy');
                    const diamondCount = academy ? (academy.gems.diamond || 0) : 0;
                    if (diamondCount < 5) {
                        unlockHTML = `<div style="color: #ff9999;">Requires 5 ◆ (have ${diamondCount})</div>`;
                    }
                }
                break;
            case 'diamond-press':
                statsHTML = `
                    <div><span>Exchange:</span> <span style="color: #FFD700;">3 of each gem → 1 ◆</span></div>
                    <div><span>Size:</span> <span style="color: #FFD700;">${info.size}</span></div>
                    <div><span>Limit:</span> <span style="color: #FFD700;">1 per game</span></div>
                `;
                specialHTML = '<div style="color: #aad4ff;">Converts elemental gems (Fire/Water/Air/Earth) into diamonds used for Super Weapon Lab upgrades and spell enhancements.</div>';
                if (!unlockSystem.unlockedBuildings.has('diamond-press')) {
                    unlockHTML = '<div style="color: #ff6b6b;">Requires: Super Weapon Lab Level 2</div>';
                } else if (unlockSystem.diamondPressCount >= 1) {
                    unlockHTML = '<div style="color: #ff6b6b;">Already built (limit 1)</div>';
                }
                break;
        }
        
        // Create hover menu
        const menu = document.createElement('div');
        menu.className = 'building-info-menu';
        menu.id = 'building-info-hover';
        menu.innerHTML = `
            <div class="info-title">${info.name}</div>
            <div class="info-stats">
                ${statsHTML}
                <div style="border-top: 1px solid rgba(255, 215, 0, 0.2); padding-top: 0.3rem; margin-top: 0.2rem;">
                    <span>Cost:</span> <span style="color: #FFD700;">${costString}</span>
                </div>
            </div>
            <div class="info-description">${info.description}</div>
            ${specialHTML ? `<div style="margin-top: 0.4rem; padding-top: 0.4rem; border-top: 1px solid rgba(255, 215, 0, 0.15); font-size: 0.78rem; line-height: 1.3;">${specialHTML}</div>` : ''}
            ${unlockHTML ? `<div style="margin-top: 0.4rem; padding-top: 0.4rem; border-top: 1px solid rgba(255, 100, 100, 0.3); font-size: 0.8rem;">${unlockHTML}</div>` : ''}
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

    showSpellInfo(spell, btn) {
        this.clearSpellInfoMenu();

        // Build stats HTML per spell type
        let statsHTML = '';
        const inputManager = this.stateManager.inputManager;

        switch (spell.id) {
            case 'arcaneBlast':
                statsHTML = `
                    <div><span>Damage:</span> <span style="color: #FFD700;">${spell.damage}</span></div>
                    <div><span>Radius:</span> <span style="color: #FFD700;">${spell.radius}</span></div>
                    <div><span>Cooldown:</span> <span style="color: #FFD700;">${spell.cooldown}s</span></div>
                `;
                break;
            case 'frostNova':
                statsHTML = `
                    <div><span>Damage:</span> <span style="color: #FFD700;">${spell.damage}</span></div>
                    <div><span>Freeze:</span> <span style="color: #FFD700;">${spell.freezeDuration}s</span></div>
                    <div><span>Radius:</span> <span style="color: #FFD700;">${spell.radius}</span></div>
                    <div><span>Cooldown:</span> <span style="color: #FFD700;">${spell.cooldown}s</span></div>
                `;
                break;
            case 'meteorStrike':
                statsHTML = `
                    <div><span>Damage:</span> <span style="color: #FFD700;">${spell.damage}</span></div>
                    <div><span>Burn:</span> <span style="color: #FFD700;">${spell.burnDamage}/s for ${spell.burnDuration}s</span></div>
                    <div><span>Cooldown:</span> <span style="color: #FFD700;">${spell.cooldown}s</span></div>
                `;
                break;
            case 'chainLightning':
                statsHTML = `
                    <div><span>Damage:</span> <span style="color: #FFD700;">${spell.damage}</span></div>
                    <div><span>Chains:</span> <span style="color: #FFD700;">${spell.chainCount} targets</span></div>
                    <div><span>Cooldown:</span> <span style="color: #FFD700;">${spell.cooldown}s</span></div>
                `;
                break;
        }

        // Add upgrade level if upgraded
        if (spell.upgradeLevel > 0) {
            statsHTML += `<div><span>Upgrade:</span> <span style="color: #A855F7;">Level ${spell.upgradeLevel}</span></div>`;
        }

        // Show keyboard shortcut if bound
        let hotkeyHTML = '';
        if (inputManager) {
            const key = inputManager.getBinding('spell_' + spell.id);
            if (key) {
                const keyName = inputManager.constructor.getKeyDisplayName(key);
                hotkeyHTML = `<div style="margin-top: 0.3rem; color: #A855F7; font-size: 0.75rem;">Hotkey: <span style="color: #FFD700;">${keyName}</span></div>`;
            }
        }

        // Cooldown status
        let statusHTML = '';
        if (spell.currentCooldown > 0) {
            statusHTML = `<div style="margin-top: 0.3rem; color: #ff6b6b; font-size: 0.8rem;">Cooldown: ${Math.ceil(spell.currentCooldown)}s</div>`;
        } else {
            statusHTML = `<div style="margin-top: 0.3rem; color: #7dff7d; font-size: 0.8rem;">Ready</div>`;
        }

        const menu = document.createElement('div');
        menu.className = 'building-info-menu';
        menu.id = 'spell-info-hover';
        menu.innerHTML = `
            <div class="info-title">${spell.name}</div>
            <div class="info-stats">
                ${statsHTML}
            </div>
            <div class="info-description">${spell.description}</div>
            ${statusHTML}
            ${hotkeyHTML}
        `;

        document.body.appendChild(menu);

        // Position to the left of the button
        const btnRect = btn.getBoundingClientRect();
        const menuWidth = menu.offsetWidth;

        let left = btnRect.left - menuWidth - 10;
        let top = btnRect.top;

        if (left < 10) {
            left = btnRect.right + 10;
        }
        if (top + menu.offsetHeight > window.innerHeight) {
            top = window.innerHeight - menu.offsetHeight - 10;
        }

        menu.style.left = left + 'px';
        menu.style.top = top + 'px';

        btn.addEventListener('mouseleave', () => {
            this.clearSpellInfoMenu();
        }, { once: true });
    }

    clearSpellInfoMenu() {
        const existingMenu = document.getElementById('spell-info-hover');
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
                btn.innerHTML = `<span>${spell.icon}</span>`;
                
                // Add hover info panel (same style as tower/building info)
                btn.addEventListener('mouseenter', () => {
                    this.showSpellInfo(spell, btn);
                });
                
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
                    }
                });
                
                spellButtonsList.appendChild(btn);
            });
            
            // Clear the force rebuild flag after rebuilding
            this.forceSpellUIRebuild = false;
            // Refresh hotkey badges now that buttons exist in the DOM
            this.updateHotkeyBadges();
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
        // In no-tower-building levels, keep all placement buttons hidden
        if (this.noTowerBuilding) {
            document.querySelectorAll('.tower-btn, .building-btn').forEach(btn => {
                btn.style.display = 'none';
                btn.disabled = true;
            });
            // Still update spell button visibility below
        }

        const unlockSystem = this.towerManager.getUnlockSystem();

        if (!this.noTowerBuilding) {
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
        }); // end building-btn loop
        } // end if (!this.noTowerBuilding)
        
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

    hideAllPlacementButtons() {
        this.noTowerBuilding = true;
        document.querySelectorAll('.tower-btn, .building-btn').forEach(btn => {
            btn.style.display = 'none';
            btn.disabled = true;
        });
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
     * Update active menu based on resource changes and live timers (called from GameplayState update loop)
     * Uses surgical DOM updates to avoid destroying event listeners or causing flicker.
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
            return;
        }

        // Guard post needs constant refresh for cooldown timer and defender HP
        if (this.activeMenuType === 'guard-post') {
            this.updateGuardPostLive();
            return;
        }

        // Castle needs constant refresh for defender cooldown/HP
        if (this.activeMenuType === 'castle') {
            this.updateCastleLive();
            return;
        }

        // Enemy intel panel needs live stat refresh
        if (this.activeMenuType === 'enemy-intel') {
            this.updateEnemyIntelLive();
            return;
        }

        // For all other menus, only update button affordability when resources change
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

        // Surgically update button states without recreating the DOM
        this.updateMenuButtonAffordability();
    }

    /**
     * Surgically update button disabled/enabled states and cost display classes
     * without recreating the entire menu DOM (prevents flicker and keeps event listeners alive).
     */
    updateMenuButtonAffordability() {
        const currentGold = this.gameState.gold;
        const currentGems = this.towerManager.getGemStocks();

        // Update compact upgrade buttons (forge, academy, training tower upgrades)
        document.querySelectorAll('.compact-upgrade-btn').forEach(btn => {
            if (btn.textContent.trim() === 'MAX' || btn.textContent.trim() === 'max') return;
            const costMatch = btn.textContent.match(/(\d+)/);
            if (!costMatch) return;
            const cost = parseInt(costMatch[1]);

            // Determine gem type - prefer data-upgrade attribute (set on button), fall back to icon emoji
            const item = btn.closest('.compact-upgrade-item');
            const upgradeId = btn.dataset.upgrade || item?.dataset?.upgradeId;
            const gemTypes = ['fire', 'water', 'air', 'earth'];

            let isGemCost = gemTypes.includes(upgradeId);
            let gemType = isGemCost ? upgradeId : null;

            // Fallback: check icon emoji for any remaining emoji-based icons
            if (!isGemCost) {
                const icon = item?.querySelector('.compact-upgrade-icon');
                const iconText = icon?.textContent.trim();
                const gemMap = { '🔥': 'fire', '💧': 'water', '💨': 'air', '🌍': 'earth' };
                if (iconText && gemMap[iconText]) {
                    isGemCost = true;
                    gemType = gemMap[iconText];
                }
            }

            let canAfford = false;
            if (isGemCost && gemType) {
                canAfford = (currentGems[gemType] || 0) >= cost;
            } else {
                canAfford = currentGold >= cost;
            }

            if (btn.disabled && canAfford) {
                btn.disabled = false;
            } else if (!btn.disabled && !canAfford) {
                btn.disabled = true;
            }
        });

        // Update panel upgrade buttons (castle, guard-post hire, etc.)
        document.querySelectorAll('.panel-upgrade-btn, .upgrade-button').forEach(btn => {
            if (btn.classList.contains('compact-upgrade-btn')) return; // Already handled above
            if (btn.textContent.includes('MAX') || btn.classList.contains('sell-building-btn') || btn.classList.contains('sell-tower-btn')) return;

            const actionRow = btn.closest('.upgrade-action-row') || btn.closest('.panel-upgrade-item');
            if (!actionRow) return;

            const costDisplay = actionRow.querySelector('.upgrade-cost-display');
            if (!costDisplay) return;

            const costText = costDisplay.textContent;
            const costMatch = costText.match(/(\d+)/);
            if (!costMatch) return;
            const cost = parseInt(costMatch[1]);

            // Check if gem cost or gold cost
            const isGemCost = costText.includes('🔥') || costText.includes('💧') || costText.includes('💨') || costText.includes('🌍') || costText.includes('💎') || costText.includes('◆');
            let canAfford = false;
            if (isGemCost) {
                // For diamond costs, check diamond stock
                if (costText.includes('💎') || costText.includes('◆')) {
                    canAfford = (currentGems.diamond || 0) >= cost;
                } else {
                    canAfford = currentGold >= cost; // Fallback
                }
            } else {
                canAfford = currentGold >= cost;
            }

            if (btn.disabled && canAfford) {
                btn.disabled = false;
                costDisplay.classList.add('affordable');
                costDisplay.classList.remove('unaffordable');
            } else if (!btn.disabled && !canAfford) {
                btn.disabled = true;
                costDisplay.classList.remove('affordable');
            }
        });

        // Update forge/academy/training/superweapon level upgrade buttons
        document.querySelectorAll('.forge-level-upgrade-btn').forEach(btn => {
            if (btn.textContent.includes('MAX')) return;
            const costEl = btn.querySelector('.btn-cost');
            if (!costEl) return;
            const costMatch = costEl.textContent.match(/(\d+)/);
            if (!costMatch) return;
            const cost = parseInt(costMatch[1]);

            // Check if it also needs diamonds (superweapon lab)
            const needsDiamonds = costEl.textContent.includes('◆') || costEl.textContent.includes('💎');
            let canAfford = currentGold >= cost;
            if (needsDiamonds) {
                const diamondMatch = costEl.textContent.match(/[◆💎]\s*(\d+)/);
                if (diamondMatch) {
                    canAfford = canAfford && (currentGems.diamond || 0) >= parseInt(diamondMatch[1]);
                }
            }

            if (btn.disabled && canAfford) {
                btn.disabled = false;
            } else if (!btn.disabled && !canAfford) {
                btn.disabled = true;
            }
        });

        // Update diamond press exchange button
        if (this.activeMenuType === 'diamond-press') {
            const exchangeBtn = document.getElementById('exchange-gems-btn');
            if (exchangeBtn) {
                const canExchange = (currentGems.fire || 0) >= 3 && (currentGems.water || 0) >= 3 &&
                                    (currentGems.air || 0) >= 3 && (currentGems.earth || 0) >= 3;
                if (exchangeBtn.disabled && canExchange) {
                    exchangeBtn.disabled = false;
                    exchangeBtn.textContent = 'Exchange for Diamond';
                    exchangeBtn.style.opacity = '1';
                    exchangeBtn.style.cursor = '';
                } else if (!exchangeBtn.disabled && !canExchange) {
                    exchangeBtn.disabled = true;
                    exchangeBtn.textContent = 'Need 3 of each gem';
                    exchangeBtn.style.opacity = '0.5';
                    exchangeBtn.style.cursor = 'not-allowed';
                }
            }
        }
    }

    /**
     * Live update guard post menu - update cooldown timer and defender HP without re-rendering.
     * Only does a full re-render when state transitions (e.g. cooldown finishes, defender dies).
     */
    updateGuardPostLive() {
        const data = this.activeMenuData;
        if (!data || !data.tower) return;
        const tower = data.tower;

        // Detect state transitions that need a full re-render
        const hasDefender = tower.defender && !tower.defender.isDead();
        const hasCooldown = !hasDefender && tower.defenderDeadCooldown > 0;
        const canHire = !hasDefender && !hasCooldown;

        const currentState = hasDefender ? 'active' : (hasCooldown ? 'cooldown' : 'hire');
        if (this._guardPostState !== currentState) {
            this._guardPostState = currentState;
            this.showGuardPostMenu(data);
            return;
        }

        // Surgical updates within current state
        const gpPanel = document.getElementById('basic-tower-panel');
        if (!gpPanel) return;

        if (hasCooldown) {
            const costDisplay = gpPanel.querySelector('.upgrade-cost-display');
            if (costDisplay && costDisplay.style.color === 'rgb(255, 153, 153)') {
                costDisplay.textContent = tower.defenderDeadCooldown.toFixed(1) + 's';
            }
        } else if (hasDefender) {
            const costDisplay = gpPanel.querySelector('#guard-post-defender-hp');
            if (costDisplay) {
                costDisplay.textContent = `${Math.round(tower.defender.health)}/${Math.round(tower.defender.maxHealth)} HP`;
            }
        } else if (canHire) {
            // Update hire button affordability
            this.updateMenuButtonAffordability();
        }
    }

    /**
     * Live update castle menu - update defender section and upgrade affordability without re-rendering.
     * Only does a full re-render when defender state transitions.
     */
    updateCastleLive() {
        const data = this.activeMenuData;
        if (!data || !data.castle) return;
        const castle = data.castle;

        // Check if defender state has changed (needs full re-render)
        const hasDefender = castle.defender && !castle.defender.isDead();
        const hasCooldown = castle.defenderDeadCooldown > 0;
        const currentState = hasDefender ? 'active' : (hasCooldown ? 'cooldown' : 'hire');
        if (this._castleDefenderState !== currentState) {
            this._castleDefenderState = currentState;
            this.showCastleUpgradeMenu(data);
            return;
        }

        // Update castle health display
        const panel = document.getElementById('castle-panel');
        if (panel) {
            const healthBar = panel.querySelector('#castle-hp-bar');
            const healthText = panel.querySelector('#castle-hp-text');
            if (healthBar && healthText) {
                const pct = (castle.health / castle.maxHealth) * 100;
                healthBar.style.width = pct + '%';
                healthText.textContent = `${Math.round(castle.health)}/${Math.round(castle.maxHealth)} HP`;
            }
        }

        // Update button affordability
        this.updateMenuButtonAffordability();
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
                effectsList.push(`Basic: +${forge.upgrades.basic.level * 8}`);
            }
            
            if (forge.upgrades.archer.level > 0) {
                effectsList.push(`Archer: +${forge.upgrades.archer.level * 8}`);
            }
            
            if (forge.upgrades.barricade_effectiveness.level > 0) {
                const capEffect = forge.upgrades.barricade_effectiveness.effect.capacity;
                const durEffect = forge.upgrades.barricade_effectiveness.effect.duration;
                const capacity = 4 + Math.round(forge.upgrades.barricade_effectiveness.level * capEffect);
                const duration = 4 + forge.upgrades.barricade_effectiveness.level * durEffect;
                effectsList.push(`Barricade: ${capacity} (${duration.toFixed(1)}s)`);
            }
            
            if (forge.forgeLevel >= 2 && forge.upgrades.poison.level > 0) {
                let poisonDamage = 0;
                const poisonEffects = [5, 5, 5, 5, 5];
                for (let i = 0; i < forge.upgrades.poison.level && i < poisonEffects.length; i++) {
                    poisonDamage += poisonEffects[i];
                }
                effectsList.push(`Poison: +${poisonDamage}`);
            }
            
            if (forge.forgeLevel >= 3 && forge.upgrades.cannon.level > 0) {
                effectsList.push(`Trebuchet: +${forge.upgrades.cannon.level * 25}`);
            }
            
            // Calculate forge-level benefits (matches UnlockSystem.getMaxMines() logic)
            const goldMineCount = forge.forgeLevel >= 5 ? 3 : (forge.forgeLevel >= 3 ? 2 : 1);
            const incomeMultiplier = forge.getMineIncomeMultiplier();
            
            contentHTML += `
                <div class="forge-panel-header">
                    <div class="forge-header-top">
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 0.3rem;">
                            <div class="forge-icon-display"><img src="assets/buildings/forge.png" alt="Tower Forge" style="width: 100%; height: 100%; object-fit: contain;"></div>
                            <button class="upgrade-button sell-building-btn" data-building-id="forge" style="background: #ff4444; padding: 0.2rem 0.5rem; margin: 0; font-size: 0.7rem; font-weight: 600; border: 1px solid rgba(255, 68, 68, 0.4); width: 100%; max-width: 80px;">
                                Sell
                            </button>
                        </div>
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
                                <div class="forge-benefit-item">
                                    <span class="forge-benefit-label">Fortification:</span>
                                    <span class="forge-benefit-value">Max Level ${forge.forgeLevel >= 5 ? 3 : (forge.forgeLevel >= 3 ? 2 : (forge.forgeLevel >= 2 ? 1 : 0))}/3</span>
                                </div>
                                ${forge.forgeLevel >= 4 ? `<div class="forge-benefit-item">
                                    <span class="forge-benefit-label">Magic Academy:</span>
                                    <span class="forge-benefit-value">Unlocked</span>
                                </div>` : ''}
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
                            <span class="btn-cost">${isMaxed ? 'LV ' + forge.forgeLevel : (forgeUpgrade && forgeUpgrade.cost ? '<span class="coin-xs"></span> ' + forgeUpgrade.cost : '—')}</span>
                        </div>
                    </button>
                </div>
            `;
        }
        
        // BUILD TOWER UPGRADES SECTION - Compact list
        if (forgeData.upgrades && forgeData.upgrades.length > 0) {
            contentHTML += `<div class="upgrade-category compact-upgrades">
                <div class="upgrade-category-header">TOWER ENHANCEMENTS</div>`;
            
            // Define base tower stats
            const baseTowerStats = {
                'basic': { damage: 20 },
                'archer': { damage: 35 },
                'barricade_effectiveness': { capacity: 4 },
                'poison': { damage: 13 },
                'cannon': { damage: 100, radius: 50 },

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
                    const capEffect = forge.upgrades.barricade_effectiveness.effect.capacity;
                    const durEffect = forge.upgrades.barricade_effectiveness.effect.duration;
                    const currentCapacity = baseCapacity + Math.round(forge.upgrades.barricade_effectiveness.level * capEffect);
                    const nextCapacity = baseCapacity + Math.round((forge.upgrades.barricade_effectiveness.level + 1) * capEffect);
                    const baseDuration = 4; // Base slow duration in seconds
                    const currentDuration = baseDuration + forge.upgrades.barricade_effectiveness.level * durEffect;
                    const nextDuration = baseDuration + (forge.upgrades.barricade_effectiveness.level + 1) * durEffect;
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
                    const currentDmgBonus = forge.upgrades.cannon.level * 25;
                    const nextDmgBonus = (forge.upgrades.cannon.level + 1) * 25;
                    const currentRadius = baseRadius + (forge.upgrades.cannon.level * 5);
                    const nextRadius = baseRadius + ((forge.upgrades.cannon.level + 1) * 5);
                    currentValue = `${baseDmg + currentDmgBonus} (R${currentRadius})`;
                    nextValue = `${baseDmg + nextDmgBonus} (R${nextRadius})`;
                    upgrade.name = 'Trebuchet Tower Upgrade';
                }
                
                // Build detailed tooltip for hover info (SuperWeaponLab style)
                let tooltipText = `<div style="font-weight: bold; margin-bottom: 0.3rem;">${upgrade.name}</div>`;
                tooltipText += `<div style="font-size: 0.75rem; color: #ddd; margin-bottom: 0.4rem;">${upgrade.description}</div>`;
                tooltipText += `<div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 0.3rem; font-size: 0.75rem;">`;
                tooltipText += `<div>Level: <span style="color: #FFD700;">${upgrade.level}/${upgrade.maxLevel}</span></div>`;
                
                if (upgrade.id === 'basic') {
                    const baseDmg = baseTowerStats.basic.damage;
                    const curBonus = forge.upgrades.basic.level * 8;
                    tooltipText += `<div>❖ Damage: <span style="color: #FFD700;">${baseDmg + curBonus}</span></div>`;
                } else if (upgrade.id === 'archer') {
                    const baseDmg = baseTowerStats.archer.damage;
                    const curDmg = forge.upgrades.archer.level * 8;
                    const curPierce = forge.upgrades.archer.level * 5;
                    tooltipText += `<div>❖ Damage: <span style="color: #FFD700;">${baseDmg + curDmg}</span></div>`;
                    tooltipText += `<div>Armor Pierce: <span style="color: #FFD700;">${curPierce}%</span></div>`;
                } else if (upgrade.id === 'barricade_effectiveness') {
                    const capEffect = forge.upgrades.barricade_effectiveness.effect.capacity;
                    const durEffect = forge.upgrades.barricade_effectiveness.effect.duration;
                    const curCap = baseTowerStats.barricade_effectiveness.capacity + Math.round(forge.upgrades.barricade_effectiveness.level * capEffect);
                    const curDur = 4 + forge.upgrades.barricade_effectiveness.level * durEffect;
                    tooltipText += `<div>Enemies Slowed: <span style="color: #FFD700;">${curCap}</span></div>`;
                    tooltipText += `<div>Slow Duration: <span style="color: #FFD700;">${curDur.toFixed(1)}s</span></div>`;
                } else if (upgrade.id === 'poison') {
                    const baseDmg = baseTowerStats.poison.damage;
                    const curBonus = this.calculatePoisonBonus(forge.upgrades.poison.level);
                    tooltipText += `<div>❖ Damage: <span style="color: #FFD700;">${baseDmg + curBonus}</span></div>`;
                } else if (upgrade.id === 'cannon') {
                    const baseDmg = baseTowerStats.cannon.damage;
                    const baseRad = baseTowerStats.cannon.radius;
                    const curDmg = forge.upgrades.cannon.level * 25;
                    const curRad = forge.upgrades.cannon.level * 5;
                    tooltipText += `<div>❖ Damage: <span style="color: #FFD700;">${baseDmg + curDmg}</span></div>`;
                    tooltipText += `<div>◯ Blast Radius: <span style="color: #FFD700;">${baseRad + curRad}px</span></div>`;
                }
                
                if (!isMaxed) {
                    tooltipText += `<div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 0.3rem; margin-top: 0.3rem; color: #aaffaa;">`;
                    tooltipText += `<div style="font-weight: bold;">Next Upgrade (+1):</div>`;
                    if (upgrade.id === 'basic') {
                        tooltipText += `<div>Damage: +8</div>`;
                    } else if (upgrade.id === 'archer') {
                        tooltipText += `<div>Damage: +8</div>`;
                        tooltipText += `<div>Armor Pierce: +5%</div>`;
                    } else if (upgrade.id === 'barricade_effectiveness') {
                        const capEff = forge.upgrades.barricade_effectiveness.effect.capacity;
                        const durEff = forge.upgrades.barricade_effectiveness.effect.duration;
                        tooltipText += `<div>Enemies Slowed: +${capEff.toFixed(1)} (~${Math.round(capEff)})</div>`;
                        tooltipText += `<div>Slow Duration: +${durEff.toFixed(1)}s</div>`;
                    } else if (upgrade.id === 'poison') {
                        tooltipText += `<div>Damage: +5</div>`;
                    } else if (upgrade.id === 'cannon') {
                        tooltipText += `<div>Damage: +25</div>`;
                        tooltipText += `<div>Blast Radius: +5px</div>`;
                    }
                    if (upgrade.cost) tooltipText += `<div>Cost: <span style="color: #FFD700;"><span class="coin-xs"></span>${upgrade.cost}</span></div>`;
                    tooltipText += `</div>`;
                }
                tooltipText += `</div>`;
                
                contentHTML += `
                    <div class="compact-upgrade-item ${isMaxed ? 'maxed' : ''}" data-upgrade-id="${upgrade.id}" data-tooltip="${tooltipText.replace(/"/g, '&quot;')}">
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
                            ${isMaxed ? 'MAX' : (upgrade.cost ? `<span class="coin-xs"></span>${upgrade.cost}` : '—')}
                        </button>
                    </div>
                `;
            });
            
            contentHTML += `</div>`;
        }
        
        // Update container
        upgradesContainer.innerHTML = contentHTML;
        
        // Show the panel with animation
        panel.style.display = 'flex';
        panel.classList.remove('closing');
        
        // Setup event listeners
        this.setupForgePanelListeners(forgeData, unlockSystem);
    }

    calculatePoisonBonus(level) {
        const poisonEffects = [5, 5, 5, 5, 5];
        let total = 0;
        for (let i = 0; i < level && i < poisonEffects.length; i++) {
            total += poisonEffects[i];
        }
        return total;
    }

    /**
     * Returns inline HTML for a CSS-styled elemental gem (matches topbar gem style).
     * @param {string} element - 'fire','water','air','earth','diamond'
     * @param {string} size - CSS size string, default '14px'
     */
    getElementGemHTML(element, size = '14px') {
        const gemClasses = {
            fire: 'fire-gem',
            water: 'water-gem',
            air: 'air-gem',
            earth: 'earth-gem',
            diamond: 'diamond-gem'
        };
        const gemClass = gemClasses[element];
        if (!gemClass) return '';
        return `<div class="gem ${gemClass}" style="width:${size};height:${size};display:inline-block;flex-shrink:0;vertical-align:middle;margin:0 2px;"></div>`;
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
                        
                        this.updateUI();
                        
                        // Refresh the panel (with skipSFX flag to prevent building sound from playing)
                        this.showForgeUpgradeMenu({
                            type: 'forge_menu',
                            forge: forgeData.forge,
                            upgrades: forgeData.forge.getUpgradeOptions(),
                            forgeUpgrade: forgeData.forge.getForgeUpgradeOption(),
                            skipSFX: true
                        });
                    }
                }
            });
        });
        
        // Upgrade hover info listeners (SuperWeaponLab style)
        panel.querySelectorAll('.compact-upgrade-item').forEach(item => {
            let tooltipTimeout;
            
            item.addEventListener('mouseenter', () => {
                clearTimeout(tooltipTimeout);
                
                const existingTooltips = document.querySelectorAll('[data-panel-tooltip]');
                existingTooltips.forEach(tooltip => tooltip.remove());
                
                const tooltipHTML = item.dataset.tooltip;
                if (!tooltipHTML) return;
                
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
                    pointer-events: none;
                `;
                
                document.body.appendChild(tooltip);
                
                const panelEl = document.getElementById('forge-panel');
                const panelRect = panelEl.getBoundingClientRect();
                const rect = item.getBoundingClientRect();
                
                let leftPos = panelRect.left - tooltip.offsetWidth - 10;
                if (leftPos < 10) {
                    leftPos = rect.right + 10;
                }
                
                tooltip.style.left = leftPos + 'px';
                tooltip.style.top = (rect.top - tooltip.offsetHeight / 2 + rect.height / 2) + 'px';
                
                const tooltipRect = tooltip.getBoundingClientRect();
                if (tooltipRect.bottom > window.innerHeight) {
                    tooltip.style.top = (window.innerHeight - tooltip.offsetHeight - 10) + 'px';
                }
                if (tooltipRect.top < 0) {
                    tooltip.style.top = '10px';
                }
            });
            
            item.addEventListener('mouseleave', () => {
                const activeTooltips = document.querySelectorAll('[data-panel-tooltip]');
                activeTooltips.forEach(tooltip => tooltip.remove());
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
            'diamond-press-panel',
            'enemy-intel-panel'
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
            'diamond-press-panel',
            'enemy-intel-panel'
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
        const academy = academyData.academy;
        const academyUpgrade = academy.getAcademyUpgradeOption();
        
        // BUILD ACADEMY HEADER SECTION - Like forge header
        const isMaxed = academy.academyLevel >= academy.maxAcademyLevel;
        const canAfford = academyUpgrade && academyUpgrade.cost && this.gameState.gold >= academyUpgrade.cost;
        
        // Calculate academy effects badges
        const effectsList = [];
        if (academy.elementalUpgrades.fire.level > 0) {
            effectsList.push(`${this.getElementGemHTML('fire')} Fire: +${academy.elementalUpgrades.fire.level * academy.elementalUpgrades.fire.damageBonus}`);
        }
        if (academy.elementalUpgrades.water.level > 0) {
            effectsList.push(`${this.getElementGemHTML('water')} Water: +${(academy.elementalUpgrades.water.level * academy.elementalUpgrades.water.slowBonus * 100).toFixed(0)}%`);
        }
        if (academy.elementalUpgrades.air.level > 0) {
            effectsList.push(`${this.getElementGemHTML('air')} Air: +${academy.elementalUpgrades.air.level * academy.elementalUpgrades.air.chainRange}px`);
        }
        if (academy.elementalUpgrades.earth.level > 0) {
            effectsList.push(`${this.getElementGemHTML('earth')} Earth: +${academy.elementalUpgrades.earth.level * academy.elementalUpgrades.earth.armorPiercing}`);
        }
        
        // Build header with prominent academy upgrade button
        contentHTML += `
            <div class="forge-panel-header">
                <div class="forge-header-top">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 0.3rem;">
                        <div class="forge-icon-display"><img src="assets/buildings/academy.png" alt="Magic Academy" style="width: 100%; height: 100%; object-fit: contain;"></div>
                        <button class="upgrade-button sell-building-btn" data-building-id="academy" style="background: #ff4444; padding: 0.2rem 0.5rem; margin: 0; font-size: 0.7rem; font-weight: 600; border: 1px solid rgba(255, 68, 68, 0.4); width: 100%; max-width: 80px;">
                            Sell
                        </button>
                    </div>
                    <div class="forge-info-wrapper">
                        <div class="forge-title-row">
                            <div class="forge-name">Magic Academy</div>
                            <div class="forge-level-badge">Level ${academy.academyLevel}/${academy.maxAcademyLevel}</div>
                        </div>
                        <div class="forge-level-bar">
                            <div class="forge-level-bar-fill" style="width: ${(academy.academyLevel / academy.maxAcademyLevel) * 100}%"></div>
                        </div>
                        <div class="forge-effects-row">
                            ${effectsList.map(effect => `<span class="effect-badge">${effect}</span>`).join('')}
                        </div>
                        <div class="forge-benefits-list">
                            <div class="forge-benefit-item">
                                <span class="forge-benefit-label">Gem Mining:</span>
                                <span class="forge-benefit-value">Unlocked</span>
                            </div>
                            ${academy.academyLevel >= 3 ? `<div class="forge-benefit-item">
                                <span class="forge-benefit-label">Super Weapon Lab:</span>
                                <span class="forge-benefit-value">Available</span>
                            </div>` : ''}
                        </div>
                    </div>
                </div>
                <button class="forge-upgrade-btn forge-level-upgrade-btn panel-upgrade-btn ${isMaxed ? 'maxed' : ''}" 
                        data-upgrade="academy_upgrade" 
                        data-forge-level="true"
                        ${!isMaxed && !canAfford ? 'disabled' : ''}
                        ${isMaxed ? 'disabled' : ''}>
                    <div class="forge-upgrade-btn-content">
                        ${isMaxed ? '<span class="max-level-text">MAX LEVEL REACHED</span>' : '<span class="btn-label">ACADEMY UPGRADE</span>'}
                        <span class="btn-cost">${isMaxed ? 'LV ' + academy.academyLevel : (academyUpgrade && academyUpgrade.cost ? '<span class="coin-xs"></span> ' + academyUpgrade.cost : '—')}</span>
                    </div>
                </button>
            </div>
        `;
        
        // BUILD ELEMENTAL UPGRADES SECTION - Compact list like tower enhancements
        if (academyData.upgrades && academyData.upgrades.length > 0) {
            const elementalUpgrades = academyData.upgrades.filter(u => !u.isAcademyUpgrade);
            
            if (elementalUpgrades.length > 0) {
                contentHTML += `<div class="upgrade-category compact-upgrades">
                    <div class="upgrade-category-header">ELEMENTAL MASTERIES</div>`;
                
                elementalUpgrades.forEach(upgrade => {
                    const isMaxed = upgrade.level >= upgrade.maxLevel;
                    const gemCount = academy.gems[upgrade.gemType] || 0;
                    const canUpgrade = upgrade.cost && gemCount >= upgrade.cost;
                    
                    // Current and next values for elemental upgrades
                    let currentValue = '';
                    let nextValue = '';
                    
                    if (upgrade.id === 'fire') {
                        const currentBonus = academy.elementalUpgrades.fire.level * academy.elementalUpgrades.fire.damageBonus;
                        const nextBonus = (academy.elementalUpgrades.fire.level + 1) * academy.elementalUpgrades.fire.damageBonus;
                        currentValue = `+${currentBonus} dmg`;
                        nextValue = `+${nextBonus} dmg`;
                    } else if (upgrade.id === 'water') {
                        const currentBonus = (academy.elementalUpgrades.water.level * academy.elementalUpgrades.water.slowBonus * 100).toFixed(0);
                        const nextBonus = ((academy.elementalUpgrades.water.level + 1) * academy.elementalUpgrades.water.slowBonus * 100).toFixed(0);
                        currentValue = `+${currentBonus}%`;
                        nextValue = `+${nextBonus}%`;
                    } else if (upgrade.id === 'air') {
                        const currentBonus = academy.elementalUpgrades.air.level * academy.elementalUpgrades.air.chainRange;
                        const nextBonus = (academy.elementalUpgrades.air.level + 1) * academy.elementalUpgrades.air.chainRange;
                        currentValue = `+${currentBonus}px`;
                        nextValue = `+${nextBonus}px`;
                    } else if (upgrade.id === 'earth') {
                        const currentBonus = academy.elementalUpgrades.earth.level * academy.elementalUpgrades.earth.armorPiercing;
                        const nextBonus = (academy.elementalUpgrades.earth.level + 1) * academy.elementalUpgrades.earth.armorPiercing;
                        currentValue = `+${currentBonus}`;
                        nextValue = `+${nextBonus}`;
                    }
                    
                    // Build detailed tooltip for hover info (SuperWeaponLab style)
                    let tooltipText = `<div style="font-weight: bold; margin-bottom: 0.3rem;">${upgrade.name}</div>`;
                    tooltipText += `<div style="font-size: 0.75rem; color: #ddd; margin-bottom: 0.4rem;">${upgrade.description}</div>`;
                    tooltipText += `<div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 0.3rem; font-size: 0.75rem;">`;
                    tooltipText += `<div>Level: <span style="color: #FFD700;">${upgrade.level}/${upgrade.maxLevel}</span></div>`;
                    
                    if (upgrade.id === 'fire') {
                        const curBonus = academy.elementalUpgrades.fire.level * academy.elementalUpgrades.fire.damageBonus;
                        tooltipText += `<div>\uD83D\uDD25 Damage Bonus: <span style="color: #FFD700;">+${curBonus}</span></div>`;
                    } else if (upgrade.id === 'water') {
                        const curBonus = (academy.elementalUpgrades.water.level * academy.elementalUpgrades.water.slowBonus * 100).toFixed(0);
                        tooltipText += `<div>\uD83D\uDCA7 Slow Effect: <span style="color: #FFD700;">+${curBonus}%</span></div>`;
                    } else if (upgrade.id === 'air') {
                        const curBonus = academy.elementalUpgrades.air.level * academy.elementalUpgrades.air.chainRange;
                        tooltipText += `<div>\uD83D\uDCA8 Chain Range: <span style="color: #FFD700;">+${curBonus}px</span></div>`;
                    } else if (upgrade.id === 'earth') {
                        const curBonus = academy.elementalUpgrades.earth.level * academy.elementalUpgrades.earth.armorPiercing;
                        tooltipText += `<div>\uD83E\uDEA8 Armor Pierce: <span style="color: #FFD700;">+${curBonus}</span></div>`;
                    }
                    
                    if (!isMaxed) {
                        tooltipText += `<div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 0.3rem; margin-top: 0.3rem; color: #aaffaa;">`;
                        tooltipText += `<div style="font-weight: bold;">Next Upgrade (+1):</div>`;
                        if (upgrade.id === 'fire') {
                            tooltipText += `<div>Damage: +${academy.elementalUpgrades.fire.damageBonus}</div>`;
                        } else if (upgrade.id === 'water') {
                            tooltipText += `<div>Slow Effect: +${(academy.elementalUpgrades.water.slowBonus * 100).toFixed(0)}%</div>`;
                        } else if (upgrade.id === 'air') {
                            tooltipText += `<div>Chain Range: +${academy.elementalUpgrades.air.chainRange}px</div>`;
                        } else if (upgrade.id === 'earth') {
                            tooltipText += `<div>Armor Pierce: +${academy.elementalUpgrades.earth.armorPiercing}</div>`;
                        }
                        if (upgrade.cost) tooltipText += `<div>Cost: <span style="color: #FFD700;">${upgrade.icon}${upgrade.cost}</span></div>`;
                        tooltipText += `</div>`;
                    }
                    tooltipText += `</div>`;
                    
                    contentHTML += `
                        <div class="compact-upgrade-item ${isMaxed ? 'maxed' : ''}" data-upgrade-id="${upgrade.id}" data-tooltip="${tooltipText.replace(/"/g, '&quot;')}">
                            <div class="compact-upgrade-left">
                                <span class="compact-upgrade-icon">${this.getElementGemHTML(upgrade.id, '18px')}</span>
                                <div class="compact-upgrade-info">
                                    <div class="compact-upgrade-name">${upgrade.name}</div>
                                    <div class="compact-upgrade-values">
                                        <span class="current-value">${currentValue}</span>
                                        ${!isMaxed && nextValue ? `<span class="next-value-arrow">\u2192</span><span class="next-value">${nextValue}</span>` : '<span class="maxed-text">MAX</span>'}
                                    </div>
                                </div>
                            </div>
                            <button class="compact-upgrade-btn panel-upgrade-btn" 
                                    data-upgrade="${upgrade.id}" 
                                    ${isMaxed || !canUpgrade ? 'disabled' : ''}>
                                ${isMaxed ? 'MAX' : (upgrade.cost ? `${this.getElementGemHTML(upgrade.id, '11px')} ${upgrade.cost}` : '\u2014')}
                            </button>
                        </div>
                    `;
                });
                
                contentHTML += `</div>`;
            }
        }
        
        // Update panel title and content
        const titleElement = panel.querySelector('.panel-title');
        if (titleElement) titleElement.textContent = 'Magic Academy';
        
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
                const upgradeId = e.currentTarget.dataset.upgrade;
                const isAcademyLevel = e.currentTarget.dataset.forgeLevel === 'true';
                
                if (isAcademyLevel) {
                    // Handle academy level upgrade
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
                        
                        // Refresh the panel (with skipSFX flag to prevent building sound from playing)
                        this.showAcademyUpgradeMenu({
                            type: 'academy_menu',
                            academy: academyData.academy,
                            upgrades: academyData.academy.getElementalUpgradeOptions(),
                            skipSFX: true
                        });
                    }
                } else {
                    // Handle elemental upgrades
                    if (academyData.academy.purchaseElementalUpgrade(upgradeId, this.gameState)) {
                        // Play upgrade SFX
                        if (this.stateManager.audioManager) {
                            this.stateManager.audioManager.playSFX('upgrade');
                        }
                        
                        this.updateUI();
                        
                        // Refresh the panel (with skipSFX flag to prevent building sound from playing)
                        this.showAcademyUpgradeMenu({
                            type: 'academy_menu',
                            academy: academyData.academy,
                            upgrades: academyData.academy.getElementalUpgradeOptions(),
                            skipSFX: true
                        });
                    }
                }
            }, { once: true });
        });
        
        // Add hover info listener for main academy upgrade button
        const academyUpgradeBtn = panel.querySelector('.forge-level-upgrade-btn');
        if (academyUpgradeBtn && academyUpgrade) {
            academyUpgradeBtn.addEventListener('mouseenter', () => {
                if (!academyUpgrade || !academyUpgrade.description) return;
                
                // Clear existing tooltips
                const existingTooltips = document.querySelectorAll('[data-academy-tooltip]');
                existingTooltips.forEach(tooltip => tooltip.remove());
                
                // Create hover menu
                const menu = document.createElement('div');
                menu.className = 'building-info-menu';
                menu.setAttribute('data-academy-tooltip', 'true');
                menu.innerHTML = `
                    <div class="info-title">${academyUpgrade.name}</div>
                    <div class="info-description">${academyUpgrade.description}</div>
                    <div style="border-top: 1px solid rgba(255, 215, 0, 0.3); padding-top: 0.3rem; margin-top: 0.3rem; color: #FFD700; font-size: 0.85rem;">${academyUpgrade.nextUnlock}</div>
                `;
                
                document.body.appendChild(menu);
                
                // Position the menu - same as forge, to the left of the panel
                const btnRect = academyUpgradeBtn.getBoundingClientRect();
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
            
            academyUpgradeBtn.addEventListener('mouseleave', () => {
                const tooltips = document.querySelectorAll('[data-academy-tooltip]');
                tooltips.forEach(tooltip => tooltip.remove());
            });
        }
        
        // Add hover info listeners for elemental upgrades (SuperWeaponLab style)
        panel.querySelectorAll('.compact-upgrade-item').forEach(item => {
            let tooltipTimeout;
            
            item.addEventListener('mouseenter', () => {
                clearTimeout(tooltipTimeout);
                
                const existingTooltips = document.querySelectorAll('[data-panel-tooltip]');
                existingTooltips.forEach(tooltip => tooltip.remove());
                
                const tooltipHTML = item.dataset.tooltip;
                if (!tooltipHTML) return;
                
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
                    pointer-events: none;
                `;
                
                document.body.appendChild(tooltip);
                
                const panelEl = document.getElementById('academy-panel');
                const panelRect = panelEl.getBoundingClientRect();
                const rect = item.getBoundingClientRect();
                
                let leftPos = panelRect.left - tooltip.offsetWidth - 10;
                if (leftPos < 10) {
                    leftPos = rect.right + 10;
                }
                
                tooltip.style.left = leftPos + 'px';
                tooltip.style.top = (rect.top - tooltip.offsetHeight / 2 + rect.height / 2) + 'px';
                
                const tooltipRect = tooltip.getBoundingClientRect();
                if (tooltipRect.bottom > window.innerHeight) {
                    tooltip.style.top = (window.innerHeight - tooltip.offsetHeight - 10) + 'px';
                }
                if (tooltipRect.top < 0) {
                    tooltip.style.top = '10px';
                }
            });
            
            item.addEventListener('mouseleave', () => {
                const activeTooltips = document.querySelectorAll('[data-panel-tooltip]');
                activeTooltips.forEach(tooltip => tooltip.remove());
            });
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
        
        
        // Generate panel content with stats + element selection
        let contentHTML = '';
        
        // Add tower stats panel at the top
        const tower = towerData.tower;
        const dmg = Math.round(tower.damage);
        const baseDmg = tower.originalDamage || 30;
        const bonuses = tower.elementalBonuses || {};
        const currentEl = towerData.currentElement || tower.selectedElement || 'fire';
        
        // Build active element bonus info
        let elementBonusHTML = '';
        if (currentEl === 'fire' && bonuses.fire && bonuses.fire.damageBonus > 0) {
            elementBonusHTML = `<div style="font-size: 0.8rem; color: #c9a876; margin-bottom: 0.4rem; display:flex; align-items:center; gap:4px;">${this.getElementGemHTML('fire')} Fire Bonus: <span style="color: #FFD700; font-weight: bold;">+${bonuses.fire.damageBonus} damage</span></div>`;
        } else if (currentEl === 'water' && bonuses.water && bonuses.water.slowBonus > 0) {
            elementBonusHTML = `<div style="font-size: 0.8rem; color: #c9a876; margin-bottom: 0.4rem; display:flex; align-items:center; gap:4px;">${this.getElementGemHTML('water')} Water Bonus: <span style="color: #FFD700; font-weight: bold;">+${(bonuses.water.slowBonus * 100).toFixed(0)}% slow</span></div>`;
        } else if (currentEl === 'air' && bonuses.air && bonuses.air.chainRange > 0) {
            elementBonusHTML = `<div style="font-size: 0.8rem; color: #c9a876; margin-bottom: 0.4rem; display:flex; align-items:center; gap:4px;">${this.getElementGemHTML('air')} Air Bonus: <span style="color: #FFD700; font-weight: bold;">+${bonuses.air.chainRange} chain range</span></div>`;
        } else if (currentEl === 'earth' && bonuses.earth && bonuses.earth.armorPiercing > 0) {
            elementBonusHTML = `<div style="font-size: 0.8rem; color: #c9a876; margin-bottom: 0.4rem; display:flex; align-items:center; gap:4px;">${this.getElementGemHTML('earth')} Earth Bonus: <span style="color: #FFD700; font-weight: bold;">+${bonuses.earth.armorPiercing} armor pierce</span></div>`;
        }
        
        const hasUpgrades = tower.originalDamage && (tower.damage !== tower.originalDamage || tower.range !== tower.originalRange);
        
        // Stat display with base value comparison
        const dmgStr = dmg !== Math.round(baseDmg) ? `<span style="color: #FFD700; font-weight: bold;">${dmg}</span> <span style="color: #aaffaa; font-size: 0.7rem;">(base: ${Math.round(baseDmg)})</span>` : `<span style="color: #FFD700; font-weight: bold;">${dmg}</span>`;
        const rngStr = Math.round(tower.range) !== Math.round(tower.originalRange || 110) ? `<span style="color: #FFD700; font-weight: bold;">${Math.round(tower.range)}</span> <span style="color: #aaffaa; font-size: 0.7rem;">(base: ${Math.round(tower.originalRange || 110)})</span>` : `<span style="color: #FFD700; font-weight: bold;">${Math.round(tower.range)}</span>`;
        
        contentHTML = `
            <div class="forge-panel-header">
                <div class="forge-header-top">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 0.3rem;">
                        <div class="forge-icon-display"><img src="assets/towers/magic.png" alt="Magic Tower" style="width: 100%; height: 100%; object-fit: contain;"></div>
                        <button class="upgrade-button sell-tower-btn" style="background: #ff4444; padding: 0.2rem 0.5rem; margin: 0; font-size: 0.7rem; font-weight: 600; border: 1px solid rgba(255, 68, 68, 0.4); width: 100%; max-width: 80px;">
                            Sell
                        </button>
                    </div>
                    <div class="forge-info-wrapper">
                        <div class="forge-title-row">
                            <div class="forge-name">Magic Tower</div>
                        </div>
                        <div class="forge-effects-row">
                            <span class="effect-badge">${dmgStr}</span>
                            <span class="effect-badge">${rngStr}</span>
                            <span class="effect-badge">${tower.fireRate.toFixed(1)}/s</span>
                        </div>
                        ${elementBonusHTML}
                        ${hasUpgrades ? '<div style="font-size: 0.65rem; color: #aaffaa; margin-top: 0.2rem;">✦ Includes academy bonuses</div>' : ''}
                    </div>
                </div>
            </div>
        `;
        
        // Element selection section header
        contentHTML += `<div class="upgrade-category" style="padding: 0.3rem 0.85rem; border-top: 1px solid rgba(255, 215, 0, 0.3);"><div style="font-size: 0.75rem; color: #FFD700; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Select Element</div></div>`;
        
        towerData.elements.forEach(element => {
            const isCurrent = element.id === towerData.currentElement;
            contentHTML += `
                <div class="upgrade-category">
                    <div class="panel-upgrade-item ${isCurrent ? 'selected-element' : ''}">
                        <div class="upgrade-header-row">
                            <div class="upgrade-icon-section" style="display:flex;align-items:center;justify-content:center;">${this.getElementGemHTML(element.id, '22px')}</div>
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
        
        // Update panel title and content
        const titleElement = panel.querySelector('.panel-title');
        if (titleElement) titleElement.textContent = 'Magic Tower Elements';
        
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
        
        
        // Generate panel content with stats + spell selection
        let contentHTML = '';
        
        // Add tower stats panel at the top
        const tower = towerData.tower;
        const dmg = Math.round(tower.damage);
        const baseDmg = tower.originalDamage || 35;
        
        const hasUpgrades = tower.originalDamage && (tower.damage !== tower.originalDamage || tower.range !== tower.originalRange);
        
        // Stat display with base value comparison
        const dmgStr = dmg !== Math.round(baseDmg) ? `<span style="color: #FFD700; font-weight: bold;">${dmg}</span> <span style="color: #aaffaa; font-size: 0.7rem;">(base: ${Math.round(baseDmg)})</span>` : `<span style="color: #FFD700; font-weight: bold;">${dmg}</span>`;
        const rngStr = Math.round(tower.range) !== Math.round(tower.originalRange || 110) ? `<span style="color: #FFD700; font-weight: bold;">${Math.round(tower.range)}</span> <span style="color: #aaffaa; font-size: 0.7rem;">(base: ${Math.round(tower.originalRange || 110)})</span>` : `<span style="color: #FFD700; font-weight: bold;">${Math.round(tower.range)}</span>`;
        
        contentHTML = `
            <div class="forge-panel-header">
                <div class="forge-header-top">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 0.3rem;">
                        <div class="forge-icon-display"><img src="assets/towers/combination.png" alt="Combination Tower" style="width: 100%; height: 100%; object-fit: contain;"></div>
                        <button class="upgrade-button sell-tower-btn" style="background: #ff4444; padding: 0.2rem 0.5rem; margin: 0; font-size: 0.7rem; font-weight: 600; border: 1px solid rgba(255, 68, 68, 0.4); width: 100%; max-width: 80px;">
                            Sell
                        </button>
                    </div>
                    <div class="forge-info-wrapper">
                        <div class="forge-title-row">
                            <div class="forge-name">Combination Tower</div>
                        </div>
                        <div class="forge-effects-row">
                            <span class="effect-badge">${dmgStr}</span>
                            <span class="effect-badge">${rngStr}</span>
                            <span class="effect-badge">${tower.fireRate.toFixed(1)}/s</span>
                        </div>
                        ${hasUpgrades ? '<div style="font-size: 0.65rem; color: #aaffaa; margin-top: 0.2rem;">✦ Includes upgrade bonuses</div>' : ''}
                    </div>
                </div>
            </div>
        `;
        
        // Spell selection section header
        contentHTML += `<div class="upgrade-category" style="padding: 0.3rem 0.85rem; border-top: 1px solid rgba(255, 215, 0, 0.3);"><div style="font-size: 0.75rem; color: #FFD700; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Select Spell</div></div>`;
        
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
        
        // Update panel title and content
        const titleElement = panel.querySelector('.panel-title');
        if (titleElement) titleElement.textContent = 'Combination Tower Spells';
        
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

        // Initialize guard post state tracker for live updates
        const tower = towerData.tower;
        const hasDefender = tower.defender && !tower.defender.isDead();
        const hasCooldown = !hasDefender && tower.defenderDeadCooldown > 0;
        this._guardPostState = hasDefender ? 'active' : (hasCooldown ? 'cooldown' : 'hire');
        
        const panel = document.getElementById('basic-tower-panel');
        if (!panel) {
            console.error('UIManager: Panel not found for Guard Post menu');
            return;
        }

        const towerInfo = tower.constructor.getInfo();
        const gameState = towerData.gameState;
        const trainingGrounds = towerData.trainingGrounds;
        const maxDefenderLevel = (trainingGrounds && trainingGrounds.defenderMaxLevel) ? trainingGrounds.defenderMaxLevel : 1;
        
        let contentHTML = `
            <div class="forge-panel-header">
                <div class="forge-header-top">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 0.3rem;">
                        <div class="forge-icon-display"><img src="assets/towers/guardian.png" alt="Guard Post" style="width: 100%; height: 100%; object-fit: contain;"></div>
                        <button class="upgrade-button sell-tower-btn" style="background: #ff4444; padding: 0.2rem 0.5rem; margin: 0; font-size: 0.7rem; font-weight: 600; border: 1px solid rgba(255, 68, 68, 0.4); width: 100%; max-width: 80px;">
                            Sell
                        </button>
                    </div>
                    <div class="forge-info-wrapper">
                        <div class="forge-title-row">
                            <div class="forge-name">${towerInfo.name}</div>
                        </div>
                        <div class="forge-effects-row">
                            <span class="effect-badge">Max Hire Level: ${maxDefenderLevel}</span>
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
                                <div class="upgrade-icon-section"><svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 22 22'><circle cx='11' cy='12' r='8' stroke='#AA8844' stroke-width='1.5' fill='#221800'/><line x1='11' y1='12' x2='11' y2='6' stroke='#FFD700' stroke-width='1.8' stroke-linecap='round'/><line x1='11' y1='12' x2='15' y2='12' stroke='#FFD700' stroke-width='1.5' stroke-linecap='round'/></svg></div>
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
                const defenderCosts = [200, 300, 450];
                const defenderLabels = ['Level 1', 'Level 2 - Medium', 'Level 3 - Heavy'];
                const defenderDescriptions = [
                    'Fast defender (70 HP, 15 DMG). Good for early game.',
                    'Balanced defender (100 HP, 20 DMG). Moderate stats.',
                    'Heavily armored tank (140 HP, 30 DMG). Maximum strength.'
                ];
                const defenderIcons = [
                    "<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><line x1='10' y1='35' x2='30' y2='8' stroke='#C8A030' stroke-width='3' stroke-linecap='round'/><rect x='6' y='20' width='12' height='3' rx='1.5' fill='#8A5A10' stroke='#3A2005' stroke-width='1' transform='rotate(-44 12 21.5)'/><circle cx='10' cy='35' r='3.5' fill='#7A4A10' stroke='#3A2005' stroke-width='1'/></svg>",
                    "<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><path d='M8 10 L20 7 L32 10 L32 22 Q32 32 20 36 Q8 32 8 22 Z' fill='#3A2010' stroke='#C0C0C0' stroke-width='1.5'/><line x1='20' y1='9' x2='20' y2='34' stroke='#C0C0C0' stroke-width='1'/><line x1='10' y1='20' x2='30' y2='20' stroke='#C0C0C0' stroke-width='1'/><line x1='26' y1='38' x2='38' y2='6' stroke='#C0C0C0' stroke-width='2.5' stroke-linecap='round'/><rect x='22' y='20' width='10' height='2.5' rx='1' fill='#5A5A5A' stroke='#2A2A2A' stroke-width='0.8' transform='rotate(-44 27 21.5)'/><circle cx='26' cy='38' r='2.5' fill='#3A3A3A' stroke='#1A1A1A' stroke-width='0.8'/></svg>",
                    "<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><rect x='4' y='8' width='16' height='22' rx='2' fill='#1A0A02' stroke='#FFD700' stroke-width='1.8'/><line x1='12' y1='10' x2='12' y2='28' stroke='#FFD700' stroke-width='1.2'/><line x1='5' y1='18' x2='19' y2='18' stroke='#FFD700' stroke-width='1.2'/><line x1='22' y1='38' x2='38' y2='4' stroke='#FFD700' stroke-width='4' stroke-linecap='round'/><rect x='19' y='18' width='14' height='3' rx='1.5' fill='#8A6A10' stroke='#4A3005' stroke-width='0.8' transform='rotate(-44 26 19.5)'/><circle cx='22' cy='38' r='3.5' fill='#7A5010' stroke='#4A3005' stroke-width='0.8'/></svg>"
                ];
                
                for (let level = 1; level <= maxDefenderLevel; level++) {
                    const cost = defenderCosts[level - 1];
                    const canAfford = gameState.gold >= cost;
                    contentHTML += `
                        <div class="upgrade-category" style="padding: 0.6rem 0.85rem; border-top: 1px solid rgba(255, 215, 0, 0.2);">
                            <div class="panel-upgrade-item">
                                <div class="upgrade-header-row">
                                    <div class="upgrade-icon-section">${defenderIcons[level - 1]}</div>
                                    <div class="upgrade-info-section">
                                        <div class="upgrade-name">Hire ${defenderLabels[level - 1]}</div>
                                        <div class="upgrade-description">${defenderDescriptions[level - 1]}</div>
                                    </div>
                                </div>
                                <div class="upgrade-action-row">
                                    <div class="upgrade-cost-display"><span class="coin-xs"></span>${cost}</div>
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
                            <div class="upgrade-icon-section"><svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 22 22'><path d='M11 2 L19 5 L19 12 Q19 17 11 20 Q3 17 3 12 L3 5 Z' fill='#4A7A5A' stroke='#253A2D' stroke-width='1.2'/><path d='M11 5 L17 7.5 L17 12 Q17 16 11 18.5 Q5 16 5 12 L5 7.5 Z' fill='#6A9A7A'/><line x1='11' y1='5' x2='11' y2='18.5' stroke='#3A5A4A' stroke-width='1'/></svg></div>
                            <div class="upgrade-info-section">
                                <div class="upgrade-name">Defender Active (Level ${tower.defender.level})</div>
                                <div class="upgrade-description">A defender is currently stationed here</div>
                            </div>
                        </div>
                        <div class="upgrade-action-row">
                            <div class="upgrade-cost-display" id="guard-post-defender-hp">${Math.round(tower.defender.health)}/${Math.round(tower.defender.maxHealth)} HP</div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Update panel title and content
        const titleElement = panel.querySelector('.panel-title');
        if (titleElement) titleElement.textContent = 'Guard Post';

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
        
        const tower = towerData.tower;
        const towerInfo = tower.constructor.getInfo();
        const icon = towerInfo.icon || '';
        const name = towerInfo.name;
        
        // Check for upgrade indicators (compare live vs base)
        const hasUpgrades = tower.originalDamage && (tower.damage !== tower.originalDamage || tower.range !== tower.originalRange || tower.fireRate !== tower.originalFireRate);
        
        // Helper: show stat with base value if upgraded
        const sv = (current, base, suffix = '') => {
            const cur = Math.round(current);
            const bas = Math.round(base);
            if (cur !== bas && bas > 0) {
                return `<span style="color: #FFD700; font-weight: bold;">${cur}${suffix}</span> <span style="color: #aaffaa; font-size: 0.7rem;">(base: ${bas}${suffix})</span>`;
            }
            return `<span style="color: #FFD700; font-weight: bold;">${cur}${suffix}</span>`;
        };
        const svDec = (current, base, suffix = '') => {
            const cur = current.toFixed(1);
            const bas = base.toFixed(1);
            if (cur !== bas && parseFloat(bas) > 0) {
                return `<span style="color: #FFD700; font-weight: bold;">${cur}${suffix}</span> <span style="color: #aaffaa; font-size: 0.7rem;">(base: ${bas}${suffix})</span>`;
            }
            return `<span style="color: #FFD700; font-weight: bold;">${cur}${suffix}</span>`;
        };
        
        // Build stat badges for display
        let statBadgesHTML = '';
        const towerType = tower.constructor.name;
        
        switch (towerType) {
            case 'BasicTower': {
                statBadgesHTML = `
                    <span class="effect-badge">${sv(tower.damage, tower.originalDamage || 20)}</span>
                    <span class="effect-badge">${sv(tower.range, tower.originalRange || 120)}</span>
                    <span class="effect-badge">${svDec(tower.fireRate, tower.originalFireRate || 1.0, '/s')}</span>
                `;
                break;
            }
            case 'ArcherTower': {
                const pierce = tower.armorPiercingPercent || 0;
                statBadgesHTML = `
                    <span class="effect-badge">${sv(tower.damage, tower.originalDamage || 35)}</span>
                    <span class="effect-badge">${sv(tower.range, tower.originalRange || 140)}</span>
                    <span class="effect-badge">${svDec(tower.fireRate, tower.originalFireRate || 1.5, '/s')}</span>
                    ${pierce > 0 ? `<span class="effect-badge">${pierce}%</span>` : ''}
                `;
                break;
            }
            case 'CannonTower': {
                const radius = tower.splashRadius || 50;
                const baseRadius = tower.originalSplashRadius || 50;
                statBadgesHTML = `
                    <span class="effect-badge">${sv(tower.damage, tower.originalDamage || 100)}</span>
                    <span class="effect-badge">${sv(radius, baseRadius, 'px')}</span>
                    <span class="effect-badge">${sv(tower.range, tower.originalRange || 120)}</span>
                    <span class="effect-badge">${svDec(tower.fireRate, tower.originalFireRate || 0.4, '/s')}</span>
                `;
                break;
            }
            case 'BarricadeTower': {
                const capacity = tower.maxEnemiesSlowed || 4;
                const duration = tower.slowDuration || 4.0;
                const baseCapacity = tower.originalMaxEnemiesSlowed || 4;
                const baseDuration = tower.originalSlowDuration || 4.0;
                statBadgesHTML = `
                    <span class="effect-badge">${sv(capacity, baseCapacity)}</span>
                    <span class="effect-badge">${svDec(duration, baseDuration, 's')}</span>
                    <span class="effect-badge">${sv(tower.range, tower.originalRange || 120)}</span>
                    <span class="effect-badge">${svDec(tower.fireRate, tower.originalFireRate || 0.1, '/s')}</span>
                `;
                break;
            }
            case 'PoisonArcherTower': {
                let poisonForgeBonus = 0;
                if (this.towerManager.cachedForges && this.towerManager.cachedForges.length > 0) {
                    const fm = this.towerManager.cachedForges[0].getUpgradeMultipliers();
                    poisonForgeBonus = fm.poisonDamageBonus || 0;
                }
                const poisonTickDmg = 13 + poisonForgeBonus;
                const basePoisonTickDmg = 13;
                statBadgesHTML = `
                    <span class="effect-badge">${sv(poisonTickDmg, basePoisonTickDmg, '/2s')}</span>
                    <span class="effect-badge">${sv(tower.range, tower.originalRange || 130)}</span>
                    <span class="effect-badge">${svDec(tower.fireRate, tower.originalFireRate || 0.4, '/s')}</span>
                `;
                break;
            }
            default: {
                statBadgesHTML = `
                    <span class="effect-badge">${typeof tower.damage === 'number' ? Math.round(tower.damage) : tower.damage}</span>
                    <span class="effect-badge">${Math.round(tower.range)}</span>
                    <span class="effect-badge">${typeof tower.fireRate === 'number' ? tower.fireRate.toFixed(1) + '/s' : tower.fireRate}</span>
                `;
                break;
            }
        }
        
        // Show upgrade status indicator
        let upgradeNote = '';
        if (hasUpgrades) {
            upgradeNote = '<div style="font-size: 0.65rem; color: #aaffaa; margin-top: 0.2rem;">✦ Includes upgrade bonuses</div>';
        }
        
        const towerImageMap = { 'BasicTower': 'basic', 'ArcherTower': 'archer', 'CannonTower': 'cannon', 'BarricadeTower': 'barricade', 'PoisonArcherTower': 'poison' };
        const towerImg = towerImageMap[towerType] || 'basic';

        let contentHTML = `
            <div class="forge-panel-header">
                <div class="forge-header-top">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 0.3rem;">
                        <div class="forge-icon-display"><img src="assets/towers/${towerImg}.png" alt="${name}" style="width: 100%; height: 100%; object-fit: contain;"></div>
                        <button id="sell-tower-btn-${tower.gridX}-${tower.gridY}" class="upgrade-button sell-tower-btn" style="background: #ff4444; padding: 0.2rem 0.5rem; margin: 0; font-size: 0.7rem; font-weight: 600; border: 1px solid rgba(255, 68, 68, 0.4); width: 100%; max-width: 80px;">
                            Sell
                        </button>
                    </div>
                    <div class="forge-info-wrapper">
                        <div class="forge-title-row">
                            <div class="forge-name">${name}</div>
                        </div>
                        <div class="forge-effects-row">
                            ${statBadgesHTML}
                        </div>
                        ${hasUpgrades ? upgradeNote : ''}
                    </div>
                </div>
            </div>
        `;
        
        // Display in panel using the non-closing method so menu stays open when clicking towers
        this.showPanelWithoutClosing('basic-tower-panel', `${icon} ${name}`, contentHTML);
        
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
        // Redirect to the unified tower stats menu
        this.showTowerStatsMenu(towerData);
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
        const upgradesContainer = document.getElementById('superweapon-panel-content');
        
        if (!panel || !upgradesContainer) {
            console.error('UIManager: SuperWeapon panel elements not found');
            return;
        }
        
        const superWeaponLab = menuData.building;
        const labUpgrade = superWeaponLab.getLabUpgradeOption();
        const isMaxed = superWeaponLab.labLevel >= superWeaponLab.maxLabLevel;
        const canAfford = labUpgrade && labUpgrade.cost && this.gameState.gold >= labUpgrade.cost && (menuData.academy && (menuData.academy.gems.diamond || 0) >= (labUpgrade.diamondCost || 0));
        
        // Build effect descriptions list based on unlocked spells
        let effectsList = [];
        Object.values(superWeaponLab.spells).forEach(spell => {
            if (spell.unlocked) {
                effectsList.push(`${spell.icon} ${spell.name}`);
            }
        });
        
        // Track which spells are available and locked
        const unlockedSpellCount = Object.values(superWeaponLab.spells).filter(s => s.unlocked).length;
        const totalSpellCount = Object.keys(superWeaponLab.spells).length;
        
        let contentHTML = '';
        
        // BUILD HEADER SECTION - Professional top panel
        contentHTML += `
            <div class="forge-panel-header">
                <div class="forge-header-top">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 0.3rem;">
                        <div class="forge-icon-display"><img src="assets/buildings/superweapon.png" alt="Super Weapon Lab" style="width: 100%; height: 100%; object-fit: contain;"></div>
                        <button class="upgrade-button sell-building-btn" data-building-id="superweapon" style="background: #ff4444; padding: 0.2rem 0.5rem; margin: 0; font-size: 0.7rem; font-weight: 600; border: 1px solid rgba(255, 68, 68, 0.4); width: 100%; max-width: 80px;">
                            Sell
                        </button>
                    </div>
                    <div class="forge-info-wrapper">
                        <div class="forge-title-row">
                            <div class="forge-name">Super Weapon Lab</div>
                            <div class="forge-level-badge">Level ${superWeaponLab.labLevel}/${superWeaponLab.maxLabLevel}</div>
                        </div>
                        <div class="forge-level-bar">
                            <div class="forge-level-bar-fill" style="width: ${(superWeaponLab.labLevel / superWeaponLab.maxLabLevel) * 100}%"></div>
                        </div>
                        <div class="forge-benefits-list">
                            <div class="forge-benefit-item">
                                <span class="forge-benefit-label">Combination Tower:</span>
                                <span class="forge-benefit-value">${superWeaponLab.labLevel >= 1 ? 'Unlocked' : 'Locked'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="forge-upgrade-btn forge-level-upgrade-btn panel-upgrade-btn ${isMaxed ? 'maxed' : ''}" 
                        data-upgrade="${labUpgrade ? labUpgrade.id : 'lab_upgrade'}" 
                        data-lab-level="true"
                        ${!isMaxed && !canAfford ? 'disabled' : ''}
                        ${isMaxed ? 'disabled' : ''}>
                    <div class="forge-upgrade-btn-content">
                        ${isMaxed ? '<span class="max-level-text">MAX LEVEL REACHED</span>' : '<span class="btn-label">LAB UPGRADE</span>'}
                        <span class="btn-cost">${isMaxed ? 'LV ' + superWeaponLab.labLevel : (labUpgrade && labUpgrade.cost ? '<span class="coin-xs"></span> ' + labUpgrade.cost + ' + ◆' + (labUpgrade.diamondCost || 0) : '—')}</span>
                    </div>
                </button>
            </div>
        `;
        
        // BUILD MAIN SPELL UPGRADES SECTION - Compact spell section with inline progress numbers
        const mainSpells = Object.values(superWeaponLab.spells);
        const unlockedMainSpells = mainSpells.filter(s => s.unlocked);
        if (unlockedMainSpells.length > 0) {
            contentHTML += `<div class="spell-upgrades-section">
                <div class="spell-section-header">SPELL UPGRADES</div>
                <div class="spell-bars-container">`;
            
            unlockedMainSpells.forEach(spell => {
                const isMaxed = spell.upgradeLevel >= spell.maxUpgradeLevel;
                const canUpgrade = superWeaponLab.labLevel >= 4 && spell.upgradeLevel < spell.maxUpgradeLevel && (menuData.academy && (menuData.academy.gems.diamond || 0) >= 1);
                
                // Build tooltip for spelling hover info
                let tooltipText = `<div style="font-weight: bold; margin-bottom: 0.3rem;">${spell.name}</div>`;
                tooltipText += `<div style="font-size: 0.75rem; color: #ddd; margin-bottom: 0.4rem;">${spell.description || ''}</div>`;
                tooltipText += `<div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 0.3rem; font-size: 0.75rem;">`;
                
                // Show current stats
                if (spell.damage) tooltipText += `<div>❖ Damage: <span style="color: #FFD700;">${Math.floor(spell.damage)}</span></div>`;
                if (spell.radius) tooltipText += `<div>◯ Radius: <span style="color: #FFD700;">${Math.floor(spell.radius)}px</span></div>`;
                if (spell.freezeDuration) tooltipText += `<div>Freeze: <span style="color: #FFD700;">${spell.freezeDuration.toFixed(1)}s</span></div>`;
                if (spell.burnDuration) tooltipText += `<div>Burn: <span style="color: #FFD700;">${spell.burnDuration}s</span> (${Math.floor(spell.burnDamage)}/s)</div>`;
                if (spell.chainCount) tooltipText += `<div>Chains: <span style="color: #FFD700;">${spell.chainCount}</span></div>`;
                tooltipText += `<div>Cooldown: <span style="color: #FFD700;">${spell.cooldown.toFixed(1)}s</span></div>`;
                tooltipText += `<div style="font-size: 0.7rem; color: #aaa;">Level: <span style="color: #FFD700;">${spell.upgradeLevel}/${spell.maxUpgradeLevel}</span></div>`;
                
                // Show spell-specific per-level upgrade effects
                if (!isMaxed) {
                    tooltipText += `<div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 0.3rem; margin-top: 0.3rem; color: #aaffaa;">`;
                    tooltipText += `<div style="font-weight: bold;">Per Upgrade Level (+1 ◆):</div>`;
                    if (spell.id === 'arcaneBlast') {
                        tooltipText += `<div>Magic Damage: +5</div>`;
                        tooltipText += `<div>Radius: +2px</div>`;
                        tooltipText += `<div style="color: #bb88ff;">Classless — damages all enemies</div>`;
                    } else if (spell.id === 'frostNova') {
                        tooltipText += `<div>Ice Damage: +2</div>`;
                        tooltipText += `<div>Freeze Duration: +0.1s</div>`;
                        tooltipText += `<div>Radius: +2px</div>`;
                        tooltipText += `<div style="color: #88ddff;">Freeze always applies (ignores immunity)</div>`;
                    } else if (spell.id === 'meteorStrike') {
                        tooltipText += `<div>Fire Damage: +7</div>`;
                        tooltipText += `<div>Burn (per tick): +0.5/s</div>`;
                        tooltipText += `<div>Radius: +2px</div>`;
                        tooltipText += `<div style="color: #ff8844;">Effective vs Air Frogs</div>`;
                    } else if (spell.id === 'chainLightning') {
                        tooltipText += `<div>Electricity Damage: +3</div>`;
                        tooltipText += `<div>Radius: +2px</div>`;
                        tooltipText += `<div>Chain Targets: +1 every 5 levels</div>`;
                        tooltipText += `<div style="color: #ffff88;">Bypasses frogs (use vs normal enemies)</div>`;
                    }
                    tooltipText += `</div>`;
                }
                
                tooltipText += `</div>`;
                
                const progressPercent = (spell.upgradeLevel / spell.maxUpgradeLevel) * 100;
                
                // Create compact spell bar item with progress on the bar itself
                contentHTML += `
                    <div class="compact-spell-bar ${isMaxed ? 'maxed' : ''}" data-spell-id="${spell.id}">
                        <div class="compact-spell-info">
                            <span class="compact-spell-icon">${spell.icon}</span>
                            <span class="compact-spell-name">${spell.name}</span>
                        </div>
                        <div class="compact-spell-progress-wrapper">
                            <div style="height: 12px; background: rgba(0,0,0,0.6); border-radius: 2px; overflow: hidden; border: 1px solid rgba(212, 175, 55, 0.5); position: relative;">
                                <div style="height: 100%; width: ${progressPercent}%; background: linear-gradient(90deg, #FFD700, #FFA500); transition: width 0.3s ease; display: flex; align-items: center; justify-content: flex-end; padding-right: 3px;">
                                    <span style="font-size: 0.6rem; font-weight: bold; color: #000; text-shadow: 0 0 2px rgba(255,215,0,0.8);">${spell.upgradeLevel}</span>
                                </div>
                            </div>
                        </div>
                        ${spell.upgradeLevel < spell.maxUpgradeLevel ? `<button class="compact-spell-upgrade-btn panel-upgrade-btn spell-icon-hover" 
                                data-main-spell="${spell.id}" 
                                data-tooltip="${tooltipText.replace(/"/g, '&quot;')}"
                                ${isMaxed || !canUpgrade ? 'disabled' : ''}>
                            ${isMaxed ? 'MAX' : '+'}
                        </button>` : `<button class="compact-spell-upgrade-btn panel-upgrade-btn" disabled>MAX</button>`}
                    </div>
                `;
            });
            
            contentHTML += `</div></div>`;
        }
        
        // BUILD COMBINATION TOWER UPGRADES SECTION - Only show at level 2+
        if (superWeaponLab.labLevel >= 2) {
            const combinationUpgrades = superWeaponLab.getCombinationUpgradeOptions(menuData.academy);
            contentHTML += `<div class="upgrade-category compact-upgrades">
                <div class="upgrade-category-header">COMBINATION SPELLS</div>`;
            
            combinationUpgrades.forEach(upgrade => {
                const isMaxed = upgrade.upgradeLevel >= upgrade.maxUpgradeLevel;
                const canAfford = upgrade.canAfford;
                
                // Build tooltip for combination spell hover info
                let comboTooltip = `<div style="font-weight: bold; margin-bottom: 0.3rem;">${upgrade.name}</div>`;
                comboTooltip += `<div style="font-size: 0.75rem; color: #ddd; margin-bottom: 0.3rem;">${upgrade.description || ''}</div>`;
                comboTooltip += `<div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 0.3rem; font-size: 0.75rem;">`;
                comboTooltip += `<div>Current Level: <span style="color: #FFD700;">${upgrade.upgradeLevel}/${upgrade.maxUpgradeLevel}</span></div>`;
                if (!isMaxed) {
                    comboTooltip += `<div style="margin-top: 0.3rem; color: #aaffaa; font-weight: bold;">Cost for Level ${upgrade.upgradeLevel + 1}:</div>`;
                    for (const [gemType, cost] of Object.entries(upgrade.gemsRequired)) {
                        comboTooltip += `<div>${this.getElementGemHTML(gemType, '12px')} ${gemType.charAt(0).toUpperCase() + gemType.slice(1)}: ${cost}</div>`;
                    }
                    comboTooltip += `<div style="color: #aaffaa; margin-top: 0.3rem;">Next upgrade adds more power</div>`;
                }
                comboTooltip += `</div>`;
                
                const progressPercent = (upgrade.upgradeLevel / upgrade.maxUpgradeLevel) * 100;
                
                // Build gem cost display
                let gemCostDisplay = '';
                for (const [gemType, cost] of Object.entries(upgrade.gemsRequired)) {
                    const hasGem = (menuData.academy && (menuData.academy.gems[gemType] || 0) >= cost);
                    const style = hasGem ? 'color: #aaffaa;' : 'color: #ff9999;';
                    gemCostDisplay += `<div style="font-size: 0.7rem; ${style};">${this.getElementGemHTML(gemType, '12px')} ${cost}</div>`;
                }
                
                contentHTML += `
                    <div class="compact-upgrade-item ${isMaxed ? 'maxed' : ''}" data-upgrade-id="${upgrade.id}">
                        <div class="compact-upgrade-left">
                            <span class="compact-upgrade-icon" style="cursor: help;" data-combo-tooltip="${comboTooltip.replace(/"/g, '&quot;')}">${upgrade.icon}</span>
                            <div class="compact-upgrade-info">
                                <div class="compact-upgrade-name">${upgrade.name}</div>
                                <div style="height: 10px; background: rgba(0,0,0,0.5); border-radius: 2px; overflow: hidden; border: 1px solid #666; position: relative; margin: 0.3rem 0;">
                                    <div style="height: 100%; width: ${progressPercent}%; background: linear-gradient(90deg, #FF6BA6, #FF1493); transition: width 0.3s ease;"></div>
                                </div>
                                <div style="font-size: 0.65rem; color: #aaa;">${upgrade.upgradeLevel}/${upgrade.maxUpgradeLevel}</div>
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 0.2rem;">
                            ${!isMaxed ? gemCostDisplay : '<span style="font-size: 0.7rem; color: #FFD700;">MAX</span>'}
                        </div>
                        <button class="compact-upgrade-btn panel-upgrade-btn combo-upgrade-btn" 
                                data-combo-spell="${upgrade.id}" 
                                data-combo-tooltip="${comboTooltip.replace(/"/g, '&quot;')}"
                                ${isMaxed || !canAfford ? 'disabled' : ''}>
                            ${isMaxed ? 'MAX' : 'Upgrade'}
                        </button>
                    </div>
                `;
            });
            
            contentHTML += `</div>`;
        }
        
        // Update container
        upgradesContainer.innerHTML = contentHTML;
        
        // Show the panel with animation
        panel.style.display = 'flex';
        panel.classList.remove('closing');
        
        // Setup spell icon hover tooltips (consistent with other menus)
        const setupSpellTooltips = () => {
            const spellIcons = upgradesContainer.querySelectorAll('.spell-icon-hover');
            
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
                    
                    // Create tooltip element with consistent styling
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
                        pointer-events: none;
                    `;
                    
                    document.body.appendChild(tooltip);
                    
                    // Get panel position to position tooltip outside/left of panel
                    const panel = document.getElementById('superweapon-panel');
                    const panelRect = panel.getBoundingClientRect();
                    const rect = icon.getBoundingClientRect();
                    
                    // Position tooltip to the left of the panel (or far left if needed)
                    let leftPos = panelRect.left - tooltip.offsetWidth - 10;
                    if (leftPos < 10) {
                        // If no space on left, position on right side
                        leftPos = rect.right + 10;
                    }
                    
                    tooltip.style.left = leftPos + 'px';
                    tooltip.style.top = (rect.top - tooltip.offsetHeight / 2 + rect.height / 2) + 'px';
                    
                    // Adjust if tooltip goes off screen
                    const tooltipRect = tooltip.getBoundingClientRect();
                    if (tooltipRect.bottom > window.innerHeight) {
                        tooltip.style.top = (window.innerHeight - tooltip.offsetHeight - 10) + 'px';
                    }
                    if (tooltipRect.top < 0) {
                        tooltip.style.top = '10px';
                    }
                });
                
                icon.addEventListener('mouseleave', () => {
                    const activeTooltips = document.querySelectorAll('[data-panel-tooltip]');
                    activeTooltips.forEach(tooltip => tooltip.remove());
                });
            });
        };
        
        setupSpellTooltips();
        
        // Setup combination spell hover tooltips (for both icons and buttons)
        const setupComboTooltips = () => {
            const comboElements = upgradesContainer.querySelectorAll('[data-combo-tooltip]');
            
            comboElements.forEach(element => {
                let tooltipTimeout;
                
                element.addEventListener('mouseenter', (e) => {
                    clearTimeout(tooltipTimeout);
                    
                    // Remove existing tooltips first
                    const existingTooltips = document.querySelectorAll('[data-panel-tooltip]');
                    existingTooltips.forEach(tooltip => tooltip.remove());
                    
                    const tooltipHTML = element.dataset.comboTooltip;
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
                        pointer-events: none;
                    `;
                    
                    document.body.appendChild(tooltip);
                    
                    const panel = document.getElementById('superweapon-panel');
                    const panelRect = panel.getBoundingClientRect();
                    const rect = element.getBoundingClientRect();
                    
                    let leftPos = panelRect.left - tooltip.offsetWidth - 10;
                    if (leftPos < 10) {
                        leftPos = rect.right + 10;
                    }
                    
                    tooltip.style.left = leftPos + 'px';
                    tooltip.style.top = (rect.top - tooltip.offsetHeight / 2 + rect.height / 2) + 'px';
                    
                    const tooltipRect = tooltip.getBoundingClientRect();
                    if (tooltipRect.bottom > window.innerHeight) {
                        tooltip.style.top = (window.innerHeight - tooltip.offsetHeight - 10) + 'px';
                    }
                    if (tooltipRect.top < 0) {
                        tooltip.style.top = '10px';
                    }
                });
                
                element.addEventListener('mouseleave', () => {
                    const activeTooltips = document.querySelectorAll('[data-panel-tooltip]');
                    activeTooltips.forEach(tooltip => tooltip.remove());
                });
            });
        };
        
        setupComboTooltips();
        
        // Setup event listeners
        this.setupSuperWeaponPanelListeners(menuData);
    }

    setupSuperWeaponPanelListeners(menuData) {
        const panel = document.getElementById('superweapon-panel');
        if (!panel) return;
        
        // Close button - clone to remove all accumulated { once: true } listeners
        const closeBtn = panel.querySelector('.panel-close-btn');
        if (closeBtn) {
            const freshCloseBtn = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(freshCloseBtn, closeBtn);
            freshCloseBtn.addEventListener('click', () => {
                this.closePanelWithAnimation('superweapon-panel');
            }, { once: true });
        }
        
        // Upgrade button handler - store on panel to prevent stacking
        const handleUpgradeClick = (e) => {
            const btn = e.target.closest('.panel-upgrade-btn');
            if (!btn || btn.disabled) return;
            
            // Prevent multiple clicks
            const wasDisabled = btn.disabled;
            btn.disabled = true;
            setTimeout(() => { btn.disabled = wasDisabled; }, 100);
            
            if (btn.dataset.labLevel === 'true') {
                // Lab level upgrade
                if (menuData.building.purchaseLabUpgrade(this.gameState)) {
                    if (this.stateManager.audioManager) {
                        this.stateManager.audioManager.playSFX('upgrade');
                    }
                    this.updateUI();
                    this.showSuperWeaponMenu(menuData);
                }
            } else if (btn.dataset.mainSpell) {
                // Main spell upgrade
                const spellId = btn.dataset.mainSpell;
                const diamondCost = 1;
                if (menuData.building.upgradeMainSpell(spellId, diamondCost)) {
                    if (this.stateManager.audioManager) {
                        this.stateManager.audioManager.playSFX('upgrade');
                    }
                    this.updateUI();
                    this.showSuperWeaponMenu(menuData);
                }
            } else if (btn.dataset.comboSpell) {
                // Combination spell upgrade - uses elemental gems
                const spellId = btn.dataset.comboSpell;
                
                // Find the academy reference (could be from menuData or from the building itself)
                let academy = menuData.academy;
                if (!academy && menuData.building.academy) {
                    academy = menuData.building.academy;
                }
                
                const spell = menuData.building.combinationSpells.find(s => s.id === spellId);
                
                if (spell && spell.upgradeLevel < spell.maxUpgradeLevel && academy) {
                    // Get the gem requirements for the next upgrade
                    const nextLevel = spell.upgradeLevel + 1;
                    const gemsRequired = {};
                    for (const [gemType, baseCost] of Object.entries(spell.gems)) {
                        gemsRequired[gemType] = baseCost * nextLevel;
                    }
                    
                    // Check if player has enough gems
                    let canAfford = true;
                    for (const [gemType, cost] of Object.entries(gemsRequired)) {
                        if ((academy.gems[gemType] || 0) < cost) {
                            canAfford = false;
                            break;
                        }
                    }
                    
                    if (canAfford) {
                        // Deduct gems
                        for (const [gemType, cost] of Object.entries(gemsRequired)) {
                            academy.gems[gemType] -= cost;
                        }
                        
                        spell.upgradeLevel++;
                        
                        // Refresh all combination towers to apply the new upgrades
                        this.towerManager.towers.forEach(tower => {
                            if (tower.constructor.name === 'CombinationTower') {
                                this.towerManager.applyTowerBonuses(tower);
                            }
                        });
                        
                        if (this.stateManager.audioManager) {
                            this.stateManager.audioManager.playSFX('upgrade');
                        }
                        this.updateUI();
                        this.showSuperWeaponMenu(menuData);
                    }
                }
            }
        };
        
        // Remove any previous handler and add fresh one (using stored reference)
        if (panel._upgradeClickHandler) {
            panel.removeEventListener('click', panel._upgradeClickHandler);
        }
        panel._upgradeClickHandler = handleUpgradeClick;
        panel.addEventListener('click', panel._upgradeClickHandler);
        
        // Sell button listener
        const sellBtn = panel.querySelector('.sell-building-btn');
        if (sellBtn) {
            sellBtn.addEventListener('click', () => {
                this.towerManager.sellBuilding(menuData.building);
                this.updateUI();
                this.level.setPlacementPreview(0, 0, false);
                this.closePanelWithAnimation('superweapon-panel');
            }, { once: true });
        }

        // Lab level upgrade button hover
        const labLevelBtn = panel.querySelector('.forge-level-upgrade-btn');
        const labUpgrade = menuData.building.getLabUpgradeOption();
        if (labLevelBtn && labUpgrade) {
            labLevelBtn.addEventListener('mouseenter', () => {
                // Clear existing tooltips
                const existingTooltips = document.querySelectorAll('[data-superweapon-tooltip]');
                existingTooltips.forEach(tooltip => tooltip.remove());
                
                // Create hover menu
                const menu = document.createElement('div');
                menu.className = 'building-info-menu';
                menu.setAttribute('data-superweapon-tooltip', 'true');
                menu.innerHTML = `
                    <div class="info-title">${labUpgrade.name}</div>
                    <div class="info-description">${labUpgrade.description}</div>
                    ${labUpgrade.nextUnlock ? `<div style="border-top: 1px solid rgba(255, 215, 0, 0.3); padding-top: 0.3rem; margin-top: 0.3rem; color: #FFD700; font-size: 0.85rem;">${labUpgrade.nextUnlock}</div>` : ''}
                `;
                
                document.body.appendChild(menu);
                
                // Position the menu
                const btnRect = labLevelBtn.getBoundingClientRect();
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
            
            labLevelBtn.addEventListener('mouseleave', () => {
                const tooltips = document.querySelectorAll('[data-superweapon-tooltip]');
                tooltips.forEach(tooltip => tooltip.remove());
            });
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

        // Initialize castle defender state tracker for live updates
        const castle = castleData.castle;
        const hasDefender = castle.defender && !castle.defender.isDead();
        const hasCooldown = castle.defenderDeadCooldown > 0;
        this._castleDefenderState = hasDefender ? 'active' : (hasCooldown ? 'cooldown' : 'hire');
        
        // Castle upgrades menu - using panel-based system
        
        let contentHTML = '';
        
        const trainingGrounds = castleData.trainingGrounds;
        const forgeLevel = castleData.forgeLevel || 0;
        
        // Add castle health display and wall visual
        const maxHealth = castle.maxHealth;
        const currentHealth = castle.health;
        const healthPercent = (currentHealth / maxHealth) * 100;
        
        contentHTML += `
            <div class="forge-panel-header">
                <div class="forge-header-top">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 0.3rem;">
                        <div class="forge-icon-display"><img src="assets/towers/castle.png" alt="Castle" style="width: 100%; height: 100%; object-fit: contain;"></div>
                    </div>
                    <div class="forge-info-wrapper">
                        <div class="forge-title-row">
                            <div class="forge-name">Castle</div>
                        </div>
                        <div class="forge-effects-row">
                            <span class="effect-badge" id="castle-hp-text">${Math.round(currentHealth)}/${Math.round(maxHealth)} HP</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.4rem; margin-top: 0.3rem;">
                            <div style="flex: 1; height: 8px; background: rgba(0,0,0,0.5); border-radius: 3px; overflow: hidden; border: 1px solid #666;">
                                <div id="castle-hp-bar" style="height: 100%; width: ${healthPercent}%; background: linear-gradient(90deg, #ff4444, #ff9900);"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add castle upgrade options - only fortification (wall reinforcement is handled through TowerForge)
        const castleUpgrades = castle.getUpgradeOptions().filter(u => u.id === 'fortification');
        
        if (castleUpgrades.length > 0) {
            contentHTML += `<div class="upgrade-category"><div class="upgrade-category-header">Castle Upgrades</div>`;
            
            const fortReqLabels = ['Forge Lv2', 'Forge Lv3', 'Forge Lv5'];
            const fortHealthValues = [150, 200, 300];
            const fortCosts = [500, 1000, 1750];
            const maxFortAllowed = castle.getMaxFortificationAllowed(forgeLevel);
            
            castleUpgrades.forEach(upgrade => {
                const isMaxed = upgrade.level >= upgrade.maxLevel;
                const isLocked = !isMaxed && upgrade.level >= maxFortAllowed;
                const canAfford = !isLocked && upgrade.cost && this.gameState.gold >= upgrade.cost;
                const reqLabel = !isMaxed ? fortReqLabels[upgrade.level] : '';
                
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
                                ${!isMaxed ? `<div style="font-size: 0.75rem; color: ${isLocked ? '#ff9966' : '#aaffaa'}; margin-top: 0.2rem;">${isLocked ? `Locked - Requires ${reqLabel}` : `Available (${reqLabel})`}</div>` : ''}
                            </div>
                        </div>
                        <div class="upgrade-action-row">
                            <div class="upgrade-cost-display ${isMaxed ? 'maxed' : canAfford ? 'affordable' : ''}">
                                ${isMaxed ? 'MAX' : isLocked ? `Locked` : upgrade.cost ? `<span class="coin-xs"></span>${upgrade.cost}` : 'N/A'}
                            </div>
                            <button class="upgrade-button panel-upgrade-btn" 
                                    data-castle-upgrade="${upgrade.id}" 
                                    ${isMaxed || isLocked || !canAfford ? 'disabled' : ''}>
                                ${isMaxed ? 'MAX' : isLocked ? 'Locked' : 'Upgrade'}
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
                                    <span class="coin-xs"></span>${option.cost}
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
        
        this.showPanelWithoutClosing('castle-panel', 'Castle Upgrades', contentHTML);
        
        // Add event listeners for castle upgrades
        document.querySelectorAll('[data-castle-upgrade]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const upgradeId = btn.dataset.castleUpgrade;
                if (castle.purchaseUpgrade(upgradeId, this.gameState, forgeLevel)) {
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
            effectsList.push(`Archer: +${trainingGrounds.rangeUpgrades.archerTower.level * 15}`);
        }
        
        if (trainingGrounds.rangeUpgrades.basicTower.level > 0) {
            effectsList.push(`Watch: +${trainingGrounds.rangeUpgrades.basicTower.level * 15}`);
        }
        
        if (trainingGrounds.rangeUpgrades.cannonTower.level > 0) {
            effectsList.push(`Trebuchet: +${trainingGrounds.rangeUpgrades.cannonTower.level * 15}`);
        }
        
        if (trainingGrounds.upgrades.barricadeFireRate.level > 0) {
            const fireRate = (0.2 + trainingGrounds.upgrades.barricadeFireRate.level * 0.1).toFixed(1);
            effectsList.push(`Barricade: ${fireRate}/sec`);
        }
        
        if (trainingGrounds.upgrades.poisonArcherTowerFireRate.level > 0) {
            const fireRate = (0.8 + trainingGrounds.upgrades.poisonArcherTowerFireRate.level * 0.08).toFixed(2);
            effectsList.push(`Poison: ${fireRate}/sec`);
        }
        
        // Build HTML with professional header
        let contentHTML = `
            <div class="forge-panel-header">
                <div class="forge-header-top">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 0.3rem;">
                        <div class="forge-icon-display"><img src="assets/buildings/training.png" alt="Training Grounds" style="width: 100%; height: 100%; object-fit: contain;"></div>
                        <button class="upgrade-button sell-building-btn" data-building-id="training" style="background: #ff4444; padding: 0.2rem 0.5rem; margin: 0; font-size: 0.7rem; font-weight: 600; border: 1px solid rgba(255, 68, 68, 0.4); width: 100%; max-width: 80px;">
                            Sell
                        </button>
                    </div>
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
                                <span class="forge-benefit-label">Max Defender Level:</span>
                                <span class="forge-benefit-value">${trainingGrounds.defenderMaxLevel}</span>
                            </div>
                            ${trainingGrounds.defenderUnlocked ? `<div class="forge-benefit-item">
                                <span class="forge-benefit-label">Castle Defender:</span>
                                <span class="forge-benefit-value">Unlocked (Level ${trainingGrounds.defenderMaxLevel})</span>
                            </div>` : ''}
                            ${trainingGrounds.guardPostUnlocked ? `<div class="forge-benefit-item">
                                <span class="forge-benefit-label">Guard Post:</span>
                                <span class="forge-benefit-value">Unlocked</span>
                            </div>` : ''}
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
                        <span class="btn-cost">${isMaxed ? 'LV ' + trainingGrounds.trainingLevel : (trainingUpgrade && trainingUpgrade.cost ? '<span class="coin-xs"></span> ' + trainingUpgrade.cost : '—')}</span>
                    </div>
                </button>
            </div>
        `;

        // BUILD TOWER UPGRADES SECTION - Compact list
        if (trainingData.upgrades && trainingData.upgrades.length > 0) {
            contentHTML += `<div class="upgrade-category compact-upgrades">
                <div class="upgrade-category-header">TOWER TRAINING</div>`;
            
            trainingData.upgrades.forEach(upgrade => {
                const isMaxed = upgrade.level >= upgrade.maxLevel;
                const canAfford = upgrade.cost && this.gameState.gold >= upgrade.cost;
                const isLocked = upgrade.isUnlocked === false;
                
                let currentValue = '';
                let nextValue = '';
                
                // Calculate current and next values based on upgrade type
                if (upgrade.id && upgrade.id.startsWith('range_')) {
                    // Range upgrades
                    const currentRange = upgrade.level * 15;
                    const nextRange = (upgrade.level + 1) * 15;
                    currentValue = `+${currentRange} range`;
                    nextValue = `+${nextRange} range`;
                } else if (upgrade.id === 'barricadeFireRate') {
                    // Barricade fire rate
                    const currentRate = (0.2 + upgrade.level * 0.1).toFixed(1);
                    const nextRate = (0.2 + (upgrade.level + 1) * 0.1).toFixed(1);
                    currentValue = `${currentRate}/sec`;
                    nextValue = `${nextRate}/sec`;
                } else if (upgrade.id === 'poisonArcherTowerFireRate') {
                    // Poison archer fire rate
                    const currentRate = (0.8 + upgrade.level * 0.08).toFixed(2);
                    const nextRate = (0.8 + (upgrade.level + 1) * 0.08).toFixed(2);
                    currentValue = `${currentRate}/sec`;
                    nextValue = `${nextRate}/sec`;
                }
                
                // Build detailed tooltip for hover info (SuperWeaponLab style)
                let tooltipText = `<div style="font-weight: bold; margin-bottom: 0.3rem;">${upgrade.name}</div>`;
                tooltipText += `<div style="font-size: 0.75rem; color: #ddd; margin-bottom: 0.4rem;">${upgrade.description}</div>`;
                tooltipText += `<div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 0.3rem; font-size: 0.75rem;">`;
                tooltipText += `<div>Level: <span style="color: #FFD700;">${upgrade.level}/${upgrade.maxLevel}</span></div>`;
                
                if (upgrade.id && upgrade.id.startsWith('range_')) {
                    const curRange = upgrade.level * 15;
                    tooltipText += `<div>\uD83C\uDFAF Range Bonus: <span style="color: #FFD700;">+${curRange}px</span></div>`;
                } else if (upgrade.id === 'barricadeFireRate') {
                    const curRate = (0.2 + upgrade.level * 0.1).toFixed(1);
                    tooltipText += `<div>\u26A1 Fire Rate: <span style="color: #FFD700;">${curRate}/sec</span></div>`;
                } else if (upgrade.id === 'poisonArcherTowerFireRate') {
                    const curRate = (0.8 + upgrade.level * 0.08).toFixed(2);
                    tooltipText += `<div>\u26A1 Fire Rate: <span style="color: #FFD700;">${curRate}/sec</span></div>`;
                }
                
                if (!isMaxed && !isLocked) {
                    tooltipText += `<div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 0.3rem; margin-top: 0.3rem; color: #aaffaa;">`;
                    tooltipText += `<div style="font-weight: bold;">Next Upgrade (+1):</div>`;
                    if (upgrade.id && upgrade.id.startsWith('range_')) {
                        tooltipText += `<div>Range: +15px</div>`;
                    } else if (upgrade.id === 'barricadeFireRate') {
                        tooltipText += `<div>Fire Rate: +0.1/sec</div>`;
                    } else if (upgrade.id === 'poisonArcherTowerFireRate') {
                        tooltipText += `<div>Fire Rate: +0.08/sec</div>`;
                    }
                    if (upgrade.cost) tooltipText += `<div>Cost: <span style="color: #FFD700;"><span class="coin-xs"></span>${upgrade.cost}</span></div>`;
                    tooltipText += `</div>`;
                } else if (isLocked) {
                    tooltipText += `<div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 0.3rem; margin-top: 0.3rem; color: #ff9999;">`;
                    tooltipText += `<div style="font-weight: bold;">\uD83D\uDD12 Locked</div>`;
                    tooltipText += `<div>Upgrade Training Grounds to unlock</div>`;
                    tooltipText += `</div>`;
                }
                tooltipText += `</div>`;
                
                contentHTML += `
                    <div class="compact-upgrade-item ${isMaxed ? 'maxed' : ''} ${isLocked ? 'locked' : ''}" data-upgrade-id="${upgrade.id}" data-tooltip="${tooltipText.replace(/"/g, '&quot;')}">
                        <div class="compact-upgrade-left">
                            <span class="compact-upgrade-icon">${upgrade.icon}</span>
                            <div class="compact-upgrade-info">
                                <div class="compact-upgrade-name">${upgrade.name}</div>
                                <div class="compact-upgrade-values">
                                    <span class="current-value">${currentValue}</span>
                                    ${!isMaxed && nextValue ? `<span class="next-value-arrow">\u2192</span><span class="next-value">${nextValue}</span>` : '<span class="maxed-text">MAX</span>'}
                                </div>
                            </div>
                        </div>
                        <button class="compact-upgrade-btn panel-upgrade-btn" 
                                data-upgrade="${upgrade.id}" 
                                ${isMaxed || !canAfford || isLocked ? 'disabled' : ''}>
                            ${isMaxed ? 'MAX' : (isLocked ? 'max' : (upgrade.cost ? `<span class="coin-xs"></span>${upgrade.cost}` : '\u2014'))}
                        </button>
                    </div>
                `;
            });
            
            contentHTML += `</div>`;
        }
        
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
        
        // Upgrade hover info listeners (SuperWeaponLab style)
        panel.querySelectorAll('.compact-upgrade-item').forEach(item => {
            let tooltipTimeout;
            
            item.addEventListener('mouseenter', () => {
                clearTimeout(tooltipTimeout);
                
                const existingTooltips = document.querySelectorAll('[data-panel-tooltip]');
                existingTooltips.forEach(tooltip => tooltip.remove());
                
                const tooltipHTML = item.dataset.tooltip;
                if (!tooltipHTML) return;
                
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
                    pointer-events: none;
                `;
                
                document.body.appendChild(tooltip);
                
                const panelEl = document.getElementById('training-panel');
                const panelRect = panelEl.getBoundingClientRect();
                const rect = item.getBoundingClientRect();
                
                let leftPos = panelRect.left - tooltip.offsetWidth - 10;
                if (leftPos < 10) {
                    leftPos = rect.right + 10;
                }
                
                tooltip.style.left = leftPos + 'px';
                tooltip.style.top = (rect.top - tooltip.offsetHeight / 2 + rect.height / 2) + 'px';
                
                const tooltipRect = tooltip.getBoundingClientRect();
                if (tooltipRect.bottom > window.innerHeight) {
                    tooltip.style.top = (window.innerHeight - tooltip.offsetHeight - 10) + 'px';
                }
                if (tooltipRect.top < 0) {
                    tooltip.style.top = '10px';
                }
            });
            
            item.addEventListener('mouseleave', () => {
                const activeTooltips = document.querySelectorAll('[data-panel-tooltip]');
                activeTooltips.forEach(tooltip => tooltip.remove());
            });
        });
        
        // Training level upgrade button hover
        const trainingLevelBtn = panel.querySelector('.forge-level-upgrade-btn');
        if (trainingLevelBtn && trainingData.trainingUpgrade) {
            trainingLevelBtn.addEventListener('mouseenter', () => {
                // Clear existing tooltips
                const existingTooltips = document.querySelectorAll('[data-forge-tooltip]');
                existingTooltips.forEach(tooltip => tooltip.remove());
                
                // Create hover menu
                const menu = document.createElement('div');
                menu.className = 'building-info-menu';
                menu.setAttribute('data-forge-tooltip', 'true');
                menu.innerHTML = `
                    <div class="info-title">${trainingData.trainingUpgrade.name}</div>
                    <div class="info-description">${trainingData.trainingUpgrade.description}</div>
                    ${trainingData.trainingUpgrade.nextUnlock ? `<div style="border-top: 1px solid rgba(255, 215, 0, 0.3); padding-top: 0.3rem; margin-top: 0.3rem; color: #FFD700; font-size: 0.85rem;">${trainingData.trainingUpgrade.nextUnlock}</div>` : ''}
                `;
                
                document.body.appendChild(menu);
                
                // Position the menu
                const btnRect = trainingLevelBtn.getBoundingClientRect();
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
            
            trainingLevelBtn.addEventListener('mouseleave', () => {
                const tooltips = document.querySelectorAll('[data-forge-tooltip]');
                tooltips.forEach(tooltip => tooltip.remove());
            });
        }
        
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
        const modeIcon = goldMine.gemMode ? '◆' : '<span class="coin-xs"></span>';
        const modeText = goldMine.gemMode ? 'Gem Mining' : 'Gold Mining';
        
        // Calculate progress information
        const progressPercent = (goldMine.currentProduction / goldMine.productionTime) * 100;
        const timeRemaining = Math.max(0, goldMine.productionTime - goldMine.currentProduction);
        const readyStatus = goldMine.goldReady ? 'READY' : `${Math.ceil(timeRemaining)}s`;
        const readyColor = goldMine.goldReady ? '#4CAF50' : '#FFB800';
        
        let contentHTML = `
            <div class="forge-panel-header">
                <div class="forge-header-top">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 0.3rem;">
                        <div class="forge-icon-display"><img src="assets/buildings/mine.png" alt="Gold Mine" style="width: 100%; height: 100%; object-fit: contain;"></div>
                        <button class="upgrade-button sell-building-btn" data-building-id="goldmine" style="background: #ff4444; padding: 0.2rem 0.5rem; margin: 0; font-size: 0.7rem; font-weight: 600; border: 1px solid rgba(255, 68, 68, 0.4); width: 100%; max-width: 80px;">
                            Sell
                        </button>
                    </div>
                    <div class="forge-info-wrapper">
                        <div class="forge-title-row">
                            <div class="forge-name">Gold Mine</div>
                        </div>
                        <div class="forge-effects-row">
                            <span class="effect-badge">${modeIcon} ${modeText}</span>
                            <span class="effect-badge">${incomeInfo}/cycle</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.4rem; margin-top: 0.3rem;">
                            <div style="flex: 1; height: 12px; background: rgba(0,0,0,0.5); border-radius: 3px; overflow: hidden; border: 1px solid #666;">
                                <div id="goldmine-progress-bar" style="height: 100%; width: ${progressPercent}%; background: linear-gradient(90deg, #FFB800, #FFD700);"></div>
                            </div>
                            <div id="goldmine-timer" style="font-size: 0.7rem; color: ${readyColor}; font-weight: bold; min-width: 3rem; text-align: right;">${readyStatus}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add gem mining toggle if gem mining is unlocked
        if (goldMine.gemMiningUnlocked) {
            const toggleText = goldMine.gemMode ? '<span class="coin-xs"></span> Switch to Gold' : '◆ Switch to Gems';
            contentHTML += `
                <div style="padding: 0.6rem 0.85rem; border-top: 1px solid rgba(255, 215, 0, 0.2); display: flex; gap: 0.5rem;">
                    <button class="upgrade-button toggle-mine-mode-btn" style="background: ${goldMine.gemMode ? '#4169E1' : '#FFB800'}; flex: 1; margin: 0;">
                        ${toggleText}
                    </button>
                </div>
            `;
        }
        
        // Add collect button section if ready
        if (goldMine.goldReady) {
            contentHTML += `
                <div style="padding: 0.6rem 0.85rem; border-top: 1px solid rgba(255, 215, 0, 0.2); display: flex; gap: 0.5rem; justify-content: flex-end;">
                    <button class="upgrade-button collect-gold-btn" style="background: #44aa44; flex: 1; margin: 0;">
                        <span class="coin-xs"></span> Collect Now
                    </button>
                </div>
            `;
        }
        
        // Update panel title and content - set it directly, no fancy comparison
        const titleElement = panel.querySelector('.panel-title');
        if (titleElement) titleElement.textContent = 'Gold Mine';
        
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

        // Track this as the active menu for real-time updates
        this.activeMenuType = 'diamond-press';
        this.activeMenuData = menuData;
        this.lastGoldValue = this.gameState.gold;
        this.lastGemValues = { ...this.towerManager.getGemStocks() };

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
        const sellRefund = Math.floor(500 * 0.7);
        let contentHTML = `
            <div class="forge-panel-header">
                <div class="forge-header-top">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 0.3rem;">
                        <div class="forge-icon-display"><img src="assets/buildings/diamondpress.png" alt="Diamond Press" style="width: 100%; height: 100%; object-fit: contain;"></div>
                        <button class="upgrade-button sell-building-btn" style="background: #ff4444; padding: 0.2rem 0.5rem; margin: 0; font-size: 0.7rem; font-weight: 600; border: 1px solid rgba(255, 68, 68, 0.4); width: 100%; max-width: 80px;">
                            Sell
                        </button>
                    </div>
                    <div class="forge-info-wrapper">
                        <div class="forge-title-row">
                            <div class="forge-name">Diamond Press</div>
                        </div>
                        <div class="forge-effects-row">
                            <span class="effect-badge">Diamonds: ${diamond}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="upgrade-category">
                <div class="upgrade-category-header">Gem Exchange</div>

                <div style="padding: 0.5rem 0.85rem;">
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.3rem; margin-bottom: 0.5rem;">
                        <div style="padding: 0.4rem 0.2rem; background: rgba(255, 100, 0, ${fire >= 3 ? '0.25' : '0.1'}); border: 1px solid rgba(255, 100, 0, ${fire >= 3 ? '0.5' : '0.2'}); border-radius: 4px; text-align: center;">
                            <div style="display: flex; justify-content: center; margin-bottom: 0.15rem;">${this.getElementGemHTML('fire', '16px')}</div>
                            <div style="color: ${fire >= 3 ? '#FFD700' : '#888'}; font-weight: bold; font-size: 0.85rem;">${fire}<span style="font-size: 0.7rem; color: #666;">/3</span></div>
                        </div>
                        <div style="padding: 0.4rem 0.2rem; background: rgba(100, 150, 255, ${water >= 3 ? '0.25' : '0.1'}); border: 1px solid rgba(100, 150, 255, ${water >= 3 ? '0.5' : '0.2'}); border-radius: 4px; text-align: center;">
                            <div style="display: flex; justify-content: center; margin-bottom: 0.15rem;">${this.getElementGemHTML('water', '16px')}</div>
                            <div style="color: ${water >= 3 ? '#FFD700' : '#888'}; font-weight: bold; font-size: 0.85rem;">${water}<span style="font-size: 0.7rem; color: #666;">/3</span></div>
                        </div>
                        <div style="padding: 0.4rem 0.2rem; background: rgba(200, 200, 255, ${air >= 3 ? '0.25' : '0.1'}); border: 1px solid rgba(200, 200, 255, ${air >= 3 ? '0.5' : '0.2'}); border-radius: 4px; text-align: center;">
                            <div style="display: flex; justify-content: center; margin-bottom: 0.15rem;">${this.getElementGemHTML('air', '16px')}</div>
                            <div style="color: ${air >= 3 ? '#FFD700' : '#888'}; font-weight: bold; font-size: 0.85rem;">${air}<span style="font-size: 0.7rem; color: #666;">/3</span></div>
                        </div>
                        <div style="padding: 0.4rem 0.2rem; background: rgba(100, 200, 100, ${earth >= 3 ? '0.25' : '0.1'}); border: 1px solid rgba(100, 200, 100, ${earth >= 3 ? '0.5' : '0.2'}); border-radius: 4px; text-align: center;">
                            <div style="display: flex; justify-content: center; margin-bottom: 0.15rem;">${this.getElementGemHTML('earth', '16px')}</div>
                            <div style="color: ${earth >= 3 ? '#FFD700' : '#888'}; font-weight: bold; font-size: 0.85rem;">${earth}<span style="font-size: 0.7rem; color: #666;">/3</span></div>
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.4rem; margin-bottom: 0.5rem; background: rgba(100, 200, 255, 0.1); border: 1px solid rgba(100, 200, 255, 0.25); border-radius: 4px;">
                        <span style="font-size: 0.8rem; color: #bbb;">3 each →</span>
                        <span style="font-size: 1.2rem; font-weight: bold; color: #64dfff;">◆ 1</span>
                    </div>

                    <button id="exchange-gems-btn" class="upgrade-button panel-upgrade-btn" style="width: 100%; padding: 0.55rem; font-size: 0.85rem; font-weight: 600; margin: 0; ${!canExchange ? 'opacity: 0.5; cursor: not-allowed;' : ''};" ${!canExchange ? 'disabled' : ''}>
                        ${canExchange ? 'Press Diamond' : 'Need 3 of each gem'}
                    </button>
                </div>
            </div>
        `;

        // Update panel title and content
        const titleElement = panel.querySelector('.panel-title');
        if (titleElement) titleElement.textContent = 'Diamond Press';

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
        const readyStatus = goldMine.goldReady ? 'READY' : `${Math.ceil(timeRemaining)}s`;
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

    // ============ ENEMY INTEL PANEL ============

    showEnemyIntelMenu(enemy) {
        this.closeOtherPanelsImmediate('enemy-intel-panel');

        this.activeMenuType = 'enemy-intel';
        this.activeMenuData = { enemy };

        const enemyType = enemy.type || '';
        const marketplaceSystem = this.stateManager.marketplaceSystem;
        const unlockedPacks = marketplaceSystem ? marketplaceSystem.getUnlockedEnemyIntel() : [];
        const unlockedEnemies = EnemyIntelRegistry.getUnlockedEnemies(unlockedPacks);
        const hasIntel = unlockedEnemies.includes(enemyType);
        const intel = EnemyIntelRegistry.getEnemyIntel(enemyType);
        const displayName = intel ? intel.name : (enemyType ? enemyType.charAt(0).toUpperCase() + enemyType.slice(1) : 'Unknown Enemy');

        let contentHTML;

        if (!hasIntel) {
            contentHTML = `
                <div class="forge-panel-header">
                    <div class="forge-header-top">
                        <div class="forge-icon-display" style="font-size: 1.6rem; color: rgba(180,160,100,0.5);">?</div>
                        <div class="forge-info-wrapper">
                            <div class="forge-title-row">
                                <div class="forge-name" style="color: rgba(180,160,100,0.7);">Unknown Enemy</div>
                            </div>
                            <div style="font-size: 0.7rem; color: rgba(200,180,100,0.8); margin-top: 0.3rem; line-height: 1.4;">
                                Improve your intel gathering to understand the stats of this enemy. Purchase a Spy Report from the Marketplace.
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            const hpPct = enemy.maxHealth > 0 ? Math.max(0, Math.min(100, (enemy.health / enemy.maxHealth) * 100)) : 0;
            const hpBarColor = hpPct > 60 ? '#5acd5a' : (hpPct > 30 ? '#d4af37' : '#cc4444');
            const armourVal = typeof enemy.armour === 'number' ? Math.round(enemy.armour) : 0;
            const magicResVal = typeof enemy.magicResistance === 'number' ? Math.round(enemy.magicResistance * 100) : 0;
            const speedVal = typeof enemy.speed === 'number' ? Math.round(enemy.speed) : 0;
            const atkDmgVal = typeof enemy.attackDamage === 'number' ? Math.round(enemy.attackDamage) : 0;
            const hpDisplay = `${Math.max(0, Math.round(enemy.health))} / ${Math.round(enemy.maxHealth)}`;

            contentHTML = `
                <div class="forge-panel-header" id="enemy-intel-header">
                    <div class="forge-header-top">
                        <div class="forge-icon-display" style="padding: 2px;">${intel && intel.image ? `<img src="${intel.image}" style="width:100%;height:100%;object-fit:contain;image-rendering:pixelated;" alt="${displayName}">` : '?'}</div>
                        <div class="forge-info-wrapper">
                            <div class="forge-title-row">
                                <div class="forge-name">${displayName}</div>
                            </div>
                            <div style="margin-top: 0.3rem;">
                                <div style="font-size: 0.65rem; color: rgba(200,180,120,0.8); margin-bottom: 0.2rem;">Health</div>
                                <div class="forge-level-bar" style="margin-bottom: 0.2rem;">
                                    <div id="enemy-hp-bar-fill" class="forge-level-bar-fill" style="width: ${hpPct.toFixed(1)}%; background: ${hpBarColor};"></div>
                                </div>
                                <div id="enemy-hp-text" style="font-size: 0.7rem; color: rgba(220,200,150,0.9);">${hpDisplay}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; padding: 0.2rem 0;">
                    <div style="background: rgba(0,0,0,0.25); border: 1px solid rgba(212,175,55,0.2); border-radius: 0.3rem; padding: 0.4rem 0.5rem;">
                        <div style="font-size: 0.6rem; color: rgba(180,160,100,0.7); text-transform: uppercase; letter-spacing: 0.5px;">Speed</div>
                        <div id="enemy-stat-speed" style="font-size: 0.85rem; color: #FFD700; font-weight: bold;">${speedVal}</div>
                    </div>
                    <div style="background: rgba(0,0,0,0.25); border: 1px solid rgba(212,175,55,0.2); border-radius: 0.3rem; padding: 0.4rem 0.5rem;">
                        <div style="font-size: 0.6rem; color: rgba(180,160,100,0.7); text-transform: uppercase; letter-spacing: 0.5px;">Armour</div>
                        <div id="enemy-stat-armour" style="font-size: 0.85rem; color: #FFD700; font-weight: bold;">${armourVal}</div>
                    </div>
                    <div style="background: rgba(0,0,0,0.25); border: 1px solid rgba(212,175,55,0.2); border-radius: 0.3rem; padding: 0.4rem 0.5rem;">
                        <div style="font-size: 0.6rem; color: rgba(180,160,100,0.7); text-transform: uppercase; letter-spacing: 0.5px;">Magic Resist</div>
                        <div id="enemy-stat-magic" style="font-size: 0.85rem; color: #FFD700; font-weight: bold;">${magicResVal}%</div>
                    </div>
                    <div style="background: rgba(0,0,0,0.25); border: 1px solid rgba(212,175,55,0.2); border-radius: 0.3rem; padding: 0.4rem 0.5rem;">
                        <div style="font-size: 0.6rem; color: rgba(180,160,100,0.7); text-transform: uppercase; letter-spacing: 0.5px;">Atk Damage</div>
                        <div id="enemy-stat-atk" style="font-size: 0.85rem; color: #FFD700; font-weight: bold;">${atkDmgVal}</div>
                    </div>
                </div>
                ${intel && intel.description ? `<div style="font-size: 0.65rem; color: rgba(200,180,120,0.75); margin-top: 0.4rem; line-height: 1.4; border-top: 1px solid rgba(212,175,55,0.15); padding-top: 0.4rem;">${intel.description}</div>` : ''}
            `;
        }

        this.showPanelWithoutClosing('enemy-intel-panel', displayName, contentHTML);
    }

    updateEnemyIntelLive() {
        if (!this.activeMenuData || !this.activeMenuData.enemy) return;

        const enemy = this.activeMenuData.enemy;

        // Close panel if enemy is dead or has reached the end
        if (enemy.health <= 0 || enemy.reachedEnd) {
            this.closePanelWithAnimation('enemy-intel-panel');
            return;
        }

        const hpFill = document.getElementById('enemy-hp-bar-fill');
        const hpText = document.getElementById('enemy-hp-text');
        const speedEl = document.getElementById('enemy-stat-speed');
        const armourEl = document.getElementById('enemy-stat-armour');
        const magicEl = document.getElementById('enemy-stat-magic');
        const atkEl = document.getElementById('enemy-stat-atk');

        if (!hpFill) return; // Panel not in intel-unlocked state (locked message shown)

        const hpPct = enemy.maxHealth > 0 ? Math.max(0, Math.min(100, (enemy.health / enemy.maxHealth) * 100)) : 0;
        const hpBarColor = hpPct > 60 ? '#5acd5a' : (hpPct > 30 ? '#d4af37' : '#cc4444');

        hpFill.style.width = hpPct.toFixed(1) + '%';
        hpFill.style.background = hpBarColor;

        if (hpText) {
            hpText.textContent = `${Math.max(0, Math.round(enemy.health))} / ${Math.round(enemy.maxHealth)}`;
        }
        if (speedEl) speedEl.textContent = typeof enemy.speed === 'number' ? Math.round(enemy.speed) : 0;
        if (armourEl) armourEl.textContent = typeof enemy.armour === 'number' ? Math.round(enemy.armour) : 0;
        if (magicEl) magicEl.textContent = (typeof enemy.magicResistance === 'number' ? Math.round(enemy.magicResistance * 100) : 0) + '%';
        if (atkEl) atkEl.textContent = typeof enemy.attackDamage === 'number' ? Math.round(enemy.attackDamage) : 0;
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
                diamondPressCount: unlockSystem?.diamondPressCount || 0,
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
        
        // Unpause the game before quitting
        this.gameplayState.setPaused(false);
        
        // Small delay to ensure menu closes visually before state change
        setTimeout(() => {
            // Return to the campaign map (levelSelect) the player came from
            this.stateManager.changeState('levelSelect');
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

        // New: ✕ close button for quit warning modal
        const quitCloseBtn = document.getElementById('quit-close-btn');
        if (quitCloseBtn) {
            quitCloseBtn.addEventListener('click', () => {
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

        // New: ✕ close button for restart warning modal
        const restartCloseBtn = document.getElementById('restart-close-btn');
        if (restartCloseBtn) {
            restartCloseBtn.addEventListener('click', () => {
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

        // Read current volumes from AudioManager so sliders show correct state
        const currentMusicVol = this.stateManager.audioManager
            ? Math.round(this.stateManager.audioManager.getMusicVolume() * 100) : 70;
        const currentSFXVol = this.stateManager.audioManager
            ? Math.round(this.stateManager.audioManager.getSFXVolume() * 100) : 80;

        content.innerHTML = `
            <div class="ingame-options-body">
                <div class="ingame-options-row">
                    <label class="ingame-options-label">Music Volume</label>
                    <div class="ingame-options-slider-row">
                        <input type="range" id="music-volume-slider" min="0" max="100" value="${currentMusicVol}" class="ingame-options-slider">
                        <span id="music-volume-display" class="ingame-options-pct">${currentMusicVol}%</span>
                    </div>
                </div>
                <div class="ingame-options-row">
                    <label class="ingame-options-label">Sound Effects</label>
                    <div class="ingame-options-slider-row">
                        <input type="range" id="sfx-volume-slider" min="0" max="100" value="${currentSFXVol}" class="ingame-options-slider">
                        <span id="sfx-volume-display" class="ingame-options-pct">${currentSFXVol}%</span>
                    </div>
                </div>
                <div class="ingame-options-divider"></div>
                <button id="ingame-controls-btn" class="ingame-options-support-btn">Controls</button>
                <div class="ingame-options-divider"></div>
                <button id="ingame-support-btn" class="ingame-options-support-btn">\u2764\ufe0f  Support the Developer</button>
            </div>
        `;

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

        const supportBtn = document.getElementById('ingame-support-btn');
        if (supportBtn) {
            supportBtn.addEventListener('click', () => {
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
                if (typeof window !== 'undefined' && window.__TAURI__) {
                    window.__TAURI__.shell.open('https://www.patreon.com/c/LilysLittleGames');
                } else {
                    window.open('https://www.patreon.com/c/LilysLittleGames', '_blank');
                }
            });
        }

        const controlsBtn = document.getElementById('ingame-controls-btn');
        if (controlsBtn) {
            controlsBtn.addEventListener('click', () => {
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
                this.openControlsScreen();
            });
        }
    }

    openControlsScreen() {
        if (!this._controlsScreen) {
            this._controlsScreen = new ControlsScreen(
                this.stateManager.inputManager,
                this.stateManager.audioManager
            );
        }
        this._controlsScreen.show();
        // Refresh hotkey badges after controls change
        const checkClosed = setInterval(() => {
            if (!this._controlsScreen.isVisible()) {
                clearInterval(checkClosed);
                this.updateHotkeyBadges();
            }
        }, 200);
    }
}
