import { ElementalFrogEnemy } from './ElementalFrogEnemy.js';

export class AirFrogEnemy extends ElementalFrogEnemy {
    static BASE_STATS = {
        health: 340,
        speed: 25,
        armour: 8,
        magicResistance: 0.5
    };

    static VISUAL = {
        skinColor: '#e8e8f8',
        elementalType: 'air',
        vulnerableTo: 'fire',
        accentColor: '#f5f5ff',
        accentColorDark: '#c0c0e0',
        robeColor: '#d0d0e0',
        robeColorDark: '#a0a0c0',
        glowColor: '#00d4ff',
        hatColors: ['#e0e0f8', '#d0d0f0', '#b0b0e0'],
        hatShowStar: true,
        particleColorBases: ['rgba(100, 200, 255, ', 'rgba(150, 220, 255, ', 'rgba(200, 240, 255, '],
    };

    constructor(path, health_multiplier = 1.0, speed = null, armour = null, magicResistance = null) {
        super(path, health_multiplier, speed, armour, magicResistance, AirFrogEnemy.BASE_STATS, AirFrogEnemy.VISUAL);
    }
}
