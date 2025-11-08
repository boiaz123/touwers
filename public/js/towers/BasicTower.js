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
        
        // Tower dimensions for 3D appearance
        const baseWidth = gridSize * 0.5;
        const baseDepth = gridSize * 0.4;
        const baseHeight = gridSize * 0.15;
        const towerWidth = gridSize * 0.35;
        const towerDepth = gridSize * 0.25;
        const towerHeight = gridSize * 0.7;
        const platformHeight = gridSize * 0.1;
        const roofHeight = gridSize * 0.15;
        
        // Draw trees at base level within the grid
        this.drawBaseTrees(ctx, gridSize);
        
        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.save();
        ctx.translate(this.x + 5, this.y + 8);
        ctx.scale(1, 0.5);
        ctx.fillRect(-baseWidth/2, -baseDepth/2, baseWidth, baseDepth + baseHeight + towerHeight);
        ctx.restore();
        
        // Stone base - draw from bottom up
        const baseY = this.y;
        
        // Base front face
        const baseGradient = ctx.createLinearGradient(0, 0, 0, baseHeight);
        baseGradient.addColorStop(0, '#A9A9A9');
        baseGradient.addColorStop(1, '#696969');
        ctx.fillStyle = baseGradient;
        ctx.fillRect(this.x - baseWidth/2, baseY, baseWidth, baseHeight);
        
        // Stone texture on front face
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 1;
        for (let i = 1; i < 3; i++) {
            const y = baseY + (baseHeight * i / 3);
            ctx.beginPath();
            ctx.moveTo(this.x - baseWidth/2, y);
            ctx.lineTo(this.x + baseWidth/2, y);
            ctx.stroke();
        }
        for (let i = 1; i < 4; i++) {
            const x = this.x - baseWidth/2 + (baseWidth * i / 4);
            ctx.beginPath();
            ctx.moveTo(x, baseY);
            ctx.lineTo(x, baseY + baseHeight);
            ctx.stroke();
        }
        
        // Base right side (3D effect)
        ctx.fillStyle = '#808080';
        ctx.beginPath();
        ctx.moveTo(this.x + baseWidth/2, baseY);
        ctx.lineTo(this.x + baseWidth/2 + baseDepth/2, baseY - baseDepth/4);
        ctx.lineTo(this.x + baseWidth/2 + baseDepth/2, baseY - baseDepth/4 + baseHeight);
        ctx.lineTo(this.x + baseWidth/2, baseY + baseHeight);
        ctx.closePath();
        ctx.fill();
        
        // Base top surface
        ctx.fillStyle = '#D3D3D3';
        ctx.beginPath();
        ctx.moveTo(this.x - baseWidth/2, baseY);
        ctx.lineTo(this.x - baseWidth/2 + baseDepth/2, baseY - baseDepth/4);
        ctx.lineTo(this.x + baseWidth/2 + baseDepth/2, baseY - baseDepth/4);
        ctx.lineTo(this.x + baseWidth/2, baseY);
        ctx.closePath();
        ctx.fill();
        
        // Stone lines on top
        ctx.strokeStyle = '#A9A9A9';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x - baseWidth/4, baseY - baseDepth/8);
        ctx.lineTo(this.x + baseWidth/4, baseY - baseDepth/8);
        ctx.stroke();
        
        // Wooden tower structure
        const towerY = baseY - towerHeight;
        
        // Tower front face
        const towerGradient = ctx.createLinearGradient(0, towerY, 0, baseY);
        towerGradient.addColorStop(0, '#DEB887');
        towerGradient.addColorStop(1, '#A0522D');
        ctx.fillStyle = towerGradient;
        ctx.fillRect(this.x - towerWidth/2, towerY, towerWidth, towerHeight);
        
        // Wooden planks on front
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        for (let i = 1; i < 6; i++) {
            const y = towerY + (towerHeight * i / 6);
            ctx.beginPath();
            ctx.moveTo(this.x - towerWidth/2, y);
            ctx.lineTo(this.x + towerWidth/2, y);
            ctx.stroke();
        }
        
        // Vertical support beams on front
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 3;
        const beamPositions = [-towerWidth/3, 0, towerWidth/3];
        beamPositions.forEach(pos => {
            ctx.beginPath();
            ctx.moveTo(this.x + pos, towerY);
            ctx.lineTo(this.x + pos, baseY);
            ctx.stroke();
        });
        
        // Tower right side (3D effect)
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.moveTo(this.x + towerWidth/2, towerY);
        ctx.lineTo(this.x + towerWidth/2 + towerDepth/2, towerY - towerDepth/4);
        ctx.lineTo(this.x + towerWidth/2 + towerDepth/2, baseY - towerDepth/4);
        ctx.lineTo(this.x + towerWidth/2, baseY);
        ctx.closePath();
        ctx.fill();
        
        // Side planks
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        for (let i = 1; i < 6; i++) {
            const y1 = towerY + (towerHeight * i / 6);
            const y2 = baseY - towerDepth/4 + (towerHeight * i / 6);
            ctx.beginPath();
            ctx.moveTo(this.x + towerWidth/2, y1);
            ctx.lineTo(this.x + towerWidth/2 + towerDepth/2, y2);
            ctx.stroke();
        }
        
        // Platform
        const platformY = towerY - platformHeight;
        const platformWidth = towerWidth * 1.2;
        const platformDepth = towerDepth * 1.2;
        
        // Platform front edge
        ctx.fillStyle = '#CD853F';
        ctx.fillRect(this.x - platformWidth/2, platformY, platformWidth, platformHeight);
        
        // Platform right side
        ctx.fillStyle = '#A0522D';
        ctx.beginPath();
        ctx.moveTo(this.x + platformWidth/2, platformY);
        ctx.lineTo(this.x + platformWidth/2 + platformDepth/2, platformY - platformDepth/4);
        ctx.lineTo(this.x + platformWidth/2 + platformDepth/2, platformY - platformDepth/4 + platformHeight);
        ctx.lineTo(this.x + platformWidth/2, platformY + platformHeight);
        ctx.closePath();
        ctx.fill();
        
        // Platform top surface
        ctx.fillStyle = '#DEB887';
        ctx.beginPath();
        ctx.moveTo(this.x - platformWidth/2, platformY);
        ctx.lineTo(this.x - platformWidth/2 + platformDepth/2, platformY - platformDepth/4);
        ctx.lineTo(this.x + platformWidth/2 + platformDepth/2, platformY - platformDepth/4);
        ctx.lineTo(this.x + platformWidth/2, platformY);
        ctx.closePath();
        ctx.fill();
        
        // Platform planks
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 1;
        for (let i = 1; i < 5; i++) {
            const ratio = i / 5;
            ctx.beginPath();
            ctx.moveTo(
                this.x - platformWidth/2 + platformDepth/2 * ratio,
                platformY - platformDepth/4 * ratio
            );
            ctx.lineTo(
                this.x + platformWidth/2 + platformDepth/2 * ratio,
                platformY - platformDepth/4 * ratio
            );
            ctx.stroke();
        }
        
        // Simple roof
        const roofY = platformY - roofHeight;
        const roofWidth = platformWidth * 0.8;
        const roofDepth = platformDepth * 0.8;
        
        // Roof support posts
        ctx.fillStyle = '#654321';
        const postPositions = [
            { x: -roofWidth/3, depth: -roofDepth/3 },
            { x: roofWidth/3, depth: -roofDepth/3 },
            { x: -roofWidth/3, depth: roofDepth/3 },
            { x: roofWidth/3, depth: roofDepth/3 }
        ];
        
        postPositions.forEach(pos => {
            ctx.fillRect(
                this.x + pos.x + pos.depth/2,
                platformY + pos.depth/4 - roofHeight,
                3,
                roofHeight
            );
        });
        
        // Roof top surface
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.moveTo(this.x - roofWidth/2, roofY);
        ctx.lineTo(this.x - roofWidth/2 + roofDepth/2, roofY - roofDepth/4);
        ctx.lineTo(this.x + roofWidth/2 + roofDepth/2, roofY - roofDepth/4);
        ctx.lineTo(this.x + roofWidth/2, roofY);
        ctx.closePath();
        ctx.fill();
        
        // Roof edge
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Render defender on platform
        const defenderX = this.x;
        const defenderY = platformY - 12;
        
        ctx.save();
        ctx.translate(defenderX, defenderY);
        
        // Face target if exists
        if (this.target) {
            const targetAngle = Math.atan2(this.target.y - defenderY, this.target.x - defenderX);
            ctx.rotate(targetAngle + Math.PI/2); // Adjust for front-facing
        }
        
        // Defender body
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-3, 0, 6, 10);
        
        // Head
        ctx.fillStyle = '#DDBEA9';
        ctx.beginPath();
        ctx.arc(0, -2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Helmet
        ctx.fillStyle = '#696969';
        ctx.beginPath();
        ctx.arc(0, -2, 3.5, Math.PI, Math.PI * 2);
        ctx.fill();
        
        // Arms
        ctx.strokeStyle = '#DDBEA9';
        ctx.lineWidth = 3;
        
        const throwingDefender = this.defenders[0];
        const armAngle = this.target && this.throwingDefender === 0 ? 
            -Math.PI / 2 - throwingDefender.armRaised * Math.PI / 3 : 
            Math.sin(Date.now() * 0.002) * 0.3;
        
        // Throwing arm
        ctx.beginPath();
        ctx.moveTo(-2, 2);
        ctx.lineTo(-2 + Math.cos(armAngle) * 4, 2 + Math.sin(armAngle) * 4);
        ctx.stroke();
        
        // Other arm
        ctx.beginPath();
        ctx.moveTo(2, 2);
        ctx.lineTo(5, 5);
        ctx.stroke();
        
        // Rock in hand when ready to throw
        if (throwingDefender.armRaised > 0.5) {
            const rockX = -2 + Math.cos(armAngle) * 5;
            const rockY = 2 + Math.sin(armAngle) * 5;
            ctx.fillStyle = '#696969';
            ctx.beginPath();
            ctx.arc(rockX, rockY, 1.5, 0, Math.PI * 2);
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
    
    drawBaseTrees(ctx, gridSize) {
        // Trees positioned around the base at ground level
        const trees = [
            { x: -gridSize * 0.4, y: gridSize * 0.3, size: 0.7 },
            { x: gridSize * 0.35, y: gridSize * 0.35, size: 0.8 },
            { x: -gridSize * 0.35, y: -gridSize * 0.4, size: 0.6 },
            { x: gridSize * 0.4, y: -gridSize * 0.3, size: 0.9 }
        ];
        
        trees.forEach(tree => {
            const treeX = this.x + tree.x;
            const treeY = this.y + tree.y;
            const scale = tree.size;
            
            // Tree shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.save();
            ctx.translate(treeX + 3, treeY + 3);
            ctx.scale(1, 0.3);
            ctx.fillRect(-3 * scale, -2 * scale, 6 * scale, 4 * scale);
            ctx.restore();
            
            // Tree trunk
            ctx.fillStyle = '#654321';
            ctx.fillRect(treeX - 1.5 * scale, treeY, 3 * scale, -8 * scale);
            
            // Trunk texture
            ctx.strokeStyle = '#5D4037';
            ctx.lineWidth = 1;
            for (let i = 1; i < 3; i++) {
                const lineY = treeY - (8 * scale * i / 3);
                ctx.beginPath();
                ctx.moveTo(treeX - 1.5 * scale, lineY);
                ctx.lineTo(treeX + 1.5 * scale, lineY);
                ctx.stroke();
            }
            
            // Pine tree layers
            const layers = [
                { y: -12 * scale, width: 10 * scale, color: '#0F3B0F' },
                { y: -9 * scale, width: 8 * scale, color: '#1a4a1a' },
                { y: -6 * scale, width: 6 * scale, color: '#228B22' },
                { y: -3 * scale, width: 4 * scale, color: '#32CD32' }
            ];
            
            layers.forEach(layer => {
                ctx.fillStyle = layer.color;
                ctx.beginPath();
                ctx.moveTo(treeX, treeY + layer.y);
                ctx.lineTo(treeX - layer.width/2, treeY + layer.y + layer.width * 0.6);
                ctx.lineTo(treeX + layer.width/2, treeY + layer.y + layer.width * 0.6);
                ctx.closePath();
                ctx.fill();
                
                // Tree outline
                ctx.strokeStyle = '#0F3B0F';
                ctx.lineWidth = 1;
                ctx.stroke();
            });
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
