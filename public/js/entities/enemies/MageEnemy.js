import { BaseEnemy } from './BaseEnemy.js';

export class MageEnemy extends BaseEnemy {
    static _colorTable = null;
    static _getColorTable() {
        if (!MageEnemy._colorTable) {
            const bases = ['rgba(100, 149, 237, ', 'rgba(65, 105, 225, ', 'rgba(72, 209, 204, '];
            MageEnemy._colorTable = bases.map(b =>
                Array.from({ length: 101 }, (_, i) => b + (i / 100).toFixed(2) + ')')
            );
        }
        return MageEnemy._colorTable;
    }
    static BASE_STATS = {
        health: 750,
        speed: 45,
        armour: 45,
        magicResistance: 0.3
    };

    constructor(path, health_multiplier = 1.0, speed = null, armour = null, magicResistance = null) {
        const baseStats = MageEnemy.BASE_STATS;
        const actualSpeed = speed !== null ? speed : baseStats.speed;
        const actualArmour = armour !== null ? armour : baseStats.armour;
        const actualMagicResistance = magicResistance !== null ? magicResistance : baseStats.magicResistance;
        
        super(path, baseStats.health * health_multiplier, actualSpeed, actualArmour, actualMagicResistance);
        this.robeColor = '#0f1e5a';
        this.sizeMultiplier = 1.1;
        
        this.attackDamage = 20;
        this.attackSpeed = 2.0;
        
        // Optimized particle system - reduced particle generation
        this.magicParticles = [];
        this.particleEmissionCounter = 0;
        this.staffGlow = 0;
        this.staffPulse = 0;
        this.spellCastTimer = 0;
        this.isCastingSpell = false;

        // Blockade spell - fires a projectile that disables a nearby tower for 5 seconds
        this.blockadeSpellTimer = 8 + Math.random() * 10;
        this.blockadeRange = 220;
        this.blockadeProjectile = null;
        this._towersRef = null;

        // Set by EnemyRenderAdapter once it has synced this enemy via Pixi (hit splatters
        // still draw here regardless - not yet migrated). No static structure - the whole
        // figure animates continuously, so everything lives in renderDynamicParts.
        this.skipCanvas2DBodyRender = false;
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

        // === BLOCKADE SPELL: fire a dark orb to disable a nearby tower for 5 seconds ===
        if (this._towersRef && !this.reachedEnd) {
            this.blockadeSpellTimer -= deltaTime;
            if (this.blockadeSpellTimer <= 0 && this.blockadeProjectile === null) {
                let nearest = null;
                let nearestDist = this.blockadeRange;
                for (let i = 0; i < this._towersRef.length; i++) {
                    const tower = this._towersRef[i];
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

            // Accumulate trail points spaced ~5px apart
            const lastT = proj.trail[proj.trail.length - 1];
            if (!lastT || Math.hypot(proj.x - lastT.x, proj.y - lastT.y) > 5) {
                proj.trail.push({ x: proj.x, y: proj.y, age: 0 });
            }
            for (let i = proj.trail.length - 1; i >= 0; i--) {
                proj.trail[i].age += deltaTime;
                if (proj.trail[i].age > 0.25) proj.trail.splice(i, 1);
            }

            // Home in on target tower
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
        // baseSize depends on ctx.canvas.width (real screen resolution) - computed once
        // here, with a real ctx, and cached on the instance so _syncEnemyPixi
        // (GameplayState) can reuse the exact same value for the Pixi path.
        const baseSize = Math.max(6, Math.min(14, ctx.canvas.width / 150)) * this.sizeMultiplier;
        this._lastRenderSize = baseSize;

        if (!this.skipCanvas2DBodyRender) {
            this.renderDynamicParts(ctx, baseSize);
        }

        // Hit splatters
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
        const animTime = this.animationTime * 8 + this.animationPhaseOffset;
        const walkCycle = Math.sin(animTime) * 0.5;
        const bobAnimation = Math.sin(animTime) * 0.3;
        const armSwingFreq = animTime * 0.25;

        // Shadow (larger, ominous)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + baseSize * 1.88, baseSize * 1.2, baseSize * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();

        // Full-body arcane aura on ground (outer haze)
        ctx.fillStyle = `rgba(80, 0, 160, ${0.06 + 0.04 * this.staffGlow})`;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + baseSize * 1.0, baseSize * 1.3, baseSize * 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(this.x, this.y + bobAnimation);

        // === LEGS ===
        const leftHipX = -baseSize * 0.24;
        const leftHipY = baseSize * 0.5;
        const leftLegAngle = walkCycle * 0.3;
        const leftFootX = leftHipX + Math.sin(leftLegAngle) * baseSize * 0.7;
        const leftFootY = leftHipY + Math.cos(leftLegAngle) * baseSize * 0.88;

        ctx.strokeStyle = '#080e28';
        ctx.lineWidth = baseSize * 0.26;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(leftHipX, leftHipY);
        ctx.lineTo(leftFootX, leftFootY);
        ctx.stroke();

        const rightHipX = baseSize * 0.24;
        const rightHipY = baseSize * 0.5;
        const rightLegAngle = -walkCycle * 0.3;
        const rightFootX = rightHipX + Math.sin(rightLegAngle) * baseSize * 0.7;
        const rightFootY = rightHipY + Math.cos(rightLegAngle) * baseSize * 0.88;

        ctx.strokeStyle = '#080e28';
        ctx.lineWidth = baseSize * 0.26;
        ctx.beginPath();
        ctx.moveTo(rightHipX, rightHipY);
        ctx.lineTo(rightFootX, rightFootY);
        ctx.stroke();

        // === BOOTS — pointed, dark, with purple sheen ===
        ctx.fillStyle = '#0d0820';
        ctx.beginPath();
        ctx.ellipse(leftFootX, leftFootY + baseSize * 0.12, baseSize * 0.32, baseSize * 0.14, walkCycle * 0.25 - 0.12, 0, Math.PI * 2);
        ctx.fill();
        // Boot pointed toe
        ctx.fillStyle = '#1a0f35';
        ctx.beginPath();
        ctx.moveTo(leftFootX - baseSize * 0.18, leftFootY + baseSize * 0.06);
        ctx.quadraticCurveTo(leftFootX + baseSize * 0.2, leftFootY + baseSize * 0.22, leftFootX + baseSize * 0.46, leftFootY + baseSize * 0.04);
        ctx.quadraticCurveTo(leftFootX + baseSize * 0.2, leftFootY + baseSize * 0.28, leftFootX - baseSize * 0.18, leftFootY + baseSize * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#4a1e7a';
        ctx.lineWidth = 0.7;
        ctx.stroke();

        ctx.fillStyle = '#0d0820';
        ctx.beginPath();
        ctx.ellipse(rightFootX, rightFootY + baseSize * 0.12, baseSize * 0.32, baseSize * 0.14, -walkCycle * 0.25 + 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a0f35';
        ctx.beginPath();
        ctx.moveTo(rightFootX + baseSize * 0.18, rightFootY + baseSize * 0.06);
        ctx.quadraticCurveTo(rightFootX - baseSize * 0.2, rightFootY + baseSize * 0.22, rightFootX - baseSize * 0.46, rightFootY + baseSize * 0.04);
        ctx.quadraticCurveTo(rightFootX - baseSize * 0.2, rightFootY + baseSize * 0.28, rightFootX + baseSize * 0.18, rightFootY + baseSize * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#4a1e7a';
        ctx.lineWidth = 0.7;
        ctx.stroke();

        // === OUTER CLOAK — dark navy, full flowing silhouette ===
        ctx.fillStyle = '#060e2e';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.62, -baseSize * 0.72);
        ctx.bezierCurveTo(-baseSize * 1.05, baseSize * 0.1, -baseSize * 1.22, baseSize * 0.9, -baseSize * 1.14, baseSize * 1.82);
        ctx.lineTo(baseSize * 1.14, baseSize * 1.82);
        ctx.bezierCurveTo(baseSize * 1.22, baseSize * 0.9, baseSize * 1.05, baseSize * 0.1, baseSize * 0.62, -baseSize * 0.72);
        ctx.closePath();
        ctx.fill();

        // === MAIN ROBE — deep midnight blue with gradient-like layering ===
        ctx.fillStyle = '#0f1e5a';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.56, -baseSize * 0.72);
        ctx.bezierCurveTo(-baseSize * 0.9, baseSize * 0.1, -baseSize * 1.05, baseSize * 0.85, -baseSize * 0.98, baseSize * 1.72);
        ctx.lineTo(baseSize * 0.98, baseSize * 1.72);
        ctx.bezierCurveTo(baseSize * 1.05, baseSize * 0.85, baseSize * 0.9, baseSize * 0.1, baseSize * 0.56, -baseSize * 0.72);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#07122e';
        ctx.lineWidth = 1.1;
        ctx.stroke();

        // Center front panel — lighter royal blue
        ctx.fillStyle = '#1a2f82';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.2, -baseSize * 0.72);
        ctx.bezierCurveTo(-baseSize * 0.28, baseSize * 0.3, -baseSize * 0.3, baseSize * 0.9, -baseSize * 0.26, baseSize * 1.72);
        ctx.lineTo(baseSize * 0.26, baseSize * 1.72);
        ctx.bezierCurveTo(baseSize * 0.3, baseSize * 0.9, baseSize * 0.28, baseSize * 0.3, baseSize * 0.2, -baseSize * 0.72);
        ctx.closePath();
        ctx.fill();

        // Robe deep fold lines (left and right, curving outward)
        ctx.strokeStyle = '#07122e';
        ctx.lineWidth = 1.0;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.4, -baseSize * 0.6);
        ctx.bezierCurveTo(-baseSize * 0.58, baseSize * 0.3, -baseSize * 0.75, baseSize * 1.0, -baseSize * 0.82, baseSize * 1.65);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(baseSize * 0.4, -baseSize * 0.6);
        ctx.bezierCurveTo(baseSize * 0.58, baseSize * 0.3, baseSize * 0.75, baseSize * 1.0, baseSize * 0.82, baseSize * 1.65);
        ctx.stroke();
        // Secondary inner fold lines
        ctx.strokeStyle = '#0d1a60';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.58, baseSize * 0.2);
        ctx.bezierCurveTo(-baseSize * 0.7, baseSize * 0.7, -baseSize * 0.78, baseSize * 1.2, -baseSize * 0.74, baseSize * 1.7);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(baseSize * 0.58, baseSize * 0.2);
        ctx.bezierCurveTo(baseSize * 0.7, baseSize * 0.7, baseSize * 0.78, baseSize * 1.2, baseSize * 0.74, baseSize * 1.7);
        ctx.stroke();

        // === ARCANE RUNES on robe — glowing softly ===
        const runeAlpha = 0.28 + 0.18 * Math.sin(this.animationTime * 1.8);
        ctx.strokeStyle = `rgba(120, 160, 255, ${runeAlpha})`;
        ctx.lineWidth = 0.9;
        ctx.lineCap = 'round';
        // Rune 1 — upper chest (simple angular sigil)
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.09, -baseSize * 0.28);
        ctx.lineTo(baseSize * 0.09, -baseSize * 0.28);
        ctx.moveTo(0, -baseSize * 0.38);
        ctx.lineTo(0, -baseSize * 0.18);
        ctx.moveTo(-baseSize * 0.07, -baseSize * 0.18);
        ctx.lineTo(baseSize * 0.07, -baseSize * 0.18);
        ctx.stroke();
        // Rune 2 — lower panel
        const runeAlpha2 = 0.22 + 0.16 * Math.sin(this.animationTime * 2.2 + 1.2);
        ctx.strokeStyle = `rgba(140, 100, 255, ${runeAlpha2})`;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.1, baseSize * 0.9);
        ctx.lineTo(0, baseSize * 0.72);
        ctx.lineTo(baseSize * 0.1, baseSize * 0.9);
        ctx.moveTo(-baseSize * 0.08, baseSize * 1.04);
        ctx.lineTo(baseSize * 0.08, baseSize * 1.04);
        ctx.stroke();

