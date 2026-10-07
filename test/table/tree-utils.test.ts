import { describe, expect, it } from 'vitest'

import {
  TREE_CHECK_WIDTH,
  TREE_GUTTER_WIDTH,
  TREE_LEAD,
  buildTableTree,
  flattenTreeRows,
  flattenVisibleTree,
  getTreeColumnWidth,
  getTreeLineage,
  getTreeRails,
  getVisibleDescendants,
  isOpenByDefault,
} from '#ui-tools/table/utils/tree'

interface Row {
  id: string
  children?: Row[]
}

const rows: Row[] = [
  {
    children: [
      { children: [{ id: 'a.1.1' }, { id: 'a.1.2' }], id: 'a.1' },
      { id: 'a.2' },
      { children: [{ id: 'a.3.1' }], id: 'a.3' },
    ],
    id: 'a',
  },
  { id: 'b' },
  { children: [{ id: 'c.1' }], id: 'c' },
]

function build(source: readonly object[] = rows, childrenPath = 'children') {
  return buildTableTree({
    childrenPath,
    getRowId: (row, index) => ('id' in row ? String(row.id) : String(index)),
    rows: source,
  })
}

describe('buildTableTree', () => {
  it('indexes depth, parents and the position of the top-level row', () => {
    const { byId, maxDepth } = build()
    expect(maxDepth).toBe(2)
    expect(byId.get('a.1.2')).toMatchObject({ depth: 2, rootIndex: 0 })
    expect(byId.get('a.1.2')?.parent).toBe(byId.get('a.1'))
    expect(byId.get('c.1')).toMatchObject({ depth: 1, rootIndex: 2 })
    expect(byId.get('b')).toMatchObject({ depth: 0, hasChildren: false, parent: null })
  })

  it('lists the branches and keeps the nested source rows untouched', () => {
    const { branches, byId } = build()
    expect(branches.map((node) => node.id).sort()).toStrictEqual(['a', 'a.1', 'a.3', 'c'])
    expect(byId.get('a')?.row).toBe(rows[0])
  })

  it('knows which row ends its siblings', () => {
    const { byId } = build()
    expect(['a.1', 'a.2', 'a.3'].map((id) => byId.get(id)?.isLast)).toStrictEqual([
      false,
      false,
      true,
    ])
    expect(byId.get('c')?.isLast).toBeTruthy()
  })

  it('draws a rail through a row only while an ancestor has a sibling below', () => {
    const { byId } = build()
    const rails = (id: string) => {
      const node = byId.get(id)
      return node ? getTreeRails(node) : undefined
    }
    // a.1 is not the last child of a, so its own children keep a.1's rail running.
    expect(rails('a.1.1')).toStrictEqual([true])
    // a.3 is the last child of a, so a.3.1 has nothing to carry on to.
    expect(rails('a.3.1')).toStrictEqual([false])
    // Children of a top-level row have no ancestor gutter to keep.
    expect(rails('a.1')).toStrictEqual([])
    expect(rails('a')).toStrictEqual([])
  })

  it('records the lineage from the top-level row down', () => {
    const { byId } = build()
    const node = byId.get('a.1.2')
    expect(node && getTreeLineage(node).map((entry) => entry.id)).toStrictEqual([
      'a',
      'a.1',
      'a.1.2',
    ])
  })

  it('reads children through a dotted path and skips what is not a row', () => {
    const nested = [
      { children: ['x', 3, null, { id: 'real' }], id: 'p', meta: { items: [{ id: 'm.1' }] } },
    ]
    expect(build(nested).byId.has('real')).toBeTruthy()
    const viaPath = buildTableTree({
      childrenPath: 'meta.items',
      getRowId: (row) => ('id' in row ? String(row.id) : ''),
      rows: nested,
    })
    expect([...viaPath.byId.keys()]).toStrictEqual(['p', 'm.1'])
  })

  it('leaves out a repeated id and reports it, so cycles cannot loop', () => {
    const loop: Row = { id: 'loop' }
    loop.children = [loop, { id: 'leaf' }]
    const { byId, duplicateIds } = build([loop])
    expect([...byId.keys()]).toStrictEqual(['loop', 'leaf'])
    expect(duplicateIds).toStrictEqual(['loop'])
  })

  it('handles a chain far deeper than the call stack allows', () => {
    const head: Row = { id: '0' }
    let tail = head
    for (let depth = 1; depth <= 50_000; depth += 1) {
      const next: Row = { id: String(depth) }
      tail.children = [next]
      tail = next
    }
    expect(build([head]).maxDepth).toBe(50_000)
  })
})

describe('flattenVisibleTree', () => {
  const index = build()
  const open = (...ids: string[]) => {
    const set = new Set(ids)
    return flattenVisibleTree(index.roots, (node) => set.has(node.id)).map((node) => node.id)
  }

  it('shows only the top level while everything is closed', () => {
    expect(open()).toStrictEqual(['a', 'b', 'c'])
  })

  it('places children right after their parent, in order', () => {
    expect(open('a')).toStrictEqual(['a', 'a.1', 'a.2', 'a.3', 'b', 'c'])
    expect(open('a', 'a.1', 'c')).toStrictEqual([
      'a',
      'a.1',
      'a.1.1',
      'a.1.2',
      'a.2',
      'a.3',
      'b',
      'c',
      'c.1',
    ])
  })

  it('does not descend into a closed branch whose parent is open', () => {
    expect(open('a.1')).toStrictEqual(['a', 'b', 'c'])
  })

  it('finds the rows showing under a branch', () => {
    const visible = flattenVisibleTree(index.roots, () => true)
    const branch = index.byId.get('a')
    expect(branch && getVisibleDescendants(visible, branch).map((node) => node.id)).toStrictEqual([
      'a.1',
      'a.1.1',
      'a.1.2',
      'a.2',
      'a.3',
      'a.3.1',
    ])
    expect(
      branch && getVisibleDescendants(visible, branch, 2).map((node) => node.id),
    ).toStrictEqual(['a.1', 'a.1.1'])
  })
})

describe('tree helpers', () => {
  it('opens a branch by default according to depth', () => {
    expect([
      isOpenByDefault(false, 0),
      isOpenByDefault(true, 5),
      isOpenByDefault(1, 0),
      isOpenByDefault(1, 1),
      isOpenByDefault(2, 1),
    ]).toStrictEqual([false, true, true, false, true])
  })

  it('lists every row of a tree, open or not', () => {
    expect(
      flattenTreeRows(rows, 'children').map((row) => ('id' in row ? row.id : '')),
    ).toStrictEqual(['a', 'a.1', 'a.1.1', 'a.1.2', 'a.2', 'a.3', 'a.3.1', 'b', 'c', 'c.1'])
  })

  it('sizes the control column for the deepest row, with the checkbox always counted', () => {
    const base = getTreeColumnWidth({ check: TREE_CHECK_WIDTH.md, lead: TREE_LEAD, maxDepth: 0 })
    expect(getTreeColumnWidth({ check: TREE_CHECK_WIDTH.md, lead: TREE_LEAD, maxDepth: 3 })).toBe(
      base + 3 * TREE_GUTTER_WIDTH,
    )
    expect(getTreeColumnWidth({ check: TREE_CHECK_WIDTH.xl, lead: TREE_LEAD, maxDepth: 0 })).toBe(
      base + TREE_CHECK_WIDTH.xl - TREE_CHECK_WIDTH.md,
    )
  })
})
