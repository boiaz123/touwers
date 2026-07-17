import { BaseEnemy } from './BaseEnemy.js';
import { EnemyColorCache, FROG_COLOR_VARIANTS } from '../../utils/EnemyColorCache.js';
import { drawFlipperFoot } from './FrogFlipperRenderer.js';

export class FrogEnemy extends BaseEnemy {
    // Shared cached color-variant lookup (skinColor -> lighten/darken variants).
    static _colors = new EnemyColorCache(FROG_COLOR_VARIANTS);

    // Pre-built particle color strings: 3 colors × 101 alpha levels (0.00–1.00)
    // Eliminates per-particle per-frame string concatenation (up to 8 particles/frog × N frogs).
    static _colorTable = null;
    static _getColorTable() {
        if (!FrogEnemy._colorTable) {
            const bases = ['rgba(100, 200, 255, ', 'rgba(150, 255, 100, ', 'rgba(255, 200, 100, '];
            FrogEnemy._colorTable = bases.map(b =>
                Array.from({ length: 101 }, (_, i) => b + (i / 100).toFixed(2) + ')')
            );
        }
        return FrogEnemy._colorTable;
    }

    static BASE_STATS = {
        health: 85,
        speed: 55,
        armour: 10,
        magicResistance: 0.5
    };
    
    constructor(path, health_multiplier = 1.0, speed = null, armour = null, magicResistance = null) {
        const baseStats = FrogEnemy.BASE_STATS;
        const actualSpeed = speed !== null ? speed : baseStats.speed;
        const actualArmour = armour !== null ? armour : baseStats.armour;
        const actualMagicResistance = magicResistance !== null ? magicResistance : baseStats.magicResistance;
        
        super(path, baseStats.health * health_multiplier, actualSpeed, actualArmour, actualMagicResistance);
        this.skinColor = this.getRandomSkinColor();
        this.sizeMultiplier = 1.0;
        
        this.attackDamage = 7;
        this.attackSpeed = 1.0;
        
        this.magicParticles = [];
        this.particleSpawnCounter = 0;
        this.jumpAnimationTimer = 0;
        this.jumpAnimationDuration = 0.4;
        this.jumpHeight = 20;
        
        // Cache for color variations to avoid recalculation
        this.cachedLightenColor = null;
        this.cachedDarkenColor = null;
        this.cachedDarken2Color = null;

        // Set by EnemyRenderAdapter once it has synced this enemy via Pixi (hit splatters
        // still draw here regardless - not yet migrated). No static structure - the whole
        // figure jumps/bobs continuously, so everything lives in renderDynamicParts.
        this.skipCanvas2DBodyRender = false;
    }

    /** Per-instance skin color variant, so baked layers (if any subclass adds them) don't collide across different-colored instances. */
    getRenderVariantKey() {
        return this.skinColor;
    }

    /** This is Mode B (live-redraw), rate-limited by EnemyRenderAdapter's ANIM_FPS. The
     *  default 20fps was tuned for ~0.6-1s animation cycles; this hop is only 0.4s
     *  (jumpAnimationTimer below), so 20fps only samples it 8 times per cycle - visibly
     *  choppier than the elemental frog variants get at the same fps over their longer 0.8s
     *  active-jump phase. Doubling the rate here restores comparable smoothness. */
    getAnimFps() {
        return 40;
    }

