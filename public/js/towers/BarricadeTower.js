export class BarricadeTower {
    constructor(x, y, gridX, gridY) {
        this.x = x;
        this.y = y;
        this.gridX = gridX;
        this.gridY = gridY;
        this.range = 120;
        this.fireRate = 0.4;
        this.cooldown = 0;
        this.target = null;
        
        // Animation properties
        this.defenders = [
            { angle: 0, pushAnimation: 0, hasBarrel: true },
            { angle: Math.PI, pushAnimation: 0, hasBarrel: true }
        ];
        this.rollingBarrels = [];
        this.slowZones = [];
        this.animationTime = 0;
    }
    
    update(deltaTime, enemies) {
        this.cooldown = Math.max(0, this.cooldown - deltaTime);
        this.animationTime += deltaTime;
        
        this.target = this.findTarget(enemies);
        
        // Update defenders
        this.defenders.forEach(defender => {
            defender.pushAnimation = Math.max(0, defender.pushAnimation - deltaTime * 2);
            
            if (this.target) {
                const targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                const angleDiff = targetAngle - defender.angle;
                const adjustedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
                defender.angle += Math.sign(adjustedDiff) * Math.min(Math.abs(adjustedDiff), deltaTime * 1.5);
            }
        });
        
        if (this.target && this.cooldown === 0) {
            this.rollBarrel();
            this.cooldown = 1 / this.fireRate;
        }
        
        // Update rolling barrels
        this.rollingBarrels = this.rollingBarrels.filter(barrel => {
            barrel.x += barrel.vx * deltaTime;
            barrel.y += barrel.vy * deltaTime;
            barrel.rotation += barrel.rotationSpeed * deltaTime;
            barrel.life -= deltaTime;
            
            // Check if barrel reaches target or expires
            const distanceToTarget = Math.hypot(barrel.x - barrel.targetX, barrel.y - barrel.targetY);
            if (barrel.life <= 0 || distanceToTarget < 15) {
                this.createSmokeZone(barrel.targetX, barrel.targetY);
                return false;
            }
            return true;
        });
        
        // Update slow zones and apply effects
        this.slowZones = this.slowZones.filter(zone => {
            zone.life -= deltaTime;
            zone.smokeIntensity = Math.min(1, zone.smokeIntensity + deltaTime * 2);
            
            // Apply slow effect to enemies in zone
            enemies.forEach(enemy => {
                if (!enemy.hasOwnProperty('originalSpeed')) {
                    enemy.originalSpeed = enemy.speed;
                }
                
                const distance = Math.hypot(enemy.x - zone.x, enemy.y - zone.y);
                if (distance <= zone.radius) {
                    const targetSpeed = enemy.originalSpeed * 0.25;
                    const slowRate = 1 - Math.pow(0.05, deltaTime);
                    enemy.speed = enemy.speed + (targetSpeed - enemy.speed) * slowRate;
                } else {
                    if (enemy.speed < enemy.originalSpeed) {
                        const restoreRate = 1 - Math.pow(0.3, deltaTime);
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
                    const restoreRate = 1 - Math.pow(0.3, deltaTime);
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
    
    rollBarrel() {
        if (this.target) {
            const availableDefenders = this.defenders.filter(def => def.hasBarrel);
            if (availableDefenders.length > 0) {
                const defender = availableDefenders[Math.floor(Math.random() * availableDefenders.length)];
                defender.pushAnimation = 1;
                defender.hasBarrel = false;
                
                const dx = this.target.x - this.x;
                const dy = this.target.y - this.y;
                const distance = Math.hypot(dx, dy);
                const rollSpeed = 150;
                
                this.rollingBarrels.push({
                    x: this.x + Math.cos(defender.angle) * 25,
                    y: this.y + Math.sin(defender.angle) * 25,
                    vx: (dx / distance) * rollSpeed,
                    vy: (dy / distance) * rollSpeed,
                    rotation: 0,
                    rotationSpeed: 6,
                    life: distance / rollSpeed + 0.5,
                    targetX: this.target.x,
                    targetY: this.target.y,
                    size: 8
                });
                
                setTimeout(() => {
                    if (defender) {
                        defender.hasBarrel = true;
                    }
                }, 3000 + Math.random() * 2000);
            }
        }
    }
    
    createSmokeZone(x, y) {
        this.slowZones.push({
            x: x,
            y: y,
            radius: 40,
            life: 8.0,
            maxLife: 8.0,
            smokeIntensity: 0,
            smokeParticles: this.generateSmokeParticles(x, y)
        });
    }
    
    generateSmokeParticles(centerX, centerY) {
        const particles = [];
        for (let i = 0; i < 20; i++) {
            particles.push({
                x: centerX + (Math.random() - 0.5) * 60,
                y: centerY + (Math.random() - 0.5) * 60,
                size: Math.random() * 8 + 4,
                opacity: Math.random() * 0.6 + 0.2,
                drift: (Math.random() - 0.5) * 0.5
            });
        }
        return particles;
    }
    
    render(ctx) {
        const baseResolution = 1920;
        const scaleFactor = Math.max(0.5, Math.min(2.5, ctx.canvas.width / baseResolution));
        const cellSize = Math.floor(32 * scaleFactor);
        const towerSize = cellSize * 2;
        
        // Tower shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x - towerSize * 0.4 + 4, this.y - towerSize * 0.3 + 4, towerSize * 0.8, towerSize * 0.6);
        
        // Watch tower base platform - wooden planks
        const baseWidth = towerSize * 0.6;
        const baseHeight = towerSize * 0.2;
        const plankHeight = 6;
        const numPlanks = Math.floor(baseHeight / plankHeight);
        
        for (let i = 0; i < numPlanks; i++) {
            const plankY = this.y - baseHeight + (i * plankHeight);
            const plankOffset = (i % 2) * 3; // Stagger planks slightly
            
            // Individual wooden plank
            const plankGradient = ctx.createLinearGradient(
                this.x - baseWidth/2, plankY,
                this.x + baseWidth/2, plankY + plankHeight
            );
            plankGradient.addColorStop(0, '#A0522D');
            plankGradient.addColorStop(0.3, '#8B4513');
            plankGradient.addColorStop(0.7, '#CD853F');
            plankGradient.addColorStop(1, '#654321');
            
            ctx.fillStyle = plankGradient;
            ctx.fillRect(this.x - baseWidth/2 + plankOffset, plankY, baseWidth - plankOffset, plankHeight);
            
            // Plank outline and wood grain
            ctx.strokeStyle = '#5D4E37';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x - baseWidth/2 + plankOffset, plankY, baseWidth - plankOffset, plankHeight);
            
            // Wood grain lines
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 0.5;
            for (let g = 0; g < 2; g++) {
                const grainY = plankY + (g + 1) * plankHeight / 3;
                ctx.beginPath();
                ctx.moveTo(this.x - baseWidth/2 + plankOffset + 2, grainY);
                ctx.lineTo(this.x + baseWidth/2 - 2, grainY);
                ctx.stroke();
            }
        }
        
        // Watch tower supports (vertical beams)
        const supportWidth = 6;
        const supportHeight = towerSize * 0.6;
        
        for (let side = -1; side <= 1; side += 2) {
            const supportX = this.x + side * (baseWidth/2 - supportWidth/2);
            
            // Support beam with wood texture
            const supportGradient = ctx.createLinearGradient(
                supportX, this.y - baseHeight - supportHeight,
                supportX + supportWidth, this.y - baseHeight
            );
            supportGradient.addColorStop(0, '#8B4513');
            supportGradient.addColorStop(0.5, '#654321');
            supportGradient.addColorStop(1, '#5D4E37');
            
            ctx.fillStyle = supportGradient;
            ctx.fillRect(supportX, this.y - baseHeight - supportHeight, supportWidth, supportHeight);
            ctx.strokeStyle = '#5D4E37';
            ctx.lineWidth = 2;
            ctx.strokeRect(supportX, this.y - baseHeight - supportHeight, supportWidth, supportHeight);
            
            // Vertical wood grain
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 1;
            for (let g = 0; g < 2; g++) {
                const grainX = supportX + (g + 1) * supportWidth / 3;
                ctx.beginPath();
                ctx.moveTo(grainX, this.y - baseHeight - supportHeight + 5);
                ctx.lineTo(grainX, this.y - baseHeight - 5);
                ctx.stroke();
            }
            
            // Cross braces with rope/nail details
            ctx.strokeStyle = '#5D4E37';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(supportX, this.y - baseHeight - supportHeight * 0.7);
            ctx.lineTo(supportX + supportWidth, this.y - baseHeight - supportHeight * 0.3);
            ctx.moveTo(supportX + supportWidth, this.y - baseHeight - supportHeight * 0.7);
            ctx.lineTo(supportX, this.y - baseHeight - supportHeight * 0.3);
            ctx.stroke();
            
            // Nail/rope binding points
            ctx.fillStyle = '#2F2F2F';
            const bindingPoints = [0.3, 0.7];
            bindingPoints.forEach(point => {
                const bindY = this.y - baseHeight - supportHeight * point;
                ctx.beginPath();
                ctx.arc(supportX + supportWidth/2, bindY, 2, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        
        // Upper platform - wooden plank construction
        const platformWidth = baseWidth * 0.8;
        const platformHeight = 8;
        const platformY = this.y - baseHeight - supportHeight;
        const platformPlanks = 4;
        const plankWidth = platformWidth / platformPlanks;
        
        for (let i = 0; i < platformPlanks; i++) {
            const plankX = this.x - platformWidth/2 + (i * plankWidth);
            
            // Individual platform plank
            const plankGradient = ctx.createLinearGradient(
                plankX, platformY,
                plankX + plankWidth, platformY + platformHeight
            );
            plankGradient.addColorStop(0, '#CD853F');
            plankGradient.addColorStop(0.5, '#A0522D');
            plankGradient.addColorStop(1, '#8B4513');
            
            ctx.fillStyle = plankGradient;
            ctx.fillRect(plankX, platformY, plankWidth, platformHeight);
            
            // Plank separations and nails
            ctx.strokeStyle = '#5D4E37';
            ctx.lineWidth = 1;
            ctx.strokeRect(plankX, platformY, plankWidth, platformHeight);
            
            // Nails at corners
            ctx.fillStyle = '#2F2F2F';
            ctx.beginPath();
            ctx.arc(plankX + 2, platformY + 2, 1, 0, Math.PI * 2);
            ctx.arc(plankX + plankWidth - 2, platformY + 2, 1, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Platform railings with more detail
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
        for (let side = -1; side <= 1; side += 2) {
            const railX = this.x + side * platformWidth/2;
            
            // Vertical railing post
            ctx.beginPath();
            ctx.moveTo(railX, platformY);
            ctx.lineTo(railX, platformY - 18);
            ctx.stroke();
            
            // Horizontal rails
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(railX, platformY - 12);
            ctx.lineTo(railX - side * 12, platformY - 12);
            ctx.moveTo(railX, platformY - 6);
            ctx.lineTo(railX - side * 8, platformY - 6);
            ctx.stroke();
            
            // Railing post cap
            ctx.fillStyle = '#5D4E37';
            ctx.fillRect(railX - 1, platformY - 20, 2, 4);
        }
        
        // Barrel storage on platform
        for (let i = 0; i < 3; i++) {
            const barrelX = this.x - platformWidth/3 + (i * platformWidth/4);
            const barrelY = platformY - 8;
            
            ctx.fillStyle = '#8B4513';
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.fillRect(barrelX - 4, barrelY - 6, 8, 12);
            ctx.strokeRect(barrelX - 4, barrelY - 6, 8, 12);
            
            // Barrel bands
            ctx.strokeStyle = '#2F2F2F';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(barrelX - 4, barrelY - 2);
            ctx.lineTo(barrelX + 4, barrelY - 2);
            ctx.moveTo(barrelX - 4, barrelY + 2);
            ctx.lineTo(barrelX + 4, barrelY + 2);
            ctx.stroke();
        }
        
        // Render defenders on platform
        this.defenders.forEach((defender, index) => {
            ctx.save();
            
            const defenderX = this.x + (index === 0 ? -15 : 15);
            const defenderY = platformY - 5;
            
            ctx.translate(defenderX, defenderY);
            
            // Defender body
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-3, -8, 6, 12);
            
            // Defender head
            ctx.fillStyle = '#DDBEA9';
            ctx.beginPath();
            ctx.arc(0, -12, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Helmet
            ctx.fillStyle = '#696969';
            ctx.beginPath();
            ctx.arc(0, -12, 3.5, Math.PI, Math.PI * 2);
            ctx.fill();
            
            // Arms pushing animation
            const pushOffset = defender.pushAnimation * 5;
            ctx.strokeStyle = '#DDBEA9';
            ctx.lineWidth = 3;
            
            ctx.beginPath();
            ctx.moveTo(0, -5);
            ctx.lineTo(Math.cos(defender.angle) * (8 + pushOffset), -5 + Math.sin(defender.angle) * (8 + pushOffset));
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, -5);
            ctx.lineTo(-4, -1);
            ctx.stroke();
            
            // Barrel if carrying
            if (defender.hasBarrel && defender.pushAnimation < 0.3) {
                const barrelX = Math.cos(defender.angle) * 10;
                const barrelY = -5 + Math.sin(defender.angle) * 10;
                
                ctx.fillStyle = '#8B4513';
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 2;
                ctx.fillRect(barrelX - 4, barrelY - 6, 8, 12);
                ctx.strokeRect(barrelX - 4, barrelY - 6, 8, 12);
                
                ctx.strokeStyle = '#2F2F2F';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(barrelX - 4, barrelY - 2);
                ctx.lineTo(barrelX + 4, barrelY - 2);
                ctx.moveTo(barrelX - 4, barrelY + 2);
                ctx.lineTo(barrelX + 4, barrelY + 2);
                ctx.stroke();
            }
            
            ctx.restore();
        });
        
        // Render rolling barrels
        this.rollingBarrels.forEach(barrel => {
            ctx.save();
            ctx.translate(barrel.x, barrel.y);
            ctx.rotate(barrel.rotation);
            
            ctx.fillStyle = '#8B4513';
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.fillRect(-barrel.size, -barrel.size, barrel.size * 2, barrel.size * 2);
            ctx.strokeRect(-barrel.size, -barrel.size, barrel.size * 2, barrel.size * 2);
            
            // Barrel bands
            ctx.strokeStyle = '#2F2F2F';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-barrel.size, -barrel.size/3);
            ctx.lineTo(barrel.size, -barrel.size/3);
            ctx.moveTo(-barrel.size, barrel.size/3);
            ctx.lineTo(barrel.size, barrel.size/3);
            ctx.stroke();
            
            ctx.restore();
        });
        
        // Render smoke zones with rubble
        this.slowZones.forEach(zone => {
            const alpha = zone.life / zone.maxLife;
            const smokeAlpha = zone.smokeIntensity * alpha;
            
            // Rubble on ground
            ctx.fillStyle = `rgba(105, 105, 105, ${alpha * 0.8})`;
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2 + this.animationTime * 0.1;
                const distance = Math.random() * zone.radius * 0.8;
                const rubbleX = zone.x + Math.cos(angle) * distance;
                const rubbleY = zone.y + Math.sin(angle) * distance;
                const rubbleSize = Math.random() * 3 + 1;
                
                ctx.beginPath();
                ctx.arc(rubbleX, rubbleY, rubbleSize, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Smoke particles
            zone.smokeParticles.forEach(particle => {
                const particleAlpha = smokeAlpha * particle.opacity;
                ctx.fillStyle = `rgba(128, 128, 128, ${particleAlpha})`;
                
                const smokeX = particle.x + Math.sin(this.animationTime + particle.drift) * 5;
                const smokeY = particle.y + Math.cos(this.animationTime * 0.5 + particle.drift) * 3;
                
                ctx.beginPath();
                ctx.arc(smokeX, smokeY, particle.size, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // Zone outline
            ctx.strokeStyle = `rgba(105, 105, 105, ${alpha * 0.3})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
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
            name: 'Watch Tower',
            description: 'Defenders roll barrels to create smoke screens that slow enemies.',
            damage: 'None',
            range: '120',
            fireRate: '0.4/sec',
            cost: 90
        };
    }
}
