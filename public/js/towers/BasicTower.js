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
        
        // Tower dimensions
        const baseSize = gridSize * 0.7;
        const platformSize = gridSize * 0.6;
        const towerHeight = gridSize * 0.9;
        const platformHeight = gridSize * 0.6;
        const roofHeight = gridSize * 0.2;
        
        // Draw trees at base level within the grid
        this.drawBaseTrees(ctx, gridSize);
        
        // Draw tower shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.save();
        ctx.setTransform(1, 0.5, 0, 0.5, this.x + 4, this.y + 4);
        ctx.fillRect(-baseSize/2, -baseSize/2, baseSize, baseSize);
        ctx.restore();
        
        // Stone base - isometric view
        const baseY = this.y;
        
        // Base top surface
        ctx.save();
        ctx.setTransform(1, 0.5, 0, 0.5, this.x, baseY);
        
        const stoneGradient = ctx.createLinearGradient(-baseSize/2, -baseSize/2, baseSize/2, baseSize/2);
        stoneGradient.addColorStop(0, '#D3D3D3');
        stoneGradient.addColorStop(0.5, '#A9A9A9');
        stoneGradient.addColorStop(1, '#808080');
        ctx.fillStyle = stoneGradient;
        ctx.fillRect(-baseSize/2, -baseSize/2, baseSize, baseSize);
        
        // Stone texture lines
        ctx.strokeStyle = '#696969';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const lineY = -baseSize/2 + (baseSize * i / 4);
            ctx.beginPath();
            ctx.moveTo(-baseSize/2, lineY);
            ctx.lineTo(baseSize/2, lineY);
            ctx.stroke();
        }
        for (let i = 1; i < 4; i++) {
            const lineX = -baseSize/2 + (baseSize * i / 4);
            ctx.beginPath();
            ctx.moveTo(lineX, -baseSize/2);
            ctx.lineTo(lineX, baseSize/2);
            ctx.stroke();
        }
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 2;
        ctx.strokeRect(-baseSize/2, -baseSize/2, baseSize, baseSize);
        ctx.restore();
        
        // Stone base left side
        ctx.save();
        ctx.setTransform(0, 0.5, -1, 0.5, this.x, baseY);
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, baseSize/2, 15);
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, baseSize/2, 15);
        ctx.restore();
        
        // Stone base right side
        ctx.save();
        ctx.setTransform(1, 0.5, 0, 0.5, this.x, baseY);
        ctx.fillStyle = '#696969';
        ctx.fillRect(baseSize/2, 0, 4, 15);
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.strokeRect(baseSize/2, 0, 4, 15);
        ctx.restore();
        
        // Wooden support beams (4 corner posts)
        const beamWidth = 6;
        const beamPositions = [
            { x: -platformSize/2 + beamWidth/2, y: -platformSize/2 + beamWidth/2 },
            { x: platformSize/2 - beamWidth/2, y: -platformSize/2 + beamWidth/2 },
            { x: -platformSize/2 + beamWidth/2, y: platformSize/2 - beamWidth/2 },
            { x: platformSize/2 - beamWidth/2, y: platformSize/2 - beamWidth/2 }
        ];
        
        beamPositions.forEach(pos => {
            // Beam shadow side
            ctx.fillStyle = '#654321';
            ctx.fillRect(this.x + pos.x + 1, baseY + pos.y - platformHeight, beamWidth-1, platformHeight);
            
            // Beam main side
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x + pos.x, baseY + pos.y - platformHeight, beamWidth-1, platformHeight);
            
            // Wood grain
            ctx.strokeStyle = '#5D4037';
            ctx.lineWidth = 1;
            for (let i = 1; i < 5; i++) {
                const grainY = baseY + pos.y - platformHeight + (platformHeight * i / 5);
                ctx.beginPath();
                ctx.moveTo(this.x + pos.x, grainY);
                ctx.lineTo(this.x + pos.x + beamWidth-1, grainY);
                ctx.stroke();
            }
        });
        
        // Wooden platform
        const platformY = baseY - platformHeight;
        
        // Platform top surface
        ctx.save();
        ctx.setTransform(1, 0.5, 0, 0.5, this.x, platformY);
        
        const woodGradient = ctx.createLinearGradient(-platformSize/2, -platformSize/2, platformSize/2, platformSize/2);
        woodGradient.addColorStop(0, '#DEB887');
        woodGradient.addColorStop(0.5, '#D2B48C');
        woodGradient.addColorStop(1, '#BC9A6A');
        ctx.fillStyle = woodGradient;
        ctx.fillRect(-platformSize/2, -platformSize/2, platformSize, platformSize);
        
        // Platform planks
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 1;
        for (let i = 1; i < 6; i++) {
            const plankX = -platformSize/2 + (platformSize * i / 6);
            ctx.beginPath();
            ctx.moveTo(plankX, -platformSize/2);
            ctx.lineTo(plankX, platformSize/2);
            ctx.stroke();
        }
        
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(-platformSize/2, -platformSize/2, platformSize, platformSize);
        ctx.restore();
        
        // Simple roof structure
        const roofY = platformY - roofHeight;
        const roofSize = platformSize * 0.8;
        
        // Roof top
        ctx.save();
        ctx.setTransform(1, 0.5, 0, 0.5, this.x, roofY);
        
        const roofGradient = ctx.createLinearGradient(-roofSize/2, -roofSize/2, roofSize/2, roofSize/2);
        roofGradient.addColorStop(0, '#8B4513');
        roofGradient.addColorStop(1, '#654321');
        ctx.fillStyle = roofGradient;
        ctx.fillRect(-roofSize/2, -roofSize/2, roofSize, roofSize);
        
        // Roof planks
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const roofPlankY = -roofSize/2 + (roofSize * i / 4);
            ctx.beginPath();
            ctx.moveTo(-roofSize/2, roofPlankY);
            ctx.lineTo(roofSize/2, roofPlankY);
            ctx.stroke();
        }
        
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.strokeRect(-roofSize/2, -roofSize/2, roofSize, roofSize);
        ctx.restore();
        
        // Roof supports (4 small posts)
        const roofPostSize = 3;
        const roofPostPositions = [
            { x: -roofSize/3, y: -roofSize/3 },
            { x: roofSize/3, y: -roofSize/3 },
            { x: -roofSize/3, y: roofSize/3 },
            { x: roofSize/3, y: roofSize/3 }
        ];
        
        roofPostPositions.forEach(pos => {
            ctx.fillStyle = '#654321';
            ctx.fillRect(this.x + pos.x, platformY + pos.y - roofHeight, roofPostSize, roofHeight);
        });
        
        // Render single defender on the platform
        const defenderX = this.x;
        const defenderY = platformY - 8;
        
        ctx.save();
        ctx.translate(defenderX, defenderY);
        
        // Face target if exists
        if (this.target) {
            const targetAngle = Math.atan2(this.target.y - defenderY, this.target.x - defenderX);
            ctx.rotate(targetAngle);
        }
        
        // Defender body
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-3, -5, 6, 8);
        
        // Head
        ctx.fillStyle = '#DDBEA9';
        ctx.beginPath();
        ctx.arc(0, -8, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Helmet
        ctx.fillStyle = '#696969';
        ctx.beginPath();
        ctx.arc(0, -8, 3.5, Math.PI, Math.PI * 2);
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
        ctx.moveTo(0, -4);
        ctx.lineTo(Math.cos(armAngle) * 4, -4 + Math.sin(armAngle) * 4);
        ctx.stroke();
        
        // Other arm
        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.lineTo(-3, -1);
        ctx.stroke();
        
        // Rock in hand when ready to throw
        if (throwingDefender.armRaised > 0.5) {
            const rockX = Math.cos(armAngle) * 5;
            const rockY = -4 + Math.sin(armAngle) * 5;
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
        // Trees positioned at base level within the 2x2 grid
        const trees = [
            { x: -gridSize * 0.35, y: -gridSize * 0.4, size: 0.8 },
            { x: gridSize * 0.4, y: -gridSize * 0.35, size: 0.7 },
            { x: -gridSize * 0.4, y: gridSize * 0.35, size: 0.6 },
            { x: gridSize * 0.35, y: gridSize * 0.4, size: 0.9 }
        ];
        
        trees.forEach(tree => {
            const treeX = this.x + tree.x;
            const treeY = this.y + tree.y;
            const scale = tree.size;
            
            // Tree shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.save();
            ctx.setTransform(1, 0.5, 0, 0.5, treeX + 2, treeY + 2);
            ctx.fillRect(-2 * scale, -2 * scale, 4 * scale, 4 * scale);
            ctx.restore();
            
            // Tree trunk
            ctx.fillStyle = '#654321';
            ctx.fillRect(treeX - 1.5 * scale, treeY - 3 * scale, 3 * scale, 12 * scale);
            
            // Trunk texture
            ctx.strokeStyle = '#5D4037';
            ctx.lineWidth = 1;
            for (let i = 1; i < 4; i++) {
                const lineY = treeY - 3 * scale + (12 * scale * i / 4);
                ctx.beginPath();
                ctx.moveTo(treeX - 1.5 * scale, lineY);
                ctx.lineTo(treeX + 1.5 * scale, lineY);
                ctx.stroke();
            }
            
            // Pine tree layers (4 triangular sections for bigger trees)
            const layers = [
                { y: -16 * scale, width: 12 * scale, color: '#0F3B0F' },
                { y: -12 * scale, width: 10 * scale, color: '#1a4a1a' },
                { y: -8 * scale, width: 8 * scale, color: '#228B22' },
                { y: -4 * scale, width: 6 * scale, color: '#32CD32' }
            ];
            
            layers.forEach((layer, index) => {
                ctx.fillStyle = layer.color;
                ctx.beginPath();
                ctx.moveTo(treeX, treeY + layer.y);
                ctx.lineTo(treeX - layer.width/2, treeY + layer.y + layer.width * 0.7);
                ctx.lineTo(treeX + layer.width/2, treeY + layer.y + layer.width * 0.7);
                ctx.closePath();
                ctx.fill();
                
                // Tree outline
                ctx.strokeStyle = '#0F3B0F';
                ctx.lineWidth = 1;
                ctx.stroke();
            });
            
            // Tree highlights
            ctx.fillStyle = 'rgba(144, 238, 144, 0.2)';
            ctx.beginPath();
            ctx.moveTo(treeX - 1 * scale, treeY - 14 * scale);
            ctx.lineTo(treeX - 4 * scale, treeY - 8 * scale);
            ctx.lineTo(treeX + 1 * scale, treeY - 10 * scale);
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
