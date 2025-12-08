import { HitSplatter } from '../effects/HitSplatter.js';

/**
 * Defender - A protective unit that stands in front of the castle
 * Enemies will attack the defender before they can damage the castle
 * Has 3 levels with different models, health, and stats
 * Based on BeefyEnemy visuals but with defender appearance
 */
export class Defender {
    constructor(level = 1) {
        this.level = Math.min(3, Math.max(1, level)); // Clamp to 1-3
        
        // Initialize stats based on level
        this.initializeStats();
        
        // Position (will be set when placed)
        this.x = 0;
        this.y = 0;
        
        // Combat properties
        this.attackDamage = this.getAttackDamage();
        this.attackSpeed = this.getAttackSpeed();
        this.attackCooldown = 0;
        this.attackRange = 50;
        
        // Animation properties
        this.animationTime = 0;
        this.isAttacking = false;
        this.attackTarget = null;
        
        // Size based on level (more similar to enemies)
        this.sizeMultiplier = 1.0 + (this.level - 1) * 0.15; // 1.0, 1.15, 1.3
        
        // Tunic color - different from enemies (blue/purple tint)
        this.tunicColor = this.getTunicColor();
        
        // Hit effects
        this.hitSplatters = [];
        this.damageFlashTimer = 0;
        
        console.log(`Defender: Created level ${this.level} defender with ${this.health}/${this.maxHealth} health`);
    }
    
    initializeStats() {
        // Base stats that scale with level
        switch(this.level) {
            case 1:
                this.maxHealth = 120;
                this.health = 120;
                this.armor = 3;
                this.armorColor = '#5a5a5a'; // Steel gray
                break;
            case 2:
                this.maxHealth = 200;
                this.health = 200;
                this.armor = 6;
                this.armorColor = '#4a5a7a'; // Darker steel with blue tint
                break;
            case 3:
                this.maxHealth = 300;
                this.health = 300;
                this.armor = 9;
                this.armorColor = '#3a4a6a'; // Deep blue-gray armor
                break;
        }
    }
    
    getTunicColor() {
        // Blue/purple tones to distinguish from regular enemies
        switch(this.level) {
            case 1:
                return '#2E5A8C'; // Royal blue
            case 2:
                return '#1A3A5C'; // Deeper blue
            case 3:
                return '#0F1F3C'; // Dark navy
            default:
                return '#2E5A8C';
        }
    }
    
    getAttackDamage() {
        // Damage scales with level
        switch(this.level) {
            case 1:
                return 6;
            case 2:
                return 10;
            case 3:
                return 15;
            default:
                return 5;
        }
    }
    
    getAttackSpeed() {
        // Attack speed in attacks per second
        switch(this.level) {
            case 1:
                return 0.9;
            case 2:
                return 1.0;
            case 3:
                return 1.1;
            default:
                return 0.8;
        }
    }
    
    takeDamage(amount) {
        // Apply armor reduction
        const armorReduction = this.armor * 0.4; // Each armor point reduces damage by 0.4
        const actualDamage = Math.max(1, amount - armorReduction);
        
        this.health -= actualDamage;
        this.damageFlashTimer = 0.2;
        
        // Create hit splatter
        const splatter = new HitSplatter(this.x, this.y - 30, actualDamage, 'physical', null);
        this.hitSplatters.push(splatter);
        
        console.log(`Defender level ${this.level}: Took ${actualDamage} damage (${amount} - ${armorReduction} armor), health: ${Math.max(0, this.health)}/${this.maxHealth}`);
        
        return actualDamage;
    }
    
    isDead() {
        return this.health <= 0;
    }
    
    update(deltaTime, enemies) {
        this.animationTime += deltaTime;
        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
        this.damageFlashTimer = Math.max(0, this.damageFlashTimer - deltaTime);
        
        // Find target - closest enemy within range
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
        
        // Attack target if in range
        if (this.attackTarget && this.attackCooldown <= 0) {
            this.isAttacking = true;
            const damage = this.getAttackDamage();
            this.attackTarget.takeDamage(damage);
            this.attackCooldown = 1.0 / this.attackSpeed;
        } else {
            this.isAttacking = false;
        }
        
        // Update hit splatters
        this.hitSplatters = this.hitSplatters.filter(splatter => {
            splatter.update(deltaTime);
            return splatter.life > 0;
        });
    }
    
