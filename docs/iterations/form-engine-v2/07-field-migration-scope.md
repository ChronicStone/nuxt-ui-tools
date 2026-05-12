# Field Migration Scope

This note prioritizes the field kinds for the V1 form runtime with `exassess-app-cloudflare` as the target rebuild/migration app.

Secondary references such as `tars-profile-frontend` are still useful to avoid painting the engine into a corner, but they should not drive V1 scope when they conflict with Exassess needs.

Inputs reviewed:

- legacy `tars-shared-ui` form engine field registry
- Exassess schemas using the older `buildFormSchema`
- Tars Profile schemas using `defineFormSchema`
- Nuxt UI v4 component surface through the Nuxt UI MCP

## Exassess Usage Snapshot

Approximate field-kind usage from exact `type: '...'` matches in `exassess-app-cloudflare/app`.

These counts include helper-generated definitions and form-adjacent usage, so they are prioritization signals rather than a perfect schema AST count.

High-use:

- `select`: 89
- `text`: 76
- `checkbox`: 24
- `info`: 14
- `number`: 13
- `upload`: 12
- `divider`: 12
- `array-list`: 8
- `date`: 7
- `radio`: 5
- `password`: 5

Lower-use but real:

- `custom-component`: 4
- `group`: 3
- `array-tabs`: 3
- `textarea`: 2
- `slider`: 2
- `object`: 2
- `file`: 1
- `array-variant`: 1
- `tag`: 1

The Exassess V1 pressure is therefore mostly:

- CRUD/business scalar fields
- option fields with async sources
- upload/file handling
- simple structural fields
- arrays

## Nuxt UI Mapping

Nuxt UI gives enough primitives to cover Exassess V1 without recreating every Naive UI field wrapper one-to-one.

Direct mappings:

- `text`, `password`: `UInput`
- `textarea`: `UTextarea`
- `number`: `UInputNumber`
- `checkbox`: `UCheckbox`
- `radio`: `URadioGroup`
- `select`: `USelect` or `USelectMenu`
- `date`: `UInputDate`, with `UCalendar` available for richer flows
- `file`: `UFileUpload`
- `divider`: `USeparator`
- `button`: `UButton`
- `input-group`: `UFieldGroup`
- field chrome and validation display: `UFormField`

Composition mappings:

- `info`: custom renderer around `UAlert` or raw slots, depending on whether it is a callout, title row, or arbitrary render content.
- `object`: runtime-owned child renderer with layout variants, optionally using `UCard`.
- `array-list`: runtime-owned array item renderer using `UButton`, `UCard`, `UAccordion`, or plain layout depending on variant.
- `array-tabs`: runtime-owned array renderer using `UTabs`.
- `array-variant`: compatibility array variant renderer, after the simpler array fields are stable.
- `tag`: likely maps to `UInputTags`, but current Exassess usage is weak enough to keep it late.

## File And Upload Direction

Exassess uses legacy `upload` heavily. The legacy field does more than choose a local file:

- owns an async `uploadHandler`
- can output a final URL
- supports delete/preview/download hooks
- supports upload progress
- often depends on other field values to build remote file names

For the new engine, keep `file` and `upload` as separate field kinds:

- `file` means local file selection. It writes local file values and is best when files are uploaded by the submit lifecycle.
- `upload` means remote upload is part of the field runtime. It owns progress, upload errors, delete/preview/download hooks, and final URL/object output.

Example `file` direction:

```ts
{
  key: 'attachment',
  type: 'file',
  label: 'Attachment',
  accept: 'application/pdf',
}
```

Example `upload` direction:

```ts
{
  key: 'kbisUrl',
  type: 'upload',
  label: 'KBIS',
  accept: 'application/pdf',
  output: 'url',
  handler: ({ file, deps, api }) => uploadAccountDocument(file, deps),
  onDelete: ({ value }) => deleteAccountDocument(value),
}
```

UX tradeoff:

- `upload` is best when the form needs immediate progress, immediate preview, a URL value before submit, or replacement/delete behavior before saving.
- `file` is best when the form should be atomic and avoid orphan remote files if the user abandons the form.

