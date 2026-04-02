import { HitSplatter } from '../effects/HitSplatter.js';

/**
 * DefenderBase - Base class for all defenders
 * Provides shared properties, stats, and utility methods
 * Subclasses (CastleDefender, PathDefender) implement their own combat and rendering logic
 */
export class DefenderBase {
    constructor(level = 1) {
        this.level = Math.min(3, Math.max(1, level)); // Clamp to 1-3
        
        // Initialize stats based on level
        this.initializeStats();
        
        // Position (will be set when placed)
        this.x = 0;
        this.y = 0;
        
        // Waypoint where enemies should stop and fight this defender
        // Used by enemies to know when to stop moving and engage
        this.defenderWaypoint = null;
        
        // Combat properties
        this.attackDamage = this.getAttackDamage();
        this.attackSpeed = this.getAttackSpeed();
        this.attackCooldown = 0;
        this.attackRange = 80; // Enemies stop at 60 units, so range must be at least 70-80 to guarantee engagement
        
        // Animation properties
        this.animationTime = 0;
        this.isAttacking = false;
        this.attackTarget = null;
        this.lastAttackTime = 0;
        
        // Size based on level - adjusted multipliers
        // Level 1: 1.2x, Level 2: 1.4x, Level 3: 1.7x
        this.sizeMultiplier = [1.2, 1.4, 1.7][this.level - 1];
        
        // Colors and styling
        this.tunicColor = this.getTunicColor();
        this.armorColor = this.getArmorColor();
        
        // Hit effects
        this.hitSplatters = [];
        this.damageFlashTimer = 0;
    }
    
    initializeStats() {
        // Base stats that scale with level
        switch(this.level) {
            case 1:
                this.maxHealth = 70;
                this.health = 70;
                this.armor = 3;
                break;
            case 2:
                this.maxHealth = 100;
                this.health = 100;
                this.armor = 6;
                break;
            case 3:
                this.maxHealth = 140;
                this.health = 140;
                this.armor = 9;
                break;
        }
    }
    
    getTunicColor() {
        // Distinctive blue colors for defenders
        switch(this.level) {
            case 1:
                return '#1E5A7A'; // Medium blue
            case 2:
                return '#1A4A6A'; // Deeper blue
            case 3:
                return '#0F2A4A'; // Very dark blue
            default:
                return '#1E5A7A';
        }
    }
    
    getArmorColor() {
        // Progressive armor colors
        switch(this.level) {
            case 1:
                return '#5A6A8A'; // Steel blue
            case 2:
                return '#4A5A7A'; // Darker steel
            case 3:
                return '#3A4A6A'; // Deep armor blue
            default:
                return '#5A6A8A';
        }
    }
    
    getAttackDamage() {
        switch(this.level) {
            case 1:
                return 15;
            case 2:
                return 20;
            case 3:
                return 30;
            default:
                return 5;
        }
    }
    
    getAttackSpeed() {
        switch(this.level) {
            case 1:
                return 0.9;
            case 2:
                return 1.0;
            case 3:
                return 1.1;
            default:
                return 0.8;
        }
    }

    takeDamage(amount) {
        const armorReduction = this.armor * 0.4;
        const actualDamage = Math.max(1, amount - armorReduction);
        
        this.health -= actualDamage;
        this.damageFlashTimer = 0.2;
        
        const splatter = new HitSplatter(this.x, this.y - 30, actualDamage, 'physical', null);
        this.hitSplatters.push(splatter);
        
        return actualDamage;
    }
    
    isDead() {
        return this.health <= 0;
    }

