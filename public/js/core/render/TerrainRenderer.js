/**
 * Shared terrain/vegetation/rock/water rendering, extracted from LevelBase.js
 * so both real gameplay (LevelBase) and the level designer's preview canvas
 * (LevelDesigner) draw terrain via the exact same code — no more risk of the
 * designer's preview silently drifting from what a level actually looks like
 * once played. Every function here is a pure function of its explicit
 * arguments (ctx + coordinates/size/variant, plus `campaign` where the visual
 * depends on campaign theme) — no hidden instance state.
 */

export function renderVegetation(ctx, x, y, size, gridX, gridY, variant, campaign) {
        switch (campaign) {
            case 'desert':
                renderDesertVegetation(ctx, x, y, size, gridX, gridY, variant);
                break;
            case 'mountain':
                renderMountainVegetation(ctx, x, y, size, gridX, gridY, variant);
                break;
            case 'space':
                renderSpaceVegetation(ctx, x, y, size, gridX, gridY, variant);
                break;
            case 'forest':
            default:
                renderTree(ctx, x, y, size, gridX, gridY, variant);
                break;
        }
    }

export function renderDesertVegetation(ctx, x, y, size, gridX, gridY, variant) {
        const scaledSize = size * 1.3;
        const seed = (variant !== undefined && variant !== null) ? variant % 6 : Math.floor(gridX * 0.5 + gridY * 0.7) % 6;
        switch(seed) {
            case 0: renderCactusSaguaro(ctx, x, y, scaledSize); break;
            case 1: renderDryDesertShrub(ctx, x, y, scaledSize); break;
            case 2: renderCactusPricklyPear(ctx, x, y, scaledSize); break;
            case 3: renderDesertTree(ctx, x, y, scaledSize); break;
            case 4: renderCactusCholla(ctx, x, y, scaledSize); break;
            default: renderDesertBush(ctx, x, y, scaledSize); break;
        }
    }

export function renderCactusSaguaro(ctx, x, y, size) {
        const h = size * 0.70;
        const w = size * 0.15;
        // Ground shadow
        ctx.fillStyle = 'rgba(60,40,10,0.28)';
        ctx.beginPath();
        ctx.ellipse(x, y + 1, w * 1.8, size * 0.07, 0, 0, Math.PI * 2);
        ctx.fill();
        // Left arm (drawn first, behind trunk)
        ctx.fillStyle = '#5a7850';
        ctx.beginPath();
        ctx.moveTo(x - w * 0.8, y - h * 0.38);
        ctx.quadraticCurveTo(x - w * 3.0, y - h * 0.44, x - w * 3.0, y - h * 0.65);
        ctx.quadraticCurveTo(x - w * 3.0, y - h * 0.76, x - w * 2.3, y - h * 0.76);
        ctx.quadraticCurveTo(x - w * 1.6, y - h * 0.76, x - w * 1.5, y - h * 0.62);
        ctx.quadraticCurveTo(x - w * 1.4, y - h * 0.50, x - w * 0.6, y - h * 0.34);
        ctx.closePath();
        ctx.fill();
        // Left arm shadow
        ctx.fillStyle = '#3a5034';
        ctx.beginPath();
        ctx.moveTo(x - w * 1.6, y - h * 0.62);
        ctx.quadraticCurveTo(x - w * 2.2, y - h * 0.70, x - w * 3.0, y - h * 0.65);
        ctx.quadraticCurveTo(x - w * 3.0, y - h * 0.76, x - w * 2.3, y - h * 0.76);
        ctx.quadraticCurveTo(x - w * 1.9, y - h * 0.76, x - w * 1.7, y - h * 0.68);
        ctx.closePath();
        ctx.fill();
        // Right arm
        ctx.fillStyle = '#5a7850';
        ctx.beginPath();
        ctx.moveTo(x + w * 0.8, y - h * 0.50);
        ctx.quadraticCurveTo(x + w * 2.8, y - h * 0.54, x + w * 2.8, y - h * 0.74);
        ctx.quadraticCurveTo(x + w * 2.8, y - h * 0.84, x + w * 2.1, y - h * 0.84);
        ctx.quadraticCurveTo(x + w * 1.5, y - h * 0.84, x + w * 1.4, y - h * 0.72);
        ctx.quadraticCurveTo(x + w * 1.3, y - h * 0.60, x + w * 0.6, y - h * 0.46);
        ctx.closePath();
        ctx.fill();
        // Right arm shadow
        ctx.fillStyle = '#3a5034';
        ctx.beginPath();
        ctx.moveTo(x + w * 1.5, y - h * 0.72);
        ctx.quadraticCurveTo(x + w * 2.1, y - h * 0.80, x + w * 2.8, y - h * 0.74);
        ctx.quadraticCurveTo(x + w * 2.8, y - h * 0.84, x + w * 2.1, y - h * 0.84);
        ctx.quadraticCurveTo(x + w * 1.7, y - h * 0.84, x + w * 1.5, y - h * 0.76);
        ctx.closePath();
        ctx.fill();
        // Main trunk
        ctx.fillStyle = '#5a7850';
        ctx.beginPath();
        ctx.moveTo(x - w, y);
        ctx.lineTo(x - w * 0.9, y - h);
        ctx.quadraticCurveTo(x, y - h * 1.04, x + w * 0.9, y - h);
        ctx.lineTo(x + w, y);
        ctx.closePath();
        ctx.fill();
        // Trunk shadow side
        ctx.fillStyle = '#3a5034';
        ctx.beginPath();
        ctx.moveTo(x + w * 0.12, y);
        ctx.lineTo(x + w * 0.12, y - h * 0.96);
        ctx.quadraticCurveTo(x + w * 0.52, y - h * 1.01, x + w * 0.9, y - h);
        ctx.lineTo(x + w, y);
        ctx.closePath();
        ctx.fill();
        // Rib lines
        ctx.strokeStyle = 'rgba(20,40,10,0.35)';
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(x - w * 0.50, y); ctx.lineTo(x - w * 0.46, y - h * 0.98); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + w * 0.50, y); ctx.lineTo(x + w * 0.46, y - h * 0.98); ctx.stroke();
        // Spine areoles — evenly spaced along trunk edges, arm tips
        ctx.fillStyle = '#d4c484';
        ctx.beginPath(); ctx.arc(x - w * 1.05, y - h * 0.08, 1.0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + w * 1.05, y - h * 0.08, 1.0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x - w * 1.05, y - h * 0.22, 1.0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + w * 1.05, y - h * 0.22, 1.0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x - w * 1.05, y - h * 0.40, 1.0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + w * 1.05, y - h * 0.40, 1.0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x - w * 2.65, y - h * 0.76, 1.0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + w * 2.45, y - h * 0.84, 1.0, 0, Math.PI * 2); ctx.fill();
    }

export function renderDryDesertShrub(ctx, x, y, size) {
        // Spreading dry desert shrub — thin S-curve branches, thorns, dried seed heads
        const baseY = y - size * 0.02;
        // Ground shadow
        ctx.fillStyle = 'rgba(50,32,8,0.20)';
        ctx.beginPath();
        ctx.ellipse(x, y + 1, size * 0.30, size * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineCap = 'round';
        const brS = (x1, y1, cpx, cpy, x2, y2, w, col) => {
            ctx.strokeStyle = col; ctx.lineWidth = w;
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cpx, cpy, x2, y2); ctx.stroke();
        };
        const brC = (x1, y1, cpx1, cpy1, mx, my, cpx2, cpy2, x2, y2, w, col) => {
            ctx.strokeStyle = col; ctx.lineWidth = w;
            ctx.beginPath(); ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo(cpx1, cpy1, mx, my);
            ctx.quadraticCurveTo(cpx2, cpy2, x2, y2); ctx.stroke();
        };
        const thorns = (tx, ty, r, cnt, col) => {
            ctx.strokeStyle = col; ctx.lineWidth = 0.5;
            for (let i = 0; i < cnt; i++) {
                const a = (i / cnt) * Math.PI * 2;
                ctx.beginPath(); ctx.moveTo(tx, ty);
                ctx.lineTo(tx + Math.cos(a) * r, ty + Math.sin(a) * r); ctx.stroke();
            }
        };
        const seedHead = (fx, fy, r) => {
            ctx.fillStyle = '#7a5820';
            ctx.beginPath(); ctx.arc(fx, fy, r * 0.50, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#c09848'; ctx.lineWidth = 0.55;
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(fx + Math.cos(a) * r * 0.50, fy + Math.sin(a) * r * 0.50);
                ctx.lineTo(fx + Math.cos(a) * r * 1.3, fy + Math.sin(a) * r * 1.3);
                ctx.stroke();
            }
        };
        // 5 main S-curve branches — thin, fanning out from base
        brC(x, baseY, x-size*0.10, baseY-size*0.06, x-size*0.20, baseY-size*0.10, x-size*0.24, baseY-size*0.18, x-size*0.28, baseY-size*0.16, size*0.040, '#7a6040');
        brC(x, baseY, x-size*0.04, baseY-size*0.10, x-size*0.06, baseY-size*0.18, x-size*0.02, baseY-size*0.26, x-size*0.10, baseY-size*0.28, size*0.038, '#7a6040');
        brC(x, baseY, x+size*0.02, baseY-size*0.12, x+size*0.01, baseY-size*0.20, x+size*0.05, baseY-size*0.28, x+size*0.00, baseY-size*0.32, size*0.036, '#7a6040');
        brC(x, baseY, x+size*0.08, baseY-size*0.10, x+size*0.14, baseY-size*0.18, x+size*0.18, baseY-size*0.24, x+size*0.16, baseY-size*0.28, size*0.037, '#7a6040');
        brC(x, baseY, x+size*0.14, baseY-size*0.06, x+size*0.22, baseY-size*0.12, x+size*0.26, baseY-size*0.16, x+size*0.28, baseY-size*0.15, size*0.039, '#7a6040');
        // Sub-branches
        brS(x-size*0.22, baseY-size*0.12, x-size*0.28, baseY-size*0.17, x-size*0.34, baseY-size*0.19, size*0.023, '#9a7850');
        brS(x-size*0.08, baseY-size*0.20, x-size*0.13, baseY-size*0.26, x-size*0.16, baseY-size*0.30, size*0.021, '#9a7850');
        brS(x+size*0.02, baseY-size*0.24, x-size*0.02, baseY-size*0.30, x-size*0.04, baseY-size*0.34, size*0.020, '#9a7850');
        brS(x+size*0.14, baseY-size*0.20, x+size*0.18, baseY-size*0.26, x+size*0.21, baseY-size*0.29, size*0.021, '#9a7850');
        brS(x+size*0.24, baseY-size*0.12, x+size*0.30, baseY-size*0.17, x+size*0.33, baseY-size*0.19, size*0.022, '#9a7850');
        // Fine twigs
        brS(x-size*0.32, baseY-size*0.17, x-size*0.35, baseY-size*0.23, x-size*0.37, baseY-size*0.25, size*0.012, '#b8986a');
        brS(x-size*0.14, baseY-size*0.27, x-size*0.18, baseY-size*0.33, x-size*0.20, baseY-size*0.36, size*0.011, '#b8986a');
        brS(x+size*0.20, baseY-size*0.26, x+size*0.23, baseY-size*0.32, x+size*0.24, baseY-size*0.35, size*0.011, '#b8986a');
        brS(x+size*0.31, baseY-size*0.17, x+size*0.35, baseY-size*0.22, x+size*0.36, baseY-size*0.24, size*0.012, '#b8986a');
        // Thorn clusters at branch midpoints
        thorns(x-size*0.20, baseY-size*0.12, size*0.022, 5, '#c8a868');
        thorns(x+size*0.22, baseY-size*0.11, size*0.020, 5, '#c8a868');
        thorns(x-size*0.06, baseY-size*0.20, size*0.018, 4, '#c8a868');
        // Dry seed heads at branch tips
        seedHead(x-size*0.28, baseY-size*0.17, size*0.024);
        seedHead(x-size*0.04, baseY-size*0.33, size*0.022);
        seedHead(x+size*0.21, baseY-size*0.29, size*0.022);
        // Tiny woody base — just a subtle point, no heavy blob
        ctx.fillStyle = '#4e3018';
        ctx.beginPath();
        ctx.arc(x, baseY, size * 0.018, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineCap = 'butt';
    }

export function renderCactusPricklyPear(ctx, x, y, size) {
        const padW = size * 0.22;
        const padH = size * 0.34;
        const renderPad = (px, py, rot, sc) => {
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(rot);
            // Muted blue-green like real Opuntia
            ctx.fillStyle = '#5a7a6a';
            ctx.beginPath();
            ctx.moveTo(0, -padH * sc * 0.5);
            ctx.quadraticCurveTo(padW * sc * 0.40, -padH * sc * 0.30, padW * sc * 0.42, 0);
            ctx.quadraticCurveTo(padW * sc * 0.32, padH * sc * 0.42, 0, padH * sc * 0.52);
            ctx.quadraticCurveTo(-padW * sc * 0.32, padH * sc * 0.42, -padW * sc * 0.42, 0);
            ctx.quadraticCurveTo(-padW * sc * 0.40, -padH * sc * 0.30, 0, -padH * sc * 0.5);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#3a5248';
            ctx.beginPath();
            ctx.moveTo(0, -padH * sc * 0.5);
            ctx.quadraticCurveTo(padW * sc * 0.40, -padH * sc * 0.30, padW * sc * 0.42, 0);
            ctx.quadraticCurveTo(padW * sc * 0.32, padH * sc * 0.42, padW * sc * 0.10, padH * sc * 0.52);
            ctx.quadraticCurveTo(padW * sc * 0.05, padH * sc * 0.20, 0, -padH * sc * 0.5);
            ctx.closePath();
            ctx.fill();
            // Spine areoles
            ctx.fillStyle = '#d4c484';
            const sp = [{x:0,y:-padH*sc*0.32},{x:padW*sc*0.24,y:-padH*sc*0.06},{x:-padW*sc*0.24,y:-padH*sc*0.06},{x:padW*sc*0.18,y:padH*sc*0.22},{x:-padW*sc*0.18,y:padH*sc*0.22},{x:0,y:padH*sc*0.38}];
            sp.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, 1.0, 0, Math.PI*2); ctx.fill(); });
            ctx.restore();
        };
        // Ground shadow
        ctx.fillStyle = 'rgba(60,40,10,0.22)';
        ctx.beginPath();
        ctx.ellipse(x, y + 2, padW * 1.10, padH * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        renderPad(x, y - padH * 0.22, 0, 0.52);
        renderPad(x + padW * 0.44, y - padH * 0.10, Math.PI / 4.2, 0.46);
        renderPad(x - padW * 0.44, y + padH * 0.06, -Math.PI / 4.8, 0.46);
        renderPad(x, y + padH * 0.30, Math.PI / 9, 0.48);
    }

