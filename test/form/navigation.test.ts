import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { describe, expect, it, vi } from 'vitest'
import { computed, createApp, effectScope, nextTick } from 'vue'

import { defineFormSchema } from '#ui-tools/form'

import { useFormRuntime } from '../../src/runtime/form/composables/use-form-runtime'

function deferred() {
  let resolve: () => void = () => {}
  const promise = new Promise<void>((nextResolve) => {
    resolve = nextResolve
  })
  return { promise, resolve }
}

function deferredResult<TValue>() {
  let resolve: (value: TValue) => void = () => {}
  const promise = new Promise<TValue>((nextResolve) => {
    resolve = nextResolve
  })
  return { promise, resolve }
}

describe('form step navigation', () => {
  it('keeps scoped async validation and the next hook pending as one transaction', async () => {
    const validationGate = deferred()
    const nextGate = deferred()
    const previousGate = deferred()
    const schema = computed(() =>
      defineFormSchema({
        onBeforeNext: async () => {
          await nextGate.promise
          return true
        },
        onBeforePrevious: async () => {
          await previousGate.promise
        },
        steps: [
          {
            fields: [
              {
                key: 'name',
                type: 'text',
                validation: {
                  rules: [
                    {
                      name: 'available-name',
                      validate: async () => {
                        await validationGate.promise
                        return true
                      },
                    },
                  ],
                },
              },
            ],
            key: 'identity',
          },
          { fields: [{ key: 'notes', type: 'textarea' }], key: 'details' },
        ],
      }),
    )
    const app = createApp({})
    app.use(VueQueryPlugin, { queryClient: new QueryClient() })
    const scope = effectScope()
    const runtime = app.runWithContext(() => scope.run(() => useFormRuntime({ schema })))
    if (!runtime) {
      throw new Error('Failed to create form runtime')
    }

    const nextRequest = runtime.nextStep()
    await nextTick()
    expect(runtime.actionPending.value).toBe('next')
    expect(runtime.getFieldApi(['name']).validation.pending()).toBeTruthy()
    expect(runtime.errors.value).toHaveLength(0)
    await expect(runtime.nextStep()).resolves.toBeFalsy()

    validationGate.resolve()
    await nextTick()
    expect(runtime.actionPending.value).toBe('next')

    nextGate.resolve()
    await expect(nextRequest).resolves.toBeTruthy()
    expect(runtime.currentStepIndex.value).toBe(1)
    expect(runtime.actionPending.value).toBeNull()
    expect(runtime.getFieldApi(['name']).validation.pending()).toBeFalsy()

    const previousRequest = runtime.previousStep()
    await nextTick()
    expect(runtime.actionPending.value).toBe('previous')
    await expect(runtime.previousStep()).resolves.toBeFalsy()

    previousGate.resolve()
    await expect(previousRequest).resolves.toBeTruthy()
    expect(runtime.currentStepIndex.value).toBe(0)
    expect(runtime.actionPending.value).toBeNull()
    scope.stop()
  })

  it('clears navigation pending when the async before-next hook cancels', async () => {
    const nextGate = deferredResult<boolean>()
    const schema = computed(() =>
      defineFormSchema({
        onBeforeNext: async () => nextGate.promise,
        steps: [
          { fields: [{ key: 'name', type: 'text' }], key: 'identity' },
          { fields: [{ key: 'notes', type: 'textarea' }], key: 'details' },
        ],
      }),
    )
    const app = createApp({})
    app.use(VueQueryPlugin, { queryClient: new QueryClient() })
    const scope = effectScope()
    const runtime = app.runWithContext(() => scope.run(() => useFormRuntime({ schema })))
    if (!runtime) {
      throw new Error('Failed to create form runtime')
    }

    const nextRequest = runtime.nextStep()
    await nextTick()
    expect(runtime.actionPending.value).toBe('next')

    nextGate.resolve(false)
    await expect(nextRequest).resolves.toBeFalsy()
    expect(runtime.currentStepIndex.value).toBe(0)
    expect(runtime.actionPending.value).toBeNull()
    scope.stop()
  })

  it('reveals every invalid field in the active step after async validation settles', async () => {
    const handleGate = deferredResult<boolean>()
    const schema = computed(() =>
      defineFormSchema({
        steps: [
          {
            fields: [
              { key: 'fullName', type: 'text', validation: { required: true } },
              { key: 'email', type: 'text', validation: { required: true } },
              {
                fields: [{ key: 'name', type: 'text', validation: { required: true } }],
                key: 'details',
                layout: { span: 1 },
                type: 'object',
              },
              {
                key: 'handle',
                layout: { span: 1 },
                type: 'text',
                validation: {
                  rules: [
                    {
                      name: 'available-handle',
                      message: 'This handle is unavailable.',
                      validate: async () => handleGate.promise,
                    },
                  ],
                },
              },
            ],
            key: 'workspace',
            layout: { columns: 2 },
          },
          { fields: [{ key: 'notes', type: 'textarea' }], key: 'details' },
        ],
      }),
    )
    const app = createApp({})
    app.use(VueQueryPlugin, { queryClient: new QueryClient() })
    const scope = effectScope()
    const runtime = app.runWithContext(() => scope.run(() => useFormRuntime({ schema })))
    if (!runtime) {
      throw new Error('Failed to create form runtime')
    }

    const nextRequest = runtime.nextStep()
    await vi.waitFor(() => expect(runtime.actionPending.value).toBe('next'))
    await vi.waitFor(() =>
      expect(runtime.errors.value.map((error) => error.path)).toStrictEqual([
        'fullName',
        'email',
        'details.name',
      ]),
    )

    handleGate.resolve(false)
    await expect(nextRequest).resolves.toBeFalsy()
    expect(runtime.errors.value.map((error) => error.path)).toStrictEqual([
      'fullName',
      'email',
      'details.name',
      'handle',
    ])
    scope.stop()
  })

  it('keeps the stepped submit lifecycle pending during its before-next hook', async () => {
    const nextGate = deferredResult<boolean>()
    const schema = computed(() =>
      defineFormSchema({
        onBeforeNext: async () => nextGate.promise,
        steps: [
          { fields: [{ key: 'name', type: 'text' }], key: 'identity' },
          { fields: [{ key: 'notes', type: 'textarea' }], key: 'details' },
        ],
      }),
    )
    const app = createApp({})
    app.use(VueQueryPlugin, { queryClient: new QueryClient() })
    const scope = effectScope()
    const runtime = app.runWithContext(() => scope.run(() => useFormRuntime({ schema })))
    if (!runtime) {
      throw new Error('Failed to create form runtime')
    }

    const submitRequest = runtime.submit()
    await vi.waitFor(() => expect(runtime.actionPending.value).toBe('next'))

    nextGate.resolve(true)
    await expect(submitRequest).resolves.toBeTruthy()
    expect(runtime.actionPending.value).toBeNull()
    scope.stop()
  })
})
