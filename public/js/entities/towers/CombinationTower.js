import { Tower } from './Tower.js';

export class CombinationTower extends Tower {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY);
        this.range = 110;
        this.damage = 35;
        this.fireRate = 0.7;
        
        // Combination spell system
        this.selectedSpell = null; // Will be set to first unlocked spell
        this.availableSpells = []; // Set by tower manager when academy provides spells
        this.combinationBonuses = {
            steam: { damageBonus: 0, slowBonus: 0 },
            magma: { damageBonus: 0, piercingBonus: 0 },
            tempest: { chainRange: 0, slowBonus: 0 },
            meteor: { chainRange: 0, piercingBonus: 0 }
        };
        
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
    
    setAvailableSpells(spells) {
        this.availableSpells = spells;
        if (spells.length > 0 && !this.selectedSpell) {
            this.selectedSpell = spells[0].id;
        }
    }
    
    update(deltaTime, enemies) {
        super.update(deltaTime, enemies);
        this.enemies = enemies; // Store for use in chainLightning
        
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
    
    chainToNearbyEnemies(originalTarget, damage, damageType) {
        const chainRange = 80;
        if (!this.enemies) return;
        
        this.enemies.forEach(enemy => {
            if (enemy !== originalTarget && !enemy.isDead()) {
                const dist = Math.hypot(enemy.x - originalTarget.x, enemy.y - originalTarget.y);
                if (dist <= chainRange) {
                    // Reduced damage for chained targets
                    const chainDamage = Math.floor(damage * 0.5);
                    enemy.takeDamage(chainDamage, false, damageType);
                }
            }
        });
    }
    
    shoot() {
        if (this.target) {
            let finalDamage = this.damage;
            
            // If a spell is selected, use combination effects, otherwise do basic attack
            if (this.selectedSpell) {
                const spell = this.combinationBonuses[this.selectedSpell];
                
                // Apply combination spell effects
                switch(this.selectedSpell) {
                    case 'steam':
                        finalDamage += spell.damageBonus;
                        this.target.takeDamage(finalDamage, false, 'fire');
                        // Burn effect
                        if (this.target.burnTimer) {
                            this.target.burnTimer = Math.max(this.target.burnTimer, 3);
                        } else {
                            this.target.burnTimer = 3;
                            this.target.burnDamage = 5;
                        }
                        // Slow effect
                        const baseSlowEffect = 0.7;
                        const enhancedSlowEffect = Math.max(0.3, baseSlowEffect - spell.slowBonus);
                        if (this.target.speed > 20) {
                            this.target.speed *= enhancedSlowEffect;
                        }
                        break;
                        
                    case 'magma':
                        finalDamage += spell.damageBonus;
                        const piercingDamage = finalDamage + spell.piercingBonus;
                        this.target.takeDamage(piercingDamage, true, 'earth');
                        // Burn effect
                        if (this.target.burnTimer) {
                            this.target.burnTimer = Math.max(this.target.burnTimer, 3);
                        } else {
                            this.target.burnTimer = 3;
                            this.target.burnDamage = 5;
                        }
                        break;
                        
                    case 'tempest':
                        this.target.takeDamage(finalDamage, false, 'water');
                        // Slow effect
                        const slowEffect = Math.max(0.3, 0.7 - spell.slowBonus);
                        if (this.target.speed > 20) {
                            this.target.speed *= slowEffect;
                        }
                        // Chain to nearby enemies
                        this.chainToNearbyEnemies(this.target, finalDamage, 'water');
                        break;
                        
                    case 'meteor':
                        const meteorPiercingDamage = finalDamage + spell.piercingBonus;
                        this.target.takeDamage(meteorPiercingDamage, true, 'earth');
                        // Chain to nearby enemies (splash damage)
                        this.chainToNearbyEnemies(this.target, meteorPiercingDamage, 'earth');
                        break;
                }
                
                // Create visual effect
                this.createCombinationEffect();
            } else {
                // Default arcane blast with no spell selected
                this.target.takeDamage(finalDamage, false, 'water');
                // Create basic arcane effect
                this.createBasicArcaneEffect();
            }
        }
    }
    
    createCombinationEffect() {
        if (!this.target) return;
        
        switch(this.selectedSpell) {
            case 'steam':
                this.createSteamEffect();
                break;
            case 'magma':
                this.createMagmaEffect();
                break;
            case 'tempest':
                this.createTempestEffect();
                break;
            case 'meteor':
                this.createMeteorEffect();
                break;
        }
    }
    
    createBasicArcaneEffect() {
        if (!this.target) return;
        
        // Blue arcane bolt from tower to target
        const segments = 4;
        for (let i = 0; i < segments; i++) {
            const progress = i / segments;
            const delay = progress * 0.3;
            
            this.lightningBolts.push({
                startX: this.x,
                startY: this.y,
                endX: this.target.x,
                endY: this.target.y,
                life: 0.3 - delay,
                maxLife: 0.3,
                segments: [{
                    fromX: this.x + (this.target.x - this.x) * progress,
                    fromY: this.y + (this.target.y - this.y) * progress,
                    toX: this.x + (this.target.x - this.x) * (progress + 0.25),
                    toY: this.y + (this.target.y - this.y) * (progress + 0.25)
                }],
                color: 'rgba(100, 150, 255, ',
                size: 6
            });
        }
        
        // Arcane burst at target
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const speed = 50 + Math.random() * 40;
            this.magicParticles.push({
                x: this.target.x,
                y: this.target.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 20,
                life: 1,
                maxLife: 1,
                size: 0,
                maxSize: 5 + Math.random() * 4,
                color: 'rgba(100, 150, 255, '
            });
        }
    }
    
    createSteamEffect() {
        // Swirling steam clouds from tower to target
        const cloudCount = 8;
        for (let i = 0; i < cloudCount; i++) {
            const progress = i / cloudCount;
            const x = this.x + (this.target.x - this.x) * progress;
            const y = this.y + (this.target.y - this.y) * progress;
            const swirl = Math.sin(progress * Math.PI * 3) * 20;
            
            this.magicParticles.push({
                x: x + swirl,
                y: y,
                vx: (Math.random() - 0.5) * 30,
                vy: -Math.random() * 20,
                life: 1.5,
                maxLife: 1.5,
                size: 0,
                maxSize: 12 + Math.random() * 8,
                color: i % 2 === 0 ? 'rgba(100, 200, 255, ' : 'rgba(255, 100, 50, '
            });
        }
        
        // Impact steam burst
        for (let i = 0; i < 15; i++) {
            const angle = (i / 15) * Math.PI * 2;
            const speed = 80 + Math.random() * 40;
            this.magicParticles.push({
                x: this.target.x,
                y: this.target.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 30,
                life: 2,
                maxLife: 2,
                size: 0,
                maxSize: 10 + Math.random() * 6,
                color: 'rgba(200, 220, 255, '
            });
        }
    }
    
    createMagmaEffect() {
        // Molten projectile
        const projectileLife = 0.5;
        const segments = 6;
        
        for (let i = 0; i < segments; i++) {
            const progress = i / segments;
            const delay = progress * projectileLife;
            
            this.lightningBolts.push({
                startX: this.x,
                startY: this.y,
                endX: this.target.x,
                endY: this.target.y,
                life: projectileLife - delay,
                maxLife: projectileLife,
                segments: [{
                    fromX: this.x + (this.target.x - this.x) * progress,
                    fromY: this.y + (this.target.y - this.y) * progress,
                    toX: this.x + (this.target.x - this.x) * (progress + 0.2),
                    toY: this.y + (this.target.y - this.y) * (progress + 0.2)
                }],
                color: 'rgba(255, 100, 0, ',
                isMagma: true,
                size: 8
            });
        }
        
        // Lava splatter on impact
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const speed = 60 + Math.random() * 80;
            const size = 6 + Math.random() * 6;
            
            this.magicParticles.push({
                x: this.target.x,
                y: this.target.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 40,
                life: 1.5,
                maxLife: 1.5,
                size: 0,
                maxSize: size,
                color: i % 3 === 0 ? 'rgba(255, 69, 0, ' : (i % 3 === 1 ? 'rgba(255, 140, 0, ' : 'rgba(139, 69, 19, ')
            });
        }
        
        // Ground burn effect
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const distance = 15 + Math.random() * 10;
            
            this.magicParticles.push({
                x: this.target.x + Math.cos(angle) * distance,
                y: this.target.y + Math.sin(angle) * distance,
                vx: 0,
                vy: -10,
                life: 2,
                maxLife: 2,
                size: 0,
                maxSize: 8,
                color: 'rgba(255, 50, 0, '
            });
        }
    }
    
    createTempestEffect() {
        // Lightning bolts with jagged path
        const boltCount = 3;
        for (let b = 0; b < boltCount; b++) {
            const offset = (b - 1) * 15;
            this.lightningBolts.push({
                startX: this.x,
                startY: this.y,
                endX: this.target.x + offset,
                endY: this.target.y,
                life: 0.4,
                maxLife: 0.4,
                segments: this.generateLightningSegments(this.x, this.y, this.target.x + offset, this.target.y),
                color: 'rgba(255, 255, 100, ',
                isTempest: true
            });
        }
        
        // Wind swirl particles
        for (let i = 0; i < 25; i++) {
            const angle = (i / 25) * Math.PI * 4; // Multiple spirals
            const radius = (i / 25) * 80;
            const x = this.target.x + Math.cos(angle) * radius;
            const y = this.target.y + Math.sin(angle) * radius;
            
            this.magicParticles.push({
                x: x,
                y: y,
                vx: Math.cos(angle + Math.PI / 2) * 120,
                vy: Math.sin(angle + Math.PI / 2) * 120 - 20,
                life: 1,
                maxLife: 1,
                size: 0,
                maxSize: 4,
                color: 'rgba(200, 220, 255, '
            });
        }
        
        // Water droplets
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 60;
            
            this.magicParticles.push({
                x: this.target.x,
                y: this.target.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 30,
                life: 1.5,
                maxLife: 1.5,
                size: 0,
                maxSize: 6,
                color: 'rgba(100, 150, 255, '
            });
        }
    }
    
    createMeteorEffect() {
        // Falling meteor from above
        const meteorStartY = this.target.y - 200;
        
        // Meteor trail
        for (let i = 0; i < 10; i++) {
            const progress = i / 10;
            const trailX = this.target.x + (Math.random() - 0.5) * 20;
            const trailY = meteorStartY + (this.target.y - meteorStartY) * progress;
            
            this.magicParticles.push({
                x: trailX,
                y: trailY,
                vx: (Math.random() - 0.5) * 20,
                vy: 100 + Math.random() * 50,
                life: 0.8,
                maxLife: 0.8,
                size: 0,
                maxSize: 8 + Math.random() * 6,
                color: i % 2 === 0 ? 'rgba(255, 140, 0, ' : 'rgba(139, 69, 19, '
            });
        }
        
        // Meteor body (large projectile)
        this.lightningBolts.push({
            startX: this.target.x,
            startY: meteorStartY,
            endX: this.target.x,
            endY: this.target.y,
            life: 0.5,
            maxLife: 0.5,
            segments: [{
                fromX: this.target.x,
                fromY: meteorStartY,
                toX: this.target.x,
                toY: this.target.y
            }],
            color: 'rgba(200, 100, 50, ',
            isMeteor: true,
            size: 15
        });
        
        // Impact crater effect
        for (let ring = 0; ring < 3; ring++) {
            const particleCount = 12 + ring * 6;
            const ringRadius = 30 + ring * 20;
            
            for (let i = 0; i < particleCount; i++) {
                const angle = (i / particleCount) * Math.PI * 2;
                const speed = 60 + ring * 30;
                
                this.magicParticles.push({
                    x: this.target.x,
                    y: this.target.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 20,
                    life: 1.5 + ring * 0.3,
                    maxLife: 1.5 + ring * 0.3,
                    size: 0,
                    maxSize: 8 - ring * 2,
                    color: ring % 2 === 0 ? 'rgba(139, 90, 43, ' : 'rgba(160, 82, 45, '
                });
            }
        }
        
        // Dust cloud
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 30;
            
            this.magicParticles.push({
                x: this.target.x + Math.cos(angle) * distance,
                y: this.target.y + Math.sin(angle) * distance,
                vx: Math.cos(angle) * 30,
                vy: -40 - Math.random() * 20,
                life: 2,
                maxLife: 2,
                size: 0,
                maxSize: 12,
                color: 'rgba(139, 115, 85, '
            });
        }
    }
    
    setSpell(spellId) {
        if (this.availableSpells.some(s => s.id === spellId)) {
            this.selectedSpell = spellId;
            return true;
        }
        return false;
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
    
    isClickable(x, y, towerSize) {
        return Math.hypot(this.x - x, this.y - y) <= towerSize/2;
    }
    
    applySpellBonuses(bonuses) {
        Object.assign(this.combinationBonuses, bonuses);
    }
    
    getCombinationColor() {
        switch(this.selectedSpell) {
            case 'steam': return 'rgba(100, 200, 255, ';
            case 'magma': return 'rgba(255, 100, 50, ';
            case 'tempest': return 'rgba(255, 255, 100, ';
            case 'meteor': return 'rgba(200, 100, 50, ';
            default: return 'rgba(138, 43, 226, ';
        }
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
        
        // ...existing code from MagicTower render method...
        // (Tower base, walls, windows, etc. - similar to MagicTower)
        
        const baseRadius = towerSize * 0.35;
        const towerHeight = towerSize * 0.5;
        
        // Tower foundation (using combination color instead of purple)
        const combinationColor = this.getCombinationColor();
        const foundationGradient = ctx.createRadialGradient(
            this.x - baseRadius * 0.3, this.y - baseRadius * 0.3, 0,
            this.x, this.y, baseRadius
        );
        foundationGradient.addColorStop(0, combinationColor + '1)');
        foundationGradient.addColorStop(0.7, combinationColor + '0.8)');
        foundationGradient.addColorStop(1, combinationColor + '0.6)');
        
        ctx.fillStyle = foundationGradient;
        ctx.strokeStyle = combinationColor + '1)';
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
        
        // Tower cylinder (combination colored)
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
        
        // Mystical windows with combination glow
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const windowX = this.x + Math.cos(angle) * baseRadius * 0.7;
            const windowY = this.y - towerHeight/2;
            
            const windowGlow = ctx.createRadialGradient(windowX, windowY, 0, windowX, windowY, 8);
            windowGlow.addColorStop(0, combinationColor + `${this.crystalPulse})`);
            windowGlow.addColorStop(1, combinationColor + '0)');
            ctx.fillStyle = windowGlow;
            ctx.beginPath();
            ctx.arc(windowX, windowY, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#2E0A4F';
            ctx.beginPath();
            ctx.arc(windowX, windowY, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Tesla coil base (similar to MagicTower but with combination coloring)
        const coilBaseRadius = baseRadius * 0.6;
        const coilBaseY = this.y - towerHeight;
        
        ctx.fillStyle = combinationColor + '0.7)';
        ctx.strokeStyle = combinationColor + '1)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, coilBaseY, coilBaseRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Render magic particles with combination colors
        this.magicParticles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            ctx.fillStyle = particle.color + alpha + ')';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Render lightning bolts with unique styles
        this.lightningBolts.forEach(bolt => {
            const alpha = bolt.life / bolt.maxLife;
            
            if (bolt.isMagma) {
                // Render magma projectile as glowing orb
                ctx.save();
                const progress = 1 - (bolt.life / bolt.maxLife);
                const currentX = bolt.startX + (bolt.endX - bolt.startX) * progress;
                const currentY = bolt.startY + (bolt.endY - bolt.startY) * progress;
                
                // Glow
                const glowGradient = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, bolt.size * 2);
                glowGradient.addColorStop(0, `rgba(255, 140, 0, ${alpha})`);
                glowGradient.addColorStop(0.5, `rgba(255, 69, 0, ${alpha * 0.5})`);
                glowGradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
                ctx.fillStyle = glowGradient;
                ctx.beginPath();
                ctx.arc(currentX, currentY, bolt.size * 2, 0, Math.PI * 2);
                ctx.fill();
                
                // Core
                ctx.fillStyle = `rgba(255, 200, 0, ${alpha})`;
                ctx.beginPath();
                ctx.arc(currentX, currentY, bolt.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            } else if (bolt.isMeteor) {
                // Render meteor as falling rock
                ctx.save();
                const progress = 1 - (bolt.life / bolt.maxLife);
                const currentX = bolt.startX + (bolt.endX - bolt.startX) * progress;
                const currentY = bolt.startY + (bolt.endY - bolt.startY) * progress;
                
                // Fiery glow
                const glowGradient = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, bolt.size * 2);
                glowGradient.addColorStop(0, `rgba(255, 140, 0, ${alpha})`);
                glowGradient.addColorStop(0.5, `rgba(255, 69, 0, ${alpha * 0.5})`);
                glowGradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
                ctx.fillStyle = glowGradient;
                ctx.beginPath();
                ctx.arc(currentX, currentY, bolt.size * 2, 0, Math.PI * 2);
                ctx.fill();
                
                // Meteor body
                ctx.fillStyle = `rgba(139, 69, 19, ${alpha})`;
                ctx.beginPath();
                ctx.arc(currentX, currentY, bolt.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Rocky texture
                ctx.fillStyle = `rgba(160, 82, 45, ${alpha * 0.6})`;
                ctx.beginPath();
                ctx.arc(currentX - bolt.size * 0.3, currentY - bolt.size * 0.3, bolt.size * 0.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            } else if (bolt.isTempest) {
                // Render tempest as jagged lightning
                ctx.strokeStyle = (bolt.color || 'rgba(255, 255, 100, ') + alpha + ')';
                ctx.lineWidth = 3;
                ctx.shadowColor = `rgba(255, 255, 255, ${alpha})`;
                ctx.shadowBlur = 10;
                
                bolt.segments.forEach(segment => {
                    ctx.beginPath();
                    ctx.moveTo(segment.fromX, segment.fromY);
                    ctx.lineTo(segment.toX, segment.toY);
                    ctx.stroke();
                });
                
                ctx.shadowBlur = 0;
            } else {
                // Default lightning rendering
                ctx.strokeStyle = (bolt.color || this.getCombinationColor()) + alpha + ')';
                ctx.lineWidth = 4;
                bolt.segments.forEach(segment => {
                    ctx.beginPath();
                    ctx.moveTo(segment.fromX, segment.fromY);
                    ctx.lineTo(segment.toX, segment.toY);
                    ctx.stroke();
                });
            }
        });
        
        // Spell indicator
        if (this.selectedSpell) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            const spellIcons = { steam: '💨', magma: '🌋', tempest: '⛈️', meteor: '☄️' };
            
            if (this.isSelected) {
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 10;
                
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.x, this.y, towerSize/2 + 5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
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
            name: 'Combination Tower',
            description: 'Advanced tower that casts combination spells. Requires Academy Level 1 and gem investments to unlock spells.',
            damage: '35',
            range: '110',
            fireRate: '0.7/sec',
            cost: 200,
            icon: '⚡'
        };
    }
}
