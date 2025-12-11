/**
 * SpriteManager - Utility class for managing Pixi sprites
 * Provides caching, pooling, and easy creation of sprites
 */

export class SpriteManager {
    constructor(pixiRenderer) {
        this.pixiRenderer = pixiRenderer;
        this.textureCache = new Map();
        this.spritePool = new Map();
        this.activeSprites = new Set();
    }
    
    /**
     * Get or create a texture from a URL
     */
    getTexture(imageUrl) {
        if (!this.textureCache.has(imageUrl)) {
            try {
                const texture = PIXI.Texture.from(imageUrl);
                this.textureCache.set(imageUrl, texture);
            } catch (error) {
                console.error(`SpriteManager: Failed to load texture ${imageUrl}:`, error);
                return null;
            }
        }
        return this.textureCache.get(imageUrl);
    }
    
    /**
     * Create a sprite from a URL
     */
    createSprite(imageUrl, x = 0, y = 0, width = null, height = null) {
        const texture = this.getTexture(imageUrl);
        if (!texture) {
            return null;
        }
        
        const sprite = new PIXI.Sprite(texture);
        sprite.x = x;
        sprite.y = y;
        
        if (width !== null) sprite.width = width;
        if (height !== null) sprite.height = height;
        
        this.activeSprites.add(sprite);
        this.pixiRenderer.addChild(sprite);
        
        return sprite;
    }
    
    /**
     * Create a circle shape
     */
    createCircle(x, y, radius, color = 0xffffff, alpha = 1) {
        const circle = new PIXI.Graphics();
        circle.beginFill(color, alpha);
        circle.drawCircle(x, y, radius);
        circle.endFill();
        
        this.pixiRenderer.addChild(circle);
        return circle;
    }
    
    /**
     * Create a rectangle shape
     */
    createRectangle(x, y, width, height, color = 0xffffff, alpha = 1) {
        const rect = new PIXI.Graphics();
        rect.beginFill(color, alpha);
        rect.drawRect(x, y, width, height);
        rect.endFill();
        
        this.pixiRenderer.addChild(rect);
        return rect;
    }
    
    /**
     * Create a line
     */
    createLine(x1, y1, x2, y2, color = 0xffffff, thickness = 1, alpha = 1) {
        const line = new PIXI.Graphics();
        line.lineStyle(thickness, color, alpha);
        line.moveTo(x1, y1);
        line.lineTo(x2, y2);
        
        this.pixiRenderer.addChild(line);
        return line;
    }
    
    /**
     * Create a circle outline (for range indicators)
     */
    createCircleOutline(x, y, radius, color = 0xffffff, thickness = 2, alpha = 1) {
        const circle = new PIXI.Graphics();
        circle.lineStyle(thickness, color, alpha);
        circle.drawCircle(x, y, radius);
        
        this.pixiRenderer.addChild(circle);
        return circle;
    }
    
    /**
     * Create text
     */
    createText(text, x, y, fontFamily = 'Arial', fontSize = 16, color = 0xffffff, align = 'left') {
        const textStyle = new PIXI.TextStyle({
            fontFamily: fontFamily,
            fontSize: fontSize,
            fill: color,
            align: align
        });
        
        const pixiText = new PIXI.Text(text, textStyle);
        pixiText.x = x;
        pixiText.y = y;
        
        if (align === 'center') {
            pixiText.anchor.x = 0.5;
        } else if (align === 'right') {
            pixiText.anchor.x = 1;
        }
        
        this.pixiRenderer.addChild(pixiText);
        return pixiText;
    }
    
    /**
     * Create a particle (simple circle for effects)
     */
    createParticle(x, y, radius = 5, color = 0xff00ff, alpha = 1) {
        return this.createCircle(x, y, radius, color, alpha);
    }
    
    /**
     * Remove a sprite and clean up
     */
    removeSprite(sprite) {
        if (sprite) {
            this.pixiRenderer.removeChild(sprite);
            this.activeSprites.delete(sprite);
        }
    }
    
    /**
     * Clear all active sprites
     */
    clearSprites() {
        this.activeSprites.forEach(sprite => {
            this.pixiRenderer.removeChild(sprite);
        });
        this.activeSprites.clear();
    }
    
    /**
     * Get texture dimensions
     */
    getTextureDimensions(imageUrl) {
        const texture = this.getTexture(imageUrl);
        if (!texture) {
            return { width: 0, height: 0 };
        }
        return {
            width: texture.width,
            height: texture.height
        };
    }
    
    /**
     * Preload multiple textures
     */
    preloadTextures(imageUrls) {
        return Promise.all(
            imageUrls.map(url => {
                return new Promise((resolve, reject) => {
                    try {
                        const texture = this.getTexture(url);
                        if (texture.valid) {
                            resolve(texture);
                        } else {
                            texture.once('update', () => resolve(texture));
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            })
        );
    }
    
    /**
     * Apply tint to a sprite
     */
    tintSprite(sprite, color) {
        if (sprite) {
            sprite.tint = color;
        }
    }
    
    /**
     * Rotate a sprite
     */
    rotateSprite(sprite, angle) {
        if (sprite) {
            sprite.rotation = angle;
        }
    }
    
    /**
     * Scale a sprite
     */
    scaleSprite(sprite, scaleX, scaleY = null) {
        if (sprite) {
            sprite.scale.x = scaleX;
            sprite.scale.y = scaleY !== null ? scaleY : scaleX;
        }
    }
}
