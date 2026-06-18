/**
 * GameStatistics - Tracks overall game progress statistics
 * Persists across levels and save slots
 * Records: victories, defeats, enemies slain, playtime, items consumed, marketplace spending/earnings
 */
export class GameStatistics {
    constructor() {
        this.reset();
    }

    reset() {
        this.victories = 0;
        this.defeats = 0;
        this.totalEnemiesSlain = 0;
        this.totalPlaytime = 0; // In seconds
        this.totalItemsConsumed = 0;
        this.totalMoneySpentOnMarketplace = 0;
        this.totalMoneyEarnedInMarketplace = 0;
        this.totalItemsSold = 0;
        this.totalTowersBuilt = 0;
        this.totalWavesSurvived = 0;
        this.totalLootCollected = 0;
        this.superWeaponLabBuilt = false;
        this.totalSuperWeaponSpellsCast = 0;
        this.frostShatterTriggered = false;
    }

    /**
     * Record a level victory
     */
    recordVictory() {
        this.victories++;
    }

    /**
     * Record a level defeat
     */
    recordDefeat() {
        this.defeats++;
    }

    /**
     * Add to total enemies slain
     * @param {number} count - Number of enemies to add
     */
    addEnemiesSlain(count) {
        this.totalEnemiesSlain += count;
    }

    /**
     * Add playtime in seconds
     * @param {number} seconds - Seconds to add
     */
    addPlaytime(seconds) {
        this.totalPlaytime += seconds;
    }

    /**
     * Increment items consumed count
     * @param {number} count - Number of items consumed (default 1)
     */
    incrementItemsConsumed(count = 1) {
        this.totalItemsConsumed += count;
    }

    /**
     * Add marketplace spending
     * @param {number} amount - Gold spent
     */
    addMarketplaceSpending(amount) {
        this.totalMoneySpentOnMarketplace += amount;
    }

    /**
     * Add marketplace earnings (from selling)
     * @param {number} amount - Gold earned
     */
    addMarketplaceEarnings(amount) {
        this.totalMoneyEarnedInMarketplace += amount;
    }

    /**
     * Add to total items sold count
     * @param {number} count - Number of items sold (default 1)
     */
    addItemsSold(count = 1) {
        this.totalItemsSold += count;
    }

    addTowersBuilt(count = 1) {
        this.totalTowersBuilt += count;
    }

    addWavesSurvived(count = 1) {
        this.totalWavesSurvived += count;
    }

    addLootCollected(count = 1) {
        this.totalLootCollected += count;
    }

    /**
     * Mark that the Super Weapon Lab has been constructed
     */
    markSuperWeaponLabBuilt() {
        this.superWeaponLabBuilt = true;
    }

    /**
     * Add to the cumulative count of Super Weapon Lab spell casts
     * (Arcane Blast, Frozen Nova, Meteor Strike, Chain Lightning combined)
     * @param {number} count - Number of spells cast (default 1)
     */
    addSuperWeaponSpellCast(count = 1) {
        this.totalSuperWeaponSpellsCast += count;
    }

    /**
     * Mark that a Super Weapon Lab spell has struck an enemy while it was
     * frozen by Frozen Nova (a "frost shatter" combo)
     */
    markFrostShatter() {
        this.frostShatterTriggered = true;
    }

    /**
     * Get formatted playtime string (e.g., "2h 30m 45s")
     */
    getFormattedPlaytime() {
        const hours = Math.floor(this.totalPlaytime / 3600);
        const minutes = Math.floor((this.totalPlaytime % 3600) / 60);
        const seconds = Math.floor(this.totalPlaytime % 60);
        
        const parts = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (seconds > 0) parts.push(`${seconds}s`);
        
        return parts.length > 0 ? parts.join(' ') : '0s';
    }

    /**
     * Calculate win rate percentage
     */
    getWinRate() {
        const total = this.victories + this.defeats;
        if (total === 0) return 0;
        return Math.round((this.victories / total) * 100);
    }

    /**
     * Serialize statistics for storage
     */
    serialize() {
        return {
            victories: this.victories,
            defeats: this.defeats,
            totalEnemiesSlain: this.totalEnemiesSlain,
            totalPlaytime: this.totalPlaytime,
            totalItemsConsumed: this.totalItemsConsumed,
            totalMoneySpentOnMarketplace: this.totalMoneySpentOnMarketplace,
            totalMoneyEarnedInMarketplace: this.totalMoneyEarnedInMarketplace,
            totalItemsSold: this.totalItemsSold,
            totalTowersBuilt: this.totalTowersBuilt,
            totalWavesSurvived: this.totalWavesSurvived,
            totalLootCollected: this.totalLootCollected,
            superWeaponLabBuilt: this.superWeaponLabBuilt,
            totalSuperWeaponSpellsCast: this.totalSuperWeaponSpellsCast,
            frostShatterTriggered: this.frostShatterTriggered
        };
    }

    /**
     * Deserialize statistics from storage
     */
    deserialize(data) {
        if (!data) return;
        this.victories = data.victories || 0;
        this.defeats = data.defeats || 0;
        this.totalEnemiesSlain = data.totalEnemiesSlain || 0;
        this.totalPlaytime = data.totalPlaytime || 0;
        this.totalItemsConsumed = data.totalItemsConsumed || 0;
        this.totalMoneySpentOnMarketplace = data.totalMoneySpentOnMarketplace || 0;
        this.totalMoneyEarnedInMarketplace = data.totalMoneyEarnedInMarketplace || 0;
        this.totalItemsSold = data.totalItemsSold || 0;
        this.totalTowersBuilt = data.totalTowersBuilt || 0;
        this.totalWavesSurvived = data.totalWavesSurvived || 0;
        this.totalLootCollected = data.totalLootCollected || 0;
        this.superWeaponLabBuilt = data.superWeaponLabBuilt || false;
        this.totalSuperWeaponSpellsCast = data.totalSuperWeaponSpellsCast || 0;
        this.frostShatterTriggered = data.frostShatterTriggered || false;
    }

    /**
     * Restore statistics from save data (alias for deserialize)
     */
    restoreFromSave(data) {
        this.deserialize(data);
    }
}
