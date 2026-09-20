# Releasing

This repository now publishes a single Nuxt module package: `nuxt-ui-tools`.

## Prepare A Release

Verify the release candidate from a clean checkout:

```bash
bun install --frozen-lockfile
bun run dev:prepare
bun run check
bun run build
npm pack --dry-run
```

Prepare the version and changelog with `changelogen`, then push the release commit through review:

```bash
bun run release
git push origin HEAD --follow-tags
```

The release command:

1. runs formatting, linting, type checks, tests, and the package build
2. updates the package version and changelog with `changelogen`
3. creates the release commit and tag

Pushing the tag starts publication. Local release preparation never publishes to npm directly. The tag must exactly match the version in `package.json`; the workflow rejects mismatches before publishing.

## Publication Workflow

The tag workflow:

1. installs from the lockfile and prepares the module and playground
2. runs the complete check and build gates
3. verifies the tag against `package.json`
4. publishes the package through the npm trusted-publisher connection, with provenance
5. creates the corresponding GitHub release

## Trusted Publishing

The npm package trusts this repository's `.github/workflows/release.yml` workflow through OpenID Connect. The workflow needs `id-token: write`, runs on a GitHub-hosted runner, and must not provide `NODE_AUTH_TOKEN` for the publish step.

Package provenance is enabled through trusted publishing and `publishConfig.provenance`. If the trusted-publisher repository or workflow name changes, update the npm package settings before tagging a release.
