import { BaseEnemy } from './BaseEnemy.js';
import { drawTwoSegmentLimb, computeWalkCycle, mirroredLimbAngle, kneeFlex } from './HumanoidLimbRenderer.js';

export class VillagerEnemy extends BaseEnemy {
    // Static counter to alternate weapon types across spawns
    static weaponSpawnCounter = 0;

    static BASE_STATS = {
        health: 100,
        speed: 55,
        armour: 10,
        magicResistance: 0
    };

    constructor(path, health_multiplier = 1.0, speed = null, armour = null, magicResistance = null) {
        const baseStats = VillagerEnemy.BASE_STATS;
        const actualSpeed = speed !== null ? speed : baseStats.speed;
        const actualArmour = armour !== null ? armour : baseStats.armour;
        const actualMagicResistance = magicResistance !== null ? magicResistance : baseStats.magicResistance;

        super(path, baseStats.health * health_multiplier, actualSpeed, actualArmour, actualMagicResistance);
        this.tunicColor = this.getRandomTunicColor();
        this._tunicLightColorStr = this.lightenColor(this.tunicColor, 0.3);
        this._tunicDarkColorStr = this.darkenColor(this.tunicColor, 0.2);
        // Alternate weapon type: even spawns get torch, odd get pitchfork
        this.weaponType = (VillagerEnemy.weaponSpawnCounter % 2) === 0 ? 'torch' : 'pitchfork';
        VillagerEnemy.weaponSpawnCounter++;

        // Attack properties - NEW
        this.attackDamage = 4;
        this.attackSpeed = 0.8;

        // Torch particle system (lightweight)
        this.torchParticles = [];

        // Set by EnemyRenderAdapter once it has synced this enemy via Pixi (hit splatters
        // still draw here regardless - not yet migrated). No static structure - the whole
        // figure animates continuously, so everything lives in renderDynamicParts.
        this.skipCanvas2DBodyRender = false;
    }

    /** Per-instance tunic color variant, so baked layers (if any subclass adds them) don't collide across different-colored instances. */
    getRenderVariantKey() {
        return this.tunicColor;
    }

    getRandomTunicColor() {
        const tunicColors = [
            '#8B4513', // Brown
            '#D4A574', // Tan
            '#A0826D', // Light Brown
            '#704214', // Dark Brown
            '#9B7653', // Tan Brown
            '#6B5344'  // Darker Brown
        ];

        return tunicColors[Math.floor(Math.random() * tunicColors.length)];
    }

    update(deltaTime) {
        this.animationTime += deltaTime;
        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);

        // Update torch particles for burning effect
        if (this.weaponType === 'torch') {
            this.updateTorchParticles(deltaTime);
        }

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
            this.isAttackingCastle = true;
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

    updateTorchParticles(deltaTime) {
        // Add new particles periodically
        if (Math.random() < 0.6) {
            this.torchParticles.push({
                x: 0,
                y: 0,
                vx: (Math.random() - 0.5) * 30,
                vy: -Math.random() * 40 - 20,
                life: 0.5 + Math.random() * 0.3,
                maxLife: 0.5 + Math.random() * 0.3,
                size: Math.random() * 3 + 2
            });
        }

        // Update and remove dead particles
        for (let i = this.torchParticles.length - 1; i >= 0; i--) {
            const p = this.torchParticles[i];
            p.life -= deltaTime;
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;

            if (p.life <= 0) {
                this.torchParticles.splice(i, 1);
            }
        }

        // Keep particle count reasonable
        if (this.torchParticles.length > 8) {
            this.torchParticles = this.torchParticles.slice(-8);
        }
    }

    takeDamage(amount, armorPiercingPercent = 0, damageType = 'physical', followTarget = false) {
        super.takeDamage(amount, armorPiercingPercent, damageType, followTarget);
    }

