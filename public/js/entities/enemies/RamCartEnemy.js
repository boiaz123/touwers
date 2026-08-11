import { BaseEnemy } from './BaseEnemy.js';
import { darkenColor, lightenColor } from '../../utils/colorUtils.js';
import { drawTaperedPath } from './TaperedShapeRenderer.js';

/**
 * A real siege mantlet - open timber-frame shed on wheels, peaked shingle roof,
 * an iron-shod ram log chained beneath the ridge running its full length out to
 * a bronze ram-head, with the crew visible pushing inside the open sides. It has
 * no limbs of its own (rolls on two wheels), so it has no PARTICLE_FIELDS arrays
 * and no jumpAnimationTimer - EnemyRenderAdapter therefore treats it as Mode A
 * (baked sprite animation), same tier of cost as BasicEnemy/BeefyEnemy despite
 * the extra visual detail, which matters since breaking one open immediately
 * adds 20 more enemies to the field (see spawnOnDeath below /
 * EnemyManager._spawnDeathChildren).
 */
export class RamCartEnemy extends BaseEnemy {
    static BASE_STATS = {
        health: 1100,
        speed: 30,
        armour: 50,
        magicResistance: 0
    };

    constructor(path, health_multiplier = 1.0, speed = null, armour = null, magicResistance = null) {
        const baseStats = RamCartEnemy.BASE_STATS;
        const actualSpeed = speed !== null ? speed : baseStats.speed;
        const actualArmour = armour !== null ? armour : baseStats.armour;
        const actualMagicResistance = magicResistance !== null ? magicResistance : baseStats.magicResistance;

        super(path, baseStats.health * health_multiplier, actualSpeed, actualArmour, actualMagicResistance);

        this.woodColor = this.getRandomWoodColor();
        this.roofColor = '#AD9A66';
        this.sizeMultiplier = 1.9;

        this.attackDamage = 22;
        this.attackSpeed = 0.6;
        this.attackRange = 36;
        this.lootDropChance = 0.05;

        // Breaking the cart open unleashes the raiding party it was smuggling toward
        // the castle - consumed by EnemyManager._spawnDeathChildren on death, which
        // spawns these at the cart's death position/path progress.
        this.spawnOnDeath = [
            { type: 'basic', count: 19 },
            { type: 'beefyenemy', count: 1 }
        ];

        // Set by EnemyRenderAdapter once it has synced this enemy via Pixi.
        this.skipCanvas2DBodyRender = false;
    }

    /** Wheel rotation rate (rad/s). Also doubles as the Mode-A bake cycle length
     *  (see EnemyRenderAdapter._walkFreq/_bakeFrames) - a full 2π turn of the wheel
     *  is inherently seamless to loop, so baking exactly one rotation into 16 frames
     *  plays back as smooth continuous rolling regardless of the cart's real speed. */
    getWalkFrequency() {
        return 4.2;
    }

    /** Per-instance wood color variant, so baked frames don't collide across carts. */
    getRenderVariantKey() {
        return this.woodColor;
    }

