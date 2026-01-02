# Audio System Quick Reference

## 🎵 Playing Your Menu Theme

Simply place your MP3 file here:
```
public/assets/audio/music/menu-theme.mp3
```

**Done!** It will automatically play on game startup and loop in all menus.

---

## 🎮 Level Music Setup

Place level themes here:
```
public/assets/audio/music/level-1-theme.mp3
public/assets/audio/music/level-2-theme.mp3
public/assets/audio/music/level-3-theme.mp3
public/assets/audio/music/level-4-theme.mp3
public/assets/audio/music/level-5-theme.mp3
```

**Automatic!** The system plays the correct theme when each level starts.

---

## 🔊 Sound Effects

1. Place SFX file in: `public/assets/audio/sfx/my-effect.mp3`

2. Register in `public/js/core/SFXRegistry.js`:
```javascript
SFXRegistry.registerSFX('my-effect', 'assets/audio/sfx/my-effect.mp3');
```

3. Play it:
```javascript
this.stateManager.audioManager.playSFX('my-effect');
```

---

## 📂 Directory Structure

```
public/assets/audio/
├── music/              ← Put .mp3 music files here
├── sfx/                ← Put .mp3 sound effects here
├── README.md           ← Full documentation
└── USAGE_EXAMPLES.js   ← Code examples
```

---

## 📝 File Format

- **Format:** MP3 (best compatibility)
- **Sample Rate:** 44.1kHz or higher
- **Bitrate:** 128kbps+ for music, 64kbps+ for SFX
- **Important:** Music should loop smoothly (no clicks)

---

## 🔑 Core Classes

| Class | Purpose | Location |
|-------|---------|----------|
| `AudioManager` | Manage all audio | `js/core/AudioManager.js` |
| `MusicRegistry` | Register music tracks | `js/core/MusicRegistry.js` |
| `SFXRegistry` | Register sound effects | `js/core/SFXRegistry.js` |

---

## 🎛️ Common Operations

```javascript
// Access the audio manager
const audio = this.stateManager.audioManager;

// Play music
audio.playMusic('menu-theme');

// Play with fade-in (1 second)
audio.playMusic('level-1-theme', true);

// Stop music (with fade-out)
audio.stopMusic(true);

// Play sound effect
audio.playSFX('button-click');

// Control volume
audio.setMusicVolume(0.7);  // 70%
audio.setSFXVolume(0.8);     // 80%

// Mute/Unmute
audio.mute();
audio.unmute();
```

---

## ✅ Current Status

✓ Menu theme support (loops in all menus)
✓ 5 level themes (play automatically with levels)
✓ Sound effects framework (ready to add)
✓ Volume control
✓ Fade in/out
✓ Mute/unmute
✓ Registry pattern implementation

---

## 📖 Full Documentation

See `public/assets/audio/README.md` for complete documentation.

See `public/assets/audio/USAGE_EXAMPLES.js` for code examples.

---

## 🆘 Troubleshooting

**No sound playing?**
- Check browser console for warnings
- Verify file paths are correct
- Ensure audio file format is MP3
- Some browsers require user interaction before audio plays

**Music not looping?**
- Verify the music file is registered with `loop: true`
- Check that the audio file itself is loopable (no silent pauses)

**Want to add new tracks?**
- Register in the appropriate registry file (MusicRegistry or SFXRegistry)
- Place the audio file in the correct directory
- That's it!
