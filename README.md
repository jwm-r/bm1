# BM1 party feed

Collects RuneLite party **BM1** roughly every five minutes and publishes a small
JSON snapshot plus osrs.world minimap tiles for [bluemooninn.cc](https://bluemooninn.cc).
No browser or continuously running server is required.

## Published feed

- Snapshot: `https://raw.githubusercontent.com/jwm-r/bm1/data/latest.json`
- Map tiles: paths listed in `snapshot.map.tiles`, under `snapshot.map.tileRoot`
- Website: `https://bluemooninn.cc/party/`, with an embedded map on the home page

The workflow runs at minutes 2, 7, 12, …, 57 UTC. GitHub can delay scheduled runs;
this is **not a live feed**. The site checks for updates once a minute and flags
snapshots older than 15 minutes. A failed collection never replaces the previous
successful snapshot. Schedules run from the default branch (`main`); GitHub may
disable scheduled workflows in public repositories after 60 days without activity.
Check the Actions page if updates stop.

## What gets published

Player names, their worlds, sampled in-game coordinates/floor, and timestamps.
Only players present during the acknowledged 25-second collection window are
included. Players without locations remain in the roster with no map marker.
Chat, inventory, equipment, HP and other stats are **not published**.

The collector joins BM1 as an unnamed observer, requests an initial sync, listens,
and explicitly leaves. Names and positions are reported by party clients; they
are not proof of a character's identity. Instanced areas may reuse coordinates.

## Run locally

Requires Node.js 22 or newer (Actions uses Node.js 24).

```sh
npm ci
npm test
node scripts/download-cache.mjs
npm run collect
```

Output goes to `feed/`. `OSRS_CACHE_DIR` may point to an existing osrs.world cache
directory; `FEED_DIR` changes the output folder. `PARTY_PASSPHRASE` defaults to
`bm1`. Passphrases are lowercased as RuneLite does; IDs preserve all 63 bits.

The published collector intentionally targets BM1. The public website validates
that channel and does not accept arbitrary party names from visitors.

## Map rendering

Uses the real BSD-licensed osrs.world `MapImageRenderer.renderMinimapHd` on the
runner, with no browser automation. It renders 256×256 WebP tiles from 64×64 game
regions, covering seven regions across around each member. Tiles are immutable
within the pinned cache version and reused across snapshots. The current tested
cache is revision 235, dated 2025-11-05; newer game areas may be absent. The website
shows the map cache date. Update `scripts/download-cache.mjs` and the workflow's
cache key together when adopting a newer tested cache.

`vendor/osrs-minimap.cjs` bundles 157 source modules from the osrs.world source in
the local rs-map-viewer checkout at commit `7010d26` (with relocated import paths
repaired). Original license notices are retained, and the repository license is
in `vendor/osrs-map-viewer-LICENSE`. Source: https://github.com/dennisdev/rs-map-viewer.
`src/renderer-entry.ts` is the thin adapter. To regenerate the bundle from a
compatible checkout:

```sh
RS_MAP_VIEWER_SOURCE=/path/to/rs-map-viewer npm run build:renderer
```

The Sites website stays on ChatGPT Sites. GitHub Actions publishes only the `data`
branch; it does not redeploy or overwrite the Sites source.

## Operations

No API token is stored in this repository. The workflow uses its scoped
`GITHUB_TOKEN` with `contents: write`, a single concurrency group and an eight-minute
timeout. First push triggers collection; **Actions → BM1 party snapshot → Run
workflow** also starts an update. Source commits stay on `main`; snapshots and
reusable tiles stay on `data`. Generated cache files are held in Actions cache.

## Discord bot setup

The optional collector uses Discord's REST API on each Actions run; it does not need an always-on bot process. It stays disabled until configured. Discord failures preserve the previous `discord.json` and do not fail the BM1 publication.

1. In the [Discord Developer Portal](https://discord.com/developers/applications), create an application named **BlueMoon Inn Feed**, open **Bot**, and generate its bot token. Enable **Message Content Intent** if collecting loot posts.
2. Use **OAuth2 → URL Generator** with the `bot` scope and only **View Channels** and **Read Message History** permissions. Invite it to your clan server. Grant access only to channels intended for the public website; Administrator and Send Messages are unnecessary.
3. Save the token as the repository Actions secret [`DISCORD_BOT_TOKEN`](https://github.com/jwm-r/bm1/settings/secrets/actions). Never commit it or paste it into chat.
4. Enable Discord Developer Mode and copy your server ID. Add an Actions repository variable `DISCORD_GUILD_ID` in [Variables](https://github.com/jwm-r/bm1/settings/variables/actions).
5. For loot, add `DISCORD_LOOT_CHANNEL_ID` and comma-separated `DISCORD_LOOT_AUTHOR_IDS` containing the bot/webhook author IDs whose drops should appear. Only those automated posts are included; ordinary member conversation is excluded. Leave these unset for events only.
6. Run **BM1 party snapshot → Run workflow**. Check the Discord step. Its output is `data/discord.json`, alongside `latest.json`.

Events include scheduled/active event names, descriptions, times, and Discord links. Loot currently includes the latest 100 channel messages filtered to the selected automated authors, retaining text and embed fields. This is a recent feed, not a permanent or complete loot ledger; edits and deletions are reflected on the next successful fetch. Item/quantity parsing depends on the posting bot's format. Images, attachments, member profiles, and event attendee lists are omitted. The repository and feed are public. The site's Discord display still needs wiring once the server and loot format are selected.

API references: [scheduled events](https://discord.com/developers/docs/resources/guild-scheduled-event#list-scheduled-events-for-guild), [channel messages and content intent](https://discord.com/developers/docs/resources/message#get-channel-messages).
