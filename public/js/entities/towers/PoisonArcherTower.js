import { Tower } from './Tower.js';

export class PoisonArcherTower extends Tower {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY);
        this.range = 130;
        this.damage = 18;
        this.fireRate = 0.8;
        this.cooldown = 0;
        this.target = null;
        
        // Animation properties
        this.animationTime = 0;
        this.drawback = 0;
        this.poisonArrows = [];
        
        // Poison state tracking - track which enemies are poisoned to avoid creating duplicate splatters
        this.poisonedEnemies = new Map(); // Map of enemy -> { duration, baseDamage, tickTimer }
        
        // Create compact cover elements within 2x2 grid (64x64 area)
        this.coverElements = this.generateCoverElements(gridX, gridY);
        
        // Ranger position in center between bushes - initialize BEFORE archerPosition
        this.rangerSpot = {
            x: this.x + ((gridX % 2) - 0.5) * 4,
            y: this.y + ((gridY % 2) - 0.5) * 4
        };
        
        // Initialize archer position to rangerSpot, hidden until target acquired
        this.archerPosition = {
            x: this.rangerSpot.x,
            y: this.rangerSpot.y,
            hidden: true
        };
    }
    
    /**
     * Pre-generate cover elements (bushes) with cached rendering data
     * Optimized to avoid recalculation every frame
     */
    generateCoverElements(gridX, gridY) {
        const coverElements = [];
        const positions = [
            { x: this.x - 15, y: this.y - 15 },
            { x: this.x + 15, y: this.y - 15 },
            { x: this.x - 15, y: this.y + 15 },
            { x: this.x + 15, y: this.y + 15 }
        ];
        
        positions.forEach((pos, i) => {
            const baseSize = 18 + (i * 2); // Deterministic size variation
            const element = {
                x: pos.x,
                y: pos.y,
                type: 'bush',
                size: baseSize,
                rustleOffset: i * 0.5,
                pattern: (i * 1.2),
                branchPattern: (i * 0.3),
                branches: [],
                leafClusters: []
            };
            
            // Pre-generate branch data
            for (let j = 0; j < 5; j++) {
                const angle = (j / 5) * Math.PI * 2 + element.pattern;
                const branchLength = baseSize * (0.4 + (j % 3) * 0.1);
                element.branches.push({
                    angle: angle,
                    length: branchLength,
                    subBranches: [
                        { angle: angle - 0.3, length: branchLength * 0.5 },
                        { angle: angle, length: branchLength * 0.5 },
                        { angle: angle + 0.3, length: branchLength * 0.5 }
                    ]
                });
            }
            
            // Pre-generate leaf cluster data
            for (let j = 0; j < 8; j++) {
                const angle = (j / 8) * Math.PI * 2 + element.pattern;
                const distance = baseSize * (0.5 + (j % 3) * 0.2);
                element.leafClusters.push({
                    angle: angle,
                    distance: distance,
                    color: j % 3 === 0 ? '#228B22' : '#32CD32'
                });
            }
            
            coverElements.push(element);
        });
        
        return coverElements;
    }
    
    update(deltaTime, enemies, towerForgeBonus = 0) {
        this.cooldown = Math.max(0, this.cooldown - deltaTime);
        this.animationTime += deltaTime;
        this.drawback = Math.max(0, this.drawback - deltaTime * 3);
        
        this.target = this.findTarget(enemies);
        
        // Update archer visibility based on target
        this.archerPosition.hidden = !this.target;
        
        // Only shoot if we have a valid target and proper positioning
        if (this.target && this.cooldown === 0 && !this.archerPosition.hidden) {
            this.shoot();
            this.cooldown = 1 / this.fireRate;
        }
        
        // Update poison arrows - SINGLE TARGET HIT
        this.poisonArrows = this.poisonArrows.filter(arrow => {
            arrow.x += arrow.vx * deltaTime;
            arrow.y += arrow.vy * deltaTime;
            arrow.vy += 180 * deltaTime; // Gravity
            arrow.life -= deltaTime;
            arrow.rotation = Math.atan2(arrow.vy, arrow.vx);
            
            // Check if arrow hits target area (within 15px of target position)
            if (arrow.life <= 0 || Math.hypot(arrow.x - arrow.targetX, arrow.y - arrow.targetY) < 15) {
                // Only poison the intended target - find closest enemy to impact point
                let hitTarget = null;
                let minDist = 20; // Only hit if very close
                
                for (const enemy of enemies) {
                    const dist = Math.hypot(enemy.x - arrow.x, enemy.y - arrow.y);
                    if (dist < minDist) {
                        minDist = dist;
                        hitTarget = enemy;
                    }
                }
                
                // Apply poison only to the hit target
                if (hitTarget) {
                    this.applyPoisonToEnemy(hitTarget, towerForgeBonus);
                }
                
                return false; // Remove arrow
            }
            return true;
        });
        
        // Update poison effects on enemies - HIGHLY OPTIMIZED
        // Skip entirely if no poisoned enemies (early exit)
        if (this.poisonedEnemies.size === 0) return;
        
        // Single pass: check duration and apply damage at tick times
        for (const [enemy, state] of this.poisonedEnemies) {
            // Direct health check
            if (enemy.health <= 0) {
                this.poisonedEnemies.delete(enemy);
                continue;
            }
            
            // Decrement duration once per frame
            state.duration -= deltaTime;
            if (state.duration <= 0) {
                this.poisonedEnemies.delete(enemy);
                continue;
            }
            
            // Use timestamp-based ticking instead of decrementing timer
            // Avoids float arithmetic every frame - only check elapsed time
            state.elapsedSinceTick += deltaTime;
            if (state.elapsedSinceTick >= 2.0) {
                const poisonDamage = state.baseDamage + towerForgeBonus;
                enemy.takeDamage(poisonDamage, 0, 'poison', true);
                state.elapsedSinceTick -= 2.0; // Reset for next tick
            }
        }
    }
    
    applyPoisonToEnemy(enemy, towerForgeBonus = 0) {
        const basePoisonDamage = 1;
        const poisonDuration = 20.0;
        
        // Refresh poison if already applied, or create new poison effect
        if (this.poisonedEnemies.has(enemy)) {
            const state = this.poisonedEnemies.get(enemy);
            state.duration = poisonDuration;
        } else {
            this.poisonedEnemies.set(enemy, {
                duration: poisonDuration,
                baseDamage: basePoisonDamage,
                elapsedSinceTick: 0 // Damage immediately on first tick
            });
        }
    }
    
    shoot() {
        if (!this.target) return;
        
        this.drawback = 1;
        
        // Play attack sound
        if (this.audioManager) {
            this.audioManager.playSFX('poison-tower');
        }
        
        // Predict where the target will be
        const arrowSpeed = 350;
        const predicted = this.predictEnemyPosition(this.target, arrowSpeed);
        
        // Ensure archer position is valid - use rangerSpot as fallback
        const startX = this.archerPosition.x || this.rangerSpot.x;
        const startY = this.archerPosition.y || this.rangerSpot.y;
        
        const dx = predicted.x - startX;
        const dy = predicted.y - startY;
        const distance = Math.hypot(dx, dy);
        const arcHeight = distance * 0.08;
        
        // Only create arrow if distance is reasonable (avoid zero-distance or invalid arrows)
        if (distance > 10) {
            this.poisonArrows.push({
                x: startX,
                y: startY,
                vx: (dx / distance) * arrowSpeed,
                vy: (dy / distance) * arrowSpeed - arcHeight,
                rotation: Math.atan2(dy, dx),
                life: distance / Math.max(arrowSpeed, 1) + 0.5,
                targetX: predicted.x,
                targetY: predicted.y
            });
        }
    }
    
    render(ctx) {
        // Render cover elements (bushes)
        this.renderCoverElements(ctx);
        
        // Render ranger archer - skip if no target
        if (this.target) {
            this.renderArcher(ctx);
        }
        
        // Render flying poison arrows - only if arrows exist
        if (this.poisonArrows.length > 0) {
            this.renderArrows(ctx);
        }
        
        // Render range indicator and markers
        this.renderIndicators(ctx);
    }
    
    renderCoverElements(ctx) {
        this.coverElements.forEach((element) => {
            ctx.save();
            ctx.translate(element.x, element.y);
            
            const rustleAmount = Math.sin(this.animationTime * 1.5 + element.rustleOffset) * 0.02;
            ctx.rotate(rustleAmount);
            
            // Bush shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.arc(2, 2, element.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Trunk
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, element.size * 0.7);
            ctx.lineTo(0, -element.size * 0.3);
            ctx.stroke();
            
            // Branches with cached data
            element.branches.forEach(branch => {
                const branchX = Math.cos(branch.angle) * branch.length;
                const branchY = Math.sin(branch.angle) * branch.length;
                
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(branchX, branchY);
                ctx.stroke();
                
                // Sub-branches
                ctx.lineWidth = 1;
                branch.subBranches.forEach(subBranch => {
                    const subX = branchX + Math.cos(subBranch.angle) * subBranch.length;
                    const subY = branchY + Math.sin(subBranch.angle) * subBranch.length;
                    
                    ctx.beginPath();
                    ctx.moveTo(branchX, branchY);
                    ctx.lineTo(subX, subY);
                    ctx.stroke();
                });
                ctx.lineWidth = 2;
            });
            
            // Leaf clusters
            element.leafClusters.forEach((cluster) => {
                const leafX = Math.cos(cluster.angle) * cluster.distance;
                const leafY = Math.sin(cluster.angle) * cluster.distance;
                
                ctx.fillStyle = cluster.color;
                ctx.beginPath();
                ctx.arc(leafX, leafY, element.size * 0.2, 0, Math.PI * 2);
                ctx.fill();
                
                // Individual leaves
                for (let k = 0; k < 5; k++) {
                    const leafAngle = (k / 5) * Math.PI * 2;
                    const leafDist = element.size * 0.15;
                    const lx = leafX + Math.cos(leafAngle) * leafDist;
                    const ly = leafY + Math.sin(leafAngle) * leafDist;
                    
                    ctx.fillStyle = '#2F5F2F';
                    ctx.beginPath();
                    ctx.ellipse(lx, ly, 3, 6, leafAngle, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            
            // Dense foliage base
            ctx.fillStyle = '#1F4F1F';
            ctx.beginPath();
            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                const radius = element.size * (0.6 + Math.sin(angle * 4) * 0.2);
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        });
    }
    
    renderArcher(ctx) {
        if (this.archerPosition.hidden || !this.target) return;
        
        ctx.save();
        ctx.translate(this.archerPosition.x, this.archerPosition.y);
        
        // Ranger shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(1, 3, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Crouched stance
        ctx.save();
        ctx.scale(1, 0.8);
        
        // Legs
        ctx.fillStyle = '#654321';
        ctx.fillRect(-3, 2, 2, 8);
        ctx.fillRect(1, 2, 2, 8);
        
        // Body (forest cloak)
        ctx.fillStyle = '#2F4F2F';
        ctx.fillRect(-4, -2, 8, 8);
        
        // Arms
        ctx.fillStyle = '#654321';
        ctx.fillRect(-6, -1, 2, 6);
        ctx.fillRect(4, -1, 2, 6);
        
        // Hood
        ctx.fillStyle = '#1F3F1F';
        ctx.beginPath();
        ctx.arc(0, -4, 5, 0, Math.PI);
        ctx.fill();
        
        // Face
        ctx.fillStyle = 'rgba(221, 190, 169, 0.7)';
        ctx.beginPath();
        ctx.arc(0, -3, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Glowing eyes
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(-1.5, -4, 1, 1);
        ctx.fillRect(0.5, -4, 1, 1);
        
        ctx.restore();
        
        // Bow and aiming
        const aimAngle = Math.atan2(this.target.y - this.archerPosition.y, this.target.x - this.archerPosition.x);
        ctx.rotate(aimAngle);
        
        // Longbow
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(10, 0, 8, -0.6, 0.6);
        ctx.stroke();
        
        // Bow string
        ctx.strokeStyle = '#F5F5DC';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(10 + 6, -5);
        ctx.lineTo(this.drawback > 0 ? 10 - this.drawback * 5 : 10 + 6, 0);
        ctx.lineTo(10 + 6, 5);
        ctx.stroke();
        
        // Arrow when drawing
        if (this.drawback > 0) {
            const arrowX = 10 - this.drawback * 5;
            
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(arrowX, 0);
            ctx.lineTo(arrowX - 12, 0);
            ctx.stroke();
            
            // Poison tip
            ctx.fillStyle = '#32CD32';
            ctx.beginPath();
            ctx.moveTo(arrowX - 12, 0);
            ctx.lineTo(arrowX - 15, -2);
            ctx.lineTo(arrowX - 15, 2);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    renderArrows(ctx) {
        this.poisonArrows.forEach(arrow => {
            ctx.save();
            ctx.translate(arrow.x, arrow.y);
            ctx.rotate(arrow.rotation);
            
            // Arrow shaft
            ctx.strokeStyle = 'rgba(139, 69, 19, 0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-12, 0);
            ctx.lineTo(6, 0);
            ctx.stroke();
            
            // Poison-tipped arrow head (bright green)
            ctx.fillStyle = 'rgba(50, 205, 50, 0.95)';
            ctx.beginPath();
            ctx.moveTo(6, 0);
            ctx.lineTo(2, -2);
            ctx.lineTo(2, 2);
            ctx.closePath();
            ctx.fill();
            
            // Arrow fletching
            ctx.strokeStyle = 'rgba(34, 139, 34, 0.9)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-12, -1);
            ctx.lineTo(-8, -3);
            ctx.moveTo(-12, 1);
            ctx.lineTo(-8, 3);
            ctx.stroke();
            
            ctx.restore();
        });
    }
    
    renderIndicators(ctx) {
        // Tower center marker
        ctx.fillStyle = 'rgba(101, 67, 33, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Render attack radius circle if selected
        this.renderAttackRadiusCircle(ctx);
    }
    
    static getInfo() {
        return {
            name: 'Poison Archer',
            description: 'Ranger shoots poison arrows that create toxic clouds, dealing damage over time.',
            damage: '0 direct + 4 DoT/sec',
            range: '130',
            fireRate: '0.8/sec',
            cost: 120,
            icon: '🌿'
        };
    }
}
