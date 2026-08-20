import { ArcherTower } from './ArcherTower.js';

/**
 * Transformed Archer Tower - trades fire rate for a devastating, effectively-unlimited-
 * range shot.
 *
 * Range used to be set to actual Infinity, which caused two real problems: (1) the shared
 * spatial-grid targeting in Tower.findTarget() queries a bounded radius around the tower,
 * which is meaningless for an infinite radius, so findTarget() had to be overridden to
 * linear-scan every living enemy on every re-target instead; and (2) ctx.arc(..., range, ...)
 * with an Infinite radius would hang/crash the canvas draw call, so the range-circle
 * rendering needed a separate hardcoded cap just to stay drawable.
 *
 * MASSIVE_RANGE replaces Infinity with a large-but-finite radius instead: it comfortably
 * exceeds the base-resolution map diagonal (1920x1080, ~2202px) at every supported
 * resolution scale, so it still reads as "covers the whole map" in play, while being a real
 * number the shared spatial-grid targeting and the base Tower's range-circle rendering
 * (Tower.renderAttackRadiusCircle) can use completely unmodified - no override needed for
 * either.
 */
export class SharpshooterTower extends ArcherTower {
    static TRANSFORM_COLOR = '#B22222';
    static MASSIVE_RANGE = 3000;

    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY);
        this.damage = 150;
        this.fireRate = 0.3;
        this.range = SharpshooterTower.MASSIVE_RANGE;
    }

    renderDynamicParts(ctx, gridSize) {
        super.renderDynamicParts(ctx, gridSize);
        // ArcherTower's stone foundation (see its renderStaticBack) bottoms out at
        // this.y + towerSize*0.15 - tuned here to match.
        this.renderTransformBadge(ctx, gridSize, { color: SharpshooterTower.TRANSFORM_COLOR, symbol: 'crosshair', groundYFactor: 0.3 });
    }

    static getInfo() {
        return {
            name: 'Sharpshooter',
            description: 'A patient marksman with unlimited range and a devastating shot - but a long time between them.',
            cost: 500,
            icon: ''
        };
    }
}
