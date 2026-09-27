import { afterEach, describe, expect, it, vi } from 'vitest'

import { mountFilePreview } from './harness'

type Preview = ReturnType<typeof mountFilePreview>

let current: Preview | null = null

function open(options: Parameters<typeof mountFilePreview>[0] = {}) {
  current = mountFilePreview(options)
  return current
}

afterEach(() => {
  current?.unmount()
  current = null
  vi.restoreAllMocks()
})

async function shown(preview: Preview, selector: string) {
  await preview.until(() => preview.find(selector).exists(), selector)
  return preview.find(selector)
}

describe('file preview provider', () => {
  it('renders a gallery and navigates with the strip and the keyboard', async () => {
    const preview = open()
    const handle = preview.api.open([
      new File(['x'], 'badge.png', { type: 'image/png' }),
      { name: 'Contrat-cadre.pdf', size: 2048, src: '/files/contrat.pdf' },
      { name: 'export.zip', src: '/files/export.zip' },
    ])

    await shown(preview, '[data-file-preview-image]')
    expect(preview.text('[data-file-preview-name]')).toBe('badge.png')
    expect(preview.text('[data-file-preview-counter]')).toBe('1 / 3')
    expect(preview.wrapper.findAll('[data-file-preview-thumb]')).toHaveLength(3)

    await preview.wrapper.findAll('[data-file-preview-thumb]')[2]?.trigger('click')
    const fallback = await shown(preview, '[data-file-preview-fallback]')
    expect(handle.index.value).toBe(2)
    expect(fallback.text()).toContain('ZIP')

    await preview.find('[data-file-preview]').trigger('keydown', { key: 'ArrowLeft' })
    const frame = await shown(preview, '[data-file-preview-pdf]')
    expect(frame.attributes('src')).toBe('/files/contrat.pdf#view=FitH')
    expect(preview.text('[data-file-preview-meta]')).toContain('PDF')
  })

  it('asks a source function again when the user retries', async () => {
    const preview = open()
    const src = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('403 AccessDenied'))
      .mockResolvedValueOnce('/signed/qualiopi.pdf')
    preview.api.open({ name: 'Qualiopi.pdf', src })

    const retry = await shown(preview, '[data-file-preview-retry]')
    expect(preview.text('[data-file-preview-message]')).toContain('403 AccessDenied')

    await retry.trigger('click')
    const frame = await shown(preview, '[data-file-preview-pdf]')
    expect(frame.attributes('src')).toBe('/signed/qualiopi.pdf#view=FitH')
    expect(src).toHaveBeenCalledTimes(2)
  })

  it('shows a rendition and still downloads the original', async () => {
    const preview = open()
    const download = vi.fn()
    preview.api.open({
      download,
      name: 'Statuts.docx',
      rendition: { name: 'Statuts.pdf', src: '/renditions/statuts.pdf' },
      src: '/files/statuts.docx',
    })

    await shown(preview, '[data-file-preview-pdf]')
    expect(preview.find('[data-file-preview-converted]').exists()).toBe(true)
    expect(preview.text('[data-file-preview-name]')).toBe('Statuts.docx')

    await preview.find('[data-file-preview-converted] button').trigger('click')
    expect(download).toHaveBeenCalledWith(expect.objectContaining({ name: 'Statuts.docx' }))
  })

  it('renders CSV exports as a table with the detected delimiter', async () => {
    const preview = open()
    const csv = '﻿Compte;Évaluations;Montant HT\nClairval;128;5 376,00\nLumen;22;1 056,00'
    preview.api.open(new File([csv], 'consommation.csv', { type: 'text/csv' }))

    const table = await shown(preview, '[data-file-preview-csv]')
    expect(table.findAll('thead th').map((cell) => cell.text())).toStrictEqual([
      '#',
      'Compte',
      'Évaluations',
      'Montant HT',
    ])
    expect(table.findAll('tbody tr')).toHaveLength(2)
    expect(table.findAll('tbody tr')[0]?.findAll('td')[3]?.classes()).toContain('text-end')
    expect(preview.text('[data-file-preview-facts]')).toContain('« ; »')
  })

  it('formats JSON and renders markdown through the provider hook', async () => {
    const preview = open({ markdown: (source) => `<h1>${source.length} chars</h1>` })
    preview.api.open([
      { name: 'payload.json', src: new Blob(['{"event":"assessment.completed","score":71}']) },
      { name: 'README.md', src: new Blob(['# Webhooks']) },
    ])

    const code = await shown(preview, '[data-file-preview-code]')
    expect(code.text()).toContain('"event": "assessment.completed"')
    expect(code.find('[data-token="number"]').text()).toBe('71')

    await preview.find('[data-file-preview]').trigger('keydown', { key: 'ArrowRight' })
    const markdown = await shown(preview, '[data-file-preview-markdown]')
    expect(markdown.find('h1').text()).toBe('10 chars')
  })

  it('closes from the header', async () => {
    const preview = open()
    const handle = preview.api.open('/files/photo.jpg')

    const close = await shown(preview, '[data-file-preview-close]')
    await close.trigger('click')

    expect(preview.api.instances.value[0]?.open.value).toBe(false)
    expect(handle.index.value).toBe(0)
  })
})
