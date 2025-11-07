export class GoldMine {
    constructor(x, y, gridX, gridY, gameState) {
        this.x = x;
        this.y = y;
        this.gridX = gridX;
        this.gridY = gridY;
        this.gameState = gameState;
        this.type = 'goldmine';
        this.level = 1;
        this.maxLevel = 5;
        this.upgradeCost = 150;
        this.goldPerSecond = 2; // Base income
        this.goldAccumulated = 0;
        this.lastCollection = 0;
        
        // Animation properties
        this.animationTime = 0;
        this.minecartPosition = 0;
        this.goldParticles = [];
        this.torchFlames = [];
        
        // Initialize torch flames
        for (let i = 0; i < 4; i++) {
            this.torchFlames.push({
                x: Math.cos(i * Math.PI / 2) * 40,
                y: Math.sin(i * Math.PI / 2) * 40,
                intensity: Math.random(),
                flickerOffset: Math.random() * Math.PI * 2
            });
        }
    }
    
    update(deltaTime, towers, enemies) {
        this.animationTime += deltaTime;
        this.lastCollection += deltaTime;
        
        // Generate gold over time
        const income = this.goldPerSecond * this.level;
        this.goldAccumulated += income * deltaTime;
        
        // Auto-collect gold every 2 seconds and create visual effect
        if (this.lastCollection >= 2) {
            const goldToAdd = Math.floor(this.goldAccumulated);
            if (goldToAdd > 0) {
                this.gameState.gold += goldToAdd;
                this.goldAccumulated -= goldToAdd;
                this.createGoldParticles(goldToAdd);
            }
            this.lastCollection = 0;
        }
        
        // Update minecart animation
        this.minecartPosition = (this.minecartPosition + deltaTime * 0.3) % 1;
        
        // Update torch flames
        this.torchFlames.forEach(flame => {
            flame.intensity = 0.5 + 0.5 * Math.sin(this.animationTime * 4 + flame.flickerOffset);
        });
        
        // Update gold particles
        this.goldParticles = this.goldParticles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += 100 * deltaTime; // Gravity
            particle.life -= deltaTime;
            particle.size = particle.maxSize * (particle.life / particle.maxLife);
            return particle.life > 0;
        });
    }
    
    createGoldParticles(amount) {
        for (let i = 0; i < Math.min(amount, 8); i++) {
            this.goldParticles.push({
                x: (Math.random() - 0.5) * 40,
                y: -Math.random() * 20 - 10,
                vx: (Math.random() - 0.5) * 60,
                vy: -Math.random() * 100 - 50,
                life: 2,
                maxLife: 2,
                size: 0,
                maxSize: Math.random() * 4 + 3
            });
        }
    }
    
    upgrade() {
        if (this.level < this.maxLevel && this.gameState.spend(this.upgradeCost)) {
            this.level++;
            this.upgradeCost = Math.floor(this.upgradeCost * 1.3);
            return true;
        }
        return false;
    }
    
    render(ctx) {
        // Calculate building size based on grid cell size (4x4 cells)
        const baseResolution = 1920;
        const scaleFactor = Math.max(0.5, Math.min(2.5, ctx.canvas.width / baseResolution));
        const cellSize = Math.floor(32 * scaleFactor);
        const buildingSize = cellSize * 4;
        
        // 3D shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(this.x - buildingSize * 0.4 + 6, this.y - buildingSize * 0.3 + 6, buildingSize * 0.8, buildingSize * 0.6);
        
        const buildingWidth = buildingSize * 0.8;
        const buildingHeight = buildingSize * 0.6;
        
        // Mine entrance (cave opening)
        const caveWidth = buildingWidth * 0.5;
        const caveHeight = buildingHeight * 0.4;
        
        // Cave entrance background
        ctx.fillStyle = '#1A1A1A';
        ctx.beginPath();
        ctx.arc(this.x, this.y - caveHeight/2, caveWidth/2, 0, Math.PI, true);
        ctx.fillRect(this.x - caveWidth/2, this.y - caveHeight/2, caveWidth, caveHeight/2);
        ctx.fill();
        
        // Rock formation around entrance
        const rockGradient = ctx.createLinearGradient(
            this.x - buildingWidth/2, this.y - buildingHeight,
            this.x + buildingWidth/3, this.y
        );
        rockGradient.addColorStop(0, '#8B7D6B');
        rockGradient.addColorStop(0.3, '#696969');
        rockGradient.addColorStop(0.7, '#556B2F');
        rockGradient.addColorStop(1, '#2F4F2F');
        
        // Irregular rock formation
        ctx.fillStyle = rockGradient;
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        const points = [
            { x: this.x - buildingWidth/2, y: this.y },
            { x: this.x - buildingWidth/3, y: this.y - buildingHeight * 0.8 },
            { x: this.x - caveWidth/2, y: this.y - caveHeight/2 },
            { x: this.x + caveWidth/2, y: this.y - caveHeight/2 },
            { x: this.x + buildingWidth/3, y: this.y - buildingHeight * 0.7 },
            { x: this.x + buildingWidth/2, y: this.y - buildingHeight * 0.3 },
            { x: this.x + buildingWidth/2, y: this.y },
        ];
        
        points.forEach((point, index) => {
            if (index === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Mine cart tracks
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        const trackY = this.y - 10;
        
        // Rails
        ctx.beginPath();
        ctx.moveTo(this.x - buildingWidth/2, trackY);
        ctx.lineTo(this.x + buildingWidth/2, trackY);
        ctx.moveTo(this.x - buildingWidth/2, trackY + 8);
        ctx.lineTo(this.x + buildingWidth/2, trackY + 8);
        ctx.stroke();
        
        // Rail ties
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const tieX = this.x - buildingWidth/2 + (i * buildingWidth / 7);
            ctx.beginPath();
            ctx.moveTo(tieX, trackY - 5);
            ctx.lineTo(tieX, trackY + 13);
            ctx.stroke();
        }
        
        // Animated minecart
        const cartX = this.x - buildingWidth/3 + (this.minecartPosition * buildingWidth/1.5);
        const cartY = trackY;
        
        // Cart body
        ctx.fillStyle = '#654321';
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 2;
        ctx.fillRect(cartX - 15, cartY - 8, 30, 12);
        ctx.strokeRect(cartX - 15, cartY - 8, 30, 12);
        
        // Cart wheels
        ctx.fillStyle = '#2F2F2F';
        ctx.beginPath();
        ctx.arc(cartX - 10, cartY + 6, 4, 0, Math.PI * 2);
        ctx.arc(cartX + 10, cartY + 6, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Gold in cart
        for (let i = 0; i < 5; i++) {
            const goldX = cartX - 12 + (i * 6);
            const goldY = cartY - 6 + Math.sin(this.animationTime * 2 + i) * 2;
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(goldX, goldY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Render torches around the mine
        this.torchFlames.forEach(torch => {
            const torchX = this.x + torch.x;
            const torchY = this.y + torch.y - buildingHeight * 0.3;
            
            // Torch pole
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(torchX - 2, torchY, 4, 20);
            
            // Flame
            const flameIntensity = torch.intensity;
            const flameGradient = ctx.createRadialGradient(
                torchX, torchY, 0,
                torchX, torchY, 8 * flameIntensity
            );
            flameGradient.addColorStop(0, `rgba(255, 255, 100, ${flameIntensity})`);
            flameGradient.addColorStop(0.6, `rgba(255, 150, 0, ${flameIntensity * 0.8})`);
            flameGradient.addColorStop(1, `rgba(255, 50, 0, 0)`);
            
            ctx.fillStyle = flameGradient;
            ctx.beginPath();
            ctx.arc(torchX, torchY, 6 * flameIntensity, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Render gold particles
        this.goldParticles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(this.x + particle.x, this.y + particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Gold glow
            const particleGlow = ctx.createRadialGradient(
                this.x + particle.x, this.y + particle.y, 0,
                this.x + particle.x, this.y + particle.y, particle.size * 3
            );
            particleGlow.addColorStop(0, `rgba(255, 215, 0, ${alpha * 0.3})`);
            particleGlow.addColorStop(1, `rgba(255, 215, 0, 0)`);
            ctx.fillStyle = particleGlow;
            ctx.beginPath();
            ctx.arc(this.x + particle.x, this.y + particle.y, particle.size * 3, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Mine level indicator and income display
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`MINE LV${this.level}`, this.x, this.y - buildingHeight - 30);
        
        ctx.font = '12px serif';
        ctx.fillText(`+${(this.goldPerSecond * this.level).toFixed(1)}/sec`, this.x, this.y - buildingHeight - 15);
        
        // Show accumulated gold
        if (this.goldAccumulated >= 1) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
            ctx.font = 'bold 16px serif';
            ctx.fillText(`+${Math.floor(this.goldAccumulated)}`, this.x, this.y - buildingHeight + 5);
        }
    }
    
    static getInfo() {
        return {
            name: 'Gold Mine',
            description: 'Generates passive gold income over time. Higher levels increase production.',
            effect: `+${2}/sec gold per level`,
            maxLevel: '5',
            upgradeInfo: 'Each level increases gold generation',
            cost: 250
        };
    }
}
