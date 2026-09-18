import { CampaignRegistry } from '../../game/CampaignRegistry.js';
import { CAMPAIGN_BIOME, drawCampaignEmblem, preloadCampaignEmblems } from '../render/EmblemRenderer.js';
import {
    ETERNAL_GOLD_STEPS, ETERNAL_DEFAULT_CUSTOM_GOLD,
    defaultEternalOptions, normalizeEternalOptions, eternalModeLabel, formatEternalGold
} from '../systems/EternalOptions.js';
import { isValidEternalSnapshot } from '../systems/EternalSnapshot.js';

/** Draws a glowing infinity loop over a starfield - Eternal Mode's "waves without end" icon. */
function _drawEternalIcon(ctx, cx, cy, size) {
    const s = size * 0.5;

    // Deep starfield backdrop, hinting at endless time rather than endless gold
    const sky = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 1.35);
    sky.addColorStop(0, 'rgba(70, 35, 100, 0.45)');
    sky.addColorStop(1, 'rgba(20, 10, 30, 0)');
    ctx.fillStyle = sky;
    ctx.beginPath(); ctx.arc(cx, cy, s * 1.35, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = 'rgba(255, 240, 200, 0.85)';
    const stars = [
        [-0.72, -0.52, 0.028], [0.62, -0.6, 0.024], [-0.58, 0.56, 0.02],
        [0.7, 0.44, 0.026], [0.02, -0.8, 0.02], [0.18, 0.72, 0.022]
    ];
    stars.forEach(([dx, dy, r]) => {
        ctx.beginPath(); ctx.arc(cx + dx * s, cy + dy * s, r * s, 0, Math.PI * 2); ctx.fill();
    });

    // Glow behind the loop
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 0.95);
    glow.addColorStop(0, 'rgba(255, 215, 100, 0.4)');
    glow.addColorStop(1, 'rgba(255, 215, 100, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.95, 0, Math.PI * 2); ctx.fill();

    // Infinity loop - a true lemniscate-of-Bernoulli path (not two side-by-side arcs),
    // so it actually crosses itself at the center like a real "∞" instead of reading as
    // two separate or interlocking rings.
    const a = s * 0.62;
    const points = [];
    const steps = 96;
    for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2;
        const denom = 1 + Math.sin(t) * Math.sin(t);
        points.push([cx + (a * Math.cos(t)) / denom, cy + (a * Math.sin(t) * Math.cos(t)) / denom]);
    }
    const grad = ctx.createLinearGradient(cx - a, cy, cx + a, cy);
    grad.addColorStop(0, '#fff3c4'); grad.addColorStop(0.5, '#ffd700'); grad.addColorStop(1, '#fff3c4');

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    [{ style: '#8a6410', width: s * 0.26 }, { style: grad, width: s * 0.16 }].forEach(pass => {
        ctx.strokeStyle = pass.style;
        ctx.lineWidth = pass.width;
        ctx.beginPath();
        points.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
        ctx.stroke();
    });
}

export class CampaignMenu {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.campaigns = [];
        this.selectedCampaignId = null;
        this.hoveredCampaignId = null;
        this.hoveredStartButton = false;
        this.hoveredExitButton = false;

        // Eternal Mode's run options, as the player is editing them (see EternalOptions.js) -
        // startingGold etc. are kept even while Ranked is ticked (where they're ignored) so
        // toggling Ranked off and on again doesn't lose what was set. The saved run (if any)
        // is read from the save slot each time the screen is entered.
        this.eternalDraft = { ...defaultEternalOptions(), startingGold: ETERNAL_DEFAULT_CUSTOM_GOLD };
        this.eternalSave = null;
        this.hoveredEternalControl = null;
        this.hoveredLoadButton = false;

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

