export class MagicTower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.range = 110;
        this.damage = 30;
        this.fireRate = 0.8; // shots per second
        this.cooldown = 0;
        this.target = null;
        this.animationTime = 0;
        this.size = 80; // Tower takes 2x2 grid cells
    }
    
    update(deltaTime, enemies) {
        this.cooldown = Math.max(0, this.cooldown - deltaTime);
        this.animationTime += deltaTime;
        
        this.target = this.findTarget(enemies);
        
        if (this.target && this.cooldown === 0) {
            this.shoot();
            this.cooldown = 1 / this.fireRate;
        }
    }
    
    findTarget(enemies) {
        let closest = null;
        let closestDist = this.range;
        
        for (const enemy of enemies) {
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist <= this.range && dist < closestDist) {
                closest = enemy;
                closestDist = dist;
            }
        }
        
        return closest;
    }
    
    shoot() {
        if (this.target) {
            this.target.takeDamage(this.damage);
            // Magic towers could slow enemies or have other effects
            if (this.target.speed > 20) {
                this.target.speed *= 0.9; // Slow effect
            }
        }
    }
    
    render(ctx, screenX, screenY, scale = 1) {
        const size = this.size * scale;
        const halfSize = size / 2;
        
        // Tower base (mystical stone)
        ctx.fillStyle = '#2E1A47';
        ctx.fillRect(screenX - halfSize, screenY - halfSize, size, size);
        
        // Magical runes on base
        ctx.strokeStyle = '#8A2BE2';
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        // Draw runic patterns
        ctx.moveTo(screenX - halfSize + 10 * scale, screenY - halfSize + 10 * scale);
        ctx.lineTo(screenX + halfSize - 10 * scale, screenY + halfSize - 10 * scale);
        ctx.moveTo(screenX + halfSize - 10 * scale, screenY - halfSize + 10 * scale);
        ctx.lineTo(screenX - halfSize + 10 * scale, screenY + halfSize - 10 * scale);
        ctx.stroke();
        
        // Crystal tower
        ctx.fillStyle = '#4B0082';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 20 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Magic crystal (animated)
        const pulse = 0.8 + 0.2 * Math.sin(this.animationTime * 4);
        ctx.fillStyle = `rgba(138, 43, 226, ${pulse})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 12 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Magic sparkles
        for (let i = 0; i < 6; i++) {
            const angle = (this.animationTime * 2 + i * Math.PI / 3) % (Math.PI * 2);
            const sparkleX = screenX + Math.cos(angle) * 25 * scale;
            const sparkleY = screenY + Math.sin(angle) * 25 * scale;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, 2 * scale, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Range indicator
        if (this.target) {
            ctx.strokeStyle = 'rgba(138, 43, 226, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.range * scale, 0, Math.PI * 2);
            ctx.stroke();
            
            // Magic beam
            ctx.strokeStyle = 'rgba(138, 43, 226, 0.8)';
            ctx.lineWidth = 3 * scale;
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(this.target.x, this.target.y);
            ctx.stroke();
            
            // Beam glow
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1 * scale;
            ctx.stroke();
        }
    }
    
    static getInfo() {
        return {
            name: 'Magic Tower',
            description: 'Mystical tower that pierces armor and slows enemies.',
            damage: '30',
            range: '110',
            fireRate: '0.8/sec',
            cost: 150
        };
    }
}
