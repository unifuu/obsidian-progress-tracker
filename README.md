# Progress Tracker

An Obsidian plugin for tracking anime, game, and book progress. For anime, it
reads the `progress`, `episodes`, `title`, and `cover` frontmatter fields. For
games and books, it reads `progress`, `chapters`, `title`, and `cover`. A compact
modal lets you update progress with a live percentage bar and quick -1/+1
buttons.

## Frontmatter it expects

```yaml
title: Digimon Beatbreak
episodes: 49
progress: 14
cover: https://example.com/cover.jpg
finished:
```

For anime, `episodes` is the total episode count and `progress` is how many you
have watched. The completion percentage is computed as `progress / episodes`.
Game notes use `chapters` as the total chapter count and `progress` as the
number of chapters completed. Book notes use the same fields. Other
frontmatter fields (e.g. `studio`, `series`) are left untouched unless progress
reaches the total.
Book notes (`type: "[[📚]]"`) use the `chapters` property and can also use the
same numbered checkbox list under `## Chapters` as game notes.

## Usage

Open an anime note and run **Sync episodes and update watch progress** to
open the progress modal. Episodes are not synced automatically; click the
refresh button in the modal to fetch the latest episodes.

For game notes, set `type` to `[[🎮]]` and add a numbered checklist under
`## Chapters`. The existing checked boxes initialize progress; the tracker
does not call anime services or replace game checklist titles. Saving updates
the checkboxes and the `progress` and `chapters` frontmatter fields. Anime
notes continue to use `episodes`.

Book notes with `type: "[[📚]]"` can use the same `## Chapters` checklist.
Saving synchronizes its checked boxes with the book's `progress` and `chapters`
properties.

Run **Update progress for active anime, game, or book note** from the command
palette, or click the ribbon icon. The modal shows title, cover, progress,
and the checklist. Use the step buttons, number field, or checklist entries,
then click **Save**.

When saved progress reaches the episode or chapter total, the plugin sets
`status` to `[[🟣 Fin]]` and updates `finished` to today's date.

## Deploying into your vault

Put your local vault's absolute path in `.vault-path` (one line; this file is
git-ignored and is not committed):

```bash
printf '%s\n' '/path/to/My Vault' > .vault-path
./deploy.sh
```

For a one-off deployment to a different vault, set `OBSIDIAN_VAULT` instead:

```bash
OBSIDIAN_VAULT="/path/to/My Vault" ./deploy.sh
```

The script deploys to `.obsidian/plugins/obsidian-progress-tracker/` and does
not copy `data.json`, preserving the vault's saved settings. Reload Obsidian
(or toggle the plugin off/on), then enable **Progress Tracker** in Settings →
Community plugins.

## Build

Run `npm install` once to install esbuild. The deployment script builds a
self-contained `main.js` bundle and copies it with the manifest and stylesheet.

## Notes / possible extensions

- The modal width is controlled by the `.wpm-modal` class in
  `styles.css` (currently 220px) — adjust it if your covers are a
  different aspect ratio.
- A natural next step is a dashboard view (using the `ItemView` API, and
  optionally the Dataview API if installed) that lists every watch-log
  note with its own progress bar, so you can open the modal for any show
  from one place instead of navigating to its note first.
