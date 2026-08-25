import { GameStatistics } from '../../systems/GameStatistics.js';
import { AchievementsContentView } from '../AchievementPanel.js';
import { EnemyIntelRegistry } from '../../registries/EnemyIntelRegistry.js';

/**
 * Arcane Knowledge Menu
 * Placeholder menu for tracking magical knowledge, enemy encounters and statistics
 */
export class ArcaneLibraryMenu {
    constructor(stateManager, settlementHub) {
        this.stateManager = stateManager;
        this.settlementHub = settlementHub;
        this.isOpen = false;
        this.animationProgress = 0;
        this.openTime = 0; // Track when menu was opened to prevent click-through

        // Initialize GameStatistics if not already done
        if (!this.stateManager.gameStatistics) {
            this.stateManager.gameStatistics = new GameStatistics();
        }

        // Tab system
        this.tabs = [
            { label: 'STATISTICS', id: 'statistics', hovered: false },
            { label: 'ACHIEVEMENTS', id: 'achievements', hovered: false },
            { label: 'ENEMY INTEL', id: 'enemy-intel', hovered: false }
        ];
        this.activeTab = 'statistics';

        // Achievements tab content — embedded inline so the Library's own tab bar
        // stays visible and usable while browsing achievements (rather than handing
        // off to the standalone AchievementPanel popup, which has no way back here).
        this.achievementsView = new AchievementsContentView(stateManager);

        // Pagination for enemy intel
        this.intelCurrentPage = 0;
        this.intelItemsPerPage = 9; // list view, up to 9 per page
        this.intelLeftArrowHovered = false;
        this.intelRightArrowHovered = false;
        this.hoveredEnemyId = null;
        this.selectedEnemyId = null;
        // Image cache for enemy portraits
        this.enemyImageCache = {};
        this._loadEnemyImages();

        this.closeButtonHovered = false;
        this.leftArrowHovered = false;
        this.rightArrowHovered = false;
    }

    /**
     * @param {Object} [options]
     * @param {string} [options.tab] - tab id to open on ('statistics' by default)
     */
    open(options = {}) {
        this.isOpen = true;
        this.animationProgress = 0;
        this.openTime = Date.now(); // Record when menu was opened
        this.activeTab = options.tab || 'statistics';
        this.intelCurrentPage = 0;
        this.selectedEnemyId = null;
        this.hoveredEnemyId = null;
        this.achievementsView.reset(options.achievementId || null);
    }

    close() {
        this.isOpen = false;
        this.settlementHub.closePopup();
    }

