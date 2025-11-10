export class CannonTower {
    constructor(x, y, gridX, gridY) {
        this.x = x;
        this.y = y;
        this.gridX = gridX;
        this.gridY = gridY;
        this.range = 120;
        this.damage = 40;
        this.splashRadius = 35;
        this.fireRate = 0.4;
        this.cooldown = 0;
        this.target = null;
        
        // Add interaction states
        this.isSelected = false;
        this.isHovered = false;
        
        // Animation properties
        this.trebuchetAngle = 0;
        this.armPosition = 0;
        this.armSpeed = 0;
        this.explosions = [];
        this.fireballs = [];
        this.animationTime = 0;
        this.loadingTime = 0;
        
        // Fixed random seed for consistent texture
        this.randomSeed = Math.random() * 1000;
        
        // Initialize click area as null - will be set during first render
        this.clickArea = null;
        console.log(`CannonTower: Constructor complete, clickArea will be set during render`);
    }
    
    update(deltaTime, enemies) {
        this.cooldown = Math.max(0, this.cooldown - deltaTime);
        this.animationTime += deltaTime;
        
        this.target = this.findTarget(enemies);
        
        // Update trebuchet arm animation
        if (this.armPosition === 2) { // Firing
            this.armSpeed += deltaTime * 10;
            this.armPosition = Math.max(0, this.armPosition - this.armSpeed * deltaTime);
            if (this.armPosition <= 0) {
                this.armPosition = 0;
                this.armSpeed = 0;
            }
        } else if (this.target && this.cooldown === 0) {
            // Loading animation
            this.loadingTime += deltaTime * 1.2;
            this.armPosition = Math.min(1, this.loadingTime);
            
            if (this.armPosition >= 1) {
                this.shoot();
                this.cooldown = 1 / this.fireRate;
                this.armPosition = 2;
                this.armSpeed = 0;
                this.loadingTime = 0;
            }
        } else {
            this.loadingTime = 0;
            this.armPosition = Math.max(0, this.armPosition - deltaTime * 0.3);
        }
        
        // Update trebuchet angle to track target
        if (this.target) {
            const targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            this.trebuchetAngle = targetAngle;
        }
        
        // Update fireballs
        this.fireballs = this.fireballs.filter(fireball => {
            fireball.x += fireball.vx * deltaTime;
            fireball.y += fireball.vy * deltaTime;
            fireball.vy += fireball.gravity * deltaTime;
            fireball.life -= deltaTime;
            fireball.flameAnimation += deltaTime * 8;
            
            // Check if fireball has reached target position or lifetime expired
            if (fireball.life <= 0 || 
                (fireball.life < fireball.maxLife * 0.5 && 
                 Math.hypot(fireball.x - fireball.targetX, fireball.y - fireball.targetY) < 20)) {
                this.explode(fireball.targetX, fireball.targetY, enemies);
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
            // Calculate precise trajectory to hit target
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.hypot(dx, dy);
            
            // Use ballistic trajectory calculation for accuracy
            const gravity = 250;
            const launchAngle = Math.PI / 6; // 30 degrees for optimal range
            const initialSpeed = Math.sqrt((distance * gravity) / Math.sin(2 * launchAngle));
            
            // Calculate flight time to reach target
            const flightTime = distance / (initialSpeed * Math.cos(launchAngle));
            
            this.fireballs.push({
                x: this.x,
                y: this.y - 25, // Start from trebuchet arm height
                vx: (dx / distance) * initialSpeed * Math.cos(launchAngle),
                vy: -initialSpeed * Math.sin(launchAngle), // Negative for upward
                gravity: gravity,
                flameAnimation: 0,
                life: flightTime,
                maxLife: flightTime,
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
            life: 1.0,
            maxLife: 1.0
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
        
        // ALWAYS update click area during render
        const iconSize = 12;
        const iconX = this.x + towerSize/2 - iconSize;
        const iconY = this.y + towerSize/2 - iconSize;
        
        this.clickArea = {
            x: iconX - iconSize/2,
            y: iconY - iconSize/2,
            width: iconSize * 2,
            height: iconSize * 2
        };
        
        if (!this.clickAreaLogged) {
            console.log(`CannonTower: Set clickArea during render:`, this.clickArea, `Canvas: ${ctx.canvas.width}x${ctx.canvas.height}`);
            this.clickAreaLogged = true;
        }
        
        // 3D square tower shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(this.x - towerSize * 0.4 + 5, this.y - towerSize * 0.35 + 5, towerSize * 0.8, towerSize * 0.7);
        
        // Main square tower structure
        const towerWidth = towerSize * 0.8;
        const towerHeight = towerSize * 0.7;
        
        // Stone tower gradient (robust square design)
        const stoneGradient = ctx.createLinearGradient(
            this.x - towerWidth/2, this.y - towerHeight,
            this.x + towerWidth/3, this.y
        );
        stoneGradient.addColorStop(0, '#B8B8B8');
        stoneGradient.addColorStop(0.3, '#969696');
        stoneGradient.addColorStop(0.7, '#696969');
        stoneGradient.addColorStop(1, '#2F2F2F');
        
        ctx.fillStyle = stoneGradient;
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 3;
        ctx.fillRect(this.x - towerWidth/2, this.y - towerHeight, towerWidth, towerHeight);
        ctx.strokeRect(this.x - towerWidth/2, this.y - towerHeight, towerWidth, towerHeight);
        
        // Stone block pattern
        ctx.strokeStyle = '#4A4A4A';
        ctx.lineWidth = 2;
        const blockRows = 6;
        const blockCols = 4;
        
        for (let row = 0; row < blockRows; row++) {
            for (let col = 0; col < blockCols; col++) {
                // Offset every other row for realistic stone pattern
                const offsetX = (row % 2) * (towerWidth / blockCols / 2);
                const blockX = this.x - towerWidth/2 + offsetX + (col * towerWidth / blockCols);
                const blockY = this.y - towerHeight + (row * towerHeight / blockRows);
                const blockWidth = towerWidth / blockCols;
                const blockHeight = towerHeight / blockRows;
                
                if (blockX + blockWidth <= this.x + towerWidth/2) {
                    ctx.strokeRect(blockX, blockY, blockWidth, blockHeight);
                }
            }
        }
        
        // Corner reinforcements
        const cornerSize = towerWidth * 0.08;
        ctx.fillStyle = '#808080';
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 2;
        
        // Four corner reinforcements
        for (let x = -1; x <= 1; x += 2) {
            for (let y = 0; y <= 1; y++) {
                const cornerX = this.x + x * (towerWidth/2 - cornerSize);
                const cornerY = this.y - towerHeight + y * (towerHeight - cornerSize * 2);
                
                ctx.fillRect(cornerX, cornerY, cornerSize, cornerSize * 2);
                ctx.strokeRect(cornerX, cornerY, cornerSize, cornerSize * 2);
            }
        }
        
        // Tower battlements (crenellations)
        ctx.fillStyle = '#969696';
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 2;
        
        const battlementCount = 6;
        const battlementWidth = towerWidth / battlementCount;
        
        for (let i = 0; i < battlementCount; i++) {
            if (i % 2 === 0) { // Every other battlement is raised
                const battlementX = this.x - towerWidth/2 + i * battlementWidth;
                const battlementY = this.y - towerHeight;
                
                ctx.fillRect(battlementX, battlementY - 12, battlementWidth, 12);
                ctx.strokeRect(battlementX, battlementY - 12, battlementWidth, 12);
            }
        }
        
        // Trebuchet platform on top
        const platformY = this.y - towerHeight - 5;
        const platformWidth = towerWidth * 0.9;
        const platformThickness = 8;
        
        // Wooden platform
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.fillRect(this.x - platformWidth/2, platformY - platformThickness, platformWidth, platformThickness);
        ctx.strokeRect(this.x - platformWidth/2, platformY - platformThickness, platformWidth, platformThickness);
        
        // Platform planks
        for (let i = 1; i < 5; i++) {
            const plankX = this.x - platformWidth/2 + (i * platformWidth / 5);
            ctx.beginPath();
            ctx.moveTo(plankX, platformY - platformThickness);
            ctx.lineTo(plankX, platformY);
            ctx.stroke();
        }
        
        // Trebuchet mechanism
        ctx.save();
        ctx.translate(this.x, platformY);
        ctx.rotate(this.trebuchetAngle);
        
        // Trebuchet base (more robust A-frame)
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 6;
        
        // Main support frame
        ctx.beginPath();
        ctx.moveTo(-25, 0);
        ctx.lineTo(0, -20);
        ctx.lineTo(25, 0);
        ctx.stroke();
        
        // Cross braces
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-15, -8);
        ctx.lineTo(15, -8);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(-20, -4);
        ctx.lineTo(20, -4);
        ctx.stroke();
        
        // Pivot point (large axle)
        ctx.fillStyle = '#2F2F2F';
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -15, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Trebuchet arm (longer and more realistic)
        const armLength = platformWidth * 0.6;
        const shortArmLength = armLength * 0.3;
        const armAngle = -Math.PI/2.5 + this.armPosition * Math.PI/1.5;
        
        // Long arm (throwing end)
        const longArmEndX = Math.cos(armAngle) * armLength;
        const longArmEndY = Math.sin(armAngle) * armLength - 15;
        
        // Short arm (counterweight end)
        const shortArmEndX = -Math.cos(armAngle) * shortArmLength;
        const shortArmEndY = -Math.sin(armAngle) * shortArmLength - 15;
        
        // Arm shaft
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(shortArmEndX, shortArmEndY);
        ctx.lineTo(longArmEndX, longArmEndY);
        ctx.stroke();
        
        // Sling at end of long arm
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        
        ctx.save();
        ctx.translate(longArmEndX, longArmEndY);
        ctx.rotate(armAngle + Math.PI/8);
        
        // Sling pouch
        ctx.beginPath();
        ctx.arc(0, 8, 8, 0, Math.PI);
        ctx.stroke();
        ctx.fillRect(-8, 8, 16, 4);
        ctx.strokeRect(-8, 8, 16, 4);
        
        // Sling ropes
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-8, 8);
        ctx.lineTo(0, -5);
        ctx.moveTo(8, 8);
        ctx.lineTo(0, -5);
        ctx.stroke();
        
        ctx.restore();
        
        // Large counterweight
        ctx.fillStyle = '#696969';
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 3;
        
        const counterweightSize = 20;
        ctx.fillRect(shortArmEndX - counterweightSize/2, shortArmEndY - counterweightSize/2, 
                     counterweightSize, counterweightSize * 1.5);
        ctx.strokeRect(shortArmEndX - counterweightSize/2, shortArmEndY - counterweightSize/2, 
                       counterweightSize, counterweightSize * 1.5);
        
        // Stone texture on counterweight
        ctx.strokeStyle = '#4A4A4A';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 2; j++) {
                const stoneX = shortArmEndX - 8 + i * 5;
                const stoneY = shortArmEndY - 8 + j * 8;
                ctx.strokeRect(stoneX, stoneY, 5, 7);
            }
        }
        
        // Support chains for counterweight
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 3;
        
        // Chain links
        for (let chain = -1; chain <= 1; chain += 2) {
            const chainX = shortArmEndX + chain * 8;
            ctx.beginPath();
            ctx.moveTo(chainX, shortArmEndY - counterweightSize/2);
            ctx.lineTo(chainX, shortArmEndY + counterweightSize);
            ctx.stroke();
        }
        
        // Fireball in sling (when loading)
        if (this.armPosition > 0.1 && this.armPosition < 1.9) {
            ctx.save();
            ctx.translate(longArmEndX, longArmEndY);
            ctx.rotate(armAngle + Math.PI/8);
            
            // Fireball in sling
            const fireballRadius = 5;
            const fireGradient = ctx.createRadialGradient(0, 6, 0, 0, 6, fireballRadius);
            fireGradient.addColorStop(0, '#FFFF00');
            fireGradient.addColorStop(0.3, '#FF8C00');
            fireGradient.addColorStop(0.7, '#FF4500');
            fireGradient.addColorStop(1, '#8B0000');
            
            ctx.fillStyle = fireGradient;
            ctx.beginPath();
            ctx.arc(0, 6, fireballRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Flame effects
            for (let i = 0; i < 6; i++) {
                const flameAngle = (i / 6) * Math.PI * 2;
                const flameX = Math.cos(flameAngle) * (fireballRadius + 3);
                const flameY = 6 + Math.sin(flameAngle) * (fireballRadius + 3);
                
                ctx.fillStyle = `rgba(255, ${100 + Math.random() * 155}, 0, 0.7)`;
                ctx.beginPath();
                ctx.arc(flameX, flameY, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
        
        ctx.restore();
        
        // Render flying fireballs
        this.fireballs.forEach(fireball => {
            ctx.save();
            ctx.translate(fireball.x, fireball.y);
            
            // Main fireball with animated flames
            const fireballRadius = 6;
            const flameFlicker = Math.sin(fireball.flameAnimation) * 0.3 + 1;
            
            // Outer flame layer
            const outerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, fireballRadius * flameFlicker);
            outerGradient.addColorStop(0, '#FFFF00');
            outerGradient.addColorStop(0.3, '#FF8C00');
            outerGradient.addColorStop(0.7, '#FF4500');
            outerGradient.addColorStop(1, 'rgba(139, 0, 0, 0)');
            
            ctx.fillStyle = outerGradient;
            ctx.beginPath();
            ctx.arc(0, 0, fireballRadius * flameFlicker, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner core
            const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, fireballRadius * 0.6);
            coreGradient.addColorStop(0, '#FFFFFF');
            coreGradient.addColorStop(0.4, '#FFFF00');
            coreGradient.addColorStop(1, '#FF8C00');
            
            ctx.fillStyle = coreGradient;
            ctx.beginPath();
            ctx.arc(0, 0, fireballRadius * 0.6, 0, Math.PI * 2);
            ctx.fill();
            
            // Trailing flames
            for (let i = 0; i < 8; i++) {
                const trailAngle = (i / 8) * Math.PI * 2;
                const trailDistance = fireballRadius + Math.random() * 6;
                const trailX = Math.cos(trailAngle) * trailDistance;
                const trailY = Math.sin(trailAngle) * trailDistance;
                
                ctx.fillStyle = `rgba(255, ${100 + Math.random() * 100}, 0, ${0.3 + Math.random() * 0.4})`;
                ctx.beginPath();
                ctx.arc(trailX, trailY, 1 + Math.random() * 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Smoke trail
            ctx.fillStyle = 'rgba(60, 60, 60, 0.3)';
            ctx.beginPath();
            ctx.arc(-fireball.vx * 0.03, -fireball.vy * 0.03 + 5, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
        
        // Render explosions with fire effects
        this.explosions.forEach(explosion => {
            const alpha = explosion.life / explosion.maxLife;
            
            // Outer fire ring
            ctx.strokeStyle = `rgba(255, 100, 0, ${alpha * 0.4})`;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, explosion.radius * 1.3, 0, Math.PI * 2);
            ctx.stroke();
            
            // Main explosion fire
            const explosionGradient = ctx.createRadialGradient(
                explosion.x, explosion.y, 0,
                explosion.x, explosion.y, explosion.radius
            );
            explosionGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
            explosionGradient.addColorStop(0.2, `rgba(255, 255, 0, ${alpha * 0.9})`);
            explosionGradient.addColorStop(0.5, `rgba(255, 100, 0, ${alpha * 0.8})`);
            explosionGradient.addColorStop(0.8, `rgba(255, 0, 0, ${alpha * 0.6})`);
            explosionGradient.addColorStop(1, `rgba(139, 0, 0, 0)`);
            
            ctx.fillStyle = explosionGradient;
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Core white flash
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, explosion.radius * 0.2, 0, Math.PI * 2);
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
        
        // Add clickable icon in bottom right corner of 2x2 grid
        // Icon background with hover/selection effects
        let pulseIntensity = Math.sin(Date.now() * 0.004) * 0.2 + 0.8;
        
        if (this.isSelected) {
            pulseIntensity = 1.0;
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 15;
        } else if (this.isHovered) {
            pulseIntensity = 1.0;
            ctx.shadowColor = '#FF8C00';
            ctx.shadowBlur = 10;
        }
        
        ctx.fillStyle = `rgba(139, 69, 19, ${pulseIntensity * 0.8})`;
        ctx.beginPath();
        ctx.arc(iconX, iconY, iconSize + 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Icon circle
        if (this.isSelected) {
            ctx.fillStyle = '#FFD700';
        } else if (this.isHovered) {
            ctx.fillStyle = '#FF8C00';
        } else {
            ctx.fillStyle = '#8B4513';
        }
        
        ctx.beginPath();
        ctx.arc(iconX, iconY, iconSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Icon border
        ctx.strokeStyle = this.isSelected ? '#FFD700' : (this.isHovered ? '#FF8C00' : '#654321');
        ctx.lineWidth = this.isSelected || this.isHovered ? 3 : 2;
        ctx.stroke();
        
        // Trebuchet icon
        ctx.fillStyle = this.isSelected || this.isHovered ? '#000' : '#FFD700';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', iconX, iconY);
        
        // Clear shadow
        ctx.shadowBlur = 0;
    }
    
    onClick() {
        // Cannon towers don't have interactive menus
        console.log('CannonTower: Clicked, but no menu available');
        return null;
    }
    
    static getInfo() {
        return {
            name: 'Trebuchet Tower',
            description: 'Robust stone tower with trebuchet that hurls accurate fireballs.',
            damage: '40 (AoE)',
            range: '120',
            fireRate: '0.4/sec',
            cost: 100
        };
    }
}
