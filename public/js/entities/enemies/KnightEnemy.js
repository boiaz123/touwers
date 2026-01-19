import { BaseEnemy } from './BaseEnemy.js';

export class KnightEnemy extends BaseEnemy {
    static BASE_STATS = {
        health: 160,
        speed: 40,
        armour: 8,
        magicResistance: -0.2
    };

    constructor(path, health_multiplier = 1.0, speed = null, armour = null, magicResistance = null) {
        const baseStats = KnightEnemy.BASE_STATS;
        const actualSpeed = speed !== null ? speed : baseStats.speed;
        const actualArmour = armour !== null ? armour : baseStats.armour;
        const actualMagicResistance = magicResistance !== null ? magicResistance : baseStats.magicResistance;
        
        super(path, baseStats.health * health_multiplier, actualSpeed, actualArmour, actualMagicResistance);
        this.lootDropChance = 0.1; // 40% chance to drop loot (heavily armored)
        this.armorColor = '#4A5568';
        this.sizeMultiplier = 1.15;
        
        this.attackDamage = 7;
        this.attackSpeed = 0.7;
        
    }
    
    updatePath(newPath) {
        if (!newPath || newPath.length === 0) {
            console.warn('KnightEnemy: Received invalid path');
            return;
        }
        
        const oldPath = this.path;
        this.path = newPath;
        
        if (oldPath && oldPath.length > 0 && this.currentPathIndex < oldPath.length) {
            const totalOldSegments = oldPath.length - 1;
            const progressRatio = this.currentPathIndex / Math.max(1, totalOldSegments);
            
            const totalNewSegments = this.path.length - 1;
            this.currentPathIndex = Math.floor(progressRatio * totalNewSegments);
            this.currentPathIndex = Math.max(0, Math.min(this.currentPathIndex, this.path.length - 2));
            
            if (this.currentPathIndex < this.path.length) {
                this.x = this.path[this.currentPathIndex].x;
                this.y = this.path[this.currentPathIndex].y;
            }
        } else {
            this.currentPathIndex = 0;
            this.x = this.path[0].x;
            this.y = this.path[0].y;
        }
        
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
        
        if (this.reachedEnd || !this.path || this.path.length === 0) return;
        
        if (this.currentPathIndex >= this.path.length - 1) {
            this.reachedEnd = true;
            return;
        }
        
        const target = this.path[this.currentPathIndex + 1];
        if (!target) {
            this.reachedEnd = true;
            return;
        }
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distSq = dx * dx + dy * dy;
        
        const reachThreshold = Math.max(5, this.speed * deltaTime * 2);
        const reachThresholdSq = reachThreshold * reachThreshold;
        
        if (distSq < reachThresholdSq) {
            this.currentPathIndex++;
            this.x = target.x;
            this.y = target.y;
            return;
        }
        
        const moveDistance = this.speed * deltaTime;
        const distance = Math.sqrt(distSq);
        this.x += (dx / distance) * moveDistance;
        this.y += (dy / distance) * moveDistance;
    }
    
    takeDamage(amount, armorPiercingPercent = 0, damageType = 'physical', followTarget = false) {
        super.takeDamage(amount, armorPiercingPercent, damageType, followTarget);
    }
    
    isDead() {
        return this.health <= 0;
    }
    
    render(ctx) {
        const baseSize = Math.max(7.2, Math.min(16.8, ctx.canvas.width / 150)) * this.sizeMultiplier;
        
        // Pre-calculate animation values once
        const animTime = (this.animationTime * 7 + this.animationPhaseOffset);
        const sinAnimTime = Math.sin(animTime);
        const cosAnimTime = Math.cos(animTime);
        const walkCycle = sinAnimTime * 0.4;
        const bobAnimation = sinAnimTime * 0.25;
        
        const leftArmBase = sinAnimTime * 0.4;
        const rightArmBase = -sinAnimTime * 0.4;
        
        // Enemy shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + baseSize * 1.5, baseSize * 0.95, baseSize * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.save();
        ctx.translate(this.x, this.y + bobAnimation);
        
        // --- ARMOR BODY PLATE ---
        
        // Main chest plate (simplified - removed gradient)
        ctx.fillStyle = this.armorColor;
        ctx.fillRect(-baseSize * 0.65, -baseSize * 0.7, baseSize * 1.3, baseSize * 1.05);
        
        // Armor outline
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-baseSize * 0.65, -baseSize * 0.7, baseSize * 1.3, baseSize * 1.05);
        
