import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'

import DisplayAccordion from '#ui-tools/display/components/blocks/display-accordion.vue'
import DisplayAlert from '#ui-tools/display/components/blocks/display-alert.vue'
import DisplayBreakdown from '#ui-tools/display/components/blocks/display-breakdown.vue'
import DisplayChart from '#ui-tools/display/components/blocks/display-chart.vue'
import DisplayCode from '#ui-tools/display/components/blocks/display-code.vue'
import DisplayDate from '#ui-tools/display/components/blocks/display-date.vue'
import DisplayDiff from '#ui-tools/display/components/blocks/display-diff.vue'
import DisplayEmpty from '#ui-tools/display/components/blocks/display-empty.vue'
import DisplayFacts from '#ui-tools/display/components/blocks/display-facts.vue'
import DisplayHeading from '#ui-tools/display/components/blocks/display-heading.vue'
import DisplayList from '#ui-tools/display/components/blocks/display-list.vue'
import DisplayMedia from '#ui-tools/display/components/blocks/display-media.vue'
import DisplayMeter from '#ui-tools/display/components/blocks/display-meter.vue'
import DisplayPerson from '#ui-tools/display/components/blocks/display-person.vue'
import DisplayRecord from '#ui-tools/display/components/blocks/display-record.vue'
import DisplayStat from '#ui-tools/display/components/blocks/display-stat.vue'
import DisplayTable from '#ui-tools/display/components/blocks/display-table.vue'
import DisplayText from '#ui-tools/display/components/blocks/display-text.vue'
import DisplayTimeline from '#ui-tools/display/components/blocks/display-timeline.vue'
import UiDisplay from '#ui-tools/display/components/display.vue'
import DisplayChip from '#ui-tools/display/components/parts/display-chip.vue'

import { setAppConfig } from '../nuxt-state'

declare module '#ui-tools/display' {
  interface DisplayToneRegistry {
    violet: true
  }
}

function ignore() {
  return undefined
}

afterEach(() => {
  setAppConfig({})
  vi.restoreAllMocks()
})

