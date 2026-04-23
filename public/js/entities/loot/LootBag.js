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
        this.radius = 22; // Generous click radius for easier collection
        
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

        // Don't render expired bags
        if (this.lifetime > 0 && this.age >= this.lifetime) {
            return;
        }

        const x = this.x;
        const yOffset = this.onGround ? this.bobAmount : 0;
        const y = this.y + yOffset;

        // Fade out during collect animation or near expiry
        let opacity = 1;
        if (this.isCollecting) {
            const fadeProgress = Math.min(this.collectAnimationTime / 0.5, 1);
            opacity = 1 - fadeProgress;
        } else if (this.lifetime > 0 && this.age > this.lifetime - 15) {
            // Blink/fade in last 15 seconds of lifetime
            const timeLeft = this.lifetime - this.age;
            const blinkRate = timeLeft < 5 ? 4 : 2; // Faster blink in last 5 seconds
            opacity = 0.4 + 0.6 * Math.abs(Math.sin(this.age * blinkRate));
        }

        if (ctx.globalAlpha !== undefined) {
            ctx.globalAlpha = opacity;
        }
        this.renderBag(ctx, x, y);
        if (ctx.globalAlpha !== undefined) {
            ctx.globalAlpha = 1;
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

/**
 * RealmShardDrop - Special visual drop for Frog King's Realm Shards
 * Appears as a magical crystalline shard with glowing particles
 */
export class RealmShardDrop {
    constructor(x, y, lootId) {
        this.x = x;
        this.y = y;
        this.lootId = lootId;
        this.isRare = false; // Not a bag so rarity doesn't apply the same way

        // Physics - floats upward initially then settles
        this.vx = (Math.random() - 0.5) * 80;
        this.vy = -220;
        this.gravity = 400;
        this.onGround = false;
        this.groundLevel = null;

        // Animation
        this.animationTime = 0;
        this.collectAnimationTime = 0;
        this.isCollecting = false;
        this.particles = [];

        // Size
        this.width = 30;
        this.height = 36;
        this.radius = 24;

        // Lifetime
        this.lifetime = 0; // No expiry for shards
        this.age = 0;
    }

    update(deltaTime, canvasHeight = 800, canvasWidth = 1200) {
        if (this.isCollecting) {
            this.collectAnimationTime += deltaTime;
            return;
        }

        this.age += deltaTime;
        this.animationTime += deltaTime;

        if (!this.onGround) {
            this.vy += this.gravity * deltaTime;
            this.y += this.vy * deltaTime;
            this.x += this.vx * deltaTime;
            this.vx *= 0.97;
            const groundLevel = Math.max(50, canvasHeight - 100);
            if (this.y + this.radius >= groundLevel) {
                this.onGround = true;
                this.y = groundLevel - this.radius;
                this.vy = 0;
                this.vx = 0;
            }
            if (this.x - this.radius < 0) { this.x = this.radius; this.vx *= -0.3; }
            if (this.x + this.radius > canvasWidth) { this.x = canvasWidth - this.radius; this.vx *= -0.3; }
        }

        // Spawn ambient particles when on ground
        if (this.onGround && Math.random() < 0.3) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 15 + Math.random() * 25;
            this.particles.push({
                x: this.x + (Math.random() - 0.5) * 14,
                y: this.y + (Math.random() - 0.5) * 8,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd - 30,
                life: 0.6 + Math.random() * 0.5,
                maxLife: 1.1,
                color: Math.random() < 0.5 ? '#00FFCC' : '#FF80FF',
                size: 1.5 + Math.random() * 2
            });
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= deltaTime;
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.vy += 60 * deltaTime;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    isClickable() {
        return this.onGround && !this.isCollecting;
    }

    collect() {
        this.isCollecting = true;
        this.collectAnimationTime = 0;
    }

    isCollected() {
        return this.isCollecting && this.collectAnimationTime > 0.6;
    }

    getScreenBounds() {
        return { x: this.x - this.radius, y: this.y - this.radius, width: this.width, height: this.height };
    }

    render(ctx) {
        if (this.isCollected()) return;

        const x = this.x;
        const bobY = this.onGround ? Math.sin(this.animationTime * 2.5) * 3 : 0;
        const y = this.y + bobY;

        let opacity = 1;
        if (this.isCollecting) {
            opacity = Math.max(0, 1 - this.collectAnimationTime / 0.6);
        }

        // Render particles first (behind shard)
        for (const p of this.particles) {
            const alpha = (p.life / p.maxLife) * opacity;
            if (ctx.globalAlpha !== undefined) ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        if (ctx.globalAlpha !== undefined) ctx.globalAlpha = opacity;
        this._renderShard(ctx, x, y);
        if (ctx.globalAlpha !== undefined) ctx.globalAlpha = 1;
    }

    _renderShard(ctx, x, y) {
        const t = this.animationTime;
        const pulse = 0.65 + 0.35 * Math.sin(t * 3.5);
        ctx.save();
        ctx.translate(x, y);

        const tilt = Math.sin(t * 1.8) * 0.12;
        ctx.rotate(tilt);

        // Large outer glow
        const glowColor = this.lootId === 'realm-shard-top' ? '#FF80FF' : '#00FFCC';
        if (ctx.createRadialGradient) {
            const outerGlow = ctx.createRadialGradient(0, 0, 2, 0, 0, 28);
            outerGlow.addColorStop(0, `rgba(255,220,50,${0.55 * pulse})`);
            outerGlow.addColorStop(0.4, `${glowColor}44`);
            outerGlow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = outerGlow;
            ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.fill();
        }

        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 14 * pulse;

        // Crystal body
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(10, -6);
        ctx.lineTo(12, 4);
        ctx.lineTo(6, 14);
        ctx.lineTo(0, 18);
        ctx.lineTo(-6, 14);
        ctx.lineTo(-12, 4);
        ctx.lineTo(-10, -6);
        ctx.closePath();

        const cg = ctx.createLinearGradient(-12, -16, 12, 18);
        if (this.lootId === 'realm-shard-top') {
            cg.addColorStop(0, '#FFCCFF');
            cg.addColorStop(0.45, '#CC44CC');
            cg.addColorStop(1, '#440044');
        } else {
            cg.addColorStop(0, '#AAFFEE');
            cg.addColorStop(0.45, '#00CCAA');
            cg.addColorStop(1, '#003322');
        }
        ctx.fillStyle = cg;
        ctx.fill();
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 1.5 * pulse;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Inner highlight facet
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(-10, -6);
        ctx.lineTo(-12, 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-4, -10);
        ctx.lineTo(-2, 2);
        ctx.stroke();

        // Fracture line (jagged cut)
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-12, 1);
        ctx.lineTo(-6, -3);
        ctx.lineTo(0, 1);
        ctx.lineTo(6, -4);
        ctx.lineTo(12, 0);
        ctx.stroke();

        // Floating sparkle dots around the shard
        const sparkAngles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
        sparkAngles.forEach((baseA, i) => {
            const a = baseA + t * 1.5;
            const r = 16 + 4 * Math.sin(t * 2 + i);
            const sx = Math.cos(a) * r;
            const sy = Math.sin(a) * r * 0.5;
            const alpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 2.5 + i * 0.8));
            ctx.fillStyle = i % 2 === 0 ? `rgba(0,255,200,${alpha})` : `rgba(255,120,255,${alpha})`;
            ctx.beginPath(); ctx.arc(sx, sy, 2 + Math.sin(t * 3 + i) * 0.8, 0, Math.PI * 2); ctx.fill();
        });

        // "Realm Shard!" text popup on spawn
        if (this.animationTime < 0.8) {
            const floatOffset = (1 - this.animationTime / 0.8) * 24;
            ctx.save();
            ctx.translate(0, -22 - floatOffset);
            const textAlpha = this.animationTime < 0.5 ? 1 : (1 - (this.animationTime - 0.5) / 0.3);
            ctx.globalAlpha = textAlpha;
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#FF8800';
            ctx.shadowBlur = 6;
            ctx.fillText('Realm Shard!', 0, 0);
            ctx.restore();
        }

        ctx.restore();
    }
}
