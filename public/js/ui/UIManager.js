export class UIManager {
    constructor(gameplayState) {
        this.gameplayState = gameplayState;
        this.towerManager = gameplayState.towerManager;
        this.gameState = gameplayState.gameState;
        this.stateManager = gameplayState.stateManager;
        this.level = gameplayState.level;
        this.activeMenu = null;
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

        // PERMANENT: Event delegation for dynamically created spell buttons
        const spellGrid = document.getElementById('spell-grid');
        if (spellGrid && !spellGrid.dataset.delegationSetup) {
            console.log('UIManager: Setting up PERMANENT spell button delegation');
            spellGrid.addEventListener('click', (e) => {
                console.log('UIManager: Spell grid clicked, target:', e.target.className);
                const spellBtn = e.target.closest('.spell-btn.ready');
                if (spellBtn && !spellBtn.disabled) {
                    console.log('UIManager: ✓ SPELL BUTTON CLICKED via delegation');
                    const spellId = spellBtn.dataset.spellId;
                    console.log(`UIManager: Spell ID: ${spellId}`);
                    this.gameplayState.activateSpellTargeting(spellId);
                } else {
                    console.log('UIManager: Click was on non-ready spell button or not a spell button');
                }
            });
            spellGrid.dataset.delegationSetup = 'true';
        }

        // Speed control buttons
        const speed1xBtn = document.getElementById('speed-1x-btn');
        const speed2xBtn = document.getElementById('speed-2x-btn');
        const speed3xBtn = document.getElementById('speed-3x-btn');
        
        console.log('UIManager: Speed button setup - 1x:', speed1xBtn ? 'found' : 'NOT FOUND', '2x:', speed2xBtn ? 'found' : 'NOT FOUND', '3x:', speed3xBtn ? 'found' : 'NOT FOUND');
        
        if (speed1xBtn) {
            speed1xBtn.addEventListener('click', (e) => {
                console.log('UIManager: Speed 1x clicked');
                this.gameplayState.setGameSpeed(1.0);
            });
            console.log('UIManager: Speed 1x listener attached');
        }
        if (speed2xBtn) {
            speed2xBtn.addEventListener('click', (e) => {
                console.log('UIManager: Speed 2x clicked');
                this.gameplayState.setGameSpeed(2.0);
            });
            console.log('UIManager: Speed 2x listener attached');
        }
        if (speed3xBtn) {
            speed3xBtn.addEventListener('click', (e) => {
                console.log('UIManager: Speed 3x clicked');
                this.gameplayState.setGameSpeed(3.0);
            });
            console.log('UIManager: Speed 3x listener attached');
        }
    }

    removeUIEventListeners() {
        document.querySelectorAll('.tower-btn, .building-btn, .spell-btn').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });
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

    // ============ SPELL UI ============

    updateSpellUI() {
        const spellSection = document.getElementById('spell-section');
        const spellGrid = document.getElementById('spell-grid');
        
        // Find super weapon lab
        const superWeaponLab = this.towerManager.buildingManager.buildings.find(
            b => b.constructor.name === 'SuperWeaponLab'
        );
        
        if (!superWeaponLab) {
            if (spellSection) spellSection.style.display = 'none';
            return;
        }
        
        spellSection.style.display = 'block';
        
        const availableSpells = superWeaponLab.getAvailableSpells();
        
        // IMPORTANT: Check if we need to rebuild the UI
        const currentButtonCount = spellGrid.querySelectorAll('.spell-btn').length;
        const currentReadyCount = spellGrid.querySelectorAll('.spell-btn.ready').length;
        
        // Rebuild if the number of available spells changed (new unlock) or button count is 0
        const needsRebuild = currentButtonCount !== availableSpells.length;
        
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
        console.log('UIManager: Rebuilding spell UI - spell state changed');
        
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
        
        const buttons = spellGrid.querySelectorAll('.spell-btn.ready');
        console.log(`UIManager: Rebuilt UI with ${buttons.length} ready spell buttons`);
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

    setGameSpeedButtonState(speed) {
        const speed1xBtn = document.getElementById('speed-1x-btn');
        const speed2xBtn = document.getElementById('speed-2x-btn');
        const speed3xBtn = document.getElementById('speed-3x-btn');
        
        [speed1xBtn, speed2xBtn, speed3xBtn].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
        
        if (speed === 1.0 && speed1xBtn) speed1xBtn.classList.add('active');
        else if (speed === 2.0 && speed2xBtn) speed2xBtn.classList.add('active');
        else if (speed === 3.0 && speed3xBtn) speed3xBtn.classList.add('active');
    }

    // ============ UPGRADE MENUS ============

    showForgeUpgradeMenu(forgeData) {
        // Clear existing menus
        this.clearActiveMenus();
        
        // Get unlock system from tower manager
        const unlockSystem = this.towerManager.getUnlockSystem();
        
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
        
        // Add tower upgrades - ALL of them, not filtered
        upgradeListHTML += forgeData.upgrades.map(upgrade => `
            <div class="upgrade-item ${upgrade.level >= upgrade.maxLevel ? 'maxed' : ''}">
                <div class="upgrade-icon">${upgrade.icon}</div>
                <div class="upgrade-details">
                    <div class="upgrade-name">${upgrade.name}</div>
                    <div class="upgrade-desc">${upgrade.description}</div>
                    <div class="upgrade-level">Level: ${upgrade.level}/${upgrade.maxLevel}</div>
                    <div class="upgrade-current">${this.getUpgradeCurrentEffect(upgrade)}</div>
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
    }
}
