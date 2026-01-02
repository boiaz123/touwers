# Audio System Implementation Summary

## What Was Added

A comprehensive audio system has been added to Touwers Tower Defense Game with full support for background music and sound effects.

## Key Components

### 1. **AudioManager** (`public/js/core/AudioManager.js`)
- Central class managing all audio playback
- Handles music looping, fading, volume control, and mute functionality
- Manages both background music and sound effects
- Provides clean API for all audio operations

### 2. **MusicRegistry** (`public/js/core/MusicRegistry.js`)
- Registry pattern for all background music tracks
- Pre-configured with menu theme and 5 level-specific themes
- Easy to add new tracks

### 3. **SFXRegistry** (`public/js/core/SFXRegistry.js`)
- Registry pattern for sound effects
- Pre-configured with common SFX (button clicks, tower sounds, etc.)
- Supports categorization (ui, sfx, impact, etc.)

### 4. **Directory Structure**
```
public/assets/audio/
├── music/
│   ├── menu-theme.mp3 (main menu music - loops)
│   ├── level-1-theme.mp3
│   ├── level-2-theme.mp3
│   ├── level-3-theme.mp3
│   ├── level-4-theme.mp3
│   └── level-5-theme.mp3
└── sfx/
    ├── button-click.mp3
    ├── menu-open.mp3
    ├── tower-place.mp3
    ├── tower-shoot.mp3
    ├── enemy-hit.mp3
    └── enemy-death.mp3
```

## Current Behavior

### Menu Theme
The menu theme automatically plays and loops in:
- **StartScreen** - Game startup splash screen
- **MainMenu** - Main menu with buttons
- **CampaignMenu** - Campaign selection screen
- **SettlementHub** - Settlement building hub
- **SaveSlotSelection** - Save slot selection screen
- **LoadGame** - Load game screen
- **OptionsMenu** - Options/settings screen

### Level Music
When a level starts in **GameplayState**, the appropriate level-specific music automatically plays based on the level ID.

The mapping is handled in `GameplayState.getAudioTrackForLevel()`:
- `level-1` → `level-1-theme`
- `level-2` → `level-2-theme`
- `level-3` → `level-3-theme`
- `level-4` → `level-4-theme`
- `level-5` → `level-5-theme`

## How to Add Your Menu Theme

1. **Prepare your audio file** in MP3 format (best browser compatibility)
   - Recommended: 44.1kHz sample rate, 128kbps bitrate
   - Should be loopable (no clicks/pops when looping)

2. **Place the file here:**
   ```
   public/assets/audio/music/menu-theme.mp3
   ```

3. **Done!** The system will automatically pick it up and play it when you start the game.

## How to Add Level Music

For each level, place the appropriate theme file:
- `public/assets/audio/music/level-1-theme.mp3`
- `public/assets/audio/music/level-2-theme.mp3`
- `public/assets/audio/music/level-3-theme.mp3`
- `public/assets/audio/music/level-4-theme.mp3`
- `public/assets/audio/music/level-5-theme.mp3`

## How to Add Sound Effects

1. **Register the SFX in SFXRegistry.js:**
   ```javascript
   SFXRegistry.registerSFX(
       'my-sfx-name',
       'assets/audio/sfx/my-sfx-name.mp3',
       {
           category: 'sfx',  // or 'ui', 'impact'
           volume: 0.6
       }
   );
   ```

2. **Play it from your code:**
   ```javascript
   if (this.stateManager.audioManager) {
       this.stateManager.audioManager.playSFX('my-sfx-name');
   }
   ```

## Adding Music for New Levels

If you create a new level beyond level 5:

1. **Create the audio file:**
   ```
   public/assets/audio/music/level-6-theme.mp3
   ```

2. **Update the mapping in GameplayState.js:**
   ```javascript
   getAudioTrackForLevel(levelId) {
       const levelMusicMap = {
           'level-6': 'level-6-theme',  // Add this line
           // ... existing mappings
       };
   }
   ```

3. **Register in MusicRegistry.js:**
   ```javascript
   MusicRegistry.registerMusic(
       'level-6-theme',
       'assets/audio/music/level-6-theme.mp3',
       {
           loop: true,
           category: 'gameplay',
           volume: 0.7
       }
   );
   ```

## Audio Manager API Reference

### Music Methods
```javascript
audioManager.playMusic(trackName, fadeIn = false)
audioManager.stopMusic(fadeOut = false)
audioManager.pauseMusic()
audioManager.resumeMusic()
audioManager.fadeInMusic(targetVolume, duration)
audioManager.fadeOutMusic(duration, callback)
```

### SFX Methods
```javascript
audioManager.playSFX(sfxName, volume = null)
```

### Volume Methods
```javascript
audioManager.setMusicVolume(0.0 - 1.0)
audioManager.setSFXVolume(0.0 - 1.0)
audioManager.getMusicVolume()
audioManager.getSFXVolume()
```

### Utility Methods
```javascript
audioManager.mute()
audioManager.unmute()
audioManager.isMutedState()
audioManager.getCurrentTrack()
audioManager.isPlaying()
```

## Modified Files

- **game.js** - Added AudioManager initialization
- **GameStateManager.js** - Added audioManager reference
- **StartScreen.js** - Added menu music playback
- **MainMenu.js** - Added menu music playback
- **CampaignMenu.js** - Added menu music playback
- **SettlementHub.js** - Added menu music playback
- **SaveSlotSelection.js** - Added menu music playback
- **OptionsMenu.js** - Added menu music playback
- **LoadGame.js** - Added menu music playback
- **GameplayState.js** - Added level music playback and getAudioTrackForLevel() method

## New Files Created

- **AudioManager.js** - Main audio management system
- **MusicRegistry.js** - Music track registry
- **SFXRegistry.js** - Sound effect registry
- **audio/README.md** - Detailed audio documentation
- **audio/USAGE_EXAMPLES.js** - Code examples for using the audio system

## Notes

- Audio files follow the **Registry pattern**, consistent with the codebase architecture (similar to TowerRegistry/EnemyRegistry)
- The system gracefully handles missing audio files with console warnings
- AudioManager is available from any game state via `this.stateManager.audioManager`
- Multiple sound effects can play simultaneously; only one music track plays at a time
- Music and SFX volumes are controlled separately
- All music files loop automatically; SFX don't loop unless specified

## Testing

The development server is already running at `http://localhost:3000`. You can test the audio system by:
1. Starting the game - you should hear the menu theme
2. Navigating between menu screens - the menu theme continues looping
3. Starting a level - the level-specific music should play
4. Check browser console for any audio-related warnings or errors

## Next Steps (Optional Enhancements)

- Add sound effects for button clicks, tower placement, enemy death, etc.
- Add boss theme music for boss levels
- Implement dynamic music layers that change based on game intensity
- Add fade transitions between different music tracks
- Create audio settings/sliders in the options menu
- Add ambient background sounds
