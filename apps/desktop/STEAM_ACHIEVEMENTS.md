# Steam Achievements ("trophies") integration

## Current state

Touwers has a fully working in-game achievement system
(`public/js/core/AchievementSystem.js`) with 47 achievements, its own
unlock banner UI, and save persistence. **The Steamworks integration is
wired up and live** for App ID `5132600`, using the `steamworks` crate
(steamworks-rs) 0.13.

## What's wired up now

- `AchievementSystem.checkAchievements()` (`public/js/core/AchievementSystem.js`)
  calls `notifyPlatformUnlock(def)` for every newly-unlocked achievement,
  which — when running under Tauri — invokes the `steam_unlock_achievement`
  Tauri command with the achievement's `id`. Outside Tauri (browser dev mode)
  it's a no-op.
- `apps/desktop/src-tauri/src/lib.rs`:
  - `init_steam()` calls `steamworks::Client::init_app(5132600)` once at
    startup (in `.setup()`), and spawns a background thread that calls
    `client.run_callbacks()` every 100ms (Valve's API needs its callbacks
    pumped periodically; this app has no render loop to hook that into).
  - Init failure (Steam client not running, no license, missing
    `steam_api64.dll`, etc.) is **not fatal** — it's logged and the app
    continues with `SteamState(None)` managed as Tauri state, so every
    Steam-touching command becomes a silent no-op. This is what makes dev
    builds and non-Steam distribution work identically to the Steam build.
  - `steam_unlock_achievement(id)` calls
    `client.user_stats().achievement(&id).set()` then `.store_stats()`,
    logging (not erroring) on failure — an unrecognized `id` shouldn't ever
    happen since it's driven by `ACHIEVEMENT_DEFS`, but Steam being
    unreachable mid-session is a real, harmless case.
