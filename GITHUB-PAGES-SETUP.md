# GitHub Pages — setup

The interactive assistant is **not** served from this repository. It is deployed to:

| Item | Value |
|------|--------|
| **Pages repository** | [abx-git/agm.github.io](https://github.com/abx-git/agm.github.io) |
| **Live URL** | **https://abx-git.github.io/agm.github.io/** |
| **Source in this repo** | `docs/assistant/` (built by CI) |

Deploy uses an **SSH deploy key** (not a PAT). Org PATs often authenticate as `abx-git` and get **403** on `git push`.

## 1. Enable Pages on the Pages repository

**https://github.com/abx-git/agm.github.io/settings/pages**

| Field | Value |
|-------|--------|
| **Source** | Deploy from a branch |
| **Branch** | `main` |
| **Folder** | `/` (root) |

Save, wait 1–2 minutes.

> Optional: if secret `AGM_GHIO_DEPLOY` (user PAT with Administration) is set on **agm**, the workflow can enable Pages via API. Deploy itself does **not** need that PAT.

## 2. Deploy key (required)

### Generate a key pair (once)

Use **RSA 4096** (compatible with the deploy path in CI):

```bash
cd /tmp
ssh-keygen -t rsa -b 4096 -C "agm-ci-deploy" -f agm-pages-deploy -N ""
ls -l agm-pages-deploy agm-pages-deploy.pub
```

| File | Looks like | Where it goes |
|------|-------------|---------------|
| `agm-pages-deploy.pub` | **One line** starting with `ssh-rsa AAAA…` | Deploy key on **agm.github.io** |
| `agm-pages-deploy` | Many lines `-----BEGIN … PRIVATE KEY-----` | Secret `ACTIONS_DEPLOY_KEY` on **agm** |

Do **not** commit either file.

### Public key → **agm.github.io** (not agm)

Show what to paste (must be exactly one line):

```bash
cat /tmp/agm-pages-deploy.pub
# must start with: ssh-rsa
# must NOT start with: -----BEGIN
```

1. Open **https://github.com/abx-git/agm.github.io/settings/keys**
2. Remove any older CI deploy keys that no longer match
3. **Add deploy key**
   - Title: `agm CI deploy`
   - Key: paste the **single line** from `cat …pub` above (`ssh-rsa AAAA… agm-ci-deploy`)
   - Enable **Allow write access**
4. Add key

If GitHub says *“Key is invalid. You must supply a key in OpenSSH public key format”*, you pasted the **private** key (`BEGIN PRIVATE KEY`) or only part of the `.pub` line. Use only `agm-pages-deploy.pub`.

### Private key → **agm** secret (preserving newlines)

Prefer the CLI so newlines survive (GitHub UI paste often breaks the key → `Permission denied (publickey)`):

```bash
# from a machine with gh auth to abx-git/agm:
gh secret set ACTIONS_DEPLOY_KEY --repo abx-git/agm < /tmp/agm-pages-deploy
```

Or in the UI: **abx-git/agm** → Settings → Secrets → Actions → `ACTIONS_DEPLOY_KEY` = full private key file including `BEGIN`/`END` lines (the file **without** `.pub`).

Then (only after both sides are saved):

```bash
rm -f /tmp/agm-pages-deploy /tmp/agm-pages-deploy.pub
```

### Verify fingerprints match

```bash
ssh-keygen -lf /tmp/agm-pages-deploy.pub   # before deleting; or from .pub still on disk
```

The workflow prints the fingerprint derived from the secret — it must match the Deploy Key fingerprint shown on **agm.github.io** → Settings → Deploy keys.

## 3. Run the deploy workflow

In **abx-git/agm**:

**Actions** → **Deploy Blueprint Assistant (GitHub Pages)** → **Run workflow** (branch `main`).

When green, open **https://abx-git.github.io/agm.github.io/** (after 1–2 minutes).

## 4. Ongoing updates

Every push to `main` that changes `docs/assistant/` or `prompts/workflows/` triggers a new deploy.

## Optional: PAT for Pages API only

Not required for push. Only if you want the workflow to auto-enable Pages:

| Secret on **agm** | Purpose |
|-------------------|---------|
| `AGM_GHIO_DEPLOY` | User classic PAT (`repo`) or fine-grained with Administration on `agm.github.io` |

Do **not** use an org-owned token that shows as `abx-git` for git push — that caused:

`Permission to abx-git/agm.github.io.git denied to abx-git` → 403.

Legacy fallback name: `BLUEPRINT_PATTERN_GHIO_DEPLOY` (still accepted for the optional Pages API step).

## Local link to the Pages repository

This clone should have **two** remotes:

| Remote | Repository |
|--------|------------|
| `origin` | `abx-git/agm` (source, CI, docs) |
| `pages` | `abx-git/agm.github.io` (GitHub Pages site) |

One-time setup from **agm** root:

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

From **agm** repository root:

```bash
./scripts/open-assistant.sh
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Missing `ACTIONS_DEPLOY_KEY` | Step 2 — set private key secret on **agm** |
| `Permission denied (publickey)` | Key pair mismatch or broken newlines — regenerate RSA key, public on **agm.github.io**, set secret with `gh secret set … < file` |
| Fingerprint in CI log ≠ Deploy key UI | Wrong public key on Pages repo, or secret is a different private key |
| 403 / denied to `abx-git` | That was the old PAT path; use deploy key only for push |
| Deploy key exists but push fails | Public key must have **Allow write access** on **agm.github.io** |
| 404 on live URL | Enable Pages manually (step 1); wait 1–2 minutes after green deploy |
| Wrong repo Settings | Deploy key + Pages = **agm.github.io**; secret = **agm** |
| Old PAT secrets only | PAT alone cannot replace `ACTIONS_DEPLOY_KEY` for CI push |
