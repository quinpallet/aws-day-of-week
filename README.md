# day-of-week-api

Simple AWS SAM + Lambda API that returns the day of the week for a given date.

## Prerequisites
- Node.js (recommended via `nvm`, see `.nvmrc`)

## Commands
- Install: `npm ci`
- Test: `npm test`
- Build (outputs `dist/handler.js`): `npm run build`

## Deploy (SAM CLI)
- Copy config: `cp samconfig.toml.example samconfig.toml` (then adjust as needed)
- Build: `npm run build`
- Deploy: `sam deploy --guided`

## Security notes
- `samconfig.toml`, `.env*`, `dist/`, `.aws-sam/`, and `node_modules/` are git-ignored to avoid committing local config and build artifacts.
