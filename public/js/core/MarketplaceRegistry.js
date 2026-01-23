/**
 * MarketplaceRegistry - Centralized registry for all marketplace buyable items
 * Defines items that can be purchased with gold in the marketplace
 * These items can be consumables (used once per level) or persistent boons
 */
import { UpgradeRegistry } from './UpgradeRegistry.js';

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
            category: 'building',
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
        },
        // MUSICAL SCORES
        'music-menu-theme': {
            name: 'Menu Theme',
            description: 'The iconic theme that welcomes heroes to the realm. A stirring melody that captures the spirit of adventure and conquest.',
            cost: 50,
            icon: '🎵',
            category: 'music',
            type: 'music',
            musicId: 'menu-theme',
            effect: 'Unlock menu theme for Arcane Library',
            requirements: []
        },
        'music-settlement-1': {
            name: 'Settlement Theme - Spring',
            description: 'A peaceful melody that echoes through the settlement during peaceful times. Reminiscent of spring blossoms and new beginnings.',
            cost: 75,
            icon: '🎵',
            category: 'music',
            type: 'music',
            musicId: 'settlement-theme-1',
            effect: 'Unlock settlement theme for Arcane Library',
            requirements: []
        },
        'music-settlement-2': {
            name: 'Settlement Theme - Summer',
            description: 'A warm and hopeful melody that fills the air during the golden season. The sounds of prosperity and growth.',
            cost: 75,
            icon: '🎵',
            category: 'music',
            type: 'music',
            musicId: 'settlement-theme-2',
            effect: 'Unlock settlement theme for Arcane Library',
            requirements: []
        },
        'music-settlement-3': {
            name: 'Settlement Theme - Winter',
            description: 'A contemplative melody that speaks of rest and renewal. The quiet beauty of the cold season.',
            cost: 75,
            icon: '🎵',
            category: 'music',
            type: 'music',
            musicId: 'settlement-theme-3',
            effect: 'Unlock settlement theme for Arcane Library',
            requirements: []
        },
        'music-forest-1': {
            name: 'Forest Battle - Awakening',
            description: 'The sound of the forest coming alive. Ancient magic stirs as your defenders prepare for battle.',
            cost: 100,
            icon: '🎵',
            category: 'music',
            type: 'music',
            musicId: 'campaign-1-battle-1',
            effect: 'Unlock forest battle theme for Arcane Library',
            requirements: []
        },
        'music-forest-2': {
            name: 'Forest Battle - Rising Tide',
            description: 'The intensity builds as enemies approach. Nature itself seems to join the fray.',
            cost: 100,
            icon: '🎵',
            category: 'music',
            type: 'music',
            musicId: 'campaign-1-battle-2',
            effect: 'Unlock forest battle theme for Arcane Library',
            requirements: []
        },
        'music-forest-3': {
            name: 'Forest Battle - Triumph',
            description: 'A powerful theme that speaks of victory and dominance. Hear the triumph of the forest.',
            cost: 100,
            icon: '🎵',
            category: 'music',
            type: 'music',
            musicId: 'campaign-1-battle-3',
            effect: 'Unlock forest battle theme for Arcane Library',
            requirements: []
        },
        'music-mountain': {
            name: 'Mountain Battle Theme',
            description: 'Echoing through mountain peaks, this theme speaks of strength and unshakeable resolve.',
            cost: 100,
            icon: '🎵',
            category: 'music',
            type: 'music',
            musicId: 'campaign-2-battle-1',
            effect: 'Unlock mountain battle theme for Arcane Library',
            requirements: []
        },
        'music-desert-1': {
            name: 'Desert Battle - Sands of Time',
            description: 'The melody of endless dunes and ancient ruins. Timeless and mysterious.',
            cost: 100,
            icon: '🎵',
            category: 'music',
            type: 'music',
            musicId: 'campaign-3-battle-1',
            effect: 'Unlock desert battle theme for Arcane Library',
            requirements: []
        },
        'music-desert-2': {
            name: 'Desert Battle - Mirage',
            description: 'A disorienting yet beautiful theme that captures the desert\'s enigmatic nature.',
            cost: 100,
            icon: '🎵',
            category: 'music',
            type: 'music',
            musicId: 'campaign-3-battle-2',
            effect: 'Unlock desert battle theme for Arcane Library',
            requirements: []
        },
        'music-victory': {
            name: 'Victory Fanfare',
            description: 'A triumphant theme that plays when you claim victory. The sound of conquest and glory.',
            cost: 150,
            icon: '🎵',
            category: 'music',
            type: 'music',
            musicId: 'victory-tune',
            effect: 'Unlock victory fanfare for Arcane Library',
            requirements: []
        },
        'music-defeat': {
            name: 'Defeat Elegy',
            description: 'A somber reflection on defeat. A reminder of battles lost and lessons learned.',
            cost: 75,
            icon: '🎵',
            category: 'music',
            type: 'music',
            musicId: 'defeat-tune',
            effect: 'Unlock defeat elegy for Arcane Library',
            requirements: []
        },
        // INTEL PACKS
        'intel-pack-1': {
            name: 'Spy Report I',
            description: 'Intelligence gathered by scouts reveals the weakness of common foes. Unlock detailed information about Basic Enemies, Archer Enemies, Beefy Enemies, and Villager Enemies in the Arcane Library. Know thy enemy, and you shall never fear them.',
            cost: 100,
            icon: '📜',
            category: 'intel',
            type: 'consumable',
            effect: 'Unlock intel on common enemies',
            requirements: []
        },
        'intel-pack-2': {
            name: 'Spy Report II',
            description: 'Through careful espionage, you gain knowledge of intermediate threats. Unlock information about Knight Enemies and Shield Knight Enemies. Fortify your defenses with understanding.',
            cost: 200,
            icon: '📋',
            category: 'intel',
            type: 'consumable',
            effect: 'Unlock intel on knight enemies',
            requirements: []
        },
        'intel-pack-3': {
            name: 'Spy Report III',
            description: 'Arcane scholars decipher cryptic runes revealing secrets of magical foes. Unlock intel on Mage Enemies and Frog Enemies. Master the arcane, and you master the battlefield.',
            cost: 300,
            icon: '🔍',
            category: 'intel',
            type: 'consumable',
            effect: 'Unlock intel on magical enemies',
            requirements: []
        },
        'intel-pack-4': {
            name: 'Spy Report IV',
            description: 'The most dangerous intelligence—knowledge of the realm\'s rarest and most powerful foes. Unlock intel on Elemental Frog Enemies. Understanding these ancient forces may be the key to your survival.',
            cost: 400,
            icon: '⚡',
            category: 'intel',
            type: 'consumable',
            effect: 'Unlock intel on elemental enemies',
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
                    // Get the proper name from UpgradeRegistry
                    const upgradeData = UpgradeRegistry.getUpgrade(requiredUpgrade);
                    const upgradeName = upgradeData ? upgradeData.name : requiredUpgrade;
                    return `Requires: ${upgradeName}`;
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
            'boon': 'Protective Boons',
            'music': 'Musical Scores'
        };
        return categoryNames[category] || category;
    }
}
