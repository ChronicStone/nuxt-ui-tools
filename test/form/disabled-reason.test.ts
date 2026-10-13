import { describe, expect, expectTypeOf, it } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'
import type { FormArrayPrimitiveItemField } from '#ui-tools/form'

describe('disabledReason typing', () => {
  it('accepts text, lazy text, and a dependency callback that may return nothing', () => {
    const schema = defineFormSchema({
      fields: [
        { key: 'account', type: 'text' },
        {
          dependencies: ['account'],
          disabled: ({ deps }) => !deps.get('account'),
          disabledReason: ({ deps }) => (deps.get('account') ? undefined : 'Choisissez un compte'),
          key: 'center',
          options: [],
          type: 'select',
        },
        { disabled: () => true, disabledReason: 'Verrouillé', key: 'plain', type: 'text' },
        { disabled: () => true, disabledReason: () => 'Verrouillé', key: 'lazy', type: 'text' },
      ],
    })

    expect(schema.fields).toHaveLength(4)
  })

  it('is not part of the bare item field of a primitive array', () => {
    type TextItem = Extract<FormArrayPrimitiveItemField, { type: 'text' }>

    expectTypeOf<TextItem>().not.toHaveProperty('disabledReason')
    expectTypeOf<TextItem>().not.toHaveProperty('help')
    expectTypeOf<TextItem>().toHaveProperty('placeholder')
  })
})
