import { SaveSystem } from '../../systems/SaveSystem.js';
import { MarketplaceRegistry } from '../../registries/MarketplaceRegistry.js';
import { MusicRegistry } from '../../registries/MusicRegistry.js';
import { CampaignRegistry } from '../../../game/CampaignRegistry.js';

// ---------------------------------------------------------------------------------------------
// Layout (canvas units). The modal is a wooden frame around a scrolling window onto a forest:
// the song tiles run down a central column, the blank space either side of it is a grove that
// mirrors left/right, and two wooden rails flank the window - the left one is decoration, the
// right one doubles as the scrollbar.
// ---------------------------------------------------------------------------------------------
const MENU_W = 800;
const MENU_H = 500;
const VIEW_X = 34;                       // scroll window, relative to the modal's top-left
const VIEW_Y = 70;
const VIEW_W = MENU_W - VIEW_X * 2;      // 732 - symmetric between the two rails
const VIEW_H = MENU_H - VIEW_Y - 20;     // 410
const RAIL_W = 16;
const RAIL_LEFT_X = VIEW_X - 4 - RAIL_W;         // 14
const RAIL_RIGHT_X = VIEW_X + VIEW_W + 4;        // 770

const TILE = 100;
const TILE_GAP = 15;
const COLS = 3;
const COLUMN_W = COLS * TILE + (COLS - 1) * TILE_GAP;   // 330 - the tiles' column, centred in the window
const ROW_H = TILE + TILE_GAP;
const GUTTER_W = (VIEW_W - COLUMN_W) / 2;               // 201 - the grove either side of the column

const HEADER_H = 30;
const HEADER_GAP = 10;
const SECTION_GAP = 20;
const PAD_TOP = 12;
const PAD_BOTTOM = 14;

const ARROW_H = 16;                      // scrollbar arrow buttons
const WHEEL_LINE_PX = 40;                // wheel "lines" (deltaMode 1) to pixels

// ---------------------------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------------------------
const GOLD = '#d4af37';
const GOLD_BRIGHT = '#ffd700';
const BARK_DARK = '#2b1a0e';
const BARK_MID = '#4f3520';
const BARK_LIGHT = '#7a5732';
const LEAF_COLORS = ['#24572a', '#2f6b2c', '#3d8a37', '#4fa044', '#67b856', '#8bcf6f'];
const GRASS_COLORS = ['#1f4a23', '#2b6a2c', '#3a8035', '#4f9a44'];

// Floating notes drifting up through the grove. Positions are measured from each gutter's OUTER
// edge and mirrored on the other side, so both groves always show the same notes at the same time.
const FLOAT_NOTES = [
    { x: 30,  speed: 0.040, phase: 0.62, size: 11, kind: 'eighth', sway: 7 },
    { x: 64,  speed: 0.050, phase: 0.05, size: 15, kind: 'eighth', sway: 9 },
    { x: 98,  speed: 0.043, phase: 0.41, size: 13, kind: 'beamed', sway: 12 },
    { x: 132, speed: 0.055, phase: 0.78, size: 16, kind: 'eighth', sway: 8 },
    { x: 166, speed: 0.047, phase: 0.24, size: 12, kind: 'beamed', sway: 10 },
    { x: 48,  speed: 0.036, phase: 0.90, size: 12, kind: 'beamed', sway: 6 },
    { x: 150, speed: 0.038, phase: 0.55, size: 11, kind: 'eighth', sway: 9 }
];

// ---------------------------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------------------------

/** Small seeded PRNG (mulberry32) - the grove is procedural but must look identical every time. */
function makeRng(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function pick(rng, list) {
    return list[Math.floor(rng() * list.length)];
}

function inRect(x, y, r) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function roundedRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

/** A pointed leaf growing out of (x, y) in direction `angle`, `len` long. */
function drawLeaf(ctx, x, y, angle, len, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.45, -len * 0.4, len, 0);
    ctx.quadraticCurveTo(len * 0.45, len * 0.4, 0, 0);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.lineWidth = 0.6;
    ctx.stroke();
    // midrib
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = Math.max(0.5, len * 0.05);
    ctx.beginPath();
    ctx.moveTo(len * 0.06, 0);
    ctx.lineTo(len * 0.82, 0);
    ctx.stroke();
    ctx.restore();
}

/** A tuft of leaves radiating from (x, y) - the tip of a twig, or a bush. */
function drawLeafCluster(ctx, rng, x, y, radius, count, palette = LEAF_COLORS) {
    for (let i = 0; i < count; i++) {
        const a = rng() * Math.PI * 2;
        const d = rng() * radius * 0.55;
        drawLeaf(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, a + (rng() - 0.5) * 0.6,
            radius * (0.55 + rng() * 0.45), pick(rng, palette));
    }
}

/** A musical note in `color` - a single eighth note, or a beamed pair. (x, y) is the note head. */
function drawNote(ctx, x, y, s, kind, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    const head = (hx, hy) => {
        ctx.beginPath();
        ctx.ellipse(hx, hy, s * 0.3, s * 0.22, -0.45, 0, Math.PI * 2);
        ctx.fill();
    };
    ctx.lineWidth = Math.max(1, s * 0.09);
    if (kind === 'beamed') {
        const x1 = -s * 0.34, y1 = 0, x2 = s * 0.36, y2 = -s * 0.14;
        head(x1, y1);
        head(x2, y2);
        const top1 = y1 - s * 1.0, top2 = y2 - s * 1.0;
        ctx.beginPath();
        ctx.moveTo(x1 + s * 0.27, y1 - s * 0.05);
        ctx.lineTo(x1 + s * 0.27, top1);
        ctx.moveTo(x2 + s * 0.27, y2 - s * 0.05);
        ctx.lineTo(x2 + s * 0.27, top2);
        ctx.stroke();
        ctx.lineWidth = Math.max(1.5, s * 0.2);
        ctx.beginPath();
        ctx.moveTo(x1 + s * 0.27, top1 + s * 0.06);
        ctx.lineTo(x2 + s * 0.27, top2 + s * 0.06);
        ctx.stroke();
    } else {
        head(0, 0);
        const top = -s * 1.0;
        ctx.beginPath();
        ctx.moveTo(s * 0.27, -s * 0.05);
        ctx.lineTo(s * 0.27, top);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s * 0.27, top);
        ctx.quadraticCurveTo(s * 0.72, top + s * 0.28, s * 0.5, top + s * 0.62);
        ctx.stroke();
    }
    ctx.restore();
}

