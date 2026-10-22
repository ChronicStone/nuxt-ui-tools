# Theming display blocks

## Tones

A tone is a color role: `primary`, `secondary`, `success`, `info`, `warning`, `error`, `neutral`.
Each one reads five CSS variables, so a tone is restyled in CSS without touching the blocks:

| Variable                        | Used for                                  |
| ------------------------------- | ----------------------------------------- |
| `--nut-display-<tone>`          | solid fills: bars, dots, the current step |
| `--nut-display-<tone>-ink`      | text and icons on the page                |
| `--nut-display-<tone>-soft`     | tinted backgrounds                        |
| `--nut-display-<tone>-line`     | borders                                   |
| `--nut-display-<tone>-contrast` | text on the solid fill                    |

They default to the Nuxt UI colors, with the soft and line colors mixed into the page background,
so dark mode follows on its own. Badges of built-in tones are `UBadge` with that `color`, so your
badge theme applies to them.

### Restyling and registering tones

Set colors in `appConfig.nuxtUiTools.display.tones`. A built-in tone takes only the colors it
changes; a new tone needs `color`, and gets its ink, soft, line and contrast colors from it unless
you set them. `dark` holds the colors used in dark mode.

```ts
// app.config.ts
export default defineAppConfig({
  nuxtUiTools: {
    display: {
      tones: {
        primary: { ink: '#b85e00', dark: { ink: '#ffb558' } },
        violet: {
          color: 'var(--color-violet-500)',
          ink: 'var(--color-violet-700)',
          dark: { ink: 'var(--color-violet-300)' },
        },
        teal: { color: 'var(--color-teal-500)' },
      },
    },
  },
})
```

Then register the new names so `tone: 'violet'` type-checks on chips, records, headings, facts and
every other `tone`:

```ts
// types/display-tones.d.ts
declare module '#ui-tools/display' {
  interface DisplayToneRegistry {
    violet: true
    teal: true
  }
}

export {}
```

A registered tone renders through the same five variables; its badges are neutral `UBadge`s
recolored with them, in the requested `variant`.

## Slot classes

Every block has named slots. Override them app-wide in `appConfig.nuxtUiTools.display.ui.<kind>`,
or on one block with its `ui` prop. Later layers win, merged with tailwind-merge.

```ts
nuxtUiTools: {
  display: {
    ui: {
      facts: { label: 'text-[13px] text-muted', value: 'font-semibold' },
      alert: { root: 'rounded-[9px]' },
      heading: { title: 'tracking-tight' },
    },
  },
}
```

Slots per kind are the `Display<Kind>Slot` types, for example `DisplayFactsSlot`:
`root`, `group`, `groupHeader`, `groupTitle`, `groupAside`, `item`, `label`, `hint`, `value`,
`empty`, `actions`.

## Presets

Presets are named default props per kind, picked with `preset`:

```ts
nuxtUiTools: {
  display: {
    presets: {
      text: { legal: { appearance: 'legal', icon: 'i-lucide-shield' } },
      record: { dossier: { variant: 'row', surface: 'muted' } },
    },
  },
}
```

## Other variables

| Variable                                                                                     | Default                      |
| -------------------------------------------------------------------------------------------- | ---------------------------- |
| `--nut-display-radius`                                                                       | `calc(var(--ui-radius) * 2)` |
| `--nut-display-track`                                                                        | empty part of bars and rings |
| `--nut-display-code-bg`, `-ink`, `-muted`, `-line`, `-key`, `-string`, `-number`, `-literal` | code blocks                  |

Charts use the dashboard palette (`--nut-dash-s1…s6`, `--nut-dash-muted`, `--nut-dash-grid`).
Skeletons use the dashboard ghost and shimmer.

## Icons and words

Icons come from `appConfig.ui.icons` (`info`, `success`, `warning`, `error`, `copy`, `copyCheck`,
`eye`, `eyeOff`, `chevronDown`, `external`, …). Words such as « Show more · {count} »,
« Copied », « Today » or « This content could not be loaded. » are the `display` messages of the
ui-tools locale, overridable like any other ui-tools message.
