import { ElementalFrogEnemy } from './ElementalFrogEnemy.js';

export class EarthFrogEnemy extends ElementalFrogEnemy {
    static BASE_STATS = {
        health: 340,
        speed: 25,
        armour: 20,
        magicResistance: 0.5
    };

    static VISUAL = {
        skinColor: '#9C6B2E',
        elementalType: 'earth',
        vulnerableTo: 'air',
        accentColor: '#C9820A',
        accentColorDark: '#7A4E00',
        robeColor: '#3D2E12',
        robeColorDark: '#241A08',
        glowColor: '#8BC34A',
        particleColorBases: ['rgba(156, 107, 46, ', 'rgba(139, 195, 74, ', 'rgba(217, 165, 33, '],
    };

    constructor(path, health_multiplier = 1.0, speed = null, armour = null, magicResistance = null) {
        super(path, health_multiplier, speed, armour, magicResistance, EarthFrogEnemy.BASE_STATS, EarthFrogEnemy.VISUAL);
    }
}
