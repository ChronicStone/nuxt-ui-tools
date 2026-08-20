import { describe, expect, it } from 'vitest'
import { nextTick, reactive } from 'vue'

import type { FormFieldApi, FormObject } from '#ui-tools/form'
import { defineFormSchema } from '#ui-tools/form'

import { useFormValidation } from '../../src/runtime/form/composables/use-form-validation'
import { getPathValue } from '../../src/runtime/shared/utils/path'

function createApiFactory(state: FormObject) {
  return (path: readonly string[]): FormFieldApi => ({
    value: {
      get: () => getPathValue(state, path),
      set: () => {},
      reset: () => {},
    },
    context: {
      get: () => ({ value: undefined }),
      set: () => {},
      update: () => {},
      patch: () => {},
      refresh: async () => {},
      refreshAll: async () => {},
    },
    options: {
      get: () => [],
      add: () => {},
      pending: () => false,
      fetching: () => false,
      loading: () => false,
      creating: () => false,
      refreshable: () => false,
      error: () => null,
      refresh: async () => {},
      create: async () => null,
    },
    upload: {
      start: async () => {},
      cancel: async () => {},
      retry: async () => {},
      remove: async () => {},
    },
    validation: {
      validate: async () => true,
      pending: () => false,
      setError: () => {},
      clearError: () => {},
    },
    focus: async () => true,
  })
}

