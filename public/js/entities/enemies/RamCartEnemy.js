import { BaseEnemy } from './BaseEnemy.js';
import { darkenColor, lightenColor } from '../../utils/colorUtils.js';
import { drawTaperedPath } from './TaperedShapeRenderer.js';

/**
 * A covered wooden raider wagon - peaked shingle roof, plank walls, a bone
 * skull-and-horns trophy mounted at the front - smuggling a raiding party toward
 * the castle. It has no limbs (rolls on two wheels), so it has no PARTICLE_FIELDS
 * arrays and no jumpAnimationTimer - EnemyRenderAdapter therefore treats it as
 * Mode A (baked sprite animation), same tier of cost as BasicEnemy/BeefyEnemy
 * despite the extra visual detail, which matters since breaking one open
 * immediately adds 20 more enemies to the field (see spawnOnDeath below /
 * EnemyManager._spawnDeathChildren).
 */
export class RamCartEnemy extends BaseEnemy {
    static BASE_STATS = {
        health: 1100,
        speed: 30,
        armour: 25,
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

        // --- WALLS (planked wood box body, with an arrow slit tell) - drawn
        // before the wheels so the wheels' upper arcs overlap the box's lower
        // wall, reading as wheels mounted on an axle that passes through/behind
        // a low-slung body instead of a body perched above the axle. ---
        this.drawWalls(ctx, baseSize, wallLeftX, wallRightX, deckY, wallTopY);

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

        // --- PEAKED SHINGLE ROOF with bunting trim ---
        this.drawRoof(ctx, baseSize, wallLeftX, wallRightX, wallTopY);

        // --- SKULL-AND-HORNS TROPHY mounted at the front ---
        this.drawSkullTrophy(ctx, baseSize, wallRightX - baseSize * 0.08, (deckY + wallTopY) * 0.5 - baseSize * 0.05);

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

    /** Planked wood box body the roof sits on. Carries the "hidden raiding party"
     *  tell as a dark arrow slit with a spear tip poking through, rather than the
     *  earlier tarp-bulge approach. */
    drawWalls(ctx, baseSize, leftX, rightX, deckY, wallTopY) {
        if (!this._wallGrad || this._wallGradBaseSize !== baseSize || this._wallGradCtx !== ctx) {
            this._wallGradCtx = ctx;
            this._wallGradBaseSize = baseSize;
            this._wallGrad = ctx.createLinearGradient(0, wallTopY, 0, deckY);
            this._wallGrad.addColorStop(0, this._lightWood);
            this._wallGrad.addColorStop(0.5, this.woodColor);
            this._wallGrad.addColorStop(1, this._darkWood);
        }

        ctx.fillStyle = this._wallGrad;
        ctx.fillRect(leftX, wallTopY, rightX - leftX, deckY - wallTopY);
        ctx.strokeStyle = this._darkWood2;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(leftX, wallTopY, rightX - leftX, deckY - wallTopY);

        // Vertical plank seams
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 0.8;
        for (let i = 1; i < 7; i++) {
            const px = leftX + (rightX - leftX) * (i / 7);
            ctx.beginPath();
            ctx.moveTo(px, wallTopY + baseSize * 0.02);
            ctx.lineTo(px, deckY - baseSize * 0.01);
            ctx.stroke();
        }

        // Iron corner reinforcement brackets with rivets
        const corners = [
            [leftX + baseSize * 0.1, wallTopY + baseSize * 0.06],
            [rightX - baseSize * 0.1, wallTopY + baseSize * 0.06]
        ];
        for (const [cx, cy] of corners) {
            ctx.fillStyle = '#3a3a3a';
            ctx.fillRect(cx - baseSize * 0.1, cy, baseSize * 0.2, baseSize * 0.09);
            ctx.fillStyle = '#7a7a7a';
            ctx.beginPath();
            ctx.arc(cx, cy + baseSize * 0.045, baseSize * 0.025, 0, Math.PI * 2);
            ctx.fill();
        }

        // Arrow slit with a spear tip poking through - the raiding party inside
        const slitX = rightX - baseSize * 0.36;
        const slitTopY = wallTopY + baseSize * 0.1, slitBotY = deckY - baseSize * 0.08;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(slitX - baseSize * 0.045, slitTopY, baseSize * 0.09, slitBotY - slitTopY);

        ctx.strokeStyle = '#8a8a8a';
        ctx.lineWidth = baseSize * 0.04;
        ctx.beginPath();
        ctx.moveTo(slitX, slitBotY);
        ctx.lineTo(slitX + baseSize * 0.02, slitTopY - baseSize * 0.14);
        ctx.stroke();
        ctx.fillStyle = '#c9c9c9';
        ctx.beginPath();
        ctx.moveTo(slitX - baseSize * 0.05, slitTopY - baseSize * 0.02);
        ctx.lineTo(slitX + baseSize * 0.02, slitTopY - baseSize * 0.22);
        ctx.lineTo(slitX + baseSize * 0.09, slitTopY - baseSize * 0.02);
        ctx.closePath();
        ctx.fill();

        // A second, smaller slit for variety
        const slit2X = leftX + baseSize * 0.34;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(slit2X - baseSize * 0.04, slitTopY + baseSize * 0.05, baseSize * 0.08, baseSize * 0.28);
    }

    /** Peaked, shingled wagon roof with overhanging eaves and a scalloped bunting
     *  trim - the "covered raider wagon" silhouette this cart is meant to evoke,
     *  in place of the earlier flat tarp. Rigid geometry (only the wheels/wall
     *  jostle) since a roof shouldn't visibly wobble. */
    drawRoof(ctx, baseSize, leftX, rightX, wallTopY) {
        const overhang = baseSize * 0.16;
        const roofL = leftX - overhang, roofR = rightX + overhang;
        const ridgeL = -baseSize * 0.24, ridgeR = baseSize * 0.34;
        const peakY = wallTopY - baseSize * 0.66;

        if (!this._roofGrad || this._roofGradBaseSize !== baseSize || this._roofGradCtx !== ctx) {
            this._roofGradCtx = ctx;
            this._roofGradBaseSize = baseSize;
            this._roofGrad = ctx.createLinearGradient(0, peakY, 0, wallTopY);
            this._roofGrad.addColorStop(0, this._lightRoof);
            this._roofGrad.addColorStop(1, this._darkRoof);
        }

        // Main roof slab
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

        // Ridge cap
        ctx.strokeStyle = this._darkRoof;
        ctx.lineWidth = baseSize * 0.05;
        ctx.beginPath();
        ctx.moveTo(ridgeL, peakY);
        ctx.lineTo(ridgeR, peakY);
        ctx.stroke();

        // Shingle-row texture on both slopes
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.lineWidth = 0.9;
        for (let i = 1; i < 5; i++) {
            const t = i / 5;
            const lx = roofL + (ridgeL - roofL) * t, ly = wallTopY + (peakY - wallTopY) * t;
            const rx = roofR + (ridgeR - roofR) * t, ry = wallTopY + (peakY - wallTopY) * t;
            ctx.beginPath();
            ctx.moveTo(lx, ly);
            ctx.lineTo(lx + (ridgeL - roofL) * 0.12, ly);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx + (ridgeR - roofR) * 0.12, ry);
            ctx.stroke();
        }

        // Fascia board capping the eave line
        ctx.fillStyle = this._darkWood2;
        ctx.fillRect(roofL, wallTopY - baseSize * 0.04, roofR - roofL, baseSize * 0.08);

        // Scalloped bunting trim hanging beneath the eave
        const scallops = 8;
        for (let i = 0; i < scallops; i++) {
            const sx = roofL + (roofR - roofL) * (i + 0.5) / scallops;
            const sr = baseSize * 0.09;
            ctx.fillStyle = i % 2 === 0 ? 'rgba(180, 60, 60, 0.85)' : 'rgba(224, 214, 180, 0.85)';
            ctx.beginPath();
            ctx.arc(sx, wallTopY + baseSize * 0.04, sr, 0, Math.PI);
            ctx.fill();
        }
    }

