export class ArcherTower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.range = 140;
        this.damage = 15;
        this.fireRate = 1.5; // shots per second
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
        
        // Tower base (wooden platform)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(screenX - halfSize, screenY - halfSize, size, size);
        
        // Wooden supports
        ctx.fillStyle = '#654321';
        ctx.fillRect(screenX - halfSize, screenY - halfSize, 6 * scale, size);
        ctx.fillRect(screenX + halfSize - 6 * scale, screenY - halfSize, 6 * scale, size);
        ctx.fillRect(screenX - halfSize, screenY - halfSize, size, 6 * scale);
        ctx.fillRect(screenX - halfSize, screenY + halfSize - 6 * scale, size, 6 * scale);
        
        // Archer platform
        ctx.fillStyle = '#DEB887';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 18 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Archer figure (simple)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(screenX - 3 * scale, screenY - 8 * scale, 6 * scale, 16 * scale);
        
        // Bow (if targeting)
        if (this.target) {
            const angle = Math.atan2(this.target.y - screenY, this.target.x - screenX);
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 3 * scale;
            ctx.beginPath();
            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.rotate(angle);
            ctx.arc(0, 0, 12 * scale, -0.3, 0.3);
            ctx.restore();
            ctx.stroke();
        }
        
        // Range indicator when targeting
        if (this.target) {
            ctx.strokeStyle = 'rgba(222, 184, 135, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.range * scale, 0, Math.PI * 2);
            ctx.stroke();
            
            // Arrow
            ctx.strokeStyle = 'rgba(160, 82, 45, 0.6)';
            ctx.lineWidth = 2 * scale;
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(this.target.x, this.target.y);
            ctx.stroke();
        }
    }
    
    static getInfo() {
        return {
            name: 'Archer Tower',
            description: 'Fast-firing tower with good range but lower damage.',
            damage: '15',
            range: '140',
            fireRate: '1.5/sec',
            cost: 75
        };
    }
}
