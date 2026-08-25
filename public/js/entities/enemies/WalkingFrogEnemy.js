import { BaseEnemy } from './BaseEnemy.js';
import { EnemyColorCache, FROG_COLOR_VARIANTS } from '../../utils/EnemyColorCache.js';
import { drawFlipperFoot } from './rendering/FrogFlipperRenderer.js';
import { drawTwoSegmentLimb, computeWalkCycle, kneeFlex, solveLegIK } from './rendering/HumanoidLimbRenderer.js';

/**
 * A huge swamp-matriarch frog that walks on all four IK-driven legs (a real
 * quadruped gait, diagonal pairs alternating) instead of hopping like
 * FrogEnemy/ElementalFrogEnemy, carrying a visible egg sac big enough to
 * plausibly hold the brood that bursts out when she dies (see spawnOnDeath below
 * / EnemyManager._spawnDeathChildren). Deliberately has no particle arrays (no
 * magicParticles etc.) and no jumpAnimationTimer, so EnemyRenderAdapter treats
 * her as Mode A (baked sprite animation) rather than the live-redraw Mode B every
 * other frog uses - worth it here since killing one immediately adds 20 more
 * frogs to the field.
 */
export class WalkingFrogEnemy extends BaseEnemy {
    // Shared cached color-variant lookup (skinColor -> lighten/darken variants).
    static _colors = new EnemyColorCache(FROG_COLOR_VARIANTS);

    static BASE_STATS = {
        health: 2000,
        speed: 30,
        armour: 12,
        magicResistance: 0.4
    };

    constructor(path, health_multiplier = 1.0, speed = null, armour = null, magicResistance = null) {
        const baseStats = WalkingFrogEnemy.BASE_STATS;
        const actualSpeed = speed !== null ? speed : baseStats.speed;
        const actualArmour = armour !== null ? armour : baseStats.armour;
        const actualMagicResistance = magicResistance !== null ? magicResistance : baseStats.magicResistance;

        super(path, baseStats.health * health_multiplier, actualSpeed, actualArmour, actualMagicResistance);

        this.skinColor = this.getRandomSkinColor();
        this.sizeMultiplier = 2.4;

        this.attackDamage = 9;
        this.attackSpeed = 1.0;
        this.lootDropChance = 0.03;

        // Cache for color variations to avoid recalculation
        this.cachedLightenColor = null;
        this.cachedDarkenColor = null;
        this.cachedDarken2Color = null;

        // Killing her bursts the egg sac open - consumed by EnemyManager._spawnDeathChildren,
        // which spawns these at her death position/path progress.
        this.spawnOnDeath = [
            { type: 'frog', count: 20 }
        ];

        // Set by EnemyRenderAdapter once it has synced this enemy via Pixi.
        this.skipCanvas2DBodyRender = false;
    }

    /** Walking cadence (rad/s) fed to computeWalkCycle - slightly heavier/slower than
     *  BasicEnemy's default 8, matching a bulkier egg-laden gait. Also doubles as the
     *  Mode-A bake cycle length (see EnemyRenderAdapter._walkFreq/_bakeFrames). */
    getWalkFrequency() {
        return 6.0;
    }

    /** Per-instance skin color variant, so baked frames don't collide across instances. */
    getRenderVariantKey() {
        return this.skinColor;
    }

    getRandomSkinColor() {
        // Swampier/muddier tones than the common FrogEnemy's bright greens, so a
        // matriarch reads as a distinct, older creature at a glance.
        const skinColors = [
            '#4B5D2E', '#3A4D23', '#5C6B35', '#43522A', '#2F3D1C'
        ];
        return skinColors[Math.floor(Math.random() * skinColors.length)];
    }

    render(ctx) {
        // baseSize depends on ctx.canvas.width (real screen resolution) - computed once
        // here, with a real ctx, and cached on the instance so _syncEnemyPixi
        // (GameplayState) can reuse the exact same value for the Pixi path.
        const baseSize = Math.max(6, Math.min(14, ctx.canvas.width / 150)) * this.sizeMultiplier;
        this._lastRenderSize = baseSize;

        if (!this.skipCanvas2DBodyRender) {
            this.renderDynamicParts(ctx, baseSize);
        }

        for (let i = 0; i < this.hitSplatters.length; i++) {
            this.hitSplatters[i].render(ctx);
        }
    }

