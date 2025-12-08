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

    /**
     * Predict where an enemy will be at a given time
     * Used for accurate tower shooting at moving targets
     */
    predictEnemyPosition(enemy, projectileSpeed) {
        if (!enemy) return null;
        
        // If enemy has no velocity, return current position
        if (!enemy.vx && !enemy.vy) {
            return { x: enemy.x, y: enemy.y };
        }
        
        // Calculate the time it will take for projectile to reach enemy
        // Using distance = sqrt((targetX - x)^2 + (targetY - y)^2) = speed * time
        // This is an iterative approximation
        let predictedX = enemy.x;
        let predictedY = enemy.y;
        
        // Simple prediction: assume enemy continues in current direction
        // Get approximate velocity from enemy movement
        const dx = (enemy.vx || 0);
        const dy = (enemy.vy || 0);
        const enemySpeed = Math.hypot(dx, dy);
        
        // Distance from tower to enemy
        const distToEnemy = Math.hypot(enemy.x - this.x, enemy.y - this.y);
        
        // Time for projectile to reach
        const timeToReach = distToEnemy / Math.max(projectileSpeed, 1);
        
        // Where the enemy will be by then
        predictedX = enemy.x + dx * timeToReach;
        predictedY = enemy.y + dy * timeToReach;
        
        return { x: predictedX, y: predictedY };
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

    /**
     * Render the attack radius circle - only shown when tower is selected
     */
    renderAttackRadiusCircle(ctx, color = 'rgba(100, 200, 100, 0.3)') {
        if (this.isSelected) {
            ctx.strokeStyle = 'rgba(100, 200, 100, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw a dashed circle for better visibility
            ctx.strokeStyle = 'rgba(100, 200, 100, 0.4)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]); // Reset line dash
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
            cost: 0,
            icon: '🏰'
        };
    }
}