describe('Regle-owned form validation', () => {
  it('runs required and callback rules through the Regle tree', async () => {
    const schema = defineFormSchema({
      fields: [
        {
          key: 'email',
          type: 'text',
          validation: {
            required: true,
            rules: [
              {
                name: 'domain',
                validate: ({ api }) =>
                  api.value.get() === 'ada@example.com' || 'Use the Ada example address.',
              },
            ],
          },
        },
      ],
    })
    const state = reactive<FormObject>({ email: '' })
    const validation = useFormValidation({
      schema: () => schema,
      state,
      context: {},
      apiFactory: createApiFactory(state),
      getValidationMode: () => true,
    })

    validation.markTouched(['email'])
    expect(await validation.validate()).toBe(false)
    expect(validation.isPending(['email'])).toBe(false)
    expect(validation.getFieldError(['email'])).toBe('This field is required.')

    state.email = 'invalid@example.com'
    expect(await validation.validate()).toBe(false)
    expect(validation.getFieldError(['email'])).toBe('Use the Ada example address.')

    state.email = 'ada@example.com'
    expect(await validation.validate()).toBe(true)
    expect(validation.getFieldError(['email'])).toBeUndefined()
  })

  it('maps dotted field keys onto nested Regle state paths', async () => {
    const schema = defineFormSchema({
      fields: [
        {
          key: 'profile.firstName',
          type: 'text',
          validation: { required: true },
        },
        {
          key: 'profile.lastName',
          type: 'text',
          validation: { required: true },
        },
      ],
    })
    const state = reactive<FormObject>({ profile: { firstName: '', lastName: '' } })
    const validation = useFormValidation({
      schema: () => schema,
      state,
      context: {},
      apiFactory: createApiFactory(state),
      getValidationMode: () => true,
    })

    expect(await validation.validate()).toBe(false)
    expect(validation.getFieldError(['profile.firstName'])).toBe('This field is required.')
    expect(validation.getFieldError(['profile.lastName'])).toBe('This field is required.')
  })

  it('maps rooted step fields onto their nested Regle state path', async () => {
    const schema = defineFormSchema({
      steps: [
        {
          key: 'profile',
          root: 'profile',
          fields: [{ key: 'firstName', type: 'text', validation: { required: true } }],
        },
      ],
    })
    const state = reactive<FormObject>({ profile: { firstName: '' } })
    const validation = useFormValidation({
      schema: () => schema,
      state,
      context: {},
      apiFactory: createApiFactory(state),
      getValidationMode: () => true,
    })

    expect(await validation.validateFields(schema.steps[0].fields, ['profile'])).toBe(false)
    expect(validation.getFieldError(['profile', 'firstName'])).toBe('This field is required.')
  })

  it('maps native Regle collection errors back to array item paths', async () => {
    const schema = defineFormSchema({
      fields: [
        {
          key: 'contacts',
          type: 'array-list',
          fields: [
            {
              key: 'email',
              type: 'text',
              validation: { required: true },
            },
          ],
        },
      ],
    })
    const state = reactive<FormObject>({ contacts: [{}] })
    const validation = useFormValidation({
      schema: () => schema,
      state,
      context: {},
      apiFactory: createApiFactory(state),
      getValidationMode: () => true,
    })

    validation.markTouched(['contacts', '0', 'email'])
    expect(await validation.validate()).toBe(false)
    expect(validation.getFieldError(['contacts', '0', 'email'])).toBe('This field is required.')

    state.contacts = [{ email: 'ada@example.com' }]
    expect(await validation.validate()).toBe(true)
    expect(validation.getFieldError(['contacts', '0', 'email'])).toBeUndefined()
  })

  it('keeps step validation scoped when a later step is invalid', async () => {
    const schema = defineFormSchema({
      steps: [
        { key: 'account', fields: [{ key: 'name', type: 'text', validation: { required: true } }] },
        {
          key: 'details',
          fields: [{ key: 'description', type: 'text', validation: { required: true } }],
        },
      ],
    })
    const state = reactive<FormObject>({ name: 'Ada', description: '' })
    const validation = useFormValidation({
      schema: () => schema,
      state,
      context: {},
      apiFactory: createApiFactory(state),
      getValidationMode: () => true,
    })

    expect(await validation.validateFields(schema.steps[0].fields, [])).toBe(true)
    expect(validation.getFieldError(['description'])).toBeUndefined()
  })

  it('awaits async rules and resolves cross-field dependencies through Regle', async () => {
    let availabilityCheckResolved = false
    const schema = defineFormSchema({
      fields: [
        {
          key: 'email',
          type: 'text',
          validation: { required: true },
        },
        {
          key: 'emailConfirmation',
          type: 'text',
          dependencies: [['email', 'email']],
          validation: {
            rules: [
              {
                name: 'matches-email',
                validate: ({ api, deps }) =>
                  api.value.get() === Object.getOwnPropertyDescriptor(deps, 'email')?.value ||
                  'Email addresses do not match.',
              },
            ],
          },
        },
        {
          key: 'handle',
          type: 'text',
          validation: {
            rules: [
              {
                name: 'available-handle',
                message: 'This handle is already registered.',
                validate: async () => {
                  await new Promise<void>((resolve) => setTimeout(resolve, 10))
                  availabilityCheckResolved = true
                  return false
                },
              },
            ],
          },
        },
      ],
    })
    const state = reactive<FormObject>({
      email: 'ada@example.com',
      emailConfirmation: 'different@example.com',
      handle: 'ada',
    })
    const validation = useFormValidation({
      schema: () => schema,
      state,
      context: {},
      apiFactory: createApiFactory(state),
      getValidationMode: () => true,
    })

    const pendingValidation = validation.validate()
    expect(availabilityCheckResolved).toBe(false)
    expect(await pendingValidation).toBe(false)
    expect(availabilityCheckResolved).toBe(true)
    expect(validation.getFieldError(['emailConfirmation'])).toBe('Email addresses do not match.')
    expect(validation.getFieldError(['handle'])).toBe('This handle is already registered.')
  })

  it('exposes Regle pending state per nested array field without revealing errors early', async () => {
    let resolveAvailability: () => void = () => {}
    const availability = new Promise<void>((resolve) => {
      resolveAvailability = resolve
    })
    const schema = defineFormSchema({
      fields: [
        {
          key: 'contacts',
          type: 'array-list',
          fields: [
            {
              key: 'email',
              type: 'text',
              validation: {
                rules: [
                  {
                    name: 'available-email',
                    message: 'This email is already registered.',
                    validate: async () => {
                      await availability
                      return false
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    })
    const state = reactive<FormObject>({ contacts: [{ email: 'ada@example.com' }] })
    const validation = useFormValidation({
      schema: () => schema,
      state,
      context: {},
      apiFactory: createApiFactory(state),
      getValidationMode: () => true,
    })

    const pendingValidation = validation.validateFields(schema.fields, [])
    await nextTick()
    expect(validation.isPending(['contacts', '0', 'email'])).toBe(true)
    expect(validation.getFieldError(['contacts', '0', 'email'])).toBeUndefined()

    resolveAvailability()
    expect(await pendingValidation).toBe(false)
    expect(validation.isPending(['contacts', '0', 'email'])).toBe(false)
    expect(validation.getFieldError(['contacts', '0', 'email'])).toBe(
      'This email is already registered.',
    )
  })

  it('clears field pending state after a stale validation run is superseded', async () => {
    const gates = [deferredPromise(), deferredPromise()]
    let runIndex = 0
    const schema = defineFormSchema({
      fields: [
        {
          key: 'handle',
          type: 'text',
          validation: {
            rules: [
              {
                name: 'available-handle',
                validate: async () => {
                  const gate = gates[runIndex++]
                  await gate.promise
                  return true
                },
              },
            ],
          },
        },
      ],
    })
    const state = reactive<FormObject>({ handle: 'ada' })
    const validation = useFormValidation({
      schema: () => schema,
      state,
      context: {},
      apiFactory: createApiFactory(state),
      getValidationMode: () => true,
    })

    const firstRun = validation.validateFields(schema.fields, [])
    await nextTick()
    expect(validation.isPending(['handle'])).toBe(true)

    const secondRun = validation.validateFields(schema.fields, [])
    await nextTick()
    expect(validation.isPending(['handle'])).toBe(true)

    gates[0].resolve()
    gates[1].resolve()
    await Promise.all([firstRun, secondRun])
    expect(validation.isPending(['handle'])).toBe(false)
  })
})

function deferredPromise() {
  let resolve: () => void = () => {}
  const promise = new Promise<void>((nextResolve) => {
    resolve = nextResolve
  })
  return { promise, resolve }
}
