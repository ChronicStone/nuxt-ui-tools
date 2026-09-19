import { queryOptions } from '@tanstack/vue-query'
import { describe, expect, it } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'
import type { FormObject, FormOptionValue } from '#ui-tools/form'

import { deferred, mountForm, scrollToEnd } from './harness'
import type { FormHarness } from './harness'

interface Option {
  label: string
  value: string
}
interface Page {
  options: readonly Option[]
  hasMore: boolean
}
interface CursorPage {
  options: readonly Option[]
  nextCursor: string | null
}

function requestMap<T>() {
  const requests = new Map<string, ReturnType<typeof deferred<T>>>()
  function get(key: string) {
    const existing = requests.get(key)
    if (existing) {
      return existing
    }
    const created = deferred<T>()
    requests.set(key, created)
    return created
  }
  return { get, has: (key: string) => requests.has(key), requests }
}

interface PageRequest {
  search: string
  page: { index: number; cursor: string | null }
}

interface SelectedRequest {
  deps: FormObject
  values: readonly FormOptionValue[]
}

function depsCategory(deps: FormObject) {
  return String(deps.category ?? '')
}

function pagedSource(requests: ReturnType<typeof requestMap<Page>>, keyPrefix: string) {
  return function source({ search, page }: PageRequest) {
    return queryOptions({
      queryFn: () => requests.get(`${search}:${page.index}`).promise,
      queryKey: [keyPrefix, search, page.index],
    })
  }
}

function itemValues(harness: FormHarness, path: string) {
  return harness
    .field(path)
    .findAll('[data-ui-item]')
    .map((item) => item.attributes('data-ui-item'))
    .filter((value) => value !== '__nut:load-more__')
}

function triggerText(harness: FormHarness, path: string) {
  return harness.field(path).find('[data-ui-trigger]').text().trim()
}

async function openMenu(harness: FormHarness, path: string) {
  await harness.field(path).find('[data-ui-trigger]').trigger('click')
  await harness.flush()
}

async function typeSearch(harness: FormHarness, path: string, term: string) {
  await harness.field(path).find('[data-ui-search]').setValue(term)
  await harness.flush()
}

async function loadMore(harness: FormHarness, path: string) {
  await scrollToEnd(harness, path, '[data-ui-items]')
}

