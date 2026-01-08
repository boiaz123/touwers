/**
 * UpgradeSystem - Manages player upgrades purchased in the Settlement Hub
 * Separate from UnlockSystem which handles in-game progression
 * This system persists across levels and is tied to the save file
 */
export class UpgradeSystem {
    constructor() {
        this.reset();
    }

    reset() {
        // Track which upgrades have been purchased
        this.purchasedUpgrades = new Set();
    }

    /**
     * Check if an upgrade has been purchased
     * @param {string} upgradeId - The upgrade ID (e.g., 'training-gear')
     * @returns {boolean} - True if purchased
     */
    hasUpgrade(upgradeId) {
        return this.purchasedUpgrades.has(upgradeId);
    }

    /**
     * Purchase an upgrade
     * @param {string} upgradeId - The upgrade ID to purchase
     * @returns {boolean} - True if successfully purchased (not already owned)
     */
    purchaseUpgrade(upgradeId) {
        if (this.purchasedUpgrades.has(upgradeId)) {
            return false; // Already purchased
        }
        this.purchasedUpgrades.add(upgradeId);
        return true;
    }

    /**
     * Get all purchased upgrade IDs
     * @returns {Array<string>} - Array of purchased upgrade IDs
     */
    getPurchasedUpgrades() {
        return Array.from(this.purchasedUpgrades);
    }

    /**
     * Restore upgrade system from saved data
     * @param {Object} savedData - Saved upgrade system state
     */
    restoreFromSave(savedData) {
        if (!savedData) {
            this.reset();
            return;
        }

        this.purchasedUpgrades = new Set(savedData.purchasedUpgrades || []);
    }

    /**
     * Serialize for saving
     * @returns {Object} - Serialized state
     */
    serialize() {
        return {
            purchasedUpgrades: Array.from(this.purchasedUpgrades)
        };
    }

    /**
     * Get starting gold bonus from purchased upgrades
     * Wooden chest: +100, Golden chest: +100, Platinum chest: +100
     * @returns {number} - Total gold bonus
     */
    getStartingGoldBonus() {
        let bonus = 0;
        if (this.hasUpgrade('wooden-chest')) bonus += 100;
        if (this.hasUpgrade('golden-chest')) bonus += 100;
        if (this.hasUpgrade('platinum-chest')) bonus += 100;
        return bonus;
    }
}
