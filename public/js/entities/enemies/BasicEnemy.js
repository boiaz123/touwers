import { BaseEnemy } from './BaseEnemy.js';

export class BasicEnemy extends BaseEnemy {
    constructor(path, health_multiplier = 1.0, speed = 50) {
        super(path, 100 * health_multiplier, speed);
        this.tunicColor = this.getRandomTunicColor();
        this.tunicColorHex = this.hexToRgb(this.tunicColor);
        
        this.attackDamage = 5;
        this.attackSpeed = 1.0;
        
        // Pre-calculate darkened tunic color for performance
        this.tunicDarkRGB = this.getRgbDarkenedByAmount(this.tunicColorHex, 0.2);
        
        // Animation cache to reduce computation
        this.cachedAnimFrame = -1;
        this.cachedAnimValues = null;
    }
    
    getRandomTunicColor() {
        const tunicColors = [
            '#8B4513', '#4169E1', '#DC143C', '#2F4F4F', '#556B2F', '#8B008B'
        ];
        return tunicColors[Math.floor(Math.random() * tunicColors.length)];
    }
    
    hexToRgb(hex) {
        // Parse hex color to RGB array
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [139, 69, 19];
    }
    
    getRgbDarkenedByAmount(rgb, factor) {
        return [
            Math.max(0, rgb[0] * (1 - factor)),
            Math.max(0, rgb[1] * (1 - factor)),
            Math.max(0, rgb[2] * (1 - factor))
        ];
    }
    
    getAnimationFrame(time) {
        // Cache animation calculations every 2 frames to reduce recalculation
        const frameKey = Math.floor(time * 30) >> 1; // Every 2 frames
        
        if (this.cachedAnimFrame === frameKey && this.cachedAnimValues) {
            return this.cachedAnimValues;
        }
        
        const animTime = time * 8 + this.animationPhaseOffset;
        const walkCycle = Math.sin(animTime) * 0.5;
        const bobAnimation = Math.sin(animTime) * 0.3;
        const armSwingFreq = animTime;
        
        this.cachedAnimValues = {
            walkCycle,
            bobAnimation,
            leftArmBase: Math.sin(armSwingFreq) * 0.6,
            rightArmBase: Math.sin(armSwingFreq + Math.PI) * 0.55,
            animTime
        };
        this.cachedAnimFrame = frameKey;
        return this.cachedAnimValues;
    }
    
