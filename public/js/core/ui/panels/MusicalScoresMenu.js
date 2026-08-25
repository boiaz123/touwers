import { SaveSystem } from '../../systems/SaveSystem.js';
import { MarketplaceRegistry } from '../../registries/MarketplaceRegistry.js';

export class MusicalScoresMenu {
    constructor(stateManager, settlementHub) {
        this.stateManager = stateManager;
        this.settlementHub = settlementHub;
        this.isOpen = false;
        this.animationProgress = 0;
        this.openTime = 0;

        this.musicCurrentPage = 0;
        this.musicItemsPerPage = 9;
        this.unlockedMusicTracks = new Map();

        this.closeButtonHovered = false;
        this.leftArrowHovered = false;
        this.rightArrowHovered = false;
        this.supportBardButtonHovered = false;

        this.showSupportConfirm = false;
        this.supportConfirmOpenTime = 0;
        this.supportConfirmOpenHovered = false;
        this.supportConfirmCancelHovered = false;
    }

    open() {
        this.isOpen = true;
        this.animationProgress = 0;
        this.openTime = Date.now();
        this.musicCurrentPage = 0;
        this.buildUnlockedMusicList();
    }

    close() {
        this.isOpen = false;
        this.settlementHub.closePopup();
    }

    buildUnlockedMusicList() {
        this.unlockedMusicTracks.clear();
        if (this.stateManager.marketplaceSystem) {
            const musicItems = MarketplaceRegistry.getItemsByCategory('music');
            for (const [itemId, itemData] of Object.entries(musicItems)) {
                const count = this.stateManager.marketplaceSystem.getConsumableCount(itemId);
                if (count > 0) {
                    this.unlockedMusicTracks.set(itemData.musicId, {
                        id: itemId,
                        name: itemData.name,
                        musicId: itemData.musicId,
                        isPlaying: false
                    });
                }
            }
        }
    }

    openSupportConfirm() {
        this.showSupportConfirm = true;
        this.supportConfirmOpenTime = Date.now();
    }

    confirmOpenBardWebsite() {
        const url = 'http://kardipaseyan.nl/';
        this.showSupportConfirm = false;
        // Opened directly from the click handler (not from inside a blocking
        // native dialog) so the browser still treats this as a user-triggered
        // action and won't pop-up-block it.
        const tauriInvoke = SaveSystem.getTauriInvoke();
        if (tauriInvoke) {
            tauriInvoke('open_external_url', { url }).catch(err => {
                console.warn('Failed to open external URL via Tauri:', err);
            });
        } else {
            window.open(url, '_blank');
        }
    }

    playMusicTrack(music) {
        if (this.stateManager.audioManager) {
            this.stateManager.audioManager.musicPlaylistMode = false;
            this.stateManager.audioManager.playMusic(music.musicId, false);
            this.stateManager.audioManager.isManualMusicSelection = true;
        }
    }

    update(deltaTime) {
        if (this.isOpen && this.animationProgress < 1) {
            this.animationProgress += deltaTime * 2;
        }
    }

    getSupportConfirmBounds(canvas) {
        const dialogWidth = 420;
        const dialogHeight = 190;
        const dialogX = canvas.width / 2 - dialogWidth / 2;
        const dialogY = canvas.height / 2 - dialogHeight / 2;
        const buttonWidth = 150;
        const buttonHeight = 32;
        const buttonY = dialogY + dialogHeight - 50;
        const openBtn = {
            x: dialogX + dialogWidth / 2 - buttonWidth - 10,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        };
        const cancelBtn = {
            x: dialogX + dialogWidth / 2 + 10,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        };
        return { dialogX, dialogY, dialogWidth, dialogHeight, openBtn, cancelBtn };
    }

