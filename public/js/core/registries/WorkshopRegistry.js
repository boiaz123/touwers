/**
 * WorkshopRegistry - Centralized registry for items purchasable in the Workshop shop
 * (enemy types and campaign themes for use in the Level Designer).
 */
import { EnemyIntelRegistry } from './EnemyIntelRegistry.js';
import { CampaignRegistry } from '../../game/CampaignRegistry.js';
import { drawMedallion, drawCoverImage } from '../render/EmblemRenderer.js';

// Chance (0-1) that a killed enemy drops a token for its own type. Only rolled
// once the Commander's Workshop upgrade has been purchased (see EnemyManager).
export const TOKEN_DROP_CHANCE = 0.001;

// ── Token icon cache (module-level so every draw call shares one Image per enemy) ──
const _enemyImageCache = new Map();
function _getEnemyImage(enemyId, imagePath) {
    let entry = _enemyImageCache.get(enemyId);
    if (entry) return entry;
    entry = { img: null, loaded: false };
    _enemyImageCache.set(enemyId, entry);
    const img = new Image();
    img.onload = () => { entry.img = img; entry.loaded = true; };
    img.onerror = () => { entry.loaded = true; };
    img.src = imagePath;
    return entry;
}

/** Draws a coin/medallion frame and returns the inset radius available for the portrait. */
function _drawCoinFrame(ctx, cx, cy, size, rimColorA, rimColorB) {
    ctx.save();
    const outerR = size * 0.46;
    const rimW = size * 0.09;

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.arc(cx + 1.5, cy + 2, outerR, 0, Math.PI * 2);
    ctx.fill();

    // Metallic rim
    const ringGrad = ctx.createLinearGradient(cx - outerR, cy - outerR, cx + outerR, cy + outerR);
    ringGrad.addColorStop(0, rimColorA);
    ringGrad.addColorStop(0.5, rimColorB);
    ringGrad.addColorStop(1, rimColorA);
    ctx.strokeStyle = ringGrad;
    ctx.lineWidth = rimW;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR - rimW / 2, 0, Math.PI * 2);
    ctx.stroke();

    // Coin-edge notches
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    const notches = 18;
    for (let i = 0; i < notches; i++) {
        const a = (i / notches) * Math.PI * 2;
        const x1 = cx + Math.cos(a) * (outerR - 0.5);
        const y1 = cy + Math.sin(a) * (outerR - 0.5);
        const x2 = cx + Math.cos(a) * (outerR - rimW + 1);
        const y2 = cy + Math.sin(a) * (outerR - rimW + 1);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    // Inner well background
    const innerR = outerR - rimW;
    ctx.fillStyle = '#1a1208';
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fill();

    // Rim highlight (top-left glint)
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = rimW * 0.35;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR - rimW * 0.2, Math.PI * 1.05, Math.PI * 1.55);
    ctx.stroke();

    ctx.restore();
    return innerR;
}

/**
 * Draws a token icon for a regular enemy type, built from the same portrait
 * used on its Spy Intel card, set inside a coin/medallion frame.
 */
export function drawEnemyTokenIcon(ctx, cx, cy, size, enemyId) {
    const insetR = _drawCoinFrame(ctx, cx, cy, size, '#e8c66a', '#8a6a20');
    const intel = EnemyIntelRegistry.getEnemyIntel(enemyId);
    const entry = intel && intel.image ? _getEnemyImage(enemyId, intel.image) : null;

    if (entry && entry.loaded && entry.img) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, insetR, 0, Math.PI * 2);
        ctx.clip();
        const d = insetR * 2;
        ctx.drawImage(entry.img, cx - insetR, cy - insetR, d, d);
        ctx.restore();
        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, insetR - 1, 0, Math.PI * 2);
        ctx.stroke();
        return;
    }

    // Placeholder silhouette while the portrait is still loading
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, insetR, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = 'rgba(200,180,120,0.32)';
    ctx.beginPath();
    ctx.arc(cx, cy - insetR * 0.15, insetR * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, cy + insetR * 0.65, insetR * 0.55, insetR * 0.4, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

/**
 * Draws a token icon for the Frog King, reusing the crown-and-frog-eyes glyph
 * already drawn for campaign-4 in CampaignRegistry (no static portrait exists
 * for this boss - it's rendered procedurally in gameplay, not a PNG).
 */
export function drawFrogKingTokenIcon(ctx, cx, cy, size) {
    const insetR = _drawCoinFrame(ctx, cx, cy, size, '#e8b0ff', '#6a1080');
    const frogKingCampaign = CampaignRegistry.getCampaign('campaign-4');
    if (frogKingCampaign && frogKingCampaign.drawIcon) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, insetR, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = '#0a0e20';
        ctx.fillRect(cx - insetR, cy - insetR, insetR * 2, insetR * 2);
        frogKingCampaign.drawIcon(ctx, cx, cy, insetR * 2.05);
        ctx.restore();
    }
}

// ── Data ─────────────────────────────────────────────────────────────────────

const ENEMY_TIERS = [
    { ids: ['basic', 'archer', 'beefyenemy', 'villager'], requiredIntelPack: 'intel-pack-1', cost: 150 },
    { ids: ['knight', 'shieldknight', 'ramcart'], requiredIntelPack: 'intel-pack-2', cost: 250 },
    { ids: ['mage', 'frog', 'walkingfrog'], requiredIntelPack: 'intel-pack-3', cost: 350 },
    { ids: ['earthfrog', 'waterfrog', 'firefrog', 'airfrog'], requiredIntelPack: 'intel-pack-4', cost: 450 }
];