        // Emblem art is shared with the Hiscores tabs (see EmblemRenderer.js); missing
        // files silently fall back to each campaign's vector drawIcon().
        preloadCampaignEmblems();
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
        // (see WorkshopMenu.js). Its old slot in this list is now Eternal Mode, which moved
        // here from inside the Workshop and unlocks on defeating the Frog King (campaign-4).
        this.campaigns = CampaignRegistry.getCampaignsOrdered().filter(c => !c.locked && c.id !== 'campaign-5');
        const completedCampaigns = saveData?.completedCampaigns || [];
        if (completedCampaigns.includes('campaign-4')) {
            this.campaigns.push(this._buildSandboxEntry());
        }
        this.hoveredCampaignId = null;
        this.hoveredExitButton = false;
        this.hoveredStartButton = false;
        this.hoveredEternalControl = null;
        this.hoveredLoadButton = false;

        // Eternal Mode always opens on the standard Ranked setup - a Custom run is opt-in every time
        this.eternalDraft = { ...defaultEternalOptions(), startingGold: ETERNAL_DEFAULT_CUSTOM_GOLD };
        this.eternalSave = isValidEternalSnapshot(saveData?.eternalSave) ? saveData.eternalSave : null;

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

    /** Synthetic campaign-shaped entry for Eternal Mode (internally still the 'sandbox'
     *  level/id - only the player-facing name changed) - not a real CampaignRegistry
     *  campaign (no levels, no class to instantiate), so START CAMPAIGN is special-cased
     *  for it in handleClick()/activateFocusedButton() to launch the level directly
     *  instead of instantiating campaign.class. */
    _buildSandboxEntry() {
        return {
            id: 'sandbox',
            name: 'Eternal Mode',
            description: 'Endless, escalating waves - see how long you can hold the line.',
            icon: '∞',
            drawIcon: _drawEternalIcon,
            difficulty: 'Endless',
            class: null,
            rewards: null,
            story: 'The waves never stop, and they never stop growing. New enemy types join the fight the longer you survive, until every foe you\'ve ever faced can appear at once - and, eventually, the Frog King himself returns. Starts just like any other level: no shortcuts, no head start. How many waves can you hold the line?',
            completionStory: '',
            progress: 0,
            levelCount: null,
            locked: false
        };
    }

    /** Looks up the selected entry from this.campaigns (real campaigns + the synthetic
     *  Eternal Mode entry) rather than CampaignRegistry, which has no 'sandbox' id. */
    _getSelectedEntry() {
        return this.campaigns.find(c => c.id === this.selectedCampaignId) || null;
    }

    /** Launches Eternal Mode directly, mirroring the launch code that used to live in
     *  PlayerWorkshop's Sandbox Mode button (now removed - see PlayerWorkshop.js). */
    _launchSandbox(resumeSave = null) {
        if (this.stateManager.audioManager) this.stateManager.audioManager.playSFX('open-campaign');
        this.stateManager.selectedLevelInfo = {
            id: 'sandbox-workshop',
            name: 'Eternal Mode',
            type: 'sandbox',
            campaignId: 'campaign-5',
            // A loaded run plays under the options it was saved with (GameplayState reads them
            // back out of the save), otherwise the ones picked on this screen.
            eternalOptions: resumeSave ? resumeSave.options : normalizeEternalOptions(this.eternalDraft),
            eternalResume: resumeSave
        };
        this.stateManager.changeState('game');
    }

    // ── Eternal Mode options + saved run ──────────────────────────────────

    _isEternalSelected() {
        return this.selectedCampaignId === 'sandbox';
    }

