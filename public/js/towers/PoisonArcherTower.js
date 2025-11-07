export class PoisonArcherTower {
    constructor(x, y, gridX, gridY) {
        this.x = x;
        this.y = y;
        this.gridX = gridX;
        this.gridY = gridY;
        this.range = 130;
        this.damage = 12;
        this.fireRate = 1.2;
        this.cooldown = 0;
        this.target = null;
        
        // Animation properties
        this.animationTime = 0;
        this.archerPosition = { x: 0, y: 0, hidden: true };
        this.drawback = 0;
        this.poisonArrows = [];
        this.poisonClouds = [];
        this.bushRustle = 0;
        
        // Random bush positions
        this.bushes = [];
        for (let i = 0; i < 6; i++) {
            this.bushes.push({
                x: this.x + (Math.random() - 0.5) * 80,
                y: this.y + (Math.random() - 0.5) * 80,
                size: Math.random() * 15 + 20,
                rustleOffset: Math.random() * Math.PI * 2
            });
        }
    }
    
    update(deltaTime, enemies) {
        this.cooldown = Math.max(0, this.cooldown - deltaTime);
        this.animationTime += deltaTime;
        this.drawback = Math.max(0, this.drawback - deltaTime * 3);
        this.bushRustle = Math.sin(this.animationTime * 2) * 0.1;
        
        this.target = this.findTarget(enemies);
        
        // Update archer position based on target
        if (this.target) {
            // Find best bush to shoot from
            let bestBush = null;
            let bestScore = -1;
            
            this.bushes.forEach(bush => {
                const distToTarget = Math.hypot(this.target.x - bush.x, this.target.y - bush.y);
                const distToTower = Math.hypot(bush.x - this.x, bush.y - this.y);
                
                if (distToTarget <= this.range && distToTower <= 40) {
                    const score = this.range - distToTarget;
                    if (score > bestScore) {
                        bestScore = score;
                        bestBush = bush;
                    }
                }
            });
            
            if (bestBush) {
                this.archerPosition.x = bestBush.x;
                this.archerPosition.y = bestBush.y;
                this.archerPosition.hidden = false;
            }
        } else {
            this.archerPosition.hidden = true;
        }
        
        if (this.target && this.cooldown === 0 && !this.archerPosition.hidden) {
            this.shoot();
            this.cooldown = 1 / this.fireRate;
        }
        
        // Update poison arrows
        this.poisonArrows = this.poisonArrows.filter(arrow => {
            arrow.x += arrow.vx * deltaTime;
            arrow.y += arrow.vy * deltaTime;
            arrow.vy += 180 * deltaTime; // Gravity
            arrow.life -= deltaTime;
            arrow.rotation = Math.atan2(arrow.vy, arrow.vx);
            
            // Check if arrow hits target area
            if (arrow.life <= 0 || Math.hypot(arrow.x - arrow.targetX, arrow.y - arrow.targetY) < 15) {
                this.createPoisonCloud(arrow.x, arrow.y);
                return false;
            }
            return true;
        });
        
        // Update poison clouds
        this.poisonClouds = this.poisonClouds.filter(cloud => {
            cloud.life -= deltaTime;
            cloud.radius = cloud.maxRadius * (1 - cloud.life / cloud.maxLife) * 0.8 + cloud.maxRadius * 0.2;
            
            // Apply poison damage to enemies in cloud
            enemies.forEach(enemy => {
                const distance = Math.hypot(enemy.x - cloud.x, enemy.y - cloud.y);
                if (distance <= cloud.radius) {
                    if (!enemy.poisoned || enemy.poisonTimer <= 0) {
                        enemy.poisoned = true;
                        enemy.poisonTimer = 3.0;
                        enemy.poisonDamage = 2;
                    }
                }
            });
            
            return cloud.life > 0;
        });
        
        // Apply poison effects to enemies
        enemies.forEach(enemy => {
            if (enemy.poisoned && enemy.poisonTimer > 0) {
                enemy.poisonTimer -= deltaTime;
                enemy.poisonTickTimer = (enemy.poisonTickTimer || 0) - deltaTime;
                
                if (enemy.poisonTickTimer <= 0) {
                    enemy.takeDamage(enemy.poisonDamage || 2);
                    enemy.poisonTickTimer = 0.5;
                }
                
                if (enemy.poisonTimer <= 0) {
                    enemy.poisoned = false;
                }
            }
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
        if (this.target && !this.archerPosition.hidden) {
            this.target.takeDamage(this.damage);
            this.drawback = 1;
            
            const dx = this.target.x - this.archerPosition.x;
            const dy = this.target.y - this.archerPosition.y;
            const distance = Math.hypot(dx, dy);
            const arrowSpeed = 350;
            const arcHeight = distance * 0.08;
            
            this.poisonArrows.push({
                x: this.archerPosition.x,
                y: this.archerPosition.y,
                vx: (dx / distance) * arrowSpeed,
                vy: (dy / distance) * arrowSpeed - arcHeight,
                rotation: Math.atan2(dy, dx),
                life: distance / arrowSpeed + 0.5,
                targetX: this.target.x,
                targetY: this.target.y
            });
        }
    }
    
    createPoisonCloud(x, y) {
        this.poisonClouds.push({
            x: x,
            y: y,
            radius: 5,
            maxRadius: 25,
            life: 4.0,
            maxLife: 4.0
        });
    }
    
    render(ctx) {
        const baseResolution = 1920;
        const scaleFactor = Math.max(0.5, Math.min(2.5, ctx.canvas.width / baseResolution));
        const cellSize = Math.floor(32 * scaleFactor);
        const towerSize = cellSize * 2;
        
        // Render bushes
        this.bushes.forEach((bush, index) => {
            ctx.save();
            ctx.translate(bush.x, bush.y);
            
            const rustleAmount = Math.sin(this.animationTime * 3 + bush.rustleOffset) * this.bushRustle;
            ctx.rotate(rustleAmount);
            
            // Bush shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.arc(2, 2, bush.size * 0.8, 0, Math.PI * 2);
            ctx.fill();
            
            // Main bush body
            const bushGradient = ctx.createRadialGradient(
                -bush.size * 0.3, -bush.size * 0.3, 0,
                0, 0, bush.size
            );
            bushGradient.addColorStop(0, '#228B22');
            bushGradient.addColorStop(0.7, '#006400');
            bushGradient.addColorStop(1, '#2F4F2F');
            
            ctx.fillStyle = bushGradient;
            ctx.beginPath();
            ctx.arc(0, 0, bush.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Bush texture (smaller leaf clusters)
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const leafX = Math.cos(angle) * bush.size * 0.6;
                const leafY = Math.sin(angle) * bush.size * 0.6;
                const leafSize = bush.size * 0.2;
                
                ctx.fillStyle = '#32CD32';
                ctx.beginPath();
                ctx.arc(leafX, leafY, leafSize, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Central darker area
            ctx.fillStyle = '#1C5F1C';
            ctx.beginPath();
            ctx.arc(0, 0, bush.size * 0.3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
        
        // Render hidden archer if not concealed
        if (!this.archerPosition.hidden && this.target) {
            ctx.save();
            ctx.translate(this.archerPosition.x, this.archerPosition.y);
            
            // Archer body (partially visible through bush)
            ctx.fillStyle = 'rgba(101, 67, 33, 0.7)';
            ctx.fillRect(-2, -4, 4, 8);
            
            // Archer head
            ctx.fillStyle = 'rgba(221, 190, 169, 0.7)';
            ctx.beginPath();
            ctx.arc(0, -6, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Hood
            ctx.fillStyle = 'rgba(34, 139, 34, 0.8)';
            ctx.beginPath();
            ctx.arc(0, -6, 3, Math.PI, Math.PI * 2);
            ctx.fill();
            
            // Bow and aiming
            const aimAngle = Math.atan2(this.target.y - this.archerPosition.y, this.target.x - this.archerPosition.x);
            ctx.rotate(aimAngle);
            
            // Bow
            ctx.strokeStyle = 'rgba(101, 67, 33, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(6, 0, 4, -0.6, 0.6);
            ctx.stroke();
            
            // Draw string if preparing to shoot
            if (this.drawback > 0) {
                ctx.strokeStyle = 'rgba(245, 245, 220, 0.8)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(6 + 3, -3);
                ctx.lineTo(6 - this.drawback * 3, 0);
                ctx.lineTo(6 + 3, 3);
                ctx.stroke();
                
                // Poison arrow
                ctx.strokeStyle = 'rgba(139, 69, 19, 0.8)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(6 - this.drawback * 3, 0);
                ctx.lineTo(6 - this.drawback * 3 - 8, 0);
                ctx.stroke();
                
                // Poison on arrow tip
                ctx.fillStyle = 'rgba(50, 205, 50, 0.8)';
                ctx.beginPath();
                ctx.arc(6 - this.drawback * 3 - 8, 0, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
        
        // Render flying poison arrows
        this.poisonArrows.forEach(arrow => {
            ctx.save();
            ctx.translate(arrow.x, arrow.y);
            ctx.rotate(arrow.rotation);
            
            // Arrow shaft
            ctx.strokeStyle = 'rgba(139, 69, 19, 0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-12, 0);
            ctx.lineTo(6, 0);
            ctx.stroke();
            
            // Poison-tipped arrow head
            ctx.fillStyle = 'rgba(50, 205, 50, 0.9)';
            ctx.beginPath();
            ctx.moveTo(6, 0);
            ctx.lineTo(2, -2);
            ctx.lineTo(2, 2);
            ctx.closePath();
            ctx.fill();
            
            // Poison drip trail
            for (let i = 0; i < 3; i++) {
                const trailX = -4 - i * 3;
                const trailY = Math.sin(arrow.life * 10 + i) * 2;
                ctx.fillStyle = `rgba(50, 205, 50, ${0.3 - i * 0.1})`;
                ctx.beginPath();
                ctx.arc(trailX, trailY, 1, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Arrow fletching
            ctx.strokeStyle = 'rgba(34, 139, 34, 0.9)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-12, -1);
            ctx.lineTo(-8, -3);
            ctx.moveTo(-12, 1);
            ctx.lineTo(-8, 3);
            ctx.stroke();
            
            ctx.restore();
        });
        
        // Render poison clouds
        this.poisonClouds.forEach(cloud => {
            const alpha = cloud.life / cloud.maxLife;
            
            // Main poison cloud
            const cloudGradient = ctx.createRadialGradient(
                cloud.x, cloud.y, 0,
                cloud.x, cloud.y, cloud.radius
            );
            cloudGradient.addColorStop(0, `rgba(50, 205, 50, ${alpha * 0.4})`);
            cloudGradient.addColorStop(0.5, `rgba(34, 139, 34, ${alpha * 0.3})`);
            cloudGradient.addColorStop(1, `rgba(0, 100, 0, 0)`);
            
            ctx.fillStyle = cloudGradient;
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Poison particles
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 + this.animationTime;
                const distance = Math.sin(this.animationTime * 2 + i) * cloud.radius * 0.5 + cloud.radius * 0.5;
                const particleX = cloud.x + Math.cos(angle) * distance;
                const particleY = cloud.y + Math.sin(angle) * distance;
                
                ctx.fillStyle = `rgba(50, 205, 50, ${alpha * 0.6})`;
                ctx.beginPath();
                ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // Range indicator
        if (this.target) {
            ctx.strokeStyle = 'rgba(34, 139, 34, 0.2)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Tower center marker (small, since it's mostly hidden)
        ctx.fillStyle = 'rgba(34, 139, 34, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
        ctx.fill();
    }
    
    static getInfo() {
        return {
            name: 'Poison Archer',
            description: 'Hidden archer shoots poison arrows that create toxic clouds.',
            damage: '12 + Poison DoT',
            range: '130',
            fireRate: '1.2/sec',
            cost: 120
        };
    }
}
