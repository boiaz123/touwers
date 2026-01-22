/**
 * LevelRegistry
 * Registry pattern for all levels organized by campaign.
 * Each level exports its class AND metadata (levelId, levelName, difficulty).
 * This replaces the need for LevelFactory.
 */

export class LevelRegistry {
    static levels = new Map(); // Map<campaignId, Map<levelId, levelData>>
    
    /**
     * Register a level with its metadata
     * @param {string} campaignId - Campaign folder name (e.g., 'campaign-1')
     * @param {string} levelId - Level identifier (e.g., 'level1')
     * @param {Function} levelClass - The level class constructor
     * @param {Object} metadata - { name, difficulty, order }
     */
    static registerLevel(campaignId, levelId, levelClass, metadata) {
        if (!this.levels.has(campaignId)) {
            this.levels.set(campaignId, new Map());
        }
        
        this.levels.get(campaignId).set(levelId, {
            class: levelClass,
            id: levelId,
            name: metadata.name,
            difficulty: metadata.difficulty,
            order: metadata.order ?? 999
        });
    }
    
    /**
     * Get all levels for a campaign
     * @param {string} campaignId - Campaign identifier
     * @returns {Array} Array of level metadata objects sorted by order
     */
    static getLevelsByCampaign(campaignId) {
        const campaignLevels = this.levels.get(campaignId);
        if (!campaignLevels) return [];
        
        return Array.from(campaignLevels.values())
            .sort((a, b) => a.order - b.order);
    }
    
    /**
     * Create a level instance by ID
     * @param {string} levelId - Level identifier (e.g., 'level1')
     * @param {string} campaignId - Optional campaign identifier (e.g., 'campaign-1'). If provided, will only search that campaign.
     * @returns {LevelBase} Instantiated level
     */
    static createLevel(levelId, campaignId = null) {
        // If campaignId is specified, search only that campaign
        if (campaignId) {
            const campaignLevels = this.levels.get(campaignId);
            if (campaignLevels) {
                const levelData = campaignLevels.get(levelId);
                if (levelData) {
                    return new levelData.class();
                }
            }
            throw new Error(`Unknown level type: ${levelId} in campaign: ${campaignId}`);
        }
        
        // Otherwise, search all campaigns (legacy behavior)
        for (const [campaignId, campaignLevels] of this.levels) {
            const levelData = campaignLevels.get(levelId);
            if (levelData) {
                return new levelData.class();
            }
        }
        
        throw new Error(`Unknown level type: ${levelId}`);
    }
    
    /**
     * Get level metadata by ID
     * @param {string} levelId - Level identifier
     * @returns {Object} Level metadata or null
     */
    static getLevelMetadata(levelId) {
        for (const [campaignId, campaignLevels] of this.levels) {
            const levelData = campaignLevels.get(levelId);
            if (levelData) {
                return {
                    id: levelData.id,
                    name: levelData.name,
                    difficulty: levelData.difficulty
                };
            }
        }
        return null;
    }
}
