export class CombinationTower {
    constructor(x, y, gridX, gridY) {
        this.x = x;
        this.y = y;
        this.gridX = gridX;
        this.gridY = gridY;
        this.range = 110;
        this.damage = 35;
        this.fireRate = 0.7;
        this.cooldown = 0;
        this.target = null;
        this.isSelected = false;
        
        // Combination spell system
        this.selectedSpell = null;
        this.availableSpells = [];
        this.combinationBonuses = {
            steam: { damageBonus: 0, slowBonus: 0 },
            magma: { damageBonus: 0, piercingBonus: 0 },
            tempest: { chainRange: 0, slowBonus: 0 },
            meteor: { chainRange: 0, piercingBonus: 0 }
        };
        
        // Enhanced animation properties
        this.animationTime = 0;
        this.crystalPulse = 0;
        this.orbRotation = 0;
        this.energyRings = [];
        this.spellEffects = [];
        this.lightningBolts = [];
        this.magicParticles = [];
        
        // Floating elemental orbs around the tower
        this.elementalOrbs = [
            { angle: 0, radius: 50, element: 'fire', pulse: 0, floatSpeed: 1.2 },
            { angle: Math.PI / 2, radius: 50, element: 'water', pulse: 0.3, floatSpeed: 0.8 },
            { angle: Math.PI, radius: 50, element: 'air', pulse: 0.6, floatSpeed: 1.5 },
            { angle: 3 * Math.PI / 2, radius: 50, element: 'earth', pulse: 0.9, floatSpeed: 1.0 }
        ];
        
        // Combination-specific visual elements
        this.combinationRunes = [];
        this.spellChannelEffect = null;
    }
    
    setAvailableSpells(spells) {
        this.availableSpells = spells || [];
        console.log('CombinationTower: Set available spells:', this.availableSpells.length);
        
        // Set initial spell if available and none selected
        if (this.availableSpells.length > 0 && !this.selectedSpell) {
            this.selectedSpell = this.availableSpells[0].id;
            console.log(`CombinationTower: Set initial spell to ${this.selectedSpell}`);
        }
    }
    
    update(deltaTime, enemies) {
        this.cooldown = Math.max(0, this.cooldown - deltaTime);
        this.animationTime += deltaTime;
        this.crystalPulse = 0.5 + 0.5 * Math.sin(this.animationTime * 3);
        this.orbRotation += deltaTime * 0.8;
        
        // Update floating orbs
        this.elementalOrbs.forEach(orb => {
            orb.angle += deltaTime * orb.floatSpeed;
            orb.pulse = 0.5 + 0.5 * Math.sin(this.animationTime * 3 + orb.pulse * Math.PI);
        });
        
        // Generate energy rings periodically
        if (Math.random() < deltaTime * 2) {
            this.energyRings.push({
                radius: 20,
                maxRadius: 80,
                life: 2,
                maxLife: 2,
                intensity: Math.random() * 0.5 + 0.5
            });
        }
        
        // Update energy rings
        this.energyRings = this.energyRings.filter(ring => {
            ring.life -= deltaTime;
            ring.radius = ring.maxRadius * (1 - ring.life / ring.maxLife);
            return ring.life > 0;
        });
        
        this.target = this.findTarget(enemies);
        
        if (this.target && this.cooldown === 0 && this.selectedSpell) {
            this.castSpell();
            this.cooldown = 1 / this.fireRate;
        }
        
        // Update spell effects
        this.spellEffects = this.spellEffects.filter(effect => {
            effect.life -= deltaTime;
            effect.update(deltaTime);
            return effect.life > 0;
        });
        
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
        if (Math.random() < deltaTime * 4) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 30 + 20;
            this.magicParticles.push({
                x: this.x + Math.cos(angle) * radius,
                y: this.y + Math.sin(angle) * radius - 20,
                vx: (Math.random() - 0.5) * 30,
                vy: (Math.random() - 0.5) * 30 - 20,
                life: 3,
                maxLife: 3,
                size: 0,
                maxSize: Math.random() * 3 + 2,
                color: this.getCombinationColor().slice(0, -2) // Remove the alpha part
            });
        }
        
