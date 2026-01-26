/**
 * MusicRegistry - Central registry for all game music tracks
 * Follows the Registry pattern used for Towers and Enemies
 */
export class MusicRegistry {
    static registry = {};
    
    /**
     * Register a music track
     * @param {string} name - Unique identifier for the track
     * @param {string} path - Path to the audio file (relative to public/)
     * @param {object} options - Additional options (loop, category, etc.)
     */
    static registerMusic(name, path, options = {}) {
        this.registry[name] = {
            path: path,
            loop: options.loop !== false, // Default to true
            category: options.category || 'music', // 'music', 'menu', 'gameplay', etc.
            volume: options.volume || 1.0
        };
    }
    
    /**
     * Get a registered music track
     */
    static getMusic(name) {
        return this.registry[name];
    }
    
    /**
     * Get all registered tracks
     */
    static getAllMusic() {
        return { ...this.registry };
    }
    
    /**
     * Get all tracks in a specific category
     */
    static getMusicByCategory(category) {
        return Object.entries(this.registry)
            .filter(([_, data]) => data.category === category)
            .reduce((acc, [name, data]) => {
                acc[name] = data;
                return acc;
            }, {});
    }
    
    /**
     * Check if a track is registered
     */
    static hasMusic(name) {
        return this.registry.hasOwnProperty(name);
    }
}

/**
 * Initialize the music registry with game tracks
 * Add new music tracks here following this pattern
 */
export function initializeMusicRegistry() {
    // Menu theme - plays in main menu, campaign menu (after campaign selected), level selection
    MusicRegistry.registerMusic(
        'menu-theme',
        'assets/audio/music/TouwersTheme.mp3',
        {
            loop: true,
            category: 'menu',
            volume: 0.7
        }
    );
    
    // Settlement theme songs - multiple songs, one chosen randomly and looped
    MusicRegistry.registerMusic(
        'settlement-theme-1',
        'assets/audio/music/SettlementSongs/Settlement_Theme1.mp3',
        {
            loop: true,
            category: 'settlement',
            volume: 0.7
        }
    );

    MusicRegistry.registerMusic(
        'settlement-theme-2',
        'assets/audio/music/SettlementSongs/Settlement_Theme2.mp3',
        {
            loop: true,
            category: 'settlement',
            volume: 0.7
        }
    );

    MusicRegistry.registerMusic(
        'settlement-theme-3',
        'assets/audio/music/SettlementSongs/Settlement_Theme3.mp3',
        {
            loop: true,
            category: 'settlement',
            volume: 0.7
        }
    );
    
    // CAMPAIGN-SPECIFIC MUSIC TRACKS
    // Each campaign type has its own dedicated music folder and songs
    
    // Campaign 1 (Forest) songs
    MusicRegistry.registerMusic(
        'campaign-1-battle-1',
        'assets/audio/music/CampaignSongs/ForestSongs/Forest_Battle.mp3',
        {
            loop: true,
            category: 'campaign-1',
            volume: 0.7
        }
    );

    MusicRegistry.registerMusic(
        'campaign-1-battle-2',
        'assets/audio/music/CampaignSongs/ForestSongs/Forest_Battle2.mp3',
        {
            loop: true,
            category: 'campaign-1',
            volume: 0.7
        }
    );
    
    MusicRegistry.registerMusic(
        'campaign-1-battle-3',
        'assets/audio/music/CampaignSongs/ForestSongs/Forest_Battle3.mp3',
        {
            loop: true,
            category: 'campaign-1',
            volume: 0.7
        }
    );

    // Campaign 2 (Mountain) songs
    MusicRegistry.registerMusic(
        'campaign-2-battle-1',
        'assets/audio/music/CampaignSongs/MountainSongs/Mountain_Battle.mp3',
        {
            loop: true,
            category: 'campaign-2',
            volume: 0.7
        }
    );

    // Campaign 3 (Desert) songs
    MusicRegistry.registerMusic(
        'campaign-3-battle-1',
        'assets/audio/music/CampaignSongs/DesertSongs/Desert_Battle.mp3',
        {
            loop: true,
            category: 'campaign-3',
            volume: 0.7
        }
    );

    MusicRegistry.registerMusic(
        'campaign-3-battle-2',
        'assets/audio/music/CampaignSongs/DesertSongs/Desert_Battle2.mp3',
        {
            loop: true,
            category: 'campaign-3',
            volume: 0.7
        }
    );

    // Campaign 4 (Space) songs - fallback to Forest songs for now since SpaceSongs folder is empty
    // TODO: Add actual space music tracks when available
    MusicRegistry.registerMusic(
        'campaign-4-battle-1',
        'assets/audio/music/CampaignSongs/SpaceSongs/Space_Battle.mp3',
        {
            loop: true,
            category: 'campaign-4',
            volume: 0.7
        }
    );

    MusicRegistry.registerMusic(
        'campaign-4-battle-2',
        'assets/audio/music/CampaignSongs/SpaceSongs/Space_Battle2.mp3',
        {
            loop: true,
            category: 'campaign-4',
            volume: 0.7
        }
    );

    // Campaign 5 (Level Testing/Sandbox) songs - use Forest songs as fallback
    MusicRegistry.registerMusic(
        'campaign-5-battle-1',
        'assets/audio/music/CampaignSongs/ForestSongs/Forest_Battle.mp3',
        {
            loop: true,
            category: 'campaign-5',
            volume: 0.7
        }
    );

    MusicRegistry.registerMusic(
        'campaign-5-battle-2',
        'assets/audio/music/CampaignSongs/ForestSongs/Forest_Battle2.mp3',
        {
            loop: true,
            category: 'campaign-5',
            volume: 0.7
        }
    );
    
    // Victory and Defeat tunes - play on results screen
    MusicRegistry.registerMusic(
        'victory-tune',
        'assets/audio/music/CampaignSongs/Victory_Tune.mp3',
        {
            loop: false,
            category: 'results',
            volume: 0.8
        }
    );
    
    MusicRegistry.registerMusic(
        'defeat-tune',
        'assets/audio/music/CampaignSongs/Defeat_Tune.mp3',
        {
            loop: false,
            category: 'results',
            volume: 0.8
        }
    );
}
