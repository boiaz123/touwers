import { Texture } from 'pixi.js';

/**
 * Caches Strategy-A baked textures keyed by an arbitrary string (e.g.
 * `${towerType}:${upgradeLevel}` or `${enemyType}:${colorVariant}`). The
 * realistic number of distinct variants across the whole game is small
 * (dozens, not thousands - tower types x upgrade levels, enemy types x
 * color variants), so entries are kept for the process lifetime; no
 * eviction policy is needed.
 *
 * Baking itself is intentionally left to the caller: pass a `draw(ctx)`
 * function that uses the entity's *existing, untouched* render(ctx) drawing
 * code against an offscreen canvas. This is exactly the pattern LevelBase.js
 * already uses for its background/terrain layer caches today, just wrapped
 * in a PIXI.Texture instead of blitted via drawImage.
 */
export class PixiTextureCache {
    constructor() {
        this._cache = new Map();
    }

    has(key) {
        return this._cache.has(key);
    }

    get(key) {
        return this._cache.get(key);
    }

    /**
     * @param {string} key - cache key, e.g. `${entityType}:${variant}`
     * @param {number} width - offscreen canvas width in px
     * @param {number} height - offscreen canvas height in px
     * @param {(ctx: CanvasRenderingContext2D) => void} draw - existing Canvas2D draw code
     */
    bake(key, width, height, draw) {
        if (this._cache.has(key)) {
            return this._cache.get(key);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        draw(ctx);

        const texture = Texture.from(canvas);
        texture.source.scaleMode = 'linear';

        this._cache.set(key, texture);
        return texture;
    }

    clear() {
        for (const texture of this._cache.values()) {
            texture.destroy(true);
        }
        this._cache.clear();
    }
}