- `apps/desktop/src-tauri/steam_api64.dll` — the Steamworks redistributable
  runtime, extracted from the SDK zip and **committed to the repo**. Valve's
  SDK license explicitly permits redistributing this specific file with your
  game (that's what `redistributable_bin/` is for — unlike the full SDK
  zip's headers/libs, which stay out of the repo). It's staged next to the
  built exe two ways:
  - `apps/desktop/src-tauri/build.rs` copies it into `target/<profile>/`
    after every `cargo build` / `cargo tauri dev`, so local runs work without
    a manual step.
  - `tauri.conf.json`'s `bundle.resources` copies it next to the installed
    exe for the NSIS installer build.
- No `STEAM_SDK_LOCATION` env var, no vendored SDK headers, and no
  `steam_appid.txt` are needed: `steamworks-sys` (the crate's FFI layer)
  already vendors its own copy of the redistributable binaries and headers,
  and this app always calls `init_app(5132600)` with the real App ID
  explicitly, so there's nothing for a `steam_appid.txt` fallback to do.

## What's still on you

In Steamworks Partner → App Admin → Stats & Achievements, create one
achievement per row below with the **API Name** column value exactly
matching (Steam achievement API names are case-sensitive and immutable once
players have unlocked them). Until that's done, `achievement(&id).set()`
will fail per-id (logged, non-fatal) since Steam won't recognize the name.

## Achievement ID mapping table

All 47 IDs from `ACHIEVEMENT_DEFS` in `public/js/core/AchievementSystem.js`,
grouped as they are in-game:

### Combat
| API Name (id) | Display name | Description |
|---|---|---|
| getting-started | Getting Started | Slay 500 enemies |
| deadly-force | Deadly Force | Slay 1,000 enemies |
| executioner | Executioner | Slay 5,000 enemies |
| warlord | Warlord | Slay 20,000 enemies |
| annihilator | Annihilator | Slay 50,000 enemies |
| extinction-event | Extinction Protocol | Slay 100,000 enemies |

### Victory
| API Name (id) | Display name | Description |
|---|---|---|
| first-victory | First Victory | Win your first battle |
| battle-hardened | Battle-Hardened | Win 10 battles |
| seasoned-veteran | Seasoned Veteran | Win 25 battles |
| campaign-champion | Campaign Champion | Win 75 battles |
| legendary-commander | Legendary Commander | Win 150 battles |
| eternal-guardian | Eternal Guardian | Win 300 battles |

### Resilience
| API Name (id) | Display name | Description |
|---|---|---|
| fallen-warrior | Fallen Warrior | Suffer your first defeat |
| undaunted | Undaunted | Suffer 10 defeats and keep fighting |
| unbreakable | Unbreakable | Suffer 25 defeats without giving up |

### Tower building
| API Name (id) | Display name | Description |
|---|---|---|
| apprentice-builder | Apprentice Builder | Build 100 towers |
| master-engineer | Master Engineer | Build 500 towers |
| tower-overlord | Tower Overlord | Build 1,750 towers |
| grand-architect | Grand Architect | Build 3,000 towers |
| eternal-fortress | The Eternal Fortress | Build 10,000 towers |

### Economy — spending
| API Name (id) | Display name | Description |
|---|---|---|
| merchant | Merchant | Spend 1,000 gold at the market |
| gold-hoarder | Gold Hoarder | Spend 10,000 gold at the market |
| treasure-baron | Treasure Baron | Spend 50,000 gold at the market |
| master-of-coin | Master of Coin | Spend 200,000 gold at the market |

### Economy — selling
| API Name (id) | Display name | Description |
|---|---|---|
| profiteer | Profiteer | Earn 1,000 gold from selling items |
| market-baron | Market Baron | Sell 250 items |
| trade-magnate | Trade Magnate | Sell 1,000 items |

### Items / alchemy
| API Name (id) | Display name | Description |
|---|---|---|
| consumer | Consumer | Use 10 items in battle |
| talisman-master | Talisman Master | Use 50 items in battle |
| boonlord | Boonlord | Use 200 items in battle |

### Waves survived
| API Name (id) | Display name | Description |
|---|---|---|
| wave-runner | Wave Runner | Survive 100 waves |
| storm-survivor | Storm Survivor | Survive 1000 waves |
| original-wavejumper | The Original Wavejumper | Survive 5000 waves |

### Loot
| API Name (id) | Display name | Description |
|---|---|---|
| opportunist | Opportunist | Collect 100 loot drops |
| fortune-hunter | Fortune Hunter | Collect 500 loot drops |
| loot-goblin | Loot Goblin | Collect 1250 loot drops |

### Campaigns
| API Name (id) | Display name | Description |
|---|---|---|
| forest-conqueror | Forest Conqueror | Complete the Forest campaign |
| mountain-conqueror | Mountain Conqueror | Complete the Mountain campaign |
| desert-conqueror | Desert Conqueror | Complete the Desert campaign |
| frog-slayer | Frog Slayer | Survive the Frog King's Realm |

### Playtime
| API Name (id) | Display name | Description |
|---|---|---|
| dedicated-defender | Dedicated Defender | Play for 1 hour |
| arcane-scholar | Arcane Scholar | Play for 5 hours |
| touwers-fanatic | Touwers Fanatic | Play for 20 hours |
| eternal-watcher | Eternal Watcher | Play for 50 hours |

### Super Weapon Lab
| API Name (id) | Display name | Description |
|---|---|---|
| arcane-spire | Arcane Spire | Construct the Super Weapon Lab |
| frost-shatter | Frost Shatter | Strike a frozen enemy with another Super Weapon Lab spell while it is under Frozen Nova |
| arcane-arsenal | Arcane Arsenal | Cast Super Weapon Lab spells 100 times in total |

## Notes on tiered achievements

Several of the above are tiers of the same underlying stat (e.g. all six
combat achievements track `totalEnemiesSlain` at different thresholds).
Steam has no built-in concept of tiers — each tier needs its own separate
achievement entry, exactly as listed above (Steam does support incremental
*stats*-backed achievements with a progress bar via `SetStat`/`IndicateAchievementProgress`,
which would be a nicer fit for these than firing them as flat unlocks, but
that's a larger follow-up once the base wiring above is working).
