import { BaseEnemy } from './BaseEnemy.js';

export class MageEnemy extends BaseEnemy {
    static BASE_STATS = {
        health: 110,
        speed: 45,
        armour: 1,
        magicResistance: 8
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
        
        // Cache for computed values
        this.lastBaseSize = 0;
        this.lastAnimTime = 0;
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
        
        const target = this.path[this.currentPathIndex + 1];
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
        const baseSize = Math.max(6, Math.min(14, ctx.canvas.width / 150)) * this.sizeMultiplier;
        
        // Apply phase offset - mages have varied mystical timing
        const animTime = this.animationTime * 8 + this.animationPhaseOffset;
        const walkCycle = Math.sin(animTime) * 0.5;
        const bobAnimation = Math.sin(animTime) * 0.3;
        
        // Slowed arm animation - divide by 2 to make it half as fast
        const armSwingFreq = animTime * 0.25;
        const leftArmBase = Math.sin(armSwingFreq) * 0.6;
        
        // Enemy shadow - taller mage
        ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + baseSize * 1.8, baseSize * 0.95, baseSize * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.save();
        ctx.translate(this.x, this.y + bobAnimation);
        
        // Back/depth layer - extended to feet
        ctx.fillStyle = '#0F2850';
        ctx.fillRect(-baseSize * 0.75, -baseSize * 0.8, baseSize * 1.5, baseSize * 1.85);
        
        // Main robe/body - simplified but still styled
        ctx.fillStyle = this.robeColor;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.7, -baseSize * 0.3);
        ctx.lineTo(-baseSize * 0.9, baseSize * 1.0);
        ctx.lineTo(baseSize * 0.9, baseSize * 1.0);
        ctx.lineTo(baseSize * 0.7, -baseSize * 0.3);
        ctx.closePath();
        ctx.fill();
        
