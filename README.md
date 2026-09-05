# Kruger Life List

A field checklist for **southern Kruger National Park** — 246 species across
mammals, birds, reptiles, amphibians and fish, scoped to what you can realistically
pick out from a vehicle. Numbered dex entries, a photo per species, and a running
count of how many are left.

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

Two filters have been applied to the full park list:

1. **Size** — anything under a dwarf mongoose (~250 g) is out, because you cannot
   pick it out from a car. Birds are exempt: a sunbird is small but conspicuous.
   Invertebrates go as a group, along with bats, rodents, shrews, geckos and small
   snakes.
2. **Range** — northern and far-north species are out (samango, suni, roan,
   tsessebe, Lichtenstein's hartebeest, tree hyrax, and the northern birds).
   Rarity is re-rated for the south specifically, so sable and oribi read as more
   findable here than they would park-wide, while kori bustard reads as harder.

Birds are further cut to the large, loud and brightly coloured — the little brown
jobs that need a scope and an hour are gone.

## Dex entries

Every species carries a silhouette, a habitat line and a field note. The
silhouette shows before you have a photo, the way a Pokédex shows a shadow for
a species you have not caught. There are 40 silhouettes for 246 species: body-shape archetypes shared across
similar animals, so every antelope shares one drawing and every stork another.

The entry itself opens with a **reference plate** — the archetype painted in that
species' own colours and markings, so a kudu reads as a striped grey antelope and
an impala as a tan one with white underparts. These are drawn, not photographs,
and the expanded view says so. Colour comes from 115 palettes mapped by species,
with four marking patterns: plain, stripe, spot and bar.

Tap the plate to expand it. Your own photos sit at the far end of the entry,
below the field notes, and expand the same way.

Species are cross-tagged into eight sets. Four are the lists Kruger regulars
keep — Big Five, Secret Seven, Ugly Five, birding Big Six — and four are keyed
to how you actually go looking: the Night Drive, the River Run, the Koppies,
and Summer Only.

## Photos

Adding a photo opens a crop step before anything is stored: drag to move, pinch or
slide to zoom, rotate if the phone got the orientation wrong. The crop is square
because the dex card window is square, so the framing you choose is the framing
that gets kept rather than whatever `object-fit` happens to leave in view.

Three output sizes, remembered between photos:

| | Longest edge | Roughly |
| --- | --- | --- |
| Compact | 1000 px | 120 KB |
| Standard | 1600 px | 280 KB |
| High | 2400 px | 650 KB |

Nothing is ever upscaled past what the crop actually contains, and a 200 px
thumbnail is stored alongside each photo so the grid stays fast.

Photos already saved can be reframed from the button on each thumbnail. That
works from the stored copy rather than the original off the camera, so
repeated recrops lose a little quality each time.

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
