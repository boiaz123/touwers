import { EnemyColorCache, FROG_COLOR_VARIANTS } from '../../../utils/EnemyColorCache.js';
import { createRigNodes } from './RigCommon.js';

/**
 * Sprite rig for the standard FrogEnemy - see RigCommon.js for the spec/node model.
 *
 * Two halves:
 *   1. createFrogRigSpec(): the frog cut into parts (body, head, hat, and per leg a thigh,
 *      shin and webbed foot) that are drawn ONCE per skin colour into a texture atlas.
 *   2. makeHop() / poseFrog(): the animation. Every hop is generated with its own height,
 *      duration, lean, leg extension and hat swing (see HOP_STYLES) and turned into a handful
 *      of keyframe tracks; poseFrog() samples those each frame and writes the part poses.
 *
 * All geometry below is in units of `S` (the enemy's baseSize), y down, x toward the side the
 * frog faces (the whole thing is mirrored by the adapter when it faces left).
 */

export const frogColors = new EnemyColorCache(FROG_COLOR_VARIANTS);

export const FROG_PARTICLE_COUNT = 8;

const TAU = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (lo, hi) => lo + Math.random() * (hi - lo);
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

// Leg extension at the hop boundaries (just landed / about to coil): slightly folded.
const LEG_REST = 0.10;

// Where the frog's feet meet the ground (the shadow sits here), and the point the whole figure
// tilts around when it leans into a hop - both in S units below the frog's origin.
const GROUND_Y = 1.32;
const FIGURE_PIVOT_Y = 0.75;
// The folded legs sit higher than the old splayed ones did, so the whole frog is nudged down to
// keep its visual centre (and its feet/shadow contact) where it always was on the path.
const FIGURE_DROP = 0.20;

// Hind leg: hip on the body's side, a thigh, a shin and a webbed foot, each rotating about its
// own joint. Angles are absolute (radians, y down) for the RIGHT leg; the left is mirrored.
//   e = 0: crouched - thigh up and out, shin folded back under it, foot flat, the classic
//          folded frog "Z".
//   e = 1: fully extended - the leg stretched down and back behind the body, toes pointed.
const LEG = {
    hipX: 0.30, hipY: 0.42,
    thigh: 0.36, shin: 0.40,
    thighA0: -0.42, thighA1: 1.24,
    shinA0: 2.05, shinA1: 1.46,
    footA0: 0.50, footA1: 1.66,
    // Fully extended legs point away from the viewer as much as down, so they read shorter
    extendedLength: 0.82, extendedFoot: 0.88,
};

// ---------------------------------------------------------------------------------------------
// Part drawing. Every drawable paints with its pivot at the origin (see RigCommon's spec doc).
// ---------------------------------------------------------------------------------------------

