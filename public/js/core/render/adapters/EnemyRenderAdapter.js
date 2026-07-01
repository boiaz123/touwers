import { Container, Sprite, Graphics } from 'pixi.js';
import { CanvasGraphicsShim } from '../CanvasGraphicsShim.js';

// Generous margin around an enemy's footprint for baked back/front textures.
const BAKE_CANVAS_SCALE = 4;

/**
 * Phase 4 of the Canvas2D -> Pixi migration: enemy (and loot bag) rendering. Same
 * convention and structure as TowerRenderAdapter.js / BuildingRenderAdapter.js (see
 * those files for the full design rationale) - renderStaticBack/renderDynamicParts/
 * renderStaticFront, baked back/front shared per (type, variant), per-instance dynamic
 * Graphics via CanvasGraphicsShim.
 *
 * Differences from towers/buildings:
 *  - Entities move every frame (towers/buildings are placed once and stay put), so
 *    _positionStaticLayers() runs every sync() call rather than being a near-no-op.
 *  - No campaign/level dependency found in any enemy or loot render code (unlike
 *    towers/buildings, which sometimes call ctx.level.renderVegetation()), so the cache
 *    key is just (entityType, variantKey) - variantKey defaults to '' for entities with
 *    no per-instance visual variation (e.g. a randomized skin/tunic color), set via an
 *    optional entity.getRenderVariantKey() method.
 *  - One shared adapter instance is used across every enemy/loot subclass, exactly like
 *    TowerRenderAdapter is shared across every tower subclass - they all follow the same
 *    convention, so there's no need for a separate adapter per concrete class.
 */
export class EnemyRenderAdapter {
    /**
     * @param {Container} sharedEntityLayer - a single Container (sortableChildren=true)
     * shared with TowerRenderAdapter/BuildingRenderAdapter - see TowerRenderAdapter.js's
     * constructor doc comment for the full Y-sort cutover rationale.
     */
    constructor(sharedEntityLayer, textureCache) {
        this.container = sharedEntityLayer;

        this.textureCache = textureCache;
        /** @type {Map<object, {container: Container, back: Sprite, front: Sprite, dynamic: Graphics, shim: CanvasGraphicsShim}>} */
        this._entries = new Map();
    }

    has(entity) {
        return this._entries.has(entity);
    }

    /**
     * @param {object} entity - a BaseEnemy/LootBag instance following the render convention
     * @param {number} sizeHint - externally-computed size value passed to the convention methods
     */
    register(entity, sizeHint) {
        const variantKey = typeof entity.getRenderVariantKey === 'function' ? entity.getRenderVariantKey() : '';
        const typeKey = entity.constructor.name + ':' + variantKey;

        const backTexture = this._getOrBakeLayer(typeKey + ':back', entity, sizeHint, 'renderStaticBack');
        const frontTexture = this._getOrBakeLayer(typeKey + ':front', entity, sizeHint, 'renderStaticFront');

        // entryContainer stays at (0,0) - back/front are positioned individually at
        // (entity.x, entity.y) each sync(), same reasoning as Tower/BuildingRenderAdapter.
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

        // Most enemy/loot types have intentionally-empty renderStaticBack/Front (all-dynamic).
        // Their baked textures are blank transparent canvases - detect this once at register
        // time so sync() can skip the 2× position.set() calls per frame per entity that
        // would otherwise dirty the Pixi transform tree for invisible-anyway sprites.
        // At 200 enemies that's 400 spurious dirty-writes per frame eliminated.
        const hasStaticLayers = !this._isBlankTexture(backTexture) || !this._isBlankTexture(frontTexture);
        if (!hasStaticLayers) {
            back.visible = false;
            front.visible = false;
        }

        this._entries.set(entity, { container: entryContainer, back, front, dynamic, shim, hasStaticLayers });
        entity.skipCanvas2DBodyRender = true;

        if (hasStaticLayers) this._positionStaticLayers(entity);
    }

    _isBlankTexture(texture) {
        try {
            const canvas = texture.source && texture.source.resource;
            if (!canvas || typeof canvas.getContext !== 'function') return false;
            const ctx = canvas.getContext('2d');
            if (!ctx) return false;
            const d = ctx.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data;
            return d[3] === 0; // alpha=0 → fully transparent → no-op bake method
        } catch (e) { return false; }
    }

    _positionStaticLayers(entity) {
        const entry = this._entries.get(entity);
        entry.back.position.set(entity.x, entity.y);
        entry.front.position.set(entity.x, entity.y);
    }

    unregister(entity) {
        const entry = this._entries.get(entity);
        if (!entry) return;
        this.container.removeChild(entry.container);
        entry.container.destroy({ children: true }); // textures are shared/cached - never destroyed here
        entry.shim.destroyGradients(); // any gradient the entity was still caching (e.g. FrogEnemy's this._bodyGradient) needs explicit GPU cleanup too
        this._entries.delete(entity);
        entity.skipCanvas2DBodyRender = false;
    }

    /** Call once per frame for every entity already registered with this adapter. */
    sync(entity, sizeHint) {
        const entry = this._entries.get(entity);
        if (!entry) return;

        if (entry.hasStaticLayers) this._positionStaticLayers(entity);
        entry.container.zIndex = entity.y;

        entry.shim.reset();
        entity.renderDynamicParts(entry.shim, sizeHint);
    }

    _getOrBakeLayer(cacheKey, entity, sizeHint, methodName) {
        if (this.textureCache.has(cacheKey)) {
            return this.textureCache.get(cacheKey);
        }

        const bakeSize = Math.ceil(Math.max(sizeHint, 1) * BAKE_CANVAS_SCALE);
        const origin = bakeSize / 2;

        return this.textureCache.bake(cacheKey, bakeSize, bakeSize, (bakeCtx) => {
            const realX = entity.x, realY = entity.y;
            entity.x = origin;
            entity.y = origin;
            try {
                entity[methodName](bakeCtx, sizeHint);
            } finally {
                entity.x = realX;
                entity.y = realY;
            }
        });
    }
}
