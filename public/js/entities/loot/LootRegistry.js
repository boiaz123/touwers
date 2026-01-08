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
            description: 'A sturdy iron blade',
            emblem: '⚔'
        },
        'steel-sword': {
            name: 'Steel Sword',
            type: 'sword',
            rarity: 'uncommon',
            sellValue: 100,
            description: 'A well-crafted steel sword',
            emblem: '⚔'
        },
        'longsword': {
            name: 'Longsword',
            type: 'sword',
            rarity: 'rare',
            sellValue: 200,
            description: 'A mighty longsword',
            emblem: '⚔'
        },
        'enchanted-blade': {
            name: 'Enchanted Blade',
            type: 'sword',
            rarity: 'epic',
            sellValue: 400,
            description: 'A magically enhanced sword',
            emblem: '✨'
        },
        'excalibur': {
            name: 'Excalibur',
            type: 'sword',
            rarity: 'legendary',
            sellValue: 750,
            description: 'The legendary blade of kings',
            emblem: '👑'
        },
        
        // Axes & Blunt Weapons
        'iron-axe': {
            name: 'Iron Axe',
            type: 'weapon',
            rarity: 'common',
            sellValue: 60,
            description: 'A heavy iron axe',
            emblem: '🪓'
        },
        'battle-axe': {
            name: 'Battle Axe',
            type: 'weapon',
            rarity: 'uncommon',
            sellValue: 120,
            description: 'A warrior\'s battle axe',
            emblem: '🪓'
        },
        'great-axe': {
            name: 'Great Axe',
            type: 'weapon',
            rarity: 'rare',
            sellValue: 220,
            description: 'A massive two-handed axe',
            emblem: '🪓'
        },
        'warhammer': {
            name: 'Warhammer',
            type: 'weapon',
            rarity: 'rare',
            sellValue: 210,
            description: 'A devastating warhammer',
            emblem: '🔨'
        },
        
        // Bows & Ranged
        'wooden-bow': {
            name: 'Wooden Bow',
            type: 'weapon',
            rarity: 'common',
            sellValue: 40,
            description: 'A simple wooden bow',
            emblem: '🏹'
        },
        'longbow': {
            name: 'Longbow',
            type: 'weapon',
            rarity: 'uncommon',
            sellValue: 110,
            description: 'A powerful longbow',
            emblem: '🏹'
        },
        'elven-bow': {
            name: 'Elven Bow',
            type: 'weapon',
            rarity: 'rare',
            sellValue: 190,
            description: 'Crafted by master elves',
            emblem: '🏹'
        },
        
        // Armor Pieces
        'leather-helm': {
            name: 'Leather Helm',
            type: 'armor',
            rarity: 'common',
            sellValue: 45,
            description: 'A leather-bound helmet',
            emblem: '🪖'
        },
        'iron-helm': {
            name: 'Iron Helm',
            type: 'armor',
            rarity: 'uncommon',
            sellValue: 95,
            description: 'A sturdy iron helmet',
            emblem: '🪖'
        },
        'dragon-helm': {
            name: 'Dragon Helm',
            type: 'armor',
            rarity: 'epic',
            sellValue: 380,
            description: 'Forged from dragon scales',
            emblem: '🐉'
        },
        'leather-chest': {
            name: 'Leather Chest Plate',
            type: 'armor',
            rarity: 'common',
            sellValue: 70,
            description: 'Leather body armor',
            emblem: '🛡'
        },
        'iron-chest': {
            name: 'Iron Chest Plate',
            type: 'armor',
            rarity: 'uncommon',
            sellValue: 140,
            description: 'Iron plate body armor',
            emblem: '🛡'
        },
        'mithril-chest': {
            name: 'Mithril Chest Plate',
            type: 'armor',
            rarity: 'rare',
            sellValue: 280,
            description: 'Legendary mithril plate',
            emblem: '⚡'
        },
        'gauntlets': {
            name: 'Iron Gauntlets',
            type: 'armor',
            rarity: 'uncommon',
            sellValue: 85,
            description: 'Iron hand protection',
            emblem: '👊'
        },
        'steel-boots': {
            name: 'Steel Boots',
            type: 'armor',
            rarity: 'uncommon',
            sellValue: 75,
            description: 'Reinforced steel footwear',
            emblem: '👢'
        },
        
        // Special Items & Treasures
        'gold-ring': {
            name: 'Gold Ring',
            type: 'treasure',
            rarity: 'rare',
            sellValue: 250,
            description: 'A precious gold ring',
            emblem: '💍'
        },
        'ruby-amulet': {
            name: 'Ruby Amulet',
            type: 'treasure',
            rarity: 'epic',
            sellValue: 350,
            description: 'An amulet set with rubies',
            emblem: '💎'
        },
        'crystal-orb': {
            name: 'Crystal Orb',
            type: 'treasure',
            rarity: 'epic',
            sellValue: 360,
            description: 'A magical crystal orb',
            emblem: '🔮'
        },
        'ancient-coin': {
            name: 'Ancient Coin',
            type: 'treasure',
            rarity: 'uncommon',
            sellValue: 130,
            description: 'A coin from ages past',
            emblem: '🪙'
        },
        'gem-cluster': {
            name: 'Gem Cluster',
            type: 'treasure',
            rarity: 'rare',
            sellValue: 270,
            description: 'A cluster of precious gems',
            emblem: '💎'
        },

        // Legendary Rare Loot Items
        'dragon-scales': {
            name: 'Dragon Scales',
            type: 'treasure',
            rarity: 'legendary',
            sellValue: 800,
            description: 'Scales from an ancient dragon',
            emblem: '🐉'
        },
        'phoenix-tear': {
            name: 'Phoenix Tear',
            type: 'treasure',
            rarity: 'legendary',
            sellValue: 900,
            description: 'A tear from a mythical phoenix',
            emblem: '🔥'
        },
        'cursed-ring': {
            name: 'Cursed Ring',
            type: 'treasure',
            rarity: 'legendary',
            sellValue: 850,
            description: 'A ring cursed with dark magic',
            emblem: '⚫'
        },
        'void-gem': {
            name: 'Void Gem',
            type: 'treasure',
            rarity: 'legendary',
            sellValue: 920,
            description: 'A gem from the void itself',
            emblem: '🌑'
        },
        'shadow-cloak': {
            name: 'Shadow Cloak',
            type: 'armor',
            rarity: 'legendary',
            sellValue: 1000,
            description: 'A cloak woven from pure shadow',
            emblem: '👻'
        },
        'holy-relic': {
            name: 'Holy Relic',
            type: 'treasure',
            rarity: 'legendary',
            sellValue: 1100,
            description: 'An ancient relic blessed by gods',
            emblem: '✨'
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
