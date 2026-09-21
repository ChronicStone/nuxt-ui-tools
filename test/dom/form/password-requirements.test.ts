import { describe, expect, it } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'

import { errorOf, mountForm } from './harness'

const schema = defineFormSchema({
  fields: [
    {
      key: 'password',
      label: 'Mot de passe',
      props: {
        requirements: [
          { key: 'length', label: '10 caractères', validate: (value) => value.length >= 10 },
          { key: 'uppercase', label: 'Une majuscule', validate: (value) => /[A-Z]/u.test(value) },
        ],
      },
      required: true,
      type: 'password',
    },
  ],
  formKey: 'password-requirements',
})

describe('password requirements', () => {
  it('shows live requirement progress while focused and hides it on blur', async () => {
    const harness = await mountForm({ schema })
    const input = harness.control('password')

    expect(harness.wrapper.find('[data-form-password-requirements]').exists()).toBeFalsy()
    await input.trigger('focus')
    await harness.flush()
    expect(harness.wrapper.find('[data-form-password-requirements]').text()).toContain('0/2')
    expect(harness.wrapper.find('[data-form-password-progress]').attributes('data-value')).toBe('0')
    expect(harness.wrapper.find('[data-form-password-progress]').attributes('data-max')).toBe('2')

    await harness.setInput('password', 'LongPassword')
    expect(harness.wrapper.find('[data-form-password-requirements]').text()).toContain('2/2')
    expect(harness.wrapper.find('[data-form-password-progress]').attributes('data-value')).toBe('2')

    await input.trigger('blur')
    await harness.flush()
    expect(harness.wrapper.find('[data-form-password-requirements]').exists()).toBeFalsy()
    harness.unmount()
  })

  it('uses the same requirements as validation rules', async () => {
    const harness = await mountForm({ schema })

    await harness.setInput('password', 'short')
    await harness.submit()
    expect(harness.submitted).toHaveLength(0)
    expect(errorOf(harness, 'password')).toBe('10 caractères')

    await harness.setInput('password', 'longpassword')
    await harness.submit()
    expect(harness.submitted).toHaveLength(0)
    expect(errorOf(harness, 'password')).toBe('Une majuscule')

    await harness.setInput('password', 'LongPassword')
    await harness.submit()
    expect(harness.submitted).toHaveLength(1)
    harness.unmount()
  })
})
