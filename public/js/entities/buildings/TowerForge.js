import { Building } from './Building.js';

export class TowerForge extends Building {
    /** The building's natural proportions (walls+roof+chimney) run a bit wider/taller than
     *  its 4x4 placement grid cell. Every render entry point (renderStaticBack,
     *  renderDynamicParts) scales its whole drawing down by this factor around the (this.x,
     *  this.y) anchor so the structure - and the yard clutter/vegetation around it - stays
     *  within the grid cell instead of spilling into neighboring tiles. update()'s particle
     *  spawn math (sparks/smoke, drawn later with no transform) applies the same factor to
     *  its own position offsets so effects still originate from the visually-shrunk opening
     *  and chimney instead of the old, larger positions.
     */
    static STRUCTURE_SCALE = 0.78;

    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY, 4);
        this.sparks = [];
        this.nextSparkTime = 0;
        this.isSelected = false;
        this.smokeParticles = [];
        this.nextSmokeTime = 0;
        this.fireIntensity = 0;
        
        // Add workers
        this.workers = [
            {
                x: 15, y: 25,
                animationOffset: 0,
                hammerRaised: 0,
                workCooldown: 0,
                type: 'blacksmith'
            },
            {
                x: -20, y: 20,
                animationOffset: Math.PI,
                hammerRaised: 0,
                workCooldown: 1.5,
                type: 'helper'
            }
        ];
        
        // Forge level - starts at 1 when built, can upgrade to 5
        this.forgeLevel = 1; // Built directly at level 1
        this.maxForgeLevel = 5;
        
        // Tower-specific upgrades
        // Each tower upgrade has a base cost and effect, and can be upgraded up to forge level
        // This allows the forge to gate tower upgrades based on its own level
        this.upgrades = {
            // Basic towers - always available at forge level 1
            'basic': { level: 0, baseCost: 80, effect: 8 },
            'barricade_effectiveness': { level: 0, baseCost: 125, effect: { capacity: 2.0, duration: 1.5 } }, // Capacity: 4→14, Duration: 4s→11.5s
            'archer': { level: 0, baseCost: 100, damageEffect: 8, pierceEffect: 5 },
            
            // Poison upgrades - available at forge level 2+
            // Tick damage upgrades: +5 per level (base: 13, cumulative: 18, 23, 28, 33, 38)
            'poison': { level: 0, baseCost: 200, effect: [5, 5, 5, 5, 5] },
            
            // Cannon upgrades - available at forge level 3+
            'cannon': { level: 0, baseCost: 120, damageEffect: 25, radiusEffect: 5 }
        };
        
        // Pre-computed grass blade positions to prevent per-frame flickering. Positioned
        // along the yard's front edge, clear of the flagstone work floor (renderWorkFloor,
        // y up to ~44) - actual blade strokes instead of a flat green gradient blob read as
        // real grass encroaching from the surrounding field rather than a painted-on patch.
        this.grassBlades = [
            { cx: -50, cy: 50, blades: [] },
            { cx: -24, cy: 56, blades: [] },
            { cx: -8,  cy: 50, blades: [] },
            { cx: 4,   cy: 58, blades: [] },
            { cx: 28,  cy: 55, blades: [] },
            { cx: 50,  cy: 49, blades: [] }
        ].map(clump => {
            const count = 4 + Math.floor(clump.cx * 0.7 % 2) + 1; // 4-5 blades, deterministic
            const blades = [];
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2 + clump.cy * 0.08;
                const dist = (clump.cx * 0.03 + i * 0.7) % 3.2;
                blades.push({
                    dx: Math.cos(angle) * dist,
                    dy: Math.sin(angle) * dist,
                    tipDx: (i % 3 - 1) * 0.7,
                    height: 3.5 + (i * 0.9 % 3)
                });
            }
            return { cx: clump.cx, cy: clump.cy, blades };
        });

        // Set by BuildingRenderAdapter once it has baked/synced this building's static
        // structure via Pixi (sparks/smoke still draw here regardless - not yet migrated).
        this.skipCanvas2DBodyRender = false;
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update fire intensity
        this.fireIntensity = Math.sin(this.animationTime * 6) * 0.3 + 0.7;
        
        // Update workers
        const renderSize = this._lastRenderSize || 128;
        const sizeScale = renderSize / 128;
        const S = TowerForge.STRUCTURE_SCALE; // sparks/smoke are stored in world space and
        // drawn later with no transform, so their spawn offsets must apply the same shrink
        // renderStaticBack/renderDynamicParts apply visually, or effects drift off the
        // now-smaller opening/chimney/worker positions.
        this.workers.forEach(worker => {
            worker.workCooldown -= deltaTime;
            worker.hammerRaised = Math.max(0, worker.hammerRaised - deltaTime * 3);

            if (worker.workCooldown <= 0) {
                worker.hammerRaised = 1;
                worker.workCooldown = 2 + Math.random() * 2;

                // Create sparks when worker strikes - position scales with building size
                if (worker.type === 'blacksmith') {
                    for (let i = 0; i < 3; i++) {
                        this.sparks.push({
                            x: this.x + (worker.x * sizeScale + (Math.random() - 0.5) * 5 * sizeScale) * S,
                            y: this.y + (worker.y * sizeScale + (Math.random() - 0.5) * 5 * sizeScale) * S,
                            vx: (Math.random() - 0.5) * 40 * sizeScale,
                            vy: (-Math.random() * 60 - 20) * sizeScale,
                            life: 0.8,
                            maxLife: 0.8,
                            size: (Math.random() * 1.5 + 0.5) * sizeScale,
                            color: Math.random() > 0.5 ? 'orange' : 'yellow'
                        });
                    }
                }
            }
        });

        // Generate forge sparks from fire opening.
        // Opening center: x = this.x - 15 (matching renderForgeOpening's computed center),
        // y = this.y - 5 (openingY + openingHeight/2 = this.y - openingHeight/2 - 5 + openingHeight/2).
        this.nextSparkTime -= deltaTime;
        if (this.nextSparkTime <= 0) {
            const sparkCount = this.isSelected ? 8 : 5;
            for (let i = 0; i < sparkCount; i++) {
                this.sparks.push({
                    x: this.x + (-15 + (Math.random() - 0.5) * 25 * sizeScale) * S,
                    y: this.y + (-5 + (Math.random() - 0.5) * 15 * sizeScale) * S,
                    vx: (Math.random() - 0.5) * 60 * sizeScale,
                    vy: (-Math.random() * 80 - 30) * sizeScale,
                    life: 1.2,
                    maxLife: 1.2,
                    size: (Math.random() * 2 + 1) * sizeScale,
                    color: Math.random() > 0.4 ? 'orange' : (Math.random() > 0.7 ? 'yellow' : 'red')
                });
            }
            this.nextSparkTime = 0.1 + Math.random() * 0.2;
        }

        // Generate chimney smoke - FROM TOP OF INTEGRATED CHIMNEY
        this.nextSmokeTime -= deltaTime;
        if (this.nextSmokeTime <= 0) {
            // Use the actual rendered size (cellSize * 4, resolution-dependent).
            // Falls back to 128 only before the first render() call.
            const size = this._lastRenderSize || 128;
            const buildingWidth = size * 0.9;
            const chimneyWidth = size * 0.16;
            const chimneyHeight = size * 0.7;
            const wallHeight = size * 0.5;

            const chimneyX = this.x + (buildingWidth/2) * S; // Right edge of building
            const shaftHeight = chimneyHeight - wallHeight;
            const chimneyTopY = this.y - (wallHeight + shaftHeight) * S; // Top of chimney shaft

            this.smokeParticles.push({
                x: chimneyX + (chimneyWidth/2) * S + (Math.random() - 0.5) * 10, // From chimney opening
                y: chimneyTopY,
                vx: (Math.random() - 0.5) * 20,
                vy: -30 - Math.random() * 20,
                life: 3,
                maxLife: 3,
                size: Math.random() * 8 + 4
            });
            this.nextSmokeTime = 0.3 + Math.random() * 0.4;
        }
        
        // Update particles (compact in-place)
        let spWrite = 0;
        for (let i = 0; i < this.sparks.length; i++) {
            const spark = this.sparks[i];
            spark.x += spark.vx * deltaTime;
            spark.y += spark.vy * deltaTime;
            spark.life -= deltaTime;
            spark.vy += 150 * deltaTime;
            spark.size = Math.max(0, spark.size - deltaTime * 2);
            if (spark.life > 0 && spark.size > 0) {
                this.sparks[spWrite++] = spark;
            }
        }
        this.sparks.length = spWrite;
        
        let smWrite = 0;
        for (let i = 0; i < this.smokeParticles.length; i++) {
            const smoke = this.smokeParticles[i];
            smoke.x += smoke.vx * deltaTime;
            smoke.y += smoke.vy * deltaTime;
            smoke.life -= deltaTime;
            smoke.size += deltaTime * 3;
            smoke.vx *= 0.99;
            if (smoke.life > 0) {
                this.smokeParticles[smWrite++] = smoke;
            }
        }
        this.smokeParticles.length = smWrite;
        
        // Update flash opacity (fade out slowly over 0.4 seconds for balanced effect)
        this.flashOpacity = Math.max(0, this.flashOpacity - deltaTime * 1.5);
    }
    
    render(ctx, size) {
        // Cache the actual rendered size so update() can match chimney positions exactly.
        this._lastRenderSize = size;

        if (!this.skipCanvas2DBodyRender) {
            this.renderStaticBack(ctx, size);
            this.renderDynamicParts(ctx, size);
        }

        // Render particles - not yet migrated (Phase 6-shaped ephemeral effects)
        this.renderParticles(ctx);
    }

    /** No front-of-building overlay for this type - present for BuildingRenderAdapter's uniform convention. */
    renderStaticFront(ctx, size) {
        // intentionally empty
    }

    /** Strategy A (baked once per campaign, shared across instances): building shell - shadow, front-area props, walls, forge opening frame, chimney structure, roof, forge interior props. Excludes fire-glow effects and workers (see renderDynamicParts). */
    renderStaticBack(ctx, size) {
        // CRITICAL: Receive size parameter which is already cellSize * 4 for 4x4 building
        // size = cellSize * 4
        const buildingWidth = size * 0.9;
        const buildingHeight = size * 0.6;
        const wallHeight = size * 0.5;

        // Back vegetation - drawn BEFORE the wall/chimney/roof (and before the shrink
        // transform below, so it's at true scale like TrainingGrounds/BasicTower's corner
        // trees) so the building's opaque shapes naturally occlude any overlapping canopy.
        // This is what was making a tree beside the chimney read as "floating in front of
        // it" - it was drawn last, on top of everything, instead of behind the structure it
        // stands beside.
        this.renderBackVegetation(ctx, size);

        // Shrink the whole structure around its anchor point so it fits its grid cell -
        // see STRUCTURE_SCALE's doc comment.
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(TowerForge.STRUCTURE_SCALE, TowerForge.STRUCTURE_SCALE);
        ctx.translate(-this.x, -this.y);

        // Building shadow - FIXED: Only for the actual building, not full 4x4 grid
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(this.x - buildingWidth/2 + 4, this.y - wallHeight + 4, buildingWidth, wallHeight);

        // Render detailed front area items FIRST (behind workers)
        this.renderFrontAreaItems(ctx, size);

        // Cobblestone wall structure
        this.renderCobblestoneWalls(ctx, buildingWidth, buildingHeight, wallHeight);

        // Forge opening frame (static part - fire glow is dynamic, see renderDynamicParts)
        this.renderForgeOpening(ctx, size);

        // Chimney structure (static part - interior fire glow is dynamic)
        this.renderChimney(ctx, size);

        // Roof
        this.renderRoof(ctx, buildingWidth, buildingHeight, wallHeight);

        // Forge interior props (coal/anvil/hammer - static part, fire flicker is dynamic)
        this.renderForgeInterior(ctx, size);

        ctx.restore();

        // Front vegetation - drawn AFTER everything else (front-yard props included), at
        // true scale. These trees stand at a larger y (further forward/closer to the viewer)
        // than the log pile/grindstone/barrels in the yard, so painter's-algorithm depth
        // requires them on top of those props, not underneath - drawing them earlier (with
        // the back trees) was letting the log pile paint over the tree trunks in front of it.
        this.renderFrontVegetation(ctx, size);
    }

    /** Strategy B (per-instance Graphics, redrawn every frame): fire-glow effects (fireIntensity flicker) + workers (hammer-swing animation) - all continuous per-instance state. */
    renderDynamicParts(ctx, size) {
        // Same anchor-scale as renderStaticBack, so glow/fire/workers line up with the
        // shrunk opening/chimney/worker-footprint instead of the old unshrunk geometry.
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(TowerForge.STRUCTURE_SCALE, TowerForge.STRUCTURE_SCALE);
        ctx.translate(-this.x, -this.y);

        this.renderForgeOpeningGlow(ctx, size);
        this.renderChimneyGlow(ctx, size);
        this.renderForgeFire(ctx, size);
        this.renderWorkers(ctx, size);

        ctx.restore();
    }

    renderFrontAreaItems(ctx, size) {
        // FIRST: Render natural ground patches
        this.renderNaturalGroundDetails(ctx, size);
        
        // Storage barrels
        const barrels = [
            { x: -25, y: 30, size: 8, type: 'wood' },
            { x: -10, y: 32, size: 7, type: 'metal' },
            { x: 30, y: 28, size: 9, type: 'wood' }
        ];
        
        barrels.forEach(barrel => {
            ctx.save();
            ctx.translate(this.x + barrel.x, this.y + barrel.y);
            
            // Barrel shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(-barrel.size/2 + 2, -barrel.size + 2, barrel.size, barrel.size);
            
            if (barrel.type === 'wood') {
                ctx.fillStyle = '#8B4513';
                ctx.strokeStyle = '#654321';
            } else {
                ctx.fillStyle = '#2F2F2F';
                ctx.strokeStyle = '#1C1C1C';
            }
            
            ctx.lineWidth = 2;
            ctx.fillRect(-barrel.size/2, -barrel.size, barrel.size, barrel.size);
            ctx.strokeRect(-barrel.size/2, -barrel.size, barrel.size, barrel.size);
            
            // Barrel bands
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-barrel.size/2, -barrel.size * 0.7);
            ctx.lineTo(barrel.size/2, -barrel.size * 0.7);
            ctx.moveTo(-barrel.size/2, -barrel.size * 0.3);
            ctx.lineTo(barrel.size/2, -barrel.size * 0.3);
            ctx.stroke();
            
            // Barrel top ellipse for 3D depth
            const topFill = barrel.type === 'wood' ? '#A0522D' : '#404040';
            const topStroke = barrel.type === 'wood' ? '#654321' : '#1C1C1C';
            ctx.fillStyle = topFill;
            ctx.beginPath();
            ctx.ellipse(0, -barrel.size, barrel.size / 2, barrel.size * 0.18, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = topStroke;
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.restore();
        });
        
        // Wooden crates
        const crates = [
            { x: 5, y: 35, size: 10, rotation: 0.1 },
            { x: 20, y: 38, size: 8, rotation: -0.1 }
        ];
        
        crates.forEach(crate => {
            ctx.save();
            ctx.translate(this.x + crate.x, this.y + crate.y);
            ctx.rotate(crate.rotation);
            
            // Crate shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(-crate.size/2 + 2, -crate.size + 2, crate.size, crate.size);
            
            // Crate body
            ctx.fillStyle = '#CD853F';
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.fillRect(-crate.size/2, -crate.size, crate.size, crate.size);
            ctx.strokeRect(-crate.size/2, -crate.size, crate.size, crate.size);
            
            // Wood planks
            ctx.lineWidth = 1;
            for (let i = 1; i < 4; i++) {
                const plankY = -crate.size + (crate.size * i / 4);
                ctx.beginPath();
                ctx.moveTo(-crate.size/2, plankY);
                ctx.lineTo(crate.size/2, plankY);
                ctx.stroke();
            }
            
            ctx.restore();
        });
        
        // Metal buckets
        const buckets = [
            { x: -35, y: 25, size: 6 },
            { x: 35, y: 35, size: 5 }
        ];
        
        buckets.forEach(bucket => {
            ctx.save();
            ctx.translate(this.x + bucket.x, this.y + bucket.y);
            
            // Bucket shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(2, 2, bucket.size, bucket.size * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Bucket body
            ctx.fillStyle = '#696969';
            ctx.strokeStyle = '#2F2F2F';
            ctx.lineWidth = 1;
            
            ctx.beginPath();
            ctx.moveTo(-bucket.size * 0.8, 0);
            ctx.lineTo(-bucket.size * 0.6, -bucket.size);
            ctx.lineTo(bucket.size * 0.6, -bucket.size);
            ctx.lineTo(bucket.size * 0.8, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Bucket rim
            ctx.fillStyle = '#808080';
            ctx.fillRect(-bucket.size * 0.8, -2, bucket.size * 1.6, 4);
            
            // Handle
            ctx.strokeStyle = '#2F2F2F';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, -bucket.size * 0.5, bucket.size * 0.7, -Math.PI * 0.3, -Math.PI * 0.7, true);
            ctx.stroke();
            
            ctx.restore();
        });
        
        // Metal ingots pile
        const ingotPile = { x: -5, y: 25 };
        ctx.save();
        ctx.translate(this.x + ingotPile.x, this.y + ingotPile.y);
        
        // Ingot pile shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-8, -3, 16, 6);
        
        // Individual ingots
        const ingots = [
            { x: -6, y: 0, width: 12, height: 3 },
            { x: -4, y: -3, width: 8, height: 3 },
            { x: 2, y: -1, width: 10, height: 3 }
        ];
        
        ingots.forEach(ingot => {
            ctx.fillStyle = '#C0C0C0';
            ctx.strokeStyle = '#808080';
            ctx.lineWidth = 1;
            ctx.fillRect(ingot.x, ingot.y, ingot.width, ingot.height);
            ctx.strokeRect(ingot.x, ingot.y, ingot.width, ingot.height);
            
            // Metal shine
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fillRect(ingot.x, ingot.y, ingot.width * 0.3, ingot.height * 0.5);
        });
        
        ctx.restore();
        
        // Scattered tools
        const tools = [
            { x: -30, y: 15, type: 'hammer' },
            { x: 25, y: 20, type: 'tongs' },
            { x: 12, y: 28, type: 'file' }
        ];
        
        tools.forEach(tool => {
            ctx.save();
            ctx.translate(this.x + tool.x, this.y + tool.y);
            
            switch(tool.type) {
                case 'hammer':
                    // Hammer handle
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(-1, 0, 2, 12);
                    // Hammer head
                    ctx.fillStyle = '#2F2F2F';
                    ctx.fillRect(-3, 0, 4, 2);
                    break;
                    
                case 'tongs':
                    // Tongs arms
                    ctx.strokeStyle = '#2F2F2F';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(-2, 10);
                    ctx.lineTo(-4, 0);
                    ctx.moveTo(2, 10);
                    ctx.lineTo(4, 0);
                    ctx.stroke();
                    // Tongs pivot
                    ctx.fillStyle = '#1C1C1C';
                    ctx.beginPath();
                    ctx.arc(0, 6, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 'file':
                    // File body
                    ctx.fillStyle = '#696969';
                    ctx.fillRect(-1, 0, 2, 8);
                    // File handle
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(-0.5, 8, 1, 4);
                    break;
            }
            
            ctx.restore();
        });
        
        // Coal pile near forge - FIXED POSITIONS to prevent flickering
        const coalPile = { x: -40, y: 10 };
        ctx.save();
        ctx.translate(this.x + coalPile.x, this.y + coalPile.y);
        
        ctx.fillStyle = '#1C1C1C';
        // Use fixed positions instead of random to prevent flickering
        const fixedCoalPositions = [
            { x: -6, y: -2, size: 2 },
            { x: -2, y: -1, size: 2.5 },
            { x: 2, y: -2, size: 1.8 },
            { x: 6, y: 0, size: 2.2 },
            { x: -4, y: 1, size: 1.5 },
            { x: 0, y: 2, size: 2.8 },
            { x: 4, y: 1, size: 1.7 },
            { x: 1, y: -1, size: 2.3 }
        ];
        
        fixedCoalPositions.forEach(coal => {
            ctx.beginPath();
            ctx.arc(coal.x, coal.y, coal.size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();

        // Dedicated workstation props - anvil, quench barrel, fuel logs, wall tool rack, grindstone
        this.renderWorkstationProps(ctx, size);
    }

    /** A pair of trees on each side (a back accent + a front corner tree), sized the way
     *  TrainingGrounds' fenceDecorations and BasicTower's drawEnvironmentBack/Front corner
     *  trees are - proportionally large relative to the 4x4 grid cell (and the workers
     *  standing next to them), spread around the building rather than tucked behind it, so
     *  the structure reads as standing in a clearing surrounded by trees. No bushes - the
     *  fallback bush shape (a flat 3-circle green blob) never looked like real foliage, just
     *  an odd smudge, so it's gone rather than reworked. Rendered at true scale (outside the
     *  structure's own shrink transform - see the call sites in renderStaticBack). Split into
     *  two passes by depth, painter's-algorithm style, rather than one "all vegetation" call:
     *  the back accents (negative y) are drawn behind the wall/chimney so those opaque shapes
     *  correctly occlude any overlapping canopy instead of the plant floating on top of them;
     *  the front corner trees (positive y - further forward/closer to the viewer than
     *  anything in the yard) are drawn LAST, after the log pile/grindstone/barrels/etc., so
     *  those props don't incorrectly poke through the tree trunks in front of them. Uses the
     *  level's own campaign-themed vegetation renderer when available (gameplay - forest/
     *  desert/mountain/space, matching GoldMine/TrainingGrounds/MagicAcademy's convention);
     *  ctx.level is never set for TowerForge in the Settlement Hub (see
     *  SettlementBuildingVisuals), so the fallback naturally gives the Hub the same forest
     *  look gameplay gets, instead of a cruder placeholder shape. */
    renderBackVegetation(ctx, size) {
        this._renderVegetationPlants(ctx, [
            { x: -56, y: -16, scale: 46, variant: 0, kind: 'tree' },
            { x: 50,  y: -14, scale: 30, variant: 1, kind: 'tree' }
        ]);
    }

    renderFrontVegetation(ctx, size) {
        this._renderVegetationPlants(ctx, [
            { x: -58, y: 38, scale: 44, variant: 2, kind: 'tree' },
            { x: 56,  y: 40, scale: 44, variant: 3, kind: 'tree' }
        ]);
    }

    _renderVegetationPlants(ctx, plants) {
        plants.forEach(p => {
            const px = this.x + p.x;
            const py = this.y + p.y;
            if (ctx.level) {
                ctx.level.renderVegetation(ctx, px, py, p.scale, 0, 0, p.variant);
            } else {
                this.renderFallbackForestTree(ctx, px, py, p.scale, p.variant);
            }
        });
    }

    /** Forest tree used only when ctx.level isn't set (Settlement Hub). Four distinct
     *  variants copied from TrainingGrounds'/LevelBase's own forest tree renderer (not the
     *  old single round-blob shape) so the Hub's forge yard matches the same forest look
     *  gameplay gets via ctx.level.renderVegetation, instead of reading as a different,
     *  cruder style. */
    renderFallbackForestTree(ctx, x, y, size, variant = 0) {
        switch (((variant % 4) + 4) % 4) {
            case 0: this.renderFallbackTreeType1(ctx, x, y, size); break;
            case 1: this.renderFallbackTreeType2(ctx, x, y, size); break;
            case 2: this.renderFallbackTreeType3(ctx, x, y, size); break;
            default: this.renderFallbackTreeType4(ctx, x, y, size);
        }
    }

    renderFallbackTreeType1(ctx, x, y, size) {
        const trunkWidth = size * 0.25;
        const trunkHeight = size * 0.5;
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(x, y, trunkWidth * 0.5, trunkHeight);
        ctx.fillStyle = '#0D3817';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.6);
        ctx.lineTo(x + size * 0.35, y - size * 0.1);
        ctx.lineTo(x - size * 0.35, y - size * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(6, 26, 10, 0.4)';
        ctx.lineWidth = size * 0.02;
        ctx.stroke();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.35);
        ctx.lineTo(x + size * 0.3, y + size * 0.05);
        ctx.lineTo(x - size * 0.3, y + size * 0.05);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.15);
        ctx.lineTo(x + size * 0.25, y + size * 0.2);
        ctx.lineTo(x - size * 0.25, y + size * 0.2);
        ctx.closePath();
        ctx.fill();
    }

    renderFallbackTreeType2(ctx, x, y, size) {
        const trunkWidth = size * 0.2;
        const trunkHeight = size * 0.4;
        ctx.fillStyle = '#6B4423';
        ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);
        ctx.fillStyle = '#8B5A3C';
        ctx.fillRect(x - trunkWidth * 0.5 + trunkWidth * 0.6, y, trunkWidth * 0.4, trunkHeight);
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(6, 26, 10, 0.4)';
        ctx.lineWidth = size * 0.02;
        ctx.stroke();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.35, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#43A047';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.55, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    renderFallbackTreeType3(ctx, x, y, size) {
        // Sparse tree with distinct branches
        const trunkWidth = size * 0.22;
        ctx.fillStyle = '#795548';
        ctx.fillRect(x - trunkWidth * 0.5, y - size * 0.2, trunkWidth, size * 0.6);
        ctx.fillStyle = '#4E342E';
        ctx.beginPath();
        ctx.arc(x + trunkWidth * 0.25, y, trunkWidth * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1B5E20';
        ctx.strokeStyle = 'rgba(6, 26, 10, 0.4)';
        ctx.lineWidth = size * 0.02;
        ctx.beginPath();
        ctx.arc(x - size * 0.28, y - size * 0.35, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + size * 0.28, y - size * 0.3, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.55, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    renderFallbackTreeType4(ctx, x, y, size) {
        // Pine/Spruce style with layered triangles
        const trunkWidth = size * 0.18;
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - trunkWidth * 0.5, y - size * 0.05, trunkWidth, size * 0.45);
        ctx.fillStyle = '#0D3817';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.05);
        ctx.lineTo(x + size * 0.38, y + size * 0.15);
        ctx.lineTo(x - size * 0.38, y + size * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(6, 26, 10, 0.4)';
        ctx.lineWidth = size * 0.02;
        ctx.stroke();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.25);
        ctx.lineTo(x + size * 0.3, y);
        ctx.lineTo(x - size * 0.3, y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.45);
        ctx.lineTo(x + size * 0.2, y - size * 0.15);
        ctx.lineTo(x - size * 0.2, y - size * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#43A047';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.65);
        ctx.lineTo(x + size * 0.12, y - size * 0.35);
        ctx.lineTo(x - size * 0.12, y - size * 0.35);
        ctx.closePath();
        ctx.fill();
    }

    /** Exterior blacksmith workstation - anvil the blacksmith worker actually strikes, a
     *  quench barrel, a fuel log pile, a wall-mounted tool rack and a grindstone. Turns the
     *  yard from generic storage clutter into a working forge station. */
    renderWorkstationProps(ctx, size) {
        // Anvil on a tree-stump base, positioned right at the blacksmith worker's feet
        // so the hammer-swing animation reads as striking it.
        ctx.save();
        ctx.translate(this.x + 15, this.y + 24);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(1, 2, 7, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stump
        ctx.fillStyle = '#6B4423';
        ctx.strokeStyle = '#4A2E15';
        ctx.lineWidth = 1;
        ctx.fillRect(-5, -6, 10, 8);
        ctx.strokeRect(-5, -6, 10, 8);
        ctx.fillStyle = '#7C5233';
        ctx.beginPath();
        ctx.ellipse(0, -6, 5, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#4A2E15';
        ctx.stroke();
        ctx.strokeStyle = 'rgba(74, 46, 21, 0.6)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.ellipse(0, -6, 3, 1.2, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Anvil body
        ctx.fillStyle = '#2A2A2A';
        ctx.strokeStyle = '#0F0F0F';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-6, -8);
        ctx.lineTo(6, -8);
        ctx.lineTo(7, -11);
        ctx.lineTo(-4, -11);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Anvil horn
        ctx.beginPath();
        ctx.moveTo(-4, -11);
        ctx.lineTo(-9, -12);
        ctx.lineTo(-8, -10);
        ctx.lineTo(-4, -9.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Anvil top highlight (polished from striking)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(-4, -11, 8, 1.5);
        ctx.restore();

        // Quench barrel - water tub for cooling hot metal
        ctx.save();
        ctx.translate(this.x + 40, this.y + 15);
        const qSize = 9;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-qSize/2 + 2, -qSize + 2, qSize, qSize);
        ctx.fillStyle = '#5C3A21';
        ctx.strokeStyle = '#3B2414';
        ctx.lineWidth = 2;
        ctx.fillRect(-qSize/2, -qSize, qSize, qSize);
        ctx.strokeRect(-qSize/2, -qSize, qSize, qSize);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-qSize/2, -qSize * 0.65);
        ctx.lineTo(qSize/2, -qSize * 0.65);
        ctx.moveTo(-qSize/2, -qSize * 0.25);
        ctx.lineTo(qSize/2, -qSize * 0.25);
        ctx.stroke();
        // Water surface
        ctx.fillStyle = '#3B6EA5';
        ctx.beginPath();
        ctx.ellipse(0, -qSize, qSize/2 - 0.5, qSize * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#274766';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.ellipse(-1.5, -qSize - 0.5, 1.6, 0.6, 0.3, 0, Math.PI * 2);
        ctx.fill();
        // Faint steam wisp
        ctx.strokeStyle = 'rgba(220, 220, 220, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-1, -qSize - 1);
        ctx.quadraticCurveTo(-3, -qSize - 6, -1, -qSize - 11);
        ctx.stroke();
        ctx.restore();

        // Fuel log pile
        ctx.save();
        ctx.translate(this.x - 50, this.y + 20);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-9, -1, 18, 5);
        const logs = [
            { x: -8, y: 1, len: 14 },
            { x: 6, y: 1.5, len: 13 },
            { x: -1, y: -3.5, len: 15 }
        ];
        logs.forEach(log => {
            ctx.save();
            ctx.translate(log.x, log.y);
            ctx.fillStyle = '#6E4223';
            ctx.strokeStyle = '#432912';
            ctx.lineWidth = 1;
            ctx.fillRect(-log.len/2, -2.4, log.len, 4.8);
            ctx.strokeRect(-log.len/2, -2.4, log.len, 4.8);
            ctx.fillStyle = '#C9A06A';
            ctx.beginPath();
            ctx.ellipse(-log.len/2, 0, 2.4, 2.4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#432912';
            ctx.stroke();
            ctx.strokeStyle = 'rgba(67, 41, 18, 0.6)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.arc(-log.len/2, 0, 1.2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        });
        ctx.restore();

        // Wall-mounted tool rack - hanging hammer, saw and tongs
        ctx.save();
        ctx.translate(this.x + 32, this.y - 32);
        ctx.fillStyle = '#5A3A20';
        ctx.strokeStyle = '#3A2410';
        ctx.lineWidth = 1;
        ctx.fillRect(-14, -1.5, 28, 3);
        ctx.strokeRect(-14, -1.5, 28, 3);
        ctx.fillStyle = '#2F2F2F';
        [-9, 0, 9].forEach(px => {
            ctx.beginPath();
            ctx.arc(px, 1.5, 1, 0, Math.PI * 2);
            ctx.fill();
        });
        // Hanging hammer
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-9, 1.5);
        ctx.lineTo(-9, 9);
        ctx.stroke();
        ctx.fillStyle = '#2F2F2F';
        ctx.fillRect(-12, 9, 6, 2.5);
        // Hanging saw
        ctx.strokeStyle = '#B0B0B0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 1.5);
        ctx.lineTo(3, 10);
        ctx.lineTo(-3, 10);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = 'rgba(192, 192, 192, 0.4)';
        ctx.fill();
        // Hanging tongs
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(9, 1.5);
        ctx.lineTo(7, 10);
        ctx.moveTo(9, 1.5);
        ctx.lineTo(11, 10);
        ctx.stroke();
        ctx.restore();

        // Grindstone - sharpening wheel on a wooden A-frame with a water trough
        ctx.save();
        ctx.translate(this.x + 46, this.y + 40);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(1, 2, 9, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5A3A20';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-6, 2); ctx.lineTo(-2, -10);
        ctx.moveTo(6, 2); ctx.lineTo(2, -10);
        ctx.moveTo(-2, -10); ctx.lineTo(2, -10);
        ctx.stroke();
        const wheelGradient = ctx.createRadialGradient(-1, -11, 1, 0, -10, 7);
        wheelGradient.addColorStop(0, '#B8AFA0');
        wheelGradient.addColorStop(1, '#8A8072');
        ctx.fillStyle = wheelGradient;
        ctx.beginPath();
        ctx.arc(0, -10, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5A5147';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#2F2F2F';
        ctx.beginPath();
        ctx.arc(0, -10, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(6, -7);
        ctx.stroke();
        ctx.fillStyle = '#1C1C1C';
        ctx.beginPath();
        ctx.arc(6, -7, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4A6B8A';
        ctx.fillRect(-4, -3, 8, 2.5);
        ctx.strokeStyle = '#2F4256';
        ctx.lineWidth = 1;
        ctx.strokeRect(-4, -3, 8, 2.5);
        ctx.restore();
    }

    /** Paved courtyard in front of the forge door/anvil - fixed flagstone layout, deterministic shading (matches the wall's stone-hash technique) so nothing flickers frame to frame. */
    renderWorkFloor(ctx, size) {
        const scale = size / 128;
        const flagstones = [
            { x: -38, y: 18, w: 16, h: 11, rot: -0.05 },
            { x: -21, y: 14, w: 15, h: 10, rot: 0.04 },
            { x: -5,  y: 16, w: 17, h: 11, rot: -0.03 },
            { x: 13,  y: 13, w: 15, h: 10, rot: 0.05 },
            { x: 29,  y: 17, w: 16, h: 11, rot: -0.04 },
            { x: -43, y: 30, w: 15, h: 11, rot: 0.03 },
            { x: -26, y: 28, w: 16, h: 11, rot: -0.02 },
            { x: -8,  y: 30, w: 17, h: 12, rot: 0.02 },
            { x: 11,  y: 29, w: 16, h: 11, rot: -0.05 },
            { x: 28,  y: 32, w: 15, h: 11, rot: 0.04 },
            { x: -18, y: 42, w: 16, h: 11, rot: -0.03 },
            { x: 1,   y: 44, w: 17, h: 11, rot: 0.03 },
            { x: 19,  y: 43, w: 15, h: 10, rot: -0.04 }
        ];

        flagstones.forEach((f, i) => {
            ctx.save();
            ctx.translate(this.x + f.x * scale, this.y + f.y * scale);
            ctx.rotate(f.rot);
            const w = f.w * scale, h = f.h * scale;

            // Mortar/gap shadow, slightly larger than the stone, sold the "paved" seams
            ctx.fillStyle = 'rgba(30, 26, 22, 0.4)';
            ctx.fillRect(-w/2 - 1, -h/2 - 1, w + 2, h + 2);

            const hashVal = ((i * 17 + 5) % 11) / 11;
            const shade = 0.72 + hashVal * 0.28;
            ctx.fillStyle = `rgb(${Math.floor(142 * shade)}, ${Math.floor(136 * shade)}, ${Math.floor(126 * shade)})`;
            ctx.strokeStyle = 'rgba(40, 34, 28, 0.7)';
            ctx.lineWidth = 1;
            ctx.fillRect(-w/2, -h/2, w, h);
            ctx.strokeRect(-w/2, -h/2, w, h);

            // Worn highlight, top-left
            ctx.fillStyle = `rgba(255, 255, 245, ${0.12 * shade})`;
            ctx.fillRect(-w/2, -h/2, w * 0.45, h * 0.35);

            // Scuff/crack detail
            ctx.strokeStyle = 'rgba(40, 34, 28, 0.35)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(-w * 0.2, -h * 0.3);
            ctx.lineTo(w * 0.1, h * 0.25);
            ctx.stroke();

            ctx.restore();
        });
    }

    renderNaturalGroundDetails(ctx, size) {
        // Natural dirt patches in front of the forge
        const dirtPatches = [
            { x: -20, y: 35, radius: 12, intensity: 0.6 },
            { x: 10, y: 40, radius: 15, intensity: 0.7 },
            { x: -5, y: 30, radius: 10, intensity: 0.5 },
            { x: 25, y: 35, radius: 8, intensity: 0.8 },
            { x: -30, y: 25, radius: 7, intensity: 0.4 },
            { x: 15, y: 25, radius: 6, intensity: 0.6 }
        ];
        
        dirtPatches.forEach(patch => {
            const dirtGradient = ctx.createRadialGradient(
                this.x + patch.x, this.y + patch.y, 0,
                this.x + patch.x, this.y + patch.y, patch.radius
            );
            dirtGradient.addColorStop(0, `rgba(139, 69, 19, ${patch.intensity})`);
            dirtGradient.addColorStop(0.6, `rgba(160, 82, 45, ${patch.intensity * 0.7})`);
            dirtGradient.addColorStop(1, `rgba(139, 69, 19, 0)`);

            ctx.fillStyle = dirtGradient;
            ctx.beginPath();
            ctx.arc(this.x + patch.x, this.y + patch.y, patch.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        // Paved work floor - a trampled flagstone courtyard right in front of the door
        // and anvil, so the busy part of the yard reads as a worksite rather than lawn.
        this.renderWorkFloor(ctx, size);

        // Scattered small rocks
        const scatteredRocks = [
            { x: -30, y: 35, size: 2 },
            { x: -10, y: 38, size: 1.5 },
            { x: 8, y: 33, size: 2.5 },
            { x: 22, y: 42, size: 1.8 },
            { x: 30, y: 30, size: 1.2 },
            { x: -18, y: 25, size: 1.6 }
        ];
        
        scatteredRocks.forEach(rock => {
            ctx.fillStyle = '#696969';
            ctx.strokeStyle = '#2F2F2F';
            ctx.lineWidth = 0.5;
            
            ctx.beginPath();
            ctx.arc(this.x + rock.x, this.y + rock.y, rock.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
        
        // Small grass clumps - pre-computed positions to prevent flickering. A faint moss
        // tint grounds each clump into the dirt (instead of the old bright, oversized radial
        // "grass patch" glow) before the individual blade strokes are drawn on top.
        this.grassBlades.forEach(clump => {
            const tintX = this.x + clump.cx;
            const tintY = this.y + clump.cy;
            const tintGradient = ctx.createRadialGradient(tintX, tintY, 0, tintX, tintY, 6);
            tintGradient.addColorStop(0, 'rgba(60, 100, 40, 0.22)');
            tintGradient.addColorStop(1, 'rgba(60, 100, 40, 0)');
            ctx.fillStyle = tintGradient;
            ctx.beginPath();
            ctx.arc(tintX, tintY, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#2E7D32';
            ctx.lineWidth = 1;
            clump.blades.forEach(blade => {
                const bladeX = this.x + clump.cx + blade.dx;
                const bladeY = this.y + clump.cy + blade.dy;
                ctx.beginPath();
                ctx.moveTo(bladeX, bladeY);
                ctx.lineTo(bladeX + blade.tipDx, bladeY - blade.height);
                ctx.stroke();
            });
        });
        
        // Worn footpaths in the dirt
        ctx.strokeStyle = 'rgba(101, 67, 33, 0.3)';
        ctx.lineWidth = 3;
        
        // Path from forge to coal pile
        ctx.beginPath();
        ctx.moveTo(this.x - 20, this.y + 15);
        ctx.quadraticCurveTo(this.x - 30, this.y + 12, this.x - 35, this.y + 10);
        ctx.stroke();
        
        // Path from forge to barrel area
        ctx.beginPath();
        ctx.moveTo(this.x - 15, this.y + 15);
        ctx.quadraticCurveTo(this.x - 18, this.y + 22, this.x - 22, this.y + 28);
        ctx.stroke();
    }
    
    renderWorkers(ctx, size) {
        const posScale = size / 128;
        const bodyScale = 1.45; // enlarges the worker figures (fixed-pixel body units) for visible detail
        this.workers.forEach(worker => {
            ctx.save();
            ctx.translate(this.x + worker.x * posScale, this.y + worker.y * posScale);
            ctx.scale(bodyScale, bodyScale);

            // Worker shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.beginPath();
            ctx.ellipse(0.5, 0.5, 4, 1.4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Boots
            ctx.fillStyle = '#3B2A1A';
            ctx.fillRect(-3.5, -3, 3, 3);
            ctx.fillRect(0.5, -3, 3, 3);

            // Legs (trousers)
            ctx.fillStyle = worker.type === 'blacksmith' ? '#4A4A4A' : '#3A5A8A';
            ctx.fillRect(-3, -9, 2.6, 6.5);
            ctx.fillRect(0.4, -9, 2.6, 6.5);

            // Belt
            ctx.fillStyle = '#2A1A0E';
            ctx.fillRect(-3.2, -9.5, 6.4, 1.4);

            if (worker.type === 'blacksmith') {
                // Shirt beneath the apron
                ctx.fillStyle = '#8A7052';
                ctx.fillRect(-3.2, -17, 6.4, 8);

                // Leather apron
                ctx.fillStyle = '#654321';
                ctx.beginPath();
                ctx.moveTo(-3.6, -16.5);
                ctx.lineTo(3.6, -16.5);
                ctx.lineTo(3, -9);
                ctx.lineTo(-3, -9);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#3E2A14';
                ctx.lineWidth = 0.4;
                ctx.stroke();

                // Apron pocket
                ctx.fillStyle = '#4A2E15';
                ctx.fillRect(-2, -12, 4, 2.4);

                // Apron straps over the shoulders
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-2.4, -17);
                ctx.lineTo(0, -20.5);
                ctx.lineTo(2.4, -17);
                ctx.stroke();
            } else {
                // Helper - blue work shirt with a rolled-sleeve trim
                ctx.fillStyle = '#4169E1';
                ctx.fillRect(-3, -17, 6, 8.5);
                ctx.fillStyle = '#2E4E9E';
                ctx.fillRect(-3, -17, 6, 1.5);
            }

            // Head
            ctx.fillStyle = '#DDBEA9';
            ctx.beginPath();
            ctx.arc(0, -19.5, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.beginPath();
            ctx.arc(0.9, -19.3, 0.4, 0, Math.PI * 2);
            ctx.fill();

            // Hair/hat
            if (worker.type === 'blacksmith') {
                // Leather cap
                ctx.fillStyle = '#8B4513';
                ctx.beginPath();
                ctx.arc(0, -19.5, 3.4, Math.PI, Math.PI * 2);
                ctx.fill();
            } else {
                // Simple hair
                ctx.fillStyle = '#654321';
                ctx.beginPath();
                ctx.arc(0, -20.2, 2.4, Math.PI, Math.PI * 2);
                ctx.fill();
            }

            // Arms with tools - smoothstep-eased interpolation instead of a binary snap, so
            // the arm swings continuously between raised and resting instead of holding the
            // fully-raised pose for the whole decay window then popping to resting in one frame.
            // Rest angle points the arm down toward the hip (not out to the side at a shallow
            // 30° reach) so the idle pose reads as a clearly relaxed, lowered arm instead of
            // looking perpetually half-raised.
            const REST_ARM_ANGLE = Math.PI * 0.58;
            const RAISED_ARM_ANGLE = -Math.PI / 2;
            const liftT = worker.hammerRaised;
            const liftEased = liftT * liftT * (3 - 2 * liftT);
            const armAngle = REST_ARM_ANGLE + (RAISED_ARM_ANGLE - REST_ARM_ANGLE) * liftEased;

            ctx.strokeStyle = '#DDBEA9';
            ctx.lineWidth = 2.4;
            ctx.lineCap = 'round';

            // Working arm
            ctx.beginPath();
            ctx.moveTo(0, -16.5);
            ctx.lineTo(Math.cos(armAngle) * 7.5, -16.5 + Math.sin(armAngle) * 7.5);
            ctx.stroke();

            // Other arm - braced, steadying stance
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.lineTo(-4, -11);
            ctx.stroke();
            ctx.lineCap = 'butt';

            // Tool in hand - held continuously (not just above a hammerRaised threshold) so it
            // tracks the now-smoothly-interpolated arm instead of popping in/out each cycle.
            {
                const toolX = Math.cos(armAngle) * 9.5;
                const toolY = -16.5 + Math.sin(armAngle) * 9.5;

                if (worker.type === 'blacksmith') {
                    // Hammer, oriented along the swing direction
                    ctx.save();
                    ctx.translate(toolX, toolY);
                    ctx.rotate(armAngle + Math.PI / 2);
                    ctx.fillStyle = '#2F2F2F';
                    ctx.fillRect(-2.6, -1.2, 5.2, 2.4);
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(-1, 1.2, 2, 6.5);
                    ctx.restore();
                } else {
                    // Tongs
                    ctx.strokeStyle = '#2F2F2F';
                    ctx.lineWidth = 1.6;
                    ctx.beginPath();
                    ctx.moveTo(toolX - 1.2, toolY);
                    ctx.lineTo(toolX - 2.4, toolY + 4.5);
                    ctx.moveTo(toolX + 1.2, toolY);
                    ctx.lineTo(toolX + 2.4, toolY + 4.5);
                    ctx.stroke();
                }
            }

            ctx.restore();
        });
    }
    
    renderCobblestoneWalls(ctx, buildingWidth, buildingHeight, wallHeight) {
        // Base wall color
        const wallGradient = ctx.createLinearGradient(
            this.x - buildingWidth/2, this.y - wallHeight,
            this.x + buildingWidth/4, this.y
        );
        wallGradient.addColorStop(0, '#A9A9A9');
        wallGradient.addColorStop(0.5, '#808080');
        wallGradient.addColorStop(1, '#696969');

        // Main wall structure - straight walls on both sides
        ctx.fillStyle = wallGradient;
        ctx.fillRect(this.x - buildingWidth/2, this.y - wallHeight, buildingWidth, wallHeight);

        // Individual cobblestones
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;

        const stoneWidth = buildingWidth / 8;
        const stoneHeight = wallHeight / 6;

        // Forge opening bounding box, in the exact same coordinate space renderForgeOpening()
        // uses (including its own +5 arch-surround padding) - stones are skipped by true pixel
        // overlap against this box rather than a fixed row/col window, so the staggered brick
        // offset (below) can never leave a sliver that's neither stone nor opening frame.
        const size = buildingWidth / 0.9;
        const openingWidth = size * 0.25;
        const openingHeight = size * 0.2;
        const openingX = this.x - openingWidth / 2 - 15;
        const openingY = this.y - openingHeight / 2 - 5;
        const archRadius = openingWidth / 2;
        const openingBoundLeft = openingX - 5;
        const openingBoundRight = openingX + openingWidth + 5;
        const openingBoundTop = openingY - archRadius - 8;
        const openingBoundBottom = openingY + openingHeight;

        // Draw cobblestone pattern for main wall
        for (let row = 0; row < 6; row++) {
            const offsetX = (row % 2) * stoneWidth/2; // Staggered pattern
            const rowY = this.y - wallHeight + (row * stoneHeight);

            for (let col = 0; col < 8; col++) { // Only 8 columns for main wall
                const stoneX = this.x - buildingWidth/2 + offsetX + (col * stoneWidth);

                // Skip stones that actually overlap the forge opening + arch surround
                if (stoneX + stoneWidth - 1 > openingBoundLeft && stoneX < openingBoundRight &&
                    rowY + stoneHeight - 1 > openingBoundTop && rowY < openingBoundBottom) {
                    continue;
                }

                // Individual stone color variation - deterministic hash for consistent look
                const hashVal = ((row * 11 + col * 7) % 13) / 13;
                const stoneShade = 0.78 + hashVal * 0.2;
                ctx.fillStyle = `rgb(${Math.floor(169 * stoneShade)}, ${Math.floor(169 * stoneShade)}, ${Math.floor(169 * stoneShade)})`;

                // Draw stone
                ctx.fillRect(stoneX, rowY, stoneWidth - 1, stoneHeight - 1);
                ctx.strokeRect(stoneX, rowY, stoneWidth - 1, stoneHeight - 1);

                // Stone highlight for 3D bevel (raised top-left edge)
                ctx.fillStyle = `rgba(220, 220, 220, ${0.35 * stoneShade})`;
                ctx.fillRect(stoneX, rowY, stoneWidth - 1, stoneHeight/4);
                ctx.fillRect(stoneX, rowY, stoneWidth/4, stoneHeight - 1);

                // Stone shadow for 3D bevel (recessed bottom-right edge)
                ctx.fillStyle = `rgba(0, 0, 0, ${0.28 * stoneShade})`;
                ctx.fillRect(stoneX, rowY + stoneHeight - 1 - stoneHeight/4, stoneWidth - 1, stoneHeight/4);
                ctx.fillRect(stoneX + stoneWidth - 1 - stoneWidth/4, rowY, stoneWidth/4, stoneHeight - 1);
            }
        }

        // Foundation plinth - darker stone footer that grounds the building
        const plinthHeight = wallHeight * 0.1;
        const plinthGradient = ctx.createLinearGradient(0, this.y - plinthHeight, 0, this.y);
        plinthGradient.addColorStop(0, '#4A4A4A');
        plinthGradient.addColorStop(1, '#2F2F2F');
        ctx.fillStyle = plinthGradient;
        ctx.fillRect(this.x - buildingWidth/2 - 3, this.y - plinthHeight, buildingWidth + 6, plinthHeight);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(this.x - buildingWidth/2 - 3, this.y - plinthHeight, buildingWidth + 6, 2);

        // Corner pilaster - reinforced stone column bookending the left edge
        const pilasterWidth = stoneWidth * 0.55;
        ctx.fillStyle = '#8C8C8C';
        ctx.fillRect(this.x - buildingWidth/2 - 2, this.y - wallHeight, pilasterWidth, wallHeight - plinthHeight);
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        for (let row = 0; row < 6; row++) {
            const rowY = this.y - wallHeight + row * stoneHeight;
            ctx.strokeRect(this.x - buildingWidth/2 - 2, rowY, pilasterWidth, stoneHeight - 1);
            ctx.fillStyle = 'rgba(230, 230, 230, 0.3)';
            ctx.fillRect(this.x - buildingWidth/2 - 2, rowY, pilasterWidth/3, stoneHeight/3);
            ctx.fillStyle = '#8C8C8C';
        }

        // Wall top edge
        ctx.fillStyle = '#DCDCDC';
        ctx.fillRect(this.x - buildingWidth/2, this.y - wallHeight, buildingWidth, 3);

        // Right edge of the main wall is entirely overlapped by the chimney foundation
        // (rendered next, starting at this exact x with a greater width) - a thin cap here
        // just prevents a 1px gap from showing before the chimney draws over it.
        ctx.fillStyle = '#3E3E3E';
        ctx.fillRect(this.x + buildingWidth/2, this.y - wallHeight, 3, wallHeight);
    }
    
    renderChimney(ctx, size) {
        const buildingWidth = size * 0.9;
        const wallHeight = size * 0.5;
        
        // INTEGRATED CHIMNEY - starts from the right corner of the main building
        const chimneyWidth = size * 0.16;
        const chimneyHeight = size * 0.7;
        const chimneyX = this.x + buildingWidth/2; // Starts exactly at right wall edge
        const chimneyY = this.y; // Ground level
        
        // Chimney foundation - extends from main building foundation
        const foundationGradient = ctx.createLinearGradient(
            chimneyX, chimneyY - wallHeight,
            chimneyX + chimneyWidth, chimneyY
        );
        foundationGradient.addColorStop(0, '#A9A9A9'); // Matches main wall
        foundationGradient.addColorStop(0.5, '#808080');
        foundationGradient.addColorStop(1, '#696969');
        
        ctx.fillStyle = foundationGradient;
        ctx.fillRect(chimneyX, chimneyY - wallHeight, chimneyWidth, wallHeight);
        
        // Foundation stones that match main building exactly
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        
        const foundationStoneHeight = wallHeight / 6;
        for (let row = 0; row < 6; row++) {
            const offsetX = (row % 2) * 2; // Slight stagger to match main wall
            const rowY = chimneyY - wallHeight + (row * foundationStoneHeight);
            
            const stoneShade = 0.8 + Math.sin(row * 0.5) * 0.2;
            ctx.fillStyle = `rgb(${Math.floor(169 * stoneShade)}, ${Math.floor(169 * stoneShade)}, ${Math.floor(169 * stoneShade)})`;
            
            ctx.fillRect(chimneyX + offsetX, rowY, chimneyWidth - offsetX, foundationStoneHeight - 1);
            ctx.strokeRect(chimneyX + offsetX, rowY, chimneyWidth - offsetX, foundationStoneHeight - 1);
            
            // Stone highlight
            ctx.fillStyle = `rgba(200, 200, 200, ${0.3 * stoneShade})`;
            ctx.fillRect(chimneyX + offsetX, rowY, (chimneyWidth - offsetX)/3, foundationStoneHeight/3);
        }
        
        // Foundation top edge to match main building
        ctx.fillStyle = '#DCDCDC';
        ctx.fillRect(chimneyX, chimneyY - wallHeight, chimneyWidth, 3);
        
        // Chimney shaft - rises above building
        const shaftHeight = chimneyHeight - wallHeight;
        const shaftY = chimneyY - wallHeight;
        
        // Chimney shaft gradient
        const chimneyGradient = ctx.createLinearGradient(
            chimneyX, shaftY - shaftHeight,
            chimneyX + chimneyWidth, shaftY
        );
        chimneyGradient.addColorStop(0, '#696969');
        chimneyGradient.addColorStop(0.3, '#2F2F2F');
        chimneyGradient.addColorStop(0.7, '#1C1C1C');
        chimneyGradient.addColorStop(1, '#808080');
        
        ctx.fillStyle = chimneyGradient;
        ctx.fillRect(chimneyX, shaftY - shaftHeight, chimneyWidth, shaftHeight);
        
        // Chimney shaft stones
        const shaftStoneHeight = shaftHeight / 10;
        for (let i = 0; i < 10; i++) {
            const stoneY = shaftY - shaftHeight + (i * shaftStoneHeight);
            const offsetX = (i % 2) * 2;
            
            ctx.strokeRect(chimneyX + offsetX, stoneY, chimneyWidth - offsetX, shaftStoneHeight);
            
            // Horizontal mortar lines
            ctx.strokeStyle = '#1C1C1C';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(chimneyX, stoneY + shaftStoneHeight);
            ctx.lineTo(chimneyX + chimneyWidth, stoneY + shaftStoneHeight);
            ctx.stroke();
            
            ctx.strokeStyle = '#2F2F2F';
        }
        
        // Chimney cap
        const capHeight = 6;
        const capWidth = chimneyWidth + 4;
        const capX = chimneyX - 2;
        const capY = shaftY - shaftHeight;
        
        ctx.fillStyle = '#2F2F2F';
        ctx.fillRect(capX, capY - capHeight, capWidth, capHeight);
        
        // Cap detail
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(capX, capY - capHeight, capWidth, capHeight);
        
        // Cap crown molding
        ctx.fillStyle = '#808080';
        ctx.fillRect(capX + 1, capY - capHeight + 1, capWidth - 2, 1);
        ctx.fillRect(capX + 1, capY - 2, capWidth - 2, 1);
        
        // Chimney opening
        const openingWidth = chimneyWidth * 0.7;
        const openingHeight = 4;
        ctx.fillStyle = '#000000';
        ctx.fillRect(
            chimneyX + (chimneyWidth - openingWidth)/2, 
            capY - capHeight, 
            openingWidth, 
            openingHeight
        );
        
        // Chimney side face (3D effect)
        ctx.fillStyle = '#5D5D5D';
        ctx.beginPath();
        ctx.moveTo(chimneyX + chimneyWidth, chimneyY - wallHeight);
        ctx.lineTo(chimneyX + chimneyWidth + 3, chimneyY - wallHeight - 3);
        ctx.lineTo(chimneyX + chimneyWidth + 3, chimneyY - 3);
        ctx.lineTo(chimneyX + chimneyWidth, chimneyY);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    renderRoof(ctx, buildingWidth, buildingHeight, wallHeight) {
        const size = buildingWidth / 0.9; // Reverse calculate size

        // Calculate roof points with chimney integration
        const chimneyWidth = size * 0.16;
        const roofPeakX = this.x;
        const roofPeakY = this.y - wallHeight - buildingHeight * 0.2;
        const leftRoofX = this.x - buildingWidth/2 - 5;
        const rightRoofX = this.x + buildingWidth/2; // Ends at main building edge
        const baseY = this.y - wallHeight;

        // Stone cornice - the ledge the roof rests on, in the same gray as the wall below it,
        // so the roof reads as sitting ON the building rather than a separate piece dropped on
        // top. Dentil ticks echo the wall's own stone-column rhythm for a tighter tie-in.
        const corniceWidth = (rightRoofX - leftRoofX) + 4;
        const corniceGradient = ctx.createLinearGradient(0, baseY - 1, 0, baseY + 4);
        corniceGradient.addColorStop(0, '#E8E8E8');
        corniceGradient.addColorStop(1, '#7C7C7C');
        ctx.fillStyle = corniceGradient;
        ctx.fillRect(leftRoofX - 2, baseY - 1, corniceWidth, 4);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(leftRoofX - 2, baseY - 1, corniceWidth, 4);

        const stoneWidth = buildingWidth / 8;
        ctx.strokeStyle = 'rgba(60, 60, 60, 0.5)';
        ctx.lineWidth = 0.75;
        for (let tickX = leftRoofX - 2 + stoneWidth; tickX < rightRoofX + 2; tickX += stoneWidth) {
            ctx.beginPath();
            ctx.moveTo(tickX, baseY - 1);
            ctx.lineTo(tickX, baseY + 3);
            ctx.stroke();
        }

        // Roof silhouette - a single simple gable so the tiles below read as one connected
        // roof instead of two differently-shaded halves competing for attention.
        ctx.beginPath();
        ctx.moveTo(leftRoofX, baseY);
        ctx.lineTo(roofPeakX, roofPeakY);
        ctx.lineTo(rightRoofX, baseY);
        ctx.closePath();
        ctx.fillStyle = '#B8602E';
        ctx.fill();
        ctx.strokeStyle = '#5C2A12';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Orange clay tile texture - rounded barrel tiles running eave to ridge. Each tile is
        // shaded shadow-highlight-shadow across its own width to read as a convex clay
        // cylinder rather than a flat painted stripe, which is what was making the roof look
        // pasted-on rather than built from real tile.
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(leftRoofX, baseY);
        ctx.lineTo(roofPeakX, roofPeakY);
        ctx.lineTo(rightRoofX, baseY);
        ctx.closePath();
        ctx.clip();

        const tileCount = 9;
        const roofWidth = rightRoofX - leftRoofX;
        const tileWidth = roofWidth / tileCount;
        const roofTop = roofPeakY - 4;
        const tileEdgeShade = '#9C4E26';
        const tilePeakShades = ['#E0894C', '#D97D40', '#DD8446'];

        for (let i = 0; i < tileCount; i++) {
            const tileX = leftRoofX + i * tileWidth;
            const cx = tileX + tileWidth / 2;

            const bodyGradient = ctx.createLinearGradient(tileX, 0, tileX + tileWidth, 0);
            bodyGradient.addColorStop(0, tileEdgeShade);
            bodyGradient.addColorStop(0.5, tilePeakShades[i % tilePeakShades.length]);
            bodyGradient.addColorStop(1, tileEdgeShade);
            ctx.fillStyle = bodyGradient;
            ctx.fillRect(tileX, roofTop, tileWidth, baseY - roofTop);

            // Groove between tiles
            ctx.strokeStyle = 'rgba(80, 40, 18, 0.4)';
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(tileX, roofTop);
            ctx.lineTo(tileX, baseY);
            ctx.stroke();

            // Barrel-tile roll end poking out over the eave - radial highlight top-left to
            // sell the cylindrical cross-section
            const rollRadius = tileWidth * 0.44;
            const rollGradient = ctx.createRadialGradient(cx - rollRadius * 0.3, baseY - rollRadius * 0.3, rollRadius * 0.2, cx, baseY, rollRadius);
            rollGradient.addColorStop(0, '#E89760');
            rollGradient.addColorStop(1, '#9C4E26');
            ctx.fillStyle = rollGradient;
            ctx.beginPath();
            ctx.arc(cx, baseY, rollRadius, 0, Math.PI);
            ctx.fill();
            ctx.strokeStyle = 'rgba(60, 30, 15, 0.45)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }

        // Gentle overall light wash from ridge to eave - a soft depth cue on top of the
        // per-tile shading, without the old two-slope-color split that read as disjointed.
        const washGradient = ctx.createLinearGradient(0, roofPeakY, 0, baseY);
        washGradient.addColorStop(0, 'rgba(255, 235, 210, 0.16)');
        washGradient.addColorStop(0.4, 'rgba(255, 235, 210, 0)');
        ctx.fillStyle = washGradient;
        ctx.fillRect(leftRoofX, roofTop, roofWidth, baseY - roofTop);

        ctx.restore();

        // Ridge cap - a short capped ridge tile bridging the two slopes at the apex, matching
        // the tile material instead of standing out as a separate wood beam
        const ridgeGradient = ctx.createLinearGradient(roofPeakX - 8, 0, roofPeakX + 8, 0);
        ridgeGradient.addColorStop(0, '#7A3A1C');
        ridgeGradient.addColorStop(0.5, '#A85D30');
        ridgeGradient.addColorStop(1, '#7A3A1C');
        ctx.fillStyle = ridgeGradient;
        ctx.beginPath();
        ctx.arc(roofPeakX, roofPeakY + 3, 6, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#4A2410';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Small end caps so the ridge reads as a capped tile resting across the seam, not a dome
        ctx.fillStyle = '#8F4420';
        ctx.beginPath();
        ctx.arc(roofPeakX - 6, roofPeakY + 4, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(roofPeakX + 6, roofPeakY + 4, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Roof flashing where it meets chimney
        ctx.fillStyle = '#2F2F2F';
        ctx.fillRect(rightRoofX - 2, baseY - 3, chimneyWidth + 4, 6);

        ctx.strokeStyle = '#1C1C1C';
        ctx.lineWidth = 1;
        ctx.strokeRect(rightRoofX - 2, baseY - 3, chimneyWidth + 4, 6);
    }

    renderForgeOpening(ctx, size) {
        // Forge opening in the wall
        const openingWidth = size * 0.25;
        const openingHeight = size * 0.2;
        const openingX = this.x - openingWidth / 2 - 15;
        const openingY = this.y - openingHeight / 2 - 5;
        const archCX = openingX + openingWidth / 2;
        const archRadius = openingWidth / 2;

        // Stone arch surround (keystone)
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.arc(archCX, openingY, archRadius + 5, Math.PI, 0);
        ctx.fill();

        // Solid stone jambs down both sides of the rectangular part of the opening - fills
        // the same +5 padding the arch above uses, so the frame reads as one continuous ring
        // of stone around the opening instead of thin lines with wall/background showing
        // through the gap between the door and the (wider) skipped brick area.
        ctx.fillStyle = '#888888';
        ctx.fillRect(openingX - 5, openingY, 5, openingHeight);
        ctx.fillRect(openingX + openingWidth, openingY, 5, openingHeight);
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 1;
        ctx.strokeRect(openingX - 5, openingY, 5, openingHeight);
        ctx.strokeRect(openingX + openingWidth, openingY, 5, openingHeight);
        // A couple of mortar lines on each jamb so it reads as stacked stone, not a flat slab
        ctx.beginPath();
        ctx.moveTo(openingX - 5, openingY + openingHeight * 0.33);
        ctx.lineTo(openingX, openingY + openingHeight * 0.33);
        ctx.moveTo(openingX - 5, openingY + openingHeight * 0.66);
        ctx.lineTo(openingX, openingY + openingHeight * 0.66);
        ctx.moveTo(openingX + openingWidth, openingY + openingHeight * 0.33);
        ctx.lineTo(openingX + openingWidth + 5, openingY + openingHeight * 0.33);
        ctx.moveTo(openingX + openingWidth, openingY + openingHeight * 0.66);
        ctx.lineTo(openingX + openingWidth + 5, openingY + openingHeight * 0.66);
        ctx.stroke();

        // Opening shadow/depth
        ctx.fillStyle = '#050505';
        ctx.fillRect(openingX, openingY, openingWidth, openingHeight);
        // Arch void over rectangle
        ctx.beginPath();
        ctx.arc(archCX, openingY, archRadius, Math.PI, 0);
        ctx.fill();

        // Stone frame border
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 2;
        ctx.strokeRect(openingX, openingY, openingWidth, openingHeight);

        // Arch outline
        ctx.beginPath();
        ctx.arc(archCX, openingY, archRadius + 5, Math.PI, 0);
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Keystone at top of arch
        ctx.fillStyle = '#999999';
        ctx.beginPath();
        ctx.moveTo(archCX - 4, openingY - archRadius - 1);
        ctx.lineTo(archCX + 4, openingY - archRadius - 1);
        ctx.lineTo(archCX + 3, openingY - archRadius + 5);
        ctx.lineTo(archCX - 3, openingY - archRadius + 5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    /** Strategy B piece: fire glow from the forge opening - fireIntensity-driven, not bakeable. Recomputes the same opening geometry as renderForgeOpening() above. */
    renderForgeOpeningGlow(ctx, size) {
        const openingWidth = size * 0.25;
        const openingHeight = size * 0.2;
        const openingX = this.x - openingWidth / 2 - 15;
        const openingY = this.y - openingHeight / 2 - 5;

        const fireGlow = ctx.createRadialGradient(
            openingX + openingWidth/2, openingY + openingHeight/2, 0,
            openingX + openingWidth/2, openingY + openingHeight/2, openingWidth
        );
        fireGlow.addColorStop(0, `rgba(255, 100, 0, ${this.fireIntensity * 0.8})`);
        fireGlow.addColorStop(0.6, `rgba(255, 50, 0, ${this.fireIntensity * 0.4})`);
        fireGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');

        ctx.fillStyle = fireGlow;
        ctx.fillRect(openingX - openingWidth/2, openingY - openingHeight/2, openingWidth * 2, openingHeight * 2);
    }

    /** Strategy B piece: chimney interior fire glow - fireIntensity-driven, not bakeable. Recomputes the same chimney geometry as renderChimney() above. */
    renderChimneyGlow(ctx, size) {
        const buildingWidth = size * 0.9;
        const wallHeight = size * 0.5;
        const chimneyWidth = size * 0.16;
        const chimneyHeight = size * 0.7;
        const chimneyX = this.x + buildingWidth/2;
        const chimneyY = this.y;
        const shaftHeight = chimneyHeight - wallHeight;
        const shaftY = chimneyY - wallHeight;
        const capHeight = 6;
        const capY = shaftY - shaftHeight;
        const openingWidth = chimneyWidth * 0.7;
        const openingHeight = 4;

        const glowIntensity = this.fireIntensity * 0.3;
        ctx.fillStyle = `rgba(255, 100, 0, ${glowIntensity})`;
        ctx.fillRect(
            chimneyX + (chimneyWidth - openingWidth)/2 + 1,
            capY - capHeight + 1,
            openingWidth - 2,
            openingHeight - 1
        );
    }

    renderForgeInterior(ctx, size) {
        // Coal pile visible in opening
        const openingX = this.x - 15;
        const openingY = this.y + 5;
        
        // Coal pieces - fixed positions
        ctx.fillStyle = '#1C1C1C';
        const coalPositions = [
            { x: -8, y: -3, size: 2 },
            { x: -2, y: -3, size: 2 },
            { x: 4, y: -3, size: 2 },
            { x: -5, y: 1, size: 2 },
            { x: 1, y: 1, size: 2 },
            { x: 7, y: 1, size: 2 }
        ];
        
        coalPositions.forEach(coal => {
            ctx.beginPath();
            ctx.arc(openingX + coal.x, openingY + coal.y, coal.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Anvil inside (partially visible)
        ctx.fillStyle = '#2F2F2F';
        ctx.fillRect(openingX + 10, openingY - 2, 8, 4);

        // Hammer on anvil
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(openingX + 12, openingY - 6, 2, 6);
        ctx.fillStyle = '#2F2F2F';
        ctx.fillRect(openingX + 12, openingY - 6, 2, 3);
    }

    /** Strategy B piece: the fire above the coal pile - fireIntensity-driven, not bakeable. Recomputes the same opening position as renderForgeInterior() above. */
    renderForgeFire(ctx, size) {
        const openingX = this.x - 15;
        const openingY = this.y + 5;

        const fireColors = [
            `rgba(255, 0, 0, ${this.fireIntensity * 0.7})`,
            `rgba(255, 100, 0, ${this.fireIntensity * 0.8})`,
            `rgba(255, 200, 0, ${this.fireIntensity * 0.6})`
        ];

        fireColors.forEach((color, index) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.ellipse(
                openingX - 3 + index * 2,
                openingY - 8 - index * 2,
                4 - index,
                8 - index * 2,
                0, 0, Math.PI * 2
            );
            ctx.fill();
        });
    }

    renderParticles(ctx) {
        // Render sparks
        this.sparks.forEach(spark => {
            const alpha = (spark.life / spark.maxLife) * (spark.size / 3);
            
            switch(spark.color) {
                case 'orange':
                    ctx.fillStyle = `rgba(255, 165, 0, ${alpha})`;
                    break;
                case 'yellow':
                    ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
                    break;
                case 'red':
                    ctx.fillStyle = `rgba(255, 69, 0, ${alpha})`;
                    break;
            }
            
            ctx.beginPath();
            ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Spark trail
            ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.3})`;
            ctx.beginPath();
            ctx.arc(spark.x - spark.vx * 0.01, spark.y - spark.vy * 0.01, spark.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Render smoke
        this.smokeParticles.forEach(smoke => {
            const alpha = (smoke.life / smoke.maxLife) * 0.4;
            ctx.fillStyle = `rgba(128, 128, 128, ${alpha})`;
            ctx.beginPath();
            ctx.arc(smoke.x, smoke.y, smoke.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    onClick() {
        this.isSelected = true;
        return {
            type: 'forge_menu',
            forge: this,
            upgrades: this.getUpgradeOptions(),
            forgeUpgrade: this.getForgeUpgradeOption()
        };
    }
    
    getUpgradeOptions() {
        const options = [];
        
        // We need access to the unlock system to know which towers are unlocked
        // For now, build options based on forge level (match UnlockSystem's tower unlock progression)
        
        // Forge Level 1 - Basic towers available (basic, archer, barricade)
        // Only show upgrades for towers that are unlocked
        
        // Watch Tower - always available from forge level 1
        options.push({
            id: 'basic',
            name: 'Watch Tower Upgrade',
            description: `Increase Watch Tower damage by ${this.upgrades.basic.effect} per level`,
            level: this.upgrades.basic.level,
            maxLevel: this.maxForgeLevel,
            baseCost: this.upgrades.basic.baseCost,
            cost: this.calculateUpgradeCost('basic'),
            icon: '<img src="assets/towers/basic.png" class="upgrade-tower-icon">'
        });
        
        // Barricade Tower - available from forge level 1
        // Barricade Effectiveness - increases both capacity and duration
        options.push({
            id: 'barricade_effectiveness',
            name: 'Barricade Tower Upgrade',
            description: `Increases enemies slowed per rubble and slow duration`,
            level: this.upgrades.barricade_effectiveness.level,
            maxLevel: this.maxForgeLevel,
            baseCost: this.upgrades.barricade_effectiveness.baseCost,
            cost: this.calculateUpgradeCost('barricade_effectiveness'),
            icon: '<img src="assets/towers/barricade.png" class="upgrade-tower-icon">'
        });
        
        // Archer Tower - available from forge level 1 (damage + armor piercing combined)
        options.push({
            id: 'archer',
            name: 'Archer Tower Upgrade',
            description: `+${this.upgrades.archer.damageEffect} damage & +${this.upgrades.archer.pierceEffect}% armor pierce per level`,
            level: this.upgrades.archer.level,
            maxLevel: this.maxForgeLevel,
            baseCost: this.upgrades.archer.baseCost,
            cost: this.calculateUpgradeCost('archer'),
            icon: '<img src="assets/towers/archer.png" class="upgrade-tower-icon">'
        });
        
        // Poison Archer Tower - available from forge level 2+
        if (this.forgeLevel >= 2) {
            options.push({
                id: 'poison',
                name: 'Poison Archer Tower Upgrade',
                description: `Increase Poison Archer Tower poison tick damage (+5 per upgrade, base: 13)`,
                level: this.upgrades.poison.level,
                maxLevel: this.maxForgeLevel,
                baseCost: this.upgrades.poison.baseCost,
                cost: this.calculateUpgradeCost('poison'),
                icon: '<img src="assets/towers/poison.png" class="upgrade-tower-icon">'
            });
        }
        
        // Trebuchet Tower - available from forge level 3+
        if (this.forgeLevel >= 3) {
            options.push({
                id: 'cannon',
                name: 'Trebuchet Tower Upgrade',
                description: `+${this.upgrades.cannon.damageEffect} damage & +${this.upgrades.cannon.radiusEffect} blast radius per level`,
                level: this.upgrades.cannon.level,
                maxLevel: this.maxForgeLevel,
                baseCost: this.upgrades.cannon.baseCost,
                cost: this.calculateUpgradeCost('cannon'),
                icon: '<img src="assets/towers/cannon.png" class="upgrade-tower-icon">'
            });
        }
        
        return options;
    }
    
    getForgeUpgradeOption() {
        // Always return forge upgrade info, even when maxed
        const isMaxed = this.forgeLevel >= this.maxForgeLevel;
        const nextLevel = isMaxed ? this.forgeLevel : this.forgeLevel + 1;
        let description = "Upgrade the forge to unlock new towers, improve upgrades and improve mine income.";
        let nextUnlock = "";
        
        if (isMaxed) {
            nextUnlock = "MAX LEVEL - All available upgrades unlocked!\n3rd Gold Mine Available\nMagic Academy Unlocked\nCastle Fortification Level 3 available";
        } else {
            switch(nextLevel) {
                case 2:
                    nextUnlock = "Unlocks: Poison Archer Tower, doubles Mine income\nCastle Fortification Level 1 available (500g)";
                    break;
                case 3:
                    nextUnlock = "Unlocks: Trebuchet Tower, an additional Gold Mine and 2.5x Mine Income\nCastle Fortification Level 2 available (1000g)";
                    break;
                case 4:
                    nextUnlock = "Unlocks: Magic Academy Building and 3x Mine Income";
                    break;
                case 5:
                    nextUnlock = "Unlocks: 3rd Gold Mine and 3.5x Mine Income\nCastle Fortification Level 3 available (1750g) (Maximum Level)";
                    break;
                default:
                    nextUnlock = "Max Level Reached";
                    break;
            }
        }
        
        return {
            id: 'forge_level',
            name: isMaxed ? `Forge Level ${this.forgeLevel} - MAXED` : `Forge Level ${nextLevel}`,
            description: description,
            nextUnlock: nextUnlock,
            level: this.forgeLevel,
            maxLevel: this.maxForgeLevel,
            cost: this.calculateForgeUpgradeCost(),
            icon: '◆'
        };
    }
    
    calculateForgeUpgradeCost() {
        if (this.forgeLevel >= this.maxForgeLevel) return null;
        // Cost progression: Level 1->2: $400, 2->3: $800, 3->4: $1600, 4->5: $3200
        return 400 * Math.pow(2, this.forgeLevel - 1);
    }
    
    calculateUpgradeCost(upgradeType) {
        const upgrade = this.upgrades[upgradeType];
        if (!upgrade || upgrade.level >= this.forgeLevel) return null;
        const costTables = {
            'basic':                    [100, 150, 250, 375, 550],
            'archer':                   [150, 275, 450, 800, 1225],
            'barricade_effectiveness':  [125, 250, 500, 750, 1000],
            'poison':                   [200, 300, 500, 830, 1350],
            'cannon':                   [225, 450, 800, 1215, 1525]
        };
        const table = costTables[upgradeType];
        if (!table) return null;
        return table[upgrade.level] || null;
    }
    
    purchaseUpgrade(upgradeType, gameState) {
        if (upgradeType === 'forge_level') {
            return this.purchaseForgeUpgrade(gameState);
        }
        
        const upgrade = this.upgrades[upgradeType];
        const cost = this.calculateUpgradeCost(upgradeType);
        
        if (!upgrade || !cost || gameState.gold < cost || upgrade.level >= this.forgeLevel) {
            return false;
        }
        
        gameState.gold -= cost;
        upgrade.level++;
        
        this.notifyUpgradeChanged();
        return true;
    }
    
    purchaseForgeUpgrade(gameState) {
        const cost = this.calculateForgeUpgradeCost();
        
        if (!cost || gameState.gold < cost || this.forgeLevel >= this.maxForgeLevel) {
            return false;
        }
        
        gameState.gold -= cost;
        this.forgeLevel++;
        
        // Notify that upgrades changed so building manager recalculates mine income multiplier
        this.notifyUpgradeChanged();
        
        return true;
    }
    
    getForgeLevel() {
        return this.forgeLevel;
    }
    
    notifyUpgradeChanged() {
        this.upgradesChanged = true;
    }
    
    getUpgradeMultipliers() {
        // Calculate poison damage bonus - sum up all effect values up to current level
        let poisonDamageBonus = 0;
        if (this.upgrades.poison.level > 0 && Array.isArray(this.upgrades.poison.effect)) {
            for (let i = 0; i < this.upgrades.poison.level; i++) {
                poisonDamageBonus += this.upgrades.poison.effect[i];
            }
        }
        
        return {
            basicDamageBonus: this.upgrades.basic.level * this.upgrades.basic.effect,
            barricadeCapacityBonus: this.upgrades.barricade_effectiveness.level * this.upgrades.barricade_effectiveness.effect.capacity,
            barricadeDurationBonus: this.upgrades.barricade_effectiveness.level * this.upgrades.barricade_effectiveness.effect.duration,
            archerDamageBonus: this.upgrades.archer.level * this.upgrades.archer.damageEffect,
            archerArmorPierceBonus: this.upgrades.archer.level * this.upgrades.archer.pierceEffect,
            poisonDamageBonus: poisonDamageBonus,
            cannonDamageBonus: this.upgrades.cannon.level * this.upgrades.cannon.damageEffect,
            cannonRadiusBonus: this.upgrades.cannon.level * this.upgrades.cannon.radiusEffect
        };
    }
    
    applyEffect(buildingManager) {
        // Apply mine income multiplier based on forge level
        const mineIncomeMultiplier = this.getMineIncomeMultiplier();
        if (buildingManager.mineIncomeMultiplier) {
            buildingManager.mineIncomeMultiplier *= mineIncomeMultiplier;
        } else {
            buildingManager.mineIncomeMultiplier = mineIncomeMultiplier;
        }
    }
    
    getMineIncomeMultiplier() {
        // Level 1: 1.0x (base)
        // Level 2: 2.0x
        // Level 3: 2.5x
        // Level 4: 3.0x
        // Level 5: 3.5x
        switch(this.forgeLevel) {
            case 1: return 1.0;
            case 2: return 2.0;
            case 3: return 2.5;
            case 4: return 3.0;
            case 5: return 3.5;
            default: return 1.0;
        }
    }
    
    deselect() {
        this.isSelected = false;
    }
    
    static getInfo() {
        return {
            name: 'Tower Forge',
            description: 'Upgrades all towers and provides specialized tower enhancements.',
            effect: 'Global tower boost + upgrade menu',
            size: '4x4',
            cost: 300
        };
    }
}
