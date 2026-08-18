/**
 * WorkshopSystem - Manages player's Workshop shop progress
 * Tracks unlocked enemy types / campaign themes for the Level Designer, and
 * the per-enemy tokens used to purchase them. Persists across levels and is
 * tied to the save file.
 */
export class WorkshopSystem {
    constructor() {
        this.reset();
    }

    reset() {
        // Enemy type ids unlocked for use in the Level Designer
        this.unlockedEnemyTypes = new Set();
        // Campaign theme ids ('forest'|'mountain'|'desert'|'space') unlocked for use in the Level Designer
        this.unlockedCampaignThemes = new Set();
        // Per-enemy token counts, keyed by enemy id
        this.tokens = new Map();
    }

    /**
     * Add tokens for a given enemy type (called on a token drop)
     * @param {string} enemyId - Enemy type id
     * @param {number} quantity - How many to add (default 1)
     */
    addToken(enemyId, quantity = 1) {
        const current = this.tokens.get(enemyId) || 0;
        this.tokens.set(enemyId, current + quantity);
    }

    /**
     * Get the number of tokens held for a given enemy type
     * @param {string} enemyId - Enemy type id
     * @returns {number}
     */
    getTokenCount(enemyId) {
        return this.tokens.get(enemyId) || 0;
    }

    /**
     * Spend tokens for a given enemy type
     * @param {string} enemyId - Enemy type id
     * @param {number} quantity - How many to spend (default 1)
     * @returns {boolean} - True if successfully spent
     */
    spendToken(enemyId, quantity = 1) {
        const current = this.tokens.get(enemyId) || 0;
        if (current < quantity) return false;
        this.tokens.set(enemyId, current - quantity);
        return true;
    }

    /** @returns {boolean} - True if the given enemy type has been unlocked for the Level Designer */
    hasEnemyType(enemyId) {
        return this.unlockedEnemyTypes.has(enemyId);
    }

    /** @returns {boolean} - True if the given campaign theme has been unlocked for the Level Designer */
    hasCampaignTheme(themeId) {
        return this.unlockedCampaignThemes.has(themeId);
    }

    unlockEnemyType(enemyId) {
        this.unlockedEnemyTypes.add(enemyId);
    }

    unlockCampaignTheme(themeId) {
        this.unlockedCampaignThemes.add(themeId);
    }

    /**
     * Restore Workshop system from saved data
     * @param {Object} savedData - Saved workshop system state
     */
    restoreFromSave(savedData) {
        if (!savedData) {
            this.reset();
            return;
        }

        this.unlockedEnemyTypes = new Set(
            Array.isArray(savedData.unlockedEnemyTypes) ? savedData.unlockedEnemyTypes : []
        );
        this.unlockedCampaignThemes = new Set(
            Array.isArray(savedData.unlockedCampaignThemes) ? savedData.unlockedCampaignThemes : []
        );
        this.tokens = new Map(
            savedData.tokens && typeof savedData.tokens === 'object' ? Object.entries(savedData.tokens) : []
        );
    }

    /**
     * Serialize for saving
     * @returns {Object} - Serialized state
     */
    serialize() {
        return {
            unlockedEnemyTypes: Array.from(this.unlockedEnemyTypes),
            unlockedCampaignThemes: Array.from(this.unlockedCampaignThemes),
            tokens: Object.fromEntries(this.tokens)
        };
    }
}
