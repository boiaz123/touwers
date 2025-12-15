export class CastleMenu {
    constructor(gameState) {
        this.gameState = gameState;
    }

    show(castleData) {
        const panel = document.getElementById('castle-panel');
        if (!panel) {
            console.error('UIManager: Castle panel not found');
            return;
        }
        
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
        
        // Update panel title and content
        const titleElement = panel.querySelector('.panel-title');
        if (titleElement) titleElement.textContent = '🏰 Castle Upgrades';
        
        const contentContainer = panel.querySelector('[id$="-content"], [id$="-upgrades"]');
        if (contentContainer) {
            contentContainer.innerHTML = contentHTML;
        }
        
        // Show the panel
        panel.style.display = 'flex';
        panel.classList.remove('closing');
        
        // Setup button listeners
        this.setupListeners(castleData);
    }

    setupListeners(castleData) {
        const panel = document.getElementById('castle-panel');
        
        // Remove any existing handler to prevent duplicates
        const oldHandler = this._castleClickHandler;
        if (oldHandler) {
            panel.removeEventListener('click', oldHandler);
        }
        
        // Use event delegation for all button clicks
        const handleClick = (e) => {
            const defenderBtn = e.target.closest('[data-defender-level]');
            
            if (defenderBtn) {
                const level = parseInt(defenderBtn.dataset.defenderLevel);
                if (castleData.castle.hireDefender(level, this.gameState)) {
                    this.show(castleData);
                }
            }
        };
        
        // Close button (single handler)
        const closeBtn = panel.querySelector('.panel-close-btn');
        if (closeBtn && !closeBtn._hasCastleCloseListener) {
            closeBtn.addEventListener('click', () => this.close());
            closeBtn._hasCastleCloseListener = true;
        }
        
        // Store and attach the delegated handler
        this._castleClickHandler = handleClick;
        panel.addEventListener('click', handleClick);
    }

    close() {
        const panel = document.getElementById('castle-panel');
        if (!panel) return;
        
        if (panel.style.display === 'none') return;
        
        panel.classList.add('closing');
        setTimeout(() => {
            panel.style.display = 'none';
            panel.classList.remove('closing');
        }, 250);
    }
}

export class TrainingGroundsMenu {
    constructor(gameState, towerManager, level) {
        this.gameState = gameState;
        this.towerManager = towerManager;
        this.level = level;
    }

    show(trainingData) {
        const panel = document.getElementById('training-panel');
        if (!panel) {
            console.error('UIManager: Training panel not found');
            return;
        }
        
        let contentHTML = '';
        
        // Add training grounds building level upgrade first (always show)
        const trainingUpgrade = trainingData.trainingGrounds.getTrainingLevelUpgradeOption();
        if (trainingUpgrade) {
            const isMaxed = trainingUpgrade.isMaxed || (trainingUpgrade.level >= trainingUpgrade.maxLevel);
            const canAfford = !isMaxed && trainingUpgrade.cost && this.gameState.gold >= trainingUpgrade.cost;
            
            contentHTML += `
                <div class="upgrade-category training-level-upgrade">
                    <div class="panel-upgrade-item training-level-upgrade ${isMaxed ? 'maxed' : ''}">
                        <div class="upgrade-header-row">
                            <div class="upgrade-icon-section">${trainingUpgrade.icon}</div>
                            <div class="upgrade-info-section">
                                <div class="upgrade-name">${trainingUpgrade.name}</div>
                                <div class="upgrade-description">${trainingUpgrade.description}</div>
                                <div class="upgrade-level-display">
                                    Level: ${trainingUpgrade.level}/${trainingUpgrade.maxLevel}
                                    <div class="upgrade-level-bar">
                                        <div class="upgrade-level-bar-fill" style="width: ${(trainingUpgrade.level / trainingUpgrade.maxLevel) * 100}%"></div>
                                    </div>
                                </div>
                                <div style="font-size: 0.8rem; color: rgba(200, 180, 120, 0.9); margin-top: 0.3rem;">${trainingUpgrade.nextUnlock}</div>
                            </div>
                        </div>
                        <div class="upgrade-action-row">
                            <div class="upgrade-cost-display ${isMaxed ? 'maxed' : canAfford ? 'affordable' : ''}">
                                ${isMaxed ? 'MAX' : `$${trainingUpgrade.cost}`}
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
        
        // Setup button listeners
        this.setupListeners(trainingData);
    }

    setupListeners(trainingData) {
        const panel = document.getElementById('training-panel');
        const unlockSystem = this.towerManager.getUnlockSystem();
        
        // Remove any existing handler to prevent duplicates
        const oldHandler = this._trainingClickHandler;
        if (oldHandler) {
            panel.removeEventListener('click', oldHandler);
        }
        
        // Use event delegation for all button clicks
        const handleClick = (e) => {
            const upgradeBtn = e.target.closest('.panel-upgrade-btn');
            const sellBtn = e.target.closest('.sell-building-btn');
            
            if (upgradeBtn) {
                const upgradeId = upgradeBtn.dataset.upgrade;
                const towerType = upgradeBtn.dataset.towerType;
                
                let success = false;
                if (upgradeId === 'training_level') {
                    success = trainingData.trainingGrounds.purchaseTrainingLevelUpgrade(this.gameState);
                    if (success) {
                        unlockSystem.onTrainingGroundsUpgraded(trainingData.trainingGrounds.trainingLevel);
                    }
                } else if (towerType) {
                    success = trainingData.trainingGrounds.purchaseRangeUpgrade(towerType, this.gameState);
                }
                
                if (success) {
                    this.show({
                        trainingGrounds: trainingData.trainingGrounds,
                        upgrades: trainingData.trainingGrounds.getRangeUpgradeOptions(),
                        trainingUpgrade: trainingData.trainingGrounds.getTrainingLevelUpgradeOption()
                    });
                }
            } else if (sellBtn) {
                this.towerManager.sellBuilding(trainingData.trainingGrounds);
                this.level.setPlacementPreview(0, 0, false);
                this.close();
            }
        };
        
        // Close button (single handler)
        const closeBtn = panel.querySelector('.panel-close-btn');
        if (closeBtn && !closeBtn._hasTrainingCloseListener) {
            closeBtn.addEventListener('click', () => this.close());
            closeBtn._hasTrainingCloseListener = true;
        }
        
        // Store and attach the delegated handler
        this._trainingClickHandler = handleClick;
        panel.addEventListener('click', handleClick);
    }

    close() {
        const panel = document.getElementById('training-panel');
        if (!panel) return;
        
        if (panel.style.display === 'none') return;
        
        panel.classList.add('closing');
        setTimeout(() => {
            panel.style.display = 'none';
            panel.classList.remove('closing');
        }, 250);
    }
}
