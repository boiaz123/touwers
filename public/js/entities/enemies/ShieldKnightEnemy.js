import { BaseEnemy } from './BaseEnemy.js';
import { drawTwoSegmentLimb, computeWalkCycle, kneeFlex } from './HumanoidLimbRenderer.js';

export class ShieldKnightEnemy extends BaseEnemy {
    static BASE_STATS = {
        health: 780,
        speed: 40,
        armour: 60,
        magicResistance: -0.2
    };

    constructor(path, health_multiplier = 1.0, speed = null, armour = null, magicResistance = null) {
        const baseStats = ShieldKnightEnemy.BASE_STATS;
        const actualSpeed = speed !== null ? speed : baseStats.speed;
        const actualArmour = armour !== null ? armour : baseStats.armour;
        const actualMagicResistance = magicResistance !== null ? magicResistance : baseStats.magicResistance;

        super(path, baseStats.health * health_multiplier, actualSpeed, actualArmour, actualMagicResistance);
        this.lootDropChance = 0.04; // 4% chance to drop loot
        this.armorColor = this.getRandomArmorColor();
        this.sizeMultiplier = 1.05;

        this.attackDamage = 5;
        this.attackSpeed = 0.6;

        // Set by EnemyRenderAdapter once it has synced this enemy via Pixi (hit splatters
        // still draw here regardless - not yet migrated). No static structure - the whole
        // figure animates continuously, so everything lives in renderDynamicParts.
        this.skipCanvas2DBodyRender = false;
    }

    /** Per-instance armor color variant, so baked layers (if any subclass adds them) don't collide across different-colored instances. */
    getRenderVariantKey() {
        return this.armorColor;
    }

    /** Slower gait than the default (see renderDynamicParts' animTime) - told to
     *  EnemyRenderAdapter's Mode A frame-baker so it samples/plays back a full cycle at
     *  this rate instead of assuming every enemy type walks at the default frequency. */
    getWalkFrequency() {
        return 7.5;
    }

    getRandomArmorColor() {
        const armorColors = [
            '#4A5568', '#2C3E50', '#34495E', '#1A252F', '#3E4C59', '#556B82'
        ];
        return armorColors[Math.floor(Math.random() * armorColors.length)];
    }

