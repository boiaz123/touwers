/**
 * PixiAnimationManager - Manages sprite animations and tweens using Pixi.js
 * Provides simple animation utilities for game entities
 */

export class PixiAnimationManager {
    constructor(pixiRenderer) {
        this.pixiRenderer = pixiRenderer;
        this.animations = new Map();
        this.tweens = new Map();
        this.animationFrames = new Map();
    }
    
    /**
     * Create an animated sprite from a sprite sheet
     */
    createAnimatedSprite(textureUrl, frameWidth, frameHeight, frameCount, frameRate = 10) {
        const texture = PIXI.Texture.from(textureUrl);
        
        // Create frames array
        const frames = [];
        const baseTexture = texture.baseTexture;
        
        let frameIndex = 0;
        for (let i = 0; i < frameCount; i++) {
            const col = i % Math.floor(baseTexture.width / frameWidth);
            const row = Math.floor(i / Math.floor(baseTexture.width / frameWidth));
            
            const frameTexture = new PIXI.Texture(
                baseTexture,
                new PIXI.Rectangle(col * frameWidth, row * frameHeight, frameWidth, frameHeight)
            );
            frames.push(frameTexture);
        }
        
        // Create animated sprite
        const animatedSprite = new PIXI.AnimatedSprite(frames);
        animatedSprite.animationSpeed = 1 / frameRate;
        animatedSprite.play();
        
        this.pixiRenderer.addChild(animatedSprite);
        return animatedSprite;
    }
    
    /**
     * Create a simple animation from texture frames
     */
    createAnimation(frames, frameRate = 10) {
        return {
            frames,
            frameRate,
            currentFrame: 0,
            elapsedTime: 0,
            isPlaying: false,
            isLooping: true
        };
    }
    
    /**
     * Start playing an animation
     */
    playAnimation(sprite, animation) {
        if (!animation) return;
        
        animation.isPlaying = true;
        animation.elapsedTime = 0;
        animation.currentFrame = 0;
        
        const animationId = Math.random().toString(36);
        this.animations.set(animationId, { sprite, animation });
        
        return animationId;
    }
    
    /**
     * Stop an animation
     */
    stopAnimation(animationId) {
        this.animations.delete(animationId);
    }
    
    /**
     * Update all active animations
     */
    updateAnimations(deltaTime) {
        for (const [id, { sprite, animation }] of this.animations.entries()) {
            if (!animation.isPlaying) continue;
            
            animation.elapsedTime += deltaTime;
            const frameDuration = 1 / animation.frameRate;
            
            if (animation.elapsedTime >= frameDuration) {
                animation.currentFrame++;
                animation.elapsedTime -= frameDuration;
                
                if (animation.currentFrame >= animation.frames.length) {
                    if (animation.isLooping) {
                        animation.currentFrame = 0;
                    } else {
                        animation.isPlaying = false;
                        this.animations.delete(id);
                        continue;
                    }
                }
                
                if (sprite && animation.frames[animation.currentFrame]) {
                    sprite.texture = animation.frames[animation.currentFrame];
                }
            }
        }
    }
    
    /**
     * Create a tween animation (position, scale, alpha, etc.)
     */
    tween(target, props, duration = 1) {
        const tweenId = Math.random().toString(36);
        
        const startProps = {};
        for (const key of Object.keys(props)) {
            startProps[key] = target[key];
        }
        
        const tween = {
            target,
            startProps,
            endProps: props,
            duration,
            elapsedTime: 0,
            isComplete: false,
            easeFunction: this.easeLinear
        };
        
        this.tweens.set(tweenId, tween);
        return tweenId;
    }
    
    /**
     * Update all active tweens
     */
    updateTweens(deltaTime) {
        const completed = [];
        
        for (const [id, tween] of this.tweens.entries()) {
            if (tween.isComplete) {
                completed.push(id);
                continue;
            }
            
            tween.elapsedTime += deltaTime;
            const progress = Math.min(1, tween.elapsedTime / tween.duration);
            const easeProgress = tween.easeFunction(progress);
            
            for (const key of Object.keys(tween.endProps)) {
                const start = tween.startProps[key];
                const end = tween.endProps[key];
                const value = start + (end - start) * easeProgress;
                tween.target[key] = value;
            }
            
            if (progress >= 1) {
                tween.isComplete = true;
                completed.push(id);
            }
        }
        
        // Remove completed tweens
        completed.forEach(id => this.tweens.delete(id));
    }
    
    /**
     * Easing functions
     */
    easeLinear(t) {
        return t;
    }
    
    easeInQuad(t) {
        return t * t;
    }
    
    easeOutQuad(t) {
        return t * (2 - t);
    }
    
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    easeInCubic(t) {
        return t * t * t;
    }
    
    easeOutCubic(t) {
        return 1 + (t - 1) ** 3;
    }
    
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * (t - 2)) * (2 * (t - 2)) + 1;
    }
    
    /**
     * Create a simple fade animation
     */
    fadeOut(sprite, duration = 1) {
        return this.tween(sprite, { alpha: 0 }, duration);
    }
    
    /**
     * Create a simple fade-in animation
     */
    fadeIn(sprite, duration = 1) {
        return this.tween(sprite, { alpha: 1 }, duration);
    }
    
    /**
     * Create a scale animation
     */
    scaleTo(sprite, scale, duration = 1) {
        return this.tween(sprite, { scale: { x: scale, y: scale } }, duration);
    }
    
    /**
     * Create a rotation animation
     */
    rotateTo(sprite, angle, duration = 1) {
        return this.tween(sprite, { rotation: angle }, duration);
    }
    
    /**
     * Create a movement animation
     */
    moveTo(sprite, x, y, duration = 1) {
        return this.tween(sprite, { x, y }, duration);
    }
    
    /**
     * Update all animations (call in game loop)
     */
    update(deltaTime) {
        this.updateAnimations(deltaTime);
        this.updateTweens(deltaTime);
    }
    
    /**
     * Clear all animations
     */
    clear() {
        this.animations.clear();
        this.tweens.clear();
    }
    
    /**
     * Get animation statistics
     */
    getStats() {
        return {
            activeAnimations: this.animations.size,
            activeTweens: this.tweens.size,
            totalActive: this.animations.size + this.tweens.size
        };
    }
}
