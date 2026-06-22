# Touwers Android - Manual Testing Checklist

No emulator/device was available while building this port, so none of the
items below have been verified live. Run through this on a real Android
phone (and a tablet if you have one) before considering the port done.

## Install

- [ ] Enable USB debugging on the device (Settings > About > tap Build
      Number 7x, then Settings > Developer Options > USB debugging).
- [ ] `adb install -r path\to\app-universal-release.apk` (or the per-ABI APK
      matching the device) installs and launches without errors.

## Boot & orientation

- [ ] App boots to the main menu in landscape.
- [ ] App boots to the main menu in portrait (no more "please rotate" block
      - this was removed; the sidebar should now show as a bottom tray).
- [ ] Rotate the device repeatedly during gameplay: layout flips between the
      row sidebar (landscape) and bottom tray (portrait) without a reload or
      lost game state. Canvas should letterbox (keep correct proportions,
      not stretch/distort) in portrait.
- [ ] Tablet profile (if available): layout doesn't look broken at the
      wider/taller aspect ratio.

## Touch input

- [ ] Tap a tower/building button in the sidebar/tray, then tap the canvas
      to place it.
- [ ] Drag a tower/building button from the sidebar/tray onto the canvas to
      place it (drag-and-drop placement).
- [ ] Long-press and swipe gestures (if used anywhere) still work.
- [ ] Pinch gesture doesn't cause unwanted browser-style zoom.

## Audio

- [ ] Menu music starts after the very first tap on the screen (this is the
      mobile autoplay-policy fix - it may not play instantly on boot, only
      after that first tap).
- [ ] SFX play on tower placement, combat, etc.

## Save / load

- [ ] Start a level, let it autosave or save manually, force-close the app
      from Android's recent-apps view (not just press Home), relaunch, and
      confirm the save loaded correctly.
- [ ] Repeat after reinstalling the APK (confirms saves survive in
      app-private storage across redeploys).

## Back button / navigation

- [ ] From the main menu, pressing the hardware/gesture back button exits
      the app (or asks for confirmation, depending on platform conventions)
      rather than getting stuck.
- [ ] From inside gameplay with a panel/menu open, back closes the
      panel/pause menu instead of exiting the app.
- [ ] From settlement hub / level select / campaigns / options, back
      navigates to the previous screen instead of exiting the app.

## Quit button

- [ ] The in-game "Quit" button (calls the Rust `close_app` command) closes
      the app cleanly without looking like a crash.

## Performance

- [ ] Play through a late-game wave with many towers/enemies/effects active
      on a real (not just emulated) low/mid-range device and watch for
      frame drops. Use `chrome://inspect` on a desktop Chrome browser with
      the device connected via USB to profile if something feels slow.

## Known follow-ups (not yet done, intentionally out of scope for this pass)

- App icon/splash are a placeholder tower silhouette generated for this
  task (`src-tauri/icon-source.png`) - swap in real branded artwork via
  `npx tauri icon path\to\real-icon.png` when available.
- Google Play Store packaging (AAB, store listing, content rating) was
  explicitly out of scope - this build is for sideloading only.
