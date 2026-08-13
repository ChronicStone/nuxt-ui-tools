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
          schema,
          input,
        }),
      ),
    )
    if (!runtime) throw new Error('Failed to create form runtime')

    inputSource.value = { name: 'Ada' }
    await nextTick()

    expect(runtime.getValue('name')).toBe('Ada')

    runtime.setValue('name', 'Grace')
    inputSource.value = { name: 'Ignored without syncInput' }
    await nextTick()

    expect(runtime.getValue('name')).toBe('Grace')
    scope.stop()
  })
})
