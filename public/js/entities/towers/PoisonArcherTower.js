import { Tower } from './Tower.js';
import { ObjectPool } from '../../core/ObjectPool.js';

export class PoisonArcherTower extends Tower {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY);
        this.range = 130;
        this.damage = 10;
        this.fireRate = 0.25;
        this.cooldown = 0;
        this.target = null;
        
        // Animation properties
        this.animationTime = 0;
        this.drawback = 0;
        this.poisonArrows = [];
        // Phase 5: reuse arrow objects across shots instead of allocating a fresh literal
        // every time - acquire() in shoot(), release() once an arrow is dropped from the
        // compaction loop below.
        this._poisonArrowPool = new ObjectPool(() => ({
            x: 0, y: 0, vx: 0, vy: 0, rotation: 0, life: 0,
            targetX: 0, targetY: 0, target: null, fallbackX: 0, fallbackY: 0
        }));
        
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

        // Set by TowerRenderAdapter once it has baked/synced this tower via Pixi (arrows/
        // indicators still draw here regardless - not migrated yet). No static structure
        // exists for this tower (camouflage bushes + hidden archer only), so
        // renderStaticBack/Front are no-ops and everything lives in renderDynamicParts.
        this.skipCanvas2DBodyRender = false;
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
        const prevCooldown = this.cooldown;
        this.cooldown = Math.max(0, this.cooldown - deltaTime);
        this.animationTime += deltaTime;
        this.drawback = Math.max(0, this.drawback - deltaTime * 3);

        // Handle disabled state (mage/frog king blockade spell). This tower doesn't call
        // super.update() - it fully reimplements targeting/shooting below instead of relying
        // on Tower.js's base update() - so it never inherited the disabled-timer countdown
        // every other tower type gets from there. Without this, isDisabled/disabledTimer set
        // externally by the spell (MageEnemy.js) just sat frozen and this tower kept firing
        // as if unaffected, with the disabled overlay stuck on-screen forever.
        if (this.isDisabled) {
            this.disabledTimer -= deltaTime;
            if (this.disabledTimer <= 0) {
                this.isDisabled = false;
                this.disabledTimer = 0;
            }
            this.target = null;
            this.archerPosition.hidden = true;
        } else {
            // OPTIMIZATION: Only rescan if current target is dead/gone/out-of-range/already poisoned
            if (this.target) {
                if (this.target.health <= 0 || this.target.reachedEnd) {
                    this.target = null;
                } else {
                    const dx = this.target.x - this.x;
                    const dy = this.target.y - this.y;
                    // Keep target on the exact frame a shot triggers (matches Tower.update behaviour)
                    const shotTriggeredThisFrame = prevCooldown > 0 && this.cooldown === 0;
                    const range = this.effectiveRange ?? this.range;
                    const outOfRange = !shotTriggeredThisFrame && dx * dx + dy * dy > range * range;
                    // Once the current target is poisoned, re-scan so a fresh, unpoisoned
                    // enemy gets prioritized instead of wasting shots on a target already ticking.
                    const alreadyPoisoned = !shotTriggeredThisFrame && this.poisonedEnemies.has(this.target);
                    if (outOfRange || alreadyPoisoned) {
                        this.target = null;
                    }
                }
            }
            if (!this.target) {
                this.target = this.findTarget(enemies);
            }

            // Update archer visibility based on target
            this.archerPosition.hidden = !this.target;

            // Only shoot if we have a valid target and proper positioning
            if (this.target && this.cooldown === 0 && !this.archerPosition.hidden) {
                this.shoot();
                this.cooldown = 1 / this.fireRate;
            }
        }

        // Update poison arrows (compact in-place)
        let paWrite = 0;
        for (let ai = 0; ai < this.poisonArrows.length; ai++) {
            const arrow = this.poisonArrows[ai];
            arrow.x += arrow.vx * deltaTime;
            arrow.y += arrow.vy * deltaTime;
            arrow.vy += 180 * deltaTime; // Gravity
            arrow.life -= deltaTime;
            arrow.rotation = Math.atan2(arrow.vy, arrow.vx);
            
            let targetX = arrow.targetX;
            let targetY = arrow.targetY;
            if (arrow.target) {
                targetX = arrow.target.x;
                targetY = arrow.target.y;
            } else if (arrow.fallbackX != null) {
                targetX = arrow.fallbackX;
                targetY = arrow.fallbackY;
            }
            
            if (arrow.life <= 0 || Math.hypot(arrow.x - targetX, arrow.y - targetY) < 15) {
                let hitTarget = null;
                let minDistSq = 400; // 20^2
                
                // OPTIMIZATION: Use spatial grid for arrow-enemy collision
                if (this._spatialGrid) {
                    const grid = this._spatialGrid;
                    const count = grid.query(arrow.x, arrow.y, 20);
                    const buf = grid._queryBuf;
                    for (let ei = 0; ei < count; ei++) {
                        const enemy = buf[ei];
                        const dx = enemy.x - arrow.x;
                        const dy = enemy.y - arrow.y;
                        const distSq = dx * dx + dy * dy;
                        if (distSq < minDistSq) {
                            minDistSq = distSq;
                            hitTarget = enemy;
                        }
                    }
                } else {
                    for (let ei = 0; ei < enemies.length; ei++) {
                        const enemy = enemies[ei];
                        const dx = enemy.x - arrow.x;
                        const dy = enemy.y - arrow.y;
                        const distSq = dx * dx + dy * dy;
                        if (distSq < minDistSq) {
                            minDistSq = distSq;
                            hitTarget = enemy;
                        }
                    }
                }
                
                if (hitTarget) {
                    this.applyPoisonToEnemy(hitTarget, towerForgeBonus);
                }
                this._poisonArrowPool.release(arrow);
            } else {
                this.poisonArrows[paWrite++] = arrow;
            }
        }
        this.poisonArrows.length = paWrite;
        
        // Update poison effects on enemies - HIGHLY OPTIMIZED
        // Skip entirely if no poisoned enemies (early exit)
        if (this.poisonedEnemies.size === 0) return;
        
        // Single pass: apply poison damage on tick, remove if enemy dead or reached end
        for (const [enemy, state] of this.poisonedEnemies) {
            // Remove poison when enemy is dead or has left the map
            if (enemy.health <= 0 || enemy.reachedEnd) {
                this.poisonedEnemies.delete(enemy);
                continue;
            }
            
            // Poison is permanent - tick damage every 2 seconds until death
            state.elapsedSinceTick += deltaTime;
            if (state.elapsedSinceTick >= 2.0) {
                const poisonDamage = state.baseDamage + towerForgeBonus;
                enemy.takeDamage(poisonDamage, 0, 'poison', true);
                state.elapsedSinceTick -= 2.0; // Reset for next tick
            }
        }
    }
    
    /**
     * Prefers the nearest enemy that isn't poisoned yet, so shots spread the
     * (permanent, until-death) DoT across as many enemies as possible instead
     * of piling redundant hits onto a target that's already poisoned. Only
     * falls back to an already-poisoned enemy when nothing else is in range.
     */
    findTarget(enemies) {
        const range = this.effectiveRange ?? this.range;
        const grid = this._spatialGrid;
        let closestUnpoisoned = null;
        let closestUnpoisonedDistSq = range * range;
        let closestPoisoned = null;
        let closestPoisonedDistSq = range * range;

        const consider = (enemy) => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distSq = dx * dx + dy * dy;
            if (this.poisonedEnemies.has(enemy)) {
                if (distSq < closestPoisonedDistSq) {
                    closestPoisoned = enemy;
                    closestPoisonedDistSq = distSq;
                }
            } else if (distSq < closestUnpoisonedDistSq) {
                closestUnpoisoned = enemy;
                closestUnpoisonedDistSq = distSq;
            }
        };

        if (grid) {
            const count = grid.query(this.x, this.y, range);
            const buf = grid._queryBuf;
            for (let i = 0; i < count; i++) consider(buf[i]);
        } else {
            for (let i = 0; i < enemies.length; i++) consider(enemies[i]);
        }

        return closestUnpoisoned || closestPoisoned;
    }

    applyPoisonToEnemy(enemy, towerForgeBonus = 0) {
        const basePoisonDamage = 13;
        
        // Apply poison if not already poisoned - poison lasts until enemy dies
        if (!this.poisonedEnemies.has(enemy)) {
            this.poisonedEnemies.set(enemy, {
                baseDamage: basePoisonDamage,
                elapsedSinceTick: 0
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
        const startX = this.archerPosition.x ?? this.rangerSpot.x;
        const startY = this.archerPosition.y ?? this.rangerSpot.y;
        
        const dx = predicted.x - startX;
        const dy = predicted.y - startY;
        const distance = Math.hypot(dx, dy);
        const arcHeight = distance * 0.08;
        
        // Only create arrow if distance is reasonable (avoid zero-distance or invalid arrows)
        if (distance > 10) {
            const arrow = this._poisonArrowPool.acquire();
            arrow.x = startX;
            arrow.y = startY;
            arrow.vx = (dx / distance) * arrowSpeed;
            arrow.vy = (dy / distance) * arrowSpeed - arcHeight;
            arrow.rotation = Math.atan2(dy, dx);
            arrow.life = distance / Math.max(arrowSpeed, 1) + 0.5;
            arrow.targetX = predicted.x;
            arrow.targetY = predicted.y;
            arrow.target = this.target;
            arrow.fallbackX = this.target.x;
            arrow.fallbackY = this.target.y;
            this.poisonArrows.push(arrow);
        }
    }
    
    render(ctx) {
        if (!this.skipCanvas2DBodyRender) {
            this.renderDynamicParts(ctx);
            this.renderProjectiles(ctx);
        }

        // Render range indicator and markers - not yet migrated, cheap, always on Canvas2D
        this.renderIndicators(ctx);
    }

    /** Phase 5: poison arrows - present so TowerRenderAdapter.sync() can call this through the same shim used for renderDynamicParts, preserving draw order (body, then arrows on top). */
    renderProjectiles(ctx) {
        if (this.poisonArrows.length > 0) {
            this.renderArrows(ctx);
        }
    }

    /** No static structure for this tower (camouflage bushes + hidden archer only) - present for TowerRenderAdapter's uniform convention. */
    renderStaticBack(ctx, towerSize) {
        // intentionally empty
    }

    /** No static structure for this tower - present for TowerRenderAdapter's uniform convention. */
    renderStaticFront(ctx, towerSize) {
        // intentionally empty
    }

    /** Strategy B (per-instance Graphics, redrawn every frame): cover bushes (rustle animation) + archer (hide/reveal, aim rotation, draw-back) - all continuous per-instance state. */
    renderDynamicParts(ctx) {
        this.renderCoverElements(ctx);

        if (this.target) {
            this.renderArcher(ctx);
        }
    }
    
    renderCoverElements(ctx) {
        for (let eIdx = 0; eIdx < this.coverElements.length; eIdx++) {
            const element = this.coverElements[eIdx];
            ctx.save();
            ctx.translate(element.x, element.y);
            
            const rustleAmount = Math.sin(this.animationTime * 1.5 + element.rustleOffset) * 0.02;
            ctx.rotate(rustleAmount);

            if (ctx.level) {
                // Campaign-aware vegetation at local origin (already translated)
                ctx.level.renderVegetation(ctx, 0, 0, element.size * 2, 0, 0, eIdx);
            } else {
                // Fallback: forest organic bush rendering
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.beginPath();
                ctx.arc(2, 2, element.size, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, element.size * 0.7);
                ctx.lineTo(0, -element.size * 0.3);
                ctx.stroke();

                for (let bIdx = 0; bIdx < element.branches.length; bIdx++) {
                    const branch = element.branches[bIdx];
                    const branchX = Math.cos(branch.angle) * branch.length;
                    const branchY = Math.sin(branch.angle) * branch.length;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(branchX, branchY);
                    ctx.stroke();
                    ctx.lineWidth = 1;
                    for (let sIdx = 0; sIdx < branch.subBranches.length; sIdx++) {
                        const subBranch = branch.subBranches[sIdx];
                        const subX = branchX + Math.cos(subBranch.angle) * subBranch.length;
                        const subY = branchY + Math.sin(subBranch.angle) * subBranch.length;
                        ctx.beginPath();
                        ctx.moveTo(branchX, branchY);
                        ctx.lineTo(subX, subY);
                        ctx.stroke();
                    }
                    ctx.lineWidth = 2;
                }

                for (let cIdx = 0; cIdx < element.leafClusters.length; cIdx++) {
                    const cluster = element.leafClusters[cIdx];
                    const leafX = Math.cos(cluster.angle) * cluster.distance;
                    const leafY = Math.sin(cluster.angle) * cluster.distance;
                    ctx.fillStyle = cluster.color;
                    ctx.beginPath();
                    ctx.arc(leafX, leafY, element.size * 0.2, 0, Math.PI * 2);
                    ctx.fill();
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
                }

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
            }
            
            ctx.restore();
        }
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
        for (let i = 0; i < this.poisonArrows.length; i++) {
            const arrow = this.poisonArrows[i];
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
        }
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
            description: 'Ranger shoots poison arrows that apply a permanent toxin, dealing heavy damage over time until the enemy dies.',
            damage: '13 poison/2s',
            range: '130',
            fireRate: '0.25/sec',
            cost: 200,
            icon: ''
        };
    }
}