    /** No static structure for this enemy - present for EnemyRenderAdapter's uniform convention. */
    renderStaticBack(ctx, size) {
        // intentionally empty
    }

    /** No static structure for this enemy - present for EnemyRenderAdapter's uniform convention. */
    renderStaticFront(ctx, size) {
        // intentionally empty
    }

    /**
     * Strategy A (baked): pose must stay a pure function of animationTime/phaseOffset
     * (not cached from update()) since the bake pass samples renderDynamicParts()
     * directly at many animationTime values without calling update() in between.
     * Any secondary motion (egg-sac jiggle, throat pulse) is driven off `anim.t`
     * itself (integer multiples) rather than an independent frequency, so it still
     * completes a whole number of cycles within the baked walk-cycle window and
     * loops seamlessly instead of jumping at the wrap point.
     */
    renderDynamicParts(ctx, baseSize) {
        const anim = computeWalkCycle(this.animationTime, this.animationPhaseOffset, 6.0);

        if (!this.cachedLightenColor) {
            this.cachedLightenColor = WalkingFrogEnemy._colors.get(this.skinColor, 'lighten');
            this.cachedDarkenColor = WalkingFrogEnemy._colors.get(this.skinColor, 'darken');
            this.cachedDarken2Color = WalkingFrogEnemy._colors.get(this.skinColor, 'darken_body');
        }

        // Shadow - wide and low, matching the sprawled stance's much wider foot
        // spread (feet plant well outside the body silhouette on both sides).
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + baseSize * 0.5, baseSize * 1.05, baseSize * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        // Dampened bob (real walk-cycle bounce, cut to a third) - a low, belly-down
        // crawl should read as grounded, not bouncy.
        ctx.translate(this.x, this.y + anim.bodyBob * 0.35);

        // NOTE: deliberately NOT rotating the whole figure for the "bent over" look -
        // an earlier attempt did that and it dragged the eyes/mouth along with it,
        // reading as a crooked/dizzy face rather than a hunched posture (heads in
        // this codebase are never drawn rotated, for exactly this reason).
        //
        // The original "tall" build (body a portrait-oriented oval, legs hanging
        // nearly straight down directly under narrow hips) read as a bobblehead
        // sitting upright with a scribble of stick-legs hidden underneath it -
        // the legs were mounted almost entirely INSIDE the body's own silhouette,
        // so they had nowhere to be visible. Fixed by widening/flattening the body
        // into a landscape oval and moving every hip OUTSIDE the body's rx, plus a
        // constant outward lateral push on each foot target (`splay` below, added
        // on top of the walk-cycle swing) - so the legs are permanently visible
        // beside the body in a push-up sprawl, not tucked under it. Front/back hip
        // Y was also pulled much closer together (was a 0.47*baseSize gap reading
        // as a long upright torso; now ~0.30) so the torso reads wide, not tall.

        // --- EGG SAC (drawn behind the body, bulging out to the rear/upper) ---
        this.drawEggSac(ctx, baseSize, anim.t);

        // --- MAIN BODY --- flattened and widened landscape oval (was a portrait
        // oval taller than it was wide, reading as an upright sitting posture)
        // sitting low so the belly's edge nearly meets the ground line the legs
        // plant on, for a genuine belly-down crouch.
        if (!this._bodyGradient || this._gradBaseSize !== baseSize || this._gradCtx !== ctx) {
            this._gradCtx = ctx;
            this._gradBaseSize = baseSize;
            this._bodyGradient = ctx.createRadialGradient(-baseSize * 0.12, -baseSize * 0.06, baseSize * 0.15, 0, 0, baseSize * 0.5);
            this._bodyGradient.addColorStop(0, this.cachedLightenColor);
            this._bodyGradient.addColorStop(0.6, this.skinColor);
            this._bodyGradient.addColorStop(1, this.cachedDarken2Color);
        }
        ctx.fillStyle = this._bodyGradient;
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.14, baseSize * 0.6, baseSize * 0.34, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = this.cachedDarken2Color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.14, baseSize * 0.6, baseSize * 0.34, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Belly
        ctx.fillStyle = WalkingFrogEnemy._colors.get(this.skinColor, 'lighten_body');
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.2, baseSize * 0.44, baseSize * 0.24, 0, 0, Math.PI * 2);
        ctx.fill();

