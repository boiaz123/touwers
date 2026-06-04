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

    static get DEFAULT_UNLOCK_STATE() {
        return {
            forgeLevel: 0,
            hasForge: false,
            forgeCount: 0,
            mineCount: 0,
            academyCount: 0,
            trainingGroundsCount: 0,
            superweaponCount: 0,
            diamondPressCount: 0,
            guardPostCount: 0,
            maxGuardPosts: 0,
            superweaponUnlocked: false,
            gemMiningResearched: false,
            unlockedTowers: [],
            unlockedBuildings: [],
            unlockedUpgrades: [],
            unlockedCombinationSpells: []
        };
    }

    static get DEFAULT_STATISTICS() {
        return {
            victories: 0,
            defeats: 0,
            totalEnemiesSlain: 0,
            totalPlaytime: 0,
            totalItemsConsumed: 0,
            totalMoneySpentOnMarketplace: 0,
            totalMoneyEarnedInMarketplace: 0
        };
    }

    static _validateSlot(slotNumber) {
        if (slotNumber < 1 || slotNumber > SaveSystem.NUM_SLOTS) {
            console.error(`SaveSystem: Invalid save slot: ${slotNumber}`);
            return false;
        }
        return true;
    }

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
        if (!SaveSystem._validateSlot(slotNumber)) return null;

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
        if (!SaveSystem._validateSlot(slotNumber)) return false;

        const key = this.getSaveSlotKey(slotNumber);
        
        // Create complete settlement save file for this slot
        const saveFile = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            commanderName: settlementData.commanderName || '',
            // Settlement progression
            playerGold: settlementData.playerGold || 0,
            playerInventory: settlementData.playerInventory || [],
            upgrades: settlementData.upgrades || { purchasedUpgrades: [] },
            marketplace: settlementData.marketplace || { consumables: {} },
            statistics: settlementData.statistics || SaveSystem.DEFAULT_STATISTICS,
            achievements: settlementData.achievements || { unlockedIds: [] },
            // Campaign progression
            lastPlayedLevel: settlementData.lastPlayedLevel || 'level1',
            unlockedLevels: settlementData.unlockedLevels || ['level1'],
            completedLevels: settlementData.completedLevels || [],
            completedCampaigns: settlementData.completedCampaigns || [],
            unlockedCampaigns: settlementData.unlockedCampaigns || ['campaign-1'],
            // Unlock system state (persistent unlocks across levels)
            unlockSystem: settlementData.unlockSystem || SaveSystem.DEFAULT_UNLOCK_STATE,
            playerLevels: settlementData.playerLevels || []
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
        if (!SaveSystem._validateSlot(slotNumber)) return false;

        const key = this.getSaveSlotKey(slotNumber);
        try {
            localStorage.setItem(key, JSON.stringify(null));
            // Also remove the .sav file — fire-and-forget
            SaveSystem.deleteFile(slotNumber);
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
     * Update and save settlement data while preserving commander name and campaign progression
     * This is the PREFERRED save method during gameplay to ensure consistent saves across all contexts
     * @param {number} slotNumber - Slot number (1-3)
     * @param {Object} updateData - Data to update (will be merged with existing save)
     * @returns {boolean} - Success status
     */
    static updateAndSaveSettlementData(slotNumber, updateData) {
        if (!SaveSystem._validateSlot(slotNumber)) return false;

        // Get existing save to preserve commander name and campaign progression
        const existingSave = this.getSave(slotNumber);
        
        // Build the save data, preserving existing values
        const saveData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            // Always preserve commander name from existing save
            commanderName: existingSave?.commanderName || updateData.commanderName || '',
            // Settlement state
            playerGold: updateData.playerGold !== undefined ? updateData.playerGold : (existingSave?.playerGold || 0),
            playerInventory: updateData.playerInventory !== undefined ? updateData.playerInventory : (existingSave?.playerInventory || []),
            upgrades: updateData.upgrades || existingSave?.upgrades || { purchasedUpgrades: [] },
            marketplace: updateData.marketplace || existingSave?.marketplace || { consumables: {} },
            statistics: updateData.statistics || existingSave?.statistics || SaveSystem.DEFAULT_STATISTICS,
            achievements: updateData.achievements || existingSave?.achievements || { unlockedIds: [] },
            // Campaign progression - always preserve
            lastPlayedLevel: updateData.lastPlayedLevel !== undefined ? updateData.lastPlayedLevel : (existingSave?.lastPlayedLevel || 'level1'),
            unlockedLevels: updateData.unlockedLevels !== undefined ? updateData.unlockedLevels : (existingSave?.unlockedLevels || ['level1']),
            completedLevels: updateData.completedLevels !== undefined ? updateData.completedLevels : (existingSave?.completedLevels || []),
            completedCampaigns: updateData.completedCampaigns !== undefined ? updateData.completedCampaigns : (existingSave?.completedCampaigns || []),
            unlockedCampaigns: updateData.unlockedCampaigns !== undefined ? updateData.unlockedCampaigns : (existingSave?.unlockedCampaigns || ['campaign-1']),
            unlockSystem: updateData.unlockSystem || existingSave?.unlockSystem || SaveSystem.DEFAULT_UNLOCK_STATE,
            playerLevels: updateData.playerLevels !== undefined ? updateData.playerLevels : (existingSave?.playerLevels || [])
        };

        const key = this.getSaveSlotKey(slotNumber);
        try {
            localStorage.setItem(key, JSON.stringify(saveData));
            return true;
        } catch (error) {
            console.error('SaveSystem: Failed to update and save settlement data to slot', slotNumber, ':', error);
            return false;
        }
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
                commanderName: '',
                dateString: 'Empty',
                displayText: 'Empty Save Slot'
            };
        }

        const date = new Date(save.timestamp);
        const dateString = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        const commanderName = save.commanderName || 'Unknown Commander';
        
        return {
            isEmpty: false,
            slotNumber: slotNumber,
            commanderName: commanderName,
            dateString: dateString,
            displayText: commanderName,
            lastPlayedLevel: save.lastPlayedLevel,
            completedLevels: save.completedLevels || [],
            unlockedLevels: save.unlockedLevels || [],
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
            commanderName: '',
            playerGold: 0,
            playerInventory: [],
            upgrades: { purchasedUpgrades: [] },
            marketplace: { consumables: {} },
            statistics: SaveSystem.DEFAULT_STATISTICS,
            lastPlayedLevel: 'level1',
            unlockedLevels: ['level1'],
            completedLevels: [],
            completedCampaigns: [],
            unlockedCampaigns: ['campaign-1'],
            unlockSystem: SaveSystem.DEFAULT_UNLOCK_STATE,
            playerLevels: []
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
            'level1':  'level2',
            'level2':  'level3',
            'level3':  'level4',
            'level4':  'level5',
            'level5':  'level6',
            'level6':  'level7',
            'level7':  'level8',
            'level8':  'level9',
            'level9':  'level10',
            'level10': 'level11',
            'level11': 'level12',
            'level12': null,
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

    /**
     * Mark a campaign as completed
     * @param {string} campaignId - Campaign ID to mark as completed (e.g. 'campaign-1')
     * @param {Array} completedCampaigns - Current array of completed campaign IDs
     * @returns {Array} - Updated completed campaigns array
     */
    static markCampaignCompleted(campaignId, completedCampaigns) {
        if (!completedCampaigns.includes(campaignId)) {
            completedCampaigns.push(campaignId);
        }
        return completedCampaigns;
    }

    /**
     * Unlock a campaign in an unlockedCampaigns array
     * @param {string} campaignId - Campaign ID to unlock
     * @param {Array} unlockedCampaigns - Current array of unlocked campaign IDs
     * @returns {Array} - Updated unlocked campaigns array
     */
    static unlockCampaign(campaignId, unlockedCampaigns) {
        if (!unlockedCampaigns.includes(campaignId)) {
            unlockedCampaigns.push(campaignId);
        }
        return unlockedCampaigns;
    }

    /**
     * Check if a campaign is completed
     * @param {string} campaignId - Campaign ID to check
     * @param {Array} completedCampaigns - Array of completed campaign IDs
     * @returns {boolean}
     */
    static isCampaignCompleted(campaignId, completedCampaigns) {
        return Array.isArray(completedCampaigns) && completedCampaigns.includes(campaignId);
    }

    /**
     * Check if a campaign is unlocked
     * @param {string} campaignId - Campaign ID to check
     * @param {Array} unlockedCampaigns - Array of unlocked campaign IDs
     * @returns {boolean}
     */
    static isCampaignUnlocked(campaignId, unlockedCampaigns) {
        const defaults = ['campaign-1', 'campaign-5'];
        if (defaults.includes(campaignId)) return true;
        return Array.isArray(unlockedCampaigns) && unlockedCampaigns.includes(campaignId);
    }

    // -------------------------------------------------------------------------
    // File-based save layer (Tauri desktop only)
    //
    // localStorage is the working copy — updated throughout gameplay.
    // .sav files on disk are written ONLY on explicit player save actions and
    // serve as the portable, integrity-protected canonical save files.
    //
    // Save file location (Windows):
    //   %APPDATA%\com.touwers.game\saves\slot_1.sav  (and slot_2, slot_3)
    // -------------------------------------------------------------------------

    /** Salt mixed into the integrity hash. Embedded in code, deters casual edits. */
    static INTEGRITY_SALT = 'touwers-save-v1-c7f2a9b4e3d8';

    /** Returns true when running inside the Tauri desktop app. */
    static isTauri() {
        return typeof window !== 'undefined' && window.__TAURI_INTERNALS__ != null;
    }

    /** Returns the Tauri invoke function, or null when not in Tauri. */
    static getTauriInvoke() {
        if (!SaveSystem.isTauri()) return null;
        return window.__TAURI_INTERNALS__.invoke;
    }

    /**
     * Compute a SHA-256 integrity hash for a save data object.
     * @param {Object} dataObj
     * @returns {Promise<string>} hex digest
     */
    static async computeIntegrity(dataObj) {
        const dataStr = JSON.stringify(dataObj) + SaveSystem.INTEGRITY_SALT;
        const encoded = new TextEncoder().encode(dataStr);
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Verify the integrity hash of a loaded save file.
     * @param {Object} dataObj
     * @param {string} hash
     * @returns {Promise<boolean>}
     */
    static async verifyIntegrity(dataObj, hash) {
        const expected = await SaveSystem.computeIntegrity(dataObj);
        return expected === hash;
    }

    /**
     * Persist the current localStorage save for a slot to a .sav file on disk.
     * Only call this on explicit player save actions (SAVE SETTLEMENT, SAVE & QUIT).
     * @param {number} slotNumber
     * @returns {Promise<boolean>} true on success
     */
    static async persistToFile(slotNumber) {
        const invoke = SaveSystem.getTauriInvoke();
        if (!invoke) return false;
        if (!SaveSystem._validateSlot(slotNumber)) return false;

        const data = SaveSystem.getSave(slotNumber);
        if (!data) return false;

        try {
            const integrity = await SaveSystem.computeIntegrity(data);
            const fileContent = JSON.stringify({ v: 1, d: data, i: integrity });
            await invoke('write_save_file', { slot: slotNumber, content: fileContent });
            return true;
        } catch (e) {
            console.error(`SaveSystem: Failed to persist slot ${slotNumber} to file:`, e);
            return false;
        }
    }

    /**
     * Load a .sav file for the given slot, verify its integrity, and write the
     * verified data into localStorage (making it the working copy for this session).
     * @param {number} slotNumber
     * @returns {Promise<boolean>} true if file was found, verified, and applied
     */
    static async syncSlotFromFile(slotNumber) {
        const invoke = SaveSystem.getTauriInvoke();
        if (!invoke) return false;
        if (!SaveSystem._validateSlot(slotNumber)) return false;

        try {
            const raw = await invoke('read_save_file', { slot: slotNumber });
            const parsed = JSON.parse(raw);
            if (!parsed || parsed.v !== 1 || !parsed.d || !parsed.i) {
                console.error(`SaveSystem: Save file for slot ${slotNumber} has invalid format`);
                return false;
            }
            const valid = await SaveSystem.verifyIntegrity(parsed.d, parsed.i);
            if (!valid) {
                console.error(`SaveSystem: Save file for slot ${slotNumber} failed integrity check — file may have been modified`);
                return false;
            }
            const key = SaveSystem.getSaveSlotKey(slotNumber);
            localStorage.setItem(key, JSON.stringify(parsed.d));
            return true;
        } catch (e) {
            // File not found or slot is new — not an error
            return false;
        }
    }

    /**
     * Sync all 3 save slots from their .sav files into localStorage.
     * Called once at game startup so the files are always the source of truth.
     * @returns {Promise<void>}
     */
    static async syncAllSlotsFromFiles() {
        if (!SaveSystem.isTauri()) return;
        for (let i = 1; i <= SaveSystem.NUM_SLOTS; i++) {
            await SaveSystem.syncSlotFromFile(i);
        }
    }

    /**
     * Delete the .sav file for a slot (called alongside wipeSaveSlot).
     * @param {number} slotNumber
     * @returns {Promise<boolean>}
     */
    static async deleteFile(slotNumber) {
        const invoke = SaveSystem.getTauriInvoke();
        if (!invoke) return false;
        if (!SaveSystem._validateSlot(slotNumber)) return false;
        try {
            await invoke('delete_save_file', { slot: slotNumber });
            return true;
        } catch (e) {
            console.error(`SaveSystem: Failed to delete save file for slot ${slotNumber}:`, e);
            return false;
        }
    }

    /**
     * Get the filesystem path where .sav files are stored.
     * Useful for informing the player where their saves live.
     * @returns {Promise<string|null>}
     */
    static async getSavesPath() {
        const invoke = SaveSystem.getTauriInvoke();
        if (!invoke) return null;
        try {
            return await invoke('get_saves_path');
        } catch (e) {
            return null;
        }
    }
}
