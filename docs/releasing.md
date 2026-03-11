# Releasing

This repository uses [Changesets](https://github.com/changesets/changesets) and GitHub Actions for package releases.

## Publishable Packages

The current publishable workspaces are the packages in `packages/*` that are not marked `private`.

At the moment, that includes:

- `@nuxt-ui-tools/shared`
- `@nuxt-ui-tools/table`
- `@nuxt-ui-tools/form`
- `@nuxt-ui-tools/nuxt`

If a package should not be published yet, mark it as `private` or add it to the Changesets ignore list before releasing.

## Versioning Strategy

Packages are versioned independently.

That means:

- only packages affected by a change are released
- internal dependents can still be bumped automatically when needed
- changelogs stay package-specific instead of turning into one monorepo-wide log

This is the default strategy unless a subset of packages becomes tightly coupled enough to justify lockstep versioning.

## Contributor Workflow

When a pull request changes the public behavior, API, or packaging of a publishable package, it should include a changeset.

Create one locally with:

```bash
bun run changeset
```

The CLI will ask:

1. Which package(s) changed
2. Whether each change is `patch`, `minor`, or `major`
3. For a short, user-facing summary of the change

Commit the generated markdown file under `.changeset/` with the rest of the PR.

## When a Changeset Is Required

Add a changeset when a PR does any of the following for a publishable package:

- adds or removes features
- fixes a user-visible bug
- changes package exports
- changes runtime behavior
- changes types in a way consumers will notice
- introduces a breaking API or behavior change

A changeset is usually not needed for:

- playground-only changes
- CI changes
- internal refactors with no consumer impact
- docs-only changes

## Choosing the Right Bump

- `patch`: bug fix, small non-breaking improvement, packaging fix
- `minor`: new backward-compatible feature
- `major`: breaking API, behavior, or configuration change

If a change is breaking, the summary should say exactly what changed and what consumers need to update.

## CI Workflow

The CI workflow runs on pull requests and pushes to `main`.

It currently verifies:

- formatting with `bun run format:check`
- linting with `bun run lint`
- builds with `bun run build`
- type checking with `bun run typecheck`

The same checks are grouped locally under:

```bash
bun run check
```

## Release Workflow

The release workflow runs on pushes to `main` and can also be started manually from GitHub Actions.

The flow is:

1. Feature PRs merge into `main` with their changeset files
2. GitHub Actions runs the release workflow
3. Changesets inspects unreleased changesets on `main`
4. If pending releases exist, it opens or updates a dedicated release PR
5. That release PR contains:
   - package version bumps
   - internal dependency bumps where needed
   - generated changelog updates
6. When the release PR is merged, the workflow publishes the affected packages to npm

This keeps normal feature PRs separate from release bookkeeping.

## Changelogs

Changesets generates changelog entries from the committed changeset files.

Expected behavior:

- each released package gets its own `CHANGELOG.md`
- only packages included in a release are updated
- entries are derived from the changeset summaries

Write changeset summaries for package consumers, not for maintainers. Prefer:

- `Add column visibility controls to the table package`
- `Fix SSR import path resolution in the Nuxt module`
- `Rename ColumnConfig to TableColumnConfig`

Avoid summaries like:

- `misc fixes`
- `cleanup`
- `refactor`

## Required GitHub Secrets

The release workflow needs:

- `NPM_TOKEN`: npm automation token with publish access

The workflow already uses:

- `GITHUB_TOKEN`: provided automatically by GitHub Actions

Package provenance is enabled through `publishConfig.provenance`.

## First Release Notes

Before the first real release:

1. Confirm which packages should be public
2. Mark unfinished packages as `private` if needed
3. Add the first changeset
4. Merge to `main`
5. Review the generated release PR carefully

## Failure Recovery

If publishing fails:

- fix the underlying issue on `main`
- rerun the release workflow, or push the fix and let the workflow run again
- do not manually edit versions unless automation is blocked and the recovery plan is explicit

If a package should stop publishing:

- set `"private": true` in its `package.json`, or
- add it to the Changesets ignore configuration
