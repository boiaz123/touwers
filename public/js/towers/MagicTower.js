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
        
        // 3D shadow
        ctx.fillStyle = 'rgba(75, 0, 130, 0.4)';
        ctx.beginPath();
        ctx.arc(this.x + 3, this.y + 3, towerSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Mystical stone base (circular with crystalline edges)
        const baseRadius = towerSize * 0.4;
        
        // Create mystical base with multiple layers for 3D effect
        for (let layer = 3; layer >= 0; layer--) {
            const layerRadius = baseRadius - layer * 3;
            const layerHeight = layer * 2;
            
            const baseGradient = ctx.createRadialGradient(
                this.x - layerRadius * 0.3, this.y - layerHeight - layerRadius * 0.3, 0,
                this.x, this.y - layerHeight, layerRadius
            );
            baseGradient.addColorStop(0, layer === 0 ? `rgba(138, 43, 226, ${this.crystalPulse})` : '#6A5ACD');
            baseGradient.addColorStop(0.7, layer === 0 ? '#8A2BE2' : '#483D8B');
            baseGradient.addColorStop(1, '#2E0A4F');
            
            ctx.fillStyle = baseGradient;
            ctx.strokeStyle = layer === 0 ? `rgba(138, 43, 226, ${this.crystalPulse})` : '#4B0082';
            ctx.lineWidth = layer === 0 ? 3 : 1;
            
            // Draw crystalline base (hexagonal for magic feel)
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const x = this.x + Math.cos(angle) * layerRadius;
                const y = this.y - layerHeight + Math.sin(angle) * layerRadius * 0.8;
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        
        // Mystical rune circles on base
        ctx.strokeStyle = `rgba(138, 43, 226, ${this.crystalPulse * 0.8})`;
        ctx.lineWidth = 2;
        for (let i = 1; i <= 2; i++) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, baseRadius * (0.3 + i * 0.25), 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Render floating runes with 3D effect
        this.runePositions.forEach((rune, index) => {
            const floatY = Math.sin(this.animationTime * 2 + rune.floatOffset) * 8;
            const runeAngle = this.runeRotation + rune.angle;
            const runeX = this.x + Math.cos(runeAngle) * rune.radius;
            const runeY = this.y + Math.sin(runeAngle) * rune.radius + floatY;
            
            // Rune shadow
            ctx.fillStyle = 'rgba(75, 0, 130, 0.3)';
            ctx.beginPath();
            ctx.arc(runeX + 2, runeY + 2, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Rune glow with layers
            for (let layer = 2; layer >= 0; layer--) {
                const layerRadius = 15 - layer * 3;
                const runeGlow = ctx.createRadialGradient(runeX, runeY, 0, runeX, runeY, layerRadius);
                runeGlow.addColorStop(0, `rgba(138, 43, 226, ${this.crystalPulse * 0.8 / (layer + 1)})`);
                runeGlow.addColorStop(1, 'rgba(138, 43, 226, 0)');
                ctx.fillStyle = runeGlow;
                ctx.beginPath();
                ctx.arc(runeX, runeY, layerRadius, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Rune symbol with glow
            ctx.fillStyle = `rgba(255, 255, 255, ${this.crystalPulse})`;
            ctx.strokeStyle = `rgba(138, 43, 226, ${this.crystalPulse})`;
            ctx.lineWidth = 1;
            ctx.font = 'bold 16px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeText(rune.symbol, runeX, runeY);
            ctx.fillText(rune.symbol, runeX, runeY);
        });
        
        // Central crystal spire with multiple crystalline faces
        const crystalHeight = towerSize * 0.8;
        const crystalWidth = towerSize * 0.15;
        
        // Crystal spire segments (tapering upward)
        for (let segment = 0; segment < 4; segment++) {
            const segmentHeight = crystalHeight / 4;
            const segmentY = this.y - segmentHeight * (segment + 0.5);
            const segmentWidth = crystalWidth * (1 - segment * 0.15);
            
            // Crystal segment gradient
            const segmentGradient = ctx.createLinearGradient(
                this.x - segmentWidth, segmentY - segmentHeight/2,
                this.x + segmentWidth/2, segmentY + segmentHeight/2
            );
            segmentGradient.addColorStop(0, `rgba(255, 255, 255, ${this.crystalPulse * 0.8})`);
            segmentGradient.addColorStop(0.3, `rgba(138, 43, 226, ${this.crystalPulse})`);
            segmentGradient.addColorStop(0.7, `rgba(75, 0, 130, ${this.crystalPulse * 0.9})`);
            segmentGradient.addColorStop(1, `rgba(47, 10, 79, ${this.crystalPulse * 0.7})`);
            
            ctx.fillStyle = segmentGradient;
            ctx.strokeStyle = `rgba(138, 43, 226, ${this.crystalPulse})`;
            ctx.lineWidth = 1;
            
            // Draw crystalline segment (diamond shape)
            ctx.beginPath();
            ctx.moveTo(this.x, segmentY - segmentHeight/2); // Top
            ctx.lineTo(this.x + segmentWidth, segmentY); // Right
            ctx.lineTo(this.x, segmentY + segmentHeight/2); // Bottom
            ctx.lineTo(this.x - segmentWidth, segmentY); // Left
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Crystal facets
            ctx.strokeStyle = `rgba(200, 200, 255, ${this.crystalPulse * 0.5})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(this.x, segmentY - segmentHeight/2);
            ctx.lineTo(this.x, segmentY + segmentHeight/2);
            ctx.stroke();
            
            // Side facets
            ctx.beginPath();
            ctx.moveTo(this.x - segmentWidth, segmentY);
            ctx.lineTo(this.x + segmentWidth, segmentY);
            ctx.stroke();
        }
        
        // Crystal top orb with intense glow
        const orbRadius = crystalWidth * 1.5;
        const orbY = this.y - crystalHeight;
        
        // Multiple glow layers for intense effect
        for (let layer = 3; layer >= 0; layer--) {
            const glowRadius = orbRadius + layer * 8;
            const orbGradient = ctx.createRadialGradient(orbY, orbY, 0, this.x, orbY, glowRadius);
            orbGradient.addColorStop(0, `rgba(255, 255, 255, ${this.crystalPulse / (layer + 1)})`);
            orbGradient.addColorStop(0.3, `rgba(138, 43, 226, ${this.crystalPulse * 0.8 / (layer + 1)})`);
            orbGradient.addColorStop(1, 'rgba(138, 43, 226, 0)');
            
            ctx.fillStyle = orbGradient;
            ctx.beginPath();
            ctx.arc(this.x, orbY, glowRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Core crystal orb
        const coreGradient = ctx.createRadialGradient(
            this.x - orbRadius * 0.3, orbY - orbRadius * 0.3, 0,
            this.x, orbY, orbRadius
        );
        coreGradient.addColorStop(0, `rgba(255, 255, 255, ${this.crystalPulse})`);
        coreGradient.addColorStop(0.3, `rgba(138, 43, 226, ${this.crystalPulse})`);
        coreGradient.addColorStop(1, `rgba(75, 0, 130, ${this.crystalPulse * 0.8})`);
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(this.x, orbY, orbRadius, 0, Math.PI * 2);
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
