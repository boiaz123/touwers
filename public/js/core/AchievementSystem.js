/**
 * AchievementSystem — defines all achievements, tracks unlocks, and drives the
 * animated banner that appears at the top of the screen when one is earned.
 *
 * Usage:
 *   stateManager.achievementSystem = new AchievementSystem();
 *   achievementSystem.restoreFromSave(saveData.achievements);
 *   achievementSystem.checkAchievements(gameStatistics, saveData);   // after events
 *   achievementSystem.update(deltaTime);                              // each frame
 *   achievementSystem.render(ctx, canvas);                           // end of render
 */

// ─── Achievement definitions ─────────────────────────────────────────────────
// Each entry: { id, name, description, icon, check(stats, saveData), getProgress(stats, saveData) }
// check()       → boolean: true when the achievement is earned
// getProgress() → { current, max } for the progress bar (max >= 1)

const ACHIEVEMENT_DEFS = [

    // ── Combat ──────────────────────────────────────────────────────────────
    {
        id: 'first-blood',
        name: 'First Blood',
        description: 'Slay your first enemy',
        icon: '▸',
        check: (s) => s.totalEnemiesSlain >= 1,
        getProgress: (s) => ({ current: Math.min(s.totalEnemiesSlain, 1), max: 1 })
    },
    {
        id: 'deadly-force',
        name: 'Deadly Force',
        description: 'Slay 50 enemies',
        icon: '▸',
        check: (s) => s.totalEnemiesSlain >= 50,
        getProgress: (s) => ({ current: Math.min(s.totalEnemiesSlain, 50), max: 50 })
    },
    {
        id: 'executioner',
        name: 'Executioner',
        description: 'Slay 500 enemies',
        icon: '▸',
        check: (s) => s.totalEnemiesSlain >= 500,
        getProgress: (s) => ({ current: Math.min(s.totalEnemiesSlain, 500), max: 500 })
    },
    {
        id: 'warlord',
        name: 'Warlord',
        description: 'Slay 2000 enemies',
        icon: '▸',
        check: (s) => s.totalEnemiesSlain >= 2000,
        getProgress: (s) => ({ current: Math.min(s.totalEnemiesSlain, 2000), max: 2000 })
    },

    // ── Victory ──────────────────────────────────────────────────────────────
    {
        id: 'first-victory',
        name: 'First Victory',
        description: 'Win your first battle',
        icon: '●',
        check: (s) => s.victories >= 1,
        getProgress: (s) => ({ current: Math.min(s.victories, 1), max: 1 })
    },
    {
        id: 'seasoned-veteran',
        name: 'Seasoned Veteran',
        description: 'Win 10 battles',
        icon: '●',
        check: (s) => s.victories >= 10,
        getProgress: (s) => ({ current: Math.min(s.victories, 10), max: 10 })
    },
    {
        id: 'campaign-champion',
        name: 'Campaign Champion',
        description: 'Win 30 battles',
        icon: '●',
        check: (s) => s.victories >= 30,
        getProgress: (s) => ({ current: Math.min(s.victories, 30), max: 30 })
    },
    {
        id: 'legendary-commander',
        name: 'Legendary Commander',
        description: 'Win 50 battles',
        icon: '●',
        check: (s) => s.victories >= 50,
        getProgress: (s) => ({ current: Math.min(s.victories, 50), max: 50 })
    },

    // ── Tower Building ────────────────────────────────────────────────────────
    {
        id: 'apprentice-builder',
        name: 'Apprentice Builder',
        description: 'Build 10 towers',
        icon: '■',
        check: (s) => s.totalTowersBuilt >= 10,
        getProgress: (s) => ({ current: Math.min(s.totalTowersBuilt, 10), max: 10 })
    },
    {
        id: 'master-engineer',
        name: 'Master Engineer',
        description: 'Build 50 towers',
        icon: '■',
        check: (s) => s.totalTowersBuilt >= 50,
        getProgress: (s) => ({ current: Math.min(s.totalTowersBuilt, 50), max: 50 })
    },
    {
        id: 'tower-overlord',
        name: 'Tower Overlord',
        description: 'Build 200 towers',
        icon: '■',
        check: (s) => s.totalTowersBuilt >= 200,
        getProgress: (s) => ({ current: Math.min(s.totalTowersBuilt, 200), max: 200 })
    },

    // ── Economy — spending ────────────────────────────────────────────────────
    {
        id: 'merchant',
        name: 'Merchant',
        description: 'Spend 500 gold at the market',
        icon: '◆',
        check: (s) => s.totalMoneySpentOnMarketplace >= 500,
        getProgress: (s) => ({ current: Math.min(s.totalMoneySpentOnMarketplace, 500), max: 500 })
    },
    {
        id: 'gold-hoarder',
        name: 'Gold Hoarder',
        description: 'Spend 5000 gold at the market',
        icon: '◆',
        check: (s) => s.totalMoneySpentOnMarketplace >= 5000,
        getProgress: (s) => ({ current: Math.min(s.totalMoneySpentOnMarketplace, 5000), max: 5000 })
    },

    // ── Economy — selling ─────────────────────────────────────────────────────
    {
        id: 'profiteer',
        name: 'Profiteer',
        description: 'Earn 500 gold from selling items',
        icon: '◈',
        check: (s) => s.totalMoneyEarnedInMarketplace >= 500,
        getProgress: (s) => ({ current: Math.min(s.totalMoneyEarnedInMarketplace, 500), max: 500 })
    },
    {
        id: 'market-baron',
        name: 'Market Baron',
        description: 'Sell 25 items',
        icon: '◈',
        check: (s) => s.totalItemsSold >= 25,
        getProgress: (s) => ({ current: Math.min(s.totalItemsSold, 25), max: 25 })
    },

    // ── Items / Consumables ───────────────────────────────────────────────────
    {
        id: 'alchemist',
        name: 'Alchemist',
        description: 'Use 5 items in battle',
        icon: '◉',
        check: (s) => s.totalItemsConsumed >= 5,
        getProgress: (s) => ({ current: Math.min(s.totalItemsConsumed, 5), max: 5 })
    },
    {
        id: 'potion-master',
        name: 'Potion Master',
        description: 'Use 25 items in battle',
        icon: '◉',
        check: (s) => s.totalItemsConsumed >= 25,
        getProgress: (s) => ({ current: Math.min(s.totalItemsConsumed, 25), max: 25 })
    },

    // ── Campaigns ─────────────────────────────────────────────────────────────
    {
        id: 'forest-conqueror',
        name: 'Forest Conqueror',
        description: 'Complete the Forest campaign',
        icon: '◊',
        check: (_s, d) => Array.isArray(d?.completedCampaigns) && d.completedCampaigns.includes('campaign-1'),
        getProgress: (_s, d) => ({
            current: (Array.isArray(d?.completedCampaigns) && d.completedCampaigns.includes('campaign-1')) ? 1 : 0,
            max: 1
        })
    },
    {
        id: 'mountain-conqueror',
        name: 'Mountain Conqueror',
        description: 'Complete the Mountain campaign',
        icon: '◊',
        check: (_s, d) => Array.isArray(d?.completedCampaigns) && d.completedCampaigns.includes('campaign-2'),
        getProgress: (_s, d) => ({
            current: (Array.isArray(d?.completedCampaigns) && d.completedCampaigns.includes('campaign-2')) ? 1 : 0,
            max: 1
        })
    },
    {
        id: 'desert-conqueror',
        name: 'Desert Conqueror',
        description: 'Complete the Desert campaign',
        icon: '◊',
        check: (_s, d) => Array.isArray(d?.completedCampaigns) && d.completedCampaigns.includes('campaign-3'),
        getProgress: (_s, d) => ({
            current: (Array.isArray(d?.completedCampaigns) && d.completedCampaigns.includes('campaign-3')) ? 1 : 0,
            max: 1
        })
    },
    {
        id: 'frog-slayer',
        name: 'Frog Slayer',
        description: "Survive the Frog King's Realm",
        icon: '◊',
        check: (_s, d) => Array.isArray(d?.completedCampaigns) && d.completedCampaigns.includes('campaign-4'),
        getProgress: (_s, d) => ({
            current: (Array.isArray(d?.completedCampaigns) && d.completedCampaigns.includes('campaign-4')) ? 1 : 0,
            max: 1
        })
    },

    // ── Playtime ──────────────────────────────────────────────────────────────
    {
        id: 'dedicated-defender',
        name: 'Dedicated Defender',
        description: 'Play for 1 hour',
        icon: '○',
        check: (s) => s.totalPlaytime >= 3600,
        getProgress: (s) => ({ current: Math.min(Math.floor(s.totalPlaytime / 60), 60), max: 60 })
    },
    {
        id: 'arcane-scholar',
        name: 'Arcane Scholar',
        description: 'Play for 5 hours',
        icon: '○',
        check: (s) => s.totalPlaytime >= 18000,
        getProgress: (s) => ({ current: Math.min(Math.floor(s.totalPlaytime / 60), 300), max: 300 })
    }
];

