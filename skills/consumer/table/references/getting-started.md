# Table Getting Started

This is the smallest useful setup.

In a Nuxt app, install the module once:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-ui-tools'],
})
```

`nuxt-ui-tools` installs the `@nuxt/ui` module, registers the public table component, and extends Nuxt UI's generated `ui.css` so the package runtime files are scanned by Tailwind too.

Keep the standard Nuxt UI CSS import from the official setup as well:

```css
@import 'tailwindcss';
@import '@nuxt/ui';
```

```ts
const schema = defineTableSchema({
  tableKey: 'employees',
  rowKey: 'id',
  source: {
    mode: 'client',
    query: () => ({
      queryKey: ['employees'],
      queryFn: async () => rows,
    }),
  },
  table: {
    columns: (column) => [
      column.field('fullName', { label: 'Employee' }),
      column.field('email', { label: 'Email' }),
      column.field('salary', { label: 'Salary' }),
    ],
  },
})

const table = useTable(schema)
```

Render it with:

```vue
<DataList :table="table" size="sm" />
```

## What You Get

At this point you already have:

- a rendered table
- typed rows
- schema-defined columns
- built-in table state

Then you can add filters, pagination, sorting, grid mode, and actions through the schema.
