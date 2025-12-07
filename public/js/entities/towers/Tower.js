export class Tower {
    constructor(x, y, gridX, gridY) {
        this.x = x;
        this.y = y;
        this.gridX = gridX;
        this.gridY = gridY;
        this.range = 120;
        this.damage = 20;
        this.fireRate = 1;
        this.cooldown = 0;
        this.target = null;
        this.isSelected = false;
        this.animationTime = 0;
        
        // Upgrade tracking
        this.originalDamage = null;
        this.originalRange = null;
        this.originalFireRate = null;
    }
    
    update(deltaTime, enemies) {
        this.cooldown = Math.max(0, this.cooldown - deltaTime);
        this.animationTime += deltaTime;
        this.target = this.findTarget(enemies);
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
        // Override in subclass
    }
    
    render(ctx) {
        // Override in subclass
    }
    
    renderRangeIndicator(ctx, color = 'rgba(139, 69, 19, 0.2)') {
        if (this.target) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    getTowerSize(ctx) {
        const baseResolution = 1920;
        const scaleFactor = Math.max(0.5, Math.min(2.5, ctx.canvas.width / baseResolution));
        const cellSize = Math.floor(32 * scaleFactor);
        return cellSize * 2;
    }
    
    static getInfo() {
        return {
            name: 'Tower',
            description: 'Base tower',
            cost: 0
        };
    }
}
