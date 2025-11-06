export class MagicTower {
    constructor(x, y, gridX, gridY) {
        this.x = x;
        this.y = y;
        this.gridX = gridX;
        this.gridY = gridY;
        this.range = 110;
        this.damage = 30;
        this.fireRate = 0.8;
        this.cooldown = 0;
        this.target = null;
        
        // Animation properties
        this.animationTime = 0;
        this.crystalPulse = 0;
        this.runeRotation = 0;
        this.lightningBolts = [];
        this.magicParticles = [];
        this.runePositions = [];
        
        // Initialize floating runes
        for (let i = 0; i < 6; i++) {
            this.runePositions.push({
                angle: (i / 6) * Math.PI * 2,
                radius: 40,
                floatOffset: Math.random() * Math.PI * 2,
                symbol: ['◊', '☆', '◇', '※', '❋', '⚡'][i]
            });
        }
    }
    
    update(deltaTime, enemies) {
        this.cooldown = Math.max(0, this.cooldown - deltaTime);
        this.animationTime += deltaTime;
        this.crystalPulse = 0.5 + 0.5 * Math.sin(this.animationTime * 3);
        this.runeRotation += deltaTime * 0.5;
        
        this.target = this.findTarget(enemies);
        
        if (this.target && this.cooldown === 0) {
            this.shoot();
            this.cooldown = 1 / this.fireRate;
        }
        
        // Update lightning bolts
        this.lightningBolts = this.lightningBolts.filter(bolt => {
            bolt.life -= deltaTime;
            return bolt.life > 0;
        });
        
        // Update magic particles
        this.magicParticles = this.magicParticles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            particle.size = particle.maxSize * (particle.life / particle.maxLife);
            return particle.life > 0;
        });
        
        // Generate ambient magic particles
        if (Math.random() < deltaTime * 3) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 50 + 20;
            this.magicParticles.push({
                x: this.x + Math.cos(angle) * radius,
                y: this.y + Math.sin(angle) * radius,
                vx: (Math.random() - 0.5) * 50,
                vy: (Math.random() - 0.5) * 50 - 30,
                life: 2,
                maxLife: 2,
                size: 0,
                maxSize: Math.random() * 4 + 2,
                color: Math.random() < 0.5 ? 'rgba(138, 43, 226, ' : 'rgba(75, 0, 130, '
            });
        }
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
            
            // Slow effect
            if (this.target.speed > 20) {
                this.target.speed *= 0.9;
            }
            
            // Create lightning bolt effect
            this.lightningBolts.push({
                startX: this.x,
                startY: this.y,
                endX: this.target.x,
                endY: this.target.y,
                life: 0.3,
                maxLife: 0.3,
                segments: this.generateLightningSegments(this.x, this.y, this.target.x, this.target.y)
            });
            
            // Create impact particles
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const speed = Math.random() * 100 + 50;
                this.magicParticles.push({
                    x: this.target.x,
                    y: this.target.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1,
                    maxLife: 1,
                    size: 0,
                    maxSize: 5,
                    color: 'rgba(255, 255, 255, '
                });
            }
        }
    }
    
    generateLightningSegments(startX, startY, endX, endY) {
        const segments = [];
        const segmentCount = 8;
        const variance = 20;
        
        let currentX = startX;
        let currentY = startY;
        
        for (let i = 1; i <= segmentCount; i++) {
            const t = i / segmentCount;
            let targetX = startX + (endX - startX) * t;
            let targetY = startY + (endY - startY) * t;
            
            // Add random variance except for the last segment
            if (i < segmentCount) {
                targetX += (Math.random() - 0.5) * variance;
                targetY += (Math.random() - 0.5) * variance;
            }
            
            segments.push({
                fromX: currentX,
                fromY: currentY,
                toX: targetX,
                toY: targetY
            });
            
            currentX = targetX;
            currentY = targetY;
        }
        
        return segments;
    }
    
    render(ctx) {
        // Calculate tower size based on grid cell size (2x2 cells)
        const baseResolution = 1920;
        const scaleFactor = Math.max(0.5, Math.min(2.5, ctx.canvas.width / baseResolution));
        const cellSize = Math.floor(32 * scaleFactor);
        const towerSize = cellSize * 2;
        
        // Mystical base platform
        const baseSize = towerSize * 0.85;
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, baseSize/2);
        gradient.addColorStop(0, '#4B0082');
        gradient.addColorStop(0.7, '#2E0A4F');
        gradient.addColorStop(1, '#1A0A2E');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, baseSize/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Mystical circle border
        ctx.strokeStyle = '#8A2BE2';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Inner magic circle
        ctx.strokeStyle = `rgba(138, 43, 226, ${this.crystalPulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, baseSize * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        
        // Render floating runes
        this.runePositions.forEach((rune, index) => {
            const floatY = Math.sin(this.animationTime * 2 + rune.floatOffset) * 8;
            const runeAngle = this.runeRotation + rune.angle;
            const runeX = this.x + Math.cos(runeAngle) * rune.radius;
            const runeY = this.y + Math.sin(runeAngle) * rune.radius + floatY;
            
            // Rune glow
            const runeGlow = ctx.createRadialGradient(runeX, runeY, 0, runeX, runeY, 15);
            runeGlow.addColorStop(0, `rgba(138, 43, 226, ${this.crystalPulse * 0.8})`);
            runeGlow.addColorStop(1, 'rgba(138, 43, 226, 0)');
            ctx.fillStyle = runeGlow;
            ctx.beginPath();
            ctx.arc(runeX, runeY, 15, 0, Math.PI * 2);
            ctx.fill();
            
            // Rune symbol
            ctx.fillStyle = `rgba(255, 255, 255, ${this.crystalPulse})`;
            ctx.font = '16px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(rune.symbol, runeX, runeY);
        });
        
        // Central crystal tower
        const crystalHeight = towerSize * 0.6;
        const crystalWidth = towerSize * 0.2;
        
        // Crystal base
        ctx.fillStyle = '#483D8B';
        ctx.strokeStyle = '#6A5ACD';
        ctx.lineWidth = 2;
        ctx.fillRect(this.x - crystalWidth/2, this.y - crystalHeight/2, crystalWidth, crystalHeight);
        ctx.strokeRect(this.x - crystalWidth/2, this.y - crystalHeight/2, crystalWidth, crystalHeight);
        
        // Crystal facets
        ctx.strokeStyle = '#9370DB';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const facetY = this.y - crystalHeight/2 + (crystalHeight * i / 4);
            ctx.beginPath();
            ctx.moveTo(this.x - crystalWidth/2, facetY);
            ctx.lineTo(this.x + crystalWidth/2, facetY);
            ctx.stroke();
        }
        
        // Crystal top (gem)
        const gemSize = crystalWidth * 0.8;
        const gemGradient = ctx.createRadialGradient(this.x, this.y - crystalHeight/2, 0, this.x, this.y - crystalHeight/2, gemSize);
        gemGradient.addColorStop(0, `rgba(255, 255, 255, ${this.crystalPulse})`);
        gemGradient.addColorStop(0.3, `rgba(138, 43, 226, ${this.crystalPulse})`);
        gemGradient.addColorStop(1, `rgba(75, 0, 130, ${this.crystalPulse * 0.8})`);
        
        ctx.fillStyle = gemGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y - crystalHeight/2, gemSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Gem highlight
        ctx.fillStyle = `rgba(255, 255, 255, ${this.crystalPulse * 0.6})`;
        ctx.beginPath();
        ctx.arc(this.x - gemSize * 0.3, this.y - crystalHeight/2 - gemSize * 0.3, gemSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Render magic particles
        this.magicParticles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            ctx.fillStyle = particle.color + alpha + ')';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Particle glow
            const particleGlow = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size * 2);
            particleGlow.addColorStop(0, particle.color + (alpha * 0.3) + ')');
            particleGlow.addColorStop(1, particle.color + '0)');
            ctx.fillStyle = particleGlow;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Render lightning bolts
        this.lightningBolts.forEach(bolt => {
            const alpha = bolt.life / bolt.maxLife;
            
            // Main lightning
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 3;
            bolt.segments.forEach(segment => {
                ctx.beginPath();
                ctx.moveTo(segment.fromX, segment.fromY);
                ctx.lineTo(segment.toX, segment.toY);
                ctx.stroke();
            });
            
            // Lightning glow
            ctx.strokeStyle = `rgba(138, 43, 226, ${alpha * 0.6})`;
            ctx.lineWidth = 6;
            bolt.segments.forEach(segment => {
                ctx.beginPath();
                ctx.moveTo(segment.fromX, segment.fromY);
                ctx.lineTo(segment.toX, segment.toY);
                ctx.stroke();
            });
        });
        
        // Range indicator
        if (this.target) {
            ctx.strokeStyle = 'rgba(138, 43, 226, 0.2)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    static getInfo() {
        return {
            name: 'Magic Tower',
            description: 'Mystical tower that pierces armor and slows enemies.',
            damage: '30',
            range: '110',
            fireRate: '0.8/sec',
            cost: 150
        };
    }
}
