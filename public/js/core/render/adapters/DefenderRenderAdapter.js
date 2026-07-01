import { Container, Sprite, Graphics } from 'pixi.js';
import { CanvasGraphicsShim } from '../CanvasGraphicsShim.js';

const BAKE_CANVAS_SCALE = 4;
// Canvas2D always draws defenders (castle + guard-post) AFTER every Y-sorted entity,
// regardless of position - never interleaved into the Y-sort itself. Sitting just below
// SpellEffectRenderAdapter's 1000000 preserves that same "always on top of entities, but
// under spell effects" order, rather than putting defenders in the shared sortable entity
// layer (which would incorrectly Y-sort them against enemies/towers).
const DEFENDERS_Z_INDEX = 999999;

/**
 * Phase 7 of the Canvas2D -> Pixi migration: defender rendering (CastleDefender,
 * GuardPost's tower.defender). Same convention and structure as EnemyRenderAdapter.js
 * (see that file for the full design rationale) - renderStaticBack/renderDynamicParts/
 * renderStaticFront, per-instance dynamic Graphics via CanvasGraphicsShim. Defenders are
 * sparse (at most ~1 + one per guard-post tower), so a dedicated small adapter is simpler
 * than threading a "don't Y-sort this one" flag through the shared entity adapter.
 */
export class DefenderRenderAdapter {
    constructor(parentContainer, textureCache) {
        this.container = new Container();
        this.container.zIndex = DEFENDERS_Z_INDEX;
        this.container.sortableChildren = true; // in case multiple defenders ever overlap on screen
        parentContainer.addChild(this.container);

        this.textureCache = textureCache;
        this._entries = new Map();
    }

    has(defender) {
        return this._entries.has(defender);
    }

    register(defender, sizeHint) {
        const variantKey = typeof defender.getRenderVariantKey === 'function' ? defender.getRenderVariantKey() : '';
        const typeKey = defender.constructor.name + ':' + variantKey;

        const backTexture = this._getOrBakeLayer(typeKey + ':back', defender, sizeHint, 'renderStaticBack');
        const frontTexture = this._getOrBakeLayer(typeKey + ':front', defender, sizeHint, 'renderStaticFront');

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

        this._entries.set(defender, { container: entryContainer, back, front, dynamic, shim });
        defender.skipCanvas2DBodyRender = true;

        this._positionStaticLayers(defender);
    }

    _positionStaticLayers(defender) {
        const entry = this._entries.get(defender);
        entry.back.position.set(defender.x, defender.y);
        entry.front.position.set(defender.x, defender.y);
    }

    unregister(defender) {
        const entry = this._entries.get(defender);
        if (!entry) return;
        this.container.removeChild(entry.container);
        entry.container.destroy({ children: true });
        entry.shim.destroyGradients(); // any gradient the entity was still caching needs explicit GPU cleanup too
        this._entries.delete(defender);
        defender.skipCanvas2DBodyRender = false;
    }

    /** Call once per frame for every defender already registered with this adapter. */
    sync(defender, sizeHint) {
        const entry = this._entries.get(defender);
        if (!entry) return;

        this._positionStaticLayers(defender);
        entry.container.zIndex = defender.y;

        entry.shim.reset();
        defender.renderDynamicParts(entry.shim, sizeHint);
    }

    _getOrBakeLayer(cacheKey, defender, sizeHint, methodName) {
        if (this.textureCache.has(cacheKey)) {
            return this.textureCache.get(cacheKey);
        }

        const bakeSize = Math.ceil(Math.max(sizeHint, 1) * BAKE_CANVAS_SCALE);
        const origin = bakeSize / 2;

        return this.textureCache.bake(cacheKey, bakeSize, bakeSize, (bakeCtx) => {
            const realX = defender.x, realY = defender.y;
            defender.x = origin;
            defender.y = origin;
            try {
                defender[methodName](bakeCtx, sizeHint);
            } finally {
                defender.x = realX;
                defender.y = realY;
            }
        });
    }

    destroy() {
        this.container.destroy({ children: true });
    }
}
