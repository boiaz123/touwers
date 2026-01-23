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
                description: 'Defend the mystical forest from an unknown darkness.',
                icon: '🌲',
                difficulty: 'Beginner',
                class: campaignClasses.Campaign1,
                rewards: {
                    gold: 5000,
                    experience: 1500,
                    unlocks: ['Forestkeeper\'s Bow']
                },
                story: 'Strange creatures have emerged from the depths of the ancient forest. No one knows where they come from or why they suddenly attack. You take up arms to defend the woodland realm, but questions plague your mind... What are these creatures? Why do they feel so unnatural? The answers must lie deeper within the mystery that surrounds your world.',
                progress: 0
            },
            'campaign-2': {
                id: 'campaign-2',
                name: 'The Mountain Campaign',
                description: 'Traverse the snowy peaks to reach the desert beyond.',
                icon: '⛰️',
                difficulty: 'Intermediate',
                class: campaignClasses.Campaign2,
                rewards: {
                    gold: 7500,
                    experience: 2000,
                    unlocks: ['Alpine Fortress']
                },
                story: 'The forest victory reveals a disturbing truth: these creatures are coordinated, purposeful. An ancient prophecy speaks of an artifact hidden in the desert that holds the key to understanding—and defeating—these magical beings. But the desert lies beyond the treacherous mountains. You must brave the alpine peaks, survive the harsh conditions, and reach the desert planes where answers await. Each victory brings more frog creatures, each one more powerful and magical than before.',
                progress: 0,
                locked: false
            },
            'campaign-3': {
                id: 'campaign-3',
                name: 'The Desert Campaign',
                description: 'Uncover the ancient artifact that holds the secret to victory.',
                icon: '🏜️',
                difficulty: 'Advanced',
                class: campaignClasses.Campaign3,
                rewards: {
                    gold: 10000,
                    experience: 3000,
                    unlocks: ['Desert Nomad\'s Blade']
                },
                story: 'At last, the desert stretches before you. The creatures here are elemental, infused with the very essence of earth, water, fire, and air. They guard the oasis settlements fiercely, but you press forward. Finally, you discover the artifact—a radiant crystal that pulses with otherworldly energy. Ancient inscriptions reveal a shocking truth: these magical frogs are not native to your world. They are from another dimension, another plane of existence entirely. The artifact is a key—a gateway that will allow you to enter their realm and face their leader, the fabled Frog King.',
                progress: 0,
                locked: false
            },
            'campaign-4': {
                id: 'campaign-4',
                name: 'The Frog King\'s Realm',
                description: 'Enter the interdimensional plane and face the Frog King.',
                icon: '👑',
                difficulty: 'Expert',
                class: campaignClasses.Campaign4,
                rewards: {
                    gold: 15000,
                    experience: 4000,
                    unlocks: ['Crown of Victory', 'Interdimensional Compass']
                },
                story: 'Using the artifact\'s power, you open a rift to the Frog King\'s otherworldly realm. The dimension itself is strange and hostile, its landscape twisted by ancient magic. The Frog King rules from his throne at the end of a perilous path, and his champions stand ready to defend him. This is your final battle. The fate of both your world and theirs depends on your victory. The Frog King awaits...',
                progress: 0,
                locked: false
            },
            'campaign-5': {
                id: 'campaign-5',
                name: 'Level Testing Campaign',
                description: 'A sandbox campaign for testing and experimentation.',
                icon: '🧪',
                difficulty: 'Testing',
                class: campaignClasses.Campaign5,
                rewards: {
                    gold: 0,
                    experience: 0,
                    unlocks: []
                },
                story: 'A test environment for level design and gameplay mechanics. Use this campaign to experiment with different tower and enemy combinations without affecting your main progression.',
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
