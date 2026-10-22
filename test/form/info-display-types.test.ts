import { queryOptions } from '@tanstack/vue-query'
import { describe, expect, expectTypeOf, it } from 'vitest'

import type { DisplayTone } from '#ui-tools/display'
import { defineFormSchema } from '#ui-tools/form'
import type { FormFieldFormApi, FormInfoField } from '#ui-tools/form'

describe('info display field types', () => {
  it('types props by display kind, with the form api in callbacks', () => {
    const schema = defineFormSchema({
      fields: [
        {
          display: 'facts',
          key: 'static',
          props: { items: [{ label: 'A', value: 1 }], layout: 'grid' },
          type: 'info',
        },
        {
          dependencies: ['seats'],
          display: 'meter',
          key: 'callback',
          props: ({ api, deps }) => {
            expectTypeOf(api.form).toEqualTypeOf<FormFieldFormApi>()
            expectTypeOf(api.form.close).toEqualTypeOf<() => Promise<void>>()
            return { max: 120, value: deps.get<number>('seats') }
          },
          type: 'info',
        },
        {
          display: 'text',
          key: 'loaded',
          props: () => Promise.resolve({ appearance: 'quote' as const, text: 'Loaded' }),
          type: 'info',
        },
        {
          display: 'text',
          key: 'queried',
          props: () =>
            queryOptions({
              queryFn: async () => ({ body: 'Note' }),
              queryKey: ['note'],
              select: (note) => ({ text: note.body }),
            }),
          type: 'info',
        },
        {
          display: 'code',
          key: 'shelled',
          label: 'Web link',
          props: { value: 'https://x.y' },
          type: 'info',
        },
        { content: 'Legacy notice', key: 'notice', props: { color: 'warning' }, type: 'info' },
      ],
    })
    expect(schema.fields).toHaveLength(6)
  })

  it('rejects props that do not fit the kind', () => {
    // @ts-expect-error `layout` of facts is a known union
    const wrongLayout: FormInfoField = {
      display: 'facts',
      key: 'layout',
      props: { layout: 'masonry' },
      type: 'info',
    }
    // @ts-expect-error a breakdown needs its lines
    const missingLines: FormInfoField = {
      display: 'breakdown',
      key: 'lines',
      props: { total: { label: 'Total' } },
      type: 'info',
    }
    expect([wrongLayout.key, missingLines.key]).toEqual(['layout', 'lines'])
    // @ts-expect-error an unregistered tone is not a tone
    const tone: DisplayTone = 'mauve'
    expect(tone).toBe('mauve')
  })
})
