import { describe, expect, it } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'
import type { FormOptionValue } from '#ui-tools/form'

import { deferred, mountForm, scrollToEnd } from './harness'
import type { FormHarness } from './harness'

interface TreeOption {
  key: string
  label: string
  isLeaf?: boolean
}

interface Page {
  options: readonly TreeOption[]
  hasMore: boolean
}

function requestMap() {
  const requests = new Map<string, ReturnType<typeof deferred<Page>>>()
  function get(key: string) {
    const existing = requests.get(key)
    if (existing) {
      return existing
    }
    const created = deferred<Page>()
    requests.set(key, created)
    return created
  }
  return { get, has: (key: string) => requests.has(key), requests }
}

interface TreeRequest {
  search: string
  page: { index: number }
  parent?: { key?: FormOptionValue; value?: FormOptionValue }
}

function requestKey(request: TreeRequest) {
  return request.parent
    ? `children:${String(request.parent.key ?? request.parent.value)}`
    : `roots:${request.search}:${request.page.index}`
}

function treeItems(harness: FormHarness, path: string) {
  return harness
    .field(path)
    .findAll('[data-ui-tree-item]')
    .map((item) => item.attributes('data-ui-tree-item'))
}

async function openTree(harness: FormHarness, path: string) {
  await harness.field(path).find('[data-ui-trigger]').trigger('click')
  await harness.flush()
}

async function toggleNode(harness: FormHarness, path: string, key: string) {
  await harness
    .field(path)
    .find(`[data-ui-tree-row="${key}"] [data-form-tree-toggle]`)
    .trigger('click')
  await harness.flush()
}

function createSchema(requests: ReturnType<typeof requestMap>) {
  return defineFormSchema({
    actions: [],
    fields: [
      {
        key: 'category',
        options: {
          mode: 'remote',
          pagination: { size: 2, type: 'page' },
          search: { debounce: 0 },
          source: (request) => requests.get(requestKey(request)).promise,
        },
        type: 'tree-select',
      },
    ],
  })
}

describe('remote tree options', () => {
  it('loads root pages on open, appends the next page, and loads children on expansion', async () => {
    const requests = requestMap()
    const harness = await mountForm({ schema: createSchema(requests) })
    expect(requests.requests.size).toBe(0)

    await openTree(harness, 'category')
    await harness.until(() => requests.has('roots::1'))
    requests.get('roots::1').resolve({
      hasMore: true,
      options: [
        { isLeaf: false, key: 'group', label: 'Group' },
        { isLeaf: true, key: 'root-leaf', label: 'Root leaf' },
      ],
    })
    await harness.until(() => treeItems(harness, 'category').length === 2)
    expect(
      harness
        .field('category')
        .find('[data-ui-tree-row="string:group"] [data-form-tree-toggle]')
        .exists(),
    ).toBeTruthy()
    expect(
      harness
        .field('category')
        .find('[data-ui-tree-row="string:root-leaf"] [data-form-tree-toggle]')
        .exists(),
    ).toBeFalsy()

    await scrollToEnd(harness, 'category', '[role="tree"]')
    await harness.until(() => requests.has('roots::2'))
    requests.get('roots::2').resolve({
      hasMore: false,
      options: [{ isLeaf: true, key: 'second-root', label: 'Second root' }],
    })
    await harness.until(() => treeItems(harness, 'category').length === 3)

    await toggleNode(harness, 'category', 'string:group')
    await harness.until(() => requests.has('children:group'))
    requests.get('children:group').resolve({
      hasMore: false,
      options: [{ isLeaf: false, key: 'division', label: 'Division' }],
    })
    await harness.until(() => treeItems(harness, 'category').includes('string:division'))
    expect(treeItems(harness, 'category')).toStrictEqual([
      'string:group',
      'string:division',
      'string:root-leaf',
      'string:second-root',
    ])
    harness.unmount()
  })

  it('keeps the branch intact and retries a failed child request on the next expansion', async () => {
    const requests = requestMap()
    const harness = await mountForm({ schema: createSchema(requests) })
    await openTree(harness, 'category')
    await harness.until(() => requests.has('roots::1'))
    requests.get('roots::1').resolve({
      hasMore: false,
      options: [{ isLeaf: false, key: 'group', label: 'Group' }],
    })
    await harness.until(() => treeItems(harness, 'category').length === 1)

    await toggleNode(harness, 'category', 'string:group')
    await harness.until(() => requests.has('children:group'))
    requests.get('children:group').reject(new Error('children failed'))
    await harness.flush(4)
    expect(treeItems(harness, 'category')).toStrictEqual(['string:group'])

    requests.requests.delete('children:group')
    await toggleNode(harness, 'category', 'string:group')
    await toggleNode(harness, 'category', 'string:group')
    await harness.until(() => requests.has('children:group'))
    requests.get('children:group').resolve({
      hasMore: false,
      options: [{ isLeaf: true, key: 'leaf', label: 'Leaf' }],
    })
    await harness.until(() => treeItems(harness, 'category').includes('string:leaf'))
    harness.unmount()
  })

  it('checks an unloaded remote parent without expanding it', async () => {
    const requests = requestMap()
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'categories',
          multiple: true,
          options: {
            mode: 'remote',
            pagination: { size: 10, type: 'page' },
            source: (request) => requests.get(requestKey(request)).promise,
          },
          type: 'tree-select',
        },
      ],
    })
    const harness = await mountForm({ schema })
    await openTree(harness, 'categories')
    await harness.until(() => requests.has('roots::1'))
    requests.get('roots::1').resolve({
      hasMore: false,
      options: [{ isLeaf: false, key: 'group', label: 'Group' }],
    })
    await harness.until(() => treeItems(harness, 'categories').length === 1)

    await harness
      .field('categories')
      .find('[data-ui-tree-row="string:group"] input')
      .trigger('click')
    await harness.flush()
    expect(harness.form.state.get('categories')).toStrictEqual(['group'])
    expect(requests.has('children:group')).toBeFalsy()
    harness.unmount()
  })
})
