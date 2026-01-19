import { BaseEnemy } from './BaseEnemy.js';

export class VillagerEnemy extends BaseEnemy {
    // Static counter to alternate weapon types across spawns
    static weaponSpawnCounter = 0;

    static BASE_STATS = {
        health: 100,
        speed: 50,
        armour: 0,
        magicResistance: 0
    };
    
    constructor(path, health_multiplier = 1.0, speed = null, armour = null, magicResistance = null) {
        const baseStats = VillagerEnemy.BASE_STATS;
        const actualSpeed = speed !== null ? speed : baseStats.speed;
        const actualArmour = armour !== null ? armour : baseStats.armour;
        const actualMagicResistance = magicResistance !== null ? magicResistance : baseStats.magicResistance;
        
        super(path, baseStats.health * health_multiplier, actualSpeed, actualArmour, actualMagicResistance);
        this.tunicColor = this.getRandomTunicColor();
        // Alternate weapon type: even spawns get torch, odd get pitchfork
        this.weaponType = (VillagerEnemy.weaponSpawnCounter % 2) === 0 ? 'torch' : 'pitchfork';
        VillagerEnemy.weaponSpawnCounter++;
        
        // Attack properties - NEW
        this.attackDamage = 4;
        this.attackSpeed = 0.8;
        
        // Optimization: Cache animation values
        this.cachedAnimTime = 0;
        this.cachedWalkCycle = 0;
        this.cachedBobAnimation = 0;
        this.cachedArmSwing = { left: 0, right: 0 };
        
        // Torch particle system (lightweight)
        this.torchParticles = [];
        
    }
    
    getRandomTunicColor() {
        const tunicColors = [
            '#8B4513', // Brown
            '#D4A574', // Tan
            '#A0826D', // Light Brown
            '#704214', // Dark Brown
            '#9B7653', // Tan Brown
            '#6B5344'  // Darker Brown
        ];
        
        return tunicColors[Math.floor(Math.random() * tunicColors.length)];
    }
    
