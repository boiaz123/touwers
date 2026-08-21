import { BarricadeTower } from './BarricadeTower.js';

/**
 * Transformed Barricade Tower - the slow patch is now studded with spikes that chip
 * away at anything standing in it. Reuses BarricadeTower's zone/slow logic completely;
 * _applySlow() is only called once per enemy per frame (BarricadeTower.update() clears
 * _slowedSet before the per-enemy loop each frame), so comparing its size before/after
 * the super() call is a cheap, non-duplicated way to tell "this enemy is actually inside
 * the zone this frame" without re-doing the zone-shape math in _isInZone().
 *
 * Visually: a spiked iron roof over the once-open platform, and every barrel (stored,
 * carried, rolling) swapped for a spiked iron ball - matches the "iron spikes hidden in
 * the rubble" theme instead of relying on a generic badge (see TowerTransformRegistry's
 * doc and TowerRenderAdapter's tint block for the shared "transformed" red hue every
 * transform gets on top of its own bespoke changes).
 */
export class SpikeThrowerTower extends BarricadeTower {
    static TRANSFORM_COLOR = '#B22222';

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

    /** Strategy A: BarricadeTower's foundation/supports/platform, unmodified, plus a
     *  spiked iron roof over what's otherwise an open deck - genuinely different pixels
     *  from the base type, so this bakes under its own name instead of reusing
     *  BarricadeTower's cached texture (see TowerRenderAdapter._bakeClassName's doc). */
    renderStaticBack(ctx, towerSize) {
        super.renderStaticBack(ctx, towerSize);

        const baseHeight = towerSize * 0.18;
        const supportHeight = towerSize * 0.55;
        const platformWidth = (towerSize * 0.5) * 0.9;
        const platformY = this.y - baseHeight - supportHeight;

        const roofBaseY = platformY - 26; // clears the railing knobs (see renderUpperPlatform)
        const roofHalfW = platformWidth / 2 + 5;
        const roofPeakY = roofBaseY - towerSize * 0.2;

        // Iron support pillars holding the roof up off the platform - drawn before the
        // roof so the roof's underside overlaps their tops. Without these the roof used
        // to just float: the platform's own railing (see renderUpperPlatform) tops out
        // around platformY - 20, well short of roofBaseY, and nothing else filled that
        // gap across most of the platform's width.
        const pillarWidth = 4;
        const pillarX = platformWidth / 2 - pillarWidth / 2; // near the platform's outer edge
        ctx.fillStyle = '#4a4a4e';
        ctx.strokeStyle = '#1c1c1e';
        ctx.lineWidth = 1;
        for (const side of [-1, 1]) {
            const px = this.x + side * pillarX;
            ctx.fillRect(px - pillarWidth / 2, roofBaseY, pillarWidth, platformY - roofBaseY);
            ctx.strokeRect(px - pillarWidth / 2, roofBaseY, pillarWidth, platformY - roofBaseY);
        }
        // Rivets down each pillar, matching the roof's own riveted-seam detail
        ctx.fillStyle = '#8a8a90';
        for (const side of [-1, 1]) {
            const px = this.x + side * pillarX;
            for (let k = 0; k < 2; k++) {
                const py = roofBaseY + (platformY - roofBaseY) * (0.3 + k * 0.4);
                ctx.beginPath();
                ctx.arc(px, py, 0.9, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Roof drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.moveTo(this.x + 2, roofPeakY + 2);
        ctx.lineTo(this.x - roofHalfW + 2, roofBaseY + 2);
        ctx.lineTo(this.x + roofHalfW + 2, roofBaseY + 2);
        ctx.closePath();
        ctx.fill();

        // Two shaded iron panels for a simple pitched-roof read
        ctx.beginPath();
        ctx.moveTo(this.x, roofPeakY);
        ctx.lineTo(this.x - roofHalfW, roofBaseY);
        ctx.lineTo(this.x, roofBaseY);
        ctx.closePath();
        ctx.fillStyle = '#5b5b5f';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(this.x, roofPeakY);
        ctx.lineTo(this.x + roofHalfW, roofBaseY);
        ctx.lineTo(this.x, roofBaseY);
        ctx.closePath();
        ctx.fillStyle = '#3d3d40';
        ctx.fill();

        ctx.strokeStyle = '#1c1c1e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x - roofHalfW, roofBaseY);
        ctx.lineTo(this.x, roofPeakY);
        ctx.lineTo(this.x + roofHalfW, roofBaseY);
        ctx.stroke();

        // Riveted seam down the middle of each panel
        ctx.strokeStyle = 'rgba(20, 20, 22, 0.5)';
        ctx.lineWidth = 1;
        ctx.fillStyle = '#8a8a90';
        for (let side = -1; side <= 1; side += 2) {
            const midX = this.x + side * roofHalfW * 0.5;
            const midY = roofBaseY - (roofBaseY - roofPeakY) * 0.5;
            ctx.beginPath();
            ctx.moveTo(this.x, roofPeakY);
            ctx.lineTo(midX, midY);
            ctx.stroke();
            for (let k = 0; k < 3; k++) {
                const t = 0.25 + k * 0.28;
                const rx = this.x + (midX - this.x) * t;
                const ry = roofPeakY + (midY - roofPeakY) * t;
                ctx.beginPath();
                ctx.arc(rx, ry, 0.9, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Spike finial at the peak, tying the roof back to the "spike" theme
        ctx.strokeStyle = '#2a2a2c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(this.x, roofPeakY);
        ctx.lineTo(this.x, roofPeakY - 12);
        ctx.stroke();
        ctx.fillStyle = '#5b5b5f';
        ctx.beginPath();
        ctx.moveTo(this.x, roofPeakY - 16);
        ctx.lineTo(this.x - 2.5, roofPeakY - 10);
        ctx.lineTo(this.x + 2.5, roofPeakY - 10);
        ctx.closePath();
        ctx.fill();
    }

    /** One spiked iron ball - replaces BarricadeTower's barrel everywhere one is drawn
     *  (stored on the platform, carried by a defender, rolling toward the landing spot -
     *  see the three overrides below). Spikes are drawn first so the ball body's fill
     *  covers their base and only the tips read as poking out. */
    _renderSpikeball(ctx, x, y, r) {
        const spikeCount = 7;
        ctx.fillStyle = '#3a3a3a';
        for (let i = 0; i < spikeCount; i++) {
            const angle = (i / spikeCount) * Math.PI * 2;
            const baseX = x + Math.cos(angle) * r * 0.7;
            const baseY = y + Math.sin(angle) * r * 0.7;
            const tipX = x + Math.cos(angle) * r * 1.7;
            const tipY = y + Math.sin(angle) * r * 1.7;
            const perpX = -Math.sin(angle) * r * 0.22;
            const perpY = Math.cos(angle) * r * 0.22;
            ctx.beginPath();
            ctx.moveTo(baseX + perpX, baseY + perpY);
            ctx.lineTo(tipX, tipY);
            ctx.lineTo(baseX - perpX, baseY - perpY);
            ctx.closePath();
            ctx.fill();
        }

        ctx.fillStyle = '#4a4a4e';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1c1c1e';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Metallic highlight
        ctx.fillStyle = 'rgba(220, 220, 230, 0.5)';
        ctx.beginPath();
        ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
    }

    /** Baked (see renderUpperPlatform()'s call site) - the 3 balls stored on the platform. */
    _renderStorageBarrel(ctx, x, y) {
        this._renderSpikeball(ctx, x, y, 5);
    }

    /** Dynamic (see renderDefenders()) - the ball a defender is currently holding. */
    _renderCarriedBarrel(ctx, x, y) {
        this._renderSpikeball(ctx, x, y, 5);
    }

    /** Dynamic (see renderRollingBarrels()) - a ball currently rolling toward the landing
     *  spot; local space, already translated/rotated by the caller. barrel.size matches
     *  BarricadeTower's barrel half-width (8), reused here as the spikeball's radius. */
    _renderRollingBarrel(ctx, barrel) {
        this._renderSpikeball(ctx, 0, 0, barrel.size);
    }

    static getInfo() {
        return {
            name: 'Spike Thrower',
            description: 'Iron spikeballs hidden in the rubble pile bite anything that lingers in the slow zone.',
            cost: 290,
            icon: ''
        };
    }
}
