# File Preview Runtime

`src/runtime/file-preview` owns `$filePreview.open()`: normalizing inputs, choosing a renderer and a
container, resolving sources, and rendering the overlay. Consumer usage lives in
`skills/consumer/file-preview/SKILL.md`.

## Layers

- `types/`: public contracts. `file.ts` (inputs, `FilePreviewItem`), `renderer.ts` (renderer
  definition, renderer props/emits, containers), `api.ts` (options, handle, instance, API),
  `shell.ts` (what the shell provides to renderers).
- `utils/renderers.ts`: the registry. Built-in definitions in match order (specific text formats
  before `text`, `fallbackFilePreviewRenderer` last), `defineFilePreviewRenderer`,
  `matchFilePreview`, `mergeFilePreviewRenderers` (custom first, same kind replaces), detection,
  kind labels, and one cached async component per definition.
- `utils/files.ts`: normalizes each input once at `open()` into a `FilePreviewItem` with its kind.
  Renditions are normalized recursively.
- `utils/instance.ts`: state of one open preview (files, index, open flag, handle, dispose).
- `utils/container.ts`, `csv.ts`, `download.ts`, `format.ts`: pure helpers.
- `composables/use-file-preview-api.ts`: `createFilePreviewApi`, injection key, `useFilePreview`,
  `provideFilePreview`. `attach()` counts mounted providers so `mounted` tells callers (the upload
  field) whether previews will render.
- `composables/use-file-preview-source.ts`: resolves `src`. Function sources are cached per item in
  a module `WeakMap`, so remounting a shell (container change) does not request a signed URL again;
  `retry()` forces a new request. Blobs get object URLs through `useObjectUrl`.
- `composables/use-file-preview-text.ts`: bounded text reads (`FILE_PREVIEW_TEXT_LIMIT`) for text,
  CSV, and Markdown renderers.
- `composables/use-file-preview-shell.ts`: shell context injection, `onFilePreviewKey`, and
  `isFilePreviewControlKey` (keys owned by fields, sliders, menus, and iframes).
- `components/provider/`: `file-preview-provider.vue` (public) renders one
  `file-preview-host.vue` per instance. The host resolves the container once per gallery (largest
  renderer mode, responsive at the current breakpoint), owns `expanded` and the drawer width, and
  disposes the instance after the close animation.
- `components/shell/`: `file-preview-shell.vue` orchestrates header, stage, strip or bottom bar,
  details, keyboard, swipe, and the live region. `file-preview-tools.vue` (public) teleports
  renderer buttons into the header or the phone bottom bar.
- `components/renderers/`: one file per renderer plus shared parts (`media-controls.vue` on
  VueUse `useMediaControls`, `file-preview-code.vue`, `file-preview-text-loading.vue`).

## Rules

- Keep the core light. Renderers load through `defineAsyncComponent`; never import a renderer from
  the shell. Heavy engines (pdf.js, syntax highlighters) stay out of the package and plug in through
  `register()`.
- Detection runs once, at `open()` (and `update()`). Renderers never re-detect.
- The container is chosen once per preview and never changes while navigating. `expanded` changes
  presentation inside the same overlay (fullscreen modal, full-width drawer), so the shell keeps its
  state.
- Responsive values start at the `sm` key, so a first value covers phones: write
  `fullscreen md:modal`, never `fullscreen sm:modal`.
- Do not use `scrollIntoView` inside the overlay: it scrolls `overflow: hidden` ancestors and shifts
  the whole panel. Scroll the strip itself.
- Security: SVG only through `<img>`, HTML shown as text, blobs re-typed as PDF before reaching the
  iframe (no `sandbox`, which Chrome's PDF viewer refuses), markdown HTML comes from the app hook,
  which must sanitize it.
- `FilePreviewButton` forwards attributes to the button, not the tooltip wrapper, so data
  attributes and listeners land on the control.

## Keep in sync

- `src/module.ts` (domain alias, plugin), `src/components.ts` (`FilePreviewProvider`,
  `FilePreviewTools`), `src/imports.ts` (`useFilePreview`, `defineFilePreviewRenderer`),
  `package.json` exports.
- `filePreview` messages in `src/runtime/i18n/types.ts` and both locales.
- `--nut-fp-*` tokens and the few non-utility rules in `src/runtime/shared/styles/tokens.css`.
- Tests: `test/file-preview/*` (unit) and `test/dom/file-preview/*` (provider, renderers, retry,
  renditions), plus the upload gallery case in `test/dom/form/upload.test.ts`.
- Playground: `/file-preview` (samples in `playground/app/lib/file-preview-samples.ts`).
