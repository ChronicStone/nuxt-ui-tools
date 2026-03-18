import { describe, expect, it } from 'vitest'

import type { TableFilterResolveContext, TableResolvedFilterNode } from '#table/types'
import { createResolvedFilterState } from '#table/utils/resolved-filters'

describe('resolved filters', () => {
  it('resolves ui filters into an engine-ready tree while keeping static groups', () => {
    const state = createResolvedFilterState({
      definitions: [
        {
          kind: 'option' as const,
          key: 'status',
          label: 'Status',
          defaultOperator: 'isAnyOf' as const,
          options: [
            { label: 'Live', value: 'live' as const },
            { label: 'Paused', value: 'paused' as const },
          ],
          resolve({ rule }: TableFilterResolveContext) {
            return {
              type: 'group' as const,
              combinator: 'or' as const,
              children: (Array.isArray(rule.value) ? rule.value : []).map(
                (value): TableResolvedFilterNode<string> => ({
                  type: 'condition' as const,
                  key: 'realStatus',
                  operator: 'is' as const,
                  value,
                }),
              ),
            }
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
          type: 'group',
          combinator: 'and',
          children: [
            {
              type: 'condition',
              key: 'archived',
              operator: 'is',
              value: false,
            },
          ],
        },
      ],
    })

    expect(state).toEqual({
      type: 'group',
      combinator: 'and',
      children: [
        {
          type: 'group',
          combinator: 'and',
          children: [
            {
              type: 'condition',
              key: 'archived',
              operator: 'is',
              value: false,
            },
          ],
        },
        {
          type: 'group',
          combinator: 'or',
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
        },
      ],
    })
  })
})
