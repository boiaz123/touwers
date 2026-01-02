# 🎵 Audio System - Getting Started

Your audio system is ready to use! Here's everything you need to know.

## 🚀 Quick Start (30 seconds)

1. **Have your menu music file ready** (MP3 format recommended)

2. **Place it here:**
   ```
   public/assets/audio/music/menu-theme.mp3
   ```

3. **Done!** Start the game and you'll hear the menu theme playing automatically.

The menu music will loop in all menus (main menu, settings, campaign selection, etc.).

---

## 🎮 Adding Level Music (Optional)

For each level (1-5), place the theme file:
```
public/assets/audio/music/level-1-theme.mp3
public/assets/audio/music/level-2-theme.mp3
public/assets/audio/music/level-3-theme.mp3
public/assets/audio/music/level-4-theme.mp3
public/assets/audio/music/level-5-theme.mp3
```

Level music automatically plays when you start that level.

---

## 📁 Where Everything Is

### Core Files
- `public/js/core/AudioManager.js` - Main audio system (handles playback)
- `public/js/core/MusicRegistry.js` - Music track registry
- `public/js/core/SFXRegistry.js` - Sound effects registry

### Audio Files Go Here
- `public/assets/audio/music/` - Background music files
- `public/assets/audio/sfx/` - Sound effect files

### Documentation
- **AUDIO_QUICK_START.md** - Quick reference card (this directory)
- **AUDIO_SYSTEM_SETUP.md** - Complete setup guide (this directory)
- **AUDIO_IMPLEMENTATION_CHECKLIST.md** - Implementation checklist (this directory)
- **AUDIO_ARCHITECTURE.md** - System architecture (this directory)
- **public/assets/audio/README.md** - Detailed documentation (audio directory)
- **public/assets/audio/USAGE_EXAMPLES.js** - Code examples (audio directory)

---

## 🎛️ What's Included

✅ **Menu Music Support** - Music plays and loops in all menu screens
✅ **Level Music Support** - 5 different level themes with auto-switching
✅ **Sound Effects Framework** - Ready to add button clicks, tower sounds, etc.
✅ **Volume Control** - Separate volume controls for music and SFX
✅ **Fade Effects** - Smooth music transitions with fade in/out
✅ **Mute/Unmute** - Global audio control
✅ **Professional Architecture** - Uses Registry pattern like rest of codebase

---

## 📖 Documentation Files

| File | Purpose |
|------|---------|
| **AUDIO_QUICK_START.md** | Quick reference card for common tasks |
| **AUDIO_SYSTEM_SETUP.md** | Detailed setup guide with all information |
| **AUDIO_ARCHITECTURE.md** | Visual diagrams showing how the system works |
| **AUDIO_IMPLEMENTATION_CHECKLIST.md** | Implementation checklist and status |
| **public/assets/audio/README.md** | Directory structure and file format info |
| **public/assets/audio/USAGE_EXAMPLES.js** | Code examples for using the audio system |

---

## 💡 Common Tasks

### Playing Menu Music (Automatic)
No code needed! All menu states automatically play the menu theme when they start.

### Playing Level Music (Automatic)
No code needed! Levels automatically play their specific theme when gameplay starts.

### Playing Sound Effects
```javascript
// In any game state:
if (this.stateManager.audioManager) {
    this.stateManager.audioManager.playSFX('button-click');
}
```

### Controlling Volume
```javascript
// Set music volume to 70%
audioManager.setMusicVolume(0.7);

// Set SFX volume to 80%
audioManager.setSFXVolume(0.8);
```

### Adding New Sound Effects
1. Register in `public/js/core/SFXRegistry.js`:
   ```javascript
   SFXRegistry.registerSFX('my-sound', 'assets/audio/sfx/my-sound.mp3');
   ```

2. Place audio file in `public/assets/audio/sfx/`

3. Play it:
   ```javascript
   audioManager.playSFX('my-sound');
   ```

---

## 📋 Current System Status

### Menu Music
- [x] StartScreen - plays on startup
- [x] MainMenu - plays when accessing menu
- [x] CampaignMenu - plays during campaign selection
- [x] SettlementHub - plays in settlement view
- [x] SaveSlotSelection - plays during save slot selection
- [x] OptionsMenu - plays in settings
- [x] LoadGame - plays when loading a game

### Level Music
- [x] Level 1 - plays when level 1 starts
- [x] Level 2 - plays when level 2 starts
- [x] Level 3 - plays when level 3 starts
- [x] Level 4 - plays when level 4 starts
- [x] Level 5 - plays when level 5 starts

### Sound Effects Framework
- [x] Ready for button clicks
- [x] Ready for tower placement sounds
- [x] Ready for enemy sounds
- [x] Ready for UI sounds

---

## ✨ Next Steps

1. **Prepare your audio files**
   - Menu theme (MP3 format, loopable)
   - Optional: Level themes for levels 1-5
   - Optional: Sound effects

2. **Place files in correct directories**
   - `public/assets/audio/music/menu-theme.mp3`
   - `public/assets/audio/music/level-N-theme.mp3`
   - `public/assets/audio/sfx/` for sound effects

3. **Test in browser**
   - Game should play menu theme automatically
   - Level music should play when starting a level
   - Check browser console for any warnings

4. **Optional: Add sound effects**
   - Follow examples in AUDIO_SYSTEM_SETUP.md
   - Register in SFXRegistry.js
   - Use from any game state

---

## 🎵 Audio File Requirements

- **Format:** MP3 recommended (best browser compatibility)
- **Sample Rate:** 44.1kHz or higher
- **Bitrate:** 128kbps or higher for music, 64kbps for SFX
- **Important:** Music should loop smoothly (no clicks/pops when looping)

---

## 🆘 Troubleshooting

**No sound when game starts?**
- Check that file is in correct location: `public/assets/audio/music/menu-theme.mp3`
- Open browser console - look for warnings
- Some browsers require user interaction before audio plays (click/touch game first)

**Music isn't looping?**
- Verify the file itself is loopable (no silent section at end)
- Check file format is MP3 or compatible format

**Want to add more levels/tracks?**
- Read AUDIO_SYSTEM_SETUP.md for detailed instructions
- Follow the pattern in MusicRegistry.js
- Update GameplayState.getAudioTrackForLevel() to map your level

---

## 🤝 Need Help?

1. Check **AUDIO_QUICK_START.md** for quick answers
2. Read **AUDIO_SYSTEM_SETUP.md** for detailed information
3. Look at **public/assets/audio/USAGE_EXAMPLES.js** for code examples
4. Review **AUDIO_ARCHITECTURE.md** to understand how it all works

---

**You're all set! Start with placing your menu-theme.mp3 file and the system will do the rest.**
