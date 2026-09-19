import { describe, expect, it } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'

import { mountForm } from './harness'

describe('text parity props', () => {
  it('applies a pattern mask on input and can emit the raw value', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        { key: 'vat', label: 'TVA', mask: 'AA## ### ### ###', type: 'text' },
        { key: 'siren', label: 'SIREN', mask: '### ### ###', maskOutput: 'raw', type: 'text' },
      ],
    })
    const harness = await mountForm({ schema })

    await harness.setInput('vat', 'fr12345678901')
    expect(harness.form.state.get('vat')).toBe('FR12 345 678 901')

    await harness.setInput('siren', '123456789')
    expect(harness.form.state.get('siren')).toBe('123456789')
    const control = harness.control('siren').element
    expect(control instanceof HTMLInputElement ? control.value : null).toBe('123 456 789')
    harness.unmount()
  })

  it('renders prefix, suffix, and a clear button that empties the value', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          clearable: true,
          key: 'rate',
          label: 'Taux',
          prefix: '1 USD =',
          suffix: 'EUR',
          type: 'text',
        },
      ],
    })
    const harness = await mountForm({ input: { rate: '0.92' }, schema })

    expect(harness.field('rate').find('[data-form-prefix]').text()).toBe('1 USD =')
    expect(harness.field('rate').find('[data-form-suffix]').text()).toBe('EUR')
    await harness.field('rate').find('[data-form-clear]').trigger('click')
    expect(harness.form.state.get('rate')).toBeNull()
    harness.unmount()
  })
})

describe('field chrome parity props', () => {
  it('lays labels out on the left with a fixed width and renders description variants', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          description: { display: 'tooltip', text: 'Identifiant Evoliz' },
          key: 'erpId',
          label: 'ERP ID',
          layout: { labelPosition: 'left', labelWidth: 160 },
          type: 'text',
        },
        {
          description: { display: 'modal', text: 'Long explanation', title: 'VTEST' },
          key: 'vtestId',
          label: 'VTEST ID',
          type: 'text',
        },
        { description: 'Plain description', key: 'name', label: 'Nom', type: 'text' },
      ],
    })
    const harness = await mountForm({ schema })

    const erp = harness.field('erpId')
    expect(erp.find('[data-ui="UFormField"]').attributes('data-orientation')).toBe('horizontal')
    expect(erp.find('[data-form-description-tooltip]').exists()).toBeTruthy()
    expect(harness.field('vtestId').find('[data-form-description-modal]').exists()).toBeTruthy()
    expect(harness.field('name').find('[data-ui-description]').text()).toBe('Plain description')
    harness.unmount()
  })
})
