/**
 * Sprite Rendering Adapter
 * Helper for entities to use sprite caching
 * 
 * Usage in entity render():
 * ```javascript
 * render(ctx) {
 *     // Try to render as sprite (cached)
 *     if (SpriteRenderingAdapter.renderAsSprite(ctx, this)) {
 *         return; // Sprite rendered, done
 *     }
 *     
 *     // Fallback: render normally (first frame or sprite not cached)
 *     // ... normal rendering code ...
 * }
 * ```
 */

export class SpriteRenderingAdapter {
    static spriteRenderer = null; // Will be set by game/context
    
    /**
     * Set the sprite renderer (called by game.js)
     */
    static setSpriteRenderer(renderer) {
        SpriteRenderingAdapter.spriteRenderer = renderer;
    }
    
    /**
     * Try to render entity as sprite
     * Returns true if sprite was rendered, false if sprite not available
     */
    static renderAsSprite(ctx, entity, options = {}) {
        if (!SpriteRenderingAdapter.spriteRenderer) {
            return false; // No sprite renderer available
        }
        
        const renderer = SpriteRenderingAdapter.spriteRenderer;
        
        // Generate sprite key from entity
        const spriteKey = this._generateSpriteKey(entity);
        
        // Try to render sprite
        if (renderer.renderSprite) {
            return renderer.renderSprite(ctx, spriteKey, entity.x, entity.y, options);
        }
        
        return false;
    }
    
    /**
     * Cache entity as sprite
     * Call this when you want to pre-cache an entity
     */
    static cacheEntity(entity, options = {}) {
        if (!SpriteRenderingAdapter.spriteRenderer) {
            return null;
        }
        
        const renderer = SpriteRenderingAdapter.spriteRenderer;
        const entityType = entity.constructor.name;
        const state = options.state || 'default';
        const width = options.width || 128;
        const height = options.height || 128;
        
        if (renderer.cacheEntityAsSprite) {
            return renderer.cacheEntityAsSprite(entity, entityType, state, width, height);
        }
        
        return null;
    }
    
    /**
     * Generate a unique sprite key for entity
     */
    static _generateSpriteKey(entity) {
        const entityType = entity.constructor.name;
        const state = entity.state || 'default';
        const health = entity.health ? Math.ceil(entity.health / 25) * 25 : 'full'; // Quantize health for cache
        const element = entity.selectedElement || 'default';
        
        return `${entityType}|${state}|${health}|${element}`;
    }
    
    /**
     * Check if entity has been cached
     */
    static isCached(entity) {
        if (!SpriteRenderingAdapter.spriteRenderer) {
            return false;
        }
        
        const spriteKey = this._generateSpriteKey(entity);
        const spriteCache = SpriteRenderingAdapter.spriteRenderer.getSpriteCache?.();
        
        if (!spriteCache) {
            return false;
        }
        
        return spriteCache.atlas.getSprite(spriteKey) !== null;
    }
}
