import { describe, expect, it } from 'vitest'

import type { TableFilterResolveContext, TableResolvedFilterNode } from '#ui-tools/table/types'
import { createResolvedFilterState } from '#ui-tools/table/utils/resolved-filters'

describe('resolved filters', () => {
  it('resolves ui filters into an engine-ready tree while keeping static groups', () => {
    const state = createResolvedFilterState({
      definitions: [
        {
          behavior: {
            defaultOperator: 'isAnyOf' as const,
          },
          key: 'status',
          kind: 'option' as const,
          label: 'Status',
          resolve({ rule }: TableFilterResolveContext) {
            return {
              children: (Array.isArray(rule.value) ? rule.value : []).map(
                (value): TableResolvedFilterNode<string> => ({
                  type: 'condition' as const,
                  key: 'realStatus',
                  operator: 'is' as const,
                  value,
                }),
              ),
              combinator: 'or' as const,
              type: 'group' as const,
            }
          },
          source: {
            options: [
              { label: 'Live', value: 'live' as const },
              { label: 'Paused', value: 'paused' as const },
            ],
          },
        },
      ],
      filters: {
        search: '',
        ui: [
          {
            key: 'status',
            operator: 'isAnyOf',
            value: ['live', 'paused'],
          },
        ],
      },
      staticFilters: [
        {
          children: [
            {
              key: 'archived',
              operator: 'is',
              type: 'condition',
              value: false,
            },
          ],
          combinator: 'and',
          type: 'group',
        },
      ],
    })

    expect(state).toStrictEqual({
      children: [
        {
          children: [
            {
              type: 'condition',
              key: 'archived',
              operator: 'is',
              value: false,
            },
          ],
          combinator: 'and',
          type: 'group',
        },
        {
          children: [
            {
              type: 'condition',
              key: 'realStatus',
              operator: 'is',
              value: 'live',
            },
            {
              type: 'condition',
              key: 'realStatus',
              operator: 'is',
              value: 'paused',
            },
          ],
          combinator: 'or',
          type: 'group',
        },
      ],
      combinator: 'and',
      type: 'group',
    })
  })
})
