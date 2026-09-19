import { Tower } from './Tower.js';

// Collapse dust hangs around for this long after the tower gives way (see render())
const COLLAPSE_DUST_SECONDS = 1.6;

/**
 * What's left where a Heavy Frog stomped a tower flat (TowerManager.destroyTower). It sits in the
 * towers list on the tower's own 2x2 footprint, so the spot stays blocked for placement exactly as
 * before, until the player clicks it and clears it (TowerManager.clearRubble) - no refund, since
 * there's nothing left to sell.
 *
 * Follows the same render convention as every migrated tower (a baked static layer shared by all
 * piles, see TowerRenderAdapter), but never targets, shoots or upgrades.
 */
export class RubblePile extends Tower {
    /** @param {string|null} wreckedType the type of tower that stood here (basic, archer, ...) - shown in the clear-rubble panel */
    constructor(x, y, gridX, gridY, wreckedType = null) {
        super(x, y, gridX, gridY);
        this.type = 'rubble';
        this.isRubble = true;
        this.wreckedType = wreckedType;

        // Nothing to aim, nothing to upgrade
        this.range = 0;
        this.damage = 0;
        this.fireRate = 0;

        this.age = 0;
        this.skipCanvas2DBodyRender = false;
    }

    update(deltaTime) {
        this.age += deltaTime;
    }

    findTarget() {
        return null;
    }

