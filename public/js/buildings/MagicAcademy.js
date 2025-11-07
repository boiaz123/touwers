import { Building } from './Building.js';

export class MagicAcademy extends Building {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY, 4);
        this.manaRegenRate = 1;
        this.currentMana = 100;
        this.maxMana = 100;
        this.magicParticles = [];
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Generate magic particles and regenerate mana
        this.currentMana = Math.min(this.maxMana, this.currentMana + this.manaRegenRate * deltaTime);
        
        if (Math.random() < deltaTime * 2) {
            this.magicParticles.push({
                x: this.x + (Math.random() - 0.5) * 80,
                y: this.y + (Math.random() - 0.5) * 80,
                vx: (Math.random() - 0.5) * 30,
                vy: (Math.random() - 0.5) * 30,
                life: 2,
                maxLife: 2,
                color: `hsl(${Math.random() * 60 + 240}, 70%, 60%)`
            });
        }
        
        this.magicParticles = this.magicParticles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            return particle.life > 0;
        });
    }
    
    render(ctx, size) {
        // Academy tower
        const gradient = ctx.createLinearGradient(
            this.x - size/2, this.y - size/2,
            this.x + size/2, this.y + size/2
        );
        gradient.addColorStop(0, '#9370DB');
        gradient.addColorStop(0.5, '#6A5ACD');
        gradient.addColorStop(1, '#483D8B');
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = '#2E0A4F';
        ctx.lineWidth = 3;
        
        // Main tower
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = this.x + Math.cos(angle) * size/2;
            const y = this.y + Math.sin(angle) * size/2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Crystal on top
        const crystalPulse = Math.sin(this.animationTime * 4) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(138, 43, 226, ${crystalPulse})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y - size/3, size/8, 0, Math.PI * 2);
        ctx.fill();
        
        // Render magic particles
        this.magicParticles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            ctx.fillStyle = particle.color.replace(')', `, ${alpha})`).replace('hsl', 'hsla');
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Mana bar
        const barWidth = size * 0.8;
        const barHeight = 8;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.x - barWidth/2, this.y + size/2 + 10, barWidth, barHeight);
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(this.x - barWidth/2, this.y + size/2 + 10, 
                     barWidth * (this.currentMana / this.maxMana), barHeight);
        
        // Skills indicator
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎓⚡', this.x, this.y + size/2 + 35);
    }
    
    applyEffect(towerManager) {
        towerManager.availableSkills.push('fireball', 'freeze', 'lightning');
    }
    
    static getInfo() {
        return {
            name: 'Magic Academy',
            description: 'Unlocks spells: Fireball, Freeze, Lightning.',
            effect: 'Castable spells',
            size: '4x4',
            cost: 250
        };
    }
}
