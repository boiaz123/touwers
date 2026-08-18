import { CampaignRegistry } from '../../game/CampaignRegistry.js';
import { drawCoverImage, drawMedallion } from '../EmblemRenderer.js';

// Unified stone base with campaign-specific accent colours
const CAMPAIGN_BIOME = {
    'campaign-1': { from: '#1c1810', to: '#130f09', accent: '#4e8c42' },  // Forest emerald accent
    'campaign-2': { from: '#1c1810', to: '#130f09', accent: '#5c84b8' },  // Mountain slate accent
    'campaign-3': { from: '#1c1810', to: '#130f09', accent: '#c47c30' },  // Desert amber accent
    'campaign-4': { from: '#1c1810', to: '#130f09', accent: '#8840c0' },  // Frog King violet accent
    'sandbox': { from: '#1c1810', to: '#130f09', accent: '#d4af37' },     // Freeplay gold accent
};

/** Draws an overflowing treasure chest - Sandbox mode's "unlimited gold" icon. */
function _drawSandboxIcon(ctx, cx, cy, size) {
    const w = size * 0.62, h = size * 0.46;
    const bx = cx - w / 2, by = cy - h * 0.28;

    // Glow behind the pile, hinting at "unlimited"
    const glow = ctx.createRadialGradient(cx, by - h * 0.1, 0, cx, by - h * 0.1, size * 0.55);
    glow.addColorStop(0, 'rgba(255, 215, 100, 0.35)');
    glow.addColorStop(1, 'rgba(255, 215, 100, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cx, by - h * 0.1, size * 0.55, 0, Math.PI * 2); ctx.fill();

    // Body
    const bodyGrad = ctx.createLinearGradient(cx, by + h * 0.3, cx, by + h);
    bodyGrad.addColorStop(0, '#9a6a30'); bodyGrad.addColorStop(1, '#5c3a18');
    ctx.fillStyle = bodyGrad;
    ctx.fillRect(bx, by + h * 0.3, w, h * 0.7);
    ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by + h * 0.3, w, h * 0.7);

    // Open lid (angled back)
    ctx.save();
    ctx.translate(bx, by + h * 0.3);
    ctx.rotate(-0.55);
    const lidGrad = ctx.createLinearGradient(0, -h * 0.5, 0, 0);
    lidGrad.addColorStop(0, '#c89850'); lidGrad.addColorStop(1, '#8a5a28');
    ctx.fillStyle = lidGrad;
    ctx.fillRect(0, -h * 0.42, w, h * 0.42);
    ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 1.2;
    ctx.strokeRect(0, -h * 0.42, w, h * 0.42);
    ctx.restore();

    // Metal bands
    ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(bx + w * 0.25, by + h * 0.3); ctx.lineTo(bx + w * 0.25, by + h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + w * 0.75, by + h * 0.3); ctx.lineTo(bx + w * 0.75, by + h); ctx.stroke();

    // Overflowing gold coins
    ctx.fillStyle = '#ffd700';
    const coins = [
        [-0.28, -0.12, 0.11], [-0.08, -0.22, 0.1], [0.14, -0.14, 0.12],
        [0.30, -0.04, 0.09], [0.0, -0.30, 0.08], [-0.20, -0.02, 0.09]
    ];
    coins.forEach(([dx, dy, r]) => {
        ctx.beginPath();
        ctx.ellipse(cx + dx * w, by + h * 0.3 + dy * h, r * w, r * w * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#a87c1a'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = '#ffd700';
    });
}

// Emblem art — drop a same-named file in public/assets/campaigns/ to replace any of these.
// Missing/unloaded files fall back to the campaign's vector drawIcon() automatically.
const CAMPAIGN_EMBLEM_IMAGE = {
    'campaign-1': 'assets/campaigns/campaign-1.jpg',
    'campaign-2': 'assets/campaigns/campaign-2.jpg',
    'campaign-3': 'assets/campaigns/campaign-3.jpg',
    'campaign-4': 'assets/campaigns/campaign-4.jpg',
    'campaign-5': 'assets/campaigns/campaign-5.jpg',
};

export class CampaignMenu {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.campaigns = [];
        this.selectedCampaignId = null;
        this.hoveredCampaignId = null;
        this.hoveredStartButton = false;
        this.hoveredExitButton = false;

        // Layout — large full-width cards left, compact info panel right.
        // bottomPadding is shared by the card column and the detail panel so
        // both always end flush at the same Y, regardless of card count.
        this.layout = {
            leftPadding: 48,
            topPadding: 118,
            bottomPadding: 50,
            cardWidth: 1050,
            cardGap: 12,
            detailX: 1150,
            detailRightPad: 40,
            titleY: 56,
        };

        this.emblemImageCache = {};
        this._loadEmblemImages();
    }

    /** Preloads campaign emblem art; missing files silently fall back to drawIcon(). */
    _loadEmblemImages() {
        for (const [id, path] of Object.entries(CAMPAIGN_EMBLEM_IMAGE)) {
            const img = new Image();
            img.onload = () => { this.emblemImageCache[id] = img; };
            img.onerror = () => { this.emblemImageCache[id] = null; };
            img.src = path;
        }
    }

    enter() {
        const statsBar = document.getElementById('stats-bar');
        const sidebar = document.getElementById('tower-sidebar');
        if (statsBar) statsBar.style.display = 'none';
        if (sidebar) sidebar.style.display = 'none';

        // Always reload registry state from current save so lock flags are fresh
        const saveData = this.stateManager.currentSaveData;
        if (saveData) CampaignRegistry.loadFromSaveData(saveData);

        // Only show campaigns the player has unlocked (filter out locked ones).
        // Commander's Workshop (campaign-5) is no longer selectable from here - it's reached
        // via the Workshop building's "Strategy Table" button in the Settlement Hub instead
        // (see WorkshopMenu.js). Its old slot in this list is now Sandbox Mode, which moved
        // here from inside the Workshop and unlocks on defeating the Frog King (campaign-4).
        this.campaigns = CampaignRegistry.getCampaignsOrdered().filter(c => !c.locked && c.id !== 'campaign-5');
        const completedCampaigns = saveData?.completedCampaigns || [];
        if (completedCampaigns.includes('campaign-4')) {
            this.campaigns.push(this._buildSandboxEntry());
        }
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
    }

    exit() {
        this.removeMouseListeners();
    }

    /** Synthetic campaign-shaped entry for Sandbox Mode - not a real CampaignRegistry
     *  campaign (no levels, no class to instantiate), so START CAMPAIGN is special-cased
     *  for it in handleClick()/activateFocusedButton() to launch the sandbox level directly
     *  instead of instantiating campaign.class. */
    _buildSandboxEntry() {
        return {
            id: 'sandbox',
            name: 'Sandbox Mode',
            description: 'Build freely with unlimited gold and no waves.',
            icon: '∞',
            drawIcon: _drawSandboxIcon,
            difficulty: 'Freeplay',
            class: null,
            rewards: null,
            story: 'No waves, no pressure - just you, unlimited gold, and a blank battlefield. Perfect for testing tower placements and combinations without consequence.',
            completionStory: '',
            progress: 0,
            levelCount: null,
            locked: false
        };
    }

    /** Looks up the selected entry from this.campaigns (real campaigns + the synthetic
     *  Sandbox entry) rather than CampaignRegistry, which has no 'sandbox' id. */
    _getSelectedEntry() {
        return this.campaigns.find(c => c.id === this.selectedCampaignId) || null;
    }

    /** Launches Sandbox Mode directly, mirroring the launch code that used to live in
     *  PlayerWorkshop's Sandbox Mode button (now removed - see PlayerWorkshop.js). */
    _launchSandbox() {
        if (this.stateManager.audioManager) this.stateManager.audioManager.playSFX('open-campaign');
        this.stateManager.selectedLevelInfo = {
            id: 'sandbox-workshop',
            name: 'Sandbox Mode',
            type: 'sandbox',
            campaignId: 'campaign-5'
        };
        this.stateManager.changeState('game');
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
            const sel = this.selectedCampaignId ? this._getSelectedEntry() : null;
            if (sel && !sel.locked) {
                if (sel.id === 'sandbox') {
                    this._launchSandbox();
                } else {
                    if (this.stateManager.audioManager) this.stateManager.audioManager.playSFX('open-campaign');
                    const campaignState = new sel.class(this.stateManager);
                    this.stateManager.addState('levelSelect', campaignState);
                    this.stateManager.changeState('levelSelect');
                }
            }
        } else if (idx === this.campaigns.length + 1) {
            // Exit
            this.stateManager.changeState('settlementHub');
        }
    }

    setupMouseListeners() {
        // Note: clicks are NOT bound here. game.js's global canvas 'click' listener
        // already routes through GameStateManager.handleClick() to this.handleClick() -
        // binding our own listener too would fire handleClick() twice per click.
        this.mouseMoveHandler = (e) => this.handleMouseMove(e);
        this.stateManager.canvas.addEventListener('mousemove', this.mouseMoveHandler);
    }

    removeMouseListeners() {
        if (this.mouseMoveHandler) {
            this.stateManager.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
        }
    }

    // â”€â”€ Hit testing helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    // Card height is derived from the total number of campaigns that exist
    // (locked or not), not just the ones currently unlocked. This keeps each
    // card's size and slot position fixed as the player progresses — newly
    // unlocked campaigns simply fill the next empty slot rather than causing
    // every card to resize and reflow. The full stack still starts at
    // topPadding and, once all campaigns are unlocked, ends exactly at the
    // same bottom edge as the detail panel.
    getCardHeight() {
        const canvas = this.stateManager.canvas;
        const { topPadding, bottomPadding, cardGap } = this.layout;
        const n = Math.max(1, CampaignRegistry.getAllCampaigns().length);
        const availableHeight = canvas.height - topPadding - bottomPadding;
        return (availableHeight - (n - 1) * cardGap) / n;
    }

    getCardBounds(index) {
        const { leftPadding, topPadding, cardWidth, cardGap } = this.layout;
        const cardHeight = this.getCardHeight();
        return {
            x: leftPadding,
            y: topPadding + index * (cardHeight + cardGap),
            width: cardWidth,
            height: cardHeight,
        };
    }

    getDetailPanelBounds() {
        const canvas = this.stateManager.canvas;
        const { detailX, detailRightPad, topPadding, bottomPadding } = this.layout;
        const panelH = canvas.height - topPadding - bottomPadding;
        return {
            x: detailX,
            y: topPadding,
            width: canvas.width - detailX - detailRightPad,
            height: panelH,
        };
    }

    getStartButtonBounds() {
        const panel = this.getDetailPanelBounds();
        const bh = 64;
        const bw = Math.min(panel.width - 40, 380);
        return {
            x: panel.x + Math.floor((panel.width - bw) / 2),
            y: panel.y + panel.height - bh - 26,
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
        const sel = this.selectedCampaignId ? this._getSelectedEntry() : null;
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
        const sel = this.selectedCampaignId ? this._getSelectedEntry() : null;
        const startBtn = this.getStartButtonBounds();
        if (sel && !sel.locked && this._inBounds(x, y, startBtn)) {
            if (sel.id === 'sandbox') {
                this._launchSandbox();
            } else {
                if (this.stateManager.audioManager) this.stateManager.audioManager.playSFX('open-campaign');
                const campaignState = new sel.class(this.stateManager);
                this.stateManager.addState('levelSelect', campaignState);
                this.stateManager.changeState('levelSelect');
            }
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
        // Base coat
        ctx.fillStyle = '#100802';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Wood planks - horizontal bands with alternating tones
        const plankHeight = 88;
        const plankTones = ['#1c1005', '#1a0f05', '#1e1106', '#190e04', '#1b1005'];
        const planksCount = Math.ceil(canvas.height / plankHeight) + 1;
        for (let p = 0; p < planksCount; p++) {
            const py = p * plankHeight;
            const tone = plankTones[p % plankTones.length];
            ctx.fillStyle = tone;
            ctx.fillRect(0, py, canvas.width, plankHeight);

            // Top plank shadow line
            ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
            ctx.fillRect(0, py, canvas.width, 2);
            // Highlight just below seam
            ctx.fillStyle = 'rgba(200, 130, 60, 0.04)';
            ctx.fillRect(0, py + 2, canvas.width, 5);

            // Wood grain lines — subtle horizontal curves
            const grainLines = 5 + (p % 3);
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, py, canvas.width, plankHeight);
            ctx.clip();
            for (let g = 0; g < grainLines; g++) {
                const grainY = py + (plankHeight / (grainLines + 1)) * (g + 1);
                const waveA = Math.sin(p * 1.3 + g * 0.7) * 6;
                const waveB = Math.cos(p * 0.9 + g * 1.1) * 4;
                ctx.strokeStyle = 'rgba(70, 35, 8, 0.22)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, grainY + waveA);
                ctx.bezierCurveTo(
                    canvas.width * 0.3, grainY + waveA + waveB,
                    canvas.width * 0.7, grainY - waveA + waveB,
                    canvas.width, grainY - waveA * 0.5
                );
                ctx.stroke();
            }
            ctx.restore();
        }

        // Vignette — darkens edges for depth
        const vign = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, canvas.height * 0.15,
            canvas.width / 2, canvas.height / 2, canvas.height * 0.9
        );
        vign.addColorStop(0, 'rgba(0,0,0,0)');
        vign.addColorStop(1, 'rgba(0,0,0,0.72)');
        ctx.fillStyle = vign;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
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

    }

    _renderCard(ctx, campaign, index) {
        const b = this.getCardBounds(index);
        const isSelected = this.selectedCampaignId === campaign.id;
        const isHovered = this.hoveredCampaignId === campaign.id;
        const biome = CAMPAIGN_BIOME[campaign.id] || { from: '#1c1810', to: '#130f09', accent: '#7a6a5a' };

        // Drop shadow
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(b.x + 4, b.y + 4, b.width, b.height);

        // Card background — unified dark stone for all campaigns
        const bg = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.height);
        if (isSelected) {
            bg.addColorStop(0, '#28201a');
            bg.addColorStop(1, '#1a140e');
        } else {
            bg.addColorStop(0, biome.from);
            bg.addColorStop(1, biome.to);
        }
        ctx.fillStyle = bg;
        ctx.fillRect(b.x, b.y, b.width, b.height);

        // Subtle horizontal stone grain lines
        ctx.save();
        ctx.beginPath();
        ctx.rect(b.x, b.y, b.width, b.height);
        ctx.clip();
        for (let g = 0; g < 4; g++) {
            const gy = b.y + (b.height / 5) * (g + 1);
            ctx.strokeStyle = 'rgba(255,220,150,0.028)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(b.x, gy);
            ctx.lineTo(b.x + b.width, gy);
            ctx.stroke();
        }
        ctx.restore();

        // Right-side dark fade
        const fade = ctx.createLinearGradient(b.x + b.width * 0.6, b.y, b.x + b.width, b.y);
        fade.addColorStop(0, 'rgba(0,0,0,0)');
        fade.addColorStop(1, 'rgba(0,0,0,0.40)');
        ctx.fillStyle = fade;
        ctx.fillRect(b.x, b.y, b.width, b.height);

        // Bottom progress strip
        const stripH = 22;
        const stripY = b.y + b.height - stripH;
        ctx.fillStyle = 'rgba(0,0,0,0.38)';
        ctx.fillRect(b.x, stripY, b.width, stripH);

        // Outer border
        if (isSelected) {
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 2;
        } else if (isHovered) {
            ctx.strokeStyle = biome.accent + 'cc';
            ctx.lineWidth = 1.5;
        } else {
            ctx.strokeStyle = 'rgba(160,130,80,0.38)';
            ctx.lineWidth = 1;
        }
        ctx.strokeRect(b.x, b.y, b.width, b.height);

        // Inner accent border (selected only)
        if (isSelected) {
            ctx.strokeStyle = 'rgba(212,175,55,0.20)';
            ctx.lineWidth = 1;
            ctx.strokeRect(b.x + 3, b.y + 3, b.width - 6, b.height - 6);
        }

        // Left accent bar
        ctx.fillStyle = isSelected ? '#d4af37' : biome.accent + 'cc';
        ctx.fillRect(b.x, b.y, isSelected ? 5 : 4, b.height);

        // Corner ornament (diamond) on accent bar edge
        const oc = isSelected ? '#d4af37' : biome.accent + 'aa';
        this._drawCornerOrnament(ctx, b.x + 2, b.y + Math.floor((b.height - stripH) / 2), 4, oc);

        this._renderUnlockedCard(ctx, campaign, b, isSelected, biome, isHovered);
    }

    _renderLockedCard(ctx, campaign, b) {
        // No-op: locked cards are not displayed in the campaign list
    }

    /** Small diamond ornament for card decoration */
    _drawCornerOrnament(ctx, x, y, r, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y - r);
        ctx.lineTo(x + r, y);
        ctx.lineTo(x, y + r);
        ctx.lineTo(x - r, y);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Draws a campaign's scene art as a framed medallion emblem — a bevelled
     * metal ring around a circular "photo" crop, zoomed in on the campaign's
     * icon artwork so it reads as a scenic portrait rather than a flat glyph.
     * Ring color is gold when selected, warm pewter otherwise. Delegates the
     * actual ring/bevel/vignette chrome to the shared EmblemRenderer so this
     * stays visually identical to the achievement panel's medallions.
     */
    _drawEmblem(ctx, campaign, x, y, radius, biome, isSelected, isHovered) {
        let ringColors;
        if (isSelected) {
            ringColors = { top: '#f6e29a', mid: '#d4af37', bottom: '#8a651c' };
        } else if (isHovered) {
            ringColors = { top: '#c8b488', mid: '#8f7748', bottom: '#4a3c22' };
        } else {
            ringColors = { top: '#8c7a5c', mid: '#5c4c32', bottom: '#332a1a' };
        }

        const emblemImg = this.emblemImageCache[campaign.id];
        drawMedallion(ctx, {
            x, y, radius,
            ringColors,
            accent: biome.accent || '#a08040',
            backdrop: biome.to || '#141414',
            drawContent: (ctx, cx, cy, r) => {
                if (emblemImg) {
                    // Real picture — cover-fit crop so it fills the circle edge-to-edge with no gaps
                    drawCoverImage(ctx, emblemImg, cx - r, cy - r, r * 2, r * 2);
                } else if (campaign.drawIcon) {
                    // Image not loaded/available yet — fall back to the vector scene art, zoomed to fill the frame
                    campaign.drawIcon(ctx, cx, cy, r * 1.9);
                } else {
                    ctx.font = `${Math.round(r * 1.3)}px serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(campaign.icon, cx, cy);
                }
            }
        });
    }

    _renderUnlockedCard(ctx, campaign, b, isSelected, biome, isHovered) {
        biome = biome || CAMPAIGN_BIOME[campaign.id] || CAMPAIGN_BIOME['campaign-5'];
        const iconR = 54;
        const iconX = b.x + 16 + iconR;
        const iconY = b.y + Math.floor((b.height - 22) / 2);

        // Large campaign emblem — framed, zoomed-in crop of the campaign's scene art
        this._drawEmblem(ctx, campaign, iconX, iconY, iconR, biome, isSelected, isHovered);

        // Campaign name
        const textX = b.x + 16 + iconR * 2 + 20;
        const nameY = b.y + 32;
        ctx.font = `bold 22px serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = isSelected ? '#ffd700' : '#e8d49a';
        ctx.fillText(campaign.name, textX, nameY);

        // Difficulty — crossed swords icon with muted period-appropriate colour
        const diffColor = this._difficultyColor(campaign.difficulty);
        ctx.font = '12px serif';
        ctx.fillStyle = diffColor;
        ctx.fillText(`\u2694  ${campaign.difficulty}`, textX, nameY + 28);

        // Level count, progress bar and "Levels Completed" — only meaningful
        // for campaigns with a fixed level list; Commander's Workshop is a
        // free-form sandbox with no levels to track completion of.
        if (campaign.levelCount) {
            // Level count (top right of card)
            const totalLevels = campaign.levelCount;
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

            // "Levels Completed: X / X" sits above the bar instead of overlaid on
            // top of it, where it was unreadable against the fill colour.
            ctx.font = '11px serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.fillStyle = campaign.progress >= 100 ? '#7edd6e' : '#a08050';
            ctx.fillText(`Levels Completed: ${levelsCompleted} / ${totalLevels}`, barX + barW, stripY - 6);

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
        }
    }

    _renderDetailPanel(ctx) {
        const panel = this.getDetailPanelBounds();
        const campaign = this.selectedCampaignId ? this._getSelectedEntry() : null;

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
            ctx.font = '20px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#5a4a3a';
            ctx.fillText('Select a campaign to view details', panel.x + panel.width / 2, panel.y + panel.height / 2);
            return;
        }

        this._renderDetailContent(ctx, campaign, panel);
    }

    _renderDetailContent(ctx, campaign, panel) {
        const pad = 32;
        const cx = panel.x + pad;
        const cw = panel.width - pad * 2;
        let cy = panel.y + pad;
        const biome = CAMPAIGN_BIOME[campaign.id] || { from: '#1c1810', to: '#130f09', accent: '#7a6a5a' };

        // Icon + Name header
        const headerR = 38;
        this._drawEmblem(ctx, campaign, cx + headerR, cy + headerR, headerR, biome, true, false);

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const headerTextX = cx + headerR * 2 + 18;
        ctx.font = 'bold 29px serif';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(campaign.name, headerTextX, cy + 6);

        ctx.font = '17px serif';
        ctx.fillStyle = this._difficultyColor(campaign.difficulty);
        ctx.fillText(`\u2694 ${campaign.difficulty}`, headerTextX, cy + 44);
        cy += headerR * 2 + 14;

        // Divider
        this._drawDivider(ctx, cx, cy, cw, biome.accent);
        cy += 20;

        // Progress indicator — only for campaigns with a fixed level list;
        // Commander's Workshop is a free-form sandbox with no levels to
        // track completion of.
        if (campaign.levelCount) {
            const totalLevels = campaign.levelCount;
            const levelsCompleted = Math.round((campaign.progress / 100) * totalLevels);
            ctx.font = '16px serif';
            ctx.fillStyle = '#a08040';
            ctx.fillText(`Progress: ${levelsCompleted} / ${totalLevels} levels`, cx, cy);
            cy += 24;

            const bh = 13;
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
            cy += bh + 20;

            // Divider
            this._drawDivider(ctx, cx, cy, cw, biome.accent);
            cy += 20;
        }

        // Story
        ctx.font = 'bold 17px serif';
        ctx.fillStyle = biome.accent;
        ctx.fillText('\u2726  Story', cx, cy);
        cy += 28;

        ctx.font = '16px serif';
        ctx.fillStyle = '#c9a876';
        const storyText = campaign.story || 'A great adventure awaits...';
        cy = this._wrapTextCapped(ctx, storyText, cx, cy, cw, 23, 8);
        cy += 16;

        // Completion section — shown only when campaign is fully cleared
        if (campaign.progress >= 100) {
            this._drawDivider(ctx, cx, cy, cw, biome.accent);
            cy += 20;

            // Completion badge
            ctx.font = 'bold 19px serif';
            ctx.fillStyle = '#7edd6e';
            ctx.fillText('\u2714  Campaign Completed', cx, cy);
            cy += 30;

            // Completion story if available
            if (campaign.completionStory) {
                ctx.font = 'italic 16px serif';
                ctx.fillStyle = '#b8c8a8';
                cy = this._wrapTextCapped(ctx, campaign.completionStory, cx, cy, cw, 22, 8);
                cy += 14;
            }

            // Unlocks / rewards
            if (campaign.rewards) {
                this._drawDivider(ctx, cx, cy, cw, biome.accent);
                cy += 20;
                ctx.font = 'bold 17px serif';
                ctx.fillStyle = '#d4af37';
                ctx.fillText('\u2726  Unlocks', cx, cy);
                cy += 28;

                if (campaign.rewards.unlocks && campaign.rewards.unlocks.length > 0) {
                    ctx.font = '16px serif';
                    ctx.fillStyle = '#c9a876';
                    for (const unlockName of campaign.rewards.unlocks) {
                        if (cy > panel.y + panel.height - 130) break;
                        ctx.fillText('\u25B6  ' + unlockName, cx + 10, cy);
                        cy += 22;
                    }
                }

                // Next campaign hint
                const unlockChain = CampaignRegistry.UNLOCK_CHAIN;
                const unlockedCampaignId = unlockChain[campaign.id];
                if (unlockedCampaignId) {
                    const unlockedCamp = CampaignRegistry.getCampaign(unlockedCampaignId);
                    if (unlockedCamp) {
                        cy += 6;
                        ctx.font = 'bold 16px serif';
                        ctx.fillStyle = '#7edd6e';
                        ctx.fillText('\u25B6  Unlocked: ' + unlockedCamp.name, cx + 10, cy);
                    }
                }
            }
        }

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
            ctx.font = 'bold 20px serif';
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

            const label = campaign.id === 'sandbox' ? 'ENTER SANDBOX  \u25B6' : 'START CAMPAIGN  \u25B6';
            ctx.font = 'bold 22px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillText(label, btn.x + btn.width / 2 + 1, btn.y + btn.height / 2 + 1);
            ctx.fillStyle = isHovered ? '#000' : '#1a0f04';
            ctx.fillText(label, btn.x + btn.width / 2, btn.y + btn.height / 2);
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
            case 'Apprentice':   return '#7ab870';  // muted sage green
            case 'Warrior':      return '#c8a030';  // warm amber gold
            case 'Champion':     return '#c06040';  // muted terracotta
            case 'Legendary':    return '#9055b0';  // deep mauve
            case 'Testing':      return '#8a7a60';  // parchment grey-brown
            default:             return '#c8a878';
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