    render(ctx) {
        const gridSize = this.getTowerSize(ctx);

        // When Pixi owns the pile's body (TowerRenderAdapter has baked it), only the
        // per-frame extras below draw here.
        if (!this.skipCanvas2DBodyRender) {
            this.renderStaticBack(ctx, gridSize);
        }

        this._renderCollapseDust(ctx, gridSize);

        if (this.isSelected) {
            const half = gridSize / 2;
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.75)';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.strokeRect(this.x - half, this.y - half, gridSize, gridSize);
            ctx.restore();
        }
    }

    /** The cloud thrown up as the tower comes down: a few big puffs that swell and thin out. */
    _renderCollapseDust(ctx, gridSize) {
        if (this.age >= COLLAPSE_DUST_SECONDS) return;
        const t = this.age / COLLAPSE_DUST_SECONDS;
        const puffs = [[-0.3, 0.05, 0.4], [0.3, 0.1, 0.38], [0, -0.15, 0.45], [-0.15, 0.3, 0.3], [0.2, -0.3, 0.32], [0.05, 0.2, 0.36]];
        for (const [dx, dy, r] of puffs) {
            ctx.fillStyle = `rgba(185, 168, 138, ${0.55 * (1 - t) * (1 - t)})`;
            ctx.beginPath();
            ctx.arc(
                this.x + dx * gridSize * (1 + t * 0.6),
                this.y + dy * gridSize - t * gridSize * 0.5,
                r * gridSize * (0.5 + t * 0.8),
                0, Math.PI * 2
            );
            ctx.fill();
        }
    }

    /** Strategy A (baked once per campaign, shared by every pile): the heap itself. */
    renderStaticBack(ctx, gridSize) {
        const g = gridSize;
        const cx = this.x;
        const cy = this.y + g * 0.05;

        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + g * 0.2, g * 0.46, g * 0.17, 0, 0, Math.PI * 2);
        ctx.fill();

        // Churned earth the wreck sits in
        const dirt = ctx.createRadialGradient(cx, cy + g * 0.12, g * 0.05, cx, cy + g * 0.12, g * 0.46);
        dirt.addColorStop(0, '#7b6c55');
        dirt.addColorStop(1, 'rgba(96, 82, 62, 0.0)');
        ctx.fillStyle = dirt;
        ctx.beginPath();
        ctx.ellipse(cx, cy + g * 0.12, g * 0.46, g * 0.24, 0, 0, Math.PI * 2);
        ctx.fill();

        // Back to front, so nearer blocks overlap the ones behind them
        const blocks = [
            // [dx, dy, w, h, rotation, base colour]
            [-0.02, -0.14, 0.3, 0.2, 0.15, '#8d8a84'],
            [-0.24, -0.02, 0.28, 0.19, -0.35, '#7d7a75'],
            [0.22, -0.04, 0.26, 0.2, 0.4, '#918e88'],
            [0.02, 0.04, 0.32, 0.21, -0.1, '#a19e97'],
            [-0.3, 0.16, 0.22, 0.15, 0.55, '#77746f'],
            [0.3, 0.15, 0.2, 0.15, -0.5, '#85827c'],
            [-0.08, 0.2, 0.24, 0.16, 0.2, '#96938c'],
            [0.14, 0.24, 0.16, 0.11, -0.3, '#a7a49d'],
        ];
        for (const [dx, dy, w, h, rot, base] of blocks) {
            this._block(ctx, cx + dx * g, cy + dy * g, w * g, h * g, rot, base);
        }

        // Splintered beams poking out of the heap
        this._beam(ctx, cx - 0.06 * g, cy - 0.04 * g, 0.5 * g, 0.06 * g, -0.75);
        this._beam(ctx, cx + 0.12 * g, cy - 0.02 * g, 0.42 * g, 0.055 * g, 0.55);
        this._beam(ctx, cx - 0.2 * g, cy + 0.14 * g, 0.36 * g, 0.05 * g, 0.12);

        // Loose rubble around the edges
        const stones = [[-0.42, 0.22, 0.045], [0.4, 0.24, 0.04], [-0.12, 0.34, 0.035], [0.26, 0.34, 0.04], [-0.36, 0.06, 0.03], [0.44, 0.08, 0.03]];
        for (const [dx, dy, r] of stones) {
            ctx.fillStyle = '#8b8880';
            ctx.beginPath();
            ctx.ellipse(cx + dx * g, cy + dy * g, r * g, r * g * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(40, 36, 30, 0.6)';
            ctx.lineWidth = 0.8;
            ctx.stroke();
        }

        // Dust settled over the top
        ctx.fillStyle = 'rgba(200, 185, 155, 0.22)';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 0.02 * g, g * 0.34, g * 0.13, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    /** One broken masonry block: a lit top face over a darker front. */
    _block(ctx, x, y, w, h, rot, base) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        const dark = 'rgba(0, 0, 0, 0.32)';

        // Front face
        ctx.fillStyle = base;
        ctx.beginPath();
        ctx.moveTo(-w * 0.5, -h * 0.35);
        ctx.lineTo(w * 0.42, -h * 0.5);
        ctx.lineTo(w * 0.5, h * 0.05);
        ctx.lineTo(w * 0.18, h * 0.5);
        ctx.lineTo(-w * 0.46, h * 0.42);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = dark;
        ctx.fill();
        ctx.fillStyle = base;
        // Lit top face, slightly smaller so the darker edge shows below it
        ctx.beginPath();
        ctx.moveTo(-w * 0.5, -h * 0.35);
        ctx.lineTo(w * 0.42, -h * 0.5);
        ctx.lineTo(w * 0.4, -h * 0.02);
        ctx.lineTo(-w * 0.42, h * 0.06);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(40, 36, 30, 0.75)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-w * 0.5, -h * 0.35);
        ctx.lineTo(w * 0.42, -h * 0.5);
        ctx.lineTo(w * 0.5, h * 0.05);
        ctx.lineTo(w * 0.18, h * 0.5);
        ctx.lineTo(-w * 0.46, h * 0.42);
        ctx.closePath();
        ctx.stroke();
        // A crack across the face
        ctx.strokeStyle = 'rgba(30, 27, 22, 0.55)';
        ctx.beginPath();
        ctx.moveTo(-w * 0.1, -h * 0.05);
        ctx.lineTo(w * 0.08, h * 0.14);
        ctx.lineTo(w * 0.02, h * 0.3);
        ctx.stroke();
        ctx.restore();
    }

    /** One snapped timber with a ragged end. */
    _beam(ctx, x, y, len, thick, rot) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.fillStyle = '#6a4a2c';
        ctx.beginPath();
        ctx.moveTo(-len * 0.5, -thick / 2);
        ctx.lineTo(len * 0.5, -thick / 2);
        ctx.lineTo(len * 0.44, -thick * 0.1);
        ctx.lineTo(len * 0.52, thick * 0.2);
        ctx.lineTo(len * 0.46, thick / 2);
        ctx.lineTo(-len * 0.5, thick / 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#2f2114';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 210, 150, 0.25)';
        ctx.beginPath();
        ctx.moveTo(-len * 0.45, -thick * 0.15);
        ctx.lineTo(len * 0.4, -thick * 0.15);
        ctx.stroke();
        ctx.restore();
    }

    /** TowerRenderAdapter convention: nothing animates on a wreck. */
    renderDynamicParts() {
        // intentionally empty
    }

    /** TowerRenderAdapter convention: nothing in front of the heap. */
    renderStaticFront() {
        // intentionally empty
    }

    static getInfo() {
        return {
            name: 'Rubble',
            description: 'All that is left of a tower a Heavy Frog stomped flat. Clear it to build here again.',
            cost: 0,
            icon: ''
        };
    }
}
