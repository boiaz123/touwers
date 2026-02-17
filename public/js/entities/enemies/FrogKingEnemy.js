import { BaseEnemy } from './BaseEnemy.js';

export class FrogKingEnemy extends BaseEnemy {
    // Static color cache to avoid recalculation
    static colorCache = new Map();

    static BASE_STATS = {
        health: 500,
        speed: 20,
        armour: 3,
        magicResistance: 1.0
    };

    // Vulnerability types with their properties
    static VULNERABILITIES = {
        'fire': {
            skinColor: '#E74C3C',
            crownColor: '#FF6B6B',
            damageType: 'water',
            particleColor: 'rgba(230, 76, 60, '
        },
        'water': {
            skinColor: '#3498DB',
            crownColor: '#2980B9',
            damageType: 'air',
            particleColor: 'rgba(52, 152, 219, '
        },
        'air': {
            skinColor: '#e8e8f8',
            crownColor: '#c0c0ff',
            damageType: 'fire',
            particleColor: 'rgba(232, 232, 248, '
        },
        'earth': {
            skinColor: '#8B6F47',
            crownColor: '#A0826D',
            damageType: 'water',
            particleColor: 'rgba(139, 111, 71, '
        }
    };
    
    constructor(path, health_multiplier = 1.0, speed = null, armour = null, magicResistance = null) {
        const baseStats = FrogKingEnemy.BASE_STATS;
        const actualSpeed = speed !== null ? speed : baseStats.speed;
        const actualArmour = armour !== null ? armour : baseStats.armour;
        const actualMagicResistance = magicResistance !== null ? magicResistance : baseStats.magicResistance;
        
        super(path, baseStats.health * health_multiplier, actualSpeed, actualArmour, actualMagicResistance);
        
        // Start with random vulnerability
        this.currentVulnerabilityType = this.selectRandomVulnerability();
        this.setVulnerability(this.currentVulnerabilityType);
        
        this.elementalType = 'frogking';
        this.sizeMultiplier = 4.0; // Larger than elemental frogs
        
        this.attackDamage = 12;
        this.attackSpeed = 1.0;
        
        this.magicParticles = [];
        this.particleSpawnCounter = 0;
        this.jumpAnimationTimer = 0;
        this.jumpAnimationDuration = 0.8;
        this.jumpHeight = 40;
        this.jumpCycleTimer = 0;
        this.jumpCycleDuration = 2.0;
        
        // Leg animation for natural movement
        this.legAnimationTimer = 0;
        
        // Cache for color variations
        this.cachedLightenColor = null;
        this.cachedDarkenColor = null;
        this.cachedDarken2Color = null;
        
        // Vulnerability rotation
        this.vulnerabilityRotationTimer = 0;
        this.vulnerabilityRotationInterval = 10.0; // 10 seconds
        
        // Crown and scepter animation
        this.crownRotation = 0;
        this.scepterOscillation = 0;
    }

    selectRandomVulnerability() {
        const vulnerabilities = Object.keys(FrogKingEnemy.VULNERABILITIES);
        return vulnerabilities[Math.floor(Math.random() * vulnerabilities.length)];
    }

    setVulnerability(vulnerabilityType) {
        const vulnData = FrogKingEnemy.VULNERABILITIES[vulnerabilityType];
        if (!vulnData) return;

        this.currentVulnerabilityType = vulnerabilityType;
        this.skinColor = vulnData.skinColor;
        this.crownColor = vulnData.crownColor;
        this.vulnerableTo = vulnData.damageType;
        this.particleColor = vulnData.particleColor;

        // Clear color cache when vulnerability changes
        this.cachedLightenColor = null;
        this.cachedDarkenColor = null;
        this.cachedDarken2Color = null;
    }

