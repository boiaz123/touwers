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
