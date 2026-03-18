# Nuxt Playground

The playground is the local integration app for the module repository.

It lives at:

- `playground`

Its job is to validate the module, runtime helpers, and UI flows inside a real Nuxt application before release.

## What It Exercises

- local module loading from `src/module.ts`
- runtime integration across `src/runtime/shared`, `src/runtime/table`, and `src/runtime/form`
- Nuxt UI rendering and interaction flows
- i18n behavior and demo routes

## Nuxt Configuration

The main setup lives in `playground/nuxt.config.ts`.

Key points:

- `@nuxt/ui` is enabled for UI primitives
- `@nuxtjs/i18n` is enabled for locale testing
- the local module is loaded from `../src/module.ts`
- local aliases point at the runtime source so playground code can exercise the real implementation

## Commands

From the repository root:

```bash
npm run dev:prepare
npm run dev
```

Other useful commands:

```bash
cd playground
npm run build
npm run typecheck
npm run clean
```

## Scope

The playground can contain:

- demo pages
- integration-only helpers
- manual verification routes

It should not become the only place where real package behavior exists. Shared runtime logic belongs under `src/runtime`.
