import { LevelBase } from '../LevelBase.js';

export class DesertLevel10 extends LevelBase {
    static levelMetadata = {
        name: 'Sacred Sanctuary',
        difficulty: 'Nightmare',
        order: 10,
        campaign: 'desert'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = DesertLevel10.levelMetadata.name;
        this.levelNumber = DesertLevel10.levelMetadata.order;
        this.difficulty = DesertLevel10.levelMetadata.difficulty;
        this.campaign = DesertLevel10.levelMetadata.campaign;
        this.maxWaves = 13;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'water', gridX: 52.00, gridY: 34.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 51.00, gridY: 33.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 51.00, gridY: 32.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 31.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 30.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 29.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 29.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 49.00, gridY: 29.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 49.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 48.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 48.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 47.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 47.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 46.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 46.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 46.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 46.00, gridY: 22.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 46.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 46.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 46.00, gridY: 20.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 46.00, gridY: 20.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 46.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 47.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 47.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 47.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 48.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 48.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 48.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 48.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 48.00, gridY: 13.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 49.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 49.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 49.00, gridY: 11.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 9.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 9.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 1.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 49.00, gridY: 0.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 5.00, size: 4, waterType: 'lake' },
            { type: 'vegetation', gridX: 24.00, gridY: 9.00, size: 3.0410310431270036, variant: 3 },
            { type: 'vegetation', gridX: 25.00, gridY: 4.00, size: 2.4211583987938354, variant: 2 },
            { type: 'vegetation', gridX: 25.00, gridY: 3.00, size: 2.564780459974957, variant: 0 },
            { type: 'vegetation', gridX: 21.00, gridY: 8.00, size: 3.1302550011796617, variant: 2 },
            { type: 'vegetation', gridX: 24.00, gridY: 8.00, size: 3.261829647371568, variant: 1 },
            { type: 'vegetation', gridX: 21.00, gridY: 3.00, size: 2.459516723369214, variant: 2 },
            { type: 'vegetation', gridX: 22.00, gridY: 3.00, size: 2.9961306892648283, variant: 1 },
            { type: 'vegetation', gridX: 18.00, gridY: 9.00, size: 2.817559582369852, variant: 2 },
            { type: 'vegetation', gridX: 19.00, gridY: 8.00, size: 2.2738443376407265, variant: 1 },
            { type: 'vegetation', gridX: 34.00, gridY: 8.00, size: 3.2965361994950872, variant: 1 },
            { type: 'vegetation', gridX: 35.00, gridY: 4.00, size: 2.208721981957432, variant: 1 },
            { type: 'vegetation', gridX: 29.00, gridY: 6.00, size: 3.057858146455509, variant: 1 },
            { type: 'vegetation', gridX: 28.00, gridY: 6.00, size: 2.6037746879249033, variant: 1 },
            { type: 'vegetation', gridX: 26.00, gridY: 8.00, size: 2.0776528823736182, variant: 2 },
            { type: 'vegetation', gridX: 32.00, gridY: 7.00, size: 2.1437731068177803, variant: 0 },
            { type: 'vegetation', gridX: 32.00, gridY: 3.00, size: 2.970942402921825, variant: 3 },
            { type: 'vegetation', gridX: 33.00, gridY: 6.00, size: 3.385245850114825, variant: 1 },
            { type: 'vegetation', gridX: 13.00, gridY: 3.00, size: 2.7935289513209587, variant: 2 },
            { type: 'vegetation', gridX: 13.00, gridY: 3.00, size: 2.5845568367643748, variant: 0 },
            { type: 'vegetation', gridX: 17.00, gridY: 7.00, size: 2.2446150776962535, variant: 2 },
            { type: 'vegetation', gridX: 19.00, gridY: 4.00, size: 3.3011541283956634, variant: 3 },
            { type: 'vegetation', gridX: 14.00, gridY: 3.00, size: 3.0369763976578685, variant: 2 },
            { type: 'vegetation', gridX: 17.00, gridY: 8.00, size: 2.2654919616238596, variant: 0 },
            { type: 'vegetation', gridX: 14.00, gridY: 2.00, size: 3.3855344120145774, variant: 2 },
            { type: 'vegetation', gridX: 40.00, gridY: 2.00, size: 2.86184355851375, variant: 2 },
            { type: 'vegetation', gridX: 41.00, gridY: 7.00, size: 2.6742479787457665, variant: 2 },
            { type: 'vegetation', gridX: 36.00, gridY: 8.00, size: 2.3126794446178893, variant: 1 },
            { type: 'vegetation', gridX: 40.00, gridY: 8.00, size: 2.005028145421117, variant: 3 },
            { type: 'vegetation', gridX: 38.00, gridY: 2.00, size: 3.0067193011484905, variant: 0 },
            { type: 'vegetation', gridX: 36.00, gridY: 8.00, size: 2.488605631218163, variant: 3 },
            { type: 'vegetation', gridX: 39.00, gridY: 6.00, size: 3.4808405321784135, variant: 2 },
            { type: 'vegetation', gridX: 37.00, gridY: 6.00, size: 2.9344640285214396, variant: 3 },
            { type: 'vegetation', gridX: 45.00, gridY: 4.00, size: 2.793425323423548, variant: 1 },
            { type: 'vegetation', gridX: 48.00, gridY: 5.00, size: 2.593364497097605, variant: 2 },
            { type: 'vegetation', gridX: 47.00, gridY: 7.00, size: 2.9886656223462884, variant: 0 },
            { type: 'vegetation', gridX: 42.00, gridY: 5.00, size: 2.6404150474005337, variant: 1 },
            { type: 'vegetation', gridX: 45.00, gridY: 4.00, size: 3.3671865886992416, variant: 3 },
            { type: 'vegetation', gridX: 48.00, gridY: 5.00, size: 3.0846464636520174, variant: 1 },
            { type: 'vegetation', gridX: 46.00, gridY: 5.00, size: 2.4738537573782873, variant: 2 },
            { type: 'vegetation', gridX: 44.00, gridY: 8.00, size: 3.49944897135575, variant: 2 },
            { type: 'vegetation', gridX: 58.00, gridY: 9.00, size: 3.3626104913588026, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 10.00, size: 3.1377118169838676, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 6.00, size: 2.4894869952992362, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 6.00, size: 3.3398008999292785, variant: 3 },
            { type: 'vegetation', gridX: 55.00, gridY: 6.00, size: 2.572988208651803, variant: 2 },
            { type: 'vegetation', gridX: 58.00, gridY: 7.00, size: 3.4053569036797864, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 2.00, size: 3.13459846663016, variant: 1 },
            { type: 'vegetation', gridX: 52.00, gridY: 4.00, size: 2.4490468509784313, variant: 2 },
            { type: 'vegetation', gridX: 55.00, gridY: 8.00, size: 2.2727955310758152, variant: 3 },
            { type: 'vegetation', gridX: 53.00, gridY: 1.00, size: 2.372913399279139, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 15.00, size: 2.043441781381377, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 18.00, size: 2.1900492842187003, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 14.00, size: 2.5251031775510033, variant: 0 },
            { type: 'vegetation', gridX: 52.00, gridY: 17.00, size: 3.391188310645897, variant: 0 },
            { type: 'vegetation', gridX: 51.00, gridY: 16.00, size: 3.3116929503205386, variant: 1 },
            { type: 'vegetation', gridX: 53.00, gridY: 19.00, size: 3.4840669866585183, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 18.00, size: 2.697045517872565, variant: 3 },
            { type: 'vegetation', gridX: 54.00, gridY: 14.00, size: 3.337052721144672, variant: 2 },
            { type: 'vegetation', gridX: 52.00, gridY: 13.00, size: 3.1895895379986774, variant: 1 },
            { type: 'rock', gridX: 10.00, gridY: 2.00, size: 4, variant: 0 },
            { type: 'rock', gridX: 44.00, gridY: 23.00, size: 4, variant: 3 },
            { type: 'rock', gridX: 46.00, gridY: 27.00, size: 4, variant: 2 },
            { type: 'rock', gridX: 49.00, gridY: 23.00, size: 4, variant: 1 },
            { type: 'vegetation', gridX: 45.00, gridY: 29.00, size: 4, variant: 3 },
            { type: 'vegetation', gridX: 43.00, gridY: 24.00, size: 4, variant: 3 },
            { type: 'vegetation', gridX: 51.00, gridY: 23.00, size: 4, variant: 3 },
            { type: 'rock', gridX: 3.00, gridY: 29.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 14.00, gridY: 31.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 3.00, gridY: 22.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 17.00, gridY: 32.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 7.00, gridY: 28.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 3.00, gridY: 18.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 27.00, gridY: 33.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 1.00, gridY: 11.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 5.00, gridY: 33.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 2.00, gridY: 24.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 23.00, gridY: 32.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 7.00, gridY: 24.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 5.00, gridY: 14.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 38.00, gridY: 30.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 29.00, gridY: 10.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 45.00, gridY: 11.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 7.00, gridY: 1.00, size: 2, variant: 3 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 0.00, gridY: 0.00 },
            { gridX: 29.00, gridY: 25.00 },
            { gridX: 52.00, gridY: 25.00 }
        ];

        this.path = pathInGridCoords.map(point => ({
            x: Math.round(point.gridX * this.cellSize),
            y: Math.round(point.gridY * this.cellSize)
        }));
    }

    getWaveConfig(wave) {
        const waveConfigs = [
        // Wave 1
        { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 0.7, 
            spawnInterval: 15, 
            pattern: [{ type: 'earthfrog', count: 1 }, { type: 'waterfrog', count: 1 }, { type: 'firefrog', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 0.7, 
            spawnInterval: 13, 
            pattern: [{ type: 'earthfrog', count: 1 }, { type: 'waterfrog', count: 1 }, { type: 'firefrog', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 0.7, 
            spawnInterval: 11, 
            pattern: [{ type: 'earthfrog', count: 1 }, { type: 'waterfrog', count: 1 }, { type: 'firefrog', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 7, 
            speedMultiplier: 0.7, 
            spawnInterval: 10, 
            pattern: [{ type: 'earthfrog', count: 1 }, { type: 'waterfrog', count: 1 }, { type: 'firefrog', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 8, 
            speedMultiplier: 0.7, 
            spawnInterval: 9, 
            pattern: [{ type: 'earthfrog', count: 1 }, { type: 'waterfrog', count: 1 }, { type: 'firefrog', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 10, 
            speedMultiplier: 0.7, 
            spawnInterval: 8, 
            pattern: [{ type: 'earthfrog', count: 1 }, { type: 'waterfrog', count: 1 }, { type: 'firefrog', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 12, 
            speedMultiplier: 0.7, 
            spawnInterval: 7, 
            pattern: [{ type: 'earthfrog', count: 1 }, { type: 'waterfrog', count: 1 }, { type: 'firefrog', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 15, 
            speedMultiplier: 0.7, 
            spawnInterval: 6, 
            pattern: [{ type: 'earthfrog', count: 1 }, { type: 'waterfrog', count: 1 }, { type: 'firefrog', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 17, 
            speedMultiplier: 0.7, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'earthfrog', count: 4 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 17, 
            speedMultiplier: 0.7, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'firefrog', count: 4 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 17, 
            speedMultiplier: 0.7, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'airfrog', count: 4 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 17, 
            speedMultiplier: 0.7, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'waterfrog', count: 4 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 17.5, 
            speedMultiplier: 0.7, 
            spawnInterval: 4, 
            pattern: [{ type: 'earthfrog', count: 2 }, { type: 'waterfrog', count: 2 }, { type: 'firefrog', count: 2 }, { type: 'airfrog', count: 2 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}