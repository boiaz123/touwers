import { Level1 } from './levels/Level1.js';

export class LevelManager {
    constructor() {
        this.levels = {
            1: { class: Level1, name: "The King's Road", difficulty: "Easy", unlocked: true },
            // Future levels can be added here
            // 2: { class: Level2, name: "Goblin Valley", difficulty: "Medium", unlocked: false },
            // 3: { class: Level3, name: "Dragon's Lair", difficulty: "Hard", unlocked: false }
        };
        this.currentLevel = null;
        this.currentLevelNumber = 1;
    }
    
    loadLevel(levelNumber) {
        const levelData = this.levels[levelNumber];
        if (!levelData) {
            console.error(`Level ${levelNumber} not found`);
            return false;
        }
        
        if (!levelData.unlocked) {
            console.error(`Level ${levelNumber} is locked`);
            return false;
        }
        
        this.currentLevel = new levelData.class();
        this.currentLevelNumber = levelNumber;
        return true;
    }
    
    getCurrentLevel() {
        return this.currentLevel;
    }
    
    getLevelList() {
        return Object.entries(this.levels).map(([number, data]) => ({
            number: parseInt(number),
            name: data.name,
            difficulty: data.difficulty,
            unlocked: data.unlocked
        }));
    }
    
    unlockLevel(levelNumber) {
        if (this.levels[levelNumber]) {
            this.levels[levelNumber].unlocked = true;
        }
    }
    
    canPlaceTower(x, y) {
        if (!this.currentLevel) return false;
        return this.currentLevel.canPlaceTower(x, y);
    }
    
    placeTower(x, y) {
        if (!this.currentLevel) return false;
        
        if (this.currentLevel.occupyGridCell(x, y)) {
            return this.currentLevel.getGridCenterPosition(x, y);
        }
        return false;
    }
    
    getPath() {
        return this.currentLevel ? this.currentLevel.worldPath : [];
    }
    
    render(ctx) {
        if (this.currentLevel) {
            this.currentLevel.render(ctx);
        }
    }
}