    // Shared utility color methods
    darkenColor(color, factor) {
        if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            
            const newR = Math.max(0, Math.floor(r * (1 - factor)));
            const newG = Math.max(0, Math.floor(g * (1 - factor)));
            const newB = Math.max(0, Math.floor(b * (1 - factor)));
            
            return `rgb(${newR}, ${newG}, ${newB})`;
        }
        return color;
    }
    
    lightenColor(color, factor) {
        if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            
            const newR = Math.min(255, Math.floor(r + (255 - r) * factor));
            const newG = Math.min(255, Math.floor(g + (255 - g) * factor));
            const newB = Math.min(255, Math.floor(b + (255 - b) * factor));
            
            return `rgb(${newR}, ${newG}, ${newB})`;
        }
        return color;
    }

    getAccentColor() {
        switch (this.level) {
            case 1: return '#B8C0C8';
            case 2: return '#C8A020';
            case 3: return '#FFD700';
            default: return '#B8C0C8';
        }
    }

    render(ctx) {
        const baseSize = Math.max(7.2, Math.min(16.8, ctx.canvas.width / 150)) * this.sizeMultiplier;
        const breathe = Math.sin(this.animationTime * 1.5) * 0.15;
        const idleLeftArmSway  = Math.sin(this.animationTime * 1.2) * 0.25;
        const idleRightArmSway = Math.sin(this.animationTime * 1.2 + Math.PI) * 0.25;

        let attackLeftArmAngle = 0, attackRightArmAngle = 0;
        if (this.isAttacking) {
            const p = Math.sin(Math.min(this.lastAttackTime / 0.5, 1) * Math.PI);
            attackRightArmAngle = p * 1.0;
            attackLeftArmAngle  = p * 0.4;
        }

        if (this.damageFlashTimer > 0) {
            const fi = this.damageFlashTimer / 0.2;
            ctx.fillStyle = `rgba(255, 100, 100, ${fi * 0.3})`;
            ctx.fillRect(this.x - baseSize, this.y - baseSize * 2.3, baseSize * 2, baseSize * 4);
        }

        ctx.fillStyle = 'rgba(0,0,0,0.38)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + baseSize * 1.7, baseSize * 1.15, baseSize * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(this.x, this.y);

        this.renderLegs(ctx, baseSize);

        ctx.save();
        ctx.translate(0, breathe * 0.35);

        this.renderTorso(ctx, baseSize);
        this.renderArmorPlate(ctx, baseSize);
        this.renderPauldrons(ctx, baseSize);
        this.renderHead(ctx, baseSize);
        this.renderLeftArm(ctx, baseSize, idleLeftArmSway + attackLeftArmAngle);
        this.renderRightArm(ctx, baseSize, idleRightArmSway + attackRightArmAngle, this.isAttacking, this.lastAttackTime);

        ctx.restore();
        ctx.restore();

        const barWidth  = baseSize * 4.2;
        const barHeight = Math.max(3.2, baseSize * 0.55);
        const barY = this.y - baseSize * 3.2;

        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - barWidth / 2, barY, barWidth, barHeight);
        const hp = this.health / this.maxHealth;
        ctx.fillStyle = hp > 0.5 ? '#4CAF50' : (hp > 0.25 ? '#FFC107' : '#F44336');
        ctx.fillRect(this.x - barWidth / 2, barY, barWidth * hp, barHeight);
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(this.x - barWidth / 2, barY, barWidth, barHeight);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Defender L${this.level}`, this.x, barY + barHeight / 2);

        this.hitSplatters.forEach(s => s.render(ctx));
    }

    renderLegs(ctx, baseSize) {
        const gc = this.armorColor;
        const kc = this.lightenColor(gc, 0.22);

        for (const side of [-1, 1]) {
            const lx = side * baseSize * 0.23;
            const grad = ctx.createLinearGradient(lx - baseSize * 0.16, 0, lx + baseSize * 0.16, 0);
            grad.addColorStop(0,    this.darkenColor(gc, 0.28));
            grad.addColorStop(0.35, this.lightenColor(gc, 0.14));
            grad.addColorStop(0.65, this.lightenColor(gc, 0.08));
            grad.addColorStop(1,    this.darkenColor(gc, 0.22));
            ctx.fillStyle = grad;
            ctx.fillRect(lx - baseSize * 0.15, baseSize * 0.22, baseSize * 0.3, baseSize * 1.08);
            ctx.strokeStyle = '#090909';
            ctx.lineWidth = 1;
            ctx.strokeRect(lx - baseSize * 0.15, baseSize * 0.22, baseSize * 0.3, baseSize * 1.08);

            ctx.strokeStyle = this.darkenColor(gc, 0.35);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(lx - baseSize * 0.15, baseSize * 0.7);
            ctx.lineTo(lx + baseSize * 0.15, baseSize * 0.7);
            ctx.stroke();

            ctx.fillStyle = kc;
            ctx.beginPath();
            ctx.arc(lx, baseSize * 0.72, baseSize * 0.115, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#090909';
            ctx.lineWidth = 0.8;
            ctx.stroke();

            ctx.fillStyle = 'rgba(255,255,255,0.22)';
            ctx.beginPath();
            ctx.arc(lx - baseSize * 0.03, baseSize * 0.695, baseSize * 0.05, 0, Math.PI * 2);
            ctx.fill();
        }

        for (const side of [-1, 1]) {
            const lx = side * baseSize * 0.23;
            ctx.fillStyle = '#181008';
            ctx.beginPath();
            ctx.ellipse(lx + side * baseSize * 0.05, baseSize * 1.33, baseSize * 0.24, baseSize * 0.16, side * 0.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#080808';
            ctx.lineWidth = 0.8;
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.beginPath();
            ctx.arc(lx + side * baseSize * 0.12, baseSize * 1.27, baseSize * 0.07, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderTorso(ctx, baseSize) {
        ctx.fillStyle = this.darkenColor(this.tunicColor, 0.35);
        ctx.fillRect(-baseSize * 0.72, -baseSize * 0.9, baseSize * 1.44, baseSize * 1.3);

        ctx.fillStyle = this.tunicColor;
        ctx.fillRect(-baseSize * 0.72, -baseSize * 0.88, baseSize * 0.14, baseSize * 1.27);
        ctx.fillRect( baseSize * 0.58, -baseSize * 0.88, baseSize * 0.14, baseSize * 1.27);
        ctx.strokeStyle = '#080808';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(-baseSize * 0.72, -baseSize * 0.88, baseSize * 0.14, baseSize * 1.27);
        ctx.strokeRect( baseSize * 0.58, -baseSize * 0.88, baseSize * 0.14, baseSize * 1.27);

        const ng = ctx.createLinearGradient(-baseSize * 0.22, 0, baseSize * 0.22, 0);
        ng.addColorStop(0,   this.darkenColor(this.armorColor, 0.2));
        ng.addColorStop(0.5, this.lightenColor(this.armorColor, 0.15));
        ng.addColorStop(1,   this.darkenColor(this.armorColor, 0.2));
        ctx.fillStyle = ng;
        ctx.fillRect(-baseSize * 0.2, -baseSize * 0.97, baseSize * 0.4, baseSize * 0.18);
        ctx.strokeStyle = '#090909';
        ctx.lineWidth = 1;
        ctx.strokeRect(-baseSize * 0.2, -baseSize * 0.97, baseSize * 0.4, baseSize * 0.18);

        const bands = 2 + this.level;
        for (let b = 0; b < bands; b++) {
            const bandY = baseSize * 0.35 + b * baseSize * 0.1;
            const bandW = baseSize * (1.0 - b * 0.05);
            ctx.fillStyle = this.darkenColor(this.armorColor, 0.06 * b);
            ctx.fillRect(-bandW / 2, bandY, bandW, baseSize * 0.09);
            ctx.strokeStyle = '#090909';
            ctx.lineWidth = 0.7;
            ctx.strokeRect(-bandW / 2, bandY, bandW, baseSize * 0.09);
        }
    }

    renderArmorPlate(ctx, baseSize) {
        const ph = baseSize * (0.82 + (this.level - 1) * 0.1);
        const pw = baseSize * 1.08;
        const px = -pw / 2, py = -ph;
        const accentCol = this.getAccentColor();

        const pg = ctx.createLinearGradient(px, py, px + pw, py + ph);
        pg.addColorStop(0,    this.lightenColor(this.armorColor, 0.25));
        pg.addColorStop(0.25, this.lightenColor(this.armorColor, 0.15));
        pg.addColorStop(0.5,  this.armorColor);
        pg.addColorStop(0.75, this.darkenColor(this.armorColor, 0.12));
        pg.addColorStop(1,    this.darkenColor(this.armorColor, 0.28));
        ctx.fillStyle = pg;
        ctx.fillRect(px, py, pw, ph * 0.9);
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px, py, pw, ph * 0.9);

        ctx.strokeStyle = this.darkenColor(this.armorColor, 0.35);
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, py + 2);
        ctx.lineTo(0, py + ph * 0.86);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.09)';
        ctx.fillRect(px + 2, py + 2, pw * 0.45, ph * 0.84);

        if (this.level === 1) {
            const rv = [[-0.44, -0.88], [0.44, -0.88], [-0.44, -0.1], [0.44, -0.1]];
            rv.forEach(([rx, ry]) => {
                const cx = rx * pw / 2 + pw / 2 + px;
                const cy = ry * ph / 2 + ph * 0.45 + py;
                ctx.fillStyle = '#1a1a1a';
                ctx.beginPath();
                ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.25)';
                ctx.beginPath();
                ctx.arc(cx - 0.6, cy - 0.6, 0.8, 0, Math.PI * 2);
                ctx.fill();
            });
        } else if (this.level === 2) {
            ctx.strokeStyle = accentCol;
            ctx.lineWidth = 1.8;
            ctx.strokeRect(px + 4, py + 4, pw - 8, ph * 0.83);
        } else {
            ctx.strokeStyle = accentCol;
            ctx.lineWidth = 2.8;
            ctx.strokeRect(px + 2, py + 2, pw - 4, ph * 0.87);
            ctx.strokeStyle = this.lightenColor(accentCol, 0.2);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, py + ph * 0.12);
            ctx.lineTo(0, py + ph * 0.8);
            ctx.moveTo(px + pw * 0.22, py + ph * 0.42);
            ctx.lineTo(px + pw * 0.78, py + ph * 0.42);
            ctx.stroke();
        }
    }

    renderPauldrons(ctx, baseSize) {
        const pc = this.lightenColor(this.armorColor, 0.18);
        const ps = baseSize * (0.3 + (this.level - 1) * 0.08);
        const accentCol = this.getAccentColor();

        for (const [side, angle] of [[-1, -0.3], [1, 0.3]]) {
            const px = side * baseSize * 0.73;
            const py = -baseSize * 0.3;

            ctx.fillStyle = this.darkenColor(pc, 0.18);
            ctx.beginPath();
            ctx.ellipse(px, py + ps * 0.14, ps * 1.1, ps * 1.28, angle, 0, Math.PI * 2);
            ctx.fill();

            const pg = ctx.createRadialGradient(px - side * ps * 0.25, py - ps * 0.2, 0, px, py, ps * 1.5);
            pg.addColorStop(0, this.lightenColor(pc, 0.2));
            pg.addColorStop(0.5, pc);
            pg.addColorStop(1, this.darkenColor(pc, 0.25));
            ctx.fillStyle = pg;
            ctx.beginPath();
            ctx.ellipse(px, py, ps, ps * 1.2, angle, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#090909';
            ctx.lineWidth = 1.2;
            ctx.stroke();

            if (this.level >= 2) {
                ctx.strokeStyle = accentCol;
                ctx.lineWidth = this.level === 3 ? 2.5 : 1.6;
                ctx.beginPath();
                ctx.ellipse(px, py, ps * 0.82, ps * 0.98, angle, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.beginPath();
            ctx.ellipse(px - side * ps * 0.22, py - ps * 0.22, ps * 0.38, ps * 0.28, angle - 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderHead(ctx, baseSize) {
        const hx = 0, hy = -baseSize * 1.38;
        const hs = baseSize * 0.7;
        const ac = this.armorColor;
        const accentCol = this.getAccentColor();

        ctx.fillStyle = this.darkenColor(ac, 0.1);
        ctx.beginPath();
        ctx.ellipse(hx, hy + hs * 0.75, hs * 0.42, hs * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        const hg = ctx.createRadialGradient(hx - hs * 0.25, hy - hs * 0.28, hs * 0.1, hx, hy, hs * 1.2);
        hg.addColorStop(0, this.lightenColor(ac, 0.25));
        hg.addColorStop(0.4, ac);
        hg.addColorStop(1, this.darkenColor(ac, 0.35));

        if (this.level === 1) {
            // Bascinet with nasal bar
            ctx.fillStyle = hg;
            ctx.beginPath();
            ctx.arc(hx, hy, hs, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#090909';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = '#0C0C0C';
            ctx.beginPath();
            ctx.arc(hx, hy + hs * 0.08, hs * 0.58, Math.PI * 0.08, Math.PI * 0.92);
            ctx.lineTo(hx, hy + hs * 0.08);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = accentCol;
            ctx.fillRect(hx - hs * 0.68, hy - hs * 0.04, hs * 1.36, hs * 0.1);

            ctx.fillStyle = '#4A9FFF';
            ctx.fillRect(hx - hs * 0.5,  hy + hs * 0.04, hs * 0.35, hs * 0.12);
            ctx.fillRect(hx + hs * 0.15, hy + hs * 0.04, hs * 0.35, hs * 0.12);
            ctx.fillStyle = 'rgba(74,159,255,0.22)';
            ctx.beginPath();
            ctx.arc(hx - hs * 0.325, hy + hs * 0.18, hs * 0.18, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(hx + hs * 0.325, hy + hs * 0.18, hs * 0.18, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = this.darkenColor(ac, 0.1);
            ctx.fillRect(hx - hs * 0.065, hy - hs * 0.04, hs * 0.13, hs * 0.52);
            ctx.strokeStyle = '#090909';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(hx - hs * 0.065, hy - hs * 0.04, hs * 0.13, hs * 0.52);

            ctx.fillStyle = this.lightenColor(ac, 0.08);
            ctx.fillRect(hx - hs * 0.72, hy + hs * 0.0, hs * 0.22, hs * 0.5);
            ctx.fillRect(hx + hs * 0.5,  hy + hs * 0.0, hs * 0.22, hs * 0.5);
            ctx.strokeStyle = '#090909';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(hx - hs * 0.72, hy + hs * 0.0, hs * 0.22, hs * 0.5);
            ctx.strokeRect(hx + hs * 0.5,  hy + hs * 0.0, hs * 0.22, hs * 0.5);

        } else if (this.level === 2) {
            // Armet with full-width visor slit and gold crest fin
            ctx.fillStyle = hg;
            ctx.beginPath();
            ctx.arc(hx, hy, hs, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#090909';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = this.darkenColor(ac, 0.1);
            ctx.beginPath();
            ctx.arc(hx, hy + hs * 0.1, hs, Math.PI * 0.08, Math.PI * 0.92);
            ctx.lineTo(hx, hy + hs * 0.1);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#090909';
            ctx.lineWidth = 1.2;
            ctx.stroke();

            ctx.fillStyle = '#4A9FFF';
            ctx.fillRect(hx - hs * 0.58, hy + hs * 0.06, hs * 1.16, hs * 0.13);
            ctx.fillStyle = 'rgba(74,159,255,0.2)';
            ctx.fillRect(hx - hs * 0.58, hy + hs * 0.06, hs * 1.16, hs * 0.28);

            ctx.fillStyle = accentCol;
            ctx.beginPath();
            ctx.moveTo(hx - hs * 0.065, hy - hs * 0.88);
            ctx.lineTo(hx + hs * 0.065, hy - hs * 0.88);
            ctx.lineTo(hx + hs * 0.04,  hy - hs * 1.28);
            ctx.lineTo(hx,               hy - hs * 1.42);
            ctx.lineTo(hx - hs * 0.04,  hy - hs * 1.28);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#090909';
            ctx.lineWidth = 0.8;
            ctx.stroke();

        } else {
            // Grand great helm with animated plume
            ctx.fillStyle = hg;
            ctx.beginPath();
            ctx.arc(hx, hy, hs * 1.04, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#090909';
            ctx.lineWidth = 1.8;
            ctx.stroke();

            ctx.fillStyle = this.darkenColor(ac, 0.12);
            ctx.beginPath();
            ctx.arc(hx, hy + hs * 0.1, hs * 1.02, Math.PI * 0.05, Math.PI * 0.95);
            ctx.lineTo(hx, hy + hs * 0.1);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#090909';
            ctx.lineWidth = 1.6;
            ctx.stroke();

            ctx.fillStyle = '#4A9FFF';
            ctx.fillRect(hx - hs * 0.7, hy + hs * 0.07, hs * 1.4, hs * 0.15);
            ctx.fillStyle = 'rgba(74,159,255,0.28)';
            ctx.fillRect(hx - hs * 0.7, hy + hs * 0.07, hs * 1.4, hs * 0.32);

            for (let i = 0; i < 5; i++) {
                ctx.fillStyle = '#0A0A0A';
                ctx.beginPath();
                ctx.ellipse(hx - hs * 0.3 + i * hs * 0.15, hy + hs * 0.5, hs * 0.04, hs * 0.07, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            const pt = Math.sin(this.animationTime * 2.5) * 0.06;
            ctx.fillStyle = '#CC0000';
            ctx.beginPath();
            ctx.moveTo(hx - hs * 0.1, hy - hs * 0.92);
            ctx.quadraticCurveTo(hx + hs * (0.5 + pt), hy - hs * 1.55, hx + hs * (0.28 + pt), hy - hs * 2.18);
            ctx.quadraticCurveTo(hx + hs * 0.1,          hy - hs * 1.8,  hx - hs * (0.1 + pt), hy - hs * 2.1);
            ctx.quadraticCurveTo(hx - hs * (0.4 + pt),   hy - hs * 1.5,  hx + hs * 0.08, hy - hs * 0.92);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#880000';
            ctx.lineWidth = 0.8;
            ctx.stroke();
        }
    }

    renderLeftArm(ctx, baseSize, swayAngle) {
        const sx = -baseSize * 0.76, sy = -baseSize * 0.32;
        const angle = -0.22 + swayAngle;
        const ex = sx + Math.cos(angle) * baseSize * 0.46;
        const ey = sy + Math.sin(angle) * baseSize * 0.46;
        const wa = angle - 0.3;
        const wx = ex + Math.cos(wa) * baseSize * 0.38;
        const wy = ey + Math.sin(wa) * baseSize * 0.38;

        const ag = ctx.createLinearGradient(sx - baseSize * 0.18, 0, sx + baseSize * 0.18, 0);
        ag.addColorStop(0,    this.darkenColor(this.armorColor, 0.3));
        ag.addColorStop(0.38, this.lightenColor(this.armorColor, 0.16));
        ag.addColorStop(1,    this.darkenColor(this.armorColor, 0.22));
        ctx.strokeStyle = ag;
        ctx.lineWidth = baseSize * 0.36;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        ctx.fillStyle = this.lightenColor(this.armorColor, 0.2);
        ctx.beginPath();
        ctx.arc(ex, ey, baseSize * 0.11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.strokeStyle = this.armorColor;
        ctx.lineWidth = baseSize * 0.28;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(wx, wy);
        ctx.stroke();

        ctx.fillStyle = this.darkenColor(this.armorColor, 0.08);
        ctx.beginPath();
        ctx.arc(wx, wy, baseSize * 0.17, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 0.9;
        ctx.stroke();

        this.renderShield(ctx, baseSize, wx, wy);
    }

    renderShield(ctx, baseSize, wx, wy) {
        const ac = this.getAccentColor();

        if (this.level === 1) {
            const r = baseSize * 0.4;
            const sx = wx - baseSize * 0.1, sy = wy + baseSize * 0.08;

            ctx.fillStyle = '#4A2808';
            ctx.beginPath();
            ctx.arc(sx, sy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = this.armorColor;
            ctx.lineWidth = baseSize * 0.1;
            ctx.beginPath();
            ctx.arc(sx, sy, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = this.lightenColor(this.armorColor, 0.15);
            ctx.beginPath();
            ctx.arc(sx, sy, r * 0.32, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#0a0a0a';
            ctx.lineWidth = 0.9;
            ctx.stroke();

        } else if (this.level === 2) {
            const sw = baseSize * 0.92, sh = baseSize * 1.18;
            const sx = wx - sw * 0.5, sy = wy - sh * 0.22;

            ctx.fillStyle = '#3A2010';
            ctx.beginPath();
            ctx.moveTo(sx + sw * 0.15, sy);
            ctx.lineTo(sx + sw * 0.85, sy);
            ctx.arcTo(sx + sw,         sy, sx + sw, sy + sh * 0.38, sw * 0.15);
            ctx.quadraticCurveTo(sx + sw, sy + sh * 0.82, sx + sw * 0.5, sy + sh);
            ctx.quadraticCurveTo(sx,      sy + sh * 0.82, sx, sy + sh * 0.38);
            ctx.arcTo(sx, sy, sx + sw * 0.15, sy, sw * 0.15);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#1A0A05';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.strokeStyle = ac;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(sx + sw * 0.2, sy + 2);
            ctx.lineTo(sx + sw * 0.8, sy + 2);
            ctx.arcTo(sx + sw - 2,    sy + 2, sx + sw - 2, sy + sh * 0.38, sw * 0.12);
            ctx.quadraticCurveTo(sx + sw - 2, sy + sh * 0.8, sx + sw * 0.5, sy + sh - 2);
            ctx.quadraticCurveTo(sx + 2,      sy + sh * 0.8, sx + 2, sy + sh * 0.38);
            ctx.arcTo(sx + 2, sy + 2, sx + sw * 0.2, sy + 2, sw * 0.12);
            ctx.closePath();
            ctx.stroke();

            ctx.strokeStyle = ac;
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(sx + sw * 0.5, sy + sh * 0.15);
            ctx.lineTo(sx + sw * 0.5, sy + sh * 0.72);
            ctx.moveTo(sx + sw * 0.18, sy + sh * 0.38);
            ctx.lineTo(sx + sw * 0.82, sy + sh * 0.38);
            ctx.stroke();

        } else {
            const sw = baseSize * 1.08, sh = baseSize * 1.45;
            const sx = wx - sw * 0.5, sy = wy - sh * 0.38;

            ctx.fillStyle = '#200A02';
            ctx.beginPath();
            ctx.moveTo(sx + sw * 0.1, sy);
            ctx.lineTo(sx + sw * 0.9, sy);
            ctx.arcTo(sx + sw, sy,    sx + sw, sy + sh * 0.12, sw * 0.1);
            ctx.lineTo(sx + sw, sy + sh);
            ctx.lineTo(sx,      sy + sh);
            ctx.arcTo(sx, sy,   sx + sw * 0.1, sy, sw * 0.1);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#100502';
            ctx.lineWidth = 1.2;
            ctx.stroke();

            ctx.strokeStyle = ac;
            ctx.lineWidth = 2.8;
            ctx.strokeRect(sx + 4, sy + 4, sw - 8, sh - 8);

            ctx.strokeStyle = this.lightenColor(ac, 0.15);
            ctx.lineWidth = 3.2;
            ctx.beginPath();
            ctx.moveTo(sx + sw * 0.5,  sy + sh * 0.1);
            ctx.lineTo(sx + sw * 0.5,  sy + sh * 0.9);
            ctx.moveTo(sx + sw * 0.12, sy + sh * 0.42);
            ctx.lineTo(sx + sw * 0.88, sy + sh * 0.42);
            ctx.stroke();
        }
    }

    renderRightArm(ctx, baseSize, swayAngle, isAttacking, attackTime) {
        const sx = baseSize * 0.76, sy = -baseSize * 0.32;
        let angle, ex, ey, wx, wy;

        if (isAttacking) {
            const p = Math.sin(Math.min(attackTime / 0.5, 1) * Math.PI);
            angle = 0.2 + p * 0.9;
            ex = sx + Math.cos(angle) * baseSize * 0.48;
            ey = sy + Math.sin(angle) * baseSize * 0.48;
            const wa = angle + 0.5 + p * 0.4;
            wx = ex + Math.cos(wa) * baseSize * 0.42;
            wy = ey + Math.sin(wa) * baseSize * 0.42;
        } else {
            angle = 0.2 + swayAngle;
            ex = sx + Math.cos(angle) * baseSize * 0.45;
            ey = sy + Math.sin(angle) * baseSize * 0.45;
            const wa = angle + 0.4;
            wx = ex + Math.cos(wa) * baseSize * 0.4;
            wy = ey + Math.sin(wa) * baseSize * 0.4;
        }

        const ag = ctx.createLinearGradient(sx - baseSize * 0.18, 0, sx + baseSize * 0.18, 0);
        ag.addColorStop(0,    this.darkenColor(this.armorColor, 0.3));
        ag.addColorStop(0.38, this.lightenColor(this.armorColor, 0.16));
        ag.addColorStop(1,    this.darkenColor(this.armorColor, 0.22));
        ctx.strokeStyle = ag;
        ctx.lineWidth = baseSize * 0.36;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        ctx.fillStyle = this.lightenColor(this.armorColor, 0.2);
        ctx.beginPath();
        ctx.arc(ex, ey, baseSize * 0.11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.strokeStyle = this.armorColor;
        ctx.lineWidth = baseSize * 0.28;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(wx, wy);
        ctx.stroke();

        ctx.fillStyle = this.darkenColor(this.armorColor, 0.08);
        ctx.beginPath();
        ctx.arc(wx, wy, baseSize * 0.19, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 0.9;
        ctx.stroke();

        this.renderSword(ctx, baseSize, wx, wy, angle, isAttacking);
    }

    renderSword(ctx, baseSize, wx, wy, armAngle, isAttacking) {
        const sa   = -Math.PI / 2 + (isAttacking ? 0.35 : 0.15) + armAngle * 0.38;
        const sl   = baseSize * (2.1 + (this.level - 1) * 0.52);
        const tx   = wx + Math.cos(sa) * sl;
        const ty   = wy + Math.sin(sa) * sl;
        const ac   = this.getAccentColor();
        const perp = sa + Math.PI / 2;
        const gw   = baseSize * (0.28 + (this.level - 1) * 0.1);

        ctx.strokeStyle = 'rgba(0,0,0,0.22)';
        ctx.lineWidth = baseSize * 0.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(wx + 1.5, wy + 1.5);
        ctx.lineTo(tx + 1.5, ty + 1.5);
        ctx.stroke();

        const gl = baseSize * 0.35;
        const gx = wx - Math.cos(sa) * gl, gy = wy - Math.sin(sa) * gl;
        ctx.strokeStyle = '#3A2008';
        ctx.lineWidth = baseSize * 0.11;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(gx, gy);
        ctx.stroke();

        for (let i = 1; i < 4; i++) {
            const bx = wx + (gx - wx) * i / 4;
            const by = wy + (gy - wy) * i / 4;
            ctx.strokeStyle = '#1A0A04';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(bx - Math.cos(perp) * baseSize * 0.06, by - Math.sin(perp) * baseSize * 0.06);
            ctx.lineTo(bx + Math.cos(perp) * baseSize * 0.06, by + Math.sin(perp) * baseSize * 0.06);
            ctx.stroke();
        }

        ctx.fillStyle = ac;
        ctx.beginPath();
        ctx.arc(gx, gy, baseSize * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.strokeStyle = ac;
        ctx.lineWidth = baseSize * 0.13;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(wx - Math.cos(perp) * gw, wy - Math.sin(perp) * gw);
        ctx.lineTo(wx + Math.cos(perp) * gw, wy + Math.sin(perp) * gw);
        ctx.stroke();

        if (this.level === 1) {
            const bg = ctx.createLinearGradient(wx, wy, tx, ty);
            bg.addColorStop(0, '#C8C8C8');
            bg.addColorStop(0.5, '#F0F0F0');
            bg.addColorStop(1, '#909090');
            ctx.strokeStyle = bg;
            ctx.lineWidth = baseSize * 0.2;
            ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(tx, ty); ctx.stroke();
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = baseSize * 0.05;
            ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(tx, ty); ctx.stroke();

        } else if (this.level === 2) {
            const bg = ctx.createLinearGradient(wx, wy, tx, ty);
            bg.addColorStop(0, '#6A8AB0');
            bg.addColorStop(0.5, '#9AB0C8');
            bg.addColorStop(1, '#486890');
            ctx.strokeStyle = bg;
            ctx.lineWidth = baseSize * 0.28;
            ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(tx, ty); ctx.stroke();
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = baseSize * 0.08;
            ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(tx, ty); ctx.stroke();

        } else {
            const bg = ctx.createLinearGradient(wx, wy, tx, ty);
            bg.addColorStop(0, '#FFD700');
            bg.addColorStop(0.3, '#FFFF90');
            bg.addColorStop(0.7, '#FFD700');
            bg.addColorStop(1, '#C08000');
            ctx.strokeStyle = bg;
            ctx.lineWidth = baseSize * 0.36;
            ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(tx, ty); ctx.stroke();
            ctx.strokeStyle = 'rgba(255,255,210,0.65)';
            ctx.lineWidth = baseSize * 0.1;
            ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(tx, ty); ctx.stroke();

            if (isAttacking) {
                ctx.strokeStyle = 'rgba(255,220,50,0.7)';
                ctx.lineWidth = baseSize * 0.07;
                const m1x = wx + (tx - wx) * 0.35, m1y = wy + (ty - wy) * 0.35;
                const m2x = wx + (tx - wx) * 0.65, m2y = wy + (ty - wy) * 0.65;
                ctx.beginPath();
                ctx.moveTo(m1x, m1y); ctx.lineTo(m1x - baseSize * 0.12, m1y); ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(m2x, m2y); ctx.lineTo(m2x + baseSize * 0.12, m2y); ctx.stroke();
            }
        }
    }
}
