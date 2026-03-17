/**
 * MarketplaceRegistry - Centralized registry for all marketplace buyable items
 * Defines items that can be purchased with gold in the marketplace
 * These items can be consumables (used once per level) or persistent boons
 */
import { UpgradeRegistry } from './UpgradeRegistry.js';

// ── Icon drawing helpers (module-level, no emoji) ──────────────────────────────
function _drawMusicNote(ctx, cx, cy, size) {
    ctx.save();
    const nx = cx - size * 0.08, ny = cy - size * 0.1;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath(); ctx.ellipse(nx, ny + size * 0.28, size * 0.13, size * 0.09, -0.4, 0, Math.PI * 2);
    ctx.fill(); ctx.strokeStyle = '#CC8800'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(nx + size * 0.12, ny + size * 0.23); ctx.lineTo(nx + size * 0.12, ny - size * 0.22);
    ctx.strokeStyle = '#FFD700'; ctx.lineWidth = size * 0.04; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(nx + size * 0.12, ny - size * 0.22);
    ctx.quadraticCurveTo(nx + size * 0.32, ny, nx + size * 0.22, ny + size * 0.14); ctx.stroke();
    ctx.restore();
}

function _drawHammer(ctx, cx, cy, size) {
    ctx.save();
    const hg = ctx.createLinearGradient(cx - size * 0.04, 0, cx + size * 0.04, 0);
    hg.addColorStop(0, '#5c3d1f'); hg.addColorStop(0.5, '#8B5E30'); hg.addColorStop(1, '#3a2410');
    ctx.fillStyle = hg;
    ctx.fillRect(cx - size * 0.04, cy - size * 0.22, size * 0.08, size * 0.65);
    ctx.strokeStyle = '#2a1800'; ctx.lineWidth = 0.8; ctx.strokeRect(cx - size * 0.04, cy - size * 0.22, size * 0.08, size * 0.65);
    const hd = ctx.createLinearGradient(cx - size * 0.24, cy - size * 0.44, cx + size * 0.24, cy - size * 0.22);
    hd.addColorStop(0, '#888'); hd.addColorStop(0.5, '#ccc'); hd.addColorStop(1, '#666');
    ctx.fillStyle = hd;
    ctx.fillRect(cx - size * 0.22, cy - size * 0.44, size * 0.44, size * 0.22);
    ctx.strokeStyle = '#444'; ctx.lineWidth = 1; ctx.strokeRect(cx - size * 0.22, cy - size * 0.44, size * 0.44, size * 0.22);
    ctx.beginPath(); ctx.arc(cx - size * 0.18, cy - size * 0.33, size * 0.06, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill();
    ctx.restore();
}

function _drawMedal(ctx, cx, cy, size) {
    ctx.save();
    const r = size * 0.34;
    const ribbonW = size * 0.2, ribbonH = size * 0.28;
    const rx = cx - ribbonW / 2, ry = cy - r - ribbonH + size * 0.08;
    ctx.fillStyle = '#CC2020'; ctx.fillRect(rx, ry, ribbonW, ribbonH);
    ctx.strokeStyle = '#880000'; ctx.lineWidth = 0.8; ctx.strokeRect(rx, ry, ribbonW, ribbonH);
    ctx.strokeStyle = 'rgba(255,100,100,0.4)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, ry); ctx.lineTo(cx, ry + ribbonH); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    g.addColorStop(0, '#FFE878'); g.addColorStop(0.5, '#D4A020'); g.addColorStop(1, '#8B5E0A');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = '#5A2E0A'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.65, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(90,46,10,0.4)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.font = `bold ${Math.round(size * 0.34)}px serif`;
    ctx.fillStyle = 'rgba(90,46,10,0.72)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('1', cx, cy + 1);
    ctx.restore();
}

function _drawRabbitPaw(ctx, cx, cy, size) {
    ctx.save();
    ctx.fillStyle = '#E0C8A8'; ctx.strokeStyle = '#8B6040'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(cx, cy + size * 0.12, size * 0.22, size * 0.28, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    [[-0.22, -0.22], [0, -0.32], [0.22, -0.22]].forEach(([dx, dy]) => {
        ctx.beginPath(); ctx.ellipse(cx + dx * size, cy + dy * size, size * 0.1, size * 0.13, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
    });
    ctx.fillStyle = '#A07858';
    [[cx - size * 0.09, cy + size * 0.08], [cx + size * 0.09, cy + size * 0.08], [cx, cy + size * 0.22]].forEach(([px, py]) => {
        ctx.beginPath(); ctx.ellipse(px, py, size * 0.06, size * 0.07, 0, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
}

function _drawCrystalOrb(ctx, cx, cy, size) {
    ctx.save();
    ctx.shadowColor = '#8020CC'; ctx.shadowBlur = size * 0.4;
    ctx.beginPath(); ctx.arc(cx, cy, size * 0.4, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(cx - size * 0.12, cy - size * 0.12, size * 0.02, cx, cy, size * 0.4);
    g.addColorStop(0, '#E0C0FF'); g.addColorStop(0.35, '#9040CC'); g.addColorStop(0.7, '#5010A0'); g.addColorStop(1, '#180030');
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#400080'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, size * 0.4, 0, Math.PI * 2); ctx.clip();
    ctx.strokeStyle = 'rgba(200,160,255,0.35)'; ctx.lineWidth = 1;
    [[cx - size * 0.1, cy, size * 0.22, -0.3, 0.8], [cx + size * 0.06, cy - size * 0.08, size * 0.18, 0.5, 1.5]].forEach(([ox, oy, r, s, e]) => {
        ctx.beginPath(); ctx.arc(ox, oy, r, s, e); ctx.stroke();
    });
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(cx - size * 0.15, cy - size * 0.15, size * 0.1, size * 0.06, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
    ctx.restore();
}

function _drawMagicBox(ctx, cx, cy, size) {
    ctx.save();
    const w = size * 0.72, h = size * 0.56;
    const bx = cx - w / 2, by = cy - h * 0.36;
    const bg = ctx.createLinearGradient(cx, by, cx, by + h);
    bg.addColorStop(0, '#8844BB'); bg.addColorStop(1, '#441088');
    ctx.fillStyle = bg; ctx.fillRect(bx, by + h * 0.32, w, h * 0.68);
    ctx.strokeStyle = '#220055'; ctx.lineWidth = 1.5; ctx.strokeRect(bx, by + h * 0.32, w, h * 0.68);
    const lg = ctx.createLinearGradient(cx, by, cx, by + h * 0.36);
    lg.addColorStop(0, '#AA66DD'); lg.addColorStop(1, '#6622AA');
    ctx.fillStyle = lg; ctx.fillRect(bx, by, w, h * 0.36); ctx.strokeRect(bx, by, w, h * 0.36);
    ctx.beginPath(); ctx.moveTo(bx, by + h * 0.36); ctx.quadraticCurveTo(cx, by - h * 0.06, bx + w, by + h * 0.36);
    ctx.closePath(); ctx.fillStyle = lg; ctx.fill(); ctx.strokeStyle = '#220055'; ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = '#CC88FF'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, by); ctx.lineTo(cx, by + h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx, by + h * 0.68); ctx.lineTo(bx + w, by + h * 0.68); ctx.stroke();
    ctx.shadowColor = '#CC88FF'; ctx.shadowBlur = 6;
    const starY = by + h * 0.08;
    ctx.fillStyle = '#FFD700';
    [0, 1, 2, 3, 4].forEach(i => {
        const a = (i * 4 / 5 - 0.5) * Math.PI * 2;
        const a2 = ((i * 4 + 2) / 5 - 0.5) * Math.PI * 2;
        if (i === 0) ctx.beginPath();
        i === 0 ? ctx.moveTo(cx + Math.cos(a) * size * 0.09, starY + Math.sin(a) * size * 0.09)
                : ctx.lineTo(cx + Math.cos(a) * size * 0.09, starY + Math.sin(a) * size * 0.09);
        ctx.lineTo(cx + Math.cos(a2) * size * 0.04, starY + Math.sin(a2) * size * 0.04);
    });
    ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
    ctx.restore();
}

function _drawFrogKingBane(ctx, cx, cy, size) {
    ctx.save();
    const cw = size * 0.88, ch = size * 0.62;
    const crownX = cx - cw / 2, crownY = cy + ch * 0.1;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.lineTo(crownX, crownY - ch * 0.5);
    ctx.lineTo(crownX + cw * 0.2, crownY - ch * 0.12);
    ctx.lineTo(crownX + cw * 0.35, crownY - ch);
    ctx.lineTo(crownX + cw * 0.5, crownY - ch * 0.22);
    ctx.lineTo(crownX + cw * 0.65, crownY - ch);
    ctx.lineTo(crownX + cw * 0.8, crownY - ch * 0.12);
    ctx.lineTo(crownX + cw, crownY - ch * 0.5);
    ctx.lineTo(crownX + cw, crownY);
    ctx.closePath();
    const cg = ctx.createLinearGradient(cx, crownY - ch, cx, crownY);
    cg.addColorStop(0, '#88FF80'); cg.addColorStop(0.5, '#30A830'); cg.addColorStop(1, '#186810');
    ctx.fillStyle = cg; ctx.fill();
    ctx.strokeStyle = '#144010'; ctx.lineWidth = 1.5; ctx.stroke();
    [0.2, 0.5, 0.8].forEach((p, i) => {
        ctx.beginPath(); ctx.arc(crownX + cw * p, crownY - (i === 1 ? ch * 0.88 : ch * 0.7), size * 0.07, 0, Math.PI * 2);
        ctx.fillStyle = i === 1 ? '#FFD700' : '#22CC22'; ctx.fill();
        ctx.strokeStyle = '#144010'; ctx.lineWidth = 0.8; ctx.stroke();
    });
    ctx.restore();
}

function _drawIntelScroll(ctx, cx, cy, size) {
    ctx.save();
    const sw = size * 0.54, sh = size * 0.62;
    const sx = cx - sw / 2, sy = cy - sh / 2, rr = size * 0.07;
    const sg = ctx.createLinearGradient(sx, sy, sx + sw, sy + sh);
    sg.addColorStop(0, '#F5E6B8'); sg.addColorStop(1, '#D4B870');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.moveTo(sx + rr, sy); ctx.lineTo(sx + sw - rr, sy);
    ctx.arcTo(sx + sw, sy, sx + sw, sy + rr, rr); ctx.lineTo(sx + sw, sy + sh - rr);
    ctx.arcTo(sx + sw, sy + sh, sx + sw - rr, sy + sh, rr); ctx.lineTo(sx + rr, sy + sh);
    ctx.arcTo(sx, sy + sh, sx, sy + sh - rr, rr); ctx.lineTo(sx, sy + rr);
    ctx.arcTo(sx, sy, sx + rr, sy, rr); ctx.closePath();
    ctx.fill(); ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#DDB858';
    ctx.fillRect(sx - size * 0.04, sy, sw + size * 0.08, sh * 0.13);
    ctx.fillRect(sx - size * 0.04, sy + sh - sh * 0.13, sw + size * 0.08, sh * 0.13);
    ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 1;
    ctx.strokeRect(sx - size * 0.04, sy, sw + size * 0.08, sh * 0.13);
    ctx.strokeRect(sx - size * 0.04, sy + sh - sh * 0.13, sw + size * 0.08, sh * 0.13);
    ctx.strokeStyle = 'rgba(100,70,20,0.5)'; ctx.lineWidth = 0.8;
    for (let i = 0; i < 3; i++) {
        const lineY = sy + sh * 0.23 + i * sh * 0.2;
        ctx.beginPath(); ctx.moveTo(sx + size * 0.05, lineY); ctx.lineTo(sx + sw - size * 0.05, lineY); ctx.stroke();
    }
    ctx.restore();
}

function _drawClipboard(ctx, cx, cy, size) {
    ctx.save();
    const w = size * 0.6, h = size * 0.76;
    const bx = cx - w / 2, by = cy - h * 0.46;
    ctx.fillStyle = '#F5F0E8';
    ctx.fillRect(bx, by, w, h);
    ctx.strokeStyle = '#B0A080'; ctx.lineWidth = 1.5; ctx.strokeRect(bx, by, w, h);
    ctx.fillStyle = '#888060';
    ctx.fillRect(cx - size * 0.12, by - size * 0.06, size * 0.24, size * 0.12);
    ctx.strokeStyle = '#666040'; ctx.lineWidth = 1; ctx.strokeRect(cx - size * 0.12, by - size * 0.06, size * 0.24, size * 0.12);
    ctx.beginPath(); ctx.arc(cx, by - size * 0.02, size * 0.04, 0, Math.PI * 2);
    ctx.fillStyle = '#444'; ctx.fill();
    ctx.strokeStyle = 'rgba(100,90,60,0.5)'; ctx.lineWidth = 0.8;
    for (let i = 0; i < 4; i++) {
        const lineY = by + size * 0.14 + i * size * 0.14;
        ctx.beginPath(); ctx.moveTo(bx + size * 0.06, lineY); ctx.lineTo(bx + w - size * 0.06, lineY); ctx.stroke();
    }
    ctx.restore();
}

function _drawMagnifier(ctx, cx, cy, size) {
    ctx.save();
    const handleAngle = Math.PI * 0.75;
    const glassR = size * 0.28;
    const glassCX = cx - size * 0.06, glassCY = cy - size * 0.06;
    ctx.beginPath(); ctx.arc(glassCX, glassCY, glassR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(180,220,255,0.3)'; ctx.fill();
    ctx.strokeStyle = '#888'; ctx.lineWidth = size * 0.07; ctx.stroke();
    const hx1 = glassCX + Math.cos(handleAngle) * glassR;
    const hy1 = glassCY + Math.sin(handleAngle) * glassR;
    const hx2 = cx + Math.cos(handleAngle) * size * 0.44;
    const hy2 = cy + Math.sin(handleAngle) * size * 0.44;
    ctx.beginPath(); ctx.moveTo(hx1, hy1); ctx.lineTo(hx2, hy2);
    ctx.strokeStyle = '#6B4010'; ctx.lineWidth = size * 0.1; ctx.lineCap = 'round'; ctx.stroke();
    ctx.strokeStyle = '#8B6030'; ctx.lineWidth = size * 0.06; ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.arc(glassCX, glassCY, glassR, 0, Math.PI * 2);
    ctx.strokeStyle = '#666'; ctx.lineWidth = size * 0.07; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(glassCX - glassR * 0.28, glassCY - glassR * 0.28, glassR * 0.18, glassR * 0.1, -0.6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
    ctx.restore();
}

function _drawLightning(ctx, cx, cy, size) {
    ctx.save();
    ctx.shadowColor = '#FFD700'; ctx.shadowBlur = size * 0.35;
    ctx.beginPath();
    ctx.moveTo(cx + size * 0.12, cy - size * 0.46);
    ctx.lineTo(cx - size * 0.08, cy - size * 0.02);
    ctx.lineTo(cx + size * 0.06, cy - size * 0.02);
    ctx.lineTo(cx - size * 0.14, cy + size * 0.46);
    ctx.lineTo(cx + size * 0.12, cy + size * 0.04);
    ctx.lineTo(cx - size * 0.02, cy + size * 0.04);
    ctx.closePath();
    const g = ctx.createLinearGradient(cx, cy - size * 0.46, cx, cy + size * 0.46);
    g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.3, '#FFE060'); g.addColorStop(1, '#FF8000');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = '#CC6000'; ctx.lineWidth = 1; ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
}
// ──────────────────────────────────────────────────────────────────────────────

export class MarketplaceRegistry {
    static #registry = {
        'forge-materials': {
            name: 'Forge Materials',
            description: 'Deep within the earth, legendary smiths once worked rare ores into instruments of power. Now their legacy awaits. These precious materials—mithril ingots, enchanted coal, and ancient blueprints—contain the essence of a master craftsman\'s knowledge. In the next battle, you may construct a Tower Forge at no cost. This forge will unlock powerful tower upgrades and enhance your entire arsenal, turning your warriors into an unstoppable force.',
            cost: 300,
            drawIcon: _drawHammer,
            category: 'building',
            type: 'consumable',
            effect: 'Free Tower Forge in your next level\nItem is consumed as soon as you start\nQuiting the level without using it will forfeit the item',
            requirements: []
        },
        'training-materials': {
            name: 'Training Materials',
            description: 'The weathered scrolls speak of legendary warriors whose names echo through eternity—champions who pushed the boundaries of strength and skill. Their armor, still emanating residual power, crackles with ancient might. Carrying these relics into battle fills your troops with inspiration and untapped potential. In the next battle, you may construct Training Grounds at no cost. This sacred ground will unlock advanced tower techniques, granting your defenders enhanced range and devastating new abilities to defend your castle.',
            cost: 350,
            drawIcon: _drawMedal,
            category: 'building',
            type: 'consumable',
            effect: 'Free Training Grounds in your next level\nItem is consumed as soon as you start\nQuiting the level without using it will forfeit the item',
            requirements: ['training-gear']
        },
        'rabbits-foot': {
            name: 'Rabbit\'s Foot',
            description: 'The forest runs deep with magic old and true. Those who traverse its hidden groves sometimes catch glimpses of white rabbits—swift as starlight, blessed by nature itself. To claim their favor is to unlock prosperity beyond measure. This talisman, blessed by woodland spirits of abundance, doubles the wealth and treasure you discover in the next battle. Fallen enemies will yield twice the gold, gems, and relics, filling your coffers with untold riches.',
            cost: 200,
            drawIcon: _drawRabbitPaw,
            category: 'loot',
            type: 'consumable',
            effect: 'The chances of normale loot are doubled in your next level\nItem is consumed as soon as you start\nQuiting the level without using it will forfeit the item',
            requirements: []
        },
        'strange-talisman': {
            name: 'Strange Talisman',
            description: 'Found in the tomb of a forgotten sorcerer, this enigmatic artifact thrums with power that defies explanation. Its runes glow with ancient magic—a spell so potent that it seems to bend fate itself. When you carry it into battle, the very fabric of destiny shifts in your favor, drawing legendary treasures from the aether. In the next battle, all rare and legendary loot drops are doubled, multiplying your chances of acquiring the finest gems, artifacts, and enchanted relics the realm has to offer.',
            cost: 400,
            drawIcon: _drawCrystalOrb,
            category: 'loot',
            type: 'consumable',
            effect: 'Enemies carrying Legendary loot will drop two bags in your next level\nItem is consumed as soon as you start\nQuiting the level without using it will forfeit the item',
            requirements: [],
            campaignRequirement: 'campaign-2'
        },
        'magic-tower-flatpack': {
            name: 'Magic Tower Flatpack',
            description: 'In ages past, the greatest arcane scholars of the realm created a marvel of magical engineering—a tower of pure elemental force, capable of channeling devastating spells against enemies. This enchanted blueprint, preserved for centuries, contains all the knowledge and materials needed to construct such a tower in mere moments. In the next battle, you may erect a Magic Tower at no cost. This powerful tower can be infused with different elemental forces (fire, water, earth, air) to deal specialized damage and adapt to any threat. No gold required—only the will to embrace ancient magic.',
            cost: 500,
            drawIcon: _drawMagicBox,
            category: 'building',
            type: 'consumable',
            effect: 'Free Magic Tower in your next level\nItem is consumed as soon as you start\nQuiting the level without using it will forfeit the item',
            requirements: ['magic-academy-unlock']
        },
        'frog-king-bane': {
            name: 'The Frog King\'s Bane',
            description: 'In ages long forgotten, the great kingdoms of the forest—ancient groves and sacred glades—were ruled by a tyrannical Frog King who hoarded power for himself. The old spirits of wood and water, rivals to his dominion, bound their collective essence into this talisman as an act of defiance. Carrying it into battle grants you their protection. Should your castle be destroyed, you are protected by the ancient spirits of the forest—the very foes of the Frog King himself. They conjure a mystical barrier that snatches your life back from the brink of destruction, reviving your castle and allowing you to continue the fight. A boon from nature\'s oldest guardians.',
            cost: 800,
            drawIcon: _drawFrogKingBane,
            category: 'boon',
            type: 'boon',
            effect: 'Rebuild your castle once\nItem is consumed when your castle gets destroyed\nStays active until consumed',
            requirements: []
        },
        // MUSICAL SCORES
        'music-menu-theme': {
            name: 'Menu Theme',
            description: 'The iconic theme that welcomes heroes to the realm. A stirring melody that captures the spirit of adventure and conquest.',
            cost: 50,
            drawIcon: _drawMusicNote,
            category: 'music',
            type: 'music',
            musicId: 'menu-theme',
            effect: 'Unlock menu theme to be played within the Arcane Library',
            requirements: ['musical-equipment']
        },
        'music-settlement-1': {
            name: 'Settlement Theme - Spring',
            description: 'A peaceful melody that echoes through the settlement during peaceful times. Reminiscent of spring blossoms and new beginnings.',
            cost: 75,
            drawIcon: _drawMusicNote,
            category: 'music',
            type: 'music',
            musicId: 'settlement-theme-1',
            effect: 'Unlock settlement theme to be played within the Arcane Library',
            requirements: ['musical-equipment']
        },
        'music-settlement-2': {
            name: 'Settlement Theme - Summer',
            description: 'A warm and hopeful melody that fills the air during the golden season. The sounds of prosperity and growth.',
            cost: 75,
            drawIcon: _drawMusicNote,
            category: 'music',
            type: 'music',
            musicId: 'settlement-theme-2',
            effect: 'Unlock settlement theme to be played within the Arcane Library',
            requirements: ['musical-equipment']
        },
        'music-settlement-3': {
            name: 'Settlement Theme - Winter',
            description: 'A contemplative melody that speaks of rest and renewal. The quiet beauty of the cold season.',
            cost: 75,
            drawIcon: _drawMusicNote,
            category: 'music',
            type: 'music',
            musicId: 'settlement-theme-3',
            effect: 'Unlock settlement theme to be played within the Arcane Library',
            requirements: ['musical-equipment']
        },
        'music-forest-1': {
            name: 'Forest Battle - Awakening',
            description: 'The sound of the forest coming alive. Ancient magic stirs as your defenders prepare for battle.',
            cost: 100,
            drawIcon: _drawMusicNote,
            category: 'music',
            type: 'music',
            musicId: 'campaign-1-battle-1',
            effect: 'Unlock forest battle theme to be played within the Arcane Library',
            requirements: ['musical-equipment']
        },
        'music-forest-2': {
            name: 'Forest Battle - Rising Tide',
            description: 'The intensity builds as enemies approach. Nature itself seems to join the fray.',
            cost: 100,
            drawIcon: _drawMusicNote,
            category: 'music',
            type: 'music',
            musicId: 'campaign-1-battle-2',
            effect: 'Unlock forest battle theme to be played within the Arcane Library',
            requirements: ['musical-equipment']
        },
        'music-forest-3': {
            name: 'Forest Battle - Triumph',
            description: 'A powerful theme that speaks of victory and dominance. Hear the triumph of the forest.',
            cost: 100,
            drawIcon: _drawMusicNote,
            category: 'music',
            type: 'music',
            musicId: 'campaign-1-battle-3',
            effect: 'Unlock forest battle theme to be played within the Arcane Library',
            requirements: ['musical-equipment']
        },
        'music-mountain': {
            name: 'Mountain Battle Theme',
            description: 'Echoing through mountain peaks, this theme speaks of strength and unshakeable resolve.',
            cost: 100,
            drawIcon: _drawMusicNote,
            category: 'music',
            type: 'music',
            musicId: 'campaign-2-battle-1',
            effect: 'Unlock mountain battle theme to be played within the Arcane Library',
            requirements: ['musical-equipment'],
            campaignRequirement: 'campaign-2'
        },
        'music-desert-1': {
            name: 'Desert Battle - Sands of Time',
            description: 'The melody of endless dunes and ancient ruins. Timeless and mysterious.',
            cost: 100,
            drawIcon: _drawMusicNote,
            category: 'music',
            type: 'music',
            musicId: 'campaign-3-battle-1',
            effect: 'Unlock desert battle theme to be played within the Arcane Library',
            requirements: ['musical-equipment'],
            campaignRequirement: 'campaign-3'
        },
        'music-desert-2': {
            name: 'Desert Battle - Mirage',
            description: 'A disorienting yet beautiful theme that captures the desert\'s enigmatic nature.',
            cost: 100,
            drawIcon: _drawMusicNote,
            category: 'music',
            type: 'music',
            musicId: 'campaign-3-battle-2',
            effect: 'Unlock desert battle theme to be played within the Arcane Library',
            requirements: ['musical-equipment'],
            campaignRequirement: 'campaign-3'
        },
        'music-frogkings-1': {
            name: "Frog King's Domain - Arrival",
            description: "An eerie, otherworldly theme that greets you upon entering the Frog King's realm. Ancient power hums in the air.",
            cost: 125,
            drawIcon: _drawMusicNote,
            category: 'music',
            type: 'music',
            musicId: 'campaign-4-battle-1',
            effect: "Unlock Frog King's Domain battle theme to be played within the Arcane Library",
            requirements: ['musical-equipment'],
            campaignRequirement: 'campaign-4'
        },
        'music-frogkings-2': {
            name: "Frog King's Domain - Chaos",
            description: 'The realm descends into madness. Frenzied rhythms mirror the relentless assault of the Frog King\'s forces.',
            cost: 125,
            drawIcon: _drawMusicNote,
            category: 'music',
            type: 'music',
            musicId: 'campaign-4-battle-2',
            effect: "Unlock Frog King's Domain battle theme to be played within the Arcane Library",
            requirements: ['musical-equipment'],
            campaignRequirement: 'campaign-4'
        },
        'music-frogkings-3': {
            name: "Frog King's Domain - Dominion",
            description: 'The Frog King asserts his dominion. A commanding, oppressive theme that speaks of absolute power.',
            cost: 125,
            drawIcon: _drawMusicNote,
            category: 'music',
            type: 'music',
            musicId: 'campaign-4-battle-3',
            effect: "Unlock Frog King's Domain battle theme to be played within the Arcane Library",
            requirements: ['musical-equipment'],
            campaignRequirement: 'campaign-4'
        },
        'music-frogkings-4': {
            name: "Frog King's Domain - Reckoning",
            description: 'A moment of reckoning arrives. Tension builds to a fever pitch as the fate of the realm hangs in the balance.',
            cost: 125,
            drawIcon: _drawMusicNote,
            category: 'music',
            type: 'music',
            musicId: 'campaign-4-battle-4',
            effect: "Unlock Frog King's Domain battle theme to be played within the Arcane Library",
            requirements: ['musical-equipment'],
            campaignRequirement: 'campaign-4'
        },
        'music-frogkings-5': {
            name: "Frog King's Domain - Defiance",
            description: 'Against all odds, your defenders stand firm. A defiant anthem for those who refuse to yield.',
            cost: 125,
            drawIcon: _drawMusicNote,
            category: 'music',
            type: 'music',
            musicId: 'campaign-4-battle-5',
            effect: "Unlock Frog King's Domain battle theme to be played within the Arcane Library",
            requirements: ['musical-equipment'],
            campaignRequirement: 'campaign-4'
        },
        'music-frogkings-6': {
            name: "Frog King's Domain - Final Stand",
            description: 'The ultimate confrontation. A sweeping, climactic theme for the final battle against the Frog King himself.',
            cost: 150,
            drawIcon: _drawMusicNote,
            category: 'music',
            type: 'music',
            musicId: 'campaign-4-battle-6',
            effect: "Unlock Frog King's Domain battle theme to be played within the Arcane Library",
            requirements: ['musical-equipment'],
            campaignRequirement: 'campaign-4'
        },
        'music-victory': {
            name: 'Victory Fanfare',
            description: 'A triumphant theme that plays when you claim victory. The sound of conquest and glory.',
            cost: 150,
            drawIcon: _drawMusicNote,
            category: 'music',
            type: 'music',
            musicId: 'victory-tune',
            effect: 'Unlock victory fanfare to be played within the Arcane Library',
            requirements: ['musical-equipment']
        },
        'music-defeat': {
            name: 'Defeat Elegy',
            description: 'A somber reflection on defeat. A reminder of battles lost and lessons learned.',
            cost: 75,
            drawIcon: _drawMusicNote,
            category: 'music',
            type: 'music',
            musicId: 'defeat-tune',
            effect: 'Unlock defeat elegy to be played within the Arcane Library',
            requirements: ['musical-equipment']
        },
        // INTEL PACKS
        'intel-pack-1': {
            name: 'Spy Report I',
            description: 'Intelligence gathered by scouts reveals the weakness of common foes. Unlock detailed information about Basic Enemies, Archer Enemies, Beefy Enemies, and Villager Enemies in the Arcane Library. Know thy enemy, and you shall never fear them.',
            cost: 100,
            drawIcon: _drawIntelScroll,
            category: 'intel',
            type: 'consumable',
            effect: 'Unlock intel on common enemies',
            requirements: [],
            campaignRequirement: 'campaign-1'
        },
        'intel-pack-2': {
            name: 'Spy Report II',
            description: 'Through careful espionage, you gain knowledge of intermediate threats. Unlock information about Knight Enemies and Shield Knight Enemies. Fortify your defenses with understanding.',
            cost: 200,
            drawIcon: _drawClipboard,
            category: 'intel',
            type: 'consumable',
            effect: 'Unlock intel on knight enemies',
            requirements: [],
            campaignRequirement: 'campaign-2'
        },
        'intel-pack-3': {
            name: 'Spy Report III',
            description: 'Arcane scholars decipher cryptic runes revealing secrets of magical foes. Unlock intel on Mage Enemies and Frog Enemies. Master the arcane, and you master the battlefield.',
            cost: 300,
            drawIcon: _drawMagnifier,
            category: 'intel',
            type: 'consumable',
            effect: 'Unlock intel on magical enemies',
            requirements: [],
            campaignRequirement: 'campaign-3'
        },
        'intel-pack-4': {
            name: 'Spy Report IV',
            description: 'The most dangerous intelligence—knowledge of the realm\'s rarest and most powerful foes. Unlock intel on Elemental Frog Enemies. Understanding these ancient forces may be the key to your survival.',
            cost: 400,
            drawIcon: _drawLightning,
            category: 'intel',
            type: 'consumable',
            effect: 'Unlock intel on elemental enemies',
            requirements: [],
            campaignRequirement: 'campaign-4'
        }
    };

    /**
     * Get a marketplace item definition by ID
     * @param {string} itemId - Item ID key
     * @returns {Object|null} - Item object or null if not found
     */
    static getItem(itemId) {
        return this.#registry[itemId] || null;
    }

    /**
     * Get all marketplace items
     * @returns {Object} - Object containing all item definitions
     */
    static getAllItems() {
        return { ...this.#registry };
    }

    /**
     * Check if a marketplace item exists
     * @param {string} itemId - Item ID key
     * @returns {boolean} - True if item exists
     */
    static hasItem(itemId) {
        return itemId in this.#registry;
    }

    /**
     * Get items by category
     * @param {string} category - Category ('building', 'loot', 'tower', 'boon')
     * @returns {Object} - Object of items in that category
     */
    static getItemsByCategory(category) {
        const result = {};
        for (const [id, item] of Object.entries(this.#registry)) {
            if (item.category === category) {
                result[id] = item;
            }
        }
        return result;
    }

    /**
     * Get all marketplace item IDs
     * @returns {Array<string>} - Array of all item IDs
     */
    static getAllItemIds() {
        return Object.keys(this.#registry);
    }

    /**
     * Check if an item can be purchased (has no unmet requirements)
     * @param {string} itemId - Item to check
     * @param {UpgradeSystem} upgradeSystem - Player's upgrade system to check prerequisites
     * @param {MarketplaceSystem} marketplaceSystem - Player's marketplace system to check consumables
     * @returns {boolean} - True if all requirements are met
     */
    static canPurchase(itemId, upgradeSystem, marketplaceSystem) {
        const item = this.getItem(itemId);
        if (!item) return false;

        // Check upgrade requirements
        if (item.requirements && item.requirements.length > 0) {
            for (const requiredUpgrade of item.requirements) {
                if (!upgradeSystem || !upgradeSystem.hasUpgrade(requiredUpgrade)) {
                    return false;
                }
            }
        }

        // Check if consumable has already been used this session
        if (item.type === 'consumable' && marketplaceSystem) {
            if (marketplaceSystem.hasUsedConsumable(itemId)) {
                return false; // Already used in this session
            }
        }

        // Boon can be purchased if player has it in inventory (quantity > 0)
        // No special restriction - player can have multiple and buy more anytime

        return true;
    }

    /**
     * Get requirement failure message
     * @param {string} itemId - Item to check
     * @param {UpgradeSystem} upgradeSystem - Player's upgrade system
     * @param {MarketplaceSystem} marketplaceSystem - Player's marketplace system
     * @returns {string|null} - Requirement message or null
     */
    static getRequirementMessage(itemId, upgradeSystem, marketplaceSystem) {
        const item = this.getItem(itemId);
        if (!item) return null;

        // Check upgrade requirements
        if (item.requirements && item.requirements.length > 0) {
            for (const requiredUpgrade of item.requirements) {
                if (!upgradeSystem || !upgradeSystem.hasUpgrade(requiredUpgrade)) {
                    // Get the proper name from UpgradeRegistry
                    const upgradeData = UpgradeRegistry.getUpgrade(requiredUpgrade);
                    const upgradeName = upgradeData ? upgradeData.name : requiredUpgrade;
                    return `Requires: ${upgradeName}`;
                }
            }
        }

        // Check if consumable has already been used
        if (item.type === 'consumable' && marketplaceSystem) {
            if (marketplaceSystem.hasUsedConsumable(itemId)) {
                return 'Already used this round';
            }
        }

        // Check Frog King's Bane special case
        if (itemId === 'frog-king-bane' && marketplaceSystem) {
            if (marketplaceSystem.hasFrogKingBane()) {
                return 'Boon already active';
            }
        }

        return null;
    }

    /**
     * Get a user-friendly category name
     * @param {string} category - Category key
     * @returns {string} - Display name
     */
    static getCategoryName(category) {
        const categoryNames = {
            'building': 'Building Materials',
            'loot': 'Loot Enhancers',
            'tower': 'Tower Supplies',
            'boon': 'Protective Boons',
            'music': 'Musical Scores'
        };
        return categoryNames[category] || category;
    }
}
