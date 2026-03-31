import { CampaignRegistry } from '../../game/CampaignRegistry.js';

// Biome colours for each campaign card background
const CAMPAIGN_BIOME = {
    'campaign-1': { from: '#122a12', to: '#0a160a', accent: '#4a8c3f' },  // Woodland green
    'campaign-2': { from: '#141e30', to: '#0a1020', accent: '#6a85b5' },  // Mountain blue-grey
    'campaign-3': { from: '#2e1c06', to: '#180e03', accent: '#c9803a' },  // Desert amber
    'campaign-4': { from: '#1b0a2e', to: '#0f0416', accent: '#8a44c8' },  // Frog King purple
    'campaign-5': { from: '#1a1a1a', to: '#0f0f0f', accent: '#888888' },  // Sandbox neutral
};

export class CampaignMenu {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.campaigns = [];
        this.selectedCampaignId = null;
        this.hoveredCampaignId = null;
        this.hoveredStartButton = false;
        this.hoveredExitButton = false;

        // Layout — large full-width cards left, compact info panel right
        this.layout = {
            leftPadding: 48,
            topPadding: 118,
            cardWidth: 1050,
            cardHeight: 165,
            cardGap: 12,
            detailX: 1150,
            detailRightPad: 40,
            titleY: 56,
        };
    }
    
    enter() {
        const statsBar = document.getElementById('stats-bar');
        const sidebar = document.getElementById('tower-sidebar');
        if (statsBar) statsBar.style.display = 'none';
        if (sidebar) sidebar.style.display = 'none';

        // Always reload registry state from current save so lock flags are fresh
        const saveData = this.stateManager.currentSaveData;
        if (saveData) CampaignRegistry.loadFromSaveData(saveData);

        // Only show campaigns the player has unlocked (filter out locked ones)
        this.campaigns = CampaignRegistry.getCampaignsOrdered().filter(c => !c.locked);
        this.hoveredCampaignId = null;
        this.hoveredExitButton = false;
        this.hoveredStartButton = false;

        // Pre-select first unlocked campaign
        const firstUnlocked = this.campaigns.find(c => !c.locked);
        this.selectedCampaignId = firstUnlocked ? firstUnlocked.id : null;

        // Music
        if (this.stateManager.audioManager) {
            const am = this.stateManager.audioManager;
            const current = am.getCurrentTrack();
            const settlementTracks = am.getSettlementTracks();
            if (!am.isManualMusicSelection && !settlementTracks.includes(current)) {
                am.playRandomSettlementTheme();
            }
        }

        this.setupMouseListeners();

        // Set controller to button navigation mode
        if (this.stateManager.inputManager) {
            this.stateManager.inputManager.setNavigationMode('buttons');
        }
    }

    exit() {
        this.removeMouseListeners();
    }

    // ============ GAMEPAD BUTTON NAVIGATION ============

    getButtonCount() {
        // campaigns + start button + exit button
        return this.campaigns.length + 2;
    }

    getFocusedButtonIndex() {
        // Map current hover state to an index
        for (let i = 0; i < this.campaigns.length; i++) {
            if (this.hoveredCampaignId === this.campaigns[i].id) return i;
        }
        if (this.hoveredStartButton) return this.campaigns.length;
        if (this.hoveredExitButton) return this.campaigns.length + 1;
        return -1;
    }

    focusButton(index) {
        this.hoveredCampaignId = null;
        this.hoveredStartButton = false;
        this.hoveredExitButton = false;

        if (index >= 0 && index < this.campaigns.length) {
            this.hoveredCampaignId = this.campaigns[index].id;
            this.selectedCampaignId = this.campaigns[index].id;
        } else if (index === this.campaigns.length) {
            this.hoveredStartButton = true;
        } else if (index === this.campaigns.length + 1) {
            this.hoveredExitButton = true;
        }
    }

    activateFocusedButton() {
        const idx = this.getFocusedButtonIndex();
        if (idx < 0) return;
        if (this.stateManager.audioManager) this.stateManager.audioManager.playSFX('button-click');

        if (idx < this.campaigns.length) {
            // Select campaign card
            this.selectedCampaignId = this.campaigns[idx].id;
        } else if (idx === this.campaigns.length) {
            // Start button
            const sel = this.selectedCampaignId ? CampaignRegistry.getCampaign(this.selectedCampaignId) : null;
            if (sel && !sel.locked) {
                if (this.stateManager.audioManager) this.stateManager.audioManager.playSFX('open-campaign');
                const campaignState = new sel.class(this.stateManager);
                this.stateManager.addState('levelSelect', campaignState);
                this.stateManager.changeState('levelSelect');
            }
        } else if (idx === this.campaigns.length + 1) {
            // Exit
            this.stateManager.changeState('settlementHub');
        }
    }

    setupMouseListeners() {
        this.mouseMoveHandler = (e) => this.handleMouseMove(e);
        this.clickHandler = (e) => {
            const rect = this.stateManager.canvas.getBoundingClientRect();
            const scaleX = this.stateManager.canvas.width / rect.width;
            const scaleY = this.stateManager.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            this.handleClick(x, y);
        };
        this.stateManager.canvas.addEventListener('mousemove', this.mouseMoveHandler);
        this.stateManager.canvas.addEventListener('click', this.clickHandler);
    }

    removeMouseListeners() {
        if (this.mouseMoveHandler) {
            this.stateManager.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
        }
        if (this.clickHandler) {
            this.stateManager.canvas.removeEventListener('click', this.clickHandler);
        }
    }

    // â”€â”€ Hit testing helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    getCardBounds(index) {
        const { leftPadding, topPadding, cardWidth, cardHeight, cardGap } = this.layout;
        return {
            x: leftPadding,
            y: topPadding + index * (cardHeight + cardGap),
            width: cardWidth,
            height: cardHeight,
        };
    }

    getDetailPanelBounds() {
        const canvas = this.stateManager.canvas;
        const { detailX, detailRightPad, topPadding } = this.layout;
        const panelH = Math.min(520, canvas.height - topPadding - 50);
        return {
            x: detailX,
            y: topPadding,
            width: canvas.width - detailX - detailRightPad,
            height: panelH,
        };
    }

    getStartButtonBounds() {
        const panel = this.getDetailPanelBounds();
        const bh = 52;
        const bw = Math.min(panel.width - 40, 320);
        return {
            x: panel.x + Math.floor((panel.width - bw) / 2),
            y: panel.y + panel.height - bh - 20,
            width: bw,
            height: bh,
        };
    }

    getExitButtonBounds() {
        return {
            x: this.stateManager.canvas.width - 150,
            y: 28,
            width: 120,
            height: 44,
        };
    }

    // â”€â”€ Input handling â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    handleMouseMove(e) {
        const rect = this.stateManager.canvas.getBoundingClientRect();
        const scaleX = this.stateManager.canvas.width / rect.width;
        const scaleY = this.stateManager.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        this.hoveredCampaignId = null;
        this.hoveredExitButton = false;
        this.hoveredStartButton = false;
        let pointerCursor = false;

        // Exit button
        const exit = this.getExitButtonBounds();
        if (this._inBounds(x, y, exit)) {
            this.hoveredExitButton = true;
            pointerCursor = true;
        }

        // Campaign cards
        this.campaigns.forEach((campaign, index) => {
            const b = this.getCardBounds(index);
            if (this._inBounds(x, y, b)) {
                this.hoveredCampaignId = campaign.id;
                if (!campaign.locked) pointerCursor = true;
            }
        });

        // Start button
        const startBtn = this.getStartButtonBounds();
        const sel = this.selectedCampaignId ? CampaignRegistry.getCampaign(this.selectedCampaignId) : null;
        if (sel && !sel.locked && this._inBounds(x, y, startBtn)) {
            this.hoveredStartButton = true;
            pointerCursor = true;
        }

        this.stateManager.canvas.style.cursor = pointerCursor ? 'pointer' : 'default';
    }

    handleClick(x, y) {
        // Exit button
        const exit = this.getExitButtonBounds();
        if (this._inBounds(x, y, exit)) {
            if (this.stateManager.audioManager) this.stateManager.audioManager.playSFX('button-click');
            this.stateManager.changeState('settlementHub');
            return;
        }

        // Start button
        const sel = this.selectedCampaignId ? CampaignRegistry.getCampaign(this.selectedCampaignId) : null;
        const startBtn = this.getStartButtonBounds();
        if (sel && !sel.locked && this._inBounds(x, y, startBtn)) {
            if (this.stateManager.audioManager) this.stateManager.audioManager.playSFX('open-campaign');
            const campaignState = new sel.class(this.stateManager);
            this.stateManager.addState('levelSelect', campaignState);
            this.stateManager.changeState('levelSelect');
            return;
        }

        // Campaign card clicks
        this.campaigns.forEach((campaign, index) => {
            const b = this.getCardBounds(index);
            if (this._inBounds(x, y, b)) {
                if (this.stateManager.audioManager) this.stateManager.audioManager.playSFX('button-click');
                if (!campaign.locked) {
                    this.selectedCampaignId = campaign.id;
                }
            }
        });
    }

    _inBounds(x, y, b) {
        return x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height;
    }

    // â”€â”€ Rendering â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    render(ctx) {
        const canvas = this.stateManager.canvas;

        ctx.shadowColor = 'rgba(0,0,0,0)';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.globalAlpha = 1;

        this._renderBackground(ctx, canvas);
        this._renderTitle(ctx, canvas);

        this.campaigns.forEach((campaign, index) => {
            this._renderCard(ctx, campaign, index);
        });

        this._renderDetailPanel(ctx);
        this._renderExitButton(ctx);
    }

    _renderBackground(ctx, canvas) {
        const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
        g.addColorStop(0, '#211408');
        g.addColorStop(1, '#120a04');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Subtle diagonal line texture
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.03)';
        ctx.lineWidth = 1;
        for (let i = -canvas.height; i < canvas.width; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + canvas.height, canvas.height);
            ctx.stroke();
        }
    }

    _renderTitle(ctx, canvas) {
        const { titleY, leftPadding, cardWidth } = this.layout;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        // Main title
        ctx.font = 'bold 52px serif';
        ctx.fillStyle = '#d4af37';
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 3;
        ctx.strokeText('CAMPAIGNS', leftPadding, titleY);
        ctx.fillText('CAMPAIGNS', leftPadding, titleY);

        // Gold rule under title
        ctx.strokeStyle = '#6a501e';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(leftPadding, titleY + 34);
        ctx.lineTo(leftPadding + cardWidth, titleY + 34);
        ctx.stroke();
    }

    _renderCard(ctx, campaign, index) {
        const b = this.getCardBounds(index);
        const isSelected = this.selectedCampaignId === campaign.id;
        const isHovered = this.hoveredCampaignId === campaign.id;
        const biome = CAMPAIGN_BIOME[campaign.id] || CAMPAIGN_BIOME['campaign-5'];

        // Drop shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(b.x + 5, b.y + 5, b.width, b.height);

        // Card background gradient
        const bg = ctx.createLinearGradient(b.x, b.y, b.x + b.width * 0.6, b.y + b.height);
        if (isSelected) {
            bg.addColorStop(0, this._lighten(biome.from, 18));
            bg.addColorStop(1, biome.from);
        } else {
            bg.addColorStop(0, biome.from);
            bg.addColorStop(1, biome.to);
        }
        ctx.fillStyle = bg;
        ctx.fillRect(b.x, b.y, b.width, b.height);

        // Right-side dark fade overlay for readability
        const fade = ctx.createLinearGradient(b.x + b.width * 0.55, b.y, b.x + b.width, b.y);
        fade.addColorStop(0, 'rgba(0,0,0,0)');
        fade.addColorStop(1, 'rgba(0,0,0,0.45)');
        ctx.fillStyle = fade;
        ctx.fillRect(b.x, b.y, b.width, b.height);

        // Bottom progress bar strip (always rendered)
        const stripH = 22;
        const stripY = b.y + b.height - stripH;
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(b.x, stripY, b.width, stripH);

        // Border
        if (isSelected) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2.5;
        } else if (isHovered) {
            ctx.strokeStyle = biome.accent + 'dd';
            ctx.lineWidth = 1.5;
        } else {
            ctx.strokeStyle = biome.accent + '66';
            ctx.lineWidth = 1;
        }
        ctx.strokeRect(b.x, b.y, b.width, b.height);

        // Left accent bar
        ctx.fillStyle = isSelected ? '#ffd700' : biome.accent + 'dd';
        ctx.fillRect(b.x, b.y, isSelected ? 5 : 3, b.height);

        this._renderUnlockedCard(ctx, campaign, b, isSelected, biome);
    }

    _renderLockedCard(ctx, campaign, b) {
        // No-op: locked cards are not displayed in the campaign list
    }

    _renderUnlockedCard(ctx, campaign, b, isSelected, biome) {
        biome = biome || CAMPAIGN_BIOME[campaign.id] || CAMPAIGN_BIOME['campaign-5'];
        const iconX = b.x + 56;
        const iconY = b.y + Math.floor((b.height - 22) / 2);

        // Large campaign icon
        if (campaign.drawIcon) {
            campaign.drawIcon(ctx, iconX, iconY, 52);
        } else {
            ctx.font = '52px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(campaign.icon, iconX, iconY);
        }

        // Campaign name
        const textX = b.x + 110;
        const nameY = b.y + 32;
        ctx.font = `bold 22px serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = isSelected ? '#ffd700' : '#e8d49a';
        ctx.fillText(campaign.name, textX, nameY);

        // Difficulty dot + text
        ctx.font = '13px serif';
        ctx.fillStyle = this._difficultyColor(campaign.difficulty);
        ctx.fillText(`\u25CF  ${campaign.difficulty}`, textX, nameY + 28);

        // Level count (top right of card)
        const totalLevels = campaign.levelCount || 5;
        const levelsCompleted = Math.round((campaign.progress / 100) * totalLevels);
        const lvlText = `${levelsCompleted} / ${totalLevels} Levels`;
        ctx.font = 'bold 13px serif';
        ctx.textAlign = 'right';
        ctx.fillStyle = campaign.progress >= 100 ? '#7edd6e' : '#b09060';
        ctx.fillText(lvlText, b.x + b.width - 18, nameY + 4);

        // Progress bar inside the bottom strip
        const stripH = 22;
        const stripY = b.y + b.height - stripH;
        const barPad = 110;
        const barX = b.x + barPad;
        const barW = b.width - barPad - 18;
        const barH = 8;
        const barY = stripY + Math.floor((stripH - barH) / 2);

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX, barY, barW, barH);

        if (campaign.progress > 0) {
            const pg = ctx.createLinearGradient(barX, barY, barX + barW, barY);
            pg.addColorStop(0, biome.accent);
            pg.addColorStop(1, '#d4af37');
            ctx.fillStyle = pg;
            ctx.fillRect(barX, barY, barW * (campaign.progress / 100), barH);
        }
        ctx.strokeStyle = biome.accent + '88';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);

        // "Progress" label on left of strip
        ctx.font = '11px serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#806040';
        ctx.fillText('Progress', b.x + 14, stripY + stripH / 2);

        // Small completion badge if 100%
        if (campaign.progress >= 100) {
            ctx.font = '11px serif';
            ctx.textAlign = 'right';
            ctx.fillStyle = '#7edd6e';
            ctx.fillText('\u2714 Complete', b.x + b.width - 18, stripY + stripH / 2);
        }
    }

    _renderDetailPanel(ctx) {
        const panel = this.getDetailPanelBounds();
        const campaign = this.selectedCampaignId ? CampaignRegistry.getCampaign(this.selectedCampaignId) : null;

        // Panel background
        const bg = ctx.createLinearGradient(panel.x, panel.y, panel.x, panel.y + panel.height);
        bg.addColorStop(0, 'rgba(22, 14, 6, 0.97)');
        bg.addColorStop(1, 'rgba(12, 7, 2, 0.97)');
        ctx.fillStyle = bg;
        ctx.fillRect(panel.x, panel.y, panel.width, panel.height);

        // Outer border
        ctx.strokeStyle = '#5a4020';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(panel.x, panel.y, panel.width, panel.height);

        // Inner accent border
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(panel.x + 3, panel.y + 3, panel.width - 6, panel.height - 6);

        if (!campaign) {
            ctx.font = '15px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#5a4a3a';
            ctx.fillText('Select a campaign to view details', panel.x + panel.width / 2, panel.y + panel.height / 2);
            return;
        }

        this._renderDetailContent(ctx, campaign, panel);
    }

    _renderDetailContent(ctx, campaign, panel) {
        const pad = 24;
        const cx = panel.x + pad;
        const cw = panel.width - pad * 2;
        let cy = panel.y + pad;
        const biome = CAMPAIGN_BIOME[campaign.id] || CAMPAIGN_BIOME['campaign-5'];

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Icon + Name header
        if (campaign.drawIcon) {
            campaign.drawIcon(ctx, cx + 18, cy + 18, 36);
        } else {
            ctx.font = '36px serif';
            ctx.fillText(campaign.icon, cx, cy);
        }

        ctx.font = 'bold 21px serif';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(campaign.name, cx + 48, cy + 3);

        ctx.font = '12px serif';
        ctx.fillStyle = this._difficultyColor(campaign.difficulty);
        ctx.fillText(`\u25CF ${campaign.difficulty}`, cx + 48, cy + 30);
        cy += 56;

        // Divider
        this._drawDivider(ctx, cx, cy, cw, biome.accent);
        cy += 12;

        // Progress indicator
        const totalLevels = campaign.levelCount || 5;
        const levelsCompleted = Math.round((campaign.progress / 100) * totalLevels);
        ctx.font = '12px serif';
        ctx.fillStyle = '#a08040';
        ctx.fillText(`Progress: ${levelsCompleted} / ${totalLevels} levels`, cx, cy);
        cy += 16;

        const bh = 8;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(cx, cy, cw, bh);
        if (campaign.progress > 0) {
            const pg = ctx.createLinearGradient(cx, cy, cx + cw, cy);
            pg.addColorStop(0, biome.accent);
            pg.addColorStop(1, '#d4af37');
            ctx.fillStyle = pg;
            ctx.fillRect(cx, cy, cw * (campaign.progress / 100), bh);
        }
        ctx.strokeStyle = '#4a3010';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx, cy, cw, bh);
        cy += bh + 14;

        // Divider
        this._drawDivider(ctx, cx, cy, cw, biome.accent);
        cy += 12;

        // Story — capped at 4 lines to keep the panel compact
        ctx.font = 'bold 12px serif';
        ctx.fillStyle = biome.accent;
        ctx.fillText('\u2726  Story', cx, cy);
        cy += 18;

        ctx.font = '12px serif';
        ctx.fillStyle = '#c9a876';
        const storyText = campaign.story || 'A great adventure awaits...';
        cy = this._wrapTextCapped(ctx, storyText, cx, cy, cw, 15, 4);
        cy += 10;

        // Start button
        this._renderStartButton(ctx, campaign);
    }

    _renderStartButton(ctx, campaign) {
        const btn = this.getStartButtonBounds();
        const isHovered = this.hoveredStartButton;
        const isLocked = campaign.locked;

        if (isLocked) {
            ctx.fillStyle = '#242424';
            ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
            ctx.strokeStyle = '#3a3a3a';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);
            ctx.font = 'bold 15px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#555';
            ctx.fillText('\uD83D\uDD12  LOCKED', btn.x + btn.width / 2, btn.y + btn.height / 2);
        } else {
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

            ctx.font = 'bold 17px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillText('START CAMPAIGN  \u25B6', btn.x + btn.width / 2 + 1, btn.y + btn.height / 2 + 1);
            ctx.fillStyle = isHovered ? '#000' : '#1a0f04';
            ctx.fillText('START CAMPAIGN  \u25B6', btn.x + btn.width / 2, btn.y + btn.height / 2);
        }
    }

    _renderExitButton(ctx) {
        const btn = this.getExitButtonBounds();
        const isHovered = this.hoveredExitButton;

        const bg = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
        if (isHovered) {
            bg.addColorStop(0, '#7a6040');
            bg.addColorStop(1, '#5a4030');
        } else {
            bg.addColorStop(0, '#4a3828');
            bg.addColorStop(1, '#352818');
        }
        ctx.fillStyle = bg;
        ctx.fillRect(btn.x, btn.y, btn.width, btn.height);

        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(btn.x, btn.y, btn.width, 2);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(btn.x, btn.y + btn.height - 3, btn.width, 3);

        ctx.strokeStyle = isHovered ? '#ffd700' : '#8b6a3a';
        ctx.lineWidth = isHovered ? 2 : 1.5;
        ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);

        ctx.font = 'bold 14px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillText('Back', btn.x + btn.width / 2 + 1, btn.y + btn.height / 2 + 1);
        ctx.fillStyle = isHovered ? '#ffe700' : '#d4af37';
        ctx.fillText('Back', btn.x + btn.width / 2, btn.y + btn.height / 2);
    }

    // â”€â”€ Utilities â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    _drawDivider(ctx, x, y, width, color) {
        ctx.strokeStyle = (color || '#6a501e') + '66';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y);
        ctx.stroke();
    }

    /** Word-wrap text with a maximum line count. Returns the Y position after the last line. */
    _wrapTextCapped(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
        const words = text.split(' ');
        let line = '';
        let lineY = y;
        let lineCount = 0;
        for (const word of words) {
            if (lineCount >= maxLines) break;
            const test = line ? line + ' ' + word : word;
            if (ctx.measureText(test).width > maxWidth) {
                ctx.fillText(line, x, lineY);
                line = word;
                lineY += lineHeight;
                lineCount++;
            } else {
                line = test;
            }
        }
        if (line && lineCount < maxLines) {
            ctx.fillText(line, x, lineY);
            lineY += lineHeight;
        }
        return lineY;
    }

    /** Word-wrap text. Returns the Y position after the last line. */
    _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let lineY = y;
        for (const word of words) {
            const test = line ? line + ' ' + word : word;
            if (ctx.measureText(test).width > maxWidth) {
                ctx.fillText(line, x, lineY);
                line = word;
                lineY += lineHeight;
            } else {
                line = test;
            }
        }
        if (line) {
            ctx.fillText(line, x, lineY);
            lineY += lineHeight;
        }
        return lineY;
    }

    /** Return the name of the campaign that must be completed to unlock the given campaign. */
    _getPrereqCampaignName(campaignId) {
        const chain = CampaignRegistry.UNLOCK_CHAIN;
        const prereqId = Object.keys(chain).find(k => chain[k] === campaignId);
        if (!prereqId) return null;
        const camp = CampaignRegistry.getCampaign(prereqId);
        return camp ? camp.name : null;
    }

    _difficultyColor(difficulty) {
        switch (difficulty) {
            case 'Apprentice':   return '#4CAF50';
            case 'Warrior':      return '#FFC107';
            case 'Champion':     return '#FF7043';
            case 'Legendary':    return '#AB47BC';
            case 'Testing':      return '#78909C';
            default:             return '#d4af37';
        }
    }

    /** Lighten a hex colour by `amount` (0-255). */
    _lighten(hex, amount) {
        const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
        const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
        const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
        return `rgb(${r},${g},${b})`;
    }

    update(deltaTime) {
        // no per-frame logic needed
    }
}

