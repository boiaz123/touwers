import { CampaignBase } from './CampaignBase.js';
import { LevelRegistry } from '../levels/LevelRegistry.js';
import { SandboxLevel } from '../levels/Campaign5/SandboxLevel.js';
import { PlayerCreatedLevel } from '../levels/PlayerCreatedLevel.js';
import { FrogKingsRealmLevel } from '../levels/FrogKingsRealm/FrogKingsRealmLevel.js';

const LEGACY_STORAGE_KEY = 'touwers_player_levels';
const SLOT_COUNT = 6;

/**
 * Commander's Workshop (campaign-5 state)
 * A panel-based UI for playing player-created levels and sandbox mode.
 * Unlocked after defeating the Frog King (final boss of campaign-4).
 */
export class PlayerWorkshop extends CampaignBase {
    constructor(stateManager) {
        super(stateManager);

        this.campaignId = 'campaign-5';
        this.campaignName = "Commander's Workshop";

        // Panel interaction state
        this.hoveredCard = -1;
        this.hoveredDesignerBtn = false;

        // Player level data loaded from localStorage
        this.playerLevels = Array(SLOT_COUNT).fill(null);

        // Register sandbox level once
        this._ensureSandboxRegistered();
    }

    _ensureSandboxRegistered() {
        const existing = LevelRegistry.getLevelsByCampaign('campaign-5');
        if (!existing.find(l => l.id === 'sandbox-workshop')) {
            LevelRegistry.registerLevel('campaign-5', 'sandbox-workshop', SandboxLevel, SandboxLevel.levelMetadata);
        }
        // Register frog-kings-realm so the portal shard can launch it via campaign-5
        if (!existing.find(l => l.id === 'frog-kings-realm')) {
            LevelRegistry.registerLevel('campaign-5', 'frog-kings-realm', FrogKingsRealmLevel, FrogKingsRealmLevel.levelMetadata);
        }
    }

    // ---- Layout helpers ----

    _getCardBounds(index) {
        const canvas = this.stateManager.canvas;
        const W = canvas.width;
        const H = canvas.height;
        const cardW = Math.round(W * 0.27);
        const cardH = Math.round(H * 0.165);
        const gapX = Math.round(W * 0.03);
        const gapY = Math.round(H * 0.045);
        const cols = 3;
        const totalRowW = cols * cardW + (cols - 1) * gapX;
        const startX = Math.round((W - totalRowW) / 2);
        const row1Y = Math.round(H * 0.30);
        const col = index % cols;
        const row = Math.floor(index / cols);
        return {
            x: startX + col * (cardW + gapX),
            y: row1Y + row * (cardH + gapY),
            w: cardW,
            h: cardH
        };
    }

    _getSandboxBounds() {
        const canvas = this.stateManager.canvas;
        const W = canvas.width;
        const H = canvas.height;
        const w = Math.round(W * 0.22);
        const h = Math.round(H * 0.09);
        return {
            x: Math.round((W - w) / 2),
            y: Math.round(H * 0.775),
            w,
            h
        };
    }

    _getDesignerBtnBounds() {
        const canvas = this.stateManager.canvas;
        return {
            x: 14,
            y: 14,
            width: Math.round(canvas.width * 0.165),
            height: 44
        };
    }

    // ---- Lifecycle ----

    enter() {
        this._loadPlayerLevels();
        this._registerPlayerLevels();

        const statsBar = document.getElementById('stats-bar');
        const sidebar = document.getElementById('tower-sidebar');
        if (statsBar) statsBar.style.display = 'none';
        if (sidebar) sidebar.style.display = 'none';

        this.hoveredCard = -1;
        this.hoveredDesignerBtn = false;
        this.hoveredCampaignBtn = false;
        this.hoveredSettlementBtn = false;

        if (this.stateManager.audioManager) {
            this.stateManager.audioManager.playMusicCategory(this.campaignId);
        }

        this.setupMouseListeners();
    }

