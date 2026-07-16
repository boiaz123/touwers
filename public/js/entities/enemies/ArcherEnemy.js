import { BaseEnemy } from './BaseEnemy.js';
import { drawTwoSegmentLimb, computeWalkCycle, mirroredLimbAngle, kneeFlex, solveLegIK } from './HumanoidLimbRenderer.js';

export class ArcherEnemy extends BaseEnemy {
    static BASE_STATS = {
        health: 120,
        speed: 75,
        armour: 8,
        magicResistance: 0
    };

    constructor(path, health_multiplier = 1.0, speed = null, armour = null, magicResistance = null) {
        const baseStats = ArcherEnemy.BASE_STATS;
        const actualSpeed = speed !== null ? speed : baseStats.speed;
        const actualArmour = armour !== null ? armour : baseStats.armour;
        const actualMagicResistance = magicResistance !== null ? magicResistance : baseStats.magicResistance;

        super(path, baseStats.health * health_multiplier, actualSpeed, actualArmour, actualMagicResistance);
        this.tunicColor = '#2D5016'; // Dark green ranger tunic

        this.attackDamage = 3;
        this.attackSpeed = 0.5;

        this._tunicLightColorStr = this.lightenColor(this.tunicColor, 0.3);
        this._tunicDarkColorStr = this.darkenColor(this.tunicColor, 0.25);

        // Set by EnemyRenderAdapter once it has synced this enemy via Pixi (hit splatters
        // still draw here regardless - not yet migrated). No static structure - the whole
        // figure animates continuously, so everything lives in renderDynamicParts.
        this.skipCanvas2DBodyRender = false;
    }

    render(ctx) {
        // baseSize depends on ctx.canvas.width (real screen resolution) - computed once
        // here, with a real ctx, and cached on the instance so _syncEnemyPixi
        // (GameplayState) can reuse the exact same value for the Pixi path.
        const baseSize = Math.max(6, Math.min(14, ctx.canvas.width / 150));
        this._lastRenderSize = baseSize;

        if (!this.skipCanvas2DBodyRender) {
            this.renderDynamicParts(ctx, baseSize);
        }

        // Render hit splatters - not yet migrated
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
        const anim = computeWalkCycle(this.animationTime, this.animationPhaseOffset, 8);

        // Enemy shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + baseSize * 1.6, baseSize * 0.9, baseSize * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(this.x, this.y + anim.bodyBob);

        // --- LEGS: IK-based foot placement so feet actually lift off the ground ---
        const legUpper = baseSize * 0.45;
        const legLower = baseSize * 0.42;
        const legHipY  = baseSize * 0.35;
        const groundY  = legHipY + (legUpper + legLower) * 0.96;
        const strideX  = baseSize * 0.18;
        const liftY    = baseSize * 0.22;

        const leftFootX = -baseSize * 0.34 + anim.legSwing * strideX;
        const leftFootY = groundY - kneeFlex(anim, false) * liftY;
        const leftAngles = solveLegIK(-baseSize * 0.34, legHipY, leftFootX, leftFootY, legUpper, legLower, -1);
        const leftLeg = drawTwoSegmentLimb(
            ctx, -baseSize * 0.34, legHipY,
            leftAngles.upperAngle, legUpper, leftAngles.lowerAngle, legLower,
            { limbColor: '#2F2F2F', padColor: '#1C1C1C', limbWidth: baseSize * 0.25, padRadius: baseSize * 0.17, shadowColor: 'rgba(0,0,0,0.2)' }
        );

        const rightFootX = baseSize * 0.34 - anim.legSwing * strideX;
        const rightFootY = groundY - kneeFlex(anim, true) * liftY;
        const rightAngles = solveLegIK(baseSize * 0.34, legHipY, rightFootX, rightFootY, legUpper, legLower, -1);
        const rightLeg = drawTwoSegmentLimb(
            ctx, baseSize * 0.34, legHipY,
            rightAngles.upperAngle, legUpper, rightAngles.lowerAngle, legLower,
            { limbColor: '#2F2F2F', padColor: '#1C1C1C', limbWidth: baseSize * 0.25, padRadius: baseSize * 0.17, shadowColor: 'rgba(0,0,0,0.2)' }
        );

        // --- TUNIC (gradient-shaded silhouette) ---
        if (!this._tunicGrad || this._gradBaseSize !== baseSize || this._gradCtx !== ctx) {
            this._gradCtx = ctx;
            this._gradBaseSize = baseSize;
            this._tunicGrad = ctx.createLinearGradient(-baseSize * 0.6, -baseSize * 0.8, baseSize * 0.6, baseSize * 0.4);
            this._tunicGrad.addColorStop(0, this._tunicLightColorStr);
            this._tunicGrad.addColorStop(0.45, this.tunicColor);
            this._tunicGrad.addColorStop(1, this._tunicDarkColorStr);
        }

        ctx.fillStyle = this._tunicGrad;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.55, -baseSize * 0.75);
        ctx.lineTo(baseSize * 0.55, -baseSize * 0.75);
        ctx.lineTo(baseSize * 0.6, baseSize * 0.4);
        ctx.lineTo(-baseSize * 0.6, baseSize * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = this._tunicDarkColorStr;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Center seam
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(0, -baseSize * 0.75);
        ctx.lineTo(0, baseSize * 0.35);
        ctx.stroke();

        // Ranger belt/waist detail
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(-baseSize * 0.62, -baseSize * 0.15, baseSize * 1.24, baseSize * 0.25);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.62, -baseSize * 0.15);
        ctx.lineTo(baseSize * 0.62, -baseSize * 0.15);
        ctx.stroke();

