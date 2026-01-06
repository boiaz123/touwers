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
    // UI/Menu sounds
    SFXRegistry.registerSFX(
        'button-click',
        'assets/audio/sfx/MenuSounds/ButtonClick.mp3',
        {
            category: 'ui',
            volume: 0.6
        }
    );
    
    SFXRegistry.registerSFX(
        'open-campaign',
        'assets/audio/sfx/MenuSounds/OpenCampaign.mp3',
        {
            category: 'ui',
            volume: 0.7
        }
    );
    
    // Building/Defender sounds
    SFXRegistry.registerSFX(
        'hiring-defender',
        'assets/audio/sfx/BuildingSounds/HiringDefender.mp3',
        {
            category: 'building',
            volume: 0.6
        }
    );
    
    SFXRegistry.registerSFX(
        'tower-forge',
        'assets/audio/sfx/BuildingSounds/TowerForge.mp3',
        {
            category: 'building',
            volume: 0.6
        }
    );
    
    // Gameplay sounds
    SFXRegistry.registerSFX(
        'wave-start',
        'assets/audio/sfx/LevelSounds/WaveStart.mp3',
        {
            category: 'gameplay',
            volume: 0.7
        }
    );
    
    SFXRegistry.registerSFX(
        'upgrade',
        'assets/audio/sfx/LevelSounds/Upgrade.mp3',
        {
            category: 'gameplay',
            volume: 0.6
        }
    );
}
