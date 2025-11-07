export class BasicTower {
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
        
        // Animation properties
        this.throwingDefender = -1; // Which defender is throwing
        this.throwAnimationTime = 0;
        this.rocks = [];
        this.defenders = [
            { angle: 0, armRaised: 0, throwCooldown: 0 },
            { angle: Math.PI / 2, armRaised: 0, throwCooldown: 0.3 },
            { angle: Math.PI, armRaised: 0, throwCooldown: 0.6 },
            { angle: 3 * Math.PI / 2, armRaised: 0, throwCooldown: 0.9 }
        ];
    }
    
    update(deltaTime, enemies) {
        this.cooldown = Math.max(0, this.cooldown - deltaTime);
        
        this.target = this.findTarget(enemies);
        
        // Update defenders
        this.defenders.forEach((defender, index) => {
            defender.throwCooldown = Math.max(0, defender.throwCooldown - deltaTime);
            defender.armRaised = Math.max(0, defender.armRaised - deltaTime * 3);
            
            if (this.target) {
                const targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                // Defenders slowly turn toward target
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
            rock.x += rock.vx * deltaTime;
            rock.y += rock.vy * deltaTime;
            rock.vy += 200 * deltaTime; // Gravity
            rock.rotation += rock.rotationSpeed * deltaTime;
            rock.life -= deltaTime;
            
            return rock.life > 0;
        });
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
    
    shoot() {
        if (this.target) {
            this.target.takeDamage(this.damage);
            
            // Select a defender to throw
            const availableDefenders = this.defenders
                .map((def, index) => ({ def, index }))
                .filter(({ def }) => def.throwCooldown === 0);
            
            if (availableDefenders.length > 0) {
                const { def: thrower, index } = availableDefenders[Math.floor(Math.random() * availableDefenders.length)];
                thrower.armRaised = 1;
                thrower.throwCooldown = 2;
                this.throwingDefender = index;
                
                // Create rock projectile
                const dx = this.target.x - this.x;
                const dy = this.target.y - this.y;
                const distance = Math.hypot(dx, dy);
                const throwSpeed = 300;
                const arcHeight = distance * 0.15; // Higher arc than arrows
                
                this.rocks.push({
                    x: this.x + Math.cos(thrower.angle) * 15,
                    y: this.y + Math.sin(thrower.angle) * 15 - 10, // Start from tower top
                    vx: (dx / distance) * throwSpeed,
                    vy: (dy / distance) * throwSpeed - arcHeight,
                    rotation: 0,
                    rotationSpeed: Math.random() * 10 + 5,
                    life: distance / throwSpeed + 1,
                    size: Math.random() * 2 + 3
                });
            }
        }
    }
    
    render(ctx) {
        // Calculate tower size based on grid cell size (2x2 cells)
        const baseResolution = 1920;
        const scaleFactor = Math.max(0.5, Math.min(2.5, ctx.canvas.width / baseResolution));
        const cellSize = Math.floor(32 * scaleFactor);
        const towerSize = cellSize * 2;
        
        // Isometric perspective settings
        const isoScale = 0.866; // sqrt(3)/2 for proper isometric ratio
        const baseWidth = towerSize * 0.8;
        const baseHeight = towerSize * 0.4;
        const towerHeight = towerSize * 0.6;
        
        // Draw decorative trees around the tower
        this.drawTrees(ctx, towerSize);
        
        // Tower shadow (isometric)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.save();
        ctx.transform(1, 0, 0.5, isoScale, 0, 0);
        ctx.beginPath();
        ctx.ellipse(this.x + 5, (this.y + baseHeight + 5) / isoScale, baseWidth * 0.5, baseHeight * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Wooden base platform (isometric perspective)
        ctx.save();
        ctx.transform(1, 0, 0.5, isoScale, 0, 0);
        
        // Base platform
        const baseGradient = ctx.createLinearGradient(
            this.x - baseWidth/2, (this.y - baseHeight/2) / isoScale,
            this.x + baseWidth/2, (this.y + baseHeight/2) / isoScale
        );
        baseGradient.addColorStop(0, '#8B4513');
        baseGradient.addColorStop(0.5, '#A0522D');
        baseGradient.addColorStop(1, '#654321');
        
        ctx.fillStyle = baseGradient;
        ctx.fillRect(this.x - baseWidth/2, this.y / isoScale - baseHeight/2, baseWidth, baseHeight);
        
        // Platform planks
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        for (let i = 1; i < 6; i++) {
            const plankY = this.y / isoScale - baseHeight/2 + (baseHeight * i / 6);
            ctx.beginPath();
            ctx.moveTo(this.x - baseWidth/2, plankY);
            ctx.lineTo(this.x + baseWidth/2, plankY);
            ctx.stroke();
        }
        
        ctx.restore();
        
        // Main tower structure (isometric cylinder)
        const towerWidth = baseWidth * 0.7;
        const towerTopY = this.y - towerHeight;
        
        // Tower body (isometric)
        ctx.save();
        ctx.transform(1, 0, 0.5, isoScale, 0, 0);
        
        // Tower gradient
        const towerGradient = ctx.createLinearGradient(
            this.x - towerWidth/2, towerTopY / isoScale,
            this.x + towerWidth/2, this.y / isoScale
        );
        towerGradient.addColorStop(0, '#DEB887');
        towerGradient.addColorStop(0.5, '#CD853F');
        towerGradient.addColorStop(1, '#8B7355');
        
        ctx.fillStyle = towerGradient;
        ctx.fillRect(this.x - towerWidth/2, towerTopY / isoScale, towerWidth, towerHeight / isoScale);
        
        // Wooden planks texture
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 5; i++) {
            const plankY = towerTopY / isoScale + (towerHeight / isoScale * i / 6);
            ctx.beginPath();
            ctx.moveTo(this.x - towerWidth/2, plankY);
            ctx.lineTo(this.x + towerWidth/2, plankY);
            ctx.stroke();
        }
        
        // Tower outline
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - towerWidth/2, towerTopY / isoScale, towerWidth, towerHeight / isoScale);
        
        ctx.restore();
        
        // Tower top platform (isometric)
        ctx.save();
        ctx.transform(1, 0, 0.5, isoScale, 0, 0);
        
        const topGradient = ctx.createLinearGradient(
            this.x - towerWidth/2, (towerTopY - 10) / isoScale,
            this.x + towerWidth/2, towerTopY / isoScale
        );
        topGradient.addColorStop(0, '#A0522D');
        topGradient.addColorStop(1, '#654321');
        
        ctx.fillStyle = topGradient;
        ctx.fillRect(this.x - towerWidth/2, (towerTopY - 10) / isoScale, towerWidth, 10 / isoScale);
        
        // Crenellations (battlements)
        ctx.fillStyle = '#8B4513';
        const merlonWidth = towerWidth / 8;
        for (let i = 0; i < 8; i += 2) {
            const merlonX = this.x - towerWidth/2 + i * merlonWidth;
            ctx.fillRect(merlonX, (towerTopY - 20) / isoScale, merlonWidth, 10 / isoScale);
        }
        
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - towerWidth/2, (towerTopY - 20) / isoScale, towerWidth, 20 / isoScale);
        
        ctx.restore();
        
        // Render defenders on the tower (adjusted for isometric view)
        this.defenders.forEach((defender, index) => {
            const defenderX = this.x + Math.cos(defender.angle) * (towerWidth * 0.3);
            const defenderY = towerTopY + Math.sin(defender.angle) * (towerWidth * 0.2);
            
            ctx.save();
            ctx.translate(defenderX, defenderY);
            
            // Defender body (isometric view)
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-2, -6, 4, 8); // Torso
            
            // Defender head
            ctx.fillStyle = '#DDBEA9';
            ctx.beginPath();
            ctx.arc(0, -8, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Helmet
            ctx.fillStyle = '#696969';
            ctx.beginPath();
            ctx.arc(0, -8, 2.5, Math.PI, Math.PI * 2);
            ctx.fill();
            
            // Arms - animate throwing motion
            ctx.strokeStyle = '#DDBEA9';
            ctx.lineWidth = 2;
            
            // Throwing arm
            const armAngle = this.target && index === this.throwingDefender ? 
                -Math.PI / 3 - defender.armRaised * Math.PI / 4 : 
                Math.sin(Date.now() * 0.001 + index) * 0.2;
            
            ctx.beginPath();
            ctx.moveTo(0, -4);
            ctx.lineTo(Math.cos(armAngle) * 4, -4 + Math.sin(armAngle) * 4);
            ctx.stroke();
            
            // Other arm
            ctx.beginPath();
            ctx.moveTo(0, -4);
            ctx.lineTo(-3, -1);
            ctx.stroke();
            
            // If throwing, show rock in hand briefly
            if (defender.armRaised > 0.7) {
                const rockX = Math.cos(armAngle) * 5;
                const rockY = -4 + Math.sin(armAngle) * 5;
                ctx.fillStyle = '#696969';
                ctx.beginPath();
                ctx.arc(rockX, rockY, 1, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        });
        
        // Render flying rocks
        this.rocks.forEach(rock => {
            ctx.save();
            ctx.translate(rock.x, rock.y);
            ctx.rotate(rock.rotation);
            
            // Rock with 3D shading
            const rockGradient = ctx.createRadialGradient(-1, -1, 0, 0, 0, rock.size);
            rockGradient.addColorStop(0, '#A9A9A9');
            rockGradient.addColorStop(1, '#696969');
            
            ctx.fillStyle = rockGradient;
            ctx.strokeStyle = '#2F2F2F';
            ctx.lineWidth = 1;
            
            // Irregular rock shape
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
        
        // Range indicator when targeting
        if (this.target) {
            ctx.strokeStyle = 'rgba(139, 69, 19, 0.2)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    drawTrees(ctx, towerSize) {
        const trees = [
            { x: -towerSize * 0.6, y: -towerSize * 0.3, size: 0.7 },
            { x: towerSize * 0.7, y: -towerSize * 0.4, size: 0.8 },
            { x: -towerSize * 0.4, y: towerSize * 0.6, size: 0.6 },
            { x: towerSize * 0.5, y: towerSize * 0.7, size: 0.9 },
            { x: -towerSize * 0.8, y: towerSize * 0.2, size: 0.5 }
        ];
        
        trees.forEach(tree => {
            const treeX = this.x + tree.x;
            const treeY = this.y + tree.y;
            const scale = tree.size;
            
            // Tree trunk
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(treeX - 2 * scale, treeY - 5 * scale, 4 * scale, 10 * scale);
            
            // Tree foliage layers (3D effect)
            const foliageColors = ['#2F4F2F', '#228B22', '#32CD32'];
            const foliageSizes = [8, 6, 4];
            
            foliageColors.forEach((color, i) => {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(treeX, treeY - 8 * scale + i * 2 * scale, foliageSizes[i] * scale, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // Tree highlights
            ctx.fillStyle = 'rgba(144, 238, 144, 0.3)';
            ctx.beginPath();
            ctx.arc(treeX - 2 * scale, treeY - 10 * scale, 3 * scale, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    static getInfo() {
        return {
            name: 'Basic Tower',
            description: 'A reliable wooden watchtower with defenders hurling rocks.',
            damage: '20',
            range: '120',
            fireRate: '1.0/sec',
            cost: 50
        };
    }
}
