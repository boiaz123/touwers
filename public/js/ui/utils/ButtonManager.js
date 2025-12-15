export class ButtonManager {
    constructor(gameState, towerManager) {
        this.gameState = gameState;
        this.towerManager = towerManager;
    }

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
}
