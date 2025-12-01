import { Building } from './Building.js';

export class SuperWeaponLab extends Building {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY, 4);
        this.isSelected = false;
        
        // Building upgrade system
        this.labLevel = 1;
        this.maxLabLevel = 3;
        
        // Spell system with cooldowns
        this.spells = {
            arcaneBlast: {
                id: 'arcaneBlast',
                name: 'Arcane Blast',
                icon: '💫',
                description: 'Deals massive damage to all enemies in a large area',
                damage: 150,
                radius: 120,
                cooldown: 30,
                currentCooldown: 0,
                unlocked: true,
                level: 1,
                maxLevel: 5,
                upgradeCost: 300
            },
            frostNova: {
                id: 'frostNova',
                name: 'Frost Nova',
                icon: '❄️',
                description: 'Freezes all enemies for a duration',
                freezeDuration: 3,
                radius: 150,
                cooldown: 45,
                currentCooldown: 0,
                unlocked: false,
                level: 0,
                maxLevel: 5,
                upgradeCost: 400,
                unlockCost: 500
            },
            meteorStrike: {
                id: 'meteorStrike',
                name: 'Meteor Strike',
                icon: '☄️',
                description: 'Calls down meteors that devastate enemies',
                damage: 200,
                burnDamage: 10,
                burnDuration: 5,
                cooldown: 60,
                currentCooldown: 0,
                unlocked: false,
                level: 0,
                maxLevel: 5,
                upgradeCost: 500,
                unlockCost: 750
            },
            chainLightning: {
                id: 'chainLightning',
                name: 'Chain Lightning',
                icon: '⚡',
                description: 'Lightning that jumps between enemies',
                damage: 80,
                chainCount: 5,
                cooldown: 25,
                currentCooldown: 0,
                unlocked: false,
                level: 0,
                maxLevel: 5,
                upgradeCost: 350,
                unlockCost: 400
            }
        };
        
        // Visual effects
        this.magicParticles = [];
        this.runeGlow = 0;
        this.crystalRotation = 0;
        this.spellCastEffect = null;
        
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
        
        // Floating icon in bottom right of 4x4 grid
        const cellSize = size / 4;
        const iconSize = 30;
        const iconX = (this.gridX + 3.5) * cellSize;
        const iconY = (this.gridY + 3.5) * cellSize - 5;
        
        const pulseIntensity = 0.85 + 0.15 * Math.sin(this.animationTime * 4);
        
        // Icon shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(iconX - iconSize/2 + 3, iconY - iconSize/2 + 3, iconSize, iconSize);
        
        // Magical purple parchment background
        const parchmentGradient = ctx.createRadialGradient(
            iconX - iconSize/4, iconY - iconSize/4, 0,
            iconX, iconY, iconSize
        );
        parchmentGradient.addColorStop(0, `rgba(139, 92, 246, ${pulseIntensity})`);
        parchmentGradient.addColorStop(0.7, `rgba(99, 102, 241, ${pulseIntensity * 0.9})`);
        parchmentGradient.addColorStop(1, `rgba(79, 70, 229, ${pulseIntensity * 0.8})`);
        
        ctx.fillStyle = parchmentGradient;
        ctx.fillRect(iconX - iconSize/2, iconY - iconSize/2, iconSize, iconSize);
        
        // Gold border
        ctx.strokeStyle = `rgba(184, 134, 11, ${pulseIntensity})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(iconX - iconSize/2, iconY - iconSize/2, iconSize, iconSize);
        
        ctx.strokeStyle = `rgba(255, 215, 0, ${pulseIntensity * 0.8})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(iconX - iconSize/2 + 2, iconY - iconSize/2 + 2, iconSize - 4, iconSize - 4);
        
        // Glow effect
        const glowGradient = ctx.createRadialGradient(iconX, iconY, 0, iconX, iconY, iconSize * 1.5);
        glowGradient.addColorStop(0, `rgba(139, 92, 246, ${pulseIntensity * 0.3})`);
        glowGradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(iconX - iconSize/2 - 5, iconY - iconSize/2 - 5, iconSize + 10, iconSize + 10);
        
        // Icon symbol - magical tower
        ctx.fillStyle = `rgba(255, 255, 255, ${pulseIntensity})`;
        ctx.font = 'bold 16px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🗼', iconX, iconY);
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
        
        console.log(`SuperWeaponLab: Casting ${spell.name}!`);
        
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
    
    isPointInside(x, y, size) {
        const cellSize = size / 4;
        const iconSize = 30;
        const iconX = (this.gridX + 3.5) * cellSize;
        const iconY = (this.gridY + 3.5) * cellSize - 5;
        
        return x >= iconX - iconSize/2 && x <= iconX + iconSize/2 &&
               y >= iconY - iconSize/2 && y <= iconY + iconSize/2;
    }
    
    onClick() {
        this.isSelected = true;
        return {
            type: 'superweapon_menu',
            building: this,
            spells: this.getAllSpells(),
            labLevel: this.labLevel,
            maxLabLevel: this.maxLabLevel
        };
    }
    
    getLabUpgradeOption() {
        if (this.labLevel >= this.maxLabLevel) return null;
        
        const nextLevel = this.labLevel + 1;
        let description = '';
        let nextUnlock = '';
        let cost = 0;
        
        switch(nextLevel) {
            case 2:
                description = 'Enhance the lab to reduce all spell cooldowns.';
                nextUnlock = 'Unlocks: 20% cooldown reduction for all spells';
                cost = 800;
                break;
            case 3:
                description = 'Maximum lab power for devastating spells.';
                nextUnlock = 'Unlocks: 30% damage bonus + 30% cooldown reduction';
                cost = 1500;
                break;
        }
        
        return {
            id: 'lab_upgrade',
            name: `Lab Level ${nextLevel}`,
            description: description,
            nextUnlock: nextUnlock,
            level: this.labLevel,
            maxLevel: this.maxLabLevel,
            cost: cost,
            icon: '🗼'
        };
    }
    
    purchaseLabUpgrade(gameState) {
        if (this.labLevel >= this.maxLabLevel) return false;
        
        const upgradeOption = this.getLabUpgradeOption();
        if (!gameState.canAfford(upgradeOption.cost)) return false;
        
        gameState.spend(upgradeOption.cost);
        this.labLevel++;
        
        // Apply level bonuses
        if (this.labLevel >= 2) {
            // 20% cooldown reduction
            Object.values(this.spells).forEach(spell => {
                spell.cooldown *= 0.8;
            });
        }
        if (this.labLevel >= 3) {
            // Additional damage bonus
            Object.values(this.spells).forEach(spell => {
                if (spell.damage) spell.damage *= 1.3;
                if (spell.burnDamage) spell.burnDamage *= 1.3;
            });
        }
        
        console.log(`SuperWeaponLab: Upgraded to level ${this.labLevel}`);
        return true;
    }
    
    unlockSpell(spellId, gameState) {
        const spell = this.spells[spellId];
        if (!spell || spell.unlocked) return false;
        
        if (!gameState.canAfford(spell.unlockCost)) return false;
        
        gameState.spend(spell.unlockCost);
        spell.unlocked = true;
        spell.level = 1;
        
        console.log(`SuperWeaponLab: Unlocked ${spell.name}!`);
        return true;
    }
    
    upgradeSpell(spellId, gameState) {
        const spell = this.spells[spellId];
        if (!spell || !spell.unlocked || spell.level >= spell.maxLevel) return false;
        
        const cost = spell.upgradeCost * spell.level;
        if (!gameState.canAfford(cost)) return false;
        
        gameState.spend(cost);
        spell.level++;
        
        // Apply upgrade effects
        if (spell.damage) spell.damage *= 1.15;
        if (spell.freezeDuration) spell.freezeDuration += 0.5;
        if (spell.burnDamage) spell.burnDamage += 2;
        if (spell.chainCount) spell.chainCount += 1;
        spell.cooldown *= 0.95; // 5% cooldown reduction per level
        
        console.log(`SuperWeaponLab: Upgraded ${spell.name} to level ${spell.level}`);
        return true;
    }
    
    deselect() {
        this.isSelected = false;
    }
    
    applyEffect(buildingManager) {
        buildingManager.superWeaponUnlocked = true;
    }
    
    static getInfo() {
        return {
            name: 'Super Weapon Lab',
            description: 'Mystical spire that channels powerful spells against enemies.',
            effect: 'Unlocks devastating area spells',
            size: '4x4',
            cost: 1000
        };
    }
}
