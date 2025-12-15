export class MagicTowerMenu {
    constructor(towerManager, level) {
        this.towerManager = towerManager;
        this.level = level;
    }

    show(towerData) {
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
        
        // Add element selection handlers
        this.setupListeners(towerData);
    }

    setupListeners(towerData) {
        const panel = document.getElementById('magic-tower-panel');
        
        // Remove any existing handler to prevent duplicates
        const oldHandler = this._magicTowerClickHandler;
        if (oldHandler) {
            panel.removeEventListener('click', oldHandler);
        }
        
        // Use event delegation for all button clicks
        const handleClick = (e) => {
            const elementBtn = e.target.closest('.panel-element-btn');
            const sellBtn = e.target.closest('.sell-tower-btn');
            
            if (elementBtn) {
                const elementId = elementBtn.dataset.element;
                if (this.towerManager.selectMagicTowerElement(towerData.tower, elementId)) {
                    // Update current element and refresh
                    this.show({
                        tower: towerData.tower,
                        elements: towerData.elements,
                        currentElement: elementId
                    });
                }
            } else if (sellBtn) {
                this.towerManager.sellTower(towerData.tower);
                this.level.setPlacementPreview(0, 0, false);
                this.close();
            }
        };
        
        // Close button (single handler)
        const closeBtn = panel.querySelector('.panel-close-btn');
        if (closeBtn && !closeBtn._hasMagicTowerCloseListener) {
            closeBtn.addEventListener('click', () => this.close());
            closeBtn._hasMagicTowerCloseListener = true;
        }
        
        // Store and attach the delegated handler
        this._magicTowerClickHandler = handleClick;
        panel.addEventListener('click', handleClick);
    }

    close() {
        const panel = document.getElementById('magic-tower-panel');
        if (!panel) return;
        
        if (panel.style.display === 'none') return;
        
        panel.classList.add('closing');
        setTimeout(() => {
            panel.style.display = 'none';
            panel.classList.remove('closing');
        }, 250);
    }
}

export class CombinationTowerMenu {
    constructor(towerManager, level) {
        this.towerManager = towerManager;
        this.level = level;
    }

    show(towerData) {
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
        
        // Add spell selection handlers
        this.setupListeners(towerData);
    }

    setupListeners(towerData) {
        const panel = document.getElementById('combination-tower-panel');
        
        // Remove any existing handler to prevent duplicates
        const oldHandler = this._combinationTowerClickHandler;
        if (oldHandler) {
            panel.removeEventListener('click', oldHandler);
        }
        
        // Use event delegation for all button clicks
        const handleClick = (e) => {
            const spellBtn = e.target.closest('.panel-spell-btn');
            const sellBtn = e.target.closest('.sell-tower-btn');
            
            if (spellBtn) {
                const spellId = spellBtn.dataset.spell;
                if (this.towerManager.selectCombinationTowerSpell(towerData.tower, spellId)) {
                    // Update current spell and refresh
                    this.show({
                        tower: towerData.tower,
                        spells: towerData.spells,
                        currentSpell: spellId
                    });
                }
            } else if (sellBtn) {
                this.towerManager.sellTower(towerData.tower);
                this.level.setPlacementPreview(0, 0, false);
                this.close();
            }
        };
        
        // Close button (single handler)
        const closeBtn = panel.querySelector('.panel-close-btn');
        if (closeBtn && !closeBtn._hasCombinationTowerCloseListener) {
            closeBtn.addEventListener('click', () => this.close());
            closeBtn._hasCombinationTowerCloseListener = true;
        }
        
        // Store and attach the delegated handler
        this._combinationTowerClickHandler = handleClick;
        panel.addEventListener('click', handleClick);
    }

    close() {
        const panel = document.getElementById('combination-tower-panel');
        if (!panel) return;
        
        if (panel.style.display === 'none') return;
        
        panel.classList.add('closing');
        setTimeout(() => {
            panel.style.display = 'none';
            panel.classList.remove('closing');
        }, 250);
    }
}

export class GuardPostMenu {
    constructor(towerManager, level) {
        this.towerManager = towerManager;
        this.level = level;
    }

    show(towerData) {
        const panel = document.getElementById('basic-tower-panel');
        if (!panel) {
            console.error('UIManager: Panel not found for Guard Post menu');
            return;
        }

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

        // Setup hire defender button
        this.setupListeners(towerData, tower, gameState);
    }

    setupListeners(towerData, tower, gameState) {
        const panel = document.getElementById('basic-tower-panel');
        
        // Remove any existing handler to prevent duplicates
        const oldHandler = this._guardPostClickHandler;
        if (oldHandler) {
            panel.removeEventListener('click', oldHandler);
        }
        
        // Use event delegation for all button clicks
        const handleClick = (e) => {
            const hireBtn = e.target.closest('.hire-defender-btn');
            const sellBtn = e.target.closest('.sell-tower-btn');
            
            if (hireBtn) {
                if (tower.hireDefender(gameState)) {
                    this.show(towerData);
                }
            } else if (sellBtn) {
                this.towerManager.sellTower(tower);
                this.level.setPlacementPreview(0, 0, false);
                this.close();
            }
        };
        
        // Close button (single handler)
        const closeBtn = panel.querySelector('.panel-close-btn');
        if (closeBtn && !closeBtn._hasGuardPostCloseListener) {
            closeBtn.addEventListener('click', () => this.close());
            closeBtn._hasGuardPostCloseListener = true;
        }
        
        // Store and attach the delegated handler
        this._guardPostClickHandler = handleClick;
        panel.addEventListener('click', handleClick);
    }

    close() {
        const panel = document.getElementById('basic-tower-panel');
        if (!panel) return;
        
        if (panel.style.display === 'none') return;
        
        panel.classList.add('closing');
        setTimeout(() => {
            panel.style.display = 'none';
            panel.classList.remove('closing');
        }, 250);
    }
}
