# Shared Runtime Overview

This shared runtime surface lets you express primitive values per breakpoint and resolve them from the current `nuxt-viewport` breakpoint.

It also exports `defineRemoteOptions(...)` for a query-backed option loader that can be reused by
dashboard filters, table filters, and form fields. See [Reusable Remote Options](remote-options.md)
for a full example; inline remote sources remain available in every domain.

Current main APIs:

- `defineRemoteOptions(...)`
- `parseResponsiveValue(...)`
- `resolveResponsiveValueAtBreakpoint(...)`
- `getResponsiveValue(...)`
- `useResponsiveValue(...)`

Use this surface when a value such as a column count, grid span, boolean flag, or CSS snippet should follow the active viewport without duplicating `if ($viewport...)` logic everywhere.

Responsive strings use a Tailwind-like pattern:

```txt
1 md:2 xl:4
```

That means:

- `sm` uses `1`
- `md` uses `2`
- `lg` falls back to `2`
- `xl` uses `4`
