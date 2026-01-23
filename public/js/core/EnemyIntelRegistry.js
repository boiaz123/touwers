/**
 * EnemyIntelRegistry - Centralized registry for enemy intelligence data
 * Provides detailed information about enemies that can be unlocked via Intel packs
 */
export class EnemyIntelRegistry {
    static #intelData = {
        // BASIC ENEMIES (Spy Report I)
        'basic': {
            name: 'Basic Enemy',
            description: 'The most common foot soldier encountered in battle.',
            icon: '👤',
            stats: { health: 20, speed: 2, damage: 1 },
            abilities: ['Basic movement']
        },
        'archer': {
            name: 'Archer Enemy',
            description: 'Armed with a bow, attacks from range.',
            icon: '🏹',
            stats: { health: 15, speed: 2.5, damage: 3 },
            abilities: ['Ranged attack', 'Fast movement']
        },
        'beefyenemy': {
            name: 'Beefy Enemy',
            description: 'A heavily muscled warrior with impressive durability.',
            icon: '💪',
            stats: { health: 50, speed: 1, damage: 3 },
            abilities: ['High HP', 'Slow movement']
        },
        'villager': {
            name: 'Villager Enemy',
            description: 'An ordinary villager conscripted into service.',
            icon: '👨',
            stats: { health: 10, speed: 1.5, damage: 1 },
            abilities: ['Basic movement']
        },
        // INTERMEDIATE ENEMIES (Spy Report II)
        'knight': {
            name: 'Knight Enemy',
            description: 'A trained warrior in full armor.',
            icon: '🛡️',
            stats: { health: 40, speed: 1.5, damage: 4 },
            abilities: ['Armor protection', 'Melee attack']
        },
        'shieldknight': {
            name: 'Shield Knight Enemy',
            description: 'A knight with an enchanted shield for additional protection.',
            icon: '⚔️',
            stats: { health: 45, speed: 1.2, damage: 4 },
            abilities: ['Shield defense', 'Armor', 'Reduced damage']
        },
        // MAGICAL ENEMIES (Spy Report III)
        'mage': {
            name: 'Mage Enemy',
            description: 'A spellcaster wielding arcane magic.',
            icon: '🧙',
            stats: { health: 25, speed: 2, damage: 4 },
            abilities: ['Spell casting', 'Magic damage']
        },
        'frog': {
            name: 'Frog Enemy',
            description: 'A magical frog creature.',
            icon: '🐸',
            stats: { health: 30, speed: 2.5, damage: 2 },
            abilities: ['Jumping attack', 'Water affinity']
        },
        // ELEMENTAL ENEMIES (Spy Report IV)
        'earthfrog': {
            name: 'Earth Frog Enemy',
            description: 'A frog infused with earth magic.',
            icon: '🪨',
            stats: { health: 50, speed: 1.5, damage: 3 },
            abilities: ['Ground slam', 'Earth magic', 'High durability']
        },
        'waterfrog': {
            name: 'Water Frog Enemy',
            description: 'A frog infused with water magic.',
            icon: '💧',
            stats: { health: 40, speed: 2.5, damage: 3 },
            abilities: ['Water spray', 'Water magic', 'Enhanced speed']
        },
        'firefrog': {
            name: 'Fire Frog Enemy',
            description: 'A frog infused with fire magic.',
            icon: '🔥',
            stats: { health: 35, speed: 2, damage: 4 },
            abilities: ['Flame burst', 'Fire magic', 'High damage']
        },
        'airfrog': {
            name: 'Air Frog Enemy',
            description: 'A frog infused with air magic.',
            icon: '💨',
            stats: { health: 30, speed: 3, damage: 3 },
            abilities: ['Wind gust', 'Air magic', 'Very fast']
        }
    };

    // Mapping of intel packs to the enemies they unlock
    static #intelMapping = {
        'intel-pack-1': ['basic', 'archer', 'beefyenemy', 'villager'],
        'intel-pack-2': ['knight', 'shieldknight'],
        'intel-pack-3': ['mage', 'frog'],
        'intel-pack-4': ['earthfrog', 'waterfrog', 'firefrog', 'airfrog']
    };

    /**
     * Get intel data for a specific enemy
     * @param {string} enemyId - Enemy ID
     * @returns {Object|null} - Enemy intel data or null
     */
    static getEnemyIntel(enemyId) {
        return this.#intelData[enemyId] || null;
    }

    /**
     * Get all enemies unlocked by an intel pack
     * @param {string} intelPackId - Intel pack ID
     * @returns {Array<string>} - Array of enemy IDs
     */
    static getUnlockedEnemiesByIntel(intelPackId) {
        return this.#intelMapping[intelPackId] || [];
    }

    /**
     * Get all available enemy intel
     * @returns {Object} - Object containing all enemy intel data
     */
    static getAllEnemyIntel() {
        return { ...this.#intelData };
    }

    /**
     * Get names of enemies unlocked by specific intel packs
     * @param {Array<string>} unlockedIntelPacks - Array of intel pack IDs that are unlocked
     * @returns {Array<string>} - Array of enemy IDs whose intel is unlocked
     */
    static getUnlockedEnemies(unlockedIntelPacks) {
        const unlockedEnemies = new Set();
        for (const intelId of unlockedIntelPacks) {
            const enemies = this.getUnlockedEnemiesByIntel(intelId);
            enemies.forEach(e => unlockedEnemies.add(e));
        }
        return Array.from(unlockedEnemies);
    }
}