        // --- SHOULDER PAULDRONS (Armor) ---
        
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
        
        // --- ARMOR RIVETS AND DETAILS ---
        
        // Chest plate rivets (reduced from 12 to 4)
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        ctx.arc(0, -baseSize * 0.5, 0.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, -baseSize * 0.2, 0.9, 0, Math.PI * 2);
        ctx.fill();
        
        // --- HEAD WITH CLOSED HELM ---
        
        // Head (simplified - removed gradients)
        ctx.fillStyle = '#C4A575';
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.25, baseSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // --- CLOSED HELM (Full Plate) ---
        
        // Helm body - full coverage (solid color)
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
        
        // --- LEFT ARM WITH ARMORED GAUNTLET ---
        
        const leftShoulderX = -baseSize * 0.65;
        const leftShoulderY = -baseSize * 0.35;
        
        // Left arm holding sword - angled downward to grip pommel
        const leftArmAngle = -0.3 + leftArmBase * 0.1; // Pointing down and slightly forward
        const leftElbowX = leftShoulderX + Math.cos(leftArmAngle) * baseSize * 0.4;
        const leftElbowY = leftShoulderY + Math.sin(leftArmAngle) * baseSize * 0.45;
        
        // Extended forearm to reach pommel - converge at center
        const leftWristX = leftElbowX + Math.cos(leftArmAngle) * baseSize * 0.45;
        const leftWristY = leftElbowY + Math.sin(leftArmAngle) * baseSize * 0.5;
        
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
        
