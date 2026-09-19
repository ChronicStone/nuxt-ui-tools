import { describe, expect, it } from 'vitest'

import type {
  GenericObject,
  TableKnownFieldPath,
  TableSourceRequestContext,
} from '#ui-tools/table/types'
import { executeClientQuery } from '#ui-tools/table/utils/client-query'

type TestRow = GenericObject & {
  id: string
  name: string
  status: 'active' | 'inactive'
  verified: boolean
  score: number
  priority: number
  createdAt: Date
  tags: string[]
  profile: {
    city: string
    aliases: string[]
  }
  teams: {
    name: string
    lead: {
      name: string
    }
  }[]
  lastLogin?: Date | null
}

const rows: TestRow[] = [
  {
    createdAt: new Date('2026-03-10T08:00:00.000Z'),
    id: 'usr_1',
    lastLogin: new Date('2026-03-12T09:30:00.000Z'),
    name: 'Ada Lovelace',
    priority: 2,
    profile: {
      aliases: ['Enchantress of Numbers'],
      city: 'London',
    },
    score: 12,
    status: 'active',
    tags: ['math', 'history'],
    teams: [
      {
        name: 'Analytics',
        lead: {
          name: 'Charles Babbage',
        },
      },
    ],
    verified: true,
  },
  {
    createdAt: new Date('2026-03-08T08:00:00.000Z'),
    id: 'usr_2',
    lastLogin: null,
    name: 'Grace Hopper',
    priority: 3,
    profile: {
      aliases: ['Amazing Grace'],
      city: 'New York',
    },
    score: 21,
    status: 'inactive',
    tags: ['compiler'],
    teams: [
      {
        name: 'Compiler',
        lead: {
          name: 'Howard Aiken',
        },
      },
    ],
    verified: false,
  },
  {
    createdAt: new Date('2026-03-06T08:00:00.000Z'),
    id: 'usr_3',
    lastLogin: new Date('2026-03-07T07:00:00.000Z'),
    name: 'Katherine Johnson',
    priority: 2,
    profile: {
      aliases: ['Kat'],
      city: 'White Sulphur Springs',
    },
    score: 28,
    status: 'active',
    tags: ['space'],
    teams: [
      {
        name: 'Flight',
        lead: {
          name: 'Dorothy Vaughan',
        },
      },
    ],
    verified: false,
  },
  {
    createdAt: new Date('2026-03-04T08:00:00.000Z'),
    id: 'usr_4',
    lastLogin: undefined,
    name: 'Barbara Liskov',
    priority: 1,
    profile: {
      aliases: ['Liskov'],
      city: 'Los Angeles',
    },
    score: 42,
    status: 'active',
    tags: ['compiler', 'distributed'],
    teams: [
      {
        name: 'Systems',
        lead: {
          name: 'John Guttag',
        },
      },
    ],
    verified: true,
  },
]

function createRequest(
  overrides: Partial<TableSourceRequestContext<TestRow>> = {},
): TableSourceRequestContext<TestRow> {
  return {
    context: {},
    filters: {
      children: [],
      combinator: 'and',
      type: 'group',
    },
    pagination: {
      count: 'exact',
      mode: 'offset',
      pageIndex: 1,
      pageSize: 50,
    },
    search: {
      fields: [],
      value: '',
    },
    sorting: [],
    ...overrides,
  }
}

function queryIds(
  request: Partial<TableSourceRequestContext<TestRow>>,
  fields: TableKnownFieldPath<TestRow>[] = ['name'],
): string[] {
  return executeClientQuery({
    request: createRequest({
      ...request,
      search: {
        value: request.search?.value ?? '',
        fields,
      },
    }),
    rows,
  }).rows.map((row) => row.id)
}

