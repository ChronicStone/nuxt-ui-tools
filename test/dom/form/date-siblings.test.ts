import { describe, expect, it } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'

import { errorOf, mountForm } from './harness'

async function commitManualInput(
  control: ReturnType<typeof mountForm> extends Promise<infer T>
    ? T extends { control: (path: string) => infer C }
      ? C
      : never
    : never,
  value: string,
) {
  await control.setValue(value)
  await control.trigger('keydown.enter')
}

describe('date family siblings', () => {
  it('commits a manual datetime and clears it', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        { key: 'startsAt', label: 'Starts at', props: { clearable: true }, type: 'datetime' },
      ],
    })
    const harness = await mountForm({ schema })

    await commitManualInput(harness.control('startsAt'), '20/08/2026 14:35')
    expect(harness.form.state.get('startsAt')).toBe('2026-08-20T14:35')

    await harness.field('startsAt').find('[aria-label="Effacer la valeur"]').trigger('click')
    expect(harness.form.state.get('startsAt')).toBeNull()
    harness.unmount()
  })

  it('commits a manual date range in order and rejects a reversed one', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [{ key: 'window', label: 'Window', type: 'daterange' }],
    })
    const harness = await mountForm({ schema })

    await commitManualInput(harness.control('window'), '20/08/2026 – 25/08/2026')
    expect(harness.form.state.get('window')).toStrictEqual(['2026-08-20', '2026-08-25'])

    await commitManualInput(harness.control('window'), '25/08/2026 – 20/08/2026')
    expect(harness.form.state.get('window')).toStrictEqual(['2026-08-20', '2026-08-25'])
    harness.unmount()
  })

  it('commits a manual datetime range', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [{ key: 'session', label: 'Session', type: 'datetimerange' }],
    })
    const harness = await mountForm({ schema })

    await commitManualInput(harness.control('session'), '20/08/2026 09:00 – 20/08/2026 17:00')
    expect(harness.form.state.get('session')).toStrictEqual([
      '2026-08-20T09:00',
      '2026-08-20T17:00',
    ])
    harness.unmount()
  })

  it('commits a manual month and a manual month range', async () => {
    const monthSchema = defineFormSchema({
      actions: [],
      fields: [{ key: 'billingMonth', label: 'Billing month', type: 'month' }],
    })
    const monthHarness = await mountForm({ schema: monthSchema })
    await commitManualInput(monthHarness.control('billingMonth'), '08/2026')
    expect(monthHarness.form.state.get('billingMonth')).toBe('2026-08')
    monthHarness.unmount()

    const rangeSchema = defineFormSchema({
      actions: [],
      fields: [{ key: 'coverage', label: 'Coverage', type: 'monthrange' }],
    })
    const rangeHarness = await mountForm({ schema: rangeSchema })
    await commitManualInput(rangeHarness.control('coverage'), '08/2026 – 11/2026')
    expect(rangeHarness.form.state.get('coverage')).toStrictEqual(['2026-08', '2026-11'])
    rangeHarness.unmount()
  })

  it('commits a manual year within configured bounds', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [{ key: 'cohort', label: 'Cohort', props: { max: 2030, min: 2020 }, type: 'year' }],
    })
    const harness = await mountForm({ schema })

    await commitManualInput(harness.control('cohort'), '2027')
    expect(harness.form.state.get('cohort')).toBe('2027')
    harness.unmount()
  })

  it('silently ignores a manually entered date outside the min/max bounds', async () => {
    const schema = defineFormSchema({
      fields: [
        {
          key: 'appointment',
          label: 'Appointment',
          props: { max: '2026-12-31', min: '2026-01-01' },
          type: 'date',
        },
      ],
    })
    const harness = await mountForm({ input: { appointment: '2026-06-01' }, schema })

    await commitManualInput(harness.control('appointment'), '01/01/2027')
    expect(harness.form.state.get('appointment')).toBe('2026-06-01')
    harness.unmount()
  })

  it('flags a date outside min/max as invalid on submit when it reaches state through initial input', async () => {
    const schema = defineFormSchema({
      fields: [
        {
          key: 'appointment',
          label: 'Appointment',
          props: { max: '2026-12-31', min: '2026-01-01' },
          type: 'date',
        },
      ],
    })
    const harness = await mountForm({ input: { appointment: '2027-01-01' }, schema })

    await harness.submit()
    await harness.until(() =>
      harness.form.errors.value.some((error) => error.path === 'appointment'),
    )
    expect(errorOf(harness, 'appointment')).toBe('La date doit être au plus tard le 2026-12-31')
    harness.unmount()
  })
})
