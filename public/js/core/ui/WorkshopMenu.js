/**
 * WorkshopMenu - The Workshop shop popup.
 * Lets the player spend gold (+ a per-enemy token) to unlock enemy types,
 * and gold to unlock campaign themes, both for use in the Level Designer.
 * Opened from the Workshop building on the Settlement Hub map, only once
 * the Commander's Workshop upgrade has been purchased.
 */
import { WorkshopRegistry } from '../registries/WorkshopRegistry.js';
import { CampaignRegistry } from '../../game/CampaignRegistry.js';

const INTEL_PACK_NAMES = {
    'intel-pack-1': 'Spy Report I',
    'intel-pack-2': 'Spy Report II',
    'intel-pack-3': 'Spy Report III',
    'intel-pack-4': 'Spy Report IV'
};

export class WorkshopMenu {
    constructor(stateManager, settlementHub) {
        this.stateManager = stateManager;
        this.settlementHub = settlementHub;
        this.isOpen = false;
        this.animationProgress = 0;
        this.openTime = 0;

        this.tabs = [
            { label: 'ENEMY TYPES', id: 'enemies', hovered: false },
            { label: 'CAMPAIGN THEMES', id: 'themes', hovered: false }
        ];
        this.activeTab = 'enemies';

        this.closeButtonHovered = false;
        // Not a purchase category, so it isn't a tab - a standalone button pinned to the
        // bottom of the panel that navigates straight to the Commander's Workshop screen
        // (campaign-5: level slots + Level Designer).
        this.strategyButtonHovered = false;
        this.hoveredItemId = null;
        this.itemErrorEffects = []; // { text, x, y, life }
        this.glowEffects = []; // { text, x, y, life }

        this.playerGold = stateManager.playerGold || 0;
    }

    open() {
        this.isOpen = true;
        this.animationProgress = 0;
        this.openTime = Date.now();
        this.activeTab = 'enemies';
        this.hoveredItemId = null;
        this.playerGold = this.stateManager.playerGold || 0;
    }

    close() {
        this.isOpen = false;
        this.settlementHub.closePopup();
    }

    update(deltaTime) {
        if (this.isOpen && this.animationProgress < 1) {
            this.animationProgress += deltaTime * 2;
        }
        this.playerGold = this.stateManager.playerGold || 0;
        for (let i = this.itemErrorEffects.length - 1; i >= 0; i--) {
            this.itemErrorEffects[i].life -= deltaTime;
            if (this.itemErrorEffects[i].life <= 0) this.itemErrorEffects.splice(i, 1);
        }
        for (let i = this.glowEffects.length - 1; i >= 0; i--) {
            this.glowEffects[i].life -= deltaTime;
            if (this.glowEffects[i].life <= 0) this.glowEffects.splice(i, 1);
        }
    }

    // ---- Layout ----

    _menuDimensions() {
        const canvas = this.stateManager.canvas;
        const menuWidth = Math.min(Math.round(canvas.width * 0.72), 1120);
        const menuHeight = Math.min(Math.round(canvas.height * 0.78), 720);
        const menuX = Math.round(canvas.width / 2 - menuWidth / 2);
        const menuY = Math.round(canvas.height / 2 - menuHeight / 2);
        return { menuX, menuY, menuWidth, menuHeight };
    }

    _getTabLayout(menuX, menuY, menuWidth, menuHeight) {
        const uiSf = menuWidth / 800;
        const tabHeight = Math.round(40 * uiSf);
        const tabStartY = menuY + Math.round(52 * uiSf);
        const tabButtonWidth = menuWidth / this.tabs.length;
        const pad = Math.round(18 * uiSf);
        const contentX = menuX + pad;
        const contentY = tabStartY + tabHeight + pad;
        const contentWidth = menuWidth - pad * 2;
        const strategyButtonHeight = Math.round(48 * uiSf);
        const contentHeight = menuHeight - tabHeight - Math.round(78 * uiSf) - strategyButtonHeight - pad;
        const closeButtonSize = Math.round(28 * uiSf);
        const closeButtonX = menuX + menuWidth - closeButtonSize - Math.round(8 * uiSf);
        const closeButtonY = menuY + Math.round(8 * uiSf);
        return {
            uiSf, tabHeight, tabStartY, tabButtonWidth,
            contentX, contentY, contentWidth, contentHeight,
            closeButtonSize, closeButtonX, closeButtonY,
            strategyButtonHeight
        };
    }

