import { describe, expect, it } from 'vitest'

import type { TableGroupBySchema } from '#ui-tools/table/types'
import { buildTableGroups, parseStoredGroupKeys } from '#ui-tools/table/utils/groups'

const exams = [
  { family: 'General English', id: 'g1', name: '4 Skills' },
  { family: 'Schools: Ages 11-15', id: 's2', name: 'Listening' },
  { family: null, id: 'x1', name: 'Legacy' },
  { family: 'Schools: Ages 7-10', id: 's1', name: 'Reading' },
  { family: 'General English', id: 'g2', name: 'Writing' },
  { family: '', id: 'x2', name: 'Blank' },
]

type Exam = (typeof exams)[number]

function build(groupBy: TableGroupBySchema<Exam>, rows = exams) {
  return buildTableGroups({ getRowId: (row) => row.id, groupBy, rows })
}

describe('row groups', () => {
  it('orders groups by value, reading numbers as numbers, with empty values last', () => {
    expect(build({ key: 'family' }).map((group) => group.value)).toEqual([
      'General English',
      'Schools: Ages 7-10',
      'Schools: Ages 11-15',
      undefined,
    ])
  })

  it('puts listed values first, in their order', () => {
    const order = ['Schools: Ages 11-15', 'General English']
    expect(build({ key: 'family', order }).map((group) => group.value)).toEqual([
      'Schools: Ages 11-15',
      'General English',
      'Schools: Ages 7-10',
      undefined,
    ])
  })

  it('keeps the rows of a group in the order the source gave them', () => {
    const [general] = build({ key: 'family' })
    expect(general?.rowIds).toEqual(['g1', 'g2'])
    expect(general?.rows.map((row) => row.name)).toEqual(['4 Skills', 'Writing'])
  })

  it('treats a missing value and a blank one as the same group', () => {
    expect(build({ key: 'family' }).at(-1)?.rowIds).toEqual(['x1', 'x2'])
  })

  it('reads the value through a function and a dotted path', () => {
    const byFirstWord = build({ key: (row) => String(row.name).split(' ')[0] })
    expect(byFirstWord.map((group) => group.value)).toContain('4')
    const nested = buildTableGroups({
      getRowId: (row) => row.id,
      groupBy: { key: 'line.name' },
      rows: [{ id: 'a', line: { name: 'Exams' } }],
    })
    expect(nested.map((group) => group.value)).toEqual(['Exams'])
  })

  it('gives each group a key that does not depend on its rows', () => {
    const before = build({ key: 'family' })[0]?.key
    const after = build({ key: 'family' }, exams.slice(0, 1))[0]?.key
    expect(after).toBe(before)
  })

  it('ignores stored fold state it cannot read', () => {
    expect(parseStoredGroupKeys('["group:\\"a\\"", 3]')).toEqual(['group:"a"'])
    expect(parseStoredGroupKeys('not json')).toEqual([])
    expect(parseStoredGroupKeys('{"a":1}')).toEqual([])
    expect(parseStoredGroupKeys(null)).toEqual([])
  })
})