    /**
     * Geometry of the Run Options block and the Load Saved Run button, laid out upward from
     * the Start button so they hold still no matter how long the story text above is. Shared
     * by rendering, hover and click so hitboxes always match what's drawn. Each control's
     * `enabled` flag says whether it applies in the current mode (e.g. the gold stepper does
     * nothing while Ranked is ticked).
     */
    _getEternalLayout() {
        const panel = this.getDetailPanelBounds();
        const pad = 32;
        const x = panel.x + pad;
        const w = panel.width - pad * 2;
        const start = this.getStartButtonBounds();
        const loadBtn = { x: start.x, y: start.y - 12 - start.height, width: start.width, height: start.height };

        const draft = this.eternalDraft;
        const rowH = 38;
        const rowGap = 6;
        const titleH = 34;
        const hintH = 30;
        const blockH = titleH + 5 * (rowH + rowGap) + hintH;
        const top = loadBtn.y - 22 - blockH;
        const rowY = (i) => top + titleH + i * (rowH + rowGap);

        const stepW = 36;
        const stepperRight = x + w;
        const goldY = rowY(2);
        const goldEnabled = !draft.ranked;

        return {
            x, w, top, blockH, titleH, hintY: top + titleH + 5 * (rowH + rowGap), loadBtn,
            controls: {
                ranked:      { x, y: rowY(0), w, h: rowH, enabled: true },
                hardcore:    { x: x + 34, y: rowY(1), w: w - 34, h: rowH, enabled: draft.ranked },
                goldMinus:   { x: stepperRight - 190, y: goldY + 3, w: stepW, h: rowH - 6, enabled: goldEnabled },
                goldPlus:    { x: stepperRight - stepW, y: goldY + 3, w: stepW, h: rowH - 6, enabled: goldEnabled },
                consumables: { x, y: rowY(3), w, h: rowH, enabled: !draft.ranked },
                unlockAll:   { x, y: rowY(4), w, h: rowH, enabled: !draft.ranked }
            },
            goldRow: { x, y: goldY, w, h: rowH, enabled: goldEnabled, valueX: stepperRight - 190 + stepW, valueW: 190 - stepW * 2 }
        };
    }

    /** The enabled option control under (x, y), or null. */
    _eternalControlAt(x, y) {
        const controls = this._getEternalLayout().controls;
        for (const key of Object.keys(controls)) {
            const c = controls[key];
            if (c.enabled && this._inBounds(x, y, { x: c.x, y: c.y, width: c.w, height: c.h })) return key;
        }
        return null;
    }

    _activateEternalControl(key) {
        const d = this.eternalDraft;
        switch (key) {
            case 'ranked':
                d.ranked = !d.ranked;
                if (!d.ranked) d.hardcore = false;
                break;
            case 'hardcore':
                d.hardcore = !d.hardcore;
                break;
            case 'goldMinus':
            case 'goldPlus': {
                const i = ETERNAL_GOLD_STEPS.indexOf(d.startingGold);
                const from = i === -1 ? ETERNAL_GOLD_STEPS.indexOf(ETERNAL_DEFAULT_CUSTOM_GOLD) : i;
                const next = Math.max(0, Math.min(ETERNAL_GOLD_STEPS.length - 1, from + (key === 'goldPlus' ? 1 : -1)));
                d.startingGold = ETERNAL_GOLD_STEPS[next];
                break;
            }
            case 'consumables':
                d.allowConsumables = !d.allowConsumables;
                break;
            case 'unlockAll':
                d.unlockAll = !d.unlockAll;
                break;
        }
    }

    _hitLoadButton(x, y) {
        if (!this._isEternalSelected() || !this.eternalSave) return false;
        const b = this._getEternalLayout().loadBtn;
        return this._inBounds(x, y, b);
    }

