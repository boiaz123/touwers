import { BaseEnemy } from './BaseEnemy.js';

export class BeefyEnemy extends BaseEnemy {
    static BASE_STATS = {
        health: 150,
        speed: 60,
        armour: 5,
        magicResistance: 0
    };

    constructor(path, health_multiplier = 1.0, speed = null, armour = null, magicResistance = null) {
        const baseStats = BeefyEnemy.BASE_STATS;
        const actualSpeed = speed !== null ? speed : baseStats.speed;
        const actualArmour = armour !== null ? armour : baseStats.armour;
        const actualMagicResistance = magicResistance !== null ? magicResistance : baseStats.magicResistance;
        
        super(path, baseStats.health * health_multiplier, actualSpeed, actualArmour, actualMagicResistance);
        this.tunicColor = this.getRandomTunicColor();
        this.sizeMultiplier = 1.2;
        
        this.attackDamage = 9;
        this.attackSpeed = 0.8;
        
        // Rendering optimization: Cache pre-calculated values
        this.cachedBaseSize = null;
        this.cachedColorVariants = this.getColorVariants();
        
        // Pre-calculate colors to avoid repeated color manipulation
        this.darkenedTunic = this.darkenColor(this.tunicColor, 0.25);
        
        // Cache for armor rivets positions (relative to baseSize)
        this.rivetPositions = [];
        for (let i = -1; i <= 1; i++) {
            for (let j = 0; j < 3; j++) {
                this.rivetPositions.push({ i, j });
            }
        }
        
        // Performance tracking for health bar rendering
        this.lastDamageTime = null;
        
    }
    
    getRandomTunicColor() {
        const tunicColors = [
            '#5C2E0F', '#1A3A52', '#8B0000', '#1C1C1C', '#2D3E1F', '#4B0082'
        ];
        return tunicColors[Math.floor(Math.random() * tunicColors.length)];
    }
    
    getColorVariants() {
        // Pre-calculate all color variants to avoid repeated calculations
        return {
            headSkin: '#C4A575',
            headGradientLight: '#E8D4B8',
            headGradientMid: '#DDBEA9',
            headGradientDark: '#C9A876',
            headStroke: '#B8956A',
            helmetLight: '#606060',
            helmetMid: '#4a4a4a',
            helmetDark: '#3a3a3a',
            helmetNose: '#4a4a4a',
            helmetOutline: '#2F2F2F',
            skinTone: '#E8D4B8',
            gauntlet: '#4a4a4a',
            gauntletStroke: '#2F2F2F',
            swordLight: '#A9A9A9',
            swordMid: '#C0C0C0',
            swordDark: '#808080',
            guardGold: '#D4AF37',
            guardGoldStroke: '#8B7500',
            bootColor: '#0a0a0a',
            legStroke: '#2F2F2F'
        };
    }
    
    render(ctx) {
        const baseSize = Math.max(7.2, Math.min(16.8, ctx.canvas.width / 150)) * this.sizeMultiplier;
        
        // Use cached baseSize if possible to avoid recalculation
        if (this.cachedBaseSize !== baseSize) {
            this.cachedBaseSize = baseSize;
        }
        
        // Apply phase offset for animation diversity - slower for beefier enemies
        const animTime = (this.animationTime * 6.5 + this.animationPhaseOffset); // Slightly slower animation for beefier feel
        const walkCycle = Math.sin(animTime) * 0.5;
        const bobAnimation = Math.sin(animTime) * 0.3;
        
        const armSwingFreq = animTime;
        const leftArmBase = Math.sin(armSwingFreq) * 0.6;
        const leftArmBend = Math.sin(armSwingFreq * 2) * 0.15;
        const rightArmBase = Math.sin(armSwingFreq + Math.PI) * 0.55;
        const rightArmBend = Math.sin(armSwingFreq * 2 + Math.PI / 3) * 0.18;
        
        // Enemy shadow - larger
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + baseSize * 1.6, baseSize * 1.0, baseSize * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.save();
        ctx.translate(this.x, this.y + bobAnimation);
        
        // Back/depth layer - removed for performance (shadow is enough)
        // ctx.fillStyle = this.darkenedTunic;
        // ctx.fillRect(-baseSize * 0.72, -baseSize * 0.82, baseSize * 1.44, baseSize * 1.2);
        
        // Main tunic/body - simplified but still looks good
        ctx.fillStyle = this.tunicColor;
        ctx.fillRect(-baseSize * 0.68, -baseSize * 0.88, baseSize * 1.36, baseSize * 1.32);
        
        // Simple outline instead of gradient for performance
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1.0;
        ctx.strokeRect(-baseSize * 0.68, -baseSize * 0.88, baseSize * 1.36, baseSize * 1.32);
        
        // Center seam - simplified
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, -baseSize * 0.88);
        ctx.lineTo(0, baseSize * 0.44);
        ctx.stroke();
        
