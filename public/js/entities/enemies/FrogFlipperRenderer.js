/**
 * Shared clawed webbed-foot shape for all frog-family enemies (base FrogEnemy,
 * ElementalFrogEnemy and its four elements, and FrogKingEnemy all import this one
 * function, so a fix here applies everywhere instead of drifting out of sync).
 *
 * Built from an explicit list of on-curve polygon points connected with lineTo - not
 * quadraticCurveTo with distant control points. A quadratic Bezier only reaches its
 * control point partway (the curve is pulled toward it, not through it), so using
 * "the coordinate I actually want the edge to pass through" as a bezier control
 * point undershoots - that's what made an earlier version read as a plain rounded
 * blob ("a circle with a line") instead of a foot: the wide/notch points were
 * control points the curve never actually reached. Every point below is a literal
 * vertex the outline passes through, so the toe notches and pointed claw tips land
 * exactly where specified regardless of point count/spacing.
 *
 * The web base sits at 0.38L (not ~0.7L) so the toes themselves run most of the
 * foot's length with deep notches cut back toward that base, reading as long spread
 * claws/digits - a real-frog reference photo - rather than a rounded paddle with a
 * few shallow nicks near the tip.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} ankleX  where the flipper attaches (the calf's end point)
 * @param {number} ankleY
 * @param {number} angle   direction the flipper points, matching the calf's own angle
 *                         (measured from the +x axis) so it continues the leg's line
 * @param {number} length  tip-to-ankle length
 * @param {number} maxWidth  widest point of the foot
 * @param {string} fillColor
 * @param {string} strokeColor
 */
export function drawFlipperFoot(ctx, ankleX, ankleY, angle, length, maxWidth, fillColor, strokeColor) {
    ctx.save();
    ctx.translate(ankleX, ankleY);
    ctx.rotate(angle);

    // Local +x is "onward" along the flipper, from a narrow ankle join to the webbed
    // tip. Top-edge points go ankle -> tip; the bottom edge is the mirror image,
    // walked tip -> ankle to close the outline as one loop.
    const L = length, W = maxWidth;
    const topPoints = [
        [0.00 * L, 0.14 * W],   // ankle - narrow, where it joins the calf
        [0.10 * L, 0.28 * W],
        [0.24 * L, 0.42 * W],   // web shoulder - widest run, reached early
        [0.38 * L, 0.34 * W],   // web base - toes splay from here, not just near the tip
        [0.66 * L, 0.46 * W],   // toe 1 tip - long, thin digit
        [0.76 * L, 0.15 * W],   // deep notch cut back toward the web base
        [0.97 * L, 0.30 * W],   // toe 2 tip
        [1.01 * L, 0.08 * W],   // deep notch before the center toe
        [1.12 * L, 0.00],       // center toe - a real point, not a rounded apex
    ];

    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.moveTo(topPoints[0][0], topPoints[0][1]);
    for (let i = 1; i < topPoints.length; i++) ctx.lineTo(topPoints[i][0], topPoints[i][1]);
    // Mirror back along the bottom edge (tip -> ankle) to close the outline as one loop.
    for (let i = topPoints.length - 2; i >= 0; i--) ctx.lineTo(topPoints[i][0], -topPoints[i][1]);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Webbing creases - from the web base back to each notch, kept fully inside the
    // outline so they read as webbing divisions between the splayed toes.
    const webX = 0.3 * L;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(webX, 0);
    ctx.lineTo(0.76 * L, 0.13 * W);
    ctx.moveTo(webX, 0);
    ctx.lineTo(1.01 * L, 0.06 * W);
    ctx.moveTo(webX, 0);
    ctx.lineTo(0.76 * L, -0.13 * W);
    ctx.moveTo(webX, 0);
    ctx.lineTo(1.01 * L, -0.06 * W);
    ctx.stroke();

    // Dark claw tips - a small pointed accent past each toe end, reading as an actual
    // clawed digit rather than a bare rounded toe.
    const clawTips = [
        [0.66 * L, 0.46 * W], [0.66 * L, -0.46 * W],
        [0.97 * L, 0.30 * W], [0.97 * L, -0.30 * W],
        [1.12 * L, 0],
    ];
    ctx.fillStyle = 'rgba(25, 22, 18, 0.85)';
    for (const [tx, ty] of clawTips) {
        const dist = Math.hypot(tx, ty) || 1;
        const dx = tx / dist, dy = ty / dist;
        const px = -dy, py = dx;
        const clawLen = L * 0.09;
        const clawHalfW = W * 0.05;
        ctx.beginPath();
        ctx.moveTo(tx + px * clawHalfW, ty + py * clawHalfW);
        ctx.lineTo(tx + dx * clawLen, ty + dy * clawLen);
        ctx.lineTo(tx - px * clawHalfW, ty - py * clawHalfW);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();
}
