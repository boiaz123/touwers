import { Container, Sprite, Graphics, Texture } from 'pixi.js';
import { CanvasGraphicsShim } from '../CanvasGraphicsShim.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Baked canvas = sizeHint × BAKE_PAD + entity.jumpHeight extra pixels.
 * Must be large enough to contain the enemy at max extent (including jump arc,
 * wizard hat tip, shadow ellipse below feet).
 */
const BAKE_PAD = 9;

/** Number of animation frames to pre-bake per unique (type, variant) pair. */
const BAKE_FRAMES = 16;

/**
 * BasicEnemy (and most humanoid enemies) drive walk-cycle via sin(t × frequency).
 * One cycle = 2π / frequency seconds. Frames are sampled uniformly over one cycle.
 * Default for enemy types that don't override via getWalkFrequency() (see below) -
 * BasicEnemy/ArcherEnemy/VillagerEnemy/MageEnemy all use exactly this value already.
 */
const WALK_FREQ = 8; // radians per second

/**
 * Some enemy types intentionally animate at a different rate for character feel
 * (e.g. BeefyEnemy's slower, heavier gait) and expose it via an optional
 * getWalkFrequency() method. Baking with the wrong frequency doesn't freeze the
 * pose (each frame is still computed live from animationTime), but it samples
 * less - or more - than one full cycle, so the loop visibly snaps/discontinuities
 * at the wrap point instead of animating smoothly. Falls back to WALK_FREQ for
 * every type that doesn't override it.
 */
function _walkFreq(entity) {
    return typeof entity.getWalkFrequency === 'function' ? entity.getWalkFrequency() : WALK_FREQ;
}

/**
 * Per-type override for the Mode B redraw rate below, mirroring _walkFreq() above. ANIM_FPS=20
 * was tuned for typical humanoid animation cycles (~0.6-1s), but a fast short-cycle animation
 * (e.g. base FrogEnemy's 0.4s hop) only gets ~8 redraws/cycle at that rate - visibly choppier
 * than a longer-cycle type gets at the same fps. Falls back to ANIM_FPS for every type that
 * doesn't override it.
 */
function _animFps(entity) {
    return typeof entity.getAnimFps === 'function' ? entity.getAnimFps() : ANIM_FPS;
}

/**
 * Mode-B (live-Graphics) redraws are capped at this rate. At 60fps, roughly
 * 2 in 3 frames are skipped → 67 % fewer Graphics calls for particle enemies.
 */
const ANIM_FPS = 20;

// Health bar layout – in baseSize units, matching the convention used by all enemies.
const HB_Y   = -2.1;   // y-offset above entity centre
const HB_W   =  3.0;   // width
const HB_H   =  0.35;  // height
const HB_BUCKETS = 20; // resolution of health-change detection

/**
 * Particle array fields found on FrogEnemy variants and MageEnemy.
 * If any of these exist as an Array on an entity → Mode B is used.
 * They are also temporarily cleared during Mode-A baking to avoid baking
 * world-space particle positions into the shared frame textures.
 */
const PARTICLE_FIELDS = ['magicParticles', 'crystalParticles', 'orbParticles'];

// ---------------------------------------------------------------------------
// Module-level helpers (not on prototype – keeps sync() allocation-free)
// ---------------------------------------------------------------------------

/**
 * Shared frame texture cache.  Key: "ClassName:variantKey".
 * Entries survive for the process lifetime; enemy types/variants are O(dozens).
 * @type {Map<string, import('pixi.js').Texture[]>}
 */
const _frameCache = new Map();

function _getOrBakeFrames(entity, sizeHint, key) {
    if (_frameCache.has(key)) return _frameCache.get(key);
    const frames = _bakeFrames(entity, sizeHint);
    _frameCache.set(key, frames);
    return frames;
}

/**
 * Pre-bake BAKE_FRAMES animation frames for a given entity type+variant.
 * Uses a real Canvas 2D context (NOT the Pixi shim) – the entity's existing
 * draw code runs unchanged.  Entity state is saved/restored so baking is a
 * pure side-effect-free read of the entity's visual.
 *
 * Each canvas is centred so that entity.x = 0, entity.y = 0 maps to the
 * canvas midpoint.  Sprites rendered from these textures are positioned by
 * setting entryContainer.x/y = entity.x/y with anchor (0.5, 0.5).
 */
