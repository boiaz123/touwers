import { BaseEnemy } from './BaseEnemy.js';

export class ShieldKnightEnemy extends BaseEnemy {
    constructor(path, health_multiplier = 1.0, speed = 35) {
        super(path, 180 * health_multiplier, speed);
        this.armorColor = this.getRandomArmorColor();
        this.sizeMultiplier = 1.05;
        
        this.attackDamage = 5;
        this.attackSpeed = 0.6;
        
    }
    
    getRandomArmorColor() {
        const armorColors = [
            '#4A5568', '#2C3E50', '#34495E', '#1A252F', '#3E4C59', '#556B82'
        ];
        return armorColors[Math.floor(Math.random() * armorColors.length)];
    }
    
    render(ctx) {
        const baseSize = Math.max(6.3, Math.min(14.7, ctx.canvas.width / 150)) * this.sizeMultiplier;
        
        // Pre-calculate animation values once
        const animTime = (this.animationTime * 7.5 + this.animationPhaseOffset);
        const sinAnimTime = Math.sin(animTime);
        const cosAnimTime = Math.cos(animTime);
        const walkCycle = sinAnimTime * 0.4;
        const bobAnimation = sinAnimTime * 0.25;
        
        // Enemy shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + baseSize * 1.5, baseSize * 0.95, baseSize * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.save();
        ctx.translate(this.x, this.y + bobAnimation);
        
        // --- ARMOR BODY PLATE (SIMPLIFIED) ---
        
        // Main chest plate - solid color (no gradient)
        ctx.fillStyle = this.armorColor;
        ctx.fillRect(-baseSize * 0.65, -baseSize * 0.7, baseSize * 1.3, baseSize * 1.05);
        
        // Armor outline
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-baseSize * 0.65, -baseSize * 0.7, baseSize * 1.3, baseSize * 1.05);
        
        // --- SHOULDER PAULDRONS ---
        
        // Left and right shoulders - simplified
        ctx.fillStyle = '#5A6B7A';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.7, -baseSize * 0.4, baseSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(baseSize * 0.7, -baseSize * 0.4, baseSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(-baseSize * 0.7, -baseSize * 0.4, baseSize * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(baseSize * 0.7, -baseSize * 0.4, baseSize * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        
        // --- ARMOR RIVETS (MINIMAL) ---
        
        // Chest plate rivets - reduced
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        ctx.arc(0, -baseSize * 0.5, 0.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, -baseSize * 0.2, 0.9, 0, Math.PI * 2);
        ctx.fill();
        
        // --- HEAD WITH CLOSED HELM (SIMPLIFIED) ---
        
        // Head (simplified - no gradient)
        ctx.fillStyle = '#C4A575';
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.25, baseSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // --- CLOSED HELM (solid color) ---
        
        // Helm body - full coverage
        ctx.fillStyle = '#4a4a4a';
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.25, baseSize * 0.68, 0, Math.PI * 2);
        ctx.fill();
        
        // Helm outline
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.25, baseSize * 0.68, 0, Math.PI * 2);
        ctx.stroke();
        
        // Visor and nose guard
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-baseSize * 0.35, -baseSize * 1.28, baseSize * 0.7, baseSize * 0.12);
        ctx.fillRect(-baseSize * 0.08, -baseSize * 1.25, baseSize * 0.16, baseSize * 0.4);
        
