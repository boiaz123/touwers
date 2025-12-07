import { BasicTower } from './BasicTower.js';
import { CannonTower } from './CannonTower.js';
import { ArcherTower } from './ArcherTower.js';
import { MagicTower } from './MagicTower.js';
import { BarricadeTower } from './BarricadeTower.js';
import { PoisonArcherTower } from './PoisonArcherTower.js';
import { CombinationTower } from './CombinationTower.js';

/**
 * TowerRegistry - Centralized registry for all tower types
 * This is the single place where tower types and their metadata are defined.
 * TowerManager only imports this registry, not individual tower classes.
 */
export class TowerRegistry {
    static #registry = {
        'basic': { class: BasicTower, cost: 50 },
        'cannon': { class: CannonTower, cost: 100 },
        'archer': { class: ArcherTower, cost: 75 },
        'magic': { class: MagicTower, cost: 150 },
        'barricade': { class: BarricadeTower, cost: 90 },
        'poison': { class: PoisonArcherTower, cost: 120 },
        'combination': { class: CombinationTower, cost: 200 }
    };

    /**
     * Get a tower type definition by key
     * @param {string} type - Tower type key (e.g., 'basic', 'cannon')
     * @returns {Object|null} - Tower type object with { class, cost } or null if not found
     */
    static getTowerType(type) {
        return this.#registry[type] || null;
    }

    /**
     * Get all registered tower types
     * @returns {Object} - Object containing all tower type definitions
     */
    static getAllTowerTypes() {
        return { ...this.#registry };
    }

    /**
     * Check if a tower type is registered
     * @param {string} type - Tower type key
     * @returns {boolean} - True if type exists
     */
    static hasTowerType(type) {
        return type in this.#registry;
    }

    /**
     * Get the cost of a tower type
     * @param {string} type - Tower type key
     * @returns {number|null} - Cost or null if not found
     */
    static getTowerCost(type) {
        const towerType = this.#registry[type];
        return towerType ? towerType.cost : null;
    }

    /**
     * Get the class for a tower type
     * @param {string} type - Tower type key
     * @returns {Class|null} - Tower class or null if not found
     */
    static getTowerClass(type) {
        const towerType = this.#registry[type];
        return towerType ? towerType.class : null;
    }

    /**
     * Create a new tower instance
     * @param {string} type - Tower type key
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} gridX - Grid X position
     * @param {number} gridY - Grid Y position
     * @returns {Tower|null} - New tower instance or null if type not found
     */
    static createTower(type, x, y, gridX, gridY) {
        const towerType = this.#registry[type];
        if (!towerType) return null;
        return new towerType.class(x, y, gridX, gridY);
    }
}
