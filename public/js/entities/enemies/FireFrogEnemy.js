import { BaseEnemy } from './BaseEnemy.js';

export class FireFrogEnemy extends BaseEnemy {
    // Static color cache to avoid recalculation
    static colorCache = new Map();

    static BASE_STATS = {
        health: 340,
        speed: 25,
        armour: 2,
        magicResistance: 0.5
    };
    
    constructor(path, health_multiplier = 1.0, speed = null, armour = null, magicResistance = null) {
        const baseStats = FireFrogEnemy.BASE_STATS;
        const actualSpeed = speed !== null ? speed : baseStats.speed;
        const actualArmour = armour !== null ? armour : baseStats.armour;
        const actualMagicResistance = magicResistance !== null ? magicResistance : baseStats.magicResistance;
        
        super(path, baseStats.health * health_multiplier, actualSpeed, actualArmour, actualMagicResistance);
        this.skinColor = '#E74C3C'; // Fire red
        this.elementalType = 'fire';
        this.vulnerableTo = 'water'; // Only takes water damage
        this.sizeMultiplier = 3.2; // 80% of 4x bigger
        
        this.attackDamage = 10;
        this.attackSpeed = 1.0;
        
        this.magicParticles = [];
        this.particleSpawnCounter = 0;
        this.jumpAnimationTimer = 0;
        this.jumpAnimationDuration = 0.8; // Longer jump airtime
        this.jumpHeight = 40; // Higher jump
        this.jumpCycleTimer = 0;
        this.jumpCycleDuration = 2.0; // Total time between jumps including rest
        
        // Leg animation for natural movement
        this.legAnimationTimer = 0;
        
        // Cache for color variations to avoid recalculation
        this.cachedLightenColor = null;
        this.cachedDarkenColor = null;
        this.cachedDarken2Color = null;
        
    }
    
    update(deltaTime) {
        // DO NOT call super.update() - we handle movement ourselves with jump mechanics
        
        // Update base animations and cooldowns
        this.animationTime += deltaTime;
        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
        
        // Particle effects
        this.particleSpawnCounter += deltaTime;
        if (this.particleSpawnCounter > 0.3) {
            this.spawnMagicParticle();
            this.particleSpawnCounter = 0;
        }
        
        // Update magic particles
        let i = this.magicParticles.length;
        while (i--) {
            const particle = this.magicParticles[i];
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            particle.size = Math.max(0, particle.size * (particle.life / particle.maxLife));
            if (particle.life <= 0) {
                this.magicParticles.splice(i, 1);
            }
        }
        
        // Update jump cycle timer for animation and movement synchronization
        this.jumpCycleTimer += deltaTime;
        if (this.jumpCycleTimer >= this.jumpCycleDuration) {
            this.jumpCycleTimer = 0;
        }
        
        // Jump animation tracks the arc (0 to jumpAnimationDuration)
        if (this.jumpCycleTimer < this.jumpAnimationDuration) {
            this.jumpAnimationTimer = this.jumpCycleTimer;
        } else {
            this.jumpAnimationTimer = this.jumpAnimationDuration;
        }
        
        // Check if reached end
        if (this.reachedEnd || !this.path || this.path.length === 0) return;
        
        if (this.currentPathIndex >= this.path.length - 1) {
            this.reachedEnd = true;
            this.isAttackingCastle = true;
            return;
        }
        
        const target = this.path[this.currentPathIndex + 1];
        if (!target) {
            this.reachedEnd = true;
            this.isAttackingCastle = true;
            return;
        }
        
        // Check if reached waypoint
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
        
        // JUMP-BASED MOVEMENT: Only move during jump phase
        if (this.jumpCycleTimer < this.jumpAnimationDuration) {
            const moveDistance = this.speed * deltaTime;
            this.x += (dx / distance) * moveDistance;
            this.y += (dy / distance) * moveDistance;
        }
        // Rest phase: frog stays still on current spot
    }
    