export function renderDesertTree(ctx, x, y, size) {
        // Gnarled leafless desert dead tree — dry and slender, bleached bone colouring
        const h = size * 0.80;
        const tw = size * 0.050; // slim trunk unit
        // Ground shadow — asymmetric cast
        ctx.fillStyle = 'rgba(60,40,10,0.24)';
        ctx.beginPath();
        ctx.ellipse(x + size*0.03, y + 1, tw * 2.2, size * 0.07, 0, 0, Math.PI * 2);
        ctx.fill();
        // Root flare — subtle ground spread
        ctx.fillStyle = '#3e2412';
        ctx.beginPath();
        ctx.moveTo(x - tw * 1.8, y);
        ctx.quadraticCurveTo(x - tw * 1.2, y - h * 0.06, x - tw * 0.9, y - h * 0.12);
        ctx.lineTo(x + tw * 0.9, y - h * 0.12);
        ctx.quadraticCurveTo(x + tw * 1.2, y - h * 0.06, x + tw * 1.6, y);
        ctx.closePath();
        ctx.fill();
        // Main trunk — S-curve lean, slim polygon
        ctx.fillStyle = '#3e2412';
        ctx.beginPath();
        ctx.moveTo(x - tw, y - h * 0.12);
        ctx.quadraticCurveTo(x - tw * 1.12, y - h * 0.30, x - tw * 0.88, y - h * 0.46);
        ctx.quadraticCurveTo(x - tw * 0.74, y - h * 0.54, x - tw * 0.92, y - h * 0.58);
        ctx.lineTo(x + tw * 0.92, y - h * 0.58);
        ctx.quadraticCurveTo(x + tw * 1.08, y - h * 0.48, x + tw * 0.96, y - h * 0.34);
        ctx.quadraticCurveTo(x + tw * 1.14, y - h * 0.22, x + tw, y - h * 0.12);
        ctx.closePath();
        ctx.fill();
        // Trunk highlight
        ctx.fillStyle = '#624030';
        ctx.beginPath();
        ctx.moveTo(x - tw, y - h * 0.12);
        ctx.quadraticCurveTo(x - tw * 0.98, y - h * 0.32, x - tw * 0.82, y - h * 0.54);
        ctx.lineTo(x - tw * 0.24, y - h * 0.54);
        ctx.quadraticCurveTo(x - tw * 0.38, y - h * 0.30, x - tw * 0.36, y - h * 0.12);
        ctx.closePath();
        ctx.fill();
        // Bark texture striations
        ctx.strokeStyle = 'rgba(20,10,4,0.28)';
        ctx.lineWidth = 0.55;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x+tw*0.26, y-h*0.14); ctx.quadraticCurveTo(x+tw*0.30, y-h*0.36, x+tw*0.18, y-h*0.52); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x-tw*0.50, y-h*0.15); ctx.quadraticCurveTo(x-tw*0.58, y-h*0.34, x-tw*0.44, y-h*0.50); ctx.stroke();
        ctx.strokeStyle = '#3e2412';
        // Left major branch — double-curve sweep
        ctx.lineWidth = tw * 1.18;
        ctx.beginPath();
        ctx.moveTo(x - tw * 0.18, y - h * 0.56);
        ctx.quadraticCurveTo(x - tw * 2.4, y - h * 0.58, x - tw * 3.4, y - h * 0.64);
        ctx.quadraticCurveTo(x - tw * 4.0, y - h * 0.68, x - tw * 4.4, y - h * 0.80);
        ctx.stroke();
        // Right major branch
        ctx.lineWidth = tw * 1.02;
        ctx.beginPath();
        ctx.moveTo(x + tw * 0.18, y - h * 0.56);
        ctx.quadraticCurveTo(x + tw * 2.5, y - h * 0.58, x + tw * 3.5, y - h * 0.70);
        ctx.stroke();
        // Center branch — slight double curve
        ctx.lineWidth = tw * 0.90;
        ctx.beginPath();
        ctx.moveTo(x, y - h * 0.58);
        ctx.quadraticCurveTo(x + tw * 0.28, y - h * 0.68, x + tw * 0.06, y - h * 0.78);
        ctx.quadraticCurveTo(x - tw * 0.18, y - h * 0.86, x - tw * 0.08, y - h * 0.90);
        ctx.stroke();
        // Small extra branch mid-trunk for asymmetry
        ctx.lineWidth = tw * 0.64;
        ctx.beginPath();
        ctx.moveTo(x + tw * 0.80, y - h * 0.37);
        ctx.quadraticCurveTo(x + tw * 1.7, y - h * 0.37, x + tw * 2.5, y - h * 0.45);
        ctx.stroke();
        ctx.lineWidth = tw * 0.42;
        ctx.beginPath(); ctx.moveTo(x+tw*2.5, y-h*0.45); ctx.quadraticCurveTo(x+tw*2.7, y-h*0.51, x+tw*2.8, y-h*0.57); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x+tw*2.5, y-h*0.45); ctx.quadraticCurveTo(x+tw*2.8, y-h*0.43, x+tw*2.9, y-h*0.39); ctx.stroke();
        // Sub-branches left
        ctx.lineWidth = tw * 0.68;
        ctx.beginPath();
        ctx.moveTo(x - tw * 1.9, y - h * 0.63);
        ctx.quadraticCurveTo(x - tw * 2.5, y - h * 0.74, x - tw * 3.2, y - h * 0.88);
        ctx.stroke();
        ctx.lineWidth = tw * 0.48;
        ctx.beginPath(); ctx.moveTo(x-tw*3.2, y-h*0.88); ctx.quadraticCurveTo(x-tw*2.9, y-h*0.96, x-tw*2.6, y-h*1.02); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x-tw*3.2, y-h*0.88); ctx.quadraticCurveTo(x-tw*3.5, y-h*0.96, x-tw*3.8, y-h*1.00); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x-tw*4.4, y-h*0.80); ctx.quadraticCurveTo(x-tw*4.6, y-h*0.87, x-tw*4.8, y-h*0.92); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x-tw*4.4, y-h*0.80); ctx.quadraticCurveTo(x-tw*4.6, y-h*0.76, x-tw*4.7, y-h*0.73); ctx.stroke();
        // Sub-branches right
        ctx.lineWidth = tw * 0.68;
        ctx.beginPath();
        ctx.moveTo(x + tw * 1.74, y - h * 0.63);
        ctx.quadraticCurveTo(x + tw * 2.3, y - h * 0.72, x + tw * 2.8, y - h * 0.86);
        ctx.stroke();
        ctx.lineWidth = tw * 0.48;
        ctx.beginPath(); ctx.moveTo(x+tw*2.8, y-h*0.86); ctx.quadraticCurveTo(x+tw*2.5, y-h*0.93, x+tw*2.3, y-h*0.98); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x+tw*2.8, y-h*0.86); ctx.quadraticCurveTo(x+tw*3.1, y-h*0.93, x+tw*3.4, y-h*0.97); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x+tw*3.5, y-h*0.70); ctx.quadraticCurveTo(x+tw*3.7, y-h*0.78, x+tw*3.9, y-h*0.84); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x+tw*3.5, y-h*0.70); ctx.quadraticCurveTo(x+tw*3.7, y-h*0.66, x+tw*3.9, y-h*0.64); ctx.stroke();
        // Center sub-branches
        ctx.lineWidth = tw * 0.48;
        ctx.beginPath(); ctx.moveTo(x-tw*0.08, y-h*0.90); ctx.quadraticCurveTo(x-tw*0.50, y-h*0.96, x-tw*0.82, y-h*1.02); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x-tw*0.08, y-h*0.90); ctx.quadraticCurveTo(x+tw*0.36, y-h*0.96, x+tw*0.54, y-h*1.01); ctx.stroke();
        ctx.lineCap = 'butt';
    }

export function renderCactusCholla(ctx, x, y, size) {
        // Cholla — silvery gray-sage with organic curved branches
        const mh = size * 0.50;
        const mw = size * 0.11;
        // Ground shadow
        ctx.fillStyle = 'rgba(60,40,10,0.22)';
        ctx.beginPath();
        ctx.ellipse(x, y + 1, mw * 1.6, size * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();
        // Main stem tapered
        ctx.fillStyle = '#7a8c68';
        ctx.beginPath();
        ctx.moveTo(x - mw, y);
        ctx.lineTo(x - mw * 0.85, y - mh);
        ctx.quadraticCurveTo(x, y - mh * 1.02, x + mw * 0.85, y - mh);
        ctx.lineTo(x + mw, y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#4c5c42';
        ctx.beginPath();
        ctx.moveTo(x + mw * 0.15, y);
        ctx.lineTo(x + mw * 0.15, y - mh * 0.96);
        ctx.quadraticCurveTo(x + mw * 0.55, y - mh * 1.0, x + mw * 0.85, y - mh);
        ctx.lineTo(x + mw, y);
        ctx.closePath();
        ctx.fill();
        // Organic curved branches using quadraticCurveTo
        const drawBranch = (ox, oy, cp1x, cp1y, ep1x, ep1y, bw) => {
            ctx.fillStyle = '#7a8c68';
            ctx.beginPath();
            ctx.moveTo(ox, oy);
            ctx.quadraticCurveTo(cp1x, cp1y, ep1x, ep1y);
            ctx.quadraticCurveTo(cp1x + bw, cp1y, ox + bw, oy);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#4c5c42';
            ctx.beginPath();
            ctx.moveTo(ep1x - bw * 0.4, ep1y + bw * 0.3);
            ctx.quadraticCurveTo(cp1x + bw * 0.2, cp1y + bw * 0.3, ox + bw, oy);
            ctx.quadraticCurveTo(cp1x + bw, cp1y, ep1x, ep1y);
            ctx.closePath();
            ctx.fill();
        };
        drawBranch(x - mw * 0.6, y - mh * 0.64, x - mw * 1.8, y - mh * 0.72, x - mw * 2.4, y - mh * 0.52, mw * 0.8);
        drawBranch(x + mw * 0.6, y - mh * 0.56, x + mw * 1.8, y - mh * 0.64, x + mw * 2.2, y - mh * 0.44, mw * 0.8);
        drawBranch(x - mw * 0.4, y - mh * 0.24, x - mw * 1.4, y - mh * 0.28, x - mw * 1.8, y - mh * 0.14, mw * 0.75);
        // Dense spine grid on stem — silvery tips characteristic of cholla
        ctx.fillStyle = '#e0d0a0';
        for (let i = 0; i < 5; i++) {
            const py = y - mh * 0.10 - i * mh * 0.18;
            ctx.beginPath(); ctx.arc(x - mw * 1.10, py, 1.1, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(x + mw * 1.10, py, 1.1, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(x, py - mh * 0.04, 0.9, 0, Math.PI * 2); ctx.fill();
        }
    }

export function renderDesertBush(ctx, x, y, size) {
        // Dry desert saltbush — rounded mass with visible thorny branches and dried flowers
        const radius = size * 0.28;
        const cy = y - radius * 0.62;
        // Ground shadow
        ctx.fillStyle = 'rgba(60,40,10,0.24)';
        ctx.beginPath();
        ctx.ellipse(x, y + 2, radius * 1.02, radius * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineCap = 'round';
        // Interior woody stems visible behind the mass
        ctx.strokeStyle = '#5a3c20';
        ctx.lineWidth = size * 0.052;
        ctx.beginPath(); ctx.moveTo(x - radius*0.36, y); ctx.quadraticCurveTo(x - radius*0.22, cy + radius*0.30, x - radius*0.14, cy); ctx.stroke();
        ctx.lineWidth = size * 0.048;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + radius*0.06, cy + radius*0.20, x + radius*0.02, cy - radius*0.06); ctx.stroke();
        ctx.lineWidth = size * 0.050;
        ctx.beginPath(); ctx.moveTo(x + radius*0.34, y); ctx.quadraticCurveTo(x + radius*0.22, cy + radius*0.28, x + radius*0.12, cy); ctx.stroke();
        // Main bush mass — organic lumpy silhouette
        ctx.fillStyle = '#8c6638';
        ctx.beginPath();
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const v = Math.sin(angle * 3 + 0.4) * 0.16 + Math.cos(angle * 5) * 0.08 + Math.sin(angle * 7) * 0.04;
            const r = radius * (0.84 + v);
            const px = x + Math.cos(angle) * r;
            const py = cy + Math.sin(angle) * r * 0.74;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        // Darker inner shadow layer
        ctx.fillStyle = '#5e3e20';
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const v = Math.sin(angle * 4) * 0.06;
            const r = radius * (0.42 + v);
            const px = x + Math.cos(angle) * r;
            const py = cy + Math.sin(angle) * r * 0.74;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        // Thorns poking out through the silhouette edge
        ctx.strokeStyle = '#d4a858';
        ctx.lineWidth = 0.7;
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2 + 0.31;
            const v = Math.sin(angle * 3 + 0.4) * 0.16 + Math.cos(angle * 5) * 0.08;
            const rBase = radius * (0.84 + v);
            const rTip = rBase + size * 0.028;
            const bx = x + Math.cos(angle) * rBase;
            const by = cy + Math.sin(angle) * rBase * 0.74;
            const tx = x + Math.cos(angle) * rTip;
            const ty = cy + Math.sin(angle) * rTip * 0.74;
            ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
        }
        // Highlight on upper surface
        ctx.fillStyle = '#b09060';
        ctx.beginPath();
        ctx.ellipse(x - radius*0.12, cy - radius*0.38, radius*0.28, radius*0.16, -0.26, 0, Math.PI * 2);
        ctx.fill();
        // Dry seed heads on protruding twig tips
        const seedHead = (fx, fy, r) => {
            ctx.fillStyle = '#7a5820';
            ctx.beginPath(); ctx.arc(fx, fy, r * 0.55, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#c09848'; ctx.lineWidth = 0.65;
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(fx + Math.cos(a) * r * 0.55, fy + Math.sin(a) * r * 0.55);
                ctx.lineTo(fx + Math.cos(a) * r * 1.4, fy + Math.sin(a) * r * 1.4);
                ctx.stroke();
            }
        };
        seedHead(x - radius*0.22, cy - radius*0.64, size * 0.024);
        seedHead(x + radius*0.12, cy - radius*0.70, size * 0.022);
        seedHead(x - radius*0.02, cy - radius*0.76, size * 0.026);
        ctx.lineCap = 'butt';
    }

export function renderMountainVegetation(ctx, x, y, size, gridX, gridY, variant) {
        const scaledSize = size;
        const seed = (variant !== undefined && variant !== null) ? variant % 4 : Math.floor(gridX * 0.5 + gridY * 0.7) % 4;
        // Ground shadow — cold dark tint under mountain pine
        // Per-seed shadow Y matches Campaign2: type3 (seed=2) has shorter trunk so shadow is closer
        const shadowY = seed === 2 ? scaledSize * 0.33 : scaledSize * 0.43;
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = '#05080f';
        ctx.beginPath();
        ctx.ellipse(x + scaledSize * 0.06, y + shadowY, scaledSize * 0.38, scaledSize * 0.09, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        switch(seed) {
            case 0:
                renderMountainPineType1(ctx, x, y, scaledSize);
                break;
            case 1:
                renderMountainPineType2(ctx, x, y, scaledSize);
                break;
            case 2:
                renderMountainPineType3(ctx, x, y, scaledSize);
                break;
            case 3:
                renderMountainPineType4(ctx, x, y, scaledSize);
                break;
        }
    }

export function renderSpaceVegetation(ctx, x, y, size, gridX, gridY, variant) {
        const seed = (variant !== undefined && variant !== null) ? variant % 6 : Math.floor(gridX * 0.5 + gridY * 0.7) % 6;
        const scaledSize = size;
        switch(seed) {
            case 0:
                renderSpaceVortexPlant(ctx, x, y, scaledSize);
                break;
            case 1:
                renderSpaceSpikeCoral(ctx, x, y, scaledSize);
                break;
            case 2:
                renderSpaceFractalGrowth(ctx, x, y, scaledSize);
                break;
            case 3:
                renderSpaceBiolumPlant(ctx, x, y, scaledSize);
                break;
            case 4:
                renderSpaceAlienMushroom(ctx, x, y, scaledSize);
                break;
            default:
                renderSpaceCrystalOrganism(ctx, x, y, scaledSize);
        }
    }

export function renderSpaceVortexPlant(ctx, x, y, size) {
        // Swirling vortex-like alien plant
        ctx.fillStyle = '#4a6a9a';
        
        // Spiral body
        const spirals = 3;
        for (let layer = 0; layer < spirals; layer++) {
            const radius = size * (0.08 + layer * 0.08);
            ctx.beginPath();
            for (let i = 0; i < 50; i++) {
                const angle = (i / 50) * Math.PI * 2 + layer * Math.PI / 2;
                const dist = radius * (i / 50);
                const px = x + Math.cos(angle) * dist;
                const py = y + Math.sin(angle) * dist;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.strokeStyle = `rgba(100, 150, 255, ${0.6 - layer * 0.15})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Center glow
        ctx.fillStyle = 'rgba(200, 100, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
    }

export function renderSpaceSpikeCoral(ctx, x, y, size) {
        // Spike coral formation
        ctx.fillStyle = '#5a7aaa';
        
        // Main body cluster
        const spikeCount = 8;
        for (let i = 0; i < spikeCount; i++) {
            const angle = (i / spikeCount) * Math.PI * 2;
            const baseX = x + Math.cos(angle) * size * 0.08;
            const baseY = y + Math.sin(angle) * size * 0.08;
            const tipX = x + Math.cos(angle) * size * 0.25;
            const tipY = y + Math.sin(angle) * size * 0.25;
            
            // Spike
            ctx.strokeStyle = `rgba(${100 + Math.cos(angle) * 50}, ${150}, ${200 + Math.sin(angle) * 50}, 0.9)`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(baseX, baseY);
            ctx.quadraticCurveTo(
                (baseX + tipX) * 0.5 + Math.cos(angle + Math.PI/2) * size * 0.05,
                (baseY + tipY) * 0.5 + Math.sin(angle + Math.PI/2) * size * 0.05,
                tipX, tipY
            );
            ctx.stroke();
        }

        // Center sphere
        ctx.fillStyle = '#8aaacc';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }

export function renderSpaceFractalGrowth(ctx, x, y, size) {
        // Fractal branching alien structure
        const drawFractal = (cx, cy, length, angle, depth) => {
            if (depth === 0) return;
            
            const endX = cx + Math.cos(angle) * length;
            const endY = cy + Math.sin(angle) * length;
            
            ctx.strokeStyle = `rgba(${100 + depth * 30}, ${150 + depth * 20}, ${255 - depth * 30}, ${0.7 - depth * 0.1})`;
            ctx.lineWidth = Math.max(1, 3 - depth);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // Branch left and right
            drawFractal(endX, endY, length * 0.7, angle - Math.PI / 5, depth - 1);
            drawFractal(endX, endY, length * 0.7, angle + Math.PI / 5, depth - 1);
        };

        // Draw three main branches
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            drawFractal(x, y, size * 0.15, angle, 3);
        }

        // Core
        ctx.fillStyle = '#aabbdd';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.05, 0, Math.PI * 2);
        ctx.fill();
    }

export function renderSpaceBiolumPlant(ctx, x, y, size) {
        // Bioluminescent branching organism
        ctx.fillStyle = '#3a7a9a';
        
        // Main body
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radius = size * (0.15 + Math.sin(i * 0.8) * 0.08);
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Bioluminescent tendrils
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const startX = x + Math.cos(angle) * size * 0.13;
            const startY = y + Math.sin(angle) * size * 0.13;
            
            ctx.strokeStyle = `rgba(100, ${200 + Math.sin(angle) * 50}, 255, 0.8)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            
            // Wavy tendril
            for (let j = 0; j < 5; j++) {
                const progress = (j + 1) / 5;
                const offsetX = Math.cos(angle) * size * 0.2 * progress;
                const offsetY = Math.sin(angle) * size * 0.2 * progress;
                const wiggleX = Math.sin(angle + j) * size * 0.05;
                const wiggleY = Math.cos(angle + j) * size * 0.05;
                ctx.lineTo(startX + offsetX + wiggleX, startY + offsetY + wiggleY);
            }
            ctx.stroke();
        }

        // Intense core glow
        ctx.fillStyle = 'rgba(150, 200, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.12, 0, Math.PI * 2);
        ctx.fill();
    }

export function renderSpaceAlienMushroom(ctx, x, y, size) {
        // Impossible geometry alien mushroom
        // Cap with inverted perspective
        ctx.fillStyle = '#6a5aaa';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.18, y - size * 0.08);
        ctx.bezierCurveTo(
            x - size * 0.18, y - size * 0.18,
            x + size * 0.18, y - size * 0.18,
            x + size * 0.18, y - size * 0.08
        );
        ctx.lineTo(x + size * 0.1, y + size * 0.08);
        ctx.lineTo(x - size * 0.1, y + size * 0.08);
        ctx.closePath();
        ctx.fill();

        // Inverted inner surface (different color)
        ctx.fillStyle = '#4a3aaa';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.14, y - size * 0.05);
        ctx.bezierCurveTo(
            x - size * 0.14, y - size * 0.12,
            x + size * 0.14, y - size * 0.12,
            x + size * 0.14, y - size * 0.05
        );
        ctx.lineTo(x + size * 0.08, y + size * 0.04);
        ctx.lineTo(x - size * 0.08, y + size * 0.04);
        ctx.closePath();
        ctx.fill();

        // Stem
        ctx.fillStyle = '#5a6aaa';
        ctx.fillRect(x - size * 0.06, y + size * 0.08, size * 0.12, size * 0.16);

        // Bioluminescent gill-like structures
        ctx.strokeStyle = 'rgba(200, 100, 255, 0.6)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const py = y - size * 0.08 + (i * size * 0.035);
            ctx.beginPath();
            ctx.moveTo(x - size * 0.14, py);
            ctx.quadraticCurveTo(x, py - size * 0.02, x + size * 0.14, py);
            ctx.stroke();
        }

        // Glow aura
        ctx.fillStyle = 'rgba(200, 100, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.22, 0, Math.PI * 2);
        ctx.fill();
    }

export function renderSpaceCrystalOrganism(ctx, x, y, size) {
        // Hybrid crystal organism - larger and more detailed variation
        ctx.fillStyle = '#7a6aaa';
        
        // Base crystal cluster
        const clusters = 5;
        for (let i = 0; i < clusters; i++) {
            const angle = (i / clusters) * Math.PI * 2;
            const radius = size * 0.15;
            const cX = x + Math.cos(angle) * radius;
            const cY = y + Math.sin(angle) * radius;
            
            // Individual crystal
            ctx.beginPath();
            ctx.moveTo(cX, cY - size * 0.18);
            ctx.lineTo(cX + size * 0.1, cY + size * 0.08);
            ctx.lineTo(cX - size * 0.1, cY + size * 0.08);
            ctx.closePath();
            ctx.fill();
            
            // Crystal highlight
            ctx.fillStyle = '#9a8aaa';
            ctx.beginPath();
            ctx.arc(cX - size * 0.05, cY - size * 0.08, size * 0.05, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#7a6aaa';
        }
        
        // Central growth core
        ctx.fillStyle = '#5a8aaa';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.14, 0, Math.PI * 2);
        ctx.fill();
        
        // Energetic tendrils extending outward
        ctx.strokeStyle = 'rgba(150, 180, 255, 0.6)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const endX = x + Math.cos(angle) * size * 0.35;
            const endY = y + Math.sin(angle) * size * 0.35;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(
                x + Math.cos(angle) * size * 0.15,
                y + Math.sin(angle) * size * 0.15,
                endX,
                endY
            );
            ctx.stroke();
        }
        
        // Pulsing core glow
        ctx.fillStyle = 'rgba(180, 200, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

export function renderMountainPineType1(ctx, x, y, size) {
        // Tall conifer — 3 layered triangles, clean silhouette, cold greens with snow caps
        const trunkW = size * 0.22;
        const trunkH = size * 0.48;
        ctx.fillStyle = '#4a2c12';
        ctx.fillRect(x - trunkW * 0.5, y, trunkW, trunkH);
        ctx.fillStyle = '#2e1a08';
        ctx.fillRect(x + trunkW * 0.08, y, trunkW * 0.42, trunkH);

        // Bottom tier
        ctx.fillStyle = '#0c2e1a';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.15);
        ctx.lineTo(x + size * 0.34, y + size * 0.20);
        ctx.lineTo(x - size * 0.34, y + size * 0.20);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1a4a2e';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.15);
        ctx.lineTo(x, y + size * 0.20);
        ctx.lineTo(x - size * 0.34, y + size * 0.20);
        ctx.closePath();
        ctx.fill();

        // Middle tier
        ctx.fillStyle = '#0e3620';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.38);
        ctx.lineTo(x + size * 0.28, y + size * 0.02);
        ctx.lineTo(x - size * 0.28, y + size * 0.02);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1c5234';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.38);
        ctx.lineTo(x, y + size * 0.02);
        ctx.lineTo(x - size * 0.28, y + size * 0.02);
        ctx.closePath();
        ctx.fill();

        // Top tier
        ctx.fillStyle = '#104028';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.62);
        ctx.lineTo(x + size * 0.20, y - size * 0.14);
        ctx.lineTo(x - size * 0.20, y - size * 0.14);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1e5a3a';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.62);
        ctx.lineTo(x, y - size * 0.14);
        ctx.lineTo(x - size * 0.20, y - size * 0.14);
        ctx.closePath();
        ctx.fill();

        // Snow caps on each tier — gentle curved shapes
        // Top snow
        ctx.fillStyle = 'rgba(235, 248, 255, 0.95)';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.62);
        ctx.quadraticCurveTo(x + size * 0.12, y - size * 0.42, x + size * 0.18, y - size * 0.32);
        ctx.quadraticCurveTo(x + size * 0.06, y - size * 0.28, x, y - size * 0.34);
        ctx.quadraticCurveTo(x - size * 0.06, y - size * 0.28, x - size * 0.18, y - size * 0.32);
        ctx.quadraticCurveTo(x - size * 0.12, y - size * 0.42, x, y - size * 0.62);
        ctx.closePath();
        ctx.fill();
        // Middle snow
        ctx.fillStyle = 'rgba(232, 245, 255, 0.92)';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.38);
        ctx.quadraticCurveTo(x + size * 0.16, y - size * 0.20, x + size * 0.25, y - size * 0.12);
        ctx.quadraticCurveTo(x + size * 0.10, y - size * 0.06, x, y - size * 0.12);
        ctx.quadraticCurveTo(x - size * 0.10, y - size * 0.06, x - size * 0.25, y - size * 0.12);
        ctx.quadraticCurveTo(x - size * 0.16, y - size * 0.20, x, y - size * 0.38);
        ctx.closePath();
        ctx.fill();
        // Bottom snow — lighter, thinner
        ctx.fillStyle = 'rgba(228, 242, 255, 0.85)';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.15);
        ctx.quadraticCurveTo(x + size * 0.18, y + size * 0.02, x + size * 0.30, y + size * 0.08);
        ctx.quadraticCurveTo(x + size * 0.12, y + size * 0.12, x, y + size * 0.06);
        ctx.quadraticCurveTo(x - size * 0.12, y + size * 0.12, x - size * 0.30, y + size * 0.08);
        ctx.quadraticCurveTo(x - size * 0.18, y + size * 0.02, x, y - size * 0.15);
        ctx.closePath();
        ctx.fill();
    }