    exit() {
        this.removeMouseListeners();
    }

    // ---- Data ----

    _loadPlayerLevels() {
        // Primary: read from save slot
        const saveData = this.stateManager.currentSaveData;
        if (saveData && Array.isArray(saveData.playerLevels)) {
            this.playerLevels = saveData.playerLevels.slice(0, SLOT_COUNT);
            while (this.playerLevels.length < SLOT_COUNT) {
                this.playerLevels.push(null);
            }
            return;
        }
        // Legacy fallback: migrate from global localStorage key
        try {
            const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    this.playerLevels = parsed.slice(0, SLOT_COUNT);
                    while (this.playerLevels.length < SLOT_COUNT) {
                        this.playerLevels.push(null);
                    }
                    return;
                }
            }
        } catch (e) {
            // Malformed legacy data, ignore
        }
        this.playerLevels = Array(SLOT_COUNT).fill(null);
    }

    _registerPlayerLevels() {
        for (let i = 0; i < SLOT_COUNT; i++) {
            const data = this.playerLevels[i];
            if (data) {
                const slotId = `player-level-${i + 1}`;
                const LevelClass = PlayerCreatedLevel.createClass(data);
                const meta = {
                    name: data.name || `Custom Level ${i + 1}`,
                    difficulty: 'Custom',
                    order: 10 + i,
                    campaign: data.campaign || 'forest'
                };
                LevelRegistry.registerLevel('campaign-5', slotId, LevelClass, meta);
            }
        }
    }

    // ---- Input ----

    handleMouseMove(e) {
        const canvas = this.stateManager.canvas;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        this.hoveredCard = -1;
        this.hoveredDesignerBtn = false;
        this.hoveredCampaignBtn = false;
        this.hoveredSettlementBtn = false;

        const dbtn = this._getDesignerBtnBounds();
        if (x >= dbtn.x && x <= dbtn.x + dbtn.width && y >= dbtn.y && y <= dbtn.y + dbtn.height) {
            this.hoveredDesignerBtn = true;
            canvas.style.cursor = 'pointer';
            return;
        }

        const campaignBtn = this.getCampaignBtnBounds();
        if (x >= campaignBtn.x && x <= campaignBtn.x + campaignBtn.width &&
            y >= campaignBtn.y && y <= campaignBtn.y + campaignBtn.height) {
            this.hoveredCampaignBtn = true;
            canvas.style.cursor = 'pointer';
            return;
        }

        const settlementBtn = this.getSettlementBtnBounds();
        if (x >= settlementBtn.x && x <= settlementBtn.x + settlementBtn.width &&
            y >= settlementBtn.y && y <= settlementBtn.y + settlementBtn.height) {
            this.hoveredSettlementBtn = true;
            canvas.style.cursor = 'pointer';
            return;
        }

        for (let i = 0; i < SLOT_COUNT; i++) {
            const b = this._getCardBounds(i);
            if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
                if (this.playerLevels[i] !== null) {
                    this.hoveredCard = i;
                    canvas.style.cursor = 'pointer';
                    return;
                }
            }
        }

        const sb = this._getSandboxBounds();
        if (x >= sb.x && x <= sb.x + sb.w && y >= sb.y && y <= sb.y + sb.h) {
            this.hoveredCard = SLOT_COUNT;
            canvas.style.cursor = 'pointer';
            return;
        }

        canvas.style.cursor = 'default';
    }

    handleClick(x, y) {
        const dbtn = this._getDesignerBtnBounds();
        if (x >= dbtn.x && x <= dbtn.x + dbtn.width && y >= dbtn.y && y <= dbtn.y + dbtn.height) {
            if (this.stateManager.audioManager) this.stateManager.audioManager.playSFX('button-click');
            this.stateManager.changeState('levelDesigner');
            return;
        }

        const campaignBtn = this.getCampaignBtnBounds();
        if (x >= campaignBtn.x && x <= campaignBtn.x + campaignBtn.width &&
            y >= campaignBtn.y && y <= campaignBtn.y + campaignBtn.height) {
            if (this.stateManager.audioManager) this.stateManager.audioManager.playSFX('button-click');
            this.stateManager.changeState('campaignMenu');
            return;
        }

        const settlementBtn = this.getSettlementBtnBounds();
        if (x >= settlementBtn.x && x <= settlementBtn.x + settlementBtn.width &&
            y >= settlementBtn.y && y <= settlementBtn.y + settlementBtn.height) {
            if (this.stateManager.audioManager) this.stateManager.audioManager.playSFX('button-click');
            this.stateManager.changeState('settlementHub');
            return;
        }

        for (let i = 0; i < SLOT_COUNT; i++) {
            const b = this._getCardBounds(i);
            if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
                const data = this.playerLevels[i];
                if (data) {
                    if (this.stateManager.audioManager) this.stateManager.audioManager.playSFX('button-click');
                    const slotId = `player-level-${i + 1}`;
                    this.stateManager.selectedLevelInfo = {
                        id: slotId,
                        name: data.name || `Custom Level ${i + 1}`,
                        type: 'campaign',
                        campaignId: 'campaign-5'
                    };
                    this.stateManager.changeState('game');
                }
                return;
            }
        }

        const sb = this._getSandboxBounds();
        if (x >= sb.x && x <= sb.x + sb.w && y >= sb.y && y <= sb.y + sb.h) {
            if (this.stateManager.audioManager) this.stateManager.audioManager.playSFX('button-click');
            this.stateManager.selectedLevelInfo = {
                id: 'sandbox-workshop',
                name: 'Sandbox Mode',
                type: 'sandbox',
                campaignId: 'campaign-5'
            };
            this.stateManager.changeState('game');
            return;
        }
    }

    // ---- Rendering ----

    render(ctx) {
        const canvas = this.stateManager.canvas;
        const W = canvas.width;
        const H = canvas.height;

        this._drawBackground(ctx, W, H);
        this._drawTitle(ctx, W, H);
        this._drawPlayerLevelCards(ctx, W, H);
        this._drawSandboxButton(ctx);
        this._drawDesignerButton(ctx);
        this.renderNavButtons(ctx);
    }

    _drawBackground(ctx, W, H) {
        // Base coat — very dark wood
        ctx.fillStyle = '#100802';
        ctx.fillRect(0, 0, W, H);

        // Wood plank horizontal bands
        const plankHeight = 88;
        const plankTones = ['#1c1005', '#1a0f05', '#1e1106', '#190e04', '#1b1005'];
        const planksCount = Math.ceil(H / plankHeight) + 1;
        for (let p = 0; p < planksCount; p++) {
            const py = p * plankHeight;
            ctx.fillStyle = plankTones[p % plankTones.length];
            ctx.fillRect(0, py, W, plankHeight);

            // Plank seam shadow
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillRect(0, py, W, 2);
            // Highlight just below seam
            ctx.fillStyle = 'rgba(200,130,60,0.04)';
            ctx.fillRect(0, py + 2, W, 5);

            // Wood grain lines
            const grainLines = 5 + (p % 3);
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, py, W, plankHeight);
            ctx.clip();
            for (let g = 0; g < grainLines; g++) {
                const grainY = py + (plankHeight / (grainLines + 1)) * (g + 1);
                const waveA = Math.sin(p * 1.3 + g * 0.7) * 6;
                const waveB = Math.cos(p * 0.9 + g * 1.1) * 4;
                ctx.strokeStyle = 'rgba(70,35,8,0.22)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, grainY + waveA);
                ctx.bezierCurveTo(
                    W * 0.3, grainY + waveA + waveB,
                    W * 0.7, grainY - waveA + waveB,
                    W, grainY - waveA * 0.5
                );
                ctx.stroke();
            }
            ctx.restore();
        }

        // Vignette
        const vign = ctx.createRadialGradient(
            W / 2, H / 2, H * 0.15,
            W / 2, H / 2, H * 0.9
        );
        vign.addColorStop(0, 'rgba(0,0,0,0)');
        vign.addColorStop(1, 'rgba(0,0,0,0.72)');
        ctx.fillStyle = vign;
        ctx.fillRect(0, 0, W, H);

        // Horizontal gold rule below title area
        ctx.fillStyle = 'rgba(212,175,55,0.18)';
        ctx.fillRect(Math.round(W * 0.1), Math.round(H * 0.265), Math.round(W * 0.8), 1);
    }

    _drawTitle(ctx, W, H) {
        const titleY = Math.round(H * 0.14);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Main title — gold with dark outline
        const titleSize = Math.max(28, Math.round(W * 0.026));
        ctx.font = `bold ${titleSize}px serif`;
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = 3;
        ctx.strokeText("COMMANDER'S WORKSHOP", W / 2, titleY);
        ctx.fillStyle = '#d4af37';
        ctx.fillText("COMMANDER'S WORKSHOP", W / 2, titleY);

        // Subtitle
        ctx.font = `${Math.max(13, Math.round(W * 0.0115))}px serif`;
        ctx.fillStyle = '#8a7a5a';
        ctx.fillText('Design and command your own battle maps', W / 2, titleY + titleSize * 0.88);

        // Decorative diamond ornaments flanking the title
        const ornX1 = W / 2 - Math.round(W * 0.22);
        const ornX2 = W / 2 + Math.round(W * 0.22);
        const ornY = titleY;
        const r = 5;
        [ornX1, ornX2].forEach(ox => {
            ctx.fillStyle = '#8a7040';
            ctx.beginPath();
            ctx.moveTo(ox, ornY - r);
            ctx.lineTo(ox + r, ornY);
            ctx.lineTo(ox, ornY + r);
            ctx.lineTo(ox - r, ornY);
            ctx.closePath();
            ctx.fill();
        });
    }

    _drawPlayerLevelCards(ctx, W, H) {
        for (let i = 0; i < SLOT_COUNT; i++) {
            const b = this._getCardBounds(i);
            const data = this.playerLevels[i];
            const isHovered = this.hoveredCard === i;
            const isEmpty = data === null;

            // Drop shadow
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillRect(b.x + 5, b.y + 5, b.w, b.h);

            // Card background — wood panel
            const cardBg = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
            if (isEmpty) {
                cardBg.addColorStop(0, '#1e160a');
                cardBg.addColorStop(1, '#150e05');
            } else if (isHovered) {
                cardBg.addColorStop(0, '#352510');
                cardBg.addColorStop(1, '#241808');
            } else {
                cardBg.addColorStop(0, '#281c0c');
                cardBg.addColorStop(1, '#1c1206');
            }
            ctx.fillStyle = cardBg;
            ctx.fillRect(b.x, b.y, b.w, b.h);

            // Subtle horizontal grain lines
            ctx.save();
            ctx.beginPath();
            ctx.rect(b.x, b.y, b.w, b.h);
            ctx.clip();
            for (let g = 0; g < 4; g++) {
                const gy = b.y + (b.h / 5) * (g + 1);
                ctx.strokeStyle = 'rgba(200,150,60,0.05)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(b.x, gy);
                ctx.lineTo(b.x + b.w, gy);
                ctx.stroke();
            }
            ctx.restore();

            // Left accent bar
            ctx.fillStyle = isHovered ? '#d4af37' : (isEmpty ? '#3a2a14' : '#7a6030');
            ctx.fillRect(b.x, b.y, isHovered ? 5 : 4, b.h);

            // Outer border
            if (isHovered) {
                ctx.shadowColor = 'rgba(212,175,55,0.4)';
                ctx.shadowBlur = 12;
            }
            ctx.strokeStyle = isEmpty ? 'rgba(80,60,30,0.5)' : (isHovered ? '#d4af37' : 'rgba(160,130,80,0.45)');
            ctx.lineWidth = isHovered ? 2 : 1;
            ctx.strokeRect(b.x, b.y, b.w, b.h);
            ctx.shadowColor = 'rgba(0,0,0,0)';
            ctx.shadowBlur = 0;

            // Inner accent border on hover
            if (isHovered) {
                ctx.strokeStyle = 'rgba(212,175,55,0.18)';
                ctx.lineWidth = 1;
                ctx.strokeRect(b.x + 3, b.y + 3, b.w - 6, b.h - 6);
            }

            // Slot number badge
            const badgeR = Math.round(b.h * 0.2);
            ctx.fillStyle = isEmpty ? 'rgba(40,28,10,0.7)' : (isHovered ? 'rgba(180,140,40,0.9)' : 'rgba(100,78,28,0.85)');
            ctx.beginPath();
            ctx.arc(b.x + badgeR + 12, b.y + badgeR + 9, badgeR, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = isEmpty ? '#3a2a10' : (isHovered ? '#ffd700' : '#8a6a20');
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.font = `bold ${Math.round(badgeR * 1.1)}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isEmpty ? '#4a3820' : '#ffd700';
            ctx.fillText(i + 1, b.x + badgeR + 12, b.y + badgeR + 9);

            ctx.textAlign = 'left';
            const textX = b.x + badgeR * 2 + 22;
            const midY = b.y + b.h / 2;

            if (isEmpty) {
                ctx.font = `italic ${Math.round(b.h * 0.17)}px serif`;
                ctx.fillStyle = '#4a3820';
                ctx.fillText('Empty Slot', textX, midY - Math.round(b.h * 0.09));
                ctx.font = `${Math.round(b.h * 0.12)}px serif`;
                ctx.fillStyle = '#3a2a14';
                ctx.fillText('Use Level Designer to fill', textX, midY + Math.round(b.h * 0.13));
            } else {
                const maxNameW = b.w - (textX - b.x) - 14;
                ctx.font = `bold ${Math.round(b.h * 0.18)}px serif`;
                ctx.fillStyle = isHovered ? '#ffd700' : '#e8d49a';
                const name = data.name || `Custom Level ${i + 1}`;
                ctx.save();
                ctx.beginPath();
                ctx.rect(textX, b.y + 4, maxNameW, b.h - 8);
                ctx.clip();
                ctx.fillText(name, textX, midY - Math.round(b.h * 0.11));
                ctx.restore();

                const waveCount = (data.waves && data.waves.length) || 0;
                ctx.font = `${Math.round(b.h * 0.12)}px serif`;
                ctx.fillStyle = isHovered ? '#b09060' : '#7a6040';
                ctx.fillText(`${waveCount} wave${waveCount !== 1 ? 's' : ''}  |  ${data.campaign || 'forest'}`, textX, midY + Math.round(b.h * 0.15));

                if (isHovered) {
                    ctx.textAlign = 'right';
                    ctx.font = `bold ${Math.round(b.h * 0.14)}px serif`;
                    ctx.fillStyle = '#d4af37';
                    ctx.fillText('PLAY', b.x + b.w - 14, b.y + b.h - 13);
                    ctx.textAlign = 'left';
                }
            }
        }
    }

    _drawSandboxButton(ctx) {
        const sb = this._getSandboxBounds();
        const isHovered = this.hoveredCard === SLOT_COUNT;

        // Drop shadow
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(sb.x + 4, sb.y + 4, sb.w, sb.h);

        // Background gradient — standard wood button
        if (isHovered) {
            const bg = ctx.createLinearGradient(0, sb.y, 0, sb.y + sb.h);
            bg.addColorStop(0, 'rgba(90,74,63,0.98)');
            bg.addColorStop(0.5, 'rgba(74,58,47,0.98)');
            bg.addColorStop(1, 'rgba(64,48,37,0.98)');
            ctx.fillStyle = bg;
        } else {
            const bg = ctx.createLinearGradient(0, sb.y, 0, sb.y + sb.h);
            bg.addColorStop(0, 'rgba(68,48,28,0.9)');
            bg.addColorStop(0.5, 'rgba(48,28,8,0.9)');
            bg.addColorStop(1, 'rgba(38,18,0,0.9)');
            ctx.fillStyle = bg;
        }
        ctx.fillRect(sb.x, sb.y, sb.w, sb.h);

        // Border with optional glow
        if (isHovered) {
            ctx.shadowColor = 'rgba(212,175,55,0.5)';
            ctx.shadowBlur = 18;
        }
        ctx.strokeStyle = isHovered ? '#ffe700' : '#8a6028';
        ctx.lineWidth = isHovered ? 3 : 2;
        ctx.strokeRect(sb.x, sb.y, sb.w, sb.h);
        ctx.shadowColor = 'rgba(0,0,0,0)';
        ctx.shadowBlur = 0;

        // Top highlight
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sb.x + 1, sb.y + 1);
        ctx.lineTo(sb.x + sb.w - 1, sb.y + 1);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Label shadow + text
        ctx.font = `bold ${Math.round(sb.h * 0.33)}px serif`;
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillText('SANDBOX MODE', sb.x + sb.w / 2 + 1, sb.y + sb.h * 0.43 + 1);
        ctx.fillStyle = isHovered ? '#ffe700' : '#d4af37';
        ctx.fillText('SANDBOX MODE', sb.x + sb.w / 2, sb.y + sb.h * 0.43);

        ctx.font = `${Math.round(sb.h * 0.22)}px serif`;
        ctx.fillStyle = isHovered ? '#b09060' : '#7a6040';
        ctx.fillText('Unlimited gold - no waves', sb.x + sb.w / 2, sb.y + sb.h * 0.73);
    }

    _drawDesignerButton(ctx) {
        const btn = this._getDesignerBtnBounds();
        const isHovered = this.hoveredDesignerBtn;

        // Background gradient — standard game button style
        if (isHovered) {
            const bgGrad = ctx.createLinearGradient(0, btn.y, 0, btn.y + btn.height);
            bgGrad.addColorStop(0, 'rgba(90,74,63,0.98)');
            bgGrad.addColorStop(0.5, 'rgba(74,58,47,0.98)');
            bgGrad.addColorStop(1, 'rgba(64,48,37,0.98)');
            ctx.fillStyle = bgGrad;
        } else {
            const bgGrad = ctx.createLinearGradient(0, btn.y, 0, btn.y + btn.height);
            bgGrad.addColorStop(0, 'rgba(68,48,28,0.88)');
            bgGrad.addColorStop(0.5, 'rgba(48,28,8,0.88)');
            bgGrad.addColorStop(1, 'rgba(38,18,0,0.88)');
            ctx.fillStyle = bgGrad;
        }
        ctx.fillRect(btn.x, btn.y, btn.width, btn.height);

        // Border with optional glow
        if (isHovered) {
            ctx.shadowColor = 'rgba(212,175,55,0.5)';
            ctx.shadowBlur = 18;
        }
        ctx.strokeStyle = isHovered ? '#ffe700' : '#7a6038';
        ctx.lineWidth = isHovered ? 3 : 2;
        ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);
        ctx.shadowColor = 'rgba(0,0,0,0)';
        ctx.shadowBlur = 0;

        // Top highlight
        ctx.strokeStyle = 'rgba(255,255,255,0.13)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(btn.x + 1, btn.y + 1);
        ctx.lineTo(btn.x + btn.width - 1, btn.y + 1);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 13px serif';

        // Text shadow + text
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillText('LEVEL DESIGNER', btn.x + btn.width / 2 + 1, btn.y + btn.height / 2 + 1);
        ctx.fillStyle = isHovered ? '#ffe700' : '#d4af37';
        ctx.fillText('LEVEL DESIGNER', btn.x + btn.width / 2, btn.y + btn.height / 2);
    }

    update(deltaTime) {}
}
