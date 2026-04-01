import { Building } from './Building.js';

export class SuperWeaponLab extends Building {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY, 4);
        this.isSelected = false;
        this.academy = null; // Reference to Magic Academy
        this.unlockSystem = null; // Reference to UnlockSystem for building unlocks
        this.upgradeSystem = null; // Reference to UpgradeSystem for marketplace upgrades
        
        // Building upgrade system - starts at level 1 on build
        this.labLevel = 1;
        this.maxLabLevel = 4;
        
        // Spell system with individual upgrade levels (0-100 using diamonds)
        this.spells = {
            arcaneBlast: {
                id: 'arcaneBlast',
                name: 'Arcane Blast',
                icon: '<svg viewBox="0 0 20 20" width="16" height="16" xmlns="http://www.w3.org/2000/svg"><polygon points="10,1 11.3,6.8 16.4,3.6 13.2,8.7 19,10 13.2,11.3 16.4,16.4 11.3,13.2 10,19 8.7,13.2 3.6,16.4 6.8,11.3 1,10 6.8,8.7 3.6,3.6 8.7,6.8" fill="#A855F7"/><circle cx="10" cy="10" r="2.5" fill="white" opacity="0.9"/></svg>',
                description: 'Deals massive arcane damage to all enemies in radius (classless magic, not elemental)',
                baseLevel: 1,  // Unlocked at lab level 1
                upgradeLevel: 0,  // 0-50 using diamonds (at lab level 4+)
                maxUpgradeLevel: 50,
                damage: 150,
                radius: 120,
                cooldown: 30,
                currentCooldown: 0,
                unlocked: true
            },
            frostNova: {
                id: 'frostNova',
                name: 'Frozen Nova',
                icon: '<svg viewBox="0 0 20 20" width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#60D5FA" stroke-width="1.5" stroke-linecap="round"><line x1="10" y1="2" x2="10" y2="18"/><line x1="3.1" y1="14" x2="16.9" y2="6"/><line x1="3.1" y1="6" x2="16.9" y2="14"/><line x1="10" y1="4.5" x2="8" y2="7"/><line x1="10" y1="4.5" x2="12" y2="7"/><line x1="10" y1="15.5" x2="8" y2="13"/><line x1="10" y1="15.5" x2="12" y2="13"/><circle cx="10" cy="10" r="2" fill="#38BDF8" stroke="none"/></svg>',
                description: 'Freezes all enemies for a duration and deals ice damage',
                baseLevel: 2,  // Unlocked at lab level 2
                upgradeLevel: 0,
                maxUpgradeLevel: 50,
                damage: 25,
                freezeDuration: 3,
                radius: 150,
                cooldown: 45,
                currentCooldown: 0,
                unlocked: false
            },
            meteorStrike: {
                id: 'meteorStrike',
                name: 'Meteor Strike',
                icon: '<svg viewBox="0 0 20 20" width="16" height="16" xmlns="http://www.w3.org/2000/svg"><circle cx="13" cy="13" r="4" fill="#EF4444"/><line x1="10" y1="10" x2="5" y2="5" stroke="#F97316" stroke-width="2" stroke-linecap="round"/><line x1="9" y1="11" x2="3" y2="8" stroke="#FBBF24" stroke-width="1.5" stroke-linecap="round"/><line x1="11" y1="9" x2="8" y2="3" stroke="#FBBF24" stroke-width="1.5" stroke-linecap="round"/></svg>',
                description: 'Calls down meteors dealing fire damage that devastates enemies',
                baseLevel: 3,  // Unlocked at lab level 3
                upgradeLevel: 0,
                maxUpgradeLevel: 50,
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
                icon: '<svg viewBox="0 0 20 20" width="16" height="16" xmlns="http://www.w3.org/2000/svg"><polygon points="12,1 5,11 10,11 8,19 15,9 10,9" fill="#FDE047" stroke="#CA8A04" stroke-width="0.8" stroke-linejoin="round"/></svg>',
                description: 'Electricity that jumps between enemies',
                baseLevel: 4,  // Unlocked at lab level 4
                upgradeLevel: 0,
                maxUpgradeLevel: 50,
                damage: 80,
                chainCount: 5,
                cooldown: 25,
                currentCooldown: 0,
                unlocked: false
            }
        };
        
        // Combination spells system - max 5 upgrade levels per spell, uses elemental gems
        this.combinationSpells = [
            {
                id: 'steam',
                name: 'Steam',
                icon: '<svg viewBox="0 0 20 20" width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" stroke-width="1.8" stroke-linecap="round"><path d="M7 19 Q5 15.5 7 12.5 Q9 9.5 7 6.5 Q5 3.5 7 1" stroke="#60A5FA"/><path d="M13 19 Q11 15.5 13 12.5 Q15 9.5 13 6.5 Q11 3.5 13 1" stroke="#F97316"/></svg>',
                description: 'Fire + Water: Burn + Slow',
                upgradeLevel: 0,  // 0-5 upgrades
                maxUpgradeLevel: 5,
                gems: { fire: 1, water: 1 }  // Required gems for each upgrade level
            },
            {
                id: 'magma',
                name: 'Magma',
                icon: '<svg viewBox="0 0 20 20" width="16" height="16" xmlns="http://www.w3.org/2000/svg"><path d="M10 1 Q15.5 6 15.5 11.5 Q15.5 17.5 10 19 Q4.5 17.5 4.5 11.5 Q4.5 6 10 1Z" fill="#EF4444"/><path d="M10 5 Q13 8.5 13 12 Q13 15.5 10 17 Q7 15.5 7 12 Q7 8.5 10 5Z" fill="#FBBF24" opacity="0.7"/></svg>',
                description: 'Fire + Earth: Burn + Piercing',
                upgradeLevel: 0,
                maxUpgradeLevel: 5,
                gems: { fire: 1, earth: 1 }
            },
            {
                id: 'tempest',
                name: 'Tempest',
                icon: '<svg viewBox="0 0 20 20" width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#60D5FA" stroke-linecap="round" stroke-width="2"><path d="M10 10 Q13 5 17 8 Q20 12 16 15 Q12 18 8 16 Q4 14 4 10 Q4 6 8 3 Q13 0 18 4"/><circle cx="10" cy="10" r="1.5" fill="#7DD3FC" stroke="none"/></svg>',
                description: 'Air + Water: Chain + Slow',
                upgradeLevel: 0,
                maxUpgradeLevel: 5,
                gems: { air: 1, water: 1 }
            },
            {
                id: 'meteor',
                name: 'Meteor',
                icon: '<svg viewBox="0 0 20 20" width="16" height="16" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="3.5" fill="#F97316"/><circle cx="3" cy="5" r="1.5" fill="#78716C"/><circle cx="17" cy="5" r="1.5" fill="#78716C"/><circle cx="3" cy="15" r="1.5" fill="#78716C"/><circle cx="17" cy="15" r="1.5" fill="#78716C"/><line x1="6.5" y1="7" x2="7" y2="8" stroke="#78716C" stroke-width="1.2" stroke-linecap="round"/><line x1="13.5" y1="7" x2="13" y2="8" stroke="#78716C" stroke-width="1.2" stroke-linecap="round"/><line x1="6.5" y1="13" x2="7" y2="12" stroke="#78716C" stroke-width="1.2" stroke-linecap="round"/><line x1="13.5" y1="13" x2="13" y2="12" stroke="#78716C" stroke-width="1.2" stroke-linecap="round"/></svg>',
                description: 'Air + Earth: Chain + Piercing',
                upgradeLevel: 0,
                maxUpgradeLevel: 5,
                gems: { air: 1, earth: 1 }
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
        
        // Synchronize spell states based on current lab level
        this.syncSpellUnlocks();
    }
    
    // Synchronize spell unlock states based on current lab level
    syncSpellUnlocks() {
        // Unlock spells based on lab level
        if (this.labLevel >= 2) {
            this.spells.frostNova.unlocked = true;
        }
        if (this.labLevel >= 3) {
            this.spells.meteorStrike.unlocked = true;
        }
        if (this.labLevel >= 4) {
            this.spells.chainLightning.unlocked = true;
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
        
        // Update particles (compact in-place)
        let mpWrite = 0;
        for (let i = 0; i < this.magicParticles.length; i++) {
            const particle = this.magicParticles[i];
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            particle.size = Math.max(0, particle.size * (particle.life / particle.maxLife));
            if (particle.life > 0) {
                this.magicParticles[mpWrite++] = particle;
            }
        }
        this.magicParticles.length = mpWrite;
        
        // Update falling meteors (compact in-place)
        let mtWrite = 0;
        for (let i = 0; i < this.fallingMeteors.length; i++) {
            const meteor = this.fallingMeteors[i];
            meteor.y += meteor.vy * deltaTime;
            meteor.life -= deltaTime;
            if (meteor.life > 0) {
                this.fallingMeteors[mtWrite++] = meteor;
            }
        }
        this.fallingMeteors.length = mtWrite;
        
        // Update frozen nova effects (compact in-place)
        let fnWrite = 0;
        for (let i = 0; i < this.frozenNovaEffects.length; i++) {
            const effect = this.frozenNovaEffects[i];
            effect.life -= deltaTime;
            if (effect.life > 0) {
                this.frozenNovaEffects[fnWrite++] = effect;
            }
        }
        this.frozenNovaEffects.length = fnWrite;
        
        // Update chain lightning bolts (compact in-place)
        let clWrite = 0;
        for (let i = 0; i < this.chainLightningBolts.length; i++) {
            const bolt = this.chainLightningBolts[i];
            bolt.life -= deltaTime;
            if (bolt.life > 0) {
                this.chainLightningBolts[clWrite++] = bolt;
            }
        }
        this.chainLightningBolts.length = clWrite;
        
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
        const canvasSymbols = {
            arcaneBlast: '✦', frostNova: '✲', meteorStrike: '●',
            chainLightning: '⚡', steam: '≋', magma: '◉', tempest: '◈', meteor: '✦'
        };
        ctx.fillStyle = `rgba(255, 255, 255, ${ringAlpha})`;
        ctx.font = `${20 + progress * 20}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(canvasSymbols[spell.id] || '✦', this.x, crystalY - progress * 30);
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
    
    // Create enhanced chain lightning effect with Tempest-like visual
    createChainLightningEffect(targetX, targetY, chainTargets) {
        // Create multiple lightning bolts similar to Tempest spell - jagged look
        const boltCount = Math.min(chainTargets || 5, 6);
        
        for (let b = 0; b < boltCount; b++) {
            const angle = (b / boltCount) * Math.PI * 2;
            const distance = 80 + Math.random() * 40;
            const offsetX = Math.cos(angle) * distance * 0.5;
            const endX = targetX + Math.cos(angle) * distance;
            const endY = targetY + Math.sin(angle) * distance;
            
            this.chainLightningBolts.push({
                startX: this.x,
                startY: this.y,
                endX: endX,
                endY: endY,
                life: 0.3,
                maxLife: 0.3,
                segments: this.generateLightningSegments(this.x, this.y, endX, endY),
                color: 'rgba(100, 200, 255, ',
                isTempest: true  // Use jagged rendering style
            });
        }
        
        // Add electrical particles around target - reduced count for performance
        for (let i = 0; i < 15; i++) {
            const angle = (i / 15) * Math.PI * 2;
            const speed = 80 + Math.random() * 80;
            
            this.magicParticles.push({
                x: targetX,
                y: targetY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 30,
                life: 0.6,
                maxLife: 0.6,
                size: 0,
                maxSize: 3 + Math.random() * 2,
                color: 'rgba(150, 220, 255, '
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
    
    // Generate jagged lightning segments - optimized for performance
    generateLightningSegments(startX, startY, endX, endY) {
        const segments = [];
        const segmentCount = 6;  // Reduced from 8 for better performance
        const variance = 12;     // Reduced for less random calculation
        
        let currentX = startX;
        let currentY = startY;
        
        for (let i = 1; i <= segmentCount; i++) {
            const t = i / segmentCount;
            let targetX = startX + (endX - startX) * t;
            let targetY = startY + (endY - startY) * t;
            
            // Only add variance to non-final segments
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
                description = 'Unlock Combination Tower Power-up Upgrades, Frozen Nova spell, and Diamond Press building.';
                nextUnlock = 'Unlocks: Frozen Nova + Combination Tower upgrades + Diamond Press building';
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
            icon: ''
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
        
        // Synchronize spell unlocks based on new level
        this.syncSpellUnlocks();
        
        // Special unlock behaviors for specific levels
        if (this.labLevel === 2) {
            // Unlock Diamond Press building via UnlockSystem if available
            if (this.unlockSystem) {
                this.unlockSystem.onSuperweaponLabLevelTwo();
            }
            // Also unlock the diamond-press-unlock upgrade
            if (this.upgradeSystem) {
                this.upgradeSystem.purchaseUpgrade('diamond-press-unlock');
            }
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
        
        // Apply balanced upgrade effects per level (max level 50)
        // Flat increments ensure steady, non-exponential growth
        switch(spell.id) {
            case 'arcaneBlast':
                spell.damage += 5;          // +5 dmg/level → +250 at max (total 400)
                spell.radius += 2;          // +2 radius/level → +100 at max (total 220)
                break;
            case 'frostNova':
                spell.damage += 2;          // +2 ice dmg/level → +100 at max (total 125)
                spell.freezeDuration += 0.1; // +0.1s/level → +5s at max (total 8s)
                spell.radius += 2;          // +2 radius/level → +100 at max (total 250)
                break;
            case 'meteorStrike':
                spell.damage += 7;          // +7 fire dmg/level → +350 at max (total 550)
                spell.burnDamage += 0.5;    // +0.5/level → +25 at max (total 35/s)
                spell.radius += 2;          // +2 radius/level → +100 at max (total ~180)
                break;
            case 'chainLightning':
                spell.damage += 3;          // +3 elec dmg/level → +150 at max (total 230)
                spell.radius += 2;          // +2 radius/level → +100 at max
                // +1 chain target every 5 levels → +10 chains at max (total 15)
                if (spell.upgradeLevel % 5 === 0) {
                    spell.chainCount += 1;
                }
                break;
        }
        
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
        
        // Apply balanced upgrade effects (matching upgradeMainSpell formula)
        switch(spell.id) {
            case 'arcaneBlast':
                spell.damage += 5;
                spell.radius += 2;
                break;
            case 'frostNova':
                spell.damage += 2;
                spell.freezeDuration += 0.1;
                spell.radius += 2;
                break;
            case 'meteorStrike':
                spell.damage += 7;
                spell.burnDamage += 0.5;
                spell.radius += 2;
                break;
            case 'chainLightning':
                spell.damage += 3;
                spell.radius += 2;
                if (spell.level % 5 === 0) spell.chainCount += 1;
                break;
        }
        
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
                // Calculate gem costs - increases with each upgrade level
                const gemsRequired = {};
                const nextLevel = spell.upgradeLevel + 1;
                
                // Gems required scale with upgrade level (1, 2, 3, 4, 5)
                for (const [gemType, baseCost] of Object.entries(spell.gems)) {
                    gemsRequired[gemType] = baseCost * nextLevel;
                }
                
                // Check if player can afford this upgrade
                // Use this.academy as fallback if academy parameter is not provided
                const academyReference = academy || this.academy;
                let canAfford = spell.upgradeLevel < spell.maxUpgradeLevel;
                if (canAfford && academyReference) {
                    for (const [gemType, cost] of Object.entries(gemsRequired)) {
                        if ((academyReference.gems[gemType] || 0) < cost) {
                            canAfford = false;
                            break;
                        }
                    }
                } else if (spell.upgradeLevel >= spell.maxUpgradeLevel) {
                    canAfford = false;
                }
                
                options.push({
                    id: spell.id,
                    name: spell.name,
                    icon: spell.icon,
                    description: spell.description,
                    upgradeLevel: spell.upgradeLevel,
                    maxUpgradeLevel: spell.maxUpgradeLevel,
                    gemsRequired: gemsRequired,
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
    
    // Render chain lightning bolts - using Tempest-style jagged look
    renderChainLightningBolts(ctx) {
        this.chainLightningBolts.forEach(bolt => {
            const alpha = bolt.life / bolt.maxLife;
            
            if (bolt.isTempest) {
                // Render tempest-style jagged lightning (matching CombinationTower)
                ctx.strokeStyle = 'rgba(100, 200, 255, ' + alpha + ')';
                ctx.lineWidth = 3;
                
                bolt.segments.forEach(segment => {
                    ctx.beginPath();
                    ctx.moveTo(segment.fromX, segment.fromY);
                    ctx.lineTo(segment.toX, segment.toY);
                    ctx.stroke();
                });
                
                // Inner glow stroke - thin inner core
                ctx.strokeStyle = 'rgba(200, 240, 255, ' + (alpha * 0.7) + ')';
                ctx.lineWidth = 1;
                bolt.segments.forEach(segment => {
                    ctx.beginPath();
                    ctx.moveTo(segment.fromX, segment.fromY);
                    ctx.lineTo(segment.toX, segment.toY);
                    ctx.stroke();
                });
            }
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
