import { ElementalFrogEnemy } from './ElementalFrogEnemy.js';

export class EarthFrogEnemy extends ElementalFrogEnemy {
    static BASE_STATS = {
        health: 340,
        speed: 25,
        armour: 20,
        magicResistance: 0.5
    };

    static VISUAL = {
        skinColor: '#8B6F47',
        elementalType: 'earth',
        vulnerableTo: 'air',
        accentColor: '#8a6a3a',
        accentColorDark: '#5a4a2a',
        robeColor: '#2a2010',
        robeColorDark: '#1a1000',
        glowColor: '#cc8800',
        hatColors: ['#8a6a3a', '#6a4a2a', '#3a2a1a'],
        hatShowStar: false,
        particleColorBases: ['rgba(139, 111, 71, ', 'rgba(184, 134, 11, ', 'rgba(160, 82, 45, '],
    };

    constructor(path, health_multiplier = 1.0, speed = null, armour = null, magicResistance = null) {
        super(path, health_multiplier, speed, armour, magicResistance, EarthFrogEnemy.BASE_STATS, EarthFrogEnemy.VISUAL);
    }
}
