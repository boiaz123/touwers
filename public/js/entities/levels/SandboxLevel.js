import { ForestLevel1 } from './Forest/ForestLevel1.js';

/**
 * The eternal-mode enemy roster. Each entry has:
 *  - minWave: the earliest wave this type is allowed to appear at all. Low-tier grunts
 *    unlock immediately so the opening waves read as a real, learnable difficulty curve
 *    (wave 1-2: basic/villager/archer only, wave 3-4: + captains) instead of dumping the
 *    whole bestiary on the player at once. From wave 5 the rest of the "normal" roster
 *    (shieldknight/mage/frog) is available - "anything can come" - but the notably
 *    dangerous/late-game types (knight, ramcart, the elemental frogs, the goliath frog)
 *    keep their own later thresholds so they stay milestones rather than wave-1 noise.
 *  - difficulty: a relative threat score (roughly derived from health/speed/armour) used
 *    to WEIGHT random selection, not to gate it - harder types are rarer picks throughout,
 *    tapering the swarm-of-chaff / handful-of-elites feel as waves escalate.
 * The Frog King is intentionally not in this table - he's a milestone boss spawn, handled
 * separately below via BOSS_START_WAVE, so he never gets folded into the regular RNG soup.
 */
const ENEMY_ROSTER = {
    basic: { minWave: 1, difficulty: 1.0 },
    villager: { minWave: 1, difficulty: 1.1 },
    archer: { minWave: 1, difficulty: 1.6 },
    beefyenemy: { minWave: 3, difficulty: 3.2 },
    shieldknight: { minWave: 5, difficulty: 4.5 },
    mage: { minWave: 5, difficulty: 4.8 },
    frog: { minWave: 5, difficulty: 1.8 },
    knight: { minWave: 10, difficulty: 7.5 },
    ramcart: { minWave: 15, difficulty: 5.5 },
    earthfrog: { minWave: 20, difficulty: 2.6 },
    waterfrog: { minWave: 22, difficulty: 2.4 },
    firefrog: { minWave: 24, difficulty: 2.4 },
    airfrog: { minWave: 26, difficulty: 2.3 },
    walkingfrog: { minWave: 30, difficulty: 8.5 }
};

// The Frog King returns as a rare, escalating milestone threat once the player is deep
// into a run - a nod to the boss they already beat to unlock sandbox in the first place.
// Scaled independently of the fodder health multiplier (see below): at BOSS_START_WAVE
// he's a weakened echo of the real fight, and slowly grows tougher every BOSS_INTERVAL
// waves after that.
const BOSS_TYPE = 'frogking';
const BOSS_START_WAVE = 40;
const BOSS_INTERVAL = 20;

// How quickly a freshly-unlocked type ramps from "rare surprise" up to its full,
// difficulty-based weight. age=0 (the wave it unlocks on) starts at RAMP_BASE of full
// weight, reaching full weight after RAMP_WAVES waves of availability.
const RAMP_BASE = 0.15;
const RAMP_WAVES = 17;

/**
 * The set of types allowed at this wave, each carrying a random-selection weight that's
 * inversely proportional to difficulty (so harder enemies are picked less often) and
 * scaled by how long the type has been unlocked (so new arrivals ease in rather than
 * flooding the wave the moment they're available). Sorted ascending by difficulty so
 * callers can slice the weak/strong ends of the roster for archetype-specific pools.
 */
function rosterForWave(wave) {
    const entries = [];
    for (const type in ENEMY_ROSTER) {
        const def = ENEMY_ROSTER[type];
        if (def.minWave > wave) continue;
        const ramp = Math.min(1, RAMP_BASE + (wave - def.minWave) * (1 - RAMP_BASE) / RAMP_WAVES);
        entries.push({ type, difficulty: def.difficulty, weight: ramp / def.difficulty });
    }
    entries.sort((a, b) => a.difficulty - b.difficulty);
    return entries;
}

