const FILE_SIZE_UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte'] as const

export function fileIconName(type: string | null | undefined) {
  const mime = type ?? ''
  if (mime === 'application/pdf') return 'i-lucide-file-text'
  if (mime.startsWith('image/')) return 'i-lucide-file-image'
  if (mime.startsWith('video/')) return 'i-lucide-file-video'
  if (mime.startsWith('audio/')) return 'i-lucide-file-audio'
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime === 'text/csv')
    return 'i-lucide-file-spreadsheet'
  if (mime.includes('word') || mime.includes('document')) return 'i-lucide-file-type'
  if (mime.includes('zip') || mime.includes('compressed')) return 'i-lucide-file-archive'
  return 'i-lucide-file'
}

/** Lowercase extension of a file name without the dot, or `null` when it has none. */
export function fileExtension(name: string) {
  const dot = name.lastIndexOf('.')
  if (dot === -1 || dot === name.length - 1) return null
  return name.slice(dot + 1).toLowerCase()
}

export function fileExtensionLabel(file: { name: string; type?: string | null }) {
  const dot = file.name.lastIndexOf('.')
  if (dot !== -1) return file.name.slice(dot + 1).toUpperCase()
  const subtype = file.type?.split('/')[1]?.split(/[+.;-]/)[0]
  return subtype ? subtype.toUpperCase() : '—'
}

/** Formats bytes with the locale's units: "2 kB" in English, "2 ko" in French. */
export function formatFileSize(bytes: number, locale: string) {
  let size = bytes
  let unit = 0
  while (size >= 1024 && unit < FILE_SIZE_UNITS.length - 1) {
    size /= 1024
    unit += 1
  }
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: unit > 0 && size < 10 ? 1 : 0,
    style: 'unit',
    unit: FILE_SIZE_UNITS[unit],
    unitDisplay: 'short',
  }).format(size)
}

export function fileNameFromUrl(url: string) {
  const parts = (url.split(/[?#]/)[0] ?? '').split('/').filter((part) => part.length > 0)
  const segment = parts.at(-1) ?? url
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

export function isImageType(type: string | null | undefined) {
  return Boolean(type?.startsWith('image/'))
}
