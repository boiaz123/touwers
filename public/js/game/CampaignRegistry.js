/**
 * CampaignRegistry
 * Central registry for all campaigns.
 * Each campaign is a class that extends CampaignBase.
 * Easy to expand - just import new campaign classes and add to campaigns object.
 *
 * Campaign progression order:
 *   campaign-1 (Verdant Woodlands)  → campaign-2 (Ironstone Mountains)
 *   campaign-2                      → campaign-3 (Scorching Sands)
 *   campaign-3                      → campaign-4 (Frog King's Domain)
 *   campaign-5 (Testing)            — always unlocked
 */
export class CampaignRegistry {
    static campaigns = {};
    static campaignClasses = {};

    /** Maps each campaign to the one it unlocks on completion */
    static UNLOCK_CHAIN = {
        'campaign-1': 'campaign-2',
        'campaign-2': 'campaign-3',
        'campaign-3': 'campaign-4',
        'campaign-4': null
    };

    /**
     * Initialize the registry with campaign classes
     */
    static initialize(campaignClasses) {
        this.campaignClasses = campaignClasses;

        // Build campaigns metadata from classes
        this.campaigns = {
            'campaign-1': {
                id: 'campaign-1',
                name: 'The Verdant Woodlands',
                description: 'Defend the ancient woodland realm from an encroaching darkness.',
                icon: '▲',                levelCount: 12,
                drawIcon(ctx, x, y, size) {
                    const s = size * 0.42;
                    // Trunk
                    const tg = ctx.createLinearGradient(x - s*0.1, y + s*0.2, x + s*0.1, y + s*0.75);
                    tg.addColorStop(0, '#6D4C41'); tg.addColorStop(1, '#3E2723');
                    ctx.fillStyle = tg;
                    ctx.fillRect(x - s*0.1, y + s*0.18, s*0.2, s*0.55);
                    ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = 0.8;
                    ctx.strokeRect(x - s*0.1, y + s*0.18, s*0.2, s*0.55);
                    // Three layered triangular canopy tiers
                    const tiers = [
                        { w: s*0.96, base: y + s*0.22, h: s*0.52, c1: '#1B5E20', c2: '#388E3C' },
                        { w: s*0.72, base: y - s*0.08, h: s*0.46, c1: '#2E7D32', c2: '#43A047' },
                        { w: s*0.48, base: y - s*0.32, h: s*0.40, c1: '#388E3C', c2: '#66BB6A' }
                    ];
                    tiers.forEach(tier => {
                        const tg2 = ctx.createLinearGradient(x - tier.w/2, tier.base - tier.h, x + tier.w/2, tier.base);
                        tg2.addColorStop(0, tier.c2); tg2.addColorStop(1, tier.c1);
                        ctx.fillStyle = tg2;
                        ctx.beginPath();
                        ctx.moveTo(x, tier.base - tier.h);
                        ctx.lineTo(x + tier.w/2, tier.base);
                        ctx.lineTo(x - tier.w/2, tier.base);
                        ctx.closePath();
                        ctx.fill();
                        ctx.strokeStyle = '#1a3e1a'; ctx.lineWidth = 0.8; ctx.stroke();
                    });
                },                difficulty: 'Apprentice',
                class: campaignClasses.Campaign1,
                rewards: {
                    gold: 5000,
                    unlocks: ['Magic Academy Plans']
                },
                unlockText: null,
                story: 'Strange creatures have emerged from the depths of the ancient forest — twisted frog-like beings that march with an unnerving purpose. No one knows where they come from or why they suddenly attack. You take up arms to defend the woodland realm, but questions plague your mind... What are these creatures? Why do they feel so unnatural? The answers must lie deeper within the mystery that surrounds your world.',
                completionStory: 'The woodland realm is saved! As the last foe falls, you discover a clue: these creatures are not merely beasts. They are soldiers, and someone — or something — commands them from afar. The path forward leads into the mountains... where the answers surely lie.',
                lootStyle: { normalChance: 0.10, rareChance: 0.0 },
                progress: 0,
                locked: false
            },
            'campaign-2': {
                id: 'campaign-2',
                name: 'The Ironstone Mountains',
                description: 'Brave the treacherous peaks to pursue the enemy to the desert beyond.',
                icon: '▲',                levelCount: 12,
                drawIcon(ctx, x, y, size) {
                    const s = size * 0.42;
                    // Background mountain
                    const bg = ctx.createLinearGradient(x + s*0.4, y - s*0.15, x + s*0.4, y + s*0.6);
                    bg.addColorStop(0, '#78909C'); bg.addColorStop(1, '#455A64');
                    ctx.fillStyle = bg;
                    ctx.beginPath();
                    ctx.moveTo(x + s*0.35, y + s*0.6);
                    ctx.lineTo(x + s*0.9, y + s*0.6);
                    ctx.lineTo(x + s*0.62, y - s*0.12);
                    ctx.closePath(); ctx.fill();
                    ctx.strokeStyle = '#263238'; ctx.lineWidth = 0.8; ctx.stroke();
                    // Main peak
                    const mg = ctx.createLinearGradient(x, y - s*0.78, x, y + s*0.6);
                    mg.addColorStop(0, '#CFD8DC'); mg.addColorStop(0.28, '#90A4AE');
                    mg.addColorStop(1, '#546E7A');
                    ctx.fillStyle = mg;
                    ctx.beginPath();
                    ctx.moveTo(x - s*0.82, y + s*0.6);
                    ctx.lineTo(x + s*0.82, y + s*0.6);
                    ctx.lineTo(x, y - s*0.78);
                    ctx.closePath(); ctx.fill();
                    ctx.strokeStyle = '#263238'; ctx.lineWidth = 1; ctx.stroke();
                    // Snow cap
                    ctx.fillStyle = '#ECEFF1';
                    ctx.beginPath();
                    ctx.moveTo(x, y - s*0.78);
                    ctx.lineTo(x + s*0.28, y - s*0.35);
                    ctx.lineTo(x - s*0.28, y - s*0.35);
                    ctx.closePath(); ctx.fill();
                    ctx.strokeStyle = '#B0BEC5'; ctx.lineWidth = 0.8; ctx.stroke();
                },                difficulty: 'Warrior',
                class: campaignClasses.Campaign2,
                rewards: {
                    gold: 7500,
                    unlocks: ['Super Weapon Lab Plans', 'Strange Talisman']
                },
                unlockText: 'Complete The Verdant Woodlands',
                story: 'The woodland triumph reveals a disturbing truth: these creatures are coordinated and purposeful. An ancient prophecy speaks of an artifact hidden in the desert that holds the key to understanding — and defeating — these magical beings. But the desert lies beyond the treacherous peaks. You must brave the high passes, survive the bitter cold, and press through to where answers await.',
                completionStory: 'The mountain passes are yours! Through the thinning air and falling snow you found proof — the frog creatures carry sigils, all bearing the same mark. Someone on the other side of the desert is pulling the strings. You descend toward the dunes, closer than ever to the truth.',
                lootStyle: { normalChance: 0.10, rareChance: 0.025 },
                progress: 0,
                locked: true
            },
            'campaign-3': {
                id: 'campaign-3',
                name: 'The Scorching Sands',
                description: 'Uncover the ancient artifact that holds the secret of the enemy.',
                icon: '▼',                levelCount: 10,
                drawIcon(ctx, x, y, size) {
                    const s = size * 0.36;
                    // Outer glow
                    const glow = ctx.createRadialGradient(x, y, 0, x, y, s * 1.6);
                    glow.addColorStop(0, 'rgba(255,200,50,0.35)'); glow.addColorStop(1, 'rgba(255,100,0,0)');
                    ctx.fillStyle = glow;
                    ctx.beginPath(); ctx.arc(x, y, s * 1.6, 0, Math.PI * 2); ctx.fill();
                    // Rays
                    ctx.lineCap = 'round';
                    for (let i = 0; i < 8; i++) {
                        const a = (i / 8) * Math.PI * 2 - Math.PI * 0.5;
                        const rg = ctx.createLinearGradient(
                            x + Math.cos(a)*s*1.05, y + Math.sin(a)*s*1.05,
                            x + Math.cos(a)*s*1.75, y + Math.sin(a)*s*1.75
                        );
                        rg.addColorStop(0, '#FFB300'); rg.addColorStop(1, 'rgba(255,140,0,0)');
                        ctx.strokeStyle = rg; ctx.lineWidth = s * 0.14;
                        ctx.beginPath();
                        ctx.moveTo(x + Math.cos(a)*s*1.08, y + Math.sin(a)*s*1.08);
                        ctx.lineTo(x + Math.cos(a)*s*1.72, y + Math.sin(a)*s*1.72);
                        ctx.stroke();
                    }
                    // Sun core
                    const sg = ctx.createRadialGradient(x - s*0.22, y - s*0.22, 0, x, y, s);
                    sg.addColorStop(0, '#FFF9C4'); sg.addColorStop(0.35, '#FFD740');
                    sg.addColorStop(0.72, '#FF8F00'); sg.addColorStop(1, '#E65100');
                    ctx.fillStyle = sg;
                    ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = '#BF360C'; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.stroke();
                },                difficulty: 'Champion',
                class: campaignClasses.Campaign3,
                rewards: {
                    gold: 10000,
                    unlocks: ['Ancient Relics']
                },
                unlockText: 'Complete The Ironstone Mountains',
                story: 'The desert stretches endlessly before you, shimmering with heat. The frog creatures here are infused with elemental power — fire, sand, and ancient stone. They guard their secrets fiercely. Finally, buried beneath the dunes, you find it: a radiant crystal that pulses with otherworldly energy. Its inscriptions reveal a shocking truth. These magical frogs are not from your world — they are from another realm entirely, and their king commands them all.',
                completionStory: 'The artifact pulses in your hands — a key to another world. The inscriptions are clear: there exists a rift, a passage to the Frog King\'s own domain. Your allies urge caution, but you know the only path to peace is through the king\'s court itself. Onward, to what lies beyond the veil of reality.',
                lootStyle: { normalChance: 0.15, rareChance: 0.04 },
                progress: 0,
                locked: true
            },
            'campaign-4': {
                id: 'campaign-4',
                name: "The Frog King's Domain",
                description: 'Enter the otherworldly realm and face the Frog King himself.',
                icon: '◎',                levelCount: 8,
                drawIcon(ctx, x, y, size) {
                    const s = size * 0.38;
                    // Orb glow
                    const orb = ctx.createRadialGradient(x, y, 0, x, y, s * 1.3);
                    orb.addColorStop(0, 'rgba(206,147,216,0.45)'); orb.addColorStop(1, 'rgba(74,20,140,0)');
                    ctx.fillStyle = orb;
                    ctx.beginPath(); ctx.arc(x, y, s * 1.3, 0, Math.PI * 2); ctx.fill();
                    // Crown body
                    const cg = ctx.createLinearGradient(x - s, y - s*0.6, x, y + s*0.52);
                    cg.addColorStop(0, '#AB47BC'); cg.addColorStop(0.5, '#7B1FA2'); cg.addColorStop(1, '#4A148C');
                    ctx.fillStyle = cg;
                    ctx.beginPath();
                    ctx.moveTo(x - s, y + s*0.52);
                    ctx.lineTo(x - s, y - s*0.08);
                    ctx.lineTo(x - s*0.52, y - s*0.64);
                    ctx.lineTo(x, y - s*0.16);
                    ctx.lineTo(x + s*0.52, y - s*0.64);
                    ctx.lineTo(x + s, y - s*0.08);
                    ctx.lineTo(x + s, y + s*0.52);
                    ctx.closePath(); ctx.fill();
                    ctx.strokeStyle = '#CE93D8'; ctx.lineWidth = 1.5; ctx.stroke();
                    // Crown gems
                    [
                        { dx: 0, dy: -s*0.26, r: s*0.15, c: '#F06292' },
                        { dx: -s*0.52, dy: -s*0.5, r: s*0.11, c: '#CE93D8' },
                        { dx: s*0.52, dy: -s*0.5, r: s*0.11, c: '#CE93D8' }
                    ].forEach(gem => {
                        const gg = ctx.createRadialGradient(x+gem.dx-gem.r*0.3, y+gem.dy-gem.r*0.3, 0, x+gem.dx, y+gem.dy, gem.r);
                        gg.addColorStop(0, '#FCE4EC'); gg.addColorStop(0.5, gem.c); gg.addColorStop(1, '#6A1B9A');
                        ctx.fillStyle = gg;
                        ctx.beginPath(); ctx.arc(x+gem.dx, y+gem.dy, gem.r, 0, Math.PI*2); ctx.fill();
                        ctx.strokeStyle = '#7B1FA2'; ctx.lineWidth = 0.8; ctx.stroke();
                    });
                },                difficulty: 'Legendary',
                class: campaignClasses.Campaign4,
                rewards: {
                    gold: 15000,
                    unlocks: ['Crown of Victory']
                },
                unlockText: 'Complete The Scorching Sands',
                story: 'Using the artifact\'s power, you tear open a rift to the Frog King\'s own realm. The dimension itself is hostile — its landscapes warped by ancient magic, its sky a sickly purple-green. The Frog King rules from his throne at the end of a perilous path, and his champions stand ready to defend him. The fate of your world depends on this final stand. The Frog King awaits...',
                completionStory: 'Victory! The Frog King\'s domain crumbles. With his defeat, the rifts seal shut and the invasions cease across every realm. The frog armies disband, returning to their once-peaceful lives. You have done it — not just as a commander, but as a hero whose legend will never fade. The world is safe... for now.',
                lootStyle: { normalChance: 0.20, rareChance: 0.05 },
                progress: 0,
                locked: true
            },
            'campaign-5': {
                id: 'campaign-5',
                name: 'Level Testing Sandbox',
                description: 'A sandbox for testing and experimentation — everything unlocked.',
                icon: '◈',
                difficulty: 'Testing',
                class: campaignClasses.Campaign5,
                rewards: {
                    gold: 0,
                    unlocks: []
                },
                unlockText: null,
                story: 'A test environment for level design and gameplay mechanics. All buildings, towers, and upgrades are available. Campaign progression is not affected. Use this to experiment freely.',
                completionStory: '',
                lootStyle: { normalChance: 0.20, rareChance: 0.05 },
                progress: 0,
                locked: false
            }
        };
    }

