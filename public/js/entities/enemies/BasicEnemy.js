import { BaseEnemy } from './BaseEnemy.js';
import { drawTwoSegmentLimb, computeWalkCycle, mirroredLimbAngle, kneeFlex } from './HumanoidLimbRenderer.js';
import { drawTaperedPath } from './TaperedShapeRenderer.js';

export class BasicEnemy extends BaseEnemy {
    static BASE_STATS = {
        health: 100,
        speed: 50,
        armour: 0,
        magicResistance: 0
    };

    constructor(path, health_multiplier = 1.0, speed = null, armour = null, magicResistance = null) {
        const baseStats = BasicEnemy.BASE_STATS;
        const actualSpeed = speed !== null ? speed : baseStats.speed;
        const actualArmour = armour !== null ? armour : baseStats.armour;
        const actualMagicResistance = magicResistance !== null ? magicResistance : baseStats.magicResistance;

        super(path, baseStats.health * health_multiplier, actualSpeed, actualArmour, actualMagicResistance);
        this.tunicColor = this.getRandomTunicColor();
        this.tunicColorHex = this.hexToRgb(this.tunicColor);

        this.attackDamage = 5;
        this.attackSpeed = 1.0;

        // Pre-calculate darkened tunic color for performance
        this.tunicDarkRGB = this.getRgbDarkenedByAmount(this.tunicColorHex, 0.2);

        // Pre-compute color strings to avoid per-frame template literal allocation
        this._tunicDarkColorStr = `rgb(${this.tunicDarkRGB[0]},${this.tunicDarkRGB[1]},${this.tunicDarkRGB[2]})`;
        this._tunicMainColorStr = `rgb(${this.tunicColorHex[0]},${this.tunicColorHex[1]},${this.tunicColorHex[2]})`;
        this._tunicLightColorStr = this.lightenColor(this.tunicColor, 0.3);

        // Set by EnemyRenderAdapter once it has synced this enemy via Pixi (hit splatters
        // still draw here regardless - not yet migrated). No static structure for this
        // enemy - the whole figure bobs/swings continuously while walking, so there's no
        // baking benefit; everything lives in renderDynamicParts.
        this.skipCanvas2DBodyRender = false;
    }

    /** Per-instance tunic color variant, so baked layers (if any subclass adds them) don't collide across different-colored instances. */
    getRenderVariantKey() {
        return this.tunicColor;
    }

    getRandomTunicColor() {
        const tunicColors = [
            '#8B4513', '#4169E1', '#DC143C', '#2F4F4F', '#556B2F', '#8B008B'
        ];
        return tunicColors[Math.floor(Math.random() * tunicColors.length)];
    }

    hexToRgb(hex) {
        // Parse hex color to RGB array
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [139, 69, 19];
    }

    getRgbDarkenedByAmount(rgb, factor) {
        return [
            Math.max(0, rgb[0] * (1 - factor)),
            Math.max(0, rgb[1] * (1 - factor)),
            Math.max(0, rgb[2] * (1 - factor))
        ];
    }

