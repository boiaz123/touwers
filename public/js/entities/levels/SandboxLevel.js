import { ForestLevel1 } from './Forest/ForestLevel1.js';

/**
 * Enemy roster unlocked in tiers as sandbox waves climb, roughly mirroring the order
 * enemies are first met across the campaigns (Forest -> Mountain -> Desert). Every tier's
 * types are added to (not replacing) the ones before it, so by FULL_ROSTER_WAVE every
 * non-boss enemy type in the game can appear - "after a while all enemy types can spawn".
 */
const ENEMY_TIERS = [
    { wave: 1, types: ['basic', 'villager'] },
    { wave: 8, types: ['archer', 'beefyenemy'] },
    { wave: 16, types: ['shieldknight', 'ramcart'] },
    { wave: 24, types: ['knight', 'mage'] },
    { wave: 32, types: ['frog'] },
    { wave: 40, types: ['walkingfrog', 'earthfrog', 'waterfrog', 'firefrog', 'airfrog'] }
];
const FULL_ROSTER_WAVE = ENEMY_TIERS[ENEMY_TIERS.length - 1].wave;

// The Frog King returns as a rare, escalating milestone threat once the player is deep
// into a run - a nod to the boss they already beat to unlock sandbox in the first place.
// Scaled independently of the fodder health multiplier (see BOSS_HEALTH below): at
// BOSS_START_WAVE he's a weakened echo of the real fight, and slowly grows tougher. Starts
// a full 10 waves after the roster finishes filling out (FULL_ROSTER_WAVE), so every other
// enemy type has had room to appear before the boss milestones begin.
const BOSS_TYPE = 'frogking';
const BOSS_START_WAVE = 50;
const BOSS_INTERVAL = 20;

/**
 * "Builds" - composition archetypes a wave can roll, so waves read as intentional
 * (a swarm, an elite squad, a rush) instead of uniformly random noise. Each returns a
 * wave pattern ({type, count}[]) drawn from the currently-unlocked roster, plus a spawn
 * interval multiplier that gives the archetype its own pacing.
 */
function pickN(rng, pool, n) {
    const shuffled = pool.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, Math.min(n, shuffled.length));
}

const BUILDS = {
    // A big block of the weakest currently-unlocked chaff, arriving fast.
    swarm(rng, unlocked, wave) {
        const weakPool = unlocked.slice(0, Math.max(2, Math.ceil(unlocked.length * 0.5)));
        const types = pickN(rng, weakPool, rng() < 0.35 ? 2 : 1);
        const total = 10 + Math.floor(wave * 0.6);
        const pattern = types.map(type => ({ type, count: Math.max(4, Math.round(total / types.length)) }));
        return { pattern, spawnIntervalScale: 0.85 };
    },
    // A handful of the toughest currently-unlocked types, arriving with room to breathe.
    elite(rng, unlocked, wave) {
        const strongPool = unlocked.slice(-Math.max(2, Math.ceil(unlocked.length * 0.45)));
        const types = pickN(rng, strongPool, rng() < 0.5 ? 2 : 1);
        const total = 3 + Math.floor(wave * 0.15);
        const pattern = types.map(type => ({ type, count: Math.max(2, Math.round(total / types.length)) }));
        return { pattern, spawnIntervalScale: 1.3 };
    },
    // A broad, unpredictable spread across most of the unlocked roster.
    assault(rng, unlocked, wave) {
        const typeCount = Math.min(unlocked.length, 3 + Math.floor(rng() * 3));
        const types = pickN(rng, unlocked, typeCount);
        const total = 8 + Math.floor(wave * 0.5);
        const pattern = types.map(type => ({
            type, count: Math.max(2, Math.round((total / types.length) * (0.7 + rng() * 0.6)))
        }));
        return { pattern, spawnIntervalScale: 1.0 };
    },
    // A single weak type, spammed at a fast spawn rate.
    rush(rng, unlocked, wave) {
        const weakPool = unlocked.slice(0, Math.max(2, Math.ceil(unlocked.length * 0.6)));
        const type = weakPool[Math.floor(rng() * weakPool.length)];
        const count = 16 + Math.floor(wave * 0.8);
        return { pattern: [{ type, count }], spawnIntervalScale: 0.55 };
    },
    // Chaff to soak attention, escorted by a couple of the strongest unlocked types.
    vanguard(rng, unlocked, wave) {
        const weakPool = unlocked.slice(0, Math.max(1, Math.ceil(unlocked.length * 0.5)));
        const strongPool = unlocked.slice(-Math.max(1, Math.ceil(unlocked.length * 0.4)));
        const chaff = weakPool[Math.floor(rng() * weakPool.length)];
        const escort = strongPool[Math.floor(rng() * strongPool.length)];
        const pattern = [{ type: chaff, count: 8 + Math.floor(wave * 0.4) }];
        if (escort !== chaff) pattern.push({ type: escort, count: Math.max(1, 2 + Math.floor(wave * 0.08)) });
        return { pattern, spawnIntervalScale: 0.95 };
    }
};
const BUILD_NAMES = Object.keys(BUILDS);

