export class SuperWeaponMenu {
    constructor(gameState, towerManager, level) {
        this.gameState = gameState;
        this.towerManager = towerManager;
        this.level = level;
    }

    show(menuData) {
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
        this.setupTooltips(contentContainer);
        
        // Show the panel
        panel.style.display = 'flex';
        panel.classList.remove('closing');
        

        // Setup button handlers
        this.setupListeners(menuData);
    }

    setupTooltips(contentContainer) {
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
    }

    setupListeners(menuData) {
        const panel = document.getElementById('superweapon-panel');
        
        // Remove any existing handler to prevent duplicates
        const oldHandler = this._superWeaponClickHandler;
        if (oldHandler) {
            panel.removeEventListener('click', oldHandler);
        }
        
        // Use event delegation for all button clicks
        const handleButtonClick = (e) => {
            const btn = e.target.closest('.panel-upgrade-btn');
            if (!btn || btn.disabled) return;
            
            // Prevent multiple clicks
            btn.disabled = true;
            setTimeout(() => { btn.disabled = false; }, 100);
            
            if (btn.dataset.upgrade === 'lab_upgrade') {
                if (menuData.building.purchaseLabUpgrade(this.gameState)) {
                    this.show(menuData);
                }
            } else if (btn.dataset.mainSpell) {
                const spellId = btn.dataset.mainSpell;
                const diamondCost = 1;
                if (menuData.building.upgradeMainSpell(spellId, diamondCost)) {
                    this.show(menuData);
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
                    
                    this.show(menuData);
                }
            }
        };
        
        // Close button (single handler)
        const closeBtn = panel.querySelector('.panel-close-btn');
        if (closeBtn && !closeBtn._hasSuperWeaponCloseListener) {
            closeBtn.addEventListener('click', () => this.close());
            closeBtn._hasSuperWeaponCloseListener = true;
        }
        
        // Store and attach the delegated handler
        this._superWeaponClickHandler = handleButtonClick;
        panel.addEventListener('click', handleButtonClick);
        
        // Add sell button listener
        const sellBtn = panel.querySelector('.sell-building-btn');
        if (sellBtn) {
            sellBtn.addEventListener('click', () => {
                this.towerManager.sellBuilding(menuData.building);
                this.close();
            }, { once: true });
        }
    }

    close() {
        const panel = document.getElementById('superweapon-panel');
        if (!panel) return;
        
        if (panel.style.display === 'none') return;
        
        // Clean up any active tooltips
        const existingTooltips = document.querySelectorAll('[data-panel-tooltip]');
        existingTooltips.forEach(tooltip => tooltip.remove());
        
        panel.classList.add('closing');
        setTimeout(() => {
            panel.style.display = 'none';
            panel.classList.remove('closing');
        }, 250);
    }
}