    updatePath(newPath) {
        if (!newPath || newPath.length === 0) {
            console.warn('VillagerEnemy: Received invalid path');
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
        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
        
        // Pre-calculate animation values for rendering to avoid recalculation per frame
        const animTime = this.animationTime * 8 + this.animationPhaseOffset;
        this.cachedAnimTime = animTime;
        this.cachedWalkCycle = Math.sin(animTime) * 0.5;
        this.cachedBobAnimation = Math.sin(animTime) * 0.3;
        this.cachedArmSwing.left = Math.sin(animTime) * 0.6;
        this.cachedArmSwing.right = Math.sin(animTime + Math.PI) * 0.55;
        
        // Update torch particles for burning effect
        if (this.weaponType === 'torch') {
            this.updateTorchParticles(deltaTime);
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
    
    updateTorchParticles(deltaTime) {
        // Add new particles periodically
        if (Math.random() < 0.6) {
            this.torchParticles.push({
                x: 0,
                y: 0,
                vx: (Math.random() - 0.5) * 30,
                vy: -Math.random() * 40 - 20,
                life: 0.5 + Math.random() * 0.3,
                maxLife: 0.5 + Math.random() * 0.3,
                size: Math.random() * 3 + 2
            });
        }
        
        // Update and remove dead particles
        for (let i = this.torchParticles.length - 1; i >= 0; i--) {
            const p = this.torchParticles[i];
            p.life -= deltaTime;
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            
            if (p.life <= 0) {
                this.torchParticles.splice(i, 1);
            }
        }
        
        // Keep particle count reasonable
        if (this.torchParticles.length > 8) {
            this.torchParticles = this.torchParticles.slice(-8);
        }
    }
    
    takeDamage(amount, armorPiercingPercent = 0, damageType = 'physical', followTarget = false) {
        super.takeDamage(amount, armorPiercingPercent, damageType, followTarget);
    }
    
    isDead() {
        return this.health <= 0;
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
    
    render(ctx) {
        const baseSize = Math.max(6, Math.min(14, ctx.canvas.width / 150));
        
        // Use pre-calculated animation values
        const walkCycle = this.cachedWalkCycle;
        const bobAnimation = this.cachedBobAnimation;
        const armSwingFreq = this.cachedAnimTime;
        const leftArmBase = this.cachedArmSwing.left;
        const leftArmBend = Math.sin(armSwingFreq * 2) * 0.15;
        const rightArmBase = this.cachedArmSwing.right;
        const rightArmBend = Math.sin(armSwingFreq * 2 + Math.PI / 3) * 0.18;
        
        // Enemy shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + baseSize * 1.6, baseSize * 0.9, baseSize * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.save();
        ctx.translate(this.x, this.y + bobAnimation);
        
        // Back/depth layer - simplified (no gradient needed)
        ctx.fillStyle = this.darkenColor(this.tunicColor, 0.2);
        ctx.fillRect(-baseSize * 0.65, -baseSize * 0.75, baseSize * 1.3, baseSize * 1.1);
        
        // Main tunic/body - simplified gradient
        ctx.fillStyle = this.tunicColor;
        ctx.fillRect(-baseSize * 0.6, -baseSize * 0.8, baseSize * 1.2, baseSize * 1.2);
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.strokeRect(-baseSize * 0.6, -baseSize * 0.8, baseSize * 1.2, baseSize * 1.2);
        
        // Center seam
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, -baseSize * 0.8);
        ctx.lineTo(0, baseSize * 0.4);
        ctx.stroke();
        
        // Side highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(-baseSize * 0.55, -baseSize * 0.7, baseSize * 0.2, baseSize * 0.8);
        
        // --- HEAD ---
        ctx.fillStyle = '#C4A575';
        ctx.beginPath();
        ctx.arc(baseSize * 0.05, -baseSize * 1.15, baseSize * 0.55, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#E8D4B8';
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.2, baseSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#B8956A';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.2, baseSize * 0.5, 0, Math.PI * 2);
        ctx.stroke();
        
        // --- STRAW HAT (Villager) ---
        ctx.fillStyle = '#D4A574';
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.2, baseSize * 0.62, Math.PI, Math.PI * 2);
        ctx.fill();
        
        // Hat brim
        ctx.fillStyle = '#C9994D';
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 1.2, baseSize * 0.7, baseSize * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#8B6F47';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 1.2, baseSize * 0.7, baseSize * 0.15, 0, 0, Math.PI * 2);
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
        
        // Shadow stroke (simplified)
        ctx.strokeStyle = `rgba(0, 0, 0, 0.15)`;
        ctx.lineWidth = baseSize * 0.3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(leftShoulderX, leftShoulderY);
        ctx.lineTo(leftElbowX, leftElbowY);
        ctx.lineTo(leftWristX, leftWristY);
        ctx.stroke();
        
        // Main arm
        ctx.strokeStyle = '#E8D4B8';
        ctx.lineWidth = baseSize * 0.3;
        ctx.beginPath();
        ctx.moveTo(leftShoulderX, leftShoulderY);
        ctx.lineTo(leftWristX, leftWristY);
        ctx.stroke();
        
        // Hand
        ctx.fillStyle = 'rgba(221, 190, 169, 0.9)';
        ctx.beginPath();
        ctx.arc(leftWristX, leftWristY, baseSize * 0.16, 0, Math.PI * 2);
        ctx.fill();
        
        // --- RIGHT ARM WITH WEAPON (RAISED) ---
        const rightShoulderX = baseSize * 0.5;
        const rightShoulderY = -baseSize * 0.35;
        
        const weaponRaiseAngle = -Math.PI / 2 + 0.3;
        const rightElbowX = rightShoulderX + Math.cos(weaponRaiseAngle) * baseSize * 0.45;
        const rightElbowY = rightShoulderY + Math.sin(weaponRaiseAngle) * baseSize * 0.45;
        
        const rightWristX = rightElbowX + Math.cos(weaponRaiseAngle) * baseSize * 0.4;
        const rightWristY = rightElbowY + Math.sin(weaponRaiseAngle) * baseSize * 0.4;
        
        // Shadow stroke
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = baseSize * 0.3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(rightShoulderX, rightShoulderY);
        ctx.lineTo(rightElbowX, rightElbowY);
        ctx.lineTo(rightWristX, rightWristY);
        ctx.stroke();
        
        // Main arm
        ctx.strokeStyle = '#E8D4B8';
        ctx.lineWidth = baseSize * 0.3;
        ctx.beginPath();
        ctx.moveTo(rightShoulderX, rightShoulderY);
        ctx.lineTo(rightWristX, rightWristY);
        ctx.stroke();
        
        // Hand
        ctx.fillStyle = 'rgba(221, 190, 169, 0.95)';
        ctx.beginPath();
        ctx.arc(rightWristX, rightWristY, baseSize * 0.16, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw weapon based on type
        if (this.weaponType === 'torch') {
            this.drawTorch(ctx, rightWristX, rightWristY, baseSize, weaponRaiseAngle);
        } else {
            this.drawPitchfork(ctx, rightWristX, rightWristY, baseSize, weaponRaiseAngle);
        }
        
        // --- LEGS ---
        const leftHipX = -baseSize * 0.25;
        const leftHipY = baseSize * 0.35;
        
        const leftLegAngle = walkCycle * 0.35;
        const leftFootX = leftHipX + Math.sin(leftLegAngle) * baseSize * 0.7;
        const leftFootY = leftHipY + Math.cos(leftLegAngle) * baseSize * 0.8;
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
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
    
    drawTorch(ctx, handX, handY, baseSize, armAngle) {
        ctx.save();
        ctx.translate(handX, handY);
        ctx.rotate(armAngle + Math.PI / 2);
        
        // Torch handle - wooden shaft
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-baseSize * 0.08, 0, baseSize * 0.16, baseSize * 0.65);
        
        // Handle detail - wood grain (simplified)
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 0.5;
        for (let i = 1; i < 5; i++) {
            const grainY = (baseSize * 0.65 * i / 5);
            ctx.beginPath();
            ctx.moveTo(-baseSize * 0.08, grainY);
            ctx.lineTo(baseSize * 0.08, grainY);
            ctx.stroke();
        }
        
        // Torch head - cloth wrapping
        const torchHeadY = -baseSize * 0.25;
        ctx.fillStyle = '#D4691E';
        ctx.fillRect(-baseSize * 0.14, torchHeadY - baseSize * 0.1, baseSize * 0.28, baseSize * 0.15);
        
        // Wrapping band detail
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.14, torchHeadY - baseSize * 0.04);
        ctx.lineTo(baseSize * 0.14, torchHeadY - baseSize * 0.04);
        ctx.stroke();
        
        // Char marks on torch head
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(-baseSize * 0.12, torchHeadY - baseSize * 0.08, baseSize * 0.08, baseSize * 0.12);
        ctx.fillRect(baseSize * 0.04, torchHeadY - baseSize * 0.06, baseSize * 0.08, baseSize * 0.1);
        
        // Glowing aura around flames
        ctx.fillStyle = `rgba(255, 150, 0, ${0.3 + Math.sin(this.animationTime * 6) * 0.15})`;
        ctx.beginPath();
        ctx.arc(0, torchHeadY - baseSize * 0.35, baseSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Animated flames with better burning effect
        const flameFlicker = Math.sin(this.animationTime * 8 + Math.random() * Math.PI) * 0.2 + 0.8;
        const flameWave = Math.sin(this.animationTime * 4) * 0.1;
        
        // Outer flame envelope (dark orange)
        ctx.fillStyle = `rgba(220, 100, 20, ${0.9 * flameFlicker})`;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.12, torchHeadY);
        ctx.quadraticCurveTo(-baseSize * 0.1 + flameWave * baseSize * 0.05, torchHeadY - baseSize * 0.35, 0, torchHeadY - baseSize * 0.55);
        ctx.quadraticCurveTo(baseSize * 0.1 + flameWave * baseSize * 0.05, torchHeadY - baseSize * 0.35, baseSize * 0.12, torchHeadY);
        ctx.closePath();
        ctx.fill();
        
        // Middle flame (orange)
        ctx.fillStyle = `rgba(255, 140, 20, ${0.8 * flameFlicker})`;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.08, torchHeadY - baseSize * 0.05);
        ctx.quadraticCurveTo(-baseSize * 0.06 + flameWave * baseSize * 0.03, torchHeadY - baseSize * 0.30, 0, torchHeadY - baseSize * 0.48);
        ctx.quadraticCurveTo(baseSize * 0.06 + flameWave * baseSize * 0.03, torchHeadY - baseSize * 0.30, baseSize * 0.08, torchHeadY - baseSize * 0.05);
        ctx.closePath();
        ctx.fill();
        
        // Inner flame hot core (bright yellow-white)
        ctx.fillStyle = `rgba(255, 220, 100, ${0.9 * flameFlicker})`;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.04, torchHeadY - baseSize * 0.08);
        ctx.quadraticCurveTo(-baseSize * 0.02, torchHeadY - baseSize * 0.25, 0, torchHeadY - baseSize * 0.38);
        ctx.quadraticCurveTo(baseSize * 0.02, torchHeadY - baseSize * 0.25, baseSize * 0.04, torchHeadY - baseSize * 0.08);
        ctx.closePath();
        ctx.fill();
        
        // Brightest core (white hot center)
        ctx.fillStyle = `rgba(255, 255, 200, ${0.7 * flameFlicker})`;
        ctx.beginPath();
        ctx.arc(0, torchHeadY - baseSize * 0.28, baseSize * 0.05, 0, Math.PI * 2);
        ctx.fill();
        
        // Render torch particles for better burning effect
        ctx.globalAlpha = 0.6;
        this.torchParticles.forEach(p => {
            const lifePercent = p.life / p.maxLife;
            const size = p.size * lifePercent;
            const brightness = Math.max(0, lifePercent - 0.3) * 1.43;
            
            ctx.fillStyle = `rgba(255, ${150 * brightness}, 0, ${brightness})`;
            ctx.beginPath();
            ctx.arc(p.x, torchHeadY - baseSize * 0.35 + p.y, size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        ctx.restore();
    }
    
    drawPitchfork(ctx, handX, handY, baseSize, armAngle) {
        ctx.save();
        ctx.translate(handX, handY);
        ctx.rotate(armAngle + Math.PI / 2);
        
        // Pitchfork shaft - wooden handle
        const shaftWidth = baseSize * 0.12;
        const shaftLength = baseSize * 0.7;
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-shaftWidth / 2, 0, shaftWidth, shaftLength);
        
        // Shaft wood grain details (simplified for performance)
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 0.5;
        for (let i = 1; i < 5; i++) {
            const grainY = (shaftLength * i / 5);
            ctx.beginPath();
            ctx.moveTo(-shaftWidth / 2, grainY);
            ctx.lineTo(shaftWidth / 2, grainY);
            ctx.stroke();
        }
        
        // Metal ferrule (connection piece between handle and tines)
        const ferruleY = -baseSize * 0.15;
        ctx.fillStyle = '#696969';
        ctx.fillRect(-baseSize * 0.16, ferruleY - baseSize * 0.06, baseSize * 0.32, baseSize * 0.12);
        
        // Ferrule edge highlight
        ctx.fillStyle = '#A9A9A9';
        ctx.fillRect(-baseSize * 0.16, ferruleY - baseSize * 0.06, baseSize * 0.32, baseSize * 0.04);
        
        // Ferrule rivets/rivets for detail
        ctx.fillStyle = '#505050';
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.arc(i * baseSize * 0.08, ferruleY, baseSize * 0.018, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Three iron tines forming a W-shape (distinctive design)
        const tineTop = -baseSize * 0.65;
        const leftTineX = -baseSize * 0.3;
        const centerTineX = 0;
        const rightTineX = baseSize * 0.3;
        
        // Tine specifications
        const tineHeight = baseSize * 0.5;
        const tineWidth = baseSize * 0.12;
        const tipPointHeight = baseSize * 0.08;
        
        // Draw three tines with iron coloring and shading
        const tines = [
            { x: leftTineX, baseOffset: 0 },
            { x: centerTineX, baseOffset: -baseSize * 0.07 }, // Center tine slightly taller
            { x: rightTineX, baseOffset: 0 }
        ];
        
        tines.forEach((tine, idx) => {
            // Tine connection bar shadow at base
            if (idx === 0) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.fillRect(-baseSize * 0.35, ferruleY - baseSize * 0.03, baseSize * 0.7, baseSize * 0.04);
            }
            
            // Main tine body - iron gray with shading
            ctx.fillStyle = idx === 1 ? '#A9A9A9' : '#999999'; // Center tine slightly lighter
            const tineY = ferruleY + tine.baseOffset;
            const actualHeight = tineHeight + (idx === 1 ? baseSize * 0.07 : 0);
            
            // Tine rectangle body
            ctx.fillRect(tine.x - tineWidth / 2, tineY, tineWidth, -actualHeight);
            
            // Tine edge highlight (right edge to show metal shine)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(tine.x - tineWidth / 2 + baseSize * 0.03, tineY - actualHeight * 0.7, baseSize * 0.03, actualHeight * 0.7);
            
            // Tine shadow (left edge for depth)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.fillRect(tine.x - tineWidth / 2, tineY, baseSize * 0.03, -actualHeight);
            
            // Sharp iron point at tip - Dark iron tip
            ctx.fillStyle = '#505050';
            ctx.beginPath();
            ctx.moveTo(tine.x - tineWidth / 2, tineY - actualHeight);
            ctx.lineTo(tine.x + tineWidth / 2, tineY - actualHeight);
            ctx.lineTo(tine.x, tineY - actualHeight - tipPointHeight);
            ctx.closePath();
            ctx.fill();
            
            // Tip edge highlight for sharpness
            ctx.strokeStyle = '#C0C0C0';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(tine.x - tineWidth / 2, tineY - actualHeight);
            ctx.lineTo(tine.x, tineY - actualHeight - tipPointHeight);
            ctx.stroke();
            
            // Tip right edge
            ctx.beginPath();
            ctx.moveTo(tine.x + tineWidth / 2, tineY - actualHeight);
            ctx.lineTo(tine.x, tineY - actualHeight - tipPointHeight);
            ctx.stroke();
        });
        
        // Tine connection bar at base (joins all three tines)
        ctx.fillStyle = '#808080';
        ctx.fillRect(-baseSize * 0.35, ferruleY - baseSize * 0.08, baseSize * 0.7, baseSize * 0.08);
        
        // Connection bar edge highlight
        ctx.fillStyle = '#A9A9A9';
        ctx.fillRect(-baseSize * 0.35, ferruleY - baseSize * 0.08, baseSize * 0.7, baseSize * 0.04);
        
        // Connection bar outline
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(-baseSize * 0.35, ferruleY - baseSize * 0.08, baseSize * 0.7, baseSize * 0.08);
        
        ctx.restore();
    }
    
    darkenColor(color, factor) {
        return super.darkenColor(color, factor);
    }
}
