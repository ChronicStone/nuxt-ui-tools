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
        lead: {
          name: 'Charles Babbage',
        },
        name: 'Analytics',
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
        lead: {
          name: 'Howard Aiken',
        },
        name: 'Compiler',
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
        lead: {
          name: 'Dorothy Vaughan',
        },
        name: 'Flight',
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
        lead: {
          name: 'John Guttag',
        },
        name: 'Systems',
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
        fields,
        value: request.search?.value ?? '',
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
            children: [
              {
                children: [
                  {
                    children: [
                      {
                        key: 'status',
                        operator: 'is',
                        type: 'condition',
                        value: 'active',
                      },
                      {
                        key: 'verified',
                        operator: 'is',
                        type: 'condition',
                        value: true,
                      },
                    ],
                    combinator: 'and',
                    type: 'group',
                  },
                  {
                    key: 'status',
                    operator: 'is',
                    type: 'condition',
                    value: 'inactive',
                  },
                ],
                combinator: 'or',
                type: 'group',
              },
              {
                key: 'score',
                operator: 'between',
                type: 'condition',
                value: {
                  from: 1,
                  to: 30,
                },
              },
            ],
            combinator: 'and',
            type: 'group',
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
                  key: 'tags',
                  operator: 'contains',
                  type: 'condition',
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
                key: 'verified',
                operator: 'is',
                type: 'condition',
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
                key: 'createdAt',
                operator: 'is',
                type: 'condition',
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
                key: 'status',
                operator: 'isNot',
                type: 'condition',
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
                key: 'status',
                operator: 'isAnyOf',
                type: 'condition',
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
                  key: 'tags',
                  operator: 'isAnyOf',
                  type: 'condition',
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
                key: 'score',
                operator: 'gt',
                type: 'condition',
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
                key: 'score',
                operator: 'gte',
                type: 'condition',
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
                key: 'score',
                operator: 'lt',
                type: 'condition',
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
                key: 'score',
                operator: 'lte',
                type: 'condition',
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
                key: 'score',
                operator: 'between',
                type: 'condition',
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
                key: 'score',
                operator: 'between',
                type: 'condition',
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
                key: 'createdAt',
                operator: 'between',
                type: 'condition',
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
                key: 'createdAt',
                operator: 'after',
                type: 'condition',
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
                key: 'createdAt',
                operator: 'before',
                type: 'condition',
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
                key: 'score',
                operator: 'between',
                type: 'condition',
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
            fields: [],
            value: 'definitely-not-present',
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
          pagination: {
            count: 'exact',
            mode: 'offset',
            pageIndex: 2,
            pageSize: 2,
          },
          search: {
            fields: ['name', 'tags'],
            value: 'a',
          },
          sorting: [
            {
              dir: 'desc',
              key: 'score',
            },
          ],
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
              dir: 'asc',
              key: 'priority',
            },
            {
              dir: 'desc',
              key: 'score',
            },
            {
              dir: 'asc',
              key: 'lastLogin',
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
            count: 'exact',
            mode: 'offset',
            pageIndex: 0,
            pageSize: 0,
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
            count: 'exact',
            mode: 'offset',
            pageIndex: 3,
            pageSize: 2,
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
