import { Tower } from './Tower.js';

export class ArcherTower extends Tower {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY);
        this.range = 140;
        this.damage = 15;
        this.fireRate = 1.5;
        
        // Animation properties
        this.archerAngle = 0;
        this.drawTime = 0;
        this.arrows = [];
        this.archers = [
            { angle: 0, drawback: 0, shootTimer: 0 },
            { angle: Math.PI / 2, drawback: 0, shootTimer: 0.2 },
            { angle: Math.PI, drawback: 0, shootTimer: 0.4 },
            { angle: 3 * Math.PI / 2, drawback: 0, shootTimer: 0.6 }
        ];
    }
    
    update(deltaTime, enemies) {
        super.update(deltaTime, enemies);
        
        this.archers.forEach(archer => {
            archer.shootTimer = Math.max(0, archer.shootTimer - deltaTime);
            archer.drawback = Math.max(0, archer.drawback - deltaTime * 3);
            
            if (this.target) {
                const targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                archer.angle = targetAngle + Math.sin(this.animationTime * 2) * 0.1;
            }
        });
        
        if (this.target && this.cooldown === 0) {
            this.shoot();
            this.cooldown = 1 / this.fireRate;
        }
        
        // Update arrows
        this.arrows = this.arrows.filter(arrow => {
            arrow.x += arrow.vx * deltaTime;
            arrow.y += arrow.vy * deltaTime;
            arrow.vy += 200 * deltaTime; // Gravity effect
            arrow.life -= deltaTime;
            arrow.rotation = Math.atan2(arrow.vy, arrow.vx);
            
            return arrow.life > 0;
        });
    }
    
    shoot() {
        if (this.target) {
            this.target.takeDamage(this.damage, false, 'physical');
            
            // Select an archer to shoot
            const shooter = this.archers[Math.floor(Math.random() * this.archers.length)];
            shooter.drawback = 1;
            shooter.shootTimer = 0.3;
            
            // Predict where the target will be
            const arrowSpeed = 400;
            const predicted = this.predictEnemyPosition(this.target, arrowSpeed);
            
            // Calculate arrow trajectory with arc to predicted position
            const dx = predicted.x - this.x;
            const dy = predicted.y - this.y;
            const distance = Math.hypot(dx, dy);
            const arcHeight = distance * 0.1; // Slight arc for realism
            
            this.arrows.push({
                x: this.x + Math.cos(shooter.angle) * 20,
                y: this.y + Math.sin(shooter.angle) * 20,
                vx: distance > 0 ? (dx / distance) * arrowSpeed : 0,
                vy: distance > 0 ? (dy / distance) * arrowSpeed - arcHeight : 0,
                rotation: shooter.angle,
                life: distance / Math.max(arrowSpeed, 1) + 0.5,
                maxLife: distance / Math.max(arrowSpeed, 1) + 0.5
            });
        }
    }
    
    render(ctx) {
        // Get tower size - use ResolutionManager if available
        const cellSize = this.getCellSize(ctx);
        const towerSize = cellSize * 2;
        
        // 3D shadow for entire structure
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x - towerSize * 0.3 + 4, this.y - towerSize * 0.1 + 4, towerSize * 0.6, towerSize * 0.8);
        
        // Wooden watchtower base (square foundation)
        const baseWidth = towerSize * 0.6;
        const baseHeight = towerSize * 0.15;
        
        // Foundation stones
        ctx.fillStyle = '#696969';
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 2;
        ctx.fillRect(this.x - baseWidth/2, this.y - baseHeight, baseWidth, baseHeight * 2);
        ctx.strokeRect(this.x - baseWidth/2, this.y - baseHeight, baseWidth, baseHeight * 2);
        
        // Stone texture
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 2; j++) {
                const stoneX = this.x - baseWidth/2 + (i + 0.5) * baseWidth/3;
                const stoneY = this.y - baseHeight + (j + 0.5) * baseHeight;
                ctx.strokeRect(stoneX - baseWidth/8, stoneY - baseHeight/3, baseWidth/4, baseHeight/1.5);
            }
        }
        
        // Main wooden tower structure (tall and narrow)
        const towerWidth = baseWidth * 0.8;
        const towerHeight = towerSize * 0.7;
        
        // Tower gradient (vertical wood planks)
        const towerGradient = ctx.createLinearGradient(
            this.x - towerWidth/2, this.y - towerHeight,
            this.x + towerWidth/4, this.y
        );
        towerGradient.addColorStop(0, '#DEB887');
        towerGradient.addColorStop(0.5, '#CD853F');
        towerGradient.addColorStop(1, '#8B7355');
        
        ctx.fillStyle = towerGradient;
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.fillRect(this.x - towerWidth/2, this.y - towerHeight, towerWidth, towerHeight);
        ctx.strokeRect(this.x - towerWidth/2, this.y - towerHeight, towerWidth, towerHeight);
        
        // Vertical wood planks
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const plankX = this.x - towerWidth/2 + (towerWidth * i / 4);
            ctx.beginPath();
            ctx.moveTo(plankX, this.y - towerHeight);
            ctx.lineTo(plankX, this.y);
            ctx.stroke();
        }
        
        // Horizontal support beams
        for (let i = 1; i <= 3; i++) {
            const beamY = this.y - towerHeight + (towerHeight * i / 4);
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x - towerWidth/2, beamY);
            ctx.lineTo(this.x + towerWidth/2, beamY);
            ctx.stroke();
        }
        
        // Watchtower platform at top
        const platformWidth = towerWidth * 1.2;
        const platformThickness = towerSize * 0.08;
        const platformY = this.y - towerHeight;
        
        // Platform shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(this.x - platformWidth/2 + 2, platformY - platformThickness + 2, platformWidth, platformThickness);
        
        // Platform
        const platformGradient = ctx.createLinearGradient(
            this.x - platformWidth/2, platformY - platformThickness,
            this.x + platformWidth/4, platformY
        );
        platformGradient.addColorStop(0, '#CD853F');
        platformGradient.addColorStop(1, '#8B7355');
        
        ctx.fillStyle = platformGradient;
        ctx.strokeStyle = '#5D4E37';
        ctx.lineWidth = 2;
        ctx.fillRect(this.x - platformWidth/2, platformY - platformThickness, platformWidth, platformThickness);
        ctx.strokeRect(this.x - platformWidth/2, platformY - platformThickness, platformWidth, platformThickness);
        
        // Platform support brackets
        const bracketWidth = towerSize * 0.1;
        for (let side = -1; side <= 1; side += 2) {
            const bracketX = this.x + side * towerWidth/2;
            ctx.fillStyle = '#654321';
            ctx.beginPath();
            ctx.moveTo(bracketX, platformY - platformThickness);
            ctx.lineTo(bracketX + side * bracketWidth, platformY - platformThickness - bracketWidth);
            ctx.lineTo(bracketX + side * bracketWidth, platformY);
            ctx.lineTo(bracketX, platformY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        
        // Wooden railings with arrow slits
        const railingHeight = towerSize * 0.15;
        ctx.fillStyle = '#A0522D';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        
        // Front and back railings
        for (let side = -1; side <= 1; side += 2) {
            const railingY = platformY - platformThickness - railingHeight;
            ctx.fillRect(this.x - platformWidth/2, railingY, platformWidth, railingHeight);
            ctx.strokeRect(this.x - platformWidth/2, railingY, platformWidth, railingHeight);
            
            // Arrow slits
            for (let i = 0; i < 3; i++) {
                const slitX = this.x - platformWidth/2 + (i + 1) * platformWidth/4;
                const slitWidth = platformWidth * 0.03;
                const slitHeight = railingHeight * 0.6;
                ctx.fillStyle = '#2F2F2F';
                ctx.fillRect(slitX - slitWidth/2, railingY + railingHeight * 0.2, slitWidth, slitHeight);
            }
        }
        
        // Corner posts
        const postSize = towerSize * 0.05;
        ctx.fillStyle = '#654321';
        for (let x = -1; x <= 1; x += 2) {
            for (let z = -1; z <= 1; z += 2) {
                const postX = this.x + x * platformWidth/2;
                const postZ = platformY - platformThickness - railingHeight;
                ctx.fillRect(postX - postSize/2, postZ, postSize, railingHeight + platformThickness);
                ctx.strokeRect(postX - postSize/2, postZ, postSize, railingHeight + platformThickness);
            }
        }
        
        // Peaked roof
        const roofHeight = towerSize * 0.2;
        const roofY = platformY - platformThickness - railingHeight;
        
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, roofY - roofHeight);
        ctx.lineTo(this.x - platformWidth/2 - postSize, roofY);
        ctx.lineTo(this.x + platformWidth/2 + postSize, roofY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Roof tiles
        ctx.strokeStyle = '#5D4E37';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const tileY = roofY - roofHeight * (i / 4);
            const tileWidth = platformWidth * (1 - i / 8);
            ctx.beginPath();
            ctx.moveTo(this.x - tileWidth/2, tileY);
            ctx.lineTo(this.x + tileWidth/2, tileY);
            ctx.stroke();
        }
        
        // Render archers on platform
        this.archers.forEach((archer, index) => {
            ctx.save();
            
            const archerPositions = [
                { x: this.x - platformWidth * 0.3, y: platformY - platformThickness - railingHeight/2 },
                { x: this.x + platformWidth * 0.3, y: platformY - platformThickness - railingHeight/2 },
                { x: this.x - platformWidth * 0.1, y: platformY - platformThickness - railingHeight/2 },
                { x: this.x + platformWidth * 0.1, y: platformY - platformThickness - railingHeight/2 }
            ];
            
            const pos = archerPositions[index];
            ctx.translate(pos.x, pos.y);
            
            // Archer body
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-2, -4, 4, 8);
            
            // Archer head
            ctx.fillStyle = '#DDBEA9';
            ctx.beginPath();
            ctx.arc(0, -6, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Archer helmet
            ctx.fillStyle = '#696969';
            ctx.beginPath();
            ctx.arc(0, -6, 2.5, Math.PI, Math.PI * 2);
            ctx.fill();
            
            // Bow and aiming
            if (this.target) {
                const aimAngle = Math.atan2(this.target.y - pos.y, this.target.x - pos.x);
                ctx.rotate(aimAngle);
                
                // Bow
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(6, 0, 4, -0.6, 0.6);
                ctx.stroke();
                
                // Draw string if preparing to shoot
                if (archer.drawback > 0) {
                    ctx.strokeStyle = '#F5F5DC';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(6 + 3, -3);
                    ctx.lineTo(6 - archer.drawback * 3, 0);
                    ctx.lineTo(6 + 3, 3);
                    ctx.stroke();
                    
                    // Arrow
                    ctx.strokeStyle = '#8B4513';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(6 - archer.drawback * 3, 0);
                    ctx.lineTo(6 - archer.drawback * 3 - 8, 0);
                    ctx.stroke();
                }
            }
            
            ctx.restore();
        });
        
        // Render flying arrows
        this.arrows.forEach(arrow => {
            ctx.save();
            ctx.translate(arrow.x, arrow.y);
            ctx.rotate(arrow.rotation);
            
            const alpha = Math.min(1, arrow.life / arrow.maxLife);
            
            // Arrow shaft
            ctx.strokeStyle = `rgba(139, 69, 19, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-12, 0);
            ctx.lineTo(8, 0);
            ctx.stroke();
            
            // Arrow head
            ctx.fillStyle = `rgba(128, 128, 128, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(8, 0);
            ctx.lineTo(4, -2);
            ctx.lineTo(4, 2);
            ctx.closePath();
            ctx.fill();
            
            // Arrow fletching
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-12, -1);
            ctx.lineTo(-8, -3);
            ctx.moveTo(-12, 1);
            ctx.lineTo(-8, 3);
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
        
        // Render attack radius circle if selected
        this.renderAttackRadiusCircle(ctx);
    }
    
    static getInfo() {
        return {
            name: 'Archer Tower',
            description: 'Fast-firing tower with good range but lower damage.',
            damage: '15',
            range: '140',
            fireRate: '1.5/sec',
            cost: 75,
            icon: '🏹'
        };
    }
}
