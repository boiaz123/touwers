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
        this.fireballs = [];
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
            this.armSpeed += deltaTime * 12; // Acceleration
            this.armPosition = Math.max(0, this.armPosition - this.armSpeed * deltaTime);
            if (this.armPosition <= 0) {
                this.armPosition = 0;
                this.armSpeed = 0;
            }
        } else if (this.target && this.cooldown === 0) {
            // Loading animation
            this.loadingTime += deltaTime * 1.5;
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
        
        // Update fireballs
        this.fireballs = this.fireballs.filter(fireball => {
            fireball.x += fireball.vx * deltaTime;
            fireball.y += fireball.vy * deltaTime;
            fireball.vy += 280 * deltaTime; // Gravity for realistic arc
            fireball.life -= deltaTime;
            fireball.flameAnimation += deltaTime * 8;
            
            if (fireball.life <= 0) {
                // Create explosion and deal AoE damage
                this.explode(fireball.x, fireball.y, enemies);
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
            // Calculate fireball trajectory with high arc
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.hypot(dx, dy);
            const fireballSpeed = 200; // Slower for more dramatic arc
            const arcHeight = distance * 0.4; // High arc for catapult
            
            this.fireballs.push({
                x: this.x + Math.cos(this.catapultAngle) * 25,
                y: this.y + Math.sin(this.catapultAngle) * 25 - 30, // Start from catapult arm
                vx: (dx / distance) * fireballSpeed,
                vy: (dy / distance) * fireballSpeed - arcHeight,
                flameAnimation: 0,
                life: distance / fireballSpeed + 2,
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
        
        // 3D cobblestone tower shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(this.x + 4, this.y + 4, towerSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Main cobblestone tower structure
        const towerRadius = towerSize * 0.4;
        const towerHeight = towerSize * 0.6;
        
        // Cobblestone tower gradient (cylindrical with 3D effect)
        const stoneGradient = ctx.createRadialGradient(
            this.x - towerRadius * 0.3, this.y - towerHeight - towerRadius * 0.3, 0,
            this.x, this.y - towerHeight/2, towerRadius
        );
        stoneGradient.addColorStop(0, '#A9A9A9');
        stoneGradient.addColorStop(0.4, '#808080');
        stoneGradient.addColorStop(0.7, '#696969');
        stoneGradient.addColorStop(1, '#2F2F2F');
        
        ctx.fillStyle = stoneGradient;
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y - towerHeight/2, towerRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Cobblestone texture with individual stones
        ctx.strokeStyle = '#4A4A4A';
        ctx.lineWidth = 1;
        const stoneRows = 8;
        const stoneCols = 12;
        
        for (let row = 0; row < stoneRows; row++) {
            for (let col = 0; col < stoneCols; col++) {
                const angle = (col / stoneCols) * Math.PI * 2;
                const radiusOffset = row * (towerRadius * 1.8 / stoneRows) - towerRadius * 0.9;
                const currentRadius = Math.abs(radiusOffset);
                
                if (currentRadius < towerRadius) {
                    const stoneX = this.x + Math.cos(angle) * currentRadius;
                    const stoneY = this.y - towerHeight/2 + radiusOffset;
                    
                    // Use seeded random for consistent stone sizes
                    const stoneSize = 3 + this.seededRandom(this.randomSeed + row * 17 + col * 13) * 3;
                    const offsetX = (this.seededRandom(this.randomSeed + row * 19 + col * 23) - 0.5) * 2;
                    const offsetY = (this.seededRandom(this.randomSeed + row * 29 + col * 31) - 0.5) * 2;
                    
                    // Draw individual cobblestone
                    ctx.beginPath();
                    ctx.arc(stoneX + offsetX, stoneY + offsetY, stoneSize, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }
        
        // Tower battlements (crenellations)
        ctx.fillStyle = '#808080';
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 12; i++) {
            if (i % 2 === 0) {
                const angle = (i / 12) * Math.PI * 2;
                const battlementX = this.x + Math.cos(angle) * (towerRadius + 2);
                const battlementY = this.y - towerHeight + Math.sin(angle) * (towerRadius + 2);
                
                ctx.fillRect(battlementX - 4, battlementY - 8, 8, 12);
                ctx.strokeRect(battlementX - 4, battlementY - 8, 8, 12);
            }
        }
        
        // Catapult platform on top
        const platformY = this.y - towerHeight;
        const platformRadius = towerRadius * 0.8;
        
        // Platform
        ctx.fillStyle = '#654321';
        ctx.strokeStyle = '#5D4E37';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, platformY, platformRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Wooden planks on platform
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(this.x, platformY);
            ctx.lineTo(this.x + Math.cos(angle) * platformRadius, platformY + Math.sin(angle) * platformRadius);
            ctx.stroke();
        }
        
        // Catapult mechanism
        ctx.save();
        ctx.translate(this.x, platformY);
        ctx.rotate(this.catapultAngle);
        
        // Catapult base frame (more robust design)
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 4;
        
        // Sturdy A-frame base
        ctx.beginPath();
        ctx.moveTo(-18, 12);
        ctx.lineTo(0, -8);
        ctx.lineTo(18, 12);
        ctx.moveTo(-12, 4);
        ctx.lineTo(12, 4);
        ctx.stroke();
        
        // Base support
        ctx.fillRect(-15, 8, 30, 8);
        ctx.strokeRect(-15, 8, 30, 8);
        
        // Pivot point (metal axle)
        ctx.fillStyle = '#2F2F2F';
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -3, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Catapult arm (animated)
        const armLength = platformRadius;
        const armAngle = -Math.PI/2.2 + this.armPosition * Math.PI/1.8; // Wider swing
        const armEndX = Math.cos(armAngle) * armLength;
        const armEndY = Math.sin(armAngle) * armLength - 3;
        
        // Arm shaft
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, -3);
        ctx.lineTo(armEndX, armEndY);
        ctx.stroke();
        
        // Bucket/cup at end of arm
        ctx.fillStyle = '#2F2F2F';
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 2;
        
        // Draw bucket as a small arc
        ctx.save();
        ctx.translate(armEndX, armEndY);
        ctx.rotate(armAngle + Math.PI/6);
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI);
        ctx.stroke();
        ctx.fillRect(-6, 0, 12, 3);
        ctx.strokeRect(-6, 0, 12, 3);
        ctx.restore();
        
        // Counterweight (stone block)
        const counterweightX = -Math.cos(armAngle) * armLength * 0.25;
        const counterweightY = -Math.sin(armAngle) * armLength * 0.25 - 3;
        
        ctx.fillStyle = '#696969';
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 2;
        ctx.fillRect(counterweightX - 8, counterweightY - 10, 16, 20);
        ctx.strokeRect(counterweightX - 8, counterweightY - 10, 16, 20);
        
        // Stone texture on counterweight
        ctx.strokeStyle = '#4A4A4A';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 2; j++) {
                const stoneX = counterweightX - 6 + i * 4;
                const stoneY = counterweightY - 8 + j * 8;
                ctx.strokeRect(stoneX, stoneY, 4, 6);
            }
        }
        
        // Tension ropes
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-15, 10);
        ctx.lineTo(counterweightX, counterweightY + 10);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(15, 10);
        ctx.lineTo(counterweightX, counterweightY + 10);
        ctx.stroke();
        
        // Fireball in bucket (when loading)
        if (this.armPosition > 0.1 && this.armPosition < 1.9) {
            ctx.save();
            ctx.translate(armEndX, armEndY);
            ctx.rotate(armAngle + Math.PI/6);
            
            // Fireball
            const fireballRadius = 4;
            const fireGradient = ctx.createRadialGradient(0, -2, 0, 0, -2, fireballRadius);
            fireGradient.addColorStop(0, '#FFFF00');
            fireGradient.addColorStop(0.3, '#FF8C00');
            fireGradient.addColorStop(0.7, '#FF4500');
            fireGradient.addColorStop(1, '#8B0000');
            
            ctx.fillStyle = fireGradient;
            ctx.beginPath();
            ctx.arc(0, -2, fireballRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Flame flickers
            for (let i = 0; i < 5; i++) {
                const flameAngle = (i / 5) * Math.PI * 2;
                const flameX = Math.cos(flameAngle) * (fireballRadius + 2);
                const flameY = -2 + Math.sin(flameAngle) * (fireballRadius + 2);
                
                ctx.fillStyle = `rgba(255, ${100 + Math.random() * 155}, 0, 0.6)`;
                ctx.beginPath();
                ctx.arc(flameX, flameY, 1, 0, Math.PI * 2);
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
    }
    
    static getInfo() {
        return {
            name: 'Catapult Tower',
            description: 'Cobblestone tower with catapult that hurls explosive fireballs.',
            damage: '40 (AoE)',
            range: '120',
            fireRate: '0.4/sec',
            cost: 100
        };
    }
}
