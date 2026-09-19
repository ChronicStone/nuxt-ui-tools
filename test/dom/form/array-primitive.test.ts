import { describe, expect, it, vi } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'

import { errorOf, mountForm } from './harness'

function contactsSchema() {
  return defineFormSchema({
    fields: [
      {
        addItemLabel: 'Add contact',
        confirmDelete: false,
        field: { placeholder: 'Contact', required: true, type: 'text' },
        key: 'contacts',
        label: 'Contacts',
        type: 'array-primitive',
        unique: true,
      },
    ],
  })
}

describe('array primitive', () => {
  it('adds a pending item, blocks a second add, and reports required and unique errors', async () => {
    const onSubmit = vi.fn<() => boolean>(() => true)
    const harness = await mountForm({
      input: { contacts: ['alice@exassess.com'] },
      onSubmit,
      schema: contactsSchema(),
    })

    await harness.button('Add contact').trigger('click')
    await harness.until(() => harness.wrapper.findAll('[data-form-array-item]').length === 2)
    expect(harness.button('Add contact').attributes('disabled')).toBeDefined()

    await harness.submit()
    expect(onSubmit).not.toHaveBeenCalled()
    await harness.until(() => errorOf(harness, 'contacts.1') === 'Ce champ est requis')

    await harness.setInput('contacts.1', 'alice@exassess.com')
    await harness.submit()
    await harness.until(
      () => errorOf(harness, 'contacts.1') === 'Cette valeur est déjà dans la liste',
    )
    expect(onSubmit).not.toHaveBeenCalled()
    harness.unmount()
  })

  it('rejects a pending item on submit even when the item field is not marked required', async () => {
    const onSubmit = vi.fn<() => boolean>(() => true)
    const schema = defineFormSchema({
      fields: [
        {
          addItemLabel: 'Add address',
          field: { placeholder: 'Address', type: 'text' },
          key: 'addresses',
          type: 'array-primitive',
        },
      ],
    })
    const harness = await mountForm({ input: { addresses: ['a@exassess.com'] }, onSubmit, schema })

    await harness.button('Add address').trigger('click')
    await harness.until(() => harness.wrapper.findAll('[data-form-array-item]').length === 2)
    await harness.submit()
    await harness.until(() => errorOf(harness, 'addresses.1') === 'Ce champ est requis')
    expect(onSubmit).not.toHaveBeenCalled()
    harness.unmount()
  })

  it('submits the primitive list and removes items', async () => {
    const onSubmit = vi.fn<() => boolean>(() => true)
    const harness = await mountForm({
      input: { contacts: ['alice@exassess.com', 'bob@exassess.com'] },
      onSubmit,
      schema: contactsSchema(),
    })

    await harness.submit()
    await harness.until(() => onSubmit.mock.calls.length === 1)
    expect(harness.output()).toStrictEqual({
      contacts: ['alice@exassess.com', 'bob@exassess.com'],
    })

    await harness.wrapper
      .find('[data-form-array-item="0"] [data-icon="i-lucide-trash-2"]')
      .trigger('click')
    await harness.until(() => harness.wrapper.findAll('[data-form-array-item]').length === 1)
    expect(harness.output()).toStrictEqual({ contacts: ['bob@exassess.com'] })
    harness.unmount()
  })

  it('previews filled option items and applies item transforms to the output', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          field: {
            options: [
              { label: 'Paris', value: 'paris' },
              { label: 'Lyon', value: 'lyon' },
            ],
            transform: { output: (value) => String(value).toUpperCase() },
            type: 'select',
          },
          key: 'cities',
          preview: ({ option, value }) => `${String(option?.label ?? value)} ✓`,
          type: 'array-primitive',
        },
      ],
    })
    const harness = await mountForm({ input: { cities: ['paris', null] }, schema })

    const previews = harness.wrapper.findAll('[data-form-array-preview]')
    expect(previews.map((preview) => preview.text())).toStrictEqual(['Paris ✓'])
    expect(harness.wrapper.find('[data-form-field="cities.1"]').exists()).toBeTruthy()
    expect(harness.output()).toStrictEqual({ cities: ['PARIS'] })
    harness.unmount()
  })
})
