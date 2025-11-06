export class ArcherTower {
    constructor(x, y, gridX, gridY) {
        this.x = x;
        this.y = y;
        this.gridX = gridX;
        this.gridY = gridY;
        this.range = 140;
        this.damage = 15;
        this.fireRate = 1.5;
        this.cooldown = 0;
        this.target = null;
        
        // Animation properties
        this.archerAngle = 0;
        this.drawTime = 0;
        this.arrows = [];
        this.animationTime = 0;
        this.archers = [
            { angle: 0, drawback: 0, shootTimer: 0 },
            { angle: Math.PI / 2, drawback: 0, shootTimer: 0.2 },
            { angle: Math.PI, drawback: 0, shootTimer: 0.4 },
            { angle: 3 * Math.PI / 2, drawback: 0, shootTimer: 0.6 }
        ];
    }
    
    update(deltaTime, enemies) {
        this.cooldown = Math.max(0, this.cooldown - deltaTime);
        this.animationTime += deltaTime;
        
        this.target = this.findTarget(enemies);
        
        // Update archer positions and animations
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
            
            // Select an archer to shoot
            const shooter = this.archers[Math.floor(Math.random() * this.archers.length)];
            shooter.drawback = 1;
            shooter.shootTimer = 0.3;
            
            // Calculate arrow trajectory with arc
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.hypot(dx, dy);
            const arrowSpeed = 400;
            const arcHeight = distance * 0.1; // Slight arc for realism
            
            this.arrows.push({
                x: this.x + Math.cos(shooter.angle) * 20,
                y: this.y + Math.sin(shooter.angle) * 20,
                vx: (dx / distance) * arrowSpeed,
                vy: (dy / distance) * arrowSpeed - arcHeight,
                rotation: shooter.angle,
                life: distance / arrowSpeed + 0.5,
                maxLife: distance / arrowSpeed + 0.5
            });
        }
    }
    
    render(ctx) {
        // Calculate tower size based on grid cell size (2x2 cells)
        const baseResolution = 1920;
        const scaleFactor = Math.max(0.5, Math.min(2.5, ctx.canvas.width / baseResolution));
        const cellSize = Math.floor(32 * scaleFactor);
        const towerSize = cellSize * 2;
        
        // 3D shadow for entire structure
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x - towerSize * 0.4 + 3, this.y - towerSize * 0.4 + 3, towerSize * 0.8, towerSize * 0.8);
        
        // Wooden platform base with 3D perspective
        const baseSize = towerSize * 0.85;
        
        // Platform planks with 3D shading
        const woodGradient = ctx.createLinearGradient(
            this.x - baseSize/2, this.y - baseSize/2,
            this.x + baseSize/4, this.y + baseSize/4
        );
        woodGradient.addColorStop(0, '#DEB887');
        woodGradient.addColorStop(0.5, '#CD853F');
        woodGradient.addColorStop(1, '#8B7355');
        
        ctx.fillStyle = woodGradient;
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        
        // Draw wooden platform as hexagon for more natural look
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = this.x + Math.cos(angle) * baseSize * 0.4;
            const y = this.y + Math.sin(angle) * baseSize * 0.4;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Wood planks detail
        ctx.strokeStyle = '#A0522D';
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const innerRadius = baseSize * 0.15;
            const outerRadius = baseSize * 0.38;
            
            ctx.beginPath();
            ctx.moveTo(this.x + Math.cos(angle) * innerRadius, this.y + Math.sin(angle) * innerRadius);
            ctx.lineTo(this.x + Math.cos(angle) * outerRadius, this.y + Math.sin(angle) * outerRadius);
            ctx.stroke();
        }
        
        // Support posts with 3D effect
        const pillarSize = baseSize * 0.06;
        const pillarOffset = baseSize * 0.3;
        const pillars = [
            {x: this.x - pillarOffset, y: this.y - pillarOffset},
            {x: this.x + pillarOffset, y: this.y - pillarOffset},
            {x: this.x - pillarOffset, y: this.y + pillarOffset},
            {x: this.x + pillarOffset, y: this.y + pillarOffset}
        ];
        
        pillars.forEach(pillar => {
            // Pillar shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(pillar.x - pillarSize + 1, pillar.y - pillarSize + 1, pillarSize * 2, pillarSize * 3);
            
            // Pillar with wood gradient
            const pillarGradient = ctx.createLinearGradient(
                pillar.x - pillarSize, pillar.y - pillarSize,
                pillar.x + pillarSize, pillar.y + pillarSize
            );
            pillarGradient.addColorStop(0, '#CD853F');
            pillarGradient.addColorStop(1, '#8B7355');
            
            ctx.fillStyle = pillarGradient;
            ctx.strokeStyle = '#5D4E37';
            ctx.lineWidth = 1;
            ctx.fillRect(pillar.x - pillarSize, pillar.y - pillarSize, pillarSize * 2, pillarSize * 3);
            ctx.strokeRect(pillar.x - pillarSize, pillar.y - pillarSize, pillarSize * 2, pillarSize * 3);
        });
        
        // Central watchtower with conical shape for 3D effect
        const towerRadius = towerSize * 0.2;
        const towerHeight = towerSize * 0.3;
        
        // Tower body gradient (cylindrical 3D effect)
        const towerGradient = ctx.createRadialGradient(
            this.x - towerRadius * 0.3, this.y - towerHeight - towerRadius * 0.3, 0,
            this.x, this.y - towerHeight, towerRadius
        );
        towerGradient.addColorStop(0, '#F5DEB3');
        towerGradient.addColorStop(0.7, '#DEB887');
        towerGradient.addColorStop(1, '#CD853F');
        
        ctx.fillStyle = towerGradient;
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y - towerHeight, towerRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Wooden bands around tower
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(this.x, this.y - towerHeight + (towerRadius * 2 * i / 3) - towerRadius, towerRadius - 1, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Conical roof with 3D shading
        const roofGradient = ctx.createLinearGradient(
            this.x - towerRadius, this.y - towerHeight - towerRadius,
            this.x + towerRadius * 0.3, this.y - towerHeight - towerRadius * 0.3
        );
        roofGradient.addColorStop(0, '#8B4513');
        roofGradient.addColorStop(0.6, '#A0522D');
        roofGradient.addColorStop(1, '#654321');
        
        ctx.fillStyle = roofGradient;
        ctx.strokeStyle = '#5D4E37';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - towerHeight - towerRadius * 1.2);
        ctx.lineTo(this.x - towerRadius * 0.9, this.y - towerHeight + towerRadius * 0.2);
        ctx.lineTo(this.x + towerRadius * 0.9, this.y - towerHeight + towerRadius * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Archer windows with depth
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const windowX = this.x + Math.cos(angle) * towerRadius * 0.8;
            const windowY = this.y - towerHeight + Math.sin(angle) * towerRadius * 0.8;
            
            // Window recess (3D depth)
            ctx.fillStyle = '#2F2F2F';
            ctx.fillRect(windowX - 4, windowY - 8, 8, 16);
            
            // Window frame
            ctx.strokeStyle = '#8B7355';
            ctx.lineWidth = 1;
            ctx.strokeRect(windowX - 4, windowY - 8, 8, 16);
            
            // Window cross
            ctx.beginPath();
            ctx.moveTo(windowX, windowY - 8);
            ctx.lineTo(windowX, windowY + 8);
            ctx.moveTo(windowX - 4, windowY);
            ctx.lineTo(windowX + 4, windowY);
            ctx.stroke();
        }
        
        // Render archers
        this.archers.forEach((archer, index) => {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            const archerRadius = towerRadius * 0.7;
            const archerX = Math.cos(archer.angle) * archerRadius;
            const archerY = Math.sin(archer.angle) * archerRadius;
            
            ctx.translate(archerX, archerY);
            ctx.rotate(archer.angle);
            
            // Archer body
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-3, -2, 6, 4);
            
            // Bow
            const bowExtension = 8 + archer.drawback * 5;
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(bowExtension, 0, 6, -0.8, 0.8);
            ctx.stroke();
            
            // Bowstring
            if (archer.drawback > 0) {
                ctx.strokeStyle = '#F5F5DC';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(bowExtension + 4, -5);
                ctx.lineTo(bowExtension - archer.drawback * 5, 0);
                ctx.lineTo(bowExtension + 4, 5);
                ctx.stroke();
                
                // Arrow being drawn
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(bowExtension - archer.drawback * 5, 0);
                ctx.lineTo(bowExtension - archer.drawback * 5 - 10, 0);
                ctx.stroke();
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
            ctx.strokeStyle = 'rgba(222, 184, 135, 0.2)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    static getInfo() {
        return {
            name: 'Archer Tower',
            description: 'Fast-firing tower with good range but lower damage.',
            damage: '15',
            range: '140',
            fireRate: '1.5/sec',
            cost: 75
        };
    }
}
