# nuxt-ui-tools

Nuxt module and runtime toolkit for UI-heavy Nuxt apps, with a local playground for integration testing and demos.

The release-ready public runtimes are available through `nuxt-ui-tools/table`,
`nuxt-ui-tools/form`, `nuxt-ui-tools/query-state`, `nuxt-ui-tools/shared`, and
`nuxt-ui-tools/i18n`. Installing the Nuxt module also exposes the same domains
through `#ui-tools/*`, auto-imports their primary functions, and registers their
top-level components.

The shared entrypoint exports the breakpoint-aware runtime helpers
`getResponsiveValue`, `parseResponsiveValue`, `resolveResponsiveValueAtBreakpoint`,
and `useResponsiveValue`. The spreadsheet import engine is still internal and is
not part of the package export map or Nuxt public surface.

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
bun run dev
bun run build
bun run typecheck
bun run test
```

## Playground

The playground loads the module from local source and exercises the integrated runtime in a real Nuxt app.

```bash
bun run dev:prepare
bun run dev
```

## Docs

- Playground guide: [`docs/playground.md`](docs/playground.md)
- Release guide: [`docs/releasing.md`](docs/releasing.md)
- Data table V2 notes: [`docs/iterations/data-table-v2/README.md`](docs/iterations/data-table-v2/README.md)
