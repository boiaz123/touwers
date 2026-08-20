import { ArcherTower } from './ArcherTower.js';

// Range circles are drawn with ctx.arc(..., range, ...) - an actually-Infinity radius
// would hang/crash the canvas draw call, so range indicators are capped to this visual
// radius instead. Large enough to read as "covers the whole map" at any resolution.
const VISUAL_RANGE_CAP = 3000;

/**
 * Transformed Archer Tower - trades fire rate for a devastating, unlimited-range shot.
 * Infinite range means the shared spatial-grid targeting in Tower.findTarget() (which
 * queries a bounded radius) can't be reused, so findTarget() is overridden to linear-scan
 * every living enemy directly instead.
 */
export class SharpshooterTower extends ArcherTower {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY);
        this.damage = 150;
        this.fireRate = 0.3;
        this.range = Infinity;
    }

    findTarget(enemies) {
        let closest = null;
        let closestDistSq = Infinity;
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < closestDistSq) {
                closest = enemy;
                closestDistSq = distSq;
            }
        }
        return closest;
    }

    renderRangeIndicator(ctx, color = 'rgba(139, 69, 19, 0.2)') {
        if (!this.target) return;
        const range = Math.min(this.effectiveRange ?? this.range, VISUAL_RANGE_CAP);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, range, 0, Math.PI * 2);
        ctx.stroke();
    }

    renderAttackRadiusCircle(ctx, color = 'rgba(100, 200, 100, 0.3)') {
        if (!this.isSelected) return;
        const range = Math.min(this.effectiveRange ?? this.range, VISUAL_RANGE_CAP);
        ctx.strokeStyle = 'rgba(100, 200, 100, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, range, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(100, 200, 100, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(this.x, this.y, range, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    renderDynamicParts(ctx, gridSize) {
        super.renderDynamicParts(ctx, gridSize);
        this.renderTransformBadge(ctx, gridSize, { color: '#B22222', symbol: 'crosshair' });
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
