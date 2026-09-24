import { afterEach, describe, expect, it } from 'vitest'
import { h, ref } from 'vue'

import { isArray, isObject, isString } from '#ui-tools/shared/utils/predicate'
import DataListFilterTags from '#ui-tools/table/components/data-list/data-list-filter-tags.vue'
import type { TableFilterFacetConfig, TableFilterRemoteOptions } from '#ui-tools/table/types'

import { must } from '../../helpers/must'
import { createAccountsSchema } from '../fixtures/accounts'
import { mountLoaded, texts } from '../harness'
import type { Harness } from '../harness'

const COUNTRIES = Array.from({ length: 60 }, (_, index) => ({
  label: `Pays ${index + 1}`,
  value: `C${index + 1}`,
}))

let harness: Harness | undefined
afterEach(() => harness?.unmount())

/** A server of 60 countries, paged by 20, recording every request it answers. */
function createCountryServer() {
  const pages: { search: string; index: number }[] = []
  const resolved: (readonly (string | number | boolean)[])[] = []
  const remote: TableFilterRemoteOptions = {
    load: ({ page, search }) => ({
      queryFn: async () => {
        pages.push({ index: page.index, search })
        const matches = COUNTRIES.filter((country) =>
          country.label.toLowerCase().includes(search.toLowerCase()),
        )
        const start = (page.index - 1) * page.size
        return {
          hasMore: start + page.size < matches.length,
          options: matches.slice(start, start + page.size),
        }
      },
      queryKey: ['countries', search, page.index, page.size],
    }),
    pagination: { size: 20, type: 'page' },
    resolveSelected: ({ values }) => ({
      queryFn: async () => {
        resolved.push(values)
        return COUNTRIES.filter((country) => values.includes(country.value))
      },
      queryKey: ['countries', 'selected', values],
    }),
    search: { debounce: 0 },
  }
  return { pages, remote, resolved }
}

async function mountRemoteTags(server: ReturnType<typeof createCountryServer>, breakpoint = 'xl') {
  return mountLoaded({
    breakpoint: breakpoint === 'sm' ? 'sm' : 'xl',
    render: () => h(DataListFilterTags, { showAdd: true, showClear: true }),
    schema: createAccountsSchema({ remoteCountry: server.remote }),
  })
}

async function openCountryEditor(current: Harness) {
  const value = current.wrapper.find('.nut-dl-tag--active .nut-dl-tag__text')
  const button = must(value.element.closest('button'))
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await current.until(() => current.wrapper.find('[data-filter-option-scroll]').exists())
}

/**
 * Gives the list viewport a layout (happy-dom computes none): 100px tall, 36px per option row, so
 * the default prefetch distance (three viewport heights) is 300px. Then scrolls it.
 */
async function scrollList(current: Harness, scrollTop: number) {
  const viewport = current.wrapper.find('[data-filter-option-scroll]').element
  Object.defineProperty(viewport, 'clientHeight', { configurable: true, value: 100 })
  Object.defineProperty(viewport, 'scrollHeight', {
    configurable: true,
    get: () => viewport.querySelectorAll('.nut-dl-option').length * 36,
  })
  Object.defineProperty(viewport, 'scrollTop', { configurable: true, value: scrollTop })
  viewport.dispatchEvent(new Event('scroll'))
  await current.flush()
}