    _formatSaveDate(timestamp) {
        const d = new Date(timestamp);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ' ' +
            d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
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

        // Eternal Mode: Run Options controls and Load Saved Run
        this.hoveredEternalControl = null;
        this.hoveredLoadButton = false;
        if (this._isEternalSelected()) {
            this.hoveredEternalControl = this._eternalControlAt(x, y);
            this.hoveredLoadButton = this._hitLoadButton(x, y);
            if (this.hoveredEternalControl || this.hoveredLoadButton) pointerCursor = true;
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

        // Eternal Mode: Run Options controls and Load Saved Run
        if (this._isEternalSelected()) {
            const control = this._eternalControlAt(x, y);
            if (control) {
                if (this.stateManager.audioManager) this.stateManager.audioManager.playSFX('button-click');
                this._activateEternalControl(control);
                return;
            }
            if (this._hitLoadButton(x, y)) {
                this._launchSandbox(this.eternalSave);
                return;
            }
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
        // PRE-RENDER OPTIMIZATION: this wood-plank backdrop never changes frame-to-frame
        // (no animationTime dependence, deterministic plank/grain geometry), but was
        // previously redrawn from scratch every frame - per-plank bezierCurveTo grain
        // lines plus a radial-gradient vignette. Cache it to an offscreen canvas once and
        // just blit it, same pattern as SettlementHub._ensureBackdropLayers.
        this._ensureBackgroundLayer(canvas);
        ctx.drawImage(this._bgCanvas, 0, 0);
    }

    _ensureBackgroundLayer(canvas) {
        const W = canvas.width;
        const H = canvas.height;
        if (this._bgCanvas && this._bgLayerW === W && this._bgLayerH === H) {
            return;
        }
        this._bgLayerW = W;
        this._bgLayerH = H;

        this._bgCanvas = document.createElement('canvas');
        this._bgCanvas.width = W;
        this._bgCanvas.height = H;
        const bctx = this._bgCanvas.getContext('2d');

        // Base coat
        bctx.fillStyle = '#100802';
        bctx.fillRect(0, 0, W, H);

        // Wood planks - horizontal bands with alternating tones
        const plankHeight = 88;
        const plankTones = ['#1c1005', '#1a0f05', '#1e1106', '#190e04', '#1b1005'];
        const planksCount = Math.ceil(H / plankHeight) + 1;
        for (let p = 0; p < planksCount; p++) {
            const py = p * plankHeight;
            const tone = plankTones[p % plankTones.length];
            bctx.fillStyle = tone;
            bctx.fillRect(0, py, W, plankHeight);

            // Top plank shadow line
            bctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
            bctx.fillRect(0, py, W, 2);
            // Highlight just below seam
            bctx.fillStyle = 'rgba(200, 130, 60, 0.04)';
            bctx.fillRect(0, py + 2, W, 5);

            // Wood grain lines — subtle horizontal curves
            const grainLines = 5 + (p % 3);
            bctx.save();
            bctx.beginPath();
            bctx.rect(0, py, W, plankHeight);
            bctx.clip();
            for (let g = 0; g < grainLines; g++) {
                const grainY = py + (plankHeight / (grainLines + 1)) * (g + 1);
                const waveA = Math.sin(p * 1.3 + g * 0.7) * 6;
                const waveB = Math.cos(p * 0.9 + g * 1.1) * 4;
                bctx.strokeStyle = 'rgba(70, 35, 8, 0.22)';
                bctx.lineWidth = 1;
                bctx.beginPath();
                bctx.moveTo(0, grainY + waveA);
                bctx.bezierCurveTo(
                    W * 0.3, grainY + waveA + waveB,
                    W * 0.7, grainY - waveA + waveB,
                    W, grainY - waveA * 0.5
                );
                bctx.stroke();
            }
            bctx.restore();
        }

        // Vignette — darkens edges for depth
        const vign = bctx.createRadialGradient(
            W / 2, H / 2, H * 0.15,
            W / 2, H / 2, H * 0.9
        );
        vign.addColorStop(0, 'rgba(0,0,0,0)');
        vign.addColorStop(1, 'rgba(0,0,0,0.72)');
        bctx.fillStyle = vign;
        bctx.fillRect(0, 0, W, H);
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

    /** Campaign emblem medallion - see drawCampaignEmblem in EmblemRenderer.js (shared with the Hiscores tabs). */
    _drawEmblem(ctx, campaign, x, y, radius, biome, isSelected, isHovered) {
        drawCampaignEmblem(ctx, campaign, x, y, radius, isSelected, isHovered);
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
            const totalLevels = campaign.levelCount;
            const levelsCompleted = Math.round((campaign.progress / 100) * totalLevels);

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

        // Eternal Mode: run options + saved run, just above the Start button
        if (campaign.id === 'sandbox') {
            this._renderEternalOptions(ctx, biome);
            this._renderLoadButton(ctx);
        }

        // Start button
        this._renderStartButton(ctx, campaign);
    }

    _renderEternalOptions(ctx, biome) {
        const L = this._getEternalLayout();
        const d = this.eternalDraft;
        const hover = this.hoveredEternalControl;

        // Section header
        this._drawDivider(ctx, L.x, L.top, L.w, biome.accent);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 17px serif';
        ctx.fillStyle = biome.accent;
        ctx.fillText('\u2726  Run Options', L.x, L.top + L.titleH / 2 + 4);

        const row = (key, label, description, checked) => {
            const c = L.controls[key];
            const isHover = hover === key && c.enabled;
            if (isHover) {
                ctx.fillStyle = 'rgba(212,175,55,0.08)';
                ctx.fillRect(c.x, c.y, c.w, c.h);
            }
            this._drawCheckbox(ctx, c.x + 6, c.y + (c.h - 22) / 2, 22, checked, c.enabled, isHover);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 17px serif';
            ctx.fillStyle = !c.enabled ? '#5a4a3a' : (isHover ? '#ffd700' : '#e8d49a');
            ctx.fillText(label, c.x + 40, c.y + c.h / 2);
            ctx.font = '13px serif';
            ctx.textAlign = 'right';
            ctx.fillStyle = c.enabled ? '#a08040' : '#4a3c2c';
            ctx.fillText(description, c.x + c.w - 6, c.y + c.h / 2);
        };

        row('ranked', 'Ranked', 'Standard rules \u00B7 your best wave is recorded', d.ranked);
        row('hardcore', 'Hardcore', 'No saving \u00B7 recorded on its own hiscore line', d.ranked && d.hardcore);

        // Starting gold stepper - fixed while Ranked (the normal starting gold applies)
        const g = L.goldRow;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 17px serif';
        ctx.fillStyle = g.enabled ? '#e8d49a' : '#5a4a3a';
        ctx.fillText('Starting gold', g.x + 40, g.y + g.h / 2);
        for (const key of ['goldMinus', 'goldPlus']) {
            this._drawStepperButton(ctx, L.controls[key], key === 'goldPlus', hover === key);
        }
        ctx.textAlign = 'center';
        ctx.font = 'bold 18px serif';
        ctx.fillStyle = g.enabled ? '#ffd700' : '#5a4a3a';
        ctx.fillText(d.ranked ? 'Standard' : formatEternalGold(d.startingGold), g.valueX + g.valueW / 2, g.y + g.h / 2);

        row('consumables', 'Allow consumables', 'Marketplace items apply and are used up', !d.ranked && d.allowConsumables);
        row('unlockAll', 'Everything unlocked', 'Every tower and building from the start', !d.ranked && d.unlockAll);

        // What the current choice means
        const mode = normalizeEternalOptions(d);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = 'italic 14px serif';
        ctx.fillStyle = mode.ranked ? '#b8c8a8' : '#d8a878';
        const hint = !mode.ranked
            ? 'Custom run \u2014 nothing is recorded on the Hiscores.'
            : (mode.hardcore
                ? 'Hardcore Ranked \u2014 standard rules, but saving is not allowed.'
                : 'Ranked \u2014 standard rules, and you can save your run from the game menu.');
        ctx.fillText(hint, L.x + 6, L.hintY + 14);
    }

    _drawCheckbox(ctx, x, y, size, checked, enabled, hovered) {
        ctx.fillStyle = enabled ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.25)';
        ctx.fillRect(x, y, size, size);
        ctx.strokeStyle = !enabled ? 'rgba(120,100,70,0.3)' : (hovered ? '#ffd700' : '#a08040');
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
        if (checked) {
            ctx.save();
            ctx.strokeStyle = enabled ? '#ffd700' : 'rgba(200,170,90,0.4)';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(x + size * 0.22, y + size * 0.55);
            ctx.lineTo(x + size * 0.42, y + size * 0.76);
            ctx.lineTo(x + size * 0.79, y + size * 0.27);
            ctx.stroke();
            ctx.restore();
        }
    }

    _drawStepperButton(ctx, c, pointsRight, hovered) {
        ctx.fillStyle = !c.enabled ? 'rgba(0,0,0,0.25)' : (hovered ? 'rgba(212,175,55,0.22)' : 'rgba(0,0,0,0.45)');
        ctx.fillRect(c.x, c.y, c.w, c.h);
        ctx.strokeStyle = !c.enabled ? 'rgba(120,100,70,0.3)' : (hovered ? '#ffd700' : '#a08040');
        ctx.lineWidth = 1.5;
        ctx.strokeRect(c.x + 0.5, c.y + 0.5, c.w - 1, c.h - 1);

        const cx = c.x + c.w / 2;
        const cy = c.y + c.h / 2;
        const r = 7;
        const dir = pointsRight ? 1 : -1;
        ctx.fillStyle = !c.enabled ? '#4a3c2c' : (hovered ? '#ffd700' : '#d4af37');
        ctx.beginPath();
        ctx.moveTo(cx + dir * r * 0.8, cy);
        ctx.lineTo(cx - dir * r * 0.6, cy - r);
        ctx.lineTo(cx - dir * r * 0.6, cy + r);
        ctx.closePath();
        ctx.fill();
    }

    /** Load Saved Run: sits just above the Start button and reads as its sibling. */
    _renderLoadButton(ctx) {
        const btn = this._getEternalLayout().loadBtn;
        const save = this.eternalSave;
        const hovered = this.hoveredLoadButton && !!save;

        const bg = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
        if (!save) {
            bg.addColorStop(0, '#242424');
            bg.addColorStop(1, '#1c1c1c');
        } else if (hovered) {
            bg.addColorStop(0, '#5a4a7a');
            bg.addColorStop(1, '#3f3258');
        } else {
            bg.addColorStop(0, '#4a3c66');
            bg.addColorStop(1, '#33294a');
        }
        ctx.fillStyle = bg;
        ctx.fillRect(btn.x, btn.y, btn.width, btn.height);

        ctx.strokeStyle = !save ? '#3a3a3a' : (hovered ? '#c99bf0' : '#8b6fb0');
        ctx.lineWidth = hovered ? 2.5 : 1.5;
        ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const cx = btn.x + btn.width / 2;
        if (save) {
            ctx.font = 'bold 20px serif';
            ctx.fillStyle = hovered ? '#ffffff' : '#e6d8ff';
            ctx.fillText('LOAD SAVED RUN  \u25B6', cx, btn.y + btn.height * 0.36);
            ctx.font = '14px serif';
            ctx.fillStyle = '#c9b8e8';
            const when = this._formatSaveDate(save.savedAt);
            ctx.fillText(
                `Wave ${save.wave} \u00B7 ${eternalModeLabel(save.options)}${when ? ' \u00B7 ' + when : ''}`,
                cx, btn.y + btn.height * 0.7
            );
        } else {
            ctx.font = 'bold 18px serif';
            ctx.fillStyle = '#5a5a5a';
            ctx.fillText('NO SAVED RUN', cx, btn.y + btn.height * 0.36);
            ctx.font = '13px serif';
            ctx.fillStyle = '#4a4a4a';
            ctx.fillText('Use Save Progress in the in-game menu', cx, btn.y + btn.height * 0.7);
        }
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

            const label = campaign.id === 'sandbox'
                ? (this.eternalSave ? 'START NEW RUN  \u25B6' : 'ENTER ETERNAL MODE  \u25B6')
                : 'START CAMPAIGN  \u25B6';
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

