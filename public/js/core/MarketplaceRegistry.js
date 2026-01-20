/**
 * MarketplaceRegistry - Centralized registry for all marketplace buyable items
 * Defines items that can be purchased with gold in the marketplace
 * These items can be consumables (used once per level) or persistent boons
 */
export class MarketplaceRegistry {
    static #registry = {
        'forge-materials': {
            name: 'Forge Materials',
            description: 'A collection of rare ores and enchanted metals gathered from distant mines. With these materials, you may construct a great Forge to empower your warriors. The spirits of craftsmanship smile upon you.',
            cost: 300,
            icon: '🔨',
            category: 'building',
            type: 'consumable',
            effect: 'Free Forge next level',
            requirements: []
        },
        'training-materials': {
            name: 'Training Materials',
            description: 'Ancient scrolls and battle-worn armor of legendary warriors. These treasures inspire your troops and grant them the knowledge to fight with unmatched discipline. The realm\'s greatest champions were trained thus.',
            cost: 350,
            icon: '🎖️',
            category: 'building',
            type: 'consumable',
            effect: 'Free Training Grounds next level',
            requirements: ['training-gear']
        },
        'rabbits-foot': {
            name: 'Rabbit\'s Foot',
            description: 'A charm blessed by the woodland spirits, said to multiply the bounty of the hunt. Carry this talisman and fortune shall rain upon your endeavors. Common treasures shall flow like streams in springtime.',
            cost: 200,
            icon: '🐾',
            category: 'loot',
            type: 'consumable',
            effect: 'Double normal loot chance next round',
            requirements: []
        },
        'strange-talisman': {
            name: 'Strange Talisman',
            description: 'An artifact of mysterious origins, adorned with runes of old magic. When wielded, it draws forth the realm\'s greatest treasures and manifests them twice-fold. The price of power is steep, yet the rewards are legendary.',
            cost: 400,
            icon: '🔮',
            category: 'loot',
            type: 'consumable',
            effect: 'Rare loot awarded twice next round',
            requirements: []
        },
        'magic-tower-flatpack': {
            name: 'Magic Tower Flatpack',
            description: 'A masterwork of arcane engineering from the great tower-smiths of old. This enchanted blueprint allows you to erect a tower of pure magic instantly. Such sorcery would normally require years of study.',
            cost: 500,
            icon: '📦',
            category: 'tower',
            type: 'consumable',
            effect: 'Free Magic Tower next level',
            requirements: []
        },
        'frog-king-bane': {
            name: 'The Frog King\'s Bane',
            description: 'A relic forged in ancient battles against the amphibian hordes. This cursed item draws upon forbidden magic to preserve your life. Should your castle fall, the curse activates and snatches you back from death\'s grasp. But beware—such dark magic comes with a price.',
            cost: 800,
            icon: '👑',
            category: 'boon',
            type: 'boon',
            effect: 'Castle revival on destruction',
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