describe('remote option filters', () => {
  it('updates selected labels when the selected endpoint scope changes', async () => {
    const language = ref('en')
    const server = createCountryServer()
    server.remote.selectedQueryKeyFor = ({ values }) => [
      'countries',
      'selected',
      language.value,
      values,
    ]
    server.remote.resolveSelected = ({ values }) => {
      const locale = language.value
      return {
        queryFn: () =>
          Promise.resolve(
            COUNTRIES.filter((country) => values.includes(country.value)).map((country) => ({
              label: `${locale}-${country.label}`,
              value: country.value,
            })),
          ),
        queryKey: ['countries', 'selected', locale, values],
      }
    }
    harness = await mountRemoteTags(server)
    harness.internals.filters.setOptionFilterValues({ key: 'country', values: ['C42'] })
    await harness.until(() =>
      texts(must(harness).wrapper, '.nut-dl-tag__text').includes('en-Pays 42'),
    )

    language.value = 'fr'
    await harness.until(() =>
      texts(must(harness).wrapper, '.nut-dl-tag__text').includes('fr-Pays 42'),
    )
  })

  it('labels committed values through resolveSelected without loading any page', async () => {
    const server = createCountryServer()
    harness = await mountRemoteTags(server)
    harness.internals.filters.setOptionFilterValues({ key: 'country', values: ['C42'] })
    await harness.until(() => texts(must(harness).wrapper, '.nut-dl-tag__text').includes('Pays 42'))

    expect(server.resolved).toStrictEqual([['C42']])
    expect(server.pages).toStrictEqual([])
  })

  it('loads the first page on open and the next one ahead of the scroll, without a button', async () => {
    const server = createCountryServer()
    harness = await mountRemoteTags(server)
    harness.internals.filters.setOptionFilterValues({ key: 'country', values: ['C42'] })
    await harness.flush()
    await openCountryEditor(harness)
    await harness.until(() => texts(must(harness).wrapper, '.nut-dl-option').length === 21)

    // The picked value leads the list; the first page follows.
    const options = texts(harness.wrapper, '.nut-dl-option')
    expect([options[0], options[1], options.at(-1)]).toStrictEqual(['Pays 42', 'Pays 1', 'Pays 20'])
    expect(server.pages).toStrictEqual([{ index: 1, search: '' }])
    expect(harness.wrapper.find('[data-filter-option-list-end] button').exists()).toBeFalsy()

    // 21 rows (756px): at the top, the end is 656px away, beyond the 300px prefetch distance.
    await scrollList(harness, 0)
    expect(server.pages).toHaveLength(1)

    // 256px from the end: the next page loads, and 41 rows (1476px) put the end out of reach again.
    await scrollList(harness, 400)
    await harness.until(() => texts(must(harness).wrapper, '.nut-dl-option').length === 41)
    await harness.flush()
    expect(server.pages).toStrictEqual([
      { index: 1, search: '' },
      { index: 2, search: '' },
    ])
  })

  it('searches on the server and keeps the picked value listed', async () => {
    const server = createCountryServer()
    harness = await mountRemoteTags(server)
    harness.internals.filters.setOptionFilterValues({ key: 'country', values: ['C42'] })
    await harness.flush()
    await openCountryEditor(harness)
    await harness.until(() => texts(must(harness).wrapper, '.nut-dl-option').length === 21)

    await harness.wrapper.find('[data-filter-stage-content] input').setValue(' pays 5 ')
    await harness.until(() => texts(must(harness).wrapper, '.nut-dl-option').length === 12)

    expect(server.pages.at(-1)).toStrictEqual({ index: 1, search: 'pays 5' })
    expect(texts(harness.wrapper, '.nut-dl-option').slice(0, 3)).toStrictEqual([
      'Pays 42',
      'Pays 5',
      'Pays 50',
    ])
  })

  it('counts each loaded page through the filter facet query, never the main request', async () => {
    const server = createCountryServer()
    const counted: (readonly (string | number | boolean)[])[] = []
    const facet: TableFilterFacetConfig = {
      mode: 'exclude-self',
      query: ({ facets }) => ({
        queryFn: async () => {
          const values = must(facets[0]).values ?? []
          counted.push(values)
          // Each country counts ten accounts per index; country 3 has none and is left out.
          return {
            facets: [
              {
                key: 'country',
                options: values
                  .filter((value) => value !== 'C3')
                  .map((value) => ({ count: Number(String(value).slice(1)) * 10, value })),
              },
            ],
          }
        },
        queryKey: ['countries', 'facets', facets],
      }),
    }
    const mainFacets: string[][] = []
    harness = await mountLoaded({
      render: () => h(DataListFilterTags, { showAdd: true, showClear: true }),
      schema: createAccountsSchema({
        embeddedFacets: true,
        onQuery: (context) => {
          const facets =
            isObject(context) && isArray<unknown, unknown>(context.facets) ? context.facets : []
          mainFacets.push(
            facets.flatMap((entry) => (isObject(entry) && isString(entry.key) ? [entry.key] : [])),
          )
        },
        remoteCountry: server.remote,
        remoteCountryFacet: facet,
      }),
    })
    harness.internals.filters.setOptionFilterValues({ key: 'country', values: ['C42'] })
    await harness.flush()
    await openCountryEditor(harness)
    await harness.until(() => counted.length === 2)
    await harness.flush()

    // The picked value outside the pages, then the first page: never all values at once.
    expect(counted).toStrictEqual([['C42'], COUNTRIES.slice(0, 20).map((country) => country.value)])
    const count = (label: string) =>
      must(
        harness?.wrapper.findAll('.nut-dl-option').find((row) => row.text().startsWith(`${label}`)),
      )
        .findAll('span')
        .at(-1)
        ?.text()
    expect([count('Pays 42'), count('Pays 2'), count('Pays 3')]).toStrictEqual(['420', '20', '0'])

    await scrollList(harness, 400)
    await harness.until(() => counted.length === 3)
    expect(counted.at(-1)).toStrictEqual(COUNTRIES.slice(20, 40).map((country) => country.value))
    expect(mainFacets.flat()).not.toContain('country')
  })

  it('labels remote values in the mobile filter sheet', async () => {
    const server = createCountryServer()
    harness = await mountRemoteTags(server, 'sm')
    harness.internals.filters.setOptionFilterValues({ key: 'country', values: ['C7', 'C8'] })
    await harness.flush()
    await harness.wrapper.find('.nut-dl-sheet-trigger').trigger('click')
    await harness.until(() =>
      must(harness)
        .wrapper.findAll('.nut-dl-sheet__value')
        .some((value) => value.text().includes('Pays 8')),
    )

    const country = must(
      harness.wrapper
        .findAll('.nut-dl-sheet__row')
        .find((row) => row.find('.flex-1').text() === 'Pays'),
    )
    expect(country.find('.nut-dl-sheet__value').text()).toContain('Pays 7')
    expect(server.pages).toStrictEqual([])
  })
})
