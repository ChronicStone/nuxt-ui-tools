# Shared Responsive Overview

This shared runtime surface lets you express primitive values per breakpoint and resolve them from the current `nuxt-viewport` breakpoint.

Current main APIs:

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
