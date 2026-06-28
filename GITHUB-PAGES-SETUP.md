# GitHub Pages — setup

The interactive assistant is **not** served from this repository. It is deployed to:

| Item | Value |
|------|--------|
| **Pages repository** | [abx-git/agm.github.io](https://github.com/abx-git/agm.github.io) |
| **Live URL** | **https://abx-git.github.io/agm.github.io/** |
| **Source in this repo** | `docs/assistant/` (built by CI) |

## 1. Enable Pages on the Pages repository

Open **that** repository (not `blueprint-pattern`):

**https://github.com/abx-git/agm.github.io/settings/pages**

Under **Build and deployment**:

| Field | Value |
|-------|--------|
| **Source** | Deploy from a branch |
| **Branch** | `main` |
| **Folder** | `/` (root) |

Save.

> If you only see **Verified domains**, you are on organization account settings or lack admin rights — use the repo link above.

## 2. Add deploy secret on blueprint-pattern (this repo)

The workflow pushes from **blueprint-pattern** into **agm.github.io** using a Personal Access Token.

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** (fine-grained or classic).
2. Create a token with **Contents: Read and write** on repository `abx-git/agm.github.io`.
3. In **abx-git/blueprint-pattern** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:
   - Name: `AGM_GHIO_DEPLOY`
   - Value: the token

   > **Migration:** If you still have `BLUEPRINT_PATTERN_GHIO_DEPLOY`, the deploy workflow accepts it as fallback until you rename the secret.

## 3. Run the deploy workflow

In **abx-git/blueprint-pattern**:

**Actions** → **Deploy Blueprint Assistant (GitHub Pages)** → **Run workflow** (branch `main`).

When green, open **https://abx-git.github.io/agm.github.io/** (after 1–2 minutes).

## 4. Ongoing updates

Every push to `main` that changes `docs/assistant/` or `prompts/workflows/` triggers a new deploy.

## Local link to the Pages repository

This clone should have **two** remotes:

| Remote | Repository |
|--------|------------|
| `origin` | `abx-git/blueprint-pattern` (source, CI, docs) |
| `pages` | `abx-git/agm.github.io` (GitHub Pages site) |

One-time setup from **blueprint-pattern** root:

```bash
git remote add pages https://github.com/abx-git/agm.github.io.git
git remote -v
```

If `pages` already exists, repoint it:

```bash
git remote set-url pages https://github.com/abx-git/agm.github.io.git
git remote -v
```

### Manual deploy from your machine

Requires write access to **agm.github.io** (SSH key or HTTPS credentials):

```bash
./scripts/push-assistant-to-pages.sh
```

This syncs `workflows.json`, splits `docs/assistant/` with `git subtree`, and pushes to `pages` → `main`. CI deploy (section 3) is the usual path; use the script for ad-hoc fixes without Actions.

## Local preview (no token needed)

From **blueprint-pattern** repository root:

```bash
./scripts/open-assistant.sh
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Workflow fails: missing secret | Step 2 above |
| 404 on URL | Pages enabled on **agm.github.io** (step 1), workflow green |
| Wrong repo Settings | Pages config is on **agm.github.io**, not blueprint-pattern |
| Old secret `BLUEPRINT_PATTERN_GHIO_DEPLOY` | Rename or recreate as **`AGM_GHIO_DEPLOY`** (step 2) |
| Old repo `blueprint-pattern.github.io` | Deprecated; use **[abx-git/agm.github.io](https://github.com/abx-git/agm.github.io)** |
