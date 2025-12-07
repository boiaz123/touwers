import { BaseEnemy } from './BaseEnemy.js';

export class VillagerEnemy extends BaseEnemy {
    // Static counter to alternate weapon types across spawns
    static weaponSpawnCounter = 0;
    
    constructor(path, health_multiplier = 1.0, speed = 50) {
        super(path, 100 * health_multiplier, speed);
        this.tunicColor = this.getRandomTunicColor();
        // Alternate weapon type: even spawns get torch, odd get pitchfork
        this.weaponType = (VillagerEnemy.weaponSpawnCounter % 2) === 0 ? 'torch' : 'pitchfork';
        VillagerEnemy.weaponSpawnCounter++;
        
        // Attack properties - NEW
        this.attackDamage = 4;
        this.attackSpeed = 0.8;
        
        console.log('VillagerEnemy: Created at position', this.x, this.y, 'with weapon:', this.weaponType);
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
        
        console.log('VillagerEnemy: Path updated, now at index', this.currentPathIndex, 'position', this.x, this.y);
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
        
        if (this.reachedEnd || !this.path || this.path.length === 0) return;
        
        if (this.currentPathIndex >= this.path.length - 1) {
            this.reachedEnd = true;
            this.isAttackingCastle = true;
            console.log('VillagerEnemy: Reached castle, ready to attack!');
            return;
        }
        
        const target = this.path[this.currentPathIndex + 1];
        if (!target) {
            this.reachedEnd = true;
            console.log('VillagerEnemy: No target waypoint, reached end');
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
        
        const walkCycle = Math.sin(this.animationTime * 8) * 0.5;
        const bobAnimation = Math.sin(this.animationTime * 8) * 0.3;
        
        const armSwingFreq = this.animationTime * 8;
        const leftArmBase = Math.sin(armSwingFreq) * 0.6;
        const leftArmBend = Math.sin(armSwingFreq * 2) * 0.15;
        const rightArmBase = Math.sin(armSwingFreq + Math.PI) * 0.55;
        const rightArmBend = Math.sin(armSwingFreq * 2 + Math.PI / 3) * 0.18;
        
        // Enemy shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + baseSize * 1.6, baseSize * 0.9, baseSize * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.save();
        ctx.translate(this.x, this.y + bobAnimation);
        
        // Back/depth layer
        ctx.fillStyle = this.darkenColor(this.tunicColor, 0.2);
        ctx.fillRect(-baseSize * 0.65, -baseSize * 0.75, baseSize * 1.3, baseSize * 1.1);
        
        // Main tunic/body
        const bodyGradient = ctx.createLinearGradient(-baseSize * 0.6, -baseSize * 0.8, baseSize * 0.6, baseSize * 0.4);
        bodyGradient.addColorStop(0, this.tunicColor);
        bodyGradient.addColorStop(0.5, this.tunicColor);
        bodyGradient.addColorStop(1, this.darkenColor(this.tunicColor, 0.15));
        
        ctx.fillStyle = bodyGradient;
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
        
        const headGradient = ctx.createRadialGradient(-baseSize * 0.1, -baseSize * 1.25, baseSize * 0.2, 0, -baseSize * 1.2, baseSize * 0.6);
        headGradient.addColorStop(0, '#E8D4B8');
        headGradient.addColorStop(0.6, '#DDBEA9');
        headGradient.addColorStop(1, '#C9A876');
        
        ctx.fillStyle = headGradient;
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
        
        ctx.strokeStyle = `rgba(0, 0, 0, ${0.1 + Math.max(0, leftSwingForward) * 0.15})`;
        ctx.lineWidth = baseSize * 0.3;
        ctx.beginPath();
        ctx.moveTo(leftShoulderX + 0.5, leftShoulderY + 0.5);
        ctx.lineTo(leftElbowX + 0.5, leftElbowY + 0.5);
        ctx.lineTo(leftWristX + 0.5, leftWristY + 0.5);
        ctx.stroke();
        
        const leftUpperArmGradient = ctx.createLinearGradient(leftShoulderX, leftShoulderY, leftElbowX, leftElbowY);
        leftUpperArmGradient.addColorStop(0, '#E8D4B8');
        leftUpperArmGradient.addColorStop(1, `rgba(201, 168, 118, ${0.9 + Math.abs(leftSwingForward) * 0.1})`);
        
        ctx.strokeStyle = leftUpperArmGradient;
        ctx.lineWidth = baseSize * 0.32;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(leftShoulderX, leftShoulderY);
        ctx.lineTo(leftElbowX, leftElbowY);
        ctx.stroke();
        
        const leftLowerArmGradient = ctx.createLinearGradient(leftElbowX, leftElbowY, leftWristX, leftWristY);
        leftLowerArmGradient.addColorStop(0, `rgba(232, 212, 184, ${0.95 + Math.abs(leftSwingForward) * 0.05})`);
        leftLowerArmGradient.addColorStop(1, '#C9A876');
        
        ctx.strokeStyle = leftLowerArmGradient;
        ctx.lineWidth = baseSize * 0.26;
        ctx.beginPath();
        ctx.moveTo(leftElbowX, leftElbowY);
        ctx.lineTo(leftWristX, leftWristY);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(221, 190, 169, 0.9)';
        ctx.beginPath();
        ctx.arc(leftWristX, leftWristY, baseSize * 0.16, 0, Math.PI * 2);
        ctx.fill();
        
        // --- RIGHT ARM WITH WEAPON (RAISED) ---
        
        const rightShoulderX = baseSize * 0.5;
        const rightShoulderY = -baseSize * 0.35;
        
        // Right arm raised up holding weapon - more aggressive pose
        const weaponRaiseAngle = -Math.PI / 2 + 0.3; // Arm raised up and slightly forward
        const rightElbowX = rightShoulderX + Math.cos(weaponRaiseAngle) * baseSize * 0.45;
        const rightElbowY = rightShoulderY + Math.sin(weaponRaiseAngle) * baseSize * 0.45;
        
        const rightWristX = rightElbowX + Math.cos(weaponRaiseAngle) * baseSize * 0.4;
        const rightWristY = rightElbowY + Math.sin(weaponRaiseAngle) * baseSize * 0.4;
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = baseSize * 0.3;
        ctx.beginPath();
        ctx.moveTo(rightShoulderX + 0.5, rightShoulderY + 0.5);
        ctx.lineTo(rightElbowX + 0.5, rightElbowY + 0.5);
        ctx.lineTo(rightWristX + 0.5, rightWristY + 0.5);
        ctx.stroke();
        
        const rightUpperArmGradient = ctx.createLinearGradient(rightShoulderX, rightShoulderY, rightElbowX, rightElbowY);
        rightUpperArmGradient.addColorStop(0, '#E8D4B8');
        rightUpperArmGradient.addColorStop(1, 'rgba(201, 168, 118, 0.95)');
        
        ctx.strokeStyle = rightUpperArmGradient;
        ctx.lineWidth = baseSize * 0.32;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(rightShoulderX, rightShoulderY);
        ctx.lineTo(rightElbowX, rightElbowY);
        ctx.stroke();
        
        const rightLowerArmGradient = ctx.createLinearGradient(rightElbowX, rightElbowY, rightWristX, rightWristY);
        rightLowerArmGradient.addColorStop(0, 'rgba(232, 212, 184, 0.95)');
        rightLowerArmGradient.addColorStop(1, '#C9A876');
        
        ctx.strokeStyle = rightLowerArmGradient;
        ctx.lineWidth = baseSize * 0.26;
        ctx.beginPath();
        ctx.moveTo(rightElbowX, rightElbowY);
        ctx.lineTo(rightWristX, rightWristY);
        ctx.stroke();
        
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
        ctx.beginPath();
        ctx.moveTo(leftHipX + 1, leftHipY + 1);
        ctx.lineTo(leftFootX + 1, leftFootY + 1);
        ctx.stroke();
        
        ctx.strokeStyle = '#2F2F2F';
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
        ctx.beginPath();
        ctx.moveTo(rightHipX + 1, rightHipY + 1);
        ctx.lineTo(rightFootX + 1, rightFootY + 1);
        ctx.stroke();
        
        ctx.strokeStyle = '#2F2F2F';
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
        
        // Handle detail - wood grain
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 0.5;
        for (let i = 1; i < 5; i++) {
            const grainY = (baseSize * 0.65 * i / 5);
            ctx.beginPath();
            ctx.moveTo(-baseSize * 0.08, grainY);
            ctx.lineTo(baseSize * 0.08, grainY);
            ctx.stroke();
        }
        
        // Torch head - cloth wrapping around stick
        const torchHeadY = -baseSize * 0.25;
        ctx.fillStyle = '#D4691E';
        ctx.fillRect(-baseSize * 0.14, torchHeadY - baseSize * 0.1, baseSize * 0.28, baseSize * 0.15);
        
        // Wrapping bands
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.14, torchHeadY - baseSize * 0.04);
        ctx.lineTo(baseSize * 0.14, torchHeadY - baseSize * 0.04);
        ctx.stroke();
        
        // Char marks on torch head
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(-baseSize * 0.12, torchHeadY - baseSize * 0.08, baseSize * 0.08, baseSize * 0.12);
        ctx.fillRect(baseSize * 0.04, torchHeadY - baseSize * 0.06, baseSize * 0.08, baseSize * 0.1);
        
        // Fire glow aura
        const fireGlowGradient = ctx.createRadialGradient(0, torchHeadY - baseSize * 0.35, 0, 0, torchHeadY - baseSize * 0.35, baseSize * 0.4);
        fireGlowGradient.addColorStop(0, `rgba(255, 200, 0, ${0.7 + Math.sin(this.animationTime * 6) * 0.2})`);
        fireGlowGradient.addColorStop(0.5, `rgba(255, 100, 0, ${0.4 + Math.sin(this.animationTime * 6) * 0.15})`);
        fireGlowGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.fillStyle = fireGlowGradient;
        ctx.beginPath();
        ctx.arc(0, torchHeadY - baseSize * 0.35, baseSize * 0.35, 0, Math.PI * 2);
        ctx.fill();
        
        // Animated flames
        const flameFlicker = Math.sin(this.animationTime * 8 + Math.random() * Math.PI) * 0.15;
        
        // Outer flame (orange)
        ctx.fillStyle = `rgba(255, 140, 0, ${0.85 + flameFlicker})`;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.1, torchHeadY);
        ctx.quadraticCurveTo(-baseSize * 0.08, torchHeadY - baseSize * 0.4, 0, torchHeadY - baseSize * 0.5);
        ctx.quadraticCurveTo(baseSize * 0.08, torchHeadY - baseSize * 0.4, baseSize * 0.1, torchHeadY);
        ctx.closePath();
        ctx.fill();
        