// ─── Banner animation constants ───────────────────────────────────────────────
const BANNER_IN_DURATION  = 0.45;  // seconds to slide in
const BANNER_HOLD_DURATION = 3.5;  // seconds to stay visible
const BANNER_OUT_DURATION  = 0.55; // seconds to fade out

// ─── AchievementSystem ────────────────────────────────────────────────────────
export class AchievementSystem {
    constructor() {
        this.unlockedIds    = new Set();
        this.pendingBanners = [];
        this._banner        = null;
        this._bannerTimer   = 0;
        this._bannerPhase   = 'none'; // 'in' | 'hold' | 'out' | 'none'
        this.audioManager   = null;
    }

    /** Call once the audio manager is available so banners can play a sound. */
    setAudioManager(audioManager) {
        this.audioManager = audioManager;
    }

    /**
     * Test all achievements against the current stats and save data.
     * Newly-met achievements are queued as banner notifications.
     *
     * @param {GameStatistics} stats
     * @param {Object}         saveData  – the stateManager.currentSaveData object
     * @param {boolean}        silent    – if true, mark unlocked but skip banners
     *                                    (use on initial save load)
     * @returns {Array} newly-unlocked achievement defs
     */
    checkAchievements(stats, saveData, silent = false) {
        if (!stats) return [];
        const newlyUnlocked = [];
        for (const def of ACHIEVEMENT_DEFS) {
            if (!this.unlockedIds.has(def.id) && def.check(stats, saveData)) {
                this.unlockedIds.add(def.id);
                if (!silent) newlyUnlocked.push(def);
            }
        }
        if (newlyUnlocked.length > 0) {
            this.pendingBanners.push(...newlyUnlocked);
        }
        return newlyUnlocked;
    }

