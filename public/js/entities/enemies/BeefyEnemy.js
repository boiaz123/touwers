import { BaseEnemy } from './BaseEnemy.js';
import { drawTwoSegmentLimb, computeWalkCycle, mirroredLimbAngle, kneeFlex, solveLegIK } from './HumanoidLimbRenderer.js';

export class BeefyEnemy extends BaseEnemy {
    static BASE_STATS = {
        health: 400,
        speed: 40,
        armour: 45,
        magicResistance: 0
    };

    constructor(path, health_multiplier = 1.0, speed = null, armour = null, magicResistance = null) {
        const baseStats = BeefyEnemy.BASE_STATS;
        const actualSpeed = speed !== null ? speed : baseStats.speed;
        const actualArmour = armour !== null ? armour : baseStats.armour;
        const actualMagicResistance = magicResistance !== null ? magicResistance : baseStats.magicResistance;

        super(path, baseStats.health * health_multiplier, actualSpeed, actualArmour, actualMagicResistance);
        this.lootDropChance = 0.05; // 5% chance to drop loot
        this.tunicColor = this.getRandomTunicColor();
        this.sizeMultiplier = 1.2;

        this.attackDamage = 9;
        this.attackSpeed = 0.8;

        // Rendering optimization: Cache pre-calculated color variants
        this.cachedColorVariants = this.getColorVariants();

        // Pre-calculate colors to avoid repeated color manipulation
        this.darkenedTunic = this.darkenColor(this.tunicColor, 0.25);
        this.lightenedTunic = this.lightenColor(this.tunicColor, 0.25);

        // Cache for armor rivets positions (relative to baseSize)
        this.rivetPositions = [];
        for (let i = -1; i <= 1; i++) {
            for (let j = 0; j < 3; j++) {
                this.rivetPositions.push({ i, j });
            }
        }

        // Set by EnemyRenderAdapter once it has synced this enemy via Pixi (hit splatters
        // still draw here regardless - not yet migrated). No static structure - the whole
        // figure animates continuously, so everything lives in renderDynamicParts.
        this.skipCanvas2DBodyRender = false;
    }

    /** Slower gait than the default (see renderDynamicParts' animTime) - told to
     *  EnemyRenderAdapter's Mode A frame-baker so it samples/plays back a full cycle at
     *  this rate instead of assuming every enemy type walks at the default frequency. */
    getWalkFrequency() {
        return 6.5;
    }

    /** Per-instance tunic color variant, so baked layers (if any subclass adds them) don't collide across different-colored instances. */
    getRenderVariantKey() {
        return this.tunicColor;
    }

    getRandomTunicColor() {
        const tunicColors = [
            '#5C2E0F', '#1A3A52', '#8B0000', '#1C1C1C', '#2D3E1F', '#4B0082'
        ];
        return tunicColors[Math.floor(Math.random() * tunicColors.length)];
    }

    getColorVariants() {
        // Pre-calculate all color variants to avoid repeated calculations
        return {
            headSkin: '#C4A575',
            headGradientLight: '#E8D4B8',
            headGradientMid: '#DDBEA9',
            headGradientDark: '#C9A876',
            headStroke: '#B8956A',
            helmetLight: '#787878',
            helmetMid: '#4a4a4a',
            helmetDark: '#2a2a2a',
            helmetNose: '#4a4a4a',
            helmetOutline: '#2F2F2F',
            skinTone: '#E8D4B8',
            gauntlet: '#4a4a4a',
            gauntletStroke: '#2F2F2F',
            swordLight: '#A9A9A9',
            swordMid: '#C0C0C0',
            swordDark: '#808080',
            guardGold: '#D4AF37',
            guardGoldStroke: '#8B7500',
            bootColor: '#0a0a0a',
            legStroke: '#2F2F2F'
        };
    }

