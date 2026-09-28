import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { renderToString } from 'vue/server-renderer'

import { defineFormSchema } from '#ui-tools/form'
import FormProvider from '#ui-tools/form/components/provider/form-provider.vue'
import FormRoot from '#ui-tools/form/components/root/form.vue'
import { useForm } from '#ui-tools/form/composables/use-form'
import type { FormController, FormValue } from '#ui-tools/form/types'

const ROWS = 40

function tableSchema(inert: boolean | 'auto') {
  return defineFormSchema({
    fields: [
      {
        default: 'EUR',
        key: 'currency',
        label: 'Currency',
        options: ['EUR', 'USD'],
        type: 'select',
      },
      {
        default: 'draft-7',
        key: 'code',
        label: 'Code',
        type: 'text',
        watch: ({ api, value }) => {
          api.form.set('codeLabel', String(value).toUpperCase())
        },
        watchOptions: { immediate: true },
      },
      { key: 'codeLabel', label: 'Code label', type: 'text' },
      {
        fields: [
          { key: 'label', label: 'Label', required: true, type: 'text' },
          {
            dependencies: ['currency'],
            key: 'amount',
            label: 'Amount',
            props: ({ deps }) => ({ controls: false, suffix: deps.currency === 'USD' ? '$' : '€' }),
            type: 'number',
          },
          { key: 'status', label: 'Status', options: ['open', 'closed'], type: 'select' },
          { key: 'active', label: 'Active', type: 'switch' },
        ],
        key: 'rows',
        props: { draggable: false, inert },
        type: 'array-table',
      },
    ],
  })
}

function tableInput() {
  return {
    rows: Array.from({ length: ROWS }, (_, index) => ({
      active: index % 2 === 0,
      amount: index * 10,
      label: `Row ${index + 1}`,
      status: index % 3 === 0 ? ('closed' as const) : ('open' as const),
    })),
  }
}

async function createFormApp(inert: boolean | 'auto') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ component: { render: () => h('div') }, path: '/' }],
  })
  await router.push('/')
  await router.isReady()
  const captured: { form?: FormController<unknown, FormValue> } = {}
  const Inner = defineComponent({
    name: 'FormHost',
    setup() {
      const form = useForm({ input: tableInput(), schema: tableSchema(inert) })
      captured.form = form
      return () => h(FormRoot, { form })
    },
  })
  const app = createSSRApp(
    defineComponent({
      name: 'Host',
      setup: () => () => h(FormProvider, null, { default: () => h(Inner) }),
    }),
  )
  app.use(router)
  app.use(VueQueryPlugin, {
    queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  })
  return { app, captured }
}

function hydrationWarnings(spy: { mock: { calls: unknown[][] } }) {
  return spy.mock.calls
    .map((call) => call.map(String).join(' '))
    .filter((line) => /hydration/iu.test(line))
}

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('array table server rendering', () => {
  it.each([true, 'auto'] as const)(
    'renders rows live on the server and hydrates them without a mismatch (inert: %s)',
    async (inert) => {
      const server = await createFormApp(inert)
      const html = await renderToString(server.app)

      expect(html).not.toContain('data-form-array-row-inert')
      expect(html.match(/data-form-array-row="rows\.\d+"/gu)).toHaveLength(ROWS)
      expect(html).toContain('DRAFT-7')

      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
      document.body.innerHTML = `<div id="app">${html}</div>`
      const client = await createFormApp(inert)
      client.app.mount('#app')
      await nextTick()

      expect(hydrationWarnings(warn)).toStrictEqual([])
      expect(hydrationWarnings(error)).toStrictEqual([])
      expect(document.querySelectorAll('[data-form-array-row]')).toHaveLength(ROWS)
      expect(document.querySelectorAll('[data-form-array-row-inert]')).toHaveLength(0)
      client.app.unmount()
    },
  )

  it('renders rows added after hydration inert when every row may render inert', async () => {
    const server = await createFormApp(true)
    const html = await renderToString(server.app)
    document.body.innerHTML = `<div id="app">${html}</div>`
    const client = await createFormApp(true)
    client.app.mount('#app')
    await nextTick()

    const rows = tableInput().rows
    client.captured.form?.state.set('rows', [...rows, { label: 'Added', status: 'open' }])
    await nextTick()

    const inertRows = [...document.querySelectorAll('[data-form-array-row-inert]')]
    expect(inertRows.map((row) => row.getAttribute('data-form-array-row'))).toStrictEqual([
      `rows.${ROWS}`,
    ])
    expect(document.querySelectorAll('[data-form-array-row]')).toHaveLength(ROWS + 1)
    client.app.unmount()
  })
})
