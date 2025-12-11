/**
 * Sprite Cache System - Phase 2 Optimization
 * Manages sprite rendering for entities
 * Caches rendered entities as sprite textures to avoid per-frame re-rendering
 * 
 * How it works:
 * 1. Entity calls its render(ctx) method once → stored as sprite
 * 2. Subsequent frames just render the sprite texture
 * 3. If entity state changes → re-render to new sprite
 * 4. Animation via transforms (scale, rotation, alpha)
 */

import { SpriteAtlas } from './SpriteAtlas.js';

export class SpriteCache {
    constructor(atlasWidth = 2048, atlasHeight = 2048) {
        this.atlas = new SpriteAtlas(atlasWidth, atlasHeight);
        this.entityCache = new Map(); // entityId -> {spriteKey, lastState}
        this.typeConfigs = new Map(); // entityType -> {spriteSize, states}
        
        // Statistics
        this.stats = {
            cachedEntities: 0,
            spriteCacheHits: 0,
            spriteCacheMisses: 0,
            rerenderedSprites: 0
        };
    }
    
    /**
     * Register entity type configuration
     * @param {string} entityType - Type name (e.g., "basicEnemy", "magicTower")
     * @param {Object} config - {spriteSize, states: ['walking', 'attacking', ...]}
     */
    registerEntityType(entityType, config = {}) {
        this.typeConfigs.set(entityType, {
            spriteSize: config.spriteSize || 128,
            states: config.states || ['default'],
            ...config
        });
    }
    
    /**
     * Cache an entity as a sprite
     * @param {Object} entity - Entity with render(ctx) method
     * @param {string} entityType - Type for caching
     * @param {string} state - Current state (e.g., "walking", "attacking")
     * @param {number} spriteWidth - Sprite width
     * @param {number} spriteHeight - Sprite height
     * @returns {string} spriteKey
     */
    cacheEntitySprite(entity, entityType, state = 'default', spriteWidth, spriteHeight) {
        const config = this.typeConfigs.get(entityType) || {};
        spriteWidth = spriteWidth || config.spriteSize || 128;
        spriteHeight = spriteHeight || config.spriteSize || 128;
        
        const spriteKey = `${entityType}|${state}`;
        
        // Check if sprite already cached
        const cached = this.atlas.getSprite(spriteKey);
        if (cached) {
            this.stats.spriteCacheHits++;
            return spriteKey;
        }
        
        // Render entity to sprite
        const renderFunction = (ctx, width, height) => {
            // Create a temporary canvas at the right resolution
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext('2d', { alpha: true });
            
            // Save and clear
            tempCtx.clearRect(0, 0, width, height);
            
            // Translate to center for rendering
            tempCtx.save();
            tempCtx.translate(width / 2, height / 2);
            
            // Call entity's render method
            if (entity.render && typeof entity.render === 'function') {
                // Temporarily override canvas properties
                const origCanvas = tempCtx.canvas;
                
                // Create a proxy context that redirects to our temp context
                const proxyCtx = this._createProxyContext(tempCtx, width, height);
                
                try {
                    entity.render(proxyCtx);
                } catch (e) {
                    console.error(`Error rendering sprite for ${spriteKey}:`, e);
                }
            }
            
            tempCtx.restore();
            
            // Copy rendered result to actual context
            ctx.drawImage(tempCanvas, 0, 0);
        };
        
        // Add to atlas
        this.atlas.addSprite(spriteKey, renderFunction, spriteWidth, spriteHeight);
        this.stats.spriteCacheMisses++;
        
        return spriteKey;
    }
    
    /**
     * Create proxy context that matches entity's expectations
     * This allows entities to render normally while capturing to sprite
     */
    _createProxyContext(targetCtx, width, height) {
        return new Proxy(targetCtx, {
            get: (target, prop) => {
                // For canvas property, return a canvas-like object
                if (prop === 'canvas') {
                    return {
                        width: width,
                        height: height,
                        resolutionManager: { width, height }
                    };
                }
                return target[prop];
            }
        });
    }
    
    /**
     * Render cached entity sprite
     * @param {CanvasRenderingContext2D} ctx - Target context
     * @param {string} spriteKey - Sprite key from cacheEntitySprite
     * @param {number} x - Draw position X
     * @param {number} y - Draw position Y
     * @param {Object} options - {scale, rotation, alpha, tint}
     */
    renderSprite(ctx, spriteKey, x, y, options = {}) {
        return this.atlas.renderSprite(ctx, spriteKey, x, y, options);
    }
    
    /**
     * Get or cache entity sprite (one-shot)
     * @param {Object} entity - Entity to cache
     * @param {string} entityType - Entity type
     * @param {string} state - Entity state
     * @param {number} width - Sprite width
     * @param {number} height - Sprite height
     * @returns {string} spriteKey
     */
    getOrCacheSprite(entity, entityType, state = 'default', width, height) {
        return this.cacheEntitySprite(entity, entityType, state, width, height);
    }
    
    /**
     * Clear cache
     */
    clear() {
        this.atlas.clear();
        this.entityCache.clear();
        this.stats = {
            cachedEntities: 0,
            spriteCacheHits: 0,
            spriteCacheMisses: 0,
            rerenderedSprites: 0
        };
    }
    
    /**
     * Get statistics
     */
    getStats() {
        return {
            ...this.stats,
            atlasStats: this.atlas.getStats()
        };
    }
    
    /**
     * Get atlas canvas (for debugging/visualization)
     */
    getAtlasCanvas() {
        return this.atlas.getCanvas();
    }
}
