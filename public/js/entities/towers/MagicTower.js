import { Tower } from './Tower.js';

export class MagicTower extends Tower {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY);
        this.range = 110;
        this.damage = 30;
        this.fireRate = 0.8;
        
        // Element system - CORRECTED elements
        this.selectedElement = 'fire'; // Default element
        this.elementalBonuses = {
            fire: { damageBonus: 0 },
            water: { slowBonus: 0 },
            air: { chainRange: 0 },
            earth: { armorPiercing: 0 }
        };
        
        // Animation properties
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
        super.update(deltaTime, enemies);
        this.enemies = enemies; // Store for use in chainLightning
        
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
            let finalDamage = this.damage;
            
            // Apply elemental effects based on selected element - CORRECTED
            switch(this.selectedElement) {
                case 'fire':
                    finalDamage += this.elementalBonuses.fire.damageBonus;
                    this.target.takeDamage(finalDamage, false, 'fire');
                    // Apply burn effect
                    if (this.target.burnTimer) {
                        this.target.burnTimer = Math.max(this.target.burnTimer, 3);
                    } else {
                        this.target.burnTimer = 3;
                        this.target.burnDamage = 5;
                    }
                    break;
                    
                case 'water':
                    this.target.takeDamage(finalDamage, false, 'water');
                    // Apply enhanced slow effect
                    const baseSlowEffect = 0.7;
                    const enhancedSlowEffect = Math.max(0.3, baseSlowEffect - this.elementalBonuses.water.slowBonus);
                    if (this.target.speed > 20) {
                        this.target.speed *= enhancedSlowEffect;
                    }
                    // Apply freeze effect visual
                    this.target.frozenTimer = 0.5;
                    break;
                    
                case 'air':
                    this.target.takeDamage(finalDamage, false, 'air');
                    // Chain lightning to nearby enemies
                    this.chainLightning(this.target);
                    break;
                    
                case 'earth':
                    // Armor piercing ignores enemy defense
                    const piercingDamage = finalDamage + this.elementalBonuses.earth.armorPiercing;
                    this.target.takeDamage(piercingDamage, true, 'earth'); // True = ignore armor
                    break;
            }
            
            // Create appropriate visual effect
            this.createElementalEffect();
        }
    }
    
    chainLightning(originalTarget) {
        const chainRange = 50 + this.elementalBonuses.air.chainRange;
        const chainTargets = [originalTarget];
        
        // Find nearby enemies for chain lightning
        if (this.enemies) {
            const visited = new Set();
            visited.add(originalTarget);
            let currentTargets = [originalTarget];
            
            // Chain up to 3 times
            for (let chain = 0; chain < 3; chain++) {
                const nextTargets = [];
                
                currentTargets.forEach(target => {
                    this.enemies.forEach(enemy => {
                        if (!visited.has(enemy) && !enemy.isDead()) {
                            const dist = Math.hypot(enemy.x - target.x, enemy.y - target.y);
                            if (dist <= chainRange) {
                                nextTargets.push(enemy);
                                visited.add(enemy);
                                chainTargets.push(enemy);
                                
                                // Deal damage to chained enemy
                                let chainDamage = Math.floor(this.damage * 0.6); // 60% damage
                                enemy.takeDamage(chainDamage, false, 'air');
                            }
                        }
                    });
                });
                
                if (nextTargets.length === 0) break;
                currentTargets = nextTargets;
            }
        }
    }
    
    createElementalEffect() {
        if (!this.target) return;
        
        // Create lightning bolt effect with elemental color - CORRECTED
        let boltColor, impactColor;
        
        switch(this.selectedElement) {
            case 'fire':
                boltColor = 'rgba(255, 69, 0, ';
                impactColor = 'rgba(255, 140, 0, ';
                break;
            case 'water':
                boltColor = 'rgba(64, 164, 223, ';
                impactColor = 'rgba(135, 206, 250, ';
                break;
            case 'air':
                boltColor = 'rgba(255, 255, 0, ';
                impactColor = 'rgba(255, 255, 255, ';
                break;
            case 'earth':
                boltColor = 'rgba(139, 69, 19, ';
                impactColor = 'rgba(160, 82, 45, ';
                break;
        }
        
        this.lightningBolts.push({
            startX: this.x,
            startY: this.y,
            endX: this.target.x,
            endY: this.target.y,
            life: 0.3,
            maxLife: 0.3,
            segments: this.generateLightningSegments(this.x, this.y, this.target.x, this.target.y),
            color: boltColor
        });
        
        // Create impact particles with elemental colors
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
                color: impactColor
            });
        }
    }
    
    setElement(element) {
        if (['fire', 'water', 'air', 'earth'].includes(element)) {
            this.selectedElement = element;
// console.log(`MagicTower: Element changed to ${element}`);
            
            // Update visual particles to match element
            this.updateElementalParticles();
        }
    }
    
    updateElementalParticles() {
        // Clear existing particles and regenerate with new element color
        this.magicParticles = [];
    }
    
    isClickable(x, y, towerSize) {
        return Math.hypot(this.x - x, this.y - y) <= towerSize/2;
    }
    
    applyElementalBonuses(bonuses) {
        this.elementalBonuses = bonuses;
    }
    
    getElementalColor() {
        switch(this.selectedElement) {
            case 'fire': return 'rgba(255, 107, 53, ';
            case 'water': return 'rgba(78, 205, 196, ';
            case 'air': return 'rgba(255, 230, 109, ';
            case 'earth': return 'rgba(139, 111, 71, ';
            default: return 'rgba(138, 43, 226, ';
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
        // Get tower size - use ResolutionManager if available
        const cellSize = this.getCellSize(ctx);
        const towerSize = cellSize * 2;
        
        // 3D shadow
        ctx.fillStyle = 'rgba(75, 0, 130, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x + 3, this.y + 3, towerSize * 0.35, 0, Math.PI * 2);
        ctx.fill();
        
        // Mystical stone base (octagonal mage tower)
        const baseRadius = towerSize * 0.35;
        const towerHeight = towerSize * 0.5;
        
        // Tower foundation
        const foundationGradient = ctx.createRadialGradient(
            this.x - baseRadius * 0.3, this.y - baseRadius * 0.3, 0,
            this.x, this.y, baseRadius
        );
        foundationGradient.addColorStop(0, '#6A5ACD');
        foundationGradient.addColorStop(0.7, '#483D8B');
        foundationGradient.addColorStop(1, '#2E0A4F');
        
        ctx.fillStyle = foundationGradient;
        ctx.strokeStyle = '#4B0082';
        ctx.lineWidth = 2;
        
        // Draw octagonal tower base
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = this.x + Math.cos(angle) * baseRadius;
            const y = this.y + Math.sin(angle) * baseRadius;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Tower walls with 3D effect
        const wallGradient = ctx.createLinearGradient(
            this.x - baseRadius, this.y - towerHeight,
            this.x + baseRadius * 0.3, this.y
        );
        wallGradient.addColorStop(0, '#9370DB');
        wallGradient.addColorStop(0.5, '#6A5ACD');
        wallGradient.addColorStop(1, '#483D8B');
        
        ctx.fillStyle = wallGradient;
        ctx.strokeStyle = '#4B0082';
        ctx.lineWidth = 2;
        
        // Draw tower cylinder (FIXED: proper alignment)
        ctx.beginPath();
        ctx.arc(this.x, this.y - towerHeight/2, baseRadius * 0.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Stone blocks texture
        ctx.strokeStyle = '#2E0A4F';
        ctx.lineWidth = 1;
        for (let ring = 0; ring < 4; ring++) {
            const ringY = this.y - towerHeight + (ring * towerHeight/4);
            ctx.beginPath();
            ctx.arc(this.x, ringY, baseRadius * 0.85, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Mystical windows
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const windowX = this.x + Math.cos(angle) * baseRadius * 0.7;
            const windowY = this.y - towerHeight/2;
            
            // Window glow
            const windowGlow = ctx.createRadialGradient(windowX, windowY, 0, windowX, windowY, 8);
            windowGlow.addColorStop(0, `rgba(138, 43, 226, ${this.crystalPulse})`);
            windowGlow.addColorStop(1, 'rgba(138, 43, 226, 0)');
            ctx.fillStyle = windowGlow;
            ctx.beginPath();
            ctx.arc(windowX, windowY, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Window frame
            ctx.fillStyle = '#2E0A4F';
            ctx.beginPath();
            ctx.arc(windowX, windowY, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Tesla coil base platform (FIXED: aligned with tower)
        const coilBaseRadius = baseRadius * 0.6;
        const coilBaseY = this.y - towerHeight;
        
        ctx.fillStyle = '#2F2F2F';
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, coilBaseY, coilBaseRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Tesla coil central column (FIXED: proper positioning)
        const coilHeight = towerSize * 0.4;
        const coilWidth = baseRadius * 0.15;
        
        // Main coil column
        const coilGradient = ctx.createLinearGradient(
            this.x - coilWidth, coilBaseY - coilHeight,
            this.x + coilWidth, coilBaseY
        );
        coilGradient.addColorStop(0, '#C0C0C0');
        coilGradient.addColorStop(0.3, '#808080');
        coilGradient.addColorStop(0.7, '#696969');
        coilGradient.addColorStop(1, '#2F2F2F');
        
        ctx.fillStyle = coilGradient;
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 2;
        ctx.fillRect(this.x - coilWidth, coilBaseY - coilHeight, coilWidth * 2, coilHeight);
        ctx.strokeRect(this.x - coilWidth, coilBaseY - coilHeight, coilWidth * 2, coilHeight);
        
        // Tesla coil rings (FIXED: proper alignment)
        const ringCount = 5;
        for (let i = 0; i < ringCount; i++) {
            const ringY = coilBaseY - coilHeight + (i + 1) * coilHeight / (ringCount + 1);
            const ringRadius = coilWidth * (2 + Math.sin(i * 0.5));
            
            ctx.strokeStyle = '#A0A0A0';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, ringY, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Ring highlights
            ctx.strokeStyle = '#E0E0E0';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, ringY, ringRadius, -Math.PI/4, Math.PI/4);
            ctx.stroke();
        }
        
        // Tesla coil top sphere (FIXED: aligned properly)
        const sphereRadius = coilWidth * 1.5;
        const sphereY = coilBaseY - coilHeight;
        
        const sphereGradient = ctx.createRadialGradient(
            this.x - sphereRadius * 0.3, sphereY - sphereRadius * 0.3, 0,
            this.x, sphereY, sphereRadius
        );
        sphereGradient.addColorStop(0, '#E0E0E0');
        sphereGradient.addColorStop(0.7, '#A0A0A0');
        sphereGradient.addColorStop(1, '#696969');
        
        ctx.fillStyle = sphereGradient;
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, sphereY, sphereRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Tesla coil energy discharge points with elemental color
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const dischargeX = this.x + Math.cos(angle) * sphereRadius * 0.8;
            const dischargeY = sphereY + Math.sin(angle) * sphereRadius * 0.8;
            
            const elementColor = this.getElementalColor();
            ctx.fillStyle = elementColor + `${this.crystalPulse})`;
            ctx.beginPath();
            ctx.arc(dischargeX, dischargeY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Floating runes around tower base (not coil)
        this.runePositions.forEach((rune, index) => {
            const floatY = Math.sin(this.animationTime * 2 + rune.floatOffset) * 6;
            const runeAngle = this.runeRotation + rune.angle;
            const runeRadius = baseRadius * 1.3;
            const runeX = this.x + Math.cos(runeAngle) * runeRadius;
            const runeY = this.y - towerHeight * 0.3 + Math.sin(runeAngle) * runeRadius * 0.3 + floatY;
            
            // Rune glow
            const runeGlow = ctx.createRadialGradient(runeX, runeY, 0, runeX, runeY, 12);
            runeGlow.addColorStop(0, `rgba(138, 43, 226, ${this.crystalPulse * 0.6})`);
            runeGlow.addColorStop(1, 'rgba(138, 43, 226, 0)');
            ctx.fillStyle = runeGlow;
            ctx.beginPath();
            ctx.arc(runeX, runeY, 12, 0, Math.PI * 2);
            ctx.fill();
            
            // Rune symbol
            ctx.fillStyle = `rgba(255, 255, 255, ${this.crystalPulse})`;
            ctx.font = 'bold 14px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(rune.symbol, runeX, runeY);
        });
        
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
        
        // Render lightning bolts with elemental colors
        this.lightningBolts.forEach(bolt => {
            const alpha = bolt.life / bolt.maxLife;
            
            // Update bolt start position to tesla coil sphere
            bolt.startX = this.x;
            bolt.startY = sphereY;
            
            // Main lightning with elemental color
            ctx.strokeStyle = (bolt.color || 'rgba(255, 255, 255, ') + alpha + ')';
            ctx.lineWidth = 4;
            bolt.segments.forEach(segment => {
                ctx.beginPath();
                ctx.moveTo(segment.fromX, segment.fromY);
                ctx.lineTo(segment.toX, segment.toY);
                ctx.stroke();
            });
            
            // Lightning glow
            ctx.strokeStyle = (bolt.color || 'rgba(138, 43, 226, ') + (alpha * 0.6) + ')';
            ctx.lineWidth = 8;
            bolt.segments.forEach(segment => {
                ctx.beginPath();
                ctx.moveTo(segment.fromX, segment.fromY);
                ctx.lineTo(segment.toX, segment.toY);
                ctx.stroke();
            });
        });
        
        // Element indicator with enhanced visibility when selected
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        const elementIcons = { fire: '🔥', water: '💧', air: '💨', earth: '🪨' };
        
        // Add selection glow effect
        if (this.isSelected) {
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 10;
            
            // Selection ring
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, towerSize/2 + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        if (this.isSelected) {
            ctx.shadowBlur = 0;
        }

        // Range indicator
        if (this.target) {
            ctx.strokeStyle = 'rgba(138, 43, 226, 0.2)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Render attack radius circle if selected
        this.renderAttackRadiusCircle(ctx);
    }
    
    static getInfo() {
        return {
            name: 'Magic Tower',
            description: 'Elemental tower with selectable damage types. Requires Magic Academy.',
            damage: '30 + elemental bonuses',
            range: '110',
            fireRate: '0.8/sec',
            cost: 150,
            icon: '✨'
        };
    }
}
