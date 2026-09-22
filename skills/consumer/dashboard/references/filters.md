# Dashboard Filters And Tabs

The dashboard ships its controls, all built on filter handles (see params.md). Use them at three
levels:

1. the whole bar: `<UiDashboardFilters :dashboard />`
2. one filter where you want it: `<UiDashboardFilter :filter="dashboard.filters.account" />`
3. your own component, bound to a handle: `<USelectMenu v-model="…" v-bind="filter.menu" />`

Presentation comes from the params themselves (`label`, `placeholder`, `format`, `columns`,
`searchable`, `max`, `headless`), so pages rarely configure a control.

## The Filter Bar

```vue
<UiDashboardViewTabs :dashboard />
<UiDashboardFilters :dashboard />
```

`UiDashboardFilters` renders one pill per filter on screen: the root filters, then the current
view's (pass a view handle, `:dashboard="dashboard.consumption"`, to show that view's). It follows
declaration order, skips headless and disabled params (`enabled`), and shows filters without a menu (no options and no
presets: dates, free text, a drill-down day) only while they are set, as a removable pill. "Reset"
appears once a filter differs from its default and restores them all.

The bar is a row that scrolls sideways on narrow screens and wraps from `lg` up; pills open their
menus in a portal, so scrolling never clips them.

Props:

- `only` / `exclude` — filter keys to show (in that order) or hide; typed from the dashboard.
- `reset` — `false` hides the Reset button.
- `ui` — `{ root, reset }` classes.

Slots:

| Slot                       | Props                                  | Replaces                           |
| -------------------------- | -------------------------------------- | ---------------------------------- |
| `#<key>` (e.g. `#account`) | `{ filter }`                           | one filter                         |
| `#filter`                  | `{ filter }`                           | every filter without its own slot  |
| `#item`                    | `{ item, selected, disabled, filter }` | the menu rows of every pill        |
| `#reset`                   | `{ filtered, reset }`                  | the Reset button                   |
| `#leading`, `#trailing`    | —                                      | content before / after the filters |

```vue
<UiDashboardFilters :dashboard :exclude="['compare']">
  <template #account="{ filter }">
    <UiDashboardFilter :filter icon="i-lucide-building-2" />
  </template>
  <template #trailing>
    <UButton label="Export" icon="i-lucide-download" variant="ghost" />
  </template>
</UiDashboardFilters>
```

## One Filter

`UiDashboardFilter :filter` is the pill the bar renders: "Name value ⌄". Once the filter differs
from its default it turns accent and shows a clear button (`clearable`, default `true`) that
restores the default. Its menu is dense (28px rows, 13px text):

- single filters: a check mark on the current value; picking closes the menu; an optional filter
  (no default) starts with a row for its placeholder ("All accounts") that clears it
- multiple filters: checkboxes, values kept in item order, "Clear selection" at the bottom; items
  disable once `max` is reached
- `columns` lays items out in a grid; `searchable` adds a search field
- remote lists search on the server and load the next page ahead of the scroll; labels of selected
  ids resolve on their own; a failed page offers a retry
- items show their `icon` or `avatar` (initials or an image) and a trailing `hint`; arrow keys, Home,
  and End move between rows
- presets (see params.md) follow the options under a "Presets" heading; picking one sets the value
  and closes the menu

`variant="button"` renders a small button instead of a pill (a card-header "+ Add"), with the
filter name as the menu title:

```vue
<UiDashboardFilter
  :filter="consumption.usage.filters.tracked"
  variant="button"
  icon="i-lucide-plus"
  label="Add a product"
>
  <template #footer>
    <UButton label="Top 3" variant="ghost" block @click="consumption.usage.params.tracked = topThree" />
  </template>
</UiDashboardFilter>
```

Props: `filter`, `variant` (`'pill' | 'button'`), `label` (pill name / button text; defaults to the
filter label), `icon`, `clearable`, `align` (`'start' | 'center' | 'end'`), `list` (`'all'` by
default, `'options'`, or `'presets'`: what the menu lists), `ui`.

Two buttons on one handle, "+ Add" and "Presets":

```vue
<UiDashboardFilter
  :filter="tracked"
  variant="button"
  icon="i-lucide-plus"
  label="Add"
  list="options"
/>
<UiDashboardFilter
  :filter="tracked"
  variant="button"
  icon="i-lucide-layers"
  label="Presets"
  list="presets"
/>
```

Slots: `#trigger` `{ filter, active, display }` (the whole trigger; the menu still opens from it),
`#label` `{ filter, display }` (name and value inside the pill), `#item`, `#header`, `#footer`
(`{ filter }`), `#empty`.

`ui` parts: `root`, `trigger`, `label`, `value`, `chevron`, `clear`, `button`, `content`, `title`,
`search`, `list`, `item`, `check`, `tick`, `avatar`, `hint`, `separator`, `note`. The pill root
carries `data-active` while the filter differs from its default.

## Your Own Control

A handle binds to any component:

```vue
<USelectMenu
  v-model="dashboard.filters.account.value"
  v-bind="dashboard.filters.account.menu"
  :placeholder="dashboard.filters.account.placeholder"
/>

<UCheckbox
  v-for="item in dashboard.filters.months.items"
  :key="item.value"
  :model-value="dashboard.filters.months.isSelected(item.value)"
  :label="item.label"
  @update:model-value="dashboard.filters.months.toggle(item.value)"
/>
```

`menu` carries `items`, `valueKey`, `labelKey`, `multiple`, and for remote lists `searchTerm`,
`ignoreFilter`, `loading`, and the `onUpdate:searchTerm` / `onUpdate:open` listeners.

## View Tabs

`UiDashboardViewTabs :dashboard` renders the views as underlined tabs bound to
`dashboard.view.current` (URL key `view`, pushed to history). The strip scrolls sideways when the
tabs overflow and keeps the current one in view. Slot `#tab` `{ item, active }`; `ui` parts `root`
and `tab` (the current tab carries `data-active`).

## Theming

Pills use Nuxt UI tokens plus three dashboard tokens for the active state; set them in your CSS:

```css
:root {
  --nut-dash-filter-active: #fff6e8; /* tint of an active pill */
  --nut-dash-filter-active-line: #f5c98a; /* its border */
  --nut-dash-filter-ink: #b85e00; /* its value, clear button, and menu check marks */
  --nut-dash-row-hover: #faf7f2; /* menu row hover */
}
```

`--nut-dash-filter-ink` follows `--nut-dl-accent-ink` when the app sets it for data lists. App-wide
class overrides go in `app.config.ts` under `nuxtUiTools.dashboard.filter`, `.filters`, and
`.viewTabs`.
