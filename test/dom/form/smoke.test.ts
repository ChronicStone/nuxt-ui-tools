import { describe, expect, it, vi } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'

import { errorOf, labels, mountForm } from './harness'

const schema = defineFormSchema({
  fields: [
    { key: 'name', label: 'Nom', type: 'text', validation: { required: true } },
    { key: 'email', label: 'E-mail', placeholder: 'prenom@exemple.fr', type: 'text' },
    {
      condition: ({ deps }) => 'kind' in deps && deps.kind === 'company',
      dependencies: ['kind'],
      key: 'company',
      label: 'Société',
      type: 'text',
    },
    {
      key: 'kind',
      label: 'Type',
      options: [
        { label: 'Particulier', value: 'person' },
        { label: 'Société', value: 'company' },
      ],
      type: 'radio',
    },
  ],
  formKey: 'smoke',
})

describe('form harness', () => {
  it('renders labels, binds inputs and submits output', async () => {
    const harness = await mountForm({ schema })
    expect(labels(harness)).toStrictEqual(['Nom', 'E-mail', 'Type'])
    expect(harness.control('name').attributes('data-ui')).toBe('UInput')
    await harness.setInput('name', 'Demand QA')
    await harness.setInput('email', 'it@exassess.com')
    expect(harness.form.state.get('name')).toBe('Demand QA')
    await harness.submit()
    expect(harness.submitted).toHaveLength(1)
    expect(harness.submitted[0]?.value).toMatchObject({
      email: 'it@exassess.com',
      name: 'Demand QA',
    })
    harness.unmount()
  })

  it('blocks submit on required errors and shows the message', async () => {
    const harness = await mountForm({ schema })
    await harness.submit()
    expect(harness.submitted).toHaveLength(0)
    expect(errorOf(harness, 'name')).toBeTruthy()
    harness.unmount()
  })

  it('renders dependent fields when their condition passes', async () => {
    const harness = await mountForm({ schema })
    expect(harness.wrapper.find('[data-form-field="company"]').exists()).toBeFalsy()
    await harness.field('kind').find('input[value="company"]').trigger('change')
    await harness.flush()
    expect(harness.wrapper.find('[data-form-field="company"]').exists()).toBeTruthy()
    harness.unmount()
  })

  it('keeps an unmasked email field native without initializing Maska', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const harness = await mountForm({
      schema: defineFormSchema({
        fields: [
          {
            key: 'email',
            label: 'E-mail',
            props: { inputType: 'email' },
            type: 'text',
          },
        ],
        formKey: 'native-email',
      }),
    })

    expect(harness.control('email').attributes('type')).toBe('email')
    expect(warn.mock.calls.some(([message]) => String(message).startsWith('Maska:'))).toBeFalsy()

    harness.unmount()
    warn.mockRestore()
  })
})
