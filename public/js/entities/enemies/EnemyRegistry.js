import { BasicEnemy } from './BasicEnemy.js';
import { BeefyEnemy } from './BeefyEnemy.js';
import { ArcherEnemy } from './ArcherEnemy.js';
import { MageEnemy } from './MageEnemy.js';
import { VillagerEnemy } from './VillagerEnemy.js';
import { KnightEnemy } from './KnightEnemy.js';
import { ShieldKnightEnemy } from './ShieldKnightEnemy.js';
import { FrogEnemy } from './FrogEnemy.js';

/**
 * EnemyRegistry - Centralized registry for all enemy types
 * This is the single place where enemy types and their metadata are defined.
 * EnemyManager only imports this registry, not individual enemy classes.
 */
export class EnemyRegistry {
    static #registry = {
        'basic': { 
            class: BasicEnemy, 
            defaultHealth: 100, 
            defaultSpeed: 50 
        },
        'beefyenemy': { 
            class: BeefyEnemy, 
            defaultHealth: 150, 
            defaultSpeed: 60 
        },
        'knight': { 
            class: KnightEnemy, 
            defaultHealth: 160, 
            defaultSpeed: 40 
        },
        'shieldknight': { 
            class: ShieldKnightEnemy, 
            defaultHealth: 180, 
            defaultSpeed: 35 
        },
        'mage': { 
            class: MageEnemy, 
            defaultHealth: 110, 
            defaultSpeed: 45 
        },
        'villager': { 
            class: VillagerEnemy, 
            defaultHealth: 80, 
            defaultSpeed: 50 
        },
        'archer': { 
            class: ArcherEnemy, 
            defaultHealth: 90, 
            defaultSpeed: 50 
        },
        'frog': { 
            class: FrogEnemy, 
            defaultHealth: 85, 
            defaultSpeed: 55 
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
        return enemyType ? enemyType.defaultHealth : null;
    }

    /**
     * Get the default speed of an enemy type
     * @param {string} type - Enemy type key
     * @returns {number|null} - Default speed or null if not found
     */
    static getDefaultSpeed(type) {
        const enemyType = this.#registry[type];
        return enemyType ? enemyType.defaultSpeed : null;
    }

    /**
     * Create an instance of an enemy
     * @param {string} type - Enemy type key
     * @param {Array} path - The path for the enemy to follow
     * @param {number} healthMultiplier - Health multiplier (optional)
     * @param {number} speed - Speed override (optional)
     * @returns {Object|null} - Enemy instance or null if type not found
     */
    static createEnemy(type, path, healthMultiplier, speed) {
        const enemyType = this.#registry[type];
        if (!enemyType) {
            console.warn(`Unknown enemy type: ${type}`);
            return null;
        }

        const EnemyClass = enemyType.class;
        return new EnemyClass(path, healthMultiplier, speed);
    }

    /**
     * Get all registered enemy type keys
     * @returns {Array<string>} - Array of all enemy type keys
     */
    static getEnemyTypeKeys() {
        return Object.keys(this.#registry);
    }
}