    /** Bone-white skull-and-horns trophy mounted on the front wall, facing the
     *  viewer like a masthead ornament (rather than in profile, which would read
     *  as a flat sliver at this render scale) - the cart's namesake "ram" identity,
     *  swapped in for a literal battering log to match a covered raider wagon. */
    drawSkullTrophy(ctx, baseSize, mountX, mountY) {
        const skullW = baseSize * 0.42, skullH = baseSize * 0.38;
        const hornColor = '#EDE6D3', hornMid = '#D9CDA8', hornDark = '#8B7F5E';

        // Horns - sweep up and outward from the top of the skull, curving back down
        // near the tips (classic wide longhorn silhouette), drawn first so the
        // skull dome overlaps and anchors their base.
        for (const side of [-1, 1]) {
            const p0 = { x: mountX - skullW * 0.1, y: mountY - skullH * 0.55 };
            const p1 = { x: mountX + side * skullW * 0.85, y: mountY - skullH * 1.15 };
            const p2 = { x: mountX + side * skullW * 1.55, y: mountY - skullH * 0.7 };
            const p3 = { x: mountX + side * skullW * 1.85, y: mountY - skullH * 0.35 };
            drawTaperedPath(
                ctx,
                [p0, p1, p2, p3],
                [baseSize * 0.13, baseSize * 0.1, baseSize * 0.06, baseSize * 0.015],
                hornColor, hornDark, 1
            );
            // Ridge striations along the horn for a keratin-ring texture
            ctx.strokeStyle = 'rgba(139, 127, 94, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p0.x + (p1.x - p0.x) * 0.4, p0.y + (p1.y - p0.y) * 0.4);
            ctx.lineTo(p1.x + (p2.x - p1.x) * 0.3, p1.y + (p2.y - p1.y) * 0.3);
            ctx.stroke();
        }

        // Skull dome (rounded cranium, slightly flattened toward the muzzle)
        if (!this._skullGrad || this._skullGradBaseSize !== baseSize || this._skullGradCtx !== ctx) {
            this._skullGradCtx = ctx;
            this._skullGradBaseSize = baseSize;
            this._skullGrad = ctx.createRadialGradient(mountX - skullW * 0.2, mountY - skullH * 0.3, skullW * 0.1, mountX, mountY, skullW * 0.9);
            this._skullGrad.addColorStop(0, '#F7F1E1');
            this._skullGrad.addColorStop(1, '#CFC29C');
        }
        ctx.fillStyle = this._skullGrad;
        ctx.beginPath();
        ctx.ellipse(mountX, mountY - skullH * 0.18, skullW * 0.62, skullH * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8B7F5E';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(mountX, mountY - skullH * 0.18, skullW * 0.62, skullH * 0.62, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Muzzle/snout tapering down and slightly forward from the dome
        ctx.fillStyle = '#DED2B4';
        ctx.beginPath();
        ctx.moveTo(mountX - skullW * 0.42, mountY + skullH * 0.14);
        ctx.quadraticCurveTo(mountX, mountY + skullH * 0.95, mountX + skullW * 0.42, mountY + skullH * 0.14);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#8B7F5E';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Eye sockets - clearly separated left/right so the face reads instantly
        ctx.fillStyle = '#241d14';
        for (const side of [-1, 1]) {
            ctx.beginPath();
            ctx.ellipse(mountX + side * skullW * 0.3, mountY - skullH * 0.2, baseSize * 0.075, baseSize * 0.095, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        // Faint socket rim highlight for depth
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1;
        for (const side of [-1, 1]) {
            ctx.beginPath();
            ctx.ellipse(mountX + side * skullW * 0.3, mountY - skullH * 0.2, baseSize * 0.075, baseSize * 0.095, 0, Math.PI * 1.15, Math.PI * 1.65);
            ctx.stroke();
        }

        // Nasal cavity - inverted heart/triangle between and below the eyes
        ctx.fillStyle = '#241d14';
        ctx.beginPath();
        ctx.moveTo(mountX, mountY + skullH * 0.05);
        ctx.lineTo(mountX - skullW * 0.14, mountY + skullH * 0.42);
        ctx.lineTo(mountX + skullW * 0.14, mountY + skullH * 0.42);
        ctx.closePath();
        ctx.fill();

        // Hairline crack detail for a weathered-trophy read
        ctx.strokeStyle = 'rgba(139, 127, 94, 0.5)';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(mountX + skullW * 0.15, mountY - skullH * 0.72);
        ctx.lineTo(mountX + skullW * 0.05, mountY - skullH * 0.3);
        ctx.lineTo(mountX + skullW * 0.22, mountY - skullH * 0.05);
        ctx.stroke();
    }
}
