export class MageEnemy {
    constructor(path, health = 110, speed = 45) {
        this.path = path;
        this.health = health;
        this.maxHealth = health;
        this.speed = speed;
        this.currentPathIndex = 0;
        this.x = path && path.length > 0 ? path[0].x : 0;
        this.y = path && path.length > 0 ? path[0].y : 0;
        this.reachedEnd = false;
        
        // Animation and appearance properties
        this.animationTime = 0;
        this.robeColor = '#1A3A7A'; // Deep wizard blue
        this.sizeMultiplier = 1.1; // 10% taller than basic enemy
        
        // Magic effects
        this.magicParticles = [];
        this.staffGlow = 0;
        this.staffPulse = 0;
        this.spellCastTimer = 0;
        this.isCastingSpell = false;
        
        console.log('MageEnemy: Created at position', this.x, this.y, 'with wizard robes');
    }
    
    updatePath(newPath) {
        if (!newPath || newPath.length === 0) {
            console.warn('MageEnemy: Received invalid path');
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
        
        console.log('MageEnemy: Path updated, now at index', this.currentPathIndex, 'position', this.x, this.y);
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
        this.spellCastTimer += deltaTime;
        
        // Staff glow animation - more pronounced pulsing
        this.staffGlow = 0.6 + 0.4 * Math.sin(this.animationTime * 3);
        this.staffPulse = 0.7 + 0.3 * Math.sin(this.animationTime * 2.5);
        
        // Generate magic particles around mage
        if (Math.random() < deltaTime * 4) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 30 + 15;
            this.magicParticles.push({
                x: this.x + Math.cos(angle) * radius,
                y: this.y + Math.sin(angle) * radius - 20,
                vx: (Math.random() - 0.5) * 30,
                vy: -Math.random() * 40 - 20,
                life: 1.5,
                maxLife: 1.5,
                size: Math.random() * 2 + 1,
                color: this.getMagicParticleColor()
            });
        }
        
        // Update magic particles
        this.magicParticles = this.magicParticles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            particle.size = Math.max(0, particle.size * (particle.life / particle.maxLife));
            return particle.life > 0;
        });
        
        if (this.reachedEnd || !this.path || this.path.length === 0) return;
        
        if (this.currentPathIndex >= this.path.length - 1) {
            this.reachedEnd = true;
            console.log('MageEnemy: Reached end of path');
            return;
        }
        
        const target = this.path[this.currentPathIndex + 1];
        if (!target) {
            this.reachedEnd = true;
            console.log('MageEnemy: No target waypoint, reached end');
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
    
    takeDamage(amount) {
        this.health -= amount;
    }
    
    isDead() {
        return this.health <= 0;
    }
    
    getMagicParticleColor() {
        const colors = ['rgba(100, 149, 237, ', 'rgba(65, 105, 225, ', 'rgba(72, 209, 204, '];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    render(ctx) {
        const baseSize = Math.max(6, Math.min(14, ctx.canvas.width / 150)) * this.sizeMultiplier;
        
        const walkCycle = Math.sin(this.animationTime * 8) * 0.5;
        const bobAnimation = Math.sin(this.animationTime * 8) * 0.3;
        
        const armSwingFreq = this.animationTime * 8;
        const leftArmBase = Math.sin(armSwingFreq) * 0.5;
        const rightArmBase = Math.sin(armSwingFreq + Math.PI) * 0.4;
        
        // Enemy shadow - taller mage
        ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + baseSize * 1.8, baseSize * 0.95, baseSize * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.save();
        ctx.translate(this.x, this.y + bobAnimation);
        
        // Back/depth layer - extended to feet
        ctx.fillStyle = this.darkenColor(this.robeColor, 0.35);
        ctx.fillRect(-baseSize * 0.75, -baseSize * 0.8, baseSize * 1.5, baseSize * 1.85);
        
        // Main robe/body - long flowing wizard robes extending to ground
        const robeGradient = ctx.createLinearGradient(-baseSize * 0.7, -baseSize * 0.85, baseSize * 0.7, baseSize * 1.0);
        robeGradient.addColorStop(0, '#2A5FD8');
        robeGradient.addColorStop(0.5, this.robeColor);
        robeGradient.addColorStop(1, this.darkenColor(this.robeColor, 0.2));
        
        ctx.fillStyle = robeGradient;
        ctx.beginPath();
        // Robes extending to ground level
        ctx.moveTo(-baseSize * 0.7, -baseSize * 0.3);
        ctx.lineTo(-baseSize * 0.9, baseSize * 1.0);
        ctx.lineTo(baseSize * 0.9, baseSize * 1.0);
        ctx.lineTo(baseSize * 0.7, -baseSize * 0.3);
        ctx.closePath();
        ctx.fill();
        
        // Robe outline
        ctx.strokeStyle = '#0F1F4F';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.7, -baseSize * 0.3);
        ctx.lineTo(-baseSize * 0.9, baseSize * 1.0);
        ctx.lineTo(baseSize * 0.9, baseSize * 1.0);
        ctx.lineTo(baseSize * 0.7, -baseSize * 0.3);
        ctx.closePath();
        ctx.stroke();
        
        // Robe seams and folds
        ctx.strokeStyle = this.darkenColor(this.robeColor, 0.15);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -baseSize * 0.3);
        ctx.lineTo(0, baseSize * 1.0);
        ctx.stroke();
        
        // Robe side folds - extending to ground
        ctx.strokeStyle = this.darkenColor(this.robeColor, 0.1);
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.35, -baseSize * 0.2);
        ctx.lineTo(-baseSize * 0.85, baseSize * 0.9);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(baseSize * 0.35, -baseSize * 0.2);
        ctx.lineTo(baseSize * 0.85, baseSize * 0.9);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Golden star pattern on robes - distributed along full length
        this.drawRobeStars(ctx, baseSize);
        
        // Torso highlight - magical aura
        const auraGradient = ctx.createLinearGradient(-baseSize * 0.3, -baseSize * 0.5, baseSize * 0.3, baseSize * 0.2);
        auraGradient.addColorStop(0, `rgba(70, 130, 255, ${0.15 * this.staffGlow})`);
        auraGradient.addColorStop(1, 'rgba(70, 130, 255, 0)');
        
        ctx.fillStyle = auraGradient;
        ctx.fillRect(-baseSize * 0.6, -baseSize * 0.6, baseSize * 1.2, baseSize * 0.8);
        
        // --- HEAD ---
        
        ctx.fillStyle = '#C4A575';
        ctx.beginPath();
        ctx.arc(baseSize * 0.06, -baseSize * 1.35, baseSize * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        const headGradient = ctx.createRadialGradient(-baseSize * 0.12, -baseSize * 1.48, baseSize * 0.25, 0, -baseSize * 1.38, baseSize * 0.7);
        headGradient.addColorStop(0, '#E8D4B8');
        headGradient.addColorStop(0.6, '#DDBEA9');
        headGradient.addColorStop(1, '#C9A876');
        
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.38, baseSize * 0.56, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#B8956A';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.38, baseSize * 0.56, 0, Math.PI * 2);
        ctx.stroke();
        
        // --- LARGE POINTY WIZARD HAT ---
        
        // Hat body - large tall cone with blue and gold star pattern
        const hatGradient = ctx.createLinearGradient(-baseSize * 0.8, -baseSize * 1.38, baseSize * 0.8, -baseSize * 2.5);
        hatGradient.addColorStop(0, '#2A5FD8');
        hatGradient.addColorStop(0.6, '#1A3A7A');
        hatGradient.addColorStop(1, '#0F1F4F');
        
        ctx.fillStyle = hatGradient;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.75, -baseSize * 1.38);
        ctx.lineTo(baseSize * 0.75, -baseSize * 1.38);
        ctx.lineTo(baseSize * 0.15, -baseSize * 2.55);
        ctx.closePath();
        ctx.fill();
        
        // Hat outline for definition
        ctx.strokeStyle = '#0F1F4F';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.75, -baseSize * 1.38);
        ctx.lineTo(baseSize * 0.15, -baseSize * 2.55);
        ctx.lineTo(baseSize * 0.75, -baseSize * 1.38);
        ctx.stroke();
        
        // Hat brim/trim - wide gold band with decorative edge
        ctx.fillStyle = '#D4AF37';
        ctx.fillRect(-baseSize * 0.8, -baseSize * 1.45, baseSize * 1.6, baseSize * 0.15);
        
        // Brim decorative edge
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.78, -baseSize * 1.45);
        ctx.lineTo(baseSize * 0.78, -baseSize * 1.45);
        ctx.stroke();
        
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.78, -baseSize * 1.32);
        ctx.lineTo(baseSize * 0.78, -baseSize * 1.32);
        ctx.stroke();
        
        // Golden stars on hat
        this.drawHatStars(ctx, baseSize);
        
        // Hat tip - glowing star orb
        const tipGlow = ctx.createRadialGradient(baseSize * 0.15, -baseSize * 2.58, 0, baseSize * 0.15, -baseSize * 2.58, baseSize * 0.35);
        tipGlow.addColorStop(0, `rgba(255, 215, 0, ${this.staffGlow})`);
        tipGlow.addColorStop(1, 'rgba(212, 175, 55, 0)');
        
        ctx.fillStyle = tipGlow;
        ctx.beginPath();
        ctx.arc(baseSize * 0.15, -baseSize * 2.58, baseSize * 0.35, 0, Math.PI * 2);
        ctx.fill();
        
        // Hat tip star - solid
        ctx.fillStyle = `rgba(255, 215, 0, ${this.staffGlow})`;
        ctx.font = `bold ${baseSize * 0.3}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', baseSize * 0.15, -baseSize * 2.58);
        
        // --- LEFT ARM WITH HAND ---
        
        const leftShoulderX = -baseSize * 0.55;
        const leftShoulderY = -baseSize * 0.3;
        
        const leftSwingForward = leftArmBase;
        const leftElbowX = leftShoulderX + Math.cos(leftSwingForward) * baseSize * 0.4;
        const leftElbowY = leftShoulderY + Math.sin(leftSwingForward) * baseSize * 0.35;
        
        const leftWristX = leftElbowX + Math.cos(leftSwingForward) * baseSize * 0.35;
        const leftWristY = leftElbowY + Math.sin(leftSwingForward) * baseSize * 0.35;
        
        // Left arm shadow
        ctx.strokeStyle = `rgba(0, 0, 0, ${0.12 + Math.max(0, leftSwingForward) * 0.12})`;
        ctx.lineWidth = baseSize * 0.32;
        ctx.beginPath();
        ctx.moveTo(leftShoulderX + 0.5, leftShoulderY + 0.5);
        ctx.lineTo(leftElbowX + 0.5, leftElbowY + 0.5);
        ctx.lineTo(leftWristX + 0.5, leftWristY + 0.5);
        ctx.stroke();
        
        // Left upper arm
        const leftUpperArmGradient = ctx.createLinearGradient(leftShoulderX, leftShoulderY, leftElbowX, leftElbowY);
        leftUpperArmGradient.addColorStop(0, '#E8D4B8');
        leftUpperArmGradient.addColorStop(1, `rgba(201, 168, 118, ${0.92})`);
        
        ctx.strokeStyle = leftUpperArmGradient;
        ctx.lineWidth = baseSize * 0.34;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(leftShoulderX, leftShoulderY);
        ctx.lineTo(leftElbowX, leftElbowY);
        ctx.stroke();
        
        // Left lower arm
        const leftLowerArmGradient = ctx.createLinearGradient(leftElbowX, leftElbowY, leftWristX, leftWristY);
        leftLowerArmGradient.addColorStop(0, `rgba(232, 212, 184, ${0.95})`);
        leftLowerArmGradient.addColorStop(1, '#C9A876');
        
        ctx.strokeStyle = leftLowerArmGradient;
        ctx.lineWidth = baseSize * 0.28;
        ctx.beginPath();
        ctx.moveTo(leftElbowX, leftElbowY);
        ctx.lineTo(leftWristX, leftWristY);
        ctx.stroke();
        
        // Left hand
        ctx.fillStyle = 'rgba(221, 190, 169, 0.92)';
        ctx.beginPath();
        ctx.arc(leftWristX, leftWristY, baseSize * 0.17, 0, Math.PI * 2);
        ctx.fill();
        
        // --- RIGHT ARM WITH SCEPTER ---
        
        const rightShoulderX = baseSize * 0.55;
        const rightShoulderY = -baseSize * 0.3;
        
        // Right arm with minimal angle for upright staff
        const rightArmAngle = Math.PI / 2 + 0.3; // More perpendicular to body
        const rightElbowX = rightShoulderX + Math.cos(rightArmAngle) * baseSize * 0.3;
        const rightElbowY = rightShoulderY + Math.sin(rightArmAngle) * baseSize * 0.25;
        
        const rightWristX = rightElbowX + Math.cos(rightArmAngle) * baseSize * 0.25;
        const rightWristY = rightElbowY + Math.sin(rightArmAngle) * baseSize * 0.25;
        
        // Right arm shadow
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = baseSize * 0.32;
        ctx.beginPath();
        ctx.moveTo(rightShoulderX + 0.5, rightShoulderY + 0.5);
        ctx.lineTo(rightElbowX + 0.5, rightElbowY + 0.5);
        ctx.lineTo(rightWristX + 0.5, rightWristY + 0.5);
        ctx.stroke();
        
        // Right upper arm
        const rightUpperArmGradient = ctx.createLinearGradient(rightShoulderX, rightShoulderY, rightElbowX, rightElbowY);
        rightUpperArmGradient.addColorStop(0, '#E8D4B8');
        rightUpperArmGradient.addColorStop(1, 'rgba(201, 168, 118, 0.94)');
        
        ctx.strokeStyle = rightUpperArmGradient;
        ctx.lineWidth = baseSize * 0.34;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(rightShoulderX, rightShoulderY);
        ctx.lineTo(rightElbowX, rightElbowY);
        ctx.stroke();
        
        // Right lower arm
        const rightLowerArmGradient = ctx.createLinearGradient(rightElbowX, rightElbowY, rightWristX, rightWristY);
        rightLowerArmGradient.addColorStop(0, 'rgba(232, 212, 184, 0.95)');
        rightLowerArmGradient.addColorStop(1, '#C9A876');
        
        ctx.strokeStyle = rightLowerArmGradient;
        ctx.lineWidth = baseSize * 0.28;
        ctx.beginPath();
        ctx.moveTo(rightElbowX, rightElbowY);
        ctx.lineTo(rightWristX, rightWristY);
        ctx.stroke();
        
        // Right hand
        ctx.fillStyle = 'rgba(221, 190, 169, 0.94)';
        ctx.beginPath();
        ctx.arc(rightWristX, rightWristY, baseSize * 0.17, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw scepter - truly vertical with adjusted length and position
        this.drawScepter(ctx, rightWristX, rightWristY, baseSize);
        
        // --- LEGS ---
        
        const leftHipX = -baseSize * 0.28;
        const leftHipY = baseSize * 0.38;
        
        const leftLegAngle = walkCycle * 0.3;
        const leftFootX = leftHipX + Math.sin(leftLegAngle) * baseSize * 0.75;
        const leftFootY = leftHipY + Math.cos(leftLegAngle) * baseSize * 0.85;
        
        // Left leg - robe drapes
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = baseSize * 0.27;
        ctx.beginPath();
        ctx.moveTo(leftHipX + 1, leftHipY + 1);
        ctx.lineTo(leftFootX + 1, leftFootY + 1);
        ctx.stroke();
        
        ctx.strokeStyle = this.darkenColor(this.robeColor, 0.15);
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
        
        // Right leg - robe drapes
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = baseSize * 0.27;
        ctx.beginPath();
        ctx.moveTo(rightHipX + 1, rightHipY + 1);
        ctx.lineTo(rightFootX + 1, rightFootY + 1);
        ctx.stroke();
        
        ctx.strokeStyle = this.darkenColor(this.robeColor, 0.15);
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
        
        // Render magic particles
        this.magicParticles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            ctx.fillStyle = particle.color + alpha + ')';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
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
    }
    
    drawRobeStars(ctx, baseSize) {
        // Golden star pattern on robes - distributed along full length
        ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.font = `bold ${baseSize * 0.12}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const starPositions = [
            // Upper robe area
            { x: -baseSize * 0.35, y: -baseSize * 0.1 },
            { x: baseSize * 0.35, y: -baseSize * 0.05 },
            // Middle robe area
            { x: -baseSize * 0.15, y: baseSize * 0.15 },
            { x: baseSize * 0.2, y: baseSize * 0.2 },
            { x: 0, y: baseSize * 0.35 },
            // Lower robe area - closer to ground
            { x: -baseSize * 0.4, y: baseSize * 0.6 },
            { x: baseSize * 0.4, y: baseSize * 0.65 },
            { x: -baseSize * 0.1, y: baseSize * 0.8 },
            { x: baseSize * 0.15, y: baseSize * 0.85 }
        ];
        
        starPositions.forEach(pos => {
            ctx.fillText('★', pos.x, pos.y);
        });
    }
    
    drawHatStars(ctx, baseSize) {
        // Golden stars scattered on hat
        ctx.fillStyle = 'rgba(255, 215, 0, 0.75)';
        ctx.font = `bold ${baseSize * 0.15}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const hatStarPositions = [
            { x: -baseSize * 0.4, y: -baseSize * 1.6 },
            { x: baseSize * 0.35, y: -baseSize * 1.7 },
            { x: 0, y: -baseSize * 2.0 },
            { x: -baseSize * 0.15, y: -baseSize * 1.85 },
            { x: baseSize * 0.5, y: -baseSize * 1.5 }
        ];
        
        hatStarPositions.forEach(pos => {
            ctx.fillText('★', pos.x, pos.y);
        });
    }
    
    drawScepter(ctx, handX, handY, baseSize) {
        ctx.save();
        ctx.translate(handX, handY);
        // No rotation - staff is perfectly vertical
        
        // Scepter shaft - shortened to have top at head height
        const shaftLength = baseSize * 2.0;
        const shaftWidth = baseSize * 0.18;
        
        const shaftGradient = ctx.createLinearGradient(0, 0, 0, shaftLength);
        shaftGradient.addColorStop(0, '#8B4513');
        shaftGradient.addColorStop(0.4, '#654321');
        shaftGradient.addColorStop(0.8, '#3E2723');
        shaftGradient.addColorStop(1, '#2C1810');
        
        ctx.fillStyle = shaftGradient;
        ctx.fillRect(-shaftWidth/2, 0, shaftWidth, shaftLength);
        
        // Shaft wood grain
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 1;
        for (let i = 1; i < 10; i++) {
            const grainY = (shaftLength * i / 10);
            ctx.beginPath();
            ctx.moveTo(-shaftWidth/2 + 2, grainY);
            ctx.lineTo(shaftWidth/2 - 2, grainY + baseSize * 0.08);
            ctx.stroke();
        }
        
        // Staff handle grip - wrapped leather, ornate
        // Position grip slightly below middle of shaft
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(-shaftWidth/2 - 2, shaftLength * 0.55, shaftWidth + 4, baseSize * 0.35);
        
        // Grip wrappings
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 5; i++) {
            const wrapY = shaftLength * 0.55 + (baseSize * 0.35 * i / 5);
            ctx.beginPath();
            ctx.moveTo(-shaftWidth/2 - 2, wrapY);
            ctx.lineTo(shaftWidth/2 + 2, wrapY);
            ctx.stroke();
        }
        
        // Metal ferrule (connection to crystal head) - ornate
        ctx.fillStyle = '#D4AF37';
        ctx.fillRect(-shaftWidth/2 - 3, -baseSize * 0.15, shaftWidth + 6, baseSize * 0.2);
        
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-shaftWidth/2 - 3, -baseSize * 0.15, shaftWidth + 6, baseSize * 0.2);
        
        // Decorative gold bands on shaft
        ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 4; i++) {
            const bandY = baseSize * 0.4 + (shaftLength - baseSize * 0.8) * (i / 3);
            ctx.fillRect(-shaftWidth/2 - 1, bandY, shaftWidth + 2, baseSize * 0.12);
            ctx.strokeStyle = '#8B7500';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(-shaftWidth/2 - 1, bandY, shaftWidth + 2, baseSize * 0.12);
        }
        
        // --- LARGE CRYSTAL ORB AT SCEPTER HEAD ---
        
        // Massive pulsing glow
        const crystalGlow = ctx.createRadialGradient(0, -baseSize * 0.3, 0, 0, -baseSize * 0.3, baseSize * 0.7);
        crystalGlow.addColorStop(0, `rgba(100, 149, 237, ${this.staffPulse * 0.9})`);
        crystalGlow.addColorStop(0.4, `rgba(70, 130, 255, ${this.staffPulse * 0.6})`);
        crystalGlow.addColorStop(1, 'rgba(30, 144, 255, 0)');
        
        ctx.fillStyle = crystalGlow;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 0.3, baseSize * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        // Secondary larger outer glow
        const outerGlow = ctx.createRadialGradient(0, -baseSize * 0.3, baseSize * 0.4, 0, -baseSize * 0.3, baseSize * 1.0);
        outerGlow.addColorStop(0, `rgba(72, 209, 204, ${this.staffGlow * 0.3})`);
        outerGlow.addColorStop(1, 'rgba(30, 144, 255, 0)');
        
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 0.3, baseSize * 1.0, 0, Math.PI * 2);
        ctx.fill();
        
        // Main crystal orb - large and prominent
        const mainCrystalGradient = ctx.createRadialGradient(-baseSize * 0.12, -baseSize * 0.42, 0, 0, -baseSize * 0.3, baseSize * 0.35);
        mainCrystalGradient.addColorStop(0, `rgba(176, 196, 222, ${this.staffPulse})`);
        mainCrystalGradient.addColorStop(0.5, `rgba(100, 149, 237, ${this.staffPulse * 0.9})`);
        mainCrystalGradient.addColorStop(1, `rgba(30, 144, 255, ${this.staffPulse * 0.5})`);
        
        ctx.fillStyle = mainCrystalGradient;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 0.3, baseSize * 0.32, 0, Math.PI * 2);
        ctx.fill();
        
        // Crystal highlight - bright spot
        ctx.fillStyle = `rgba(255, 255, 255, ${this.staffPulse * 0.8})`;
        ctx.beginPath();
        ctx.arc(-baseSize * 0.12, -baseSize * 0.48, baseSize * 0.12, 0, Math.PI * 2);
        ctx.fill();
        
        // Smaller orbiting energy crystals
        for (let i = 0; i < 4; i++) {
            const orbitAngle = (this.animationTime * 3) + (i / 4) * Math.PI * 2;
            const orbitX = Math.cos(orbitAngle) * baseSize * 0.5;
            const orbitY = -baseSize * 0.3 + Math.sin(orbitAngle) * baseSize * 0.5;
            
            // Orbit glow
            const orbitGlow = ctx.createRadialGradient(orbitX, orbitY, 0, orbitX, orbitY, baseSize * 0.18);
            orbitGlow.addColorStop(0, `rgba(100, 149, 237, ${this.staffPulse * 0.6})`);
            orbitGlow.addColorStop(1, 'rgba(72, 209, 204, 0)');
            
            ctx.fillStyle = orbitGlow;
            ctx.beginPath();
            ctx.arc(orbitX, orbitY, baseSize * 0.18, 0, Math.PI * 2);
            ctx.fill();
            
            // Orbit crystal - smaller
            const orbitCrystalGradient = ctx.createRadialGradient(orbitX - baseSize * 0.06, orbitY - baseSize * 0.06, 0, orbitX, orbitY, baseSize * 0.13);
            orbitCrystalGradient.addColorStop(0, `rgba(176, 196, 222, ${this.staffPulse})`);
            orbitCrystalGradient.addColorStop(1, `rgba(72, 209, 204, ${this.staffPulse * 0.5})`);
            
            ctx.fillStyle = orbitCrystalGradient;
            ctx.beginPath();
            ctx.arc(orbitX, orbitY, baseSize * 0.12, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Pulsing energy arcs between main crystal and orbiting crystals
        ctx.strokeStyle = `rgba(100, 149, 237, ${this.staffPulse * 0.5})`;
        ctx.lineWidth = baseSize * 0.1;
        for (let i = 0; i < 4; i++) {
            const orbitAngle = (this.animationTime * 3) + (i / 4) * Math.PI * 2;
            const orbitX = Math.cos(orbitAngle) * baseSize * 0.5;
            const orbitY = -baseSize * 0.3 + Math.sin(orbitAngle) * baseSize * 0.5;
            
            ctx.beginPath();
            ctx.moveTo(0, -baseSize * 0.3);
            ctx.quadraticCurveTo(orbitX * 0.6, orbitY * 0.6, orbitX, orbitY);
            ctx.stroke();
        }
        
        ctx.restore();
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
