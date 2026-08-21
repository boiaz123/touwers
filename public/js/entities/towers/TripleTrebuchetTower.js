import { CannonTower } from './CannonTower.js';

/**
 * Transformed Trebuchet - one windup, three fireballs. Reuses CannonTower's windup/
 * recoil animation, fireball pool and explode() splash logic completely unmodified;
 * only shoot() is overridden to launch three fireballs fanned slightly around the
 * predicted impact point (instead of stacking all three on the exact same spot),
 * widening AoE coverage against a cluster of enemies.
 *
 * Visually: a reinforced, visibly larger frame (see SCALE below) built to sling three
 * loads at once instead of one - see renderSlingLoad()'s override - plus the shared
 * "transformed" red hue every transform gets (see TowerRenderAdapter's tint block).
 */
export class TripleTrebuchetTower extends CannonTower {
    // Radians each side shot is rotated away from the center shot's aim point.
    static SPREAD_ANGLES = [-0.22, 0, 0.22];
    static TRANSFORM_COLOR = '#B22222';
    // How much bigger the whole structure (stone tower + trebuchet mechanism) draws
    // than a base CannonTower's - applied to towerSize before handing off to
    // CannonTower's unmodified renderStaticBack/renderDynamicParts (see below), so every
    // dimension in those methods scales together instead of needing its own override.
    static SCALE = 1.25;

    shoot() {
        if (!this.target) return;

        if (this.audioManager) {
            this.audioManager.playSFX('trebuchet-launch');
        }

        const gravity = 250;
        const launchAngle = Math.PI / 6;
        const distEstimate = Math.hypot(this.target.x - this.x, this.target.y - this.y);
        const initialSpeedEstimate = Math.sqrt((distEstimate * gravity) / Math.sin(2 * launchAngle));
        const effectiveSpeedEstimate = initialSpeedEstimate * Math.cos(launchAngle);
        const predicted = this.predictEnemyPosition(this.target, effectiveSpeedEstimate);

        const baseDx = predicted.x - this.x;
        const baseDy = predicted.y - this.y;

        for (const spread of TripleTrebuchetTower.SPREAD_ANGLES) {
            const cos = Math.cos(spread), sin = Math.sin(spread);
            const targetX = this.x + (baseDx * cos - baseDy * sin);
            const targetY = this.y + (baseDx * sin + baseDy * cos);
            this._launchFireballAt(targetX, targetY, gravity, launchAngle);
        }
    }

    _launchFireballAt(targetX, targetY, gravity, launchAngle) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.hypot(dx, dy);
        const initialSpeed = distance > 0 ? Math.sqrt((distance * gravity) / Math.sin(2 * launchAngle)) : 1;
        const flightTime = distance > 0 ? distance / (initialSpeed * Math.cos(launchAngle)) : 0.5;

        const fireball = this._fireballPool.acquire();
        fireball.x = this.x;
        fireball.y = this.y - 25;
        fireball.vx = distance > 0 ? (dx / distance) * initialSpeed * Math.cos(launchAngle) : 0;
        fireball.vy = -initialSpeed * Math.sin(launchAngle);
        fireball.gravity = gravity;
        fireball.flameAnimation = 0;
        fireball.life = flightTime;
        fireball.maxLife = flightTime;
        fireball.targetX = targetX;
        fireball.targetY = targetY;
        this.fireballs.push(fireball);
    }

    /** Strategy A: CannonTower's stone tower, unmodified, just handed a bigger towerSize -
     *  every dimension in that method is towerSize-proportional and anchored at
     *  (this.x, this.y), so scaling the parameter grows the whole structure around the
     *  same footprint instead of needing a rewritten copy. Genuinely different pixels
     *  from the base type, so this bakes under its own name (see
     *  TowerRenderAdapter._bakeClassName's doc). */
    renderStaticBack(ctx, towerSize) {
        super.renderStaticBack(ctx, towerSize * TripleTrebuchetTower.SCALE);
    }

    /** Strategy B: same scaling trick as renderStaticBack, so the trebuchet mechanism
     *  (frame/arm/counterweight/sling) grows to match the bigger platform underneath it
     *  instead of looking undersized on top of a scaled-up base. */
    renderDynamicParts(ctx, towerSize) {
        super.renderDynamicParts(ctx, towerSize * TripleTrebuchetTower.SCALE);
    }

    /** Three fireballs nested in the (now larger) sling pouch instead of CannonTower's
     *  one - see CannonTower.renderSlingLoad's doc for why this is its own overridable
     *  method. Reuses _renderSlingFireball unmodified for each one. */
    renderSlingLoad(ctx, longArmEndX, longArmEndY, armAngle) {
        if (!(this.armPosition > 0.1 && this.armPosition < 1.9)) return;

        // Spaced exactly 2*fireballRadius apart so adjacent balls' edges just touch
        // instead of their centers overlapping into one bigger blob - three ball speaks
        // more clearly as "three" than a single wide smear does.
        ctx.save();
        ctx.translate(longArmEndX, longArmEndY);
        ctx.rotate(armAngle + Math.PI / 8);
        this._renderSlingFireball(ctx, -10, 6);
        this._renderSlingFireball(ctx, 0, 3);
        this._renderSlingFireball(ctx, 10, 6);
        ctx.restore();
    }

    static getInfo() {
        return {
            name: 'Triple Trebuchet',
            description: 'A reinforced throwing arm hurls three fireballs per shot instead of one.',
            cost: 750,
            icon: ''
        };
    }
}
