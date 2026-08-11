# Changelog

## v0.1.0

This is the first public release of `nuxt-ui-tools`.

### Features

- Add a schema-driven table runtime with local and remote data, typed query state, filters, facets, selection, pagination, grid rendering, and row actions.
- Add a typed spreadsheet import runtime with validation, relation resolution, modifiers, and multi-value parsing.
- Add a schema-driven form runtime with typed state and output inference, validation, layouts, provider overlays, actions, dynamic options, repeatable fields, and Nuxt UI field components.
- Add typed runtime translations, curated Nuxt auto-imports and components, consumer skills, and an integration playground.

### Fixes

- Keep pure table utilities isolated from Nuxt runtime entrypoints so the full test suite can run without loading application-only modules.
