import { Building } from './Building.js';

export class MagicAcademy extends Building {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY, 4);
        this.manaRegenRate = 1;
        this.currentMana = 100;
        this.maxMana = 100;
        this.magicParticles = [];
        this.isSelected = false;
        
        // Elemental upgrade system - CORRECTED elements
        this.elementalUpgrades = {
            fire: { level: 0, maxLevel: 5, baseCost: 150, damageBonus: 5 },
            water: { level: 0, maxLevel: 5, baseCost: 150, slowBonus: 0.1 },
            air: { level: 0, maxLevel: 5, baseCost: 150, chainRange: 20 },
            earth: { level: 0, maxLevel: 5, baseCost: 150, armorPiercing: 3 }
        };
        
        // New: Gem storage for each element
        this.gems = { fire: 0, water: 0, air: 0, earth: 0, diamond: 0 };
        
        // New: Gem mining tools research
        this.gemMiningResearched = false;
        
        // New: Diamond mining unlock
        this.diamondMiningUnlocked = false;
        
        // New: Academy upgrade system
        this.academyLevel = 0;
        this.maxAcademyLevel = 3;
        
        // New: Track which features are unlocked
        this.combinationSpellsUnlocked = false;
        this.diamondMiningUnlocked = false;
        this.superWeaponUnlocked = false;
        
        // New: Track unlocked combination spells (requires gem investment)
        this.unlockedCombinations = new Set();
        this.combinationSpells = [
            {
                id: 'steam',
                name: 'Steam',
                elements: ['fire', 'water'],
                icon: '💨',
                description: 'Fire + Water: Burn + Slow effects',
                gemsRequired: { fire: 2, water: 2 },
                damageMultiplier: 1.15
            },
            {
                id: 'magma',
                name: 'Magma',
                elements: ['fire', 'earth'],
                icon: '🌋',
                description: 'Fire + Earth: Burn + Piercing effects',
                gemsRequired: { fire: 2, earth: 2 },
                damageMultiplier: 1.15
            },
            {
                id: 'tempest',
                name: 'Tempest',
                elements: ['air', 'water'],
                icon: '⛈️',
                description: 'Air + Water: Chain + Slow effects',
                gemsRequired: { air: 2, water: 2 },
                damageMultiplier: 1.10
            },
            {
                id: 'meteor',
                name: 'Meteor',
                elements: ['air', 'earth'],
                icon: '☄️',
                description: 'Air + Earth: Chain + Piercing effects',
                gemsRequired: { air: 2, earth: 2 },
                damageMultiplier: 1.10
            }
        ];
        
        // Water ripples animation
        this.waterRipples = [];
        this.nextRippleTime = 0;
        
        // More pine trees within 4x4 grid using barricade tower style (±64px from center)
        this.trees = [
            { x: -55, y: -55, size: 0.8 },
            { x: -25, y: -60, size: 0.6 },
            { x: 5, y: -58, size: 0.5 },
            { x: 35, y: -50, size: 0.7 },
            { x: 55, y: -45, size: 0.5 },
            { x: -60, y: -15, size: 0.9 },
            { x: -35, y: -25, size: 0.4 },
            { x: -5, y: -30, size: 0.6 },
            { x: 20, y: -30, size: 0.6 },
            { x: 50, y: -20, size: 0.7 },
            { x: -50, y: 20, size: 0.8 },
            { x: -20, y: 15, size: 0.5 },
            { x: 10, y: 10, size: 0.4 },
            { x: 25, y: 25, size: 0.6 },
            { x: 55, y: 30, size: 0.7 },
            { x: -45, y: 50, size: 0.6 },
            { x: -15, y: 55, size: 0.8 },
            { x: 15, y: 45, size: 0.5 },
            { x: 30, y: 50, size: 0.5 },
            { x: 45, y: 55, size: 0.9 }
        ];
        
        // Bush positions (CONSTRAINED to 4x4 grid)
        this.bushes = [
            { x: -40, y: -35, size: 8 },
            { x: -10, y: -40, size: 6 },
            { x: 15, y: -45, size: 7 },
            { x: 40, y: -35, size: 8 },
            { x: -45, y: -5, size: 7 },
            { x: -15, y: -10, size: 6 },
            { x: 10, y: -5, size: 8 },
            { x: 35, y: 5, size: 7 },
            { x: -35, y: 35, size: 8 },
            { x: -5, y: 30, size: 6 },
            { x: 20, y: 40, size: 7 },
            { x: 40, y: 35, size: 8 }
        ];
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Regenerate mana
        this.currentMana = Math.min(this.maxMana, this.currentMana + this.manaRegenRate * deltaTime);
        
        // Generate magic particles from spires
        if (Math.random() < deltaTime * 4) {
            const spirePositions = [
                { x: this.x - 30, y: this.y - 45 },
                { x: this.x + 30, y: this.y - 45 },
                { x: this.x, y: this.y - 60 }
            ];
            
            const spire = spirePositions[Math.floor(Math.random() * spirePositions.length)];
            this.magicParticles.push({
                x: spire.x + (Math.random() - 0.5) * 10,
                y: spire.y + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 20,
                vy: -Math.random() * 30 - 10,
                life: 3,
                maxLife: 3,
                size: Math.random() * 3 + 1,
                element: ['fire', 'ice', 'lightning', 'earth'][Math.floor(Math.random() * 4)]
            });
        }
        
        // Update magic particles
        this.magicParticles = this.magicParticles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            particle.size = Math.max(0, particle.size * (particle.life / particle.maxLife));
            return particle.life > 0 && particle.size > 0;
        });
        
        // Generate water ripples (CONSTRAINED to smaller moat area)
        this.nextRippleTime -= deltaTime;
        if (this.nextRippleTime <= 0) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 40 + Math.random() * 15; // Reduced from 70+20 to fit grid
            this.waterRipples.push({
                x: this.x + Math.cos(angle) * distance,
                y: this.y + Math.sin(angle) * distance,
                radius: 0,
                maxRadius: 10 + Math.random() * 8, // Reduced from 15+10
                life: 2,
                maxLife: 2
            });
            this.nextRippleTime = 0.5 + Math.random() * 1.5;
        }
        
        // Update water ripples
        this.waterRipples = this.waterRipples.filter(ripple => {
            ripple.life -= deltaTime;
            ripple.radius = ripple.maxRadius * (1 - ripple.life / ripple.maxLife);
            return ripple.life > 0;
        });
    }
    
    render(ctx, size) {
        // Render surrounding elements first
        this.renderWaterMoat(ctx, size);
        this.renderTrees(ctx, size);
        this.renderBushes(ctx, size);
        
        // Render the fortress
        this.renderFortress(ctx, size);
        
        // Render magic effects
        this.renderMagicEffects(ctx, size);
        
        // Upgrade indicator when selected
        if (this.isSelected) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🎓⬆️', this.x, this.y + size/2 + 20);
        }
        
        // Floating icon in bottom right of 4x4 grid
        const cellSize = size / 4; // Since size is buildingSize = cellSize * 4
        const iconSize = 30; // Increased from 20 for better visibility
        const iconX = (this.gridX + 3.5) * cellSize;
        const iconY = (this.gridY + 3.5) * cellSize - 5; // Float up slightly
        
        // Dynamic pulse for medieval glow effect - reduced intensity
        const pulseIntensity = 0.85 + 0.15 * Math.sin(this.animationTime * 4);
        
        // Enhanced shadow for floating effect with medieval depth
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(iconX - iconSize/2 + 3, iconY - iconSize/2 + 3, iconSize, iconSize);
        
        // Parchment-like background with magical purple gradient
        const parchmentGradient = ctx.createRadialGradient(
            iconX - iconSize/4, iconY - iconSize/4, 0,
            iconX, iconY, iconSize
        );
        parchmentGradient.addColorStop(0, `rgba(221, 160, 221, ${pulseIntensity})`); // Plum parchment
        parchmentGradient.addColorStop(0.7, `rgba(186, 85, 211, ${pulseIntensity * 0.9})`); // Medium orchid parchment
        parchmentGradient.addColorStop(1, `rgba(138, 43, 226, ${pulseIntensity * 0.8})`); // Blue violet parchment
        
        ctx.fillStyle = parchmentGradient;
        ctx.fillRect(iconX - iconSize/2, iconY - iconSize/2, iconSize, iconSize);
        
        // Ornate gold border with medieval styling
        ctx.strokeStyle = `rgba(184, 134, 11, ${pulseIntensity})`; // Dark goldenrod
        ctx.lineWidth = 2;
        ctx.strokeRect(iconX - iconSize/2, iconY - iconSize/2, iconSize, iconSize);
        
        // Inner gold accent border
        ctx.strokeStyle = `rgba(255, 215, 0, ${pulseIntensity * 0.8})`; // Gold
        ctx.lineWidth = 1;
        ctx.strokeRect(iconX - iconSize/2 + 2, iconY - iconSize/2 + 2, iconSize - 4, iconSize - 4);
        
        // Subtle medieval glow effect
        const glowGradient = ctx.createRadialGradient(iconX, iconY, 0, iconX, iconY, iconSize * 1.5);
        glowGradient.addColorStop(0, `rgba(138, 43, 226, ${pulseIntensity * 0.2})`);
        glowGradient.addColorStop(1, 'rgba(138, 43, 226, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(iconX - iconSize/2 - 5, iconY - iconSize/2 - 5, iconSize + 10, iconSize + 10);
        
        // Symbol with enhanced medieval styling - spellbook
        ctx.fillStyle = `rgba(75, 0, 130, ${pulseIntensity})`; // Indigo for magical text
        ctx.font = 'bold 18px serif'; // Serif font for medieval feel
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📖', iconX, iconY);
        
        // Add subtle gold highlight on symbol
        ctx.fillStyle = `rgba(255, 215, 0, ${pulseIntensity * 0.3})`;
        ctx.fillText('📖', iconX, iconY);
    }
    
    renderFortress(ctx, size) {
        // NO SHADOW RENDERING - this was causing the grey square
        
        // Main fortress base (cobblestone)
        this.renderCobblestoneBase(ctx, size);
        
        // Main central tower
        this.renderCentralTower(ctx, size);
        
        // Side towers/spires
        this.renderSideSpires(ctx, size);
        
        // Fortress details
        this.renderFortressDetails(ctx, size);
    }
    
    renderWaterMoat(ctx, size) {
        // Water moat around the fortress (CONSTRAINED to 4x4 grid)
        const moatRadius = size * 0.45; // Reduced from 0.7 to fit in grid
        const innerRadius = size * 0.3;  // Reduced from 0.45
        
        // Water base
        const waterGradient = ctx.createRadialGradient(
            this.x, this.y, innerRadius,
            this.x, this.y, moatRadius
        );
        waterGradient.addColorStop(0, 'rgba(64, 164, 223, 0)');
        waterGradient.addColorStop(0.3, 'rgba(64, 164, 223, 0.4)');
        waterGradient.addColorStop(0.7, 'rgba(30, 144, 255, 0.6)');
        waterGradient.addColorStop(1, 'rgba(0, 100, 200, 0.8)');
        
        ctx.fillStyle = waterGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, moatRadius, 0, Math.PI * 2);
        ctx.arc(this.x, this.y, innerRadius, 0, Math.PI * 2, true);
        ctx.fill();
        
        // Water surface shimmer
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + this.animationTime * 0.5;
            const radius = innerRadius + (moatRadius - innerRadius) * 0.5;
            const shimmerX = this.x + Math.cos(angle) * radius;
            const shimmerY = this.y + Math.sin(angle) * radius;
            const alpha = (Math.sin(this.animationTime * 3 + i) + 1) * 0.2;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(shimmerX, shimmerY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Render water ripples (CONSTRAINED to moat area)
        this.waterRipples.forEach(ripple => {
            const alpha = ripple.life / ripple.maxLife * 0.3;
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
            ctx.stroke();
        });
    }
    
    renderTrees(ctx, size) {
        this.trees.forEach(tree => {
            const treeX = this.x + tree.x;
            const treeY = this.y + tree.y;
            const scale = tree.size;
            
            // Tree shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.save();
            ctx.translate(treeX + 2, treeY + 2);
            ctx.scale(1, 0.5);
            ctx.beginPath();
            ctx.arc(0, 0, 6 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // Tree trunk
            ctx.fillStyle = '#654321';
            ctx.fillRect(treeX - 1 * scale, treeY, 2 * scale, -6 * scale);
            
            // Trunk texture
            ctx.strokeStyle = '#5D4037';
            ctx.lineWidth = 1;
            for (let i = 1; i < 3; i++) {
                const y = treeY - (6 * scale * i / 3);
                ctx.beginPath();
                ctx.moveTo(treeX - 1 * scale, y);
                ctx.lineTo(treeX + 1 * scale, y);
                ctx.stroke();
            }
            
            // Pine layers (same as barricade tower)
            const layers = [
                { y: -10 * scale, width: 8 * scale, color: '#0F3B0F' },
                { y: -7 * scale, width: 6 * scale, color: '#228B22' },
                { y: -4 * scale, width: 4 * scale, color: '#32CD32' }
            ];
            
            layers.forEach(layer => {
                ctx.fillStyle = layer.color;
                ctx.beginPath();
                ctx.moveTo(treeX, treeY + layer.y);
                ctx.lineTo(treeX - layer.width/2, treeY + layer.y + layer.width * 0.8);
                ctx.lineTo(treeX + layer.width/2, treeY + layer.y + layer.width * 0.8);
                ctx.closePath();
                ctx.fill();
                
                // Tree outline
                ctx.strokeStyle = '#0F3B0F';
                ctx.lineWidth = 1;
                ctx.stroke();
            });
        });
    }
    
    renderBushes(ctx, size) {
        this.bushes.forEach(bush => {
            ctx.save();
            ctx.translate(this.x + bush.x, this.y + bush.y);
            
            // Bush shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.ellipse(2, 2, bush.size, bush.size * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Bush base
            ctx.fillStyle = '#228B22';
            ctx.beginPath();
            ctx.arc(0, 0, bush.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Bush highlights
            ctx.fillStyle = '#32CD32';
            for (let i = 0; i < 3; i++) {
                const angle = (i / 3) * Math.PI * 2;
                const highlightX = Math.cos(angle) * bush.size * 0.4;
                const highlightY = Math.sin(angle) * bush.size * 0.4;
                ctx.beginPath();
                ctx.arc(highlightX, highlightY, bush.size * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        });
    }
    
    renderCobblestoneBase(ctx, size) {
        const baseWidth = size * 0.8;
        const baseHeight = size * 0.6;
        const wallHeight = size * 0.3;
        
        // Main fortress wall gradient
        const wallGradient = ctx.createLinearGradient(
            this.x - baseWidth/2, this.y - wallHeight,
            this.x + baseWidth/4, this.y
        );
        wallGradient.addColorStop(0, '#A9A9A9');
        wallGradient.addColorStop(0.5, '#808080');
        wallGradient.addColorStop(1, '#696969');
        
        // Fortress base
        ctx.fillStyle = wallGradient;
        ctx.fillRect(this.x - baseWidth/2, this.y - wallHeight/2, baseWidth, wallHeight);
        
        // Cobblestone pattern
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        
        const stoneWidth = baseWidth / 12;
        const stoneHeight = wallHeight / 8;
        
        for (let row = 0; row < 8; row++) {
            const offsetX = (row % 2) * stoneWidth/2;
            const rowY = this.y - wallHeight/2 + (row * stoneHeight);
            
            for (let col = 0; col < 12; col++) {
                const stoneX = this.x - baseWidth/2 + offsetX + (col * stoneWidth);
                
                // Stone color variation
                const stoneShade = 0.8 + Math.sin(row * col * 0.3) * 0.2;
                ctx.fillStyle = `rgb(${Math.floor(169 * stoneShade)}, ${Math.floor(169 * stoneShade)}, ${Math.floor(169 * stoneShade)})`;
                
                ctx.fillRect(stoneX, rowY, stoneWidth - 1, stoneHeight - 1);
                ctx.strokeRect(stoneX, rowY, stoneWidth - 1, stoneHeight - 1);
                
                // Stone highlight
                ctx.fillStyle = `rgba(200, 200, 200, ${0.3 * stoneShade})`;
                ctx.fillRect(stoneX, rowY, stoneWidth/3, stoneHeight/3);
            }
        }
        
        // Fortress gate
        const gateWidth = size * 0.15;
        const gateHeight = size * 0.2;
        ctx.fillStyle = '#2F2F2F';
        ctx.fillRect(this.x - gateWidth/2, this.y - gateHeight/2, gateWidth, gateHeight);
        
        // Gate arch
        ctx.fillStyle = '#1C1C1C';
        ctx.beginPath();
        ctx.arc(this.x, this.y - gateHeight/2, gateWidth/2, 0, Math.PI, true);
        ctx.fill();
        
        // Gate details
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - gateHeight/2);
        ctx.lineTo(this.x, this.y + gateHeight/2);
        ctx.stroke();
    }
    
    renderCentralTower(ctx, size) {
        const towerRadius = size * 0.15;
        const towerHeight = size * 0.5;
        const towerY = this.y - towerHeight;
        
        // Tower gradient
        const towerGradient = ctx.createLinearGradient(
            this.x - towerRadius, towerY,
            this.x + towerRadius, this.y
        );
        towerGradient.addColorStop(0, '#B0C4DE');
        towerGradient.addColorStop(0.5, '#708090');
        towerGradient.addColorStop(1, '#2F4F4F');
        
        // Central tower cylinder
        ctx.fillStyle = towerGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y - towerHeight/2, towerRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Tower rings (cobblestone courses)
        for (let ring = 0; ring < 5; ring++) {
            const ringY = this.y - towerHeight + ring * towerHeight/5;
            ctx.strokeStyle = '#1C1C1C';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, ringY, towerRadius * 0.95, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Tower windows
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const windowX = this.x + Math.cos(angle) * towerRadius * 0.8;
            const windowY = this.y - towerHeight * 0.7;
            
            // Window glow (magical)
            const windowGlow = ctx.createRadialGradient(windowX, windowY, 0, windowX, windowY, 8);
            windowGlow.addColorStop(0, 'rgba(138, 43, 226, 0.8)');
            windowGlow.addColorStop(1, 'rgba(138, 43, 226, 0)');
            ctx.fillStyle = windowGlow;
            ctx.beginPath();
            ctx.arc(windowX, windowY, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Window frame
            ctx.fillStyle = '#1C1C1C';
            ctx.beginPath();
            ctx.arc(windowX, windowY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Tower roof (conical)
        const roofHeight = size * 0.2;
        ctx.fillStyle = '#4B0082';
        ctx.strokeStyle = '#2E0A4F';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(this.x, towerY - roofHeight);
        ctx.lineTo(this.x - towerRadius * 1.2, towerY);
        ctx.lineTo(this.x + towerRadius * 1.2, towerY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Roof tiles
        for (let i = 1; i < 4; i++) {
            const tileY = towerY - roofHeight * (i/4);
            const tileWidth = towerRadius * 1.2 * (1 - i/5);
            ctx.strokeStyle = '#2E0A4F';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x - tileWidth, tileY);
            ctx.lineTo(this.x + tileWidth, tileY);
            ctx.stroke();
        }
        
        // Magical orb at top
        const orbPulse = Math.sin(this.animationTime * 3) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(138, 43, 226, ${orbPulse})`;
        ctx.beginPath();
        ctx.arc(this.x, towerY - roofHeight, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Orb glow
        const orbGlow = ctx.createRadialGradient(this.x, towerY - roofHeight, 0, this.x, towerY - roofHeight, 15);
        orbGlow.addColorStop(0, `rgba(138, 43, 226, ${orbPulse * 0.5})`);
        orbGlow.addColorStop(1, 'rgba(138, 43, 226, 0)');
        ctx.fillStyle = orbGlow;
        ctx.beginPath();
        ctx.arc(this.x, towerY - roofHeight, 15, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderSideSpires(ctx, size) {
        const spirePositions = [
            { x: this.x - 30, y: this.y, height: size * 0.35 },
            { x: this.x + 30, y: this.y, height: size * 0.35 }
        ];
        
        spirePositions.forEach(spire => {
            const spireRadius = size * 0.08;
            
            // Spire base
            const spireGradient = ctx.createLinearGradient(
                spire.x - spireRadius, spire.y - spire.height,
                spire.x + spireRadius, spire.y
            );
            spireGradient.addColorStop(0, '#9370DB');
            spireGradient.addColorStop(0.5, '#6A5ACD');
            spireGradient.addColorStop(1, '#483D8B');
            
            ctx.fillStyle = spireGradient;
            ctx.fillRect(spire.x - spireRadius, spire.y - spire.height, spireRadius * 2, spire.height);
            
            ctx.strokeStyle = '#2E0A4F';
            ctx.lineWidth = 1;
            ctx.strokeRect(spire.x - spireRadius, spire.y - spire.height, spireRadius * 2, spire.height);
            
            // Spire cap
            const capHeight = size * 0.1;
            ctx.fillStyle = '#4B0082';
            ctx.beginPath();
            ctx.moveTo(spire.x, spire.y - spire.height - capHeight);
            ctx.lineTo(spire.x - spireRadius * 1.2, spire.y - spire.height);
            ctx.lineTo(spire.x + spireRadius * 1.2, spire.y - spire.height);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Spire crystal
            const crystalPulse = Math.sin(this.animationTime * 4 + spire.x) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(75, 0, 130, ${crystalPulse})`;
            ctx.beginPath();
            ctx.arc(spire.x, spire.y - spire.height - capHeight, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    renderFortressDetails(ctx, size) {
        // Fortress banners
        const bannerPositions = [
            { x: this.x - 35, y: this.y - size * 0.25 },
            { x: this.x + 35, y: this.y - size * 0.25 }
        ];
        
        bannerPositions.forEach(banner => {
            // Banner pole
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(banner.x, banner.y);
            ctx.lineTo(banner.x, banner.y - 20);
            ctx.stroke();
            
            // Banner cloth with wind effect
            const windOffset = Math.sin(this.animationTime * 2 + banner.x) * 3;
            ctx.fillStyle = '#4B0082';
            ctx.beginPath();
            ctx.moveTo(banner.x, banner.y - 20);
            ctx.lineTo(banner.x + 15 + windOffset, banner.y - 18);
            ctx.lineTo(banner.x + 12 + windOffset, banner.y - 10);
            ctx.lineTo(banner.x, banner.y - 12);
            ctx.closePath();
            ctx.fill();
            
            // Banner symbol
            ctx.fillStyle = '#FFD700';
            ctx.font = '10px serif';
            ctx.fillText('🔮', banner.x + 5, banner.y - 14);
        });
        
        // Fortress bridge over moat (main entrance)
        const bridgeWidth = size * 0.2;
        const bridgeLength = size * 0.3;
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x - bridgeWidth/2, this.y + size * 0.2, bridgeWidth, bridgeLength);
        
        // Bridge planks
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        for (let i = 1; i < 5; i++) {
            const plankY = this.y + size * 0.2 + (i * bridgeLength / 5);
            ctx.beginPath();
            ctx.moveTo(this.x - bridgeWidth/2, plankY);
            ctx.lineTo(this.x + bridgeWidth/2, plankY);
            ctx.stroke();
        }
    }
    
    renderMagicEffects(ctx, size) {
        // Render elemental magic particles
        this.magicParticles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            let color;
            
            switch(particle.element) {
                case 'fire':
                    color = `rgba(255, 69, 0, ${alpha})`;
                    break;
                case 'ice':
                    color = `rgba(173, 216, 230, ${alpha})`;
                    break;
                case 'lightning':
                    color = `rgba(255, 255, 0, ${alpha})`;
                    break;
                case 'earth':
                    color = `rgba(139, 69, 19, ${alpha})`;
                    break;
            }
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Particle glow
            const glowGradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size * 3);
            glowGradient.addColorStop(0, color);
            glowGradient.addColorStop(1, color.replace(/[\d.]+\)/, '0)'));
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Mana indicator (removed gem display from here)
        const manaBarWidth = size * 0.6;
        const manaBarHeight = 6;
        const manaBarY = this.y + size/2 + 10;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.x - manaBarWidth/2, manaBarY, manaBarWidth, manaBarHeight);
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(this.x - manaBarWidth/2, manaBarY, 
                     manaBarWidth * (this.currentMana / this.maxMana), manaBarHeight);
    }
    
    isPointInside(x, y, size) {
        // Calculate icon position and size for precise click detection
        const cellSize = size / 4;
        const iconSize = 30; // Matches the updated render size
        const iconX = (this.gridX + 3.5) * cellSize;
        const iconY = (this.gridY + 3.5) * cellSize - 5;
        
        // Check if the point is within the icon's bounds
        return x >= iconX - iconSize/2 && x <= iconX + iconSize/2 &&
               y >= iconY - iconSize/2 && y <= iconY + iconSize/2;
    }
    
    onClick() {
        console.log('MagicAcademy: onClick called');
        this.isSelected = true;
        
        const result = {
            type: 'academy_menu',
            academy: this,
            upgrades: this.getElementalUpgradeOptions()
        };
        
        console.log('MagicAcademy: returning menu data:', result);
        return result;
    }
    
    getElementalUpgradeOptions() {
        const options = [];
        
        // New: Add academy building upgrades first - only if not at max level
        if (this.academyLevel < this.maxAcademyLevel) {
            options.push(this.getAcademyUpgradeOption());
        }
        
        // Add elemental upgrades
        options.push(
            {
                id: 'fire',
                name: 'Fire Mastery',
                description: `Increase Magic Tower fire damage by ${this.elementalUpgrades.fire.damageBonus} per level`,
                level: this.elementalUpgrades.fire.level,
                maxLevel: this.elementalUpgrades.fire.maxLevel,
                cost: this.calculateElementalCost('fire'),
                icon: '🔥',
                gemType: 'fire'
            },
            {
                id: 'water',
                name: 'Water Mastery', 
                description: `Increase Magic Tower water slow effect by ${(this.elementalUpgrades.water.slowBonus * 100).toFixed(0)}% per level`,
                level: this.elementalUpgrades.water.level,
                maxLevel: this.elementalUpgrades.water.maxLevel,
                cost: this.calculateElementalCost('water'),
                icon: '💧',
                gemType: 'water'
            },
            {
                id: 'air',
                name: 'Air Mastery',
                description: `Increase Magic Tower air chain range by ${this.elementalUpgrades.air.chainRange}px per level`,
                level: this.elementalUpgrades.air.level,
                maxLevel: this.elementalUpgrades.air.maxLevel,
                cost: this.calculateElementalCost('air'),
                icon: '💨',
                gemType: 'air'
            },
            {
                id: 'earth',
                name: 'Earth Mastery',
                description: `Increase Magic Tower earth armor piercing by ${this.elementalUpgrades.earth.armorPiercing} per level`,
                level: this.elementalUpgrades.earth.level,
                maxLevel: this.elementalUpgrades.earth.maxLevel,
                cost: this.calculateElementalCost('earth'),
                icon: '🪨',
                gemType: 'earth',
                color: '#8B6F47'
            }
        );
        
        // New: Add gem mining tools research if not yet researched
        if (!this.gemMiningResearched) {
            options.push({
                id: 'gemMiningTools',
                name: 'Gem Mining Tools',
                description: 'Research tools to mine elemental gems in gold mines. Allows toggling mines to gem mode.',
                level: 0,
                maxLevel: 1,
                cost: 500,
                icon: '⛏️💎',
                isResearch: true
            });
        }
        
        // New: Add combination spell unlocks if academy level 1 is reached
        if (this.combinationSpellsUnlocked) {
            this.combinationSpells.forEach(spell => {
                if (!this.unlockedCombinations.has(spell.id)) {
                    options.push({
                        id: `unlock_${spell.id}`,
                        name: `Unlock ${spell.name} Spell`,
                        description: `Invest gems to unlock the ${spell.name} combination spell for Combination Towers`,
                        level: 0,
                        maxLevel: 1,
                        cost: spell.gemsRequired,
                        icon: spell.icon,
                        isCombinationUnlock: true,
                        gemType: 'combination',
                        spellId: spell.id,
                        requiredElements: spell.elements
                    });
                }
            });
        }
        
        return options;
    }
    
    // New: Get academy upgrade option
    getAcademyUpgradeOption() {
        const nextLevel = this.academyLevel + 1;
        let description = '';
        let nextUnlock = '';
        let cost = 0;
        
        switch(nextLevel) {
            case 1:
                description = 'Enhance the academy to unlock combination spells for Magic Towers.';
                nextUnlock = 'Unlocks: 4 Combination Spells (Steam, Magma, Tempest, Meteor)';
                cost = 1000;
                break;
            case 2:
                description = 'Further enhance the academy to unlock diamond mining capabilities.';
                nextUnlock = 'Unlocks: Diamond Mining in Gold Mines + Diamond gem currency';
                cost = 1500;
                break;
            case 3:
                description = 'Achieve maximum academy power to unlock Super Weapon construction.';
                nextUnlock = 'Unlocks: Super Weapon Lab building';
                cost = 2000;
                break;
        }
        
        return {
            id: 'academy_upgrade',
            name: `Academy Level ${nextLevel}`,
            description: description,
            nextUnlock: nextUnlock,
            level: this.academyLevel,
            maxLevel: this.maxAcademyLevel,
            cost: cost,
            icon: '🎓',
            isAcademyUpgrade: true
        };
    }
    
    // New: Purchase academy upgrade
    purchaseAcademyUpgrade(gameState) {
        if (this.academyLevel >= this.maxAcademyLevel) {
            return false;
        }
        
        const upgradeOption = this.getAcademyUpgradeOption();
        const cost = upgradeOption.cost;
        
        if (!gameState.canAfford(cost)) {
            console.log('MagicAcademy: Not enough gold for academy upgrade');
            return false;
        }
        
        gameState.spend(cost);
        this.academyLevel++;
        
        // Apply upgrades based on new level
        switch(this.academyLevel) {
            case 1:
                this.combinationSpellsUnlocked = true;
                console.log('MagicAcademy: Combination spells unlocked!');
                break;
            case 2:
                this.diamondMiningUnlocked = true;
                console.log('MagicAcademy: Diamond mining unlocked!');
                break;
            case 3:
                this.superWeaponUnlocked = true;
                console.log('MagicAcademy: Super weapon construction unlocked!');
                break;
        }
        
        return true;
    }
    
    calculateElementalCost(element) {
        const upgrade = this.elementalUpgrades[element];
        if (upgrade.level >= upgrade.maxLevel) return null;
        
        // Progressive cost: 1, 3, 7, 15, 30
        const costs = [1, 3, 7, 15, 30];
        return costs[upgrade.level] || null;
    }
    
    purchaseElementalUpgrade(element, gameState) {
        // Handle combination spell unlocks
        if (element.startsWith('unlock_')) {
            const spellId = element.substring(7); // Remove 'unlock_' prefix
            const spell = this.combinationSpells.find(s => s.id === spellId);
            
            if (!spell) {
                console.log(`MagicAcademy: Unknown combination spell ${spellId}`);
                return false;
            }
            
            // Check if already unlocked
            if (this.unlockedCombinations.has(spellId)) {
                console.log(`MagicAcademy: ${spellId} already unlocked`);
                return false;
            }
            
            // Check if enough gems for all required elements
            for (const [gemType, amount] of Object.entries(spell.gemsRequired)) {
                if ((this.gems[gemType] || 0) < amount) {
                    console.log(`MagicAcademy: Not enough ${gemType} gems for ${spellId}. Need ${amount}, have ${this.gems[gemType] || 0}`);
                    return false;
                }
            }
            
            // Deduct gems and unlock spell
            for (const [gemType, amount] of Object.entries(spell.gemsRequired)) {
                this.gems[gemType] -= amount;
            }
            
            this.unlockedCombinations.add(spellId);
            console.log(`MagicAcademy: Unlocked ${spell.name} combination spell!`);
            
            // NEW: Notify unlock system
            return { success: true, spellId: spellId };
        }
        
        // Handle regular elemental upgrades
        const upgrade = this.elementalUpgrades[element];
        const cost = this.calculateElementalCost(element);
        
        if (!cost || upgrade.level >= upgrade.maxLevel) {
            console.log(`MagicAcademy: Cannot upgrade ${element} - invalid cost or max level`);
            return false;
        }
        
        // Check if player has enough gems
        if (this.gems[element] < cost) {
            console.log(`MagicAcademy: Not enough ${element} gems. Need ${cost}, have ${this.gems[element]}`);
            return false;
        }
        
        this.gems[element] -= cost;
        upgrade.level++;
        
        console.log(`MagicAcademy: Purchased ${element} upgrade level ${upgrade.level} using ${cost} ${element} gems`);
        return true;
    }
    
    // New: Check if combination spell is unlocked
    isCombinationUnlocked(spellId) {
        return this.unlockedCombinations.has(spellId);
    }
    
    // New: Get unlocked combination spells
    getUnlockedCombinations() {
        return Array.from(this.unlockedCombinations);
    }
    
    // New: Add diamond gem
    addDiamond() {
        this.gems.diamond++;
        console.log(`MagicAcademy: Added 1 diamond, total: ${this.gems.diamond}`);
    }
    
    // Modified: Method to research gem mining tools
    researchGemMiningTools(gameState) {
        if (this.gemMiningResearched || !gameState.canAfford(500)) {
            console.log('MagicAcademy: Cannot research gem mining tools');
            return false;
        }
        
        if (gameState.spend(500)) {
            this.gemMiningResearched = true;
            console.log('MagicAcademy: Researched gem mining tools');
            return true;
        }
        return false;
    }
    
    // New: Method to add gems (called by mines)
    addGem(gemType) {
        if (this.gems.hasOwnProperty(gemType)) {
            this.gems[gemType]++;
            console.log(`MagicAcademy: Added 1 ${gemType} gem, total: ${this.gems[gemType]}`);
        }
    }
    
    deselect() {
        this.isSelected = false;
    }
    
    applyEffect(buildingManager) {
        // Academy provides mana regeneration and elemental research
        buildingManager.manaPerSecond = this.manaRegenRate;
        buildingManager.elementalBonuses = this.getElementalBonuses();
    }
    
    getElementalBonuses() {
        return {
            fire: {
                damageBonus: this.elementalUpgrades.fire.level * this.elementalUpgrades.fire.damageBonus
            },
            water: {
                slowBonus: this.elementalUpgrades.water.level * this.elementalUpgrades.water.slowBonus
            },
            air: {
                chainRange: this.elementalUpgrades.air.level * this.elementalUpgrades.air.chainRange
            },
            earth: {
                armorPiercing: this.elementalUpgrades.earth.level * this.elementalUpgrades.earth.armorPiercing
            }
        };
    }
    
    static getInfo() {
        return {
            name: 'Magic Academy',
            description: 'Magical fortress that unlocks Magic Towers and provides elemental upgrades.',
            effect: 'Unlocks Magic Tower + Elemental Upgrades',
            size: '4x4',
            cost: 250
        };
    }
    
    // New: Method to unlock academy features
    unlockAcademyFeature(feature) {
        switch(feature) {
            case 'combinationSpells':
                this.combinationSpellsUnlocked = true;
                break;
            case 'diamondMining':
                this.diamondMiningUnlocked = true;
                break;
            case 'superWeapon':
                this.superWeaponUnlocked = true;
                break;
            default:
                console.log(`MagicAcademy: Unknown feature ${feature}`);
                return false;
        }
        
        console.log(`MagicAcademy: Unlocked ${feature}`);
        return true;
    }
}