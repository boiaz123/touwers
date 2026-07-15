import { Building } from './Building.js';

export class MagicAcademy extends Building {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY, 4);
        this.magicParticles = [];
        this.isSelected = false;
        
        // Elemental upgrade system - CORRECTED elements
        this.elementalUpgrades = {
            fire: { level: 0, maxLevel: 5, baseCost: 150, damageBonus: 5 },
            water: { level: 0, maxLevel: 5, baseCost: 150, slowBonus: 0.1 },
            air: { level: 0, maxLevel: 5, baseCost: 150, chainRange: 20 },
            earth: { level: 0, maxLevel: 5, baseCost: 150, armorPiercing: 3 }
        };
        
        // New: Gem storage for each element
        this.gems = { fire: 0, water: 0, air: 0, earth: 0, diamond: 0 };
        
        // Gem mining is automatically unlocked at Academy Level 1
        this.gemMiningResearched = true;
        
        // Academy upgrade system - starts at level 1 on build
        this.academyLevel = 1;
        this.maxAcademyLevel = 3;
        
        // Track which features are unlocked
        // Level 1: Magic Tower + Gem Mining automatically unlocked
        // Level 2: Magic Tower upgrades unlocked
        // Level 3: Super Weapon Lab buildable
        this.superWeaponUnlocked = false;
        
        // Water ripples animation
        this.waterRipples = [];
        this.nextRippleTime = 0;
        
        // Trees at back and sides — all at Y <= 10 so they stand behind/beside the main tower.
        // More trees restore the forested academy feel without appearing "in front" of the building.
        this.trees = [
            // Back row
            { x: -55, y: -58, size: 0.85 },
            { x: -28, y: -62, size: 0.65 },
            { x:   3, y: -60, size: 0.55 },
            { x:  32, y: -54, size: 0.70 },
            { x:  58, y: -48, size: 0.60 },
            // Mid-back row
            { x: -62, y: -24, size: 0.80 },
            { x: -40, y: -30, size: 0.50 },
            { x:  45, y: -28, size: 0.65 },
            { x:  64, y: -18, size: 0.55 },
            // Side tufts (beside the building at near-zero Y)
            { x: -68, y:  -4, size: 0.70 },
            { x:  68, y:  -6, size: 0.65 },
            { x: -62, y:  10, size: 0.55 },
            { x:  62, y:   8, size: 0.50 }
        ];
        
        // Bushes at back and sides only
        this.bushes = [
            { x: -46, y: -40, size: 8 },
            { x: -14, y: -46, size: 6 },
            { x:  18, y: -48, size: 7 },
            { x:  44, y: -38, size: 8 },
            { x: -52, y:  -6, size: 7 },
            { x:  50, y:  -6, size: 7 },
            { x: -48, y:  10, size: 6 },
            { x:  48, y:  10, size: 6 }
        ];

        // Set by BuildingRenderAdapter once it has baked/synced this building's static
        // structure via Pixi (magic particles still draw here regardless - not yet migrated).
        this.skipCanvas2DBodyRender = false;
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Generate magic particles from spires
        if (Math.random() < deltaTime * 4) {
            const spirePositions = [
                { x: this.x - 30, y: this.y - 45 },
                { x: this.x + 30, y: this.y - 45 },
                { x: this.x, y: this.y - 60 }
            ];
            
            const spire = spirePositions[Math.floor(Math.random() * spirePositions.length)];
            this.magicParticles.push({
                x: spire.x + (Math.random() - 0.5) * 10,
                y: spire.y + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 20,
                vy: -Math.random() * 30 - 10,
                life: 3,
                maxLife: 3,
                size: Math.random() * 3 + 1,
                element: ['fire', 'ice', 'lightning', 'earth'][Math.floor(Math.random() * 4)]
            });
        }
        
        // Update magic particles (compact in-place)
        let mpWrite = 0;
        for (let i = 0; i < this.magicParticles.length; i++) {
            const particle = this.magicParticles[i];
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            particle.size = Math.max(0, particle.size * (particle.life / particle.maxLife));
            if (particle.life > 0 && particle.size > 0) {
                this.magicParticles[mpWrite++] = particle;
            }
        }
        this.magicParticles.length = mpWrite;
        
        // Generate water ripples inside the perspective moat ring
        // Moat centered at (this.x, this.y - size*0.10)  outer (size*0.48 × size*0.20)
        this.nextRippleTime -= deltaTime;
        if (this.nextRippleTime <= 0) {
            // nominal size=116 (scale=29 × 4)
            const nomSize = 116;
            const cx = this.x;
            const cy = this.y - nomSize * 0.10;
            const outerRX = nomSize * 0.48, outerRY = nomSize * 0.20;
            const innerRX = nomSize * 0.26, innerRY = nomSize * 0.11;
            // Spawn at a random angle, random fraction between inner and outer radii.
            // Rejects angles that would fall on the bridge crossing (_bridgeGap) or
            // behind the solid curtain wall (_moatVisibleAngle) - both draw every frame
            // on top of the fully-baked building (see renderWaterMoatDynamic's doc
            // comment), so a ripple spawned there would visibly float over the bridge
            // deck or "show through" the wall instead of being hidden behind it.
            const gap = this._bridgeGap();
            let angle = Math.random() * Math.PI * 2;
            for (let attempt = 0; attempt < 6 && (this._angleInGap(angle, gap) || !this._moatVisibleAngle(angle)); attempt++) {
                angle = Math.random() * Math.PI * 2;
            }
            const t = 0.3 + Math.random() * 0.55;  // 0 = inner edge, 1 = outer edge
            this.waterRipples.push({
                x: cx + Math.cos(angle) * (innerRX + (outerRX - innerRX) * t),
                y: cy + Math.sin(angle) * (innerRY + (outerRY - innerRY) * t),
                radius: 0,
                maxRadius: 4 + Math.random() * 5,
                life: 1.8,
                maxLife: 1.8
            });
            this.nextRippleTime = 0.5 + Math.random() * 1.0;
        }
        
        // Update water ripples (compact in-place)
        let wrWrite = 0;
        for (let i = 0; i < this.waterRipples.length; i++) {
            const ripple = this.waterRipples[i];
            ripple.life -= deltaTime;
            ripple.radius = ripple.maxRadius * (1 - ripple.life / ripple.maxLife);
            if (ripple.life > 0) {
                this.waterRipples[wrWrite++] = ripple;
            }
        }
        this.waterRipples.length = wrWrite;
    }
    
    render(ctx, size) {
        if (!this.skipCanvas2DBodyRender) {
            this.renderStaticBack(ctx, size);
            this.renderDynamicParts(ctx, size);
        }

        // Not yet migrated (Phase 6-shaped particle effects)
        this.renderMagicEffects(ctx, size);
    }

    /** No front-of-building overlay for this type - present for BuildingRenderAdapter's uniform convention. */
    renderStaticFront(ctx, size) {
        // intentionally empty
    }

    /**
     * Strategy A (baked once per campaign, shared across instances): ground footprint,
     * moat banks/water fill, plaza, trees/bushes, cobblestone base, spires, and central
     * tower - everything except shimmer/ripples/pulsing crystals/orb glow (see
     * renderDynamicParts).
     *
     * Originally renderGroundFootprint() only rendered when ctx.buildingManager was set
     * (the original code's way of detecting "in-game" vs "settlement hub" rendering
     * context) - simplified to unconditional here since baking only ever happens via the
     * in-game Pixi adapter (GameplayState), so that distinction is moot for this path.
     */
    renderStaticBack(ctx, size) {
        this.renderGroundFootprint(ctx, size);

        // Back-row trees/bushes (see VEGETATION_BACK_Y) render before the moat, so its
        // bank and water can naturally overlap their base - grounding them behind the
        // pond instead of pasting them flat on top of everything drawn so far. The
        // near/side planting renders after, so it stands in front of the bank the way
        // undergrowth actually grows right up to a shoreline.
        this.renderTrees(ctx, size, true);
        this.renderBushes(ctx, size, true);

        // All layers render naturally — tower tops and trees extend beyond the
        // placement square just like towers do, no clip applied.
        this.renderWaterMoatStatic(ctx, size);
        this.renderPavementPlaza(ctx, size);
        this.renderTrees(ctx, size, false);
        this.renderBushes(ctx, size, false);
        this.renderCobblestoneBase(ctx, size);
        this.renderSideSpiresStatic(ctx, size);
        this.renderCentralTowerStatic(ctx, size);
    }

    /** Strategy B (per-instance Graphics, redrawn every frame): water shimmer/ripples, pulsing spire crystals, pulsing tower-top orb - all continuous per-instance state. */
    renderDynamicParts(ctx, size) {
        this.renderWaterMoatDynamic(ctx, size);
        this.renderSideSpiresDynamic(ctx, size);
        this.renderCentralTowerDynamic(ctx, size);
    }

    renderGroundFootprint(ctx, size) {
        // Soft earthy-purple ground patch that fades out at the edges — no hard borders.
        // Centred in the lower portion of the 4×4 area so terrain shows but the
        // claimed space is clearly a different material from the surrounding grass.
        const half = size / 2;
        const cx = this.x;
        const cy = this.y + size * 0.12;  // slightly below grid centre

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, half * 0.92);
        grad.addColorStop(0,    'rgba(32, 18, 52, 0.80)');
        grad.addColorStop(0.45, 'rgba(24, 13, 40, 0.60)');
        grad.addColorStop(0.75, 'rgba(15,  8,  28, 0.30)');
        grad.addColorStop(1,    'rgba(0,   0,   0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, half * 0.92, half * 0.84, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    /** The bridge crosses through a real notch cut into the moat ring (see
     * _ringPathWithGap, used by renderWaterMoatStatic) rather than just being painted
     * over an unbroken ring - angle measured from the moat centre, Math.PI/2 = the
     * front-centre point the gate/bridge are already aligned on. */
    _bridgeGap() {
        return { angle: Math.PI / 2, half: 0.29 };
    }

    /** True if the given angle (radians, moat-centre-relative) falls inside the bridge's gap. */
    _angleInGap(angle, gap) {
        let d = Math.abs(angle - gap.angle) % (Math.PI * 2);
        if (d > Math.PI) d = Math.PI * 2 - d;
        return d < gap.half * 1.3;
    }

    /** True where a point on the moat ring would actually be visible past the solid
     * curtain wall standing behind the building, rather than hidden behind it. The
     * static back layer (renderStaticBack) already gets this for free - the wall is
     * simply painted over the moat afterward in the same baked texture - but the
     * per-frame water shimmer/ripples/glint (renderWaterMoatDynamic, update()) are a
     * separate layer that always draws on top of the whole building every frame (both
     * in-game, via BuildingRenderAdapter's dynamic Graphics sitting above the baked
     * sprite, and in the Settlement Hub, via render() calling renderDynamicParts after
     * renderStaticBack on the same canvas) with no awareness of what the wall's pixels
     * already cover - so without this check, water effects behind the wall "show
     * through" it. The front half (below the wall's ground line) is always clear, plus
     * two side slivers where the moat's ellipse pokes out past the wall's edges -
     * thresholds derived from the wall's half-width (baseWidth/2 = 0.41*size) vs. the
     * moat's outer radius (0.5*size), both size-independent proportions. */
    _moatVisibleAngle(angle) {
        return Math.sin(angle) >= 0 || Math.abs(Math.cos(angle)) >= 0.82;
    }

    renderPavementPlaza(ctx, size) {
        // Cobblestone bridge spanning the actual gap cut into the moat ring - from the
        // outer bank (nearest the viewer) to the inner bank (nearest the gate), tapering
        // narrower toward the far end for perspective, with real water visible flanking
        // the deck instead of a flat plank simply pasted on top of the ring.
        const { cx, cy, outerRX, outerRY, innerRX, innerRY } = this._moatGeometry(size);
        const gap = this._bridgeGap();

        const nearY = cy + outerRY * Math.cos(gap.half) + 2;
        const farY = cy + innerRY * Math.cos(gap.half) - 1;
        const nearHalfW = outerRX * Math.sin(gap.half);
        const farHalfW = innerRX * Math.sin(gap.half) + 2;

        // Stone support piers dipping into the water on both sides of the deck, so the
        // bridge reads as crossing over the moat rather than floating above it.
        [-1, 1].forEach(side => {
            const t = 0.45;
            const py = nearY + (farY - nearY) * t;
            const pHalfW = nearHalfW + (farHalfW - nearHalfW) * t;
            const px = cx + side * (pHalfW + 3);
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.beginPath();
            ctx.ellipse(px, py + 2.5, 3.2, 1.4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#7d7052';
            ctx.fillRect(px - 1.8, py - 4, 3.6, 7.5);
            ctx.strokeStyle = '#4a4232';
            ctx.lineWidth = 0.6;
            ctx.strokeRect(px - 1.8, py - 4, 3.6, 7.5);
        });

        // Soft shadow the deck casts on the water to either side
        [-1, 1].forEach(side => {
            const shadowGrad = ctx.createLinearGradient(cx, nearY, cx, farY);
            shadowGrad.addColorStop(0, 'rgba(0,0,0,0.22)');
            shadowGrad.addColorStop(1, 'rgba(0,0,0,0.06)');
            ctx.fillStyle = shadowGrad;
            ctx.beginPath();
            ctx.moveTo(cx + side * (nearHalfW + 1), nearY);
            ctx.lineTo(cx + side * (farHalfW + 1), farY);
            ctx.lineTo(cx + side * (farHalfW + 5), farY);
            ctx.lineTo(cx + side * (nearHalfW + 6), nearY);
            ctx.closePath();
            ctx.fill();
        });

        // Reflection of the deck on the water just ahead of its near foot
        const reflGrad = ctx.createLinearGradient(cx, nearY - 5, cx, nearY);
        reflGrad.addColorStop(0, 'rgba(150, 140, 120, 0)');
        reflGrad.addColorStop(1, 'rgba(150, 140, 120, 0.25)');
        ctx.fillStyle = reflGrad;
        ctx.beginPath();
        ctx.moveTo(cx - nearHalfW + 2, nearY - 5);
        ctx.lineTo(cx + nearHalfW - 2, nearY - 5);
        ctx.lineTo(cx + nearHalfW - 2, nearY);
        ctx.lineTo(cx - nearHalfW + 2, nearY);
        ctx.closePath();
        ctx.fill();

        // Stone bridge deck - a tapered trapezoid (wide/near at the outer bank,
        // narrow/far at the gate) rather than a flat parallel-sided plank. Palette
        // matches the moat's stone bank (renderWaterMoatStatic) so the crossing reads
        // as one piece of masonry with the fortress rather than a separate asset.
        const deckGrad = ctx.createLinearGradient(cx, nearY, cx, farY);
        deckGrad.addColorStop(0, '#a89a72');
        deckGrad.addColorStop(0.5, '#8a8060');
        deckGrad.addColorStop(1, '#6e6448');
        ctx.fillStyle = deckGrad;
        ctx.beginPath();
        ctx.moveTo(cx - nearHalfW, nearY);
        ctx.lineTo(cx + nearHalfW, nearY);
        ctx.lineTo(cx + farHalfW, farY);
        ctx.lineTo(cx - farHalfW, farY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#4a4232';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Flagstone joints, converging toward the far end for perspective
        for (let r = 1; r < 3; r++) {
            const t = r / 3;
            const jy = nearY + (farY - nearY) * t;
            const jHalfW = nearHalfW + (farHalfW - nearHalfW) * t;
            ctx.beginPath();
            ctx.moveTo(cx - jHalfW, jy);
            ctx.lineTo(cx + jHalfW, jy);
            ctx.stroke();
        }
        [-0.5, 0, 0.5].forEach(f => {
            ctx.beginPath();
            ctx.moveTo(cx + f * nearHalfW * 2, nearY);
            ctx.lineTo(cx + f * farHalfW * 2, farY);
            ctx.stroke();
        });

        // Low stone balustrade with posts along both tapering edges, shrinking toward
        // the far end for perspective, so the crossing reads as a built structure.
        [-1, 1].forEach(side => {
            const railGrad = ctx.createLinearGradient(cx, nearY, cx, farY);
            railGrad.addColorStop(0, '#b0a482');
            railGrad.addColorStop(1, '#786c4e');
            ctx.strokeStyle = railGrad;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(cx + side * nearHalfW, nearY - 1);
            ctx.lineTo(cx + side * farHalfW, farY - 1);
            ctx.stroke();

            const postCount = 4;
            for (let p = 0; p <= postCount; p++) {
                const t = p / postCount;
                const py = nearY + (farY - nearY) * t;
                const pHalfW = nearHalfW + (farHalfW - nearHalfW) * t;
                const psize = 2.2 - t * 0.9;
                ctx.fillStyle = '#948566';
                ctx.fillRect(cx + side * pHalfW - psize / 2, py - psize - 1.5, psize, psize + 1.5);
                ctx.strokeStyle = '#4a4232';
                ctx.lineWidth = 0.6;
                ctx.strokeRect(cx + side * pHalfW - psize / 2, py - psize - 1.5, psize, psize + 1.5);
            }
        });

        // Fade edge into the plaza beyond the gate
        const fadeGrad = ctx.createLinearGradient(0, farY, 0, farY - 5);
        fadeGrad.addColorStop(0, 'rgba(0,0,0,0.15)');
        fadeGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = fadeGrad;
        ctx.fillRect(cx - farHalfW, farY - 5, farHalfW * 2, 5);
    }

    /** Shared moat ellipse geometry - single source of truth so the static bank/water
     * layer and the dynamic shimmer/ripple layer (drawn by two separate methods, baked
     * at different times) can never drift apart. */
    _moatGeometry(size) {
        return {
            cx: this.x,
            cy: this.y - size * 0.10,
            outerRX: size * 0.50,
            outerRY: size * 0.21,
            innerRX: size * 0.26,
            innerRY: size * 0.11
        };
    }

    /** Builds (as the current path - caller sets fillStyle/strokeStyle and calls
     * fill()/stroke()) an elliptical ring with an angular notch cut out of it, so the
     * bridge can cross through real water/bank rather than being painted over an
     * unbroken ring. Traces the outer boundary the long way around the gap, steps
     * across to the inner boundary, then traces it back - a single closed path that
     * fills correctly with the default nonzero winding rule (no evenodd needed). */
    _ringPathWithGap(ctx, cx, cy, outerRX, outerRY, innerRX, innerRY, gap) {
        const aStart = gap.angle + gap.half;
        const aEnd = gap.angle - gap.half + Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, outerRX, outerRY, 0, aStart, aEnd, false);
        ctx.lineTo(cx + innerRX * Math.cos(aEnd), cy + innerRY * Math.sin(aEnd));
        ctx.ellipse(cx, cy, innerRX, innerRY, 0, aEnd, aStart, true);
        ctx.closePath();
    }

    /** Strategy A piece: moat shadow/bank/water fill - fully static. */
    renderWaterMoatStatic(ctx, size) {
        // Perspective-flattened moat ring surrounding the fortress base.
        // An elliptical donut drawn using the even-odd winding rule, with an angular
        // notch left open where the bridge crosses (see _bridgeGap/_ringPathWithGap).
        const { cx, cy, outerRX, outerRY, innerRX, innerRY } = this._moatGeometry(size);
        const gap = this._bridgeGap();

        // Outer ground shadow under the moat
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.beginPath();
        ctx.ellipse(cx + 4, cy + 4, outerRX, outerRY, 0, 0, Math.PI * 2);
        ctx.fill();

        // Soft grassy/mossy transition where the bank meets the surrounding terrain, so
        // the moat reads as sitting in the ground rather than pasted on top of it.
        const transGrad = ctx.createRadialGradient(cx, cy, outerRX * 0.85, cx, cy, outerRX + 14);
        transGrad.addColorStop(0, 'rgba(60, 70, 35, 0.35)');
        transGrad.addColorStop(1, 'rgba(60, 70, 35, 0)');
        ctx.fillStyle = transGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, outerRX + 14, outerRY + 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Moat bank / stone rim - a radial gradient across its cross-section so the top
        // edge catches light and the inner face falls into shadow toward the water.
        const bankGrad = ctx.createRadialGradient(cx, cy, innerRX * 0.9, cx, cy, outerRX + 4);
        bankGrad.addColorStop(0, '#5c5540');
        bankGrad.addColorStop(0.35, '#8a8060');
        bankGrad.addColorStop(0.85, '#a89a72');
        bankGrad.addColorStop(1, '#7d7052');
        ctx.fillStyle = bankGrad;
        this._ringPathWithGap(ctx, cx, cy, outerRX + 4, outerRY + 2, innerRX - 3, innerRY - 1.5, gap);
        ctx.fill();

        // Bank top highlight rim (sunlit stone edge, upper-left biased like the rest of
        // the building's left-lit convention)
        ctx.strokeStyle = 'rgba(230, 220, 190, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(cx, cy, outerRX + 3, outerRY + 1.5, 0, Math.PI * 1.05, Math.PI * 1.85);
        ctx.stroke();

        // Water fill - deeper, multi-band gradient for a real sense of depth
        const waterGrad = ctx.createRadialGradient(
            cx - outerRX * 0.2, cy - outerRY * 0.3, innerRX * 0.3,
            cx, cy, outerRX
        );
        waterGrad.addColorStop(0,    'rgba(120, 195, 240, 0.95)');
        waterGrad.addColorStop(0.28, 'rgba(70, 160, 225, 0.92)');
        waterGrad.addColorStop(0.55, 'rgba(35, 110, 190, 0.90)');
        waterGrad.addColorStop(0.8,  'rgba(18, 75, 155, 0.93)');
        waterGrad.addColorStop(1,    'rgba(8, 45, 110, 0.96)');
        ctx.fillStyle = waterGrad;
        this._ringPathWithGap(ctx, cx, cy, outerRX, outerRY, innerRX, innerRY, gap);
        ctx.fill();

        // Soft reflection of the fortress in the water nearest the building - a blurred
        // vertical smear rather than a literal mirror image, which reads well at this
        // scale and ties the water visually to the structure standing in it.
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, outerRX, outerRY, 0, 0, Math.PI * 2);
        ctx.ellipse(cx, cy, innerRX, innerRY, 0, 0, Math.PI * 2, true);
        ctx.clip('evenodd');
        const reflGrad = ctx.createLinearGradient(cx, cy - outerRY, cx, cy + outerRY * 0.3);
        reflGrad.addColorStop(0, 'rgba(160, 150, 190, 0.32)');
        reflGrad.addColorStop(0.6, 'rgba(120, 110, 150, 0.14)');
        reflGrad.addColorStop(1, 'rgba(120, 110, 150, 0)');
        ctx.fillStyle = reflGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy - outerRY * 0.35, innerRX * 1.5, outerRY * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Inner shoreline - where the water meets the paved island - a thin dark
        // waterline plus a slim sunlit highlight just above it.
        ctx.strokeStyle = 'rgba(5, 25, 55, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(cx, cy, innerRX, innerRY, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(200, 230, 255, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(cx, cy, innerRX + 1.2, innerRY + 0.6, 0, Math.PI * 1.05, Math.PI * 1.85);
        ctx.stroke();

        // Small rocks and reed clusters ringing the bank so the moat blends into the
        // landscape instead of reading as a bare ring of stone - drawn last (on top of
        // the water fill) so they actually sit visibly at the shoreline instead of
        // being painted over by the water that covers the same radius span.
        this._renderMoatBankDetail(ctx, cx, cy, outerRX, outerRY, innerRX, innerRY, gap);
    }

    /** Static rocks + reed clusters ringing the moat bank - decorative, baked once. */
    _renderMoatBankDetail(ctx, cx, cy, outerRX, outerRY, innerRX, innerRY, gap) {
        const clusterCount = 14;
        for (let i = 0; i < clusterCount; i++) {
            const hash = (i * 37 % 23) / 23;  // deterministic pseudo-random, stable across bakes
            const angle = (i / clusterCount) * Math.PI * 2 + hash * 0.3;
            if (gap && this._angleInGap(angle, gap)) continue;  // leave the bridge crossing clear
            const t = 0.55 + hash * 0.4;
            const bx = cx + Math.cos(angle) * (innerRX + (outerRX - innerRX) * t);
            const by = cy + Math.sin(angle) * (innerRY + (outerRY - innerRY) * t);

            if (i % 3 === 0) {
                // Rock
                const rs = 2.2 + hash * 2;
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.beginPath();
                ctx.ellipse(bx + 1, by + 1, rs * 1.1, rs * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
                const shade = 100 + hash * 40;
                ctx.fillStyle = `rgb(${shade + 10}, ${shade + 5}, ${shade - 5})`;
                ctx.beginPath();
                ctx.ellipse(bx, by, rs, rs * 0.7, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(220,220,210,0.4)';
                ctx.beginPath();
                ctx.ellipse(bx - rs * 0.3, by - rs * 0.3, rs * 0.35, rs * 0.2, 0, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Reed cluster
                for (let b = 0; b < 3; b++) {
                    const bladeH = 6 + hash * 5;
                    const lean = (b - 1) * 1.6;
                    const bx0 = bx + (b - 1) * 1.4;
                    ctx.strokeStyle = `rgba(${50 + b * 10}, ${90 + b * 15}, 40, 0.85)`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(bx0, by);
                    ctx.quadraticCurveTo(bx0 + lean * 0.5, by - bladeH * 0.6, bx0 + lean, by - bladeH);
                    ctx.stroke();
                }
            }
        }
    }

    /** Strategy B piece: water shimmer + ripples - animationTime/per-instance state, not bakeable. Uses the same shared geometry as renderWaterMoatStatic() above so the two layers never drift apart. */
    renderWaterMoatDynamic(ctx, size) {
        const { cx, cy, outerRX, outerRY, innerRX, innerRY } = this._moatGeometry(size);
        const gap = this._bridgeGap();

        // Surface shimmer - skips both the bridge crossing and any angle currently
        // hidden behind the curtain wall (see _moatVisibleAngle's doc comment), since
        // this whole layer draws on top of the fully-baked building every frame.
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2 + this.animationTime * 0.4;
            if (this._angleInGap(angle, gap) || !this._moatVisibleAngle(angle)) continue;
            const t = 0.35 + (i % 3) * 0.22;  // spread between inner and outer
            const sx = cx + Math.cos(angle) * (innerRX + (outerRX - innerRX) * t);
            const sy = cy + Math.sin(angle) * (innerRY + (outerRY - innerRY) * t);
            const alpha = (Math.sin(this.animationTime * 2.8 + i * 0.9) + 1) * 0.12;
            ctx.fillStyle = `rgba(180, 220, 255, ${alpha})`;
            ctx.beginPath();
            ctx.ellipse(sx, sy, 4, 1.8, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // A slow-drifting glint sliding across the mid-band of the water, confined to
        // the front-facing arc (always visible in front of the wall - see
        // _moatVisibleAngle) so it can never appear to shine through the wall. Placed
        // exactly on the moat's own mid-band ellipse (rather than relying on clip()) so
        // it can never land outside the water - the in-game Pixi path draws this layer
        // through CanvasGraphicsShim, which no-ops clip() (see that file's doc comment).
        const glintAngle = Math.PI * 0.65 + Math.sin(this.animationTime * 0.3) * 0.4;
        const glintX = cx + Math.cos(glintAngle) * (innerRX + (outerRX - innerRX) * 0.5);
        const glintY = cy + Math.sin(glintAngle) * (innerRY + (outerRY - innerRY) * 0.5);
        const glintGrad = ctx.createRadialGradient(glintX, glintY, 0, glintX, glintY, 8);
        glintGrad.addColorStop(0, 'rgba(220, 235, 255, 0.3)');
        glintGrad.addColorStop(1, 'rgba(220, 235, 255, 0)');
        ctx.fillStyle = glintGrad;
        ctx.beginPath();
        ctx.ellipse(glintX, glintY, 8, 3.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ripples clipped to moat ring
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, outerRX, outerRY, 0, 0, Math.PI * 2);
        ctx.ellipse(cx, cy, innerRX, innerRY, 0, 0, Math.PI * 2, true);
        ctx.clip('evenodd');
        this.waterRipples.forEach(ripple => {
            const alpha = (ripple.life / ripple.maxLife) * 0.4;
            ctx.strokeStyle = `rgba(200, 230, 255, ${alpha})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.ellipse(ripple.x, ripple.y, ripple.radius, ripple.radius * 0.45, 0, 0, Math.PI * 2);
            ctx.stroke();
        });
        ctx.restore();
    }

    /** Trees/bushes at or above this Y (i.e. further back, smaller Y) render before the
     * moat so its bank/water can overlap their base and ground them into the scene;
     * the rest render after, standing beside the bank. See renderStaticBack(). */
    static VEGETATION_BACK_Y = -15;

    renderTrees(ctx, size, backLayer) {
        // Scale tree positions and sizes relative to the nominal design size of 128
        const sf = size / 128;
        this.trees.forEach((tree, index) => {
            if (backLayer !== undefined && (tree.y <= MagicAcademy.VEGETATION_BACK_Y) !== backLayer) return;
            const treeX = this.x + tree.x * sf;
            const treeY = this.y + tree.y * sf;
            const scale = tree.size * 40 * sf;

            if (ctx.level) {
                // Campaign-aware vegetation
                ctx.level.renderVegetation(ctx, treeX, treeY, scale, 0, 0, index);
            } else {
                // Fallback: forest trees - a warm earthy shadow instead of flat black so
                // the tree blends into the dirt/grass beneath it rather than reading as
                // a flat cutout pasted on top.
                ctx.fillStyle = 'rgba(40, 28, 12, 0.3)';
                ctx.save();
                ctx.translate(treeX + 3, treeY + 4);
                ctx.scale(1, 0.4);
                ctx.beginPath();
                ctx.arc(0, 0, scale * 0.35, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                const treeType = index % 4;
                switch(treeType) {
                    case 0: this.renderTreeType1(ctx, treeX, treeY, scale); break;
                    case 1: this.renderTreeType2(ctx, treeX, treeY, scale); break;
                    case 2: this.renderTreeType3(ctx, treeX, treeY, scale); break;
                    default: this.renderTreeType4(ctx, treeX, treeY, scale);
                }
            }
        });
    }
    
    renderTreeType1(ctx, x, y, size) {
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

    renderTreeType2(ctx, x, y, size) {
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
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.35, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#43A047';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.55, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    renderTreeType3(ctx, x, y, size) {
        // Sparse tree with distinct branches
        const trunkWidth = size * 0.22;
        ctx.fillStyle = '#795548';
        ctx.fillRect(x - trunkWidth * 0.5, y - size * 0.2, trunkWidth, size * 0.6);
        ctx.fillStyle = '#4E342E';
        ctx.beginPath();
        ctx.arc(x + trunkWidth * 0.25, y, trunkWidth * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.arc(x - size * 0.28, y - size * 0.35, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + size * 0.28, y - size * 0.3, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.55, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    renderTreeType4(ctx, x, y, size) {
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
        ctx.moveTo(x, y - size * 0.6);
        ctx.lineTo(x + size * 0.12, y - size * 0.45);
        ctx.lineTo(x - size * 0.12, y - size * 0.45);
        ctx.closePath();
        ctx.fill();
    }
    
    renderBushes(ctx, size, backLayer) {
        const sf = size / 128;
        this.bushes.forEach((bush, index) => {
            if (backLayer !== undefined && (bush.y <= MagicAcademy.VEGETATION_BACK_Y) !== backLayer) return;
            const bushX = this.x + bush.x * sf;
            const bushY = this.y + bush.y * sf;
            const bs = bush.size * sf;

            if (ctx.level) {
                // Campaign-aware small vegetation
                ctx.level.renderVegetation(ctx, bushX, bushY, bs * 3.5, 0, 0, index + 20);
            } else {
                // Fallback: forest bushes - warm earthy shadow so it blends into the
                // ground beneath it rather than reading as a flat cutout.
                ctx.save();
                ctx.translate(bushX, bushY);

                ctx.fillStyle = 'rgba(40, 28, 12, 0.32)';
                ctx.beginPath();
                ctx.ellipse(2, 2, bs, bs * 0.3, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#228B22';
                ctx.beginPath();
                ctx.arc(0, 0, bs, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#32CD32';
                for (let i = 0; i < 3; i++) {
                    const angle = (i / 3) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.arc(Math.cos(angle) * bs * 0.4, Math.sin(angle) * bs * 0.4, bs * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }
        });
    }
    
    /** Shared alignment line: the horizontal "floor division" that the curtain wall's
     * belt course, the central tower's collar and the side spires' collar all sit on,
     * so the whole building reads as one structure with a consistent storey line rather
     * than three independently-designed pieces. */
    _wallBeltY(size) {
        return this.y - size * 0.32 * 0.58;
    }

    renderCobblestoneBase(ctx, size) {
        const baseWidth = size * 0.82;
        const wallHeight = size * 0.32;
        // Base is GROUNDED at this.y — it extends upward from the ground plane
        const baseTop = this.y - wallHeight;
        const baseBottom = this.y;
        const plinthH = wallHeight * 0.1;

        // Plinth - a darker, slightly wider foundation course the wall visually rests on.
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(this.x - baseWidth / 2 - 3, baseBottom - plinthH, baseWidth + 6, plinthH);
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - baseWidth / 2 - 3, baseBottom - plinthH, baseWidth + 6, plinthH);

        // Main fortress wall gradient — left-lit for 3/4 perspective
        const wallGradient = ctx.createLinearGradient(
            this.x - baseWidth / 2, baseTop,
            this.x + baseWidth / 4, baseBottom
        );
        wallGradient.addColorStop(0, '#B0B0B0');
        wallGradient.addColorStop(0.45, '#848484');
        wallGradient.addColorStop(1, '#606060');

        ctx.fillStyle = wallGradient;
        ctx.fillRect(this.x - baseWidth / 2, baseTop, baseWidth, wallHeight);

        // Cobblestone block pattern
        const stoneW = baseWidth / 12;
        const stoneH = wallHeight / 7;
        ctx.lineWidth = 0.8;

        for (let row = 0; row < 7; row++) {
            const offsetX = (row % 2) * stoneW * 0.5;
            const rowY = baseTop + row * stoneH;

            for (let col = 0; col < 13; col++) {
                const sx = this.x - baseWidth / 2 + offsetX + col * stoneW;
                const sx1 = Math.max(sx, this.x - baseWidth / 2);
                const sx2 = Math.min(sx + stoneW - 1, this.x + baseWidth / 2);
                if (sx2 <= sx1) continue;

                const hash = ((row * 11 + col * 7) % 13) / 13;
                const shade = 0.78 + hash * 0.20;
                ctx.fillStyle = `rgb(${Math.floor(170 * shade)},${Math.floor(170 * shade)},${Math.floor(170 * shade)})`;
                ctx.fillRect(sx1, rowY, sx2 - sx1, stoneH - 1);

                ctx.strokeStyle = '#383838';
                ctx.strokeRect(sx1, rowY, sx2 - sx1, stoneH - 1);

                // Top-left highlight
                ctx.fillStyle = `rgba(220,220,220,${0.22 * shade})`;
                ctx.fillRect(sx1 + 1, rowY + 1, (sx2 - sx1) * 0.3, stoneH * 0.35);
            }
        }

        // Belt course - a raised lighter trim band marking the wall's upper storey line,
        // at the same height the central tower and side spires align their own collar
        // to (see _wallBeltY), tying the whole structure to one floor division.
        const beltY = this._wallBeltY(size);
        const beltH = wallHeight * 0.09;
        const beltGrad = ctx.createLinearGradient(0, beltY - beltH / 2, 0, beltY + beltH / 2);
        beltGrad.addColorStop(0, '#d8d0bc');
        beltGrad.addColorStop(0.5, '#b8ac8e');
        beltGrad.addColorStop(1, '#8a7d5e');
        ctx.fillStyle = beltGrad;
        ctx.fillRect(this.x - baseWidth / 2 - 1, beltY - beltH / 2, baseWidth + 2, beltH);
        ctx.strokeStyle = '#3a3428';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(this.x - baseWidth / 2 - 1, beltY - beltH / 2, baseWidth + 2, beltH);

        // Corner edge shading for pseudo-3D depth - highlight on the lit left edge,
        // shadow on the right, matching the wall's own left-lit gradient.
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(this.x - baseWidth / 2, baseTop, 2.5, wallHeight);
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(this.x + baseWidth / 2 - 2.5, baseTop, 2.5, wallHeight);

        // Thick left and right wall edges
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x - baseWidth / 2, baseTop);
        ctx.lineTo(this.x - baseWidth / 2, baseBottom);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x + baseWidth / 2, baseTop);
        ctx.lineTo(this.x + baseWidth / 2, baseBottom);
        ctx.stroke();

        // Bottom edge — the ground line
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x - baseWidth / 2, baseBottom);
        ctx.lineTo(this.x + baseWidth / 2, baseBottom);
        ctx.stroke();

        // Crenellations (merlons) along the wall top — connecting the spires visually
        const merlonW = stoneW * 1.2;
        const merlonH = wallHeight * 0.12;
        const merlonCount = 9;
        const merlonSpacing = baseWidth / merlonCount;
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 1;
        for (let i = 0; i < merlonCount; i++) {
            if (i % 2 === 0) {
                const mx = this.x - baseWidth / 2 + i * merlonSpacing + merlonSpacing * 0.1;
                const merlonGrad = ctx.createLinearGradient(mx, baseTop - merlonH, mx + merlonW, baseTop);
                merlonGrad.addColorStop(0, '#aaa8a0');
                merlonGrad.addColorStop(1, '#707068');
                ctx.fillStyle = merlonGrad;
                ctx.fillRect(mx, baseTop - merlonH, merlonW, merlonH);
                ctx.strokeRect(mx, baseTop - merlonH, merlonW, merlonH);
                // Shadow face on the right side of each merlon for depth
                ctx.fillStyle = 'rgba(0,0,0,0.22)';
                ctx.fillRect(mx + merlonW * 0.75, baseTop - merlonH, merlonW * 0.25, merlonH);
            }
        }

        // Gate archway — in the lower centre of the front face, sitting at ground level
        const gateW = size * 0.14;
        const gateH = wallHeight * 0.72;
        const gateX = this.x - gateW / 2;
        const gateY = baseBottom - gateH;

        // Gate surround (darker stone frame)
        ctx.fillStyle = '#484848';
        ctx.fillRect(gateX - 3, gateY - gateH * 0.12, gateW + 6, gateH + gateH * 0.12);

        // Gate opening
        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(gateX, gateY, gateW, gateH);

        // Arched top
        ctx.fillStyle = '#1A1A1A';
        ctx.beginPath();
        ctx.arc(this.x, gateY, gateW / 2, Math.PI, 0);
        ctx.fill();

        // Wooden door planks
        ctx.fillStyle = '#3D2410';
        ctx.fillRect(gateX + 1, gateY, gateW - 2, gateH - 1);
        ctx.strokeStyle = '#251408';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x, gateY);
        ctx.lineTo(this.x, gateY + gateH);
        ctx.stroke();
        for (let p = 1; p < 4; p++) {
            ctx.beginPath();
            ctx.moveTo(gateX + 1, gateY + (gateH / 4) * p);
            ctx.lineTo(gateX + gateW - 1, gateY + (gateH / 4) * p);
            ctx.stroke();
        }

        // Stone step at the base front
        ctx.fillStyle = '#787878';
        ctx.fillRect(this.x - gateW * 0.9, baseBottom, gateW * 1.8, 4);
        ctx.strokeStyle = '#404040';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - gateW * 0.9, baseBottom, gateW * 1.8, 4);
    }
    
    /**
     * Shared static tower-body renderer used by the central keep and both side spires -
     * same taper, stone coursing and edge-shading technique applied at different scales,
     * so the towers read as one consistent architectural language rather than three
     * separately-designed pieces (mirrors Campaign4.js's boss-castle _drawDarkTower
     * reuse pattern - see that file for the Frog King's Realm castle this was modeled
     * on). Draws body + coursing + collar only - callers add their own windows/roof/cap.
     */
    _drawTowerShell(ctx, { cx, baseY, height, radiusTop, radiusBottom, courseCount, collarY, palette }) {
        const topY = baseY - height;

        // Slight outward taper toward the base for a grounded, load-bearing silhouette.
        ctx.beginPath();
        ctx.moveTo(cx - radiusTop, topY);
        ctx.lineTo(cx + radiusTop, topY);
        ctx.lineTo(cx + radiusBottom, baseY);
        ctx.lineTo(cx - radiusBottom, baseY);
        ctx.closePath();

        const bodyGrad = ctx.createLinearGradient(cx - radiusBottom, topY, cx + radiusBottom, baseY);
        bodyGrad.addColorStop(0, palette.light);
        bodyGrad.addColorStop(0.5, palette.mid);
        bodyGrad.addColorStop(1, palette.dark);
        ctx.fillStyle = bodyGrad;
        ctx.fill();
        ctx.strokeStyle = palette.outline;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Edge shadow/highlight strips for a rounded cross-section feel, clipped to the
        // tapered silhouette so they never spill past the tower's own outline.
        ctx.save();
        ctx.clip();
        const edgeW = Math.max(radiusTop * 0.3, 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(cx + radiusBottom - edgeW, topY, edgeW + 4, height);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(cx - radiusBottom - 2, topY, edgeW, height);
        ctx.restore();

        // Horizontal stone courses, interpolating width along the taper
        for (let c = 1; c < courseCount; c++) {
            const rowY = topY + (height / courseCount) * c;
            const f = c / courseCount;
            const rowR = radiusTop + (radiusBottom - radiusTop) * f;
            ctx.strokeStyle = palette.mortar;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(cx - rowR, rowY);
            ctx.lineTo(cx + rowR, rowY);
            ctx.stroke();
        }

        // Collar / belt line - aligns with the curtain wall's own belt course (see
        // _wallBeltY) so the tower visually rises out of the same storey line as the
        // wall around it, instead of looking like a separate piece stuck on top.
        if (collarY != null && collarY > topY && collarY < baseY) {
            const f = (collarY - topY) / height;
            const collarR = radiusTop + (radiusBottom - radiusTop) * f + 1.5;
            const collarH = height * 0.045;
            const collarGrad = ctx.createLinearGradient(0, collarY - collarH / 2, 0, collarY + collarH / 2);
            collarGrad.addColorStop(0, '#d8d0bc');
            collarGrad.addColorStop(1, '#8a7d5e');
            ctx.fillStyle = collarGrad;
            ctx.fillRect(cx - collarR, collarY - collarH / 2, collarR * 2, collarH);
            ctx.strokeStyle = palette.outline;
            ctx.lineWidth = 0.8;
            ctx.strokeRect(cx - collarR, collarY - collarH / 2, collarR * 2, collarH);
        }
    }

    /** Strategy A piece: tower body, windows, roof - fully static (window glow is a fixed color, not animationTime-driven). */
    renderCentralTowerStatic(ctx, size) {
        const towerRadius = size * 0.15;
        const towerHeight = size * 0.5;
        const towerY = this.y - towerHeight;

        this._drawTowerShell(ctx, {
            cx: this.x,
            baseY: this.y,
            height: towerHeight,
            radiusTop: towerRadius,
            radiusBottom: towerRadius * 1.35,
            courseCount: 5,
            collarY: this._wallBeltY(size),
            palette: {
                light: '#B0C4DE', mid: '#708090', dark: '#2F4F4F',
                outline: '#2F2F2F', mortar: '#1C1C1C'
            }
        });

        // Tower windows - 3 in vertical column with arch tops
        const winW = 7;
        const winH = 10;
        const windowYPositions = [
            this.y - towerHeight * 0.75,
            this.y - towerHeight * 0.5,
            this.y - towerHeight * 0.25
        ];
        windowYPositions.forEach(wY => {
            // Window glow
            const windowGlow = ctx.createRadialGradient(this.x, wY, 0, this.x, wY, 12);
            windowGlow.addColorStop(0, 'rgba(138, 43, 226, 0.6)');
            windowGlow.addColorStop(1, 'rgba(138, 43, 226, 0)');
            ctx.fillStyle = windowGlow;
            ctx.beginPath();
            ctx.arc(this.x, wY, 12, 0, Math.PI * 2);
            ctx.fill();
            
            // Window body (arched top)
            ctx.fillStyle = '#1C1C1C';
            ctx.fillRect(this.x - winW / 2, wY - winH / 2, winW, winH);
            ctx.beginPath();
            ctx.arc(this.x, wY - winH / 2, winW / 2, Math.PI, 0);
            ctx.fill();
            
            // Window frame
            ctx.strokeStyle = '#4A3060';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x - winW / 2, wY + winH / 2);
            ctx.lineTo(this.x - winW / 2, wY - winH / 2);
            ctx.arc(this.x, wY - winH / 2, winW / 2, Math.PI, 0);
            ctx.lineTo(this.x + winW / 2, wY + winH / 2);
            ctx.closePath();
            ctx.stroke();
            
            // Inner purple glow
            ctx.fillStyle = 'rgba(180, 80, 255, 0.35)';
            ctx.fillRect(this.x - winW / 2 + 1, wY - winH / 2 + 1, winW - 2, winH - 2);
        });
        
        // Tower roof (conical)
        const roofHeight = size * 0.2;
        ctx.fillStyle = '#4B0082';
        ctx.strokeStyle = '#2E0A4F';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(this.x, towerY - roofHeight);
        ctx.lineTo(this.x - towerRadius * 1.2, towerY);
        ctx.lineTo(this.x + towerRadius * 1.2, towerY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Roof tile lines
        for (let i = 1; i < 4; i++) {
            const tileY = towerY - roofHeight * (i / 4);
            const tileWidth = towerRadius * 1.2 * (1 - i / 5);
            ctx.strokeStyle = '#2E0A4F';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x - tileWidth, tileY);
            ctx.lineTo(this.x + tileWidth, tileY);
            ctx.stroke();
        }

        // Ridge highlight on the sunlit slope, and a soft glow at the eave where the
        // roof meets the tower body, tying the two pieces together visually.
        ctx.strokeStyle = 'rgba(200, 170, 255, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(this.x, towerY - roofHeight);
        ctx.lineTo(this.x - towerRadius * 1.1, towerY - roofHeight * 0.08);
        ctx.stroke();

        const eaveGlow = ctx.createRadialGradient(this.x, towerY, 0, this.x, towerY, towerRadius * 1.6);
        eaveGlow.addColorStop(0, 'rgba(75, 0, 130, 0.35)');
        eaveGlow.addColorStop(1, 'rgba(75, 0, 130, 0)');
        ctx.fillStyle = eaveGlow;
        ctx.beginPath();
        ctx.ellipse(this.x, towerY, towerRadius * 1.6, towerRadius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    /** Strategy B piece: the pulsing magical orb at the tower's peak - animationTime-driven, not bakeable. Recomputes the same tower geometry as renderCentralTowerStatic() above. */
    renderCentralTowerDynamic(ctx, size) {
        const towerHeight = size * 0.5;
        const towerY = this.y - towerHeight;
        const roofHeight = size * 0.2;

        const orbPulse = Math.sin(this.animationTime * 3) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(138, 43, 226, ${orbPulse})`;
        ctx.beginPath();
        ctx.arc(this.x, towerY - roofHeight, 6, 0, Math.PI * 2);
        ctx.fill();

        const orbGlow = ctx.createRadialGradient(this.x, towerY - roofHeight, 0, this.x, towerY - roofHeight, 15);
        orbGlow.addColorStop(0, `rgba(138, 43, 226, ${orbPulse * 0.5})`);
        orbGlow.addColorStop(1, 'rgba(138, 43, 226, 0)');
        ctx.fillStyle = orbGlow;
        ctx.beginPath();
        ctx.arc(this.x, towerY - roofHeight, 15, 0, Math.PI * 2);
        ctx.fill();
    }

    /** Strategy A piece: spire body, windows, cap - fully static (window glow is a fixed color, not animationTime-driven). */
    renderSideSpiresStatic(ctx, size) {
        const spirePositions = [
            { x: this.x - 30, y: this.y, height: size * 0.35 },
            { x: this.x + 30, y: this.y, height: size * 0.35 }
        ];
        const beltY = this._wallBeltY(size);

        spirePositions.forEach(spire => {
            const spireRadius = size * 0.08;

            this._drawTowerShell(ctx, {
                cx: spire.x,
                baseY: spire.y,
                height: spire.height,
                radiusTop: spireRadius,
                radiusBottom: spireRadius * 1.4,
                courseCount: 5,
                collarY: beltY,
                palette: {
                    light: '#9370DB', mid: '#6A5ACD', dark: '#483D8B',
                    outline: '#2E0A4F', mortar: '#3E2B6D'
                }
            });

            // Short parapet stub connecting the spire to the shared belt line, hinting
            // at a walkway linking it back to the central tower so it reads as part of
            // one structure rather than a separate piece floating beside it.
            const inward = Math.sign(this.x - spire.x) || 1;
            const stubLen = 14;
            const stubH = 3.5;
            const stubRectX = Math.min(spire.x + spireRadius * inward, spire.x + spireRadius * inward + stubLen * inward);
            const stubGrad = ctx.createLinearGradient(stubRectX, beltY - stubH / 2, stubRectX + stubLen, beltY + stubH / 2);
            stubGrad.addColorStop(0, '#8a8060');
            stubGrad.addColorStop(1, '#5c5540');
            ctx.fillStyle = stubGrad;
            ctx.fillRect(stubRectX, beltY - stubH / 2, stubLen, stubH);
            ctx.strokeStyle = '#2E0A4F';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(stubRectX, beltY - stubH / 2, stubLen, stubH);

            // Spire windows with glow
            for (let i = 0; i < 3; i++) {
                const windowY = spire.y - spire.height * (0.2 + i * 0.3);
                
                // Window glow (magical)
                const windowGlow = ctx.createRadialGradient(spire.x, windowY, 0, spire.x, windowY, 6);
                windowGlow.addColorStop(0, 'rgba(138, 43, 226, 0.6)');
                windowGlow.addColorStop(1, 'rgba(138, 43, 226, 0)');
                ctx.fillStyle = windowGlow;
                ctx.beginPath();
                ctx.arc(spire.x, windowY, 6, 0, Math.PI * 2);
                ctx.fill();
                
                // Window frame
                ctx.fillStyle = '#1C1C1C';
                ctx.beginPath();
                ctx.arc(spire.x, windowY, 2.5, 0, Math.PI * 2);
                ctx.fill();
                
                // Window shine
                ctx.fillStyle = 'rgba(200, 100, 255, 0.5)';
                ctx.beginPath();
                ctx.arc(spire.x - 0.5, windowY - 0.5, 1, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Spire cap with more detail
            const capHeight = size * 0.12;
            const capGradient = ctx.createLinearGradient(spire.x - spireRadius * 1.2, spire.y - spire.height - capHeight, spire.x + spireRadius * 1.2, spire.y - spire.height);
            capGradient.addColorStop(0, '#5B3A9D');
            capGradient.addColorStop(1, '#3D2673');
            
            ctx.fillStyle = capGradient;
            ctx.beginPath();
            ctx.moveTo(spire.x, spire.y - spire.height - capHeight);
            ctx.lineTo(spire.x - spireRadius * 1.2, spire.y - spire.height);
            ctx.lineTo(spire.x + spireRadius * 1.2, spire.y - spire.height);
            ctx.closePath();
            ctx.fill();
            
            // Cap outline
            ctx.strokeStyle = '#2E0A4F';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Cap ridge detail
            ctx.strokeStyle = '#7A4FBB';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(spire.x, spire.y - spire.height - capHeight);
            ctx.lineTo(spire.x, spire.y - spire.height);
            ctx.stroke();
        });
    }

    /** Strategy B piece: spire crystals with pulsing glow - animationTime-driven, not bakeable. Recomputes the same spire geometry as renderSideSpiresStatic() above. */
    renderSideSpiresDynamic(ctx, size) {
        const spirePositions = [
            { x: this.x - 30, y: this.y, height: size * 0.35 },
            { x: this.x + 30, y: this.y, height: size * 0.35 }
        ];

        spirePositions.forEach(spire => {
            const capHeight = size * 0.12;
            const crystalPulse = Math.sin(this.animationTime * 4 + spire.x) * 0.3 + 0.7;

            const crystalGlow = ctx.createRadialGradient(spire.x, spire.y - spire.height - capHeight, 0, spire.x, spire.y - spire.height - capHeight, 10);
            crystalGlow.addColorStop(0, `rgba(138, 43, 226, ${crystalPulse * 0.4})`);
            crystalGlow.addColorStop(1, 'rgba(138, 43, 226, 0)');
            ctx.fillStyle = crystalGlow;
            ctx.beginPath();
            ctx.arc(spire.x, spire.y - spire.height - capHeight, 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = `rgba(200, 100, 255, ${crystalPulse})`;
            ctx.beginPath();
            ctx.arc(spire.x, spire.y - spire.height - capHeight, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = `rgba(255, 150, 255, ${crystalPulse * 0.7})`;
            ctx.beginPath();
            ctx.arc(spire.x - 1, spire.y - spire.height - capHeight - 1, 1.5, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    renderFortressDetails(ctx, size) {
        // Flags/banners removed
    }
    
    renderMagicEffects(ctx, size) {
        // Render elemental magic particles
        this.magicParticles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            let color;
            
            switch(particle.element) {
                case 'fire':
                    color = `rgba(255, 69, 0, ${alpha})`;
                    break;
                case 'ice':
                    color = `rgba(173, 216, 230, ${alpha})`;
                    break;
                case 'lightning':
                    color = `rgba(255, 255, 0, ${alpha})`;
                    break;
                case 'earth':
                    color = `rgba(139, 69, 19, ${alpha})`;
                    break;
            }
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Particle glow
            const glowGradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size * 3);
            glowGradient.addColorStop(0, color);
            glowGradient.addColorStop(1, color.replace(/[\d.]+\)/, '0)'));
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    onClick() {
        this.isSelected = true;
        
        const result = {
            type: 'academy_menu',
            academy: this,
            upgrades: this.getElementalUpgradeOptions()
        };
        
        return result;
    }
    
    getElementalUpgradeOptions() {
        const options = [];
        
        // New: Add academy building upgrades first
        if (this.academyLevel < this.maxAcademyLevel) {
            options.push(this.getAcademyUpgradeOption());
        }
        
        // Add elemental upgrades
        options.push(
            {
                id: 'fire',
                name: 'Fire Mastery',
                description: `Increase Magic Tower fire damage by ${this.elementalUpgrades.fire.damageBonus} per level`,
                level: this.elementalUpgrades.fire.level,
                maxLevel: this.elementalUpgrades.fire.maxLevel,
                cost: this.calculateElementalCost('fire'),
                icon: '▲',
                gemType: 'fire'
            },
            {
                id: 'water',
                name: 'Water Mastery', 
                description: `Increase Magic Tower water slow effect by ${(this.elementalUpgrades.water.slowBonus * 100).toFixed(0)}% per level`,
                level: this.elementalUpgrades.water.level,
                maxLevel: this.elementalUpgrades.water.maxLevel,
                cost: this.calculateElementalCost('water'),
                icon: '▼',
                gemType: 'water'
            },
            {
                id: 'air',
                name: 'Air Mastery',
                description: `Increase Magic Tower air chain range by ${this.elementalUpgrades.air.chainRange}px per level`,
                level: this.elementalUpgrades.air.level,
                maxLevel: this.elementalUpgrades.air.maxLevel,
                cost: this.calculateElementalCost('air'),
                icon: '▷',
                gemType: 'air'
            },
            {
                id: 'earth',
                name: 'Earth Mastery',
                description: `Increase Magic Tower earth armor piercing by ${this.elementalUpgrades.earth.armorPiercing} per level`,
                level: this.elementalUpgrades.earth.level,
                maxLevel: this.elementalUpgrades.earth.maxLevel,
                cost: this.calculateElementalCost('earth'),
                icon: '◀',
                gemType: 'earth',
                color: '#8B6F47'
            }
        );
        
        // Note: Gem mining is automatically unlocked at Academy Level 1
        
        return options;
    }
    
    // Get academy upgrade option
    getAcademyUpgradeOption() {
        const nextLevel = this.academyLevel + 1;
        let description = '';
        let nextUnlock = '';
        let cost = 0;
        
        const isMaxed = this.academyLevel >= this.maxAcademyLevel;
        
        if (isMaxed) {
            return {
                id: 'academy_upgrade',
                name: `Academy Level ${this.academyLevel} - MAXED`,
                description: 'Maximum academy power achieved!',
                nextUnlock: 'MAX LEVEL - All features unlocked!\nMagic Tower Upgrades Available\nSuper Weapon Lab Buildable',
                level: this.academyLevel,
                maxLevel: this.maxAcademyLevel,
                cost: null,
                icon: '◈',
                isAcademyUpgrade: true
            };
        }
        
        switch(nextLevel) {
            case 2:
                description = 'Unlock Magic Tower Upgrades to strengthen Magic Towers with gems.';
                nextUnlock = 'Unlocks: Magic Tower Upgrades (cost elemental gems)';
                cost = 1000;
                break;
            case 3:
                description = 'Achieve maximum academy power to unlock Super Weapon Lab construction with diamond resources.';
                nextUnlock = 'Unlocks: Super Weapon Lab building (costs diamonds + gold)';
                cost = 2000;
                break;
        }
        
        return {
            id: 'academy_upgrade',
            name: `Academy Level ${nextLevel}`,
            description: description,
            nextUnlock: nextUnlock,
            level: this.academyLevel,
            maxLevel: this.maxAcademyLevel,
            cost: cost,
            icon: '◈',
            isAcademyUpgrade: true
        };
    }
    
    // Purchase academy upgrade
    purchaseAcademyUpgrade(gameState) {
        if (this.academyLevel >= this.maxAcademyLevel) {
            return false;
        }
        
        const upgradeOption = this.getAcademyUpgradeOption();
        const cost = upgradeOption.cost;
        
        if (!gameState.canAfford(cost)) {
            return false;
        }
        
        gameState.spend(cost);
        this.academyLevel++;
        
        // Apply unlocks based on new level
        switch(this.academyLevel) {
            case 2:
                // Level 2: Magic Tower upgrades become available
                break;
            case 3:
                // Level 3: Super Weapon Lab becomes buildable
                this.superWeaponUnlocked = true;
                break;
        }
        
        return true;
    }
    
    calculateElementalCost(element) {
        const upgrade = this.elementalUpgrades[element];
        if (upgrade.level >= upgrade.maxLevel) return null;
        
        // Progressive cost: 1, 3, 7, 15, 30
        const costs = [1, 3, 7, 15, 30];
        return costs[upgrade.level] || null;
    }
    
    purchaseElementalUpgrade(element, gameState) {
        // Handle regular elemental upgrades
        const upgrade = this.elementalUpgrades[element];
        const cost = this.calculateElementalCost(element);
        
        if (!cost || upgrade.level >= upgrade.maxLevel) {
            return false;
        }
        
        // Check if player has enough gems
        if (this.gems[element] < cost) {
            return false;
        }
        
        this.gems[element] -= cost;
        upgrade.level++;
        
        return true;
    }
    
    // New: Add diamond gem
    addDiamond() {
        this.gems.diamond++;
    }
    
    // Modified: Method to research gem mining tools
    researchGemMiningTools(gameState) {
        if (this.gemMiningResearched || !gameState.canAfford(500)) {
            return false;
        }
        
        if (gameState.spend(500)) {
            this.gemMiningResearched = true;
            return true;
        }
        return false;
    }
    
    // New: Method to add gems (called by mines)
    addGem(gemType) {
        if (this.gems.hasOwnProperty(gemType)) {
            this.gems[gemType]++;
        }
    }
    
    deselect() {
        this.isSelected = false;
    }
    
    applyEffect(buildingManager) {
        // Academy provides elemental research
        buildingManager.elementalBonuses = this.getElementalBonuses();
    }
    
    getElementalBonuses() {
        return {
            fire: {
                damageBonus: this.elementalUpgrades.fire.level * this.elementalUpgrades.fire.damageBonus
            },
            water: {
                slowBonus: this.elementalUpgrades.water.level * this.elementalUpgrades.water.slowBonus
            },
            air: {
                chainRange: this.elementalUpgrades.air.level * this.elementalUpgrades.air.chainRange
            },
            earth: {
                armorPiercing: this.elementalUpgrades.earth.level * this.elementalUpgrades.earth.armorPiercing
            }
        };
    }
    
    static getInfo() {
        return {
            name: 'Magic Academy',
            description: 'Magical fortress that unlocks Magic Towers and provides elemental upgrades.',
            effect: 'Unlocks Magic Tower + Elemental Upgrades',
            size: '4x4',
            cost: 250
        };
    }
    
    // New: Method to unlock academy features
    unlockAcademyFeature(feature) {
        switch(feature) {
            case 'combinationSpells':
                this.combinationSpellsUnlocked = true;
                break;
            case 'diamondMining':
                this.diamondMiningUnlocked = true;
                break;
            case 'superWeapon':
                this.superWeaponUnlocked = true;
                break;
            default:
                return false;
        }
        
        return true;
    }
}
