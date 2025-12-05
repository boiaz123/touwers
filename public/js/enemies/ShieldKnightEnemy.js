import { BaseEnemy } from './BaseEnemy.js';

export class ShieldKnightEnemy extends BaseEnemy {
    constructor(path, health_multiplier = 1.0, speed = 35) {
        super(path, 180 * health_multiplier, speed);
        this.tunicColor = this.getRandomTunicColor();
        this.sizeMultiplier = 1.05;
        
        this.attackDamage = 5;
        this.attackSpeed = 0.6;
        
        console.log('ShieldKnightEnemy: Created at position', this.x, this.y);
    }
    
    getRandomTunicColor() {
        const tunicColors = [
            '#4A5568', '#2C3E50', '#34495E', '#1A252F', '#3E4C59', '#556B82'
        ];
        return tunicColors[Math.floor(Math.random() * tunicColors.length)];
    }
    
    render(ctx) {
        const baseSize = Math.max(6.3, Math.min(14.7, ctx.canvas.width / 150)) * this.sizeMultiplier;
        
        const walkCycle = Math.sin(this.animationTime * 8) * 0.5;
        const bobAnimation = Math.sin(this.animationTime * 8) * 0.3;
        
        const armSwingFreq = this.animationTime * 8;
        const leftArmBase = Math.sin(armSwingFreq) * 0.6;
        const leftArmBend = Math.sin(armSwingFreq * 2) * 0.15;
        const rightArmBase = Math.sin(armSwingFreq + Math.PI) * 0.55;
        const rightArmBend = Math.sin(armSwingFreq * 2 + Math.PI / 3) * 0.18;
        
        // Enemy shadow - medium size
        ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + baseSize * 1.6, baseSize * 0.95, baseSize * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.save();
        ctx.translate(this.x, this.y + bobAnimation);
        
        // Back/depth layer
        ctx.fillStyle = this.darkenColor(this.tunicColor, 0.22);
        ctx.fillRect(-baseSize * 0.68, -baseSize * 0.78, baseSize * 1.36, baseSize * 1.15);
        
        // Main armor/body
        const bodyGradient = ctx.createLinearGradient(-baseSize * 0.65, -baseSize * 0.85, baseSize * 0.65, baseSize * 0.42);
        bodyGradient.addColorStop(0, this.tunicColor);
        bodyGradient.addColorStop(0.5, this.tunicColor);
        bodyGradient.addColorStop(1, this.darkenColor(this.tunicColor, 0.18));
        
        ctx.fillStyle = bodyGradient;
        ctx.fillRect(-baseSize * 0.64, -baseSize * 0.84, baseSize * 1.28, baseSize * 1.26);
        
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1.1;
        ctx.strokeRect(-baseSize * 0.64, -baseSize * 0.84, baseSize * 1.28, baseSize * 1.26);
        
        // Center seam
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(0, -baseSize * 0.84);
        ctx.lineTo(0, baseSize * 0.42);
        ctx.stroke();
        
        // Medium armor plates on chest
        ctx.fillStyle = '#7a8a9a';
        ctx.fillRect(-baseSize * 0.55, -baseSize * 0.65, baseSize * 1.1, baseSize * 0.75);
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 0.9;
        ctx.strokeRect(-baseSize * 0.55, -baseSize * 0.65, baseSize * 1.1, baseSize * 0.75);
        
        // Armor rivets
        ctx.fillStyle = '#3a4a5a';
        for (let i = -1; i <= 1; i++) {
            for (let j = 0; j < 2; j++) {
                ctx.beginPath();
                ctx.arc(i * baseSize * 0.3, -baseSize * 0.45 + j * baseSize * 0.4, 0.7, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Side highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.fillRect(-baseSize * 0.61, -baseSize * 0.77, baseSize * 0.22, baseSize * 0.9);
        
        // --- HEAD WITH HELMET ---
        
        ctx.fillStyle = '#C4A575';
        ctx.beginPath();
        ctx.arc(baseSize * 0.05, -baseSize * 1.25, baseSize * 0.58, 0, Math.PI * 2);
        ctx.fill();
        
        const headGradient = ctx.createRadialGradient(-baseSize * 0.1, -baseSize * 1.35, baseSize * 0.22, 0, -baseSize * 1.3, baseSize * 0.65);
        headGradient.addColorStop(0, '#E8D4B8');
        headGradient.addColorStop(0.6, '#DDBEA9');
        headGradient.addColorStop(1, '#C9A876');
        
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.3, baseSize * 0.55, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#B8956A';
        ctx.lineWidth = 0.55;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.3, baseSize * 0.55, 0, Math.PI * 2);
        ctx.stroke();
        
        // --- KNIGHT HELMET ---
        
        const helmetGradient = ctx.createLinearGradient(-baseSize * 0.65, -baseSize * 1.42, baseSize * 0.65, -baseSize * 0.95);
        helmetGradient.addColorStop(0, '#5a6a7a');
        helmetGradient.addColorStop(0.5, '#4a5a6a');
        helmetGradient.addColorStop(1, '#3a4a5a');
        
        ctx.fillStyle = helmetGradient;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.3, baseSize * 0.68, Math.PI * 0.93, Math.PI * 2.07);
        ctx.fill();
        
        // Helmet nose guard
        ctx.fillStyle = '#4a5a6a';
        ctx.fillRect(-baseSize * 0.11, -baseSize * 1.25, baseSize * 0.22, baseSize * 0.42);
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.65, -baseSize * 1.3);
        ctx.lineTo(baseSize * 0.65, -baseSize * 1.3);
        ctx.stroke();
        
        // Helmet highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.18, -baseSize * 1.48, baseSize * 0.17, 0, Math.PI * 2);
        ctx.fill();
        
        // --- LEFT ARM ---
        
        const leftShoulderX = -baseSize * 0.54;
        const leftShoulderY = -baseSize * 0.38;
        
        const leftSwingForward = leftArmBase;
        const leftArmDropAmount = -leftSwingForward * 0.7;
        const leftArmForwardOffset = leftSwingForward * 0.3;
        
        const leftElbowX = leftShoulderX + leftArmForwardOffset * baseSize * 0.44;
        const leftElbowY = leftShoulderY + baseSize * 0.5 + leftArmDropAmount * baseSize * 0.32;
        
        const leftWristX = leftElbowX + leftArmForwardOffset * baseSize * 0.38;
        const leftWristY = leftElbowY + (baseSize * 0.65 + leftArmBend * baseSize * 0.16);
        
        ctx.strokeStyle = `rgba(0, 0, 0, ${0.11 + Math.max(0, leftSwingForward) * 0.16})`;
        ctx.lineWidth = baseSize * 0.34;
        ctx.beginPath();
        ctx.moveTo(leftShoulderX + 0.6, leftShoulderY + 0.6);
        ctx.lineTo(leftElbowX + 0.6, leftElbowY + 0.6);
        ctx.lineTo(leftWristX + 0.6, leftWristY + 0.6);
        ctx.stroke();
        
        const leftUpperArmGradient = ctx.createLinearGradient(leftShoulderX, leftShoulderY, leftElbowX, leftElbowY);
        leftUpperArmGradient.addColorStop(0, '#E8D4B8');
        leftUpperArmGradient.addColorStop(1, `rgba(201, 168, 118, ${0.89 + Math.abs(leftSwingForward) * 0.11})`);
        
        ctx.strokeStyle = leftUpperArmGradient;
        ctx.lineWidth = baseSize * 0.36;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(leftShoulderX, leftShoulderY);
        ctx.lineTo(leftElbowX, leftElbowY);
        ctx.stroke();
        
        const leftLowerArmGradient = ctx.createLinearGradient(leftElbowX, leftElbowY, leftWristX, leftWristY);
        leftLowerArmGradient.addColorStop(0, `rgba(232, 212, 184, ${0.94 + Math.abs(leftSwingForward) * 0.06})`);
        leftLowerArmGradient.addColorStop(1, '#C9A876');
        
        ctx.strokeStyle = leftLowerArmGradient;
        ctx.lineWidth = baseSize * 0.28;
        ctx.beginPath();
        ctx.moveTo(leftElbowX, leftElbowY);
        ctx.lineTo(leftWristX, leftWristY);
        ctx.stroke();
        
        // Left hand with gauntlet
        ctx.fillStyle = '#5a6a7a';
        ctx.beginPath();
        ctx.arc(leftWristX, leftWristY, baseSize * 0.19, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        ctx.arc(leftWristX, leftWristY, baseSize * 0.19, 0, Math.PI * 2);
        ctx.stroke();
        
        // --- LEFT ARM SHIELD (KITE SHIELD) - PROTECTIVE POSITION ---
        
        // Shield positioned at upper body with curved arm protection
        const shieldX = leftWristX - baseSize * 0.25; // Further left for curved arm
        const shieldY = leftWristY - baseSize * 0.15; // Higher up on body
        this.drawKiteShield(ctx, shieldX, shieldY, baseSize, 0.1); // Minimal rotation, more protective
        
        // --- RIGHT ARM WITH SCIMITAR ---
        
        const rightShoulderX = baseSize * 0.54;
        const rightShoulderY = -baseSize * 0.38;
        
        const rightSwingForward = rightArmBase;
        const rightArmDropAmount = -rightSwingForward * 0.7;
        const rightArmForwardOffset = rightSwingForward * 0.3;
        
        const rightElbowX = rightShoulderX + rightArmForwardOffset * baseSize * 0.44;
        const rightElbowY = rightShoulderY + baseSize * 0.5 + rightArmDropAmount * baseSize * 0.32;
        
        const rightWristX = rightElbowX + rightArmForwardOffset * baseSize * 0.38;
        const rightWristY = rightElbowY + (baseSize * 0.65 + rightArmBend * baseSize * 0.16);
        
        ctx.strokeStyle = `rgba(0, 0, 0, ${0.11 + Math.max(0, rightSwingForward) * 0.16})`;
        ctx.lineWidth = baseSize * 0.34;
        ctx.beginPath();
        ctx.moveTo(rightShoulderX + 0.6, rightShoulderY + 0.6);
        ctx.lineTo(rightElbowX + 0.6, rightElbowY + 0.6);
        ctx.lineTo(rightWristX + 0.6, rightWristY + 0.6);
        ctx.stroke();
        
        const rightUpperArmGradient = ctx.createLinearGradient(rightShoulderX, rightShoulderY, rightElbowX, rightElbowY);
        rightUpperArmGradient.addColorStop(0, '#E8D4B8');
        rightUpperArmGradient.addColorStop(1, `rgba(201, 168, 118, ${0.89 + Math.abs(rightSwingForward) * 0.11})`);
        
        ctx.strokeStyle = rightUpperArmGradient;
        ctx.lineWidth = baseSize * 0.36;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(rightShoulderX, rightShoulderY);
        ctx.lineTo(rightElbowX, rightElbowY);
        ctx.stroke();
        
        const rightLowerArmGradient = ctx.createLinearGradient(rightElbowX, rightElbowY, rightWristX, rightWristY);
        rightLowerArmGradient.addColorStop(0, `rgba(232, 212, 184, ${0.94 + Math.abs(rightSwingForward) * 0.06})`);
        rightLowerArmGradient.addColorStop(1, '#C9A876');
        
        ctx.strokeStyle = rightLowerArmGradient;
        ctx.lineWidth = baseSize * 0.28;
        ctx.beginPath();
        ctx.moveTo(rightElbowX, rightElbowY);
        ctx.lineTo(rightWristX, rightWristY);
        ctx.stroke();
        
        // Right hand with gauntlet
        ctx.fillStyle = '#5a6a7a';
        ctx.beginPath();
        ctx.arc(rightWristX, rightWristY, baseSize * 0.19, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        ctx.arc(rightWristX, rightWristY, baseSize * 0.19, 0, Math.PI * 2);
        ctx.stroke();
        
        // --- SCIMITAR - UPRIGHT OFFENSIVE POSITION ---
        
        this.drawScimitar(ctx, rightWristX, rightWristY, baseSize, rightSwingForward);
        
        // --- LEGS ---
        
        const leftHipX = -baseSize * 0.27;
        const leftHipY = baseSize * 0.36;
        
        const leftLegAngle = walkCycle * 0.35;
        const leftFootX = leftHipX + Math.sin(leftLegAngle) * baseSize * 0.75;
        const leftFootY = leftHipY + Math.cos(leftLegAngle) * baseSize * 0.85;
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = baseSize * 0.27;
        ctx.beginPath();
        ctx.moveTo(leftHipX + 1, leftHipY + 1);
        ctx.lineTo(leftFootX + 1, leftFootY + 1);
        ctx.stroke();
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = baseSize * 0.27;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(leftHipX, leftHipY);
        ctx.lineTo(leftFootX, leftFootY);
        ctx.stroke();
        
        const rightHipX = baseSize * 0.27;
        const rightHipY = baseSize * 0.36;
        
        const rightLegAngle = -walkCycle * 0.35;
        const rightFootX = rightHipX + Math.sin(rightLegAngle) * baseSize * 0.75;
        const rightFootY = rightHipY + Math.cos(rightLegAngle) * baseSize * 0.85;
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = baseSize * 0.27;
        ctx.beginPath();
        ctx.moveTo(rightHipX + 1, rightHipY + 1);
        ctx.lineTo(rightFootX + 1, rightFootY + 1);
        ctx.stroke();
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = baseSize * 0.27;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(rightHipX, rightHipY);
        ctx.lineTo(rightFootX, rightFootY);
        ctx.stroke();
        
        // --- BOOTS ---
        
        ctx.fillStyle = '#0d0d0d';
        ctx.beginPath();
        ctx.ellipse(leftFootX, leftFootY + baseSize * 0.16, baseSize * 0.22, baseSize * 0.17, walkCycle * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#0d0d0d';
        ctx.beginPath();
        ctx.ellipse(rightFootX, rightFootY + baseSize * 0.16, baseSize * 0.22, baseSize * 0.17, -walkCycle * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
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
    
    drawKiteShield(ctx, handX, handY, baseSize, armSwing) {
        ctx.save();
        ctx.translate(handX, handY);
        
        // Shield angle - angled to protect upper body
        const shieldAngle = 0.2; // Tilted to match curved arm
        ctx.rotate(shieldAngle);
        
        // Kite shield shape - much larger now
        const shieldWidth = baseSize * 0.58;
        const shieldHeight = baseSize * 0.95;
        const pointDepth = baseSize * 0.2;
        
        // Shield shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.moveTo(-shieldWidth / 2 + 0.8, -shieldHeight / 2 + 0.8);
        ctx.lineTo(shieldWidth / 2 + 0.8, -shieldHeight / 2 + 0.8);
        ctx.lineTo(shieldWidth / 2 + 0.8, shieldHeight / 2 - pointDepth + 0.8);
        ctx.lineTo(0 + 0.8, shieldHeight / 2 + pointDepth + 0.8);
        ctx.lineTo(-shieldWidth / 2 + 0.8, shieldHeight / 2 - pointDepth + 0.8);
        ctx.closePath();
        ctx.fill();
        
        // Main shield body with gradient
        const shieldGradient = ctx.createLinearGradient(-shieldWidth / 2, -shieldHeight / 2, shieldWidth / 2, shieldHeight / 2);
        shieldGradient.addColorStop(0, '#8a7a6a');
        shieldGradient.addColorStop(0.5, '#9a8a7a');
        shieldGradient.addColorStop(1, '#6a5a4a');
        
        ctx.fillStyle = shieldGradient;
        ctx.beginPath();
        ctx.moveTo(-shieldWidth / 2, -shieldHeight / 2);
        ctx.lineTo(shieldWidth / 2, -shieldHeight / 2);
        ctx.lineTo(shieldWidth / 2, shieldHeight / 2 - pointDepth);
        ctx.lineTo(0, shieldHeight / 2 + pointDepth);
        ctx.lineTo(-shieldWidth / 2, shieldHeight / 2 - pointDepth);
        ctx.closePath();
        ctx.fill();
        
        // Shield edge
        ctx.strokeStyle = '#4a3a2a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-shieldWidth / 2, -shieldHeight / 2);
        ctx.lineTo(shieldWidth / 2, -shieldHeight / 2);
        ctx.lineTo(shieldWidth / 2, shieldHeight / 2 - pointDepth);
        ctx.lineTo(0, shieldHeight / 2 + pointDepth);
        ctx.lineTo(-shieldWidth / 2, shieldHeight / 2 - pointDepth);
        ctx.closePath();
        ctx.stroke();
        
        // Shield highlight (left side for shine) - larger
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.moveTo(-shieldWidth / 2 + baseSize * 0.1, -shieldHeight / 2 + baseSize * 0.12);
        ctx.lineTo(-shieldWidth / 2 + baseSize * 0.16, shieldHeight / 3);
        ctx.lineTo(-shieldWidth / 2 + baseSize * 0.06, shieldHeight / 3);
        ctx.lineTo(-shieldWidth / 2 + baseSize * 0.06, -shieldHeight / 2 + baseSize * 0.12);
        ctx.closePath();
        ctx.fill();
        
        // Shield boss (raised center circle) - larger
        ctx.fillStyle = '#5a4a3a';
        ctx.beginPath();
        ctx.arc(0, -baseSize * 0.08, baseSize * 0.18, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#3a2a1a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 0.08, baseSize * 0.18, 0, Math.PI * 2);
        ctx.stroke();
        
        // Boss highlight - larger
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.08, -baseSize * 0.16, baseSize * 0.08, 0, Math.PI * 2);
        ctx.fill();
        
        // Additional shield straps/bands for detail
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-shieldWidth / 2 + baseSize * 0.08, -shieldHeight / 4);
        ctx.lineTo(shieldWidth / 2 - baseSize * 0.08, -shieldHeight / 4);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-shieldWidth / 2 + baseSize * 0.08, shieldHeight / 6);
        ctx.lineTo(shieldWidth / 2 - baseSize * 0.08, shieldHeight / 6);
        ctx.stroke();
        
        ctx.restore();
    }
    
    drawScimitar(ctx, handX, handY, baseSize, armSwing) {
        ctx.save();
        ctx.translate(handX, handY);
        
        // Scimitar angle - held upright with pommel down
        const swordAngle = -Math.PI / 2; // Perfectly upright
        ctx.rotate(swordAngle);
        
        const swordLength = baseSize * 1.8;
        const bladeWidth = baseSize * 0.2;
        const curveAmount = -baseSize * 0.4; // Negative for curve pointing upward
        
        // Sword shadow
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = bladeWidth;
        ctx.beginPath();
        ctx.moveTo(0.8, 0.8);
        ctx.quadraticCurveTo(curveAmount + 0.8, swordLength / 2 + 0.8, 0.8, swordLength + 0.8);
        ctx.stroke();
        
        // Scimitar blade - curved upward with gradient
        const bladeGradient = ctx.createLinearGradient(0, 0, curveAmount * 2, swordLength);
        bladeGradient.addColorStop(0, '#C0C0C0');
        bladeGradient.addColorStop(0.5, '#D0D0D0');
        bladeGradient.addColorStop(1, '#A0A0A0');
        
        ctx.strokeStyle = bladeGradient;
        ctx.lineWidth = bladeWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(curveAmount, swordLength / 2, 0, swordLength);
        ctx.stroke();
        
        // Blade edge highlight (curved side pointing up) - more prominent
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = baseSize * 0.08;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.03, baseSize * 0.1);
        ctx.quadraticCurveTo(curveAmount * 0.85, swordLength / 2, -baseSize * 0.03, swordLength - baseSize * 0.12);
        ctx.stroke();
        
        // Sword tip - sharp point at top
        ctx.fillStyle = '#808080';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.1, swordLength - baseSize * 0.12);
        ctx.lineTo(baseSize * 0.1, swordLength - baseSize * 0.12);
        ctx.lineTo(0, swordLength + baseSize * 0.12);
        ctx.closePath();
        ctx.fill();
        
        // Sword guard (crossbar) - larger
        ctx.fillStyle = '#D4AF37';
        ctx.fillRect(-baseSize * 0.35, -baseSize * 0.12, baseSize * 0.7, baseSize * 0.24);
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 1;
        ctx.strokeRect(-baseSize * 0.35, -baseSize * 0.12, baseSize * 0.7, baseSize * 0.24);
        
        // Guard details - crossbar ornaments
        ctx.fillStyle = '#C9A534';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.22, 0, baseSize * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(baseSize * 0.22, 0, baseSize * 0.04, 0, Math.PI * 2);
        ctx.fill();
        
        // Sword pommel (handle) - positioned at bottom when upright
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-baseSize * 0.1, baseSize * 0.12, baseSize * 0.2, baseSize * 0.3);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(-baseSize * 0.1, baseSize * 0.12, baseSize * 0.2, baseSize * 0.3);
        
        // Pommel cap
        ctx.fillStyle = '#D4AF37';
        ctx.beginPath();
        ctx.arc(0, baseSize * 0.44, baseSize * 0.08, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(0, baseSize * 0.44, baseSize * 0.08, 0, Math.PI * 2);
        ctx.stroke();
        
        // Pommel highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.03, baseSize * 0.40, baseSize * 0.04, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    darkenColor(color, factor) {
        return super.darkenColor(color, factor);
    }
}
