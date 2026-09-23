import { describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  defineDashboardSchema,
  defineDashboardView,
  injectDashboard,
  useDashboardFormat,
  useDashboardView,
} from '#ui-tools/dashboard'
import type { InferDashboard, InferDashboardView } from '#ui-tools/dashboard'
import DashboardPage from '#ui-tools/dashboard/components/dashboard-page.vue'

import { deferredSource, mountDashboard } from './harness'

interface AccountParams {
  accountId: string
  detail: ReturnType<typeof deferredSource<{ name: string }>>
}

function profileView(params: AccountParams) {
  // App-level composables keep working when the schema function runs again, outside setup.
  const router = useRouter()
  const format = useDashboardFormat()
  return defineDashboardView({
    label: () => `Profile of ${params.accountId}`,
    filters: (f) => ({
      year: f.enum([2025, 2026], { defaultValue: 2026, label: 'Year' }),
      months: f.enum([1, 2, 3], {
        format: (month) => format.month(month),
        label: 'Months',
        multiple: true,
      }),
    }),
    queries: ({ essential, filters }) => ({
      detail: essential.query(() => ({
        queryFn: () => params.detail.fn(params.accountId, filters.year),
        queryKey: ['account', params.accountId, filters.year],
      })),
    }),
    derive: () => ({ path: () => router.currentRoute.value.path }),
  })
}

function accountSchema(params: AccountParams) {
  return defineDashboardSchema({
    key: 'account',
    views: { profile: profileView(params) },
  })
}

async function mountAccount() {
  const accountId = ref('a1')
  const detail = deferredSource<{ name: string }>()
  const harness = await mountDashboard({
    query: { year: '2025' },
    schema: () => accountSchema({ accountId: accountId.value, detail }),
  })
  return { ...harness, accountId, detail }
}

describe('dashboard schema functions', () => {
  it('builds the dashboard again when what the function reads changes, behind the same objects', async () => {
    const { accountId, dashboard, detail, flush, query } = await mountAccount()
    const profile = dashboard.profile
    expect(detail.calls[0]?.args).toEqual(['a1', 2025])
    detail.calls[0]?.resolve({ name: 'Acme' })
    await flush()
    expect(profile.detail.data).toEqual({ name: 'Acme' })
    expect(dashboard.view.items).toEqual([{ label: 'Profile of a1', value: 'profile' }])

    accountId.value = 'a2'
    await flush()
    // The filters live in the URL, so the new account opens on the same year.
    expect(detail.calls.at(-1)?.args).toEqual(['a2', 2025])
    expect(query()).toEqual({ year: '2025' })
    expect(profile.detail.state).toBe('loading')
    expect(dashboard.profile).toBe(profile)
    expect(dashboard.view.items).toEqual([{ label: 'Profile of a2', value: 'profile' }])

    detail.calls.at(-1)?.resolve({ name: 'Globex' })
    await flush()
    expect(profile.detail.data).toEqual({ name: 'Globex' })
    expect(profile.path.data).toBe('/')

    // Writes go to the current build.
    profile.filters.year = 2026
    await flush()
    expect(detail.calls.at(-1)?.args).toEqual(['a2', 2026])
    expect(query()).toEqual({})
  })

  it('stops the previous build: its queries no longer fetch', async () => {
    const { accountId, detail, flush, queryClient } = await mountAccount()
    accountId.value = 'a2'
    await flush()
    const observed = queryClient
      .getQueryCache()
      .findAll()
      .filter((entry) => entry.getObserversCount() > 0)
      .map((entry) => entry.queryKey)
    expect(observed).toContainEqual(['account', 'a2', 2025])
    expect(observed).not.toContainEqual(['account', 'a1', 2025])
    expect(detail.calls.map((call) => call.args[0])).toEqual(['a1', 'a2'])
  })

  it('keeps the locale of the component that created the dashboard', async () => {
    const { accountId, dashboard, flush } = await mountAccount()
    const labels = () => dashboard.profile.controls.months.items.map((item) => item.label)
    expect(dashboard.profile.controls.months.display).toBe('Tous')
    expect(labels()).toEqual(['Janv.', 'Févr.', 'Mars'])

    // The function runs again outside setup: the formats it built still read the page locale.
    accountId.value = 'a2'
    await flush()
    expect(dashboard.profile.controls.months.display).toBe('Tous')
    expect(labels()).toEqual(['Janv.', 'Févr.', 'Mars'])
  })

  it('hands descendants handles that follow the rebuilds', async () => {
    const accountId = ref('a1')
    const detail = deferredSource<{ name: string }>()
    let injected: InferDashboard<typeof accountSchema> | undefined
    let view: InferDashboardView<typeof profileView> | undefined
    const Profile = defineComponent({
      setup() {
        injected = injectDashboard(accountSchema)
        view = useDashboardView(profileView)
        return () => h('p', { 'data-profile-name': view?.detail.data?.name })
      },
    })
    const { dashboard, flush, wrapper } = await mountDashboard({
      render: (api) => h(DashboardPage, { dashboard: api }, { profile: () => h(Profile) }),
      schema: () => accountSchema({ accountId: accountId.value, detail }),
    })
    expect(injected).toBe(dashboard)
    expect(view).toBe(dashboard.profile)

    detail.calls[0]?.resolve({ name: 'Acme' })
    await flush()
    expect(wrapper.find('[data-profile-name]').attributes('data-profile-name')).toBe('Acme')

    accountId.value = 'a2'
    await flush()
    detail.calls.at(-1)?.resolve({ name: 'Globex' })
    await flush()
    // The component was not remounted: its handle reads the new build.
    expect(view?.detail.data).toEqual({ name: 'Globex' })
    expect(wrapper.find('[data-profile-name]').attributes('data-profile-name')).toBe('Globex')
  })
})
