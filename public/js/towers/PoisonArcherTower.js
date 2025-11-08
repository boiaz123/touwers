export class PoisonArcherTower {
    constructor(x, y, gridX, gridY) {
        this.x = x;
        this.y = y;
        this.gridX = gridX;
        this.gridY = gridY;
        this.range = 130;
        this.damage = 0; // No direct damage
        this.fireRate = 0.8;
        this.cooldown = 0;
        this.target = null;
        
        // Animation properties
        this.animationTime = 0;
        this.archerPosition = { x: 0, y: 0, hidden: true };
        this.drawback = 0;
        this.poisonArrows = [];
        this.poisonClouds = [];
        
        // Create compact cover elements within 2x2 grid (64x64 area)
        this.coverElements = [];
        
        // 4 strategic bushes in corners of the grid
        const positions = [
            { x: this.x - 25, y: this.y - 25 },
            { x: this.x + 25, y: this.y - 25 },
            { x: this.x - 25, y: this.y + 25 },
            { x: this.x + 25, y: this.y + 25 }
        ];
        
        positions.forEach((pos, i) => {
            this.coverElements.push({
                x: pos.x,
                y: pos.y,
                type: 'bush',
                size: 18 + Math.random() * 6,
                rustleOffset: i * 0.5,
                pattern: Math.floor(Math.random() * 3),
                branchPattern: Math.random()
            });
        });
        
        // Ranger position in center between bushes
        this.rangerSpot = {
            x: this.x + (Math.random() - 0.5) * 10,
            y: this.y + (Math.random() - 0.5) * 10
        };
    }
    
    update(deltaTime, enemies) {
        this.cooldown = Math.max(0, this.cooldown - deltaTime);
        this.animationTime += deltaTime;
        this.drawback = Math.max(0, this.drawback - deltaTime * 3);
        
        this.target = this.findTarget(enemies);
        
        // Update archer position
        if (this.target) {
            this.archerPosition.x = this.rangerSpot.x;
            this.archerPosition.y = this.rangerSpot.y;
            this.archerPosition.hidden = false;
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
            
            // Apply poison effect to enemies in cloud
            enemies.forEach(enemy => {
                const distance = Math.hypot(enemy.x - cloud.x, enemy.y - cloud.y);
                if (distance <= cloud.radius) {
                    if (!enemy.poisoned || enemy.poisonTimer <= 0) {
                        enemy.poisoned = true;
                        enemy.poisonTimer = 5.0; // Longer duration
                        enemy.poisonDamage = 4; // Balanced DoT damage
                        enemy.poisonTickTimer = 0;
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
                    enemy.takeDamage(enemy.poisonDamage || 4);
                    enemy.poisonTickTimer = 1.0; // Tick every second
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
            // No direct damage, just shoot poison arrow
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
            maxRadius: 30,
            life: 6.0, // Longer lasting clouds
            maxLife: 6.0
        });
    }
    
    render(ctx) {
        // Render cover elements (improved bushes)
        this.coverElements.forEach((element, index) => {
            ctx.save();
            ctx.translate(element.x, element.y);
            
            const rustleAmount = Math.sin(this.animationTime * 1.5 + element.rustleOffset) * 0.02;
            ctx.rotate(rustleAmount);
            
            // Bush shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.arc(2, 2, element.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Main bush structure with branches
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            
            // Central trunk/stem
            ctx.beginPath();
            ctx.moveTo(0, element.size * 0.7);
            ctx.lineTo(0, -element.size * 0.3);
            ctx.stroke();
            
            // Main branches
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2 + element.pattern;
                const branchLength = element.size * (0.4 + Math.random() * 0.3);
                const branchX = Math.cos(angle) * branchLength;
                const branchY = Math.sin(angle) * branchLength;
                
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(branchX, branchY);
                ctx.stroke();
                
                // Sub-branches
                ctx.lineWidth = 1;
                for (let j = 0; j < 3; j++) {
                    const subAngle = angle + (j - 1) * 0.3;
                    const subLength = branchLength * 0.5;
                    const subX = branchX + Math.cos(subAngle) * subLength;
                    const subY = branchY + Math.sin(subAngle) * subLength;
                    
                    ctx.beginPath();
                    ctx.moveTo(branchX, branchY);
                    ctx.lineTo(subX, subY);
                    ctx.stroke();
                }
                ctx.lineWidth = 2;
            }
            
            // Leafy clusters on branches
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2 + element.pattern;
                const distance = element.size * (0.5 + (i % 3) * 0.2);
                const leafX = Math.cos(angle) * distance;
                const leafY = Math.sin(angle) * distance;
                
                // Leaf cluster
                ctx.fillStyle = i % 3 === 0 ? '#228B22' : '#32CD32';
                ctx.beginPath();
                ctx.arc(leafX, leafY, element.size * 0.2, 0, Math.PI * 2);
                ctx.fill();
                
                // Individual leaves
                for (let k = 0; k < 5; k++) {
                    const leafAngle = (k / 5) * Math.PI * 2;
                    const leafDist = element.size * 0.15;
                    const lx = leafX + Math.cos(leafAngle) * leafDist;
                    const ly = leafY + Math.sin(leafAngle) * leafDist;
                    
                    ctx.fillStyle = '#2F5F2F';
                    ctx.beginPath();
                    ctx.ellipse(lx, ly, 3, 6, leafAngle, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
            // Dense foliage base
            ctx.fillStyle = '#1F4F1F';
            ctx.beginPath();
            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                const radius = element.size * (0.6 + Math.sin(angle * 4) * 0.2);
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        });
        
        // Render ranger between bushes
        if (!this.archerPosition.hidden && this.target) {
            ctx.save();
            ctx.translate(this.archerPosition.x, this.archerPosition.y);
            
            // Ranger shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(1, 3, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Crouched stance
            ctx.save();
            ctx.scale(1, 0.8); // Slightly crouched
            
            // Legs
            ctx.fillStyle = '#654321';
            ctx.fillRect(-3, 2, 2, 8);
            ctx.fillRect(1, 2, 2, 8);
            
            // Body (forest cloak)
            ctx.fillStyle = '#2F4F2F';
            ctx.fillRect(-4, -2, 8, 8);
            
            // Arms
            ctx.fillStyle = '#654321';
            ctx.fillRect(-6, -1, 2, 6);
            ctx.fillRect(4, -1, 2, 6);
            
            // Hood
            ctx.fillStyle = '#1F3F1F';
            ctx.beginPath();
            ctx.arc(0, -4, 5, 0, Math.PI);
            ctx.fill();
            
            // Face partially visible
            ctx.fillStyle = 'rgba(221, 190, 169, 0.7)';
            ctx.beginPath();
            ctx.arc(0, -3, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Glowing eyes
            ctx.fillStyle = '#87CEEB';
            ctx.fillRect(-1.5, -4, 1, 1);
            ctx.fillRect(0.5, -4, 1, 1);
            
            ctx.restore();
            
            // Bow and aiming
            const aimAngle = Math.atan2(this.target.y - this.archerPosition.y, this.target.x - this.archerPosition.x);
            ctx.rotate(aimAngle);
            
            // Longbow
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(10, 0, 8, -0.6, 0.6);
            ctx.stroke();
            
            // Bow string
            ctx.strokeStyle = '#F5F5DC';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(10 + 6, -5);
            if (this.drawback > 0) {
                ctx.lineTo(10 - this.drawback * 5, 0);
            } else {
                ctx.lineTo(10 + 6, 0);
            }
            ctx.lineTo(10 + 6, 5);
            ctx.stroke();
            
            // Arrow when drawing
            if (this.drawback > 0) {
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(10 - this.drawback * 5, 0);
                ctx.lineTo(10 - this.drawback * 5 - 12, 0);
                ctx.stroke();
                
                // Poison tip
                ctx.fillStyle = '#32CD32';
                ctx.beginPath();
                ctx.moveTo(10 - this.drawback * 5 - 12, 0);
                ctx.lineTo(10 - this.drawback * 5 - 15, -2);
                ctx.lineTo(10 - this.drawback * 5 - 15, 2);
                ctx.closePath();
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
        
        // Range indicator (subtle)
        if (this.target) {
            ctx.strokeStyle = 'rgba(34, 139, 34, 0.1)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Tower center marker
        ctx.fillStyle = 'rgba(101, 67, 33, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    static getInfo() {
        return {
            name: 'Poison Archer',
            description: 'Ranger shoots poison arrows that create toxic clouds, dealing damage over time.',
            damage: '0 direct + 4 DoT/sec',
            range: '130',
            fireRate: '0.8/sec',
            cost: 120
        };
    }
}
