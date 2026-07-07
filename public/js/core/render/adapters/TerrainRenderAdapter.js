import { Sprite } from 'pixi.js';

// Generous margin around an element's nominal size - shadows/canopy extend well beyond
// the footprint implied by `element.size` alone (e.g. a tree's canopy reaches ~size*0.6
// above its anchor point).
const BAKE_CANVAS_SCALE = 3;

/**
 * Terrain elements (trees/rocks/cacti/bushes/vegetation) are pure decoration: placed once
 * when a level loads (`level.terrainElements`, populated by level setup, never mutated
 * during play - confirmed no push/splice anywhere outside setup) and never animated
 * (LevelBase.renderTree/renderRock/etc. are deterministic functions of position+size+seed
 * only, no time-based parameters). Strategy A applies to the *entire* element, not just a
 * back/front split - there's nothing dynamic to redraw per frame, so this adapter bakes
 * once per (type, variant, campaign) and never touches the resulting sprite again after
 * initial placement (no per-frame sync, unlike every other adapter in this migration).
 *
 * This closes a real cross-renderer Y-sort gap: before this adapter existed, terrain
 * elements stayed on the Canvas2D canvas while towers/buildings/enemies moved to Pixi.
 * Since the Pixi canvas sits at a fixed negative z-index *behind* the Canvas2D canvas
 * (see PixiApp.js), any Canvas2D content unconditionally painted in front of all Pixi
 * content regardless of actual Y position - a tree always drew over a tower it should
 * have been behind, and vice versa. Moving terrain into the same shared sortable entity
 * layer (zIndex = the same el.gridY*cellSize key the old manual JS sort used) restores
 * correct cross-type depth ordering.
 */
export class TerrainRenderAdapter {
    constructor(sharedEntityLayer, textureCache) {
        this.container = sharedEntityLayer;
        this.textureCache = textureCache;
        /** @type {Map<object, Sprite>} */
        this._entries = new Map();
    }

    has(element) {
        return this._entries.has(element);
    }

    /** Register once per element, the first time it's encountered (level load). Never moves or changes afterward, so no sync() exists - only register()/unregister(). */
    register(element, level) {
        const cellSize = level.cellSize;
        const baseSize = element.size * cellSize;
        const bakeSize = Math.ceil(Math.max(baseSize, 1) * BAKE_CANVAS_SCALE);
        const origin = bakeSize / 2;

        const campaign = level.getCampaign();
        // Most terrain elements never get an explicit `variant` - LevelBase's various
        // render*Vegetation/renderTree/renderRock methods fall back to a position-derived
        // seed instead (e.g. `Math.floor(gridX + gridY) % 6`, slightly different per
        // type/campaign). The bake call below temporarily zeroes element.gridX/gridY to
        // land the draw at the bake canvas's center (see _getOrBakeLayer), which would
        // otherwise make every variant-less element of a given (type, campaign) compute
        // the SAME fallback seed and collapse onto one shared cache entry - losing the
        // shape variety Canvas2D produces. Folding the *real* position into the cache key
        // (matching the most common seed formula's bucket count) restores that variety
        // without needing to replicate every type's exact formula here.
        const positionSeed = (element.variant !== undefined && element.variant !== null)
            ? element.variant
            : Math.floor(element.gridX + element.gridY) % 6;
        const cacheKey = 'terrain:' + element.type + ':' + positionSeed + ':' + campaign;

        const texture = this._getOrBakeLayer(cacheKey, element, level, bakeSize, origin);

        const sprite = new Sprite(texture);
        sprite.anchor.set(0.5, 0.5);
        sprite.position.set(element.gridX * cellSize, element.gridY * cellSize);
        // Sort key uses the element's actual painted ground-contact Y (see
        // LevelBase.getTerrainElementDepthY), not the raw gridY - trees are drawn shifted
        // up from their grid row so the canopy has headroom, so their zIndex needs the
        // same shift or they tie/lose against same-row rocks that have no such shift.
        sprite.zIndex = level.getTerrainElementDepthY(element);
        this.container.addChild(sprite);

        this._entries.set(element, sprite);
    }

    unregister(element) {
        const sprite = this._entries.get(element);
        if (!sprite) return;
        this.container.removeChild(sprite);
        sprite.destroy(); // texture is shared/cached - never destroyed here
        this._entries.delete(element);
    }

    _getOrBakeLayer(cacheKey, element, level, bakeSize, origin) {
        if (this.textureCache.has(cacheKey)) {
            return this.textureCache.get(cacheKey);
        }

        return this.textureCache.bake(cacheKey, bakeSize, bakeSize, (bakeCtx) => {
            // renderSingleTerrainElement computes screenX/screenY from element.gridX/gridY
            // internally (screenX = gridX * cellSize) - temporarily zero them out so that
            // internal computation lands exactly at the bake canvas's center, the same
            // "reposition to local origin" trick every other adapter uses.
            const realGridX = element.gridX, realGridY = element.gridY;
            element.gridX = origin / level.cellSize;
            element.gridY = origin / level.cellSize;
            try {
                level.renderSingleTerrainElement(bakeCtx, element);
            } finally {
                element.gridX = realGridX;
                element.gridY = realGridY;
            }
        });
    }
}
