/**
 * Audio System Usage Examples
 * 
 * This file demonstrates how to use the audio system throughout the game.
 * Copy patterns from here into your code when needed.
 * 
 * NOTE: This is a reference/documentation file with example code snippets.
 * Do not use this as an actual module - copy the code patterns into your own files.
 */

// ============================================================================
// EXAMPLE 1: Playing Music from Game States
// ============================================================================

// In any game state's enter() method, add:
/*
    // Play menu theme
    if (this.stateManager.audioManager) {
        this.stateManager.audioManager.playMusic('menu-theme');
    }
    
    // Or play with fade-in (1 second fade)
    if (this.stateManager.audioManager) {
        this.stateManager.audioManager.playMusic('menu-theme', true);
    }
*/

// ============================================================================
// EXAMPLE 2: Playing Level Music
// ============================================================================

// In GameplayState, the music is automatically played based on level ID:
// This is handled in the enter() method using getAudioTrackForLevel()
// but here's how to do it manually:

/*
playLevelMusic(levelId) {
    const audioManager = this.stateManager.audioManager;
    if (!audioManager) return;
    
    // Map level ID to music track
    const musicTrack = this.getAudioTrackForLevel(levelId);
    audioManager.playMusic(musicTrack);
}
*/

// ============================================================================
// EXAMPLE 3: Playing Sound Effects
// ============================================================================

// Play a button click:
/*
handleButtonClick() {
    if (this.stateManager.audioManager) {
        this.stateManager.audioManager.playSFX('button-click');
    }
}
*/

// Play with volume override (50% volume):
/*
handleSpecialEffect() {
    if (this.stateManager.audioManager) {
        this.stateManager.audioManager.playSFX('tower-place', 0.5);
    }
}
*/

// ============================================================================
// EXAMPLE 4: Music with Fade Effects
// ============================================================================

// Transition from menu to level with fade:
/*
transitionToLevel() {
    const audioManager = this.stateManager.audioManager;
    if (!audioManager) return;
    
    // Fade out menu music over 1 second
    audioManager.fadeOutMusic(1000, () => {
        // After fade completes, play level music
        audioManager.playMusic('level-1-theme');
    });
}
*/

// ============================================================================
// EXAMPLE 5: Pause and Resume Music
// ============================================================================

// When game is paused:
/*
pauseGame() {
    if (this.stateManager.audioManager) {
        this.stateManager.audioManager.pauseMusic();
    }
}
*/

// When game is resumed:
/*
resumeGame() {
    if (this.stateManager.audioManager) {
        this.stateManager.audioManager.resumeMusic();
    }
}
*/

// ============================================================================
// EXAMPLE 6: Volume Control
// ============================================================================

// Set music volume to 70%:
/*
setMusicVolume(value) {
    if (this.stateManager.audioManager) {
        this.stateManager.audioManager.setMusicVolume(value / 100);
    }
}
*/

// Set SFX volume to 80%:
/*
setSFXVolume(value) {
    if (this.stateManager.audioManager) {
        this.stateManager.audioManager.setSFXVolume(value / 100);
    }
}
*/

// ============================================================================
// EXAMPLE 7: Mute/Unmute
// ============================================================================

/*
toggleMute() {
    const audioManager = this.stateManager.audioManager;
    if (!audioManager) return;
    
    if (audioManager.isMutedState()) {
        audioManager.unmute();
    } else {
        audioManager.mute();
    }
}
*/

// ============================================================================
// EXAMPLE 8: Registering New Music (in MusicRegistry.js)
// ============================================================================

// Add a new music track to the registry:
/*
MusicRegistry.registerMusic(
    'boss-theme',           // Unique identifier
    'assets/audio/music/boss-theme.mp3',  // File path
    {
        loop: true,         // Loop the music
        category: 'gameplay',
        volume: 0.7
    }
);
*/

// ============================================================================
// EXAMPLE 9: Registering New Sound Effects (in SFXRegistry.js)
// ============================================================================

// Add a new sound effect to the registry:
/*
SFXRegistry.registerSFX(
    'powerup-collected',     // Unique identifier
    'assets/audio/sfx/powerup.mp3',  // File path
    {
        category: 'sfx',     // Can be 'ui', 'impact', 'sfx', etc.
        volume: 0.7
    }
);
*/

// Then play it:
/*
this.stateManager.audioManager.playSFX('powerup-collected');
*/

// ============================================================================
// EXAMPLE 10: Checking Audio State
// ============================================================================

// Get current playing track:
/*
const currentTrack = audioManager.getCurrentTrack();
console.log('Now playing:', currentTrack);
*/

// Check if music is playing:
/*
if (audioManager.isPlaying()) {
    console.log('Music is playing');
}
*/

// Get current volumes:
/*
const musicVol = audioManager.getMusicVolume();
const sfxVol = audioManager.getSFXVolume();
console.log(`Music: ${musicVol}, SFX: ${sfxVol}`);
*/
