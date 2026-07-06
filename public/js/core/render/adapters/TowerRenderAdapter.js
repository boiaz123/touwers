import { Container, Sprite, Graphics } from 'pixi.js';
import { CanvasGraphicsShim } from '../CanvasGraphicsShim.js';

// Generous margin around a tower's gridSize for baked back/front textures - environment
// decorations (trees, bushes, rocks) extend well beyond the tower's own footprint.
const BAKE_CANVAS_SCALE = 4;

/**
 * Phase 3 of the Canvas2D -> Pixi migration: tower rendering.
 *
 * Convention every migrated Tower subclass follows (established with BasicTower):
 *   - renderStaticBack(ctx, gridSize)   - Strategy A, baked once per (type, campaign)
 *   - renderDynamicParts(ctx, gridSize) - Strategy B, redrawn every frame via CanvasGraphicsShim
 *   - renderStaticFront(ctx, gridSize)  - Strategy A, baked once per (type, campaign),
 *                                         drawn in front of the live dynamic parts
 *
 * Per-instance Pixi structure: a Container holding [backSprite (shared texture),
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
        /** @type {Map<object, {container: Container, back: Sprite, front: Sprite, dynamic: Graphics, shim: CanvasGraphicsShim}>} */
        this._entries = new Map();
    }

    has(tower) {
        return this._entries.has(tower);
    }

    /**
     * @param {object} tower - a Tower instance whose constructor follows the render convention above
     * @param {string} campaign - current level's campaign (e.g. 'forest'), part of the bake cache key
     * @param {object} level - current LevelBase instance, exposed to the bake pass as ctx.level
     * @param {number} gridSize - this tower's current cell-size-derived footprint
     */
    register(tower, campaign, level, gridSize) {
        const typeKey = tower.constructor.name + ':' + campaign;

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

        const back = new Sprite(backTexture);
        back.anchor.set(0.5, 0.5);
        back.zIndex = 0;

        const dynamic = new Graphics();
        dynamic.zIndex = 1;

        const front = new Sprite(frontTexture);
        front.anchor.set(0.5, 0.5);
        front.zIndex = 2;

        entryContainer.addChild(back, dynamic, front);
        this.container.addChild(entryContainer);

        const shim = new CanvasGraphicsShim(dynamic);

        this._entries.set(tower, {
            container: entryContainer, back, front, dynamic, shim,
            lastAnimKey: -1,
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
        const animKey = (performance.now() / 33) | 0; // ~30fps bucket
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
