/**
 * EnemyIntelRegistry - Centralized registry for enemy intelligence data
 * Provides detailed information about enemies that can be unlocked via Intel packs
 */
export class EnemyIntelRegistry {
    static #intelData = {
        // BASIC ENEMIES (Spy Report I)
        'basic': {
            name: 'Soldier',
            description: 'The most common foot soldier encountered in battle. Reliable, disciplined, and always part of a larger force.',
            image: 'assets/enemies/soldier.png',
            stats: { health: 100, speed: 50, armour: 0, magicResistance: 0, damage: 5 },
            abilities: ['Basic movement']
        },
        'archer': {
            name: 'Ranger',
            description: 'Armed with a bow, this ranger strikes from a safe distance. Fast and lightly armored, they rely on mobility over brute force.',
            image: 'assets/enemies/ranger.png',
            stats: { health: 120, speed: 60, armour: 8, magicResistance: 0, damage: 3 },
            abilities: ['Ranged attack', 'Fast movement']
        },
        'beefyenemy': {
            name: 'Enemy Captain',
            description: 'A heavily muscled warrior who leads from the front. Fearsome in close combat, though slow to react.',
            image: 'assets/enemies/enemy_captain.png',
            stats: { health: 200, speed: 60, armour: 25, magicResistance: 0, damage: 8 },
            abilities: ['High HP', 'Heavy armour']
        },
        'villager': {
            name: 'Peasant',
            description: 'An ordinary villager conscripted into service. Poorly trained and lightly armed, but numerous.',
            image: 'assets/enemies/peasant.png',
            stats: { health: 100, speed: 50, armour: 0, magicResistance: 0, damage: 3 },
            abilities: ['Basic movement']
        },
        // INTERMEDIATE ENEMIES (Spy Report II)
        'knight': {
            name: 'Knight',
            description: 'A trained warrior clad in full armor. Disciplined and dangerous, the Knight is a stalwart presence on the battlefield.',
            image: 'assets/enemies/knight.png',
            stats: { health: 1500, speed: 40, armour: 38, magicResistance: -0.2, damage: 15 },
            abilities: ['Heavy armour', 'Melee attack', 'Magic weakness']
        },
        'shieldknight': {
            name: 'Shieldknight',
            description: 'A knight bearing an enchanted shield that deflects a portion of all incoming damage. A formidable defensive combatant.',
            image: 'assets/enemies/shieldknight.png',
            stats: { health: 180, speed: 35, armour: 50, magicResistance: -0.2, damage: 12 },
            abilities: ['Shield defense', 'Heavy armour', 'Magic weakness']
        },
        // MAGICAL ENEMIES (Spy Report III)
        'mage': {
            name: 'Mage',
            description: 'A spellcaster wielding devastating arcane magic. Fragile but lethal, the Mage can unleash potent spells from range.',
            image: 'assets/enemies/mage.png',
            stats: { health: 110, speed: 45, armour: 4, magicResistance: 0.5, damage: 10 },
            abilities: ['Spell casting', 'Magic immune (50%)']
        },
        'frog': {
            name: 'Frog Mage',
            description: 'A mysterious amphibian that has mastered the arcane arts. Its erratic movement and magical attacks make it unpredictable.',
            image: 'assets/enemies/frog_mage.png',
            stats: { health: 85, speed: 55, armour: 10, magicResistance: 0.5, damage: 6 },
            abilities: ['Jumping attack', 'Magic immune (50%)']
        },
        // ELEMENTAL ENEMIES (Spy Report IV)
        'earthfrog': {
            name: 'Frog of Earth',
            description: 'A frog infused with ancient earth magic. It shakes the ground with powerful stomps and boasts exceptional durability.',
            image: 'assets/enemies/frog_earth.png',
            stats: { health: 340, speed: 25, armour: 20, magicResistance: 0.5, damage: 10 },
            abilities: ['Ground slam', 'Earth magic', 'Magic immune (50%)']
        },
        'waterfrog': {
            name: 'Frog of Water',
            description: 'A frog blessed with the power of flowing water. Swift and elusive, it moves with fluid grace across the battlefield.',
            image: 'assets/enemies/frog_water.png',
            stats: { health: 340, speed: 25, armour: 10, magicResistance: 0.5, damage: 10 },
            abilities: ['Water spray', 'Water magic', 'Magic immune (50%)']
        },
        'firefrog': {
            name: 'Frog of Fire',
            description: 'A frog wreathed in blazing flame. Its fiery strikes deal heavy damage, and it leaves scorched earth in its wake.',
            image: 'assets/enemies/frog_fire.png',
            stats: { health: 340, speed: 25, armour: 10, magicResistance: 0.5, damage: 12 },
            abilities: ['Flame burst', 'Fire magic', 'Magic immune (50%)']
        },
        'airfrog': {
            name: 'Frog of Air',
            description: 'A frog that commands the winds. Incredibly fast and hard to pin down, it drifts like a gust on the battlefield.',
            image: 'assets/enemies/frog_air.png',
            stats: { health: 340, speed: 25, armour: 8, magicResistance: 0.5, damage: 8 },
            abilities: ['Wind gust', 'Air magic', 'Magic immune (50%)']
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
