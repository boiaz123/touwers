export class BasicEnemy {
    constructor(path, health = 100, speed = 50) {
        this.path = path;
        this.health = health;
        this.maxHealth = health;
        this.speed = speed;
        this.currentPathIndex = 0;
        this.x = path && path.length > 0 ? path[0].x : 0;
        this.y = path && path.length > 0 ? path[0].y : 0;
        this.reachedEnd = false;
        
        console.log('BasicEnemy: Created at position', this.x, this.y, 'with path length', path ? path.length : 0);
    }
    
    updatePath(newPath) {
        if (!newPath || newPath.length === 0) {
            console.warn('BasicEnemy: Received invalid path');
            return;
        }
        
        const oldPath = this.path;
        this.path = newPath;
        
        // Try to maintain relative position on the new path
        if (oldPath && oldPath.length > 0 && this.currentPathIndex < oldPath.length) {
            // Calculate progress along old path
            const totalOldSegments = oldPath.length - 1;
            const progressRatio = this.currentPathIndex / Math.max(1, totalOldSegments);
            
            // Apply same progress to new path
            const totalNewSegments = this.path.length - 1;
            this.currentPathIndex = Math.floor(progressRatio * totalNewSegments);
            this.currentPathIndex = Math.max(0, Math.min(this.currentPathIndex, this.path.length - 2));
            
            // Update position to nearest point on new path
            if (this.currentPathIndex < this.path.length) {
                this.x = this.path[this.currentPathIndex].x;
                this.y = this.path[this.currentPathIndex].y;
            }
        } else {
            // Reset to start of new path
            this.currentPathIndex = 0;
            this.x = this.path[0].x;
            this.y = this.path[0].y;
        }
        
        console.log('BasicEnemy: Path updated, now at index', this.currentPathIndex, 'position', this.x, this.y);
    }
    
    update(deltaTime) {
        if (this.reachedEnd || !this.path || this.path.length === 0) return;
        
        // Safety check for path index
        if (this.currentPathIndex >= this.path.length - 1) {
            this.reachedEnd = true;
            console.log('BasicEnemy: Reached end of path');
            return;
        }
        
        const target = this.path[this.currentPathIndex + 1];
        if (!target) {
            this.reachedEnd = true;
            console.log('BasicEnemy: No target waypoint, reached end');
            return;
        }
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.hypot(dx, dy);
        
        // Larger threshold for reaching waypoints to prevent getting stuck
        const reachThreshold = Math.max(5, this.speed * deltaTime * 2);
        
        if (distance < reachThreshold) {
            this.currentPathIndex++;
            // Snap to waypoint to prevent drift
            this.x = target.x;
            this.y = target.y;
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
        // Auto-scale enemy size based on canvas resolution
        const baseSize = Math.max(8, Math.min(20, ctx.canvas.width / 100));
        
        // Enemy body
        ctx.fillStyle = '#F44336';
        ctx.beginPath();
        ctx.arc(this.x, this.y, baseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Health bar background
        const barWidth = baseSize * 2.5;
        const barHeight = Math.max(2, baseSize * 0.3);
        const barY = this.y - baseSize - barHeight - 2;
        
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - barWidth/2, barY, barWidth, barHeight);
        
        // Health bar
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : (healthPercent > 0.25 ? '#FFC107' : '#F44336');
        ctx.fillRect(this.x - barWidth/2, barY, barWidth * healthPercent, barHeight);
    }
}