describe(executeClientQuery, () => {
  describe('filters', () => {
    it('evaluates nested and/or resolved filter groups', () => {
      const result = executeClientQuery({
        request: createRequest({
          filters: {
            type: 'group',
            combinator: 'and',
            children: [
              {
                type: 'group',
                combinator: 'or',
                children: [
                  {
                    type: 'group',
                    combinator: 'and',
                    children: [
                      {
                        type: 'condition',
                        key: 'status',
                        operator: 'is',
                        value: 'active',
                      },
                      {
                        type: 'condition',
                        key: 'verified',
                        operator: 'is',
                        value: true,
                      },
                    ],
                  },
                  {
                    type: 'condition',
                    key: 'status',
                    operator: 'is',
                    value: 'inactive',
                  },
                ],
              },
              {
                type: 'condition',
                key: 'score',
                operator: 'between',
                value: {
                  from: 1,
                  to: 30,
                },
              },
            ],
          },
        }),
        rows,
      })

      expect(result.rowCount).toBe(2)
      expect(result.rows.map((row) => row.id)).toStrictEqual(['usr_1', 'usr_2'])
    })

    it('supports contains across strings and array values with case-insensitive matching', () => {
      expect(
        queryIds(
          {
            filters: {
              children: [
                {
                  type: 'condition',
                  key: 'tags',
                  operator: 'contains',
                  value: 'COMP',
                },
              ],
              combinator: 'and',
              type: 'group',
            },
          },
          ['name', 'tags'],
        ),
      ).toStrictEqual(['usr_2', 'usr_4'])
    })

    it('supports is and isNot for scalar and date values', () => {
      expect(
        queryIds({
          filters: {
            children: [
              {
                type: 'condition',
                key: 'verified',
                operator: 'is',
                value: true,
              },
            ],
            combinator: 'and',
            type: 'group',
          },
        }),
      ).toStrictEqual(['usr_1', 'usr_4'])

      expect(
        queryIds({
          filters: {
            children: [
              {
                type: 'condition',
                key: 'createdAt',
                operator: 'is',
                value: '2026-03-08T08:00:00.000Z',
              },
            ],
            combinator: 'and',
            type: 'group',
          },
        }),
      ).toStrictEqual(['usr_2'])

      expect(
        queryIds({
          filters: {
            children: [
              {
                type: 'condition',
                key: 'status',
                operator: 'isNot',
                value: 'active',
              },
            ],
            combinator: 'and',
            type: 'group',
          },
        }),
      ).toStrictEqual(['usr_2'])
    })

    it('supports isAnyOf for scalar fields and array fields', () => {
      expect(
        queryIds({
          filters: {
            children: [
              {
                type: 'condition',
                key: 'status',
                operator: 'isAnyOf',
                value: ['inactive', 'pending'],
              },
            ],
            combinator: 'and',
            type: 'group',
          },
        }),
      ).toStrictEqual(['usr_2'])

      expect(
        queryIds(
          {
            filters: {
              children: [
                {
                  type: 'condition',
                  key: 'tags',
                  operator: 'isAnyOf',
                  value: ['distributed', 'space'],
                },
              ],
              combinator: 'and',
              type: 'group',
            },
          },
          ['name', 'tags'],
        ),
      ).toStrictEqual(['usr_3', 'usr_4'])
    })

    it('supports gt, gte, lt and lte comparisons', () => {
      expect(
        queryIds({
          filters: {
            children: [
              {
                type: 'condition',
                key: 'score',
                operator: 'gt',
                value: 21,
              },
            ],
            combinator: 'and',
            type: 'group',
          },
        }),
      ).toStrictEqual(['usr_3', 'usr_4'])

      expect(
        queryIds({
          filters: {
            children: [
              {
                type: 'condition',
                key: 'score',
                operator: 'gte',
                value: 21,
              },
            ],
            combinator: 'and',
            type: 'group',
          },
        }),
      ).toStrictEqual(['usr_2', 'usr_3', 'usr_4'])

      expect(
        queryIds({
          filters: {
            children: [
              {
                type: 'condition',
                key: 'score',
                operator: 'lt',
                value: 21,
              },
            ],
            combinator: 'and',
            type: 'group',
          },
        }),
      ).toStrictEqual(['usr_1'])

      expect(
        queryIds({
          filters: {
            children: [
              {
                type: 'condition',
                key: 'score',
                operator: 'lte',
                value: 21,
              },
            ],
            combinator: 'and',
            type: 'group',
          },
        }),
      ).toStrictEqual(['usr_1', 'usr_2'])
    })

    it('supports between with inclusive and open-ended ranges for numbers and dates', () => {
      expect(
        queryIds({
          filters: {
            children: [
              {
                type: 'condition',
                key: 'score',
                operator: 'between',
                value: {
                  from: 12,
                  to: 28,
                },
              },
            ],
            combinator: 'and',
            type: 'group',
          },
        }),
      ).toStrictEqual(['usr_1', 'usr_2', 'usr_3'])

      expect(
        queryIds({
          filters: {
            children: [
              {
                type: 'condition',
                key: 'score',
                operator: 'between',
                value: {
                  from: 28,
                },
              },
            ],
            combinator: 'and',
            type: 'group',
          },
        }),
      ).toStrictEqual(['usr_3', 'usr_4'])

      expect(
        queryIds({
          filters: {
            children: [
              {
                type: 'condition',
                key: 'createdAt',
                operator: 'between',
                value: {
                  from: new Date('2026-03-05T00:00:00.000Z'),
                  to: new Date('2026-03-10T08:00:00.000Z'),
                },
              },
            ],
            combinator: 'and',
            type: 'group',
          },
        }),
      ).toStrictEqual(['usr_1', 'usr_2', 'usr_3'])
    })

    it('supports before and after date comparisons', () => {
      expect(
        queryIds({
          filters: {
            children: [
              {
                type: 'condition',
                key: 'createdAt',
                operator: 'after',
                value: new Date('2026-03-05T00:00:00.000Z'),
              },
            ],
            combinator: 'and',
            type: 'group',
          },
        }),
      ).toStrictEqual(['usr_1', 'usr_2', 'usr_3'])

      expect(
        queryIds({
          filters: {
            children: [
              {
                type: 'condition',
                key: 'createdAt',
                operator: 'before',
                value: new Date('2026-03-06T08:00:00.000Z'),
              },
            ],
            combinator: 'and',
            type: 'group',
          },
        }),
      ).toStrictEqual(['usr_4'])
    })

    it('returns no matches for invalid between payloads and unsupported operators', () => {
      expect(
        queryIds({
          filters: {
            children: [
              {
                type: 'condition',
                key: 'score',
                operator: 'between',
                value: 12,
              },
            ],
            combinator: 'and',
            type: 'group',
          },
        }),
      ).toStrictEqual([])

      expect(
        queryIds({
          filters: {
            children: [
              {
                type: 'condition',
                key: 'score',
                // SAFETY: this case intentionally verifies that an unsupported runtime operator is rejected.
                operator: 'unknown' as never,
                value: 12,
              },
            ],
            combinator: 'and',
            type: 'group',
          },
        }),
      ).toStrictEqual([])
    })
  })

  describe('search', () => {
    it('applies search across provided fields only', () => {
      expect(
        queryIds(
          {
            search: {
              fields: [],
              value: 'los',
            },
          },
          ['profile.city'],
        ),
      ).toStrictEqual(['usr_4'])

      expect(
        queryIds(
          {
            search: {
              fields: [],
              value: 'los',
            },
          },
          ['name'],
        ),
      ).toStrictEqual([])
    })

    it('matches nested array paths and array leaf values', () => {
      expect(
        queryIds(
          {
            search: {
              fields: [],
              value: 'dorothy',
            },
          },
          ['teams.lead.name'],
        ),
      ).toStrictEqual(['usr_3'])

      expect(
        queryIds(
          {
            search: {
              fields: [],
              value: 'numbers',
            },
          },
          ['profile.aliases'],
        ),
      ).toStrictEqual(['usr_1'])
    })

    it('ignores search when no search fields are provided', () => {
      const result = executeClientQuery({
        request: createRequest({
          search: {
            value: 'definitely-not-present',
            fields: [],
          },
        }),
        rows,
      })

      expect(result.rowCount).toBe(4)
      expect(result.rows.map((row) => row.id)).toStrictEqual(['usr_1', 'usr_2', 'usr_3', 'usr_4'])
    })
  })

  describe('sorting and pagination', () => {
    it('applies search, sorting and pagination on client rows', () => {
      const result = executeClientQuery({
        request: createRequest({
          search: {
            value: 'a',
            fields: ['name', 'tags'],
          },
          sorting: [
            {
              key: 'score',
              dir: 'desc',
            },
          ],
          pagination: {
            mode: 'offset',
            pageIndex: 2,
            pageSize: 2,
            count: 'exact',
          },
        }),
        rows,
      })

      expect(result.rowCount).toBe(4)
      expect(result.rows.map((row) => row.id)).toStrictEqual(['usr_2', 'usr_1'])
    })

    it('supports multi-column sorting and places nullish values last', () => {
      const result = executeClientQuery({
        request: createRequest({
          sorting: [
            {
              key: 'priority',
              dir: 'asc',
            },
            {
              key: 'score',
              dir: 'desc',
            },
            {
              key: 'lastLogin',
              dir: 'asc',
            },
          ],
        }),
        rows,
      })

      expect(result.rows.map((row) => row.id)).toStrictEqual(['usr_4', 'usr_3', 'usr_1', 'usr_2'])
    })

    it('clamps invalid pagination values to the minimum page and size', () => {
      const result = executeClientQuery({
        request: createRequest({
          pagination: {
            mode: 'offset',
            pageIndex: 0,
            pageSize: 0,
            count: 'exact',
          },
        }),
        rows,
      })

      expect(result.rowCount).toBe(4)
      expect(result.rows.map((row) => row.id)).toStrictEqual(['usr_1'])
    })

    it('returns an empty page when the page index exceeds available rows', () => {
      const result = executeClientQuery({
        request: createRequest({
          pagination: {
            mode: 'offset',
            pageIndex: 3,
            pageSize: 2,
            count: 'exact',
          },
        }),
        rows,
      })

      expect(result.rowCount).toBe(4)
      expect(result.rows).toStrictEqual([])
    })

    it('does not slice client rows when pagination is disabled', () => {
      const result = executeClientQuery({
        request: createRequest({ pagination: { mode: 'none' } }),
        rows,
      })

      expect(result.rowCount).toBe(4)
      expect(result.rows).toHaveLength(4)
    })
  })
})
