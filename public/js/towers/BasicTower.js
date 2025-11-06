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
        // Get scaling info if available
        const scale = ctx.canvas.levelScale;
        let scaledX = this.x;
        let scaledY = this.y;
        let foundationSize = 30; // Half of 60px foundation
        let baseRadius = 20;
        let topRadius = 15;
        let coreRadius = 8;
        
        // Apply scaling to position and sizes if scale is available
        if (scale) {
            scaledX = this.x * scale.scaleX + scale.offsetX;
            scaledY = this.y * scale.scaleY + scale.offsetY;
            foundationSize = foundationSize * scale.scaleX;
            baseRadius = baseRadius * scale.scaleX;
            topRadius = topRadius * scale.scaleX;
            coreRadius = coreRadius * scale.scaleX;
        }
        
        // Tower foundation (2x2 area)
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(scaledX - foundationSize, scaledY - foundationSize, foundationSize * 2, foundationSize * 2);
        
        // Tower foundation border
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.strokeRect(scaledX - foundationSize, scaledY - foundationSize, foundationSize * 2, foundationSize * 2);
        
        // Tower base
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(scaledX, scaledY, baseRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Tower top
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(scaledX, scaledY, topRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Tower center core
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.arc(scaledX, scaledY, coreRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Range indicator (when targeting)
        if (this.target) {
            let targetX = this.target.x;
            let targetY = this.target.y;
            let rangeRadius = this.range;
            
            if (scale) {
                targetX = this.target.x * scale.scaleX + scale.offsetX;
                targetY = this.target.y * scale.scaleY + scale.offsetY;
                rangeRadius = this.range * scale.scaleX;
            }
            
            ctx.strokeStyle = 'rgba(76, 175, 80, 0.3)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(scaledX, scaledY, rangeRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Shooting line
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(scaledX, scaledY);
            ctx.lineTo(targetX, targetY);
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
