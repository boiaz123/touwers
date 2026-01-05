import { Tower } from './Tower.js';

export class BarricadeTower extends Tower {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY);
        this.range = 120;
        this.fireRate = 0.15;
        
        this.defenders = [
            { angle: 0, pushAnimation: 0, hasBarrel: true },
            { angle: Math.PI, pushAnimation: 0, hasBarrel: true }
        ];
        this.rollingBarrels = [];
        this.slowZones = [];
        
        this.originalRange = this.range;
    }
    
    update(deltaTime, enemies) {
        super.update(deltaTime, enemies);
        
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
        
        this.rollingBarrels = this.rollingBarrels.filter(barrel => {
            barrel.x += barrel.vx * deltaTime;
            barrel.y += barrel.vy * deltaTime;
            barrel.rotation += barrel.rotationSpeed * deltaTime;
            barrel.life -= deltaTime;
            
            const distanceToTarget = Math.hypot(barrel.x - barrel.targetX, barrel.y - barrel.targetY);
            if (barrel.life <= 0 || distanceToTarget < 15) {
                this.createSmokeZone(barrel.targetX, barrel.targetY);
                return false;
            }
            return true;
        });
        
        this.slowZones = this.slowZones.filter(zone => {
            zone.life -= deltaTime;
            zone.smokeIntensity = Math.min(1, zone.smokeIntensity + deltaTime * 2);
            
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
        
        if (this.slowZones.length === 0) {
            enemies.forEach(enemy => {
                if (enemy.hasOwnProperty('originalSpeed') && enemy.speed < enemy.originalSpeed) {
                    const restoreRate = 1 - Math.pow(0.3, deltaTime);
                    enemy.speed = enemy.speed + (enemy.originalSpeed - enemy.speed) * restoreRate;
                }
            });
        }
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
            smokeIntensity: 0
        });
    }

    render(ctx) {
        // Get tower size
        const cellSize = this.getCellSize(ctx);
        const towerSize = cellSize * 2;
        
        // Subtle tower shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(this.x - towerSize * 0.3 + 2, this.y - towerSize * 0.2 + 2, towerSize * 0.6, towerSize * 0.4);
        
        // Watch tower base platform - more defined structure
        const baseWidth = towerSize * 0.5;
        const baseHeight = towerSize * 0.18;
        const plankHeight = 5;
        const numPlanks = Math.floor(baseHeight / plankHeight);
        
        // Base platform outline for definition
        ctx.strokeStyle = '#3D2F1F';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - baseWidth/2, this.y - baseHeight, baseWidth, baseHeight);
        
        for (let i = 0; i < numPlanks; i++) {
            const plankY = this.y - baseHeight + (i * plankHeight);
            const plankOffset = (i % 2) * 2;
            
            const plankGradient = ctx.createLinearGradient(
                this.x - baseWidth/2, plankY,
                this.x + baseWidth/2, plankY + plankHeight
            );
            plankGradient.addColorStop(0, '#B8860B');
            plankGradient.addColorStop(0.3, '#8B4513');
            plankGradient.addColorStop(0.7, '#CD853F');
            plankGradient.addColorStop(1, '#654321');
            
            ctx.fillStyle = plankGradient;
            ctx.fillRect(this.x - baseWidth/2 + plankOffset, plankY, baseWidth - plankOffset, plankHeight);
            
            ctx.strokeStyle = '#3D2F1F';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(this.x - baseWidth/2 + plankOffset, plankY, baseWidth - plankOffset, plankHeight);
        }
        
        this.renderTowerSupports(ctx, baseWidth, baseHeight, towerSize);
        this.renderUpperPlatform(ctx, baseWidth, baseHeight, towerSize);
        this.renderDefenders(ctx, baseWidth, baseHeight, towerSize);
        this.renderRollingBarrels(ctx);
        this.renderSmokeZones(ctx);
        
        // Render trees in front so tower stands behind them
        this.renderTrees(ctx);
        
        // Render attack radius circle if selected
        this.renderAttackRadiusCircle(ctx);
    }
    
    renderTrees(ctx) {
        // Render trees overlapping the tower to make it look like it's in a forest
        // Position trees so trunk bases stay within the 2x2 grid
        const treePositions = [
            { x: this.x - 20, y: this.y - 15, size: 50, seed: 0 },
            { x: this.x + 22, y: this.y - 18, size: 48, seed: 1 },
            { x: this.x - 22, y: this.y + 8, size: 52, seed: 2 },
            { x: this.x + 20, y: this.y + 10, size: 49, seed: 3 }
        ];
        
        treePositions.forEach(tree => {
            this.renderTreeType(ctx, tree.x, tree.y, tree.size, tree.seed % 4);
        });
    }
    
    renderTreeType(ctx, x, y, size, typeId) {
        switch(typeId) {
            case 0:
                this.renderTreeType1(ctx, x, y, size);
                break;
            case 1:
                this.renderTreeType2(ctx, x, y, size);
                break;
            case 2:
                this.renderTreeType3(ctx, x, y, size);
                break;
            default:
                this.renderTreeType4(ctx, x, y, size);
        }
    }
    
    renderTreeType1(ctx, x, y, size) {
        const trunkWidth = size * 0.25;
        const trunkHeight = size * 0.5;
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(x, y, trunkWidth * 0.5, trunkHeight);
        ctx.fillStyle = '#0D3817';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.6);
        ctx.lineTo(x + size * 0.35, y - size * 0.1);
        ctx.lineTo(x - size * 0.35, y - size * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.35);
        ctx.lineTo(x + size * 0.3, y + size * 0.05);
        ctx.lineTo(x - size * 0.3, y + size * 0.05);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.15);
        ctx.lineTo(x + size * 0.25, y + size * 0.2);
        ctx.lineTo(x - size * 0.25, y + size * 0.2);
        ctx.closePath();
        ctx.fill();
    }

    renderTreeType2(ctx, x, y, size) {
        const trunkWidth = size * 0.2;
        const trunkHeight = size * 0.4;
        ctx.fillStyle = '#6B4423';
        ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);
        ctx.fillStyle = '#8B5A3C';
        ctx.fillRect(x - trunkWidth * 0.5 + trunkWidth * 0.6, y, trunkWidth * 0.4, trunkHeight);
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.35, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#43A047';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.55, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    renderTreeType3(ctx, x, y, size) {
        const trunkWidth = size * 0.22;
        ctx.fillStyle = '#795548';
        ctx.fillRect(x - trunkWidth * 0.5, y - size * 0.2, trunkWidth, size * 0.6);
        ctx.fillStyle = '#4E342E';
        ctx.beginPath();
        ctx.arc(x + trunkWidth * 0.25, y, trunkWidth * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.arc(x - size * 0.28, y - size * 0.35, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + size * 0.28, y - size * 0.3, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.55, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    renderTreeType4(ctx, x, y, size) {
        const trunkWidth = size * 0.18;
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - trunkWidth * 0.5, y - size * 0.05, trunkWidth, size * 0.45);
        ctx.fillStyle = '#0D3817';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.05);
        ctx.lineTo(x + size * 0.38, y + size * 0.15);
        ctx.lineTo(x - size * 0.38, y + size * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.25);
        ctx.lineTo(x + size * 0.3, y);
        ctx.lineTo(x - size * 0.3, y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.45);
        ctx.lineTo(x + size * 0.2, y - size * 0.15);
        ctx.lineTo(x - size * 0.2, y - size * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#43A047';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.6);
        ctx.lineTo(x + size * 0.12, y - size * 0.45);
        ctx.lineTo(x - size * 0.12, y - size * 0.45);
        ctx.closePath();
        ctx.fill();
    }
    
    renderTowerSupports(ctx, baseWidth, baseHeight, towerSize) {
        const supportWidth = 8;
        const supportHeight = towerSize * 0.55;
        
        for (let side = -1; side <= 1; side += 2) {
            const supportX = this.x + side * (baseWidth/2 - supportWidth/2);
            
            const supportGradient = ctx.createLinearGradient(
                supportX, this.y - baseHeight - supportHeight,
                supportX + supportWidth, this.y - baseHeight
            );
            supportGradient.addColorStop(0, '#8B4513');
            supportGradient.addColorStop(0.5, '#654321');
            supportGradient.addColorStop(1, '#5D4E37');
            
            ctx.fillStyle = supportGradient;
            ctx.fillRect(supportX, this.y - baseHeight - supportHeight, supportWidth, supportHeight);
            
            // Strong outline for definition
            ctx.strokeStyle = '#3D2F1F';
            ctx.lineWidth = 2;
            ctx.strokeRect(supportX, this.y - baseHeight - supportHeight, supportWidth, supportHeight);
            
            // Cross braces - more prominent
            ctx.strokeStyle = '#5D4E37';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(supportX, this.y - baseHeight - supportHeight * 0.7);
            ctx.lineTo(supportX + supportWidth, this.y - baseHeight - supportHeight * 0.3);
            ctx.moveTo(supportX + supportWidth, this.y - baseHeight - supportHeight * 0.7);
            ctx.lineTo(supportX, this.y - baseHeight - supportHeight * 0.3);
            ctx.stroke();
            
            // Metal binding points
            ctx.fillStyle = '#1F1F1F';
            const bindingPoints = [0.3, 0.7];
            bindingPoints.forEach(point => {
                const bindY = this.y - baseHeight - supportHeight * point;
                ctx.beginPath();
                ctx.arc(supportX + supportWidth/2, bindY, 2.5, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }
    
    renderUpperPlatform(ctx, baseWidth, baseHeight, towerSize) {
        const supportHeight = towerSize * 0.55;
        const platformWidth = baseWidth * 0.9;
        const platformHeight = 10;
        const platformY = this.y - baseHeight - supportHeight;
        
        // Platform outline
        ctx.strokeStyle = '#3D2F1F';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - platformWidth/2, platformY, platformWidth, platformHeight);
        
        const platformPlanks = 5;
        const plankWidth = platformWidth / platformPlanks;
        
        for (let i = 0; i < platformPlanks; i++) {
            const plankX = this.x - platformWidth/2 + (i * plankWidth);
            
            const plankGradient = ctx.createLinearGradient(
                plankX, platformY,
                plankX + plankWidth, platformY + platformHeight
            );
            plankGradient.addColorStop(0, '#DEB887');
            plankGradient.addColorStop(0.5, '#CD853F');
            plankGradient.addColorStop(1, '#A0522D');
            
            ctx.fillStyle = plankGradient;
            ctx.fillRect(plankX, platformY, plankWidth, platformHeight);
            
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 1;
            ctx.strokeRect(plankX, platformY, plankWidth, platformHeight);
        }
        
        // Platform railings - more structural
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 4;
        for (let side = -1; side <= 1; side += 2) {
            const railX = this.x + side * platformWidth/2;
            
            ctx.beginPath();
            ctx.moveTo(railX, platformY);
            ctx.lineTo(railX, platformY - 20);
            ctx.stroke();
            
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(railX, platformY - 15);
            ctx.lineTo(railX - side * 15, platformY - 15);
            ctx.moveTo(railX, platformY - 8);
            ctx.lineTo(railX - side * 12, platformY - 8);
            ctx.stroke();
            
            ctx.fillStyle = '#5D4E37';
            ctx.fillRect(railX - 1.5, platformY - 22, 3, 4);
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
    }
    
    renderDefenders(ctx, baseWidth, baseHeight, towerSize) {
        const supportHeight = towerSize * 0.55;
        const platformWidth = baseWidth * 0.9;
        const platformHeight = 10;
        const platformY = this.y - baseHeight - supportHeight;
        
        this.defenders.forEach((defender, index) => {
            ctx.save();
            
            const defenderX = this.x + (index === 0 ? -15 : 15);
            const defenderY = platformY - 5;
            
            ctx.translate(defenderX, defenderY);
            
            // Defender body - blue tunic
            ctx.fillStyle = '#4169E1';
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
    }
    
    renderRollingBarrels(ctx) {
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
    }
    
    renderSmokeZones(ctx) {
        this.slowZones.forEach(zone => {
            const alpha = zone.life / zone.maxLife;
            const smokeAlpha = zone.smokeIntensity * alpha;
            
            // Skip rendering if alpha is too low
            if (smokeAlpha < 0.01) return;
            
            // Static rubble particles positioned deterministically
            ctx.fillStyle = `rgba(105, 105, 105, ${alpha * 0.8})`;
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const distance = (i * 7) % zone.radius * 0.8;
                const rubbleX = zone.x + Math.cos(angle) * distance;
                const rubbleY = zone.y + Math.sin(angle) * distance;
                const rubbleSize = (i % 3) + 1;
                
                ctx.beginPath();
                ctx.arc(rubbleX, rubbleY, rubbleSize, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Expanding cloud effect
            const expandPulse = Math.sin(this.animationTime * 3) * 0.2 + 1;
            const cloudRadius = zone.radius * expandPulse;
            
            // Outer smoke cloud
            ctx.fillStyle = `rgba(128, 128, 128, ${smokeAlpha * 0.3})`;
            ctx.beginPath();
            ctx.arc(zone.x, zone.y, cloudRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Zone outline
            ctx.strokeStyle = `rgba(105, 105, 105, ${alpha * 0.4})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        });
    }
    
    static getInfo() {
        return {
            name: 'Watch Tower',
            description: 'Defenders roll barrels to create smoke screens that slow enemies.',
            damage: 'None',
            range: '120',
            fireRate: '0.4/sec',
            cost: 90,
            icon: '🛢️'
        };
    }
}
