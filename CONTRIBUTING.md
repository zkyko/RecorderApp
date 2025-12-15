# Contributing to QA Studio

## Branch Model

- `prod` — Production branch (protected)
- `integration` — Shared development branch (protected)
- `feature/*` — All development work

## Rules (Non-Negotiable)

- Do NOT commit directly to `prod` or `integration`
- All work MUST be done in a `feature/*` branch
- All changes MUST be merged via Pull Requests
- CI MUST pass before any merge
- At least one approving review is REQUIRED
- Pull Requests to `prod` may ONLY come from `integration`

## Contributor Workflow

1. Clone the repository
2. Checkout `integration`
3. Create a `feature/*` branch
4. Commit changes locally
5. Push the feature branch
6. Open a Pull Request targeting `integration`

## CI Requirements

- Lint and type checks run first
- Unit, integration, and E2E tests run in CI
- If CI fails, the Pull Request MUST be fixed before merging

## Commit Message Conventions

Use clear prefixes:

- `feat:` — New features
- `fix:` — Bug fixes
- `chore:` — Maintenance tasks
- `docs:` — Documentation changes

## Branch Cleanup

- Feature branches should be deleted after merge

