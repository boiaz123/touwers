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
            // Fixed-size, pre-allocated once per bolt slot and mutated in place by
            // generateLightningSegments() every shot instead of being replaced with a fresh
            // array of fresh objects each time (was 8 new object literals per shot, unpooled).
            // segmentCount tracks how many of the 8 pre-allocated slots are actually "live"
            // this shot (the render loop iterates up to this, not segments.length, which
            // always stays 8) - the arcane-bolt effect only needs 1 of the 8 per bolt; keeping
            // the backing array at a fixed size means it never has to be resized/reallocated
            // no matter which effect type reuses this pooled bolt slot next.
            segments: Array.from({ length: 8 }, () => ({ fromX: 0, fromY: 0, toX: 0, toY: 0 })),
            segmentCount: 8,
            color: '', size: 0,
            isMagma: false, isTempest: false, isMeteor: false
        }));
        this.magicParticles = [];
        this._magicParticlePool = new ObjectPool(() => ({
            x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, size: 0, maxSize: 0, color: ''
        }));
        // Ambient idle dust, kept in its own array (sharing _magicParticlePool's generic
        // object shape) so it can be drawn separately from magicParticles - it's rendered
        // first, before the body fill, so it sits behind the tower instead of drifting over
        // it in front like the attack-effect particles/bolts (which stay in magicParticles,
        // still drawn on top via renderParticlesAndBolts - they represent the active attack
        // and should stay visible).
        this.ambientParticles = [];
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

        // Flipped true by TowerRenderAdapter.register() the moment this tower is handed off
        // to Pixi (every tower with a renderStaticBack method gets auto-registered by
        // GameplayState._syncTowerPixi - see TowerRenderAdapter.js). Body + windows + runes +
        // crystal + particles/bolts all then draw through the Pixi shim via
        // renderDynamicParts/renderProjectiles below instead of this Canvas2D render(); only
        // the attack-radius circle stays on Canvas2D on top (cheap, selection-dependent, never
        // migrated - see render() below). The spire body/windows/rune bands/crystal all depend
        // on selectedSpell (changeable at runtime via setSpell()), so they can't be safely
        // shared-baked per campaign - they're Strategy B (dynamic, redrawn per-instance every
        // frame) here instead. The shadow, stone foundation, buttresses, banding, and support
        // struts are spell-independent and stay Strategy A (static/shared, baked once per
        // campaign). Structural language (flattened octagonal base, angled support struts,
        // tapered spire body) is borrowed from SuperWeaponLab.js rather than MagicTower's
        // tesla-coil tower.
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

        // Update ambient dust (compact in-place, same pattern as magicParticles above)
        let aWrite = 0;
        for (let i = 0; i < this.ambientParticles.length; i++) {
            const particle = this.ambientParticles[i];
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            if (particle.life > 0) {
                particle.size = particle.maxSize * (particle.life / particle.maxLife);
                this.ambientParticles[aWrite++] = particle;
            } else {
                this._magicParticlePool.release(particle);
            }
        }
        this.ambientParticles.length = aWrite;

        // Generate ambient dust (skip if already at cap) - drawn behind the tower body via
        // renderAmbientDust(), not mixed into magicParticles/renderParticlesAndBolts.
        if (this.ambientParticles.length < 200 && Math.random() < deltaTime * 3) {
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
            this.ambientParticles.push(particle);
        }
    }
    
    chainToNearbyEnemies(originalTarget, damage, damageType) {
        const chainRange = 100;
        if (!this.enemies) return;

        // OPTIMIZATION: use the spatial grid (injected by TowerManager every frame, same
        // as MagicTower's chainLightning) instead of scanning every enemy - turns O(allEnemies)
        // into O(nearbyEnemies) per cast.
        if (this._spatialGrid) {
            const grid = this._spatialGrid;
            const count = grid.query(originalTarget.x, originalTarget.y, chainRange);
            const buf = grid._queryBuf;
            for (let i = 0; i < count; i++) {
                const enemy = buf[i];
                if (enemy !== originalTarget && !enemy.isDead()) {
                    const dist = Math.hypot(enemy.x - originalTarget.x, enemy.y - originalTarget.y);
                    if (dist <= chainRange) {
                        const chainDamage = Math.floor(damage * 0.5);
                        enemy.takeDamage(chainDamage, 0, damageType);
                    }
                }
            }
        } else {
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
            const seg = bolt.segments[0];
            seg.fromX = this.x + (this.target.x - this.x) * progress;
            seg.fromY = this.y + (this.target.y - this.y) * progress;
            seg.toX = this.x + (this.target.x - this.x) * (progress + 0.25);
            seg.toY = this.y + (this.target.y - this.y) * (progress + 0.25);
            bolt.segmentCount = 1;
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
            // No segments needed - the render loop's isMagma branch draws a glowing orb
            // interpolated from startX/Y+endX/Y+life progress only, never reads bolt.segments.
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
            this.generateLightningSegments(this.x, this.y, this.target.x + offset, this.target.y, bolt.segments);
            bolt.segmentCount = 8; // full chain - reset in case this pooled slot was last a 1-segment arcane bolt
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
        // No segments needed - the render loop's isMeteor branch draws a falling-rock sprite
        // interpolated from startX/Y+endX/Y+life progress only, never reads bolt.segments.
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
    
    /** Mutates the given fixed-size `segments` array in place (see the pool factory above) instead of returning a fresh array of fresh objects every shot. */
    generateLightningSegments(startX, startY, endX, endY, segments) {
        const segmentCount = segments.length;
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

            const seg = segments[i - 1];
            seg.fromX = currentX;
            seg.fromY = currentY;
            seg.toX = targetX;
            seg.toY = targetY;

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

    /** Samples a flattened-ellipse arc as a manual polyline (moveTo/lineTo per segment) rather
     *  than ctx.ellipse(..., rotation, start, end) - Pixi's real Graphics.ellipse() (see
     *  node_modules/pixi.js Graphics.d.ts) only ever takes (x, y, radiusX, radiusY); the shim's
     *  rotation/start/end params get silently dropped, so an ellipse arc call always renders as
     *  a full, uncut ellipse in the actual game despite working in a plain Canvas2D test.
     *  Shared by the base's iron banding (renderStaticBack) and the crystal cluster's
     *  containment halo (renderDynamicParts), both of which need a partial (non-full-circle)
     *  flattened ring. */
    _strokeEllipseArc(ctx, cx, cy, rx, ry, fromAngle, toAngle, steps = 16) {
        ctx.beginPath();
        for (let s = 0; s <= steps; s++) {
            const a = fromAngle + (toAngle - fromAngle) * (s / steps);
            const px = cx + Math.cos(a) * rx;
            const py = cy + Math.sin(a) * ry;
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
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

    /** Splits a getCombinationColor() 'rgba(r, g, b, ' prefix into a lightened and a darkened
     *  flat variant for the spire's two-facet fill in renderDynamicParts - cached by color
     *  string since the color only changes on setSpell(), not every frame. */
    _getFacetColors(combinationColor) {
        if (this._facetColorsKey === combinationColor) return this._facetColorsCache;
        const m = /rgba\((\d+), (\d+), (\d+), $/.exec(combinationColor);
        const [r, g, b] = m ? [+m[1], +m[2], +m[3]] : [138, 43, 226];
        const lighten = (v) => Math.round(v + (255 - v) * 0.4);
        const darken = (v) => Math.round(v * 0.55);
        this._facetColorsKey = combinationColor;
        this._facetColorsCache = {
            light: `rgba(${lighten(r)}, ${lighten(g)}, ${lighten(b)}, 1)`,
            dark: `rgba(${darken(r)}, ${darken(g)}, ${darken(b)}, 1)`
        };
        return this._facetColorsCache;
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

    /** Strategy A (baked once per campaign, shared across instances): shadow + stone foundation
     *  + support struts + banding - all fixed dark stone/metal colors that don't depend on
     *  selectedSpell, so this can be shared-baked instead of redrawn every frame. Structural
     *  language borrowed from SuperWeaponLab.js (flattened octagonal floor-plan base, angled
     *  support struts, partial-arc banding) rather than MagicTower's tesla-coil tower - a
     *  different building silhouette, not a recolor of the same one. */
    renderStaticBack(ctx, towerSize) {
        const baseWidth = towerSize * 0.9;
        const baseFlat = towerSize * 0.16; // vertical squash on the octagon = floor-plan perspective, matching SuperWeaponLab's renderStoneBase
        const baseY = this.y + towerSize * 0.08;

        // Drop shadow, squashed to match the base's own floor-plan flatten ratio
        ctx.fillStyle = 'rgba(15, 8, 25, 0.35)';
        ctx.beginPath();
        ctx.ellipse(this.x + 3, baseY + 3, baseWidth * 0.52, baseFlat * 1.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Octagonal stone foundation - lightened from the original #5c5568/#3d3847/#221f2b
        // (near-black against this level's dark grass, so the whole foundation read as a
        // faint smudge with no visible connection to the spire standing on it).
        const stoneGradient = ctx.createLinearGradient(this.x - baseWidth / 2, baseY - baseFlat, this.x + baseWidth / 2, baseY + baseFlat);
        stoneGradient.addColorStop(0, '#948aa8');
        stoneGradient.addColorStop(0.5, '#655d78');
        stoneGradient.addColorStop(1, '#3a3448');
        ctx.fillStyle = stoneGradient;
        ctx.strokeStyle = '#15131b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
            const x = this.x + Math.cos(angle) * baseWidth / 2;
            const y = baseY + Math.sin(angle) * baseFlat;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Corner buttresses - kept from the original design (fortress-like silhouette,
        // distinct from SuperWeaponLab's plain octagon), re-anchored to the flattened base.
        // Given a small metallic gradient (was a single flat fill) so they read as distinct
        // 3D spikes instead of blending into the foundation's own shadow at typical in-game
        // zoom - cheap to do here since renderStaticBack is baked once per campaign, not
        // redrawn every frame like renderDynamicParts below.
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
            const spikeX = this.x + Math.cos(angle) * baseWidth * 0.46;
            const spikeY = baseY + Math.sin(angle) * baseFlat * 1.15;
            const outX = this.x + Math.cos(angle) * baseWidth * 0.58;
            const outY = baseY + Math.sin(angle) * baseFlat * 1.4 - towerSize * 0.05;

            const buttressGradient = ctx.createLinearGradient(spikeX, spikeY, outX, outY);
            buttressGradient.addColorStop(0, '#6e6b7a');
            buttressGradient.addColorStop(1, '#2c2a35');
            ctx.fillStyle = buttressGradient;

            ctx.beginPath();
            ctx.moveTo(spikeX - towerSize * 0.03, spikeY);
            ctx.lineTo(outX, outY);
            ctx.lineTo(spikeX + towerSize * 0.03, spikeY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        // Top-rim highlight - a light partial arc traced just inside the octagon's own top
        // edge, so the foundation reads as a raised, lit platform the spire actually stands
        // on rather than a flat dark smudge sitting under it.
        ctx.strokeStyle = 'rgba(200, 190, 220, 0.55)';
        ctx.lineWidth = Math.max(1, towerSize * 0.014);
        this._strokeEllipseArc(ctx, this.x, baseY - baseFlat * 0.55, baseWidth * 0.46, baseFlat * 0.5, Math.PI * 1.08, Math.PI * 1.92);

        // Partial-arc banding around the base, echoing SuperWeaponLab's iron bands - flattened
        // to the SAME floor-plan squash ratio as the octagon foundation above (rather than a
        // true circle) so the bands read as wrapping the tower's actual octagonal footprint
        // instead of a mismatched cylinder - a perspective bug the original circular ctx.arc()
        // version had. Sampled as a manual polyline via _strokeEllipseArc rather than
        // ctx.ellipse(..., start, end) since Pixi's real Graphics.ellipse() silently drops
        // rotation/start/end through CanvasGraphicsShim (see the crystal halo below, which hit
        // the same gap).
        const bandRx = towerSize * 0.34;
        const bandRy = bandRx * (baseFlat / (baseWidth / 2));
        ctx.strokeStyle = '#18151d';
        ctx.lineWidth = towerSize * 0.018;
        [0.02, -0.09, -0.20].forEach(fy => {
            this._strokeEllipseArc(ctx, this.x, this.y + towerSize * fy, bandRx, bandRy, Math.PI * 0.78, Math.PI * 2.22);
        });

        // Four angled support struts flanking the spire base, each capped with a small fixed
        // (spell-independent) amethyst stud - a magical echo of SuperWeaponLab's plain wooden
        // beam supports.
        const strutSpecs = [
            { fx: -0.22, fy: 0.03, angle: -0.22 },
            { fx: 0.22, fy: 0.03, angle: 0.22 },
            { fx: -0.16, fy: 0.08, angle: -0.12 },
            { fx: 0.16, fy: 0.08, angle: 0.12 }
        ];
        strutSpecs.forEach(strut => {
            ctx.save();
            ctx.translate(this.x + towerSize * strut.fx, this.y + towerSize * strut.fy);
            ctx.rotate(strut.angle);

            const strutGradient = ctx.createLinearGradient(-towerSize * 0.02, -towerSize * 0.22, towerSize * 0.02, 0);
            strutGradient.addColorStop(0, '#7a7684');
            strutGradient.addColorStop(0.5, '#4e4b58');
            strutGradient.addColorStop(1, '#252330');
            ctx.fillStyle = strutGradient;
            ctx.strokeStyle = '#111114';
            ctx.lineWidth = 1;
            ctx.fillRect(-towerSize * 0.018, -towerSize * 0.22, towerSize * 0.036, towerSize * 0.24);
            ctx.strokeRect(-towerSize * 0.018, -towerSize * 0.22, towerSize * 0.036, towerSize * 0.24);

            // Amethyst stud cap - static/neutral color, the crystal accents that actually
            // carry the spell color live only in renderDynamicParts.
            ctx.fillStyle = '#7c5fb8';
            ctx.beginPath();
            ctx.moveTo(0, -towerSize * 0.26);
            ctx.lineTo(towerSize * 0.02, -towerSize * 0.22);
            ctx.lineTo(0, -towerSize * 0.19);
            ctx.lineTo(-towerSize * 0.02, -towerSize * 0.22);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.lineWidth = 0.6;
            ctx.stroke();

            // Small specular fleck for a glassier, more finished-looking stud.
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            ctx.beginPath();
            ctx.arc(-towerSize * 0.006, -towerSize * 0.235, towerSize * 0.006, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }

    /** Idle ambient dust - see the ambientParticles split in update()/constructor. Drawn as
     *  the first thing in renderDynamicParts, before the body fill, so it sits behind the
     *  tower rather than drifting over it. */
    renderAmbientDust(ctx) {
        for (let i = 0; i < this.ambientParticles.length; i++) {
            const particle = this.ambientParticles[i];
            const alpha = particle.life / particle.maxLife;
            ctx.fillStyle = particle.color + alpha + ')';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /** Strategy B (per-instance Graphics, redrawn every frame): tapered spire body, windows,
     *  rune bands, floating runes, and the fused crystal cluster on top - all colored by
     *  selectedSpell (runtime-changeable) and pulse-animated. The body is a single tapered
     *  polygon (SuperWeaponLab's spire shape, not MagicTower's stacked octagon+cylinder), so
     *  there's no separate ring texture and nothing that needs circle-containment math. */
    renderDynamicParts(ctx, towerSize) {
        // Ambient dust drawn first, before the spire fill, so it sits behind the tower instead
        // of drifting over it (see the ambientParticles split in update()).
        this.renderAmbientDust(ctx);

        const combinationColor = this.getCombinationColor();

        const spireHeight = towerSize * 0.8;
        const spireBaseWidth = towerSize * 0.46;
        const spireTopWidth = towerSize * 0.15;
        const spireBaseY = this.y - towerSize * 0.02;
        const spireTopY = spireBaseY - spireHeight;

        // Stone collar bridging the spire's own (narrower) foot down into the wider octagonal
        // foundation below. Without it the spire's fill just starts abruptly over the
        // foundation's top face with nothing spanning the width gap between them (spire foot
        // is 0.46*towerSize wide, the foundation is 0.9*towerSize) - the two pieces read as
        // separately-drawn objects rather than one structure. Neutral stone/metal (not
        // spell-colored) since it's part of the fixed structure, matching the buttresses/
        // struts above rather than the spire's spell-dependent facets below.
        const collarTopWidth = spireBaseWidth * 1.05;
        const collarBottomWidth = spireBaseWidth * 1.75;
        const collarHeight = towerSize * 0.09;
        const collarGradient = ctx.createLinearGradient(this.x, spireBaseY, this.x, spireBaseY + collarHeight);
        collarGradient.addColorStop(0, '#59535f');
        collarGradient.addColorStop(1, '#232028');
        ctx.fillStyle = collarGradient;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x - collarTopWidth / 2, spireBaseY);
        ctx.lineTo(this.x - collarBottomWidth / 2, spireBaseY + collarHeight);
        ctx.lineTo(this.x + collarBottomWidth / 2, spireBaseY + collarHeight);
        ctx.lineTo(this.x + collarTopWidth / 2, spireBaseY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Tapered spire body, split into two flat facets (a lightened left half, a darkened
        // right half, meeting at a bright center ridge) instead of one smooth gradient fill.
        // A smooth gradient across such a thin taper reads as flat/2D at typical in-game
        // size - the hard facet seam is what actually sells "angular faceted column" at a
        // glance, the same reason SuperWeaponLab/MagicTower lean on strong rim strokes rather
        // than gradients alone. Colors are derived once per spell via _getFacetColors below
        // rather than rebuilt as a fresh CanvasGradient every frame.
        const facetColors = this._getFacetColors(combinationColor);

        ctx.fillStyle = facetColors.light;
        ctx.beginPath();
        ctx.moveTo(this.x - spireBaseWidth / 2, spireBaseY);
        ctx.lineTo(this.x - spireTopWidth / 2, spireTopY);
        ctx.lineTo(this.x, spireTopY);
        ctx.lineTo(this.x, spireBaseY);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = facetColors.dark;
        ctx.beginPath();
        ctx.moveTo(this.x, spireBaseY);
        ctx.lineTo(this.x, spireTopY);
        ctx.lineTo(this.x + spireTopWidth / 2, spireTopY);
        ctx.lineTo(this.x + spireBaseWidth / 2, spireBaseY);
        ctx.closePath();
        ctx.fill();

        // Full silhouette outline drawn on top of both facets, so the center seam doesn't
        // read as a line poking past the tower's actual edge.
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x - spireBaseWidth / 2, spireBaseY);
        ctx.lineTo(this.x - spireTopWidth / 2, spireTopY);
        ctx.lineTo(this.x + spireTopWidth / 2, spireTopY);
        ctx.lineTo(this.x + spireBaseWidth / 2, spireBaseY);
        ctx.closePath();
        ctx.stroke();

        // Center ridge crease - brighter than either facet, reading as the lit edge where the
        // two faces meet rather than a flat crack down the middle.
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = Math.max(1, towerSize * 0.012);
        ctx.beginPath();
        ctx.moveTo(this.x, spireBaseY);
        ctx.lineTo(this.x, spireTopY);
        ctx.stroke();

        // Outer silhouette edges kept dark - both facets already carry their own light/dark
        // value, so these just crisp the silhouette against the background.
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.lineWidth = Math.max(1, towerSize * 0.012);
        ctx.beginPath();
        ctx.moveTo(this.x - spireBaseWidth / 2, spireBaseY);
        ctx.lineTo(this.x - spireTopWidth / 2, spireTopY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x + spireBaseWidth / 2, spireBaseY);
        ctx.lineTo(this.x + spireTopWidth / 2, spireTopY);
        ctx.stroke();

        // Carved block lines - straight segments sampled from the SAME width-interpolation
        // formula as the spire polygon above, so they are geometrically guaranteed to stay
        // inside it at every height. Replaces the old circular ring texture entirely (that
        // geometry could never be reliably contained through CanvasGraphicsShim, which has no
        // working ctx.clip() - a straight line derived from the shape's own width formula has
        // no such containment problem to begin with).
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 7; i++) {
            const t = i / 7;
            const y = spireBaseY - spireHeight * t;
            const width = spireBaseWidth - (spireBaseWidth - spireTopWidth) * t;
            ctx.beginPath();
            ctx.moveTo(this.x - width / 2, y);
            ctx.lineTo(this.x + width / 2, y);
            ctx.stroke();
        }

        // Magical window openings - radial-gradient glow tinted by the active spell, proportional
        // to towerSize/spireHeight throughout so they stay correctly placed on the taper at any
        // resolution instead of relying on fixed pixel offsets.
        const windowSpecs = [
            { t: 0.30, size: towerSize * 0.05 },
            { t: 0.53, size: towerSize * 0.042 },
            { t: 0.75, size: towerSize * 0.034 }
        ];
        windowSpecs.forEach(win => {
            const wy = spireBaseY - spireHeight * win.t;

            ctx.fillStyle = '#15131b';
            ctx.beginPath();
            ctx.arc(this.x, wy, win.size + 2, 0, Math.PI * 2);
            ctx.fill();

            // Rebuilt every frame (not cached like the spire gradient above) because its color
            // stops bake in crystalPulse directly - CanvasGraphicsShim's globalAlpha maps to
            // the whole per-instance Graphics object's alpha (reset() sets it once at the start
            // of the frame; it isn't part of the save/restore transform stack or scoped to an
            // individual fill() the way real Canvas2D's globalAlpha is), so it can't be used
            // here to fake the pulse on top of a cached, pulse-independent gradient without the
            // glow silently stopping animating once rendered through Pixi.
            const glow = ctx.createRadialGradient(this.x, wy, 0, this.x, wy, win.size * 2.2);
            glow.addColorStop(0, combinationColor + `${this.crystalPulse})`);
            glow.addColorStop(0.5, combinationColor + `${this.crystalPulse * 0.5})`);
            glow.addColorStop(1, combinationColor + '0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(this.x, wy, win.size * 2.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = `rgba(255, 255, 255, ${this.crystalPulse * 0.7})`;
            ctx.beginPath();
            ctx.arc(this.x, wy, win.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
        });

        // Carved rune bands - thin glowing line + symbol, proportional positions along the taper.
        const runeBands = [
            { t: 0.40, symbol: '◇' },
            { t: 0.60, symbol: '✧' },
            { t: 0.82, symbol: '❋' }
        ];
        runeBands.forEach(band => {
            const by = spireBaseY - spireHeight * band.t;
            const bandWidth = (spireBaseWidth - (spireBaseWidth - spireTopWidth) * band.t) - towerSize * 0.04;

            ctx.strokeStyle = combinationColor + `${this.crystalPulse})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(this.x - bandWidth / 2, by);
            ctx.lineTo(this.x + bandWidth / 2, by);
            ctx.stroke();

            ctx.fillStyle = `rgba(255, 255, 255, ${this.crystalPulse})`;
            ctx.font = `${Math.round(towerSize * 0.075)}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(band.symbol, this.x, by);
        });

        // Floating runes orbiting the spire base
        const runeOrbitRadius = spireBaseWidth * 0.85;
        for (let i = 0; i < this.runePositions.length; i++) {
            const rune = this.runePositions[i];
            const floatY = Math.sin(this.animationTime * 2 + rune.floatOffset) * towerSize * 0.015;
            const runeAngle = this.runeRotation + rune.angle;
            const runeX = this.x + Math.cos(runeAngle) * runeOrbitRadius;
            const runeY = spireBaseY - spireHeight * 0.14 + Math.sin(runeAngle) * runeOrbitRadius * 0.3 + floatY;

            ctx.fillStyle = combinationColor + `${this.crystalPulse * 0.4})`;
            ctx.beginPath();
            ctx.arc(runeX, runeY, towerSize * 0.03, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = `rgba(255, 255, 255, ${this.crystalPulse})`;
            ctx.font = `bold ${Math.round(towerSize * 0.035)}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(rune.symbol, runeX, runeY);
        }

        // --- Fused elemental crystal cluster mounted at the spire tip - bigger and more
        // elaborate than MagicTower's single prism gem or SuperWeaponLab's plain diamond, with
        // smaller orbiting shards standing in for the four combinable spells (steam/magma/
        // tempest/meteor) fused into one focus. ---
        const cx = this.x;
        const sphereY = spireTopY - towerSize * 0.16;
        const gemRadius = towerSize * 0.13;
        const glowSize = towerSize * 0.03 + this.crystalPulse * towerSize * 0.05;
        const gw = gemRadius;
        const gt = gemRadius * 1.2;
        const gb = gemRadius * 0.7;

        // Small mounting platform at the spire tip, seating the crystal - given a metallic
        // gradient (was a single flat #2a2732, nearly invisible against the spire tip's own
        // color) so the crystal reads as seated on a distinct cap rather than glued directly
        // onto the spire.
        const platformGradient = ctx.createLinearGradient(cx, spireTopY - gemRadius * 0.22, cx, spireTopY + gemRadius * 0.22);
        platformGradient.addColorStop(0, '#6b667a');
        platformGradient.addColorStop(1, '#232028');
        ctx.fillStyle = platformGradient;
        ctx.strokeStyle = '#15131b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = cx + Math.cos(angle) * gemRadius * 0.55;
            const y = spireTopY + Math.sin(angle) * gemRadius * 0.22;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.save();

        // Ambient power-core glow beneath the crystal - alpha capped lower than before (was
        // 0.15-0.35, reading as a flat haze at high pulse) with a thin defined ring added at
        // its edge, so the glow reads as a deliberate lit halo instead of a diffuse smear.
        ctx.fillStyle = combinationColor + `${0.08 + this.crystalPulse * 0.1})`;
        ctx.beginPath();
        ctx.ellipse(cx, sphereY + gb * 0.3, glowSize * 1.4, glowSize * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = combinationColor + `${0.25 + this.crystalPulse * 0.2})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(cx, sphereY + gb * 0.3, glowSize * 1.4, glowSize * 0.8, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Containment-field halo at the shards' own orbit radius - a broken ring (two arcs
        // with gaps, not a full circle) so it reads as an energy band rather than another
        // solid outline competing with the gem's silhouette. Drawn once, behind everything
        // in the cluster, at low alpha - this is the one piece of the crystal that's genuinely
        // new relative to MagicTower's single static gem, marking the fused/orbiting nature
        // of the four spells without adding another shape that needs its own depth-sorting.
        //
        // ctx.arc() (circle only) IS properly supported with start/end by Pixi, but a true
        // circle wouldn't match the shards' own flattened (*0.4 vertical) orbit, hence the
        // shared _strokeEllipseArc helper (manual polyline sampling, see its own doc comment)
        // instead of switching to arc() or ctx.ellipse(..., start, end) directly - the same
        // Pixi/Canvas2D parity gap the base's iron banding hit in renderStaticBack above.
        const haloRadius = gemRadius * 1.55;
        const haloRy = haloRadius * 0.4;
        ctx.strokeStyle = combinationColor + `${0.2 + this.crystalPulse * 0.25})`;
        ctx.lineWidth = 1.5;
        this._strokeEllipseArc(ctx, cx, sphereY, haloRadius, haloRy, this.runeRotation * 0.5, this.runeRotation * 0.5 + Math.PI * 0.7);
        this._strokeEllipseArc(ctx, cx, sphereY, haloRadius, haloRy, this.runeRotation * 0.5 + Math.PI, this.runeRotation * 0.5 + Math.PI * 1.7);

        // Three smaller orbiting shards, representing the fused spells, circling the main
        // crystal. sin(orbitAngle) also doubles as each shard's depth relative to the gem
        // (positive = swung toward the viewer), so shards are split into a back batch drawn
        // before the gem and a front batch drawn after it - otherwise every shard would draw
        // behind the gem regardless of orbit position, popping in front of it unnaturally as
        // runeRotation advances instead of correctly passing behind/in front of it. Each
        // shard's tether line is drawn together with it (same function, same depth batch) so
        // a back shard's tether never crosses in front of the gem either.
        const drawShard = (i) => {
            const orbitAngle = this.runeRotation * 1.4 + (i / 3) * Math.PI * 2;
            const orbitRadius = gemRadius * 1.55;
            const shardX = cx + Math.cos(orbitAngle) * orbitRadius;
            const shardY = sphereY + Math.sin(orbitAngle) * orbitRadius * 0.4;
            const shardSize = gemRadius * 0.32;

            ctx.strokeStyle = combinationColor + `${0.35 + this.crystalPulse * 0.25})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx, sphereY);
            ctx.lineTo(shardX, shardY);
            ctx.stroke();

            ctx.fillStyle = combinationColor + '0.9)';
            ctx.beginPath();
            ctx.moveTo(shardX, shardY - shardSize);
            ctx.lineTo(shardX + shardSize * 0.6, shardY);
            ctx.lineTo(shardX, shardY + shardSize);
            ctx.lineTo(shardX - shardSize * 0.6, shardY);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.lineWidth = 0.6;
            ctx.stroke();
        };

        const isFrontShard = (i) => Math.sin(this.runeRotation * 1.4 + (i / 3) * Math.PI * 2) > 0;

        for (let i = 0; i < 3; i++) {
            if (!isFrontShard(i)) drawShard(i);
        }

        // Main prism gem body - taller/wider than MagicTower's for a heavier centerpiece
        ctx.fillStyle = combinationColor + '1)';
        ctx.beginPath();
        ctx.moveTo(cx, sphereY - gt);
        ctx.lineTo(cx + gw * 0.5, sphereY - gt * 0.35);
        ctx.lineTo(cx + gw, sphereY);
        ctx.lineTo(cx + gw * 0.45, sphereY + gb);
        ctx.lineTo(cx - gw * 0.45, sphereY + gb);
        ctx.lineTo(cx - gw, sphereY);
        ctx.lineTo(cx - gw * 0.5, sphereY - gt * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Upper table facet highlight
        ctx.fillStyle = combinationColor + '0.9)';
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.moveTo(cx, sphereY - gt * 0.85);
        ctx.lineTo(cx + gw * 0.28, sphereY - gt * 0.25);
        ctx.lineTo(cx - gw * 0.28, sphereY - gt * 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        // Specular dot
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.arc(cx - gw * 0.15, sphereY - gt * 0.55, gw * 0.11, 0, Math.PI * 2);
        ctx.fill();

        // Facet lines
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(cx + gw * 0.5, sphereY - gt * 0.35);
        ctx.lineTo(cx + gw * 0.45, sphereY + gb);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - gw * 0.5, sphereY - gt * 0.35);
        ctx.lineTo(cx - gw * 0.45, sphereY + gb);
        ctx.stroke();

        // Shards swung toward the viewer this frame draw last so they occlude the gem
        // instead of always sitting behind it (see isFrontShard() above).
        for (let i = 0; i < 3; i++) {
            if (isFrontShard(i)) drawShard(i);
        }
        ctx.restore();
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
                
                for (let s = 0; s < bolt.segmentCount; s++) {
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
                for (let s = 0; s < bolt.segmentCount; s++) {
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
