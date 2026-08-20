import { SlingerTower } from './SlingerTower.js';
import { SharpshooterTower } from './SharpshooterTower.js';
import { SpikeThrowerTower } from './SpikeThrowerTower.js';
import { TripleTrebuchetTower } from './TripleTrebuchetTower.js';
import { SuperPoisonTower } from './SuperPoisonTower.js';

/**
 * TowerTransformRegistry - single source of truth for which base tower type transforms
 * into which advanced class, mirroring TowerRegistry's pattern.
 *
 * - unlockId: the settlement UpgradeSystem id that must be purchased before this
 *   transform can ever be used (see UpgradeRegistry.js / SettlementHub.js's upgradeData).
 * - transformCost: in-level gold cost paid when actually transforming a placed tower.
 */
export class TowerTransformRegistry {
    static #registry = {
        'basic': {
            key: 'slinger',
            class: SlingerTower,
            unlockId: 'slinger-tower-unlock',
            transformCost: 150
        },
        'archer': {
            key: 'sharpshooter',
            class: SharpshooterTower,
            unlockId: 'sharpshooter-tower-unlock',
            transformCost: 350
        },
        'barricade': {
            key: 'spike-thrower',
            class: SpikeThrowerTower,
            unlockId: 'spike-thrower-tower-unlock',
            transformCost: 200
        },
        'cannon': {
            key: 'triple-trebuchet',
            class: TripleTrebuchetTower,
            unlockId: 'triple-trebuchet-unlock',
            transformCost: 500
        },
        'poison': {
            key: 'super-poison',
            class: SuperPoisonTower,
            unlockId: 'super-poison-tower-unlock',
            transformCost: 400
        }
    };

    /**
     * @param {string} baseType - tower.type (e.g. 'basic')
     * @returns {Object|null} - { key, class, unlockId, transformCost } or null
     */
    static getTransform(baseType) {
        return this.#registry[baseType] || null;
    }

    static hasTransform(baseType) {
        return baseType in this.#registry;
    }

    static getAllTransforms() {
        return { ...this.#registry };
    }
}
