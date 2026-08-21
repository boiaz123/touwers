import { ArcherTower } from './ArcherTower.js';

/**
 * Transformed Archer Tower - trades fire rate for a devastating, effectively-unlimited-
 * range shot.
 *
 * Range used to be set to actual Infinity, which caused two real problems: (1) the shared
 * spatial-grid targeting in Tower.findTarget() queries a bounded radius around the tower,
 * which is meaningless for an infinite radius, so findTarget() had to be overridden to
 * linear-scan every living enemy on every re-target instead; and (2) ctx.arc(..., range, ...)
 * with an Infinite radius would hang/crash the canvas draw call, so the range-circle
 * rendering needed a separate hardcoded cap just to stay drawable.
 *
 * MASSIVE_RANGE replaces Infinity with a large-but-finite radius instead: it comfortably
 * exceeds the base-resolution map diagonal (1920x1080, ~2202px) at every supported
 * resolution scale, so it still reads as "covers the whole map" in play, while being a real
 * number the shared spatial-grid targeting and the base Tower's range-circle rendering
 * (Tower.renderAttackRadiusCircle) can use completely unmodified - no override needed for
 * either.
 */
export class SharpshooterTower extends ArcherTower {
    static TRANSFORM_COLOR = '#B22222';
    static MASSIVE_RANGE = 3000;

    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY);
        this.damage = 150;
        this.fireRate = 0.3;
        this.range = SharpshooterTower.MASSIVE_RANGE;
    }

    /** Reuses ArcherTower's stone foundation + wooden shaft unmodified (see
     *  renderFoundationAndShaft()), then replaces the plain platform and thatched roof
     *  with a fortified stone battlement and a severe iron spire - a patient marksman's
     *  perch should read as a proper fortified lookout, not the rustic watchtower every
     *  other Archer Tower uses. Genuinely different pixels from the base type, so this
     *  bakes under its own name (see TowerRenderAdapter._bakeClassName's doc). */
    renderStaticBack(ctx, towerSize) {
        this.renderFoundationAndShaft(ctx, towerSize);

        const towerWidth = towerSize * 0.6 * 0.8;
        const towerHeight = towerSize * 0.7;
        const platformY = this.y - towerHeight;

        // Iron bands reinforcing the shaft, at the same heights as ArcherTower's plain
        // wooden support beams (already drawn by renderFoundationAndShaft) - a "reinforced"
        // read layered on top, not a rebuild of the shaft itself.
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 3;
        for (let i = 1; i <= 3; i++) {
            const beamY = this.y - towerHeight + (towerHeight * i / 4);
            ctx.beginPath();
            ctx.moveTo(this.x - towerWidth / 2 - 1, beamY);
            ctx.lineTo(this.x + towerWidth / 2 + 1, beamY);
            ctx.stroke();
        }
        ctx.fillStyle = '#1c1c1e';
        for (let i = 1; i <= 3; i++) {
            const beamY = this.y - towerHeight + (towerHeight * i / 4);
            for (const side of [-1, 1]) {
                ctx.beginPath();
                ctx.arc(this.x + side * towerWidth * 0.35, beamY, 1.1, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Wider, sturdier stone platform than ArcherTower's wooden one
        const platformWidth = towerWidth * 1.5;
        const platformThickness = towerSize * 0.09;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(this.x - platformWidth / 2 + 2, platformY - platformThickness + 2, platformWidth, platformThickness);

        ctx.fillStyle = '#7d7d80';
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 2;
        ctx.fillRect(this.x - platformWidth / 2, platformY - platformThickness, platformWidth, platformThickness);
        ctx.strokeRect(this.x - platformWidth / 2, platformY - platformThickness, platformWidth, platformThickness);

        // Heavier iron support brackets than ArcherTower's wooden ones
        const bracketWidth = towerSize * 0.13;
        for (const side of [-1, 1]) {
            const bracketX = this.x + side * towerWidth / 2;
            ctx.fillStyle = '#3a3a3a';
            ctx.beginPath();
            ctx.moveTo(bracketX, platformY - platformThickness);
            ctx.lineTo(bracketX + side * bracketWidth, platformY - platformThickness - bracketWidth);
            ctx.lineTo(bracketX + side * bracketWidth, platformY);
            ctx.lineTo(bracketX, platformY);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#1c1c1e';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Crenellated stone battlement instead of ArcherTower's plain arrow-slit wall -
        // alternating raised merlons and lower gaps, so the top reads as a fortified
        // lookout rather than a rustic hut.
        const railingHeight = towerSize * 0.24;
        const merlonHeight = railingHeight * 0.4;
        const railingY = platformY - platformThickness - railingHeight;
        const merlonCount = 5;
        const merlonWidth = platformWidth / merlonCount;

        ctx.fillStyle = '#6e6e70';
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        // Lower wall band, full width
        ctx.fillRect(this.x - platformWidth / 2, railingY + merlonHeight, platformWidth, railingHeight - merlonHeight);
        ctx.strokeRect(this.x - platformWidth / 2, railingY + merlonHeight, platformWidth, railingHeight - merlonHeight);
        // Raised merlons, every other segment
        for (let i = 0; i < merlonCount; i++) {
            if (i % 2 !== 0) continue;
            const mx = this.x - platformWidth / 2 + i * merlonWidth;
            ctx.fillRect(mx, railingY, merlonWidth, railingHeight);
            ctx.strokeRect(mx, railingY, merlonWidth, railingHeight);
        }
        // Arrow slits through the merlons
        ctx.fillStyle = '#1c1c1e';
        for (let i = 0; i < merlonCount; i++) {
            if (i % 2 !== 0) continue;
            const mx = this.x - platformWidth / 2 + i * merlonWidth + merlonWidth / 2;
            ctx.fillRect(mx - 1, railingY + merlonHeight * 1.3, 2, railingHeight * 0.5);
        }

        // Heavier stone corner pillars instead of ArcherTower's thin wood posts
        const postSize = towerSize * 0.06;
        ctx.fillStyle = '#5a5a5c';
        ctx.strokeStyle = '#1c1c1e';
        ctx.lineWidth = 1;
        for (const side of [-1, 1]) {
            const postX = this.x + side * platformWidth / 2;
            ctx.fillRect(postX - postSize / 2, railingY, postSize, railingHeight + platformThickness);
            ctx.strokeRect(postX - postSize / 2, railingY, postSize, railingHeight + platformThickness);
        }

        // Steep iron spire roof - taller and narrower than ArcherTower's soft thatch,
        // with metal ribs radiating from the peak instead of straw rows.
        const roofHeight = towerSize * 0.4;
        const roofY = railingY;
        const roofPeakPt = roofY - roofHeight;
        const roofHalfW = platformWidth / 2 + postSize + 3;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.moveTo(this.x + 2, roofPeakPt + 2);
        ctx.lineTo(this.x - roofHalfW + 2, roofY + 2);
        ctx.lineTo(this.x + roofHalfW + 2, roofY + 2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#4a4a4e';
        ctx.beginPath();
        ctx.moveTo(this.x, roofPeakPt);
        ctx.lineTo(this.x - roofHalfW, roofY);
        ctx.lineTo(this.x + roofHalfW, roofY);
        ctx.closePath();
        ctx.fill();

        // Left half shaded darker for a simple pitched-roof read
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.beginPath();
        ctx.moveTo(this.x, roofPeakPt);
        ctx.lineTo(this.x - roofHalfW, roofY);
        ctx.lineTo(this.x, roofY);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#1c1c1e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x - roofHalfW, roofY);
        ctx.lineTo(this.x, roofPeakPt);
        ctx.lineTo(this.x + roofHalfW, roofY);
        ctx.stroke();

        // Metal ribs radiating from the peak
        ctx.strokeStyle = '#2a2a2c';
        ctx.lineWidth = 1;
        const ribCount = 4;
        for (let i = 1; i < ribCount; i++) {
            const t = i / ribCount;
            const rx = this.x - roofHalfW + t * roofHalfW * 2;
            ctx.beginPath();
            ctx.moveTo(this.x, roofPeakPt);
            ctx.lineTo(rx, roofY);
            ctx.stroke();
        }

        // Iron spike finial
        ctx.strokeStyle = '#2a2a2c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(this.x, roofPeakPt);
        ctx.lineTo(this.x, roofPeakPt - 14);
        ctx.stroke();

        // Bigger banner than ArcherTower's, set further out - a more commanding presence
        ctx.fillStyle = '#8B1E3F';
        ctx.beginPath();
        ctx.moveTo(this.x, roofPeakPt - 14);
        ctx.lineTo(this.x + 18, roofPeakPt - 8);
        ctx.lineTo(this.x, roofPeakPt - 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#5b1028';
        ctx.lineWidth = 0.6;
        ctx.stroke();
    }

    static getInfo() {
        return {
            name: 'Sharpshooter',
            description: 'A patient marksman with unlimited range and a devastating shot - but a long time between them.',
            cost: 500,
            icon: ''
        };
    }
}
