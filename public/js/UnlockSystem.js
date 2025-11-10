export class UnlockSystem {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.forgeLevel = 0;
        this.hasForge = false;
        this.forgeCount = 0;
        this.maxForges = 1;
        
        // Base unlocks
        this.unlockedTowers = new Set(['basic', 'barricade']);
        this.unlockedBuildings = new Set(['forge']);
        this.unlockedUpgrades = new Set();
    }
    
    onForgeBuilt() {
        if (this.forgeCount < this.maxForges) {
            this.hasForge = true;
            this.forgeCount++;
            this.forgeLevel = 1;
            
            // Forge level 1 unlocks
            this.unlockedBuildings.add('mine');
            this.unlockedTowers.add('archer');
            this.unlockedUpgrades.add('towerRange');
            this.unlockedUpgrades.add('barricadeDamage');
            
            console.log('UnlockSystem: Forge built - unlocked mine, archer, basic upgrades');
            return true;
        }
        return false;
    }
    
    onForgeUpgraded(newLevel) {
        this.forgeLevel = newLevel;
        
        switch(newLevel) {
            case 2:
                // Forge level 2 unlocks
                this.unlockedTowers.add('poison');
                this.unlockedUpgrades.add('poisonDamage');
                console.log('UnlockSystem: Forge level 2 - unlocked poison tower and upgrades');
                break;
                
            case 3:
                // Forge level 3 unlocks
                this.unlockedTowers.add('cannon');
                this.unlockedUpgrades.add('explosiveRadius');
                console.log('UnlockSystem: Forge level 3 - unlocked cannon tower and upgrades');
                break;
                
            case 4:
                // Forge level 4 unlocks
                this.unlockedBuildings.add('academy');
                this.unlockedTowers.add('magic');
                this.unlockedUpgrades.add('fireArrows');
                console.log('UnlockSystem: Forge level 4 - unlocked magic academy and tower');
                break;
                
            default:
                // Higher levels just improve mine income
                console.log(`UnlockSystem: Forge level ${newLevel} - improved mine efficiency`);
                break;
        }
    }
    
    canBuildTower(type) {
        return this.unlockedTowers.has(type);
    }
    
    canBuildBuilding(type) {
        if (type === 'forge' && this.forgeCount >= this.maxForges) {
            return false;
        }
        return this.unlockedBuildings.has(type);
    }
    
    canUseUpgrade(upgradeId) {
        return this.unlockedUpgrades.has(upgradeId);
    }
    
    getMineIncomeMultiplier() {
        // Base income: 1x
        // Forge level 1: 1.5x
        // Forge level 2: 2x
        // Forge level 3: 2.5x
        // Forge level 4+: 3x + 0.2x per additional level
        if (this.forgeLevel === 0) return 1;
        if (this.forgeLevel === 1) return 1.5;
        if (this.forgeLevel === 2) return 2.0;
        if (this.forgeLevel === 3) return 2.5;
        return 3.0 + (this.forgeLevel - 4) * 0.2;
    }
    
    getForgeUpgradeInfo() {
        return {
            currentLevel: this.forgeLevel,
            maxLevel: 10,
            nextUnlock: this.getNextUnlockDescription()
        };
    }
    
    getNextUnlockDescription() {
        const nextLevel = this.forgeLevel + 1;
        switch(nextLevel) {
            case 1:
                return "Gold Mine + Archer Tower + Basic Upgrades";
            case 2:
                return "Poison Tower + Poison Upgrades + Better Mine Income";
            case 3:
                return "Cannon Tower + Explosive Upgrades + Better Mine Income";
            case 4:
                return "Magic Academy + Magic Tower + Fire Arrows + Better Mine Income";
            default:
                return nextLevel <= 10 ? "Improved Mine Income" : "Max Level Reached";
        }
    }
}
