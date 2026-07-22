# Steam store page — draft copy & asset checklist

This is paste-in-ready content for the Steamworks Partner "Store Page" editor
(App Admin → Store Page). Actually creating the page requires a Steamworks
account and a registered app (the one-time $100 Steam Direct fee) — this doc
just prepares everything you'd type or upload once you're there.

## Basic info

- **App name:** Touwers
- **Genre:** Strategy, Tower Defense
- **Tags (pick up to 20 in Steamworks):** Tower Defense, Strategy, Base
  Building, Fantasy, Singleplayer, Resource Management, Difficult, Replay
  Value, Colorful, Family Friendly
- **Category (matches `tauri.conf.json` `bundle.category`):** Strategy

## Short description (~300 chars, shown in search results/wishlist)

> Touwers is a fantasy tower defense strategy game. Place towers on a grid,
> hold the line through escalating enemy waves, build up your economy, and
> conquer four campaigns — from the Forest to a frog-infested alien realm.

## Long description (About This Game)

> **Touwers** is a grid-based tower defense strategy game where every
> placement matters. Build a defensive line against wave after wave of
> enemies, manage your gold economy, and grow your base into a fortress
> capable of surviving increasingly brutal assaults.
>
> **Eight tower types, endless combinations**
> Choose from Basic, Cannon, Archer, Magic, Barricade, Poison Archer,
> Combination, and Guard Post towers, each with its own role — chokepoint
> control, burst damage, area denial, or sustained DPS. Mix and match to
> counter whatever the enemy throws at you.
>
> **A base that grows with you**
> Beyond towers, construct economy and support buildings — the Gold Mine,
> Tower Forge, Magic Academy, Training Grounds, Diamond Press, and the
> late-game Super Weapon Lab, which unlocks powerful area-effect spells
> like Frozen Nova.
>
> **Four campaigns, four battlefields**
> Fight through the Forest, push into the Mountains, cross the Desert, and
> finally confront the Frog King in his alien Realm — each with its own
> visual theme, enemy roster, and level layouts.
>
> **Deep progression**
> Earn Arcane Score by completing achievements across combat, economy,
> building, and survival, and climb an honorary title ladder from Tower
> Apprentice all the way to Archmagus Eternal.

## System requirements (Windows desktop build)

- **OS:** Windows 10 64-bit or later
- **Engine:** Tauri + WebView2 (Microsoft Edge WebView2 Runtime, auto-installed
  by the installer via `embedBootstrapper`)
- **Storage:** ~200 MB (confirm exact figure once a release build is packaged)
- **Additional notes:** No GPU/dedicated graphics requirement beyond standard
  desktop compositing; game renders via PixiJS (WebGL/Canvas fallback)

## Required store assets — status

Steam requires specific pixel dimensions for every image slot. None of these
currently exist in the repo (`public/assets/` only has in-game sprites, no
marketing renders) — treat this as an action item.

| Asset | Size (px) | Status |
|---|---|---|
| Header capsule | 460 × 215 | ❌ missing |
| Small capsule | 231 × 87 | ❌ missing |
| Main capsule | 616 × 353 | ❌ missing |
| Vertical capsule (library) | 600 × 900 | ❌ missing |
| Library hero | 3840 × 1240 | ❌ missing |
| Library logo | 1280 × 720 (transparent PNG) | ❌ missing |
| Screenshots (min. 5 recommended) | min 1280 × 720, 16:9 | ❌ missing — capture from actual gameplay across all 4 campaigns |
| Trading card / badge art (optional) | varies | ❌ missing (only needed if Steam Trading Cards are enabled) |
| Capsule/trailer video (optional but recommended) | 1920×1080 MP4 | ❌ missing |

Suggested source material already in the repo for screenshots/capsule
composition: `public/assets/towers/*.png`, `public/assets/buildings/*.png`,
`public/assets/enemies/*.png`, plus the app icon at
`apps/desktop/src-tauri/icons/icon.png`.

## Not covered here

Steamworks depot/branch setup, pricing, age rating (steam requires ESRB/PEGI
or IARC questionnaire), and store page publishing itself all happen inside
Steamworks Partner and are out of scope for this doc — ping me once you have
Steamworks access if you want help scripting the build upload (`steamcmd`)
side.
