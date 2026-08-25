// Shared medieval sword artwork - used by the main menu's title-transition sword
// clash and by the in-canvas mouse cursor, so both stay visually identical.
export const SWORD_BLADE_LENGTH = 180;

export function drawMedievalSword(ctx, x, y, primaryColor, accentColor, scale = 1) {
    const bladeLength = SWORD_BLADE_LENGTH * scale;
    const bladeWidth = 25 * scale;
    const guardWidth = 90 * scale;
    const guardHeight = 15 * scale;
    const handleLength = 80 * scale;
    const pommelRadius = 10 * scale;

    // Blade pointing UPWARD (negative Y)
    ctx.fillStyle = primaryColor;
    // Main blade body
    ctx.beginPath();
    ctx.moveTo(x - bladeWidth / 2, y); // Bottom left
    ctx.lineTo(x + bladeWidth / 2, y); // Bottom right
    ctx.lineTo(x + bladeWidth / 3, y - bladeLength * 0.7); // Right edge towards tip
    ctx.lineTo(x, y - bladeLength); // Tip (pointy)
    ctx.lineTo(x - bladeWidth / 3, y - bladeLength * 0.7); // Left edge towards tip
    ctx.closePath();
    ctx.fill();

    // Blade shine (down the middle)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.moveTo(x - bladeWidth / 5, y);
    ctx.lineTo(x + bladeWidth / 5, y);
    ctx.lineTo(x + bladeWidth / 8, y - bladeLength * 0.6);
    ctx.lineTo(x, y - bladeLength + 5);
    ctx.lineTo(x - bladeWidth / 8, y - bladeLength * 0.6);
    ctx.closePath();
    ctx.fill();

    // Cross guard (perpendicular to blade)
    ctx.fillStyle = accentColor;
    ctx.fillRect(x - guardWidth / 2, y + 2, guardWidth, guardHeight);

    // Guard decorative circles
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2.5 * scale;
    ctx.beginPath();
    ctx.arc(x - guardWidth / 3, y + guardHeight / 2, 5 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + guardWidth / 3, y + guardHeight / 2, 5 * scale, 0, Math.PI * 2);
    ctx.stroke();

    // Handle below guard
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(x - bladeWidth / 2.5, y + guardHeight + 2, bladeWidth * 0.8, handleLength);

    // Handle grip lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(x - bladeWidth / 2.5, y + guardHeight + 2 + (i * 7));
        ctx.lineTo(x + bladeWidth / 2.5, y + guardHeight + 2 + (i * 7));
        ctx.stroke();
    }

    // Pommel at bottom
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(x, y + guardHeight + handleLength + 5, pommelRadius, 0, Math.PI * 2);
    ctx.fill();

    // Pommel highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(x - 3, y + guardHeight + handleLength + 5 - 3, pommelRadius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Blade edge definition
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + bladeWidth / 2, y);
    ctx.lineTo(x + bladeWidth / 3, y - bladeLength * 0.7);
    ctx.lineTo(x, y - bladeLength);
    ctx.stroke();
}

const CURSOR_SCALE = 0.22 * 0.65; // 65% of the original cursor size
const CURSOR_PRIMARY_COLOR = '#d4af37';
const CURSOR_ACCENT_COLOR = '#8b7355';

// Diagonal tilt: blade tip points to the top-left, hilt trails to the bottom-right.
const CURSOR_ANGLE = -Math.PI / 4;

// Draws the same sword artwork as a mouse cursor, tilted diagonally (tip at
// top-left, hilt at bottom-right) with its blade tip exactly at (tipX, tipY)
// so the tip - not the hilt or any other part of the artwork - is the click point.
export function drawSwordCursor(ctx, tipX, tipY, scale = CURSOR_SCALE) {
    const bladeLength = SWORD_BLADE_LENGTH * scale;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 3;
    // The artwork's anchor is the hilt end, with its blade tip at local (0, -bladeLength).
    // Rotating by CURSOR_ANGLE and placing the anchor at
    // (tipX - bladeLength*sin(angle), tipY + bladeLength*cos(angle)) makes the
    // rotated tip land exactly on (tipX, tipY), for any angle.
    const anchorX = tipX - bladeLength * Math.sin(CURSOR_ANGLE);
    const anchorY = tipY + bladeLength * Math.cos(CURSOR_ANGLE);
    ctx.translate(anchorX, anchorY);
    ctx.rotate(CURSOR_ANGLE);
    drawMedievalSword(ctx, 0, 0, CURSOR_PRIMARY_COLOR, CURSOR_ACCENT_COLOR, scale);
    ctx.restore();
}
