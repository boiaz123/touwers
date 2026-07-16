import { BaseEnemy } from './BaseEnemy.js';
import { EnemyColorCache, FROG_KING_COLOR_VARIANTS } from '../../utils/EnemyColorCache.js';
import { darkenColor, lightenColor } from '../../utils/colorUtils.js';
import { drawFlipperFoot } from './FrogFlipperRenderer.js';
import { drawTaperedPath } from './TaperedShapeRenderer.js';

export class FrogKingEnemy extends BaseEnemy {
    // Shared cached color-variant lookup (skinColor -> lighten/darken variants).
    static _colors = new EnemyColorCache(FROG_KING_COLOR_VARIANTS);

    static BASE_STATS = {
        health: 45000,
        speed: 20,
        armour: 22,
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
            damageType: 'earth',
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
            damageType: 'air',
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
        this._transitionFlash = 0;
        this.setVulnerability(this.currentVulnerabilityType, true);

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

        // Blockade spell - fires a projectile that disables a nearby tower for 5 seconds
        this.blockadeSpellTimer = 8 + Math.random() * 10;
        this.blockadeRange = 280;
        this.blockadeProjectile = null;
        this._towersRef = null;

        // Set by EnemyRenderAdapter once it has synced this enemy via Pixi (hit splatters
        // still draw here regardless - not yet migrated). No static structure - the whole
        // figure animates continuously, so everything lives in renderDynamicParts.
        this.skipCanvas2DBodyRender = false;
    }

    /** Per-instance skin color variant (driven by the current elemental vulnerability, which
     * can differ between instances and rotates over time), so baked layers (if any subclass
     * adds them) don't collide across different-colored instances. */
    getRenderVariantKey() {
        return this.skinColor;
    }

    /** This is Mode B (live-redraw), rate-limited by EnemyRenderAdapter's ANIM_FPS. The
     *  default 20fps under-samples this boss's large 0.8s jump arc badly enough to read
     *  as stuttering/lag - as a solo boss the extra redraw cost is a non-issue. */
    getAnimFps() {
        return 36;
    }

    selectRandomVulnerability() {
        const vulnerabilities = Object.keys(FrogKingEnemy.VULNERABILITIES);
        return vulnerabilities[Math.floor(Math.random() * vulnerabilities.length)];
    }

    /**
     * @param {boolean} silent - true for the initial spawn-time pick (no player-visible
     * "something changed" to announce yet); false for a mid-fight rotation, which
     * triggers the crown-flash + particle-burst tell in renderDynamicParts/spawnMagicParticle
     * so players actually notice the weakness swapped instead of only seeing a subtle
     * recolor.
     */
    setVulnerability(vulnerabilityType, silent = false) {
        const vulnData = FrogKingEnemy.VULNERABILITIES[vulnerabilityType];
        if (!vulnData) return;

        this.currentVulnerabilityType = vulnerabilityType;
        this.skinColor = vulnData.skinColor;
        this.crownColor = vulnData.crownColor;
        this.vulnerableTo = vulnData.damageType;
        this.particleColor = vulnData.particleColor;

        // Clear color caches when vulnerability changes
        this.cachedLightenColor = null;
        this.cachedDarkenColor = null;
        this.cachedDarken2Color = null;
        this._particleColorTable = null;

        this._transitionFlash = silent ? 0 : 1.0;
        if (!silent) this._spawnTransitionBurst();
    }

