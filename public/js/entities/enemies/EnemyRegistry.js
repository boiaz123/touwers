import { BasicEnemy } from './BasicEnemy.js';
import { BeefyEnemy } from './BeefyEnemy.js';
import { ArcherEnemy } from './ArcherEnemy.js';
import { MageEnemy } from './MageEnemy.js';
import { VillagerEnemy } from './VillagerEnemy.js';
import { KnightEnemy } from './KnightEnemy.js';
import { ShieldKnightEnemy } from './ShieldKnightEnemy.js';
import { FrogEnemy } from './FrogEnemy.js';
import { EarthFrogEnemy } from './EarthFrogEnemy.js';
import { WaterFrogEnemy } from './WaterFrogEnemy.js';
import { FireFrogEnemy } from './FireFrogEnemy.js';
import { AirFrogEnemy } from './AirFrogEnemy.js';
import { FrogKingEnemy } from './FrogKingEnemy.js';

/**
 * EnemyRegistry - Centralized registry for all enemy types
 * This is the single place where enemy types and their metadata are defined.
 * EnemyManager only imports this registry, not individual enemy classes.
 */
export class EnemyRegistry {
    static #registry = {
        'basic': { 
            class: BasicEnemy, 
            ...BasicEnemy.BASE_STATS
        },
        'beefyenemy': { 
            class: BeefyEnemy, 
            ...BeefyEnemy.BASE_STATS
        },
        'knight': { 
            class: KnightEnemy, 
            ...KnightEnemy.BASE_STATS
        },
        'shieldknight': { 
            class: ShieldKnightEnemy, 
            ...ShieldKnightEnemy.BASE_STATS
        },
        'mage': { 
            class: MageEnemy, 
            ...MageEnemy.BASE_STATS
        },
        'villager': { 
            class: VillagerEnemy, 
            ...VillagerEnemy.BASE_STATS
        },
        'archer': { 
            class: ArcherEnemy, 
            ...ArcherEnemy.BASE_STATS
        },
        'frog': { 
            class: FrogEnemy, 
            ...FrogEnemy.BASE_STATS
        },
        'earthfrog': { 
            class: EarthFrogEnemy, 
            ...EarthFrogEnemy.BASE_STATS
        },
        'waterfrog': { 
            class: WaterFrogEnemy, 
            ...WaterFrogEnemy.BASE_STATS
        },
        'firefrog': { 
            class: FireFrogEnemy, 
            ...FireFrogEnemy.BASE_STATS
        },
        'airfrog': { 
            class: AirFrogEnemy, 
            ...AirFrogEnemy.BASE_STATS
        },
        'frogking': { 
            class: FrogKingEnemy, 
            ...FrogKingEnemy.BASE_STATS
        }
    };

    /**
     * Get an enemy type definition by key
     * @param {string} type - Enemy type key (e.g., 'basic', 'knight')
     * @returns {Object|null} - Enemy type object with { class, defaultHealth, defaultSpeed } or null if not found
     */
    static getEnemyType(type) {
        return this.#registry[type] || null;
    }

    /**
     * Get all registered enemy types
     * @returns {Object} - Object containing all enemy type definitions
     */
    static getAllEnemyTypes() {
        return { ...this.#registry };
    }

    /**
     * Check if an enemy type is registered
     * @param {string} type - Enemy type key
     * @returns {boolean} - True if type exists
     */
    static hasEnemyType(type) {
        return type in this.#registry;
    }

    /**
     * Get the default health of an enemy type
     * @param {string} type - Enemy type key
     * @returns {number|null} - Default health or null if not found
     */
    static getDefaultHealth(type) {
        const enemyType = this.#registry[type];
        return enemyType ? enemyType.health : null;
    }

    /**
     * Get the default speed of an enemy type
     * @param {string} type - Enemy type key
     * @returns {number|null} - Default speed or null if not found
     */
    static getDefaultSpeed(type) {
        const enemyType = this.#registry[type];
        return enemyType ? enemyType.speed : null;
    }

    /**
     * Get the default armour of an enemy type
     * @param {string} type - Enemy type key
     * @returns {number|null} - Default armour or null if not found
     */
    static getDefaultArmour(type) {
        const enemyType = this.#registry[type];
        return enemyType ? enemyType.armour : null;
    }

    /**
     * Get the default magic resistance of an enemy type
     * @param {string} type - Enemy type key
     * @returns {number|null} - Default magic resistance or null if not found
     */
    static getDefaultMagicResistance(type) {
        const enemyType = this.#registry[type];
        return enemyType ? enemyType.magicResistance : null;
    }

    /**
     * Create an instance of an enemy
     * @param {string} type - Enemy type key
     * @param {Array} path - The path for the enemy to follow
     * @param {number} healthMultiplier - Health multiplier (optional)
     * @param {number} speed - Speed override (optional)
     * @param {number} armour - Armour override (optional)
     * @param {number} magicResistance - Magic resistance override (optional)
     * @returns {Object|null} - Enemy instance or null if type not found
     */
    static createEnemy(type, path, healthMultiplier, speed, armour = null, magicResistance = null) {
        const enemyType = this.#registry[type];
        if (!enemyType) {
            console.warn(`Unknown enemy type: ${type}`);
            return null;
        }

        const EnemyClass = enemyType.class;
        const enemy = new EnemyClass(path, healthMultiplier, speed, armour, magicResistance);
        enemy.type = type; // Store the type for serialization
        return enemy;
    }

    /**
     * Get all registered enemy type keys
     * @returns {Array<string>} - Array of all enemy type keys
     */
    static getEnemyTypeKeys() {
        return Object.keys(this.#registry);
    }
}
