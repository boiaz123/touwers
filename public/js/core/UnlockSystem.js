export class UnlockSystem {
    constructor() {
        this.reset();
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
        this.unlockedBuildings = new Set(['forge', 'training']);
        this.unlockedUpgrades = new Set();
        
        // New: Track gem mining research
        this.gemMiningResearched = false;
        
        // New: Track combination spells unlocked (for tower availability)
        this.unlockedCombinationSpells = new Set();
        
        // IMPORTANT: Superweapon starts LOCKED - only unlocked at Academy Level 3
        this.superweaponUnlocked = false;
    }
    
    onForgeBuilt() {
        if (this.forgeCount < this.maxForges) {
            this.hasForge = true;
            this.forgeCount++;
            this.forgeLevel = 1; // Built at level 1
            
            // Forge level 1 unlocks
            this.unlockedTowers.add('archer');
            this.unlockedBuildings.add('mine');
            
            console.log('UnlockSystem: Forge built at level 1 - unlocked archer tower and 1 mine');
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
        this.academyCount++;
        this.unlockedTowers.add('magic');
        this.unlockedUpgrades.add('gemMining'); // New: Unlock gem mining research
        console.log('UnlockSystem: Academy built - unlocked magic tower and gem mining research');
        return true;
    }
    
    // New: Method to unlock superweapon when academy reaches level 3
    onAcademyLevelThree() {
        console.log('UnlockSystem: onAcademyLevelThree() called!');
        this.superweaponUnlocked = true;
        this.unlockedBuildings.add('superweapon');
        console.log('UnlockSystem: Set superweaponUnlocked to true');
        console.log('UnlockSystem: superweaponUnlocked is now:', this.superweaponUnlocked);
        console.log('UnlockSystem: Academy Level 3 reached - Super Weapon Lab unlocked!');
    }
    
    // New: Method to handle gem mining research
    onGemMiningResearched() {
        this.gemMiningResearched = true;
        console.log('UnlockSystem: Gem mining tools researched');
    }
    
    // New: Check if gem mining is available
    canResearchGemMining() {
        return this.academyCount > 0 && !this.gemMiningResearched;
    }
    
    // New: Method to unlock a combination spell
    onCombinationSpellUnlocked(spellId) {
        this.unlockedCombinationSpells.add(spellId);
        console.log(`UnlockSystem: Combination spell ${spellId} unlocked`);
        
        // If ANY combination spell is unlocked, unlock the combination tower
        if (this.unlockedCombinationSpells.size > 0) {
            this.unlockedTowers.add('combination');
            console.log('UnlockSystem: Combination Tower unlocked!');
        }
    }
    
    // New: Check if combination tower can be built
    canBuildCombinationTower() {
        return this.unlockedCombinationSpells.size > 0;
    }
    
    // New: Method to unlock superweapon
    onSuperweaponUnlocked() {
        this.superweaponUnlocked = true;
        this.unlockedBuildings.add('superweapon');
        console.log('UnlockSystem: Super Weapon Lab building unlocked!');
    }
    
    getMaxMines() {
        // Level 1: 1 mine max
        // Level 2: 1 mine max
        // Level 3: 2 mines max
        // Level 4: 2 mines max
        // Level 5: 3 mines max
        if (this.forgeLevel >= 5) return 3;
        if (this.forgeLevel >= 3) return 2;
        if (this.forgeLevel >= 1) return 1;
        return 0;
    }
    
    onForgeUpgraded(newLevel) {
        this.forgeLevel = newLevel;
        
        switch(newLevel) {
            case 2:
                // Forge level 2 unlocks
                this.unlockedTowers.add('poison');
                console.log('UnlockSystem: Forge level 2 - unlocked poison archer tower');
                break;
                
            case 3:
                // Forge level 3 unlocks
                this.unlockedTowers.add('cannon');
                console.log('UnlockSystem: Forge level 3 - unlocked trebuchet tower and 2nd mine slot');
                break;
                
            case 4:
                // Forge level 4 unlocks
                this.unlockedBuildings.add('academy');
                console.log('UnlockSystem: Forge level 4 - unlocked magic academy');
                break;
                
            case 5:
                console.log(`UnlockSystem: Forge level 5 - unlocked 3rd mine slot`);
                break;
                
            default:
                console.log(`UnlockSystem: Forge level ${newLevel}`);
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
        if (type === 'mine' && this.mineCount >= this.getMaxMines()) {
            return false;
        }
        if (type === 'academy' && this.academyCount >= 1) {
            return false; // Only 1 academy allowed
        }
        if (type === 'superweapon' && this.superweaponUnlocked === false) {
            return false; // Only unlocked at Academy level 3
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
                return "Archer Tower + 1 Gold Mine";
            case 2:
                return "Poison Archer Tower + 2x Mine Income";
            case 3:
                return "Trebuchet Tower + 2nd Gold Mine + 2.5x Mine Income";
            case 4:
                return "Magic Academy + 3x Mine Income";
            case 5:
                return "3rd Gold Mine + 3.5x Mine Income";
            default:
                return "Max Level Reached";
        }
    }
}