    /** Bounds of the "STRATEGY TABLE ▶" button pinned to the bottom of the panel. */
    _getStrategyButtonBounds(menuX, menuY, menuWidth, menuHeight) {
        const { contentX, contentY, contentWidth, contentHeight, strategyButtonHeight, uiSf } =
            this._getTabLayout(menuX, menuY, menuWidth, menuHeight);
        const pad = Math.round(18 * uiSf);
        return {
            x: contentX,
            y: contentY + contentHeight + pad,
            width: contentWidth,
            height: strategyButtonHeight
        };
    }

    _getGridLayout(contentX, contentY, contentWidth, contentHeight, itemCount) {
        const cols = this.activeTab === 'enemies' ? 5 : 4;
        const pad = 14;
        const tileW = Math.floor((contentWidth - pad * (cols + 1)) / cols);
        const tileH = 132;
        return { cols, pad, tileW, tileH };
    }

    _getItems() {
        if (this.activeTab === 'enemies') {
            // Only enemies whose Spy Report (or, for the Frog King, campaign-4 completion)
            // has already been unlocked are shown at all - no padlocked previews here, the
            // grid just fills up with whatever the player currently has access to.
            return WorkshopRegistry.getAllEnemyIds()
                .map(id => WorkshopRegistry.getEnemyItem(id))
                .filter(item => this._getItemState(item).requirementMet);
        }
        return WorkshopRegistry.getAllThemeIds().map(id => WorkshopRegistry.getThemeItem(id));
    }

    _getItemState(item) {
        const workshopSystem = this.stateManager.workshopSystem;
        const saveData = this.stateManager.currentSaveData || {};
        const completedCampaigns = saveData.completedCampaigns || [];

        if (this.activeTab === 'enemies') {
            const unlockedIntelPacks = this.stateManager.marketplaceSystem
                ? this.stateManager.marketplaceSystem.getUnlockedEnemyIntel()
                : [];
            return {
                owned: workshopSystem ? workshopSystem.hasEnemyType(item.id) : false,
                requirementMet: WorkshopRegistry.isEnemyUnlockable(item.id, { completedCampaigns, unlockedIntelPacks }),
                tokenCount: workshopSystem ? workshopSystem.getTokenCount(item.id) : 0
            };
        }

        return {
            owned: workshopSystem ? workshopSystem.hasCampaignTheme(item.id) : false,
            requirementMet: WorkshopRegistry.isThemeUnlockable(item.id, { completedCampaigns }),
            tokenCount: 0
        };
    }

    _getLockMessage(item) {
        if (item.requiredIntelPack) {
            return `Requires ${INTEL_PACK_NAMES[item.requiredIntelPack] || 'Spy Intel'}`;
        }
        if (item.requiredCampaign) {
            const camp = CampaignRegistry.getCampaign(item.requiredCampaign);
            return `Complete ${camp ? camp.name : 'a previous campaign'}`;
        }
        return 'Locked';
    }

    _forEachTile(callback) {
        const { menuX, menuY, menuWidth, menuHeight } = this._menuDimensions();
        const { contentX, contentY, contentWidth, contentHeight } = this._getTabLayout(menuX, menuY, menuWidth, menuHeight);
        const items = this._getItems();
        const { cols, pad, tileW, tileH } = this._getGridLayout(contentX, contentY, contentWidth, contentHeight, items.length);

        items.forEach((item, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = contentX + pad + col * (tileW + pad);
            const y = contentY + pad + row * (tileH + pad);
            callback(item, x, y, tileW, tileH);
        });

        return { contentX, contentY, contentWidth, contentHeight };
    }

    // ---- Input ----

