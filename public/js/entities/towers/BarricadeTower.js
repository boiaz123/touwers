import { Tower } from './Tower.js';
import { ObjectPool } from '../../core/ObjectPool.js';

// A throw is a deliberate grab -> aim -> throw -> recover sequence (see
// _updateDefenderAnimation()) rather than one instant swing, so it reads as a natural
// motion instead of a snap. "throw" (the actual forward release) is intentionally the
// shortest phase - the wind-up either side of it is what sells the weight of the barrel.
const THROW_PHASE_DURATIONS = { grab: 0.5, aim: 0.45, throw: 0.18, recover: 0.4 };

export class BarricadeTower extends Tower {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY);
        this.range = 120; // Max distance from the tower to its fixed rubble-landing spot

        this.defenders = [
            { animPhase: 'idle', animTimer: 0, hasBarrel: true, barrelReloadTimer: 0 },
            { animPhase: 'idle', animTimer: 0, hasBarrel: true, barrelReloadTimer: 0 }
        ];
        this.rollingBarrels = [];
        // Phase 5: reuse barrel objects across throws instead of allocating a fresh literal
        // every time - acquire() at the throw site, release() once a barrel lands.
        this._barrelPool = new ObjectPool(() => ({
            x: 0, y: 0, vx: 0, vy: 0, rotation: 0, rotationSpeed: 0, life: 0,
            targetX: 0, targetY: 0, size: 0
        }));

        // Fixed spot the rubble always lands on, "in front of" the tower - resolved onto
        // the level's path by setPath() (called by TowerManager right after placement) so
        // the rubble actually lands on the road instead of an arbitrary direction. This
        // default (straight below the tower) only matters until setPath() runs.
        this.throwAngle = Math.PI / 2;
        this.rubbleX = x;
        this.rubbleY = y + this.range * 0.6;
        this.roadHalfWidth = 32; // Overwritten by setPath() with the level's actual road width

        // The affected patch hugs the road's shape rather than being a plain circle (see
        // _rebuildCoverage()) - coveragePoints is the resulting strip polyline, rebuilt only
        // when effectRadius actually changes. Falls back to a circle (coveragePoints stays
        // null) if the tower was placed too far from any path to reach it - see setPath().
        this.coveragePoints = null;
        this._coverageRadius = null;
        this._rubbleOnPath = false;
        this._fullPath = null;
        this._pathCumArc = null;
        this._rubbleArc = null;

        // Deterministic rubble/wood/metal debris scattered across the patch, revealed
        // progressively as more barrels land (see landRubble()) - purely cosmetic, doesn't
        // gate the (continuous) slow effect below. stainBlobs is the soft, irregular
        // dirt-stain layer underneath the debris (see _rebuildAtmosphere()).
        this.debrisSlots = [];
        this.debrisRevealed = 0;
        this._maxDebrisSlots = 0;
        this.stainBlobs = [];
        // A deliberate line of debris laid across the road at each END of the patch (see
        // _rebuildBoundaryMarkers()), so the affected stretch of road has a clear start and
        // finish instead of just trailing off into the scattered debris above.
        this.boundaryMarkers = [];
        this.zoneIntensity = 0; // Fades with isDisabled, not with a timer - see update()
        this._landPulse = 0; // Brief cosmetic flash on the newest debris piece when a throw lands

        // Short-lived dust puffs kicked up at the exact moment a barrel lands - the ONLY
        // dust-cloud visual this tower has. An earlier version also had a permanent, always-
        // drifting haze layer sitting over the whole patch at all times; removed because it
        // was needless visual (and render) noise for a zone that's supposed to read as "a
        // pile of rubble", not "a permanent fog bank" - dust only makes sense right after
        // something actually lands.
        this.impactPuffs = [];

        this.effectRadius = 20; // Base slow-patch radius, upgraded at the Tower Forge (max 40px)
        this.slowPercent = 0.65; // Fraction of speed removed while inside the patch, upgraded at Training Grounds

        // Sporadic, randomized throw cadence - purely cosmetic (see throwRubble()/landRubble()):
        // the slow effect itself is always active, this only paces the visual "new rubble
        // gets tossed on the pile" beat so it doesn't fire constantly.
        this.minThrowInterval = 6.0;
        this.maxThrowInterval = 9.0;
        this.throwTimer = this.minThrowInterval + Math.random() * (this.maxThrowInterval - this.minThrowInterval);

        // Store original values for upgrade calculations
        this.originalRange = this.range;
        this.originalEffectRadius = this.effectRadius;
        this.originalSlowPercent = this.slowPercent;

        // Set by TowerRenderAdapter once it has baked/synced this tower's static body via
        // Pixi (barrels/zone/effect-preview still draw here regardless - not migrated yet).
        this.skipCanvas2DBodyRender = false;
    }

    /**
     * Snap the fixed rubble-landing spot onto the level path, so throws actually land on
     * the road instead of an arbitrary direction. Mirrors the nearest-point-on-path logic
     * GuardPost.js already uses to find its own path position, plus records enough of the
     * path's arc-length shape (via cellSize/road width) for _rebuildCoverage() to later
     * carve out a road-hugging strip instead of a plain circle.
     */
    setPath(gamePath, cellSize) {
        if (!gamePath || gamePath.length < 2) return;
        if (cellSize) this.roadHalfWidth = cellSize;

        const cumulativeArc = [0];
        for (let i = 1; i < gamePath.length; i++) {
            cumulativeArc.push(cumulativeArc[i - 1] + Math.hypot(
                gamePath[i].x - gamePath[i - 1].x, gamePath[i].y - gamePath[i - 1].y
            ));
        }

        let closest = null;
        let closestDistance = Infinity;
        let closestSegmentIndex = -1;
        let closestT = 0;

        for (let i = 0; i < gamePath.length - 1; i++) {
            const point = this._nearestPointOnSegment(this.x, this.y, gamePath[i], gamePath[i + 1]);
            const distance = Math.hypot(point.x - this.x, point.y - this.y);
            if (distance < closestDistance) {
                closestDistance = distance;
                closest = point;
                closestSegmentIndex = i;
                closestT = point.t;
            }
        }

        const lastWaypoint = gamePath[gamePath.length - 1];
        const distanceToLast = Math.hypot(lastWaypoint.x - this.x, lastWaypoint.y - this.y);
        if (distanceToLast < closestDistance) {
            closestDistance = distanceToLast;
            closest = { x: lastWaypoint.x, y: lastWaypoint.y };
            closestSegmentIndex = gamePath.length - 1;
            closestT = 1;
        }

        if (!closest) return;

        const dx = closest.x - this.x;
        const dy = closest.y - this.y;
        const distance = Math.hypot(dx, dy) || 1;
        const throwDistance = Math.min(distance, this.range);

        this.throwAngle = Math.atan2(dy, dx);
        this.rubbleX = this.x + (dx / distance) * throwDistance;
        this.rubbleY = this.y + (dy / distance) * throwDistance;

        // Only anchor to the road's shape when the rubble spot actually reaches the path -
        // a tower placed further from the road than its range can't hug a path it never
        // touches, so it falls back to a plain circular patch (see _rebuildCoverage()).
        this._rubbleOnPath = throwDistance >= distance - 0.5;
        if (this._rubbleOnPath) {
            this._fullPath = gamePath;
            this._pathCumArc = cumulativeArc;
            this._rubbleArc = closestSegmentIndex < gamePath.length - 1
                ? cumulativeArc[closestSegmentIndex] + closestT * (cumulativeArc[closestSegmentIndex + 1] - cumulativeArc[closestSegmentIndex])
                : cumulativeArc[cumulativeArc.length - 1];
        } else {
            this._fullPath = null;
            this._pathCumArc = null;
            this._rubbleArc = null;
        }

        // Force the coverage strip + debris layout to rebuild next update() since the
        // anchor moved.
        this._coverageRadius = null;
    }

    _nearestPointOnSegment(px, py, p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const lengthSquared = dx * dx + dy * dy;
        if (lengthSquared === 0) return { x: p1.x, y: p1.y, t: 0 };

        let t = ((px - p1.x) * dx + (py - p1.y) * dy) / lengthSquared;
        t = Math.max(0, Math.min(1, t));
        return { x: p1.x + t * dx, y: p1.y + t * dy, t };
    }

    /**
     * Carve the portion of the level path within effRadius arc-length of the rubble spot
     * into a small polyline (coveragePoints) - the actual road-hugging shape of the slow
     * patch, correctly bending around corners instead of a plain circle. Only called when
     * effRadius changes (Forge upgrade or a resolution change), not every frame.
     */
    _rebuildCoverage(effRadius) {
        if (!this._rubbleOnPath || !this._fullPath) {
            this.coveragePoints = null;
            return;
        }

        const path = this._fullPath;
        const cum = this._pathCumArc;
        const total = cum[cum.length - 1];
        const startArc = Math.max(0, this._rubbleArc - effRadius);
        const endArc = Math.min(total, this._rubbleArc + effRadius);

        const pointAtArc = (arc) => {
            for (let i = 0; i < cum.length - 1; i++) {
                if (arc <= cum[i + 1] + 1e-6) {
                    const segLen = cum[i + 1] - cum[i];
                    const t = segLen > 0 ? Math.max(0, Math.min(1, (arc - cum[i]) / segLen)) : 0;
                    return {
                        x: path[i].x + (path[i + 1].x - path[i].x) * t,
                        y: path[i].y + (path[i + 1].y - path[i].y) * t
                    };
                }
            }
            const last = path[path.length - 1];
            return { x: last.x, y: last.y };
        };

        const points = [pointAtArc(startArc)];
        for (let i = 0; i < path.length; i++) {
            if (cum[i] > startArc + 1e-6 && cum[i] < endArc - 1e-6) {
                points.push({ x: path[i].x, y: path[i].y });
            }
        }
        points.push(pointAtArc(endArc));
        this.coveragePoints = points;
    }

    /**
     * Regenerate the deterministic debris layout - mostly wood planks and nails, with some
     * rubble and scrap metal mixed in. Count scales with effRadius (a bigger, more-upgraded
     * patch reads as visibly busier), positions spread along the coverage strip (or
     * scattered in a circle for the no-path fallback). Uses a seeded hash instead of
     * Math.random() so an upgrade-triggered rebuild doesn't make already-placed pieces jump
     * around. effRadius ranges from ORIGINAL_RADIUS (base) to MAX_RADIUS (max Forge level) -
     * see the constructor.
     */
    _rebuildDebris(effRadius) {
        const baseCount = 6; // at base radius (20px)
        const perPxDensity = 0.5; // reaches 16 pieces at max radius (40px)
        const maxSlots = Math.max(5, Math.round(baseCount + Math.max(0, effRadius - 20) * perPxDensity));

        const totalLen = this.coveragePoints ? this._polylineLength(this.coveragePoints) : effRadius * 2;
        const maxPerp = this.roadHalfWidth * 0.85;

        const slots = [];
        for (let i = 0; i < maxSlots; i++) {
            const along = this._hash(i * 7 + 1) * totalLen;
            const perp = (this._hash(i * 13 + 5) - 0.5) * 2 * maxPerp;
            const sample = this._sampleCoverage(along, perp);
            const typeRoll = this._hash(i * 19 + 3);

            // Mostly wood + nails (the requested "main focus"), rubble and scrap metal mixed in
            const type = typeRoll < 0.4 ? 'wood'
                : typeRoll < 0.65 ? 'nail'
                : typeRoll < 0.85 ? 'rubble'
                : 'metal';

            slots.push({
                x: sample.x,
                y: sample.y,
                type,
                size: 2.2 + this._hash(i * 29 + 11) * 3.2,
                rot: this._hash(i * 31 + 17) * Math.PI * 2
            });
        }

        this.debrisSlots = slots;
        this._maxDebrisSlots = maxSlots;
        this.debrisRevealed = this.debrisSlots.length === 0 || this.debrisRevealed === 0
            ? Math.max(1, Math.round(maxSlots * 0.35))
            : Math.min(this.debrisRevealed, maxSlots);
    }

    /**
     * Regenerate the soft dirt-stain layer underneath the debris - several overlapping
     * soft-edged blobs instead of one uniform-width shape, so the patch's edge reads as an
     * irregular, natural mess rather than a geometric capsule/circle outline.
     */
    _rebuildAtmosphere(effRadius) {
        const totalLen = this.coveragePoints ? this._polylineLength(this.coveragePoints) : effRadius * 2;
        const maxPerp = this.roadHalfWidth * 0.9;

        const stainCount = Math.max(4, Math.round(effRadius * 0.3));
        const stains = [];
        for (let i = 0; i < stainCount; i++) {
            const along = this._hash(i * 41 + 3) * totalLen;
            const perp = (this._hash(i * 43 + 7) - 0.5) * 2 * maxPerp;
            const sample = this._sampleCoverage(along, perp);
            stains.push({
                x: sample.x,
                y: sample.y,
                radius: this.roadHalfWidth * (0.5 + this._hash(i * 47 + 11) * 0.55)
            });
        }
        this.stainBlobs = stains;
    }

    /**
     * A deliberate line of debris laid straight across the road at each end of the
     * coverage strip, so the affected stretch has a clear, readable start and finish
     * instead of just fading into the scattered pile above. Only meaningful when the patch
     * actually hugs the road (coveragePoints) - a circle has no natural start/end, so this
     * is skipped for the no-path fallback.
     */
    _rebuildBoundaryMarkers(effRadius) {
        if (!this.coveragePoints || this.coveragePoints.length < 2) {
            this.boundaryMarkers = [];
            return;
        }

        const totalLen = this._polylineLength(this.coveragePoints);
        const maxPerp = this.roadHalfWidth * 0.9;
        const markersPerEnd = 5;
        const ends = [0, totalLen];

        const markers = [];
        for (let e = 0; e < ends.length; e++) {
            const baseAlong = ends[e];
            for (let i = 0; i < markersPerEnd; i++) {
                const t = i / (markersPerEnd - 1); // spread evenly across the road width
                const perp = (t - 0.5) * 2 * maxPerp;
                const seed = e * 97 + i * 13;
                // A little jitter along the road direction so the row reads as a pile of
                // debris that happens to mark a line, not a ruler-straight CG stripe.
                const along = Math.max(0, Math.min(totalLen, baseAlong + (this._hash(seed + 23) - 0.5) * 6));
                const sample = this._sampleCoverage(along, perp);

                markers.push({
                    x: sample.x,
                    y: sample.y,
                    // Alternating wood/metal reads as a deliberate line rather than random
                    // scatter, unlike the mostly-random type mix used for the pile above.
                    type: i % 2 === 0 ? 'wood' : 'metal',
                    size: 3.4 + this._hash(seed + 11) * 1.2,
                    rot: this._hash(seed + 17) * Math.PI * 2
                });
            }
        }
        this.boundaryMarkers = markers;
    }

    /** Cheap deterministic 0..1 pseudo-random from an integer seed - stable across rebuilds, no Math.random(). */
    _hash(n) {
        const x = Math.sin(n * 12.9898) * 43758.5453;
        return x - Math.floor(x);
    }

    _polylineLength(points) {
        let len = 0;
        for (let i = 0; i < points.length - 1; i++) {
            len += Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
        }
        return len;
    }

    /** Position + tangent at a given distance along the coverage strip, offset perp
     *  perpendicular to it. Falls back to a circular spread around the rubble spot when
     *  there's no path-anchored strip (see setPath()). */
    _sampleCoverage(along, perp) {
        const points = this.coveragePoints;
        if (!points || points.length < 2) {
            const effRadius = this.effectiveEffectRadius ?? this.effectRadius;
            const angle = (along / Math.max(1, effRadius * 2)) * Math.PI * 2;
            const dist = Math.abs(perp);
            return {
                x: this.rubbleX + Math.cos(angle) * dist,
                y: this.rubbleY + Math.sin(angle) * dist,
                tx: -Math.sin(angle), ty: Math.cos(angle)
            };
        }

        let remaining = Math.max(0, along);
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i], p2 = points[i + 1];
            const segDx = p2.x - p1.x, segDy = p2.y - p1.y;
            const segLen = Math.hypot(segDx, segDy);
            const isLast = i === points.length - 2;
            if (remaining <= segLen || isLast) {
                const t = segLen > 0 ? Math.min(1, remaining / segLen) : 0;
                const tx = segLen > 0 ? segDx / segLen : 1;
                const ty = segLen > 0 ? segDy / segLen : 0;
                const x = p1.x + segDx * t;
                const y = p1.y + segDy * t;
                // Perpendicular to (tx, ty) is (-ty, tx)
                return { x: x - ty * perp, y: y + tx * perp, tx, ty };
            }
            remaining -= segLen;
        }
        const last = points[points.length - 1];
        return { x: last.x, y: last.y, tx: 1, ty: 0 };
    }

    /** True if (x, y) falls within the affected patch - the road-hugging strip when the
     *  tower reached the path, otherwise a plain circle around the rubble spot. */
    _isInZone(x, y, effRadius) {
        if (this.coveragePoints && this.coveragePoints.length >= 2) {
            return this._isWithinCoverageStrip(x, y);
        }
        const dx = x - this.rubbleX, dy = y - this.rubbleY;
        return dx * dx + dy * dy <= effRadius * effRadius;
    }

    /**
     * True if (x, y) is within roadHalfWidth of the coverage strip, using FLAT end caps.
     * A plain "distance to nearest point on the polyline" (clamping each segment's own
     * projection to [0,1]) silently rounds the two ends by roadHalfWidth - a point past the
     * strip's actual start/end but still close to the endpoint reads as "in range", which
     * let the slow effect reach visibly further than the debris/boundary markers show. Only
     * the two OUTERMOST ends get the flat-cap treatment; interior joints (bends in the road)
     * still clamp normally, so the strip still curves smoothly around corners.
     */
    _isWithinCoverageStrip(x, y) {
        const points = this.coveragePoints;
        const halfWidthSq = this.roadHalfWidth * this.roadHalfWidth;
        const lastSegment = points.length - 2;

        for (let i = 0; i <= lastSegment; i++) {
            const p1 = points[i], p2 = points[i + 1];
            const dx = p2.x - p1.x, dy = p2.y - p1.y;
            const lengthSquared = dx * dx + dy * dy;
            if (lengthSquared === 0) continue;

            let t = ((x - p1.x) * dx + (y - p1.y) * dy) / lengthSquared;

            if (i === 0 && t < 0) continue; // before the very start of the strip - no cap
            if (i === lastSegment && t > 1) continue; // past the very end - no cap

            t = Math.max(0, Math.min(1, t));
            const px = p1.x + t * dx, py = p1.y + t * dy;
            const ddx = px - x, ddy = py - y;
            if (ddx * ddx + ddy * ddy <= halfWidthSq) return true;
        }
        return false;
    }

    update(deltaTime, enemies) {
        super.update(deltaTime, enemies);
        // Barricade doesn't chase or target enemies - it periodically hurls rubble at a
        // fixed spot in front of it (see setPath()). Clear whatever target the base
        // class's generic scan may have found so nothing else mistakes this tower for one
        // that's aiming.
        this.target = null;

        for (let d = 0; d < this.defenders.length; d++) {
            const defender = this.defenders[d];
            this._updateDefenderAnimation(defender, deltaTime);

            if (!defender.hasBarrel && defender.barrelReloadTimer > 0) {
                defender.barrelReloadTimer -= deltaTime;
                if (defender.barrelReloadTimer <= 0) {
                    defender.hasBarrel = true;
                    defender.barrelReloadTimer = 0;
                }
            }
        }

        // Purely cosmetic: a defender periodically tosses another barrel onto the pile so
        // the tower reads as "doing something" rather than static. This does NOT gate the
        // slow effect below - see the note above _applySlow for why an earlier version that
        // tied slowing to a per-throw timed zone left gaps where nothing was slowed at all.
        if (!this.isDisabled) {
            this.throwTimer -= deltaTime;
            if (this.throwTimer <= 0) {
                this.throwRubble();
                this.throwTimer = this.minThrowInterval + Math.random() * (this.maxThrowInterval - this.minThrowInterval);
            }
        }

        // Update barrels in flight (compact in-place)
        let barrelWrite = 0;
        for (let i = 0; i < this.rollingBarrels.length; i++) {
            const barrel = this.rollingBarrels[i];
            barrel.x += barrel.vx * deltaTime;
            barrel.y += barrel.vy * deltaTime;
            barrel.rotation += barrel.rotationSpeed * deltaTime;
            barrel.life -= deltaTime;

            const distanceToTarget = Math.hypot(barrel.x - barrel.targetX, barrel.y - barrel.targetY);
            if (barrel.life <= 0 || distanceToTarget < 20) {
                this.landRubble();
                this._barrelPool.release(barrel);
            } else {
                this.rollingBarrels[barrelWrite++] = barrel;
            }
        }
        this.rollingBarrels.length = barrelWrite;

        // Update impact smoke puffs kicked up at the moment of landing (compact in-place)
        let puffWrite = 0;
        for (let i = 0; i < this.impactPuffs.length; i++) {
            const puff = this.impactPuffs[i];
            puff.x += puff.vx * deltaTime;
            puff.y += puff.vy * deltaTime;
            puff.vx *= Math.max(0, 1 - deltaTime * 1.5);
            puff.vy *= Math.max(0, 1 - deltaTime * 1.5);
            puff.life -= deltaTime;
            if (puff.life > 0) {
                this.impactPuffs[puffWrite++] = puff;
            }
        }
        this.impactPuffs.length = puffWrite;

        // The patch is a permanent fixture once the tower exists, not a timed pulse tied to
        // the cosmetic throws above - it only fades with the tower's disabled state, so
        // there's never a gap where an enemy standing in it isn't being slowed.
        const targetIntensity = this.isDisabled ? 0 : 1;
        this.zoneIntensity += (targetIntensity - this.zoneIntensity) * Math.min(1, deltaTime * 2);
        this._landPulse = Math.max(0, this._landPulse - deltaTime * 2);

        if (!this._slowedSet) this._slowedSet = new Set();
        this._slowedSet.clear();

        if (!this.isDisabled) {
            const effRadius = this.effectiveEffectRadius ?? this.effectRadius;
            if (this._coverageRadius !== effRadius) {
                this._rebuildCoverage(effRadius);
                this._rebuildDebris(effRadius);
                this._rebuildAtmosphere(effRadius);
                this._rebuildBoundaryMarkers(effRadius);
                this._coverageRadius = effRadius;
            }

            // Broad-phase query circle around the anchor: any point within effRadius
            // arc-length of the anchor (i.e. inside the coverage strip) is also within
            // effRadius+roadHalfWidth straight-line distance of it, since path distance can
            // only be >= straight-line distance - so this is always a safe superset, refined
            // below by the precise _isInZone() check.
            const queryRadius = effRadius + this.roadHalfWidth;
            const slowRate = 1 - Math.pow(0.05, deltaTime);
            // Clamp the target multiplier so a fully-upgraded patch still lets enemies crawl
            // rather than literally stopping them (which could break anything downstream
            // that assumes forward progress).
            const targetMultiplier = Math.max(0.05, 1 - this.slowPercent);

            if (this._spatialGrid) {
                const grid = this._spatialGrid;
                const count = grid.query(this.rubbleX, this.rubbleY, queryRadius);
                const buf = grid._queryBuf;
                for (let i = 0; i < count; i++) {
                    this._applySlow(buf[i], effRadius, targetMultiplier, slowRate);
                }
            } else {
                for (let i = 0; i < enemies.length; i++) {
                    this._applySlow(enemies[i], effRadius, targetMultiplier, slowRate);
                }
            }
        }
        // Speed restoration for enemies that left this tower's patch now happens once,
        // globally, in TowerManager.update() after ALL barricade towers have updated - see
        // TowerManager.js for the full reason (it already reads tower._slowedSet generically).
    }

    _applySlow(enemy, effRadius, targetMultiplier, slowRate) {
        if (!this._isInZone(enemy.x, enemy.y, effRadius)) return;

        if (!enemy.hasOwnProperty('originalSpeed')) {
            enemy.originalSpeed = enemy.speed;
        }
        // Clamp to the enemy's CURRENT speed, never above it - an enemy already slower
        // than this patch's target (frozen by Frost Nova, water-slowed by a Magic Tower)
        // must stay there instead of easing back up toward this patch's weaker slow.
        const targetSpeed = Math.min(enemy.speed, enemy.originalSpeed * targetMultiplier);
        enemy.speed = enemy.speed + (targetSpeed - enemy.speed) * slowRate;
        this._slowedSet.add(enemy);
    }

    /** Kicks off one defender's grab -> aim -> throw -> recover sequence (see
     *  _updateDefenderAnimation()) - the physical barrel itself is only spawned once that
     *  sequence reaches the throw phase (see _releaseBarrel()), not here. */
    throwRubble() {
        const idleDefenders = this.defenders.filter(d => d.animPhase === 'idle');
        if (idleDefenders.length === 0) return; // both mid-throw - next timer tick will retry

        const availableDefenders = idleDefenders.filter(d => d.hasBarrel);
        const pool = availableDefenders.length > 0 ? availableDefenders : idleDefenders;
        const defender = pool[Math.floor(Math.random() * pool.length)];

        defender.animPhase = 'grab';
        defender.animTimer = 0;
        defender.hasBarrel = false;
        defender.barrelReloadTimer = 1.5 + Math.random();
    }

    /** Advances one defender through the grab/aim/throw/recover sequence started by
     *  throwRubble(), carrying leftover time into the next phase so the pacing stays exact
     *  even at low frame rates. */
    _updateDefenderAnimation(defender, deltaTime) {
        if (defender.animPhase === 'idle') return;

        defender.animTimer += deltaTime;
        const duration = THROW_PHASE_DURATIONS[defender.animPhase];
        if (defender.animTimer < duration) return;

        const overflow = defender.animTimer - duration;
        switch (defender.animPhase) {
            case 'grab':
                defender.animPhase = 'aim';
                defender.animTimer = overflow;
                break;
            case 'aim':
                defender.animPhase = 'throw';
                defender.animTimer = overflow;
                this._releaseBarrel();
                break;
            case 'throw':
                defender.animPhase = 'recover';
                defender.animTimer = overflow;
                break;
            case 'recover':
                defender.animPhase = 'idle';
                defender.animTimer = 0;
                break;
        }
    }

    /** Spawns the physical rolling barrel - called right as a defender's throw phase
     *  begins (the moment the arm snaps forward), not when the sequence was first
     *  triggered, so the projectile actually leaves the hand at the visual release point. */
    _releaseBarrel() {
        const rollSpeed = 200;
        const dx = this.rubbleX - this.x;
        const dy = this.rubbleY - this.y;
        const distance = Math.hypot(dx, dy);

        const barrel = this._barrelPool.acquire();
        barrel.x = this.x + Math.cos(this.throwAngle) * 25;
        barrel.y = this.y + Math.sin(this.throwAngle) * 25;
        barrel.vx = distance > 0 ? (dx / distance) * rollSpeed : 0;
        barrel.vy = distance > 0 ? (dy / distance) * rollSpeed : 0;
        barrel.rotation = 0;
        barrel.rotationSpeed = 6;
        barrel.life = distance / rollSpeed + 0.3;
        barrel.targetX = this.rubbleX;
        barrel.targetY = this.rubbleY;
        barrel.size = 8;
        this.rollingBarrels.push(barrel);
    }

    landRubble() {
        // Play impact sound when the barrel hits
        if (this.audioManager) {
            this.audioManager.playSFX('barricade-tower');
        }

        // Cosmetic only - reveal one more piece of the (already-active) debris pile and
        // briefly flash it, so each throw visibly adds "new rubble on the road" instead of
        // gating whether the patch slows enemies.
        if (this.debrisSlots.length > 0 && this.debrisRevealed < this._maxDebrisSlots) {
            this.debrisRevealed++;
        }
        this._landPulse = 1;

        // Short-lived dust burst right at the impact point - the tower's only dust-cloud
        // visual (see the constructor's impactPuffs comment), so it's the one moment this
        // zone actually looks "dusty" instead of the effect being on permanently.
        const puffCount = 5;
        for (let i = 0; i < puffCount; i++) {
            const angle = (i / puffCount) * Math.PI * 2 + Math.random() * 0.8;
            const dist = Math.random() * this.roadHalfWidth * 0.4;
            const life = 0.6 + Math.random() * 0.35;
            this.impactPuffs.push({
                x: this.rubbleX + Math.cos(angle) * dist,
                y: this.rubbleY + Math.sin(angle) * dist,
                vx: Math.cos(angle) * 7,
                vy: Math.sin(angle) * 7 - 5,
                life, maxLife: life,
                size: 3 + Math.random() * 3
            });
        }
    }

    render(ctx) {
        const cellSize = this.getCellSize(ctx);
        const towerSize = cellSize * 2;

        if (!this.skipCanvas2DBodyRender) {
            // The rubble patch sits on the ground, beneath the tower's own elevated
            // platform - drawn first so the platform/supports/defenders correctly occlude
            // it where they overlap, instead of it painting over the tower's structure.
            this.renderGroundEffects(ctx);
            this.renderStaticBack(ctx, towerSize);
            this.renderDynamicParts(ctx, towerSize);
            this.renderProjectiles(ctx);
        }

        if (!this.skipCanvas2DBodyRender) {
            this.renderStaticFront(ctx, towerSize);
        }

        // Not yet migrated - selection-dependent, cheap, always drawn on Canvas2D on top.
        this.renderEffectZonePreview(ctx);
    }

    /** Phase 5: ground-level rubble patch - present so TowerRenderAdapter.sync() can call this through its own Graphics layer, positioned BEHIND the tower's baked static-back sprite (see the `ground` layer's doc comment in TowerRenderAdapter.register()) rather than on top of it like renderProjectiles. */
    renderGroundEffects(ctx) {
        this.renderRubbleZone(ctx);
    }

    /** Phase 5: rolling barrels - present so TowerRenderAdapter.sync() can call this through the same shim used for renderDynamicParts, preserving draw order (body, then projectiles on top). */
    renderProjectiles(ctx) {
        this.renderRollingBarrels(ctx);
    }

    /** Strategy A (baked once per campaign, shared across instances): platform structure + barrel storage. */
    renderStaticBack(ctx, towerSize) {
        // Subtle tower shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(this.x - towerSize * 0.3 + 2, this.y - towerSize * 0.2 + 2, towerSize * 0.6, towerSize * 0.4);

        // Watch tower base platform - more defined structure
        const baseWidth = towerSize * 0.5;
        const baseHeight = towerSize * 0.18;
        const plankHeight = 5;
        const numPlanks = Math.floor(baseHeight / plankHeight);

        // Base platform outline for definition
        ctx.strokeStyle = '#3D2F1F';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - baseWidth/2, this.y - baseHeight, baseWidth, baseHeight);

        for (let i = 0; i < numPlanks; i++) {
            const plankY = this.y - baseHeight + (i * plankHeight);
            const plankOffset = (i % 2) * 2;

            ctx.fillStyle = '#9B6B35';
            ctx.fillRect(this.x - baseWidth/2 + plankOffset, plankY, baseWidth - plankOffset, plankHeight);

            ctx.strokeStyle = '#3D2F1F';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(this.x - baseWidth/2 + plankOffset, plankY, baseWidth - plankOffset, plankHeight);
        }

        this.renderTowerSupports(ctx, baseWidth, baseHeight, towerSize);
        this.renderUpperPlatform(ctx, baseWidth, baseHeight, towerSize);
    }

    /** Strategy B (per-instance Graphics, redrawn every frame): defenders - push-animation/barrel-carrying are continuous per-instance state, not bakeable. */
    renderDynamicParts(ctx, towerSize) {
        const baseHeight = towerSize * 0.18;
        this.renderDefenders(ctx, towerSize * 0.5, baseHeight, towerSize);
    }

    /** Strategy A (baked once per campaign, shared across instances): trees rendered in front so the tower stands behind them. */
    renderStaticFront(ctx, towerSize) {
        this.renderTrees(ctx);
    }

    renderTrees(ctx) {
        // Render vegetation overlapping the tower — uses campaign-appropriate plants
        const treePositions = [
            { x: this.x - 20, y: this.y - 15, size: 50, seed: 3 },
            { x: this.x + 22, y: this.y - 18, size: 48, seed: 1 },
            { x: this.x - 22, y: this.y + 8,  size: 52, seed: 2 },
            { x: this.x + 20, y: this.y + 10, size: 49, seed: 0 }
        ];

        for (let i = 0; i < treePositions.length; i++) {
            const tree = treePositions[i];
            if (ctx.level) {
                ctx.level.renderVegetation(ctx, tree.x, tree.y, tree.size, 0, 0, tree.seed);
            } else {
                this.renderTreeType(ctx, tree.x, tree.y, tree.size, tree.seed % 4);
            }
        }
    }

    renderTreeType(ctx, x, y, size, typeId) {
        switch(typeId) {
            case 0:
                this.renderTreeType1(ctx, x, y, size);
                break;
            case 1:
                this.renderTreeType2(ctx, x, y, size);
                break;
            case 2:
                this.renderTreeType3(ctx, x, y, size);
                break;
            default:
                this.renderTreeType4(ctx, x, y, size);
        }
    }

    renderTreeType1(ctx, x, y, size) {
        const trunkWidth = size * 0.25;
        const trunkHeight = size * 0.5;
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(x, y, trunkWidth * 0.5, trunkHeight);
        ctx.fillStyle = '#0D3817';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.6);
        ctx.lineTo(x + size * 0.35, y - size * 0.1);
        ctx.lineTo(x - size * 0.35, y - size * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.35);
        ctx.lineTo(x + size * 0.3, y + size * 0.05);
        ctx.lineTo(x - size * 0.3, y + size * 0.05);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.15);
        ctx.lineTo(x + size * 0.25, y + size * 0.2);
        ctx.lineTo(x - size * 0.25, y + size * 0.2);
        ctx.closePath();
        ctx.fill();
    }

    renderTreeType2(ctx, x, y, size) {
        const trunkWidth = size * 0.2;
        const trunkHeight = size * 0.4;
        ctx.fillStyle = '#6B4423';
        ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);
        ctx.fillStyle = '#8B5A3C';
        ctx.fillRect(x - trunkWidth * 0.5 + trunkWidth * 0.6, y, trunkWidth * 0.4, trunkHeight);
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.35, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#43A047';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.55, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    renderTreeType3(ctx, x, y, size) {
        const trunkWidth = size * 0.22;
        ctx.fillStyle = '#795548';
        ctx.fillRect(x - trunkWidth * 0.5, y - size * 0.2, trunkWidth, size * 0.6);
        ctx.fillStyle = '#4E342E';
        ctx.beginPath();
        ctx.arc(x + trunkWidth * 0.25, y, trunkWidth * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.arc(x - size * 0.28, y - size * 0.35, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + size * 0.28, y - size * 0.3, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.55, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    renderTreeType4(ctx, x, y, size) {
        const trunkWidth = size * 0.18;
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - trunkWidth * 0.5, y - size * 0.05, trunkWidth, size * 0.45);
        ctx.fillStyle = '#0D3817';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.05);
        ctx.lineTo(x + size * 0.38, y + size * 0.15);
        ctx.lineTo(x - size * 0.38, y + size * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.25);
        ctx.lineTo(x + size * 0.3, y);
        ctx.lineTo(x - size * 0.3, y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.45);
        ctx.lineTo(x + size * 0.2, y - size * 0.15);
        ctx.lineTo(x - size * 0.2, y - size * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#43A047';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.6);
        ctx.lineTo(x + size * 0.12, y - size * 0.45);
        ctx.lineTo(x - size * 0.12, y - size * 0.45);
        ctx.closePath();
        ctx.fill();
    }

    renderTowerSupports(ctx, baseWidth, baseHeight, towerSize) {
        const supportWidth = 8;
        const supportHeight = towerSize * 0.55;

        for (let side = -1; side <= 1; side += 2) {
            const supportX = this.x + side * (baseWidth/2 - supportWidth/2);

            ctx.fillStyle = '#704226';
            ctx.fillRect(supportX, this.y - baseHeight - supportHeight, supportWidth, supportHeight);

            // Strong outline for definition
            ctx.strokeStyle = '#3D2F1F';
            ctx.lineWidth = 2;
            ctx.strokeRect(supportX, this.y - baseHeight - supportHeight, supportWidth, supportHeight);

            // Cross braces - more prominent
            ctx.strokeStyle = '#5D4E37';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(supportX, this.y - baseHeight - supportHeight * 0.7);
            ctx.lineTo(supportX + supportWidth, this.y - baseHeight - supportHeight * 0.3);
            ctx.moveTo(supportX + supportWidth, this.y - baseHeight - supportHeight * 0.7);
            ctx.lineTo(supportX, this.y - baseHeight - supportHeight * 0.3);
            ctx.stroke();

            // Metal binding points
            ctx.fillStyle = '#1F1F1F';
            const bindY1 = this.y - baseHeight - supportHeight * 0.3;
            ctx.beginPath();
            ctx.arc(supportX + supportWidth/2, bindY1, 2.5, 0, Math.PI * 2);
            ctx.fill();
            const bindY2 = this.y - baseHeight - supportHeight * 0.7;
            ctx.beginPath();
            ctx.arc(supportX + supportWidth/2, bindY2, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderUpperPlatform(ctx, baseWidth, baseHeight, towerSize) {
        const supportHeight = towerSize * 0.55;
        const platformWidth = baseWidth * 0.9;
        const platformHeight = 10;
        const platformY = this.y - baseHeight - supportHeight;

        // Platform outline
        ctx.strokeStyle = '#3D2F1F';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - platformWidth/2, platformY, platformWidth, platformHeight);

        const platformPlanks = 5;
        const plankWidth = platformWidth / platformPlanks;

        for (let i = 0; i < platformPlanks; i++) {
            const plankX = this.x - platformWidth/2 + (i * plankWidth);

            ctx.fillStyle = '#CD853F';
            ctx.fillRect(plankX, platformY, plankWidth, platformHeight);

            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 1;
            ctx.strokeRect(plankX, platformY, plankWidth, platformHeight);
        }

        // Platform railings - more structural
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 4;
        for (let side = -1; side <= 1; side += 2) {
            const railX = this.x + side * platformWidth/2;

            ctx.beginPath();
            ctx.moveTo(railX, platformY);
            ctx.lineTo(railX, platformY - 20);
            ctx.stroke();

            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(railX, platformY - 15);
            ctx.lineTo(railX - side * 15, platformY - 15);
            ctx.moveTo(railX, platformY - 8);
            ctx.lineTo(railX - side * 12, platformY - 8);
            ctx.stroke();

            ctx.fillStyle = '#5D4E37';
            ctx.fillRect(railX - 1.5, platformY - 22, 3, 4);
        }

        // Ammunition storage on platform - factored into its own per-piece method (see
        // _renderStorageBarrel()) so a transform that throws something other than barrels
        // (e.g. SpikeThrowerTower's spikeballs) can swap just this piece.
        for (let i = 0; i < 3; i++) {
            const pieceX = this.x - platformWidth/3 + (i * platformWidth/4);
            const pieceY = platformY - 8;
            this._renderStorageBarrel(ctx, pieceX, pieceY);
        }
    }

    /** One stored barrel on the upper platform (see renderUpperPlatform()) - baked as part
     *  of the static back layer, so this must stay a pure function of (x, y) with no
     *  per-instance/animated state. */
    _renderStorageBarrel(ctx, x, y) {
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.fillRect(x - 4, y - 6, 8, 12);
        ctx.strokeRect(x - 4, y - 6, 8, 12);

        // Barrel bands
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 4, y - 2);
        ctx.lineTo(x + 4, y - 2);
        ctx.moveTo(x - 4, y + 2);
        ctx.lineTo(x + 4, y + 2);
        ctx.stroke();
    }

    renderDefenders(ctx, baseWidth, baseHeight, towerSize) {
        const supportHeight = towerSize * 0.55;
        const platformWidth = baseWidth * 0.9;
        const platformHeight = 10;
        const platformY = this.y - baseHeight - supportHeight;

        for (let dIdx = 0; dIdx < this.defenders.length; dIdx++) {
            const defender = this.defenders[dIdx];
            const index = dIdx;
            ctx.save();

            const defenderX = this.x + (index === 0 ? -15 : 15);
            const defenderY = platformY - 5;

            ctx.translate(defenderX, defenderY);
            // A slight dip while bending down to grab the barrel (see
            // _defenderBodyOffset()) - 0 for every other phase, so it doesn't affect the
            // resting pose or the aim/throw/recover phases at all.
            ctx.translate(0, this._defenderBodyOffset(defender));

            // Defender body - blue tunic
            ctx.fillStyle = '#4169E1';
            ctx.fillRect(-3, -8, 6, 12);

            // Defender head
            ctx.fillStyle = '#DDBEA9';
            ctx.beginPath();
            ctx.arc(0, -12, 3, 0, Math.PI * 2);
            ctx.fill();

            // Helmet
            ctx.fillStyle = '#696969';
            ctx.beginPath();
            ctx.arc(0, -12, 3.5, Math.PI, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#DDBEA9';
            ctx.lineWidth = 3;

            this._renderDefenderArms(ctx, defender);

            ctx.restore();
        }
    }

    /** A small down-then-up dip (like bending at the knees) while a defender reaches for a
     *  barrel - only during the grab phase, 0 the rest of the sequence including idle. */
    _defenderBodyOffset(defender) {
        if (defender.animPhase !== 'grab') return 0;
        const t = this._easeInOut(this._phaseProgress(defender));
        return Math.sin(t * Math.PI) * 2.5;
    }

    /** Draws both arms for one defender. The idle (non-throwing) arm stays in its relaxed
     *  resting position for the whole sequence - only the active arm moves, driven by
     *  _defenderArmPose(). Pointing it toward this tower's throwAngle only happens during
     *  aim/throw, when it's literally reaching toward where the barrel is about to go -
     *  the plain idle pose is deliberately fixed instead, so defenders never look like
     *  they're reaching at odd angles just because of which way this tower's road runs. */
    _renderDefenderArms(ctx, defender) {
        if (defender.animPhase === 'idle') {
            ctx.beginPath();
            ctx.moveTo(0, -5);
            ctx.lineTo(-3, -1);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, -5);
            ctx.lineTo(3, -1);
            ctx.stroke();
            return;
        }

        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(-4, -1);
        ctx.stroke();

        const pose = this._defenderArmPose(defender);
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(pose.x, pose.y);
        ctx.stroke();

        if (pose.showBarrel) {
            this._renderCarriedBarrel(ctx, pose.x, pose.y);
        }
    }

    /** Hand position (in the defender's local space, from the shoulder at (0,-5)) and
     *  whether a barrel is currently gripped, keyframed per animation phase so each phase
     *  starts exactly where the previous one ended: rest -> grab (reach down to the
     *  platform's barrel rack) -> aim (lift the barrel and draw it back opposite the throw
     *  direction) -> throw (snap forward along throwAngle - the barrel itself is released
     *  at the start of this phase, see _releaseBarrel()) -> recover (ease the empty arm
     *  back to rest). */
    _defenderArmPose(defender) {
        const rest = { x: 3, y: -1 };
        const grabbed = { x: 2, y: 4 };
        const drawnBack = {
            x: Math.cos(this.throwAngle + Math.PI) * 5,
            y: -7 + Math.sin(this.throwAngle + Math.PI) * 3
        };
        const extended = {
            x: Math.cos(this.throwAngle) * 13,
            y: -5 + Math.sin(this.throwAngle) * 13
        };
        const t = this._phaseProgress(defender);

        switch (defender.animPhase) {
            case 'grab': {
                const e = this._easeInOut(t);
                // Only actually gripping the barrel once the reach is mostly complete, not
                // from the very start of the bend.
                return { x: this._lerp(rest.x, grabbed.x, e), y: this._lerp(rest.y, grabbed.y, e), showBarrel: e > 0.55 };
            }
            case 'aim': {
                const e = this._easeInOut(t);
                return { x: this._lerp(grabbed.x, drawnBack.x, e), y: this._lerp(grabbed.y, drawnBack.y, e), showBarrel: true };
            }
            case 'throw': {
                const e = this._easeOut(t);
                return { x: this._lerp(drawnBack.x, extended.x, e), y: this._lerp(drawnBack.y, extended.y, e), showBarrel: false };
            }
            case 'recover': {
                const e = this._easeInOut(t);
                return { x: this._lerp(extended.x, rest.x, e), y: this._lerp(extended.y, rest.y, e), showBarrel: false };
            }
            default:
                return { x: rest.x, y: rest.y, showBarrel: false };
        }
    }

    _phaseProgress(defender) {
        const duration = THROW_PHASE_DURATIONS[defender.animPhase];
        return duration ? Math.min(1, defender.animTimer / duration) : 1;
    }

    _lerp(a, b, t) { return a + (b - a) * t; }

    _easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

    _easeOut(t) { return 1 - Math.pow(1 - t, 3); }

    /** The barrel a defender is currently holding, at a fixed spot relative to their own
     *  local (translated) origin - see the resting-pose note in renderDefenders(). */
    _renderCarriedBarrel(ctx, x, y) {
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.fillRect(x - 4, y - 6, 8, 12);
        ctx.strokeRect(x - 4, y - 6, 8, 12);

        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 4, y - 2);
        ctx.lineTo(x + 4, y - 2);
        ctx.moveTo(x - 4, y + 2);
        ctx.lineTo(x + 4, y + 2);
        ctx.stroke();
    }

    renderRollingBarrels(ctx) {
        for (let i = 0; i < this.rollingBarrels.length; i++) {
            const barrel = this.rollingBarrels[i];
            ctx.save();
            ctx.translate(barrel.x, barrel.y);
            ctx.rotate(barrel.rotation);
            this._renderRollingBarrel(ctx, barrel);
            ctx.restore();
        }
    }

    /** One barrel currently rolling toward the landing spot (see _releaseBarrel()) - local
     *  space, already translated/rotated to the barrel's position by renderRollingBarrels().
     *  Factored out so a transform that throws something else (e.g. SpikeThrowerTower's
     *  spikeballs) can swap just this piece. */
    _renderRollingBarrel(ctx, barrel) {
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.fillRect(-barrel.size, -barrel.size, barrel.size * 2, barrel.size * 2);
        ctx.strokeRect(-barrel.size, -barrel.size, barrel.size * 2, barrel.size * 2);

        // Barrel bands
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-barrel.size, -barrel.size/3);
        ctx.lineTo(barrel.size, -barrel.size/3);
        ctx.moveTo(-barrel.size, barrel.size/3);
        ctx.lineTo(barrel.size, barrel.size/3);
        ctx.stroke();
    }

    /** Active slow-patch visual: mainly a pile of debris - wood planks, nails, rubble and
     *  scrap metal (denser the more the radius is upgraded, revealed piece by piece as
     *  throws land) - scattered over a soft, irregular dirt stain, plus a short dust burst
     *  right after each throw lands. The debris is the focal point, not the patch's outline. */
    renderRubbleZone(ctx) {
        if (this.zoneIntensity < 0.01) return;

        const alpha = this.zoneIntensity;
        const pulse = this._landPulse;

        this._renderCoverageStain(ctx, alpha);
        this._renderImpactPuffs(ctx);

        for (let i = 0; i < this.debrisRevealed && i < this.debrisSlots.length; i++) {
            const isNewest = i === this.debrisRevealed - 1;
            this._renderDebrisPiece(ctx, this.debrisSlots[i], alpha, isNewest ? pulse : 0);
        }

        // Start/finish line markers on top, so the patch's actual extent along the road
        // always reads clearly regardless of how the scattered debris above has filled in.
        this._renderBoundaryMarkers(ctx, alpha);
    }

    /** The start/finish line of debris marking each end of the coverage strip (see
     *  _rebuildBoundaryMarkers()) - always fully shown, not revealed progressively like the
     *  scattered pile, since its whole point is to give the patch a clear, immediate edge. */
    _renderBoundaryMarkers(ctx, alpha) {
        for (let i = 0; i < this.boundaryMarkers.length; i++) {
            this._renderDebrisPiece(ctx, this.boundaryMarkers[i], alpha, 0);
        }
    }

    /** Several overlapping soft-edged dirt blobs (see _rebuildAtmosphere()) instead of one
     *  uniform-width shape, so the ground beneath the debris reads as an irregular, natural
     *  mess rather than a geometric capsule/circle.
     *
     *  Approximated with flat alpha-blended circles instead of a radial gradient (compare
     *  MagicTower's window-glow comment in its renderDynamicParts) - a FillGradient rebuilt
     *  every ~33ms redraw allocates a real GPU texture each time it's recreated (see
     *  CanvasGraphicsShim's createRadialGradient doc), and this zone is a PERMANENT fixture
     *  redrawn on every sync() for as long as the tower exists, with up to a dozen blobs -
     *  this was the actual source of the frame-rate hit from placing several Barricade
     *  towers (or their transform, Spike Thrower, which inherits this unchanged). Flat
     *  circle fills cost nothing comparable. */
    _renderCoverageStain(ctx, alpha) {
        for (let i = 0; i < this.stainBlobs.length; i++) {
            const b = this.stainBlobs[i];
            ctx.fillStyle = `rgba(72, 56, 40, ${alpha * 0.14})`;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(72, 56, 40, ${alpha * 0.3})`;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius * 0.55, 0, Math.PI * 2);
            ctx.fill();
        }
    }


    /** Short-lived smoke burst kicked up at the exact moment a barrel lands (see
     *  landRubble()) - separate from the persistent haze above, which is always there. Flat
     *  concentric circles instead of a radial gradient - see _renderCoverageStain's doc
     *  above (impact puffs are shorter-lived and fewer, but still recreated every redraw
     *  for their whole ~1s life, so the same GPU-texture-churn cost applied here too). */
    _renderImpactPuffs(ctx) {
        for (let i = 0; i < this.impactPuffs.length; i++) {
            const puff = this.impactPuffs[i];
            const t = Math.max(0, puff.life / puff.maxLife);
            const r = puff.size * (1 + (1 - t) * 2.5);
            const baseAlpha = t * 0.5;
            ctx.fillStyle = `rgba(200, 195, 185, ${baseAlpha * 0.4})`;
            ctx.beginPath();
            ctx.arc(puff.x, puff.y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(200, 195, 185, ${baseAlpha})`;
            ctx.beginPath();
            ctx.arc(puff.x, puff.y, r * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /** The main visual focus: wood planks, nails, rubble and scrap metal, scattered across
     *  the patch (see _rebuildDebris() for the deterministic layout). */
    _renderDebrisPiece(ctx, piece, alpha, pulseBoost) {
        const a = Math.min(1, alpha + pulseBoost * 0.3);
        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.rot);

        if (piece.type === 'wood') {
            const w = piece.size * 2.4, h = piece.size * 0.85;
            ctx.fillStyle = `rgba(107, 71, 35, ${a * 0.92})`;
            ctx.fillRect(-w / 2, -h / 2, w, h);
            ctx.strokeStyle = `rgba(58, 38, 18, ${a * 0.7})`;
            ctx.lineWidth = 0.6;
            ctx.strokeRect(-w / 2, -h / 2, w, h);
            // Wood grain
            ctx.strokeStyle = `rgba(58, 38, 18, ${a * 0.4})`;
            ctx.lineWidth = 0.4;
            ctx.beginPath();
            ctx.moveTo(-w / 2 + 1, -h * 0.15);
            ctx.lineTo(w / 2 - 1, -h * 0.15);
            ctx.moveTo(-w / 2 + 1, h * 0.2);
            ctx.lineTo(w / 2 - 1, h * 0.2);
            ctx.stroke();
        } else if (piece.type === 'nail') {
            const len = piece.size * 2.2;
            ctx.strokeStyle = `rgba(95, 92, 88, ${a * 0.85})`;
            ctx.lineWidth = Math.max(0.8, piece.size * 0.3);
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-len / 2, 0);
            ctx.lineTo(len / 2 - piece.size * 0.3, 0);
            ctx.stroke();
            // Nail head
            ctx.fillStyle = `rgba(70, 68, 64, ${a * 0.9})`;
            ctx.beginPath();
            ctx.arc(-len / 2, 0, piece.size * 0.32, 0, Math.PI * 2);
            ctx.fill();
            // Tip glint
            ctx.strokeStyle = `rgba(210, 205, 195, ${a * 0.45})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(len / 2 - piece.size * 0.6, -0.4);
            ctx.lineTo(len / 2 - piece.size * 0.3, 0);
            ctx.stroke();
        } else if (piece.type === 'metal') {
            const s = piece.size * 1.6;
            ctx.fillStyle = `rgba(60, 60, 65, ${a * 0.9})`;
            ctx.strokeStyle = `rgba(20, 20, 22, ${a * 0.7})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(-s / 2, -s / 3);
            ctx.lineTo(s / 3, -s / 2);
            ctx.lineTo(s / 2, s / 3);
            ctx.lineTo(-s / 3, s / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = `rgba(200, 200, 210, ${a * 0.45})`;
            ctx.beginPath();
            ctx.moveTo(-s / 2, -s / 3);
            ctx.lineTo(s / 3, -s / 2);
            ctx.lineTo(0, -s / 6);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillStyle = `rgba(105, 105, 105, ${a * 0.9})`;
            ctx.strokeStyle = `rgba(55, 55, 55, ${a * 0.55})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.arc(0, 0, piece.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = `rgba(160, 160, 160, ${a * 0.45})`;
            ctx.beginPath();
            ctx.arc(-piece.size * 0.3, -piece.size * 0.3, piece.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    _strokePolyline(ctx, points) {
        if (points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        ctx.stroke();
    }

    /** Selection-time preview: the tower doesn't aim at enemies, so a range circle around
     *  the tower body would be misleading. Show where and how big the AoE actually is
     *  instead - the same road-hugging strip (or circle fallback) used by the live effect,
     *  sized to the current effect radius. Uses the same green as every other tower's
     *  selection/range indicator (see Tower.renderAttackRadiusCircle) rather than the
     *  debris patch's own earth tones, since this is a UI aid, not world flavor. */
    renderEffectZonePreview(ctx) {
        if (!this.isSelected) return;

        ctx.strokeStyle = 'rgba(100, 200, 100, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.rubbleX, this.rubbleY);
        ctx.stroke();

        if (this.coveragePoints && this.coveragePoints.length >= 2) {
            // Flat end caps (not round) so this preview's visible extent matches
            // _isWithinCoverageStrip()'s actual flat-capped hitbox exactly - a rounded cap
            // here would preview a larger area than what actually gets slowed. Interior
            // joints (bends in the road) still round smoothly via lineJoin.
            ctx.save();
            ctx.lineCap = 'butt';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = 'rgba(100, 200, 100, 0.35)';
            ctx.lineWidth = this.roadHalfWidth * 2;
            this._strokePolyline(ctx, this.coveragePoints);
            ctx.strokeStyle = 'rgba(100, 200, 100, 0.7)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([5, 5]);
            this._strokePolyline(ctx, this.coveragePoints);
            ctx.restore();
            ctx.setLineDash([]);
        } else {
            const radius = this.effectiveEffectRadius ?? this.effectRadius;
            ctx.strokeStyle = 'rgba(100, 200, 100, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.rubbleX, this.rubbleY, radius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(100, 200, 100, 0.4)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.rubbleX, this.rubbleY, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    static getInfo() {
        return {
            name: 'Barricade Tower',
            description: 'Defenders keep a permanent patch of rubble piled on the road ahead, continuously slowing every enemy standing in it. Patch size grows at the Tower Forge; slow strength grows at Training Grounds.',
            damage: 'None',
            range: '120',
            fireRate: 'Sporadic',
            cost: 90,
            icon: ''
        };
    }
}
