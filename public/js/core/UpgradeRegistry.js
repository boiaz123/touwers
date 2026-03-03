/**
 * UpgradeRegistry - Centralized registry for all marketplace upgrades
 * Each upgrade is purchased once and persists in the save file
 */
export class UpgradeRegistry {
    static #registry = {
        'training-gear': {
            name: 'Training Gear',
            description: 'Unlocks the ability to build Training Grounds in levels',
            cost: 500,
            icon: '🛡️',
            category: 'building',
            effect: 'Unlocks Training Grounds building'
        },
        'musical-equipment': {
            name: 'Musical Equipment',
            description: 'Adds a music player to the UI for settling ambiance',
            cost: 300,
            icon: '🎼',
            category: 'ui',
            effect: 'Adds music player to gameplay UI'
        },
        'wooden-chest': {
            name: 'Wooden Chest',
            description: 'Increase starting gold by 100',
            cost: 250,
            icon: '🪙',
            category: 'gold',
            effect: 'Increases starting gold by 100',
            campaignRequirement: 'campaign-1'
        },
        'golden-chest': {
            name: 'Golden Chest',
            description: 'Increase starting gold by another 100 (requires Wooden Chest)',
            cost: 400,
            icon: '👑',
            category: 'gold',
            effect: 'Increases starting gold by 100',
            prerequisite: 'wooden-chest',
            campaignRequirement: 'campaign-2'
        },
        'platinum-chest': {
            name: 'Platinum Chest',
            description: 'Increase starting gold by another 100 (requires Golden Chest)',
            cost: 600,
            icon: '⭐',
            category: 'gold',
            effect: 'Increases starting gold by 100',
            prerequisite: 'golden-chest',
            campaignRequirement: 'campaign-3'
        },
        'diamond-pickaxe': {
            name: 'Diamond Pickaxe',
            description: 'Increase gem mining chance in gold mines',
            cost: 800,
            icon: '💎',
            category: 'mining',
            effect: 'Increases diamond drop rate from mines'
        },
        'diamond-press-unlock': {
            name: 'Diamond Press Unlock',
            description: 'Unlocked when Super Weapon Lab reaches level 2',
            cost: 0,
            icon: '💠',
            category: 'building',
            effect: 'Unlocks Diamond Press building'
        },
        'magic-academy-unlock': {
            name: 'Academy Blueprints',
            description: 'Ancient schematics reveal the art of constructing a Magic Academy — a tower of arcane scholarship that unlocks elemental magic towers and gem research. Available after completing The Verdant Woodlands.',
            cost: 1500,
            icon: '📜',
            category: 'building',
            effect: 'Permanently unlocks the Magic Academy building',
            campaignRequirement: 'campaign-2'
        },
        'superweapon-lab-unlock': {
            name: 'Super Weapon Lab Plans',
            description: 'Schematics for a formidable weapons laboratory capable of producing devastating combination spells and experimental ordnance. Available after conquering The Ironstone Mountains.',
            cost: 2500,
            icon: '⚗️',
            category: 'building',
            effect: 'Permanently unlocks the Super Weapon Lab building',
            campaignRequirement: 'campaign-3'
        }
    };

    /**
     * Get an upgrade definition by ID
     * @param {string} upgradeId - Upgrade ID key
     * @returns {Object|null} - Upgrade object or null if not found
     */
    static getUpgrade(upgradeId) {
        return this.#registry[upgradeId] || null;
    }

    /**
     * Get all upgrades
     * @returns {Object} - Object containing all upgrade definitions
     */
    static getAllUpgrades() {
        return { ...this.#registry };
    }

    /**
     * Check if an upgrade exists
     * @param {string} upgradeId - Upgrade ID key
     * @returns {boolean} - True if upgrade exists
     */
    static hasUpgrade(upgradeId) {
        return upgradeId in this.#registry;
    }

    /**
     * Get upgrade by category
     * @param {string} category - Category ('building', 'ui', 'gold', 'mining')
     * @returns {Object} - Object of upgrades in that category
     */
    static getUpgradesByCategory(category) {
        const result = {};
        for (const [id, upgrade] of Object.entries(this.#registry)) {
            if (upgrade.category === category) {
                result[id] = upgrade;
            }
        }
        return result;
    }

    /**
     * Get all upgrade IDs
     * @returns {Array<string>} - Array of all upgrade IDs
     */
    static getAllUpgradeIds() {
        return Object.keys(this.#registry);
    }

    /**
     * Check if a prerequisite for an upgrade is met
     * @param {string} upgradeId - Upgrade to check
     * @param {UpgradeSystem} upgradeSystem - Player's upgrade system
     * @returns {boolean} - True if prerequisite is met or doesn't exist
     */
    static canPurchase(upgradeId, upgradeSystem) {
        const upgrade = this.getUpgrade(upgradeId);
        if (!upgrade) return false;

        // Check if already purchased
        if (upgradeSystem.hasUpgrade(upgradeId)) {
            return false;
        }

        // Check prerequisite
        if (upgrade.prerequisite && !upgradeSystem.hasUpgrade(upgrade.prerequisite)) {
            return false;
        }

        return true;
    }

    /**
     * Get prerequisite requirement message
     * @param {string} upgradeId - Upgrade to check
     * @returns {string|null} - Requirement message or null
     */
    static getPrerequisiteMessage(upgradeId, upgradeSystem) {
        const upgrade = this.getUpgrade(upgradeId);
        if (!upgrade || !upgrade.prerequisite) return null;

        if (!upgradeSystem.hasUpgrade(upgrade.prerequisite)) {
            const prerequisite = this.getUpgrade(upgrade.prerequisite);
            return `Requires: ${prerequisite.name}`;
        }

        return null;
    }
}