function _bakeFrames(entity, sizeHint) {
    const jumpHeight = entity.jumpHeight || 0;
    const canvasSize = Math.ceil(Math.max(sizeHint, 1) * BAKE_PAD) + jumpHeight;
    const origin     = canvasSize / 2;

    // --- save entity state ---
    const savedX           = entity.x;
    const savedY           = entity.y;
    const savedAnimTime    = entity.animationTime;
    const savedPhase       = entity.animationPhaseOffset;
    const savedJumpTimer   = entity.jumpAnimationTimer; // undefined for non-jumping types

    entity.x = 0;
    entity.y = 0;
    // Signal to renderDynamicParts: health bar is owned by the adapter (Mode A), skip it.
    entity._baking = true;
    // Zero phase offset so that frame i always represents the same normalised
    // position in the cycle regardless of which specific instance is baking.
    if (typeof entity.animationPhaseOffset === 'number') entity.animationPhaseOffset = 0;

    // Clear particle arrays: particles carry world-space coordinates that would
    // be nonsensical when baked into a shared local-space texture.
    const savedParticles = {};
    for (const f of PARTICLE_FIELDS) {
        if (Array.isArray(entity[f])) { savedParticles[f] = entity[f]; entity[f] = []; }
    }

    // --- bake N frames ---
    const hasJump      = typeof entity.jumpAnimationTimer === 'number';
    const cycleDuration = hasJump
        ? (entity.jumpAnimationDuration || 0.4)
        : (2 * Math.PI) / _walkFreq(entity);

    const frames = [];
    for (let i = 0; i < BAKE_FRAMES; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = canvasSize;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        // Shift origin to canvas centre so entity draws at (entity.x, entity.y) = (0, 0)
        // and the result is centred in the texture.
        ctx.translate(origin, origin);

        if (hasJump) {
            entity.jumpAnimationTimer = (i / BAKE_FRAMES) * cycleDuration;
            entity.animationTime      = 0;
        } else {
            entity.animationTime = (i / BAKE_FRAMES) * cycleDuration;
        }

        entity.renderDynamicParts(ctx, sizeHint);

        const tex = Texture.from(canvas);
        tex.source.scaleMode = 'linear';
        frames.push(tex);
    }

    // --- restore entity state ---
    entity._baking = false;
    entity.x = savedX;
    entity.y = savedY;
    entity.animationTime = savedAnimTime;
    if (typeof savedPhase === 'number') entity.animationPhaseOffset = savedPhase;
    if (savedJumpTimer !== undefined) entity.jumpAnimationTimer = savedJumpTimer;
    for (const [f, arr] of Object.entries(savedParticles)) entity[f] = arr;

    return frames;
}

/**
 * Map the entity's current animation state to a baked frame index [0, frameCount).
 *
 * Jump enemies: scrub through the jump cycle (jumpAnimationTimer / jumpAnimationDuration).
 * Walk enemies: scrub through the sine walk cycle using (animationTime × _walkFreq(entity) + phaseOffset).
 *
 * This mirrors exactly how _bakeFrames populates the frame array, so frame i
 * always corresponds to the correct animation pose.
 */
