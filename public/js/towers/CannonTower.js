export class CannonTower {
    constructor(x, y, gridX, gridY) {
        this.x = x;
        this.y = y;
        this.gridX = gridX;
        this.gridY = gridY;
        this.range = 100;
        this.damage = 50;
        this.fireRate = 0.5; // shots per second
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
        // Calculate tower size based on grid cell size (2x2 cells)
        const baseResolution = 1920;
        const scaleFactor = Math.max(0.5, Math.min(2.5, ctx.canvas.width / baseResolution));
        const cellSize = Math.floor(16 * scaleFactor);
        const towerSize = cellSize * 2;
        const radius = towerSize * 0.4;
        
        // Tower base
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Cannon barrel
        ctx.fillStyle = '#2F2F2F';
        const barrelWidth = radius * 0.33;
        const barrelHeight = radius * 1.33;
        ctx.fillRect(this.x - barrelWidth/2, this.y - barrelHeight*0.67, barrelWidth, barrelHeight);
        
        // Tower top
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius * 0.67, 0, Math.PI * 2);
        ctx.fill();
        
        // Range indicator
        if (this.target) {
            ctx.strokeStyle = 'rgba(139, 69, 19, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
            
            // Shooting line
            ctx.strokeStyle = 'rgba(255, 165, 0, 0.7)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
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