        // Robe outline
        ctx.strokeStyle = '#0F1F4F';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        
        // Robe seams and folds - simplified
        ctx.strokeStyle = '#102050';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -baseSize * 0.3);
        ctx.lineTo(0, baseSize * 1.0);
        ctx.stroke();
        
        // Robe side folds - simplified
        ctx.strokeStyle = '#15305A';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.35, -baseSize * 0.2);
        ctx.lineTo(-baseSize * 0.85, baseSize * 0.9);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(baseSize * 0.35, -baseSize * 0.2);
        ctx.lineTo(baseSize * 0.85, baseSize * 0.9);
        ctx.stroke();
        
        // Torso highlight - magical aura (simplified, no gradient)
        ctx.fillStyle = `rgba(70, 130, 255, ${0.1 * this.staffGlow})`;
        ctx.fillRect(-baseSize * 0.6, -baseSize * 0.6, baseSize * 1.2, baseSize * 0.8);
        
        // --- HEAD ---
        ctx.fillStyle = '#C4A575';
        ctx.beginPath();
        ctx.arc(baseSize * 0.06, -baseSize * 1.35, baseSize * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#D8C8A8';
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.38, baseSize * 0.56, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#B8956A';
        ctx.lineWidth = 0.6;
        ctx.stroke();
        
        // --- LARGE POINTY WIZARD HAT ---
        ctx.fillStyle = '#1A3A7A';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.75, -baseSize * 1.38);
        ctx.lineTo(baseSize * 0.75, -baseSize * 1.38);
        ctx.lineTo(baseSize * 0.15, -baseSize * 2.55);
        ctx.closePath();
        ctx.fill();
        
        // Hat outline for definition
        ctx.strokeStyle = '#0F1F4F';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Hat brim/trim - wide gold band
        ctx.fillStyle = '#D4AF37';
        ctx.fillRect(-baseSize * 0.8, -baseSize * 1.45, baseSize * 1.6, baseSize * 0.15);
        
        // Hat tip - glowing star orb (simplified)
        const tipAlpha = this.staffGlow * 0.7;
        ctx.fillStyle = `rgba(255, 215, 0, ${tipAlpha})`;
        ctx.beginPath();
        ctx.arc(baseSize * 0.15, -baseSize * 2.58, baseSize * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        // --- LEFT ARM WITH STAFF ---
        
        const leftShoulderX = -baseSize * 0.55;
        const leftShoulderY = -baseSize * 0.3;
        
        // Left arm - hand swings and holds the staff
        const leftSwingForward = leftArmBase;
        const leftElbowX = leftShoulderX + Math.cos(leftSwingForward) * baseSize * 0.4;
        const leftElbowY = leftShoulderY + Math.sin(leftSwingForward) * baseSize * 0.35;
        
        const leftWristX = leftElbowX + Math.cos(leftSwingForward) * baseSize * 0.35;
        const leftWristY = leftElbowY + Math.sin(leftSwingForward) * baseSize * 0.35;
        
        // Left arm shadow
        ctx.strokeStyle = `rgba(0, 0, 0, ${0.12 + Math.max(0, leftSwingForward) * 0.12})`;
        ctx.lineWidth = baseSize * 0.32;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(leftShoulderX + 0.5, leftShoulderY + 0.5);
        ctx.lineTo(leftElbowX + 0.5, leftElbowY + 0.5);
        ctx.lineTo(leftWristX + 0.5, leftWristY + 0.5);
        ctx.stroke();
        
        // Left arm - simplified colors
        ctx.strokeStyle = '#D8C8A8';
        ctx.lineWidth = baseSize * 0.34;
        ctx.beginPath();
        ctx.moveTo(leftShoulderX, leftShoulderY);
        ctx.lineTo(leftElbowX, leftElbowY);
        ctx.stroke();
        
        ctx.strokeStyle = '#C9A876';
        ctx.lineWidth = baseSize * 0.28;
        ctx.beginPath();
        ctx.moveTo(leftElbowX, leftElbowY);
        ctx.lineTo(leftWristX, leftWristY);
        ctx.stroke();
        
        // Left hand
        ctx.fillStyle = '#D8C8A8';
        ctx.beginPath();
        ctx.arc(leftWristX, leftWristY, baseSize * 0.17, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw scepter from left hand (swinging staff)
        this.drawScepter(ctx, leftWristX, leftWristY, baseSize);
        
        // --- RIGHT ARM (STATIC) ---
        
        const rightShoulderX = baseSize * 0.55;
        const rightShoulderY = -baseSize * 0.3;
        
        // Right arm - subtle swinging animation (opposite to left arm for walking effect)
        const rightArmSwing = Math.sin(armSwingFreq + Math.PI) * 0.3; // Opposite phase to left arm
        const rightArmAngle = Math.PI / 2.15 + rightArmSwing; // Fixed base angle + subtle swing
        const rightElbowX = rightShoulderX + Math.cos(rightArmAngle) * baseSize * 0.3;
        const rightElbowY = rightShoulderY + Math.sin(rightArmAngle) * baseSize * 0.25;
        
        const rightWristX = rightElbowX + Math.cos(rightArmAngle) * baseSize * 0.25;
        const rightWristY = rightElbowY + Math.sin(rightArmAngle) * baseSize * 0.25;
        
        // Right arm shadow
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = baseSize * 0.32;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(rightShoulderX + 0.5, rightShoulderY + 0.5);
        ctx.lineTo(rightElbowX + 0.5, rightElbowY + 0.5);
        ctx.lineTo(rightWristX + 0.5, rightWristY + 0.5);
        ctx.stroke();
        
        // Right arm - simplified colors
        ctx.strokeStyle = '#D8C8A8';
        ctx.lineWidth = baseSize * 0.34;
        ctx.beginPath();
        ctx.moveTo(rightShoulderX, rightShoulderY);
        ctx.lineTo(rightElbowX, rightElbowY);
        ctx.stroke();
        
        ctx.strokeStyle = '#C9A876';
        ctx.lineWidth = baseSize * 0.28;
        ctx.beginPath();
        ctx.moveTo(rightElbowX, rightElbowY);
        ctx.lineTo(rightWristX, rightWristY);
        ctx.stroke();
        
        // Right hand
        ctx.fillStyle = '#D8C8A8';
        ctx.beginPath();
        ctx.arc(rightWristX, rightWristY, baseSize * 0.17, 0, Math.PI * 2);
        ctx.fill();
        
        // --- LEGS ---
        
        const leftHipX = -baseSize * 0.28;
        const leftHipY = baseSize * 0.38;
        
        const leftLegAngle = walkCycle * 0.3;
        const leftFootX = leftHipX + Math.sin(leftLegAngle) * baseSize * 0.75;
        const leftFootY = leftHipY + Math.cos(leftLegAngle) * baseSize * 0.85;
        
        // Left leg
        ctx.strokeStyle = '#102050';
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
        
        // Right leg
        ctx.strokeStyle = '#102050';
        ctx.lineWidth = baseSize * 0.27;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(rightHipX, rightHipY);
        ctx.lineTo(rightFootX, rightFootY);
        ctx.stroke();
        
        // --- BOOTS ---
        
        ctx.fillStyle = '#0F0F0F';
        ctx.beginPath();
        ctx.ellipse(leftFootX, leftFootY + baseSize * 0.16, baseSize * 0.22, baseSize * 0.16, walkCycle * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#0F0F0F';
        ctx.beginPath();
        ctx.ellipse(rightFootX, rightFootY + baseSize * 0.16, baseSize * 0.22, baseSize * 0.16, -walkCycle * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        // Render magic particles - optimized (in local space)
        const particleColors = ['rgba(100, 149, 237, ', 'rgba(65, 105, 225, ', 'rgba(72, 209, 204, '];
        this.magicParticles.forEach(particle => {
            const alpha = (particle.life / particle.maxLife) * 0.8;
            ctx.fillStyle = particleColors[particle.colorIdx] + alpha + ')';
            ctx.beginPath();
            ctx.arc(particle.localX, particle.localY, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
        
        // Health bar
        const barWidth = baseSize * 3.2;
        const barHeight = Math.max(2, baseSize * 0.42);
        const barY = this.y - baseSize * 2.4;
        
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
    
    drawScepter(ctx, handX, handY, baseSize) {
        ctx.save();
        ctx.translate(handX, handY);
        
        // Scepter shaft - extends upward from hand
        const shaftLength = baseSize * 2.0;
        const shaftWidth = baseSize * 0.18;
        
        // Simplified shaft - solid color instead of gradient
        // Draw from -shaftLength (top) to 0 (hand position)
        ctx.fillStyle = '#654321';
        ctx.fillRect(-shaftWidth/2, -shaftLength, shaftWidth, shaftLength);
        
        // Simplified wood grain detail
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 0.8;
        for (let i = 2; i < 8; i += 2) {
            const grainY = (-shaftLength + (shaftLength * i / 8));
            ctx.beginPath();
            ctx.moveTo(-shaftWidth/2 + 1, grainY);
            ctx.lineTo(shaftWidth/2 - 1, grainY);
            ctx.stroke();
        }
        
        // Staff handle grip - wrapped leather (middle of staff)
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(-shaftWidth/2 - 2, -shaftLength * 0.45, shaftWidth + 4, baseSize * 0.35);
        
        // Simplified grip wrappings
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const wrapY = -shaftLength * 0.45 + (baseSize * 0.35 * i / 4);
            ctx.beginPath();
            ctx.moveTo(-shaftWidth/2 - 1, wrapY);
            ctx.lineTo(shaftWidth/2 + 1, wrapY);
            ctx.stroke();
        }
        
        // Metal ferrule at top of staff
        ctx.fillStyle = '#D4AF37';
        ctx.fillRect(-shaftWidth/2 - 3, -shaftLength - baseSize * 0.15, shaftWidth + 6, baseSize * 0.2);
        
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 1;
        ctx.strokeRect(-shaftWidth/2 - 3, -shaftLength - baseSize * 0.15, shaftWidth + 6, baseSize * 0.2);
        
        // --- LARGE CRYSTAL ORB AT SCEPTER HEAD - OPTIMIZED ---
        
        // Main crystal glow
        const crystalGlow = ctx.createRadialGradient(0, -shaftLength + baseSize * 0.15, baseSize * 0.2, 0, -shaftLength + baseSize * 0.15, baseSize * 0.6);
        crystalGlow.addColorStop(0, `rgba(100, 149, 237, ${this.staffPulse * 0.7})`);
        crystalGlow.addColorStop(1, 'rgba(30, 144, 255, 0)');
        
        ctx.fillStyle = crystalGlow;
        ctx.beginPath();
        ctx.arc(0, -shaftLength + baseSize * 0.15, baseSize * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        // Main crystal orb
        ctx.fillStyle = `rgba(100, 149, 237, ${this.staffPulse * 0.8})`;
        ctx.beginPath();
        ctx.arc(0, -shaftLength + baseSize * 0.15, baseSize * 0.28, 0, Math.PI * 2);
        ctx.fill();
        
        // Crystal highlight
        ctx.fillStyle = `rgba(255, 255, 255, ${this.staffPulse * 0.5})`;
        ctx.beginPath();
        ctx.arc(-baseSize * 0.08, -shaftLength - baseSize * 0.1, baseSize * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Smaller orbiting energy crystals - reduced from 4 to 2
        for (let i = 0; i < 2; i++) {
            const orbitAngle = (this.animationTime * 2.5) + (i * Math.PI);
            const orbitX = Math.cos(orbitAngle) * baseSize * 0.4;
            const orbitY = -shaftLength + baseSize * 0.15 + Math.sin(orbitAngle) * baseSize * 0.4;
            
            // Orbit glow - simplified
            ctx.fillStyle = `rgba(72, 209, 204, ${this.staffPulse * 0.4})`;
            ctx.beginPath();
            ctx.arc(orbitX, orbitY, baseSize * 0.15, 0, Math.PI * 2);
            ctx.fill();
            
            // Orbit crystal
            ctx.fillStyle = `rgba(100, 149, 237, ${this.staffPulse * 0.6})`;
            ctx.beginPath();
            ctx.arc(orbitX, orbitY, baseSize * 0.1, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
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