/** Tapered limb segment along +x from the origin: radius r0 at the origin, r1 at `len`. */
function taperedLimbPath(ctx, len, r0, r1) {
    ctx.beginPath();
    ctx.moveTo(0, -r0);
    ctx.lineTo(len, -r1);
    ctx.arc(len, 0, r1, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(0, r0);
    ctx.arc(0, 0, r0, Math.PI / 2, Math.PI * 1.5);
    ctx.closePath();
}

function limbGradient(ctx, r, skin) {
    const g = ctx.createLinearGradient(0, -r, 0, r);
    g.addColorStop(0, frogColors.get(skin, 'lighten'));
    g.addColorStop(0.45, frogColors.get(skin, 'darken_leg'));
    g.addColorStop(1, frogColors.get(skin, 'darken_body'));
    return g;
}

function drawShadow(ctx, S) {
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(0, 0, S * 0.85, S * 0.22, 0, 0, TAU);
    ctx.fill();
}

/** Thigh - the frog's big muscular haunch: fat at the hip, tapering to the knee. Pivot: the hip. */
function drawThigh(ctx, S, skin) {
    const len = LEG.thigh * S, r0 = 0.17 * S, r1 = 0.10 * S;
    taperedLimbPath(ctx, len, r0, r1);
    ctx.fillStyle = limbGradient(ctx, r0, skin);
    ctx.fill();
    ctx.strokeStyle = frogColors.get(skin, 'darken_detail');
    ctx.lineWidth = 1;
    ctx.stroke();

    // Muscle highlight along the top of the haunch
    ctx.strokeStyle = frogColors.get(skin, 'lighten_body');
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 0.075 * S;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(len * 0.18, -r0 * 0.52);
    ctx.lineTo(len * 0.72, -r1 * 0.55);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Knee
    ctx.fillStyle = frogColors.get(skin, 'darken_leg');
    ctx.beginPath();
    ctx.arc(len, 0, 0.085 * S, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = frogColors.get(skin, 'darken_detail');
    ctx.lineWidth = 0.8;
    ctx.stroke();
}

/** Shin - the slimmer lower leg. Pivot: the knee. */
function drawShin(ctx, S, skin) {
    const len = LEG.shin * S, r0 = 0.10 * S, r1 = 0.064 * S;
    taperedLimbPath(ctx, len, r0, r1);
    ctx.fillStyle = limbGradient(ctx, r0, skin);
    ctx.fill();
    ctx.strokeStyle = frogColors.get(skin, 'darken_detail');
    ctx.lineWidth = 0.9;
    ctx.stroke();

    // Ankle
    ctx.fillStyle = frogColors.get(skin, 'darken_leg');
    ctx.beginPath();
    ctx.arc(len, 0, 0.07 * S, 0, TAU);
    ctx.fill();
}

const FOOT_TOES = [
    { a: -0.64, l: 0.27 },
    { a: -0.22, l: 0.38 },
    { a: 0.22, l: 0.37 },
    { a: 0.64, l: 0.26 },
];

/**
 * Webbed foot: four long toes fanned out with a scalloped web stretched between them and a
 * rounded pad on each tip - a frog's foot rather than a paw. Pivot: the ankle; points along +x.
 * Shared by the front hands (scaled down).
 */
function drawWebbedFoot(ctx, S, skin) {
    const webCol = frogColors.get(skin, 'lighten_foot');
    const edgeCol = frogColors.get(skin, 'darken_detail');
    const toeCol = frogColors.get(skin, 'darken_leg');

    const tips = FOOT_TOES.map(t => ({ x: Math.cos(t.a) * t.l * S, y: Math.sin(t.a) * t.l * S }));

    // Web: a fan through the toe tips, each edge bowed back toward the ankle
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(tips[0].x, tips[0].y);
    for (let i = 1; i < tips.length; i++) {
        const mx = (tips[i - 1].x + tips[i].x) * 0.5, my = (tips[i - 1].y + tips[i].y) * 0.5;
        ctx.quadraticCurveTo(mx * 0.62, my * 0.62, tips[i].x, tips[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = webCol;
    ctx.fill();
    ctx.strokeStyle = edgeCol;
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Toes
    ctx.strokeStyle = toeCol;
    ctx.lineWidth = 0.055 * S;
    ctx.lineCap = 'round';
    for (const tip of tips) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(tip.x, tip.y);
        ctx.stroke();
    }

    // Toe pads
    for (const tip of tips) {
        ctx.fillStyle = webCol;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 0.048 * S, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = edgeCol;
        ctx.lineWidth = 0.7;
        ctx.stroke();
    }

    // Ankle joint
    ctx.fillStyle = toeCol;
    ctx.beginPath();
    ctx.arc(0, 0, 0.065 * S, 0, TAU);
    ctx.fill();
}

/** Small front arm, right side: a bent two-part limb ending in a little webbed hand. Pivot: the shoulder. */
function drawArm(ctx, S, skin) {
    const upper = 0.2 * S, lower = 0.19 * S;
    const a1 = 0.62, a2 = 1.20;
    const ex = Math.cos(a1) * upper, ey = Math.sin(a1) * upper;
    const hx = ex + Math.cos(a2) * lower, hy = ey + Math.sin(a2) * lower;
    const armCol = frogColors.get(skin, 'darken_leg');

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = armCol;
    ctx.lineWidth = 0.13 * S;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.strokeStyle = frogColors.get(skin, 'darken_detail');
    ctx.lineWidth = 0.085 * S;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(hx, hy);
    ctx.stroke();

    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(a2);
    ctx.scale(0.45, 0.45);
    drawWebbedFoot(ctx, S, skin);
    ctx.restore();
}

/** Body + belly. Pivot: the body ellipse's centre. */
function drawBody(ctx, S, skin) {
    const g = ctx.createRadialGradient(-S * 0.12, -S * 0.18, S * 0.15, 0, -S * 0.08, S * 0.5);
    g.addColorStop(0, frogColors.get(skin, 'lighten'));
    g.addColorStop(0.6, skin);
    g.addColorStop(1, frogColors.get(skin, 'darken_body'));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, S * 0.5, S * 0.58, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = frogColors.get(skin, 'darken_body');
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Belly
    ctx.fillStyle = frogColors.get(skin, 'lighten_body');
    ctx.beginPath();
    ctx.ellipse(0, S * 0.07, S * 0.38, S * 0.42, 0, 0, TAU);
    ctx.fill();
}

/**
 * Head with its face. Drawn in the frog's own coordinates (origin one head-radius below the head
 * centre), exactly as the original single-Graphics frog drew it. `blink` swaps the eyes for lids.
 * Pivot: the head ellipse's centre.
 */
function drawHead(ctx, S, skin, blink) {
    ctx.translate(0, 0.42 * S);

    // Head base
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(0, -S * 0.42, S * 0.5, S * 0.42, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = frogColors.get(skin, 'darken_body');
    ctx.lineWidth = 1;
    ctx.stroke();

    // Eyes: large, bulging
    for (const side of [-1, 1]) {
        const ex = side * S * 0.22;
        ctx.fillStyle = frogColors.get(skin, 'darken_eye');
        ctx.beginPath();
        ctx.arc(ex, -S * 0.58, S * 0.18, 0, TAU);
        ctx.fill();

        if (blink) {
            ctx.fillStyle = skin;
            ctx.beginPath();
            ctx.arc(ex, -S * 0.58, S * 0.18, 0, TAU);
            ctx.fill();
            // the lid line
            ctx.strokeStyle = frogColors.get(skin, 'darken_mouth');
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(ex - S * 0.13, -S * 0.56);
            ctx.lineTo(ex + S * 0.13, -S * 0.56);
            ctx.stroke();
            continue;
        }

        ctx.fillStyle = '#FFFACD';
        ctx.beginPath();
        ctx.arc(ex, -S * 0.58, S * 0.14, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(ex, -S * 0.56, S * 0.09, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(ex - side * S * 0.04, -S * 0.59, S * 0.06, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(ex - side * S * 0.06, -S * 0.62, S * 0.025, 0, TAU);
        ctx.fill();
    }

    // Throat
    ctx.fillStyle = frogColors.get(skin, 'lighten_body');
    ctx.beginPath();
    ctx.ellipse(0, -S * 0.12, S * 0.13, S * 0.085, 0, 0, TAU);
    ctx.fill();

    // Wide frog mouth
    ctx.strokeStyle = frogColors.get(skin, 'darken_mouth');
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, -S * 0.25, S * 0.22, 0, Math.PI);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-S * 0.2, -S * 0.25);
    ctx.lineTo(S * 0.2, -S * 0.25);
    ctx.stroke();

    // Nostrils
    ctx.fillStyle = frogColors.get(skin, 'darken_detail');
    for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(side * S * 0.1, -S * 0.48, S * 0.05, 0, TAU);
        ctx.fill();
    }
}

/** Wizard hat, unchanged from the original art. Pivot: the middle of the brim (its base). */
function drawHat(ctx, S) {
    ctx.translate(0, 0.72 * S);

    const hat = ctx.createLinearGradient(-S * 0.35, -S * 0.8, S * 0.35, -S * 1.5);
    hat.addColorStop(0, '#2A5FD8');
    hat.addColorStop(0.6, '#1A3A7A');
    hat.addColorStop(1, '#0F1F4F');
    ctx.fillStyle = hat;
    ctx.beginPath();
    ctx.moveTo(-S * 0.32, -S * 0.72);
    ctx.lineTo(S * 0.32, -S * 0.72);
    ctx.lineTo(S * 0.08, -S * 1.42);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#0F1F4F';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-S * 0.32, -S * 0.72);
    ctx.lineTo(S * 0.08, -S * 1.42);
    ctx.lineTo(S * 0.32, -S * 0.72);
    ctx.stroke();

    // Gold band
    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(-S * 0.35, -S * 0.78, S * 0.7, S * 0.12);
    ctx.strokeStyle = '#8B7500';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-S * 0.35, -S * 0.78);
    ctx.lineTo(S * 0.35, -S * 0.78);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-S * 0.35, -S * 0.66);
    ctx.lineTo(S * 0.35, -S * 0.66);
    ctx.stroke();

    // Glowing star at the tip
    const glow = ctx.createRadialGradient(S * 0.08, -S * 1.44, 0, S * 0.08, -S * 1.44, S * 0.2);
    glow.addColorStop(0, 'rgba(255, 215, 0, 0.7)');
    glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(S * 0.08, -S * 1.44, S * 0.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
    ctx.font = `bold ${S * 0.2}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', S * 0.08, -S * 1.44);
}

/** Tongue at full length, hanging down from the origin (the mouth); scaled in y to extend. */
function drawTongue(ctx, S) {
    const len = 0.55 * S;
    ctx.strokeStyle = '#D8546A';
    ctx.lineWidth = S * 0.06;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, len);
    ctx.stroke();
    ctx.fillStyle = '#D8546A';
    ctx.beginPath();
    ctx.arc(0, len, S * 0.05, 0, TAU);
    ctx.fill();
}

/** Particle dot - painted with whatever fill is current (white when baked, tinted per particle). */
function drawDot(ctx) {
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, TAU);
    ctx.fill();
}

/**
 * Build the frog's rig spec for one skin colour at one size. `key` identifies the baked
 * atlas: everything drawn depends only on (skin, S).
 */
export function createFrogRigSpec(skin, S) {
    const atlas = [
        { id: 'shadow', w: 1.8 * S, h: 0.5 * S, ox: 0.9 * S, oy: 0.25 * S, draw: (c) => drawShadow(c, S) },
        { id: 'thigh', w: 0.66 * S, h: 0.38 * S, ox: 0.19 * S, oy: 0.19 * S, draw: (c) => drawThigh(c, S, skin) },
        { id: 'shin', w: 0.62 * S, h: 0.24 * S, ox: 0.12 * S, oy: 0.12 * S, draw: (c) => drawShin(c, S, skin) },
        { id: 'foot', w: 0.62 * S, h: 0.52 * S, ox: 0.12 * S, oy: 0.26 * S, draw: (c) => drawWebbedFoot(c, S, skin) },
        { id: 'arm', w: 0.62 * S, h: 0.58 * S, ox: 0.12 * S, oy: 0.14 * S, draw: (c) => drawArm(c, S, skin) },
        { id: 'body', w: 1.14 * S, h: 1.34 * S, ox: 0.57 * S, oy: 0.67 * S, draw: (c) => drawBody(c, S, skin) },
        { id: 'head', w: 1.14 * S, h: 0.98 * S, ox: 0.57 * S, oy: 0.50 * S, draw: (c) => drawHead(c, S, skin, false) },
        { id: 'headBlink', w: 1.14 * S, h: 0.98 * S, ox: 0.57 * S, oy: 0.50 * S, draw: (c) => drawHead(c, S, skin, true) },
        { id: 'hat', w: 0.94 * S, h: 1.10 * S, ox: 0.47 * S, oy: 1.00 * S, draw: (c) => drawHat(c, S) },
        { id: 'tongue', w: 0.24 * S, h: 0.74 * S, ox: 0.12 * S, oy: 0.06 * S, draw: (c) => drawTongue(c, S) },
        { id: 'dot', w: 10, h: 10, ox: 5, oy: 5, draw: (c) => drawDot(c) },
    ];

    const items = [
        { id: 'shadow', tex: 'shadow' },
        { id: 'figure', group: true },
        { id: 'legR_thigh', tex: 'thigh', parent: 'figure' },
        { id: 'legR_shin', tex: 'shin', parent: 'figure' },
        { id: 'legR_foot', tex: 'foot', parent: 'figure' },
        { id: 'legL_thigh', tex: 'thigh', parent: 'figure' },
        { id: 'legL_shin', tex: 'shin', parent: 'figure' },
        { id: 'legL_foot', tex: 'foot', parent: 'figure' },
        { id: 'body', tex: 'body', parent: 'figure' },
        { id: 'armR', tex: 'arm', parent: 'figure' },
        { id: 'armL', tex: 'arm', parent: 'figure' },
        { id: 'head', tex: 'head', parent: 'figure' },
        { id: 'tongue', tex: 'tongue', parent: 'figure' },
        { id: 'hat', tex: 'hat', parent: 'figure' },
    ];

    return {
        key: `FrogEnemy:${skin}:${S.toFixed(2)}`,
        bakeScale: 2,
        atlas,
        items,
        particles: { tex: 'dot', count: FROG_PARTICLE_COUNT },
        // Same bar the frog has always had (see BaseEnemy.renderHealthBar's opts)
        healthBar: { widthMul: 2.8, heightMul: 0.38, yOffsetMul: -2.1 },
    };
}

export function createFrogRigNodes(spec) {
    return createRigNodes(spec);
}

// ---------------------------------------------------------------------------------------------
// Hop model
// ---------------------------------------------------------------------------------------------

/**
 * The kinds of hop a frog picks from. Every hop rolls its own numbers inside its style's ranges,
 * so no two consecutive hops match and different frogs drift out of step:
 *   T      duration in seconds          k      height factor (1 = the old fixed hop)
 *   lean   sideways tilt into the hop   power  how far the legs stretch out
 *   a0/a1  the fraction of the hop the frog is airborne between (the rest is crouch/landing)
 */
const HOP_STYLES = [
    { name: 'normal', weight: 5.0, T: [0.38, 0.46], k: [0.85, 1.15], lean: [0.05, 0.11], power: [0.62, 0.85], a0: 0.10, a1: 0.90 },
    { name: 'high',   weight: 1.6, T: [0.50, 0.60], k: [1.30, 1.60], lean: [0.02, 0.07], power: [0.90, 1.00], a0: 0.13, a1: 0.87 },
    { name: 'skip',   weight: 2.2, T: [0.27, 0.33], k: [0.45, 0.65], lean: [0.10, 0.16], power: [0.30, 0.50], a0: 0.08, a1: 0.92 },
    { name: 'long',   weight: 1.6, T: [0.42, 0.50], k: [0.65, 0.85], lean: [0.16, 0.24], power: [0.90, 1.00], a0: 0.09, a1: 0.91 },
];
const HOP_WEIGHT_TOTAL = HOP_STYLES.reduce((s, h) => s + h.weight, 0);

/** Pack [u0, v0, u1, v1, ...] keyframes into a typed array for sampleKeys(). */
function keys(...pairs) {
    return Float64Array.from(pairs);
}

/** Sample keyframes at hop-progress u, easing (cosine) between neighbours so tracks are smooth through the hop boundary. */
function sampleKeys(k, u) {
    const n = k.length >> 1;
    if (u <= k[0]) return k[1];
    for (let i = 1; i < n; i++) {
        const u1 = k[i * 2];
        if (u <= u1) {
            const u0 = k[i * 2 - 2];
            const t = (u - u0) / (u1 - u0);
            const e = (1 - Math.cos(Math.PI * t)) * 0.5;
            return k[i * 2 - 1] + (k[i * 2 + 1] - k[i * 2 - 1]) * e;
        }
    }
    return k[n * 2 - 1];
}

/**
 * Roll the next hop. `prev` (the hop just finished, or null) feeds continuity (the lean/hat
 * tracks start where the last hop's ended) and variety (a style that has already come up twice
 * running is re-rolled, so long streaks of one style are rare). `bounce` is the frog's own
 * bounciness (~0.9-1.1).
 */
export function makeHop(prev, bounce = 1) {
    let style;
    for (let attempt = 0; attempt < 4; attempt++) {
        let r = Math.random() * HOP_WEIGHT_TOTAL;
        style = HOP_STYLES[0];
        for (const s of HOP_STYLES) {
            r -= s.weight;
            if (r <= 0) { style = s; break; }
        }
        if (!prev || style.name !== prev.style || prev.repeat < 2) break;
    }
    const repeat = prev && prev.style === style.name ? prev.repeat + 1 : 1;

    const T = rand(style.T[0], style.T[1]);
    const k = rand(style.k[0], style.k[1]) * bounce;
    const power = rand(style.power[0], style.power[1]);
    const lean = rand(style.lean[0], style.lean[1]) * (Math.random() < 0.15 ? -0.5 : 1);
    const { a0, a1 } = style;

    // How hard the landing hits, and how strongly the hat flops around it
    const land = clamp01(0.5 + 0.35 * k);
    const hatKick = 0.20 + 0.22 * k;

    // The lean and hat tracks end at values that depend on this hop's own numbers, so each hop
    // starts from wherever the previous one actually ended - otherwise the tilt would pop by a
    // few degrees at every hop boundary.
    const leanEnd = -0.30 * lean;
    const hatEnd = 0.5 * hatKick;
    const leanStart = prev ? prev.leanEnd : leanEnd;
    const hatStart = prev ? prev.hatEnd : hatEnd;

    const E = 0.55 + 0.45 * power;           // how far the legs stretch in the air
    const coil = 0.55 + 0.30 * power;         // how deep the crouch before launch
    const stretch = Math.min(1, 0.50 + 0.40 * k);

    return {
        style: style.name, repeat, T, a0, a1,
        H: 1.5 * k,                            // apex height, in S
        // squash (+) / stretch (-) of the body
        squash: keys(0, 0.30, a0, coil, a0 + 0.09, -stretch, 0.5, -0.35 * stretch, a1 - 0.05, -0.18, a1 + 0.03, land, 1, 0.30),
        // leg extension 0 (folded) .. 1 (stretched out)
        ext: keys(0, LEG_REST, a0, 0.0, a0 + 0.09, E, 0.5, E * 0.95, a1 - 0.14, E * 0.60, a1, 0.32, a1 + 0.04, 0.02, 1, LEG_REST),
        // sideways tilt of the whole frog
        lean: keys(0, leanStart, a0, -0.60 * lean, a0 + 0.10, 0.40 * lean, 0.5, lean, a1 - 0.05, 0.60 * lean, a1 + 0.03, -0.40 * lean, 1, leanEnd),
        // hat: lags behind the launch, flops forward on landing
        hat: keys(0, hatStart, a0, 0, a0 + 0.09, -hatKick, 0.5, 0, a1 - 0.05, 0.3 * hatKick, a1 + 0.03, hatKick, 1, hatEnd),
        leanEnd, hatEnd,
        // arms: thrown back at launch, reaching forward to brace for the landing
        arm: keys(0, 0.20, a0, -0.30, a0 + 0.10, -0.55, 0.5, 0.55, a1 - 0.10, 0.20, a1, 0.05, 1, 0.20),
        // small independent per-leg timing/reach differences: real legs aren't perfectly mirrored
        dR: rand(-0.025, 0.025), dL: rand(-0.025, 0.025),
        ampR: rand(0.94, 1.06), ampL: rand(0.94, 1.06),
    };
}

// ---------------------------------------------------------------------------------------------
// Pose
// ---------------------------------------------------------------------------------------------

const PARTICLE_TINTS = [0x64C8FF, 0x96FF64, 0xFFC864];

/**
 * Write the frog's current pose (`f.hop` sampled at `f.hopTime`, plus its blink/tongue/particle
 * timers) into `nodes`. Pure arithmetic on numbers - no allocation, no drawing.
 */
export function poseFrog(nodes, f, S) {
    const hop = f.hop;
    const u = f.hopTime / hop.T;

    // ---- height of the hop (parabola while airborne, on the ground otherwise)
    let v = 0, arc = 0;
    if (u > hop.a0 && u < hop.a1) {
        v = (u - hop.a0) / (hop.a1 - hop.a0);
        arc = 4 * v * (1 - v);
    }
    const lift = arc * hop.H * S;

    const s = sampleKeys(hop.squash, u);                 // squash (+) / stretch (-)
    const lean = sampleKeys(hop.lean, u);
    const sway = Math.sin(f.animationTime * 15 + f.animationPhaseOffset) * 0.035 * S;

    // ---- shadow stays on the ground and shrinks/fades as the frog rises
    const shadow = nodes.shadow;
    shadow.x = 0;
    shadow.y = (GROUND_Y + FIGURE_DROP) * S;
    const shrink = 1 - 0.30 * Math.min(1, lift / (1.6 * S));
    shadow.scaleX = shrink * (1 + 0.06 * s);
    shadow.scaleY = shrink;
    shadow.alpha = 0.26 - 0.09 * Math.min(1, lift / (1.6 * S));

    // ---- the whole figure: hop + lean about the lower body
    const fig = nodes.figure;
    fig.pivotX = 0;
    fig.pivotY = FIGURE_PIVOT_Y * S;
    fig.x = sway;
    fig.y = (FIGURE_PIVOT_Y + FIGURE_DROP) * S - lift;
    fig.rotation = lean;

    // ---- legs
    // The two legs are deliberately a touch out of step and out of reach with each other, but that
    // difference is faded out at the hop boundaries so the legs never jump when the next hop starts.
    const mid = Math.sin(Math.PI * u);
    poseLeg(nodes.legR_thigh, nodes.legR_shin, nodes.legR_foot, 1, legExtension(hop, u + hop.dR * mid, hop.ampR), s, S);
    poseLeg(nodes.legL_thigh, nodes.legL_shin, nodes.legL_foot, -1, legExtension(hop, u + hop.dL * mid, hop.ampL), s, S);

    // ---- body (bottom stays put while it squashes, so the frog doesn't shrink upward off its haunches)
    const breath = 1 + 0.012 * Math.sin(f.animationTime * 2.2 + f.animationPhaseOffset);
    const body = nodes.body;
    body.x = 0;
    body.y = (0.08 + 0.104 * s) * S;
    body.scaleX = 1 + 0.15 * s;
    body.scaleY = (1 - 0.18 * s) * breath;

    // ---- arms
    const swing = sampleKeys(hop.arm, u);
    poseArm(nodes.armR, 1, swing, s, S);
    poseArm(nodes.armL, -1, swing, s, S);

    // ---- head follows the body's squash and tilts a little against the lean
    const head = nodes.head;
    head.x = 0;
    head.y = (-0.42 + 0.10 * s) * S;
    head.rotation = -lean * 0.4;

    // ---- blink (periodic, per-instance phase so frogs don't blink in lockstep)
    const blinkT = (f.animationTime + f.animationPhaseOffset * 2.3) % 3.4;
    head.tex = (blinkT > 0.04 && blinkT < 0.13) ? 'headBlink' : null;

    // ---- tongue flick
    const tongue = nodes.tongue;
    const tongueCycle = (f.animationTime + f.animationPhaseOffset * 3.7) % 5.0;
    if (tongueCycle < 0.35) {
        const tp = tongueCycle / 0.35;
        const extend = tp < 0.4 ? tp / 0.4 : 1 - (tp - 0.4) / 0.6;
        tongue.visible = true;
        tongue.x = 0;
        tongue.y = head.y + 0.26 * S;
        tongue.rotation = head.rotation;
        tongue.scaleY = Math.max(0.01, extend);
    } else {
        tongue.visible = false;
    }

    // ---- hat: sits on the head, swings on its own timing
    const hat = nodes.hat;
    hat.x = 0;
    hat.y = head.y - 0.30 * S;
    hat.rotation = head.rotation + sampleKeys(hop.hat, u);

    // ---- sparkles
    const ps = f.magicParticles;
    const pn = nodes.particles;
    for (let i = 0; i < pn.length; i++) {
        const n = pn[i];
        if (i < ps.length) {
            const p = ps[i];
            const life = p.life / p.maxLife;
            n.visible = true;
            n.x = p.x - f.x;
            n.y = p.y - f.y;
            n.scaleX = n.scaleY = p.size / 4;
            n.alpha = life;
            n.tint = PARTICLE_TINTS[p.colorIndex];
        } else {
            n.visible = false;
        }
    }
}

/** Leg extension at hop-progress u, with the leg's own reach scaling how far it strays from the rest pose. */
function legExtension(hop, u, amp) {
    return LEG_REST + (sampleKeys(hop.ext, clamp01(u)) - LEG_REST) * amp;
}

function poseLeg(thigh, shin, foot, side, ext, s, S) {
    const ta = lerp(LEG.thighA0, LEG.thighA1, ext);
    const sa = lerp(LEG.shinA0, LEG.shinA1, ext);
    const fa = lerp(LEG.footA0, LEG.footA1, ext);

    // Segments shorten as the leg reaches out (see LEG.extendedLength)
    const lenK = lerp(1, LEG.extendedLength, ext);
    const footK = lerp(1, LEG.extendedFoot, ext);

    const hipX = side * LEG.hipX * S;
    const hipY = (LEG.hipY + 0.08 * s) * S;
    const kneeX = hipX + side * Math.cos(ta) * LEG.thigh * S * lenK;
    const kneeY = hipY + Math.sin(ta) * LEG.thigh * S * lenK;
    const ankleX = kneeX + side * Math.cos(sa) * LEG.shin * S * lenK;
    const ankleY = kneeY + Math.sin(sa) * LEG.shin * S * lenK;

    // Left legs are the right leg mirrored: flip x, negate the angle
    thigh.x = hipX; thigh.y = hipY; thigh.scaleX = side * lenK; thigh.rotation = side * ta;
    shin.x = kneeX; shin.y = kneeY; shin.scaleX = side * lenK; shin.rotation = side * sa;
    foot.x = ankleX; foot.y = ankleY; foot.scaleX = side * footK; foot.scaleY = footK; foot.rotation = side * fa;
}

function poseArm(arm, side, swing, s, S) {
    arm.x = side * 0.30 * S;
    arm.y = (0.06 + 0.06 * s) * S;
    arm.scaleX = side;
    arm.rotation = side * swing * 0.7;
}
