import { Container, Sprite, Graphics } from 'pixi.js';
import { CanvasGraphicsShim } from '../CanvasGraphicsShim.js';

// Generous margin around a tower's gridSize for baked back/front textures - environment
// decorations (trees, bushes, rocks) extend well beyond the tower's own footprint.
const BAKE_CANVAS_SCALE = 4;

// Blends a '#RRGGBB' hex color toward white by `amount` (0-1) and returns a Pixi tint
// number. Used to recolor a transformed tower's whole body in place - Container.tint
// (inherited by every Pixi display object, Sprite's baked back/front AND Graphics'
// dynamic/ground alike) is a per-pixel multiply against whatever that layer draws, so
// applying a raw saturated color straight would crush shadow detail toward black;
// blending toward white first keeps the tower's structure/shading readable while still
// clearly recoloring it. Applied once per layer at registration (towers never move or
// get re-registered after placement), so this costs nothing on a per-frame basis.
function transformTint(hexColor, amount = 0.45) {
    const n = parseInt(hexColor.slice(1), 16);
    const r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
    const mix = (c) => Math.round(c + (255 - c) * amount);
    return (mix(r) << 16) | (mix(g) << 8) | mix(b);
}

/**
 * Phase 3 of the Canvas2D -> Pixi migration: tower rendering.
 *
 * Convention every migrated Tower subclass follows (established with BasicTower):
 *   - renderStaticBack(ctx, gridSize)   - Strategy A, baked once per (type, campaign)
 *   - renderDynamicParts(ctx, gridSize) - Strategy B, redrawn every frame via CanvasGraphicsShim
 *   - renderStaticFront(ctx, gridSize)  - Strategy A, baked once per (type, campaign),
 *                                         drawn in front of the live dynamic parts
 *
 * A transformed tower (SlingerTower, SharpshooterTower, ...) is free to override any of
 * the three - see _bakeClassName()'s doc for how that changes what gets baked/shared.
 * Every transformed instance also gets its whole body (every layer, not just the baked
 * back/front sprites) recolored via Container.tint - see register()'s tint block.
 *
 * Per-instance Pixi structure: a Container holding [ground, backSprite (shared texture),
 * dynamicGraphics (per-instance, redrawn live), frontSprite (shared texture)], so the
 * baked back/front layers are reused across every tower of the same type+campaign while
 * only the genuinely dynamic part is drawn per-instance.
 */
export class TowerRenderAdapter {
    /**
     * @param {Container} sharedEntityLayer - a single Container (sortableChildren=true)
     * shared with BuildingRenderAdapter/EnemyRenderAdapter, so every entity's per-instance
     * zIndex=y sorts correctly against every OTHER entity type's, not just same-type
     * siblings. Each adapter previously owned its own private container stacked on stage
     * in lazy-construction order, which silently broke cross-type Y-sorting (e.g. an
     * enemy always drew in front of/behind every tower regardless of position) - see the
     * Phase 4 Y-sort cutover note in GameplayState.js.
     */
    constructor(sharedEntityLayer, textureCache) {
        this.container = sharedEntityLayer;

        this.textureCache = textureCache;
        /** @type {Map<object, {container: Container, back: Sprite, front: Sprite, dynamic: Graphics, ground: Graphics, shim: CanvasGraphicsShim, groundShim: CanvasGraphicsShim}>} */
        this._entries = new Map();
    }

    has(tower) {
        return this._entries.has(tower);
    }

    /**
     * Which class name to bake/cache a transformed tower's static layers under. A
     * transform (SlingerTower, SpikeThrowerTower, ...) that doesn't override
     * renderStaticBack/renderStaticFront - i.e. its body art is byte-identical to its
     * base type's, just tinted (see register()'s tint block) - bakes under the BASE
     * class's name instead of its own, so it reuses whatever's already cached for that
     * tower type instead of paying for (and permanently caching, since PixiTextureCache
     * never evicts) a second full-resolution texture that would render identically.
     * A transform that DOES override either method (e.g. SpikeThrowerTower's rooftop,
     * SharpshooterTower's reinforced platform, TripleTrebuchetTower's larger frame) has
     * genuinely different pixels and must bake under its own name instead.
     */
    _bakeClassName(tower) {
        if (!tower.transformedType) return tower.constructor.name;
        const proto = tower.constructor.prototype;
        const hasOwnVisual = Object.prototype.hasOwnProperty.call(proto, 'renderStaticBack')
            || Object.prototype.hasOwnProperty.call(proto, 'renderStaticFront');
        return hasOwnVisual ? tower.constructor.name : Object.getPrototypeOf(tower.constructor).name;
    }

