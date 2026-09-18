/**
 * EmblemRenderer — shared bevelled-medallion badge used anywhere the game wants a
 * "framed portrait" look: a metal ring around a circular picture crop. Originally
 * built for the campaign-select screen (CampaignMenu.js); the achievement panel
 * reuses it so both screens read as one consistent visual system.
 *
 * Callers own all *meaning* (which colors = which rank, which picture/vector art
 * to show) — this module only knows how to paint the ring/bevel/vignette/stud
 * chrome around whatever `drawContent` puts inside it.
 */

/**
 * Draws `img` into the dest rect with "cover" fit (like CSS background-size:cover) —
 * scales to fill completely and crops the overflow, centered, so no edges show through.
 */
export function drawCoverImage(ctx, img, dx, dy, dw, dh) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    const scale = Math.max(dw / iw, dh / ih);
    const sw = dw / scale;
    const sh = dh / scale;
    const sx = (iw - sw) / 2;
    const sy = (ih - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

/**
 * Draws a bevelled metal ring framing a circular picture — a drop shadow, a
 * gradient ring (colors supplied by the caller), an inner bevel groove, the
 * clipped picture content, a soft vignette, a glass highlight, a crisp rim, and
 * a small jewel stud at the base.
 *
 * opts:
 *   x, y, radius        — center and outer radius of the medallion
 *   ringColors           — { top, mid, bottom } 3-stop linear gradient for the ring
 *   accent               — jewel stud color (defaults to ringColors.mid)
 *   backdrop              — fallback fill behind the picture (in case it has gaps)
 *   dim                   — true = wash the picture dark (locked/unearned state)
 *   drawContent(ctx, cx, cy, innerRadius) — paints the picture; already clipped to the circle
 */
export function drawMedallion(ctx, opts) {
    const {
        x, y, radius,
        ringColors,
        accent = ringColors.mid,
        backdrop = '#141414',
        dim = false,
        drawContent
    } = opts;

    ctx.save();

    // Drop shadow beneath the medallion
    ctx.beginPath();
    ctx.arc(x + 3, y + 5, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fill();

    const ringW = Math.max(5, radius * 0.115);
    const ringInner = radius - ringW;

    // Outer bevelled metal ring
    const ringGrad = ctx.createLinearGradient(x, y - radius, x, y + radius);
    ringGrad.addColorStop(0, ringColors.top);
    ringGrad.addColorStop(0.5, ringColors.mid);
    ringGrad.addColorStop(1, ringColors.bottom);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = ringGrad;
    ctx.fill();

    // Inner bevel groove separating ring from picture
    ctx.beginPath();
    ctx.arc(x, y, ringInner + 1.5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Clip to the inner circle and paint the picture
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, ringInner, 0, Math.PI * 2);
    ctx.clip();

    // Fallback backdrop in case the art has transparent gaps
    ctx.fillStyle = backdrop;
    ctx.fillRect(x - ringInner, y - ringInner, ringInner * 2, ringInner * 2);

    if (typeof drawContent === 'function') {
        drawContent(ctx, x, y, ringInner);
    }

    // Locked/unearned wash — darkens the picture without needing canvas filters
    if (dim) {
        ctx.fillStyle = 'rgba(8, 6, 4, 0.72)';
        ctx.beginPath();
        ctx.arc(x, y, ringInner, 0, Math.PI * 2);
        ctx.fill();
    }

    // Soft inner vignette so the crop's edges melt into the frame
    const vig = ctx.createRadialGradient(x, y, ringInner * 0.6, x, y, ringInner);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.30)');
    ctx.fillStyle = vig;
    ctx.beginPath();
    ctx.arc(x, y, ringInner, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Glass-like highlight catching light on the upper-left rim
    ctx.beginPath();
    ctx.arc(x, y, ringInner + 1, -Math.PI * 0.85, -Math.PI * 0.15);
    ctx.strokeStyle = 'rgba(255,255,255,0.32)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Crisp outer rim edge
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Small jewel stud at the base of the ring
    const studY = y + radius - ringW * 0.5;
    ctx.beginPath();
    ctx.arc(x, studY, ringW * 0.42, 0, Math.PI * 2);
    const studGrad = ctx.createRadialGradient(x - ringW * 0.15, studY - ringW * 0.15, 0, x, studY, ringW * 0.42);
    studGrad.addColorStop(0, '#ffffff');
    studGrad.addColorStop(0.35, accent);
    studGrad.addColorStop(1, '#1a1408');
    ctx.fillStyle = studGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 0.7;
    ctx.stroke();

    ctx.restore();
}

// Campaign emblem art - one shared table so every screen that shows a campaign (the campaign
// select cards, the Hiscores sub-tabs, ...) draws the very same picture in the very same frame.
// Drop a same-named file in public/assets/campaigns/ to replace any of these; entries without
// a file (e.g. Eternal Mode's 'sandbox') fall back to the campaign's own vector drawIcon().
export const CAMPAIGN_EMBLEM_IMAGE = {
    'campaign-1': 'assets/campaigns/campaign-1.jpg',
    'campaign-2': 'assets/campaigns/campaign-2.jpg',
    'campaign-3': 'assets/campaigns/campaign-3.jpg',
    'campaign-4': 'assets/campaigns/campaign-4.jpg',
    'campaign-5': 'assets/campaigns/campaign-5.jpg',
};

// Unified stone base with campaign-specific accent colours
export const CAMPAIGN_BIOME = {
    'campaign-1': { from: '#1c1810', to: '#130f09', accent: '#4e8c42' },  // Forest emerald accent
    'campaign-2': { from: '#1c1810', to: '#130f09', accent: '#5c84b8' },  // Mountain slate accent
    'campaign-3': { from: '#1c1810', to: '#130f09', accent: '#c47c30' },  // Desert amber accent
    'campaign-4': { from: '#1c1810', to: '#130f09', accent: '#8840c0' },  // Frog King violet accent
    'sandbox': { from: '#1c1810', to: '#130f09', accent: '#d4af37' },     // Eternal Mode gold accent
};

// id -> HTMLImageElement once loaded, null while loading or if the file is missing.
const _campaignEmblemImages = {};

/**
 * Returns a campaign's emblem picture, or null if it has none / hasn't finished loading yet
 * (callers then fall back to the vector drawIcon). The first call for an id starts the load,
 * so the picture is ready by the time a later frame asks for it again.
 */
export function getCampaignEmblemImage(campaignId) {
    if (!(campaignId in _campaignEmblemImages)) {
        _campaignEmblemImages[campaignId] = null;
        const path = CAMPAIGN_EMBLEM_IMAGE[campaignId];
        if (path) {
            const img = new Image();
            img.onload = () => { _campaignEmblemImages[campaignId] = img; };
            img.onerror = () => { _campaignEmblemImages[campaignId] = null; };
            img.src = path;
        }
    }
    return _campaignEmblemImages[campaignId];
}

/** Starts loading every campaign emblem up front so none pops in on first display. */
export function preloadCampaignEmblems() {
    for (const id of Object.keys(CAMPAIGN_EMBLEM_IMAGE)) getCampaignEmblemImage(id);
}

/**
 * Draws a campaign's scene art as a framed medallion emblem - a bevelled metal ring around a
 * circular "photo" crop, zoomed in on the campaign's icon artwork so it reads as a scenic
 * portrait rather than a flat glyph. Ring color is gold when selected, warm pewter otherwise.
 *
 * `campaign` needs `id` and, for the no-picture fallback, `drawIcon` (vector scene art) and/or
 * `icon` (a glyph).
 */
export function drawCampaignEmblem(ctx, campaign, x, y, radius, isSelected = false, isHovered = false) {
    let ringColors;
    if (isSelected) {
        ringColors = { top: '#f6e29a', mid: '#d4af37', bottom: '#8a651c' };
    } else if (isHovered) {
        ringColors = { top: '#c8b488', mid: '#8f7748', bottom: '#4a3c22' };
    } else {
        ringColors = { top: '#8c7a5c', mid: '#5c4c32', bottom: '#332a1a' };
    }

    const biome = CAMPAIGN_BIOME[campaign.id] || CAMPAIGN_BIOME['sandbox'];
    const emblemImg = getCampaignEmblemImage(campaign.id);
    drawMedallion(ctx, {
        x, y, radius,
        ringColors,
        accent: biome.accent || '#a08040',
        backdrop: biome.to || '#141414',
        drawContent: (ctx, cx, cy, r) => {
            if (emblemImg) {
                // Real picture - cover-fit crop so it fills the circle edge-to-edge with no gaps
                drawCoverImage(ctx, emblemImg, cx - r, cy - r, r * 2, r * 2);
            } else if (campaign.drawIcon) {
                // Image not loaded/available yet - fall back to the vector scene art, zoomed to fill the frame
                campaign.drawIcon(ctx, cx, cy, r * 1.9);
            } else if (campaign.icon) {
                ctx.font = `${Math.round(r * 1.3)}px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(campaign.icon, cx, cy);
            }
        }
    });
}

const CHEST_VARIANTS = {
    wooden: {
        bodyTop: '#a07040', bodyBottom: '#5c3010', edge: '#3a1e08',
        lidTop: '#c08850', lidBottom: '#7a4a20', strap: '#8B6914',
        gem: null
    },
    golden: {
        bodyTop: '#E8B830', bodyBottom: '#8B6914', edge: '#5A3E08',
        lidTop: '#FFD860', lidBottom: '#C8960A', strap: '#A07010',
        gem: { colors: ['#FF4040', '#CC1010', '#800000'], stroke: '#FFD700' }
    },
    platinum: {
        bodyTop: '#C0C8D8', bodyBottom: '#6878A0', edge: '#3848A0',
        lidTop: '#E0E8F8', lidBottom: '#8890B8', strap: '#7080B0',
        gem: { colors: ['#80C0FF', '#2070CC', '#103880'], stroke: '#C0C8E0' }
    }
};

/**
 * Hand-drawn treasure-chest icon — the same art used for the marketplace's
 * Wooden/Golden/Platinum Chest upgrades (see SettlementHub.js), generalized into
 * one function with a color variant. Used as vector-art content for economy-themed
 * achievement medallions where no photographed token exists yet.
 */
export function drawChestIcon(ctx, cx, cy, size, variant = 'golden') {
    const v = CHEST_VARIANTS[variant] || CHEST_VARIANTS.golden;
    ctx.save();
    const w = size * 0.78, h = size * 0.58;
    const bx = cx - w / 2, by = cy - h * 0.4;

    const bg = ctx.createLinearGradient(cx, by + h * 0.32, cx, by + h);
    bg.addColorStop(0, v.bodyTop); bg.addColorStop(1, v.bodyBottom);
    ctx.fillStyle = bg; ctx.fillRect(bx, by + h * 0.32, w, h * 0.68);
    ctx.strokeStyle = v.edge; ctx.lineWidth = 1.5; ctx.strokeRect(bx, by + h * 0.32, w, h * 0.68);

    const lg = ctx.createLinearGradient(cx, by, cx, by + h * 0.34);
    lg.addColorStop(0, v.lidTop); lg.addColorStop(1, v.lidBottom);
    ctx.fillStyle = lg; ctx.fillRect(bx, by, w, h * 0.34);
    ctx.strokeStyle = v.edge; ctx.lineWidth = 1.5; ctx.strokeRect(bx, by, w, h * 0.34);

    ctx.beginPath(); ctx.moveTo(bx, by + h * 0.34); ctx.quadraticCurveTo(cx, by - h * 0.08, bx + w, by + h * 0.34);
    ctx.closePath(); ctx.fillStyle = lg; ctx.fill(); ctx.strokeStyle = v.edge; ctx.lineWidth = 1; ctx.stroke();

    ctx.strokeStyle = v.strap; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(bx + w * 0.25, by + h * 0.34); ctx.lineTo(bx + w * 0.25, by + h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + w * 0.75, by + h * 0.34); ctx.lineTo(bx + w * 0.75, by + h); ctx.stroke();

    if (v.gem) {
        ctx.beginPath(); ctx.arc(cx, by + h * 0.32, size * 0.08, 0, Math.PI * 2);
        const gg = ctx.createRadialGradient(cx - size * 0.02, by + h * 0.3, size * 0.01, cx, by + h * 0.32, size * 0.08);
        gg.addColorStop(0, v.gem.colors[0]); gg.addColorStop(0.6, v.gem.colors[1]); gg.addColorStop(1, v.gem.colors[2]);
        ctx.fillStyle = gg; ctx.fill(); ctx.strokeStyle = v.gem.stroke; ctx.lineWidth = 1; ctx.stroke();
    } else {
        ctx.beginPath(); ctx.arc(cx, by + h * 0.32, size * 0.065, 0, Math.PI * 2);
        ctx.fillStyle = '#D4A020'; ctx.fill(); ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 0.8; ctx.stroke();
    }

    ctx.beginPath(); ctx.ellipse(cx + w * 0.2, by + h * 0.12, w * 0.12, h * 0.06, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,220,0.3)'; ctx.fill();

    ctx.restore();
}
