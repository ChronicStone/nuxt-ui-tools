# Releasing

This repository now publishes a single Nuxt module package: `nuxt-ui-tools`.

## Local Release Flow

Before publishing:

```bash
bun install
npm run dev:prepare
npm run lint
npm run typecheck
npm run test
npm run build
```

When the package is ready:

```bash
npm run release
```

That script:

1. runs linting, type checks, and tests
2. updates release metadata with `changelogen`
3. publishes the package to npm

## CI

The CI workflow prepares the module and playground, then runs:

- `bun run format:check`
- `bun run lint`
- `bun run typecheck`
- `bun run test`

## Secrets

Publishing requires:

- `NPM_TOKEN`

Package provenance is enabled through `publishConfig.provenance`.
