import { defineComponent, h, ref } from 'vue'
import type { VNodeChild } from 'vue'

import { isFunction, isString } from '#ui-tools/shared/utils/predicate'

import {
  asRecord,
  asRecords,
  asScalar,
  dataValue,
  inputElement,
  optional,
  scalarText,
} from './props'
import type { StubRecord, StubScalar, StubValue } from './props'

type StubProps = Readonly<Record<string, StubValue>>
type Handler = (event: Event) => void

interface MenuItem {
  label?: string
  icon?: string
  type?: string
  class?: string
  disabled?: boolean
  onSelect?: Handler
  group: number
}

function noop() {
  return null
}

function asHandler(value: StubValue): Handler | undefined {
  // SAFETY: stub menu items only ever receive DOM events; the authored callback signature is (event) => void.
  return isFunction(value) ? (value as Handler) : undefined
}

function dataAttributes(props: StubProps, keys: string[]) {
  const out: Record<string, string> = {}
  for (const key of keys) {
    const value = asScalar(props[key])
    if (value === undefined || value === null || value === false) {
      continue
    }
    out[`data-${key.replaceAll(/[A-Z]/gu, (c) => `-${c.toLowerCase()}`)}`] =
      value === '' ? 'true' : String(value)
  }
  return out
}

function uiAttributes(ui: StubValue) {
  const out: Record<string, string> = {}
  const record = asRecord(ui)
  if (!record) {
    return out
  }
  for (const [slot, value] of Object.entries(record)) {
    if (isString(value) && value) {
      out[`data-slot-${slot.toLowerCase()}`] = value
    }
  }
  return out
}

function uiClass(ui: StubValue, slot: string) {
  return dataValue(asRecord(ui)?.[slot])
}

function toMenuItem(record: StubRecord, group: number): MenuItem {
  return {
    class: dataValue(record.class),
    disabled: record.disabled === true,
    group,
    icon: dataValue(record.icon),
    label: dataValue(record.label),
    onSelect: asHandler(record.onSelect),
    type: dataValue(record.type),
  }
}

function flattenItems(items: StubValue): MenuItem[] {
  if (!Array.isArray(items)) {
    return []
  }
  const groups = Array.isArray(items[0]) ? items : [items]
  return groups.flatMap((group, index) =>
    asRecords(group).map((record) => toMenuItem(record, index)),
  )
}

function renderItem(item: MenuItem, index: number) {
  if (item.type === 'label') {
    return h('span', { class: item.class, 'data-ui-item-label': '', key: index }, item.label)
  }
  if (item.type === 'separator') {
    return h('hr', { 'data-ui-item-separator': '', key: index })
  }
  return h(
    'button',
    {
      class: item.class,
      'data-group': item.group,
      'data-icon': item.icon,
      'data-ui-item': '',
      disabled: item.disabled,
      key: index,
      onClick: (event: Event) => item.onSelect?.(event),
      type: 'button',
    },
    item.label,
  )
}

function renderItems(items: StubValue) {
  const flat = flattenItems(items)
  if (!flat.length) {
    return null
  }
  return h('div', { 'data-ui-items': '' }, flat.map(renderItem))
}

const controlKeys = [
  'color',
  'variant',
  'size',
  'icon',
  'leadingIcon',
  'trailingIcon',
  'square',
  'block',
  'loading',
  'disabled',
  'label',
  'placeholder',
  'activeColor',
  'activeVariant',
  'side',
  'inset',
  'direction',
  'title',
  'description',
  'text',
  'name',
  'type',
  'highlight',
]

export function createControlStub(name: string, tag = 'div') {
  return defineComponent({
    inheritAttrs: false,
    name,
    props: {
      activeColor: optional,
      activeVariant: optional,
      block: optional,
      color: optional,
      disabled: optional,
      icon: optional,
      label: optional,
      leadingIcon: optional,
      loading: optional,
      name: optional,
      size: optional,
      square: optional,
      text: optional,
      trailingIcon: optional,
      type: optional,
      ui: optional,
      variant: optional,
    },
    setup(props, { slots, attrs }) {
      return () => {
        const children: VNodeChild[] = []
        if (slots.leading) {
          children.push(h('span', { 'data-ui-slot': 'leading' }, slots.leading()))
        }
        if (props.label !== undefined && props.label !== null) {
          children.push(h('span', { 'data-ui-label': '' }, scalarText(props.label)))
        }
        if (slots.default) {
          children.push(...(slots.default() ?? []))
        }
        if (slots.trailing) {
          children.push(h('span', { 'data-ui-slot': 'trailing' }, slots.trailing()))
        }
        return h(
          tag,
          {
            ...attrs,
            class: [attrs.class, uiClass(props.ui, 'base'), uiClass(props.ui, 'root')],
            'data-ui': name,
            disabled: tag === 'button' ? Boolean(props.disabled) : undefined,
            type: tag === 'button' ? (dataValue(props.type) ?? 'button') : undefined,
            ...dataAttributes(props, controlKeys),
            ...uiAttributes(props.ui),
          },
          children,
        )
      }
    },
  })
}