    /**
     * Load campaign lock/unlock state from save data.
     * Call this every time a save is loaded or a campaign is completed.
     * @param {Object|null} saveData - The current save slot's data
     */
    static loadFromSaveData(saveData) {
        // Reset to default lock states
        this.campaigns['campaign-2'].locked = true;
        this.campaigns['campaign-3'].locked = true;
        this.campaigns['campaign-4'].locked = true;
        this.campaigns['campaign-5'].locked = false;
        this.campaigns['campaign-1'].locked = false;

        if (!saveData) return;

        const unlockedCampaigns = saveData.unlockedCampaigns || ['campaign-1', 'campaign-5'];
        const completedCampaigns = saveData.completedCampaigns || [];

        for (const id of unlockedCampaigns) {
            if (this.campaigns[id]) {
                this.campaigns[id].locked = false;
            }
        }
        // Completed campaigns are also unlocked
        for (const id of completedCampaigns) {
            if (this.campaigns[id]) {
                this.campaigns[id].locked = false;
            }
        }

        // Compute per-campaign progress from completed levels
        const completedLevels = saveData.completedLevels || [];
        for (const [id, campaign] of Object.entries(this.campaigns)) {
            if (completedCampaigns.includes(id)) {
                campaign.progress = 100;
            } else if (campaign.levelCount) {
                let count = 0;
                for (let i = 1; i <= campaign.levelCount; i++) {
                    if (completedLevels.includes(`level${i}`)) count++;
                }
                campaign.progress = Math.round((count / campaign.levelCount) * 100);
            } else {
                campaign.progress = 0;
            }
        }
    }

