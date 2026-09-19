/**
 * Which element of a fused spell to hit `enemy` with. A spell made of two elements (a Combination
 * Tower spell, the Super Weapon Lab's Meteor Strike) deals one damage type per hit, and the
 * elemental frogs (and the Frog King) are immune to every element except their single weakness -
 * see ElementalFrogEnemy.takeDamage. So when the enemy declares a weakness that the spell
 * contains, hit it with that element; otherwise use the spell's usual `defaultType`.
 *
 * @param {object} enemy - anything with an optional `vulnerableTo` element
 * @param {string[]} elements - the elements the spell is fused from, e.g. ['air', 'earth']
 * @param {string} defaultType - what the spell deals to an enemy with no matching weakness
 */
export function pickDamageType(enemy, elements, defaultType) {
    const weakness = enemy.vulnerableTo;
    if (weakness && weakness !== defaultType && elements.includes(weakness)) return weakness;
    return defaultType;
}