        // Strap binding the egg sac on, drawn on top of the body so it visibly
        // crosses over the shoulder instead of disappearing under the body fill.
        ctx.strokeStyle = '#5a4a2a';
        ctx.lineWidth = baseSize * 0.05;
        ctx.beginPath();
        ctx.moveTo(baseSize * 0.22, baseSize * 0.3);
        ctx.lineTo(-baseSize * 0.6, -baseSize * 0.08);
        ctx.stroke();

        // --- BIG LEGS (long, powerful "haunches") - drawn FIRST, before the
        // small pair below, so wherever the two overlap the small pair renders
        // on top and the big pair reads as sitting BEHIND them (further back),
        // regardless of which one is anatomically labeled front/rear. A prior
        // pass drew this pair last (on top of the small pair), which made the
        // bigger, more outward-reaching legs look like they were rendered in
        // front instead. Also trimmed down from earlier passes (shorter segments,
        // thinner limb/foot) so the size gap against the small pair isn't so
        // extreme - the two pairs read as a matched set, not mismatched. ---
        this.drawFrogLeg(ctx, baseSize, -baseSize * 0.55, baseSize * 0.16, {
            legUpper: baseSize * 0.23, legLower: baseSize * 0.23, strideX: baseSize * 0.1,
            splay: baseSize * 0.11, reachRatio: 0.62, liftY: baseSize * 0.12, limbWidth: baseSize * 0.2, footLen: baseSize * 0.3, footWidth: baseSize * 0.16
        }, 1, false, anim);
        this.drawFrogLeg(ctx, baseSize, baseSize * 0.55, baseSize * 0.16, {
            legUpper: baseSize * 0.23, legLower: baseSize * 0.23, strideX: baseSize * 0.1,
            splay: baseSize * 0.11, reachRatio: 0.62, liftY: baseSize * 0.12, limbWidth: baseSize * 0.2, footLen: baseSize * 0.3, footWidth: baseSize * 0.16
        }, -1, true, anim);

        // --- SMALL LEGS (short) - drawn SECOND, on top of the big pair above,
        // so they render in front at any overlap. Hip mounted close to the
        // head/shoulder line (`hipY=0.05`). Diagonal-paired with the big legs
        // above: this-left syncs with big-right, this-right with big-left. ---
        this.drawFrogLeg(ctx, baseSize, -baseSize * 0.4, baseSize * 0.05, {
            legUpper: baseSize * 0.19, legLower: baseSize * 0.19, strideX: baseSize * 0.07,
            splay: baseSize * 0.08, reachRatio: 0.72, liftY: baseSize * 0.06, limbWidth: baseSize * 0.17, footLen: baseSize * 0.24, footWidth: baseSize * 0.14
        }, -1, true, anim);
        this.drawFrogLeg(ctx, baseSize, baseSize * 0.4, baseSize * 0.05, {
            legUpper: baseSize * 0.19, legLower: baseSize * 0.19, strideX: baseSize * 0.07,
            splay: baseSize * 0.08, reachRatio: 0.72, liftY: baseSize * 0.06, limbWidth: baseSize * 0.17, footLen: baseSize * 0.24, footWidth: baseSize * 0.14
        }, 1, false, anim);

        // --- HEAD --- shifted forward (+X) and down (less negative Y) from a
        // plain "sitting upright" position, so the neck reads as reaching forward
        // over the front legs rather than held bolt upright - the "bent over" cue,
        // applied only to the head/face so eyes and mouth stay level and legible
        // (an earlier attempt rotated the whole figure including the face, which
        // read as a crooked/dizzy head instead of a hunched posture). Also sized
        // down slightly and pulled closer to the body (was floating well above a
        // tall torso; now the torso is compact so a same-size head read oversized).
        ctx.save();
        ctx.translate(baseSize * 0.14, baseSize * 0.02);

        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.32, baseSize * 0.42, baseSize * 0.34, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = this.cachedDarken2Color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.32, baseSize * 0.42, baseSize * 0.34, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Head shading
        ctx.fillStyle = 'rgba(0, 0, 0, 0.13)';
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.45, baseSize * 0.34, baseSize * 0.19, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.ellipse(baseSize * 0.05, -baseSize * 0.32, baseSize * 0.22, baseSize * 0.15, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // --- EYES (bulging, alert - no blink: this is Mode A/baked, see class doc) ---
        this.drawEye(ctx, -baseSize * 0.19, -baseSize * 0.47, baseSize);
        this.drawEye(ctx, baseSize * 0.19, -baseSize * 0.47, baseSize);

        // --- THROAT PULSE (tied to anim.t, so it bakes/loops correctly) ---
        const throatPulse = 0.6 + 0.4 * Math.sin(anim.t * 3);
        ctx.fillStyle = WalkingFrogEnemy._colors.get(this.skinColor, 'lighten_body');
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.1, baseSize * 0.13, baseSize * 0.1 * throatPulse, 0, 0, Math.PI * 2);
        ctx.fill();

