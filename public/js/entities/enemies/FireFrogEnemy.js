import { ElementalFrogEnemy } from './ElementalFrogEnemy.js';

export class FireFrogEnemy extends ElementalFrogEnemy {
    static BASE_STATS = {
        health: 340,
        speed: 25,
        armour: 10,
        magicResistance: 0.5
    };

    static VISUAL = {
        skinColor: '#FF4520',
        elementalType: 'fire',
        vulnerableTo: 'water',
        accentColor: '#FF7A1A',
        accentColorDark: '#B33D00',
        robeColor: '#5A1414',
        robeColorDark: '#2E0808',
        glowColor: '#FF8800',
        particleColorBases: ['rgba(255, 90, 40, ', 'rgba(255, 160, 0, ', 'rgba(255, 224, 120, '],
    };

    constructor(path, health_multiplier = 1.0, speed = null, armour = null, magicResistance = null) {
        super(path, health_multiplier, speed, armour, magicResistance, FireFrogEnemy.BASE_STATS, FireFrogEnemy.VISUAL);
    }
}
