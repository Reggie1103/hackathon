# Issue tracker: GitHub

Issues and specs for this repository live as GitHub issues in `Reggie1103/hackathon`. Use the GitHub CLI for all operations.

## Command

Use `./scripts/gh.ps1` from PowerShell. The wrapper uses a system `gh` installation when available and otherwise finds the repository-local portable installation under `.tools/gh/`.

## Conventions

- **Create an issue:** `./scripts/gh.ps1 issue create --title "..." --body-file <path>`.
- **Read an issue:** `./scripts/gh.ps1 issue view <number> --comments`.
- **List issues:** `./scripts/gh.ps1 issue list --state open --json number,title,body,labels,comments`.
- **Comment on an issue:** `./scripts/gh.ps1 issue comment <number> --body-file <path>`.
- **Apply or remove labels:** `./scripts/gh.ps1 issue edit <number> --add-label "..."` or `--remove-label "..."`.
- **Close an issue:** `./scripts/gh.ps1 issue close <number> --comment "..."`.

Infer the repository from `git remote -v`; GitHub CLI does this automatically when run inside the clone.

For multiline issue descriptions and comments, write the exact text to a temporary file and pass it with `--body-file`.

## Pull requests as a triage surface

**PRs as a request surface: no.**

GitHub shares one number space across issues and pull requests. When a bare reference such as `#42` is ambiguous, try `./scripts/gh.ps1 pr view 42` and fall back to `./scripts/gh.ps1 issue view 42`.

## When a skill says “publish to the issue tracker”

Create a GitHub issue in `Reggie1103/hackathon`.

## When a skill says “fetch the relevant ticket”

Run `./scripts/gh.ps1 issue view <number> --comments`.