/** A tapered, wandering branch that forks into smaller ones and ends in leaf clusters. */
function drawBranch(ctx, rng, x, y, angle, length, width, depth, curl = 0) {
    const segs = Math.max(3, Math.round(length / 12));
    const step = length / segs;
    const pts = [{ x, y, w: width, a: angle }];
    let a = angle;
    for (let i = 1; i <= segs; i++) {
        a += (rng() - 0.5) * 0.34 + curl;
        const p = pts[i - 1];
        pts.push({ x: p.x + Math.cos(a) * step, y: p.y + Math.sin(a) * step, w: width * (1 - 0.72 * (i / segs)), a });
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const passes = [
        { color: BARK_DARK, scale: 1, extra: 1.6, dx: 0 },
        { color: BARK_MID, scale: 0.74, extra: 0, dx: 0 },
        { color: BARK_LIGHT, scale: 0.22, extra: 0, dx: -0.16 }
    ];
    for (const pass of passes) {
        ctx.strokeStyle = pass.color;
        for (let i = 1; i < pts.length; i++) {
            ctx.lineWidth = Math.max(0.9, pts[i].w * pass.scale + pass.extra);
            const off = pass.dx * pts[i].w;
            ctx.beginPath();
            ctx.moveTo(pts[i - 1].x + off, pts[i - 1].y);
            ctx.lineTo(pts[i].x + off, pts[i].y);
            ctx.stroke();
        }
    }

    // Leaves sprouting in pairs along the outer part of thin branches
    if (depth <= 2) {
        for (let i = Math.floor(pts.length * 0.35); i < pts.length; i++) {
            if (rng() > 0.8) continue;
            const p = pts[i];
            const size = 8 + rng() * 6;
            drawLeaf(ctx, p.x, p.y, p.a - 0.9 - rng() * 0.5, size, pick(rng, LEAF_COLORS));
            drawLeaf(ctx, p.x, p.y, p.a + 0.9 + rng() * 0.5, size, pick(rng, LEAF_COLORS));
        }
    }

    const tip = pts[pts.length - 1];
    if (depth > 0) {
        const kids = depth >= 3 ? 3 : 2;
        for (let k = 0; k < kids; k++) {
            const spread = (k - (kids - 1) / 2) * (0.55 + rng() * 0.3) + (rng() - 0.5) * 0.25;
            const from = pts[Math.floor(pts.length * (0.6 + rng() * 0.4))] || tip;
            drawBranch(ctx, rng, from.x, from.y, tip.a + spread, length * (0.5 + rng() * 0.18), width * 0.55, depth - 1, curl);
        }
    } else {
        drawLeafCluster(ctx, rng, tip.x, tip.y, 24, 14);
    }
    return pts;
}

/**
 * A hanging vine: a sagging curve set with leaf pairs. If `notes` is given, the vine ends in a golden
 * note - recorded there ({ x, y, kind }) rather than painted, so the caller can place it on both
 * groves without the mirrored copy turning the note backwards.
 */
function drawVine(ctx, rng, x, y, length, notes) {
    const sway = (rng() - 0.5) * 18;
    ctx.strokeStyle = '#2f6b2c';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + sway, y + length * 0.55, x + sway * 0.4, y + length);
    ctx.stroke();
    for (let d = 10; d < length - 4; d += 12 + rng() * 6) {
        const t = d / length;
        const vx = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * (x + sway) + t * t * (x + sway * 0.4);
        const vy = y + d;
        drawLeaf(ctx, vx, vy, 0.5 + rng() * 0.4, 7 + rng() * 4, pick(rng, LEAF_COLORS));
        drawLeaf(ctx, vx, vy, Math.PI - 0.5 - rng() * 0.4, 7 + rng() * 4, pick(rng, LEAF_COLORS));
    }
    if (notes) {
        const nx = x + sway * 0.4;
        const ny = y + length;
        ctx.strokeStyle = 'rgba(255, 220, 130, 0.6)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(nx, ny + 5);
        ctx.stroke();
        notes.push({ x: nx - 2, y: ny + 12, size: 11, kind: rng() < 0.5 ? 'eighth' : 'beamed' });
    }
}

function drawGrass(ctx, rng, x0, x1, baseY, maxH) {
    for (let gx = x0; gx < x1; gx += 1.6 + rng() * 2.6) {
        const h = 6 + rng() * maxH;
        const lean = (rng() - 0.5) * 7;
        ctx.fillStyle = pick(rng, GRASS_COLORS);
        ctx.beginPath();
        ctx.moveTo(gx - 1.6, baseY);
        ctx.quadraticCurveTo(gx + lean * 0.3, baseY - h * 0.6, gx + lean, baseY - h);
        ctx.quadraticCurveTo(gx + lean * 0.3 + 1.6, baseY - h * 0.5, gx + 1.6, baseY);
        ctx.fill();
    }
}

