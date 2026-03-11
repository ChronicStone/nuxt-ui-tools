# Monorepo Setup

This repository is a Bun workspace monorepo built around a small package suite plus a Nuxt playground used to exercise the packages together.

## High-Level Structure

The workspace layout is:

- `packages/*`: publishable packages
- `playgrounds/*`: local apps used for development and integration checks

Current workspaces:

- `packages/shared`: shared types, helpers, and composables
- `packages/table`: table package
- `packages/form`: form package
- `packages/nuxt`: Nuxt integration module
- `playgrounds/nuxt`: local Nuxt playground

## Package Manager

The repository uses Bun workspaces.

Root configuration lives in `package.json`:

- `workspaces`: declares `packages/*` and `playgrounds/*`
- `packageManager`: pinned to `bun@1.3.6`

Install everything from the repository root:

```bash
bun install
```

## Task Orchestration

[Turbo](https://turbo.build/) is used to run tasks across workspaces.

Task definitions are in `turbo.json`.

Current task model:

- `build`: depends on upstream package builds
- `dev`: long-running, uncached
- `typecheck`: depends on builds
- `clean`: uncached cleanup

This gives a few practical benefits:

- packages build in dependency order
- one root command can validate the whole repo
- local development stays fast as the repo grows

## Root Commands

The root `package.json` exposes the monorepo-level commands:

```bash
bun run dev
bun run build
bun run typecheck
bun run lint
bun run format
bun run check
```

Meaning:

- `bun run dev`: runs workspace `dev` tasks in parallel
- `bun run build`: builds all workspaces through Turbo
- `bun run typecheck`: type checks all workspaces through Turbo
- `bun run lint`: runs `oxlint` from the repository root
- `bun run format`: runs `oxfmt` from the repository root
- `bun run check`: formatting, lint, build, then typecheck

## Package Build Model

Each package in `packages/*` currently follows the same basic pattern:

- source code under `src/`
- TypeScript config per package
- build handled by `tsdown`
- output emitted to `dist/`

Each package exposes:

- `build`
- `dev`
- `typecheck`
- `clean`

This keeps package authoring consistent and makes it easy to add more packages later without inventing new tooling conventions each time.

## Dependency Boundaries

The intended dependency direction is:

- `shared` sits at the bottom
- feature packages such as `table` and `form` can depend on `shared`
- `nuxt` can depend on the feature packages and `shared`
- playgrounds consume the packages as workspace dependencies

In practice, the playground is where the full integration story is exercised.

## Publishable vs Non-Publishable Workspaces

Not every workspace in a monorepo should be published.

In this repository:

- packages under `packages/*` are candidates for npm publishing
- playgrounds are local development apps and remain `private`

If a package is not ready for publication, set `"private": true` in its `package.json` until it is ready.

## Shared Tooling

The repository currently shares a few core tools across all workspaces:

- TypeScript for type checking
- `tsdown` for library builds
- `oxlint` for linting
- `oxfmt` for formatting
- Turbo for orchestration
- GitHub Actions for CI and release automation

This means package-level scripts stay minimal, while the root remains the main entry point for validation.

## Generated Output

Common generated directories include:

- `dist/`: package build output
- `.nuxt/`: Nuxt generated files for the playground
- `.output/`: Nuxt production build output
- `.turbo/`: Turbo cache and logs

These should be treated as generated artifacts, not hand-edited source files.

## Adding a New Package

When adding another package under `packages/*`, follow the current package shape:

1. Create a new workspace under `packages/<name>`
2. Add a `package.json`
3. Add `tsconfig.json`
4. Add `tsdown.config.ts`
5. Add `src/`
6. Decide whether it is public or private
7. Add it to the playground if integration coverage is useful

Sticking to the same structure keeps CI, release tooling, and local development predictable.
