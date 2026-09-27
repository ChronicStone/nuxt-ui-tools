import { afterEach, describe, expect, it, vi } from 'vitest'

import { createFilePreviewApi } from '#ui-tools/file-preview'
import { defineFormSchema } from '#ui-tools/form'
import type { FormUploadValue } from '#ui-tools/form'

import { deferred, mountForm } from './harness'
import type { FormHarness } from './harness'

async function pick(harness: FormHarness, key: string, files: readonly File[]) {
  const input = harness.field(key).find('input[type="file"]')
  Object.defineProperty(input.element, 'files', { configurable: true, value: files })
  await input.trigger('change')
  await harness.flush()
}

function pdf(name: string) {
  return new File(['%PDF'], name, { type: 'application/pdf' })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('upload field', () => {
  it('resolves a stored value to render and open it', async () => {
    const opened: FormUploadValue[] = []
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'agreement',
          label: 'Contrat',
          output: 'object',
          type: 'upload',
          upload: {
            handler: async () => null,
            open: ({ value }) => {
              opened.push(value)
            },
            resolve: async () => ({
              name: 'Contrat signé.pdf',
              size: 2048,
              type: 'application/pdf',
            }),
          },
        },
      ],
    })
    const harness = await mountForm({ input: { agreement: { id: 'file-1' } }, schema })

    await harness.until(() => harness.field('agreement').find('[data-form-upload-open]').exists())
    expect(harness.field('agreement').find('[data-form-upload-open]').text()).toBe(
      'Contrat signé.pdf',
    )
    expect(harness.field('agreement').find('[data-form-upload-meta]').text()).toBe(
      'PDF · 2\u202Fko',
    )
    expect(harness.field('agreement').find('input[type="file"]').exists()).toBeTruthy()

    await harness.field('agreement').find('[data-form-upload-open]').trigger('click')
    expect(opened).toStrictEqual([{ id: 'file-1' }])
    harness.unmount()
  })

  it('shows the resolved description instead of the file type and size', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'agreement',
          label: 'Contrat',
          output: 'object',
          type: 'upload',
          upload: {
            handler: async () => null,
            resolve: () => ({
              description: 'PDF · ajouté le 3 sept.',
              name: 'Contrat signé',
              type: 'application/pdf',
            }),
          },
        },
      ],
    })
    const harness = await mountForm({ input: { agreement: { id: 'file-1' } }, schema })

    await harness.flush()
    expect(harness.field('agreement').find('[data-form-upload-meta]').text()).toBe(
      'PDF · ajouté le 3 sept.',
    )
    harness.unmount()
  })

  it('hides the open action of a stored value resolved as not openable', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'agreement',
          label: 'Contrat',
          output: 'object',
          type: 'upload',
          upload: {
            handler: async () => null,
            open: () => undefined,
            resolve: () => ({ name: 'Brouillon.pdf', openable: false }),
          },
        },
      ],
    })
    const harness = await mountForm({ input: { agreement: { token: 'staged' } }, schema })

    await harness.flush()
    expect(harness.field('agreement').find('[data-form-upload-open]').exists()).toBeFalsy()
    expect(harness.field('agreement').find('[data-form-upload-name]').text()).toBe('Brouillon.pdf')
    harness.unmount()
  })

  it('derives the name of a stored URL and opens it in a new tab', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'logo',
          label: 'Logo',
          output: 'url',
          type: 'upload',
          upload: { handler: async () => null },
        },
      ],
    })
    const harness = await mountForm({
      input: { logo: 'https://files.test/logos/acme%20logo.png?v=2' },
      schema,
    })

    await harness.flush()
    const name = harness.field('logo').find('[data-form-upload-open]')
    expect(name.text()).toBe('acme logo.png')
    await name.trigger('click')
    expect(open).toHaveBeenCalledWith(
      'https://files.test/logos/acme%20logo.png?v=2',
      '_blank',
      'noopener',
    )
    harness.unmount()
  })

  it('uploads each selected file as soon as it is picked', async () => {
    const received: string[][] = []
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'documents',
          label: 'Documents',
          output: 'url',
          props: { multiple: true },
          type: 'upload',
          upload: {
            handler: async ({ files }) => {
              received.push(files.map((file) => file.name))
              return `https://files.test/${files[0]?.name ?? ''}`
            },
          },
        },
      ],
    })
    const harness = await mountForm({ schema })

    await pick(harness, 'documents', [pdf('a.pdf'), pdf('b.pdf')])
    await harness.until(() => {
      const value = harness.form.state.get('documents')
      return Array.isArray(value) && value.length === 2
    })

    expect(received).toStrictEqual([['a.pdf'], ['b.pdf']])
    expect(harness.form.state.get('documents')).toStrictEqual([
      'https://files.test/a.pdf',
      'https://files.test/b.pdf',
    ])
    expect(harness.field('documents').findAll('[data-form-upload-item="stored"]')).toHaveLength(2)
    harness.unmount()
  })

  it('keeps the preview, size, and type of an image uploaded in this session', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:logo-preview')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'logo',
          label: 'Logo',
          output: 'object',
          type: 'upload',
          upload: {
            handler: async () => ({ token: 'staged' }),
            resolve: ({ value }) => ({ name: String(Object(value).name ?? '') }),
          },
        },
      ],
    })
    const harness = await mountForm({ schema })

    await pick(harness, 'logo', [new File(['png'], 'logo.png', { type: 'image/png' })])
    await harness.until(() =>
      harness.field('logo').find('[data-form-upload-item="stored"]').exists(),
    )

    const item = harness.field('logo').find('[data-form-upload-item="stored"]')
    expect(item.find('img').attributes('src')).toBe('blob:logo-preview')
    expect(item.find('[data-form-upload-name]').text()).toBe('logo.png')
    expect(item.find('[data-form-upload-meta]').text()).toContain('PNG')
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
    harness.unmount()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:logo-preview')
  })

  it('keeps a failed upload in the list until it is retried', async () => {
    let attempts = 0
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'kbis',
          label: 'KBIS',
          output: 'url',
          type: 'upload',
          upload: {
            handler: async () => {
              attempts += 1
              if (attempts === 1) throw new Error('Réseau indisponible')
              return 'https://files.test/kbis.pdf'
            },
          },
        },
      ],
    })
    const harness = await mountForm({ schema })

    await pick(harness, 'kbis', [pdf('kbis.pdf')])
    await harness.until(() =>
      harness.field('kbis').find('[data-form-upload-item="failed"]').exists(),
    )
    expect(harness.field('kbis').find('[data-form-upload-meta]').text()).toBe('Réseau indisponible')
    expect(harness.form.state.get('kbis')).toBeNull()

    await harness.field('kbis').find('[data-form-upload-retry]').trigger('click')
    await harness.until(() => harness.form.state.get('kbis') === 'https://files.test/kbis.pdf')
    expect(attempts).toBe(2)
    expect(harness.field('kbis').find('[data-form-upload-item="failed"]').exists()).toBeFalsy()
    harness.unmount()
  })

  it('aborts the handler signal when an upload is cancelled', async () => {
    const upload = deferred<string>()
    let signal: AbortSignal | undefined
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'kbis',
          label: 'KBIS',
          output: 'url',
          type: 'upload',
          upload: {
            handler: ({ signal: current }) => {
              signal = current
              return upload.promise
            },
          },
        },
      ],
    })
    const harness = await mountForm({ schema })

    await pick(harness, 'kbis', [pdf('kbis.pdf')])
    await harness.until(() => signal !== undefined)
    await harness.field('kbis').find('[data-form-upload-cancel]').trigger('click')
    await harness.flush()
    expect(signal?.aborted).toBeTruthy()

    upload.resolve('https://files.test/kbis.pdf')
    await harness.flush()
    expect(harness.form.state.get('kbis')).toBeNull()
    expect(harness.field('kbis').find('[data-form-upload-item]').exists()).toBeFalsy()
    harness.unmount()
  })

  it('waits for running uploads before submitting', async () => {
    const upload = deferred<string>()
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'kbis',
          label: 'KBIS',
          output: 'url',
          type: 'upload',
          upload: { handler: () => upload.promise },
        },
      ],
    })
    const harness = await mountForm({ schema })

    await pick(harness, 'kbis', [pdf('kbis.pdf')])
    await harness.submit()
    expect(harness.submitted).toHaveLength(0)

    upload.resolve('https://files.test/kbis.pdf')
    await harness.until(() => harness.submitted.length === 1)
    expect(harness.submitted[0]?.value).toStrictEqual({ kbis: 'https://files.test/kbis.pdf' })
    harness.unmount()
  })

  it('blocks submit while a selected file is not uploaded', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'kbis',
          label: 'KBIS',
          output: 'url',
          props: { autoUpload: false },
          type: 'upload',
          upload: { handler: async () => 'https://files.test/kbis.pdf' },
        },
      ],
    })
    const harness = await mountForm({ schema })

    await pick(harness, 'kbis', [pdf('kbis.pdf')])
    expect(harness.field('kbis').find('[data-form-upload-item="queued"]').exists()).toBeTruthy()
    await harness.submit()
    expect(harness.submitted).toHaveLength(0)
    expect(harness.field('kbis').text()).toContain(
      'Téléversez ou retirez les fichiers sélectionnés avant d’enregistrer.',
    )

    await harness.field('kbis').find('[data-form-upload-start]').trigger('click')
    await harness.until(() => harness.form.state.get('kbis') === 'https://files.test/kbis.pdf')
    expect(harness.field('kbis').text()).not.toContain('Téléversez ou retirez')

    await harness.submit()
    await harness.until(() => harness.submitted.length === 1)
    harness.unmount()
  })

  it('replaces the stored file of a single upload and reports the replaced value', async () => {
    const deleted: unknown[] = []
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'kbis',
          label: 'KBIS',
          output: 'url',
          type: 'upload',
          upload: {
            handler: async ({ files }) => `https://files.test/${files[0]?.name ?? ''}`,
            onDelete: ({ value }) => {
              deleted.push(value)
            },
          },
        },
      ],
    })
    const harness = await mountForm({ input: { kbis: 'https://files.test/old.pdf' }, schema })

    await harness.flush()
    expect(harness.field('kbis').find('[data-form-upload-replace]').exists()).toBeTruthy()
    await pick(harness, 'kbis', [pdf('new.pdf')])
    await harness.until(() => harness.form.state.get('kbis') === 'https://files.test/new.pdf')
    expect(deleted).toStrictEqual(['https://files.test/old.pdf'])
    expect(harness.field('kbis').findAll('[data-form-upload-item]')).toHaveLength(1)
    harness.unmount()
  })

  it('previews the field files as a gallery when a file preview provider is mounted', async () => {
    const filePreview = createFilePreviewApi()
    filePreview.attach()
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:new-preview')
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'documents',
          label: 'Documents',
          output: 'url',
          props: { multiple: true },
          type: 'upload',
          upload: { handler: async ({ files }) => `https://files.test/${files[0]?.name ?? ''}` },
        },
      ],
    })
    const harness = await mountForm({
      filePreview,
      input: { documents: ['https://files.test/kbis.pdf'] },
      schema,
    })

    await pick(harness, 'documents', [pdf('statuts.pdf')])
    await harness.until(
      () => harness.field('documents').findAll('[data-form-upload-open]').length === 2,
    )
    await harness.field('documents').findAll('[data-form-upload-open]')[1]?.trigger('click')

    const preview = filePreview.instances.value[0]
    expect(preview?.index.value).toBe(1)
    expect(preview?.files.value.map((item) => [item.name, item.kind])).toStrictEqual([
      ['kbis.pdf', 'pdf'],
      ['statuts.pdf', 'pdf'],
    ])
    expect(preview?.files.value[1]?.file.src).toBeInstanceOf(File)
    harness.unmount()
  })
})
