import { describe, expect, it, vi } from 'vitest'

import { createFilePreviewApi, defineFilePreviewRenderer } from '#ui-tools/file-preview'
import { largestFilePreviewContainer } from '#ui-tools/file-preview/utils/container'
import {
  formatFilePreviewDuration,
  splitFilePreviewName,
  tintFilePreviewJsonLine,
} from '#ui-tools/file-preview/utils/format'

const files = ['/a.png', '/b.pdf', '/c.mp4']

describe('file preview API', () => {
  it('opens a gallery at an index and navigates within its bounds', () => {
    const api = createFilePreviewApi()
    const onChange = vi.fn()
    const preview = api.open(files, { index: 1, onChange })

    expect(api.isOpen(preview.id)).toBe(true)
    expect(preview.index.value).toBe(1)

    preview.next()
    preview.next()
    expect(preview.index.value).toBe(2)
    preview.goTo(-4)
    expect(preview.index.value).toBe(0)
    expect(onChange).toHaveBeenLastCalledWith({ src: '/a.png' }, 0)
  })

  it('wraps around when looping', () => {
    const api = createFilePreviewApi()
    const preview = api.open(files, { loop: true })

    preview.previous()
    expect(preview.index.value).toBe(2)
    preview.next()
    expect(preview.index.value).toBe(0)
  })

  it('reuses a preview opened again with the same id', () => {
    const api = createFilePreviewApi()
    const first = api.open(files, { id: 'contract-files' })
    const second = api.open(['/d.docx'], { id: 'contract-files' })

    expect(second).toBe(first)
    expect(api.instances.value).toHaveLength(1)
    expect(api.instances.value[0]?.files.value.map((item) => item.name)).toStrictEqual(['d.docx'])
    expect(first.index.value).toBe(0)
  })

  it('closes, then settles once the provider disposes the preview', async () => {
    const api = createFilePreviewApi()
    const onClose = vi.fn()
    const preview = api.open('/a.png', { onClose })
    const instance = api.instances.value[0]

    expect(api.close()).toBe(true)
    expect(instance?.open.value).toBe(false)
    instance?.dispose()
    await preview.closed

    expect(api.isOpen()).toBe(false)
    expect(onClose).toHaveBeenCalledOnce()
    expect(api.close()).toBe(false)
  })

  it('tracks mounted providers and removes registered renderers', () => {
    const api = createFilePreviewApi()
    const detach = api.attach()
    const unregister = api.register(
      defineFilePreviewRenderer({
        component: async () => ({ render: () => null }),
        icon: 'i-lucide-mail',
        kind: 'email',
        match: ({ extension }) => extension === 'eml',
      }),
    )

    expect(api.mounted.value).toBe(true)
    expect(api.renderers.value[0]?.kind).toBe('email')

    unregister()
    detach()
    detach()
    expect(api.mounted.value).toBe(false)
    expect(api.renderers.value.some((renderer) => renderer.kind === 'email')).toBe(false)
  })
})

describe('file preview helpers', () => {
  it('keeps the largest container a gallery needs', () => {
    expect(largestFilePreviewContainer(['modal', 'drawer', 'modal'])).toBe('drawer')
    expect(largestFilePreviewContainer(['drawer', 'fullscreen'])).toBe('fullscreen')
    expect(largestFilePreviewContainer([])).toBe('modal')
  })

  it('formats media time and splits names so the extension stays visible', () => {
    expect(formatFilePreviewDuration(94)).toBe('1:34')
    expect(formatFilePreviewDuration(3725)).toBe('1:02:05')
    expect(formatFilePreviewDuration(Number.NaN)).toBe('0:00')
    expect(splitFilePreviewName('Contrat-cadre-CLV-2026-02.pdf')).toStrictEqual({
      head: 'Contrat-cadre-CLV-2',
      tail: '026-02.pdf',
    })
  })

  it('escapes JSON lines before tinting them', () => {
    expect(tintFilePreviewJsonLine('  "html": "<b>", "n": 3, "ok": true')).toBe(
      '  <span data-token="key">&quot;html&quot;</span>: <span data-token="string">&quot;&lt;b&gt;&quot;</span>, <span data-token="key">&quot;n&quot;</span>: <span data-token="number">3</span>, <span data-token="key">&quot;ok&quot;</span>: <span data-token="literal">true</span>',
    )
  })
})
