import { Building } from './Building.js';

export class SuperWeaponLab extends Building {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY, 4);
        this.chargeLevel = 0;
        this.maxCharge = 100;
        this.isCharging = true;
        this.energyBeams = [];
        this.isSelected = false;
        this.crystals = [];
        this.arcLightning = [];
        this.nextLightningTime = 0;
        
        // New: Initialize forgeLevel to match other buildings
        this.forgeLevel = 1;
        this.maxForgeLevel = 1;
        
        // Initialize crystals at fixed positions around the building
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            this.crystals.push({
                angle: angle,
                x: Math.cos(angle) * 40,
                y: Math.sin(angle) * 40,
                size: 8,
                pulse: Math.random() * Math.PI * 2
            });
        }
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Charge the super weapon
        if (this.isCharging && this.chargeLevel < this.maxCharge) {
            this.chargeLevel += deltaTime * 15; // ~6.7 seconds to full charge
            if (this.chargeLevel >= this.maxCharge) {
                this.chargeLevel = this.maxCharge;
            }
        }
        
        // Generate arc lightning between crystals
        this.nextLightningTime -= deltaTime;
        if (this.nextLightningTime <= 0 && this.chargeLevel > 30) {
            const crystal1 = this.crystals[Math.floor(Math.random() * this.crystals.length)];
            const crystal2 = this.crystals[Math.floor(Math.random() * this.crystals.length)];
            
            if (crystal1 !== crystal2) {
                this.arcLightning.push({
                    x1: this.x + crystal1.x,
                    y1: this.y + crystal1.y,
                    x2: this.x + crystal2.x,
                    y2: this.y + crystal2.y,
                    life: 0.15,
                    maxLife: 0.15,
                    intensity: Math.random() * 0.5 + 0.5
                });
            }
            this.nextLightningTime = 0.3 + Math.random() * 0.4;
        }
        
        // Update lightning arcs
        this.arcLightning = this.arcLightning.filter(arc => {
            arc.life -= deltaTime;
            return arc.life > 0;
        });
    }
    
    render(ctx, size) {
        // Render the main laboratory structure
        this.renderLabStructure(ctx, size);
        
        // Render enchanted crystals
        this.renderCrystals(ctx, size);
        
        // Render arc lightning between crystals
        this.renderLightningArcs(ctx, size);
        
        // Render energy core and charge bar
        this.renderEnergyCore(ctx, size);
        
        // Upgrade indicator when selected
        if (this.isSelected) {
            ctx.fillStyle = '#00FFFF';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚡', this.x, this.y + size/2 + 20);
        }
        
        // Floating icon in bottom right of 4x4 grid
        const cellSize = size / 4;
        const iconSize = 30;
        const iconX = (this.gridX + 3.5) * cellSize;
        const iconY = (this.gridY + 3.5) * cellSize - 5;
        
        // Dynamic pulse for energy glow effect
        const pulseIntensity = 0.85 + 0.15 * Math.sin(this.animationTime * 4);
        
        // Enhanced shadow for floating effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(iconX - iconSize/2 + 3, iconY - iconSize/2 + 3, iconSize, iconSize);
        
        // Energy parchment background with cyan gradient
        const parchmentGradient = ctx.createRadialGradient(
            iconX - iconSize/4, iconY - iconSize/4, 0,
            iconX, iconY, iconSize
        );
        parchmentGradient.addColorStop(0, `rgba(173, 216, 230, ${pulseIntensity})`); // Light blue parchment
        parchmentGradient.addColorStop(0.7, `rgba(64, 224, 208, ${pulseIntensity * 0.9})`); // Turquoise parchment
        parchmentGradient.addColorStop(1, `rgba(0, 206, 209, ${pulseIntensity * 0.8})`); // Dark turquoise parchment
        
        ctx.fillStyle = parchmentGradient;
        ctx.fillRect(iconX - iconSize/2, iconY - iconSize/2, iconSize, iconSize);
        
        // Ornate border with energy styling
        ctx.strokeStyle = `rgba(0, 255, 255, ${pulseIntensity})`; // Cyan
        ctx.lineWidth = 2;
        ctx.strokeRect(iconX - iconSize/2, iconY - iconSize/2, iconSize, iconSize);
        
        // Inner accent border
        ctx.strokeStyle = `rgba(255, 255, 255, ${pulseIntensity * 0.8})`; // White
        ctx.lineWidth = 1;
        ctx.strokeRect(iconX - iconSize/2 + 2, iconY - iconSize/2 + 2, iconSize - 4, iconSize - 4);
        
        // Energy glow effect
        const glowGradient = ctx.createRadialGradient(iconX, iconY, 0, iconX, iconY, iconSize * 1.5);
        glowGradient.addColorStop(0, `rgba(0, 255, 255, ${pulseIntensity * 0.3})`);
        glowGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(iconX - iconSize/2 - 5, iconY - iconSize/2 - 5, iconSize + 10, iconSize + 10);
        
        // Symbol with energy styling
        ctx.fillStyle = `rgba(0, 100, 200, ${pulseIntensity})`;
        ctx.font = 'bold 18px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚙️', iconX, iconY);
        
        // Add subtle cyan highlight on symbol
        ctx.fillStyle = `rgba(0, 255, 255, ${pulseIntensity * 0.4})`;
        ctx.fillText('⚙️', iconX, iconY);
    }
    
    renderLabStructure(ctx, size) {
        const baseWidth = size * 0.85;
        const baseHeight = size * 0.7;
        const wallHeight = size * 0.4;
        
        // Main laboratory walls (dark metal/stone)
        const wallGradient = ctx.createLinearGradient(
            this.x - baseWidth/2, this.y - wallHeight,
            this.x + baseWidth/4, this.y
        );
        wallGradient.addColorStop(0, '#36454F');
        wallGradient.addColorStop(0.5, '#2F4F4F');
        wallGradient.addColorStop(1, '#1C1C1C');
        
        ctx.fillStyle = wallGradient;
        ctx.fillRect(this.x - baseWidth/2, this.y - wallHeight, baseWidth, wallHeight);
        
        // Reinforced metal plating pattern
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        const plateSize = baseWidth / 6;
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 6; col++) {
                const plateX = this.x - baseWidth/2 + col * plateSize;
                const plateY = this.y - wallHeight + row * (wallHeight/4);
                ctx.strokeRect(plateX, plateY, plateSize - 2, wallHeight/4 - 1);
            }
        }
        
        // Central observation dome
        const domeRadius = size * 0.2;
        const domeGradient = ctx.createRadialGradient(
            this.x, this.y - wallHeight * 0.5, 0,
            this.x, this.y - wallHeight * 0.5, domeRadius
        );
        domeGradient.addColorStop(0, 'rgba(100, 200, 255, 0.6)');
        domeGradient.addColorStop(1, 'rgba(50, 150, 220, 0.3)');
        
        ctx.fillStyle = domeGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y - wallHeight * 0.5, domeRadius, 0, Math.PI, true);
        ctx.fill();
        
        // Dome frame
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y - wallHeight * 0.5, domeRadius, 0, Math.PI, true);
        ctx.stroke();
        
        // Dome cross sections
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI;
            const x = this.x + Math.cos(angle) * domeRadius;
            const y = this.y - wallHeight * 0.5 + Math.sin(angle) * domeRadius;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - wallHeight * 0.5);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
        
        // Tower spires with energy receivers
        const spireHeight = size * 0.35;
        const spirePositions = [
            { x: this.x - baseWidth * 0.3, y: this.y - wallHeight },
            { x: this.x + baseWidth * 0.3, y: this.y - wallHeight }
        ];
        
        spirePositions.forEach(spire => {
            // Spire shaft
            const spireGradient = ctx.createLinearGradient(spire.x - 8, spire.y - spireHeight, spire.x + 8, spire.y);
            spireGradient.addColorStop(0, '#1C1C1C');
            spireGradient.addColorStop(0.5, '#505050');
            spireGradient.addColorStop(1, '#1C1C1C');
            
            ctx.fillStyle = spireGradient;
            ctx.fillRect(spire.x - 8, spire.y - spireHeight, 16, spireHeight);
            
            // Spire ribbing
            ctx.strokeStyle = '#00FFFF';
            ctx.lineWidth = 1;
            for (let i = 0; i < 5; i++) {
                const y = spire.y - spireHeight + (i * spireHeight / 5);
                ctx.beginPath();
                ctx.moveTo(spire.x - 8, y);
                ctx.lineTo(spire.x + 8, y);
                ctx.stroke();
            }
            
            // Energy receiver antenna
            ctx.strokeStyle = '#00FFFF';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(spire.x - 6, spire.y - spireHeight - 5);
            ctx.lineTo(spire.x, spire.y - spireHeight - 15);
            ctx.lineTo(spire.x + 6, spire.y - spireHeight - 5);
            ctx.stroke();
            
            // Antenna glow
            const antennaGlow = ctx.createRadialGradient(spire.x, spire.y - spireHeight - 10, 0, spire.x, spire.y - spireHeight - 10, 10);
            antennaGlow.addColorStop(0, 'rgba(0, 255, 255, 0.4)');
            antennaGlow.addColorStop(1, 'rgba(0, 255, 255, 0)');
            ctx.fillStyle = antennaGlow;
            ctx.beginPath();
            ctx.arc(spire.x, spire.y - spireHeight - 10, 10, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    renderCrystals(ctx, size) {
        this.crystals.forEach((crystal, index) => {
            const x = this.x + crystal.x;
            const y = this.y + crystal.y;
            
            // Crystal pulse
            const pulse = Math.sin(this.animationTime * 3 + crystal.pulse) * 0.3 + 0.7;
            const crystalSize = crystal.size * pulse;
            
            // Crystal body
            ctx.fillStyle = `rgba(0, 255, 255, ${pulse})`;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(this.animationTime + index);
            
            // Octagonal crystal shape
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const cx = Math.cos(angle) * crystalSize;
                const cy = Math.sin(angle) * crystalSize;
                if (i === 0) {
                    ctx.moveTo(cx, cy);
                } else {
                    ctx.lineTo(cx, cy);
                }
            }
            ctx.closePath();
            ctx.fill();
            
            // Crystal highlight
            ctx.strokeStyle = `rgba(255, 255, 255, ${pulse * 0.6})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.restore();
            
            // Crystal energy core
            const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, crystalSize * 1.5);
            coreGradient.addColorStop(0, `rgba(100, 200, 255, ${pulse * 0.3})`);
            coreGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
            ctx.fillStyle = coreGradient;
            ctx.beginPath();
            ctx.arc(x, y, crystalSize * 1.5, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    renderLightningArcs(ctx, size) {
        this.arcLightning.forEach(arc => {
            const alpha = (arc.life / arc.maxLife) * arc.intensity;
            
            // Main lightning bolt
            ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // Draw jagged lightning
            ctx.beginPath();
            ctx.moveTo(arc.x1, arc.y1);
            
            const segments = 8;
            for (let i = 1; i < segments; i++) {
                const t = i / segments;
                const x = arc.x1 + (arc.x2 - arc.x1) * t + (Math.random() - 0.5) * 15;
                const y = arc.y1 + (arc.y2 - arc.y1) * t + (Math.random() - 0.5) * 15;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(arc.x2, arc.y2);
            ctx.stroke();
            
            // Lightning glow
            ctx.strokeStyle = `rgba(100, 200, 255, ${alpha * 0.5})`;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(arc.x1, arc.y1);
            ctx.lineTo(arc.x2, arc.y2);
            ctx.stroke();
        });
    }
    
    renderEnergyCore(ctx, size) {
        // Central energy orb
        const orbSize = Math.sin(this.animationTime * 4) * 5 + 15;
        const chargeRatio = this.chargeLevel / this.maxCharge;
        
        // Core gradient
        const coreGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, orbSize);
        coreGradient.addColorStop(0, `rgba(255, 255, 200, ${chargeRatio})`);
        coreGradient.addColorStop(0.5, `rgba(0, 200, 255, ${chargeRatio * 0.8})`);
        coreGradient.addColorStop(1, 'rgba(0, 100, 255, 0)');
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, orbSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Core outline
        ctx.strokeStyle = `rgba(0, 255, 255, ${chargeRatio})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, orbSize, 0, Math.PI * 2);
        ctx.stroke();
        
        // Charge bar
        const barWidth = size * 0.8;
        const barHeight = 10;
        const barY = this.y + size/2 + 5;
        
        // Bar background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(this.x - barWidth/2, barY, barWidth, barHeight);
        
        // Bar border
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - barWidth/2, barY, barWidth, barHeight);
        
        // Charge fill
        const fillGradient = ctx.createLinearGradient(this.x - barWidth/2, barY, this.x + barWidth/2, barY);
        fillGradient.addColorStop(0, '#00FFFF');
        fillGradient.addColorStop(0.5, '#00FF00');
        fillGradient.addColorStop(1, '#FFFF00');
        
        ctx.fillStyle = fillGradient;
        ctx.fillRect(this.x - barWidth/2, barY, barWidth * chargeRatio, barHeight);
        
        // Charge percentage text
        ctx.fillStyle = '#00FFFF';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(chargeRatio * 100)}%`, this.x, barY + barHeight + 15);
    }
    
    isPointInside(x, y, size) {
        // Calculate icon position and size for precise click detection
        const cellSize = size / 4;
        const iconSize = 30;
        const iconX = (this.gridX + 3.5) * cellSize;
        const iconY = (this.gridY + 3.5) * cellSize - 5;
        
        // Check if the point is within the icon's bounds
        return x >= iconX - iconSize/2 && x <= iconX + iconSize/2 &&
               y >= iconY - iconSize/2 && y <= iconY + iconSize/2;
    }
    
    onClick() {
        this.isSelected = true;
        return {
            type: 'superweapon_menu',
            building: this,
            chargeLevel: this.chargeLevel,
            maxCharge: this.maxCharge,
            description: 'Super Weapon Lab - Ultimate tower charging in progress'
        };
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
            description: 'Advanced laboratory with mystical machinery. Harnesses elemental power.',
            effect: 'Ultimate weapon unlocked',
            size: '4x4',
            cost: 1000
        };
    }
}
