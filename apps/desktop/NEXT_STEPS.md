# Next steps — what you need to do

Everything code/doc-side that could be prepared without external access is
already done (see `STEAM_PAGE.md`, `STEAM_ACHIEVEMENTS.md`, `CODE_SIGNING.md`
for full detail). This is the ordered, human-only checklist — the things
only you can do, because they involve accounts, payments, identity
verification, or physical assets.

## 0. Blocking prerequisite — do this first

**Register a Steamworks Partner account and pay the one-time $100 Steam
Direct fee to get an App ID.**

This single step unblocks both Track A and Track B below — nothing else on
the Steam side can move forward without it, regardless of which you want to
tackle first.

## Track A — Steam store page

1. Create the app in Steamworks Partner (needs step 0).
1b. Upload a build via SteamPipe so it's attached to the app — scripts and
    instructions now in `STEAM_UPLOAD.md`. Requires `steamcmd` and confirming
    your real Depot ID in the dashboard first.
2. Capture at least 5 gameplay screenshots across the four campaigns
   (Forest, Mountain, Desert, Frog King's Realm), min. 1280×720.
3. Produce or commission capsule/header/library art at the exact sizes
   listed in `STEAM_PAGE.md`'s asset table (header capsule 460×215, small
   capsule 231×87, main capsule 616×353, vertical capsule 600×900, library
   hero 3840×1240, library logo 1280×720 transparent PNG).
4. Paste the drafted short/long description and tag list from
   `STEAM_PAGE.md` into the Steamworks Store Page editor.
5. Complete Steam's age-rating questionnaire (ESRB/PEGI/IARC) — required
   before the page can go live, not covered in `STEAM_PAGE.md`.

## Track B — Achievements / trophies

**Done, as of App ID `5132600` + the SDK zip you provided.** The
`steamworks-rs` wiring is live in `apps/desktop/src-tauri/src/lib.rs` (see
`STEAM_ACHIEVEMENTS.md` for the full detail) — it initializes
`steamworks::Client::init_app(5132600)` at startup, falls back to a silent
local-only no-op if Steam isn't available, and `steam_unlock_achievement`
really calls `achievement().set()` + `store_stats()` now. Verified it builds
and runs cleanly (including the no-Steam-client fallback path).

What's left is Steamworks-dashboard-only, not code:

1. In Steamworks Partner → App Admin → Stats & Achievements, create all 47
   achievements using the exact **API Name** values from the mapping table
   in `STEAM_ACHIEVEMENTS.md` (case-sensitive, immutable once players unlock
   them) — `steampipe/achievements.csv` has the same 47 rows in a
   copy-paste-friendly format for filling out the dashboard form quickly.
   Until this is done, unlocks will fail silently (logged, not fatal) since
   Steam won't recognize the API names yet.
2. Each achievement also needs a locked and unlocked **icon image**
   (Steamworks requires actual PNG/JPG art per achievement, min 128×128 —
   recommend uploading 256×256). The in-game system only has Unicode glyph
   icons (⚔︎, ♛︎, etc.), not image assets, so this is real art work, not a
   config step — same category of gap as the missing store-page capsule art
   in `STEAM_PAGE.md`.
3. Playtest through Steam (launch via the Steam client, or with the App ID
   owned by your Steamworks Partner account, ideally on the beta branch
   described in `STEAM_UPLOAD.md`) to confirm real unlocks land on your
   Steam profile.

## Track C — Known publisher / code signing

Independent of Tracks A and B — no Steamworks account needed for this one.

1. Decide between:
   - **Azure Trusted Signing** (~$10/mo, instant SmartScreen reputation,
     needs a registered business or an individual with 3+ years of
     Microsoft-verified identity history), or
   - **A purchased OV/EV certificate** from a CA (DigiCert, SSL.com,
     Sectigo, GlobalSign, etc.) — OV is cheaper but reputation still has to
     build up over time; EV is pricier but instant, like Trusted Signing.
2. Complete the identity verification / paperwork process with Microsoft or
   the CA — this is the part only you can do (business registration
   documents, ID verification, etc.).
3. Obtain either a certificate thumbprint (local cert store) or a signing
   command (Azure Trusted Signing / HSM-backed EV token).
4. **Tell me once you have one of those** — wiring it into
   `apps/desktop/src-tauri/tauri.conf.json`'s `bundle.windows` block is a
   two-line follow-up, already documented in `CODE_SIGNING.md`.

## Summary — what's already done vs. what's on you

| | Done | On you |
|---|---|---|
| Store page copy/asset spec | ✅ drafted (`STEAM_PAGE.md`) | Screenshots, capsule art, Steamworks account, age rating |
| Achievements | ✅ fully wired (`steamworks-rs`, App ID `5132600`) | Create the 47 achievements in Steamworks App Admin, playtest through Steam |
| Code signing | ✅ options documented (`CODE_SIGNING.md`) | Pick + buy/register, identity verification, ping me to wire config |
