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
        
        // 3D wooden tower base (octagonal for more natural look)
        const baseRadius = towerSize * 0.4;
        const baseHeight = towerSize * 0.15;
        
        // Tower shadow (3D effect)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x + 3, this.y + baseHeight + 3, baseRadius + 2, baseRadius * 0.5 + 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Wooden base platform (3D bottom)
        const gradient = ctx.createLinearGradient(this.x - baseRadius, this.y - baseHeight, this.x + baseRadius, this.y + baseHeight);
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(0.5, '#A0522D');
        gradient.addColorStop(1, '#654321');
        
        ctx.fillStyle = gradient;
        this.drawOctagon(ctx, this.x, this.y, baseRadius);
        
        // Platform edge (3D effect)
        ctx.fillStyle = '#654321';
        ctx.strokeStyle = '#5D4E37';
        ctx.lineWidth = 2;
        this.drawOctagon(ctx, this.x, this.y, baseRadius);
        ctx.stroke();
        
        // Wooden support beams
        ctx.strokeStyle = '#5D4E37';
        ctx.lineWidth = 4;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const beamX = this.x + Math.cos(angle) * baseRadius * 0.7;
            const beamY = this.y + Math.sin(angle) * baseRadius * 0.7;
            
            ctx.beginPath();
            ctx.moveTo(beamX, beamY);
            ctx.lineTo(beamX, beamY - towerSize * 0.3);
            ctx.stroke();
        }
        
        // Main tower structure (cylindrical wooden tower)
        const towerRadius = baseRadius * 0.75;
        const towerHeight = towerSize * 0.4;
        
        // Tower body gradient (3D shading)
        const towerGradient = ctx.createRadialGradient(
            this.x - towerRadius * 0.3, this.y - towerHeight * 0.3, 0,
            this.x, this.y, towerRadius
        );
        towerGradient.addColorStop(0, '#DEB887');
        towerGradient.addColorStop(0.7, '#CD853F');
        towerGradient.addColorStop(1, '#8B7355');
        
        ctx.fillStyle = towerGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y - towerHeight, towerRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Tower wooden planks (horizontal lines for texture)
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 5; i++) {
            const plankY = this.y - towerHeight + (towerRadius * 2 * i / 6) - towerRadius;
            ctx.beginPath();
            ctx.arc(this.x, plankY, towerRadius - 2, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Tower rim/parapet
        ctx.fillStyle = '#A0522D';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y - towerHeight, towerRadius + 3, 0, Math.PI * 2);
        ctx.stroke();
        
        // Wooden crenellations (merlons)
        ctx.fillStyle = '#A0522D';
        for (let i = 0; i < 12; i++) {
            if (i % 2 === 0) { // Only every other segment for crenellation effect
                const angle = (i / 12) * Math.PI * 2;
                const merlonX = this.x + Math.cos(angle) * (towerRadius + 1);
                const merlonY = this.y - towerHeight + Math.sin(angle) * (towerRadius + 1);
                
                ctx.save();
                ctx.translate(merlonX, merlonY);
                ctx.rotate(angle + Math.PI / 2);
                ctx.fillRect(-3, -8, 6, 8);
                ctx.strokeRect(-3, -8, 6, 8);
                ctx.restore();
            }
        }
        
        // Render defenders on the tower
        this.defenders.forEach((defender, index) => {
            ctx.save();
            
            const defenderRadius = towerRadius * 0.8;
            const defenderX = this.x + Math.cos(defender.angle) * defenderRadius;
            const defenderY = this.y - towerHeight + Math.sin(defender.angle) * defenderRadius;
            
            ctx.translate(defenderX, defenderY);
            
            // Defender body (simple figure)
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-2, -3, 4, 6); // Torso
            
            // Defender head
            ctx.fillStyle = '#DDBEA9';
            ctx.beginPath();
            ctx.arc(0, -5, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Helmet
            ctx.fillStyle = '#696969';
            ctx.beginPath();
            ctx.arc(0, -5, 2.5, Math.PI, Math.PI * 2);
            ctx.fill();
            
            // Arms - animate throwing motion
            ctx.strokeStyle = '#DDBEA9';
            ctx.lineWidth = 2;
            
            // Throwing arm
            const armAngle = this.target && index === this.throwingDefender ? 
                -Math.PI / 3 - defender.armRaised * Math.PI / 4 : 
                Math.sin(Date.now() * 0.001 + index) * 0.2;
            
            ctx.beginPath();
            ctx.moveTo(0, -1);
            ctx.lineTo(Math.cos(armAngle) * 4, -1 + Math.sin(armAngle) * 4);
            ctx.stroke();
            
            // Other arm
            ctx.beginPath();
            ctx.moveTo(0, -1);
            ctx.lineTo(-3, 1);
            ctx.stroke();
            
            // If throwing, show rock in hand briefly
            if (defender.armRaised > 0.7) {
                const rockX = Math.cos(armAngle) * 5;
                const rockY = -1 + Math.sin(armAngle) * 5;
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
    
    drawOctagon(ctx, centerX, centerY, radius) {
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
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
