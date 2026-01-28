import { Building } from './Building.js';

export class MagicAcademy extends Building {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY, 4);
        this.type = 'academy'; // Ensure type is set for reliable detection
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
        
        // Gem mining is automatically unlocked at Academy Level 1
        this.gemMiningResearched = true;
        
        // Academy upgrade system - starts at level 1 on build
        this.academyLevel = 1;
        this.maxAcademyLevel = 3;
        
        // Track which features are unlocked
        // Level 1: Magic Tower + Gem Mining automatically unlocked
        // Level 2: Magic Tower upgrades unlocked
        // Level 3: Super Weapon Lab buildable
        this.gemMiningResearched = true; // Automatic at level 1
        this.superWeaponUnlocked = false;
        
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
        
        // Render fortress base (cobblestone and gate - below trees)
        this.renderCobblestoneBase(ctx, size);
        
        // Render trees and bushes - they appear in front of the base
        this.renderTrees(ctx, size);
        this.renderBushes(ctx, size);
        
        // Render the upper fortress structures (towers, spires, details - above trees)
        this.renderCentralTower(ctx, size);
        this.renderSideSpires(ctx, size);
        this.renderFortressDetails(ctx, size);
        
        // Render magic effects
        this.renderMagicEffects(ctx, size);
    }
    
    renderFortress(ctx, size) {
        // This method is no longer used - rendering order is handled in render()
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
        // Render trees naturally - fortress will cover lower portions
        this.trees.forEach((tree, index) => {
            const treeX = this.x + tree.x;
            const treeY = this.y + tree.y;
            const scale = tree.size * 40;
            
            // Tree shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.save();
            ctx.translate(treeX + 3, treeY + 4);
            ctx.scale(1, 0.4);
            ctx.beginPath();
            ctx.arc(0, 0, scale * 0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // Use different tree types based on index for variety
            const treeType = index % 4;
            switch(treeType) {
                case 0:
                    this.renderTreeType1(ctx, treeX, treeY, scale);
                    break;
                case 1:
                    this.renderTreeType2(ctx, treeX, treeY, scale);
                    break;
                case 2:
                    this.renderTreeType3(ctx, treeX, treeY, scale);
                    break;
                default:
                    this.renderTreeType4(ctx, treeX, treeY, scale);
            }
        });
    }
    
    renderTreeType1(ctx, x, y, size) {
        const trunkWidth = size * 0.25;
        const trunkHeight = size * 0.5;
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(x, y, trunkWidth * 0.5, trunkHeight);
        ctx.fillStyle = '#0D3817';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.6);
        ctx.lineTo(x + size * 0.35, y - size * 0.1);
        ctx.lineTo(x - size * 0.35, y - size * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.35);
        ctx.lineTo(x + size * 0.3, y + size * 0.05);
        ctx.lineTo(x - size * 0.3, y + size * 0.05);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.15);
        ctx.lineTo(x + size * 0.25, y + size * 0.2);
        ctx.lineTo(x - size * 0.25, y + size * 0.2);
        ctx.closePath();
        ctx.fill();
    }

    renderTreeType2(ctx, x, y, size) {
        const trunkWidth = size * 0.2;
        const trunkHeight = size * 0.4;
        ctx.fillStyle = '#6B4423';
        ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);
        ctx.fillStyle = '#8B5A3C';
        ctx.fillRect(x - trunkWidth * 0.5 + trunkWidth * 0.6, y, trunkWidth * 0.4, trunkHeight);
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.35, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#43A047';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.55, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    renderTreeType3(ctx, x, y, size) {
        // Sparse tree with distinct branches
        const trunkWidth = size * 0.22;
        ctx.fillStyle = '#795548';
        ctx.fillRect(x - trunkWidth * 0.5, y - size * 0.2, trunkWidth, size * 0.6);
        ctx.fillStyle = '#4E342E';
        ctx.beginPath();
        ctx.arc(x + trunkWidth * 0.25, y, trunkWidth * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.arc(x - size * 0.28, y - size * 0.35, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + size * 0.28, y - size * 0.3, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.55, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    renderTreeType4(ctx, x, y, size) {
        // Pine/Spruce style with layered triangles
        const trunkWidth = size * 0.18;
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - trunkWidth * 0.5, y - size * 0.05, trunkWidth, size * 0.45);
        ctx.fillStyle = '#0D3817';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.05);
        ctx.lineTo(x + size * 0.38, y + size * 0.15);
        ctx.lineTo(x - size * 0.38, y + size * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.25);
        ctx.lineTo(x + size * 0.3, y);
        ctx.lineTo(x - size * 0.3, y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.45);
        ctx.lineTo(x + size * 0.2, y - size * 0.15);
        ctx.lineTo(x - size * 0.2, y - size * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#43A047';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.6);
        ctx.lineTo(x + size * 0.12, y - size * 0.45);
        ctx.lineTo(x - size * 0.12, y - size * 0.45);
        ctx.closePath();
        ctx.fill();
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
        
        // Cobblestone pattern - improved with better edge alignment
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        
        const stoneWidth = baseWidth / 12;
        const stoneHeight = wallHeight / 8;
        
        for (let row = 0; row < 8; row++) {
            const offsetX = (row % 2) * stoneWidth/2;
            const rowY = this.y - wallHeight/2 + (row * stoneHeight);
            
            for (let col = 0; col < 12; col++) {
                const stoneX = this.x - baseWidth/2 + offsetX + (col * stoneWidth);
                
                // Stone color variation with better shading
                const stoneShade = 0.75 + Math.sin(row * col * 0.3) * 0.25;
                ctx.fillStyle = `rgb(${Math.floor(169 * stoneShade)}, ${Math.floor(169 * stoneShade)}, ${Math.floor(169 * stoneShade)})`;
                
                ctx.fillRect(stoneX, rowY, stoneWidth - 1, stoneHeight - 1);
                ctx.strokeRect(stoneX, rowY, stoneWidth - 1, stoneHeight - 1);
                
                // Stone highlight with better gradation
                ctx.fillStyle = `rgba(210, 210, 210, ${0.25 * stoneShade})`;
                ctx.fillRect(stoneX + 1, rowY + 1, stoneWidth/3 - 1, stoneHeight/3 - 1);
                
                // Stone shadow for depth
                ctx.fillStyle = `rgba(100, 100, 100, ${0.15 * stoneShade})`;
                ctx.fillRect(stoneX + stoneWidth - 3, rowY + stoneHeight - 3, 2, 2);
            }
        }
        
        // Wall edges (left and right borders for finished look)
        ctx.strokeStyle = '#1C1C1C';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x - baseWidth/2, this.y - wallHeight/2);
        ctx.lineTo(this.x - baseWidth/2, this.y + wallHeight/2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.x + baseWidth/2, this.y - wallHeight/2);
        ctx.lineTo(this.x + baseWidth/2, this.y + wallHeight/2);
        ctx.stroke();
        
        // Top and bottom edge finishing
        ctx.strokeStyle = '#4F4F4F';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x - baseWidth/2, this.y - wallHeight/2);
        ctx.lineTo(this.x + baseWidth/2, this.y - wallHeight/2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.x - baseWidth/2, this.y + wallHeight/2);
        ctx.lineTo(this.x + baseWidth/2, this.y + wallHeight/2);
        ctx.stroke();
        
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
            
            // Spire stone courses/rings for texture
            for (let i = 0; i < 5; i++) {
                const ringY = spire.y - spire.height + (i * spire.height / 5);
                ctx.strokeStyle = '#3E2B6D';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(spire.x - spireRadius, ringY);
                ctx.lineTo(spire.x + spireRadius, ringY);
                ctx.stroke();
            }
            
            // Spire windows with glow
            for (let i = 0; i < 3; i++) {
                const windowY = spire.y - spire.height * (0.2 + i * 0.3);
                
                // Window glow (magical)
                const windowGlow = ctx.createRadialGradient(spire.x, windowY, 0, spire.x, windowY, 6);
                windowGlow.addColorStop(0, 'rgba(138, 43, 226, 0.6)');
                windowGlow.addColorStop(1, 'rgba(138, 43, 226, 0)');
                ctx.fillStyle = windowGlow;
                ctx.beginPath();
                ctx.arc(spire.x, windowY, 6, 0, Math.PI * 2);
                ctx.fill();
                
                // Window frame
                ctx.fillStyle = '#1C1C1C';
                ctx.beginPath();
                ctx.arc(spire.x, windowY, 2.5, 0, Math.PI * 2);
                ctx.fill();
                
                // Window shine
                ctx.fillStyle = 'rgba(200, 100, 255, 0.5)';
                ctx.beginPath();
                ctx.arc(spire.x - 0.5, windowY - 0.5, 1, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Spire cap with more detail
            const capHeight = size * 0.12;
            const capGradient = ctx.createLinearGradient(spire.x - spireRadius * 1.2, spire.y - spire.height - capHeight, spire.x + spireRadius * 1.2, spire.y - spire.height);
            capGradient.addColorStop(0, '#5B3A9D');
            capGradient.addColorStop(1, '#3D2673');
            
            ctx.fillStyle = capGradient;
            ctx.beginPath();
            ctx.moveTo(spire.x, spire.y - spire.height - capHeight);
            ctx.lineTo(spire.x - spireRadius * 1.2, spire.y - spire.height);
            ctx.lineTo(spire.x + spireRadius * 1.2, spire.y - spire.height);
            ctx.closePath();
            ctx.fill();
            
            // Cap outline
            ctx.strokeStyle = '#2E0A4F';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Cap ridge detail
            ctx.strokeStyle = '#7A4FBB';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(spire.x, spire.y - spire.height - capHeight);
            ctx.lineTo(spire.x, spire.y - spire.height);
            ctx.stroke();
            
            // Spire crystal with pulsing glow
            const crystalPulse = Math.sin(this.animationTime * 4 + spire.x) * 0.3 + 0.7;
            
            // Crystal glow (larger)
            const crystalGlow = ctx.createRadialGradient(spire.x, spire.y - spire.height - capHeight, 0, spire.x, spire.y - spire.height - capHeight, 10);
            crystalGlow.addColorStop(0, `rgba(138, 43, 226, ${crystalPulse * 0.4})`);
            crystalGlow.addColorStop(1, 'rgba(138, 43, 226, 0)');
            ctx.fillStyle = crystalGlow;
            ctx.beginPath();
            ctx.arc(spire.x, spire.y - spire.height - capHeight, 10, 0, Math.PI * 2);
            ctx.fill();
            
            // Crystal itself
            ctx.fillStyle = `rgba(200, 100, 255, ${crystalPulse})`;
            ctx.beginPath();
            ctx.arc(spire.x, spire.y - spire.height - capHeight, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Crystal highlight
            ctx.fillStyle = `rgba(255, 150, 255, ${crystalPulse * 0.7})`;
            ctx.beginPath();
            ctx.arc(spire.x - 1, spire.y - spire.height - capHeight - 1, 1.5, 0, Math.PI * 2);
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
            

        });
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
    }
    
    onClick() {
        this.isSelected = true;
        
        const result = {
            type: 'academy_menu',
            academy: this,
            upgrades: this.getElementalUpgradeOptions()
        };
        
        return result;
    }
    
    getElementalUpgradeOptions() {
        const options = [];
        
        // New: Add academy building upgrades first
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
        
        // Note: Gem mining is automatically unlocked at Academy Level 1
        
        return options;
    }
    
    // Get academy upgrade option
    getAcademyUpgradeOption() {
        const nextLevel = this.academyLevel + 1;
        let description = '';
        let nextUnlock = '';
        let cost = 0;
        
        switch(nextLevel) {
            case 2:
                description = 'Unlock Magic Tower Upgrades to strengthen Magic Towers with gems.';
                nextUnlock = 'Unlocks: Magic Tower Upgrades (cost elemental gems)';
                cost = 1000;
                break;
            case 3:
                description = 'Achieve maximum academy power to unlock Super Weapon Lab construction.';
                nextUnlock = 'Unlocks: Super Weapon Lab building (costs diamonds + gold)';
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
    
    // Purchase academy upgrade
    purchaseAcademyUpgrade(gameState) {
        if (this.academyLevel >= this.maxAcademyLevel) {
            return false;
        }
        
        const upgradeOption = this.getAcademyUpgradeOption();
        const cost = upgradeOption.cost;
        
        if (!gameState.canAfford(cost)) {
            return false;
        }
        
        gameState.spend(cost);
        this.academyLevel++;
        
        // Apply unlocks based on new level
        switch(this.academyLevel) {
            case 2:
                // Level 2: Magic Tower upgrades become available
                break;
            case 3:
                // Level 3: Super Weapon Lab becomes buildable
                this.superWeaponUnlocked = true;
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
        // Handle regular elemental upgrades
        const upgrade = this.elementalUpgrades[element];
        const cost = this.calculateElementalCost(element);
        
        if (!cost || upgrade.level >= upgrade.maxLevel) {
            return false;
        }
        
        // Check if player has enough gems
        if (this.gems[element] < cost) {
            return false;
        }
        
        this.gems[element] -= cost;
        upgrade.level++;
        
        return true;
    }
    
    // New: Add diamond gem
    addDiamond() {
        this.gems.diamond++;
    }
    
    // Modified: Method to research gem mining tools
    researchGemMiningTools(gameState) {
        if (this.gemMiningResearched || !gameState.canAfford(500)) {
            return false;
        }
        
        if (gameState.spend(500)) {
            this.gemMiningResearched = true;
            return true;
        }
        return false;
    }
    
    // New: Method to add gems (called by mines)
    addGem(gemType) {
        if (this.gems.hasOwnProperty(gemType)) {
            this.gems[gemType]++;
        }
    }
    
    deselect() {
        this.isSelected = false;
    }
    
    applyEffect(buildingManager) {
        // Academy provides elemental research
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
                return false;
        }
        
        return true;
    }
}
