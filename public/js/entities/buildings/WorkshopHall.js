import { Building } from './Building.js';

/**
 * WorkshopHall - the Settlement Hub building that opens the Workshop shop.
 * Only appears once the Commander's Workshop upgrade has been purchased (see
 * SettlementHub._buildSettlementBuildings()). A small stone war-hall - crossed
 * sword-and-shield emblem over the door, a trophy shield rack, a banner pole,
 * torchlight - befitting a commander's strategy room rather than a tradesman's
 * shop. A "war map" is visible through the window as a nod to the Level
 * Designer this building unlocks.
 */
export class WorkshopHall extends Building {
    /** Same shrink-to-fit-the-grid-cell technique as TowerForge/MagicAcademy - see
     *  TowerForge.STRUCTURE_SCALE for the full rationale. */
    static STRUCTURE_SCALE = 0.8;

    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY, 4);
        this.isSelected = false;

        // Ambient embers drifting up from the torch beside the door
        this.embers = [];
        this.nextEmberTime = 0;

        // Torch flicker + banner sway + war-map glow pulse (all cosmetic, driven by animationTime)
        this.torchFlicker = 1;
        this.bannerSway = 0;
        this.mapGlowPulse = 0;

        this.skipCanvas2DBodyRender = false;
    }

    update(deltaTime) {
        super.update(deltaTime);

        this.torchFlicker = 0.82 + Math.sin(this.animationTime * 5) * 0.12 + Math.sin(this.animationTime * 13) * 0.05;
        this.bannerSway = Math.sin(this.animationTime * 1.6) * 0.12;
        this.mapGlowPulse = 0.5 + Math.sin(this.animationTime * 1.4) * 0.5;

        const renderSize = this._lastRenderSize || 128;
        const sizeScale = renderSize / 128;
        const S = WorkshopHall.STRUCTURE_SCALE;

        // Embers rise from the torch beside the door
        this.nextEmberTime -= deltaTime;
        if (this.nextEmberTime <= 0) {
            this.nextEmberTime = 0.18 + Math.random() * 0.22;
            const torchX = -30 * sizeScale;
            const torchY = -4 * sizeScale;
            this.embers.push({
                x: this.x + (torchX + (Math.random() - 0.5) * 4 * sizeScale) * S,
                y: this.y + (torchY + (Math.random() - 0.5) * 3 * sizeScale) * S,
                vx: (Math.random() - 0.5) * 8 * sizeScale,
                vy: (-Math.random() * 26 - 14) * sizeScale,
                life: 0.9,
                maxLife: 0.9,
                size: (Math.random() * 1.1 + 0.5) * sizeScale
            });
        }

        for (let i = this.embers.length - 1; i >= 0; i--) {
            const e = this.embers[i];
            e.x += e.vx * deltaTime;
            e.y += e.vy * deltaTime;
            e.vy -= 10 * deltaTime;
            e.life -= deltaTime;
            if (e.life <= 0) this.embers.splice(i, 1);
        }
    }

    render(ctx, size) {
        this._lastRenderSize = size;

        if (!this.skipCanvas2DBodyRender) {
            this.renderStaticBack(ctx, size);
            this.renderDynamicParts(ctx, size);
        }

        this.renderParticles(ctx);
    }

    /** No front-of-building overlay for this type - present for BuildingRenderAdapter's uniform convention. */
    renderStaticFront(ctx, size) {
        // intentionally empty
    }

    renderStaticBack(ctx, size) {
        const buildingWidth = size * 0.85;
        const buildingHeight = size * 0.56;
        const wallHeight = size * 0.46;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(WorkshopHall.STRUCTURE_SCALE, WorkshopHall.STRUCTURE_SCALE);
        ctx.translate(-this.x, -this.y);

        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(this.x - buildingWidth / 2 + 4, this.y - wallHeight + 4, buildingWidth, wallHeight);

        this.renderStoneWalls(ctx, buildingWidth, buildingHeight, wallHeight);
        this.renderYardProps(ctx, size);
        this.renderDoor(ctx, size, buildingWidth, wallHeight);
        this.renderWindow(ctx, size, buildingWidth, wallHeight);
        this.renderEmblem(ctx, size, wallHeight);
        this.renderRoof(ctx, buildingWidth, buildingHeight, wallHeight);
        this.renderShieldRack(ctx, size);

        ctx.restore();
    }

    renderDynamicParts(ctx, size) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(WorkshopHall.STRUCTURE_SCALE, WorkshopHall.STRUCTURE_SCALE);
        ctx.translate(-this.x, -this.y);

        this.renderTorchGlow(ctx, size);
        this.renderMapGlow(ctx, size);
        this.renderBanner(ctx, size);

        ctx.restore();
    }

    // ---- Static structure ----

    renderYardProps(ctx, size) {
        const s = size / 128;

        // A round shield propped low against the wall's foundation, left of the door
        const shR = 9 * s;
        const shX = this.x - size * 0.34;
        const shY = this.y + size * 0.06;
        ctx.save();
        ctx.translate(shX, shY);
        ctx.rotate(0.18);
        const shieldGrad = ctx.createRadialGradient(-2.4 * s, -2.4 * s, 1, 0, 0, shR);
        shieldGrad.addColorStop(0, '#c0342c');
        shieldGrad.addColorStop(1, '#7a1c18');
        ctx.fillStyle = shieldGrad;
        ctx.beginPath(); ctx.arc(0, 0, shR, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#3a1210'; ctx.lineWidth = 1.2 * s; ctx.stroke();
        ctx.fillStyle = '#d4af37';
        ctx.beginPath(); ctx.arc(0, 0, shR * 0.27, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 0.9 * s;
        ctx.beginPath(); ctx.arc(0, 0, shR * 0.75, -2.4, -1.2); ctx.stroke();
        ctx.restore();

        // Two swords leaning against the wall above the shield, left of the door -
        // echoes the crossed sword-and-shield emblem over the door and the trophy
        // shield rack. Based higher than the shield so the two never overlap: with
        // the shield hugging the foundation, the full blade/crossguard/pommel of
        // each sword stays clear and readable against the stone instead of being
        // hidden behind it.
        const swordX = this.x - size * 0.4;
        const swordBaseY = this.y - size * 0.05;
        const armLen = 30 * s;
        [-7, 6].forEach((dx) => {
            const baseX = swordX + dx * s;
            const tipX = swordX + dx * s * 0.35;
            const tipY = swordBaseY - armLen;
            const angle = Math.atan2(tipX - baseX, swordBaseY - tipY);
            ctx.save();
            ctx.translate(baseX, swordBaseY);
            ctx.rotate(angle);
            // Dark silhouette pass first so the pale blade reads clearly against the
            // similarly-toned stone wall instead of blending into it.
            ctx.fillStyle = 'rgba(20, 18, 16, 0.55)';
            ctx.beginPath();
            ctx.moveTo(0, -armLen - 0.6 * s);
            ctx.lineTo(2.4 * s, -armLen * 0.2);
            ctx.lineTo(-2.4 * s, -armLen * 0.2);
            ctx.closePath();
            ctx.fill();
            const bladeGrad = ctx.createLinearGradient(0, -armLen, 0, 0);
            bladeGrad.addColorStop(0, '#f5f7fb');
            bladeGrad.addColorStop(0.55, '#c7cdd8');
            bladeGrad.addColorStop(1, '#8b909c');
            ctx.fillStyle = bladeGrad;
            ctx.beginPath();
            ctx.moveTo(0, -armLen);
            ctx.lineTo(1.8 * s, -armLen * 0.2);
            ctx.lineTo(-1.8 * s, -armLen * 0.2);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#2a2c32';
            ctx.lineWidth = 0.7 * s;
            ctx.stroke();
            // Crossguard
            ctx.fillStyle = '#d4af37';
            ctx.fillRect(-4.6 * s, -armLen * 0.22, 9.2 * s, 1.8 * s);
            ctx.strokeStyle = '#8a651c'; ctx.lineWidth = 0.5 * s;
            ctx.strokeRect(-4.6 * s, -armLen * 0.22, 9.2 * s, 1.8 * s);
            // Grip + pommel
            ctx.fillStyle = '#4a3018';
            ctx.fillRect(-1.2 * s, -armLen * 0.22 + 1.8 * s, 2.4 * s, 5.8 * s);
            ctx.fillStyle = '#d4af37';
            ctx.beginPath();
            ctx.arc(0, -armLen * 0.22 + 1.8 * s + 5.8 * s + 1.3 * s, 1.5 * s, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Banner pole, right of the door (flag drawn dynamically in renderBanner)
        const poleX = this.x + size * 0.4;
        const poleBaseY = this.y + size * 0.05;
        ctx.strokeStyle = '#4a3018';
        ctx.lineWidth = 2.4 * s;
        ctx.beginPath();
        ctx.moveTo(poleX, poleBaseY);
        ctx.lineTo(poleX, poleBaseY - size * 0.62);
        ctx.stroke();
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.arc(poleX, poleBaseY - size * 0.62, 2.4 * s, 0, Math.PI * 2);
        ctx.fill();
        this._poleTopBounds = { x: poleX, y: poleBaseY - size * 0.62 };

        // Stone rubble/training post base near the pole
        ctx.fillStyle = '#6a6258';
        ctx.beginPath();
        ctx.ellipse(poleX, poleBaseY, 7 * s, 3 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.6; ctx.stroke();
    }

    renderStoneWalls(ctx, buildingWidth, buildingHeight, wallHeight) {
        // Base wall fill
        const wallGrad = ctx.createLinearGradient(
            this.x - buildingWidth / 2, this.y - wallHeight,
            this.x + buildingWidth / 4, this.y
        );
        wallGrad.addColorStop(0, '#8a8478');
        wallGrad.addColorStop(0.5, '#6a655a');
        wallGrad.addColorStop(1, '#4c4840');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(this.x - buildingWidth / 2, this.y - wallHeight, buildingWidth, wallHeight);

        // Cut-stone block pattern with per-block shading (same bevel technique used
        // throughout the settlement's other stone buildings, e.g. TowerForge's walls)
        const leftX = this.x - buildingWidth / 2;
        const stoneW = buildingWidth / 9;
        const stoneH = wallHeight / 7;
        const doorBoundLeft = this.x - buildingWidth * 0.24 - buildingWidth * 0.09;
        const doorBoundRight = this.x - buildingWidth * 0.24 + buildingWidth * 0.09;
        const doorBoundTop = this.y - wallHeight * 0.62;

        // Clip the staggered block grid + mortar seams to the wall rectangle so the
        // row stagger (offsetX) and column overscan (col -1..9) can't overshoot the
        // wall's left/right silhouette with ragged half-blocks.
        ctx.save();
        ctx.beginPath();
        ctx.rect(leftX, this.y - wallHeight, buildingWidth, wallHeight);
        ctx.clip();

        for (let row = 0; row < 7; row++) {
            const offsetX = (row % 2) * stoneW / 2;
            const rowY = this.y - wallHeight + row * stoneH;
            for (let col = -1; col < 10; col++) {
                const stoneX = leftX + offsetX + col * stoneW;
                if (stoneX + stoneW < leftX || stoneX > leftX + buildingWidth) continue;
                // Skip blocks that overlap the doorway
                if (stoneX + stoneW - 1 > doorBoundLeft && stoneX < doorBoundRight && rowY + stoneH - 1 > doorBoundTop) {
                    continue;
                }

                const hashVal = ((row * 11 + col * 7 + 5) % 13) / 13;
                const shade = 0.72 + hashVal * 0.26;
                ctx.fillStyle = `rgb(${Math.floor(138 * shade)}, ${Math.floor(132 * shade)}, ${Math.floor(120 * shade)})`;
                ctx.fillRect(stoneX, rowY, stoneW - 1.5, stoneH - 1.5);

                // Bevel highlight / shadow
                ctx.fillStyle = `rgba(230, 225, 210, ${0.22 * shade})`;
                ctx.fillRect(stoneX, rowY, stoneW - 1.5, stoneH / 4);
                ctx.fillRect(stoneX, rowY, stoneW / 4, stoneH - 1.5);
                ctx.fillStyle = `rgba(0, 0, 0, ${0.30 * shade})`;
                ctx.fillRect(stoneX, rowY + stoneH - 1.5 - stoneH / 4, stoneW - 1.5, stoneH / 4);
                ctx.fillRect(stoneX + stoneW - 1.5 - stoneW / 4, rowY, stoneW / 4, stoneH - 1.5);
            }
        }

        // Dark mortar seams
        ctx.strokeStyle = 'rgba(20,18,14,0.5)';
        ctx.lineWidth = 1;
        for (let row = 0; row <= 7; row++) {
            const rowY = this.y - wallHeight + row * stoneH;
            ctx.beginPath();
            ctx.moveTo(leftX, rowY);
            ctx.lineTo(leftX + buildingWidth, rowY);
            ctx.stroke();
        }

        ctx.restore();

        // Reinforced stone corner pilasters
        const pilasterW = stoneW * 0.6;
        ctx.fillStyle = '#98917f';
        ctx.fillRect(leftX - 2, this.y - wallHeight, pilasterW, wallHeight);
        ctx.fillRect(leftX + buildingWidth - pilasterW + 2, this.y - wallHeight, pilasterW, wallHeight);
        ctx.strokeStyle = 'rgba(20,18,14,0.5)'; ctx.lineWidth = 1;
        for (let row = 0; row < 7; row++) {
            const rowY = this.y - wallHeight + row * stoneH;
            ctx.strokeRect(leftX - 2, rowY, pilasterW, stoneH - 1);
            ctx.strokeRect(leftX + buildingWidth - pilasterW + 2, rowY, pilasterW, stoneH - 1);
        }

        // Foundation plinth
        const plinthHeight = wallHeight * 0.1;
        const plinthGrad = ctx.createLinearGradient(0, this.y - plinthHeight, 0, this.y);
        plinthGrad.addColorStop(0, '#4a4640');
        plinthGrad.addColorStop(1, '#2a2822');
        ctx.fillStyle = plinthGrad;
        ctx.fillRect(leftX - 3, this.y - plinthHeight, buildingWidth + 6, plinthHeight);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(leftX - 3, this.y - plinthHeight, buildingWidth + 6, 2);
    }

    renderDoor(ctx, size, buildingWidth, wallHeight) {
        const doorW = size * 0.18;
        const doorH = wallHeight * 0.62;
        const doorX = this.x - buildingWidth * 0.24 - doorW / 2;
        const doorY = this.y - doorH;

        // Stone archway surround
        ctx.fillStyle = '#5a564c';
        ctx.beginPath();
        ctx.moveTo(doorX - 4, doorY + doorH);
        ctx.lineTo(doorX - 4, doorY - 3);
        ctx.quadraticCurveTo(doorX + doorW / 2, doorY - 12, doorX + doorW + 4, doorY - 3);
        ctx.lineTo(doorX + doorW + 4, doorY + doorH);
        ctx.lineTo(doorX + doorW, doorY + doorH);
        ctx.lineTo(doorX + doorW, doorY);
        ctx.quadraticCurveTo(doorX + doorW / 2, doorY - 7, doorX, doorY);
        ctx.lineTo(doorX, doorY + doorH);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#2a2822'; ctx.lineWidth = 1; ctx.stroke();

        // Heavy iron-bound door
        const doorGrad = ctx.createLinearGradient(doorX, doorY, doorX + doorW, doorY);
        doorGrad.addColorStop(0, '#4a3822');
        doorGrad.addColorStop(0.5, '#5e4a2c');
        doorGrad.addColorStop(1, '#382a18');
        ctx.fillStyle = doorGrad;
        ctx.fillRect(doorX, doorY, doorW, doorH);
        ctx.strokeStyle = '#241a0e';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(doorX, doorY, doorW, doorH);

        // Iron cross-bands with rivets
        ctx.strokeStyle = '#2e2a26';
        ctx.lineWidth = 2.4;
        [0.28, 0.72].forEach(t => {
            ctx.beginPath();
            ctx.moveTo(doorX + 1, doorY + doorH * t);
            ctx.lineTo(doorX + doorW - 1, doorY + doorH * t);
            ctx.stroke();
        });
        ctx.fillStyle = '#8a8478';
        [0.28, 0.72].forEach(t => {
            [0.15, 0.5, 0.85].forEach(dx => {
                ctx.beginPath();
                ctx.arc(doorX + doorW * dx, doorY + doorH * t, 1.1, 0, Math.PI * 2);
                ctx.fill();
            });
        });

        // Door slightly ajar - warm interior torchlight sliver
        ctx.fillStyle = 'rgba(255, 170, 90, 0.35)';
        ctx.fillRect(doorX + doorW - 3, doorY + 2, 3, doorH - 4);

        // Ring handle
        ctx.strokeStyle = '#8a8478';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(doorX + doorW * 0.2, doorY + doorH * 0.55, 2.2, 0, Math.PI * 2);
        ctx.stroke();
    }

    renderWindow(ctx, size, buildingWidth, wallHeight) {
        const winW = size * 0.17;
        const winH = size * 0.13;
        const winX = this.x + buildingWidth * 0.14;
        const winY = this.y - wallHeight * 0.72;

        // Stone frame
        ctx.fillStyle = '#5a564c';
        ctx.fillRect(winX - 2.5, winY - 2.5, winW + 5, winH + 5);
        ctx.strokeStyle = '#2a2822'; ctx.lineWidth = 1; ctx.strokeRect(winX - 2.5, winY - 2.5, winW + 5, winH + 5);

        // Glass with warm interior light
        const glassGrad = ctx.createLinearGradient(winX, winY, winX, winY + winH);
        glassGrad.addColorStop(0, 'rgba(255, 200, 130, 0.5)');
        glassGrad.addColorStop(1, 'rgba(110, 70, 30, 0.5)');
        ctx.fillStyle = glassGrad;
        ctx.fillRect(winX, winY, winW, winH);

        // War map visible through the glass: a small grid + winding path + tower dot,
        // a nod to the Level Designer this building unlocks via the Strategy Table.
        ctx.save();
        ctx.beginPath();
        ctx.rect(winX, winY, winW, winH);
        ctx.clip();
        ctx.fillStyle = 'rgba(224, 210, 178, 0.85)';
        ctx.fillRect(winX + winW * 0.15, winY + winH * 0.12, winW * 0.7, winH * 0.76);
        ctx.strokeStyle = 'rgba(120, 90, 50, 0.5)';
        ctx.lineWidth = 0.5;
        for (let gx = 0; gx <= 3; gx++) {
            const lx = winX + winW * 0.15 + (winW * 0.7 / 3) * gx;
            ctx.beginPath();
            ctx.moveTo(lx, winY + winH * 0.12);
            ctx.lineTo(lx, winY + winH * 0.88);
            ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(180, 40, 30, 0.8)';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(winX + winW * 0.2, winY + winH * 0.78);
        ctx.lineTo(winX + winW * 0.45, winY + winH * 0.45);
        ctx.lineTo(winX + winW * 0.75, winY + winH * 0.55);
        ctx.stroke();
        ctx.fillStyle = 'rgba(160, 30, 20, 0.85)';
        ctx.beginPath();
        ctx.arc(winX + winW * 0.75, winY + winH * 0.55, winH * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Mullion cross
        ctx.strokeStyle = '#2a2822';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(winX + winW / 2, winY);
        ctx.lineTo(winX + winW / 2, winY + winH);
        ctx.moveTo(winX, winY + winH / 2);
        ctx.lineTo(winX + winW, winY + winH / 2);
        ctx.stroke();

        this._windowGlowBounds = { x: winX + winW / 2, y: winY + winH / 2, w: winW, h: winH };
    }

    renderEmblem(ctx, size, wallHeight) {
        // Crossed sword and axe mounted on a stone plaque above the door
        const plaqueW = size * 0.22;
        const plaqueH = size * 0.14;
        const plaqueX = this.x - plaqueW / 2;
        const plaqueY = this.y - wallHeight - plaqueH - 2;

        const plaqueGrad = ctx.createLinearGradient(plaqueX, plaqueY, plaqueX, plaqueY + plaqueH);
        plaqueGrad.addColorStop(0, '#6a655a');
        plaqueGrad.addColorStop(1, '#403c34');
        ctx.fillStyle = plaqueGrad;
        ctx.fillRect(plaqueX, plaqueY, plaqueW, plaqueH);
        ctx.strokeStyle = '#241f18';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(plaqueX, plaqueY, plaqueW, plaqueH);

        const cx = plaqueX + plaqueW / 2;
        const cy = plaqueY + plaqueH / 2;
        const armLen = plaqueH * 0.34;

        const drawSword = (angle) => {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle);
            const bladeGrad = ctx.createLinearGradient(0, -armLen, 0, armLen * 0.5);
            bladeGrad.addColorStop(0, '#e8ecf2'); bladeGrad.addColorStop(0.5, '#aab0bc'); bladeGrad.addColorStop(1, '#707684');
            ctx.fillStyle = bladeGrad;
            ctx.beginPath();
            ctx.moveTo(0, -armLen);
            ctx.lineTo(plaqueH * 0.045, -armLen * 0.2);
            ctx.lineTo(-plaqueH * 0.045, -armLen * 0.2);
            ctx.closePath();
            ctx.fill();
            ctx.fillRect(-plaqueH * 0.035, -armLen * 0.2, plaqueH * 0.07, armLen * 0.7);
            ctx.strokeStyle = '#40444c'; ctx.lineWidth = 0.6; ctx.stroke();
            // Crossguard + gold pommel
            ctx.fillStyle = '#d4af37';
            ctx.fillRect(-plaqueH * 0.12, -armLen * 0.24, plaqueH * 0.24, plaqueH * 0.045);
            ctx.beginPath();
            ctx.arc(0, armLen * 0.5, plaqueH * 0.045, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        };
        drawSword(-0.55);
        drawSword(0.55);

        // Central gold boss
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.arc(cx, cy, plaqueH * 0.09, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8a651c'; ctx.lineWidth = 1; ctx.stroke();

        // Nameplate below the emblem
        ctx.font = `bold ${Math.round(plaqueH * 0.24)}px serif`;
        ctx.fillStyle = '#e8dcc0';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('WORKSHOP', cx, plaqueY + plaqueH + plaqueH * 0.22);
    }

    renderRoof(ctx, buildingWidth, buildingHeight, wallHeight) {
        const roofPeakX = this.x;
        const roofPeakY = this.y - wallHeight - buildingHeight * 0.42;
        const roofOverhang = buildingWidth * 0.06;
        const leftEaveX = this.x - buildingWidth / 2 - roofOverhang;
        const rightEaveX = this.x + buildingWidth / 2 + roofOverhang;
        const eaveY = this.y - wallHeight;

        // Roof underside shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(leftEaveX, eaveY, rightEaveX - leftEaveX, 4);

        // Slate roof plane
        const roofGrad = ctx.createLinearGradient(0, roofPeakY, 0, eaveY);
        roofGrad.addColorStop(0, '#4a4650');
        roofGrad.addColorStop(1, '#2a2830');
        ctx.fillStyle = roofGrad;
        ctx.beginPath();
        ctx.moveTo(roofPeakX, roofPeakY);
        ctx.lineTo(rightEaveX, eaveY);
        ctx.lineTo(leftEaveX, eaveY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#18161c';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Slate tile rows
        ctx.strokeStyle = 'rgba(10,10,14,0.4)';
        ctx.lineWidth = 0.7;
        const rows = 6;
        for (let r = 1; r < rows; r++) {
            const t = r / rows;
            const y = roofPeakY + (eaveY - roofPeakY) * t;
            const xL = roofPeakX + (leftEaveX - roofPeakX) * t;
            const xR = roofPeakX + (rightEaveX - roofPeakX) * t;
            ctx.beginPath();
            ctx.moveTo(xL, y);
            ctx.lineTo(xR, y);
            ctx.stroke();
        }

        // Ridge highlight
        ctx.strokeStyle = 'rgba(200,200,220,0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(roofPeakX, roofPeakY);
        ctx.lineTo(roofPeakX, roofPeakY + 6);
        ctx.stroke();
    }

    renderShieldRack(ctx, size) {
        // Two small trophy shields mounted on the wall above the yard shield, a nod to
        // this being a hall of proven battles rather than a workshop of tools.
        const s = size / 128;
        const rackX = this.x - size * 0.30;
        const rackY = this.y - size * 0.30;
        [[-9, '#4a6ea0'], [9, '#5a8a48']].forEach(([dx, color]) => {
            ctx.save();
            ctx.translate(rackX + dx * s, rackY);
            const grad = ctx.createRadialGradient(-1.5 * s, -1.5 * s, 0.5, 0, 0, 6 * s);
            grad.addColorStop(0, color);
            grad.addColorStop(1, '#241a14');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(0, 0, 6 * s, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#1a140e'; ctx.lineWidth = 0.8 * s; ctx.stroke();
            ctx.fillStyle = '#d4af37';
            ctx.beginPath(); ctx.arc(0, 0, 1.6 * s, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        });
    }

    // ---- Dynamic (per-frame) parts ----

    renderTorchGlow(ctx, size) {
        const torchX = this.x - size * 0.24 - size * 0.09 - size * 0.06;
        const torchY = this.y - size * 0.46 * 0.62 * 0.5 - size * 0.02;
        const x = this.x - size * 0.4, y = this.y - size * 0.02;
        const r = size * 0.13 * this.torchFlicker;
        // Position is fixed but the radius itself flickers, so this can't be reduced to a
        // pure globalAlpha multiply on a fixed-shape gradient like the other glows fixed
        // this session - bucketing the flicker value still cuts the rebuild rate sharply
        // (imperceptible visually below ~1/24 of the flicker range) instead of rebuilding
        // a GPU-backed gradient every single frame regardless of whether it moved enough
        // to matter.
        const flickerBucket = Math.round(this.torchFlicker * 24);
        if (!this._torchGlowGrad || this._torchGlowGradCtx !== ctx || this._torchGlowGradBucket !== flickerBucket) {
            this._torchGlowGradCtx = ctx;
            this._torchGlowGradBucket = flickerBucket;
            this._torchGlowGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
            this._torchGlowGrad.addColorStop(0, `rgba(255, 150, 60, ${0.3 * this.torchFlicker})`);
            this._torchGlowGrad.addColorStop(1, 'rgba(255, 150, 60, 0)');
        }
        ctx.fillStyle = this._torchGlowGrad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    renderMapGlow(ctx, size) {
        if (!this._windowGlowBounds) return;
        const { x, y, w } = this._windowGlowBounds;
        const r = w * (0.75 + this.mapGlowPulse * 0.2);
        // Same reasoning as renderTorchGlow's bucketed cache above - radius pulses with
        // mapGlowPulse, so it's bucketed rather than rebuilt every frame.
        const pulseBucket = Math.round(this.mapGlowPulse * 24);
        if (!this._mapGlowGrad || this._mapGlowGradCtx !== ctx || this._mapGlowGradBucket !== pulseBucket) {
            this._mapGlowGradCtx = ctx;
            this._mapGlowGradBucket = pulseBucket;
            this._mapGlowGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
            this._mapGlowGrad.addColorStop(0, `rgba(220, 170, 100, ${0.22 + this.mapGlowPulse * 0.1})`);
            this._mapGlowGrad.addColorStop(1, 'rgba(220, 170, 100, 0)');
        }
        ctx.fillStyle = this._mapGlowGrad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    renderBanner(ctx, size) {
        if (!this._poleTopBounds) return;
        const s = size / 128;
        const { x, y } = this._poleTopBounds;
        const flagW = 16 * s, flagH = 11 * s;
        const sway = this.bannerSway;

        ctx.save();
        ctx.translate(x, y + 2 * s);
        // Fully static colors and a fixed translate (pole position never moves) - cached
        // and reused forever instead of rebuilt every frame, same reasoning as the fully
        // static gradients fixed elsewhere this session.
        if (!this._bannerGrad || this._bannerGradFlagW !== flagW || this._bannerGradCtx !== ctx) {
            this._bannerGradFlagW = flagW;
            this._bannerGradCtx = ctx;
            this._bannerGrad = ctx.createLinearGradient(0, 0, flagW, 0);
            this._bannerGrad.addColorStop(0, '#a83028');
            this._bannerGrad.addColorStop(1, '#7a1e18');
        }
        ctx.fillStyle = this._bannerGrad;
        ctx.beginPath();
        ctx.moveTo(0, -flagH / 2);
        ctx.lineTo(flagW * (1 + sway * 0.3), -flagH / 2 + sway * 3 * s);
        ctx.lineTo(flagW * (0.82 + sway * 0.3), 0 + sway * 1.5 * s);
        ctx.lineTo(flagW * (1 + sway * 0.3), flagH / 2 + sway * 3 * s);
        ctx.lineTo(0, flagH / 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#3a1210';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Small gold emblem on the banner
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.arc(flagW * 0.42, 0, flagH * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // ---- World-space particles ----

    renderParticles(ctx) {
        for (const e of this.embers) {
            const alpha = Math.max(0, e.life / e.maxLife);
            ctx.fillStyle = `rgba(255, 140, 50, ${alpha * 0.85})`;
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
