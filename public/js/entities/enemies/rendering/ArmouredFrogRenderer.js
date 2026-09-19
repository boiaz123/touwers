import { drawFlipperFoot } from './FrogFlipperRenderer.js';
import { drawTwoSegmentLimb, computeWalkCycle, kneeFlex, solveLegIK } from './HumanoidLimbRenderer.js';
import { EnemyColorCache, FROG_COLOR_VARIANTS } from '../../../utils/EnemyColorCache.js';

/**
 * Drawing for the Heavy Frog and its Minions (HeavyFrogEnemy / HeavyFrogMinionEnemy). Both are
 * the same armoured frog at different sizes - the minions are meant to be tiny versions of the
 * big one - so the figure lives here once and each class just supplies its own size `u`.
 *
 * The frog itself follows ElementalFrogEnemy's build (rounded body, big head with a snout,
 * hooded slit eyes, toothy snarl, toe-pad feet) but walks on IK legs like WalkingFrogEnemy
 * instead of hopping, and wears plate: a kettle helm with a crimson crest, pauldrons, a
 * breastplate over tassets, greaves and knee cops, and a buckler on one arm and a war hammer in
 * the other hand.
 *
 * Everything is a pure function of (u, animationTime, phaseOffset) so EnemyRenderAdapter can bake
 * it into shared walk-cycle frames (Mode A). Coordinates are relative to the enemy's position
 * (0, 0 = the frog's centre); every dimension is a fraction of `u`, the frog's baseSize.
 */

export const HEAVY_FROG_SKIN = '#5B7F33';

/** Walk cadence in rad/s - slower than a humanoid's default 8 for a heavy, plodding gait. Also the Mode-A bake cycle length. */
export const HEAVY_FROG_WALK_FREQUENCY = 5.0;

const colors = new EnemyColorCache(FROG_COLOR_VARIANTS);

const STEEL = {
    light: '#D5DCE5',
    mid: '#96A0AD',
    dark: '#5E6773',
    deep: '#363C46',
    rivet: '#C9A24D',
    crest: '#8E2F2B',
    crestDark: '#5C1C1A',
    leather: '#5A3F27',
    leatherLight: '#7B5A38',
    iris: '#E0902E',
};

function steelGradient(ctx, x0, y0, x1, y1) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, STEEL.light);
    g.addColorStop(0.45, STEEL.mid);
    g.addColorStop(1, STEEL.dark);
    return g;
}