        // --- QUIVER (over the back shoulder - ranger detail) ---
        ctx.save();
        ctx.translate(baseSize * 0.42, -baseSize * 0.55);
        ctx.rotate(-0.3);
        ctx.fillStyle = '#5A4632';
        ctx.fillRect(-baseSize * 0.16, -baseSize * 0.15, baseSize * 0.32, baseSize * 0.75);
        ctx.strokeStyle = '#3a2a1a';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(-baseSize * 0.16, -baseSize * 0.15, baseSize * 0.32, baseSize * 0.75);
        // Arrow fletchings poking out the top
        for (let i = -1; i <= 1; i++) {
            ctx.strokeStyle = i === 0 ? '#C0392B' : '#D9C4A8';
            ctx.lineWidth = baseSize * 0.05;
            ctx.beginPath();
            ctx.moveTo(i * baseSize * 0.08, -baseSize * 0.15);
            ctx.lineTo(i * baseSize * 0.08, -baseSize * 0.5);
            ctx.stroke();
        }
        ctx.restore();

        // --- LEFT ARM ---
        const leftArmAngle = mirroredLimbAngle(0.205, anim.legSwing, 0.21, false);
        drawTwoSegmentLimb(
            ctx, -baseSize * 0.5, -baseSize * 0.35,
            leftArmAngle, baseSize * 0.42,
            leftArmAngle - 0.1, baseSize * 0.4,
            { limbColor: '#D5C0A0', padColor: '#DDBEA9', limbWidth: baseSize * 0.3, padRadius: baseSize * 0.16 }
        );

        // --- RIGHT ARM WITH BOW (held steady/vertical, not swinging) ---
        const rightShoulderX = baseSize * 0.5;
        const rightShoulderY = -baseSize * 0.35;
        const bowDrawAngle = 0;
        const rightHand = drawTwoSegmentLimb(
            ctx, rightShoulderX, rightShoulderY,
            bowDrawAngle, baseSize * 0.35,
            bowDrawAngle, baseSize * 0.4,
            { limbColor: '#D5C0A0', padColor: '#DDBEA9', limbWidth: baseSize * 0.3, padRadius: baseSize * 0.16 }
        );

        // Draw bow
        this.drawBow(ctx, rightHand.endX, rightHand.endY, baseSize, bowDrawAngle);

        // --- HEAD ---
        ctx.fillStyle = '#D5C0A0';
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.2, baseSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#B8956A';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // --- RANGER HAT (Green pointed hood/coif) ---
        if (!this._hoodGrad || this._hoodGradBaseSize !== baseSize || this._hoodGradCtx !== ctx) {
            this._hoodGradCtx = ctx;
            this._hoodGradBaseSize = baseSize;
            this._hoodGrad = ctx.createLinearGradient(-baseSize * 0.6, -baseSize * 1.2, baseSize * 0.6, -baseSize * 1.65);
            this._hoodGrad.addColorStop(0, '#2A4F2A');
            this._hoodGrad.addColorStop(1, '#122912');
        }