    isDead() {
        return this.health <= 0;
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

    render(ctx) {
        // baseSize depends on ctx.canvas.width (real screen resolution) - computed once
        // here, with a real ctx, and cached on the instance so _syncEnemyPixi
        // (GameplayState) can reuse the exact same value for the Pixi path.
        const baseSize = Math.max(6, Math.min(14, ctx.canvas.width / 150));
        this._lastRenderSize = baseSize;

        if (!this.skipCanvas2DBodyRender) {
            this.renderDynamicParts(ctx, baseSize);
        }

        // Render hit splatters
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

    /** Strategy A (baked): pose must stay a pure function of animationTime/phaseOffset
     *  (not cached from update()) since the bake pass samples renderDynamicParts()
     *  directly at many animationTime values without calling update() in between. */
    renderDynamicParts(ctx, baseSize) {
        const anim = computeWalkCycle(this.animationTime, this.animationPhaseOffset, 8);

        // Enemy shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + baseSize * 1.6, baseSize * 0.9, baseSize * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(this.x, this.y + anim.bodyBob);

        // --- LEGS (two-segment, knee bend tied to the stride) --- Stance widened
        // (0.25->0.34*baseSize) and swing/knee-bend both cut down (0.35/0.32->0.15)
        // - the previous narrow stance + wide swing let the rigid straight leg (the
        // moment knee bend is zero, at the swing extremes) reach past centerline
        // once the boot radius was added on top.
        const leftLegAngle = Math.PI / 2 + anim.legSwing * 0.15;
        const rightLegAngle = Math.PI / 2 - anim.legSwing * 0.15;

        const leftLeg = drawTwoSegmentLimb(
            ctx, -baseSize * 0.34, baseSize * 0.35,
            leftLegAngle, baseSize * 0.42,
            leftLegAngle - kneeFlex(anim, false) * 0.15, baseSize * 0.4,
            { limbColor: '#5a4a3a', padColor: '#1C1C1C', limbWidth: baseSize * 0.22, padRadius: baseSize * 0.16, shadowColor: 'rgba(0,0,0,0.2)' }
        );
        const rightLeg = drawTwoSegmentLimb(
            ctx, baseSize * 0.34, baseSize * 0.35,
            rightLegAngle, baseSize * 0.42,
            rightLegAngle + kneeFlex(anim, true) * 0.15, baseSize * 0.4,
            { limbColor: '#5a4a3a', padColor: '#1C1C1C', limbWidth: baseSize * 0.22, padRadius: baseSize * 0.16, shadowColor: 'rgba(0,0,0,0.2)' }
        );

        // --- TUNIC (gradient-shaded, rough homespun cloth) ---
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
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Center seam + patchwork stitch (homespun character)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, -baseSize * 0.75);
        ctx.lineTo(0, baseSize * 0.4);
        ctx.stroke();

        // --- HEAD ---
        ctx.fillStyle = '#E8D4B8';
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.2, baseSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#B8956A';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // --- STRAW HAT (gradient-shaded weave) ---
        if (!this._hatGrad || this._hatGradBaseSize !== baseSize || this._hatGradCtx !== ctx) {
            this._hatGradCtx = ctx;
            this._hatGradBaseSize = baseSize;
            this._hatGrad = ctx.createRadialGradient(-baseSize * 0.15, -baseSize * 1.35, baseSize * 0.1, 0, -baseSize * 1.2, baseSize * 0.65);
            this._hatGrad.addColorStop(0, '#E4C08A');
            this._hatGrad.addColorStop(1, '#C9994D');
        }
        ctx.fillStyle = this._hatGrad;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.2, baseSize * 0.62, Math.PI, Math.PI * 2);
        ctx.fill();

        // Hat brim
        ctx.fillStyle = '#C9994D';
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 1.2, baseSize * 0.7, baseSize * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8B6F47';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 1.2, baseSize * 0.7, baseSize * 0.15, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Straw weave texture lines
        ctx.strokeStyle = 'rgba(139, 111, 71, 0.4)';
        ctx.lineWidth = 0.5;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(i * baseSize * 0.12, -baseSize * 1.75);
            ctx.lineTo(i * baseSize * 0.18, -baseSize * 1.22);
            ctx.stroke();
        }

