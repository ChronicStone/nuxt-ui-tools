import { defineAsyncComponent } from 'vue'
import type { Component } from 'vue'

import type { UiToolsTranslator } from '../../i18n/utils'
import type {
  FilePreviewBuiltInKind,
  FilePreviewKind,
  FilePreviewMatchContext,
  FilePreviewRendererDefinition,
} from '../types'
import { resolveFilePreviewText } from './format'

/**
 * Declares a renderer with its kind inferred as a literal.
 *
 * @example
 * defineFilePreviewRenderer({
 *   kind: 'email',
 *   icon: 'i-lucide-mail',
 *   match: ({ mime, extension }) => mime === 'message/rfc822' || extension === 'eml',
 *   component: () => import('~/components/previews/EmailPreview.vue'),
 *   mode: 'fullscreen md:drawer',
 * })
 */
export function defineFilePreviewRenderer<const TKind extends FilePreviewKind>(
  renderer: FilePreviewRendererDefinition<TKind>,
) {
  return renderer
}

/** Claims files by MIME type (a trailing `/` matches a whole family) or by extension. */
export function matchFilePreview(rule: {
  mimes?: readonly string[]
  extensions?: readonly string[]
}) {
  return (file: FilePreviewMatchContext) => {
    const { mime, extension } = file
    if (
      mime &&
      rule.mimes?.some((entry) => (entry.endsWith('/') ? mime.startsWith(entry) : mime === entry))
    )
      return true
    return Boolean(extension && rule.extensions?.includes(extension))
  }
}

/** Responsive values start at `sm`, so phones and small tablets share the first value. */
const MEDIA_MODE = 'fullscreen md:modal'
const DOCUMENT_MODE = 'fullscreen md:drawer'

/** Renders anything no other renderer claims: a card with the file facts and a download. */
export const fallbackFilePreviewRenderer = defineFilePreviewRenderer({
  compact: true,
  component: () => import('../components/renderers/fallback-renderer.vue'),
  icon: 'i-lucide-file',
  kind: 'other',
  mode: MEDIA_MODE,
})

