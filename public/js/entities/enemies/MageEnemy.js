import { BaseEnemy } from './BaseEnemy.js';

export class MageEnemy extends BaseEnemy {
    static BASE_STATS = {
        health: 750,
        speed: 45,
        armour: 4,
        magicResistance: 0.5
    };

    constructor(path, health_multiplier = 1.0, speed = null, armour = null, magicResistance = null) {
        const baseStats = MageEnemy.BASE_STATS;
        const actualSpeed = speed !== null ? speed : baseStats.speed;
        const actualArmour = armour !== null ? armour : baseStats.armour;
        const actualMagicResistance = magicResistance !== null ? magicResistance : baseStats.magicResistance;
        
        super(path, baseStats.health * health_multiplier, actualSpeed, actualArmour, actualMagicResistance);
        this.robeColor = '#1A3A7A';
        this.sizeMultiplier = 1.1;
        
        this.attackDamage = 6;
        this.attackSpeed = 1.2;
        
        // Optimized particle system - reduced particle generation
        this.magicParticles = [];
        this.particleEmissionCounter = 0;
        this.staffGlow = 0;
        this.staffPulse = 0;
        this.spellCastTimer = 0;
        this.isCastingSpell = false;
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        this.staffGlow = 0.6 + 0.4 * Math.sin(this.animationTime * 3);
        this.staffPulse = 0.7 + 0.3 * Math.sin(this.animationTime * 2.5);
        
        // Reduced particle generation - only emit every other frame
        this.particleEmissionCounter += deltaTime;
        if (this.particleEmissionCounter > 0.033) { // ~30 FPS for particles
            if (this.magicParticles.length < 8) { // Cap total particles per mage at 8
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 30 + 15;
                // Store particles in local space relative to mage
                this.magicParticles.push({
                    localX: Math.cos(angle) * radius,
                    localY: Math.sin(angle) * radius - 20,
                    vx: (Math.random() - 0.5) * 30,
                    vy: -Math.random() * 40 - 20,
                    life: 1.5,
                    maxLife: 1.5,
                    size: Math.random() * 2 + 1,
                    colorIdx: Math.floor(Math.random() * 3)
                });
            }
            this.particleEmissionCounter = 0;
        }
        
        // Update magic particles - optimized filtering (in local space)
        for (let i = this.magicParticles.length - 1; i >= 0; i--) {
            const p = this.magicParticles[i];
            p.localX += p.vx * deltaTime;
            p.localY += p.vy * deltaTime;
            p.life -= deltaTime;
            p.size = Math.max(0, p.size * (p.life / p.maxLife));
            if (p.life <= 0) {
                this.magicParticles.splice(i, 1);
            }
        }
        
        if (this.reachedEnd || !this.path || this.path.length === 0) return;
        
        if (this.currentPathIndex >= this.path.length - 1) {
            this.reachedEnd = true;
            this.isAttackingCastle = true;
            return;
        }
        
        const target = this.getOffsetWaypointAt(this.currentPathIndex + 1) || this.path[this.currentPathIndex + 1];
        if (!target) {
            this.reachedEnd = true;
            return;
        }
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.hypot(dx, dy);
        
        const reachThreshold = Math.max(5, this.speed * deltaTime * 2);
        
        if (distance < reachThreshold) {
            this.currentPathIndex++;
            const snapPos = this.getOffsetWaypointAt(this.currentPathIndex) || this.path[this.currentPathIndex];
            if (snapPos) { this.x = snapPos.x; this.y = snapPos.y; }
            return;
        }
        
        const moveDistance = this.speed * deltaTime;
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
        const baseSize = Math.max(6, Math.min(14, ctx.canvas.width / 150)) * this.sizeMultiplier;

        const animTime = this.animationTime * 8 + this.animationPhaseOffset;
        const walkCycle = Math.sin(animTime) * 0.5;
        const bobAnimation = Math.sin(animTime) * 0.3;
        const armSwingFreq = animTime * 0.25;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + baseSize * 1.85, baseSize * 1.05, baseSize * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(this.x, this.y + bobAnimation);

        // === LEGS (drawn first so robe covers the upper portion) ===
        const leftHipX = -baseSize * 0.28;
        const leftHipY = baseSize * 0.38;
        const leftLegAngle = walkCycle * 0.3;
        const leftFootX = leftHipX + Math.sin(leftLegAngle) * baseSize * 0.75;
        const leftFootY = leftHipY + Math.cos(leftLegAngle) * baseSize * 0.85;

        ctx.strokeStyle = '#0A1840';
        ctx.lineWidth = baseSize * 0.27;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(leftHipX, leftHipY);
        ctx.lineTo(leftFootX, leftFootY);
        ctx.stroke();

        const rightHipX = baseSize * 0.28;
        const rightHipY = baseSize * 0.38;
        const rightLegAngle = -walkCycle * 0.3;
        const rightFootX = rightHipX + Math.sin(rightLegAngle) * baseSize * 0.75;
        const rightFootY = rightHipY + Math.cos(rightLegAngle) * baseSize * 0.85;

        ctx.strokeStyle = '#0A1840';
        ctx.lineWidth = baseSize * 0.27;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(rightHipX, rightHipY);
        ctx.lineTo(rightFootX, rightFootY);
        ctx.stroke();

        // === WIZARD BOOTS (drawn first so robe hem covers boot tops) ===
        ctx.fillStyle = '#1C1430';
        ctx.beginPath();
        ctx.ellipse(leftFootX + baseSize * 0.1, leftFootY + baseSize * 0.15, baseSize * 0.3, baseSize * 0.15, walkCycle * 0.28 - 0.14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3D2B5E';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.fillStyle = '#1C1430';
        ctx.beginPath();
        ctx.ellipse(rightFootX - baseSize * 0.1, rightFootY + baseSize * 0.15, baseSize * 0.3, baseSize * 0.15, -walkCycle * 0.28 + 0.14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3D2B5E';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // === OUTER CLOAK (back layer, wider and darker) ===
        ctx.fillStyle = '#0B1A50';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.7, -baseSize * 0.55);
        ctx.quadraticCurveTo(-baseSize * 1.12, baseSize * 0.65, -baseSize * 1.06, baseSize * 1.78);
        ctx.lineTo(baseSize * 1.06, baseSize * 1.78);
        ctx.quadraticCurveTo(baseSize * 1.12, baseSize * 0.65, baseSize * 0.7, -baseSize * 0.55);
        ctx.closePath();
        ctx.fill();

        // === MAIN ROBE ===
        ctx.fillStyle = this.robeColor;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.66, -baseSize * 0.55);
        ctx.quadraticCurveTo(-baseSize * 0.92, baseSize * 0.55, -baseSize * 0.88, baseSize * 1.68);
        ctx.lineTo(baseSize * 0.88, baseSize * 1.68);
        ctx.quadraticCurveTo(baseSize * 0.92, baseSize * 0.55, baseSize * 0.66, -baseSize * 0.55);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#0D2060';
        ctx.lineWidth = 1.0;
        ctx.stroke();

        // Center front panel - lighter stripe for depth
        ctx.fillStyle = '#214898';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.22, -baseSize * 0.55);
        ctx.quadraticCurveTo(-baseSize * 0.28, baseSize * 0.55, -baseSize * 0.24, baseSize * 1.68);
        ctx.lineTo(baseSize * 0.24, baseSize * 1.68);
        ctx.quadraticCurveTo(baseSize * 0.28, baseSize * 0.55, baseSize * 0.22, -baseSize * 0.55);
        ctx.closePath();
        ctx.fill();

