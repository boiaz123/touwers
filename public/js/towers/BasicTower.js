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
        const gridSize = cellSize * 2; // 2x2 grid
        
        // Draw pine trees around the tower first
        this.drawPineTrees(ctx, gridSize);
        
        // Tower dimensions - simple and clean
        const towerSize = gridSize * 0.6;
        const towerHeight = gridSize * 0.8;
        
        // Draw tower shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.save();
        ctx.setTransform(1, 0.5, 0, 0.5, this.x + 3, this.y + 3);
        ctx.fillRect(-towerSize/2, -towerSize/2, towerSize, towerSize);
        ctx.restore();
        
        // Draw wooden base platform
        const baseY = this.y;
        ctx.save();
        ctx.setTransform(1, 0.5, 0, 0.5, this.x, baseY);
        
        // Base wood texture
        const baseGradient = ctx.createLinearGradient(-towerSize/2, -towerSize/2, towerSize/2, towerSize/2);
        baseGradient.addColorStop(0, '#D2B48C');
        baseGradient.addColorStop(0.5, '#DEB887');
        baseGradient.addColorStop(1, '#CD853F');
        ctx.fillStyle = baseGradient;
        ctx.fillRect(-towerSize/2, -towerSize/2, towerSize, towerSize);
        
        // Wood planks on base
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const plankY = -towerSize/2 + (towerSize * i / 4);
            ctx.beginPath();
            ctx.moveTo(-towerSize/2, plankY);
            ctx.lineTo(towerSize/2, plankY);
            ctx.stroke();
        }
        
        // Base border
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(-towerSize/2, -towerSize/2, towerSize, towerSize);
        
        ctx.restore();
        
        // Draw vertical wooden posts (4 corners)
        const postWidth = 4;
        const postPositions = [
            { x: -towerSize/2 + postWidth/2, y: -towerSize/2 + postWidth/2 },
            { x: towerSize/2 - postWidth/2, y: -towerSize/2 + postWidth/2 },
            { x: -towerSize/2 + postWidth/2, y: towerSize/2 - postWidth/2 },
            { x: towerSize/2 - postWidth/2, y: towerSize/2 - postWidth/2 }
        ];
        
        postPositions.forEach(pos => {
            // Post shadow side
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x + pos.x + 1, baseY + pos.y - towerHeight, postWidth-1, towerHeight);
            
            // Post main side
            ctx.fillStyle = '#A0522D';
            ctx.fillRect(this.x + pos.x, baseY + pos.y - towerHeight, postWidth-1, towerHeight);
            
            // Post wood grain
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 1;
            for (let i = 1; i < 4; i++) {
                const grainY = baseY + pos.y - towerHeight + (towerHeight * i / 4);
                ctx.beginPath();
                ctx.moveTo(this.x + pos.x, grainY);
                ctx.lineTo(this.x + pos.x + postWidth-1, grainY);
                ctx.stroke();
            }
        });
        
        // Draw platform top
        const platformY = baseY - towerHeight;
        ctx.save();
        ctx.setTransform(1, 0.5, 0, 0.5, this.x, platformY);
        
        // Platform wood
        const platformGradient = ctx.createLinearGradient(-towerSize/2, -towerSize/2, towerSize/2, towerSize/2);
        platformGradient.addColorStop(0, '#DEB887');
        platformGradient.addColorStop(0.5, '#D2B48C');
        platformGradient.addColorStop(1, '#BC9A6A');
        ctx.fillStyle = platformGradient;
        ctx.fillRect(-towerSize/2, -towerSize/2, towerSize, towerSize);
        
        // Platform planks
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 1;
        for (let i = 1; i < 5; i++) {
            const plankX = -towerSize/2 + (towerSize * i / 5);
            ctx.beginPath();
            ctx.moveTo(plankX, -towerSize/2);
            ctx.lineTo(plankX, towerSize/2);
            ctx.stroke();
        }
        
        // Platform border
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(-towerSize/2, -towerSize/2, towerSize, towerSize);
        
        ctx.restore();
        
        // Draw simple wooden railings
        const railingHeight = 8;
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        
        // Front railing
        ctx.beginPath();
        ctx.moveTo(this.x - towerSize/2, platformY);
        ctx.lineTo(this.x - towerSize/2, platformY - railingHeight);
        ctx.lineTo(this.x + towerSize/2, platformY - railingHeight);
        ctx.lineTo(this.x + towerSize/2, platformY);
        ctx.stroke();
        
        // Side railings
        ctx.beginPath();
        ctx.moveTo(this.x - towerSize/2, platformY - towerSize/4);
        ctx.lineTo(this.x - towerSize/2, platformY - towerSize/4 - railingHeight);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.x + towerSize/2, platformY - towerSize/4);
        ctx.lineTo(this.x + towerSize/2, platformY - towerSize/4 - railingHeight);
        ctx.stroke();
        
        // Render defenders on the platform
        this.defenders.forEach((defender, index) => {
            const defenderRadius = towerSize * 0.25;
            const defenderX = this.x + Math.cos(defender.angle) * defenderRadius;
            const defenderY = platformY + Math.sin(defender.angle) * (towerSize * 0.1) - 5;
            
            ctx.save();
            ctx.translate(defenderX, defenderY);
            
            // Defender body
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-2, -4, 4, 6);
            
            // Head
            ctx.fillStyle = '#DDBEA9';
            ctx.beginPath();
            ctx.arc(0, -6, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Simple helmet
            ctx.fillStyle = '#696969';
            ctx.beginPath();
            ctx.arc(0, -6, 2.5, Math.PI, Math.PI * 2);
            ctx.fill();
            
            // Arms
            ctx.strokeStyle = '#DDBEA9';
            ctx.lineWidth = 2;
            
            const armAngle = this.target && index === this.throwingDefender ? 
                -Math.PI / 3 - defender.armRaised * Math.PI / 4 : 
                Math.sin(Date.now() * 0.001 + index) * 0.2;
            
            // Throwing arm
            ctx.beginPath();
            ctx.moveTo(0, -3);
            ctx.lineTo(Math.cos(armAngle) * 3, -3 + Math.sin(armAngle) * 3);
            ctx.stroke();
            
            // Other arm
            ctx.beginPath();
            ctx.moveTo(0, -3);
            ctx.lineTo(-2, -1);
            ctx.stroke();
            
            // Rock in hand when ready to throw
            if (defender.armRaised > 0.5) {
                const rockX = Math.cos(armAngle) * 3.5;
                const rockY = -3 + Math.sin(armAngle) * 3.5;
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
        
        // Range indicator when targeting
        if (this.target) {
            ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    
    drawPineTrees(ctx, gridSize) {
        // More trees around the tower for better coverage
        const trees = [
            { x: -gridSize * 0.8, y: -gridSize * 0.3, size: 0.6 },
            { x: -gridSize * 0.6, y: gridSize * 0.7, size: 0.5 },
            { x: gridSize * 0.7, y: -gridSize * 0.6, size: 0.7 },
            { x: gridSize * 0.8, y: gridSize * 0.4, size: 0.4 },
            { x: -gridSize * 0.9, y: gridSize * 0.1, size: 0.3 },
            { x: gridSize * 0.2, y: -gridSize * 0.9, size: 0.5 },
            { x: 0, y: gridSize * 0.9, size: 0.4 }
        ];
        
        trees.forEach(tree => {
            const treeX = this.x + tree.x;
            const treeY = this.y + tree.y;
            const scale = tree.size;
            
            // Tree trunk
            ctx.fillStyle = '#654321';
            ctx.fillRect(treeX - 1 * scale, treeY - 2 * scale, 2 * scale, 8 * scale);
            
            // Pine tree layers (3 triangular sections)
            const layers = [
                { y: -12 * scale, width: 8 * scale, color: '#0F3B0F' },
                { y: -8 * scale, width: 6 * scale, color: '#228B22' },
                { y: -4 * scale, width: 4 * scale, color: '#32CD32' }
            ];
            
            layers.forEach((layer, index) => {
                ctx.fillStyle = layer.color;
                ctx.beginPath();
                ctx.moveTo(treeX, treeY + layer.y);
                ctx.lineTo(treeX - layer.width/2, treeY + layer.y + layer.width * 0.8);
                ctx.lineTo(treeX + layer.width/2, treeY + layer.y + layer.width * 0.8);
                ctx.closePath();
                ctx.fill();
                
                // Tree outline
                ctx.strokeStyle = '#0F3B0F';
                ctx.lineWidth = 1;
                ctx.stroke();
            });
            
            // Subtle highlight on trees
            ctx.fillStyle = 'rgba(144, 238, 144, 0.15)';
            ctx.beginPath();
            ctx.moveTo(treeX - 1 * scale, treeY - 10 * scale);
            ctx.lineTo(treeX - 3 * scale, treeY - 6 * scale);
            ctx.lineTo(treeX + 1 * scale, treeY - 8 * scale);
            ctx.closePath();
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
