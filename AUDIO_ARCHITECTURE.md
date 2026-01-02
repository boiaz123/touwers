# Audio System Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Game Initialization                       │
│                          (game.js)                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │   AudioManager Initialization      │
        │  - Create AudioManager instance    │
        │  - Load MusicRegistry             │
        │  - Load SFXRegistry               │
        │  - Attach to StateManager         │
        └────────────┬───────────────────────┘
                     │
        ┌────────────┴──────────────┬──────────────────┐
        ▼                           ▼                  ▼
   ┌──────────┐            ┌───────────────┐    ┌──────────┐
   │AudioMgr  │            │MusicRegistry  │    │SFXRegist │
   │          │            │               │    │          │
   │- Music   │◄───────────│-menu-theme   │    │-button-* │
   │- SFX     │            │-level-*      │    │-tower-*  │
   │- Volume  │            │-boss-theme   │    │-enemy-*  │
   └──────────┘            └───────────────┘    └──────────┘
        │
        │ Available from any state:
        │ this.stateManager.audioManager
        │
   ┌────┴──────────────────────────────────────────────────┐
   │                                                         │
   ▼                                                         ▼
Menu States                                          Gameplay State
┌──────────────────────┐                      ┌─────────────────────┐
│ StartScreen          │                      │ GameplayState       │
│ MainMenu             │ ─► play('menu-theme')│                     │
│ CampaignMenu         │                      │ On enter():         │
│ SettlementHub        │                      │ - Get level ID      │
│ SaveSlotSelection    │                      │ - Map to track      │
│ OptionsMenu          │                      │ - Play level music  │
│ LoadGame             │                      └─────────────────────┘
└──────────────────────┘
   (All loop menu-theme)
```

## State Transitions and Music

```
Game Start
    │
    ▼
[StartScreen] ──► 🎵 menu-theme (loops)
    │
    ▼
[MainMenu] ──► 🎵 menu-theme (continues)
    │
    ├─► [SaveSlotSelection] ──► 🎵 menu-theme (loops)
    │       │
    │       ▼
    │   [SettlementHub] ──► 🎵 menu-theme (loops)
    │       │
    │       ├─► [CampaignMenu] ──► 🎵 menu-theme (loops)
    │       │       │
    │       │       ▼
    │       │   [GameplayState] ──► 🎵 level-X-theme (loops)
    │       │
    │       └─► [CampaignMenu] ──► 🎵 menu-theme (resumes)
    │
    ├─► [LoadGame] ──► 🎵 menu-theme (loops)
    │       │
    │       ▼
    │   [GameplayState] ──► 🎵 level-X-theme (loops)
    │
    └─► [OptionsMenu] ──► 🎵 menu-theme (loops)
```

## Component Interaction Flow

```
┌─────────────────────────────────────┐
│      Any Game State                 │
├─────────────────────────────────────┤
│                                     │
│  enter() {                          │
│    if (this.stateManager.audio) {   │
│      audio.playMusic(trackName)     │
│    }                                │
│  }                                  │
│                                     │
└────────────┬────────────────────────┘
             │
             ▼
    ┌────────────────────┐
    │   AudioManager     │
    │                    │
    │  playMusic(name)   │
    │    ├─ Stop current │
    │    ├─ Load new     │
    │    ├─ Set loop     │
    │    └─ Play         │
    │                    │
    │  playSFX(name)     │
    │    └─ Play once    │
    └────┬───────────────┘
         │
         ▼
    ┌────────────────────┐
    │   HTML5 Audio API  │
    │                    │
    │  <audio> element   │
    │  .play()           │
    │  .pause()          │
    │  .volume           │
    └────────────────────┘
```

## Registry Pattern Implementation

```
┌──────────────────────────────────────┐
│       MusicRegistry (Static)         │
├──────────────────────────────────────┤
│  registry = {                        │
│    'menu-theme': {                   │
│      path: 'assets/audio/music/...', │
│      loop: true,                     │
│      category: 'menu',               │
│      volume: 0.7                     │
│    },                                │
│    'level-1-theme': {...},           │
│    ...                               │
│  }                                   │
├──────────────────────────────────────┤
│  + registerMusic(name, path, opts)   │
│  + getMusic(name)                    │
│  + getAllMusic()                     │
│  + getMusicByCategory()              │
│  + hasMusic(name)                    │
└──────────────────────────────────────┘
         │
         │ Called once during init
         │
         ▼
