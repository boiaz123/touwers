import { DefenderBase } from './DefenderBase.js';
import { HitSplatter } from '../effects/HitSplatter.js';

/**
 * CastleDefender - A defender stationed in front of the castle
 * Protects the castle from enemies that would otherwise damage it
 * Has full combat and rendering logic
 */
export class CastleDefender extends DefenderBase {
    constructor(level = 1) {
        super(level);
        this.type = 'castle';
    }

    update(deltaTime, enemies) {
        this.animationTime += deltaTime;
        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
        this.damageFlashTimer = Math.max(0, this.damageFlashTimer - deltaTime);
        this.lastAttackTime += deltaTime;
        
        // Find target
        this.attackTarget = null;
        let closestDistance = this.attackRange;
        
        if (enemies && enemies.length > 0) {
            enemies.forEach(enemy => {
                if (!enemy.isDead || !enemy.isDead()) {
                    const distance = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        this.attackTarget = enemy;
                    }
                }
            });
        }
        
        // Attack
        if (this.attackTarget && this.attackCooldown <= 0) {
            this.isAttacking = true;
            this.lastAttackTime = 0;
            const damage = this.getAttackDamage();
            this.attackTarget.takeDamage(damage);
            this.attackCooldown = 1.0 / this.attackSpeed;
        } else {
            if (this.lastAttackTime > 0.5) {
                this.isAttacking = false;
            }
        }
        
