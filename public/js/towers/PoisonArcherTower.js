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
        
        // Create diverse cover elements around the tower
        this.coverElements = [];
        this.hidingSpots = [];
        
        // Generate bushes, trees, and rocks
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.3;
            const distance = 35 + Math.random() * 25;
            const type = Math.random() < 0.5 ? 'bush' : (Math.random() < 0.7 ? 'tree' : 'rock');
            
            this.coverElements.push({
                x: this.x + Math.cos(angle) * distance,
                y: this.y + Math.sin(angle) * distance,
                type: type,
                size: type === 'tree' ? 15 + Math.random() * 10 : 12 + Math.random() * 8,
                rustleOffset: i * 0.5,
                pattern: Math.floor(Math.random() * 3),
                height: type === 'tree' ? 40 + Math.random() * 20 : 0
            });
        }
        
        // Generate hiding spots between cover elements
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + Math.random() * 0.4;
            const distance = 25 + Math.random() * 20;
            
            this.hidingSpots.push({
                x: this.x + Math.cos(angle) * distance,
                y: this.y + Math.sin(angle) * distance,
                coverAngle: angle + Math.PI + Math.random() * 0.5 - 0.25 // Face towards center with variation
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
            // Find best hiding spot to shoot from
            let bestSpot = null;
            let bestScore = -1;
            
            this.hidingSpots.forEach(spot => {
                const distToTarget = Math.hypot(this.target.x - spot.x, this.target.y - spot.y);
                
                if (distToTarget <= this.range) {
                    const score = this.range - distToTarget;
                    if (score > bestScore) {
                        bestScore = score;
                        bestSpot = spot;
                    }
                }
            });
            
            if (bestSpot) {
                this.archerPosition.x = bestSpot.x;
                this.archerPosition.y = bestSpot.y;
                this.archerPosition.coverAngle = bestSpot.coverAngle;
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
        
        // Render cover elements
        this.coverElements.forEach((element, index) => {
            ctx.save();
            ctx.translate(element.x, element.y);
            
            if (element.type === 'bush') {
                // Render irregular bush shape
                const rustleAmount = Math.sin(this.animationTime * 1.5 + element.rustleOffset) * 0.01;
                ctx.rotate(rustleAmount);
                
                // Bush shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.beginPath();
                ctx.arc(2, 2, element.size * 0.9, 0, Math.PI * 2);
                ctx.fill();
                
                // Main bush - irregular shape
                ctx.fillStyle = '#2F5F2F';
                ctx.beginPath();
                for (let i = 0; i < 12; i++) {
                    const angle = (i / 12) * Math.PI * 2;
                    const radius = element.size * (0.7 + Math.sin(angle * 3 + element.pattern) * 0.3);
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                
                // Leaf clusters
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2 + element.pattern;
                    const distance = element.size * (0.6 + (i % 3) * 0.2);
                    const leafX = Math.cos(angle) * distance;
                    const leafY = Math.sin(angle) * distance;
                    
                    ctx.fillStyle = i % 2 === 0 ? '#228B22' : '#32CD32';
                    ctx.beginPath();
                    ctx.arc(leafX, leafY, element.size * 0.15, 0, Math.PI * 2);
                    ctx.fill();
                }
                
            } else if (element.type === 'tree') {
                // Tree trunk
                ctx.fillStyle = '#654321';
                ctx.fillRect(-3, 0, 6, element.height);
                
                // Tree canopy - irregular
                ctx.fillStyle = '#228B22';
                ctx.beginPath();
                for (let i = 0; i < 10; i++) {
                    const angle = (i / 10) * Math.PI * 2;
                    const radius = element.size * (0.8 + Math.sin(angle * 2 + element.pattern) * 0.2);
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius - element.height;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                
                // Tree highlights
                ctx.fillStyle = '#32CD32';
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 5) * Math.PI * 2 + element.pattern;
                    const x = Math.cos(angle) * element.size * 0.5;
                    const y = Math.sin(angle) * element.size * 0.5 - element.height;
                    ctx.beginPath();
                    ctx.arc(x, y, element.size * 0.2, 0, Math.PI * 2);
                    ctx.fill();
                }
                
            } else if (element.type === 'rock') {
                // Rock shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(2, 2, element.size * 0.8, 0, Math.PI * 2);
                ctx.fill();
                
                // Rock - irregular shape
                ctx.fillStyle = '#696969';
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const radius = element.size * (0.6 + Math.sin(angle * 4 + element.pattern) * 0.4);
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                
                // Rock highlights
                ctx.fillStyle = '#A9A9A9';
                ctx.beginPath();
                ctx.arc(-element.size * 0.2, -element.size * 0.3, element.size * 0.2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        });
        
        // Render ranger if visible
        if (!this.archerPosition.hidden && this.target) {
            ctx.save();
            ctx.translate(this.archerPosition.x, this.archerPosition.y);
            
            // Ranger shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(2, 6, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Stealthy crouched pose
            ctx.save();
            ctx.scale(0.8, 0.9); // Slightly compressed for crouching
            
            // Ranger body (forest green cloak)
            ctx.fillStyle = '#2F4F2F';
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Hood
            ctx.fillStyle = '#1F3F1F';
            ctx.beginPath();
            ctx.arc(0, -3, 6, 0, Math.PI);
            ctx.fill();
            
            // Face in shadow
            ctx.fillStyle = 'rgba(221, 190, 169, 0.6)';
            ctx.beginPath();
            ctx.arc(0, -2, 2.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Eyes gleaming in shadow
            ctx.fillStyle = '#87CEEB';
            ctx.fillRect(-1, -3, 0.5, 0.5);
            ctx.fillRect(0.5, -3, 0.5, 0.5);
            
            ctx.restore();
            
            // Bow and aiming
            const aimAngle = Math.atan2(this.target.y - this.archerPosition.y, this.target.x - this.archerPosition.x);
            ctx.rotate(aimAngle);
            
            // Extended bow for ranger
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(8, 0, 6, -0.7, 0.7);
            ctx.stroke();
            
            // Bow string
            ctx.strokeStyle = '#F5F5DC';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(8 + 5, -4);
            if (this.drawback > 0) {
                ctx.lineTo(8 - this.drawback * 4, 0);
            } else {
                ctx.lineTo(8 + 5, 0);
            }
            ctx.lineTo(8 + 5, 4);
            ctx.stroke();
            
            // Arrow when drawing
            if (this.drawback > 0) {
                // Arrow shaft
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(8 - this.drawback * 4, 0);
                ctx.lineTo(8 - this.drawback * 4 - 10, 0);
                ctx.stroke();
                
                // Poison arrow tip
                ctx.fillStyle = '#32CD32';
                ctx.beginPath();
                ctx.moveTo(8 - this.drawback * 4 - 10, 0);
                ctx.lineTo(8 - this.drawback * 4 - 12, -2);
                ctx.lineTo(8 - this.drawback * 4 - 12, 2);
                ctx.closePath();
                ctx.fill();
                
                // Fletching
                ctx.strokeStyle = '#228B22';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(8 - this.drawback * 4, -1);
                ctx.lineTo(8 - this.drawback * 4 + 3, -3);
                ctx.moveTo(8 - this.drawback * 4, 1);
                ctx.lineTo(8 - this.drawback * 4 + 3, 3);
                ctx.stroke();
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
            ctx.strokeStyle = 'rgba(34, 139, 34, 0.15)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Tower center (hidden camp)
        ctx.fillStyle = 'rgba(34, 139, 34, 0.2)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
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
