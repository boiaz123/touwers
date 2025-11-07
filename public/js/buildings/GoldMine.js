import { Building } from './Building.js';

export class GoldMine extends Building {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY, 4);
        this.goldPerSecond = 2;
        this.smokePuffs = [];
        this.nextSmokeTime = 0;
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Generate smoke puffs
        this.nextSmokeTime -= deltaTime;
        if (this.nextSmokeTime <= 0) {
            this.smokePuffs.push({
                x: this.x + (Math.random() - 0.5) * 60,
                y: this.y - 40,
                vx: (Math.random() - 0.5) * 20,
                vy: -30 - Math.random() * 20,
                life: 3,
                maxLife: 3,
                size: Math.random() * 8 + 4
            });
            this.nextSmokeTime = 0.5 + Math.random() * 1.0;
        }
        
        // Update smoke
        this.smokePuffs = this.smokePuffs.filter(smoke => {
            smoke.x += smoke.vx * deltaTime;
            smoke.y += smoke.vy * deltaTime;
            smoke.life -= deltaTime;
            smoke.size += deltaTime * 2;
            return smoke.life > 0;
        });
    }
    
    render(ctx, size) {
        // Mine structure with stone base
        const gradient = ctx.createLinearGradient(
            this.x - size/2, this.y - size/2,
            this.x + size/2, this.y + size/2
        );
        gradient.addColorStop(0, '#8B7355');
        gradient.addColorStop(0.5, '#696969');
        gradient.addColorStop(1, '#2F2F2F');
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 3;
        ctx.fillRect(this.x - size/2, this.y - size/2, size, size);
        ctx.strokeRect(this.x - size/2, this.y - size/2, size, size);
        
        // Mine entrance
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x - size/4, this.y - size/6, size/2, size/3);
        
        // Support beams
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.x - size/4, this.y - size/6);
        ctx.lineTo(this.x - size/4, this.y + size/6);
        ctx.moveTo(this.x + size/4, this.y - size/6);
        ctx.lineTo(this.x + size/4, this.y + size/6);
        ctx.moveTo(this.x - size/4, this.y - size/6);
        ctx.lineTo(this.x + size/4, this.y - size/6);
        ctx.stroke();
        
        // Render smoke
        this.smokePuffs.forEach(smoke => {
            const alpha = smoke.life / smoke.maxLife;
            ctx.fillStyle = `rgba(100, 100, 100, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(smoke.x, smoke.y, smoke.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Gold indicator
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⛏️💰', this.x, this.y + size/2 + 20);
    }
    
    applyEffect(towerManager) {
        towerManager.goldPerSecond += this.goldPerSecond;
    }
    
    static getInfo() {
        return {
            name: 'Gold Mine',
            description: 'Generates 2 gold per second passively.',
            effect: '+2 gold/sec',
            size: '4x4',
            cost: 200
        };
    }
}
