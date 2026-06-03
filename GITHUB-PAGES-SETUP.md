# GitHub Pages — setup

If you only see **Verified domains** and no **Build and deployment** section, you are usually on the **wrong settings page** or Pages is not enabled for this repository yet.

## 1. Open the repository settings (not the organization)

Correct URL pattern:

`https://github.com/abx-git/blueprint-pattern/settings/pages`

Not:

- `https://github.com/organizations/abx-git/settings/pages` (organization — often **only** verified domains)
- Your personal account Settings → Pages

You need **Admin** on the repository to change Pages.

## 2. Enable Pages (branch deploy — recommended)

On **abx-git/blueprint-pattern** → **Settings** → **Pages** (sidebar: *Code and automation*).

Under **Build and deployment**:

| Field | Value |
|-------|--------|
| **Source** | Deploy from a branch |
| **Branch** | `gh-pages` |
| **Folder** | `/` (root) |

Click **Save**.

The workflow [`.github/workflows/pages.yml`](../../.github/workflows/pages.yml) pushes `docs/assistant/` to the `gh-pages` branch on each run.

## 3. Run the workflow once

**Actions** → **Deploy Blueprint Assistant (GitHub Pages)** → **Run workflow** (branch `main`).

Wait until the job is green. After ~1–2 minutes refresh **Settings → Pages** — you should see:

> Your site is live at **https://abx-git.github.io/blueprint-pattern/**

## 4. If you still only see “Verified domains”

| Cause | What to do |
|-------|------------|
| Organization Pages policy | Org owner: **Settings → Pages** → allow Pages for repositories |
| No admin on repo | Ask repo owner to configure Pages or run the workflow |
| First deploy pending | Run the Actions workflow first; then Build and deployment may appear |
| Private repo (legacy plans) | Pages may be unavailable — make repo public or upgrade plan |

## 5. Alternative: GitHub Actions as source

If **Build and deployment** shows **GitHub Actions** as a source option, you can select it instead. The current workflow uses the `gh-pages` branch method because it works with the visible **Deploy from a branch** UI.

## Local preview

```bash
./scripts/open-assistant.sh
```
