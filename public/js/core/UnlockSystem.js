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
        this.trainingGroundsCount = 0;
        this.superweaponCount = 0;
        this.guardPostCount = 0;
        this.maxGuardPosts = 0;
        
        // Base unlocks
        this.unlockedTowers = new Set(['basic', 'barricade']);
        this.unlockedBuildings = new Set(['forge']);
        this.unlockedUpgrades = new Set();
        
        // New: Track gem mining research
        this.gemMiningResearched = false;
        
        // New: Track combination spells unlocked (for tower availability)
        this.unlockedCombinationSpells = new Set();
        
        // IMPORTANT: Superweapon starts LOCKED - only unlocked at Academy Level 3
        this.superweaponUnlocked = false;
        
        // IMPORTANT: Magic Tower starts LOCKED - only unlocked when Academy is built (level 1)
        this.magicTowerUnlockedByAcademy = false;
    }
    
    onForgeBuilt() {
        if (this.forgeCount < this.maxForges) {
            this.hasForge = true;
            this.forgeCount++;
            this.forgeLevel = 1; // Built at level 1
            
            // Forge level 1 unlocks
            this.unlockedTowers.add('archer');
            this.unlockedBuildings.add('mine');
            
            return true;
        }
        return false;
    }
    
    onMineBuilt() {
        if (this.mineCount < this.getMaxMines()) {
            this.mineCount++;
            return true;
        }
        return false;
    }
    
    onAcademyBuilt() {
        this.academyCount++;
        // Level 1: Magic Tower and Gem Mining automatically unlocked
        this.magicTowerUnlockedByAcademy = true; // Mark magic tower as unlocked by academy
        this.unlockedTowers.add('magic');
        this.gemMiningResearched = true; // Automatically enabled at level 1
        return true;
    }

    /**
     * Handle Training Grounds built
     */
    onTrainingGroundsBuilt() {
        if (this.trainingGroundsCount < 1) {
            this.trainingGroundsCount++;
            return true;
        }
        return false;
    }

    /**
     * Handle SuperWeapon Lab built
     */
    onSuperweaponLabBuilt() {
        if (this.superweaponCount < 1 && this.superweaponUnlocked) {
            this.superweaponCount++;
            // Unlock combination tower when super weapon lab is built
            this.unlockedTowers.add('combination');
            return true;
        }
        return false;
    }
    
    // New: Method to unlock superweapon when academy reaches level 3
    onAcademyLevelThree() {
        this.superweaponUnlocked = true;
        this.unlockedBuildings.add('superweapon');
    }
    
    // New: Method to unlock diamond press when superweapon lab reaches level 2
    onSuperweaponLabLevelTwo() {
        this.unlockedBuildings.add('diamond-press');
    }
    
    // New: Method to unlock training grounds when training-gear upgrade is purchased
    onTrainingGearUpgradePurchased() {
        this.unlockedBuildings.add('training');
    }
    
    // New: Method to handle Training Grounds level upgrades
    onTrainingGroundsUpgraded(newLevel) {
        switch(newLevel) {
            case 4:
                // Training Grounds level 4 unlocks Guard Post tower
                this.unlockedTowers.add('guard-post');
                this.maxGuardPosts = 1;
                break;
            case 5:
                // Training Grounds level 5 keeps guard post limit at 1
                this.maxGuardPosts = 1;
                break;
            default:
                break;
        }
    }
    
    // New: Track Guard Post built
    onGuardPostBuilt() {
        if (this.guardPostCount < this.maxGuardPosts) {
            this.guardPostCount++;
            return true;
        }
        return false;
    }
    
    // New: Track Guard Post destroyed/sold
    onGuardPostDestroyed() {
        if (this.guardPostCount > 0) {
            this.guardPostCount--;
        }
    }
    
    // Alias for selling guard posts
    onGuardPostSold() {
        this.onGuardPostDestroyed();
    }
    
    /**
     * Building sold - decrement building count
     */
    onBuildingSold(buildingType) {
        switch(buildingType) {
            case 'forge':
                if (this.forgeCount > 0) {
                    this.forgeCount--;
                    if (this.forgeCount === 0) {
                        this.hasForge = false;
                    }
                }
                break;
            case 'mine':
                if (this.mineCount > 0) {
                    this.mineCount--;
                }
                break;
            case 'academy':
                if (this.academyCount > 0) {
                    this.academyCount--;
                }
                break;
            case 'training':
                if (this.trainingGroundsCount > 0) {
                    this.trainingGroundsCount--;
                }
                break;
            case 'superweapon':
                if (this.superweaponCount > 0) {
                    this.superweaponCount--;
                }
                break;
            case 'guard-post':
                this.onGuardPostDestroyed();
                break;
        }
    }
    
    // New: Method to handle gem mining research
    onGemMiningResearched() {
        this.gemMiningResearched = true;
    }
    
    // New: Check if gem mining is available
    canResearchGemMining() {
        return this.academyCount > 0 && !this.gemMiningResearched;
    }
    
    // New: Method to unlock a combination spell
    onCombinationSpellUnlocked(spellId) {
        this.unlockedCombinationSpells.add(spellId);
        
        // If ANY combination spell is unlocked, unlock the combination tower
        if (this.unlockedCombinationSpells.size > 0) {
            this.unlockedTowers.add('combination');
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
                break;
                
            case 3:
                // Forge level 3 unlocks
                this.unlockedTowers.add('cannon');
                break;
                
            case 4:
                // Forge level 4 unlocks
                this.unlockedBuildings.add('academy');
                break;
                
            case 5:
                break;
                
            default:
                break;
        }
    }
    
    canBuildTower(type) {
        // Special handling for guard-post - check count limit
        if (type === 'guard-post') {
            return this.unlockedTowers.has(type) && this.guardPostCount < this.maxGuardPosts;
        }
        return this.unlockedTowers.has(type);
    }

    /**
     * Check if a building is unlocked (appears in menu)
     * This is different from canBuildBuilding - it only checks if the building type is available
     */
    isBuildingUnlocked(type) {
        // Superweapon is special - only appears when unlocked at Academy level 3
        if (type === 'superweapon') {
            return this.superweaponUnlocked;
        }
        return this.unlockedBuildings.has(type);
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
        if (type === 'training' && this.trainingGroundsCount >= 1) {
            return false; // Only 1 training grounds allowed
        }
        if (type === 'superweapon' && this.superweaponUnlocked === false) {
            return false; // Only unlocked at Academy level 3
        }
        if (type === 'superweapon' && this.superweaponCount >= 1) {
            return false; // Only 1 superweapon lab allowed
        }
        if (type === 'diamond-press' && !this.unlockedBuildings.has('diamond-press')) {
            return false; // Only unlocked at Super Weapon Lab level 2
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