    takeDamage(amount, armorPiercingPercent = 0, damageType = 'physical', followTarget = false) {
        // Only take damage if it's water damage
        if (damageType !== 'water') {
            return; // Immune to all other damage types
        }
        super.takeDamage(amount, armorPiercingPercent, damageType, followTarget);
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
        // Limit total particles per frog to prevent memory bloat
        if (this.magicParticles.length >= 8) return;
        
        this.magicParticles.push({
            x: this.x + Math.cos(angle) * radius,
            y: this.y + Math.sin(angle) * radius - 10,
            vx: (Math.random() - 0.5) * 40,
            vy: -Math.random() * 50 - 20,
            life: 1.2,
            maxLife: 1.2,
            size: Math.random() * 2.5 + 1.5,
            colorIndex: Math.floor(Math.random() * 3)
        });
    }
    
    getMagicParticleColor() {
        // Return color index instead of building string - avoids string concatenation
        const colors = [0, 1, 2];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // Static method for getting cached color variations
    static getCachedColor(baseColor, type) {
        const key = `${baseColor}_${type}`;
        if (!FireFrogEnemy.colorCache.has(key)) {
            let color;
            if (type === 'lighten') {
                color = FireFrogEnemy.lightenColorStatic(baseColor, 0.2);
            } else if (type === 'lighten_body') {
                color = FireFrogEnemy.lightenColorStatic(baseColor, 0.4);
            } else if (type === 'darken') {
                color = FireFrogEnemy.darkenColorStatic(baseColor, 0.25);
            } else if (type === 'darken_body') {
                color = FireFrogEnemy.darkenColorStatic(baseColor, 0.35);
            } else if (type === 'darken_leg') {
                color = FireFrogEnemy.darkenColorStatic(baseColor, 0.05);
            } else if (type === 'darken_detail') {
                color = FireFrogEnemy.darkenColorStatic(baseColor, 0.3);
            } else if (type === 'darken_mouth') {
                color = FireFrogEnemy.darkenColorStatic(baseColor, 0.4);
            } else if (type === 'darken_eye') {
                color = FireFrogEnemy.darkenColorStatic(baseColor, 0.15);
            } else if (type === 'lighten_foot') {
                color = FireFrogEnemy.lightenColorStatic(baseColor, 0.15);
            }
            FireFrogEnemy.colorCache.set(key, color);
        }
        return FireFrogEnemy.colorCache.get(key);
    }
    
    // Static version of color manipulation to use caching
    static lightenColorStatic(color, factor) {
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
    
    static darkenColorStatic(color, factor) {
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
    
    isDead() {
        return this.health <= 0;
    }
    
    render(ctx) {
        const baseSize = Math.max(6, Math.min(14, ctx.canvas.width / 150)) * this.sizeMultiplier;
        
        // Enemy shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + baseSize * 0.4, baseSize * 0.85, baseSize * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.save();
        
        // Calculate jump arc for visual effect only
        const jumpProgress = this.jumpAnimationTimer / this.jumpAnimationDuration;
        const jumpArc = 4 * this.jumpHeight * jumpProgress * (1 - jumpProgress);
        
        ctx.translate(this.x, this.y - jumpArc);
        
        // Cache colors for this render
        if (!this.cachedLightenColor) {
            this.cachedLightenColor = FireFrogEnemy.getCachedColor(this.skinColor, 'lighten');
            this.cachedDarkenColor = FireFrogEnemy.getCachedColor(this.skinColor, 'darken');
            this.cachedDarken2Color = FireFrogEnemy.getCachedColor(this.skinColor, 'darken_body');
        }
        
        // --- BACK LEGS (DRAW FIRST) ---
        this.drawBattleLeg(ctx, -baseSize * 0.3, baseSize * 0.32, baseSize, false, true);
        this.drawBattleLeg(ctx, baseSize * 0.3, baseSize * 0.32, baseSize, true, true);
        
        // --- LOWER ROBE/BODY ---
        // Robe skirt (smaller, less bulbous)
        ctx.fillStyle = '#4a2020';
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.22, baseSize * 0.45, baseSize * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Robe outline
        ctx.strokeStyle = '#2a1010';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.22, baseSize * 0.45, baseSize * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Robe detail lines (vertical folds)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        for (let i = -2; i <= 2; i++) {
            const x = i * baseSize * 0.12;
            ctx.beginPath();
            ctx.moveTo(x, baseSize * 0.05);
            ctx.quadraticCurveTo(x + baseSize * 0.06, baseSize * 0.18, x + baseSize * 0.04, baseSize * 0.45);
            ctx.stroke();
        }
        
        // --- MAIN BODY/CHEST ---
        const bodyGrad = ctx.createLinearGradient(-baseSize * 0.4, -baseSize * 0.1, baseSize * 0.4, baseSize * 0.2);
        bodyGrad.addColorStop(0, '#6a3030');
        bodyGrad.addColorStop(0.5, '#4a2020');
        bodyGrad.addColorStop(1, '#2a1010');
        
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.05, baseSize * 0.52, baseSize * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#2a1010';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.05, baseSize * 0.52, baseSize * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Chest plate (armor - fire colored)
        ctx.fillStyle = '#c84a2a';
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.08, baseSize * 0.38, baseSize * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#8a2a0a';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.08, baseSize * 0.38, baseSize * 0.32, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Armor shine/highlight
        ctx.fillStyle = 'rgba(255, 200, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(-baseSize * 0.1, -baseSize * 0.05, baseSize * 0.15, baseSize * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // --- FRONT ARMS/HANDS ---
        this.drawBattleArm(ctx, -baseSize * 0.3, baseSize * 0.05, baseSize, false);
        this.drawBattleArm(ctx, baseSize * 0.3, baseSize * 0.05, baseSize, true);
        
        // --- HEAD ---
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.45, baseSize * 0.48, baseSize * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = this.cachedDarken2Color;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.45, baseSize * 0.48, baseSize * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Head markings/spots
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.15, -baseSize * 0.65, baseSize * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(baseSize * 0.15, -baseSize * 0.65, baseSize * 0.12, 0, Math.PI * 2);
        ctx.fill();
        
        // --- EYES ---
        // Left eye
        ctx.fillStyle = '#2a1010';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.2, -baseSize * 0.6, baseSize * 0.17, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFACD';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.2, -baseSize * 0.6, baseSize * 0.12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.2, -baseSize * 0.58, baseSize * 0.08, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.16, -baseSize * 0.61, baseSize * 0.05, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye shine - fiery
        ctx.fillStyle = 'rgba(255, 100, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.14, -baseSize * 0.64, baseSize * 0.03, 0, Math.PI * 2);
        ctx.fill();
        
        // Right eye
        ctx.fillStyle = '#2a1010';
        ctx.beginPath();
        ctx.arc(baseSize * 0.2, -baseSize * 0.6, baseSize * 0.17, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFACD';
        ctx.beginPath();
        ctx.arc(baseSize * 0.2, -baseSize * 0.6, baseSize * 0.12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.arc(baseSize * 0.2, -baseSize * 0.58, baseSize * 0.08, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(baseSize * 0.16, -baseSize * 0.61, baseSize * 0.05, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 100, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(baseSize * 0.14, -baseSize * 0.64, baseSize * 0.03, 0, Math.PI * 2);
        ctx.fill();
        
        // --- MOUTH ---
        ctx.strokeStyle = this.cachedDarken2Color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 0.28, baseSize * 0.2, 0, Math.PI);
        ctx.stroke();
        
        // Mouth expression
        ctx.fillStyle = 'rgba(255, 100, 100, 0.3)';
        ctx.beginPath();
        ctx.arc(0, -baseSize * 0.28, baseSize * 0.2, 0, Math.PI);
        ctx.fill();
        
        // --- WIZARD HAT (ENHANCED) ---
        this.drawBattleMageHat(ctx, baseSize);
        
        // --- RENDER MAGIC PARTICLES (FIRE) ---
        
        const particleColors = [
            'rgba(200, 74, 42, ',
            'rgba(255, 140, 0, ',
            'rgba(255, 200, 100, '
        ];
        
        for (let i = 0; i < this.magicParticles.length; i++) {
            const particle = this.magicParticles[i];
            const alpha = particle.life / particle.maxLife;
            ctx.fillStyle = particleColors[particle.colorIndex] + alpha + ')';
            ctx.beginPath();
            ctx.arc(particle.x - this.x, particle.y - this.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
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
        
        // Render hit splatters
        for (let i = 0; i < this.hitSplatters.length; i++) {
            this.hitSplatters[i].render(ctx);
        }
    }
    
    drawBattleLeg(ctx, hipX, hipY, baseSize, isRight, isBackLeg) {
        const side = isRight ? 1 : -1;
        const jumpPhase = Math.min(1, this.jumpCycleTimer / this.jumpAnimationDuration);
        
        // Reverse compression: start extended, compress when jumping, extend after
        let compression = 0;
        if (jumpPhase < 0.5) {
            compression = jumpPhase * 2 * -1; // 0 to -1 (normal to extended downward)
        } else {
            compression = (1 - jumpPhase) * 2 * -1; // -1 to 0 (extended to normal)
        }
        
        if (isBackLeg) {
            // Back legs - shorter, more proportional
            const thighLength = baseSize * 0.28;
            const calfLength = baseSize * 0.32;
            
            const baseThighAngle = side > 0 ? Math.PI / 2.2 : Math.PI - Math.PI / 2.2;
            const thighBend = compression * 0.4;
            const thighAngle = baseThighAngle - thighBend * side;
            
            const kneeX = hipX + Math.cos(thighAngle) * thighLength;
            const kneeY = hipY + Math.sin(thighAngle) * thighLength;
            
            const calfBend = compression * 0.5;
            const calfAngle = thighAngle - calfBend * side;
            
            const footX = kneeX + Math.cos(calfAngle) * calfLength;
            const footY = kneeY + Math.sin(calfAngle) * calfLength;
            
            // Draw shadow (offset to keep within path bounds)
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
            ctx.lineWidth = baseSize * 0.12;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(hipX, hipY);
            ctx.lineTo(kneeX, kneeY);
            ctx.lineTo(Math.min(footX, kneeX + baseSize * 0.15), Math.min(footY, hipY + baseSize * 0.35));
            ctx.stroke();
            
            // Draw leg segments
            ctx.strokeStyle = FireFrogEnemy.getCachedColor(this.skinColor, 'darken_leg');
            ctx.lineWidth = baseSize * 0.12;
            ctx.beginPath();
            ctx.moveTo(hipX, hipY);
            ctx.lineTo(kneeX, kneeY);
            ctx.lineTo(footX, footY);
            ctx.stroke();
            
            // Draw foot pad with frog toes
            ctx.fillStyle = '#E8A76a';
            ctx.beginPath();
            ctx.ellipse(footX, footY, baseSize * 0.14, baseSize * 0.16, calfAngle + 0.1 * side, 0, Math.PI * 2);
            ctx.fill();
            
            // Toe details - frog webbed toes
            ctx.strokeStyle = '#8a3a1a';
            ctx.lineWidth = 0.8;
            for (let t = -1; t <= 1; t++) {
                const toeAngle = calfAngle + (t * 0.25);
                const toeX = footX + Math.cos(toeAngle) * baseSize * 0.08;
                const toeY = footY + Math.sin(toeAngle) * baseSize * 0.1;
                ctx.beginPath();
                ctx.moveTo(footX, footY);
                ctx.lineTo(toeX, toeY);
                ctx.stroke();
                // Toe tip
                ctx.fillStyle = '#8a3a1a';
                ctx.beginPath();
                ctx.arc(toeX, toeY, baseSize * 0.04, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    drawBattleArm(ctx, shoulderX, shoulderY, baseSize, isRight) {
        const side = isRight ? 1 : -1;
        const jumpPhase = Math.min(1, this.jumpCycleTimer / this.jumpAnimationDuration);
        
        // Front legs: lift during jump, move downward during stance
        let legLift = 0;
        if (jumpPhase < 0.6) {
            legLift = jumpPhase / 0.6; // Lift up to peak
        } else {
            legLift = (1 - jumpPhase) / 0.4; // Release down
        }
        
const upperLength = baseSize * 0.035;
            const lowerLength = baseSize * 0.035;
        
        const baseUpperAngle = side > 0 ? -Math.PI / 4 : -Math.PI + Math.PI / 4;
        const upperAngle = baseUpperAngle + legLift * 0.25 * side; // Spread outward during jump
        
        const elbowX = shoulderX + Math.cos(upperAngle) * upperLength;
        const elbowY = shoulderY + Math.sin(upperAngle) * upperLength + legLift * baseSize * 0.08;
        
        const baseLowerAngle = Math.PI / 2 + (side > 0 ? 0.2 : -0.2);
        const lowerAngle = baseLowerAngle + legLift * 0.15 * side;
        
        const handX = elbowX + Math.cos(lowerAngle) * lowerLength;
        const handY = elbowY + Math.sin(lowerAngle) * lowerLength;
        
        // Draw shadow
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.lineWidth = baseSize * 0.12;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(elbowX, elbowY);
        ctx.lineTo(handX, handY);
        ctx.stroke();
        
        // Draw front legs
        ctx.strokeStyle = '#8a3a1a';
        ctx.lineWidth = baseSize * 0.12;
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(elbowX, elbowY);
        ctx.lineTo(handX, handY);
        ctx.stroke();
        
        // Front foot pads with frog toes
        ctx.fillStyle = '#E8A76a';
        ctx.beginPath();
        ctx.ellipse(handX, handY, baseSize * 0.1, baseSize * 0.12, lowerAngle, 0, Math.PI * 2);
        ctx.fill();
        
        // Front toe details
        ctx.strokeStyle = '#8a3a1a';
        ctx.lineWidth = 0.7;
        for (let t = -1; t <= 1; t++) {
            const toeAngle = lowerAngle + (t * 0.2);
            const toeX = handX + Math.cos(toeAngle) * baseSize * 0.06;
            const toeY = handY + Math.sin(toeAngle) * baseSize * 0.08;
            ctx.beginPath();
            ctx.moveTo(handX, handY);
            ctx.lineTo(toeX, toeY);
            ctx.stroke();
            // Toe tip
            ctx.fillStyle = '#8a3a1a';
            ctx.beginPath();
            ctx.arc(toeX, toeY, baseSize * 0.03, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawBattleMageHat(ctx, baseSize) {
        // Hat cone body - Fire colored
        const hatGradient = ctx.createLinearGradient(-baseSize * 0.35, -baseSize * 0.8, baseSize * 0.35, -baseSize * 1.6);
        hatGradient.addColorStop(0, '#ff6600');
        hatGradient.addColorStop(0.5, '#cc4400');
        hatGradient.addColorStop(1, '#8a2800');
        
        ctx.fillStyle = hatGradient;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.33, -baseSize * 0.75);
        ctx.lineTo(baseSize * 0.33, -baseSize * 0.75);
        ctx.lineTo(baseSize * 0.1, -baseSize * 1.6);
        ctx.closePath();
        ctx.fill();
        
        // Hat outline
        ctx.strokeStyle = '#662200';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.33, -baseSize * 0.75);
        ctx.lineTo(baseSize * 0.1, -baseSize * 1.6);
        ctx.lineTo(baseSize * 0.33, -baseSize * 0.75);
        ctx.stroke();
        
        // Hat brim
        ctx.fillStyle = '#4a2020';
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.78, baseSize * 0.4, baseSize * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#2a1010';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.78, baseSize * 0.4, baseSize * 0.12, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Magic flames on hat
        ctx.fillStyle = '#FFD700';
        const starSize = baseSize * 0.12;
        for (let i = 0; i < 3; i++) {
            const angle = (i * Math.PI * 2 / 3) - Math.PI / 2;
            const x = Math.cos(angle) * baseSize * 0.18;
            const y = -baseSize * 0.5 + Math.sin(angle) * baseSize * 0.1;
            ctx.font = `bold ${starSize}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✦', x, y);
        }
        
        // Glowing tip (red/orange)
        const tipGlow = ctx.createRadialGradient(baseSize * 0.1, -baseSize * 1.58, 0, baseSize * 0.1, -baseSize * 1.58, baseSize * 0.25);
        tipGlow.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
        tipGlow.addColorStop(0.5, 'rgba(255, 100, 0, 0.3)');
        tipGlow.addColorStop(1, 'rgba(255, 100, 0, 0)');
        
        ctx.fillStyle = tipGlow;
        ctx.beginPath();
        ctx.arc(baseSize * 0.1, -baseSize * 1.58, baseSize * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        // Tip spark (fire)
        ctx.fillStyle = '#FF6600';
        ctx.beginPath();
        ctx.arc(baseSize * 0.1, -baseSize * 1.6, baseSize * 0.05, 0, Math.PI * 2);
        ctx.fill();
    }
    
    lightenColor(color, factor) {
        return FireFrogEnemy.lightenColorStatic(color, factor);
    }
    
    darkenColor(color, factor) {
        return FireFrogEnemy.darkenColorStatic(color, factor);
    }
}
