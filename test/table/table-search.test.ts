import { describe, expect, it } from 'vitest'
import { computed, ref } from 'vue'

import { useTableSearch } from '#ui-tools/table/composables/use-table-search'

import {
  createDefaultFilterValue,
  createFilterValueForOperator,
} from '../../src/runtime/table/utils/filters/registry'

describe('table search orchestration', () => {
  it('reads directly from query state and writes back through query state', () => {
    const search = ref('Ada')
    const filters = ref({
      search: search.value,
      ui: [],
    })
    const pagination = ref({
      count: 'exact' as const,
      mode: 'offset' as const,
      pageIndex: 2,
      pageSize: 20,
    })
    // SAFETY: this focused test supplies only the query-state members useTableSearch reads.
    const searchState = useTableSearch({
      queryState: {
        filters,
        pagination,
        resetPagination: () => {
          pagination.value = { ...pagination.value, pageIndex: 1 }
        },
      } as never,
      schema: computed(() => ({
        filters: {
          search: {
            fields: ['name'],
            placeholder: 'Search team',
          },
        },
        rowKey: 'id',
        source: { query: () => ({ queryKey: ['users'] }) },
        tableKey: 'users',
      })),
    })

    expect([searchState.searchQuery.value, searchState.searchPlaceholder.value]).toEqual([
      'Ada',
      'Search team',
    ])
    expect(searchState.hasActiveSearch.value).toBeTruthy()

    searchState.searchQuery.value = 'Grace'

    expect([
      searchState.searchQuery.value,
      filters.value.search,
      pagination.value.pageIndex,
    ]).toEqual(['Grace', 'Grace', 1])
  })
})

describe('filter value registry', () => {
  it('derives stable defaults by filter kind', () => {
    expect(
      createDefaultFilterValue({
        key: 'name',
        kind: 'text',
        label: 'Name',
      }),
    ).toBe('')

    expect(
      createDefaultFilterValue({
        key: 'status',
        kind: 'option',
        label: 'Status',
      }),
    ).toStrictEqual([])

    expect(
      createFilterValueForOperator({
        definition: {
          key: 'salary',
          kind: 'number',
          label: 'Salary',
        },
        operator: 'between',
      }),
    ).toStrictEqual({ from: undefined, to: undefined })
  })
})
