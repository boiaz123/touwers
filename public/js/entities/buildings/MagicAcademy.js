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
            // Spawn at a random angle, random fraction between inner and outer radii
            const angle = Math.random() * Math.PI * 2;
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
        // In-game only: soft ground patch marks the occupied 4×4 footprint.
        // ctx.buildingManager is only set by BuildingManager.renderBuilding (in-game),
        // so settlement rendering is unaffected.
        if (ctx && ctx.buildingManager) {
            this.renderGroundFootprint(ctx, size);
        }

        // All layers render naturally — tower tops and trees extend beyond the
        // placement square just like towers do, no clip applied.
        this.renderWaterMoat(ctx, size);
        this.renderPavementPlaza(ctx, size);
        this.renderTrees(ctx, size);
        this.renderBushes(ctx, size);
        this.renderCobblestoneBase(ctx, size);
        this.renderSideSpires(ctx, size);
        this.renderCentralTower(ctx, size);
        this.renderMagicEffects(ctx, size);
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

    renderPavementPlaza(ctx, size) {
        // Cobblestone bridge / paved approach in front of the moat entrance
        // This sits at ground level (this.y) and extends slightly forward
        const wallHeight = size * 0.32;
        const baseTop    = this.y - wallHeight;

        // Bridge slab spanning the moat — slightly wider than the gate
        const bridgeW = size * 0.28;
        const bridgeH = size * 0.18;
        const bridgeX = this.x - bridgeW / 2;
        const bridgeY = this.y;   // ground line

        // Stone bridge surface
        const bridgeGrad = ctx.createLinearGradient(bridgeX, bridgeY, bridgeX, bridgeY + bridgeH);
        bridgeGrad.addColorStop(0, '#9a9080');
        bridgeGrad.addColorStop(1, '#7a7060');
        ctx.fillStyle = bridgeGrad;
        ctx.fillRect(bridgeX, bridgeY, bridgeW, bridgeH);

        // Flagstone joints on the bridge deck
        ctx.strokeStyle = '#5a5040';
        ctx.lineWidth = 0.8;
        // Horizontal joints
        for (let r = 1; r < 3; r++) {
            ctx.beginPath();
            ctx.moveTo(bridgeX, bridgeY + (bridgeH / 3) * r);
            ctx.lineTo(bridgeX + bridgeW, bridgeY + (bridgeH / 3) * r);
            ctx.stroke();
        }
        // Vertical joints (alternating offset)
        const colW = bridgeW / 3;
        for (let row = 0; row < 3; row++) {
            const offset = (row % 2) * colW * 0.5;
            for (let c = 1; c < 4; c++) {
                const jx = bridgeX + offset + c * colW;
                if (jx > bridgeX && jx < bridgeX + bridgeW) {
                    ctx.beginPath();
                    ctx.moveTo(jx, bridgeY + (bridgeH / 3) * row);
                    ctx.lineTo(jx, bridgeY + (bridgeH / 3) * (row + 1));
                    ctx.stroke();
                }
            }
        }

        // Bridge stone side rail / edging
        ctx.fillStyle = '#888070';
        ctx.fillRect(bridgeX - 3, bridgeY, 4, bridgeH);
        ctx.fillRect(bridgeX + bridgeW - 1, bridgeY, 4, bridgeH);

        // Fade edge
        const fadeGrad = ctx.createLinearGradient(0, bridgeY + bridgeH, 0, bridgeY + bridgeH + 5);
        fadeGrad.addColorStop(0, 'rgba(0,0,0,0.15)');
        fadeGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = fadeGrad;
        ctx.fillRect(bridgeX, bridgeY + bridgeH, bridgeW, 5);
    }

    renderWaterMoat(ctx, size) {
        // Perspective-flattened moat ring surrounding the fortress base.
        // An elliptical donut drawn using the even-odd winding rule.
        const cx = this.x;
        const cy = this.y - size * 0.10;  // slightly above ground plane
        const outerRX = size * 0.50;
        const outerRY = size * 0.21;  // flattened for top-down perspective
        const innerRX = size * 0.26;
        const innerRY = size * 0.11;

        // Outer ground shadow under the moat
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.beginPath();
        ctx.ellipse(cx + 4, cy + 4, outerRX, outerRY, 0, 0, Math.PI * 2);
        ctx.fill();

        // Moat bank / stone rim (slightly larger than outer water)
        ctx.fillStyle = '#8a8060';
        ctx.beginPath();
        ctx.ellipse(cx, cy, outerRX + 4, outerRY + 2, 0, 0, Math.PI * 2);
        ctx.ellipse(cx, cy, innerRX - 3, innerRY - 1.5, 0, 0, Math.PI * 2, true);
        ctx.fill('evenodd');

        // Water fill (gradient outer→inner)
        const waterGrad = ctx.createRadialGradient(
            cx - outerRX * 0.2, cy - outerRY * 0.3, innerRX * 0.4,
            cx, cy, outerRX
        );
        waterGrad.addColorStop(0, 'rgba(80, 170, 230, 0.92)');
        waterGrad.addColorStop(0.4, 'rgba(40, 120, 200, 0.88)');
        waterGrad.addColorStop(0.75, 'rgba(20, 80, 160, 0.92)');
        waterGrad.addColorStop(1,   'rgba(10, 50, 120, 0.95)');
        ctx.fillStyle = waterGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, outerRX, outerRY, 0, 0, Math.PI * 2);
        ctx.ellipse(cx, cy, innerRX, innerRY, 0, 0, Math.PI * 2, true);
        ctx.fill('evenodd');

        // Surface shimmer
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2 + this.animationTime * 0.4;
            const t = 0.35 + (i % 3) * 0.22;  // spread between inner and outer
            const sx = cx + Math.cos(angle) * (innerRX + (outerRX - innerRX) * t);
            const sy = cy + Math.sin(angle) * (innerRY + (outerRY - innerRY) * t);
            const alpha = (Math.sin(this.animationTime * 2.8 + i * 0.9) + 1) * 0.12;
            ctx.fillStyle = `rgba(180, 220, 255, ${alpha})`;
            ctx.beginPath();
            ctx.ellipse(sx, sy, 4, 1.8, 0, 0, Math.PI * 2);
            ctx.fill();
        }

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
    
    renderTrees(ctx, size) {
        // Scale tree positions and sizes relative to the nominal design size of 128
        const sf = size / 128;
        // Render trees naturally - fortress will cover lower portions
        this.trees.forEach((tree, index) => {
            const treeX = this.x + tree.x * sf;
            const treeY = this.y + tree.y * sf;
            const scale = tree.size * 40 * sf;
            
            // Tree shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.save();
            ctx.translate(treeX + 3, treeY + 4);
            ctx.scale(1, 0.4);
            ctx.beginPath();
            ctx.arc(0, 0, scale * 0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // Use different tree types based on index for variety
            const treeType = index % 4;
            switch(treeType) {
                case 0:
                    this.renderTreeType1(ctx, treeX, treeY, scale);
                    break;
                case 1:
                    this.renderTreeType2(ctx, treeX, treeY, scale);
                    break;
                case 2:
                    this.renderTreeType3(ctx, treeX, treeY, scale);
                    break;
                default:
                    this.renderTreeType4(ctx, treeX, treeY, scale);
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
    
    renderBushes(ctx, size) {
        const sf = size / 128;
        this.bushes.forEach(bush => {
            ctx.save();
            ctx.translate(this.x + bush.x * sf, this.y + bush.y * sf);
            const bs = bush.size * sf;

            // Bush shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.ellipse(2, 2, bs, bs * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();

            // Bush base
            ctx.fillStyle = '#228B22';
            ctx.beginPath();
            ctx.arc(0, 0, bs, 0, Math.PI * 2);
            ctx.fill();

            // Bush highlights
            ctx.fillStyle = '#32CD32';
            for (let i = 0; i < 3; i++) {
                const angle = (i / 3) * Math.PI * 2;
                const highlightX = Math.cos(angle) * bs * 0.4;
                const highlightY = Math.sin(angle) * bs * 0.4;
                ctx.beginPath();
                ctx.arc(highlightX, highlightY, bs * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        });
    }
    
    renderCobblestoneBase(ctx, size) {
        const baseWidth = size * 0.82;
        const wallHeight = size * 0.32;
        // Base is GROUNDED at this.y — it extends upward from the ground plane
        const baseTop = this.y - wallHeight;
        const baseBottom = this.y;

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
        ctx.fillStyle = '#909090';
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 1;
        for (let i = 0; i < merlonCount; i++) {
            if (i % 2 === 0) {
                const mx = this.x - baseWidth / 2 + i * merlonSpacing + merlonSpacing * 0.1;
                ctx.fillRect(mx, baseTop - merlonH, merlonW, merlonH);
                ctx.strokeRect(mx, baseTop - merlonH, merlonW, merlonH);
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
    
    renderCentralTower(ctx, size) {
        const towerRadius = size * 0.15;
        const towerHeight = size * 0.5;
        const towerY = this.y - towerHeight;
        const towerLeft = this.x - towerRadius;
        const towerRight = this.x + towerRadius;
        
        // Tower gradient (left-lit front face)
        const towerGradient = ctx.createLinearGradient(
            towerLeft, towerY,
            towerRight, this.y
        );
        towerGradient.addColorStop(0, '#B0C4DE');
        towerGradient.addColorStop(0.5, '#708090');
        towerGradient.addColorStop(1, '#2F4F4F');
        
        // Right-side shadow face for depth
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.fillRect(towerRight - 4, towerY, 4, towerHeight);
        
        // Central tower body - rectangle (front view)
        ctx.fillStyle = towerGradient;
        ctx.fillRect(towerLeft, towerY, towerRadius * 2, towerHeight);
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 2;
        ctx.strokeRect(towerLeft, towerY, towerRadius * 2, towerHeight);
        
        // Stone courses (horizontal mortar lines)
        const courseH = towerHeight / 5;
        for (let c = 1; c < 5; c++) {
            const cy = towerY + c * courseH;
            ctx.strokeStyle = '#1C1C1C';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(towerLeft, cy);
            ctx.lineTo(towerRight, cy);
            ctx.stroke();
        }
        // Vertical mortar columns
        const colW = towerRadius * 2 / 3;
        for (let col = 1; col < 3; col++) {
            ctx.strokeStyle = '#1C1C1C';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(towerLeft + col * colW, towerY);
            ctx.lineTo(towerLeft + col * colW, this.y);
            ctx.stroke();
        }
        
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
        
        // Magical orb at top
        const orbPulse = Math.sin(this.animationTime * 3) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(138, 43, 226, ${orbPulse})`;
        ctx.beginPath();
        ctx.arc(this.x, towerY - roofHeight, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Orb glow
        const orbGlow = ctx.createRadialGradient(this.x, towerY - roofHeight, 0, this.x, towerY - roofHeight, 15);
        orbGlow.addColorStop(0, `rgba(138, 43, 226, ${orbPulse * 0.5})`);
        orbGlow.addColorStop(1, 'rgba(138, 43, 226, 0)');
        ctx.fillStyle = orbGlow;
        ctx.beginPath();
        ctx.arc(this.x, towerY - roofHeight, 15, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderSideSpires(ctx, size) {
        const spirePositions = [
            { x: this.x - 30, y: this.y, height: size * 0.35 },
            { x: this.x + 30, y: this.y, height: size * 0.35 }
        ];
        
        spirePositions.forEach(spire => {
            const spireRadius = size * 0.08;
            
            // Spire base
            const spireGradient = ctx.createLinearGradient(
                spire.x - spireRadius, spire.y - spire.height,
                spire.x + spireRadius, spire.y
            );
            spireGradient.addColorStop(0, '#9370DB');
            spireGradient.addColorStop(0.5, '#6A5ACD');
            spireGradient.addColorStop(1, '#483D8B');
            
            ctx.fillStyle = spireGradient;
            ctx.fillRect(spire.x - spireRadius, spire.y - spire.height, spireRadius * 2, spire.height);
            
            ctx.strokeStyle = '#2E0A4F';
            ctx.lineWidth = 1;
            ctx.strokeRect(spire.x - spireRadius, spire.y - spire.height, spireRadius * 2, spire.height);
            
            // Spire stone courses/rings for texture
            for (let i = 0; i < 5; i++) {
                const ringY = spire.y - spire.height + (i * spire.height / 5);
                ctx.strokeStyle = '#3E2B6D';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(spire.x - spireRadius, ringY);
                ctx.lineTo(spire.x + spireRadius, ringY);
                ctx.stroke();
            }
            
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
            
            // Spire crystal with pulsing glow
            const crystalPulse = Math.sin(this.animationTime * 4 + spire.x) * 0.3 + 0.7;
            
            // Crystal glow (larger)
            const crystalGlow = ctx.createRadialGradient(spire.x, spire.y - spire.height - capHeight, 0, spire.x, spire.y - spire.height - capHeight, 10);
            crystalGlow.addColorStop(0, `rgba(138, 43, 226, ${crystalPulse * 0.4})`);
            crystalGlow.addColorStop(1, 'rgba(138, 43, 226, 0)');
            ctx.fillStyle = crystalGlow;
            ctx.beginPath();
            ctx.arc(spire.x, spire.y - spire.height - capHeight, 10, 0, Math.PI * 2);
            ctx.fill();
            
            // Crystal itself
            ctx.fillStyle = `rgba(200, 100, 255, ${crystalPulse})`;
            ctx.beginPath();
            ctx.arc(spire.x, spire.y - spire.height - capHeight, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Crystal highlight
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
