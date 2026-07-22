/**
 * AchievementPanel — standalone popup listing achievements, with a per-achievement
 * detail view (full description + progress). Unlike the Arcane Library (which bundles
 * Statistics/Achievements/Enemy Intel behind tabs), this is its own self-contained
 * window so it can be opened directly from anywhere an achievement banner can appear
 * (Settlement Hub, campaign maps, etc.) without dragging the whole Library along.
 *
 * `host` just needs to implement closePopup() — whichever screen owns this popup
 * instance (SettlementHub, CampaignBase, ...) clears its own activePopup flag there.
 *
 * Usage:
 *   this.achievementPanel = new AchievementPanel(stateManager, host);
 *   this.achievementPanel.open();                    // or open('some-achievement-id')
 *   this.achievementPanel.update(deltaTime);          // each frame while open
 *   this.achievementPanel.render(ctx);                // each frame while open
 *   this.achievementPanel.updateHoverState(x, y);     // on mousemove
 *   this.achievementPanel.handleClick(x, y);          // on click
 */

const CAT_COLORS = {
    combat:      '#8b1a1a',
    victory:     '#8b6914',
    resilience:  '#5a2a8b',
    builder:     '#1a6b3a',
    spending:    '#1a3a8b',
    trading:     '#1a6b5a',
    alchemy:     '#8b4a1a',
    loot:        '#5a1a8b',
    campaign:    '#4a4a5a',
    playtime:    '#2a3a6b',
    superweapon: '#7a1a8b',
};
// Tier ladder — the badge ring/glow upgrades through these ranks as an achievement's
// position within its category climbs, so e.g. "slay 100,000 enemies" reads as a
// visibly grander emblem than "slay your first enemy" even though both share an icon.
const TIER_STYLES = [
    { ring: '#a9694a', glow: 'rgba(169, 105, 74, 0.55)',  inner: '#7a4a30' }, // Bronze
    { ring: '#b9c0c6', glow: 'rgba(185, 192, 198, 0.55)', inner: '#7c8389' }, // Silver
    { ring: '#d4af37', glow: 'rgba(212, 175, 55, 0.6)',   inner: '#6b4018' }, // Gold
    { ring: '#7fd8c4', glow: 'rgba(127, 216, 196, 0.6)',  inner: '#1f5a4d' }, // Platinum
    { ring: '#7fdfff', glow: 'rgba(127, 223, 255, 0.65)', inner: '#155a6b' }, // Diamond
    { ring: '#c77dff', glow: 'rgba(199, 125, 255, 0.7)',  inner: '#4a1f6b' }  // Mythic
];

export class AchievementPanel {
    constructor(stateManager, host) {
        this.stateManager = stateManager;
        this.host = host;
        this.isOpen = false;
        this.animationProgress = 0;
        this.openTime = 0; // prevents click-through the instant it opens

        this.achievementCurrentPage = 0;
        // Set to an achievement id to show its full detail view instead of the grid.
        this.selectedAchievementId = null;

        this.closeButtonHovered = false;
        this.leftArrowHovered   = false;
        this.rightArrowHovered  = false;
        this.backButtonHovered  = false;
        this.hoveredCardId      = null;
    }

    /** @param {string} [focusAchievementId] - jump straight to this achievement's detail view */
    open(focusAchievementId = null) {
        this.isOpen = true;
        this.animationProgress = 0;
        this.openTime = Date.now();
        this.achievementCurrentPage = 0;
        this.selectedAchievementId = null;

        if (focusAchievementId) {
            this.selectedAchievementId = focusAchievementId;
            const achievementSystem = this.stateManager.achievementSystem;
            if (achievementSystem) {
                const list = achievementSystem.getAchievements(
                    this.stateManager.gameStatistics, this.stateManager.currentSaveData);
                const idx = list.findIndex(a => a.id === focusAchievementId);
                if (idx >= 0) this.achievementCurrentPage = Math.floor(idx / 8);
            }
        }
    }

    close() {
        this.isOpen = false;
        this.host.closePopup();
    }

    update(deltaTime) {
        if (this.isOpen && this.animationProgress < 1) {
            this.animationProgress += deltaTime * 2;
        }
    }

    _menuDimensions() {
        const canvas = this.stateManager.canvas;
        const menuWidth  = Math.min(Math.round(canvas.width  * 0.70), 1100);
        const menuHeight = Math.min(Math.round(canvas.height * 0.75), 700);
        const menuX = Math.round(canvas.width  / 2 - menuWidth  / 2);
        const menuY = Math.round(canvas.height / 2 - menuHeight / 2);
        return { menuX, menuY, menuWidth, menuHeight };
    }

    // Shared geometry — used by render(), updateHoverState() and handleClick() so
    // hitboxes always match what's drawn, regardless of uiSf scale.
    _getLayout(menuX, menuY, menuWidth, menuHeight) {
        const uiSf   = menuWidth / 800; // internal scale factor relative to base 800px popup
        const titleH = Math.round(60 * uiSf);
        const pad    = Math.round(20 * uiSf);
        const contentX = menuX + pad;
        const contentY = menuY + titleH + pad;
        const contentWidth  = menuWidth - pad * 2;
        const contentHeight = menuHeight - titleH - pad - Math.round(20 * uiSf);
        const closeButtonSize = Math.round(28 * uiSf);
        const closeButtonX = menuX + menuWidth - closeButtonSize - Math.round(8 * uiSf);
        const closeButtonY = menuY + Math.round(8 * uiSf);
        return { uiSf, contentX, contentY, contentWidth, contentHeight, closeButtonSize, closeButtonX, closeButtonY };
    }

