import { LevelBase } from '../LevelBase.js';

export class DesertLevel9 extends LevelBase {
    static levelMetadata = {
        name: 'Andula Estuary',
        difficulty: 'Hard',
        order: 9,
        campaign: 'desert'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = DesertLevel9.levelMetadata.name;
        this.levelNumber = DesertLevel9.levelMetadata.order;
        this.difficulty = DesertLevel9.levelMetadata.difficulty;
        this.campaign = DesertLevel9.levelMetadata.campaign;
        this.maxWaves = 30;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'water', gridX: 19.00, gridY: 34.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 33.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 32.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 31.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 30.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 29.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 22.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 15.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 15.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 15.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 14.00, gridY: 20.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 14.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 13.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 13.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 12.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 12.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 13.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 10.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 10.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 10.00, gridY: 11.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 10.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 9.00, gridY: 9.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 9.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 9.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 9.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 9.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 9.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 8.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 8.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 8.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 8.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 8.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 8.00, gridY: 1.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 8.00, gridY: 0.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 34.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 33.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 32.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 31.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 30.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 29.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 22.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 20.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 21.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 21.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 22.00, gridY: 13.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 22.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 11.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 11.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 24.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 24.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 25.00, gridY: 9.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 25.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 26.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 26.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 26.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 26.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 1.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 0.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 34.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 33.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 32.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 31.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 30.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 29.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 21.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 21.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 21.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 22.00, gridY: 22.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 22.00, gridY: 22.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 22.00, gridY: 22.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 20.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 24.00, gridY: 20.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 25.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 26.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 26.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 26.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 28.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 29.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 29.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 31.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 31.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 13.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 13.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 11.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 11.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 9.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 1.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 0.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 34.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 33.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 32.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 31.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 30.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 29.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 22.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 20.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 20.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 13.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 13.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 11.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 15.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 15.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 15.00, gridY: 9.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 14.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 14.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 14.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 13.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 12.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 12.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 1.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 0.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 34.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 33.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 32.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 31.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 30.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 29.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 22.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 20.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 13.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 11.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 9.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 1.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 0.00, size: 1.5, waterType: 'river' },
            { type: 'vegetation', gridX: 5.00, gridY: 31.00, size: 2.297290381832745, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 30.00, size: 2.163839087439961, variant: 2 },
            { type: 'vegetation', gridX: 6.00, gridY: 32.75, size: 3.286919051605608, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 31.00, size: 3.2214555161422505, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 27.00, size: 2.149941604335838, variant: 0 },
            { type: 'vegetation', gridX: 4.00, gridY: 32.00, size: 3.0635628464598135, variant: 2 },
            { type: 'vegetation', gridX: 1.00, gridY: 30.00, size: 3.3490555737438443, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 27.00, size: 3.405573805563203, variant: 2 },
            { type: 'vegetation', gridX: 10.00, gridY: 26.00, size: 3.3237261756620176, variant: 3 },
            { type: 'vegetation', gridX: 8.00, gridY: 26.00, size: 2.918346768743418, variant: 3 },
            { type: 'vegetation', gridX: 10.00, gridY: 23.00, size: 3.2112796834128057, variant: 3 },
            { type: 'vegetation', gridX: 13.00, gridY: 24.00, size: 2.642460316072204, variant: 1 },
            { type: 'vegetation', gridX: 11.00, gridY: 25.00, size: 3.4024732799456063, variant: 1 },
            { type: 'vegetation', gridX: 6.00, gridY: 17.00, size: 2.311570142602606, variant: 2 },
            { type: 'vegetation', gridX: 9.00, gridY: 18.00, size: 2.6063736797418664, variant: 1 },
            { type: 'vegetation', gridX: 3.00, gridY: 16.00, size: 3.4818505641723583, variant: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 15.00, size: 3.273808623341223, variant: 3 },
            { type: 'vegetation', gridX: 8.00, gridY: 13.00, size: 2.8405814868120753, variant: 3 },
            { type: 'vegetation', gridX: 8.00, gridY: 16.00, size: 2.2526060423823493, variant: 2 },
            { type: 'vegetation', gridX: 7.00, gridY: 17.00, size: 3.0813942201640097, variant: 1 },
            { type: 'vegetation', gridX: 1.00, gridY: 6.00, size: 2.5874909528153394, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 4.00, size: 3.307849957998105, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 5.00, size: 2.607116590524523, variant: 1 },
            { type: 'vegetation', gridX: 6.00, gridY: 3.00, size: 2.8427322399026913, variant: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 6.00, size: 2.0849385683010686, variant: 2 },
            { type: 'vegetation', gridX: 24.00, gridY: 18.00, size: 2.652199954442136, variant: 3 },
            { type: 'vegetation', gridX: 26.00, gridY: 17.00, size: 2.716605874613527, variant: 2 },
            { type: 'vegetation', gridX: 24.00, gridY: 15.00, size: 3.1834655561792915, variant: 0 },
            { type: 'vegetation', gridX: 24.00, gridY: 17.00, size: 2.483429144438558, variant: 3 },
            { type: 'vegetation', gridX: 25.00, gridY: 16.00, size: 3.232207784123348, variant: 0 },
            { type: 'vegetation', gridX: 30.00, gridY: 9.00, size: 3.4492891891719006, variant: 2 },
            { type: 'vegetation', gridX: 29.00, gridY: 12.00, size: 2.9030815005533395, variant: 2 },
            { type: 'vegetation', gridX: 30.00, gridY: 11.00, size: 2.601600152275748, variant: 2 },
            { type: 'vegetation', gridX: 31.00, gridY: 10.00, size: 2.169892944064595, variant: 0 },
            { type: 'vegetation', gridX: 29.00, gridY: 10.00, size: 2.694265542835419, variant: 2 },
            { type: 'vegetation', gridX: 21.00, gridY: 6.00, size: 2.10402994861269, variant: 0 },
            { type: 'vegetation', gridX: 21.00, gridY: 2.00, size: 3.1979651401024434, variant: 2 },
            { type: 'vegetation', gridX: 24.00, gridY: 5.00, size: 2.903673611188366, variant: 1 },
            { type: 'vegetation', gridX: 25.00, gridY: 3.00, size: 3.309231625849632, variant: 0 },
            { type: 'vegetation', gridX: 22.00, gridY: 5.00, size: 2.0727159389586935, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 30.00, size: 2.5878768964394734, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 31.00, size: 2.0149414842017936, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 30.00, size: 3.4397102484411235, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 30.00, size: 2.0055665465001478, variant: 1 },
            { type: 'vegetation', gridX: 58.00, gridY: 30.00, size: 2.9726121349971546, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 32.75, size: 2.7625450190294902, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 31.00, size: 2.1469638762560774, variant: 1 },
            { type: 'vegetation', gridX: 47.00, gridY: 32.75, size: 2.63885496835226, variant: 1 },
            { type: 'vegetation', gridX: 48.00, gridY: 31.00, size: 3.0739128462274206, variant: 3 },
            { type: 'vegetation', gridX: 48.00, gridY: 32.75, size: 2.35716170549198, variant: 2 },
            { type: 'vegetation', gridX: 45.00, gridY: 32.75, size: 2.015322099702739, variant: 0 },
            { type: 'vegetation', gridX: 46.00, gridY: 32.00, size: 2.456024361981908, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 4.00, size: 2.2420707234812434, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 3.00, size: 3.101724380398817, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 4.00, size: 2.067325902967241, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 2.00, size: 2.4409703235952853, variant: 2 },
            { type: 'vegetation', gridX: 35.00, gridY: 0.00, size: 2.2003288516204624, variant: 3 },
            { type: 'vegetation', gridX: 34.00, gridY: 2.00, size: 2.4441834127476145, variant: 0 },
            { type: 'vegetation', gridX: 37.00, gridY: 3.00, size: 3.1515934949813555, variant: 2 },
            { type: 'vegetation', gridX: 37.00, gridY: 4.00, size: 2.063339118119764, variant: 1 },
            { type: 'vegetation', gridX: 35.00, gridY: 3.00, size: 2.1462341363848494, variant: 0 },
            { type: 'rock', gridX: 36.00, gridY: 30.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 58.00, gridY: 32.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 58.00, gridY: 26.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 11.00, gridY: 19.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 6.00, gridY: 9.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 20.00, gridY: 3.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 30.00, gridY: 4.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 1.00, gridY: 31.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 7.00, gridY: 33.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 3.00, gridY: 19.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 2.00, gridY: 10.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 21.00, gridY: 20.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 15.00, gridY: 17.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 35.00, gridY: 5.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 56.00, gridY: 2.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 14.00, gridY: 2.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 3.00, gridY: 27.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 7.00, gridY: 6.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 17.00, gridY: 10.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 24.00, gridY: 6.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 53.00, gridY: 33.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 28.00, gridY: 33.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 58.00, gridY: 4.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 5.00, gridY: 7.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 30.00, gridY: 2.00, size: 3, variant: 0 },
            { type: 'rock', gridX: 23.00, gridY: 18.00, size: 3, variant: 0 },
            { type: 'rock', gridX: 57.00, gridY: 31.00, size: 3, variant: 0 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 24.00, gridY: 34.00 },
            { gridX: 24.00, gridY: 27.00 },
            { gridX: 36.00, gridY: 17.00 },
            { gridX: 37.00, gridY: 9.00 },
            { gridX: 37.00, gridY: 6.00 },
            { gridX: 53.00, gridY: 6.00 },
            { gridX: 53.00, gridY: 27.00 },
            { gridX: 42.00, gridY: 27.00 }
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
            speedMultiplier: 1, 
            spawnInterval: 1.2, 
            pattern: [{ type: 'villager', count: 9 }, { type: 'villager', count: 12, healthMultiplier: 1.5 }, { type: 'villager', count: 15, healthMultiplier: 2 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'frog', count: 7 }, { type: 'frog', count: 9, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'frog', count: 11, healthMultiplier: 3 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'villager', count: 9, healthMultiplier: 2, speedMultiplier: 0.5 }, { type: 'basic', count: 11, healthMultiplier: 2 }, { type: 'archer', count: 3, speedMultiplier: 1.7 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'beefyenemy', count: 7 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 8, healthMultiplier: 3, speedMultiplier: 1.1 }, { type: 'frog', count: 12, healthMultiplier: 2 }, { type: 'shieldknight', count: 2, healthMultiplier: 2 }, { type: 'archer', count: 3, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'mage', count: 1, healthMultiplier: 2 }, { type: 'frog', count: 13 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1.3, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'villager', count: 14 }, { type: 'basic', count: 11 }, { type: 'frog', count: 9, healthMultiplier: 2, speedMultiplier: 1.4 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'basic', count: 12 }, { type: 'villager', count: 9 }, { type: 'archer', count: 12, speedMultiplier: 1.2 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1, 
            spawnInterval: 2, 
            pattern: [{ type: 'beefyenemy', count: 4 }, { type: 'knight', count: 2, healthMultiplier: 1 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1, 
            spawnInterval: 5, 
            pattern: [{ type: 'firefrog', count: 1 }, { type: 'airfrog', count: 1 }, { type: 'firefrog', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1, 
            spawnInterval: 2, 
            pattern: [{ type: 'shieldknight', count: 2, healthMultiplier: 2 }, { type: 'beefyenemy', count: 5 }, { type: 'knight', count: 1, healthMultiplier: 1.7 }, { type: 'shieldknight', count: 3 }, { type: 'beefyenemy', count: 7, healthMultiplier: 5 }, { type: 'knight', count: 1, healthMultiplier: 2, speedMultiplier: 0.8 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'mage', count: 1, healthMultiplier: 2 }, { type: 'frog', count: 10, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 4, healthMultiplier: 4, speedMultiplier: 0.4 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 7, healthMultiplier: 5 }, { type: 'frog', count: 14 }, { type: 'mage', count: 1, healthMultiplier: 2 }, { type: 'basic', count: 9 }, { type: 'villager', count: 8 }, { type: 'shieldknight', count: 4 }, { type: 'archer', count: 7, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 14
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 0.8, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'shieldknight', count: 7 }] 
        }
        // Wave 15
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1, 
            spawnInterval: 12.5, 
            pattern: [{ type: 'knight', count: 3 }] 
        }
        // Wave 16
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'knight', count: 1, healthMultiplier: 3 }, { type: 'shieldknight', count: 2, healthMultiplier: 2 }, { type: 'mage', count: 1, healthMultiplier: 2 }, { type: 'shieldknight', count: 1, healthMultiplier: 4 }] 
        }
        // Wave 17
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'mage', count: 4, speedMultiplier: 0.6 }, { type: 'frog', count: 7, speedMultiplier: 1.2 }] 
        }
        // Wave 18
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 14 }, { type: 'villager', count: 17 }, { type: 'basic', count: 15 }] 
        }
        // Wave 19
        , { 
            enemyHealth_multiplier: 5.5, 
            speedMultiplier: 1.7, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 12 }] 
        }
        // Wave 20
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1, 
            spawnInterval: 12, 
            pattern: [{ type: 'knight', count: 4, speedMultiplier: 1.4 }] 
        }
        // Wave 21
        , { 
            enemyHealth_multiplier: 4.8, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'shieldknight', count: 3, healthMultiplier: 3 }, { type: 'mage', count: 1 }, { type: 'villager', count: 12 }, { type: 'shieldknight', count: 2, healthMultiplier: 4 }, { type: 'beefyenemy', count: 10 }, { type: 'mage', count: 1 }, { type: 'frog', count: 14 }, { type: 'archer', count: 11, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 1, healthMultiplier: 6, speedMultiplier: 1 }] 
        }
        // Wave 22
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 2, 
            pattern: [{ type: 'mage', count: 1, healthMultiplier: 2 }, { type: 'firefrog', count: 2, healthMultiplier: 5 }] 
        }
        // Wave 23
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 1.4, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 13 }, { type: 'mage', count: 2 }, { type: 'archer', count: 13, healthMultiplier: 4 }] 
        }
        // Wave 24
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 1, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'shieldknight', count: 3, speedMultiplier: 1.2 }, { type: 'beefyenemy', count: 9, healthMultiplier: 6, speedMultiplier: 0.7 }, { type: 'frog', count: 16 }, { type: 'villager', count: 11 }, { type: 'archer', count: 14, speedMultiplier: 1.4 }, { type: 'knight', count: 1, healthMultiplier: 7, speedMultiplier: 0.5 }] 
        }
        // Wave 25
        , { 
            enemyHealth_multiplier: 7, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'waterfrog', count: 1 }, { type: 'mage', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 26
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'shieldknight', count: 1, healthMultiplier: 4, speedMultiplier: 1.2 }, { type: 'beefyenemy', count: 11, healthMultiplier: 6 }, { type: 'frog', count: 11, speedMultiplier: 1.4 }, { type: 'villager', count: 11 }, { type: 'archer', count: 13, speedMultiplier: 1.4 }, { type: 'knight', count: 1, healthMultiplier: 6, speedMultiplier: 0.5 }] 
        }
        // Wave 27
        , { 
            enemyHealth_multiplier: 7.5, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'waterfrog', count: 1 }, { type: 'earthfrog', count: 1 }, { type: 'firefrog', count: 1 }] 
        }
        // Wave 28
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'mage', count: 3, speedMultiplier: 1.2 }, { type: 'beefyenemy', count: 9, healthMultiplier: 6 }, { type: 'frog', count: 16 }, { type: 'villager', count: 11 }, { type: 'archer', count: 13 }, { type: 'knight', count: 1, healthMultiplier: 7, speedMultiplier: 0.5 }, { type: 'shieldknight', count: 3, healthMultiplier: 4, speedMultiplier: 1.2 }] 
        }
        // Wave 29
        , { 
            enemyHealth_multiplier: 15, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'firefrog', count: 1 }] 
        }
        // Wave 30
        , { 
            enemyHealth_multiplier: 11, 
            speedMultiplier: 1, 
            spawnInterval: 3, 
            pattern: [{ type: 'mage', count: 1, healthMultiplier: 8, speedMultiplier: 0.8 }, { type: 'airfrog', count: 1 }, { type: 'earthfrog', count: 1 }, { type: 'firefrog', count: 1 }, { type: 'waterfrog', count: 1 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}