    updateHoverState(x, y) {
        const { menuX, menuY, menuWidth, menuHeight } = this._menuDimensions();
        const { tabHeight, tabStartY, tabButtonWidth, closeButtonSize, closeButtonX, closeButtonY } =
            this._getTabLayout(menuX, menuY, menuWidth, menuHeight);

        this.closeButtonHovered = x >= closeButtonX && x <= closeButtonX + closeButtonSize &&
            y >= closeButtonY && y <= closeButtonY + closeButtonSize;

        this.tabs.forEach((tab, index) => {
            const tabX = menuX + index * tabButtonWidth;
            tab.hovered = x >= tabX && x <= tabX + tabButtonWidth &&
                y >= tabStartY && y <= tabStartY + tabHeight;
        });

        const strategyBtn = this._getStrategyButtonBounds(menuX, menuY, menuWidth, menuHeight);
        this.strategyButtonHovered = x >= strategyBtn.x && x <= strategyBtn.x + strategyBtn.width &&
            y >= strategyBtn.y && y <= strategyBtn.y + strategyBtn.height;

        this.hoveredItemId = null;
        this._forEachTile((item, tx, ty, tw, th) => {
            if (x >= tx && x <= tx + tw && y >= ty && y <= ty + th) {
                this.hoveredItemId = item.id;
            }
        });

        this.stateManager.canvas.style.cursor =
            (this.tabs.some(t => t.hovered) || this.closeButtonHovered || this.hoveredItemId || this.strategyButtonHovered)
                ? 'pointer' : 'default';
    }

    handleClick(x, y) {
        const timeSinceOpen = Date.now() - this.openTime;
        if (timeSinceOpen < 200) return;

        const { menuX, menuY, menuWidth, menuHeight } = this._menuDimensions();
        const { tabHeight, tabStartY, tabButtonWidth, closeButtonSize, closeButtonX, closeButtonY } =
            this._getTabLayout(menuX, menuY, menuWidth, menuHeight);

        if (x >= closeButtonX && x <= closeButtonX + closeButtonSize &&
            y >= closeButtonY && y <= closeButtonY + closeButtonSize) {
            this.close();
            return;
        }

        const strategyBtn = this._getStrategyButtonBounds(menuX, menuY, menuWidth, menuHeight);
        if (x >= strategyBtn.x && x <= strategyBtn.x + strategyBtn.width &&
            y >= strategyBtn.y && y <= strategyBtn.y + strategyBtn.height) {
            if (this.stateManager.audioManager) this.stateManager.audioManager.playSFX('button-click');
            this.close();
            this.stateManager.changeState('campaign-5');
            return;
        }

        for (let i = 0; i < this.tabs.length; i++) {
            const tabX = menuX + i * tabButtonWidth;
            if (x >= tabX && x <= tabX + tabButtonWidth && y >= tabStartY && y <= tabStartY + tabHeight) {
                this.activeTab = this.tabs[i].id;
                return;
            }
        }

        let clicked = null;
        let clickedBounds = null;
        this._forEachTile((item, tx, ty, tw, th) => {
            if (clicked) return;
            if (x >= tx && x <= tx + tw && y >= ty && y <= ty + th) {
                clicked = item;
                clickedBounds = { x: tx, y: ty, w: tw, h: th };
            }
        });

        if (clicked) {
            this._handleItemAction(clicked, clickedBounds.x + clickedBounds.w / 2, clickedBounds.y + clickedBounds.h / 2);
        }
    }

    _handleItemAction(item, cx, cy) {
        const state = this._getItemState(item);
        if (state.owned) return;

        if (!state.requirementMet) {
            this._createError(this._getLockMessage(item), cx, cy);
            return;
        }

        if (this.activeTab === 'enemies' && state.tokenCount < 1) {
            this._createError(`Missing ${item.name} Token`, cx, cy);
            return;
        }

        if (this.playerGold < item.cost) {
            this._createError('Not Enough Gold', cx, cy);
            return;
        }

        this.playerGold -= item.cost;
        this.stateManager.playerGold = this.playerGold;

        if (this.activeTab === 'enemies') {
            this.stateManager.workshopSystem.spendToken(item.id, 1);
            this.stateManager.workshopSystem.unlockEnemyType(item.id);
        } else {
            this.stateManager.workshopSystem.unlockCampaignTheme(item.id);
        }

        if (this.stateManager.audioManager) {
            this.stateManager.audioManager.playSFX('upgrade');
        }

        if (this.stateManager.gameStatistics) {
            this.stateManager.gameStatistics.totalMoneySpentOnMarketplace += item.cost;
        }

        this.glowEffects.push({ text: `-${item.cost}g`, x: cx, y: cy, life: 1 });
    }

