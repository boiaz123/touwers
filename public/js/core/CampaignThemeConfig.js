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
            visualConfig: {
                grassColors: {
                    top: '#4a6741',
                    upper: '#5a7751',
                    lower: '#6a8761',
                    bottom: '#3a5731'
                },
                grassPatchDensity: 8000,
                grassPatchSizeMin: 6,
                grassPatchSizeMax: 18,
                dirtPatchCount: 8,
                dirtPatchAlpha: 0.15,
                flowerDensity: 25000,
                pathBaseColor: '#8b7355',
                pathTextureSpacing: 15,
                pathEdgeVegetationChance: 0.4,
                edgeBushColor: '#1f6f1f',
                edgeBushAccentColor: '#28a028',
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
            visualConfig: {
                grassColors: {
                    top: '#e8e8f0',
                    upper: '#d8d8e0',
                    lower: '#c8c8d0',
                    bottom: '#b8b8c0'
                },
                grassPatchDensity: 12000,
                grassPatchSizeMin: 6,
                grassPatchSizeMax: 18,
                dirtPatchCount: 12,
                dirtPatchAlpha: 0.08,
                flowerDensity: 80000, // Sparse flowers in snow
                pathBaseColor: '#a9a9a9',
                pathTextureSpacing: 18,
                pathEdgeVegetationChance: 0.3,
                edgeBushColor: '#1a3a2a', // Dark green for pine
                edgeBushAccentColor: '#2a5a4a',
                edgeRockColor: '#6a7a7a', // Grey stone
                edgeGrassColor: '#dcdce0' // Light snow edge
            },
            terrainDefaults: {
                treeColor: '#1a3a2a', // Pine tree color
                treeAccent: '#2a5a4a',
                rockColor: '#7a8a8a', // Snowy grey rock
                rockAccent: '#6a7a7a'
            }
        },
        desert: {
            id: 'desert',
            name: 'Desert',
            description: 'Vast sandy dunes with arid vegetation',
            visualConfig: {
                grassColors: {
                    top: '#e8d5a0',
                    upper: '#dcc979',
                    lower: '#d0b852',
                    bottom: '#c4a140'
                },
                grassPatchDensity: 10000,
                grassPatchSizeMin: 8,
                grassPatchSizeMax: 20,
                dirtPatchCount: 15,
                dirtPatchAlpha: 0.12,
                flowerDensity: 150000, // Very sparse
                pathBaseColor: '#b89968',
                pathTextureSpacing: 20,
                pathEdgeVegetationChance: 0.15,
                edgeBushColor: '#8a6f2a', // Dried brown
                edgeBushAccentColor: '#a88f3a',
                edgeRockColor: '#9a8a6a', // Sandstone
                edgeGrassColor: '#d9a652' // Sandy tan
            },
            terrainDefaults: {
                treeColor: '#7a5a2a', // Dried cactus/bush
                treeAccent: '#9a7a4a',
                rockColor: '#a89a6a', // Sandstone
                rockAccent: '#8a7a5a'
            }
        },
        space: {
            id: 'space',
            name: 'Space',
            description: 'Alien world with otherworldly colors',
            visualConfig: {
                grassColors: {
                    top: '#1a3a5a',
                    upper: '#2a4a7a',
                    lower: '#1a5a8a',
                    bottom: '#0a3a6a'
                },
                grassPatchDensity: 9000,
                grassPatchSizeMin: 6,
                grassPatchSizeMax: 18,
                dirtPatchCount: 10,
                dirtPatchAlpha: 0.15,
                flowerDensity: 30000,
                pathBaseColor: '#5a7a9a',
                pathTextureSpacing: 16,
                pathEdgeVegetationChance: 0.35,
                edgeBushColor: '#3a6a5a', // Cyan-green alien flora
                edgeBushAccentColor: '#5a9a8a',
                edgeRockColor: '#6a5a9a', // Purple alien rock
                edgeGrassColor: '#4a8aaa' // Space blue
            },
            terrainDefaults: {
                treeColor: '#5a6a8a', // Alien crystalline structures
                treeAccent: '#7a8aaa',
                rockColor: '#7a5a9a', // Purple alien rock
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
     * Apply a theme's visual config to update form fields
     */
    static applyThemeToForm(campaignId) {
        const theme = this.getTheme(campaignId);
        if (!theme) return;

        const config = theme.visualConfig;

        // Update color inputs
        document.getElementById('grassTopColor').value = config.grassColors.top;
        document.getElementById('grassUpperColor').value = config.grassColors.upper;
        document.getElementById('grassLowerColor').value = config.grassColors.lower;
        document.getElementById('grassBottomColor').value = config.grassColors.bottom;
        document.getElementById('pathColor').value = config.pathBaseColor;
        document.getElementById('bushColor').value = config.edgeBushColor;
        document.getElementById('rockColor').value = config.edgeRockColor;
        document.getElementById('edgeGrassColor').value = config.edgeGrassColor;

        // Update density selects
        document.getElementById('grassDensity').value = config.grassPatchDensity;
        document.getElementById('flowerDensity').value = config.flowerDensity;
    }
}
