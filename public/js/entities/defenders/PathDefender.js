import { DefenderBase } from './DefenderBase.js';

/**
 * PathDefender - A defender stationed on a specific point on the path
 * Spawned by GuardPost towers to block enemies at that location
 * 
 * Key differences from CastleDefender:
 * - Stationed at a fixed waypoint on the path (not in front of castle)
 * - Freezes enemies continuously while alive and in range
 * - Enemies engage when they reach the waypoint
 * - Simple rendering without complex animations
 */
export class PathDefender extends DefenderBase {
    constructor(level = 1) {
        super(level);
        this.type = 'path';
        
        // The waypoint on the path where this defender is stationed
        // Set by GuardPost when defender is hired
        this.stationedWaypoint = null;
    }

    /**
     * Update the defender's behavior
     * Freezes enemies in range and attacks the closest one
     */
    update(deltaTime, enemies) {
        this.animationTime += deltaTime;
        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
        this.damageFlashTimer = Math.max(0, this.damageFlashTimer - deltaTime);
        this.lastAttackTime += deltaTime;
        
        // Only act if defender is alive
        if (this.isDead()) {
            return;
        }
        
        // ATTACK: Find closest enemy and attack
        this.attackTarget = null;
        let closestDistance = this.attackRange;
        
        if (enemies && enemies.length > 0) {
            enemies.forEach(enemy => {
                if (!enemy.isDead()) {
                    const distance = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        this.attackTarget = enemy;
                    }
                }
            });
        }
        
        // Attack closest enemy if ready
        if (this.attackTarget && this.attackCooldown <= 0) {
            this.isAttacking = true;
            this.lastAttackTime = 0;
            const damage = this.getAttackDamage();
            this.attackTarget.takeDamage(damage);
            this.attackCooldown = 1.0 / this.attackSpeed;
        } else {
            // Stop attacking animation after 0.5 seconds
            if (this.lastAttackTime > 0.5) {
                this.isAttacking = false;
            }
        }
        
