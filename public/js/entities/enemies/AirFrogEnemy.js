import { ElementalFrogEnemy } from './ElementalFrogEnemy.js';

export class AirFrogEnemy extends ElementalFrogEnemy {
    static BASE_STATS = {
        health: 340,
        speed: 25,
        armour: 8,
        magicResistance: 0.5
    };

    static VISUAL = {
        skinColor: '#DCE4FF',
        elementalType: 'air',
        vulnerableTo: 'fire',
        accentColor: '#A8D8FF',
        accentColorDark: '#7FA8FF',
        robeColor: '#C9D6FF',
        robeColorDark: '#8C9EE8',
        glowColor: '#4DE8FF',
        hatColors: ['#D8E4FF', '#B8CCFF', '#96AEE0'],
        hatShowStar: true,
        particleColorBases: ['rgba(120, 200, 255, ', 'rgba(180, 160, 255, ', 'rgba(224, 246, 255, '],
    };

    constructor(path, health_multiplier = 1.0, speed = null, armour = null, magicResistance = null) {
        super(path, health_multiplier, speed, armour, magicResistance, AirFrogEnemy.BASE_STATS, AirFrogEnemy.VISUAL);
    }
}
