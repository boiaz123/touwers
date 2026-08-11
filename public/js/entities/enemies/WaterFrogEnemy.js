import { ElementalFrogEnemy } from './ElementalFrogEnemy.js';

export class WaterFrogEnemy extends ElementalFrogEnemy {
    static BASE_STATS = {
        health: 340,
        speed: 25,
        armour: 10,
        magicResistance: 0.5
    };

    static VISUAL = {
        skinColor: '#1E88FF',
        elementalType: 'water',
        vulnerableTo: 'earth',
        accentColor: '#00A8E8',
        accentColorDark: '#005A8A',
        robeColor: '#0D3B66',
        robeColorDark: '#082238',
        glowColor: '#18E5FF',
        hatColors: ['#0090E0', '#0060A8', '#003060'],
        hatShowStar: true,
        particleColorBases: ['rgba(0, 168, 232, ', 'rgba(90, 200, 255, ', 'rgba(190, 240, 255, '],
    };

    constructor(path, health_multiplier = 1.0, speed = null, armour = null, magicResistance = null) {
        super(path, health_multiplier, speed, armour, magicResistance, WaterFrogEnemy.BASE_STATS, WaterFrogEnemy.VISUAL);
    }
}