export function renderMountainPineType2(ctx, x, y, size) {
        // Pine/spruce with 4 layered triangles — wider silhouette, snow on upper tiers
        const trunkW = size * 0.18;
        const trunkH = size * 0.42;
        ctx.fillStyle = '#4a2c12';
        ctx.fillRect(x - trunkW * 0.5, y - size * 0.05, trunkW, trunkH);
        ctx.fillStyle = '#2e1a08';
        ctx.fillRect(x + trunkW * 0.08, y - size * 0.05, trunkW * 0.42, trunkH);

        // 4 tiers, each wider than Type 1
        ctx.fillStyle = '#0c2e1a';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.05);
        ctx.lineTo(x + size * 0.40, y + size * 0.18);
        ctx.lineTo(x - size * 0.40, y + size * 0.18);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1a4a2e';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.05);
        ctx.lineTo(x, y + size * 0.18);
        ctx.lineTo(x - size * 0.40, y + size * 0.18);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#0e3620';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.25);
        ctx.lineTo(x + size * 0.32, y + size * 0.02);
        ctx.lineTo(x - size * 0.32, y + size * 0.02);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1c5234';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.25);
        ctx.lineTo(x, y + size * 0.02);
        ctx.lineTo(x - size * 0.32, y + size * 0.02);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#104028';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.46);
        ctx.lineTo(x + size * 0.22, y - size * 0.15);
        ctx.lineTo(x - size * 0.22, y - size * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1e5a3a';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.46);
        ctx.lineTo(x, y - size * 0.15);
        ctx.lineTo(x - size * 0.22, y - size * 0.15);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#14503a';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.62);
        ctx.lineTo(x + size * 0.13, y - size * 0.38);
        ctx.lineTo(x - size * 0.13, y - size * 0.38);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#226844';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.62);
        ctx.lineTo(x, y - size * 0.38);
        ctx.lineTo(x - size * 0.13, y - size * 0.38);
        ctx.closePath();
        ctx.fill();

        // Snow caps — top two tiers get heavy snow, bottom two lighter
        ctx.fillStyle = 'rgba(237, 249, 255, 0.96)';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.62);
        ctx.quadraticCurveTo(x + size * 0.08, y - size * 0.50, x + size * 0.12, y - size * 0.44);
        ctx.quadraticCurveTo(x + size * 0.04, y - size * 0.40, x, y - size * 0.44);
        ctx.quadraticCurveTo(x - size * 0.04, y - size * 0.40, x - size * 0.12, y - size * 0.44);
        ctx.quadraticCurveTo(x - size * 0.08, y - size * 0.50, x, y - size * 0.62);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(234, 247, 255, 0.94)';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.46);
        ctx.quadraticCurveTo(x + size * 0.13, y - size * 0.32, x + size * 0.20, y - size * 0.24);
        ctx.quadraticCurveTo(x + size * 0.08, y - size * 0.18, x, y - size * 0.24);
        ctx.quadraticCurveTo(x - size * 0.08, y - size * 0.18, x - size * 0.20, y - size * 0.24);
        ctx.quadraticCurveTo(x - size * 0.13, y - size * 0.32, x, y - size * 0.46);
        ctx.closePath();
        ctx.fill();

        // Light dusting on middle tier
        ctx.fillStyle = 'rgba(230, 244, 255, 0.78)';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.25);
        ctx.quadraticCurveTo(x + size * 0.16, y - size * 0.12, x + size * 0.26, y - size * 0.06);
        ctx.quadraticCurveTo(x + size * 0.10, y - size * 0.01, x, y - size * 0.08);
        ctx.quadraticCurveTo(x - size * 0.10, y - size * 0.01, x - size * 0.26, y - size * 0.06);
        ctx.quadraticCurveTo(x - size * 0.16, y - size * 0.12, x, y - size * 0.25);
        ctx.closePath();
        ctx.fill();
    }

export function renderMountainPineType3(ctx, x, y, size) {
        // Short young pine — 2 wide triangle tiers, compact and squat
        const trunkW = size * 0.18;
        const trunkH = size * 0.32;
        ctx.fillStyle = '#553216';
        ctx.fillRect(x - trunkW * 0.5, y - size * 0.02, trunkW, trunkH);
        ctx.fillStyle = '#301a08';
        ctx.fillRect(x + trunkW * 0.10, y - size * 0.02, trunkW * 0.40, trunkH);

        // Bottom tier — wide and squat
        ctx.fillStyle = '#0c2e1a';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.04);
        ctx.lineTo(x + size * 0.38, y + size * 0.18);
        ctx.lineTo(x - size * 0.38, y + size * 0.18);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1a4a2e';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.04);
        ctx.lineTo(x, y + size * 0.18);
        ctx.lineTo(x - size * 0.38, y + size * 0.18);
        ctx.closePath();
        ctx.fill();

        // Top tier — also wide for a stubby look
        ctx.fillStyle = '#0e3620';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.28);
        ctx.lineTo(x + size * 0.28, y + size * 0.04);
        ctx.lineTo(x - size * 0.28, y + size * 0.04);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1c5234';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.28);
        ctx.lineTo(x, y + size * 0.04);
        ctx.lineTo(x - size * 0.28, y + size * 0.04);
        ctx.closePath();
        ctx.fill();

        // Snow cap on top tier
        ctx.fillStyle = 'rgba(236, 249, 255, 0.94)';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.28);
        ctx.quadraticCurveTo(x + size * 0.16, y - size * 0.14, x + size * 0.24, y - size * 0.06);
        ctx.quadraticCurveTo(x + size * 0.08, y - size * 0.01, x, y - size * 0.08);
        ctx.quadraticCurveTo(x - size * 0.08, y - size * 0.01, x - size * 0.24, y - size * 0.06);
        ctx.quadraticCurveTo(x - size * 0.16, y - size * 0.14, x, y - size * 0.28);
        ctx.closePath();
        ctx.fill();

        // Light dusting on bottom tier
        ctx.fillStyle = 'rgba(230, 244, 255, 0.75)';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.04);
        ctx.quadraticCurveTo(x + size * 0.20, y + size * 0.08, x + size * 0.32, y + size * 0.12);
        ctx.quadraticCurveTo(x + size * 0.14, y + size * 0.16, x, y + size * 0.10);
        ctx.quadraticCurveTo(x - size * 0.14, y + size * 0.16, x - size * 0.32, y + size * 0.12);
        ctx.quadraticCurveTo(x - size * 0.20, y + size * 0.08, x, y - size * 0.04);
        ctx.closePath();
        ctx.fill();
    }

