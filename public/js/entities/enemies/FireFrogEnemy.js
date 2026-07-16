import { ElementalFrogEnemy } from './ElementalFrogEnemy.js';

export class FireFrogEnemy extends ElementalFrogEnemy {
    static BASE_STATS = {
        health: 340,
        speed: 25,
        armour: 10,
        magicResistance: 0.5
    };

    static VISUAL = {
        skinColor: '#E74C3C',
        elementalType: 'fire',
        vulnerableTo: 'water',
        accentColor: '#c84a2a',
        accentColorDark: '#8a2a0a',
        robeColor: '#4a2020',
        robeColorDark: '#2a1010',
        glowColor: '#ff6600',
        hatColors: ['#ff6600', '#cc4400', '#8a2800'],
        hatShowStar: true,
        particleColorBases: ['rgba(200, 74, 42, ', 'rgba(255, 140, 0, ', 'rgba(255, 200, 100, '],
    };

    constructor(path, health_multiplier = 1.0, speed = null, armour = null, magicResistance = null) {
        super(path, health_multiplier, speed, armour, magicResistance, FireFrogEnemy.BASE_STATS, FireFrogEnemy.VISUAL);
    }
}
