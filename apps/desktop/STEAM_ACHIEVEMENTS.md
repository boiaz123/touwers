# Steam Achievements ("trophies") integration

## Current state

Touwers has a fully working in-game achievement system
(`public/js/core/AchievementSystem.js`) with 47 achievements, its own
unlock banner UI, and save persistence. **No Steamworks integration exists
yet.** Real Steam achievement unlocks require:

1. A Steamworks Partner account + registered App ID (one-time $100 Steam
   Direct fee) — **not set up yet**.
2. The Steamworks SDK (`steam_api64.dll` + headers), downloaded from your
   Steamworks Partner account — it's not distributable via npm/crates.io, so
   I can't fetch it for you. Comes as a zip under
   `sdk/redistributable_bin/` and `sdk/public/steam/`.
3. Achievement API names configured 1:1 in Steamworks (App Admin →
   Stats & Achievements) matching the IDs below.
4. A `steam_appid.txt` file (containing just your App ID) next to the dev
   binary for local testing without launching through the Steam client.

Until those exist, this integration only goes as far as a **stubbed
platform-notification seam** — see "What's wired up now" below. It's safe,
compiles, and does nothing external yet.

## What's wired up now

- `AchievementSystem.checkAchievements()` (`public/js/core/AchievementSystem.js`)
  now calls `notifyPlatformUnlock(def)` for every newly-unlocked achievement,
  which — when running under Tauri — invokes the `steam_unlock_achievement`
  Tauri command with the achievement's `id`. Outside Tauri (browser dev mode)
  it's a no-op.
- `apps/desktop/src-tauri/src/lib.rs` has a `steam_unlock_achievement(id: String)`
  command registered in the Tauri invoke handler. Right now it just logs the
  id — it's the exact spot to swap in a real `steamworks-rs` call later.

## Finishing the wiring once you have an App ID + SDK

1. Add to `apps/desktop/src-tauri/Cargo.toml`:
   ```toml
   steamworks = "0.11"
   ```
   (crate wraps the SDK; you still need the raw SDK binaries — see step 2.)
2. Drop `steam_api64.dll` (and `steam_api.dll` for 32-bit if needed) next to
   the built exe, per `steamworks-rs`' README — it doesn't vendor the actual
   Valve binary.
3. In `lib.rs`, initialize the client once at startup:
   ```rust
   let (client, single) = steamworks::Client::init_app(YOUR_APP_ID)?;
   ```
   guarded so a missing `steam_api64.dll`/`steam_appid.txt` doesn't crash a
   non-Steam build — wrap in `Option<Client>` and no-op the command if `None`.
4. Replace the stub body of `steam_unlock_achievement` with:
   ```rust
   client.user_stats().achievement(&id).set()?;
   client.user_stats().store_stats()?;
   ```
5. In Steamworks Partner → App Admin → Stats & Achievements, create one
   achievement per row below with the **API Name** column value exactly
   matching (Steam achievement API names are case-sensitive and immutable
   once players have unlocked them).

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
