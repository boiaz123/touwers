export class CannonTower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.range = 100;
        this.damage = 50;
        this.fireRate = 0.5; // shots per second
        this.cooldown = 0;
        this.target = null;
        this.size = 80; // Tower takes 2x2 grid cells
    }
    
    update(deltaTime, enemies) {
        this.cooldown = Math.max(0, this.cooldown - deltaTime);
        
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
        }
    }
    
    render(ctx, screenX, screenY, scale = 1) {
        const size = this.size * scale;
        const halfSize = size / 2;
        
        // Tower base (stone platform)
        ctx.fillStyle = '#5D4E37';
        ctx.fillRect(screenX - halfSize, screenY - halfSize, size, size);
        
        // Cannon platform
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 25 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Cannon barrel direction
        const angle = this.target ? 
            Math.atan2(this.target.y - screenY, this.target.x - screenX) : 0;
        
        // Cannon barrel
        ctx.fillStyle = '#2F2F2F';
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(angle);
        ctx.fillRect(-5 * scale, -8 * scale, 35 * scale, 16 * scale);
        ctx.restore();
        
        // Cannon wheels
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.arc(screenX - 15 * scale, screenY + 15 * scale, 8 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 15 * scale, screenY + 15 * scale, 8 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Range indicator when targeting
        if (this.target) {
            ctx.strokeStyle = 'rgba(139, 69, 19, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.range * scale, 0, Math.PI * 2);
            ctx.stroke();
            
            // Shooting line
            ctx.strokeStyle = 'rgba(255, 165, 0, 0.7)';
            ctx.lineWidth = 3 * scale;
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(this.target.x, this.target.y);
            ctx.stroke();
        }
    }
    
    static getInfo() {
        return {
            name: 'Cannon Tower',
            description: 'Heavy artillery with high damage but slow fire rate.',
            damage: '50',
            range: '100',
            fireRate: '0.5/sec',
            cost: 100
        };
    }
}
