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
        const sackColor = this.isRare ? '#5C4A78' : '#C4934F'; // Deep purple for rare, leather brown for normal
        const sackDarkColor = this.isRare ? '#3D2E55' : '#8B6F47'; // Darker shade for fabric
        const cordColor = this.isRare ? '#8B5CF6' : '#8B6914'; // Bright purple for rare, gold for normal
        const glowColor = this.isRare ? '#C4B5FD' : '#FFD700'; // Lavender glow for rare, golden glow for normal
        
        ctx.save();
        ctx.translate(x, y);
        
        // Subtle rotation for character
        const angle = Math.sin(this.animationTime * 2) * 0.05;
        ctx.rotate(angle);

        // Draw glow effect behind the sack
        const glowIntensity = this.isRare ? 
            0.4 + Math.sin(Date.now() / 300) * 0.25 : 
            0.3 + Math.sin(Date.now() / 400) * 0.2;
        
        // Create radial gradient for glow
        if (ctx.createRadialGradient) {
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width * 0.8);
            if (this.isRare) {
                gradient.addColorStop(0, `rgba(196, 181, 253, ${glowIntensity * 0.5})`);
                gradient.addColorStop(1, `rgba(196, 181, 253, 0)`);
            } else {
                gradient.addColorStop(0, `rgba(255, 215, 0, ${glowIntensity * 0.4})`);
                gradient.addColorStop(1, `rgba(255, 215, 0, 0)`);
            }
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.ellipse(0, 1, this.width * 0.9, this.height * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Main satchel body - wide and flat like a proper satchel/pouch
        const satchelWidth = this.width * 1.2;
        const satchelHeight = this.height * 0.55;
        
        // Draw main satchel body
        ctx.fillStyle = sackColor;
        ctx.strokeStyle = sackDarkColor;
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        // Top left curve (folded flap edge)
        ctx.moveTo(-satchelWidth/2, -satchelHeight/2.5);
        ctx.quadraticCurveTo(-satchelWidth/2.5, -satchelHeight/3, -satchelWidth/2.8, -satchelHeight/2.8);
        // Top edge with gentle curve
        ctx.lineTo(satchelWidth/2.8, -satchelHeight/2.8);
        ctx.quadraticCurveTo(satchelWidth/2.5, -satchelHeight/3, satchelWidth/2, -satchelHeight/2.5);
        // Right side - gentle curve
        ctx.quadraticCurveTo(satchelWidth/2 + 1.5, 0, satchelWidth/2, satchelHeight/2.2);
        // Bottom edge - rounded
        ctx.quadraticCurveTo(0, satchelHeight/2.5, -satchelWidth/2, satchelHeight/2.2);
        // Left side - gentle curve
        ctx.quadraticCurveTo(-satchelWidth/2 - 1.5, 0, -satchelWidth/2, -satchelHeight/2.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Add fabric wrinkles/texture for authenticity
        ctx.strokeStyle = sackDarkColor;
        ctx.lineWidth = 0.8;
        ctx.globalAlpha = 0.3;
        
        // Center wrinkle
        ctx.beginPath();
        ctx.moveTo(0, -satchelHeight/3);
        ctx.quadraticCurveTo(0, 0, 0, satchelHeight/2.5);
        ctx.stroke();
        
        // Left wrinkle
        ctx.beginPath();
        ctx.moveTo(-satchelWidth/3.5, -satchelHeight/2.2);
        ctx.quadraticCurveTo(-satchelWidth/4, satchelHeight/3, -satchelWidth/3, satchelHeight/2.2);
        ctx.stroke();
        
        // Right wrinkle
        ctx.beginPath();
        ctx.moveTo(satchelWidth/3.5, -satchelHeight/2.2);
        ctx.quadraticCurveTo(satchelWidth/4, satchelHeight/3, satchelWidth/3, satchelHeight/2.2);
        ctx.stroke();
        
        ctx.globalAlpha = 1;
        
        // Draw drawstring rope - thick medieval cord at the cinch
        ctx.strokeStyle = cordColor;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Main drawstring cinch in the middle
        ctx.beginPath();
        ctx.moveTo(-satchelWidth/2.8, -satchelHeight/2.8);
        ctx.quadraticCurveTo(-satchelWidth/4, -satchelHeight/2.2, 0, -satchelHeight/2.2);
        ctx.quadraticCurveTo(satchelWidth/4, -satchelHeight/2.2, satchelWidth/2.8, -satchelHeight/2.8);
        ctx.stroke();
        
        // Drawstring knot/bow at center top
        ctx.strokeStyle = cordColor;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, -satchelHeight/2.3 - 2, 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Left rope tail
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-2, -satchelHeight/2.3 - 2);
        ctx.quadraticCurveTo(-3.5, -satchelHeight/2.3 - 6, -2.5, -satchelHeight/2.3 - 7);
        ctx.stroke();
        
        // Right rope tail
        ctx.beginPath();
        ctx.moveTo(2, -satchelHeight/2.3 - 2);
        ctx.quadraticCurveTo(3.5, -satchelHeight/2.3 - 6, 2.5, -satchelHeight/2.3 - 7);
        ctx.stroke();
        
        // Highlight on satchel for depth
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.ellipse(-satchelWidth/3.5, -satchelHeight/3.5, satchelWidth/4.5, satchelHeight/3, -0.25, 0, Math.PI * 2);
        ctx.fill();
        
        // Bottom shadow for depth
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.ellipse(0, satchelHeight/2.3, satchelWidth/2.5, satchelHeight/4.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Sparkle/twinkle effects
        const sparkleCount = this.isRare ? 4 : 2;
        for (let i = 0; i < sparkleCount; i++) {
            const angle = (this.animationTime * 2.5 + (i / sparkleCount) * Math.PI * 2);
            const distance = this.width * 0.65;
            const sparkleX = Math.cos(angle) * distance;
            const sparkleY = Math.sin(angle) * distance;
            
            const sparkleSize = 1 + Math.sin(this.animationTime * 6 + i) * 0.5;
            ctx.fillStyle = this.isRare ? 
                `rgba(196, 181, 253, ${0.8 + Math.sin(this.animationTime * 4 + i) * 0.2})` :
                `rgba(255, 215, 0, ${0.8 + Math.sin(this.animationTime * 4 + i) * 0.2})`;
            
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Star twinkle
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(sparkleX + 0.5, sparkleY - 0.5, 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();

        // Draw floating text if just dropped
        if (this.animationTime < 0.5) {
            const floatOffset = (1 - this.animationTime / 0.5) * 20;
            ctx.save();
            ctx.translate(x, y - 35 - floatOffset);
            ctx.fillStyle = this.isRare ? '#C4B5FD' : '#FFD700';
            ctx.font = 'bold 13px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 3;
            ctx.fillText(this.isRare ? 'Rare Loot!' : 'Loot!', 0, 0);
            ctx.restore();
        }
    }
}
