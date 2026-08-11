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
      pageIndex: 2,
      pageSize: 20,
    })
    const searchState = useTableSearch({
      schema: computed(() => ({
        tableKey: 'users',
        rowKey: 'id',
        source: { query: () => ({ queryKey: ['users'] }) },
        filters: {
          search: {
            fields: ['name'],
            placeholder: 'Search team',
          },
        },
      })),
      queryState: {
        filters,
        pagination,
      } as never,
    })

    expect(searchState.searchQuery.value).toBe('Ada')
    expect(searchState.searchPlaceholder.value).toBe('Search team')
    expect(searchState.hasActiveSearch.value).toBe(true)

    searchState.searchQuery.value = 'Grace'

    expect(searchState.searchQuery.value).toBe('Grace')
    expect(filters.value.search).toBe('Grace')
    expect(pagination.value.pageIndex).toBe(1)
  })
})

describe('filter value registry', () => {
  it('derives stable defaults by filter kind', () => {
    expect(
      createDefaultFilterValue({
        kind: 'text',
        key: 'name',
        label: 'Name',
      }),
    ).toBe('')

    expect(
      createDefaultFilterValue({
        kind: 'option',
        key: 'status',
        label: 'Status',
      }),
    ).toEqual([])

    expect(
      createFilterValueForOperator({
        definition: {
          kind: 'number',
          key: 'salary',
          label: 'Salary',
        },
        operator: 'between',
      }),
    ).toEqual({ from: undefined, to: undefined })
  })
})
