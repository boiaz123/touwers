import { BaseEnemy } from './BaseEnemy.js';

export class ArcherEnemy extends BaseEnemy {
    constructor(path, health_multiplier = 1.0, speed = 60) {
        super(path, 120 * health_multiplier, speed);
        this.tunicColor = '#2D5016'; // Dark green ranger tunic
        
        this.attackDamage = 8;
        this.attackSpeed = 1.5;
        
// console.log('ArcherEnemy: Created at position', this.x, this.y);
    }
    
    render(ctx) {
        const baseSize = Math.max(6, Math.min(14, ctx.canvas.width / 150));
        
        // Apply phase offset for animation diversity
        const animTime = this.animationTime * 8 + this.animationPhaseOffset;
        const walkCycle = Math.sin(animTime) * 0.5;
        const bobAnimation = Math.sin(animTime) * 0.3;
        
        const armSwingFreq = animTime;
        const leftArmBase = Math.sin(armSwingFreq) * 0.6;
        const leftArmBend = Math.sin(armSwingFreq * 2) * 0.15;
        const rightArmBase = Math.sin(armSwingFreq + Math.PI) * 0.55;
        const rightArmBend = Math.sin(armSwingFreq * 2 + Math.PI / 3) * 0.18;
        
        // Enemy shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + baseSize * 1.6, baseSize * 0.9, baseSize * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.save();
        ctx.translate(this.x, this.y + bobAnimation);
        
        // Back/depth layer
        ctx.fillStyle = this.darkenColor(this.tunicColor, 0.2);
        ctx.fillRect(-baseSize * 0.65, -baseSize * 0.75, baseSize * 1.3, baseSize * 1.1);
        
        // Main tunic/body - dark green ranger tunic
        const bodyGradient = ctx.createLinearGradient(-baseSize * 0.6, -baseSize * 0.8, baseSize * 0.6, baseSize * 0.4);
        bodyGradient.addColorStop(0, this.tunicColor);
        bodyGradient.addColorStop(0.5, this.tunicColor);
        bodyGradient.addColorStop(1, this.darkenColor(this.tunicColor, 0.15));
        
        ctx.fillStyle = bodyGradient;
        ctx.fillRect(-baseSize * 0.6, -baseSize * 0.8, baseSize * 1.2, baseSize * 1.2);
        
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1;
        ctx.strokeRect(-baseSize * 0.6, -baseSize * 0.8, baseSize * 1.2, baseSize * 1.2);
        
        // Center seam
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, -baseSize * 0.8);
        ctx.lineTo(0, baseSize * 0.4);
        ctx.stroke();
        