function drawGlowDot(ctx, x, y, r, color) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(255, 240, 160, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * The grove that fills the blank space beside the song column: a big tree growing up the outer
 * edge and reaching a branch across toward the tiles, hanging vines with golden notes, a hedge and
 * grass at the bottom. Painted once, for the LEFT side only - the right side is this very picture
 * flipped, which is what keeps the whole menu symmetrical while each grove itself stays organic.
 */
function paintGrove(ctx, w, h) {
    const rng = makeRng(20240917);

    // Sky-lit forest floor: deep green, brighter high up and toward the outer corner
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#22401f');
    bg.addColorStop(0.55, '#173217');
    bg.addColorStop(1, '#0c1b0d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const light = ctx.createRadialGradient(w * 0.25, -20, 10, w * 0.25, -20, h * 0.85);
    light.addColorStop(0, 'rgba(190, 235, 140, 0.32)');
    light.addColorStop(1, 'rgba(190, 235, 140, 0)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, w, h);

    // Shafts of sunlight slanting down through the canopy, toward the tiles (so, once mirrored,
    // both groves' light converges on the column)
    for (const s of [{ x: 30, wd: 44, a: 0.16 }, { x: 112, wd: 30, a: 0.12 }]) {
        const sg = ctx.createLinearGradient(0, 0, 0, h);
        sg.addColorStop(0, `rgba(230, 255, 170, ${s.a})`);
        sg.addColorStop(1, 'rgba(230, 255, 170, 0)');
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.moveTo(s.x, 0);
        ctx.lineTo(s.x + s.wd, 0);
        ctx.lineTo(s.x + s.wd + 100, h);
        ctx.lineTo(s.x + 100, h);
        ctx.closePath();
        ctx.fill();
    }

    // Back layer of dense, dark foliage behind the branches so the canopy has body
    const backLeaves = LEAF_COLORS.slice(0, 3);
    for (const b of [{ x: 62, y: 96, r: 44 }, { x: 118, y: 74, r: 40 }, { x: 34, y: 132, r: 34 }, { x: 150, y: 132, r: 34 }, { x: 96, y: 130, r: 36 }]) {
        drawLeafCluster(ctx, rng, b.x, b.y, b.r, 26, backLeaves);
    }

    // Light dust drifting in the rays
    for (let i = 0; i < 16; i++) {
        drawGlowDot(ctx, rng() * w, 20 + rng() * (h * 0.75), 2 + rng() * 3.5, `rgba(255, 244, 170, ${0.25 + rng() * 0.3})`);
    }

    // The big tree: trunk up the outer edge, forking into a canopy
    drawBranch(ctx, rng, 44, h + 8, -1.5, 175, 26, 3, 0.012);
    // ...and a long limb reaching in toward the tiles
    const limb = drawBranch(ctx, rng, 52, h * 0.5, -0.32, 118, 10, 2, -0.02);

    // Golden notes hang from some of the vines and sit among the leaves like fruit. They are only
    // RECORDED here and painted by the caller on both groves: baked in, the flipped copy would
    // show every note backwards.
    const notes = [];

    // Hanging vines (some ending in a note) from the reaching limb and the canopy
    for (let i = 3; i < limb.length - 1; i += 2) {
        drawVine(ctx, rng, limb[i].x, limb[i].y + 4, 34 + rng() * 34, i % 4 === 3 ? notes : null);
    }
    drawVine(ctx, rng, 108, h * 0.2, 58, notes);
    drawVine(ctx, rng, 26, h * 0.3, 44, null);

    for (const n of [{ x: 78, y: h * 0.34, kind: 'eighth' }, { x: 132, y: h * 0.26, kind: 'beamed' }, { x: 30, y: h * 0.45, kind: 'beamed' }]) {
        notes.push({ x: n.x, y: n.y, size: 13, kind: n.kind });
    }

    // Undergrowth: hedge of leaves and grass along the bottom
    drawGrass(ctx, rng, 0, w, h, 14);
    for (let hx = 6; hx < w; hx += 20 + rng() * 14) {
        drawLeafCluster(ctx, rng, hx, h - 4 - rng() * 8, 26 + rng() * 10, 10);
    }
    drawGrass(ctx, rng, 0, w, h, 9);

    // A sapling growing beside the tiles
    drawBranch(ctx, rng, w - 34, h + 4, -1.45, 64, 5, 1, 0.02);

    // Fade into the column on the inner edge so the grove and the tiles blend instead of butting up
    const fade = ctx.createLinearGradient(w - 46, 0, w, 0);
    fade.addColorStop(0, 'rgba(8, 16, 8, 0)');
    fade.addColorStop(1, 'rgba(8, 16, 8, 0.6)');
    ctx.fillStyle = fade;
    ctx.fillRect(w - 46, 0, 46, h);

    return notes;
}

/** A wooden post with a vine winding round it - the left rail as-is, the right rail as its mirror. */
function paintRail(ctx, x, y, w, h) {
    const rng = makeRng(777);
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, '#22130a');
    g.addColorStop(0.32, '#6b4526');
    g.addColorStop(0.68, '#4a2f1a');
    g.addColorStop(1, '#1f1108');
    roundedRectPath(ctx, x, y, w, h, 5);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Vine spiralling down the post, leaves alternating
    ctx.strokeStyle = '#2f6b2c';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const cx = x + w / 2;
    const amp = w * 0.36;
    for (let py = y + 6; py <= y + h - 6; py += 3) {
        const vx = cx + Math.sin((py - y) / 15) * amp;
        if (py === y + 6) ctx.moveTo(vx, py); else ctx.lineTo(vx, py);
    }
    ctx.stroke();
    for (let py = y + 14, i = 0; py < y + h - 10; py += 22, i++) {
        const vx = cx + Math.sin((py - y) / 15) * amp;
        drawLeaf(ctx, vx, py, i % 2 ? -0.5 : Math.PI + 0.5, 8 + rng() * 3, pick(rng, LEAF_COLORS));
    }
}

// ---------------------------------------------------------------------------------------------

export class MusicalScoresMenu {
    constructor(stateManager, settlementHub) {
        this.stateManager = stateManager;
        this.settlementHub = settlementHub;
        this.isOpen = false;
        this.animationProgress = 0;
        this.animTime = 0;
        this.openTime = 0;

        // Every unlocked track (keyed by musicId), grouped into titled sections, laid out as
        // rows of three down one tall column that scrolls inside the window.
        this.unlockedMusicTracks = new Map();
        this.sections = [];
        this.layout = [];
        this.contentHeight = 0;
        this.maxScroll = 0;
        this.scrollY = 0;
        this.scrollTarget = 0;

        this.hoveredTile = null;
        this.hoveredBarPart = null;
        this._drag = null;              // { grab } while the scrollbar thumb is being dragged
        this._dragEndedAt = -Infinity;  // swallows the click a drag's mouse-up produces

        this.closeButtonHovered = false;
        this.supportBardButtonHovered = false;

        this.showSupportConfirm = false;
        this.supportConfirmOpenTime = 0;
        this.supportConfirmOpenHovered = false;
        this.supportConfirmCancelHovered = false;

        this._backdrop = null;          // prerendered frame + grove, built on first render
    }

    open() {
        this.isOpen = true;
        this.animationProgress = 0;
        this.animTime = 0;
        this.openTime = Date.now();
        this.scrollY = 0;
        this.scrollTarget = 0;
        this.hoveredTile = null;
        this.hoveredBarPart = null;
        this._drag = null;
        this.buildUnlockedMusicList();
    }

    close() {
        this.isOpen = false;
        this._drag = null;
        this.settlementHub.closePopup();
    }

    buildUnlockedMusicList() {
        this.unlockedMusicTracks.clear();
        if (this.stateManager.marketplaceSystem) {
            const musicItems = MarketplaceRegistry.getItemsByCategory('music');
            for (const [itemId, itemData] of Object.entries(musicItems)) {
                const count = this.stateManager.marketplaceSystem.getConsumableCount(itemId);
                if (count > 0) {
                    this.unlockedMusicTracks.set(itemData.musicId, {
                        id: itemId,
                        name: itemData.name,
                        musicId: itemData.musicId,
                        isPlaying: false
                    });
                }
            }
        }

        // Settlement theme songs aren't sold individually in the marketplace -
        // they auto-unlock as soon as the musical-equipment upgrade is owned.
        const upgradeSystem = this.stateManager.upgradeSystem;
        if (upgradeSystem && upgradeSystem.hasUpgrade('musical-equipment')) {
            const settlementTracks = MusicRegistry.getMusicByCategory('settlement');
            for (const musicId of Object.keys(settlementTracks)) {
                const num = musicId.match(/(\d+)$/);
                this.unlockedMusicTracks.set(musicId, {
                    id: musicId,
                    name: num ? `Settlement Theme ${num[1]}` : 'Settlement Theme',
                    musicId,
                    isPlaying: false
                });
            }
        }

        this._buildSections();
        this._buildLayout();
    }

    /**
     * Which titled section a track belongs to, from its MusicRegistry category: each campaign's
     * battle themes sit under that campaign's name, settlement themes under "Settlement", and
     * everything else (menu theme, victory/defeat tunes, boss fanfare, bonus-level theme) under "Misc".
     */
    _sectionInfoFor(musicId) {
        const category = MusicRegistry.getMusic(musicId)?.category || '';
        const campaign = /^campaign-(\d+)$/.exec(category);
        if (campaign) {
            const info = CampaignRegistry.getCampaign(category);
            return { key: category, order: Number(campaign[1]), title: info?.name || `Campaign ${campaign[1]}` };
        }
        if (category === 'settlement') return { key: 'settlement', order: 1000, title: 'Settlement' };
        return { key: 'misc', order: 2000, title: 'Misc' };
    }

    _buildSections() {
        const byKey = new Map();
        for (const track of this.unlockedMusicTracks.values()) {
            const info = this._sectionInfoFor(track.musicId);
            if (!byKey.has(info.key)) byKey.set(info.key, { ...info, tracks: [] });
            byKey.get(info.key).tracks.push(track);
        }
        // Campaigns in campaign order, then Settlement, then Misc; sections with no unlocked tracks never appear
        this.sections = [...byKey.values()].sort((a, b) => a.order - b.order);
    }

    /** Positions every header and tile in the (unscrolled) column and sizes the scroll range. */
    _buildLayout() {
        const items = [];
        let y = PAD_TOP;
        this.sections.forEach((section, si) => {
            items.push({ kind: 'header', y, title: section.title });
            y += HEADER_H + HEADER_GAP;
            section.tracks.forEach((track, i) => {
                items.push({
                    kind: 'tile',
                    x: (i % COLS) * (TILE + TILE_GAP),
                    y: y + Math.floor(i / COLS) * ROW_H,
                    track
                });
            });
            y += Math.ceil(section.tracks.length / COLS) * ROW_H - TILE_GAP;
            if (si < this.sections.length - 1) y += SECTION_GAP;
        });
        this.layout = items;
        this.contentHeight = y + PAD_BOTTOM;
        this.maxScroll = Math.max(0, this.contentHeight - VIEW_H);
        this.scrollY = Math.min(this.scrollY, this.maxScroll);
        this.scrollTarget = Math.min(this.scrollTarget, this.maxScroll);
    }

    openSupportConfirm() {
        this.showSupportConfirm = true;
        this.supportConfirmOpenTime = Date.now();
    }

    confirmOpenBardWebsite() {
        const url = 'http://kardipaseyan.nl/';
        this.showSupportConfirm = false;
        // Opened directly from the click handler (not from inside a blocking
        // native dialog) so the browser still treats this as a user-triggered
        // action and won't pop-up-block it.
        const tauriInvoke = SaveSystem.getTauriInvoke();
        if (tauriInvoke) {
            tauriInvoke('open_external_url', { url }).catch(err => {
                console.warn('Failed to open external URL via Tauri:', err);
            });
        } else {
            window.open(url, '_blank');
        }
    }

    playMusicTrack(music) {
        if (this.stateManager.audioManager) {
            this.stateManager.audioManager.musicPlaylistMode = false;
            this.stateManager.audioManager.playMusic(music.musicId, false);
            this.stateManager.audioManager.isManualMusicSelection = true;
        }
    }

    // ------------------------------------------------------------------ scrolling

    scrollBy(pixels) {
        this.scrollTarget = Math.max(0, Math.min(this.maxScroll, this.scrollTarget + pixels));
    }

    /** Mouse wheel / trackpad over the menu (routed by SettlementHub's canvas wheel listener). */
    handleWheel(x, y, deltaY, deltaMode = 0) {
        if (this.showSupportConfirm || this.maxScroll <= 0) return;
        // Browsers disagree on the unit: pixels by default, lines on some (Firefox), pages rarely
        const pixels = deltaMode === 1 ? deltaY * WHEEL_LINE_PX
            : deltaMode === 2 ? deltaY * VIEW_H
            : deltaY;
        this.scrollBy(pixels);
    }

    /** Where everything sits on the canvas right now (the modal is centred). */
    _geometry() {
        const canvas = this.stateManager.canvas;
        const menuX = canvas.width / 2 - MENU_W / 2;
        const menuY = canvas.height / 2 - MENU_H / 2;
        const view = { x: menuX + VIEW_X, y: menuY + VIEW_Y, w: VIEW_W, h: VIEW_H };
        const railX = menuX + RAIL_RIGHT_X;
        return {
            menuX, menuY, view,
            colX: view.x + GUTTER_W,
            close: { x: menuX + MENU_W - 35, y: menuY + 10, w: 25, h: 25 },
            support: { x: menuX + 20, y: menuY + 42, w: 160, h: 22 },
            up: { x: railX, y: view.y, w: RAIL_W, h: ARROW_H },
            down: { x: railX, y: view.y + view.h - ARROW_H, w: RAIL_W, h: ARROW_H },
            track: { x: railX, y: view.y + ARROW_H + 2, w: RAIL_W, h: view.h - ARROW_H * 2 - 4 }
        };
    }

    _thumbRect(g) {
        const h = Math.max(32, g.track.h * (VIEW_H / this.contentHeight));
        const t = this.maxScroll > 0 ? this.scrollY / this.maxScroll : 0;
        return { x: g.track.x, y: g.track.y + (g.track.h - h) * t, w: g.track.w, h };
    }

    /** Which part of the scrollbar (if any) is at (x, y). */
    _barPartAt(g, x, y) {
        if (this.maxScroll <= 0) return null;
        if (inRect(x, y, g.up)) return 'up';
        if (inRect(x, y, g.down)) return 'down';
        if (inRect(x, y, this._thumbRect(g))) return 'thumb';
        if (inRect(x, y, g.track)) return 'track';
        return null;
    }

    _tileAt(g, x, y) {
        if (!inRect(x, y, g.view)) return null;
        const cx = x - g.colX;
        const cy = y - g.view.y + this.scrollY;
        for (const item of this.layout) {
            if (item.kind === 'tile' && cx >= item.x && cx <= item.x + TILE && cy >= item.y && cy <= item.y + TILE) {
                return item;
            }
        }
        return null;
    }

    // ------------------------------------------------------------------ input

    update(deltaTime) {
        if (!this.isOpen) return;
        if (this.animationProgress < 1) {
            this.animationProgress += deltaTime * 2;
        }
        this.animTime += deltaTime;

        // Ease toward the scroll target; snap once it's within half a pixel
        const diff = this.scrollTarget - this.scrollY;
        if (Math.abs(diff) < 0.5) {
            this.scrollY = this.scrollTarget;
        } else {
            this.scrollY += diff * (1 - Math.exp(-deltaTime * 16));
        }
    }

    getSupportConfirmBounds(canvas) {
        const dialogWidth = 420;
        const dialogHeight = 190;
        const dialogX = canvas.width / 2 - dialogWidth / 2;
        const dialogY = canvas.height / 2 - dialogHeight / 2;
        const buttonWidth = 150;
        const buttonHeight = 32;
        const buttonY = dialogY + dialogHeight - 50;
        const openBtn = {
            x: dialogX + dialogWidth / 2 - buttonWidth - 10,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        };
        const cancelBtn = {
            x: dialogX + dialogWidth / 2 + 10,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        };
        return { dialogX, dialogY, dialogWidth, dialogHeight, openBtn, cancelBtn };
    }

    updateHoverState(x, y) {
        const canvas = this.stateManager.canvas;

        if (this.showSupportConfirm) {
            const { openBtn, cancelBtn } = this.getSupportConfirmBounds(canvas);
            this.supportConfirmOpenHovered = x >= openBtn.x && x <= openBtn.x + openBtn.width &&
                                             y >= openBtn.y && y <= openBtn.y + openBtn.height;
            this.supportConfirmCancelHovered = x >= cancelBtn.x && x <= cancelBtn.x + cancelBtn.width &&
                                               y >= cancelBtn.y && y <= cancelBtn.y + cancelBtn.height;
            canvas.style.cursor = (this.supportConfirmOpenHovered || this.supportConfirmCancelHovered) ? 'pointer' : 'default';
            return;
        }

        const g = this._geometry();

        // Dragging the thumb: the pointer, not the wheel, owns the scroll position
        if (this._drag) {
            const thumb = this._thumbRect(g);
            const room = g.track.h - thumb.h;
            const ratio = room > 0 ? (y - this._drag.grab - g.track.y) / room : 0;
            this.scrollY = this.scrollTarget = Math.max(0, Math.min(this.maxScroll, ratio * this.maxScroll));
            canvas.style.cursor = 'pointer';
            return;
        }

        this.closeButtonHovered = inRect(x, y, g.close);
        this.supportBardButtonHovered = inRect(x, y, g.support);
        this.hoveredBarPart = this._barPartAt(g, x, y);
        this.hoveredTile = this._tileAt(g, x, y);

        canvas.style.cursor =
            (this.closeButtonHovered || this.supportBardButtonHovered || this.hoveredBarPart || this.hoveredTile)
                ? 'pointer' : 'default';
    }

    /** Mouse button pressed over the canvas: only the scrollbar thumb needs it (to start a drag). */
    handlePointerDown(x, y) {
        if (this.showSupportConfirm || this.maxScroll <= 0) return;
        const g = this._geometry();
        if (this._barPartAt(g, x, y) === 'thumb') {
            this._drag = { grab: y - this._thumbRect(g).y };
        }
    }

    handlePointerUp() {
        if (!this._drag) return;
        this._drag = null;
        // The mouse-up that ends a drag is followed by a click - don't let that page the track
        this._dragEndedAt = performance.now();
    }

    handleClick(x, y) {
        const canvas = this.stateManager.canvas;

        if (this.showSupportConfirm) {
            const timeSinceConfirmOpen = Date.now() - this.supportConfirmOpenTime;
            if (timeSinceConfirmOpen < 200) return;
            const { openBtn, cancelBtn } = this.getSupportConfirmBounds(canvas);
            if (x >= openBtn.x && x <= openBtn.x + openBtn.width &&
                y >= openBtn.y && y <= openBtn.y + openBtn.height) {
                this.confirmOpenBardWebsite();
            } else if (x >= cancelBtn.x && x <= cancelBtn.x + cancelBtn.width &&
                       y >= cancelBtn.y && y <= cancelBtn.y + cancelBtn.height) {
                this.showSupportConfirm = false;
            }
            return;
        }

        const timeSinceOpen = Date.now() - this.openTime;
        if (timeSinceOpen < 200) return;
        if (performance.now() - this._dragEndedAt < 150) return;

        const g = this._geometry();

        if (inRect(x, y, g.close)) {
            this.close();
            return;
        }

        if (inRect(x, y, g.support)) {
            this.openSupportConfirm();
            return;
        }

        // Scrollbar: arrows step a row, a click on the track pages toward the click. (Handled on
        // click rather than mouse-down so a plain tap works on touch, where there is no mouse-down.)
        const part = this._barPartAt(g, x, y);
        if (part === 'up') { this.scrollBy(-ROW_H); return; }
        if (part === 'down') { this.scrollBy(ROW_H); return; }
        if (part === 'track') {
            this.scrollBy(y < this._thumbRect(g).y ? -VIEW_H * 0.85 : VIEW_H * 0.85);
            return;
        }
        if (part === 'thumb') return;

        const tile = this._tileAt(g, x, y);
        if (tile) {
            this.playMusicTrack(tile.track);
        }
    }

    // ------------------------------------------------------------------ rendering

    drawCornerTrim(ctx, x, y, size, isTopLeft, isTopRight, isBottomLeft, isBottomRight) {
        ctx.fillStyle = GOLD;
        if (isTopLeft) { ctx.fillRect(x, y, size, 3); ctx.fillRect(x, y, 3, size); }
        else if (isTopRight) { ctx.fillRect(x - size, y, size, 3); ctx.fillRect(x - 3, y, 3, size); }
        else if (isBottomLeft) { ctx.fillRect(x, y - 3, size, 3); ctx.fillRect(x, y - size, 3, size); }
        else if (isBottomRight) { ctx.fillRect(x - size, y - 3, size, 3); ctx.fillRect(x - 3, y - size, 3, size); }
        ctx.fillStyle = GOLD_BRIGHT;
        const g = 4;
        if (isTopLeft) { ctx.beginPath(); ctx.arc(x + g, y + g, g / 2, 0, Math.PI * 2); ctx.fill(); }
        else if (isTopRight) { ctx.beginPath(); ctx.arc(x - g, y + g, g / 2, 0, Math.PI * 2); ctx.fill(); }
        else if (isBottomLeft) { ctx.beginPath(); ctx.arc(x + g, y - g, g / 2, 0, Math.PI * 2); ctx.fill(); }
        else if (isBottomRight) { ctx.beginPath(); ctx.arc(x - g, y - g, g / 2, 0, Math.PI * 2); ctx.fill(); }
    }

    /**
     * The menu's static art - wooden frame, the forest window with its two mirrored groves, the
     * rails and the title - painted once into an offscreen canvas (modal-local coordinates) and
     * blitted every frame. Only tiles, headers, floating notes, the scrollbar and the buttons are
     * drawn live on top.
     */
    _getBackdrop() {
        if (this._backdrop) return this._backdrop;
        const canvas = document.createElement('canvas');
        canvas.width = MENU_W;
        canvas.height = MENU_H;
        this._paintBackdrop(canvas.getContext('2d'));
        this._backdrop = canvas;
        return canvas;
    }

    _paintBackdrop(ctx) {
        // Wooden frame
        const wood = ctx.createLinearGradient(0, 0, 0, MENU_H);
        wood.addColorStop(0, '#3b2616');
        wood.addColorStop(1, '#22140a');
        ctx.fillStyle = wood;
        ctx.fillRect(0, 0, MENU_W, MENU_H);
        const grain = makeRng(4242);
        ctx.strokeStyle = 'rgba(255, 220, 160, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 26; i++) {
            const gy = grain() * MENU_H;
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.bezierCurveTo(MENU_W * 0.3, gy + (grain() - 0.5) * 8, MENU_W * 0.7, gy + (grain() - 0.5) * 8, MENU_W, gy + (grain() - 0.5) * 6);
            ctx.stroke();
        }
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, MENU_W - 2, MENU_H - 2);
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(6.5, 6.5, MENU_W - 13, MENU_H - 13);

        // The forest window: a grove either side, the right one the left one flipped
        const grove = document.createElement('canvas');
        grove.width = Math.round(GUTTER_W);
        grove.height = VIEW_H;
        const groveNotes = paintGrove(grove.getContext('2d'), grove.width, grove.height);
        ctx.drawImage(grove, VIEW_X, VIEW_Y);
        ctx.save();
        ctx.translate(VIEW_X + VIEW_W, VIEW_Y);
        ctx.scale(-1, 1);
        ctx.drawImage(grove, 0, 0);
        ctx.restore();
        // The groves' golden notes: mirrored POSITIONS, but each glyph upright (a flipped note reads backwards)
        for (const n of groveNotes) {
            for (const nx of [VIEW_X + n.x, VIEW_X + VIEW_W - n.x]) {
                drawGlowDot(ctx, nx, VIEW_Y + n.y - n.size * 0.5, n.size * 1.5, 'rgba(255, 215, 90, 0.35)');
                drawNote(ctx, nx, VIEW_Y + n.y, n.size, n.kind, GOLD_BRIGHT);
            }
        }

        // Between them, the column the tiles run down: dark and calm so the tiles read clearly
        const col = ctx.createLinearGradient(VIEW_X + GUTTER_W, 0, VIEW_X + GUTTER_W + COLUMN_W, 0);
        col.addColorStop(0, 'rgba(14, 8, 4, 0.5)');
        col.addColorStop(0.5, 'rgba(14, 8, 4, 0.72)');
        col.addColorStop(1, 'rgba(14, 8, 4, 0.5)');
        ctx.fillStyle = col;
        ctx.fillRect(VIEW_X + GUTTER_W - 6, VIEW_Y, COLUMN_W + 12, VIEW_H);

        // Sunk into the frame
        ctx.strokeStyle = '#0d0805';
        ctx.lineWidth = 3;
        ctx.strokeRect(VIEW_X - 1.5, VIEW_Y - 1.5, VIEW_W + 3, VIEW_H + 3);
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
        ctx.lineWidth = 1;
        ctx.strokeRect(VIEW_X - 3.5, VIEW_Y - 3.5, VIEW_W + 7, VIEW_H + 7);

        // Rails either side (the right one hosts the scrollbar)
        paintRail(ctx, RAIL_LEFT_X, VIEW_Y, RAIL_W, VIEW_H);
        ctx.save();
        ctx.translate(RAIL_RIGHT_X + RAIL_W, 0);
        ctx.scale(-1, 1);
        paintRail(ctx, 0, VIEW_Y, RAIL_W, VIEW_H);
        ctx.restore();

        // Ivy climbing the bottom corners of the frame, mirrored left/right
        const ivy = (cx, cy, sx) => {
            const r = makeRng(99);
            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(sx, 1);
            for (let i = 0; i < 9; i++) {
                drawLeaf(ctx, 2 + r() * 20, -2 - r() * 6, -0.2 - r() * 1.6, 9 + r() * 6, pick(r, LEAF_COLORS));
            }
            for (let i = 0; i < 5; i++) {
                drawLeaf(ctx, 3 + r() * 6, -6 - r() * 22, -1.5 + (r() - 0.5) * 1.2, 8 + r() * 5, pick(r, LEAF_COLORS));
            }
            ctx.restore();
        };
        ivy(8, MENU_H - 8, 1);
        ivy(MENU_W - 8, MENU_H - 8, -1);

        this.drawCornerTrim(ctx, 0, 0, 15, true, false, false, false);
        this.drawCornerTrim(ctx, MENU_W, 0, 15, false, true, false, false);
        this.drawCornerTrim(ctx, 0, MENU_H, 15, false, false, true, false);
        this.drawCornerTrim(ctx, MENU_W, MENU_H, 15, false, false, false, true);

        // Title, flanked by a note and a sprig on each side
        ctx.font = 'bold 24px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillText('MUSICAL SCORES', MENU_W / 2 + 1, 10);
        ctx.fillStyle = GOLD;
        ctx.fillText('MUSICAL SCORES', MENU_W / 2, 9);
        const titleHalf = ctx.measureText('MUSICAL SCORES').width / 2;
        const flank = (sign) => {
            const fx = MENU_W / 2 + sign * (titleHalf + 30);
            // Note upright on both sides; only the sprig beside it is mirrored (angle t -> PI - t)
            const angle = (t) => (sign > 0 ? t : Math.PI - t);
            drawNote(ctx, fx - 4, 30, 16, 'eighth', GOLD_BRIGHT);
            drawLeaf(ctx, fx + sign * 12, 32, angle(-0.15), 12, LEAF_COLORS[3]);
            drawLeaf(ctx, fx + sign * 12, 32, angle(0.55), 10, LEAF_COLORS[2]);
        };
        flank(-1);
        flank(1);
    }

    render(ctx) {
        const canvas = this.stateManager.canvas;
        const g = this._geometry();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.globalAlpha = Math.min(1, this.animationProgress);

        ctx.drawImage(this._getBackdrop(), g.menuX, g.menuY);

        // Everything scrolling or floating lives inside the window
        ctx.save();
        ctx.beginPath();
        ctx.rect(g.view.x, g.view.y, g.view.w, g.view.h);
        ctx.clip();
        this._renderFloatingNotes(ctx, g);
        this._renderContent(ctx, g);
        this._renderEdgeFades(ctx, g);
        ctx.restore();

        this._renderScrollbar(ctx, g);
        this._renderButtons(ctx, g);

        ctx.restore();

        if (this.showSupportConfirm) {
            this.renderSupportConfirmDialog(ctx, canvas);
        }
    }

    /** Golden notes drifting up through both groves - the right side shows exactly the left's, flipped. */
    _renderFloatingNotes(ctx, g) {
        for (const n of FLOAT_NOTES) {
            const frac = (this.animTime * n.speed + n.phase) % 1;
            const y = g.view.y + g.view.h + 20 - frac * (g.view.h + 40);
            const wobble = n.x + Math.sin(this.animTime * 0.9 + n.phase * 6.28) * n.sway;
            const alpha = Math.sin(Math.PI * frac) * 0.85;
            if (alpha <= 0.02) continue;
            for (const mirrored of [false, true]) {
                const x = mirrored ? g.view.x + g.view.w - wobble : g.view.x + wobble;
                ctx.save();
                ctx.globalAlpha *= alpha;
                drawGlowDot(ctx, x, y - n.size * 0.4, n.size * 1.6, 'rgba(255, 220, 120, 0.4)');
                ctx.translate(x, y);
                drawNote(ctx, 0, 0, n.size, n.kind, GOLD_BRIGHT);   // upright on both sides
                ctx.restore();
            }
        }
    }

    _renderContent(ctx, g) {
        if (this.layout.length === 0) {
            ctx.font = '16px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#e8d5b5';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('No musical scores unlocked yet.', g.colX + COLUMN_W / 2, g.view.y + g.view.h / 2 - 12);
            ctx.fillText('Purchase scores at the Marketplace!', g.colX + COLUMN_W / 2, g.view.y + g.view.h / 2 + 14);
            return;
        }

        ctx.save();
        ctx.translate(g.colX, g.view.y - this.scrollY);
        const top = this.scrollY - TILE;
        const bottom = this.scrollY + VIEW_H + TILE;
        for (const item of this.layout) {
            if (item.y > bottom || item.y + TILE < top) continue;
            if (item.kind === 'header') this._renderHeader(ctx, item);
            else this._renderTile(ctx, item, item === this.hoveredTile);
        }
        ctx.restore();
    }

    /** "── ♪ Campaign Name ♪ ──": a title with a rule running out either side, ending in a leaf. */
    _renderHeader(ctx, item) {
        const cx = COLUMN_W / 2;
        const cy = item.y + HEADER_H / 2;

        let px = 15;
        ctx.font = `bold ${px}px serif`;
        // Long campaign names shrink to fit between the notes rather than crowding the rules out
        while (ctx.measureText(item.title).width > COLUMN_W - 110 && px > 10) {
            px--;
            ctx.font = `bold ${px}px serif`;
        }
        const half = ctx.measureText(item.title).width / 2;

        // Rules, brightest next to the title and fading toward the ends
        for (const sign of [-1, 1]) {
            const inner = cx + sign * (half + 32);
            const outer = cx + sign * (COLUMN_W / 2 + 6);
            const rule = ctx.createLinearGradient(inner, 0, outer, 0);
            rule.addColorStop(0, 'rgba(212, 175, 55, 0.9)');
            rule.addColorStop(1, 'rgba(212, 175, 55, 0.05)');
            ctx.strokeStyle = rule;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(inner, cy);
            ctx.lineTo(outer, cy);
            ctx.stroke();
            drawLeaf(ctx, outer, cy, sign < 0 ? Math.PI : 0, 9, LEAF_COLORS[3]);
        }

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillText(item.title, cx + 1, cy + 2);
        ctx.fillStyle = GOLD_BRIGHT;
        ctx.fillText(item.title, cx, cy + 1);

        // Upright on both sides - a mirrored note would read backwards
        for (const sign of [-1, 1]) {
            drawNote(ctx, cx + sign * (half + 17) - 3, cy + 4, 10, 'eighth', GOLD);
        }
    }

    _renderTile(ctx, item, hovered) {
        const { x, y, track } = item;

        // Wooden plank with a gold rim; lifts and glows under the pointer
        ctx.save();
        if (hovered) {
            ctx.shadowColor = 'rgba(255, 215, 0, 0.55)';
            ctx.shadowBlur = 14;
        }
        const body = ctx.createLinearGradient(0, y, 0, y + TILE);
        body.addColorStop(0, hovered ? '#5d4128' : '#4a3220');
        body.addColorStop(1, hovered ? '#40291a' : '#2f1d0e');
        roundedRectPath(ctx, x, y, TILE, TILE, 6);
        ctx.fillStyle = body;
        ctx.fill();
        ctx.restore();
        roundedRectPath(ctx, x, y, TILE, TILE, 6);
        ctx.strokeStyle = hovered ? GOLD_BRIGHT : '#8b7355';
        ctx.lineWidth = 2;
        ctx.stroke();
        roundedRectPath(ctx, x + 3.5, y + 3.5, TILE - 7, TILE - 7, 4);
        ctx.strokeStyle = 'rgba(255, 220, 150, 0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // A sprig in each top corner, mirrored
        for (const sign of [1, -1]) {
            ctx.save();
            ctx.translate(sign > 0 ? x + 6 : x + TILE - 6, y + 8);
            ctx.scale(sign, 1);
            drawLeaf(ctx, 0, 0, 0.35, 11, LEAF_COLORS[2]);
            drawLeaf(ctx, 0, 0, 1.05, 9, LEAF_COLORS[4]);
            ctx.restore();
        }

        drawNote(ctx, x + TILE / 2 - 5, y + 27, 17, 'eighth', hovered ? GOLD_BRIGHT : GOLD);

        // Title, wrapped to at most three lines
        ctx.font = 'bold 10px Trebuchet MS, sans-serif';
        ctx.fillStyle = '#f2d675';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const maxLines = 3;
        const lineHeight = 11;
        // A trailing number stays glued to the word before it ("Settlement Theme 4" wraps as
        // "Settlement / Theme 4", never "Settlement Theme / 4")
        const words = track.name.replace(/ (\d+)$/, ' $1').split(' ');
        const lines = [];
        let line = '';
        words.forEach(word => {
            const testLine = line + (line ? ' ' : '') + word;
            if (ctx.measureText(testLine).width > TILE - 12 && line) {
                lines.push(line);
                line = word;
            } else {
                line = testLine;
            }
        });
        if (line) lines.push(line);
        if (lines.length > maxLines) {
            lines.length = maxLines;
            lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*$/, '') + '…';
        }
        lines.forEach((l, idx) => {
            ctx.fillText(l, x + TILE / 2, y + 38 + idx * lineHeight);
        });

        // Play button
        const bx = x + TILE / 2;
        const by = y + 86;
        ctx.beginPath();
        ctx.arc(bx, by, 9, 0, Math.PI * 2);
        ctx.fillStyle = hovered ? GOLD_BRIGHT : GOLD;
        ctx.fill();
        ctx.strokeStyle = '#8b6a1f';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#1a0f0a';
        ctx.beginPath();
        ctx.moveTo(bx - 2.5, by - 4.5);
        ctx.lineTo(bx - 2.5, by + 4.5);
        ctx.lineTo(bx + 4.5, by);
        ctx.closePath();
        ctx.fill();
    }

    /** Shadowed lips at the window's top/bottom edge wherever there is more to scroll to. */
    _renderEdgeFades(ctx, g) {
        if (this.maxScroll <= 0) return;
        const v = g.view;
        if (this.scrollY > 1) {
            const fade = ctx.createLinearGradient(0, v.y, 0, v.y + 18);
            fade.addColorStop(0, 'rgba(8, 14, 8, 0.85)');
            fade.addColorStop(1, 'rgba(8, 14, 8, 0)');
            ctx.fillStyle = fade;
            ctx.fillRect(v.x, v.y, v.w, 18);
        }
        if (this.scrollY < this.maxScroll - 1) {
            const fade = ctx.createLinearGradient(0, v.y + v.h - 18, 0, v.y + v.h);
            fade.addColorStop(0, 'rgba(8, 14, 8, 0)');
            fade.addColorStop(1, 'rgba(8, 14, 8, 0.85)');
            ctx.fillStyle = fade;
            ctx.fillRect(v.x, v.y + v.h - 18, v.w, 18);
        }
    }

    /** The right rail's working parts: arrow buttons and a draggable thumb (only when there is something to scroll). */
    _renderScrollbar(ctx, g) {
        if (this.maxScroll <= 0) return;

        // Groove
        roundedRectPath(ctx, g.track.x + 3, g.track.y, g.track.w - 6, g.track.h, 3);
        ctx.fillStyle = 'rgba(10, 5, 2, 0.75)';
        ctx.fill();

        // Arrows
        for (const [name, rect, dir] of [['up', g.up, -1], ['down', g.down, 1]]) {
            const hot = this.hoveredBarPart === name;
            roundedRectPath(ctx, rect.x, rect.y, rect.w, rect.h, 3);
            ctx.fillStyle = hot ? '#8b6f47' : '#4a3220';
            ctx.fill();
            ctx.strokeStyle = hot ? GOLD_BRIGHT : '#8b7355';
            ctx.lineWidth = 1;
            ctx.stroke();
            const cx = rect.x + rect.w / 2;
            const cy = rect.y + rect.h / 2;
            ctx.fillStyle = hot ? GOLD_BRIGHT : GOLD;
            // dir is -1 for the up arrow (apex above the centre) and +1 for the down arrow
            ctx.beginPath();
            ctx.moveTo(cx - 4, cy - dir * 2);
            ctx.lineTo(cx + 4, cy - dir * 2);
            ctx.lineTo(cx, cy + dir * 3);
            ctx.closePath();
            ctx.fill();
        }

        // Thumb
        const thumb = this._thumbRect(g);
        const hot = this._drag || this.hoveredBarPart === 'thumb';
        const tg = ctx.createLinearGradient(thumb.x, 0, thumb.x + thumb.w, 0);
        tg.addColorStop(0, hot ? '#b8912c' : '#8f6f1f');
        tg.addColorStop(0.5, hot ? '#ffd700' : '#d4af37');
        tg.addColorStop(1, hot ? '#b8912c' : '#8f6f1f');
        roundedRectPath(ctx, thumb.x + 2, thumb.y, thumb.w - 4, thumb.h, 4);
        ctx.fillStyle = tg;
        ctx.fill();
        ctx.strokeStyle = '#5a4210';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Grip ridges
        ctx.strokeStyle = 'rgba(60, 40, 5, 0.6)';
        for (let i = -1; i <= 1; i++) {
            const gy = thumb.y + thumb.h / 2 + i * 4;
            ctx.beginPath();
            ctx.moveTo(thumb.x + 5, gy);
            ctx.lineTo(thumb.x + thumb.w - 5, gy);
            ctx.stroke();
        }
    }

    _renderButtons(ctx, g) {
        // "Support the Bard" button - links out to Paseyan the Bard's website
        const s = g.support;
        ctx.fillStyle = this.supportBardButtonHovered ? '#8b6f47' : '#3d2817';
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.strokeStyle = this.supportBardButtonHovered ? GOLD_BRIGHT : '#8b7355';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(s.x, s.y, s.w, s.h);
        ctx.font = 'bold 11px Trebuchet MS, sans-serif';
        ctx.fillStyle = this.supportBardButtonHovered ? GOLD_BRIGHT : GOLD;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Support the Bard', s.x + s.w / 2, s.y + s.h / 2 + 1);

        const c = g.close;
        ctx.fillStyle = this.closeButtonHovered ? '#ff6666' : '#cc0000';
        ctx.fillRect(c.x, c.y, c.w, c.h);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(c.x, c.y, c.w, c.h);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('×', c.x + c.w / 2, c.y + c.h / 2 + 1);
    }

    renderSupportConfirmDialog(ctx, canvas) {
        const { dialogX, dialogY, dialogWidth, dialogHeight, openBtn, cancelBtn } = this.getSupportConfirmBounds(canvas);

        // Dim everything behind the dialog, including the menu itself
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#2a1a0f';
        ctx.fillRect(dialogX, dialogY, dialogWidth, dialogHeight);
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 2;
        ctx.strokeRect(dialogX, dialogY, dialogWidth, dialogHeight);

        this.drawCornerTrim(ctx, dialogX, dialogY, 12, true, false, false, false);
        this.drawCornerTrim(ctx, dialogX + dialogWidth, dialogY, 12, false, true, false, false);
        this.drawCornerTrim(ctx, dialogX, dialogY + dialogHeight, 12, false, false, true, false);
        this.drawCornerTrim(ctx, dialogX + dialogWidth, dialogY + dialogHeight, 12, false, false, false, true);

        ctx.font = 'bold 18px serif';
        ctx.fillStyle = GOLD;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('Support the Bard', dialogX + dialogWidth / 2, dialogY + 16);

        ctx.font = '13px Trebuchet MS, sans-serif';
        ctx.fillStyle = '#e8d5b5';
        const lines = [
            'This will open a new window and take you to the',
            "website of Paseyan the Bard:",
            'kardipaseyan.nl'
        ];
        lines.forEach((line, idx) => {
            ctx.fillText(line, dialogX + dialogWidth / 2, dialogY + 52 + idx * 18);
        });

        // Open Website button
        ctx.fillStyle = this.supportConfirmOpenHovered ? '#8b6f47' : '#3d2817';
        ctx.fillRect(openBtn.x, openBtn.y, openBtn.width, openBtn.height);
        ctx.strokeStyle = this.supportConfirmOpenHovered ? GOLD_BRIGHT : '#8b7355';
        ctx.lineWidth = 2;
        ctx.strokeRect(openBtn.x, openBtn.y, openBtn.width, openBtn.height);
        ctx.font = 'bold 13px Trebuchet MS, sans-serif';
        ctx.fillStyle = this.supportConfirmOpenHovered ? GOLD_BRIGHT : GOLD;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Open Website', openBtn.x + openBtn.width / 2, openBtn.y + openBtn.height / 2 + 1);

        // Cancel button
        ctx.fillStyle = this.supportConfirmCancelHovered ? '#5a3a3a' : '#3d2817';
        ctx.fillRect(cancelBtn.x, cancelBtn.y, cancelBtn.width, cancelBtn.height);
        ctx.strokeStyle = this.supportConfirmCancelHovered ? '#ff6666' : '#8b7355';
        ctx.lineWidth = 2;
        ctx.strokeRect(cancelBtn.x, cancelBtn.y, cancelBtn.width, cancelBtn.height);
        ctx.fillStyle = this.supportConfirmCancelHovered ? '#ff6666' : GOLD;
        ctx.fillText('Cancel', cancelBtn.x + cancelBtn.width / 2, cancelBtn.y + cancelBtn.height / 2 + 1);
    }
}