    render(ctx) {
        // baseSize depends on ctx.canvas.width (real screen resolution) - computed once
        // here, with a real ctx, and cached on the instance so _syncEnemyPixi
        // (GameplayState) can reuse the exact same value for the Pixi path.
        const baseSize = Math.max(6.3, Math.min(14.7, ctx.canvas.width / 150)) * this.sizeMultiplier;
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
        const anim = computeWalkCycle(this.animationTime, this.animationPhaseOffset, 7.5);

        // Enemy shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + baseSize * 1.5, baseSize * 0.95, baseSize * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(this.x, this.y + anim.bodyBob * 0.83);

        // --- LEGS WITH LEG ARMOR (small hip swing + wide stance, like KnightEnemy, so
        // the feet keep clearance and never cross the centerline). Stance widened
        // further (0.34->0.4) and swing/knee-bend both cut down (->0.14) - even the
        // "wider" stance still let the rigid straight leg (the moment knee bend is
        // zero, at the swing extremes) reach past centerline once the boot radius is
        // added on top - the boot itself needs the clearance, not just the ankle. ---
        const leftLegAngle = Math.PI / 2 + anim.legSwing * 0.14;
        const rightLegAngle = Math.PI / 2 - anim.legSwing * 0.14;

        const leftLeg = drawTwoSegmentLimb(
            ctx, -baseSize * 0.4, baseSize * 0.35,
            leftLegAngle, baseSize * 0.42,
            leftLegAngle - kneeFlex(anim, false) * 0.14, baseSize * 0.43,
            { limbColor: '#4A5568', padColor: '#2a2a2a', limbWidth: baseSize * 0.28, padRadius: baseSize * 0.13, shadowColor: 'rgba(0,0,0,0.2)' }
        );
        const rightLeg = drawTwoSegmentLimb(
            ctx, baseSize * 0.4, baseSize * 0.35,
            rightLegAngle, baseSize * 0.42,
            rightLegAngle + kneeFlex(anim, true) * 0.14, baseSize * 0.43,
            { limbColor: '#4A5568', padColor: '#2a2a2a', limbWidth: baseSize * 0.28, padRadius: baseSize * 0.13, shadowColor: 'rgba(0,0,0,0.2)' }
        );

        // Knee joints
        ctx.fillStyle = '#5A6B7A';
        ctx.beginPath();
        ctx.arc(leftLeg.elbowX, leftLeg.elbowY, baseSize * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(rightLeg.elbowX, rightLeg.elbowY, baseSize * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(leftLeg.elbowX, leftLeg.elbowY, baseSize * 0.16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(rightLeg.elbowX, rightLeg.elbowY, baseSize * 0.16, 0, Math.PI * 2);
        ctx.stroke();

        // --- ARMOR BODY PLATE (gradient metal sheen) ---
        if (!this._plateGrad || this._plateGradBaseSize !== baseSize || this._plateGradCtx !== ctx) {
            this._plateGradCtx = ctx;
            this._plateGradBaseSize = baseSize;
            this._plateGrad = ctx.createLinearGradient(-baseSize * 0.65, -baseSize * 0.7, baseSize * 0.65, baseSize * 0.35);
            this._plateGrad.addColorStop(0, this.lightenColor(this.armorColor, 0.3));
            this._plateGrad.addColorStop(0.5, this.armorColor);
            this._plateGrad.addColorStop(1, this.darkenColor(this.armorColor, 0.3));
        }
        ctx.fillStyle = this._plateGrad;
        ctx.fillRect(-baseSize * 0.65, -baseSize * 0.7, baseSize * 1.3, baseSize * 1.05);

        // Armor outline
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-baseSize * 0.65, -baseSize * 0.7, baseSize * 1.3, baseSize * 1.05);

        // --- SHOULDER PAULDRONS ---
        ctx.fillStyle = '#5A6B7A';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.7, -baseSize * 0.4, baseSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(baseSize * 0.7, -baseSize * 0.4, baseSize * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(-baseSize * 0.7, -baseSize * 0.4, baseSize * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(baseSize * 0.7, -baseSize * 0.4, baseSize * 0.3, 0, Math.PI * 2);
        ctx.stroke();

        // Pauldron highlight
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.78, -baseSize * 0.48, baseSize * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(baseSize * 0.62, -baseSize * 0.48, baseSize * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // --- ARMOR RIVETS (MINIMAL) ---
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        ctx.arc(0, -baseSize * 0.5, 0.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, -baseSize * 0.2, 0.9, 0, Math.PI * 2);
        ctx.fill();

        // --- HEAD WITH CLOSED HELM ---
        ctx.fillStyle = '#C4A575';
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.25, baseSize * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // --- ROUNDED SALLET HELM (gradient blued steel) - deliberately shorter and
        // crestless compared to KnightEnemy's tall great helm, so the two don't read
        // as the same silhouette with a different weapon swapped in. ---
        if (!this._helmGrad || this._helmGradBaseSize !== baseSize || this._helmGradCtx !== ctx) {
            this._helmGradCtx = ctx;
            this._helmGradBaseSize = baseSize;
            this._helmGrad = ctx.createLinearGradient(-baseSize * 0.62, -baseSize * 1.75, baseSize * 0.62, -baseSize * 0.6);
            this._helmGrad.addColorStop(0, '#7a8aa8');
            this._helmGrad.addColorStop(0.5, '#3f4a5a');
            this._helmGrad.addColorStop(1, '#232a33');
        }
        ctx.fillStyle = this._helmGrad;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.22, baseSize * 0.62, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#161a1f';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.22, baseSize * 0.62, 0, Math.PI * 2);
        ctx.stroke();

        // Rear neck guard flare (rounded skirt at the back of the helm) instead of a
        // tall crest - reads as a compact, mobile sallet rather than a great helm.
        ctx.fillStyle = '#2a323d';
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.78, baseSize * 0.5, baseSize * 0.14, 0, 0, Math.PI);
        ctx.fill();

        // Horizontal visor slit only (no cross-shaped nose guard, unlike KnightEnemy)
        ctx.fillStyle = '#14171a';
        ctx.fillRect(-baseSize * 0.36, -baseSize * 1.26, baseSize * 0.72, baseSize * 0.1);

        // Helm detail - cheek guards
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(-baseSize * 0.42, -baseSize * 1.05, baseSize * 0.12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(baseSize * 0.42, -baseSize * 1.05, baseSize * 0.12, 0, Math.PI * 2);
        ctx.stroke();

        // Eye slit glow detail
        ctx.fillStyle = 'rgba(100, 180, 255, 0.35)';
        ctx.fillRect(-baseSize * 0.28, -baseSize * 1.24, baseSize * 0.56, baseSize * 0.06);

        // Rounded rivet studs along the brow (compact-helm detail, distinct from
        // the Knight's ornamental crest)
        ctx.fillStyle = '#8a95a3';
        for (let i = -1; i <= 1; i += 2) {
            ctx.beginPath();
            ctx.arc(i * baseSize * 0.5, -baseSize * 1.5, baseSize * 0.045, 0, Math.PI * 2);
            ctx.fill();
        }

        // --- LEFT ARM WITH SHIELD (defensive stance, gentle idle sway) ---
        const leftShoulderX = -baseSize * 0.65;
        const leftShoulderY = -baseSize * 0.35;
        const leftArmAngle = 0.2 + Math.sin(this.animationTime * 1.5 + this.animationPhaseOffset) * 0.03;

        const leftHand = drawTwoSegmentLimb(
            ctx, leftShoulderX, leftShoulderY,
            leftArmAngle, baseSize * 0.35,
            leftArmAngle, baseSize * 0.42,
            { limbColor: '#C9A876', padColor: '#5A6B7A', limbWidth: baseSize * 0.35, padRadius: baseSize * 0.22 }
        );

        // --- SHIELD ---
        this.drawSimpleShield(ctx, leftHand.endX, leftHand.endY, baseSize);

        // --- RIGHT ARM WITH SCIMITAR (idle sway synced to the stride) ---
        const rightShoulderX = baseSize * 0.65;
        const rightShoulderY = -baseSize * 0.35;
        const rightArmAngle = -0.5 + anim.legSwing * 0.03;

        const rightHand = drawTwoSegmentLimb(
            ctx, rightShoulderX, rightShoulderY,
            rightArmAngle, baseSize * 0.35,
            rightArmAngle, baseSize * 0.42,
            { limbColor: '#C9A876', padColor: '#5A6B7A', limbWidth: baseSize * 0.35, padRadius: baseSize * 0.22 }
        );

        // --- SMALL SINGLE-HANDED SWORD ---
        this.drawSingleHandedSword(ctx, rightHand.endX, rightHand.endY, baseSize, anim.legSwing * 0.4);

        // --- ARMORED BOOTS (drawn after legs so they cap the feet) ---
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.ellipse(leftLeg.endX, leftLeg.endY + baseSize * 0.18, baseSize * 0.2, baseSize * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5A6B7A';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(leftLeg.endX, leftLeg.endY + baseSize * 0.18, baseSize * 0.2, baseSize * 0.16, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.ellipse(rightLeg.endX, rightLeg.endY + baseSize * 0.18, baseSize * 0.2, baseSize * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5A6B7A';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(rightLeg.endX, rightLeg.endY + baseSize * 0.18, baseSize * 0.2, baseSize * 0.16, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();

        // Health bar — skipped during Mode A baking (adapter draws it separately).
        if (!this._baking) {
            this.renderHealthBar(ctx, baseSize, { widthMul: 3.2, heightMul: 0.44, minHeight: 2.2, yOffsetMul: -2.3, strokeWidth: 1.1 });
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

    drawSimpleShield(ctx, handX, handY, baseSize) {
        ctx.save();
        ctx.translate(handX, handY);

        // Shield angle - protective position
        ctx.rotate(-0.25);

        const shieldWidth = baseSize * 0.68;
        const shieldHeight = baseSize * 1.05;

        // Shield body - gradient for a subtle domed-metal look
        if (!this._shieldGrad || this._shieldGradBaseSize !== baseSize || this._shieldGradCtx !== ctx) {
            this._shieldGradCtx = ctx;
            this._shieldGradBaseSize = baseSize;
            this._shieldGrad = ctx.createLinearGradient(-shieldWidth / 2, -shieldHeight / 2, shieldWidth / 2, shieldHeight / 2);
            this._shieldGrad.addColorStop(0, '#a08a76');
            this._shieldGrad.addColorStop(0.5, '#8a7a6a');
            this._shieldGrad.addColorStop(1, '#6a5a4a');
        }

        ctx.fillStyle = this._shieldGrad;
        ctx.beginPath();
        ctx.moveTo(-shieldWidth / 2, -shieldHeight / 2);
        ctx.lineTo(shieldWidth / 2, -shieldHeight / 2);
        ctx.lineTo(shieldWidth / 2, shieldHeight / 2 - baseSize * 0.18);
        ctx.lineTo(0, shieldHeight / 2 + baseSize * 0.18);
        ctx.lineTo(-shieldWidth / 2, shieldHeight / 2 - baseSize * 0.18);
        ctx.closePath();
        ctx.fill();

        // Shield edge
        ctx.strokeStyle = '#4a3a2a';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Shield boss (raised center circle)
        ctx.fillStyle = '#5a4a3a';
        ctx.beginPath();
        ctx.arc(0, -baseSize * 0.1, baseSize * 0.18, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#3a2a1a';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Boss highlight
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.05, -baseSize * 0.15, baseSize * 0.06, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawSingleHandedSword(ctx, handX, handY, baseSize, walkCycle) {
        ctx.save();
        ctx.translate(handX, handY);

        // Sword angle - upright pointing up with tilt to the right
        const swordAngle = 0.35 + walkCycle * 0.08;
        ctx.rotate(swordAngle);

        const swordLength = baseSize * 1.4;
        const bladeWidth = baseSize * 0.22;

        // Sword blade - solid color (no gradient for better performance)
        ctx.fillStyle = '#A8A8A8';
        ctx.beginPath();
        ctx.moveTo(-bladeWidth/2, 0);
        ctx.lineTo(bladeWidth/2, 0);
        ctx.lineTo(baseSize * 0.1, -swordLength);
        ctx.lineTo(-baseSize * 0.1, -swordLength);
        ctx.closePath();
        ctx.fill();

        // Blade outline
        ctx.strokeStyle = '#505050';
        ctx.lineWidth = 1;
        ctx.stroke();

        // --- SWORD CROSS-GUARD ---
        ctx.fillStyle = '#D4AF37';
        ctx.fillRect(-baseSize * 0.3, -baseSize * 0.1, baseSize * 0.6, baseSize * 0.2);

        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 1;
        ctx.strokeRect(-baseSize * 0.3, -baseSize * 0.1, baseSize * 0.6, baseSize * 0.2);

        // --- SWORD HANDLE ---
        const handleLength = baseSize * 0.45;
        ctx.fillStyle = '#654321';
        ctx.fillRect(-baseSize * 0.1, baseSize * 0.1, baseSize * 0.2, handleLength);

        ctx.strokeStyle = '#3a2a1a';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(-baseSize * 0.1, baseSize * 0.1, baseSize * 0.2, handleLength);

        // --- SWORD POMMEL ---
        ctx.fillStyle = '#D4AF37';
        ctx.beginPath();
        ctx.arc(0, baseSize * 0.62, baseSize * 0.16, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, baseSize * 0.62, baseSize * 0.16, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}
