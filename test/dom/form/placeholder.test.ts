import { describe, expect, it } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'

import { mountForm } from './harness'

const teams = [
  {
    children: [{ label: 'Frontend', value: 'frontend' }],
    label: 'Engineering',
    value: 'engineering',
  },
] as const

describe('field placeholders', () => {
  it('renders no placeholder on controls that author none', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        { key: 'name', label: 'Nom', type: 'text' },
        { key: 'notes', label: 'Notes', type: 'textarea' },
        { key: 'amount', label: 'Montant', type: 'number' },
        { key: 'secret', label: 'Secret', type: 'password' },
        { key: 'labels', label: 'Étiquettes', type: 'tag' },
      ],
    })
    const harness = await mountForm({ schema })

    for (const key of ['name', 'notes', 'amount', 'secret', 'labels']) {
      expect(harness.control(key).attributes('placeholder')).toBeUndefined()
    }
    harness.unmount()
  })

  it('never falls back to a generic prompt in any locale', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [{ key: 'name', label: 'Nom', type: 'text' }],
    })
    const harness = await mountForm({ schema })

    expect(harness.wrapper.html()).not.toContain('Saisissez une valeur')
    expect(harness.wrapper.html()).not.toContain('Enter a value')
    harness.unmount()
  })

  it('renders an authored string placeholder', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        { key: 'email', label: 'E-mail', placeholder: 'prenom@exemple.fr', type: 'text' },
        { key: 'notes', label: 'Notes', placeholder: 'Contexte utile', type: 'textarea' },
      ],
    })
    const harness = await mountForm({ schema })

    expect(harness.control('email').attributes('placeholder')).toBe('prenom@exemple.fr')
    expect(harness.control('notes').attributes('placeholder')).toBe('Contexte utile')
    harness.unmount()
  })

  it('resolves a placeholder callback from the dependencies', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        { key: 'kind', label: 'Type', type: 'text' },
        {
          dependencies: ['kind'],
          key: 'reference',
          label: 'Référence',
          placeholder: ({ deps }) => (deps.get('kind') === 'invoice' ? 'FAC-0001' : 'DEV-0001'),
          type: 'text',
        },
      ],
    })
    const harness = await mountForm({ input: { kind: 'invoice' }, schema })

    expect(harness.control('reference').attributes('placeholder')).toBe('FAC-0001')
    await harness.setInput('kind', 'quote')
    expect(harness.control('reference').attributes('placeholder')).toBe('DEV-0001')
    harness.unmount()
  })

  it('leaves select and tree-select triggers empty until a placeholder is authored', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'plain',
          label: 'Sans invite',
          options: [{ label: 'Un', value: 'one' }],
          type: 'select',
        },
        {
          key: 'worded',
          label: 'Avec invite',
          options: [{ label: 'Un', value: 'one' }],
          placeholder: 'Choisir un élément',
          type: 'select',
        },
        { key: 'team', label: 'Équipe', options: teams, type: 'tree-select' },
        {
          key: 'unit',
          label: 'Unité',
          options: teams,
          placeholder: 'Choisir une unité',
          type: 'tree-select',
        },
      ],
    })
    const harness = await mountForm({ schema })

    const trigger = (path: string) => harness.field(path).find('[data-ui-trigger]').text().trim()
    expect(trigger('plain')).toBe('')
    expect(trigger('worded')).toBe('Choisir un élément')
    expect(trigger('team')).toBe('')
    expect(trigger('unit')).toBe('Choisir une unité')
    harness.unmount()
  })
})
