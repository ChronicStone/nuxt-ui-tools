import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import DisplayDate from '#ui-tools/display/components/blocks/display-date.vue'
import DisplayDiff from '#ui-tools/display/components/blocks/display-diff.vue'
import DisplayFacts from '#ui-tools/display/components/blocks/display-facts.vue'
import DisplayList from '#ui-tools/display/components/blocks/display-list.vue'
import DisplayRecord from '#ui-tools/display/components/blocks/display-record.vue'
import UiDisplay from '#ui-tools/display/components/display.vue'
import { revealTruncated } from '#ui-tools/display/directives/reveal-truncated'

import { setAppConfig } from '../nuxt-state'

afterEach(() => setAppConfig({}))

/** Happy DOM has no layout: give an element the box of text cut by an ellipsis. */
function clip(element: HTMLElement, cut: boolean) {
  element.style.textOverflow = 'ellipsis'
  element.style.overflow = 'hidden'
  Object.defineProperty(element, 'clientWidth', { configurable: true, value: 100 })
  Object.defineProperty(element, 'scrollWidth', { configurable: true, value: cut ? 240 : 100 })
}

describe('display fixes in 1.25.1', () => {
  it('reveals the full text of a truncated record title on hover, and only while it is cut', async () => {
    const wrapper = mount(DisplayRecord, {
      attachTo: document.body,
      props: { title: 'TOEIC Listening & Reading · Lyon Part-Dieu · Thursday session' },
    })
    const title = wrapper.find('.truncate').element
    if (!(title instanceof HTMLElement)) throw new Error('no title')
    clip(title, true)
    await wrapper.find('.truncate').trigger('pointerenter')
    expect(title.getAttribute('title')).toBe(
      'TOEIC Listening & Reading · Lyon Part-Dieu · Thursday session',
    )
    clip(title, false)
    await wrapper.find('.truncate').trigger('pointerenter')
    expect(title.hasAttribute('title')).toBe(false)
    wrapper.unmount()
  })

  it('keeps an authored title', () => {
    const element = document.createElement('span')
    element.textContent = 'Long text'
    element.title = 'Authored'
    clip(element, true)
    revealTruncated(element)
    expect(element.title).toBe('Authored')
  })

  it('renders every record field in stack items, with chip and trailing together and ui.avatar', () => {
    const wrapper = mount(DisplayRecord, {
      props: {
        items: [
          {
            avatar: { alt: 'Camille Laurent' },
            badges: [{ label: 'CPF', tone: 'success' }],
            chip: { label: '12 seats', tone: 'info' },
            description: 'Oral on appointment',
            meta: 'Lyon',
            reference: 'SES-0412',
            title: 'TOEIC · Oct 24',
            trailing: '€96',
            trailingCaption: 'excl. VAT',
          },
        ],
        ui: { avatar: 'ring-2 ring-primary' },
        variant: 'stack',
      },
    })
    const text = wrapper.text()
    for (const part of [
      'SES-0412',
      'TOEIC · Oct 24',
      'Lyon',
      'Oral on appointment',
      'CPF',
      '12 seats',
      '€96',
      'excl. VAT',
    ])
      expect(text).toContain(part)
    expect(wrapper.find('[data-ui="UAvatar"]').classes()).toContain('ring-primary')
  })

  it("merges a field's ui over its preset's ui per slot", () => {
    setAppConfig({
      nuxtUiTools: {
        display: {
          presets: { heading: { section: { ui: { root: 'gap-4', title: 'text-xs uppercase' } } } },
        },
      },
    })
    const wrapper = mount(UiDisplay, {
      props: {
        display: 'heading',
        preset: 'section',
        props: { title: 'Billing', ui: { title: 'text-sm' } },
      },
    })
    const classes = wrapper.find('h3').classes()
    expect(classes).toContain('uppercase')
    expect(classes).toContain('text-sm')
    expect(classes).not.toContain('text-xs')
    expect(wrapper.classes()).toContain('gap-4')
  })

  it('shows the year of a date outside the current year', () => {
    const later = mount(DisplayDate, {
      props: { now: '2026-10-23', value: '2027-09-30', variant: 'countdown' },
    })
    expect(later.text()).toContain('2027')
    const sameYear = mount(DisplayDate, {
      props: { now: '2026-10-23', value: '2026-11-30', variant: 'countdown' },
    })
    expect(sameYear.text()).not.toContain('2026')
  })

  it('takes a ui.frame class on the diff table frame', () => {
    const wrapper = mount(DisplayDiff, {
      props: {
        items: [{ after: 'B', before: 'A', label: 'City' }],
        ui: { frame: 'rounded-none' },
        variant: 'columns',
      },
    })
    expect(wrapper.find('table').element.parentElement?.className).toContain('rounded-none')
  })

  it('styles every chip from display.ui.chip and keeps their tone', () => {
    setAppConfig({
      nuxtUiTools: {
        display: { ui: { chip: { base: 'rounded-full px-2', label: 'font-semibold' } } },
      },
    })
    const facts = mount(DisplayFacts, {
      props: {
        items: [
          { chip: { label: 'Active', tone: 'success', ui: { base: 'px-3' } }, label: 'Status' },
        ],
      },
    })
    const badge = facts.find('[data-ui="UBadge"]')
    expect(badge.attributes('data-color')).toBe('success')
    expect(badge.classes()).toContain('rounded-full')
    expect(badge.classes()).toContain('px-3')
    expect(badge.classes()).not.toContain('px-2')
    const list = mount(DisplayList, {
      props: { items: [{ text: 'TOEIC', tone: 'warning' }], variant: 'chips' },
    })
    expect(list.find('[data-ui="UBadge"]').classes()).toContain('rounded-full')
    expect(list.find('[data-ui="UBadge"]').attributes('data-color')).toBe('warning')
  })
})