    _createError(text, x, y) {
        this.itemErrorEffects.push({ text, x, y, life: 1.4 });
    }

    // ---- Render ----

    render(ctx) {
        const canvas = this.stateManager.canvas;
        const { menuX, menuY, menuWidth, menuHeight } = this._menuDimensions();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const {
            uiSf, tabHeight, tabStartY, tabButtonWidth,
            contentX, contentY, contentWidth, contentHeight,
            closeButtonSize, closeButtonX, closeButtonY
        } = this._getTabLayout(menuX, menuY, menuWidth, menuHeight);

        // Panel background - warm wood, echoes the Workshop building/campaign-5 palette
        const bgGrad = ctx.createLinearGradient(menuX, menuY, menuX, menuY + menuHeight);
        bgGrad.addColorStop(0, '#2a1a0f');
        bgGrad.addColorStop(1, '#1c1008');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(menuX, menuY, menuWidth, menuHeight);

        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 2;
        ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

        // Title
        ctx.font = `bold ${Math.round(24 * uiSf)}px serif`;
        ctx.fillStyle = '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('WORKSHOP', menuX + menuWidth / 2, menuY + Math.round(8 * uiSf));

        // Gold display
        ctx.font = `${Math.round(13 * uiSf)}px Trebuchet MS, sans-serif`;
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`Gold: ${this.playerGold}`, menuX + Math.round(16 * uiSf), menuY + Math.round(10 * uiSf));

