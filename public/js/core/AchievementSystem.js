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

    // ── Combat ───────────────────────────────────────────────────────────────
    {
        id: 'getting-started',
        name: 'Getting Started',
        description: 'Slay your first enemy',
        icon: '⚔︎',
        category: 'combat',
        tier: 1,
        tierMax: 6,
        points: 8,
        check: (s) => s.totalEnemiesSlain >= 500,
        getProgress: (s) => ({ current: Math.min(s.totalEnemiesSlain, 500), max: 500 })
    },
    {
        id: 'deadly-force',
        name: 'Deadly Force',
        description: 'Slay 1,000 enemies',
        icon: '⚔︎',
        category: 'combat',
        tier: 2,
        tierMax: 6,
        points: 14,
        check: (s) => s.totalEnemiesSlain >= 1000,
        getProgress: (s) => ({ current: Math.min(s.totalEnemiesSlain, 1000), max: 1000 })
    },
    {
        id: 'executioner',
        name: 'Executioner',
        description: 'Slay 5,000 enemies',
        icon: '⚔︎',
        category: 'combat',
        tier: 3,
        tierMax: 6,
        points: 22,
        check: (s) => s.totalEnemiesSlain >= 5000,
        getProgress: (s) => ({ current: Math.min(s.totalEnemiesSlain, 5000), max: 5000 })
    },
    {
        id: 'warlord',
        name: 'Warlord',
        description: 'Slay 20,000 enemies',
        icon: '⚔︎',
        category: 'combat',
        tier: 4,
        tierMax: 6,
        points: 32,
        check: (s) => s.totalEnemiesSlain >= 20000,
        getProgress: (s) => ({ current: Math.min(s.totalEnemiesSlain, 20000), max: 20000 })
    },
    {
        id: 'annihilator',
        name: 'Annihilator',
        description: 'Slay 50,000 enemies',
        icon: '⚔︎',
        category: 'combat',
        tier: 5,
        tierMax: 6,
        points: 45,
        check: (s) => s.totalEnemiesSlain >= 50000,
        getProgress: (s) => ({ current: Math.min(s.totalEnemiesSlain, 50000), max: 50000 })
    },
    {
        id: 'extinction-event',
        name: 'Extinction Protocol',
        description: 'Slay 100,000 enemies',
        icon: '⚔︎',
        category: 'combat',
        tier: 6,
        tierMax: 6,
        points: 50,
        check: (s) => s.totalEnemiesSlain >= 100000,
        getProgress: (s) => ({ current: Math.min(s.totalEnemiesSlain, 100000), max: 100000 })
    },

    // ── Victory ───────────────────────────────────────────────────────────────
    {
        id: 'first-victory',
        name: 'First Victory',
        description: 'Win your first battle',
        icon: '♛︎',
        category: 'victory',
        tier: 1,
        tierMax: 6,
        points: 8,
        check: (s) => s.victories >= 1,
        getProgress: (s) => ({ current: Math.min(s.victories, 1), max: 1 })
    },
    {
        id: 'battle-hardened',
        name: 'Battle-Hardened',
        description: 'Win 10 battles',
        icon: '♛︎',
        category: 'victory',
        tier: 2,
        tierMax: 6,
        points: 14,
        check: (s) => s.victories >= 10,
        getProgress: (s) => ({ current: Math.min(s.victories, 10), max: 10 })
    },
    {
        id: 'seasoned-veteran',
        name: 'Seasoned Veteran',
        description: 'Win 25 battles',
        icon: '♛︎',
        category: 'victory',
        tier: 3,
        tierMax: 6,
        points: 22,
        check: (s) => s.victories >= 25,
        getProgress: (s) => ({ current: Math.min(s.victories, 25), max: 25 })
    },
    {
        id: 'campaign-champion',
        name: 'Campaign Champion',
        description: 'Win 75 battles',
        icon: '♛︎',
        category: 'victory',
        tier: 4,
        tierMax: 6,
        points: 32,
        check: (s) => s.victories >= 75,
        getProgress: (s) => ({ current: Math.min(s.victories, 75), max: 75 })
    },
    {
        id: 'legendary-commander',
        name: 'Legendary Commander',
        description: 'Win 150 battles',
        icon: '♛︎',
        category: 'victory',
        tier: 5,
        tierMax: 6,
        points: 45,
        check: (s) => s.victories >= 150,
        getProgress: (s) => ({ current: Math.min(s.victories, 150), max: 150 })
    },
    {
        id: 'eternal-guardian',
        name: 'Eternal Guardian',
        description: 'Win 300 battles',
        icon: '♛︎',
        category: 'victory',
        tier: 6,
        tierMax: 6,
        points: 60,
        check: (s) => s.victories >= 300,
        getProgress: (s) => ({ current: Math.min(s.victories, 300), max: 300 })
    },

    // ── Resilience ────────────────────────────────────────────────────────────
    {
        id: 'fallen-warrior',
        name: 'Fallen Warrior',
        description: 'Suffer your first defeat',
        icon: '⛨︎',
        category: 'resilience',
        tier: 1,
        tierMax: 3,
        points: 8,
        check: (s) => s.defeats >= 1,
        getProgress: (s) => ({ current: Math.min(s.defeats, 1), max: 1 })
    },
    {
        id: 'undaunted',
        name: 'Undaunted',
        description: 'Suffer 10 defeats and keep fighting',
        icon: '⛨︎',
        category: 'resilience',
        tier: 2,
        tierMax: 3,
        points: 14,
        check: (s) => s.defeats >= 10,
        getProgress: (s) => ({ current: Math.min(s.defeats, 10), max: 10 })
    },
    {
        id: 'unbreakable',
        name: 'Unbreakable',
        description: 'Suffer 25 defeats without giving up',
        icon: '⛨︎',
        category: 'resilience',
        tier: 3,
        tierMax: 3,
        points: 22,
        check: (s) => s.defeats >= 25,
        getProgress: (s) => ({ current: Math.min(s.defeats, 25), max: 25 })
    },

    // ── Tower Building ─────────────────────────────────────────────────────────
    {
        id: 'apprentice-builder',
        name: 'Apprentice Builder',
        description: 'Build 100 towers',
        icon: '⚙︎',
        category: 'builder',
        tier: 1,
        tierMax: 5,
        points: 8,
        check: (s) => s.totalTowersBuilt >= 100,
        getProgress: (s) => ({ current: Math.min(s.totalTowersBuilt, 100), max: 100 })
    },
    {
        id: 'master-engineer',
        name: 'Master Engineer',
        description: 'Build 500 towers',
        icon: '⚙︎',
        category: 'builder',
        tier: 2,
        tierMax: 5,
        points: 14,
        check: (s) => s.totalTowersBuilt >= 500,
        getProgress: (s) => ({ current: Math.min(s.totalTowersBuilt, 500), max: 500 })
    },
    {
        id: 'tower-overlord',
        name: 'Tower Overlord',
        description: 'Build 1,750 towers',
        icon: '⚙︎',
        category: 'builder',
        tier: 3,
        tierMax: 5,
        points: 22,
        check: (s) => s.totalTowersBuilt >= 1750,
        getProgress: (s) => ({ current: Math.min(s.totalTowersBuilt, 1750), max: 1750 })
    },
    {
        id: 'grand-architect',
        name: 'Grand Architect',
        description: 'Build 3,000 towers',
        icon: '⚙︎',
        category: 'builder',
        tier: 4,
        tierMax: 5,
        points: 32,
        check: (s) => s.totalTowersBuilt >= 3000,
        getProgress: (s) => ({ current: Math.min(s.totalTowersBuilt, 3000), max: 3000 })
    },
    {
        id: 'eternal-fortress',
        name: 'The Eternal Fortress',
        description: 'Build 10,000 towers',
        icon: '⚙︎',
        category: 'builder',
        tier: 5,
        tierMax: 5,
        points: 45,
        check: (s) => s.totalTowersBuilt >= 10000,
        getProgress: (s) => ({ current: Math.min(s.totalTowersBuilt, 10000), max: 10000 })
    },

    // ── Economy — spending ─────────────────────────────────────────────────────
    {
        id: 'merchant',
        name: 'Merchant',
        description: 'Spend 1,000 gold at the market',
        icon: '✦︎',
        category: 'spending',
        tier: 1,
        tierMax: 4,
        points: 8,
        check: (s) => s.totalMoneySpentOnMarketplace >= 1000,
        getProgress: (s) => ({ current: Math.min(s.totalMoneySpentOnMarketplace, 1000), max: 1000 })
    },
    {
        id: 'gold-hoarder',
        name: 'Gold Hoarder',
        description: 'Spend 10,000 gold at the market',
        icon: '✦︎',
        category: 'spending',
        tier: 2,
        tierMax: 4,
        points: 14,
        check: (s) => s.totalMoneySpentOnMarketplace >= 10000,
        getProgress: (s) => ({ current: Math.min(s.totalMoneySpentOnMarketplace, 10000), max: 10000 })
    },
    {
        id: 'treasure-baron',
        name: 'Treasure Baron',
        description: 'Spend 50,000 gold at the market',
        icon: '✦︎',
        category: 'spending',
        tier: 3,
        tierMax: 4,
        points: 22,
        check: (s) => s.totalMoneySpentOnMarketplace >= 50000,
        getProgress: (s) => ({ current: Math.min(s.totalMoneySpentOnMarketplace, 50000), max: 50000 })
    },
    {
        id: 'master-of-coin',
        name: 'Master of Coin',
        description: 'Spend 200,000 gold at the market',
        icon: '✦︎',
        category: 'spending',
        tier: 4,
        tierMax: 4,
        points: 32,
        check: (s) => s.totalMoneySpentOnMarketplace >= 200000,
        getProgress: (s) => ({ current: Math.min(s.totalMoneySpentOnMarketplace, 200000), max: 200000 })
    },

    // ── Economy — selling ──────────────────────────────────────────────────────
    {
        id: 'profiteer',
        name: 'Profiteer',
        description: 'Earn 1,000 gold from selling items',
        icon: '⚖︎',
        category: 'trading',
        tier: 1,
        tierMax: 3,
        points: 8,
        check: (s) => s.totalMoneyEarnedInMarketplace >= 1000,
        getProgress: (s) => ({ current: Math.min(s.totalMoneyEarnedInMarketplace, 1000), max: 1000 })
    },
    {
        id: 'market-baron',
        name: 'Market Baron',
        description: 'Sell 250 items',
        icon: '⚖︎',
        category: 'trading',
        tier: 2,
        tierMax: 3,
        points: 14,
        check: (s) => s.totalItemsSold >= 250,
        getProgress: (s) => ({ current: Math.min(s.totalItemsSold, 250), max: 250 })
    },
    {
        id: 'trade-magnate',
        name: 'Trade Magnate',
        description: 'Sell 1,000 items',
        icon: '⚖︎',
        category: 'trading',
        tier: 3,
        tierMax: 3,
        points: 22,
        check: (s) => s.totalItemsSold >= 1000,
        getProgress: (s) => ({ current: Math.min(s.totalItemsSold, 1000), max: 1000 })
    },

    // ── Items / Consumables ────────────────────────────────────────────────────
    {
        id: 'consumer',
        name: 'Consumer',
        description: 'Use 10 items in battle',
        icon: '⚗︎',
        category: 'alchemy',
        tier: 1,
        tierMax: 3,
        points: 8,
        check: (s) => s.totalItemsConsumed >= 10,
        getProgress: (s) => ({ current: Math.min(s.totalItemsConsumed, 10), max: 10 })
    },
    {
        id: 'talisman-master',
        name: 'Talisman Master',
        description: 'Use 50 items in battle',
        icon: '⚗︎',
        category: 'alchemy',
        tier: 2,
        tierMax: 3,
        points: 14,
        check: (s) => s.totalItemsConsumed >= 50,
        getProgress: (s) => ({ current: Math.min(s.totalItemsConsumed, 50), max: 50 })
    },
    {
        id: 'boonlord',
        name: 'Boonlord',
        description: 'Use 200 items in battle',
        icon: '⚗︎',
        category: 'alchemy',
        tier: 3,
        tierMax: 3,
        points: 22,
        check: (s) => s.totalItemsConsumed >= 200,
        getProgress: (s) => ({ current: Math.min(s.totalItemsConsumed, 200), max: 200 })
    },

    // ── Waves Survived ─────────────────────────────────────────────────────────
    {
        id: 'wave-runner',
        name: 'Wave Runner',
        description: 'Survive 100 waves',
        icon: '⚡︎',
        category: 'resilience',
        tier: 1,
        tierMax: 3,
        points: 8,
        check: (s) => (s.totalWavesSurvived || 0) >= 100,
        getProgress: (s) => ({ current: Math.min(s.totalWavesSurvived || 0, 100), max: 100 })
    },
    {
        id: 'storm-survivor',
        name: 'Storm Survivor',
        description: 'Survive 1000 waves',
        icon: '⚡︎',
        category: 'resilience',
        tier: 2,
        tierMax: 3,
        points: 14,
        check: (s) => (s.totalWavesSurvived || 0) >= 1000,
        getProgress: (s) => ({ current: Math.min(s.totalWavesSurvived || 0, 1000), max: 1000 })
    },
    {
        id: 'original-wavejumper',
        name: 'The Original Wavejumper',
        description: 'Survive 5000 waves',
        icon: '⚡︎',
        category: 'resilience',
        tier: 3,
        tierMax: 3,
        points: 22,
        check: (s) => (s.totalWavesSurvived || 0) >= 5000,
        getProgress: (s) => ({ current: Math.min(s.totalWavesSurvived || 0, 5000), max: 5000 })
    },

    // ── Loot ──────────────────────────────────────────────────────────────────
    {
        id: 'opportunist',
        name: 'Opportunist',
        description: 'Collect 100 loot drops',
        icon: '◈︎',
        category: 'loot',
        tier: 1,
        tierMax: 3,
        points: 8,
        check: (s) => (s.totalLootCollected || 0) >= 100,
        getProgress: (s) => ({ current: Math.min(s.totalLootCollected || 0, 100), max: 100 })
    },
    {
        id: 'fortune-hunter',
        name: 'Fortune Hunter',
        description: 'Collect 500 loot drops',
        icon: '◈︎',
        category: 'loot',
        tier: 2,
        tierMax: 3,
        points: 14,
        check: (s) => (s.totalLootCollected || 0) >= 500,
        getProgress: (s) => ({ current: Math.min(s.totalLootCollected || 0, 500), max: 500 })
    },
    {
        id: 'loot-goblin',
        name: 'Loot Goblin',
        description: 'Collect 1250 loot drops',
        icon: '◈︎',
        category: 'loot',
        tier: 3,
        tierMax: 3,
        points: 22,
        check: (s) => (s.totalLootCollected || 0) >= 1250,
        getProgress: (s) => ({ current: Math.min(s.totalLootCollected || 0, 1250), max: 1250 })
    },

    // ── Campaigns ─────────────────────────────────────────────────────────────
    {
        id: 'forest-conqueror',
        name: 'Forest Conqueror',
        description: 'Complete the Forest campaign',
        icon: '⚑︎',
        category: 'campaign',
        points: 20,
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
        icon: '⚑︎',
        category: 'campaign',
        points: 20,
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
        icon: '⚑︎',
        category: 'campaign',
        points: 20,
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
        icon: '⚑︎',
        category: 'campaign',
        points: 20,
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
        icon: '⌛︎',
        category: 'playtime',
        tier: 1,
        tierMax: 4,
        points: 8,
        check: (s) => s.totalPlaytime >= 3600,
        getProgress: (s) => ({ current: Math.min(Math.floor(s.totalPlaytime / 60), 60), max: 60 })
    },
    {
        id: 'arcane-scholar',
        name: 'Arcane Scholar',
        description: 'Play for 5 hours',
        icon: '⌛︎',
        category: 'playtime',
        tier: 2,
        tierMax: 4,
        points: 14,
        check: (s) => s.totalPlaytime >= 18000,
        getProgress: (s) => ({ current: Math.min(Math.floor(s.totalPlaytime / 60), 300), max: 300 })
    },
    {
        id: 'touwers-fanatic',
        name: 'Touwers Fanatic',
        description: 'Play for 20 hours',
        icon: '⌛︎',
        category: 'playtime',
        tier: 3,
        tierMax: 4,
        points: 22,
        check: (s) => s.totalPlaytime >= 72000,
        getProgress: (s) => ({ current: Math.min(Math.floor(s.totalPlaytime / 60), 1200), max: 1200 })
    },
    {
        id: 'eternal-watcher',
        name: 'Eternal Watcher',
        description: 'Play for 50 hours',
        icon: '⌛︎',
        category: 'playtime',
        tier: 4,
        tierMax: 4,
        points: 32,
        check: (s) => s.totalPlaytime >= 180000,
        getProgress: (s) => ({ current: Math.min(Math.floor(s.totalPlaytime / 60), 3000), max: 3000 })
    },

    // ── Super Weapon Lab ──────────────────────────────────────────────────────
    {
        id: 'arcane-spire',
        name: 'Arcane Spire',
        description: 'Construct the Super Weapon Lab',
        icon: '☄︎',
        category: 'superweapon',
        tier: 1,
        tierMax: 3,
        points: 8,
        check: (s) => !!s.superWeaponLabBuilt,
        getProgress: (s) => ({ current: s.superWeaponLabBuilt ? 1 : 0, max: 1 })
    },
    {
        id: 'frost-shatter',
        name: 'Frost Shatter',
        description: 'Strike a frozen enemy with another Super Weapon Lab spell while it is under Frozen Nova',
        icon: '❄︎',
        category: 'superweapon',
        tier: 2,
        tierMax: 3,
        points: 22,
        check: (s) => !!s.frostShatterTriggered,
        getProgress: (s) => ({ current: s.frostShatterTriggered ? 1 : 0, max: 1 })
    },
    {
        id: 'arcane-arsenal',
        name: 'Arcane Arsenal',
        description: 'Cast Super Weapon Lab spells 100 times in total',
        icon: '✺︎',
        category: 'superweapon',
        tier: 3,
        tierMax: 3,
        points: 45,
        check: (s) => (s.totalSuperWeaponSpellsCast || 0) >= 100,
        getProgress: (s) => ({ current: Math.min(s.totalSuperWeaponSpellsCast || 0, 100), max: 100 })
    }
];

