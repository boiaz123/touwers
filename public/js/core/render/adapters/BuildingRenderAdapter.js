import { Container, Sprite, Graphics } from 'pixi.js';
import { CanvasGraphicsShim } from '../CanvasGraphicsShim.js';

// Generous margin around a building's footprint for baked back/front textures.
const BAKE_CANVAS_SCALE = 3;

/**
 * Phase 3 of the Canvas2D -> Pixi migration: building rendering. Same convention and
 * structure as TowerRenderAdapter.js (see that file for the full design rationale) -
 * renderStaticBack/renderDynamicParts/renderStaticFront, baked back/front shared per
 * (type, campaign), per-instance dynamic Graphics via CanvasGraphicsShim.
 *
 * Buildings' render(ctx, buildingSize) signature takes an externally-computed
 * buildingSize (cellSize * building.size) rather than deriving it internally like
 * towers do - the convention methods here take the same (ctx, buildingSize) shape.
 */
export class BuildingRenderAdapter {
    /**
     * @param {Container} sharedEntityLayer - a single Container (sortableChildren=true)
     * shared with TowerRenderAdapter/EnemyRenderAdapter - see TowerRenderAdapter.js's
     * constructor doc comment for the full Y-sort cutover rationale.
     */
    constructor(sharedEntityLayer, textureCache) {
        this.container = sharedEntityLayer;

        this.textureCache = textureCache;
        /** @type {Map<object, {container: Container, back: Sprite, front: Sprite, dynamic: Graphics, shim: CanvasGraphicsShim}>} */
        this._entries = new Map();
    }

    has(building) {
        return this._entries.has(building);
    }

    /**
     * @param {object} building - a Building instance following the render convention
     * @param {string} campaign - current level's campaign, part of the bake cache key
     * @param {object} level - current LevelBase instance, exposed to the bake pass as ctx.level
     * @param {number} buildingSize - externally-computed (cellSize * building.size)
     */
    register(building, campaign, level, buildingSize) {
        const typeKey = building.constructor.name + ':' + campaign;

        const backTexture = this._getOrBakeLayer(typeKey + ':back', building, level, buildingSize, 'renderStaticBack');
        const frontTexture = this._getOrBakeLayer(typeKey + ':front', building, level, buildingSize, 'renderStaticFront');

        // See TowerRenderAdapter.js's identical comment - entryContainer stays at (0,0),
        // back/front are positioned individually at (building.x, building.y) each sync().
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

        this._entries.set(building, { container: entryContainer, back, front, dynamic, shim });
        building.skipCanvas2DBodyRender = true;

        this._positionStaticLayers(building);
    }

    _positionStaticLayers(building) {
        const entry = this._entries.get(building);
        entry.back.position.set(building.x, building.y);
        entry.front.position.set(building.x, building.y);
        // Castle has a per-instance, fixed-at-creation gateAngle that must NOT be baked
        // into the shared texture (see Castle.renderStaticBack's doc comment) - applied
        // here as a live sprite rotation instead. Undefined/0 for every other building.
        if (building.gateAngle) {
            entry.back.rotation = building.gateAngle;
            entry.front.rotation = building.gateAngle;
        }
    }

    unregister(building) {
        const entry = this._entries.get(building);
        if (!entry) return;
        this.container.removeChild(entry.container);
        entry.container.destroy({ children: true }); // textures are shared/cached - never destroyed here
        entry.shim.destroyGradients(); // any gradient the entity was still caching needs explicit GPU cleanup too
        this._entries.delete(building);
        building.skipCanvas2DBodyRender = false;
    }

    /** Call once per frame for every building already registered with this adapter. */
    sync(building, buildingSize, level) {
        const entry = this._entries.get(building);
        if (!entry) return;

        this._positionStaticLayers(building);
        entry.container.zIndex = building.y;

        entry.shim.reset();
        entry.shim.level = level;
        entry.shim.resolutionManager = level && level.resolutionManager;
        building.renderDynamicParts(entry.shim, buildingSize);
    }

    _getOrBakeLayer(cacheKey, building, level, buildingSize, methodName) {
        if (this.textureCache.has(cacheKey)) {
            return this.textureCache.get(cacheKey);
        }

        const bakeSize = Math.ceil(buildingSize * BAKE_CANVAS_SCALE);
        const origin = bakeSize / 2;

        return this.textureCache.bake(cacheKey, bakeSize, bakeSize, (bakeCtx) => {
            bakeCtx.level = level;
            // Some building types (e.g. DiamondPress) ignore the externally-computed
            // buildingSize and recompute their own internally via getCellSize(ctx), which
            // falls back to a (wrong) bake-canvas-relative scale factor without this -
            // give the bake context the real resolutionManager so that calculation matches
            // what the live, non-baked render() would produce.
            bakeCtx.resolutionManager = level && level.resolutionManager;

            const realX = building.x, realY = building.y;
            building.x = origin;
            building.y = origin;
            try {
                building[methodName](bakeCtx, buildingSize);
            } finally {
                building.x = realX;
                building.y = realY;
            }
        });
    }
}
