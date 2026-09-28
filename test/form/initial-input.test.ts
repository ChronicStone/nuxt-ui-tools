import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { describe, expect, it } from 'vitest'
import { computed, createApp, effectScope, nextTick, ref } from 'vue'

import { defineFormSchema } from '#ui-tools/form'

import { useFormRuntime } from '../../src/runtime/form/composables/use-form-runtime'

describe('form initial input', () => {
  it('initializes once when overlay input becomes available after setup', async () => {
    const schema = computed(() =>
      defineFormSchema({
        fields: [{ key: 'name', type: 'text' }],
      }),
    )
    const inputSource = ref<{ name: string }>()
    const input = computed(() => inputSource.value)
    const app = createApp({})
    app.use(VueQueryPlugin, { queryClient: new QueryClient() })

    const scope = effectScope()
    const runtime = app.runWithContext(() =>
      scope.run(() =>
        useFormRuntime({
          input,
          schema,
        }),
      ),
    )
    if (!runtime) {
      throw new Error('Failed to create form runtime')
    }

    inputSource.value = { name: 'Ada' }
    await nextTick()

    expect(runtime.getValue('name')).toBe('Ada')

    runtime.setValue('name', 'Grace')
    inputSource.value = { name: 'Ignored without syncInput' }
    await nextTick()

    expect(runtime.getValue('name')).toBe('Grace')
    scope.stop()
  })

  it('reads a container input through its transform, and writes it back on output', async () => {
    const schema = computed(() =>
      defineFormSchema({
        fields: [
          {
            fields: [
              { key: 'agreement', type: 'text' },
              { key: 'amendment', type: 'text' },
            ],
            key: 'files',
            transform: {
              input: (files: readonly { type: string; name: string }[]) => ({
                agreement: files.find((file) => file.type === 'AGREEMENT')?.name ?? null,
                amendment: files.find((file) => file.type === 'AMENDMENT')?.name ?? null,
              }),
              output: (slots: { agreement: string | null; amendment: string | null }) =>
                Object.entries(slots).flatMap(([type, name]) =>
                  name ? [{ name, type: type.toUpperCase() }] : [],
                ),
            },
            type: 'object',
          },
        ],
      }),
    )
    const input = computed(() => ({ files: [{ name: 'signed.pdf', type: 'AGREEMENT' }] }))
    const app = createApp({})
    app.use(VueQueryPlugin, { queryClient: new QueryClient() })
    const scope = effectScope()
    const runtime = app.runWithContext(() => scope.run(() => useFormRuntime({ input, schema })))
    if (!runtime) {
      throw new Error('Failed to create form runtime')
    }
    await nextTick()

    expect(runtime.getValue('files.agreement')).toBe('signed.pdf')
    expect(runtime.getValue('files.amendment')).toBeNull()
    expect(runtime.output.value).toEqual({ files: [{ name: 'signed.pdf', type: 'AGREEMENT' }] })
    scope.stop()
  })
})
