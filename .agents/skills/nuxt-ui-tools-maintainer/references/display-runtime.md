# Display Runtime

`src/runtime/display` draws read-only content blocks. The form `info` field and the public
`UiDisplay` component both render through it.

## Layout

```txt
src/runtime/display/
  types/shared.ts        tones (DisplayBuiltinTone, the augmentable DisplayToneRegistry), content, actions, chips, DisplayUrl
  types/blocks/<kind>.ts props and slot names of one kind
  types/registry.ts      DisplayPropsMap (kind → props), DisplayKind, DisplaySpec, DisplayUiMap
  types/config.ts        appConfig.nuxtUiTools.display: presets, tones, ui
  components/display.vue the dispatcher (UiDisplay): applies the preset, renders DISPLAY_BLOCKS[display]
  components/blocks/     one component per kind
  components/parts/      render, chip, actions, copy, skeleton, more, empty line, load error, fact value, record media
  composables/           app config and slot classes, icons, locale, number format, reveal, file preview, lazy URLs
  utils/                 classes, content, dates, meter, json tokens, tone classes, tone CSS, URLs, presets, registry
  plugins/display-tones  injects the CSS of tones set in appConfig.nuxtUiTools.display.tones
```

## Rules

- A kind is one entry of `DisplayPropsMap`, one `types/blocks/<kind>.ts`, one component, one entry of
  `DISPLAY_BLOCKS` and `DISPLAY_SKELETON_LAYOUTS`, plus its tests, playground examples and consumer
  docs (`skills/consumer/display/references/kinds.md`). Variants are props of that kind, not new kinds.
- Every rendered element takes a slot class: each component builds its defaults per slot and merges
  them with `resolveDisplayClasses(defaults, appUi, ui)`. Combine conditional classes with
  `twMerge`, never by concatenating two color utilities.
- Colors go through tones only. A toned element carries `displayToneClass(tone)` and its parts read
  `--nut-tone`, `--nut-tone-ink`, `--nut-tone-soft`, `--nut-tone-line`, `--nut-tone-contrast`. Built-in
  tone classes live in `shared/styles/tokens.css`; registered ones come from `buildDisplayToneCss`.
  Chips keep `UBadge` with a Nuxt UI `color` for built-in tones and switch to tone variables for
  registered ones (`isBuiltinTone`).
- Collections fold with `useDisplayReveal`; loading draws `DisplaySkeleton`; empty draws
  `DisplayEmptyLine`; words come from the `display` messages of the ui-tools locale.
- File links (`DisplayUrl`) may be functions. Previews pass them to the file preview as lazy
  sources; open and download go through `useDisplayUrlActions` and `utils/urls.ts`, which open the
  tab during the click so popup blockers allow it.
- Display props are opaque payloads: hold them in `shallowRef`, never `ref`, or Vue's deep unwrap
  types recurse through VNode types.

## Form integration

`form/fields/info` owns the field: `types.ts` (notice field | display field, typed per kind with
`FormInfoDisplaySource`), `use-info-display.ts` (static, callback, promise with a run counter, or
query options through `useQuery`, plus retry), and `component.vue` (label shell through
`FormFieldShell` when the field has a label or supporting copy; skeleton, load error, block).
`api.form.close()` reaches the root's cancel through `runtime.bindCancel`.
