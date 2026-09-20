import { describe, expect, it } from 'vitest'

import type {
  TableBooleanFilterDefinition,
  TableNumberFilterDefinition,
  TableOptionFilterDefinition,
  TableTextFilterDefinition,
} from '#ui-tools/table/types'

import {
  resolveBooleanFilterUi,
  resolveFilterTriggerIcon,
  resolveNumberFilterUi,
  resolveOptionFilterUi,
  resolveTextFilterUi,
} from '../../src/runtime/table/utils/filters/ui'

interface TestRow {
  active: boolean
  amount: number
  name: string
  status: 'active' | 'inactive'
}

describe('filter ui utils', () => {
  it('resolves text filter defaults and overrides', () => {
    const definition = {
      behavior: {
        commitMode: 'auto',
      },
      editor: {
        inputType: 'search',
        placeholder: () => 'Find employee',
      },
      key: 'name',
      kind: 'text',
      label: 'Employee name',
    } satisfies TableTextFilterDefinition<TestRow, object, 'name'>

    const resolved = resolveTextFilterUi(definition, 'contains')

    expect(resolved.placeholder).toBe('Find employee')
    expect(resolved.commitMode).toBe('auto')
    expect(resolved.inputType).toBe('search')
    expect(resolved.leadingIcon).toBe('i-lucide-search')
  })

  it('resolves option and boolean control surfaces', () => {
    const optionDefinition = {
      behavior: {
        defaultOperator: 'isAnyOf',
      },
      editor: {
        closeOnSelect: true,
        labels: {
          searchPlaceholder: () => 'Pick a status',
        },
        presentation: 'tree',
        searchable: false,
        selection: {
          mode: 'multiple',
        },
        tree: {
          searchMode: 'remote',
          selectable: 'leaf-only',
        },
      },
      key: 'status',
      kind: 'option',
      label: 'Status',
      source: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ],
      },
    } satisfies TableOptionFilterDefinition<TestRow, object, 'status'>

    const booleanDefinition = {
      editor: {
        labels: {
          false: 'Paused',
          true: 'Online',
        },
      },
      key: 'active',
      kind: 'boolean',
      label: 'Active',
    } satisfies TableBooleanFilterDefinition<TestRow, object, 'active'>

    const optionUi = resolveOptionFilterUi(optionDefinition, 'isAnyOf')
    const booleanUi = resolveBooleanFilterUi(booleanDefinition, 'is')

    expect(optionUi.searchable).toBeFalsy()
    expect(optionUi.closeOnSelect).toBeTruthy()
    expect([
      optionUi.presentation,
      optionUi.tree.selectable,
      optionUi.tree.searchMode,
      optionUi.tree.branchSelection,
      optionUi.labels.searchPlaceholder,
      optionUi.selection.mode,
      booleanUi.labels.true,
      booleanUi.labels.false,
    ]).toStrictEqual([
      'tree',
      'leaf-only',
      'remote',
      'children',
      'Pick a status',
      'multiple',
      'Online',
      'Paused',
    ])
  })

  it('switches number active control from scalar to range based on operator', () => {
    const definition = {
      editor: {
        max: 100,
        min: 0,
        range: {
          display: 'inputs-slider',
          minGap: 10,
        },
        scalar: {
          display: 'slider',
        },
        step: 5,
      },
      key: 'amount',
      kind: 'number',
      label: 'Amount',
    } satisfies TableNumberFilterDefinition<TestRow, object, 'amount'>

    const scalarUi = resolveNumberFilterUi(definition, 'gte')
    const rangeUi = resolveNumberFilterUi(definition, 'between')

    expect(scalarUi.scalar.display).toBe('slider')
    expect(rangeUi.range.display).toBe('inputs-slider')
    expect(rangeUi.range.minGap).toBe(10)
  })

  it('resolves default trigger icons with display overrides', () => {
    const optionDefinition = {
      key: 'status',
      kind: 'option',
      label: 'Status',
    } satisfies TableOptionFilterDefinition<TestRow, object, 'status'>

    const booleanDefinition = {
      display: {
        icon: 'i-lucide-badge-check',
      },
      key: 'active',
      kind: 'boolean',
      label: 'Active',
    } satisfies TableBooleanFilterDefinition<TestRow, object, 'active'>

    expect(resolveFilterTriggerIcon(optionDefinition)).toBe('i-lucide-filter')
    expect(resolveFilterTriggerIcon(booleanDefinition)).toBe('i-lucide-badge-check')
  })
})
