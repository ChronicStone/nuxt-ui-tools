# Changelog

## v0.1.3

[compare changes](https://github.com/ChronicStone/nuxt-ui-tools/compare/v0.1.2...v0.1.3)

### 🩹 Fixes

- **table:** Treat filter defaults as baseline ([f1f518b](https://github.com/ChronicStone/nuxt-ui-tools/commit/f1f518b))

### ❤️ Contributors

- THAO-Cyprien

## v0.1.2

[compare changes](https://github.com/ChronicStone/nuxt-ui-tools/compare/v0.1.1...v0.1.2)

### 🩹 Fixes

- **table:** Keep renderer states exclusive ([0ae58a5](https://github.com/ChronicStone/nuxt-ui-tools/commit/0ae58a5))

### ❤️ Contributors

- THAO-Cyprien

## v0.1.1

[compare changes](https://github.com/ChronicStone/nuxt-ui-tools/compare/v0.1.0...v0.1.1)

### 🚀 Enhancements

- **table:** Expose composable data list styling ([eb08d53](https://github.com/ChronicStone/nuxt-ui-tools/commit/eb08d53))
- **table:** Polish data list filters and runtime integration ([4674867](https://github.com/ChronicStone/nuxt-ui-tools/commit/4674867))

### 🩹 Fixes

- **form:** Polish field behavior and semantics ([c49ca2d](https://github.com/ChronicStone/nuxt-ui-tools/commit/c49ca2d))

### ❤️ Contributors

- THAO-Cyprien

## v0.1.0

This is the first public release of `nuxt-ui-tools`.

### Features

- Add a schema-driven table runtime with local and remote data, typed query state, filters, facets, selection, pagination, grid rendering, and row actions.
- Add a schema-driven form runtime with typed state and output inference, validation, layouts, provider overlays, actions, dynamic options, repeatable fields, hierarchy selection, matrix inputs, and polished Nuxt UI field components.
- Add typed runtime translations, responsive breakpoint helpers, typed URL state, curated Nuxt auto-imports and components, consumer skills, and an integration playground.
- Publish explicit `form`, `i18n`, `query-state`, `shared`, and `table` runtime entrypoints while keeping the spreadsheet import engine internal.

### Fixes

- Keep pure table utilities isolated from Nuxt runtime entrypoints so the full test suite can run without loading application-only modules.