    getRandomWoodColor() {
        const woodColors = ['#8B5A2B', '#7A4A22', '#6B3F1D', '#96622F'];
        return woodColors[Math.floor(Math.random() * woodColors.length)];
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
     * Strategy A (baked): only runs live during Mode A's one-time bake pass
     * (EnemyRenderAdapter.js), so gradients/extra detail here cost nothing per
     * frame at runtime - a texture swap is all that happens after baking.
     */
    renderDynamicParts(ctx, baseSize) {
        const wheelAngle = this.animationTime * 4.2 + this.animationPhaseOffset;
        const jostle = Math.sin(wheelAngle * 2) * baseSize * 0.03;

        // Cache colors for this render
        if (!this._darkWood) {
            this._darkWood = darkenColor(this.woodColor, 0.35);
            this._darkWood2 = darkenColor(this.woodColor, 0.55);
            this._lightWood = lightenColor(this.woodColor, 0.2);
            this._darkRoof = darkenColor(this.roofColor, 0.4);
            this._lightRoof = lightenColor(this.roofColor, 0.18);
        }

        // Ground shadow - wide and low, under both wheels
        ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + baseSize * 0.7, baseSize * 1.45, baseSize * 0.24, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(this.x, this.y + jostle);

        // Box is deliberately much taller/roomier than a plain axle-height platform
        // would suggest - "it could hold a lot of people" is conveyed by the cargo
        // box's own volume, not just an overall size multiplier that would scale
        // the wheels up the same amount and keep the proportions identical.
        // wallTopY stays fixed (keeps the roof's absolute height); deckY (the
        // floor) is pulled well down into the wheels' own vertical span below, so
        // the box sits low and nested BETWEEN them rather than perched on top of
        // an axle underneath it.
        const wallLeftX = -baseSize * 1.08, wallRightX = baseSize * 1.08;
        const deckY = baseSize * 0.4;
        const wallTopY = -baseSize * 0.85;

        // --- OPEN TIMBER FRAME (posts, rails, bracing, crew visible inside) -
        // drawn before the wheels so the wheels' upper arcs overlap the frame's
        // lower posts, reading as wheels mounted on an axle that passes
        // through/behind a low-slung frame instead of a frame perched above
        // the axle. ---
        this.drawFrame(ctx, baseSize, wallLeftX, wallRightX, deckY, wallTopY);

        // Smaller wheels than before, with the axle sitting well above the box
        // floor (deckY) - more than half of each wheel's diameter now overlaps
        // the box's own vertical span instead of sitting entirely below it, so the
        // box reads as nested between the wheels rather than perched on an axle
        // underneath them.
        const wheelR = baseSize * 0.34;
        const wheelY = baseSize * 0.36;
        const rearWheelX = -baseSize * 0.78;
        const frontWheelX = baseSize * 0.78;

        this.drawWheel(ctx, rearWheelX, wheelY, wheelR, wheelAngle);
        this.drawWheel(ctx, frontWheelX, wheelY, wheelR, wheelAngle);

        // Axle bar connecting the hubs
        ctx.strokeStyle = this._darkWood2;
        ctx.lineWidth = baseSize * 0.08;
        ctx.beginPath();
        ctx.moveTo(rearWheelX, wheelY);
        ctx.lineTo(frontWheelX, wheelY);
        ctx.stroke();

        // --- PEAKED SHINGLE ROOF, plain military trim ---
        this.drawRoof(ctx, baseSize, wallLeftX, wallRightX, wallTopY);

        // --- IRON-SHOD BATTERING RAM, chained beneath the roof and running its
        // full length out to the head - drawn last so it reads on top of the
        // frame/crew/roof as the one continuous weapon running through the shed ---
        this.drawRamBeam(ctx, baseSize, wallLeftX, wallRightX, deckY, wallTopY);

        ctx.restore();

        // Health bar — skipped during Mode A baking (adapter draws it separately).
        if (!this._baking) {
            this.renderHealthBar(ctx, baseSize, { widthMul: 4.6, heightMul: 0.3, yOffsetMul: -2.9, strokeWidth: 1 });
        }
    }

    drawWheel(ctx, cx, cy, r, angle) {
        // Depth shadow behind the rim
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.arc(cx + r * 0.06, cy + r * 0.06, r, 0, Math.PI * 2);
        ctx.fill();

        // Wood rim
        ctx.fillStyle = this._darkWood;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.woodColor;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.86, 0, Math.PI * 2);
        ctx.fill();

        // Iron tire band around the rim
        ctx.strokeStyle = '#2b2b2b';
        ctx.lineWidth = r * 0.16;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.93, 0, Math.PI * 2);
        ctx.stroke();

