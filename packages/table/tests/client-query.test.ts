import { describe, expect, it } from 'vitest'

import type { GenericObject, TableSourceRequestContext } from '../src/types'
import { executeClientQuery } from '../src/utils'

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
  teams: Array<{
    name: string
    lead: {
      name: string
    }
  }>
  lastLogin?: Date | null
}

const rows: TestRow[] = [
  {
    id: 'usr_1',
    name: 'Ada Lovelace',
    status: 'active',
    verified: true,
    score: 12,
    priority: 2,
    createdAt: new Date('2026-03-10T08:00:00.000Z'),
    tags: ['math', 'history'],
    profile: {
      city: 'London',
      aliases: ['Enchantress of Numbers'],
    },
    teams: [
      {
        name: 'Analytics',
        lead: {
          name: 'Charles Babbage',
        },
      },
    ],
    lastLogin: new Date('2026-03-12T09:30:00.000Z'),
  },
  {
    id: 'usr_2',
    name: 'Grace Hopper',
    status: 'inactive',
    verified: false,
    score: 21,
    priority: 3,
    createdAt: new Date('2026-03-08T08:00:00.000Z'),
    tags: ['compiler'],
    profile: {
      city: 'New York',
      aliases: ['Amazing Grace'],
    },
    teams: [
      {
        name: 'Compiler',
        lead: {
          name: 'Howard Aiken',
        },
      },
    ],
    lastLogin: null,
  },
  {
    id: 'usr_3',
    name: 'Katherine Johnson',
    status: 'active',
    verified: false,
    score: 28,
    priority: 2,
    createdAt: new Date('2026-03-06T08:00:00.000Z'),
    tags: ['space'],
    profile: {
      city: 'White Sulphur Springs',
      aliases: ['Kat'],
    },
    teams: [
      {
        name: 'Flight',
        lead: {
          name: 'Dorothy Vaughan',
        },
      },
    ],
    lastLogin: new Date('2026-03-07T07:00:00.000Z'),
  },
  {
    id: 'usr_4',
    name: 'Barbara Liskov',
    status: 'active',
    verified: true,
    score: 42,
    priority: 1,
    createdAt: new Date('2026-03-04T08:00:00.000Z'),
    tags: ['compiler', 'distributed'],
    profile: {
      city: 'Los Angeles',
      aliases: ['Liskov'],
    },
    teams: [
      {
        name: 'Systems',
        lead: {
          name: 'John Guttag',
        },
      },
    ],
    lastLogin: undefined,
  },
]

function createRequest(
  overrides: Partial<TableSourceRequestContext<TestRow>> = {},
): TableSourceRequestContext<TestRow> {
  return {
    context: {},
    search: '',
    sorting: [],
    pagination: {
      pageIndex: 1,
      pageSize: 50,
    },
    filters: {
      type: 'group',
      combinator: 'and',
      children: [],
    },
    ...overrides,
  }
}

function queryIds(
  request: Partial<TableSourceRequestContext<TestRow>>,
  searchFields: string[] = ['name'],
): string[] {
  return executeClientQuery({
    rows,
    request: createRequest(request),
    searchFields,
  }).rows.map((row) => row.id)
}

