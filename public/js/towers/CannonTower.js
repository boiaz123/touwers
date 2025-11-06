export class CannonTower {
    constructor(x, y, gridX, gridY) {
        this.x = x;
        this.y = y;
        this.gridX = gridX;
        this.gridY = gridY;
        this.range = 100;
        this.damage = 50;
        this.fireRate = 0.5; // shots per second
        this.cooldown = 0;
        this.target = null;
        
        // Animation properties
        this.cannonAngle = 0;
        this.recoilOffset = 0;
        this.explosions = [];
        this.cannonballs = [];
        this.animationTime = 0;
    }
    
    update(deltaTime, enemies) {
        this.cooldown = Math.max(0, this.cooldown - deltaTime);
        this.recoilOffset = Math.max(0, this.recoilOffset - deltaTime * 200);
        this.animationTime += deltaTime;
        
        this.target = this.findTarget(enemies);
        
        // Update cannon angle to track target
        if (this.target) {
            const targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            this.cannonAngle = targetAngle;
        }
        
        if (this.target && this.cooldown === 0) {
            this.shoot();
            this.cooldown = 1 / this.fireRate;
        }
        
        // Update cannonballs
        this.cannonballs = this.cannonballs.filter(ball => {
            ball.x += ball.vx * deltaTime;
            ball.y += ball.vy * deltaTime;
            ball.life -= deltaTime;
            
            if (ball.life <= 0) {
                // Create explosion
                this.explosions.push({
                    x: ball.x,
                    y: ball.y,
                    radius: 0,
                    maxRadius: 40,
                    life: 0.5,
                    maxLife: 0.5
                });
                return false;
            }
            return true;
        });
        
        // Update explosions
        this.explosions = this.explosions.filter(explosion => {
            explosion.life -= deltaTime;
            explosion.radius = (1 - explosion.life / explosion.maxLife) * explosion.maxRadius;
            return explosion.life > 0;
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
            this.recoilOffset = 15;
            
            // Create cannonball
            const cannonballSpeed = 300;
            const distance = Math.hypot(this.target.x - this.x, this.target.y - this.y);
            const lifetime = distance / cannonballSpeed;
            
            this.cannonballs.push({
                x: this.x + Math.cos(this.cannonAngle) * 25,
                y: this.y + Math.sin(this.cannonAngle) * 25,
                vx: Math.cos(this.cannonAngle) * cannonballSpeed,
                vy: Math.sin(this.cannonAngle) * cannonballSpeed,
                life: lifetime,
                maxLife: lifetime
            });
        }
    }
    
    render(ctx) {
        // Calculate tower size based on grid cell size (2x2 cells)
        const baseResolution = 1920;
        const scaleFactor = Math.max(0.5, Math.min(2.5, ctx.canvas.width / baseResolution));
        const cellSize = Math.floor(32 * scaleFactor);
        const towerSize = cellSize * 2;
        
        // Fortress base (larger square foundation)
        const foundationSize = towerSize * 0.95;
        ctx.fillStyle = '#654321';
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 3;
        ctx.fillRect(this.x - foundationSize/2, this.y - foundationSize/2, foundationSize, foundationSize);
        ctx.strokeRect(this.x - foundationSize/2, this.y - foundationSize/2, foundationSize, foundationSize);
        
        // Fortress corner towers
        const cornerSize = foundationSize * 0.15;
        const offset = foundationSize * 0.4;
        ctx.fillStyle = '#5D4E37';
        const corners = [
            {x: this.x - offset, y: this.y - offset},
            {x: this.x + offset, y: this.y - offset},
            {x: this.x - offset, y: this.y + offset},
            {x: this.x + offset, y: this.y + offset}
        ];
        
        corners.forEach(corner => {
            ctx.fillRect(corner.x - cornerSize/2, corner.y - cornerSize/2, cornerSize, cornerSize);
            ctx.strokeRect(corner.x - cornerSize/2, corner.y - cornerSize/2, cornerSize, cornerSize);
        });
        
        // Main cannon platform (circular)
        const radius = towerSize * 0.3;
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#5D4E37';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Platform reinforcement rings
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 2;
        for (let i = 1; i <= 2; i++) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius * (0.4 + i * 0.2), 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Rotating cannon assembly
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.cannonAngle);
        
        // Cannon mount (with recoil)
        ctx.fillStyle = '#2F2F2F';
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 3;
        const mountRadius = radius * 0.4;
        ctx.beginPath();
        ctx.arc(-this.recoilOffset, 0, mountRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Heavy cannon barrel
        const barrelLength = radius * 1.2;
        const barrelWidth = radius * 0.25;
        ctx.fillStyle = '#2F2F2F';
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 2;
        ctx.fillRect(-this.recoilOffset, -barrelWidth/2, barrelLength, barrelWidth);
        ctx.strokeRect(-this.recoilOffset, -barrelWidth/2, barrelLength, barrelWidth);
        
        // Barrel reinforcement bands
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 3;
        for (let i = 1; i <= 3; i++) {
            const bandX = -this.recoilOffset + (barrelLength * i / 4);
            ctx.beginPath();
            ctx.moveTo(bandX, -barrelWidth/2);
            ctx.lineTo(bandX, barrelWidth/2);
            ctx.stroke();
        }
        
        // Cannon wheels
        const wheelRadius = mountRadius * 0.6;
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#5D4E37';
        ctx.lineWidth = 2;
        
        [-wheelRadius * 1.5, wheelRadius * 1.5].forEach(wheelY => {
            ctx.beginPath();
            ctx.arc(-this.recoilOffset - mountRadius * 0.8, wheelY, wheelRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Wheel spokes
            for (let spoke = 0; spoke < 6; spoke++) {
                const spokeAngle = (spoke / 6) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(-this.recoilOffset - mountRadius * 0.8, wheelY);
                ctx.lineTo(
                    -this.recoilOffset - mountRadius * 0.8 + Math.cos(spokeAngle) * wheelRadius * 0.8,
                    wheelY + Math.sin(spokeAngle) * wheelRadius * 0.8
                );
                ctx.stroke();
            }
        });
        
        ctx.restore();
        
        // Render cannonballs
        this.cannonballs.forEach(ball => {
            const alpha = ball.life / ball.maxLife;
            ctx.fillStyle = `rgba(40, 40, 40, ${alpha})`;
            ctx.strokeStyle = `rgba(20, 20, 20, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Cannonball trail smoke
            ctx.fillStyle = `rgba(100, 100, 100, ${alpha * 0.3})`;
            ctx.beginPath();
            ctx.arc(ball.x - ball.vx * 0.01, ball.y - ball.vy * 0.01, 6, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Render explosions
        this.explosions.forEach(explosion => {
            const alpha = explosion.life / explosion.maxLife;
            
            // Explosion fire
            ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, explosion.radius * 0.6, 0, Math.PI * 2);
            ctx.fill();
            
            // Explosion flash
            ctx.fillStyle = `rgba(255, 255, 0, ${alpha * 0.6})`;
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, explosion.radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
            
            // Explosion shockwave
            ctx.strokeStyle = `rgba(255, 165, 0, ${alpha * 0.4})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
            ctx.stroke();
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
            name: 'Cannon Tower',
            description: 'Heavy artillery with high damage but slow fire rate.',
            damage: '50',
            range: '100',
            fireRate: '0.5/sec',
            cost: 100
        };
    }
}
