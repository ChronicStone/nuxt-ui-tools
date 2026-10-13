import { describe, expect, it } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'

import { deferred, mountForm } from './harness'
import type { FormHarness } from './harness'

const accounts = [
  { label: 'Lycée Pasteur', value: 'pasteur' },
  { label: 'Centre Alpha', value: 'alpha' },
] as const

function reasonOf(harness: FormHarness, path: string) {
  const reason = harness.field(path).find('[data-form-disabled-reason]')
  return reason.exists() ? reason.text() : null
}

function dependentSchema() {
  return defineFormSchema({
    actions: [],
    fields: [
      { key: 'account', label: 'Compte', options: accounts, type: 'select' },
      {
        dependencies: ['account'],
        disabled: ({ deps }) => !deps.get('account'),
        disabledReason: "Choisissez d'abord un compte",
        key: 'center',
        label: 'Centre de test',
        options: accounts,
        type: 'select',
      },
    ],
  })
}

describe('disabled reason', () => {
  it('explains a dependent field only while it is disabled', async () => {
    const harness = await mountForm({ schema: dependentSchema() })

    expect(harness.control('center').attributes('disabled')).toBeDefined()
    expect(reasonOf(harness, 'center')).toBe("Choisissez d'abord un compte")
    expect(
      harness.field('center').find('[data-form-disabled-reason] [data-ui="UIcon"]').exists(),
    ).toBeTruthy()
    expect(reasonOf(harness, 'account')).toBeNull()

    harness.form.state.set('account', 'pasteur')
    await harness.flush()

    expect(harness.control('center').attributes('disabled')).toBeUndefined()
    expect(reasonOf(harness, 'center')).toBeNull()
    harness.unmount()
  })

  it('shows the reason again when the field becomes disabled', async () => {
    const harness = await mountForm({ input: { account: 'alpha' }, schema: dependentSchema() })
    expect(reasonOf(harness, 'center')).toBeNull()

    harness.form.state.set('account', null)
    await harness.flush()

    expect(reasonOf(harness, 'center')).toBe("Choisissez d'abord un compte")
    harness.unmount()
  })

  it('resolves a reason callback from the dependencies', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        { key: 'plan', label: 'Offre', options: accounts, type: 'select' },
        {
          dependencies: ['plan'],
          disabled: ({ deps }) => deps.get('plan') !== 'alpha',
          disabledReason: ({ deps }) =>
            deps.get('plan')
              ? `Indisponible avec l'offre ${String(deps.get('plan'))}`
              : 'Choisissez une offre',
          key: 'quota',
          label: 'Quota',
          type: 'text',
        },
      ],
    })
    const harness = await mountForm({ schema })
    expect(reasonOf(harness, 'quota')).toBe('Choisissez une offre')

    harness.form.state.set('plan', 'pasteur')
    await harness.flush()
    expect(reasonOf(harness, 'quota')).toBe("Indisponible avec l'offre pasteur")
    harness.unmount()
  })

  it('shows nothing when the callback returns no reason', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          disabled: () => true,
          disabledReason: () => undefined,
          key: 'locked',
          label: 'Verrouillé',
          type: 'text',
        },
      ],
    })
    const harness = await mountForm({ schema })

    expect(harness.control('locked').attributes('disabled')).toBeDefined()
    expect(reasonOf(harness, 'locked')).toBeNull()
    harness.unmount()
  })

  it('never shows a reason for a field the author did not disable', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        { disabledReason: 'Pas affiché', key: 'free', label: 'Libre', type: 'text' },
        {
          disabled: () => false,
          disabledReason: 'Pas affiché non plus',
          key: 'open',
          label: 'Ouvert',
          type: 'text',
        },
      ],
    })
    const harness = await mountForm({ schema })

    expect(reasonOf(harness, 'free')).toBeNull()
    expect(reasonOf(harness, 'open')).toBeNull()
    harness.unmount()
  })

  it('does not explain engine-driven disabling while an action is pending', async () => {
    const pending = deferred<{ success: boolean }>()
    const schema = defineFormSchema({
      actions: [{ key: 'submit' }],
      fields: [
        {
          disabledReason: 'Pas affiché',
          disabled: () => false,
          key: 'name',
          label: 'Nom',
          type: 'text',
        },
      ],
    })
    const harness = await mountForm({
      onSubmit: () => pending.promise,
      schema,
    })

    const submitting = harness.submit()
    await harness.until(() => harness.form.actionPending.value !== null)

    expect(harness.control('name').attributes('disabled')).toBeDefined()
    expect(reasonOf(harness, 'name')).toBeNull()

    pending.resolve({ success: true })
    await submitting
    harness.unmount()
  })

  it('keeps the help copy and adds the reason under it', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          disabled: () => true,
          disabledReason: 'Réservé aux comptes clients',
          help: 'Le centre rattaché au compte',
          key: 'center',
          label: 'Centre',
          type: 'text',
        },
      ],
    })
    const harness = await mountForm({ schema })
    const help = harness.field('center').find('[data-ui-help]')

    expect(help.text()).toContain('Le centre rattaché au compte')
    expect(help.text()).toContain('Réservé aux comptes clients')
    expect(reasonOf(harness, 'center')).toBe('Réservé aux comptes clients')
    harness.unmount()
  })

  it('explains a disabled checkbox that renders its label inline', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          disabled: () => true,
          disabledReason: 'Activez d’abord les notifications',
          key: 'digest',
          label: 'Résumé hebdomadaire',
          type: 'checkbox',
        },
      ],
    })
    const harness = await mountForm({ schema })

    expect(reasonOf(harness, 'digest')).toBe('Activez d’abord les notifications')
    harness.unmount()
  })

  it('merges the field UI slots into the reason and its icon', async () => {
    const harness = await mountForm({
      schema: dependentSchema(),
      ui: { field: { ui: { disabledReason: 'text-warning', disabledReasonIcon: 'text-error' } } },
    })
    const reason = harness.field('center').find('[data-form-disabled-reason]')

    expect(reason.classes()).toContain('text-warning')
    expect(reason.find('[data-ui="UIcon"]').classes()).toContain('text-error')
    harness.unmount()
  })
})