        // Tabs
        this.tabs.forEach((tab, index) => {
            const tabX = menuX + index * tabButtonWidth;
            const isActive = this.activeTab === tab.id;
            ctx.fillStyle = isActive ? '#3d2817' : '#261200';
            ctx.fillRect(tabX, tabStartY, tabButtonWidth, tabHeight);
            ctx.strokeStyle = isActive ? '#d4af37' : '#8b7355';
            ctx.lineWidth = isActive ? 2 : 1;
            ctx.strokeRect(tabX, tabStartY, tabButtonWidth, tabHeight);
            ctx.font = isActive
                ? `bold ${Math.round(13 * uiSf)}px Trebuchet MS, sans-serif`
                : `${Math.round(13 * uiSf)}px Trebuchet MS, sans-serif`;
            ctx.fillStyle = isActive ? '#ffd700' : '#d4af37';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tab.label, tabX + tabButtonWidth / 2, tabStartY + tabHeight / 2);
        });

        // Content background
        ctx.fillStyle = '#1a0f0a';
        ctx.fillRect(contentX, contentY, contentWidth, contentHeight);
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 1;
        ctx.strokeRect(contentX, contentY, contentWidth, contentHeight);

        this._renderTiles(ctx);
        this._renderStrategyButton(ctx, menuX, menuY, menuWidth, menuHeight);

        // Close button
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

        this._renderEffects(ctx);
    }

    _renderTiles(ctx) {
        if (this.activeTab === 'enemies' && this._getItems().length === 0) {
            const { contentX, contentY, contentWidth, contentHeight } = this._forEachTile(() => {});
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'italic 13px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#7a6a5a';
            ctx.fillText(
                'No enemy types unlocked yet - buy Spy Reports at the Arcane Library first.',
                contentX + contentWidth / 2, contentY + contentHeight / 2
            );
            return;
        }

        this._forEachTile((item, x, y, w, h) => {
            const state = this._getItemState(item);
            const isHovered = this.hoveredItemId === item.id;
            const isLocked = !state.requirementMet;

            // Tile background
            ctx.fillStyle = isLocked ? '#140c06' : (isHovered ? '#3a2814' : '#241608');
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = state.owned ? '#4caf50' : (isHovered ? '#d4af37' : 'rgba(160,130,80,0.4)');
            ctx.lineWidth = state.owned || isHovered ? 2 : 1;
            ctx.strokeRect(x, y, w, h);

            const cx = x + w / 2;
            const iconY = y + h * 0.34;
            const iconSize = Math.min(w * 0.55, 58);

            ctx.save();
            if (isLocked) ctx.globalAlpha = 0.4;
            item.drawIcon(ctx, cx, iconY, iconSize);
            ctx.restore();

            if (isLocked) {
                // Small padlock glyph over the icon
                ctx.fillStyle = 'rgba(0,0,0,0.55)';
                ctx.fillRect(cx - 8, iconY - 2, 16, 12);
                ctx.strokeStyle = '#c9a876';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(cx, iconY - 4, 6, Math.PI, Math.PI * 2);
                ctx.stroke();
            }

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 12px Trebuchet MS, sans-serif';
            ctx.fillStyle = isLocked ? '#5a4a3a' : '#e8d49a';
            ctx.fillText(item.name, cx, y + h * 0.66);

            if (state.owned) {
                ctx.font = 'bold 11px Trebuchet MS, sans-serif';
                ctx.fillStyle = '#4caf50';
                ctx.fillText('OWNED', cx, y + h * 0.82);
            } else if (isLocked) {
                ctx.font = '10px Trebuchet MS, sans-serif';
                ctx.fillStyle = '#5a4a3a';
                ctx.fillText(this._getLockMessage(item), cx, y + h * 0.80);
            } else {
                ctx.font = 'bold 11px Trebuchet MS, sans-serif';
                ctx.fillStyle = this.playerGold >= item.cost ? '#ffd700' : '#a05a5a';
                let costLine = `${item.cost}g`;
                if (this.activeTab === 'enemies') {
                    costLine += `  •  Token: ${state.tokenCount}/1`;
                }
                ctx.fillText(costLine, cx, y + h * 0.82);
            }
        });
    }

    _renderStrategyButton(ctx, menuX, menuY, menuWidth, menuHeight) {
        const btn = this._getStrategyButtonBounds(menuX, menuY, menuWidth, menuHeight);
        const isHovered = this.strategyButtonHovered;

        const bg = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
        if (isHovered) {
            bg.addColorStop(0, '#e8c547');
            bg.addColorStop(0.5, '#ffd700');
            bg.addColorStop(1, '#c8a020');
        } else {
            bg.addColorStop(0, '#a89050');
            bg.addColorStop(0.5, '#c8aa60');
            bg.addColorStop(1, '#907040');
        }
        ctx.fillStyle = bg;
        ctx.fillRect(btn.x, btn.y, btn.width, btn.height);

        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(btn.x, btn.y, btn.width, 2);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(btn.x, btn.y + btn.height - 3, btn.width, 3);

        ctx.strokeStyle = isHovered ? '#ffe900' : '#d4af37';
        ctx.lineWidth = isHovered ? 2.5 : 1.5;
        ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);

        ctx.font = 'bold 18px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillText('STRATEGY TABLE', btn.x + btn.width / 2 + 1, btn.y + btn.height / 2 + 1);
        ctx.fillStyle = isHovered ? '#000' : '#1a0f04';
        ctx.fillText('STRATEGY TABLE', btn.x + btn.width / 2, btn.y + btn.height / 2);
    }

    _renderEffects(ctx) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const eff of this.itemErrorEffects) {
            const alpha = Math.min(1, eff.life / 1.4);
            ctx.globalAlpha = alpha;
            ctx.font = 'bold 12px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#ff5555';
            ctx.fillText(eff.text, eff.x, eff.y - (1.4 - eff.life) * 20);
        }
        for (const eff of this.glowEffects) {
            const alpha = Math.min(1, eff.life);
            ctx.globalAlpha = alpha;
            ctx.font = 'bold 13px Trebuchet MS, sans-serif';
            ctx.fillStyle = '#ffd700';
            ctx.fillText(eff.text, eff.x, eff.y - (1 - eff.life) * 24);
        }
        ctx.globalAlpha = 1;
    }
}
