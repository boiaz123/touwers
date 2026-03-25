import { Tower } from './Tower.js';

export class BasicTower extends Tower {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY);
        this.range = 120;
        this.damage = 20;
        this.fireRate = 1;
        this.showRange = false;
        
        // Animation properties
        this.throwingDefender = -1;
        this.throwAnimationTime = 0;
        this.rocks = [];
        this.defenders = [
            { angle: 0, armRaised: 0, throwCooldown: 0 },
            { angle: Math.PI / 2, armRaised: 0, throwCooldown: 0.3 },
            { angle: Math.PI, armRaised: 0, throwCooldown: 0.6 },
            { angle: 3 * Math.PI / 2, armRaised: 0, throwCooldown: 0.9 }
        ];

        this.isSelected = false;
        this._suppressSelectionUntilClick = true;
        this._clickHandlerAttached = false;
        this._onCanvasClick = null;
    }
    
    update(deltaTime, enemies) {
        super.update(deltaTime, enemies);
        
        // Update defenders
        this.defenders.forEach((defender, index) => {
            defender.throwCooldown = Math.max(0, defender.throwCooldown - deltaTime);
            defender.armRaised = Math.max(0, defender.armRaised - deltaTime * 3);
            
            if (this.target) {
                const targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                const angleDiff = targetAngle - defender.angle;
                defender.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), deltaTime * 2);
            }
        });
        
        if (this.target && this.cooldown === 0) {
            this.shoot();
            this.cooldown = 1 / this.fireRate;
        }
        
        // Update flying rocks
        this.rocks = this.rocks.filter(rock => {
            const oldX = rock.x;
            const oldY = rock.y;
            
            rock.x += rock.vx * deltaTime;
            rock.y += rock.vy * deltaTime;
            rock.vy += 200 * deltaTime;
            rock.rotation += rock.rotationSpeed * deltaTime;
            rock.life -= deltaTime;
            
            // Use swept collision detection for fast-moving rocks
            // Check if rock's path passes near target (prevents missing at high speeds)
            const collisionRadius = Math.max(15, Math.hypot(rock.vx, rock.vy) * deltaTime * 0.5);
            
            // Check if rock hits target (alive or dead) or fallback position
            if (rock.target) {
                // Check distance to target's current position (works for alive and dead enemies)
                const dist = Math.hypot(rock.x - rock.target.x, rock.y - rock.target.y);
                if (dist <= collisionRadius) {
                    return false;
                }
                // Also check if the projectile path passed near the target (swept collision)
                const targetX = rock.target.x;
                const targetY = rock.target.y;
                const segmentDist = this.distanceToSegment(targetX, targetY, oldX, oldY, rock.x, rock.y);
                if (segmentDist <= collisionRadius) {
                    return false;
                }
            } else if (rock.fallbackX != null) {
                // If target is completely gone, use fallback position
                const dist = Math.hypot(rock.x - rock.fallbackX, rock.y - rock.fallbackY);
                if (dist <= collisionRadius) {
                    return false;
                }
                // Also check if the projectile path passed near the fallback position (swept collision)
                const segmentDist = this.distanceToSegment(rock.fallbackX, rock.fallbackY, oldX, oldY, rock.x, rock.y);
                if (segmentDist <= collisionRadius) {
                    return false;
                }
            }
            
            return rock.life > 0;
        });
    }
    
    /**
     * Calculate the shortest distance from a point to a line segment
     * Used for swept collision detection of projectiles
     */
    distanceToSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;
        
        if (lenSq === 0) {
            // Segment is a point
            return Math.hypot(px - x1, py - y1);
        }
        
        // Project point onto line segment
        let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        
        const closestX = x1 + t * dx;
        const closestY = y1 + t * dy;
        
        return Math.hypot(px - closestX, py - closestY);
    }
    
    shoot() {
        if (this.target) {
            this.target.takeDamage(this.damage, 0, 'physical');
            
            // Play attack sound
            if (this.audioManager) {
                this.audioManager.playSFX('basic-tower');
            } else {
                console.warn('BasicTower: audioManager not available for sound');
            }
            
            const availableDefenders = this.defenders
                .map((def, index) => ({ def, index }))
                .filter(({ def }) => def.throwCooldown === 0);
            
            if (availableDefenders.length > 0) {
                const { def: thrower, index } = availableDefenders[Math.floor(Math.random() * availableDefenders.length)];
                thrower.armRaised = 1;
                thrower.throwCooldown = 2;
                this.throwingDefender = index;
                
                const platformY = this.y - (this.gridSize || 64) * 0.12 - (this.gridSize || 64) * 0.45 - (this.gridSize || 64) * 0.08;
                const defenderX = this.x + (this.gridSize || 64) * 0.32 * 0.1;
                const defenderY = platformY - (this.gridSize || 64) * 0.32 * 0.05 - 12;
                
                // Predict where the target will be
                const throwSpeed = 300;
                const predicted = this.predictEnemyPosition(this.target, throwSpeed);
                
                const dx = predicted.x - defenderX;
                const dy = predicted.y - defenderY;
                const distance = Math.hypot(dx, dy);
                const arcHeight = distance * 0.15;
                
                this.rocks.push({
                    x: defenderX,
                    y: defenderY,
                    vx: distance > 0 ? (dx / distance) * throwSpeed : 0,
                    vy: distance > 0 ? (dy / distance) * throwSpeed - arcHeight : 0,
                    rotation: 0,
                    rotationSpeed: Math.random() * 10 + 5,
                    life: distance / Math.max(throwSpeed, 1) + 1,
                    size: Math.random() * 2 + 3,
                    target: this.target,
                    fallbackX: this.target.x,
                    fallbackY: this.target.y
                });
            }
        }
    }
    
    render(ctx) {
        // Get cell size - use ResolutionManager if available
        const cellSize = this.getCellSize(ctx);
        const gridSize = cellSize * 2; // 2x2 grid = 2 cells wide
        this.gridSize = gridSize; // Store for rock calculations



        // Compact, aligned tower dimensions
        const baseSize = gridSize * 0.35;
        const baseHeight = gridSize * 0.1;
        const towerSize = gridSize * 0.28;
        const towerHeight = gridSize * 0.4;
        const platformSize = gridSize * 0.32;
        const platformHeight = gridSize * 0.06;
        const roofSize = gridSize * 0.35;
        const roofHeight = gridSize * 0.25;
        
        // Draw environmental elements first
        this.drawEnvironment(ctx, gridSize);
        
        // Compact shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.save();
        ctx.translate(this.x + 3, this.y + 3);
        ctx.scale(1, 0.4);
        ctx.fillRect(-baseSize/2, -baseSize/2, baseSize, baseSize);
        ctx.restore();
        
        // Stone base - tight and aligned
        const baseY = this.y;
        
        // Stone base with gradient for depth
        const baseGradient = ctx.createLinearGradient(
            this.x - baseSize/2, baseY - baseHeight,
            this.x + baseSize/2, baseY
        );
        baseGradient.addColorStop(0, '#D0D0D0');
        baseGradient.addColorStop(0.4, '#A9A9A9');
        baseGradient.addColorStop(1, '#6A6A6A');
        ctx.fillStyle = baseGradient;
        ctx.fillRect(this.x - baseSize/2, baseY - baseHeight, baseSize, baseHeight);

        // Base top highlight
        ctx.fillStyle = '#E8E8E8';
        ctx.fillRect(this.x - baseSize/2, baseY - baseHeight, baseSize, 2);
        
        // Stone texture - add more lines for detail
        ctx.strokeStyle = '#696969';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - baseSize/2, baseY - baseHeight, baseSize, baseHeight);
        // Add horizontal stone lines
        for (let i = 1; i < 3; i++) {
            const stoneY = baseY - baseHeight + (baseHeight * i / 3);
            ctx.beginPath();
            ctx.moveTo(this.x - baseSize/2, stoneY);
            ctx.lineTo(this.x + baseSize/2, stoneY);
            ctx.stroke();
        }
        
        // Tower structure - perfectly centered
        const towerY = baseY - baseHeight - towerHeight;
        const platformY = towerY - platformHeight;
        const roofY = platformY - roofHeight;
        
        // Four aligned corner posts - more substantial, wood grain and metal plates
        const postSize = 4;
        const postOffset = towerSize/2 - postSize/2;
        const posts = [
            {x: -postOffset, y: 0},
            {x: postOffset, y: 0},
            {x: -postOffset, y: 0},
            {x: postOffset, y: 0}
        ];
        
        // Draw posts with wood grain and metal corner plates (simple armour)
        ctx.fillStyle = '#7a3f18'; // slightly darker wood
        posts.forEach((post, idx) => {
            // post
            ctx.fillRect(this.x + post.x, towerY, postSize, towerHeight);
            // wood grain lines
            ctx.strokeStyle = '#5a2f10';
            ctx.lineWidth = 1;
            for (let i = 1; i < 5; i++) {
                const grainY = towerY + (towerHeight * i / 6);
                ctx.beginPath();
                ctx.moveTo(this.x + post.x, grainY);
                ctx.lineTo(this.x + post.x + postSize, grainY);
                ctx.stroke();
            }
            // metal corner plate (simple armour)
            const plateW = 5;
            const plateH = 10;
            ctx.fillStyle = '#606060';
            ctx.fillRect(this.x + post.x - 1, towerY, plateW, plateH);
            ctx.strokeStyle = '#333';
            ctx.strokeRect(this.x + post.x - 1, towerY, plateW, plateH);
            // reset wood fill for next
            ctx.fillStyle = '#7a3f18';
        });
        
        // Horizontal braces and diagonal supports for realism
        ctx.strokeStyle = '#5b3a24';
        ctx.lineWidth = 2;
        const braceYs = [
            towerY + towerHeight * 0.25,
            towerY + towerHeight * 0.5,
            towerY + towerHeight * 0.75
        ];
        braceYs.forEach(y => {
            ctx.beginPath();
            ctx.moveTo(this.x - postOffset + 1, y);
            ctx.lineTo(this.x + postOffset - 1, y);
            ctx.stroke();
        });
        // diagonal braces
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x - postOffset + 1, towerY + towerHeight);
        ctx.lineTo(this.x, towerY + towerHeight * 0.35);
        ctx.lineTo(this.x + postOffset - 1, towerY + towerHeight);
        ctx.stroke();
        
        // Platform - centered and aligned, add rail/railing and plank detail
        ctx.fillStyle = '#CDAA7A';
        ctx.fillRect(this.x - platformSize/2, platformY, platformSize, platformHeight);

        // platform top bevel
        ctx.fillStyle = '#DABE94';
        ctx.fillRect(this.x - platformSize/2, platformY, platformSize, 2);

        // Platform planks and nails
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 1;
        const planks = 6;
        for (let i = 0; i < planks; i++) {
            const plankX = this.x - platformSize/2 + (platformSize * i / planks);
            ctx.beginPath();
            ctx.moveTo(plankX, platformY);
            ctx.lineTo(plankX, platformY + platformHeight);
            ctx.stroke();
            // nails (small dots) every plank
            ctx.fillStyle = '#3b2a20';
            ctx.beginPath();
            ctx.arc(plankX + platformSize/planks/2, platformY + platformHeight/2, 0.7, 0, Math.PI*2);
            ctx.fill();
        }

        // Railing around platform (simple wooden rail)
        const railHeight = platformHeight * 0.9;
        ctx.fillStyle = '#6b3b18';
        // front rail
        ctx.fillRect(this.x - platformSize/2 - 1, platformY - railHeight, platformSize + 2, 2);
        // posts for railing
        for (let i = -1; i <= 1; i++) {
            const rx = this.x + i * (platformSize/4);
            ctx.fillRect(rx - 1, platformY - railHeight + 2, 2, railHeight - 2);
        }
        // small metal reinforcements on the rail (simple armour look)
        ctx.fillStyle = '#575757';
        ctx.fillRect(this.x - platformSize/2 - 1, platformY - railHeight, 4, 2);
        ctx.fillRect(this.x + platformSize/2 - 3, platformY - railHeight, 4, 2);

        // Roof posts and banner
        const roofPostOffset = platformSize/2 - 2;
        ctx.fillStyle = '#5a341d';
        ctx.fillRect(this.x - roofPostOffset, platformY, 2, -roofHeight);
        ctx.fillRect(this.x + roofPostOffset, platformY, 2, -roofHeight);
        ctx.fillRect(this.x, platformY, 2, -roofHeight); // center post

        // Peaked triangular roof
        const roofPeakY = roofY - gridSize * 0.14;
        const roofHalfW = roofSize / 2 + 4;

        // Roof shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.moveTo(this.x + 2, roofPeakY + 2);
        ctx.lineTo(this.x - roofHalfW + 2, roofY + 2);
        ctx.lineTo(this.x + roofHalfW + 2, roofY + 2);
        ctx.closePath();
        ctx.fill();

        // Roof face (dark shingles)
        ctx.fillStyle = '#5a341d';
        ctx.strokeStyle = '#3d2010';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x, roofPeakY);
        ctx.lineTo(this.x - roofHalfW, roofY);
        ctx.lineTo(this.x + roofHalfW, roofY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Shingle lines
        ctx.strokeStyle = '#3d2010';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const t = i / 4;
            const shingleY = roofPeakY + (roofY - roofPeakY) * t;
            const hw = roofHalfW * t;
            ctx.beginPath();
            ctx.moveTo(this.x - hw, shingleY);
            ctx.lineTo(this.x + hw, shingleY);
            ctx.stroke();
        }

        // Flagpole at roof peak
        ctx.strokeStyle = '#5a341d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, roofPeakY);
        ctx.lineTo(this.x, roofPeakY - 14);
        ctx.stroke();

        // Flag (burgundy pennant)
        ctx.fillStyle = '#8B1E3F';
        ctx.beginPath();
        ctx.moveTo(this.x, roofPeakY - 14);
        ctx.lineTo(this.x + 12, roofPeakY - 10);
        ctx.lineTo(this.x, roofPeakY - 6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#5b1028';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        
        // Render defender - centered on platform with simple shoulder plates
        const defenderX = this.x;
        const defenderY = platformY - 10;

        ctx.save();
        ctx.translate(defenderX, defenderY);

        // Face target if exists
        if (this.target) {
            const targetAngle = Math.atan2(this.target.y - defenderY, this.target.x - defenderX);
            ctx.rotate(targetAngle);
        }

        // Defender body with blue shirt base
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(-2, -3, 4, 6);

        // Simple armor: gray chest plate over shirt
        ctx.fillStyle = '#696969';
        ctx.fillRect(-2.5, -2.5, 5, 4);
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.strokeRect(-2.5, -2.5, 5, 4);

        // Add shoulder plates (simple round caps)
        ctx.fillStyle = '#5a5a5a';
        ctx.beginPath();
        ctx.arc(-3, -2.5, 1.1, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(3, -2.5, 1.1, 0, Math.PI*2);
        ctx.fill();

        // Head and helmet (unchanged)
        ctx.fillStyle = '#DDBEA9';
        ctx.beginPath();
        ctx.arc(0, -5, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#696969';
        ctx.beginPath();
        ctx.arc(0, -5, 2.5, Math.PI, Math.PI * 2);
        ctx.fill();
        
        // Arms and throwing animation (unchanged)
        ctx.strokeStyle = '#DDBEA9';
        ctx.lineWidth = 2;
        const throwingDefender = this.defenders[0];
        const armAngle = this.target && this.throwingDefender === 0 ?
            -Math.PI / 2 - throwingDefender.armRaised * Math.PI / 3 :
            Math.sin(Date.now() * 0.002) * 0.2;

        ctx.beginPath();
        ctx.moveTo(-1, -2);
        ctx.lineTo(-1 + Math.cos(armAngle) * 3, -2 + Math.sin(armAngle) * 3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(1, -2);
        ctx.lineTo(2.5, 0);
        ctx.stroke();

        // Rock in hand when ready to throw
        if (throwingDefender.armRaised > 0.5) {
            const rockX = -1 + Math.cos(armAngle) * 3.5;
            const rockY = -2 + Math.sin(armAngle) * 3.5;
            ctx.fillStyle = '#696969';
            ctx.beginPath();
            ctx.arc(rockX, rockY, 1, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
        
        // Render flying rocks
        this.rocks.forEach(rock => {
            ctx.save();
            ctx.translate(rock.x, rock.y);
            ctx.rotate(rock.rotation);
            
            const rockGradient = ctx.createRadialGradient(-1, -1, 0, 0, 0, rock.size);
            rockGradient.addColorStop(0, '#A9A9A9');
            rockGradient.addColorStop(1, '#696969');
            
            ctx.fillStyle = rockGradient;
            ctx.strokeStyle = '#2F2F2F';
            ctx.lineWidth = 0.5;
            
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const variance = 0.7 + Math.random() * 0.3;
                const x = Math.cos(angle) * rock.size * variance;
                const y = Math.sin(angle) * rock.size * variance;
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            ctx.restore();
        });
        
        // Render attack radius circle if selected
        this.renderAttackRadiusCircle(ctx);
    }
    
    drawEnvironment(ctx, gridSize) {
        // Trees at the 4 corners of the 2x2 grid, scaled proportionally to gridSize
        const trees = [
            { x: -gridSize * 0.36, y: gridSize * 0.28,  size: gridSize * 0.033, type: 'pine' },
            { x:  gridSize * 0.32, y: gridSize * 0.30,  size: gridSize * 0.040, type: 'round' },
            { x: -gridSize * 0.37, y: -gridSize * 0.22, size: gridSize * 0.035, type: 'pine' },
            { x:  gridSize * 0.33, y: -gridSize * 0.28, size: gridSize * 0.038, type: 'round' }
        ];
        
        trees.forEach(tree => {
            const treeX = this.x + tree.x;
            const treeY = this.y + tree.y;
            const scale = tree.size;
            
            // Drop shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
            ctx.save();
            ctx.translate(treeX + 2, treeY + 2);
            ctx.scale(1, 0.45);
            ctx.beginPath();
            ctx.arc(0, 0, 6 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            if (tree.type === 'pine') {
                // Conifer – same colour palette as LevelBase renderTreeType1/4
                ctx.fillStyle = '#5D4037';
                ctx.fillRect(treeX - 1.1 * scale, treeY, 2.2 * scale, -5.5 * scale);
                ctx.fillStyle = '#3E2723'; // trunk shadow side
                ctx.fillRect(treeX, treeY, 1.1 * scale, -5.5 * scale);
                
                const piLayers = [
                    { dy: -9.5 * scale, hw: 7.5 * scale, color: '#0D3817' },
                    { dy: -6.5 * scale, hw: 5.8 * scale, color: '#1B5E20' },
                    { dy: -3.5 * scale, hw: 4.0 * scale, color: '#2E7D32' }
                ];
                piLayers.forEach(l => {
                    ctx.fillStyle = l.color;
                    ctx.beginPath();
                    ctx.moveTo(treeX,        treeY + l.dy);
                    ctx.lineTo(treeX - l.hw, treeY + l.dy + l.hw * 0.75);
                    ctx.lineTo(treeX + l.hw, treeY + l.dy + l.hw * 0.75);
                    ctx.closePath();
                    ctx.fill();
                    ctx.strokeStyle = '#0b2b0b';
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                });
            } else {
                // Round canopy – same colour palette as LevelBase renderTreeType2
                ctx.fillStyle = '#6B4423';
                const tw = scale * 1.8, th = scale * 4;
                ctx.fillRect(treeX - tw * 0.5, treeY, tw, -th);
                ctx.fillStyle = '#8B5A3C';
                ctx.fillRect(treeX, treeY, tw * 0.5, -th);
                
                ctx.fillStyle = '#1B5E20';
                ctx.beginPath();
                ctx.arc(treeX, treeY - th - scale * 0.5, scale * 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#2E7D32';
                ctx.beginPath();
                ctx.arc(treeX, treeY - th - scale * 2.2, scale * 3.0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#43A047';
                ctx.beginPath();
                ctx.arc(treeX, treeY - th - scale * 3.6, scale * 1.8, 0, Math.PI * 2);
                ctx.fill();
            }
        });
	    
        // Bushes (adjusted positions)
        const bushes = [
            { x: -gridSize * 0.22, y: gridSize * 0.22, size: 0.32 },
            { x:  gridSize * 0.18, y: -gridSize * 0.18, size: 0.24 },
            { x: -gridSize * 0.28, y: -gridSize * 0.32, size: 0.38 }
        ];
        
        bushes.forEach(bush => {
            const bushX = this.x + bush.x;
            const bushY = this.y + bush.y;
            const scale = bush.size;

            ctx.fillStyle = '#1f6f1f';
            ctx.beginPath();
            ctx.arc(bushX, bushY, 3 * scale, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#28a028';
            ctx.beginPath();
            ctx.arc(bushX - scale, bushY - scale, 2 * scale, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(bushX + scale, bushY - scale, 2 * scale, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Small rocks (unchanged but ensure they fit)
        const rocks = [
            { x: -gridSize * 0.3, y: gridSize * 0.28, size: 0.22 },
            { x: gridSize * 0.25, y: gridSize * 0.18, size: 0.15 },
            { x: gridSize * 0.28, y: -gridSize * 0.24, size: 0.25 }
        ];
        
        rocks.forEach(rock => {
            const rockX = this.x + rock.x;
            const rockY = this.y + rock.y;
            const scale = rock.size;
            ctx.fillStyle = '#807f80';
            ctx.beginPath();
            ctx.arc(rockX, rockY, 2 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#696969';
            ctx.lineWidth = 1;
            ctx.stroke();
        });
        
        // Small grass patches for variety (keeps within grid)
        const grasses = [
            { x: -gridSize * 0.12, y: gridSize * 0.18 },
            { x: gridSize * 0.08, y: -gridSize * 0.12 }
        ];
        ctx.strokeStyle = '#2e8b2e';
        ctx.lineWidth = 1;
        grasses.forEach(g => {
            const gx = this.x + g.x;
            const gy = this.y + g.y;
            for (let i = 0; i < 4; i++) {
                const angle = -Math.PI/2 + (i-1.5)*0.2;
                ctx.beginPath();
                ctx.moveTo(gx, gy);
                ctx.lineTo(gx + Math.cos(angle)*6, gy + Math.sin(angle)*6);
                ctx.stroke();
            }
        });
    }
    
    static getInfo() {
        return {
            name: 'Watch Tower',
            description: 'A reliable wooden watchtower with defenders hurling rocks.',
            damage: '20',
            range: '120',
            fireRate: '1.0/sec',
            cost: 50,
            icon: ''
        };
    }
}