export function createOverlayStub(name: string) {
  return defineComponent({
    emits: ['update:open'],
    inheritAttrs: false,
    name,
    props: {
      content: optional,
      description: optional,
      direction: optional,
      handle: optional,
      inset: optional,
      items: optional,
      modal: optional,
      open: optional,
      overlay: optional,
      portal: optional,
      side: optional,
      size: optional,
      text: optional,
      title: optional,
      ui: optional,
    },
    setup(props, { slots, attrs, emit }) {
      function renderSlot(slot: 'header' | 'content' | 'body' | 'footer') {
        const render = slots[slot]
        return render ? h('div', { 'data-ui-slot': slot }, render({ close: noop })) : null
      }
      return () => {
        const open = props.open !== false
        const content: VNodeChild[] = open
          ? [
              props.title ? h('h2', { 'data-ui-title': '' }, scalarText(props.title)) : null,
              renderSlot('header'),
              renderSlot('content'),
              renderSlot('body'),
              renderSlot('footer'),
            ]
          : []
        return h(
          'div',
          {
            ...attrs,
            class: [attrs.class, uiClass(props.ui, 'root')],
            'data-open': String(open),
            'data-ui': name,
            ...dataAttributes(props, controlKeys),
            ...uiAttributes(props.ui),
          },
          [
            h(
              'div',
              { 'data-ui-trigger': '', onClick: () => emit('update:open', !open) },
              slots.default?.({ close: noop, open }),
            ),
            open
              ? h(
                  'div',
                  {
                    class: [uiClass(props.ui, 'content'), uiClass(props.ui, 'body')],
                    'data-ui-content': '',
                  },
                  content,
                )
              : null,
            renderItems(props.items),
          ],
        )
      }
    },
  })
}

function numberInputValue(value: string) {
  return value === '' ? undefined : Number(value)
}

export function createInputStub(
  name: string,
  kind: 'text' | 'checkbox' | 'number' | 'select' | 'radio',
) {
  return defineComponent({
    emits: ['update:modelValue'],
    inheritAttrs: false,
    name,
    props: {
      color: optional,
      disabled: optional,
      highlight: optional,
      icon: optional,
      items: optional,
      loading: optional,
      max: optional,
      min: optional,
      modelValue: optional,
      placeholder: optional,
      size: optional,
      step: optional,
      type: optional,
      ui: optional,
      variant: optional,
    },
    setup(props, { slots, attrs, emit }) {
      return () => {
        const shared = {
          ...attrs,
          class: [attrs.class, uiClass(props.ui, 'root'), uiClass(props.ui, 'base')],
          'data-ui': name,
          disabled: Boolean(props.disabled),
          ...dataAttributes(props, controlKeys),
          ...uiAttributes(props.ui),
        }
        const model = scalarText(props.modelValue)
        if (kind === 'select') {
          return h(
            'select',
            {
              ...shared,
              onChange: (event: Event) =>
                emit(
                  'update:modelValue',
                  event.target instanceof HTMLSelectElement ? event.target.value : '',
                ),
              value: model,
            },
            asRecords(props.items).map((item) =>
              h(
                'option',
                { selected: scalarText(item.value) === model, value: scalarText(item.value) },
                scalarText(item.label),
              ),
            ),
          )
        }
        if (kind === 'radio') {
          return h(
            'div',
            { ...shared, role: 'radiogroup' },
            asRecords(props.items).map((item) =>
              h('label', { 'data-ui-radio': scalarText(item.value) }, [
                h('input', {
                  checked: scalarText(item.value) === model,
                  onChange: () => emit('update:modelValue', item.value),
                  type: 'radio',
                  value: scalarText(item.value),
                }),
                scalarText(item.label),
              ]),
            ),
          )
        }
        if (kind === 'checkbox') {
          return h('input', {
            ...shared,
            checked: props.modelValue === true,
            'data-indeterminate': props.modelValue === 'indeterminate' ? 'true' : undefined,
            onClick: (event: Event) => {
              // SAFETY: forwarded listeners are authored click handlers; asHandler validates the shape.
              asHandler(attrs.onClick as StubValue)?.(event)
              emit('update:modelValue', props.modelValue !== true)
            },
            type: 'checkbox',
          })
        }
        return h('span', { class: uiClass(props.ui, 'root'), 'data-ui-wrap': name }, [
          slots.leading?.(),
          h('input', {
            ...shared,
            onInput: (event: Event) => {
              const value = inputElement(event)?.value ?? ''
              emit('update:modelValue', kind === 'number' ? numberInputValue(value) : value)
            },
            placeholder: dataValue(props.placeholder),
            type: kind === 'number' ? 'number' : (dataValue(props.type) ?? 'text'),
            value: model,
          }),
          slots.trailing?.(),
        ])
      }
    },
  })
}