    render(ctx) {
        // baseSize depends on ctx.canvas.width (real screen resolution) - computed once
        // here, with a real ctx, and threaded through explicitly from here on, since
        // CanvasGraphicsShim (used in Pixi mode) has no .canvas and the bake pass's own
        // offscreen canvas is the wrong (much smaller) size to derive this from. Cached on
        // the instance so _syncEnemyPixi (GameplayState) can reuse the exact same value -
        // every enemy type's clamp range/multiplier differs, so recomputing it generically
        // in GameplayState would risk a Canvas2D/Pixi size mismatch.
        const baseSize = Math.max(6, Math.min(14, ctx.canvas.width / 150));
        this._lastRenderSize = baseSize;

        if (!this.skipCanvas2DBodyRender) {
            this.renderDynamicParts(ctx, baseSize);
        }

        // Hit splatters - not yet migrated
        if (this.hitSplatters.length > 0) {
            for (let i = 0; i < this.hitSplatters.length; i++) {
                this.hitSplatters[i].render(ctx);
            }
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
     * Strategy A (baked): this only runs live during Mode A's one-time bake pass
     * (16 frames per unique tunic color, EnemyRenderAdapter.js), so unlike the old
     * per-frame-Canvas2D era there's no ongoing cost to gradients/extra shading here -
     * add detail freely, it's paid for once per color variant, not per frame/instance.
     */
    renderDynamicParts(ctx, baseSize) {
        const anim = computeWalkCycle(this.animationTime, this.animationPhaseOffset, 8);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + baseSize * 1.55, baseSize * 0.75, baseSize * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(this.x, this.y + anim.bodyBob);

        // --- LEGS (two-segment, knee bend tied to the stride) --- Stance widened
        // (0.25->0.34*baseSize) and swing/knee-bend both cut down (0.3->0.15) - the
        // previous narrow stance + wide swing let the rigid straight leg (the moment
        // knee bend is zero, at the swing extremes) reach past centerline once the
        // boot radius was added on top.
        const leftLegAngle = Math.PI / 2 + anim.legSwing * 0.15;
        const rightLegAngle = Math.PI / 2 - anim.legSwing * 0.15;

        const leftLeg = drawTwoSegmentLimb(
            ctx, -baseSize * 0.34, baseSize * 0.3,
            leftLegAngle, baseSize * 0.42,
            leftLegAngle - kneeFlex(anim, false) * 0.15, baseSize * 0.4,
            { limbColor: '#2F2F2F', padColor: '#1C1C1C', limbWidth: baseSize * 0.22, padRadius: baseSize * 0.14 }
        );
        const rightLeg = drawTwoSegmentLimb(
            ctx, baseSize * 0.34, baseSize * 0.3,
            rightLegAngle, baseSize * 0.42,
            rightLegAngle + kneeFlex(anim, true) * 0.15, baseSize * 0.4,
            { limbColor: '#2F2F2F', padColor: '#1C1C1C', limbWidth: baseSize * 0.22, padRadius: baseSize * 0.14 }
        );

        // --- TUNIC (gradient-shaded silhouette instead of a flat rectangle) ---
        if (!this._tunicGrad || this._gradBaseSize !== baseSize || this._gradCtx !== ctx) {
            this._gradCtx = ctx;
            this._gradBaseSize = baseSize;
            this._tunicGrad = ctx.createLinearGradient(-baseSize * 0.6, -baseSize * 0.8, baseSize * 0.6, baseSize * 0.4);
            this._tunicGrad.addColorStop(0, this._tunicLightColorStr);
            this._tunicGrad.addColorStop(0.45, this._tunicMainColorStr);
            this._tunicGrad.addColorStop(1, this._tunicDarkColorStr);
        }

        ctx.fillStyle = this._tunicGrad;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.55, -baseSize * 0.75);
        ctx.lineTo(baseSize * 0.55, -baseSize * 0.75);
        ctx.lineTo(baseSize * 0.62, baseSize * 0.4);
        ctx.lineTo(-baseSize * 0.62, baseSize * 0.4);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = this._tunicDarkColorStr;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Belt
        ctx.fillStyle = '#4A3018';
        ctx.fillRect(-baseSize * 0.58, baseSize * 0.12, baseSize * 1.16, baseSize * 0.14);
        ctx.fillStyle = '#D4AF37';
        ctx.beginPath();
        ctx.arc(0, baseSize * 0.19, baseSize * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Collar
        ctx.strokeStyle = this._tunicDarkColorStr;
        ctx.lineWidth = baseSize * 0.06;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 0.72, baseSize * 0.22, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();

        // --- LEFT ARM (swings normally with the stride) ---
        const leftArmAngle = mirroredLimbAngle(0.205, anim.legSwing, 0.22, false);
        drawTwoSegmentLimb(
            ctx, -baseSize * 0.52, -baseSize * 0.4,
            leftArmAngle, baseSize * 0.42,
            leftArmAngle - 0.15, baseSize * 0.4,
            { limbColor: '#D9C4A8', padColor: '#DDD4B8', limbWidth: baseSize * 0.26, padRadius: baseSize * 0.14, shadowColor: 'rgba(0,0,0,0.1)' }
        );

        // --- RIGHT ARM WITH CLUB (fixed, raised grip - not animated with the gait,
        // exactly like VillagerEnemy's torch/pitchfork arm) ---
        const clubArmAngle = -Math.PI / 2 + 0.3;
        const rightHand = drawTwoSegmentLimb(
            ctx, baseSize * 0.52, -baseSize * 0.4,
            clubArmAngle, baseSize * 0.45,
            clubArmAngle, baseSize * 0.4,
            { limbColor: '#D9C4A8', padColor: '#DDD4B8', limbWidth: baseSize * 0.26, padRadius: baseSize * 0.14, shadowColor: 'rgba(0,0,0,0.1)' }
        );

        // --- CLUB ---
        this.drawClub(ctx, rightHand.endX, rightHand.endY, baseSize, clubArmAngle);

        // --- HEAD (soft gradient shading instead of flat fill) ---
        if (!this._headGrad || this._headGradBaseSize !== baseSize || this._headGradCtx !== ctx) {
            this._headGradCtx = ctx;
            this._headGradBaseSize = baseSize;
            this._headGrad = ctx.createRadialGradient(-baseSize * 0.15, -baseSize * 1.32, baseSize * 0.1, 0, -baseSize * 1.2, baseSize * 0.55);
            this._headGrad.addColorStop(0, '#E8D4B8');
            this._headGrad.addColorStop(1, '#B8956A');
        }
        ctx.fillStyle = this._headGrad;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.2, baseSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8a6a45';
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // --- HELMET (metal sheen gradient + rivets + nasal guard) ---
        if (!this._helmGrad || this._helmGradBaseSize !== baseSize || this._helmGradCtx !== ctx) {
            this._helmGradCtx = ctx;
            this._helmGradBaseSize = baseSize;
            this._helmGrad = ctx.createLinearGradient(-baseSize * 0.6, -baseSize * 1.8, baseSize * 0.6, -baseSize * 0.85);
            this._helmGrad.addColorStop(0, '#8a8a8a');
            this._helmGrad.addColorStop(0.5, '#5a5a5a');
            this._helmGrad.addColorStop(1, '#2F2F2F');
        }
        ctx.fillStyle = this._helmGrad;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.2, baseSize * 0.62, Math.PI * 0.95, Math.PI * 2.05);
        ctx.fill();
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.62, -baseSize * 1.2);
        ctx.lineTo(baseSize * 0.62, -baseSize * 1.2);
        ctx.stroke();

        // Nasal guard
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(-baseSize * 0.05, -baseSize * 1.2, baseSize * 0.1, baseSize * 0.35);

        // Rivets
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.42, -baseSize * 1.42, baseSize * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(baseSize * 0.42, -baseSize * 1.42, baseSize * 0.05, 0, Math.PI * 2);
        ctx.fill();

        // Helmet highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.2, -baseSize * 1.38, baseSize * 0.11, 0, Math.PI * 2);
        ctx.fill();

        // --- BOOTS (drawn after legs so they cap the feet) ---
        ctx.fillStyle = '#1C1C1C';
        ctx.beginPath();
        ctx.ellipse(leftLeg.endX, leftLeg.endY + baseSize * 0.1, baseSize * 0.17, baseSize * 0.13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(rightLeg.endX, rightLeg.endY + baseSize * 0.1, baseSize * 0.17, baseSize * 0.13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath();
        ctx.ellipse(leftLeg.endX - baseSize * 0.05, leftLeg.endY + baseSize * 0.06, baseSize * 0.06, baseSize * 0.04, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(rightLeg.endX - baseSize * 0.05, rightLeg.endY + baseSize * 0.06, baseSize * 0.06, baseSize * 0.04, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Health bar — skipped during Mode A baking (adapter draws it separately).
        if (!this._baking) {
            this.renderHealthBar(ctx, baseSize, { widthMul: 3.0, heightMul: 0.35, yOffsetMul: -2.1, strokeWidth: 0.5 });
        }
    }

    /** Heavy studded war club, held raised in a fixed grip - gives the plain soldier
     *  something to actually hold, matching VillagerEnemy's torch/pitchfork treatment.
     *  Rotates by `armAngle + Math.PI/2` (matching VillagerEnemy.drawTorch/drawPitchfork's
     *  convention exactly) since the club body is drawn growing along local +Y from the
     *  grip - using the opposite sign here previously pointed the heavy head back down
     *  behind the hand/torso instead of up and visible, which is why it was unrecognizable. */
    drawClub(ctx, handX, handY, baseSize, armAngle) {
        ctx.save();
        ctx.translate(handX, handY);
        ctx.rotate(armAngle + Math.PI / 2);

        // A blackjack/sap silhouette - a slender shaft for most of its length with a
        // modest rounded bulge only near the very top, not a wide lumpy head starting
        // a third of the way up (the previous version's headWidth was nearly as large
        // as the club was long, which is what read as a shield rather than a club).
        // Built as one continuous drawTaperedPath through hand->neck->bulb->tip so the
        // whole silhouette is a single smooth taper instead of a separate handle
        // polygon glued to a separate bulbous head shape.
        const clubLength = baseSize * 1.5;
        const handleWidth = baseSize * 0.15;
        const neckY = clubLength * 0.6;
        const bulbY = clubLength * 0.85;
        const tipY = clubLength;
        const bulbWidth = baseSize * 0.37;
        const tipWidth = baseSize * 0.22;

        if (!this._clubGrad || this._clubGradBaseSize !== baseSize || this._clubGradCtx !== ctx) {
            this._clubGradCtx = ctx;
            this._clubGradBaseSize = baseSize;
            this._clubGrad = ctx.createLinearGradient(-bulbWidth / 2, 0, bulbWidth / 2, 0);
            this._clubGrad.addColorStop(0, '#4a2f18');
            this._clubGrad.addColorStop(0.5, '#7a4f28');
            this._clubGrad.addColorStop(1, '#4a2f18');
        }
        drawTaperedPath(
            ctx,
            [{ x: 0, y: 0 }, { x: 0, y: neckY }, { x: 0, y: bulbY }, { x: 0, y: tipY }],
            [handleWidth, handleWidth, bulbWidth, tipWidth],
            this._clubGrad,
            '#2f1c0a',
            1
        );

        // Rounded cap at the very top - the "bulkier top" finishing touch, capping
        // the taper's flat end with an actual round silhouette.
        ctx.fillStyle = '#6e4423';
        ctx.beginPath();
        ctx.arc(0, tipY, tipWidth * 0.58, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2f1c0a';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Leather grip wrap bands on the slender shaft
        ctx.strokeStyle = '#2a1a0a';
        ctx.lineWidth = baseSize * 0.025;
        for (let i = 1; i <= 3; i++) {
            const gy = neckY * (i / 4);
            ctx.beginPath();
            ctx.moveTo(-handleWidth / 2, gy);
            ctx.lineTo(handleWidth / 2, gy);
            ctx.stroke();
        }

        // Metal studs driven into the bulb - the clearest "this is a weapon" cue
        ctx.fillStyle = '#8a8a8a';
        const studRows = [bulbY - baseSize * 0.05, bulbY + baseSize * 0.09];
        const studOffsets = [-0.22, 0.22];
        for (const rowY of studRows) {
            for (const off of studOffsets) {
                ctx.beginPath();
                ctx.arc(off * bulbWidth, rowY, baseSize * 0.05, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        for (const rowY of studRows) {
            for (const off of studOffsets) {
                ctx.beginPath();
                ctx.arc(off * bulbWidth - baseSize * 0.015, rowY - baseSize * 0.015, baseSize * 0.017, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Highlight down one side of the bulb for roundness
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.beginPath();
        ctx.ellipse(-bulbWidth * 0.2, bulbY, bulbWidth * 0.12, (tipY - neckY) * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
