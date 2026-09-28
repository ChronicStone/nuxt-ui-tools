import { queryOptions } from '@tanstack/vue-query'
import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import { defineFormSchema } from '#ui-tools/form'
import type { FormValue } from '#ui-tools/form'

import { mountForm } from './harness'

const PRODUCTS = [
  { label: 'Adults exam', line: 'adults', value: 'adults-exam' },
  { label: 'Schools exam', line: 'schools', value: 'schools-exam' },
]

function inLines(lines: FormValue) {
  return PRODUCTS.filter(
    (product) => !Array.isArray(lines) || lines.length === 0 || lines.includes(product.line),
  )
}

describe('option invalidation', () => {
  it('clears values that leave shorthand options when a dependency narrows them', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        { key: 'lines', options: ['adults', 'schools'], props: { multiple: true }, type: 'select' },
        {
          dependencies: ['lines'],
          key: 'featured',
          options: ({ deps }) => inLines(deps.lines),
          type: 'select',
        },
        {
          fields: [
            {
              dependencies: ['lines'],
              key: 'product',
              options: ({ deps }) =>
                queryOptions({
                  queryFn: async () => PRODUCTS,
                  queryKey: ['option-invalidation-products'],
                  select: () => inLines(deps.lines),
                }),
              type: 'select',
            },
          ],
          key: 'rows',
          type: 'array-table',
        },
      ],
    })
    const harness = await mountForm({
      input: {
        featured: 'schools-exam',
        lines: ['adults', 'schools'],
        rows: [{ product: 'schools-exam' }, { product: 'adults-exam' }],
      },
      schema,
    })

    await harness.until(() => harness.wrapper.findAll('tbody tr').length === 2)
    harness.form.state.set('lines', ['adults'])
    await harness.until(() => harness.form.state.get('rows.0.product') === null)

    expect([
      harness.form.state.get('featured'),
      harness.form.state.get('rows.0.product'),
      harness.form.state.get('rows.1.product'),
      harness.wrapper.findAll('tbody tr').length,
    ]).toStrictEqual([null, null, 'adults-exam', 2])
    harness.unmount()
  })

  it('keeps values while the option source fails', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'lines',
          options: ['adults', 'schools', 'retired'],
          props: { multiple: true },
          type: 'select',
        },
        {
          dependencies: ['lines'],
          key: 'featured',
          options: ({ deps }) => {
            if (Array.isArray(deps.lines) && deps.lines.includes('retired')) {
              throw new Error('Retired lines have no catalog')
            }
            return inLines(deps.lines)
          },
          type: 'select',
        },
      ],
    })
    const harness = await mountForm({
      input: { featured: 'schools-exam', lines: ['schools'] },
      schema,
    })

    harness.form.state.set('lines', ['retired'])
    await harness.flush()

    expect(harness.form.state.get('featured')).toBe('schools-exam')
    harness.unmount()
  })

  it('keeps values that leave the options when clearOnInvalid is disabled', async () => {
    const catalogLines = ref(['adults', 'schools'])
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'featured',
          options: { clearOnInvalid: false, source: () => inLines(catalogLines.value) },
          type: 'select',
        },
      ],
    })
    const harness = await mountForm({ input: { featured: 'schools-exam' }, schema })

    catalogLines.value = ['adults']
    await harness.flush()

    expect(harness.form.state.get('featured')).toBe('schools-exam')
    harness.unmount()
  })
})
