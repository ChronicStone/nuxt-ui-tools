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
                  key: 'realStatus',
                  operator: 'is' as const,
                  type: 'condition' as const,
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
              key: 'archived',
              operator: 'is',
              type: 'condition',
              value: false,
            },
          ],
          combinator: 'and',
          type: 'group',
        },
        {
          children: [
            {
              key: 'realStatus',
              operator: 'is',
              type: 'condition',
              value: 'live',
            },
            {
              key: 'realStatus',
              operator: 'is',
              type: 'condition',
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
