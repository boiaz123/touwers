/**
 * SFXRegistry - Central registry for all game sound effects
 * Follows the Registry pattern used for Towers and Enemies
 */
export class SFXRegistry {
    static registry = {};
    
    /**
     * Register a sound effect
     * @param {string} name - Unique identifier for the SFX
     * @param {string} path - Path to the audio file (relative to public/)
     * @param {object} options - Additional options (volume, category, etc.)
     */
    static registerSFX(name, path, options = {}) {
        this.registry[name] = {
            path: path,
            category: options.category || 'sfx', // 'sfx', 'ui', 'impact', etc.
            volume: options.volume || 1.0
        };
    }
    
    /**
     * Get a registered sound effect
     */
    static getSFX(name) {
        return this.registry[name];
    }
    
    /**
     * Get all registered sound effects
     */
    static getAllSFX() {
        return { ...this.registry };
    }
    
    /**
     * Get all SFX in a specific category
     */
    static getSFXByCategory(category) {
        return Object.entries(this.registry)
            .filter(([_, data]) => data.category === category)
            .reduce((acc, [name, data]) => {
                acc[name] = data;
                return acc;
            }, {});
    }
    
    /**
     * Check if a sound effect is registered
     */
    static hasSFX(name) {
        return this.registry.hasOwnProperty(name);
    }
}

/**
 * Initialize the SFX registry with game sound effects
 * Add new sound effects here following this pattern
 */
export function initializeSFXRegistry() {
    // UI sounds
    SFXRegistry.registerSFX(
        'button-click',
        'assets/audio/sfx/button-click.mp3',
        {
            category: 'ui',
            volume: 0.6
        }
    );
    
    SFXRegistry.registerSFX(
        'menu-open',
        'assets/audio/sfx/menu-open.mp3',
        {
            category: 'ui',
            volume: 0.5
        }
    );
    
    // Tower/Combat sounds
    SFXRegistry.registerSFX(
        'tower-place',
        'assets/audio/sfx/tower-place.mp3',
        {
            category: 'sfx',
            volume: 0.6
        }
    );
    
    SFXRegistry.registerSFX(
        'tower-shoot',
        'assets/audio/sfx/tower-shoot.mp3',
        {
            category: 'sfx',
            volume: 0.5
        }
    );
    
    SFXRegistry.registerSFX(
        'enemy-hit',
        'assets/audio/sfx/enemy-hit.mp3',
        {
            category: 'impact',
            volume: 0.5
        }
    );
    
    SFXRegistry.registerSFX(
        'enemy-death',
        'assets/audio/sfx/enemy-death.mp3',
        {
            category: 'impact',
            volume: 0.6
        }
    );
    
    // Add more sound effects as needed
    // Example: SFXRegistry.registerSFX('powerup', 'assets/audio/sfx/powerup.mp3', { category: 'sfx', volume: 0.7 });
}
