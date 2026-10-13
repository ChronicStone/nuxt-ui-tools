import { afterEach, describe, expect, it } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'

import { mountForm } from './harness'
import type { FormHarness } from './harness'

let harness: FormHarness | undefined

afterEach(() => {
  harness?.unmount()
  harness = undefined
})

describe('form item layout', () => {
  it('starts a field on a new row, after its span', async () => {
    harness = await mountForm({
      schema: defineFormSchema({
        actions: [],
        fields: [
          { key: 'first', layout: { span: 2 }, type: 'text' },
          { key: 'second', layout: { newRow: true, span: 3 }, type: 'text' },
          { key: 'third', layout: { newRow: true, span: 'full' }, type: 'text' },
        ],
        layout: { columns: 6 },
      }),
    })

    const style = (path: string) => harness?.field(path).attributes('style') ?? ''
    expect(style('second')).toContain('grid-column-start: 1')
    expect(style('second').indexOf('span 3')).toBeLessThan(
      style('second').indexOf('grid-column-start: 1'),
    )
    expect(style('third')).toContain('grid-column-start: 1')
  })

  it('leaves the style of a field without newRow as it was', async () => {
    harness = await mountForm({
      schema: defineFormSchema({
        actions: [],
        fields: [
          { key: 'first', layout: { span: 2 }, type: 'text' },
          { key: 'second', layout: { newRow: false, span: 3 }, type: 'text' },
          { key: 'third', type: 'text' },
        ],
        layout: { columns: 6 },
      }),
    })

    for (const path of ['first', 'second', 'third']) {
      expect(harness.field(path).attributes('style') ?? '').not.toContain('grid-column-start')
    }
    expect(harness.field('first').attributes('style')).toContain('span 2')
  })
})
