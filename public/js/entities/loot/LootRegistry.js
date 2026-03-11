/**
 * LootRegistry - Central registry for all loot types
 * Defines loot items with names, descriptions, types, and selling values
 * Two rarity levels: normal (brown bag) and rare (purple bag)
 * Icons are drawn via drawIcon(ctx, cx, cy, size) - no emoji used.
 */
export class LootRegistry {
    static #registry = {
        // ============ NORMAL LOOT (Brown Bag) ============
        'copper-coin': {
            name: 'Copper Coin',
            type: 'treasure',
            rarity: 'normal',
            sellValue: 25,
            description: 'An old copper coin from distant lands',
            drawIcon(ctx, cx, cy, size) {
                ctx.save();
                const r = size * 0.44;
                const g = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.05, cx, cy, r);
                g.addColorStop(0, '#F0C050'); g.addColorStop(0.5, '#C87533'); g.addColorStop(1, '#7A3E10');
                ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fillStyle = g; ctx.fill();
                ctx.strokeStyle = '#5A2E08'; ctx.lineWidth = 1.5; ctx.stroke();
                ctx.beginPath(); ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(90,46,8,0.4)'; ctx.lineWidth = 1; ctx.stroke();
                ctx.font = `bold ${Math.round(size * 0.42)}px serif`;
                ctx.fillStyle = 'rgba(90,46,8,0.72)';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('C', cx, cy + 1);
                ctx.beginPath(); ctx.arc(cx - r * 0.28, cy - r * 0.22, r * 0.18, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,200,0.35)'; ctx.fill();
                ctx.restore();
            }
        },
        'frog-talisman': {
            name: 'Frog Talisman',
            type: 'treasure',
            rarity: 'normal',
            sellValue: 35,
            description: 'A small frog charm for good luck',
            drawIcon(ctx, cx, cy, size) {
                ctx.save();
                const r = size * 0.42;
                ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.05, r * 0.85, r, 0, 0, Math.PI * 2);
                const g = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.05, cx, cy, r);
                g.addColorStop(0, '#8cdc60'); g.addColorStop(1, '#2d6e10');
                ctx.fillStyle = g; ctx.fill();
                ctx.strokeStyle = '#1e4e0a'; ctx.lineWidth = 1.5; ctx.stroke();
                [-1, 1].forEach(s => {
                    ctx.beginPath(); ctx.arc(cx + s * r * 0.44, cy - r * 0.52, r * 0.22, 0, Math.PI * 2);
                    ctx.fillStyle = '#55aa30'; ctx.fill();
                    ctx.strokeStyle = '#1e4e0a'; ctx.lineWidth = 1; ctx.stroke();
                    ctx.beginPath(); ctx.arc(cx + s * r * 0.44, cy - r * 0.52, r * 0.11, 0, Math.PI * 2);
                    ctx.fillStyle = '#1a0800'; ctx.fill();
                    ctx.beginPath(); ctx.arc(cx + s * r * 0.44 - s * r * 0.03, cy - r * 0.57, r * 0.04, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fill();
                });
                ctx.beginPath(); ctx.arc(cx, cy + r * 0.1, r * 0.4, 0.18, Math.PI - 0.18);
                ctx.strokeStyle = '#1e4e0a'; ctx.lineWidth = 1.5; ctx.stroke();
                ctx.restore();
            }
        },
        'iron-dagger': {
            name: 'Iron Dagger',
            type: 'weapon',
            rarity: 'normal',
            sellValue: 40,
            description: 'A sturdy iron dagger with a leather grip',
            drawIcon(ctx, cx, cy, size) {
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(cx, cy - size * 0.46);
                ctx.lineTo(cx + size * 0.11, cy + size * 0.06);
                ctx.lineTo(cx - size * 0.11, cy + size * 0.06);
                ctx.closePath();
                const bg = ctx.createLinearGradient(cx - size * 0.11, 0, cx + size * 0.11, 0);
                bg.addColorStop(0, '#888'); bg.addColorStop(0.5, '#ddd'); bg.addColorStop(1, '#666');
                ctx.fillStyle = bg; ctx.fill();
                ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.stroke();
                const cg = ctx.createLinearGradient(cx, cy + size * 0.04, cx, cy + size * 0.12);
                cg.addColorStop(0, '#B8860B'); cg.addColorStop(1, '#5A3808');
                ctx.fillStyle = cg;
                ctx.fillRect(cx - size * 0.18, cy + size * 0.04, size * 0.36, size * 0.08);
                ctx.strokeStyle = '#3a2000'; ctx.lineWidth = 0.8;
                ctx.strokeRect(cx - size * 0.18, cy + size * 0.04, size * 0.36, size * 0.08);
                const hg = ctx.createLinearGradient(cx - size * 0.07, 0, cx + size * 0.07, 0);
                hg.addColorStop(0, '#5c3d1f'); hg.addColorStop(0.5, '#8B5E30'); hg.addColorStop(1, '#3a2410');
                ctx.fillStyle = hg;
                ctx.fillRect(cx - size * 0.07, cy + size * 0.12, size * 0.14, size * 0.32);
                ctx.strokeStyle = '#2a1800'; ctx.lineWidth = 0.8;
                ctx.strokeRect(cx - size * 0.07, cy + size * 0.12, size * 0.14, size * 0.32);
                ctx.strokeStyle = 'rgba(60,30,10,0.5)'; ctx.lineWidth = 0.8;
                for (let i = 0; i < 3; i++) {
                    const wY = cy + size * 0.17 + i * size * 0.08;
                    ctx.beginPath(); ctx.moveTo(cx - size * 0.07, wY); ctx.lineTo(cx + size * 0.07, wY); ctx.stroke();
                }
                ctx.restore();
            }
        },
        'emerald-shard': {
            name: 'Emerald Shard',
            type: 'gem',
            rarity: 'normal',
            sellValue: 50,
            description: 'A fragment of precious emerald stone',
            drawIcon(ctx, cx, cy, size) {
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(cx, cy - size * 0.46);
                ctx.lineTo(cx + size * 0.28, cy - size * 0.08);
                ctx.lineTo(cx + size * 0.3, cy + size * 0.1);
                ctx.lineTo(cx, cy + size * 0.46);
                ctx.lineTo(cx - size * 0.3, cy + size * 0.1);
                ctx.lineTo(cx - size * 0.28, cy - size * 0.08);
                ctx.closePath();
                const g = ctx.createLinearGradient(cx, cy - size * 0.46, cx, cy + size * 0.46);
                g.addColorStop(0, '#a6f56a'); g.addColorStop(0.4, '#2ecc40'); g.addColorStop(1, '#0d6e20');
                ctx.fillStyle = g; ctx.fill();
                ctx.strokeStyle = '#0a4a15'; ctx.lineWidth = 1.5; ctx.stroke();
                ctx.strokeStyle = 'rgba(180,255,180,0.4)'; ctx.lineWidth = 0.8;
                ctx.beginPath(); ctx.moveTo(cx, cy - size * 0.46); ctx.lineTo(cx + size * 0.28, cy - size * 0.08); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx, cy - size * 0.46); ctx.lineTo(cx - size * 0.28, cy - size * 0.08); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx + size * 0.28, cy - size * 0.08); ctx.lineTo(cx - size * 0.28, cy - size * 0.08); ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx - size * 0.12, cy - size * 0.38); ctx.lineTo(cx, cy - size * 0.22); ctx.lineTo(cx - size * 0.22, cy - size * 0.04);
                ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fill();
                ctx.restore();
            }
        },
        'silver-brooch': {
            name: 'Silver Brooch',
            type: 'treasure',
            rarity: 'normal',
            sellValue: 45,
            description: 'An ornate silver brooch of fine craftsmanship',
            drawIcon(ctx, cx, cy, size) {
                ctx.save();
                const r = size * 0.44;
                ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
                const og = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
                og.addColorStop(0, '#E8E8E8'); og.addColorStop(0.5, '#C0C0C0'); og.addColorStop(1, '#808080');
                ctx.fillStyle = og; ctx.fill();
                ctx.strokeStyle = '#606060'; ctx.lineWidth = 2; ctx.stroke();
                ctx.beginPath(); ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
                const ig = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.05, cx, cy, r * 0.62);
                ig.addColorStop(0, '#F0F0F0'); ig.addColorStop(1, '#A0A0A0');
                ctx.fillStyle = ig; ctx.fill();
                ctx.strokeStyle = '#606060'; ctx.lineWidth = 1; ctx.stroke();
                const dotR = r * 0.07;
                for (let i = 0; i < 8; i++) {
                    const a = (i / 8) * Math.PI * 2 - Math.PI / 8;
                    ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r * 0.81, cy + Math.sin(a) * r * 0.81, dotR, 0, Math.PI * 2);
                    ctx.fillStyle = '#888'; ctx.fill();
                }
                ctx.beginPath(); ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
                ctx.fillStyle = '#7B9FD4'; ctx.fill();
                ctx.strokeStyle = '#3060A0'; ctx.lineWidth = 0.8; ctx.stroke();
                ctx.beginPath(); ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.15, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill();
                ctx.restore();
            }
        },
        'sapphire-crystal': {
            name: 'Sapphire Crystal',
            type: 'gem',
            rarity: 'normal',
            sellValue: 55,
            description: 'A brilliant blue sapphire crystal',
            drawIcon(ctx, cx, cy, size) {
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(cx, cy - size * 0.48);
                ctx.lineTo(cx + size * 0.2, cy - size * 0.22);
                ctx.lineTo(cx + size * 0.24, cy + size * 0.18);
                ctx.lineTo(cx + size * 0.1, cy + size * 0.48);
                ctx.lineTo(cx - size * 0.1, cy + size * 0.48);
                ctx.lineTo(cx - size * 0.24, cy + size * 0.18);
                ctx.lineTo(cx - size * 0.2, cy - size * 0.22);
                ctx.closePath();
                const g = ctx.createLinearGradient(cx - size * 0.24, cy - size * 0.48, cx + size * 0.24, cy + size * 0.48);
                g.addColorStop(0, '#aad8ff'); g.addColorStop(0.3, '#4488FF'); g.addColorStop(0.7, '#1A5FCC'); g.addColorStop(1, '#001880');
                ctx.fillStyle = g; ctx.fill();
                ctx.strokeStyle = '#001878'; ctx.lineWidth = 1.5; ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx, cy - size * 0.48); ctx.lineTo(cx + size * 0.2, cy - size * 0.22); ctx.lineTo(cx - size * 0.2, cy - size * 0.22);
                ctx.closePath(); ctx.fillStyle = 'rgba(180,220,255,0.32)'; ctx.fill();
                ctx.strokeStyle = 'rgba(220,240,255,0.5)'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.moveTo(cx - size * 0.05, cy - size * 0.36); ctx.lineTo(cx + size * 0.05, cy + size * 0.12); ctx.stroke();
                ctx.restore();
            }
        },
        'leather-purse': {
            name: 'Leather Purse',
            type: 'treasure',
            rarity: 'normal',
            sellValue: 30,
            description: 'A worn leather pouch, well-used but sturdy',
            drawIcon(ctx, cx, cy, size) {
                ctx.save();
                const w = size * 0.76, h = size * 0.68;
                const bx = cx - w / 2, by = cy - h * 0.28;
                const rad = size * 0.16;
                ctx.beginPath();
                ctx.moveTo(bx + rad, by);
                ctx.lineTo(bx + w - rad, by);
                ctx.arcTo(bx + w, by, bx + w, by + rad, rad);
                ctx.lineTo(bx + w, by + h - rad);
                ctx.arcTo(bx + w, by + h, bx + w - rad, by + h, rad);
                ctx.lineTo(bx + rad, by + h);
                ctx.arcTo(bx, by + h, bx, by + h - rad, rad);
                ctx.lineTo(bx, by + rad);
                ctx.arcTo(bx, by, bx + rad, by, rad);
                ctx.closePath();
                const g = ctx.createLinearGradient(cx, by, cx, by + h);
                g.addColorStop(0, '#b07848'); g.addColorStop(0.5, '#7a4e28'); g.addColorStop(1, '#4a2e10');
                ctx.fillStyle = g; ctx.fill();
                ctx.strokeStyle = '#3a1e08'; ctx.lineWidth = 1.5; ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(bx + size * 0.08, by);
                ctx.quadraticCurveTo(cx, by - size * 0.2, bx + w - size * 0.08, by);
                ctx.strokeStyle = '#5a3818'; ctx.lineWidth = 1; ctx.stroke();
                ctx.beginPath(); ctx.arc(cx, by - size * 0.1, size * 0.055, 0, Math.PI * 2);
                ctx.fillStyle = '#B8860B'; ctx.fill();
                ctx.strokeStyle = 'rgba(180,130,70,0.5)'; ctx.lineWidth = 0.8;
                ctx.setLineDash([2, 2]);
                ctx.beginPath(); ctx.moveTo(bx + size * 0.1, by + h - size * 0.12); ctx.lineTo(bx + w - size * 0.1, by + h - size * 0.12); ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            }
        },
        'bronze-medallion': {
            name: 'Bronze Medallion',
            type: 'treasure',
            rarity: 'normal',
            sellValue: 48,
            description: 'An ancient bronze medallion with strange markings',
            drawIcon(ctx, cx, cy, size) {
                ctx.save();
                const r = size * 0.44;
                ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
                const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
                g.addColorStop(0, '#e0a040'); g.addColorStop(0.5, '#C07020'); g.addColorStop(1, '#7A4010');
                ctx.fillStyle = g; ctx.fill();
                ctx.strokeStyle = '#5a2e08'; ctx.lineWidth = 2; ctx.stroke();
                ctx.beginPath(); ctx.arc(cx, cy, r * 0.75, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(90,46,8,0.4)'; ctx.lineWidth = 1; ctx.stroke();
                ctx.save(); ctx.translate(cx, cy);
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const a = (i / 8) * Math.PI * 2;
                    const a2 = a + Math.PI / 8;
                    const x1 = Math.cos(a) * r * 0.6, y1 = Math.sin(a) * r * 0.6;
                    const x2 = Math.cos(a2) * r * 0.28, y2 = Math.sin(a2) * r * 0.28;
                    if (i === 0) ctx.moveTo(x1, y1); else ctx.lineTo(x1, y1);
                    ctx.lineTo(x2, y2);
                }
                ctx.closePath();
                ctx.fillStyle = 'rgba(90,46,8,0.35)'; ctx.fill();
                ctx.strokeStyle = 'rgba(90,46,8,0.5)'; ctx.lineWidth = 0.8; ctx.stroke();
                ctx.restore();
                ctx.beginPath(); ctx.arc(cx, cy, r * 0.12, 0, Math.PI * 2);
                ctx.fillStyle = '#5a2e08'; ctx.fill();
                ctx.restore();
            }
        },
        'ruby-fragment': {
            name: 'Ruby Fragment',
            type: 'gem',
            rarity: 'normal',
            sellValue: 52,
            description: 'A deep red ruby shard, quite valuable',
            drawIcon(ctx, cx, cy, size) {
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(cx - size * 0.08, cy - size * 0.46);
                ctx.lineTo(cx + size * 0.3, cy - size * 0.18);
                ctx.lineTo(cx + size * 0.32, cy + size * 0.1);
                ctx.lineTo(cx + size * 0.12, cy + size * 0.44);
                ctx.lineTo(cx - size * 0.28, cy + size * 0.28);
                ctx.lineTo(cx - size * 0.32, cy - size * 0.1);
                ctx.closePath();
                const g = ctx.createLinearGradient(cx, cy - size * 0.46, cx, cy + size * 0.44);
                g.addColorStop(0, '#FF8888'); g.addColorStop(0.4, '#CC2020'); g.addColorStop(1, '#600010');
                ctx.fillStyle = g; ctx.fill();
                ctx.strokeStyle = '#500010'; ctx.lineWidth = 1.5; ctx.stroke();
                ctx.strokeStyle = 'rgba(255,180,180,0.45)'; ctx.lineWidth = 0.8;
                ctx.beginPath(); ctx.moveTo(cx - size * 0.08, cy - size * 0.46); ctx.lineTo(cx + size * 0.3, cy - size * 0.18); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx - size * 0.08, cy - size * 0.46); ctx.lineTo(cx - size * 0.32, cy - size * 0.1); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx + size * 0.3, cy - size * 0.18); ctx.lineTo(cx - size * 0.32, cy - size * 0.1); ctx.stroke();
                ctx.restore();
            }
        },
        'wooden-amulet': {
            name: 'Wooden Amulet',
            type: 'treasure',
            rarity: 'normal',
            sellValue: 28,
            description: 'A frog-carved wooden amulet for protection',
            drawIcon(ctx, cx, cy, size) {
                ctx.save();
                const r = size * 0.42;
                ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
                const g = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.05, cx, cy, r);
                g.addColorStop(0, '#d4a060'); g.addColorStop(0.6, '#a06030'); g.addColorStop(1, '#6a3a18');
                ctx.fillStyle = g; ctx.fill();
                ctx.strokeStyle = '#4a2210'; ctx.lineWidth = 2; ctx.stroke();
                ctx.strokeStyle = 'rgba(74,34,16,0.3)'; ctx.lineWidth = 0.6;
                for (let i = 1; i <= 3; i++) {
                    ctx.beginPath(); ctx.arc(cx + r * 0.1, cy, r * (0.28 + i * 0.15), 0, Math.PI * 2); ctx.stroke();
                }
                ctx.beginPath(); ctx.arc(cx, cy - r * 0.78, r * 0.1, 0, Math.PI * 2);
                ctx.fillStyle = '#3a1808'; ctx.fill();
                const fr = r * 0.48;
                const fcy = cy + r * 0.06;
                ctx.beginPath(); ctx.ellipse(cx, fcy, fr, fr * 0.88, 0, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(60,28,8,0.75)'; ctx.lineWidth = 1; ctx.stroke();
                ctx.fillStyle = 'rgba(90,50,16,0.18)'; ctx.fill();
                [-1, 1].forEach(s => {
                    ctx.beginPath(); ctx.arc(cx + s * fr * 0.44, fcy - fr * 0.32, fr * 0.2, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(60,28,8,0.8)'; ctx.lineWidth = 0.9; ctx.stroke();
                    ctx.beginPath(); ctx.arc(cx + s * fr * 0.44, fcy - fr * 0.32, fr * 0.1, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(30,14,4,0.7)'; ctx.fill();
                });
                ctx.beginPath(); ctx.arc(cx, fcy + fr * 0.18, fr * 0.32, 0.2, Math.PI - 0.2);
                ctx.strokeStyle = 'rgba(60,28,8,0.7)'; ctx.lineWidth = 1; ctx.stroke();
                ctx.restore();
            }
        },

        // ============ RARE LOOT (Purple Bag) ============
        'dragon-eye': {
            name: 'Dragon\'s Eye',
            type: 'gem',
            rarity: 'rare',
            sellValue: 180,
            description: 'A legendary gemstone that glows like a dragon\'s gaze',
            drawIcon(ctx, cx, cy, size) {
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(cx - size * 0.44, cy);
                ctx.quadraticCurveTo(cx, cy - size * 0.28, cx + size * 0.44, cy);
                ctx.quadraticCurveTo(cx, cy + size * 0.28, cx - size * 0.44, cy);
                ctx.closePath();
                const g = ctx.createRadialGradient(cx, cy, size * 0.02, cx, cy, size * 0.44);
                g.addColorStop(0, '#220800'); g.addColorStop(0.25, '#FF8000'); g.addColorStop(0.55, '#D46010'); g.addColorStop(1, '#280800');
                ctx.fillStyle = g; ctx.fill();
                ctx.strokeStyle = '#1a0400'; ctx.lineWidth = 1.5; ctx.stroke();
                const irisR = size * 0.18;
                for (let i = 0; i < 8; i++) {
                    const a = (i / 8) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.moveTo(cx + Math.cos(a) * irisR * 0.42, cy + Math.sin(a) * irisR * 0.42);
                    ctx.lineTo(cx + Math.cos(a) * irisR * 1.1, cy + Math.sin(a) * irisR * 1.1);
                    ctx.strokeStyle = 'rgba(212,160,32,0.45)'; ctx.lineWidth = 0.8; ctx.stroke();
                }
                ctx.beginPath(); ctx.ellipse(cx, cy, size * 0.05, size * 0.22, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#0a0200'; ctx.fill();
                ctx.beginPath(); ctx.ellipse(cx - size * 0.12, cy - size * 0.08, size * 0.04, size * 0.08, -0.4, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fill();
                ctx.restore();
            }
        },
        'frog-crown': {
            name: 'Frog King\'s Crown',
            type: 'treasure',
            rarity: 'rare',
            sellValue: 200,
            description: 'A tiny ornate crown fit for royalty of the amphibian world',
            drawIcon(ctx, cx, cy, size) {
                ctx.save();
                const r = size * 0.32;
                const headCY = cy + size * 0.12;
                ctx.beginPath(); ctx.ellipse(cx, headCY, r * 1.1, r, 0, 0, Math.PI * 2);
                const fg = ctx.createRadialGradient(cx - r * 0.2, headCY - r * 0.2, r * 0.05, cx, headCY, r * 1.1);
                fg.addColorStop(0, '#8cdc60'); fg.addColorStop(1, '#2d6e10');
                ctx.fillStyle = fg; ctx.fill();
                ctx.strokeStyle = '#1e4e0a'; ctx.lineWidth = 1.5; ctx.stroke();
                [-1, 1].forEach(s => {
                    ctx.beginPath(); ctx.arc(cx + s * r * 0.65, headCY - r * 0.35, r * 0.24, 0, Math.PI * 2);
                    ctx.fillStyle = '#55aa30'; ctx.fill();
                    ctx.strokeStyle = '#1e4e0a'; ctx.lineWidth = 1; ctx.stroke();
                    ctx.beginPath(); ctx.arc(cx + s * r * 0.65, headCY - r * 0.35, r * 0.12, 0, Math.PI * 2);
                    ctx.fillStyle = '#1a0800'; ctx.fill();
                    ctx.beginPath(); ctx.arc(cx + s * r * 0.65 - s * r * 0.04, headCY - r * 0.4, r * 0.04, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
                });
                ctx.beginPath(); ctx.arc(cx, headCY + r * 0.2, r * 0.45, 0.18, Math.PI - 0.18);
                ctx.strokeStyle = '#145008'; ctx.lineWidth = 1.5; ctx.stroke();
                const crownY = headCY - r * 0.68;
                const crownW = r * 1.7, crownH = r * 0.72;
                const crownX = cx - crownW / 2;
                ctx.beginPath();
                ctx.moveTo(crownX, crownY);
                ctx.lineTo(crownX, crownY - crownH * 0.55);
                ctx.lineTo(crownX + crownW * 0.2, crownY - crownH * 0.18);
                ctx.lineTo(crownX + crownW * 0.35, crownY - crownH);
                ctx.lineTo(crownX + crownW * 0.5, crownY - crownH * 0.28);
                ctx.lineTo(crownX + crownW * 0.65, crownY - crownH);
                ctx.lineTo(crownX + crownW * 0.8, crownY - crownH * 0.18);
                ctx.lineTo(crownX + crownW, crownY - crownH * 0.55);
                ctx.lineTo(crownX + crownW, crownY);
                ctx.closePath();
                const cg = ctx.createLinearGradient(cx, crownY - crownH, cx, crownY);
                cg.addColorStop(0, '#FFE040'); cg.addColorStop(1, '#CC8000');
                ctx.fillStyle = cg; ctx.fill();
                ctx.strokeStyle = '#8B5E0A'; ctx.lineWidth = 1.2; ctx.stroke();
                [0.2, 0.5, 0.8].forEach((p, i) => {
                    ctx.beginPath(); ctx.arc(crownX + crownW * p, crownY - crownH * 0.2, r * 0.1, 0, Math.PI * 2);
                    ctx.fillStyle = i === 1 ? '#FF4040' : '#4040CC'; ctx.fill();
                });
                ctx.restore();
            }
        },
        'enchanted-longsword': {
            name: 'Enchanted Longsword',
            type: 'weapon',
            rarity: 'rare',
            sellValue: 220,
            description: 'A magnificent blade shimmering with ancient magic',
            drawIcon(ctx, cx, cy, size) {
                ctx.save();
                ctx.shadowColor = '#6080FF'; ctx.shadowBlur = size * 0.35;
                ctx.beginPath();
                ctx.moveTo(cx, cy - size * 0.48);
                ctx.lineTo(cx + size * 0.06, cy + size * 0.1);
                ctx.lineTo(cx - size * 0.06, cy + size * 0.1);
                ctx.closePath();
                const bg = ctx.createLinearGradient(cx - size * 0.06, 0, cx + size * 0.06, 0);
                bg.addColorStop(0, '#8899CC'); bg.addColorStop(0.5, '#DDEEFF'); bg.addColorStop(1, '#6677AA');
                ctx.fillStyle = bg; ctx.fill();
                ctx.strokeStyle = '#3344AA'; ctx.lineWidth = 1; ctx.stroke();
                ctx.shadowBlur = 0;
                const gg = ctx.createLinearGradient(cx - size * 0.22, cy + size * 0.1, cx + size * 0.22, cy + size * 0.18);
                gg.addColorStop(0, '#B8860B'); gg.addColorStop(0.5, '#FFD700'); gg.addColorStop(1, '#B8860B');
                ctx.fillStyle = gg;
                ctx.fillRect(cx - size * 0.22, cy + size * 0.1, size * 0.44, size * 0.08);
                ctx.strokeStyle = '#8B5E0A'; ctx.lineWidth = 1; ctx.strokeRect(cx - size * 0.22, cy + size * 0.1, size * 0.44, size * 0.08);
                const hg = ctx.createLinearGradient(cx - size * 0.06, 0, cx + size * 0.06, 0);
                hg.addColorStop(0, '#5c3d1f'); hg.addColorStop(0.5, '#8B5E30'); hg.addColorStop(1, '#3a2410');
                ctx.fillStyle = hg;
                ctx.fillRect(cx - size * 0.055, cy + size * 0.18, size * 0.11, size * 0.3);
                ctx.strokeStyle = '#2a1800'; ctx.lineWidth = 0.8;
                ctx.strokeRect(cx - size * 0.055, cy + size * 0.18, size * 0.11, size * 0.3);
                ctx.shadowColor = '#8898FF'; ctx.shadowBlur = 4;
                ctx.strokeStyle = 'rgba(100,150,255,0.7)'; ctx.lineWidth = 0.8;
                ctx.beginPath(); ctx.moveTo(cx, cy - size * 0.38); ctx.lineTo(cx, cy + size * 0.06); ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.restore();
            }
        },
        'moonstone-gem': {
            name: 'Moonstone Gem',
            type: 'gem',
            rarity: 'rare',
            sellValue: 210,
            description: 'A lustrous gem that captures moonlight',
            drawIcon(ctx, cx, cy, size) {
                ctx.save();
                ctx.shadowColor = '#AABBFF'; ctx.shadowBlur = size * 0.4;
                ctx.beginPath(); ctx.ellipse(cx, cy, size * 0.3, size * 0.44, 0, 0, Math.PI * 2);
                const g = ctx.createRadialGradient(cx - size * 0.08, cy - size * 0.15, size * 0.02, cx, cy, size * 0.44);
                g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.3, '#C0C8FF'); g.addColorStop(0.65, '#7080CC'); g.addColorStop(1, '#2030A0');
                ctx.fillStyle = g; ctx.fill();
                ctx.strokeStyle = '#3040A0'; ctx.lineWidth = 1.5; ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.strokeStyle = 'rgba(200,210,255,0.5)'; ctx.lineWidth = 0.8;
                ctx.beginPath(); ctx.moveTo(cx, cy - size * 0.44); ctx.lineTo(cx + size * 0.3, cy); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx, cy - size * 0.44); ctx.lineTo(cx - size * 0.3, cy); ctx.stroke();
                ctx.save();
                ctx.beginPath(); ctx.ellipse(cx, cy, size * 0.3, size * 0.44, 0, 0, Math.PI * 2); ctx.clip();
                ctx.beginPath(); ctx.arc(cx + size * 0.06, cy - size * 0.06, size * 0.18, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(200,215,255,0.35)'; ctx.fill();
                ctx.beginPath(); ctx.arc(cx + size * 0.15, cy - size * 0.06, size * 0.14, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(50,80,160,0.6)'; ctx.fill();
                ctx.restore();
                ctx.beginPath(); ctx.ellipse(cx - size * 0.1, cy - size * 0.25, size * 0.07, size * 0.12, -0.3, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
                ctx.restore();
            }
        },
        'frog-totem': {
            name: 'Frog Totem',
            type: 'treasure',
            rarity: 'rare',
            sellValue: 185,
            description: 'A sacred totem carved in the shape of a leaping frog',
            drawIcon(ctx, cx, cy, size) {
                ctx.save();
                const pw = size * 0.3;
                const pg = ctx.createLinearGradient(cx - pw / 2, 0, cx + pw / 2, 0);
                pg.addColorStop(0, '#5c3d1f'); pg.addColorStop(0.5, '#8B5E30'); pg.addColorStop(1, '#4a2e10');
                ctx.fillStyle = pg;
                ctx.fillRect(cx - pw / 2, cy - size * 0.46, pw, size * 0.92);
                ctx.strokeStyle = '#3a2010'; ctx.lineWidth = 1;
                ctx.strokeRect(cx - pw / 2, cy - size * 0.46, pw, size * 0.92);
                ctx.strokeStyle = 'rgba(58,32,16,0.3)'; ctx.lineWidth = 0.5;
                for (let i = 1; i < 8; i++) {
                    const lineY = cy - size * 0.46 + i * size * 0.92 / 8;
                    ctx.beginPath(); ctx.moveTo(cx - pw / 2 + 1, lineY); ctx.lineTo(cx + pw / 2 - 1, lineY); ctx.stroke();
                }
                const facePositions = [cy - size * 0.28, cy + size * 0.01, cy + size * 0.29];
                const faceR = size * 0.19;
                facePositions.forEach(fy => {
                    ctx.beginPath(); ctx.arc(cx, fy, faceR, 0, Math.PI * 2);
                    const fg = ctx.createRadialGradient(cx - faceR * 0.2, fy - faceR * 0.2, faceR * 0.05, cx, fy, faceR);
                    fg.addColorStop(0, '#6ecc40'); fg.addColorStop(1, '#2a6010');
                    ctx.fillStyle = fg; ctx.fill();
                    ctx.strokeStyle = '#1a4a08'; ctx.lineWidth = 1.2; ctx.stroke();
                    [-1, 1].forEach(s => {
                        ctx.beginPath(); ctx.arc(cx + s * faceR * 0.5, fy - faceR * 0.3, faceR * 0.19, 0, Math.PI * 2);
                        ctx.fillStyle = '#ffffff'; ctx.fill();
                        ctx.beginPath(); ctx.arc(cx + s * faceR * 0.5 + s * faceR * 0.05, fy - faceR * 0.28, faceR * 0.1, 0, Math.PI * 2);
                        ctx.fillStyle = '#1a0800'; ctx.fill();
                    });
                    ctx.beginPath(); ctx.arc(cx, fy + faceR * 0.22, faceR * 0.36, 0.18, Math.PI - 0.18);
                    ctx.strokeStyle = '#1a4a08'; ctx.lineWidth = 1; ctx.stroke();
                });
                ctx.restore();
            }
        },
        'void-shard': {
            name: 'Void Shard',
            type: 'gem',
            rarity: 'rare',
            sellValue: 225,
            description: 'A mysterious dark crystal from the depths of the void',
            drawIcon(ctx, cx, cy, size) {
                ctx.save();
                ctx.shadowColor = '#8020CC'; ctx.shadowBlur = size * 0.5;
                ctx.beginPath();
                ctx.moveTo(cx - size * 0.08, cy - size * 0.46);
                ctx.lineTo(cx + size * 0.28, cy - size * 0.15);
                ctx.lineTo(cx + size * 0.18, cy + size * 0.02);
                ctx.lineTo(cx + size * 0.32, cy + size * 0.24);
                ctx.lineTo(cx + size * 0.08, cy + size * 0.46);
                ctx.lineTo(cx - size * 0.22, cy + size * 0.28);
                ctx.lineTo(cx - size * 0.3, cy + size * 0.04);
                ctx.lineTo(cx - size * 0.16, cy - size * 0.22);
                ctx.closePath();
                const g = ctx.createLinearGradient(cx, cy - size * 0.46, cx, cy + size * 0.46);
                g.addColorStop(0, '#C060FF'); g.addColorStop(0.4, '#7020AA'); g.addColorStop(1, '#200040');
                ctx.fillStyle = g; ctx.fill();
                ctx.strokeStyle = '#400080'; ctx.lineWidth = 1.5; ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.strokeStyle = 'rgba(200,150,255,0.42)'; ctx.lineWidth = 0.8;
                ctx.beginPath(); ctx.moveTo(cx - size * 0.08, cy - size * 0.46); ctx.lineTo(cx + size * 0.28, cy - size * 0.15); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx - size * 0.08, cy - size * 0.46); ctx.lineTo(cx - size * 0.16, cy - size * 0.22); ctx.stroke();
                ctx.shadowColor = '#CC80FF'; ctx.shadowBlur = 4;
                ctx.fillStyle = '#CC80FF';
                [[cx + size * 0.04, cy - size * 0.1], [cx - size * 0.12, cy + size * 0.16], [cx + size * 0.14, cy + size * 0.3]].forEach(([px, py]) => {
                    ctx.beginPath(); ctx.arc(px, py, size * 0.026, 0, Math.PI * 2); ctx.fill();
                });
                ctx.shadowBlur = 0;
                ctx.restore();
            }
        }
    };

    /**
     * Get a loot type by ID
     */
    static getLootType(lootId) {
        return this.#registry[lootId];
    }

    /**
     * Get all loot types
     */
    static getAllLootTypes() {
        return Object.keys(this.#registry);
    }

    /**
     * Get random loot type (weighted by rarity)
     * Returns a normal loot item or rare loot item based on probability
     */
    static getRandomLoot() {
        const normalLoot = this.getLootByRarity('normal');
        const rareLoot = this.getLootByRarity('rare');
        
        // 85% chance for normal loot, 15% chance for rare
        const isRare = Math.random() < 0.15;
        const pool = isRare ? rareLoot : normalLoot;
        
        const lootId = pool[Math.floor(Math.random() * pool.length)];
        return { lootId, isRare };
    }

    /**
     * Get loot by rarity
     */
    static getLootByRarity(rarity) {
        return Object.entries(this.#registry)
            .filter(([_, type]) => type.rarity === rarity)
            .map(([id, _]) => id);
    }
}