export const UPaginationStub = defineComponent({
  emits: ['update:page'],
  inheritAttrs: false,
  name: 'UPagination',
  props: {
    activeColor: optional,
    activeVariant: optional,
    color: optional,
    itemsPerPage: optional,
    page: optional,
    showControls: optional,
    showEdges: optional,
    siblingCount: optional,
    size: optional,
    total: optional,
    ui: optional,
    variant: optional,
  },
  setup(props, { attrs, emit }) {
    return () => {
      const page = Number(props.page ?? 1)
      const pages = Math.max(
        1,
        Math.ceil(Number(props.total ?? 0) / Math.max(1, Number(props.itemsPerPage ?? 1))),
      )
      function pageButton(
        slot: string,
        marker: string,
        label: string,
        target: number,
        disabled = false,
      ) {
        return h(
          'button',
          {
            class: uiClass(props.ui, slot),
            [marker]: '',
            disabled,
            onClick: () => emit('update:page', target),
            type: 'button',
          },
          label,
        )
      }
      return h(
        'nav',
        {
          ...attrs,
          class: [attrs.class, uiClass(props.ui, 'root')],
          'data-items-per-page': scalarText(props.itemsPerPage),
          'data-page': String(page),
          'data-pages': String(pages),
          'data-total': scalarText(props.total),
          'data-ui': 'UPagination',
          ...dataAttributes(props, controlKeys),
          ...uiAttributes(props.ui),
        },
        [
          pageButton('first', 'data-ui-page-first', '«', 1),
          pageButton('prev', 'data-ui-page-prev', '‹', page - 1, page <= 1),
          ...Array.from({ length: pages }, (_, index) =>
            h(
              'button',
              {
                class: uiClass(props.ui, 'item'),
                'data-active': String(index + 1 === page),
                'data-ui-page': String(index + 1),
                onClick: () => emit('update:page', index + 1),
                type: 'button',
              },
              String(index + 1),
            ),
          ),
          pageButton('next', 'data-ui-page-next', '›', page + 1, page >= pages),
          pageButton('last', 'data-ui-page-last', '»', pages),
        ],
      )
    }
  },
})

