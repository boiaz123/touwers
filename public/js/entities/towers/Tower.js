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

        // Disabled state (applied by mage enemy blockade spell)
        this.isDisabled = false;
        this.disabledTimer = 0;
    }
    
    update(deltaTime, enemies) {
        this.cooldown = Math.max(0, this.cooldown - deltaTime);
        this.animationTime += deltaTime;

        // Handle disabled state (mage blockade spell)
        if (this.isDisabled) {
            this.disabledTimer -= deltaTime;
            if (this.disabledTimer <= 0) {
                this.isDisabled = false;
                this.disabledTimer = 0;
            }
            this.target = null;
            return;
        }

        // OPTIMIZATION: Only rescan enemies when needed
        // Keep current target if still alive and in range
        if (this.target) {
            if (this.target.health <= 0 || this.target.reachedEnd) {
                this.target = null;
            } else {
                const dx = this.target.x - this.x;
                const dy = this.target.y - this.y;
                if (dx * dx + dy * dy > this.range * this.range) {
                    this.target = null;
                }
            }
        }
        
        // Only scan for new target if we don't have one
        if (!this.target) {
            this.target = this.findTarget(enemies);
        }
    }
    
    findTarget(enemies) {
        // OPTIMIZATION: Use spatial grid for fast range queries when available
        const grid = this._spatialGrid;
        if (grid) {
            const count = grid.query(this.x, this.y, this.range);
            const buf = grid._queryBuf;
            let closest = null;
            let closestDistSq = this.range * this.range;
            for (let i = 0; i < count; i++) {
                const enemy = buf[i];
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < closestDistSq) {
                    closest = enemy;
                    closestDistSq = distSq;
                }
            }
            return closest;
        }
        
        // Fallback: linear scan of all enemies
        let closest = null;
        let closestDistSq = this.range * this.range;
        
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < closestDistSq) {
                closest = enemy;
                closestDistSq = distSq;
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
    
    renderDisabledOverlay(ctx) {
        const towerSize = this.getTowerSize(ctx);
        const half = towerSize / 2;
        const now = Date.now() / 1000;
        const pulse = 0.5 + 0.5 * Math.sin(now * 2.0);
        const slowPulse = 0.5 + 0.5 * Math.sin(now * 0.8);
        const breathe = 0.5 + 0.5 * Math.sin(now * 1.2);

        ctx.save();

        // 1. Ground curse shadow - flat ellipse pooling beneath the tower
        ctx.fillStyle = `rgba(18, 0, 42, ${0.52 + slowPulse * 0.18})`;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + half * 0.82, half * 1.25, half * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Ground curse ring - 3 broken arcs in flat perspective, slowly rotating
        ctx.save();
        ctx.translate(this.x, this.y + half * 0.85);
        ctx.scale(1, 0.28);
        ctx.strokeStyle = `rgba(110, 0, 185, ${0.28 + slowPulse * 0.14})`;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'butt';
        const cRot = now * 0.28;
        for (let a = 0; a < 3; a++) {
            const aStart = cRot + a * (Math.PI * 2 / 3);
            ctx.beginPath();
            ctx.arc(0, 0, half * 1.15, aStart, aStart + Math.PI * 0.48);
            ctx.stroke();
        }
        ctx.restore();

        // 3. Dark fog layers - concentric low-opacity circles building depth
        ctx.fillStyle = `rgba(38, 0, 78, ${0.10 + breathe * 0.06})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, half * 1.75, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(22, 0, 58, ${0.20 + breathe * 0.08})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, half * 1.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(14, 0, 38, ${0.34 + slowPulse * 0.12})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, half * 0.88, 0, Math.PI * 2);
        ctx.fill();

        // 4. Smoke wisps - 5 organic curling tendrils rising from the tower
        ctx.lineCap = 'round';
        for (let w = 0; w < 5; w++) {
            const wPhase = now * 0.55 + w * 1.2566; // 2pi/5 apart
            const sway = Math.sin(now * 1.1 + w * 2.3) * half * 0.28;

            const startX = this.x + Math.sin(wPhase * 0.7) * half * 0.32;
            const startY = this.y;
            const cpX = this.x + Math.sin(wPhase * 1.4) * half * 0.48 + sway * 0.5;
            const cpY = this.y - half * 0.95;
            const endX = this.x + Math.cos(wPhase) * half * 0.55 + sway;
            const endY = this.y - half * 1.85 - Math.abs(Math.sin(wPhase)) * half * 0.4;

            const wAlpha = 0.16 + 0.10 * Math.sin(now * 1.8 + w);

            // Soft outer glow of wisp
            ctx.strokeStyle = `rgba(85, 0, 155, ${wAlpha})`;
            ctx.lineWidth = 9 + Math.sin(now + w) * 3;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(cpX, cpY, endX, endY);
            ctx.stroke();

            // Brighter inner core
            ctx.strokeStyle = `rgba(145, 25, 210, ${wAlpha * 0.65})`;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(cpX, cpY, endX, endY);
            ctx.stroke();
        }

        // 5. Drifting smoke particles floating upward
        for (let i = 0; i < 8; i++) {
            const pCycle = (now * 0.38 + i / 8) % 1.0;
            const pAngle = (i / 8) * Math.PI * 2 + now * 0.18 + i;
            const pRadius = half * (0.28 + Math.sin(i * 1.7) * 0.18);
            const px = this.x + Math.cos(pAngle) * pRadius + Math.sin(now * 0.65 + i) * half * 0.14;
            const py = this.y + Math.sin(pAngle * 0.5) * half * 0.28 - pCycle * half * 2.1;
            const pAlpha = Math.max(0, (1 - pCycle) * 0.36);
            const pSize = (2.5 + pCycle * 8) * (0.7 + 0.3 * Math.sin(i * 2.1));

            ctx.fillStyle = `rgba(55, 0, 115, ${pAlpha})`;
            ctx.beginPath();
            ctx.arc(px, py, pSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // 6. Faint eerie glow at center — curse energy emanating from within
        ctx.fillStyle = `rgba(95, 18, 175, ${0.09 + pulse * 0.06})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, half * 0.62, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(125, 28, 195, ${0.22 + pulse * 0.18})`;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'butt';
        ctx.beginPath();
        ctx.arc(this.x, this.y, half * 0.90, 0, Math.PI * 2);
        ctx.stroke();

        // 7. Countdown indicator — thin bar, subtle
        const barW = towerSize * 0.62;
        const barH = 3;
        const barX = this.x - barW / 2;
        const barY = this.y - half - 9;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
        ctx.fillRect(barX, barY, barW, barH);
        const ratio = Math.max(0, this.disabledTimer / 5);
        ctx.fillStyle = `rgba(140, 28, 205, ${0.78 + pulse * 0.22})`;
        ctx.fillRect(barX, barY, barW * ratio, barH);
        if (ratio > 0.02) {
            ctx.fillStyle = 'rgba(205, 120, 255, 0.82)';
            ctx.fillRect(barX + barW * ratio - 2, barY, 2, barH);
        }

        ctx.restore();
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
            icon: ''
        };
    }
}
