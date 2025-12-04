export class FrogEnemy {
    constructor(path, health = 85, speed = 55) {
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
        this.skinColor = this.getRandomSkinColor();
        this.sizeMultiplier = 1.0;
        
        // Jump animation (visual only - position follows standard path logic)
        this.jumpAnimationTimer = 0;
        this.jumpAnimationDuration = 0.4;
        this.jumpHeight = 20;
        
        // Magic effects
        this.magicParticles = [];
        this.particleSpawnCounter = 0;
        
        // Attack properties
        this.attackDamage = 10;
        this.attackSpeed = 1.0;
        this.attackCooldown = 0;
        this.isAttackingCastle = false;
        
        console.log('FrogEnemy: Created at position', this.x, this.y, 'with wizard abilities');
    }
    
    getRandomSkinColor() {
        const skinColors = [
            '#2D5016', // Dark Green
            '#3D6B1F', // Forest Green
            '#4A7C3E', // Medium Green
            '#5A8C4E', // Light Green
            '#1F3E1F', // Deep Green
            '#6B9D54'  // Sage Green
        ];
        
        return skinColors[Math.floor(Math.random() * skinColors.length)];
    }
    
    calculateSegmentDistance(segmentIndex) {
        if (!this.path || segmentIndex >= this.path.length - 1) {
            return 0;
        }
        
        const currentPoint = this.path[segmentIndex];
        const nextPoint = this.path[segmentIndex + 1];
        const dx = nextPoint.x - currentPoint.x;
        const dy = nextPoint.y - currentPoint.y;
        return Math.hypot(dx, dy);
    }
    
    updatePath(newPath) {
        if (!newPath || newPath.length === 0) {
            console.warn('FrogEnemy: Received invalid path');
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
        
        // Recalculate segment distance for new path
        this.distanceAlongPath = 0;
        this.currentSegmentDistance = this.calculateSegmentDistance(this.currentPathIndex);
        
        console.log('FrogEnemy: Path updated, now at index', this.currentPathIndex, 'position', this.x, this.y);
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
        this.particleSpawnCounter += deltaTime;
        
        // Generate magic particles occasionally
        if (this.particleSpawnCounter > 0.15) {
            this.spawnMagicParticle();
            this.particleSpawnCounter = 0;
        }
        
        // Update magic particles
        this.magicParticles = this.magicParticles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            particle.size = Math.max(0, particle.size * (particle.life / particle.maxLife));
            return particle.life > 0;
        });
        
        // Update jump animation timer
        this.jumpAnimationTimer += deltaTime;
        if (this.jumpAnimationTimer >= this.jumpAnimationDuration) {
            this.jumpAnimationTimer = 0;
        }
        
        if (this.reachedEnd || !this.path || this.path.length === 0) return;
        
        if (this.currentPathIndex >= this.path.length - 1) {
            this.reachedEnd = true;
            console.log('FrogEnemy: Reached end of path');
            return;
        }
        
        const target = this.path[this.currentPathIndex + 1];
        if (!target) {
            this.reachedEnd = true;
            console.log('FrogEnemy: No target waypoint, reached end');
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
    
    advanceAlongPath() {
        // Move forward along the path based on distance traveled
        while (this.distanceAlongPath >= this.currentSegmentDistance && this.currentPathIndex < this.path.length - 1) {
            this.distanceAlongPath -= this.currentSegmentDistance;
            this.currentPathIndex++;
            
            if (this.currentPathIndex < this.path.length - 1) {
                this.currentSegmentDistance = this.calculateSegmentDistance(this.currentPathIndex);
            }
        }
    }
    
    startJump() {
        if (this.currentPathIndex >= this.path.length - 1) {
            return;
        }
        
        // Calculate position along path
        const currentPoint = this.path[this.currentPathIndex];
        const nextPoint = this.path[this.currentPathIndex + 1];
        
        const dx = nextPoint.x - currentPoint.x;
        const dy = nextPoint.y - currentPoint.y;
        const segmentDistance = Math.hypot(dx, dy);
        
        // Direction along path
        this.jumpDirection = Math.atan2(dy, dx);
        
        // Calculate remaining distance in current segment
        const remainingDistance = segmentDistance - this.distanceAlongPath;
        
        // Adaptive jump distance - reduce if approaching waypoint
        // Use 60% of remaining distance if less than full jump, otherwise use full jump
        const adaptiveJumpDistance = Math.min(this.jumpDistance, Math.max(remainingDistance * 0.6, this.jumpDistance * 0.5));
        
        // Calculate jump end position
        this.jumpStartX = this.x;
        this.jumpStartY = this.y;
        
        const jumpX = adaptiveJumpDistance * Math.cos(this.jumpDirection);
        const jumpY = adaptiveJumpDistance * Math.sin(this.jumpDirection);
        
        this.jumpEndX = this.jumpStartX + jumpX;
        this.jumpEndY = this.jumpStartY + jumpY;
        
        this.isJumping = true;
        this.jumpTimer = 0;
    }
    
    spawnMagicParticle() {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 15 + 5;
        this.magicParticles.push({
            x: this.x + Math.cos(angle) * radius,
            y: this.y + Math.sin(angle) * radius - 10,
            vx: (Math.random() - 0.5) * 40,
            vy: -Math.random() * 50 - 20,
            life: 1.2,
            maxLife: 1.2,
            size: Math.random() * 2.5 + 1.5,
            color: this.getMagicParticleColor()
        });
    }
    
    getMagicParticleColor() {
        const colors = ['rgba(100, 200, 255, ', 'rgba(150, 255, 100, ', 'rgba(255, 200, 100, '];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    takeDamage(amount) {
        this.health -= amount;
    }
    
    isDead() {
        return this.health <= 0;
    }
    
    render(ctx) {
        const baseSize = Math.max(6, Math.min(14, ctx.canvas.width / 150)) * this.sizeMultiplier;
        
        // Enemy shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + baseSize * 1.5, baseSize * 0.85, baseSize * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.save();
        
        // Calculate jump arc for visual effect only
        const jumpProgress = this.jumpAnimationTimer / this.jumpAnimationDuration;
        const jumpArc = 4 * this.jumpHeight * jumpProgress * (1 - jumpProgress);
        
        ctx.translate(this.x, this.y - jumpArc);
        
        // --- FROG BODY ---
        
        // Back legs (lower) - more prominent and frog-like
        this.drawFrogBackLeg(ctx, -baseSize * 0.4, baseSize * 0.4, baseSize, false);
        this.drawFrogBackLeg(ctx, baseSize * 0.4, baseSize * 0.4, baseSize, true);
        
        // Main body (rounded, more compact)
        const bodyGradient = ctx.createRadialGradient(-baseSize * 0.12, -baseSize * 0.1, baseSize * 0.15, 0, 0, baseSize * 0.5);
        bodyGradient.addColorStop(0, this.lightenColor(this.skinColor, 0.2));
        bodyGradient.addColorStop(0.6, this.skinColor);
        bodyGradient.addColorStop(1, this.darkenColor(this.skinColor, 0.25));
        
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.08, baseSize * 0.5, baseSize * 0.58, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = this.darkenColor(this.skinColor, 0.35);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.08, baseSize * 0.5, baseSize * 0.58, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Belly (lighter color)
        ctx.fillStyle = this.lightenColor(this.skinColor, 0.4);
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.15, baseSize * 0.38, baseSize * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Front legs (upper)
        this.drawFrogFrontLeg(ctx, -baseSize * 0.28, -baseSize * 0.12, baseSize, false);
        this.drawFrogFrontLeg(ctx, baseSize * 0.28, -baseSize * 0.12, baseSize, true);
        
        // --- HEAD ---
        
        // Head base - more frog-like, wider
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.42, baseSize * 0.5, baseSize * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = this.darkenColor(this.skinColor, 0.35);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.42, baseSize * 0.5, baseSize * 0.42, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // --- EYES (LARGE BULGING, FROG-LIKE) ---
        
        // Left eye socket
        ctx.fillStyle = this.darkenColor(this.skinColor, 0.15);
        ctx.beginPath();
        ctx.arc(-baseSize * 0.22, -baseSize * 0.58, baseSize * 0.18, 0, Math.PI * 2);
        ctx.fill();
        
        // Left eye white
        ctx.fillStyle = '#FFFACD';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.22, -baseSize * 0.58, baseSize * 0.14, 0, Math.PI * 2);
        ctx.fill();
        
        // Left iris
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.22, -baseSize * 0.56, baseSize * 0.09, 0, Math.PI * 2);
        ctx.fill();
        
        // Left pupil and shine
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.18, -baseSize * 0.59, baseSize * 0.06, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.16, -baseSize * 0.62, baseSize * 0.025, 0, Math.PI * 2);
        ctx.fill();
        
        // Right eye socket
        ctx.fillStyle = this.darkenColor(this.skinColor, 0.15);
        ctx.beginPath();
        ctx.arc(baseSize * 0.22, -baseSize * 0.58, baseSize * 0.18, 0, Math.PI * 2);
        ctx.fill();
        
        // Right eye white
        ctx.fillStyle = '#FFFACD';
        ctx.beginPath();
        ctx.arc(baseSize * 0.22, -baseSize * 0.58, baseSize * 0.14, 0, Math.PI * 2);
        ctx.fill();
        
        // Right iris
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(baseSize * 0.22, -baseSize * 0.56, baseSize * 0.09, 0, Math.PI * 2);
        ctx.fill();
        
        // Right pupil and shine
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(baseSize * 0.18, -baseSize * 0.59, baseSize * 0.06, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(baseSize * 0.16, -baseSize * 0.62, baseSize * 0.025, 0, Math.PI * 2);
        ctx.fill();
        
        // --- MOUTH ---
        
        // Wide frog mouth
        ctx.strokeStyle = this.darkenColor(this.skinColor, 0.4);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 0.25, baseSize * 0.22, 0, Math.PI);
        ctx.stroke();
        
        // Mouth line detail
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.2, -baseSize * 0.25);
        ctx.lineTo(baseSize * 0.2, -baseSize * 0.25);
        ctx.stroke();
        
        // Nostril details
        ctx.fillStyle = this.darkenColor(this.skinColor, 0.3);
        ctx.beginPath();
        ctx.arc(-baseSize * 0.1, -baseSize * 0.48, baseSize * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(baseSize * 0.1, -baseSize * 0.48, baseSize * 0.05, 0, Math.PI * 2);
        ctx.fill();
        
        // --- WIZARD HAT ---
        
        this.drawWizardHat(ctx, baseSize);
        
        // --- RENDER MAGIC PARTICLES ---
        
        this.magicParticles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            ctx.fillStyle = particle.color + alpha + ')';
            ctx.beginPath();
            ctx.arc(particle.x - this.x, particle.y - this.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
        
        // Health bar
        const barWidth = baseSize * 2.8;
        const barHeight = Math.max(2, baseSize * 0.38);
        const barY = this.y - baseSize * 2.1;
        
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - barWidth/2, barY, barWidth, barHeight);
        
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : (healthPercent > 0.25 ? '#FFC107' : '#F44336');
        ctx.fillRect(this.x - barWidth/2, barY, barWidth * healthPercent, barHeight);
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - barWidth/2, barY, barWidth, barHeight);
    }
    
    drawFrogBackLeg(ctx, hipX, hipY, baseSize, isRight) {
        // Back leg - powerful folded jumping position
        const thighLength = baseSize * 0.42;
        const legLength = baseSize * 0.48;
        
        // Thigh (upper part, thick and muscular)
        const thighAngle = isRight ? -Math.PI / 2.8 : -Math.PI + Math.PI / 2.8;
        const kneeX = hipX + Math.cos(thighAngle) * thighLength;
        const kneeY = hipY + Math.sin(thighAngle) * thighLength;
        
        // Calf/foot (lower part, folded)
        const calfAngle = thighAngle + (isRight ? -0.4 : 0.4);
        const footX = kneeX + Math.cos(calfAngle) * legLength;
        const footY = kneeY + Math.sin(calfAngle) * legLength;
        
        // Shadow for depth
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = baseSize * 0.2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(hipX + 1, hipY + 1);
        ctx.lineTo(kneeX + 1, kneeY + 1);
        ctx.lineTo(footX + 1, footY + 1);
        ctx.stroke();
        
        // Draw leg - thicker for muscular appearance
        ctx.strokeStyle = this.darkenColor(this.skinColor, 0.05);
        ctx.lineWidth = baseSize * 0.2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(kneeX, kneeY);
        ctx.lineTo(footX, footY);
        ctx.stroke();
        
        // Foot pads - webbed appearance
        ctx.fillStyle = this.lightenColor(this.skinColor, 0.15);
        ctx.beginPath();
        ctx.ellipse(footX, footY, baseSize * 0.16, baseSize * 0.18, calfAngle, 0, Math.PI * 2);
        ctx.fill();
        
        // Toe details - webbing
        ctx.strokeStyle = this.darkenColor(this.skinColor, 0.2);
        ctx.lineWidth = 0.8;
        for (let i = -1; i <= 1; i++) {
            const toeAngle = calfAngle + (i * 0.3);
            const toeX = footX + Math.cos(toeAngle) * baseSize * 0.1;
            const toeY = footY + Math.sin(toeAngle) * baseSize * 0.12;
            ctx.beginPath();
            ctx.moveTo(footX, footY);
            ctx.lineTo(toeX, toeY);
            ctx.stroke();
        }
    }
    
    drawFrogFrontLeg(ctx, hipX, hipY, baseSize, isRight) {
        // Front leg - shorter, more relaxed
        const upperLegLength = baseSize * 0.22;
        const lowerLegLength = baseSize * 0.24;
        
        // Upper leg angle (slightly out and forward)
        const upperAngle = isRight ? Math.PI / 5 : 4 * Math.PI / 5;
        const elbowX = hipX + Math.cos(upperAngle) * upperLegLength;
        const elbowY = hipY + Math.sin(upperAngle) * upperLegLength;
        
        // Lower leg angle (pointing forward/down)
        const lowerAngle = Math.PI / 2.2 + (isRight ? 0.15 : -0.15);
        const handX = elbowX + Math.cos(lowerAngle) * lowerLegLength;
        const handY = elbowY + Math.sin(lowerAngle) * lowerLegLength;
        
        // Shadow for depth
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.lineWidth = baseSize * 0.15;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(hipX + 0.8, hipY + 0.8);
        ctx.lineTo(elbowX + 0.8, elbowY + 0.8);
        ctx.lineTo(handX + 0.8, handY + 0.8);
        ctx.stroke();
        
        // Draw leg
        ctx.strokeStyle = this.darkenColor(this.skinColor, 0.05);
        ctx.lineWidth = baseSize * 0.15;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(elbowX, elbowY);
        ctx.lineTo(handX, handY);
        ctx.stroke();
        
        // Hand pads
        ctx.fillStyle = this.lightenColor(this.skinColor, 0.15);
        ctx.beginPath();
        ctx.ellipse(handX, handY, baseSize * 0.11, baseSize * 0.13, lowerAngle, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawWizardHat(ctx, baseSize) {
        // Hat body - large pointy cone
        const hatGradient = ctx.createLinearGradient(-baseSize * 0.35, -baseSize * 0.8, baseSize * 0.35, -baseSize * 1.5);
        hatGradient.addColorStop(0, '#2A5FD8');
        hatGradient.addColorStop(0.6, '#1A3A7A');
        hatGradient.addColorStop(1, '#0F1F4F');
        
        ctx.fillStyle = hatGradient;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.32, -baseSize * 0.72);
        ctx.lineTo(baseSize * 0.32, -baseSize * 0.72);
        ctx.lineTo(baseSize * 0.08, -baseSize * 1.42);
        ctx.closePath();
        ctx.fill();
        
        // Hat outline
        ctx.strokeStyle = '#0F1F4F';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.32, -baseSize * 0.72);
        ctx.lineTo(baseSize * 0.08, -baseSize * 1.42);
        ctx.lineTo(baseSize * 0.32, -baseSize * 0.72);
        ctx.stroke();
        
        // Hat brim - gold band
        ctx.fillStyle = '#D4AF37';
        ctx.fillRect(-baseSize * 0.35, -baseSize * 0.78, baseSize * 0.7, baseSize * 0.12);
        
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.35, -baseSize * 0.78);
        ctx.lineTo(baseSize * 0.35, -baseSize * 0.78);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.35, -baseSize * 0.66);
        ctx.lineTo(baseSize * 0.35, -baseSize * 0.66);
        ctx.stroke();
        
        // Hat tip - glowing star
        const tipGlow = ctx.createRadialGradient(baseSize * 0.08, -baseSize * 1.44, 0, baseSize * 0.08, -baseSize * 1.44, baseSize * 0.2);
        tipGlow.addColorStop(0, 'rgba(255, 215, 0, 0.7)');
        tipGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
        
        ctx.fillStyle = tipGlow;
        ctx.beginPath();
        ctx.arc(baseSize * 0.08, -baseSize * 1.44, baseSize * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Star at tip
        ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.font = `bold ${baseSize * 0.2}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', baseSize * 0.08, -baseSize * 1.44);
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