/** Weighted, without-replacement draw of up to n distinct types from a roster slice. */
function pickWeighted(rng, entries, n) {
    const pool = entries.slice();
    const picked = [];
    n = Math.min(n, pool.length);
    for (let i = 0; i < n; i++) {
        const total = pool.reduce((sum, e) => sum + e.weight, 0);
        let roll = rng() * total;
        let idx = pool.length - 1;
        for (let j = 0; j < pool.length; j++) {
            roll -= pool[j].weight;
            if (roll <= 0) { idx = j; break; }
        }
        picked.push(pool[idx].type);
        pool.splice(idx, 1);
    }
    return picked;
}

/** Randomly splits `total` head-count across `types`, every type getting at least 1. */
function splitAmong(rng, types, total) {
    const weights = types.map(() => 0.5 + rng());
    const weightSum = weights.reduce((a, b) => a + b, 0);
    const counts = weights.map(w => Math.max(1, Math.round((w / weightSum) * total)));
    let diff = total - counts.reduce((a, b) => a + b, 0);
    while (diff !== 0) {
        const idx = Math.floor(rng() * counts.length);
        if (diff > 0) { counts[idx]++; diff--; }
        else if (counts[idx] > 1) { counts[idx]--; diff++; }
    }
    return types.map((type, i) => ({ type, count: counts[i] }));
}

// The first few waves skip the RNG "builds" below entirely: they're the player's intro to
// eternal mode, so instead of leaving it to chance they get a fixed, guaranteed headcount
// and (from wave 3) a guaranteed captain squad, with only the exact mix/split randomized.
const EARLY_WAVES = 4;
const EARLY_WAVE_ENEMY_COUNT = 20;
const CAPTAIN_WAVE = 3;

/**
 * Waves 1-2: EARLY_WAVE_ENEMY_COUNT basic/villager/archer, split randomly across 1-3 of
 * those types. Waves 3-4: a guaranteed handful of beefyenemy (captains) - not just possible,
 * always present - plus the rest of the headcount filled from basic/villager/archer.
 */
function earlyWaveConfig(rng, wave) {
    const chaffPool = rosterForWave(wave).filter(e => e.type !== 'beefyenemy');
    const chaffTypeCount = 1 + Math.floor(rng() * Math.min(3, chaffPool.length));
    const chaffTypes = pickWeighted(rng, chaffPool, chaffTypeCount);

    if (wave < CAPTAIN_WAVE) {
        return splitAmong(rng, chaffTypes, EARLY_WAVE_ENEMY_COUNT);
    }

    const captainCount = 3 + Math.floor(rng() * 3);
    return [
        { type: 'beefyenemy', count: captainCount },
        ...splitAmong(rng, chaffTypes, EARLY_WAVE_ENEMY_COUNT - captainCount)
    ];
}

/**
 * "Builds" - composition archetypes a wave can roll, so waves read as intentional
 * (a swarm, an elite squad, a rush) instead of uniformly random noise. Each returns a
 * wave pattern ({type, count}[]) drawn (weighted by difficulty) from the roster currently
 * unlocked at this wave, plus a spawn interval multiplier that gives the archetype its
 * own pacing.
 */