    // The header (score summary bars) sits above the grid/detail body. This is the
    // ONE place its height is computed, so render() and the click/hover handlers
    // below can never disagree about where the body starts — that mismatch was the
    // root cause of a previous bug where the detail view's Back button didn't respond.
    _getHeaderHeight(uiSf) {
        const rowH   = Math.round(34 * uiSf);
        const rowGap = Math.round(4 * uiSf);
        return rowH * 2 + rowGap;
    }

    _getBodyRect(contentX, contentY, contentWidth, contentHeight, uiSf) {
        const headerH = this._getHeaderHeight(uiSf);
        const gap = Math.round(6 * uiSf);
        return { x: contentX, y: contentY + headerH + gap, width: contentWidth, height: contentHeight - headerH - gap };
    }

    _getAchievements() {
        const achievementSystem = this.stateManager.achievementSystem;
        return achievementSystem
            ? achievementSystem.getAchievements(this.stateManager.gameStatistics, this.stateManager.currentSaveData)
            : [];
    }

    // ── Input handling ────────────────────────────────────────────────────────

    updateHoverState(x, y) {
        const { menuX, menuY, menuWidth, menuHeight } = this._menuDimensions();
        const { uiSf, contentX, contentY, contentWidth, contentHeight, closeButtonSize, closeButtonX, closeButtonY } =
            this._getLayout(menuX, menuY, menuWidth, menuHeight);

        this.closeButtonHovered = x >= closeButtonX && x <= closeButtonX + closeButtonSize &&
                                  y >= closeButtonY && y <= closeButtonY + closeButtonSize;

        this.leftArrowHovered  = false;
        this.rightArrowHovered = false;
        this.backButtonHovered = false;
        this.hoveredCardId     = null;

        const body = this._getBodyRect(contentX, contentY, contentWidth, contentHeight, uiSf);

        if (this.selectedAchievementId) {
            const back = this._getBackButtonBounds(body.x, body.y, uiSf);
            this.backButtonHovered = x >= back.x && x <= back.x + back.w && y >= back.y && y <= back.y + back.h;
            this.stateManager.canvas.style.cursor = (this.closeButtonHovered || this.backButtonHovered) ? 'pointer' : 'default';
            return;
        }

        const achievements = this._getAchievements();
        const layout = this._getCardLayout(achievements, body.x, body.y, body.width, body.height, uiSf);
        if (layout.totalPages > 1) {
            const arrowY    = body.y + body.height - 30;
            const leftArrX  = body.x + 10;
            const rightArrX = body.x + body.width - 36;
            const arrW = 26, arrH = 22;
            this.leftArrowHovered  = x >= leftArrX  && x <= leftArrX  + arrW && y >= arrowY && y <= arrowY + arrH && this.achievementCurrentPage > 0;
            this.rightArrowHovered = x >= rightArrX && x <= rightArrX + arrW && y >= arrowY && y <= arrowY + arrH && this.achievementCurrentPage < layout.totalPages - 1;
        }
        for (const rect of layout.cardRects) {
            if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
                this.hoveredCardId = rect.achievement.id;
                break;
            }
        }
        this.stateManager.canvas.style.cursor =
            (this.closeButtonHovered || this.leftArrowHovered || this.rightArrowHovered || this.hoveredCardId) ? 'pointer' : 'default';
    }

    handleClick(x, y) {
        // Prevent registering clicks for 200ms after opening to avoid click-through
        // from whatever click opened this panel (e.g. the achievement banner itself).
        if (Date.now() - this.openTime < 200) return;

        const { menuX, menuY, menuWidth, menuHeight } = this._menuDimensions();
        const { uiSf, contentX, contentY, contentWidth, contentHeight, closeButtonSize, closeButtonX, closeButtonY } =
            this._getLayout(menuX, menuY, menuWidth, menuHeight);

        if (x >= closeButtonX && x <= closeButtonX + closeButtonSize &&
            y >= closeButtonY && y <= closeButtonY + closeButtonSize) {
            this.close();
            return;
        }

        const body = this._getBodyRect(contentX, contentY, contentWidth, contentHeight, uiSf);

        if (this.selectedAchievementId) {
            const back = this._getBackButtonBounds(body.x, body.y, uiSf);
            if (x >= back.x && x <= back.x + back.w && y >= back.y && y <= back.y + back.h) {
                this.selectedAchievementId = null;
            }
            return;
        }

        const achievements = this._getAchievements();
        const layout = this._getCardLayout(achievements, body.x, body.y, body.width, body.height, uiSf);
        if (layout.totalPages > 1) {
            const arrowY    = body.y + body.height - 30;
            const leftArrX  = body.x + 10;
            const rightArrX = body.x + body.width - 36;
            const arrW = 26, arrH = 22;
            if (x >= leftArrX && x <= leftArrX + arrW && y >= arrowY && y <= arrowY + arrH && this.achievementCurrentPage > 0) {
                this.achievementCurrentPage--;
                return;
            }
            if (x >= rightArrX && x <= rightArrX + arrW && y >= arrowY && y <= arrowY + arrH && this.achievementCurrentPage < layout.totalPages - 1) {
                this.achievementCurrentPage++;
                return;
            }
        }

        // Card clicks — open the detail view for whichever achievement was clicked
        for (const rect of layout.cardRects) {
            if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
                this.selectedAchievementId = rect.achievement.id;
                return;
            }
        }
    }

    // ── Rendering ─────────────────────────────────────────────────────────────

    render(ctx) {
        const canvas = this.stateManager.canvas;
        const { menuX, menuY, menuWidth, menuHeight } = this._menuDimensions();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const { uiSf, contentX, contentY, contentWidth, contentHeight, closeButtonSize, closeButtonX, closeButtonY } =
            this._getLayout(menuX, menuY, menuWidth, menuHeight);

        ctx.fillStyle = '#2a1a0f';
        ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 2;
        ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

        this.drawCornerTrim(ctx, menuX, menuY, 15, true, false, false, false);
        this.drawCornerTrim(ctx, menuX + menuWidth, menuY, 15, false, true, false, false);
        this.drawCornerTrim(ctx, menuX, menuY + menuHeight, 15, false, false, true, false);
        this.drawCornerTrim(ctx, menuX + menuWidth, menuY + menuHeight, 15, false, false, false, true);

        ctx.font = `bold ${Math.round(24 * uiSf)}px serif`;
        ctx.fillStyle = '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('ACHIEVEMENTS', menuX + menuWidth / 2, menuY + Math.round(16 * uiSf));

        ctx.fillStyle = '#1a0f0a';
        ctx.fillRect(contentX, contentY, contentWidth, contentHeight);
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 1;
        ctx.strokeRect(contentX, contentY, contentWidth, contentHeight);

        const achievements = this._getAchievements();
        const achievementSystem = this.stateManager.achievementSystem;
        const scoreSummary = achievementSystem
            ? achievementSystem.getScoreSummary()
            : { earnedPoints: 0, totalPoints: 1000, unlockedCount: 0, totalCount: achievements.length,
                title: 'Tower Apprentice', nextTitle: null, currentThreshold: 0, nextThreshold: 0, isMaxTitle: false };

        this._renderHeader(ctx, contentX, contentY, contentWidth, uiSf, scoreSummary);

        const body = this._getBodyRect(contentX, contentY, contentWidth, contentHeight, uiSf);
        const selected = this.selectedAchievementId ? achievements.find(a => a.id === this.selectedAchievementId) : null;
        if (this.selectedAchievementId && !selected) {
            this.selectedAchievementId = null; // stale id (e.g. reloaded data) — fall back to the grid
        }
        if (selected) {
            this._renderDetail(ctx, selected, body.x, body.y, body.width, body.height, uiSf);
        } else {
            this._renderGrid(ctx, achievements, body.x, body.y, body.width, body.height, uiSf);
        }

        // Close button
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.fillStyle = this.closeButtonHovered ? '#ff6666' : '#cc0000';
        ctx.fillRect(closeButtonX, closeButtonY, closeButtonSize, closeButtonSize);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(closeButtonX, closeButtonY, closeButtonSize, closeButtonSize);
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(18 * uiSf)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('×', closeButtonX + closeButtonSize / 2, closeButtonY + closeButtonSize / 2 + 1);
        ctx.restore();
    }

    _renderHeader(ctx, x, y, width, uiSf, scoreSummary) {
        const unlockedCount = scoreSummary.unlockedCount;
        const totalCount    = scoreSummary.totalCount;
        const rowH    = Math.round(34 * uiSf);
        const rowGap  = Math.round(4 * uiSf);
        const headerH = this._getHeaderHeight(uiSf);

        const hdrGrad = ctx.createLinearGradient(x, y, x, y + headerH);
        hdrGrad.addColorStop(0, 'rgba(70, 42, 8, 0.7)');
        hdrGrad.addColorStop(1, 'rgba(30, 16, 4, 0.4)');
        ctx.fillStyle = hdrGrad;
        ctx.fillRect(x, y, width, headerH);

        ctx.strokeStyle = 'rgba(180, 130, 40, 0.3)';
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(x, y + headerH);
        ctx.lineTo(x + width, y + headerH);
        ctx.stroke();

        // Faint divider between the two header rows
        const hdrPad = Math.round(14 * uiSf);
        ctx.strokeStyle = 'rgba(180, 130, 40, 0.15)';
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(x + hdrPad, y + rowH);
        ctx.lineTo(x + width - hdrPad, y + rowH);
        ctx.stroke();

        // Shared bar geometry — both rows align on the same offset so the two
        // progress bars read as a coherent pair.
        const barOffX = Math.round(270 * uiSf);
        const barX    = x + barOffX;
        const barW    = width - barOffX - Math.round(10 * uiSf);
        const barH    = Math.round(14 * uiSf);

        // ── Row 1: achievements unlocked ────────────────────────────────────
        const row1CY = y + rowH / 2;
        ctx.font         = `bold ${Math.round(16 * uiSf)}px Trebuchet MS, sans-serif`;
        ctx.fillStyle    = '#f5d070';
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${unlockedCount}`, x + hdrPad, row1CY);

        ctx.font      = `${Math.round(13 * uiSf)}px Trebuchet MS, sans-serif`;
        ctx.fillStyle = '#8b7355';
        ctx.fillText(` / ${totalCount}  ACHIEVEMENTS UNLOCKED`, x + hdrPad + ctx.measureText(`${unlockedCount}`).width + 2, row1CY);

        const oBarY = row1CY - barH / 2;
        const oRatio = totalCount > 0 ? unlockedCount / totalCount : 0;

        ctx.fillStyle = '#0d0805';
        ctx.fillRect(barX, oBarY, barW, barH);
        if (oRatio > 0) {
            const oGrad = ctx.createLinearGradient(barX, oBarY, barX + barW, oBarY);
            oGrad.addColorStop(0, '#5a3a0a');
            oGrad.addColorStop(oRatio, '#d4af37');
            oGrad.addColorStop(1, '#2a1a05');
            ctx.fillStyle = oGrad;
            ctx.fillRect(barX, oBarY, Math.round(barW * oRatio), barH);
        }
        ctx.strokeStyle = '#4a3a1a';
        ctx.lineWidth   = 1;
        ctx.strokeRect(barX, oBarY, barW, barH);
        ctx.font         = `bold ${Math.round(10 * uiSf)}px Trebuchet MS, sans-serif`;
        ctx.fillStyle    = oRatio >= 1 ? '#ffd700' : '#8b7355';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${unlockedCount}/${totalCount}`, barX + barW / 2, oBarY + barH / 2);

        // ── Row 2: title progress — counts up toward the next title threshold
        // rather than the flat 1000-point total, so the bar always reflects how
        // close the commander is to their next honorary rank.
        const row2CY = y + rowH + rowGap + rowH / 2;
        const bracketStart = scoreSummary.currentThreshold || 0;
        const bracketEnd   = scoreSummary.isMaxTitle ? bracketStart : scoreSummary.nextThreshold;
        const bracketSize  = Math.max(1, bracketEnd - bracketStart);
        const intoBracket  = Math.max(0, scoreSummary.earnedPoints - bracketStart);
        const tRatio       = scoreSummary.isMaxTitle ? 1 : Math.min(intoBracket / bracketSize, 1);

        ctx.font         = `bold ${Math.round(15 * uiSf)}px Trebuchet MS, sans-serif`;
        ctx.fillStyle    = '#a8d4f5';
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'middle';
        const maxTitleChars = Math.max(8, Math.round(barOffX / (7 * uiSf)));
        const titleDisplay  = scoreSummary.title.length > maxTitleChars
            ? scoreSummary.title.slice(0, maxTitleChars - 1) + '…'
            : scoreSummary.title;
        ctx.fillText(titleDisplay, x + hdrPad, row2CY);

        const sBarY = row2CY - barH / 2;

        ctx.fillStyle = '#070b10';
        ctx.fillRect(barX, sBarY, barW, barH);
        if (tRatio > 0) {
            const sGrad = ctx.createLinearGradient(barX, sBarY, barX + barW, sBarY);
            sGrad.addColorStop(0, '#0f2a4a');
            sGrad.addColorStop(tRatio, '#5fb0e8');
            sGrad.addColorStop(1, '#0a1a2e');
            ctx.fillStyle = sGrad;
            ctx.fillRect(barX, sBarY, Math.round(barW * tRatio), barH);
        }
        ctx.strokeStyle = '#1d3a52';
        ctx.lineWidth   = 1;
        ctx.strokeRect(barX, sBarY, barW, barH);
        ctx.font         = `bold ${Math.round(10 * uiSf)}px Trebuchet MS, sans-serif`;
        ctx.fillStyle    = tRatio >= 1 ? '#d8f0ff' : '#6f8aa3';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        const barLabel = scoreSummary.isMaxTitle
            ? `${scoreSummary.earnedPoints} / ${scoreSummary.totalPoints} pts  •  Highest title attained`
            : `${scoreSummary.earnedPoints} / ${scoreSummary.nextThreshold} pts  →  ${scoreSummary.nextTitle}`;
        ctx.fillText(barLabel, barX + barW / 2, sBarY + barH / 2);
    }

    _renderGrid(ctx, achievements, x, y, width, height, uiSf) {
        const layout = this._getCardLayout(achievements, x, y, width, height, uiSf);
        const { totalPages, page, cardRects } = layout;

        cardRects.forEach(rect => {
            this._drawAchievementCard(ctx, rect.achievement, rect.x, rect.y, rect.w, rect.h, uiSf,
                rect.achievement.id === this.hoveredCardId);
        });

        if (achievements.length === 0) {
            ctx.font         = '13px Trebuchet MS, sans-serif';
            ctx.fillStyle    = '#6a5a4a';
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('No achievements found', x + width / 2, y + height / 2);
            return;
        }

        if (totalPages > 1) {
            const arrowY    = y + height - 28;
            const leftArrX  = x + 10;
            const rightArrX = x + width - 36;
            const arrW = 26, arrH = 22;

            const leftEnabled = page > 0;
            ctx.fillStyle   = leftEnabled ? (this.leftArrowHovered ? '#c9922a' : '#5a3a10') : '#1e130a';
            ctx.fillRect(leftArrX, arrowY, arrW, arrH);
            ctx.strokeStyle = leftEnabled ? '#d4af37' : '#3a2a1a';
            ctx.lineWidth   = 1;
            ctx.strokeRect(leftArrX, arrowY, arrW, arrH);
            ctx.font         = 'bold 16px Arial';
            ctx.fillStyle    = leftEnabled ? '#ffd700' : '#4a3a2a';
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('‹', leftArrX + arrW / 2, arrowY + arrH / 2);

            ctx.font      = 'bold 11px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#a08050';
            ctx.textAlign = 'center';
            ctx.fillText(`${page + 1}  /  ${totalPages}`, x + width / 2, arrowY + arrH / 2);

            const rightEnabled = page < totalPages - 1;
            ctx.fillStyle   = rightEnabled ? (this.rightArrowHovered ? '#c9922a' : '#5a3a10') : '#1e130a';
            ctx.fillRect(rightArrX, arrowY, arrW, arrH);
            ctx.strokeStyle = rightEnabled ? '#d4af37' : '#3a2a1a';
            ctx.lineWidth   = 1;
            ctx.strokeRect(rightArrX, arrowY, arrW, arrH);
            ctx.font         = 'bold 16px Arial';
            ctx.fillStyle    = rightEnabled ? '#ffd700' : '#4a3a2a';
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('›', rightArrX + arrW / 2, arrowY + arrH / 2);
        }
    }

    // Shared by _renderGrid() (drawing) and handleClick()/updateHoverState() (hit-testing)
    // so the grid geometry can never drift between the two. x/y here is already the body
    // origin (below the header) — no header math involved.
    _getCardLayout(achievements, x, y, width, height, uiSf) {
        const PER_PAGE   = 8; // 2 cols × 4 rows
        const totalPages = Math.max(1, Math.ceil(achievements.length / PER_PAGE));
        const page       = Math.min(this.achievementCurrentPage, totalPages - 1);
        const startIdx   = page * PER_PAGE;
        const pageItems  = achievements.slice(startIdx, startIdx + PER_PAGE);

        const paginationH = Math.round(40 * uiSf);
        const cardAreaY   = y;
        const cardAreaH   = height - paginationH;
        const COLS = 2, ROWS = 4;
        const gapX = Math.round(10 * uiSf);
        const gapY = Math.round(8 * uiSf);
        const padX = Math.round(8 * uiSf);
        const cardW = (width - 2 * padX - gapX) / COLS;
        const cardH = Math.floor((cardAreaH - (ROWS - 1) * gapY) / ROWS);

        const cardRects = pageItems.map((achievement, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            return {
                x: x + padX + col * (cardW + gapX),
                y: cardAreaY + row * (cardH + gapY),
                w: cardW,
                h: cardH,
                achievement
            };
        });

        return { totalPages, page, pageItems, cardRects, cardAreaY, cardAreaH };
    }

    _getBackButtonBounds(x, y, uiSf) {
        return {
            x: x + Math.round(8 * uiSf),
            y: y + Math.round(6 * uiSf),
            w: Math.round(70 * uiSf),
            h: Math.round(24 * uiSf)
        };
    }

    _drawAchievementCard(ctx, achievement, cx, cy, cw, ch, uiSf = 1, hovered = false) {
        const unlocked  = achievement.unlocked;
        const catColor  = CAT_COLORS[achievement.category] || '#3a2a1a';
        const prog      = achievement.progress || { current: 0, max: 1 };
        const ratio     = prog.max > 0 ? Math.min(prog.current / prog.max, 1) : 0;
        const tier      = achievement.tier || 0;
        const tierMax   = achievement.tierMax || 0;
        const tierStyle = tier > 0 ? TIER_STYLES[Math.min(tier - 1, TIER_STYLES.length - 1)] : null;

        const stripe = 3 * uiSf;
        const pad    = 8 * uiSf;
        const iconR  = 21 * uiSf;

        // ── Background ────────────────────────────────────────────────────────
        if (unlocked) {
            const bg = ctx.createLinearGradient(cx, cy, cx + cw, cy + ch);
            bg.addColorStop(0,   '#3d2210');
            bg.addColorStop(0.5, '#4a2c14');
            bg.addColorStop(1,   '#3a200e');
            ctx.fillStyle = bg;
        } else {
            ctx.fillStyle = '#1a1008';
        }
        ctx.fillRect(cx, cy, cw, ch);

        // ── Category colour stripe (left edge) ────────────────────────────────
        ctx.fillStyle = unlocked ? catColor : catColor + '66';
        ctx.fillRect(cx, cy, stripe, ch);

        // ── Border ────────────────────────────────────────────────────────────
        if (unlocked) {
            ctx.fillStyle = 'rgba(255, 215, 80, 0.12)';
            ctx.fillRect(cx, cy, cw, 2 * uiSf);
            ctx.strokeStyle = '#c9922a';
            ctx.lineWidth   = 1.5;
        } else {
            ctx.strokeStyle = '#2a1a0a';
            ctx.lineWidth   = 1;
        }
        ctx.strokeRect(cx, cy, cw, ch);

        // ── Hover highlight — signals the card is clickable (opens detail view)
        if (hovered) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth   = 2;
            ctx.strokeRect(cx + 1, cy + 1, cw - 2, ch - 2);
        }

        // ── Points badge (top-right corner) ─────────────────────────────────
        const ptsText = `+${achievement.points || 0}`;
        ctx.font = `bold ${Math.round(9 * uiSf)}px Trebuchet MS, sans-serif`;
        const ptsPadX = 5 * uiSf;
        const ptsW    = ctx.measureText(ptsText).width + ptsPadX * 2;
        const ptsH    = 13 * uiSf;
        const ptsX    = cx + cw - ptsW - 5 * uiSf;
        const ptsY    = cy + 5 * uiSf;
        ctx.fillStyle = unlocked ? 'rgba(212, 175, 55, 0.22)' : 'rgba(60, 50, 40, 0.2)';
        ctx.fillRect(ptsX, ptsY, ptsW, ptsH);
        ctx.strokeStyle = unlocked ? '#c9922a' : '#2a1a0a';
        ctx.lineWidth   = 1;
        ctx.strokeRect(ptsX, ptsY, ptsW, ptsH);
        ctx.font         = `bold ${Math.round(9 * uiSf)}px Trebuchet MS, sans-serif`;
        ctx.fillStyle    = unlocked ? '#ffd700' : '#4a3a2a';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ptsText, ptsX + ptsW / 2, ptsY + ptsH / 2);

        // ── Icon badge ────────────────────────────────────────────────────────
        const iconCX = cx + stripe + pad + iconR;
        const iconCY = cy + ch / 2;

        // Rank glow behind the badge — only for unlocked, tiered achievements, and
        // grows brighter/thicker at higher tiers.
        if (unlocked && tierStyle) {
            ctx.beginPath();
            ctx.arc(iconCX, iconCY, iconR + 3 * uiSf, 0, Math.PI * 2);
            ctx.strokeStyle = tierStyle.glow;
            ctx.lineWidth   = (1.5 + tier * 0.4) * uiSf;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(iconCX, iconCY, iconR, 0, Math.PI * 2);
        if (unlocked) {
            const iconBg = ctx.createRadialGradient(iconCX - 5, iconCY - 5, 3, iconCX, iconCY, iconR);
            iconBg.addColorStop(0, tierStyle ? tierStyle.inner : '#6b4018');
            iconBg.addColorStop(1, '#2e1508');
            ctx.fillStyle = iconBg;
        } else {
            ctx.fillStyle = '#150e06';
        }
        ctx.fill();

        ctx.strokeStyle = unlocked ? (tierStyle ? tierStyle.ring : '#c9922a') : '#1e1408';
        ctx.lineWidth   = unlocked ? 1.5 : 1;
        ctx.stroke();

        ctx.font         = `${unlocked ? 'bold ' : ''}${Math.round(20 * uiSf)}px Trebuchet MS, sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = unlocked ? '#f5d070' : '#2e2018';
        ctx.fillText(achievement.icon || '●', iconCX, iconCY + 1);

        // Rank pips beneath the badge — filled count shows this achievement's tier
        // out of its category's ladder (e.g. ●●●○○○ = rank 3 of 6).
        if (tierMax > 0) {
            const pipR   = 1.6 * uiSf;
            const pipGap = 5 * uiSf;
            const pipsW  = (tierMax - 1) * pipGap;
            const pipY   = iconCY + iconR + 6 * uiSf;
            let pipX0    = iconCX - pipsW / 2;
            for (let p = 0; p < tierMax; p++) {
                ctx.beginPath();
                ctx.arc(pipX0 + p * pipGap, pipY, pipR, 0, Math.PI * 2);
                if (p < tier) {
                    ctx.fillStyle = unlocked ? (tierStyle ? tierStyle.ring : catColor) : (catColor + '88');
                    ctx.fill();
                } else {
                    ctx.strokeStyle = unlocked ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }

        // ── Text area ─────────────────────────────────────────────────────────
        const textX = cx + stripe + pad + iconR * 2 + pad;
        const textW = cw - (textX - cx) - pad;

        ctx.textAlign    = 'left';
        ctx.textBaseline = 'top';

        // Name
        ctx.font      = `bold ${Math.round(12 * uiSf)}px Trebuchet MS, sans-serif`;
        ctx.fillStyle = unlocked ? '#f5d070' : '#4a3a2a';
        ctx.fillText(achievement.name, textX, cy + 8 * uiSf);

        // Description
        ctx.font      = `${Math.round(10 * uiSf)}px Trebuchet MS, sans-serif`;
        ctx.fillStyle = unlocked ? '#c8a070' : '#2e2018';
        const maxChars = Math.round(42 / uiSf);
        const desc    = achievement.description.length > maxChars
            ? achievement.description.slice(0, maxChars - 2) + '…'
            : achievement.description;
        ctx.fillText(desc, textX, cy + 24 * uiSf);

        // ── Progress bar ──────────────────────────────────────────────────────
        const barH = 12 * uiSf;
        const barX = textX;
        const barY = cy + ch - barH - 4 * uiSf;
        const barW = textW;

        ctx.fillStyle = '#0a0704';
        ctx.fillRect(barX, barY, barW, barH);

        if (ratio > 0) {
            const fillW = Math.round(barW * ratio);
            if (unlocked) {
                const barGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
                barGrad.addColorStop(0, '#7a5510');
                barGrad.addColorStop(1, '#f5c040');
                ctx.fillStyle = barGrad;
            } else {
                ctx.fillStyle = '#2a4a1a';
            }
            ctx.fillRect(barX, barY, fillW, barH);
        }

        ctx.strokeStyle = unlocked ? '#8b6914' : '#1e1408';
        ctx.lineWidth   = 1;
        ctx.strokeRect(barX, barY, barW, barH);

        ctx.font         = `bold ${Math.round(8 * uiSf)}px Trebuchet MS, sans-serif`;
        ctx.fillStyle    = unlocked ? '#ffd700' : '#4a3a2a';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        const progLabel  = unlocked
            ? '✓  COMPLETE'
            : `${prog.current.toLocaleString()} / ${prog.max.toLocaleString()}`;
        ctx.fillText(progLabel, barX + barW / 2, barY + barH / 2);
    }

    /** Full detail view for a single achievement — replaces the card grid when selected. */
    _renderDetail(ctx, achievement, x, y, width, height, uiSf) {
        const unlocked   = achievement.unlocked;
        const catColor   = CAT_COLORS[achievement.category] || '#3a2a1a';
        const tier       = achievement.tier || 0;
        const tierMax    = achievement.tierMax || 0;
        const tierStyle  = tier > 0 ? TIER_STYLES[Math.min(tier - 1, TIER_STYLES.length - 1)] : null;
        const prog       = achievement.progress || { current: 0, max: 1 };
        const ratio      = prog.max > 0 ? Math.min(prog.current / prog.max, 1) : 0;

        // ── Back button ───────────────────────────────────────────────────────
        const back = this._getBackButtonBounds(x, y, uiSf);
        ctx.fillStyle = this.backButtonHovered ? '#4a3018' : '#2e1c0e';
        ctx.fillRect(back.x, back.y, back.w, back.h);
        ctx.strokeStyle = '#c9922a';
        ctx.lineWidth   = 1;
        ctx.strokeRect(back.x, back.y, back.w, back.h);
        ctx.font         = `bold ${Math.round(11 * uiSf)}px Trebuchet MS, sans-serif`;
        ctx.fillStyle    = '#ffd700';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('‹ Back', back.x + back.w / 2, back.y + back.h / 2);

        // ── Unlocked / locked status pill (top-right) ───────────────────────────
        const statusText = unlocked ? '✓ UNLOCKED' : 'LOCKED';
        ctx.font = `bold ${Math.round(11 * uiSf)}px Trebuchet MS, sans-serif`;
        const statusPadX = 8 * uiSf;
        const statusW    = ctx.measureText(statusText).width + statusPadX * 2;
        const statusH    = Math.round(24 * uiSf);
        const statusX    = x + width - statusW - Math.round(8 * uiSf);
        const statusY    = y + Math.round(6 * uiSf);
        ctx.fillStyle   = unlocked ? 'rgba(90, 200, 110, 0.18)' : 'rgba(120, 60, 40, 0.18)';
        ctx.fillRect(statusX, statusY, statusW, statusH);
        ctx.strokeStyle = unlocked ? 'rgba(90, 200, 110, 0.85)' : 'rgba(160, 90, 70, 0.7)';
        ctx.lineWidth   = 1.5;
        ctx.strokeRect(statusX, statusY, statusW, statusH);
        ctx.fillStyle    = unlocked ? '#8fe0a0' : '#c89070';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(statusText, statusX + statusW / 2, statusY + statusH / 2);

        // ── Icon + name row ──────────────────────────────────────────────────────
        const iconR  = Math.round(38 * uiSf);
        const iconCX = x + Math.round(16 * uiSf) + iconR;
        const iconCY = back.y + back.h + Math.round(26 * uiSf) + iconR;

        if (unlocked && tierStyle) {
            ctx.beginPath();
            ctx.arc(iconCX, iconCY, iconR + 5 * uiSf, 0, Math.PI * 2);
            ctx.strokeStyle = tierStyle.glow;
            ctx.lineWidth   = (2 + tier * 0.6) * uiSf;
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(iconCX, iconCY, iconR, 0, Math.PI * 2);
        if (unlocked) {
            const iconBg = ctx.createRadialGradient(iconCX - 8, iconCY - 8, 4, iconCX, iconCY, iconR);
            iconBg.addColorStop(0, tierStyle ? tierStyle.inner : '#6b4018');
            iconBg.addColorStop(1, '#2e1508');
            ctx.fillStyle = iconBg;
        } else {
            ctx.fillStyle = '#150e06';
        }
        ctx.fill();
        ctx.strokeStyle = unlocked ? (tierStyle ? tierStyle.ring : '#c9922a') : '#1e1408';
        ctx.lineWidth   = unlocked ? 2 : 1;
        ctx.stroke();
        ctx.font         = `${unlocked ? 'bold ' : ''}${Math.round(34 * uiSf)}px Trebuchet MS, sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = unlocked ? '#f5d070' : '#2e2018';
        ctx.fillText(achievement.icon || '●', iconCX, iconCY + 2 * uiSf);

        // Tier pips beneath the icon
        if (tierMax > 0) {
            const pipR   = 2 * uiSf;
            const pipGap = 8 * uiSf;
            const pipsW  = (tierMax - 1) * pipGap;
            const pipY   = iconCY + iconR + 12 * uiSf;
            let pipX0    = iconCX - pipsW / 2;
            for (let p = 0; p < tierMax; p++) {
                ctx.beginPath();
                ctx.arc(pipX0 + p * pipGap, pipY, pipR, 0, Math.PI * 2);
                if (p < tier) {
                    ctx.fillStyle = unlocked ? (tierStyle ? tierStyle.ring : catColor) : (catColor + '88');
                    ctx.fill();
                } else {
                    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
                    ctx.lineWidth   = 1;
                    ctx.stroke();
                }
            }
        }

        // Name, to the right of the icon
        const textX = iconCX + iconR + Math.round(20 * uiSf);
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'top';
        ctx.font      = `bold ${Math.round(20 * uiSf)}px Trebuchet MS, sans-serif`;
        ctx.fillStyle = unlocked ? '#f5d070' : '#c8a070';
        ctx.fillText(achievement.name, textX, iconCY - Math.round(30 * uiSf));

        // Category pill + points badge, below the name
        const catLabel = (achievement.category || '').toUpperCase();
        ctx.font = `bold ${Math.round(10 * uiSf)}px Trebuchet MS, sans-serif`;
        const catPadX = 7 * uiSf;
        const catW = ctx.measureText(catLabel).width + catPadX * 2;
        const catH = Math.round(18 * uiSf);
        const catY = iconCY - Math.round(2 * uiSf);
        ctx.fillStyle = catColor;
        ctx.fillRect(textX, catY, catW, catH);
        ctx.fillStyle    = '#fff';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(catLabel, textX + catW / 2, catY + catH / 2);

        const ptsText = `+${achievement.points || 0} pts`;
        ctx.font = `bold ${Math.round(10 * uiSf)}px Trebuchet MS, sans-serif`;
        const ptsPadX = 7 * uiSf;
        const ptsW = ctx.measureText(ptsText).width + ptsPadX * 2;
        const ptsX = textX + catW + Math.round(8 * uiSf);
        ctx.fillStyle = 'rgba(212, 175, 55, 0.22)';
        ctx.fillRect(ptsX, catY, ptsW, catH);
        ctx.strokeStyle = '#c9922a';
        ctx.lineWidth   = 1;
        ctx.strokeRect(ptsX, catY, ptsW, catH);
        ctx.fillStyle = '#ffd700';
        ctx.fillText(ptsText, ptsX + ptsW / 2, catY + catH / 2);

        // ── Full description (word-wrapped) ──────────────────────────────────────
        const descY = iconCY + iconR + Math.round(36 * uiSf);
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'top';
        ctx.font      = `${Math.round(14 * uiSf)}px Trebuchet MS, sans-serif`;
        ctx.fillStyle = unlocked ? '#e8d0a0' : '#a89070';
        const maxCharsPerLine = Math.max(20, Math.round((width - 32 * uiSf) / (7 * uiSf)));
        const lines = this.wrapText(achievement.description, maxCharsPerLine);
        const lineH = Math.round(20 * uiSf);
        lines.forEach((line, i) => {
            ctx.fillText(line, x + Math.round(16 * uiSf), descY + i * lineH);
        });

        // ── Full progress bar — sits just below the description, but never past
        // the bottom margin (relevant if the content area is short) ─────────────
        const barH = Math.round(22 * uiSf);
        const barX = x + Math.round(16 * uiSf);
        const barW = width - Math.round(32 * uiSf);
        const barYBelowText = descY + lines.length * lineH + Math.round(24 * uiSf);
        const barYAtBottom  = y + height - barH - Math.round(16 * uiSf);
        const barY = Math.min(barYBelowText, barYAtBottom);

        ctx.font      = `${Math.round(10 * uiSf)}px Trebuchet MS, sans-serif`;
        ctx.fillStyle = '#8b7355';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('PROGRESS', barX, barY - Math.round(6 * uiSf));

        ctx.fillStyle = '#0a0704';
        ctx.fillRect(barX, barY, barW, barH);
        if (ratio > 0) {
            const fillW = Math.round(barW * ratio);
            const barGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
            if (unlocked) {
                barGrad.addColorStop(0, '#7a5510');
                barGrad.addColorStop(1, '#f5c040');
            } else {
                barGrad.addColorStop(0, '#1a3a12');
                barGrad.addColorStop(1, '#3a7a28');
            }
            ctx.fillStyle = barGrad;
            ctx.fillRect(barX, barY, fillW, barH);
        }
        ctx.strokeStyle = unlocked ? '#8b6914' : '#3a2a1a';
        ctx.lineWidth   = 1.5;
        ctx.strokeRect(barX, barY, barW, barH);

        ctx.font         = `bold ${Math.round(12 * uiSf)}px Trebuchet MS, sans-serif`;
        ctx.fillStyle    = unlocked ? '#ffd700' : '#d0c0a0';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        const progLabel = unlocked
            ? '✓  COMPLETE'
            : `${prog.current.toLocaleString()} / ${prog.max.toLocaleString()}`;
        ctx.fillText(progLabel, barX + barW / 2, barY + barH / 2);
    }

    wrapText(text, maxCharsPerLine) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (const word of words) {
            if ((currentLine + word).length <= maxCharsPerLine) {
                currentLine += (currentLine ? ' ' : '') + word;
            } else {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
            }
        }
        if (currentLine) lines.push(currentLine);

        return lines;
    }

    /** Draw decorative golden corner trim on panel corners */
    drawCornerTrim(ctx, x, y, size = 15, isTopLeft = true, isTopRight = false, isBottomLeft = false, isBottomRight = false) {
        const cornerSize = size;

        ctx.fillStyle = '#d4af37';
        if (isTopLeft) {
            ctx.fillRect(x, y, cornerSize, 3);
            ctx.fillRect(x, y, 3, cornerSize);
        } else if (isTopRight) {
            ctx.fillRect(x - cornerSize, y, cornerSize, 3);
            ctx.fillRect(x - 3, y, 3, cornerSize);
        } else if (isBottomLeft) {
            ctx.fillRect(x, y - 3, cornerSize, 3);
            ctx.fillRect(x, y - cornerSize, 3, cornerSize);
        } else if (isBottomRight) {
            ctx.fillRect(x - cornerSize, y - 3, cornerSize, 3);
            ctx.fillRect(x - 3, y - cornerSize, 3, cornerSize);
        }

        ctx.fillStyle = '#ffd700';
        const gemSize = 4;
        if (isTopLeft) {
            ctx.beginPath();
            ctx.arc(x + gemSize, y + gemSize, gemSize / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (isTopRight) {
            ctx.beginPath();
            ctx.arc(x - gemSize, y + gemSize, gemSize / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (isBottomLeft) {
            ctx.beginPath();
            ctx.arc(x + gemSize, y - gemSize, gemSize / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (isBottomRight) {
            ctx.beginPath();
            ctx.arc(x - gemSize, y - gemSize, gemSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
