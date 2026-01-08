/**
 * LootBag - Visual representation of a loot bag on the ground
 * Can be clicked by the player to collect loot
 */
export class LootBag {
    constructor(x, y, lootId, isRare = false) {
        this.x = x;
        this.y = y;
        this.lootId = lootId;
        this.isRare = isRare;
        
        // Physics
        this.vx = (Math.random() - 0.5) * 200; // Random horizontal velocity
        this.vy = -300; // Initial upward velocity for jump effect
        this.gravity = 600; // Gravity acceleration
        this.onGround = false;
        this.groundLevel = null; // Will be set when bag hits bottom or is placed
        
        // Animation
        this.animationTime = 0;
        this.bobAmount = 0; // For gentle bobbing on ground
        this.bobSpeed = 2; // Speed of bobbing animation
        this.collectAnimationTime = 0;
        this.isCollecting = false;
        
        // Rare loot specific
        this.rareGlowAmount = 0;
        this.rarePulseTime = 0;
        
        // Size and collision
        this.width = 28;
        this.height = 32;
        this.radius = 14;
        
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
        const sackColor = this.isRare ? '#6B3BA8' : '#D4A574'; // Purple for rare, tan for normal
        const tieColor = this.isRare ? '#A855F7' : '#8B6914'; // Bright purple for rare, dark gold for normal
        const outlineColor = this.isRare ? '#9D4EDD' : '#B8860B'; // Dark purple for rare, gold for normal
        
        ctx.save();
        ctx.translate(x, y);
        
        // Subtle rotation for character
        const angle = Math.sin(this.animationTime * 2) * 0.05;
        ctx.rotate(angle);

        // Main sack body - rounded rectangle for pouch
        const sackWidth = this.width;
        const sackHeight = this.height * 0.8;
        const cornerRadius = 3;
        
        // Draw sack body with rounded corners
        ctx.fillStyle = sackColor;
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(-sackWidth/2 + cornerRadius, -sackHeight/2);
        ctx.lineTo(sackWidth/2 - cornerRadius, -sackHeight/2);
        ctx.quadraticCurveTo(sackWidth/2, -sackHeight/2, sackWidth/2, -sackHeight/2 + cornerRadius);
        ctx.lineTo(sackWidth/2, sackHeight/2 - cornerRadius);
        ctx.quadraticCurveTo(sackWidth/2, sackHeight/2, sackWidth/2 - cornerRadius, sackHeight/2);
        ctx.lineTo(-sackWidth/2 + cornerRadius, sackHeight/2);
        ctx.quadraticCurveTo(-sackWidth/2, sackHeight/2, -sackWidth/2, sackHeight/2 - cornerRadius);
        ctx.lineTo(-sackWidth/2, -sackHeight/2 + cornerRadius);
        ctx.quadraticCurveTo(-sackWidth/2, -sackHeight/2, -sackWidth/2 + cornerRadius, -sackHeight/2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw rope tie at top of sack
        ctx.strokeStyle = tieColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-sackWidth/3, -sackHeight/2 - 2);
        ctx.quadraticCurveTo(0, -sackHeight/2 - 6, sackWidth/3, -sackHeight/2 - 2);
        ctx.stroke();
        
        // Rope knots
        ctx.fillStyle = tieColor;
        ctx.beginPath();
        ctx.arc(-sackWidth/3, -sackHeight/2 - 2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sackWidth/3, -sackHeight/2 - 2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Shine/highlight on sack
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.ellipse(-sackWidth/4, -sackHeight/3, sackWidth/5, sackHeight/4, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Rare loot glow effect
        if (this.isRare) {
            const glowIntensity = 0.35 + Math.sin(Date.now() / 300) * 0.25;
            ctx.fillStyle = `rgba(168, 85, 247, ${glowIntensity * 0.7})`;
            ctx.beginPath();
            ctx.ellipse(0, 0, this.width * 0.55, this.height * 0.55, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Outer aura
            ctx.strokeStyle = `rgba(168, 85, 247, ${glowIntensity * 0.4})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(0, 0, this.width * 0.7, this.height * 0.7, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Sparkle effect
        const sparkleCount = this.isRare ? 3 : 2;
        for (let i = 0; i < sparkleCount; i++) {
            const angle = (this.animationTime * 2.5 + (i / sparkleCount) * Math.PI * 2);
            const distance = this.width * 0.5;
            const sparkleX = Math.cos(angle) * distance;
            const sparkleY = Math.sin(angle) * distance;
            
            const sparkleSize = 1.2 + Math.sin(this.animationTime * 5) * 0.6;
            ctx.fillStyle = this.isRare ? 'rgba(168, 85, 247, 0.9)' : 'rgba(218, 165, 32, 0.9)';
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Twinkle effect - small stars
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY - 1, 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();

        // Draw floating text if just dropped
        if (this.animationTime < 0.5) {
            const floatOffset = (1 - this.animationTime / 0.5) * 20;
            ctx.save();
            ctx.translate(x, y - 35 - floatOffset);
            ctx.fillStyle = this.isRare ? '#A855F7' : '#FFD700';
            ctx.font = 'bold 13px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 3;
            ctx.fillText(this.isRare ? 'Rare Loot!' : 'Loot!', 0, 0);
            ctx.restore();
        }
    }
}