        // Left gauntlet at pommel grip
        ctx.fillStyle = '#5A6B7A';
        ctx.beginPath();
        ctx.arc(leftWristX, leftWristY, baseSize * 0.24, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(leftWristX, leftWristY, baseSize * 0.24, 0, Math.PI * 2);
        ctx.stroke();
        
        // Gauntlet detail - armor plates
        ctx.fillStyle = '#4A5568';
        ctx.fillRect(leftWristX - baseSize * 0.12, leftWristY - baseSize * 0.18, baseSize * 0.24, baseSize * 0.08);
        ctx.fillRect(leftWristX - baseSize * 0.12, leftWristY + baseSize * 0.08, baseSize * 0.24, baseSize * 0.08);
        
        // --- RIGHT ARM WITH ARMORED GAUNTLET (LOWER HAND) ---
        
        const rightShoulderX = baseSize * 0.65;
        const rightShoulderY = -baseSize * 0.35;
        
        // Right arm holding sword - angled downward to grip pommel
        const rightArmAngle = -2.84 + rightArmBase * 0.1; // Pointing down and slightly forward
        const rightElbowX = rightShoulderX + Math.cos(rightArmAngle) * baseSize * 0.4;
        const rightElbowY = rightShoulderY + Math.sin(rightArmAngle) * baseSize * 0.45;
        
        // Extended forearm to reach pommel - converge at center
        const rightWristX = rightElbowX + Math.cos(rightArmAngle) * baseSize * 0.45;
        const rightWristY = rightElbowY + Math.sin(rightArmAngle) * baseSize * 0.5;
        
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
        
        // Right gauntlet at pommel grip
        ctx.fillStyle = '#5A6B7A';
        ctx.beginPath();
        ctx.arc(rightWristX, rightWristY, baseSize * 0.24, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(rightWristX, rightWristY, baseSize * 0.24, 0, Math.PI * 2);
        ctx.stroke();
        
        // Gauntlet detail - armor plates
        ctx.fillStyle = '#4A5568';
        ctx.fillRect(rightWristX - baseSize * 0.12, rightWristY - baseSize * 0.18, baseSize * 0.24, baseSize * 0.08);
        ctx.fillRect(rightWristX - baseSize * 0.12, rightWristY + baseSize * 0.08, baseSize * 0.24, baseSize * 0.08);
        
        // Draw two-handed sword - uses BOTH hand positions and moves with walk cycle
        this.drawTwoHandedSword(ctx, leftWristX, leftWristY, rightWristX, rightWristY, baseSize, leftArmAngle, walkCycle);
        
        // --- LEGS WITH LEG ARMOR ---
        
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
        
        // Left knee joint - detailed armor
        ctx.fillStyle = '#5A6B7A';
        ctx.beginPath();
        ctx.arc(leftKneeX, leftKneeY, baseSize * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Left knee detail - plates
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(leftKneeX - baseSize * 0.08, leftKneeY - baseSize * 0.12, baseSize * 0.16, baseSize * 0.08);
        
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
        
        // Right knee joint - detailed armor
        ctx.fillStyle = '#5A6B7A';
        ctx.beginPath();
        ctx.arc(rightKneeX, rightKneeY, baseSize * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Right knee detail - plates
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(rightKneeX - baseSize * 0.08, rightKneeY - baseSize * 0.12, baseSize * 0.16, baseSize * 0.08);
        
        // Right leg lower shin armor
        ctx.strokeStyle = '#4A5568';
        ctx.lineWidth = baseSize * 0.26;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(rightKneeX, rightKneeY);
        ctx.lineTo(rightFootX, rightFootY);
        ctx.stroke();
        
        // --- ARMORED BOOTS ---
        
        // Left boot - detailed armor
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.ellipse(leftFootX, leftFootY + baseSize * 0.18, baseSize * 0.26, baseSize * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#5A6B7A';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(leftFootX, leftFootY + baseSize * 0.18, baseSize * 0.26, baseSize * 0.2, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Left boot armor bands
        ctx.strokeStyle = '#4A5568';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(leftFootX, leftFootY + baseSize * 0.05, baseSize * 0.26, baseSize * 0.08, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Right boot - detailed armor
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.ellipse(rightFootX, rightFootY + baseSize * 0.18, baseSize * 0.26, baseSize * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#5A6B7A';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(rightFootX, rightFootY + baseSize * 0.18, baseSize * 0.26, baseSize * 0.2, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Right boot armor bands
        ctx.strokeStyle = '#4A5568';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(rightFootX, rightFootY + baseSize * 0.05, baseSize * 0.26, baseSize * 0.08, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
        
        // Health bar
        const barWidth = baseSize * 3.4;
        const barHeight = Math.max(2.4, baseSize * 0.48);
        const barY = this.y - baseSize * 2.3;
        
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
    
    drawTwoHandedSword(ctx, leftHandX, leftHandY, rightHandX, rightHandY, baseSize, armAngle, walkCycle) {
        ctx.save();
        
        const swordCenterX = (leftHandX + rightHandX) / 2;
        const swordCenterY = (leftHandY + rightHandY) / 2;
        
        const swordTilt = walkCycle * 0.08;
        const swordAngle = armAngle + Math.PI / 2 + swordTilt;
        
        ctx.translate(swordCenterX, swordCenterY);
        ctx.rotate(swordAngle);
        
        const swordLength = baseSize * 2.4;
        const bladeWidth = baseSize * 0.35;
        
        // Sword blade - simplified (solid gradient)
        const bladeGradient = ctx.createLinearGradient(-bladeWidth/2, -swordLength * 0.5, bladeWidth/2, -swordLength * 0.5);
        bladeGradient.addColorStop(0, '#E0E0E0');
        bladeGradient.addColorStop(0.5, '#A0A0A0');
        bladeGradient.addColorStop(1, '#808080');
        
        ctx.fillStyle = bladeGradient;
        ctx.beginPath();
        ctx.moveTo(-bladeWidth/2, 0);
        ctx.lineTo(bladeWidth/2, 0);
        ctx.lineTo(baseSize * 0.15, -swordLength);
        ctx.lineTo(-baseSize * 0.15, -swordLength);
        ctx.closePath();
        ctx.fill();
        
        // Blade outline
        ctx.strokeStyle = '#505050';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        
        // --- SWORD CROSS-GUARD ---
        
        ctx.fillStyle = '#D4AF37';
        ctx.fillRect(-baseSize * 0.45, -baseSize * 0.12, baseSize * 0.9, baseSize * 0.24);
        
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-baseSize * 0.45, -baseSize * 0.12, baseSize * 0.9, baseSize * 0.24);
        
        // --- SWORD HANDLE ---
        
        const handleLength = baseSize * 0.6;
        ctx.fillStyle = '#654321';
        ctx.fillRect(-baseSize * 0.14, baseSize * 0.12, baseSize * 0.28, handleLength);
        
        // --- SWORD POMMEL ---
        
        ctx.fillStyle = '#D4AF37';
        ctx.beginPath();
        ctx.arc(0, baseSize * 0.8, baseSize * 0.22, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, baseSize * 0.8, baseSize * 0.22, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
    
    darkenColor(color, factor) {
        return super.darkenColor(color, factor);
    }
}