describe('display blocks', () => {
  it('heading: eyebrow rule, count pill, level and action', async () => {
    const onClick = vi.fn()
    const eyebrow = mount(DisplayHeading, { props: { title: 'Billing', variant: 'eyebrow' } })
    expect(eyebrow.find('h3').text()).toBe('Billing')
    const titled = mount(DisplayHeading, {
      props: { action: { label: 'See all', onClick }, count: 24, level: 2, title: 'Candidates' },
    })
    expect(titled.find('h2').text()).toContain('24')
    await titled.find('[data-ui="UButton"]').trigger('click')
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('text: paragraphs, quote attribution and legal title', () => {
    const quote = mount(DisplayText, {
      props: {
        appearance: 'quote',
        author: 'Ada',
        meta: 'Oct 14',
        paragraphs: ['Two'],
        text: 'One',
      },
    })
    expect(quote.attributes('data-appearance')).toBe('quote')
    expect(quote.text()).toContain('One')
    expect(quote.text()).toContain('Two')
    expect(quote.text()).toContain('Ada · Oct 14')
    const legal = mount(DisplayText, {
      props: { appearance: 'legal', text: 'Kept 5 years', title: 'Data' },
    })
    expect(legal.text()).toContain('Data')
  })

  it('alert: tone icon, items, list, folded details and actions', async () => {
    const wrapper = mount(DisplayAlert, {
      props: {
        actions: [{ label: 'Fix' }],
        details: 'Row 12: missing date',
        items: [{ icon: 'i-lucide-id-card', text: 'Bring an ID' }],
        list: ['Row 4', 'Row 9'],
        title: 'Rejected',
        tone: 'error',
      },
    })
    expect(wrapper.attributes('data-tone')).toBe('error')
    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.findAll('li')).toHaveLength(2)
    expect(wrapper.text()).toContain('Bring an ID')
    expect(wrapper.text()).not.toContain('Row 12')
    await wrapper.find('button[aria-expanded="false"]').trigger('click')
    expect(wrapper.text()).toContain('Row 12')
    expect(wrapper.find('[data-ui="UButton"]').text()).toBe('Fix')
    const hidden = mount(DisplayAlert, {
      props: { icon: false, message: 'Quiet', appearance: 'inline' },
    })
    expect(hidden.find('[data-ui="UIcon"]').exists()).toBe(false)
  })

  it('facts: dash for empty values, copy, chip, per-item loading and block actions', async () => {
    const onClick = vi.fn()
    const wrapper = mount(DisplayFacts, {
      props: {
        actions: [{ label: 'Edit the address', onClick }],
        groups: [
          {
            aside: '2026',
            items: [
              { copy: true, label: 'Reference', value: 'CT-1' },
              { label: 'Language' },
              { chip: { label: 'Active', tone: 'success' }, label: 'Status' },
              { label: 'Invoices', loading: true, value: 3 },
            ],
            title: 'Contract',
          },
        ],
      },
    })
    const values = wrapper.findAll('[data-display-value]')
    expect(values[0]?.find('[data-display-copy]').exists()).toBe(true)
    expect(values[1]?.text()).toBe('—')
    expect(values[2]?.find('[data-ui="UBadge"]').attributes('data-color')).toBe('success')
    expect(values[3]?.find('[data-display-fact-loading]').exists()).toBe(true)
    expect(values[3]?.text()).not.toContain('3')
    await wrapper.find('[data-display-actions] [data-ui="UButton"]').trigger('click')
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('facts: every layout and the empty state', () => {
    for (const layout of ['grid', 'inline', 'columns', 'tiles'] as const) {
      const wrapper = mount(DisplayFacts, {
        props: { items: [{ label: 'Seats', value: 12 }], layout },
      })
      expect(wrapper.find(`[data-layout="${layout}"]`).exists()).toBe(true)
      expect(wrapper.text()).toContain('12')
    }
    const empty = mount(DisplayFacts, { props: { empty: 'Nothing yet', items: [] } })
    expect(empty.find('[data-display-empty]').text()).toContain('Nothing yet')
  })

  it('stat: delta tone from its direction, sparkline and row items', () => {
    const trend = mount(DisplayStat, {
      props: {
        delta: { direction: 'down', value: '-4 %' },
        trend: [3, 5, 2],
        value: 42,
        variant: 'trend',
      },
    })
    expect(trend.find('[data-display-delta]').classes()).toContain('nut-display-tone-error')
    expect(trend.find('svg path').exists()).toBe(true)
    const row = mount(DisplayStat, {
      props: {
        items: [
          { label: 'A', value: 1 },
          { label: 'B', tone: 'success', value: 2 },
        ],
        variant: 'row',
      },
    })
    expect(row.text()).toContain('A')
    expect(row.find('.nut-display-tone-success').exists()).toBe(true)
  })

  it('breakdown: open total, collapsible detail and compare columns', async () => {
    const open = mount(DisplayBreakdown, {
      props: {
        footnote: 'From 20',
        lines: [
          { detail: '24 × 96', label: 'Licences', value: '2304' },
          { label: 'Sub', subtotal: true, value: '2304' },
        ],
        total: { chip: { label: 'Quote' }, label: 'Total', value: '2764' },
      },
    })
    expect(open.text()).toContain('24 × 96')
    expect(open.text()).toContain('From 20')
    const totalDetail = {
      lines: [{ label: 'VAT', value: '460' }],
      total: { detail: '≈ 3 000 $', label: 'Total', value: '2764' },
    }
    const detailed = mount(DisplayBreakdown, { props: totalDetail })
    expect(detailed.text()).toContain('Total≈ 3 000 $')
    const folded = mount(DisplayBreakdown, { props: { ...totalDetail, mode: 'collapsible' } })
    expect(folded.text()).toContain('≈ 3 000 $')
    const collapsible = mount(DisplayBreakdown, {
      props: {
        lines: [{ label: 'VAT', value: '460' }],
        mode: 'collapsible',
        total: { label: 'Total', value: '2764' },
      },
    })
    expect(collapsible.text()).not.toContain('VAT')
    await collapsible.find('button[aria-expanded]').trigger('click')
    expect(collapsible.text()).toContain('VAT')
    const compare = mount(DisplayBreakdown, {
      props: {
        columns: ['Now', 'Next'],
        lines: [{ label: 'Price', values: ['96', '89'] }],
        mode: 'compare',
        total: { label: 'Total', values: ['1', '2'] },
      },
    })
    expect(compare.findAll('th').map((cell) => cell.text())).toEqual(['', 'Now', 'Next'])
  })

  it('meter: thresholds, segments legend, ring and scale states', () => {
    const bar = mount(DisplayMeter, {
      props: { label: 'Credits', max: 120, thresholds: { warning: 70 }, value: 90 },
    })
    expect(bar.classes()).toContain('nut-display-tone-warning')
    expect(bar.find('[role="meter"]').attributes('aria-valuenow')).toBe('90')
    const segments = mount(DisplayMeter, {
      props: {
        parts: [
          { label: 'Taken', value: 3 },
          { label: 'Left', value: 1 },
        ],
        variant: 'segments',
      },
    })
    expect(segments.findAll('i[style]').at(0)?.attributes('style')).toContain('width: 75%')
    const ring = mount(DisplayMeter, { props: { max: 990, value: 845, variant: 'ring' } })
    expect(ring.find('svg').text()).toContain('845')
    const scale = mount(DisplayMeter, {
      props: { current: 1, levels: ['A1', 'A2', 'B1'], target: 2, variant: 'scale' },
    })
    expect(scale.findAll('[data-state]').map((level) => level.attributes('data-state'))).toEqual([
      'reached',
      'current',
      'target',
    ])
  })

  it('chart: highlights the last bar, draws donut slices and funnel rates', () => {
    const data = [
      { label: 'May', value: 10 },
      { label: 'Jun', value: 20 },
    ]
    const bars = mount(DisplayChart, { props: { data } })
    expect(bars.findAll('[data-highlighted]')).toHaveLength(1)
    expect(bars.text()).toContain('20')
    const donut = mount(DisplayChart, { props: { data, variant: 'donut' } })
    expect(donut.findAll('circle')).toHaveLength(3)
    const funnel = mount(DisplayChart, {
      props: {
        data: [
          { label: 'In', value: 100 },
          { label: 'Out', value: 80 },
        ],
        variant: 'funnel',
      },
    })
    expect(funnel.text()).toContain('80 %')
    const empty = mount(DisplayChart, { props: { data: [], empty: 'No data' } })
    expect(empty.text()).toContain('No data')
  })

  it('table: numeric alignment, footer and reveal', async () => {
    const wrapper = mount(DisplayTable, {
      props: {
        columns: [
          { key: 'name', label: 'Name' },
          { key: 'score', label: 'Score', numeric: true },
        ],
        footer: { name: 'Average', score: 80 },
        max: 1,
        rows: [
          { name: 'Ada', score: 90 },
          { name: 'Bob', score: 70 },
        ],
      },
    })
    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.find('tbody td:last-child').classes()).toContain('text-end')
    expect(wrapper.find('tfoot').text()).toContain('Average')
    await wrapper.find('[data-display-more]').trigger('click')
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
  })

  it('diff: hides unchanged inline items unless showUnchanged, dims them in columns', () => {
    const items = [
      { after: 'Lyon', before: 'Paris', label: 'City' },
      { after: 'Acme', before: 'Acme', changed: false, label: 'Company' },
    ]
    expect(mount(DisplayDiff, { props: { items } }).text()).not.toContain('Company')
    const shown = mount(DisplayDiff, { props: { items, showUnchanged: true } })
    expect(shown.find('[data-unchanged]').text()).toBe('Acme')
    const columns = mount(DisplayDiff, { props: { items, variant: 'columns' } })
    expect(columns.find('tr[data-changed="false"]').classes()).toContain('text-dimmed')
  })

  it('record: row link, broken image placeholder and stack reveal', async () => {
    const row = mount(DisplayRecord, {
      props: { image: { src: 'broken.png' }, title: 'Session', to: '/sessions/1', trailing: '€96' },
    })
    expect(row.find('a').attributes('href')).toBe('/sessions/1')
    await row.find('img').trigger('error')
    expect(row.find('img').exists()).toBe(false)
    const stack = mount(DisplayRecord, {
      props: {
        heading: 'Sessions',
        items: [{ title: 'A' }, { title: 'B' }, { title: 'C' }],
        max: 2,
        variant: 'stack',
      },
    })
    expect(stack.text()).not.toContain('C')
    await stack.find('[data-display-more]').trigger('click')
    expect(stack.text()).toContain('C')
  })

  it('person: initials, overflow avatar and contact copy', () => {
    const user = mount(DisplayPerson, { props: { name: 'Camille Laurent' } })
    expect(user.find('[data-ui="UAvatar"]').attributes('data-text')).toBe('CL')
    const group = mount(DisplayPerson, {
      props: {
        max: 2,
        people: [{ name: 'A B' }, { name: 'C D' }, { name: 'E F' }],
        variant: 'group',
      },
    })
    expect(group.findAll('[data-ui="UAvatar"]').at(-1)?.attributes('data-text')).toBe('+1')
    const contact = mount(DisplayPerson, {
      props: { contacts: [{ value: 'ada@example.com' }], name: 'Ada', variant: 'contact' },
    })
    expect(contact.find('[data-display-copy]').exists()).toBe(true)
  })

  it('list: steps state, checks and chips in a registered tone', () => {
    const steps = mount(DisplayList, {
      props: {
        items: [{ done: true, text: 'A' }, { current: true, text: 'B' }, { text: 'C' }],
        variant: 'steps',
      },
    })
    expect(steps.findAll('li').map((item) => item.attributes('data-state'))).toEqual([
      'done',
      'current',
      'todo',
    ])
    const chips = mount(DisplayList, {
      props: { items: [{ text: 'Procertif', tone: 'violet' }], variant: 'chips' },
    })
    expect(chips.find('[data-ui="UBadge"]').text()).toContain('Procertif')
    expect(chips.find('[data-ui="UBadge"]').classes()).toContain('nut-display-tone-violet')
  })

  it('list files: resolves a lazy link on download, shows its progress and a retry on failure', async () => {
    const created: HTMLAnchorElement[] = []
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      created.push(this)
    })
    let release: (url: string) => void = ignore
    let calls = 0
    const href = () => {
      calls += 1
      return calls === 1
        ? new Promise<string>((resolve) => {
            release = resolve
          })
        : Promise.reject(new Error('expired'))
    }
    const wrapper = mount(DisplayList, {
      props: {
        items: [{ href, size: 2048, text: 'notice.pdf' }],
        preview: false,
        variant: 'files',
      },
    })
    expect(wrapper.text()).toContain('PDF')
    await wrapper.find('[data-display-download]').trigger('click')
    expect(wrapper.find('[data-display-download]').attributes('data-loading')).toBe('true')
    release('https://files.example/notice.pdf?sig=1')
    await flushPromises()
    expect(click).toHaveBeenCalledOnce()
    expect(created[0]?.href).toBe('https://files.example/notice.pdf?sig=1')
    expect(created[0]?.download).toBe('notice.pdf')
    await wrapper.find('[data-display-download]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-display-error]').exists()).toBe(true)
  })

  it('timeline: schedule marker before the first planned event, pipeline current stage, log times', () => {
    const schedule = mount(DisplayTimeline, {
      props: {
        items: [
          { date: '2026-10-10', title: 'Sent' },
          { date: '2026-10-30', title: 'Planned' },
        ],
        now: '2026-10-22T12:00:00',
        variant: 'schedule',
      },
    })
    const entries = schedule.findAll('li')
    expect(entries.map((entry) => entry.attributes('data-state') ?? 'now')).toEqual([
      'done',
      'now',
      'upcoming',
    ])
    const pipeline = mount(DisplayTimeline, {
      props: {
        current: 1,
        items: [{ title: 'A' }, { title: 'B' }, { title: 'C' }],
        variant: 'pipeline',
      },
    })
    expect(pipeline.find('[aria-current="step"]').text()).toContain('B')
    const log = mount(DisplayTimeline, {
      props: {
        items: [{ actor: { name: 'Ada' }, date: '2026-10-22T09:14:00', title: 'imported' }],
        variant: 'log',
      },
    })
    expect(log.find('time').text()).toBe('09:14')
  })

  it('date: calendar leaf, range duration and countdown urgency', () => {
    const tile = mount(DisplayDate, { props: { title: 'Session', value: '2026-10-24T09:00:00' } })
    expect(tile.text()).toContain('24')
    const range = mount(DisplayDate, {
      props: { end: '2026-10-31', value: '2026-10-01', variant: 'range' },
    })
    expect(range.text()).toMatch(/31\sjours/u)
    const soon = mount(DisplayDate, {
      props: { now: '2026-10-22', value: '2026-10-24', variant: 'countdown' },
    })
    expect(soon.classes()).toContain('nut-display-tone-warning')
    expect(soon.find('[data-display-countdown]').text()).toBe('Après-demain')
    const late = mount(DisplayDate, {
      props: { now: '2026-10-22', value: '2026-10-19', variant: 'countdown' },
    })
    expect(late.classes()).toContain('nut-display-tone-error')
    expect(late.find('[data-display-countdown]').text()).toMatch(/^En retard de 3\sjours$/u)
  })

  it('media: resolves a lazy image source and opens a lazy document in a new tab', async () => {
    const image = mount(DisplayMedia, {
      props: { alt: 'Map', src: () => Promise.resolve('https://cdn.example/map.png') },
    })
    await flushPromises()
    expect(image.find('img').attributes('src')).toBe('https://cdn.example/map.png')
    // The tab opens during the click; when the browser refuses it, the resolved link opens instead.
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    const document = mount(DisplayMedia, {
      props: {
        name: 'notice.pdf',
        preview: false,
        src: () => Promise.resolve('https://files.example/n.pdf'),
        variant: 'document',
      },
    })
    await document.findAll('[data-ui="UButton"]')[0]?.trigger('click')
    await flushPromises()
    expect(open.mock.calls).toEqual([
      ['about:blank', '_blank'],
      ['https://files.example/n.pdf', '_blank', 'noopener'],
    ])
  })

  it('code: highlights JSON and masks a secret until revealed', async () => {
    const block = mount(DisplayCode, { props: { language: 'json', value: '{"a": 1}' } })
    expect(block.findAll('pre span').length).toBeGreaterThan(3)
    const secret = mount(DisplayCode, {
      props: { value: 'exa_live_12345678abcd', variant: 'secret' },
    })
    expect(secret.find('[data-display-value]').text()).toMatch(/^•+abcd$/u)
    await secret.find('button[aria-pressed="false"]').trigger('click')
    expect(secret.find('[data-display-value]').text()).toBe('exa_live_12345678abcd')
  })

  it('empty: default title in the locale and plain variant', () => {
    expect(mount(DisplayEmpty).text()).toContain('Rien à afficher')
    expect(
      mount(DisplayEmpty, { props: { title: 'No file', variant: 'plain' } }).attributes(
        'data-variant',
      ),
    ).toBe('plain')
  })

  it('accordion: opens one item at a time and draws a nested block', async () => {
    const wrapper = mount(DisplayAccordion, {
      props: {
        items: [
          {
            block: {
              display: 'facts',
              props: { items: [{ label: 'Unit', value: '96' }], layout: 'inline' },
            },
            defaultOpen: true,
            label: 'Pricing',
          },
          { content: 'Free up to 72 h', label: 'Cancellation' },
        ],
      },
    })
    await flushPromises()
    expect(wrapper.find('[data-display="facts"]').exists()).toBe(true)
    await wrapper.findAll('button')[1]?.trigger('click')
    expect(wrapper.text()).toContain('Free up to 72 h')
    expect(wrapper.find('[data-display="facts"]').exists()).toBe(false)
  })

  it('skeletons replace any block while loading', () => {
    expect(
      mount(DisplayFacts, { props: { items: [], loading: true } })
        .find('[data-display-skeleton]')
        .exists(),
    ).toBe(true)
    expect(
      mount(DisplayChart, { props: { data: [], loading: true } })
        .find('[data-display-skeleton]')
        .exists(),
    ).toBe(true)
  })
})