        // Helm crest - ornamental ridge
        ctx.strokeStyle = '#5A6B7A';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, -baseSize * 1.92);
        ctx.lineTo(-baseSize * 0.15, -baseSize * 1.55);
        ctx.lineTo(baseSize * 0.15, -baseSize * 1.55);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = '#5A6B7A';
        ctx.fill();
        
        // Helm detail - cheek guards
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(-baseSize * 0.45, -baseSize * 1.1, baseSize * 0.12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(baseSize * 0.45, -baseSize * 1.1, baseSize * 0.12, 0, Math.PI * 2);
        ctx.stroke();
        
        // Eye slit glow detail
        ctx.fillStyle = 'rgba(255, 100, 50, 0.3)';
        ctx.fillRect(-baseSize * 0.28, -baseSize * 1.3, baseSize * 0.56, baseSize * 0.08);
        
        // --- LEFT ARM WITH SHIELD ---
        
        const leftShoulderX = -baseSize * 0.65;
        const leftShoulderY = -baseSize * 0.35;
        
        // Left arm - shield arm positioned at body height, defensive
        const leftArmAngle = 0.2; // Angled to hold shield in defense
        const cosLeftArm = Math.cos(leftArmAngle);
        const sinLeftArm = Math.sin(leftArmAngle);
        const leftElbowX = leftShoulderX + cosLeftArm * baseSize * 0.35;
        const leftElbowY = leftShoulderY + sinLeftArm * baseSize * 0.35;
        
        // Wrist positioned for shield
        const leftWristX = leftElbowX + cosLeftArm * baseSize * 0.42;
        const leftWristY = leftElbowY + sinLeftArm * baseSize * 0.42;
        
        // Left arm (simplified - solid color)
        ctx.strokeStyle = '#C9A876';
        ctx.lineWidth = baseSize * 0.35;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(leftShoulderX, leftShoulderY);
        ctx.lineTo(leftElbowX, leftElbowY);
        ctx.lineTo(leftWristX, leftWristY);
        ctx.stroke();
        
        // Left gauntlet
        ctx.fillStyle = '#5A6B7A';
        ctx.beginPath();
        ctx.arc(leftWristX, leftWristY, baseSize * 0.22, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(leftWristX, leftWristY, baseSize * 0.22, 0, Math.PI * 2);
        ctx.stroke();
        
        // --- SHIELD ---
        
        this.drawSimpleShield(ctx, leftWristX, leftWristY, baseSize);
        
        // --- RIGHT ARM WITH SCIMITAR ---
        
        const rightShoulderX = baseSize * 0.65;
        const rightShoulderY = -baseSize * 0.35;
        
        // Right arm - sword arm positioned upward, offensive
        const rightArmAngle = -0.5; // Angled upward
        const cosRightArm = Math.cos(rightArmAngle);
        const sinRightArm = Math.sin(rightArmAngle);
        const rightElbowX = rightShoulderX + cosRightArm * baseSize * 0.35;
        const rightElbowY = rightShoulderY + sinRightArm * baseSize * 0.35;
        
        // Wrist positioned for sword
        const rightWristX = rightElbowX + cosRightArm * baseSize * 0.42;
        const rightWristY = rightElbowY + sinRightArm * baseSize * 0.42;
        
        // Right arm (simplified - solid color)
        ctx.strokeStyle = '#C9A876';
        ctx.lineWidth = baseSize * 0.35;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(rightShoulderX, rightShoulderY);
        ctx.lineTo(rightElbowX, rightElbowY);
        ctx.lineTo(rightWristX, rightWristY);
        ctx.stroke();
        
        // Right gauntlet
        ctx.fillStyle = '#5A6B7A';
        ctx.beginPath();
        ctx.arc(rightWristX, rightWristY, baseSize * 0.22, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(rightWristX, rightWristY, baseSize * 0.22, 0, Math.PI * 2);
        ctx.stroke();
        
        // --- SMALL SINGLE-HANDED SWORD ---
        
        this.drawSingleHandedSword(ctx, rightWristX, rightWristY, baseSize, walkCycle);
        
        // --- LEGS WITH LEG ARMOR (SIMPLIFIED) ---
        
        const leftHipX = -baseSize * 0.28;
        const leftHipY = baseSize * 0.35;
        
        const leftLegAngle = walkCycle * 0.3;
        const leftFootX = leftHipX + Math.sin(leftLegAngle) * baseSize * 0.7;
        const leftFootY = leftHipY + Math.cos(leftLegAngle) * baseSize * 0.85;
        
        // Left leg upper thigh armor
        ctx.strokeStyle = '#4A5568';
        ctx.lineWidth = baseSize * 0.28;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(leftHipX, leftHipY);
        const leftKneeX = leftHipX + Math.sin(leftLegAngle) * baseSize * 0.35;
        const leftKneeY = leftHipY + Math.cos(leftLegAngle) * baseSize * 0.42;
        ctx.lineTo(leftKneeX, leftKneeY);
        ctx.stroke();
        
        // Left knee joint
        ctx.fillStyle = '#5A6B7A';
        ctx.beginPath();
        ctx.arc(leftKneeX, leftKneeY, baseSize * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Left leg lower shin armor
        ctx.strokeStyle = '#4A5568';
        ctx.lineWidth = baseSize * 0.26;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(leftKneeX, leftKneeY);
        ctx.lineTo(leftFootX, leftFootY);
        ctx.stroke();
        
        const rightHipX = baseSize * 0.28;
        const rightHipY = baseSize * 0.35;
        
        const rightLegAngle = -walkCycle * 0.3;
        const rightFootX = rightHipX + Math.sin(rightLegAngle) * baseSize * 0.7;
        const rightFootY = rightHipY + Math.cos(rightLegAngle) * baseSize * 0.85;
        
        // Right leg upper thigh armor
        ctx.strokeStyle = '#4A5568';
        ctx.lineWidth = baseSize * 0.28;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(rightHipX, rightHipY);
        const rightKneeX = rightHipX + Math.sin(rightLegAngle) * baseSize * 0.35;
        const rightKneeY = rightHipY + Math.cos(rightLegAngle) * baseSize * 0.42;
        ctx.lineTo(rightKneeX, rightKneeY);
        ctx.stroke();
        
        // Right knee joint
        ctx.fillStyle = '#5A6B7A';
        ctx.beginPath();
        ctx.arc(rightKneeX, rightKneeY, baseSize * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Right leg lower shin armor
        ctx.strokeStyle = '#4A5568';
        ctx.lineWidth = baseSize * 0.26;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(rightKneeX, rightKneeY);
        ctx.lineTo(rightFootX, rightFootY);
        ctx.stroke();
        
        // --- ARMORED BOOTS (SIMPLIFIED) ---
        
        // Left boot
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.ellipse(leftFootX, leftFootY + baseSize * 0.18, baseSize * 0.26, baseSize * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#5A6B7A';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(leftFootX, leftFootY + baseSize * 0.18, baseSize * 0.26, baseSize * 0.2, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Right boot
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.ellipse(rightFootX, rightFootY + baseSize * 0.18, baseSize * 0.26, baseSize * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#5A6B7A';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(rightFootX, rightFootY + baseSize * 0.18, baseSize * 0.26, baseSize * 0.2, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
        
        // Health bar
        const barWidth = baseSize * 3.2;
        const barHeight = Math.max(2.2, baseSize * 0.44);
        const barY = this.y - baseSize * 2.3;
        
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - barWidth/2, barY, barWidth, barHeight);
        
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : (healthPercent > 0.25 ? '#FFC107' : '#F44336');
        ctx.fillRect(this.x - barWidth/2, barY, barWidth * healthPercent, barHeight);
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1.1;
        ctx.strokeRect(this.x - barWidth/2, barY, barWidth, barHeight);
        
        // Render hit splatters
        this.hitSplatters.forEach(splatter => splatter.render(ctx));
    }
    
    attackCastle(castle, deltaTime) {
        if (!this.isAttackingCastle || !castle) return 0;
        
        this.attackCooldown -= deltaTime;
        
        if (this.attackCooldown <= 0) {
            const damage = this.attackDamage;
            castle.takeDamage(damage);
            this.attackCooldown = 1.0 / this.attackSpeed;
            return damage;
        }
        
        return 0;
    }
    
    drawSimpleShield(ctx, handX, handY, baseSize) {
        ctx.save();
        ctx.translate(handX, handY);
        
        // Shield angle - protective position
        ctx.rotate(-0.25);
        
        const shieldWidth = baseSize * 0.68;
        const shieldHeight = baseSize * 1.05;
        
        // Shield body - solid color
        ctx.fillStyle = '#8a7a6a';
        ctx.beginPath();
        ctx.moveTo(-shieldWidth / 2, -shieldHeight / 2);
        ctx.lineTo(shieldWidth / 2, -shieldHeight / 2);
        ctx.lineTo(shieldWidth / 2, shieldHeight / 2 - baseSize * 0.18);
        ctx.lineTo(0, shieldHeight / 2 + baseSize * 0.18);
        ctx.lineTo(-shieldWidth / 2, shieldHeight / 2 - baseSize * 0.18);
        ctx.closePath();
        ctx.fill();
        
        // Shield edge
        ctx.strokeStyle = '#4a3a2a';
        ctx.lineWidth = 1.8;
        ctx.stroke();
        
        // Shield boss (raised center circle)
        ctx.fillStyle = '#5a4a3a';
        ctx.beginPath();
        ctx.arc(0, -baseSize * 0.1, baseSize * 0.18, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#3a2a1a';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
    }
    
    drawSingleHandedSword(ctx, handX, handY, baseSize, walkCycle) {
        ctx.save();
        ctx.translate(handX, handY);
        
        // Sword angle - upright pointing up with tilt to the right
        const swordAngle = 0.35 + walkCycle * 0.08;
        ctx.rotate(swordAngle);
        
        const swordLength = baseSize * 1.4;
        const bladeWidth = baseSize * 0.22;
        
        // Sword blade - solid color (no gradient for better performance)
        ctx.fillStyle = '#A8A8A8';
        ctx.beginPath();
        ctx.moveTo(-bladeWidth/2, 0);
        ctx.lineTo(bladeWidth/2, 0);
        ctx.lineTo(baseSize * 0.1, -swordLength);
        ctx.lineTo(-baseSize * 0.1, -swordLength);
        ctx.closePath();
        ctx.fill();
        
        // Blade outline
        ctx.strokeStyle = '#505050';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // --- SWORD CROSS-GUARD ---
        
        ctx.fillStyle = '#D4AF37';
        ctx.fillRect(-baseSize * 0.3, -baseSize * 0.1, baseSize * 0.6, baseSize * 0.2);
        
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 1;
        ctx.strokeRect(-baseSize * 0.3, -baseSize * 0.1, baseSize * 0.6, baseSize * 0.2);
        
        // --- SWORD HANDLE ---
        
        const handleLength = baseSize * 0.45;
        ctx.fillStyle = '#654321';
        ctx.fillRect(-baseSize * 0.1, baseSize * 0.1, baseSize * 0.2, handleLength);
        
        ctx.strokeStyle = '#3a2a1a';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(-baseSize * 0.1, baseSize * 0.1, baseSize * 0.2, handleLength);
        
        // --- SWORD POMMEL ---
        
        ctx.fillStyle = '#D4AF37';
        ctx.beginPath();
        ctx.arc(0, baseSize * 0.62, baseSize * 0.16, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, baseSize * 0.62, baseSize * 0.16, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
    
    darkenColor(color, factor) {
        return super.darkenColor(color, factor);
    }
}
