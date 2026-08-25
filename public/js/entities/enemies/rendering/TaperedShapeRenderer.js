/**
 * Draws a single smooth, tapered, (optionally) bent shape through a sequence of
 * points with per-point widths - e.g. a leg that bends at the knee, or a club
 * shaft that swells into a bulbous head. Filling ONE continuous outline like this
 * instead of stacking separate overlapping ellipses/circles at each joint (the
 * previous approach for FrogKingEnemy's legs and BasicEnemy's club) is what makes
 * it read as one solid limb/object rather than "a chain of blobs" or "too many
 * joints and circles".
 *
 * At interior points, the outline's local direction is the *average* of the
 * incoming and outgoing segment directions, which is what makes a bend (e.g. hip
 * -> knee -> foot) look like a smooth taper through the joint rather than a sharp
 * polygon corner - a standard trick for cheap 2D limb rendering without needing a
 * true vector-stroke/spline library.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{x:number,y:number}[]} points  at least 2 points, in order from one end to the other
 * @param {number[]} widths  same length as points - full width (not radius) at each point
 * @param {string} [fillColor]
 * @param {string} [strokeColor]
 * @param {number} [strokeWidth]
 */
export function drawTaperedPath(ctx, points, widths, fillColor, strokeColor, strokeWidth = 1) {
    const n = points.length;
    if (n < 2) return;

    const dirs = new Array(n);
    for (let i = 0; i < n; i++) {
        let dx, dy;
        if (i === 0) {
            dx = points[1].x - points[0].x;
            dy = points[1].y - points[0].y;
        } else if (i === n - 1) {
            dx = points[n - 1].x - points[n - 2].x;
            dy = points[n - 1].y - points[n - 2].y;
        } else {
            const d1x = points[i].x - points[i - 1].x, d1y = points[i].y - points[i - 1].y;
            const d2x = points[i + 1].x - points[i].x, d2y = points[i + 1].y - points[i].y;
            const l1 = Math.hypot(d1x, d1y) || 1, l2 = Math.hypot(d2x, d2y) || 1;
            dx = d1x / l1 + d2x / l2;
            dy = d1y / l1 + d2y / l2;
        }
        const len = Math.hypot(dx, dy) || 1;
        dirs[i] = { x: dx / len, y: dy / len };
    }

    const leftSide = new Array(n), rightSide = new Array(n);
    for (let i = 0; i < n; i++) {
        const perpX = -dirs[i].y, perpY = dirs[i].x;
        const halfW = widths[i] / 2;
        leftSide[i] = { x: points[i].x + perpX * halfW, y: points[i].y + perpY * halfW };
        rightSide[i] = { x: points[i].x - perpX * halfW, y: points[i].y - perpY * halfW };
    }

    ctx.beginPath();
    ctx.moveTo(leftSide[0].x, leftSide[0].y);
    for (let i = 1; i < n; i++) ctx.lineTo(leftSide[i].x, leftSide[i].y);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(rightSide[i].x, rightSide[i].y);
    ctx.closePath();

    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
    }
}