describe('UiDisplay', () => {
  it('draws the kind, applies a preset and the app slot classes', () => {
    setAppConfig({
      nuxtUiTools: {
        display: {
          presets: { text: { legal: { appearance: 'legal', title: 'Legal' } } },
          ui: { text: { root: 'app-text-root' } },
        },
      },
    })
    const wrapper = mount(UiDisplay, {
      props: { display: 'text', preset: 'legal', props: { text: 'Kept 5 years' } },
    })
    expect(wrapper.attributes('data-appearance')).toBe('legal')
    expect(wrapper.text()).toContain('Legal')
    expect(wrapper.classes()).toContain('app-text-root')
  })

  it('lets the block ui prop win over the app slot classes', () => {
    setAppConfig({ nuxtUiTools: { display: { ui: { heading: { title: 'text-sm' } } } } })
    const wrapper = mount(UiDisplay, {
      props: { display: 'heading', props: { title: 'T', ui: { title: 'text-xl' } } },
    })
    expect(wrapper.find('h3').classes()).toContain('text-xl')
    expect(wrapper.find('h3').classes()).not.toContain('text-sm')
  })

  it('renders render functions as content', () => {
    const wrapper = mount(UiDisplay, {
      props: { display: 'text', props: { text: () => h('b', 'bold') } },
    })
    expect(wrapper.find('b').text()).toBe('bold')
  })
})

describe('display chips', () => {
  it('keeps a Nuxt UI color for built-in tones and reads the tone variables for a registered one', () => {
    const builtin = mount(DisplayChip, { props: { chip: { label: 'Paid', tone: 'success' } } })
    expect(builtin.attributes('data-color')).toBe('success')
    const registered = mount(DisplayChip, {
      props: { chip: { label: 'Procertif', tone: 'violet', variant: 'solid' } },
    })
    expect(registered.attributes('data-color')).toBe('neutral')
    expect(registered.classes()).toContain('nut-display-tone-violet')
    expect(registered.classes()).toContain('bg-[var(--nut-tone)]')
  })
})
