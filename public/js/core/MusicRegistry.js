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
    // Menu theme - loops in main menu, campaign menu, settlement hub, level selection
    MusicRegistry.registerMusic(
        'menu-theme',
        'assets/audio/music/TouwersTheme.mp3',
        {
            loop: true,
            category: 'menu',
            volume: 0.7
        }
    );
    
    // Gameplay tracks for different levels
    MusicRegistry.registerMusic(
        'level-1-theme',
        'assets/audio/music/level-1-theme.mp3',
        {
            loop: true,
            category: 'gameplay',
            volume: 0.7
        }
    );
    
    MusicRegistry.registerMusic(
        'level-2-theme',
        'assets/audio/music/level-2-theme.mp3',
        {
            loop: true,
            category: 'gameplay',
            volume: 0.7
        }
    );
    
    MusicRegistry.registerMusic(
        'level-3-theme',
        'assets/audio/music/level-3-theme.mp3',
        {
            loop: true,
            category: 'gameplay',
            volume: 0.7
        }
    );
    
    MusicRegistry.registerMusic(
        'level-4-theme',
        'assets/audio/music/level-4-theme.mp3',
        {
            loop: true,
            category: 'gameplay',
            volume: 0.7
        }
    );
    
    MusicRegistry.registerMusic(
        'level-5-theme',
        'assets/audio/music/level-5-theme.mp3',
        {
            loop: true,
            category: 'gameplay',
            volume: 0.7
        }
    );
    
    // Add more tracks as needed
    // Example: MusicRegistry.registerMusic('boss-theme', 'assets/audio/music/boss-theme.mp3', { loop: true, category: 'gameplay' });
}
