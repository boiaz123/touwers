export class BasicTower {
    constructor(x, y, gridX, gridY) {
        this.x = x;
        this.y = y;
        this.gridX = gridX;
        this.gridY = gridY;
        this.range = 120;
        this.damage = 20;
        this.fireRate = 1;
        this.cooldown = 0;
        this.target = null;
        
        // Animation properties
        this.cannonAngle = 0;
        this.muzzleFlashTime = 0;
        this.lastShotTime = 0;
        this.projectiles = [];
    }
    
    update(deltaTime, enemies) {
        this.cooldown = Math.max(0, this.cooldown - deltaTime);
        this.muzzleFlashTime = Math.max(0, this.muzzleFlashTime - deltaTime);
        
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
        
        // Update projectiles
        this.projectiles = this.projectiles.filter(projectile => {
            projectile.x += projectile.vx * deltaTime;
            projectile.y += projectile.vy * deltaTime;
            projectile.life -= deltaTime;
            
            return projectile.life > 0;
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
            this.muzzleFlashTime = 0.1;
            this.lastShotTime = 0;
            
            // Create projectile effect
            const projectileSpeed = 500;
            const distance = Math.hypot(this.target.x - this.x, this.target.y - this.y);
            const lifetime = distance / projectileSpeed;
            
            this.projectiles.push({
                x: this.x + Math.cos(this.cannonAngle) * 20,
                y: this.y + Math.sin(this.cannonAngle) * 20,
                vx: Math.cos(this.cannonAngle) * projectileSpeed,
                vy: Math.sin(this.cannonAngle) * projectileSpeed,
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
        
        // Tower foundation (stone base)
        const foundationSize = towerSize * 0.9;
        ctx.fillStyle = '#696969';
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 2;
        ctx.fillRect(this.x - foundationSize/2, this.y - foundationSize/2, foundationSize, foundationSize);
        ctx.strokeRect(this.x - foundationSize/2, this.y - foundationSize/2, foundationSize, foundationSize);
        
        // Stone texture details
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const stoneX = this.x - foundationSize/2 + (i + 0.5) * foundationSize/3;
                const stoneY = this.y - foundationSize/2 + (j + 0.5) * foundationSize/3;
                ctx.strokeRect(stoneX - foundationSize/8, stoneY - foundationSize/8, foundationSize/4, foundationSize/4);
            }
        }
        
        // Main tower body (cylindrical)
        const radius = towerSize * 0.35;
        ctx.fillStyle = '#4CAF50';
        ctx.strokeStyle = '#2E7D32';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Tower battlements
        ctx.fillStyle = '#388E3C';
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const battX = this.x + Math.cos(angle) * radius * 0.85;
            const battY = this.y + Math.sin(angle) * radius * 0.85;
            ctx.fillRect(battX - 3, battY - 3, 6, 6);
        }
        
        // Rotating cannon
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.cannonAngle);
        
        // Cannon barrel
        ctx.fillStyle = '#2F2F2F';
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 2;
        const barrelLength = radius * 0.8;
        const barrelWidth = radius * 0.2;
        ctx.fillRect(0, -barrelWidth/2, barrelLength, barrelWidth);
        ctx.strokeRect(0, -barrelWidth/2, barrelLength, barrelWidth);
        
        // Cannon mount
        ctx.fillStyle = '#555555';
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Muzzle flash
        if (this.muzzleFlashTime > 0) {
            const flashIntensity = this.muzzleFlashTime / 0.1;
            ctx.fillStyle = `rgba(255, 165, 0, ${flashIntensity})`;
            ctx.beginPath();
            ctx.arc(barrelLength, 0, barrelWidth, 0, Math.PI * 2);
            ctx.fill();
            
            // Flash rays
            ctx.strokeStyle = `rgba(255, 255, 0, ${flashIntensity * 0.8})`;
            ctx.lineWidth = 3;
            for (let i = 0; i < 6; i++) {
                const rayAngle = (i / 6) * Math.PI * 2;
                const rayLength = barrelWidth * 2;
                ctx.beginPath();
                ctx.moveTo(barrelLength, 0);
                ctx.lineTo(barrelLength + Math.cos(rayAngle) * rayLength, Math.sin(rayAngle) * rayLength);
                ctx.stroke();
            }
        }
        
        ctx.restore();
        
        // Render projectiles
        this.projectiles.forEach(projectile => {
            const alpha = projectile.life / projectile.maxLife;
            ctx.fillStyle = `rgba(255, 165, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(projectile.x, projectile.y, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Projectile trail
            ctx.strokeStyle = `rgba(255, 255, 0, ${alpha * 0.5})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(projectile.x, projectile.y);
            ctx.lineTo(projectile.x - projectile.vx * 0.02, projectile.y - projectile.vy * 0.02);
            ctx.stroke();
        });
        
        // Range indicator when targeting
        if (this.target) {
            ctx.strokeStyle = 'rgba(76, 175, 80, 0.2)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    static getInfo() {
        return {
            name: 'Basic Tower',
            description: 'A reliable defensive structure with moderate damage and range.',
            damage: '20',
            range: '120',
            fireRate: '1.0/sec',
            cost: 50
        };
    }
}