function unlockedTypesForWave(wave) {
    const types = [];
    for (const tier of ENEMY_TIERS) {
        if (tier.wave <= wave) types.push(...tier.types);
    }
    return types;
}

// Small deterministic PRNG (mulberry32) seeded per-run so a given sandbox playthrough
// gets a stable sequence of waves, while different runs (different seeds) actually differ.
function mulberry32(seed) {
    let a = seed;
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export class SandboxLevel extends ForestLevel1 {
    static levelId = 'sandbox';
    static levelMetadata = {
        name: 'Eternal Mode',
        difficulty: 'Endless',
        order: 999,
        campaign: 'forest'
    };

    constructor() {
        // Reuses ForestLevel1's terrainElements and createMeanderingPath() unmodified, so
        // sandbox renders and plays out on the exact same map as Findralon (forest level 1)
        // instead of the old procedurally-varied dark sandbox theme.
        super();
        this.levelName = SandboxLevel.levelMetadata.name;
        this.levelNumber = SandboxLevel.levelMetadata.order;
        this.difficulty = SandboxLevel.levelMetadata.difficulty;
        this.isSandbox = true;
        this.maxWaves = Infinity;
        this._seed = (Math.random() * 0xffffffff) >>> 0;
        this._waveConfigCache = new Map();
    }

    /**
     * Randomly generated, tier-gated, "build"-driven waves: each wave rolls a composition
     * archetype (swarm/elite/assault/rush/vanguard - see BUILDS above) and fills it from
     * whichever enemy types are unlocked at this wave number. Every non-boss type is
     * unlocked by FULL_ROSTER_WAVE; from BOSS_START_WAVE on, every BOSS_INTERVAL waves adds
     * a Frog King on top of the rolled build as a milestone threat. Cached per wave number
     * so re-querying the same wave (e.g. a re-render) doesn't reroll it.
     */
    getWaveConfig(wave) {
        wave = Math.max(1, Math.floor(wave));
        if (this._waveConfigCache.has(wave)) return this._waveConfigCache.get(wave);

        const rng = mulberry32(this._seed + wave * 2654435761);
        const unlocked = unlockedTypesForWave(wave);
        const buildName = BUILD_NAMES[Math.floor(rng() * BUILD_NAMES.length)];
        const build = BUILDS[buildName](rng, unlocked, wave);
        const pattern = build.pattern.slice();

        const isBossWave = wave >= BOSS_START_WAVE && (wave - BOSS_START_WAVE) % BOSS_INTERVAL === 0;
        if (isBossWave) {
            // Thin out the regular escort so the boss is the star of the wave, not just
            // another body in an already-large crowd.
            for (const entry of pattern) entry.count = Math.max(1, Math.round(entry.count * 0.5));
            const bossWavesIn = Math.floor((wave - BOSS_START_WAVE) / BOSS_INTERVAL);
            pattern.push({
                type: BOSS_TYPE,
                count: 1,
                healthMultiplier: Math.min(2.2, 0.45 + bossWavesIn * 0.12),
                speedMultiplier: 1
            });
        }

        // Shuffle spawn order so the strongest/boss entry isn't always spawned last.
        for (let i = pattern.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [pattern[i], pattern[j]] = [pattern[j], pattern[i]];
        }

        const config = {
            enemyHealth_multiplier: Math.min(12, 0.8 * Math.pow(1.045, wave - 1)),
            speedMultiplier: Math.min(1.8, 0.7 + wave * 0.007),
            spawnInterval: Math.max(0.32, 1.4 - wave * 0.01) * build.spawnIntervalScale,
            pattern
        };
        this._waveConfigCache.set(wave, config);
        return config;
    }
}

export const levelMetadata = SandboxLevel.levelMetadata;