    update(deltaTime) {
        // DO NOT call super.update() - we handle movement ourselves with jump mechanics
        
        // Update base animations and cooldowns
        this.animationTime += deltaTime;
        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
        
        // Update vulnerability rotation
        this.vulnerabilityRotationTimer += deltaTime;
        if (this.vulnerabilityRotationTimer >= this.vulnerabilityRotationInterval) {
            this.vulnerabilityRotationTimer = 0;
            const newVulnerability = this.selectRandomVulnerability();
            this.setVulnerability(newVulnerability);
        }
        
        // Update crown and scepter animations
        this.crownRotation += deltaTime * 0.5; // Slow rotation
        this.scepterOscillation += deltaTime * 3;
        
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
    }

    takeDamage(amount, armorPiercingPercent = 0, damageType = 'physical', followTarget = false) {
        // Only take damage if it matches the current vulnerability
        if (damageType !== this.vulnerableTo) {
            return; // Immune to other damage types
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

    spawnMagicParticle() {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 15 + 5;
        
        const particle = {
            x: this.x + Math.cos(angle) * radius,
            y: this.y + Math.sin(angle) * radius,
            vx: Math.cos(angle) * (Math.random() * 20 + 10),
            vy: Math.sin(angle) * (Math.random() * 20 + 10) - 15,
            life: 0.6,
            maxLife: 0.6,
            size: Math.random() * 2 + 1,
            colorIndex: Math.floor(Math.random() * 3)
        };
        
        if (this.magicParticles.length < 30) {
            this.magicParticles.push(particle);
        }
    }

    static getCachedColor(baseColor, operation) {
        const key = baseColor + ':' + operation;
        if (this.colorCache.has(key)) {
            return this.colorCache.get(key);
        }
        
        let result;
        if (operation === 'lighten') {
            result = FrogKingEnemy.lightenColor(baseColor, 0.15);
        } else if (operation === 'darken') {
            result = FrogKingEnemy.darkenColor(baseColor, 0.2);
        } else if (operation === 'darken_body') {
            result = FrogKingEnemy.darkenColor(baseColor, 0.4);
        }
        
        this.colorCache.set(key, result);
        return result;
    }

    static lightenColor(hexColor, amount) {
        const num = parseInt(hexColor.replace('#', ''), 16);
        const r = Math.min(255, Math.floor((num >> 16) + 255 * amount));
        const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + 255 * amount));
        const b = Math.min(255, Math.floor((num & 0x0000FF) + 255 * amount));
        return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).substring(1);
    }

    static darkenColor(hexColor, amount) {
        const num = parseInt(hexColor.replace('#', ''), 16);
        const r = Math.max(0, Math.floor((num >> 16) * (1 - amount)));
        const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - amount)));
        const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - amount)));
        return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).substring(1);
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
            this.cachedLightenColor = FrogKingEnemy.getCachedColor(this.skinColor, 'lighten');
            this.cachedDarkenColor = FrogKingEnemy.getCachedColor(this.skinColor, 'darken');
            this.cachedDarken2Color = FrogKingEnemy.getCachedColor(this.skinColor, 'darken_body');
        }
        
        // --- BACK LEGS (DRAW FIRST) ---
        this.drawBattleLeg(ctx, -baseSize * 0.32, baseSize * 0.2, baseSize, false, true);
        this.drawBattleLeg(ctx, baseSize * 0.32, baseSize * 0.2, baseSize, true, true);
        
        // --- LOWER BODY/ROBE ---
        // Bottom belly extension
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.35, baseSize * 0.48, baseSize * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = FrogKingEnemy.darkenColor(this.skinColor, 0.3);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.35, baseSize * 0.48, baseSize * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Robe skirt over belly
        ctx.fillStyle = FrogKingEnemy.darkenColor(this.skinColor, 0.4);
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.32, baseSize * 0.44, baseSize * 0.24, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Robe outline
        ctx.strokeStyle = FrogKingEnemy.darkenColor(this.skinColor, 0.6);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.32, baseSize * 0.44, baseSize * 0.24, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Robe detail lines (vertical folds)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        for (let i = -2; i <= 2; i++) {
            const x = i * baseSize * 0.14;
            ctx.beginPath();
            ctx.moveTo(x, baseSize * 0.05);
            ctx.quadraticCurveTo(x + baseSize * 0.08, baseSize * 0.18, x + baseSize * 0.04, baseSize * 0.5);
            ctx.stroke();
        }
        
        // --- MAIN BODY/CHEST ---
        const bodyGrad = ctx.createLinearGradient(-baseSize * 0.45, -baseSize * 0.1, baseSize * 0.45, baseSize * 0.2);
        bodyGrad.addColorStop(0, FrogKingEnemy.darkenColor(this.skinColor, 0.1));
        bodyGrad.addColorStop(0.5, FrogKingEnemy.darkenColor(this.skinColor, 0.2));
        bodyGrad.addColorStop(1, FrogKingEnemy.darkenColor(this.skinColor, 0.3));
        
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.1, baseSize * 0.52, baseSize * 0.48, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = FrogKingEnemy.darkenColor(this.skinColor, 0.4);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.1, baseSize * 0.52, baseSize * 0.48, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Royal chest plate (gold with vulnerability color accent)
        ctx.fillStyle = '#DAA520';
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.08, baseSize * 0.38, baseSize * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.08, baseSize * 0.38, baseSize * 0.32, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Chest accent in vulnerability color
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.1, baseSize * 0.26, baseSize * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Armor shine/highlight
        ctx.fillStyle = 'rgba(255, 255, 200, 0.3)';
        ctx.beginPath();
        ctx.ellipse(-baseSize * 0.12, -baseSize * 0.05, baseSize * 0.18, baseSize * 0.14, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // --- FRONT ARMS/HANDS ---
        this.drawBattleArm(ctx, -baseSize * 0.35, baseSize * 0.05, baseSize, false);
        this.drawBattleArm(ctx, baseSize * 0.35, baseSize * 0.05, baseSize, true);
        
        // --- SCEPTER (on right side) ---
        this.drawScepter(ctx, baseSize);
        
        // --- HEAD ---
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.48, baseSize * 0.5, baseSize * 0.48, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = FrogKingEnemy.darkenColor(this.skinColor, 0.4);
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.48, baseSize * 0.5, baseSize * 0.48, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Snout bulge (frog-like)
        ctx.fillStyle = FrogKingEnemy.lightenColor(this.skinColor, 0.08);
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.28, baseSize * 0.35, baseSize * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = FrogKingEnemy.darkenColor(this.skinColor, 0.25);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.28, baseSize * 0.35, baseSize * 0.22, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Head texture spots
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.2, -baseSize * 0.68, baseSize * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(baseSize * 0.2, -baseSize * 0.68, baseSize * 0.12, 0, Math.PI * 2);
        ctx.fill();
        
        // --- MENACING EYES (narrower, angry) ---
        // Left eye - narrowed, angled up
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(-baseSize * 0.22, -baseSize * 0.64, baseSize * 0.16, baseSize * 0.17, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // White of eye with menacing glint
        ctx.fillStyle = '#FFF8DC';
        ctx.beginPath();
        ctx.ellipse(-baseSize * 0.22, -baseSize * 0.63, baseSize * 0.11, baseSize * 0.12, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Iris with vertical pupil (menacing)
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(-baseSize * 0.22, -baseSize * 0.62, baseSize * 0.08, baseSize * 0.09, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Vertical pupil (cat-like/menacing)
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(-baseSize * 0.22, -baseSize * 0.62, baseSize * 0.04, baseSize * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Angry eye shine - small and menacing
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.2, -baseSize * 0.66, baseSize * 0.025, 0, Math.PI * 2);
        ctx.fill();
        
        // Right eye - narrowed, angled up
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(baseSize * 0.22, -baseSize * 0.64, baseSize * 0.16, baseSize * 0.17, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // White of eye
        ctx.fillStyle = '#FFF8DC';
        ctx.beginPath();
        ctx.ellipse(baseSize * 0.22, -baseSize * 0.63, baseSize * 0.11, baseSize * 0.12, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Iris
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(baseSize * 0.22, -baseSize * 0.62, baseSize * 0.08, baseSize * 0.09, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Vertical pupil
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(baseSize * 0.22, -baseSize * 0.62, baseSize * 0.04, baseSize * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Angry eye shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(baseSize * 0.2, -baseSize * 0.66, baseSize * 0.025, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyebrow ridges (menacing)
        ctx.strokeStyle = FrogKingEnemy.darkenColor(this.skinColor, 0.5);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(-baseSize * 0.22, -baseSize * 0.75, baseSize * 0.14, Math.PI * 0.2, Math.PI * 0.8);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(baseSize * 0.22, -baseSize * 0.75, baseSize * 0.14, Math.PI * 0.2, Math.PI * 0.8);
        ctx.stroke();
        
        // --- MOUTH (menacing, wide grin with teeth) ---
        // Mouth line - wide, threatening
        ctx.fillStyle = FrogKingEnemy.darkenColor(this.skinColor, 0.6);
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.25, -baseSize * 0.18);
        ctx.quadraticCurveTo(0, -baseSize * 0.08, baseSize * 0.25, -baseSize * 0.18);
        ctx.quadraticCurveTo(0, baseSize * 0.08, -baseSize * 0.25, -baseSize * 0.18);
        ctx.closePath();
        ctx.fill();
        
        // Dark mouth interior
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.23, -baseSize * 0.16);
        ctx.quadraticCurveTo(0, 0, baseSize * 0.23, -baseSize * 0.16);
        ctx.quadraticCurveTo(0, baseSize * 0.04, -baseSize * 0.23, -baseSize * 0.16);
        ctx.closePath();
        ctx.fill();
        
        // Teeth (frog has small teeth - show a few)
        ctx.fillStyle = '#FFF';
        for (let i = -3; i <= 3; i++) {
            const toothX = i * baseSize * 0.08;
            ctx.beginPath();
            ctx.arc(toothX, -baseSize * 0.14, baseSize * 0.02, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Tongue hint (reddish)
        ctx.fillStyle = 'rgba(200, 60, 60, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.02, baseSize * 0.12, baseSize * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // --- ROYAL CROWN ---
        this.drawRoyalCrown(ctx, baseSize);
        
        // --- RENDER MAGIC PARTICLES ---
        const particleColors = [
            this.particleColor,
            this.particleColor,
            this.particleColor
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
        for (let i = 0; i < this.hitSplatters.length; i++) {
            this.hitSplatters[i].render(ctx);
        }
    }

    drawRoyalCrown(ctx, baseSize) {
        const crownY = -baseSize * 0.95;
        const crownWidth = baseSize * 0.65;
        const peakHeight = baseSize * 0.35;
        
        ctx.save();
        // Add slight dainty bob offset instead of rotation
        const bobOffset = Math.sin(this.crownRotation * 2) * baseSize * 0.03;
        ctx.translate(bobOffset, crownY);
        
        // Crown base band
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(0, 0, crownWidth * 0.5, baseSize * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Crown peaks
        const peakPositions = [-crownWidth * 0.35, -crownWidth * 0.1, crownWidth * 0.1, crownWidth * 0.35];
        for (let i = 0; i < peakPositions.length; i++) {
            const x = peakPositions[i];
            
            // Peak point
            ctx.fillStyle = this.crownColor;
            ctx.beginPath();
            ctx.moveTo(x - baseSize * 0.08, 0);
            ctx.lineTo(x, -peakHeight);
            ctx.lineTo(x + baseSize * 0.08, 0);
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = '#8B7500';
            ctx.lineWidth = 1.2;
            ctx.stroke();
            
            // Peak shine
            ctx.fillStyle = 'rgba(255, 255, 200, 0.5)';
            ctx.beginPath();
            ctx.arc(x, -peakHeight * 0.5, baseSize * 0.05, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Center jewel
        ctx.fillStyle = this.crownColor;
        ctx.beginPath();
        ctx.arc(0, -peakHeight * 1.4, baseSize * 0.12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Jewel shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.04, -peakHeight * 1.5, baseSize * 0.05, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    drawScepter(ctx, baseSize) {
        // Hand position matches the right arm hand position
        // Right arm: hipX=0.35, forearmLength=0.2, handLength=0.09, hipY=0.05
        const handX = baseSize * 0.64;  // 0.35 + 0.2 + 0.09
        const handY = baseSize * 0.33;  // 0.05 + 0.28
        const scepterHeight = baseSize * 0.7;
        
        ctx.save();
        ctx.translate(handX, handY);
        
        // Very slight angle offset for stability (not oscillating)
        const stableAngle = 0.06; // Small outward angle
        ctx.rotate(stableAngle);
        
        // --- SCEPTER STAFF ---
        // Gold gradient staff
        const staffGradient = ctx.createLinearGradient(-baseSize * 0.05, 0, baseSize * 0.05, scepterHeight);
        staffGradient.addColorStop(0, '#FFE55C');
        staffGradient.addColorStop(0.5, '#DAA520');
        staffGradient.addColorStop(1, '#B8860B');
        
        ctx.fillStyle = staffGradient;
        ctx.fillRect(-baseSize * 0.042, 0, baseSize * 0.084, scepterHeight);
        
        // Staff outline
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-baseSize * 0.042, 0, baseSize * 0.084, scepterHeight);
        
        // Staff shine - bright edge
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(-baseSize * 0.028, baseSize * 0.02, baseSize * 0.018, scepterHeight * 0.85);
        
        // --- ORNATE GRIP AREA ---
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-baseSize * 0.052, baseSize * 0.08, baseSize * 0.104, baseSize * 0.14);
        
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-baseSize * 0.052, baseSize * 0.08, baseSize * 0.104, baseSize * 0.14);
        
        // Grip bands
        for (let i = 0; i < 3; i++) {
            const bandY = baseSize * 0.1 + i * baseSize * 0.035;
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(-baseSize * 0.058, bandY, baseSize * 0.116, baseSize * 0.01);
        }
        
        // --- TOP ORNAMENTAL CAP ---
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.15, baseSize * 0.076, baseSize * 0.058, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Decorative ridges on cap
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 0.8;
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.moveTo(i * baseSize * 0.028, -baseSize * 0.17);
            ctx.lineTo(i * baseSize * 0.028, -baseSize * 0.13);
            ctx.stroke();
        }
        
        // --- MAGICAL CRYSTAL ORB ---
        // Create radial gradient for crystal effect
        const orbGrad = ctx.createRadialGradient(0, -baseSize * 0.42, baseSize * 0.04, 0, -baseSize * 0.42, baseSize * 0.16);
        orbGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        orbGrad.addColorStop(0.5, this.crownColor);
        orbGrad.addColorStop(1, this.crownColor);
        
        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 0.42, baseSize * 0.16, 0, Math.PI * 2);
        ctx.fill();
        
        // Orb outer rim
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Inner crystal lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.12, -baseSize * 0.42);
        ctx.lineTo(baseSize * 0.12, -baseSize * 0.42);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -baseSize * 0.58);
        ctx.lineTo(0, -baseSize * 0.26);
        ctx.stroke();
        
        // Crystal facets
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const r1 = baseSize * 0.08;
            const r2 = baseSize * 0.14;
            const x1 = Math.cos(angle) * r1;
            const y1 = Math.sin(angle) * r1;
            const x2 = Math.cos(angle) * r2;
            const y2 = Math.sin(angle) * r2;
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(x1, -baseSize * 0.42 + y1);
            ctx.lineTo(x2, -baseSize * 0.42 + y2);
            ctx.stroke();
        }
        
        // Bright highlight on crystal
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.06, -baseSize * 0.5, baseSize * 0.06, 0, Math.PI * 2);
        ctx.fill();
        
        // Magical glow aura
        ctx.strokeStyle = 'rgba(255, 255, 100, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 0.42, baseSize * 0.22, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(255, 255, 100, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 0.42, baseSize * 0.28, 0, Math.PI * 2);
        ctx.stroke();
        
        // Floating sparkles around orb
        const sparkleCount = 4;
        const sparkleDistance = baseSize * 0.28;
        for (let i = 0; i < sparkleCount; i++) {
            const angle = (this.scepterOscillation + i * Math.PI / 2) * 0.5;
            const x = Math.cos(angle) * sparkleDistance;
            const y = Math.sin(angle) * sparkleDistance;
            
            ctx.fillStyle = 'rgba(255, 255, 200, 0.6)';
            ctx.beginPath();
            ctx.arc(x, -baseSize * 0.42 + y, baseSize * 0.02, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
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
        
        const thighLength = baseSize * (0.28 + compression * 0.06);
        const calfLength = baseSize * (0.26 + compression * 0.04);
        
        // Thigh - starts at hip and extends downward
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.ellipse(hipX, hipY + thighLength * 0.5, baseSize * 0.11, thighLength * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = FrogKingEnemy.darkenColor(this.skinColor, 0.3);
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Calf/Shin - continues from thigh
        ctx.fillStyle = this.skinColor;
        const calfStartY = hipY + thighLength;
        const calfY = calfStartY + calfLength * 0.5;
        ctx.beginPath();
        ctx.ellipse(hipX, calfY, baseSize * 0.1, calfLength * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.stroke();
        
        // Foot - webbed frog foot
        ctx.fillStyle = this.skinColor;
        const footY = calfStartY + calfLength + baseSize * 0.08;
        ctx.beginPath();
        ctx.ellipse(hipX + side * baseSize * 0.12, footY, baseSize * 0.15, baseSize * 0.09, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.stroke();
        
        // Foot toes (webbed details)
        ctx.strokeStyle = FrogKingEnemy.darkenColor(this.skinColor, 0.4);
        ctx.lineWidth = 0.8;
        for (let i = -1; i <= 1; i++) {
            const toeX = hipX + side * (baseSize * 0.08 + i * baseSize * 0.06);
            ctx.beginPath();
            ctx.moveTo(toeX, footY - baseSize * 0.06);
            ctx.lineTo(toeX, footY + baseSize * 0.06);
            ctx.stroke();
        }
    }

    drawBattleArm(ctx, hipX, hipY, baseSize, isRight) {
        const side = isRight ? 1 : -1;
        
        // Upper arm
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.ellipse(hipX, hipY, baseSize * 0.1, baseSize * 0.24, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = FrogKingEnemy.darkenColor(this.skinColor, 0.3);
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Forearm
        const forearmLength = baseSize * 0.2;
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.ellipse(hipX + side * forearmLength, hipY + baseSize * 0.12, baseSize * 0.088, baseSize * 0.21, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.stroke();
        
        // Hand positioned to grip scepter properly
        const handLength = baseSize * 0.09;
        const handX = hipX + side * (forearmLength + handLength);
        const handY = hipY + baseSize * 0.28;
        
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.ellipse(handX, handY, baseSize * 0.12, baseSize * 0.11, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.stroke();
        
        // Add finger details on right hand (scepter hand)
        if (isRight) {
            ctx.fillStyle = this.skinColor;
            // Thumb
            ctx.beginPath();
            ctx.ellipse(handX - baseSize * 0.11, handY - baseSize * 0.06, baseSize * 0.055, baseSize * 0.075, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Fingers curled around scepter
            for (let i = 0; i < 2; i++) {
                const fingerX = handX + baseSize * 0.08;
                const fingerY = handY - baseSize * 0.08 + i * baseSize * 0.08;
                ctx.beginPath();
                ctx.ellipse(fingerX, fingerY, baseSize * 0.04, baseSize * 0.06, 0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }
    }
}
