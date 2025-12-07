/**
 * HitSplatter - Floating damage indicator that rises and fades
 */
export class HitSplatter {
    constructor(x, y, damage, damageType = 'physical', followTarget = null) {
        this.x = x;
        this.y = y;
        this.damage = Math.round(damage);
        this.damageType = damageType;
        this.followTarget = followTarget; // For DoT effects that follow enemies
        
        // Animation properties
        this.life = 0.8; // Shorter lifetime
        this.maxLife = 0.8;
        
        // Movement
        this.vx = (Math.random() - 0.5) * 40; // Less horizontal drift
        this.vy = -80; // Slower rise speed
        
        // Size animation - much smaller
        this.scale = 0.6;
        this.maxScale = 0.9;
    }
    
    /**
     * Get color based on damage type
     */
    getColor() {
        switch(this.damageType) {
            case 'fire':
                return 'rgb(255, 100, 0)'; // Orange-red for fire
            case 'water':
                return 'rgb(100, 200, 255)'; // Light blue for water
            case 'air':
                return 'rgb(200, 220, 255)'; // Light cyan for air/chain
            case 'earth':
                return 'rgb(200, 150, 50)'; // Brown for earth/piercing
            case 'poison':
                return 'rgb(100, 200, 100)'; // Green for poison
            case 'physical':
            default:
                return 'rgb(255, 255, 255)'; // White for physical
        }
    }
    
    /**
     * Get glow color (slightly different shade)
     */
    getGlowColor() {
        switch(this.damageType) {
            case 'fire':
                return 'rgba(255, 150, 0, 0.4)';
            case 'water':
                return 'rgba(100, 200, 255, 0.4)';
            case 'air':
                return 'rgba(200, 220, 255, 0.4)';
            case 'earth':
                return 'rgba(200, 150, 50, 0.4)';
            case 'poison':
                return 'rgba(100, 200, 100, 0.4)';
            case 'physical':
            default:
                return 'rgba(255, 255, 255, 0.3)';
        }
    }
    
    /**
     * Update the hit splatter position and animation
     */
    update(deltaTime) {
        this.life -= deltaTime;
        
        // If following a target, update position to stay near it
        if (this.followTarget && !this.followTarget.isDead()) {
            // Maintain offset from target
            const offsetX = this.x - this.followTarget.x;
            const offsetY = this.y - this.followTarget.y;
            
            // Keep the offset but make it decay slightly so it drifts up
            this.x = this.followTarget.x + offsetX * 0.98;
            this.y = this.followTarget.y + offsetY * 0.98;
        } else {
            // Normal movement: rise with gravity effect
            this.x += this.vx * deltaTime;
            this.y += this.vy * deltaTime;
            
            // Apply upward acceleration to vy (gravity working against upward motion)
            this.vy -= 40 * deltaTime; // Gravity to slow the rise
        }
        
        // Scale animation: start small, grow, then shrink as it fades
        const progress = 1 - (this.life / this.maxLife);
        if (progress < 0.15) {
            // First 15% of time: scale up
            this.scale = 0.6 + (this.maxScale - 0.6) * (progress / 0.15);
        } else {
            // Remaining time: scale down
            this.scale = this.maxScale - (this.maxScale - 0.4) * ((progress - 0.15) / 0.85);
        }
    }
    
    /**
     * Check if the splatter is still alive
     */
    isAlive() {
        return this.life > 0;
    }
    
    /**
     * Render the hit splatter
     */
    render(ctx) {
        if (!this.isAlive()) return;
        
        // Calculate opacity based on remaining life
        const opacity = Math.max(0, this.life / this.maxLife);
        const color = this.getColor();
        const glowColor = this.getGlowColor();
        
        // Save context state
        ctx.save();
        
        // Move to splatter position and apply scale
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        
        // Draw glow/shadow effect for emphasis (smaller)
        ctx.fillStyle = glowColor.replace('0.4', (0.3 * opacity).toString());
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw main text (smaller font)
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw text with slight shadow for readability
        ctx.fillStyle = 'rgba(0, 0, 0, ' + (0.5 * opacity) + ')';
        ctx.fillText(this.damage.toString(), 0.5, 1);
        
        // Draw bright main text
        ctx.fillStyle = color;
        ctx.fillText(this.damage.toString(), 0, 0);
        
        // Restore context state
        ctx.restore();
    }
}
