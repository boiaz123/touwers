import { Building } from './Building.js';

export class SuperWeaponLab extends Building {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY, 4);
        this.isSelected = false;
        this.academy = null; // Reference to Magic Academy
        
        // Building upgrade system - starts at level 1 on build
        this.labLevel = 1;
        this.maxLabLevel = 4;
        
        // Spell system with individual upgrade levels (0-100 using diamonds)
        this.spells = {
            arcaneBlast: {
                id: 'arcaneBlast',
                name: 'Arcane Blast',
                icon: '💫',
                description: 'Deals massive damage to all enemies',
                baseLevel: 1,  // Unlocked at lab level 1
                upgradeLevel: 0,  // 0-100 using diamonds (at lab level 4+)
                maxUpgradeLevel: 100,
                damage: 150,
                radius: 120,
                cooldown: 30,
                currentCooldown: 0,
                unlocked: true
            },
            frostNova: {
                id: 'frostNova',
                name: 'Frozen Nova',
                icon: '❄️',
                description: 'Freezes all enemies for a duration',
                baseLevel: 2,  // Unlocked at lab level 2
                upgradeLevel: 0,
                maxUpgradeLevel: 100,
                freezeDuration: 3,
                radius: 150,
                cooldown: 45,
                currentCooldown: 0,
                unlocked: false
            },
            meteorStrike: {
                id: 'meteorStrike',
                name: 'Meteor Strike',
                icon: '☄️',
                description: 'Calls down meteors that devastate enemies',
                baseLevel: 3,  // Unlocked at lab level 3
                upgradeLevel: 0,
                maxUpgradeLevel: 100,
                damage: 200,
                burnDamage: 10,
                burnDuration: 5,
                cooldown: 60,
                currentCooldown: 0,
                unlocked: false
            },
            chainLightning: {
                id: 'chainLightning',
                name: 'Chain Lightning',
                icon: '⚡',
                description: 'Lightning that jumps between enemies',
                baseLevel: 4,  // Unlocked at lab level 4
                upgradeLevel: 0,
                maxUpgradeLevel: 100,
                damage: 80,
                chainCount: 5,
                cooldown: 25,
                currentCooldown: 0,
                unlocked: false
            }
        };
        
        // Combination spells system - max 5 upgrade levels per spell
        this.combinationSpells = [
            {
                id: 'steam',
                name: 'Steam',
                icon: '💨',
                description: 'Fire + Water: Burn + Slow',
                upgradeLevel: 0,  // 0-5 upgrades
                maxUpgradeLevel: 5,
                upgradesCost: 50  // Cost per upgrade level
            },
            {
                id: 'magma',
                name: 'Magma',
                icon: '🌋',
                description: 'Fire + Earth: Burn + Piercing',
                upgradeLevel: 0,
                maxUpgradeLevel: 5,
                upgradesCost: 50
            },
            {
                id: 'tempest',
                name: 'Tempest',
                icon: '⛈️',
                description: 'Air + Water: Chain + Slow',
                upgradeLevel: 0,
                maxUpgradeLevel: 5,
                upgradesCost: 50
            },
            {
                id: 'meteor',
                name: 'Meteor',
                icon: '☄️',
                description: 'Air + Earth: Chain + Piercing',
                upgradeLevel: 0,
                maxUpgradeLevel: 5,
                upgradesCost: 50
            }
        ];
        
        // Visual effects
        this.magicParticles = [];
        this.runeGlow = 0;
        this.crystalRotation = 0;
        this.spellCastEffect = null;
        
        // Active spell effects for rendering
        this.fallingMeteors = []; // For meteor strike visual effects
        this.frozenNovaEffects = []; // For frozen nova visual effects (icicles, frost)
        this.chainLightningBolts = []; // For lightning rendering
        
        // Floating runes around the spire
        this.floatingRunes = [];
        for (let i = 0; i < 6; i++) {
            this.floatingRunes.push({
                angle: (i / 6) * Math.PI * 2,
                radius: 35,
                floatOffset: Math.random() * Math.PI * 2,
                symbol: ['✧', '◇', '❋', '✦', '◈', '❂'][i]
            });
        }
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update spell cooldowns
        Object.values(this.spells).forEach(spell => {
            if (spell.currentCooldown > 0) {
                spell.currentCooldown = Math.max(0, spell.currentCooldown - deltaTime);
            }
        });
        
        // Animation updates
        this.runeGlow = 0.6 + 0.4 * Math.sin(this.animationTime * 2);
        this.crystalRotation += deltaTime * 0.5;
        
        // Generate ambient magic particles
        if (Math.random() < deltaTime * 3) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 30 + 20;
            this.magicParticles.push({
                x: this.x + Math.cos(angle) * radius,
                y: this.y + Math.sin(angle) * radius - 40,
                vx: (Math.random() - 0.5) * 20,
                vy: -Math.random() * 40 - 20,
                life: 2,
                maxLife: 2,
                size: Math.random() * 3 + 1,
                color: ['#8B5CF6', '#6366F1', '#A78BFA', '#C4B5FD'][Math.floor(Math.random() * 4)]
            });
        }
        
        // Update particles
        this.magicParticles = this.magicParticles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            particle.size = Math.max(0, particle.size * (particle.life / particle.maxLife));
            return particle.life > 0;
        });
        
        // Update falling meteors
        this.fallingMeteors = this.fallingMeteors.filter(meteor => {
            meteor.y += meteor.vy * deltaTime;
            meteor.life -= deltaTime;
            return meteor.life > 0;
        });
        
        // Update frozen nova effects
        this.frozenNovaEffects = this.frozenNovaEffects.filter(effect => {
            effect.life -= deltaTime;
            return effect.life > 0;
        });
        
        // Update chain lightning bolts
        this.chainLightningBolts = this.chainLightningBolts.filter(bolt => {
            bolt.life -= deltaTime;
            return bolt.life > 0;
        });
        
        // Update spell cast effect
        if (this.spellCastEffect) {
            this.spellCastEffect.progress += deltaTime * 2;
            if (this.spellCastEffect.progress >= 1) {
                this.spellCastEffect = null;
            }
        }
    }
    
    render(ctx, size) {
        // Render the magical stone spire
        this.renderStoneBase(ctx, size);
        this.renderWoodenSupports(ctx, size);
        this.renderMainSpire(ctx, size);
        this.renderFloatingRunes(ctx, size);
        this.renderCrystalTop(ctx, size);
        this.renderMagicParticles(ctx, size);
        this.renderSpellCastEffect(ctx, size);
        
        // Render active spell effects
        this.renderChainLightningBolts(ctx);
        this.renderFallingMeteors(ctx);
        this.renderFrozenNovaEffects(ctx);
    }
    
    renderStoneBase(ctx, size) {
        const baseWidth = size * 0.7;
        const baseHeight = size * 0.25;
        
        // Stone foundation gradient
        const stoneGradient = ctx.createLinearGradient(
            this.x - baseWidth/2, this.y,
            this.x + baseWidth/2, this.y + baseHeight
        );
        stoneGradient.addColorStop(0, '#6B7280');
        stoneGradient.addColorStop(0.5, '#4B5563');
        stoneGradient.addColorStop(1, '#374151');
        
        // Draw octagonal base
        ctx.fillStyle = stoneGradient;
        ctx.beginPath();
        const sides = 8;
        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
            const x = this.x + Math.cos(angle) * baseWidth/2;
            const y = this.y + 20 + Math.sin(angle) * baseWidth/4;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Stone texture lines
        ctx.strokeStyle = '#1F2937';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const y = this.y + 10 + i * 8;
            ctx.beginPath();
            ctx.moveTo(this.x - baseWidth/2 + 10, y);
            ctx.lineTo(this.x + baseWidth/2 - 10, y);
            ctx.stroke();
        }
        
        // Corner stones
        const cornerPositions = [
            { x: -baseWidth/2 + 8, y: 15 },
            { x: baseWidth/2 - 8, y: 15 },
            { x: -baseWidth/2 + 12, y: 25 },
            { x: baseWidth/2 - 12, y: 25 }
        ];
        
        cornerPositions.forEach(corner => {
            ctx.fillStyle = '#9CA3AF';
            ctx.fillRect(this.x + corner.x - 4, this.y + corner.y - 4, 8, 8);
            ctx.strokeStyle = '#374151';
            ctx.strokeRect(this.x + corner.x - 4, this.y + corner.y - 4, 8, 8);
        });
    }
    
    renderWoodenSupports(ctx, size) {
        // Wooden beam supports around the spire base
        const beamPositions = [
            { x: -25, y: 0, angle: -0.3 },
            { x: 25, y: 0, angle: 0.3 },
            { x: -18, y: 5, angle: -0.15 },
            { x: 18, y: 5, angle: 0.15 }
        ];
        
        beamPositions.forEach(beam => {
            ctx.save();
            ctx.translate(this.x + beam.x, this.y + beam.y);
            ctx.rotate(beam.angle);
            
            // Wood beam
            const woodGradient = ctx.createLinearGradient(-3, -25, 3, 0);
            woodGradient.addColorStop(0, '#92400E');
            woodGradient.addColorStop(0.5, '#78350F');
            woodGradient.addColorStop(1, '#451A03');
            
            ctx.fillStyle = woodGradient;
            ctx.fillRect(-3, -25, 6, 30);
            
            // Wood grain
            ctx.strokeStyle = '#451A03';
            ctx.lineWidth = 1;
            for (let i = 0; i < 4; i++) {
                const y = -22 + i * 7;
                ctx.beginPath();
                ctx.moveTo(-2, y);
                ctx.lineTo(2, y + 2);
                ctx.stroke();
            }
            
            ctx.restore();
        });
        
        // Decorative iron bands
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 3;
        [-20, -5, 10].forEach(yOffset => {
            ctx.beginPath();
            ctx.arc(this.x, this.y + yOffset, 20, Math.PI * 0.8, Math.PI * 2.2);
            ctx.stroke();
        });
    }
    
    renderMainSpire(ctx, size) {
        const spireHeight = size * 0.6;
        const spireBaseWidth = size * 0.25;
        const spireTopWidth = size * 0.08;
        
        // Main stone spire body
        const spireGradient = ctx.createLinearGradient(
            this.x - spireBaseWidth/2, this.y - spireHeight,
            this.x + spireBaseWidth/2, this.y
        );
        spireGradient.addColorStop(0, '#9CA3AF');
        spireGradient.addColorStop(0.3, '#6B7280');
        spireGradient.addColorStop(0.7, '#4B5563');
        spireGradient.addColorStop(1, '#374151');
        
        ctx.fillStyle = spireGradient;
        ctx.beginPath();
        ctx.moveTo(this.x - spireBaseWidth/2, this.y - 10);
        ctx.lineTo(this.x - spireTopWidth/2, this.y - spireHeight + 20);
        ctx.lineTo(this.x + spireTopWidth/2, this.y - spireHeight + 20);
        ctx.lineTo(this.x + spireBaseWidth/2, this.y - 10);
        ctx.closePath();
        ctx.fill();
        
        // Stone block lines
        ctx.strokeStyle = '#1F2937';
        ctx.lineWidth = 1;
        for (let i = 1; i < 8; i++) {
            const t = i / 8;
            const y = this.y - 10 - (spireHeight - 30) * t;
            const width = spireBaseWidth - (spireBaseWidth - spireTopWidth) * t;
            ctx.beginPath();
            ctx.moveTo(this.x - width/2, y);
            ctx.lineTo(this.x + width/2, y);
            ctx.stroke();
        }
        
        // Magical window openings
        const windowPositions = [
            { y: -35, size: 6 },
            { y: -55, size: 5 },
            { y: -75, size: 4 }
        ];
        
        windowPositions.forEach(win => {
            // Window frame
            ctx.fillStyle = '#1F2937';
            ctx.beginPath();
            ctx.arc(this.x, this.y + win.y, win.size + 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Magical glow
            const windowGlow = ctx.createRadialGradient(
                this.x, this.y + win.y, 0,
                this.x, this.y + win.y, win.size * 2
            );
            windowGlow.addColorStop(0, `rgba(139, 92, 246, ${this.runeGlow})`);
            windowGlow.addColorStop(0.5, `rgba(99, 102, 241, ${this.runeGlow * 0.5})`);
            windowGlow.addColorStop(1, 'rgba(79, 70, 229, 0)');
            
            ctx.fillStyle = windowGlow;
            ctx.beginPath();
            ctx.arc(this.x, this.y + win.y, win.size * 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Window inner glow
            ctx.fillStyle = `rgba(167, 139, 250, ${this.runeGlow})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y + win.y, win.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Carved rune bands
        const runeBandY = [-25, -50, -70];
        runeBandY.forEach((yOffset, index) => {
            const bandWidth = spireBaseWidth - 5 - index * 3;
            
            ctx.strokeStyle = `rgba(139, 92, 246, ${this.runeGlow})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x - bandWidth/2 + 5, this.y + yOffset);
            ctx.lineTo(this.x + bandWidth/2 - 5, this.y + yOffset);
            ctx.stroke();
            
            // Rune symbols on band
            ctx.fillStyle = `rgba(167, 139, 250, ${this.runeGlow})`;
            ctx.font = '8px serif';
            ctx.textAlign = 'center';
            const symbols = ['◇', '✧', '❋'];
            ctx.fillText(symbols[index], this.x, this.y + yOffset + 3);
        });
    }
    
    renderFloatingRunes(ctx, size) {
        this.floatingRunes.forEach((rune, index) => {
            const floatY = Math.sin(this.animationTime * 2 + rune.floatOffset) * 5;
            const currentAngle = rune.angle + this.crystalRotation * 0.3;
            const x = this.x + Math.cos(currentAngle) * rune.radius;
            const y = this.y - 40 + Math.sin(currentAngle) * rune.radius * 0.3 + floatY;
            
            // Rune glow
            const runeGlow = ctx.createRadialGradient(x, y, 0, x, y, 12);
            runeGlow.addColorStop(0, `rgba(139, 92, 246, ${this.runeGlow * 0.5})`);
            runeGlow.addColorStop(1, 'rgba(139, 92, 246, 0)');
            ctx.fillStyle = runeGlow;
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.fill();
            
            // Rune symbol
            ctx.fillStyle = `rgba(255, 255, 255, ${this.runeGlow})`;
            ctx.font = 'bold 10px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(rune.symbol, x, y);
        });
    }
    
    renderCrystalTop(ctx, size) {
        const crystalY = this.y - size * 0.55;
        const crystalSize = 12;
        
        // Crystal base platform
        ctx.fillStyle = '#4B5563';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = this.x + Math.cos(angle) * 8;
            const y = crystalY + 15 + Math.sin(angle) * 4;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Main crystal
        const crystalPulse = 0.7 + 0.3 * Math.sin(this.animationTime * 3);
        
        // Crystal glow
        const crystalGlow = ctx.createRadialGradient(
            this.x, crystalY, 0,
            this.x, crystalY, crystalSize * 3
        );
        crystalGlow.addColorStop(0, `rgba(167, 139, 250, ${crystalPulse * 0.6})`);
        crystalGlow.addColorStop(0.5, `rgba(139, 92, 246, ${crystalPulse * 0.3})`);
        crystalGlow.addColorStop(1, 'rgba(99, 102, 241, 0)');
        ctx.fillStyle = crystalGlow;
        ctx.beginPath();
        ctx.arc(this.x, crystalY, crystalSize * 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Crystal body
        ctx.save();
        ctx.translate(this.x, crystalY);
        ctx.rotate(this.crystalRotation);
        
        const crystalGradient = ctx.createLinearGradient(-crystalSize, -crystalSize, crystalSize, crystalSize);
        crystalGradient.addColorStop(0, `rgba(196, 181, 253, ${crystalPulse})`);
        crystalGradient.addColorStop(0.5, `rgba(139, 92, 246, ${crystalPulse})`);
        crystalGradient.addColorStop(1, `rgba(99, 102, 241, ${crystalPulse})`);
        
        ctx.fillStyle = crystalGradient;
        ctx.beginPath();
        ctx.moveTo(0, -crystalSize);
        ctx.lineTo(crystalSize * 0.7, 0);
        ctx.lineTo(0, crystalSize);
        ctx.lineTo(-crystalSize * 0.7, 0);
        ctx.closePath();
        ctx.fill();
        
        // Crystal highlight
        ctx.fillStyle = `rgba(255, 255, 255, ${crystalPulse * 0.5})`;
        ctx.beginPath();
        ctx.moveTo(0, -crystalSize);
        ctx.lineTo(crystalSize * 0.3, -crystalSize * 0.3);
        ctx.lineTo(0, 0);
        ctx.lineTo(-crystalSize * 0.3, -crystalSize * 0.3);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
        
        // Energy beams from crystal (when spells are ready)
        const readySpells = Object.values(this.spells).filter(s => s.unlocked && s.currentCooldown === 0);
        if (readySpells.length > 0) {
            readySpells.forEach((spell, index) => {
                const beamAngle = this.animationTime * 2 + (index / readySpells.length) * Math.PI * 2;
                const beamLength = 15 + Math.sin(this.animationTime * 4 + index) * 5;
                
                ctx.strokeStyle = `rgba(167, 139, 250, ${0.3 + 0.2 * Math.sin(this.animationTime * 3 + index)})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.x, crystalY);
                ctx.lineTo(
                    this.x + Math.cos(beamAngle) * beamLength,
                    crystalY + Math.sin(beamAngle) * beamLength
                );
                ctx.stroke();
            });
        }
    }
    
    renderMagicParticles(ctx, size) {
        this.magicParticles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            ctx.fillStyle = particle.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    renderSpellCastEffect(ctx, size) {
        if (!this.spellCastEffect) return;
        
        const { spell, progress } = this.spellCastEffect;
        const crystalY = this.y - size * 0.55;
        
        // Expanding ring effect
        const ringRadius = progress * 100;
        const ringAlpha = 1 - progress;
        
        ctx.strokeStyle = `rgba(167, 139, 250, ${ringAlpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, crystalY, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Spell icon burst
        ctx.fillStyle = `rgba(255, 255, 255, ${ringAlpha})`;
        ctx.font = `${20 + progress * 20}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(spell.icon, this.x, crystalY - progress * 30);
    }
    
    // Create enhanced meteor strike effect with falling meteors
    createMeteorStrikeEffect(targetX, targetY, enemyCount) {
        // Create 3-5 meteors falling from above the target
        const meteorCount = Math.min(3 + Math.floor(enemyCount / 2), 5);
        const startY = targetY - 250;
        
        for (let i = 0; i < meteorCount; i++) {
            const offsetX = (Math.random() - 0.5) * 80;
            const delay = i * 0.1; // Stagger meteor arrivals
            
            this.fallingMeteors.push({
                startX: targetX + offsetX,
                startY: startY,
                x: targetX + offsetX,
                y: startY + delay * 100, // Start slightly lower if delayed
                vy: 400 + Math.random() * 100, // Fall speed
                life: 0.8,
                maxLife: 0.8,
                size: 12 + Math.random() * 6,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 10
            });
            
            // Add trail particles for meteor
            for (let j = 0; j < 15; j++) {
                const progress = j / 15;
                const trailX = targetX + offsetX + (Math.random() - 0.5) * 20;
                const trailY = startY + (j / 15) * (targetY - startY);
                
                this.magicParticles.push({
                    x: trailX,
                    y: trailY,
                    vx: (Math.random() - 0.5) * 30,
                    vy: 150 + Math.random() * 100,
                    life: 0.6,
                    maxLife: 0.6,
                    size: 0,
                    maxSize: 4 + Math.random() * 3,
                    color: progress < 0.5 ? 'rgba(255, 140, 0, ' : 'rgba(139, 69, 19, '
                });
            }
        }
    }
    
    // Create enhanced chain lightning effect
    createChainLightningEffect(targetX, targetY, chainTargets) {
        // Create multiple lightning bolts similar to Tempest spell
        const boltCount = Math.min(chainTargets || 5, 8);
        
        for (let b = 0; b < boltCount; b++) {
            const angle = (b / boltCount) * Math.PI * 2;
            const distance = 80 + Math.random() * 40;
            const endX = targetX + Math.cos(angle) * distance;
            const endY = targetY + Math.sin(angle) * distance;
            
            this.chainLightningBolts.push({
                startX: this.x,
                startY: this.y,
                endX: endX,
                endY: endY,
                life: 0.15,
                maxLife: 0.15,
                segments: this.generateLightningSegments(this.x, this.y, endX, endY),
                color: 'rgba(100, 200, 255, '
            });
        }
        
        // Add electrical particles around target
        for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            const speed = 100 + Math.random() * 100;
            
            this.magicParticles.push({
                x: targetX,
                y: targetY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 50,
                life: 0.8,
                maxLife: 0.8,
                size: 0,
                maxSize: 3 + Math.random() * 2,
                color: 'rgba(100, 200, 255, '
            });
        }
    }
    
    // Create enhanced arcane blast effect
    createArcaneBlastEffect(targetX, targetY) {
        // Expanding purple/blue rings
        for (let ring = 0; ring < 3; ring++) {
            const delay = ring * 0.1;
            
            this.magicParticles.push({
                x: targetX,
                y: targetY,
                vx: 0,
                vy: 0,
                life: 0.5,
                maxLife: 0.5,
                startDelay: delay,
                size: 0,
                maxSize: 0, // Will be rendered as rings instead
                color: 'rgba(138, 43, 226, ',
                ringIndex: ring
            });
        }
        
        // Radial energy particles
        for (let i = 0; i < 40; i++) {
            const angle = (i / 40) * Math.PI * 2;
            const speed = 150 + Math.random() * 100;
            
            this.magicParticles.push({
                x: targetX,
                y: targetY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.7,
                maxLife: 0.7,
                size: 0,
                maxSize: 4 + Math.random() * 2,
                color: i % 2 === 0 ? 'rgba(167, 139, 250, ' : 'rgba(99, 102, 241, '
            });
        }
        
        // Central burst particles
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            
            this.magicParticles.push({
                x: targetX,
                y: targetY,
                vx: Math.cos(angle) * 200,
                vy: Math.sin(angle) * 200,
                life: 0.4,
                maxLife: 0.4,
                size: 0,
                maxSize: 6,
                color: 'rgba(255, 255, 255, '
            });
        }
    }
    
    // Create frozen nova effect with blue hue and ice effects
    createFrozenNovaEffect(targetX, targetY, radius, duration) {
        // Store the frozen nova effect for persistent rendering
        this.frozenNovaEffects.push({
            x: targetX,
            y: targetY,
            radius: radius,
            life: duration,
            maxLife: duration,
            icicles: []
        });
        
        // Generate icicles around the frozen area
        const icicleCount = 12 + Math.floor(radius / 30);
        const lastEffect = this.frozenNovaEffects[this.frozenNovaEffects.length - 1];
        
        for (let i = 0; i < icicleCount; i++) {
            const angle = (i / icicleCount) * Math.PI * 2;
            const distance = radius * (0.6 + Math.random() * 0.4);
            
            lastEffect.icicles.push({
                x: targetX + Math.cos(angle) * distance,
                y: targetY + Math.sin(angle) * distance,
                angle: angle,
                height: 20 + Math.random() * 15,
                width: 4 + Math.random() * 2,
                rotation: (Math.random() - 0.5) * 0.2
            });
        }
        
        // Add frost particle burst
        for (let i = 0; i < 50; i++) {
            const angle = (i / 50) * Math.PI * 2;
            const speed = 80 + Math.random() * 60;
            
            this.magicParticles.push({
                x: targetX,
                y: targetY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: duration * 0.6,
                maxLife: duration * 0.6,
                size: 0,
                maxSize: 3 + Math.random() * 2,
                color: 'rgba(173, 216, 230, ' // Light blue
            });
        }
    }
    
    // Generate jagged lightning segments
    generateLightningSegments(startX, startY, endX, endY) {
        const segments = [];
        const segmentCount = 8;
        const variance = 15;
        
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
    
    // Spell casting methods
    castSpell(spellId, enemies, targetX, targetY) {
        const spell = this.spells[spellId];
        if (!spell || !spell.unlocked || spell.currentCooldown > 0) {
            return null;
        }
        
        spell.currentCooldown = spell.cooldown;
        
        // Trigger visual effect
        this.spellCastEffect = {
            spell: spell,
            progress: 0
        };
        
        // Create enhanced spell effects based on spell type
        if (spellId === 'meteorStrike') {
            this.createMeteorStrikeEffect(targetX, targetY, enemies ? enemies.length : 0);
        } else if (spellId === 'chainLightning') {
            this.createChainLightningEffect(targetX, targetY, spell.chainCount);
        } else if (spellId === 'arcaneBlast') {
            this.createArcaneBlastEffect(targetX, targetY);
        } else if (spellId === 'frostNova') {
            this.createFrozenNovaEffect(targetX, targetY, spell.radius, spell.freezeDuration);
        }
        
        return {
            spellId: spellId,
            spell: spell,
            targetX: targetX,
            targetY: targetY
        };
    }
    
    getSpellInfo(spellId) {
        return this.spells[spellId] || null;
    }
    
    getAvailableSpells() {
        return Object.values(this.spells).filter(spell => spell.unlocked);
    }
    
    getAllSpells() {
        return Object.values(this.spells);
    }
    
    onClick() {
        this.isSelected = true;
        
        // Get academy reference if available
        let academy = this.academy;
        
        return {
            type: 'superweapon_menu',
            building: this,
            academy: academy,
            spells: this.getAllSpells(),
            labLevel: this.labLevel,
            maxLabLevel: this.maxLabLevel
        };
    }
    
    setAcademy(academy) {
        this.academy = academy;
    }
    
    getLabUpgradeOption() {
        const nextLevel = this.labLevel + 1;
        let description = '';
        let nextUnlock = '';
        let cost = 0;
        
        // Costs increase with level
        const baseCost = 1000;
        cost = baseCost + (this.labLevel - 1) * 500;
        
        // Dynamic descriptions based on level
        switch(nextLevel) {
            case 2:
                description = 'Unlock Combination Tower Power-up Upgrades and Frozen Nova spell.';
                nextUnlock = 'Unlocks: Frozen Nova + Combination Tower upgrades';
                break;
            case 3:
                description = 'Unlock Meteor Strike spell. Reduce all spell cooldowns by 20%.';
                nextUnlock = 'Unlocks: Meteor Strike + 20% cooldown reduction';
                break;
            case 4:
                description = 'Unlock Chain Lightning spell + Main Spell Diamond Upgrades (0-100).';
                nextUnlock = 'Unlocks: Chain Lightning + Main Spell upgrades with diamonds';
                break;
            default:
                description = `Lab is at maximum level.`;
                nextUnlock = `No further upgrades available`;
        }
        
        return {
            id: 'lab_upgrade',
            name: `Lab Level ${nextLevel}`,
            description: description,
            nextUnlock: nextUnlock,
            level: this.labLevel,
            maxLevel: this.maxLabLevel,
            cost: cost,
            diamondCost: 1,  // Each level upgrade requires 1 diamond
            icon: '🗼'
        };
    }
    
    purchaseLabUpgrade(gameState) {
        // Check if already at max level
        if (this.labLevel >= this.maxLabLevel) {
            console.error('SuperWeaponLab: Already at maximum level');
            return false;
        }
        
        const upgradeOption = this.getLabUpgradeOption();
        
        // Check gold cost
        if (!gameState.canAfford(upgradeOption.cost)) {
            console.error('SuperWeaponLab: Cannot afford lab upgrade');
            return false;
        }
        
        // Check diamond cost - each level requires 1 diamond
        if (this.academy) {
            const diamondCost = 1;
            if ((this.academy.gems.diamond || 0) < diamondCost) {
                console.error('SuperWeaponLab: Insufficient diamonds for upgrade');
                return false;
            }
        }
        
        // Deduct gold
        gameState.spend(upgradeOption.cost);
        
        // Deduct diamond
        if (this.academy) {
            this.academy.gems.diamond -= 1;
        }
        
        this.labLevel++;
        
        // Unlock spells based on new level (max lab level is 4)
        if (this.labLevel >= 2) {
            this.spells.frostNova.unlocked = true;
        }
        if (this.labLevel >= 3) {
            this.spells.meteorStrike.unlocked = true;
        }
        if (this.labLevel >= 4) {
            this.spells.chainLightning.unlocked = true;
        }
        
        return true;
    }
    
    // Upgrade main spell using diamonds (only available at level 4+)
    upgradeMainSpell(spellId, diamondCost) {
        if (this.labLevel < 4) {
            console.error('SuperWeaponLab: Main spell upgrades only available at level 4+');
            return false;
        }
        
        const spell = this.spells[spellId];
        if (!spell) {
            console.error(`SuperWeaponLab: Spell ${spellId} not found`);
            return false;
        }
        
        if (spell.upgradeLevel >= spell.maxUpgradeLevel) {
            console.error(`SuperWeaponLab: ${spell.name} already at max upgrade level`);
            return false;
        }
        
        // Check if we have the diamonds
        if (this.academy) {
            if ((this.academy.gems.diamond || 0) < diamondCost) {
                console.error('SuperWeaponLab: Insufficient diamonds for spell upgrade');
                return false;
            }
            
            // Deduct diamonds
            this.academy.gems.diamond -= diamondCost;
        } else {
            console.error('SuperWeaponLab: No academy reference for spell upgrade');
            return false;
        }
        
        // Increase upgrade level
        spell.upgradeLevel++;
        
        // Apply upgrade effects - improve spell abilities, NOT cooldown
        if (spell.damage) spell.damage *= 1.15;
        if (spell.freezeDuration) spell.freezeDuration += 0.5;
        if (spell.burnDamage) spell.burnDamage += 2;
        if (spell.chainCount) spell.chainCount += 1;
        if (spell.radius) spell.radius += 10;
        
        return true;
    }
    
    // Upgrade combination spell using gold (anytime after lab level 2+)
    upgradeComboSpell(spellId, goldCost) {
        if (this.labLevel < 2) {
            console.error('SuperWeaponLab: Combination spell upgrades only available at level 2+');
            return false;
        }
        
        const spell = this.combinationSpells.find(s => s.id === spellId);
        if (!spell) {
            console.error(`SuperWeaponLab: Combination spell ${spellId} not found`);
            return false;
        }
        
        if (spell.upgradeLevel >= spell.maxUpgradeLevel) {
            console.error(`SuperWeaponLab: ${spell.name} already at max upgrade level`);
            return false;
        }
        
        // Return false if this is being called elsewhere - need to modify to accept gameState
        // For now this is a placeholder
        return false;
    }
    
    unlockSpell(spellId, gameState) {
        
        const spell = this.spells[spellId];
        if (!spell) {
            console.error(`SuperWeaponLab: Spell ${spellId} not found!`);
            return false;
        }
        
        if (spell.unlocked) {
            console.error(`SuperWeaponLab: Spell ${spellId} already unlocked`);
            return false;
        }
        
        if (!gameState.canAfford(spell.unlockCost)) {
            console.error(`SuperWeaponLab: Cannot afford to unlock ${spellId}`);
            return false;
        }
        
        gameState.spend(spell.unlockCost);
        spell.unlocked = true;
        spell.level = 1;
        spell.currentCooldown = 0;
        
        return true;
    }
    
    upgradeSpell(spellId, gameState) {
        
        const spell = this.spells[spellId];
        if (!spell) {
            console.error(`SuperWeaponLab: Spell ${spellId} not found!`);
            return false;
        }
        
        if (!spell.unlocked) {
            console.error(`SuperWeaponLab: Spell ${spellId} not unlocked`);
            return false;
        }
        
        if (spell.level >= spell.maxLevel) {
            console.error(`SuperWeaponLab: Spell ${spellId} already at max level`);
            return false;
        }
        
        const cost = spell.upgradeCost * spell.level;
        
        if (!gameState.canAfford(cost)) {
            console.error(`SuperWeaponLab: Cannot afford to upgrade ${spellId}`);
            return false;
        }
        
        gameState.spend(cost);
        spell.level++;
        
        // Apply upgrade effects - improve spell abilities, NOT cooldown
        if (spell.damage) spell.damage *= 1.15;
        if (spell.freezeDuration) spell.freezeDuration += 0.5;
        if (spell.burnDamage) spell.burnDamage += 2;
        if (spell.chainCount) spell.chainCount += 1;
        if (spell.radius) spell.radius += 10;
        
        return true;
    }
    
    deselect() {
        this.isSelected = false;
    }
    
    applyEffect(buildingManager) {
        buildingManager.superWeaponUnlocked = true;
        // Unlock the base arcane blast spell when the lab is built
        this.spells.arcaneBlast.unlocked = true;
    }
    
    /**
     * Get combination tower upgrade options when lab is level 2+
     * These allow empowering the combination tower with elemental effects
     */
    getCombinationUpgradeOptions(academy) {
        const options = [];
        
        // Only show combination upgrades if lab is level 2+
        if (this.labLevel >= 2) {
            // Return combination spell upgrade options (max 5 levels each)
            this.combinationSpells.forEach(spell => {
                const goldCost = spell.upgragesCost; // Gold cost per upgrade
                const canAfford = spell.upgradeLevel < spell.maxUpgradeLevel;
                
                options.push({
                    id: spell.id,
                    name: spell.name,
                    icon: spell.icon,
                    description: spell.description,
                    upgradeLevel: spell.upgradeLevel,
                    maxUpgradeLevel: spell.maxUpgradeLevel,
                    goldCost: goldCost,
                    canAfford: canAfford,
                    type: 'comboSpellUpgrade'
                });
            });
        }
        
        return options;
    }
    
    // Render falling meteors
    renderFallingMeteors(ctx) {
        this.fallingMeteors.forEach(meteor => {
            const alpha = meteor.life / meteor.maxLife;
            
            ctx.save();
            ctx.translate(meteor.x, meteor.y);
            ctx.rotate(meteor.rotation);
            
            // Meteor glow
            const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, meteor.size * 2);
            glowGradient.addColorStop(0, `rgba(255, 140, 0, ${alpha * 0.6})`);
            glowGradient.addColorStop(0.5, `rgba(255, 69, 0, ${alpha * 0.3})`);
            glowGradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(0, 0, meteor.size * 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Meteor body - rocky texture
            ctx.fillStyle = `rgba(139, 69, 19, ${alpha})`;
            ctx.beginPath();
            ctx.arc(0, 0, meteor.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Rocky details
            ctx.fillStyle = `rgba(160, 82, 45, ${alpha * 0.7})`;
            for (let i = 0; i < 3; i++) {
                const angle = (i / 3) * Math.PI * 2;
                ctx.beginPath();
                ctx.arc(Math.cos(angle) * meteor.size * 0.4, Math.sin(angle) * meteor.size * 0.4, meteor.size * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Impact glow
            ctx.shadowColor = `rgba(255, 100, 0, ${alpha})`;
            ctx.shadowBlur = 15;
            ctx.strokeStyle = `rgba(255, 140, 0, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, meteor.size, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
            
            ctx.restore();
        });
    }
    
    // Render chain lightning bolts
    renderChainLightningBolts(ctx) {
        this.chainLightningBolts.forEach(bolt => {
            const alpha = bolt.life / bolt.maxLife;
            
            // Draw jagged lightning bolts
            ctx.strokeStyle = 'rgba(100, 200, 255, ' + alpha + ')';
            ctx.lineWidth = 3;
            ctx.shadowColor = `rgba(100, 200, 255, ${alpha * 0.8})`;
            ctx.shadowBlur = 12;
            
            bolt.segments.forEach(segment => {
                ctx.beginPath();
                ctx.moveTo(segment.fromX, segment.fromY);
                ctx.lineTo(segment.toX, segment.toY);
                ctx.stroke();
            });
            
            // Draw bright core
            ctx.strokeStyle = 'rgba(150, 220, 255, ' + alpha + ')';
            ctx.lineWidth = 1;
            bolt.segments.forEach(segment => {
                ctx.beginPath();
                ctx.moveTo(segment.fromX, segment.fromY);
                ctx.lineTo(segment.toX, segment.toY);
                ctx.stroke();
            });
            
            ctx.shadowBlur = 0;
        });
    }
    
    // Render frozen nova effects
    renderFrozenNovaEffects(ctx) {
        this.frozenNovaEffects.forEach(effect => {
            const alpha = effect.life / effect.maxLife;
            
            // Frozen area blue hue
            const novaGradient = ctx.createRadialGradient(
                effect.x, effect.y, 0,
                effect.x, effect.y, effect.radius
            );
            novaGradient.addColorStop(0, `rgba(100, 200, 255, ${alpha * 0.3})`);
            novaGradient.addColorStop(0.5, `rgba(64, 164, 223, ${alpha * 0.2})`);
            novaGradient.addColorStop(1, `rgba(30, 144, 255, 0)`);
            
            ctx.fillStyle = novaGradient;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Frost edge glow
            ctx.strokeStyle = `rgba(173, 216, 230, ${alpha * 0.6})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Render icicles
            effect.icicles.forEach(icicle => {
                ctx.save();
                ctx.translate(icicle.x, icicle.y);
                ctx.rotate(icicle.rotation);
                
                // Icicle glow
                const icicleGlow = ctx.createLinearGradient(0, 0, 0, icicle.height);
                icicleGlow.addColorStop(0, `rgba(173, 216, 230, ${alpha * 0.8})`);
                icicleGlow.addColorStop(0.5, `rgba(100, 200, 255, ${alpha * 0.6})`);
                icicleGlow.addColorStop(1, `rgba(30, 144, 255, ${alpha * 0.4})`);
                
                ctx.fillStyle = icicleGlow;
                ctx.beginPath();
                ctx.moveTo(-icicle.width / 2, 0);
                ctx.lineTo(icicle.width / 2, 0);
                ctx.lineTo(0, icicle.height);
                ctx.closePath();
                ctx.fill();
                
                // Icicle highlight
                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-icicle.width / 4, icicle.height * 0.2);
                ctx.lineTo(0, icicle.height);
                ctx.stroke();
                
                ctx.restore();
            });
        });
    }
    
    static getInfo() {
        return {
            name: 'Super Weapon Lab',
            description: 'Mystical spire that channels powerful spells against enemies. Costs 1000 gold + 5 diamonds.',
            effect: 'Unlocks devastating area spells + Arcane Blast spell at level 1',
            size: '4x4',
            cost: 1000, // Base gold cost; also requires 5 diamonds
            diamondCost: 5
        };
    }
}