        // Armor chest plate - simplified
        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(-baseSize * 0.6, -baseSize * 0.7, baseSize * 1.2, baseSize * 0.9);
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(-baseSize * 0.6, -baseSize * 0.7, baseSize * 1.2, baseSize * 0.9);
        
        // Armor rivets - pre-calculated
        ctx.fillStyle = '#3a3a3a';
        const baseRivetRadius = 0.7;
        for (const rivet of this.rivetPositions) {
            ctx.beginPath();
            ctx.arc(
                rivet.i * baseSize * 0.35,
                -baseSize * 0.5 + rivet.j * baseSize * 0.35,
                baseRivetRadius,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        
        // Side highlight - slightly simplified
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(-baseSize * 0.62, -baseSize * 0.8, baseSize * 0.25, baseSize * 0.95);
        
        // --- HEAD WITH SIMPLE SHADING ---
        
        ctx.fillStyle = this.cachedColorVariants.headSkin;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.35, baseSize * 0.58, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = this.cachedColorVariants.headStroke;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.35, baseSize * 0.58, 0, Math.PI * 2);
        ctx.stroke();
        
        // --- HELMET - simplified but still looks intimidating ---
        
        ctx.fillStyle = this.cachedColorVariants.helmetMid;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.35, baseSize * 0.7, Math.PI * 0.92, Math.PI * 2.08);
        ctx.fill();
        
        // Helmet nose guard
        ctx.fillStyle = this.cachedColorVariants.helmetNose;
        ctx.fillRect(-baseSize * 0.12, -baseSize * 1.3, baseSize * 0.24, baseSize * 0.45);
        
