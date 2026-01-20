/**
 * MarketplaceRegistry - Centralized registry for all marketplace buyable items
 * Defines items that can be purchased with gold in the marketplace
 * These items can be consumables (used once per level) or persistent boons
 */
export class MarketplaceRegistry {
    static #registry = {
        'forge-materials': {
            name: 'Forge Materials',
            description: 'Deep within the earth, legendary smiths once worked rare ores into instruments of power. Now their legacy awaits. These precious materials—mithril ingots, enchanted coal, and ancient blueprints—contain the essence of a master craftsman\'s knowledge. In the next battle, you may construct a Tower Forge at no cost. This forge will unlock powerful tower upgrades and enhance your entire arsenal, turning your warriors into an unstoppable force.',
            cost: 300,
            icon: '🔨',
            category: 'building',
            type: 'consumable',
            effect: 'Free Tower Forge - unlocks tower upgrades next level',
            requirements: []
        },
        'training-materials': {
            name: 'Training Materials',
            description: 'The weathered scrolls speak of legendary warriors whose names echo through eternity—champions who pushed the boundaries of strength and skill. Their armor, still emanating residual power, crackles with ancient might. Carrying these relics into battle fills your troops with inspiration and untapped potential. In the next battle, you may construct Training Grounds at no cost. This sacred ground will unlock advanced tower techniques, granting your defenders enhanced range and devastating new abilities to defend your castle.',
            cost: 350,
            icon: '🎖️',
            category: 'building',
            type: 'consumable',
            effect: 'Free Training Grounds - unlocks defender training next level',
            requirements: ['training-gear']
        },
        'rabbits-foot': {
            name: 'Rabbit\'s Foot',
            description: 'The forest runs deep with magic old and true. Those who traverse its hidden groves sometimes catch glimpses of white rabbits—swift as starlight, blessed by nature itself. To claim their favor is to unlock prosperity beyond measure. This talisman, blessed by woodland spirits of abundance, doubles the wealth and treasure you discover in the next battle. Fallen enemies will yield twice the gold, gems, and relics, filling your coffers with untold riches.',
            cost: 200,
            icon: '🐾',
            category: 'loot',
            type: 'consumable',
            effect: 'Double loot and treasure rewards next level',
            requirements: []
        },
        'strange-talisman': {
            name: 'Strange Talisman',
            description: 'Found in the tomb of a forgotten sorcerer, this enigmatic artifact thrums with power that defies explanation. Its runes glow with ancient magic—a spell so potent that it seems to bend fate itself. When you carry it into battle, the very fabric of destiny shifts in your favor, drawing legendary treasures from the aether. In the next battle, all rare and legendary loot drops are doubled, multiplying your chances of acquiring the finest gems, artifacts, and enchanted relics the realm has to offer.',
            cost: 400,
            icon: '🔮',
            category: 'loot',
            type: 'consumable',
            effect: 'Rare and legendary loot doubled next level',
            requirements: []
        },
        'magic-tower-flatpack': {
            name: 'Magic Tower Flatpack',
            description: 'In ages past, the greatest arcane scholars of the realm created a marvel of magical engineering—a tower of pure elemental force, capable of channeling devastating spells against enemies. This enchanted blueprint, preserved for centuries, contains all the knowledge and materials needed to construct such a tower in mere moments. In the next battle, you may erect a Magic Tower at no cost. This powerful tower can be infused with different elemental forces (fire, water, earth, air) to deal specialized damage and adapt to any threat. No gold required—only the will to embrace ancient magic.',
            cost: 500,
            icon: '📦',
            category: 'tower',
            type: 'consumable',
            effect: 'Free Magic Tower with elemental selection next level',
            requirements: []
        },
        'frog-king-bane': {
            name: 'The Frog King\'s Bane',
            description: 'In ages long forgotten, the great kingdoms of the forest—ancient groves and sacred glades—were ruled by a tyrannical Frog King who hoarded power for himself. The old spirits of wood and water, rivals to his dominion, bound their collective essence into this talisman as an act of defiance. Carrying it into battle grants you their protection. Should your castle be destroyed, you are protected by the ancient spirits of the forest—the very foes of the Frog King himself. They conjure a mystical barrier that snatches your life back from the brink of destruction, reviving your castle and allowing you to continue the fight. A boon from nature\'s oldest guardians.',
            cost: 800,
            icon: '👑',
            category: 'boon',
            type: 'boon',
            effect: 'Revive castle once if destroyed - forest spirits protect you',
            requirements: []
        }
    };

    /**
     * Get a marketplace item definition by ID
     * @param {string} itemId - Item ID key
     * @returns {Object|null} - Item object or null if not found
     */
    static getItem(itemId) {
        return this.#registry[itemId] || null;
    }

    /**
     * Get all marketplace items
     * @returns {Object} - Object containing all item definitions
     */
    static getAllItems() {
        return { ...this.#registry };
    }

    /**
     * Check if a marketplace item exists
     * @param {string} itemId - Item ID key
     * @returns {boolean} - True if item exists
     */
    static hasItem(itemId) {
        return itemId in this.#registry;
    }

    /**
     * Get items by category
     * @param {string} category - Category ('building', 'loot', 'tower', 'boon')
     * @returns {Object} - Object of items in that category
     */
    static getItemsByCategory(category) {
        const result = {};
        for (const [id, item] of Object.entries(this.#registry)) {
            if (item.category === category) {
                result[id] = item;
            }
        }
        return result;
    }

    /**
     * Get all marketplace item IDs
     * @returns {Array<string>} - Array of all item IDs
     */
    static getAllItemIds() {
        return Object.keys(this.#registry);
    }

    /**
     * Check if an item can be purchased (has no unmet requirements)
     * @param {string} itemId - Item to check
     * @param {UpgradeSystem} upgradeSystem - Player's upgrade system to check prerequisites
     * @param {MarketplaceSystem} marketplaceSystem - Player's marketplace system to check consumables
     * @returns {boolean} - True if all requirements are met
     */
    static canPurchase(itemId, upgradeSystem, marketplaceSystem) {
        const item = this.getItem(itemId);
        if (!item) return false;

        // Check upgrade requirements
        if (item.requirements && item.requirements.length > 0) {
            for (const requiredUpgrade of item.requirements) {
                if (!upgradeSystem || !upgradeSystem.hasUpgrade(requiredUpgrade)) {
                    return false;
                }
            }
        }

        // Check if consumable has already been used this session
        if (item.type === 'consumable' && marketplaceSystem) {
            if (marketplaceSystem.hasUsedConsumable(itemId)) {
                return false; // Already used in this session
            }
        }

        // Boon can be purchased if player has it in inventory (quantity > 0)
        // No special restriction - player can have multiple and buy more anytime

        return true;
    }

    /**
     * Get requirement failure message
     * @param {string} itemId - Item to check
     * @param {UpgradeSystem} upgradeSystem - Player's upgrade system
     * @param {MarketplaceSystem} marketplaceSystem - Player's marketplace system
     * @returns {string|null} - Requirement message or null
     */
    static getRequirementMessage(itemId, upgradeSystem, marketplaceSystem) {
        const item = this.getItem(itemId);
        if (!item) return null;

        // Check upgrade requirements
        if (item.requirements && item.requirements.length > 0) {
            for (const requiredUpgrade of item.requirements) {
                if (!upgradeSystem || !upgradeSystem.hasUpgrade(requiredUpgrade)) {
                    return `Requires: ${requiredUpgrade} upgrade`;
                }
            }
        }

        // Check if consumable has already been used
        if (item.type === 'consumable' && marketplaceSystem) {
            if (marketplaceSystem.hasUsedConsumable(itemId)) {
                return 'Already used this round';
            }
        }

        // Check Frog King's Bane special case
        if (itemId === 'frog-king-bane' && marketplaceSystem) {
            if (marketplaceSystem.hasFrogKingBane()) {
                return 'Boon already active';
            }
        }

        return null;
    }

    /**
     * Get a user-friendly category name
     * @param {string} category - Category key
     * @returns {string} - Display name
     */
    static getCategoryName(category) {
        const categoryNames = {
            'building': 'Building Materials',
            'loot': 'Loot Enhancers',
            'tower': 'Tower Supplies',
            'boon': 'Protective Boons'
        };
        return categoryNames[category] || category;
    }
}