    /** One-shot ring of particles in the new element's color, fired the instant the
     *  vulnerability rotates - reuses the existing capped magicParticles array/render
     *  path rather than a second effect system. */
    _spawnTransitionBurst() {
        const count = Math.min(12, Math.max(0, 30 - this.magicParticles.length));
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = 60 + Math.random() * 40;
            this.magicParticles.push({
                x: this.x + Math.cos(angle) * 10,
                y: this.y + Math.sin(angle) * 10 - 20,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 10,
                life: 0.7,
                maxLife: 0.7,
                size: Math.random() * 2.5 + 2.5,
                colorIndex: 0
            });
        }
    }

    update(deltaTime) {
        // DO NOT call super.update() - we handle movement ourselves with jump mechanics
        
        // Update base animations and cooldowns
        this.animationTime += deltaTime;
        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);

        // Don't move while engaged with a defender
        if (this.isAttackingDefender) { return; }
        
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

        // Decay the post-rotation crown/scepter flash (see setVulnerability's "tell")
        if (this._transitionFlash > 0) {
            this._transitionFlash = Math.max(0, this._transitionFlash - deltaTime / 0.6);
        }
        
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

        // === BLOCKADE SPELL: fire a dark orb to disable a nearby tower for 5 seconds ===
        if (this._towersRef && !this.reachedEnd) {
            this.blockadeSpellTimer -= deltaTime;
            if (this.blockadeSpellTimer <= 0 && this.blockadeProjectile === null) {
                let nearest = null;
                let nearestDist = this.blockadeRange;
                for (let j = 0; j < this._towersRef.length; j++) {
                    const tower = this._towersRef[j];
                    if (tower.isDisabled || tower.type === 'guard-post') continue;
                    const dx = tower.x - this.x;
                    const dy = tower.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < nearestDist) {
                        nearest = tower;
                        nearestDist = dist;
                    }
                }
                if (nearest) {
                    const dx = nearest.x - this.x;
                    const dy = nearest.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const speed = 250;
                    if (this.audioManager) {
                        this.audioManager.playSFX('spell-attack');
                    }
                    this.blockadeProjectile = {
                        x: this.x,
                        y: this.y - 20,
                        vx: (dx / dist) * speed,
                        vy: (dy / dist) * speed,
                        targetTower: nearest,
                        trail: [],
                        age: 0
                    };
                }
                this.blockadeSpellTimer = 12 + Math.random() * 8;
            }
        }

        // Update blockade projectile
        if (this.blockadeProjectile) {
            const proj = this.blockadeProjectile;
            proj.age += deltaTime;
            const lastT = proj.trail[proj.trail.length - 1];
            if (!lastT || Math.hypot(proj.x - lastT.x, proj.y - lastT.y) > 5) {
                proj.trail.push({ x: proj.x, y: proj.y, age: 0 });
            }
            for (let j = proj.trail.length - 1; j >= 0; j--) {
                proj.trail[j].age += deltaTime;
                if (proj.trail[j].age > 0.25) proj.trail.splice(j, 1);
            }
            if (proj.targetTower && !proj.targetTower.isDisabled) {
                const dx = proj.targetTower.x - proj.x;
                const dy = proj.targetTower.y - proj.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const speed = 250;
                proj.vx = (dx / dist) * speed;
                proj.vy = (dy / dist) * speed;
                if (dist <= 18) {
                    proj.targetTower.isDisabled = true;
                    proj.targetTower.disabledTimer = 5;
                    this.blockadeProjectile = null;
                }
            } else {
                this.blockadeProjectile = null;
            }
            if (this.blockadeProjectile) {
                proj.x += proj.vx * deltaTime;
                proj.y += proj.vy * deltaTime;
                if (proj.age > 4) {
                    this.blockadeProjectile = null;
                }
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
        
        const target = this.getOffsetWaypointAt(this.currentPathIndex + 1) || this.path[this.currentPathIndex + 1];
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
            const snapPos = this.getOffsetWaypointAt(this.currentPathIndex) || this.path[this.currentPathIndex];
            if (snapPos) { this.x = snapPos.x; this.y = snapPos.y; }
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
        // Magic (arcane/classless) damage also passes through, reduced by the high magic resistance
        if (damageType !== this.vulnerableTo && damageType !== 'magic') {
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

    render(ctx) {
        // baseSize depends on ctx.canvas.width (real screen resolution) - computed once
        // here, with a real ctx, and cached on the instance so _syncEnemyPixi
        // (GameplayState) can reuse the exact same value for the Pixi path.
        const baseSize = Math.max(6, Math.min(14, ctx.canvas.width / 150)) * this.sizeMultiplier;
        this._lastRenderSize = baseSize;

        if (!this.skipCanvas2DBodyRender) {
            this.renderDynamicParts(ctx, baseSize);
        }

        // Render hit splatters
        for (let i = 0; i < this.hitSplatters.length; i++) {
            this.hitSplatters[i].render(ctx);
        }
    }

    /** No static structure for this enemy - present for EnemyRenderAdapter's uniform convention. */
    renderStaticBack(ctx, size) {
        // intentionally empty
    }

    /** No static structure for this enemy - present for EnemyRenderAdapter's uniform convention. */
    renderStaticFront(ctx, size) {
        // intentionally empty
    }

    renderDynamicParts(ctx, baseSize) {
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

        // Subtle squash-and-stretch on the jump - smaller amplitude than the common
        // frogs since a king's hop should read as dignified, not bouncy.
        const squashAmount = Math.pow(Math.max(0, 1 - Math.sin(jumpProgress * Math.PI)), 3);
        const stretchAmount = Math.sin(jumpProgress * Math.PI);
        const bodyScaleX = 1 + squashAmount * 0.06 - stretchAmount * 0.03;
        const bodyScaleY = 1 - squashAmount * 0.06 + stretchAmount * 0.05;

        // Cache colors for this render
        if (!this.cachedLightenColor) {
            this.cachedLightenColor = FrogKingEnemy._colors.get(this.skinColor, 'lighten');
            this.cachedDarkenColor = FrogKingEnemy._colors.get(this.skinColor, 'darken');
            this.cachedDarken2Color = FrogKingEnemy._colors.get(this.skinColor, 'darken_body');
        }
        
        // --- ROYAL CAPE (drawn first, behind everything - swaying, fixed royal color
        // independent of the rotating elemental skin tone, so the king reads as
        // consistently "royal" even as his vulnerability color shifts every 10s) ---
        this.drawRoyalCape(ctx, baseSize);

        // --- BACK LEGS (DRAW FIRST) ---
        this.drawBattleLeg(ctx, -baseSize * 0.32, baseSize * 0.2, baseSize, false, true);
        this.drawBattleLeg(ctx, baseSize * 0.32, baseSize * 0.2, baseSize, true, true);

        // --- LOWER BODY/ROBE ---
        // Royal tabard skirt flowing down from the torso
        ctx.fillStyle = darkenColor(this.skinColor, 0.45);
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.44, baseSize * 0.12);
        ctx.quadraticCurveTo(-baseSize * 0.52, baseSize * 0.36, -baseSize * 0.34, baseSize * 0.56);
        ctx.lineTo(baseSize * 0.34, baseSize * 0.56);
        ctx.quadraticCurveTo(baseSize * 0.52, baseSize * 0.36, baseSize * 0.44, baseSize * 0.12);
        ctx.closePath();
        ctx.fill();

        // Gold hem trim at skirt bottom
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.34, baseSize * 0.56);
        ctx.quadraticCurveTo(0, baseSize * 0.63, baseSize * 0.34, baseSize * 0.56);
        ctx.stroke();

        // Tabard center heraldic stripe
        ctx.fillStyle = darkenColor(this.skinColor, 0.62);
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.1, baseSize * 0.12);
        ctx.quadraticCurveTo(-baseSize * 0.12, baseSize * 0.36, -baseSize * 0.09, baseSize * 0.56);
        ctx.lineTo(baseSize * 0.09, baseSize * 0.56);
        ctx.quadraticCurveTo(baseSize * 0.12, baseSize * 0.36, baseSize * 0.1, baseSize * 0.12);
        ctx.closePath();
        ctx.fill();

        // Lighter belly skin visible above tabard (frogs have pale bellies)
        ctx.fillStyle = lightenColor(this.skinColor, 0.16);
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.22, baseSize * 0.28, baseSize * 0.17, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // --- MAIN BODY/CHEST --- (cached gradient, top-down lighting)
        if (!this._bodyGrad || this._gradBaseSize !== baseSize || this._gradCtx !== ctx) {
            this._gradCtx = ctx;
            this._gradBaseSize = baseSize;
            this._bodyGrad = ctx.createLinearGradient(0, -baseSize * 0.42, 0, baseSize * 0.55);
            this._bodyGrad.addColorStop(0, lightenColor(this.skinColor, 0.06));
            this._bodyGrad.addColorStop(0.45, this.skinColor);
            this._bodyGrad.addColorStop(1, darkenColor(this.skinColor, 0.28));
        }
        
        ctx.fillStyle = this._bodyGrad;
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.1, baseSize * 0.52 * bodyScaleX, baseSize * 0.48 * bodyScaleY, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = darkenColor(this.skinColor, 0.4);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.1, baseSize * 0.52 * bodyScaleX, baseSize * 0.48 * bodyScaleY, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Royal armor breastplate (angular shield shape)
        ctx.fillStyle = '#C9940A';
        ctx.beginPath();
        ctx.moveTo(0, -baseSize * 0.3);
        ctx.bezierCurveTo(baseSize * 0.42, -baseSize * 0.28, baseSize * 0.44, baseSize * 0.08, baseSize * 0.32, baseSize * 0.26);
        ctx.lineTo(0, baseSize * 0.31);
        ctx.lineTo(-baseSize * 0.32, baseSize * 0.26);
        ctx.bezierCurveTo(-baseSize * 0.44, baseSize * 0.08, -baseSize * 0.42, -baseSize * 0.28, 0, -baseSize * 0.3);
        ctx.closePath();
        ctx.fill();

        // Breastplate inner highlight panel
        ctx.fillStyle = '#FFE066';
        ctx.beginPath();
        ctx.moveTo(0, -baseSize * 0.28);
        ctx.bezierCurveTo(baseSize * 0.24, -baseSize * 0.26, baseSize * 0.26, -baseSize * 0.02, baseSize * 0.18, baseSize * 0.12);
        ctx.lineTo(0, baseSize * 0.16);
        ctx.lineTo(-baseSize * 0.18, baseSize * 0.12);
        ctx.bezierCurveTo(-baseSize * 0.26, -baseSize * 0.02, -baseSize * 0.24, -baseSize * 0.26, 0, -baseSize * 0.28);
        ctx.closePath();
        ctx.fill();

        // Breastplate rim
        ctx.strokeStyle = '#8B6800';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(0, -baseSize * 0.3);
        ctx.bezierCurveTo(baseSize * 0.42, -baseSize * 0.28, baseSize * 0.44, baseSize * 0.08, baseSize * 0.32, baseSize * 0.26);
        ctx.lineTo(0, baseSize * 0.31);
        ctx.lineTo(-baseSize * 0.32, baseSize * 0.26);
        ctx.bezierCurveTo(-baseSize * 0.44, baseSize * 0.08, -baseSize * 0.42, -baseSize * 0.28, 0, -baseSize * 0.3);
        ctx.closePath();
        ctx.stroke();

        // Heraldic center gem (vulnerability element color)
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 0.02, baseSize * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8B6800';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Gem specular highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.03, -baseSize * 0.06, baseSize * 0.038, 0, Math.PI * 2);
        ctx.fill();

        // Vertical center ridge on breastplate
        ctx.strokeStyle = '#8B6800';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(0, -baseSize * 0.26);
        ctx.lineTo(0, -baseSize * 0.12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, baseSize * 0.08);
        ctx.lineTo(0, baseSize * 0.28);
        ctx.stroke();
        
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
        
        ctx.strokeStyle = darkenColor(this.skinColor, 0.4);
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.48, baseSize * 0.5, baseSize * 0.48, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Snout bulge (frog-like)
        ctx.fillStyle = lightenColor(this.skinColor, 0.1);
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.28, baseSize * 0.35, baseSize * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = darkenColor(this.skinColor, 0.3);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.28, baseSize * 0.35, baseSize * 0.22, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Nostril slits
        ctx.fillStyle = darkenColor(this.skinColor, 0.45);
        ctx.beginPath();
        ctx.ellipse(-baseSize * 0.1, -baseSize * 0.19, baseSize * 0.04, baseSize * 0.025, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(baseSize * 0.1, -baseSize * 0.19, baseSize * 0.04, baseSize * 0.025, -0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Head shading - darker crown of skull for 3D depth
        ctx.fillStyle = 'rgba(0, 0, 0, 0.13)';
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.66, baseSize * 0.4, baseSize * 0.26, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head highlight - lit front face
        ctx.fillStyle = 'rgba(255, 255, 255, 0.09)';
        ctx.beginPath();
        ctx.ellipse(baseSize * 0.06, -baseSize * 0.45, baseSize * 0.28, baseSize * 0.2, -0.2, 0, Math.PI * 2);
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
        ctx.strokeStyle = darkenColor(this.skinColor, 0.5);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(-baseSize * 0.22, -baseSize * 0.75, baseSize * 0.14, Math.PI * 0.2, Math.PI * 0.8);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(baseSize * 0.22, -baseSize * 0.75, baseSize * 0.14, Math.PI * 0.2, Math.PI * 0.8);
        ctx.stroke();
        
        // --- MOUTH (menacing, wide grin with teeth) ---
        // Mouth line - wide, threatening
        ctx.fillStyle = darkenColor(this.skinColor, 0.6);
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
        if (!this._particleColorTable) {
            const base = this.particleColor;
            this._particleColorTable = Array.from({ length: 101 }, (_, i) => base + (i / 100).toFixed(2) + ')');
        }
        const colorTable = this._particleColorTable;

        for (let i = 0; i < this.magicParticles.length; i++) {
            const particle = this.magicParticles[i];
            ctx.fillStyle = colorTable[Math.round(particle.life / particle.maxLife * 100)];
            ctx.beginPath();
            ctx.arc(particle.x - this.x, particle.y - this.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();

        // Draw blockade projectile (world space)
        if (this.blockadeProjectile) {
            const proj = this.blockadeProjectile;
            const pulse = 0.5 + 0.5 * Math.sin(this.animationTime * 10);

            // Trail
            for (let i = 0; i < proj.trail.length; i++) {
                const t = proj.trail[i];
                const lifeRatio = 1 - t.age / 0.25;
                ctx.fillStyle = `rgba(155, 0, 215, ${lifeRatio * 0.55})`;
                ctx.beginPath();
                ctx.arc(t.x, t.y, 5 * lifeRatio, 0, Math.PI * 2);
                ctx.fill();
            }

            // Outer glow
            ctx.fillStyle = `rgba(175, 0, 255, ${0.22 + pulse * 0.13})`;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, 14, 0, Math.PI * 2);
            ctx.fill();

            // Main orb body
            ctx.fillStyle = 'rgba(85, 0, 185, 0.92)';
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, 7, 0, Math.PI * 2);
            ctx.fill();

            // Orb rim
            ctx.strokeStyle = `rgba(215, 125, 255, ${0.65 + pulse * 0.35})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, 7, 0, Math.PI * 2);
            ctx.stroke();

            // Specular highlight
            ctx.fillStyle = `rgba(230, 155, 255, ${0.55 + pulse * 0.45})`;
            ctx.beginPath();
            ctx.arc(proj.x - 2.5, proj.y - 2.5, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        this.renderHealthBar(ctx, baseSize, { widthMul: 3.2, heightMul: 0.42, yOffsetMul: -2.4 });
    }

    drawRoyalCape(ctx, baseSize) {
        const sway = Math.sin(this.animationTime * 1.1 + this.animationPhaseOffset) * baseSize * 0.06;
        const capeTop = -baseSize * 0.5;
        const capeMidY = baseSize * 0.05;
        const capeBottom = baseSize * 0.7;
        // Widest point of the flare, well beyond the body ellipse's ~0.52*baseSize
        // half-width and the tabard's ~0.34-0.52 - these are used as actual on-curve
        // anchor points (not bezier control points, which a quadratic curve only
        // approaches rather than reaches) so the cape reliably peeks out past the body.
        const flareX = baseSize * 0.72;
        const hemX = baseSize * 0.56;

        if (!this._capeGrad || this._capeGradBaseSize !== baseSize || this._capeGradCtx !== ctx) {
            this._capeGradCtx = ctx;
            this._capeGradBaseSize = baseSize;
            this._capeGrad = ctx.createLinearGradient(0, capeTop, 0, capeBottom);
            this._capeGrad.addColorStop(0, '#7a3a8a');
            this._capeGrad.addColorStop(1, '#2a0a3a');
        }

        ctx.fillStyle = this._capeGrad;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.4, capeTop);
        ctx.quadraticCurveTo(-baseSize * 0.55, -baseSize * 0.15, -flareX + sway, capeMidY);
        ctx.quadraticCurveTo(-flareX + sway * 1.3, baseSize * 0.4, -hemX + sway * 1.4, capeBottom);
        ctx.quadraticCurveTo(0, capeBottom + baseSize * 0.12, hemX + sway * 1.4, capeBottom);
        ctx.quadraticCurveTo(flareX + sway * 1.3, baseSize * 0.4, flareX + sway, capeMidY);
        ctx.quadraticCurveTo(baseSize * 0.55, -baseSize * 0.15, baseSize * 0.4, capeTop);
        ctx.closePath();
        ctx.fill();

        // Gold trim along the cape edge
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-hemX + sway * 1.4, capeBottom);
        ctx.quadraticCurveTo(0, capeBottom + baseSize * 0.12, hemX + sway * 1.4, capeBottom);
        ctx.stroke();

        // Inner shading fold for depth
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.2, capeTop + baseSize * 0.15);
        ctx.quadraticCurveTo(-baseSize * 0.3 + sway * 0.6, baseSize * 0.3, -baseSize * 0.25 + sway, capeBottom - baseSize * 0.1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(baseSize * 0.2, capeTop + baseSize * 0.15);
        ctx.quadraticCurveTo(baseSize * 0.3 + sway * 0.6, baseSize * 0.3, baseSize * 0.25 + sway, capeBottom - baseSize * 0.1);
        ctx.stroke();
    }

    drawRoyalCrown(ctx, baseSize) {
        const crownY = -baseSize * 0.95;
        const crownWidth = baseSize * 0.65;
        const peakHeight = baseSize * 0.35;

        // Charge-up "tell": glow builds through the final 1.2s before the vulnerability
        // rotates, then the transition burst/flash (see setVulnerability) takes over for
        // an instant payoff - together these make the swap something a player can react
        // to instead of a silent recolor.
        const timeUntilRotation = this.vulnerabilityRotationInterval - this.vulnerabilityRotationTimer;
        const chargeGlow = timeUntilRotation < 1.2 ? 1 - (timeUntilRotation / 1.2) : 0;
        const glowIntensity = Math.max(chargeGlow * 0.6, this._transitionFlash);
        // Stashed so drawScepter (called earlier in renderDynamicParts, so it sees last
        // frame's value - imperceptible at this throttled redraw rate) can echo the same
        // build-up/flash in the crystal orb, tying the whole regalia together.
        this._crownGlowIntensity = glowIntensity;

        ctx.save();
        // Add slight dainty bob offset instead of rotation
        const bobOffset = Math.sin(this.crownRotation * 2) * baseSize * 0.03;
        ctx.translate(bobOffset, crownY);

        // Outer glow halo - grows with chargeGlow, flashes bright white on the swap itself
        if (glowIntensity > 0.02) {
            ctx.fillStyle = `rgba(255, 255, 255, ${glowIntensity * 0.5})`;
            ctx.beginPath();
            ctx.arc(0, -peakHeight * 0.6, baseSize * (0.55 + glowIntensity * 0.35), 0, Math.PI * 2);
            ctx.fill();
        }

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
        // Gold gradient staff (cached)
        if (!this._staffGrad || this._staffGradBaseSize !== baseSize || this._staffGradCtx !== ctx) {
            this._staffGradCtx = ctx;
            this._staffGradBaseSize = baseSize;
            this._staffGrad = ctx.createLinearGradient(-baseSize * 0.05, 0, baseSize * 0.05, scepterHeight);
            this._staffGrad.addColorStop(0, '#FFE55C');
            this._staffGrad.addColorStop(0.5, '#DAA520');
            this._staffGrad.addColorStop(1, '#B8860B');
            
            this._orbGrad = ctx.createRadialGradient(0, -baseSize * 0.42, baseSize * 0.04, 0, -baseSize * 0.42, baseSize * 0.16);
            this._orbGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            this._orbGrad.addColorStop(0.5, this.crownColor);
            this._orbGrad.addColorStop(1, this.crownColor);
        }
        
        ctx.fillStyle = this._staffGrad;
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
        // Create radial gradient for crystal effect (cached)
        ctx.fillStyle = this._orbGrad;
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
        
        // Magical glow aura - echoes the crown's charge-up/transition-flash tell
        const scepterGlow = this._crownGlowIntensity || 0;
        ctx.strokeStyle = `rgba(255, 255, 100, ${0.3 + scepterGlow * 0.5})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 0.42, baseSize * 0.22, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 255, 100, ${0.15 + scepterGlow * 0.35})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 0.42, baseSize * (0.28 + scepterGlow * 0.15), 0, Math.PI * 2);
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

        // Push-off extension: 0 = grounded/folded crouch (the resting pose for most of
        // the jump cycle), 1 = fully extended mid-leap. The previous version stacked
        // thigh/calf/foot as vertical ellipses straight down from the hip - a uniform,
        // straight, rounded-end column that read as phallic rather than a leg. Angling
        // the thigh outward and folding the calf back (matching the fix applied to the
        // elemental frogs' shared leg code) gives an actual bent, tapered limb instead.
        let extension = 0;
        if (jumpPhase < 0.5) extension = jumpPhase * 2;
        else extension = Math.max(0, (1 - jumpPhase) * 2);

        const thighLength = baseSize * 0.3;
        const calfLength = baseSize * 0.28;

        const baseThighAngle = side > 0 ? Math.PI / 3.2 : Math.PI - Math.PI / 3.2;
        const thighAngle = baseThighAngle - side * extension * 0.2;
        const kneeX = hipX + Math.cos(thighAngle) * thighLength;
        const kneeY = hipY + Math.sin(thighAngle) * thighLength;

        const calfAngle = thighAngle + side * 1.05 * (1 - extension * 0.7);
        const footX = kneeX + Math.cos(calfAngle) * calfLength;
        const footY = kneeY + Math.sin(calfAngle) * calfLength;

        // Leg (hip -> knee -> ankle) as ONE continuous tapered shape instead of two
        // separate filled ellipses plus a knee-joint circle - stacking three
        // independent round shapes at the joint is what read as "too many joints and
        // circles" rather than a single natural limb. drawTaperedPath builds one
        // outline through all three points with a smooth direction-averaged bend at
        // the knee, so the taper from thigh to ankle is continuous.
        drawTaperedPath(
            ctx,
            [{ x: hipX, y: hipY }, { x: kneeX, y: kneeY }, { x: footX, y: footY }],
            [baseSize * 0.3, baseSize * 0.22, baseSize * 0.16],
            this.skinColor,
            darkenColor(this.skinColor, 0.3),
            1
        );

        // Flipper - an actual paddle/fin outline (narrow ankle, wide belly, rounded
        // tip), not a slightly-elongated ellipse - shared with the elemental frogs'
        // identical fix, see FrogFlipperRenderer.js.
        drawFlipperFoot(
            ctx, footX, footY, calfAngle,
            baseSize * 0.56, baseSize * 0.28,
            this.skinColor,
            darkenColor(this.skinColor, 0.4)
        );
    }

    drawBattleArm(ctx, hipX, hipY, baseSize, isRight) {
        const side = isRight ? 1 : -1;
        
        // Upper arm
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.ellipse(hipX, hipY, baseSize * 0.1, baseSize * 0.24, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = darkenColor(this.skinColor, 0.3);
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
