export class MagicTower {
    constructor(x, y, gridX, gridY) {
        this.x = x;
        this.y = y;
        this.gridX = gridX;
        this.gridY = gridY;
        this.range = 110;
        this.damage = 30;
        this.fireRate = 0.8;
        this.cooldown = 0;
        this.target = null;
        this.animationTime = 0;
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
    
    render(ctx) {
        // Auto-scale tower size based on screen resolution
        const baseSize = Math.max(12, Math.min(26, ctx.canvas.width / 75));
        
        // Tower base
        ctx.fillStyle = '#4B0082';
        ctx.beginPath();
        ctx.arc(this.x, this.y, baseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Magic crystal (animated)
        const pulse = 0.8 + 0.2 * Math.sin(this.animationTime * 4);
        ctx.fillStyle = `rgba(138, 43, 226, ${pulse})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, baseSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Magic sparkles
        for (let i = 0; i < 4; i++) {
            const angle = (this.animationTime * 2 + i * Math.PI / 2) % (Math.PI * 2);
            const sparkleDistance = baseSize * 0.75;
            const sparkleX = this.x + Math.cos(angle) * sparkleDistance;
            const sparkleY = this.y + Math.sin(angle) * sparkleDistance;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, Math.max(1, baseSize * 0.125), 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Range indicator
        if (this.target) {
            ctx.strokeStyle = 'rgba(138, 43, 226, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
            
            // Magic beam
            ctx.strokeStyle = 'rgba(138, 43, 226, 0.8)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.target.x, this.target.y);
            ctx.stroke();
            
            // Beam glow
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
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
