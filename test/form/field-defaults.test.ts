import { describe, expect, it } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'

import { buildInitialFormState } from '../../src/runtime/form/utils/state'

describe('form field defaults', () => {
  it('initializes every multiple selection field with an empty collection', () => {
    const schema = defineFormSchema({
      fields: [
        { key: 'checkboxes', options: [], type: 'checkbox-group' },
        { key: 'cards', options: [], type: 'checkbox-card' },
        { key: 'switches', options: [], type: 'switch-group' },
        { key: 'select', options: [], props: { multiple: true }, type: 'select' },
        { key: 'autocomplete', options: [], props: { multiple: true }, type: 'auto-complete' },
        { key: 'tree', options: [], props: { multiple: true }, type: 'tree' },
        { key: 'file', props: { multiple: true }, type: 'file' },
      ],
    })

    expect(buildInitialFormState(schema, {})).toStrictEqual({
      autocomplete: [],
      cards: [],
      checkboxes: [],
      file: [],
      select: [],
      switches: [],
      tree: [],
    })
  })
})
