export class SaveSystem {
    static STORAGE_KEY = 'touwers_saves';
    static NUM_SLOTS = 3;

    /**
     * Get all saves
     */
    static getAllSaves() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        if (!data) {
            return this.initializeSaves();
        }
        return JSON.parse(data);
    }

    /**
     * Initialize saves if they don't exist
     */
    static initializeSaves() {
        const saves = {
            slot1: null,
            slot2: null,
            slot3: null
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saves));
        return saves;
    }

    /**
     * Get a specific save by slot number (1-3)
     */
    static getSave(slotNumber) {
        if (slotNumber < 1 || slotNumber > this.NUM_SLOTS) {
            console.error(`Invalid save slot: ${slotNumber}`);
            return null;
        }

        const saves = this.getAllSaves();
        const slotKey = `slot${slotNumber}`;
        return saves[slotKey];
    }

    /**
     * Save game progress to a slot
     */
    static saveGame(slotNumber, gameData) {
        if (slotNumber < 1 || slotNumber > this.NUM_SLOTS) {
            console.error(`Invalid save slot: ${slotNumber}`);
            return false;
        }

        const saves = this.getAllSaves();
        const slotKey = `slot${slotNumber}`;

        saves[slotKey] = {
            timestamp: new Date().toISOString(),
            lastPlayedLevel: gameData.lastPlayedLevel,
            unlockedLevels: gameData.unlockedLevels,
            completedLevels: gameData.completedLevels,
            currentLevelProgress: gameData.currentLevelProgress || {}
        };

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saves));
        console.log(`Game saved to slot ${slotNumber}`, saves[slotKey]);
        return true;
    }

    /**
     * Delete a save from a slot
     */
    static deleteSave(slotNumber) {
        if (slotNumber < 1 || slotNumber > this.NUM_SLOTS) {
            console.error(`Invalid save slot: ${slotNumber}`);
            return false;
        }

        const saves = this.getAllSaves();
        const slotKey = `slot${slotNumber}`;
        saves[slotKey] = null;

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saves));
        console.log(`Save slot ${slotNumber} deleted`);
        return true;
    }

    /**
     * Get formatted save data for display
     */
    static getSaveInfo(slotNumber) {
        const save = this.getSave(slotNumber);

        if (!save) {
            return {
                isEmpty: true,
                slotNumber: slotNumber,
                displayText: 'Empty Save Slot'
            };
        }

        const date = new Date(save.timestamp);
        const dateString = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
        return {
            isEmpty: false,
            slotNumber: slotNumber,
            displayText: `Progress: Level ${save.lastPlayedLevel}`,
            dateString: dateString,
            lastPlayedLevel: save.lastPlayedLevel,
            unlockedLevels: save.unlockedLevels,
            completedLevels: save.completedLevels
        };
    }

    /**
     * Create a new game save state (only level 1 unlocked)
     */
    static createNewGameState() {
        return {
            lastPlayedLevel: 'level1',
            unlockedLevels: ['level1'],
            completedLevels: [],
            currentLevelProgress: {}
        };
    }

    /**
     * Check if a level is unlocked in a save
     */
    static isLevelUnlocked(levelId, unlockedLevels) {
        return unlockedLevels.includes(levelId);
    }

    /**
     * Check if a level is completed in a save
     */
    static isLevelCompleted(levelId, completedLevels) {
        return completedLevels.includes(levelId);
    }

    /**
     * Unlock the next level after completing current one
     */
    static unlockNextLevel(levelId, unlockedLevels) {
        const levelMap = {
            'level1': 'level2',
            'level2': 'level3',
            'level3': 'level4',
            'level4': 'level5',
            'level5': null,
            'sandbox': null
        };

        const nextLevel = levelMap[levelId];
        if (nextLevel && !unlockedLevels.includes(nextLevel)) {
            unlockedLevels.push(nextLevel);
        }

        return unlockedLevels;
    }

    /**
     * Mark a level as completed
     */
    static markLevelCompleted(levelId, completedLevels) {
        if (!completedLevels.includes(levelId)) {
            completedLevels.push(levelId);
        }
        return completedLevels;
    }
}
