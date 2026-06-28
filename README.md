# AGM Assistant

Lifecycle UI: **Build** · **Evolve** · **Architect** · **Domain**, plus cross-cutting **Verify** (`review-*`). Workflows use **Track · Activity · Mode** vocabulary — see [Guide](../guide.md).

Live: https://abx-git.github.io/agm.github.io/

**Pages repo:** [abx-git/agm.github.io](https://github.com/abx-git/agm.github.io)  
**Setup (once):** [GITHUB-PAGES-SETUP.md](./GITHUB-PAGES-SETUP.md)

## Run locally

```bash
./scripts/open-assistant.sh
```

Opens `http://localhost:8765` (requires Python 3).

## Lifecycle tabs

| Tab | Phase | Workflows |
|-----|-------|-----------|
| **Build** | Install script + adopt + continue | install (generated script), adopt (form), `bootstrap-continue`, `review-milestone` |
| **Evolve** | Deepen or sync with code | `refinement`, `maintenance` |
| **Architect** | Clarify · Design · Evaluate on graph | `architecture-work-*` |
| **Domain** | DDD on graph | `domain-work-*` |
| **Verify** | Evaluate (report-only, new chat) | `review-phase`, `review-maintenance` |

## Publish

```bash
./scripts/sync-assistant-data.sh   # after editing prompts/workflows/
./scripts/push-assistant-to-pages.sh
```

Or CI: `.github/workflows/pages.yml` on push to `main`.
