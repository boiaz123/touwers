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
        
        // Slow, high-floored breathing pulse (was 0-1 at 3rad/s, i.e. flickering fully dark
        // and back roughly every 2s) - every glow site below (windows, halo, ambient core,
        // floating runes) now reads this one value directly instead of inventing its own
        // floor/range, so the whole tower breathes together at one calm, consistent rate
        // instead of several independently-flickering light sources.
        this.crystalPulse = 0.65 + 0.35 * Math.sin(this.animationTime * 1.1);
        this.runeRotation += deltaTime * 0.35;
        
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

    /** Samples a flattened-ellipse arc as a manual polyline (moveTo/lineTo per segment) rather
     *  than ctx.ellipse(..., rotation, start, end) - Pixi's real Graphics.ellipse() only ever
     *  takes (x, y, radiusX, radiusY); the shim's rotation/start/end params get silently
     *  dropped, so a partial-arc ellipse call would render as a full, uncut ellipse in the
     *  actual game despite working in a plain Canvas2D test. Full ellipses (start=0, end=2π)
     *  are unaffected by the gap and still use ctx.ellipse() directly elsewhere in this file. */
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

    /** Boulders ringing the foundation plinth - deterministic pseudo-random hash (not
     *  Math.random()) so the pattern is stable no matter when/how often this static layer
     *  gets baked, the same approach MagicAcademy's _renderMoatBankDetail uses for its own
     *  bank rocks. No ellipse rotation is used (unlike a literal rock scatter might call
     *  for) since CanvasGraphicsShim's ellipse() silently drops rotation - varying each
     *  rock's size/shade/highlight offset instead keeps the Canvas2D and in-game Pixi
     *  renders identical. */
    _renderBaseRocks(ctx, g) {
        const rockCount = 10;
        for (let i = 0; i < rockCount; i++) {
            const hash = (i * 53 % 29) / 29;
            const angle = (i / rockCount) * Math.PI * 2 + hash * 0.3;
            const rx = this.x + Math.cos(angle) * g.baseRadius * (0.9 + hash * 0.14);
            const ry = this.y + Math.sin(angle) * g.baseFlat * (0.9 + hash * 0.14);
            const rs = g.baseRadius * (0.1 + hash * 0.06);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.beginPath();
            ctx.ellipse(rx + 1.5, ry + 1.5, rs * 1.1, rs * 0.55, 0, 0, Math.PI * 2);
            ctx.fill();

            const shade = 90 + hash * 50;
            const rockGradient = ctx.createLinearGradient(rx - rs, ry - rs * 0.6, rx + rs, ry + rs * 0.6);
            rockGradient.addColorStop(0, `rgb(${shade + 45}, ${shade + 40}, ${shade + 32})`);
            rockGradient.addColorStop(1, `rgb(${shade - 25}, ${shade - 28}, ${shade - 32})`);
            ctx.fillStyle = rockGradient;
            ctx.strokeStyle = 'rgba(20, 18, 15, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(rx, ry, rs, rs * 0.72, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = 'rgba(230, 225, 215, 0.35)';
            ctx.beginPath();
            ctx.ellipse(rx - rs * 0.32, ry - rs * 0.26, rs * 0.32, rs * 0.18, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /** '#RRGGBB' -> 'rgba(r, g, b, ' (missing trailing alpha+')' on purpose, same calling
     *  convention as getElementalColor() below) - lets the gem glow/halo share their exact
     *  color with the gem body itself (gemData.glow) instead of drawing from
     *  getElementalColor()'s separate palette, which doesn't match per element (e.g. air's
     *  gem is pale blue but getElementalColor()'s air is yellow). */
    _hexToRgbaPrefix(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, `;
    }

    /** Single source of truth for the tower's silhouette geometry - shared by renderStaticBack/
     *  renderDynamicParts/renderRunesParticlesAndBolts so the body, coil, gem and rune/bolt
     *  anchor points can never drift out of sync with each other. baseFlat/capRy squash the
     *  octagonal foundation and parapet cap into floor-plan ellipses (perspective the original
     *  circular ctx.arc() base/rings didn't have); the body itself is drawn as a two-facet flat
     *  prism (see renderStaticBack) rather than a flat top-down circle. */
    _getGeometry(towerSize) {
        const baseRadius = towerSize * 0.35;
        const baseFlat = baseRadius * 0.42;
        const bodyHeight = towerSize * 0.5;
        const bodyBaseY = this.y - towerSize * 0.02;
        const bodyTopY = bodyBaseY - bodyHeight;
        const wallRx = baseRadius * 0.82;
        const capRx = wallRx * 1.08;
        const capRy = baseFlat * 0.55;
        const coilBaseY = bodyTopY;
        const coilHeight = towerSize * 0.4;
        const coilWidth = baseRadius * 0.15;
        const sphereY = coilBaseY - coilHeight;
        const gemRadius = coilWidth * 1.5 * 1.6;
        return {
            baseRadius, baseFlat, bodyHeight, bodyBaseY, bodyTopY, wallRx, capRx, capRy,
            coilBaseY, coilHeight, coilWidth, sphereY, gemRadius
        };
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

    /** Strategy A (baked once per campaign, shared across instances): foundation + tower body
     *  + coil structure - all spell/element-independent, so they don't depend on the
     *  per-instance selectedElement and can be shared-baked instead of redrawn every frame.
     *  Reworked from flat solid-color circles/rings (no perspective, the "basic" look this
     *  overhaul addresses) to gradient-shaded shapes on a flattened floor-plan ellipse ratio,
     *  matching the technique CombinationTower's stone base/spire use. */
    renderStaticBack(ctx, towerSize) {
        const g = this._getGeometry(towerSize);

        // Drop shadow, squashed to the same floor-plan ratio as the foundation below
        ctx.fillStyle = 'rgba(15, 12, 8, 0.35)';
        ctx.beginPath();
        ctx.ellipse(this.x + 3, this.y + 4, g.baseRadius * 1.08, g.baseFlat * 1.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wide flat stone plinth the octagon sits on - a quarried footing the tower is
        // built into, matching MagicAcademy's plinth-under-wall convention
        // (renderCobblestoneBase) instead of the tower floating on bare colored ground.
        const plinthRx = g.baseRadius * 1.2;
        const plinthRy = g.baseFlat * 1.15;
        ctx.fillStyle = '#3c3934';
        ctx.strokeStyle = '#18160f';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + g.baseFlat * 0.18, plinthRx, plinthRy, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Boulders anchoring the foundation into the plinth, half-embedded around the rim -
        // breaks up what used to be a clean colored polygon edge and reads as the tower
        // being built from/into solid rock, matching MagicAcademy's moat-bank boulders
        // (_renderMoatBankDetail) rather than a smooth flat-filled shape. Drawn before the
        // foundation polygon so the polygon's own edge overlaps their inner half, seating
        // them rather than having them float on top of a finished edge.
        this._renderBaseRocks(ctx, g);

        // Octagonal stone foundation, flattened into a floor-plan ellipse ratio so it reads
        // as ground the tower actually stands on. Neutral quarried-stone palette (matching
        // MagicAcademy's cobblestone wall gradient) instead of tinted purple - the base is
        // mundane masonry the arcane superstructure above is built on top of.
        const foundationGradient = ctx.createLinearGradient(this.x, this.y - g.baseFlat, this.x, this.y + g.baseFlat);
        foundationGradient.addColorStop(0, '#b8b4ac');
        foundationGradient.addColorStop(0.5, '#8c8880');
        foundationGradient.addColorStop(1, '#5c5850');
        ctx.fillStyle = foundationGradient;
        ctx.strokeStyle = '#2a2824';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 - Math.PI / 8;
            const x = this.x + Math.cos(angle) * g.baseRadius;
            const y = this.y + Math.sin(angle) * g.baseFlat;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cut-stone joint lines radiating from center, echoing the coursing on
        // MagicAcademy's own wall (renderCobblestoneBase) so the two structures read as
        // the same masonry rather than unrelated materials.
        ctx.strokeStyle = 'rgba(35, 32, 28, 0.4)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            if (i === 4) continue; // skip the seam that would cut straight through the front face
            const angle = (i / 8) * Math.PI * 2 - Math.PI / 8;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + Math.cos(angle) * g.baseRadius, this.y + Math.sin(angle) * g.baseFlat);
            ctx.stroke();
        }

        // Lit far-rim highlight - the foundation's far edge catching ambient light, so it
        // reads as a raised platform rather than a flat smudge under the tower.
        ctx.strokeStyle = 'rgba(235, 230, 220, 0.5)';
        ctx.lineWidth = Math.max(1, towerSize * 0.012);
        this._strokeEllipseArc(ctx, this.x, this.y - g.baseFlat * 0.5, g.baseRadius * 0.9, g.baseFlat * 0.5, Math.PI * 1.1, Math.PI * 1.9);

        // Thin carved rune circle inlaid in the stone - a static arcane marking (not
        // animated) that ties the mundane stone base back to the magic tower above without
        // adding another moving light source, keeping the floating runes above as the
        // base's only animated glow for a calmer overall read.
        ctx.strokeStyle = 'rgba(150, 100, 220, 0.3)';
        ctx.lineWidth = Math.max(1, towerSize * 0.007);
        this._strokeEllipseArc(ctx, this.x, this.y - g.baseFlat * 0.05, g.baseRadius * 0.6, g.baseFlat * 0.6, 0, Math.PI * 2, 24);

        // Stone collar bridging the (narrower, purple) tower body down into the (wider,
        // neutral-stone) foundation - a warm cut-stone trim band, the same role
        // MagicAcademy's belt course (_wallBeltY / renderCobblestoneBase) plays marking a
        // storey division, so the join reads as a deliberate architectural transition
        // rather than the body's fill just stopping abruptly over the foundation.
        const collarTopW = g.wallRx * 2 * 1.05;
        const collarBottomW = g.baseRadius * 1.5;
        const collarHeight = towerSize * 0.07;
        const collarGradient = ctx.createLinearGradient(this.x, g.bodyBaseY, this.x, g.bodyBaseY + collarHeight);
        collarGradient.addColorStop(0, '#d8d0bc');
        collarGradient.addColorStop(0.5, '#b8ac8e');
        collarGradient.addColorStop(1, '#8a7d5e');
        ctx.fillStyle = collarGradient;
        ctx.strokeStyle = '#3a3428';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x - collarTopW / 2, g.bodyBaseY);
        ctx.lineTo(this.x - collarBottomW / 2, g.bodyBaseY + collarHeight);
        ctx.lineTo(this.x + collarBottomW / 2, g.bodyBaseY + collarHeight);
        ctx.lineTo(this.x + collarTopW / 2, g.bodyBaseY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Tower body - each facet is its own light-to-dark gradient (not a flat fill), so the
        // prism reads as genuinely rounded instead of two flat colored panels meeting at a
        // seam - the facet split (the ridge below) now marks where the curve turns away from
        // the light the way a real shaded cylinder would, rather than being the only shading
        // cue. Replaces the old single ctx.arc() "cylinder" (a flat colored disc with no
        // vertical wall at all).
        const leftFacetGradient = ctx.createLinearGradient(this.x - g.wallRx, 0, this.x, 0);
        leftFacetGradient.addColorStop(0, '#6656C0');
        leftFacetGradient.addColorStop(0.5, '#8676DE');
        leftFacetGradient.addColorStop(1, '#A89CF0');
        ctx.fillStyle = leftFacetGradient;
        ctx.beginPath();
        ctx.moveTo(this.x - g.wallRx, g.bodyBaseY);
        ctx.lineTo(this.x - g.wallRx, g.bodyTopY);
        ctx.lineTo(this.x, g.bodyTopY);
        ctx.lineTo(this.x, g.bodyBaseY);
        ctx.closePath();
        ctx.fill();

        const rightFacetGradient = ctx.createLinearGradient(this.x, 0, this.x + g.wallRx, 0);
        rightFacetGradient.addColorStop(0, '#5A48A0');
        rightFacetGradient.addColorStop(0.5, '#3F2E80');
        rightFacetGradient.addColorStop(1, '#241A4A');
        ctx.fillStyle = rightFacetGradient;
        ctx.beginPath();
        ctx.moveTo(this.x, g.bodyBaseY);
        ctx.lineTo(this.x, g.bodyTopY);
        ctx.lineTo(this.x + g.wallRx, g.bodyTopY);
        ctx.lineTo(this.x + g.wallRx, g.bodyBaseY);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x - g.wallRx, g.bodyBaseY);
        ctx.lineTo(this.x - g.wallRx, g.bodyTopY);
        ctx.lineTo(this.x + g.wallRx, g.bodyTopY);
        ctx.lineTo(this.x + g.wallRx, g.bodyBaseY);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = Math.max(1, towerSize * 0.012);
        ctx.beginPath();
        ctx.moveTo(this.x, g.bodyBaseY);
        ctx.lineTo(this.x, g.bodyTopY);
        ctx.stroke();

        // Rounded cross-section cue - a bright sliver at the lit outer-left edge and a dark
        // sliver at the shadowed outer-right edge, the same "edge shadow/highlight strip"
        // technique MagicAcademy's _drawTowerShell uses on its own towers. Plain fillRect
        // (no ctx.clip()) is safe here because the body facets are true axis-aligned
        // rectangles rather than a tapered/curved outline, so the strip's own bounds already
        // stay inside the silhouette - clip() is a no-op through the in-game Pixi shim
        // (CanvasGraphicsShim), so relying on it here would leak past the edge in-game even
        // though it'd look fine in a plain Canvas2D test.
        const edgeW = Math.max(g.wallRx * 0.1, towerSize * 0.01);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(this.x - g.wallRx, g.bodyTopY, edgeW, g.bodyHeight);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
        ctx.fillRect(this.x + g.wallRx - edgeW, g.bodyTopY, edgeW, g.bodyHeight);

        // Corner quoins - alternating light/dark cut-stone blocks stacked along both vertical
        // edges, echoing real fortress corner masonry (and MagicAcademy's own cobblestone
        // coursing) instead of a bare colored edge. Aligned to the same row rhythm as the
        // horizontal coursing below so the whole body reads as one coursed structure.
        const courseCount = 5;
        const courseH = g.bodyHeight / courseCount;
        const quoinW = g.wallRx * 0.16;
        for (let c = 0; c < courseCount; c++) {
            const qy = g.bodyTopY + c * courseH;
            const lit = c % 2 === 0;
            ctx.fillStyle = lit ? 'rgba(225, 215, 255, 0.35)' : 'rgba(15, 10, 35, 0.4)';
            ctx.fillRect(this.x - g.wallRx, qy, quoinW, courseH - 1);
            ctx.fillRect(this.x + g.wallRx - quoinW, qy, quoinW, courseH - 1);
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 0.6;
            ctx.strokeRect(this.x - g.wallRx, qy, quoinW, courseH - 1);
            ctx.strokeRect(this.x + g.wallRx - quoinW, qy, quoinW, courseH - 1);
        }

        // Horizontal stone coursing - straight lines (not elliptical arcs) since the body
        // facets are flat planes rather than a curved cylinder; a curved seam across a
        // hard-edged prism read as subtly mismatched with its own straight-edged silhouette.
        // Each course also gets a faint alternating light/dark band, not just a bare line, so
        // the body reads as coursed masonry rather than a smooth panel with stray scratches.
        for (let c = 1; c < courseCount; c++) {
            const rowY = g.bodyTopY + c * courseH;
            ctx.fillStyle = c % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)';
            ctx.fillRect(this.x - g.wallRx, rowY, g.wallRx * 2, courseH * 0.28);
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x - g.wallRx, rowY);
            ctx.lineTo(this.x + g.wallRx, rowY);
            ctx.stroke();
        }

        // Thin arcane tick-marks down each facet - a static (non-animated) carved conduit
        // motif tying the body back to the inlaid rune circle on the foundation below,
        // without adding another moving light source. Built from short discrete segments
        // rather than ctx.setLineDash() since that API isn't confirmed supported by the
        // in-game Pixi shim - plain moveTo/lineTo pairs render identically everywhere.
        ctx.strokeStyle = 'rgba(160, 110, 230, 0.3)';
        ctx.lineWidth = Math.max(1, towerSize * 0.006);
        const tickCount = 5;
        const tickSpan = g.bodyHeight * 0.7;
        const tickGap = tickSpan / tickCount;
        [-1, 1].forEach(side => {
            const ix = this.x + side * g.wallRx * 0.55;
            for (let t = 0; t < tickCount; t++) {
                const ty0 = g.bodyBaseY - g.bodyHeight * 0.14 - t * tickGap;
                const ty1 = ty0 - tickGap * 0.55;
                ctx.beginPath();
                ctx.moveTo(ix, ty0);
                ctx.lineTo(ix, ty1);
                ctx.stroke();
            }
        });

        // Parapet cap the tesla coil is mounted on - always fully visible from above, so a
        // full ctx.ellipse() fill (start=0, end=2π) is safe here even through the Pixi shim.
        const capGradient = ctx.createLinearGradient(this.x, g.bodyTopY - g.capRy, this.x, g.bodyTopY + g.capRy);
        capGradient.addColorStop(0, '#A093EE');
        capGradient.addColorStop(1, '#4B3A9E');
        ctx.fillStyle = capGradient;
        ctx.strokeStyle = '#2E0A4F';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(this.x, g.bodyTopY, g.capRx, g.capRy, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Tesla coil base platform + column + rings, mounted on the parapet cap.
        const coilBaseRadius = g.coilWidth * 2.6;
        const coilBaseGradient = ctx.createLinearGradient(this.x - coilBaseRadius, g.coilBaseY, this.x + coilBaseRadius, g.coilBaseY);
        coilBaseGradient.addColorStop(0, '#1A1A1A');
        coilBaseGradient.addColorStop(0.5, '#4A4A4A');
        coilBaseGradient.addColorStop(1, '#1A1A1A');
        ctx.fillStyle = coilBaseGradient;
        ctx.strokeStyle = '#0A0A0A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(this.x, g.coilBaseY, coilBaseRadius, coilBaseRadius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        const coilGradient = ctx.createLinearGradient(this.x - g.coilWidth, 0, this.x + g.coilWidth, 0);
        coilGradient.addColorStop(0, '#3A3A3A');
        coilGradient.addColorStop(0.5, '#B0B0B0');
        coilGradient.addColorStop(1, '#3A3A3A');
        ctx.fillStyle = coilGradient;
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 2;
        ctx.fillRect(this.x - g.coilWidth, g.coilBaseY - g.coilHeight, g.coilWidth * 2, g.coilHeight);
        ctx.strokeRect(this.x - g.coilWidth, g.coilBaseY - g.coilHeight, g.coilWidth * 2, g.coilHeight);

        // Rings around the coil rod, flattened into ellipses (the coil is a vertical rod, so a
        // ring around it should project as a flattened ellipse at this camera angle, not a full
        // top-down circle like the original).
        const ringCount = 5;
        for (let i = 0; i < ringCount; i++) {
            const ringY = g.coilBaseY - g.coilHeight + (i + 1) * g.coilHeight / (ringCount + 1);
            const ringRx = g.coilWidth * (2 + Math.sin(i * 0.5));
            const ringRy = ringRx * 0.32;

            ctx.strokeStyle = '#A0A0A0';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(this.x, ringY, ringRx, ringRy, 0, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = '#E8E8E8';
            ctx.lineWidth = 1;
            this._strokeEllipseArc(ctx, this.x, ringY, ringRx, ringRy, -Math.PI / 3, Math.PI / 3);
        }

        // Small metallic mounting platform seating the gem on the coil, so it reads as
        // mounted hardware rather than a shape glued directly onto the rod tip. Neutral
        // colors, independent of selectedElement/crystalPulse, so - unlike the gem itself -
        // it belongs in this baked-once layer rather than renderDynamicParts: a gradient
        // rebuilt here costs nothing extra (baked once per campaign to a plain Canvas2D
        // offscreen canvas), but the same gradient rebuilt every ~33ms per tower instance in
        // the dynamic layer means recreating a GPU-backed FillGradient texture on every
        // redraw (see CanvasGraphicsShim's createLinearGradient/createRadialGradient doc
        // comment) - with enough Magic Towers on screen that per-frame churn is what was
        // actually behind the "massive performance hit" this platform used to cause when it
        // lived in renderDynamicParts.
        const platformRadius = g.gemRadius * 0.6;
        const platformGradient = ctx.createLinearGradient(this.x, g.sphereY - platformRadius * 0.25, this.x, g.sphereY + platformRadius * 0.25);
        platformGradient.addColorStop(0, '#6B6070');
        platformGradient.addColorStop(1, '#221A30');
        ctx.fillStyle = platformGradient;
        ctx.strokeStyle = '#0A0A0A';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = this.x + Math.cos(angle) * platformRadius;
            const y = g.sphereY + Math.sin(angle) * platformRadius * 0.35;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    /** Strategy B (per-instance Graphics, redrawn every frame): window glow + gem - pulse animation and element-dependent color are continuous per-instance state, not bakeable. */
    renderDynamicParts(ctx, towerSize) {
        const g = this._getGeometry(towerSize);

        // Mystical windows on the two visible body facets (not wrapped impossibly around the
        // back of a solid prism like the original's 4-window full ring). Arched carved-stone
        // surround (frame, keystone, sill) matching MagicAcademy's own window language
        // (renderCentralTowerStatic) instead of a bare glowing circle, so the two structures
        // read as the same architectural vocabulary.
        const windowSpecs = [{ fx: -0.5 }, { fx: 0.5 }];
        windowSpecs.forEach(win => {
            const windowX = this.x + g.wallRx * win.fx;
            const windowY = g.bodyBaseY - g.bodyHeight * 0.55;
            const winW = towerSize * 0.055;
            const winH = towerSize * 0.09;
            const archR = winW / 2;
            // crystalPulse is already a calm, high-floored breathing value (see update()) -
            // read directly rather than re-deriving another floor/range here, so every glow
            // site on the tower breathes in the same rhythm instead of each inventing its own.
            const glowStrength = this.crystalPulse;

            // Outer light halo, behind the frame, so the window reads as an active light
            // source rather than just a lit hole in the wall. Approximated with a few flat
            // alpha-blended circles instead of a radial gradient - a FillGradient rebuilt
            // every ~33ms per tower (this runs in renderDynamicParts, redrawn every sync())
            // allocates a real GPU texture each time it's recreated (see
            // CanvasGraphicsShim's createRadialGradient doc comment), which is cheap for one
            // tower but adds up fast with several Magic Towers on screen - this was in fact
            // the actual source of the "massive performance hit" reported after this
            // window's glow was first added. Flat circle fills cost nothing comparable.
            ctx.fillStyle = `rgba(150, 60, 230, ${glowStrength * 0.12})`;
            ctx.beginPath();
            ctx.arc(windowX, windowY, winH * 1.7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(170, 90, 255, ${glowStrength * 0.22})`;
            ctx.beginPath();
            ctx.arc(windowX, windowY, winH * 1.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(190, 110, 255, ${glowStrength * 0.35})`;
            ctx.beginPath();
            ctx.arc(windowX, windowY, winH * 0.6, 0, Math.PI * 2);
            ctx.fill();

            // Carved stone surround
            ctx.fillStyle = '#241a44';
            ctx.fillRect(windowX - winW / 2 - 1.5, windowY - winH / 2 - 1.5, winW + 3, winH + 3);
            ctx.beginPath();
            ctx.arc(windowX, windowY - winH / 2 - 1.5, archR + 1.5, Math.PI, 0);
            ctx.fill();

            // Dark opening
            ctx.fillStyle = '#0c0818';
            ctx.fillRect(windowX - winW / 2, windowY - winH / 2, winW, winH);
            ctx.beginPath();
            ctx.arc(windowX, windowY - winH / 2, archR, Math.PI, 0);
            ctx.fill();

            // Frame outline
            ctx.strokeStyle = '#4A3060';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(windowX - winW / 2, windowY + winH / 2);
            ctx.lineTo(windowX - winW / 2, windowY - winH / 2);
            ctx.arc(windowX, windowY - winH / 2, archR, Math.PI, 0);
            ctx.lineTo(windowX + winW / 2, windowY + winH / 2);
            ctx.stroke();

            // Glowing glass filling the opening, pulse-driven
            ctx.fillStyle = `rgba(190, 110, 255, ${glowStrength * 0.85})`;
            ctx.fillRect(windowX - winW / 2 + 1, windowY - winH / 2 + 1, winW - 2, winH * 0.65);
            ctx.beginPath();
            ctx.arc(windowX, windowY - winH / 2 + 1, archR - 1, Math.PI, 0);
            ctx.fill();

            // Keystone and sill for a finished carved look
            ctx.fillStyle = '#5c4a80';
            ctx.fillRect(windowX - winW * 0.15, windowY - winH / 2 - archR - 2, winW * 0.3, 2.5);
            ctx.fillStyle = '#4A3060';
            ctx.fillRect(windowX - winW / 2 - 1.5, windowY + winH / 2, winW + 3, 2);
        });

        // Tesla coil top elemental gem crystal (prism shape)
        const sphereY = g.sphereY;
        const gemRadius = g.gemRadius;

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
        const elementGlow = this._hexToRgbaPrefix(gemData.glow);

        ctx.save();

        // Ambient power-core glow beneath the gem - glowSize was computed above but never
        // actually drawn with in the original, leaving the gem floating with no light spill.
        ctx.fillStyle = elementGlow + `${this.crystalPulse * 0.2})`;
        ctx.beginPath();
        ctx.ellipse(cx, sphereY + gb * 0.3, glowSize * 1.3, glowSize * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // (Mounting platform now lives in renderStaticBack - it's neutral/static geometry
        // that never depends on crystalPulse or selectedElement, so it's baked once instead
        // of rebuilding a gradient-filled shape every frame - see that method.)

        // Containment-field halo at the gem's own scale - a broken ring (two arcs with gaps,
        // not a full circle) so it reads as an energy band rather than another solid outline
        // competing with the gem's silhouette.
        const haloRadius = gemRadius * 1.5;
        const haloRy = haloRadius * 0.35;
        ctx.strokeStyle = elementGlow + `${this.crystalPulse * 0.4})`;
        ctx.lineWidth = 1.5;
        this._strokeEllipseArc(ctx, cx, sphereY, haloRadius, haloRy, this.runeRotation, this.runeRotation + Math.PI * 0.7);
        this._strokeEllipseArc(ctx, cx, sphereY, haloRadius, haloRy, this.runeRotation + Math.PI, this.runeRotation + Math.PI * 1.7);

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
        const g = this._getGeometry(towerSize);
        const sphereY = g.sphereY;

        // Floating runes orbit at the same flattened ratio as the foundation itself
        // (baseFlat/baseRadius) so the ring reads as one consistent piece of the tower's own
        // perspective instead of an arbitrarily squashed ellipse. Glow radius and font size
        // now scale with towerSize - both were fixed pixel values before, so they stayed a
        // constant on-screen size regardless of resolution/zoom while everything else on the
        // tower scaled with it.
        const runeRadius = g.baseRadius * 1.25;
        const runeSquash = g.baseFlat / g.baseRadius;
        const runeGlowR = towerSize * 0.032;
        const runeFontSize = Math.round(towerSize * 0.037);

        for (let i = 0; i < this.runePositions.length; i++) {
            const rune = this.runePositions[i];
            // Slower, smaller bob (was a fixed 6px at 2rad/s) for a calmer float in step with
            // the slower orbit (see update()'s runeRotation) and the calmer crystalPulse.
            const floatY = Math.sin(this.animationTime * 1.3 + rune.floatOffset) * towerSize * 0.012;
            const runeAngle = this.runeRotation + rune.angle;
            const runeX = this.x + Math.cos(runeAngle) * runeRadius;
            const runeY = g.bodyBaseY - g.bodyHeight * 0.3 + Math.sin(runeAngle) * runeRadius * runeSquash + floatY;

            // Rune glow - crystalPulse read directly (see update()'s doc comment), same as
            // the window/gem glow, so every light source on the tower breathes in sync.
            ctx.fillStyle = `rgba(138, 43, 226, ${this.crystalPulse * 0.35})`;
            ctx.beginPath();
            ctx.arc(runeX, runeY, runeGlowR, 0, Math.PI * 2);
            ctx.fill();

            // Rune symbol
            ctx.fillStyle = `rgba(255, 255, 255, ${this.crystalPulse})`;
            ctx.font = `bold ${runeFontSize}px serif`;
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