export function renderMountainPineType4(ctx, x, y, size) {
        // Tall narrow columnar pine — slim form with snow all down one side
        const trunkW = size * 0.15;
        const trunkH = size * 0.52;
        ctx.fillStyle = '#4a2c12';
        ctx.fillRect(x - trunkW * 0.5, y - size * 0.15, trunkW, trunkH);
        ctx.fillStyle = '#2a1508';
        ctx.fillRect(x + trunkW * 0.15, y - size * 0.15, trunkW * 0.35, trunkH);

        // Narrow triangular crown — 3 layers
        ctx.fillStyle = '#0c2e1a';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.22);
        ctx.lineTo(x + size * 0.26, y + size * 0.10);
        ctx.lineTo(x - size * 0.26, y + size * 0.10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1a4a2e';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.22);
        ctx.lineTo(x, y + size * 0.10);
        ctx.lineTo(x - size * 0.26, y + size * 0.10);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#0e3620';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.44);
        ctx.lineTo(x + size * 0.20, y - size * 0.10);
        ctx.lineTo(x - size * 0.20, y - size * 0.10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1c5234';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.44);
        ctx.lineTo(x, y - size * 0.10);
        ctx.lineTo(x - size * 0.20, y - size * 0.10);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#104028';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.62);
        ctx.lineTo(x + size * 0.14, y - size * 0.30);
        ctx.lineTo(x - size * 0.14, y - size * 0.30);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1e5a3a';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.62);
        ctx.lineTo(x, y - size * 0.30);
        ctx.lineTo(x - size * 0.14, y - size * 0.30);
        ctx.closePath();
        ctx.fill();

        // Snow down the left side — asymmetric natural snow buildup
        ctx.fillStyle = 'rgba(236, 249, 255, 0.95)';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.62);
        ctx.quadraticCurveTo(x - size * 0.10, y - size * 0.48, x - size * 0.13, y - size * 0.38);
        ctx.quadraticCurveTo(x - size * 0.08, y - size * 0.34, x, y - size * 0.40);
        ctx.quadraticCurveTo(x - size * 0.05, y - size * 0.48, x, y - size * 0.62);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(232, 246, 255, 0.92)';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.44);
        ctx.quadraticCurveTo(x - size * 0.14, y - size * 0.28, x - size * 0.18, y - size * 0.18);
        ctx.quadraticCurveTo(x - size * 0.10, y - size * 0.12, x, y - size * 0.20);
        ctx.quadraticCurveTo(x - size * 0.08, y - size * 0.30, x, y - size * 0.44);
        ctx.closePath();
        ctx.fill();

        // Light snow on bottom tier
        ctx.fillStyle = 'rgba(228, 242, 255, 0.82)';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.22);
        ctx.quadraticCurveTo(x - size * 0.16, y - size * 0.08, x - size * 0.22, y + size * 0.02);
        ctx.quadraticCurveTo(x - size * 0.12, y + size * 0.06, x, y - size * 0.02);
        ctx.quadraticCurveTo(x - size * 0.08, y - size * 0.12, x, y - size * 0.22);
        ctx.closePath();
        ctx.fill();

        // Snow tip at apex
        ctx.fillStyle = 'rgba(240, 252, 255, 0.98)';
        ctx.beginPath();
        ctx.ellipse(x, y - size * 0.63, size * 0.04, size * 0.03, 0, 0, Math.PI * 2);
        ctx.fill();
    }

export function renderSpaceCrystalType1(ctx, x, y, size) {
        // Large geometric crystal formation
        ctx.fillStyle = '#6a5a9a';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.35);
        ctx.lineTo(x + size * 0.2, y + size * 0.15);
        ctx.lineTo(x + size * 0.08, y + size * 0.3);
        ctx.lineTo(x - size * 0.08, y + size * 0.3);
        ctx.lineTo(x - size * 0.2, y + size * 0.15);
        ctx.closePath();
        ctx.fill();

        // Highlight face
        ctx.fillStyle = '#8a7aaa';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.35);
        ctx.lineTo(x + size * 0.2, y + size * 0.15);
        ctx.lineTo(x + size * 0.05, y - size * 0.1);
        ctx.closePath();
        ctx.fill();

        // Glow
        ctx.fillStyle = 'rgba(138, 122, 170, 0.6)';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.05, size * 0.14, 0, Math.PI * 2);
        ctx.fill();

        // Bright core
        ctx.fillStyle = '#b9a8d9';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.15, size * 0.06, 0, Math.PI * 2);
        ctx.fill();
    }

export function renderSpaceCrystalType2(ctx, x, y, size) {
        // Small crystal spike
        ctx.fillStyle = '#7a6aaa';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.4);
        ctx.lineTo(x + size * 0.12, y + size * 0.2);
        ctx.lineTo(x - size * 0.12, y + size * 0.2);
        ctx.closePath();
        ctx.fill();

        // Brighter side
        ctx.fillStyle = '#9a8aaa';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.4);
        ctx.lineTo(x + size * 0.12, y + size * 0.2);
        ctx.lineTo(x, y - size * 0.05);
        ctx.closePath();
        ctx.fill();

        // Glow
        ctx.fillStyle = 'rgba(154, 138, 170, 0.5)';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.1, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }

export function renderAlienPlant(ctx, x, y, size) {
        // Bioluminescent organism
        ctx.fillStyle = '#4a7a8a';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const radius = size * (0.2 + Math.abs(Math.sin(angle * 3)) * 0.08);
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();

        // Intense glow
        ctx.fillStyle = 'rgba(100, 200, 220, 0.7)';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.18, 0, Math.PI * 2);
        ctx.fill();

        // Bright core
        ctx.fillStyle = '#7ad4d4';
        ctx.beginPath();
        ctx.arc(x - size * 0.08, y - size * 0.08, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
    }

export function renderTree(ctx, x, y, size, gridX, gridY, variant) {
        const seed = (variant !== undefined && variant !== null) ? variant % 6 : Math.floor(gridX + gridY) % 6;
        // Ground shadow — cast onto forest floor beneath the tree
        ctx.save();
        ctx.globalAlpha = 0.52;
        ctx.fillStyle = '#010a01';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.06, y + size * 0.43, size * 0.38, size * 0.09, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        switch(seed) {
            case 0:
                renderTreeType1(ctx, x, y, size);
                break;
            case 1:
                renderTreeType2(ctx, x, y, size);
                break;
            case 2:
                renderTreeType3(ctx, x, y, size);
                break;
            case 3:
                renderTreeType4(ctx, x, y, size);
                break;
            case 4:
                renderTreeType5(ctx, x, y, size);
                break;
            default:
                renderTreeType6(ctx, x, y, size);
        }
    }

export function renderTreeType1(ctx, x, y, size) {
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
        // Right-side shadow for depth
        ctx.fillStyle = 'rgba(0, 18, 5, 0.32)';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.02, y - size * 0.15);
        ctx.lineTo(x + size * 0.25, y + size * 0.2);
        ctx.lineTo(x + size * 0.02, y + size * 0.2);
        ctx.closePath();
        ctx.fill();
    }

export function renderTreeType2(ctx, x, y, size) {
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

export function renderTreeType3(ctx, x, y, size) {
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

export function renderTreeType4(ctx, x, y, size) {
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
        // Right-side shadow on lowest layer for depth
        ctx.fillStyle = 'rgba(0, 18, 5, 0.32)';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.02, y - size * 0.05);
        ctx.lineTo(x + size * 0.38, y + size * 0.15);
        ctx.lineTo(x + size * 0.02, y + size * 0.15);
        ctx.closePath();
        ctx.fill();
    }

export function renderTreeType5(ctx, x, y, size) {
        // Tall columnar tree with narrow form
        const trunkWidth = size * 0.15;
        ctx.fillStyle = '#704214';
        ctx.fillRect(x - trunkWidth * 0.5, y - size * 0.15, trunkWidth, size * 0.55);
        
        // Dark trunk shadow
        ctx.fillStyle = '#4a2511';
        ctx.fillRect(x + trunkWidth * 0.15, y - size * 0.15, trunkWidth * 0.35, size * 0.55);
        
        // Narrow triangular crown
        ctx.fillStyle = '#0f3d1f';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.25);
        ctx.lineTo(x + size * 0.28, y + size * 0.08);
        ctx.lineTo(x - size * 0.28, y + size * 0.08);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#1a5a2a';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.42);
        ctx.lineTo(x + size * 0.22, y - size * 0.08);
        ctx.lineTo(x - size * 0.22, y - size * 0.08);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#2d7a3d';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.55);
        ctx.lineTo(x + size * 0.15, y - size * 0.28);
        ctx.lineTo(x - size * 0.15, y - size * 0.28);
        ctx.closePath();
        ctx.fill();
        // Right-side shadow on lowest layer
        ctx.fillStyle = 'rgba(0, 18, 5, 0.32)';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.02, y - size * 0.25);
        ctx.lineTo(x + size * 0.28, y + size * 0.08);
        ctx.lineTo(x + size * 0.02, y + size * 0.08);
        ctx.closePath();
        ctx.fill();
    }

export function renderTreeType6(ctx, x, y, size) {
        // Broad oak/maple style tree with wide crown
        const trunkWidth = size * 0.22;
        
        // Trunk
        ctx.fillStyle = '#6B4423';
        ctx.fillRect(x - trunkWidth * 0.5, y - size * 0.1, trunkWidth, size * 0.5);
        
        // Trunk highlight
        ctx.fillStyle = '#8B6434';
        ctx.fillRect(x - trunkWidth * 0.3, y - size * 0.1, trunkWidth * 0.35, size * 0.5);
        
        // Wide rounded crown - multiple overlapping circles
        ctx.fillStyle = '#0d4a1a';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.25, size * 0.42, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#1b6b2f';
        ctx.beginPath();
        ctx.arc(x - size * 0.2, y - size * 0.15, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x + size * 0.2, y - size * 0.15, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2d8b3f';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

export function renderRock(ctx, x, y, size, gridX, gridY, variant, campaign) {
        switch (campaign) {
            case 'desert':
                renderDesertRock(ctx, x, y, size, gridX, gridY, variant);
                break;
            case 'mountain':
                renderMountainRock(ctx, x, y, size, gridX, gridY, variant);
                break;
            case 'space':
                renderSpaceRock(ctx, x, y, size, gridX, gridY, variant);
                break;
            case 'forest':
            default:
                renderForestRock(ctx, x, y, size, gridX, gridY, variant);
                break;
        }
    }

export function renderMountainRock(ctx, x, y, size, gridX, gridY, variant) {
        const seed = (variant !== undefined && variant !== null) ? variant % 4 : Math.floor(gridX * 0.5 + gridY * 0.7) % 4;
        switch(seed) {
            case 0: renderMountainRock0(ctx, x, y, size); break;
            case 1: renderMountainRock1(ctx, x, y, size); break;
            case 2: renderMountainRock2(ctx, x, y, size); break;
            default: renderMountainRock3(ctx, x, y, size);
        }
    }

export function renderMountainRock0(ctx, x, y, size) {
        // Rounded grey boulder with natural irregular shape, shading, and snow cap
        // Main body — irregular polygon instead of perfect ellipse
        ctx.fillStyle = '#6a7880';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.28, y + size * 0.12);
        ctx.quadraticCurveTo(x - size * 0.34, y - size * 0.06, x - size * 0.18, y - size * 0.22);
        ctx.quadraticCurveTo(x - size * 0.04, y - size * 0.28, x + size * 0.12, y - size * 0.24);
        ctx.quadraticCurveTo(x + size * 0.30, y - size * 0.16, x + size * 0.32, y + size * 0.02);
        ctx.quadraticCurveTo(x + size * 0.30, y + size * 0.16, x + size * 0.10, y + size * 0.20);
        ctx.quadraticCurveTo(x - size * 0.10, y + size * 0.22, x - size * 0.28, y + size * 0.12);
        ctx.closePath();
        ctx.fill();
        // Shadow/dark face on right side
        ctx.fillStyle = 'rgba(38, 48, 58, 0.45)';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.12, y - size * 0.24);
        ctx.quadraticCurveTo(x + size * 0.30, y - size * 0.16, x + size * 0.32, y + size * 0.02);
        ctx.quadraticCurveTo(x + size * 0.30, y + size * 0.16, x + size * 0.10, y + size * 0.20);
        ctx.lineTo(x + size * 0.04, y + size * 0.06);
        ctx.quadraticCurveTo(x + size * 0.14, y - size * 0.08, x + size * 0.12, y - size * 0.24);
        ctx.closePath();
        ctx.fill();
        // Highlight on upper-left
        ctx.fillStyle = 'rgba(180, 195, 210, 0.40)';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.18, y - size * 0.22);
        ctx.quadraticCurveTo(x - size * 0.04, y - size * 0.28, x + size * 0.06, y - size * 0.24);
        ctx.quadraticCurveTo(x - size * 0.02, y - size * 0.12, x - size * 0.14, y - size * 0.08);
        ctx.quadraticCurveTo(x - size * 0.24, y - size * 0.10, x - size * 0.18, y - size * 0.22);
        ctx.closePath();
        ctx.fill();
        // Snow on top
        ctx.fillStyle = 'rgba(238, 248, 255, 0.88)';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.22, y - size * 0.16);
        ctx.quadraticCurveTo(x - size * 0.10, y - size * 0.26, x + size * 0.06, y - size * 0.24);
        ctx.quadraticCurveTo(x + size * 0.22, y - size * 0.20, x + size * 0.24, y - size * 0.10);
        ctx.quadraticCurveTo(x + size * 0.10, y - size * 0.08, x - size * 0.04, y - size * 0.10);
        ctx.quadraticCurveTo(x - size * 0.18, y - size * 0.08, x - size * 0.22, y - size * 0.16);
        ctx.closePath();
        ctx.fill();
    }

export function renderMountainRock1(ctx, x, y, size) {
        // Angular slab with faceted faces and snow on top ledge
        const hw = size * 0.34, hh = size * 0.22;
        // Main face
        ctx.fillStyle = '#586470';
        ctx.beginPath();
        ctx.moveTo(x - hw, y + hh * 0.5);
        ctx.lineTo(x - hw * 0.72, y - hh);
        ctx.lineTo(x - hw * 0.10, y - hh * 1.10);
        ctx.lineTo(x + hw * 0.68, y - hh * 0.85);
        ctx.lineTo(x + hw, y + hh * 0.3);
        ctx.lineTo(x + hw * 0.60, y + hh * 0.6);
        ctx.closePath();
        ctx.fill();
        // Dark right face
        ctx.fillStyle = '#3a4550';
        ctx.beginPath();
        ctx.moveTo(x + hw * 0.68, y - hh * 0.85);
        ctx.lineTo(x + hw, y + hh * 0.3);
        ctx.lineTo(x + hw * 0.60, y + hh * 0.6);
        ctx.lineTo(x + hw * 0.40, y + hh * 0.1);
        ctx.closePath();
        ctx.fill();
        // Lighter top face
        ctx.fillStyle = 'rgba(130, 145, 160, 0.50)';
        ctx.beginPath();
        ctx.moveTo(x - hw * 0.72, y - hh);
        ctx.lineTo(x - hw * 0.10, y - hh * 1.10);
        ctx.lineTo(x + hw * 0.68, y - hh * 0.85);
        ctx.lineTo(x + hw * 0.20, y - hh * 0.50);
        ctx.closePath();
        ctx.fill();
        // Crack detail
        ctx.strokeStyle = 'rgba(30, 40, 48, 0.30)';
        ctx.lineWidth = size * 0.012;
        ctx.beginPath();
        ctx.moveTo(x - hw * 0.20, y - hh * 0.60);
        ctx.lineTo(x + hw * 0.10, y + hh * 0.10);
        ctx.lineTo(x + hw * 0.30, y + hh * 0.45);
        ctx.stroke();
        // Snow on top ledge
        ctx.fillStyle = 'rgba(235, 248, 255, 0.90)';
        ctx.beginPath();
        ctx.moveTo(x - hw * 0.78, y - hh * 0.90);
        ctx.quadraticCurveTo(x - hw * 0.30, y - hh * 1.16, x + hw * 0.20, y - hh * 1.06);
        ctx.quadraticCurveTo(x + hw * 0.68, y - hh * 0.92, x + hw * 0.60, y - hh * 0.72);
        ctx.quadraticCurveTo(x + hw * 0.20, y - hh * 0.56, x - hw * 0.20, y - hh * 0.65);
        ctx.quadraticCurveTo(x - hw * 0.60, y - hh * 0.70, x - hw * 0.78, y - hh * 0.90);
        ctx.closePath();
        ctx.fill();
    }

