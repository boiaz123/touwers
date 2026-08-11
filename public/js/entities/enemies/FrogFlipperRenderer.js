/**
 * Shared toe-pad foot shape for all frog-family enemies (base FrogEnemy,
 * ElementalFrogEnemy and its four elements, and FrogKingEnemy all import this one
 * function, so a fix here applies everywhere instead of drifting out of sync).
 *
 * Matches the classic frog-foot silhouette: a rounded palm with a handful of
 * distinct toes fanning out from it, each toe a thin neck ending in a bulbous round
 * pad - not a webbed paddle with a continuous membrane between the toes. Toes are
 * drawn first (round-capped thick strokes for the necks, filled circles for the
 * pads), then the palm is drawn on top so it cleanly covers each neck's base -
 * that layering is what keeps the toes reading as separate digits instead of one
 * fused blob.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} ankleX  where the foot attaches (the calf's end point)
 * @param {number} ankleY
 * @param {number} angle   direction the foot points, matching the calf's own angle
 *                         (measured from the +x axis) so it continues the leg's line
 * @param {number} length  ankle-to-farthest-toe-pad length
 * @param {number} maxWidth  half-width the toe fan spreads across
 * @param {string} fillColor
 * @param {string} strokeColor
 */
export function drawFlipperFoot(ctx, ankleX, ankleY, angle, length, maxWidth, fillColor, strokeColor) {
    ctx.save();
    ctx.translate(ankleX, ankleY);
    ctx.rotate(angle);

    // Local +x is "onward" along the foot, from the ankle join toward the toes.
    const L = length, W = maxWidth;

    // Palm sits just past the ankle; toes fan out from its far edge. Lengths/pad
    // radii/angles are deliberately uneven (not a symmetric mirrored fan) - a real
    // toe-pad foot reads as organic specifically because the digits aren't uniform.
    const palmX = 0.22 * L;
    const palmRX = 0.24 * L, palmRY = 0.6 * W;

    const toes = [
        { angle: -0.95, len: 0.62 * L, pad: 0.32 * W },
        { angle: -0.30, len: 0.95 * L, pad: 0.4 * W },
        { angle: 0.28, len: 0.88 * L, pad: 0.38 * W },
        { angle: 0.92, len: 0.55 * L, pad: 0.28 * W },
    ];

    ctx.lineCap = 'round';
    for (const toe of toes) {
        const dx = Math.cos(toe.angle), dy = Math.sin(toe.angle);
        const baseX = palmX + dx * palmRX * 0.35, baseY = dy * palmRY * 0.35;
        const padX = palmX + dx * toe.len, padY = dy * toe.len;

        // Neck - thin round-capped stroke from the palm out to the pad center, so
        // the pad circle drawn next fully caps its far end.
        ctx.strokeStyle = fillColor;
        ctx.lineWidth = toe.pad * 0.8;
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.lineTo(padX, padY);
        ctx.stroke();

        // Pad - the rounded toe tip.
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.arc(padX, padY, toe.pad, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 0.7;
        ctx.stroke();
    }

    // Palm - drawn last so it covers every toe-neck base cleanly.
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.ellipse(palmX, 0, palmRX, palmRY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Reset - unlike a real CanvasRenderingContext2D, CanvasGraphicsShim's
    // save()/restore() only tracks the transform, not style state like lineCap, so
    // the 'round' cap set above for the toe necks would otherwise leak into
    // whatever this entity strokes next this frame.
    ctx.lineCap = 'butt';

    ctx.restore();
}
