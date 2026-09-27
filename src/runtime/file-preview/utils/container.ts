import type { FilePreviewContainer } from '../types'

const CONTAINER_RANK = { drawer: 1, fullscreen: 2, modal: 0 } as const

export function normalizeFilePreviewContainer(
  value: string | number | boolean | null | undefined,
): FilePreviewContainer {
  return value === 'drawer' || value === 'fullscreen' ? value : 'modal'
}

/** The container a gallery keeps while navigating: the largest one any of its files needs. */
export function largestFilePreviewContainer(containers: readonly FilePreviewContainer[]) {
  return containers.reduce<FilePreviewContainer>(
    (largest, container) =>
      CONTAINER_RANK[container] > CONTAINER_RANK[largest] ? container : largest,
    'modal',
  )
}
