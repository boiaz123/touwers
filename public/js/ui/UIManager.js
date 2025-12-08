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
                console.log(`updateButtonStates: superweapon - isUnlocked: ${isUnlocked}, superweaponUnlocked: ${this.towerManager.unlockSystem.superweaponUnlocked}`);
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
                    console.log(`UIManager: Speed ${speed}x clicked`);
                    this.gameplayState.setGameSpeed(speed);
                    this.updateSpeedCircles(speed);
                });
            });
            console.log('UIManager: Speed circles setup complete');
        } else {
            console.log('UIManager: Speed circles not found');
        }

        // Initial button state update
        this.updateButtonStates();
    }

    removeUIEventListeners() {
        document.querySelectorAll('.tower-btn, .building-btn, .spell-btn').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });
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
                <div><span>Rate:</span> <span>${info.fireRate}</span></div>
            </div>
            <div class="info-description">${info.description}</div>
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
            }
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
                <div><span>Cost:</span> <span>$${info.cost}</span></div>
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
        
        // Only rebuild if the number of spells changed (new unlock)
        if (currentButtonCount !== availableSpells.length) {
            console.log(`UIManager: Rebuilding spell buttons - count changed from ${currentButtonCount} to ${availableSpells.length}`);
            spellButtonsList.innerHTML = '';
            
            // Create a button for each unlocked spell
            availableSpells.forEach(spell => {
                const btn = document.createElement('button');
                btn.className = 'spell-btn';
                btn.dataset.spellId = spell.id;
                btn.title = `${spell.name}: ${spell.description}`;
                btn.innerHTML = `<span>${spell.icon}</span>`;
                
                // Add click listener that will work permanently
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(`UIManager: Spell button clicked for ${spell.id}, currentCooldown: ${spell.currentCooldown}`);
                    if (spell.currentCooldown === 0) {
                        console.log(`UIManager: ✓ Activating spell targeting for ${spell.id}`);
                        this.gameplayState.activateSpellTargeting(spell.id);
                    } else {
                        console.log(`UIManager: Spell ${spell.id} is on cooldown`);
                    }
                });
                
                spellButtonsList.appendChild(btn);
            });
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
            document.getElementById('wave').textContent = `${this.gameplayState.gameState.wave}/${this.gameplayState.maxWavesForLevel}`;
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
            console.log('UIManager: updateUI - Current gems:', gems);
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
                console.log(`updateUIAvailability: superweapon - isUnlocked: ${isUnlocked}, superweaponUnlocked: ${unlockSystem.superweaponUnlocked}`);
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

    // ============ UPGRADE MENUS ============

    showForgeUpgradeMenu(forgeData) {
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
                
                // Calculate current effect display
                let currentEffect = '';
                if (upgrade.id === 'basicDamage') {
                    currentEffect = `Damage: +${upgrade.level * upgrade.effect}`;
                } else if (upgrade.id === 'barricadeDamage') {
                    currentEffect = `Damage: +${upgrade.level * upgrade.effect}`;
                } else if (upgrade.id === 'fireArrows') {
                    currentEffect = `${upgrade.level > 0 ? 'Active' : 'Inactive'} - Burn effect enabled`;
                } else if (upgrade.id === 'poisonDamage') {
                    currentEffect = `Poison: +${upgrade.level * upgrade.effect}`;
                } else if (upgrade.id === 'explosiveRadius') {
                    currentEffect = `Radius: +${upgrade.level * upgrade.effect}px`;
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
                            </div>
                        </div>
                        <div class="upgrade-action-row">
                            <div class="upgrade-cost-display ${isMaxed ? 'maxed' : canAfford ? 'affordable' : ''}">
                                ${isMaxed ? 'MAX' : `$${upgrade.cost}`}
                            </div>
                            <button class="upgrade-button panel-upgrade-btn" 
                                    data-upgrade="${upgrade.id}" 
                                    ${isMaxed || !canAfford ? 'disabled' : ''}>
                                ${isMaxed ? 'MAX' : 'Upgrade'}
                            </button>
                        </div>
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
                        // Notify unlock system of forge upgrade
                        unlockSystem.onForgeUpgraded(forgeData.forge.getForgeLevel());
                        this.updateUI();
                        this.updateUIAvailability();
                        
                        // Refresh the panel
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
                        
                        // Refresh the panel
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
            'basic-tower-panel'
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
            'basic-tower-panel'
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
        console.log('UIManager: Showing academy upgrade menu', academyData);
        
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
                    if (academyData.academy.researchGemMiningTools(this.gameState)) {
                        this.towerManager.getUnlockSystem().onGemMiningResearched();
                        this.towerManager.buildingManager.buildings.forEach(building => {
                            if (building.constructor.name === 'GoldMine') {
                                building.setAcademy(academyData.academy);
                            }
                        });
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
                this.towerManager.buildingManager.sellBuilding(academyData.academy);
                this.updateUI();
                this.closePanelWithAnimation('academy-panel');
            }, { once: true });
        }
    }

    showMagicTowerElementMenu(towerData) {
        const panel = document.getElementById('magic-tower-panel');
        if (!panel) {
            console.error('UIManager: Magic tower panel not found');
            return;
        }
        
        console.log('UIManager: Showing magic tower element menu', towerData);
        
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
                
                console.log(`UIManager: Magic tower element selected: ${elementId}`);
                
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
                this.closePanelWithAnimation('magic-tower-panel');
            }, { once: true });
        }
    }

    showCombinationTowerMenu(towerData) {
        const panel = document.getElementById('combination-tower-panel');
        if (!panel) {
            console.error('UIManager: Combination tower panel not found');
            return;
        }
        
        console.log('UIManager: Showing combination tower spell menu', towerData);
        
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
                
                console.log(`UIManager: Combination tower spell selected: ${spellId}`);
                
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
                this.closePanelWithAnimation('combination-tower-panel');
            }, { once: true });
        }
    }

    showGuardPostMenu(towerData) {
        const panel = document.getElementById('basic-tower-panel');
        if (!panel) {
            console.error('UIManager: Panel not found for Guard Post menu');
            return;
        }

        console.log('UIManager: Showing Guard Post menu', towerData);

        const tower = towerData.tower;
        const towerInfo = tower.constructor.getInfo();
        const gameState = towerData.gameState;
        
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
                // Show hiring option
                const canAfford = gameState.gold >= 100;
                contentHTML += `
                    <div class="upgrade-category" style="padding: 0.6rem 0.85rem; border-top: 1px solid rgba(255, 215, 0, 0.2);">
                        <div class="panel-upgrade-item">
                            <div class="upgrade-header-row">
                                <div class="upgrade-icon-section">🛡️</div>
                                <div class="upgrade-info-section">
                                    <div class="upgrade-name">Hire Defender L1</div>
                                    <div class="upgrade-description">Summons a Level 1 defender to guard this post</div>
                                </div>
                            </div>
                            <div class="upgrade-action-row">
                                <div class="upgrade-cost-display">$100</div>
                                <button class="upgrade-button hire-defender-btn" ${!canAfford ? 'disabled' : ''}>
                                    ${canAfford ? 'Hire' : 'Not Enough Gold'}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
        } else {
            // Defender is active
            contentHTML += `
                <div class="upgrade-category" style="padding: 0.6rem 0.85rem; border-top: 1px solid rgba(255, 215, 0, 0.2);">
                    <div class="panel-upgrade-item">
                        <div class="upgrade-header-row">
                            <div class="upgrade-icon-section">✅</div>
                            <div class="upgrade-info-section">
                                <div class="upgrade-name">Defender Active</div>
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

        // Setup hire defender button
        const hireBtn = panel.querySelector('.hire-defender-btn');
        if (hireBtn) {
            hireBtn.addEventListener('click', () => {
                if (tower.hireDefender(gameState)) {
                    console.log('UIManager: Defender hired successfully');
                    this.updateUI();
                    // Refresh menu
                    this.showGuardPostMenu(towerData);
                }
            }, { once: true });
        }

        // Setup sell button
        const sellBtn = panel.querySelector('.sell-tower-btn');
        if (sellBtn) {
            sellBtn.addEventListener('click', () => {
                this.towerManager.sellTower(tower);
                this.updateUI();
                this.closePanelWithAnimation('basic-tower-panel');
            }, { once: true });
        }
    }

    showTowerStatsMenu(towerData) {
        // Generic tower stats menu for any tower type
        console.log('UIManager: Showing tower stats menu', towerData);
        
        const tower = towerData.tower;
        const towerInfo = tower.constructor.getInfo();
        
        const stats = {
            name: towerInfo.name,
            damage: tower.damage,
            range: tower.range,
            fireRate: tower.fireRate,
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
                <div style="font-size: 0.8rem; color: #c9a876; margin-bottom: 0.4rem;">💨 Fire Rate: <span style="color: #FFD700; font-weight: bold;">${stats.fireRate}/sec</span></div>
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
                this.closePanelWithAnimation('basic-tower-panel');
            });
        }
    }

    showBasicTowerStatsMenu(towerData) {
        // Basic tower stats menu - using panel-based system
        
        console.log('UIManager: Showing basic tower stats menu', towerData);
        
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
            this.closePanelWithAnimation('basic-tower-panel');
        });
    }

    showSuperWeaponMenu(menuData) {
        const panel = document.getElementById('superweapon-panel');
        if (!panel) {
            console.error('UIManager: SuperWeapon panel not found');
            return;
        }
        
        console.log('UIManager: showSuperWeaponMenu called with:', menuData);
        
        let contentHTML = '';
        
        // Add lab level upgrade
        const labUpgrade = menuData.building.getLabUpgradeOption();
        if (labUpgrade) {
            console.log('UIManager: Adding lab upgrade option:', labUpgrade);
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
                            <div class="upgrade-cost-display ${isMaxed ? 'maxed' : this.gameState.gold >= labUpgrade.cost ? 'affordable' : 'unavailable'}">
                                ${isMaxed ? 'MAX' : `$${labUpgrade.cost}`}
                            </div>
                            <button class="upgrade-button panel-upgrade-btn" data-upgrade="lab_upgrade" 
                                    ${isMaxed || this.gameState.gold < labUpgrade.cost ? 'disabled' : ''}>
                                ${isMaxed ? 'MAX' : 'Upgrade'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Add spell unlocks and upgrades in categories
        console.log('UIManager: Processing spells:', menuData.spells.length);
        
        // Organize spells into categories
        const unlockedSpells = menuData.spells.filter(s => s.unlocked);
        const lockedSpells = menuData.spells.filter(s => !s.unlocked);
        
        // Add unlocked spells first
        if (unlockedSpells.length > 0) {
            contentHTML += `<div class="upgrade-category-header" style="padding: 0.6rem 0.85rem; color: #FFD700; font-weight: bold; border-bottom: 1px solid rgba(255, 215, 0, 0.3); margin-top: 0.6rem;">Unlocked Spells</div>`;
            
            unlockedSpells.forEach(spell => {
                const upgradeCost = spell.upgradeCost * spell.level;
                const isMaxed = spell.level >= spell.maxLevel;
                
                console.log(`UIManager: Creating upgrade for ${spell.id}, cost: ${upgradeCost}, maxed: ${isMaxed}`);
                contentHTML += `
                    <div class="upgrade-category">
                        <div class="panel-upgrade-item ${isMaxed ? 'maxed' : ''}">
                            <div class="upgrade-header-row">
                                <div class="upgrade-icon-section">${spell.icon}</div>
                                <div class="upgrade-info-section">
                                    <div class="upgrade-name">${spell.name}</div>
                                    <div class="upgrade-description">${spell.description}</div>
                                    <div class="upgrade-level-display">
                                        Level: ${spell.level}/${spell.maxLevel}
                                        <div class="upgrade-level-bar">
                                            <div class="upgrade-level-bar-fill" style="width: ${(spell.level / spell.maxLevel) * 100}%"></div>
                                        </div>
                                    </div>
                                    <div style="font-size: 0.75rem; color: #a88; margin-top: 0.3rem;">Cooldown: ${spell.cooldown.toFixed(1)}s</div>
                                </div>
                            </div>
                            <div class="upgrade-action-row">
                                <div class="upgrade-cost-display ${isMaxed ? 'maxed' : this.gameState.gold >= upgradeCost ? 'affordable' : 'unavailable'}">
                                    ${isMaxed ? 'MAX' : `$${upgradeCost}`}
                                </div>
                                <button class="upgrade-button panel-upgrade-btn" data-spell-upgrade="${spell.id}" 
                                        ${isMaxed || this.gameState.gold < upgradeCost ? 'disabled' : ''}>
                                    ${isMaxed ? 'MAX' : 'Upgrade'}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        
        // Add locked spells
        if (lockedSpells.length > 0) {
            contentHTML += `<div class="upgrade-category-header" style="padding: 0.6rem 0.85rem; color: #888; font-weight: bold; border-bottom: 1px solid rgba(136, 136, 136, 0.3); margin-top: 0.6rem;">🔒 Locked Spells</div>`;
            
            lockedSpells.forEach(spell => {
                console.log(`UIManager: Creating unlock button for ${spell.id}`);
                contentHTML += `
                    <div class="upgrade-category">
                        <div class="panel-upgrade-item locked">
                            <div class="upgrade-header-row">
                                <div class="upgrade-icon-section">${spell.icon}</div>
                                <div class="upgrade-info-section">
                                    <div class="upgrade-name">${spell.name}</div>
                                    <div class="upgrade-description">${spell.description}</div>
                                    <div style="font-size: 0.75rem; color: #888; margin-top: 0.3rem;">🔒 Locked</div>
                                </div>
                            </div>
                            <div class="upgrade-action-row">
                                <div class="upgrade-cost-display ${this.gameState.gold >= spell.unlockCost ? 'affordable' : 'unavailable'}">
                                    $${spell.unlockCost}
                                </div>
                                <button class="upgrade-button panel-upgrade-btn" data-spell-unlock="${spell.id}"
                                        ${this.gameState.gold < spell.unlockCost ? 'disabled' : ''}>
                                    Unlock
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
        
        // Show the panel
        panel.style.display = 'flex';
        panel.classList.remove('closing');
        
        // Setup close button
        const closeBtn = panel.querySelector('.panel-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closePanelWithAnimation('superweapon-panel'), { once: true });
        }
        
        // Add button handlers
        panel.querySelectorAll('.panel-upgrade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (e.target.dataset.upgrade === 'lab_upgrade') {
                    if (menuData.building.purchaseLabUpgrade(this.gameState)) {
                        this.updateUI();
                        this.showSuperWeaponMenu(menuData);
                    }
                } else if (e.target.dataset.spellUnlock) {
                    const spellId = e.target.dataset.spellUnlock;
                    if (menuData.building.unlockSpell(spellId, this.gameState)) {
                        this.updateUI();
                        this.showSuperWeaponMenu(menuData);
                    }
                } else if (e.target.dataset.spellUpgrade) {
                    const spellId = e.target.dataset.spellUpgrade;
                    if (menuData.building.upgradeSpell(spellId, this.gameState)) {
                        this.updateUI();
                        this.showSuperWeaponMenu(menuData);
                    }
                }
            }, { once: true });
        });
        
        // Add sell button listener
        const sellBtn = panel.querySelector('.sell-building-btn');
        if (sellBtn) {
            sellBtn.addEventListener('click', () => {
                this.towerManager.buildingManager.sellBuilding(menuData.building);
                this.updateUI();
                this.closePanelWithAnimation('superweapon-panel');
            }, { once: true });
        }
    }

    showGuardPostMenu(guardPostData) {
        const panel = document.getElementById('guard-post-panel');
        if (!panel) {
            console.error('UIManager: Guard post panel not found');
            return;
        }
        
        const tower = guardPostData.tower;
        const contentArea = panel.querySelector('.panel-content');
        if (!contentArea) {
            console.error('UIManager: Guard post content area not found');
            return;
        }
        
        let contentHTML = '<div class="tower-menu-content">';
        
        // Guard post info
        contentHTML += `
            <div class="tower-stats-section">
                <div class="stat-item">
                    <span class="stat-label">Guard Post</span>
                    <span class="stat-value">Tower</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Health</span>
                    <span class="stat-value">${tower.health}/${tower.maxHealth}</span>
                </div>
            </div>
        `;
        
        // Defender section
        if (tower.defender && !tower.defender.isDead()) {
            contentHTML += `
                <div class="defender-section">
                    <div class="defender-status">
                        <span class="defender-status-label">Defender Status: ACTIVE</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Defender Health</span>
                        <span class="stat-value">${tower.defender.health}/${tower.defender.maxHealth}</span>
                    </div>
                </div>
            `;
        } else if (tower.defenderDeadCooldown > 0) {
            contentHTML += `
                <div class="defender-section">
                    <div class="defender-status">
                        <span class="defender-status-label">Cooldown: ${tower.defenderDeadCooldown.toFixed(1)}s</span>
                    </div>
                </div>
            `;
        } else {
            contentHTML += `
                <div class="defender-hiring-section">
                    <button class="hire-defender-btn" data-level="1">
                        <span class="hire-button-label">Hire Level 1 Defender</span>
                        <span class="hire-button-cost">100g</span>
                    </button>
                </div>
            `;
        }
        
        contentHTML += '</div>';
        contentArea.innerHTML = contentHTML;
        
        // Add event listener for hiring button
        const hireBtn = contentArea.querySelector('.hire-defender-btn');
        if (hireBtn) {
            hireBtn.addEventListener('click', () => {
                if (tower.hireDefender(this.gameState)) {
                    this.updateUI();
                    this.showGuardPostMenu(guardPostData);
                } else {
                    console.log('UIManager: Failed to hire defender');
                }
            }, { once: true });
        }
        
        // Show the panel
        this.showPanelWithAnimation('guard-post-panel');
    }

    showCastleUpgradeMenu(castleData) {
        // Castle upgrades menu - using panel-based system
        
        let contentHTML = '';
        
        const castle = castleData.castle;
        const trainingGrounds = castleData.trainingGrounds;
        const maxHealth = castle.maxHealth;
        const currentHealth = castle.health;
        const healthPercent = (currentHealth / maxHealth) * 100;
        
        contentHTML += `
            <div class="upgrade-category">
                <div class="panel-upgrade-item">
                    <div class="upgrade-header-row">
                        <div class="upgrade-icon-section">🛡️</div>
                        <div class="upgrade-info-section">
                            <div class="upgrade-name">Reinforced Walls</div>
                            <div class="upgrade-description">Improve castle defenses and structural integrity</div>
                            <div class="upgrade-level-display">
                                Health: ${currentHealth}/${maxHealth}
                                <div class="upgrade-level-bar">
                                    <div class="upgrade-level-bar-fill" style="width: ${healthPercent}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="upgrade-action-row">
                        <div class="upgrade-cost-display">Info Only</div>
                    </div>
                </div>
            </div>
        `;
        
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
        
        this.showPanel('castle-panel', '🏰 Castle Upgrades', contentHTML);
        
        // Add event listeners for defender hiring
        if (trainingGrounds && trainingGrounds.defenderUnlocked) {
            document.querySelectorAll('[data-defender-level]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const level = parseInt(btn.dataset.defenderLevel);
                    if (castle.hireDefender(level, this.gameState)) {
                        this.updateUI();
                        this.updateButtonStates();
                        this.closePanelWithAnimation('castle-panel');
                    } else {
                        console.log('UIManager: Failed to hire defender');
                    }
                }, { once: true });
            });
        }
    }

    showTrainingGroundsUpgradeMenu(trainingData) {
        const panel = document.getElementById('training-panel');
        if (!panel) {
            console.error('UIManager: Training panel not found');
            return;
        }
        
        console.log('UIManager: Showing training grounds upgrade menu', trainingData);
        
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
        if (trainingData.upgrades && trainingData.upgrades.length > 0) {
            contentHTML += `<div class="upgrade-category"><div class="upgrade-category-header">Manned Tower Range Training</div>`;
            
            trainingData.upgrades.forEach(upgrade => {
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
                
                console.log(`UIManager: Training upgrade selected: ${upgradeId}, towerType: ${towerType}`);
                
                let success = false;
                if (upgradeId === 'training_level') {
                    success = trainingData.trainingGrounds.purchaseTrainingLevelUpgrade(this.gameState);
                    // Notify unlock system of training grounds upgrade
                    if (success) {
                        unlockSystem.onTrainingGroundsUpgraded(trainingData.trainingGrounds.trainingLevel);
                    }
                } else if (towerType) {
                    success = trainingData.trainingGrounds.purchaseRangeUpgrade(towerType, this.gameState);
                }
                
                if (success) {
                    this.updateUI();
                    this.updateUIAvailability();
                    // Refresh the menu
                    this.showTrainingGroundsUpgradeMenu({
                        trainingGrounds: trainingData.trainingGrounds,
                        upgrades: trainingData.trainingGrounds.getRangeUpgradeOptions(),
                        trainingUpgrade: trainingData.trainingGrounds.getTrainingLevelUpgradeOption()
                    });
                }
            }, { once: true });
        });
        
        // Add sell button listener
        const sellBtn = panel.querySelector('.sell-building-btn');
        if (sellBtn) {
            sellBtn.addEventListener('click', () => {
                this.towerManager.buildingManager.sellBuilding(trainingData.trainingGrounds);
                this.updateUI();
                this.closePanelWithAnimation('training-panel');
            }, { once: true });
        }
    }

    showTrainingGroundsMenu(trainingData) {
        // Redirect to the proper upgrade menu handler
        this.showTrainingGroundsUpgradeMenu(trainingData);
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
}
