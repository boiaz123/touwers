import { Tower } from './Tower.js';
import { ObjectPool } from '../../core/ObjectPool.js';

const BASE_SLOW_EFFECT = 0.7;

export class CombinationTower extends Tower {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY);
        this.range = 140;
        this.damage = 55;
        this.fireRate = 0.9;
        this.originalRange = 140;
        
        // Combination spell system
        this.selectedSpell = null; // Will be set to first unlocked spell
        this.availableSpells = []; // Set by tower manager when academy provides spells
        this.combinationBonuses = {
            steam: { damageBonus: 0, slowBonus: 0 },
            magma: { damageBonus: 0, piercingBonus: 0 },
            tempest: { chainRange: 0, slowBonus: 0 },
            meteor: { chainRange: 0, piercingBonus: 0 }
        };
        
        // Animation properties
        this.animationTime = 0;
        this.crystalPulse = 0;
        this.runeRotation = 0;
        this.lightningBolts = [];
        // Phase 5: reuse bolt/particle objects across casts instead of allocating a fresh
        // literal every time - acquire() at each push() site, release() once an entry is
        // dropped from update()'s compaction loops below. The bolt factory's fields are the
        // union of every field set by any of the 5 effect generators (createBasicArcaneEffect/
        // createSteamEffect/createMagmaEffect/createTempestEffect/createMeteorEffect) below -
        // each generator explicitly resets the isMagma/isTempest/isMeteor/size fields it
        // doesn't use back to their default so a reused bolt never leaks a stale variant flag.
        this._lightningBoltPool = new ObjectPool(() => ({
            startX: 0, startY: 0, endX: 0, endY: 0, life: 0, maxLife: 0,
            segments: null, color: '', size: 0,
            isMagma: false, isTempest: false, isMeteor: false
        }));
        this.magicParticles = [];
        this._magicParticlePool = new ObjectPool(() => ({
            x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, size: 0, maxSize: 0, color: ''
        }));
        this.runePositions = [];
        
        // Initialize floating runes
        for (let i = 0; i < 6; i++) {
            this.runePositions.push({
                angle: (i / 6) * Math.PI * 2,
                radius: 40,
                floatOffset: Math.random() * Math.PI * 2,
                symbol: ['◊', '☆', '◇', '※', '❋', '⚡'][i]
            });
        }

        // Set by TowerRenderAdapter once it has baked/synced this tower via Pixi (particles/
        // bolts/attack-radius still draw here regardless - not migrated yet). Unlike
        // MagicTower, the base/cylinder/coil colors depend on selectedSpell (changeable at
        // runtime via setSpell()), so they can't be safely shared-baked per campaign the
        // same way - they're Strategy B (dynamic) here instead, only the shadow is static.
        this.skipCanvas2DBodyRender = false;
    }
    
    setAvailableSpells(spells) {
        this.availableSpells = spells;
        if (spells.length > 0 && !this.selectedSpell) {
            this.selectedSpell = spells[0].id;
            this._applySpellStats(spells[0].id);
        }
    }

    _applySpellStats(spellId) {
        const stats = {
            steam:   { damage: 45, fireRate: 1.0 },
            magma:   { damage: 70, fireRate: 0.7 },
            tempest: { damage: 30, fireRate: 1.1 },
            meteor:  { damage: 50, fireRate: 0.8 }
        };
        const s = stats[spellId];
        if (s) {
            this.damage = s.damage;
            this.fireRate = s.fireRate;
            this.originalDamage = s.damage;
            this.originalFireRate = s.fireRate;
        }
    }
    
    update(deltaTime, enemies) {
        super.update(deltaTime, enemies);
        this.enemies = enemies; // Store for use in chainLightning
        
        this.crystalPulse = 0.5 + 0.5 * Math.sin(this.animationTime * 3);
        this.runeRotation += deltaTime * 0.5;
        
        if (this.target && this.cooldown === 0) {
            this.shoot();
            this.cooldown = 1 / this.fireRate;
        }
        
        // Update lightning bolts (compact in-place)
        let boltWrite = 0;
        for (let i = 0; i < this.lightningBolts.length; i++) {
            const bolt = this.lightningBolts[i];
            bolt.life -= deltaTime;
            if (bolt.life > 0) {
                this.lightningBolts[boltWrite++] = bolt;
            } else {
                this._lightningBoltPool.release(bolt);
            }
        }
        this.lightningBolts.length = boltWrite;
        
        // Update magic particles (compact in-place, capped at 200)
        let pWrite = 0;
        for (let i = 0; i < this.magicParticles.length; i++) {
            const particle = this.magicParticles[i];
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            if (particle.life > 0) {
                particle.size = particle.maxSize * (particle.life / particle.maxLife);
                this.magicParticles[pWrite++] = particle;
            } else {
                this._magicParticlePool.release(particle);
            }
        }
        this.magicParticles.length = pWrite;

        // Generate ambient magic particles (skip if already at cap)
        if (this.magicParticles.length < 200 && Math.random() < deltaTime * 3) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 50 + 20;
            const particle = this._magicParticlePool.acquire();
            particle.x = this.x + Math.cos(angle) * radius;
            particle.y = this.y + Math.sin(angle) * radius;
            particle.vx = (Math.random() - 0.5) * 50;
            particle.vy = (Math.random() - 0.5) * 50 - 30;
            particle.life = 2;
            particle.maxLife = 2;
            particle.size = 0;
            particle.maxSize = Math.random() * 4 + 2;
            particle.color = Math.random() < 0.5 ? 'rgba(138, 43, 226, ' : 'rgba(75, 0, 130, ';
            this.magicParticles.push(particle);
        }
    }
    
    chainToNearbyEnemies(originalTarget, damage, damageType) {
        const chainRange = 100;
        if (!this.enemies) return;
        
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            if (enemy !== originalTarget && !enemy.isDead()) {
                const dist = Math.hypot(enemy.x - originalTarget.x, enemy.y - originalTarget.y);
                if (dist <= chainRange) {
                    const chainDamage = Math.floor(damage * 0.5);
                    enemy.takeDamage(chainDamage, 0, damageType);
                }
            }
        }
    }
    
    shoot() {
        if (this.target) {
            let finalDamage = this.damage;
            
            // Play combination tower sound
            if (this.audioManager) {
                this.audioManager.playSFX('combination-tower');
            }
            
            // If a spell is selected, use combination effects, otherwise do basic attack
            if (this.selectedSpell) {
                const spell = this.combinationBonuses[this.selectedSpell];
                
                // Apply combination spell effects
                switch(this.selectedSpell) {
                    case 'steam':
                        finalDamage += spell.damageBonus;
                        this.target.takeDamage(finalDamage, 0, 'fire');
                        // Burn effect
                        if (this.target.burnTimer) {
                            this.target.burnTimer = Math.max(this.target.burnTimer, 3);
                        } else {
                            this.target.burnTimer = 3;
                            this.target.burnDamage = 5;
                        }
                        // Slow effect
                        const baseSlowEffect = BASE_SLOW_EFFECT;
                        const enhancedSlowEffect = Math.max(0.3, baseSlowEffect - spell.slowBonus);
                        if (this.target.speed > 20) {
                            this.target.speed *= enhancedSlowEffect;
                        }
                        break;
                        
                    case 'magma':
                        finalDamage += spell.damageBonus;
                        const piercingDamage = finalDamage + spell.piercingBonus;
                        this.target.takeDamage(piercingDamage, 100, 'earth'); // Earth damage with armor piercing
                        // Burn effect
                        if (this.target.burnTimer) {
                            this.target.burnTimer = Math.max(this.target.burnTimer, 3);
                        } else {
                            this.target.burnTimer = 3;
                            this.target.burnDamage = 5;
                        }
                        break;
                        
                    case 'tempest':
                        this.target.takeDamage(finalDamage, 0, 'air');
                        // Slow effect
                        const slowEffect = Math.max(0.3, 0.7 - spell.slowBonus);
                        if (this.target.speed > 20) {
                            this.target.speed *= slowEffect;
                        }
                        // Chain to nearby enemies
                        this.chainToNearbyEnemies(this.target, finalDamage, 'air');
                        break;
                        
                    case 'meteor':
                        const meteorPiercingDamage = finalDamage + spell.piercingBonus;
                        this.target.takeDamage(meteorPiercingDamage, 100, 'earth'); // Earth damage with armor piercing
                        // Chain to nearby enemies (splash damage)
                        this.chainToNearbyEnemies(this.target, meteorPiercingDamage, 'earth');
                        break;
                }
                
                // Create visual effect
                this.createCombinationEffect();
            } else {
                // Default arcane blast with no spell selected
                this.target.takeDamage(finalDamage, 0, 'magic');
                // Create basic arcane effect
                this.createBasicArcaneEffect();
            }
        }
    }
    
    createCombinationEffect() {
        if (!this.target) return;
        
        switch(this.selectedSpell) {
            case 'steam':
                this.createSteamEffect();
                break;
            case 'magma':
                this.createMagmaEffect();
                break;
            case 'tempest':
                this.createTempestEffect();
                break;
            case 'meteor':
                this.createMeteorEffect();
                break;
        }
    }
    
    createBasicArcaneEffect() {
        if (!this.target) return;
        
        // Blue arcane bolt from tower to target
        const segments = 4;
        for (let i = 0; i < segments; i++) {
            const progress = i / segments;
            const delay = progress * 0.3;
            
            const bolt = this._lightningBoltPool.acquire();
            bolt.startX = this.x;
            bolt.startY = this.y;
            bolt.endX = this.target.x;
            bolt.endY = this.target.y;
            bolt.life = 0.3 - delay;
            bolt.maxLife = 0.3;
            bolt.segments = [{
                fromX: this.x + (this.target.x - this.x) * progress,
                fromY: this.y + (this.target.y - this.y) * progress,
                toX: this.x + (this.target.x - this.x) * (progress + 0.25),
                toY: this.y + (this.target.y - this.y) * (progress + 0.25)
            }];
            bolt.color = 'rgba(100, 150, 255, ';
            bolt.size = 6;
            bolt.isMagma = false;
            bolt.isTempest = false;
            bolt.isMeteor = false;
            this.lightningBolts.push(bolt);
        }

        // Arcane burst at target
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const speed = 50 + Math.random() * 40;
            const particle = this._magicParticlePool.acquire();
            particle.x = this.target.x;
            particle.y = this.target.y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed - 20;
            particle.life = 1;
            particle.maxLife = 1;
            particle.size = 0;
            particle.maxSize = 5 + Math.random() * 4;
            particle.color = 'rgba(100, 150, 255, ';
            this.magicParticles.push(particle);
        }
    }
    
    createSteamEffect() {
        // Swirling steam clouds from tower to target
        const cloudCount = 8;
        for (let i = 0; i < cloudCount; i++) {
            const progress = i / cloudCount;
            const x = this.x + (this.target.x - this.x) * progress;
            const y = this.y + (this.target.y - this.y) * progress;
            const swirl = Math.sin(progress * Math.PI * 3) * 20;

            const particle = this._magicParticlePool.acquire();
            particle.x = x + swirl;
            particle.y = y;
            particle.vx = (Math.random() - 0.5) * 30;
            particle.vy = -Math.random() * 20;
            particle.life = 1.5;
            particle.maxLife = 1.5;
            particle.size = 0;
            particle.maxSize = 12 + Math.random() * 8;
            particle.color = i % 2 === 0 ? 'rgba(100, 200, 255, ' : 'rgba(255, 100, 50, ';
            this.magicParticles.push(particle);
        }

        // Impact steam burst
        for (let i = 0; i < 15; i++) {
            const angle = (i / 15) * Math.PI * 2;
            const speed = 80 + Math.random() * 40;
            const particle = this._magicParticlePool.acquire();
            particle.x = this.target.x;
            particle.y = this.target.y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed - 30;
            particle.life = 2;
            particle.maxLife = 2;
            particle.size = 0;
            particle.maxSize = 10 + Math.random() * 6;
            particle.color = 'rgba(200, 220, 255, ';
            this.magicParticles.push(particle);
        }
    }
    
    createMagmaEffect() {
        // Molten projectile
        const projectileLife = 0.5;
        const segments = 6;
        
        for (let i = 0; i < segments; i++) {
            const progress = i / segments;
            const delay = progress * projectileLife;

            const bolt = this._lightningBoltPool.acquire();
            bolt.startX = this.x;
            bolt.startY = this.y;
            bolt.endX = this.target.x;
            bolt.endY = this.target.y;
            bolt.life = projectileLife - delay;
            bolt.maxLife = projectileLife;
            bolt.segments = [{
                fromX: this.x + (this.target.x - this.x) * progress,
                fromY: this.y + (this.target.y - this.y) * progress,
                toX: this.x + (this.target.x - this.x) * (progress + 0.2),
                toY: this.y + (this.target.y - this.y) * (progress + 0.2)
            }];
            bolt.color = 'rgba(255, 100, 0, ';
            bolt.isMagma = true;
            bolt.isTempest = false;
            bolt.isMeteor = false;
            bolt.size = 8;
            this.lightningBolts.push(bolt);
        }

        // Lava splatter on impact
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const speed = 60 + Math.random() * 80;
            const size = 6 + Math.random() * 6;

            const particle = this._magicParticlePool.acquire();
            particle.x = this.target.x;
            particle.y = this.target.y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed - 40;
            particle.life = 1.5;
            particle.maxLife = 1.5;
            particle.size = 0;
            particle.maxSize = size;
            particle.color = i % 3 === 0 ? 'rgba(255, 69, 0, ' : (i % 3 === 1 ? 'rgba(255, 140, 0, ' : 'rgba(139, 69, 19, ');
            this.magicParticles.push(particle);
        }

        // Ground burn effect
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const distance = 15 + Math.random() * 10;

            const particle = this._magicParticlePool.acquire();
            particle.x = this.target.x + Math.cos(angle) * distance;
            particle.y = this.target.y + Math.sin(angle) * distance;
            particle.vx = 0;
            particle.vy = -10;
            particle.life = 2;
            particle.maxLife = 2;
            particle.size = 0;
            particle.maxSize = 8;
            particle.color = 'rgba(255, 50, 0, ';
            this.magicParticles.push(particle);
        }
    }
    
    createTempestEffect() {
        // Lightning bolts with jagged path
        const boltCount = 3;
        for (let b = 0; b < boltCount; b++) {
            const offset = (b - 1) * 15;
            const bolt = this._lightningBoltPool.acquire();
            bolt.startX = this.x;
            bolt.startY = this.y;
            bolt.endX = this.target.x + offset;
            bolt.endY = this.target.y;
            bolt.life = 0.4;
            bolt.maxLife = 0.4;
            bolt.segments = this.generateLightningSegments(this.x, this.y, this.target.x + offset, this.target.y);
            bolt.color = 'rgba(255, 255, 100, ';
            bolt.isMagma = false;
            bolt.isTempest = true;
            bolt.isMeteor = false;
            this.lightningBolts.push(bolt);
        }

        // Wind swirl particles
        for (let i = 0; i < 25; i++) {
            const angle = (i / 25) * Math.PI * 4; // Multiple spirals
            const radius = (i / 25) * 80;
            const x = this.target.x + Math.cos(angle) * radius;
            const y = this.target.y + Math.sin(angle) * radius;

            const particle = this._magicParticlePool.acquire();
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle + Math.PI / 2) * 120;
            particle.vy = Math.sin(angle + Math.PI / 2) * 120 - 20;
            particle.life = 1;
            particle.maxLife = 1;
            particle.size = 0;
            particle.maxSize = 4;
            particle.color = 'rgba(200, 220, 255, ';
            this.magicParticles.push(particle);
        }

        // Water droplets
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 60;

            const particle = this._magicParticlePool.acquire();
            particle.x = this.target.x;
            particle.y = this.target.y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed - 30;
            particle.life = 1.5;
            particle.maxLife = 1.5;
            particle.size = 0;
            particle.maxSize = 6;
            particle.color = 'rgba(100, 150, 255, ';
            this.magicParticles.push(particle);
        }
    }
    
    createMeteorEffect() {
        // Falling meteor from above
        const meteorStartY = this.target.y - 200;
        
        // Meteor trail
        for (let i = 0; i < 10; i++) {
            const progress = i / 10;
            const trailX = this.target.x + (Math.random() - 0.5) * 20;
            const trailY = meteorStartY + (this.target.y - meteorStartY) * progress;

            const particle = this._magicParticlePool.acquire();
            particle.x = trailX;
            particle.y = trailY;
            particle.vx = (Math.random() - 0.5) * 20;
            particle.vy = 100 + Math.random() * 50;
            particle.life = 0.8;
            particle.maxLife = 0.8;
            particle.size = 0;
            particle.maxSize = 8 + Math.random() * 6;
            particle.color = i % 2 === 0 ? 'rgba(255, 140, 0, ' : 'rgba(139, 69, 19, ';
            this.magicParticles.push(particle);
        }

        // Meteor body (large projectile)
        const meteorBolt = this._lightningBoltPool.acquire();
        meteorBolt.startX = this.target.x;
        meteorBolt.startY = meteorStartY;
        meteorBolt.endX = this.target.x;
        meteorBolt.endY = this.target.y;
        meteorBolt.life = 0.5;
        meteorBolt.maxLife = 0.5;
        meteorBolt.segments = [{
            fromX: this.target.x,
            fromY: meteorStartY,
            toX: this.target.x,
            toY: this.target.y
        }];
        meteorBolt.color = 'rgba(200, 100, 50, ';
        meteorBolt.isMagma = false;
        meteorBolt.isTempest = false;
        meteorBolt.isMeteor = true;
        meteorBolt.size = 15;
        this.lightningBolts.push(meteorBolt);

        // Impact crater effect
        for (let ring = 0; ring < 3; ring++) {
            const particleCount = 12 + ring * 6;
            const ringRadius = 30 + ring * 20;

            for (let i = 0; i < particleCount; i++) {
                const angle = (i / particleCount) * Math.PI * 2;
                const speed = 60 + ring * 30;

                const particle = this._magicParticlePool.acquire();
                particle.x = this.target.x;
                particle.y = this.target.y;
                particle.vx = Math.cos(angle) * speed;
                particle.vy = Math.sin(angle) * speed - 20;
                particle.life = 1.5 + ring * 0.3;
                particle.maxLife = 1.5 + ring * 0.3;
                particle.size = 0;
                particle.maxSize = 8 - ring * 2;
                particle.color = ring % 2 === 0 ? 'rgba(139, 90, 43, ' : 'rgba(160, 82, 45, ';
                this.magicParticles.push(particle);
            }
        }

        // Dust cloud
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 30;

            const particle = this._magicParticlePool.acquire();
            particle.x = this.target.x + Math.cos(angle) * distance;
            particle.y = this.target.y + Math.sin(angle) * distance;
            particle.vx = Math.cos(angle) * 30;
            particle.vy = -40 - Math.random() * 20;
            particle.life = 2;
            particle.maxLife = 2;
            particle.size = 0;
            particle.maxSize = 12;
            particle.color = 'rgba(139, 115, 85, ';
            this.magicParticles.push(particle);
        }
    }
    
    setSpell(spellId) {
        if (this.availableSpells.some(s => s.id === spellId)) {
            this.selectedSpell = spellId;
            this._applySpellStats(spellId);
            return true;
        }
        return false;
    }
    
    generateLightningSegments(startX, startY, endX, endY) {
        const segments = [];
        const segmentCount = 8;
        const variance = 20;
        
        let currentX = startX;
        let currentY = startY;
        
        for (let i = 1; i <= segmentCount; i++) {
            const t = i / segmentCount;
            let targetX = startX + (endX - startX) * t;
            let targetY = startY + (endY - startY) * t;
            
            if (i < segmentCount) {
                targetX += (Math.random() - 0.5) * variance;
                targetY += (Math.random() - 0.5) * variance;
            }
            
            segments.push({
                fromX: currentX,
                fromY: currentY,
                toX: targetX,
                toY: targetY
            });
            
            currentX = targetX;
            currentY = targetY;
        }
        
        return segments;
    }
    
    isClickable(x, y, towerSize) {
        return Math.hypot(this.x - x, this.y - y) <= towerSize/2;
    }
    
    applySpellBonuses(bonuses) {
        Object.assign(this.combinationBonuses, bonuses);
    }
    
    getCombinationColor() {
        switch(this.selectedSpell) {
            case 'steam': return 'rgba(100, 200, 255, ';
            case 'magma': return 'rgba(255, 100, 50, ';
            case 'tempest': return 'rgba(255, 255, 100, ';
            case 'meteor': return 'rgba(200, 100, 50, ';
            default: return 'rgba(138, 43, 226, ';
        }
    }
    
    render(ctx) {
        const cellSize = this.getCellSize(ctx);
        const towerSize = cellSize * 2;

        if (!this.skipCanvas2DBodyRender) {
            this.renderStaticBack(ctx, towerSize);
            this.renderDynamicParts(ctx, towerSize);
            this.renderProjectiles(ctx);
        }

        // Not yet migrated - selection-dependent, cheap, always drawn on Canvas2D on top.
        this.renderAttackRadiusCircle(ctx);
    }

    /** Phase 5: particles/bolts - present so TowerRenderAdapter.sync() can call this through the same shim used for renderDynamicParts, preserving draw order (body, then effects on top). */
    renderProjectiles(ctx) {
        this.renderParticlesAndBolts(ctx);
    }

    /** No front-of-tower environment decoration for this type - present for TowerRenderAdapter's uniform convention. */
    renderStaticFront(ctx, towerSize) {
        // intentionally empty
    }

    /** Strategy A (baked once per campaign, shared across instances): drop shadow only - see constructor comment for why the rest is dynamic here. */
    renderStaticBack(ctx, towerSize) {
        // 3D shadow
        ctx.fillStyle = 'rgba(75, 0, 130, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x + 3, this.y + 3, towerSize * 0.35, 0, Math.PI * 2);
        ctx.fill();
    }

    /** Strategy B (per-instance Graphics, redrawn every frame): base/cylinder/coil/windows - colored by selectedSpell (runtime-changeable) and pulse-animated. */
    renderDynamicParts(ctx, towerSize) {
        const baseRadius = towerSize * 0.35;
        const towerHeight = towerSize * 0.5;
        
        // Tower foundation (using combination color instead of purple)
        const combinationColor = this.getCombinationColor();
        
        ctx.fillStyle = combinationColor + '0.8)';
        ctx.strokeStyle = combinationColor + '1)';
        ctx.lineWidth = 2;
        
        // Draw octagonal tower base
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = this.x + Math.cos(angle) * baseRadius;
            const y = this.y + Math.sin(angle) * baseRadius;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Tower cylinder (combination colored)
        ctx.beginPath();
        ctx.arc(this.x, this.y - towerHeight/2, baseRadius * 0.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Stone blocks texture
        ctx.strokeStyle = '#2E0A4F';
        ctx.lineWidth = 1;
        for (let ring = 0; ring < 4; ring++) {
            const ringY = this.y - towerHeight + (ring * towerHeight/4);
            ctx.beginPath();
            ctx.arc(this.x, ringY, baseRadius * 0.85, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Mystical windows with combination glow
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const windowX = this.x + Math.cos(angle) * baseRadius * 0.7;
            const windowY = this.y - towerHeight/2;
            
            ctx.fillStyle = combinationColor + `${this.crystalPulse * 0.5})`;
            ctx.beginPath();
            ctx.arc(windowX, windowY, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#2E0A4F';
            ctx.beginPath();
            ctx.arc(windowX, windowY, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Tesla coil base (similar to MagicTower but with combination coloring)
        const coilBaseRadius = baseRadius * 0.6;
        const coilBaseY = this.y - towerHeight;
        
        ctx.fillStyle = combinationColor + '0.7)';
        ctx.strokeStyle = combinationColor + '1)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, coilBaseY, coilBaseRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    /** Phase 5: particles/bolts - drawn via renderProjectiles() above, inside the Pixi shim when active, or directly on Canvas2D otherwise. */
    renderParticlesAndBolts(ctx) {
        // Render magic particles with combination colors
        for (let i = 0; i < this.magicParticles.length; i++) {
            const particle = this.magicParticles[i];
            const alpha = particle.life / particle.maxLife;
            ctx.fillStyle = particle.color + alpha + ')';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Render lightning bolts with unique styles
        for (let bIdx = 0; bIdx < this.lightningBolts.length; bIdx++) {
            const bolt = this.lightningBolts[bIdx];
            const alpha = bolt.life / bolt.maxLife;
            
            if (bolt.isMagma) {
                // Render magma projectile as glowing orb
                ctx.save();
                const progress = 1 - (bolt.life / bolt.maxLife);
                const currentX = bolt.startX + (bolt.endX - bolt.startX) * progress;
                const currentY = bolt.startY + (bolt.endY - bolt.startY) * progress;
                
                // Glow
                ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.5})`;
                ctx.beginPath();
                ctx.arc(currentX, currentY, bolt.size * 2, 0, Math.PI * 2);
                ctx.fill();
                
                // Core
                ctx.fillStyle = `rgba(255, 200, 0, ${alpha})`;
                ctx.beginPath();
                ctx.arc(currentX, currentY, bolt.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            } else if (bolt.isMeteor) {
                // Render meteor as falling rock
                ctx.save();
                const progress = 1 - (bolt.life / bolt.maxLife);
                const currentX = bolt.startX + (bolt.endX - bolt.startX) * progress;
                const currentY = bolt.startY + (bolt.endY - bolt.startY) * progress;
                
                // Fiery glow
                ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.5})`;
                ctx.beginPath();
                ctx.arc(currentX, currentY, bolt.size * 2, 0, Math.PI * 2);
                ctx.fill();
                
                // Meteor body
                ctx.fillStyle = `rgba(139, 69, 19, ${alpha})`;
                ctx.beginPath();
                ctx.arc(currentX, currentY, bolt.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Rocky texture
                ctx.fillStyle = `rgba(160, 82, 45, ${alpha * 0.6})`;
                ctx.beginPath();
                ctx.arc(currentX - bolt.size * 0.3, currentY - bolt.size * 0.3, bolt.size * 0.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            } else if (bolt.isTempest) {
                // Render tempest as jagged lightning
                ctx.strokeStyle = (bolt.color || 'rgba(255, 255, 100, ') + alpha + ')';
                ctx.lineWidth = 3;
                
                for (let s = 0; s < bolt.segments.length; s++) {
                    const segment = bolt.segments[s];
                    ctx.beginPath();
                    ctx.moveTo(segment.fromX, segment.fromY);
                    ctx.lineTo(segment.toX, segment.toY);
                    ctx.stroke();
                }
            } else {
                // Default lightning rendering
                ctx.strokeStyle = (bolt.color || this.getCombinationColor()) + alpha + ')';
                ctx.lineWidth = 4;
                for (let s = 0; s < bolt.segments.length; s++) {
                    const segment = bolt.segments[s];
                    ctx.beginPath();
                    ctx.moveTo(segment.fromX, segment.fromY);
                    ctx.lineTo(segment.toX, segment.toY);
                    ctx.stroke();
                }
            }
        }
    }

    static getInfo() {
        return {
            name: 'Combination Tower',
            description: 'Advanced tower that casts devastating combination spells. Requires Academy Level 1 and gem investments to unlock spells.',
            damage: '55 + combination effects',
            range: '140',
            fireRate: '0.9/sec',
            cost: 750,
            icon: ''
        };
    }
}
