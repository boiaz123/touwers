import { BaseEnemy } from './BaseEnemy.js';
import { EnemyColorCache, FROG_COLOR_VARIANTS } from '../../utils/EnemyColorCache.js';
import { drawFlipperFoot } from './rendering/FrogFlipperRenderer.js';
import { drawTaperedPath } from './rendering/TaperedShapeRenderer.js';
import { drawSkinAura } from './rendering/EnemyAuraRenderer.js';
import { hexToRgbaTable } from '../../utils/colorUtils.js';

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

    // Per-glowColor aura/highlight tables (101 alpha levels), shared across every
    // instance of an element - used for the skin aura and the elemental texture's
    // glow-tinted highlights.
    static _auraColorTables = new Map();

    // Fixed, non-elemental hat palette shared by every battle-mage frog - the
    // hat is a piece of common "mage order" gear, not colored per element, so
    // all four frogs wear an identical charcoal-and-leather hat regardless of
    // their skin/robe/glow colors.
    static HAT_COLORS = ['#5C5468', '#3B3548', '#201C2B'];
    static HAT_TRIM_COLOR = '#100D18';
    static HAT_BAND_COLOR = '#2A1D14';
    static HAT_RIVET_COLOR = '#B08D57';
    static HAT_GEM_COLOR = '#E8B84B';
    static HAT_GEM_TRIM_COLOR = '#5C4415';

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

    /** 101-entry alpha lookup table for this element's glowColor - shared by the skin
     *  aura and the elemental texture's glow-tinted highlights (see drawElementalTexture),
     *  so translucency is baked into the fill color instead of relying on ctx.globalAlpha
     *  (which CanvasGraphicsShim applies once to the whole Graphics object at render time,
     *  not per draw call - see EnemyAuraRenderer.js's file doc). */
    _getAuraTable() {
        let table = ElementalFrogEnemy._auraColorTables.get(this.glowColor);
        if (!table) {
            table = hexToRgbaTable(this.glowColor);
            ElementalFrogEnemy._auraColorTables.set(this.glowColor, table);
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
        if (this.particleSpawnCounter > 0.22) {
            this.spawnMagicParticle();
            this.particleSpawnCounter = 0;
        }

        // Update magic particles (compact-in-place: avoids O(n) splice-shift per removal)
        let magicWriteIdx = 0;
        for (let i = 0; i < this.magicParticles.length; i++) {
            const particle = this.magicParticles[i];
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            particle.size = Math.max(0, particle.size * (particle.life / particle.maxLife));
            if (particle.life > 0) {
                this.magicParticles[magicWriteIdx++] = particle;
            }
        }
        this.magicParticles.length = magicWriteIdx;

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
            this.updateFacing(dx);
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
        if (this.magicParticles.length >= 12) return;

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
            size: Math.random() * 3 + 1.8,
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

        // --- MAGICAL AURA (close-to-skin elemental glow, drawn behind everything so
        // it only peeks out past the body/head silhouette) ---
        const auraPulse = 0.5 + 0.5 * Math.sin(this.animationTime * 2.2 + this.animationPhaseOffset);
        drawSkinAura(ctx, this._getAuraTable(), auraPulse, [
            { x: 0, y: baseSize * 0.05, rx: baseSize * 0.52 * bodyScaleX, ry: baseSize * 0.5 * bodyScaleY },
            { x: 0, y: -baseSize * 0.45, rx: baseSize * 0.48, ry: baseSize * 0.45 },
        ]);

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

        // Crown-of-skull shading, same technique as FrogKingEnemy's head - reads as a
        // heavier, more brooding brow instead of a flat, evenly-lit ball.
        ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.63, baseSize * 0.36, baseSize * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        // --- SNOUT + NOSTRILS (was entirely missing - a flat head with no protruding
        // snout is what read as a generic "ball head" instead of a frog) ---
        ctx.fillStyle = this.cachedLightenColor;
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.24, baseSize * 0.23, baseSize * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = this.cachedDarken2Color;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.24, baseSize * 0.23, baseSize * 0.15, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = this.cachedDarken2Color;
        ctx.beginPath();
        ctx.ellipse(-baseSize * 0.08, -baseSize * 0.17, baseSize * 0.03, baseSize * 0.018, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(baseSize * 0.08, -baseSize * 0.17, baseSize * 0.03, baseSize * 0.018, 0, 0, Math.PI * 2);
        ctx.fill();

        // --- PAROTOID GLAND BUMPS (classic frog/toad anatomy - raised glands angled
        // back/outward from the eyes, not flat forehead spots) ---
        for (const side of [-1, 1]) {
            const gx = side * baseSize * 0.34, gy = -baseSize * 0.72;
            ctx.fillStyle = this.cachedDarken2Color;
            ctx.beginPath();
            ctx.ellipse(gx, gy, baseSize * 0.1, baseSize * 0.065, side * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = this.cachedLightenColor;
            ctx.beginPath();
            ctx.ellipse(gx - side * baseSize * 0.02, gy - baseSize * 0.02, baseSize * 0.045, baseSize * 0.028, side * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // --- MENACING EYES: narrow, hooded, glowing vertical-slit pupils with a
        // furrowed brow, replacing the previous round "googly" cartoon eyes ---
        this._drawMageEye(ctx, -baseSize * 0.2, -baseSize * 0.6, -1, baseSize);
        this._drawMageEye(ctx, baseSize * 0.2, -baseSize * 0.6, 1, baseSize);

        // --- MOUTH (wide toothy snarl instead of a thin smiling line) ---
        ctx.fillStyle = this.cachedDarken2Color;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.22, -baseSize * 0.17);
        ctx.quadraticCurveTo(0, -baseSize * 0.09, baseSize * 0.22, -baseSize * 0.17);
        ctx.quadraticCurveTo(0, baseSize * 0.02, -baseSize * 0.22, -baseSize * 0.17);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.19, -baseSize * 0.16);
        ctx.quadraticCurveTo(0, -baseSize * 0.02, baseSize * 0.19, -baseSize * 0.16);
        ctx.quadraticCurveTo(0, -baseSize * 0.005, -baseSize * 0.19, -baseSize * 0.16);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#F5F5F0';
        for (const side of [-1, 1]) {
            const fx = side * baseSize * 0.17;
            ctx.beginPath();
            ctx.moveTo(fx, -baseSize * 0.16);
            ctx.lineTo(fx - side * baseSize * 0.05, -baseSize * 0.16);
            ctx.lineTo(fx - side * baseSize * 0.02, -baseSize * 0.08);
            ctx.closePath();
            ctx.fill();
        }

        // --- THROAT POUCH (subtle breathing detail below the mouth, matching the
        // technique base FrogEnemy uses) ---
        const throatPulse = 0.6 + 0.4 * Math.sin(this.animationTime * 2.4 + this.animationPhaseOffset);
        ctx.fillStyle = ElementalFrogEnemy._colors.get(this.skinColor, 'lighten_body');
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.08, baseSize * 0.14, baseSize * 0.1 * throatPulse, 0, 0, Math.PI * 2);
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
     *  as thematically distinct beyond just its base palette. Translucency here is
     *  always baked directly into fillStyle/strokeStyle as an rgba() string (via
     *  _getAuraTable() or a literal rgba literal) rather than ctx.globalAlpha - under
     *  CanvasGraphicsShim, globalAlpha maps to Pixi Graphics.alpha, a single value
     *  applied to the WHOLE Graphics object at render time, so a set-then-reset
     *  globalAlpha pattern within one synchronous render call has no visible effect
     *  (see EnemyAuraRenderer.js's file doc for the full explanation). */
    drawElementalTexture(ctx, baseSize, bodyScaleX, bodyScaleY) {
        const auraTable = this._getAuraTable();
        switch (this.elementalType) {
            case 'fire': {
                // Glowing ember cracks across the body, like heat-cracked skin/hide.
                ctx.strokeStyle = auraTable[70];
                ctx.lineWidth = baseSize * 0.025;
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
                // Tiny glowing ember specks at a couple of the crack tips.
                ctx.fillStyle = auraTable[90];
                for (const [ex, ey] of [[-0.06, 0.02], [0.2, -0.02]]) {
                    ctx.beginPath();
                    ctx.arc(ex * baseSize, ey * baseSize, baseSize * 0.035, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            }
            case 'water': {
                // Translucent scale/ripple marks across the back, rimmed with the
                // elemental glow so they read as magically lit, not just wet skin.
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
                ctx.lineWidth = baseSize * 0.02;
                const scales = [[-0.16, -0.1], [0.13, -0.16], [-0.04, 0.16], [0.18, 0.08]];
                for (const [x, y] of scales) {
                    ctx.beginPath();
                    ctx.arc(x * baseSize, y * baseSize, baseSize * 0.06, Math.PI * 0.15, Math.PI * 0.85);
                    ctx.stroke();
                }
                ctx.strokeStyle = auraTable[45];
                ctx.lineWidth = baseSize * 0.014;
                for (const [x, y] of scales) {
                    ctx.beginPath();
                    ctx.arc(x * baseSize, y * baseSize, baseSize * 0.09, Math.PI * 0.2, Math.PI * 0.7);
                    ctx.stroke();
                }
                break;
            }
            case 'earth': {
                // Small moss/rock patches mottling the hide, plus a couple of vivid
                // moss-green glints so the earth frog reads as more than solid brown.
                const patches = [
                    [-0.17, -0.1, 'rgba(90, 107, 58, 0.55)'], [0.15, 0.04, 'rgba(107, 90, 58, 0.55)'], [-0.05, 0.2, 'rgba(74, 90, 42, 0.55)'],
                ];
                for (const [x, y, c] of patches) {
                    ctx.fillStyle = c;
                    ctx.beginPath();
                    ctx.ellipse(x * baseSize, y * baseSize, baseSize * 0.075, baseSize * 0.05, 0.3, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = auraTable[55];
                for (const [x, y] of [[-0.17, -0.13], [0.15, 0.01]]) {
                    ctx.beginPath();
                    ctx.ellipse(x * baseSize, y * baseSize, baseSize * 0.03, baseSize * 0.02, 0.3, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            }
            case 'air': {
                // Soft wispy translucent outer glow tracing the body silhouette, tinted
                // with the elemental color so air's identity reads beyond its pale base.
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.lineWidth = baseSize * 0.03;
                ctx.beginPath();
                ctx.ellipse(0, baseSize * 0.05, baseSize * 0.56 * bodyScaleX, baseSize * 0.54 * bodyScaleY, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.strokeStyle = auraTable[55];
                ctx.lineWidth = baseSize * 0.02;
                ctx.beginPath();
                ctx.ellipse(0, baseSize * 0.05, baseSize * 0.61 * bodyScaleX, baseSize * 0.59 * bodyScaleY, 0, 0, Math.PI * 2);
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

        // Back legs - shorter than a stretched-out limb reads: a real crouched frog
        // leg is compact, not long, with most of its visible length coming from the
        // bend rather than segment length.
        const thighLength = baseSize * 0.19;
        const calfLength = baseSize * 0.2;

        // Thigh splayed out to the side, close to horizontal - a real frog's femur
        // at rest sits almost flat against the body, not angled halfway to vertical -
        // so the knee bend below reads as a proper corner instead of a shallow kink.
        const baseThighAngle = side > 0 ? Math.PI / 6 : Math.PI - Math.PI / 6;
        const thighAngle = baseThighAngle - side * extension * 0.15;

        const kneeX = hipX + Math.cos(thighAngle) * thighLength;
        const kneeY = hipY + Math.sin(thighAngle) * thighLength;

        // Calf folds back sharply at rest - a tight ~75-80 degree corner at the knee,
        // matching a real frog's crouched silhouette (near-horizontal thigh, near-
        // vertical shin) - and straightens toward a nearly-inline leg as it extends
        // into the leap. Still shallow enough that the shin doesn't swing past
        // vertical and cross under the body toward the other leg.
        const restCalfBend = side * 1.35;
        const calfAngle = thighAngle + restCalfBend * (1 - extension * 0.85);

        const footX = kneeX + Math.cos(calfAngle) * calfLength;
        const footY = kneeY + Math.sin(calfAngle) * calfLength;

        // Leg (hip -> knee -> ankle) as ONE continuous tapered shape instead of
        // separate stroked segments plus a knee-joint circle - stacking independent
        // round shapes at the joint is what read as a chain of blobs rather than a
        // single natural limb. Matches the same fix already applied to FrogKingEnemy's
        // legs (see TaperedShapeRenderer.js) so both read consistently.
        const legWidths = [baseSize * 0.15, baseSize * 0.12, baseSize * 0.09];
        drawTaperedPath(
            ctx,
            [{ x: hipX + 1, y: hipY + 1 }, { x: kneeX + 1, y: kneeY + 1 }, { x: footX + 1, y: footY + 1 }],
            legWidths,
            'rgba(0, 0, 0, 0.12)', null
        );

        drawTaperedPath(
            ctx,
            [{ x: hipX, y: hipY }, { x: kneeX, y: kneeY }, { x: footX, y: footY }],
            legWidths,
            ElementalFrogEnemy._colors.get(this.skinColor, 'darken_leg'),
            ElementalFrogEnemy._colors.get(this.skinColor, 'darken_detail'),
            1
        );

        // Toe-pad foot - a palm with distinct thin-necked, round-padded toes fanning
        // out, not a webbed paddle. See FrogFlipperRenderer.js.
        drawFlipperFoot(
            ctx, footX, footY, calfAngle,
            baseSize * 0.27, baseSize * 0.15,
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
            baseSize * 0.2, baseSize * 0.11,
            ElementalFrogEnemy._colors.get(this.skinColor, 'lighten_foot'),
            ElementalFrogEnemy._colors.get(this.skinColor, 'darken_detail')
        );
    }

    /** Narrow, hooded, glowing-slit eye with a furrowed brow - replaces the previous
     *  round "googly" cartoon eye construction (dark circle + white circle + colored
     *  circle + offset black pupil), which is what read as a cute plush toy rather
     *  than a menacing battle-mage. Built entirely from unrotated ellipses/arcs and
     *  literal angled line segments - never ctx.ellipse's rotation param, which
     *  CanvasGraphicsShim silently drops (see FrogKingEnemy's similarly-intended but
     *  never-actually-tilted eyes) - so the brow's inward "angry" slant actually
     *  renders in-game. */
    _drawMageEye(ctx, x, y, side, baseSize) {
        // Furrowed brow - a thick dark ridge slanting down toward the snout
        ctx.strokeStyle = this.cachedDarken2Color;
        ctx.lineWidth = baseSize * 0.05;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x + side * baseSize * 0.16, y - baseSize * 0.14);
        ctx.lineTo(x - side * baseSize * 0.13, y - baseSize * 0.02);
        ctx.stroke();

        // Hooded socket - narrower than a full circle so the eye reads as a
        // squinting slit rather than a wide-open cartoon circle
        ctx.fillStyle = this.cachedDarken2Color;
        ctx.beginPath();
        ctx.ellipse(x, y, baseSize * 0.15, baseSize * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFACD';
        ctx.beginPath();
        ctx.ellipse(x, y + baseSize * 0.01, baseSize * 0.11, baseSize * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glowing elemental iris with a vertical slit pupil, shifted toward the
        // snout so the frog reads as glaring forward instead of cross-eyed outward
        const irisX = x - side * baseSize * 0.02;
        ctx.fillStyle = this.glowColor;
        ctx.beginPath();
        ctx.arc(irisX, y, baseSize * 0.065, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(irisX, y, baseSize * 0.02, baseSize * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.beginPath();
        ctx.arc(irisX - side * baseSize * 0.025, y - baseSize * 0.035, baseSize * 0.02, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBattleMageHat(ctx, baseSize) {
        // Fixed, compact silhouette shared by all four elements (see HAT_COLORS
        // etc. below) - smaller than the earlier oversized pass, and with the
        // separate brim ellipse removed entirely (it read as an odd floating
        // disc under the cone). The wrapped strap band near the base is now the
        // hat's only anchor to the head. Still leans/flops to one side rather
        // than a stiff straight cone, just at reduced scale.
        const baseL = { x: -baseSize * 0.28, y: -baseSize * 0.74 };
        const baseR = { x: baseSize * 0.28, y: -baseSize * 0.74 };
        const peak = { x: baseSize * 0.2, y: -baseSize * 1.32 };
        const tip = { x: baseSize * 0.37, y: -baseSize * 1.06 };
        const spineCtrl = { x: -baseSize * 0.06, y: -baseSize * 1.06 };
        const crownCtrl = { x: baseSize * 0.44, y: -baseSize * 1.25 };
        const drapeCtrl = { x: baseSize * 0.47, y: -baseSize * 0.88 };

        const [top, mid, bottom] = ElementalFrogEnemy.HAT_COLORS;
        if (!this._hatGrad || this._hatGradBaseSize !== baseSize || this._hatGradCtx !== ctx) {
            this._hatGradCtx = ctx;
            this._hatGradBaseSize = baseSize;
            this._hatGrad = ctx.createLinearGradient(baseL.x, baseL.y, tip.x, peak.y);
            this._hatGrad.addColorStop(0, top);
            this._hatGrad.addColorStop(0.55, mid);
            this._hatGrad.addColorStop(1, bottom);
            this._tipGlow = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, baseSize * 0.16);
            this._tipGlow.addColorStop(0, ElementalFrogEnemy.HAT_GEM_COLOR);
            this._tipGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        }

        ctx.fillStyle = this._hatGrad;
        ctx.beginPath();
        ctx.moveTo(baseL.x, baseL.y);
        ctx.quadraticCurveTo(spineCtrl.x, spineCtrl.y, peak.x, peak.y);
        ctx.quadraticCurveTo(crownCtrl.x, crownCtrl.y, tip.x, tip.y);
        ctx.quadraticCurveTo(drapeCtrl.x, drapeCtrl.y, baseR.x, baseR.y);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = ElementalFrogEnemy.HAT_TRIM_COLOR;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(baseL.x, baseL.y);
        ctx.quadraticCurveTo(spineCtrl.x, spineCtrl.y, peak.x, peak.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(peak.x, peak.y);
        ctx.quadraticCurveTo(crownCtrl.x, crownCtrl.y, tip.x, tip.y);
        ctx.quadraticCurveTo(drapeCtrl.x, drapeCtrl.y, baseR.x, baseR.y);
        ctx.stroke();

        // Fabric fold (spine-side crease) and a sheen highlight along the outer
        // drape - detail that reads as soft draped cloth instead of a flat
        // painted triangle
        ctx.strokeStyle = ElementalFrogEnemy.HAT_TRIM_COLOR;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(baseL.x + baseSize * 0.1, baseL.y - baseSize * 0.02);
        ctx.quadraticCurveTo(spineCtrl.x + baseSize * 0.1, spineCtrl.y, peak.x - baseSize * 0.04, peak.y + baseSize * 0.11);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(peak.x + baseSize * 0.08, peak.y + baseSize * 0.08);
        ctx.quadraticCurveTo(crownCtrl.x - baseSize * 0.06, crownCtrl.y, tip.x - baseSize * 0.05, tip.y - baseSize * 0.05);
        ctx.stroke();

        // Wrapped strap band with rivets and a single gem clasp - the hat's only
        // anchor to the head now that the brim ellipse is gone
        ctx.fillStyle = ElementalFrogEnemy.HAT_BAND_COLOR;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.25, -baseSize * 0.72);
        ctx.quadraticCurveTo(0, -baseSize * 0.66, baseSize * 0.23, -baseSize * 0.73);
        ctx.lineTo(baseSize * 0.2, -baseSize * 0.62);
        ctx.quadraticCurveTo(0, -baseSize * 0.56, -baseSize * 0.22, -baseSize * 0.61);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = ElementalFrogEnemy.HAT_RIVET_COLOR;
        for (const rx of [-0.15, -0.05, 0.07, 0.16]) {
            ctx.beginPath();
            ctx.arc(rx * baseSize, -baseSize * 0.675, baseSize * 0.012, 0, Math.PI * 2);
            ctx.fill();
        }

        const gemY = -baseSize * 0.675;
        ctx.fillStyle = ElementalFrogEnemy.HAT_GEM_COLOR;
        ctx.beginPath();
        ctx.moveTo(baseSize * 0.01, gemY - baseSize * 0.065);
        ctx.lineTo(baseSize * 0.055, gemY);
        ctx.lineTo(baseSize * 0.01, gemY + baseSize * 0.065);
        ctx.lineTo(-baseSize * 0.03, gemY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = ElementalFrogEnemy.HAT_GEM_TRIM_COLOR;
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(baseSize * 0.01, gemY - baseSize * 0.05);
        ctx.lineTo(baseSize * 0.01, gemY + baseSize * 0.05);
        ctx.stroke();

        // Small glowing tip ornament - fixed neutral gold, matching the rest of
        // the now-static hat palette rather than the frog's elemental glow color
        ctx.fillStyle = this._tipGlow;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, baseSize * 0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = ElementalFrogEnemy.HAT_GEM_COLOR;
        ctx.beginPath();
        ctx.moveTo(tip.x, tip.y - baseSize * 0.09);
        ctx.lineTo(tip.x + baseSize * 0.04, tip.y);
        ctx.lineTo(tip.x, tip.y + baseSize * 0.065);
        ctx.lineTo(tip.x - baseSize * 0.04, tip.y);
        ctx.closePath();
        ctx.fill();
    }
}
