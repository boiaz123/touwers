import { ObjectPool } from '../../core/ObjectPool.js';

/**
 * HitSplatter - Floating damage indicator that rises and fades with type-specific styling
 */
export class HitSplatter {
    constructor(x, y, damage, damageType = 'physical', followTarget = null) {
        this.reset(x, y, damage, damageType, followTarget);
    }

    /** Reinitializes a pooled instance in place - see acquire()/release() below. */
    reset(x, y, damage, damageType = 'physical', followTarget = null) {
        this.x = x;
        this.y = y;
        this.damage = Math.round(damage);
        this.damageType = damageType;
        this.followTarget = followTarget; // For DoT effects that follow enemies

        // Animation properties
        this.life = 1.2; // Longer lifetime for better visibility
        this.maxLife = 1.2;

        // Movement
        this.vx = (Math.random() - 0.5) * 60; // Horizontal drift
        this.vy = -120; // Rise speed

        // Size animation
        this.scale = 0.8;
        this.maxScale = 1.3;

        // Rotation for stylized effect
        this.rotation = 0;
        this.rotationSpeed = Math.random() * 3 - 1.5;

        // Cache colors at construction - damageType never changes after creation.
        this.color = HitSplatter.COLOR_MAP[damageType] || HitSplatter.COLOR_MAP.physical;
        this.glowColor = HitSplatter.GLOW_MAP[damageType] || HitSplatter.GLOW_MAP.physical;
        this.glowColorMid = HitSplatter.GLOW_MID_MAP[damageType] || HitSplatter.GLOW_MID_MAP.physical;
        this.ringColorBase = this.color.replace('rgb(', 'rgba(').replace(')', ', ');

        // Pre-rendered "damage number + outline" bitmap, shared across every splatter with
        // the same (damage, color) pair (see _getCachedText below) - looked up once here
        // instead of re-running strokeText+fillText every render() call for this
        // splatter's entire 1.2s lifetime. Text shaping/rasterization is by far the most
        // expensive part of this draw; a cached bitmap turns it into a cheap drawImage().
        this._textCanvas = HitSplatter._getCachedText(this.damage.toString(), this.color);

        return this;
    }

    static COLOR_MAP = {
        fire: 'rgb(255, 80, 0)', water: 'rgb(50, 220, 255)', air: 'rgb(100, 200, 255)',
        earth: 'rgb(220, 150, 30)', poison: 'rgb(100, 255, 100)', arcane: 'rgb(186, 85, 211)',
        magic: 'rgb(186, 85, 211)', ice: 'rgb(100, 220, 255)', electricity: 'rgb(255, 255, 100)',
        physical: 'rgb(255, 255, 200)'
    };
    static GLOW_MAP = {
        fire: 'rgba(255, 100, 0, 0.6)', water: 'rgba(50, 220, 255, 0.6)', air: 'rgba(100, 200, 255, 0.5)',
        earth: 'rgba(220, 150, 30, 0.6)', poison: 'rgba(100, 255, 100, 0.6)', arcane: 'rgba(186, 85, 211, 0.6)',
        magic: 'rgba(186, 85, 211, 0.6)', ice: 'rgba(100, 220, 255, 0.6)', electricity: 'rgba(255, 255, 100, 0.6)',
        physical: 'rgba(255, 255, 200, 0.5)'
    };
    static GLOW_MID_MAP = {
        fire: 'rgba(255, 100, 0, 0.4)', water: 'rgba(50, 220, 255, 0.4)', air: 'rgba(100, 200, 255, 0.4)',
        earth: 'rgba(220, 150, 30, 0.4)', poison: 'rgba(100, 255, 100, 0.4)', arcane: 'rgba(186, 85, 211, 0.4)',
        magic: 'rgba(186, 85, 211, 0.4)', ice: 'rgba(100, 220, 255, 0.4)', electricity: 'rgba(255, 255, 100, 0.4)',
        physical: 'rgba(255, 255, 200, 0.4)'
    };

