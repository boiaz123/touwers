import { BaseEnemy } from './BaseEnemy.js';
import { drawTwoSegmentLimb, computeWalkCycle, kneeFlex } from './HumanoidLimbRenderer.js';

export class KnightEnemy extends BaseEnemy {
    static BASE_STATS = {
        health: 2000,
        speed: 35,
        armour: 65,
        magicResistance: -0.2
    };

    constructor(path, health_multiplier = 1.0, speed = null, armour = null, magicResistance = null) {
        const baseStats = KnightEnemy.BASE_STATS;
        const actualSpeed = speed !== null ? speed : baseStats.speed;
        const actualArmour = armour !== null ? armour : baseStats.armour;
        const actualMagicResistance = magicResistance !== null ? magicResistance : baseStats.magicResistance;

        super(path, baseStats.health * health_multiplier, actualSpeed, actualArmour, actualMagicResistance);
        this.lootDropChance = 0.1; // 10% chance to drop loot
        this.armorColor = '#4A5568';
        this.sizeMultiplier = 1.15;

        this.attackDamage = 10;
        this.attackSpeed = 0.7;

        // Set by EnemyRenderAdapter once it has synced this enemy via Pixi (hit splatters
        // still draw here regardless - not yet migrated). No static structure - the whole
        // figure animates continuously, so everything lives in renderDynamicParts.
        this.skipCanvas2DBodyRender = false;
    }

    /** Slower gait than the default (see renderDynamicParts' animTime) - told to
     *  EnemyRenderAdapter's Mode A frame-baker so it samples/plays back a full cycle at
     *  this rate instead of assuming every enemy type walks at the default frequency. */
    getWalkFrequency() {
        return 7;
    }

    update(deltaTime) {
        this.animationTime += deltaTime;
        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);

        // Don't move if attacking a defender (path or castle)
        if (this.isAttackingDefender) {
            return;
        }

        // PATH DEFENDER LOGIC: Check if any guard post defender is ahead on the path
        if (this.guardPostCache && this.guardPostCache.length > 0) {
            for (let cache of this.guardPostCache) {
                if (!cache.defender.isDead() && cache.waypoint) {
                    const distanceToWaypoint = Math.hypot(
                        cache.waypoint.x - this.x,
                        cache.waypoint.y - this.y
                    );
                    if (distanceToWaypoint < 60) {
                        this.reachedEnd = true;
                        this.isAttackingCastle = false;
                        return;
                    }
                }
            }
        }

        if (this.reachedEnd || !this.path || this.path.length === 0) return;

        if (this.currentPathIndex >= this.path.length - 1) {
            this.reachedEnd = true;
            return;
        }

        const target = this.getOffsetWaypointAt(this.currentPathIndex + 1) || this.path[this.currentPathIndex + 1];
        if (!target) {
            this.reachedEnd = true;
            return;
        }

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.hypot(dx, dy);

        const reachThreshold = Math.max(5, this.speed * deltaTime * 2);

        if (distance < reachThreshold) {
            this.currentPathIndex++;
            const snapPos = this.getOffsetWaypointAt(this.currentPathIndex) || this.path[this.currentPathIndex];
            if (snapPos) { this.x = snapPos.x; this.y = snapPos.y; }
            return;
        }

