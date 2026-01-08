/**
 * LootRegistry - Central registry for all loot types
 * Defines loot items with names, descriptions, types, and selling values
 */
export class LootRegistry {
    static #registry = {
        // Swords & Blades
        'iron-sword': {
            name: 'Iron Sword',
            type: 'sword',
            rarity: 'common',
            sellValue: 50,
            description: 'A sturdy iron blade'
        },
        'steel-sword': {
            name: 'Steel Sword',
            type: 'sword',
            rarity: 'uncommon',
            sellValue: 100,
            description: 'A well-crafted steel sword'
        },
        'longsword': {
            name: 'Longsword',
            type: 'sword',
            rarity: 'rare',
            sellValue: 200,
            description: 'A mighty longsword'
        },
        'enchanted-blade': {
            name: 'Enchanted Blade',
            type: 'sword',
            rarity: 'epic',
            sellValue: 400,
            description: 'A magically enhanced sword'
        },
        
        // Axes & Blunt Weapons
        'iron-axe': {
            name: 'Iron Axe',
            type: 'weapon',
            rarity: 'common',
            sellValue: 60,
            description: 'A heavy iron axe'
        },
        'battle-axe': {
            name: 'Battle Axe',
            type: 'weapon',
            rarity: 'uncommon',
            sellValue: 120,
            description: 'A warrior\'s battle axe'
        },
        'great-axe': {
            name: 'Great Axe',
            type: 'weapon',
            rarity: 'rare',
            sellValue: 220,
            description: 'A massive two-handed axe'
        },
        'warhammer': {
            name: 'Warhammer',
            type: 'weapon',
            rarity: 'rare',
            sellValue: 210,
            description: 'A devastating warhammer'
        },
        
        // Bows & Ranged
        'wooden-bow': {
            name: 'Wooden Bow',
            type: 'weapon',
            rarity: 'common',
            sellValue: 40,
            description: 'A simple wooden bow'
        },
        'longbow': {
            name: 'Longbow',
            type: 'weapon',
            rarity: 'uncommon',
            sellValue: 110,
            description: 'A powerful longbow'
        },
        'elven-bow': {
            name: 'Elven Bow',
            type: 'weapon',
            rarity: 'rare',
            sellValue: 190,
            description: 'Crafted by master elves'
        },
        
        // Armor Pieces
        'leather-helm': {
            name: 'Leather Helm',
            type: 'armor',
            rarity: 'common',
            sellValue: 45,
            description: 'A leather-bound helmet'
        },
        'iron-helm': {
            name: 'Iron Helm',
            type: 'armor',
            rarity: 'uncommon',
            sellValue: 95,
            description: 'A sturdy iron helmet'
        },
        'dragon-helm': {
            name: 'Dragon Helm',
            type: 'armor',
            rarity: 'epic',
            sellValue: 380,
            description: 'Forged from dragon scales'
        },
        'leather-chest': {
            name: 'Leather Chest Plate',
            type: 'armor',
            rarity: 'common',
            sellValue: 70,
            description: 'Leather body armor'
        },
        'iron-chest': {
            name: 'Iron Chest Plate',
            type: 'armor',
            rarity: 'uncommon',
            sellValue: 140,
            description: 'Iron plate body armor'
        },
        'mithril-chest': {
            name: 'Mithril Chest Plate',
            type: 'armor',
            rarity: 'rare',
            sellValue: 280,
            description: 'Legendary mithril plate'
        },
        'gauntlets': {
            name: 'Iron Gauntlets',
            type: 'armor',
            rarity: 'uncommon',
            sellValue: 85,
            description: 'Iron hand protection'
        },
        'steel-boots': {
            name: 'Steel Boots',
            type: 'armor',
            rarity: 'uncommon',
            sellValue: 75,
            description: 'Reinforced steel footwear'
        },
        
        // Special Items & Treasures
        'gold-ring': {
            name: 'Gold Ring',
            type: 'treasure',
            rarity: 'rare',
            sellValue: 250,
            description: 'A precious gold ring'
        },
        'ruby-amulet': {
            name: 'Ruby Amulet',
            type: 'treasure',
            rarity: 'epic',
            sellValue: 350,
            description: 'An amulet set with rubies'
        },
        'crystal-orb': {
            name: 'Crystal Orb',
            type: 'treasure',
            rarity: 'epic',
            sellValue: 360,
            description: 'A magical crystal orb'
        },
        'ancient-coin': {
            name: 'Ancient Coin',
            type: 'treasure',
            rarity: 'uncommon',
            sellValue: 130,
            description: 'A coin from ages past'
        },
        'gem-cluster': {
            name: 'Gem Cluster',
            type: 'treasure',
            rarity: 'rare',
            sellValue: 270,
            description: 'A cluster of precious gems'
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
     */
    static getRandomLoot() {
        const types = this.getAllLootTypes();
        // Higher chance for common items, lower for epic
        const lootId = types[Math.floor(Math.random() * types.length)];
        return lootId;
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