// Sum of every achievement's `points` value — kept at exactly 1000 so the
// Arcane Library's score bar always reads as "progress toward 1000".
const TOTAL_ACHIEVEMENT_POINTS = ACHIEVEMENT_DEFS.reduce((sum, def) => sum + (def.points || 0), 0);

// ─── Arcane Score titles ──────────────────────────────────────────────────────
// Earning enough Arcane Score grants the commander a new honorary title.
// Thresholds are checked against the cumulative score from unlocked achievements.
const TITLE_LADDER = [
    { threshold: 0,    title: 'Tower Apprentice' },
    { threshold: 100,  title: 'Arcane Initiate' },
    { threshold: 200,  title: 'Spellbound Adept' },
    { threshold: 500,  title: 'Master of the Arcane' },
    { threshold: 700,  title: 'Sovereign of the Spire' },
    { threshold: 1000, title: 'Archmagus Eternal' }
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
                category:    def.category,
                points:      def.points || 0,
                tier:        def.tier || 0,
                tierMax:     def.tierMax || 0,
                unlocked,
                progress
            };
        });
    }

    /**
     * Resolves the title earned at a given Arcane Score, plus the next title
     * on the ladder and how many points remain to reach it.
     * @param {number} score
     */
    getTitleInfo(score) {
        let current = TITLE_LADDER[0];
        let next = TITLE_LADDER[1] || null;
        for (let i = 0; i < TITLE_LADDER.length; i++) {
            if (score >= TITLE_LADDER[i].threshold) {
                current = TITLE_LADDER[i];
                next = TITLE_LADDER[i + 1] || null;
            }
        }
        return {
            title:           current.title,
            currentThreshold: current.threshold,
            nextTitle:       next ? next.title : null,
            nextThreshold:   next ? next.threshold : null,
            isMaxTitle:      next === null
        };
    }

    /**
     * Returns the player's current score summary for the Arcane Library tab:
     * how many points have been earned out of the fixed 1000-point pool, how
     * many of the total achievements are unlocked, and the commander's title
     * progress (current title + progress toward the next threshold).
     */
    getScoreSummary() {
        let earnedPoints = 0;
        let unlockedCount = 0;
        for (const def of ACHIEVEMENT_DEFS) {
            if (this.unlockedIds.has(def.id)) {
                earnedPoints += def.points || 0;
                unlockedCount++;
            }
        }
        const titleInfo = this.getTitleInfo(earnedPoints);
        return {
            earnedPoints,
            totalPoints: TOTAL_ACHIEVEMENT_POINTS,
            unlockedCount,
            totalCount: ACHIEVEMENT_DEFS.length,
            title:            titleInfo.title,
            nextTitle:        titleInfo.nextTitle,
            currentThreshold: titleInfo.currentThreshold,
            nextThreshold:    titleInfo.nextThreshold,
            isMaxTitle:       titleInfo.isMaxTitle
        };
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
            if (this.audioManager) {
                this.audioManager.playSFX('achievement');
            }
        }
    }

    // ── Banner rendering ──────────────────────────────────────────────────────

    render(ctx, canvas) {
        if (!this._banner || this._bannerPhase === 'none') return;

        const sf          = canvas.width / 1920;
        const bannerW     = 500 * sf;
        const bannerH     = 80 * sf;
        const capR        = bannerH / 2;
        const bannerX     = canvas.width / 2 - bannerW / 2;
        const bannerBaseY = 16 * sf;

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
            ySlide  = -t * 16 * sf;
        }

        const bx = bannerX;
        const by = bannerBaseY + ySlide;
        const cx = bx + bannerW / 2;

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

        // Drop shadow
        ctx.globalAlpha = alpha * 0.45;
        ctx.fillStyle   = '#000';
        ctx.save();
        ctx.translate(0, 4 * sf);
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
                const insetV = i * 6 * sf;
                const r2 = capR - insetV;
                if (r2 <= 2) break;
                ctx.beginPath();
                ctx.arc(cx2, by + capR, r2, -Math.PI / 2, Math.PI / 2, originX < cx ? false : true);
                ctx.stroke();
            }
        };
        capDetail(bx + capR);
        capDetail(bx + bannerW - capR);

        // ── Thin inner border ─────────────────────────────────────────────────
        const inset = 6 * sf;
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
        ctx.font          = `bold ${Math.round(10 * sf)}px Trebuchet MS, sans-serif`;
        ctx.letterSpacing = `${Math.round(2 * sf)}px`;
        ctx.fillStyle     = '#b8864e';
        ctx.textAlign     = 'center';
        ctx.textBaseline  = 'top';
        ctx.fillText('ACHIEVEMENT UNLOCKED', cx, by + 12 * sf);
        ctx.letterSpacing = '0px';

        // ── Ornamental divider ────────────────────────────────────────────────
        const divY  = by + 28 * sf;
        const divW  = 160 * sf;
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
        const pip = 3 * sf;
        const pip4 = 4 * sf;
        ctx.fillStyle = '#d4a843';
        ctx.beginPath();
        ctx.moveTo(cx,       divY - pip);
        ctx.lineTo(cx + pip4, divY);
        ctx.lineTo(cx,       divY + pip);
        ctx.lineTo(cx - pip4, divY);
        ctx.closePath();
        ctx.fill();

        // ── Achievement name ──────────────────────────────────────────────────
        const iconChar = this._banner.icon || '●';
        ctx.font         = `bold ${Math.round(19 * sf)}px Trebuchet MS, sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = 'rgba(0,0,0,0.5)';
        ctx.fillText(`${iconChar}  ${this._banner.name}`, cx + 1, by + bannerH * 0.68 + 1);
        ctx.fillStyle    = '#f5d070';
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
