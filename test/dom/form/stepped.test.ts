import { describe, expect, it, vi } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'
import type { FormObject } from '#ui-tools/form'

import { deferred, errorOf, mountForm } from './harness'

describe('stepped forms', () => {
  it('blocks invalid and rejected step transitions before advancing', async () => {
    const check = deferred<boolean>()
    let canAdvance = false
    const onBeforeNext = vi.fn<
      (params: { api: { setError: (path: string, message: string) => void } }) => Promise<boolean>
    >(async ({ api }) => {
      await check.promise
      if (canAdvance) {
        return true
      }
      api.setError('email', 'This email cannot continue')
      return false
    })
    const schema = defineFormSchema({
      onBeforeNext,
      steps: [
        {
          actions: [{ key: 'next' }],
          fields: [{ key: 'email', label: 'Email', required: true, type: 'text' }],
          key: 'account',
        },
        {
          actions: [{ key: 'previous' }, { key: 'submit' }],
          fields: [{ key: 'code', label: 'Code', type: 'text' }],
          key: 'verification',
        },
      ],
    })
    const harness = await mountForm({ schema })

    await harness.button('Suivant').trigger('click')
    await harness.until(() => errorOf(harness, 'email') === 'Ce champ est requis')
    expect(onBeforeNext).not.toHaveBeenCalled()

    await harness.setInput('email', 'blocked@exassess.fr')
    const advancing = harness.button('Suivant').trigger('click')
    await harness.until(() => onBeforeNext.mock.calls.length === 1)
    expect(harness.form.actionPending.value).toBe('next')
    expect(harness.control('email').attributes('disabled')).toBeDefined()

    check.resolve(true)
    await advancing
    await harness.until(() => errorOf(harness, 'email') === 'This email cannot continue')
    expect(harness.wrapper.find('[data-form-field="code"]').exists()).toBeFalsy()

    canAdvance = true
    await harness.setInput('email', 'allowed@exassess.fr')
    await harness.button('Suivant').trigger('click')
    await harness.until(() => harness.wrapper.find('[data-form-field="code"]').exists())
    expect(harness.wrapper.find('[data-form-field="email"]').exists()).toBeFalsy()
    harness.unmount()
  })

  it('preserves rooted step values across previous navigation and final submission', async () => {
    const onBeforePrevious = vi.fn<(params: { formData: FormObject; stepIndex: number }) => void>()
    const onSubmit = vi.fn<() => boolean>(() => true)
    const schema = defineFormSchema({
      onBeforePrevious,
      steps: [
        {
          actions: [{ key: 'next' }],
          fields: [{ key: 'name', label: 'Name', type: 'text' }],
          root: 'identity',
        },
        {
          actions: [{ key: 'previous' }, { key: 'submit' }],
          fields: [{ key: 'slot', label: 'Slot', type: 'text' }],
          root: 'schedule',
        },
      ],
    })
    const harness = await mountForm({
      input: { identity: { name: 'Original' }, schedule: { slot: 'Morning' } },
      onSubmit,
      schema,
    })

    await harness.setInput('identity.name', 'Edited')
    await harness.button('Suivant').trigger('click')
    await harness.until(() => harness.wrapper.find('[data-form-field="schedule.slot"]').exists())
    await harness.setInput('schedule.slot', 'Afternoon')
    await harness.button('Précédent').trigger('click')
    await harness.until(() => harness.wrapper.find('[data-form-field="identity.name"]').exists())

    expect(harness.control('identity.name').element).toHaveProperty('value', 'Edited')
    expect(onBeforePrevious).toHaveBeenCalledWith(
      expect.objectContaining({
        formData: { identity: { name: 'Edited' }, schedule: { slot: 'Afternoon' } },
        stepIndex: 1,
      }),
    )

    await harness.button('Suivant').trigger('click')
    await harness.until(() => harness.wrapper.find('[data-form-field="schedule.slot"]').exists())
    await harness.submit()
    await harness.until(() => onSubmit.mock.calls.length === 1)
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        formData: { identity: { name: 'Edited' }, schedule: { slot: 'Afternoon' } },
      }),
    )
    harness.unmount()
  })

  it('skips conditional steps in both navigation directions', async () => {
    const onStepSkipped = vi.fn<(params: { stepIndex: number }) => void>()
    const schema = defineFormSchema({
      onStepSkipped,
      skipStep: ({ formData, stepIndex }) => stepIndex === 1 && formData.mode === 'express',
      steps: [
        { actions: [{ key: 'next' }], fields: [{ key: 'mode', type: 'text' }] },
        {
          actions: [{ key: 'previous' }, { key: 'next' }],
          fields: [{ key: 'details', type: 'text' }],
        },
        {
          actions: [{ key: 'previous' }, { key: 'submit' }],
          fields: [{ key: 'confirmation', type: 'text' }],
        },
      ],
    })
    const harness = await mountForm({ input: { mode: 'express' }, onSubmit: () => true, schema })

    await harness.button('Suivant').trigger('click')
    await harness.until(() => harness.wrapper.find('[data-form-field="confirmation"]').exists())
    expect(harness.wrapper.find('[data-form-field="details"]').exists()).toBeFalsy()
    expect(onStepSkipped).toHaveBeenLastCalledWith(expect.objectContaining({ stepIndex: 1 }))

    await harness.button('Précédent').trigger('click')
    await harness.until(() => harness.wrapper.find('[data-form-field="mode"]').exists())
    expect(onStepSkipped).toHaveBeenCalledTimes(2)
    harness.unmount()
  })
})
