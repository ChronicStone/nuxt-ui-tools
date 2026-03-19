import { describe, expect, it } from 'vitest'

import type {
  TableBooleanFilterDefinition,
  TableNumberFilterDefinition,
  TableOptionFilterDefinition,
  TableTextFilterDefinition,
} from '#ui-tools/table/types'
import {
  resolveBooleanFilterUi,
  resolveNumberFilterUi,
  resolveOptionFilterUi,
  resolveTextFilterUi,
} from '../../src/runtime/table/utils/filters/ui'

type TestRow = {
  active: boolean
  amount: number
  name: string
  status: 'active' | 'inactive'
}

describe('filter ui utils', () => {
  it('resolves text filter defaults and overrides', () => {
    const definition = {
      kind: 'text',
      key: 'name',
      label: 'Employee name',
      ui: {
        placeholder: () => 'Find employee',
        commitMode: 'auto',
        inputType: 'search',
      },
    } satisfies TableTextFilterDefinition<TestRow, object, 'name'>

    const resolved = resolveTextFilterUi(definition, 'contains')

    expect(resolved.placeholder).toBe('Find employee')
    expect(resolved.commitMode).toBe('auto')
    expect(resolved.inputType).toBe('search')
    expect(resolved.leadingIcon).toBe('i-lucide-search')
  })

  it('resolves option and boolean control surfaces', () => {
    const optionDefinition = {
      kind: 'option',
      key: 'status',
      label: 'Status',
      defaultOperator: 'isAnyOf',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
      ui: {
        searchable: false,
        closeOnSelect: true,
        presentation: 'tree',
        tree: {
          selectable: 'leaf-only',
          searchMode: 'remote',
        },
        labels: {
          searchPlaceholder: () => 'Pick a status',
        },
        selection: {
          mode: 'multiple',
        },
      },
    } satisfies TableOptionFilterDefinition<TestRow, object, 'status'>

    const booleanDefinition = {
      kind: 'boolean',
      key: 'active',
      label: 'Active',
      ui: {
        labels: {
          true: 'Online',
          false: 'Paused',
        },
      },
    } satisfies TableBooleanFilterDefinition<TestRow, object, 'active'>

    const optionUi = resolveOptionFilterUi(optionDefinition, 'isAnyOf')
    const booleanUi = resolveBooleanFilterUi(booleanDefinition, 'is')

    expect(optionUi.searchable).toBe(false)
    expect(optionUi.closeOnSelect).toBe(true)
    expect(optionUi.presentation).toBe('tree')
    expect(optionUi.tree.selectable).toBe('leaf-only')
    expect(optionUi.tree.searchMode).toBe('remote')
    expect(optionUi.labels.searchPlaceholder).toBe('Pick a status')
    expect(optionUi.selection.mode).toBe('multiple')
    expect(booleanUi.labels.true).toBe('Online')
    expect(booleanUi.labels.false).toBe('Paused')
  })

  it('switches number active control from scalar to range based on operator', () => {
    const definition = {
      kind: 'number',
      key: 'amount',
      label: 'Amount',
      ui: {
        min: 0,
        max: 100,
        step: 5,
        scalar: {
          display: 'slider',
        },
        range: {
          display: 'inputs-slider',
          minGap: 10,
        },
      },
    } satisfies TableNumberFilterDefinition<TestRow, object, 'amount'>

    const scalarUi = resolveNumberFilterUi(definition, 'gte')
    const rangeUi = resolveNumberFilterUi(definition, 'between')

    expect(scalarUi.scalar.display).toBe('slider')
    expect(rangeUi.range.display).toBe('inputs-slider')
    expect(rangeUi.range.minGap).toBe(10)
  })
})
