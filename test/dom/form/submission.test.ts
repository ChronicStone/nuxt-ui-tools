import { describe, expect, it, vi } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'
import type { FormObject } from '#ui-tools/form'
import { isNumber } from '#ui-tools/shared/utils/predicate'

import { deferred, errorOf, mountForm } from './harness'

describe('form submission', () => {
  it('blocks invalid submission and submits transformed output after correction', async () => {
    const onSubmit = vi.fn<() => boolean>(() => true)
    const schema = defineFormSchema({
      fields: [
        { key: 'name', label: 'Name', required: true, type: 'text' },
        {
          key: 'priceInCents',
          label: 'Price',
          transform: {
            input: (value) => (isNumber(value) ? value / 100 : null),
            output: (value) => Math.round((value ?? 0) * 100),
          },
          type: 'number',
        },
        { key: 'draftNote', label: 'Draft note', submit: { omit: true }, type: 'text' },
      ],
    })
    const harness = await mountForm({
      input: { draftNote: 'internal', name: '', priceInCents: 1250 },
      onSubmit,
      schema,
    })

    await harness.submit()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(errorOf(harness, 'name')).toBe('Ce champ est requis')
    await harness.until(() => document.activeElement === harness.control('name').element)
    expect(harness.control('priceInCents').element).toHaveProperty('value', '12.5')

    await harness.setInput('name', 'Recovered item')
    await harness.setInput('priceInCents', '20')
    await harness.submit()

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ formData: { name: 'Recovered item', priceInCents: 2000 } }),
    )
    harness.unmount()
  })

  it('disables the rendered form while a pre-submit check is pending', async () => {
    const check = deferred<boolean>()
    const onBeforeSubmit = vi.fn<() => Promise<boolean>>(() => check.promise)
    const onSubmit = vi.fn<() => boolean>(() => true)
    const schema = defineFormSchema({
      fields: [{ key: 'name', label: 'Name', required: true, type: 'text' }],
      onBeforeSubmit,
    })
    const harness = await mountForm({ input: { name: 'Ready' }, onSubmit, schema })

    const submitting = harness.wrapper.find('form').trigger('submit')
    await harness.until(() => onBeforeSubmit.mock.calls.length === 1)

    expect(harness.form.actionPending.value).toBe('submit')
    expect(harness.control('name').attributes('disabled')).toBeDefined()
    expect(harness.wrapper.get('button[type="submit"]').attributes('data-loading')).toBe('true')

    check.resolve(true)
    await submitting
    await harness.until(() => onSubmit.mock.calls.length === 1)
    expect(harness.form.actionPending.value).toBeNull()
    expect(harness.control('name').attributes('disabled')).toBeUndefined()
    harness.unmount()
  })

  it('keeps edited state visible when the submit handler rejects with a custom error', async () => {
    const onSubmit = vi.fn<
      (params: { api: { setError: (path: 'name', message: string) => void } }) => boolean
    >(({ api }) => {
      api.setError('name', 'The server rejected this name')
      return false
    })
    const schema = defineFormSchema({
      fields: [{ key: 'name', label: 'Name', type: 'text' }],
    })
    const harness = await mountForm({ input: { name: 'Original' }, onSubmit, schema })

    await harness.setInput('name', 'Rejected edit')
    await harness.submit()

    expect(harness.control('name').element).toHaveProperty('value', 'Rejected edit')
    expect(errorOf(harness, 'name')).toBe('The server rejected this name')
    expect(harness.form.isDirty.value).toBeTruthy()
    expect(harness.output()).toStrictEqual({ name: 'Rejected edit' })
    harness.unmount()
  })

  it('blocks the next submit while a blocking custom error stands, until the value changes', async () => {
    const onSubmit = vi.fn<() => boolean>(() => true)
    const schema = defineFormSchema({
      fields: [{ key: 'email', label: 'Email', type: 'text' }],
    })
    const harness = await mountForm({ input: { email: 'taken@exassess.com' }, onSubmit, schema })

    await harness.form.submit(({ api }) => {
      api.setError('email', 'Already registered', { blocking: true })
      return false
    })
    await harness.flush()
    expect(errorOf(harness, 'email')).toBe('Already registered')

    await harness.submit()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(errorOf(harness, 'email')).toBe('Already registered')

    await harness.setInput('email', 'free@exassess.com')
    expect(errorOf(harness, 'email')).toBeUndefined()
    await harness.submit()
    expect(onSubmit).toHaveBeenCalledOnce()
    harness.unmount()
  })

  it('lets a non-blocking custom error through submit', async () => {
    const onSubmit = vi.fn<() => boolean>(() => true)
    const schema = defineFormSchema({
      fields: [{ key: 'email', label: 'Email', type: 'text' }],
    })
    const harness = await mountForm({ input: { email: 'a@b.fr' }, onSubmit, schema })

    await harness.form.submit(({ api }) => {
      api.setError('email', 'Unusual domain')
      return false
    })
    await harness.flush()
    expect(errorOf(harness, 'email')).toBe('Unusual domain')

    await harness.submit()
    expect(onSubmit).toHaveBeenCalledOnce()
    harness.unmount()
  })

  it('waits for an async field rule and blocks submission until the value is accepted', async () => {
    const availability = deferred<boolean>()
    const checkAvailability = vi.fn<(value: string) => Promise<boolean>>((value) =>
      value === 'taken@exassess.com' ? availability.promise : Promise.resolve(true),
    )
    const onSubmit = vi.fn<() => boolean>(() => true)
    const schema = defineFormSchema({
      fields: [
        {
          key: 'email',
          label: 'Email',
          type: 'text',
          validation: {
            rules: [
              {
                message: 'This email is already used',
                name: 'available',
                validate: async ({ api }) => await checkAvailability(String(api.value.get() ?? '')),
              },
            ],
          },
        },
      ],
    })
    const harness = await mountForm({ input: { email: 'taken@exassess.com' }, onSubmit, schema })

    const submitting = harness.wrapper.find('form').trigger('submit')
    await harness.until(() => checkAvailability.mock.calls.length >= 1)
    expect(onSubmit).not.toHaveBeenCalled()

    availability.resolve(false)
    await submitting
    await harness.until(() => errorOf(harness, 'email') === 'This email is already used')
    expect(onSubmit).not.toHaveBeenCalled()

    await harness.setInput('email', 'available@exassess.com')
    await harness.submit()
    await harness.until(() => onSubmit.mock.calls.length === 1)
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        formData: { email: 'available@exassess.com' } satisfies FormObject,
      }),
    )
    harness.unmount()
  })
})
