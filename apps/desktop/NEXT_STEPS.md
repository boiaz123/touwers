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

1. Download the Steamworks SDK from your Steamworks Partner account (needs
   step 0) — it's not distributable via npm/crates.io, so I can't fetch it
   for you.
2. Create a `steam_appid.txt` (just your App ID, one line) next to the dev
   binary, for testing without launching through the Steam client.
3. In Steamworks Partner → App Admin → Stats & Achievements, create all 47
   achievements using the exact **API Name** values from the mapping table
   in `STEAM_ACHIEVEMENTS.md` (case-sensitive, immutable once players unlock
   them).
4. **Tell me once the SDK + App ID exist** — the remaining work
   (`steamworks-rs` dependency, initializing `steamworks::Client`, replacing
   the stub in `apps/desktop/src-tauri/src/lib.rs` with the real
   `client.user_stats()` calls) is a short follow-up I'll do, not something
   you need to hand-write.

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
| Achievement integration point | ✅ stubbed in code | Steamworks account, SDK download, achievement config, ping me to finish wiring |
| Code signing | ✅ options documented (`CODE_SIGNING.md`) | Pick + buy/register, identity verification, ping me to wire config |
