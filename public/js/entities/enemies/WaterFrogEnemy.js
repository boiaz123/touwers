import { ElementalFrogEnemy } from './ElementalFrogEnemy.js';

export class WaterFrogEnemy extends ElementalFrogEnemy {
    static BASE_STATS = {
        health: 340,
        speed: 25,
        armour: 10,
        magicResistance: 0.5
    };

    static VISUAL = {
        skinColor: '#4A90E2',
        elementalType: 'water',
        vulnerableTo: 'earth',
        accentColor: '#2a7aaa',
        accentColorDark: '#0a4a7a',
        robeColor: '#1a2a3a',
        robeColorDark: '#0a1a2a',
        glowColor: '#00ccff',
        hatColors: ['#0080c0', '#005080', '#002040'],
        hatShowStar: true,
        particleColorBases: ['rgba(42, 122, 170, ', 'rgba(100, 180, 220, ', 'rgba(150, 220, 255, '],
    };

    constructor(path, health_multiplier = 1.0, speed = null, armour = null, magicResistance = null) {
        super(path, health_multiplier, speed, armour, magicResistance, WaterFrogEnemy.BASE_STATS, WaterFrogEnemy.VISUAL);
    }
}
