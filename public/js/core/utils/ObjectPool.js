/**
 * Generic free-list object pool. Towers currently allocate a brand-new plain object
 * literal on every projectile shot (push onto e.g. this.arrows) and rely on their
 * existing in-place compaction loop to drop expired entries by overwriting array slots -
 * the array itself is reused, but each projectile's *object* is freshly allocated and
 * left for GC every time. This pool lets that same call-site pattern (acquire on spawn,
 * release on removal) reuse the actual objects instead, cutting per-shot GC churn -
 * Phase 5 of the Canvas2D -> Pixi migration.
 */
export class ObjectPool {
    /** @param {() => object} factory - creates one blank pooled object; called only on a pool miss. */
    constructor(factory) {
        this._factory = factory;
        this._free = [];
    }

    acquire() {
        return this._free.length > 0 ? this._free.pop() : this._factory();
    }

    release(obj) {
        this._free.push(obj);
    }
}
