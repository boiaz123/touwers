import { PoisonArcherTower } from './PoisonArcherTower.js';

/**
 * Transformed Poison Archer - the toxin now permanently saps an afflicted enemy's speed
 * in addition to the usual damage-over-time.
 */
export class SuperPoisonTower extends PoisonArcherTower {
    static TRANSFORM_COLOR = '#9B30FF';

    applyPoisonToEnemy(enemy, towerForgeBonus = 0) {
        super.applyPoisonToEnemy(enemy, towerForgeBonus);

        // Permanent 20% speed reduction - applied once per enemy (guarded by the flag
        // below) no matter how many Super Poison Towers hit it, by lowering the shared
        // originalSpeed baseline every slow effect (BarricadeTower's zone,
        // MagicTower's water/freeze) reads from and which TowerManager's per-frame
        // restore-to-baseline loop pulls enemy.speed back toward once other slows end.
        // Lowering the baseline itself, instead of just enemy.speed, is what makes this
        // reduction survive after any other slow effect expires or restores - a plain
        // enemy.speed *= 0.8 here would just get overwritten by that restore loop.
        if (!enemy._superPoisonSlowed) {
            enemy._superPoisonSlowed = true;
            if (!enemy.hasOwnProperty('originalSpeed')) {
                enemy.originalSpeed = enemy.speed;
            }
            enemy.originalSpeed *= 0.8;
            enemy.speed = Math.min(enemy.speed, enemy.originalSpeed);
        }
    }

    renderDynamicParts(ctx, gridSize) {
        super.renderDynamicParts(ctx, gridSize);
        // PoisonArcherTower has no static structure - its 4 camouflage bushes sit
        // symmetrically around this.y (see generateCoverElements), so this.y is closer to
        // the footprint's center than its bottom edge; a smaller offset than the other
        // (foundation-based) towers keeps the ring under the bush cluster instead of well
        // past it.
        this.renderTransformBadge(ctx, gridSize, { color: SuperPoisonTower.TRANSFORM_COLOR, symbol: 'skull', groundYFactor: 0.5, badgeYFactor: 0.25 });
    }

    static getInfo() {
        return {
            name: 'Super Poison Tower',
            description: "A refined toxin that permanently saps 20% of a poisoned enemy's speed, on top of the usual damage over time.",
            cost: 600,
            icon: ''
        };
    }
}
