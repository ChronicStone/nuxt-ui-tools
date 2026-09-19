import { describe, expect, it } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'

import { deferred, mountForm } from './harness'

describe('option and file parity props', () => {
  it('caps a multiple select at max selections', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'levels',
          label: 'Niveaux',
          max: 2,
          multiple: true,
          options: [
            { label: 'A1', value: 'A1' },
            { label: 'A2', value: 'A2' },
            { label: 'B1', value: 'B1' },
          ],
          type: 'select',
        },
      ],
    })
    const harness = await mountForm({ input: { levels: ['A1', 'A2'] }, schema })

    await harness.field('levels').find('[data-ui-trigger]').trigger('click')
    await harness.field('levels').find('[data-ui-item="B1"]').trigger('click')
    await harness.flush()
    expect(harness.form.state.get('levels')).toStrictEqual(['A1', 'A2'])

    await harness.field('levels').find('[data-ui-item="A1"]').trigger('click')
    await harness.flush()
    expect(harness.form.state.get('levels')).toStrictEqual(['A2'])
    harness.unmount()
  })

  it('reports upload progress while the handler runs', async () => {
    const upload = deferred<string>()
    let report: ((percent: number) => void) | undefined
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'kbis',
          label: 'KBIS',
          output: 'url',
          type: 'upload',
          upload: {
            handler: ({ onProgress }) => {
              report = onProgress
              return upload.promise
            },
          },
        },
      ],
    })
    const harness = await mountForm({ schema })
    const input = harness.field('kbis').find('input[type="file"]')
    const file = new File(['kbis'], 'kbis.pdf', { type: 'application/pdf' })
    Object.defineProperty(input.element, 'files', { value: [file] })
    await input.trigger('change')
    await harness.flush()
    await harness.button('Téléverser').trigger('click')
    await harness.until(() => report !== undefined)

    report?.(40)
    await harness.flush()
    expect(harness.field('kbis').find('[data-form-upload-progress]').exists()).toBeTruthy()

    upload.resolve('https://files/kbis.pdf')
    await harness.until(() => harness.form.state.get('kbis') === 'https://files/kbis.pdf')
    expect(harness.field('kbis').find('[data-form-upload-progress]').exists()).toBeFalsy()
    harness.unmount()
  })
})