    /**
     * Unlock the campaign that follows the given completed campaign.
     * Returns the ID of the newly unlocked campaign, or null if none.
     * @param {string} completedCampaignId
     */
    static unlockNextCampaign(completedCampaignId) {
        const nextId = this.UNLOCK_CHAIN[completedCampaignId] || null;
        if (nextId && this.campaigns[nextId]) {
            this.campaigns[nextId].locked = false;
        }
        return nextId;
    }

    /**
     * Get a campaign by ID
     */
    static getCampaign(campaignId) {
        return this.campaigns[campaignId];
    }

    /**
     * Get the campaign class/state for a campaign ID
     */
    static getCampaignClass(campaignId) {
        const campaign = this.campaigns[campaignId];
        return campaign ? campaign.class : null;
    }

    /**
     * Get all campaigns
     */
    static getAllCampaigns() {
        return Object.values(this.campaigns);
    }

    /**
     * Get all campaign IDs
     */
    static getCampaignIds() {
        return Object.keys(this.campaigns);
    }

    /**
     * Get campaigns ordered by unlock status (unlocked first)
     */
    static getCampaignsOrdered() {
        const all = this.getAllCampaigns();
        return all.sort((a, b) => {
            const aLocked = a.locked ? 1 : 0;
            const bLocked = b.locked ? 1 : 0;
            return aLocked - bLocked;
        });
    }

    /**
     * Update campaign progress
     */
    static updateCampaignProgress(campaignId, progress) {
        const campaign = this.campaigns[campaignId];
        if (campaign) {
            campaign.progress = Math.min(100, Math.max(0, progress));
        }
    }

    /**
     * Check if campaign is unlocked
     */
    static isCampaignUnlocked(campaignId) {
        const campaign = this.campaigns[campaignId];
        return campaign && !campaign.locked;
    }
}