    updateHoverState(x, y) {
        const canvas = this.stateManager.canvas;

        if (this.showSupportConfirm) {
            const { openBtn, cancelBtn } = this.getSupportConfirmBounds(canvas);
            this.supportConfirmOpenHovered = x >= openBtn.x && x <= openBtn.x + openBtn.width &&
                                             y >= openBtn.y && y <= openBtn.y + openBtn.height;
            this.supportConfirmCancelHovered = x >= cancelBtn.x && x <= cancelBtn.x + cancelBtn.width &&
                                               y >= cancelBtn.y && y <= cancelBtn.y + cancelBtn.height;
            canvas.style.cursor = (this.supportConfirmOpenHovered || this.supportConfirmCancelHovered) ? 'pointer' : 'default';
            return;
        }

        const menuX = canvas.width / 2 - 400;
        const menuY = canvas.height / 2 - 250;
        const menuWidth = 800;
        const menuHeight = 500;

        const closeButtonX = menuX + menuWidth - 35;
        const closeButtonY = menuY + 10;
        const closeButtonSize = 25;
        this.closeButtonHovered = x >= closeButtonX && x <= closeButtonX + closeButtonSize &&
                                  y >= closeButtonY && y <= closeButtonY + closeButtonSize;

        const supportBtnX = menuX + 20;
        const supportBtnY = menuY + 42;
        const supportBtnWidth = 160;
        const supportBtnHeight = 22;
        this.supportBardButtonHovered = x >= supportBtnX && x <= supportBtnX + supportBtnWidth &&
                                        y >= supportBtnY && y <= supportBtnY + supportBtnHeight;

        const contentX = menuX + 20;
        const contentY = menuY + 70;
        const contentWidth = menuWidth - 40;
        const contentHeight = menuHeight - 150;

        const cols = 3;
        const itemSize = 100;
        const padding = 15;
        const startX = contentX + (contentWidth - (cols * itemSize + (cols - 1) * padding)) / 2;
        const startY = contentY + 10;

        const musicArray = Array.from(this.unlockedMusicTracks.values());
        const startIdx = this.musicCurrentPage * this.musicItemsPerPage;
        const endIdx = Math.min(startIdx + this.musicItemsPerPage, musicArray.length);

        let musicItemHovered = false;
        for (let i = startIdx; i < endIdx; i++) {
            const gridIdx = i - startIdx;
            const col = gridIdx % cols;
            const row = Math.floor(gridIdx / cols);
            const itemX = startX + col * (itemSize + padding);
            const itemY = startY + row * (itemSize + padding);
            if (x >= itemX && x <= itemX + itemSize && y >= itemY && y <= itemY + itemSize) {
                musicItemHovered = true;
                break;
            }
        }

        this.leftArrowHovered = false;
        this.rightArrowHovered = false;
        const totalPages = Math.ceil(this.unlockedMusicTracks.size / this.musicItemsPerPage);
        if (totalPages > 1) {
            const arrowSize = 38;
            const paginationY = menuY + menuHeight - 68;
            const leftArrowX = menuX + 20;
            const rightArrowX = menuX + menuWidth - 58;
            this.leftArrowHovered = x >= leftArrowX && x <= leftArrowX + arrowSize &&
                                    y >= paginationY && y <= paginationY + arrowSize &&
                                    this.musicCurrentPage > 0;
            this.rightArrowHovered = x >= rightArrowX && x <= rightArrowX + arrowSize &&
                                     y >= paginationY && y <= paginationY + arrowSize &&
                                     this.musicCurrentPage < totalPages - 1;
        }

        this.stateManager.canvas.style.cursor =
            (this.closeButtonHovered || this.leftArrowHovered || this.rightArrowHovered ||
             this.supportBardButtonHovered || musicItemHovered)
                ? 'pointer' : 'default';
    }

