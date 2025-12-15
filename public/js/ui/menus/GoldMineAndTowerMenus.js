export class GoldMineMenu {
    constructor(gameState, towerManager, level) {
        this.gameState = gameState;
        this.towerManager = towerManager;
        this.level = level;
        this.updateTimer = null;
    }

    show(goldMineData) {
        const panel = document.getElementById('goldmine-panel');
        if (!panel) {
            console.error('UIManager: Gold Mine panel not found');
            return;
        }
        
        const goldMine = goldMineData.goldMine;
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
                                        <div style="height: 100%; width: ${progressPercent}%; background: linear-gradient(90deg, #FFB800, #FFD700); display: flex; align-items: center; justify-content: flex-end; padding-right: 4px;">
                                        </div>
                                    </div>
                                </div>
                                <div style="font-size: 0.75rem; color: ${readyColor}; font-weight: bold; min-width: 3.5rem; text-align: right;">${readyStatus}</div>
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
        
        // Add sell button
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
        
        // Update panel title and content
        const titleElement = panel.querySelector('.panel-title');
        if (titleElement) titleElement.textContent = '⛏️ Gold Mine';
        
        const contentContainer = panel.querySelector('#goldmine-panel-content') || panel.querySelector('.panel-content');
        if (contentContainer) {
            contentContainer.innerHTML = contentHTML;
        }
        
        // Show the panel
        panel.style.display = 'flex';
        panel.classList.remove('closing');
        
        // Start live update timer (update every 1 second)
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
        this.updateTimer = setInterval(() => {
            // Only update if panel is still visible
            if (panel.style.display !== 'none') {
                this.show(goldMineData);
            }
        }, 1000); // Update every 1 second
        
        // Setup button listeners
        this.setupListeners(goldMineData);
    }

    setupListeners(goldMineData) {
        const panel = document.getElementById('goldmine-panel');
        const goldMine = goldMineData.goldMine;
        
        // Remove any existing handler to prevent duplicates
        const oldHandler = this._goldMineClickHandler;
        if (oldHandler) {
            panel.removeEventListener('click', oldHandler);
        }
        
        // Use event delegation for all button clicks
        const handleClick = (e) => {
            const toggleBtn = e.target.closest('.toggle-mine-mode-btn');
            const collectBtn = e.target.closest('.collect-gold-btn');
            const sellBtn = e.target.closest('.sell-building-btn');
            
            if (toggleBtn) {
                goldMine.gemMode = !goldMine.gemMode;
                goldMine.currentProduction = 0;
                this.show(goldMineData);
            } else if (collectBtn) {
                if (goldMine.gemMode) {
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
                    goldMineData.gameState.gold += collected;
                }
                this.close();
            } else if (sellBtn) {
                this.towerManager.sellBuilding(goldMine);
                this.level.setPlacementPreview(0, 0, false);
                this.close();
            }
        };
        
        // Close button (single handler)
        const closeBtn = panel.querySelector('.panel-close-btn');
        if (closeBtn && !closeBtn._hasGoldMineCloseListener) {
            closeBtn.addEventListener('click', () => this.close());
            closeBtn._hasGoldMineCloseListener = true;
        }
        
        // Store and attach the delegated handler
        this._goldMineClickHandler = handleClick;
        panel.addEventListener('click', handleClick);
    }

    close() {
        // Stop live update timer immediately
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
        
        const panel = document.getElementById('goldmine-panel');
        if (!panel) return;
        
        if (panel.style.display === 'none') return;
        
        panel.classList.add('closing');
        setTimeout(() => {
            panel.style.display = 'none';
            panel.classList.remove('closing');
        }, 250);
    }
}

export class BasicTowerMenu {
    constructor(towerManager, level) {
        this.towerManager = towerManager;
        this.level = level;
    }

    show(towerData) {
        const panel = document.getElementById('basic-tower-panel');
        if (!panel) {
            console.error('UIManager: Panel not found for Basic Tower menu');
            return;
        }
        
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
                <button id="sell-tower-btn-${tower.gridX}-${tower.gridY}" class="upgrade-button sell-tower-btn" style="background: #ff4444; flex: 1; margin: 0;">
                    💰 Sell Tower
                </button>
            </div>
        `;
        
        // Update panel title and content
        const titleElement = panel.querySelector('.panel-title');
        if (titleElement) titleElement.textContent = `${stats.icon} Tower Stats`;
        
        const contentContainer = panel.querySelector('[id$="-content"], [id$="-upgrades"]');
        if (contentContainer) {
            contentContainer.innerHTML = contentHTML;
        }
        
        // Show the panel
        panel.style.display = 'flex';
        panel.classList.remove('closing');
        
        // Setup close button
        const closeBtn = panel.querySelector('.panel-close-btn');
        if (closeBtn && !closeBtn._hasBasicTowerCloseListener) {
            closeBtn.addEventListener('click', () => this.close());
            closeBtn._hasBasicTowerCloseListener = true;
        }
        
        // Setup button listeners
        this.setupListeners(towerData, tower);
    }

    setupListeners(towerData, tower) {
        const panel = document.getElementById('basic-tower-panel');
        
        // Remove any existing handler to prevent duplicates
        const oldHandler = this._basicTowerClickHandler;
        if (oldHandler) {
            panel.removeEventListener('click', oldHandler);
        }
        
        // Use event delegation for sell button
        const handleClick = (e) => {
            const sellBtn = e.target.closest('.sell-tower-btn');
            if (sellBtn) {
                this.towerManager.sellTower(tower);
                this.level.setPlacementPreview(0, 0, false);
                this.close();
            }
        };
        
        // Store and attach the delegated handler
        this._basicTowerClickHandler = handleClick;
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