        // Update spell channel effect
        if (this.spellChannelEffect) {
            this.spellChannelEffect.life -= deltaTime;
            if (this.spellChannelEffect.life <= 0) {
                this.spellChannelEffect = null;
            }
        }
    }
    
    castSpell() {
        if (!this.target || !this.selectedSpell) return;
        
        let finalDamage = this.damage;
        const spell = this.combinationBonuses[this.selectedSpell];
        
        // Create unique spell effects based on selected spell
        this.createSpellChannelEffect();
        
        // Apply combination spell effects with unique animations
        switch(this.selectedSpell) {
            case 'steam':
                this.castSteamSpell(finalDamage, spell);
                break;
            case 'magma':
                this.castMagmaSpell(finalDamage, spell);
                break;
            case 'tempest':
                this.castTempestSpell(finalDamage, spell);
                break;
            case 'meteor':
                this.castMeteorSpell(finalDamage, spell);
                break;
        }
    }
    
    castSteamSpell(baseDamage, spell) {
        const finalDamage = baseDamage + spell.damageBonus;
        this.target.takeDamage(finalDamage);
        
        // Steam effect: spiraling vapor
        this.spellEffects.push({
            type: 'steam',
            x: this.target.x,
            y: this.target.y,
            life: 2,
            maxLife: 2,
            particles: [],
            update: function(deltaTime) {
                // Generate steam particles
                if (Math.random() < deltaTime * 15) {
                    this.particles.push({
                        x: this.x + (Math.random() - 0.5) * 30,
                        y: this.y + (Math.random() - 0.5) * 30,
                        vx: (Math.random() - 0.5) * 50,
                        vy: -Math.random() * 100 - 50,
                        size: Math.random() * 8 + 4,
                        life: 1.5,
                        maxLife: 1.5
                    });
                }
                
                this.particles = this.particles.filter(p => {
                    p.x += p.vx * deltaTime;
                    p.y += p.vy * deltaTime;
                    p.life -= deltaTime;
                    p.size *= 0.99; // Gradual size reduction
                    return p.life > 0;
                });
            }
        });
        
        // Apply burn and slow
        if (this.target.burnTimer) {
            this.target.burnTimer = Math.max(this.target.burnTimer, 3);
        } else {
            this.target.burnTimer = 3;
            this.target.burnDamage = 5;
        }
        
        const slowEffect = Math.max(0.3, 0.7 - spell.slowBonus);
        if (this.target.speed > 20) {
            this.target.speed *= slowEffect;
        }
    }
    
    castMagmaSpell(baseDamage, spell) {
        const piercingDamage = baseDamage + spell.damageBonus + spell.piercingBonus;
        this.target.takeDamage(piercingDamage, true);
        
        // Magma effect: erupting lava
        this.spellEffects.push({
            type: 'magma',
            x: this.target.x,
            y: this.target.y,
            life: 1.5,
            maxLife: 1.5,
            eruptions: [],
            update: function(deltaTime) {
                // Generate lava eruptions
                if (Math.random() < deltaTime * 8) {
                    this.eruptions.push({
                        x: this.x + (Math.random() - 0.5) * 40,
                        y: this.y + (Math.random() - 0.5) * 40,
                        vx: (Math.random() - 0.5) * 80,
                        vy: -Math.random() * 150 - 100,
                        size: Math.random() * 6 + 3,
                        life: 1,
                        maxLife: 1,
                        gravity: 200
                    });
                }
                
                this.eruptions = this.eruptions.filter(e => {
                    e.x += e.vx * deltaTime;
                    e.y += e.vy * deltaTime;
                    e.vy += e.gravity * deltaTime;
                    e.life -= deltaTime;
                    return e.life > 0 && e.y < this.y + 50;
                });
            }
        });
        
        // Apply burn effect
        if (this.target.burnTimer) {
            this.target.burnTimer = Math.max(this.target.burnTimer, 4);
        } else {
            this.target.burnTimer = 4;
            this.target.burnDamage = 8;
        }
    }
    
    castTempestSpell(baseDamage, spell) {
        this.target.takeDamage(baseDamage);
        
        // Tempest effect: swirling winds and lightning
        this.spellEffects.push({
            type: 'tempest',
            x: this.target.x,
            y: this.target.y,
            life: 2.5,
            maxLife: 2.5,
            windParticles: [],
            lightningStrikes: [],
            rotation: 0,
            update: function(deltaTime) {
                this.rotation += deltaTime * 5;
                
                // Generate wind particles in spiral
                for (let i = 0; i < 3; i++) {
                    const angle = this.rotation + (i * Math.PI * 2 / 3);
                    const radius = 20 + Math.sin(this.rotation) * 10;
                    this.windParticles.push({
                        x: this.x + Math.cos(angle) * radius,
                        y: this.y + Math.sin(angle) * radius,
                        vx: Math.cos(angle + Math.PI/2) * 100,
                        vy: Math.sin(angle + Math.PI/2) * 100,
                        life: 0.8,
                        maxLife: 0.8,
                        size: 2
                    });
                }
                
                // Occasional lightning strikes
                if (Math.random() < deltaTime * 4) {
                    this.lightningStrikes.push({
                        startX: this.x + (Math.random() - 0.5) * 60,
                        startY: this.y - 80,
                        endX: this.x + (Math.random() - 0.5) * 60,
                        endY: this.y + 20,
                        life: 0.2,
                        maxLife: 0.2
                    });
                }
                
                this.windParticles = this.windParticles.filter(p => {
                    p.x += p.vx * deltaTime;
                    p.y += p.vy * deltaTime;
                    p.life -= deltaTime;
                    return p.life > 0;
                });
                
                this.lightningStrikes = this.lightningStrikes.filter(l => {
                    l.life -= deltaTime;
                    return l.life > 0;
                });
            }
        });
        
        // Apply slow effect
        const slowEffect = Math.max(0.3, 0.7 - spell.slowBonus);
        if (this.target.speed > 20) {
            this.target.speed *= slowEffect;
        }
    }
    
    castMeteorSpell(baseDamage, spell) {
        const piercingDamage = baseDamage + spell.piercingBonus;
        this.target.takeDamage(piercingDamage, true);
        
        // Meteor effect: falling rocks with impact
        this.spellEffects.push({
            type: 'meteor',
            x: this.target.x,
            y: this.target.y,
            life: 2,
            maxLife: 2,
            meteors: [{
                x: this.target.x + (Math.random() - 0.5) * 100,
                y: this.target.y - 200,
                vx: (this.target.x - (this.target.x + (Math.random() - 0.5) * 100)) / 1.5,
                vy: 150,
                size: 8,
                trail: [],
                impacted: false
            }],
            update: function(deltaTime) {
                this.meteors.forEach(meteor => {
                    if (!meteor.impacted) {
                        // Add to trail
                        meteor.trail.push({ x: meteor.x, y: meteor.y, life: 0.5 });
                        
                        // Move meteor
                        meteor.x += meteor.vx * deltaTime;
                        meteor.y += meteor.vy * deltaTime;
                        meteor.vy += 300 * deltaTime; // Gravity
                        
                        // Check for impact
                        if (meteor.y >= this.y) {
                            meteor.impacted = true;
                            // Create impact explosion
                            for (let i = 0; i < 12; i++) {
                                const angle = (i / 12) * Math.PI * 2;
                                meteor.trail.push({
                                    x: meteor.x + Math.cos(angle) * 30,
                                    y: meteor.y + Math.sin(angle) * 30,
                                    life: 1
                                });
                            }
                        }
                    }
                    
                    // Update trail
                    meteor.trail = meteor.trail.filter(t => {
                        t.life -= deltaTime * 2;
                        return t.life > 0;
                    });
                });
            }
        });
    }
    
    createSpellChannelEffect() {
        this.spellChannelEffect = {
            life: 0.5,
            maxLife: 0.5,
            intensity: 1
        };
    }
    
    getCombinationColor() {
        switch(this.selectedSpell) {
            case 'steam': return 'rgba(135, 206, 250, '; // Light sky blue
            case 'magma': return 'rgba(255, 69, 0, '; // Orange red
            case 'tempest': return 'rgba(255, 255, 0, '; // Yellow
            case 'meteor': return 'rgba(139, 69, 19, '; // Saddle brown
            default: return 'rgba(138, 43, 226, '; // Blue violet
        }
    }
    
    render(ctx) {
        const baseResolution = 1920;
        const scaleFactor = Math.max(0.5, Math.min(2.5, ctx.canvas.width / baseResolution));
        const cellSize = Math.floor(32 * scaleFactor);
        const towerSize = cellSize * 2;
        
        // Enhanced 3D shadow with multiple layers
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(this.x + 4, this.y + 4, towerSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.arc(this.x + 2, this.y + 2, towerSize * 0.42, 0, Math.PI * 2);
        ctx.fill();
        
        const baseRadius = towerSize * 0.4;
        const towerHeight = towerSize * 0.6;
        
        // Render energy rings first
        this.energyRings.forEach(ring => {
            const alpha = ring.life / ring.maxLife * ring.intensity;
            const combinationColor = this.getCombinationColor();
            ctx.strokeStyle = combinationColor + alpha + ')';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, ring.radius, 0, Math.PI * 2);
            ctx.stroke();
        });
        
        // Multi-tiered tower base (more impressive than magic tower)
        const combinationColor = this.getCombinationColor();
        
        // Bottom tier
        const bottomGradient = ctx.createRadialGradient(
            this.x - baseRadius * 0.3, this.y - baseRadius * 0.3, 0,
            this.x, this.y, baseRadius
        );
        bottomGradient.addColorStop(0, 'rgba(75, 0, 130, 1)'); // Indigo base
        bottomGradient.addColorStop(0.7, 'rgba(138, 43, 226, 0.9)'); // Blue violet
        bottomGradient.addColorStop(1, 'rgba(72, 61, 139, 0.8)'); // Dark slate blue
        
        ctx.fillStyle = bottomGradient;
        ctx.strokeStyle = 'rgba(25, 25, 112, 1)'; // Midnight blue
        ctx.lineWidth = 3;
        
        // Octagonal base (larger than magic tower)
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
        
        // Middle tier with combination color
        const middleRadius = baseRadius * 0.85;
        const middleGradient = ctx.createRadialGradient(
            this.x - middleRadius * 0.3, this.y - towerHeight/3, 0,
            this.x, this.y - towerHeight/3, middleRadius
        );
        middleGradient.addColorStop(0, combinationColor + '1)');
        middleGradient.addColorStop(0.7, combinationColor + '0.9)');
        middleGradient.addColorStop(1, combinationColor + '0.7)');
        
        ctx.fillStyle = middleGradient;
        ctx.strokeStyle = combinationColor + '1)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y - towerHeight/3, middleRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Top crystalline structure (unique to combination tower)
        const topRadius = baseRadius * 0.7;
        const topY = this.y - towerHeight * 0.8;
        
        // Crystal facets
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + this.orbRotation;
            const x1 = this.x + Math.cos(angle) * topRadius;
            const y1 = topY + Math.sin(angle) * topRadius * 0.6;
            const x2 = this.x + Math.cos(angle + Math.PI/6) * topRadius;
            const y2 = topY + Math.sin(angle + Math.PI/6) * topRadius * 0.6;
            
            const facetGradient = ctx.createLinearGradient(x1, y1, x2, y2);
            facetGradient.addColorStop(0, combinationColor + '0.8)');
            facetGradient.addColorStop(1, combinationColor + '0.4)');
            
            ctx.fillStyle = facetGradient;
            ctx.beginPath();
            ctx.moveTo(this.x, topY - 20);
            ctx.lineTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = combinationColor + '1)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        // Floating elemental orbs around the tower
        this.elementalOrbs.forEach(orb => {
            const orbX = this.x + Math.cos(orb.angle) * orb.radius;
            const orbY = this.y - 30 + Math.sin(orb.angle) * orb.radius * 0.5;
            
            let orbColor;
            switch(orb.element) {
                case 'fire': orbColor = 'rgba(255, 69, 0, '; break;
                case 'water': orbColor = 'rgba(30, 144, 255, '; break;
                case 'air': orbColor = 'rgba(255, 255, 255, '; break;
                case 'earth': orbColor = 'rgba(139, 69, 19, '; break;
            }
            
            // Orb glow
            const orbGlow = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, 15);
            orbGlow.addColorStop(0, orbColor + orb.pulse + ')');
            orbGlow.addColorStop(1, orbColor + '0)');
            ctx.fillStyle = orbGlow;
            ctx.beginPath();
            ctx.arc(orbX, orbY, 15, 0, Math.PI * 2);
            ctx.fill();
            
            // Orb core
            ctx.fillStyle = orbColor + orb.pulse + ')';
            ctx.beginPath();
            ctx.arc(orbX, orbY, 6, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Central energy core with spell channel effect
        const coreSize = this.spellChannelEffect ? 20 * this.spellChannelEffect.intensity : 12;
        const coreGradient = ctx.createRadialGradient(
            this.x, topY, 0,
            this.x, topY, coreSize
        );
        coreGradient.addColorStop(0, combinationColor + this.crystalPulse + ')');
        coreGradient.addColorStop(1, combinationColor + '0)');
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(this.x, topY, coreSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Render spell effects
        this.renderSpellEffects(ctx);
        
        // Render magic particles
        this.magicParticles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            ctx.fillStyle = particle.color + alpha + ')';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Enhanced spell indicator
        if (this.selectedSpell) {
            const spellIcons = { steam: '💨', magma: '🌋', tempest: '⛈️', meteor: '☄️' };
            
            if (this.isSelected) {
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 15;
                
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(this.x, this.y, towerSize/2 + 8, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // Larger, more prominent spell indicator
            const iconBoxSize = 32;
            const iconBoxX = this.x + towerSize / 2 - iconBoxSize + 5;
            const iconBoxY = this.y + towerSize / 2 - iconBoxSize + 5;
            
            // Animated background
            const iconPulse = 0.8 + 0.2 * Math.sin(this.animationTime * 4);
            ctx.fillStyle = combinationColor + iconPulse + ')';
            ctx.strokeStyle = combinationColor + '1)';
            ctx.lineWidth = 3;
            ctx.fillRect(iconBoxX, iconBoxY, iconBoxSize, iconBoxSize);
            ctx.strokeRect(iconBoxX, iconBoxY, iconBoxSize, iconBoxSize);
            
            // Spell icon
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(spellIcons[this.selectedSpell] || '✦', 
                        iconBoxX + iconBoxSize / 2, 
                        iconBoxY + iconBoxSize / 2);
            
            if (this.isSelected) {
                ctx.shadowBlur = 0;
            }
        }
        
        // Range indicator
        if (this.target) {
            ctx.strokeStyle = combinationColor.slice(0, -2) + '0.3)';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 8]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    
    renderSpellEffects(ctx) {
        this.spellEffects.forEach(effect => {
            const alpha = effect.life / effect.maxLife;
            
            switch(effect.type) {
                case 'steam':
                    effect.particles.forEach(p => {
                        const pAlpha = (p.life / p.maxLife) * alpha;
                        ctx.fillStyle = `rgba(135, 206, 250, ${pAlpha})`;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    break;
                    
                case 'magma':
                    effect.eruptions.forEach(e => {
                        const eAlpha = (e.life / e.maxLife) * alpha;
                        ctx.fillStyle = `rgba(255, 69, 0, ${eAlpha})`;
                        ctx.beginPath();
                        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    break;
                    
                case 'tempest':
                    // Render wind particles
                    effect.windParticles.forEach(p => {
                        const pAlpha = (p.life / p.maxLife) * alpha;
                        ctx.fillStyle = `rgba(255, 255, 255, ${pAlpha})`;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    
                    // Render lightning
                    effect.lightningStrikes.forEach(l => {
                        const lAlpha = (l.life / l.maxLife) * alpha;
                        ctx.strokeStyle = `rgba(255, 255, 0, ${lAlpha})`;
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.moveTo(l.startX, l.startY);
                        ctx.lineTo(l.endX, l.endY);
                        ctx.stroke();
                    });
                    break;
                    
                case 'meteor':
                    effect.meteors.forEach(m => {
                        // Render trail
                        m.trail.forEach(t => {
                            const tAlpha = (t.life / 0.5) * alpha;
                            ctx.fillStyle = `rgba(255, 100, 0, ${tAlpha})`;
                            ctx.beginPath();
                            ctx.arc(t.x, t.y, 3, 0, Math.PI * 2);
                            ctx.fill();
                        });
                        
                        // Render meteor
                        if (!m.impacted) {
                            ctx.fillStyle = `rgba(139, 69, 19, ${alpha})`;
                            ctx.beginPath();
                            ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    });
                    break;
            }
        });
    }
    
    setSpell(spellId) {
        if (this.availableSpells.some(s => s.id === spellId)) {
            this.selectedSpell = spellId;
            console.log(`CombinationTower: Spell changed to ${spellId}`);
            return true;
        }
        return false;
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
    
    isClickable(x, y, towerSize) {
        return Math.hypot(this.x - x, this.y - y) <= towerSize/2;
    }
    
    applySpellBonuses(bonuses) {
        Object.assign(this.combinationBonuses, bonuses);
    }
    
    static getInfo() {
        return {
            name: 'Combination Tower',
            description: 'Advanced tower that casts combination spells. Requires Academy Level 1 and gem investments to unlock spells.',
            damage: '35',
            range: '110',
            fireRate: '0.7/sec',
            cost: 200
        };
    }
}
