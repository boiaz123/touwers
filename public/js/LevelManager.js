export class LevelManager {
    constructor() {
        this.currentLevel = 1;
        this.maxLevel = 30;
        this.levels = new Map();
        this.levelsLoaded = false;
    }
    
    async loadAllLevels() {
        console.log('Loading levels...');
        for (let i = 1; i <= this.maxLevel; i++) {
            try {
                const module = await import(`./levels/Level${i.toString().padStart(2, '0')}.js`);
                this.levels.set(i, module.default);
                console.log(`Loaded level ${i}:`, module.default.name);
            } catch (error) {
                console.warn(`Failed to load level ${i}:`, error);
                // Create a fallback level
                this.levels.set(i, {
                    name: `Level ${i}`,
                    description: "Fallback level",
                    generatePath: (width, height) => [
                        { x: 0, y: height * 0.5 },
                        { x: width, y: height * 0.5 }
                    ]
                });
            }
        }
        this.levelsLoaded = true;
        console.log('All levels loaded, total:', this.levels.size);
    }
    
    getCurrentLevel() {
        const level = this.levels.get(this.currentLevel);
        console.log(`Getting level ${this.currentLevel}:`, level);
        return level || this.getDefaultLevel();
    }
    
    getDefaultLevel() {
        return {
            name: "Default Level",
            description: "Default fallback level",
            generatePath: (width, height) => [
                { x: 0, y: height * 0.5 },
                { x: width * 0.3, y: height * 0.5 },
                { x: width * 0.3, y: height * 0.2 },
                { x: width * 0.7, y: height * 0.2 },
                { x: width * 0.7, y: height * 0.8 },
                { x: width, y: height * 0.8 }
            ]
        };
    }
    
    async waitForLevelsLoaded() {
        while (!this.levelsLoaded) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
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
