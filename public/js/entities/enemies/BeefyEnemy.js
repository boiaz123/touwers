import { BaseEnemy } from './BaseEnemy.js';

export class BeefyEnemy extends BaseEnemy {
    constructor(path, health_multiplier = 1.0, speed = 60) {
        super(path, 150 * health_multiplier, speed);
        this.tunicColor = this.getRandomTunicColor();
        this.sizeMultiplier = 1.2;
        
        this.attackDamage = 9;
        this.attackSpeed = 0.8;
        
        console.log('BeefyEnemy: Created at position', this.x, this.y);
    }
    
    getRandomTunicColor() {
        const tunicColors = [
            '#5C2E0F', '#1A3A52', '#8B0000', '#1C1C1C', '#2D3E1F', '#4B0082'
        ];
        return tunicColors[Math.floor(Math.random() * tunicColors.length)];
    }
    
    render(ctx) {
        const baseSize = Math.max(7.2, Math.min(16.8, ctx.canvas.width / 150)) * this.sizeMultiplier;
        
        const walkCycle = Math.sin(this.animationTime * 8) * 0.5;
        const bobAnimation = Math.sin(this.animationTime * 8) * 0.3;
        
        const armSwingFreq = this.animationTime * 8;
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
        
        // Back/depth layer (darker, more pronounced)
        ctx.fillStyle = this.darkenColor(this.tunicColor, 0.25);
        ctx.fillRect(-baseSize * 0.72, -baseSize * 0.82, baseSize * 1.44, baseSize * 1.2);
        
        // Main tunic/body - beefier with stronger gradient
        const bodyGradient = ctx.createLinearGradient(-baseSize * 0.7, -baseSize * 0.9, baseSize * 0.7, baseSize * 0.45);
        bodyGradient.addColorStop(0, this.tunicColor);
        bodyGradient.addColorStop(0.5, this.tunicColor);
        bodyGradient.addColorStop(1, this.darkenColor(this.tunicColor, 0.2));
        
        ctx.fillStyle = bodyGradient;
        ctx.fillRect(-baseSize * 0.68, -baseSize * 0.88, baseSize * 1.36, baseSize * 1.32);
        
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-baseSize * 0.68, -baseSize * 0.88, baseSize * 1.36, baseSize * 1.32);
        
        // Center seam
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(0, -baseSize * 0.88);
        ctx.lineTo(0, baseSize * 0.44);
        ctx.stroke();
        
        // Armor chest plate - beefier enemy wears armor
        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(-baseSize * 0.6, -baseSize * 0.7, baseSize * 1.2, baseSize * 0.9);
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.strokeRect(-baseSize * 0.6, -baseSize * 0.7, baseSize * 1.2, baseSize * 0.9);
        
