# Kruger Life List

A field checklist of the animals of Kruger National Park — 414 species across
mammals, birds, reptiles, amphibians and fish. Scoped to what you can realistically
see from a vehicle. Tick off what you see, attach your own photos, watch the count
climb.

Built for how the park actually works: **everything is stored on the device**, so
it opens and records sightings with no signal, which is most of Kruger.

## Using it

Open `index.html` — from a static host, or straight off the phone's storage.
On Android, use the browser menu → **Add to Home screen** and it launches
full-screen with its own icon.

Served over HTTP(S) it registers a service worker, so after the first visit it
opens offline.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The whole app, standalone. Nothing else is needed to run it. |
| `app.html` | The same page, body-only, for publishing as a Claude Artifact. |
| `build/` | The source parts both files are assembled from. |
| `build.sh` | Assembles `build/*` into `app.html` and `index.html`. |
| `icon.svg`, `manifest.webmanifest`, `sw.js` | Home-screen install and offline support. |
| `tests/` | Playwright checks that drive the real page in Chromium. |

Edit files in `build/` — `index.html` and `app.html` are both generated:

```sh
./build.sh
```

The species list lives in `build/04-data.html`, with birds in `build/05-birds.html`,
one line each:

```
Common name | Scientific name | rarity 1-4 | collection keys
```

## Data notes

Rarity is **how likely you are to see it in Kruger by day**, not conservation
status — so nocturnal species are rated on daytime odds, and a night drive moves
them a long way in your favour.

Species are cross-tagged into the lists Kruger regulars keep: the Big Five, the
Secret Seven, the Ugly Five and the birding Big Six.

Anything smaller than a dwarf mongoose (~250 g) is deliberately excluded, because
you cannot pick it out from a car. Birds are exempt from that rule — a sunbird is
small but conspicuous. Invertebrates are excluded as a group for the same reason,
along with bats, rodents, shrews, geckos, skinks and small snakes.

## Backups

The list lives in this browser's IndexedDB. Clearing site data erases it, so
**Export backup** in the menu writes a JSON file holding every sighting and every
photo, and **Restore backup** reads it back on any device.

## Tests

```sh
npm install                  # playwright; the browser is expected to be present
node tests/01-checklist.mjs  # data, filters, sorting, persistence
node tests/02-photos.mjs     # capture, resize, gallery, delete
node tests/03-backup.mjs     # export -> wipe -> restore round trip
python3 -m http.server 8899 & node tests/04-offline.mjs   # service worker, offline use
```

Each script drives the page in Chromium and prints what it observed.
