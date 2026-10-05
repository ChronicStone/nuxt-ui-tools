import { describe, expect, it } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'

import { mountForm } from './harness'

describe('choice group variants', () => {
  it('renders the table variant as joined rows instead of a plain list', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'role',
          label: 'Rôle',
          options: [
            { description: 'Tout le métier', label: 'Administrateur', value: 'ADMINISTRATOR' },
            { description: 'Consulte sans modifier', label: 'Lecture seule', value: 'VIEWER' },
          ],
          props: { variant: 'table' },
          type: 'radio',
        },
      ],
    })
    const harness = await mountForm({ schema })

    expect(harness.field('role').find('[data-ui="URadioGroup"]').attributes('data-variant')).toBe(
      'table',
    )
    harness.unmount()
  })

  it('renders the table variant of a checkbox group as joined rows', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'spaces',
          label: 'Espaces',
          options: [
            { label: 'Administration', value: 'ADMIN' },
            { label: 'Client', value: 'CLIENT' },
          ],
          props: { variant: 'table' },
          type: 'checkbox-group',
        },
      ],
    })
    const harness = await mountForm({ schema })

    expect(
      harness.field('spaces').find('[data-ui="UCheckboxGroup"]').attributes('data-variant'),
    ).toBe('table')
    harness.unmount()
  })
})
