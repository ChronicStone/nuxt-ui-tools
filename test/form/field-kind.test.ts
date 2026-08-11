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

    expect(fieldTypes.slice(0, 15)).toEqual([
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
      'input-group',
      'object',
      'custom-component',
    ])
  })

  it('creates a typed field instance for declarative checks', () => {
    const rawField = defineFormField({
      key: 'country',
      type: 'select',
      options: [
        { label: 'France', value: 'FR' },
        { label: 'Belgium', value: 'BE' },
      ],
    })
    const field = createFormFieldInstance(rawField)

    expectTypeOf(field.type.value).toEqualTypeOf<'select'>()
    expect(field.type.is('select')).toBe(true)
    expect(field.type.is('text')).toBe(false)
    expect(field.is('stateful')).toBe(true)
    expect(field.has('options')).toBe(true)
    expect(field.hasAll(['label', 'validation', 'transform'])).toBe(true)
    expect(field.state.is('stateful')).toBe(true)
    expect(field.capability.has('options')).toBe(true)
    expect(field.capability.hasAll(['label', 'validation', 'transform'])).toBe(true)
    expect(field.capability.has('upload')).toBe(false)
    expect(field.config?.type).toBe('select')
    expect(field.raw).toBe(rawField)
  })

  it('uses the registry as the source of truth for field type support', () => {
    expect(getFormFieldKind('hidden')?.state).toBe('stateful')
    expect(isRegisteredFormFieldType('text')).toBe(true)
    expect(isRegisteredFormFieldType('unknown-field')).toBe(false)
  })
})
