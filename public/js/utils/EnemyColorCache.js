import { darkenColor, lightenColor } from './colorUtils.js';

/**
 * Per-class cached color-variant lookup. Replaces the near-identical
 * static colorCache / getCachedColor / lightenColorStatic / darkenColorStatic
 * blocks that used to be copy-pasted into every frog enemy class - each
 * variant (e.g. 'darken_leg', 'lighten_body') is computed once per base
 * color and cached, since baseColor is fixed per-instance (skin/robe color)
 * and re-deriving lighten/darken RGB math every frame would be wasted work.
 */
export class EnemyColorCache {
    /** @param {Record<string, {op: 'lighten'|'darken', amount: number}>} variants */
    constructor(variants) {
        this._variants = variants;
        this._cache = new Map();
    }

    get(baseColor, variantName) {
        const key = baseColor + ':' + variantName;
        let color = this._cache.get(key);
        if (color === undefined) {
            const v = this._variants[variantName];
            color = v.op === 'lighten' ? lightenColor(baseColor, v.amount) : darkenColor(baseColor, v.amount);
            this._cache.set(key, color);
        }
        return color;
    }
}

/** Shared variant table used identically across FrogEnemy and all elemental frogs. */
export const FROG_COLOR_VARIANTS = {
    lighten:        { op: 'lighten', amount: 0.2 },
    lighten_body:   { op: 'lighten', amount: 0.4 },
    darken:         { op: 'darken',  amount: 0.25 },
    darken_body:    { op: 'darken',  amount: 0.35 },
    darken_leg:     { op: 'darken',  amount: 0.05 },
    darken_detail:  { op: 'darken',  amount: 0.3 },
    darken_mouth:   { op: 'darken',  amount: 0.4 },
    darken_eye:     { op: 'darken',  amount: 0.15 },
    lighten_foot:   { op: 'lighten', amount: 0.15 },
};

/** Variant table used by FrogKingEnemy (its own historical amounts). */
export const FROG_KING_COLOR_VARIANTS = {
    lighten:      { op: 'lighten', amount: 0.15 },
    darken:       { op: 'darken',  amount: 0.2 },
    darken_body:  { op: 'darken',  amount: 0.4 },
};
