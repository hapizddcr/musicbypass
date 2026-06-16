# GitHub Actions Workflows

These workflow files are present locally but excluded from the initial push because the deploy token didn't have `workflow` scope.

## To enable CI/CD:

1. **Option A — Add via GitHub UI:**
   - Go to https://github.com/hapizddcr/musicbypass/tree/main/.github/workflows
   - Click "Add file" → "Create new file"
   - Copy-paste content from `ci.yml` and `deploy.yml` in this folder

2. **Option B — Use a token with `workflow` scope:**
   ```bash
   git checkout .github/workflows/*.yml
   git add .github/workflows/
   git commit -m "ci: add GitHub Actions workflows"
   git push
   ```

3. **Option C — Use `gh workflow` CLI with proper auth:**
   ```bash
   gh auth refresh --scopes workflow
   git checkout .github/workflows/*.yml
   git add .github/workflows/
   git commit -m "ci: add GitHub Actions workflows"
   git push
   ```
