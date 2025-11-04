export class BasicTower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.range = 120;
        this.damage = 20;
        this.fireRate = 1; // shots per second
        this.cooldown = 0;
        this.target = null;
        this.size = 80; // Tower takes 2x2 grid cells (2 * 40px)
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
        
        // Tower base (stone foundation)
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(screenX - halfSize, screenY - halfSize, size, size);
        
        // Tower walls
        ctx.fillStyle = '#A0895F';
        ctx.fillRect(screenX - halfSize + 4 * scale, screenY - halfSize + 4 * scale, 
                    size - 8 * scale, size - 8 * scale);
        
        // Corner stones
        const cornerSize = 8 * scale;
        ctx.fillStyle = '#6B5B47';
        // Top-left corner
        ctx.fillRect(screenX - halfSize, screenY - halfSize, cornerSize, cornerSize);
        // Top-right corner
        ctx.fillRect(screenX + halfSize - cornerSize, screenY - halfSize, cornerSize, cornerSize);
        // Bottom-left corner
        ctx.fillRect(screenX - halfSize, screenY + halfSize - cornerSize, cornerSize, cornerSize);
        // Bottom-right corner
        ctx.fillRect(screenX + halfSize - cornerSize, screenY + halfSize - cornerSize, cornerSize, cornerSize);
        
        // Central keep
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 20 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Tower flag
        ctx.fillStyle = '#2E7D32';
        ctx.fillRect(screenX - 2 * scale, screenY - 35 * scale, 4 * scale, 15 * scale);
        
        // Flag
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.moveTo(screenX + 2 * scale, screenY - 35 * scale);
        ctx.lineTo(screenX + 15 * scale, screenY - 30 * scale);
        ctx.lineTo(screenX + 2 * scale, screenY - 25 * scale);
        ctx.fill();
        
        // Range indicator when targeting
        if (this.target) {
            ctx.strokeStyle = 'rgba(76, 175, 80, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.range * scale, 0, Math.PI * 2);
            ctx.stroke();
            
            // Shooting line to scaled target position
            const targetScreenX = this.target.x;
            const targetScreenY = this.target.y;
            
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
            ctx.lineWidth = 2 * scale;
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(targetScreenX, targetScreenY);
            ctx.stroke();
        }
    }
    
    static getInfo() {
        return {
            name: 'Basic Tower',
            description: 'A reliable defensive structure with moderate damage and range.',
            damage: '20',
            range: '120',
            fireRate: '1.0/sec',
            cost: 50
        };
    }
}