    /**
     * @param {object} tower - a Tower instance whose constructor follows the render convention above
     * @param {string} campaign - current level's campaign (e.g. 'forest'), part of the bake cache key
     * @param {object} level - current LevelBase instance, exposed to the bake pass as ctx.level
     * @param {number} gridSize - this tower's current cell-size-derived footprint
     */
    register(tower, campaign, level, gridSize) {
        const typeKey = this._bakeClassName(tower) + ':' + campaign;

        const backTexture = this._getOrBakeLayer(typeKey + ':back', tower, level, gridSize, 'renderStaticBack');
        const frontTexture = this._getOrBakeLayer(typeKey + ':front', tower, level, gridSize, 'renderStaticFront');

        // entryContainer itself stays at (0,0) - it exists only to group+z-order this
        // tower's three layers together, never to shift coordinates. back/front are baked
        // at a local origin and are positioned individually at (tower.x, tower.y) each
        // sync(). dynamic is driven by renderDynamicParts(), which is the *unmodified*
        // Canvas2D method and therefore already computes world coordinates internally
        // (via this.x/this.y) exactly like the original ctx-based render did - parenting
        // it under a world-offset container would double-apply the tower's position.
        const entryContainer = new Container();
        entryContainer.sortableChildren = true;

        // Ground-level effects (e.g. BarricadeTower's rubble patch) sit on the road itself,
        // beneath the tower's own baked structure - a separate layer behind `back` so the
        // platform/supports correctly occlude it instead of it painting over them. Optional
        // per-tower via renderGroundEffects() (see sync()); an empty Graphics costs nothing
        // for towers that don't implement it.
        const ground = new Graphics();
        ground.zIndex = -1;

        const back = new Sprite(backTexture);
        back.anchor.set(0.5, 0.5);
        back.zIndex = 0;

        const dynamic = new Graphics();
        dynamic.zIndex = 1;

        const front = new Sprite(frontTexture);
        front.anchor.set(0.5, 0.5);
        front.zIndex = 2;

        // Transformed towers get their WHOLE body recolored - every layer, not just the
        // baked back/front sprites - via Container.tint (see transformTint's doc above),
        // a property every Pixi display object inherits, Graphics included, not just
        // Sprite. The shared baked texture itself is untouched; this only affects this
        // tower's own layer instances, so ground/dynamic (rubble zones, defenders,
        // trebuchet arms, bushes, ...) read as transformed too, not just the static body.
        if (tower.transformedType && tower.constructor.TRANSFORM_COLOR) {
            const tint = transformTint(tower.constructor.TRANSFORM_COLOR);
            ground.tint = tint;
            back.tint = tint;
            dynamic.tint = tint;
            front.tint = tint;
        }

        entryContainer.addChild(ground, back, dynamic, front);
        this.container.addChild(entryContainer);

        const shim = new CanvasGraphicsShim(dynamic);
        const groundShim = new CanvasGraphicsShim(ground);

        this._entries.set(tower, {
            container: entryContainer, back, front, dynamic, ground, shim, groundShim,
            lastAnimKey: -1,
            // Per-instance offset into the 33ms bucket below (see sync()) - without this,
            // performance.now() is identical for every tower at a given instant, so every
            // tower's redraw bucket flips on the SAME frame: cheap frames where nothing
            // redraws, then one expensive frame every ~33ms where all N towers redraw at
            // once. Measured directly via the ?stresstest harness: at a fixed entity count,
            // renderSync/pixiSubmit varied 2-3x frame-to-frame from this clustering alone.
            // Spreading the offset breaks the synchronization so redraw work is instead
            // spread evenly across frames.
            animPhaseOffset: Math.random() * 33,
        });
        tower.skipCanvas2DBodyRender = true;

        // Towers never move after placement: do the one-time position + zIndex set here
        // so sync() never has to touch them again.
        this._positionStaticLayers(tower);
        entryContainer.zIndex = tower.y;
    }

    _positionStaticLayers(tower) {
        const entry = this._entries.get(tower);
        entry.back.position.set(tower.x, tower.y);
        entry.front.position.set(tower.x, tower.y);
    }