    handleClick(x, y) {
        const canvas = this.stateManager.canvas;

        if (this.showSupportConfirm) {
            const timeSinceConfirmOpen = Date.now() - this.supportConfirmOpenTime;
            if (timeSinceConfirmOpen < 200) return;
            const { openBtn, cancelBtn } = this.getSupportConfirmBounds(canvas);
            if (x >= openBtn.x && x <= openBtn.x + openBtn.width &&
                y >= openBtn.y && y <= openBtn.y + openBtn.height) {
                this.confirmOpenBardWebsite();
            } else if (x >= cancelBtn.x && x <= cancelBtn.x + cancelBtn.width &&
                       y >= cancelBtn.y && y <= cancelBtn.y + cancelBtn.height) {
                this.showSupportConfirm = false;
            }
            return;
        }

        const timeSinceOpen = Date.now() - this.openTime;
        if (timeSinceOpen < 200) return;

        const menuX = canvas.width / 2 - 400;
        const menuY = canvas.height / 2 - 250;
        const menuWidth = 800;
        const menuHeight = 500;

        const closeButtonX = menuX + menuWidth - 35;
        const closeButtonY = menuY + 10;
        const closeButtonSize = 25;
        if (x >= closeButtonX && x <= closeButtonX + closeButtonSize &&
            y >= closeButtonY && y <= closeButtonY + closeButtonSize) {
            this.close();
            return;
        }

        const supportBtnX = menuX + 20;
        const supportBtnY = menuY + 42;
        const supportBtnWidth = 160;
        const supportBtnHeight = 22;
        if (x >= supportBtnX && x <= supportBtnX + supportBtnWidth &&
            y >= supportBtnY && y <= supportBtnY + supportBtnHeight) {
            this.openSupportConfirm();
            return;
        }

        const contentX = menuX + 20;
        const contentY = menuY + 70;
        const contentWidth = menuWidth - 40;

        const cols = 3;
        const itemSize = 100;
        const padding = 15;
        const startX = contentX + (contentWidth - (cols * itemSize + (cols - 1) * padding)) / 2;
        const startY = contentY + 10;

        const musicArray = Array.from(this.unlockedMusicTracks.values());
        const startIdx = this.musicCurrentPage * this.musicItemsPerPage;
        const endIdx = Math.min(startIdx + this.musicItemsPerPage, musicArray.length);

        for (let i = startIdx; i < endIdx; i++) {
            const gridIdx = i - startIdx;
            const col = gridIdx % cols;
            const row = Math.floor(gridIdx / cols);
            const itemX = startX + col * (itemSize + padding);
            const itemY = startY + row * (itemSize + padding);
            if (x >= itemX && x <= itemX + itemSize && y >= itemY && y <= itemY + itemSize) {
                this.playMusicTrack(musicArray[i]);
                return;
            }
        }

        const totalPages = Math.ceil(this.unlockedMusicTracks.size / this.musicItemsPerPage);
        if (totalPages > 1) {
            const arrowSize = 38;
            const paginationY = menuY + menuHeight - 68;
            const leftArrowX = menuX + 20;
            const rightArrowX = menuX + menuWidth - 58;
            if (x >= leftArrowX && x <= leftArrowX + arrowSize &&
                y >= paginationY && y <= paginationY + arrowSize && this.musicCurrentPage > 0) {
                this.musicCurrentPage--;
                return;
            }
            if (x >= rightArrowX && x <= rightArrowX + arrowSize &&
                y >= paginationY && y <= paginationY + arrowSize && this.musicCurrentPage < totalPages - 1) {
                this.musicCurrentPage++;
                return;
            }
        }
    }

    drawCornerTrim(ctx, x, y, size, isTopLeft, isTopRight, isBottomLeft, isBottomRight) {
        ctx.fillStyle = '#d4af37';
        if (isTopLeft) { ctx.fillRect(x, y, size, 3); ctx.fillRect(x, y, 3, size); }
        else if (isTopRight) { ctx.fillRect(x - size, y, size, 3); ctx.fillRect(x - 3, y, 3, size); }
        else if (isBottomLeft) { ctx.fillRect(x, y - 3, size, 3); ctx.fillRect(x, y - size, 3, size); }
        else if (isBottomRight) { ctx.fillRect(x - size, y - 3, size, 3); ctx.fillRect(x - 3, y - size, 3, size); }
        ctx.fillStyle = '#ffd700';
        const g = 4;
        if (isTopLeft) { ctx.beginPath(); ctx.arc(x + g, y + g, g / 2, 0, Math.PI * 2); ctx.fill(); }
        else if (isTopRight) { ctx.beginPath(); ctx.arc(x - g, y + g, g / 2, 0, Math.PI * 2); ctx.fill(); }
        else if (isBottomLeft) { ctx.beginPath(); ctx.arc(x + g, y - g, g / 2, 0, Math.PI * 2); ctx.fill(); }
        else if (isBottomRight) { ctx.beginPath(); ctx.arc(x - g, y - g, g / 2, 0, Math.PI * 2); ctx.fill(); }
    }

