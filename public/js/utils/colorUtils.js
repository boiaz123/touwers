export function darkenColor(color, factor) {
    if (!color.startsWith('#')) return color;
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgb(${Math.max(0, Math.floor(r * (1 - factor)))}, ${Math.max(0, Math.floor(g * (1 - factor)))}, ${Math.max(0, Math.floor(b * (1 - factor)))})`;
}

export function lightenColor(color, factor) {
    if (!color.startsWith('#')) return color;
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgb(${Math.min(255, Math.floor(r + (255 - r) * factor))}, ${Math.min(255, Math.floor(g + (255 - g) * factor))}, ${Math.min(255, Math.floor(b + (255 - b) * factor))})`;
}

/** #rrggbb -> 'rgba(r, g, b, alpha)'. Needed anywhere a dynamic (per-instance/per-element)
 *  hex color must carry translucency - CanvasGraphicsShim's ctx.globalAlpha maps to Pixi
 *  Graphics.alpha, a single value applied to the WHOLE Graphics object at render time, not
 *  per draw call, so toggling globalAlpha mid-render (set low, draw, reset to 1) has no
 *  visible effect for Mode B (live-redraw) enemies - only baking the alpha directly into
 *  the fill/stroke color's rgba() string actually renders translucent. See
 *  CanvasGraphicsShim.js's own class doc and the enemy render adapter's Mode B path. */
export function hexToRgba(color, alpha) {
    if (!color.startsWith('#')) return color;
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Same #rrggbb -> rgba conversion as hexToRgba, but pre-built as a 101-entry table indexed
 *  by alpha*100 (rounded) - matches the particle-color-table convention already used by
 *  ElementalFrogEnemy/FrogKingEnemy (avoids per-frame string concatenation for colors whose
 *  alpha changes every frame, e.g. a pulsing magical aura). */
export function hexToRgbaTable(color) {
    if (!color.startsWith('#')) return null;
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return Array.from({ length: 101 }, (_, i) => `rgba(${r}, ${g}, ${b}, ${(i / 100).toFixed(2)})`);
}
