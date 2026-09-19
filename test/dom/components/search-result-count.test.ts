import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

import DataListResultCount from '#ui-tools/table/components/data-list/DataListResultCount.vue'
import DataListSearch from '#ui-tools/table/components/data-list/DataListSearch.vue'

import { createAccountsSchema, createAuditSchema } from '../fixtures/accounts'
import { mountLoaded } from '../harness'
import type { Harness } from '../harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

describe('search part', () => {
  it('renders the placeholder, icon and width, committing on enter and blur only', async () => {
    harness = await mountLoaded({ render: () => h(DataListSearch), schema: createAccountsSchema() })
    const w = harness.wrapper
    const input = w.find('input[data-ui="UInput"]')
    expect(input.attributes('placeholder')).toBe('Rechercher un compte…')
    expect(input.attributes('data-icon')).toBe('i-lucide-search')
    expect(input.attributes('data-variant')).toBe('outline')
    expect(input.attributes('data-size')).toBe('md')
    expect(input.attributes('style')).toContain('width: 21rem')
    expect(input.classes()).toContain('nut-dl-search')

    await input.setValue('Compte 01')
    expect(harness.internals.filters.searchQuery.value).toBe('')
    await input.trigger('keydown', { key: 'Enter' })
    await harness.flush()
    expect(harness.internals.filters.searchQuery.value).toBe('Compte 01')
    expect(harness.internals.queryContent.data.value.rowCount).toBe(10)

    await input.setValue('Compte 02')
    await input.trigger('blur')
    await harness.flush()
    expect(harness.internals.filters.searchQuery.value).toBe('Compte 02')

    harness.internals.filters.searchQuery.value = ''
    await harness.flush()
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('takes width, size and input props from the config layer', async () => {
    harness = await mountLoaded({
      render: () => h(DataListSearch, { placeholder: 'Custom' }),
      schema: createAccountsSchema(),
      ui: {
        search: {
          props: { input: { color: 'primary', variant: 'soft' } },
          size: 'lg',
          ui: { root: 'root-x' },
          width: '340px',
        },
      },
    })
    const input = harness.wrapper.find('input[data-ui="UInput"]')
    expect(input.attributes('style')).toContain('width: 340px')
    expect(input.attributes('data-size')).toBe('lg')
    expect(input.attributes('data-variant')).toBe('soft')
    expect(input.attributes('data-color')).toBe('primary')
    expect(input.attributes('placeholder')).toBe('Custom')
    expect(input.classes()).toContain('root-x')
  })

  it('reflects the loading state while refetching', async () => {
    harness = await mountLoaded({
      render: () => h(DataListSearch),
      schema: createAccountsSchema({ delay: 40 }),
    })
    function input() {
      return harness!.wrapper.find('input[data-ui="UInput"]')
    }
    expect(input().attributes('data-loading')).toBeUndefined()
    const refresh = harness.internals.queryContent.refreshData()()
    await harness.until(() => input().attributes('data-loading') === 'true')
    await refresh
    await harness.until(() => input().attributes('data-loading') === undefined)
  })
})

describe('result count part', () => {
  it('formats the known total and falls back to loaded counts', async () => {
    harness = await mountLoaded({
      render: () => h(DataListResultCount),
      schema: createAccountsSchema({
        rows: Array.from({ length: 1250 }, (_, i) => ({
          consumption: 1,
          contracts: 1,
          country: 'FR',
          edofSync: true,
          id: `a-${i}`,
          legalEntity: '',
          name: `N${i}`,
          status: 'active',
          updatedAt: '',
        })) as never,
      }),
    })
    expect(harness.wrapper.find('span').text()).toBe('1 250')
    expect(harness.wrapper.find('span').classes()).toContain('text-sm')
    harness.unmount()

    harness = await mountLoaded({
      render: () => h(DataListResultCount, { size: 'xs', ui: { root: 'cnt-x' } }),
      schema: createAuditSchema({ total: 45 }),
    })
    const span = harness.wrapper.find('span')
    expect(span.text()).toBe('45')
    expect(span.classes()).toStrictEqual(expect.arrayContaining(['cnt-x', 'text-xs']))
  })

  it('exposes counts through its slot', async () => {
    harness = await mountLoaded({
      render: () =>
        h(DataListResultCount, null, {
          default: (scope: { loadedCount: number; totalCount: number; known: boolean }) =>
            h('b', `${scope.loadedCount}/${scope.totalCount}/${String(scope.known)}`),
        }),
      schema: createAccountsSchema(),
    })
    expect(harness.wrapper.find('b').text()).toBe('20/60/true')
  })
})