describe('executeClientQuery', () => {
  describe('filters', () => {
    it('evaluates nested and/or resolved filter groups', () => {
      const result = executeClientQuery({
        rows,
        searchFields: ['name'],
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
      })

      expect(result.rowCount).toBe(2)
      expect(result.rows.map((row) => row.id)).toEqual(['usr_1', 'usr_2'])
    })

    it('supports contains across strings and array values with case-insensitive matching', () => {
      expect(
        queryIds(
          {
            filters: {
              type: 'group',
              combinator: 'and',
              children: [
                {
                  type: 'condition',
                  key: 'tags',
                  operator: 'contains',
                  value: 'COMP',
                },
              ],
            },
          },
          ['name', 'tags'],
        ),
      ).toEqual(['usr_2', 'usr_4'])
    })

    it('supports is and isNot for scalar and date values', () => {
      expect(
        queryIds({
          filters: {
            type: 'group',
            combinator: 'and',
            children: [
              {
                type: 'condition',
                key: 'verified',
                operator: 'is',
                value: true,
              },
            ],
          },
        }),
      ).toEqual(['usr_1', 'usr_4'])

      expect(
        queryIds({
          filters: {
            type: 'group',
            combinator: 'and',
            children: [
              {
                type: 'condition',
                key: 'createdAt',
                operator: 'is',
                value: '2026-03-08T08:00:00.000Z',
              },
            ],
          },
        }),
      ).toEqual(['usr_2'])

      expect(
        queryIds({
          filters: {
            type: 'group',
            combinator: 'and',
            children: [
              {
                type: 'condition',
                key: 'status',
                operator: 'isNot',
                value: 'active',
              },
            ],
          },
        }),
      ).toEqual(['usr_2'])
    })

    it('supports isAnyOf for scalar fields and array fields', () => {
      expect(
        queryIds({
          filters: {
            type: 'group',
            combinator: 'and',
            children: [
              {
                type: 'condition',
                key: 'status',
                operator: 'isAnyOf',
                value: ['inactive', 'pending'],
              },
            ],
          },
        }),
      ).toEqual(['usr_2'])

      expect(
        queryIds(
          {
            filters: {
              type: 'group',
              combinator: 'and',
              children: [
                {
                  type: 'condition',
                  key: 'tags',
                  operator: 'isAnyOf',
                  value: ['distributed', 'space'],
                },
              ],
            },
          },
          ['name', 'tags'],
        ),
      ).toEqual(['usr_3', 'usr_4'])
    })

    it('supports gt, gte, lt and lte comparisons', () => {
      expect(
        queryIds({
          filters: {
            type: 'group',
            combinator: 'and',
            children: [
              {
                type: 'condition',
                key: 'score',
                operator: 'gt',
                value: 21,
              },
            ],
          },
        }),
      ).toEqual(['usr_3', 'usr_4'])

      expect(
        queryIds({
          filters: {
            type: 'group',
            combinator: 'and',
            children: [
              {
                type: 'condition',
                key: 'score',
                operator: 'gte',
                value: 21,
              },
            ],
          },
        }),
      ).toEqual(['usr_2', 'usr_3', 'usr_4'])

      expect(
        queryIds({
          filters: {
            type: 'group',
            combinator: 'and',
            children: [
              {
                type: 'condition',
                key: 'score',
                operator: 'lt',
                value: 21,
              },
            ],
          },
        }),
      ).toEqual(['usr_1'])

      expect(
        queryIds({
          filters: {
            type: 'group',
            combinator: 'and',
            children: [
              {
                type: 'condition',
                key: 'score',
                operator: 'lte',
                value: 21,
              },
            ],
          },
        }),
      ).toEqual(['usr_1', 'usr_2'])
    })

    it('supports between with inclusive and open-ended ranges for numbers and dates', () => {
      expect(
        queryIds({
          filters: {
            type: 'group',
            combinator: 'and',
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
          },
        }),
      ).toEqual(['usr_1', 'usr_2', 'usr_3'])

      expect(
        queryIds({
          filters: {
            type: 'group',
            combinator: 'and',
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
          },
        }),
      ).toEqual(['usr_3', 'usr_4'])

      expect(
        queryIds({
          filters: {
            type: 'group',
            combinator: 'and',
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
          },
        }),
      ).toEqual(['usr_1', 'usr_2', 'usr_3'])
    })

    it('supports before and after date comparisons', () => {
      expect(
        queryIds({
          filters: {
            type: 'group',
            combinator: 'and',
            children: [
              {
                type: 'condition',
                key: 'createdAt',
                operator: 'after',
                value: new Date('2026-03-05T00:00:00.000Z'),
              },
            ],
          },
        }),
      ).toEqual(['usr_1', 'usr_2', 'usr_3'])

      expect(
        queryIds({
          filters: {
            type: 'group',
            combinator: 'and',
            children: [
              {
                type: 'condition',
                key: 'createdAt',
                operator: 'before',
                value: new Date('2026-03-06T08:00:00.000Z'),
              },
            ],
          },
        }),
      ).toEqual(['usr_4'])
    })

    it('returns no matches for invalid between payloads and unsupported operators', () => {
      expect(
        queryIds({
          filters: {
            type: 'group',
            combinator: 'and',
            children: [
              {
                type: 'condition',
                key: 'score',
                operator: 'between',
                value: 12,
              },
            ],
          },
        }),
      ).toEqual([])

      expect(
        queryIds({
          filters: {
            type: 'group',
            combinator: 'and',
            children: [
              {
                type: 'condition',
                key: 'score',
                operator: 'unknown' as never,
                value: 12,
              },
            ],
          },
        }),
      ).toEqual([])
    })
  })

  describe('search', () => {
    it('applies search across provided fields only', () => {
      expect(
        queryIds(
          {
            search: 'los',
          },
          ['profile.city'],
        ),
      ).toEqual(['usr_4'])

      expect(
        queryIds(
          {
            search: 'los',
          },
          ['name'],
        ),
      ).toEqual([])
    })

    it('matches nested array paths and array leaf values', () => {
      expect(
        queryIds(
          {
            search: 'dorothy',
          },
          ['teams.lead.name'],
        ),
      ).toEqual(['usr_3'])

      expect(
        queryIds(
          {
            search: 'numbers',
          },
          ['profile.aliases'],
        ),
      ).toEqual(['usr_1'])
    })

    it('ignores search when no search fields are provided', () => {
      const result = executeClientQuery({
        rows,
        request: createRequest({
          search: 'definitely-not-present',
        }),
        searchFields: [],
      })

      expect(result.rowCount).toBe(4)
      expect(result.rows.map((row) => row.id)).toEqual(['usr_1', 'usr_2', 'usr_3', 'usr_4'])
    })
  })

  describe('sorting and pagination', () => {
    it('applies search, sorting and pagination on client rows', () => {
      const result = executeClientQuery({
        rows,
        searchFields: ['name', 'tags'],
        request: createRequest({
          search: 'a',
          sorting: [
            {
              key: 'score',
              dir: 'desc',
            },
          ],
          pagination: {
            pageIndex: 2,
            pageSize: 2,
          },
        }),
      })

      expect(result.rowCount).toBe(4)
      expect(result.rows.map((row) => row.id)).toEqual(['usr_2', 'usr_1'])
    })

    it('supports multi-column sorting and places nullish values last', () => {
      const result = executeClientQuery({
        rows,
        searchFields: ['name'],
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
      })

      expect(result.rows.map((row) => row.id)).toEqual(['usr_4', 'usr_3', 'usr_1', 'usr_2'])
    })

    it('normalizes invalid pagination values and preserves total rowCount', () => {
      const result = executeClientQuery({
        rows,
        searchFields: ['name'],
        request: createRequest({
          pagination: {
            pageIndex: 0,
            pageSize: 0,
          },
        }),
      })

      expect(result.rowCount).toBe(4)
      expect(result.rows.map((row) => row.id)).toEqual(['usr_1', 'usr_2', 'usr_3', 'usr_4'])
    })

    it('returns an empty page when the page index exceeds available rows', () => {
      const result = executeClientQuery({
        rows,
        searchFields: ['name'],
        request: createRequest({
          pagination: {
            pageIndex: 3,
            pageSize: 2,
          },
        }),
      })

      expect(result.rowCount).toBe(4)
      expect(result.rows).toEqual([])
    })
  })
})
