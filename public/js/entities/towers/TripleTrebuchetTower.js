import { CannonTower } from './CannonTower.js';

/**
 * Transformed Trebuchet - one windup, three fireballs. Reuses CannonTower's windup/
 * recoil animation, fireball pool and explode() splash logic completely unmodified;
 * only shoot() is overridden to launch three fireballs fanned slightly around the
 * predicted impact point (instead of stacking all three on the exact same spot),
 * widening AoE coverage against a cluster of enemies.
 */
export class TripleTrebuchetTower extends CannonTower {
    // Radians each side shot is rotated away from the center shot's aim point.
    static SPREAD_ANGLES = [-0.22, 0, 0.22];
    static TRANSFORM_COLOR = '#7B2FBE';

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

    renderDynamicParts(ctx, gridSize) {
        super.renderDynamicParts(ctx, gridSize);
        // CannonTower's stone body (see its renderStaticBack) bottoms out exactly at
        // this.y - tuned here to match.
        this.renderTransformBadge(ctx, gridSize, { color: TripleTrebuchetTower.TRANSFORM_COLOR, symbol: 'triorb', groundYFactor: 0.15 });
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