For Exassess V1, implement both field kinds but prioritize `upload` compatibility because the current schemas already work that way.

The submit runtime must know about pending uploads either way:

- block submit while required upload work is pending
- expose per-file progress and errors
- make failed uploads normal field errors
- give field APIs namespaced upload actions, such as `api.upload.start()`, `api.upload.cancel()`, `api.upload.retry()`, and `api.upload.remove()`

## Proposed Exassess V1 Field Scope

### Foundation Slice

These fields validate the architecture and unblock realistic Exassess schema examples:

- `text`
- `select`
- `checkbox`
- `number`
- `hidden`
- `info`
- `divider`
- `input-group` with legacy `group` alias
- `object`
- `custom-component`

This is the first vertical slice alongside schema/context/options typing, field-kind config, field registry, Regle shell, renderer, field context, playground, and tests.

### Core Exassess V1

These should be part of the first usable Exassess migration target:

- `text`
- `password`
- `textarea`
- `number`
- `checkbox`
- `radio`
- `select`
- `date`
- `hidden`
- `info`
- `divider`
- `input-group`
- `object`
- `custom-component`
- `file`
- `upload`

Reasoning:

- this covers the dominant Exassess fields
- it supports async options and current remote upload behavior
- it avoids spending early time on Tars-only fields such as `phone-number`, `card`, `tree-select`, `one-time-code`, and `checkbox-group`

### Exassess Container Completion

These should follow once scalar fields and file/upload are stable:

- `array-list`
- `array-tabs`
- `array-variant`

`array-list` comes first because it is the general-purpose repeated-data primitive and appears meaningfully in Exassess.

`array-tabs` follows because it has direct `UTabs` support.

`array-variant` remains in scope for compatibility, but it should not shape the first renderer abstractions.

### Late Exassess V1 / Nice To Have

These have low Exassess usage or are form-adjacent:

- `slider`
- `tag`
- `button`

They have direct Nuxt UI mappings and can be added cheaply after the main model is stable.

## Deferred For Exassess

These should not be part of Exassess V1 unless a current screen proves otherwise:

- `card`
- `column`
- `switch`
- `checkbox-group`
- `radio-card`
- `auto-complete`
- `tree-select`
- `phone-number`
- `one-time-code`
- `switch-group`
- `checkbox-card`
- `datetime`
- `daterange`
- `monthrange`
- `datetimerange`
- `month`
- `year`
- `time`
- `rating`
- `cascader`
- `color-picker`
- `tree`

Many are still good future fields, especially for Tars-like apps, but they do not need to drive this migration pass.

## Compatibility Naming

Use clearer canonical names in new code while preserving migration aliases where Exassess depends on old names.

Recommended direction:

- canonical `input-group`, legacy alias `group`
- canonical `file` for local file selection
- canonical `upload` for field-owned remote upload lifecycle
- canonical `divider`, backed by `USeparator`
- canonical `info`, backed by a renderer that can handle raw content, alert-like callouts, and title rows

The alias layer must still be type-aware. It should normalize old shapes into strict new field definitions, not become a loophole where every field accepts every old property.

## Implementation Order

1. Field-kind registry and shared scalar contracts.
2. Renderer shell with `UFormField`, field context, and layout ownership.
3. Foundation slice fields: `text`, `select`, `checkbox`, `number`, `hidden`, `info`, `divider`, `input-group`, `object`, `custom-component`.
4. Complete core scalar fields: `password`, `textarea`, `radio`, `date`.
5. Option runtime hardening: query-based options, inferred loading, option create/refresh, search/filter hooks.
6. File lifecycle: local `file`, then remote `upload` with immediate-upload compatibility.
7. Arrays: `array-list`, then `array-tabs`, then `array-variant`.
8. Late simple fields if still needed: `slider`, `tag`, `button`.

## Remaining Product Questions

1. Which Exassess screens should use atomic `file` plus submit upload, and which should keep immediate `upload` behavior?
2. Does Exassess need preview/delete/download parity for every legacy upload field, or only delete plus progress for V1?
3. Should `fieldParams` be accepted as a pure migration alias for `props`/`ui`/`upload`, or should we require touching those schemas during migration?
