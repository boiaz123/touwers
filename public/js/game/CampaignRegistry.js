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
                name: 'The Forest Campaign',
                description: 'Explore the mystical forest and defend against dark forces among the trees.',
                icon: '🌲',
                difficulty: 'Beginner',
                class: campaignClasses.Campaign1,
                rewards: {
                    gold: 5000,
                    experience: 1500,
                    unlocks: ['Forestkeeper\'s Bow']
                },
                story: 'The ancient forests are under threat. Defend the woodland realm and its creatures from darkness.',
                progress: 0
            },
            'campaign-2': {
                id: 'campaign-2',
                name: 'The Mountain Campaign',
                description: 'Conquer the snowy peaks and alpine passes against the mountain invaders.',
                icon: '⛰️',
                difficulty: 'Intermediate',
                class: campaignClasses.Campaign2,
                rewards: {
                    gold: 7500,
                    experience: 2000,
                    unlocks: ['Alpine Fortress']
                },
                story: 'The mountains hold strategic fortresses. Claim them for the realm and defeat the invading force.',
                progress: 0,
                locked: false
            },
            'campaign-3': {
                id: 'campaign-3',
                name: 'The Desert Campaign',
                description: 'Brave the scorching sands and defend the oasis strongholds.',
                icon: '🏜️',
                difficulty: 'Advanced',
                class: campaignClasses.Campaign3,
                rewards: {
                    gold: 10000,
                    experience: 3000,
                    unlocks: ['Desert Nomad\'s Blade']
                },
                story: 'The deserts hide ancient secrets and fierce enemies. Survive the heat and defend your outposts.',
                progress: 0,
                locked: false
            },
            'campaign-4': {
                id: 'campaign-4',
                name: 'The Space Campaign',
                description: 'Defend space stations from extraterrestrial threats orbiting in the void.',
                icon: '🚀',
                difficulty: 'Expert',
                class: campaignClasses.Campaign4,
                rewards: {
                    gold: 15000,
                    experience: 4000,
                    unlocks: ['Plasma Cannon', 'Advanced Targeting System']
                },
                story: 'Humanity\'s outposts in space are under attack. Defend the orbital stations with advanced technology.',
                progress: 0,
                locked: false
            },
            'campaign-5': {
                id: 'campaign-5',
                name: 'Level Testing Campaign',
                description: 'A sandbox campaign with all slots available for level testing purposes.',
                icon: '🧪',
                difficulty: 'Testing',
                class: campaignClasses.Campaign5,
                rewards: {
                    gold: 0,
                    experience: 0,
                    unlocks: []
                },
                story: 'A test environment for level design and gameplay mechanics.',
                progress: 0,
                locked: false
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
