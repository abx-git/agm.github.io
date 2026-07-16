# AGM Assistant

Lifecycle UI: **Build** · **Evolve** · **Verify**, plus collapsed **Advanced** (Architect + Domain).

Day-1 = golden path only (7 workflows). Advanced intents stay available but are not required to start.

Live: https://abx-git.github.io/agm.github.io/

**Pages repo:** [abx-git/agm.github.io](https://github.com/abx-git/agm.github.io)  
**Setup (once):** [GITHUB-PAGES-SETUP.md](./GITHUB-PAGES-SETUP.md)

## Run locally

```bash
./scripts/open-assistant.sh
```

Opens `http://localhost:8765` (requires Python 3).

## Guided UX (v40+)

- **Start here** strip — 5-step golden path with contextual banner (no prior AGM knowledge required).
- **Session mode** — **Copy prompt** (default) or **MCP in IDE** (`agm_trigger_workflow`).
- **MCP panel** — IDE-specific config path, copyable `mcp.json`, verify steps, MCP install/adopt/session requests.

## Tabs

| Tab | What | Workflows |
|-----|------|-----------|
| **Build** | Install, upgrade, adopt, continue | `agm-install.sh`, `agm-upgrade.sh`, `bootstrap-adopt`, `bootstrap-continue` |
| **Evolve** | Sync, import, or deepen | `maintenance-diff-range`, `content-ingest`, `refinement` (+ paste-diff under More) |
| **Verify** | Report-only, fresh chat | `review-maintenance`, `review-phase` (+ milestone under More) |
| **Advanced** | After a graph exists | `architecture-work-*`, Domain pack under collapsed details |

## Publish

```bash
./scripts/sync-assistant-data.sh   # after editing prompts/workflows/
./scripts/push-assistant-to-pages.sh
```

Or CI: `.github/workflows/pages.yml` on push to `main`.