    render(ctx) {
        const baseSize = Math.max(6, Math.min(14, ctx.canvas.width / 150));
        const anim = this.getAnimationFrame(this.animationTime);
        const bobAnimation = anim.bobAnimation;
        const walkCycle = anim.walkCycle;
        const leftArmBase = anim.leftArmBase;
        const rightArmBase = anim.rightArmBase;
        
        // Simplified shadow - single fillRect instead of ellipse
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(this.x - baseSize * 0.8, this.y + baseSize * 1.5, baseSize * 1.6, baseSize * 0.3);
        
        ctx.save();
        ctx.translate(this.x, this.y + bobAnimation);
        
        // --- BODY (SIMPLIFIED) ---
        
        // Dark back layer
        ctx.fillStyle = `rgb(${this.tunicDarkRGB[0]},${this.tunicDarkRGB[1]},${this.tunicDarkRGB[2]})`;
        ctx.fillRect(-baseSize * 0.6, -baseSize * 0.75, baseSize * 1.3, baseSize * 1.1);
        
        // Main tunic - NO gradient, just solid color with outline
        ctx.fillStyle = `rgb(${this.tunicColorHex[0]},${this.tunicColorHex[1]},${this.tunicColorHex[2]})`;
        ctx.fillRect(-baseSize * 0.6, -baseSize * 0.8, baseSize * 1.2, baseSize * 1.2);
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.strokeRect(-baseSize * 0.6, -baseSize * 0.8, baseSize * 1.2, baseSize * 1.2);
        
        // Simple highlight - just one rectangle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(-baseSize * 0.55, -baseSize * 0.7, baseSize * 0.15, baseSize * 0.7);
        
        // --- HEAD (SIMPLIFIED) ---
        
        ctx.fillStyle = '#D9C4A8';
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.2, baseSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#B8956A';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        
        // --- HELMET (SIMPLIFIED) ---
        
        ctx.fillStyle = '#696969';
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.2, baseSize * 0.62, Math.PI * 0.95, Math.PI * 2.05);
        ctx.fill();
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.62, -baseSize * 1.2);
        ctx.lineTo(baseSize * 0.62, -baseSize * 1.2);
        ctx.stroke();
        
        // Simple highlight dot instead of full circle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.2, -baseSize * 1.35, baseSize * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // --- ARMS (OPTIMIZED) ---
        
        // Left arm
        const leftShoulderX = -baseSize * 0.5;
        const leftShoulderY = -baseSize * 0.35;
        const leftSwingForward = leftArmBase;
        const leftElbowX = leftShoulderX + leftSwingForward * baseSize * 0.12;
        const leftElbowY = leftShoulderY + baseSize * 0.45 - leftSwingForward * baseSize * 0.2;
        const leftWristX = leftElbowX + leftSwingForward * baseSize * 0.1;
        const leftWristY = leftElbowY + baseSize * 0.5;
        
        // Single stroke for both upper and lower arm
        ctx.strokeStyle = '#D9C4A8';
        ctx.lineWidth = baseSize * 0.28;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(leftShoulderX, leftShoulderY);
        ctx.lineTo(leftElbowX, leftElbowY);
        ctx.lineTo(leftWristX, leftWristY);
        ctx.stroke();
        
        // Left hand
        ctx.fillStyle = '#DDD4B8';
        ctx.beginPath();
        ctx.arc(leftWristX, leftWristY, baseSize * 0.14, 0, Math.PI * 2);
        ctx.fill();
        
        // Right arm
        const rightShoulderX = baseSize * 0.5;
        const rightShoulderY = -baseSize * 0.35;
        const rightSwingForward = rightArmBase;
        const rightElbowX = rightShoulderX + rightSwingForward * baseSize * 0.12;
        const rightElbowY = rightShoulderY + baseSize * 0.45 - rightSwingForward * baseSize * 0.2;
        const rightWristX = rightElbowX + rightSwingForward * baseSize * 0.1;
        const rightWristY = rightElbowY + baseSize * 0.5;
        
        ctx.strokeStyle = '#D9C4A8';
        ctx.lineWidth = baseSize * 0.28;
        ctx.beginPath();
        ctx.moveTo(rightShoulderX, rightShoulderY);
        ctx.lineTo(rightElbowX, rightElbowY);
        ctx.lineTo(rightWristX, rightWristY);
        ctx.stroke();
        
        ctx.fillStyle = '#DDD4B8';
        ctx.beginPath();
        ctx.arc(rightWristX, rightWristY, baseSize * 0.14, 0, Math.PI * 2);
        ctx.fill();
        
        // --- LEGS (SIMPLIFIED) ---
        
        const leftHipX = -baseSize * 0.25;
        const leftHipY = baseSize * 0.35;
        const leftLegAngle = walkCycle * 0.35;
        const leftFootX = leftHipX + Math.sin(leftLegAngle) * baseSize * 0.65;
        const leftFootY = leftHipY + Math.cos(leftLegAngle) * baseSize * 0.75;
        
        // Left leg - single line
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = baseSize * 0.22;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(leftHipX, leftHipY);
        ctx.lineTo(leftFootX, leftFootY);
        ctx.stroke();
        
        const rightHipX = baseSize * 0.25;
        const rightHipY = baseSize * 0.35;
        const rightLegAngle = -walkCycle * 0.35;
        const rightFootX = rightHipX + Math.sin(rightLegAngle) * baseSize * 0.65;
        const rightFootY = rightHipY + Math.cos(rightLegAngle) * baseSize * 0.75;
        
        // Right leg - single line
        ctx.beginPath();
        ctx.moveTo(rightHipX, rightHipY);
        ctx.lineTo(rightFootX, rightFootY);
        ctx.stroke();
        
        // --- BOOTS (SIMPLIFIED) ---
        
        ctx.fillStyle = '#1C1C1C';
        ctx.beginPath();
        ctx.arc(leftFootX, leftFootY + baseSize * 0.12, baseSize * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(rightFootX, rightFootY + baseSize * 0.12, baseSize * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Render hit splatters
        if (this.hitSplatters.length > 0) {
            this.hitSplatters.forEach(splatter => splatter.render(ctx));
        }
        
        // --- HEALTH BAR (OPTIMIZED) ---
        
        const barWidth = baseSize * 3;
        const barHeight = baseSize * 0.35;
        const barY = this.y - baseSize * 2.1;
        const barX = this.x - barWidth / 2;
        const healthPercent = this.health / this.maxHealth;
        
        // Background
        ctx.fillStyle = '#000';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health fill
        ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : (healthPercent > 0.25 ? '#FFC107' : '#F44336');
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Border
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
}
