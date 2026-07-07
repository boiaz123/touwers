import { Tower } from './Tower.js';
import { ObjectPool } from '../../core/ObjectPool.js';

const BASE_SLOW_EFFECT = 0.7;

export class MagicTower extends Tower {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY);
        this.range = 130;
        this.damage = 45;
        this.fireRate = 1.0;
        this.originalRange = 130;
        this.originalDamage = 45;
        this.originalFireRate = 1.0;
        
        // Element system - CORRECTED elements
        this.selectedElement = 'fire'; // Default element
        this.elementalBonuses = {
            fire: { damageBonus: 0 },
            water: { slowBonus: 0 },
            air: { chainRange: 0 },
            earth: { armorPiercing: 0 }
        };
        
        // Animation properties
        this.crystalPulse = 0;
        this.runeRotation = 0;
        this.lightningBolts = [];
        // Phase 5: reuse bolt/particle objects across casts instead of allocating a fresh
        // literal every time - acquire() at each push() site, release() once an entry is
        // dropped from update()'s compaction loops below.
        this._lightningBoltPool = new ObjectPool(() => ({
            startX: 0, startY: 0, endX: 0, endY: 0, life: 0, maxLife: 0,
            // Fixed-size, pre-allocated once per bolt slot and mutated in place by
            // generateLightningSegments() every shot instead of being replaced with a fresh
            // array of fresh objects each time (was 8 new object literals per shot, unpooled).
            segments: Array.from({ length: 8 }, () => ({ fromX: 0, fromY: 0, toX: 0, toY: 0 })),
            color: ''
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

        // Set by TowerRenderAdapter once it has baked/synced this tower's static body via
        // Pixi (attack-radius still draws here regardless - not migrated yet).
        this.skipCanvas2DBodyRender = false;
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
        let boltW = 0;
        for (let i = 0; i < this.lightningBolts.length; i++) {
            const bolt = this.lightningBolts[i];
            bolt.life -= deltaTime;
            if (bolt.life > 0) {
                this.lightningBolts[boltW++] = bolt;
            } else {
                this._lightningBoltPool.release(bolt);
            }
        }
        this.lightningBolts.length = boltW;
        
        // Update magic particles (compact in-place)
        let pW = 0;
        for (let i = 0; i < this.magicParticles.length; i++) {
            const particle = this.magicParticles[i];
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            if (particle.life > 0) {
                particle.size = particle.maxSize * (particle.life / particle.maxLife);
                this.magicParticles[pW++] = particle;
            } else {
                this._magicParticlePool.release(particle);
            }
        }
        this.magicParticles.length = pW;

        // Generate ambient magic particles - reduced frequency for performance
        if (Math.random() < deltaTime * 1.2) {
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
    
    shoot() {
        if (this.target) {
            let finalDamage = this.damage;
            
            // Play magic tower sound
            if (this.audioManager) {
                this.audioManager.playSFX('magic-tower');
            }
            
            // Apply elemental effects based on selected element
            switch(this.selectedElement) {
                case 'fire':
                    finalDamage += this.elementalBonuses.fire.damageBonus;
                    this.target.takeDamage(finalDamage, 0, 'fire');
                    // Apply burn effect
                    if (this.target.burnTimer) {
                        this.target.burnTimer = Math.max(this.target.burnTimer, 3);
                    } else {
                        this.target.burnTimer = 3;
                        this.target.burnDamage = 5;
                    }
                    break;
                    
                case 'water':
                    this.target.takeDamage(finalDamage, 0, 'water');
                    // Apply enhanced slow effect
                    const baseSlowEffect = BASE_SLOW_EFFECT;
                    const enhancedSlowEffect = Math.max(0.3, baseSlowEffect - this.elementalBonuses.water.slowBonus);
                    if (this.target.speed > 20) {
                        this.target.originalSpeed = this.target.originalSpeed || this.target.speed;
                        this.target.speed *= enhancedSlowEffect;
                        this.target.freezeTimer = Math.max(this.target.freezeTimer || 0, 1.0);
                    }
                    break;
                    
                case 'air':
                    this.target.takeDamage(finalDamage, 0, 'air');
                    // Chain lightning to nearby enemies
                    this.chainLightning(this.target);
                    break;
                    
                case 'earth':
                    // Armor piercing: 100% ignores armor completely, and reduces enemy armor
                    const piercingDamage = finalDamage + this.elementalBonuses.earth.armorPiercing;
                    this.target.takeDamage(piercingDamage, 0, 'earth'); // Earth damage bypasses armor and reduces it
                    break;
            }
            
            // Create appropriate visual effect
            this.createElementalEffect();
        }
    }
    
    chainLightning(originalTarget) {
        const chainRange = 50 + this.elementalBonuses.air.chainRange;
        const chainTargets = [originalTarget];

        // Find nearby enemies for chain lightning
        if (this.enemies) {
            const visited = new Set();
            visited.add(originalTarget);
            let currentTargets = [originalTarget];

            // Chain up to 3 times
            for (let chain = 0; chain < 3; chain++) {
                const nextTargets = [];

                for (let t = 0; t < currentTargets.length; t++) {
                    const target = currentTargets[t];

                    // OPTIMIZATION: use the spatial grid (injected by TowerManager every
                    // frame, same as CannonTower's splash-damage query) instead of scanning
                    // every enemy per chain hop - turns O(hops * hopWidth * allEnemies) into
                    // O(hops * hopWidth * nearbyEnemies). _queryBuf is a single shared buffer
                    // reused across calls, so its contents must be fully consumed (copied into
                    // nextTargets/chainTargets below) before the next query() call in this loop.
                    if (this._spatialGrid) {
                        const grid = this._spatialGrid;
                        const count = grid.query(target.x, target.y, chainRange);
                        const buf = grid._queryBuf;
                        for (let i = 0; i < count; i++) {
                            const enemy = buf[i];
                            if (!visited.has(enemy) && !enemy.isDead()) {
                                const dist = Math.hypot(enemy.x - target.x, enemy.y - target.y);
                                if (dist <= chainRange) {
                                    nextTargets.push(enemy);
                                    visited.add(enemy);
                                    chainTargets.push(enemy);

                                    const chainDamage = Math.floor(this.damage * 0.6); // 60% damage
                                    enemy.takeDamage(chainDamage, 0, 'air');
                                }
                            }
                        }
                    } else {
                        for (let e = 0; e < this.enemies.length; e++) {
                            const enemy = this.enemies[e];
                            if (!visited.has(enemy) && !enemy.isDead()) {
                                const dist = Math.hypot(enemy.x - target.x, enemy.y - target.y);
                                if (dist <= chainRange) {
                                    nextTargets.push(enemy);
                                    visited.add(enemy);
                                    chainTargets.push(enemy);

                                    const chainDamage = Math.floor(this.damage * 0.6); // 60% damage
                                    enemy.takeDamage(chainDamage, 0, 'air');
                                }
                            }
                        }
                    }
                }

                if (nextTargets.length === 0) break;
                currentTargets = nextTargets;
            }
        }
    }
    
    createElementalEffect() {
        if (!this.target) return;
        
        // Create lightning bolt effect with elemental color - CORRECTED
        let boltColor, impactColor;
        
        switch(this.selectedElement) {
            case 'fire':
                boltColor = 'rgba(255, 69, 0, ';
                impactColor = 'rgba(255, 140, 0, ';
                break;
            case 'water':
                boltColor = 'rgba(64, 164, 223, ';
                impactColor = 'rgba(135, 206, 250, ';
                break;
            case 'air':
                boltColor = 'rgba(255, 255, 0, ';
                impactColor = 'rgba(255, 255, 255, ';
                break;
            case 'earth':
                boltColor = 'rgba(139, 69, 19, ';
                impactColor = 'rgba(160, 82, 45, ';
                break;
        }
        
        const bolt = this._lightningBoltPool.acquire();
        bolt.startX = this.x;
        bolt.startY = this.y;
        bolt.endX = this.target.x;
        bolt.endY = this.target.y;
        bolt.life = 0.3;
        bolt.maxLife = 0.3;
        this.generateLightningSegments(this.x, this.y, this.target.x, this.target.y, bolt.segments);
        bolt.color = boltColor;
        this.lightningBolts.push(bolt);

        // Create impact particles with elemental colors - reduced from 8 to 6
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const speed = Math.random() * 100 + 50;
            const particle = this._magicParticlePool.acquire();
            particle.x = this.target.x;
            particle.y = this.target.y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.life = 1;
            particle.maxLife = 1;
            particle.size = 0;
            particle.maxSize = 5;
            particle.color = impactColor;
            this.magicParticles.push(particle);
        }
    }
    
    setElement(element) {
        if (['fire', 'water', 'air', 'earth'].includes(element)) {
            this.selectedElement = element;

            // Set per-element base damage and fire rate
            const elementStats = {
                fire:  { damage: 45, fireRate: 1.0 },
                water: { damage: 30, fireRate: 1.2 },
                air:   { damage: 25, fireRate: 1.0 },
                earth: { damage: 60, fireRate: 0.7 }
            };
            const stats = elementStats[element];
            this.damage = stats.damage;
            this.fireRate = stats.fireRate;
            this.originalDamage = stats.damage;
            this.originalFireRate = stats.fireRate;

            // Update visual particles to match element
            this.updateElementalParticles();
        }
    }
    
    updateElementalParticles() {
        // Clear existing particles and regenerate with new element color
        for (let i = 0; i < this.magicParticles.length; i++) {
            this._magicParticlePool.release(this.magicParticles[i]);
        }
        this.magicParticles.length = 0;
    }
    
    isClickable(x, y, towerSize) {
        return Math.hypot(this.x - x, this.y - y) <= towerSize/2;
    }
    
    applyElementalBonuses(bonuses) {
        this.elementalBonuses = bonuses;
    }
    
    getElementalColor() {
        switch(this.selectedElement) {
            case 'fire': return 'rgba(255, 107, 53, ';
            case 'water': return 'rgba(78, 205, 196, ';
            case 'air': return 'rgba(255, 230, 109, ';
            case 'earth': return 'rgba(139, 111, 71, ';
            default: return 'rgba(138, 43, 226, ';
        }
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

            // Add random variance except for the last segment
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

    /** Phase 5: runes/particles/bolts - present so TowerRenderAdapter.sync() can call this through the same shim used for renderDynamicParts, preserving draw order (body, then effects on top). towerSize isn't passed by the adapter (it only forwards ctx), so it's recomputed here the same way render() does - getCellSize() reads ctx.resolutionManager first, which works identically whether ctx is a real CanvasRenderingContext2D or the Pixi shim. */
    renderProjectiles(ctx) {
        const cellSize = this.getCellSize(ctx);
        const towerSize = cellSize * 2;
        this.renderRunesParticlesAndBolts(ctx, towerSize);
    }

    /** No front-of-tower environment decoration for this type - present for TowerRenderAdapter's uniform convention. */
    renderStaticFront(ctx, towerSize) {
        // intentionally empty
    }

    /** Strategy A (baked once per campaign, shared across instances): tower base + coil structure. */
    renderStaticBack(ctx, towerSize) {
        // 3D shadow
        ctx.fillStyle = 'rgba(75, 0, 130, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x + 3, this.y + 3, towerSize * 0.35, 0, Math.PI * 2);
        ctx.fill();
        
        // Mystical stone base (octagonal mage tower)
        const baseRadius = towerSize * 0.35;
        const towerHeight = towerSize * 0.5;
        
        // Tower foundation - use solid colors instead of gradients
        ctx.fillStyle = '#6A5ACD';
        ctx.strokeStyle = '#4B0082';
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
        
        // Tower walls with 3D effect - simplified
        ctx.fillStyle = '#6A5ACD';
        ctx.strokeStyle = '#4B0082';
        ctx.lineWidth = 2;
        
        // Draw tower cylinder
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

        // Tesla coil base platform + column + rings. Drawn here (static) rather than where
        // it appeared in the original code (between the windows and the gem, both dynamic)
        // - the coil's footprint doesn't overlap either, so moving it doesn't change the
        // final composited image, and it keeps the static/dynamic split contiguous.
        const coilBaseRadius = baseRadius * 0.6;
        const coilBaseY = this.y - towerHeight;
        const coilHeight = towerSize * 0.4;
        const coilWidth = baseRadius * 0.15;

        ctx.fillStyle = '#2F2F2F';
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, coilBaseY, coilBaseRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#808080';
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 2;
        ctx.fillRect(this.x - coilWidth, coilBaseY - coilHeight, coilWidth * 2, coilHeight);
        ctx.strokeRect(this.x - coilWidth, coilBaseY - coilHeight, coilWidth * 2, coilHeight);

        const ringCount = 5;
        for (let i = 0; i < ringCount; i++) {
            const ringY = coilBaseY - coilHeight + (i + 1) * coilHeight / (ringCount + 1);
            const ringRadius = coilWidth * (2 + Math.sin(i * 0.5));

            ctx.strokeStyle = '#A0A0A0';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, ringY, ringRadius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = '#E0E0E0';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, ringY, ringRadius, -Math.PI/4, Math.PI/4);
            ctx.stroke();
        }
    }

    /** Strategy B (per-instance Graphics, redrawn every frame): window glow + gem - pulse animation and element-dependent color are continuous per-instance state, not bakeable. */
    renderDynamicParts(ctx, towerSize) {
        // Same derivation as renderStaticBack() above.
        const baseRadius = towerSize * 0.35;
        const towerHeight = towerSize * 0.5;
        const coilBaseY = this.y - towerHeight;
        const coilHeight = towerSize * 0.4;
        const coilWidth = baseRadius * 0.15;

        // Mystical windows
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const windowX = this.x + Math.cos(angle) * baseRadius * 0.7;
            const windowY = this.y - towerHeight/2;

            // Window glow - simplified without gradient
            ctx.fillStyle = `rgba(138, 43, 226, ${this.crystalPulse * 0.8})`;
            ctx.beginPath();
            ctx.arc(windowX, windowY, 8, 0, Math.PI * 2);
            ctx.fill();

            // Window frame
            ctx.fillStyle = '#2E0A4F';
            ctx.beginPath();
            ctx.arc(windowX, windowY, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Tesla coil top elemental gem crystal (prism shape)
        const sphereRadius = coilWidth * 1.5;
        const sphereY = coilBaseY - coilHeight;
        const gemRadius = sphereRadius * 1.6;

        const solidGemColors = {
            fire:  { gem: '#FF4400', inner: '#FF8855', glow: '#FF4400' },
            water: { gem: '#0088FF', inner: '#55BBFF', glow: '#0088FF' },
            air:   { gem: '#AADDFF', inner: '#EEFAFF', glow: '#88CCEE' },
            earth: { gem: '#9B7040', inner: '#D4A857', glow: '#9B7040' }
        };
        const gemData = solidGemColors[this.selectedElement] || { gem: '#8B2BE2', inner: '#C070FF', glow: '#8B2BE2' };
        const glowSize = 6 + this.crystalPulse * 14;
        const cx = this.x;
        const gw = gemRadius;
        const gt = gemRadius * 1.15;
        const gb = gemRadius * 0.65;

        ctx.save();
        // Prism gem body
        ctx.fillStyle = gemData.gem;
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
        ctx.fillStyle = gemData.inner;
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.moveTo(cx, sphereY - gt * 0.85);
        ctx.lineTo(cx + gw * 0.28, sphereY - gt * 0.25);
        ctx.lineTo(cx - gw * 0.28, sphereY - gt * 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        // Specular dot
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
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
        ctx.restore();
    }

    /** Phase 5: runes/particles/bolts - drawn via renderProjectiles() above, inside the Pixi shim when active, or directly on Canvas2D otherwise. Runes use ctx.fillText(), which CanvasGraphicsShim now backs with a pooled PIXI.Text per shim. */
    renderRunesParticlesAndBolts(ctx, towerSize) {
        const baseRadius = towerSize * 0.35;
        const towerHeight = towerSize * 0.5;
        const coilHeight = towerSize * 0.4;
        const coilWidth = baseRadius * 0.15;
        const sphereY = this.y - towerHeight - coilHeight;

        // Floating runes around tower base (not coil)
        for (let i = 0; i < this.runePositions.length; i++) {
            const rune = this.runePositions[i];
            const floatY = Math.sin(this.animationTime * 2 + rune.floatOffset) * 6;
            const runeAngle = this.runeRotation + rune.angle;
            const runeRadius = baseRadius * 1.3;
            const runeX = this.x + Math.cos(runeAngle) * runeRadius;
            const runeY = this.y - towerHeight * 0.3 + Math.sin(runeAngle) * runeRadius * 0.3 + floatY;
            
            // Rune glow
            ctx.fillStyle = `rgba(138, 43, 226, ${this.crystalPulse * 0.4})`;
            ctx.beginPath();
            ctx.arc(runeX, runeY, 12, 0, Math.PI * 2);
            ctx.fill();
            
            // Rune symbol
            ctx.fillStyle = `rgba(255, 255, 255, ${this.crystalPulse})`;
            ctx.font = 'bold 14px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(rune.symbol, runeX, runeY);
        }
        
        // Render magic particles
        for (let i = 0; i < this.magicParticles.length; i++) {
            const particle = this.magicParticles[i];
            const alpha = particle.life / particle.maxLife;
            ctx.fillStyle = particle.color + alpha + ')';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Render lightning bolts with elemental colors
        for (let i = 0; i < this.lightningBolts.length; i++) {
            const bolt = this.lightningBolts[i];
            const alpha = bolt.life / bolt.maxLife;
            
            // Update bolt start position to tesla coil sphere
            bolt.startX = this.x;
            bolt.startY = sphereY;
            
            // Main lightning with elemental color
            ctx.strokeStyle = (bolt.color || 'rgba(255, 255, 255, ') + alpha + ')';
            ctx.lineWidth = 4;
            for (let s = 0; s < bolt.segments.length; s++) {
                const segment = bolt.segments[s];
                ctx.beginPath();
                ctx.moveTo(segment.fromX, segment.fromY);
                ctx.lineTo(segment.toX, segment.toY);
                ctx.stroke();
            }
            
            // Lightning glow - single pass
            ctx.strokeStyle = (bolt.color || 'rgba(138, 43, 226, ') + (alpha * 0.4) + ')';
            ctx.lineWidth = 6;
            for (let s = 0; s < bolt.segments.length; s++) {
                const segment = bolt.segments[s];
                ctx.beginPath();
                ctx.moveTo(segment.fromX, segment.fromY);
                ctx.lineTo(segment.toX, segment.toY);
                ctx.stroke();
            }
        }
    }

    static getInfo() {
        return {
            name: 'Magic Tower',
            description: 'Elemental tower with selectable damage types. Requires Magic Academy.',
            damage: '40 + elemental bonuses',
            range: '130',
            fireRate: '1.0/sec',
            cost: 450,
            icon: ''
        };
    }
}