        // Spokes, rotating with the wheel
        ctx.strokeStyle = this._darkWood2;
        ctx.lineWidth = r * 0.15;
        ctx.lineCap = 'round';
        for (let i = 0; i < 6; i++) {
            const a = angle + i * Math.PI / 3;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78);
            ctx.stroke();
        }
        ctx.lineCap = 'butt';

        // Hub
        ctx.fillStyle = '#332417';
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1a120a';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.beginPath();
        ctx.arc(cx - r * 0.06, cy - r * 0.06, r * 0.07, 0, Math.PI * 2);
        ctx.fill();
    }

    /** Open timber frame the roof sits on - corner posts, top/mid rails and
     *  diagonal bracing, with a shadowed interior and the crew visible pushing
     *  between the posts. Replaces the earlier solid painted plank walls, which
     *  read as a closed covered wagon rather than an open siege mantlet. */
    drawFrame(ctx, baseSize, leftX, rightX, deckY, wallTopY) {
        // Floor deck - the crew stands on it and the ram log runs above it
        ctx.fillStyle = this._darkWood2;
        ctx.fillRect(leftX, deckY - baseSize * 0.06, rightX - leftX, baseSize * 0.12);

        // Shadowed interior - reads as shade under the roof without becoming an
        // opaque wall, so the sides stay visually open
        ctx.fillStyle = 'rgba(18, 13, 8, 0.3)';
        ctx.fillRect(leftX, wallTopY, rightX - leftX, deckY - wallTopY);

        const postXs = [0.04, 0.36, 0.66, 0.96].map(t => leftX + (rightX - leftX) * t);
        const postW = baseSize * 0.1;

        // Diagonal cross-bracing between adjacent post pairs
        ctx.strokeStyle = this._darkWood2;
        ctx.lineWidth = baseSize * 0.045;
        for (let i = 0; i < postXs.length - 1; i++) {
            const x0 = postXs[i] + postW * 0.4, x1 = postXs[i + 1] - postW * 0.4;
            ctx.beginPath();
            ctx.moveTo(x0, deckY - baseSize * 0.02);
            ctx.lineTo(x1, wallTopY + baseSize * 0.06);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x0, wallTopY + baseSize * 0.06);
            ctx.lineTo(x1, deckY - baseSize * 0.02);
            ctx.stroke();
        }

        // Top rail (under the eave) and a lower waist rail tying the posts
        // together - the waist rail sits well below the ram log so it stays
        // visually distinct from it, and doubles as a rail the crew reads as
        // standing behind.
        ctx.strokeStyle = this._darkWood;
        ctx.lineWidth = baseSize * 0.07;
        for (const railY of [wallTopY + baseSize * 0.05, deckY - (deckY - wallTopY) * 0.16]) {
            ctx.beginPath();
            ctx.moveTo(leftX, railY);
            ctx.lineTo(rightX, railY);
            ctx.stroke();
        }

        // Crew visible inside, pushing/walking between the posts - drawn after
        // the bracing/rails (so it isn't chopped up by the diagonal braces) but
        // before the posts (so the posts still read in front, "a fence you see
        // people through").
        this.drawCrewFigure(ctx, baseSize, leftX + (rightX - leftX) * 0.2, deckY, true);
        this.drawCrewFigure(ctx, baseSize, leftX + (rightX - leftX) * 0.6, deckY, false);

        // Corner posts, drawn last so they read in front of the bracing/rails
        // and crew - the "fence you see people through" open-sided look
        for (const px of postXs) {
            ctx.fillStyle = this._darkWood;
            ctx.fillRect(px - postW / 2, wallTopY, postW, deckY - wallTopY);
            ctx.fillStyle = this.woodColor;
            ctx.fillRect(px - postW / 2, wallTopY, postW * 0.4, deckY - wallTopY);
            ctx.strokeStyle = this._darkWood2;
            ctx.lineWidth = 1;
            ctx.strokeRect(px - postW / 2, wallTopY, postW, deckY - wallTopY);
        }
    }

    /** Simplified crew member silhouette standing on the deck, inside the open
     *  frame - just enough shape (helmet, tunic torso, planted legs) to read as
     *  "someone pushing in there" at gameplay scale, using warm/bright tones so
     *  it still reads against the shadowed interior tint and dark bracing,
     *  partly obscured by the posts drawn over it afterward. */
    drawCrewFigure(ctx, baseSize, x, deckY, leaning) {
        const h = baseSize * 0.92;
        const footY = deckY - baseSize * 0.02;
        const lean = leaning ? baseSize * 0.13 : 0;

        // Legs - a short planted stride
        ctx.strokeStyle = '#c9a45c';
        ctx.lineWidth = baseSize * 0.085;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - baseSize * 0.08, footY - h * 0.4);
        ctx.lineTo(x - baseSize * 0.13, footY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + baseSize * 0.06, footY - h * 0.4);
        ctx.lineTo(x + baseSize * 0.12, footY);
        ctx.stroke();
        ctx.lineCap = 'butt';

        // Torso (tunic) - tapered, leaning forward into the push when leaning is set
        drawTaperedPath(
            ctx,
            [{ x, y: footY - h * 0.38 }, { x: x - lean, y: footY - h * 0.88 }],
            [baseSize * 0.28, baseSize * 0.18],
            '#8a3a2a', '#4a1d14', 1.2
        );

        // Forward-reaching arm, hands toward the log/push bar above
        ctx.strokeStyle = '#c9a45c';
        ctx.lineWidth = baseSize * 0.065;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - lean * 0.4, footY - h * 0.7);
        ctx.lineTo(x - lean * 1.6, footY - h * 0.95);
        ctx.stroke();
        ctx.lineCap = 'butt';

        // Helmet - bright steel dome over a visible face
        ctx.fillStyle = '#d8d8d8';
        ctx.beginPath();
        ctx.arc(x - lean, footY - h * 0.96, baseSize * 0.15, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = '#6b6b6b';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#c9a45c';
        ctx.beginPath();
        ctx.ellipse(x - lean, footY - h * 0.88, baseSize * 0.1, baseSize * 0.09, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    /** Peaked mantlet roof built from alternating lapped wood-plank and stitched
     *  leather courses (rather than one flat painted slab with faint scratch
     *  lines), at a shallower, more believable pitch than the earlier tall tent
     *  peak. Rigid geometry (only the wheels/frame jostle) since a roof
     *  shouldn't visibly wobble. */
    drawRoof(ctx, baseSize, leftX, rightX, wallTopY) {
        const overhang = baseSize * 0.16;
        const roofL = leftX - overhang, roofR = rightX + overhang;
        const ridgeL = -baseSize * 0.24, ridgeR = baseSize * 0.34;
        const peakY = wallTopY - baseSize * 0.4;

        if (!this._roofGrad || this._roofGradBaseSize !== baseSize || this._roofGradCtx !== ctx) {
            this._roofGradCtx = ctx;
            this._roofGradBaseSize = baseSize;
            this._roofGrad = ctx.createLinearGradient(0, peakY, 0, wallTopY);
            this._roofGrad.addColorStop(0, this._lightRoof);
            this._roofGrad.addColorStop(1, this._darkRoof);
        }

        // Backing slab - keeps a clean silhouette/outline beneath the plates
        ctx.fillStyle = this._roofGrad;
        ctx.beginPath();
        ctx.moveTo(roofL, wallTopY);
        ctx.lineTo(ridgeL, peakY);
        ctx.lineTo(ridgeR, peakY);
        ctx.lineTo(roofR, wallTopY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = this._darkRoof;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Lapped plate courses - alternating wood-plank and stitched-leather
        // panels stacked from eave to ridge on both slopes
        this.drawRoofPlateCourses(ctx, baseSize, roofL, roofR, ridgeL, ridgeR, wallTopY, peakY);

        // Ridge cap beam
        ctx.strokeStyle = this._darkRoof;
        ctx.lineWidth = baseSize * 0.07;
        ctx.beginPath();
        ctx.moveTo(ridgeL, peakY);
        ctx.lineTo(ridgeR, peakY);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = baseSize * 0.02;
        ctx.beginPath();
        ctx.moveTo(ridgeL, peakY - baseSize * 0.02);
        ctx.lineTo(ridgeR, peakY - baseSize * 0.02);
        ctx.stroke();

        // Fascia board capping the eave line
        ctx.fillStyle = this._darkWood2;
        ctx.fillRect(roofL, wallTopY - baseSize * 0.04, roofR - roofL, baseSize * 0.08);

        // Rivets studding the fascia - plain iron-shod trim, not festive bunting
        ctx.fillStyle = '#2b2b2b';
        const rivets = 10;
        for (let i = 0; i < rivets; i++) {
            const sx = roofL + (roofR - roofL) * (i + 0.5) / rivets;
            ctx.beginPath();
            ctx.arc(sx, wallTopY, baseSize * 0.025, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /** Horizontal courses stacked from eave to ridge on one slope of the roof,
     *  alternating a wood-plank course with a stitched leather course - gives
     *  the roof visible material variety and individual panel seams instead of
     *  a single flat painted triangle. Runs both slopes symmetrically about the
     *  ridge since it's called once per roof with both edge pairs. */
    drawRoofPlateCourses(ctx, baseSize, roofL, roofR, ridgeL, ridgeR, wallTopY, peakY) {
        const rows = 4;
        const leatherLight = '#7d7361', leatherDark = '#443e30';

        for (let i = 0; i < rows; i++) {
            const t0 = i / rows, t1 = (i + 1) / rows;
            const y0 = wallTopY + (peakY - wallTopY) * t0;
            const y1 = wallTopY + (peakY - wallTopY) * t1;
            const lx0 = roofL + (ridgeL - roofL) * t0, rx0 = roofR + (ridgeR - roofR) * t0;
            const lx1 = roofL + (ridgeL - roofL) * t1, rx1 = roofR + (ridgeR - roofR) * t1;
            const isLeather = i % 2 === 1;

            ctx.fillStyle = isLeather ? leatherLight : this._lightRoof;
            ctx.beginPath();
            ctx.moveTo(lx0, y0);
            ctx.lineTo(lx1, y1);
            ctx.lineTo(rx1, y1);
            ctx.lineTo(rx0, y0);
            ctx.closePath();
            ctx.fill();

            // Lap seam - shadow line where the course above overlaps this one,
            // plus a bright highlight just above it so the course reads as
            // physically proud of the one below rather than a flat color swap
            ctx.strokeStyle = isLeather ? leatherDark : this._darkRoof;
            ctx.lineWidth = baseSize * 0.03;
            ctx.beginPath();
            ctx.moveTo(lx0, y0);
            ctx.lineTo(rx0, y0);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = baseSize * 0.012;
            ctx.beginPath();
            ctx.moveTo(lx0, y0 + (y1 - y0) * 0.06);
            ctx.lineTo(rx0, y0 + (y1 - y0) * 0.06);
            ctx.stroke();

            if (isLeather) {
                // Stitching ticks along the course
                ctx.strokeStyle = leatherDark;
                ctx.lineWidth = baseSize * 0.015;
                const stitches = 6;
                for (let s = 0; s < stitches; s++) {
                    const st = (s + 0.5) / stitches;
                    const sx0 = lx0 + (rx0 - lx0) * st, sy0 = y0 + (y1 - y0) * 0.25;
                    const sx1 = lx1 + (rx1 - lx1) * st, sy1 = y0 + (y1 - y0) * 0.75;
                    ctx.beginPath();
                    ctx.moveTo(sx0, sy0);
                    ctx.lineTo(sx1, sy1);
                    ctx.stroke();
                }
            } else {
                // Wood grain lines running along the plank's length
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
                ctx.lineWidth = 0.8;
                const grains = 4;
                for (let g = 1; g < grains; g++) {
                    const gt = g / grains;
                    const gx0 = lx0 + (rx0 - lx0) * gt, gx1 = lx1 + (rx1 - lx1) * gt;
                    ctx.beginPath();
                    ctx.moveTo(gx0, y0 + (y1 - y0) * 0.15);
                    ctx.lineTo(gx1, y1 - (y1 - y0) * 0.1);
                    ctx.stroke();
                }
            }
        }
    }

    /** Iron-shod log running the full length of the shed - poking out a bit past
     *  the rear posts (where the crew grips it), under the ridge, then out past
     *  the front to the head - chained beneath the roof like the real siege
     *  engine. Same beam length as before, just centered further back so both
     *  ends show instead of only the head end. */
    drawRamBeam(ctx, baseSize, wallLeftX, wallRightX, deckY, wallTopY) {
        const beamY = (deckY + wallTopY) * 0.5 + baseSize * 0.05;
        const backX = wallLeftX - baseSize * 0.3;
        const headMountX = wallRightX + baseSize * 0.47;

        // Suspension chains - hang from the roof eave down to the log at three
        // points along its length, reading as what's actually holding the ram up
        // under the shed roof rather than it resting loose on the deck.
        for (const t of [0.08, 0.4, 0.68]) {
            const cx = backX + (headMountX - backX) * t;
            const topY = wallTopY - baseSize * 0.02;
            const bottomY = beamY - baseSize * 0.16;
            ctx.strokeStyle = '#3a3a3a';
            ctx.lineWidth = baseSize * 0.035;
            ctx.beginPath();
            ctx.moveTo(cx, topY);
            ctx.lineTo(cx, bottomY);
            ctx.stroke();
            for (let i = 0; i < 3; i++) {
                const ly = topY + (bottomY - topY) * (i + 0.5) / 3;
                ctx.strokeStyle = '#6b6b6b';
                ctx.lineWidth = baseSize * 0.02;
                ctx.beginPath();
                ctx.arc(cx, ly, baseSize * 0.045, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Log - thick at the back where it sockets into the wall, tapering
        // slightly toward the head.
        drawTaperedPath(
            ctx,
            [{ x: backX, y: beamY }, { x: (backX + headMountX) / 2, y: beamY }, { x: headMountX, y: beamY }],
            [baseSize * 0.4, baseSize * 0.32, baseSize * 0.26],
            '#5c3f22', '#3d2a16', 1.2
        );
        // Grain highlight along the top edge
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(backX, beamY - baseSize * 0.14);
        ctx.lineTo(headMountX - baseSize * 0.1, beamY - baseSize * 0.09);
        ctx.stroke();

        // Iron bands wrapped around the log - a straight cross-strap (not a filled
        // ellipse, which reads as a punched-through hole rather than a ring wrapped
        // around a cylinder in side view) with a bright sliver on its near edge.
        for (const t of [0.06, 0.3, 0.56, 0.8]) {
            const bx = backX + (headMountX - backX) * t;
            const halfH = (baseSize * 0.19) * (1 - t * 0.35);
            const bw = baseSize * 0.07;
            ctx.fillStyle = '#2b2b2b';
            ctx.fillRect(bx - bw / 2, beamY - halfH, bw, halfH * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
            ctx.fillRect(bx - bw / 2, beamY - halfH, bw * 0.28, halfH * 2);
        }

        this.drawRamHead(ctx, baseSize, headMountX, beamY);
    }

    /** Snarling bronze ram-head cap at the beam's tip, drawn in side profile
     *  (snout pointing forward, in the direction of travel/impact). */
    drawRamHead(ctx, baseSize, mountX, mountY) {
        const bronzeDark = '#4a3620', bronzeMid = '#8a6a3a';
        const headLen = baseSize * 0.62, headH = baseSize * 0.48;

        if (!this._ramHeadGrad || this._ramHeadGradBaseSize !== baseSize || this._ramHeadGradCtx !== ctx) {
            this._ramHeadGradCtx = ctx;
            this._ramHeadGradBaseSize = baseSize;
            this._ramHeadGrad = ctx.createLinearGradient(mountX, mountY - headH * 0.6, mountX, mountY + headH * 0.6);
            this._ramHeadGrad.addColorStop(0, '#c9a45c');
            this._ramHeadGrad.addColorStop(0.55, bronzeMid);
            this._ramHeadGrad.addColorStop(1, bronzeDark);
        }

        // Skull/snout mass - rounded at the back (collar), tapering to a blunt
        // metal-capped muzzle at the front.
        ctx.fillStyle = this._ramHeadGrad;
        ctx.beginPath();
        ctx.moveTo(mountX - baseSize * 0.06, mountY - headH * 0.42);
        ctx.quadraticCurveTo(mountX + headLen * 0.55, mountY - headH * 0.5, mountX + headLen, mountY - headH * 0.12);
        ctx.lineTo(mountX + headLen, mountY + headH * 0.12);
        ctx.quadraticCurveTo(mountX + headLen * 0.55, mountY + headH * 0.5, mountX - baseSize * 0.06, mountY + headH * 0.42);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = bronzeDark;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Collar band where the head sockets onto the log, with rivets
        ctx.fillStyle = '#2b2b2b';
        ctx.beginPath();
        ctx.ellipse(mountX, mountY, baseSize * 0.07, headH * 0.46, 0, 0, Math.PI * 2);
        ctx.fill();
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2;
            ctx.fillStyle = '#7a7a7a';
            ctx.beginPath();
            ctx.arc(mountX, mountY + Math.sin(a) * headH * 0.32, baseSize * 0.02, 0, Math.PI * 2);
            ctx.fill();
        }

        // Pointed ear
        ctx.fillStyle = bronzeDark;
        ctx.beginPath();
        ctx.moveTo(mountX + headLen * 0.15, mountY - headH * 0.4);
        ctx.lineTo(mountX + headLen * 0.35, mountY - headH * 0.82);
        ctx.lineTo(mountX + headLen * 0.5, mountY - headH * 0.38);
        ctx.closePath();
        ctx.fill();

        // Brow furrow
        ctx.strokeStyle = bronzeDark;
        ctx.lineWidth = baseSize * 0.03;
        ctx.beginPath();
        ctx.moveTo(mountX + headLen * 0.2, mountY - headH * 0.3);
        ctx.quadraticCurveTo(mountX + headLen * 0.55, mountY - headH * 0.38, mountX + headLen * 0.82, mountY - headH * 0.2);
        ctx.stroke();

        // Eye
        ctx.fillStyle = '#1a1208';
        ctx.beginPath();
        ctx.ellipse(mountX + headLen * 0.48, mountY - headH * 0.1, baseSize * 0.055, baseSize * 0.07, -0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 200, 120, 0.6)';
        ctx.beginPath();
        ctx.arc(mountX + headLen * 0.46, mountY - headH * 0.13, baseSize * 0.018, 0, Math.PI * 2);
        ctx.fill();

        // Muzzle - blunt rounded iron cap over the snout tip (a rounded cap, not
        // a pointed wedge, so it reads as a striking face rather than a fin).
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        ctx.ellipse(mountX + headLen * 0.9, mountY, headLen * 0.18, headH * 0.44, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(mountX + headLen * 0.85, mountY - headH * 0.12, headLen * 0.1, headH * 0.2, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Mouth line with a lower tusk poking out from beneath the iron cap
        ctx.strokeStyle = '#1a1208';
        ctx.lineWidth = baseSize * 0.025;
        ctx.beginPath();
        ctx.moveTo(mountX + headLen * 0.5, mountY + headH * 0.22);
        ctx.lineTo(mountX + headLen * 0.78, mountY + headH * 0.3);
        ctx.stroke();
        ctx.fillStyle = '#e8e0c8';
        ctx.beginPath();
        ctx.moveTo(mountX + headLen * 0.68, mountY + headH * 0.28);
        ctx.lineTo(mountX + headLen * 0.72, mountY + headH * 0.48);
        ctx.lineTo(mountX + headLen * 0.8, mountY + headH * 0.3);
        ctx.closePath();
        ctx.fill();
    }
}