export function renderMountainRock2(ctx, x, y, size) {
        // Two overlapping boulders with natural shapes and snow caps
        // Back boulder (slightly behind)
        ctx.fillStyle = '#708090';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.02, y - size * 0.02);
        ctx.quadraticCurveTo(x + size * 0.04, y - size * 0.18, x + size * 0.18, y - size * 0.20);
        ctx.quadraticCurveTo(x + size * 0.32, y - size * 0.16, x + size * 0.30, y + size * 0.02);
        ctx.quadraticCurveTo(x + size * 0.26, y + size * 0.12, x + size * 0.10, y + size * 0.12);
        ctx.quadraticCurveTo(x - size * 0.02, y + size * 0.10, x + size * 0.02, y - size * 0.02);
        ctx.closePath();
        ctx.fill();
        // Back boulder shadow face
        ctx.fillStyle = 'rgba(40, 50, 62, 0.40)';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.18, y - size * 0.20);
        ctx.quadraticCurveTo(x + size * 0.32, y - size * 0.16, x + size * 0.30, y + size * 0.02);
        ctx.quadraticCurveTo(x + size * 0.26, y + size * 0.12, x + size * 0.16, y + size * 0.12);
        ctx.lineTo(x + size * 0.20, y - size * 0.06);
        ctx.closePath();
        ctx.fill();
        // Front boulder (overlapping)
        ctx.fillStyle = '#6a7a84';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.30, y + size * 0.10);
        ctx.quadraticCurveTo(x - size * 0.34, y - size * 0.04, x - size * 0.20, y - size * 0.18);
        ctx.quadraticCurveTo(x - size * 0.06, y - size * 0.24, x + size * 0.10, y - size * 0.16);
        ctx.quadraticCurveTo(x + size * 0.18, y - size * 0.06, x + size * 0.14, y + size * 0.10);
        ctx.quadraticCurveTo(x - size * 0.06, y + size * 0.18, x - size * 0.30, y + size * 0.10);
        ctx.closePath();
        ctx.fill();
        // Front boulder shadow
        ctx.fillStyle = 'rgba(40, 50, 60, 0.38)';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.10, y - size * 0.16);
        ctx.quadraticCurveTo(x + size * 0.18, y - size * 0.06, x + size * 0.14, y + size * 0.10);
        ctx.quadraticCurveTo(x + size * 0.02, y + size * 0.14, x + size * 0.02, y + size * 0.02);
        ctx.quadraticCurveTo(x + size * 0.08, y - size * 0.06, x + size * 0.10, y - size * 0.16);
        ctx.closePath();
        ctx.fill();
        // Front highlight
        ctx.fillStyle = 'rgba(175, 190, 205, 0.35)';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.20, y - size * 0.18);
        ctx.quadraticCurveTo(x - size * 0.08, y - size * 0.22, x + size * 0.02, y - size * 0.18);
        ctx.quadraticCurveTo(x - size * 0.06, y - size * 0.08, x - size * 0.16, y - size * 0.08);
        ctx.closePath();
        ctx.fill();
        // Snow on front boulder
        ctx.fillStyle = 'rgba(238, 248, 255, 0.86)';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.24, y - size * 0.12);
        ctx.quadraticCurveTo(x - size * 0.10, y - size * 0.22, x + size * 0.06, y - size * 0.18);
        ctx.quadraticCurveTo(x + size * 0.12, y - size * 0.12, x + size * 0.08, y - size * 0.06);
        ctx.quadraticCurveTo(x - size * 0.04, y - size * 0.04, x - size * 0.18, y - size * 0.06);
        ctx.quadraticCurveTo(x - size * 0.28, y - size * 0.06, x - size * 0.24, y - size * 0.12);
        ctx.closePath();
        ctx.fill();
        // Snow on back boulder
        ctx.fillStyle = 'rgba(235, 246, 255, 0.80)';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.08, y - size * 0.14);
        ctx.quadraticCurveTo(x + size * 0.16, y - size * 0.20, x + size * 0.24, y - size * 0.16);
        ctx.quadraticCurveTo(x + size * 0.28, y - size * 0.10, x + size * 0.22, y - size * 0.06);
        ctx.quadraticCurveTo(x + size * 0.14, y - size * 0.06, x + size * 0.08, y - size * 0.14);
        ctx.closePath();
        ctx.fill();
    }

export function renderMountainRock3(ctx, x, y, size) {
        // Cluster of small stones with varied shapes and snow patches
        // Stone 1 — largest, front-left
        ctx.fillStyle = '#6a7880';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.26, y + size * 0.14);
        ctx.quadraticCurveTo(x - size * 0.28, y + size * 0.02, x - size * 0.18, y - size * 0.06);
        ctx.quadraticCurveTo(x - size * 0.04, y - size * 0.12, x + size * 0.04, y - size * 0.04);
        ctx.quadraticCurveTo(x + size * 0.06, y + size * 0.08, x - size * 0.06, y + size * 0.16);
        ctx.quadraticCurveTo(x - size * 0.18, y + size * 0.18, x - size * 0.26, y + size * 0.14);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(40, 52, 62, 0.35)';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.04, y - size * 0.04);
        ctx.quadraticCurveTo(x + size * 0.06, y + size * 0.08, x - size * 0.06, y + size * 0.16);
        ctx.lineTo(x - size * 0.02, y + size * 0.04);
        ctx.closePath();
        ctx.fill();
        // Stone 2 — right
        ctx.fillStyle = '#5e6e78';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.06, y + size * 0.08);
        ctx.quadraticCurveTo(x + size * 0.04, y - size * 0.04, x + size * 0.16, y - size * 0.08);
        ctx.quadraticCurveTo(x + size * 0.26, y - size * 0.04, x + size * 0.24, y + size * 0.06);
        ctx.quadraticCurveTo(x + size * 0.18, y + size * 0.12, x + size * 0.06, y + size * 0.08);
        ctx.closePath();
        ctx.fill();
        // Stone 3 — small, front-center
        ctx.fillStyle = '#74848c';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.04, y + size * 0.18);
        ctx.quadraticCurveTo(x - size * 0.02, y + size * 0.10, x + size * 0.08, y + size * 0.12);
        ctx.quadraticCurveTo(x + size * 0.12, y + size * 0.18, x + size * 0.04, y + size * 0.22);
        ctx.quadraticCurveTo(x - size * 0.04, y + size * 0.22, x - size * 0.04, y + size * 0.18);
        ctx.closePath();
        ctx.fill();
        // Stone 4 — tiny, back
        ctx.fillStyle = '#667682';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.08, y - size * 0.10);
        ctx.quadraticCurveTo(x - size * 0.04, y - size * 0.16, x + size * 0.06, y - size * 0.14);
        ctx.quadraticCurveTo(x + size * 0.10, y - size * 0.10, x + size * 0.06, y - size * 0.06);
        ctx.quadraticCurveTo(x - size * 0.02, y - size * 0.04, x - size * 0.08, y - size * 0.10);
        ctx.closePath();
        ctx.fill();
        // Snow on stone 1
        ctx.fillStyle = 'rgba(238, 248, 255, 0.82)';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.20, y - size * 0.02);
        ctx.quadraticCurveTo(x - size * 0.10, y - size * 0.10, x + size * 0.02, y - size * 0.06);
        ctx.quadraticCurveTo(x, y + size * 0.02, x - size * 0.12, y + size * 0.02);
        ctx.quadraticCurveTo(x - size * 0.22, y + size * 0.02, x - size * 0.20, y - size * 0.02);
        ctx.closePath();
        ctx.fill();
        // Snow on stone 2
        ctx.fillStyle = 'rgba(235, 246, 255, 0.78)';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.10, y - size * 0.04);
        ctx.quadraticCurveTo(x + size * 0.16, y - size * 0.08, x + size * 0.22, y - size * 0.04);
        ctx.quadraticCurveTo(x + size * 0.20, y + size * 0.02, x + size * 0.12, y + size * 0.02);
        ctx.quadraticCurveTo(x + size * 0.08, y, x + size * 0.10, y - size * 0.04);
        ctx.closePath();
        ctx.fill();
    }

export function renderDesertRock(ctx, x, y, size, gridX, gridY, variant) {
        const seed = (variant !== undefined && variant !== null) ? variant % 4 : Math.floor(gridX * 0.5 + gridY * 0.7) % 4;
        switch(seed) {
            case 0: renderDesertRock0(ctx, x, y, size); break;
            case 1: renderDesertRock1(ctx, x, y, size); break;
            case 2: renderDesertRock2(ctx, x, y, size); break;
            default: renderDesertRock3(ctx, x, y, size);
        }
    }

export function renderDesertRock0(ctx, x, y, size) {
        // Rounded sandstone boulder — organic irregular shape
        ctx.fillStyle = 'rgba(80,40,10,0.30)';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.28, y + size * 0.14);
        ctx.quadraticCurveTo(x - size * 0.34, y - size * 0.06, x - size * 0.18, y - size * 0.22);
        ctx.quadraticCurveTo(x - size * 0.04, y - size * 0.28, x + size * 0.12, y - size * 0.24);
        ctx.quadraticCurveTo(x + size * 0.30, y - size * 0.16, x + size * 0.32, y + size * 0.02);
        ctx.quadraticCurveTo(x + size * 0.30, y + size * 0.16, x + size * 0.10, y + size * 0.20);
        ctx.quadraticCurveTo(x - size * 0.10, y + size * 0.22, x - size * 0.28, y + size * 0.14);
        ctx.closePath();
        ctx.fill();
        // Main body
        ctx.fillStyle = '#c49050';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.28, y + size * 0.12);
        ctx.quadraticCurveTo(x - size * 0.34, y - size * 0.06, x - size * 0.18, y - size * 0.22);
        ctx.quadraticCurveTo(x - size * 0.04, y - size * 0.28, x + size * 0.12, y - size * 0.24);
        ctx.quadraticCurveTo(x + size * 0.30, y - size * 0.16, x + size * 0.32, y + size * 0.02);
        ctx.quadraticCurveTo(x + size * 0.30, y + size * 0.16, x + size * 0.10, y + size * 0.20);
        ctx.quadraticCurveTo(x - size * 0.10, y + size * 0.22, x - size * 0.28, y + size * 0.12);
        ctx.closePath();
        ctx.fill();
        // Shadow face on right
        ctx.fillStyle = 'rgba(80,40,10,0.48)';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.12, y - size * 0.24);
        ctx.quadraticCurveTo(x + size * 0.30, y - size * 0.16, x + size * 0.32, y + size * 0.02);
        ctx.quadraticCurveTo(x + size * 0.30, y + size * 0.16, x + size * 0.10, y + size * 0.20);
        ctx.lineTo(x + size * 0.04, y + size * 0.06);
        ctx.quadraticCurveTo(x + size * 0.14, y - size * 0.08, x + size * 0.12, y - size * 0.24);
        ctx.closePath();
        ctx.fill();
        // Highlight on upper left
        ctx.fillStyle = 'rgba(220,178,96,0.45)';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.18, y - size * 0.22);
        ctx.quadraticCurveTo(x - size * 0.04, y - size * 0.28, x + size * 0.06, y - size * 0.24);
        ctx.quadraticCurveTo(x - size * 0.02, y - size * 0.12, x - size * 0.14, y - size * 0.08);
        ctx.quadraticCurveTo(x - size * 0.24, y - size * 0.10, x - size * 0.18, y - size * 0.22);
        ctx.closePath();
        ctx.fill();
    }

export function renderDesertRock1(ctx, x, y, size) {
        // Layered sandstone slab with strata
        const hw = size * 0.34, hh = size * 0.22;
        ctx.fillStyle = 'rgba(80,40,10,0.28)';
        ctx.beginPath();
        ctx.moveTo(x - hw, y + hh * 0.6);
        ctx.lineTo(x - hw * 0.72, y - hh * 1.0);
        ctx.lineTo(x - hw * 0.10, y - hh * 1.10);
        ctx.lineTo(x + hw * 0.68, y - hh * 0.85);
        ctx.lineTo(x + hw, y + hh * 0.4);
        ctx.lineTo(x + hw * 0.60, y + hh * 0.7);
        ctx.closePath();
        ctx.fill();
        // Main slab
        ctx.fillStyle = '#b88540';
        ctx.beginPath();
        ctx.moveTo(x - hw, y + hh * 0.5);
        ctx.lineTo(x - hw * 0.72, y - hh);
        ctx.lineTo(x - hw * 0.10, y - hh * 1.10);
        ctx.lineTo(x + hw * 0.68, y - hh * 0.85);
        ctx.lineTo(x + hw, y + hh * 0.3);
        ctx.lineTo(x + hw * 0.60, y + hh * 0.6);
        ctx.closePath();
        ctx.fill();
        // Dark right face
        ctx.fillStyle = '#8a5e20';
        ctx.beginPath();
        ctx.moveTo(x + hw * 0.68, y - hh * 0.85);
        ctx.lineTo(x + hw, y + hh * 0.3);
        ctx.lineTo(x + hw * 0.60, y + hh * 0.6);
        ctx.lineTo(x + hw * 0.40, y + hh * 0.1);
        ctx.closePath();
        ctx.fill();
        // Top highlight face
        ctx.fillStyle = 'rgba(210,168,80,0.55)';
        ctx.beginPath();
        ctx.moveTo(x - hw * 0.72, y - hh);
        ctx.lineTo(x - hw * 0.10, y - hh * 1.10);
        ctx.lineTo(x + hw * 0.68, y - hh * 0.85);
        ctx.lineTo(x + hw * 0.20, y - hh * 0.50);
        ctx.closePath();
        ctx.fill();
        // Strata lines
        ctx.strokeStyle = 'rgba(80,45,8,0.35)';
        ctx.lineWidth = size * 0.012;
        for (let i = 0; i < 3; i++) {
            const ly = y - hh * 0.30 + i * hh * 0.46;
            ctx.beginPath();
            ctx.moveTo(x - hw * 0.78, ly);
            ctx.lineTo(x + hw * 0.60, ly + hh * 0.04);
            ctx.stroke();
        }
    }

export function renderDesertRock2(ctx, x, y, size) {
        // Two overlapping sandstone boulders
        ctx.fillStyle = 'rgba(80,40,10,0.28)';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.02, y - size * 0.02);
        ctx.quadraticCurveTo(x + size * 0.04, y - size * 0.18, x + size * 0.18, y - size * 0.20);
        ctx.quadraticCurveTo(x + size * 0.32, y - size * 0.16, x + size * 0.30, y + size * 0.02);
        ctx.quadraticCurveTo(x + size * 0.26, y + size * 0.12, x + size * 0.10, y + size * 0.12);
        ctx.quadraticCurveTo(x - size * 0.02, y + size * 0.10, x + size * 0.02, y - size * 0.02);
        ctx.closePath();
        ctx.fill();
        // Smaller boulder (back)
        ctx.fillStyle = '#d4a860';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.02, y - size * 0.02);
        ctx.quadraticCurveTo(x + size * 0.04, y - size * 0.18, x + size * 0.18, y - size * 0.20);
        ctx.quadraticCurveTo(x + size * 0.32, y - size * 0.16, x + size * 0.30, y + size * 0.02);
        ctx.quadraticCurveTo(x + size * 0.26, y + size * 0.12, x + size * 0.10, y + size * 0.12);
        ctx.quadraticCurveTo(x - size * 0.02, y + size * 0.10, x + size * 0.02, y - size * 0.02);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(80,42,10,0.42)';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.18, y - size * 0.20);
        ctx.quadraticCurveTo(x + size * 0.32, y - size * 0.16, x + size * 0.30, y + size * 0.02);
        ctx.quadraticCurveTo(x + size * 0.26, y + size * 0.12, x + size * 0.16, y + size * 0.12);
        ctx.lineTo(x + size * 0.20, y - size * 0.06);
        ctx.closePath();
        ctx.fill();
        // Larger boulder (front)
        ctx.fillStyle = '#c49050';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.30, y + size * 0.10);
        ctx.quadraticCurveTo(x - size * 0.34, y - size * 0.04, x - size * 0.20, y - size * 0.18);
        ctx.quadraticCurveTo(x - size * 0.06, y - size * 0.24, x + size * 0.10, y - size * 0.16);
        ctx.quadraticCurveTo(x + size * 0.18, y - size * 0.06, x + size * 0.14, y + size * 0.10);
        ctx.quadraticCurveTo(x - size * 0.06, y + size * 0.18, x - size * 0.30, y + size * 0.10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(80,40,10,0.42)';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.10, y - size * 0.16);
        ctx.quadraticCurveTo(x + size * 0.18, y - size * 0.06, x + size * 0.14, y + size * 0.10);
        ctx.quadraticCurveTo(x + size * 0.02, y + size * 0.14, x + size * 0.02, y + size * 0.02);
        ctx.quadraticCurveTo(x + size * 0.08, y - size * 0.06, x + size * 0.10, y - size * 0.16);
        ctx.closePath();
        ctx.fill();
        // Highlight on larger boulder
        ctx.fillStyle = 'rgba(220,178,96,0.40)';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.20, y - size * 0.18);
        ctx.quadraticCurveTo(x - size * 0.08, y - size * 0.22, x + size * 0.02, y - size * 0.18);
        ctx.quadraticCurveTo(x - size * 0.06, y - size * 0.08, x - size * 0.16, y - size * 0.08);
        ctx.closePath();
        ctx.fill();
    }

