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
        
        // Fixed random seed for consistent texture
        this.randomSeed = Math.random() * 1000;
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
    
    // Seeded random function for consistent textures
    seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }
    
    render(ctx) {
        // Calculate tower size based on grid cell size (2x2 cells)
        const baseResolution = 1920;
        const scaleFactor = Math.max(0.5, Math.min(2.5, ctx.canvas.width / baseResolution));
        const cellSize = Math.floor(32 * scaleFactor);
        const towerSize = cellSize * 2;
        
        // 3D fortress shadow (improved)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(this.x - towerSize * 0.45 + 5, this.y - towerSize * 0.2 + 5, towerSize * 0.9, towerSize * 0.6);
        
        // Main fortress base (taller and more imposing)
        const baseSize = towerSize * 0.9;
        const fortressHeight = towerSize * 0.3;
        
        // Fortress foundation with improved 3D effect
        const stoneGradient = ctx.createLinearGradient(
            this.x - baseSize/2, this.y - fortressHeight,
            this.x + baseSize/3, this.y
        );
        stoneGradient.addColorStop(0, '#8A8A8A');
        stoneGradient.addColorStop(0.3, '#696969');
        stoneGradient.addColorStop(0.7, '#5A5A5A');
        stoneGradient.addColorStop(1, '#2F2F2F');
        
        ctx.fillStyle = stoneGradient;
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 3;
        
        // Draw fortress walls with perspective
        ctx.fillRect(this.x - baseSize/2, this.y - fortressHeight, baseSize, fortressHeight);
        ctx.strokeRect(this.x - baseSize/2, this.y - fortressHeight, baseSize, fortressHeight);
        
        // Fixed stone blocks texture (no flickering)
        ctx.strokeStyle = '#3A3A3A';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 3; j++) {
                const blockX = this.x - baseSize/2 + (i + 0.5) * baseSize/5;
                const blockY = this.y - fortressHeight + (j + 0.5) * fortressHeight/3;
                const blockSize = baseSize/6;
                
                // Use seeded random for consistent positioning
                const offsetX = (this.seededRandom(this.randomSeed + i * 7 + j * 13) - 0.5) * 2;
                const offsetY = (this.seededRandom(this.randomSeed + i * 11 + j * 17) - 0.5) * 2;
                const sizeVariance = this.seededRandom(this.randomSeed + i * 19 + j * 23) * 4 - 2;
                
                ctx.strokeRect(
                    blockX - blockSize/2 + offsetX,
                    blockY - blockSize/2 + offsetY,
                    blockSize + sizeVariance,
                    blockSize * 0.7 + sizeVariance * 0.5
                );
            }
        }
        
        // Corner towers with improved 3D effect and height
        const cornerSize = baseSize * 0.15;
        const cornerHeight = fortressHeight * 1.5;
        const offset = baseSize * 0.35;
        const corners3D = [
            {x: this.x - offset, y: this.y - fortressHeight},
            {x: this.x + offset, y: this.y - fortressHeight},
            {x: this.x - offset, y: this.y},
            {x: this.x + offset, y: this.y}
        ];
        
        corners3D.forEach((corner, index) => {
            // Tower shadow with proper depth
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(corner.x - cornerSize + 3, corner.y - cornerHeight + 3, cornerSize * 2, cornerHeight);
            
            // Tower gradient with height
            const towerGradient = ctx.createLinearGradient(
                corner.x - cornerSize, corner.y - cornerHeight,
                corner.x + cornerSize, corner.y
            );
            towerGradient.addColorStop(0, '#A0A0A0');
            towerGradient.addColorStop(0.3, '#8B7355');
            towerGradient.addColorStop(0.7, '#696969');
            towerGradient.addColorStop(1, '#4A4A4A');
            
            ctx.fillStyle = towerGradient;
            ctx.strokeStyle = '#2F2F2F';
            ctx.lineWidth = 2;
            ctx.fillRect(corner.x - cornerSize, corner.y - cornerHeight, cornerSize * 2, cornerHeight);
            ctx.strokeRect(corner.x - cornerSize, corner.y - cornerHeight, cornerSize * 2, cornerHeight);
            
            // Tower crenellations at top
            ctx.fillStyle = '#8A8A8A';
            for (let i = 0; i < 4; i++) {
                if (i % 2 === 0) {
                    const merlonX = corner.x - cornerSize + (i * cornerSize/2);
                    const merlonY = corner.y - cornerHeight;
                    ctx.fillRect(merlonX, merlonY - 8, cornerSize/2, 8);
                    ctx.strokeRect(merlonX, merlonY - 8, cornerSize/2, 8);
                }
            }
            
            // Arrow slits
            ctx.fillStyle = '#000000';
            for (let slit = 0; slit < 2; slit++) {
                const slitY = corner.y - cornerHeight + (slit + 1) * cornerHeight/3;
                ctx.fillRect(corner.x - 2, slitY - 6, 4, 12);
            }
        });
        
        // Central cannon platform with increased height
        const radius = towerSize * 0.22;
        const platformHeight = fortressHeight * 0.3;
        const platformY = this.y - fortressHeight - platformHeight;
        
        // Platform shadow with depth
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(this.x + 3, platformY + 3, radius + 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Platform with stone texture and height
        const platformGradient = ctx.createRadialGradient(
            this.x - radius * 0.4, platformY - radius * 0.4, 0,
            this.x, platformY, radius
        );
        platformGradient.addColorStop(0, '#B8B8B8');
        platformGradient.addColorStop(0.5, '#8A8A8A');
        platformGradient.addColorStop(0.8, '#696969');
        platformGradient.addColorStop(1, '#2F2F2F');
        
        ctx.fillStyle = platformGradient;
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, platformY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Platform side wall (3D cylinder effect)
        ctx.fillStyle = '#696969';
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 2;
        ctx.fillRect(this.x - radius, platformY, radius * 2, platformHeight);
        ctx.strokeRect(this.x - radius, platformY, radius * 2, platformHeight);
        
        // Platform reinforcement rings
        ctx.strokeStyle = '#4A4A4A';
        ctx.lineWidth = 2;
        for (let i = 1; i <= 2; i++) {
            ctx.beginPath();
            ctx.arc(this.x, platformY, radius * (0.4 + i * 0.25), 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Rotating cannon assembly (positioned on elevated platform)
        ctx.save();
        ctx.translate(this.x, platformY);
        ctx.rotate(this.cannonAngle);
        
        // Cannon mount (with recoil and improved design)
        ctx.fillStyle = '#3A3A3A';
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 3;
        const mountRadius = radius * 0.5;
        ctx.beginPath();
        ctx.arc(-this.recoilOffset, 0, mountRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Heavy cannon barrel with improved proportions
        const barrelLength = radius * 1.4;
        const barrelWidth = radius * 0.3;
        ctx.fillStyle = '#2A2A2A';
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 2;
        ctx.fillRect(-this.recoilOffset, -barrelWidth/2, barrelLength, barrelWidth);
        ctx.strokeRect(-this.recoilOffset, -barrelWidth/2, barrelLength, barrelWidth);
        
        // Barrel reinforcement bands (fixed positions)
        ctx.strokeStyle = '#606060';
        ctx.lineWidth = 4;
        for (let i = 1; i <= 3; i++) {
            const bandX = -this.recoilOffset + (barrelLength * i / 4);
            ctx.beginPath();
            ctx.moveTo(bandX, -barrelWidth/2);
            ctx.lineTo(bandX, barrelWidth/2);
            ctx.stroke();
        }
        
        // Cannon muzzle
        ctx.fillStyle = '#1A1A1A';
        ctx.beginPath();
        ctx.arc(-this.recoilOffset + barrelLength, 0, barrelWidth/3, 0, Math.PI * 2);
        ctx.fill();
        
        // Cannon wheels (improved 3D effect)
        const wheelRadius = mountRadius * 0.7;
        ctx.fillStyle = '#654321';
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 2;
        
        [-wheelRadius * 1.2, wheelRadius * 1.2].forEach(wheelY => {
            // Wheel shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(-this.recoilOffset - mountRadius * 0.9 + 1, wheelY + 1, wheelRadius + 1, 0, Math.PI * 2);
            ctx.fill();
            
            // Wheel body
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.arc(-this.recoilOffset - mountRadius * 0.9, wheelY, wheelRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Wheel spokes (fixed positions)
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 3;
            for (let spoke = 0; spoke < 8; spoke++) {
                const spokeAngle = (spoke / 8) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(-this.recoilOffset - mountRadius * 0.9, wheelY);
                ctx.lineTo(
                    -this.recoilOffset - mountRadius * 0.9 + Math.cos(spokeAngle) * wheelRadius * 0.8,
                    wheelY + Math.sin(spokeAngle) * wheelRadius * 0.8
                );
                ctx.stroke();
            }
            
            // Wheel hub
            ctx.fillStyle = '#2F2F2F';
            ctx.beginPath();
            ctx.arc(-this.recoilOffset - mountRadius * 0.9, wheelY, wheelRadius * 0.3, 0, Math.PI * 2);
            ctx.fill();
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
