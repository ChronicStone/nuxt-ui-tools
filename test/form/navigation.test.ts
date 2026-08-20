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
        steps: [
          {
            key: 'identity',
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
          },
          { key: 'details', fields: [{ key: 'notes', type: 'textarea' }] },
        ],
        onBeforeNext: async () => {
          await nextGate.promise
          return true
        },
        onBeforePrevious: async () => {
          await previousGate.promise
        },
      }),
    )
    const app = createApp({})
    app.use(VueQueryPlugin, { queryClient: new QueryClient() })
    const scope = effectScope()
    const runtime = app.runWithContext(() => scope.run(() => useFormRuntime({ schema })))
    if (!runtime) throw new Error('Failed to create form runtime')

    const nextRequest = runtime.nextStep()
    await nextTick()
    expect(runtime.actionPending.value).toBe('next')
    expect(runtime.getFieldApi(['name']).validation.pending()).toBe(true)
    expect(runtime.errors.value).toHaveLength(0)
    expect(await runtime.nextStep()).toBe(false)

    validationGate.resolve()
    await nextTick()
    expect(runtime.actionPending.value).toBe('next')

    nextGate.resolve()
    expect(await nextRequest).toBe(true)
    expect(runtime.currentStepIndex.value).toBe(1)
    expect(runtime.actionPending.value).toBeNull()
    expect(runtime.getFieldApi(['name']).validation.pending()).toBe(false)

    const previousRequest = runtime.previousStep()
    await nextTick()
    expect(runtime.actionPending.value).toBe('previous')
    expect(await runtime.previousStep()).toBe(false)

    previousGate.resolve()
    expect(await previousRequest).toBe(true)
    expect(runtime.currentStepIndex.value).toBe(0)
    expect(runtime.actionPending.value).toBeNull()
    scope.stop()
  })

  it('clears navigation pending when the async before-next hook cancels', async () => {
    const nextGate = deferredResult<boolean>()
    const schema = computed(() =>
      defineFormSchema({
        steps: [
          { key: 'identity', fields: [{ key: 'name', type: 'text' }] },
          { key: 'details', fields: [{ key: 'notes', type: 'textarea' }] },
        ],
        onBeforeNext: async () => nextGate.promise,
      }),
    )
    const app = createApp({})
    app.use(VueQueryPlugin, { queryClient: new QueryClient() })
    const scope = effectScope()
    const runtime = app.runWithContext(() => scope.run(() => useFormRuntime({ schema })))
    if (!runtime) throw new Error('Failed to create form runtime')

    const nextRequest = runtime.nextStep()
    await nextTick()
    expect(runtime.actionPending.value).toBe('next')

    nextGate.resolve(false)
    expect(await nextRequest).toBe(false)
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
            key: 'workspace',
            layout: { columns: 2 },
            fields: [
              { key: 'fullName', type: 'text', validation: { required: true } },
              { key: 'email', type: 'text', validation: { required: true } },
              {
                key: 'details',
                type: 'object',
                layout: { span: 1 },
                fields: [{ key: 'name', type: 'text', validation: { required: true } }],
              },
              {
                key: 'handle',
                type: 'text',
                layout: { span: 1 },
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
          },
          { key: 'details', fields: [{ key: 'notes', type: 'textarea' }] },
        ],
      }),
    )
    const app = createApp({})
    app.use(VueQueryPlugin, { queryClient: new QueryClient() })
    const scope = effectScope()
    const runtime = app.runWithContext(() => scope.run(() => useFormRuntime({ schema })))
    if (!runtime) throw new Error('Failed to create form runtime')

    const nextRequest = runtime.nextStep()
    await vi.waitFor(() => expect(runtime.actionPending.value).toBe('next'))
    await vi.waitFor(() =>
      expect(runtime.errors.value.map((error) => error.path)).toEqual([
        'fullName',
        'email',
        'details.name',
      ]),
    )

    handleGate.resolve(false)
    expect(await nextRequest).toBe(false)
    expect(runtime.errors.value.map((error) => error.path)).toEqual([
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
        steps: [
          { key: 'identity', fields: [{ key: 'name', type: 'text' }] },
          { key: 'details', fields: [{ key: 'notes', type: 'textarea' }] },
        ],
        onBeforeNext: async () => nextGate.promise,
      }),
    )
    const app = createApp({})
    app.use(VueQueryPlugin, { queryClient: new QueryClient() })
    const scope = effectScope()
    const runtime = app.runWithContext(() => scope.run(() => useFormRuntime({ schema })))
    if (!runtime) throw new Error('Failed to create form runtime')

    const submitRequest = runtime.submit()
    await vi.waitFor(() => expect(runtime.actionPending.value).toBe('next'))

    nextGate.resolve(true)
    expect(await submitRequest).toBe(true)
    expect(runtime.actionPending.value).toBeNull()
    scope.stop()
  })
})
