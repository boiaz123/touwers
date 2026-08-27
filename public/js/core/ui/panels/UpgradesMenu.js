import { SaveSystem } from '../../systems/SaveSystem.js';
import { LootRegistry } from '../../../entities/loot/LootRegistry.js';
import { MarketplaceSystem } from '../../systems/MarketplaceSystem.js';
import { MarketplaceRegistry } from '../../registries/MarketplaceRegistry.js';
import { CampaignRegistry } from '../../../game/CampaignRegistry.js';
import { WorkshopSystem } from '../../systems/WorkshopSystem.js';

/**
 * Upgrades Menu Popup
 * Allows player to view and unlock tower/building upgrades
 */
// Must match the `lineHeight` used when wrapping/rendering the description text
// below - handleWheel() converts raw wheel pixels into this many px per line.
const UPGRADE_DESC_LINE_HEIGHT = 14;

export class UpgradesMenu {
    constructor(stateManager, settlementHub) {
        this.stateManager = stateManager;
        this.settlementHub = settlementHub;
        this.isOpen = false;
        this.animationProgress = 0;
        this.activeTab = 'buy'; // 'buy' or 'sell'
        this.currentPage = 0;
        this.clickLock = false; // Prevent double-clicks on items
        this.lastPaginationClickTime = 0; // Prevent double-click pagination
        this.lastConsumableCheckTime = 0; // Track last time we checked for marketplace changes
        this.openTime = 0; // Track when menu was opened to prevent click-through
        // Get player gold from stateManager (persistent between levels)
        this.playerGold = stateManager.playerGold || 0;
        
        // Visual effects
        this.floatingGoldEffects = []; // For gold coin splashes on sell
        this.glowEffects = []; // For glow effects on buy
        this.errorEffects = []; // For "Not Enough Gold" error messages
        
        // Initialize marketplace system if not already done
        if (!this.stateManager.marketplaceSystem) {
            this.stateManager.marketplaceSystem = new MarketplaceSystem();
        }
        
        // Initialize item error effects tracking
        this.itemErrorEffects = [];
        this.goldDisplayX = 0;
        this.goldDisplayY = 0;
        
        // Category system for buy tab - now includes upgrades as a category
        this.allBuyItems = this.buildBuyItems();
        this.buyCategories = [
            { label: 'UPGRADES', id: 'upgrade', hovered: false },
            { label: 'CONSUMABLES', id: 'consumable', hovered: false },
            { label: 'INTEL', id: 'intel', hovered: false },
            { label: 'MUSIC', id: 'music', hovered: false }
        ];
        this.activeBuyCategory = 'upgrade';
        this.buyItems = this.filterBuyItemsByCategory('upgrade');
        
        // Build all tabs
        this.sellItems = []; // Will be populated dynamically

        // Upgrade scroll state - track scroll position for each upgrade tile on hover
        this.scrollableTiles = new Map(); // Maps item.id to { scrollOffset: 0, maxScroll: 0 }
        
        this.closeButtonHovered = false;
        this.leftArrowHovered = false;
        this.rightArrowHovered = false;
        this.showingPortalConfirm = false;
        this.portalConfirmYesHovered = false;
        this.portalConfirmNoHovered = false;
        this.tabButtons = [
            { label: 'BUY', action: 'buy', hovered: false },
            { label: 'INVENTORY', action: 'sell', hovered: false }
        ];
    }