        ctx.fillStyle = this._hoodGrad;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.2, baseSize * 0.6, Math.PI, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this._hoodGrad;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.6, -baseSize * 1.2);
        ctx.lineTo(baseSize * 0.6, -baseSize * 1.2);
        ctx.lineTo(0, -baseSize * 1.65);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#0F2F0F';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.6, -baseSize * 1.2);
        ctx.lineTo(0, -baseSize * 1.65);
        ctx.lineTo(baseSize * 0.6, -baseSize * 1.2);
        ctx.stroke();

        // Hat band/trim
        ctx.fillStyle = '#8B7355';
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 1.2, baseSize * 0.62, baseSize * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 1.2, baseSize * 0.62, baseSize * 0.12, 0, 0, Math.PI * 2);
        ctx.stroke();

        // --- BOOTS (drawn after legs so they cap the feet) ---
        ctx.fillStyle = '#1C1C1C';
        ctx.beginPath();
        ctx.ellipse(leftLeg.endX, leftLeg.endY + baseSize * 0.08, baseSize * 0.2, baseSize * 0.15, leftAngles.lowerAngle - Math.PI / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(rightLeg.endX, rightLeg.endY + baseSize * 0.08, baseSize * 0.2, baseSize * 0.15, rightAngles.lowerAngle - Math.PI / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Health bar — skipped during Mode A baking (adapter draws it separately).
        if (!this._baking) {
            this.renderHealthBar(ctx, baseSize);
        }
    }

    attackCastle(castle, deltaTime) {
        if (!this.isAttackingCastle || !castle) return 0;

        this.attackCooldown -= deltaTime;

        if (this.attackCooldown <= 0) {
            const damage = this.attackDamage;
            castle.takeDamage(damage);
            this.attackCooldown = 1.0 / this.attackSpeed;
            return damage;
        }

        return 0;
    }

    drawBow(ctx, handX, handY, baseSize, armAngle) {
        ctx.save();
        ctx.translate(handX, handY);
        ctx.rotate(armAngle);

        // Bow grip - wooden center with leather wrap
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(-baseSize * 0.2, -baseSize * 0.3, baseSize * 0.4, baseSize * 0.6);

        // Grip leather wrapping
        ctx.fillStyle = '#6B5310';
        ctx.fillRect(-baseSize * 0.2, -baseSize * 0.3, baseSize * 0.4, baseSize * 0.12);
        ctx.fillRect(-baseSize * 0.2, baseSize * 0.05, baseSize * 0.4, baseSize * 0.12);

        // Grip highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(-baseSize * 0.15, -baseSize * 0.25, baseSize * 0.15, baseSize * 0.5);

        // Main bow body - filled shape for better visibility
        // Upper limb
        ctx.fillStyle = '#A0826D';
        ctx.beginPath();
        ctx.moveTo(0, -baseSize * 0.3);
        ctx.quadraticCurveTo(-baseSize * 1.0, -baseSize * 1.0, -baseSize * 0.7, -baseSize * 1.4);
        ctx.quadraticCurveTo(-baseSize * 0.6, -baseSize * 1.3, -baseSize * 0.2, -baseSize * 1.1);
        ctx.closePath();
        ctx.fill();

        // Lower limb
        ctx.beginPath();
        ctx.moveTo(0, baseSize * 0.3);
        ctx.quadraticCurveTo(-baseSize * 1.0, baseSize * 1.0, -baseSize * 0.7, baseSize * 1.4);
        ctx.quadraticCurveTo(-baseSize * 0.6, baseSize * 1.3, -baseSize * 0.2, baseSize * 1.1);
        ctx.closePath();
        ctx.fill();

        // Bow outline - darker color for definition
        ctx.strokeStyle = '#6B5310';
        ctx.lineWidth = baseSize * 0.15;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Upper limb outline
        ctx.beginPath();
        ctx.moveTo(0, -baseSize * 0.3);
        ctx.quadraticCurveTo(-baseSize * 1.0, -baseSize * 1.0, -baseSize * 0.7, -baseSize * 1.4);
        ctx.stroke();

        // Lower limb outline
        ctx.beginPath();
        ctx.moveTo(0, baseSize * 0.3);
        ctx.quadraticCurveTo(-baseSize * 1.0, baseSize * 1.0, -baseSize * 0.7, baseSize * 1.4);
        ctx.stroke();

        // Bowstring - tan/beige color, connecting the tips
        ctx.strokeStyle = '#D2B48C';
        ctx.lineWidth = baseSize * 0.18;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // String from upper tip to lower tip - tight curve following bow shape
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.7, -baseSize * 1.4);
        ctx.quadraticCurveTo(-baseSize * 0.9, 0, -baseSize * 0.7, baseSize * 1.4);
        ctx.stroke();

        // Bowstring highlight for depth
        ctx.strokeStyle = '#F5DEB3';
        ctx.lineWidth = baseSize * 0.08;

        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.7, -baseSize * 1.4);
        ctx.quadraticCurveTo(-baseSize * 0.9, 0, -baseSize * 0.7, baseSize * 1.4);
        ctx.stroke();

        // Nocking point (where arrow sits on string)
        ctx.fillStyle = '#C19A6B';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.75, 0, baseSize * 0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(-baseSize * 0.75, 0, baseSize * 0.15, 0, Math.PI * 2);
        ctx.stroke();

        // Bow tips - reinforced nocks
        ctx.fillStyle = '#D4AF37';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.7, -baseSize * 1.4, baseSize * 0.18, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(-baseSize * 0.7, baseSize * 1.4, baseSize * 0.18, 0, Math.PI * 2);
        ctx.fill();

        // Tip outlines
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(-baseSize * 0.7, -baseSize * 1.4, baseSize * 0.18, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(-baseSize * 0.7, baseSize * 1.4, baseSize * 0.18, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}
