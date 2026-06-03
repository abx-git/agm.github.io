# Blueprint Pattern Assistant

Minimal two-phase UI: **Part 1 Create** (adoption prompt + follow-up) and **Part 2 Use** (mode picker).

Live: https://abx-git.github.io/blueprint-pattern.github.io/

**URL:** https://abx-git.github.io/blueprint-pattern.github.io/

**Pages repo:** [abx-git/blueprint-pattern.github.io](https://github.com/abx-git/blueprint-pattern.github.io)  
**Setup (once):** [GITHUB-PAGES-SETUP.md](./GITHUB-PAGES-SETUP.md) — secret `BLUEPRINT_PATTERN_GHIO_DEPLOY` + Pages on the `.github.io` repo.

## Run locally

From the repository root:

```bash
./scripts/open-assistant.sh
```

Opens `http://localhost:8765` (requires Python 3).

Manual:

```bash
cd docs/assistant
python3 -m http.server 8765
```

Then open http://localhost:8765 in your browser.

> Browsers block `fetch()` for local `file://` URLs — use the small server above.

## Ship with your application

When you vendor or submodule this pattern repo, copy the assistant into your app if you want it beside the docs:

```bash
cp -R path/to/blueprint-pattern/docs/assistant ./docs/architecture/assistant
```

Team members run `python3 -m http.server` from that folder, or you publish it on internal GitHub Pages.

## Publish

Deployment is automated via `.github/workflows/pages.yml` on every push to `main` that touches `docs/assistant/` or `prompts/workflows/`.

## Data files

| File | Content |
|------|---------|
| `workflows.json` | Session prompts (keep in sync with `prompts/workflows/*.md`) |
| `anchors.json` | `[[ANCHOR:…]]` catalog |

Regenerate after editing workflow markdown:

```bash
./scripts/sync-assistant-data.sh
```

(Extracts session blocks from `prompts/workflows/` — run before release.)