        // Armor rivets
        ctx.fillStyle = '#3a3a3a';
        for (let i = -1; i <= 1; i++) {
            for (let j = 0; j < 3; j++) {
                ctx.beginPath();
                ctx.arc(i * baseSize * 0.35, -baseSize * 0.5 + j * baseSize * 0.35, 0.8, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Side highlight - more pronounced
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(-baseSize * 0.62, -baseSize * 0.8, baseSize * 0.25, baseSize * 0.95);
        
        // --- HEAD WITH 3D PERSPECTIVE ---
        
        ctx.fillStyle = '#C4A575';
        ctx.beginPath();
        ctx.arc(baseSize * 0.06, -baseSize * 1.3, baseSize * 0.62, 0, Math.PI * 2);
        ctx.fill();
        
        const headGradient = ctx.createRadialGradient(-baseSize * 0.12, -baseSize * 1.42, baseSize * 0.25, 0, -baseSize * 1.35, baseSize * 0.7);
        headGradient.addColorStop(0, '#E8D4B8');
        headGradient.addColorStop(0.6, '#DDBEA9');
        headGradient.addColorStop(1, '#C9A876');
        
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.35, baseSize * 0.58, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#B8956A';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.35, baseSize * 0.58, 0, Math.PI * 2);
        ctx.stroke();
        
        // --- HELMET - beefier, more intimidating ---
        
        const helmetGradient = ctx.createLinearGradient(-baseSize * 0.7, -baseSize * 1.48, baseSize * 0.7, -baseSize * 1.0);
        helmetGradient.addColorStop(0, '#606060');
        helmetGradient.addColorStop(0.5, '#4a4a4a');
        helmetGradient.addColorStop(1, '#3a3a3a');
        
        ctx.fillStyle = helmetGradient;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.35, baseSize * 0.7, Math.PI * 0.92, Math.PI * 2.08);
        ctx.fill();
        
        // Helmet nose guard
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(-baseSize * 0.12, -baseSize * 1.3, baseSize * 0.24, baseSize * 0.45);
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.7, -baseSize * 1.35);
        ctx.lineTo(baseSize * 0.7, -baseSize * 1.35);
        ctx.stroke();
        
        // Helmet highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.2, -baseSize * 1.52, baseSize * 0.18, 0, Math.PI * 2);
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
        
        ctx.strokeStyle = `rgba(0, 0, 0, ${0.12 + Math.max(0, leftSwingForward) * 0.18})`;
        ctx.lineWidth = baseSize * 0.36;
        ctx.beginPath();
        ctx.moveTo(leftShoulderX + 0.6, leftShoulderY + 0.6);
        ctx.lineTo(leftElbowX + 0.6, leftElbowY + 0.6);
        ctx.lineTo(leftWristX + 0.6, leftWristY + 0.6);
        ctx.stroke();
        
        const leftUpperArmGradient = ctx.createLinearGradient(leftShoulderX, leftShoulderY, leftElbowX, leftElbowY);
        leftUpperArmGradient.addColorStop(0, '#E8D4B8');
        leftUpperArmGradient.addColorStop(1, `rgba(201, 168, 118, ${0.88 + Math.abs(leftSwingForward) * 0.12})`);
        
        ctx.strokeStyle = leftUpperArmGradient;
        ctx.lineWidth = baseSize * 0.38;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(leftShoulderX, leftShoulderY);
        ctx.lineTo(leftElbowX, leftElbowY);
        ctx.stroke();
        
        const leftLowerArmGradient = ctx.createLinearGradient(leftElbowX, leftElbowY, leftWristX, leftWristY);
        leftLowerArmGradient.addColorStop(0, `rgba(232, 212, 184, ${0.93 + Math.abs(leftSwingForward) * 0.07})`);
        leftLowerArmGradient.addColorStop(1, '#C9A876');
        
        ctx.strokeStyle = leftLowerArmGradient;
        ctx.lineWidth = baseSize * 0.3;
        ctx.beginPath();
        ctx.moveTo(leftElbowX, leftElbowY);
        ctx.lineTo(leftWristX, leftWristY);
        ctx.stroke();
        
        // Left hand
        ctx.fillStyle = 'rgba(221, 190, 169, 0.95)';
        ctx.beginPath();
        ctx.arc(leftWristX, leftWristY, baseSize * 0.18, 0, Math.PI * 2);
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
        
        ctx.strokeStyle = `rgba(0, 0, 0, ${0.12 + Math.max(0, rightSwingForward) * 0.18})`;
        ctx.lineWidth = baseSize * 0.36;
        ctx.beginPath();
        ctx.moveTo(rightShoulderX + 0.6, rightShoulderY + 0.6);
        ctx.lineTo(rightElbowX + 0.6, rightElbowY + 0.6);
        ctx.lineTo(rightWristX + 0.6, rightWristY + 0.6);
        ctx.stroke();
        
        const rightUpperArmGradient = ctx.createLinearGradient(rightShoulderX, rightShoulderY, rightElbowX, rightElbowY);
        rightUpperArmGradient.addColorStop(0, '#E8D4B8');
        rightUpperArmGradient.addColorStop(1, `rgba(201, 168, 118, ${0.88 + Math.abs(rightSwingForward) * 0.12})`);
        
        ctx.strokeStyle = rightUpperArmGradient;
        ctx.lineWidth = baseSize * 0.38;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(rightShoulderX, rightShoulderY);
        ctx.lineTo(rightElbowX, rightElbowY);
        ctx.stroke();
        
        const rightLowerArmGradient = ctx.createLinearGradient(rightElbowX, rightElbowY, rightWristX, rightWristY);
        rightLowerArmGradient.addColorStop(0, `rgba(232, 212, 184, ${0.93 + Math.abs(rightSwingForward) * 0.07})`);
        rightLowerArmGradient.addColorStop(1, '#C9A876');
        
        ctx.strokeStyle = rightLowerArmGradient;
        ctx.lineWidth = baseSize * 0.3;
        ctx.beginPath();
        ctx.moveTo(rightElbowX, rightElbowY);
        ctx.lineTo(rightWristX, rightWristY);
        ctx.stroke();
        
        // Right hand with gauntlet
        ctx.fillStyle = '#4a4a4a';
        ctx.beginPath();
        ctx.arc(rightWristX, rightWristY, baseSize * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(rightWristX, rightWristY, baseSize * 0.2, 0, Math.PI * 2);
        ctx.stroke();
        
        // --- SWORD ---
        
        // Sword points mostly upright with slight forward tilt
        const swordAngle = -Math.PI / 2 + 0.3;
        const swordLength = baseSize * 1.8;
        const swordTipX = rightWristX + Math.cos(swordAngle) * swordLength;
        const swordTipY = rightWristY + Math.sin(swordAngle) * swordLength;
        
        // Sword shadow
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = baseSize * 0.16;
        ctx.beginPath();
        ctx.moveTo(rightWristX + 0.8, rightWristY + 0.8);
        ctx.lineTo(swordTipX + 0.8, swordTipY + 0.8);
        ctx.stroke();
        
        // Sword blade - steel gray with gradient
        const swordGradient = ctx.createLinearGradient(rightWristX, rightWristY, swordTipX, swordTipY);
        swordGradient.addColorStop(0, '#A9A9A9');
        swordGradient.addColorStop(0.5, '#C0C0C0');
        swordGradient.addColorStop(1, '#808080');
        
        ctx.strokeStyle = swordGradient;
        ctx.lineWidth = baseSize * 0.22;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(rightWristX, rightWristY);
        ctx.lineTo(swordTipX, swordTipY);
        ctx.stroke();
        
        // Sword edge highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = baseSize * 0.08;
        ctx.beginPath();
        ctx.moveTo(rightWristX, rightWristY);
        ctx.lineTo(swordTipX, swordTipY);
        ctx.stroke();
        
        // Sword guard (crossbar)
        ctx.save();
        ctx.translate(rightWristX, rightWristY);
        ctx.rotate(swordAngle);
        ctx.fillStyle = '#D4AF37';
        ctx.fillRect(-baseSize * 0.28, -baseSize * 0.08, baseSize * 0.56, baseSize * 0.16);
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(-baseSize * 0.28, -baseSize * 0.08, baseSize * 0.56, baseSize * 0.16);
        
        // Sword pommel
        ctx.fillStyle = '#D4AF37';
        ctx.beginPath();
        ctx.arc(0, baseSize * 0.15, baseSize * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(0, baseSize * 0.15, baseSize * 0.12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        
        // --- LEGS ---
        
        const leftHipX = -baseSize * 0.28;
        const leftHipY = baseSize * 0.38;
        
        const leftLegAngle = walkCycle * 0.35;
        const leftFootX = leftHipX + Math.sin(leftLegAngle) * baseSize * 0.8;
        const leftFootY = leftHipY + Math.cos(leftLegAngle) * baseSize * 0.9;
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = baseSize * 0.3;
        ctx.beginPath();
        ctx.moveTo(leftHipX + 1, leftHipY + 1);
        ctx.lineTo(leftFootX + 1, leftFootY + 1);
        ctx.stroke();
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = baseSize * 0.3;
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
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = baseSize * 0.3;
        ctx.beginPath();
        ctx.moveTo(rightHipX + 1, rightHipY + 1);
        ctx.lineTo(rightFootX + 1, rightFootY + 1);
        ctx.stroke();
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = baseSize * 0.3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(rightHipX, rightHipY);
        ctx.lineTo(rightFootX, rightFootY);
        ctx.stroke();
        
        // --- BOOTS ---
        
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        ctx.ellipse(leftFootX, leftFootY + baseSize * 0.18, baseSize * 0.24, baseSize * 0.18, walkCycle * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        ctx.ellipse(rightFootX, rightFootY + baseSize * 0.18, baseSize * 0.24, baseSize * 0.18, -walkCycle * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Health bar
        const barWidth = baseSize * 3.6;
        const barHeight = Math.max(2.4, baseSize * 0.48);
        const barY = this.y - baseSize * 2.5;
        
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - barWidth/2, barY, barWidth, barHeight);
        
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : (healthPercent > 0.25 ? '#FFC107' : '#F44336');
        ctx.fillRect(this.x - barWidth/2, barY, barWidth * healthPercent, barHeight);
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(this.x - barWidth/2, barY, barWidth, barHeight);
        
        // Render hit splatters
        this.hitSplatters.forEach(splatter => splatter.render(ctx));
    }
    
    darkenColor(color, factor) {
        return super.darkenColor(color, factor);
    }
}
