import { Building } from './Building.js';

export class DiamondPress extends Building {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY, 2);
        this.isSelected = false;
        this.magicParticles = [];
        this.pressRotation = 0;
        this.pressIntensity = 0;
        this.gemPulseTimer = 0;
        this.floatingTexts = [];
    }

    update(deltaTime) {
        super.update(deltaTime);

        // Rotate the press smoothly
        this.pressRotation += deltaTime * 1.5;
        if (this.pressRotation > Math.PI * 2) {
            this.pressRotation -= Math.PI * 2;
        }

        // Pulsing intensity for magical effect
        this.pressIntensity = Math.sin(this.animationTime * 3) * 0.5 + 0.5;

        // Generate magical particles
        this.gemPulseTimer += deltaTime;
        if (this.gemPulseTimer > 0.2) {
            this.gemPulseTimer = 0;
            if (Math.random() < 0.6) {
                const angle = Math.random() * Math.PI * 2;
                const radius = 20;
                this.magicParticles.push({
                    x: this.x + Math.cos(angle) * radius,
                    y: this.y + Math.sin(angle) * radius,
                    vx: Math.cos(angle) * 30,
                    vy: Math.sin(angle) * 30,
                    life: 1.0,
                    maxLife: 1.0,
                    size: Math.random() * 2 + 1,
                    color: ['fire', 'water', 'air', 'earth'][Math.floor(Math.random() * 4)]
                });
            }
        }

        // Update magic particles
        this.magicParticles = this.magicParticles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            particle.vy += 40 * deltaTime; // gravity
            particle.size = Math.max(0, particle.size - deltaTime * 2);
            return particle.life > 0 && particle.size > 0;
        });

        // Update floating text
        this.floatingTexts = this.floatingTexts.filter(text => {
            text.y -= deltaTime * 30;
            text.life -= deltaTime;
            return text.life > 0;
        });
    }

    render(ctx, size) {
        const cellSize = this.getCellSize(ctx);
        // For 2x2 building, use proper scale
        const buildingSize = cellSize * 2 * 1.2; // Slightly oversized for visibility
        const centerX = this.x;
        const centerY = this.y;

        // Draw the press machine
        this.renderPressMachine(ctx, centerX, centerY, buildingSize, cellSize);

        // Render magic particles (gem conversion effects)
        this.renderMagicParticles(ctx);

        // Render floating text
        this.renderFloatingText(ctx);
    }

    renderPressMachine(ctx, centerX, centerY, size, cellSize) {
        // Draw rigid industrial hydraulic press machine with enhanced details and structure
        
        // Base/Foundation platform
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(centerX - size / 2, centerY + size * 0.38, size, size * 0.18);
        
        // Base platform edge highlight
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(centerX - size / 2, centerY + size * 0.38, size, size * 0.03);
        
        // Base platform shadow
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(centerX - size / 2, centerY + size * 0.50, size, size * 0.06);
        
        // Feet/support legs
        const footWidth = size * 0.08;
        const footHeight = size * 0.12;
        const footPositions = [
            { x: centerX - size * 0.32, label: 'left-front' },
            { x: centerX + size * 0.24, label: 'right-front' }
        ];
        
        footPositions.forEach(foot => {
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(foot.x - footWidth / 2, centerY + size * 0.38, footWidth, footHeight);
            ctx.fillStyle = '#3a3a3a';
            ctx.fillRect(foot.x - footWidth / 2 + size * 0.01, centerY + size * 0.38 + size * 0.03, footWidth - size * 0.02, size * 0.06);
        });
        
        // Large left vertical support column - I-beam style with more detail
        const colWidth = size * 0.14;
        const colHeight = size * 1.05;
        ctx.fillStyle = '#2a3a4a';
        ctx.fillRect(centerX - size * 0.36, centerY - colHeight / 2 + size * 0.05, colWidth, colHeight);
        
        // I-beam cross member (middle of left column)
        ctx.fillStyle = '#3a4a5a';
        ctx.fillRect(centerX - size * 0.42, centerY - size * 0.08, size * 0.12, size * 0.16);
        
        // Left column highlight (metal shine)
        ctx.fillStyle = '#5a7a8a';
        ctx.fillRect(centerX - size * 0.36 + size * 0.02, centerY - colHeight / 2 + size * 0.05, size * 0.04, colHeight);
        
        // Left column shadow
        ctx.fillStyle = '#1a2a3a';
        ctx.fillRect(centerX - size * 0.36 + colWidth - size * 0.03, centerY - colHeight / 2 + size * 0.05, size * 0.03, colHeight);
        
        // Large right vertical support column - I-beam style with more detail
        ctx.fillStyle = '#2a3a4a';
        ctx.fillRect(centerX + size * 0.22, centerY - colHeight / 2 + size * 0.05, colWidth, colHeight);
        
        // I-beam cross member (middle of right column)
        ctx.fillStyle = '#3a4a5a';
        ctx.fillRect(centerX + size * 0.30, centerY - size * 0.08, size * 0.12, size * 0.16);
        
        // Right column highlight (metal shine)
        ctx.fillStyle = '#5a7a8a';
        ctx.fillRect(centerX + size * 0.22 + size * 0.02, centerY - colHeight / 2 + size * 0.05, size * 0.04, colHeight);
        
        // Right column shadow
        ctx.fillStyle = '#1a2a3a';
        ctx.fillRect(centerX + size * 0.22 + colWidth - size * 0.03, centerY - colHeight / 2 + size * 0.05, size * 0.03, colHeight);
        
        // Top horizontal crossbeam connecting columns - thicker and more rigid
        const beamWidth = size * 0.62;
        ctx.fillStyle = '#3a4a5a';
        ctx.fillRect(centerX - beamWidth / 2, centerY - size * 0.42, beamWidth, size * 0.1);
        
        // Beam 3D effect - beveled edges
        ctx.fillStyle = '#5a6a7a';
        ctx.fillRect(centerX - beamWidth / 2, centerY - size * 0.42, beamWidth, size * 0.03);
        
        ctx.fillStyle = '#2a3a4a';
        ctx.fillRect(centerX - beamWidth / 2, centerY - size * 0.32, beamWidth, size * 0.02);
        
        // Middle horizontal beam (support) - more prominent
        ctx.fillStyle = '#3a4a5a';
        ctx.fillRect(centerX - beamWidth / 2, centerY - size * 0.1, beamWidth, size * 0.08);
        
        // Middle beam highlight
        ctx.fillStyle = '#5a6a7a';
        ctx.fillRect(centerX - beamWidth / 2, centerY - size * 0.1, beamWidth, size * 0.03);
        
        // Main work chamber - large solid steel box in center
        const chamberWidth = size * 0.54;
        const chamberHeight = size * 0.48;
        const chamberTop = centerY - chamberHeight / 2;
        
        // Chamber main body
        ctx.fillStyle = '#5a6a7a';
        ctx.fillRect(centerX - chamberWidth / 2, chamberTop, chamberWidth, chamberHeight);
        
        // Chamber 3D effect - darker right edge (depth)
        ctx.fillStyle = '#3a4a5a';
        ctx.fillRect(centerX + chamberWidth / 2 - size * 0.05, chamberTop, size * 0.05, chamberHeight);
        
        // Chamber top darker
        ctx.fillStyle = '#4a5a6a';
        ctx.fillRect(centerX - chamberWidth / 2, chamberTop, chamberWidth, size * 0.06);
        
        // Chamber bottom lighter (reflection)
        ctx.fillStyle = '#7a8a9a';
        ctx.fillRect(centerX - chamberWidth / 2, chamberTop + chamberHeight - size * 0.06, chamberWidth, size * 0.06);
        
        // Chamber interior grid pattern (grating)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const step = chamberWidth / 4;
            ctx.beginPath();
            ctx.moveTo(centerX - chamberWidth / 2 + step * i, chamberTop + size * 0.06);
            ctx.lineTo(centerX - chamberWidth / 2 + step * i, chamberTop + chamberHeight - size * 0.06);
            ctx.stroke();
        }
        
        // Top hydraulic piston/pressing plate - animated with motion that hits the bottom
        const strokeIntensity = Math.sin(this.animationTime * 2.2) * 0.5 + 0.5; // Slower animation (2.2 instead of 3.5)
        const plateThickness = size * 0.08;
        const pressStroke = (strokeIntensity * 0.30 - 0.15) * size; // Larger stroke for proper compression
        const plateY = chamberTop + size * 0.18 + pressStroke; // Start lower, finish much lower
        
        // Piston rod guide (surrounds the rod)
        ctx.fillStyle = '#2a3a4a';
        ctx.fillRect(centerX - size * 0.1, plateY - plateThickness - size * 0.17, size * 0.2, size * 0.17);
        
        // Piston rod (dark metal cylinder)
        const rodX = centerX;
        const rodY = plateY - plateThickness - size * 0.15;
        ctx.fillStyle = '#2a3a4a';
        ctx.fillRect(rodX - size * 0.07, rodY, size * 0.14, size * 0.15);
        
        // Rod highlight
        ctx.fillStyle = '#6a7a8a';
        ctx.fillRect(rodX - size * 0.07 + size * 0.02, rodY + size * 0.02, size * 0.10, size * 0.11);
        
        // Rod shadow
        ctx.fillStyle = '#1a2a3a';
        ctx.fillRect(rodX + size * 0.05, rodY + size * 0.02, size * 0.02, size * 0.11);
        
        // Top pressing plate - polished steel with gradient
        const plateGrad = ctx.createLinearGradient(0, plateY - plateThickness, 0, plateY);
        plateGrad.addColorStop(0, '#9aadbd');
        plateGrad.addColorStop(0.5, '#7a9aad');
        plateGrad.addColorStop(1, '#5a7a8a');
        ctx.fillStyle = plateGrad;
        ctx.fillRect(centerX - chamberWidth * 0.46, plateY - plateThickness, chamberWidth * 0.92, plateThickness);
        
        // Plate top shine (stronger when idle)
        ctx.fillStyle = `rgba(255, 255, 255, ${0.35 - strokeIntensity * 0.1})`;
        ctx.fillRect(centerX - chamberWidth * 0.46 + size * 0.03, plateY - plateThickness, chamberWidth * 0.86, size * 0.025);
        
        // Plate ridges for grip
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 5; i++) {
            const ridgeX = centerX - chamberWidth * 0.4 + (chamberWidth * 0.8 / 5) * i;
            ctx.beginPath();
            ctx.moveTo(ridgeX, plateY - plateThickness);
            ctx.lineTo(ridgeX, plateY);
            ctx.stroke();
        }
        
        // Hydraulic cylinders visualization (sides) - more detailed
        const cylY = chamberTop + size * 0.15;
        
        // Left cylinder
        ctx.fillStyle = '#2a3a4a';
        ctx.fillRect(centerX - size * 0.32, cylY - size * 0.04, size * 0.09, size * 0.08);
        ctx.fillStyle = '#5a6a7a';
        ctx.fillRect(centerX - size * 0.32 + size * 0.01, cylY - size * 0.035, size * 0.07, size * 0.07);
        
        // Left cylinder rod indicator (shows compression)
        const rodCompression = (1 - strokeIntensity) * size * 0.04;
        ctx.fillStyle = '#1a2a3a';
        ctx.fillRect(centerX - size * 0.32 + size * 0.01, cylY - size * 0.035 + rodCompression, size * 0.07, size * 0.02);
        
        // Right cylinder
        ctx.fillStyle = '#2a3a4a';
        ctx.fillRect(centerX + size * 0.23, cylY - size * 0.04, size * 0.09, size * 0.08);
        ctx.fillStyle = '#5a6a7a';
        ctx.fillRect(centerX + size * 0.23 + size * 0.01, cylY - size * 0.035, size * 0.07, size * 0.07);
        
        // Right cylinder rod indicator (shows compression)
        ctx.fillStyle = '#1a2a3a';
        ctx.fillRect(centerX + size * 0.23 + size * 0.01, cylY - size * 0.035 + rodCompression, size * 0.07, size * 0.02);
        
        // Input hopper/funnel on top left (Fire element)
        ctx.fillStyle = 'rgba(255, 100, 0, 0.2)';
        ctx.beginPath();
        ctx.moveTo(centerX - size * 0.25, chamberTop - size * 0.1);
        ctx.lineTo(centerX - size * 0.14, chamberTop - size * 0.1);
        ctx.lineTo(centerX - size * 0.11, chamberTop);
        ctx.lineTo(centerX - size * 0.28, chamberTop);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ff6400';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = '#ff6400';
        ctx.font = `bold ${Math.floor(size * 0.08)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔥', centerX - size * 0.205, chamberTop - size * 0.05);
        
        // Input hopper/funnel on top middle (Water element)
        ctx.fillStyle = 'rgba(100, 150, 255, 0.2)';
        ctx.beginPath();
        ctx.moveTo(centerX - size * 0.09, chamberTop - size * 0.1);
        ctx.lineTo(centerX + size * 0.09, chamberTop - size * 0.1);
        ctx.lineTo(centerX + size * 0.06, chamberTop);
        ctx.lineTo(centerX - size * 0.06, chamberTop);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#6496ff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = '#6496ff';
        ctx.fillText('💧', centerX, chamberTop - size * 0.05);
        
        // Input hopper/funnel on top right (Air element)
        ctx.fillStyle = 'rgba(200, 200, 255, 0.2)';
        ctx.beginPath();
        ctx.moveTo(centerX + size * 0.14, chamberTop - size * 0.1);
        ctx.lineTo(centerX + size * 0.25, chamberTop - size * 0.1);
        ctx.lineTo(centerX + size * 0.28, chamberTop);
        ctx.lineTo(centerX + size * 0.11, chamberTop);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#c8c8ff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = '#c8c8ff';
        ctx.fillText('💨', centerX + size * 0.205, chamberTop - size * 0.05);
        
        // Output collection slot at bottom
        const outSlotY = chamberTop + chamberHeight + size * 0.08;
        ctx.fillStyle = 'rgba(100, 200, 255, 0.25)';
        ctx.fillRect(centerX - size * 0.22, outSlotY, size * 0.44, size * 0.1);
        
        // Output slot 3D effect
        ctx.strokeStyle = '#64c8ff';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(centerX - size * 0.22, outSlotY, size * 0.44, size * 0.1);
        
        // Output slot highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(centerX - size * 0.22, outSlotY, size * 0.44, size * 0.03);
        
        // Slot label and gem icon
        ctx.fillStyle = '#64c8ff';
        ctx.font = `bold ${Math.floor(size * 0.06)}px Arial`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('Output:', centerX - size * 0.01, outSlotY + size * 0.05);
        
        ctx.font = `bold ${Math.floor(size * 0.14)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💎', centerX + size * 0.14, outSlotY + size * 0.05);
        
        // Spark effects on pressing action - less frequent
        if (strokeIntensity > 0.75) {
            this.renderPressSparkles(ctx, centerX, plateY, size * 0.45, Math.max(0, strokeIntensity - 0.75) * 4.0);
        }
        
        // Selection highlight
        if (this.isSelected) {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 3;
            ctx.strokeRect(centerX - size / 2 - size * 0.08, centerY - size / 2.25, size * 1.16, size * 1.2);
        }
    }

    renderPressSparkles(ctx, plateCenterX, plateY, plateWidth, intensity) {
        // Create spark effects along the press strike zone
        const sparkCount = Math.floor(intensity * 8) + 2;
        for (let i = 0; i < sparkCount; i++) {
            const sparkX = plateCenterX + (Math.random() - 0.5) * plateWidth;
            const sparkY = plateY + Math.random() * 10;
            const sparkVelocity = 30 + Math.random() * 60;
            
            // Spark trail
            ctx.fillStyle = `rgba(255, ${100 + Math.random() * 155}, 0, ${intensity * 0.8})`;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Glow around spark
            ctx.fillStyle = `rgba(255, 150, 0, ${intensity * 0.3})`;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderMagicParticles(ctx) {
        this.magicParticles.forEach(particle => {
            const colorMap = {
                fire: `rgba(255, 100, 0, ${particle.life / particle.maxLife})`,
                water: `rgba(100, 150, 255, ${particle.life / particle.maxLife})`,
                air: `rgba(200, 200, 255, ${particle.life / particle.maxLife})`,
                earth: `rgba(100, 200, 100, ${particle.life / particle.maxLife})`
            };

            ctx.fillStyle = colorMap[particle.color] || colorMap.fire;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    renderFloatingText(ctx) {
        this.floatingTexts.forEach(text => {
            ctx.fillStyle = `rgba(255, 255, 255, ${text.life / text.maxLife})`;
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(text.text, text.x, text.y);
        });
    }

    exchangeGems(gemCounts) {
        // Check if player has 3 of each elemental gem
        if (gemCounts.fire >= 3 && gemCounts.water >= 3 && gemCounts.air >= 3 && gemCounts.earth >= 3) {
            this.floatingTexts.push({
                x: this.x,
                y: this.y - 40,
                text: '+1 💎',
                life: 1.5,
                maxLife: 1.5
            });
            return true;
        }
        return false;
    }

    onClick() {
        this.isSelected = true;
        return {
            type: 'diamond_press_menu',
            diamondPress: this
        };
    }

    deselect() {
        this.isSelected = false;
    }

    static getInfo() {
        return {
            name: 'Diamond Press',
            description: 'Exchanges elemental gems for diamonds',
            effect: '3 of each gem → 1 diamond',
            size: '2x2',
            cost: 500,
            unlocker: 'SuperWeapon Lab (Level 2)'
        };
    }
}
