import { Building } from './Building.js';

export class TowerForge extends Building {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY, 4);
        this.upgradeRadius = 200;
        this.sparks = [];
        this.nextSparkTime = 0;
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Generate sparks
        this.nextSparkTime -= deltaTime;
        if (this.nextSparkTime <= 0) {
            for (let i = 0; i < 3; i++) {
                this.sparks.push({
                    x: this.x + (Math.random() - 0.5) * 40,
                    y: this.y + (Math.random() - 0.5) * 40,
                    vx: (Math.random() - 0.5) * 100,
                    vy: (Math.random() - 0.5) * 100,
                    life: 0.5,
                    maxLife: 0.5
                });
            }
            this.nextSparkTime = 0.2 + Math.random() * 0.3;
        }
        
        this.sparks = this.sparks.filter(spark => {
            spark.x += spark.vx * deltaTime;
            spark.y += spark.vy * deltaTime;
            spark.life -= deltaTime;
            return spark.life > 0;
        });
    }
    
    render(ctx, size) {
        // Forge structure
        const gradient = ctx.createLinearGradient(
            this.x - size/2, this.y - size/2,
            this.x + size/2, this.y + size/2
        );
        gradient.addColorStop(0, '#CD853F');
        gradient.addColorStop(0.5, '#8B4513');
        gradient.addColorStop(1, '#654321');
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 3;
        ctx.fillRect(this.x - size/2, this.y - size/2, size, size);
        ctx.strokeRect(this.x - size/2, this.y - size/2, size, size);
        
        // Forge fire
        const fireGlow = Math.sin(this.animationTime * 6) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 100, 0, ${fireGlow})`;
        ctx.fillRect(this.x - size/3, this.y - size/6, size/1.5, size/3);
        
        // Anvil
        ctx.fillStyle = '#2F2F2F';
        ctx.fillRect(this.x - size/6, this.y + size/6, size/3, size/12);
        
        // Render sparks
        this.sparks.forEach(spark => {
            const alpha = spark.life / spark.maxLife;
            ctx.fillStyle = `rgba(255, 200, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(spark.x, spark.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Upgrade indicator
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔨⬆️', this.x, this.y + size/2 + 20);
    }
    
    applyEffect(towerManager) {
        towerManager.towerUpgrades.damage *= 1.25;
        towerManager.towerUpgrades.range *= 1.15;
    }
    
    static getInfo() {
        return {
            name: 'Tower Forge',
            description: 'Upgrades all towers: +25% damage, +15% range.',
            effect: 'Global tower boost',
            size: '4x4',
            cost: 300
        };
    }
}
