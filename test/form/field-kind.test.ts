import { describe, expect, expectTypeOf, it } from 'vitest'

import {
  createFormFieldInstance,
  defineFormField,
  formFieldKinds,
  getFormFieldKind,
  isRegisteredFormFieldType,
} from '#ui-tools/form'

describe('form field kinds', () => {
  it('keeps file and upload as separate field kinds', () => {
    const fieldTypes = formFieldKinds.map((kind) => kind.type)

    expect(fieldTypes).toContain('file')
    expect(fieldTypes).toContain('upload')
  })

  it('starts from core Exassess fields before specialized fields', () => {
    const fieldTypes = formFieldKinds.map((kind) => kind.type)

    expect(fieldTypes.slice(0, 15)).toStrictEqual([
      'text',
      'password',
      'textarea',
      'number',
      'checkbox',
      'radio',
      'select',
      'date',
      'phone-number',
      'hidden',
      'info',
      'divider',
      'section',
      'input-group',
      'object',
    ])
  })

  it('creates a typed field instance for declarative checks', () => {
    const rawField = defineFormField({
      key: 'country',
      options: [
        { label: 'France', value: 'FR' },
        { label: 'Belgium', value: 'BE' },
      ],
      type: 'select',
    })
    const field = createFormFieldInstance(rawField)

    expectTypeOf(field.type.value).toEqualTypeOf<'select'>()
    expect(field.type.is('select')).toBeTruthy()
    expect(field.type.is('text')).toBeFalsy()
    expect(field.is('stateful')).toBeTruthy()
    expect(field.has('options')).toBeTruthy()
    expect(field.hasAll(['label', 'validation', 'transform'])).toBeTruthy()
    expect(field.state.is('stateful')).toBeTruthy()
    expect(field.capability.has('options')).toBeTruthy()
    expect(field.capability.hasAll(['label', 'validation', 'transform'])).toBeTruthy()
    expect(field.capability.has('upload')).toBeFalsy()
    expect([field.config?.type, field.raw]).toEqual(['select', rawField])
  })

  it('uses the registry as the source of truth for field type support', () => {
    expect(getFormFieldKind('hidden')?.state).toBe('stateful')
    expect(isRegisteredFormFieldType('text')).toBeTruthy()
    expect(isRegisteredFormFieldType('unknown-field')).toBeFalsy()
  })
})
