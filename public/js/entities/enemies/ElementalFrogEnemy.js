import { BaseEnemy } from './BaseEnemy.js';
import { EnemyColorCache, FROG_COLOR_VARIANTS } from '../../utils/EnemyColorCache.js';
import { drawFlipperFoot } from './FrogFlipperRenderer.js';

/**
 * Shared base for the four elemental "battle-mage" frogs (Fire/Water/Earth/Air).
 * Before this existed, each of the four ~775-line files was a near-verbatim copy of
 * the others - identical jump/update logic, identical body/leg/arm/hat drawing code,
 * differing only in a handful of colors and stats. That duplication meant any visual
 * fix (or bug, e.g. EarthFrog's stubby back-leg-length typo and the shared 0.035-vs-0.35
 * front-arm-length typo present in all four) had to be hand-applied four times and
 * inevitably drifted out of sync. Concrete subclasses now only supply BASE_STATS and a
 * small `visual` palette (see FireFrogEnemy.js etc.) - all geometry/animation lives here
 * exactly once.
 */
export class ElementalFrogEnemy extends BaseEnemy {
    // Shared cached color-variant lookup (skinColor -> lighten/darken variants).
    static _colors = new EnemyColorCache(FROG_COLOR_VARIANTS);

    // Per-elementalType particle color tables (3 colors x 101 alpha levels), built once
    // per element and shared across every instance of that element.
    static _colorTables = new Map();

