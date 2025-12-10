# Tauri Setup Instructions

Follow these steps to get the Tauri version of Touwers running on your system.

## Step 1: Install Rust

Tauri requires Rust for the desktop application backend. Follow the official guide:

### Windows
Download and run the installer from https://rustup.rs/

```powershell
# In PowerShell, run:
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

This installs:
- `rustc` - Rust compiler
- `cargo` - Rust package manager
- `rustup` - Rust toolchain manager

### macOS / Linux
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

**Verify installation:**
```bash
rustc --version
cargo --version
```

Should output something like:
```
rustc 1.75.0 (2024-01-01)
cargo 1.75.0
```

## Step 2: Install Node Dependencies

```bash
cd c:\Users\boiaz\AppDev\touwers
npm install
```

This installs:
- `@tauri-apps/cli` - Tauri command-line tools
- `@tauri-apps/api` - Tauri JavaScript API (optional, game doesn't use it yet)

## Step 3: Run Development Server

```bash
npm run dev
```

This will:
1. Compile the Rust backend
2. Launch the Tauri window
3. Load the game from the `public/` folder
4. Watch for file changes and reload automatically

**First build takes 2-3 minutes.** Subsequent builds are faster.

## Step 4: Build for Release

When ready to distribute:

```bash
# Build for Windows (creates both MSI installer and portable EXE)
npm run build

# Or build only MSI
npm run build-win
```

Built files will be in:
```
src-tauri/target/release/bundle/
├── msi/
│   └── Touwers_1.0.0_x64_en-US.msi
└── nsis/
    ├── Touwers_1.0.0_x64-setup.exe
    └── Touwers_1.0.0_x64_en-US.msi
```

## Step 5: Create Desktop Shortcuts (Optional)

After building, create shortcuts:

### Windows
```powershell
# Create shortcut on desktop
$DesktopPath = [System.Environment]::GetFolderPath('Desktop')
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\Touwers.lnk")
$Shortcut.TargetPath = "C:\Program Files\Touwers\Touwers.exe"
$Shortcut.Save()
```

## Troubleshooting

### Problem: Rust compiler not found

**Solution:** Ensure Rust is installed and PATH is updated
```bash
# Update Rust
rustup update

# Verify installation
rustc --version
```

### Problem: "Command 'tauri' not found"

**Solution:** Reinstall dependencies
```bash
npm install
npx tauri --version
```

### Problem: Window won't open / blank window

**Solution:** Check console output for errors
```bash
npm run dev
# Look at terminal output for error messages
```

If window is blank:
- Verify `public/index.html` exists
- Check that `public/js/game/game.js` is being loaded
- Open DevTools: Ctrl+Shift+I (development only)

### Problem: "frontendDist" path not found

**Solution:** Ensure project structure is correct
```
touwers/
├── src-tauri/
│   ├── tauri.conf.json
│   └── Cargo.toml
├── public/              ← Must exist and contain index.html
│   ├── index.html
│   ├── style.css
│   └── js/
└── package.json
```

### Problem: Build succeeds but won't run

**Solution:** Check Windows Defender didn't quarantine the EXE
- Check Windows Defender quarantine
- Try building with admin privileges
- Try running the installer instead of portable EXE

## Development Workflow

### During Development
```bash
npm run dev
```
- Game window opens automatically
- Changes to `public/` reload automatically
- Ctrl+Shift+I opens DevTools (in development)

### Before Release
```bash
# Test production build
npm run build

# Run the installer or portable EXE from src-tauri/target/release/bundle/
```

## Performance Notes

Tauri provides:
- ✅ Faster startup than Electron (no Chromium overhead)
- ✅ Lower memory usage
- ✅ Smaller distribution (5MB vs 150MB+)
- ✅ Same JavaScript game code as before

If the game still feels slow:
1. Check resolution settings (lower = faster)
2. Verify no CPU-heavy apps running in background
3. Enable performance monitoring (in-game option)

## Next Steps

1. ✅ Delete obsolete Electron files (see TAURI_CLEANUP.md)
2. ✅ Read README_TAURI.md for project overview
3. ✅ Start developing: `npm run dev`
4. ✅ Build for distribution: `npm run build`

## Getting Help

If you encounter issues:
1. Check the error message in console output
2. Review tauri.conf.json configuration
3. Verify Rust is up to date: `rustup update`
4. Check Tauri official docs: https://tauri.app/v1/guides/
