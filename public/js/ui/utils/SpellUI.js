export class SpellUI {
    constructor(towerManager) {
        this.towerManager = towerManager;
        this.forceSpellUIRebuild = false;
    }

    updateSpellUI(gameplayState) {
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
        if (currentButtonCount !== availableSpells.length || this.forceSpellUIRebuild) {
            console.log('UIManager: Rebuilding spell buttons. Available spells:', availableSpells.length, 'forceRebuild:', !!this.forceSpellUIRebuild);
            spellButtonsList.innerHTML = '';
            
            // Create a button for each unlocked spell
            availableSpells.forEach(spell => {
                const btn = document.createElement('button');
                btn.className = 'spell-btn';
                btn.dataset.spellId = spell.id;
                btn.title = `${spell.name}: ${spell.description}`;
                btn.innerHTML = `<span>${spell.icon}</span>`;
                
                // Add click listener with proper closure
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('UIManager: Spell button clicked:', spell.id, 'cooldown:', spell.currentCooldown);
                    // Prevent spell casting when game is paused
                    if (gameplayState.isPaused) {
                        console.log('UIManager: Game is paused, spell blocked');
                        return;
                    }
                    if (spell.currentCooldown === 0) {
                        console.log('UIManager: Activating spell targeting for:', spell.id);
                        gameplayState.activateSpellTargeting(spell.id);
                    } else {
                        console.log('UIManager: Spell is on cooldown:', spell.currentCooldown);
                    }
                });
                
                spellButtonsList.appendChild(btn);
            });
            
            // Clear the force rebuild flag after rebuilding
            this.forceSpellUIRebuild = false;
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
}