    render(ctx) {
        const canvas = this.stateManager.canvas;
        const menuX = canvas.width / 2 - 400;
        const menuY = canvas.height / 2 - 250;
        const menuWidth = 800;
        const menuHeight = 500;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#2a1a0f';
        ctx.fillRect(menuX, menuY, menuWidth, menuHeight);

        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 2;
        ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

        this.drawCornerTrim(ctx, menuX, menuY, 15, true, false, false, false);
        this.drawCornerTrim(ctx, menuX + menuWidth, menuY, 15, false, true, false, false);
        this.drawCornerTrim(ctx, menuX, menuY + menuHeight, 15, false, false, true, false);
        this.drawCornerTrim(ctx, menuX + menuWidth, menuY + menuHeight, 15, false, false, false, true);

        ctx.font = 'bold 24px serif';
        ctx.fillStyle = '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('MUSICAL SCORES', menuX + menuWidth / 2, menuY + 8);

        // "Support the Bard" button - links out to Joost the Bard's website
        const supportBtnX = menuX + 20;
        const supportBtnY = menuY + 42;
        const supportBtnWidth = 160;
        const supportBtnHeight = 22;
        ctx.fillStyle = this.supportBardButtonHovered ? '#8b6f47' : '#3d2817';
        ctx.fillRect(supportBtnX, supportBtnY, supportBtnWidth, supportBtnHeight);
        ctx.strokeStyle = this.supportBardButtonHovered ? '#ffd700' : '#8b7355';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(supportBtnX, supportBtnY, supportBtnWidth, supportBtnHeight);
        ctx.font = 'bold 11px Trebuchet MS, sans-serif';
        ctx.fillStyle = this.supportBardButtonHovered ? '#ffd700' : '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Support the Bard', supportBtnX + supportBtnWidth / 2, supportBtnY + supportBtnHeight / 2 + 1);

        const contentX = menuX + 20;
        const contentY = menuY + 70;
        const contentWidth = menuWidth - 40;
        const contentHeight = menuHeight - 150;

        ctx.fillStyle = '#1a0f0a';
        ctx.fillRect(contentX, contentY, contentWidth, contentHeight);
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 1;
        ctx.strokeRect(contentX, contentY, contentWidth, contentHeight);

        this.renderContent(ctx, contentX, contentY, contentWidth, contentHeight);