    // Shared bitmap cache: key is "<damageStr>:<color>", since font/size/color/outline are
    // fully determined by those two values. Capped so a very long session (many distinct
    // damage rolls) can't grow this unboundedly - oldest entries are evicted first.
    static _textCache = new Map();
    static _textCacheOrder = [];
    static _TEXT_CACHE_MAX = 300;

    static _getCachedText(damageStr, color) {
        const key = damageStr + ':' + color;
        const cached = HitSplatter._textCache.get(key);
        if (cached) return cached;

        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 3;
        ctx.strokeText(damageStr, cx, cy);

        ctx.fillStyle = color;
        ctx.fillText(damageStr, cx, cy);

        HitSplatter._textCache.set(key, canvas);
        HitSplatter._textCacheOrder.push(key);
        if (HitSplatter._textCacheOrder.length > HitSplatter._TEXT_CACHE_MAX) {
            HitSplatter._textCache.delete(HitSplatter._textCacheOrder.shift());
        }
        return canvas;
    }

    // Free-list pool - acquire()/release() instead of `new`/GC per hit. See BaseEnemy.js's
    // takeDamage() (acquire) and EnemyManager.js's splatter compaction loops (release).
    static _pool = new ObjectPool(() => new HitSplatter(0, 0, 0, 'physical', null));

    static acquire(x, y, damage, damageType, followTarget) {
        return HitSplatter._pool.acquire().reset(x, y, damage, damageType, followTarget);
    }

    static release(instance) {
        instance.followTarget = null; // don't keep a dead enemy reference alive via the pool
        HitSplatter._pool.release(instance);
    }

    /**
     * Update the hit splatter position and animation
     */
    update(deltaTime) {
        this.life -= deltaTime;
        this.rotation += this.rotationSpeed * deltaTime;

        // If following a target, update position to stay near it
        if (this.followTarget && !this.followTarget.isDead()) {
            // Maintain offset from target
            const offsetX = this.x - this.followTarget.x;
            const offsetY = this.y - this.followTarget.y;

            // Keep the offset but make it decay slightly so it drifts up
            this.x = this.followTarget.x + offsetX * 0.98;
            this.y = this.followTarget.y + offsetY * 0.98;

            // While following, keep upward motion
            this.vy = -120;
        } else {
            // Normal movement: rise with gravity effect
            this.x += this.vx * deltaTime;
            this.y += this.vy * deltaTime;

            // Apply upward acceleration to vy (gravity working against upward motion)
            // Ensure it always rises upward - never settle on the ground
            this.vy = Math.max(this.vy - 60 * deltaTime, -120); // Never go below -120 (always rising)
        }

        // Scale animation: start small, grow, then shrink as it fades
        const progress = 1 - (this.life / this.maxLife);
        if (progress < 0.2) {
            // First 20% of time: scale up
            this.scale = 0.8 + (this.maxScale - 0.8) * (progress / 0.2);
        } else {
            // Remaining time: scale down
            this.scale = this.maxScale - (this.maxScale - 0.5) * ((progress - 0.2) / 0.8);
        }
    }

    /**
     * Check if the splatter is still alive
     */
    isAlive() {
        // Use small epsilon to prevent floating point precision issues
        return this.life > 0.001;
    }

    /**
     * Render the hit splatter
     */
    render(ctx) {
        if (!this.isAlive()) return;

        const opacity = Math.max(0, this.life / this.maxLife);

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);

        // Outer glow
        ctx.fillStyle = this.glowColor;
        ctx.globalAlpha = opacity * 0.7;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();

        // Mid glow (pre-built at 0.4 alpha)
        ctx.fillStyle = this.glowColorMid;
        ctx.globalAlpha = opacity * 0.9;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        // Background circle
        ctx.globalAlpha = opacity;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();

        // Damage number + outline - pre-rendered once per (damage, color) pair (see reset()/
        // _getCachedText above), blitted here instead of calling strokeText/fillText every
        // frame. globalAlpha (still `opacity` from the background circle above) applies to
        // drawImage exactly like it did to the text draws, so the fade is unchanged.
        const tc = this._textCanvas;
        ctx.drawImage(tc, -tc.width / 2, -tc.height / 2);

        // Ring
        ctx.strokeStyle = this.ringColorBase + (0.5 * opacity).toFixed(2) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}
