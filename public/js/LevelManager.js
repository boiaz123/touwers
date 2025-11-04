export class LevelManager {
    constructor() {
        this.currentLevel = 1;
        this.maxLevel = 30;
        this.levels = new Map();
        this.loadAllLevels();
    }
    
    async loadAllLevels() {
        for (let i = 1; i <= this.maxLevel; i++) {
            try {
                const module = await import(`./levels/Level${i.toString().padStart(2, '0')}.js`);
                this.levels.set(i, module.default);
            } catch (error) {
                console.warn(`Failed to load level ${i}:`, error);
            }
        }
    }
    
    getCurrentLevel() {
        return this.levels.get(this.currentLevel) || this.levels.get(1);
    }
    
    nextLevel() {
        if (this.currentLevel < this.maxLevel) {
            this.currentLevel++;
            return true;
        }
        return false;
    }
    
    setLevel(levelNumber) {
        if (levelNumber >= 1 && levelNumber <= this.maxLevel) {
            this.currentLevel = levelNumber;
            return true;
        }
        return false;
    }
    
    getLevelNumber() {
        return this.currentLevel;
    }
    
    isLastLevel() {
        return this.currentLevel >= this.maxLevel;
    }
}