/** Checked in order, so specific text formats come before the generic text renderer. */
export const builtInFilePreviewRenderers: readonly FilePreviewRendererDefinition[] = [
  defineFilePreviewRenderer({
    component: () => import('../components/renderers/pdf-renderer.vue'),
    icon: 'i-lucide-file-text',
    kind: 'pdf',
    match: matchFilePreview({ extensions: ['pdf'], mimes: ['application/pdf'] }),
    mode: DOCUMENT_MODE,
  }),
  defineFilePreviewRenderer({
    component: () => import('../components/renderers/image-renderer.vue'),
    icon: 'i-lucide-file-image',
    kind: 'image',
    match: matchFilePreview({
      extensions: [
        'apng',
        'avif',
        'bmp',
        'gif',
        'heic',
        'heif',
        'ico',
        'jpeg',
        'jpg',
        'png',
        'svg',
        'webp',
      ],
      mimes: ['image/'],
    }),
    mode: MEDIA_MODE,
  }),
  defineFilePreviewRenderer({
    component: () => import('../components/renderers/video-renderer.vue'),
    icon: 'i-lucide-file-video',
    kind: 'video',
    match: matchFilePreview({
      extensions: ['m4v', 'mov', 'mp4', 'ogv', 'webm'],
      mimes: ['video/'],
    }),
    mode: MEDIA_MODE,
  }),
  defineFilePreviewRenderer({
    compact: true,
    component: () => import('../components/renderers/audio-renderer.vue'),
    icon: 'i-lucide-file-audio',
    kind: 'audio',
    match: matchFilePreview({
      extensions: ['aac', 'flac', 'm4a', 'mp3', 'oga', 'ogg', 'opus', 'wav', 'weba'],
      mimes: ['audio/'],
    }),
    mode: MEDIA_MODE,
  }),
  defineFilePreviewRenderer({
    component: () => import('../components/renderers/csv-renderer.vue'),
    icon: 'i-lucide-file-spreadsheet',
    kind: 'csv',
    match: matchFilePreview({
      extensions: ['csv', 'tsv'],
      mimes: ['text/csv', 'text/tab-separated-values'],
    }),
    mode: DOCUMENT_MODE,
  }),
  defineFilePreviewRenderer({
    component: () => import('../components/renderers/markdown-renderer.vue'),
    icon: 'i-lucide-file-text',
    kind: 'markdown',
    match: matchFilePreview({
      extensions: ['markdown', 'md', 'mdx'],
      mimes: ['text/markdown', 'text/x-markdown'],
    }),
    mode: DOCUMENT_MODE,
  }),
  defineFilePreviewRenderer({
    component: () => import('../components/renderers/text-renderer.vue'),
    icon: 'i-lucide-file-code',
    kind: 'text',
    match: matchFilePreview({
      extensions: [
        'c',
        'cjs',
        'conf',
        'cpp',
        'cs',
        'css',
        'env',
        'go',
        'graphql',
        'h',
        'htm',
        'html',
        'ini',
        'java',
        'js',
        'json',
        'jsonc',
        'jsx',
        'kt',
        'log',
        'mjs',
        'php',
        'py',
        'rb',
        'rs',
        'scss',
        'sh',
        'sql',
        'srt',
        'swift',
        'toml',
        'ts',
        'tsx',
        'txt',
        'vtt',
        'vue',
        'xml',
        'yaml',
        'yml',
      ],
      mimes: [
        'text/',
        'application/json',
        'application/ld+json',
        'application/xml',
        'application/javascript',
        'application/x-yaml',
        'application/yaml',
        'application/sql',
      ],
    }),
    mode: DOCUMENT_MODE,
  }),
  defineFilePreviewRenderer({
    compact: true,
    component: () => import('../components/renderers/fallback-renderer.vue'),
    icon: 'i-lucide-file-type',
    kind: 'office',
    match: matchFilePreview({
      extensions: [
        'doc',
        'docx',
        'key',
        'numbers',
        'odp',
        'ods',
        'odt',
        'pages',
        'ppt',
        'pptx',
        'rtf',
        'xls',
        'xlsx',
      ],
      mimes: [
        'application/msword',
        'application/rtf',
        'application/vnd.ms-excel',
        'application/vnd.ms-powerpoint',
        'application/vnd.oasis.opendocument.presentation',
        'application/vnd.oasis.opendocument.spreadsheet',
        'application/vnd.oasis.opendocument.text',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
    }),
    mode: MEDIA_MODE,
  }),
  defineFilePreviewRenderer({
    compact: true,
    component: () => import('../components/renderers/fallback-renderer.vue'),
    icon: 'i-lucide-file-archive',
    kind: 'archive',
    match: matchFilePreview({
      extensions: ['7z', 'bz2', 'gz', 'rar', 'tar', 'tgz', 'xz', 'zip'],
      mimes: [
        'application/gzip',
        'application/x-7z-compressed',
        'application/x-bzip2',
        'application/x-rar-compressed',
        'application/x-tar',
        'application/zip',
      ],
    }),
    mode: MEDIA_MODE,
  }),
  fallbackFilePreviewRenderer,
]

/** Custom renderers first, then built-in ones that no custom renderer replaced. */
export function mergeFilePreviewRenderers(custom: readonly FilePreviewRendererDefinition[]) {
  const replaced = new Set(custom.map((renderer) => renderer.kind))
  return [
    ...custom,
    ...builtInFilePreviewRenderers.filter((renderer) => !replaced.has(renderer.kind)),
  ]
}

/** Kind of a file: the explicit one, then the first renderer that claims it, then `other`. */
export function detectFilePreviewKind(
  file: FilePreviewMatchContext & { kind?: FilePreviewKind },
  renderers: readonly FilePreviewRendererDefinition[],
): FilePreviewKind {
  if (file.kind) return file.kind
  return renderers.find((renderer) => renderer.match?.(file))?.kind ?? 'other'
}

export function findFilePreviewRenderer(
  kind: FilePreviewKind,
  renderers: readonly FilePreviewRendererDefinition[],
): FilePreviewRendererDefinition {
  return (
    renderers.find((renderer) => renderer.kind === kind) ??
    renderers.find((renderer) => renderer.kind === 'other') ??
    fallbackFilePreviewRenderer
  )
}

const components = new WeakMap<FilePreviewRendererDefinition, Component>()

/** One async component per renderer, so its chunk loads once and is reused. */
export function filePreviewRendererComponent(renderer: FilePreviewRendererDefinition) {
  const known = components.get(renderer)
  if (known) return known
  const component = defineAsyncComponent(renderer.component)
  components.set(renderer, component)
  return component
}

const BUILT_IN_KINDS: ReadonlySet<string> = new Set<FilePreviewBuiltInKind>([
  'archive',
  'audio',
  'csv',
  'image',
  'markdown',
  'office',
  'other',
  'pdf',
  'text',
  'video',
])

/** Kind name shown to users: the renderer's own label, the package translation, or the kind. */
export function filePreviewKindLabel(
  renderer: FilePreviewRendererDefinition,
  t: UiToolsTranslator,
) {
  if (renderer.label) return resolveFilePreviewText(renderer.label)
  return BUILT_IN_KINDS.has(renderer.kind) ? t(`filePreview.kinds.${renderer.kind}`) : renderer.kind
}
