# AGM Assistant

Three-phase lifecycle UI: **Build** · **Evolve** · **Work (Architecture)** · **Work (Domain / DDD)**, plus cross-cutting **Review**.

Live: https://abx-git.github.io/blueprint-pattern.github.io/

**Pages repo:** [abx-git/blueprint-pattern.github.io](https://github.com/abx-git/blueprint-pattern.github.io)  
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
| **Work** | Architecture on compiled graph | `architecture-work-*` (incl. sustainable analysis) |
| **Domain (DDD)** | Strategic & tactical domain model | `domain-work-*` (incl. event storm dialog) |
| **Review** | Verify (report-only) | `review-phase`, `review-maintenance` |

## Publish

```bash
./scripts/sync-assistant-data.sh   # after editing prompts/workflows/
./scripts/push-assistant-to-pages.sh
```

Or CI: `.github/workflows/pages.yml` on push to `main`.