    render(ctx) {
        const baseSize = Math.max(7.2, Math.min(16.8, ctx.canvas.width / 150)) * this.sizeMultiplier;
        
        const walkCycle = Math.sin(this.animationTime * 8) * 0.5;
        const bobAnimation = Math.sin(this.animationTime * 8) * 0.3;
        
        const armSwingFreq = this.animationTime * 8;
        const leftArmBase = Math.sin(armSwingFreq) * 0.6;
        const leftArmBend = Math.sin(armSwingFreq * 2) * 0.15;
        const rightArmBase = this.isAttacking ? 0.8 : Math.sin(armSwingFreq + Math.PI) * 0.55;
        const rightArmBend = Math.sin(armSwingFreq * 2 + Math.PI / 3) * 0.18;
        
        // Damage flash effect
        if (this.damageFlashTimer > 0) {
            const flashIntensity = this.damageFlashTimer / 0.2;
            ctx.fillStyle = `rgba(255, 100, 100, ${flashIntensity * 0.3})`;
            ctx.fillRect(this.x - baseSize * 0.8, this.y - baseSize * 1.8, baseSize * 1.6, baseSize * 2.4);
        }
        
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
        
        // Main tunic/body - defender style with gradient
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
        
        // Armor chest plate - increases with level
        ctx.fillStyle = this.armorColor;
        const armorHeight = baseSize * (0.7 + (this.level - 1) * 0.15);
        ctx.fillRect(-baseSize * 0.6, -armorHeight, baseSize * 1.2, armorHeight * 0.9);
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.strokeRect(-baseSize * 0.6, -armorHeight, baseSize * 1.2, armorHeight * 0.9);
        
        // Armor rivets - more on higher levels
        ctx.fillStyle = '#3a3a3a';
        const rivetCount = 2 + this.level;
        for (let i = -1; i <= 1; i++) {
            for (let j = 0; j < rivetCount; j++) {
                ctx.beginPath();
                ctx.arc(i * baseSize * 0.35, -baseSize * 0.5 + j * baseSize * (0.35 - (this.level - 1) * 0.05), 0.8, 0, Math.PI * 2);
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
        
        // --- HELMET - beefier, more intimidating, defender themed ---
        
        const helmetGradient = ctx.createLinearGradient(-baseSize * 0.7, -baseSize * 1.48, baseSize * 0.7, -baseSize * 1.0);
        helmetGradient.addColorStop(0, this.armorColor);
        helmetGradient.addColorStop(0.5, this.darkenColor(this.armorColor, 0.2));
        helmetGradient.addColorStop(1, this.darkenColor(this.armorColor, 0.4));
        
        ctx.fillStyle = helmetGradient;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.35, baseSize * 0.7, Math.PI * 0.92, Math.PI * 2.08);
        ctx.fill();
        
        // Helmet nose guard
        ctx.fillStyle = this.darkenColor(this.armorColor, 0.3);
        ctx.fillRect(-baseSize * 0.12, -baseSize * 1.3, baseSize * 0.24, baseSize * 0.45);
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.7, -baseSize * 1.35);
        ctx.lineTo(baseSize * 0.7, -baseSize * 1.35);
        ctx.stroke();
        
        // Helmet highlight - stronger on defenders
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
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
        
        // Left hand/shield
        ctx.fillStyle = '#4a4a4a';
        ctx.beginPath();
        ctx.arc(leftWristX, leftWristY, baseSize * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(leftWristX, leftWristY, baseSize * 0.2, 0, Math.PI * 2);
        ctx.stroke();
        
        // --- RIGHT ARM WITH SWORD/WEAPON ---
        
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
        
        // Right hand with gauntlet - increases with level
        const gauntletColor = this.level === 1 ? '#4a4a4a' : (this.level === 2 ? '#3a4a5a' : '#2a3a4a');
        ctx.fillStyle = gauntletColor;
        ctx.beginPath();
        ctx.arc(rightWristX, rightWristY, baseSize * 0.2 + (this.level - 1) * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(rightWristX, rightWristY, baseSize * 0.2 + (this.level - 1) * 0.05, 0, Math.PI * 2);
        ctx.stroke();
        
        // --- SWORD/WEAPON - scales with level ---
        
        // Sword points mostly upright with slight forward tilt - more aggressive when attacking
        const swordAttackTilt = this.isAttacking ? 0.5 : 0.3;
        const swordAngle = -Math.PI / 2 + swordAttackTilt;
        const swordLength = baseSize * (1.8 + (this.level - 1) * 0.3);
        const swordTipX = rightWristX + Math.cos(swordAngle) * swordLength;
        const swordTipY = rightWristY + Math.sin(swordAngle) * swordLength;
        
        // Sword shadow
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = baseSize * (0.16 + (this.level - 1) * 0.08);
        ctx.beginPath();
        ctx.moveTo(rightWristX + 0.8, rightWristY + 0.8);
        ctx.lineTo(swordTipX + 0.8, swordTipY + 0.8);
        ctx.stroke();
        
        // Sword blade - gets better with level
        const swordColor = this.level === 1 ? '#A9A9A9' : (this.level === 2 ? '#C0C0C0' : '#D4AF37');
        const swordGradient = ctx.createLinearGradient(rightWristX, rightWristY, swordTipX, swordTipY);
        swordGradient.addColorStop(0, swordColor);
        swordGradient.addColorStop(0.5, this.lightenColor(swordColor, 0.2));
        swordGradient.addColorStop(1, this.darkenColor(swordColor, 0.3));
        
        ctx.strokeStyle = swordGradient;
        ctx.lineWidth = baseSize * (0.22 + (this.level - 1) * 0.06);
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
        
        // Sword guard (crossbar) - increases with level
        ctx.save();
        ctx.translate(rightWristX, rightWristY);
        ctx.rotate(swordAngle);
        const guardColor = this.level === 1 ? '#D4AF37' : (this.level === 2 ? '#B8860B' : '#8B7500');
        ctx.fillStyle = guardColor;
        ctx.fillRect(-baseSize * (0.28 + (this.level - 1) * 0.1), -baseSize * 0.08, baseSize * (0.56 + (this.level - 1) * 0.2), baseSize * 0.16);
        ctx.strokeStyle = '#5D4E37';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(-baseSize * (0.28 + (this.level - 1) * 0.1), -baseSize * 0.08, baseSize * (0.56 + (this.level - 1) * 0.2), baseSize * 0.16);
        
        // Sword pommel - increases with level
        ctx.fillStyle = guardColor;
        ctx.beginPath();
        ctx.arc(0, baseSize * 0.15, baseSize * (0.12 + (this.level - 1) * 0.05), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5D4E37';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(0, baseSize * 0.15, baseSize * (0.12 + (this.level - 1) * 0.05), 0, Math.PI * 2);
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
        
        // Level indicator on health bar
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Def L${this.level}`, this.x, barY + barHeight / 2);
        
        // Render hit splatters
        this.hitSplatters.forEach(splatter => splatter.render(ctx));
    }
    
    darkenColor(color, factor) {
        if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            
            const newR = Math.max(0, Math.floor(r * (1 - factor)));
            const newG = Math.max(0, Math.floor(g * (1 - factor)));
            const newB = Math.max(0, Math.floor(b * (1 - factor)));
            
            return `rgb(${newR}, ${newG}, ${newB})`;
        }
        return color;
    }
    
    lightenColor(color, factor) {
        if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            
            const newR = Math.min(255, Math.floor(r + (255 - r) * factor));
            const newG = Math.min(255, Math.floor(g + (255 - g) * factor));
            const newB = Math.min(255, Math.floor(b + (255 - b) * factor));
            
            return `rgb(${newR}, ${newG}, ${newB})`;
        }
        return color;
    }
}
