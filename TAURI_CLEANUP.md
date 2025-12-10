# Tauri Migration Cleanup Guide

The following Electron-specific files are **no longer needed** and can be safely deleted:

## Files to Delete

### Core Electron Files
- ❌ `main.js` - Old Electron main process (replaced by src-tauri/src/main.rs)
- ❌ `preload.js` - Electron context bridge (no longer needed in Tauri)
- ❌ `server.js` - Express.js server (Tauri serves files directly)
- ❌ `build.js` - Build script (superseded by npm run build with Tauri)

### Windows Batch/PowerShell Scripts
- ❌ `Touwers.bat` - Batch launcher
- ❌ `Touwers.vbs` - VBScript launcher
- ❌ `Launch-Touwers.ps1` - PowerShell launcher
- ❌ `Create-Shortcut.ps1` - Shortcut creator

## How to Clean Up

### Option 1: Manual Deletion
Delete these files directly from your file explorer or IDE:
```
main.js
preload.js
server.js
build.js
Touwers.bat
Touwers.vbs
Launch-Touwers.ps1
Create-Shortcut.ps1
```

### Option 2: Git Removal
If using Git, remove them from version control:
```bash
git rm main.js preload.js server.js build.js
git rm Touwers.bat Touwers.vbs Launch-Touwers.ps1 Create-Shortcut.ps1
git commit -m "Remove obsolete Electron files, migrate to Tauri"
```

### Option 3: Keep for Reference
If you want to keep them for reference, just ignore them with .gitignore (already done).

## What's New

### New Files Created
- ✅ `src-tauri/src/main.rs` - Tauri Rust backend
- ✅ `src-tauri/Cargo.toml` - Rust dependency manifest
- ✅ `src-tauri/build.rs` - Tauri build script
- ✅ `src-tauri/tauri.conf.json` - Window and app configuration
- ✅ `README_TAURI.md` - Tauri setup instructions

### Updated Files
- ✅ `package.json` - Now uses Tauri CLI instead of Electron
- ✅ `public/js/ui/ResolutionSelector.js` - Removed Electron API calls
- ✅ `.gitignore` - Added src-tauri/target/ and old Electron files

## Next Steps

1. Delete the obsolete files listed above (or keep them as reference)
2. Install dependencies: `npm install`
3. Install Rust if you haven't: https://rustup.rs/
4. Start development: `npm run dev`
5. Build release: `npm run build`

## Verification

After cleanup, your project root should only contain:
```
.git/
.gitignore
.vscode/
node_modules/
public/              ← Your game assets
src-tauri/           ← New Tauri backend
package.json         ← Updated for Tauri
README_TAURI.md      ← New documentation
```

## Troubleshooting

If you accidentally deleted something important:
```bash
git checkout HEAD -- filename
```

If Tauri build fails after deletion:
- Make sure you installed Rust: `rustup update`
- Make sure src-tauri/ directory exists
- Clear npm cache: `npm cache clean --force`
- Rebuild: `npm run build`