        // Pagination controls (styled like marketplace)
        const totalPages = Math.ceil(this.unlockedMusicTracks.size / this.musicItemsPerPage);
        if (totalPages > 1) {
            const arrowSize = 38;
            const paginationY = menuY + menuHeight - 68;
            const leftArrowX = menuX + 20;
            const rightArrowX = menuX + menuWidth - 58;

            // Left arrow
            ctx.fillStyle = this.leftArrowHovered ? '#8b6f47' : '#5a4a3a';
            ctx.fillRect(leftArrowX, paginationY, arrowSize, arrowSize);
            ctx.fillStyle = this.leftArrowHovered ? '#9b7f57' : '#6a5a4a';
            ctx.fillRect(leftArrowX, paginationY, arrowSize, 1);
            ctx.strokeStyle = this.leftArrowHovered ? '#ffd700' : '#5a4a3a';
            ctx.lineWidth = 2;
            ctx.strokeRect(leftArrowX, paginationY, arrowSize, arrowSize);
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = this.musicCurrentPage > 0 ? (this.leftArrowHovered ? '#ffd700' : '#d4af37') : '#4a3a2a';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('◄', leftArrowX + arrowSize / 2, paginationY + arrowSize / 2);

            // Right arrow
            ctx.fillStyle = this.rightArrowHovered ? '#8b6f47' : '#5a4a3a';
            ctx.fillRect(rightArrowX, paginationY, arrowSize, arrowSize);
            ctx.fillStyle = this.rightArrowHovered ? '#9b7f57' : '#6a5a4a';
            ctx.fillRect(rightArrowX, paginationY, arrowSize, 1);
            ctx.strokeStyle = this.rightArrowHovered ? '#ffd700' : '#5a4a3a';
            ctx.lineWidth = 2;
            ctx.strokeRect(rightArrowX, paginationY, arrowSize, arrowSize);
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = this.musicCurrentPage < totalPages - 1 ? (this.rightArrowHovered ? '#ffd700' : '#d4af37') : '#4a3a2a';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('►', rightArrowX + arrowSize / 2, paginationY + arrowSize / 2);

            // Page indicator
            ctx.font = 'bold 18px Arial';
            ctx.fillStyle = '#d4af37';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`Page ${this.musicCurrentPage + 1} / ${totalPages}`, menuX + menuWidth / 2, paginationY + arrowSize / 2);
        }

        const closeButtonX = menuX + menuWidth - 35;
        const closeButtonY = menuY + 10;
        const closeButtonSize = 25;
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.fillStyle = this.closeButtonHovered ? '#ff6666' : '#cc0000';
        ctx.fillRect(closeButtonX, closeButtonY, closeButtonSize, closeButtonSize);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(closeButtonX, closeButtonY, closeButtonSize, closeButtonSize);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('×', closeButtonX + closeButtonSize / 2, closeButtonY + closeButtonSize / 2 + 1);
        ctx.restore();

        ctx.globalAlpha = 1;

        if (this.showSupportConfirm) {
            this.renderSupportConfirmDialog(ctx, canvas);
        }
    }

    renderSupportConfirmDialog(ctx, canvas) {
        const { dialogX, dialogY, dialogWidth, dialogHeight, openBtn, cancelBtn } = this.getSupportConfirmBounds(canvas);

        // Dim everything behind the dialog, including the menu itself
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#2a1a0f';
        ctx.fillRect(dialogX, dialogY, dialogWidth, dialogHeight);
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 2;
        ctx.strokeRect(dialogX, dialogY, dialogWidth, dialogHeight);

        this.drawCornerTrim(ctx, dialogX, dialogY, 12, true, false, false, false);
        this.drawCornerTrim(ctx, dialogX + dialogWidth, dialogY, 12, false, true, false, false);
        this.drawCornerTrim(ctx, dialogX, dialogY + dialogHeight, 12, false, false, true, false);
        this.drawCornerTrim(ctx, dialogX + dialogWidth, dialogY + dialogHeight, 12, false, false, false, true);

        ctx.font = 'bold 18px serif';
        ctx.fillStyle = '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('Support the Bard', dialogX + dialogWidth / 2, dialogY + 16);

        ctx.font = '13px Trebuchet MS, sans-serif';
        ctx.fillStyle = '#e8d5b5';
        const lines = [
            'This will open a new window and take you to the',
            "website of Joost the Bard:",
            'kardipaseyan.nl'
        ];
        lines.forEach((line, idx) => {
            ctx.fillText(line, dialogX + dialogWidth / 2, dialogY + 52 + idx * 18);
        });

        // Open Website button
        ctx.fillStyle = this.supportConfirmOpenHovered ? '#8b6f47' : '#3d2817';
        ctx.fillRect(openBtn.x, openBtn.y, openBtn.width, openBtn.height);
        ctx.strokeStyle = this.supportConfirmOpenHovered ? '#ffd700' : '#8b7355';
        ctx.lineWidth = 2;
        ctx.strokeRect(openBtn.x, openBtn.y, openBtn.width, openBtn.height);
        ctx.font = 'bold 13px Trebuchet MS, sans-serif';
        ctx.fillStyle = this.supportConfirmOpenHovered ? '#ffd700' : '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Open Website', openBtn.x + openBtn.width / 2, openBtn.y + openBtn.height / 2 + 1);

        // Cancel button
        ctx.fillStyle = this.supportConfirmCancelHovered ? '#5a3a3a' : '#3d2817';
        ctx.fillRect(cancelBtn.x, cancelBtn.y, cancelBtn.width, cancelBtn.height);
        ctx.strokeStyle = this.supportConfirmCancelHovered ? '#ff6666' : '#8b7355';
        ctx.lineWidth = 2;
        ctx.strokeRect(cancelBtn.x, cancelBtn.y, cancelBtn.width, cancelBtn.height);
        ctx.fillStyle = this.supportConfirmCancelHovered ? '#ff6666' : '#d4af37';
        ctx.fillText('Cancel', cancelBtn.x + cancelBtn.width / 2, cancelBtn.y + cancelBtn.height / 2 + 1);
    }

    renderContent(ctx, x, y, width, height) {
        if (this.unlockedMusicTracks.size === 0) {
            ctx.font = '16px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#8b7355';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('No musical scores unlocked yet.', x + width / 2, y + height / 2);
            ctx.fillText('Purchase scores at the Marketplace!', x + width / 2, y + height / 2 + 25);
            return;
        }

        const cols = 3;
        const itemSize = 100;
        const padding = 15;
        const startX = x + (width - (cols * itemSize + (cols - 1) * padding)) / 2;
        const startY = y + 10;

        const musicArray = Array.from(this.unlockedMusicTracks.values());
        const startIdx = this.musicCurrentPage * this.musicItemsPerPage;
        const endIdx = Math.min(startIdx + this.musicItemsPerPage, musicArray.length);

        for (let i = startIdx; i < endIdx; i++) {
            const music = musicArray[i];
            const gridIdx = i - startIdx;
            const col = gridIdx % cols;
            const row = Math.floor(gridIdx / cols);
            const itemX = startX + col * (itemSize + padding);
            const itemY = startY + row * (itemSize + padding);

            ctx.fillStyle = '#3d2817';
            ctx.fillRect(itemX, itemY, itemSize, itemSize);
            ctx.strokeStyle = '#8b7355';
            ctx.lineWidth = 2;
            ctx.strokeRect(itemX, itemY, itemSize, itemSize);

            ctx.save();
            const ncx = itemX + itemSize / 2;
            const ncy = itemY + itemSize / 3;
            const ns = 14;
            ctx.fillStyle = '#d4af37';
            ctx.strokeStyle = '#c8960a';
            ctx.beginPath();
            ctx.ellipse(ncx - ns * 0.08, ncy + ns * 0.28, ns * 0.13, ns * 0.09, -0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(ncx + ns * 0.05, ncy + ns * 0.2);
            ctx.lineTo(ncx + ns * 0.05, ncy - ns * 0.28);
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = ns * 0.04;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(ncx + ns * 0.05, ncy - ns * 0.28);
            ctx.quadraticCurveTo(ncx + ns * 0.35, ncy - ns * 0.05, ncx + ns * 0.22, ncy + ns * 0.12);
            ctx.stroke();
            ctx.restore();

            ctx.font = 'bold 9px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#ffd700';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            const maxLines = 3;
            const lineHeight = 11;
            const textTop = itemY + 42;
            const words = music.name.split(' ');
            const lines = [];
            let line = '';
            words.forEach(word => {
                const testLine = line + (line ? ' ' : '') + word;
                if (ctx.measureText(testLine).width > itemSize - 10 && line) {
                    lines.push(line);
                    line = word;
                } else {
                    line = testLine;
                }
            });
            if (line) lines.push(line);
            if (lines.length > maxLines) {
                lines.length = maxLines;
                lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*$/, '') + '…';
            }
            lines.forEach((l, idx) => {
                ctx.fillText(l, itemX + itemSize / 2, textTop + idx * lineHeight);
            });

            const playButtonSize = 20;
            const playButtonX = itemX + itemSize / 2 - playButtonSize / 2;
            const playButtonY = itemY + itemSize - 25;
            ctx.fillStyle = '#d4af37';
            ctx.fillRect(playButtonX, playButtonY, playButtonSize, playButtonSize);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.strokeRect(playButtonX, playButtonY, playButtonSize, playButtonSize);
            ctx.fillStyle = '#1a0f0a';
            ctx.beginPath();
            ctx.moveTo(playButtonX + 6, playButtonY + 4);
            ctx.lineTo(playButtonX + 6, playButtonY + 16);
            ctx.lineTo(playButtonX + 16, playButtonY + 10);
            ctx.closePath();
            ctx.fill();
        }
    }
}