        // Robe side fold lines
        ctx.strokeStyle = '#0F2870';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.44, -baseSize * 0.42);
        ctx.quadraticCurveTo(-baseSize * 0.6, baseSize * 0.55, -baseSize * 0.72, baseSize * 1.6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(baseSize * 0.44, -baseSize * 0.42);
        ctx.quadraticCurveTo(baseSize * 0.6, baseSize * 0.55, baseSize * 0.72, baseSize * 1.6);
        ctx.stroke();

        // Gold hem trim at robe bottom
        ctx.fillStyle = '#C9921E';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.88, baseSize * 1.58);
        ctx.quadraticCurveTo(0, baseSize * 1.82, baseSize * 0.88, baseSize * 1.58);
        ctx.lineTo(baseSize * 0.88, baseSize * 1.68);
        ctx.quadraticCurveTo(0, baseSize * 1.9, -baseSize * 0.88, baseSize * 1.68);
        ctx.closePath();
        ctx.fill();

        // === BELT / SASH ===
        ctx.fillStyle = '#7A5A10';
        ctx.fillRect(-baseSize * 0.78, baseSize * 0.25, baseSize * 1.56, baseSize * 0.22);
        ctx.strokeStyle = '#4A3008';
        ctx.lineWidth = 0.7;
        ctx.strokeRect(-baseSize * 0.78, baseSize * 0.25, baseSize * 1.56, baseSize * 0.22);

        // Belt central gem buckle
        ctx.fillStyle = '#D4AF37';
        ctx.beginPath();
        ctx.arc(0, baseSize * 0.36, baseSize * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.fillStyle = `rgba(100, 149, 237, ${0.55 + 0.35 * this.staffGlow})`;
        ctx.beginPath();
        ctx.arc(0, baseSize * 0.36, baseSize * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Belt side rivets
        ctx.fillStyle = '#C9921E';
        const rivetX = [-baseSize * 0.42, baseSize * 0.42];
        for (let j = 0; j < 2; j++) {
            ctx.beginPath();
            ctx.arc(rivetX[j], baseSize * 0.36, baseSize * 0.055, 0, Math.PI * 2);
            ctx.fill();
        }

        // === COLLAR / NECKPIECE ===
        ctx.fillStyle = '#244C96';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.44, -baseSize * 0.55);
        ctx.lineTo(-baseSize * 0.26, -baseSize * 0.8);
        ctx.lineTo(0, -baseSize * 0.72);
        ctx.lineTo(baseSize * 0.26, -baseSize * 0.8);
        ctx.lineTo(baseSize * 0.44, -baseSize * 0.55);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 0.9;
        ctx.stroke();

        // Collar throat gem
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, -baseSize * 0.7, baseSize * 0.09, 0, Math.PI * 2);
        ctx.fill();

        // === HEAD ===
        ctx.fillStyle = '#B8956A';
        ctx.beginPath();
        ctx.arc(baseSize * 0.05, -baseSize * 1.33, baseSize * 0.58, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#D8C8A8';
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.36, baseSize * 0.54, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#B5926A';
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // Eyes with magical glow
        const eyeY = -baseSize * 1.4;
        ctx.fillStyle = '#1A1A2E';
        ctx.beginPath();
        ctx.ellipse(-baseSize * 0.18, eyeY, baseSize * 0.1, baseSize * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(100, 149, 237, ${0.75 * this.staffGlow})`;
        ctx.beginPath();
        ctx.ellipse(-baseSize * 0.18, eyeY, baseSize * 0.055, baseSize * 0.042, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1A1A2E';
        ctx.beginPath();
        ctx.ellipse(baseSize * 0.18, eyeY, baseSize * 0.1, baseSize * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(100, 149, 237, ${0.75 * this.staffGlow})`;
        ctx.beginPath();
        ctx.ellipse(baseSize * 0.18, eyeY, baseSize * 0.055, baseSize * 0.042, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyebrows
        ctx.strokeStyle = '#5A3E1B';
        ctx.lineWidth = baseSize * 0.09;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.3, eyeY - baseSize * 0.14);
        ctx.quadraticCurveTo(-baseSize * 0.18, eyeY - baseSize * 0.2, -baseSize * 0.07, eyeY - baseSize * 0.12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(baseSize * 0.3, eyeY - baseSize * 0.14);
        ctx.quadraticCurveTo(baseSize * 0.18, eyeY - baseSize * 0.2, baseSize * 0.07, eyeY - baseSize * 0.12);
        ctx.stroke();

        // Nose
        ctx.fillStyle = '#B8956A';
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.26, baseSize * 0.055, 0, Math.PI * 2);
        ctx.fill();

        // White pointed beard
        ctx.fillStyle = '#E8E0D0';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.2, -baseSize * 0.9);
        ctx.lineTo(baseSize * 0.2, -baseSize * 0.9);
        ctx.lineTo(0, -baseSize * 0.67);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#C5BDB0';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // === WIZARD HAT ===
        // Brim (ellipse)
        ctx.fillStyle = '#152E6A';
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 1.6, baseSize * 0.84, baseSize * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0A1840';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Brim gold edge
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = baseSize * 0.07;
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 1.6, baseSize * 0.84, baseSize * 0.15, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Hat cone
        ctx.fillStyle = '#1A3A7A';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.82, -baseSize * 1.6);
        ctx.lineTo(baseSize * 0.82, -baseSize * 1.6);
        ctx.lineTo(baseSize * 0.14, -baseSize * 2.68);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0A1840';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Hat band (gold strip above brim)
        ctx.fillStyle = '#D4AF37';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.82, -baseSize * 1.6);
        ctx.lineTo(baseSize * 0.82, -baseSize * 1.6);
        ctx.lineTo(baseSize * 0.72, -baseSize * 1.76);
        ctx.lineTo(-baseSize * 0.72, -baseSize * 1.76);
        ctx.closePath();
        ctx.fill();

        // Hat band centre gem
        ctx.fillStyle = '#6495ED';
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.675, baseSize * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#4169E1';
        ctx.lineWidth = 0.7;
        ctx.stroke();

        // Stars on hat with animated twinkle
        const hatStarAlpha = 0.6 + 0.4 * Math.sin(this.animationTime * 1.5);
        ctx.fillStyle = `rgba(255, 215, 0, ${hatStarAlpha})`;
        this.drawStarShape(ctx, -baseSize * 0.38, -baseSize * 2.12, baseSize * 0.13);
        this.drawStarShape(ctx, baseSize * 0.3, -baseSize * 1.96, baseSize * 0.1);

        // Hat tip glow
        ctx.fillStyle = `rgba(255, 215, 0, ${this.staffGlow * 0.35})`;
        ctx.beginPath();
        ctx.arc(baseSize * 0.14, -baseSize * 2.68, baseSize * 0.32, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 215, 0, ${this.staffGlow})`;
        ctx.beginPath();
        ctx.arc(baseSize * 0.14, -baseSize * 2.68, baseSize * 0.14, 0, Math.PI * 2);
        ctx.fill();

        // === LEFT ARM WITH STAFF ===
        const leftShoulderX = -baseSize * 0.55;
        const leftShoulderY = -baseSize * 0.3;
        // Walking swing using same pattern as other enemies
        const leftSwingForward = Math.sin(armSwingFreq) * 0.4;
        const leftElbowX = leftShoulderX - baseSize * 0.18 + leftSwingForward * baseSize * 0.15;
        const leftElbowY = leftShoulderY + baseSize * 0.38;
        const leftWristX = leftElbowX - baseSize * 0.1 + leftSwingForward * baseSize * 0.12;
        const leftWristY = leftElbowY + baseSize * 0.35;

        // Sleeve shadow
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = baseSize * 0.46;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(leftShoulderX + 0.5, leftShoulderY + 0.5);
        ctx.lineTo(leftElbowX + 0.5, leftElbowY + 0.5);
        ctx.lineTo(leftWristX + 0.5, leftWristY + 0.5);
        ctx.stroke();

        // Upper sleeve (robe colour, wide bell shape)
        ctx.strokeStyle = this.robeColor;
        ctx.lineWidth = baseSize * 0.46;
        ctx.beginPath();
        ctx.moveTo(leftShoulderX, leftShoulderY);
        ctx.lineTo(leftElbowX, leftElbowY);
        ctx.stroke();

        // Lower sleeve
        ctx.strokeStyle = '#1A3A7A';
        ctx.lineWidth = baseSize * 0.34;
        ctx.beginPath();
        ctx.moveTo(leftElbowX, leftElbowY);
        ctx.lineTo(leftWristX, leftWristY);
        ctx.stroke();

        // Gold cuff
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = baseSize * 0.13;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(leftWristX - baseSize * 0.2, leftWristY + baseSize * 0.02);
        ctx.lineTo(leftWristX + baseSize * 0.2, leftWristY - baseSize * 0.02);
        ctx.stroke();

        // Left hand
        ctx.fillStyle = '#D8C8A8';
        ctx.beginPath();
        ctx.arc(leftWristX, leftWristY, baseSize * 0.17, 0, Math.PI * 2);
        ctx.fill();

        // Scepter from left hand - tilts with arm swing so it looks held, not floating
        this.drawScepter(ctx, leftWristX, leftWristY, baseSize, leftSwingForward * 0.12);

        // === RIGHT ARM ===
        const rightShoulderX = baseSize * 0.55;
        const rightShoulderY = -baseSize * 0.3;
        const rightArmSwing = Math.sin(armSwingFreq + Math.PI) * 0.3;
        const rightArmAngle = Math.PI / 2.15 + rightArmSwing;
        const rightElbowX = rightShoulderX + Math.cos(rightArmAngle) * baseSize * 0.3;
        const rightElbowY = rightShoulderY + Math.sin(rightArmAngle) * baseSize * 0.25;
        const rightWristX = rightElbowX + Math.cos(rightArmAngle) * baseSize * 0.25;
        const rightWristY = rightElbowY + Math.sin(rightArmAngle) * baseSize * 0.25;

        // Right sleeve shadow
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = baseSize * 0.46;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(rightShoulderX + 0.5, rightShoulderY + 0.5);
        ctx.lineTo(rightElbowX + 0.5, rightElbowY + 0.5);
        ctx.lineTo(rightWristX + 0.5, rightWristY + 0.5);
        ctx.stroke();

        // Upper sleeve
        ctx.strokeStyle = this.robeColor;
        ctx.lineWidth = baseSize * 0.46;
        ctx.beginPath();
        ctx.moveTo(rightShoulderX, rightShoulderY);
        ctx.lineTo(rightElbowX, rightElbowY);
        ctx.stroke();

        // Lower sleeve
        ctx.strokeStyle = '#1A3A7A';
        ctx.lineWidth = baseSize * 0.34;
        ctx.beginPath();
        ctx.moveTo(rightElbowX, rightElbowY);
        ctx.lineTo(rightWristX, rightWristY);
        ctx.stroke();

        // Gold cuff
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = baseSize * 0.13;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(rightWristX - baseSize * 0.18, rightWristY + baseSize * 0.02);
        ctx.lineTo(rightWristX + baseSize * 0.18, rightWristY - baseSize * 0.02);
        ctx.stroke();

        // Right hand
        ctx.fillStyle = '#D8C8A8';
        ctx.beginPath();
        ctx.arc(rightWristX, rightWristY, baseSize * 0.17, 0, Math.PI * 2);
        ctx.fill();

        // Subtle full-body magic aura
        ctx.fillStyle = `rgba(70, 120, 220, ${0.055 * this.staffGlow})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, baseSize * 1.1, baseSize * 2.0, 0, 0, Math.PI * 2);
        ctx.fill();

        // Magic particles (local space)
        if (!this._particleColors) {
            this._particleColors = ['rgba(100, 149, 237, ', 'rgba(65, 105, 225, ', 'rgba(72, 209, 204, '];
        }
        const particleColors = this._particleColors;
        for (let i = 0; i < this.magicParticles.length; i++) {
            const particle = this.magicParticles[i];
            const alpha = (particle.life / particle.maxLife) * 0.8;
            ctx.fillStyle = particleColors[particle.colorIdx] + alpha + ')';
            ctx.beginPath();
            ctx.arc(particle.localX, particle.localY, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Health bar - positioned above hat tip
        const barWidth = baseSize * 3.2;
        const barHeight = Math.max(2, baseSize * 0.42);
        const barY = this.y - baseSize * 3.1;

        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - barWidth / 2, barY, barWidth, barHeight);

        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : (healthPercent > 0.25 ? '#FFC107' : '#F44336');
        ctx.fillRect(this.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);

        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - barWidth / 2, barY, barWidth, barHeight);

        // Hit splatters
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
    
    drawScepter(ctx, handX, handY, baseSize, tilt = 0) {
        ctx.save();
        ctx.translate(handX, handY);
        if (tilt !== 0) ctx.rotate(tilt);

        const shaftLength = baseSize * 2.0;
        const shaftWidth = baseSize * 0.2;

        // === SHAFT ===
        // Dark outline for depth
        ctx.fillStyle = '#2A1505';
        ctx.fillRect(-shaftWidth / 2 - 1, -shaftLength * 1.04, shaftWidth + 2, shaftLength);

        // Main shaft body
        ctx.fillStyle = '#6B4423';
        ctx.fillRect(-shaftWidth / 2, -shaftLength, shaftWidth, shaftLength);

        // Shaft highlight stripe
        ctx.fillStyle = '#8C6030';
        ctx.fillRect(-shaftWidth / 2 + 1, -shaftLength, shaftWidth * 0.35, shaftLength * 0.98);

        // Shaft diagonal grain lines
        ctx.strokeStyle = '#3D2010';
        ctx.lineWidth = 0.6;
        for (let i = 1; i <= 4; i++) {
            const gy = -shaftLength + (shaftLength * i / 5);
            ctx.beginPath();
            ctx.moveTo(-shaftWidth / 2 + 1, gy);
            ctx.lineTo(shaftWidth / 2 - 1, gy + baseSize * 0.06);
            ctx.stroke();
        }

        // === GRIP SECTION ===
        const gripY = -shaftLength * 0.52;
        const gripH = baseSize * 0.44;
        ctx.fillStyle = '#1E1000';
        ctx.fillRect(-shaftWidth / 2 - 2, gripY, shaftWidth + 4, gripH);

        ctx.strokeStyle = '#C9A830';
        ctx.lineWidth = 1.1;
        for (let i = 0; i <= 4; i++) {
            const wy = gripY + (gripH * i / 4);
            ctx.beginPath();
            ctx.moveTo(-shaftWidth / 2 - 2, wy);
            ctx.lineTo(shaftWidth / 2 + 2, wy + baseSize * 0.04);
            ctx.stroke();
        }

        // Metal bands along shaft (3 evenly spaced)
        for (let i = 0; i < 3; i++) {
            const bY = -shaftLength * 0.2 - shaftLength * 0.22 * i;
            ctx.fillStyle = '#D4AF37';
            ctx.fillRect(-shaftWidth / 2 - 2, bY, shaftWidth + 4, baseSize * 0.1);
            ctx.strokeStyle = '#8B7000';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(-shaftWidth / 2 - 2, bY, shaftWidth + 4, baseSize * 0.1);
        }

        // === CROWN HEAD ===
        const headCY = -shaftLength - baseSize * 0.2;

        // Crown collar ring
        ctx.fillStyle = '#D4AF37';
        ctx.beginPath();
        ctx.arc(0, headCY + baseSize * 0.22, shaftWidth * 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Three prongs: centre, left, right
        ctx.lineCap = 'round';

        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = shaftWidth * 0.55;

        // Centre prong (straight up)
        ctx.beginPath();
        ctx.moveTo(0, headCY + baseSize * 0.22);
        ctx.lineTo(0, headCY - baseSize * 0.62);
        ctx.stroke();

        // Left prong (curves outward)
        ctx.beginPath();
        ctx.moveTo(0, headCY + baseSize * 0.22);
        ctx.quadraticCurveTo(-shaftWidth * 1.8, headCY - baseSize * 0.05, -shaftWidth * 2.8, headCY - baseSize * 0.46);
        ctx.stroke();

        // Right prong (curves outward)
        ctx.beginPath();
        ctx.moveTo(0, headCY + baseSize * 0.22);
        ctx.quadraticCurveTo(shaftWidth * 1.8, headCY - baseSize * 0.05, shaftWidth * 2.8, headCY - baseSize * 0.46);
        ctx.stroke();

        // Prong tip orbs
        ctx.fillStyle = `rgba(150, 200, 255, ${this.staffPulse * 0.9})`;
        const prongTips = [
            [0, headCY - baseSize * 0.62],
            [-shaftWidth * 2.8, headCY - baseSize * 0.46],
            [shaftWidth * 2.8, headCY - baseSize * 0.46]
        ];
        for (let k = 0; k < 3; k++) {
            ctx.beginPath();
            ctx.arc(prongTips[k][0], prongTips[k][1], baseSize * 0.09, 0, Math.PI * 2);
            ctx.fill();
        }

        // === CRYSTAL ORB ===
        const orbY = headCY - baseSize * 0.08;
        const orbR = baseSize * 0.33;

        // Outer glow halo
        const crystalGlow = ctx.createRadialGradient(0, orbY, orbR * 0.15, 0, orbY, orbR * 2.2);
        crystalGlow.addColorStop(0, `rgba(100, 149, 237, ${this.staffPulse * 0.55})`);
        crystalGlow.addColorStop(1, 'rgba(30, 144, 255, 0)');
        ctx.fillStyle = crystalGlow;
        ctx.beginPath();
        ctx.arc(0, orbY, orbR * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Main orb body
        ctx.fillStyle = `rgba(65, 115, 205, ${0.78 + 0.15 * this.staffPulse})`;
        ctx.beginPath();
        ctx.arc(0, orbY, orbR, 0, Math.PI * 2);
        ctx.fill();

        // Orb rim
        ctx.strokeStyle = `rgba(160, 195, 255, ${0.6 + 0.3 * this.staffPulse})`;
        ctx.lineWidth = 1.0;
        ctx.stroke();

        // Inner bright core
        ctx.fillStyle = `rgba(200, 220, 255, ${0.45 + 0.4 * this.staffPulse})`;
        ctx.beginPath();
        ctx.arc(-orbR * 0.12, orbY - orbR * 0.08, orbR * 0.48, 0, Math.PI * 2);
        ctx.fill();

        // Specular highlight
        ctx.fillStyle = `rgba(255, 255, 255, ${0.55 + 0.35 * this.staffPulse})`;
        ctx.beginPath();
        ctx.arc(-orbR * 0.3, orbY - orbR * 0.32, orbR * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Secondary mini highlight
        ctx.fillStyle = `rgba(255, 255, 255, ${0.22 * this.staffPulse})`;
        ctx.beginPath();
        ctx.arc(orbR * 0.18, orbY + orbR * 0.18, orbR * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Orbiting energy crystals (2)
        for (let i = 0; i < 2; i++) {
            const orbitAngle = (this.animationTime * 2.5) + (i * Math.PI);
            const orbitX = Math.cos(orbitAngle) * orbR * 1.62;
            const orbitOY = orbY + Math.sin(orbitAngle) * orbR * 1.62;

            ctx.fillStyle = `rgba(72, 209, 204, ${this.staffPulse * 0.5})`;
            ctx.beginPath();
            ctx.arc(orbitX, orbitOY, baseSize * 0.13, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = `rgba(160, 240, 245, ${this.staffPulse * 0.75})`;
            ctx.beginPath();
            ctx.arc(orbitX, orbitOY, baseSize * 0.07, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
    
    drawStarShape(ctx, cx, cy, size) {
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI / 2) - Math.PI / 4;
            const outerX = cx + Math.cos(angle) * size;
            const outerY = cy + Math.sin(angle) * size;
            const innerAngle = angle + Math.PI / 4;
            const innerX = cx + Math.cos(innerAngle) * size * 0.4;
            const innerY = cy + Math.sin(innerAngle) * size * 0.4;
            if (i === 0) ctx.moveTo(outerX, outerY);
            else ctx.lineTo(outerX, outerY);
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
    }

    getMagicParticleColor() {
        const colors = ['rgba(100, 149, 237, ', 'rgba(65, 105, 225, ', 'rgba(72, 209, 204, '];
        return colors[Math.floor(Math.random() * colors.length)];
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
}
