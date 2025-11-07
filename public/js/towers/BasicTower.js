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
        
        // Draw pine trees first (background)
        this.drawPineTrees(ctx, gridSize);
        
        // Compact tower dimensions - everything centered and tight
        const towerWidth = gridSize * 0.5;
        const towerDepth = gridSize * 0.35;
        const towerHeight = gridSize * 0.7;
        const baseHeight = gridSize * 0.1;
        
        // Tower shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.save();
        ctx.setTransform(1, 0.5, 0, 0.5, this.x + 2, this.y + 2);
        ctx.fillRect(-towerWidth/2, -towerDepth/2, towerWidth, towerDepth + baseHeight);
        ctx.restore();
        
        // Base platform
        ctx.save();
        ctx.setTransform(1, 0.5, 0, 0.5, this.x, this.y);
        
        const baseGradient = ctx.createLinearGradient(-towerWidth/2, -towerDepth/2, towerWidth/2, towerDepth/2);
        baseGradient.addColorStop(0, '#8B4513');
        baseGradient.addColorStop(1, '#654321');
        ctx.fillStyle = baseGradient;
        ctx.fillRect(-towerWidth/2, -towerDepth/2, towerWidth, towerDepth);
        ctx.strokeStyle = '#5D4E37';
        ctx.lineWidth = 1;
        ctx.strokeRect(-towerWidth/2, -towerDepth/2, towerWidth, towerDepth);
        
        ctx.restore();
        
        // Base left side
        ctx.save();
        ctx.setTransform(0, 0.5, -1, 0.5, this.x, this.y);
        ctx.fillStyle = '#654321';
        ctx.fillRect(0, 0, towerDepth/2, baseHeight);
        ctx.restore();
        
        // Base right side
        ctx.save();
        ctx.setTransform(1, 0.5, 0, 0.5, this.x, this.y);
        ctx.fillStyle = '#5D4E37';
        ctx.fillRect(towerWidth/2, 0, 3, baseHeight);
        ctx.restore();
        
        // Main tower - slightly smaller than base
        const mainWidth = towerWidth * 0.8;
        const mainDepth = towerDepth * 0.8;
        const towerY = this.y - towerHeight;
        
        // Tower left face
        ctx.save();
        ctx.setTransform(0, 0.5, -1, 0.5, this.x, this.y);
        const leftGradient = ctx.createLinearGradient(0, -towerHeight, mainDepth/2, 0);
        leftGradient.addColorStop(0, '#DEB887');
        leftGradient.addColorStop(1, '#A0522D');
        ctx.fillStyle = leftGradient;
        ctx.fillRect(0, -towerHeight, mainDepth/2, towerHeight);
        
        // Wooden planks on left
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 4; i++) {
            const plankY = -towerHeight + (towerHeight * i / 5);
            ctx.beginPath();
            ctx.moveTo(0, plankY);
            ctx.lineTo(mainDepth/2, plankY);
            ctx.stroke();
        }
        
        ctx.restore();
        
        // Tower right face
        ctx.save();
        ctx.setTransform(1, 0.5, 0, 0.5, this.x, this.y);
        const rightGradient = ctx.createLinearGradient(mainWidth/2, -towerHeight, mainWidth/2 + 4, 0);
        rightGradient.addColorStop(0, '#CD853F');
        rightGradient.addColorStop(1, '#8B7355');
        ctx.fillStyle = rightGradient;
        ctx.fillRect(mainWidth/2, -towerHeight, 4, towerHeight);
        
        // Wooden planks on right
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 4; i++) {
            const plankY = -towerHeight + (towerHeight * i / 5);
            ctx.beginPath();
            ctx.moveTo(mainWidth/2, plankY);
            ctx.lineTo(mainWidth/2 + 4, plankY);
            ctx.stroke();
        }
        
        ctx.restore();
        
        // Tower top
        ctx.save();
        ctx.setTransform(1, 0.5, 0, 0.5, this.x, towerY);
        
        const topGradient = ctx.createLinearGradient(-mainWidth/2, -mainDepth/2, mainWidth/2, mainDepth/2);
        topGradient.addColorStop(0, '#DEB887');
        topGradient.addColorStop(1, '#CD853F');
        ctx.fillStyle = topGradient;
        ctx.fillRect(-mainWidth/2, -mainDepth/2, mainWidth, mainDepth);
        
        // Platform planks
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const plankY = -mainDepth/2 + (mainDepth * i / 4);
            ctx.beginPath();
            ctx.moveTo(-mainWidth/2, plankY);
            ctx.lineTo(mainWidth/2, plankY);
            ctx.stroke();
        }
        
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.strokeRect(-mainWidth/2, -mainDepth/2, mainWidth, mainDepth);
        
        ctx.restore();
        
        // Battlements
        ctx.save();
        ctx.setTransform(1, 0.5, 0, 0.5, this.x, towerY - 6);
        
        ctx.fillStyle = '#8B4513';
        const battlementSize = mainWidth / 5;
        for (let i = 0; i < 5; i += 2) {
            const battlementX = -mainWidth/2 + i * battlementSize;
            ctx.fillRect(battlementX, -3, battlementSize, 6);
        }
        
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i += 2) {
            const battlementX = -mainWidth/2 + i * battlementSize;
            ctx.strokeRect(battlementX, -3, battlementSize, 6);
        }
        
        ctx.restore();
        
        // Render defenders (positioned tighter on the platform)
        this.defenders.forEach((defender, index) => {
            const defenderRadius = mainWidth * 0.3;
            const defenderX = this.x + Math.cos(defender.angle) * defenderRadius;
            const defenderY = towerY + Math.sin(defender.angle) * (mainDepth * 0.1) - 3;
            
            ctx.save();
            ctx.translate(defenderX, defenderY);
            
            // Defender body
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-1, -3, 2, 4);
            
            // Head
            ctx.fillStyle = '#DDBEA9';
            ctx.beginPath();
            ctx.arc(0, -4.5, 1, 0, Math.PI * 2);
            ctx.fill();
            
            // Helmet
            ctx.fillStyle = '#696969';
            ctx.beginPath();
            ctx.arc(0, -4.5, 1.2, Math.PI, Math.PI * 2);
            ctx.fill();
            
            // Arms
            ctx.strokeStyle = '#DDBEA9';
            ctx.lineWidth = 1;
            
            const armAngle = this.target && index === this.throwingDefender ? 
                -Math.PI / 4 - defender.armRaised * Math.PI / 6 : 
                Math.sin(Date.now() * 0.001 + index) * 0.1;
            
            ctx.beginPath();
            ctx.moveTo(0, -2);
            ctx.lineTo(Math.cos(armAngle) * 2, -2 + Math.sin(armAngle) * 2);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, -2);
            ctx.lineTo(-1.5, 0);
            ctx.stroke();
            
            // Rock in hand
            if (defender.armRaised > 0.7) {
                const rockX = Math.cos(armAngle) * 2.5;
                const rockY = -2 + Math.sin(armAngle) * 2.5;
                ctx.fillStyle = '#696969';
                ctx.beginPath();
                ctx.arc(rockX, rockY, 0.5, 0, Math.PI * 2);
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
        
        // Range indicator
        if (this.target) {
            ctx.strokeStyle = 'rgba(139, 69, 19, 0.2)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    drawPineTrees(ctx, gridSize) {
        const trees = [
            { x: -gridSize * 0.4, y: -gridSize * 0.35, size: 0.4 },
            { x: gridSize * 0.35, y: -gridSize * 0.4, size: 0.5 },
            { x: -gridSize * 0.3, y: gridSize * 0.4, size: 0.3 },
            { x: gridSize * 0.4, y: gridSize * 0.35, size: 0.45 }
        ];
        
        trees.forEach(tree => {
            const treeX = this.x + tree.x;
            const treeY = this.y + tree.y;
            const scale = tree.size;
            
            // Pine trunk
            ctx.fillStyle = '#654321';
            ctx.fillRect(treeX - 0.5 * scale, treeY, 1 * scale, 6 * scale);
            
            // Pine layers
            const layers = [
                { y: -8 * scale, width: 5 * scale, color: '#1a4a1a' },
                { y: -6 * scale, width: 4 * scale, color: '#228B22' },
                { y: -4 * scale, width: 3 * scale, color: '#32CD32' }
            ];
            
            layers.forEach(layer => {
                ctx.fillStyle = layer.color;
                ctx.beginPath();
                ctx.moveTo(treeX, treeY + layer.y);
                ctx.lineTo(treeX - layer.width/2, treeY + layer.y + layer.width * 0.7);
                ctx.lineTo(treeX + layer.width/2, treeY + layer.y + layer.width * 0.7);
                ctx.closePath();
                ctx.fill();
            });
            
            // Highlight
            ctx.fillStyle = 'rgba(144, 238, 144, 0.2)';
            ctx.beginPath();
            ctx.moveTo(treeX - 0.5 * scale, treeY - 7 * scale);
            ctx.lineTo(treeX - 2 * scale, treeY - 5 * scale);
            ctx.lineTo(treeX + 0.5 * scale, treeY - 6 * scale);
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
