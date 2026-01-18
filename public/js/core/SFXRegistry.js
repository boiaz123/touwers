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
    
    SFXRegistry.registerSFX(
        'training-ground',
        'assets/audio/sfx/BuildingSounds/TrainingGround.mp3',
        {
            category: 'building',
            volume: 0.6
        }
    );
    
    // Building menu sounds
    SFXRegistry.registerSFX(
        'castle-select',
        'assets/audio/sfx/BuildingSounds/CastleSelect.mp3',
        {
            category: 'building',
            volume: 0.6
        }
    );
    
    SFXRegistry.registerSFX(
        'academy',
        'assets/audio/sfx/BuildingSounds/Academy.mp3',
        {
            category: 'building',
            volume: 0.6
        }
    );
    
    SFXRegistry.registerSFX(
        'superweaponlab',
        'assets/audio/sfx/BuildingSounds/SuperWeaponLab.mp3',
        {
            category: 'building',
            volume: 0.6
        }
    );
    
    SFXRegistry.registerSFX(
        'minegoldclick',
        'assets/audio/sfx/BuildingSounds/MineGoldClick.mp3',
        {
            category: 'building',
            volume: 0.6
        }
    );
    
    SFXRegistry.registerSFX(
        'minegoldready',
        'assets/audio/sfx/BuildingSounds/MineGoldReady.mp3',
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
    
    // Tower attack sounds
    SFXRegistry.registerSFX(
        'arrow',
        'assets/audio/sfx/TowerSounds/Arrow.mp3',
        {
            category: 'tower',
            volume: 0.6
        }
    );
    
    SFXRegistry.registerSFX(
        'magic-tower',
        'assets/audio/sfx/TowerSounds/MagicTower.mp3',
        {
            category: 'tower',
            volume: 0.6
        }
    );
    
    SFXRegistry.registerSFX(
        'combination-tower',
        'assets/audio/sfx/TowerSounds/CombinationTower.mp3',
        {
            category: 'tower',
            volume: 0.6
        }
    );
    
    // Menu/Animation sounds
    SFXRegistry.registerSFX(
        'sword-smoke',
        'assets/audio/sfx/MenuSounds/SwordSmoke.mp3',
        {
            category: 'ui',
            volume: 0.7
        }
    );

    // Loot sounds
    SFXRegistry.registerSFX(
        'loot-drop',
        'assets/audio/sfx/LevelSounds/LootDrop.mp3',
        {
            category: 'gameplay',
            volume: 0.6
        }
    );

    SFXRegistry.registerSFX(
        'loot-collect',
        'assets/audio/sfx/LevelSounds/LootCollect.mp3',
        {
            category: 'gameplay',
            volume: 0.6
        }
    );

    SFXRegistry.registerSFX(
        'rare-loot-drop',
        'assets/audio/sfx/LevelSounds/RareLootDrop.mp3',
        {
            category: 'gameplay',
            volume: 0.7
        }
    );

    SFXRegistry.registerSFX(
        'rare-loot-collect',
        'assets/audio/sfx/LevelSounds/RareLootCollect.mp3',
        {
            category: 'gameplay',
            volume: 0.7
        }
    );

    // Tower attack and placement sounds
    SFXRegistry.registerSFX(
        'basic-tower',
        'assets/audio/sfx/TowerSounds/BasicTouwer.mp3',
        {
            category: 'tower',
            volume: 0.6
        }
    );

    SFXRegistry.registerSFX(
        'barricade-tower',
        'assets/audio/sfx/TowerSounds/BarricadeTouwer.mp3',
        {
            category: 'tower',
            volume: 0.6
        }
    );

    SFXRegistry.registerSFX(
        'poison-tower',
        'assets/audio/sfx/TowerSounds/PoisonTouwer.mp3',
        {
            category: 'tower',
            volume: 0.6
        }
    );

    SFXRegistry.registerSFX(
        'trebuchet-launch',
        'assets/audio/sfx/TowerSounds/TrebuchetTouwer.mp3',
        {
            category: 'tower',
            volume: 0.6
        }
    );

    SFXRegistry.registerSFX(
        'trebuchet-impact',
        'assets/audio/sfx/TowerSounds/TrebuchetImpact.mp3',
        {
            category: 'tower',
            volume: 0.6
        }
    );

    // Spell sounds
    SFXRegistry.registerSFX(
        'arcane-blast',
        'assets/audio/sfx/BuildingSounds/ArcaneBlast.mp3',
        {
            category: 'spell',
            volume: 0.7
        }
    );

    SFXRegistry.registerSFX(
        'chain-lightning',
        'assets/audio/sfx/BuildingSounds/ChainLightning.mp3',
        {
            category: 'spell',
            volume: 0.7
        }
    );

    SFXRegistry.registerSFX(
        'frost-nova',
        'assets/audio/sfx/BuildingSounds/FrostNova.mp3',
        {
            category: 'spell',
            volume: 0.7
        }
    );

    SFXRegistry.registerSFX(
        'meteor-strike',
        'assets/audio/sfx/BuildingSounds/MeteorStrike.mp3',
        {
            category: 'spell',
            volume: 0.7
        }
    );
}