        // Update visual effects (hit splatters)
        this.hitSplatters = this.hitSplatters.filter(splatter => {
            splatter.update(deltaTime);
            return splatter.life > 0;
        });
    }

    /**
     * Render the path defender with simple appearance
     */
    render(ctx) {
        const baseSize = Math.max(7.2, Math.min(16.8, ctx.canvas.width / 150)) * this.sizeMultiplier;
        
        // Idle animations
        const breathe = Math.sin(this.animationTime * 1.5) * 0.15;
        const sway = Math.sin(this.animationTime * 0.8) * 0.2;
        const idleLeftArmSway = Math.sin(this.animationTime * 1.2) * 0.25;
        const idleRightArmSway = Math.sin(this.animationTime * 1.2 + Math.PI) * 0.25;
        
        // Attack animations
        let attackRightArmAngle = 0;
        let attackLeftArmAngle = 0;
        
        if (this.isAttacking) {
            const attackProgress = this.lastAttackTime / 0.5;
            const attackPower = Math.sin(Math.min(attackProgress, 1) * Math.PI);
            attackRightArmAngle = attackPower * 1.0;
            attackLeftArmAngle = attackPower * 0.4;
        }
        
        // Damage flash
        if (this.damageFlashTimer > 0) {
            const flashIntensity = this.damageFlashTimer / 0.2;
            ctx.fillStyle = `rgba(255, 100, 100, ${flashIntensity * 0.3})`;
            ctx.fillRect(this.x - baseSize * 0.8, this.y - baseSize * 1.8, baseSize * 1.6, baseSize * 2.4);
        }
        
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + baseSize * 1.8, baseSize * 1.1, baseSize * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Body with breathing
        ctx.save();
        ctx.translate(0, breathe * 0.3 + sway * 0.1);
        
        // Legs
        this.renderLegs(ctx, baseSize);
        
        // Torso
        ctx.fillStyle = this.tunicColor;
        ctx.fillRect(-baseSize * 0.68, -baseSize * 0.85, baseSize * 1.36, baseSize * 1.3);
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-baseSize * 0.68, -baseSize * 0.85, baseSize * 1.36, baseSize * 1.3);
        
        // Armor plate
        this.renderArmorPlate(ctx, baseSize);
        
        // Shoulders
        this.renderPauldrons(ctx, baseSize);
        
        // Head
        this.renderHead(ctx, baseSize);
        
        // Arms
        this.renderLeftArm(ctx, baseSize, idleLeftArmSway + attackLeftArmAngle);
        this.renderRightArm(ctx, baseSize, idleRightArmSway + attackRightArmAngle, this.isAttacking, this.lastAttackTime);
        
        ctx.restore(); // End body translation
        ctx.restore(); // End main translate
        
        // Health bar
        const barWidth = baseSize * 4.2;
        const barHeight = Math.max(3.2, baseSize * 0.55);
        const barY = this.y - baseSize * 3.0;
        
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - barWidth/2, barY, barWidth, barHeight);
        
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : (healthPercent > 0.25 ? '#FFC107' : '#F44336');
        ctx.fillRect(this.x - barWidth/2, barY, barWidth * healthPercent, barHeight);
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(this.x - barWidth/2, barY, barWidth, barHeight);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Defender L${this.level}`, this.x, barY + barHeight / 2);
        
        // Hit splatters
        this.hitSplatters.forEach(splatter => splatter.render(ctx));
    }

    renderLegs(ctx, baseSize) {
        ctx.strokeStyle = '#3A3A3A';
        ctx.lineWidth = baseSize * 0.32;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.25, baseSize * 0.32);
        ctx.lineTo(-baseSize * 0.25, baseSize * 1.15);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(baseSize * 0.25, baseSize * 0.32);
        ctx.lineTo(baseSize * 0.25, baseSize * 1.15);
        ctx.stroke();
        
        // Boots
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(-baseSize * 0.25, baseSize * 1.3, baseSize * 0.3, baseSize * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(baseSize * 0.25, baseSize * 1.3, baseSize * 0.3, baseSize * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    renderArmorPlate(ctx, baseSize) {
        const plateHeight = baseSize * (0.75 + (this.level - 1) * 0.15);
        
        ctx.fillStyle = this.armorColor;
        ctx.fillRect(-baseSize * 0.58, -plateHeight, baseSize * 1.16, plateHeight * 0.95);
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-baseSize * 0.58, -plateHeight, baseSize * 1.16, plateHeight * 0.95);
        
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, -plateHeight);
        ctx.lineTo(0, plateHeight * 0.95 - plateHeight);
        ctx.stroke();
    }

    renderPauldrons(ctx, baseSize) {
        const pauldronColor = this.lightenColor(this.armorColor, 0.2);
        const pauldronSize = baseSize * (0.28 + (this.level - 1) * 0.08);
        
        ctx.fillStyle = pauldronColor;
        ctx.beginPath();
        ctx.ellipse(-baseSize * 0.72, -baseSize * 0.28, pauldronSize, pauldronSize * 1.2, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(-baseSize * 0.72, -baseSize * 0.28, pauldronSize, pauldronSize * 1.2, -0.3, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = pauldronColor;
        ctx.beginPath();
        ctx.ellipse(baseSize * 0.72, -baseSize * 0.28, pauldronSize, pauldronSize * 1.2, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(baseSize * 0.72, -baseSize * 0.28, pauldronSize, pauldronSize * 1.2, 0.3, 0, Math.PI * 2);
        ctx.stroke();
    }

    renderHead(ctx, baseSize) {
        ctx.fillStyle = '#D4A574';
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.32, baseSize * 0.60, 0, Math.PI * 2);
        ctx.fill();
        
        const helmetColor = this.armorColor;
        ctx.fillStyle = helmetColor;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.32, baseSize * 0.72, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.32, baseSize * 0.72, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = this.darkenColor(helmetColor, 0.25);
        ctx.fillRect(-baseSize * 0.35, -baseSize * 1.15, baseSize * 0.7, baseSize * 0.45);
        
        const eyeColor = '#4A9FFF';
        ctx.fillStyle = eyeColor;
        ctx.fillRect(-baseSize * 0.18, -baseSize * 1.05, baseSize * 0.1, baseSize * 0.12);
        ctx.fillRect(baseSize * 0.08, -baseSize * 1.05, baseSize * 0.1, baseSize * 0.12);
    }

    renderLeftArm(ctx, baseSize, swayAngle) {
        const shoulderX = -baseSize * 0.75;
        const shoulderY = -baseSize * 0.25;
        
        const armAngle = -0.2 + swayAngle;
        const elbowX = shoulderX + Math.cos(armAngle) * baseSize * 0.45;
        const elbowY = shoulderY + Math.sin(armAngle) * baseSize * 0.45;
        
        ctx.strokeStyle = '#D4A574';
        ctx.lineWidth = baseSize * 0.42;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(elbowX, elbowY);
        ctx.stroke();
        
        ctx.strokeStyle = '#C89968';
        ctx.lineWidth = baseSize * 0.34;
        ctx.beginPath();
        const wristAngle = armAngle - 0.3;
        const wristX = elbowX + Math.cos(wristAngle) * baseSize * 0.4;
        const wristY = elbowY + Math.sin(wristAngle) * baseSize * 0.4;
        ctx.moveTo(elbowX, elbowY);
        ctx.lineTo(wristX, wristY);
        ctx.stroke();
    }

    renderRightArm(ctx, baseSize, swayAngle, isAttacking, attackTime) {
        const shoulderX = baseSize * 0.75;
        const shoulderY = -baseSize * 0.25;
        
        let armAngle, elbowX, elbowY, wristX, wristY;
        
        if (isAttacking) {
            const attackProgress = Math.min(attackTime / 0.5, 1);
            const attackPower = Math.sin(attackProgress * Math.PI);
            armAngle = 0.2 + attackPower * 0.9;
        } else {
            armAngle = 0.2 + swayAngle;
        }
        
        elbowX = shoulderX + Math.cos(armAngle) * baseSize * 0.45;
        elbowY = shoulderY + Math.sin(armAngle) * baseSize * 0.45;
        
        const wristAngle = armAngle + 0.4;
        wristX = elbowX + Math.cos(wristAngle) * baseSize * 0.4;
        wristY = elbowY + Math.sin(wristAngle) * baseSize * 0.4;
        
        ctx.strokeStyle = '#D4A574';
        ctx.lineWidth = baseSize * 0.42;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(elbowX, elbowY);
        ctx.stroke();
        
        ctx.strokeStyle = '#C89968';
        ctx.lineWidth = baseSize * 0.34;
        ctx.beginPath();
        ctx.moveTo(elbowX, elbowY);
        ctx.lineTo(wristX, wristY);
        ctx.stroke();
        
        // Sword
        const swordAngle = -Math.PI / 2 + 0.15 + armAngle * 0.4;
        const swordLength = baseSize * (2.1 + (this.level - 1) * 0.5);
        const tipX = wristX + Math.cos(swordAngle) * swordLength;
        const tipY = wristY + Math.sin(swordAngle) * swordLength;
        
        ctx.strokeStyle = this.level === 1 ? '#C0C0C0' : (this.level === 2 ? '#8A9ABA' : '#FFE680');
        ctx.lineWidth = baseSize * (0.26 + (this.level - 1) * 0.08);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(wristX, wristY);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
    }
}
