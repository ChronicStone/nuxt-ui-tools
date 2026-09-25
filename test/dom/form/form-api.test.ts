import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import { defineFormSchema } from '#ui-tools/form'
import FormProvider from '#ui-tools/form/components/provider/form-provider.vue'
import { createFormApi, formApiKey, useFormApi } from '#ui-tools/form/composables/use-form-api'

describe('app-wide form API', () => {
  it('lets code outside setup open forms that the provider renders', async () => {
    const appApi = createFormApi()
    let providedApi: ReturnType<typeof useFormApi> | undefined
    const Probe = defineComponent({
      setup() {
        providedApi = useFormApi()
        return () => h('p', 'probe')
      },
    })

    mount(() => h(FormProvider, null, { default: () => h(Probe) }), {
      global: {
        plugins: [
          [VueQueryPlugin, { queryClient: new QueryClient() }],
          createRouter({
            history: createMemoryHistory(),
            routes: [{ component: Probe, path: '/' }],
          }),
        ],
        provide: { [formApiKey as symbol]: appApi },
      },
    })
    expect(providedApi).toBe(appApi)

    void appApi.createForm(
      defineFormSchema({ fields: [{ key: 'email', type: 'text', label: 'Email' }] }),
      { id: 'invite', mode: 'modal' },
    )
    await nextTick()

    expect(appApi.isOpen('invite')).toBe(true)
    expect(appApi.formInstances.value).toHaveLength(1)
  })

  it('keeps a standalone provider working without an app-wide instance', () => {
    let providedApi: ReturnType<typeof useFormApi> | undefined
    const Probe = defineComponent({
      setup() {
        providedApi = useFormApi()
        return () => h('p', 'probe')
      },
    })

    mount(() => h(FormProvider, null, { default: () => h(Probe) }))

    expect(providedApi?.formInstances.value).toEqual([])
  })
})
