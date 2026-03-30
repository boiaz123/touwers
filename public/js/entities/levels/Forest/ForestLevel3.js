import { LevelBase } from '../LevelBase.js';

export class ForestLevel3 extends LevelBase {
    static levelMetadata = {
        name: 'The Reach',
        difficulty: 'Easy',
        order: 3,
        campaign: 'forest'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = ForestLevel3.levelMetadata.name;
        this.levelNumber = ForestLevel3.levelMetadata.order;
        this.difficulty = ForestLevel3.levelMetadata.difficulty;
        this.campaign = ForestLevel3.levelMetadata.campaign;
        this.maxWaves = 14;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'water', gridX: 29.00, gridY: 34.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 28.00, gridY: 33.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 28.00, gridY: 32.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 31.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 26.00, gridY: 30.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 26.00, gridY: 30.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 25.00, gridY: 29.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 25.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 24.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 24.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 24.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 22.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 22.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 22.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 22.00, gridY: 22.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 20.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 20.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 24.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 25.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 26.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 28.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 28.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 29.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 29.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 31.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 34.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 34.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 13.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 13.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 13.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 38.00, gridY: 13.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 39.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 40.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 40.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 40.00, gridY: 11.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 41.00, gridY: 11.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 41.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 42.00, gridY: 9.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 42.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 42.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 43.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 43.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 43.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 43.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 44.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 44.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 44.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 44.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 44.00, gridY: 1.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 44.00, gridY: 0.00, size: 1.5, waterType: 'river' },
            { type: 'vegetation', gridX: 46.00, gridY: 27.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 48.00, gridY: 26.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 47.00, gridY: 24.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 48.00, gridY: 24.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 47.00, gridY: 26.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 52.00, gridY: 25.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 52.00, gridY: 24.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 24.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 26.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 55.00, gridY: 28.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 30.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 32.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 51.00, gridY: 32.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 50.00, gridY: 31.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 47.00, gridY: 32.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 43.00, gridY: 33.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 41.00, gridY: 33.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 37.00, gridY: 32.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 48.00, gridY: 23.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 32.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 31.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 27.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 22.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 20.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 25.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 55.00, gridY: 25.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 20.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 11.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 4.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 52.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 2.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 55.00, gridY: 4.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 7.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 7.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 46.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 45.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 42.00, gridY: 2.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 42.00, gridY: 0.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 45.00, gridY: 3.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 45.00, gridY: 7.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 44.00, gridY: 9.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 45.00, gridY: 10.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 41.00, gridY: 7.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 40.00, gridY: 3.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 38.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 35.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 34.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 40.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 38.00, gridY: 2.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 36.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 38.00, gridY: 33.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 45.00, gridY: 33.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 50.00, gridY: 34.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 30.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 26.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 54.00, gridY: 27.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 58.00, gridY: 24.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 22.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 14.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 9.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 9.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 4.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 1.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 51.00, gridY: 1.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 40.00, gridY: 2.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 38.00, gridY: 3.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 37.00, gridY: 2.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 33.00, gridY: 2.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 32.00, gridY: 1.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 46.00, gridY: 2.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 49.00, gridY: 1.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 6.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 10.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 15.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 18.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 43.00, gridY: 10.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 40.00, gridY: 8.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 35.00, gridY: 2.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 55.00, gridY: 2.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 12.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 54.00, gridY: 19.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 28.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 58.00, gridY: 32.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 52.00, gridY: 30.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 48.00, gridY: 32.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 34.00, gridY: 33.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 26.00, gridY: 26.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 24.00, gridY: 23.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 56.00, gridY: 30.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 29.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 23.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 17.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 6.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 53.00, gridY: 3.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 30.00, gridY: 1.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 39.00, gridY: 9.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 26.00, gridY: 24.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 25.00, gridY: 21.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 21.00, gridY: 20.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 21.00, gridY: 25.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 23.00, gridY: 31.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 11.00, gridY: 33.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 14.00, gridY: 33.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 16.00, gridY: 30.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 17.00, gridY: 27.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 20.00, gridY: 25.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 20.00, gridY: 23.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 20.00, gridY: 29.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 24.00, gridY: 33.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 26.00, gridY: 33.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 20.00, gridY: 32.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 17.00, gridY: 33.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 15.00, gridY: 30.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 12.00, gridY: 31.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 8.00, gridY: 32.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 15.00, gridY: 32.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 18.00, gridY: 29.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 19.00, gridY: 27.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 22.00, gridY: 28.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 28.00, gridY: 30.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 32.00, gridY: 31.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 32.00, gridY: 33.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 28.00, gridY: 28.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 17.00, gridY: 31.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 10.00, gridY: 32.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 15.00, gridY: 28.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 22.00, gridY: 32.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 19.00, gridY: 31.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 21.00, gridY: 27.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 18.00, gridY: 25.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 20.00, gridY: 22.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 25.00, gridY: 19.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 0.00, gridY: 5.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 2.00, gridY: 5.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 5.00, gridY: 4.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 7.00, gridY: 1.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 3.00, gridY: 2.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 3.00, gridY: 7.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 8.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 3.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 4.00, gridY: 4.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 2.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 3.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 10.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 6.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 1.00, gridY: 6.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 8.00, gridY: 3.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 7.00, gridY: 6.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 4.00, gridY: 8.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 13.00, gridY: 3.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 17.00, gridY: 1.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 10.00, gridY: 5.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 46.00, gridY: 26.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 48.00, gridY: 22.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 55.00, gridY: 32.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 58.00, gridY: 22.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 56.00, gridY: 7.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 21.00, gridY: 30.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 13.00, gridY: 31.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 18.00, gridY: 32.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 25.00, gridY: 24.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 8.00, gridY: 5.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 42.00, gridY: 11.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 31.00, gridY: 2.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 52.00, gridY: 3.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 55.00, gridY: 20.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 56.00, gridY: 3.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 40.00, gridY: 33.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 6.00, gridY: 33.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 2.00, gridY: 10.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 3.00, gridY: 4.00, size: 2, variant: 3 },
            { type: 'water', gridX: 40.00, gridY: 23.00, size: 5, waterType: 'lake' },
            { type: 'water', gridX: 16.00, gridY: 4.00, size: 4, waterType: 'lake' }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 0.00, gridY: 16.00 },
            { gridX: 17.00, gridY: 16.00 },
            { gridX: 29.00, gridY: 5.00 },
            { gridX: 50.00, gridY: 5.00 },
            { gridX: 50.00, gridY: 28.00 },
            { gridX: 35.00, gridY: 28.00 },
            { gridX: 35.00, gridY: 18.00 },
            { gridX: 42.00, gridY: 18.00 }
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
            enemyCount: 12, 
            enemyHealth_multiplier: 1, 
            enemySpeed: 30, 
            spawnInterval: 2, 
            pattern: ['basic', 'villager'] 
        }
        // Wave 2
        , { 
            enemyCount: 14, 
            enemyHealth_multiplier: 1, 
            enemySpeed: 30, 
            spawnInterval: 1.8, 
            pattern: ['basic', 'villager'] 
        }
        // Wave 3
        , { 
            enemyCount: 20, 
            enemyHealth_multiplier: 1.2, 
            enemySpeed: 35, 
            spawnInterval: 1.5, 
            pattern: ['basic', 'villager'] 
        }
        // Wave 4
        , { 
            enemyCount: 4, 
            enemyHealth_multiplier: 4, 
            enemySpeed: 400, 
            spawnInterval: 3, 
            pattern: ['beefyenemy'] 
        }
        // Wave 5
        , { 
            enemyCount: 18, 
            enemyHealth_multiplier: 1.2, 
            enemySpeed: 200, 
            spawnInterval: 3, 
            pattern: ['archer'] 
        }
        // Wave 6
        , { 
            enemyCount: 18, 
            enemyHealth_multiplier: 2, 
            enemySpeed: 50, 
            spawnInterval: 2, 
            pattern: ['basic', 'villager', 'archer', 'beefyenemy'] 
        }
        // Wave 7
        , { 
            enemyCount: 15, 
            enemyHealth_multiplier: 2, 
            enemySpeed: 200, 
            spawnInterval: 1.5, 
            pattern: ['archer'] 
        }
        // Wave 8
        , { 
            enemyCount: 25, 
            enemyHealth_multiplier: 1.5, 
            enemySpeed: 45, 
            spawnInterval: 2, 
            pattern: ['basic', 'villager'] 
        }
        // Wave 9
        , { 
            enemyCount: 14, 
            enemyHealth_multiplier: 3, 
            enemySpeed: 50, 
            spawnInterval: 2.5, 
            pattern: ['beefyenemy'] 
        }
        // Wave 10
        , { 
            enemyCount: 1, 
            enemyHealth_multiplier: 5, 
            enemySpeed: 75, 
            spawnInterval: 7, 
            pattern: ['knight'] 
        }
        // Wave 11
        , { 
            enemyCount: 35, 
            enemyHealth_multiplier: 2, 
            enemySpeed: 85, 
            spawnInterval: 3, 
            pattern: ['archer'] 
        }
        // Wave 12
        , { 
            enemyCount: 10, 
            enemyHealth_multiplier: 4, 
            enemySpeed: 55, 
            spawnInterval: 0.5, 
            pattern: ['beefyenemy'] 
        }
        // Wave 13
        , { 
            enemyCount: 35, 
            enemyHealth_multiplier: 2, 
            enemySpeed: 35, 
            spawnInterval: 1, 
            pattern: ['basic', 'villager'] 
        }
        // Wave 14
        , { 
            enemyCount: 1, 
            enemyHealth_multiplier: 15, 
            enemySpeed: 35, 
            spawnInterval: 1, 
            pattern: ['knight'] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}