function rivet(ctx, x, y, r) {
    ctx.fillStyle = STEEL.rivet;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * @param {CanvasRenderingContext2D} ctx  origin (0, 0) is the enemy's position
 * @param {number} u  the frog's baseSize
 * @param {number} animationTime
 * @param {number} phaseOffset
 */
export function drawArmouredFrog(ctx, u, animationTime, phaseOffset) {
    const anim = computeWalkCycle(animationTime, phaseOffset, HEAVY_FROG_WALK_FREQUENCY);
    const lw = Math.max(0.7, u * 0.03); // outline weight - scales with the frog so the tiny ones aren't all outline
    const skin = HEAVY_FROG_SKIN;
    const skinLight = colors.get(skin, 'lighten');
    const skinDark = colors.get(skin, 'darken_body');
    const legColor = colors.get(skin, 'darken_leg');
    const footColor = colors.get(skin, 'lighten_foot');
    const detail = colors.get(skin, 'darken_detail');

    // Shadow, wide and low under the planted feet
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, u * 0.66, u * 0.8, u * 0.17, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    // Weighty bob: a fraction of the humanoid step bounce, once per footfall
    ctx.translate(0, anim.bodyBob * u * 0.12);

    // ---- LEGS (behind the body) ----
    for (const side of [-1, 1]) {
        drawLeg(ctx, u, lw, anim, side, legColor, footColor, detail);
    }

    // ---- TORSO ----
    const bodyGrad = ctx.createRadialGradient(-u * 0.12, -u * 0.06, u * 0.1, 0, u * 0.05, u * 0.58);
    bodyGrad.addColorStop(0, skinLight);
    bodyGrad.addColorStop(0.6, skin);
    bodyGrad.addColorStop(1, skinDark);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, u * 0.06, u * 0.5, u * 0.46, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = skinDark;
    ctx.lineWidth = lw * 1.4;
    ctx.stroke();

    drawBreastplate(ctx, u, lw);
    drawTassets(ctx, u, lw);

    // Belt
    ctx.fillStyle = STEEL.leather;
    ctx.beginPath();
    ctx.rect(-u * 0.42, u * 0.27, u * 0.84, u * 0.07);
    ctx.fill();
    ctx.strokeStyle = STEEL.deep;
    ctx.lineWidth = lw * 0.8;
    ctx.stroke();
    ctx.fillStyle = STEEL.rivet;
    ctx.beginPath();
    ctx.rect(-u * 0.05, u * 0.255, u * 0.1, u * 0.1);
    ctx.fill();

    // ---- ARMS (buckler on one side, war hammer on the other) ----
    const armSwing = anim.legSwing * 0.2;
    const leftHand = drawArm(ctx, u, lw, -1, armSwing, skin, footColor, detail);
    drawBuckler(ctx, u, lw, leftHand.x - u * 0.1, leftHand.y - u * 0.02);
    const rightHand = drawArm(ctx, u, lw, 1, -armSwing, skin, footColor, detail);
    drawWarHammer(ctx, u, lw, rightHand.x, rightHand.y, 0.1 - armSwing * 0.5);

    // ---- HEAD ----
    drawHead(ctx, u, lw, skin, skinLight, skinDark);
    drawGorget(ctx, u, lw);
    drawHelmet(ctx, u, lw);

    // ---- PAULDRONS (over the shoulders, on top of the arms' roots) ----
    drawPauldron(ctx, u, lw, -1);
    drawPauldron(ctx, u, lw, 1);

    ctx.restore();
}

function drawLeg(ctx, u, lw, anim, side, legColor, footColor, detail) {
    const hipX = side * u * 0.3;
    const hipY = u * 0.3;
    const upper = u * 0.25;
    const lower = u * 0.27;
    // Legs alternate: while one swings forward the other pushes back and plants
    const swingSign = side < 0 ? 1 : -1;
    const groundY = hipY + (upper + lower) * 0.82;
    const footX = hipX + side * u * 0.05 + swingSign * anim.legSwing * u * 0.2;
    const footY = groundY - kneeFlex(anim, side > 0) * u * 0.13;
    const ik = solveLegIK(hipX, hipY, footX, footY, upper, lower, -side);

    const leg = drawTwoSegmentLimb(
        ctx, hipX, hipY, ik.upperAngle, upper, ik.lowerAngle, lower,
        { limbColor: legColor, padColor: legColor, limbWidth: u * 0.19, padRadius: u * 0.1, shadowColor: 'rgba(0,0,0,0.18)' }
    );

    // Greave: a steel shell over the shin, ringed by a knee cop
    const gx0 = leg.elbowX, gy0 = leg.elbowY;
    const gx1 = leg.elbowX + (leg.endX - leg.elbowX) * 0.86;
    const gy1 = leg.elbowY + (leg.endY - leg.elbowY) * 0.86;
    ctx.lineCap = 'round';
    ctx.strokeStyle = STEEL.deep;
    ctx.lineWidth = u * 0.21;
    ctx.beginPath();
    ctx.moveTo(gx0, gy0);
    ctx.lineTo(gx1, gy1);
    ctx.stroke();
    ctx.strokeStyle = STEEL.mid;
    ctx.lineWidth = u * 0.16;
    ctx.beginPath();
    ctx.moveTo(gx0, gy0);
    ctx.lineTo(gx1, gy1);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = u * 0.04;
    ctx.beginPath();
    ctx.moveTo(gx0 - u * 0.03, gy0);
    ctx.lineTo(gx1 - u * 0.03, gy1);
    ctx.stroke();
    ctx.lineCap = 'butt';

    // Knee cop
    ctx.fillStyle = steelGradient(ctx, gx0 - u * 0.1, gy0 - u * 0.1, gx0 + u * 0.1, gy0 + u * 0.1);
    ctx.beginPath();
    ctx.arc(gx0, gy0, u * 0.11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = STEEL.deep;
    ctx.lineWidth = lw;
    ctx.stroke();
    rivet(ctx, gx0, gy0, u * 0.025);

    // Toes splay outward along the ground like a standing frog's, rather than continuing down the shin
    const footAngle = side > 0 ? 0.5 : Math.PI - 0.5;
    drawFlipperFoot(ctx, leg.endX, leg.endY, footAngle, u * 0.26, u * 0.14, footColor, detail);
}

function drawBreastplate(ctx, u, lw) {
    const cx = 0, cy = u * 0.06, rx = u * 0.4, ry = u * 0.36;
    ctx.fillStyle = steelGradient(ctx, -rx, cy - ry, rx * 0.8, cy + ry);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = STEEL.deep;
    ctx.lineWidth = lw * 1.5;
    ctx.stroke();

    // Sheen
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.beginPath();
    ctx.ellipse(-u * 0.13, -u * 0.09, u * 0.13, u * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Centre ridge and a banding line across the chest
    ctx.strokeStyle = STEEL.deep;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(0, cy - ry * 0.95);
    ctx.lineTo(0, cy + ry * 0.95);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.beginPath();
    ctx.moveTo(u * 0.02, cy - ry * 0.85);
    ctx.lineTo(u * 0.02, cy + ry * 0.85);
    ctx.stroke();
    ctx.strokeStyle = STEEL.dark;
    ctx.lineWidth = lw * 0.9;
    ctx.beginPath();
    ctx.arc(0, cy - u * 0.16, u * 0.3, Math.PI * 0.18, Math.PI * 0.82);
    ctx.stroke();

    for (const [rx0, ry0] of [[-0.27, -0.02], [0.27, -0.02], [-0.29, 0.15], [0.29, 0.15]]) {
        rivet(ctx, rx0 * u, ry0 * u, u * 0.022);
    }
    // Boss
    ctx.fillStyle = STEEL.rivet;
    ctx.beginPath();
    ctx.arc(0, u * 0.04, u * 0.055, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = STEEL.deep;
    ctx.lineWidth = lw * 0.8;
    ctx.stroke();
}

function drawTassets(ctx, u, lw) {
    // Three overlapping plates hanging from the belt over the frog's belly
    const plates = [[-0.27, 0.36], [0, 0.4], [0.27, 0.36]];
    for (const [px, py] of plates) {
        const x = px * u, y = py * u, w = u * 0.26, h = u * 0.2;
        ctx.fillStyle = steelGradient(ctx, x - w / 2, y, x + w / 2, y + h);
        ctx.beginPath();
        ctx.moveTo(x - w / 2, y);
        ctx.lineTo(x + w / 2, y);
        ctx.lineTo(x + w * 0.4, y + h);
        ctx.quadraticCurveTo(x, y + h * 1.12, x - w * 0.4, y + h);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = STEEL.deep;
        ctx.lineWidth = lw;
        ctx.stroke();
    }
}

/** Returns the hand's position so the buckler / hammer can be attached to it. */
function drawArm(ctx, u, lw, side, swing, skin, footColor, detail) {
    const shoulderX = side * u * 0.46;
    const shoulderY = u * 0.0;
    const upperLen = u * 0.22;
    const lowerLen = u * 0.22;

    // Elbow up and out, forearm hanging back down - the same guarded pose the elemental frogs hold
    const baseUpper = side > 0 ? -Math.PI / 4 : -Math.PI + Math.PI / 4;
    const upperAngle = baseUpper + swing * side;
    const elbowX = shoulderX + Math.cos(upperAngle) * upperLen;
    const elbowY = shoulderY + Math.sin(upperAngle) * upperLen;
    const lowerAngle = Math.PI / 2 + (side > 0 ? 0.2 : -0.2) + swing * side * 0.6;
    const handX = elbowX + Math.cos(lowerAngle) * lowerLen;
    const handY = elbowY + Math.sin(lowerAngle) * lowerLen;

    const armColor = colors.get(skin, 'darken_leg');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = armColor;
    ctx.lineWidth = u * 0.14;
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(elbowX, elbowY);
    ctx.stroke();

    // Gauntlet over the forearm
    ctx.strokeStyle = STEEL.deep;
    ctx.lineWidth = u * 0.155;
    ctx.beginPath();
    ctx.moveTo(elbowX, elbowY);
    ctx.lineTo(handX, handY);
    ctx.stroke();
    ctx.strokeStyle = STEEL.mid;
    ctx.lineWidth = u * 0.115;
    ctx.beginPath();
    ctx.moveTo(elbowX, elbowY);
    ctx.lineTo(handX, handY);
    ctx.stroke();
    ctx.lineCap = 'butt';

    ctx.fillStyle = steelGradient(ctx, elbowX - u * 0.07, elbowY - u * 0.07, elbowX + u * 0.07, elbowY + u * 0.07);
    ctx.beginPath();
    ctx.arc(elbowX, elbowY, u * 0.075, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = STEEL.deep;
    ctx.lineWidth = lw;
    ctx.stroke();

    // Frog paw peeking out of the gauntlet
    drawFlipperFoot(ctx, handX, handY, lowerAngle, u * 0.17, u * 0.1, footColor, detail);

    return { x: handX, y: handY };
}

function drawBuckler(ctx, u, lw, cx, cy) {
    const r = u * 0.27;
    ctx.fillStyle = STEEL.deep;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = steelGradient(ctx, cx - r, cy - r, cx + r, cy + r);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = STEEL.deep;
    ctx.lineWidth = lw;
    ctx.stroke();

    // Spokes and a gilded boss
    ctx.strokeStyle = 'rgba(54, 60, 70, 0.7)';
    ctx.lineWidth = lw * 0.8;
    for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2 + Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r * 0.25, cy + Math.sin(a) * r * 0.25);
        ctx.lineTo(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82);
        ctx.stroke();
    }
    ctx.fillStyle = STEEL.rivet;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = STEEL.deep;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.09, cy - r * 0.09, r * 0.09, 0, Math.PI * 2);
    ctx.fill();
}

function drawWarHammer(ctx, u, lw, gripX, gripY, tilt) {
    ctx.save();
    ctx.translate(gripX, gripY);
    ctx.rotate(tilt);

    // Haft (local -y is up, out of the fist)
    const haftTop = -u * 0.9;
    const haftBottom = u * 0.16;
    ctx.lineCap = 'round';
    ctx.strokeStyle = STEEL.deep;
    ctx.lineWidth = u * 0.105;
    ctx.beginPath();
    ctx.moveTo(0, haftBottom);
    ctx.lineTo(0, haftTop);
    ctx.stroke();
    ctx.strokeStyle = STEEL.leather;
    ctx.lineWidth = u * 0.075;
    ctx.beginPath();
    ctx.moveTo(0, haftBottom);
    ctx.lineTo(0, haftTop);
    ctx.stroke();
    ctx.strokeStyle = STEEL.leatherLight;
    ctx.lineWidth = u * 0.02;
    ctx.beginPath();
    ctx.moveTo(-u * 0.02, haftBottom);
    ctx.lineTo(-u * 0.02, haftTop);
    ctx.stroke();
    ctx.lineCap = 'butt';

    // Head: a heavy block with a spiked striking face at each end
    const hw = u * 0.3, hh = u * 0.13, hy = haftTop - u * 0.02;
    ctx.fillStyle = steelGradient(ctx, -hw, hy - hh, hw, hy + hh);
    ctx.beginPath();
    ctx.rect(-hw, hy - hh, hw * 2, hh * 2);
    ctx.fill();
    ctx.strokeStyle = STEEL.deep;
    ctx.lineWidth = lw * 1.3;
    ctx.stroke();
    ctx.fillStyle = STEEL.mid;
    for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(s * hw, hy - hh * 0.7);
        ctx.lineTo(s * (hw + u * 0.12), hy);
        ctx.lineTo(s * hw, hy + hh * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    // Iron collar where the haft meets the head
    ctx.fillStyle = STEEL.dark;
    ctx.beginPath();
    ctx.rect(-u * 0.07, hy + hh, u * 0.14, u * 0.06);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.rect(-hw * 0.85, hy - hh * 0.8, hw * 1.2, hh * 0.35);
    ctx.fill();

    ctx.restore();
}

function drawHead(ctx, u, lw, skin, skinLight, skinDark) {
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(0, -u * 0.45, u * 0.48, u * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = skinDark;
    ctx.lineWidth = lw * 1.3;
    ctx.stroke();

    // Snout and nostrils
    ctx.fillStyle = skinLight;
    ctx.beginPath();
    ctx.ellipse(0, -u * 0.24, u * 0.23, u * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = skinDark;
    ctx.lineWidth = lw * 0.9;
    ctx.stroke();
    ctx.fillStyle = skinDark;
    for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(s * u * 0.08, -u * 0.17, u * 0.03, u * 0.018, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Parotoid gland bumps
    for (const s of [-1, 1]) {
        ctx.fillStyle = skinDark;
        ctx.beginPath();
        ctx.ellipse(s * u * 0.34, -u * 0.72, u * 0.1, u * 0.065, s * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Eyes: narrow, hooded, glowing slit pupils under a furrowed brow
    for (const s of [-1, 1]) {
        drawEye(ctx, u, s * u * 0.2, -u * 0.6, s, skinDark);
    }

    // Toothy snarl
    ctx.fillStyle = skinDark;
    ctx.beginPath();
    ctx.moveTo(-u * 0.22, -u * 0.17);
    ctx.quadraticCurveTo(0, -u * 0.09, u * 0.22, -u * 0.17);
    ctx.quadraticCurveTo(0, u * 0.02, -u * 0.22, -u * 0.17);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.moveTo(-u * 0.19, -u * 0.16);
    ctx.quadraticCurveTo(0, -u * 0.02, u * 0.19, -u * 0.16);
    ctx.quadraticCurveTo(0, -u * 0.005, -u * 0.19, -u * 0.16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#F5F5F0';
    for (const s of [-1, 1]) {
        const fx = s * u * 0.17;
        ctx.beginPath();
        ctx.moveTo(fx, -u * 0.16);
        ctx.lineTo(fx - s * u * 0.05, -u * 0.16);
        ctx.lineTo(fx - s * u * 0.02, -u * 0.08);
        ctx.closePath();
        ctx.fill();
    }
}

function drawEye(ctx, u, x, y, side, socketColor) {
    ctx.strokeStyle = socketColor;
    ctx.lineWidth = u * 0.05;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + side * u * 0.16, y - u * 0.14);
    ctx.lineTo(x - side * u * 0.13, y - u * 0.02);
    ctx.stroke();
    ctx.lineCap = 'butt';

    ctx.fillStyle = socketColor;
    ctx.beginPath();
    ctx.ellipse(x, y, u * 0.15, u * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFACD';
    ctx.beginPath();
    ctx.ellipse(x, y + u * 0.01, u * 0.11, u * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
    const irisX = x - side * u * 0.02;
    ctx.fillStyle = STEEL.iris;
    ctx.beginPath();
    ctx.arc(irisX, y, u * 0.065, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(irisX, y, u * 0.02, u * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawGorget(ctx, u, lw) {
    // Plate collar between the head and the breastplate
    ctx.fillStyle = steelGradient(ctx, -u * 0.32, -u * 0.16, u * 0.32, -u * 0.02);
    ctx.beginPath();
    ctx.ellipse(0, -u * 0.06, u * 0.32, u * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = STEEL.deep;
    ctx.lineWidth = lw * 1.2;
    ctx.stroke();
}

function drawHelmet(ctx, u, lw) {
    // Cheek plates hugging the sides of the head
    for (const s of [-1, 1]) {
        ctx.fillStyle = steelGradient(ctx, s * u * 0.4, -u * 0.72, s * u * 0.52, -u * 0.4);
        ctx.beginPath();
        ctx.ellipse(s * u * 0.455, -u * 0.55, u * 0.07, u * 0.17, s * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = STEEL.deep;
        ctx.lineWidth = lw;
        ctx.stroke();
    }

    // Crest: a crimson plume swept up and back from the crown
    ctx.fillStyle = STEEL.crest;
    ctx.beginPath();
    ctx.moveTo(-u * 0.12, -u * 1.0);
    ctx.quadraticCurveTo(-u * 0.05, -u * 1.34, u * 0.3, -u * 1.3);
    ctx.quadraticCurveTo(u * 0.14, -u * 1.2, u * 0.16, -u * 1.02);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = STEEL.crestDark;
    ctx.lineWidth = lw;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 190, 170, 0.35)';
    ctx.lineWidth = lw * 0.8;
    ctx.beginPath();
    ctx.moveTo(-u * 0.04, -u * 1.05);
    ctx.quadraticCurveTo(u * 0.06, -u * 1.24, u * 0.24, -u * 1.27);
    ctx.stroke();

    // Dome
    ctx.fillStyle = steelGradient(ctx, -u * 0.5, -u * 1.08, u * 0.5, -u * 0.76);
    ctx.beginPath();
    ctx.moveTo(-u * 0.52, -u * 0.78);
    ctx.quadraticCurveTo(-u * 0.55, -u * 1.05, 0, -u * 1.09);
    ctx.quadraticCurveTo(u * 0.55, -u * 1.05, u * 0.52, -u * 0.78);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = STEEL.deep;
    ctx.lineWidth = lw * 1.4;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.ellipse(-u * 0.16, -u * 0.98, u * 0.15, u * 0.05, -0.25, 0, Math.PI * 2);
    ctx.fill();

    // Brow band with rivets
    ctx.fillStyle = STEEL.dark;
    ctx.beginPath();
    ctx.rect(-u * 0.54, -u * 0.84, u * 1.08, u * 0.09);
    ctx.fill();
    ctx.strokeStyle = STEEL.deep;
    ctx.lineWidth = lw;
    ctx.stroke();
    for (const rx of [-0.42, -0.21, 0.21, 0.42]) {
        rivet(ctx, rx * u, -u * 0.795, u * 0.02);
    }

    // Nose guard
    ctx.fillStyle = STEEL.mid;
    ctx.beginPath();
    ctx.rect(-u * 0.035, -u * 0.76, u * 0.07, u * 0.3);
    ctx.fill();
    ctx.strokeStyle = STEEL.deep;
    ctx.lineWidth = lw * 0.8;
    ctx.stroke();
}

function drawPauldron(ctx, u, lw, side) {
    const px = side * u * 0.5;
    const py = -u * 0.1;

    // Spike
    ctx.fillStyle = STEEL.mid;
    ctx.beginPath();
    ctx.moveTo(px + side * u * 0.02, py - u * 0.1);
    ctx.lineTo(px + side * u * 0.11, py - u * 0.33);
    ctx.lineTo(px + side * u * 0.17, py - u * 0.06);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = STEEL.deep;
    ctx.lineWidth = lw;
    ctx.stroke();

    // Two layered plates
    ctx.fillStyle = steelGradient(ctx, px - u * 0.2, py - u * 0.15, px + u * 0.2, py + u * 0.15);
    ctx.beginPath();
    ctx.ellipse(px, py + u * 0.05, u * 0.2, u * 0.13, side * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = steelGradient(ctx, px - u * 0.2, py - u * 0.2, px + u * 0.2, py + u * 0.05);
    ctx.beginPath();
    ctx.ellipse(px, py - u * 0.02, u * 0.17, u * 0.11, side * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    rivet(ctx, px - side * u * 0.03, py - u * 0.02, u * 0.022);
}
