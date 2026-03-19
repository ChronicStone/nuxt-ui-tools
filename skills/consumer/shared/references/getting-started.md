# Shared Responsive Getting Started

## Install Surface

After you install the `nuxt-ui-tools` module, it installs and configures `nuxt-viewport` with Tailwind-style breakpoints by default:

- `sm: 640`
- `md: 768`
- `lg: 1024`
- `xl: 1280`
- `2xl: 1536`

You can still override the global `viewport` config in your `nuxt.config.ts`.

## Reactive Value

```ts
import { useResponsiveValue } from '#ui-tools/shared'

const tableColumns = useResponsiveValue('1 md:2 xl:4', 'integer')
const showFiltersSidebar = useResponsiveValue('false lg:true', 'boolean')
```

Result:

- `tableColumns.value` follows the current viewport breakpoint
- `showFiltersSidebar.value` changes automatically when the viewport changes

## Non-Reactive Current Value

```ts
import { getResponsiveValue } from '#ui-tools/shared'

const cardSpan = getResponsiveValue('12 md:6 xl:4', 'integer')
```

Use this when you only need the current breakpoint value in the active setup context.

## Pure Value Resolution

```ts
import { resolveResponsiveValueAtBreakpoint } from '#ui-tools/shared'

const previewColumns = resolveResponsiveValueAtBreakpoint(
  '1 md:2 xl:4',
  {
    breakpoint: 'lg',
    breakpointKeys: ['sm', 'md', 'lg', 'xl'],
  },
  'integer',
)
```

Result:

```ts
previewColumns // 2
```

This is useful for tests, schema helpers, previews, or any code that should not depend on a live Nuxt app instance.

## Built-In Transforms

Supported transform keys:

- `'string'`
- `'boolean'`
- `'integer'`
- `'float'`
- `'grid-cols'`
- `'grid-rows'`
- `'col'`
- `'row'`
- `'maxWidth'`
- `'maxHeight'`

Example:

```ts
const layoutStyle = useResponsiveValue('1 md:2 xl:4', 'grid-cols')
```

At `md`, the resolved value is:

```txt
grid-template-columns: repeat(2, minmax(0, 1fr))
```

## Breakpoint Fallback Rules

Given:

```txt
lg:3
```

Results:

- `sm` resolves to `null`
- `md` resolves to `null`
- `lg` resolves to `3`
- any larger breakpoint falls back to `3` until another explicit value appears

## Table And Form Examples

```ts
const filterPanelColumns = useResponsiveValue('1 lg:2', 'integer')
const formGridTemplate = useResponsiveValue('1 md:2 xl:3', 'grid-cols')
const showDenseToolbar = useResponsiveValue('true xl:false', 'boolean')
```

These patterns work well when table and form primitives should share one consistent responsive encoding.