export function renderDesertRock3(ctx, x, y, size) {
        // Cluster of small sandstone pebbles
        ctx.fillStyle = '#c49050';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.26, y + size * 0.14);
        ctx.quadraticCurveTo(x - size * 0.28, y + size * 0.02, x - size * 0.18, y - size * 0.06);
        ctx.quadraticCurveTo(x - size * 0.04, y - size * 0.12, x + size * 0.04, y - size * 0.04);
        ctx.quadraticCurveTo(x + size * 0.06, y + size * 0.08, x - size * 0.06, y + size * 0.16);
        ctx.quadraticCurveTo(x - size * 0.18, y + size * 0.18, x - size * 0.26, y + size * 0.14);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(80,40,10,0.38)';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.04, y - size * 0.04);
        ctx.quadraticCurveTo(x + size * 0.06, y + size * 0.08, x - size * 0.06, y + size * 0.16);
        ctx.lineTo(x - size * 0.02, y + size * 0.04);
        ctx.closePath();
        ctx.fill();
        // Second stone
        ctx.fillStyle = '#b88040';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.06, y + size * 0.08);
        ctx.quadraticCurveTo(x + size * 0.04, y - size * 0.04, x + size * 0.16, y - size * 0.08);
        ctx.quadraticCurveTo(x + size * 0.26, y - size * 0.04, x + size * 0.24, y + size * 0.06);
        ctx.quadraticCurveTo(x + size * 0.18, y + size * 0.12, x + size * 0.06, y + size * 0.08);
        ctx.closePath();
        ctx.fill();
        // Third stone
        ctx.fillStyle = '#d4aa62';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.04, y + size * 0.18);
        ctx.quadraticCurveTo(x - size * 0.02, y + size * 0.10, x + size * 0.08, y + size * 0.12);
        ctx.quadraticCurveTo(x + size * 0.12, y + size * 0.18, x + size * 0.04, y + size * 0.22);
        ctx.quadraticCurveTo(x - size * 0.04, y + size * 0.22, x - size * 0.04, y + size * 0.18);
        ctx.closePath();
        ctx.fill();
        // Fourth small stone
        ctx.fillStyle = '#c0924a';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.08, y - size * 0.10);
        ctx.quadraticCurveTo(x - size * 0.04, y - size * 0.16, x + size * 0.06, y - size * 0.14);
        ctx.quadraticCurveTo(x + size * 0.10, y - size * 0.10, x + size * 0.06, y - size * 0.06);
        ctx.quadraticCurveTo(x - size * 0.02, y - size * 0.04, x - size * 0.08, y - size * 0.10);
        ctx.closePath();
        ctx.fill();
        // Highlights
        ctx.fillStyle = 'rgba(220,178,96,0.42)';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.20, y - size * 0.02);
        ctx.quadraticCurveTo(x - size * 0.10, y - size * 0.10, x + size * 0.02, y - size * 0.06);
        ctx.quadraticCurveTo(x, y + size * 0.02, x - size * 0.12, y + size * 0.02);
        ctx.quadraticCurveTo(x - size * 0.22, y + size * 0.02, x - size * 0.20, y - size * 0.02);
        ctx.closePath();
        ctx.fill();
    }

export function renderSpaceRock(ctx, x, y, size, gridX, gridY, variant) {
        const seed = (variant !== undefined && variant !== null) ? variant % 5 : Math.floor(gridX * 0.5 + gridY * 0.7) % 5;
        const scaledSize = size;
        switch(seed) {
            case 0:
                renderSpaceRockFractal(ctx, x, y, scaledSize);
                break;
            case 1:
                renderSpaceRockSpiky(ctx, x, y, scaledSize);
                break;
            case 2:
                renderSpaceRockCrystalline(ctx, x, y, scaledSize);
                break;
            case 3:
                renderSpaceRockVoid(ctx, x, y, scaledSize);
                break;
            default:
                renderSpaceRockNonEuclidean(ctx, x, y, scaledSize);
        }
    }

export function renderSpaceRockFractal(ctx, x, y, size) {
        // Impossible angle asteroid with fractal pattern
        ctx.fillStyle = '#5a4a7a';
        
        // Main jagged form
        const points = [
            {x: -0.25, y: -0.3},
            {x: 0.15, y: -0.35},
            {x: 0.28, y: -0.1},
            {x: 0.35, y: 0.15},
            {x: 0.2, y: 0.3},
            {x: -0.1, y: 0.35},
            {x: -0.32, y: 0.1},
            {x: -0.3, y: -0.15}
        ];
        
        ctx.beginPath();
        ctx.moveTo(x + points[0].x * size, y + points[0].y * size);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(x + points[i].x * size, y + points[i].y * size);
        }
        ctx.closePath();
        ctx.fill();

        // Glowing edges
        ctx.strokeStyle = 'rgba(150, 100, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + points[0].x * size, y + points[0].y * size);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(x + points[i].x * size, y + points[i].y * size);
        }
        ctx.closePath();
        ctx.stroke();

        // Highlight face (lighter face on top-left)
        ctx.fillStyle = 'rgba(120, 88, 180, 0.55)';
        ctx.beginPath();
        ctx.moveTo(x + points[0].x * size, y + points[0].y * size);
        ctx.lineTo(x + points[1].x * size, y + points[1].y * size);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fill();
        // Mineral veins
        ctx.strokeStyle = 'rgba(180, 140, 255, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x - size*0.05, y - size*0.20); ctx.lineTo(x + size*0.12, y + size*0.15); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - size*0.18, y + size*0.05); ctx.lineTo(x + size*0.10, y - size*0.08); ctx.stroke();
    }

