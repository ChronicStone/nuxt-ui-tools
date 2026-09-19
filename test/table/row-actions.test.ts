import { describe, expect, it } from 'vitest'
import { computed } from 'vue'

import type { TableApi } from '#ui-tools/table/types'

import {
  createRowActionDropdownItems,
  hasVisibleTableRowActions,
  resolveVisibleTableRowActions,
} from '../../src/runtime/table/utils/actions'

interface DemoRow {
  id: string
  active: boolean
}

function createTableApiStub() {
  const rows = computed<DemoRow[]>(() => [])
  const rowCount = computed<number>(() => rows.value.length)
  const layout = computed<'table' | 'grid'>(() => 'table')
  const query = computed(() => ({
    filters: { search: '', ui: [] },
    layout: 'table' as const,
    pagination: {
      count: 'exact' as const,
      mode: 'offset' as const,
      pageIndex: 1,
      pageSize: 20,
    },
    sorting: null,
  }))
  const falseValue = computed<boolean>(() => false)
  const trueValue = computed<boolean>(() => true)
  const context = computed<Record<string, never>>(() => ({}))
  const requestContext = computed(() => ({
    context: {},
    filters: { children: [], combinator: 'and' as const, type: 'group' as const },
    pagination: {
      count: 'exact' as const,
      mode: 'offset' as const,
      pageIndex: 1,
      pageSize: 20,
    },
    search: { fields: [], value: '' },
    sorting: [],
  }))
  const error = computed<unknown>(() => null)
  const status = computed(() => ({
    initialized: true,
    isBooting: false,
    isContextFetching: false,
    isContextPending: false,
    isDataFetching: false,
    isDataPending: false,
    isFetching: false,
    isPageContextFetching: false,
    isPageContextPending: false,
    isPending: false,
    isRefreshing: false,
    isRevalidating: false,
    phase: 'active' as const,
  }))
  const selectionState = computed(() => ({
    allSelected: false,
    partiallySelected: false,
    selectedCount: 0,
    selectedKeys: [],
  }))
  const paginationState = computed(() => ({
    hasNextPage: false,
    hasPreviousPage: false,
    isLoadingMore: false,
    loadMoreError: null,
    loadedCount: 0,
    mode: 'offset' as const,
    pageCount: 1,
    pageIndex: 1,
    pageSize: 20,
    totalCount: 0,
  }))
  const sortingState = computed(() => ({
    active: false,
    dir: undefined,
    key: undefined,
  }))

  const tableApi: TableApi = {
    data: {
      context,
      error,
      loadedRowCount: rowCount,
      pageContext: context,
      rawRowCount: rowCount,
      rawRows: rows,
      refresh: async () => {
        throw new Error('not implemented')
      },
      requestContext,
      rowCount,
      rows,
      status,
      totalRowCount: rowCount,
      updateRow: () => {},
      updateRows: () => {},
    },
    filters: {
      activeCount: computed(() => 0),
      clear: () => {},
      remove: () => {},
      replace: () => {},
      search: computed({ get: () => '', set: () => {} }),
      state: computed(() => ({ search: '', ui: [] })),
    },
    layout: {
      set: () => {},
      state: computed(() => ({ active: 'table' as const, available: ['table', 'grid'] })),
    },
    pagination: {
      mode: 'offset',
      next: () => {},
      pageSizeOptions: computed(() => [20]),
      previous: () => {},
      reset: () => {},
      setPage: () => {},
      setPageSize: () => {},
      state: paginationState,
    },
    refresh: async () => {
      throw new Error('not implemented')
    },
    reset: {
      all: () => {},
      query: () => {},
    },
    selection: {
      clear: () => {},
      isSelected: () => false,
      selectAll: () => {},
      selectRows: () => {},
      state: selectionState,
      toggle: () => {},
      unselectRows: () => {},
    },
    sorting: {
      clear: () => {},
      set: () => {},
      setDirection: () => {},
      setKey: () => {},
      sortKeys: computed(() => []),
      state: sortingState,
      toggle: () => {},
    },
    state: {
      initialized: trueValue,
      isEmpty: trueValue,
      isLoading: falseValue,
      isRefreshing: falseValue,
      layout,
      query,
    },
    updateRow: () => {},
    updateRows: () => {},
  }

  return tableApi
}

function createScope(row: DemoRow, index = 0) {
  return {
    context: {},
    index,
    layout: 'table' as const,
    pageContext: {},
    row,
    tableApi: createTableApiStub(),
  }
}

describe('row actions', () => {
  it('prunes hidden actions and empty parent groups', () => {
    const schema = {
      rowActions: [
        {
          action: () => {},
          condition: () => false,
          key: 'hidden',
          label: 'Hidden',
        },
        {
          children: [
            {
              action: () => {},
              condition: () => false,
              key: 'group-hidden',
              label: 'Group hidden',
            },
          ],
          key: 'group',
          label: 'Group',
        },
        {
          action: () => {},
          key: 'toggle',
          label: () => 'Pause',
        },
      ],
    }

    expect(
      resolveVisibleTableRowActions({
        schema,
        scope: createScope({ active: true, id: '1' }),
      }),
    ).toMatchObject([
      {
        action: expect.any(Function),
        key: 'toggle',
        label: expect.any(Function),
      },
    ])
  })

  it('keeps actionable parents even when all children are hidden', () => {
    const schema = {
      rowActions: [
        {
          children: [
            {
              action: () => {},
              condition: () => false,
              key: 'hidden-child',
              label: 'Hidden child',
            },
          ],
          href: '/users/1',
          key: 'parent',
          label: 'Parent',
        },
      ],
    }

    const [action] = resolveVisibleTableRowActions({
      schema,
      scope: createScope({ active: true, id: '1' }),
    })

    expect(action?.key).toBe('parent')
    expect(action?.children).toBeUndefined()
  })

  it('hides the synthetic column when no current row resolves visible actions', () => {
    const schema = {
      rowActions: [
        {
          action: () => {},
          condition: () => false,
          key: 'never',
          label: 'Never',
        },
      ],
    }

    expect(
      hasVisibleTableRowActions({
        context: {},
        layout: 'table',
        pageContext: {},
        rows: [{ active: false, id: '1' }],
        schema,
        tableApi: createTableApiStub(),
      }),
    ).toBeFalsy()
  })

  it('creates dropdown items only for visible actions', () => {
    const schema = {
      rowActions: [
        {
          action: () => {},
          key: 'copy',
          label: () => '1 copy',
        },
        {
          action: () => {},
          condition: () => false,
          key: 'hidden',
          label: 'Hidden',
        },
      ],
    }

    const scope = createScope({ active: true, id: '1' })
    const items = createRowActionDropdownItems({
      actions: resolveVisibleTableRowActions({ schema, scope }),
      scope,
    })

    expect(items).toHaveLength(1)
    expect(items[0]?.label).toBe('1 copy')
  })
})