describe('remote field options', () => {
  it('waits for the menu to open, loads the first page, and appends a deduplicated next page', async () => {
    const requests = requestMap<Page>()
    const source = pagedSource(requests, 'remote-page')
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'organisation',
          options: {
            mode: 'remote',
            pagination: { size: 2, type: 'page' },
            search: { debounce: 0, minLength: 1 },
            source,
          },
          type: 'select',
        },
      ],
    })
    const harness = await mountForm({ schema })
    expect(requests.requests.size).toBe(0)

    await openMenu(harness, 'organisation')
    await harness.until(() => requests.has(':1'))
    requests.get(':1').resolve({
      hasMore: true,
      options: [
        { label: 'Acme', value: 'acme' },
        { label: 'Beta', value: 'beta' },
      ],
    })
    await harness.until(() => itemValues(harness, 'organisation').length === 2)

    await loadMore(harness, 'organisation')
    await harness.until(() => requests.has(':2'))
    requests.get(':2').resolve({
      hasMore: false,
      options: [
        { label: 'Beta', value: 'beta' },
        { label: 'Delta', value: 'delta' },
      ],
    })
    await harness.until(() => itemValues(harness, 'organisation').length === 3)
    expect(itemValues(harness, 'organisation')).toStrictEqual(['acme', 'beta', 'delta'])
    expect(harness.wrapper.find('[data-form-option-error]').exists()).toBeFalsy()
    harness.unmount()
  })

  it('debounces search, honours the minimum length, and rejects stale results', async () => {
    const requests = requestMap<Page>()
    const source = pagedSource(requests, 'remote-search')
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'organisation',
          options: {
            mode: 'remote',
            pagination: { size: 25, type: 'page' },
            search: { debounce: 20, minLength: 2 },
            source,
          },
          type: 'select',
        },
      ],
    })
    const harness = await mountForm({ schema })
    await openMenu(harness, 'organisation')
    await harness.until(() => requests.has(':1'))
    requests
      .get(':1')
      .resolve({ hasMore: false, options: [{ label: 'Initial', value: 'initial' }] })
    await harness.until(() => itemValues(harness, 'organisation').length === 1)

    await typeSearch(harness, 'organisation', 'a')
    await typeSearch(harness, 'organisation', 'ol')
    await harness.until(() => requests.has('ol:1'))
    expect(requests.has('a:1')).toBeFalsy()

    await typeSearch(harness, 'organisation', 'ne')
    await harness.until(() => requests.has('ne:1'))
    requests.get('ne:1').resolve({ hasMore: false, options: [{ label: 'New', value: 'new' }] })
    await harness.until(() => itemValues(harness, 'organisation')[0] === 'new')
    requests.get('ol:1').resolve({ hasMore: false, options: [{ label: 'Old', value: 'old' }] })
    await harness.flush(4)
    expect(itemValues(harness, 'organisation')).toStrictEqual(['new'])
    harness.unmount()
  })

  it('keeps loaded options after a next-page failure and offers a retry', async () => {
    const requests = requestMap<Page>()
    const source = pagedSource(requests, 'remote-failure')
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'organisation',
          options: {
            mode: 'remote',
            pagination: { size: 1, type: 'page' },
            source,
          },
          type: 'select',
        },
      ],
    })
    const harness = await mountForm({ schema })
    await openMenu(harness, 'organisation')
    await harness.until(() => requests.has(':1'))
    requests.get(':1').resolve({ hasMore: true, options: [{ label: 'First', value: 'first' }] })
    await harness.until(() => itemValues(harness, 'organisation').length === 1)

    await loadMore(harness, 'organisation')
    await harness.until(() => requests.has(':2'))
    requests.get(':2').reject(new Error('next page failed'))
    await harness.until(() =>
      harness.field('organisation').find('[data-form-option-retry]').exists(),
    )
    expect(itemValues(harness, 'organisation')).toStrictEqual(['first'])

    requests.requests.delete(':2')
    await harness.field('organisation').find('[data-form-option-retry]').trigger('click')
    await harness.until(() => requests.has(':2'))
    requests.get(':2').resolve({ hasMore: false, options: [{ label: 'Second', value: 'second' }] })
    await harness.until(() => itemValues(harness, 'organisation').length === 2)
    harness.unmount()
  })

  it('loads cursor pages and deduplicates options at the cursor boundary', async () => {
    const requests = requestMap<CursorPage>()
    function source({ page }: PageRequest) {
      return queryOptions({
        queryFn: () => requests.get(page.cursor ?? 'initial').promise,
        queryKey: ['remote-cursor', page.cursor],
      })
    }
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'category',
          options: { mode: 'remote', pagination: { size: 2, type: 'cursor' }, source },
          type: 'select',
        },
      ],
    })
    const harness = await mountForm({ schema })
    await openMenu(harness, 'category')
    await harness.until(() => requests.has('initial'))
    requests.get('initial').resolve({
      nextCursor: 'next',
      options: [
        { label: 'Root', value: 'root' },
        { label: 'Child', value: 'child' },
      ],
    })
    await harness.until(() => itemValues(harness, 'category').length === 2)

    await loadMore(harness, 'category')
    await harness.until(() => requests.has('next'))
    requests.get('next').resolve({
      nextCursor: null,
      options: [
        { label: 'Child', value: 'child' },
        { label: 'Leaf', value: 'leaf' },
      ],
    })
    await harness.until(() => itemValues(harness, 'category').length === 3)
    expect(itemValues(harness, 'category')).toStrictEqual(['root', 'child', 'leaf'])
    harness.unmount()
  })

  it('hydrates a selected value outside the loaded pages and keeps it through a search', async () => {
    const pageRequest = deferred<Page>()
    const searchRequest = deferred<Page>()
    const selectedRequest = deferred<readonly Option[]>()
    const sourceCalls: string[] = []
    const selectedCalls: (readonly FormOptionValue[])[] = []
    function source({ search }: PageRequest) {
      sourceCalls.push(search)
      return queryOptions({
        queryFn: () => (search ? searchRequest.promise : pageRequest.promise),
        queryKey: ['remote-hydration', search],
      })
    }
    function resolveSelected({ values }: SelectedRequest) {
      selectedCalls.push(values)
      return queryOptions({
        queryFn: () => selectedRequest.promise,
        queryKey: ['remote-selected', ...values],
      })
    }
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'organisation',
          options: {
            mode: 'remote',
            pagination: { size: 25, type: 'page' },
            resolveSelected,
            search: { debounce: 0, minLength: 1 },
            source,
          },
          type: 'select',
        },
      ],
    })
    const harness = await mountForm({ input: { organisation: 'selected' }, schema })
    await harness.until(() => selectedCalls.length === 1)
    expect(selectedCalls[0]).toStrictEqual(['selected'])
    expect(sourceCalls).toHaveLength(0)

    selectedRequest.resolve([{ label: 'Selected organisation', value: 'selected' }])
    await harness.until(() => triggerText(harness, 'organisation') === 'Selected organisation')

    await openMenu(harness, 'organisation')
    pageRequest.resolve({ hasMore: true, options: [{ label: 'First page', value: 'first' }] })
    await harness.until(() => itemValues(harness, 'organisation').length === 2)
    expect(itemValues(harness, 'organisation')).toStrictEqual(['selected', 'first'])

    await typeSearch(harness, 'organisation', 'partial')
    searchRequest.resolve({ hasMore: false, options: [{ label: 'Alpha result', value: 'alpha' }] })
    await harness.until(() => itemValues(harness, 'organisation').includes('alpha'))
    expect(triggerText(harness, 'organisation')).toBe('Selected organisation')
    expect(harness.form.state.get('organisation')).toBe('selected')
    harness.unmount()
  })

  it('reconciles a dependent value only after the latest selected result succeeds', async () => {
    const selectedRequests = requestMap<readonly Option[]>()
    function resolveSelected({ deps }: SelectedRequest) {
      return queryOptions({
        queryFn: () => selectedRequests.get(depsCategory(deps)).promise,
        queryKey: ['dependent-selected', depsCategory(deps)],
      })
    }
    const schema = defineFormSchema({
      actions: [],
      fields: [
        { key: 'category', options: ['a', 'b'], type: 'select' },
        {
          dependencies: ['category'],
          key: 'organisation',
          options: {
            clearOnInvalid: true,
            mode: 'remote',
            pagination: { size: 25, type: 'page' },
            refreshOn: ['category'],
            resolveSelected,
            source: () => Promise.resolve({ hasMore: false, options: [] }),
          },
          type: 'select',
        },
      ],
    })
    const harness = await mountForm({ input: { category: 'a', organisation: 'org-a' }, schema })
    await harness.until(() => selectedRequests.has('a'))
    selectedRequests.get('a').resolve([{ label: 'Organisation A', value: 'org-a' }])
    await harness.until(() => triggerText(harness, 'organisation') === 'Organisation A')

    harness.form.state.set('category', 'b')
    await harness.until(() => selectedRequests.has('b'))
    expect(harness.form.state.get('organisation')).toBe('org-a')

    selectedRequests.get('b').resolve([])
    await harness.until(() => harness.form.state.get('organisation') === null)
    harness.unmount()
  })

  it('preserves the selected value when the latest dependent resolver fails', async () => {
    const selectedRequests = requestMap<readonly Option[]>()
    function resolveSelected({ deps }: SelectedRequest) {
      return queryOptions({
        queryFn: () => selectedRequests.get(depsCategory(deps)).promise,
        queryKey: ['dependent-error-selected', depsCategory(deps)],
      })
    }
    const schema = defineFormSchema({
      actions: [],
      fields: [
        { key: 'category', options: ['a', 'b'], type: 'select' },
        {
          dependencies: ['category'],
          key: 'organisation',
          options: {
            clearOnInvalid: true,
            mode: 'remote',
            pagination: { size: 25, type: 'page' },
            refreshOn: ['category'],
            resolveSelected,
            source: () => Promise.resolve({ hasMore: false, options: [] }),
          },
          type: 'select',
        },
      ],
    })
    const harness = await mountForm({ input: { category: 'a', organisation: 'org-a' }, schema })
    await harness.until(() => selectedRequests.has('a'))
    selectedRequests.get('a').resolve([{ label: 'Organisation A', value: 'org-a' }])
    await harness.until(() => triggerText(harness, 'organisation') === 'Organisation A')

    harness.form.state.set('category', 'b')
    await harness.until(() => selectedRequests.has('b'))
    selectedRequests.get('b').reject(new Error('resolver unavailable'))
    await harness.flush(6)

    expect(harness.form.state.get('organisation')).toBe('org-a')
    expect(triggerText(harness, 'organisation')).toBe('Organisation A')
    harness.unmount()
  })

  it('keeps hydrated labels for values retained by a multi-select edit', async () => {
    const selectedRequests = requestMap<readonly Option[]>()
    function resolveSelected({ values }: SelectedRequest) {
      return queryOptions({
        queryFn: () => selectedRequests.get(values.join(',')).promise,
        queryKey: ['remote-multi-selected', ...values],
      })
    }
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'organisations',
          multiple: true,
          options: {
            mode: 'remote',
            pagination: { size: 25, type: 'page' },
            resolveSelected,
            source: () => Promise.resolve({ hasMore: false, options: [] }),
          },
          type: 'select',
        },
      ],
    })
    const harness = await mountForm({ input: { organisations: ['one', 'two'] }, schema })
    await harness.until(() => selectedRequests.has('one,two'))
    selectedRequests.get('one,two').resolve([
      { label: 'One', value: 'one' },
      { label: 'Two', value: 'two' },
    ])
    await harness.until(() => triggerText(harness, 'organisations') === 'One, Two')

    harness.form.state.set('organisations', ['two', 'three'])
    await harness.until(() => selectedRequests.has('three'))
    expect(triggerText(harness, 'organisations')).toBe('Two, three')
    harness.unmount()
  })
})
