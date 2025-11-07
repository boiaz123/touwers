export class BarricadeTower {
    constructor(x, y, gridX, gridY) {
        this.x = x;
        this.y = y;
        this.gridX = gridX;
        this.gridY = gridY;
        this.range = 100;
        this.damage = 5;
        this.fireRate = 0.6;
        this.cooldown = 0;
        this.target = null;
        
        // Animation properties
        this.defenders = [
            { angle: 0, throwAnimation: 0, carryingDebris: true },
            { angle: Math.PI / 2, throwAnimation: 0, carryingDebris: true },
            { angle: Math.PI, throwAnimation: 0, carryingDebris: false },
            { angle: 3 * Math.PI / 2, throwAnimation: 0, carryingDebris: false }
        ];
        this.debris = [];
        this.slowZones = [];
        this.animationTime = 0;
    }
    
    update(deltaTime, enemies) {
        this.cooldown = Math.max(0, this.cooldown - deltaTime);
        this.animationTime += deltaTime;
        
        this.target = this.findTarget(enemies);
        
        // Update defenders
        this.defenders.forEach(defender => {
            defender.throwAnimation = Math.max(0, defender.throwAnimation - deltaTime * 2);
            
            if (this.target) {
                const targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                const angleDiff = targetAngle - defender.angle;
                defender.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), deltaTime * 1.5);
            }
        });
        
        if (this.target && this.cooldown === 0) {
            this.shoot();
            this.cooldown = 1 / this.fireRate;
        }
        
        // Update flying debris
        this.debris = this.debris.filter(item => {
            item.x += item.vx * deltaTime;
            item.y += item.vy * deltaTime;
            item.vy += 150 * deltaTime; // Gravity
            item.rotation += item.rotationSpeed * deltaTime;
            item.life -= deltaTime;
            
            // Check if debris hits ground
            if (item.life <= 0 || item.y >= item.targetY) {
                this.createSlowZone(item.targetX, item.targetY);
                return false;
            }
            return true;
        });
        
        // Update slow zones and apply effects
        this.slowZones = this.slowZones.filter(zone => {
            zone.life -= deltaTime;
            
            // Apply slow effect to enemies in zone
            enemies.forEach(enemy => {
                // Ensure enemy has originalSpeed property
                if (!enemy.hasOwnProperty('originalSpeed')) {
                    enemy.originalSpeed = enemy.speed;
                }
                
                const distance = Math.hypot(enemy.x - zone.x, enemy.y - zone.y);
                if (distance <= zone.radius) {
                    // Apply slow effect gradually
                    const targetSpeed = enemy.originalSpeed * 0.3;
                    const slowRate = 1 - Math.pow(0.1, deltaTime); // Exponential approach
                    enemy.speed = enemy.speed + (targetSpeed - enemy.speed) * slowRate;
                } else {
                    // Gradually restore speed when outside zone
                    if (enemy.speed < enemy.originalSpeed) {
                        const restoreRate = 1 - Math.pow(0.2, deltaTime);
                        enemy.speed = enemy.speed + (enemy.originalSpeed - enemy.speed) * restoreRate;
                    }
                }
            });
            
            return zone.life > 0;
        });
        
        // Restore speed for enemies not in any slow zone
        if (this.slowZones.length === 0) {
            enemies.forEach(enemy => {
                if (enemy.hasOwnProperty('originalSpeed') && enemy.speed < enemy.originalSpeed) {
                    const restoreRate = 1 - Math.pow(0.2, deltaTime);
                    enemy.speed = enemy.speed + (enemy.originalSpeed - enemy.speed) * restoreRate;
                }
            });
        }
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
            
            // Find a defender with debris to throw
            const availableDefenders = this.defenders.filter(def => def.carryingDebris);
            if (availableDefenders.length > 0) {
                const thrower = availableDefenders[Math.floor(Math.random() * availableDefenders.length)];
                thrower.throwAnimation = 1;
                thrower.carryingDebris = false;
                
                // Create debris projectile
                const dx = this.target.x - this.x;
                const dy = this.target.y - this.y;
                const distance = Math.hypot(dx, dy);
                const throwSpeed = 200;
                const arcHeight = distance * 0.2;
                
                const debrisType = Math.random() < 0.5 ? 'barrel' : 'rock';
                
                this.debris.push({
                    x: this.x + Math.cos(thrower.angle) * 20,
                    y: this.y + Math.sin(thrower.angle) * 20 - 15,
                    vx: (dx / distance) * throwSpeed,
                    vy: (dy / distance) * throwSpeed - arcHeight,
                    rotation: 0,
                    rotationSpeed: Math.random() * 8 + 4,
                    life: distance / throwSpeed + 1,
                    targetX: this.target.x,
                    targetY: this.target.y,
                    type: debrisType,
                    size: Math.random() * 3 + 5
                });
                
                // Defender will get new debris after a delay
                setTimeout(() => {
                    if (thrower) { // Check if thrower still exists
                        thrower.carryingDebris = true;
                    }
                }, 2000 + Math.random() * 1000);
            }
        }
    }
    
    createSlowZone(x, y) {
        this.slowZones.push({
            x: x,
            y: y,
            radius: 30,
            life: 5.0,
            maxLife: 5.0
        });
    }
    
    render(ctx) {
        const baseResolution = 1920;
        const scaleFactor = Math.max(0.5, Math.min(2.5, ctx.canvas.width / baseResolution));
        const cellSize = Math.floor(32 * scaleFactor);
        const towerSize = cellSize * 2;
        
        // Tower shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x - towerSize * 0.3 + 3, this.y - towerSize * 0.2 + 3, towerSize * 0.6, towerSize * 0.6);
        
        // Wooden barricade base
        const baseWidth = towerSize * 0.6;
        const baseHeight = towerSize * 0.4;
        
        // Main barricade structure
        const gradient = ctx.createLinearGradient(
            this.x - baseWidth/2, this.y - baseHeight,
            this.x + baseWidth/2, this.y
        );
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(0.5, '#A0522D');
        gradient.addColorStop(1, '#654321');
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = '#5D4E37';
        ctx.lineWidth = 3;
        ctx.fillRect(this.x - baseWidth/2, this.y - baseHeight, baseWidth, baseHeight);
        ctx.strokeRect(this.x - baseWidth/2, this.y - baseHeight, baseWidth, baseHeight);
        
        // Wooden planks texture
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const plankY = this.y - baseHeight + (baseHeight * i / 4);
            ctx.beginPath();
            ctx.moveTo(this.x - baseWidth/2, plankY);
            ctx.lineTo(this.x + baseWidth/2, plankY);
            ctx.stroke();
        }
        
        // Corner posts
        const postWidth = baseWidth * 0.08;
        ctx.fillStyle = '#654321';
        for (let side = -1; side <= 1; side += 2) {
            const postX = this.x + side * (baseWidth/2 - postWidth/2);
            ctx.fillRect(postX, this.y - baseHeight - 10, postWidth, baseHeight + 10);
            ctx.strokeRect(postX, this.y - baseHeight - 10, postWidth, baseHeight + 10);
        }
        
        // Debris storage piles
        for (let i = 0; i < 3; i++) {
            const pileX = this.x - baseWidth/3 + (i * baseWidth/3);
            const pileY = this.y - baseHeight * 0.2;
            
            // Barrel pile
            if (i === 0) {
                ctx.fillStyle = '#8B4513';
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 2;
                for (let j = 0; j < 2; j++) {
                    const barrelX = pileX + j * 8;
                    const barrelY = pileY - j * 6;
                    ctx.fillRect(barrelX - 6, barrelY - 8, 12, 16);
                    ctx.strokeRect(barrelX - 6, barrelY - 8, 12, 16);
                    
                    // Barrel bands
                    ctx.strokeStyle = '#2F2F2F';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(barrelX - 6, barrelY - 2);
                    ctx.lineTo(barrelX + 6, barrelY - 2);
                    ctx.moveTo(barrelX - 6, barrelY + 2);
                    ctx.lineTo(barrelX + 6, barrelY + 2);
                    ctx.stroke();
                }
            }
            // Rock pile
            else if (i === 2) {
                for (let j = 0; j < 4; j++) {
                    const rockX = pileX + (j % 2) * 8 - 4;
                    const rockY = pileY - Math.floor(j / 2) * 6;
                    const rockSize = 4 + Math.random() * 3;
                    
                    ctx.fillStyle = '#696969';
                    ctx.strokeStyle = '#2F2F2F';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(rockX, rockY, rockSize, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }
            }
        }
        
        // Render defenders
        this.defenders.forEach((defender, index) => {
            ctx.save();
            
            const defenderRadius = baseWidth * 0.3;
            const defenderX = this.x + Math.cos(defender.angle) * defenderRadius;
            const defenderY = this.y - baseHeight * 0.7 + Math.sin(defender.angle) * defenderRadius;
            
            ctx.translate(defenderX, defenderY);
            
            // Defender body
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-3, -5, 6, 10);
            
            // Defender head
            ctx.fillStyle = '#DDBEA9';
            ctx.beginPath();
            ctx.arc(0, -7, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Simple helmet
            ctx.fillStyle = '#696969';
            ctx.beginPath();
            ctx.arc(0, -7, 3.5, Math.PI, Math.PI * 2);
            ctx.fill();
            
            // Arms
            ctx.strokeStyle = '#DDBEA9';
            ctx.lineWidth = 3;
            
            const armAngle = defender.throwAnimation * Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(0, -2);
            ctx.lineTo(Math.cos(armAngle) * 6, -2 + Math.sin(armAngle) * 6);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, -2);
            ctx.lineTo(-4, 2);
            ctx.stroke();
            
            // Debris in hand if carrying
            if (defender.carryingDebris && defender.throwAnimation < 0.5) {
                const debrisX = Math.cos(armAngle) * 7;
                const debrisY = -2 + Math.sin(armAngle) * 7;
                
                if (Math.random() < 0.5) {
                    // Barrel
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(debrisX - 3, debrisY - 4, 6, 8);
                    ctx.strokeRect(debrisX - 3, debrisY - 4, 6, 8);
                } else {
                    // Rock
                    ctx.fillStyle = '#696969';
                    ctx.beginPath();
                    ctx.arc(debrisX, debrisY, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }
            }
            
            ctx.restore();
        });
        
        // Render flying debris
        this.debris.forEach(item => {
            ctx.save();
            ctx.translate(item.x, item.y);
            ctx.rotate(item.rotation);
            
            if (item.type === 'barrel') {
                ctx.fillStyle = '#8B4513';
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 2;
                ctx.fillRect(-item.size/2, -item.size, item.size, item.size * 2);
                ctx.strokeRect(-item.size/2, -item.size, item.size, item.size * 2);
                
                // Barrel bands
                ctx.strokeStyle = '#2F2F2F';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-item.size/2, -item.size/4);
                ctx.lineTo(item.size/2, -item.size/4);
                ctx.moveTo(-item.size/2, item.size/4);
                ctx.lineTo(item.size/2, item.size/4);
                ctx.stroke();
            } else {
                ctx.fillStyle = '#696969';
                ctx.strokeStyle = '#2F2F2F';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(0, 0, item.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
            
            ctx.restore();
        });
        
        // Render slow zones
        this.slowZones.forEach(zone => {
            const alpha = zone.life / zone.maxLife;
            
            // Debris scatter on ground
            ctx.fillStyle = `rgba(139, 69, 19, ${alpha * 0.6})`;
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const distance = Math.random() * zone.radius;
                const debrisX = zone.x + Math.cos(angle) * distance;
                const debrisY = zone.y + Math.sin(angle) * distance;
                const debrisSize = Math.random() * 4 + 2;
                
                ctx.beginPath();
                ctx.arc(debrisX, debrisY, debrisSize, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Slow zone indicator
            ctx.strokeStyle = `rgba(139, 69, 19, ${alpha * 0.4})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
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
    
    static getInfo() {
        return {
            name: 'Barricade Tower',
            description: 'Defenders throw debris to slow enemies and create obstacles.',
            damage: '5',
            range: '100',
            fireRate: '0.6/sec',
            cost: 90
        };
    }
}
