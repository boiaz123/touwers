/**
 * Shared "close-to-skin" magical aura for the frog-family spellcaster enemies
 * (ElementalFrogEnemy's four elements and FrogKingEnemy's rotating elemental
 * vulnerability) - a soft, pulsing nimbus of the entity's elemental glow color,
 * hugging the body/head silhouette rather than a wide detached halo.
 *
 * Drawn as two layered translucent fills per body part (a fainter outer bloom,
 * a slightly brighter inner ring right at the skin edge) using alpha baked
 * directly into the fill color via a 101-entry rgba lookup table (see
 * colorUtils.hexToRgbaTable). This deliberately avoids ctx.globalAlpha: under
 * CanvasGraphicsShim (the Mode B live-redraw path both these enemies use),
 * globalAlpha maps to Pixi Graphics.alpha - a single value applied to the whole
 * Graphics object at render time, not per draw call - so toggling it mid-render
 * and resetting it before the frame's synchronous drawing finishes has no
 * visible effect. Baked-alpha rgba colors render correctly per shape instead.
 */

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string[]} auraTable  101-entry rgba lookup table (colorUtils.hexToRgbaTable(glowColor))
 * @param {number} pulse  0..1 breathing phase (caller drives frequency/phase so instances desync)
 * @param {{x:number, y:number, rx:number, ry:number}[]} parts  body masses to hug (body ellipse, head ellipse, ...)
 */
export function drawSkinAura(ctx, auraTable, pulse, parts) {
    if (!auraTable) return;
    const outerA = Math.max(0, Math.min(100, Math.round(8 + pulse * 7)));
    const innerA = Math.max(0, Math.min(100, Math.round(19 + pulse * 12)));

    for (const part of parts) {
        ctx.fillStyle = auraTable[outerA];
        ctx.beginPath();
        ctx.ellipse(part.x, part.y, part.rx * 1.24, part.ry * 1.22, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = auraTable[innerA];
        ctx.beginPath();
        ctx.ellipse(part.x, part.y, part.rx * 1.1, part.ry * 1.08, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}
