# nuxt-ui-tools

Nuxt module and runtime toolkit for UI-heavy Nuxt apps, with a local playground for integration testing and demos.

## Structure

- `src/module.ts`: Nuxt module entry
- `src/runtime/shared`: shared types, composables, and helpers
- `src/runtime/table`: table/query runtime
- `src/runtime/form`: form runtime
- `playground`: local Nuxt app used to validate the module end to end
- `test`: Vitest suite for runtime and schema behavior

## Commands

```bash
bun install
npm run dev
npm run build
npm run typecheck
npm run test
```

## Playground

The playground loads the module from local source and exercises the integrated runtime in a real Nuxt app.

```bash
npm run dev:prepare
npm run dev
```

## Docs

- Playground guide: [`docs/playground.md`](docs/playground.md)
- Release guide: [`docs/releasing.md`](docs/releasing.md)
- Data table V2 notes: [`docs/iterations/data-table-v2/README.md`](docs/iterations/data-table-v2/README.md)
