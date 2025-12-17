/**
 * CampaignRegistry
 * Central registry for all campaigns.
 * Each campaign is a class that extends CampaignBase.
 * Easy to expand - just import new campaign classes and add to campaigns object.
 */
export class CampaignRegistry {
    static campaigns = {};
    static campaignClasses = {};
    
    /**
     * Initialize the registry with campaign classes
     */
    static initialize(campaignClasses) {
        this.campaignClasses = campaignClasses;
        
        // Build campaigns metadata from classes
        this.campaigns = {
            'campaign-1': {
                id: 'campaign-1',
                name: 'The Great Northern Campaign',
                description: 'Defend the northern territories from the invading forces. Hold the line!',
                icon: '⚔️',
                difficulty: 'Beginner',
                class: campaignClasses.Campaign1,
                rewards: {
                    gold: 5000,
                    experience: 1500,
                    unlocks: ['Special Tower Skin #1']
                },
                story: 'The northern territories are under siege. Gather your forces and defend the realm from invasion.',
                progress: 0
            },
            'campaign-2': {
                id: 'campaign-2',
                name: 'The Eastern Expedition',
                description: 'Venture east to unknown lands and face mysterious threats.',
                icon: '🗺️',
                difficulty: 'Intermediate',
                class: null, // Will be Campaign2 when created
                rewards: {
                    gold: 7500,
                    experience: 2000,
                    unlocks: ['Explorer\'s Arsenal']
                },
                story: 'Strange reports from the east speak of powerful creatures and ancient magic. Your expertise is needed.',
                progress: 0,
                locked: true
            },
            'campaign-3': {
                id: 'campaign-3',
                name: 'The Underground Depths',
                description: 'Descend into the depths to stop an ancient evil awakening.',
                icon: '⛏️',
                difficulty: 'Advanced',
                class: null, // Will be Campaign3 when created
                rewards: {
                    gold: 10000,
                    experience: 3000,
                    unlocks: ['Subterranean Technology']
                },
                story: 'Deep beneath the earth, an ancient evil stirs. Only the bravest warriors can stop it.',
                progress: 0,
                locked: true
            },
            'campaign-4': {
                id: 'campaign-4',
                name: 'The Sky Citadel',
                description: 'Ascend to the floating citadel and reclaim it from dark forces.',
                icon: '☁️',
                difficulty: 'Expert',
                class: null, // Will be Campaign4 when created
                rewards: {
                    gold: 15000,
                    experience: 4000,
                    unlocks: ['Celestial Weapons']
                },
                story: 'The legendary sky citadel has fallen into darkness. Lead your forces to reclaim this beacon of hope.',
                progress: 0,
                locked: true
            },
            'campaign-5': {
                id: 'campaign-5',
                name: 'The Final Stand',
                description: 'In a desperate last battle, face the ultimate darkness.',
                icon: '💀',
                difficulty: 'Nightmare',
                class: null, // Will be Campaign5 when created
                rewards: {
                    gold: 20000,
                    experience: 5000,
                    unlocks: ['Legendary Title', 'Ultimate Weapons']
                },
                story: 'All previous victories have led to this moment. The final battle for the realm itself awaits.',
                progress: 0,
                locked: true
            }
        };
    }

    /**
     * Get a campaign by ID
     */
    static getCampaign(campaignId) {
        return this.campaigns[campaignId];
    }

    /**
     * Get the campaign class/state for a campaign ID
     */
    static getCampaignClass(campaignId) {
        const campaign = this.campaigns[campaignId];
        return campaign ? campaign.class : null;
    }

    /**
     * Get all campaigns
     */
    static getAllCampaigns() {
        return Object.values(this.campaigns);
    }

    /**
     * Get all campaign IDs
     */
    static getCampaignIds() {
        return Object.keys(this.campaigns);
    }

    /**
     * Get campaigns ordered by unlock status (unlocked first)
     */
    static getCampaignsOrdered() {
        const all = this.getAllCampaigns();
        return all.sort((a, b) => {
            const aLocked = a.locked ? 1 : 0;
            const bLocked = b.locked ? 1 : 0;
            return aLocked - bLocked;
        });
    }

    /**
     * Update campaign progress
     */
    static updateCampaignProgress(campaignId, progress) {
        const campaign = this.campaigns[campaignId];
        if (campaign) {
            campaign.progress = Math.min(100, Math.max(0, progress));
        }
    }

    /**
     * Check if campaign is unlocked
     */
    static isCampaignUnlocked(campaignId) {
        const campaign = this.campaigns[campaignId];
        return campaign && !campaign.locked;
    }
}