        // Update hit splatters
        this.hitSplatters = this.hitSplatters.filter(splatter => {
            splatter.update(deltaTime);
            return splatter.life > 0;
        });
    }

    render(ctx) {
        const baseSize = Math.max(7.2, Math.min(16.8, ctx.canvas.width / 150)) * this.sizeMultiplier;
        
        // Idle breathing animation
        const breathe = Math.sin(this.animationTime * 1.5) * 0.15;
        const sway = Math.sin(this.animationTime * 0.8) * 0.2;
        
        // Idle arm animation - natural swaying
        const idleLeftArmSway = Math.sin(this.animationTime * 1.2) * 0.25;
        const idleRightArmSway = Math.sin(this.animationTime * 1.2 + Math.PI) * 0.25;
        
        // Attack animations
        let attackLean = 0;
        let attackLeftArmAngle = 0;
        let attackRightArmAngle = 0;
        
        if (this.isAttacking) {
            const attackProgress = this.lastAttackTime / 0.5;
            const attackPower = Math.sin(Math.min(attackProgress, 1) * Math.PI);
            attackLean = attackPower * 0.4;
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
        
        // --- BODY STRUCTURE ---
        
        // Legs - solid stance
        this.renderLegs(ctx, baseSize);
        
        // Torso with breathing animation
        ctx.save();
        ctx.translate(0, breathe * 0.3 + sway * 0.1);
        
        // Back layer
        ctx.fillStyle = this.darkenColor(this.tunicColor, 0.3);
        ctx.fillRect(-baseSize * 0.7, -baseSize * 0.75, baseSize * 1.4, baseSize * 1.2);
        
        // Main tunic/chest
        const chestGradient = ctx.createLinearGradient(0, -baseSize * 0.9, 0, baseSize * 0.5);
        chestGradient.addColorStop(0, this.lightenColor(this.tunicColor, 0.1));
        chestGradient.addColorStop(0.5, this.tunicColor);
        chestGradient.addColorStop(1, this.darkenColor(this.tunicColor, 0.15));
        
        ctx.fillStyle = chestGradient;
        ctx.fillRect(-baseSize * 0.68, -baseSize * 0.85, baseSize * 1.36, baseSize * 1.3);
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-baseSize * 0.68, -baseSize * 0.85, baseSize * 1.36, baseSize * 1.3);
        
        // Tunic center seam
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, -baseSize * 0.85);
        ctx.lineTo(0, baseSize * 0.45);
        ctx.stroke();
        
        // --- ARMOR CHEST PLATE ---
        
        this.renderArmorPlate(ctx, baseSize);
        
        // --- SHOULDERS/PAULDRONS ---
        
        this.renderPauldrons(ctx, baseSize);
        
        // --- HEAD ---
        
        this.renderHead(ctx, baseSize);
        
        // --- ARMS ---
        
        this.renderLeftArm(ctx, baseSize, idleLeftArmSway + attackLeftArmAngle);
        this.renderRightArm(ctx, baseSize, idleRightArmSway + attackRightArmAngle, this.isAttacking, this.lastAttackTime);
        
        ctx.restore(); // End torso translation
        
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
        // Left leg
        ctx.strokeStyle = '#3A3A3A';
        ctx.lineWidth = baseSize * 0.32;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.25, baseSize * 0.32);
        ctx.lineTo(-baseSize * 0.25, baseSize * 1.15);
        ctx.stroke();
        
        // Right leg
        ctx.strokeStyle = '#3A3A3A';
        ctx.lineWidth = baseSize * 0.32;
        ctx.beginPath();
        ctx.moveTo(baseSize * 0.25, baseSize * 0.32);
        ctx.lineTo(baseSize * 0.25, baseSize * 1.15);
        ctx.stroke();
        
        // Boots
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(-baseSize * 0.25, baseSize * 1.3, baseSize * 0.3, baseSize * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(baseSize * 0.25, baseSize * 1.3, baseSize * 0.3, baseSize * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    renderArmorPlate(ctx, baseSize) {
        // Main plate
        const plateHeight = baseSize * (0.75 + (this.level - 1) * 0.15);
        
        ctx.fillStyle = this.armorColor;
        ctx.fillRect(-baseSize * 0.58, -plateHeight, baseSize * 1.16, plateHeight * 0.95);
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-baseSize * 0.58, -plateHeight, baseSize * 1.16, plateHeight * 0.95);
        
        // Center ridge
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, -plateHeight);
        ctx.lineTo(0, plateHeight * 0.95 - plateHeight);
        ctx.stroke();
        
        // Plate details - left side highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(-baseSize * 0.58, -plateHeight + 2, baseSize * 0.55, plateHeight * 0.9);
        
        // Plate details - right side shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(baseSize * 0.03, -plateHeight + 2, baseSize * 0.55, plateHeight * 0.9);
        
        // Rivets - more refined
        const rivetCount = 2 + this.level;
        const rivetSize = 0.9 + (this.level - 1) * 0.3;
        
        for (let col = 0; col < 3; col++) {
            const xPos = (col - 1) * baseSize * 0.35;
            for (let row = 0; row < rivetCount; row++) {
                const yPos = -plateHeight * 0.5 + row * (plateHeight * 0.35 / rivetCount);
                
                // Rivet shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.beginPath();
                ctx.arc(xPos + 0.5, yPos + 0.5, rivetSize * 0.5, 0, Math.PI * 2);
                ctx.fill();
                
                // Rivet body
                ctx.fillStyle = '#2a2a2a';
                ctx.beginPath();
                ctx.arc(xPos, yPos, rivetSize * 0.5, 0, Math.PI * 2);
                ctx.fill();
                
                // Rivet highlight
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.arc(xPos - rivetSize * 0.15, yPos - rivetSize * 0.15, rivetSize * 0.2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    renderPauldrons(ctx, baseSize) {
        const pauldronColor = this.lightenColor(this.armorColor, 0.2);
        const pauldronSize = baseSize * (0.28 + (this.level - 1) * 0.08);
        
        // Left pauldron
        ctx.fillStyle = pauldronColor;
        ctx.beginPath();
        ctx.ellipse(-baseSize * 0.72, -baseSize * 0.28, pauldronSize, pauldronSize * 1.2, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(-baseSize * 0.72, -baseSize * 0.28, pauldronSize, pauldronSize * 1.2, -0.3, 0, Math.PI * 2);
        ctx.stroke();
        
        // Left pauldron ridges
        for (let i = 0; i < 2 + this.level; i++) {
            const angle = -Math.PI * 0.6 + (i / (2 + this.level)) * Math.PI * 0.6;
            const x = Math.cos(angle) * pauldronSize;
            const y = Math.sin(angle) * pauldronSize * 0.8;
            
            ctx.fillStyle = this.darkenColor(pauldronColor, 0.2);
            ctx.beginPath();
            ctx.arc(-baseSize * 0.72 + x, -baseSize * 0.28 + y, pauldronSize * 0.08, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Right pauldron
        ctx.fillStyle = pauldronColor;
        ctx.beginPath();
        ctx.ellipse(baseSize * 0.72, -baseSize * 0.28, pauldronSize, pauldronSize * 1.2, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(baseSize * 0.72, -baseSize * 0.28, pauldronSize, pauldronSize * 1.2, 0.3, 0, Math.PI * 2);
        ctx.stroke();
        
        // Right pauldron ridges
        for (let i = 0; i < 2 + this.level; i++) {
            const angle = Math.PI * 0.6 - (i / (2 + this.level)) * Math.PI * 0.6;
            const x = Math.cos(angle) * pauldronSize;
            const y = Math.sin(angle) * pauldronSize * 0.8;
            
            ctx.fillStyle = this.darkenColor(pauldronColor, 0.2);
            ctx.beginPath();
            ctx.arc(baseSize * 0.72 + x, -baseSize * 0.28 + y, pauldronSize * 0.08, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderHead(ctx, baseSize) {
        // Skin/face
        ctx.fillStyle = '#D4A574';
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.32, baseSize * 0.60, 0, Math.PI * 2);
        ctx.fill();
        
        // Helmet - full cover
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
        
        // Face opening/visor area
        ctx.fillStyle = this.darkenColor(helmetColor, 0.25);
        ctx.fillRect(-baseSize * 0.35, -baseSize * 1.15, baseSize * 0.7, baseSize * 0.45);
        
        // Eye slits - bright blue glow
        const eyeColor = '#4A9FFF';
        ctx.fillStyle = eyeColor;
        // Left eye
        ctx.fillRect(-baseSize * 0.18, -baseSize * 1.05, baseSize * 0.1, baseSize * 0.12);
        // Right eye
        ctx.fillRect(baseSize * 0.08, -baseSize * 1.05, baseSize * 0.1, baseSize * 0.12);
        
        // Eye glow
        ctx.fillStyle = 'rgba(74, 159, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.13, -baseSize * 0.99, baseSize * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(baseSize * 0.13, -baseSize * 0.99, baseSize * 0.12, 0, Math.PI * 2);
        ctx.fill();
        
        // Nose guard - centered and thick
        ctx.fillStyle = this.darkenColor(helmetColor, 0.2);
        ctx.fillRect(-baseSize * 0.12, -baseSize * 1.15, baseSize * 0.24, baseSize * 0.35);
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 1;
        ctx.strokeRect(-baseSize * 0.12, -baseSize * 1.15, baseSize * 0.24, baseSize * 0.35);
        
        // Cheek plates
        const cheekColor = this.lightenColor(helmetColor, 0.1);
        ctx.fillStyle = cheekColor;
        ctx.fillRect(-baseSize * 0.48, -baseSize * 1.0, baseSize * 0.28, baseSize * 0.35);
        ctx.fillRect(baseSize * 0.2, -baseSize * 1.0, baseSize * 0.28, baseSize * 0.35);
        
        // Helmet crest ornament - top
        const crestColor = this.level === 1 ? '#C0C0C0' : (this.level === 2 ? '#FFB347' : '#FFD700');
        ctx.fillStyle = crestColor;
        ctx.beginPath();
        ctx.arc(-baseSize * 0.15, -baseSize * 1.65, baseSize * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(baseSize * 0.15, -baseSize * 1.65, baseSize * 0.08, 0, Math.PI * 2);
        ctx.fill();
        
        // Center crest
        const centerCrestColor = this.level === 1 ? '#FFD700' : (this.level === 2 ? '#FF6347' : '#FF1493');
        ctx.fillStyle = centerCrestColor;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.72, baseSize * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.72, baseSize * 0.1, 0, Math.PI * 2);
        ctx.stroke();
    }

    renderLeftArm(ctx, baseSize, swayAngle) {
        const shoulderX = -baseSize * 0.75;
        const shoulderY = -baseSize * 0.25;
        
        const armAngle = -0.2 + swayAngle;
        const elbowX = shoulderX + Math.cos(armAngle) * baseSize * 0.45;
        const elbowY = shoulderY + Math.sin(armAngle) * baseSize * 0.45;
        
        const wristAngle = armAngle - 0.3;
        const wristX = elbowX + Math.cos(wristAngle) * baseSize * 0.4;
        const wristY = elbowY + Math.sin(wristAngle) * baseSize * 0.4;
        
        // Upper arm
        const upperArmGrad = ctx.createLinearGradient(shoulderX, shoulderY, elbowX, elbowY);
        upperArmGrad.addColorStop(0, '#E8D4B8');
        upperArmGrad.addColorStop(1, '#D4A574');
        
        ctx.strokeStyle = upperArmGrad;
        ctx.lineWidth = baseSize * 0.42;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(elbowX, elbowY);
        ctx.stroke();
        
        // Lower arm
        const lowerArmGrad = ctx.createLinearGradient(elbowX, elbowY, wristX, wristY);
        lowerArmGrad.addColorStop(0, '#D4A574');
        lowerArmGrad.addColorStop(1, '#C89968');
        
        ctx.strokeStyle = lowerArmGrad;
        ctx.lineWidth = baseSize * 0.34;
        ctx.beginPath();
        ctx.moveTo(elbowX, elbowY);
        ctx.lineTo(wristX, wristY);
        ctx.stroke();
        
        // Shield
        const shieldSize = baseSize * (0.38 + (this.level - 1) * 0.12);
        const shieldX = wristX - baseSize * 0.1;
        const shieldY = wristY + baseSize * 0.15;
        
        // Shield wood
        ctx.fillStyle = '#8B5A2B';
        ctx.beginPath();
        ctx.ellipse(shieldX, shieldY, shieldSize, shieldSize * 1.25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Shield metal boss
        ctx.fillStyle = this.armorColor;
        ctx.beginPath();
        ctx.arc(shieldX, shieldY, shieldSize * 0.32, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(shieldX, shieldY, shieldSize * 0.32, 0, Math.PI * 2);
        ctx.stroke();
        
        // Shield edge rim
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = baseSize * 0.12;
        ctx.beginPath();
        ctx.ellipse(shieldX, shieldY, shieldSize, shieldSize * 1.25, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Shield cross decoration
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(shieldX - shieldSize * 0.15, shieldY);
        ctx.lineTo(shieldX + shieldSize * 0.15, shieldY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(shieldX, shieldY - shieldSize * 0.2);
        ctx.lineTo(shieldX, shieldY + shieldSize * 0.2);
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
            elbowX = shoulderX + Math.cos(armAngle) * baseSize * 0.48;
            elbowY = shoulderY + Math.sin(armAngle) * baseSize * 0.48;
            
            const wristAngle = armAngle + 0.5 + attackPower * 0.4;
            wristX = elbowX + Math.cos(wristAngle) * baseSize * 0.42;
            wristY = elbowY + Math.sin(wristAngle) * baseSize * 0.42;
        } else {
            armAngle = 0.2 + swayAngle;
            elbowX = shoulderX + Math.cos(armAngle) * baseSize * 0.45;
            elbowY = shoulderY + Math.sin(armAngle) * baseSize * 0.45;
            
            const wristAngle = armAngle + 0.4;
            wristX = elbowX + Math.cos(wristAngle) * baseSize * 0.4;
            wristY = elbowY + Math.sin(wristAngle) * baseSize * 0.4;
        }
        
        // Upper arm
        const upperArmGrad = ctx.createLinearGradient(shoulderX, shoulderY, elbowX, elbowY);
        upperArmGrad.addColorStop(0, '#E8D4B8');
        upperArmGrad.addColorStop(1, '#D4A574');
        
        ctx.strokeStyle = upperArmGrad;
        ctx.lineWidth = baseSize * 0.42;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(elbowX, elbowY);
        ctx.stroke();
        
        // Lower arm
        const lowerArmGrad = ctx.createLinearGradient(elbowX, elbowY, wristX, wristY);
        lowerArmGrad.addColorStop(0, '#D4A574');
        lowerArmGrad.addColorStop(1, '#C89968');
        
        ctx.strokeStyle = lowerArmGrad;
        ctx.lineWidth = baseSize * 0.34;
        ctx.beginPath();
        ctx.moveTo(elbowX, elbowY);
        ctx.lineTo(wristX, wristY);
        ctx.stroke();
        
        // Gauntlet
        const gauntletColor = this.level === 1 ? '#8A8A8A' : (this.level === 2 ? '#6A7A9A' : '#4A5A7A');
        ctx.fillStyle = gauntletColor;
        ctx.beginPath();
        ctx.arc(wristX, wristY, baseSize * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.arc(wristX, wristY, baseSize * 0.22, 0, Math.PI * 2);
        ctx.stroke();
        
        // Sword
        this.renderSword(ctx, baseSize, wristX, wristY, armAngle, isAttacking);
    }

    renderSword(ctx, baseSize, wristX, wristY, armAngle, isAttacking) {
        const swordAttackTilt = isAttacking ? 0.35 : 0.15;
        const swordAngle = -Math.PI / 2 + swordAttackTilt + armAngle * 0.4;
        const swordLength = baseSize * (2.1 + (this.level - 1) * 0.5);
        
        const tipX = wristX + Math.cos(swordAngle) * swordLength;
        const tipY = wristY + Math.sin(swordAngle) * swordLength;
        
        // Sword shadow
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = baseSize * (0.2 + (this.level - 1) * 0.1);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(wristX + 1.5, wristY + 1.5);
        ctx.lineTo(tipX + 1.5, tipY + 1.5);
        ctx.stroke();
        
        // Sword blade - distinct per level
        if (this.level === 1) {
            // Silver sword
            const grad = ctx.createLinearGradient(wristX, wristY, tipX, tipY);
            grad.addColorStop(0, '#E8E8E8');
            grad.addColorStop(0.5, '#FFFFFF');
            grad.addColorStop(1, '#A8A8A8');
            
            ctx.strokeStyle = grad;
            ctx.lineWidth = baseSize * 0.26;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(wristX, wristY);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();
            
        } else if (this.level === 2) {
            // Steel-blue broad sword
            const grad = ctx.createLinearGradient(wristX, wristY, tipX, tipY);
            grad.addColorStop(0, '#5A7A9A');
            grad.addColorStop(0.5, '#8A9ABA');
            grad.addColorStop(1, '#3A5A7A');
            
            ctx.strokeStyle = grad;
            ctx.lineWidth = baseSize * 0.34;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(wristX, wristY);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();
            
            // Fuller (center ridge)
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.lineWidth = baseSize * 0.1;
            ctx.beginPath();
            ctx.moveTo(wristX, wristY);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();
            
        } else {
            // Golden great sword
            const grad = ctx.createLinearGradient(wristX, wristY, tipX, tipY);
            grad.addColorStop(0, '#FFE680');
            grad.addColorStop(0.3, '#FFFF99');
            grad.addColorStop(0.7, '#FFE680');
            grad.addColorStop(1, '#CC8800');
            
            ctx.strokeStyle = grad;
            ctx.lineWidth = baseSize * 0.42;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(wristX, wristY);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();
            
            // Center ridge - bright
            ctx.strokeStyle = 'rgba(255, 255, 220, 0.6)';
            ctx.lineWidth = baseSize * 0.12;
            ctx.beginPath();
            ctx.moveTo(wristX, wristY);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();
            
            // Attack lightning
            if (isAttacking) {
                ctx.strokeStyle = 'rgba(255, 220, 50, 0.7)';
                ctx.lineWidth = baseSize * 0.08;
                const mid1X = wristX + (tipX - wristX) * 0.33;
                const mid1Y = wristY + (tipY - wristY) * 0.33;
                const mid2X = wristX + (tipX - wristX) * 0.66;
                const mid2Y = wristY + (tipY - wristY) * 0.66;
                ctx.beginPath();
                ctx.moveTo(mid1X, mid1Y);
                ctx.lineTo(mid1X - baseSize * 0.1, mid1Y);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(mid2X, mid2Y);
                ctx.lineTo(mid2X + baseSize * 0.1, mid2Y);
                ctx.stroke();
            }
        }
        
        // Sword edge highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = baseSize * 0.08;
        ctx.beginPath();
        ctx.moveTo(wristX - 1, wristY - 1);
        ctx.lineTo(tipX - 1, tipY - 1);
        ctx.stroke();
        
        // Sword guard
        ctx.save();
        ctx.translate(wristX, wristY);
        ctx.rotate(swordAngle);
        
        const guardColor = this.level === 1 ? '#C0C0C0' : (this.level === 2 ? '#8B4513' : '#FFD700');
        ctx.fillStyle = guardColor;
        const guardWidth = baseSize * (0.36 + (this.level - 1) * 0.16);
        const guardHeight = baseSize * (0.14 + (this.level - 1) * 0.06);
        ctx.fillRect(-guardWidth / 2, -guardHeight / 2, guardWidth, guardHeight);
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 1;
        ctx.strokeRect(-guardWidth / 2, -guardHeight / 2, guardWidth, guardHeight);
        
        // Guard jewel
        if (this.level > 1) {
            const jewelColor = this.level === 2 ? '#FF6347' : '#FF1493';
            ctx.fillStyle = jewelColor;
            ctx.beginPath();
            ctx.arc(0, 0, baseSize * 0.13, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Pommel
        ctx.fillStyle = guardColor;
        const pommelRadius = baseSize * (0.16 + (this.level - 1) * 0.13);
        ctx.beginPath();
        ctx.arc(0, baseSize * 0.22, pommelRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, baseSize * 0.22, pommelRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Pommel jewel
        if (this.level > 1) {
            const jewelColor = this.level === 2 ? '#FF6347' : '#FF1493';
            ctx.fillStyle = jewelColor;
            ctx.beginPath();
            ctx.arc(0, baseSize * 0.22, pommelRadius * 0.45, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}
