import { Container, Sprite, Graphics, Texture, Rectangle } from 'pixi.js';
import { CanvasGraphicsShim } from '../CanvasGraphicsShim.js';
import { bakeRigAtlas } from '../../../entities/enemies/rendering/RigCommon.js';

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
 * (e.g. the elemental frogs' hop) only gets ~8 redraws/cycle at that rate - visibly choppier
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

/**
 * Mode B's per-entity rate above is fine for a handful of enemies, but every redraw
 * tears down and rebuilds an entity's whole Graphics (each frog is ~100 shapes, including
 * round-capped strokes that Pixi has to triangulate on the CPU), so cost scales with
 * (live-Graphics enemies x their fps). A Goliath Frog's 20-strong brood at a frog's 40fps
 * is 800 full redraws a second - measured, 40 frogs cost ~5ms of CPU per frame and dropped
 * the frame rate below 60. Rather than a fixed rate that's wasteful for one enemy and too
 * much for a crowd, this is a total budget shared by every Mode-B entity: each one keeps its
 * own rate until the budget runs out, then all slow down together, never below the floor.
 * Small crowds are untouched (a lone frog still gets its full 40fps).
 *
 * (The measurements above were taken on the standard frog, which has since moved to Mode C -
 * the sprite rig, ~0.6ms for 40 frogs instead of ~36ms - so this budget now only governs the
 * enemies that still draw live: the elemental frogs, mages and the Frog King.)
 */
const MODE_B_REDRAW_BUDGET = 720; // total Mode-B redraws/second across all live-Graphics entities
const MODE_B_MIN_FPS = 18;        // floor per entity - a hop is still legible at this rate

// Health bar layout – in baseSize units, matching the convention used by all enemies.
const HB_Y   = -2.1;   // y-offset above entity centre
const HB_W   =  3.0;   // width
const HB_H   =  0.35;  // height
const HB_BUCKETS = 20; // resolution of health-change detection

/**
 * Particle array fields found on the elemental frogs, FrogKing and MageEnemy (and on the
 * standard FrogEnemy, which takes Mode C first - see register()).
 * If any of these exist as an Array on an entity → Mode B is used.
 * They are also temporarily cleared during Mode-A baking to avoid baking
 * world-space particle positions into the shared frame textures.
 */
const PARTICLE_FIELDS = ['magicParticles', 'crystalParticles', 'orbParticles'];

/**
 * Loot (LootBag / RealmShardDrop, identified by their shared `lootId` field - see
 * LootBag.js) must always render above trees, rocks, buildings and enemies so it can
 * never visually disappear behind ground clutter it happens to drop next to. All other
 * entities in this shared, Y-sorted container use their world Y as zIndex; loot instead
 * gets that same Y pushed into its own zIndex band, comfortably above anything terrain/
 * entity Y-sort could produce (levels are at most a few thousand px tall).
 */
const LOOT_ZINDEX_BOOST = 1000000;

function _zIndexFor(entity) {
    return entity.lootId !== undefined ? LOOT_ZINDEX_BOOST + entity.y : entity.y;
}

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

/**
 * Shared texture atlases for rigged enemies (Mode C). Key: the rig spec's own `key`
 * (type + variant + size). Like _frameCache these live for the process lifetime - a handful
 * of small atlases, one per skin colour.
 * @type {Map<string, {textures: Object<string, Texture>, cells: Object}>}
 */
const _rigAtlasCache = new Map();

/**
 * Bake a rig spec's drawables into ONE atlas canvas and cut a Texture frame out of it for each,
 * so every sprite of every enemy sharing the spec draws from a single texture (one batch).
 */
function _getOrBakeRigAtlas(spec) {
    let atlas = _rigAtlasCache.get(spec.key);
    if (atlas) return atlas;

    const { canvas, cells } = bakeRigAtlas(spec);
    const base = Texture.from(canvas);
    base.source.scaleMode = 'linear';

    const textures = {};
    for (const [id, c] of Object.entries(cells)) {
        textures[id] = new Texture({ source: base.source, frame: new Rectangle(c.x, c.y, c.w, c.h) });
    }
    atlas = { textures, cells };
    _rigAtlasCache.set(spec.key, atlas);
    return atlas;
}

/**
 * Redraw the health bar Graphics in the entry container's local space. `layout`
 * ({widthMul, heightMul, yOffsetMul}, all in sizeHint units) lets an enemy keep its own bar
 * proportions - the same options it would pass to BaseEnemy.renderHealthBar; omitted, the
 * shared defaults below apply.
 */
function _drawHealthBar(g, healthFraction, sizeHint, layout) {
    g.clear();
    const bw = sizeHint * (layout ? layout.widthMul : HB_W);
    const bh = layout ? Math.max(2, sizeHint * layout.heightMul) : sizeHint * HB_H;
    const bx = -bw * 0.5;
    const by = sizeHint * (layout ? layout.yOffsetMul : HB_Y);

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
 * THREE RENDERING MODES, chosen automatically per entity type at register() time:
 *
 * ─── MODE C ── Sprite rig  (entities that provide getRigSpec() - the standard FrogEnemy) ───
 *   • The entity describes itself as a handful of parts (see RigCommon.js). Each is baked
 *     once per variant into a single shared texture atlas, and every enemy is then just a few
 *     Sprites whose transforms are written from entity.updateRigPose() each frame.
 *   • Per-frame cost: ~15 sprite transform writes per enemy - no Graphics tessellation at all,
 *     and no redraw throttle, so the animation runs at the full frame rate. (This replaced
 *     Mode B for the frog, which was the single most expensive enemy: ~100 vector shapes
 *     re-triangulated on the CPU every redraw.)
 *   • Poses are per-frame values rather than a fixed frame loop, so each hop can be different.
 *   • Sparkles are pooled sprites in an un-mirrored layer; the health bar is Mode A's.
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
        /** Live Mode-B entries - the divisor for MODE_B_REDRAW_BUDGET (see _syncModeB). */
        this._modeBCount = 0;
    }

    has(entity) { return this._entries.has(entity); }

    register(entity, sizeHint) {
        const variantKey    = typeof entity.getRenderVariantKey === 'function'
                              ? entity.getRenderVariantKey() : '';
        const frameCacheKey = `${entity.constructor.name}:${variantKey}`;

        // Mode C (sprite rig) for entities that describe themselves as rig parts.
        const modeC = typeof entity.getRigSpec === 'function';

        // Mode A (baked sprites) only for entities that have discrete health and no
        // continuously-varying particles. LootBag / RealmShardDrop lack maxHealth and
        // animate continuously (bob, sparkle, glow) - force them to Mode B so they don't
        // get baked into a small frame loop and don't accidentally receive a health bar.
        const modeA = !modeC
                      && !PARTICLE_FIELDS.some(f => Array.isArray(entity[f]))
                      && typeof entity.maxHealth === 'number';

        const entryContainer = new Container();
        let entry;

        if (modeC) {
            entry = this._registerRig(entity, sizeHint, entryContainer);
        } else if (modeA) {
            const frames    = _getOrBakeFrames(entity, sizeHint, frameCacheKey);
            const bodySprite = new Sprite(frames[0]);
            bodySprite.anchor.set(0.5, 0.5);

            const healthBar = new Graphics();

            entryContainer.addChild(bodySprite, healthBar);
            this.container.addChild(entryContainer);

            // An enemy can keep its own bar proportions (same {widthMul, heightMul, yOffsetMul}
            // options as BaseEnemy.renderHealthBar) via an optional getHealthBarLayout().
            const healthLayout = typeof entity.getHealthBarLayout === 'function'
                ? entity.getHealthBarLayout() : undefined;

            // Draw initial full-health bar; seed lastHealthBucket to match so
            // the first sync() doesn't redundantly redraw.
            _drawHealthBar(healthBar, 1.0, sizeHint, healthLayout);

            entry = {
                modeA:           true,
                entryContainer,  bodySprite, healthBar, frames,
                currentVariantKey: variantKey,
                healthLayout,
                lastHealthBucket:  HB_BUCKETS,
            };

        } else {
            // Mode B: live Graphics via CanvasGraphicsShim, rate-limited redraws.
            const dynamic = new Graphics();
            entryContainer.addChild(dynamic);
            this.container.addChild(entryContainer);

            const shim = new CanvasGraphicsShim(dynamic);

            // Health bar drawn on its own Graphics, separate from the body ("dynamic"),
            // so it can be counter-flipped independently in sync() below - entity code
            // draws body + health bar in one renderDynamicParts() call, but redirecting
            // the health bar's draw calls here (via entity._healthBarCtx, see
            // BaseEnemy.renderHealthBar) keeps it from mirroring along with the body.
            // Skipped for entities with no health (e.g. LootBag/RealmShardDrop - see
            // modeA comment above), which never call renderHealthBar in the first place.
            let healthBar = null, healthBarShim = null;
            if (typeof entity.maxHealth === 'number') {
                healthBar = new Graphics();
                entryContainer.addChild(healthBar);
                healthBarShim = new CanvasGraphicsShim(healthBar);
                entity._healthBarCtx = healthBarShim;
            }

            entry = {
                modeA:          false,
                entryContainer, dynamic, shim, healthBar, healthBarShim,
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
            this._modeBCount++;
        }

        this._entries.set(entity, entry);
        entity.skipCanvas2DBodyRender = true;

        // Position eagerly so entity does not flash at (0,0) on the first frame.
        entryContainer.x      = entity.x;
        entryContainer.y      = entity.y;
        entryContainer.zIndex = _zIndexFor(entity);
    }

    /**
     * Build a rig entry: one Sprite per rig item (Containers for groups), all drawn from the
     * spec's shared atlas, plus the un-mirrored sparkle pool and the health bar.
     */
    _registerRig(entity, sizeHint, entryContainer) {
        const spec = entity.getRigSpec(sizeHint);
        const atlas = _getOrBakeRigAtlas(spec);

        const groups = {};
        const items = [];
        for (const item of spec.items) {
            let obj;
            if (item.group) {
                obj = new Container();
                groups[item.id] = obj;
            } else {
                obj = new Sprite(atlas.textures[item.tex]);
                const cell = atlas.cells[item.tex];
                obj.anchor.set(cell.ax, cell.ay);
            }
            (item.parent ? groups[item.parent] : entryContainer).addChild(obj);
            items.push({ id: item.id, obj, isGroup: !!item.group, baseTex: item.tex, tex: null });
        }

        // Sparkles live in their own layer that's counter-flipped in sync(), so they trail
        // behind the enemy on the correct side whichever way it faces (the entry container
        // itself is mirrored for facing).
        const particleLayer = new Container();
        const particles = [];
        if (spec.particles) {
            const cell = atlas.cells[spec.particles.tex];
            for (let i = 0; i < spec.particles.count; i++) {
                const sprite = new Sprite(atlas.textures[spec.particles.tex]);
                sprite.anchor.set(cell.ax, cell.ay);
                sprite.visible = false;
                particleLayer.addChild(sprite);
                particles.push(sprite);
            }
        }
        entryContainer.addChild(particleLayer);

        const healthBar = new Graphics();
        entryContainer.addChild(healthBar);
        _drawHealthBar(healthBar, 1.0, sizeHint, spec.healthBar);
        this.container.addChild(entryContainer);

        return {
            modeA: false, rig: true,
            entryContainer, healthBar, particleLayer,
            atlas, items, particles,
            invBakeScale: 1 / spec.bakeScale,
            healthLayout: spec.healthBar,
            lastHealthBucket: HB_BUCKETS,
        };
    }

    unregister(entity) {
        const entry = this._entries.get(entity);
        if (!entry) return;
        this.container.removeChild(entry.entryContainer);
        // texture: false → baked textures in _frameCache / _rigAtlasCache are NOT destroyed
        // here; they are shared across instances and persist for the process lifetime.
        entry.entryContainer.destroy({ children: true, texture: false });
        if (!entry.modeA && !entry.rig) {
            this._modeBCount--;
            entry.shim.destroyGradients();
            if (entry.healthBarShim) {
                entry.healthBarShim.destroyGradients();
                entity._healthBarCtx = null;
            }
        }
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
        entry.entryContainer.zIndex = _zIndexFor(entity);
        // Every enemy is drawn facing right by default (see BaseEnemy.facingLeft) - mirror
        // the whole container horizontally so it visibly faces its direction of travel
        // instead of appearing to walk backwards when moving right-to-left.
        entry.entryContainer.scale.x = entity.facingLeft ? -1 : 1;
        // Counter-flip the health bar on its own scale so it composes back to +1 with the
        // container flip above - only the body/model should mirror, the health bar (and
        // its fill direction) must stay upright regardless of facing direction.
        if (entry.healthBar) entry.healthBar.scale.x = entity.facingLeft ? -1 : 1;
        if (entry.particleLayer) entry.particleLayer.scale.x = entity.facingLeft ? -1 : 1;

        if (entry.rig) {
            this._syncRig(entity, sizeHint, entry);
        } else if (entry.modeA) {
            this._syncModeA(entity, sizeHint, entry);
        } else {
            this._syncModeB(entity, sizeHint, entry);
        }
    }

    // ── Mode C ──────────────────────────────────────────────────────────────

    _syncRig(entity, sizeHint, entry) {
        // The entity computes this frame's pose (plain numbers)...
        const nodes = entity.updateRigPose(sizeHint);
        const inv = entry.invBakeScale;
        const textures = entry.atlas.textures;

        // ...and it's copied onto the sprites. Sprite scale folds in 1/bakeScale because the
        // atlas is baked supersampled (see the spec's bakeScale) while node values are in
        // logical px.
        const items = entry.items;
        for (let i = 0; i < items.length; i++) {
            const it = items[i], n = nodes[it.id], o = it.obj;
            o.visible = n.visible;
            if (!n.visible) continue;
            o.position.set(n.x, n.y);
            o.rotation = n.rotation;
            o.alpha = n.alpha;
            if (it.isGroup) {
                o.pivot.set(n.pivotX, n.pivotY);
            } else {
                o.scale.set(n.scaleX * inv, n.scaleY * inv);
                if (n.tex !== it.tex) {
                    it.tex = n.tex;
                    o.texture = textures[n.tex || it.baseTex];
                }
            }
        }

        const pn = nodes.particles, ps = entry.particles;
        for (let i = 0; i < ps.length; i++) {
            const n = pn[i], o = ps[i];
            o.visible = n.visible;
            if (!n.visible) continue;
            o.position.set(n.x, n.y);
            o.scale.set(n.scaleX * inv, n.scaleY * inv);
            o.alpha = n.alpha;
            o.tint = n.tint;
        }

        // Health bar: redraw only when health changes by >= 1/HB_BUCKETS (same as Mode A).
        const hb = Math.round(entity.health / entity.maxHealth * HB_BUCKETS);
        if (hb !== entry.lastHealthBucket) {
            entry.lastHealthBucket = hb;
            _drawHealthBar(entry.healthBar, entity.health / entity.maxHealth, sizeHint, entry.healthLayout);
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
            _drawHealthBar(entry.healthBar, entity.health / entity.maxHealth, sizeHint, entry.healthLayout);
        }
        // Optional: hold the bar back until the enemy has actually been hurt (a Heavy Frog's five
        // escorts would otherwise paper their bars over the frog they surround).
        if (entity.hideFullHealthBar) entry.healthBar.visible = hb < HB_BUCKETS;
    }

    // ── Mode B ──────────────────────────────────────────────────────────────

    _syncModeB(entity, sizeHint, entry) {
        // Rate-limit redraws to _animFps(entity) (defaults to ANIM_FPS), scaled down when many
        // live-Graphics entities are on screen (see MODE_B_REDRAW_BUDGET).  Container position
        // already updated above, so the entity tracks smoothly even when the Graphics content
        // is cached.
        let fps = _animFps(entity);
        if (this._modeBCount * fps > MODE_B_REDRAW_BUDGET) {
            fps = Math.min(fps, Math.max(MODE_B_MIN_FPS, MODE_B_REDRAW_BUDGET / this._modeBCount));
        }
        const animKey = Math.floor((entity.animationTime + entry.animPhaseOffset) * fps);
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
            if (entry.healthBarShim) entry.healthBarShim.reset();
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
