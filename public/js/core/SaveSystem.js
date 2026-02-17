/**
 * SaveSystem - File-based save system with 3 independent save slots
 * 
 * Each save slot is a completely independent file stored as a localStorage entry.
 * Save files contain all settlement-related data: campaign progress, gold, inventory, 
 * upgrades, unlocks, and marketplace consumables.
 * 
 * No mid-game level saves are stored - saves are only created at settlement transitions.
 */
export class SaveSystem {
    static NUM_SLOTS = 3;
    
    /**
     * Get the storage key for a specific save slot file
     * @param {number} slotNumber - Slot number (1-3)
     * @returns {string} - The localStorage key for this slot
     */
    static getSaveSlotKey(slotNumber) {
        return `touwers_save_slot_${slotNumber}`;
    }

    /**
     * Initialize all save slot files
     * Called once on game startup to ensure all 3 slots exist (empty if no game saved)
     */
    static initializeSaveSlots() {
        for (let i = 1; i <= this.NUM_SLOTS; i++) {
            const key = this.getSaveSlotKey(i);
            if (!localStorage.getItem(key)) {
                // Slot file doesn't exist, create empty (null) slot
                localStorage.setItem(key, JSON.stringify(null));
            }
        }
    }

    /**
     * Get a specific save file by slot number
     * @param {number} slotNumber - Slot number (1-3)
     * @returns {Object|null} - Save data if slot contains a game, null if empty
     */
    static getSave(slotNumber) {
        if (slotNumber < 1 || slotNumber > this.NUM_SLOTS) {
            console.error(`SaveSystem: Invalid save slot: ${slotNumber}`);
            return null;
        }

        const key = this.getSaveSlotKey(slotNumber);
        const data = localStorage.getItem(key);
        
        if (!data) {
            return null;
        }

        try {
            const parsed = JSON.parse(data);
            return parsed; // Can be null (empty slot) or an object (saved game)
        } catch (error) {
            console.error(`SaveSystem: Failed to parse save slot ${slotNumber}:`, error);
            return null;
        }
    }

    /**
     * Save settlement data to a specific slot
     * This creates or overwrites the entire save file for that slot
     * Contains all settlement-related data but NO mid-game level state
     * @param {number} slotNumber - Slot number (1-3)
     * @param {Object} settlementData - Settlement data to save
     * @returns {boolean} - Success status
     */
    static saveSettlementData(slotNumber, settlementData) {
        if (slotNumber < 1 || slotNumber > this.NUM_SLOTS) {
            console.error(`SaveSystem: Invalid save slot: ${slotNumber}`);
            return false;
        }

        const key = this.getSaveSlotKey(slotNumber);
        
        // Create complete settlement save file for this slot
        const saveFile = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            // Settlement progression
            playerGold: settlementData.playerGold || 0,
            playerInventory: settlementData.playerInventory || [],
            upgrades: settlementData.upgrades || { purchasedUpgrades: [] },
            marketplace: settlementData.marketplace || { consumables: {} },
            statistics: settlementData.statistics || {
                victories: 0,
                defeats: 0,
                totalEnemiesSlain: 0,
                totalPlaytime: 0,
                totalItemsConsumed: 0,
                totalMoneySpentOnMarketplace: 0,
                totalMoneyEarnedInMarketplace: 0
            },
            // Campaign progression
            lastPlayedLevel: settlementData.lastPlayedLevel || 'level1',
            unlockedLevels: settlementData.unlockedLevels || ['level1'],
            completedLevels: settlementData.completedLevels || [],
            // Unlock system state (persistent unlocks across levels)
            unlockSystem: settlementData.unlockSystem || {
                forgeLevel: 0,
                hasForge: false,
                forgeCount: 0,
                mineCount: 0,
                academyCount: 0,
                trainingGroundsCount: 0,
                superweaponCount: 0,
                guardPostCount: 0,
                maxGuardPosts: 0,
                superweaponUnlocked: false,
                gemMiningResearched: false,
                unlockedTowers: [],
                unlockedBuildings: [],
                unlockedUpgrades: [],
                unlockedCombinationSpells: []
            }
        };