        const moveDistance = this.speed * deltaTime;
        this.x += (dx / distance) * moveDistance;
        this.y += (dy / distance) * moveDistance;
    }

    takeDamage(amount, armorPiercingPercent = 0, damageType = 'physical', followTarget = false) {
        super.takeDamage(amount, armorPiercingPercent, damageType, followTarget);
    }

    isDead() {
        return this.health <= 0;
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
        // Slower, weighty gait (getWalkFrequency = 7).
        const anim = computeWalkCycle(this.animationTime, this.animationPhaseOffset, 7);

        // Enemy shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + baseSize * 1.5, baseSize * 0.95, baseSize * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(this.x, this.y + anim.bodyBob * 0.83);

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
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-baseSize * 0.65, -baseSize * 0.7, baseSize * 1.3, baseSize * 1.05);

        // --- SHOULDER PAULDRONS (Armor) ---
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

        // --- ARMOR RIVETS AND DETAILS ---
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

        // --- CLOSED HELM (Full Plate, gradient sheen) ---
        if (!this._helmGrad || this._helmGradBaseSize !== baseSize || this._helmGradCtx !== ctx) {
            this._helmGradCtx = ctx;
            this._helmGradBaseSize = baseSize;
            this._helmGrad = ctx.createLinearGradient(-baseSize * 0.68, -baseSize * 1.93, baseSize * 0.68, -baseSize * 0.6);
            this._helmGrad.addColorStop(0, '#787878');
            this._helmGrad.addColorStop(0.5, '#4a4a4a');
            this._helmGrad.addColorStop(1, '#2a2a2a');
        }
        ctx.fillStyle = this._helmGrad;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.25, baseSize * 0.68, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.25, baseSize * 0.68, 0, Math.PI * 2);
        ctx.stroke();

        // Visor and nose guard
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-baseSize * 0.35, -baseSize * 1.28, baseSize * 0.7, baseSize * 0.12);
        ctx.fillRect(-baseSize * 0.08, -baseSize * 1.25, baseSize * 0.16, baseSize * 0.4);

        // Helm crest - ornamental ridge
        ctx.strokeStyle = '#5A6B7A';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, -baseSize * 1.92);
        ctx.lineTo(-baseSize * 0.15, -baseSize * 1.55);
        ctx.lineTo(baseSize * 0.15, -baseSize * 1.55);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = '#5A6B7A';
        ctx.fill();

        // Helm detail - cheek guards
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(-baseSize * 0.45, -baseSize * 1.1, baseSize * 0.12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(baseSize * 0.45, -baseSize * 1.1, baseSize * 0.12, 0, Math.PI * 2);
        ctx.stroke();

        // Eye slit glow detail
        ctx.fillStyle = 'rgba(255, 100, 50, 0.3)';
        ctx.fillRect(-baseSize * 0.28, -baseSize * 1.3, baseSize * 0.56, baseSize * 0.08);

        // --- ARMS (converge on the two-handed sword grip) ---
        const leftShoulderX = -baseSize * 0.65;
        const leftShoulderY = -baseSize * 0.35;
        const leftArmAngle = -0.3 + anim.legSwing * 0.1;

        const leftArm = drawTwoSegmentLimb(
            ctx, leftShoulderX, leftShoulderY,
            leftArmAngle, baseSize * 0.4,
            leftArmAngle, baseSize * 0.45,
            { limbColor: '#C9A876', padColor: '#5A6B7A', limbWidth: baseSize * 0.35, padRadius: baseSize * 0.24 }
        );
        // Gauntlet armor plate detail on top of the pad drawn by the helper
        ctx.fillStyle = '#4A5568';
        ctx.fillRect(leftArm.endX - baseSize * 0.12, leftArm.endY - baseSize * 0.18, baseSize * 0.24, baseSize * 0.08);
        ctx.fillRect(leftArm.endX - baseSize * 0.12, leftArm.endY + baseSize * 0.08, baseSize * 0.24, baseSize * 0.08);

        const rightShoulderX = baseSize * 0.65;
        const rightShoulderY = -baseSize * 0.35;
        const rightArmAngle = -2.84 - anim.legSwing * 0.1;

        const rightArm = drawTwoSegmentLimb(
            ctx, rightShoulderX, rightShoulderY,
            rightArmAngle, baseSize * 0.4,
            rightArmAngle, baseSize * 0.45,
            { limbColor: '#C9A876', padColor: '#5A6B7A', limbWidth: baseSize * 0.35, padRadius: baseSize * 0.24 }
        );
        ctx.fillStyle = '#4A5568';
        ctx.fillRect(rightArm.endX - baseSize * 0.12, rightArm.endY - baseSize * 0.18, baseSize * 0.24, baseSize * 0.08);
        ctx.fillRect(rightArm.endX - baseSize * 0.12, rightArm.endY + baseSize * 0.08, baseSize * 0.24, baseSize * 0.08);

        // Draw two-handed sword - uses BOTH hand positions and moves with walk cycle
        this.drawTwoHandedSword(ctx, leftArm.endX, leftArm.endY, rightArm.endX, rightArm.endY, baseSize, leftArmAngle, anim.legSwing * 0.4);

        // --- LEGS WITH LEG ARMOR (heavy, tight-stride gait - small hip swing and a
        // wider stance than the lighter troops so the feet have clearance and never
        // cross the centerline; heavy plate armor should read as a short, stiff march
        // rather than a wide natural stride anyway). Stance widened further (0.34->0.4)
        // and swing/knee-bend both cut down (0.16->0.14) since even the old "wider"
        // stance still let the rigid straight leg (the moment knee bend is zero, at
        // the swing extremes) reach past centerline once the 0.26*baseSize boot radius
        // is added on top - the boot itself needs the clearance, not just the ankle. ---
        const leftLegAngle = Math.PI / 2 + anim.legSwing * 0.14;
        const rightLegAngle = Math.PI / 2 - anim.legSwing * 0.14;

        const leftLeg = drawTwoSegmentLimb(
            ctx, -baseSize * 0.4, baseSize * 0.35,
            leftLegAngle, baseSize * 0.42,
            leftLegAngle - kneeFlex(anim, false) * 0.14, baseSize * 0.43,
            { limbColor: '#4A5568', padColor: '#2a2a2a', limbWidth: baseSize * 0.28, padRadius: 0 }
        );
        // Knee joint armor plate (drawn at the elbow/knee position the helper returned)
        ctx.fillStyle = '#5A6B7A';
        ctx.beginPath();
        ctx.arc(leftLeg.elbowX, leftLeg.elbowY, baseSize * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(leftLeg.elbowX - baseSize * 0.08, leftLeg.elbowY - baseSize * 0.12, baseSize * 0.16, baseSize * 0.08);

        const rightLeg = drawTwoSegmentLimb(
            ctx, baseSize * 0.4, baseSize * 0.35,
            rightLegAngle, baseSize * 0.42,
            rightLegAngle + kneeFlex(anim, true) * 0.14, baseSize * 0.43,
            { limbColor: '#4A5568', padColor: '#2a2a2a', limbWidth: baseSize * 0.28, padRadius: 0 }
        );
        ctx.fillStyle = '#5A6B7A';
        ctx.beginPath();
        ctx.arc(rightLeg.elbowX, rightLeg.elbowY, baseSize * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(rightLeg.elbowX - baseSize * 0.08, rightLeg.elbowY - baseSize * 0.12, baseSize * 0.16, baseSize * 0.08);

        // --- ARMORED BOOTS ---
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.ellipse(leftLeg.endX, leftLeg.endY + baseSize * 0.18, baseSize * 0.2, baseSize * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5A6B7A';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(leftLeg.endX, leftLeg.endY + baseSize * 0.18, baseSize * 0.2, baseSize * 0.16, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#4A5568';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(leftLeg.endX, leftLeg.endY + baseSize * 0.05, baseSize * 0.2, baseSize * 0.06, 0, 0, Math.PI * 2);
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
        ctx.strokeStyle = '#4A5568';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(rightLeg.endX, rightLeg.endY + baseSize * 0.05, baseSize * 0.2, baseSize * 0.06, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();

        // Health bar — skipped during Mode A baking (adapter draws it separately).
        if (!this._baking) {
            this.renderHealthBar(ctx, baseSize, { widthMul: 3.4, heightMul: 0.48, minHeight: 2.4, yOffsetMul: -2.3, strokeWidth: 1.2 });
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

    drawTwoHandedSword(ctx, leftHandX, leftHandY, rightHandX, rightHandY, baseSize, armAngle, walkCycle) {
        ctx.save();

        const swordCenterX = (leftHandX + rightHandX) / 2;
        const swordCenterY = (leftHandY + rightHandY) / 2;

        const swordTilt = walkCycle * 0.08;
        const swordAngle = armAngle + Math.PI / 2 + swordTilt;

        ctx.translate(swordCenterX, swordCenterY);
        ctx.rotate(swordAngle);

        const swordLength = baseSize * 2.4;
        const bladeWidth = baseSize * 0.35;

        // Sword blade - simplified (solid gradient)
        // OPTIMIZATION: Cache by baseSize instead of recreating every frame -
        // gradient only depends on size, never on animated values.
        if (!this._bladeGradient || this._bladeGradBaseSize !== baseSize || this._bladeGradCtx !== ctx) {
            this._bladeGradCtx = ctx;
            this._bladeGradBaseSize = baseSize;
            this._bladeGradient = ctx.createLinearGradient(-bladeWidth/2, -swordLength * 0.5, bladeWidth/2, -swordLength * 0.5);
            this._bladeGradient.addColorStop(0, '#E0E0E0');
            this._bladeGradient.addColorStop(0.5, '#A0A0A0');
            this._bladeGradient.addColorStop(1, '#808080');
        }

        ctx.fillStyle = this._bladeGradient;
        ctx.beginPath();
        ctx.moveTo(-bladeWidth/2, 0);
        ctx.lineTo(bladeWidth/2, 0);
        ctx.lineTo(baseSize * 0.15, -swordLength);
        ctx.lineTo(-baseSize * 0.15, -swordLength);
        ctx.closePath();
        ctx.fill();

        // Blade outline
        ctx.strokeStyle = '#505050';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Blade fuller (center groove, adds a forged-metal detail)
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = baseSize * 0.03;
        ctx.beginPath();
        ctx.moveTo(0, -baseSize * 0.1);
        ctx.lineTo(0, -swordLength * 0.92);
        ctx.stroke();

        // --- SWORD CROSS-GUARD ---
        ctx.fillStyle = '#D4AF37';
        ctx.fillRect(-baseSize * 0.45, -baseSize * 0.12, baseSize * 0.9, baseSize * 0.24);

        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-baseSize * 0.45, -baseSize * 0.12, baseSize * 0.9, baseSize * 0.24);

        // --- SWORD HANDLE ---
        const handleLength = baseSize * 0.6;
        ctx.fillStyle = '#654321';
        ctx.fillRect(-baseSize * 0.14, baseSize * 0.12, baseSize * 0.28, handleLength);

        // --- SWORD POMMEL ---
        ctx.fillStyle = '#D4AF37';
        ctx.beginPath();
        ctx.arc(0, baseSize * 0.8, baseSize * 0.22, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, baseSize * 0.8, baseSize * 0.22, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}
