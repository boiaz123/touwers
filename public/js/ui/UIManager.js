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
                
                // Always show button if unlocked - either clickable or disabled
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

    showAcademyUpgradeMenu(academyData) {
        // Clear existing menus
        this.clearActiveMenus();
        
        console.log('UIManager: Showing academy upgrade menu', academyData);
        
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
                    console.log(`UIManager: Attempting academy upgrade purchase`);
                    
                    // Purchase FIRST
                    const purchased = academyData.academy.purchaseAcademyUpgrade(this.gameState);
                    console.log(`UIManager: Purchase returned: ${purchased}`);
                    
                    if (purchased) {
                        console.log(`UIManager: Purchase succeeded`);
                        const newLevel = academyData.academy.academyLevel;
                        console.log(`UIManager: Academy new level: ${newLevel}`);
                        
                        // NOW unlock
                        if (newLevel === 3) {
                            console.log('UIManager: *** LEVEL 3 REACHED - UNLOCKING SUPERWEAPON ***');
                            const unlockSystem = this.towerManager.getUnlockSystem();
                            unlockSystem.onAcademyLevelThree();
                            console.log(`UIManager: After unlock, superweaponUnlocked is: ${unlockSystem.superweaponUnlocked}`);
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
                                console.log('UIManager: Updated mine with academy reference, gemMiningUnlocked:', building.gemMiningUnlocked);
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
        
        console.log('UIManager: Showing magic tower element menu', towerData);
        
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
            });
        });
        
        this.activeMenu = menu;
    }

    showCombinationTowerMenu(towerData) {
        // New: Menu for selecting combination spells
        this.clearActiveMenus();
        
        console.log('UIManager: Showing combination tower spell menu', towerData);
        
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
                
                console.log(`UIManager: Combination tower spell selected: ${spellId}`);
                
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
        
        console.log('UIManager: Showing basic tower stats menu', towerData);
        
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
        
        console.log('UIManager: showSuperWeaponMenu called with:', menuData);
        
        const menu = document.createElement('div');
        menu.id = 'superweapon-upgrade-menu';
        menu.className = 'upgrade-menu';
        
        let upgradeListHTML = '';
        
        // Add lab level upgrade
        const labUpgrade = menuData.building.getLabUpgradeOption();
        if (labUpgrade) {
            console.log('UIManager: Adding lab upgrade option:', labUpgrade);
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
        console.log('UIManager: Processing spells:', menuData.spells.length);
        menuData.spells.forEach((spell, index) => {
            console.log(`UIManager: Spell ${index}:`, spell.id, 'unlocked:', spell.unlocked, 'level:', spell.level);
            
            if (!spell.unlocked) {
                // Unlock option - use unique data attribute
                console.log(`UIManager: Creating unlock button for ${spell.id}`);
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
                
                console.log(`UIManager: Creating upgrade button for ${spell.id}, cost: ${upgradeCost}, maxed: ${isMaxed}`);
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
                <h3>💥 Super Weapon Lab</h3>
                <button class="close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="upgrade-list">
                ${upgradeListHTML}
            </div>
        `;
        
        document.body.appendChild(menu);
        
        // Add button handlers for superweapon menu
        menu.querySelectorAll('.upgrade-btn').forEach(btn => {
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
            });
        });
        
        this.activeMenu = menu;
    }

    showCastleUpgradeMenu(castleData) {
        // Castle upgrades menu - similar structure to other menus
        this.clearActiveMenus();
        
        const menu = document.createElement('div');
        menu.id = 'castle-upgrade-menu';
        menu.className = 'upgrade-menu';
        
        menu.innerHTML = `
            <div class="menu-header">
                <h3>🏰 Castle Upgrades</h3>
                <button class="close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="upgrade-list">
                <div class="upgrade-item">
                    <div class="upgrade-icon">🛡️</div>
                    <div class="upgrade-details">
                        <div class="upgrade-name">Reinforced Walls</div>
                        <div class="upgrade-desc">Improve castle defenses</div>
                        <div class="upgrade-level">Health: ${castleData.castle.health}/${castleData.castle.maxHealth}</div>
                    </div>
                    <div class="upgrade-cost">Info Only</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(menu);
        this.activeMenu = menu;
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
        // Close forge panel if open
        this.closeForgePanelWithAnimation();
        this.clearBuildingInfoMenu();
        this.clearTowerInfoMenu();
    }
}
