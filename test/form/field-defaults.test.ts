import { describe, expect, it } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'

import { buildInitialFormState } from '../../src/runtime/form/utils/state'

describe('form field defaults', () => {
  it('initializes every multiple selection field with an empty collection', () => {
    const schema = defineFormSchema({
      fields: [
        { key: 'checkboxes', type: 'checkbox-group', options: [] },
        { key: 'cards', type: 'checkbox-card', options: [] },
        { key: 'switches', type: 'switch-group', options: [] },
        { key: 'select', type: 'select', multiple: true, options: [] },
        { key: 'autocomplete', type: 'auto-complete', multiple: true, options: [] },
        { key: 'tree', type: 'tree', multiple: true, options: [] },
        { key: 'file', type: 'file', multiple: true },
      ],
    })

    expect(buildInitialFormState(schema, {})).toEqual({
      checkboxes: [],
      cards: [],
      switches: [],
      select: [],
      autocomplete: [],
      tree: [],
      file: [],
    })
  })
})