        // === GOLD HEM TRIM — scalloped arc at bottom ===
        ctx.fillStyle = '#8a6010';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.98, baseSize * 1.62);
        ctx.bezierCurveTo(-baseSize * 0.5, baseSize * 1.88, baseSize * 0.5, baseSize * 1.88, baseSize * 0.98, baseSize * 1.62);
        ctx.lineTo(baseSize * 0.98, baseSize * 1.72);
        ctx.bezierCurveTo(baseSize * 0.5, baseSize * 1.96, -baseSize * 0.5, baseSize * 1.96, -baseSize * 0.98, baseSize * 1.72);
        ctx.closePath();
        ctx.fill();
        // Gold top highlight on hem
        ctx.fillStyle = '#d4a820';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.98, baseSize * 1.62);
        ctx.bezierCurveTo(-baseSize * 0.5, baseSize * 1.84, baseSize * 0.5, baseSize * 1.84, baseSize * 0.98, baseSize * 1.62);
        ctx.lineTo(baseSize * 0.86, baseSize * 1.65);
        ctx.bezierCurveTo(baseSize * 0.45, baseSize * 1.78, -baseSize * 0.45, baseSize * 1.78, -baseSize * 0.86, baseSize * 1.65);
        ctx.closePath();
        ctx.fill();

        // === BELT / SASH — wide dark leather ===
        ctx.fillStyle = '#2a1800';
        ctx.fillRect(-baseSize * 0.82, baseSize * 0.28, baseSize * 1.64, baseSize * 0.26);
        ctx.strokeStyle = '#1a0e00';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(-baseSize * 0.82, baseSize * 0.28, baseSize * 1.64, baseSize * 0.26);
        // Belt highlight stripe
        ctx.fillStyle = '#3d2200';
        ctx.fillRect(-baseSize * 0.82, baseSize * 0.28, baseSize * 1.64, baseSize * 0.07);

        // Belt central skull buckle
        ctx.fillStyle = '#c8a028';
        ctx.beginPath();
        ctx.arc(0, baseSize * 0.41, baseSize * 0.21, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#6b5500';
        ctx.lineWidth = 0.9;
        ctx.stroke();
        // Skull shape inside buckle
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(0, baseSize * 0.39, baseSize * 0.12, 0, Math.PI * 2);
        ctx.fill();
        // Skull eye sockets
        ctx.fillStyle = `rgba(120, 80, 220, ${0.7 + 0.3 * this.staffGlow})`;
        ctx.beginPath();
        ctx.arc(-baseSize * 0.055, baseSize * 0.375, baseSize * 0.038, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(baseSize * 0.055, baseSize * 0.375, baseSize * 0.038, 0, Math.PI * 2);
        ctx.fill();

        // === SHOULDER PAULDRONS — dark, angular, arcane ===
        // Left pauldron
        ctx.fillStyle = '#0a1540';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.44, -baseSize * 0.68);
        ctx.bezierCurveTo(-baseSize * 0.78, -baseSize * 0.72, -baseSize * 0.95, -baseSize * 0.42, -baseSize * 0.78, -baseSize * 0.1);
        ctx.lineTo(-baseSize * 0.56, -baseSize * 0.08);
        ctx.bezierCurveTo(-baseSize * 0.5, -baseSize * 0.38, -baseSize * 0.44, -baseSize * 0.52, -baseSize * 0.38, -baseSize * 0.68);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#1e3080';
        ctx.lineWidth = 0.9;
        ctx.stroke();
        // Pauldron gold trim
        ctx.strokeStyle = '#8a6010';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.44, -baseSize * 0.68);
        ctx.bezierCurveTo(-baseSize * 0.78, -baseSize * 0.72, -baseSize * 0.95, -baseSize * 0.42, -baseSize * 0.78, -baseSize * 0.1);
        ctx.stroke();

        // Right pauldron
        ctx.fillStyle = '#0a1540';
        ctx.beginPath();
        ctx.moveTo(baseSize * 0.44, -baseSize * 0.68);
        ctx.bezierCurveTo(baseSize * 0.78, -baseSize * 0.72, baseSize * 0.95, -baseSize * 0.42, baseSize * 0.78, -baseSize * 0.1);
        ctx.lineTo(baseSize * 0.56, -baseSize * 0.08);
        ctx.bezierCurveTo(baseSize * 0.5, -baseSize * 0.38, baseSize * 0.44, -baseSize * 0.52, baseSize * 0.38, -baseSize * 0.68);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#1e3080';
        ctx.lineWidth = 0.9;
        ctx.stroke();
        ctx.strokeStyle = '#8a6010';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(baseSize * 0.44, -baseSize * 0.68);
        ctx.bezierCurveTo(baseSize * 0.78, -baseSize * 0.72, baseSize * 0.95, -baseSize * 0.42, baseSize * 0.78, -baseSize * 0.1);
        ctx.stroke();

        // === COLLAR / NECKPIECE — high standing collar ===
        ctx.fillStyle = '#111f60';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.42, -baseSize * 0.68);
        ctx.lineTo(-baseSize * 0.28, -baseSize * 1.0);
        ctx.lineTo(0, -baseSize * 0.9);
        ctx.lineTo(baseSize * 0.28, -baseSize * 1.0);
        ctx.lineTo(baseSize * 0.42, -baseSize * 0.68);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#c8a028';
        ctx.lineWidth = 0.9;
        ctx.stroke();
        // Collar inner lining
        ctx.fillStyle = '#0a1438';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.28, -baseSize * 0.7);
        ctx.lineTo(-baseSize * 0.18, -baseSize * 0.94);
        ctx.lineTo(0, -baseSize * 0.86);
        ctx.lineTo(baseSize * 0.18, -baseSize * 0.94);
        ctx.lineTo(baseSize * 0.28, -baseSize * 0.7);
        ctx.closePath();
        ctx.fill();

        // Collar throat gem — amethyst
        const gemGlow = 0.7 + 0.3 * this.staffGlow;
        ctx.fillStyle = `rgba(160, 80, 240, ${gemGlow})`;
        ctx.beginPath();
        // Diamond shape gem
        ctx.moveTo(0, -baseSize * 0.78);
        ctx.lineTo(baseSize * 0.07, -baseSize * 0.86);
        ctx.lineTo(0, -baseSize * 0.94);
        ctx.lineTo(-baseSize * 0.07, -baseSize * 0.86);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#c87aff';
        ctx.lineWidth = 0.7;
        ctx.stroke();

        // === NECK — gaunt, pale, visible above collar ===
        ctx.fillStyle = '#8a7060';
        ctx.fillRect(-baseSize * 0.14, -baseSize * 1.12, baseSize * 0.28, baseSize * 0.22);
        // Neck shadow sides
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(-baseSize * 0.14, -baseSize * 1.12, baseSize * 0.06, baseSize * 0.22);
        ctx.fillRect(baseSize * 0.08, -baseSize * 1.12, baseSize * 0.06, baseSize * 0.22);
        // Adam's apple suggestion
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.04, baseSize * 0.055, Math.PI * 0.1, Math.PI * 0.9);
        ctx.stroke();

        // === HEAD — angular, gaunt, threatening ===
        // Head base (slightly angular skull shape)
        ctx.fillStyle = '#8a7060';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.44, -baseSize * 1.22);
        ctx.bezierCurveTo(-baseSize * 0.52, -baseSize * 1.52, -baseSize * 0.4, -baseSize * 1.82, 0, -baseSize * 1.88);
        ctx.bezierCurveTo(baseSize * 0.4, -baseSize * 1.82, baseSize * 0.52, -baseSize * 1.52, baseSize * 0.44, -baseSize * 1.22);
        ctx.bezierCurveTo(baseSize * 0.38, -baseSize * 1.06, -baseSize * 0.38, -baseSize * 1.06, -baseSize * 0.44, -baseSize * 1.22);
        ctx.closePath();
        ctx.fill();

        // Face skin — slightly paler center
        ctx.fillStyle = '#c8b090';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.38, -baseSize * 1.24);
        ctx.bezierCurveTo(-baseSize * 0.46, -baseSize * 1.5, -baseSize * 0.34, -baseSize * 1.8, 0, -baseSize * 1.86);
        ctx.bezierCurveTo(baseSize * 0.34, -baseSize * 1.8, baseSize * 0.46, -baseSize * 1.5, baseSize * 0.38, -baseSize * 1.24);
        ctx.bezierCurveTo(baseSize * 0.32, -baseSize * 1.1, -baseSize * 0.32, -baseSize * 1.1, -baseSize * 0.38, -baseSize * 1.24);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#7a6050';
        ctx.lineWidth = 0.7;
        ctx.stroke();

        // Cheekbone shadows — gaunt, sunken
        ctx.fillStyle = 'rgba(80, 50, 30, 0.22)';
        ctx.beginPath();
        ctx.ellipse(-baseSize * 0.28, -baseSize * 1.28, baseSize * 0.14, baseSize * 0.09, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(baseSize * 0.28, -baseSize * 1.28, baseSize * 0.14, baseSize * 0.09, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Temple shadows
        ctx.fillStyle = 'rgba(60, 40, 20, 0.18)';
        ctx.beginPath();
        ctx.ellipse(-baseSize * 0.38, -baseSize * 1.54, baseSize * 0.1, baseSize * 0.18, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(baseSize * 0.38, -baseSize * 1.54, baseSize * 0.1, baseSize * 0.18, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // === EYES — deep-set, glowing with dark arcane power ===
        const eyeY = -baseSize * 1.46;
        // Eye socket shadows (deeply recessed)
        ctx.fillStyle = 'rgba(20, 10, 40, 0.55)';
        ctx.beginPath();
        ctx.ellipse(-baseSize * 0.19, eyeY, baseSize * 0.155, baseSize * 0.11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(baseSize * 0.19, eyeY, baseSize * 0.155, baseSize * 0.11, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyeball whites (dim, slightly yellow — no innocence here)
        ctx.fillStyle = '#d8c888';
        ctx.beginPath();
        ctx.ellipse(-baseSize * 0.19, eyeY, baseSize * 0.12, baseSize * 0.085, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(baseSize * 0.19, eyeY, baseSize * 0.12, baseSize * 0.085, 0, 0, Math.PI * 2);
        ctx.fill();

        // Irises — glowing violet-white, arcane
        const irisGlow = 0.8 + 0.2 * this.staffGlow;
        ctx.fillStyle = `rgba(80, 0, 180, ${irisGlow})`;
        ctx.beginPath();
        ctx.ellipse(-baseSize * 0.19, eyeY, baseSize * 0.075, baseSize * 0.065, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(baseSize * 0.19, eyeY, baseSize * 0.075, baseSize * 0.065, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupil glow — bright arcane core
        ctx.fillStyle = `rgba(200, 160, 255, ${irisGlow})`;
        ctx.beginPath();
        ctx.ellipse(-baseSize * 0.19, eyeY, baseSize * 0.042, baseSize * 0.036, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(baseSize * 0.19, eyeY, baseSize * 0.042, baseSize * 0.036, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye glow halo (soft outer bloom)
        ctx.fillStyle = `rgba(140, 60, 255, ${0.18 * this.staffGlow})`;
        ctx.beginPath();
        ctx.ellipse(-baseSize * 0.19, eyeY, baseSize * 0.22, baseSize * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(baseSize * 0.19, eyeY, baseSize * 0.22, baseSize * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();

        // === EYEBROWS — severe, angular, heavy ===
        ctx.strokeStyle = '#3a2810';
        ctx.lineWidth = baseSize * 0.1;
        ctx.lineCap = 'round';
        // Left brow: angled inward and down (menacing V shape)
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.34, eyeY - baseSize * 0.17);
        ctx.lineTo(-baseSize * 0.19, eyeY - baseSize * 0.22);
        ctx.lineTo(-baseSize * 0.06, eyeY - baseSize * 0.14);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(baseSize * 0.34, eyeY - baseSize * 0.17);
        ctx.lineTo(baseSize * 0.19, eyeY - baseSize * 0.22);
        ctx.lineTo(baseSize * 0.06, eyeY - baseSize * 0.14);
        ctx.stroke();

        // === NOSE — prominent, hooked, angular ===
        ctx.fillStyle = '#a08060';
        ctx.beginPath();
        // Nose bridge to tip — slightly hooked
        ctx.moveTo(-baseSize * 0.04, eyeY - baseSize * 0.04);
        ctx.bezierCurveTo(-baseSize * 0.04, -baseSize * 1.26, -baseSize * 0.06, -baseSize * 1.2, -baseSize * 0.1, -baseSize * 1.16);
        ctx.lineTo(-baseSize * 0.08, -baseSize * 1.14);
        ctx.bezierCurveTo(-baseSize * 0.04, -baseSize * 1.19, -baseSize * 0.01, -baseSize * 1.25, 0, eyeY - baseSize * 0.04);
        ctx.closePath();
        ctx.fill();
        // Nose tip and nostrils
        ctx.fillStyle = '#8a6850';
        ctx.beginPath();
        ctx.ellipse(-baseSize * 0.04, -baseSize * 1.16, baseSize * 0.07, baseSize * 0.045, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(50,30,10,0.35)';
        ctx.beginPath();
        ctx.ellipse(-baseSize * 0.075, -baseSize * 1.17, baseSize * 0.028, baseSize * 0.022, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-baseSize * 0.005, -baseSize * 1.17, baseSize * 0.022, baseSize * 0.018, -0.1, 0, Math.PI * 2);
        ctx.fill();

        // === MOUTH — thin, tight, grim ===
        ctx.strokeStyle = '#6a4030';
        ctx.lineWidth = baseSize * 0.06;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.18, -baseSize * 1.08);
        ctx.quadraticCurveTo(0, -baseSize * 1.05, baseSize * 0.18, -baseSize * 1.08);
        ctx.stroke();
        // Mouth shadow crease
        ctx.strokeStyle = 'rgba(60,30,10,0.3)';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.14, -baseSize * 1.06);
        ctx.lineTo(baseSize * 0.14, -baseSize * 1.06);
        ctx.stroke();

        // === BEARD — long, wispy, silver-white with strands ===
        ctx.fillStyle = '#d8d4cc';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.22, -baseSize * 1.06);
        ctx.bezierCurveTo(-baseSize * 0.3, -baseSize * 0.9, -baseSize * 0.14, -baseSize * 0.7, -baseSize * 0.05, -baseSize * 0.54);
        ctx.lineTo(baseSize * 0.05, -baseSize * 0.54);
        ctx.bezierCurveTo(baseSize * 0.14, -baseSize * 0.7, baseSize * 0.3, -baseSize * 0.9, baseSize * 0.22, -baseSize * 1.06);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#b8b4ac';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        // Beard strand lines
        ctx.strokeStyle = 'rgba(160, 155, 150, 0.6)';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.06, -baseSize * 1.04);
        ctx.bezierCurveTo(-baseSize * 0.12, -baseSize * 0.82, -baseSize * 0.08, -baseSize * 0.66, -baseSize * 0.04, -baseSize * 0.55);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(baseSize * 0.06, -baseSize * 1.04);
        ctx.bezierCurveTo(baseSize * 0.12, -baseSize * 0.82, baseSize * 0.08, -baseSize * 0.66, baseSize * 0.04, -baseSize * 0.55);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -baseSize * 1.05);
        ctx.bezierCurveTo(0, -baseSize * 0.84, 0, -baseSize * 0.68, 0, -baseSize * 0.54);
        ctx.stroke();

        // === WIZARD HAT — Gandalf-style: wide brim, narrow-base tall cone ===
        // Brim sits partway down the skull so the hat looks worn, not balanced on top.
        // The cone base is much narrower than the brim — that is what distinguishes a
        // wizard hat from a party/traffic cone.
        const hatTilt = -0.05;
        ctx.save();
        // Brim sits at ~upper-third of head (not the skull crown)
        ctx.translate(0, -baseSize * 1.7);
        ctx.rotate(hatTilt);

        // --- Cone (drawn first, brim overlaps base) ---
        // Cone base width ±0.42 vs brim ±0.88 — brim extends way beyond cone sides
        const coneBaseL = -baseSize * 0.42;
        const coneBaseR =  baseSize * 0.42;
        const tipX      =  baseSize * 0.06;  // slight forward lean
        const tipY      = -baseSize * 1.5;   // tall cone

        ctx.fillStyle = '#08102a';
        ctx.beginPath();
        ctx.moveTo(coneBaseL, 0);
        // Left edge: curves inward then up — gives the hat a slightly bulging mid-section
        ctx.bezierCurveTo(-baseSize * 0.38, -baseSize * 0.5, -baseSize * 0.18, -baseSize * 1.0, tipX, tipY);
        // Right edge: mirrors but leans the same direction (forward droop)
        ctx.bezierCurveTo( baseSize * 0.22, -baseSize * 1.0,  baseSize * 0.38, -baseSize * 0.5, coneBaseR, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0a1535';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Cone left-face highlight (catches ambient light)
        ctx.fillStyle = 'rgba(25, 45, 110, 0.5)';
        ctx.beginPath();
        ctx.moveTo(coneBaseL, 0);
        ctx.bezierCurveTo(-baseSize * 0.38, -baseSize * 0.5, -baseSize * 0.18, -baseSize * 1.0, tipX, tipY);
        ctx.lineTo(tipX - baseSize * 0.06, tipY);
        ctx.bezierCurveTo(-baseSize * 0.24, -baseSize * 1.0, -baseSize * 0.44, -baseSize * 0.5, coneBaseL + baseSize * 0.08, 0);
        ctx.closePath();
        ctx.fill();

        // Cone right-face shadow
        ctx.fillStyle = 'rgba(0, 0, 10, 0.3)';
        ctx.beginPath();
        ctx.moveTo(coneBaseR, 0);
        ctx.bezierCurveTo( baseSize * 0.38, -baseSize * 0.5,  baseSize * 0.22, -baseSize * 1.0, tipX, tipY);
        ctx.lineTo(tipX + baseSize * 0.04, tipY);
        ctx.bezierCurveTo( baseSize * 0.26, -baseSize * 1.0,  baseSize * 0.44, -baseSize * 0.5, coneBaseR - baseSize * 0.06, 0);
        ctx.closePath();
        ctx.fill();

        // --- Hat band — just above the brim line ---
        const bandTop = -baseSize * 0.22;
        ctx.fillStyle = '#5a3c08';
        ctx.beginPath();
        ctx.moveTo(coneBaseL, 0);
        ctx.lineTo(coneBaseR, 0);
        ctx.lineTo(coneBaseR - baseSize * 0.04, bandTop);
        ctx.lineTo(coneBaseL + baseSize * 0.04, bandTop);
        ctx.closePath();
        ctx.fill();
        // Gold top stripe of band
        ctx.fillStyle = '#c8a020';
        ctx.beginPath();
        ctx.moveTo(coneBaseL + baseSize * 0.02, bandTop + baseSize * 0.04);
        ctx.lineTo(coneBaseR - baseSize * 0.02, bandTop + baseSize * 0.04);
        ctx.lineTo(coneBaseR - baseSize * 0.04, bandTop);
        ctx.lineTo(coneBaseL + baseSize * 0.04, bandTop);
        ctx.closePath();
        ctx.fill();
        // Band gem — amethyst
        ctx.fillStyle = '#1a1030';
        ctx.beginPath();
        ctx.arc(0, bandTop + baseSize * 0.1, baseSize * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(160, 60, 240, ${0.65 + 0.35 * this.staffGlow})`;
        ctx.beginPath();
        ctx.arc(0, bandTop + baseSize * 0.1, baseSize * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d0a0ff';
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // --- Brim — wide, flat, 3-D with top and underside ---
        const brimRX = baseSize * 0.88;
        const brimRY = baseSize * 0.1;

        // Brim underside (slightly darker)
        ctx.fillStyle = '#040c20';
        ctx.beginPath();
        ctx.ellipse(0, baseSize * 0.04, brimRX, brimRY + baseSize * 0.04, 0, 0, Math.PI * 2);
        ctx.fill();

        // Brim top face
        ctx.fillStyle = '#0a1430';
        ctx.beginPath();
        ctx.ellipse(0, 0, brimRX, brimRY, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#06102a';
        ctx.lineWidth = 1.0;
        ctx.stroke();

        // Brim gold edge ring
        ctx.strokeStyle = '#b89018';
        ctx.lineWidth = baseSize * 0.055;
        ctx.beginPath();
        ctx.ellipse(0, 0, brimRX, brimRY, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Brim highlight — lighter arc on top-left (ambient light catch)
        ctx.strokeStyle = 'rgba(30, 55, 120, 0.55)';
        ctx.lineWidth = baseSize * 0.07;
        ctx.beginPath();
        ctx.ellipse(0, 0, brimRX * 0.92, brimRY * 0.78, 0, Math.PI * 1.1, Math.PI * 1.85);
        ctx.stroke();

        // --- Arcane rune on lower cone ---
        const hatRuneA = 0.28 + 0.22 * Math.sin(this.animationTime * 2.4 + 0.7);
        ctx.strokeStyle = `rgba(140, 80, 255, ${hatRuneA})`;
        ctx.lineWidth = 0.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.1, -baseSize * 0.48);
        ctx.lineTo(0, -baseSize * 0.66);
        ctx.lineTo(baseSize * 0.1, -baseSize * 0.48);
        ctx.moveTo(-baseSize * 0.12, -baseSize * 0.57);
        ctx.lineTo(baseSize * 0.12, -baseSize * 0.57);
        ctx.stroke();

        // Stars on cone — twinkle
        const hatStarAlpha = 0.5 + 0.5 * Math.sin(this.animationTime * 1.5);
        ctx.fillStyle = `rgba(200, 170, 255, ${hatStarAlpha})`;
        this.drawStarShape(ctx, -baseSize * 0.22, -baseSize * 0.86, baseSize * 0.08);
        ctx.fillStyle = `rgba(255, 215, 80, ${hatStarAlpha * 0.85})`;
        this.drawStarShape(ctx, baseSize * 0.18, -baseSize * 0.62, baseSize * 0.065);

        // Hat tip glow — purple arcane wisp
        ctx.fillStyle = `rgba(80, 0, 180, ${this.staffGlow * 0.45})`;
        ctx.beginPath();
        ctx.arc(tipX, tipY, baseSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(190, 90, 255, ${this.staffGlow * 0.9})`;
        ctx.beginPath();
        ctx.arc(tipX, tipY, baseSize * 0.11, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore(); // hat tilt

        // === LEFT ARM WITH STAFF — wide bell sleeve ===
        const leftShoulderX = -baseSize * 0.52;
        const leftShoulderY = -baseSize * 0.38;
        const leftSwingForward = Math.sin(armSwingFreq) * 0.4;
        const leftElbowX = leftShoulderX - baseSize * 0.2 + leftSwingForward * baseSize * 0.14;
        const leftElbowY = leftShoulderY + baseSize * 0.42;
        const leftWristX = leftElbowX - baseSize * 0.12 + leftSwingForward * baseSize * 0.1;
        const leftWristY = leftElbowY + baseSize * 0.36;

        // Sleeve — filled bell shape, not just a stroke
        ctx.fillStyle = '#0c1848';
        ctx.beginPath();
        ctx.moveTo(leftShoulderX + baseSize * 0.28, leftShoulderY);
        ctx.bezierCurveTo(leftShoulderX + baseSize * 0.1, leftElbowY - baseSize * 0.1, leftWristX + baseSize * 0.26, leftWristY - baseSize * 0.1, leftWristX + baseSize * 0.22, leftWristY + baseSize * 0.06);
        ctx.lineTo(leftWristX - baseSize * 0.22, leftWristY + baseSize * 0.06);
        ctx.bezierCurveTo(leftWristX - baseSize * 0.24, leftWristY - baseSize * 0.1, leftShoulderX - baseSize * 0.1, leftElbowY - baseSize * 0.1, leftShoulderX - baseSize * 0.28, leftShoulderY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#07102a';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        // Sleeve highlight
        ctx.fillStyle = 'rgba(30, 60, 140, 0.35)';
        ctx.beginPath();
        ctx.moveTo(leftShoulderX + baseSize * 0.08, leftShoulderY);
        ctx.bezierCurveTo(leftShoulderX, leftElbowY - baseSize * 0.12, leftWristX + baseSize * 0.05, leftWristY - baseSize * 0.12, leftWristX + baseSize * 0.04, leftWristY);
        ctx.lineTo(leftWristX - baseSize * 0.04, leftWristY);
        ctx.bezierCurveTo(leftWristX - baseSize * 0.05, leftWristY - baseSize * 0.12, leftShoulderX - baseSize * 0.02, leftElbowY - baseSize * 0.14, leftShoulderX - baseSize * 0.08, leftShoulderY);
        ctx.closePath();
        ctx.fill();

        // Gold cuff
        ctx.strokeStyle = '#c8a020';
        ctx.lineWidth = baseSize * 0.12;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(leftWristX - baseSize * 0.22, leftWristY + baseSize * 0.02);
        ctx.lineTo(leftWristX + baseSize * 0.22, leftWristY - baseSize * 0.02);
        ctx.stroke();
        ctx.strokeStyle = '#8a6010';
        ctx.lineWidth = baseSize * 0.06;
        ctx.beginPath();
        ctx.moveTo(leftWristX - baseSize * 0.22, leftWristY + baseSize * 0.1);
        ctx.lineTo(leftWristX + baseSize * 0.22, leftWristY + baseSize * 0.06);
        ctx.stroke();

        // Left hand — bony, pale
        ctx.fillStyle = '#c0a870';
        ctx.beginPath();
        ctx.ellipse(leftWristX, leftWristY + baseSize * 0.16, baseSize * 0.16, baseSize * 0.12, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8a7050';
        ctx.lineWidth = 0.6;
        ctx.stroke();
        // Bony knuckle hints
        ctx.strokeStyle = 'rgba(80,55,25,0.3)';
        ctx.lineWidth = 0.6;
        for (let f = -1; f <= 1; f++) {
            ctx.beginPath();
            ctx.arc(leftWristX + f * baseSize * 0.07, leftWristY + baseSize * 0.12, baseSize * 0.03, 0, Math.PI * 2);
            ctx.stroke();
        }

        this.drawScepter(ctx, leftWristX, leftWristY + baseSize * 0.16, baseSize, leftSwingForward * 0.12);

        // === RIGHT ARM — raised, gesturing ===
        const rightShoulderX = baseSize * 0.52;
        const rightShoulderY = -baseSize * 0.38;
        const rightArmSwing = Math.sin(armSwingFreq + Math.PI) * 0.3;
        const rightArmAngle = Math.PI / 2.2 + rightArmSwing;
        const rightElbowX = rightShoulderX + Math.cos(rightArmAngle) * baseSize * 0.32;
        const rightElbowY = rightShoulderY + Math.sin(rightArmAngle) * baseSize * 0.28;
        const rightWristX = rightElbowX + Math.cos(rightArmAngle) * baseSize * 0.28;
        const rightWristY = rightElbowY + Math.sin(rightArmAngle) * baseSize * 0.28;

        // Right sleeve — same filled bell approach
        ctx.fillStyle = '#0c1848';
        ctx.beginPath();
        ctx.moveTo(rightShoulderX - baseSize * 0.28, rightShoulderY);
        ctx.bezierCurveTo(rightShoulderX - baseSize * 0.1, rightElbowY - baseSize * 0.1, rightWristX - baseSize * 0.24, rightWristY - baseSize * 0.1, rightWristX - baseSize * 0.2, rightWristY + baseSize * 0.06);
        ctx.lineTo(rightWristX + baseSize * 0.2, rightWristY + baseSize * 0.06);
        ctx.bezierCurveTo(rightWristX + baseSize * 0.22, rightWristY - baseSize * 0.1, rightShoulderX + baseSize * 0.1, rightElbowY - baseSize * 0.1, rightShoulderX + baseSize * 0.28, rightShoulderY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#07102a';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.fillStyle = 'rgba(30, 60, 140, 0.35)';
        ctx.beginPath();
        ctx.moveTo(rightShoulderX - baseSize * 0.08, rightShoulderY);
        ctx.bezierCurveTo(rightShoulderX, rightElbowY - baseSize * 0.12, rightWristX - baseSize * 0.05, rightWristY - baseSize * 0.12, rightWristX - baseSize * 0.04, rightWristY);
        ctx.lineTo(rightWristX + baseSize * 0.04, rightWristY);
        ctx.bezierCurveTo(rightWristX + baseSize * 0.05, rightWristY - baseSize * 0.12, rightShoulderX + baseSize * 0.02, rightElbowY - baseSize * 0.14, rightShoulderX + baseSize * 0.08, rightShoulderY);
        ctx.closePath();
        ctx.fill();

        // Gold cuff
        ctx.strokeStyle = '#c8a020';
        ctx.lineWidth = baseSize * 0.12;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(rightWristX - baseSize * 0.2, rightWristY + baseSize * 0.02);
        ctx.lineTo(rightWristX + baseSize * 0.2, rightWristY - baseSize * 0.02);
        ctx.stroke();
        ctx.strokeStyle = '#8a6010';
        ctx.lineWidth = baseSize * 0.06;
        ctx.beginPath();
        ctx.moveTo(rightWristX - baseSize * 0.2, rightWristY + baseSize * 0.1);
        ctx.lineTo(rightWristX + baseSize * 0.2, rightWristY + baseSize * 0.06);
        ctx.stroke();

        // Right hand — gesturing, bony
        ctx.fillStyle = '#c0a870';
        ctx.beginPath();
        ctx.ellipse(rightWristX, rightWristY + baseSize * 0.14, baseSize * 0.16, baseSize * 0.12, -0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8a7050';
        ctx.lineWidth = 0.6;
        ctx.stroke();
        // Arcane energy crackling from right hand
        const crackleA = 0.4 + 0.4 * Math.sin(this.animationTime * 7.5);
        ctx.strokeStyle = `rgba(160, 80, 255, ${crackleA})`;
        ctx.lineWidth = 0.8;
        ctx.lineCap = 'round';
        for (let c = 0; c < 3; c++) {
            const ca = (this.animationTime * 4 + c * 2.1) % (Math.PI * 2);
            ctx.beginPath();
            ctx.moveTo(rightWristX, rightWristY + baseSize * 0.14);
            ctx.lineTo(rightWristX + Math.cos(ca) * baseSize * 0.26, rightWristY + baseSize * 0.14 + Math.sin(ca) * baseSize * 0.22);
            ctx.stroke();
        }
        ctx.fillStyle = `rgba(200, 120, 255, ${crackleA * 0.8})`;
        ctx.beginPath();
        ctx.arc(rightWristX, rightWristY + baseSize * 0.14, baseSize * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Full-body arcane aura pulse
        ctx.fillStyle = `rgba(80, 0, 160, ${0.05 * this.staffGlow})`;
        ctx.beginPath();
        ctx.ellipse(0, -baseSize * 0.2, baseSize * 1.2, baseSize * 2.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Magic particles (local space)
        const colorTable = MageEnemy._getColorTable();
        for (let i = 0; i < this.magicParticles.length; i++) {
            const particle = this.magicParticles[i];
            ctx.fillStyle = colorTable[particle.colorIdx][Math.round(particle.life / particle.maxLife * 80)];
            ctx.beginPath();
            ctx.arc(particle.localX, particle.localY, particle.size, 0, Math.PI * 2);
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

        // Health bar - positioned above hat tip
        this.renderHealthBar(ctx, baseSize, { widthMul: 3.2, heightMul: 0.42, yOffsetMul: -3.8 });
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

        const shaftLength = baseSize * 2.4;
        const shaftWidth = baseSize * 0.22;

        // === SHAFT — dark gnarled wood ===
        // Outer dark silhouette
        ctx.fillStyle = '#12080a';
        ctx.fillRect(-shaftWidth / 2 - 1.5, -shaftLength * 1.02, shaftWidth + 3, shaftLength);

        // Main shaft body — dark reddish-brown
        ctx.fillStyle = '#3a1c0e';
        ctx.fillRect(-shaftWidth / 2, -shaftLength, shaftWidth, shaftLength);

        // Shaft warm highlight stripe
        ctx.fillStyle = '#5c2e18';
        ctx.fillRect(-shaftWidth / 2 + 1, -shaftLength, shaftWidth * 0.38, shaftLength * 0.98);

        // Shaft grain lines — gnarled wood
        ctx.strokeStyle = '#1e0c06';
        ctx.lineWidth = 0.6;
        for (let i = 1; i <= 6; i++) {
            const gy = -shaftLength + (shaftLength * i / 7);
            ctx.beginPath();
            ctx.moveTo(-shaftWidth / 2 + 1, gy);
            ctx.lineTo(shaftWidth / 2 - 1, gy + baseSize * 0.08);
            ctx.stroke();
        }

        // Subtle arcane rune carved into shaft — glowing faintly
        const shaftRuneA = 0.2 + 0.15 * Math.sin(this.animationTime * 3.1);
        ctx.strokeStyle = `rgba(120, 60, 220, ${shaftRuneA})`;
        ctx.lineWidth = 0.7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-shaftWidth / 2 + 1, -shaftLength * 0.38);
        ctx.lineTo(shaftWidth / 2 - 1, -shaftLength * 0.42);
        ctx.moveTo(0, -shaftLength * 0.32);
        ctx.lineTo(0, -shaftLength * 0.48);
        ctx.stroke();

        // === GRIP SECTION — wrapped dark leather ===
        const gripY = -shaftLength * 0.55;
        const gripH = baseSize * 0.52;
        ctx.fillStyle = '#100808';
        ctx.fillRect(-shaftWidth / 2 - 2, gripY, shaftWidth + 4, gripH);

        ctx.strokeStyle = '#8a6010';
        ctx.lineWidth = 1.1;
        for (let i = 0; i <= 5; i++) {
            const wy = gripY + (gripH * i / 5);
            ctx.beginPath();
            ctx.moveTo(-shaftWidth / 2 - 2, wy);
            ctx.lineTo(shaftWidth / 2 + 2, wy + baseSize * 0.04);
            ctx.stroke();
        }

        // Dark metal bands — 4 evenly spaced, more ornate
        for (let i = 0; i < 4; i++) {
            const bY = -shaftLength * 0.18 - shaftLength * 0.2 * i;
            // Band shadow
            ctx.fillStyle = '#2a1800';
            ctx.fillRect(-shaftWidth / 2 - 2.5, bY, shaftWidth + 5, baseSize * 0.14);
            // Band gold face
            ctx.fillStyle = '#8a6010';
            ctx.fillRect(-shaftWidth / 2 - 2, bY + 1, shaftWidth + 4, baseSize * 0.1);
            // Band highlight
            ctx.fillStyle = '#c8a020';
            ctx.fillRect(-shaftWidth / 2 - 1, bY + 1, shaftWidth + 2, baseSize * 0.04);
        }

        // === CROWN HEAD — 5-prong dark iron crown ===
        const headCY = -shaftLength - baseSize * 0.26;

        // Crown base collar
        ctx.fillStyle = '#1a1000';
        ctx.beginPath();
        ctx.arc(0, headCY + baseSize * 0.28, shaftWidth * 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8a6010';
        ctx.beginPath();
        ctx.arc(0, headCY + baseSize * 0.28, shaftWidth * 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#4a3000';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // 5 prongs — dark iron, pointed
        ctx.lineCap = 'round';
        const prongAngles = [-Math.PI / 2, -Math.PI / 2 - 0.55, -Math.PI / 2 + 0.55, -Math.PI / 2 - 1.1, -Math.PI / 2 + 1.1];
        const prongLengths = [baseSize * 0.78, baseSize * 0.56, baseSize * 0.56, baseSize * 0.38, baseSize * 0.38];
        for (let k = 0; k < 5; k++) {
            const px = Math.cos(prongAngles[k]) * prongLengths[k];
            const py = headCY + baseSize * 0.28 + Math.sin(prongAngles[k]) * prongLengths[k];
            // Prong shadow
            ctx.strokeStyle = '#0a0800';
            ctx.lineWidth = shaftWidth * 0.7;
            ctx.beginPath();
            ctx.moveTo(0.5, headCY + baseSize * 0.3);
            ctx.lineTo(px + 0.5, py + 0.5);
            ctx.stroke();
            // Prong body
            ctx.strokeStyle = '#6a5010';
            ctx.lineWidth = shaftWidth * 0.55;
            ctx.beginPath();
            ctx.moveTo(0, headCY + baseSize * 0.28);
            ctx.lineTo(px, py);
            ctx.stroke();
            // Prong tip glow
            ctx.fillStyle = `rgba(160, 80, 255, ${this.staffPulse * 0.85})`;
            ctx.beginPath();
            ctx.arc(px, py, baseSize * 0.08, 0, Math.PI * 2);
            ctx.fill();
        }

        // === CRYSTAL ORB — dark amethyst, large and menacing ===
        const orbY = headCY - baseSize * 0.1;
        const orbR = baseSize * 0.42;

        // Outer glow halo — cached
        if (!this._crystalGlow || this._crystalGlowBaseSize !== baseSize || this._crystalGlowCtx !== ctx) {
            this._crystalGlowCtx = ctx;
            this._crystalGlowBaseSize = baseSize;
            this._crystalGlow = ctx.createRadialGradient(0, orbY, orbR * 0.1, 0, orbY, orbR * 2.6);
            this._crystalGlow.addColorStop(0, 'rgba(140, 60, 255, 0.65)');
            this._crystalGlow.addColorStop(0.5, 'rgba(80, 0, 180, 0.2)');
            this._crystalGlow.addColorStop(1, 'rgba(30, 0, 80, 0)');
        }
        ctx.fillStyle = this._crystalGlow;
        const prevGlobalAlpha = ctx.globalAlpha;
        ctx.globalAlpha = prevGlobalAlpha * this.staffPulse;
        ctx.beginPath();
        ctx.arc(0, orbY, orbR * 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = prevGlobalAlpha;

        // Main orb body — deep purple-black
        ctx.fillStyle = `rgba(40, 0, 100, ${0.88 + 0.1 * this.staffPulse})`;
        ctx.beginPath();
        ctx.arc(0, orbY, orbR, 0, Math.PI * 2);
        ctx.fill();

        // Inner swirling purple layer
        ctx.fillStyle = `rgba(100, 20, 200, ${0.55 + 0.3 * this.staffPulse})`;
        ctx.beginPath();
        ctx.arc(-orbR * 0.1, orbY + orbR * 0.05, orbR * 0.62, 0, Math.PI * 2);
        ctx.fill();

        // Orb rim — violet
        ctx.strokeStyle = `rgba(180, 80, 255, ${0.7 + 0.3 * this.staffPulse})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Inner bright arcane core
        ctx.fillStyle = `rgba(220, 160, 255, ${0.4 + 0.45 * this.staffPulse})`;
        ctx.beginPath();
        ctx.arc(-orbR * 0.14, orbY - orbR * 0.1, orbR * 0.38, 0, Math.PI * 2);
        ctx.fill();

        // Specular highlight
        ctx.fillStyle = `rgba(255, 230, 255, ${0.6 + 0.35 * this.staffPulse})`;
        ctx.beginPath();
        ctx.arc(-orbR * 0.32, orbY - orbR * 0.34, orbR * 0.18, 0, Math.PI * 2);
        ctx.fill();

        // Secondary mini highlight
        ctx.fillStyle = `rgba(255, 200, 255, ${0.25 * this.staffPulse})`;
        ctx.beginPath();
        ctx.arc(orbR * 0.22, orbY + orbR * 0.22, orbR * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Rune etched inside orb — visible through translucent crystal
        const innerRuneA = 0.18 + 0.14 * Math.sin(this.animationTime * 2.8 + 1.6);
        ctx.strokeStyle = `rgba(220, 180, 255, ${innerRuneA})`;
        ctx.lineWidth = 0.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, orbY - orbR * 0.5);
        ctx.lineTo(orbR * 0.4, orbY + orbR * 0.3);
        ctx.lineTo(-orbR * 0.4, orbY + orbR * 0.3);
        ctx.closePath();
        ctx.stroke();

        // Orbiting energy shards — 3, faster and sharper
        for (let i = 0; i < 3; i++) {
            const orbitAngle = (this.animationTime * 3.2) + (i * Math.PI * 2 / 3);
            const orbitX = Math.cos(orbitAngle) * orbR * 1.7;
            const orbitOY = orbY + Math.sin(orbitAngle) * orbR * 1.7;

            ctx.fillStyle = `rgba(160, 60, 255, ${this.staffPulse * 0.55})`;
            ctx.beginPath();
            ctx.arc(orbitX, orbitOY, baseSize * 0.12, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = `rgba(220, 160, 255, ${this.staffPulse * 0.85})`;
            ctx.beginPath();
            ctx.arc(orbitX, orbitOY, baseSize * 0.065, 0, Math.PI * 2);
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
}