export function renderSpaceRockSpiky(ctx, x, y, size) {
        // Jagged asteroid with bioluminescent spikes
        ctx.fillStyle = '#6a4a8a';
        
        // Main body
        ctx.beginPath();
        ctx.arc(x, y, size * 0.22, 0, Math.PI * 2);
        ctx.fill();

        // Spike protrusions in all directions
        const spikeCount = 12;
        for (let i = 0; i < spikeCount; i++) {
            const angle = (i / spikeCount) * Math.PI * 2;
            const baseX = x + Math.cos(angle) * size * 0.22;
            const baseY = y + Math.sin(angle) * size * 0.22;
            const tipX = x + Math.cos(angle) * size * 0.35;
            const tipY = y + Math.sin(angle) * size * 0.35;

            // Spike body
            ctx.fillStyle = '#5a3a7a';
            ctx.beginPath();
            ctx.moveTo(baseX, baseY);
            ctx.lineTo(tipX, tipY);
            ctx.lineTo(baseX + Math.cos(angle + 0.2) * size * 0.08, baseY + Math.sin(angle + 0.2) * size * 0.08);
            ctx.closePath();
            ctx.fill();

            // Bioluminescent glow on spike
            ctx.strokeStyle = `rgba(100, ${150 + Math.sin(i) * 50}, 255, 0.8)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(baseX, baseY);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();
        }

        // Glow core
        ctx.fillStyle = 'rgba(100, 150, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.18, 0, Math.PI * 2);
        ctx.fill();
    }

export function renderSpaceRockCrystalline(ctx, x, y, size) {
        // Crystalline hexagonal structure
        const hexagonSize = size * 0.25;
        
        // Main crystal body
        ctx.fillStyle = '#7a5aaa';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const px = x + Math.cos(angle) * hexagonSize;
            const py = y + Math.sin(angle) * hexagonSize;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Inner crystal layers
        ctx.fillStyle = '#9a7aaa';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const px = x + Math.cos(angle) * hexagonSize * 0.6;
            const py = y + Math.sin(angle) * hexagonSize * 0.6;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Radiating glow rays
        ctx.strokeStyle = 'rgba(200, 150, 255, 0.7)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const startX = x + Math.cos(angle) * hexagonSize;
            const startY = y + Math.sin(angle) * hexagonSize;
            const endX = x + Math.cos(angle) * hexagonSize * 1.4;
            const endY = y + Math.sin(angle) * hexagonSize * 1.4;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }

        // Center glow
        ctx.fillStyle = 'rgba(200, 150, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }

export function renderSpaceRockVoid(ctx, x, y, size) {
        // Floating chunk with impossible topology
        // Outer distorted form
        ctx.fillStyle = '#4a3a6a';
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const distortion = 0.15 + Math.sin(angle * 3) * 0.1;
            const px = x + Math.cos(angle) * size * distortion;
            const py = y + Math.sin(angle) * size * distortion;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Energy field distortion ring
        ctx.strokeStyle = 'rgba(150, 100, 200, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const radius = size * (0.2 + Math.sin(angle * 4) * 0.08);
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        // Void core
        ctx.fillStyle = 'rgba(20, 10, 40, 0.9)';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.12, 0, Math.PI * 2);
        ctx.fill();

        // Void event horizon
        ctx.strokeStyle = 'rgba(200, 100, 255, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.12, 0, Math.PI * 2);
        ctx.stroke();
    }

export function renderSpaceRockNonEuclidean(ctx, x, y, size) {
        // Non-euclidean geometry rock with bezier curves
        ctx.fillStyle = '#6a4a9a';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.25, y - size * 0.2);
        ctx.bezierCurveTo(
            x - size * 0.3, y - size * 0.35,
            x + size * 0.1, y - size * 0.4,
            x + size * 0.3, y - size * 0.1
        );
        ctx.lineTo(x + size * 0.2, y + size * 0.15);
        ctx.bezierCurveTo(
            x + size * 0.05, y + size * 0.3,
            x - size * 0.15, y + size * 0.25,
            x - size * 0.25, y + size * 0.05
        );
        ctx.closePath();
        ctx.fill();

        // Second overlapping surface
        ctx.fillStyle = '#7a5aaa';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.15, y - size * 0.25);
        ctx.bezierCurveTo(
            x - size * 0.05, y - size * 0.38,
            x + size * 0.25, y - size * 0.3,
            x + size * 0.25, y);
        ctx.lineTo(x + size * 0.1, y + size * 0.2);
        ctx.bezierCurveTo(
            x - size * 0.05, y + size * 0.2,
            x - size * 0.2, y + size * 0.1,
            x - size * 0.15, y - size * 0.1
        );
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        // Energy flowing between surfaces
        ctx.strokeStyle = 'rgba(150, 100, 255, 0.6)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const progress = i / 5;
            const startX = x - size * 0.25 + size * 0.5 * progress;
            const startY = y - size * 0.2;
            const endX = x - size * 0.25 + size * 0.5 * progress;
            const endY = y + size * 0.2;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(
                startX + Math.sin(progress * Math.PI * 4) * size * 0.1,
                (startY + endY) * 0.5,
                endX, endY
            );
            ctx.stroke();
        }

        // Edge glow
        ctx.strokeStyle = 'rgba(150, 100, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.25, y - size * 0.2);
        ctx.bezierCurveTo(
            x - size * 0.3, y - size * 0.35,
            x + size * 0.1, y - size * 0.4,
            x + size * 0.3, y - size * 0.1
        );
        ctx.stroke();
    }

export function renderForestRock(ctx, x, y, size, gridX, gridY, variant) {
        const seed = (variant !== undefined && variant !== null) ? variant % 4 : Math.floor(gridX * 0.5 + gridY * 0.7) % 4;
        switch(seed) {
            case 0: renderForestRock0(ctx, x, y, size); break;
            case 1: renderForestRock1(ctx, x, y, size); break;
            case 2: renderForestRock2(ctx, x, y, size); break;
            default: renderForestRock3(ctx, x, y, size);
        }
    }

export function renderForestRock0(ctx, x, y, size) {
        // Rounded grey boulder with natural irregular shape and shading
        ctx.fillStyle = '#6a7880';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.28, y + size * 0.12);
        ctx.quadraticCurveTo(x - size * 0.34, y - size * 0.06, x - size * 0.18, y - size * 0.22);
        ctx.quadraticCurveTo(x - size * 0.04, y - size * 0.28, x + size * 0.12, y - size * 0.24);
        ctx.quadraticCurveTo(x + size * 0.30, y - size * 0.16, x + size * 0.32, y + size * 0.02);
        ctx.quadraticCurveTo(x + size * 0.30, y + size * 0.16, x + size * 0.10, y + size * 0.20);
        ctx.quadraticCurveTo(x - size * 0.10, y + size * 0.22, x - size * 0.28, y + size * 0.12);
        ctx.closePath();
        ctx.fill();
        // Shadow/dark face on right side
        ctx.fillStyle = 'rgba(38, 48, 58, 0.45)';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.12, y - size * 0.24);
        ctx.quadraticCurveTo(x + size * 0.30, y - size * 0.16, x + size * 0.32, y + size * 0.02);
        ctx.quadraticCurveTo(x + size * 0.30, y + size * 0.16, x + size * 0.10, y + size * 0.20);
        ctx.lineTo(x + size * 0.04, y + size * 0.06);
        ctx.quadraticCurveTo(x + size * 0.14, y - size * 0.08, x + size * 0.12, y - size * 0.24);
        ctx.closePath();
        ctx.fill();
        // Highlight on upper-left
        ctx.fillStyle = 'rgba(180, 195, 210, 0.40)';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.18, y - size * 0.22);
        ctx.quadraticCurveTo(x - size * 0.04, y - size * 0.28, x + size * 0.06, y - size * 0.24);
        ctx.quadraticCurveTo(x - size * 0.02, y - size * 0.12, x - size * 0.14, y - size * 0.08);
        ctx.quadraticCurveTo(x - size * 0.24, y - size * 0.10, x - size * 0.18, y - size * 0.22);
        ctx.closePath();
        ctx.fill();
    }

export function renderForestRock1(ctx, x, y, size) {
        // Angular slab with faceted faces
        const hw = size * 0.34, hh = size * 0.22;
        // Main face
        ctx.fillStyle = '#586470';
        ctx.beginPath();
        ctx.moveTo(x - hw, y + hh * 0.5);
        ctx.lineTo(x - hw * 0.72, y - hh);
        ctx.lineTo(x - hw * 0.10, y - hh * 1.10);
        ctx.lineTo(x + hw * 0.68, y - hh * 0.85);
        ctx.lineTo(x + hw, y + hh * 0.3);
        ctx.lineTo(x + hw * 0.60, y + hh * 0.6);
        ctx.closePath();
        ctx.fill();
        // Dark right face
        ctx.fillStyle = '#3a4550';
        ctx.beginPath();
        ctx.moveTo(x + hw * 0.68, y - hh * 0.85);
        ctx.lineTo(x + hw, y + hh * 0.3);
        ctx.lineTo(x + hw * 0.60, y + hh * 0.6);
        ctx.lineTo(x + hw * 0.40, y + hh * 0.1);
        ctx.closePath();
        ctx.fill();
        // Lighter top face
        ctx.fillStyle = 'rgba(130, 145, 160, 0.50)';
        ctx.beginPath();
        ctx.moveTo(x - hw * 0.72, y - hh);
        ctx.lineTo(x - hw * 0.10, y - hh * 1.10);
        ctx.lineTo(x + hw * 0.68, y - hh * 0.85);
        ctx.lineTo(x + hw * 0.20, y - hh * 0.50);
        ctx.closePath();
        ctx.fill();
        // Crack detail
        ctx.strokeStyle = 'rgba(30, 40, 48, 0.30)';
        ctx.lineWidth = size * 0.012;
        ctx.beginPath();
        ctx.moveTo(x - hw * 0.20, y - hh * 0.60);
        ctx.lineTo(x + hw * 0.10, y + hh * 0.10);
        ctx.lineTo(x + hw * 0.30, y + hh * 0.45);
        ctx.stroke();
    }

export function renderForestRock2(ctx, x, y, size) {
        // Two overlapping boulders with natural shapes
        // Back boulder (slightly behind)
        ctx.fillStyle = '#708090';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.02, y - size * 0.02);
        ctx.quadraticCurveTo(x + size * 0.04, y - size * 0.18, x + size * 0.18, y - size * 0.20);
        ctx.quadraticCurveTo(x + size * 0.32, y - size * 0.16, x + size * 0.30, y + size * 0.02);
        ctx.quadraticCurveTo(x + size * 0.26, y + size * 0.12, x + size * 0.10, y + size * 0.12);
        ctx.quadraticCurveTo(x - size * 0.02, y + size * 0.10, x + size * 0.02, y - size * 0.02);
        ctx.closePath();
        ctx.fill();
        // Back boulder shadow face
        ctx.fillStyle = 'rgba(40, 50, 62, 0.40)';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.18, y - size * 0.20);
        ctx.quadraticCurveTo(x + size * 0.32, y - size * 0.16, x + size * 0.30, y + size * 0.02);
        ctx.quadraticCurveTo(x + size * 0.26, y + size * 0.12, x + size * 0.16, y + size * 0.12);
        ctx.lineTo(x + size * 0.20, y - size * 0.06);
        ctx.closePath();
        ctx.fill();
        // Front boulder (overlapping)
        ctx.fillStyle = '#6a7a84';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.30, y + size * 0.10);
        ctx.quadraticCurveTo(x - size * 0.34, y - size * 0.04, x - size * 0.20, y - size * 0.18);
        ctx.quadraticCurveTo(x - size * 0.06, y - size * 0.24, x + size * 0.10, y - size * 0.16);
        ctx.quadraticCurveTo(x + size * 0.18, y - size * 0.06, x + size * 0.14, y + size * 0.10);
        ctx.quadraticCurveTo(x - size * 0.06, y + size * 0.18, x - size * 0.30, y + size * 0.10);
        ctx.closePath();
        ctx.fill();
        // Front boulder shadow
        ctx.fillStyle = 'rgba(40, 50, 60, 0.38)';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.10, y - size * 0.16);
        ctx.quadraticCurveTo(x + size * 0.18, y - size * 0.06, x + size * 0.14, y + size * 0.10);
        ctx.quadraticCurveTo(x + size * 0.02, y + size * 0.14, x + size * 0.02, y + size * 0.02);
        ctx.quadraticCurveTo(x + size * 0.08, y - size * 0.06, x + size * 0.10, y - size * 0.16);
        ctx.closePath();
        ctx.fill();
        // Front highlight
        ctx.fillStyle = 'rgba(175, 190, 205, 0.35)';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.20, y - size * 0.18);
        ctx.quadraticCurveTo(x - size * 0.08, y - size * 0.22, x + size * 0.02, y - size * 0.18);
        ctx.quadraticCurveTo(x - size * 0.06, y - size * 0.08, x - size * 0.16, y - size * 0.08);
        ctx.closePath();
        ctx.fill();
    }

export function renderForestRock3(ctx, x, y, size) {
        // Cluster of small stones with varied shapes
        // Stone 1 — largest, front-left
        ctx.fillStyle = '#6a7880';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.26, y + size * 0.14);
        ctx.quadraticCurveTo(x - size * 0.28, y + size * 0.02, x - size * 0.18, y - size * 0.06);
        ctx.quadraticCurveTo(x - size * 0.04, y - size * 0.12, x + size * 0.04, y - size * 0.04);
        ctx.quadraticCurveTo(x + size * 0.06, y + size * 0.08, x - size * 0.06, y + size * 0.16);
        ctx.quadraticCurveTo(x - size * 0.18, y + size * 0.18, x - size * 0.26, y + size * 0.14);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(40, 52, 62, 0.35)';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.04, y - size * 0.04);
        ctx.quadraticCurveTo(x + size * 0.06, y + size * 0.08, x - size * 0.06, y + size * 0.16);
        ctx.lineTo(x - size * 0.02, y + size * 0.04);
        ctx.closePath();
        ctx.fill();
        // Stone 2 — right
        ctx.fillStyle = '#5e6e78';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.06, y + size * 0.08);
        ctx.quadraticCurveTo(x + size * 0.04, y - size * 0.04, x + size * 0.16, y - size * 0.08);
        ctx.quadraticCurveTo(x + size * 0.26, y - size * 0.04, x + size * 0.24, y + size * 0.06);
        ctx.quadraticCurveTo(x + size * 0.18, y + size * 0.12, x + size * 0.06, y + size * 0.08);
        ctx.closePath();
        ctx.fill();
        // Stone 3 — small, front-center
        ctx.fillStyle = '#74848c';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.04, y + size * 0.18);
        ctx.quadraticCurveTo(x - size * 0.02, y + size * 0.10, x + size * 0.08, y + size * 0.12);
        ctx.quadraticCurveTo(x + size * 0.12, y + size * 0.18, x + size * 0.04, y + size * 0.22);
        ctx.quadraticCurveTo(x - size * 0.04, y + size * 0.22, x - size * 0.04, y + size * 0.18);
        ctx.closePath();
        ctx.fill();
        // Stone 4 — tiny, back
        ctx.fillStyle = '#667682';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.08, y - size * 0.10);
        ctx.quadraticCurveTo(x - size * 0.04, y - size * 0.16, x + size * 0.06, y - size * 0.14);
        ctx.quadraticCurveTo(x + size * 0.10, y - size * 0.10, x + size * 0.06, y - size * 0.06);
        ctx.quadraticCurveTo(x - size * 0.02, y - size * 0.04, x - size * 0.08, y - size * 0.10);
        ctx.closePath();
        ctx.fill();
    }

export function renderRockType1(ctx, x, y, size) {
        // Large rough jagged rock — fully opaque, no green tint
        
        // Drop shadow
        ctx.fillStyle = '#1a1a18';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.34, y + size * 0.23);
        ctx.lineTo(x - size * 0.36, y - size * 0.22);
        ctx.lineTo(x - size * 0.21, y - size * 0.38);
        ctx.lineTo(x + size * 0.06, y - size * 0.43);
        ctx.lineTo(x + size * 0.36, y - size * 0.13);
        ctx.lineTo(x + size * 0.35, y + size * 0.28);
        ctx.lineTo(x + 1, y + size * 0.42);
        ctx.closePath();
        ctx.fill();
        
        // Main rock body
        ctx.fillStyle = '#5e5e5e';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.35, y - size * 0.25);
        ctx.lineTo(x - size * 0.2, y - size * 0.4);
        ctx.lineTo(x + size * 0.05, y - size * 0.45);
        ctx.lineTo(x + size * 0.35, y - size * 0.15);
        ctx.lineTo(x + size * 0.32, y + size * 0.25);
        ctx.lineTo(x, y + size * 0.38);
        ctx.lineTo(x - size * 0.35, y + size * 0.2);
        ctx.closePath();
        ctx.fill();
        
        // Right shadow face
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.32, y + size * 0.25);
        ctx.lineTo(x + size * 0.35, y - size * 0.15);
        ctx.lineTo(x + size * 0.05, y - size * 0.45);
        ctx.lineTo(x + size * 0.08, y - size * 0.3);
        ctx.lineTo(x + size * 0.02, y + size * 0.32);
        ctx.closePath();
        ctx.fill();
        
        // Light highlights on upper faces
        ctx.fillStyle = '#8a8a8a';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.2, y - size * 0.4);
        ctx.lineTo(x + size * 0.05, y - size * 0.45);
        ctx.lineTo(x - size * 0.05, y - size * 0.25);
        ctx.closePath();
        ctx.fill();
        
        // Weathering spots — warm brown/tan, no green
        ctx.fillStyle = '#4a4440';
        for (let i = 0; i < 4; i++) {
            const offsetX = (Math.sin(i * 1.7 + x * 0.015) - 0.5) * size * 0.3;
            const offsetY = (Math.cos(i * 1.7 + y * 0.015) - 0.5) * size * 0.22;
            const spotSize = size * (0.06 + Math.abs(Math.sin(i * 0.7)) * 0.03);
            ctx.beginPath();
            ctx.arc(x + offsetX, y + offsetY, spotSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Rock cracks
        ctx.strokeStyle = '#2a2a28';
        ctx.lineWidth = 1.5;
        const crackCount = 2 + Math.floor(Math.abs(Math.sin(x * 0.02)) * 2);
        for (let i = 0; i < crackCount; i++) {
            const startX = (Math.sin(i * 0.7 + x * 0.01) - 0.5) * size * 0.3;
            const startY = (Math.cos(i * 0.7 + y * 0.01) - 0.5) * size * 0.2;
            const endX = startX + (Math.sin(i * 1.2 + x * 0.02) - 0.5) * size * 0.2;
            const endY = startY + (Math.cos(i * 1.2 + y * 0.02) - 0.5) * size * 0.15;
            ctx.beginPath();
            ctx.moveTo(x + startX, y + startY);
            ctx.lineTo(x + endX, y + endY);
            ctx.stroke();
        }
        
        // Outline
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.35, y - size * 0.25);
        ctx.lineTo(x - size * 0.2, y - size * 0.4);
        ctx.lineTo(x + size * 0.05, y - size * 0.45);
        ctx.lineTo(x + size * 0.35, y - size * 0.15);
        ctx.lineTo(x + size * 0.32, y + size * 0.25);
        ctx.lineTo(x, y + size * 0.38);
        ctx.lineTo(x - size * 0.35, y + size * 0.2);
        ctx.closePath();
        ctx.stroke();
    }

export function renderRockType2(ctx, x, y, size) {
        // Irregular boulder — NOT a circle, natural lumpy shape
        
        // Drop shadow
        ctx.fillStyle = '#1a1a18';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.30, y + size * 0.22);
        ctx.lineTo(x - size * 0.36, y + size * 0.05);
        ctx.lineTo(x - size * 0.28, y - size * 0.22);
        ctx.lineTo(x - size * 0.08, y - size * 0.34);
        ctx.lineTo(x + size * 0.20, y - size * 0.30);
        ctx.lineTo(x + size * 0.36, y - size * 0.10);
        ctx.lineTo(x + size * 0.34, y + size * 0.18);
        ctx.lineTo(x + size * 0.18, y + size * 0.30);
        ctx.lineTo(x - size * 0.10, y + size * 0.32);
        ctx.closePath();
        ctx.fill();
        
        // Main boulder body — irregular polygon
        ctx.fillStyle = '#636363';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.32, y + size * 0.18);
        ctx.lineTo(x - size * 0.38, y + size * 0.02);
        ctx.lineTo(x - size * 0.30, y - size * 0.20);
        ctx.lineTo(x - size * 0.10, y - size * 0.36);
        ctx.lineTo(x + size * 0.18, y - size * 0.32);
        ctx.lineTo(x + size * 0.34, y - size * 0.12);
        ctx.lineTo(x + size * 0.32, y + size * 0.15);
        ctx.lineTo(x + size * 0.16, y + size * 0.28);
        ctx.lineTo(x - size * 0.12, y + size * 0.30);
        ctx.closePath();
        ctx.fill();
        
        // Darker right/bottom face for dimension
        ctx.fillStyle = '#444444';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.34, y - size * 0.12);
        ctx.lineTo(x + size * 0.32, y + size * 0.15);
        ctx.lineTo(x + size * 0.16, y + size * 0.28);
        ctx.lineTo(x - size * 0.12, y + size * 0.30);
        ctx.lineTo(x - size * 0.05, y + size * 0.10);
        ctx.lineTo(x + size * 0.15, y - size * 0.05);
        ctx.closePath();
        ctx.fill();
        
        // Light highlight on upper-left
        ctx.fillStyle = '#9a9a9a';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.30, y - size * 0.20);
        ctx.lineTo(x - size * 0.10, y - size * 0.36);
        ctx.lineTo(x + size * 0.08, y - size * 0.28);
        ctx.lineTo(x - size * 0.12, y - size * 0.10);
        ctx.closePath();
        ctx.fill();
        
        // Secondary highlight
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.38, y + size * 0.02);
        ctx.lineTo(x - size * 0.30, y - size * 0.15);
        ctx.lineTo(x - size * 0.18, y - size * 0.02);
        ctx.lineTo(x - size * 0.28, y + size * 0.08);
        ctx.closePath();
        ctx.fill();
        
        // Weathering spots — warm brown tones, no green
        ctx.fillStyle = '#4e4844';
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + 0.5;
            const distance = size * (0.12 + Math.abs(Math.sin(i * 0.5)) * 0.08);
            const vx = x + Math.cos(angle) * distance;
            const vy = y + Math.sin(angle) * distance;
            const spotSize = size * (0.05 + Math.abs(Math.cos(i * 0.7)) * 0.03);
            ctx.beginPath();
            ctx.arc(vx, vy, spotSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Subtle cracks
        ctx.strokeStyle = '#2e2e2c';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.10, y - size * 0.15);
        ctx.lineTo(x + size * 0.10, y + size * 0.12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + size * 0.05, y - size * 0.20);
        ctx.lineTo(x + size * 0.20, y + size * 0.05);
        ctx.stroke();
        
        // Outline
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.32, y + size * 0.18);
        ctx.lineTo(x - size * 0.38, y + size * 0.02);
        ctx.lineTo(x - size * 0.30, y - size * 0.20);
        ctx.lineTo(x - size * 0.10, y - size * 0.36);
        ctx.lineTo(x + size * 0.18, y - size * 0.32);
        ctx.lineTo(x + size * 0.34, y - size * 0.12);
        ctx.lineTo(x + size * 0.32, y + size * 0.15);
        ctx.lineTo(x + size * 0.16, y + size * 0.28);
        ctx.lineTo(x - size * 0.12, y + size * 0.30);
        ctx.closePath();
        ctx.stroke();
    }

export function renderRockType3(ctx, x, y, size) {
        // Jagged angular rock — fully opaque, no green tint
        
        // Drop shadow
        ctx.fillStyle = '#1a1a18';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.34, y + size * 0.28);
        ctx.lineTo(x - size * 0.36, y - size * 0.09);
        ctx.lineTo(x - size * 0.1, y - size * 0.37);
        ctx.lineTo(x + size * 0.32, y - size * 0.17);
        ctx.lineTo(x + size * 0.36, y + size * 0.31);
        ctx.closePath();
        ctx.fill();
        
        // Main rock body
        ctx.fillStyle = '#585858';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.36, y - size * 0.12);
        ctx.lineTo(x - size * 0.1, y - size * 0.38);
        ctx.lineTo(x + size * 0.32, y - size * 0.18);
        ctx.lineTo(x + size * 0.35, y + size * 0.28);
        ctx.lineTo(x - size * 0.35, y + size * 0.25);
        ctx.closePath();
        ctx.fill();
        
        // Highlighted face (left side)
        ctx.fillStyle = '#8a8a8a';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.36, y - size * 0.12);
        ctx.lineTo(x - size * 0.1, y - size * 0.38);
        ctx.lineTo(x + size * 0.15, y - size * 0.1);
        ctx.closePath();
        ctx.fill();
        
        // Darker right side face
        ctx.fillStyle = '#3e3e3e';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.1, y - size * 0.38);
        ctx.lineTo(x + size * 0.32, y - size * 0.18);
        ctx.lineTo(x + size * 0.15, y - size * 0.1);
        ctx.closePath();
        ctx.fill();
        
        // Weathering spots — warm brown, no green
        ctx.fillStyle = '#4a4440';
        for (let i = 0; i < 4; i++) {
            const offsetX = (Math.sin(i * 1.5 + x * 0.01) - 0.5) * size * 0.28;
            const offsetY = (Math.cos(i * 1.5 + y * 0.01) - 0.5) * size * 0.20;
            const spotSize = size * (0.05 + Math.abs(Math.sin(i * 0.6)) * 0.03);
            ctx.beginPath();
            ctx.arc(x + offsetX, y + offsetY, spotSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Cracks
        ctx.strokeStyle = '#2a2a28';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.1, y - size * 0.2);
        ctx.lineTo(x + size * 0.1, y + size * 0.12);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x - size * 0.05, y - size * 0.35);
        ctx.lineTo(x + size * 0.15, y - size * 0.05);
        ctx.stroke();
        
        // Outline
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.36, y - size * 0.12);
        ctx.lineTo(x - size * 0.1, y - size * 0.38);
        ctx.lineTo(x + size * 0.32, y - size * 0.18);
        ctx.lineTo(x + size * 0.35, y + size * 0.28);
        ctx.lineTo(x - size * 0.35, y + size * 0.25);
        ctx.closePath();
        ctx.stroke();
    }

export function renderRockType4(ctx, x, y, size) {
        // Jagged rocky formation — fully opaque, no green tint
        
        // Drop shadow
        ctx.fillStyle = '#1a1a18';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.05, y + size * 0.24, size * 0.38, size * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Main rock body - irregular polygon
        ctx.fillStyle = '#5e5e5e';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.25, y + size * 0.2);
        ctx.lineTo(x - size * 0.35, y - size * 0.1);
        ctx.lineTo(x - size * 0.2, y - size * 0.32);
        ctx.lineTo(x + size * 0.05, y - size * 0.35);
        ctx.lineTo(x + size * 0.3, y - size * 0.15);
        ctx.lineTo(x + size * 0.32, y + size * 0.15);
        ctx.lineTo(x + size * 0.15, y + size * 0.22);
        ctx.closePath();
        ctx.fill();
        
        // Left highlighted face
        ctx.fillStyle = '#8a8a8a';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.25, y + size * 0.2);
        ctx.lineTo(x - size * 0.35, y - size * 0.1);
        ctx.lineTo(x - size * 0.2, y - size * 0.32);
        ctx.lineTo(x - size * 0.05, y - size * 0.1);
        ctx.closePath();
        ctx.fill();
        
        // Top bright face
        ctx.fillStyle = '#9a9a9a';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.2, y - size * 0.32);
        ctx.lineTo(x + size * 0.05, y - size * 0.35);
        ctx.lineTo(x + size * 0.15, y - size * 0.2);
        ctx.lineTo(x - size * 0.05, y - size * 0.15);
        ctx.closePath();
        ctx.fill();
        
        // Dark right face
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.05, y - size * 0.35);
        ctx.lineTo(x + size * 0.3, y - size * 0.15);
        ctx.lineTo(x + size * 0.2, y + size * 0.05);
        ctx.lineTo(x + size * 0.05, y - size * 0.1);
        ctx.closePath();
        ctx.fill();
        
        // Weathering stains — brown/tan, no green
        ctx.fillStyle = '#4a4440';
        for (let i = 0; i < 5; i++) {
            const offsetX = (Math.sin(i * 1.2 + x * 0.01) - 0.5) * size * 0.3;
            const offsetY = (Math.cos(i * 1.2 + y * 0.01) - 0.5) * size * 0.25;
            const spotSize = size * (0.05 + Math.abs(Math.sin(i * 0.6)) * 0.03);
            ctx.beginPath();
            ctx.arc(x + offsetX, y + offsetY, spotSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Cracks
        ctx.strokeStyle = '#2a2a28';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.15, y - size * 0.15);
        ctx.lineTo(x + size * 0.1, y + size * 0.1);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.25);
        ctx.lineTo(x - size * 0.1, y + size * 0.15);
        ctx.stroke();
        
        // Outline
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.25, y + size * 0.2);
        ctx.lineTo(x - size * 0.35, y - size * 0.1);
        ctx.lineTo(x - size * 0.2, y - size * 0.32);
        ctx.lineTo(x + size * 0.05, y - size * 0.35);
        ctx.lineTo(x + size * 0.3, y - size * 0.15);
        ctx.lineTo(x + size * 0.32, y + size * 0.15);
        ctx.lineTo(x + size * 0.15, y + size * 0.22);
        ctx.closePath();
        ctx.stroke();
    }

export function renderLakeCells(ctx, terrainElements, cellSize) {
        // Collect all lake cells from terrain elements into a set for efficient neighbor lookup
        if (!terrainElements) return;
        const lakeCellSet = new Set();
        for (const elem of terrainElements) {
            if (elem.type === 'water' && elem.waterType === 'lake') {
                lakeCellSet.add(`${Math.round(elem.gridX)},${Math.round(elem.gridY)}`);
            }
        }
        if (lakeCellSet.size === 0) return;

        const cs = cellSize;

        // First pass: fill each lake cell with water color
        lakeCellSet.forEach(key => {
            const [gx, gy] = key.split(',').map(Number);
            const px = gx * cs;
            const py = gy * cs;
            ctx.fillStyle = '#01579B';
            ctx.fillRect(px, py, cs, cs);
        });

        // Second pass: draw shore edges and highlight
        lakeCellSet.forEach(key => {
            const [gx, gy] = key.split(',').map(Number);
            const px = gx * cs;
            const py = gy * cs;

            const hasTop = lakeCellSet.has(`${gx},${gy - 1}`);
            const hasBottom = lakeCellSet.has(`${gx},${gy + 1}`);
            const hasLeft = lakeCellSet.has(`${gx - 1},${gy}`);
            const hasRight = lakeCellSet.has(`${gx + 1},${gy}`);

            // Dark shore edge where lake meets land
            ctx.strokeStyle = '#004D7A';
            ctx.lineWidth = Math.max(1, cs * 0.08);
            if (!hasTop) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + cs, py); ctx.stroke(); }
            if (!hasBottom) { ctx.beginPath(); ctx.moveTo(px, py + cs); ctx.lineTo(px + cs, py + cs); ctx.stroke(); }
            if (!hasLeft) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + cs); ctx.stroke(); }
            if (!hasRight) { ctx.beginPath(); ctx.moveTo(px + cs, py); ctx.lineTo(px + cs, py + cs); ctx.stroke(); }

            // Subtle wave highlight in center
            ctx.fillStyle = 'rgba(41, 182, 246, 0.15)';
            const inset = cs * 0.2;
            ctx.fillRect(px + inset, py + inset, cs - inset * 2, cs - inset * 2);
        });
    }

export function renderLake(ctx, x, y, size) {
        // Create organic water shape with rounded edges
        // Use 0.7 multiplier to match collision radius (size * 0.71 in markTerrainCells)
        const radius = size * 0.7;
        
        // Water gradient
        const gradient = ctx.createRadialGradient(x - size * 0.1, y - size * 0.1, 0, x, y, radius * 1.2);
        gradient.addColorStop(0, '#0277BD');
        gradient.addColorStop(0.6, '#01579B');
        gradient.addColorStop(1, '#004D7A');
        ctx.fillStyle = gradient;
        
        // Draw organic water shape with perlin-like noise using sine waves
        ctx.beginPath();
        const points = 16;
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            // Add sine-based variation to radius for organic look
            const noise = Math.sin(angle * 3 + x * 0.1 + y * 0.1) * 0.15 + Math.sin(angle * 7 + x * 0.05) * 0.1;
            const currentRadius = radius * (0.8 + noise);
            const px = x + Math.cos(angle) * currentRadius;
            const py = y + Math.sin(angle) * currentRadius;
            
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();
        
        // Water edge with soft border
        ctx.strokeStyle = '#0277BD';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Subtle wave reflections
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 2; i++) {
            const waveRadius = radius * (0.3 + i * 0.3);
            ctx.beginPath();
            const wavePoints = 12;
            for (let j = 0; j < wavePoints; j++) {
                const angle = (j / wavePoints) * Math.PI * 2;
                const waveNoise = Math.sin(angle * 2 + x * 0.1) * 0.1;
                const px = x + Math.cos(angle) * (waveRadius * (0.9 + waveNoise));
                const py = y + Math.sin(angle) * (waveRadius * (0.9 + waveNoise));
                if (j === 0) {
                    ctx.moveTo(px, py);
                } else {
                    ctx.lineTo(px, py);
                }
            }
            ctx.closePath();
            ctx.stroke();
        }
    }

export function renderRiver(ctx, x, y, size, flowAngle) {
        // River rendering is handled entirely by renderRiverSmooth()
        // No cell-based rendering needed - smooth line rendering creates the complete visualization
    }
    
export function renderRiverSmooth(ctx, terrainElements, cellSize) {
        // Draw smooth river paths using line rendering for automatic corner smoothing
        // This creates smooth corners where rivers meet
        if (!terrainElements) return;
        
        // Group river elements by connected segments
        const riverSegments = [];
        const processedIndices = new Set();
        
        for (let i = 0; i < terrainElements.length; i++) {
            const elem = terrainElements[i];
            if (elem.waterType !== 'river' || processedIndices.has(i)) continue;
            
            // Start a new river segment
            const segment = [elem];
            processedIndices.add(i);
            
            // Find connected river elements
            let added = true;
            while (added) {
                added = false;
                for (let j = 0; j < terrainElements.length; j++) {
                    if (processedIndices.has(j)) continue;
                    const candidate = terrainElements[j];
                    if (candidate.waterType !== 'river') continue;
                    
                    // Check if connected to end of segment
                    const lastElem = segment[segment.length - 1];
                    const dist = Math.hypot(
                        (candidate.gridX - lastElem.gridX) * cellSize,
                        (candidate.gridY - lastElem.gridY) * cellSize
                    );
                    
                    if (dist < cellSize * 2.5) {
                        segment.push(candidate);
                        processedIndices.add(j);
                        added = true;
                    }
                }
            }
            
            riverSegments.push(segment);
        }
        
        // Draw each river segment with smooth lines - filled shape with borders
        riverSegments.forEach(segment => {
            if (segment.length < 1) return;
            
            const path = segment.map(elem => ({
                x: elem.gridX * cellSize + cellSize / 2,
                y: elem.gridY * cellSize + cellSize / 2
            }));
            
            // Draw filled river shape with clear borders - matches designer appearance
            const riverWidthPixels = cellSize * 1.8;
            
            // Main river fill with smooth corners
            ctx.strokeStyle = '#0277BD';
            ctx.lineWidth = riverWidthPixels;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalAlpha = 0.95;
            
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i].x, path[i].y);
            }
            ctx.stroke();
            
            // Add darker center channel for depth
            ctx.strokeStyle = '#004D7A';
            ctx.lineWidth = riverWidthPixels * 0.5;
            ctx.globalAlpha = 0.8;
            
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i].x, path[i].y);
            }
            ctx.stroke();
            
            // Add light highlight for water shimmer
            ctx.strokeStyle = '#01579B';
            ctx.lineWidth = riverWidthPixels * 0.3;
            ctx.globalAlpha = 0.5;
            
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i].x, path[i].y);
            }
            ctx.stroke();
            
            ctx.globalAlpha = 1;
        });
    }

export function renderCactus(ctx, x, y, size, gridX, gridY) {
        // Use deterministic variation based on grid position
        const seed = Math.floor(gridX * 0.5 + gridY * 0.7) % 3;
        switch(seed) {
            case 0:
                renderCactusType1(ctx, x, y, size);
                break;
            case 1:
                renderCactusType2(ctx, x, y, size);
                break;
            default:
                renderCactusType3(ctx, x, y, size);
        }
    }

export function renderCactusType1(ctx, x, y, size) {
        renderCactusSaguaro(ctx, x, y, size);
    }

export function renderCactusType2(ctx, x, y, size) {
        renderCactusCholla(ctx, x, y, size);
    }

export function renderCactusType3(ctx, x, y, size) {
        renderCactusPricklyPear(ctx, x, y, size);
    }

export function renderDryBush(ctx, x, y, size, gridX, gridY) {
        // Use deterministic variation based on grid position
        const seed = Math.floor(gridX * 0.3 + gridY * 0.8) % 3;
        switch(seed) {
            case 0:
                renderDryBushType1(ctx, x, y, size);
                break;
            case 1:
                renderDryBushType2(ctx, x, y, size);
                break;
            default:
                renderDryBushType3(ctx, x, y, size);
        }
    }

export function renderDryBushType1(ctx, x, y, size) {
        renderDryDesertShrub(ctx, x, y, size);
    }

export function renderDryBushType2(ctx, x, y, size) {
        renderDesertBush(ctx, x, y, size);
    }

export function renderDryBushType3(ctx, x, y, size) {
        // Low spreading dry thorn bush — thin wide S-curve branches, thorns, dried seed tips
        const baseY = y - size * 0.01;
        // Ground shadow
        ctx.fillStyle = 'rgba(50,28,8,0.20)';
        ctx.beginPath();
        ctx.ellipse(x, y + 1, size * 0.30, size * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineCap = 'round';
        const brS = (x1, y1, cpx, cpy, x2, y2, w, col) => {
            ctx.strokeStyle = col; ctx.lineWidth = w;
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cpx, cpy, x2, y2); ctx.stroke();
        };
        const brC = (x1, y1, cpx1, cpy1, mx, my, cpx2, cpy2, x2, y2, w, col) => {
            ctx.strokeStyle = col; ctx.lineWidth = w;
            ctx.beginPath(); ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo(cpx1, cpy1, mx, my);
            ctx.quadraticCurveTo(cpx2, cpy2, x2, y2); ctx.stroke();
        };
        const thorns = (tx, ty, r, cnt, col) => {
            ctx.strokeStyle = col; ctx.lineWidth = 0.5;
            for (let i = 0; i < cnt; i++) {
                const a = (i / cnt) * Math.PI * 2;
                ctx.beginPath(); ctx.moveTo(tx, ty);
                ctx.lineTo(tx + Math.cos(a) * r, ty + Math.sin(a) * r); ctx.stroke();
            }
        };
        const seedHead = (fx, fy, r) => {
            ctx.fillStyle = '#7a5820';
            ctx.beginPath(); ctx.arc(fx, fy, r * 0.50, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#c09848'; ctx.lineWidth = 0.55;
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(fx + Math.cos(a) * r * 0.50, fy + Math.sin(a) * r * 0.50);
                ctx.lineTo(fx + Math.cos(a) * r * 1.3, fy + Math.sin(a) * r * 1.3);
                ctx.stroke();
            }
        };
        // Wide S-curve low branches — thin
        brC(x, baseY, x-size*0.10, baseY-size*0.02, x-size*0.20, baseY+size*0.00, x-size*0.28, baseY-size*0.02, x-size*0.36, baseY-size*0.06, size*0.036, '#7a6040');
        brC(x, baseY, x+size*0.10, baseY-size*0.02, x+size*0.20, baseY+size*0.00, x+size*0.28, baseY-size*0.02, x+size*0.36, baseY-size*0.05, size*0.034, '#7a6040');
        brC(x, baseY, x-size*0.04, baseY-size*0.08, x-size*0.02, baseY-size*0.16, x+size*0.04, baseY-size*0.18, x-size*0.07, baseY-size*0.26, size*0.032, '#7a6040');
        brC(x, baseY, x+size*0.04, baseY-size*0.08, x+size*0.08, baseY-size*0.16, x+size*0.14, baseY-size*0.18, x+size*0.10, baseY-size*0.25, size*0.031, '#7a6040');
        brS(x, baseY, x-size*0.14, baseY-size*0.07, x-size*0.24, baseY-size*0.16, size*0.030, '#7a6040');
        // Sub-branches
        brS(x-size*0.34, baseY-size*0.06, x-size*0.40, baseY-size*0.12, x-size*0.42, baseY-size*0.16, size*0.018, '#9a7850');
        brS(x+size*0.34, baseY-size*0.05, x+size*0.40, baseY-size*0.11, x+size*0.42, baseY-size*0.15, size*0.017, '#9a7850');
        brS(x-size*0.06, baseY-size*0.22, x-size*0.11, baseY-size*0.27, x-size*0.13, baseY-size*0.30, size*0.016, '#9a7850');
        brS(x+size*0.11, baseY-size*0.21, x+size*0.15, baseY-size*0.26, x+size*0.17, baseY-size*0.29, size*0.015, '#9a7850');
        brS(x-size*0.22, baseY-size*0.14, x-size*0.27, baseY-size*0.19, x-size*0.29, baseY-size*0.21, size*0.016, '#9a7850');
        // Fine end twigs
        brS(x-size*0.40, baseY-size*0.16, x-size*0.44, baseY-size*0.21, x-size*0.45, baseY-size*0.23, size*0.010, '#b8986a');
        brS(x+size*0.40, baseY-size*0.15, x+size*0.44, baseY-size*0.20, x+size*0.45, baseY-size*0.22, size*0.009, '#b8986a');
        brS(x-size*0.12, baseY-size*0.27, x-size*0.15, baseY-size*0.32, x-size*0.16, baseY-size*0.34, size*0.009, '#b8986a');
        brS(x+size*0.16, baseY-size*0.26, x+size*0.19, baseY-size*0.31, x+size*0.20, baseY-size*0.33, size*0.009, '#b8986a');
        // Thorn clusters at branch nodes
        thorns(x-size*0.22, baseY-size*0.02, size*0.020, 5, '#c8a868');
        thorns(x+size*0.22, baseY-size*0.01, size*0.019, 5, '#c8a868');
        thorns(x-size*0.22, baseY-size*0.14, size*0.018, 4, '#c8a868');
        thorns(x+size*0.11, baseY-size*0.18, size*0.017, 4, '#c8a868');
        // Dry seed heads at tallest tips
        seedHead(x-size*0.07, baseY-size*0.26, size*0.022);
        seedHead(x+size*0.10, baseY-size*0.24, size*0.020);
        // Tiny woody base
        ctx.fillStyle = '#4e3018';
        ctx.beginPath();
        ctx.arc(x, baseY, size * 0.016, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineCap = 'butt';
    }