    buildBuyItems() {
        const upgradeSystem = this.stateManager.upgradeSystem || { hasUpgrade: () => false };
        const marketplaceSystem = this.stateManager.marketplaceSystem || { hasUsedConsumable: () => false, isBoonActive: () => false, getConsumableCount: () => 0 };
        const unlockedCampaigns = this.stateManager.currentSaveData?.unlockedCampaigns || ['campaign-1'];
        const completedCampaigns = this.stateManager.currentSaveData?.completedCampaigns || [];

        const items = [];
        
        // Helper: get the name of the campaign that must be completed to unlock a required campaign id
        const getUnlockPrereqName = (reqId) => {
            const chain = CampaignRegistry.UNLOCK_CHAIN;
            const prereqId = Object.keys(chain).find(k => chain[k] === reqId);
            if (prereqId) {
                const camp = CampaignRegistry.getCampaign(prereqId);
                return camp ? camp.name : 'a previous campaign';
            }
            return 'a previous campaign';
        };
        
        // Add marketplace items from registry
        const allItems = MarketplaceRegistry.getAllItemIds();
        
        for (const itemId of allItems) {
            const itemData = MarketplaceRegistry.getItem(itemId);
            if (!itemData) continue;
            
            let canPurchase = MarketplaceRegistry.canPurchase(itemId, upgradeSystem, marketplaceSystem);
            let requirementMsg = MarketplaceRegistry.getRequirementMessage(itemId, upgradeSystem, marketplaceSystem);
            
            // Check campaign requirement — hide the item entirely if not yet unlocked
            if (itemData.campaignRequirement && !unlockedCampaigns.includes(itemData.campaignRequirement)) {
                continue;
            }

            // Hide items whose upgrade prerequisites are not yet met
            if (itemData.requirements && itemData.requirements.length > 0) {
                const unmet = itemData.requirements.some(req => !upgradeSystem.hasUpgrade(req));
                if (unmet) continue;
            }
            
            // Special check: if it's a music item and player already has it, mark as unavailable
            // Music items should only be purchased once
            if (itemData.category === 'music' && marketplaceSystem.getConsumableCount(itemId) > 0) {
                canPurchase = false;
                requirementMsg = 'Item already owned';
            }
            
            // Special check: if it's an Intel item and player already has it, mark as unavailable
            // Intel items are one-time purchases like music
            if (itemData.category === 'intel' && marketplaceSystem.unlockedEnemyIntel && marketplaceSystem.unlockedEnemyIntel.has(itemId)) {
                canPurchase = false;
                requirementMsg = 'Unlocked';
            }
            
            // Special check: Consumables (forge-materials, magic-tower-flatpack, training-materials, etc.)
            // are stackable but should be greyed out when player already owns one (until it's consumed at level end)
            if (itemData.type === 'consumable' && itemData.category !== 'music' && itemData.category !== 'intel' && marketplaceSystem.getConsumableCount(itemId) > 0) {
                canPurchase = false;
                requirementMsg = 'Item already owned';
            }
            
            // Special check: if it's the Frog King's Bane (boon type), prevent re-purchase
            // Boons are one-time purchases like music and intel
            if (itemId === 'frog-king-bane' && marketplaceSystem.getConsumableCount('frog-king-bane') > 0) {
                canPurchase = false;
                requirementMsg = 'Item already owned';
            }
            
            // Combine loot and boon into consumable category
            // Also move building-type consumables (forge materials, flatpacks, etc.) to consumable tab
            let category = itemData.category;
            if (category === 'loot' || category === 'boon') {
                category = 'consumable';
            } else if (category === 'building' && itemData.type === 'consumable') {
                category = 'consumable';
            }
            
            items.push({
                id: itemId,
                name: itemData.name,
                description: itemData.description,
                cost: itemData.cost,
                drawIcon: itemData.drawIcon,
                category: category,
                type: itemData.type,
                effect: itemData.effect,
                hovered: false,
                canPurchase: canPurchase,
                requirementMsg: requirementMsg
            });
        }
        
        // Add upgrades as items with 'upgrade' category
        const upgradeData = [
            {
                id: 'training-gear',
                name: 'Training Gear',
                description: 'An old armory crate salvaged from the barracks. The gear inside is worn but reliable — enough to train a handful of brave volunteers to stand guard.',
                effect: 'Unlocks Training Grounds building in levels\nAllows hiring combat defenders to protect towers\nGives access to additional tower upgrades',
                cost: 500,
                drawIcon(ctx, cx, cy, size) {
                    ctx.save();
                    [[-1, 1], [1, -1]].forEach(([dx]) => {
                        ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 4 * dx);
                        ctx.beginPath();
                        ctx.moveTo(0, -size * 0.38); ctx.lineTo(size * 0.045, -size * 0.1); ctx.lineTo(-size * 0.045, -size * 0.1); ctx.closePath();
                        const sg = ctx.createLinearGradient(-size * 0.045, 0, size * 0.045, 0);
                        sg.addColorStop(0, '#888'); sg.addColorStop(0.5, '#eee'); sg.addColorStop(1, '#666');
                        ctx.fillStyle = sg; ctx.fill(); ctx.strokeStyle = '#444'; ctx.lineWidth = 0.8; ctx.stroke();
                        const gg = ctx.createLinearGradient(-size * 0.14, cy - size * 0.08, size * 0.14, cy);
                        gg.addColorStop(0, '#B8860B'); gg.addColorStop(1, '#8B5E0A');
                        ctx.fillStyle = gg; ctx.fillRect(-size * 0.14, -size * 0.08, size * 0.28, size * 0.06);
                        ctx.strokeStyle = '#5A3808'; ctx.lineWidth = 0.8; ctx.strokeRect(-size * 0.14, -size * 0.08, size * 0.28, size * 0.06);
                        ctx.fillStyle = '#5c3d1f'; ctx.fillRect(-size * 0.04, -size * 0.02, size * 0.08, size * 0.24);
                        ctx.restore();
                    });
                    ctx.restore();
                },
                category: 'building'
            },
            {
                id: 'musical-equipment',
                name: 'Musical Equipment',
                description: 'A finely crafted lyre and carrying case, left behind by a traveling minstrel. With the right instrument, even a siege feels less grim.',
                effect: 'Permanently adds Paseyan the Bard to your settlement\nSpeak to him to access your music collection\nAllows selecting tracks from his Musical Scores screen',
                cost: 300,
                drawIcon(ctx, cx, cy, size) {
                    ctx.save();
                    // Lyre frame - two curved arms
                    const armW = size * 0.32, armH = size * 0.4;
                    ctx.strokeStyle = '#C8960A'; ctx.lineWidth = size * 0.06; ctx.lineCap = 'round';
                    // Left arm
                    ctx.beginPath();
                    ctx.moveTo(cx - size * 0.08, cy + size * 0.1);
                    ctx.quadraticCurveTo(cx - armW, cy - armH * 0.3, cx - armW * 0.7, cy - armH);
                    ctx.stroke();
                    // Right arm
                    ctx.beginPath();
                    ctx.moveTo(cx + size * 0.08, cy + size * 0.1);
                    ctx.quadraticCurveTo(cx + armW, cy - armH * 0.3, cx + armW * 0.7, cy - armH);
                    ctx.stroke();
                    // Top crossbar
                    ctx.lineWidth = size * 0.05;
                    ctx.beginPath();
                    ctx.moveTo(cx - armW * 0.7, cy - armH);
                    ctx.quadraticCurveTo(cx, cy - armH - size * 0.08, cx + armW * 0.7, cy - armH);
                    ctx.stroke();
                    ctx.lineCap = 'butt';
                    // Base/soundbox
                    ctx.beginPath();
                    ctx.ellipse(cx, cy + size * 0.2, size * 0.18, size * 0.14, 0, 0, Math.PI * 2);
                    const bg = ctx.createRadialGradient(cx - size * 0.04, cy + size * 0.17, size * 0.02, cx, cy + size * 0.2, size * 0.18);
                    bg.addColorStop(0, '#FFD860'); bg.addColorStop(0.6, '#C8960A'); bg.addColorStop(1, '#8B6914');
                    ctx.fillStyle = bg; ctx.fill();
                    ctx.strokeStyle = '#5A3E08'; ctx.lineWidth = 1; ctx.stroke();
                    // Strings
                    ctx.strokeStyle = '#E0D0A0'; ctx.lineWidth = 0.6;
                    for (let i = -1; i <= 1; i++) {
                        const sx = cx + i * size * 0.06;
                        ctx.beginPath();
                        ctx.moveTo(sx, cy - armH + size * 0.06);
                        ctx.lineTo(sx, cy + size * 0.1);
                        ctx.stroke();
                    }
                    // Decorative knob at top
                    ctx.beginPath(); ctx.arc(cx, cy - armH - size * 0.04, size * 0.04, 0, Math.PI * 2);
                    ctx.fillStyle = '#FFD700'; ctx.fill();
                    ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 0.8; ctx.stroke();
                    ctx.restore();
                },
                category: 'upgrade'
            },
            {
                id: 'wooden-chest',
                name: 'Wooden Chest',
                description: 'A battered supply chest recovered from an abandoned outpost. The coins inside smell of old campaigns.',
                effect: 'Permanently grants +100 starting gold in every level',
                cost: 250,
                drawIcon(ctx, cx, cy, size) {
                    ctx.save();
                    const w = size * 0.78, h = size * 0.58;
                    const bx = cx - w / 2, by = cy - h * 0.4;
                    const bg = ctx.createLinearGradient(cx, by + h * 0.32, cx, by + h);
                    bg.addColorStop(0, '#a07040'); bg.addColorStop(1, '#5c3010');
                    ctx.fillStyle = bg; ctx.fillRect(bx, by + h * 0.32, w, h * 0.68);
                    ctx.strokeStyle = '#3a1e08'; ctx.lineWidth = 1.5; ctx.strokeRect(bx, by + h * 0.32, w, h * 0.68);
                    const lg = ctx.createLinearGradient(cx, by, cx, by + h * 0.34);
                    lg.addColorStop(0, '#c08850'); lg.addColorStop(1, '#7a4a20');
                    ctx.fillStyle = lg; ctx.fillRect(bx, by, w, h * 0.34); ctx.strokeStyle = '#3a1e08'; ctx.lineWidth = 1.5; ctx.strokeRect(bx, by, w, h * 0.34);
                    ctx.beginPath(); ctx.moveTo(bx, by + h * 0.34); ctx.quadraticCurveTo(cx, by - h * 0.08, bx + w, by + h * 0.34);
                    ctx.closePath(); ctx.fillStyle = lg; ctx.fill(); ctx.strokeStyle = '#3a1e08'; ctx.lineWidth = 1; ctx.stroke();
                    ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 1.2;
                    ctx.beginPath(); ctx.moveTo(bx + w * 0.25, by + h * 0.34); ctx.lineTo(bx + w * 0.25, by + h); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(bx + w * 0.75, by + h * 0.34); ctx.lineTo(bx + w * 0.75, by + h); ctx.stroke();
                    ctx.beginPath(); ctx.arc(cx, by + h * 0.32, size * 0.065, 0, Math.PI * 2);
                    ctx.fillStyle = '#D4A020'; ctx.fill(); ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 0.8; ctx.stroke();
                    ctx.restore();
                },
                category: 'upgrade',
                campaignRequirement: 'campaign-1'
            },
            {
                id: 'golden-chest',
                name: 'Golden Chest',
                description: 'A heavily reinforced chest bearing the royal seal. The lock is already broken — whoever owned this left in quite a hurry.',
                effect: 'Permanently grants +300 starting gold in every level',
                cost: 400,
                drawIcon(ctx, cx, cy, size) {
                    ctx.save();
                    const w = size * 0.78, h = size * 0.58;
                    const bx = cx - w / 2, by = cy - h * 0.4;
                    // Body
                    const bg = ctx.createLinearGradient(cx, by + h * 0.32, cx, by + h);
                    bg.addColorStop(0, '#E8B830'); bg.addColorStop(1, '#8B6914');
                    ctx.fillStyle = bg; ctx.fillRect(bx, by + h * 0.32, w, h * 0.68);
                    ctx.strokeStyle = '#5A3E08'; ctx.lineWidth = 1.5; ctx.strokeRect(bx, by + h * 0.32, w, h * 0.68);
                    // Lid
                    const lg = ctx.createLinearGradient(cx, by, cx, by + h * 0.34);
                    lg.addColorStop(0, '#FFD860'); lg.addColorStop(1, '#C8960A');
                    ctx.fillStyle = lg; ctx.fillRect(bx, by, w, h * 0.34); ctx.strokeStyle = '#5A3E08'; ctx.lineWidth = 1.5; ctx.strokeRect(bx, by, w, h * 0.34);
                    // Rounded top
                    ctx.beginPath(); ctx.moveTo(bx, by + h * 0.34); ctx.quadraticCurveTo(cx, by - h * 0.08, bx + w, by + h * 0.34);
                    ctx.closePath(); ctx.fillStyle = lg; ctx.fill(); ctx.strokeStyle = '#5A3E08'; ctx.lineWidth = 1; ctx.stroke();
                    // Metal bands
                    ctx.strokeStyle = '#A07010'; ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.moveTo(bx + w * 0.25, by + h * 0.34); ctx.lineTo(bx + w * 0.25, by + h); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(bx + w * 0.75, by + h * 0.34); ctx.lineTo(bx + w * 0.75, by + h); ctx.stroke();
                    // Ruby gem
                    ctx.beginPath(); ctx.arc(cx, by + h * 0.32, size * 0.08, 0, Math.PI * 2);
                    const gg = ctx.createRadialGradient(cx - size * 0.02, by + h * 0.3, size * 0.01, cx, by + h * 0.32, size * 0.08);
                    gg.addColorStop(0, '#FF4040'); gg.addColorStop(0.6, '#CC1010'); gg.addColorStop(1, '#800000');
                    ctx.fillStyle = gg; ctx.fill(); ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 1; ctx.stroke();
                    // Highlight
                    ctx.beginPath(); ctx.ellipse(cx + w * 0.2, by + h * 0.12, w * 0.12, h * 0.06, 0.2, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255,255,220,0.3)'; ctx.fill();
                    ctx.restore();
                },
                category: 'upgrade',
                prerequisite: 'wooden-chest',
                campaignRequirement: 'campaign-2'
            },
            {
                id: 'platinum-chest',
                name: 'Platinum Chest',
                description: 'A seamless chest carved from polished platinum ore. Enchanted to stay sealed — until it recognized you.',
                effect: 'Permanently grants +500 starting gold in every level',
                cost: 600,
                drawIcon(ctx, cx, cy, size) {
                    ctx.save();
                    const w = size * 0.78, h = size * 0.58;
                    const bx = cx - w / 2, by = cy - h * 0.4;
                    // Body - platinum
                    const bg = ctx.createLinearGradient(cx, by + h * 0.32, cx, by + h);
                    bg.addColorStop(0, '#C0C8D8'); bg.addColorStop(1, '#6878A0');
                    ctx.fillStyle = bg; ctx.fillRect(bx, by + h * 0.32, w, h * 0.68);
                    ctx.strokeStyle = '#3848A0'; ctx.lineWidth = 1.5; ctx.strokeRect(bx, by + h * 0.32, w, h * 0.68);
                    // Lid - platinum
                    const lg = ctx.createLinearGradient(cx, by, cx, by + h * 0.34);
                    lg.addColorStop(0, '#E0E8F8'); lg.addColorStop(1, '#8890B8');
                    ctx.fillStyle = lg; ctx.fillRect(bx, by, w, h * 0.34); ctx.strokeStyle = '#3848A0'; ctx.lineWidth = 1.5; ctx.strokeRect(bx, by, w, h * 0.34);
                    // Rounded top
                    ctx.beginPath(); ctx.moveTo(bx, by + h * 0.34); ctx.quadraticCurveTo(cx, by - h * 0.08, bx + w, by + h * 0.34);
                    ctx.closePath(); ctx.fillStyle = lg; ctx.fill(); ctx.strokeStyle = '#3848A0'; ctx.lineWidth = 1; ctx.stroke();
                    // Metal bands - silver
                    ctx.strokeStyle = '#7080B0'; ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.moveTo(bx + w * 0.25, by + h * 0.34); ctx.lineTo(bx + w * 0.25, by + h); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(bx + w * 0.75, by + h * 0.34); ctx.lineTo(bx + w * 0.75, by + h); ctx.stroke();
                    // Corner accents
                    ctx.fillStyle = '#A0A8C0';
                    ctx.fillRect(bx + 1, by + h * 0.34, w * 0.08, h * 0.12);
                    ctx.fillRect(bx + w - w * 0.08 - 1, by + h * 0.34, w * 0.08, h * 0.12);
                    // Sapphire gem
                    ctx.beginPath(); ctx.arc(cx, by + h * 0.32, size * 0.08, 0, Math.PI * 2);
                    const sg = ctx.createRadialGradient(cx - size * 0.02, by + h * 0.3, size * 0.01, cx, by + h * 0.32, size * 0.08);
                    sg.addColorStop(0, '#80C0FF'); sg.addColorStop(0.6, '#2070CC'); sg.addColorStop(1, '#103880');
                    ctx.fillStyle = sg; ctx.fill(); ctx.strokeStyle = '#C0C8E0'; ctx.lineWidth = 1; ctx.stroke();
                    // Highlight
                    ctx.beginPath(); ctx.ellipse(cx + w * 0.2, by + h * 0.12, w * 0.12, h * 0.06, 0.2, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(220,230,255,0.35)'; ctx.fill();
                    ctx.restore();
                },
                category: 'upgrade',
                prerequisite: 'golden-chest',
                campaignRequirement: 'campaign-3'
            },
            {
                id: 'diamond-pickaxe',
                name: 'Diamond Pickaxe',
                description: 'Forged from compressed diamond crystals. The miners say it hums softly near gemstone veins, as if drawn to them.',
                effect: 'Increases gem drop chance from Gold Mines\nGems are used to upgrade your magical abilities',
                cost: 800,
                drawIcon(ctx, cx, cy, size) {
                    ctx.save();
                    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-Math.PI / 4);
                    const hg = ctx.createLinearGradient(-size * 0.04, 0, size * 0.04, 0);
                    hg.addColorStop(0, '#5c3d1f'); hg.addColorStop(0.5, '#8B5E30'); hg.addColorStop(1, '#3a2410');
                    ctx.fillStyle = hg; ctx.fillRect(-size * 0.04, -size * 0.36, size * 0.08, size * 0.7);
                    ctx.strokeStyle = '#2a1800'; ctx.lineWidth = 0.8; ctx.strokeRect(-size * 0.04, -size * 0.36, size * 0.08, size * 0.7);
                    ctx.restore();
                    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-Math.PI / 4);
                    ctx.beginPath();
                    ctx.moveTo(0, -size * 0.34); ctx.lineTo(-size * 0.24, -size * 0.14);
                    ctx.lineTo(-size * 0.16, -size * 0.08); ctx.lineTo(-size * 0.02, -size * 0.2);
                    ctx.lineTo(size * 0.14, -size * 0.32); ctx.closePath();
                    const pg = ctx.createLinearGradient(-size * 0.24, 0, size * 0.14, 0);
                    pg.addColorStop(0, '#88CCFF'); pg.addColorStop(0.5, '#EEEEFF'); pg.addColorStop(1, '#5588CC');
                    ctx.fillStyle = pg; ctx.fill(); ctx.strokeStyle = '#2244AA'; ctx.lineWidth = 1; ctx.stroke();
                    ctx.restore();
                    ctx.restore();
                },
                category: 'upgrade',
                prerequisite: 'magic-academy-unlock'
            },
            {
                id: 'magic-academy-unlock',
                name: 'Academy Blueprints',
                description: 'Detailed schematics for an arcane academy, scrawled in a language only mages can read. Someone has helpfully added illustrations.',
                effect: 'Unlocks Magic Academy building in levels\nEnables construction of advanced arcane towers',
                cost: 1500,
                drawIcon(ctx, cx, cy, size) {
                    ctx.save();
                    const sw = size * 0.58, sh = size * 0.68;
                    const sx = cx - sw / 2, sy = cy - sh / 2, rr = size * 0.08;
                    const sg = ctx.createLinearGradient(sx, sy, sx + sw, sy + sh);
                    sg.addColorStop(0, '#F5E6B8'); sg.addColorStop(1, '#D4B870');
                    ctx.fillStyle = sg;
                    ctx.beginPath();
                    ctx.moveTo(sx + rr, sy); ctx.lineTo(sx + sw - rr, sy);
                    ctx.arcTo(sx + sw, sy, sx + sw, sy + rr, rr); ctx.lineTo(sx + sw, sy + sh - rr);
                    ctx.arcTo(sx + sw, sy + sh, sx + sw - rr, sy + sh, rr); ctx.lineTo(sx + rr, sy + sh);
                    ctx.arcTo(sx, sy + sh, sx, sy + sh - rr, rr); ctx.lineTo(sx, sy + rr);
                    ctx.arcTo(sx, sy, sx + rr, sy, rr); ctx.closePath();
                    ctx.fill(); ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 1.5; ctx.stroke();
                    ctx.fillStyle = '#DDB858';
                    ctx.fillRect(sx - size * 0.04, sy, sw + size * 0.08, sh * 0.13);
                    ctx.fillRect(sx - size * 0.04, sy + sh - sh * 0.13, sw + size * 0.08, sh * 0.13);
                    ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 1;
                    ctx.strokeRect(sx - size * 0.04, sy, sw + size * 0.08, sh * 0.13);
                    ctx.strokeRect(sx - size * 0.04, sy + sh - sh * 0.13, sw + size * 0.08, sh * 0.13);
                    ctx.strokeStyle = 'rgba(100,70,20,0.5)'; ctx.lineWidth = 0.8;
                    for (let i = 0; i < 3; i++) {
                        const lineY = sy + sh * 0.23 + i * sh * 0.2;
                        ctx.beginPath(); ctx.moveTo(sx + size * 0.06, lineY); ctx.lineTo(sx + sw - size * 0.06, lineY); ctx.stroke();
                    }
                    ctx.restore();
                },
                category: 'building',
                campaignRequirement: 'campaign-2'
            },
            {
                id: 'superweapon-lab-unlock',
                name: 'Super Weapon Lab Plans',
                description: 'Classified engineering documents wrapped in wax paper. The diagrams show devices that probably should not exist, and almost certainly work.',
                effect: 'Unlocks Super Weapon Lab building in levels\nEnables construction of combination towers',
                cost: 2500,
                drawIcon(ctx, cx, cy, size) {
                    ctx.save();
                    const fx = cx - size * 0.14, fy = cy - size * 0.4, fw = size * 0.28;
                    ctx.beginPath();
                    ctx.moveTo(fx, fy); ctx.lineTo(fx + fw, fy);
                    ctx.lineTo(fx + fw, fy + size * 0.3);
                    ctx.lineTo(fx + fw + size * 0.22, fy + size * 0.86);
                    ctx.lineTo(fx - size * 0.22, fy + size * 0.86);
                    ctx.lineTo(fx, fy + size * 0.3); ctx.closePath();
                    const bg = ctx.createLinearGradient(cx, fy, cx, fy + size * 0.86);
                    bg.addColorStop(0, 'rgba(180,200,220,0.9)'); bg.addColorStop(0.4, 'rgba(100,180,220,0.7)'); bg.addColorStop(1, 'rgba(50,100,180,0.9)');
                    ctx.fillStyle = bg; ctx.fill(); ctx.strokeStyle = '#3060A0'; ctx.lineWidth = 1.5; ctx.stroke();
                    const liqY = fy + size * 0.5;
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(fx, fy); ctx.lineTo(fx + fw, fy); ctx.lineTo(fx + fw, fy + size * 0.3);
                    ctx.lineTo(fx + fw + size * 0.22, fy + size * 0.86); ctx.lineTo(fx - size * 0.22, fy + size * 0.86);
                    ctx.lineTo(fx, fy + size * 0.3); ctx.closePath(); ctx.clip();
                    ctx.fillStyle = 'rgba(100,210,100,0.65)';
                    ctx.fillRect(cx - size * 0.5, liqY, size, size * 0.5);
                    ctx.restore();
                    ctx.fillStyle = 'rgba(200,255,200,0.7)';
                    [[cx - size * 0.04, liqY + size * 0.06], [cx + size * 0.08, liqY + size * 0.16], [cx, liqY + size * 0.28]].forEach(([bx, by]) => {
                        ctx.beginPath(); ctx.arc(bx, by, size * 0.03, 0, Math.PI * 2); ctx.fill();
                    });
                    ctx.restore();
                },
                category: 'building',
                campaignRequirement: 'campaign-3'
            },
            {
                id: 'commanders-workshop',
                name: "Commander's Workshop",
                description: 'Blueprints for a private workshop where you can design and test your own battle maps.',
                effect: 'Unlocks the Commander\'s Workshop level designer\nAdds the Workshop building to your settlement',
                cost: 2000,
                drawIcon(ctx, cx, cy, size) {
                    const camp5 = CampaignRegistry.getCampaign('campaign-5');
                    if (camp5 && camp5.drawIcon) {
                        camp5.drawIcon(ctx, cx, cy, size);
                    }
                },
                category: 'building',
                // Distinct from campaignRequirement (checked against unlockedCampaigns, which
                // includes campaign-1 from the very start): this upgrade should only appear once
                // campaign-1 has actually been beaten, so it's gated on completedCampaigns instead.
                completedCampaignRequirement: 'campaign-1'
            },
            {
                id: 'slinger-tower-unlock',
                name: 'Slinger Tower Plans',
                description: "Forge-tempered slings recovered from a travelling tinker's cart. Fit to a Watch Tower's defenders, they let each throw three times as fast.",
                effect: 'Unlocks the Slinger Tower transform\nRequires Forge & Training Grounds Lv5',
                cost: 400,
                drawIcon(ctx, cx, cy, size) {
                    ctx.save();
                    const r = size * 0.34;
                    const bg = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
                    bg.addColorStop(0, '#fff'); bg.addColorStop(0.35, '#FFD700'); bg.addColorStop(1, '#8B6914');
                    ctx.fillStyle = bg;
                    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 1.2; ctx.stroke();
                    ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1, r * 0.16); ctx.lineCap = 'round';
                    for (let i = 0; i < 3; i++) {
                        const a = -Math.PI / 2 + (i - 1) * 0.55;
                        ctx.beginPath();
                        ctx.moveTo(cx, cy);
                        ctx.lineTo(cx + Math.cos(a) * r * 0.75, cy + Math.sin(a) * r * 0.75);
                        ctx.stroke();
                    }
                    ctx.restore();
                },
                category: 'upgrade'
            },
            {
                id: 'sharpshooter-tower-unlock',
                name: 'Sharpshooter Plans',
                description: "A marksman's doctrine, hand-annotated in the margins: patience over volume. Unlimited range, one devastating shot at a time.",
                effect: 'Unlocks the Sharpshooter transform\nRequires Forge & Training Grounds Lv5',
                cost: 650,
                drawIcon(ctx, cx, cy, size) {
                    ctx.save();
                    const r = size * 0.34;
                    const bg = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
                    bg.addColorStop(0, '#fff'); bg.addColorStop(0.35, '#B22222'); bg.addColorStop(1, '#3A0A0A');
                    ctx.fillStyle = bg;
                    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = '#3A0A0A'; ctx.lineWidth = 1.2; ctx.stroke();
                    ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1, r * 0.14);
                    ctx.beginPath(); ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2); ctx.stroke();
                    [[-0.85, 0, -0.55, 0], [0.55, 0, 0.85, 0], [0, -0.85, 0, -0.55], [0, 0.55, 0, 0.85]].forEach(([x1, y1, x2, y2]) => {
                        ctx.beginPath();
                        ctx.moveTo(cx + x1 * r, cy + y1 * r);
                        ctx.lineTo(cx + x2 * r, cy + y2 * r);
                        ctx.stroke();
                    });
                    ctx.restore();
                },
                category: 'upgrade'
            },
            {
                id: 'spike-thrower-tower-unlock',
                name: 'Spike Thrower Plans',
                description: "A crate of hardened iron spikes, the kind meant to be buried point-up in soft ground. Perfect for a rubble pile that's already slowing enemies down.",
                effect: 'Unlocks the Spike Thrower transform\nRequires Forge & Training Grounds Lv5',
                cost: 500,
                drawIcon(ctx, cx, cy, size) {
                    ctx.save();
                    const r = size * 0.34;
                    const bg = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
                    bg.addColorStop(0, '#fff'); bg.addColorStop(0.35, '#CC5500'); bg.addColorStop(1, '#4A1E00');
                    ctx.fillStyle = bg;
                    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = '#4A1E00'; ctx.lineWidth = 1.2; ctx.stroke();
                    ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1, r * 0.16); ctx.lineCap = 'round';
                    for (let i = 0; i < 3; i++) {
                        const a = -Math.PI / 2 + (i - 1) * 0.8;
                        ctx.beginPath();
                        ctx.moveTo(cx + Math.cos(a) * r * 0.2, cy + Math.sin(a) * r * 0.2);
                        ctx.lineTo(cx + Math.cos(a) * r * 0.85, cy + Math.sin(a) * r * 0.85);
                        ctx.stroke();
                    }
                    ctx.restore();
                },
                category: 'upgrade'
            },
            {
                id: 'triple-trebuchet-unlock',
                name: 'Triple Trebuchet Plans',
                description: 'Engineering sketches for a reinforced throwing arm, strong enough to launch three fireballs in a single throw instead of one.',
                effect: 'Unlocks the Triple Trebuchet transform\nRequires Forge & Training Grounds Lv5',
                cost: 900,
                drawIcon(ctx, cx, cy, size) {
                    ctx.save();
                    const r = size * 0.34;
                    const bg = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
                    bg.addColorStop(0, '#fff'); bg.addColorStop(0.35, '#7B2FBE'); bg.addColorStop(1, '#2E0F49');
                    ctx.fillStyle = bg;
                    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = '#2E0F49'; ctx.lineWidth = 1.2; ctx.stroke();
                    ctx.fillStyle = '#fff';
                    [[-0.55, 0.35], [0.55, 0.35], [0, -0.5]].forEach(([dx, dy]) => {
                        ctx.beginPath();
                        ctx.arc(cx + dx * r, cy + dy * r, r * 0.22, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    ctx.restore();
                },
                category: 'upgrade'
            },
            {
                id: 'super-poison-tower-unlock',
                name: 'Super Poison Plans',
                description: "An alchemist's refined recipe, scrawled on oilcloth: the toxin now eats into an enemy's legs as surely as it eats into their health.",
                effect: 'Unlocks the Super Poison transform\nRequires Forge & Training Grounds Lv5',
                cost: 700,
                drawIcon(ctx, cx, cy, size) {
                    ctx.save();
                    const r = size * 0.34;
                    const bg = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
                    bg.addColorStop(0, '#fff'); bg.addColorStop(0.35, '#9B30FF'); bg.addColorStop(1, '#2E0A49');
                    ctx.fillStyle = bg;
                    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = '#2E0A49'; ctx.lineWidth = 1.2; ctx.stroke();
                    ctx.fillStyle = '#fff';
                    ctx.beginPath(); ctx.arc(cx, cy - r * 0.05, r * 0.5, 0, Math.PI * 2); ctx.fill();
                    ctx.fillRect(cx - r * 0.32, cy + r * 0.1, r * 0.64, r * 0.3);
                    ctx.fillStyle = '#9B30FF';
                    ctx.beginPath(); ctx.arc(cx - r * 0.2, cy - r * 0.05, r * 0.12, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(cx + r * 0.2, cy - r * 0.05, r * 0.12, 0, Math.PI * 2); ctx.fill();
                    ctx.restore();
                },
                category: 'upgrade'
            }
        ];

        for (const upgrade of upgradeData) {
            const isPurchased = upgradeSystem.hasUpgrade(upgrade.id);
            let canPurchase = !isPurchased;
            let requirementMsg = null;

            // Check prerequisites — hide upgrade entirely if prerequisite not yet met
            if (!isPurchased && upgrade.prerequisite && !upgradeSystem.hasUpgrade(upgrade.prerequisite)) {
                continue;
            }

            // Check campaign requirement — hide the upgrade entirely if not yet unlocked
            if (!isPurchased && upgrade.campaignRequirement && !unlockedCampaigns.includes(upgrade.campaignRequirement)) {
                continue;
            }

            // Check completed-campaign requirement — hide the upgrade entirely until that
            // campaign has actually been beaten (not just unlocked)
            if (!isPurchased && upgrade.completedCampaignRequirement && !completedCampaigns.includes(upgrade.completedCampaignRequirement)) {
                continue;
            }

            // If already purchased, set requirement message to "Purchased"
            if (isPurchased) {
                requirementMsg = 'Purchased';
            }
            
            items.push({
                id: upgrade.id,
                name: upgrade.name,
                description: upgrade.description,
                cost: upgrade.cost,
                drawIcon: upgrade.drawIcon,
                category: upgrade.category,
                type: 'upgrade',
                effect: upgrade.effect,
                hovered: false,
                isPurchased: isPurchased,
                canPurchase: canPurchase,
                requirementMsg: requirementMsg
            });
        }
        
        return items;
    }

    filterBuyItemsByCategory(categoryId) {
        if (categoryId === 'upgrade') {
            return this.allBuyItems.filter(item => item.category === 'upgrade' || item.category === 'building');
        }
        return this.allBuyItems.filter(item => item.category === categoryId);
    }
    buildSellItems() {
        const items = [];
        const inventory = this.stateManager.playerInventory || [];
        const SHARD_IDS = new Set(['realm-shard-bottom', 'realm-shard-top', 'portal-shard']);
        
        const hasBottom = inventory.some(i => i.lootId === 'realm-shard-bottom' && (i.count || 1) > 0);
        const hasTop = inventory.some(i => i.lootId === 'realm-shard-top' && (i.count || 1) > 0);

        // Create items from inventory
        for (const inventoryItem of inventory) {
            const lootInfo = this.getLootInfo(inventoryItem.lootId);
            if (!lootInfo) {
                console.warn('Could not find loot info for lootId:', inventoryItem.lootId);
                continue;
            }
            const item = {
                id: inventoryItem.lootId,
                name: lootInfo.name,
                description: lootInfo.description || `A valuable treasure. Sell for ${lootInfo.sellValue} gold.`,
                sellPrice: lootInfo.sellValue,
                drawIcon: lootInfo.drawIcon,
                rarity: lootInfo.rarity,
                lootId: inventoryItem.lootId,
                count: inventoryItem.count || 1,
                hovered: false
            };
            if (SHARD_IDS.has(inventoryItem.lootId)) {
                item.isRealmShard = true;
                item.sellPrice = 0;
                if (inventoryItem.lootId === 'portal-shard') {
                    item.shardType = 'portal';
                } else {
                    item.shardType = 'fragment';
                    item.combineEnabled = hasBottom && hasTop;
                }
            }
            items.push(item);
        }
        
        return items;
    }

    _combineRealmShards() {
        const inv = this.stateManager.playerInventory;
        const removeOne = (id) => {
            const idx = inv.findIndex(i => i.lootId === id);
            if (idx !== -1) {
                inv[idx].count -= 1;
                if (inv[idx].count <= 0) inv.splice(idx, 1);
            }
        };
        removeOne('realm-shard-bottom');
        removeOne('realm-shard-top');
        const existing = inv.find(i => i.lootId === 'portal-shard');
        if (existing) {
            existing.count = (existing.count || 1) + 1;
        } else {
            inv.push({ lootId: 'portal-shard', count: 1 });
        }
        if (this.stateManager.audioManager) {
            this.stateManager.audioManager.playSFX('upgrade');
        }
        this._persistLiveSettlementState();
    }

    // Writes the live in-memory gold/inventory/upgrades/marketplace/workshop into the
    // current save slot's working copy (localStorage), same fields completeLevel() persists
    // on victory. Without this, buying/selling only updates stateManager's live properties -
    // navigating to any screen other than 'game' and back (e.g. Level Select, Campaign Map)
    // reloads playerGold/playerInventory from the stale save and silently reverts the change.
    _persistLiveSettlementState() {
        if (!this.stateManager.currentSaveSlot || !this.stateManager.currentSaveData) return;
        const saveData = this.stateManager.currentSaveData;
        saveData.playerGold = this.stateManager.playerGold || 0;
        saveData.playerInventory = this.stateManager.playerInventory || [];
        if (this.stateManager.upgradeSystem) saveData.upgrades = this.stateManager.upgradeSystem.serialize();
        if (this.stateManager.marketplaceSystem) saveData.marketplace = this.stateManager.marketplaceSystem.serialize();
        if (this.stateManager.workshopSystem) saveData.workshop = this.stateManager.workshopSystem.serialize();
        SaveSystem.updateAndSaveSettlementData(this.stateManager.currentSaveSlot, saveData);
    }

    _openPortalPrompt() {
        this.showingPortalConfirm = true;
    }

    _confirmOpenPortal() {
        // Consume the portal shard
        const inv = this.stateManager.playerInventory;
        const idx = inv.findIndex(i => i.lootId === 'portal-shard');
        if (idx !== -1) {
            inv[idx].count -= 1;
            if (inv[idx].count <= 0) inv.splice(idx, 1);
        }
        // Save before launching the realm level
        this._persistLiveSettlementState();
        this.showingPortalConfirm = false;
        this._portalConfirmBounds = null;
        this.isOpen = false;
        // Set level info using the proper selectedLevelInfo property (what GameplayState reads)
        this.stateManager.selectedLevelInfo = {
            id: 'frog-kings-realm',
            campaignId: 'campaign-5',
            type: 'campaign',
            name: "Frog King's Realm",
            unlocked: true
        };
        this.stateManager.changeState('game');
    }

    getLootInfo(lootId) {
        // Use LootRegistry for authoritative loot data
        const lootInfo = LootRegistry.getLootType(lootId);
        if (lootInfo) {
            return {
                name: lootInfo.name,
                description: lootInfo.description || `A ${lootInfo.rarity || 'common'} treasure from fallen enemies.`,
                sellValue: lootInfo.sellValue,
                drawIcon: lootInfo.drawIcon,
                rarity: lootInfo.rarity
            };
        }
        
        // Fallback for any items not in registry
        console.warn('Loot not found in registry:', lootId);
        return { 
            name: 'Unknown Item', 
            sellValue: 0,
            rarity: 'common'
        };
    }

    open() {
        this.isOpen = true;
        this.animationProgress = 0;
        this.activeTab = 'buy';
        this.currentPage = 0;
        this.activeBuyCategory = 'upgrade';
        this.openTime = Date.now(); // Record when menu was opened
        
        // Refresh player gold from stateManager (in case it changed)
        this.playerGold = this.stateManager.playerGold || 0;
        
        // Force immediate refresh of buy/sell items
        this.lastConsumableCheckTime = 0;
        
        // Rebuild buy items to reflect current state
        this.allBuyItems = this.buildBuyItems();
        this.buyItems = this.filterBuyItemsByCategory('upgrade');
        
        // Refresh sell items when opening
        this.sellItems = this.buildSellItems();
    }

    close() {
        this.isOpen = false;
        // Clear effects
        this.floatingGoldEffects = [];
        this.glowEffects = [];
        this.errorEffects = [];
        // Reset scroll states for upgrade tiles
        this.scrollableTiles.clear();
        this.settlementHub.closePopup();
    }

    update(deltaTime) {
        if (this.isOpen && this.animationProgress < 1) {
            this.animationProgress += deltaTime * 2;
        }
        
        // Update visual effects
        this.updateEffects(deltaTime);
        
        // Periodically check if marketplace consumables have changed (e.g., magic flatpack was used)
        // This ensures the panel always shows the current state
        if (!this.lastConsumableCheckTime) {
            this.lastConsumableCheckTime = 0;
        }
        const now = Date.now();
        if (this.isOpen && (now - this.lastConsumableCheckTime) > 500) { // Check every 500ms
            this.lastConsumableCheckTime = now;
            // Preserve hover states before rebuilding
            const oldBuyItems = this.buyItems;
            const hoverStateMap = new Map();
            if (oldBuyItems) {
                oldBuyItems.forEach(item => {
                    if (item.hovered) {
                        hoverStateMap.set(item.id, true);
                    }
                });
            }
            
            // Rebuild items to reflect any changes in marketplace consumables
            this.allBuyItems = this.buildBuyItems();
            this.buyItems = this.filterBuyItemsByCategory(this.activeBuyCategory);
            
            // Restore hover states
            this.buyItems.forEach(item => {
                item.hovered = hoverStateMap.has(item.id);
            });
        }
    }

    wrapText(text, maxCharsPerLine) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        for (const word of words) {
            if ((currentLine + word).length <= maxCharsPerLine) {
                currentLine += (currentLine ? ' ' : '') + word;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }

    // Pixel-accurate word-wrap using the current ctx.font, instead of a fixed
    // chars-per-line estimate that can overflow a tile's bounds at some font/width
    // combinations. Caller must set ctx.font to the font it will draw with first.
    wrapTextToWidth(ctx, text, maxWidthPx) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            if (!currentLine || ctx.measureText(testLine).width <= maxWidthPx) {
                currentLine = testLine;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }

    // Like wrapTextToWidth, but caps the result to maxLines, ellipsis-truncating
    // the last line if there's more text than fits. Used for item/upgrade names.
    wrapNameToLines(ctx, text, maxWidthPx, maxLines) {
        const lines = this.wrapTextToWidth(ctx, text, maxWidthPx);
        if (lines.length <= maxLines) return lines;

        const kept = lines.slice(0, maxLines);
        let last = kept[maxLines - 1];
        while (last.length > 1 && ctx.measureText(last + '…').width > maxWidthPx) {
            last = last.slice(0, -1).trimEnd();
        }
        kept[maxLines - 1] = last + '…';
        return kept;
    }

    /**
     * Draw decorative golden corner trim on panel corners
     */
    drawCornerTrim(ctx, x, y, size = 20, isTopLeft = true, isTopRight = false, isBottomLeft = false, isBottomRight = false) {
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
        const gemSize = 5;
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

    getMaxPages() {
        if (this.activeTab === 'buy') {
            return Math.ceil(this.buyItems.length / 6); // Dynamic pages based on buy items
        } else if (this.activeTab === 'sell') {
            return Math.ceil(this.sellItems.length / 6);
        }
        return 1;
    }

    getItemsForCurrentPage() {
        const itemsPerPage = 6;
        const startIdx = this.currentPage * itemsPerPage;
        
        if (this.activeTab === 'buy') {
            return this.buyItems.slice(startIdx, startIdx + itemsPerPage);
        } else if (this.activeTab === 'sell') {
            return this.sellItems.slice(startIdx, startIdx + itemsPerPage);
        }
        return [];
    }

    updateHoverState(x, y) {
        // Handle portal confirm modal hover state first
        if (this.showingPortalConfirm && this._portalConfirmBounds) {
            const b = this._portalConfirmBounds;
            this.portalConfirmYesHovered = x >= b.yesX && x <= b.yesX + b.btnW && y >= b.btnY && y <= b.btnY + b.btnH;
            this.portalConfirmNoHovered = x >= b.noX && x <= b.noX + b.btnW && y >= b.btnY && y <= b.btnY + b.btnH;
            this.stateManager.canvas.style.cursor = (this.portalConfirmYesHovered || this.portalConfirmNoHovered) ? 'pointer' : 'default';
            return;
        }

        const canvas = this.stateManager.canvas;
        const baseWidth = canvas.width - 80;
        const baseHeight = canvas.height - 60;
        const panelWidth = Math.min(baseWidth * 0.89, 1280);
        const panelHeight = Math.min(baseHeight * 0.89, 840);
        const panelX = (canvas.width - panelWidth) / 2;
        const panelY = (canvas.height - panelHeight) / 2;
        
        const tabY = panelY + 49;
        const tabHeight = 48;
        const tabWidth = (panelWidth - 40) / 2;
        const tabGap = 0;
        
        // Check tab buttons
        this.tabButtons.forEach((tab, index) => {
            const tabX = panelX + 20 + index * (tabWidth + tabGap);
            tab.hovered = x >= tabX && x <= tabX + tabWidth && y >= tabY && y <= tabY + tabHeight;
        });
        
        // Check category filter buttons (only visible in buy tab)
        if (this.activeTab === 'buy') {
            const categoryY = panelY + 97;
            const categoryHeight = 38;
            const categoryButtonWidth = (panelWidth - 40) / this.buyCategories.length;
            
            this.buyCategories.forEach((category, index) => {
                const categoryX = panelX + 20 + index * categoryButtonWidth;
                category.hovered = x >= categoryX && x <= categoryX + categoryButtonWidth && 
                                 y >= categoryY && y <= categoryY + categoryHeight;
            });
        }
        
        // Check close button
        const closeX = panelX + panelWidth - 40;
        const closeY = panelY + 9;
        this.closeButtonHovered = x >= closeX && x <= closeX + 32 && y >= closeY && y <= closeY + 32;
        
        // Check arrow buttons
        const arrowY = panelY + panelHeight - 62;
        const arrowSize = 38;
        const leftArrowX = panelX + 20;
        const rightArrowX = panelX + panelWidth - 57;
        this.leftArrowHovered = x >= leftArrowX && x <= leftArrowX + arrowSize && y >= arrowY && y <= arrowY + arrowSize;
        this.rightArrowHovered = x >= rightArrowX && x <= rightArrowX + arrowSize && y >= arrowY && y <= arrowY + arrowSize;
        
        // Check item buttons (for sell and upgrade tabs)
        const contentY = panelY + 100 + (this.activeTab === 'buy' ? 38 : 0);
        const contentHeight = panelHeight - 165 - (this.activeTab === 'buy' ? 38 : 0);
        
        const horizontalPadding = 20;
        const verticalPadding = 15;
        const gridSpacing = 12;
        
        const availableWidth = panelWidth - (horizontalPadding * 2);
        const availableHeight = contentHeight - (verticalPadding * 2);
        
        const itemWidth = (availableWidth - (gridSpacing * 2)) / 3;
        const itemHeight = (availableHeight - gridSpacing) / 2;
        
        const itemsGridStartX = panelX + horizontalPadding;
        const itemsGridStartY = contentY + verticalPadding;
        
        const items = this.getItemsForCurrentPage();
        items.forEach((item, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            const itemX = itemsGridStartX + col * (itemWidth + gridSpacing);
            const itemY = itemsGridStartY + row * (itemHeight + gridSpacing);
            item.hovered = x >= itemX && x <= itemX + itemWidth && y >= itemY && y <= itemY + itemHeight;
        });
        
        this.stateManager.canvas.style.cursor = 
            (this.tabButtons.some(t => t.hovered) || 
             this.buyCategories.some(c => c.hovered) ||
             this.closeButtonHovered || this.leftArrowHovered || this.rightArrowHovered || items.some(i => i.hovered))
            ? 'pointer' : 'default';
    }

    handleClick(x, y) {
        // Prevent registering clicks for 200ms after opening to avoid click-through
        const timeSinceOpen = Date.now() - this.openTime;
        if (timeSinceOpen < 200) {
            return;
        }

        // Handle portal confirm modal clicks first
        if (this.showingPortalConfirm && this._portalConfirmBounds) {
            const b = this._portalConfirmBounds;
            if (x >= b.yesX && x <= b.yesX + b.btnW && y >= b.btnY && y <= b.btnY + b.btnH) {
                this._confirmOpenPortal();
                return;
            }
            if (x >= b.noX && x <= b.noX + b.btnW && y >= b.btnY && y <= b.btnY + b.btnH) {
                this.showingPortalConfirm = false;
                this._portalConfirmBounds = null;
                this.sellItems = this.buildSellItems(); // Refresh inventory view
                return;
            }
            this.showingPortalConfirm = false;
            this._portalConfirmBounds = null;
            return;
        }
        
        const canvas = this.stateManager.canvas;
        const baseWidth = canvas.width - 80;
        const baseHeight = canvas.height - 60;
        const panelWidth = Math.min(baseWidth * 0.89, 1280);
        const panelHeight = Math.min(baseHeight * 0.89, 840);
        const panelX = (canvas.width - panelWidth) / 2;
        const panelY = (canvas.height - panelHeight) / 2;
        
        // Check close button
        const closeX = panelX + panelWidth - 40;
        const closeY = panelY + 9;
        if (x >= closeX && x <= closeX + 32 && y >= closeY && y <= closeY + 32) {
            this.close();
            return;
        }
        
        // Check tab buttons
        const tabY = panelY + 49;
        const tabHeight = 48;
        const tabWidth = (panelWidth - 40) / 2;
        const tabGap = 0;
        
        this.tabButtons.forEach((tab, index) => {
            const tabX = panelX + 20 + index * (tabWidth + tabGap);
            if (x >= tabX && x <= tabX + tabWidth && y >= tabY && y <= tabY + tabHeight) {
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
                this.activeTab = tab.action;
                this.currentPage = 0;
                this.activeBuyCategory = 'upgrade'; // Reset category filter when switching tabs
                
                // Refresh sell items when switching to sell tab
                if (tab.action === 'sell') {
                    this.sellItems = this.buildSellItems();
                }
            }
        });
        
        // Check category filter buttons (only visible in buy tab)
        if (this.activeTab === 'buy') {
            const categoryY = tabY + tabHeight + 10;
            const categoryHeight = 38;
            const categoryButtonWidth = (panelWidth - 40) / this.buyCategories.length;
            
            this.buyCategories.forEach((category, index) => {
                const categoryX = panelX + 20 + index * categoryButtonWidth;
                if (x >= categoryX && x <= categoryX + categoryButtonWidth && 
                    y >= categoryY && y <= categoryY + categoryHeight) {
                    if (this.stateManager.audioManager) {
                        this.stateManager.audioManager.playSFX('button-click');
                    }
                    this.activeBuyCategory = category.id;
                    this.buyItems = this.filterBuyItemsByCategory(category.id);
                    this.currentPage = 0;
                }
            });
        }
        
        // Check arrow buttons
        const arrowY = panelY + panelHeight - 62;
        const arrowSize = 38;
        const leftArrowX = panelX + 20;
        const rightArrowX = panelX + panelWidth - 57;
        const maxPages = this.getMaxPages();
        
        // Prevent double-click by checking time since last click
        const now = Date.now();
        const debounceTime = 200; // milliseconds
        
        if (x >= leftArrowX && x <= leftArrowX + arrowSize && y >= arrowY && y <= arrowY + arrowSize) {
            if (this.currentPage > 0 && (now - this.lastPaginationClickTime) > debounceTime) {
                this.currentPage--;
                this.lastPaginationClickTime = now;
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
            }
            return;
        }
        
        if (x >= rightArrowX && x <= rightArrowX + arrowSize && y >= arrowY && y <= arrowY + arrowSize) {
            if (this.currentPage < maxPages - 1 && (now - this.lastPaginationClickTime) > debounceTime) {
                this.currentPage++;
                this.lastPaginationClickTime = now;
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
            }
            return;
        }
        
        // Check item buttons
        const contentY = panelY + 100 + (this.activeTab === 'buy' ? 38 : 0);
        const contentHeight = panelHeight - 165 - (this.activeTab === 'buy' ? 38 : 0);
        
        const horizontalPadding = 20;
        const verticalPadding = 15;
        const gridSpacing = 12;
        
        const availableWidth = panelWidth - (horizontalPadding * 2);
        const availableHeight = contentHeight - (verticalPadding * 2);
        
        const itemWidth = (availableWidth - (gridSpacing * 2)) / 3;
        const itemHeight = (availableHeight - gridSpacing) / 2;
        
        const itemsGridStartX = panelX + horizontalPadding;
        const itemsGridStartY = contentY + verticalPadding;
        
        const items = this.getItemsForCurrentPage();
        items.forEach((item, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            const itemX = itemsGridStartX + col * (itemWidth + gridSpacing);
            const itemY = itemsGridStartY + row * (itemHeight + gridSpacing);
            
            // Check if click is within button bounds (not entire item)
            const buttonWidth = itemWidth - 14;
            const buttonHeight = 36;
            const buttonX = itemX + 7;
            const buttonY = itemY + itemHeight - 47;
            
            if (x >= buttonX && x <= buttonX + buttonWidth && y >= buttonY && y <= buttonY + buttonHeight) {
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
                this.handleItemAction(item, itemX + itemWidth / 2, itemY + itemHeight / 2);
            }
        });
    }

    handleItemAction(item, itemCenterX, itemCenterY) {
        // Prevent rapid double-clicks
        if (this.clickLock) {
            return;
        }
        this.clickLock = true;
        setTimeout(() => { this.clickLock = false; }, 100); // 100ms debounce
        
        if (this.activeTab === 'buy') {
            // Handle both marketplace items and upgrades (upgrades are now a category in buy tab)
            if (!item.canPurchase) {
                // Show error message centered in the item panel
                if (item.requirementMsg) {
                    this.createItemErrorEffect(item.requirementMsg, itemCenterX, itemCenterY);
                }
                return;
            }
            
            if (this.playerGold < item.cost) {
                // Show "Not Enough Gold" error centered in the item panel
                this.createItemErrorEffect('Not Enough Gold', itemCenterX, itemCenterY);
                return;
            }
            
            // Deduct gold
            this.playerGold -= item.cost;
            this.stateManager.playerGold = this.playerGold;
            
            // Create glow effect with gold amount at player gold display location
            this.createGlowEffect(item.cost, this.goldDisplayX, this.goldDisplayY);
            
            // Handle upgrades separately from marketplace items
            if (item.type === 'upgrade') {
                // Purchase upgrade to upgrade system
                this.stateManager.upgradeSystem.purchaseUpgrade(item.id);

                // Commander's Workshop unlocks the campaign-5 screen (same mechanism the old
                // Frog-King-completion path used to set) and spawns the Workshop building on
                // the settlement map immediately, without needing to leave and re-enter.
                if (item.id === 'commanders-workshop') {
                    const saveData = this.stateManager.currentSaveData;
                    if (saveData) {
                        if (!saveData.unlockedCampaigns) saveData.unlockedCampaigns = ['campaign-1'];
                        if (!saveData.unlockedCampaigns.includes('campaign-5')) {
                            saveData.unlockedCampaigns.push('campaign-5');
                        }
                        CampaignRegistry.loadFromSaveData(saveData);
                    }
                    if (!this.stateManager.workshopSystem) {
                        this.stateManager.workshopSystem = new WorkshopSystem();
                    }
                    if (this.settlementHub) {
                        this.settlementHub._addWorkshopBuilding();
                    }
                }

                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('upgrade');
                }
            } else {
                // Purchase marketplace item
                this.stateManager.marketplaceSystem.addConsumable(item.id, 1);
                
                // Handle Intel pack purchases - unlock corresponding enemy intel
                if (item.category === 'intel') {
                    this.stateManager.marketplaceSystem.unlockEnemyIntel(item.id);
                }
                
                
                if (this.stateManager.audioManager) {
                    // Use upgrade sound for buying in marketplace
                    this.stateManager.audioManager.playSFX('upgrade');
                }
            }
            
            // Update statistics when buying
            if (this.stateManager.gameStatistics) {
                this.stateManager.gameStatistics.totalMoneySpentOnMarketplace += item.cost;
            }

            // Check achievements after marketplace spend
            if (this.stateManager.achievementSystem && this.stateManager.gameStatistics) {
                this.stateManager.achievementSystem.checkAchievements(
                    this.stateManager.gameStatistics, this.stateManager.currentSaveData
                );
            }

            // Rebuild buy items to reflect purchase restrictions and active status
            this.allBuyItems = this.buildBuyItems();
            this.buyItems = this.filterBuyItemsByCategory(this.activeBuyCategory);

            this._persistLiveSettlementState();
        } else if (this.activeTab === 'sell') {
            // Handle realm shard items specially
            if (item.isRealmShard) {
                if (item.shardType === 'fragment') {
                    if (item.combineEnabled) {
                        this._combineRealmShards();
                        this.sellItems = this.buildSellItems();
                    }
                } else if (item.shardType === 'portal') {
                    this._openPortalPrompt();
                }
                return;
            }

            // Sell the loot item
            this.playerGold += item.sellPrice;
            this.stateManager.playerGold = this.playerGold;
            
            // Create gold add effect at the gold display location
            this.createAddGoldEffect(item.sellPrice, this.goldDisplayX, this.goldDisplayY);
            
            // Update statistics when selling
            if (this.stateManager.gameStatistics) {
                this.stateManager.gameStatistics.totalMoneyEarnedInMarketplace += item.sellPrice;
                this.stateManager.gameStatistics.addItemsSold(1);
            }

            // Check achievements after selling
            if (this.stateManager.achievementSystem && this.stateManager.gameStatistics) {
                this.stateManager.achievementSystem.checkAchievements(
                    this.stateManager.gameStatistics, this.stateManager.currentSaveData
                );
            }

            // Remove from inventory
            const inventoryIndex = this.stateManager.playerInventory.findIndex(
                inv => inv.lootId === item.lootId
            );
            
            if (inventoryIndex !== -1) {
                this.stateManager.playerInventory[inventoryIndex].count -= 1;
                if (this.stateManager.playerInventory[inventoryIndex].count <= 0) {
                    this.stateManager.playerInventory.splice(inventoryIndex, 1);
                }
            }
            
            // Rebuild sell items to reflect the change
            this.sellItems = this.buildSellItems();


            if (this.stateManager.audioManager) {
                // Use LootCollect sound for selling (as per user request)
                this.stateManager.audioManager.playSFX('loot-collect');
            }

            this._persistLiveSettlementState();
        }
    }

    handleWheel(x, y, deltaY, deltaMode = 0) {
        // Handle scrolling on upgrade tiles
        const canvas = this.stateManager.canvas;
        const baseWidth = canvas.width - 80;
        const baseHeight = canvas.height - 60;
        const panelWidth = Math.min(baseWidth * 0.89, 1280);
        const panelHeight = Math.min(baseHeight * 0.89, 840);
        const panelX = (canvas.width - panelWidth) / 2;
        const panelY = (canvas.height - panelHeight) / 2;
        
        // Calculate item grid positions (same as in updateHoverState and renderTabContent)
        const contentY = panelY + 100 + (this.activeTab === 'buy' ? 38 : 0);
        const contentHeight = panelHeight - 165 - (this.activeTab === 'buy' ? 38 : 0);
        
        const horizontalPadding = 20;
        const verticalPadding = 15;
        const gridSpacing = 12;
        
        const availableWidth = panelWidth - (horizontalPadding * 2);
        const availableHeight = contentHeight - (verticalPadding * 2);
        
        const itemWidth = (availableWidth - (gridSpacing * 2)) / 3;
        const itemHeight = (availableHeight - gridSpacing) / 2;
        
        const itemsGridStartX = panelX + horizontalPadding;
        const itemsGridStartY = contentY + verticalPadding;
        
        // Find which item is under the mouse
        const items = this.getItemsForCurrentPage();
        for (let index = 0; index < items.length; index++) {
            const item = items[index];
            const row = Math.floor(index / 3);
            const col = index % 3;
            const itemX = itemsGridStartX + col * (itemWidth + gridSpacing);
            const itemY = itemsGridStartY + row * (itemHeight + gridSpacing);
            
            // Check if mouse is within this item bounds
            if (x >= itemX && x <= itemX + itemWidth && y >= itemY && y <= itemY + itemHeight) {
                // Scroll all items that have scroll state
                if (this.scrollableTiles.has(item.id)) {
                    const scrollState = this.scrollableTiles.get(item.id);
                    if (scrollState.maxScroll > 0) {
                        // Convert the wheel event to pixels, honoring deltaMode (browsers/
                        // OSes disagree: pixel deltas by default, but line deltas e.g. on
                        // Firefox, and the OS's configured wheel/trackpad speed changes the
                        // magnitude either way) instead of always stepping exactly 1 line.
                        // This used to be a fixed +/-1 regardless of deltaY, which felt
                        // "slow" on any system configured for a faster wheel speed.
                        const pixelDelta = deltaMode === 1 ? deltaY * UPGRADE_DESC_LINE_HEIGHT
                            : deltaMode === 2 ? deltaY * (scrollState.maxScroll * UPGRADE_DESC_LINE_HEIGHT)
                            : deltaY;
                        scrollState.pixelAccum = (scrollState.pixelAccum || 0) + pixelDelta;
                        const stepLines = Math.trunc(scrollState.pixelAccum / UPGRADE_DESC_LINE_HEIGHT);
                        if (stepLines !== 0) {
                            scrollState.scrollOffset += stepLines;
                            scrollState.pixelAccum -= stepLines * UPGRADE_DESC_LINE_HEIGHT;
                        }
                        // Clamp scroll offset
                        const clamped = Math.max(0, Math.min(scrollState.scrollOffset, scrollState.maxScroll));
                        if (clamped !== scrollState.scrollOffset) scrollState.pixelAccum = 0;
                        scrollState.scrollOffset = clamped;
                    }
                }
                break;
            }
        }
    }

    createGoldSplash(originX, originY, amount) {
        // Create multiple gold coin particles that splash outward and fall
        const coinCount = Math.min(100, Math.ceil(amount / 30)); // More coins for higher amounts
        for (let i = 0; i < coinCount; i++) {
            const angle = (i / coinCount) * Math.PI * 2;
            const velocity = {
                x: Math.cos(angle) * (3 + Math.random() * 3),
                y: Math.sin(angle) * (3 + Math.random() * 2) - 2
            };
            this.floatingGoldEffects.push({
                x: originX,
                y: originY,
                velocityX: velocity.x,
                velocityY: velocity.y,
                gravity: 0.15,
                duration: 1.2,
                elapsed: 0,
                rotation: Math.random() * Math.PI * 2,
                rotationVel: (Math.random() - 0.5) * 0.3,
                showText: true,
                textAmount: amount,
                textColor: '#00FF00' // Green for sale (positive)
            });
        }
        
        // Add one text effect at the origin showing the amount
        this.glowEffects.push({
            x: originX,
            y: originY,
            startY: originY,
            duration: 1.5,
            elapsed: 0,
            amount: '+' + amount,
            float: 0,
            floatVel: 0.5,
            color: '#00FF00'
        });
    }

    createGlowEffect(goldAmount, originX, originY) {
        // Create text effect at the gold display location showing the gold spent
        // Animates DOWNWARD and fades out in RED
        this.glowEffects.push({
            x: originX,
            y: originY,
            startY: originY,
            duration: 1.8,
            elapsed: 0,
            amount: '-' + goldAmount,
            float: 0,
            floatVel: -80,  // Negative velocity for downward movement (pixels per second)
            color: '#FF6666'  // Red for spent gold
        });
    }

    createAddGoldEffect(goldAmount, originX, originY) {
        // Create text effect at the gold display location showing the gold added
        // Animates UPWARD and fades out in GREEN
        this.glowEffects.push({
            x: originX,
            y: originY,
            startY: originY,
            duration: 1.8,
            elapsed: 0,
            amount: '+' + goldAmount,
            float: 0,
            floatVel: 80,  // Positive velocity for upward movement (pixels per second)
            color: '#00FF00'  // Green for added gold
        });
    }

    createErrorEffect(message, originX, originY) {
        // Create error message effect
        this.errorEffects.push({
            x: originX,
            y: originY,
            startY: originY,
            duration: 2,
            elapsed: 0,
            message: message,
            float: 0,
            floatVel: 0.3
        });
    }

    createItemErrorEffect(message, itemCenterX, itemCenterY) {
        // Create error message effect displayed in the center of an item panel
        this.itemErrorEffects = this.itemErrorEffects || [];
        this.itemErrorEffects.push({
            x: itemCenterX,
            y: itemCenterY,
            startY: itemCenterY,
            duration: 2,
            elapsed: 0,
            message: message,
            float: 0,
            floatVel: 0.2
        });
    }

    updateEffects(deltaTime) {
        // Update gold splash effects
        this.floatingGoldEffects = this.floatingGoldEffects.filter(effect => {
            effect.elapsed += deltaTime;
            effect.y += effect.velocityY;
            effect.velocityY += effect.gravity;
            effect.x += effect.velocityX;
            effect.rotation += effect.rotationVel;
            return effect.elapsed < effect.duration;
        });
        
        // Update glow effects
        this.glowEffects = this.glowEffects.filter(effect => {
            effect.elapsed += deltaTime;
            effect.float += effect.floatVel * deltaTime;
            return effect.elapsed < effect.duration;
        });
        
        // Update error effects
        this.errorEffects = this.errorEffects.filter(effect => {
            effect.elapsed += deltaTime;
            effect.float += effect.floatVel * deltaTime;
            return effect.elapsed < effect.duration;
        });
        
        // Update item error effects
        if (!this.itemErrorEffects) this.itemErrorEffects = [];
        this.itemErrorEffects = this.itemErrorEffects.filter(effect => {
            effect.elapsed += deltaTime;
            effect.float += effect.floatVel * deltaTime;
            return effect.elapsed < effect.duration;
        });
    }

    renderEffects(ctx) {
        // Render gold splash effects
        this.floatingGoldEffects.forEach(effect => {
            const progress = effect.elapsed / effect.duration;
            const alpha = Math.max(0, 1 - progress); // Fade out
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(effect.x, effect.y);
            ctx.rotate(effect.rotation);
            
            // Draw gold coin
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Coin edge
            ctx.strokeStyle = '#ffed4e';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Coin shine
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(-1.5, -1.5, 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
        
        // Render glow effects
        this.glowEffects.forEach(effect => {
            const progress = effect.elapsed / effect.duration;
            const alpha = Math.max(0, 1 - progress * 1.2); // Fade out
            
            // Draw amount text
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = 'bold 18px Arial';
            ctx.fillStyle = effect.color || '#FFD700';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(effect.amount + 'g', effect.x, effect.y - effect.float);
            ctx.restore();
        });
        
        // Render error effects
        this.errorEffects.forEach(effect => {
            const progress = effect.elapsed / effect.duration;
            const alpha = Math.max(0, 1 - progress); // Fade out
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = '#ff4444';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(effect.message, effect.x, effect.y - effect.float);
            ctx.restore();
        });
        
        // Render item error effects
        if (!this.itemErrorEffects) this.itemErrorEffects = [];
        this.itemErrorEffects.forEach(effect => {
            const progress = effect.elapsed / effect.duration;
            const alpha = Math.max(0, 1 - progress); // Fade out
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = 'bold 15px Arial';
            ctx.fillStyle = '#ff4444';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.fillText(effect.message, effect.x, effect.y - effect.float);
            ctx.restore();
        });
    }


    render(ctx) {
        if (!this.isOpen) return;
        
        const canvas = this.stateManager.canvas;
        const baseWidth = canvas.width - 80;
        const baseHeight = canvas.height - 60;
        const panelWidth = Math.min(baseWidth * 0.89, 1280); // Use more screen space
        const panelHeight = Math.min(baseHeight * 0.89, 840);
        const panelX = (canvas.width - panelWidth) / 2;
        const panelY = (canvas.height - panelHeight) / 2;
        
        // Fade background
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        
        // Panel background
        ctx.globalAlpha = Math.min(1, this.animationProgress);
        ctx.fillStyle = '#2a1a0f';
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        
        // Panel border
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 3;
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // Draw corner trim on all four corners
        this.drawCornerTrim(ctx, panelX, panelY, 20, true, false, false, false);  // Top-left
        this.drawCornerTrim(ctx, panelX + panelWidth, panelY, 20, false, true, false, false);  // Top-right
        this.drawCornerTrim(ctx, panelX, panelY + panelHeight, 20, false, false, true, false);  // Bottom-left
        this.drawCornerTrim(ctx, panelX + panelWidth, panelY + panelHeight, 20, false, false, false, true);  // Bottom-right
        
        // Panel title - inside at top
        ctx.font = 'bold 27px serif';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('Upgrades & Marketplace', panelX + panelWidth / 2, panelY + 12);
        
        // Gold display in top left
        this.renderGoldDisplay(ctx, panelX + 20, panelY + 10);
        
        // Close button
        const closeX = panelX + panelWidth - 40;
        const closeY = panelY + 9;
        ctx.fillStyle = this.closeButtonHovered ? '#ff6666' : '#cc0000';
        ctx.fillRect(closeX, closeY, 32, 32);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(closeX, closeY, 32, 32);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('×', closeX + 16, closeY + 16);
        
        // Tabs
        const tabY = panelY + 49;
        const tabHeight = 48;
        const tabWidth = (panelWidth - 40) / 2;
        const tabGap = 0;
        
        this.tabButtons.forEach((tab, index) => {
            const tabX = panelX + 20 + index * (tabWidth + tabGap);
            const isActive = tab.action === this.activeTab;
            
            // Tab button with beveled edge effect
            // Background - brighter if hovered
            ctx.fillStyle = isActive ? '#6b5a47' : (tab.hovered ? '#5a4a3a' : '#3a2a1a');
            ctx.fillRect(tabX, tabY, tabWidth, tabHeight);
            
            // Top highlight for active tab
            if (isActive) {
                ctx.fillStyle = '#8b7a67';
                ctx.fillRect(tabX, tabY, tabWidth, 2);
                ctx.fillStyle = '#7b6a57';
                ctx.fillRect(tabX, tabY + 2, tabWidth, 1);
            }
            
            // Bottom shadow
            ctx.fillStyle = '#1a0a00';
            ctx.fillRect(tabX, tabY + tabHeight - 2, tabWidth, 2);
            
            // Left shadow
            ctx.fillStyle = '#1a0a00';
            ctx.fillRect(tabX, tabY, 1, tabHeight);
            
            // Border - brighter if hovered
            ctx.strokeStyle = isActive ? '#ffd700' : (tab.hovered ? '#d4a574' : '#5a4a3a');
            ctx.lineWidth = isActive ? 2 : (tab.hovered ? 2 : 1);
            ctx.strokeRect(tabX, tabY, tabWidth, tabHeight);
            
            // Tab text - brighter if hovered
            ctx.font = isActive ? 'bold 19px Arial' : (tab.hovered ? 'bold 19px Arial' : '19px Arial');
            ctx.fillStyle = isActive ? '#ffd700' : (tab.hovered ? '#d4a574' : '#b89968');
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tab.label, tabX + tabWidth / 2, tabY + tabHeight / 2);
        });
        
        // Render category filter buttons (only in buy tab)
        if (this.activeTab === 'buy') {
            const categoryY = panelY + 97;
            const categoryHeight = 38;
            const categoryButtonWidth = (panelWidth - 40) / this.buyCategories.length;
            
            this.buyCategories.forEach((category, index) => {
                const categoryX = panelX + 20 + index * categoryButtonWidth;
                const isActive = this.activeBuyCategory === category.id;
                
                // Button background
                ctx.fillStyle = isActive ? '#6b5a47' : '#3a2a1a';
                ctx.fillRect(categoryX, categoryY, categoryButtonWidth, categoryHeight);
                
                // Button border
                ctx.strokeStyle = isActive ? '#ffd700' : '#5a4a3a';
                ctx.lineWidth = isActive ? 2 : 1;
                ctx.strokeRect(categoryX, categoryY, categoryButtonWidth, categoryHeight);
                
                // Button text
                ctx.font = isActive ? 'bold 17px Arial' : '17px Arial';
                ctx.fillStyle = isActive ? '#ffd700' : '#b89968';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(category.label, categoryX + categoryButtonWidth / 2, categoryY + categoryHeight / 2);
            });
        }
        
        // Content area based on active tab - expanded to fill space
        const contentY = panelY + 100 + (this.activeTab === 'buy' ? 38 : 0);
        const contentHeight = panelHeight - 165 - (this.activeTab === 'buy' ? 38 : 0);
        
        this.renderTabContent(ctx, panelX, contentY, panelWidth, contentHeight);
        
        // Pagination controls
        const maxPages = this.getMaxPages();
        if (maxPages > 1) {
            this.renderPaginationControls(ctx, panelX, panelY + panelHeight - 62, panelWidth);
        }
        
        // Store panel info for coordinate calculations
        this.lastPanelX = panelX;
        this.lastPanelY = panelY;
        this.lastPanelWidth = panelWidth;
        this.lastPanelHeight = panelHeight;
        
        // Render visual effects
        this.renderEffects(ctx);
        
        // Render portal confirm modal on top if active
        if (this.showingPortalConfirm) {
            this._renderPortalConfirmModal(ctx, canvas);
        }
        
        ctx.globalAlpha = 1;
    }

    _renderPortalConfirmModal(ctx, canvas) {
        const t = Date.now() / 800;
        const pulse = 0.6 + 0.4 * Math.sin(t * 1.4);

        const mw = 560;
        const mh = 310;
        const mx = (canvas.width - mw) / 2;
        const my = (canvas.height - mh) / 2;

        // Dim backdrop (same opacity as main panel)
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;

        // Panel background - same dark brown as the game's panels
        ctx.fillStyle = '#2a1a0f';
        ctx.fillRect(mx, my, mw, mh);

        // Panel border - golden brown like main panel
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 3;
        ctx.strokeRect(mx, my, mw, mh);

        // Corner trims - reuse same style as the main menu panels
        this.drawCornerTrim(ctx, mx, my, 20, true, false, false, false);
        this.drawCornerTrim(ctx, mx + mw, my, 20, false, true, false, false);
        this.drawCornerTrim(ctx, mx, my + mh, 20, false, false, true, false);
        this.drawCornerTrim(ctx, mx + mw, my + mh, 20, false, false, false, true);

        // Decorative top divider line (teal glow hint for magic)
        const divAlpha = 0.4 + 0.2 * pulse;
        const topBar = ctx.createLinearGradient(mx, my, mx + mw, my);
        topBar.addColorStop(0, 'rgba(0,200,160,0)');
        topBar.addColorStop(0.5, `rgba(0,200,160,${divAlpha})`);
        topBar.addColorStop(1, 'rgba(0,200,160,0)');
        ctx.fillStyle = topBar;
        ctx.fillRect(mx + 20, my + 46, mw - 40, 2);

        // Title - matching main panel style (bold serif, gold)
        ctx.font = 'bold 26px serif';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText("The Frog King's Realm", mx + mw / 2, my + 13);

        // Subtitle - slightly magical teal colour
        ctx.font = 'italic 14px serif';
        ctx.fillStyle = `rgba(0,220,170,${0.7 + 0.3 * pulse})`;
        ctx.fillText('A portal shard glows in your hand...', mx + mw / 2, my + 52);

        // Body text
        ctx.font = '15px serif';
        ctx.fillStyle = '#d4c9a8'; // warm parchment
        ctx.fillText('Teleport your troops to the Frog King\'s Realm?', mx + mw / 2, my + 84);

        ctx.font = '13px serif';
        ctx.fillStyle = '#a89070'; // muted warm brown
        ctx.fillText('Your Portal Shard will be consumed on entry.', mx + mw / 2, my + 112);
        ctx.fillText('No towers may be built. All spells are free to cast.', mx + mw / 2, my + 132);
        ctx.fillText('The frogs carry riches — claim them or let them pass.', mx + mw / 2, my + 152);
        ctx.fillText('You cannot lose this level.', mx + mw / 2, my + 170);

        // Buttons
        const btnW = 170;
        const btnH = 46;
        const btnGap = 24;
        const yesX = mx + mw / 2 - btnW - btnGap / 2;
        const noX = mx + mw / 2 + btnGap / 2;
        const btnY = my + mh - 72;

        // ENTER REALM button - warm olive/green with gold border
        const yesBg = this.portalConfirmYesHovered ? '#4a5a1a' : '#2f3a12';
        const yesBorder = this.portalConfirmYesHovered ? '#d4af37' : '#8b7a2a';
        ctx.fillStyle = yesBg;
        ctx.fillRect(yesX, btnY, btnW, btnH);
        ctx.strokeStyle = yesBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(yesX, btnY, btnW, btnH);
        ctx.font = 'bold 15px serif';
        ctx.fillStyle = this.portalConfirmYesHovered ? '#ffd700' : '#c8b84a';
        ctx.textBaseline = 'middle';
        ctx.fillText('ENTER REALM', yesX + btnW / 2, btnY + btnH / 2);

        // STAY button - darker muted red-brown
        const noBg = this.portalConfirmNoHovered ? '#3a1a0f' : '#251208';
        const noBorder = this.portalConfirmNoHovered ? '#cc7744' : '#6a3a20';
        ctx.fillStyle = noBg;
        ctx.fillRect(noX, btnY, btnW, btnH);
        ctx.strokeStyle = noBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(noX, btnY, btnW, btnH);
        ctx.fillStyle = this.portalConfirmNoHovered ? '#cc9966' : '#8b6040';
        ctx.font = 'bold 15px serif';
        ctx.fillText('STAY', noX + btnW / 2, btnY + btnH / 2);

        // Store button bounds for click handling
        this._portalConfirmBounds = { yesX, noX, btnY, btnW, btnH };
    }

    renderGoldDisplay(ctx, x, y) {
        // Draw treasure chest with half-opened lid
        const chestWidth = 35;
        const chestHeight = 25;
        
        // Chest body - main brown color
        ctx.fillStyle = '#8b6f47';
        ctx.fillRect(x, y + 8, chestWidth, chestHeight - 8);
        
        // Chest front face - darker for 3D effect
        ctx.fillStyle = '#6b5a47';
        ctx.fillRect(x, y + 8, chestWidth, 3);
        
        // Chest sides shadow
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(x - 2, y + 8, 2, chestHeight - 8);
        ctx.fillRect(x + chestWidth, y + 8, 2, chestHeight - 8);
        
        // Chest bottom rim
        ctx.fillStyle = '#5a4a37';
        ctx.fillRect(x, y + chestHeight, chestWidth, 2);
        
        // Metal bands on chest
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(x - 2, y + 12, chestWidth + 4, 2);
        ctx.fillRect(x - 2, y + 20, chestWidth + 4, 1);
        
        // Chest lid - half open
        const lidWidth = chestWidth;
        const lidHeight = 8;
        const lidAngle = Math.PI / 6; // 30 degrees open
        
        ctx.save();
        ctx.translate(x, y + 8);
        ctx.rotate(-lidAngle);
        
        // Lid body
        ctx.fillStyle = '#8b6f47';
        ctx.fillRect(0, -lidHeight, lidWidth, lidHeight);
        
        // Lid front edge highlight
        ctx.fillStyle = '#a68f67';
        ctx.fillRect(0, -lidHeight, lidWidth, 2);
        
        // Lid metal hinge
        ctx.fillStyle = '#c4af37';
        ctx.fillRect(0, -2, 4, 4);
        ctx.fillRect(lidWidth - 4, -2, 4, 4);
        
        ctx.restore();
        
        // Gold coins visible inside chest
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.ellipse(x + chestWidth * 0.25, y + 15, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffed4e';
        ctx.beginPath();
        ctx.ellipse(x + chestWidth * 0.5, y + 18, 3, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.ellipse(x + chestWidth * 0.75, y + 16, 3.5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Spilled gold coins around chest
        ctx.fillStyle = '#ffed4e';
        ctx.beginPath();
        ctx.ellipse(x + chestWidth + 6, y + 18, 2.5, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.ellipse(x + chestWidth + 10, y + 20, 2, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Gold amount text next to chest - ENHANCED STYLING
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#ffed4e';  // Brighter gold
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const goldTextX = x + chestWidth + 18;
        const goldTextY = y + 14;
        
        // Add subtle glow/shadow effect
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillText(this.playerGold + ' Gold', goldTextX, goldTextY);
        ctx.shadowColor = 'transparent';
        
        // Store position for gold effect target
        this.goldDisplayX = goldTextX + 20;
        this.goldDisplayY = goldTextY;
    }

    renderTabContent(ctx, panelX, contentY, panelWidth, contentHeight) {
        const items = this.getItemsForCurrentPage();
        
        // Better spacing calculations for 3-column layout
        const horizontalPadding = 20;
        const verticalPadding = 15;
        const gridSpacing = 12;
        
        const availableWidth = panelWidth - (horizontalPadding * 2);
        const availableHeight = contentHeight - (verticalPadding * 2);
        
        const itemWidth = (availableWidth - (gridSpacing * 2)) / 3;
        const itemHeight = (availableHeight - gridSpacing) / 2;
        
        const itemsGridStartX = panelX + horizontalPadding;
        const itemsGridStartY = contentY + verticalPadding;
        
        items.forEach((item, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            const itemX = itemsGridStartX + col * (itemWidth + gridSpacing);
            const itemY = itemsGridStartY + row * (itemHeight + gridSpacing);
            
            this.renderItemTile(ctx, itemX, itemY, itemWidth, itemHeight, item);
        });
    }

    renderItemTile(ctx, x, y, width, height, item) {
        // Handle upgrade tiles differently with new layout
        if (item.type === 'upgrade') {
            return this.renderUpgradeTile(ctx, x, y, width, height, item);
        }
        
        // Standard rendering for marketplace items and loot - NEW LAYOUT: scrollable desc at top, effects at bottom
        const canBuy = this.activeTab === 'buy' && item.canPurchase;
        const isDisabled = this.activeTab === 'buy' && !item.canPurchase;
        ctx.fillStyle = item.hovered && !isDisabled ? '#6b5a47' : '#3a2a1a';
        ctx.fillRect(x, y, width, height);
        
        // Top highlight
        ctx.fillStyle = item.hovered && !isDisabled ? '#8b7a67' : '#4a3a2a';
        ctx.fillRect(x, y, width, 2);
        
        // Border (color by rarity if sell tab, disabled if can't buy)
        let borderColor = item.hovered && !isDisabled ? '#ffd700' : '#5a4a3a';
        if (isDisabled) {
            borderColor = '#5a4a4a'; // Gray for disabled items
        } else if (this.activeTab === 'sell' && item.rarity) {
            const rarityColors = {
                'common': '#C9A961',
                'uncommon': '#4FC3F7',
                'rare': '#AB47BC',
                'epic': '#FF6F00',
                'legendary': '#FFD700'
            };
            borderColor = item.hovered ? rarityColors[item.rarity] : '#5a4a3a';
        }
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = item.hovered && !isDisabled ? 3 : 2;
        ctx.strokeRect(x, y, width, height);
        
        // Extra glow for legendary items
        if (this.activeTab === 'sell' && item.rarity === 'legendary') {
            ctx.strokeStyle = '#FFD700';
            ctx.globalAlpha = 0.3;
            ctx.lineWidth = 1;
            ctx.strokeRect(x - 3, y - 3, width + 6, height + 6);
            ctx.globalAlpha = 1;
        }
        
        // Determine icon size and name font based on tab
        const isSellTab = this.activeTab === 'sell';
        const iconSize = isSellTab ? 42 : 36;
        const nameFontSize = isSellTab ? 18 : 17;
        
        // Icon
        if (typeof item.drawIcon === 'function') {
            item.drawIcon(ctx, x + width / 2, y + 6 + iconSize * 0.5, iconSize);
        } else if (item.icon) {
            ctx.font = `bold ${iconSize}px Arial`;
            ctx.fillStyle = isDisabled ? '#707070' : borderColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(item.icon, x + width / 2, y + 6);
        }
        
        // Count badge (sell tab only) - shown in top-right corner of tile
        if (isSellTab && item.count > 1) {
            const badgeText = '\u00d7' + item.count;
            ctx.font = 'bold 10px Arial';
            const badgeW = ctx.measureText(badgeText).width + 8;
            const badgeH = 14;
            const badgeX = x + width - badgeW - 4;
            const badgeY = y + 4;
            // Badge background
            ctx.fillStyle = item.rarity === 'rare' || item.rarity === 'epic' || item.rarity === 'legendary'
                ? 'rgba(40, 20, 60, 0.9)' : 'rgba(20, 15, 10, 0.9)';
            ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);
            // Badge text
            ctx.fillStyle = '#ffd700';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2);
        }
        
        // Item name
        ctx.font = `bold ${nameFontSize}px Arial`;
        ctx.fillStyle = isDisabled ? '#8a8a8a' : '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        const nameY = y + (isSellTab ? 57 : 48);
        const nameMaxWidth = width - 10;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, nameY, width, 38);
        ctx.clip();
        const nameLines = this.wrapNameToLines(ctx, item.name, nameMaxWidth, 2);
        nameLines.forEach((line, i) => ctx.fillText(line, x + width / 2, nameY + i * 18));
        ctx.restore();
        
        // ===== SCROLLABLE DESCRIPTION BOX AT TOP (SMALLER, FIXED HEIGHT) =====
        const descBoxStartY = nameY + 45;
        const descBoxHeight = 75; // Fixed smaller size for scrollable textbox
        const textPadding = 4;
        
        // Description box background
        ctx.fillStyle = '#2a2010';
        ctx.fillRect(x + 4, descBoxStartY, width - 8, descBoxHeight);
        
        // Description box border
        ctx.strokeStyle = item.hovered && !isDisabled ? '#8b7355' : '#6a5a4a';
        ctx.lineWidth = item.hovered && !isDisabled ? 2 : 1;
        ctx.strokeRect(x + 4, descBoxStartY, width - 8, descBoxHeight);
        
        // Initialize scroll state if not exists
        if (!this.scrollableTiles.has(item.id)) {
            this.scrollableTiles.set(item.id, { scrollOffset: 0, maxScroll: 0 });
        }
        
        const scrollState = this.scrollableTiles.get(item.id);

        // Wrap description text (measured against the actual draw font, with the
        // scrollbar's width always reserved so wrapping never depends on whether
        // the scrollbar ends up showing)
        ctx.font = '11px Arial';
        const descAvailWidth = width - 19;
        const lines = this.wrapTextToWidth(ctx, item.description, descAvailWidth);
        const lineHeight = UPGRADE_DESC_LINE_HEIGHT;

        // Calculate max scroll
        const maxVisibleLines = Math.floor((descBoxHeight - (textPadding * 2)) / lineHeight) - 1;
        scrollState.maxScroll = Math.max(0, lines.length - maxVisibleLines);

        // Render visible portion of description text with clip
        ctx.save();
        ctx.beginPath();
        // Reserve space on the right for scroll bar
        const scrollBarWidth = scrollState.maxScroll > 0 ? 6 : 0;
        ctx.rect(x + 5, descBoxStartY + 2, width - 10 - scrollBarWidth, descBoxHeight - 4);
        ctx.clip();

        ctx.font = '11px Arial';
        ctx.fillStyle = isDisabled ? '#9a9a9a' : '#c9a961';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const startLine = Math.min(scrollState.scrollOffset, scrollState.maxScroll);
        const textX = x + 8;
        const textStartY = descBoxStartY + textPadding - (startLine * lineHeight);

        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], textX, textStartY + (i * lineHeight));
        }

        ctx.restore();

        // Draw scroll bar if there's scrollable content
        if (scrollState.maxScroll > 0) {
            const scrollBarX = x + width - 8;
            const scrollBarY = descBoxStartY + 2;
            const scrollBarHeight = descBoxHeight - 4;

            // Background of scroll bar track
            ctx.fillStyle = '#1a1010';
            ctx.fillRect(scrollBarX, scrollBarY, 4, scrollBarHeight);

            // Calculate scroll thumb position and size
            const thumbHeight = Math.max(8, (maxVisibleLines / lines.length) * (scrollBarHeight - 2));
            const thumbY = scrollBarY + 1 + (scrollState.scrollOffset / scrollState.maxScroll) * (scrollBarHeight - thumbHeight - 2);

            // Draw scroll thumb
            ctx.fillStyle = scrollState.maxScroll > 0 ? '#8b7355' : '#5a4a3a';
            ctx.fillRect(scrollBarX + 0.5, thumbY, 3, thumbHeight);
        }

        // ===== EFFECTS SECTION AT BOTTOM (BEFORE BUTTON) =====
        const effectBoxStartY = descBoxStartY + descBoxHeight + 2;
        const buttonTopY = y + height - 47;
        const effectBoxHeight = buttonTopY - effectBoxStartY;

        // Effects header/content
        if (item.effect && effectBoxHeight > 0) {
            // Effect text with bullet points - clipped to tile bounds
            ctx.save();
            ctx.beginPath();
            ctx.rect(x + 4, effectBoxStartY, width - 8, effectBoxHeight);
            ctx.clip();

            ctx.font = 'bold 15px Arial';
            ctx.fillStyle = '#FFD700';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            // Split effect by newlines first, then wrap each line if needed
            // Each newline-separated sentence gets ONE bullet; wrapped continuations are indented
            const rawEffectLines = item.effect.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            const effectLines = []; // Each entry: { text, isBullet }
            const effectPrefixWidth = ctx.measureText('• ').width;
            const effectAvailWidth = (width - 12) - effectPrefixWidth;

            for (const rawLine of rawEffectLines) {
                const wrappedLines = this.wrapTextToWidth(ctx, rawLine, effectAvailWidth);
                for (let wi = 0; wi < wrappedLines.length; wi++) {
                    effectLines.push({ text: wrappedLines[wi], isBullet: wi === 0 });
                }
            }

            const effectLineHeight = 18;
            const maxEffectLines = Math.max(1, Math.floor(effectBoxHeight / effectLineHeight));
            const effectTextStartY = effectBoxStartY + 2;
            for (let i = 0; i < Math.min(effectLines.length, maxEffectLines); i++) {
                const entry = effectLines[i];
                const bulletText = entry.isBullet ? ('\u2022 ' + entry.text) : ('  ' + entry.text);
                ctx.fillText(bulletText, x + 8, effectTextStartY + (i * effectLineHeight));
            }
            
            ctx.restore();
        }
        
        // Disabled overlay - no message shown here, it will appear as floating text
        if (isDisabled) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(x, y, width, height);
        }
        
        // Action button
        const buttonWidth = width - 14;
        const buttonHeight = 36;
        const buttonX = x + 7;
        const buttonY = y + height - 47;
        
        // Sell tab uses a slightly different button color scheme (amber-green) to indicate receiving gold
        const isSellButton = this.activeTab === 'sell';

        // Realm shard items get special COMBINE / OPEN buttons
        if (isSellButton && item.isRealmShard) {
            if (item.shardType === 'portal') {
                // OPEN button - gold/magical
                const btnActive = !isDisabled;
                ctx.fillStyle = item.hovered && btnActive ? '#7a4a00' : '#4a2a00';
                ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
                ctx.strokeStyle = item.hovered && btnActive ? '#FFD700' : '#AA8800';
                ctx.lineWidth = item.hovered && btnActive ? 2 : 1;
                ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
                const buttonCenterY = buttonY + buttonHeight / 2;
                ctx.font = 'bold 15px Arial';
                ctx.fillStyle = item.hovered && btnActive ? '#FFD700' : '#CC9900';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('OPEN PORTAL', buttonX + buttonWidth / 2, buttonCenterY);
            } else {
                // COMBINE button - cyan/teal, only active if combineEnabled
                const btnActive = item.combineEnabled && !isDisabled;
                ctx.fillStyle = btnActive ? (item.hovered ? '#006655' : '#004433') : '#2a2a2a';
                ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
                ctx.strokeStyle = btnActive ? (item.hovered ? '#00FFCC' : '#00AA88') : '#444444';
                ctx.lineWidth = item.hovered && btnActive ? 2 : 1;
                ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
                const buttonCenterY = buttonY + buttonHeight / 2;
                ctx.font = 'bold 14px Arial';
                ctx.fillStyle = btnActive ? (item.hovered ? '#00FFCC' : '#00CC99') : '#666666';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(item.combineEnabled ? 'COMBINE' : 'COMBINE', buttonX + buttonWidth / 2, buttonCenterY);
                if (!item.combineEnabled) {
                    ctx.font = '10px Arial';
                    ctx.fillStyle = '#888888';
                    ctx.fillText('(need both halves)', buttonX + buttonWidth / 2, buttonCenterY + 14);
                }
            }
            return;
        }

        ctx.fillStyle = isDisabled ? '#4a4a4a' : (item.hovered ? (isSellButton ? '#4a6b3a' : '#8b6f47') : (isSellButton ? '#2a4a1e' : '#5a4a3a'));
        ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        // Top highlight
        ctx.fillStyle = isDisabled ? '#5a5a5a' : (item.hovered ? (isSellButton ? '#5a7b4a' : '#9b7f57') : (isSellButton ? '#3a5a2e' : '#6a5a4a'));
        ctx.fillRect(buttonX, buttonY, buttonWidth, 1);
        
        ctx.strokeStyle = isDisabled ? '#5a5a5a' : (item.hovered ? '#ffd700' : (isSellButton ? '#6a9a4a' : '#8b7355'));
        ctx.lineWidth = isDisabled ? 1 : (item.hovered ? 2 : 1);
        ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        // For buy tab, show coin icon + price
        // For sell tab, show SELL label + coin icon + price
        let displayPrice = 0;
        if (this.activeTab === 'buy') {
            displayPrice = item.cost;
        } else if (this.activeTab === 'sell') {
            displayPrice = item.sellPrice;
        }
        
        const buttonCenterY = buttonY + buttonHeight / 2;
        const coinRadius = 8;
        
        if (isSellButton) {
            // Sell button: "SELL" label on left, coin+price right-aligned on right
            const labelColor = isDisabled ? '#8a8a8a' : (item.hovered ? '#ffd700' : '#a0cc80');
            const priceColor = isDisabled ? '#8a8a8a' : (item.hovered ? '#ffd700' : '#d4af37');
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = labelColor;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText('SELL', buttonX + 6, buttonCenterY);
            // Coin + price: right-aligned so any digit count fits within button bounds
            const priceText = displayPrice.toString();
            const priceWidth = ctx.measureText(priceText).width;
            const groupRight = buttonX + buttonWidth - 5;
            const coinX = groupRight - priceWidth - 5 - coinRadius;
            this.renderCoinIconInline(ctx, coinX, buttonCenterY, coinRadius, priceColor);
            ctx.fillStyle = priceColor;
            ctx.textAlign = 'right';
            ctx.fillText(priceText, groupRight, buttonCenterY);
        } else {
            // Buy button: coin icon + price centered
            ctx.font = 'bold 19px Arial';
            ctx.fillStyle = isDisabled ? '#8a8a8a' : (item.hovered ? '#ffd700' : '#d4af37');
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            const coinX = buttonX + buttonWidth / 2 - 17;
            const priceTextX = buttonX + buttonWidth / 2 + 2;
            this.renderCoinIconInline(ctx, coinX, buttonCenterY, coinRadius,
                                      isDisabled ? '#8a8a8a' : (item.hovered ? '#ffd700' : '#d4af37'));
            ctx.textAlign = 'left';
            ctx.fillText(displayPrice.toString(), priceTextX, buttonCenterY);
        }
    }

    renderCoinIconInline(ctx, x, y, radius, color) {
        // Draw a small coin icon (circle with shine)
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add shine effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(x - 1, y - 1, radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    renderUpgradeTile(ctx, x, y, width, height, item) {
        // Render upgrades in the SAME LAYOUT as marketplace items for consistency
        const isDisabled = !item.canPurchase;
        ctx.fillStyle = item.hovered && !isDisabled ? '#6b5a47' : '#3a2a1a';
        ctx.fillRect(x, y, width, height);
        
        // Top highlight
        ctx.fillStyle = item.hovered && !isDisabled ? '#8b7a67' : '#4a3a2a';
        ctx.fillRect(x, y, width, 2);
        
        // Border
        let borderColor = item.hovered && !isDisabled ? '#ffd700' : '#5a4a3a';
        if (isDisabled) {
            borderColor = '#5a4a4a';
        }
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = item.hovered && !isDisabled ? 3 : 2;
        ctx.strokeRect(x, y, width, height);
        
        // Icon - PROMINENT at top
        const iconSize = 42;
        if (typeof item.drawIcon === 'function') {
            item.drawIcon(ctx, x + width / 2, y + 6 + iconSize * 0.5, iconSize);
        } else if (item.icon) {
            ctx.font = `bold ${iconSize}px Arial`;
            ctx.fillStyle = isDisabled ? '#707070' : '#ffd700';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(item.icon, x + width / 2, y + 6);
        }
        
        // Item name - centered below icon
        ctx.font = 'bold 17px Arial';
        ctx.fillStyle = isDisabled ? '#8a8a8a' : '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        const nameY = y + 57;
        const nameMaxWidth = width - 10;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, nameY, width, 38);
        ctx.clip();
        const nameLines = this.wrapNameToLines(ctx, item.name, nameMaxWidth, 2);
        nameLines.forEach((line, i) => ctx.fillText(line, x + width / 2, nameY + i * 18));
        ctx.restore();
        
        // ===== SCROLLABLE DESCRIPTION BOX =====
        const descBoxStartY = nameY + 45;
        const descBoxHeight = 75;
        const textPadding = 4;
        
        // Description box background
        ctx.fillStyle = '#2a2010';
        ctx.fillRect(x + 4, descBoxStartY, width - 8, descBoxHeight);
        
        // Description box border
        ctx.strokeStyle = item.hovered && !isDisabled ? '#8b7355' : '#6a5a4a';
        ctx.lineWidth = item.hovered && !isDisabled ? 2 : 1;
        ctx.strokeRect(x + 4, descBoxStartY, width - 8, descBoxHeight);
        
        // Initialize scroll state if not exists
        if (!this.scrollableTiles.has(item.id)) {
            this.scrollableTiles.set(item.id, { scrollOffset: 0, maxScroll: 0 });
        }
        
        const scrollState = this.scrollableTiles.get(item.id);

        // Wrap description text (measured against the actual draw font, with the
        // scrollbar's width always reserved so wrapping never depends on whether
        // the scrollbar ends up showing)
        ctx.font = '11px Arial';
        const descAvailWidth = width - 19;
        const lines = this.wrapTextToWidth(ctx, item.description, descAvailWidth);
        const lineHeight = UPGRADE_DESC_LINE_HEIGHT;

        // Calculate max scroll
        const maxVisibleLines = Math.floor((descBoxHeight - (textPadding * 2)) / lineHeight) - 1;
        scrollState.maxScroll = Math.max(0, lines.length - maxVisibleLines);

        // Render visible portion of description text with clip
        ctx.save();
        ctx.beginPath();
        // Reserve space on the right for scroll bar
        const scrollBarWidth = scrollState.maxScroll > 0 ? 6 : 0;
        ctx.rect(x + 5, descBoxStartY + 2, width - 10 - scrollBarWidth, descBoxHeight - 4);
        ctx.clip();

        ctx.font = '11px Arial';
        ctx.fillStyle = isDisabled ? '#9a9a9a' : '#c9a961';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const startLine = Math.min(scrollState.scrollOffset, scrollState.maxScroll);
        const textX = x + 8;
        const textStartY = descBoxStartY + textPadding - (startLine * lineHeight);

        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], textX, textStartY + (i * lineHeight));
        }

        ctx.restore();
        
        // Draw scroll bar if there's scrollable content
        if (scrollState.maxScroll > 0) {
            const scrollBarX = x + width - 8;
            const scrollBarY = descBoxStartY + 2;
            const scrollBarHeight = descBoxHeight - 4;
            
            // Background of scroll bar track
            ctx.fillStyle = '#1a1010';
            ctx.fillRect(scrollBarX, scrollBarY, 4, scrollBarHeight);
            
            // Calculate scroll thumb position and size
            const thumbHeight = Math.max(8, (maxVisibleLines / lines.length) * (scrollBarHeight - 2));
            const thumbY = scrollBarY + 1 + (scrollState.scrollOffset / scrollState.maxScroll) * (scrollBarHeight - thumbHeight - 2);
            
            // Draw scroll thumb
            ctx.fillStyle = scrollState.maxScroll > 0 ? '#8b7355' : '#5a4a3a';
            ctx.fillRect(scrollBarX + 0.5, thumbY, 3, thumbHeight);
        }
        
        // ===== EFFECTS SECTION AT BOTTOM =====
        const effectBoxStartY = descBoxStartY + descBoxHeight + 2;
        const buttonTopY = y + height - 47;
        const effectBoxHeight = buttonTopY - effectBoxStartY;

        // Effects header/content
        if (item.effect && effectBoxHeight > 0) {
            // Effect text with bullet points - clipped to tile bounds
            ctx.save();
            ctx.beginPath();
            ctx.rect(x + 4, effectBoxStartY, width - 8, effectBoxHeight);
            ctx.clip();

            ctx.font = 'bold 15px Arial';
            ctx.fillStyle = '#FFD700';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            // Split effect by newlines first, then wrap each line if needed
            // Each newline-separated sentence gets ONE bullet; wrapped continuations are indented
            const rawEffectLines = item.effect.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            const effectLines = []; // Each entry: { text, isBullet }
            const effectPrefixWidth = ctx.measureText('• ').width;
            const effectAvailWidth = (width - 12) - effectPrefixWidth;

            for (const rawLine of rawEffectLines) {
                const wrappedLines = this.wrapTextToWidth(ctx, rawLine, effectAvailWidth);
                for (let wi = 0; wi < wrappedLines.length; wi++) {
                    effectLines.push({ text: wrappedLines[wi], isBullet: wi === 0 });
                }
            }

            const effectLineHeight = 18;
            const maxEffectLines = Math.max(1, Math.floor(effectBoxHeight / effectLineHeight));
            const effectTextStartY = effectBoxStartY + 2;
            for (let i = 0; i < Math.min(effectLines.length, maxEffectLines); i++) {
                const entry = effectLines[i];
                const bulletText = entry.isBullet ? ('• ' + entry.text) : ('  ' + entry.text);
                ctx.fillText(bulletText, x + 8, effectTextStartY + (i * effectLineHeight));
            }

            ctx.restore();
        }
        
        // Disabled overlay and message
        if (isDisabled) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(x, y, width, height);
            
            ctx.font = '8px Arial';
            ctx.fillStyle = '#ffaa00';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const displayMsg = item.requirementMsg || 'Not Available';
            const msgLines = this.wrapNameToLines(ctx, displayMsg, width - 10, 2);
            const msgBaseY = y + height - 18 - (msgLines.length - 1) * 9;
            msgLines.forEach((line, i) => ctx.fillText(line, x + width / 2, msgBaseY + i * 9));
        }
        
        // Action button
        const buttonWidth = width - 14;
        const buttonHeight = 36;
        const buttonX = x + 7;
        const buttonY = y + height - 47;
        
        // Button beveled effect
        ctx.fillStyle = isDisabled ? '#4a4a4a' : (item.hovered ? '#8b6f47' : '#5a4a3a');
        ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        // Top highlight
        ctx.fillStyle = isDisabled ? '#5a5a5a' : (item.hovered ? '#9b7f57' : '#6a5a4a');
        ctx.fillRect(buttonX, buttonY, buttonWidth, 1);
        
        ctx.strokeStyle = isDisabled ? '#5a5a5a' : (item.hovered ? '#ffd700' : '#8b7355');
        ctx.lineWidth = isDisabled ? 1 : (item.hovered ? 2 : 1);
        ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        // Render coin icon and price
        ctx.font = 'bold 19px Arial';
        ctx.fillStyle = isDisabled ? '#8a8a8a' : (item.hovered ? '#ffd700' : '#d4af37');
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        
        // Draw coin icon and price text
        const buttonCenterY = buttonY + buttonHeight / 2;
        const coinRadius = 8;
        const coinX = buttonX + buttonWidth / 2 - 17;
        const priceTextX = buttonX + buttonWidth / 2 + 2;
        this.renderCoinIconInline(ctx, coinX, buttonCenterY, coinRadius, 
                                  isDisabled ? '#8a8a8a' : (item.hovered ? '#ffd700' : '#d4af37'));
        ctx.textAlign = 'left';
        ctx.fillText(item.cost.toString(), priceTextX, buttonCenterY);
    }

    renderPaginationControls(ctx, panelX, y, panelWidth) {
        const arrowSize = 38;
        const leftArrowX = panelX + 20;
        const rightArrowX = panelX + panelWidth - 57;
        const maxPages = this.getMaxPages();
        
        // Left arrow with beveled effect
        ctx.fillStyle = this.leftArrowHovered ? '#8b6f47' : '#5a4a3a';
        ctx.fillRect(leftArrowX, y, arrowSize, arrowSize);
        
        // Top highlight
        ctx.fillStyle = this.leftArrowHovered ? '#9b7f57' : '#6a5a4a';
        ctx.fillRect(leftArrowX, y, arrowSize, 1);
        
        ctx.strokeStyle = this.leftArrowHovered ? '#ffd700' : '#5a4a3a';
        ctx.lineWidth = 2;
        ctx.strokeRect(leftArrowX, y, arrowSize, arrowSize);
        
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = this.leftArrowHovered ? '#ffd700' : '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('◀', leftArrowX + arrowSize / 2, y + arrowSize / 2);
        
        // Right arrow
        ctx.fillStyle = this.rightArrowHovered ? '#8b6f47' : '#5a4a3a';
        ctx.fillRect(rightArrowX, y, arrowSize, arrowSize);
        
        // Top highlight
        ctx.fillStyle = this.rightArrowHovered ? '#9b7f57' : '#6a5a4a';
        ctx.fillRect(rightArrowX, y, arrowSize, 1);
        
        ctx.strokeStyle = this.rightArrowHovered ? '#ffd700' : '#5a4a3a';
        ctx.lineWidth = 2;
        ctx.strokeRect(rightArrowX, y, arrowSize, arrowSize);
        
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = this.rightArrowHovered ? '#ffd700' : '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('▶', rightArrowX + arrowSize / 2, y + arrowSize / 2);
        
        // Page indicator
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Page ${this.currentPage + 1} / ${maxPages}`, ctx.canvas.width / 2, y + arrowSize / 2);
    }
}

