import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { describe, expect, it } from 'vitest'
import { computed, createApp, effectScope, nextTick } from 'vue'

import { defineFormSchema } from '#ui-tools/form'

import { useFieldOptions } from '../../src/runtime/form/composables/use-field-options'
import { useFormRuntime } from '../../src/runtime/form/composables/use-form-runtime'
import { getSchemaFields } from '../../src/runtime/form/utils/state'

describe('form field options', () => {
  it('selects a created option through the shared option runtime', async () => {
    const schema = computed(() =>
      defineFormSchema({
        fields: [
          {
            key: 'skill',
            options: {
              create: {
                handler: ({ label }) => ({ label, value: label.toLocaleLowerCase() }),
              },
              source: [],
            },
            type: 'select',
          },
        ],
      }),
    )
    const scope = effectScope()
    const app = createApp({})
    app.use(VueQueryPlugin, { queryClient: new QueryClient() })
    const result = app.runWithContext(() =>
      scope.run(() => {
        const runtime = useFormRuntime({ schema })
        const field = getSchemaFields(schema.value)[0]
        if (!field) {
          throw new Error('Missing option field')
        }
        const path = ['skill']
        const options = useFieldOptions({
          api: computed(() => runtime.getFieldApi(path, field)),
          callbackParams: computed(() => runtime.getFieldCallbackParams(path, field)),
          field: () => field,
          path: () => path,
          refreshFieldOptions: runtime.refreshFieldOptions,
          register: runtime.registerFieldOptions,
        })
        return { options, runtime }
      }),
    )
    if (!result) {
      throw new Error('Failed to create option runtime')
    }

    await result.options.create('Reliability')

    expect(result.runtime.getValue('skill')).toBe('reliability')
    scope.stop()
  })

  it('normalizes creation labels and ignores concurrent creation attempts', async () => {
    let resolveCreation: ((value: { label: string; value: string }) => void) | undefined
    const labels: string[] = []
    const schema = computed(() =>
      defineFormSchema({
        fields: [
          {
            key: 'skill',
            options: {
              create: {
                handler: ({ label }) => {
                  labels.push(label)
                  return new Promise<{ label: string; value: string }>((resolve) => {
                    resolveCreation = resolve
                  })
                },
              },
              source: [],
            },
            type: 'select',
          },
        ],
      }),
    )
    const scope = effectScope()
    const app = createApp({})
    app.use(VueQueryPlugin, { queryClient: new QueryClient() })
    const result = app.runWithContext(() =>
      scope.run(() => {
        const runtime = useFormRuntime({ schema })
        const field = getSchemaFields(schema.value)[0]
        if (!field) {
          throw new Error('Missing option field')
        }
        const path = ['skill']
        const options = useFieldOptions({
          api: computed(() => runtime.getFieldApi(path, field)),
          callbackParams: computed(() => runtime.getFieldCallbackParams(path, field)),
          field: () => field,
          path: () => path,
          refreshFieldOptions: runtime.refreshFieldOptions,
          register: runtime.registerFieldOptions,
        })
        return { options, runtime }
      }),
    )
    if (!result) {
      throw new Error('Failed to create option runtime')
    }

    const firstCreation = result.options.create('  Platform  ')
    const concurrentCreation = result.options.create('Ignored')

    expect(result.options.creating.value).toBeTruthy()
    await expect(concurrentCreation).resolves.toBeNull()
    expect(labels).toStrictEqual(['Platform'])

    resolveCreation?.({ label: 'Platform', value: 'platform' })
    await firstCreation

    expect(result.options.creating.value).toBeFalsy()
    expect(result.runtime.getValue('skill')).toBe('platform')
    await expect(result.options.create('   ')).resolves.toBeNull()
    expect(labels).toStrictEqual(['Platform'])
    scope.stop()
  })

  it('reinvokes a promise-backed source when refreshed', async () => {
    let runs = 0
    const schema = computed(() =>
      defineFormSchema({
        fields: [
          {
            key: 'skill',
            options: async () => {
              runs += 1
              return [{ label: `Run ${runs}`, value: runs }]
            },
            type: 'select',
          },
        ],
      }),
    )
    const scope = effectScope()
    const app = createApp({})
    app.use(VueQueryPlugin, { queryClient: new QueryClient() })
    const options = app.runWithContext(() =>
      scope.run(() => {
        const runtime = useFormRuntime({ schema })
        const field = getSchemaFields(schema.value)[0]
        if (!field) {
          throw new Error('Missing option field')
        }
        const path = ['skill']
        return useFieldOptions({
          api: computed(() => runtime.getFieldApi(path, field)),
          callbackParams: computed(() => runtime.getFieldCallbackParams(path, field)),
          field: () => field,
          path: () => path,
          refreshFieldOptions: runtime.refreshFieldOptions,
          register: runtime.registerFieldOptions,
        })
      }),
    )
    if (!options) {
      throw new Error('Failed to create option runtime')
    }

    await nextTick()
    expect(runs).toBe(1)

    await options.refresh()

    expect(runs).toBe(2)
    expect(options.items.value[0]?.label).toBe('Run 2')
    scope.stop()
  })
})