        // Middle flame (yellow-orange)
        ctx.fillStyle = `rgba(255, 180, 0, ${0.7 + flameFlicker * 0.5})`;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.06, torchHeadY - baseSize * 0.05);
        ctx.quadraticCurveTo(-baseSize * 0.04, torchHeadY - baseSize * 0.32, 0, torchHeadY - baseSize * 0.42);
        ctx.quadraticCurveTo(baseSize * 0.04, torchHeadY - baseSize * 0.32, baseSize * 0.06, torchHeadY - baseSize * 0.05);
        ctx.closePath();
        ctx.fill();
        
        // Inner flame (yellow - hot core)
        ctx.fillStyle = `rgba(255, 255, 100, ${0.8 + flameFlicker * 0.3})`;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.03, torchHeadY - baseSize * 0.1);
        ctx.quadraticCurveTo(0, torchHeadY - baseSize * 0.28, 0, torchHeadY - baseSize * 0.35);
        ctx.quadraticCurveTo(0, torchHeadY - baseSize * 0.28, baseSize * 0.03, torchHeadY - baseSize * 0.1);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    drawPitchfork(ctx, handX, handY, baseSize, armAngle) {
        ctx.save();
        ctx.translate(handX, handY);
        ctx.rotate(armAngle + Math.PI / 2);
        
        // Pitchfork shaft - wood
        const shaftWidth = baseSize * 0.12;
        const shaftLength = baseSize * 0.7;
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-shaftWidth / 2, 0, shaftWidth, shaftLength);
        
        // Shaft wood grain details
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 0.5;
        for (let i = 1; i < 6; i++) {
            const grainY = (shaftLength * i / 6);
            ctx.beginPath();
            ctx.moveTo(-shaftWidth / 2, grainY);
            ctx.lineTo(shaftWidth / 2, grainY);
            ctx.stroke();
        }
        
        // Metal ferrule (connection piece)
        const ferruleY = -baseSize * 0.15;
        ctx.fillStyle = '#696969';
        ctx.fillRect(-baseSize * 0.15, ferruleY - baseSize * 0.05, baseSize * 0.3, baseSize * 0.1);
        
        // Ferrule bands/rivets
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.15, ferruleY);
        ctx.lineTo(baseSize * 0.15, ferruleY);
        ctx.stroke();
        
        // Rivet details on ferrule
        for (let i = -1; i <= 1; i++) {
            ctx.fillStyle = '#505050';
            ctx.beginPath();
            ctx.arc(i * baseSize * 0.08, ferruleY, baseSize * 0.02, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Three prongs - metal tines
        const prongTopY = -baseSize * 0.6;
        const prong1X = -baseSize * 0.25;
        const prong2X = 0;
        const prong3X = baseSize * 0.25;
        
        // Prong material gradient
        const prongGradient = ctx.createLinearGradient(0, ferruleY, 0, prongTopY);
        prongGradient.addColorStop(0, '#A9A9A9');
        prongGradient.addColorStop(0.5, '#C0C0C0');
        prongGradient.addColorStop(1, '#808080');
        
        // Draw each prong with proper thickness and shading
        const prongWidth = baseSize * 0.1;
        const prongPositions = [
            { x: prong1X, length: baseSize * 0.45 },
            { x: prong2X, length: baseSize * 0.52 }, // Center prong slightly longer
            { x: prong3X, length: baseSize * 0.45 }
        ];
        
        prongPositions.forEach((prong, index) => {
            // Prong shadow (depth)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(prong.x + baseSize * 0.02, ferruleY, prongWidth - baseSize * 0.02, -prong.length);
            
            // Main prong
            ctx.fillStyle = prongGradient;
            ctx.fillRect(prong.x - prongWidth / 2, ferruleY, prongWidth, -prong.length);
            
            // Prong edge highlight (sharpness)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fillRect(prong.x - prongWidth / 2 + baseSize * 0.02, ferruleY, baseSize * 0.03, -prong.length);
            
            // Prong sharp point - darker tip
            ctx.fillStyle = '#505050';
            ctx.beginPath();
            ctx.moveTo(prong.x - prongWidth / 2, ferruleY - prong.length);
            ctx.lineTo(prong.x + prongWidth / 2, ferruleY - prong.length);
            ctx.lineTo(prong.x, ferruleY - prong.length - baseSize * 0.08);
            ctx.closePath();
            ctx.fill();
        });
        
        // Prong connecting bar at base
        ctx.fillStyle = '#808080';
        ctx.fillRect(-baseSize * 0.28, ferruleY - baseSize * 0.08, baseSize * 0.56, baseSize * 0.08);
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.strokeRect(-baseSize * 0.28, ferruleY - baseSize * 0.08, baseSize * 0.56, baseSize * 0.08);
        
        ctx.restore();
    }
    
    darkenColor(color, factor) {
        return super.darkenColor(color, factor);
    }
}
