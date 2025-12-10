# Touwers - Tower Defense Game

A fast and efficient tower defense game built with vanilla JavaScript and **Tauri** for desktop deployment.

## About Tauri

This project has been migrated from **Electron** to **Tauri** for better performance:

- **5MB footprint** vs 150MB+ with Electron
- **Native system WebView** (no bundled Chromium)
- **Better performance** for 2D canvas rendering
- **Smaller bundle sizes** for distribution

## Prerequisites

- **Node.js** 18+ (for development)
- **Rust** (for building Tauri backend) - [Install Rust](https://rustup.rs/)
- **Windows 10+** / **macOS 10.13+** / **Linux**

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The game will open in a window with hot-reload enabled.

## Building for Distribution

```bash
# Build for Windows (creates MSI and portable EXE)
npm run build

# Or just build MSI
npm run build-win
```

Built files will be in `src-tauri/target/release/bundle/`.

## Project Structure

```
├── public/               # Frontend assets (HTML, CSS, JS game code)
│   ├── index.html       # Main game page
│   ├── style.css        # Game styling
│   └── js/              # Game logic (unchanged from Electron version)
├── src-tauri/           # Tauri backend
│   ├── src/main.rs      # Rust entry point
│   ├── tauri.conf.json  # Tauri configuration
│   └── Cargo.toml       # Rust dependencies
└── package.json         # Node.js project metadata
```

## Key Differences from Electron

### Removed (Obsolete)
- ❌ `main.js` - Electron main process
- ❌ `preload.js` - Electron context bridge
- ❌ `server.js` - Express.js server
- ❌ `build.js` - Build configuration
- ❌ Electron builder config

### Added (Tauri Backend)
- ✅ `src-tauri/` - Rust backend directory
- ✅ `tauri.conf.json` - Window and app configuration
- ✅ `Cargo.toml` - Rust dependencies

### Code Changes
- Removed all `window.electron` API calls
- Game code runs directly in Tauri's WebView
- All game logic remains unchanged

## Performance Improvements

Since migrating to Tauri:

1. **Faster startup** - No Chromium initialization overhead
2. **Better rendering** - Direct access to system WebView
3. **Smaller distribution** - 5MB app vs 150MB+ with Electron
4. **Lower memory usage** - No duplicate process overhead

## Game Features

- Tower Defense gameplay with 5 levels
- Multiple tower types and upgrades
- Enemy waves with AI pathfinding
- Building system (mines, academy, forge, etc.)
- Gem system for tower combination
- Sandbox mode for testing

## Settings

- **Resolution**: 720p, 1080p (default), 1440p, 4K
- **Speed Controls**: 1x, 2x, 3x game speed
- **Fullscreen**: Toggle fullscreen mode

## Troubleshooting

### Rust compilation fails
```bash
# Update Rust
rustup update

# Clean rebuild
cargo clean
npm run build
```

### Game runs slowly
- Ensure no other heavy applications are running
- Check resolution settings (lower = faster)
- Verify GPU drivers are up to date

### Window won't open
- Check `tauri.conf.json` for window configuration
- Verify `public/index.html` exists
- Check console for error messages

## Technical Stack

- **Frontend**: Vanilla JavaScript, HTML5 Canvas 2D
- **Backend**: Rust with Tauri framework
- **Build Tool**: Cargo (Rust) + npm
- **Distribution**: NSIS Installer + Portable EXE

## License

Proprietary - Touwers Tower Defense Game
