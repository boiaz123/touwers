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
        
        // Wooden platform base
        const baseSize = towerSize * 0.9;
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
        ctx.fillRect(this.x - baseSize/2, this.y - baseSize/2, baseSize, baseSize);
        ctx.strokeRect(this.x - baseSize/2, this.y - baseSize/2, baseSize, baseSize);
        
        // Wood grain texture
        ctx.strokeStyle = '#5D4E37';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const grainY = this.y - baseSize/2 + (i + 0.5) * baseSize/5;
            ctx.beginPath();
            ctx.moveTo(this.x - baseSize/2, grainY);
            ctx.lineTo(this.x + baseSize/2, grainY);
            ctx.stroke();
        }
        
        // Support pillars at corners
        const pillarSize = baseSize * 0.08;
        const pillarOffset = baseSize * 0.35;
        ctx.fillStyle = '#654321';
        ctx.strokeStyle = '#5D4E37';
        ctx.lineWidth = 2;
        
        const pillars = [
            {x: this.x - pillarOffset, y: this.y - pillarOffset},
            {x: this.x + pillarOffset, y: this.y - pillarOffset},
            {x: this.x - pillarOffset, y: this.y + pillarOffset},
            {x: this.x + pillarOffset, y: this.y + pillarOffset}
        ];
        
        pillars.forEach(pillar => {
            ctx.fillRect(pillar.x - pillarSize/2, pillar.y - pillarSize/2, pillarSize, pillarSize * 2);
            ctx.strokeRect(pillar.x - pillarSize/2, pillar.y - pillarSize/2, pillarSize, pillarSize * 2);
        });
        
        // Central watchtower
        const towerRadius = towerSize * 0.25;
        ctx.fillStyle = '#DEB887';
        ctx.strokeStyle = '#CD853F';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, towerRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Roof
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - towerRadius * 1.5);
        ctx.lineTo(this.x - towerRadius * 0.8, this.y - towerRadius * 0.3);
        ctx.lineTo(this.x + towerRadius * 0.8, this.y - towerRadius * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Windows/archer slots
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const windowX = this.x + Math.cos(angle) * towerRadius * 0.8;
            const windowY = this.y + Math.sin(angle) * towerRadius * 0.8;
            
            ctx.fillStyle = '#2F2F2F';
            ctx.fillRect(windowX - 3, windowY - 6, 6, 12);
            ctx.strokeRect(windowX - 3, windowY - 6, 6, 12);
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
