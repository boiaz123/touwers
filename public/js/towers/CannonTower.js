export class CannonTower {
    constructor(x, y, gridX, gridY) {
        this.x = x;
        this.y = y;
        this.gridX = gridX;
        this.gridY = gridY;
        this.range = 120; // Increased range for catapult
        this.damage = 40; // Reduced per-target damage but AoE
        this.splashRadius = 35; // AoE damage radius
        this.fireRate = 0.4; // Slower fire rate for catapult
        this.cooldown = 0;
        this.target = null;
        
        // Animation properties
        this.catapultAngle = 0;
        this.armPosition = 0; // 0 = ready, 1 = loaded/pulled back, 2 = firing
        this.armSpeed = 0;
        this.explosions = [];
        this.bombs = [];
        this.animationTime = 0;
        this.loadingTime = 0;
        
        // Fixed random seed for consistent texture
        this.randomSeed = Math.random() * 1000;
    }
    
    update(deltaTime, enemies) {
        this.cooldown = Math.max(0, this.cooldown - deltaTime);
        this.animationTime += deltaTime;
        
        this.target = this.findTarget(enemies);
        
        // Update catapult arm animation
        if (this.armPosition === 2) { // Firing
            this.armSpeed += deltaTime * 15; // Acceleration
            this.armPosition = Math.min(1, this.armPosition - this.armSpeed * deltaTime);
            if (this.armPosition <= 0) {
                this.armPosition = 0;
                this.armSpeed = 0;
            }
        } else if (this.target && this.cooldown === 0) {
            // Loading animation
            this.loadingTime += deltaTime * 2;
            this.armPosition = Math.min(1, this.loadingTime);
            
            if (this.armPosition >= 1) {
                this.shoot();
                this.cooldown = 1 / this.fireRate;
                this.armPosition = 2; // Start firing animation
                this.armSpeed = 0;
                this.loadingTime = 0;
            }
        } else {
            this.loadingTime = 0;
            this.armPosition = Math.max(0, this.armPosition - deltaTime * 0.5);
        }
        
        // Update catapult angle to track target
        if (this.target) {
            const targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            this.catapultAngle = targetAngle;
        }
        
        // Update bombs
        this.bombs = this.bombs.filter(bomb => {
            bomb.x += bomb.vx * deltaTime;
            bomb.y += bomb.vy * deltaTime;
            bomb.vy += 300 * deltaTime; // Gravity for realistic arc
            bomb.rotation += bomb.rotationSpeed * deltaTime;
            bomb.life -= deltaTime;
            
            if (bomb.life <= 0) {
                // Create explosion and deal AoE damage
                this.explode(bomb.x, bomb.y, enemies);
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
            // Calculate bomb trajectory with high arc
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.hypot(dx, dy);
            const bombSpeed = 250; // Slower than cannon for more realistic catapult
            const arcHeight = distance * 0.3; // High arc for catapult
            
            this.bombs.push({
                x: this.x + Math.cos(this.catapultAngle) * 30,
                y: this.y + Math.sin(this.catapultAngle) * 30 - 20, // Start from catapult arm
                vx: (dx / distance) * bombSpeed,
                vy: (dy / distance) * bombSpeed - arcHeight,
                rotation: 0,
                rotationSpeed: Math.random() * 8 + 4,
                life: distance / bombSpeed + 1.5,
                targetX: this.target.x,
                targetY: this.target.y
            });
        }
    }
    
    explode(x, y, enemies) {
        // Create visual explosion
        this.explosions.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: this.splashRadius * 1.5,
            life: 0.8,
            maxLife: 0.8
        });
        
        // Deal AoE damage to all enemies in range
        enemies.forEach(enemy => {
            const distance = Math.hypot(enemy.x - x, enemy.y - y);
            if (distance <= this.splashRadius) {
                // Damage falls off with distance
                const damageFalloff = 1 - (distance / this.splashRadius) * 0.5;
                const actualDamage = Math.floor(this.damage * damageFalloff);
                enemy.takeDamage(actualDamage);
            }
        });
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
        const fortressHeight = towerSize * 0.25;
        
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
            for (let j = 0; j < 2; j++) {
                const blockX = this.x - baseSize/2 + (i + 0.5) * baseSize/5;
                const blockY = this.y - fortressHeight + (j + 0.5) * fortressHeight/2;
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
        
        // Corner towers (smaller for catapult base)
        const cornerSize = baseSize * 0.12;
        const cornerHeight = fortressHeight * 1.2;
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
            ctx.fillRect(corner.x - cornerSize + 2, corner.y - cornerHeight + 2, cornerSize * 2, cornerHeight);
            
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
            for (let i = 0; i < 3; i++) {
                if (i % 2 === 0) {
                    const merlonX = corner.x - cornerSize + (i * cornerSize);
                    const merlonY = corner.y - cornerHeight;
                    ctx.fillRect(merlonX, merlonY - 6, cornerSize, 6);
                    ctx.strokeRect(merlonX, merlonY - 6, cornerSize, 6);
                }
            }
        });
        
        // Catapult platform
        const platformRadius = towerSize * 0.2;
        const platformHeight = fortressHeight * 0.2;
        const platformY = this.y - fortressHeight - platformHeight;
        
        // Platform shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(this.x + 2, platformY + 2, platformRadius + 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Wooden platform
        const platformGradient = ctx.createRadialGradient(
            this.x - platformRadius * 0.3, platformY - platformRadius * 0.3, 0,
            this.x, platformY, platformRadius
        );
        platformGradient.addColorStop(0, '#DEB887');
        platformGradient.addColorStop(0.7, '#CD853F');
        platformGradient.addColorStop(1, '#8B7355');
        
        ctx.fillStyle = platformGradient;
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, platformY, platformRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Catapult mechanism
        ctx.save();
        ctx.translate(this.x, platformY);
        ctx.rotate(this.catapultAngle);
        
        // Catapult base frame
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
        
        // Base support beams (A-frame)
        ctx.beginPath();
        ctx.moveTo(-15, 10);
        ctx.lineTo(0, -10);
        ctx.lineTo(15, 10);
        ctx.stroke();
        
        // Cross brace
        ctx.beginPath();
        ctx.moveTo(-8, 2);
        ctx.lineTo(8, 2);
        ctx.stroke();
        
        // Pivot point
        ctx.fillStyle = '#2F2F2F';
        ctx.beginPath();
        ctx.arc(0, -5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Catapult arm (animated)
        const armLength = platformRadius * 1.5;
        const armAngle = -Math.PI/3 + this.armPosition * Math.PI/2; // Swings from back to front
        const armEndX = Math.cos(armAngle) * armLength;
        const armEndY = Math.sin(armAngle) * armLength - 5;
        
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(armEndX, armEndY);
        ctx.stroke();
        
        // Bucket at end of arm
        ctx.fillStyle = '#2F2F2F';
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 2;
        ctx.fillRect(armEndX - 4, armEndY - 3, 8, 6);
        ctx.strokeRect(armEndX - 4, armEndY - 3, 8, 6);
        
        // Counterweight
        const counterweightX = -Math.cos(armAngle) * armLength * 0.3;
        const counterweightY = -Math.sin(armAngle) * armLength * 0.3 - 5;
        
        ctx.fillStyle = '#696969';
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 2;
        ctx.fillRect(counterweightX - 6, counterweightY - 8, 12, 16);
        ctx.strokeRect(counterweightX - 6, counterweightY - 8, 12, 16);
        
        // Tension ropes
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-12, 8);
        ctx.lineTo(counterweightX, counterweightY + 8);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(12, 8);
        ctx.lineTo(counterweightX, counterweightY + 8);
        ctx.stroke();
        
        // Bomb in bucket (when loading)
        if (this.armPosition > 0.1 && this.armPosition < 1.8) {
            ctx.fillStyle = '#1A1A1A';
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(armEndX, armEndY - 2, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Fuse
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(armEndX, armEndY - 5);
            ctx.lineTo(armEndX - 2, armEndY - 8);
            ctx.stroke();
        }
        
        ctx.restore();
        
        // Render flying bombs
        this.bombs.forEach(bomb => {
            ctx.save();
            ctx.translate(bomb.x, bomb.y);
            ctx.rotate(bomb.rotation);
            
            // Bomb body
            ctx.fillStyle = '#1A1A1A';
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Sparkling fuse
            ctx.strokeStyle = '#FF4500';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -5);
            ctx.lineTo(-3, -8);
            ctx.stroke();
            
            // Sparks from fuse
            for (let i = 0; i < 3; i++) {
                const sparkX = -3 + Math.random() * 2;
                const sparkY = -8 + Math.random() * 2;
                ctx.fillStyle = Math.random() < 0.5 ? '#FFD700' : '#FF4500';
                ctx.beginPath();
                ctx.arc(sparkX, sparkY, 1, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Smoke trail
            ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
            ctx.beginPath();
            ctx.arc(-bomb.vx * 0.02, -bomb.vy * 0.02, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
        
        // Render explosions with improved effects
        this.explosions.forEach(explosion => {
            const alpha = explosion.life / explosion.maxLife;
            
            // Multiple explosion layers for better effect
            // Outer shockwave
            ctx.strokeStyle = `rgba(255, 165, 0, ${alpha * 0.3})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, explosion.radius * 1.2, 0, Math.PI * 2);
            ctx.stroke();
            
            // Main explosion fire
            ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, explosion.radius * 0.8, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner explosion flash
            ctx.fillStyle = `rgba(255, 255, 0, ${alpha * 0.9})`;
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, explosion.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
            
            // Core white flash
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, explosion.radius * 0.15, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Range indicator
        if (this.target) {
            ctx.strokeStyle = 'rgba(139, 69, 19, 0.2)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
            
            // Show splash damage radius at target
            ctx.strokeStyle = 'rgba(255, 100, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.target.x, this.target.y, this.splashRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    
    static getInfo() {
        return {
            name: 'Catapult Tower',
            description: 'Heavy artillery that hurls explosive bombs dealing area damage.',
            damage: '40 (AoE)',
            range: '120',
            fireRate: '0.4/sec',
            cost: 100
        };
    }
}
