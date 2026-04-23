import { LevelBase } from '../LevelBase.js';

export class ForestLevel10 extends LevelBase {
    static levelMetadata = {
        name: 'Lush Fields',
        difficulty: 'Medium',
        order: 10,
        campaign: 'forest'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = ForestLevel10.levelMetadata.name;
        this.levelNumber = ForestLevel10.levelMetadata.order;
        this.difficulty = ForestLevel10.levelMetadata.difficulty;
        this.campaign = ForestLevel10.levelMetadata.campaign;
        this.maxWaves = 7;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'water', gridX: 54.00, gridY: 34.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 54.00, gridY: 33.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 54.00, gridY: 32.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 54.00, gridY: 31.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 54.00, gridY: 30.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 54.00, gridY: 29.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 54.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 54.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 53.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 53.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 53.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 53.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 52.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 52.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 52.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 51.00, gridY: 22.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 22.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 49.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 48.00, gridY: 20.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 48.00, gridY: 20.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 48.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 47.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 47.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 46.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 45.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 45.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 44.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 44.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 44.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 44.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 44.00, gridY: 13.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 44.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 44.00, gridY: 11.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 43.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 43.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 43.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 44.00, gridY: 9.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 44.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 44.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 45.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 45.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 45.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 45.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 46.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 46.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 46.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 47.00, gridY: 1.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 47.00, gridY: 0.00, size: 1.5, waterType: 'river' },
            { type: 'vegetation', gridX: 5.00, gridY: 31.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 12.00, gridY: 32.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 19.00, gridY: 29.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 26.00, gridY: 31.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 44.00, gridY: 32.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 46.00, gridY: 28.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 39.00, gridY: 29.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 9.00, gridY: 26.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 23.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 2.00, gridY: 18.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 13.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 3.00, gridY: 7.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 2.00, gridY: 3.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 1.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 27.00, gridY: 0.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 33.00, gridY: 2.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 40.00, gridY: 1.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 43.00, gridY: 1.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 49.00, gridY: 2.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 50.00, gridY: 0.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 54.00, gridY: 0.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 58.00, gridY: 1.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 6.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 13.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 58.00, gridY: 26.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 21.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 18.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 10.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 5.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 27.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 50.00, gridY: 29.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 50.00, gridY: 32.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 51.00, gridY: 27.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 46.00, gridY: 30.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 40.00, gridY: 31.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 28.00, gridY: 32.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 21.00, gridY: 31.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 9.00, gridY: 30.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 2.00, gridY: 13.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 4.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 31.00, gridY: 1.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 36.00, gridY: 1.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 53.00, gridY: 3.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 4.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 9.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 58.00, gridY: 17.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 25.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 31.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 47.00, gridY: 26.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 42.00, gridY: 28.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 16.00, gridY: 32.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 12.00, gridY: 28.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 27.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 20.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 16.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 7.00, gridY: 18.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 11.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 2.00, gridY: 10.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 5.00, gridY: 6.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 23.00, gridY: 1.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 28.00, gridY: 4.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 36.00, gridY: 4.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 39.00, gridY: 2.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 49.00, gridY: 4.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 54.00, gridY: 5.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 12.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 16.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 58.00, gridY: 20.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 23.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 58.00, gridY: 29.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 32.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 47.00, gridY: 33.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 36.00, gridY: 33.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 10.00, gridY: 3.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 14.00, gridY: 3.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 15.00, gridY: 1.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 19.00, gridY: 1.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 46.00, gridY: 10.00, size: 3, variant: 1 },
            { type: 'vegetation', gridX: 10.00, gridY: 23.00, size: 3, variant: 1 },
            { type: 'vegetation', gridX: 5.00, gridY: 9.00, size: 3, variant: 1 },
            { type: 'vegetation', gridX: 30.00, gridY: 14.00, size: 3, variant: 1 },
            { type: 'vegetation', gridX: 32.00, gridY: 4.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 39.00, gridY: 4.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 48.00, gridY: 5.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 56.00, gridY: 8.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 55.00, gridY: 2.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 58.00, gridY: 15.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 56.00, gridY: 12.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 55.00, gridY: 21.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 58.00, gridY: 24.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 55.00, gridY: 30.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 52.00, gridY: 31.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 42.00, gridY: 32.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 32.00, gridY: 32.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 25.00, gridY: 32.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 21.00, gridY: 29.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 19.00, gridY: 32.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 15.00, gridY: 29.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 7.00, gridY: 32.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 6.00, gridY: 29.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 29.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 26.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 22.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 6.00, gridY: 25.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 5.00, gridY: 17.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 15.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 6.00, gridY: 13.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 5.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 6.00, gridY: 2.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 8.00, gridY: 3.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 17.00, gridY: 2.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 18.00, gridY: 1.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 21.00, gridY: 1.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 25.00, gridY: 3.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 29.00, gridY: 2.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 37.00, gridY: 2.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 38.00, gridY: 5.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 42.00, gridY: 3.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 47.00, gridY: 6.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 21.00, gridY: 3.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 7.00, gridY: 6.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 6.00, gridY: 3.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 5.00, gridY: 14.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 18.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 15.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 9.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 10.00, gridY: 29.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 7.00, gridY: 27.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 5.00, gridY: 23.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 32.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 6.00, gridY: 33.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 27.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 10.00, gridY: 32.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 14.00, gridY: 32.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 12.00, gridY: 30.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 23.00, gridY: 32.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 37.00, gridY: 32.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 43.00, gridY: 30.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 45.00, gridY: 27.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 55.00, gridY: 19.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 54.00, gridY: 23.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 49.00, gridY: 26.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 48.00, gridY: 29.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 52.00, gridY: 33.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 43.00, gridY: 5.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 41.00, gridY: 3.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 35.00, gridY: 1.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 27.00, gridY: 2.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 25.00, gridY: 1.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 22.00, gridY: 4.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 19.00, gridY: 5.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 18.00, gridY: 9.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 40.00, gridY: 8.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 7.00, gridY: 8.00, size: 1.5, variant: 0 },
            { type: 'rock', gridX: 6.00, gridY: 21.00, size: 1.5, variant: 0 },
            { type: 'rock', gridX: 6.00, gridY: 26.00, size: 1.5, variant: 0 },
            { type: 'rock', gridX: 5.00, gridY: 27.00, size: 1.5, variant: 0 },
            { type: 'rock', gridX: 8.00, gridY: 30.00, size: 1.5, variant: 0 },
            { type: 'rock', gridX: 9.00, gridY: 33.00, size: 1.5, variant: 0 },
            { type: 'rock', gridX: 14.00, gridY: 30.00, size: 1.5, variant: 0 },
            { type: 'rock', gridX: 17.00, gridY: 30.00, size: 1.5, variant: 0 },
            { type: 'rock', gridX: 21.00, gridY: 33.00, size: 1.5, variant: 0 },
            { type: 'rock', gridX: 24.00, gridY: 31.00, size: 1.5, variant: 0 },
            { type: 'rock', gridX: 48.00, gridY: 31.00, size: 1.5, variant: 0 },
            { type: 'rock', gridX: 57.00, gridY: 29.00, size: 1.5, variant: 0 },
            { type: 'rock', gridX: 56.00, gridY: 13.00, size: 1.5, variant: 0 },
            { type: 'rock', gridX: 58.00, gridY: 11.00, size: 1.5, variant: 0 },
            { type: 'rock', gridX: 57.00, gridY: 6.00, size: 1.5, variant: 0 },
            { type: 'rock', gridX: 53.00, gridY: 4.00, size: 1.5, variant: 0 },
            { type: 'rock', gridX: 43.00, gridY: 3.00, size: 1.5, variant: 0 },
            { type: 'rock', gridX: 30.00, gridY: 33.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 6.00, gridY: 19.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 54.00, gridY: 9.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 18.00, gridY: 3.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 30.00, gridY: 3.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 44.00, gridY: 2.00, size: 1.5, variant: 2 },
            { type: 'rock', gridX: 58.00, gridY: 7.00, size: 1.5, variant: 2 },
            { type: 'rock', gridX: 32.00, gridY: 14.00, size: 1.5, variant: 2 },
            { type: 'water', gridX: 37.00, gridY: 17.00, size: 1.5, waterType: 'lake' },
            { type: 'vegetation', gridX: 36.00, gridY: 18.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 38.00, gridY: 18.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 36.00, gridY: 16.00, size: 1.5, variant: 1 },
            { type: 'rock', gridX: 39.00, gridY: 33.00, size: 1.5, variant: 0 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 12.00, gridY: 0.00 },
            { gridX: 12.00, gridY: 14.00 },
            { gridX: 17.00, gridY: 20.00 },
            { gridX: 28.00, gridY: 20.00 },
            { gridX: 28.00, gridY: 12.00 },
            { gridX: 34.00, gridY: 12.00 },
            { gridX: 34.00, gridY: 20.00 },
            { gridX: 42.00, gridY: 20.00 },
            { gridX: 51.00, gridY: 16.00 },
            { gridX: 51.00, gridY: 10.00 }
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
            enemyHealth_multiplier: 1, 
            speedMultiplier: 0.90, 
            spawnInterval: 0.4, 
            pattern: [{ type: 'basic', count: 27 }, { type: 'villager', count: 18 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 1.30, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'basic', count: 30 }, { type: 'villager', count: 30 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 2.42, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 45 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 3.55, 
            speedMultiplier: 0.58, 
            spawnInterval: 1.4, 
            pattern: [{ type: 'beefyenemy', count: 40 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1.57, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'shieldknight', count: 12 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1.29, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'shieldknight', count: 3 }, { type: 'knight', count: 1 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 9, 
            speedMultiplier: 1.13, 
            spawnInterval: 1.2, 
            pattern: [{ type: 'knight', count: 1 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}