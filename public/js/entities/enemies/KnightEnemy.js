import { BaseEnemy } from './BaseEnemy.js';

export class KnightEnemy extends BaseEnemy {
    constructor(path, health_multiplier = 1.0, speed = 40) {
        super(path, 160 * health_multiplier, speed);
        this.armorColor = '#4A5568';
        this.sizeMultiplier = 1.15;
        
        this.attackDamage = 7;
        this.attackSpeed = 0.7;
        
        console.log('KnightEnemy: Created at position', this.x, this.y);
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
        
        console.log('KnightEnemy: Path updated, now at index', this.currentPathIndex, 'position', this.x, this.y);
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
        
        if (this.reachedEnd || !this.path || this.path.length === 0) return;
        
        if (this.currentPathIndex >= this.path.length - 1) {
            this.reachedEnd = true;
            console.log('KnightEnemy: Reached end of path');
            return;
        }
        
        const target = this.path[this.currentPathIndex + 1];
        if (!target) {
            this.reachedEnd = true;
            console.log('KnightEnemy: No target waypoint, reached end');
            return;
        }
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.hypot(dx, dy);
        
        const reachThreshold = Math.max(5, this.speed * deltaTime * 2);
        
        if (distance < reachThreshold) {
            this.currentPathIndex++;
            this.x = target.x;
            this.y = target.y;
            return;
        }
        
        const moveDistance = this.speed * deltaTime;
        this.x += (dx / distance) * moveDistance;
        this.y += (dy / distance) * moveDistance;
    }
    
    takeDamage(amount, ignoreArmor = false, damageType = 'physical', followTarget = false) {
        super.takeDamage(amount, ignoreArmor, damageType, followTarget);
    }
    
    isDead() {
        return this.health <= 0;
    }
    
    render(ctx) {
        const baseSize = Math.max(7.2, Math.min(16.8, ctx.canvas.width / 150)) * this.sizeMultiplier;
        
        const walkCycle = Math.sin(this.animationTime * 7) * 0.4; // Slower walk cycle
        const bobAnimation = Math.sin(this.animationTime * 7) * 0.25;
        
        const armSwingFreq = this.animationTime * 7;
        const leftArmBase = Math.sin(armSwingFreq) * 0.4;
        const rightArmBase = Math.sin(armSwingFreq + Math.PI) * 0.4; // Both arms swing together for sword
        
        // Enemy shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + baseSize * 1.5, baseSize * 0.95, baseSize * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.save();
        ctx.translate(this.x, this.y + bobAnimation);
        
        // Back/depth layer
        ctx.fillStyle = this.darkenColor(this.armorColor, 0.3);
        ctx.fillRect(-baseSize * 0.7, -baseSize * 0.75, baseSize * 1.4, baseSize * 1.15);
        
        // --- ARMOR BODY PLATE ---
        
        // Main chest plate
        const armorGradient = ctx.createLinearGradient(-baseSize * 0.65, -baseSize * 0.7, baseSize * 0.65, baseSize * 0.35);
        armorGradient.addColorStop(0, '#5A6B7A');
        armorGradient.addColorStop(0.5, this.armorColor);
        armorGradient.addColorStop(1, this.darkenColor(this.armorColor, 0.25));
        
        ctx.fillStyle = armorGradient;
        ctx.fillRect(-baseSize * 0.65, -baseSize * 0.7, baseSize * 1.3, baseSize * 1.05);
        
        // Armor outline
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-baseSize * 0.65, -baseSize * 0.7, baseSize * 1.3, baseSize * 1.05);
        
