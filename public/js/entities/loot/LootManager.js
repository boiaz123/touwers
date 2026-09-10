import { LootBag, RealmShardDrop, TokenDrop } from './LootBag.js';
import { LootRegistry } from './LootRegistry.js';
import { ObjectPool } from '../../core/utils/ObjectPool.js';

/**
 * LootManager - Manages all loot bags in the current level
 * Handles spawning, collection, and tracking of loot
 */
export class LootManager {
    constructor() {
        this.lootBags = [];
        this.collectedLoot = []; // Array of loot IDs collected during this level
        this.collectedTokens = []; // Array of enemy type IDs whose Workshop token was collected this level
        this.audioManager = null; // Will be set by GameplayState

        // Pooled the same way tower projectiles already are (ObjectPool.js) - bags/shards
        // were previously a fresh `new` per drop, left for GC on pickup/expiry. Two
        // separate pools since LootBag and RealmShardDrop are different shapes.
        this._lootBagPool = new ObjectPool(() => new LootBag(0, 0, null, false));
        this._realmShardPool = new ObjectPool(() => new RealmShardDrop(0, 0, null));
        this._tokenDropPool = new ObjectPool(() => new TokenDrop(0, 0, null));
    }

    /**
     * Spawn a loot bag at the given position
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} lootId - ID of the loot item
     * @param {boolean} isRare - Whether this is a rare legendary loot drop
     */
    spawnLoot(x, y, lootId, isRare = false) {
        const bag = this._lootBagPool.acquire();
        bag.reset(x, y, lootId, isRare);
        this.lootBags.push(bag);

        // Play drop sound
        if (this.audioManager) {
            const dropSound = isRare ? 'rare-loot-drop' : 'loot-drop';
            this.audioManager.playSFX(dropSound);
        }

        return bag;
    }

    /**
     * Spawn a realm shard drop (special magical crystal)
     */
    spawnRealmShard(x, y, lootId) {
        const shard = this._realmShardPool.acquire();
        shard.reset(x, y, lootId);
        this.lootBags.push(shard);
        if (this.audioManager) {
            this.audioManager.playSFX('shard-drop');
        }
        return shard;
    }

    /**
     * Spawn a Workshop token drop - a world pickup like any other loot, the token itself is
     * only granted once the player clicks it (see collectToken() below). Reuses the
     * shard-drop sound effect per design for the drop moment.
     */
    spawnToken(x, y, enemyType) {
        const token = this._tokenDropPool.acquire();
        token.reset(x, y, enemyType);
        this.lootBags.push(token);
        if (this.audioManager) {
            this.audioManager.playSFX('shard-drop');
        }
        return token;
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
        // Bounded: only the results screen's "collected this level" summary (see
        // getCollectedLoot()) reads this, and no campaign level realistically drops anywhere
        // near this many items. Sandbox mode reuses one LootManager for its entire endless
        // session (no per-level reset point ever recreates it), so without this cap the array
        // would otherwise grow by one entry per pickup forever - resetCollectedLoot() alone
        // isn't enough since nothing ever calls it in sandbox.
        if (this.collectedLoot.length > 1000) {
            this.collectedLoot.length = 0;
        }


        // Play collection sound
        if (this.audioManager) {
            const collectSound = lootBag.isRare ? 'rare-loot-collect' : 'loot-collect';
            this.audioManager.playSFX(collectSound);
        }
        
        return lootBag.lootId;
    }

    /**
     * Collect a Workshop token drop. Unlike collectLoot(), the enemy type isn't a real
     * LootRegistry id - it's tracked separately (collectedTokens) so it never leaks into
     * the player's sellable inventory via ResultsScreen.transferLootToInventory(), which
     * only reads getCollectedLoot(). Actual granting (WorkshopSystem.addToken) is done by
     * the caller (GameplayState), which is the one with a workshopSystem reference.
     */
    collectToken(tokenDrop) {
        tokenDrop.collect();
        this.collectedTokens.push(tokenDrop.enemyType);
        // Same unbounded-sandbox-session guard as collectLoot() above.
        if (this.collectedTokens.length > 1000) {
            this.collectedTokens.length = 0;
        }

        if (this.audioManager) {
            this.audioManager.playSFX('loot-collect');
        }

        return tokenDrop.enemyType;
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
     * Get all collected Workshop tokens (enemy type IDs) this level
     */
    getCollectedTokens() {
        return [...this.collectedTokens];
    }

    /**
     * Reset collected loot (for new level)
     */
    resetCollectedLoot() {
        this.collectedLoot = [];
        this.collectedTokens = [];
    }

    /**
     * Update all loot bags
     */
    update(deltaTime, canvasHeight = 800, canvasWidth = 1200) {
        // Update all bags
        for (let i = 0; i < this.lootBags.length; i++) {
            this.lootBags[i].update(deltaTime, canvasHeight, canvasWidth);
        }

        // Remove collected loot and expired loot (compact in-place)
        let lbWrite = 0;
        for (let i = 0; i < this.lootBags.length; i++) {
            const bag = this.lootBags[i];
            // Keep bags that are still alive (not collected and not expired)
            const expired = bag.lifetime > 0 && bag.age >= bag.lifetime && !bag.isCollecting;
            if (!bag.isCollected() && !expired) {
                this.lootBags[lbWrite++] = bag;
            } else {
                // Return to its pool now that it's fully removed from play.
                if (bag instanceof RealmShardDrop) {
                    this._realmShardPool.release(bag);
                } else if (bag instanceof TokenDrop) {
                    this._tokenDropPool.release(bag);
                } else {
                    this._lootBagPool.release(bag);
                }
            }
        }
        this.lootBags.length = lbWrite;
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
