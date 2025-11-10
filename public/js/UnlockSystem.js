export class UnlockSystem {
    constructor() {
        // Building counts
        this.hasForge = false;
        this.forgeCount = 0;
        this.maxForges = 1;
        this.forgeLevel = 0;
        
        this.mineCount = 0;
        this.academyCount = 0;
        
        // Unlocked content
        this.unlockedTowers = new Set(['basic', 'barricade']); // Start with basic towers
        this.unlockedBuildings = new Set(['forge']); // Start with forge
        this.unlockedUpgrades = new Set(); // No upgrades initially
    }
    
    reset() {
        this.forgeLevel = 0;
        this.hasForge = false;
        this.forgeCount = 0;
        this.maxForges = 1;
        this.mineCount = 0;
        this.academyCount = 0;
        
        // Base unlocks
        this.unlockedTowers = new Set(['basic', 'barricade']);
        this.unlockedBuildings = new Set(['forge']);
        this.unlockedUpgrades = new Set();
    }
    
    onForgeBuilt() {
        if (this.forgeCount < this.maxForges) {
            this.hasForge = true;
            this.forgeCount++;
            this.forgeLevel = 1; // This should match the forge's starting level
            
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
    
    onMineBuilt() {
        if (this.mineCount < this.getMaxMines()) {
            this.mineCount++;
            console.log(`UnlockSystem: Mine built - ${this.mineCount}/${this.getMaxMines()}`);
            return true;
        }
        return false;
    }
    
    onAcademyBuilt() {
        if (this.academyCount < 1) {
            this.academyCount++;
            this.unlockedTowers.add('magic');
            console.log('UnlockSystem: Academy built - Magic Tower unlocked');
            return true;
        }
        return false;
    }
    
    getMaxMines() {
        if (this.forgeLevel < 5) return 1;
        if (this.forgeLevel < 8) return 2;
        if (this.forgeLevel < 10) return 3;
        return 4;
    }
    
    onForgeUpgraded(newLevel) {
        this.forgeLevel = newLevel;
        
        switch(newLevel) {
            case 2:
                this.unlockedTowers.add('poison');
                this.unlockedUpgrades.add('poisonDamage');
                console.log('UnlockSystem: Forge level 2 - unlocked poison tower and upgrades');
                break;
                
            case 3:
                this.unlockedTowers.add('cannon');
                this.unlockedUpgrades.add('explosiveRadius');
                console.log('UnlockSystem: Forge level 3 - unlocked cannon tower and upgrades');
                break;
                
            case 4:
                this.unlockedBuildings.add('academy');
                this.unlockedUpgrades.add('fireArrows');
                console.log('UnlockSystem: Forge level 4 - unlocked magic academy');
                break;
                
            case 5:
                console.log(`UnlockSystem: Forge level 5 - can now build ${this.getMaxMines()} mines`);
                break;
                
            case 8:
                console.log(`UnlockSystem: Forge level 8 - can now build ${this.getMaxMines()} mines`);
                break;
                
            case 10:
                console.log(`UnlockSystem: Forge level 10 - can now build ${this.getMaxMines()} mines`);
                break;
                
            default:
                console.log(`UnlockSystem: Forge level ${newLevel} - improved mine efficiency`);
                break;
        }
    }
    
    canBuildTower(towerType) {
        return this.unlockedTowers.has(towerType);
    }
    
    canBuildBuilding(buildingType) {
        return this.unlockedBuildings.has(buildingType);
    }
    
    canUseUpgrade(upgradeType) {
        return this.unlockedUpgrades.has(upgradeType);
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
            case 5:
                return "2nd Gold Mine + Better Mine Income";
            case 8:
                return "3rd Gold Mine + Better Mine Income";
            case 10:
                return "4th Gold Mine + Better Mine Income";
            default:
                return nextLevel <= 10 ? "Improved Mine Income" : "Max Level Reached";
        }
    }
}
