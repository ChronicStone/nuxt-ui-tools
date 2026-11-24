import { afterEach, describe, expect, it, vi } from 'vitest'

import type {
  TablePreferenceStore,
  TablePreferencesMap,
} from '#ui-tools/table/composables/use-table-preferences'

import { createAccountsSchema } from '../fixtures/accounts'
import { mountLoaded } from '../harness'
import type { Harness } from '../harness'

let harness: Harness | undefined
afterEach(() => {
  harness?.unmount()
  window.localStorage.clear()
})

const AUTO = { nuxtUiTools: { dataList: { filters: { defaultLocation: 'auto' } } } }
const LOCAL = { storage: 'local' } as const

function placement(current: Harness) {
  const presentation = current.internals.filterPresentation
  return {
    bar: presentation.tagDefinitions.value.map((definition) => definition.key),
    menu: presentation.dormantDynamicDefinitions.value.map((definition) => definition.key),
  }
}

type SaveVariables = { tableKey: string; favoriteFilters: readonly string[] }

function createStore(
  initial: TablePreferencesMap,
  save = vi.fn(async (_variables: SaveVariables): Promise<undefined> => undefined),
) {
  const store: TablePreferenceStore<SaveVariables> = {
    mutation: () => ({ mutationFn: save }),
    query: () => ({ queryFn: async () => initial, queryKey: ['table-preferences'] }),
    variables: ({ tableKey, preferences }) => ({ tableKey, ...preferences }),
  }
  // SAFETY: the harness only calls the store through its own functions, as provideTablePreferences does.
  return { save, store: store as TablePreferenceStore }
}

describe('favorite filters', () => {
  it('places a filter without a location by its default value', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema({ autoLocations: true }) })
    expect(placement(harness), 'without the app default, nothing changes').toStrictEqual({
      bar: ['status', 'edofSync'],
      menu: ['country'],
    })
    expect(
      harness.internals.filterPresentation.isStarrable({ key: 'edofSync' }),
      'no store, no stars',
    ).toBeFalsy()

    harness.unmount()
    harness = await mountLoaded({
      appConfig: AUTO,
      schema: createAccountsSchema({ autoLocations: true }),
    })
    expect(placement(harness)).toStrictEqual({ bar: [], menu: ['status', 'country', 'edofSync'] })

    harness.unmount()
    harness = await mountLoaded({
      appConfig: AUTO,
      preferences: LOCAL,
      schema: createAccountsSchema({ autoLocations: true, statusDefault: ['active'] }),
    })
    expect(placement(harness)).toStrictEqual({ bar: ['status'], menu: ['country', 'edofSync'] })
    expect(
      harness.internals.filterPresentation.isStarrable({ key: 'status' }),
      'a filter with a default is already in the bar',
    ).toBeFalsy()
  })

  it('pins a starred filter to the bar, keeps it while it holds a value, and not on phones', async () => {
    harness = await mountLoaded({
      appConfig: AUTO,
      preferences: LOCAL,
      schema: createAccountsSchema({ autoLocations: true }),
    })
    const presentation = harness.internals.filterPresentation
    presentation.toggleFavorite({ key: 'edofSync' })
    await harness.flush()
    expect(placement(harness)).toStrictEqual({ bar: ['edofSync'], menu: ['status', 'country'] })
    expect(
      presentation.favoriteDefinitions.value.map((definition) => definition.key),
    ).toStrictEqual(['edofSync'])

    harness.internals.filters.setScalarFilterValue({ key: 'edofSync', value: true })
    presentation.toggleFavorite({ key: 'edofSync' })
    await harness.flush()
    expect(
      presentation.activeDynamicDefinitions.value.map((definition) => definition.key),
      'unstarred with a value: stays until cleared',
    ).toStrictEqual(['edofSync'])

    presentation.toggleFavorite({ key: 'country' })
    harness.unmount()
    harness = await mountLoaded({
      appConfig: AUTO,
      breakpoint: 'sm',
      preferences: LOCAL,
      schema: createAccountsSchema({ autoLocations: true }),
    })
    expect(
      harness.internals.filterPresentation.isStarrable({ key: 'edofSync' }),
      'no star to tap on a phone',
    ).toBeFalsy()
    expect(placement(harness), 'phones keep their own rules').toStrictEqual({
      bar: [],
      menu: ['status', 'country', 'edofSync'],
    })
  })

  it('never stars a pinned, panel or opted-out filter', async () => {
    harness = await mountLoaded({
      preferences: LOCAL,
      schema: createAccountsSchema({ panelFilters: true }),
    })
    const presentation = harness.internals.filterPresentation
    presentation.toggleFavorite({ key: 'status' })
    presentation.toggleFavorite({ key: 'country' })
    await harness.flush()
    expect([
      presentation.isStarrable({ key: 'status' }),
      presentation.isStarrable({ key: 'country' }),
      presentation.isStarrable({ key: 'edofSync' }),
      presentation.favoriteDefinitions.value,
    ]).toStrictEqual([false, false, true, []])
  })

  it('reads favorites from the app store and saves each change through its mutation', async () => {
    const { save, store } = createStore({ accounts: { favoriteFilters: ['country', 'gone'] } })
    harness = await mountLoaded({
      appConfig: AUTO,
      preferences: store,
      schema: createAccountsSchema({ autoLocations: true }),
    })
    await harness.until(() => placement(harness!).bar.includes('country'))
    expect(placement(harness), 'an unknown key is ignored').toStrictEqual({
      bar: ['country'],
      menu: ['status', 'edofSync'],
    })

    harness.internals.filterPresentation.toggleFavorite({ key: 'edofSync' })
    await harness.flush()
    expect(placement(harness).bar).toStrictEqual(['country', 'edofSync'])
    expect(save.mock.calls[0]?.[0]).toStrictEqual({
      favoriteFilters: ['country', 'gone', 'edofSync'],
      tableKey: 'accounts',
    })
  })

  it('rolls a change back when the store refuses it', async () => {
    const { store } = createStore(
      {},
      vi.fn(async (_variables: SaveVariables): Promise<undefined> => {
        throw new Error('offline')
      }),
    )
    harness = await mountLoaded({
      appConfig: AUTO,
      preferences: store,
      schema: createAccountsSchema({ autoLocations: true }),
    })
    harness.internals.filterPresentation.toggleFavorite({ key: 'country' })
    await harness.flush()
    await harness.until(() => !placement(harness!).bar.includes('country'))
    expect(placement(harness).menu).toStrictEqual(['status', 'country', 'edofSync'])
  })
})
