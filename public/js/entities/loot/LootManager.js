import { LootBag } from './LootBag.js';
import { LootRegistry } from './LootRegistry.js';

/**
 * LootManager - Manages all loot bags in the current level
 * Handles spawning, collection, and tracking of loot
 */
export class LootManager {
    constructor() {
        this.lootBags = [];
        this.collectedLoot = []; // Array of loot IDs collected during this level
    }

    /**
     * Spawn a loot bag at the given position
     */
    spawnLoot(x, y, lootId) {
        const bag = new LootBag(x, y, lootId);
        this.lootBags.push(bag);
        return bag;
    }

    /**
     * Check if a position clicks on any loot bag
     * Returns the loot bag if clicked, null otherwise
     */
    getLootAtPosition(x, y) {
        for (let i = 0; i < this.lootBags.length; i++) {
            const bag = this.lootBags[i];
            
            if (!bag.isClickable()) continue;
            
            const bounds = bag.getScreenBounds();
            const distance = Math.hypot(x - bag.x, y - bag.y);
            
            if (distance < bag.radius) {
                return bag;
            }
        }
        return null;
    }

    /**
     * Collect a loot bag
     * Returns the loot ID collected
     */
    collectLoot(lootBag) {
        lootBag.collect();
        this.collectedLoot.push(lootBag.lootId);
        return lootBag.lootId;
    }

    /**
     * Get total count of collected loot during this level
     */
    getCollectedLootCount() {
        return this.collectedLoot.length;
    }

    /**
     * Get all collected loot
     */
    getCollectedLoot() {
        return [...this.collectedLoot];
    }

    /**
     * Reset collected loot (for new level)
     */
    resetCollectedLoot() {
        this.collectedLoot = [];
    }

    /**
     * Update all loot bags
     */
    update(deltaTime, canvasHeight = 800, canvasWidth = 1200) {
        // Update all bags
        for (let i = 0; i < this.lootBags.length; i++) {
            this.lootBags[i].update(deltaTime, canvasHeight, canvasWidth);
        }

        // Remove collected loot
        this.lootBags = this.lootBags.filter(bag => !bag.isCollected());
    }

    /**
     * Render all loot bags
     */
    render(ctx) {
        for (let i = 0; i < this.lootBags.length; i++) {
            this.lootBags[i].render(ctx);
        }
    }

    /**
     * Clear all loot bags (for level end/reset)
     */
    clear() {
        this.lootBags = [];
    }
}