        // Center chest seam
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -baseSize * 0.7);
        ctx.lineTo(0, baseSize * 0.35);
        ctx.stroke();
        
        // --- SHOULDER PAULDRONS (Armor) ---
        
        // Left shoulder pauldron
        ctx.fillStyle = '#5A6B7A';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.7, -baseSize * 0.4, baseSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(-baseSize * 0.7, -baseSize * 0.4, baseSize * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        
        // Left pauldron highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.78, -baseSize * 0.5, baseSize * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Right shoulder pauldron
        ctx.fillStyle = '#5A6B7A';
        ctx.beginPath();
        ctx.arc(baseSize * 0.7, -baseSize * 0.4, baseSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(baseSize * 0.7, -baseSize * 0.4, baseSize * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        
        // Right pauldron highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(baseSize * 0.78, -baseSize * 0.5, baseSize * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // --- ARMOR RIVETS AND DETAILS ---
        
        // Chest plate rivets
        ctx.fillStyle = '#3a3a3a';
        for (let i = -1; i <= 1; i++) {
            for (let j = 0; j < 4; j++) {
                ctx.beginPath();
                ctx.arc(i * baseSize * 0.4, -baseSize * 0.5 + j * baseSize * 0.3, 0.9, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Armor accent lines (fluting)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 0.8;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(i * baseSize * 0.25, -baseSize * 0.65);
            ctx.lineTo(i * baseSize * 0.25, baseSize * 0.3);
            ctx.stroke();
        }
        
        // --- HEAD WITH CLOSED HELM ---
        
        // Head face layer
        ctx.fillStyle = '#C4A575';
        ctx.beginPath();
        ctx.arc(baseSize * 0.05, -baseSize * 1.25, baseSize * 0.55, 0, Math.PI * 2);
        ctx.fill();
        
        // Head gradient
        const headGradient = ctx.createRadialGradient(-baseSize * 0.1, -baseSize * 1.35, baseSize * 0.2, 0, -baseSize * 1.25, baseSize * 0.65);
        headGradient.addColorStop(0, '#E8D4B8');
        headGradient.addColorStop(0.6, '#DDBEA9');
        headGradient.addColorStop(1, '#C9A876');
        
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.25, baseSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // --- CLOSED HELM (Full Plate) ---
        
        // Helm body - full coverage
        const helmGradient = ctx.createLinearGradient(-baseSize * 0.7, -baseSize * 1.35, baseSize * 0.7, -baseSize * 0.85);
        helmGradient.addColorStop(0, '#606060');
        helmGradient.addColorStop(0.5, '#4a4a4a');
        helmGradient.addColorStop(1, '#2a2a2a');
        
        ctx.fillStyle = helmGradient;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.25, baseSize * 0.68, 0, Math.PI * 2);
        ctx.fill();
        
        // Helm outline
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.25, baseSize * 0.68, 0, Math.PI * 2);
        ctx.stroke();
        
        // Visor - narrow horizontal slit
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-baseSize * 0.35, -baseSize * 1.28, baseSize * 0.7, baseSize * 0.12);
        
        // Eye slit glow
        ctx.fillStyle = 'rgba(255, 100, 0, 0.4)';
        ctx.fillRect(-baseSize * 0.33, -baseSize * 1.26, baseSize * 0.66, baseSize * 0.08);
        
        // Nose guard - vertical ridge
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(-baseSize * 0.08, -baseSize * 1.25, baseSize * 0.16, baseSize * 0.4);
        
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1;
        ctx.strokeRect(-baseSize * 0.08, -baseSize * 1.25, baseSize * 0.16, baseSize * 0.4);
        
        // Helm highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.25, -baseSize * 1.42, baseSize * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // --- LEFT ARM WITH ARMORED GAUNTLET ---
        
        const leftShoulderX = -baseSize * 0.65;
        const leftShoulderY = -baseSize * 0.35;
        
        // Left arm holding sword (upper hand)
        const leftArmAngle = -Math.PI / 2 + 0.25 + leftArmBase * 0.15; // Slight rotation with arm swing
        const leftElbowX = leftShoulderX + Math.cos(leftArmAngle) * baseSize * 0.35;
        const leftElbowY = leftShoulderY + Math.sin(leftArmAngle) * baseSize * 0.3;
        
        const leftWristX = leftElbowX + Math.cos(leftArmAngle) * baseSize * 0.3;
        const leftWristY = leftElbowY + Math.sin(leftArmAngle) * baseSize * 0.25;
        
        // Left arm shadow
        ctx.strokeStyle = `rgba(0, 0, 0, ${0.12 + Math.max(0, leftArmBase) * 0.15})`;
        ctx.lineWidth = baseSize * 0.36;
        ctx.beginPath();
        ctx.moveTo(leftShoulderX + 0.6, leftShoulderY + 0.6);
        ctx.lineTo(leftElbowX + 0.6, leftElbowY + 0.6);
        ctx.lineTo(leftWristX + 0.6, leftWristY + 0.6);
        ctx.stroke();
        
        // Left upper arm
        const leftUpperArmGradient = ctx.createLinearGradient(leftShoulderX, leftShoulderY, leftElbowX, leftElbowY);
        leftUpperArmGradient.addColorStop(0, '#E8D4B8');
        leftUpperArmGradient.addColorStop(1, `rgba(201, 168, 118, ${0.85})`);
        
        ctx.strokeStyle = leftUpperArmGradient;
        ctx.lineWidth = baseSize * 0.38;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(leftShoulderX, leftShoulderY);
        ctx.lineTo(leftElbowX, leftElbowY);
        ctx.stroke();
        
        // Left lower arm
        const leftLowerArmGradient = ctx.createLinearGradient(leftElbowX, leftElbowY, leftWristX, leftWristY);
        leftLowerArmGradient.addColorStop(0, `rgba(232, 212, 184, ${0.9})`);
        leftLowerArmGradient.addColorStop(1, '#C9A876');
        
        ctx.strokeStyle = leftLowerArmGradient;
        ctx.lineWidth = baseSize * 0.3;
        ctx.beginPath();
        ctx.moveTo(leftElbowX, leftElbowY);
        ctx.lineTo(leftWristX, leftWristY);
        ctx.stroke();
        
        // Left gauntlet (armored hand)
        ctx.fillStyle = '#5A6B7A';
        ctx.beginPath();
        ctx.arc(leftWristX, leftWristY, baseSize * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(leftWristX, leftWristY, baseSize * 0.2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Left gauntlet detail
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(leftWristX - baseSize * 0.15, leftWristY - baseSize * 0.08, baseSize * 0.1, baseSize * 0.16);
        
        // --- RIGHT ARM WITH ARMORED GAUNTLET (LOWER HAND) ---
        
        const rightShoulderX = baseSize * 0.65;
        const rightShoulderY = -baseSize * 0.35;
        
        // Right arm holding sword (lower hand) - slightly different angle
        const rightArmAngle = -Math.PI / 2 + 0.5 + rightArmBase * 0.1; // Slightly more tilted than left
        const rightElbowX = rightShoulderX + Math.cos(rightArmAngle) * baseSize * 0.35;
        const rightElbowY = rightShoulderY + Math.sin(rightArmAngle) * baseSize * 0.3;
        
        const rightWristX = rightElbowX + Math.cos(rightArmAngle) * baseSize * 0.3;
        const rightWristY = rightElbowY + Math.sin(rightArmAngle) * baseSize * 0.25;
        
        // Right arm shadow
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = baseSize * 0.36;
        ctx.beginPath();
        ctx.moveTo(rightShoulderX + 0.6, rightShoulderY + 0.6);
        ctx.lineTo(rightElbowX + 0.6, rightElbowY + 0.6);
        ctx.lineTo(rightWristX + 0.6, rightWristY + 0.6);
        ctx.stroke();
        
        // Right upper arm
        const rightUpperArmGradient = ctx.createLinearGradient(rightShoulderX, rightShoulderY, rightElbowX, rightElbowY);
        rightUpperArmGradient.addColorStop(0, '#E8D4B8');
        rightUpperArmGradient.addColorStop(1, 'rgba(201, 168, 118, 0.85)');
        
        ctx.strokeStyle = rightUpperArmGradient;
        ctx.lineWidth = baseSize * 0.38;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(rightShoulderX, rightShoulderY);
        ctx.lineTo(rightElbowX, rightElbowY);
        ctx.stroke();
        
        // Right lower arm
        const rightLowerArmGradient = ctx.createLinearGradient(rightElbowX, rightElbowY, rightWristX, rightWristY);
        rightLowerArmGradient.addColorStop(0, 'rgba(232, 212, 184, 0.9)');
        rightLowerArmGradient.addColorStop(1, '#C9A876');
        
        ctx.strokeStyle = rightLowerArmGradient;
        ctx.lineWidth = baseSize * 0.3;
        ctx.beginPath();
        ctx.moveTo(rightElbowX, rightElbowY);
        ctx.lineTo(rightWristX, rightWristY);
        ctx.stroke();
        
        // Right gauntlet (armored hand)
        ctx.fillStyle = '#5A6B7A';
        ctx.beginPath();
        ctx.arc(rightWristX, rightWristY, baseSize * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(rightWristX, rightWristY, baseSize * 0.2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw two-handed sword - uses BOTH hand positions and moves with walk cycle
        this.drawTwoHandedSword(ctx, leftWristX, leftWristY, rightWristX, rightWristY, baseSize, leftArmAngle, walkCycle);
        
        // --- LEGS WITH LEG ARMOR ---
        
        const leftHipX = -baseSize * 0.28;
        const leftHipY = baseSize * 0.35;
        
        const leftLegAngle = walkCycle * 0.3;
        const leftFootX = leftHipX + Math.sin(leftLegAngle) * baseSize * 0.7;
        const leftFootY = leftHipY + Math.cos(leftLegAngle) * baseSize * 0.85;
        
        // Left leg shadow
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = baseSize * 0.28;
        ctx.beginPath();
        ctx.moveTo(leftHipX + 1, leftHipY + 1);
        ctx.lineTo(leftFootX + 1, leftFootY + 1);
        ctx.stroke();
        
        // Left leg armor
        ctx.strokeStyle = '#4A5568';
        ctx.lineWidth = baseSize * 0.28;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(leftHipX, leftHipY);
        ctx.lineTo(leftFootX, leftFootY);
        ctx.stroke();
        
        // Left knee joint
        ctx.fillStyle = '#5A6B7A';
        ctx.beginPath();
        ctx.arc(leftHipX + Math.sin(leftLegAngle) * baseSize * 0.35, leftHipY + Math.cos(leftLegAngle) * baseSize * 0.42, baseSize * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        const rightHipX = baseSize * 0.28;
        const rightHipY = baseSize * 0.35;
        
        const rightLegAngle = -walkCycle * 0.3;
        const rightFootX = rightHipX + Math.sin(rightLegAngle) * baseSize * 0.7;
        const rightFootY = rightHipY + Math.cos(rightLegAngle) * baseSize * 0.85;
        
        // Right leg shadow
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = baseSize * 0.28;
        ctx.beginPath();
        ctx.moveTo(rightHipX + 1, rightHipY + 1);
        ctx.lineTo(rightFootX + 1, rightFootY + 1);
        ctx.stroke();
        
        // Right leg armor
        ctx.strokeStyle = '#4A5568';
        ctx.lineWidth = baseSize * 0.28;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(rightHipX, rightHipY);
        ctx.lineTo(rightFootX, rightFootY);
        ctx.stroke();
        
        // Right knee joint
        ctx.fillStyle = '#5A6B7A';
        ctx.beginPath();
        ctx.arc(rightHipX + Math.sin(rightLegAngle) * baseSize * 0.35, rightHipY + Math.cos(rightLegAngle) * baseSize * 0.42, baseSize * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // --- ARMORED BOOTS ---
        
        // Left boot
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.ellipse(leftFootX, leftFootY + baseSize * 0.18, baseSize * 0.24, baseSize * 0.18, walkCycle * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#5A6B7A';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(leftFootX, leftFootY + baseSize * 0.18, baseSize * 0.24, baseSize * 0.18, walkCycle * 0.25, 0, Math.PI * 2);
        ctx.stroke();
        
        // Right boot
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.ellipse(rightFootX, rightFootY + baseSize * 0.18, baseSize * 0.24, baseSize * 0.18, -walkCycle * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#5A6B7A';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(rightFootX, rightFootY + baseSize * 0.18, baseSize * 0.24, baseSize * 0.18, -walkCycle * 0.25, 0, Math.PI * 2);
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
        
        // Calculate sword angle based on both hand positions and walking motion
        const swordCenterX = (leftHandX + rightHandX) / 2;
        const swordCenterY = (leftHandY + rightHandY) / 2;
        
        // Sword tilts forward and back with the walking cycle - REDUCED
        const swordTilt = walkCycle * 0.08; // Reduced from 0.2 to 0.08
        const swordAngle = armAngle + Math.PI / 2 + swordTilt;
        
        ctx.translate(swordCenterX, swordCenterY);
        ctx.rotate(swordAngle);
        
        // Massive two-handed sword - very long blade
        const swordLength = baseSize * 2.4;
        const bladeWidth = baseSize * 0.35;
        
        // Sword shadow
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = bladeWidth + baseSize * 0.08;
        ctx.beginPath();
        ctx.moveTo(baseSize * 0.15, baseSize * 0.1);
        ctx.lineTo(baseSize * 0.15, -swordLength);
        ctx.stroke();
        
        // Sword blade - steel with gradient
        const bladeGradient = ctx.createLinearGradient(0, 0, bladeWidth, 0);
        bladeGradient.addColorStop(0, '#E8E8E8');
        bladeGradient.addColorStop(0.4, '#C0C0C0');
        bladeGradient.addColorStop(0.5, '#A9A9A9');
        bladeGradient.addColorStop(0.6, '#C0C0C0');
        bladeGradient.addColorStop(1, '#808080');
        
        ctx.fillStyle = bladeGradient;
        ctx.beginPath();
        ctx.moveTo(-bladeWidth/2, 0);
        ctx.lineTo(bladeWidth/2, 0);
        ctx.lineTo(baseSize * 0.15, -swordLength);
        ctx.lineTo(-baseSize * 0.15, -swordLength);
        ctx.closePath();
        ctx.fill();
        
        // Blade edge highlight - sharp
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = baseSize * 0.1;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.08, 0);
        ctx.lineTo(baseSize * 0.12, -swordLength);
        ctx.stroke();
        
        // Blade outline
        ctx.strokeStyle = '#505050';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-bladeWidth/2, 0);
        ctx.lineTo(bladeWidth/2, 0);
        ctx.lineTo(baseSize * 0.15, -swordLength);
        ctx.lineTo(-baseSize * 0.15, -swordLength);
        ctx.closePath();
        ctx.stroke();
        
        // Blade blood grooves
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([baseSize * 0.15, baseSize * 0.1]);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -swordLength);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // --- SWORD CROSS-GUARD (LARGE) ---
        
        ctx.fillStyle = '#D4AF37';
        ctx.fillRect(-baseSize * 0.45, -baseSize * 0.12, baseSize * 0.9, baseSize * 0.24);
        
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-baseSize * 0.45, -baseSize * 0.12, baseSize * 0.9, baseSize * 0.24);
        
        // Cross-guard decorative gems
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.2, 0, baseSize * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(baseSize * 0.2, 0, baseSize * 0.08, 0, Math.PI * 2);
        ctx.fill();
        
        // --- SWORD HANDLE (LONG TWO-HANDED GRIP) ---
        
        const handleLength = baseSize * 0.6;
        const handleGradient = ctx.createLinearGradient(0, 0, 0, handleLength);
        handleGradient.addColorStop(0, '#8B4513');
        handleGradient.addColorStop(0.5, '#654321');
        handleGradient.addColorStop(1, '#3E2723');
        
        ctx.fillStyle = handleGradient;
        ctx.fillRect(-baseSize * 0.14, baseSize * 0.12, baseSize * 0.28, handleLength);
        
        // Handle wrapping
        ctx.strokeStyle = '#A0826D';
        ctx.lineWidth = baseSize * 0.08;
        for (let i = 0; i < 6; i++) {
            const wrapY = baseSize * 0.12 + (handleLength * i / 6);
            ctx.beginPath();
            ctx.moveTo(-baseSize * 0.18, wrapY);
            ctx.lineTo(baseSize * 0.18, wrapY);
            ctx.stroke();
        }
        
        // --- SWORD POMMEL (LARGE COUNTERWEIGHT) ---
        
        ctx.fillStyle = '#D4AF37';
        ctx.beginPath();
        ctx.arc(0, baseSize * 0.8, baseSize * 0.22, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, baseSize * 0.8, baseSize * 0.22, 0, Math.PI * 2);
        ctx.stroke();
        
        // Pommel detail - cross
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.08, baseSize * 0.72);
        ctx.lineTo(-baseSize * 0.08, baseSize * 0.88);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(baseSize * 0.08, baseSize * 0.72);
        ctx.lineTo(baseSize * 0.08, baseSize * 0.88);
        ctx.stroke();
        
        ctx.restore();
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
        
        // Calculate sword angle based on both hand positions and walking motion
        const swordCenterX = (leftHandX + rightHandX) / 2;
        const swordCenterY = (leftHandY + rightHandY) / 2;
        
        // Sword tilts forward and back with the walking cycle - REDUCED
        const swordTilt = walkCycle * 0.08; // Reduced from 0.2 to 0.08
        const swordAngle = armAngle + Math.PI / 2 + swordTilt;
        
        ctx.translate(swordCenterX, swordCenterY);
        ctx.rotate(swordAngle);
        
        // Massive two-handed sword - very long blade
        const swordLength = baseSize * 2.4;
        const bladeWidth = baseSize * 0.35;
        
        // Sword shadow
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = bladeWidth + baseSize * 0.08;
        ctx.beginPath();
        ctx.moveTo(baseSize * 0.15, baseSize * 0.1);
        ctx.lineTo(baseSize * 0.15, -swordLength);
        ctx.stroke();
        
        // Sword blade - steel with gradient
        const bladeGradient = ctx.createLinearGradient(0, 0, bladeWidth, 0);
        bladeGradient.addColorStop(0, '#E8E8E8');
        bladeGradient.addColorStop(0.4, '#C0C0C0');
        bladeGradient.addColorStop(0.5, '#A9A9A9');
        bladeGradient.addColorStop(0.6, '#C0C0C0');
        bladeGradient.addColorStop(1, '#808080');
        
        ctx.fillStyle = bladeGradient;
        ctx.beginPath();
        ctx.moveTo(-bladeWidth/2, 0);
        ctx.lineTo(bladeWidth/2, 0);
        ctx.lineTo(baseSize * 0.15, -swordLength);
        ctx.lineTo(-baseSize * 0.15, -swordLength);
        ctx.closePath();
        ctx.fill();
        
        // Blade edge highlight - sharp
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = baseSize * 0.1;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.08, 0);
        ctx.lineTo(baseSize * 0.12, -swordLength);
        ctx.stroke();
        
        // Blade outline
        ctx.strokeStyle = '#505050';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-bladeWidth/2, 0);
        ctx.lineTo(bladeWidth/2, 0);
        ctx.lineTo(baseSize * 0.15, -swordLength);
        ctx.lineTo(-baseSize * 0.15, -swordLength);
        ctx.closePath();
        ctx.stroke();
        
        // Blade blood grooves
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([baseSize * 0.15, baseSize * 0.1]);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -swordLength);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // --- SWORD CROSS-GUARD (LARGE) ---
        
        ctx.fillStyle = '#D4AF37';
        ctx.fillRect(-baseSize * 0.45, -baseSize * 0.12, baseSize * 0.9, baseSize * 0.24);
        
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-baseSize * 0.45, -baseSize * 0.12, baseSize * 0.9, baseSize * 0.24);
        
        // Cross-guard decorative gems
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.2, 0, baseSize * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(baseSize * 0.2, 0, baseSize * 0.08, 0, Math.PI * 2);
        ctx.fill();
        
        // --- SWORD HANDLE (LONG TWO-HANDED GRIP) ---
        
        const handleLength = baseSize * 0.6;
        const handleGradient = ctx.createLinearGradient(0, 0, 0, handleLength);
        handleGradient.addColorStop(0, '#8B4513');
        handleGradient.addColorStop(0.5, '#654321');
        handleGradient.addColorStop(1, '#3E2723');
        
        ctx.fillStyle = handleGradient;
        ctx.fillRect(-baseSize * 0.14, baseSize * 0.12, baseSize * 0.28, handleLength);
        
        // Handle wrapping
        ctx.strokeStyle = '#A0826D';
        ctx.lineWidth = baseSize * 0.08;
        for (let i = 0; i < 6; i++) {
            const wrapY = baseSize * 0.12 + (handleLength * i / 6);
            ctx.beginPath();
            ctx.moveTo(-baseSize * 0.18, wrapY);
            ctx.lineTo(baseSize * 0.18, wrapY);
            ctx.stroke();
        }
        
        // --- SWORD POMMEL (LARGE COUNTERWEIGHT) ---
        
        ctx.fillStyle = '#D4AF37';
        ctx.beginPath();
        ctx.arc(0, baseSize * 0.8, baseSize * 0.22, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, baseSize * 0.8, baseSize * 0.22, 0, Math.PI * 2);
        ctx.stroke();
        
        // Pommel detail - cross
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.08, baseSize * 0.72);
        ctx.lineTo(-baseSize * 0.08, baseSize * 0.88);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(baseSize * 0.08, baseSize * 0.72);
        ctx.lineTo(baseSize * 0.08, baseSize * 0.88);
        ctx.stroke();
        
        ctx.restore();
    }
    
    darkenColor(color, factor) {
        return super.darkenColor(color, factor);
    }
}
