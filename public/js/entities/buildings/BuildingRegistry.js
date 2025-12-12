import { GoldMine } from './GoldMine.js';
import { TowerForge } from './TowerForge.js';
import { MagicAcademy } from './MagicAcademy.js';
import { SuperWeaponLab } from './SuperWeaponLab.js';
import { TrainingGrounds } from './TrainingGrounds.js';

/**
 * BuildingRegistry - Centralized registry for all building types
 * This is the single place where building types and their metadata are defined.
 * BuildingManager only imports this registry, not individual building classes.
 */
export class BuildingRegistry {
    static #registry = {
        'mine': { class: GoldMine, cost: 200, size: 4 },
        'forge': { class: TowerForge, cost: 300, size: 4 },
        'academy': { class: MagicAcademy, cost: 250, size: 4 },
        'training': { class: TrainingGrounds, cost: 400, size: 4 },
        'superweapon': { class: SuperWeaponLab, cost: 1000, size: 4 }
    };

    /**
     * Get a building type definition by key
     * @param {string} type - Building type key (e.g., 'mine', 'forge')
     * @returns {Object|null} - Building type object with { class, cost, size } or null if not found
     */
    static getBuildingType(type) {
        return this.#registry[type] || null;
    }

    /**
     * Get all registered building types
     * @returns {Object} - Object containing all building type definitions
     */
    static getAllBuildingTypes() {
        return { ...this.#registry };
    }

    /**
     * Check if a building type is registered
     * @param {string} type - Building type key
     * @returns {boolean} - True if type exists
     */
    static hasBuildingType(type) {
        return type in this.#registry;
    }

    /**
     * Get the cost of a building type
     * @param {string} type - Building type key
     * @returns {number|null} - Cost or null if not found
     */
    static getBuildingCost(type) {
        const buildingType = this.#registry[type];
        return buildingType ? buildingType.cost : null;
    }

    /**
     * Get the size of a building type
     * @param {string} type - Building type key
     * @returns {number|null} - Size or null if not found
     */
    static getBuildingSize(type) {
        const buildingType = this.#registry[type];
        return buildingType ? buildingType.size : null;
    }

    /**
     * Get the class for a building type
     * @param {string} type - Building type key
     * @returns {Class|null} - Building class or null if not found
     */
    static getBuildingClass(type) {
        const buildingType = this.#registry[type];
        return buildingType ? buildingType.class : null;
    }

    /**
     * Create a new building instance
     * @param {string} type - Building type key
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} gridX - Grid X position
     * @param {number} gridY - Grid Y position
     * @returns {Building|null} - New building instance or null if type not found
     */
    static createBuilding(type, x, y, gridX, gridY) {
        const buildingType = this.#registry[type];
        if (!buildingType) return null;
        const building = new buildingType.class(x, y, gridX, gridY);
        building.type = type; // Store the type for serialization
        return building;
    }
}