    unregister(tower) {
        const entry = this._entries.get(tower);
        if (!entry) return;
        this.container.removeChild(entry.container);
        entry.container.destroy({ children: true }); // textures are shared/cached - never destroyed here
        entry.shim.destroyGradients(); // any gradient the entity was still caching (e.g. CombinationTower's per-instance gradients) needs explicit GPU cleanup too
        entry.groundShim.destroyGradients();
        this._entries.delete(tower);
        tower.skipCanvas2DBodyRender = false;
    }

    /**
     * Call once per frame for every tower already registered with this adapter.
     * @param {object} level - same as register()'s level param. Some tower types' dynamic
     * parts reference ctx.level too (e.g. PoisonArcherTower's camouflage bushes call
     * ctx.level.renderVegetation() for campaign-appropriate cover) - without this, those
     * fall back to their generic (non-campaign-themed) rendering path every frame.
     */
    sync(tower, gridSize, level) {
        const entry = this._entries.get(tower);
        if (!entry) return;

        // Position and zIndex are set once at register() — towers never move after
        // placement so there is nothing to update on subsequent frames.

        // ── 30fps rate-limit ──────────────────────────────────────────────────────
        // Aim-angle drift, bow drawback, and muzzle flashes are imperceptible at 30fps
        // for typical tower attack speeds. This halves dynamic-layer Graphics calls.
        // (A 15fps variant was tried to cut CPU cost further at high tower counts, but it
        // was visibly choppy and wasn't where the real per-wave performance hit came from
        // anyway - see the combat-interaction cost investigated instead.)
        const animKey = ((performance.now() + entry.animPhaseOffset) / 33) | 0; // ~30fps bucket, phase-staggered per tower
        if (animKey === entry.lastAnimKey) return;
        entry.lastAnimKey = animKey;

        entry.shim.reset();
        entry.shim.level = level;
        entry.shim.resolutionManager = level && level.resolutionManager;
        tower.renderDynamicParts(entry.shim, gridSize);

        // Phase 5: projectiles (arrows/rocks/fireballs/etc.) draw on top of the dynamic
        // body parts into the SAME Graphics/shim, preserving the exact draw order the
        // Canvas2D render() already used. Optional - towers not yet migrated to the
        // renderProjectiles(ctx) convention simply don't have this method, and keep
        // drawing their projectiles unconditionally on the Canvas2D layer via their own
        // render() (see each tower's skipCanvas2DBodyRender-gated call site).
        if (typeof tower.renderProjectiles === 'function') {
            tower.renderProjectiles(entry.shim);
        }

        // Ground-level effects (see the `ground` layer's doc comment in register()) draw
        // into their own Graphics beneath `back`, not the dynamic one above - same
        // optional-hook convention as renderProjectiles.
        if (typeof tower.renderGroundEffects === 'function') {
            entry.groundShim.reset();
            entry.groundShim.level = level;
            entry.groundShim.resolutionManager = level && level.resolutionManager;
            tower.renderGroundEffects(entry.groundShim);
        }
    }

    _getOrBakeLayer(cacheKey, tower, level, gridSize, methodName) {
        if (this.textureCache.has(cacheKey)) {
            return this.textureCache.get(cacheKey);
        }

        const bakeSize = Math.ceil(gridSize * BAKE_CANVAS_SCALE);
        const origin = bakeSize / 2;

        return this.textureCache.bake(cacheKey, bakeSize, bakeSize, (bakeCtx) => {
            bakeCtx.level = level;
            // Defensive: any tower type whose render methods call getCellSize/getTowerSize(ctx)
            // internally (rather than only using the passed gridSize) needs a real
            // resolutionManager here, or that falls back to a wrong bake-canvas-relative scale.
            bakeCtx.resolutionManager = level && level.resolutionManager;

            // Temporarily reposition the real instance to the bake canvas's local origin so
            // the method's existing this.x/this.y-relative drawing lands correctly, then
            // restore it - this keeps renderStaticBack/Front completely unmodified.
            const realX = tower.x, realY = tower.y;
            tower.x = origin;
            tower.y = origin;
            try {
                tower[methodName](bakeCtx, gridSize);
            } finally {
                tower.x = realX;
                tower.y = realY;
            }
        });
    }
}