        ctx.strokeStyle = this.cachedColorVariants.helmetOutline;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.7, -baseSize * 1.35);
        ctx.lineTo(baseSize * 0.7, -baseSize * 1.35);
        ctx.stroke();
        
        // Helmet highlight - simplified
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.2, -baseSize * 1.52, baseSize * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // --- LEFT ARM ---
        
        const leftShoulderX = -baseSize * 0.56;
        const leftShoulderY = -baseSize * 0.4;
        
        const leftSwingForward = leftArmBase;
        const leftArmDropAmount = -leftSwingForward * 0.7;
        const leftArmForwardOffset = leftSwingForward * 0.3;
        
        const leftElbowX = leftShoulderX + leftArmForwardOffset * baseSize * 0.45;
        const leftElbowY = leftShoulderY + baseSize * 0.52 + leftArmDropAmount * baseSize * 0.35;
        
        const leftWristX = leftElbowX + leftArmForwardOffset * baseSize * 0.4;
        const leftWristY = leftElbowY + (baseSize * 0.68 + leftArmBend * baseSize * 0.17);
        
        // Simplified arm drawing - fewer calls
        ctx.strokeStyle = this.cachedColorVariants.skinTone;
        ctx.lineWidth = baseSize * 0.32;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(leftShoulderX, leftShoulderY);
        ctx.lineTo(leftElbowX, leftElbowY);
        ctx.lineTo(leftWristX, leftWristY);
        ctx.stroke();
        
        // Left hand - simplified
        ctx.fillStyle = 'rgba(221, 190, 169, 0.95)';
        ctx.beginPath();
        ctx.arc(leftWristX, leftWristY, baseSize * 0.16, 0, Math.PI * 2);
        ctx.fill();
        
        // --- RIGHT ARM WITH SWORD ---
        
        const rightShoulderX = baseSize * 0.56;
        const rightShoulderY = -baseSize * 0.4;
        
        const rightSwingForward = rightArmBase;
        const rightArmDropAmount = -rightSwingForward * 0.7;
        const rightArmForwardOffset = rightSwingForward * 0.3;
        
        const rightElbowX = rightShoulderX + rightArmForwardOffset * baseSize * 0.45;
        const rightElbowY = rightShoulderY + baseSize * 0.52 + rightArmDropAmount * baseSize * 0.35;
        
        const rightWristX = rightElbowX + rightArmForwardOffset * baseSize * 0.4;
        const rightWristY = rightElbowY + (baseSize * 0.68 + rightArmBend * baseSize * 0.17);
        
        // Simplified right arm
        ctx.strokeStyle = this.cachedColorVariants.skinTone;
        ctx.lineWidth = baseSize * 0.32;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(rightShoulderX, rightShoulderY);
        ctx.lineTo(rightElbowX, rightElbowY);
        ctx.lineTo(rightWristX, rightWristY);
        ctx.stroke();
        
        // Right hand with gauntlet - simplified
        ctx.fillStyle = this.cachedColorVariants.gauntlet;
        ctx.beginPath();
        ctx.arc(rightWristX, rightWristY, baseSize * 0.18, 0, Math.PI * 2);
        ctx.fill();
        
        // --- SWORD - optimized ---
        
        // Sword points mostly upright with slight forward tilt
        const swordAngle = -Math.PI / 2 + 0.3;
        const swordLength = baseSize * 1.5;  // Reduced from 1.8 for better proportions
        
        const swordTipX = rightWristX + Math.cos(swordAngle) * swordLength;
        const swordTipY = rightWristY + Math.sin(swordAngle) * swordLength;
        
        // Sword blade - simplified (no shadow, no gradient)
        ctx.strokeStyle = this.cachedColorVariants.swordMid;
        ctx.lineWidth = baseSize * 0.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(rightWristX, rightWristY);
        ctx.lineTo(swordTipX, swordTipY);
        ctx.stroke();
        
        // Sword guard (crossbar) - optimized
        ctx.save();
        ctx.translate(rightWristX, rightWristY);
        ctx.rotate(swordAngle);
        ctx.fillStyle = this.cachedColorVariants.guardGold;
        ctx.fillRect(-baseSize * 0.25, -baseSize * 0.07, baseSize * 0.5, baseSize * 0.14);
        
        // Sword pommel - simplified
        ctx.fillStyle = this.cachedColorVariants.guardGold;
        ctx.beginPath();
        ctx.arc(0, baseSize * 0.15, baseSize * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // --- LEGS ---
        
        const leftHipX = -baseSize * 0.28;
        const leftHipY = baseSize * 0.38;
        
        const leftLegAngle = walkCycle * 0.35;
        const leftFootX = leftHipX + Math.sin(leftLegAngle) * baseSize * 0.8;
        const leftFootY = leftHipY + Math.cos(leftLegAngle) * baseSize * 0.9;
        
        ctx.strokeStyle = this.cachedColorVariants.legStroke;
        ctx.lineWidth = baseSize * 0.28;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(leftHipX, leftHipY);
        ctx.lineTo(leftFootX, leftFootY);
        ctx.stroke();
        
        const rightHipX = baseSize * 0.28;
        const rightHipY = baseSize * 0.38;
        
        const rightLegAngle = -walkCycle * 0.35;
        const rightFootX = rightHipX + Math.sin(rightLegAngle) * baseSize * 0.8;
        const rightFootY = rightHipY + Math.cos(rightLegAngle) * baseSize * 0.9;
        
        ctx.strokeStyle = this.cachedColorVariants.legStroke;
        ctx.lineWidth = baseSize * 0.28;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(rightHipX, rightHipY);
        ctx.lineTo(rightFootX, rightFootY);
        ctx.stroke();
        
        // --- BOOTS - simplified ---
        
        ctx.fillStyle = this.cachedColorVariants.bootColor;
        ctx.beginPath();
        ctx.ellipse(leftFootX, leftFootY + baseSize * 0.16, baseSize * 0.22, baseSize * 0.16, walkCycle * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = this.cachedColorVariants.bootColor;
        ctx.beginPath();
        ctx.ellipse(rightFootX, rightFootY + baseSize * 0.16, baseSize * 0.22, baseSize * 0.16, -walkCycle * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Health bar - only draw if not at full health or currently being damaged
        const barWidth = baseSize * 3.6;
        const barHeight = Math.max(2, baseSize * 0.4);
        const barY = this.y - baseSize * 2.5;
        
        // Only render health bar if below max or very recently damaged
        if (this.health < this.maxHealth || (this.lastDamageTime && performance.now() - this.lastDamageTime < 2000)) {
            ctx.fillStyle = '#000';
            ctx.fillRect(this.x - barWidth/2, barY, barWidth, barHeight);
            
            const healthPercent = this.health / this.maxHealth;
            ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : (healthPercent > 0.25 ? '#FFC107' : '#F44336');
            ctx.fillRect(this.x - barWidth/2, barY, barWidth * healthPercent, barHeight);
            
            ctx.strokeStyle = '#2F2F2F';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(this.x - barWidth/2, barY, barWidth, barHeight);
        }
        
        // Render hit splatters only if any exist
        if (this.hitSplatters && this.hitSplatters.length > 0) {
            for (const splatter of this.hitSplatters) {
                splatter.render(ctx);
            }
        }
    }
    
    takeDamage(amount, armorPiercingPercent = 0, damageType = 'physical', followTarget = false) {
        // Track last damage time for health bar rendering optimization
        this.lastDamageTime = performance.now();
        
        // Call parent method
        return super.takeDamage(amount, armorPiercingPercent, damageType, followTarget);
    }
    
    darkenColor(color, factor) {
        return super.darkenColor(color, factor);
    }
}
