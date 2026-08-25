/**
 * Campaign Theme Configuration System
 * Defines visual themes for each campaign type, making level generation
 * more efficient and consistent
 */

export class CampaignThemeConfig {
    static CAMPAIGNS = {
        forest: {
            id: 'forest',
            name: 'Forest',
            description: 'Lush green forests with natural features',
            pathColors: {
                pathBaseColor: '#8b7355',
                edgeBushColor: '#1f6f1f',
                edgeRockColor: '#807f80',
                edgeGrassColor: '#2e8b2e'
            },
            terrainDefaults: {
                treeColor: '#2d5016',
                treeAccent: '#4a7c2c',
                rockColor: '#808080',
                rockAccent: '#666666'
            }
        },
        mountain: {
            id: 'mountain',
            name: 'Mountain (Icy)',
            description: 'Snowy peaks with pine forests and cold tones',
            pathColors: {
                pathBaseColor: '#a9a9a9',
                edgeBushColor: '#1a3a2a',
                edgeRockColor: '#6a7a7a',
                edgeGrassColor: '#dcdce0'
            },
            terrainDefaults: {
                treeColor: '#1a3a2a',
                treeAccent: '#2a5a4a',
                rockColor: '#7a8a8a',
                rockAccent: '#6a7a7a'
            }
        },
        desert: {
            id: 'desert',
            name: 'Desert',
            description: 'Vast sandy dunes with arid vegetation',
            pathColors: {
                pathBaseColor: '#b89968',
                edgeBushColor: '#8a6f2a',
                edgeRockColor: '#9a8a6a',
                edgeGrassColor: '#d9a652'
            },
            terrainDefaults: {
                treeColor: '#7a5a2a',
                treeAccent: '#9a7a4a',
                rockColor: '#a89a6a',
                rockAccent: '#8a7a5a'
            }
        },
        space: {
            id: 'space',
            name: 'Space',
            description: 'Alien world with otherworldly colors',
            pathColors: {
                pathBaseColor: '#5a7a9a',
                edgeBushColor: '#3a6a5a',
                edgeRockColor: '#6a5a9a',
                edgeGrassColor: '#4a8aaa'
            },
            terrainDefaults: {
                treeColor: '#5a6a8a',
                treeAccent: '#7a8aaa',
                rockColor: '#7a5a9a',
                rockAccent: '#6a4a8a'
            }
        }
    };

    /**
     * Get a campaign theme by ID
     */
    static getTheme(campaignId) {
        return this.CAMPAIGNS[campaignId] || this.CAMPAIGNS.forest;
    }

    /**
     * Get all available campaign themes
     */
    static getAllThemes() {
        return Object.values(this.CAMPAIGNS);
    }

    /**
     * Get campaign names for dropdown/selection
     */
    static getCampaignOptions() {
        return Object.entries(this.CAMPAIGNS).map(([key, value]) => ({
            id: key,
            name: value.name,
            description: value.description
        }));
    }

    /**
     * Get campaign-specific terrain rendering info
     */
    static getTerrainRenderingInfo(campaignId) {
        const theme = this.getTheme(campaignId);
        const terrain = theme.terrainDefaults;
        
        switch(campaignId) {
            case 'forest':
                return {
                    treeType: 'deciduous',
                    rockType: 'granite',
                    primaryColor: terrain.treeColor,
                    accentColor: terrain.treeAccent,
                    rockColor: terrain.rockColor,
                    rockAccent: terrain.rockAccent,
                    description: 'Forest Trees & Granite Rocks'
                };
            case 'mountain':
                return {
                    treeType: 'snowypine',
                    rockType: 'snowystone',
                    primaryColor: '#1a3a2a',
                    accentColor: '#4a8a6a',
                    rockColor: '#8a9aaa',
                    rockAccent: '#7a8aaa',
                    description: 'Snowy Pine Trees & Icy Rocks'
                };
            case 'desert':
                return {
                    treeType: 'cactus',
                    rockType: 'sandstone',
                    primaryColor: '#8a7a4a',
                    accentColor: '#a89a5a',
                    rockColor: '#b89a6a',
                    rockAccent: '#a87a5a',
                    description: 'Cacti & Sandstone Rocks'
                };
            case 'space':
                return {
                    treeType: 'crystalstructure',
                    rockType: 'alienrock',
                    primaryColor: '#6a7aaa',
                    accentColor: '#8a9aca',
                    rockColor: '#8a6aaa',
                    rockAccent: '#7a5aaa',
                    description: 'Crystal Structures & Alien Rocks'
                };
            default:
                return {
                    treeType: 'generic',
                    rockType: 'generic',
                    primaryColor: terrain.treeColor,
                    accentColor: terrain.treeAccent,
                    rockColor: terrain.rockColor,
                    rockAccent: terrain.rockAccent,
                    description: 'Generic Terrain'
                };
        }
    }

    /**
     * No-op: visual settings are now fully campaign-controlled, no form inputs to update.
     */
    static applyThemeToForm(campaignId) {
    }
}