        // --- MOUTH ---
        ctx.strokeStyle = WalkingFrogEnemy._colors.get(this.skinColor, 'darken_mouth');
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 0.2, baseSize * 0.18, 0, Math.PI);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.16, -baseSize * 0.2);
        ctx.lineTo(baseSize * 0.16, -baseSize * 0.2);
        ctx.stroke();

        // Nostrils
        ctx.fillStyle = WalkingFrogEnemy._colors.get(this.skinColor, 'darken_detail');
        ctx.beginPath();
        ctx.arc(-baseSize * 0.09, -baseSize * 0.39, baseSize * 0.045, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(baseSize * 0.09, -baseSize * 0.39, baseSize * 0.045, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore(); // closes the head-offset save() above

        ctx.restore(); // closes the body-translate save() from the top of this method

        // Health bar — skipped during Mode A baking (adapter draws it separately).
        if (!this._baking) {
            this.renderHealthBar(ctx, baseSize, { widthMul: 2.9, heightMul: 0.36, yOffsetMul: -2.0 });
        }
    }

    drawEye(ctx, x, y, baseSize) {
        ctx.fillStyle = WalkingFrogEnemy._colors.get(this.skinColor, 'darken_eye');
        ctx.beginPath();
        ctx.arc(x, y, baseSize * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFACD';
        ctx.beginPath();
        ctx.arc(x, y, baseSize * 0.14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8B5A2B';
        ctx.beginPath();
        ctx.arc(x, y + baseSize * 0.02, baseSize * 0.09, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + baseSize * 0.02, y - baseSize * 0.01, baseSize * 0.055, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.beginPath();
        ctx.arc(x + baseSize * 0.04, y - baseSize * 0.04, baseSize * 0.025, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * One weight-bearing, IK-driven leg with a flipper foot - shared by all four
     * legs (back-left/right, front-left/right) so the quadruped gait is defined
     * in exactly one place instead of four near-identical copies.
     *
     * @param {number} hipX/hipY  attachment point
     * @param {object} dims  { legUpper, legLower, strideX, splay, reachRatio, liftY, limbWidth, footLen, footWidth }
     * @param {number} swingSign  +1 or -1: which direction this leg's foot moves
     *   for a positive anim.legSwing - use +1/-1 on opposite corners to pair legs
     *   into a diagonal gait (e.g. back-left and front-right both +1).
     * @param {boolean} kneePhaseIsRight  which kneeFlex() phase this leg follows -
     *   again used to pair diagonal legs onto the same knee-bend timing.
     * @param {object} anim  computeWalkCycle() result
     */
    drawFrogLeg(ctx, baseSize, hipX, hipY, dims, swingSign, kneePhaseIsRight, anim) {
        const legColor = WalkingFrogEnemy._colors.get(this.skinColor, 'darken_leg');
        const footColor = WalkingFrogEnemy._colors.get(this.skinColor, 'lighten_foot');
        const footDetail = WalkingFrogEnemy._colors.get(this.skinColor, 'darken_detail');

        // `side` mirrors which half of the body this hip is on, used for the IK
        // knee-bend direction. solveLegIK's kneeSign bends the knee toward -x for
        // +1 and toward +x for -1 (an ABSOLUTE screen direction, not "away from
        // center") - passing a hardcoded sign here previously bent one side's knee
        // inward, across the body, instead of outward.
        //
        // The outward knee BOW comes entirely from `reachRatio` < 1 (the hip-to-
        // foot distance is deliberately short of the leg's full reach, so the IK
        // solver has slack to bend the knee sideways) rather than from moving the
        // foot itself far out to the side. An earlier version added a large
        // constant lateral `splay` to the foot target on top of that slack - which
        // pushed the hip-to-foot distance close to (or past, post-clamp) the leg's
        // full length, forcing the IK to straighten the leg out nearly dead-straight
        // to reach it. That read as long stiff sticks flung outward instead of
        // bent, planted legs - exactly backwards from the intent. `splay` is now
        // just a small stance-width nudge on top of an already-short reach, so it
        // can't erase the bend.
        const side = hipX < 0 ? -1 : 1;
        const groundY = hipY + (dims.legUpper + dims.legLower) * dims.reachRatio;
        const footX = hipX + side * dims.splay + swingSign * anim.legSwing * dims.strideX;
        const footY = groundY - kneeFlex(anim, kneePhaseIsRight) * dims.liftY;
        const angles = solveLegIK(hipX, hipY, footX, footY, dims.legUpper, dims.legLower, -side);
        const leg = drawTwoSegmentLimb(
            ctx, hipX, hipY,
            angles.upperAngle, dims.legUpper, angles.lowerAngle, dims.legLower,
            { limbColor: legColor, padColor: legColor, limbWidth: dims.limbWidth, padRadius: baseSize * 0.1, shadowColor: 'rgba(0,0,0,0.18)' }
        );
        drawFlipperFoot(ctx, leg.endX, leg.endY, angles.lowerAngle, dims.footLen, dims.footWidth, footColor, footDetail);
        return leg;
    }

    /** Translucent egg sac slung on her back - the visual "tell" that killing her
     *  releases a brood (spawnOnDeath). Centered above and behind the body ellipse's
     *  rear-left edge (body spans roughly x=[-0.6, 0.6]*baseSize) so it reads as a
     *  distinct bulge riding on her back rather than being fully painted over by
     *  the body fill that's drawn right after this - and, now that the body is a
     *  low wide oval, high enough (negative cy) to clear the back-left leg's hip
     *  entirely instead of sitting right on top of it. Jiggle is tied to `t`
     *  (integer multiple) so it stays a pure function of the walk phase and
     *  bakes/loops cleanly. */
    drawEggSac(ctx, baseSize, t) {
        const jiggle = 1 + Math.sin(t * 2) * 0.03;
        const cx = -baseSize * 0.62, cy = -baseSize * 0.28;
        const rx = baseSize * 0.4 * jiggle, ry = baseSize * 0.42 * jiggle;

        // Membrane sac
        if (!this._sacGrad || this._sacGradBaseSize !== baseSize || this._sacGradCtx !== ctx) {
            this._sacGradCtx = ctx;
            this._sacGradBaseSize = baseSize;
            this._sacGrad = ctx.createRadialGradient(cx - rx * 0.3, cy - ry * 0.3, rx * 0.1, cx, cy, rx);
            this._sacGrad.addColorStop(0, 'rgba(220, 230, 190, 0.85)');
            this._sacGrad.addColorStop(1, 'rgba(150, 165, 110, 0.75)');
        }
        ctx.fillStyle = this._sacGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(60, 70, 35, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, -0.3, 0, Math.PI * 2);
        ctx.stroke();

        // Individual eggs visible beneath the membrane - a dense cluster so the sac
        // plausibly reads as holding the 20-strong brood spawnOnDeath releases.
        const eggSpots = [
            [-0.15, -0.08], [0.1, -0.15], [0.18, 0.08],
            [-0.05, 0.15], [-0.25, 0.05], [0.02, -0.02],
            [-0.3, -0.18], [0.22, -0.05], [-0.08, 0.28], [0.12, 0.22]
        ];
        for (const [ex, ey] of eggSpots) {
            const px = cx + ex * rx * 1.6, py = cy + ey * ry * 1.6;
            const r = baseSize * 0.08;
            ctx.fillStyle = 'rgba(235, 240, 210, 0.9)';
            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(90, 100, 55, 0.5)';
            ctx.lineWidth = 0.6;
            ctx.stroke();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(px - r * 0.3, py - r * 0.3, r * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
