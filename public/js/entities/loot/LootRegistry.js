/**
 * LootRegistry - Central registry for all loot types
 * Defines loot items with names, descriptions, types, and selling values
 * Two rarity levels: normal (brown bag) and rare (purple bag)
 */
export class LootRegistry {
    static #registry = {
        // ============ NORMAL LOOT (Brown Bag) ============
        'copper-coin': {
            name: 'Copper Coin',
            type: 'treasure',
            rarity: 'normal',
            sellValue: 25,
            description: 'An old copper coin from distant lands',
            emblem: '🪙'
        },
        'frog-talisman': {
            name: 'Frog Talisman',
            type: 'treasure',
            rarity: 'normal',
            sellValue: 35,
            description: 'A small frog charm for good luck',
            emblem: '🐸'
        },
        'iron-dagger': {
            name: 'Iron Dagger',
            type: 'weapon',
            rarity: 'normal',
            sellValue: 40,
            description: 'A sturdy iron dagger with a leather grip',
            emblem: '🗡️'
        },
        'emerald-shard': {
            name: 'Emerald Shard',
            type: 'gem',
            rarity: 'normal',
            sellValue: 50,
            description: 'A fragment of precious emerald stone',
            emblem: '💚'
        },
        'silver-brooch': {
            name: 'Silver Brooch',
            type: 'treasure',
            rarity: 'normal',
            sellValue: 45,
            description: 'An ornate silver brooch of fine craftsmanship',
            emblem: '◇'
        },
        'sapphire-crystal': {
            name: 'Sapphire Crystal',
            type: 'gem',
            rarity: 'normal',
            sellValue: 55,
            description: 'A brilliant blue sapphire crystal',
            emblem: '💙'
        },
        'leather-purse': {
            name: 'Leather Purse',
            type: 'treasure',
            rarity: 'normal',
            sellValue: 30,
            description: 'A worn leather pouch, well-used but sturdy',
            emblem: '👜'
        },
        'bronze-medallion': {
            name: 'Bronze Medallion',
            type: 'treasure',
            rarity: 'normal',
            sellValue: 48,
            description: 'An ancient bronze medallion with strange markings',
            emblem: '🎖️'
        },
        'ruby-fragment': {
            name: 'Ruby Fragment',
            type: 'gem',
            rarity: 'normal',
            sellValue: 52,
            description: 'A deep red ruby shard, quite valuable',
            emblem: '❤️'
        },
        'wooden-amulet': {
            name: 'Wooden Amulet',
            type: 'treasure',
            rarity: 'normal',
            sellValue: 28,
            description: 'A frog-carved wooden amulet for protection',
            emblem: '🌿'
        },

        // ============ RARE LOOT (Purple Bag) ============
        'dragon-eye': {
            name: 'Dragon\'s Eye',
            type: 'gem',
            rarity: 'rare',
            sellValue: 180,
            description: 'A legendary gemstone that glows like a dragon\'s gaze',
            emblem: '🔴'
        },
        'frog-crown': {
            name: 'Frog King\'s Crown',
            type: 'treasure',
            rarity: 'rare',
            sellValue: 200,
            description: 'A tiny ornate crown fit for royalty of the amphibian world',
            emblem: '👑'
        },
        'enchanted-longsword': {
            name: 'Enchanted Longsword',
            type: 'weapon',
            rarity: 'rare',
            sellValue: 220,
            description: 'A magnificent blade shimmering with ancient magic',
            emblem: '⚔️'
        },
        'moonstone-gem': {
            name: 'Moonstone Gem',
            type: 'gem',
            rarity: 'rare',
            sellValue: 210,
            description: 'A lustrous gem that captures moonlight',
            emblem: '🌙'
        },
        'frog-totem': {
            name: 'Frog Totem',
            type: 'treasure',
            rarity: 'rare',
            sellValue: 185,
            description: 'A sacred totem carved in the shape of a leaping frog',
            emblem: '🐸'
        },
        'void-shard': {
            name: 'Void Shard',
            type: 'gem',
            rarity: 'rare',
            sellValue: 225,
            description: 'A mysterious dark crystal from the depths of the void',
            emblem: '🔮'
        }
    };

    /**
     * Get a loot type by ID
     */
    static getLootType(lootId) {
        return this.#registry[lootId];
    }

    /**
     * Get all loot types
     */
    static getAllLootTypes() {
        return Object.keys(this.#registry);
    }

    /**
     * Get random loot type (weighted by rarity)
     * Returns a normal loot item or rare loot item based on probability
     */
    static getRandomLoot() {
        const normalLoot = this.getLootByRarity('normal');
        const rareLoot = this.getLootByRarity('rare');
        
        // 85% chance for normal loot, 15% chance for rare
        const isRare = Math.random() < 0.15;
        const pool = isRare ? rareLoot : normalLoot;
        
        const lootId = pool[Math.floor(Math.random() * pool.length)];
        return { lootId, isRare };
    }

    /**
     * Get loot by rarity
     */
    static getLootByRarity(rarity) {
        return Object.entries(this.#registry)
            .filter(([_, type]) => type.rarity === rarity)
            .map(([id, _]) => id);
    }
}
