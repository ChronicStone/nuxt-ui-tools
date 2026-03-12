# nuxt-ui-tools

Bun-powered monorepo for a Vue/Nuxt UI toolkit suite.

## Workspaces

- `packages/shared`: shared composables, types, and helpers
- `packages/table-core`: shared schema primitives and future runtime contracts
- `packages/table`: base table schema package with promise-based async contracts
- `packages/table-query`: query-backed table schema package with TanStack Query contracts
- `packages/form`: Vue form package
- `packages/nuxt`: Nuxt module for auto-imports and component registration
- `playgrounds/nuxt`: Nuxt playground for module integration

## Commands

```bash
bun install
bun dev
bun build
bun typecheck
```

## Docs

- Monorepo setup: [`docs/monorepo.md`](docs/monorepo.md)
- Playground guide: [`docs/playground.md`](docs/playground.md)
- Data table V2 reset: [`docs/iterations/data-table-v2/README.md`](docs/iterations/data-table-v2/README.md)
- Release workflow: [`docs/releasing.md`](docs/releasing.md)