┌──────────────────────────────────┐
│   AudioManager.setMusicRegistry()│
│                                  │
│  Stores registry in memory for   │
│  fast lookup during playback     │
└──────────────────────────────────┘
```

## File Organization

```
touwers/
│
├── public/
│   ├── assets/
│   │   └── audio/          ← Audio directory
│   │       ├── music/      ← Background music files
│   │       │   ├── menu-theme.mp3
│   │       │   ├── level-1-theme.mp3
│   │       │   ├── level-2-theme.mp3
│   │       │   ├── level-3-theme.mp3
│   │       │   ├── level-4-theme.mp3
│   │       │   └── level-5-theme.mp3
│   │       ├── sfx/        ← Sound effect files
│   │       │   ├── button-click.mp3
│   │       │   ├── tower-place.mp3
│   │       │   ├── enemy-hit.mp3
│   │       │   └── enemy-death.mp3
│   │       ├── README.md
│   │       └── USAGE_EXAMPLES.js
│   │
│   └── js/
│       ├── core/
│       │   ├── AudioManager.js        ← Main audio system
│       │   ├── MusicRegistry.js       ← Music registration
│       │   ├── SFXRegistry.js         ← SFX registration
│       │   └── states/
│       │       ├── GameStateManager.js (updated)
│       │       ├── StartScreen.js (updated)
│       │       ├── MainMenu.js (updated)
│       │       ├── CampaignMenu.js (updated)
│       │       ├── SettlementHub.js (updated)
│       │       ├── SaveSlotSelection.js (updated)
│       │       ├── OptionsMenu.js (updated)
│       │       ├── LoadGame.js (updated)
│       │       └── GameplayState.js (updated)
│       │
│       └── game/
│           └── game.js (updated)
│
├── AUDIO_SYSTEM_SETUP.md          ← Implementation guide
├── AUDIO_QUICK_START.md           ← Quick reference
└── AUDIO_IMPLEMENTATION_CHECKLIST ← Checklist
```

## Audio Manager State Machine

```
                    ┌──────────────┐
                    │   No Music   │
                    │   Playing    │
                    └──────┬───────┘
                           │ playMusic()
                           ▼
                    ┌──────────────┐
                    │    Music     │
                    │   Playing    │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
  pauseMusic()        stopMusic()        playMusic()
        │                  │             (new track)
        ▼                  ▼                  │
  ┌──────────────┐  ┌──────────────┐        │
  │    Music     │  │   No Music   │◄───────┘
  │   Paused     │  │   Playing    │
  └──────┬───────┘  └──────────────┘
         │
  resumeMusic()
         │
         ▼
  ┌──────────────┐
  │    Music     │
  │   Playing    │
  └──────────────┘
```

## Audio Loading Flow

```
User Places menu-theme.mp3
    │
    ▼
At Game Startup:
  1. initializeMusicRegistry()
     └─ MusicRegistry.registerMusic(
          'menu-theme',
          'assets/audio/music/menu-theme.mp3',
          { loop: true, ... }
        )
  
  2. AudioManager.setMusicRegistry()
     └─ Store registry in memory

  3. Game starts
     └─ Enter first state (StartScreen)
     
  4. State calls playMusic('menu-theme')
     └─ AudioManager looks up in registry
     └─ Finds path and settings
     └─ Creates/loads audio element
     └─ Sets loop: true
     └─ Calls .play()
     └─ 🎵 Music starts playing!

  5. State transitions (menu-to-menu)
     └─ playMusic('menu-theme') called again
     └─ Already playing, so nothing changes
     └─ Music continues looping

  6. Entering gameplay
     └─ GameplayState.enter()
     └─ getAudioTrackForLevel() maps level ID
     └─ playMusic('level-N-theme')
     └─ AudioManager stops current music
     └─ Plays new level music
     └─ 🎵 Level music starts!
```

This architecture provides:
- **Clean separation of concerns** - AudioManager handles playback, Registries handle data
- **Registry pattern** - Consistent with TowerRegistry/EnemyRegistry
- **State isolation** - Each state manages its own music independently
- **Easy extensibility** - Add new tracks by registering them
- **Graceful handling** - Missing files logged but don't crash the game
