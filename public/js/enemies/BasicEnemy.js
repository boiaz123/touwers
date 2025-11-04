export class BasicEnemy {
    constructor(path, health = 100, speed = 50) {
        this.path = path;
        this.health = health;
        this.maxHealth = health;
        this.speed = speed;
        this.currentPathIndex = 0;
        
        // Start at the first path point
        if (path && path.length > 0) {
            this.x = path[0].x;
            this.y = path[0].y;
        } else {
            this.x = 0;
            this.y = 0;
        }
        
        this.reachedEnd = false;
    }
    
    update(deltaTime) {
        if (this.reachedEnd || !this.path || this.path.length === 0) return;
        
        // Check if we've reached the end of the path
        if (this.currentPathIndex >= this.path.length - 1) {
            this.reachedEnd = true;
            return;
        }
        
        const target = this.path[this.currentPathIndex + 1];
        if (!target) {
            this.reachedEnd = true;
            return;
        }
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.hypot(dx, dy);
        
        // If we're close enough to the target, move to the next path point
        if (distance < 5) {
            this.currentPathIndex++;
            this.x = target.x;
            this.y = target.y;
            return;
        }
        
        // Move towards the target
        const moveDistance = this.speed * deltaTime;
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        
        this.x += normalizedDx * moveDistance;
        this.y += normalizedDy * moveDistance;
    }
    
    takeDamage(amount) {
        this.health -= amount;
    }
    
    isDead() {
        return this.health <= 0;
    }
    
    render(ctx) {
        // Enemy body
        ctx.fillStyle = '#F44336';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Enemy border
        ctx.strokeStyle = '#D32F2F';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Health bar background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(this.x - 15, this.y - 22, 30, 5);
        
        // Health bar
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.6 ? '#4CAF50' : 
                       healthPercent > 0.3 ? '#FFC107' : '#F44336';
        ctx.fillRect(this.x - 15, this.y - 22, 30 * healthPercent, 5);
        
        // Health bar border
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - 15, this.y - 22, 30, 5);
    }
}
