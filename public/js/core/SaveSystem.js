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
     * Save settlement data to a specific slot
     * Saves only settlement-wide data: campaign progress, upgrades, inventory, unlocks, etc
     * Does NOT save mid-game level state
     */
    static saveSettlementData(slotNumber, settlementData) {
        if (slotNumber < 1 || slotNumber > this.NUM_SLOTS) {
            console.error(`Invalid save slot: ${slotNumber}`);
            return false;
        }

        const saves = this.getAllSaves();
        const slotKey = `slot${slotNumber}`;

        // Save only settlement-wide data, dedicated to this specific slot
        saves[slotKey] = {
            timestamp: new Date().toISOString(),
            // Settlement progression
            playerGold: settlementData.playerGold || 0,
            playerInventory: settlementData.playerInventory || [],
            upgrades: settlementData.upgrades || { purchasedUpgrades: [] },
            marketplace: settlementData.marketplace || { consumables: {} },
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
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saves));
            console.log('SaveSystem: Successfully saved settlement data to slot', slotNumber);
            return true;
        } catch (error) {
            console.error('SaveSystem: Failed to save settlement data:', error);
            return false;
        }
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
        return true;
    }

    /**
     * Get level name by level ID
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
     * Create a new game save state with all settlement data initialized
     * Returns complete settlement data for a fresh save
     */
    static createNewGameState() {
        return {
            playerGold: 0,
            playerInventory: [],
            upgrades: { purchasedUpgrades: [] },
            marketplace: { consumables: { 'magic-tower-flatpack': 1 } },
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

    /**
     * Save campaign progress (settlement data: gold, inventory, upgrades)
     * This is campaign-wide data, not level-specific
     * Now scoped to specific save slot instead of global
     */
    static saveCampaignProgress(playerGold, playerInventory, upgradeSystem, slotNumber = null) {
        // Determine which slot to save to
        if (slotNumber === null) {
            slotNumber = this.getCurrentSlot ? this.getCurrentSlot() : 1;
        }
        
        const campaignProgressKey = `touwers_campaign_progress_slot${slotNumber}`;
        
        const progress = {
            playerGold: playerGold || 0,
            playerInventory: playerInventory || [],
            upgrades: upgradeSystem ? upgradeSystem.serialize() : { purchasedUpgrades: [] },
            timestamp: new Date().toISOString()
        };

        try {
            localStorage.setItem(campaignProgressKey, JSON.stringify(progress));
            console.log('SaveSystem: Saved campaign progress to slot', slotNumber);
            return true;
        } catch (error) {
            console.error('SaveSystem: Failed to save campaign progress:', error);
            return false;
        }
    }

    /**
     * Load campaign progress (settlement data)
     * Now loads from the specific save slot instead of global
     */
    static loadCampaignProgress(slotNumber = null) {
        // Determine which slot to load from
        if (slotNumber === null) {
            slotNumber = this.getCurrentSlot ? this.getCurrentSlot() : 1;
        }
        
        const campaignProgressKey = `touwers_campaign_progress_slot${slotNumber}`;
        const data = localStorage.getItem(campaignProgressKey);
        
        if (!data) {
            console.log('SaveSystem: No campaign progress found for slot', slotNumber, '- returning defaults');
            return {
                playerGold: 0,
                playerInventory: [],
                upgrades: { purchasedUpgrades: [] }
            };
        }

        try {
            const parsed = JSON.parse(data);
            console.log('SaveSystem: Loaded campaign progress for slot', slotNumber);
            return parsed;
        } catch (error) {
            console.error('SaveSystem: Failed to parse campaign progress:', error);
            return {
                playerGold: 0,
                playerInventory: [],
                upgrades: { purchasedUpgrades: [] },
                marketplace: { consumables: {} }
            };
        }
    }

    /**
     * Clear campaign progress (used for new game)
     * Now clears only for specific save slot
     */
    static clearCampaignProgress(slotNumber = null) {
        if (slotNumber === null) {
            slotNumber = this.getCurrentSlot ? this.getCurrentSlot() : 1;
        }
        
        const campaignProgressKey = `touwers_campaign_progress_slot${slotNumber}`;
        try {
            localStorage.removeItem(campaignProgressKey);
            console.log('SaveSystem: Cleared campaign progress for slot', slotNumber);
            return true;
        } catch (error) {
            console.error('SaveSystem: Failed to clear campaign progress:', error);
            return false;
        }
    }

    /**
     * Get the current save slot number
     * Used for determining which slot's campaign progress to use
     */
    static getCurrentSlot() {
        // Check if there's a slot number stored in the game state manager
        // This should be set when entering from SaveSlotSelection or LoadGame
        if (window.gameStateManager && window.gameStateManager.currentSaveSlot) {
            return window.gameStateManager.currentSaveSlot;
        }
        
        // Default to slot 1 if not set
        return 1;
    }
}