        // --- LEFT ARM ---
        const leftArmAngle = mirroredLimbAngle(0.205, anim.legSwing, 0.24, false);
        drawTwoSegmentLimb(
            ctx, -baseSize * 0.5, -baseSize * 0.35,
            leftArmAngle, baseSize * 0.4,
            leftArmAngle + 0.15, baseSize * 0.35,
            { limbColor: '#E8D4B8', padColor: 'rgba(221, 190, 169, 0.9)', limbWidth: baseSize * 0.3, padRadius: baseSize * 0.16, shadowColor: 'rgba(0,0,0,0.15)' }
        );

        // --- RIGHT ARM WITH WEAPON (RAISED) ---
        const rightShoulderX = baseSize * 0.5;
        const rightShoulderY = -baseSize * 0.35;
        const weaponRaiseAngle = -Math.PI / 2 + 0.3;
        const rightHand = drawTwoSegmentLimb(
            ctx, rightShoulderX, rightShoulderY,
            weaponRaiseAngle, baseSize * 0.45,
            weaponRaiseAngle, baseSize * 0.4,
            { limbColor: '#E8D4B8', padColor: 'rgba(221, 190, 169, 0.95)', limbWidth: baseSize * 0.3, padRadius: baseSize * 0.16, shadowColor: 'rgba(0,0,0,0.15)' }
        );

        // Draw weapon based on type
        if (this.weaponType === 'torch') {
            this.drawTorch(ctx, rightHand.endX, rightHand.endY, baseSize, weaponRaiseAngle);
        } else {
            this.drawPitchfork(ctx, rightHand.endX, rightHand.endY, baseSize, weaponRaiseAngle);
        }

        // --- BOOTS (drawn after legs so they cap the feet) ---
        ctx.fillStyle = '#1C1C1C';
        ctx.beginPath();
        ctx.ellipse(leftLeg.endX, leftLeg.endY + baseSize * 0.1, baseSize * 0.17, baseSize * 0.13, anim.legSwing * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(rightLeg.endX, rightLeg.endY + baseSize * 0.1, baseSize * 0.17, baseSize * 0.13, -anim.legSwing * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Health bar — skipped during Mode A baking (adapter draws it separately).
        if (!this._baking) {
            this.renderHealthBar(ctx, baseSize);
        }
    }

    drawTorch(ctx, handX, handY, baseSize, armAngle) {
        ctx.save();
        ctx.translate(handX, handY);
        ctx.rotate(armAngle + Math.PI / 2);

        // Torch handle - wooden shaft
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-baseSize * 0.08, 0, baseSize * 0.16, baseSize * 0.65);

        // Handle detail - wood grain (simplified)
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 0.5;
        for (let i = 1; i < 5; i++) {
            const grainY = (baseSize * 0.65 * i / 5);
            ctx.beginPath();
            ctx.moveTo(-baseSize * 0.08, grainY);
            ctx.lineTo(baseSize * 0.08, grainY);
            ctx.stroke();
        }

        // Torch head - cloth wrapping
        const torchHeadY = -baseSize * 0.25;
        ctx.fillStyle = '#D4691E';
        ctx.fillRect(-baseSize * 0.14, torchHeadY - baseSize * 0.1, baseSize * 0.28, baseSize * 0.15);

        // Wrapping band detail
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.14, torchHeadY - baseSize * 0.04);
        ctx.lineTo(baseSize * 0.14, torchHeadY - baseSize * 0.04);
        ctx.stroke();

        // Char marks on torch head
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(-baseSize * 0.12, torchHeadY - baseSize * 0.08, baseSize * 0.08, baseSize * 0.12);
        ctx.fillRect(baseSize * 0.04, torchHeadY - baseSize * 0.06, baseSize * 0.08, baseSize * 0.1);

