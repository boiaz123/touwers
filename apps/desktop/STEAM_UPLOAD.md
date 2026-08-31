# Getting the build onto your Steam page

This covers the last unfinished piece flagged in `STEAM_PAGE.md`: actually
uploading a build via SteamPipe so it can be attached to the store page. This
doc is "prepare only" — the scripts stage files and drive `steamcmd`, but you
run them yourself with your own Steam credentials. Nothing here can upload
anything without you typing your password (and Steam Guard code, first time).

## Why this ships the raw exe, not the NSIS installer

The existing `Touwers_1.0.1_x64-setup.exe` (built by `npm run build`, see
`tauri.conf.json`) is for **non-Steam distribution** (itch.io, direct
download, etc.). Steam depots are supposed to *be* the final installed
layout — Valve's guidance is to avoid nesting a second installer inside
Steam's own install/update/verify system, since that breaks "verify game
files," delta patching, and clean uninstalls (NSIS installs to
`%ProgramFiles%`, outside the folder Steam manages).

So the Steam depot ships just:
- `touwers-desktop.exe` — the plain compiled binary. The frontend
  (`public/`) is embedded into it at compile time (see `build.rs`), so no
  separate JS/HTML resources are needed.
- `steam_api64.dll` — required next to the exe for the `steamworks` crate to
  load (same file the NSIS build already bundles).
- `MicrosoftEdgeWebView2Setup.exe` — the WebView2 Evergreen bootstrapper.
  Touwers renders through WebView2 and won't start without it. The NSIS
  installer handles this via `embedBootstrapper`; the Steam build handles it
  via `installscript.vdf` (see below) instead, since Steam has its own
  mechanism for prerequisite installers.

## One-time setup

1. Install `steamcmd`. Already done on this machine — it's bootstrapped at
   `%LOCALAPPDATA%\SteamCMD\steamcmd.exe`, and `upload.ps1` finds it there
   automatically if it's not on `PATH`. On another machine: download
   https://developer.valvesoftware.com/wiki/SteamCMD, unzip anywhere, and run
   `steamcmd.exe +quit` once to let it self-update before first real use.
2. Confirm your real **Depot ID** in Steamworks → App Admin → SteamPipe →
   Depots for App ID `5132600`. The scripts here assume `5132601` (Valve's
   usual AppID+1 default for a single Windows depot) — if yours differs,
   rename `depot_build_5132601.vdf` and update the reference to it in
   `app_build_5132600.vdf`.
3. In Steamworks → App Admin → Installation → General Installation, set:
   - **Launch Executable:** `touwers-desktop.exe`
   - **Operating System:** Windows
4. Make sure your Steam account has "Publisher" / SteamPipe permissions on
   this app (Steamworks → Users & Permissions), or the upload will be
   rejected.

## Every time you want to push a new build

From `apps/desktop/`:

```powershell
npm run build   # produces src-tauri/target/release/touwers-desktop.exe
```

Then from `apps/desktop/steampipe/`:

```powershell
.\scripts\stage_build.ps1              # copies exe + dll + webview2 bootstrapper into staging\
.\scripts\upload.ps1 -Username <you>   # runs steamcmd, prompts for password/Guard code
```

`app_build_5132600.vdf` ships with `SetLive` blank, so the first few uploads
won't touch any live branch — the build just becomes selectable in
Steamworks → App Admin → Builds. **Recommended first run:** create a private
beta branch in Steamworks (e.g. `internaltest`), set `"SetLive"` to that
branch name, install the game through Steam under that branch, and confirm
it launches and achievements unlock (see `STEAM_ACHIEVEMENTS.md`) before ever
setting `"SetLive"` to `"default"`.

## Files in this directory

| File | Purpose |
|---|---|
| `app_build_5132600.vdf` | Top-level SteamPipe build script |
| `depot_build_5132601.vdf` | Depot file mapping (excludes `.pdb` debug symbols) |
| `installscript.vdf` | Runs the WebView2 bootstrapper silently on install/update |
| `achievements.csv` | All 47 achievement API names/text for fast dashboard entry (see `STEAM_ACHIEVEMENTS.md`) |
| `scripts/stage_build.ps1` | Copies the built exe + dll + bootstrapper into `staging/` |
| `scripts/upload.ps1` | Runs `steamcmd +run_app_build` against the staged content |
| `staging/`, `output/` | Created at run time, gitignored — never commit build output |
