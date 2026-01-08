/**
 * LootBag - Visual representation of a loot bag on the ground
 * Can be clicked by the player to collect loot
 */
export class LootBag {
    constructor(x, y, lootId) {
        this.x = x;
        this.y = y;
        this.lootId = lootId;
        
        // Physics
        this.vx = (Math.random() - 0.5) * 200; // Random horizontal velocity
        this.vy = -300; // Initial upward velocity for jump effect
        this.gravity = 600; // Gravity acceleration
        this.onGround = false;
        this.groundLevel = null; // Will be set when bag hits bottom or is placed
        
        // Animation
        this.animationTime = 0;
        this.bobAmount = 0; // For gentle bobbing on ground
        this.collectAnimationTime = 0;
        this.isCollecting = false;
        
        // Size and collision
        this.width = 24;
        this.height = 24;
        this.radius = 12;
        
        // Lifetime
        this.lifetime = 120; // Seconds the bag stays on ground (0 = infinite)
        this.age = 0;
    }

    update(deltaTime, canvasHeight = 800, canvasWidth = 1200) {
        if (this.isCollecting) {
            this.collectAnimationTime += deltaTime;
            return; // Don't update physics while collecting
        }

        this.age += deltaTime;
        this.animationTime += deltaTime;

        // Apply gravity
        if (!this.onGround) {
            this.vy += this.gravity * deltaTime;
            this.y += this.vy * deltaTime;
            this.x += this.vx * deltaTime;
            
            // Friction
            this.vx *= 0.98;
            
            // Calculate ground level - leave space for UI and keep loot visible
            // Ground is 80 pixels from bottom to account for UI bars
            const groundLevel = Math.max(50, canvasHeight - 100);
            
            // Check if hit the ground level
            if (this.y + this.radius >= groundLevel) {
                this.setOnGround(groundLevel - this.radius);
            }
            
            // Keep loot within horizontal bounds
            if (this.x - this.radius < 0) {
                this.x = this.radius;
                this.vx *= -0.3; // Bounce off left edge
            }
            if (this.x + this.radius > canvasWidth) {
                this.x = canvasWidth - this.radius;
                this.vx *= -0.3; // Bounce off right edge
            }
        } else {
            // On ground - gentle bobbing
            this.bobAmount = Math.sin(this.animationTime * 2) * 2;
            
            // Apply friction to velocity
            this.vx *= 0.95;
            if (Math.abs(this.vx) < 10) {
                this.vx = 0;
            }
            
            // Keep on ground even after friction
            const groundLevel = Math.max(50, canvasHeight - 100);
            if (this.y + this.radius > groundLevel) {
                this.y = groundLevel - this.radius;
            }
        }
    }

    setOnGround(y) {
        this.onGround = true;
        this.y = Math.max(this.radius, y); // Ensure loot doesn't go above top
        this.vy = 0;
        this.vx *= 0.3; // Dampen horizontal velocity on landing
    }

    getScreenBounds(cellSize) {
        return {
            x: this.x - this.radius,
            y: this.y - this.radius,
            width: this.width,
            height: this.height
        };
    }

    isClickable() {
        return this.onGround && !this.isCollecting && (this.lifetime === 0 || this.age < this.lifetime);
    }

    collect() {
        this.isCollecting = true;
        this.collectAnimationTime = 0;
    }

    isCollected() {
        return this.isCollecting && this.collectAnimationTime > 0.5;
    }

    render(ctx) {
        // Only render if on screen and not fully collected
        if (this.isCollected()) {
            return;
        }

        const x = this.x;
        const yOffset = this.onGround ? this.bobAmount : 0;
        const y = this.y + yOffset;

        if (this.isCollecting) {
            // Fade out animation
            const fadeProgress = Math.min(this.collectAnimationTime / 0.5, 1);
            const opacity = 1 - fadeProgress;
            
            if (ctx.globalAlpha !== undefined) {
                ctx.globalAlpha = opacity;
            }

            this.renderBag(ctx, x, y);

            if (ctx.globalAlpha !== undefined) {
                ctx.globalAlpha = 1;
            }
        } else {
            this.renderBag(ctx, x, y);
        }
    }

    renderBag(ctx, x, y) {
        // Draw bag shape (simple rectangle with slight rotation effect)
        const angle = Math.sin(this.animationTime * 3) * 0.1;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        // Bag body (brown/tan color)
        ctx.fillStyle = '#C9A961';
        ctx.fillRect(-this.radius, -this.radius, this.width, this.height);

        // Bag outline
        ctx.strokeStyle = '#8B6F47';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.radius, -this.radius, this.width, this.height);

        // Bag tie/closure
        ctx.fillStyle = '#5D4E37';
        ctx.fillRect(-this.radius + 4, -this.radius - 3, this.width - 8, 4);

        // Sparkle/glow effect
        const sparkle = Math.max(0, Math.sin(this.animationTime * 4) * 0.5 + 0.5);
        ctx.globalAlpha = sparkle;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, -this.radius / 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.restore();

        // Draw floating text if just dropped
        if (this.animationTime < 0.5) {
            const floatOffset = (1 - this.animationTime / 0.5) * 20;
            ctx.save();
            ctx.translate(x, y - 30 - floatOffset);
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Loot!', 0, 0);
            ctx.restore();
        }
    }
}