export function createMenuStub(name: string) {
  return defineComponent({
    emits: ['update:modelValue', 'update:searchTerm', 'update:open', 'create', 'blur'],
    inheritAttrs: false,
    name,
    props: {
      clear: optional,
      color: optional,
      createItem: optional,
      disabled: optional,
      items: optional,
      labelKey: optional,
      loading: optional,
      modelValue: optional,
      multiple: optional,
      open: optional,
      placeholder: optional,
      searchInput: optional,
      searchTerm: optional,
      size: optional,
      trailing: optional,
      ui: optional,
      valueKey: optional,
      variant: optional,
    },
    setup(props, { slots, attrs, emit }) {
      const internalOpen = ref<boolean>(props.open === true)
      function isOpen() {
        return props.open === undefined ? internalOpen.value : props.open === true
      }
      function setOpen(next: boolean) {
        internalOpen.value = next
        emit('update:open', next)
      }
      function optionValue(option: StubValue): StubScalar {
        const record = asRecord(option)
        return record ? asScalar(record[scalarText(props.valueKey, 'value')]) : asScalar(option)
      }
      function optionLabel(option: StubValue) {
        const record = asRecord(option)
        if (!record) {
          return scalarText(option)
        }
        const label = record[scalarText(props.labelKey, 'label')]
        return scalarText(label ?? record[scalarText(props.valueKey, 'value')])
      }
      function flatItems(): StubValue[] {
        const { items } = props
        if (!Array.isArray(items)) {
          return []
        }
        return items.flatMap((entry) => (Array.isArray(entry) ? entry : [entry]))
      }
      function selectedValues(): StubScalar[] {
        if (props.multiple) {
          return Array.isArray(props.modelValue) ? props.modelValue.map(asScalar) : []
        }
        const single = asScalar(props.modelValue)
        return single === undefined || single === null ? [] : [single]
      }
      function select(option: StubValue) {
        const value = optionValue(option)
        if (props.multiple) {
          const current = selectedValues()
          emit(
            'update:modelValue',
            current.includes(value)
              ? current.filter((entry) => entry !== value)
              : [...current, value],
          )
          return
        }
        emit('update:modelValue', value)
        setOpen(false)
      }
      function renderTriggerText(items: StubValue[], selected: StubScalar[]) {
        if (!selected.length) {
          return scalarText(props.placeholder)
        }
        return selected
          .map((value) => {
            const match = items.find((option) => optionValue(option) === value)
            return match === undefined ? scalarText(value) : optionLabel(match)
          })
          .join(', ')
      }
      function renderItemContent(option: StubValue) {
        if (slots.item) {
          return slots.item({ item: option })
        }
        if (slots['item-label']) {
          return slots['item-label']({ index: 0, item: option })
        }
        return optionLabel(option)
      }
      function renderContent(items: StubValue[], selected: StubScalar[], search: string) {
        const showCreate =
          Boolean(props.createItem) &&
          search.length > 0 &&
          !items.some((option) => optionLabel(option).toLowerCase() === search.toLowerCase())
        return h('div', { class: uiClass(props.ui, 'content'), 'data-ui-content': '' }, [
          props.searchInput
            ? h('input', {
                'data-ui-search': '',
                onInput: (event: Event) =>
                  emit('update:searchTerm', inputElement(event)?.value ?? ''),
                type: 'text',
                value: search,
              })
            : null,
          slots['content-top']?.(),
          h(
            'div',
            { 'data-ui-items': '', role: 'listbox' },
            items.map((option) =>
              h(
                'button',
                {
                  'aria-selected': selected.includes(optionValue(option)) ? 'true' : 'false',
                  'data-ui-item': scalarText(optionValue(option)),
                  disabled: asRecord(option)?.disabled === true,
                  onClick: () => select(option),
                  role: 'option',
                  type: 'button',
                },
                renderItemContent(option),
              ),
            ),
          ),
          !items.length && slots.empty ? h('div', { 'data-ui-empty': '' }, slots.empty()) : null,
          showCreate
            ? h(
                'button',
                { 'data-ui-create': '', onClick: () => emit('create', search), type: 'button' },
                slots['create-item-label'] ? slots['create-item-label']({ item: search }) : search,
              )
            : null,
          slots['content-bottom']?.(),
        ])
      }
      return () => {
        const items = flatItems()
        const selected = selectedValues()
        const search = scalarText(props.searchTerm)
        const open = isOpen()
        return h(
          'div',
          {
            ...attrs,
            class: [attrs.class, uiClass(props.ui, 'root'), uiClass(props.ui, 'base')],
            'data-loading': props.loading ? 'true' : undefined,
            'data-multiple': props.multiple ? 'true' : undefined,
            'data-open': String(open),
            'data-ui': name,
            ...dataAttributes(props, controlKeys),
            ...uiAttributes(props.ui),
          },
          [
            h(
              'button',
              {
                'data-ui-trigger': '',
                disabled: Boolean(props.disabled),
                onBlur: (event: Event) => emit('blur', event),
                onClick: () => setOpen(!open),
                type: 'button',
              },
              renderTriggerText(items, selected),
            ),
            props.clear && selected.length
              ? h('button', {
                  'data-ui-clear': '',
                  onClick: () => emit('update:modelValue', props.multiple ? [] : null),
                  type: 'button',
                })
              : null,
            open ? renderContent(items, selected, search) : null,
          ],
        )
      }
    },
  })
}
