import { describe, expect, it } from 'vitest'
import { nextTick, reactive } from 'vue'

import type { FormFieldApi, FormObject } from '#ui-tools/form'
import { defineFormSchema } from '#ui-tools/form'

import { useFormValidation } from '../../src/runtime/form/composables/use-form-validation'
import { getPathValue } from '../../src/runtime/shared/utils/path'

function createApiFactory(state: FormObject) {
  return (path: readonly string[]): FormFieldApi => ({
    context: {
      get: () => ({ value: undefined }),
      patch: () => {},
      refresh: async () => {},
      refreshAll: async () => {},
      set: () => {},
      update: () => {},
    },
    focus: async () => true,
    options: {
      activate: () => {},
      add: () => {},
      create: () => Promise.resolve(null),
      creating: () => false,
      error: () => null,
      fetching: () => false,
      get: () => [],
      hasMore: () => false,
      loadMore: () => Promise.resolve(),
      loading: () => false,
      pending: () => false,
      refresh: () => Promise.resolve(),
      refreshable: () => false,
      remote: () => false,
      retry: () => Promise.resolve(),
      search: () => '',
      selected: () => [],
      setSearch: () => {},
    },
    upload: {
      cancel: async () => {},
      remove: async () => {},
      retry: async () => {},
      start: async () => {},
    },
    form: {
      clearError: () => {},
      focus: () => Promise.resolve(false),
      get: () => null,
      initial: () => null,
      nextStep: () => Promise.resolve(false),
      output: () => ({}),
      previousStep: () => Promise.resolve(false),
      reset: () => Promise.resolve(),
      set: () => {},
      setError: () => {},
      state: () => ({}),
      submit: () => Promise.resolve(false),
      validate: () => Promise.resolve(true),
    },
    validation: {
      clearError: () => {},
      pending: () => false,
      setError: () => {},
      validate: async () => true,
    },
    value: {
      get: () => getPathValue(state, path),
      initial: () => getPathValue(state, path),
      reset: () => {},
      set: () => {},
    },
  })
}

