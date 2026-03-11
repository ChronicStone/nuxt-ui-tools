# Nuxt Playground

The Nuxt playground is the integration app for this monorepo.

It lives at:

- `playgrounds/nuxt`

Its job is to validate how the packages behave together inside a real Nuxt application, not just in isolated package builds.

## Why the Playground Exists

Library builds and type checks are necessary, but they do not fully cover:

- Nuxt module registration
- runtime integration between packages
- auto-import behavior
- component registration
- i18n behavior
- actual UI rendering in a live app

The playground gives a fast way to catch integration issues before publishing packages.

## What the Playground Consumes

The Nuxt playground depends on workspace packages directly:

- `@nuxt-ui-tools/shared`
- `@nuxt-ui-tools/table`
- `@nuxt-ui-tools/form`
- `@nuxt-ui-tools/nuxt`

Because these are workspace dependencies, local package changes are visible in the playground without publishing to npm.

## Nuxt Configuration

The main setup lives in `playgrounds/nuxt/nuxt.config.ts`.

Key points:

- `@nuxt/ui` is enabled for UI primitives
- `@nuxtjs/i18n` is enabled for locale testing
- the local Nuxt module is loaded from `../../packages/nuxt/src/module.ts`
- app styling is loaded through `./app/assets/main.css`
- the playground sets `nuxtUiTools` module options directly in config

Loading the module from source is intentional during development. It exercises the real module integration path without requiring a publish step.

## Application Structure

The playground follows normal Nuxt app conventions:

- `app/app.vue`: top-level shell
- `app/app.config.ts`: app-level Nuxt UI config
- `app/pages/*`: routes used for manual testing
- `app/components/*`: local playground-only components
- `app/composables/*`: local playground-only composables
- `i18n/locales/*`: translation files

This code is app code, not package code. It should support package development, demos, and validation.

## Commands

Run the playground from the repository root through Turbo:

```bash
bun run dev
```

Or run it directly:

```bash
cd playgrounds/nuxt
bun run dev
```

Other useful commands:

```bash
cd playgrounds/nuxt
bun run build
bun run typecheck
bun run clean
```

## Development Workflow

Typical package development flow:

1. Change code in one of the workspace packages
2. Start the playground
3. Validate the behavior in a real Nuxt app
4. Run root checks before opening a PR

This is especially useful for:

- package exports
- composables consumed through Nuxt
- auto-imported utilities
- components registered by the Nuxt module
- runtime configuration behavior

## Scope of Playground Code

The playground is intentionally allowed to contain code that would not belong in publishable packages:

- demo pages
- visual verification routes
- temporary integration checks
- local helper components for testing package behavior

What should stay out of the playground:

- reusable package source that belongs in `packages/*`
- release-critical logic that only exists in the demo app
- behavior that becomes the only way to verify a package contract

If something becomes part of the real public API, it should move into a package.

## Generated Files

Nuxt generates several directories during development and build:

- `playgrounds/nuxt/.nuxt`
- `playgrounds/nuxt/.output`

These are generated artifacts and should not be treated as source documentation for the project structure.

## Relationship to CI

The playground is part of repository validation.

That means CI can catch issues such as:

- a package building correctly but failing once loaded into Nuxt
- module wiring regressions
- type issues that only show up in the app
- config drift between package assumptions and real app usage

This is why the playground is worth keeping even if it is never published.
