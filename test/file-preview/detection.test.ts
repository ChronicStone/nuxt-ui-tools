import { describe, expect, it } from 'vitest'

import { defineFilePreviewRenderer } from '#ui-tools/file-preview'
import {
  normalizeFilePreviewItem,
  normalizeFilePreviewItems,
} from '#ui-tools/file-preview/utils/files'
import {
  builtInFilePreviewRenderers,
  detectFilePreviewKind,
  mergeFilePreviewRenderers,
} from '#ui-tools/file-preview/utils/renderers'

function kindOf(file: { name: string; mime?: string | null }) {
  const extension = file.name.includes('.')
    ? (file.name.split('.').pop()?.toLowerCase() ?? null)
    : null
  return detectFilePreviewKind(
    { extension, mime: file.mime ?? null, name: file.name },
    builtInFilePreviewRenderers,
  )
}

describe('file preview kind detection', () => {
  it.each([
    ['contract.pdf', null, 'pdf'],
    ['scan', 'application/pdf', 'pdf'],
    ['logo.svg', null, 'image'],
    ['IMG_2041.HEIC', null, 'image'],
    ['onboarding.mov', null, 'video'],
    ['clip', 'video/webm', 'video'],
    ['interview.m4a', null, 'audio'],
    ['export.csv', 'text/csv', 'csv'],
    ['export.tsv', null, 'csv'],
    ['README.md', 'text/markdown', 'markdown'],
    ['payload.json', 'application/json', 'text'],
    ['server.log', null, 'text'],
    ['notes', 'text/plain', 'text'],
    ['statuts.docx', null, 'office'],
    ['budget.xlsx', null, 'office'],
    ['results.zip', 'application/zip', 'archive'],
    ['model.glb', null, 'other'],
  ])('detects %s (%s) as %s', (name, mime, kind) => {
    expect(kindOf({ mime, name })).toBe(kind)
  })

  it('prefers the MIME type over a misleading extension', () => {
    expect(kindOf({ mime: 'text/csv', name: 'export.txt' })).toBe('csv')
  })

  it('checks custom renderers first and lets them replace a built-in kind', () => {
    const email = defineFilePreviewRenderer({
      component: async () => ({ render: () => null }),
      icon: 'i-lucide-mail',
      kind: 'email',
      match: ({ extension }) => extension === 'eml',
    })
    const pdf = defineFilePreviewRenderer({
      component: async () => ({ render: () => null }),
      icon: 'i-lucide-file',
      kind: 'pdf',
      match: ({ extension }) => extension === 'pdf',
    })
    const renderers = mergeFilePreviewRenderers([email, pdf])

    expect(detectFilePreviewKind({ extension: 'eml', mime: null, name: 'a.eml' }, renderers)).toBe(
      'email',
    )
    expect(renderers.filter((renderer) => renderer.kind === 'pdf')).toStrictEqual([pdf])
  })
})

describe('file preview normalization', () => {
  it('reads name, type, size, and date from a File', () => {
    const file = new File(['%PDF'], 'Contrat signé.pdf', {
      lastModified: Date.UTC(2026, 8, 12),
      type: 'application/pdf',
    })
    const item = normalizeFilePreviewItem(file, {
      key: 'file-0',
      renderers: builtInFilePreviewRenderers,
    })

    expect(item).toMatchObject({
      extension: 'pdf',
      kind: 'pdf',
      mime: 'application/pdf',
      name: 'Contrat signé.pdf',
      size: 4,
    })
    expect(item.updatedAt?.toISOString()).toBe('2026-09-12T00:00:00.000Z')
  })

  it('names URLs from their last segment and leaves data URLs unnamed', () => {
    const [remote, inline] = normalizeFilePreviewItems(
      [
        'https://cdn.example.com/files/Kbis%20Clairval.pdf?signature=abc',
        'data:image/png;base64,AAAA',
      ],
      builtInFilePreviewRenderers,
    )

    expect(remote).toMatchObject({
      extension: 'pdf',
      key: 'file-0',
      kind: 'pdf',
      name: 'Kbis Clairval.pdf',
    })
    expect(inline).toMatchObject({ key: 'file-1', kind: 'other', name: '' })
  })

  it('keeps explicit descriptors and normalizes their rendition', () => {
    const [item] = normalizeFilePreviewItems(
      [
        {
          id: 'statuts',
          name: 'Statuts.docx',
          rendition: { name: 'Statuts.pdf', src: '/renditions/statuts.pdf' },
          size: 248_000,
          src: () => '/files/statuts.docx',
          updatedAt: '2026-01-08',
        },
      ],
      builtInFilePreviewRenderers,
    )

    expect(item?.key).toBe('statuts')
    expect(item?.kind).toBe('office')
    expect(item?.rendition).toMatchObject({
      key: 'file-0:rendition',
      kind: 'pdf',
      name: 'Statuts.pdf',
    })
    expect(item?.updatedAt?.toISOString().slice(0, 10)).toBe('2026-01-08')
  })
})