    render(ctx) {
        // baseSize depends on ctx.canvas.width (real screen resolution) - computed once
        // here, with a real ctx, and cached on the instance so _syncEnemyPixi
        // (GameplayState) can reuse the exact same value for the Pixi path.
        const baseSize = Math.max(7.2, Math.min(16.8, ctx.canvas.width / 150)) * this.sizeMultiplier;
        this._lastRenderSize = baseSize;

        if (!this.skipCanvas2DBodyRender) {
            this.renderDynamicParts(ctx, baseSize);
        }

        // Render hit splatters only if any exist - not yet migrated
        if (this.hitSplatters && this.hitSplatters.length > 0) {
            for (const splatter of this.hitSplatters) {
                splatter.render(ctx);
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
     * Strategy A (baked): only runs live during Mode A's one-time bake pass
     * (EnemyRenderAdapter.js), so gradients/extra detail here cost nothing per
     * frame at runtime - a texture swap is all that happens after baking.
     */
    renderDynamicParts(ctx, baseSize) {
        // Slower, heavier gait (getWalkFrequency = 6.5) with a slightly bigger stomp bob.
        const anim = computeWalkCycle(this.animationTime, this.animationPhaseOffset, 6.5);
        const v = this.cachedColorVariants;

        // Enemy shadow - larger
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + baseSize * 1.6, baseSize * 1.0, baseSize * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(this.x, this.y + anim.bodyBob * 1.3);

        // --- LEGS: IK-based foot placement so feet actually lift off the ground ---
        const legUpper = baseSize * 0.50;
        const legLower = baseSize * 0.46;
        const legHipY  = baseSize * 0.38;
        const groundY  = legHipY + (legUpper + legLower) * 0.96;
        const strideX  = baseSize * 0.18;
        const liftY    = baseSize * 0.20;

        const leftFootX = -baseSize * 0.4 + anim.legSwing * strideX;
        const leftFootY = groundY - kneeFlex(anim, false) * liftY;
        const leftAngles = solveLegIK(-baseSize * 0.4, legHipY, leftFootX, leftFootY, legUpper, legLower, -1);
        const leftLeg = drawTwoSegmentLimb(
            ctx, -baseSize * 0.4, legHipY,
            leftAngles.upperAngle, legUpper, leftAngles.lowerAngle, legLower,
            { limbColor: v.legStroke, padColor: v.bootColor, limbWidth: baseSize * 0.28, padRadius: baseSize * 0.18, shadowColor: 'rgba(0,0,0,0.2)' }
        );

        const rightFootX = baseSize * 0.4 - anim.legSwing * strideX;
        const rightFootY = groundY - kneeFlex(anim, true) * liftY;
        const rightAngles = solveLegIK(baseSize * 0.4, legHipY, rightFootX, rightFootY, legUpper, legLower, -1);
        const rightLeg = drawTwoSegmentLimb(
            ctx, baseSize * 0.4, legHipY,
            rightAngles.upperAngle, legUpper, rightAngles.lowerAngle, legLower,
            { limbColor: v.legStroke, padColor: v.bootColor, limbWidth: baseSize * 0.28, padRadius: baseSize * 0.18, shadowColor: 'rgba(0,0,0,0.2)' }
        );

        // --- TUNIC (gradient-shaded bulk instead of a flat rectangle) ---
        if (!this._tunicGrad || this._gradBaseSize !== baseSize || this._gradCtx !== ctx) {
            this._gradCtx = ctx;
            this._gradBaseSize = baseSize;
            this._tunicGrad = ctx.createLinearGradient(-baseSize * 0.7, -baseSize * 0.88, baseSize * 0.7, baseSize * 0.44);
            this._tunicGrad.addColorStop(0, this.lightenedTunic);
            this._tunicGrad.addColorStop(0.45, this.tunicColor);
            this._tunicGrad.addColorStop(1, this.darkenedTunic);
        }

        ctx.fillStyle = this._tunicGrad;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.6, -baseSize * 0.88);
        ctx.lineTo(baseSize * 0.6, -baseSize * 0.88);
        ctx.lineTo(baseSize * 0.62, baseSize * 0.44);
        ctx.lineTo(-baseSize * 0.62, baseSize * 0.44);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1.0;
        ctx.stroke();

        // Center seam
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, -baseSize * 0.88);
        ctx.lineTo(0, baseSize * 0.44);
        ctx.stroke();

        // --- ARMOR CHEST PLATE (gradient metal sheen) ---
        if (!this._plateGrad || this._plateGradBaseSize !== baseSize || this._plateGradCtx !== ctx) {
            this._plateGradCtx = ctx;
            this._plateGradBaseSize = baseSize;
            this._plateGrad = ctx.createLinearGradient(-baseSize * 0.6, -baseSize * 0.7, baseSize * 0.6, baseSize * 0.2);
            this._plateGrad.addColorStop(0, v.helmetLight);
            this._plateGrad.addColorStop(0.5, v.helmetMid);
            this._plateGrad.addColorStop(1, v.helmetDark);
        }
        ctx.fillStyle = this._plateGrad;
        ctx.fillRect(-baseSize * 0.6, -baseSize * 0.7, baseSize * 1.2, baseSize * 0.9);
        ctx.strokeStyle = v.helmetOutline;
        ctx.lineWidth = 0.8;
        ctx.strokeRect(-baseSize * 0.6, -baseSize * 0.7, baseSize * 1.2, baseSize * 0.9);

        // Armor rivets - pre-calculated
        ctx.fillStyle = '#3a3a3a';
        for (const rivet of this.rivetPositions) {
            ctx.beginPath();
            ctx.arc(
                rivet.i * baseSize * 0.35,
                -baseSize * 0.5 + rivet.j * baseSize * 0.35,
                0.7,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        // Side highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(-baseSize * 0.62, -baseSize * 0.8, baseSize * 0.25, baseSize * 0.95);

        // Belt (just below the chest plate at y=0.2)
        ctx.fillStyle = '#1E1008';
        ctx.fillRect(-baseSize * 0.62, baseSize * 0.2, baseSize * 1.24, baseSize * 0.14);
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(-baseSize * 0.62, baseSize * 0.2, baseSize * 1.24, baseSize * 0.14);
        ctx.fillStyle = '#D4AF37';
        ctx.fillRect(-baseSize * 0.09, baseSize * 0.21, baseSize * 0.18, baseSize * 0.10);
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(-baseSize * 0.09, baseSize * 0.21, baseSize * 0.18, baseSize * 0.10);

        // --- LEFT ARM --- Elbow bends slightly outward/backward so the forearm hangs
        // naturally at the side rather than curling toward the centerline.
        const leftArmAngle = mirroredLimbAngle(0.18, anim.legSwing, 0.28, false);
        const leftArm = drawTwoSegmentLimb(
            ctx, -baseSize * 0.6, -baseSize * 0.55,
            leftArmAngle, baseSize * 0.42,
            leftArmAngle - 0.16, baseSize * 0.36,
            { limbColor: v.skinTone, padColor: 'rgba(221, 190, 169, 0.95)', limbWidth: baseSize * 0.26, padRadius: baseSize * 0.13 }
        );
        ctx.fillStyle = v.skinTone;
        ctx.beginPath();
        ctx.arc(leftArm.elbowX, leftArm.elbowY, baseSize * 0.12, 0, Math.PI * 2);
        ctx.fill();

        // --- RIGHT ARM WITH SWORD --- Minimal swing; elbow mirrors left (bends outward).
        const rightArmAngle = mirroredLimbAngle(0.18, anim.legSwing, 0.05, true);
        const rightHand = drawTwoSegmentLimb(
            ctx, baseSize * 0.6, -baseSize * 0.55,
            rightArmAngle, baseSize * 0.42,
            rightArmAngle + 0.16, baseSize * 0.36,
            { limbColor: v.skinTone, padColor: v.gauntlet, limbWidth: baseSize * 0.26, padRadius: baseSize * 0.13 }
        );
        ctx.fillStyle = v.skinTone;
        ctx.beginPath();
        ctx.arc(rightHand.elbowX, rightHand.elbowY, baseSize * 0.12, 0, Math.PI * 2);
        ctx.fill();

        // --- SWORD ---
        const swordAngle = -Math.PI / 2 + 0.3;
        const swordLength = baseSize * 1.5;
        const swordTipX = rightHand.endX + Math.cos(swordAngle) * swordLength;
        const swordTipY = rightHand.endY + Math.sin(swordAngle) * swordLength;

        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = baseSize * 0.22;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(rightHand.endX + 0.5, rightHand.endY + 0.5);
        ctx.lineTo(swordTipX + 0.5, swordTipY + 0.5);
        ctx.stroke();

        ctx.strokeStyle = v.swordMid;
        ctx.lineWidth = baseSize * 0.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(rightHand.endX, rightHand.endY);
        ctx.lineTo(swordTipX, swordTipY);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = baseSize * 0.06;
        ctx.beginPath();
        ctx.moveTo(rightHand.endX, rightHand.endY);
        ctx.lineTo(swordTipX, swordTipY);
        ctx.stroke();

        // Sword guard (crossbar) + pommel
        ctx.save();
        ctx.translate(rightHand.endX, rightHand.endY);
        ctx.rotate(swordAngle);
        ctx.fillStyle = v.guardGold;
        ctx.fillRect(-baseSize * 0.25, -baseSize * 0.07, baseSize * 0.5, baseSize * 0.14);
        ctx.strokeStyle = v.guardGoldStroke;
        ctx.lineWidth = 0.8;
        ctx.strokeRect(-baseSize * 0.25, -baseSize * 0.07, baseSize * 0.5, baseSize * 0.14);
        ctx.beginPath();
        ctx.arc(0, baseSize * 0.15, baseSize * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // --- HEAD (soft gradient) ---
        if (!this._headGrad || this._headGradBaseSize !== baseSize || this._headGradCtx !== ctx) {
            this._headGradCtx = ctx;
            this._headGradBaseSize = baseSize;
            this._headGrad = ctx.createRadialGradient(-baseSize * 0.18, -baseSize * 1.48, baseSize * 0.1, 0, -baseSize * 1.35, baseSize * 0.6);
            this._headGrad.addColorStop(0, v.headGradientLight);
            this._headGrad.addColorStop(1, v.headSkin);
        }
        ctx.fillStyle = this._headGrad;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.35, baseSize * 0.58, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = v.headStroke;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // --- BRONZE NASAL HELMET (fixed color - all beefy enemies wear the same) ---
        if (!this._helmetCapGrad || this._helmetCapGradSize !== baseSize || this._helmetCapGradCtx !== ctx) {
            this._helmetCapGradCtx = ctx;
            this._helmetCapGradSize = baseSize;
            this._helmetCapGrad = ctx.createLinearGradient(-baseSize * 0.5, -baseSize * 1.9, baseSize * 0.3, -baseSize * 1.3);
            this._helmetCapGrad.addColorStop(0, '#C8922A');
            this._helmetCapGrad.addColorStop(0.5, '#8B6520');
            this._helmetCapGrad.addColorStop(1, '#4A3010');
        }

        // Dome - slightly proud of the head for a proper metal helmet fit
        ctx.fillStyle = this._helmetCapGrad;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.35, baseSize * 0.64, Math.PI, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#3A2508';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Brow rim
        ctx.fillStyle = '#5C3D0A';
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 1.35, baseSize * 0.68, baseSize * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3A2508';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Nose guard (tapers toward the bottom)
        ctx.fillStyle = '#8B6520';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.05, -baseSize * 1.35);
        ctx.lineTo(baseSize * 0.05, -baseSize * 1.35);
        ctx.lineTo(baseSize * 0.035, -baseSize * 1.05);
        ctx.lineTo(-baseSize * 0.035, -baseSize * 1.05);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#3A2508';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Specular highlight
        ctx.fillStyle = 'rgba(255, 200, 80, 0.18)';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.22, -baseSize * 1.6, baseSize * 0.14, 0, Math.PI * 2);
        ctx.fill();

        // Thick beard covering the lower face - the defining "brute" silhouette element.
        ctx.fillStyle = '#4a3220';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.44, -baseSize * 1.28);
        ctx.quadraticCurveTo(-baseSize * 0.5, -baseSize * 0.95, -baseSize * 0.13, -baseSize * 0.76);
        ctx.quadraticCurveTo(0, -baseSize * 0.68, baseSize * 0.13, -baseSize * 0.76);
        ctx.quadraticCurveTo(baseSize * 0.5, -baseSize * 0.95, baseSize * 0.44, -baseSize * 1.28);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#2f2010';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Beard texture strands
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 0.6;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(i * baseSize * 0.14, -baseSize * 1.15);
            ctx.lineTo(i * baseSize * 0.09, -baseSize * 0.82);
            ctx.stroke();
        }

        // --- BOOTS (drawn after legs so they cap the feet) ---
        ctx.fillStyle = v.bootColor;
        ctx.beginPath();
        ctx.ellipse(leftLeg.endX, leftLeg.endY + baseSize * 0.10, baseSize * 0.18, baseSize * 0.14, leftAngles.lowerAngle - Math.PI / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(rightLeg.endX, rightLeg.endY + baseSize * 0.10, baseSize * 0.18, baseSize * 0.14, rightAngles.lowerAngle - Math.PI / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Health bar — skipped during Mode A baking (adapter draws it separately).
        if (!this._baking) {
            this.renderHealthBar(ctx, baseSize, { widthMul: 3.6, heightMul: 0.4, yOffsetMul: -2.5, strokeWidth: 0.8 });
        }
    }

    takeDamage(amount, armorPiercingPercent = 0, damageType = 'physical', followTarget = false) {
        return super.takeDamage(amount, armorPiercingPercent, damageType, followTarget);
    }
}