        // Glowing aura around flames
        ctx.fillStyle = `rgba(255, 150, 0, ${0.3 + Math.sin(this.animationTime * 6) * 0.15})`;
        ctx.beginPath();
        ctx.arc(0, torchHeadY - baseSize * 0.35, baseSize * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Animated flames with better burning effect. Uses animationPhaseOffset (a fixed
        // per-instance value, not Math.random()) so the flicker phase varies between
        // villagers but is deterministic across calls - this is Mode A (baked): a true
        // Math.random() here would get sampled once at bake time and frozen into that
        // frame forever, making the "flicker" a fixed pattern that repeats every walk
        // cycle instead of animating.
        const flameFlicker = Math.sin(this.animationTime * 8 + this.animationPhaseOffset) * 0.2 + 0.8;
        const flameWave = Math.sin(this.animationTime * 4) * 0.1;

        // Outer flame envelope (dark orange)
        ctx.fillStyle = `rgba(220, 100, 20, ${0.9 * flameFlicker})`;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.12, torchHeadY);
        ctx.quadraticCurveTo(-baseSize * 0.1 + flameWave * baseSize * 0.05, torchHeadY - baseSize * 0.35, 0, torchHeadY - baseSize * 0.55);
        ctx.quadraticCurveTo(baseSize * 0.1 + flameWave * baseSize * 0.05, torchHeadY - baseSize * 0.35, baseSize * 0.12, torchHeadY);
        ctx.closePath();
        ctx.fill();

        // Middle flame (orange)
        ctx.fillStyle = `rgba(255, 140, 20, ${0.8 * flameFlicker})`;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.08, torchHeadY - baseSize * 0.05);
        ctx.quadraticCurveTo(-baseSize * 0.06 + flameWave * baseSize * 0.03, torchHeadY - baseSize * 0.30, 0, torchHeadY - baseSize * 0.48);
        ctx.quadraticCurveTo(baseSize * 0.06 + flameWave * baseSize * 0.03, torchHeadY - baseSize * 0.30, baseSize * 0.08, torchHeadY - baseSize * 0.05);
        ctx.closePath();
        ctx.fill();

