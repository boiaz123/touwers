/**
 * Shared flipper/webbed-foot shape for all frog-family enemies (base FrogEnemy draws
 * its own similar but distinct foot; ElementalFrogEnemy and FrogKingEnemy share this
 * one so a fix here applies to both instead of drifting out of sync).
 *
 * Built from an explicit list of on-curve polygon points connected with lineTo - not
 * quadraticCurveTo with distant control points. A quadratic Bezier only reaches its
 * control point partway (the curve is pulled toward it, not through it), so using
 * "the coordinate I actually want the edge to pass through" as a bezier control
 * point undershoots - that's what made the previous version read as a plain rounded
 * blob ("a circle with a line") instead of a paddle: the wide/notch points were
 * control points the curve never actually reached. Every point below is a literal
 * vertex the outline passes through, so the paddle shape, toe notches, and tapered
 * tip all land exactly where specified regardless of point count/spacing.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} ankleX  where the flipper attaches (the calf's end point)
 * @param {number} ankleY
 * @param {number} angle   direction the flipper points, matching the calf's own angle
 *                         (measured from the +x axis) so it continues the leg's line
 * @param {number} length  tip-to-ankle length
 * @param {number} maxWidth  widest point of the paddle
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
        [0.00 * L, 0.16 * W],   // ankle - narrow, where it joins the calf
        [0.16 * L, 0.32 * W],
        [0.36 * L, 0.48 * W],   // paddle shoulder - widest run of the foot
        [0.55 * L, 0.49 * W],
        [0.68 * L, 0.42 * W],   // start of the webbed toes
        [0.77 * L, 0.46 * W],   // toe 1 tip
        [0.82 * L, 0.30 * W],   // notch between toe 1 and 2
        [0.90 * L, 0.36 * W],   // toe 2 tip
        [0.94 * L, 0.20 * W],   // notch between toe 2 and 3
        [1.00 * L, 0.24 * W],   // toe 3 tip
        [1.04 * L, 0.09 * W],
        [1.06 * L, 0.00],       // rounded tip apex
    ];

    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.moveTo(topPoints[0][0], topPoints[0][1]);
    for (let i = 1; i < topPoints.length; i++) ctx.lineTo(topPoints[i][0], topPoints[i][1]);
    // Mirror back along the bottom edge (tip -> ankle) to close the paddle as one loop.
    for (let i = topPoints.length - 2; i >= 0; i--) ctx.lineTo(topPoints[i][0], -topPoints[i][1]);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Webbing creases - one per toe notch, kept fully inside the paddle outline so
    // they read as webbing divisions rather than separate splayed toes poking out
    // past the edge.
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(0.5 * L, 0);
    ctx.lineTo(0.82 * L, 0.28 * W);
    ctx.moveTo(0.5 * L, 0);
    ctx.lineTo(0.94 * L, 0.16 * W);
    ctx.moveTo(0.5 * L, 0);
    ctx.lineTo(0.82 * L, -0.28 * W);
    ctx.moveTo(0.5 * L, 0);
    ctx.lineTo(0.94 * L, -0.16 * W);
    ctx.stroke();

    ctx.restore();
}
