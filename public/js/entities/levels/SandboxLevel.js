import { ForestLevel1 } from './Forest/ForestLevel1.js';

// Every registered enemy type except the Frog King boss (see EnemyRegistry) - one of each
// spawns per wave, so the wave itself is the roster; only stats scale between waves.
const SANDBOX_ENEMY_TYPES = [
    'basic', 'villager', 'archer', 'mage', 'knight', 'shieldknight', 'beefyenemy',
    'ramcart', 'walkingfrog', 'frog', 'earthfrog', 'waterfrog', 'firefrog', 'airfrog'
];

const SANDBOX_WAVE_COUNT = 100;
const SANDBOX_PATTERN = SANDBOX_ENEMY_TYPES.map(type => ({ type, count: 1 }));

export class SandboxLevel extends ForestLevel1 {
    static levelId = 'sandbox';
    static levelMetadata = {
        name: 'Sandbox Mode',
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
        this.maxWaves = SANDBOX_WAVE_COUNT;
    }

    /**
     * One of every enemy type (Frog King excluded) per wave, gradually getting stronger
     * over 100 waves. Wave 100's stats keep being reused for any wave beyond that, since
     * sandbox never actually completes (see GameplayState.completeLevel's isSandbox
     * early-return) and getWaveConfig() must still return something sensible forever.
     */
    getWaveConfig(wave) {
        const w = Math.min(Math.max(wave, 1), SANDBOX_WAVE_COUNT) - 1; // 0-based progress toward wave 100

        return {
            enemyHealth_multiplier: 0.8 * Math.pow(1.045, w),
            speedMultiplier: Math.min(1.6, 0.7 + w * 0.007),
            spawnInterval: Math.max(0.4, 1.4 - w * 0.01),
            pattern: SANDBOX_PATTERN
        };
    }
}

export const levelMetadata = SandboxLevel.levelMetadata;
