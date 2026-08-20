import { BasicTower } from './BasicTower.js';

/**
 * Transformed Watch Tower - same rocks, same defenders, three times the throws.
 * The tripled fire rate is the entire mechanic: Tower.update()'s cooldown-driven
 * shoot loop already fires as fast as `1 / this.fireRate` allows, so tripling
 * fireRate here is all that's needed - BasicTower's shoot()/defender-animation
 * logic is reused completely unmodified.
 */
export class SlingerTower extends BasicTower {
    // Single source of truth for this transform's theme color - used both for the
    // canvas-drawn ring/badge below and as the sprite tint TowerRenderAdapter applies
    // to the baked tower body (see its register() method).
    static TRANSFORM_COLOR = '#FFD700';

    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY);
        this.fireRate = this.fireRate * 3;
    }

    renderDynamicParts(ctx, gridSize) {
        super.renderDynamicParts(ctx, gridSize);
        // BasicTower's foundation (see its renderStaticBack) sits at roughly
        // this.y + gridSize*0.12, only a little below this.y - tuned here to match.
        this.renderTransformBadge(ctx, gridSize, { color: SlingerTower.TRANSFORM_COLOR, symbol: 'burst', groundYFactor: 0.24, badgeYFactor: -0.05 });
    }

    static getInfo() {
        return {
            name: 'Slinger Tower',
            description: 'Forge-tempered slings let every defender throw three times as fast.',
            cost: 200,
            icon: ''
        };
    }
}
