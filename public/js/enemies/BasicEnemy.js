export class BasicEnemy {
    constructor(path, health = 100, speed = 50) {
        this.path = path;
        this.health = health;
        this.maxHealth = health;
        this.speed = speed;
        this.currentPathIndex = 0;
        this.x = path[0].x;
        this.y = path[0].y;
        this.reachedEnd = false;
    }
    
    update(deltaTime) {
        if (this.reachedEnd) return;
        
        const target = this.path[this.currentPathIndex + 1];
        if (!target) {
            this.reachedEnd = true;
            return;
        }
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance < 5) {
            this.currentPathIndex++;
            return;
        }
        
        const moveDistance = this.speed * deltaTime;
        this.x += (dx / distance) * moveDistance;
        this.y += (dy / distance) * moveDistance;
    }
    
    takeDamage(amount) {
        this.health -= amount;
    }
    
    isDead() {
        return this.health <= 0;
    }
    
    render(ctx) {
        // Get scaling info if available
        const scale = ctx.canvas.levelScale;
        let scaledX = this.x;
        let scaledY = this.y;
        let enemyRadius = 12;
        let healthBarWidth = 30;
        let healthBarHeight = 4;
        let healthBarOffset = 20;
        
        // Apply scaling to position and sizes if scale is available
        if (scale) {
            scaledX = this.x * scale.scaleX + scale.offsetX;
            scaledY = this.y * scale.scaleY + scale.offsetY;
            enemyRadius = enemyRadius * scale.scaleX;
            healthBarWidth = healthBarWidth * scale.scaleX;
            healthBarHeight = healthBarHeight * scale.scaleY;
            healthBarOffset = healthBarOffset * scale.scaleY;
        }
        
        // Enemy body
        ctx.fillStyle = '#F44336';
        ctx.beginPath();
        ctx.arc(scaledX, scaledY, enemyRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Health bar background
        ctx.fillStyle = '#000';
        ctx.fillRect(scaledX - healthBarWidth/2, scaledY - healthBarOffset, healthBarWidth, healthBarHeight);
        
        // Health bar
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : (healthPercent > 0.25 ? '#FFC107' : '#F44336');
        ctx.fillRect(scaledX - healthBarWidth/2, scaledY - healthBarOffset, healthBarWidth * healthPercent, healthBarHeight);
    }
}