        try {
            localStorage.setItem(key, JSON.stringify(saveFile));
            return true;
        } catch (error) {
            console.error('SaveSystem: Failed to save settlement data to slot', slotNumber, ':', error);
            return false;
        }
    }

    /**
     * Wipe a save slot completely
     * Used when player starts a new game - sets the slot file back to empty (null)
     * @param {number} slotNumber - Slot number to wipe (1-3)
     * @returns {boolean} - Success status
     */
    static wipeSaveSlot(slotNumber) {
        if (slotNumber < 1 || slotNumber > this.NUM_SLOTS) {
            console.error(`SaveSystem: Invalid save slot: ${slotNumber}`);
            return false;
        }

        const key = this.getSaveSlotKey(slotNumber);
        try {
            localStorage.setItem(key, JSON.stringify(null));
            return true;
        } catch (error) {
            console.error('SaveSystem: Failed to wipe save slot', slotNumber, ':', error);
            return false;
        }
    }

    /**
     * Delete a save from a slot (alias for wipeSaveSlot for backwards compatibility)
     * @param {number} slotNumber - Slot number to delete (1-3)
     * @returns {boolean} - Success status
     */
    static deleteSave(slotNumber) {
        return this.wipeSaveSlot(slotNumber);
    }

    /**
     * Get the human-readable name for a level
     * @param {string} levelId - Level ID (e.g., 'level1')
     * @returns {string} - Display name for the level
     */
    static getLevelName(levelId) {
        const levelNames = {
            'level1': 'The King\'s Road',
            'level2': 'Braab\'s Path',
            'level3': 'Crazy Frogs',
            'level4': 'Dave\'s Cave',
            'level5': 'Placeholder Level',
            'sandbox': 'Sandbox Mode'
        };
        return levelNames[levelId] || levelId;
    }

    /**
     * Get formatted level display (e.g., "Level 1: The King's Road")
     * @param {string} levelId - Level ID
     * @returns {string} - Formatted level name with number
     */
    static getFormattedLevelName(levelId) {
        const levelNumbers = {
            'level1': 1,
            'level2': 2,
            'level3': 3,
            'level4': 4,
            'level5': 5,
            'sandbox': '∞'
        };
        
        const number = levelNumbers[levelId] || '?';
        const name = this.getLevelName(levelId);
        
        if (levelId === 'sandbox') {
            return `${name}`;
        }
        return `Level ${number}: ${name}`;
    }

    /**
     * Get formatted save data for display in save slot selection and load menus
     * Shows whether slot is empty or contains a game with progress information
     * @param {number} slotNumber - Slot number (1-3)
     * @returns {Object} - Display information for the save slot
     */
    static getSaveInfo(slotNumber) {
        const save = this.getSave(slotNumber);

        if (!save) {
            return {
                isEmpty: true,
                slotNumber: slotNumber,
                displayText: 'Empty Save Slot',
                description: 'Click to start a new game'
            };
        }

        const date = new Date(save.timestamp);
        const dateString = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
        // Count completed levels
        const completedCount = (save.completedLevels && save.completedLevels.length) || 0;
        
        // Get last played level for display
        const lastPlayedLevelId = save.lastPlayedLevel || 'level1';
        const formattedLevelName = this.getFormattedLevelName(lastPlayedLevelId);
        
        return {
            isEmpty: false,
            slotNumber: slotNumber,
            displayText: `Completed: ${completedCount} Level${completedCount !== 1 ? 's' : ''}`,
            detailText: formattedLevelName,
            dateString: dateString,
            lastPlayedLevel: save.lastPlayedLevel,
            completedLevels: save.completedLevels || [],
            unlockedLevels: save.unlockedLevels || [],
            completedCount: completedCount,
            playerGold: save.playerGold || 0,
            inventoryCount: (save.playerInventory && save.playerInventory.length) || 0
        };
    }

    /**
     * Create a new game save state with all settlement data initialized to defaults
     * Called when a player starts a new game
     * @returns {Object} - Fresh settlement data for a new save
     */
    static createNewGameState() {
        return {
            playerGold: 0,
            playerInventory: [],
            upgrades: { purchasedUpgrades: [] },
            marketplace: { consumables: {} },
            statistics: {
                victories: 0,
                defeats: 0,
                totalEnemiesSlain: 0,
                totalPlaytime: 0,
                totalItemsConsumed: 0,
                totalMoneySpentOnMarketplace: 0,
                totalMoneyEarnedInMarketplace: 0
            },
            lastPlayedLevel: 'level1',
            unlockedLevels: ['level1'],
            completedLevels: [],
            unlockSystem: {
                forgeLevel: 0,
                hasForge: false,
                forgeCount: 0,
                mineCount: 0,
                academyCount: 0,
                trainingGroundsCount: 0,
                superweaponCount: 0,
                guardPostCount: 0,
                maxGuardPosts: 0,
                superweaponUnlocked: false,
                gemMiningResearched: false,
                unlockedTowers: [],
                unlockedBuildings: [],
                unlockedUpgrades: [],
                unlockedCombinationSpells: []
            }
        };
    }

    /**
     * Check if a level is unlocked in a save
     * @param {string} levelId - Level ID to check
     * @param {Array} unlockedLevels - Array of unlocked level IDs
     * @returns {boolean} - True if the level is unlocked
     */
    static isLevelUnlocked(levelId, unlockedLevels) {
        return unlockedLevels.includes(levelId);
    }

    /**
     * Check if a level is completed in a save
     * @param {string} levelId - Level ID to check
     * @param {Array} completedLevels - Array of completed level IDs
     * @returns {boolean} - True if the level is completed
     */
    static isLevelCompleted(levelId, completedLevels) {
        return completedLevels.includes(levelId);
    }

    /**
     * Unlock the next level after completing the current one
     * @param {string} levelId - The level just completed
     * @param {Array} unlockedLevels - Current array of unlocked levels
     * @returns {Array} - Updated unlocked levels array
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
     * @param {string} levelId - Level ID to mark as completed
     * @param {Array} completedLevels - Current array of completed levels
     * @returns {Array} - Updated completed levels array
     */
    static markLevelCompleted(levelId, completedLevels) {
        if (!completedLevels.includes(levelId)) {
            completedLevels.push(levelId);
        }
        return completedLevels;
    }
}
