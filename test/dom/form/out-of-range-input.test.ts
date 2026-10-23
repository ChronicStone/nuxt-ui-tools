import { describe, expect, it } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'

import { errorOf, mountForm } from './harness'

describe('values outside what a field accepts', () => {
  it('keeps a typed number outside min and max and names the bound', async () => {
    const harness = await mountForm({
      schema: defineFormSchema({
        fields: [{ key: 'seats', label: 'Seats', props: { max: 1200, min: 1 }, type: 'number' }],
      }),
    })

    await harness.setInput('seats', '0')
    await harness.submit()
    expect(harness.form.state.get('seats')).toBe(0)
    expect(errorOf(harness, 'seats')).toBe('Valeur minimale : 1')

    await harness.setInput('seats', '1500')
    await harness.submit()
    expect(harness.form.state.get('seats')).toBe(1500)
    expect(errorOf(harness, 'seats')).toBe('Valeur maximale : 1\u202F200')
    expect(harness.submitted).toHaveLength(0)

    await harness.setInput('seats', '12')
    await harness.submit()
    expect(harness.submitted).toHaveLength(1)
    harness.unmount()
  })

  it('leaves the bounds to validation so the number input never clamps what was typed', async () => {
    const harness = await mountForm({
      input: { seats: 1 },
      schema: defineFormSchema({
        fields: [{ key: 'seats', label: 'Seats', props: { max: 3, min: 1 }, type: 'number' }],
      }),
    })
    const input = harness.wrapper.findComponent({ name: 'UInputNumber' })

    expect(input.props('min')).toBeUndefined()
    expect(input.props('max')).toBeUndefined()
    expect(input.find('input').attributes('decrement-disabled')).toBe('true')
    expect(input.find('input').attributes('increment-disabled')).toBe('false')
    harness.unmount()
  })

  it('keeps an incomplete phone number and blocks the submit with a message', async () => {
    const harness = await mountForm({
      schema: defineFormSchema({
        fields: [
          {
            key: 'phone',
            label: 'Phone',
            props: { defaultCountryCode: 'FR' },
            type: 'phone-number',
          },
        ],
      }),
    })
    const number = harness.field('phone').find('input[type="tel"]')

    await number.setValue('12')
    await harness.flush()
    expect(errorOf(harness, 'phone')).toBeUndefined()

    await harness.submit()
    expect(number.element).toHaveProperty('value', '12')
    expect(errorOf(harness, 'phone')).toBe('Numéro de téléphone incomplet')
    expect(harness.submitted).toHaveLength(0)

    await number.setValue('06 12 34 56 78')
    await harness.submit()
    expect(errorOf(harness, 'phone')).toBeUndefined()
    expect(harness.submitted.at(-1)?.value).toStrictEqual({ phone: '+33 6 12 34 56 78' })
    harness.unmount()
  })
})