describe('Regle-owned form validation', () => {
  it('accepts native Regle validators at the field boundary', async () => {
    const { email } = await import('@regle/rules')
    const schema = defineFormSchema({
      fields: [
        {
          key: 'email',
          required: true,
          type: 'text',
          validators: {
            email,
          },
        },
      ],
    })
    const state = reactive<FormObject>({ email: 'invalid' })
    const validation = useFormValidation({
      apiFactory: createApiFactory(state),
      context: {},
      getValidationMode: () => true,
      schema: () => schema,
      state,
    })

    await expect(validation.validate()).resolves.toBeFalsy()
    expect(validation.getFieldError(['email'])).toBe('The value must be a valid email address')

    state.email = 'ada@example.com'
    await expect(validation.validate()).resolves.toBeTruthy()
  })

  it('keeps custom errors visible and only blocks validation when asked to', async () => {
    const schema = defineFormSchema({
      fields: [{ key: 'email', type: 'text' }],
    })
    const state = reactive<FormObject>({ email: 'ada@example.com' })
    const validation = useFormValidation({
      apiFactory: createApiFactory(state),
      context: {},
      getValidationMode: () => true,
      schema: () => schema,
      state,
    })

    validation.setError(['email'], 'Double-check this address.')

    expect(validation.getFieldError(['email'])).toBe('Double-check this address.')
    expect(validation.errors.value).toStrictEqual([
      { blocking: false, message: 'Double-check this address.', path: 'email' },
    ])
    await expect(validation.validate()).resolves.toBeTruthy()
    await expect(validation.validateFields(schema.fields, [])).resolves.toBeTruthy()

    validation.setError(['email'], 'This email is already registered.', { blocking: true })

    expect(validation.getFieldError(['email'])).toBe('This email is already registered.')
    await expect(validation.validate()).resolves.toBeFalsy()
    await expect(validation.validateFields(schema.fields, [])).resolves.toBeFalsy()
  })

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
      apiFactory: createApiFactory(state),
      context: {},
      getValidationMode: () => true,
      schema: () => schema,
      state,
    })

    validation.markTouched(['email'])
    await expect(validation.validate()).resolves.toBeFalsy()
    expect(validation.isPending(['email'])).toBeFalsy()
    expect(validation.getFieldError(['email'])).toBe('This field is required.')

    state.email = 'invalid@example.com'
    await expect(validation.validate()).resolves.toBeFalsy()
    expect(validation.getFieldError(['email'])).toBe('Use the Ada example address.')

    state.email = 'ada@example.com'
    await expect(validation.validate()).resolves.toBeTruthy()
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
      apiFactory: createApiFactory(state),
      context: {},
      getValidationMode: () => true,
      schema: () => schema,
      state,
    })

    await expect(validation.validate()).resolves.toBeFalsy()
    expect(validation.getFieldError(['profile.firstName'])).toBe('This field is required.')
    expect(validation.getFieldError(['profile.lastName'])).toBe('This field is required.')
  })

  it('maps rooted step fields onto their nested Regle state path', async () => {
    const schema = defineFormSchema({
      steps: [
        {
          fields: [{ key: 'firstName', type: 'text', validation: { required: true } }],
          key: 'profile',
          root: 'profile',
        },
      ],
    })
    const state = reactive<FormObject>({ profile: { firstName: '' } })
    const validation = useFormValidation({
      apiFactory: createApiFactory(state),
      context: {},
      getValidationMode: () => true,
      schema: () => schema,
      state,
    })

    await expect(
      validation.validateFields(schema.steps[0].fields, ['profile']),
    ).resolves.toBeFalsy()
    expect(validation.getFieldError(['profile', 'firstName'])).toBe('This field is required.')
  })

  it('maps native Regle collection errors back to array item paths', async () => {
    const schema = defineFormSchema({
      fields: [
        {
          fields: [
            {
              key: 'email',
              type: 'text',
              validation: { required: true },
            },
          ],
          key: 'contacts',
          type: 'array-list',
        },
      ],
    })
    const state = reactive<FormObject>({ contacts: [{}] })
    const validation = useFormValidation({
      apiFactory: createApiFactory(state),
      context: {},
      getValidationMode: () => true,
      schema: () => schema,
      state,
    })

    validation.markTouched(['contacts', '0', 'email'])
    await expect(validation.validate()).resolves.toBeFalsy()
    expect(validation.getFieldError(['contacts', '0', 'email'])).toBe('This field is required.')

    state.contacts = [{ email: 'ada@example.com' }]
    await expect(validation.validate()).resolves.toBeTruthy()
    expect(validation.getFieldError(['contacts', '0', 'email'])).toBeUndefined()
  })

  it('keeps step validation scoped when a later step is invalid', async () => {
    const schema = defineFormSchema({
      steps: [
        { fields: [{ key: 'name', type: 'text', validation: { required: true } }], key: 'account' },
        {
          fields: [{ key: 'description', type: 'text', validation: { required: true } }],
          key: 'details',
        },
      ],
    })
    const state = reactive<FormObject>({ description: '', name: 'Ada' })
    const validation = useFormValidation({
      apiFactory: createApiFactory(state),
      context: {},
      getValidationMode: () => true,
      schema: () => schema,
      state,
    })

    await expect(validation.validateFields(schema.steps[0].fields, [])).resolves.toBeTruthy()
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
          dependencies: [['email', 'email']],
          key: 'emailConfirmation',
          type: 'text',
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
                message: 'This handle is already registered.',
                name: 'available-handle',
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
      apiFactory: createApiFactory(state),
      context: {},
      getValidationMode: () => true,
      schema: () => schema,
      state,
    })

    const pendingValidation = validation.validate()
    expect(availabilityCheckResolved).toBeFalsy()
    await expect(pendingValidation).resolves.toBeFalsy()
    expect(availabilityCheckResolved).toBeTruthy()
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
          fields: [
            {
              key: 'email',
              type: 'text',
              validation: {
                rules: [
                  {
                    message: 'This email is already registered.',
                    name: 'available-email',
                    validate: async () => {
                      await availability
                      return false
                    },
                  },
                ],
              },
            },
          ],
          key: 'contacts',
          type: 'array-list',
        },
      ],
    })
    const state = reactive<FormObject>({ contacts: [{ email: 'ada@example.com' }] })
    const validation = useFormValidation({
      apiFactory: createApiFactory(state),
      context: {},
      getValidationMode: () => true,
      schema: () => schema,
      state,
    })

    const pendingValidation = validation.validateFields(schema.fields, [])
    await nextTick()
    expect(validation.isPending(['contacts', '0', 'email'])).toBeTruthy()
    expect(validation.getFieldError(['contacts', '0', 'email'])).toBeUndefined()

    resolveAvailability()
    await expect(pendingValidation).resolves.toBeFalsy()
    expect(validation.isPending(['contacts', '0', 'email'])).toBeFalsy()
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
                  const gate = gates[runIndex]
                  runIndex += 1
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
      apiFactory: createApiFactory(state),
      context: {},
      getValidationMode: () => true,
      schema: () => schema,
      state,
    })

    const firstRun = validation.validateFields(schema.fields, [])
    await nextTick()
    expect(validation.isPending(['handle'])).toBeTruthy()

    const secondRun = validation.validateFields(schema.fields, [])
    await nextTick()
    expect(validation.isPending(['handle'])).toBeTruthy()

    gates[0].resolve()
    gates[1].resolve()
    await Promise.all([firstRun, secondRun])
    expect(validation.isPending(['handle'])).toBeFalsy()
  })
})

function deferredPromise() {
  let resolve: () => void = () => {}
  const promise = new Promise<void>((nextResolve) => {
    resolve = nextResolve
  })
  return { promise, resolve }
}
