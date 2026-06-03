# Blueprint Pattern Assistant

Interactive helper (static site) — browse workflows, copy session prompts and checkout commands, look up `[[ANCHOR:…]]` markers.

Inspired by the browse-and-copy UX of [Semantic Anchors](https://llm-coding.github.io/Semantic-Anchors/); this assistant is **specific to the Blueprint Pattern** (workflows, roles, session checkpoints).

## Live site (GitHub Pages)

**URL:** https://abx-git.github.io/blueprint-pattern/

**Setup (once):** [GITHUB-PAGES-SETUP.md](./GITHUB-PAGES-SETUP.md) — especially if you only see *Verified domains* in Settings.

Short version:

1. Repo **Settings → Pages** (not organization settings).
2. **Build and deployment** → Source: **Deploy from a branch** → Branch **`gh-pages`** → Folder **`/`**.
3. **Actions** → run **Deploy Blueprint Assistant** → wait for green.
4. Reload **Settings → Pages** — live URL should appear.

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
