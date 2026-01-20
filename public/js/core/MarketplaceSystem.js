/**
 * MarketplaceSystem - Manages player's marketplace purchases
 * Tracks consumable items (used once per level) and boons (persistent within a level)
 * Separate from UpgradeSystem which handles permanent upgrades
 * This system persists across levels and is tied to the save file
 */
export class MarketplaceSystem {
    constructor() {
        this.reset();
    }

    reset() {
        // Track consumables that haven't been used yet
        // Each key is an item ID, value is quantity available
        this.consumables = new Map();
        
        // Track active boons in current level
        // Maps boon ID to { active: boolean, used: boolean }
        this.activeBoons = new Map();
        
        // Track which free-placement consumables are available this level
        this.freePlacementsAvailable = new Set();
    }

    /**
     * Reset consumables and boons for a new level
     * Called when starting a new level
     */
    resetForNewLevel() {
        this.freePlacementsAvailable.clear();
        this.activeBoons.clear();
        
        // Mark free-placement consumables as available this level
        // These will be removed from inventory after the level completes
        const freePlacementConsumables = ['forge-materials', 'training-materials', 'magic-tower-flatpack'];
        for (const consumableId of freePlacementConsumables) {
            const count = this.consumables.get(consumableId) || 0;
            if (count > 0) {
                // Mark as available for free placement
                this.freePlacementsAvailable.add(consumableId);
            }
        }
        
        // Boons are loaded fresh if they exist in consumables
        for (const [itemId, quantity] of this.consumables.entries()) {
            if (itemId === 'frog-king-bane' && quantity > 0) {
                this.activeBoons.set(itemId, { active: true, used: false });
            }
        }
    }

    /**
     * Add consumable item to inventory
     * @param {string} itemId - The item ID
     * @param {number} quantity - How many to add (default 1)
     */
    addConsumable(itemId, quantity = 1) {
        const current = this.consumables.get(itemId) || 0;
        this.consumables.set(itemId, current + quantity);
    }

    /**
     * Check if player has a consumable item
     * @param {string} itemId - The item ID
     * @returns {number} - Quantity available, 0 if none
     */
    getConsumableCount(itemId) {
        return this.consumables.get(itemId) || 0;
    }

    /**
     * Use a consumable item (removes one from inventory)
     * @param {string} itemId - The item ID to use
     * @returns {boolean} - True if successfully used
     */
    useConsumable(itemId) {
        const current = this.consumables.get(itemId) || 0;
        if (current > 0) {
            this.consumables.set(itemId, current - 1);
            return true;
        }
        return false;
    }

    /**
     * Check if a free-placement consumable is available this level
     * @param {string} itemId - The item ID
     * @returns {boolean} - True if available for free placement
     */
    hasFreePlacement(itemId) {
        return this.freePlacementsAvailable.has(itemId);
    }

    /**
     * Check if a consumable has been used in current level (for persistence checks)
     * @param {string} itemId - The item ID
     * @returns {boolean} - True if already used this level
     */
    hasUsedConsumable(itemId) {
        return this.freePlacementsAvailable.has(itemId);
    }

    /**
     * Check if Frog King's Bane boon is currently active
     * @returns {boolean} - True if boon is active and has uses remaining
     */
    hasFrogKingBane() {
        const boon = this.activeBoons.get('frog-king-bane');
        return boon && boon.active && !boon.used;
    }

    /**
     * Activate Frog King's Bane boon (called when purchasing)
     * Should only be called when player buys the item
     */
    activateFrogKingBane() {
        this.addConsumable('frog-king-bane', 1);
    }

    /**
     * Use Frog King's Bane boon (called when castle would be destroyed)
     * @returns {boolean} - True if boon was active and used successfully
     */
    useFrogKingBaneBoon() {
        const boon = this.activeBoons.get('frog-king-bane');
        if (boon && boon.active && !boon.used) {
            boon.used = true;
            // Remove from consumables since it's been used
            this.consumables.set('frog-king-bane', 0);
            return true;
        }
        return false;
    }

    /**
     * Commit used consumables - removes free-placement items from inventory after level ends
     * Called when returning to settlement after a level
     */
    commitUsedConsumables() {
        // Remove free-placement consumables that were available this level
        for (const itemId of this.freePlacementsAvailable) {
            const current = this.consumables.get(itemId) || 0;
            if (current > 0) {
                this.consumables.set(itemId, current - 1);
            }
        }
        // Clear for next level
        this.freePlacementsAvailable.clear();
    }

    isBoonActive(boonId) {
        const boon = this.activeBoons.get(boonId);
        return boon && boon.active;
    }

    /**
     * Get all active boons
     * @returns {Array<string>} - Array of active boon IDs
     */
    getActiveBoons() {
        const active = [];
        for (const [id, boon] of this.activeBoons.entries()) {
            if (boon.active) {
                active.push(id);
            }
        }
        return active;
    }

    /**
     * Get all available consumables
     * @returns {Object} - Object mapping item ID to quantity
     */
    getConsumables() {
        const result = {};
        for (const [id, qty] of this.consumables.entries()) {
            if (qty > 0) {
                result[id] = qty;
            }
        }
        return result;
    }

    /**
     * Restore marketplace system from saved data
     * @param {Object} savedData - Saved marketplace system state
     */
    restoreFromSave(savedData) {
        if (!savedData) {
            this.reset();
            return;
        }

        // Restore consumables
        this.consumables.clear();
        if (savedData.consumables && typeof savedData.consumables === 'object') {
            for (const [id, qty] of Object.entries(savedData.consumables)) {
                this.consumables.set(id, qty);
            }
        }

        // Note: activeBoons is NOT restored from save because it's per-level
        // But consumables are saved so they persist across levels
    }

    /**
     * Serialize for saving
     * @returns {Object} - Serialized state
     */
    serialize() {
        const consumablesObj = {};
        for (const [id, qty] of this.consumables.entries()) {
            if (qty > 0) {
                consumablesObj[id] = qty;
            }
        }
        
        return {
            consumables: consumablesObj
        };
    }
}
