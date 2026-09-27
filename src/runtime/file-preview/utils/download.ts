import { isString } from '../../shared/utils/predicate'
import type { FilePreviewItem, FilePreviewSource } from '../types'

async function sourceHref(src: FilePreviewSource) {
  const value = isString(src) || src instanceof Blob ? src : await src()
  if (isString(value)) return { href: value, revoke: false }
  return { href: URL.createObjectURL(value), revoke: true }
}

function click(params: { href: string; download?: string }) {
  const anchor = document.createElement('a')
  anchor.href = params.href
  anchor.rel = 'noopener'
  if (params.download !== undefined) anchor.download = params.download
  if (!params.href.startsWith('blob:') && !params.href.startsWith('data:')) anchor.target = '_blank'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
}

/** Downloads the original file, honoring its `download` option. */
export async function downloadFilePreviewItem(item: FilePreviewItem) {
  const option = item.file.download
  if (option === false) return
  if (option !== true && option !== undefined && !isString(option)) return await option(item.file)

  const { href, revoke } = isString(option)
    ? { href: option, revoke: false }
    : await sourceHref(item.file.src)
  click({ download: item.name, href })
  if (revoke) setTimeout(() => URL.revokeObjectURL(href), 30_000)
}

/**
 * Opens the original file in a new tab. The tab opens right away, while the click still counts as
 * a user gesture, and receives its address once a source function resolves.
 */
export async function openFilePreviewItem(item: FilePreviewItem) {
  const { src } = item.file
  if (isString(src) || src instanceof Blob) {
    const { href, revoke } = await sourceHref(src)
    click({ href })
    if (revoke) setTimeout(() => URL.revokeObjectURL(href), 30_000)
    return
  }
  const tab = window.open('', '_blank')
  try {
    const { href } = await sourceHref(src)
    if (tab) tab.location.href = href
  } catch {
    tab?.close()
  }
}