function _frameIndex(entity, frameCount) {
    if (typeof entity.jumpAnimationTimer === 'number') {
        const t = entity.jumpAnimationTimer / (entity.jumpAnimationDuration || 0.4);
        return Math.floor(((t % 1) + 1) % 1 * frameCount) % frameCount;
    }
    const raw   = entity.animationTime * _walkFreq(entity) + (entity.animationPhaseOffset || 0);
    const phase = ((raw % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    return Math.floor(phase / (2 * Math.PI) * frameCount) % frameCount;
}

/** Redraw the health bar Graphics in the entry container's local space. */
function _drawHealthBar(g, healthFraction, sizeHint) {
    g.clear();
    const bw = sizeHint * HB_W;
    const bh = sizeHint * HB_H;
    const bx = -bw * 0.5;
    const by = sizeHint * HB_Y;

    g.rect(bx, by, bw, bh).fill(0x000000);
    const col = healthFraction > 0.5 ? 0x4CAF50
              : healthFraction > 0.25 ? 0xFFC107
              : 0xF44336;
    g.rect(bx, by, Math.max(0, bw * healthFraction), bh).fill(col);
    g.rect(bx, by, bw, bh).stroke({ width: 0.5, color: 0x2F2F2F });
}

// ---------------------------------------------------------------------------

/**
 * Phase 4 of the Canvas2D → Pixi migration: enemy (and loot bag) rendering.
 *
 * TWO RENDERING MODES, chosen automatically per entity type at register() time:
 *
 * ─── MODE A ── Pre-baked sprite animation  (particle-free enemies: Basic/Knight/etc.) ───
 *   • BAKE_FRAMES animation frames baked to PIXI.Textures once per (type, variant) pair,
 *     shared across all instances.  Baking calls the entity's own renderDynamicParts()
 *     against a real Canvas 2D context – no Pixi shim involved at all.
 *   • Per-frame cost: one Sprite.texture swap + health bar Graphics update ONLY when
 *     health changes.  ≈ 0 Graphics calls per enemy per frame.
 *
 * ─── MODE B ── Rate-limited live Graphics  (particle enemies: Frog variants, Mage) ───
 *   • Original CanvasGraphicsShim approach, but redraws throttled to ANIM_FPS (20/s).
 *   • Container is positioned at entity world position each frame; entity.x/y are
 *     temporarily zeroed during the render so all Graphics commands produce local-space
 *     coordinates.  Position updates (container.x/y) are therefore cheap and happen every
 *     frame, while the expensive shim.reset()+renderDynamicParts() path fires only
 *     ~1/3 of frames.
 *   • Particle arrays are offset to local space before each render and restored after.
 */
export class EnemyRenderAdapter {

    /**
     * @param {Container} sharedEntityLayer - sortable Container shared with Tower/BuildingRenderAdapter
     * @param {object}    textureCache      - PixiTextureCache instance (kept for API compatibility)
     */
    constructor(sharedEntityLayer, textureCache) {
        this.container    = sharedEntityLayer;
        this.textureCache = textureCache;
        /** @type {Map<object, object>} */
        this._entries = new Map();
    }

    has(entity) { return this._entries.has(entity); }

    register(entity, sizeHint) {
        const variantKey    = typeof entity.getRenderVariantKey === 'function'
                              ? entity.getRenderVariantKey() : '';
        const frameCacheKey = `${entity.constructor.name}:${variantKey}`;

        // Mode A (baked sprites) only for entities that have discrete health and no
        // continuously-varying particles. LootBag / RealmShardDrop lack maxHealth and
        // animate continuously (bob, sparkle, glow) - force them to Mode B so they don't
        // get baked into a small frame loop and don't accidentally receive a health bar.
        const modeA = !PARTICLE_FIELDS.some(f => Array.isArray(entity[f]))
                      && typeof entity.maxHealth === 'number';

        const entryContainer = new Container();
        let entry;

        if (modeA) {
            const frames    = _getOrBakeFrames(entity, sizeHint, frameCacheKey);
            const bodySprite = new Sprite(frames[0]);
            bodySprite.anchor.set(0.5, 0.5);

            const healthBar = new Graphics();

            entryContainer.addChild(bodySprite, healthBar);
            this.container.addChild(entryContainer);

            // Draw initial full-health bar; seed lastHealthBucket to match so
            // the first sync() doesn't redundantly redraw.
            _drawHealthBar(healthBar, 1.0, sizeHint);

            entry = {
                modeA:           true,
                entryContainer,  bodySprite, healthBar, frames,
                currentVariantKey: variantKey,
                lastHealthBucket:  HB_BUCKETS,
            };

        } else {
            // Mode B: live Graphics via CanvasGraphicsShim, rate-limited redraws.
            const dynamic = new Graphics();
            entryContainer.addChild(dynamic);
            this.container.addChild(entryContainer);

            const shim = new CanvasGraphicsShim(dynamic);

            entry = {
                modeA:          false,
                entryContainer, dynamic, shim,
                lastAnimKey:    -1,
                // Per-instance offset into the ANIM_FPS bucket below (see _syncModeB) -
                // entity.animationTime naturally staggers same-wave enemies somewhat since
                // it starts ticking at each one's own spawn moment, but simultaneously
                // spawned/injected enemies (e.g. a full wave dropped at once) still share
                // the same bucket boundary without this, clustering their redraw work into
                // one frame in twenty rather than spreading it evenly - see the identical
                // fix + measurement writeup in TowerRenderAdapter.js.
                animPhaseOffset: Math.random() / ANIM_FPS,
            };
        }

        this._entries.set(entity, entry);
        entity.skipCanvas2DBodyRender = true;

        // Position eagerly so entity does not flash at (0,0) on the first frame.
        entryContainer.x      = entity.x;
        entryContainer.y      = entity.y;
        entryContainer.zIndex = entity.y;
    }

    unregister(entity) {
        const entry = this._entries.get(entity);
        if (!entry) return;
        this.container.removeChild(entry.entryContainer);
        // texture: false → baked textures in _frameCache are NOT destroyed here;
        // they are shared across instances and persist for the process lifetime.
        entry.entryContainer.destroy({ children: true, texture: false });
        if (!entry.modeA) entry.shim.destroyGradients();
        this._entries.delete(entity);
        entity.skipCanvas2DBodyRender = false;
    }

    /** Call once per frame for every registered entity. */
    sync(entity, sizeHint) {
        const entry = this._entries.get(entity);
        if (!entry) return;

        // Container world position + Y-sort zIndex updated every frame for both modes.
        entry.entryContainer.x      = entity.x;
        entry.entryContainer.y      = entity.y;
        entry.entryContainer.zIndex = entity.y;

        if (entry.modeA) {
            this._syncModeA(entity, sizeHint, entry);
        } else {
            this._syncModeB(entity, sizeHint, entry);
        }
    }

    // ── Mode A ──────────────────────────────────────────────────────────────

    _syncModeA(entity, sizeHint, entry) {
        // Re-bake if the visual variant changed (defensive – currently only
        // relevant for future enemies with dynamic appearance).
        const variantKey = typeof entity.getRenderVariantKey === 'function'
                           ? entity.getRenderVariantKey() : '';
        if (variantKey !== entry.currentVariantKey) {
            entry.currentVariantKey  = variantKey;
            entry.frames             = _getOrBakeFrames(entity, sizeHint,
                                           `${entity.constructor.name}:${variantKey}`);
            entry.lastHealthBucket   = -1;
        }

        // Swap to the correct animation frame – zero Graphics calls.
        entry.bodySprite.texture = entry.frames[_frameIndex(entity, entry.frames.length)];

        // Health bar: redraw only when health changes by ≥ 1/HB_BUCKETS.
        const hb = Math.round(entity.health / entity.maxHealth * HB_BUCKETS);
        if (hb !== entry.lastHealthBucket) {
            entry.lastHealthBucket = hb;
            _drawHealthBar(entry.healthBar, entity.health / entity.maxHealth, sizeHint);
        }
    }

    // ── Mode B ──────────────────────────────────────────────────────────────

    _syncModeB(entity, sizeHint, entry) {
        // Rate-limit redraws to _animFps(entity) (defaults to ANIM_FPS).  Container position
        // already updated above, so the entity tracks smoothly even when the Graphics content
        // is cached.
        const animKey = Math.floor((entity.animationTime + entry.animPhaseOffset) * _animFps(entity));
        if (animKey === entry.lastAnimKey) return;
        entry.lastAnimKey = animKey;

        // --- draw in local space ---
        // Zero entity position so all renderDynamicParts coordinates become local
        // (relative to the container placed at the entity's world position).
        const savedX = entity.x, savedY = entity.y;
        entity.x = 0;
        entity.y = 0;

        // Shift live particle positions to local space so they follow the entity
        // correctly when the container is positioned in world space.
        for (const f of PARTICLE_FIELDS) {
            if (!entity[f]) continue;
            for (const p of entity[f]) { p.x -= savedX; p.y -= savedY; }
        }

        try {
            entry.shim.reset();
            entity.renderDynamicParts(entry.shim, sizeHint);
        } finally {
            entity.x = savedX;
            entity.y = savedY;
            // Restore particle world positions unconditionally.
            for (const f of PARTICLE_FIELDS) {
                if (!entity[f]) continue;
                for (const p of entity[f]) { p.x += savedX; p.y += savedY; }
            }
        }
    }
}