        // Ranger belt/waist detail
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(-baseSize * 0.62, -baseSize * 0.15, baseSize * 1.24, baseSize * 0.15);
        
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.62, -baseSize * 0.15);
        ctx.lineTo(baseSize * 0.62, -baseSize * 0.15);
        ctx.stroke();
        
        // Side highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(-baseSize * 0.55, -baseSize * 0.7, baseSize * 0.2, baseSize * 0.8);
        
        // --- HEAD ---
        
        ctx.fillStyle = '#C4A575';
        ctx.beginPath();
        ctx.arc(baseSize * 0.05, -baseSize * 1.15, baseSize * 0.55, 0, Math.PI * 2);
        ctx.fill();
        
        const headGradient = ctx.createRadialGradient(-baseSize * 0.1, -baseSize * 1.25, baseSize * 0.2, 0, -baseSize * 1.2, baseSize * 0.6);
        headGradient.addColorStop(0, '#E8D4B8');
        headGradient.addColorStop(0.6, '#DDBEA9');
        headGradient.addColorStop(1, '#C9A876');
        
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.2, baseSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#B8956A';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.2, baseSize * 0.5, 0, Math.PI * 2);
        ctx.stroke();
        
        // --- RANGER HAT (Green pointed hood/coif) ---
        
        ctx.fillStyle = '#1F3F1F';
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.2, baseSize * 0.6, Math.PI, Math.PI * 2);
        ctx.fill();
        
        // Hat point/apex
        ctx.fillStyle = '#1F3F1F';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.6, -baseSize * 1.2);
        ctx.lineTo(baseSize * 0.6, -baseSize * 1.2);
        ctx.lineTo(0, -baseSize * 1.65);
        ctx.closePath();
        ctx.fill();
        
        // Hat outline
        ctx.strokeStyle = '#0F2F0F';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.6, -baseSize * 1.2);
        ctx.lineTo(0, -baseSize * 1.65);
        ctx.lineTo(baseSize * 0.6, -baseSize * 1.2);
        ctx.stroke();
        
        // Hat band/trim
        ctx.fillStyle = '#8B7355';
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 1.2, baseSize * 0.62, baseSize * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 1.2, baseSize * 0.62, baseSize * 0.12, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // --- LEFT ARM ---
        
        const leftShoulderX = -baseSize * 0.5;
        const leftShoulderY = -baseSize * 0.35;
        
        const leftSwingForward = leftArmBase;
        const leftArmDropAmount = -leftSwingForward * 0.7;
        const leftArmForwardOffset = leftSwingForward * 0.3;
        
        const leftElbowX = leftShoulderX + leftArmForwardOffset * baseSize * 0.4;
        const leftElbowY = leftShoulderY + baseSize * 0.45 + leftArmDropAmount * baseSize * 0.3;
        
        const leftWristX = leftElbowX + leftArmForwardOffset * baseSize * 0.35;
        const leftWristY = leftElbowY + (baseSize * 0.6 + leftArmBend * baseSize * 0.15);
        
        ctx.strokeStyle = `rgba(0, 0, 0, ${0.1 + Math.max(0, leftSwingForward) * 0.15})`;
        ctx.lineWidth = baseSize * 0.3;
        ctx.beginPath();
        ctx.moveTo(leftShoulderX + 0.5, leftShoulderY + 0.5);
        ctx.lineTo(leftElbowX + 0.5, leftElbowY + 0.5);
        ctx.lineTo(leftWristX + 0.5, leftWristY + 0.5);
        ctx.stroke();
        
        const leftUpperArmGradient = ctx.createLinearGradient(leftShoulderX, leftShoulderY, leftElbowX, leftElbowY);
        leftUpperArmGradient.addColorStop(0, '#E8D4B8');
        leftUpperArmGradient.addColorStop(1, `rgba(201, 168, 118, ${0.9 + Math.abs(leftSwingForward) * 0.1})`);
        
        ctx.strokeStyle = leftUpperArmGradient;
        ctx.lineWidth = baseSize * 0.32;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(leftShoulderX, leftShoulderY);
        ctx.lineTo(leftElbowX, leftElbowY);
        ctx.stroke();
        
        const leftLowerArmGradient = ctx.createLinearGradient(leftElbowX, leftElbowY, leftWristX, leftWristY);
        leftLowerArmGradient.addColorStop(0, `rgba(232, 212, 184, ${0.95 + Math.abs(leftSwingForward) * 0.05})`);
        leftLowerArmGradient.addColorStop(1, '#C9A876');
        
        ctx.strokeStyle = leftLowerArmGradient;
        ctx.lineWidth = baseSize * 0.26;
        ctx.beginPath();
        ctx.moveTo(leftElbowX, leftElbowY);
        ctx.lineTo(leftWristX, leftWristY);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(221, 190, 169, 0.9)';
        ctx.beginPath();
        ctx.arc(leftWristX, leftWristY, baseSize * 0.16, 0, Math.PI * 2);
        ctx.fill();
        
        // --- RIGHT ARM WITH BOW ---
        
        const rightShoulderX = baseSize * 0.5;
        const rightShoulderY = -baseSize * 0.35;
        
        // Right arm holding bow - natural walking pose with bow held vertically down
        const bowDrawAngle = 0; // Bow held vertically
        const rightElbowX = rightShoulderX + Math.cos(bowDrawAngle) * baseSize * 0.35;
        const rightElbowY = rightShoulderY + Math.sin(bowDrawAngle) * baseSize * 0.35;
        
        const rightWristX = rightElbowX + Math.cos(bowDrawAngle) * baseSize * 0.4;
        const rightWristY = rightElbowY + Math.sin(bowDrawAngle) * baseSize * 0.4;
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = baseSize * 0.3;
        ctx.beginPath();
        ctx.moveTo(rightShoulderX + 0.5, rightShoulderY + 0.5);
        ctx.lineTo(rightElbowX + 0.5, rightElbowY + 0.5);
        ctx.lineTo(rightWristX + 0.5, rightWristY + 0.5);
        ctx.stroke();
        
        const rightUpperArmGradient = ctx.createLinearGradient(rightShoulderX, rightShoulderY, rightElbowX, rightElbowY);
        rightUpperArmGradient.addColorStop(0, '#E8D4B8');
        rightUpperArmGradient.addColorStop(1, 'rgba(201, 168, 118, 0.95)');
        
        ctx.strokeStyle = rightUpperArmGradient;
        ctx.lineWidth = baseSize * 0.32;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(rightShoulderX, rightShoulderY);
        ctx.lineTo(rightElbowX, rightElbowY);
        ctx.stroke();
        
        const rightLowerArmGradient = ctx.createLinearGradient(rightElbowX, rightElbowY, rightWristX, rightWristY);
        rightLowerArmGradient.addColorStop(0, 'rgba(232, 212, 184, 0.95)');
        rightLowerArmGradient.addColorStop(1, '#C9A876');
        
        ctx.strokeStyle = rightLowerArmGradient;
        ctx.lineWidth = baseSize * 0.26;
        ctx.beginPath();
        ctx.moveTo(rightElbowX, rightElbowY);
        ctx.lineTo(rightWristX, rightWristY);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(221, 190, 169, 0.95)';
        ctx.beginPath();
        ctx.arc(rightWristX, rightWristY, baseSize * 0.16, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw bow
        this.drawBow(ctx, rightWristX, rightWristY, baseSize, bowDrawAngle);
        
        // --- LEGS ---
        
        const leftHipX = -baseSize * 0.25;
        const leftHipY = baseSize * 0.35;
        
        const leftLegAngle = walkCycle * 0.35;
        const leftFootX = leftHipX + Math.sin(leftLegAngle) * baseSize * 0.7;
        const leftFootY = leftHipY + Math.cos(leftLegAngle) * baseSize * 0.8;
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = baseSize * 0.25;
        ctx.beginPath();
        ctx.moveTo(leftHipX + 1, leftHipY + 1);
        ctx.lineTo(leftFootX + 1, leftFootY + 1);
        ctx.stroke();
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = baseSize * 0.25;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(leftHipX, leftHipY);
        ctx.lineTo(leftFootX, leftFootY);
        ctx.stroke();
        
        const rightHipX = baseSize * 0.25;
        const rightHipY = baseSize * 0.35;
        
        const rightLegAngle = -walkCycle * 0.35;
        const rightFootX = rightHipX + Math.sin(rightLegAngle) * baseSize * 0.7;
        const rightFootY = rightHipY + Math.cos(rightLegAngle) * baseSize * 0.8;
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = baseSize * 0.25;
        ctx.beginPath();
        ctx.moveTo(rightHipX + 1, rightHipY + 1);
        ctx.lineTo(rightFootX + 1, rightFootY + 1);
        ctx.stroke();
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = baseSize * 0.25;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(rightHipX, rightHipY);
        ctx.lineTo(rightFootX, rightFootY);
        ctx.stroke();
        
        // --- BOOTS ---
        
        ctx.fillStyle = '#1C1C1C';
        ctx.beginPath();
        ctx.ellipse(leftFootX, leftFootY + baseSize * 0.15, baseSize * 0.2, baseSize * 0.15, walkCycle * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#1C1C1C';
        ctx.beginPath();
        ctx.ellipse(rightFootX, rightFootY + baseSize * 0.15, baseSize * 0.2, baseSize * 0.15, -walkCycle * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Health bar
        const barWidth = baseSize * 3;
        const barHeight = Math.max(2, baseSize * 0.4);
        const barY = this.y - baseSize * 2.2;
        
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - barWidth/2, barY, barWidth, barHeight);
        
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : (healthPercent > 0.25 ? '#FFC107' : '#F44336');
        ctx.fillRect(this.x - barWidth/2, barY, barWidth * healthPercent, barHeight);
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
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
    
    drawBow(ctx, handX, handY, baseSize, armAngle) {
        ctx.save();
        ctx.translate(handX, handY);
        ctx.rotate(armAngle);
        
        // Bow grip - wooden center with leather wrap
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(-baseSize * 0.16, -baseSize * 0.25, baseSize * 0.32, baseSize * 0.5);
        
        // Grip leather wrapping
        ctx.fillStyle = '#8B4513';
        for (let i = 0; i < 5; i++) {
            const wrapY = -baseSize * 0.25 + (baseSize * 0.5 * i / 5);
            ctx.fillRect(-baseSize * 0.16, wrapY, baseSize * 0.32, baseSize * 0.08);
        }
        
        // Grip highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(-baseSize * 0.14, -baseSize * 0.22, baseSize * 0.12, baseSize * 0.44);
        
        // Bow limbs - traditional longbow shape with larger curve
        const bowLimbGradient = ctx.createLinearGradient(0, -baseSize * 1.2, 0, baseSize * 1.2);
        bowLimbGradient.addColorStop(0, '#8B6914');
        bowLimbGradient.addColorStop(0.5, '#A0826D');
        bowLimbGradient.addColorStop(1, '#8B6914');
        
        ctx.strokeStyle = bowLimbGradient;
        ctx.lineWidth = baseSize * 0.26;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Upper limb - curved forward with more pronounced curve
        ctx.beginPath();
        ctx.moveTo(0, -baseSize * 0.25);
        ctx.quadraticCurveTo(baseSize * 0.6, -baseSize * 0.7, baseSize * 0.55, -baseSize * 1.15);
        ctx.stroke();
        
        // Lower limb - curved forward with more pronounced curve
        ctx.beginPath();
        ctx.moveTo(0, baseSize * 0.25);
        ctx.quadraticCurveTo(baseSize * 0.6, baseSize * 0.7, baseSize * 0.55, baseSize * 1.15);
        ctx.stroke();
        
        // Bow wood edges/depth
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.moveTo(0, -baseSize * 0.25);
        ctx.quadraticCurveTo(baseSize * 0.6, -baseSize * 0.7, baseSize * 0.55, -baseSize * 1.15);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, baseSize * 0.25);
        ctx.quadraticCurveTo(baseSize * 0.6, baseSize * 0.7, baseSize * 0.55, baseSize * 1.15);
        ctx.stroke();
        
        // Bowstring - thick tan/beige color, straight line
        ctx.strokeStyle = '#D2B48C';
        ctx.lineWidth = baseSize * 0.14;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // String from upper tip to lower tip - straight line
        ctx.beginPath();
        ctx.moveTo(baseSize * 0.55, -baseSize * 1.15);
        ctx.lineTo(baseSize * 0.55, baseSize * 1.15);
        ctx.stroke();
        
        // Bowstring highlight
        ctx.strokeStyle = '#F5DEB3';
        ctx.lineWidth = baseSize * 0.07;
        
        ctx.beginPath();
        ctx.moveTo(baseSize * 0.55, -baseSize * 1.15);
        ctx.lineTo(baseSize * 0.55, baseSize * 1.15);
        ctx.stroke();
        
        // Nocking point (where arrow sits on string)
        ctx.fillStyle = '#C19A6B';
        ctx.beginPath();
        ctx.arc(baseSize * 0.55, 0, baseSize * 0.12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(baseSize * 0.55, 0, baseSize * 0.12, 0, Math.PI * 2);
        ctx.stroke();
        
        // Bow tips - reinforced nocks
        const tipGradient = ctx.createRadialGradient(baseSize * 0.55, -baseSize * 1.15, baseSize * 0.05, baseSize * 0.55, -baseSize * 1.15, baseSize * 0.15);
        tipGradient.addColorStop(0, '#D4AF37');
        tipGradient.addColorStop(1, '#8B7500');
        
        ctx.fillStyle = tipGradient;
        ctx.beginPath();
        ctx.arc(baseSize * 0.55, -baseSize * 1.15, baseSize * 0.14, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = tipGradient;
        ctx.beginPath();
        ctx.arc(baseSize * 0.55, baseSize * 1.15, baseSize * 0.14, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}
