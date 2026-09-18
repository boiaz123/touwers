/**
 * Eternal Mode run options - shared by the Campaigns screen (where the player picks them),
 * GameplayState (which applies them), the pause menu and the Hiscores tab (which label them).
 * Pure data + helpers, no game imports, so any screen can use it cheaply.
 *
 * Modes:
 *  - Ranked (default): today's rules - the settlement's upgrades apply, no consumables, nothing
 *    pre-unlocked. Saving is allowed and the run's best wave is recorded on the Hiscores.
 *  - Hardcore Ranked: Ranked's rules, but saving is not allowed. Recorded on its own Hiscores line.
 *  - Custom (unranked): the player bends the rules - starting gold, consumables, everything
 *    unlocked. Saving is allowed, nothing is recorded on the Hiscores.
 */

export const UNLIMITED_GOLD = 'unlimited';

// What gold is held at for an unlimited-gold run (see GameplayState.update). Finite on purpose:
// a real Infinity would break JSON saves and every `Math.floor(gold)`.
export const UNLIMITED_GOLD_AMOUNT = 999999999;

// Values the Campaigns screen's starting-gold stepper walks through.
export const ETERNAL_GOLD_STEPS = [
    0, 50, 100, 200, 300, 500, 750, 1000, 1500, 2500, 5000, 10000, 25000, 50000, 100000, UNLIMITED_GOLD
];

// Starting gold a custom run begins with until the player changes it - the same base gold
// every level starts with, before any settlement bonuses.
export const ETERNAL_DEFAULT_CUSTOM_GOLD = 200;

export function defaultEternalOptions() {
    return {
        ranked: true,
        hardcore: false,
        startingGold: null, // null = the normal starting gold (base + settlement upgrade bonus)
        allowConsumables: false,
        unlockAll: false
    };
}

/**
 * Coerces whatever was passed in (missing, older save, hand-edited) into a self-consistent
 * options object: ranked runs are always the standard ruleset, only ranked runs can be
 * hardcore, and custom runs carry a valid starting gold.
 */
export function normalizeEternalOptions(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const ranked = src.ranked !== false;

    if (ranked) {
        return { ...defaultEternalOptions(), hardcore: !!src.hardcore };
    }

    let startingGold = src.startingGold;
    const valid = startingGold === UNLIMITED_GOLD ||
        (Number.isFinite(startingGold) && startingGold >= 0);
    if (!valid) startingGold = ETERNAL_DEFAULT_CUSTOM_GOLD;

    return {
        ranked: false,
        hardcore: false,
        startingGold: startingGold === UNLIMITED_GOLD ? UNLIMITED_GOLD : Math.floor(startingGold),
        allowConsumables: !!src.allowConsumables,
        unlockAll: !!src.unlockAll
    };
}

/** 'ranked' | 'hardcore' | 'custom' */
export function eternalModeKey(options) {
    const o = normalizeEternalOptions(options);
    if (!o.ranked) return 'custom';
    return o.hardcore ? 'hardcore' : 'ranked';
}

export function eternalModeLabel(options) {
    switch (eternalModeKey(options)) {
        case 'hardcore': return 'Hardcore Ranked';
        case 'custom': return 'Custom';
        default: return 'Ranked';
    }
}

/** Which SaveData field this mode's best run is recorded in, or null if it isn't recorded. */
export function eternalHighScoreField(options) {
    switch (eternalModeKey(options)) {
        case 'ranked': return 'sandboxHighScore';
        case 'hardcore': return 'sandboxHardcoreHighScore';
        default: return null;
    }
}

export function canSaveEternalRun(options) {
    return !normalizeEternalOptions(options).hardcore;
}

export function formatEternalGold(value) {
    return value === UNLIMITED_GOLD ? 'Unlimited' : Number(value).toLocaleString('en-US');
}
