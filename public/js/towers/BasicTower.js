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
        
        // Isometric tower dimensions
        const towerBaseWidth = gridSize * 0.4;
        const towerBaseDepth = gridSize * 0.3;
        const towerHeight = gridSize * 0.8;
        
        // Tower shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.save();
        ctx.setTransform(1, 0.5, 0, 0.5, this.x + 3, this.y + 3);
        ctx.fillRect(-towerBaseWidth/2, -towerBaseDepth/2, towerBaseWidth, towerBaseDepth);
        ctx.restore();
        
        // Base platform (isometric view)
        ctx.save();
        ctx.setTransform(1, 0.5, 0, 0.5, this.x, this.y);
        
        // Platform top
        const platformGradient = ctx.createLinearGradient(-towerBaseWidth/2, -towerBaseDepth/2, towerBaseWidth/2, towerBaseDepth/2);
        platformGradient.addColorStop(0, '#8B4513');
        platformGradient.addColorStop(1, '#654321');
        ctx.fillStyle = platformGradient;
        ctx.fillRect(-towerBaseWidth/2, -towerBaseDepth/2, towerBaseWidth, towerBaseDepth);
        
        // Platform edge lines
        ctx.strokeStyle = '#5D4E37';
        ctx.lineWidth = 1;
        ctx.strokeRect(-towerBaseWidth/2, -towerBaseDepth/2, towerBaseWidth, towerBaseDepth);
        
        ctx.restore();
        
        // Left face of base
        ctx.save();
        ctx.setTransform(0, 0.5, -1, 0.5, this.x, this.y);
        ctx.fillStyle = '#654321';
        ctx.fillRect(0, 0, towerBaseDepth/2, 8);
        ctx.restore();
        
        // Right face of base
        ctx.save();
        ctx.setTransform(1, 0.5, 0, 0.5, this.x, this.y);
        ctx.fillStyle = '#5D4E37';
        ctx.fillRect(towerBaseWidth/2, 0, 4, 8);
        ctx.restore();
        
        // Main tower structure
        const towerWidth = towerBaseWidth * 0.7;
        const towerDepth = towerBaseDepth * 0.7;
        const towerY = this.y - towerHeight;
        
        // Tower top face
        ctx.save();
        ctx.setTransform(1, 0.5, 0, 0.5, this.x, towerY);
        
        const towerTopGradient = ctx.createLinearGradient(-towerWidth/2, -towerDepth/2, towerWidth/2, towerDepth/2);
        towerTopGradient.addColorStop(0, '#DEB887');
        towerTopGradient.addColorStop(1, '#CD853F');
        ctx.fillStyle = towerTopGradient;
        ctx.fillRect(-towerWidth/2, -towerDepth/2, towerWidth, towerDepth);
        
        // Tower top planks
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const plankY = -towerDepth/2 + (towerDepth * i / 4);
            ctx.beginPath();
            ctx.moveTo(-towerWidth/2, plankY);
            ctx.lineTo(towerWidth/2, plankY);
            ctx.stroke();
        }
        
        ctx.restore();
        
        // Tower left face
        ctx.save();
        ctx.setTransform(0, 0.5, -1, 0.5, this.x, this.y);
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(0, -towerHeight, towerDepth/2, towerHeight);
        
        // Vertical planks on left face
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 3; i++) {
            const plankX = (towerDepth/2 * i / 4);
            ctx.beginPath();
            ctx.moveTo(plankX, -towerHeight);
            ctx.lineTo(plankX, 0);
            ctx.stroke();
        }
        
        ctx.restore();
        
        // Tower right face
        ctx.save();
        ctx.setTransform(1, 0.5, 0, 0.5, this.x, this.y);
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(towerWidth/2, -towerHeight, 6, towerHeight);
        
        // Vertical planks on right face
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 4; i++) {
            const plankY = -towerHeight + (towerHeight * i / 5);
            ctx.beginPath();
            ctx.moveTo(towerWidth/2, plankY);
            ctx.lineTo(towerWidth/2 + 6, plankY);
            ctx.stroke();
        }
        
        ctx.restore();
        
        // Battlements on tower top
        ctx.save();
        ctx.setTransform(1, 0.5, 0, 0.5, this.x, towerY - 8);
        
        ctx.fillStyle = '#8B4513';
        const battlementWidth = towerWidth / 6;
        for (let i = 0; i < 6; i += 2) {
            const battlementX = -towerWidth/2 + i * battlementWidth;
            ctx.fillRect(battlementX, -4, battlementWidth, 8);
        }
        
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.strokeRect(-towerWidth/2, -4, towerWidth, 8);
        
        ctx.restore();
        
        // Render defenders on the tower
        this.defenders.forEach((defender, index) => {
            const defenderX = this.x + Math.cos(defender.angle) * (towerWidth * 0.25);
            const defenderY = towerY + Math.sin(defender.angle) * (towerDepth * 0.15) - 5;
            
            ctx.save();
            ctx.translate(defenderX, defenderY);
            
            // Defender body
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-1.5, -4, 3, 6);
            
            // Defender head
            ctx.fillStyle = '#DDBEA9';
            ctx.beginPath();
            ctx.arc(0, -6, 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Helmet
            ctx.fillStyle = '#696969';
            ctx.beginPath();
            ctx.arc(0, -6, 2, Math.PI, Math.PI * 2);
            ctx.fill();
            
            // Arms
            ctx.strokeStyle = '#DDBEA9';
            ctx.lineWidth = 1.5;
            
            const armAngle = this.target && index === this.throwingDefender ? 
                -Math.PI / 4 - defender.armRaised * Math.PI / 6 : 
                Math.sin(Date.now() * 0.001 + index) * 0.15;
            
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
            
            // Rock in hand when throwing
            if (defender.armRaised > 0.7) {
                const rockX = Math.cos(armAngle) * 3.5;
                const rockY = -3 + Math.sin(armAngle) * 3.5;
                ctx.fillStyle = '#696969';
                ctx.beginPath();
                ctx.arc(rockX, rockY, 0.8, 0, Math.PI * 2);
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
            { x: -gridSize * 0.35, y: -gridSize * 0.25, size: 0.6 },
            { x: gridSize * 0.4, y: -gridSize * 0.3, size: 0.7 },
            { x: -gridSize * 0.25, y: gridSize * 0.35, size: 0.5 },
            { x: gridSize * 0.3, y: gridSize * 0.4, size: 0.8 }
        ];
        
        trees.forEach(tree => {
            const treeX = this.x + tree.x;
            const treeY = this.y + tree.y;
            const scale = tree.size;
            
            // Pine tree trunk
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(treeX - 1 * scale, treeY, 2 * scale, 8 * scale);
            
            // Pine tree layers (triangular sections)
            const layers = [
                { y: -12 * scale, width: 8 * scale, color: '#1a4a1a' },
                { y: -8 * scale, width: 6 * scale, color: '#228B22' },
                { y: -4 * scale, width: 4 * scale, color: '#32CD32' }
            ];
            
            layers.forEach(layer => {
                ctx.fillStyle = layer.color;
                ctx.beginPath();
                ctx.moveTo(treeX, treeY + layer.y);
                ctx.lineTo(treeX - layer.width/2, treeY + layer.y + layer.width * 0.8);
                ctx.lineTo(treeX + layer.width/2, treeY + layer.y + layer.width * 0.8);
                ctx.closePath();
                ctx.fill();
            });
            
            // Pine tree highlights
            ctx.fillStyle = 'rgba(144, 238, 144, 0.3)';
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
