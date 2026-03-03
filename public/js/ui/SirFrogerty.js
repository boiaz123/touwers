/**
 * SirFrogerty - The Frog Adviser
 * A Clippy-like frog character that appears at the bottom-left of the screen
 * to give the player advice at key moments in the game.
 */
export class SirFrogerty {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.visible = false;
        this.animationTime = 0;

        // Slide-in animation
        this.slideInProgress = 0;
        this.isSliding = false;

        // Page state
        this.currentPage = 0;

        // Button hover states
        this.prevButtonHovered  = false;
        this.nextButtonHovered  = false;
        this.closeButtonHovered = false;

        // Click debounce
        this._clickCooldown = 0;

        // Frog idle animation
        this.frogBobOffset = 0;
        this.blinkTimer    = 0;
        this.isBlinking    = false;
        this.blinkDuration = 0.12;
        this.nextBlinkTime = 1.5 + Math.random() * 3.5;

        // Dialogue pages
        this.pages = [
            {
                title: 'A Familiar Stranger Appears!',
                lines: [
                    'Hail, Commander! I am Sir Frogerty — erstwhile Chief',
                    'Adviser to His Most Amphibious Majesty, the Frog King!',
                    '',
                    'I hath deserted his most slimy army, for I found mine',
                    'wit and wisdom far too refined for the bog.',
                    'I am here to serve thee in thy noble campaign!',
                ]
            },
            {
                title: 'Welcome to Thy Settlement!',
                lines: [
                    'Welcome, Commander, to thine own settlement!',
                    'This humble gathering of buildings shall serve as thy',
                    'base of operations against the evils that lieth ahead.',
                    '',
                    'Tend to it well, for a prosperous settlement doth',
                    'forge the mightiest of Commanders!',
                ]
            },
            {
                title: 'The Training Grounds',
                lines: [
                    'Seest thou the Training Grounds to thine left?',
                    "'Tis there thou shalt embark upon thy campaigns!",
                    '',
                    'Click upon it to choose thy next battle and march',
                    'forth against the enemy horde. Each realm conquered',
                    'shall open new ones beyond — if thou survivest!',
                ]
            },
            {
                title: 'The Tower Forge',
                lines: [
                    'The Tower Forge doth allow thee to spend thy',
                    'hard-earned gold upon permanent upgrades for thy',
                    'towers and brave defenders.',
                    '',
                    'Invest thy gold wisely, Commander, for these',
                    'enhancements shall persist across ALL battles!',
                ]
            },
            {
                title: 'The Arcane Library',
                lines: [
                    'The Arcane Library holdeth knowledge most valuable —',
                    'intelligence upon thine enemies, musical entertainment',
                    'for thy weary troops, and sundry other mysteries.',
                    '',
                    'Peruse it at thy leisure, though heed mine warning:',
                    'the enemy doth not wait for the well-read Commander!',
                ]
            },
            {
                title: 'On the Gathering of Loot',
                lines: [
                    'Heed mine counsel well, Commander: as thou dost do',
                    'battle through the realms, thine enemies shall drop',
                    'precious loot upon their defeat.',
                    '',
                    'Gather it and visit the Marketplace to sell it for',
                    'gold, or use it to fuel thy mystical Arcane powers!',
                ]
            },
            {
                title: 'Onward to Glory!',
                lines: [
                    'And so, Commander, thy grand adventure doth begin!',
                    'I shall reappear should thou require mine absolutely',
                    'indispensable counsel once more.',
                    '',
                    'Fear not — for with Sir Frogerty at thy side, even',
                    'the darkest evils shall tremble before thee!',
                    '        ...Probably. *ribbits encouragingly*',
                ]
            }
        ];
    }

    // ─── Public API ──────────────────────────────────────────────────────────

    show() {
        this.visible         = true;
        this.currentPage     = 0;
        this.slideInProgress = 0;
        this.isSliding       = true;
        this.animationTime   = 0;
        this.prevButtonHovered  = false;
        this.nextButtonHovered  = false;
        this.closeButtonHovered = false;
        this._clickCooldown     = 0;
    }

    hide() {
        this.visible = false;
    }

    // ─── Update ──────────────────────────────────────────────────────────────

    update(deltaTime) {
        if (!this.visible) return;

        this.animationTime += deltaTime;

        if (this._clickCooldown > 0) this._clickCooldown -= deltaTime;

        if (this.isSliding && this.slideInProgress < 1) {
            this.slideInProgress = Math.min(1, this.slideInProgress + deltaTime * 2.8);
            if (this.slideInProgress >= 1) this.isSliding = false;
        }

        this.frogBobOffset = Math.sin(this.animationTime * 2.2) * 5;

        this.blinkTimer += deltaTime;
        if (!this.isBlinking && this.blinkTimer >= this.nextBlinkTime) {
            this.isBlinking    = true;
            this.blinkTimer    = 0;
            this.nextBlinkTime = this.blinkDuration;
        } else if (this.isBlinking && this.blinkTimer >= this.blinkDuration) {
            this.isBlinking    = false;
            this.blinkTimer    = 0;
            this.nextBlinkTime = 1.5 + Math.random() * 3.5;
        }
    }

    // ─── Input ───────────────────────────────────────────────────────────────

    handleMouseMove(x, y, canvas) {
        if (!this.visible) return false;
        const layout = this._getLayout(canvas);
        const btns   = this._getButtonBounds(layout);

        this.prevButtonHovered  = (this.currentPage > 0) && this._hit(x, y, btns.prev);
        this.nextButtonHovered  = this._hit(x, y, btns.next);
        this.closeButtonHovered = this._hit(x, y, btns.close);

        return this._inPanel(x, y, layout);
    }

    handleClick(x, y, canvas) {
        if (!this.visible) return false;
        const layout = this._getLayout(canvas);
        if (!this._inPanel(x, y, layout)) return false;

        // Ignore clicks during cooldown to prevent double registration
        if (this._clickCooldown > 0) return true;
        this._clickCooldown = 0.4;

        const btns = this._getButtonBounds(layout);

        if (this._hit(x, y, btns.close)) {
            this.hide();
            return true;
        }

        if (this.currentPage > 0 && this._hit(x, y, btns.prev)) {
            this.currentPage--;
            return true;
        }

        if (this._hit(x, y, btns.next)) {
            if (this.currentPage < this.pages.length - 1) {
                this.currentPage++;
            } else {
                this.hide();
            }
            return true;
        }

        return true;
    }

    // ─── Layout helpers ──────────────────────────────────────────────────────

    _easeOut(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    _getLayout(canvas) {
        const W       = canvas.width;
        const H       = canvas.height;
        const totalW  = Math.min(820, W - 40);
        const totalH  = 300;
        const frogW   = 200;
        const scrollW = totalW - frogW;
        const margin  = 20;
        const onY     = H - totalH - 20;
        const offY    = H + 20;
        const easedY  = offY + (onY - offY) * this._easeOut(this.slideInProgress);

        return {
            x: margin,
            y: easedY,
            totalW, totalH, frogW,
            scrollX: margin + frogW,
            scrollW
        };
    }

    _getButtonBounds(layout) {
        const { scrollX, scrollW, y, totalH } = layout;
        const btnH   = 36;
        const btnW   = 112;
        const btnY   = y + totalH - btnH - 14;
        const closeR = 16;
        const closeX = scrollX + scrollW - closeR * 2 - 12;
        const closeY = y + 12;
        return {
            prev:  { x: scrollX + 18,                  y: btnY,   w: btnW,       h: btnH },
            next:  { x: scrollX + scrollW - btnW - 18, y: btnY,   w: btnW,       h: btnH },
            close: { x: closeX,                         y: closeY, w: closeR * 2, h: closeR * 2 }
        };
    }

    _hit(px, py, rect) {
        return px >= rect.x && px <= rect.x + rect.w &&
               py >= rect.y && py <= rect.y + rect.h;
    }

    _inPanel(px, py, layout) {
        return px >= layout.x && px <= layout.x + layout.totalW &&
               py >= layout.y && py <= layout.y + layout.totalH;
    }

    // ─── Render ──────────────────────────────────────────────────────────────

    render(ctx, canvas) {
        if (!this.visible) return;

        const layout = this._getLayout(canvas);
        const { x, y, totalW, totalH, frogW, scrollX, scrollW } = layout;

        ctx.save();

        this._drawScroll(ctx, scrollX, y, scrollW, totalH);
        this._drawTextContent(ctx, scrollX, y, scrollW, totalH);
        this._drawButtons(ctx, layout);

        const frogCX = x + frogW / 2;
        const frogCY = y + totalH * 0.72 + this.frogBobOffset;
        this._drawFrog(ctx, frogCX, frogCY, 95);

        ctx.restore();
    }

    // ─── Parchment scroll ────────────────────────────────────────────────────

    _drawScroll(ctx, x, y, w, h) {
        ctx.save();

        ctx.shadowColor   = 'rgba(0,0,0,0.55)';
        ctx.shadowBlur    = 22;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 8;

        const r = 14;
        this._roundRect(ctx, x, y, w, h, r);

        const grad = ctx.createLinearGradient(x, y, x + w, y + h);
        grad.addColorStop(0,    '#f8edce');
        grad.addColorStop(0.35, '#f2dfa8');
        grad.addColorStop(0.7,  '#edd598');
        grad.addColorStop(1,    '#e4c882');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.shadowColor   = 'transparent';
        ctx.shadowBlur    = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.strokeStyle = '#7a4a10';
        ctx.lineWidth   = 2.5;
        ctx.stroke();

        const ins = 9;
        ctx.strokeStyle = 'rgba(120,70,20,0.35)';
        ctx.lineWidth   = 1;
        this._roundRect(ctx, x + ins, y + ins, w - ins * 2, h - ins * 2, r - 4);
        ctx.stroke();

        ctx.save();
        ctx.globalAlpha = 0.055;
        ctx.fillStyle   = '#7a4a00';
        ctx.beginPath(); ctx.ellipse(x + 60,      y + 40,      30, 18,  0.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + w - 80,  y + h - 50,  25, 14, -0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + w * 0.5, y + h * 0.6, 40, 20,  0.1, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        this._drawCornerOrnament(ctx, x + 20,     y + 20);
        this._drawCornerOrnament(ctx, x + w - 20, y + 20);
        this._drawCornerOrnament(ctx, x + 20,     y + h - 20);
        this._drawCornerOrnament(ctx, x + w - 20, y + h - 20);

        ctx.restore();
    }

    _drawCornerOrnament(ctx, cx, cy) {
        ctx.save();
        ctx.strokeStyle = 'rgba(120,70,20,0.5)';
        ctx.lineWidth   = 1.5;
        const r = 5;
        ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
    }

    // ─── Text content ────────────────────────────────────────────────────────

    _drawTextContent(ctx, x, y, w, h) {
        const page = this.pages[this.currentPage];
        ctx.save();

        ctx.font         = 'bold 19px Georgia, serif';
        ctx.fillStyle    = '#3a1000';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'top';
        const titleX = x + w / 2;
        const titleY = y + 20;
        ctx.fillText(page.title, titleX, titleY);

        ctx.strokeStyle = '#7a4a10';
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 28,     titleY + 26);
        ctx.lineTo(x + w - 28, titleY + 26);
        ctx.stroke();

        ctx.font         = '15px Georgia, serif';
        ctx.fillStyle    = '#2e0e00';
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'top';
        const textX = x + 28;
        let   textY = titleY + 40;
        const lineH = 21;
        page.lines.forEach(line => {
            if (line === '') {
                textY += lineH * 0.45;
            } else {
                ctx.fillText(line, textX, textY);
                textY += lineH;
            }
        });

        ctx.font         = '13px Georgia, serif';
        ctx.fillStyle    = '#8a6030';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(
            `~ Page ${this.currentPage + 1} of ${this.pages.length} ~`,
            x + w / 2,
            y + h - 58
        );

        ctx.restore();
    }

    // ─── Navigation buttons ──────────────────────────────────────────────────

    _drawButtons(ctx, layout) {
        const btns = this._getButtonBounds(layout);

        if (this.currentPage > 0) {
            this._drawNavButton(ctx, btns.prev, '◄  Back', this.prevButtonHovered);
        }

        const nextLabel = this.currentPage === this.pages.length - 1 ? 'Close  ✕' : 'Next  ►';
        this._drawNavButton(ctx, btns.next, nextLabel, this.nextButtonHovered);

        this._drawCloseButton(ctx, btns.close, this.closeButtonHovered);
    }

    _drawNavButton(ctx, rect, label, hovered) {
        ctx.save();
        const { x, y, w, h } = rect;
        const r = 7;

        ctx.shadowColor   = 'rgba(0,0,0,0.45)';
        ctx.shadowBlur    = 9;
        ctx.shadowOffsetY = 3;
        this._roundRect(ctx, x, y, w, h, r);
        ctx.fillStyle = hovered ? '#7b4410' : '#4a2500';
        ctx.fill();

        ctx.shadowColor   = 'transparent';
        ctx.shadowBlur    = 0;
        ctx.shadowOffsetY = 0;
        ctx.strokeStyle   = hovered ? '#d08828' : '#8b5a20';
        ctx.lineWidth     = 1.8;
        ctx.stroke();

        ctx.save();
        ctx.globalAlpha = hovered ? 0.15 : 0.10;
        this._roundRect(ctx, x + 2, y + 2, w - 4, h / 2 - 2, r - 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();

        ctx.font         = 'bold 14px Georgia, serif';
        ctx.fillStyle    = hovered ? '#ffe090' : '#f0c060';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + w / 2, y + h / 2);

        ctx.restore();
    }

    _drawCloseButton(ctx, rect, hovered) {
        ctx.save();
        const { x, y, w, h } = rect;
        const cx = x + w / 2;
        const cy = y + h / 2;
        const r  = Math.min(w, h) / 2;

        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur  = 7;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = hovered ? '#9b1a1a' : '#5a1010';
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur  = 0;
        ctx.strokeStyle = hovered ? '#ff7070' : '#b04040';
        ctx.lineWidth   = 2;
        ctx.stroke();

        ctx.font         = 'bold 17px Arial, sans-serif';
        ctx.fillStyle    = hovered ? '#ffbbbb' : '#ffdddd';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✕', cx, cy + 0.5);

        ctx.restore();
    }

    // ─── Frog character ──────────────────────────────────────────────────────
    //
    // Origin at (cx, cy). All coordinates scaled by s = scale/90.
    //
    // Vertical landmarks (×s):
    //   +66  : feet bottom
    //   +22  : body centre
    //    0   : frog origin
    //   -34  : head centre  (semi-height 31 → top = -65)
    //   -50  : eye centre
    //
    // Hat: _drawAdviserHat translates context to (cx, tipY+32s).
    //   Brim drawn at local y=+30s → absolute y = tipY+62s.
    //   Want brim at -60s  →  tipY = -122s  (hat tip at -138s)

    _drawFrog(ctx, cx, cy, scale) {
        ctx.save();
        ctx.translate(cx, cy);
        const s = scale / 90;

        // Ground shadow
        ctx.save();
        ctx.shadowColor   = 'rgba(0,0,0,0.28)';
        ctx.shadowBlur    = 18;
        ctx.shadowOffsetY = 6;
        ctx.beginPath();
        ctx.ellipse(0, 56 * s, 52 * s, 13 * s, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fill();
        ctx.restore();

        // Body
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.25)';
        ctx.shadowBlur  = 10;
        ctx.beginPath();
        ctx.ellipse(0, 22 * s, 44 * s, 52 * s, 0, 0, Math.PI * 2);
        const bodyGrad = ctx.createRadialGradient(-12 * s, -4 * s, 4 * s, 0, 22 * s, 52 * s);
        bodyGrad.addColorStop(0,   '#82d162');
        bodyGrad.addColorStop(0.5, '#55aa30');
        bodyGrad.addColorStop(1,   '#2d6e10');
        ctx.fillStyle   = bodyGrad;
        ctx.fill();
        ctx.strokeStyle = '#1e4e0a';
        ctx.lineWidth   = 2.2 * s;
        ctx.stroke();
        ctx.restore();

        // Belly
        ctx.beginPath();
        ctx.ellipse(0, 30 * s, 29 * s, 36 * s, 0, 0, Math.PI * 2);
        const bellyGrad = ctx.createRadialGradient(0, 18 * s, 4 * s, 0, 30 * s, 36 * s);
        bellyGrad.addColorStop(0, '#eef8d8');
        bellyGrad.addColorStop(1, '#c5e298');
        ctx.fillStyle = bellyGrad;
        ctx.fill();

        // Head
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.18)';
        ctx.shadowBlur  = 8;
        ctx.beginPath();
        ctx.ellipse(0, -34 * s, 40 * s, 31 * s, 0, 0, Math.PI * 2);
        const headGrad = ctx.createRadialGradient(-10 * s, -42 * s, 3 * s, 0, -34 * s, 40 * s);
        headGrad.addColorStop(0,    '#8cdc60');
        headGrad.addColorStop(0.55, '#55aa30');
        headGrad.addColorStop(1,    '#2d6e10');
        ctx.fillStyle   = headGrad;
        ctx.fill();
        ctx.strokeStyle = '#1e4e0a';
        ctx.lineWidth   = 2 * s;
        ctx.stroke();
        ctx.restore();

        // Hat drawn BEFORE eyes so eyes appear in front
        // brimY = -56*s  (brim sits 9 units below head top at -65s)
        this._drawAdviserHat(ctx, 0, -56 * s, s);

        // Googly eyes
        const eyeY  = -50 * s;
        const eyeOX = 19 * s;
        [-1, 1].forEach(side => {
            const ex = side * eyeOX;

            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.22)';
            ctx.shadowBlur  = 6;
            ctx.beginPath();
            ctx.arc(ex, eyeY, 15 * s, 0, Math.PI * 2);
            ctx.fillStyle   = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = '#1e4e0a';
            ctx.lineWidth   = 1.5 * s;
            ctx.stroke();
            ctx.restore();

            if (this.isBlinking) {
                ctx.beginPath();
                ctx.moveTo(ex - 11 * s, eyeY);
                ctx.quadraticCurveTo(ex, eyeY + 7 * s, ex + 11 * s, eyeY);
                ctx.strokeStyle = '#2a5a10';
                ctx.lineWidth   = 3 * s;
                ctx.stroke();
            } else {
                const pOX = side * 3.5 * s;
                ctx.beginPath();
                ctx.arc(ex + pOX, eyeY + 2 * s, 9 * s, 0, Math.PI * 2);
                ctx.fillStyle = '#df9818';
                ctx.fill();

                ctx.beginPath();
                ctx.ellipse(ex + pOX, eyeY + 2 * s, 3 * s, 8 * s, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#1a0800';
                ctx.fill();

                ctx.beginPath();
                ctx.arc(ex + pOX - 2.5 * s, eyeY - 2.5 * s, 2.5 * s, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,0.85)';
                ctx.fill();
            }
        });

        // Nostrils
        ctx.fillStyle = '#1e4e0a';
        [-1, 1].forEach(side => {
            ctx.beginPath();
            ctx.ellipse(side * 11 * s, -28 * s, 2.5 * s, 2 * s, 0.3 * side, 0, Math.PI * 2);
            ctx.fill();
        });

        // Wide grin
        ctx.beginPath();
        ctx.moveTo(-30 * s, -20 * s);
        ctx.bezierCurveTo(-20 * s, -2 * s, 20 * s, -2 * s, 30 * s, -20 * s);
        ctx.strokeStyle = '#145008';
        ctx.lineWidth   = 2.8 * s;
        ctx.stroke();

        // Aristocratic moustache — white, bold
        ctx.save();
        // Dark shadow pass for depth
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth   = 8 * s;
        ctx.lineCap     = 'round';
        ctx.beginPath();
        ctx.moveTo(-2 * s, -19 * s);
        ctx.bezierCurveTo(-8 * s, -13 * s, -22 * s, -11 * s, -33 * s, -17 * s);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(2 * s, -19 * s);
        ctx.bezierCurveTo(8 * s, -13 * s, 22 * s, -11 * s, 33 * s, -17 * s);
        ctx.stroke();
        // White main pass
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth   = 6 * s;
        ctx.beginPath();
        ctx.moveTo(-2 * s, -19 * s);
        ctx.bezierCurveTo(-8 * s, -13 * s, -22 * s, -11 * s, -33 * s, -17 * s);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(2 * s, -19 * s);
        ctx.bezierCurveTo(8 * s, -13 * s, 22 * s, -11 * s, 33 * s, -17 * s);
        ctx.stroke();
        // Curled tips
        ctx.lineWidth = 4.5 * s;
        ctx.beginPath();
        ctx.moveTo(-33 * s, -17 * s);
        ctx.quadraticCurveTo(-37 * s, -12 * s, -33 * s, -8 * s);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(33 * s, -17 * s);
        ctx.quadraticCurveTo(37 * s, -12 * s, 33 * s, -8 * s);
        ctx.stroke();
        ctx.restore();

        // Left arm
        ctx.save();
        ctx.strokeStyle = '#2d6e10';
        ctx.lineWidth   = 6.5 * s;
        ctx.lineCap     = 'round';
        ctx.beginPath();
        ctx.moveTo(-40 * s, 6 * s);
        ctx.quadraticCurveTo(-64 * s, 22 * s, -62 * s, 38 * s);
        ctx.stroke();
        ctx.restore();

        // Left hand
        ctx.beginPath();
        ctx.arc(-60 * s, 40 * s, 8 * s, 0, Math.PI * 2);
        ctx.fillStyle   = '#55aa30';
        ctx.fill();
        ctx.strokeStyle = '#1e4e0a';
        ctx.lineWidth   = 1.5 * s;
        ctx.stroke();

        // Magical staff (pivoted at left hand centre)
        ctx.save();
        ctx.translate(-60 * s, 40 * s);
        ctx.rotate(-0.5);
        ctx.fillStyle = '#5c3d1f';
        ctx.fillRect(-2.5 * s, -32 * s, 5 * s, 38 * s);
        ctx.strokeStyle = '#3a2410';
        ctx.lineWidth   = 0.8 * s;
        ctx.strokeRect(-2.5 * s, -32 * s, 5 * s, 38 * s);
        ctx.beginPath();
        ctx.ellipse(0, -32 * s, 5.5 * s, 2.5 * s, 0, 0, Math.PI * 2);
        ctx.fillStyle   = '#d4a620';
        ctx.fill();
        ctx.strokeStyle = '#804410';
        ctx.lineWidth   = 1 * s;
        ctx.stroke();
        const orbGlow = ctx.createRadialGradient(0, -40 * s, 2 * s, 0, -40 * s, 10 * s);
        orbGlow.addColorStop(0,   'rgba(255,200,50,0.8)');
        orbGlow.addColorStop(0.5, 'rgba(255,130,30,0.4)');
        orbGlow.addColorStop(1,   'rgba(255,100,0,0)');
        ctx.fillStyle = orbGlow;
        ctx.beginPath();
        ctx.arc(0, -40 * s, 10 * s, 0, Math.PI * 2);
        ctx.fill();
        const orbGrad = ctx.createRadialGradient(-2 * s, -43 * s, 2 * s, 0, -40 * s, 7 * s);
        orbGrad.addColorStop(0,   '#ffff88');
        orbGrad.addColorStop(0.4, '#ff9900');
        orbGrad.addColorStop(1,   '#cc5500');
        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(0, -40 * s, 7 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-2.5 * s, -43 * s, 2.5 * s, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,200,0.6)';
        ctx.fill();
        ctx.fillStyle = '#ffff99';
        [
            { x:  9 * s, y: -40 * s, r: 1.3 * s },
            { x: -9 * s, y: -40 * s, r: 1.3 * s },
            { x:  0,     y: -50 * s, r: 1.1 * s },
            { x:  5 * s, y: -33 * s, r: 1.0 * s },
            { x: -5 * s, y: -33 * s, r: 1.0 * s },
        ].forEach(sp => {
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();

        // Right arm (raised, pointing)
        ctx.save();
        ctx.strokeStyle = '#2d6e10';
        ctx.lineWidth   = 6.5 * s;
        ctx.lineCap     = 'round';
        ctx.beginPath();
        ctx.moveTo(40 * s, 6 * s);
        ctx.quadraticCurveTo(66 * s, -8 * s, 62 * s, -28 * s);
        ctx.stroke();
        ctx.restore();

        ctx.beginPath();
        ctx.arc(62 * s, -30 * s, 8 * s, 0, Math.PI * 2);
        ctx.fillStyle   = '#55aa30';
        ctx.fill();
        ctx.strokeStyle = '#1e4e0a';
        ctx.lineWidth   = 1.5 * s;
        ctx.stroke();

        ctx.save();
        ctx.strokeStyle = '#44881e';
        ctx.lineWidth   = 4.2 * s;
        ctx.lineCap     = 'round';
        ctx.beginPath();
        ctx.moveTo(62 * s, -30 * s);
        ctx.lineTo(68 * s, -42 * s);
        ctx.stroke();
        ctx.restore();

        // Legs
        [-1, 1].forEach(side => {
            ctx.save();
            ctx.strokeStyle = '#2d6e10';
            ctx.lineWidth   = 7.5 * s;
            ctx.lineCap     = 'round';
            ctx.beginPath();
            ctx.moveTo(side * 26 * s, 66 * s);
            ctx.quadraticCurveTo(side * 48 * s, 76 * s, side * 52 * s, 68 * s);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(side * 54 * s, 65 * s, 13 * s, 7.5 * s, side * 0.3, 0, Math.PI * 2);
            ctx.fillStyle   = '#469020';
            ctx.fill();
            ctx.strokeStyle = '#1e4e0a';
            ctx.lineWidth   = 1.5 * s;
            ctx.stroke();
            ctx.restore();
        });

        ctx.restore();
    }

    // ─── Adviser's hat ───────────────────────────────────────────────────────
    //
    // Hat sits on the head. Head centre=(0,-34s), semi-axes 40s×31s, top=-65s.
    // _drawAdviserHat translates to (cx, tipY+brimHalfH) then draws:
    //   brim at local y=0 (absolute = tipY + brimHalfH)
    //   cone tip at local y=-78s
    //
    // We want the brim to sit at y=-56s (firmly inside head top at -65s).
    //   → tipY = -56s - brimHalfH = -56s - 11s = -67s
    // Call: this._drawAdviserHat(ctx, 0, -67 * s, s)

    _drawAdviserHat(ctx, cx, brimY, s) {
        ctx.save();
        ctx.translate(cx, brimY);
        // Very slight lean for character — kept minimal so hat reads as
        // naturally centred on the head.
        ctx.rotate(-0.08);

        const brimRx = 36 * s;  // wider than head so brim wraps
        const brimRy = 11 * s;  // foreshortening gives perspective depth
        const coneH  = 78 * s;  // cone tip is this far above brim centre

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur  = 10;

        // ── Back half of brim (drawn first, behind cone) ──
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(0, 0, brimRx, brimRy, 0, Math.PI, Math.PI * 2);
        const brimBackGrad = ctx.createLinearGradient(0, -brimRy, 0, 0);
        brimBackGrad.addColorStop(0, '#300090');
        brimBackGrad.addColorStop(1, '#0e0030');
        ctx.fillStyle   = brimBackGrad;
        ctx.fill();
        ctx.strokeStyle = '#5535bb';
        ctx.lineWidth   = 1.5 * s;
        ctx.stroke();
        ctx.restore();

        // ── Cone (drawn over back brim) ──
        // Use bezier sides that curve outward slightly for a 3-D feel.
        ctx.beginPath();
        ctx.moveTo(0, -coneH);
        ctx.bezierCurveTo( 10 * s, -coneH * 0.5,  brimRx * 0.9,  -brimRy * 0.4,  brimRx,  0);
        ctx.bezierCurveTo( brimRx * 0.3, brimRy * 0.2, -brimRx * 0.3, brimRy * 0.2, -brimRx, 0);
        ctx.bezierCurveTo(-brimRx * 0.9, -brimRy * 0.4, -10 * s, -coneH * 0.5, 0, -coneH);
        ctx.closePath();
        const hatGrad = ctx.createLinearGradient(-brimRx, 0, brimRx * 0.4, -coneH);
        hatGrad.addColorStop(0,   '#0e0030');
        hatGrad.addColorStop(0.4, '#220075');
        hatGrad.addColorStop(1,   '#4520a0');
        ctx.fillStyle   = hatGrad;
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur  = 0;
        ctx.strokeStyle = '#5535bb';
        ctx.lineWidth   = 1.5 * s;
        ctx.stroke();

        ctx.restore();

        // ── Front half of brim (drawn over cone base) ──
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(0, 0, brimRx, brimRy, 0, 0, Math.PI);
        const brimFrontGrad = ctx.createLinearGradient(0, 0, 0, brimRy * 2);
        brimFrontGrad.addColorStop(0,   '#320095');
        brimFrontGrad.addColorStop(0.6, '#200070');
        brimFrontGrad.addColorStop(1,   '#0e0030');
        ctx.fillStyle   = brimFrontGrad;
        ctx.fill();
        ctx.strokeStyle = '#5535bb';
        ctx.lineWidth   = 1.5 * s;
        ctx.stroke();
        ctx.restore();

        // ── Gold band just above brim ──
        ctx.beginPath();
        ctx.ellipse(0, -3 * s, brimRx * 0.78, brimRy * 0.75, 0, 0, Math.PI * 2);
        ctx.strokeStyle = '#e8c020';
        ctx.lineWidth   = 3.5 * s;
        ctx.stroke();

        // ── Stars on cone ──
        [
            { x: -4  * s, y: -42 * s, r: 5.5 * s },
            { x:  10 * s, y: -20 * s, r: 4.5 * s },
            { x: -12 * s, y: -12 * s, r: 3.5 * s },
        ].forEach(sp => this._drawStar(ctx, sp.x, sp.y, sp.r, '#f8d420'));

        // ── Jewel at band centre ──
        ctx.beginPath();
        ctx.arc(0, -3 * s, 5 * s, 0, Math.PI * 2);
        ctx.fillStyle   = '#cc2244';
        ctx.fill();
        ctx.strokeStyle = '#ff6688';
        ctx.lineWidth   = 1 * s;
        ctx.stroke();

        ctx.restore();
    }

    _drawStar(ctx, cx, cy, r, color) {
        ctx.save();
        ctx.fillStyle   = color;
        ctx.shadowColor = 'rgba(255,220,0,0.5)';
        ctx.shadowBlur  = 4;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const outer = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const inner = ((i * 4 + 2) * Math.PI) / 5 - Math.PI / 2;
            if (i === 0) ctx.moveTo(cx + r * Math.cos(outer), cy + r * Math.sin(outer));
            else         ctx.lineTo(cx + r * Math.cos(outer), cy + r * Math.sin(outer));
            ctx.lineTo(cx + r * 0.4 * Math.cos(inner), cy + r * 0.4 * Math.sin(inner));
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // ─── Canvas utility ──────────────────────────────────────────────────────

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x,     y + h, x,     y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x,     y,     x + r, y);
        ctx.closePath();
    }
}
