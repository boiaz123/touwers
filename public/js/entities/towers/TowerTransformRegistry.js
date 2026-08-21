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
    // Which Tower Forge upgrade (forge.upgrades[key]) and Training Grounds upgrade
    // (training[group][key]) track this base tower type's per-tower level. Used by
    // isMaxUpgraded() to gate transformation per tower type rather than on the Forge/
    // Training Grounds buildings' own overall level (see TowerManager.canTransformTowerType).
    static #registry = {
        'basic': {
            key: 'slinger',
            class: SlingerTower,
            unlockId: 'slinger-tower-unlock',
            transformCost: 150,
            forgeUpgradeKey: 'basic',
            trainingUpgradeGroup: 'rangeUpgrades',
            trainingUpgradeKey: 'basicTower'
        },
        'archer': {
            key: 'sharpshooter',
            class: SharpshooterTower,
            unlockId: 'sharpshooter-tower-unlock',
            transformCost: 350,
            forgeUpgradeKey: 'archer',
            trainingUpgradeGroup: 'rangeUpgrades',
            trainingUpgradeKey: 'archerTower'
        },
        'barricade': {
            key: 'spike-thrower',
            class: SpikeThrowerTower,
            unlockId: 'spike-thrower-tower-unlock',
            transformCost: 200,
            forgeUpgradeKey: 'barricade_radius',
            trainingUpgradeGroup: 'upgrades',
            trainingUpgradeKey: 'barricadeSlowPower'
        },
        'cannon': {
            key: 'triple-trebuchet',
            class: TripleTrebuchetTower,
            unlockId: 'triple-trebuchet-unlock',
            transformCost: 500,
            forgeUpgradeKey: 'cannon',
            trainingUpgradeGroup: 'rangeUpgrades',
            trainingUpgradeKey: 'cannonTower'
        },
        'poison': {
            key: 'super-poison',
            class: SuperPoisonTower,
            unlockId: 'super-poison-tower-unlock',
            transformCost: 400,
            forgeUpgradeKey: 'poison',
            trainingUpgradeGroup: 'upgrades',
            trainingUpgradeKey: 'poisonArcherTowerFireRate'
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

    /**
     * True once THIS specific tower type's own Tower Forge upgrade and Training Grounds
     * upgrade have both reached their max level (5) - the per-tower gate for transforming,
     * independent of the Forge/Training Grounds buildings' own overall level.
     * @param {string} baseType - tower.type (e.g. 'basic')
     * @param {Object} forge - the level's TowerForge instance
     * @param {Object} training - the level's TrainingGrounds instance
     */
    static isMaxUpgraded(baseType, forge, training) {
        const transform = this.#registry[baseType];
        if (!transform || !forge || !training) return false;

        const forgeUpgrade = forge.upgrades[transform.forgeUpgradeKey];
        if (!forgeUpgrade || forgeUpgrade.level < forge.maxForgeLevel) return false;

        const trainingUpgrade = training[transform.trainingUpgradeGroup][transform.trainingUpgradeKey];
        if (!trainingUpgrade || trainingUpgrade.level < trainingUpgrade.maxLevel) return false;

        return true;
    }
}
