import { BarricadeTower } from './BarricadeTower.js';

/**
 * Transformed Barricade Tower - the slow patch is now studded with spikes that chip
 * away at anything standing in it. Reuses BarricadeTower's zone/slow logic completely;
 * _applySlow() is only called once per enemy per frame (BarricadeTower.update() clears
 * _slowedSet before the per-enemy loop each frame), so comparing its size before/after
 * the super() call is a cheap, non-duplicated way to tell "this enemy is actually inside
 * the zone this frame" without re-doing the zone-shape math in _isInZone().
 */
export class SpikeThrowerTower extends BarricadeTower {
    static TRANSFORM_COLOR = '#CC5500';

    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY);
        this.zoneDamage = 8;
        this.zoneTickInterval = 1.5;
        this._zoneDamageTimers = new Map(); // enemy -> seconds elapsed since last tick
    }

    update(deltaTime, enemies) {
        this._currentDeltaTime = deltaTime;
        super.update(deltaTime, enemies);

        // Drop timers for enemies that left the zone this frame, so damage only ever
        // applies while an enemy is actually standing in the patch - not a lingering DoT.
        for (const enemy of this._zoneDamageTimers.keys()) {
            if (!this._slowedSet.has(enemy)) {
                this._zoneDamageTimers.delete(enemy);
            }
        }
    }

    _applySlow(enemy, effRadius, targetMultiplier, slowRate) {
        const sizeBefore = this._slowedSet.size;
        super._applySlow(enemy, effRadius, targetMultiplier, slowRate);
        if (this._slowedSet.size === sizeBefore) return; // not actually in the zone this frame

        let elapsed = (this._zoneDamageTimers.get(enemy) || 0) + (this._currentDeltaTime || 0);
        if (elapsed >= this.zoneTickInterval) {
            enemy.takeDamage(this.zoneDamage, 0, 'physical', true);
            elapsed -= this.zoneTickInterval;
        }
        this._zoneDamageTimers.set(enemy, elapsed);
    }

    renderDynamicParts(ctx, gridSize) {
        super.renderDynamicParts(ctx, gridSize);
        // BarricadeTower's foundation (see its renderStaticBack) bottoms out exactly at
        // this.y - tuned here to match.
        this.renderTransformBadge(ctx, gridSize, { color: SpikeThrowerTower.TRANSFORM_COLOR, symbol: 'spike', groundYFactor: 0.15, badgeYFactor: -0.15 });
    }

    static getInfo() {
        return {
            name: 'Spike Thrower',
            description: 'Iron spikes hidden in the rubble pile bite anything that lingers in the slow zone.',
            cost: 290,
            icon: ''
        };
    }
}