const BUILDS = {
    // A big block of the weakest currently-unlocked chaff, arriving fast.
    swarm(rng, roster, wave) {
        const weakPool = roster.slice(0, Math.max(2, Math.ceil(roster.length * 0.6)));
        const types = pickWeighted(rng, weakPool, rng() < 0.35 ? 2 : 1);
        const total = 10 + Math.floor(wave * 0.6);
        const pattern = types.map(type => ({ type, count: Math.max(4, Math.round(total / types.length)) }));
        return { pattern, spawnIntervalScale: 0.85 };
    },
    // A handful of the toughest currently-unlocked types, arriving with room to breathe.
    elite(rng, roster, wave) {
        const strongPool = roster.slice(-Math.max(2, Math.ceil(roster.length * 0.45)));
        const types = pickWeighted(rng, strongPool, rng() < 0.5 ? 2 : 1);
        const total = 3 + Math.floor(wave * 0.15);
        const pattern = types.map(type => ({ type, count: Math.max(2, Math.round(total / types.length)) }));
        return { pattern, spawnIntervalScale: 1.3 };
    },
    // A broad, unpredictable spread across most of the unlocked roster.
    assault(rng, roster, wave) {
        const typeCount = Math.min(roster.length, 3 + Math.floor(rng() * 3));
        const types = pickWeighted(rng, roster, typeCount);
        const total = 8 + Math.floor(wave * 0.5);
        const pattern = types.map(type => ({
            type, count: Math.max(2, Math.round((total / types.length) * (0.7 + rng() * 0.6)))
        }));
        return { pattern, spawnIntervalScale: 1.0 };
    },
    // A single weak type, spammed at a fast spawn rate.
    rush(rng, roster, wave) {
        const weakPool = roster.slice(0, Math.max(2, Math.ceil(roster.length * 0.7)));
        const type = pickWeighted(rng, weakPool, 1)[0];
        const count = 16 + Math.floor(wave * 0.8);
        return { pattern: [{ type, count }], spawnIntervalScale: 0.55 };
    },
    // Chaff to soak attention, escorted by a couple of the strongest unlocked types.
    vanguard(rng, roster, wave) {
        const weakPool = roster.slice(0, Math.max(1, Math.ceil(roster.length * 0.5)));
        const strongPool = roster.slice(-Math.max(1, Math.ceil(roster.length * 0.4)));
        const chaff = pickWeighted(rng, weakPool, 1)[0];
        const escort = pickWeighted(rng, strongPool, 1)[0];
        const pattern = [{ type: chaff, count: 8 + Math.floor(wave * 0.4) }];
        if (escort !== chaff) pattern.push({ type: escort, count: Math.max(1, 2 + Math.floor(wave * 0.08)) });
        return { pattern, spawnIntervalScale: 0.95 };
    }
};
const BUILD_NAMES = Object.keys(BUILDS);

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
     * Waves 1-EARLY_WAVES are fixed-headcount intro waves (see earlyWaveConfig above) so
     * the player always gets a real fight, with captains guaranteed from CAPTAIN_WAVE.
     * From there on, waves are randomly generated, threshold-gated, and "build"-driven:
     * each wave rolls a composition archetype (swarm/elite/assault/rush/vanguard - see
     * BUILDS above) and fills it from whichever roster entries are unlocked at this wave
     * number, weighted so tougher types are rarer picks (see rosterForWave/ENEMY_ROSTER
     * above). From BOSS_START_WAVE on, every BOSS_INTERVAL waves adds a Frog King on top
     * of the rolled build as a milestone threat. Cached per wave number so re-querying the
     * same wave (e.g. a re-render) doesn't reroll it.
     */
    getWaveConfig(wave) {
        wave = Math.max(1, Math.floor(wave));
        if (this._waveConfigCache.has(wave)) return this._waveConfigCache.get(wave);

        const rng = mulberry32(this._seed + wave * 2654435761);
        let pattern;
        let spawnIntervalScale = 1.0;
        if (wave <= EARLY_WAVES) {
            pattern = earlyWaveConfig(rng, wave);
        } else {
            const roster = rosterForWave(wave);
            const buildName = BUILD_NAMES[Math.floor(rng() * BUILD_NAMES.length)];
            const build = BUILDS[buildName](rng, roster, wave);
            pattern = build.pattern.slice();
            spawnIntervalScale = build.spawnIntervalScale;
        }

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
            spawnInterval: Math.max(0.32, 1.4 - wave * 0.01) * spawnIntervalScale,
            pattern
        };
        this._waveConfigCache.set(wave, config);
        return config;
    }
}

export const levelMetadata = SandboxLevel.levelMetadata;
