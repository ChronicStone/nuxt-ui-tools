# Releasing

This repository now publishes a single Nuxt module package: `nuxt-ui-tools`.

## First Release

Version `0.1.0` is prepared in the repository. Verify it from a clean checkout:

```bash
bun install --frozen-lockfile
bun run dev:prepare
bun run check
bun run build
npm pack --dry-run
```

Publish it by tagging the prepared release commit and pushing only the tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The tag must exactly match the version in `package.json`. The release workflow rejects mismatches before publishing.

## Later Releases

From a clean default branch, run:

```bash
bun run release
git push origin HEAD --follow-tags
```

The release command:

1. runs formatting, linting, type checks, tests, and the package build
2. updates the package version and changelog with `changelogen`
3. creates the release commit and tag

Pushing the tag starts publication. Local release preparation never publishes to npm directly.

## Publication Workflow

The tag workflow:

1. installs from the lockfile and prepares the module and playground
2. runs the complete check and build gates
3. verifies the tag against `package.json`
4. publishes the package with npm provenance
5. creates the corresponding GitHub release

## Secrets

Publishing requires:

- `NPM_TOKEN`

The repository must also allow GitHub Actions to write contents and request an OpenID Connect token. Package provenance is enabled through `publishConfig.provenance`.