    /**
     * Returns the full achievement list enriched with unlock state and progress.
     * @param {GameStatistics} stats
     * @param {Object}         saveData
     */
    getAchievements(stats, saveData) {
        return ACHIEVEMENT_DEFS.map(def => {
            const unlocked = this.unlockedIds.has(def.id);
            const progress = def.getProgress
                ? def.getProgress(stats || {}, saveData)
                : { current: unlocked ? 1 : 0, max: 1 };
            return {
                id:          def.id,
                name:        def.name,
                description: def.description,
                icon:        def.icon,
                unlocked,
                progress
            };
        });
    }

    // ── Frame update ──────────────────────────────────────────────────────────

    update(deltaTime) {
        // Advance current banner
        if (this._bannerPhase !== 'none') {
            this._bannerTimer += deltaTime;
            if (this._bannerPhase === 'in' && this._bannerTimer >= BANNER_IN_DURATION) {
                this._bannerTimer = 0;
                this._bannerPhase = 'hold';
            } else if (this._bannerPhase === 'hold' && this._bannerTimer >= BANNER_HOLD_DURATION) {
                this._bannerTimer = 0;
                this._bannerPhase = 'out';
            } else if (this._bannerPhase === 'out' && this._bannerTimer >= BANNER_OUT_DURATION) {
                this._bannerTimer = 0;
                this._bannerPhase = 'none';
                this._banner = null;
            }
        }

        // Dequeue next banner when idle
        if (this._bannerPhase === 'none' && this.pendingBanners.length > 0) {
            this._banner      = this.pendingBanners.shift();
            this._bannerTimer = 0;
            this._bannerPhase = 'in';

        }
    }