// Campaign themes reuse the matching campaign's own emblem art wholesale - the exact
// same photo (public/assets/campaigns/campaign-N.jpg) and bevelled-medallion frame the
// campaign-select screen uses (see CampaignMenu.js's CAMPAIGN_EMBLEM_IMAGE / _drawEmblem),
// so a theme tile visually ties straight back to the campaign that unlocks it. Falls back
// to the campaign's vector drawIcon() while the photo is still loading or if it's missing.
const _themeImageCache = new Map();
function _getThemeImage(campaignId) {
    let entry = _themeImageCache.get(campaignId);
    if (entry) return entry;
    entry = { img: null, loaded: false };
    _themeImageCache.set(campaignId, entry);
    const img = new Image();
    img.onload = () => { entry.img = img; entry.loaded = true; };
    img.onerror = () => { entry.loaded = true; };
    img.src = `assets/campaigns/${campaignId}.jpg`;
    return entry;
}

const THEME_RING_COLORS = { top: '#c8b488', mid: '#8f7748', bottom: '#4a3c22' };

function _drawThemeIcon(campaignId, ctx, cx, cy, size) {
    const campaign = CampaignRegistry.getCampaign(campaignId);
    const entry = _getThemeImage(campaignId);
    drawMedallion(ctx, {
        x: cx, y: cy, radius: size / 2,
        ringColors: THEME_RING_COLORS,
        backdrop: '#141414',
        drawContent: (ctx, ccx, ccy, r) => {
            if (entry.loaded && entry.img) {
                drawCoverImage(ctx, entry.img, ccx - r, ccy - r, r * 2, r * 2);
            } else if (campaign && campaign.drawIcon) {
                campaign.drawIcon(ctx, ccx, ccy, r * 1.9);
            }
        }
    });
}

const THEME_ITEMS = {
    forest: {
        id: 'forest', name: 'Forest', cost: 400, requiredCampaign: 'campaign-1',
        drawIcon: (ctx, cx, cy, size) => _drawThemeIcon('campaign-1', ctx, cx, cy, size)
    },
    mountain: {
        id: 'mountain', name: 'Mountain', cost: 600, requiredCampaign: 'campaign-2',
        drawIcon: (ctx, cx, cy, size) => _drawThemeIcon('campaign-2', ctx, cx, cy, size)
    },
    desert: {
        id: 'desert', name: 'Desert', cost: 800, requiredCampaign: 'campaign-3',
        drawIcon: (ctx, cx, cy, size) => _drawThemeIcon('campaign-3', ctx, cx, cy, size)
    },
    space: {
        id: 'space', name: 'Space', cost: 1000, requiredCampaign: 'campaign-4',
        drawIcon: (ctx, cx, cy, size) => _drawThemeIcon('campaign-4', ctx, cx, cy, size)
    }
};

export class WorkshopRegistry {
    static #enemyItems = null;

    static #buildEnemyItems() {
        if (this.#enemyItems) return this.#enemyItems;
        const items = {};
        for (const tier of ENEMY_TIERS) {
            for (const id of tier.ids) {
                const intel = EnemyIntelRegistry.getEnemyIntel(id);
                items[id] = {
                    id,
                    name: intel ? intel.name : id,
                    cost: tier.cost,
                    requiredIntelPack: tier.requiredIntelPack,
                    drawIcon: (ctx, cx, cy, size) => drawEnemyTokenIcon(ctx, cx, cy, size, id)
                };
            }
        }
        items['frogking'] = {
            id: 'frogking',
            name: 'Frog King',
            cost: 1500,
            requiredCampaign: 'campaign-4',
            drawIcon: (ctx, cx, cy, size) => drawFrogKingTokenIcon(ctx, cx, cy, size)
        };
        this.#enemyItems = items;
        return items;
    }

    static getEnemyItem(enemyId) {
        return this.#buildEnemyItems()[enemyId] || null;
    }

    static getAllEnemyItems() {
        return { ...this.#buildEnemyItems() };
    }

    static getAllEnemyIds() {
        return Object.keys(this.#buildEnemyItems());
    }

    static getThemeItem(themeId) {
        return THEME_ITEMS[themeId] || null;
    }

    static getAllThemeItems() {
        return { ...THEME_ITEMS };
    }

    static getAllThemeIds() {
        return Object.keys(THEME_ITEMS);
    }

    /**
     * Whether the given enemy type's unlock precondition (Spy Intel purchased,
     * or for the Frog King, campaign-4 completed) is currently met. Does NOT
     * check gold/token affordability - that's a separate, still-purchasable state.
     */
    static isEnemyUnlockable(enemyId, { completedCampaigns = [], unlockedIntelPacks = [] } = {}) {
        const item = this.getEnemyItem(enemyId);
        if (!item) return false;
        if (item.requiredCampaign) {
            return completedCampaigns.includes(item.requiredCampaign);
        }
        if (item.requiredIntelPack) {
            return unlockedIntelPacks.includes(item.requiredIntelPack);
        }
        return true;
    }

    /** Whether the given campaign theme's unlock precondition (campaign completed) is met. */
    static isThemeUnlockable(themeId, { completedCampaigns = [] } = {}) {
        const item = this.getThemeItem(themeId);
        if (!item) return false;
        return completedCampaigns.includes(item.requiredCampaign);
    }
}