    constructor(path, health_multiplier, speed, armour, magicResistance, baseStats, visual) {
        const actualSpeed = speed !== null ? speed : baseStats.speed;
        const actualArmour = armour !== null ? armour : baseStats.armour;
        const actualMagicResistance = magicResistance !== null ? magicResistance : baseStats.magicResistance;

        super(path, baseStats.health * health_multiplier, actualSpeed, actualArmour, actualMagicResistance);

        this.skinColor = visual.skinColor;
        this.elementalType = visual.elementalType;
        this.vulnerableTo = visual.vulnerableTo;
        this.accentColor = visual.accentColor;
        this.accentColorDark = visual.accentColorDark;
        this.robeColor = visual.robeColor;
        this.robeColorDark = visual.robeColorDark;
        this.glowColor = visual.glowColor;
        this.hatColors = visual.hatColors; // [top, mid, bottom]
        this.hatShowStar = visual.hatShowStar !== false;
        this._particleColorBases = visual.particleColorBases;
        this.sizeMultiplier = 3.2;

        this.attackDamage = 10;
        this.attackSpeed = 1.0;

        this.magicParticles = [];
        this.particleSpawnCounter = 0;
        this.jumpAnimationTimer = 0;
        this.jumpAnimationDuration = 0.8;
        this.jumpHeight = 40;
        this.jumpCycleTimer = 0;
        this.jumpCycleDuration = 2.0;

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
     *  default 20fps under-samples the jump arc badly enough to read as stuttering/lag,
     *  especially for these larger, slower (0.8s) leaps where every frame of the arc is
     *  clearly visible - bumping the redraw rate is what actually fixes that, matching
     *  the same reasoning the base FrogEnemy already applies for its faster 0.4s hop. */
    getAnimFps() {
        return 36;
    }

    _getColorTable() {
        let table = ElementalFrogEnemy._colorTables.get(this.elementalType);
        if (!table) {
            table = this._particleColorBases.map(b =>
                Array.from({ length: 101 }, (_, i) => b + (i / 100).toFixed(2) + ')')
            );
            ElementalFrogEnemy._colorTables.set(this.elementalType, table);
        }
        return table;
    }

    update(deltaTime) {
        // DO NOT call super.update() - we handle movement ourselves with jump mechanics
        this.animationTime += deltaTime;
        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);

        if (this.isAttackingDefender) { return; }

        // Particle effects
        this.particleSpawnCounter += deltaTime;
        if (this.particleSpawnCounter > 0.3) {
            this.spawnMagicParticle();
            this.particleSpawnCounter = 0;
        }

        // Update magic particles
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

        // Update jump cycle timer for animation and movement synchronization
        this.jumpCycleTimer += deltaTime;
        if (this.jumpCycleTimer >= this.jumpCycleDuration) {
            this.jumpCycleTimer = 0;
        }

        // Jump animation tracks the arc (0 to jumpAnimationDuration)
        if (this.jumpCycleTimer < this.jumpAnimationDuration) {
            this.jumpAnimationTimer = this.jumpCycleTimer;
        } else {
            this.jumpAnimationTimer = this.jumpAnimationDuration;
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
            this.isAttackingCastle = true;
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

        // JUMP-BASED MOVEMENT: Only move during jump phase
        if (this.jumpCycleTimer < this.jumpAnimationDuration) {
            const moveDistance = this.speed * deltaTime;
            this.x += (dx / distance) * moveDistance;
            this.y += (dy / distance) * moveDistance;
        }
        // Rest phase: frog stays still on current spot
    }

    takeDamage(amount, armorPiercingPercent = 0, damageType = 'physical', followTarget = false) {
        // Only take full elemental damage if it matches this frog's weakness.
        // Magic (arcane/classless) damage also passes through, reduced by magic resistance.
        if (damageType !== this.vulnerableTo && damageType !== 'magic') {
            return; // Immune to all other damage types
        }
        super.takeDamage(amount, armorPiercingPercent, damageType, followTarget);
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

    spawnMagicParticle() {
        if (this.magicParticles.length >= 8) return;

        // Elemental flourish: each element biases how its ambient particles move,
        // reusing the same capped particle array/spawn cadence rather than adding a
        // second effect system.
        let angle = Math.random() * Math.PI * 2;
        let radius = Math.random() * 15 + 5;
        let vx = (Math.random() - 0.5) * 40;
        let vy = -Math.random() * 50 - 20;
        let spawnYOffset = -10;

        switch (this.elementalType) {
            case 'fire':
                // Embers: rise faster and narrower, like heat drifting up off the body.
                vx = (Math.random() - 0.5) * 24;
                vy = -Math.random() * 70 - 30;
                break;
            case 'water':
                // Droplets: gentle sideways drift, fall rather than rise.
                vx = (Math.random() - 0.5) * 30;
                vy = Math.random() * 30 + 5;
                break;
            case 'earth':
                // Dust: kicked up low near the feet, settles quickly.
                spawnYOffset = 8;
                vx = (Math.random() - 0.5) * 50;
                vy = -Math.random() * 20 - 5;
                break;
            case 'air':
                // Wind wisps: wide swirling spread.
                vx = (Math.random() - 0.5) * 70;
                vy = -Math.random() * 40 - 10;
                break;
        }

        this.magicParticles.push({
            x: this.x + Math.cos(angle) * radius,
            y: this.y + Math.sin(angle) * radius + spawnYOffset,
            vx, vy,
            life: 1.2,
            maxLife: 1.2,
            size: Math.random() * 2.5 + 1.5,
            colorIndex: Math.floor(Math.random() * 3)
        });
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

    /** Strategy B (per-instance Graphics, redrawn every frame): the whole battle-mage frog - jump arc/magic particles are continuous and health bar is health-dependent, so nothing here is bakeable. */
    renderDynamicParts(ctx, baseSize) {
        // Enemy shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + baseSize * 0.4, baseSize * 0.85, baseSize * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();

        // Calculate jump arc for visual effect only
        const jumpProgress = this.jumpAnimationTimer / this.jumpAnimationDuration;
        const jumpArc = 4 * this.jumpHeight * jumpProgress * (1 - jumpProgress);

        ctx.translate(this.x, this.y - jumpArc);

        // Squash-and-stretch on the jump arc (see FrogEnemy.js for the same technique
        // and why it's applied to ellipse rx/ry directly rather than via ctx.scale).
        const squashAmount = Math.pow(Math.max(0, 1 - Math.sin(jumpProgress * Math.PI)), 3);
        const stretchAmount = Math.sin(jumpProgress * Math.PI);
        const bodyScaleX = 1 + squashAmount * 0.12 - stretchAmount * 0.06;
        const bodyScaleY = 1 - squashAmount * 0.12 + stretchAmount * 0.1;

        // Cache colors for this render
        if (!this.cachedLightenColor) {
            this.cachedLightenColor = ElementalFrogEnemy._colors.get(this.skinColor, 'lighten');
            this.cachedDarkenColor = ElementalFrogEnemy._colors.get(this.skinColor, 'darken');
            this.cachedDarken2Color = ElementalFrogEnemy._colors.get(this.skinColor, 'darken_body');
        }

        // --- BACK LEGS (DRAW FIRST) ---
        this.drawBattleLeg(ctx, -baseSize * 0.3, baseSize * 0.32, baseSize, false, true);
        this.drawBattleLeg(ctx, baseSize * 0.3, baseSize * 0.32, baseSize, true, true);

        // --- LOWER ROBE/BODY ---
        ctx.fillStyle = this.robeColor;
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.22, baseSize * 0.45, baseSize * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = this.robeColorDark;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.22, baseSize * 0.45, baseSize * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Robe detail lines (vertical folds)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        for (let i = -2; i <= 2; i++) {
            const x = i * baseSize * 0.12;
            ctx.beginPath();
            ctx.moveTo(x, baseSize * 0.05);
            ctx.quadraticCurveTo(x + baseSize * 0.06, baseSize * 0.18, x + baseSize * 0.04, baseSize * 0.45);
            ctx.stroke();
        }

        // --- MAIN BODY/CHEST --- (cached gradient)
        if (!this._bodyGrad || this._gradBaseSize !== baseSize || this._gradCtx !== ctx) {
            this._gradCtx = ctx;
            this._gradBaseSize = baseSize;
            this._bodyGrad = ctx.createLinearGradient(-baseSize * 0.4, -baseSize * 0.1, baseSize * 0.4, baseSize * 0.2);
            this._bodyGrad.addColorStop(0, this.cachedLightenColor);
            this._bodyGrad.addColorStop(0.5, this.robeColor);
            this._bodyGrad.addColorStop(1, this.robeColorDark);
        }

        ctx.fillStyle = this._bodyGrad;
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.05, baseSize * 0.52 * bodyScaleX, baseSize * 0.5 * bodyScaleY, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = this.robeColorDark;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.05, baseSize * 0.52 * bodyScaleX, baseSize * 0.5 * bodyScaleY, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Chest plate (armor - element colored)
        ctx.fillStyle = this.accentColor;
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.08, baseSize * 0.38 * bodyScaleX, baseSize * 0.32 * bodyScaleY, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = this.accentColorDark;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.08, baseSize * 0.38 * bodyScaleX, baseSize * 0.32 * bodyScaleY, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Armor shine/highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.beginPath();
        ctx.ellipse(-baseSize * 0.1, -baseSize * 0.05, baseSize * 0.15, baseSize * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();

        // --- ELEMENTAL SKIN TEXTURE (thematic detail beyond just recoloring) ---
        this.drawElementalTexture(ctx, baseSize, bodyScaleX, bodyScaleY);

        // --- FRONT ARMS/HANDS ---
        this.drawBattleArm(ctx, -baseSize * 0.3, baseSize * 0.05, baseSize, false);
        this.drawBattleArm(ctx, baseSize * 0.3, baseSize * 0.05, baseSize, true);

        // --- HEAD ---
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.45, baseSize * 0.48, baseSize * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = this.cachedDarken2Color;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.45, baseSize * 0.48, baseSize * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Head markings/spots
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.15, -baseSize * 0.65, baseSize * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(baseSize * 0.15, -baseSize * 0.65, baseSize * 0.12, 0, Math.PI * 2);
        ctx.fill();

        // --- EYES ---
        ctx.fillStyle = this.cachedDarken2Color;
        ctx.beginPath();
        ctx.arc(-baseSize * 0.2, -baseSize * 0.6, baseSize * 0.17, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFACD';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.2, -baseSize * 0.6, baseSize * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.glowColor;
        ctx.beginPath();
        ctx.arc(-baseSize * 0.2, -baseSize * 0.58, baseSize * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.16, -baseSize * 0.61, baseSize * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.14, -baseSize * 0.64, baseSize * 0.03, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.cachedDarken2Color;
        ctx.beginPath();
        ctx.arc(baseSize * 0.2, -baseSize * 0.6, baseSize * 0.17, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFACD';
        ctx.beginPath();
        ctx.arc(baseSize * 0.2, -baseSize * 0.6, baseSize * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.glowColor;
        ctx.beginPath();
        ctx.arc(baseSize * 0.2, -baseSize * 0.58, baseSize * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(baseSize * 0.16, -baseSize * 0.61, baseSize * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(baseSize * 0.14, -baseSize * 0.64, baseSize * 0.03, 0, Math.PI * 2);
        ctx.fill();

        // --- MOUTH ---
        ctx.strokeStyle = this.cachedDarken2Color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 0.28, baseSize * 0.2, 0, Math.PI);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 100, 100, 0.25)';
        ctx.beginPath();
        ctx.arc(0, -baseSize * 0.28, baseSize * 0.2, 0, Math.PI);
        ctx.fill();

        // --- WIZARD HAT (ENHANCED) ---
        this.drawBattleMageHat(ctx, baseSize);

        // --- RENDER MAGIC PARTICLES ---
        const colorTable = this._getColorTable();
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

    /** Element-specific skin marking, drawn over the chest/body so each element reads
     *  as thematically distinct beyond just its base palette. */
    drawElementalTexture(ctx, baseSize, bodyScaleX, bodyScaleY) {
        switch (this.elementalType) {
            case 'fire': {
                // Glowing ember cracks across the body, like heat-cracked skin/hide.
                ctx.strokeStyle = this.glowColor;
                ctx.lineWidth = baseSize * 0.025;
                ctx.globalAlpha = 0.65;
                const cracks = [
                    [-0.18, -0.12, -0.06, 0.02], [-0.06, 0.02, 0.02, 0.16],
                    [0.08, -0.18, 0.2, -0.02], [0.2, -0.02, 0.14, 0.14],
                ];
                for (const [x1, y1, x2, y2] of cracks) {
                    ctx.beginPath();
                    ctx.moveTo(x1 * baseSize, y1 * baseSize);
                    ctx.lineTo(x2 * baseSize, y2 * baseSize);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
                break;
            }
            case 'water': {
                // Translucent scale/ripple marks across the back.
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
                ctx.lineWidth = baseSize * 0.02;
                const scales = [[-0.16, -0.1], [0.13, -0.16], [-0.04, 0.16], [0.18, 0.08]];
                for (const [x, y] of scales) {
                    ctx.beginPath();
                    ctx.arc(x * baseSize, y * baseSize, baseSize * 0.06, Math.PI * 0.15, Math.PI * 0.85);
                    ctx.stroke();
                }
                break;
            }
            case 'earth': {
                // Small moss/rock patches mottling the hide.
                const patches = [
                    [-0.17, -0.1, '#5a6b3a'], [0.15, 0.04, '#6b5a3a'], [-0.05, 0.2, '#4a5a2a'],
                ];
                ctx.globalAlpha = 0.5;
                for (const [x, y, c] of patches) {
                    ctx.fillStyle = c;
                    ctx.beginPath();
                    ctx.ellipse(x * baseSize, y * baseSize, baseSize * 0.075, baseSize * 0.05, 0.3, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
                break;
            }
            case 'air': {
                // Soft wispy translucent outer glow tracing the body silhouette.
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.lineWidth = baseSize * 0.03;
                ctx.beginPath();
                ctx.ellipse(0, baseSize * 0.05, baseSize * 0.56 * bodyScaleX, baseSize * 0.54 * bodyScaleY, 0, 0, Math.PI * 2);
                ctx.stroke();
                break;
            }
        }
    }

    drawBattleLeg(ctx, hipX, hipY, baseSize, isRight, isBackLeg) {
        const side = isRight ? 1 : -1;
        const jumpPhase = Math.min(1, this.jumpCycleTimer / this.jumpAnimationDuration);

        if (!isBackLeg) return;

        // Push-off extension: 0 = grounded/folded crouch (the resting pose for most of
        // the jump cycle, since jumpPhase is pinned at 1 through the whole rest phase),
        // 1 = fully extended mid-leap. Previously "compression" was 0 at rest, which -
        // combined with a rest-angle only ~8 degrees off vertical - left the leg a
        // straight, constant-width hip-to-foot line for most of the cycle (read as
        // phallic rather than a leg). The fix folds the knee at rest and only
        // straightens during the actual leap.
        let extension = 0;
        if (jumpPhase < 0.5) extension = jumpPhase * 2;
        else extension = Math.max(0, (1 - jumpPhase) * 2);

        // Back legs - shared across all four elements (EarthFrogEnemy used to have its
        // own much shorter 0.09/0.11 lengths here, a copy-paste typo making its back
        // legs look stubby compared to its siblings; unifying this method fixes that).
        const thighLength = baseSize * 0.27;
        const calfLength = baseSize * 0.3;

        // Thigh splayed out to the side and down - a real frog's hip juts outward,
        // not straight down - so the silhouette reads as a folded leg, not a shaft.
        const baseThighAngle = side > 0 ? Math.PI / 3.3 : Math.PI - Math.PI / 3.3;
        const thighAngle = baseThighAngle - side * extension * 0.22;

        const kneeX = hipX + Math.cos(thighAngle) * thighLength;
        const kneeY = hipY + Math.sin(thighAngle) * thighLength;

        // Calf folds back sharply at rest (crouched knee bend); straightens out as
        // the leg extends during the leap.
        const restCalfBend = side * 1.15;
        const calfAngle = thighAngle + restCalfBend * (1 - extension * 0.75);

        const footX = kneeX + Math.cos(calfAngle) * calfLength;
        const footY = kneeY + Math.sin(calfAngle) * calfLength;

        // Shadow (offset, drawn as two tapered segments matching the real strokes below)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = baseSize * 0.19;
        ctx.beginPath();
        ctx.moveTo(hipX + 1, hipY + 1);
        ctx.lineTo(kneeX + 1, kneeY + 1);
        ctx.stroke();
        ctx.lineWidth = baseSize * 0.1;
        ctx.beginPath();
        ctx.moveTo(kneeX + 1, kneeY + 1);
        ctx.lineTo(footX + 1, footY + 1);
        ctx.stroke();

        // Thigh - thick, muscular segment
        const thighColor = ElementalFrogEnemy._colors.get(this.skinColor, 'darken_leg');
        ctx.strokeStyle = thighColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = baseSize * 0.19;
        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(kneeX, kneeY);
        ctx.stroke();

        // Calf - visibly narrower than the thigh, so the leg tapers instead of
        // reading as one uniform-width tube.
        ctx.strokeStyle = ElementalFrogEnemy._colors.get(this.skinColor, 'darken_detail');
        ctx.lineWidth = baseSize * 0.1;
        ctx.beginPath();
        ctx.moveTo(kneeX, kneeY);
        ctx.lineTo(footX, footY);
        ctx.stroke();

        // Knee joint - a small bump so the taper reads as a joint, not a seam
        ctx.fillStyle = thighColor;
        ctx.beginPath();
        ctx.arc(kneeX, kneeY, baseSize * 0.095, 0, Math.PI * 2);
        ctx.fill();

        // Flipper - an actual paddle/fin outline (narrow ankle, wide belly, rounded
        // tip), not a slightly-elongated ellipse - at this render scale a plain
        // ellipse reads as "a circle" regardless of aspect ratio; the shape needs a
        // real outline cue to parse as a flipper. See FrogFlipperRenderer.js.
        drawFlipperFoot(
            ctx, footX, footY, calfAngle,
            baseSize * 0.5, baseSize * 0.26,
            ElementalFrogEnemy._colors.get(this.skinColor, 'lighten_foot'),
            ElementalFrogEnemy._colors.get(this.skinColor, 'darken_detail')
        );
    }

    drawBattleArm(ctx, shoulderX, shoulderY, baseSize, isRight) {
        const side = isRight ? 1 : -1;
        const jumpPhase = Math.min(1, this.jumpCycleTimer / this.jumpAnimationDuration);

        let legLift = 0;
        if (jumpPhase < 0.6) {
            legLift = jumpPhase / 0.6;
        } else {
            legLift = (1 - jumpPhase) / 0.4;
        }

        // Shared, correctly-proportioned front arm length. All four original files had
        // this at baseSize * 0.035 (an apparent typo for 0.35) making the front arms
        // barely-visible nubs - fixed here now that it's written once.
        const upperLength = baseSize * 0.22;
        const lowerLength = baseSize * 0.22;

        const baseUpperAngle = side > 0 ? -Math.PI / 4 : -Math.PI + Math.PI / 4;
        const upperAngle = baseUpperAngle + legLift * 0.25 * side;

        const elbowX = shoulderX + Math.cos(upperAngle) * upperLength;
        const elbowY = shoulderY + Math.sin(upperAngle) * upperLength + legLift * baseSize * 0.08;

        const baseLowerAngle = Math.PI / 2 + (side > 0 ? 0.2 : -0.2);
        const lowerAngle = baseLowerAngle + legLift * 0.15 * side;

        const handX = elbowX + Math.cos(lowerAngle) * lowerLength;
        const handY = elbowY + Math.sin(lowerAngle) * lowerLength;

        // Draw shadow (two tapered segments matching the real strokes below)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = baseSize * 0.13;
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(elbowX, elbowY);
        ctx.stroke();
        ctx.lineWidth = baseSize * 0.08;
        ctx.beginPath();
        ctx.moveTo(elbowX, elbowY);
        ctx.lineTo(handX, handY);
        ctx.stroke();

        // Upper arm - thicker
        const armColor = ElementalFrogEnemy._colors.get(this.skinColor, 'darken_leg');
        ctx.strokeStyle = armColor;
        ctx.lineWidth = baseSize * 0.13;
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(elbowX, elbowY);
        ctx.stroke();

        // Forearm - tapers down toward the paw
        ctx.strokeStyle = ElementalFrogEnemy._colors.get(this.skinColor, 'darken_detail');
        ctx.lineWidth = baseSize * 0.08;
        ctx.beginPath();
        ctx.moveTo(elbowX, elbowY);
        ctx.lineTo(handX, handY);
        ctx.stroke();

        // Elbow joint bump
        ctx.fillStyle = armColor;
        ctx.beginPath();
        ctx.arc(elbowX, elbowY, baseSize * 0.06, 0, Math.PI * 2);
        ctx.fill();

        // Front paw - a smaller version of the same flipper shape, extending onward
        // from the forearm.
        drawFlipperFoot(
            ctx, handX, handY, lowerAngle,
            baseSize * 0.28, baseSize * 0.15,
            ElementalFrogEnemy._colors.get(this.skinColor, 'lighten_foot'),
            ElementalFrogEnemy._colors.get(this.skinColor, 'darken_detail')
        );
    }

    drawBattleMageHat(ctx, baseSize) {
        if (!this._hatGrad || this._hatGradBaseSize !== baseSize || this._hatGradCtx !== ctx) {
            this._hatGradCtx = ctx;
            this._hatGradBaseSize = baseSize;
            this._hatGrad = ctx.createLinearGradient(-baseSize * 0.35, -baseSize * 0.8, baseSize * 0.35, -baseSize * 1.6);
            this._hatGrad.addColorStop(0, this.hatColors[0]);
            this._hatGrad.addColorStop(0.5, this.hatColors[1]);
            this._hatGrad.addColorStop(1, this.hatColors[2]);
            this._tipGlow = ctx.createRadialGradient(baseSize * 0.1, -baseSize * 1.58, 0, baseSize * 0.1, -baseSize * 1.58, baseSize * 0.25);
            this._tipGlow.addColorStop(0, this.glowColor);
            this._tipGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        }

        ctx.fillStyle = this._hatGrad;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.33, -baseSize * 0.75);
        ctx.lineTo(baseSize * 0.33, -baseSize * 0.75);
        ctx.lineTo(baseSize * 0.1, -baseSize * 1.6);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = this.hatColors[2];
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.33, -baseSize * 0.75);
        ctx.lineTo(baseSize * 0.1, -baseSize * 1.6);
        ctx.lineTo(baseSize * 0.33, -baseSize * 0.75);
        ctx.stroke();

        // Hat brim
        ctx.fillStyle = this.robeColor;
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.78, baseSize * 0.4, baseSize * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = this.robeColorDark;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.78, baseSize * 0.4, baseSize * 0.12, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Magic symbols on hat (earth's hat traditionally omitted this, per its stonework theme)
        if (this.hatShowStar) {
            ctx.fillStyle = this.glowColor;
            const starSize = baseSize * 0.12;
            for (let i = 0; i < 3; i++) {
                const angle = (i * Math.PI * 2 / 3) - Math.PI / 2;
                const x = Math.cos(angle) * baseSize * 0.18;
                const y = -baseSize * 0.5 + Math.sin(angle) * baseSize * 0.1;
                ctx.font = `bold ${starSize}px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('✦', x, y);
            }
        }

        // Glowing tip
        ctx.fillStyle = this._tipGlow;
        ctx.beginPath();
        ctx.arc(baseSize * 0.1, -baseSize * 1.58, baseSize * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Tip spark
        ctx.fillStyle = this.glowColor;
        ctx.beginPath();
        ctx.arc(baseSize * 0.1, -baseSize * 1.6, baseSize * 0.05, 0, Math.PI * 2);
        ctx.fill();
    }
}
