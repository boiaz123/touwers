export class BasicEnemy {
    constructor(path, health = 100, speed = 50) {
        this.path = path;
        this.health = health;
        this.maxHealth = health;
        this.speed = speed;
        this.currentPathIndex = 0;
        
        // Ensure we have a valid starting position
        if (path && path.length > 0) {
            this.x = path[0].x;
            this.y = path[0].y;
        } else {
            console.error('Enemy created with invalid path:', path);
            this.x = 0;
            this.y = 0;
        }
        
        this.reachedEnd = false;
        
        console.log('Enemy created at:', this.x, this.y);
    }
    
    updatePath(newPath) {
        this.path = newPath;
        // Reset position to start of new path
        this.currentPathIndex = 0;
        this.x = newPath[0].x;
        this.y = newPath[0].y;
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
        // Enemy body
        ctx.fillStyle = '#F44336';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Health bar background
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - 15, this.y - 20, 30, 4);
        
        // Health bar
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : (healthPercent > 0.25 ? '#FFC107' : '#F44336');
        ctx.fillRect(this.x - 15, this.y - 20, 30 * healthPercent, 4);
    }
}