    _loadEnemyImages() {
        const allEnemies = EnemyIntelRegistry.getAllEnemyIntel();
        for (const [id, data] of Object.entries(allEnemies)) {
            if (data.image && !this.enemyImageCache[id]) {
                const img = new Image();
                img.onload = () => { this.enemyImageCache[id] = img; };
                img.onerror = () => { this.enemyImageCache[id] = null; };
                img.src = data.image;
            }
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

    // Shared geometry for tabs/content/close button - used by render(), updateHoverState()
    // and handleClick() so hitboxes always match what's drawn, regardless of uiSf scale.
    _getTabLayout(menuX, menuY, menuWidth, menuHeight) {
        const uiSf = menuWidth / 800; // internal scale factor relative to base 800px popup
        const tabHeight = Math.round(40 * uiSf);
        const tabStartY = menuY + Math.round(52 * uiSf);
        const tabButtonWidth = menuWidth / 3;
        const pad = Math.round(20 * uiSf);
        const contentX = menuX + pad;
        const contentY = tabStartY + tabHeight + pad;
        const contentWidth = menuWidth - pad * 2;
        const contentHeight = menuHeight - tabHeight - Math.round(80 * uiSf);
        const closeButtonSize = Math.round(28 * uiSf);
        const closeButtonX = menuX + menuWidth - closeButtonSize - Math.round(8 * uiSf);
        const closeButtonY = menuY + Math.round(8 * uiSf);
        return {
            uiSf, tabHeight, tabStartY, tabButtonWidth,
            contentX, contentY, contentWidth, contentHeight,
            closeButtonSize, closeButtonX, closeButtonY
        };
    }

    update(deltaTime) {
        if (this.isOpen && this.animationProgress < 1) {
            this.animationProgress += deltaTime * 2;
        }
    }

    updateHoverState(x, y) {
        const { menuX, menuY, menuWidth, menuHeight } = this._menuDimensions();
        const canvas = this.stateManager.canvas;
        const {
            uiSf, tabHeight, tabStartY, tabButtonWidth,
            contentX, contentY, contentWidth, contentHeight,
            closeButtonSize, closeButtonX, closeButtonY
        } = this._getTabLayout(menuX, menuY, menuWidth, menuHeight);

        // Close button
        this.closeButtonHovered = x >= closeButtonX && x <= closeButtonX + closeButtonSize &&
                                 y >= closeButtonY && y <= closeButtonY + closeButtonSize;

        // Tab buttons
        this.tabs.forEach((tab, index) => {
            const tabX = menuX + index * tabButtonWidth;
            const tabY = tabStartY;
            tab.hovered = x >= tabX && x <= tabX + tabButtonWidth &&
                         y >= tabY && y <= tabY + tabHeight;
        });

        // Content area hover detection for enemy-intel tab
        if (this.activeTab === 'enemy-intel') {
            this.intelLeftArrowHovered = false;
            this.intelRightArrowHovered = false;
            this.hoveredEnemyId = null;

            // List panel: left 230px
            const listW = 230;
            const listX = contentX;
            const btnH = 36;
            const btnGap = 4;

            // Get unlocked enemy intel
            const unlockedIntelPacks = this.settlementHub?.stateManager?.marketplaceSystem?.getUnlockedEnemyIntel() || [];
            const unlockedEnemies = EnemyIntelRegistry.getUnlockedEnemies(unlockedIntelPacks);

            if (unlockedEnemies.length > 0) {
                const itemsPerPage = this.intelItemsPerPage;
                const totalPages = Math.ceil(unlockedEnemies.length / itemsPerPage);
                const startIdx = this.intelCurrentPage * itemsPerPage;
                const endIdx = Math.min(startIdx + itemsPerPage, unlockedEnemies.length);
                let pointerNeeded = false;

                for (let i = startIdx; i < endIdx; i++) {
                    const rowIdx = i - startIdx;
                    const btnY = contentY + 8 + rowIdx * (btnH + btnGap);
                    if (x >= listX && x <= listX + listW && y >= btnY && y <= btnY + btnH) {
                        this.hoveredEnemyId = unlockedEnemies[i];
                        pointerNeeded = true;
                    }
                }

                if (totalPages > 1) {
                    const arrowY = contentY + contentHeight - 34;
                    const leftArrowX = contentX + 8;
                    const rightArrowX = contentX + listW - 34;
                    const arrowSize = 26;
                    this.intelLeftArrowHovered = x >= leftArrowX && x <= leftArrowX + arrowSize &&
                                              y >= arrowY && y <= arrowY + arrowSize &&
                                              this.intelCurrentPage > 0;
                    this.intelRightArrowHovered = x >= rightArrowX && x <= rightArrowX + arrowSize &&
                                                y >= arrowY && y <= arrowY + arrowSize &&
                                                this.intelCurrentPage < totalPages - 1;
                    if (this.intelLeftArrowHovered || this.intelRightArrowHovered) pointerNeeded = true;
                }

                this.stateManager.canvas.style.cursor =
                    (this.tabs.some(t => t.hovered) || this.closeButtonHovered || pointerNeeded) ? 'pointer' : 'default';
            } else {
                this.stateManager.canvas.style.cursor =
                    (this.tabs.some(t => t.hovered) || this.closeButtonHovered) ? 'pointer' : 'default';
            }
            return;
        }

        // Achievements tab hover detection (embedded content view)
        if (this.activeTab === 'achievements') {
            const pointerNeeded = this.achievementsView.updateHover(
                x, y, contentX, contentY, contentWidth, contentHeight, uiSf);
            this.stateManager.canvas.style.cursor =
                (this.tabs.some(t => t.hovered) || this.closeButtonHovered || pointerNeeded) ? 'pointer' : 'default';
            return;
        }

        // Default cursor for other tabs
        this.stateManager.canvas.style.cursor = (this.tabs.some(t => t.hovered) || this.closeButtonHovered) ? 'pointer' : 'default';
    }

    handleClick(x, y) {
        // Prevent registering clicks for 200ms after opening to avoid click-through
        const timeSinceOpen = Date.now() - this.openTime;
        if (timeSinceOpen < 200) {
            return;
        }

        const { menuX, menuY, menuWidth, menuHeight } = this._menuDimensions();
        const {
            tabHeight, tabStartY, tabButtonWidth,
            closeButtonSize, closeButtonX, closeButtonY
        } = this._getTabLayout(menuX, menuY, menuWidth, menuHeight);

        // Close button
        if (x >= closeButtonX && x <= closeButtonX + closeButtonSize &&
            y >= closeButtonY && y <= closeButtonY + closeButtonSize) {
            this.close();
            return;
        }

        // Tab buttons
        for (let i = 0; i < this.tabs.length; i++) {
            const tab = this.tabs[i];
            const tabX = menuX + i * tabButtonWidth;
            const tabY = tabStartY;

            if (x >= tabX && x <= tabX + tabButtonWidth &&
                y >= tabY && y <= tabY + tabHeight) {
                this.activeTab = tab.id;
                return;
            }
        }

        // Handle achievements tab clicks (embedded content view)
        if (this.activeTab === 'achievements') {
            const { contentX, contentY, contentWidth, contentHeight, uiSf } =
                this._getTabLayout(menuX, menuY, menuWidth, menuHeight);
            this.achievementsView.handleClick(x, y, contentX, contentY, contentWidth, contentHeight, uiSf);
            return;
        }

        // Handle enemy intel tab clicks
        if (this.activeTab === 'enemy-intel') {
            const { contentX, contentY, contentWidth, contentHeight } =
                this._getTabLayout(menuX, menuY, menuWidth, menuHeight);
            const listW = 230;
            const btnH = 36;
            const btnGap = 4;

            // Get unlocked enemy intel
            const unlockedIntelPacks = this.settlementHub?.stateManager?.marketplaceSystem?.getUnlockedEnemyIntel() || [];
            const unlockedEnemies = EnemyIntelRegistry.getUnlockedEnemies(unlockedIntelPacks);

            if (unlockedEnemies.length > 0) {
                const itemsPerPage = this.intelItemsPerPage;
                const totalPages = Math.ceil(unlockedEnemies.length / itemsPerPage);
                const startIdx = this.intelCurrentPage * itemsPerPage;
                const endIdx = Math.min(startIdx + itemsPerPage, unlockedEnemies.length);

                // Check enemy button clicks
                for (let i = startIdx; i < endIdx; i++) {
                    const rowIdx = i - startIdx;
                    const btnY = contentY + 8 + rowIdx * (btnH + btnGap);
                    if (x >= contentX && x <= contentX + listW && y >= btnY && y <= btnY + btnH) {
                        this.selectedEnemyId = unlockedEnemies[i];
                        return;
                    }
                }

                // Pagination arrow clicks
                if (totalPages > 1) {
                    const arrowY = contentY + contentHeight - 34;
                    const leftArrowX = contentX + 8;
                    const rightArrowX = contentX + listW - 34;
                    const arrowSize = 26;

                    if (x >= leftArrowX && x <= leftArrowX + arrowSize &&
                        y >= arrowY && y <= arrowY + arrowSize &&
                        this.intelCurrentPage > 0) {
                        this.intelCurrentPage--;
                        this.selectedEnemyId = null;
                        return;
                    }

                    if (x >= rightArrowX && x <= rightArrowX + arrowSize &&
                        y >= arrowY && y <= arrowY + arrowSize &&
                        this.intelCurrentPage < totalPages - 1) {
                        this.intelCurrentPage++;
                        this.selectedEnemyId = null;
                        return;
                    }
                }
            }
        }
    }

    /**
     * Draw decorative golden corner trim on panel corners
     */
    drawCornerTrim(ctx, x, y, size = 15, isTopLeft = true, isTopRight = false, isBottomLeft = false, isBottomRight = false) {
        const cornerSize = size;

        // Draw corner rectangle with golden color
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

        // Add a small decorative gem/circle in each corner
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

    render(ctx) {
        const canvas = this.stateManager.canvas;
        const { menuX, menuY, menuWidth, menuHeight } = this._menuDimensions();

        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const {
            uiSf, tabHeight, tabStartY, tabButtonWidth,
            contentX, contentY, contentWidth, contentHeight,
            closeButtonSize, closeButtonX, closeButtonY
        } = this._getTabLayout(menuX, menuY, menuWidth, menuHeight);

        // Menu background
        ctx.fillStyle = '#2a1a0f';
        ctx.fillRect(menuX, menuY, menuWidth, menuHeight);

        // Menu border
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 2;
        ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

        // Draw corner trim on all four corners
        this.drawCornerTrim(ctx, menuX, menuY, 15, true, false, false, false);
        this.drawCornerTrim(ctx, menuX + menuWidth, menuY, 15, false, true, false, false);
        this.drawCornerTrim(ctx, menuX, menuY + menuHeight, 15, false, false, true, false);
        this.drawCornerTrim(ctx, menuX + menuWidth, menuY + menuHeight, 15, false, false, false, true);

        // Menu title
        ctx.font = `bold ${Math.round(24 * uiSf)}px serif`;
        ctx.fillStyle = '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('ARCANE LIBRARY', menuX + menuWidth / 2, menuY + Math.round(8 * uiSf));

        // Render tabs
        this.tabs.forEach((tab, index) => {
            const tabX = menuX + index * tabButtonWidth;
            const tabY = tabStartY;

            const isActive = this.activeTab === tab.id;
            ctx.fillStyle = isActive ? '#3d2817' : '#261200';
            ctx.fillRect(tabX, tabY, tabButtonWidth, tabHeight);

            ctx.strokeStyle = isActive ? '#d4af37' : '#8b7355';
            ctx.lineWidth = isActive ? 2 : 1;
            ctx.strokeRect(tabX, tabY, tabButtonWidth, tabHeight);

            ctx.font = isActive
                ? `bold ${Math.round(13 * uiSf)}px Trebuchet MS, sans-serif`
                : `${Math.round(13 * uiSf)}px Trebuchet MS, sans-serif`;
            ctx.fillStyle = isActive ? '#ffd700' : '#d4af37';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tab.label, tabX + tabButtonWidth / 2, tabY + tabHeight / 2);
        });

        // Content background
        ctx.fillStyle = '#1a0f0a';
        ctx.fillRect(contentX, contentY, contentWidth, contentHeight);
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 1;
        ctx.strokeRect(contentX, contentY, contentWidth, contentHeight);

        // Render active tab content
        if (this.activeTab === 'statistics') {
            this.renderStatisticsTab(ctx, contentX, contentY, contentWidth, contentHeight);
        } else if (this.activeTab === 'achievements') {
            this.achievementsView.render(ctx, contentX, contentY, contentWidth, contentHeight, uiSf);
        } else if (this.activeTab === 'enemy-intel') {
            this.renderEnemyIntelTab(ctx, contentX, contentY, contentWidth, contentHeight);
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

        ctx.globalAlpha = 1;
    }

    renderStatisticsTab(ctx, x, y, width, height) {
        const stats = this.stateManager.gameStatistics || {
            victories: 0, defeats: 0, totalEnemiesSlain: 0,
            totalPlaytime: 0, totalItemsConsumed: 0,
            totalMoneySpentOnMarketplace: 0, totalMoneyEarnedInMarketplace: 0,
            totalItemsSold: 0,
            getWinRate: () => 0, getFormattedPlaytime: () => '0s'
        };

        const padding = 20;
        const lineHeight = 28;
        let currentY = y + padding;

        // ── Commander title plaque ───────────────────────────────────────────
        const achievementSystem = this.stateManager.achievementSystem;
        if (achievementSystem) {
            const scoreSummary = achievementSystem.getScoreSummary();
            const plaqueH = 40;

            const plaqueGrad = ctx.createLinearGradient(x + padding, currentY, x + width - padding, currentY);
            plaqueGrad.addColorStop(0, 'rgba(15, 42, 74, 0.55)');
            plaqueGrad.addColorStop(1, 'rgba(95, 176, 232, 0.18)');
            ctx.fillStyle = plaqueGrad;
            ctx.fillRect(x + padding, currentY, width - padding * 2, plaqueH);
            ctx.strokeStyle = '#1d3a52';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + padding, currentY, width - padding * 2, plaqueH);

            ctx.font = 'bold 11px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#6f8aa3';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('COMMANDER TITLE', x + padding + 10, currentY + 6);

            ctx.font = 'bold 16px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#a8d4f5';
            ctx.fillText(scoreSummary.title, x + padding + 10, currentY + 19);

            ctx.font = '11px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#6f8aa3';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            const rightLabel = scoreSummary.isMaxTitle
                ? `${scoreSummary.earnedPoints} / ${scoreSummary.totalPoints} pts — MAX`
                : `${scoreSummary.earnedPoints} / ${scoreSummary.nextThreshold} pts to ${scoreSummary.nextTitle}`;
            ctx.fillText(rightLabel, x + width - padding - 10, currentY + plaqueH / 2);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            currentY += plaqueH + 14;
        }

        ctx.font = '14px Trebuchet MS, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const stats_data = [
            { label: 'Victories:', value: stats.victories },
            { label: 'Defeats:', value: stats.defeats },
            { label: 'Win Rate:', value: stats.getWinRate() + '%' },
            { label: 'Enemies Slain:', value: stats.totalEnemiesSlain },
            { label: 'Playtime:', value: stats.getFormattedPlaytime() },
            { label: 'Items Consumed:', value: stats.totalItemsConsumed },
            { label: 'Items Sold:', value: stats.totalItemsSold },
            { label: 'Marketplace Spent:', value: stats.totalMoneySpentOnMarketplace + ' gold' },
            { label: 'Marketplace Earned:', value: stats.totalMoneyEarnedInMarketplace + ' gold' }
        ];

        stats_data.forEach(stat => {
            // Label
            ctx.fillStyle = '#d4af37';
            ctx.fillText(stat.label, x + padding, currentY);

            // Value
            ctx.fillStyle = '#ffd700';
            ctx.textAlign = 'right';
            ctx.fillText(String(stat.value), x + width - padding, currentY);
            ctx.textAlign = 'left';

            currentY += lineHeight;
        });
    }

    renderEnemyIntelTab(ctx, x, y, width, height) {
        // Get unlocked enemy intel from marketplace system
        const unlockedIntelPacks = this.stateManager?.marketplaceSystem?.getUnlockedEnemyIntel() || [];
        const unlockedEnemies = EnemyIntelRegistry.getUnlockedEnemies(unlockedIntelPacks);

        // If no intel unlocked, show message
        if (unlockedEnemies.length === 0) {
            ctx.font = 'bold 14px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#8b7355';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Purchase Intel packs to unlock enemy information', x + width / 2, y + height / 2 - 20);
            ctx.font = '12px Trebuchet MS, sans-serif';
            ctx.fillText('Visit the marketplace to buy spy reports', x + width / 2, y + height / 2 + 20);
            return;
        }

        // Layout: left side = enemy list buttons, right side = detail panel
        const listW = 230;
        const gap = 10;
        const detailX = x + listW + gap;
        const detailW = width - listW - gap;
        const btnH = 36;
        const btnGap = 4;
        const itemsPerPage = this.intelItemsPerPage;
        const totalPages = Math.ceil(unlockedEnemies.length / itemsPerPage);
        const startIdx = this.intelCurrentPage * itemsPerPage;
        const endIdx = Math.min(startIdx + itemsPerPage, unlockedEnemies.length);

        // ── Enemy list buttons ───────────────────────────────────────────────
        for (let i = startIdx; i < endIdx; i++) {
            const rowIdx = i - startIdx;
            const enemyId = unlockedEnemies[i];
            const intel = EnemyIntelRegistry.getEnemyIntel(enemyId);
            if (!intel) continue;

            const btnY = y + 8 + rowIdx * (btnH + btnGap);
            const isSelected = this.selectedEnemyId === enemyId;
            const isHovered = this.hoveredEnemyId === enemyId;

            // Button background
            if (isSelected) {
                const bg = ctx.createLinearGradient(x, btnY, x, btnY + btnH);
                bg.addColorStop(0, '#5a3d1a');
                bg.addColorStop(1, '#3d2410');
                ctx.fillStyle = bg;
            } else if (isHovered) {
                ctx.fillStyle = 'rgba(80, 55, 25, 0.8)';
            } else {
                ctx.fillStyle = 'rgba(30, 18, 8, 0.7)';
            }
            ctx.fillRect(x, btnY, listW, btnH);

            // Button border
            ctx.strokeStyle = isSelected ? '#ffd700' : (isHovered ? '#c8a84b' : 'rgba(140, 110, 50, 0.5)');
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.strokeRect(x, btnY, listW, btnH);

            // Selected indicator bar on the left
            if (isSelected) {
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(x, btnY, 3, btnH);
            }

            // Thumbnail image or placeholder square
            const thumbSize = 26;
            const thumbX = x + 8;
            const thumbY = btnY + (btnH - thumbSize) / 2;
            const cachedImg = this.enemyImageCache[enemyId];
            if (cachedImg) {
                ctx.drawImage(cachedImg, thumbX, thumbY, thumbSize, thumbSize);
            } else {
                ctx.fillStyle = 'rgba(60, 40, 15, 0.9)';
                ctx.fillRect(thumbX, thumbY, thumbSize, thumbSize);
                ctx.strokeStyle = 'rgba(140, 110, 50, 0.6)';
                ctx.lineWidth = 1;
                ctx.strokeRect(thumbX, thumbY, thumbSize, thumbSize);
            }

            // Enemy name
            ctx.font = isSelected ? 'bold 12px Trebuchet MS, sans-serif' : '12px Trebuchet MS, sans-serif';
            ctx.fillStyle = isSelected ? '#ffd700' : (isHovered ? '#e8d49a' : '#c9a876');
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(intel.name, thumbX + thumbSize + 8, btnY + btnH / 2);
        }

        // Pagination arrows (below the list)
        if (totalPages > 1) {
            const arrowY = y + height - 34;
            const arrowSize = 26;
            const leftArrowX = x + 8;
            const rightArrowX = x + listW - arrowSize - 8;

            // Left arrow
            ctx.fillStyle = this.intelCurrentPage > 0
                ? (this.intelLeftArrowHovered ? '#ffd700' : '#c8a84b')
                : '#333333';
            ctx.fillRect(leftArrowX, arrowY, arrowSize, arrowSize);
            ctx.strokeStyle = '#6a501e';
            ctx.lineWidth = 1;
            ctx.strokeRect(leftArrowX, arrowY, arrowSize, arrowSize);
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = this.intelCurrentPage > 0 ? '#1a0f04' : '#555555';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('<', leftArrowX + arrowSize / 2, arrowY + arrowSize / 2);

            // Right arrow
            ctx.fillStyle = this.intelCurrentPage < totalPages - 1
                ? (this.intelRightArrowHovered ? '#ffd700' : '#c8a84b')
                : '#333333';
            ctx.fillRect(rightArrowX, arrowY, arrowSize, arrowSize);
            ctx.strokeStyle = '#6a501e';
            ctx.lineWidth = 1;
            ctx.strokeRect(rightArrowX, arrowY, arrowSize, arrowSize);
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = this.intelCurrentPage < totalPages - 1 ? '#1a0f04' : '#555555';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('>', rightArrowX + arrowSize / 2, arrowY + arrowSize / 2);

            // Page indicator
            ctx.font = '10px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#8b7355';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${this.intelCurrentPage + 1}/${totalPages}`, x + listW / 2, arrowY + arrowSize / 2);
        }

        // ── Detail panel (right side) ────────────────────────────────────────
        // Panel background
        ctx.fillStyle = 'rgba(15, 10, 4, 0.8)';
        ctx.fillRect(detailX, y, detailW, height);
        ctx.strokeStyle = 'rgba(140, 110, 50, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(detailX, y, detailW, height);

        // Show detail for selected enemy only (click to select)
        const displayId = this.selectedEnemyId;
        const intel = displayId ? EnemyIntelRegistry.getEnemyIntel(displayId) : null;

        if (!intel) {
            ctx.font = '13px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#5a4a3a';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Select an enemy to view details', detailX + detailW / 2, y + height / 2);
            return;
        }

        const pad = 14;
        let cy = y + pad;

        // Portrait image
        const portraitSize = Math.min(detailW - pad * 2, 80);
        const portraitX = detailX + (detailW - portraitSize) / 2;
        const cachedPortrait = this.enemyImageCache[displayId];
        const portraitBgX = detailX + (detailW - portraitSize) / 2;

        ctx.fillStyle = 'rgba(40, 25, 10, 0.9)';
        ctx.fillRect(portraitBgX, cy, portraitSize, portraitSize);
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(portraitBgX, cy, portraitSize, portraitSize);

        if (cachedPortrait) {
            ctx.drawImage(cachedPortrait, portraitBgX, cy, portraitSize, portraitSize);
        } else {
            // Placeholder label
            ctx.font = '10px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#4a3a28';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Portrait', portraitBgX + portraitSize / 2, cy + portraitSize / 2);
        }
        cy += portraitSize + 10;

        // Enemy name
        ctx.font = 'bold 15px Georgia, serif';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(intel.name, detailX + detailW / 2, cy);
        cy += 20;

        // Divider
        ctx.strokeStyle = 'rgba(140, 110, 50, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(detailX + pad, cy);
        ctx.lineTo(detailX + detailW - pad, cy);
        ctx.stroke();
        cy += 8;

        // Description (word-wrapped)
        ctx.font = '11px Trebuchet MS, sans-serif';
        ctx.fillStyle = '#b09060';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const descWords = intel.description.split(' ');
        let descLine = '';
        const maxDescW = detailW - pad * 2;
        for (const word of descWords) {
            const test = descLine ? descLine + ' ' + word : word;
            if (ctx.measureText(test).width > maxDescW && descLine) {
                ctx.fillText(descLine, detailX + pad, cy);
                descLine = word;
                cy += 14;
            } else {
                descLine = test;
            }
        }
        if (descLine) { ctx.fillText(descLine, detailX + pad, cy); cy += 14; }
        cy += 6;

        // Stats
        ctx.font = 'bold 11px Trebuchet MS, sans-serif';
        ctx.fillStyle = '#d4af37';
        ctx.textAlign = 'left';
        ctx.fillText('BASE STATS', detailX + pad, cy);
        cy += 14;

        const statColor = { hp: '#7ec87e', spd: '#7eafd4', dmg: '#d47e7e', arm: '#c8c8d4', mag: '#b47ec8' };
        const statRows = [
            { label: 'Health', value: intel.stats.health, color: statColor.hp },
            { label: 'Speed', value: intel.stats.speed, color: statColor.spd },
            { label: 'Armour', value: intel.stats.armour ?? 0, color: statColor.arm },
            { label: 'Damage', value: intel.stats.damage, color: statColor.dmg }
        ];
        for (const stat of statRows) {
            ctx.font = '11px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#8b7355';
            ctx.textAlign = 'left';
            ctx.fillText(stat.label + ':', detailX + pad, cy);
            ctx.fillStyle = stat.color;
            ctx.textAlign = 'right';
            ctx.fillText(String(stat.value), detailX + detailW - pad, cy);
            cy += 14;
        }
        cy += 2;

        // Magic resistance / elemental notes
        const magRes = intel.stats.magicResistance;
        if (typeof magRes === 'number' && magRes !== 0) {
            let magLabel, magColor;
            if (magRes > 0) {
                magLabel = 'Magic Resist: ' + Math.round(magRes * 100) + '%';
                magColor = statColor.mag;
            } else {
                magLabel = 'Magic Weak: +' + Math.round(-magRes * 100) + '%';
                magColor = '#d4827e';
            }
            ctx.font = '10px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#8b7355';
            ctx.textAlign = 'left';
            ctx.fillText('Magic:', detailX + pad, cy);
            ctx.fillStyle = magColor;
            ctx.textAlign = 'right';
            ctx.fillText(magLabel, detailX + detailW - pad, cy);
            cy += 14;
        }
        cy += 4;

        // Abilities
        if (intel.abilities && intel.abilities.length > 0) {
            ctx.font = 'bold 11px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#d4af37';
            ctx.textAlign = 'left';
            ctx.fillText('ABILITIES', detailX + pad, cy);
            cy += 14;
            ctx.font = '10px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#a09060';
            for (const ability of intel.abilities) {
                if (cy > y + height - pad) break;
                ctx.fillText('· ' + ability, detailX + pad + 4, cy);
                cy += 12;
            }
        }
    }

    renderCollectionTab(ctx, x, y, width, height) {
        ctx.font = '16px Trebuchet MS, sans-serif';
        ctx.fillStyle = '#8b7355';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Collection feature coming soon...', x + width / 2, y + height / 2);
    }
}
