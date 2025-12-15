export class ForgeMenu {
    constructor(gameState, towerManager, level) {
        this.gameState = gameState;
        this.towerManager = towerManager;
        this.level = level;
    }

    show(forgeData) {
        const panel = document.getElementById('forge-panel');
        const upgradesContainer = document.getElementById('forge-panel-upgrades');
        
        if (!panel || !upgradesContainer) {
            console.error('UIManager: Forge panel elements not found');
            return;
        }
        
        // Get unlock system from tower manager
        const unlockSystem = this.towerManager.getUnlockSystem();
        
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
                
                // Current effect display
                let currentEffect = '';
                const totalBonus = upgrade.level * (upgrade.baseCost || 0);
                if (upgrade.id === 'basic' || upgrade.id === 'barricade' || upgrade.id === 'archer') {
                    currentEffect = `Damage: +${upgrade.level * 8}`;
                } else if (upgrade.id === 'poison') {
                    currentEffect = `Poison: +${upgrade.level * 5}`;
                } else if (upgrade.id === 'cannon') {
                    currentEffect = `Damage: +${upgrade.level * 10}`;
                }
                
                // Determine unlock level for this tower type
                let unlockedAtLevel = 1;
                if (upgrade.id === 'poison' || upgrade.id === 'trebuchet') {
                    unlockedAtLevel = 2;
                }
                if (upgrade.id === 'trebuchet') {
                    unlockedAtLevel = 3;
                }
                
                contentHTML += `
                    <div class="panel-upgrade-item ${isMaxed ? 'maxed' : ''}">
                        <div class="upgrade-header-row">
                            <div class="upgrade-icon-section">${upgrade.icon}</div>
                            <div class="upgrade-info-section">
                                <div class="upgrade-name">${upgrade.name}</div>
                                <div class="upgrade-description">${upgrade.description}</div>
                                <div style="font-size: 0.75rem; color: #aaa; margin-top: 0.2rem;">🔓 Unlocked at Forge Level ${unlockedAtLevel}</div>
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
        
        // Add sell button for forge
        contentHTML += `
            <div style="padding: 0.6rem 0.85rem; border-top: 1px solid rgba(255, 215, 0, 0.2); display: flex; gap: 0.5rem; justify-content: flex-end;">
                <button class="upgrade-button sell-building-btn" data-building-id="forge" style="background: #ff4444; flex: 1; margin: 0;">
                    💰 Sell Forge
                </button>
            </div>
        `;
        
        // Update container
        const upgradesContainer2 = document.getElementById('forge-panel-upgrades');
        if (upgradesContainer2) {
            upgradesContainer2.innerHTML = contentHTML;
        }
        
        // Show the panel with animation
        panel.style.display = 'flex';
        panel.classList.remove('closing');
        
        // Setup event listeners
        this.setupListeners(forgeData, unlockSystem);
    }

    setupListeners(forgeData, unlockSystem) {
        const panel = document.getElementById('forge-panel');
        if (!panel) return;
        
        // Remove any existing handler to prevent duplicates
        const oldHandler = this._forgeClickHandler;
        if (oldHandler) {
            panel.removeEventListener('click', oldHandler);
        }
        
        // Use event delegation for all button clicks
        const handleClick = (e) => {
            const upgradeBtn = e.target.closest('.panel-upgrade-btn');
            const sellBtn = e.target.closest('.sell-building-btn');
            
            if (upgradeBtn) {
                const upgradeId = upgradeBtn.dataset.upgrade;
                const isForgeLevel = upgradeBtn.dataset.forgeLevel === 'true';
                
                if (isForgeLevel) {
                    if (forgeData.forge.purchaseForgeUpgrade(this.gameState)) {
                        unlockSystem.onForgeUpgraded(forgeData.forge.getForgeLevel());
                        this.show({
                            forge: forgeData.forge,
                            upgrades: forgeData.forge.getUpgradeOptions(),
                            forgeUpgrade: forgeData.forge.getForgeUpgradeOption()
                        });
                    }
                } else {
                    if (forgeData.forge.purchaseUpgrade(upgradeId, this.gameState)) {
                        this.show({
                            forge: forgeData.forge,
                            upgrades: forgeData.forge.getUpgradeOptions(),
                            forgeUpgrade: forgeData.forge.getForgeUpgradeOption()
                        });
                    }
                }
            } else if (sellBtn) {
                this.towerManager.sellBuilding(forgeData.forge);
                this.level.setPlacementPreview(0, 0, false);
                this.close();
            }
        };
        
        // Close button (single handler)
        const closeBtn = panel.querySelector('.panel-close-btn');
        if (closeBtn && !closeBtn._hasForgeCloseListener) {
            closeBtn.addEventListener('click', () => this.close());
            closeBtn._hasForgeCloseListener = true;
        }
        
        // Store and attach the delegated handler
        this._forgeClickHandler = handleClick;
        panel.addEventListener('click', handleClick);
    }

    close() {
        const panel = document.getElementById('forge-panel');
        if (!panel) return;
        
        if (panel.style.display === 'none') return; // Already closed
        
        panel.classList.add('closing');
        setTimeout(() => {
            panel.style.display = 'none';
            panel.classList.remove('closing');
        }, 250);
    }
}
