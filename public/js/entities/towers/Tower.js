export class Tower {
    constructor(x, y, gridX, gridY) {
        this.x = x;
        this.y = y;
        this.gridX = gridX;
        this.gridY = gridY;
        this.type = null; // Will be set by TowerRegistry when creating
        
        // Tower stats - all measured in base units, not pixels
        // These stay constant across all resolutions
        this.range = 120; // pixels at base resolution = 3.75 grid cells
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
     * Accounts for enemy movement along path at various game speeds
     */
    predictEnemyPosition(enemy, projectileSpeed) {
        if (!enemy) return null;
        
        // Enemies move along a path, calculate their velocity based on path and speed
        let velocityX = 0;
        let velocityY = 0;
        
        if (enemy.path && enemy.currentPathIndex < enemy.path.length - 1) {
            const currentPos = enemy.path[enemy.currentPathIndex];
            const nextPos = enemy.path[enemy.currentPathIndex + 1];
            
            const dx = nextPos.x - currentPos.x;
            const dy = nextPos.y - currentPos.y;
            const distance = Math.hypot(dx, dy);
            
            if (distance > 0) {
                // Velocity is enemy.speed in the direction of the next waypoint
                const direction = enemy.speed / distance;
                velocityX = dx * direction;
                velocityY = dy * direction;
            }
        }
        
        // If no velocity calculated, return current position
        const enemySpeed = Math.hypot(velocityX, velocityY);
        if (enemySpeed === 0) {
            return { x: enemy.x, y: enemy.y };
        }
        
        // Calculate time for projectile to reach enemy at current distance
        const distToEnemy = Math.hypot(enemy.x - this.x, enemy.y - this.y);
        const timeToReach = distToEnemy / Math.max(projectileSpeed, 1);
        
        // Predict where enemy will be after timeToReach seconds
        const predictedX = enemy.x + velocityX * timeToReach;
        const predictedY = enemy.y + velocityY * timeToReach;
        
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
        // Use ResolutionManager if available (attached to canvas/ctx during initialization)
        if (ctx.resolutionManager) {
            return ctx.resolutionManager.cellSize * 2;
        }
        
        // Fallback: manual calculation (same logic as ResolutionManager)
        const baseResolution = 1920;
        const scaleFactor = Math.max(0.5, Math.min(2.5, ctx.canvas.width / baseResolution));
        const cellSize = Math.floor(32 * scaleFactor);
        return cellSize * 2;
    }
    
    /**
     * Get cell size from resolution manager
     * Useful for positioning and sizing calculations
     */
    getCellSize(ctx) {
        if (ctx.resolutionManager) {
            return ctx.resolutionManager.cellSize;
        }
        const baseResolution = 1920;
        const scaleFactor = Math.max(0.5, Math.min(2.5, ctx.canvas.width / baseResolution));
        return Math.floor(32 * scaleFactor);
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
