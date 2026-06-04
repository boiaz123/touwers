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

        // Offscreen canvas cache for the disabled overlay (redrawn at 20fps max)
        this._disabledOverlayCanvas = null;
        this._disabledOverlaySize = 0;
        this._disabledOverlayLastRenderTime = 0;
    }
    
    update(deltaTime, enemies) {
        const prevCooldown = this.cooldown;
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
                // Do not drop an out-of-range target on the exact frame the cooldown
                // triggers — the subclass fires this frame and needs the reference.
                // It will be cleared next frame if still out of range.
                const shotTriggeredThisFrame = prevCooldown > 0 && this.cooldown === 0;
                if (!shotTriggeredThisFrame && dx * dx + dy * dy > this.range * this.range) {
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
     * Predict where an enemy will be when a projectile can intercept it.
     * Uses the exact quadratic intercept formula so the aim is correct even
     * at high game speeds or with fast enemies:
     *   (dx + vx*t)^2 + (dy + vy*t)^2 = (P*t)^2
     * Solved for the smallest positive t, then predicted = enemy.pos + vel*t.
     */
    predictEnemyPosition(enemy, projectileSpeed) {
        if (!enemy) return null;
        
        // Calculate enemy velocity from the current path segment direction
        let velocityX = 0;
        let velocityY = 0;
        
        if (enemy.path && enemy.currentPathIndex < enemy.path.length - 1) {
            const currentPos = enemy.path[enemy.currentPathIndex];
            const nextPos = enemy.path[enemy.currentPathIndex + 1];
            
            const segDx = nextPos.x - currentPos.x;
            const segDy = nextPos.y - currentPos.y;
            const segLen = Math.hypot(segDx, segDy);
            
            if (segLen > 0) {
                velocityX = (segDx / segLen) * enemy.speed;
                velocityY = (segDy / segLen) * enemy.speed;
            }
        }
        
        // Stationary enemy — aim directly at current position
        if (velocityX === 0 && velocityY === 0) {
            return { x: enemy.x, y: enemy.y };
        }
        
        // Quadratic intercept: find t > 0 satisfying
        //   (dx + vx*t)^2 + (dy + vy*t)^2 = (P*t)^2
        // Rearranged: (vx^2 + vy^2 - P^2)*t^2 + 2*(dx*vx + dy*vy)*t + (dx^2 + dy^2) = 0
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const P = Math.max(projectileSpeed, 1);
        
        const a = velocityX * velocityX + velocityY * velocityY - P * P;
        const b = 2 * (dx * velocityX + dy * velocityY);
        const c = dx * dx + dy * dy;
        
        let t = 0;
        
        if (Math.abs(a) < 0.001) {
            // Projectile speed ≈ enemy speed — degenerate, use linear solution
            if (Math.abs(b) > 0.001) t = -c / b;
        } else {
            const discriminant = b * b - 4 * a * c;
            if (discriminant >= 0) {
                const sqrtD = Math.sqrt(discriminant);
                const t1 = (-b - sqrtD) / (2 * a);
                const t2 = (-b + sqrtD) / (2 * a);
                // Pick the smallest positive root
                if (t1 > 0 && t2 > 0) {
                    t = Math.min(t1, t2);
                } else if (t1 > 0) {
                    t = t1;
                } else if (t2 > 0) {
                    t = t2;
                }
            }
        }
        
        // Cap lookahead at 5 game-seconds to avoid wildly overshooting
        t = Math.max(0, Math.min(t, 5));
        
        return {
            x: enemy.x + velocityX * t,
            y: enemy.y + velocityY * t
        };
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
        const nowMs = Date.now();

        // Lazy-create offscreen canvas; invalidate if tower size changed
        const canvasSize = Math.ceil(towerSize * 4);
        if (!this._disabledOverlayCanvas || this._disabledOverlaySize !== canvasSize) {
            this._disabledOverlayCanvas = document.createElement('canvas');
            this._disabledOverlayCanvas.width = canvasSize;
            this._disabledOverlayCanvas.height = canvasSize;
            this._disabledOverlaySize = canvasSize;
            this._disabledOverlayLastRenderTime = 0;
        }

        // Redraw smoke/glow layers at 20fps — stutter is imperceptible for ambient effects
        if (nowMs - this._disabledOverlayLastRenderTime >= 50) {
            this._disabledOverlayLastRenderTime = nowMs;
            const oc = this._disabledOverlayCanvas.getContext('2d');
            const cx = canvasSize / 2;
            const cy = canvasSize / 2;
            const pulse = 0.5 + 0.5 * Math.sin(now * 2.0);
            const slowPulse = 0.5 + 0.5 * Math.sin(now * 0.8);
            const breathe = 0.5 + 0.5 * Math.sin(now * 1.2);

            oc.clearRect(0, 0, canvasSize, canvasSize);
            oc.save();

            // 1. Ground curse shadow
            oc.fillStyle = `rgba(18, 0, 42, ${0.52 + slowPulse * 0.18})`;
            oc.beginPath();
            oc.ellipse(cx, cy + half * 0.82, half * 1.25, half * 0.32, 0, 0, Math.PI * 2);
            oc.fill();

            // 2. Ground curse ring - 3 broken arcs in flat perspective, slowly rotating
            oc.save();
            oc.translate(cx, cy + half * 0.85);
            oc.scale(1, 0.28);
            oc.strokeStyle = `rgba(110, 0, 185, ${0.28 + slowPulse * 0.14})`;
            oc.lineWidth = 2.5;
            oc.lineCap = 'butt';
            const cRot = now * 0.28;
            for (let a = 0; a < 3; a++) {
                const aStart = cRot + a * (Math.PI * 2 / 3);
                oc.beginPath();
                oc.arc(0, 0, half * 1.15, aStart, aStart + Math.PI * 0.48);
                oc.stroke();
            }
            oc.restore();

            // 3. Dark fog layers - concentric low-opacity circles building depth
            oc.fillStyle = `rgba(38, 0, 78, ${0.10 + breathe * 0.06})`;
            oc.beginPath();
            oc.arc(cx, cy, half * 1.75, 0, Math.PI * 2);
            oc.fill();

            oc.fillStyle = `rgba(22, 0, 58, ${0.20 + breathe * 0.08})`;
            oc.beginPath();
            oc.arc(cx, cy, half * 1.25, 0, Math.PI * 2);
            oc.fill();

            oc.fillStyle = `rgba(14, 0, 38, ${0.34 + slowPulse * 0.12})`;
            oc.beginPath();
            oc.arc(cx, cy, half * 0.88, 0, Math.PI * 2);
            oc.fill();

            // 4. Smoke wisps - 5 organic curling tendrils rising from the tower
            oc.lineCap = 'round';
            for (let w = 0; w < 5; w++) {
                const wPhase = now * 0.55 + w * 1.2566; // 2pi/5 apart
                const sway = Math.sin(now * 1.1 + w * 2.3) * half * 0.28;

                const startX = cx + Math.sin(wPhase * 0.7) * half * 0.32;
                const startY = cy;
                const cpX = cx + Math.sin(wPhase * 1.4) * half * 0.48 + sway * 0.5;
                const cpY = cy - half * 0.95;
                const endX = cx + Math.cos(wPhase) * half * 0.55 + sway;
                const endY = cy - half * 1.85 - Math.abs(Math.sin(wPhase)) * half * 0.4;

                const wAlpha = 0.16 + 0.10 * Math.sin(now * 1.8 + w);

                oc.strokeStyle = `rgba(85, 0, 155, ${wAlpha})`;
                oc.lineWidth = 9 + Math.sin(now + w) * 3;
                oc.beginPath();
                oc.moveTo(startX, startY);
                oc.quadraticCurveTo(cpX, cpY, endX, endY);
                oc.stroke();

                oc.strokeStyle = `rgba(145, 25, 210, ${wAlpha * 0.65})`;
                oc.lineWidth = 2.5;
                oc.beginPath();
                oc.moveTo(startX, startY);
                oc.quadraticCurveTo(cpX, cpY, endX, endY);
                oc.stroke();
            }

            // 5. Drifting smoke particles floating upward
            for (let i = 0; i < 8; i++) {
                const pCycle = (now * 0.38 + i / 8) % 1.0;
                const pAngle = (i / 8) * Math.PI * 2 + now * 0.18 + i;
                const pRadius = half * (0.28 + Math.sin(i * 1.7) * 0.18);
                const px = cx + Math.cos(pAngle) * pRadius + Math.sin(now * 0.65 + i) * half * 0.14;
                const py = cy + Math.sin(pAngle * 0.5) * half * 0.28 - pCycle * half * 2.1;
                const pAlpha = Math.max(0, (1 - pCycle) * 0.36);
                const pSize = (2.5 + pCycle * 8) * (0.7 + 0.3 * Math.sin(i * 2.1));

                oc.fillStyle = `rgba(55, 0, 115, ${pAlpha})`;
                oc.beginPath();
                oc.arc(px, py, pSize, 0, Math.PI * 2);
                oc.fill();
            }

            // 6. Eerie glow at center
            oc.fillStyle = `rgba(95, 18, 175, ${0.09 + pulse * 0.06})`;
            oc.beginPath();
            oc.arc(cx, cy, half * 0.62, 0, Math.PI * 2);
            oc.fill();

            oc.strokeStyle = `rgba(125, 28, 195, ${0.22 + pulse * 0.18})`;
            oc.lineWidth = 1.5;
            oc.lineCap = 'butt';
            oc.beginPath();
            oc.arc(cx, cy, half * 0.90, 0, Math.PI * 2);
            oc.stroke();

            oc.restore();
        }

        // Blit cached smoke overlay to the world canvas
        ctx.drawImage(this._disabledOverlayCanvas, this.x - canvasSize / 2, this.y - canvasSize / 2, canvasSize, canvasSize);

        // 7. Countdown bar — rendered at full fps for smooth animation
        ctx.save();
        const pulse = 0.5 + 0.5 * Math.sin(now * 2.0);
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