        // Inner flame hot core (bright yellow-white)
        ctx.fillStyle = `rgba(255, 220, 100, ${0.9 * flameFlicker})`;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.04, torchHeadY - baseSize * 0.08);
        ctx.quadraticCurveTo(-baseSize * 0.02, torchHeadY - baseSize * 0.25, 0, torchHeadY - baseSize * 0.38);
        ctx.quadraticCurveTo(baseSize * 0.02, torchHeadY - baseSize * 0.25, baseSize * 0.04, torchHeadY - baseSize * 0.08);
        ctx.closePath();
        ctx.fill();

        // Brightest core (white hot center)
        ctx.fillStyle = `rgba(255, 255, 200, ${0.7 * flameFlicker})`;
        ctx.beginPath();
        ctx.arc(0, torchHeadY - baseSize * 0.28, baseSize * 0.05, 0, Math.PI * 2);
        ctx.fill();

        // Render torch particles for better burning effect
        ctx.globalAlpha = 0.6;
        this.torchParticles.forEach(p => {
            const lifePercent = p.life / p.maxLife;
            const size = p.size * lifePercent;
            const brightness = Math.max(0, lifePercent - 0.3) * 1.43;

            ctx.fillStyle = `rgba(255, ${150 * brightness}, 0, ${brightness})`;
            ctx.beginPath();
            ctx.arc(p.x, torchHeadY - baseSize * 0.35 + p.y, size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        ctx.restore();
    }

    drawPitchfork(ctx, handX, handY, baseSize, armAngle) {
        ctx.save();
        ctx.translate(handX, handY);
        ctx.rotate(armAngle + Math.PI / 2);

        // Pitchfork shaft - wooden handle
        const shaftWidth = baseSize * 0.12;
        const shaftLength = baseSize * 0.7;
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-shaftWidth / 2, 0, shaftWidth, shaftLength);

        // Shaft wood grain details (simplified for performance)
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 0.5;
        for (let i = 1; i < 5; i++) {
            const grainY = (shaftLength * i / 5);
            ctx.beginPath();
            ctx.moveTo(-shaftWidth / 2, grainY);
            ctx.lineTo(shaftWidth / 2, grainY);
            ctx.stroke();
        }

        // Metal ferrule (connection piece between handle and tines)
        const ferruleY = -baseSize * 0.15;
        ctx.fillStyle = '#696969';
        ctx.fillRect(-baseSize * 0.16, ferruleY - baseSize * 0.06, baseSize * 0.32, baseSize * 0.12);

        // Ferrule edge highlight
        ctx.fillStyle = '#A9A9A9';
        ctx.fillRect(-baseSize * 0.16, ferruleY - baseSize * 0.06, baseSize * 0.32, baseSize * 0.04);

        // Ferrule rivets/rivets for detail
        ctx.fillStyle = '#505050';
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.arc(i * baseSize * 0.08, ferruleY, baseSize * 0.018, 0, Math.PI * 2);
            ctx.fill();
        }

        // Three iron tines forming a W-shape (distinctive design)
        const tineTop = -baseSize * 0.65;
        const leftTineX = -baseSize * 0.3;
        const centerTineX = 0;
        const rightTineX = baseSize * 0.3;

        // Tine specifications
        const tineHeight = baseSize * 0.5;
        const tineWidth = baseSize * 0.12;
        const tipPointHeight = baseSize * 0.08;

        // Draw three tines with iron coloring and shading
        const tines = [
            { x: leftTineX, baseOffset: 0 },
            { x: centerTineX, baseOffset: -baseSize * 0.07 }, // Center tine slightly taller
            { x: rightTineX, baseOffset: 0 }
        ];

        tines.forEach((tine, idx) => {
            // Tine connection bar shadow at base
            if (idx === 0) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.fillRect(-baseSize * 0.35, ferruleY - baseSize * 0.03, baseSize * 0.7, baseSize * 0.04);
            }

            // Main tine body - iron gray with shading
            ctx.fillStyle = idx === 1 ? '#A9A9A9' : '#999999'; // Center tine slightly lighter
            const tineY = ferruleY + tine.baseOffset;
            const actualHeight = tineHeight + (idx === 1 ? baseSize * 0.07 : 0);

            // Tine rectangle body
            ctx.fillRect(tine.x - tineWidth / 2, tineY, tineWidth, -actualHeight);

            // Tine edge highlight (right edge to show metal shine)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(tine.x - tineWidth / 2 + baseSize * 0.03, tineY - actualHeight * 0.7, baseSize * 0.03, actualHeight * 0.7);

            // Tine shadow (left edge for depth)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.fillRect(tine.x - tineWidth / 2, tineY, baseSize * 0.03, -actualHeight);

            // Sharp iron point at tip - Dark iron tip
            ctx.fillStyle = '#505050';
            ctx.beginPath();
            ctx.moveTo(tine.x - tineWidth / 2, tineY - actualHeight);
            ctx.lineTo(tine.x + tineWidth / 2, tineY - actualHeight);
            ctx.lineTo(tine.x, tineY - actualHeight - tipPointHeight);
            ctx.closePath();
            ctx.fill();

            // Tip edge highlight for sharpness
            ctx.strokeStyle = '#C0C0C0';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(tine.x - tineWidth / 2, tineY - actualHeight);
            ctx.lineTo(tine.x, tineY - actualHeight - tipPointHeight);
            ctx.stroke();

            // Tip right edge
            ctx.beginPath();
            ctx.moveTo(tine.x + tineWidth / 2, tineY - actualHeight);
            ctx.lineTo(tine.x, tineY - actualHeight - tipPointHeight);
            ctx.stroke();
        });

        // Tine connection bar at base (joins all three tines)
        ctx.fillStyle = '#808080';
        ctx.fillRect(-baseSize * 0.35, ferruleY - baseSize * 0.08, baseSize * 0.7, baseSize * 0.08);

        // Connection bar edge highlight
        ctx.fillStyle = '#A9A9A9';
        ctx.fillRect(-baseSize * 0.35, ferruleY - baseSize * 0.08, baseSize * 0.7, baseSize * 0.04);

        // Connection bar outline
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(-baseSize * 0.35, ferruleY - baseSize * 0.08, baseSize * 0.7, baseSize * 0.08);

        ctx.restore();
    }
}