    // ── Banner rendering ──────────────────────────────────────────────────────

    render(ctx, canvas) {
        if (!this._banner || this._bannerPhase === 'none') return;

        const bannerW     = 500;
        const bannerH     = 80;
        const capR        = bannerH / 2;          // scroll end-cap radius
        const bannerX     = canvas.width / 2 - bannerW / 2;
        const bannerBaseY = 16;

        // Animation: slide in from above (ease-out cubic) then fade out
        let alpha  = 1;
        let ySlide = 0;

        if (this._bannerPhase === 'in') {
            const t    = Math.min(this._bannerTimer / BANNER_IN_DURATION, 1);
            const ease = 1 - Math.pow(1 - t, 3);
            ySlide = -(1 - ease) * (bannerH + bannerBaseY + capR);
        } else if (this._bannerPhase === 'out') {
            const t = Math.min(this._bannerTimer / BANNER_OUT_DURATION, 1);
            alpha   = 1 - t;
            ySlide  = -t * 16;
        }

        const bx = bannerX;
        const by = bannerBaseY + ySlide;
        const cx = bx + bannerW / 2;
        const cy = by + bannerH / 2;

        ctx.save();
        ctx.globalAlpha = alpha;

        // ── Scroll shape (rounded pill) clip + fill ───────────────────────────
        const scrollPath = () => {
            ctx.beginPath();
            ctx.moveTo(bx + capR, by);
            ctx.lineTo(bx + bannerW - capR, by);
            ctx.arc(bx + bannerW - capR, by + capR, capR, -Math.PI / 2, Math.PI / 2);
            ctx.lineTo(bx + capR, by + bannerH);
            ctx.arc(bx + capR, by + capR, capR, Math.PI / 2, -Math.PI / 2);
            ctx.closePath();
        };

        // Drop shadow (no ctx.shadow to avoid canvas blur cost)
        ctx.globalAlpha = alpha * 0.45;
        ctx.fillStyle   = '#000';
        ctx.save();
        ctx.translate(0, 4);
        scrollPath();
        ctx.fill();
        ctx.restore();
        ctx.globalAlpha = alpha;

        // Parchment gradient fill
        const grad = ctx.createLinearGradient(bx, by, bx, by + bannerH);
        grad.addColorStop(0,   '#4a2e10');
        grad.addColorStop(0.18,'#3b2008');
        grad.addColorStop(0.5, '#2c1605');
        grad.addColorStop(0.82,'#3b2008');
        grad.addColorStop(1,   '#4a2e10');
        scrollPath();
        ctx.fillStyle = grad;
        ctx.fill();

        // ── Subtle inner highlight (top rim) ─────────────────────────────────
        const rimGrad = ctx.createLinearGradient(bx, by, bx, by + bannerH * 0.3);
        rimGrad.addColorStop(0,   'rgba(255,220,120,0.18)');
        rimGrad.addColorStop(1,   'rgba(255,220,120,0)');
        scrollPath();
        ctx.fillStyle = rimGrad;
        ctx.fill();

        // ── Gold border ───────────────────────────────────────────────────────
        scrollPath();
        ctx.strokeStyle = '#c9922a';
        ctx.lineWidth   = 2.5;
        ctx.stroke();

        // ── Bright outer edge ─────────────────────────────────────────────────
        scrollPath();
        ctx.strokeStyle = 'rgba(255, 215, 80, 0.55)';
        ctx.lineWidth   = 1;
        ctx.stroke();

        // ── Scroll end-cap detail lines ───────────────────────────────────────
        ctx.strokeStyle = 'rgba(180, 120, 30, 0.7)';
        ctx.lineWidth   = 1;
        const capDetail = (originX) => {
            const cx2 = originX;
            for (let i = 1; i <= 2; i++) {
                const inset = i * 6;
                const r2 = capR - inset;
                if (r2 <= 2) break;
                ctx.beginPath();
                ctx.arc(cx2, by + capR, r2, -Math.PI / 2, Math.PI / 2, originX < cx ? false : true);
                ctx.stroke();
            }
        };
        capDetail(bx + capR);
        capDetail(bx + bannerW - capR);

        // ── Thin inner border ─────────────────────────────────────────────────
        const inset = 6;
        const iBx = bx + inset;
        const iBy = by + inset;
        const iBW = bannerW - inset * 2;
        const iBH = bannerH - inset * 2;
        const iR  = capR - inset;
        ctx.beginPath();
        ctx.moveTo(iBx + iR, iBy);
        ctx.lineTo(iBx + iBW - iR, iBy);
        ctx.arc(iBx + iBW - iR, iBy + iR, iR, -Math.PI / 2, Math.PI / 2);
        ctx.lineTo(iBx + iR, iBy + iBH);
        ctx.arc(iBx + iR, iBy + iR, iR, Math.PI / 2, -Math.PI / 2);
        ctx.closePath();
        ctx.strokeStyle = 'rgba(160, 100, 20, 0.5)';
        ctx.lineWidth   = 1;
        ctx.stroke();

        // ── Header label ──────────────────────────────────────────────────────
        ctx.font         = 'bold 10px Trebuchet MS, sans-serif';
        ctx.letterSpacing = '2px';
        ctx.fillStyle    = '#b8864e';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('ACHIEVEMENT UNLOCKED', cx, by + 12);
        ctx.letterSpacing = '0px';

        // ── Ornamental divider ────────────────────────────────────────────────
        const divY   = by + 28;
        const divW   = 160;
        const divGrad = ctx.createLinearGradient(cx - divW / 2, divY, cx + divW / 2, divY);
        divGrad.addColorStop(0,   'rgba(180,130,40,0)');
        divGrad.addColorStop(0.3, 'rgba(180,130,40,0.8)');
        divGrad.addColorStop(0.5, 'rgba(220,170,60,1)');
        divGrad.addColorStop(0.7, 'rgba(180,130,40,0.8)');
        divGrad.addColorStop(1,   'rgba(180,130,40,0)');
        ctx.strokeStyle = divGrad;
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(cx - divW / 2, divY);
        ctx.lineTo(cx + divW / 2, divY);
        ctx.stroke();
        // Diamond centre pip
        ctx.fillStyle = '#d4a843';
        ctx.beginPath();
        ctx.moveTo(cx,     divY - 3);
        ctx.lineTo(cx + 4, divY);
        ctx.lineTo(cx,     divY + 3);
        ctx.lineTo(cx - 4, divY);
        ctx.closePath();
        ctx.fill();

        // ── Achievement name ──────────────────────────────────────────────────
        const iconChar = this._banner.icon || '●';
        ctx.font         = 'bold 19px Trebuchet MS, sans-serif';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        // Subtle text shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillText(`${iconChar}  ${this._banner.name}`, cx + 1, by + bannerH * 0.68 + 1);
        ctx.fillStyle = '#f5d070';
        ctx.fillText(`${iconChar}  ${this._banner.name}`, cx, by + bannerH * 0.68);

        ctx.restore();
    }

    // ── Serialization ─────────────────────────────────────────────────────────

    serialize() {
        return { unlockedIds: Array.from(this.unlockedIds) };
    }

    deserialize(data) {
        if (data && Array.isArray(data.unlockedIds)) {
            this.unlockedIds = new Set(data.unlockedIds);
        }
    }

    restoreFromSave(data) {
        this.deserialize(data);
    }
}
