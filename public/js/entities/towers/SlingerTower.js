import { BasicTower } from './BasicTower.js';

/**
 * Transformed Watch Tower - same rocks, same defenders, three times the throws.
 * The tripled fire rate is the entire mechanic: Tower.update()'s cooldown-driven
 * shoot loop already fires as fast as `1 / this.fireRate` allows, so tripling
 * fireRate here is all that's needed - BasicTower's shoot() logic (aim, rock physics,
 * damage) is reused completely unmodified. Only the defender's own figure is redrawn
 * bigger and more decorated (see renderDefenderFigure below), reading as a veteran
 * throw-master rather than a generic recruit - plus the shared "transformed" red hue
 * every transform gets (see TowerRenderAdapter's tint block).
 */
export class SlingerTower extends BasicTower {
    static TRANSFORM_COLOR = '#B22222';
    // How much bigger the platform/roof draw than a base BasicTower's, so the bigger
    // defender (S in renderDefenderFigure below) actually fits under the roof instead of
    // poking through it - BasicTower's roof is sized for the plain recruit, not this
    // transform's taller figure and helmet plume. Applied to gridSize before handing off
    // to BasicTower's unmodified renderStaticBack (see below), so the whole structure
    // (base/shaft/platform/roof) grows together instead of just the roof looking
    // oversized on an unchanged shaft.
    static PLATFORM_SCALE = 1.35;

    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY);
        this.fireRate = this.fireRate * 3;
    }

    /** Strategy A: BasicTower's watchtower, unmodified, just handed a bigger gridSize -
     *  every dimension in that method is gridSize-proportional and anchored at
     *  (this.x, this.y), so scaling the parameter grows the whole structure around the
     *  same footprint instead of needing a rewritten copy (see TripleTrebuchetTower for
     *  the same trick). Genuinely different pixels from the base type, so this bakes
     *  under its own name (see TowerRenderAdapter._bakeClassName's doc). */
    renderStaticBack(ctx, gridSize) {
        super.renderStaticBack(ctx, gridSize * SlingerTower.PLATFORM_SCALE);
    }

    /** Strategy B (per-instance Graphics, redrawn every frame) - overrides
     *  BasicTower.renderDefenderFigure completely rather than layering on top of it:
     *  scaled up (S below) and with a cape + helmet plume BasicTower's plain recruit
     *  doesn't have. Platform-relative positioning (platformY etc.) uses the SAME scaled
     *  gridSize as renderStaticBack above, so the figure still lands on the actual
     *  (bigger) platform instead of the unscaled one; the figure's own size (S) is a
     *  separate, independent scale. */
    renderDefenderFigure(ctx, gridSize) {
        const scaledGridSize = gridSize * SlingerTower.PLATFORM_SCALE;
        const baseHeight = scaledGridSize * 0.1;
        const towerHeight = scaledGridSize * 0.4;
        const platformHeight = scaledGridSize * 0.06;
        const towerDrawY = this.y + scaledGridSize * 0.12;
        const baseY = towerDrawY;
        const towerY = baseY - baseHeight - towerHeight;
        const platformY = towerY - platformHeight;

        const defenderX = this.x;
        const defenderY = platformY - 10;

        ctx.save();
        ctx.translate(defenderX, defenderY);

        if (this.target) {
            const targetAngle = Math.atan2(this.target.y - defenderY, this.target.x - defenderX);
            ctx.rotate(targetAngle);
        }

        const S = 1.6; // "a little bigger dude" than BasicTower's recruit

        // Cape, trailing behind the facing direction - drawn first so the body/head
        // layer on top of it.
        ctx.fillStyle = '#7a1f1f';
        ctx.beginPath();
        ctx.moveTo(-1.5 * S, -3 * S);
        ctx.lineTo(-5 * S, 2 * S);
        ctx.lineTo(-2.5 * S, 3.5 * S);
        ctx.lineTo(-1 * S, -1 * S);
        ctx.closePath();
        ctx.fill();

        // Body - thicker tunic than the recruit's
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(-2.5 * S, -3.5 * S, 5 * S, 7 * S);

        // Chest plate
        ctx.fillStyle = '#696969';
        ctx.fillRect(-3 * S, -3 * S, 6 * S, 4.5 * S);
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.strokeRect(-3 * S, -3 * S, 6 * S, 4.5 * S);

        // Belt with a buckle - a detail the plain recruit skips
        ctx.fillStyle = '#3d2b1f';
        ctx.fillRect(-3 * S, 1.2 * S, 6 * S, 1 * S);
        ctx.fillStyle = '#c9a227';
        ctx.beginPath();
        ctx.arc(0, 1.7 * S, 0.7 * S, 0, Math.PI * 2);
        ctx.fill();

        // Bigger, rounder shoulder plates
        ctx.fillStyle = '#5a5a5a';
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 0.6;
        for (const side of [-1, 1]) {
            ctx.beginPath();
            ctx.arc(side * 3.6 * S, -3 * S, 1.5 * S, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        // Head and helmet
        ctx.fillStyle = '#DDBEA9';
        ctx.beginPath();
        ctx.arc(0, -6 * S, 2 * S, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#696969';
        ctx.beginPath();
        ctx.arc(0, -6 * S, 2.5 * S, Math.PI, Math.PI * 2);
        ctx.fill();

        // Helmet plume - the recruit's helmet has none
        ctx.strokeStyle = '#8B1E3F';
        ctx.lineWidth = 1.4 * S;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, -8.3 * S);
        ctx.quadraticCurveTo(-2.2 * S, -9.5 * S, -1.2 * S, -11.5 * S);
        ctx.stroke();

        // Arms and throwing animation - same pose logic as BasicTower, scaled up
        ctx.strokeStyle = '#DDBEA9';
        ctx.lineWidth = 2 * S;
        const throwingDefender = this.defenders[0];
        const armAngle = this.target && this.throwingDefender === 0 ?
            -Math.PI / 2 - throwingDefender.armRaised * Math.PI / 3 :
            Math.sin(this.animationTime * 2) * 0.2;

        ctx.beginPath();
        ctx.moveTo(-1 * S, -2 * S);
        ctx.lineTo(-1 * S + Math.cos(armAngle) * 3 * S, -2 * S + Math.sin(armAngle) * 3 * S);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(1 * S, -2 * S);
        ctx.lineTo(2.5 * S, 0);
        ctx.stroke();

        // Rock in hand when ready to throw
        if (throwingDefender.armRaised > 0.5) {
            const rockX = -1 * S + Math.cos(armAngle) * 3.5 * S;
            const rockY = -2 * S + Math.sin(armAngle) * 3.5 * S;
            ctx.fillStyle = '#696969';
            ctx.beginPath();
            ctx.arc(rockX, rockY, 1 * S, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
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
