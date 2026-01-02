# Audio System Guide

This directory contains all audio assets for Touwers Tower Defense Game.

## Directory Structure

```
audio/
├── music/
│   ├── menu-theme.mp3      # Main menu, settlement, campaign, level selection music
│   ├── level-1-theme.mp3   # Level 1 gameplay music
│   ├── level-2-theme.mp3   # Level 2 gameplay music
│   ├── level-3-theme.mp3   # Level 3 gameplay music
│   ├── level-4-theme.mp3   # Level 4 gameplay music
│   └── level-5-theme.mp3   # Level 5 gameplay music
└── sfx/
    ├── button-click.mp3    # Button click sound
    ├── menu-open.mp3       # Menu opening sound
    ├── tower-place.mp3     # Tower placement sound
    ├── tower-shoot.mp3     # Tower shooting sound
    ├── enemy-hit.mp3       # Enemy hit/damage sound
    └── enemy-death.mp3     # Enemy death sound
```

## Adding Music Files

### Menu Theme
1. Place your menu theme file at: `audio/music/menu-theme.mp3`
2. This file will automatically play when:
   - Game starts (StartScreen)
   - Main Menu is active
   - Campaign Menu is active
   - Settlement Hub is active
   - Save Slot Selection is active
   - Load Game is active
   - Options Menu is active

The music loops automatically.

### Level-Specific Music
1. For Level N, place the file at: `audio/music/level-N-theme.mp3`
   - `audio/music/level-1-theme.mp3`
   - `audio/music/level-2-theme.mp3`
   - `audio/music/level-3-theme.mp3`
   - `audio/music/level-4-theme.mp3`
   - `audio/music/level-5-theme.mp3`

2. Level music will automatically play when gameplay starts for that level

### Adding New Levels/Tracks
If you add a new level, update the `getAudioTrackForLevel()` method in [GameplayState.js](../../js/core/states/GameplayState.js) to map your level ID to a track name:

```javascript
const levelMusicMap = {
    'your-level-id': 'your-track-name',
    // ... existing mappings
};
```

Then register the track in [MusicRegistry.js](../../js/core/MusicRegistry.js):

```javascript
MusicRegistry.registerMusic(
    'your-track-name',
    'assets/audio/music/your-track-name.mp3',
    {
        loop: true,
        category: 'gameplay',
        volume: 0.7
    }
);
```

## Adding Sound Effects

Place sound effect files in the `sfx/` directory and register them in [SFXRegistry.js](../../js/core/SFXRegistry.js):

```javascript
SFXRegistry.registerSFX(
    'your-sfx-name',
    'assets/audio/sfx/your-sfx-name.mp3',
    {
        category: 'sfx', // or 'ui', 'impact', etc.
        volume: 0.6
    }
);
```

Then play it from your code:

```javascript
this.stateManager.audioManager.playSFX('your-sfx-name');
```

## Audio Manager API

The `AudioManager` class provides these methods:

### Music Control
```javascript
// Play music (with optional fade-in)
audioManager.playMusic('menu-theme', false);
audioManager.playMusic('menu-theme', true); // with fade-in

// Stop music (with optional fade-out)
audioManager.stopMusic(false);
audioManager.stopMusic(true); // with fade-out

// Pause/Resume
audioManager.pauseMusic();
audioManager.resumeMusic();

// Fade in/out
audioManager.fadeInMusic(targetVolume, durationMs);
audioManager.fadeOutMusic(durationMs, callback);
```

### SFX Control
```javascript
// Play a sound effect (with optional volume override)
audioManager.playSFX('button-click');
audioManager.playSFX('button-click', 0.5); // 50% volume

// Get current track
audioManager.getCurrentTrack(); // Returns 'menu-theme' or level track name
audioManager.isPlaying(); // Returns true if music is playing
```

### Volume Control
```javascript
// Set volumes (0.0 - 1.0)
audioManager.setMusicVolume(0.7);
audioManager.setSFXVolume(0.8);

// Get current volumes
audioManager.getMusicVolume();
audioManager.getSFXVolume();
```

### Mute Control
```javascript
audioManager.mute();
audioManager.unmute();
audioManager.isMutedState(); // Returns true if muted
```

## Accessing AudioManager from Game States

The AudioManager is available from any game state:

```javascript
if (this.stateManager.audioManager) {
    this.stateManager.audioManager.playMusic('menu-theme');
    this.stateManager.audioManager.playSFX('button-click');
}
```

## File Format Requirements

- **Supported formats**: MP3, WAV, OGG, WebM
- **Recommended format**: MP3 (best browser compatibility)
- **Sample rate**: 44.1kHz or higher
- **Bit rate**: 128kbps or higher for music, 64kbps for SFX

## Notes

- Music files loop automatically unless specified otherwise
- Sound effects play without looping by default
- Multiple SFX can play simultaneously
- Only one music track plays at a time
- Music volume and SFX volume are controlled separately
- The audio system gracefully handles missing files with console warnings
