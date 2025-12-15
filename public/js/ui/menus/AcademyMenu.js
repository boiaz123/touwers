export class AcademyMenu {
    constructor(gameState, towerManager) {
        this.gameState = gameState;
        this.towerManager = towerManager;
    }

    show(academyData) {
        const panel = document.getElementById('academy-panel');
        if (!panel) {
            console.error('UIManager: Academy panel not found');
            return;
        }
        
        let contentHTML = '';
        
        // Add academy building upgrades first (always show, even when maxed)
        const academyUpgrade = academyData.academy.getAcademyUpgradeOption();
        if (academyUpgrade) {
            const isMaxed = academyUpgrade.isMaxed || (academyUpgrade.level >= academyUpgrade.maxLevel);
            const canAfford = !isMaxed && academyUpgrade.cost && this.gameState.gold >= academyUpgrade.cost;
            
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
                
                // Determine unlock info
                let unlockedInfo = '';
                if (upgrade.isCombinationUnlock) {
                    unlockedInfo = `🔓 Unlocked at Academy Level 2`;
                } else if (upgrade.isResearch) {
                    unlockedInfo = `🔬 Research`;
                } else {
                    const unlockedLevel = upgrade.gemType === 'fire' ? 1 : upgrade.gemType === 'water' ? 1 : upgrade.gemType === 'air' ? 1 : 1;
                    unlockedInfo = `🔓 Available from Level 1`;
                }
                
                contentHTML += `
                    <div class="panel-upgrade-item ${isMaxed ? 'maxed' : ''}">
                        <div class="upgrade-header-row">
                            <div class="upgrade-icon-section">${upgrade.icon}</div>
                            <div class="upgrade-info-section">
                                <div class="upgrade-name">${upgrade.name}</div>
                                <div class="upgrade-description">${upgrade.description}</div>
                                ${unlockedInfo ? `<div style="font-size: 0.75rem; color: #aaa; margin-top: 0.2rem;">${unlockedInfo}</div>` : ''}
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
        
        // Setup button listeners
        this.setupListeners(academyData);
    }

    setupListeners(academyData) {
        const panel = document.getElementById('academy-panel');
        const unlockSystem = this.towerManager.getUnlockSystem();
        
        // Remove any existing handler to prevent duplicates
        const oldHandler = this._academyClickHandler;
        if (oldHandler) {
            panel.removeEventListener('click', oldHandler);
        }
        
        // Use event delegation for all button clicks
        const handleClick = (e) => {
            const upgradeBtn = e.target.closest('.panel-upgrade-btn');
            const sellBtn = e.target.closest('.sell-building-btn');
            
            if (upgradeBtn) {
                const upgradeId = upgradeBtn.dataset.upgrade;
                
                if (upgradeId === 'academy_upgrade') {
                    if (academyData.academy.purchaseAcademyUpgrade(this.gameState)) {
                        const newLevel = academyData.academy.academyLevel;
                        if (newLevel === 3) {
                            unlockSystem.onAcademyLevelThree();
                        }
                        this.show({
                            academy: academyData.academy,
                            upgrades: academyData.academy.getElementalUpgradeOptions()
                        });
                    }
                } else if (upgradeId.startsWith('unlock_')) {
                    const result = academyData.academy.purchaseElementalUpgrade(upgradeId, this.gameState);
                    if (result && result.success) {
                        unlockSystem.onCombinationSpellUnlocked(result.spellId);
                        this.show({
                            academy: academyData.academy,
                            upgrades: academyData.academy.getElementalUpgradeOptions()
                        });
                    }
                } else {
                    if (academyData.academy.purchaseElementalUpgrade(upgradeId, this.gameState)) {
                        this.show({
                            academy: academyData.academy,
                            upgrades: academyData.academy.getElementalUpgradeOptions()
                        });
                    }
                }
            } else if (sellBtn) {
                this.towerManager.sellBuilding(academyData.academy);
                this.close();
            }
        };
        
        // Close button (single handler)
        const closeBtn = panel.querySelector('.panel-close-btn');
        if (closeBtn && !closeBtn._hasAcademyCloseListener) {
            closeBtn.addEventListener('click', () => this.close());
            closeBtn._hasAcademyCloseListener = true;
        }
        
        // Store and attach the delegated handler
        this._academyClickHandler = handleClick;
        panel.addEventListener('click', handleClick);
    }

    close() {
        const panel = document.getElementById('academy-panel');
        if (!panel) return;
        
        if (panel.style.display === 'none') return; // Already closed
        
        panel.classList.add('closing');
        setTimeout(() => {
            panel.style.display = 'none';
            panel.classList.remove('closing');
        }, 250);
    }
}
