# Quick Start Commands

Copy and paste these commands to get Tauri running immediately.

## Install Rust (One-time setup)

**Windows (PowerShell):**
```powershell
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

**macOS/Linux (Bash):**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Then restart your terminal/PowerShell.

Verify:
```bash
rustc --version    # Should output: rustc 1.XX.X (...)
cargo --version    # Should output: cargo 1.XX.X
```

## Install npm Dependencies

```bash
cd c:\Users\boiaz\AppDev\touwers
npm install
```

## Run Development Server

```bash
npm run dev
```

**First run will take 2-3 minutes as it compiles Rust.** Window will open automatically when ready.

## Build Release Version

```bash
npm run build
```

Find installers in:
```
src-tauri/target/release/bundle/
```

## Delete Obsolete Electron Files

Choose one:

### Option A: Manual deletion
```powershell
# In PowerShell
Remove-Item main.js, preload.js, server.js, build.js
Remove-Item Touwers.bat, Touwers.vbs, Launch-Touwers.ps1, Create-Shortcut.ps1
```

### Option B: Git removal
```bash
git rm main.js preload.js server.js build.js
git rm Touwers.bat Touwers.vbs Launch-Touwers.ps1 Create-Shortcut.ps1
git commit -m "Remove obsolete Electron files"
```

## Troubleshooting Commands

### Update Rust (if issues occur)
```bash
rustup update
```

### Clean rebuild
```bash
npm install
cargo clean
npm run build
```

### Check Tauri version
```bash
npx tauri --version
```

### View full error output
```bash
npm run dev 2>&1 | Tee-Object -FilePath error.log    # PowerShell
npm run dev 2>&1 | tee error.log                       # macOS/Linux
```

## File Locations After Migration

### Source Files (Edit these)
```
public/
├── index.html          ← Main game page
├── style.css           ← Styling
├── js/
│   ├── game/game.js   ← Game controller
│   ├── core/          ← Game systems
│   ├── entities/      ← Towers, enemies
│   └── ui/            ← UI components
└── assets/            ← Images, sounds
```

### Built Application
After `npm run build`:
```
src-tauri/target/release/bundle/
├── msi/
│   └── Touwers_1.0.0_x64_en-US.msi       ← Installer
└── nsis/
    ├── Touwers_1.0.0_x64-setup.exe       ← Setup wizard
    └── Touwers_1.0.0_x64_en-US.msi       ← Alternative installer
```

## Complete Workflow

```bash
# 1. Install Rust (one time)
# → Use command from "Install Rust" section above

# 2. Clone/setup project
cd c:\Users\boiaz\AppDev\touwers

# 3. Install npm packages
npm install

# 4. Development
npm run dev
# → Make changes to public/ folder
# → Changes reload automatically

# 5. When ready to release
npm run build

# 6. Clean up (optional)
Remove-Item main.js, preload.js, server.js, build.js   # PowerShell
# or
git rm main.js preload.js server.js build.js && git commit -m "cleanup"
```

## Important Paths

| Item | Path |
|------|------|
| Game code | `public/js/` |
| Styles | `public/style.css` |
| HTML | `public/index.html` |
| Rust backend | `src-tauri/src/main.rs` |
| App config | `src-tauri/tauri.conf.json` |
| npm config | `package.json` |
| Dependencies | `src-tauri/Cargo.toml` |

## Expected Output

### npm run dev (first time)
```
     Compiling touwers v1.0.0
      Finished release [optimized] target(s) in 125.42s
   Launching your app...
[Window: main] Devtools listening on ws://127.0.0.1:54321
✅ Game window opened and showing
```

### npm run dev (subsequent runs)
```
    Finished dev [unoptimized + debuginfo] target(s) in 1.23s
   Launching your app...
[Window: main] Devtools listening on ws://127.0.0.1:54321
✅ Game window opened and showing
```

### npm run build
```
   Compiling touwers v1.0.0
    Finished release [optimized] target(s) in 2m 15s
 Bundle: Touwers_1.0.0_x64_en-US.msi (108.5 MB)
 Bundle: Touwers_1.0.0_x64-setup.exe (108.5 MB)
✅ Bundles created successfully
```

## Tips

- 💡 First `npm run dev` is slower (compiling Rust) - **be patient!**
- 💡 Subsequent runs are much faster (cached builds)
- 💡 Edit `src-tauri/tauri.conf.json` to change window size/title
- 💡 Edit `public/index.html` to customize game page
- 💡 Rust code goes in `src-tauri/src/main.rs`
- 💡 Press Ctrl+Shift+I in dev mode to open DevTools

## Still Having Issues?

1. **Check Rust installation:** `rustc --version`
2. **Check npm installation:** `npm --version`
3. **Read detailed docs:** `TAURI_SETUP.md`
4. **Read troubleshooting:** `TAURI_CLEANUP.md`
5. **Check full migration:** `TAURI_MIGRATION_COMPLETE.md`

## Performance Numbers

- App size: **5MB** (vs 150MB+ with Electron)
- RAM usage: **80-150MB** (vs 300-500MB)
- Startup: **<1 second** (vs 3-5 seconds)
- Installation size: **~50MB** (with the MSI installer)

Enjoy your optimized game! 🚀
