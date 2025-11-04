export class BasicTower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.range = 120;
        this.damage = 20;
        this.fireRate = 1; // shots per second
        this.cooldown = 0;
        this.target = null;
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
    
    render(ctx) {
        // Tower base
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Tower top
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Range indicator (when selected or debugging)
        if (this.target) {
            ctx.strokeStyle = 'rgba(76, 175, 80, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
            
            // Shooting line
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.target.x, this.target.y);
            ctx.stroke();
        }
    }
}
