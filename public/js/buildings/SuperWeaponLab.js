import { Building } from './Building.js';

export class SuperWeaponLab extends Building {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY, 4);
        this.chargeLevel = 0;
        this.maxCharge = 100;
        this.isCharging = true;
        this.energyBeams = [];
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Charge the super weapon
        if (this.isCharging && this.chargeLevel < this.maxCharge) {
            this.chargeLevel += deltaTime * 2; // 50 seconds to full charge
        }
        
        // Generate energy beams
        if (Math.random() < deltaTime * 5) {
            this.energyBeams.push({
                startAngle: Math.random() * Math.PI * 2,
                endAngle: Math.random() * Math.PI * 2,
                life: 0.3,
                maxLife: 0.3,
                intensity: Math.random()
            });
        }
        
        this.energyBeams = this.energyBeams.filter(beam => {
            beam.life -= deltaTime;
            return beam.life > 0;
        });
    }
    
    render(ctx, size) {
        // Super weapon facility
        const gradient = ctx.createLinearGradient(
            this.x - size/2, this.y - size/2,
            this.x + size/2, this.y + size/2
        );
        gradient.addColorStop(0, '#B0C4DE');
        gradient.addColorStop(0.5, '#708090');
        gradient.addColorStop(1, '#2F4F4F');
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = '#1C1C1C';
        ctx.lineWidth = 4;
        ctx.fillRect(this.x - size/2, this.y - size/2, size, size);
        ctx.strokeRect(this.x - size/2, this.y - size/2, size, size);
        
        // Energy core
        const energyPulse = Math.sin(this.animationTime * 8) * 0.4 + 0.6;
        const coreGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, size/4
        );
        coreGradient.addColorStop(0, `rgba(0, 255, 255, ${energyPulse})`);
        coreGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size/4, 0, Math.PI * 2);
        ctx.fill();
        
        // Render energy beams
        this.energyBeams.forEach(beam => {
            const alpha = beam.life / beam.maxLife;
            ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * beam.intensity})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(
                this.x + Math.cos(beam.startAngle) * size/2,
                this.y + Math.sin(beam.startAngle) * size/2
            );
            ctx.stroke();
        });
        
        // Charge bar
        const barWidth = size * 0.9;
        const barHeight = 12;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(this.x - barWidth/2, this.y + size/2 + 10, barWidth, barHeight);
        ctx.fillStyle = '#00FFFF';
        ctx.fillRect(this.x - barWidth/2, this.y + size/2 + 10, 
                     barWidth * (this.chargeLevel / this.maxCharge), barHeight);
        
        // Super weapon indicator
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚡🚀', this.x, this.y + size/2 + 35);
    }
    
    applyEffect(buildingManager) {
        buildingManager.superWeaponUnlocked = true;
        // Don't try to modify buildingTypes here as it may cause issues
    }
    
    static getInfo() {
        return {
            name: 'Super Weapon Lab',
            description: 'Unlocks combo towers and ultimate abilities.',
            effect: 'Advanced tech',
            size: '4x4',
            cost: 500
        };
    }
}