    getRandomSkinColor() {
        const skinColors = [
            '#2D5016', '#3D6B1F', '#4A7C3E', '#5A8C4E', '#1F3E1F', '#6B9D54'
        ];
        return skinColors[Math.floor(Math.random() * skinColors.length)];
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Reduce particle spawn frequency - spawn every 0.3s instead of 0.15s
        this.particleSpawnCounter += deltaTime;
        if (this.particleSpawnCounter > 0.3) {
            this.spawnMagicParticle();
            this.particleSpawnCounter = 0;
        }
        
        // Update magic particles - inline to avoid function call overhead
        let i = this.magicParticles.length;
        while (i--) {
            const particle = this.magicParticles[i];
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            particle.size = Math.max(0, particle.size * (particle.life / particle.maxLife));
            if (particle.life <= 0) {
                this.magicParticles.splice(i, 1);
            }
        }
        
        // Update jump animation timer
        this.jumpAnimationTimer += deltaTime;
        if (this.jumpAnimationTimer >= this.jumpAnimationDuration) {
            this.jumpAnimationTimer = 0;
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
    
    advanceAlongPath() {
        // Move forward along the path based on distance traveled
        while (this.distanceAlongPath >= this.currentSegmentDistance && this.currentPathIndex < this.path.length - 1) {
            this.distanceAlongPath -= this.currentSegmentDistance;
            this.currentPathIndex++;
            
            if (this.currentPathIndex < this.path.length - 1) {
                this.currentSegmentDistance = this.calculateSegmentDistance(this.currentPathIndex);
            }
        }
    }
    
    startJump() {
        if (this.currentPathIndex >= this.path.length - 1) {
            return;
        }
        
        // Calculate position along path
        const currentPoint = this.path[this.currentPathIndex];
        const nextPoint = this.path[this.currentPathIndex + 1];
        
        const dx = nextPoint.x - currentPoint.x;
        const dy = nextPoint.y - currentPoint.y;
        const segmentDistance = Math.hypot(dx, dy);
        
        // Direction along path
        this.jumpDirection = Math.atan2(dy, dx);
        
        // Calculate remaining distance in current segment
        const remainingDistance = segmentDistance - this.distanceAlongPath;
        
        // Adaptive jump distance - reduce if approaching waypoint
        // Use 60% of remaining distance if less than full jump, otherwise use full jump
        const adaptiveJumpDistance = Math.min(this.jumpDistance, Math.max(remainingDistance * 0.6, this.jumpDistance * 0.5));
        
        // Calculate jump end position
        this.jumpStartX = this.x;
        this.jumpStartY = this.y;
        
        const jumpX = adaptiveJumpDistance * Math.cos(this.jumpDirection);
        const jumpY = adaptiveJumpDistance * Math.sin(this.jumpDirection);
        
        this.jumpEndX = this.jumpStartX + jumpX;
        this.jumpEndY = this.jumpStartY + jumpY;
        
        this.isJumping = true;
        this.jumpTimer = 0;
    }
    
    spawnMagicParticle() {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 15 + 5;
        // Limit total particles per frog to prevent memory bloat
        if (this.magicParticles.length >= 8) return;
        
        this.magicParticles.push({
            x: this.x + Math.cos(angle) * radius,
            y: this.y + Math.sin(angle) * radius - 10,
            vx: (Math.random() - 0.5) * 40,
            vy: -Math.random() * 50 - 20,
            life: 1.2,
            maxLife: 1.2,
            size: Math.random() * 2.5 + 1.5,
            colorIndex: Math.floor(Math.random() * 3)
        });
    }
    
    getMagicParticleColor() {
        // Return color index instead of building string - avoids string concatenation
        const colors = [0, 1, 2];
        return colors[Math.floor(Math.random() * colors.length)];
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
        const baseSize = Math.max(6, Math.min(14, ctx.canvas.width / 150)) * this.sizeMultiplier;
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

    /** Strategy B (per-instance Graphics, redrawn every frame): the whole frog - jump arc/magic particles are continuous and health bar is health-dependent, so nothing here is bakeable. */
    renderDynamicParts(ctx, baseSize) {
        // Enemy shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + baseSize * 1.5, baseSize * 0.85, baseSize * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();

        // Calculate jump arc for visual effect only
        const jumpProgress = this.jumpAnimationTimer / this.jumpAnimationDuration;
        const jumpArc = 4 * this.jumpHeight * jumpProgress * (1 - jumpProgress);

        ctx.translate(this.x, this.y - jumpArc);

        // Squash-and-stretch: compressed+wide right at takeoff/landing, elongated+narrow
        // at the jump apex. Applied directly to the body ellipse's rx/ry (not via
        // ctx.scale) because CanvasGraphicsShim's arc()/ellipse() only honors a single
        // uniform scale factor - a non-uniform ctx.scale(sx, sy) would silently render
        // wrong under the Pixi (Mode B) path this entity actually uses at runtime.
        const squashAmount = Math.pow(Math.max(0, 1 - Math.sin(jumpProgress * Math.PI)), 3);
        const stretchAmount = Math.sin(jumpProgress * Math.PI);
        const bodyScaleX = 1 + squashAmount * 0.15 - stretchAmount * 0.08;
        const bodyScaleY = 1 - squashAmount * 0.15 + stretchAmount * 0.12;

        // Cache colors for this render - only calculate once per frame
        if (!this.cachedLightenColor) {
            this.cachedLightenColor = FrogEnemy._colors.get(this.skinColor, 'lighten');
            this.cachedDarkenColor = FrogEnemy._colors.get(this.skinColor, 'darken');
            this.cachedDarken2Color = FrogEnemy._colors.get(this.skinColor, 'darken_body');
        }

        // --- FROG BODY ---
        
        // Back legs (lower) - more prominent and frog-like
        this.drawFrogBackLeg(ctx, -baseSize * 0.4, baseSize * 0.4, baseSize, false, jumpProgress);
        this.drawFrogBackLeg(ctx, baseSize * 0.4, baseSize * 0.4, baseSize, true, jumpProgress);
        
        // Main body (rounded, more compact) - cache gradient per instance (baseSize is fixed during gameplay)
        if (!this._bodyGradient || this._gradBaseSize !== baseSize || this._gradCtx !== ctx) {
            this._gradCtx = ctx;
            this._gradBaseSize = baseSize;
            this._bodyGradient = ctx.createRadialGradient(-baseSize * 0.12, -baseSize * 0.1, baseSize * 0.15, 0, 0, baseSize * 0.5);
            this._bodyGradient.addColorStop(0, FrogEnemy._colors.get(this.skinColor, 'lighten'));
            this._bodyGradient.addColorStop(0.6, this.skinColor);
            this._bodyGradient.addColorStop(1, this.cachedDarken2Color);
        }
        
        ctx.fillStyle = this._bodyGradient;
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.08, baseSize * 0.5 * bodyScaleX, baseSize * 0.58 * bodyScaleY, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = this.cachedDarken2Color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.08, baseSize * 0.5 * bodyScaleX, baseSize * 0.58 * bodyScaleY, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Belly (lighter color)
        ctx.fillStyle = FrogEnemy._colors.get(this.skinColor, 'lighten_body');
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.15, baseSize * 0.38 * bodyScaleX, baseSize * 0.42 * bodyScaleY, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Tiny front arms - shoulder sits just below the head's bottom edge (head
        // reaches down to y=0; the old y=-0.12 placement put the shoulder up under
        // the head ellipse, which is drawn afterward and painted straight over it,
        // hiding the arms entirely) so they read at the sides of the body instead.
        this.drawFrogArm(ctx, -baseSize * 0.3, baseSize * 0.06, baseSize, false, jumpProgress);
        this.drawFrogArm(ctx, baseSize * 0.3, baseSize * 0.06, baseSize, true, jumpProgress);
        
        // --- HEAD ---
        
        // Head base - more frog-like, wider
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.42, baseSize * 0.5, baseSize * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = this.cachedDarken2Color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.42, baseSize * 0.5, baseSize * 0.42, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // --- EYES (LARGE BULGING, FROG-LIKE) ---
        
        // Left eye socket
        ctx.fillStyle = FrogEnemy._colors.get(this.skinColor, 'darken_eye');
        ctx.beginPath();
        ctx.arc(-baseSize * 0.22, -baseSize * 0.58, baseSize * 0.18, 0, Math.PI * 2);
        ctx.fill();
        
        // Left eye white
        ctx.fillStyle = '#FFFACD';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.22, -baseSize * 0.58, baseSize * 0.14, 0, Math.PI * 2);
        ctx.fill();
        
        // Left iris
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.22, -baseSize * 0.56, baseSize * 0.09, 0, Math.PI * 2);
        ctx.fill();
        
        // Left pupil and shine
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.18, -baseSize * 0.59, baseSize * 0.06, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.16, -baseSize * 0.62, baseSize * 0.025, 0, Math.PI * 2);
        ctx.fill();
        
        // Right eye socket
        ctx.fillStyle = FrogEnemy._colors.get(this.skinColor, 'darken_eye');
        ctx.beginPath();
        ctx.arc(baseSize * 0.22, -baseSize * 0.58, baseSize * 0.18, 0, Math.PI * 2);
        ctx.fill();
        
        // Right eye white
        ctx.fillStyle = '#FFFACD';
        ctx.beginPath();
        ctx.arc(baseSize * 0.22, -baseSize * 0.58, baseSize * 0.14, 0, Math.PI * 2);
        ctx.fill();
        
        // Right iris
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(baseSize * 0.22, -baseSize * 0.56, baseSize * 0.09, 0, Math.PI * 2);
        ctx.fill();
        
        // Right pupil and shine
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(baseSize * 0.18, -baseSize * 0.59, baseSize * 0.06, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(baseSize * 0.16, -baseSize * 0.62, baseSize * 0.025, 0, Math.PI * 2);
        ctx.fill();

        // --- BLINK (periodic, per-instance phase so frogs don't blink in lockstep) ---
        const blinkT = (this.animationTime + this.animationPhaseOffset * 2.3) % 3.4;
        if (blinkT < 0.16) {
            const eyeOpen = Math.abs(Math.cos((blinkT / 0.16) * Math.PI));
            const prevAlpha = ctx.globalAlpha;
            ctx.globalAlpha = prevAlpha * (1 - eyeOpen);
            ctx.fillStyle = this.skinColor;
            ctx.beginPath();
            ctx.arc(-baseSize * 0.22, -baseSize * 0.58, baseSize * 0.18, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(baseSize * 0.22, -baseSize * 0.58, baseSize * 0.18, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = prevAlpha;
        }

        // --- THROAT PULSE (subtle breathing detail below the mouth) ---
        const throatPulse = 0.6 + 0.4 * Math.sin(this.animationTime * 2.2 + this.animationPhaseOffset);
        ctx.fillStyle = FrogEnemy._colors.get(this.skinColor, 'lighten_body');
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.12, baseSize * 0.13, baseSize * 0.1 * throatPulse, 0, 0, Math.PI * 2);
        ctx.fill();

        // --- MOUTH ---
        
        // Wide frog mouth
        ctx.strokeStyle = FrogEnemy._colors.get(this.skinColor, 'darken_mouth');
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 0.25, baseSize * 0.22, 0, Math.PI);
        ctx.stroke();
        
        // Mouth line detail
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.2, -baseSize * 0.25);
        ctx.lineTo(baseSize * 0.2, -baseSize * 0.25);
        ctx.stroke();
        
        // Nostril details
        ctx.fillStyle = FrogEnemy._colors.get(this.skinColor, 'darken_detail');
        ctx.beginPath();
        ctx.arc(-baseSize * 0.1, -baseSize * 0.48, baseSize * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(baseSize * 0.1, -baseSize * 0.48, baseSize * 0.05, 0, Math.PI * 2);
        ctx.fill();

        // --- TONGUE FLICK (occasional quick snap, per-instance phase) ---
        const tongueCycle = (this.animationTime + this.animationPhaseOffset * 3.7) % 5.0;
        if (tongueCycle < 0.35) {
            const tp = tongueCycle / 0.35;
            const extend = tp < 0.4 ? tp / 0.4 : 1 - (tp - 0.4) / 0.6;
            const tongueLen = baseSize * 0.55 * Math.max(0, extend);
            const tongueStartY = -baseSize * 0.16;
            ctx.strokeStyle = '#D8546A';
            ctx.lineWidth = baseSize * 0.06;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(0, tongueStartY);
            ctx.lineTo(0, tongueStartY + tongueLen);
            ctx.stroke();
            ctx.fillStyle = '#D8546A';
            ctx.beginPath();
            ctx.arc(0, tongueStartY + tongueLen, baseSize * 0.05, 0, Math.PI * 2);
            ctx.fill();
        }

        // --- WIZARD HAT ---
        
        this.drawWizardHat(ctx, baseSize);
        
        // --- RENDER MAGIC PARTICLES ---
        
        const colorTable = FrogEnemy._getColorTable();

        for (let i = 0; i < this.magicParticles.length; i++) {
            const particle = this.magicParticles[i];
            ctx.fillStyle = colorTable[particle.colorIndex][Math.round(particle.life / particle.maxLife * 100)];
            ctx.beginPath();
            ctx.arc(particle.x - this.x, particle.y - this.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();

        this.renderHealthBar(ctx, baseSize, { widthMul: 2.8, heightMul: 0.38, yOffsetMul: -2.1 });
    }

    drawFrogBackLeg(ctx, hipX, hipY, baseSize, isRight, jumpProgress) {
        // Back leg - powerful folded jumping position, crouched out to the side and
        // down toward the ground. The thigh/calf angles here are a vertical mirror
        // of what they used to be: the old angles pointed the whole leg UP and OVER
        // the body toward the head, so it got hidden behind the body fill (drawn
        // after) except for a stray foot-nub - which is exactly why the frog read as
        // a featureless little ball. Flipping both angles sends the leg down and
        // outward instead, where it's actually visible beside/behind the body.
        const side = isRight ? 1 : -1;

        // Push-off extension: 1 = fully extended, reaching for the ground (right at
        // takeoff/landing - jumpProgress 0 or 1), 0 = tucked up crouch at the airborne
        // apex (jumpProgress 0.5, where the jumpArc translate above is also at its
        // highest). This used to be inverted - legs extended at the mid-air apex and
        // folded at ground contact, which reads backwards for a jump (a real hopper
        // pushes off/lands with extended legs and tucks them up while airborne).
        const apexPhase = jumpProgress < 0.5 ? jumpProgress * 2 : (1 - jumpProgress) * 2;
        const extension = 1 - apexPhase;

        const thighLength = baseSize * 0.32;
        const legLength = baseSize * 0.36;

        // Thigh (upper part, thick and muscular) - splays out further as the leg extends
        const baseThighAngle = isRight ? Math.PI / 2.8 : Math.PI - Math.PI / 2.8;
        const thighAngle = baseThighAngle - side * extension * 0.22;
        const kneeX = hipX + Math.cos(thighAngle) * thighLength;
        const kneeY = hipY + Math.sin(thighAngle) * thighLength;

        // Calf/foot - folds back sharply at rest, straightens out into the thigh's
        // line as the leg extends mid-hop.
        const restCalfBend = side * 0.55;
        const calfAngle = thighAngle + restCalfBend * (1 - extension * 0.8);
        const footX = kneeX + Math.cos(calfAngle) * legLength;
        const footY = kneeY + Math.sin(calfAngle) * legLength;

        // Shadow for depth
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = baseSize * 0.24;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(hipX + 1, hipY + 1);
        ctx.lineTo(kneeX + 1, kneeY + 1);
        ctx.lineTo(footX + 1, footY + 1);
        ctx.stroke();

        // Thigh - thicker, muscular segment (drawn separately from the calf so the
        // taper from hip to foot actually reads instead of one uniform-width line)
        ctx.strokeStyle = FrogEnemy._colors.get(this.skinColor, 'darken_leg');
        ctx.lineWidth = baseSize * 0.24;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(kneeX, kneeY);
        ctx.stroke();

        // Thigh muscle highlight
        ctx.strokeStyle = FrogEnemy._colors.get(this.skinColor, 'lighten');
        ctx.lineWidth = baseSize * 0.07;
        ctx.beginPath();
        ctx.moveTo(hipX + Math.cos(thighAngle - 0.3) * thighLength * 0.25, hipY + Math.sin(thighAngle - 0.3) * thighLength * 0.25);
        ctx.lineTo(kneeX + Math.cos(thighAngle - 0.3) * baseSize * 0.05, kneeY + Math.sin(thighAngle - 0.3) * baseSize * 0.05);
        ctx.stroke();

        // Calf - slightly thinner than the thigh
        ctx.strokeStyle = FrogEnemy._colors.get(this.skinColor, 'darken_leg');
        ctx.lineWidth = baseSize * 0.17;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(kneeX, kneeY);
        ctx.lineTo(footX, footY);
        ctx.stroke();

        // Knee joint - small highlighted node so the thigh/calf bend reads clearly
        ctx.fillStyle = FrogEnemy._colors.get(this.skinColor, 'lighten');
        ctx.beginPath();
        ctx.arc(kneeX, kneeY, baseSize * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = FrogEnemy._colors.get(this.skinColor, 'darken_detail');
        ctx.lineWidth = 0.7;
        ctx.stroke();

        // Flipper foot - shared clawed webbed-toe outline (see FrogFlipperRenderer.js),
        // scaled down to match the shortened leg above.
        drawFlipperFoot(
            ctx, footX, footY, calfAngle,
            baseSize * 0.36, baseSize * 0.19,
            FrogEnemy._colors.get(this.skinColor, 'lighten_foot'),
            FrogEnemy._colors.get(this.skinColor, 'darken_detail')
        );
    }

    drawFrogArm(ctx, shoulderX, shoulderY, baseSize, isRight, jumpProgress) {
        // Tiny front arm - frogs really only have two functional leg-pairs (the big
        // back jumping legs and a pair of small front arms used for landing/bracing),
        // so this reuses the exact same segmented-limb + flipper-hand construction as
        // drawFrogBackLeg, just scaled down and swung on a small counter-lift instead
        // of the leg's fold/extend, matching the elemental battle-frogs' drawBattleArm.
        const side = isRight ? 1 : -1;

        let armLift;
        if (jumpProgress < 0.6) armLift = jumpProgress / 0.6;
        else armLift = (1 - jumpProgress) / 0.4;

        const upperLength = baseSize * 0.2;
        const lowerLength = baseSize * 0.2;

        // Rest pose points almost straight out to the side (a small bracing arm,
        // like a real frog's), so it clears the belly's silhouette instead of
        // folding back flush against it; it swings upward during the hop the same
        // way the elemental battle-frogs' drawBattleArm lifts on takeoff.
        const baseUpperAngle = side > 0 ? 0.25 : Math.PI - 0.25;
        const upperAngle = baseUpperAngle - armLift * 0.5 * side;
        const elbowX = shoulderX + Math.cos(upperAngle) * upperLength;
        const elbowY = shoulderY + Math.sin(upperAngle) * upperLength;

        const baseLowerAngle = side > 0 ? 0.65 : Math.PI - 0.65;
        const lowerAngle = baseLowerAngle - armLift * 0.4 * side;
        const handX = elbowX + Math.cos(lowerAngle) * lowerLength;
        const handY = elbowY + Math.sin(lowerAngle) * lowerLength;

        // Shadow for depth (two tapered segments matching the real strokes below)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = baseSize * 0.12;
        ctx.beginPath();
        ctx.moveTo(shoulderX + 0.8, shoulderY + 0.8);
        ctx.lineTo(elbowX + 0.8, elbowY + 0.8);
        ctx.stroke();
        ctx.lineWidth = baseSize * 0.08;
        ctx.beginPath();
        ctx.moveTo(elbowX + 0.8, elbowY + 0.8);
        ctx.lineTo(handX + 0.8, handY + 0.8);
        ctx.stroke();

        // Upper arm - thicker
        const armColor = FrogEnemy._colors.get(this.skinColor, 'darken_leg');
        ctx.strokeStyle = armColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = baseSize * 0.12;
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(elbowX, elbowY);
        ctx.stroke();

        // Forearm - tapers down toward the hand
        ctx.strokeStyle = FrogEnemy._colors.get(this.skinColor, 'darken_detail');
        ctx.lineWidth = baseSize * 0.08;
        ctx.beginPath();
        ctx.moveTo(elbowX, elbowY);
        ctx.lineTo(handX, handY);
        ctx.stroke();

        // Elbow joint bump
        ctx.fillStyle = armColor;
        ctx.beginPath();
        ctx.arc(elbowX, elbowY, baseSize * 0.055, 0, Math.PI * 2);
        ctx.fill();

        // Tiny hand - the same flipper shape as the feet, scaled down
        drawFlipperFoot(
            ctx, handX, handY, lowerAngle,
            baseSize * 0.28, baseSize * 0.15,
            FrogEnemy._colors.get(this.skinColor, 'lighten_foot'),
            FrogEnemy._colors.get(this.skinColor, 'darken_detail')
        );
    }

    drawWizardHat(ctx, baseSize) {
        // Hat body - large pointy cone (cache gradients per instance)
        if (!this._hatGradient || this._hatGradBaseSize !== baseSize || this._hatGradCtx !== ctx) {
            this._hatGradCtx = ctx;
            this._hatGradBaseSize = baseSize;
            this._hatGradient = ctx.createLinearGradient(-baseSize * 0.35, -baseSize * 0.8, baseSize * 0.35, -baseSize * 1.5);
            this._hatGradient.addColorStop(0, '#2A5FD8');
            this._hatGradient.addColorStop(0.6, '#1A3A7A');
            this._hatGradient.addColorStop(1, '#0F1F4F');
            
            this._tipGlow = ctx.createRadialGradient(baseSize * 0.08, -baseSize * 1.44, 0, baseSize * 0.08, -baseSize * 1.44, baseSize * 0.2);
            this._tipGlow.addColorStop(0, 'rgba(255, 215, 0, 0.7)');
            this._tipGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
        }
        
        ctx.fillStyle = this._hatGradient;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.32, -baseSize * 0.72);
        ctx.lineTo(baseSize * 0.32, -baseSize * 0.72);
        ctx.lineTo(baseSize * 0.08, -baseSize * 1.42);
        ctx.closePath();
        ctx.fill();
        
        // Hat outline
        ctx.strokeStyle = '#0F1F4F';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.32, -baseSize * 0.72);
        ctx.lineTo(baseSize * 0.08, -baseSize * 1.42);
        ctx.lineTo(baseSize * 0.32, -baseSize * 0.72);
        ctx.stroke();
        
        // Hat brim - gold band
        ctx.fillStyle = '#D4AF37';
        ctx.fillRect(-baseSize * 0.35, -baseSize * 0.78, baseSize * 0.7, baseSize * 0.12);
        
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.35, -baseSize * 0.78);
        ctx.lineTo(baseSize * 0.35, -baseSize * 0.78);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.35, -baseSize * 0.66);
        ctx.lineTo(baseSize * 0.35, -baseSize * 0.66);
        ctx.stroke();
        
        // Hat tip - glowing star
        ctx.fillStyle = this._tipGlow;
        ctx.beginPath();
        ctx.arc(baseSize * 0.08, -baseSize * 1.44, baseSize * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Star at tip
        ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.font = `bold ${baseSize * 0.2}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', baseSize * 0.08, -baseSize * 1.44);
    }
    
}
