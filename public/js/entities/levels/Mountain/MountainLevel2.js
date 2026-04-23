import { LevelBase } from '../LevelBase.js';

export class MountainLevel2 extends LevelBase {
    static levelMetadata = {
        name: 'Morwen\'s Deep',
        difficulty: 'Medium',
        order: 2,
        campaign: 'mountain'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = MountainLevel2.levelMetadata.name;
        this.levelNumber = MountainLevel2.levelMetadata.order;
        this.difficulty = MountainLevel2.levelMetadata.difficulty;
        this.campaign = MountainLevel2.levelMetadata.campaign;
        this.maxWaves = 23;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'water', gridX: 20.00, gridY: 34.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 33.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 32.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 21.00, gridY: 31.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 21.00, gridY: 30.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 21.00, gridY: 30.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 21.00, gridY: 29.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 22.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 22.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 22.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 24.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 25.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 25.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 26.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 22.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 28.00, gridY: 22.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 28.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 29.00, gridY: 20.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 29.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 29.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 29.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 29.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 13.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 11.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 29.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 29.00, gridY: 9.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 29.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 28.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 28.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 28.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 28.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 28.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 28.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 1.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 0.00, size: 1.5, waterType: 'river' },
            { type: 'vegetation', gridX: 4.00, gridY: 32.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 29.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 24.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 29.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 9.00, gridY: 32.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 14.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 6.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 12.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 2.00, gridY: 19.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 5.00, gridY: 26.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 6.00, gridY: 30.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 12.00, gridY: 33.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 14.00, gridY: 33.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 1.00, gridY: 26.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 21.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 15.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 10.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 4.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 13.00, gridY: 32.00, size: 1.5, variant: 3 },
            { type: 'vegetation', gridX: 1.00, gridY: 23.00, size: 1.5, variant: 3 },
            { type: 'vegetation', gridX: 9.00, gridY: 29.00, size: 1.5, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 17.00, size: 1.5, variant: 3 },
            { type: 'vegetation', gridX: 1.00, gridY: 8.00, size: 1.5, variant: 3 },
            { type: 'vegetation', gridX: 11.00, gridY: 31.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 33.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 2.00, gridY: 32.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 2.00, gridY: 28.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 28.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 5.00, gridY: 22.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 4.00, gridY: 19.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 2.00, gridY: 16.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 4.00, gridY: 12.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 2.00, gridY: 10.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 2.00, gridY: 7.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 5.00, gridY: 4.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 2.00, gridY: 3.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 4.00, gridY: 28.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 26.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 17.00, gridY: 33.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 14.00, gridY: 30.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 10.00, gridY: 28.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 8.00, gridY: 31.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 8.00, gridY: 27.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 21.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 16.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 12.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 4.00, gridY: 7.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 24.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 12.00, gridY: 30.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 15.00, gridY: 32.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 30.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 1.00, gridY: 30.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 1.00, gridY: 18.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 0.00, gridY: 14.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 1.00, gridY: 10.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 4.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 3.00, gridY: 2.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 16.00, gridY: 31.00, size: 2.5, variant: 2 },
            { type: 'vegetation', gridX: 10.00, gridY: 33.00, size: 2.5, variant: 2 },
            { type: 'vegetation', gridX: 10.00, gridY: 30.00, size: 2.5, variant: 2 },
            { type: 'vegetation', gridX: 7.00, gridY: 25.00, size: 2.5, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 24.00, size: 2.5, variant: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 14.00, size: 2.5, variant: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 9.00, size: 2.5, variant: 2 },
            { type: 'vegetation', gridX: 1.00, gridY: 5.00, size: 2.5, variant: 2 },
            { type: 'vegetation', gridX: 5.00, gridY: 31.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 33.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 4.00, gridY: 21.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 23.00, gridY: 33.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 24.00, gridY: 31.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 29.00, gridY: 33.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 54.00, gridY: 33.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 30.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 25.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 20.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 17.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 54.00, gridY: 15.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 55.00, gridY: 10.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 9.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 11.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 54.00, gridY: 6.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 51.00, gridY: 4.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 2.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 3.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 54.00, gridY: 2.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 50.00, gridY: 1.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 47.00, gridY: 0.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 47.00, gridY: 2.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 48.00, gridY: 4.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 51.00, gridY: 9.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 13.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 15.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 25.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 54.00, gridY: 28.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 50.00, gridY: 31.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 48.00, gridY: 33.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 32.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 51.00, gridY: 33.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 30.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 28.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 22.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 55.00, gridY: 24.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 19.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 16.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 13.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 8.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 4.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 6.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 9.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 51.00, gridY: 7.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 48.00, gridY: 7.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 45.00, gridY: 3.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 43.00, gridY: 2.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 50.00, gridY: 3.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 52.00, gridY: 1.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 3.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 55.00, gridY: 1.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 1.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 12.00, size: 3, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 8.00, size: 3, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 5.00, size: 3, variant: 1 },
            { type: 'vegetation', gridX: 49.00, gridY: 5.00, size: 3, variant: 1 },
            { type: 'vegetation', gridX: 44.00, gridY: 1.00, size: 3, variant: 1 },
            { type: 'vegetation', gridX: 53.00, gridY: 14.00, size: 3, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 18.00, size: 3, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 23.00, size: 3, variant: 1 },
            { type: 'vegetation', gridX: 58.00, gridY: 28.00, size: 3, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 29.00, size: 3, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 32.00, size: 3, variant: 1 },
            { type: 'vegetation', gridX: 45.00, gridY: 33.00, size: 3, variant: 1 },
            { type: 'vegetation', gridX: 42.00, gridY: 33.00, size: 3, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 33.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 29.00, size: 3, variant: 2 },
            { type: 'vegetation', gridX: 55.00, gridY: 26.00, size: 3, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 14.00, size: 3, variant: 2 },
            { type: 'vegetation', gridX: 55.00, gridY: 4.00, size: 3, variant: 2 },
            { type: 'vegetation', gridX: 47.00, gridY: 5.00, size: 3, variant: 2 },
            { type: 'vegetation', gridX: 52.00, gridY: 11.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 6.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 52.00, gridY: 5.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 51.00, gridY: 31.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 43.00, gridY: 33.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 47.00, gridY: 33.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 48.00, gridY: 30.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 55.00, gridY: 30.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 27.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 53.00, gridY: 26.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 60.00, gridY: 19.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 11.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 49.00, gridY: 8.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 38.00, gridY: 1.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 52.00, gridY: 29.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 52.00, gridY: 32.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 55.00, gridY: 14.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 51.00, gridY: 12.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 6.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 41.00, gridY: 2.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 44.00, gridY: 5.00, size: 2.5, variant: 3 },
            { type: 'rock', gridX: 43.00, gridY: 4.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 41.00, gridY: 33.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 56.00, gridY: 21.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 50.00, gridY: 11.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 12.00, gridY: 28.00, size: 2.5, variant: 3 },
            { type: 'rock', gridX: 3.00, gridY: 8.00, size: 2.5, variant: 3 },
            { type: 'rock', gridX: 28.00, gridY: 11.00, size: 2.5, variant: 3 },
            { type: 'rock', gridX: 53.00, gridY: 31.00, size: 2.5, variant: 1 },
            { type: 'rock', gridX: 54.00, gridY: 24.00, size: 2.5, variant: 1 },
            { type: 'rock', gridX: 53.00, gridY: 7.00, size: 2.5, variant: 1 },
            { type: 'rock', gridX: 55.00, gridY: 3.00, size: 2.5, variant: 1 },
            { type: 'rock', gridX: 30.00, gridY: 7.00, size: 2.5, variant: 1 },
            { type: 'rock', gridX: 3.00, gridY: 23.00, size: 2.5, variant: 2 },
            { type: 'rock', gridX: 40.00, gridY: 27.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 39.00, gridY: 26.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 41.00, gridY: 27.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 39.00, gridY: 28.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 40.00, gridY: 26.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 31.00, gridY: 9.00, size: 1.5, variant: 3 },
            { type: 'vegetation', gridX: 32.00, gridY: 8.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 27.00, gridY: 8.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 30.00, gridY: 5.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 31.00, gridY: 7.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 27.00, gridY: 10.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 26.00, gridY: 7.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 32.00, gridY: 11.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 32.00, gridY: 5.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 34.00, gridY: 6.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 34.00, gridY: 4.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 38.00, gridY: 3.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 36.00, gridY: 5.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 36.00, gridY: 2.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 40.00, gridY: 4.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 26.00, gridY: 9.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 33.00, gridY: 10.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 33.00, gridY: 8.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 32.00, gridY: 2.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 35.00, gridY: 3.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 38.00, gridY: 6.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 39.00, gridY: 5.00, size: 2, variant: 1 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 8.00, gridY: 0.00 },
            { gridX: 8.00, gridY: 20.00 },
            { gridX: 53.00, gridY: 20.00 }
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
            enemyHealth_multiplier: 1.1, 
            speedMultiplier: 0.75, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'archer', count: 4 }, { type: 'villager', count: 4 }, { type: 'basic', count: 4 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 1.3, 
            speedMultiplier: 0.75, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 6 }, { type: 'villager', count: 6 }, { type: 'basic', count: 5 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 1.4, 
            speedMultiplier: 0.67, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 30 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'beefyenemy', count: 10 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 1.2, 
            speedMultiplier: 1.2, 
            spawnInterval: 1, 
            pattern: [{ type: 'archer', count: 17 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 0.75, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'beefyenemy', count: 6 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 0.78, 
            spawnInterval: 1, 
            pattern: [{ type: 'mage', count: 1 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 1, 
            spawnInterval: 1.4, 
            pattern: [{ type: 'shieldknight', count: 8 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 1.3, 
            speedMultiplier: 0.67, 
            spawnInterval: 0.3, 
            pattern: [{ type: 'archer', count: 12 }, { type: 'villager', count: 12 }, { type: 'basic', count: 12 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 1.3, 
            speedMultiplier: 0.75, 
            spawnInterval: 0.3, 
            pattern: [{ type: 'archer', count: 15 }, { type: 'villager', count: 15 }, { type: 'basic', count: 15 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 1.42, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 35 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 1.3, 
            speedMultiplier: 0.6, 
            spawnInterval: 0.3, 
            pattern: [{ type: 'beefyenemy', count: 4 }, { type: 'knight', count: 2 }, { type: 'shieldknight', count: 1 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 2.7, 
            speedMultiplier: 0.78, 
            spawnInterval: 0.3, 
            pattern: [{ type: 'mage', count: 1 }] 
        }
        // Wave 14
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 0.75, 
            spawnInterval: 0.4, 
            pattern: [{ type: 'beefyenemy', count: 12 }] 
        }
        // Wave 15
        , { 
            enemyHealth_multiplier: 1.8, 
            speedMultiplier: 1.43, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'knight', count: 3 }] 
        }
        // Wave 16
        , { 
            enemyHealth_multiplier: 2.7, 
            speedMultiplier: 1, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'knight', count: 3 }] 
        }
        // Wave 17
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 1.27, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'frog', count: 37 }] 
        }
        // Wave 18
        , { 
            enemyHealth_multiplier: 1.6, 
            speedMultiplier: 0.75, 
            spawnInterval: 0.2, 
            pattern: [{ type: 'archer', count: 17 }, { type: 'villager', count: 16 }, { type: 'basic', count: 16 }] 
        }
        // Wave 19
        , { 
            enemyHealth_multiplier: 1.8, 
            speedMultiplier: 1.3, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'archer', count: 45 }] 
        }
        // Wave 20
        , { 
            enemyHealth_multiplier: 2.2, 
            speedMultiplier: 1.13, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'knight', count: 1 }, { type: 'mage', count: 1 }, { type: 'shieldknight', count: 1 }] 
        }
        // Wave 21
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 0.78, 
            spawnInterval: 1, 
            pattern: [{ type: 'mage', count: 1 }] 
        }
        // Wave 22
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 0.55, 
            spawnInterval: 1, 
            pattern: [{ type: 'knight', count: 1 }] 
        }
        // Wave 23
        , { 
            enemyHealth_multiplier: 4.5, 
            speedMultiplier: 1, 
            spawnInterval: 0.3, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'frog', count: 19 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}