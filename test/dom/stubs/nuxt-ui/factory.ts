import { defineComponent, h } from 'vue'
import type { PropType, VNodeChild } from 'vue'

import { isNullish } from '#ui-tools/shared/utils/predicate'

type Any = Record<string, unknown>
interface MenuItem {
  label?: string
  icon?: string
  type?: string
  class?: string
  disabled?: boolean
  onSelect?: (event: Event) => void
}

const optional = { default: undefined, type: null as unknown as PropType<unknown> }

function dataAttributes(props: Any, keys: string[]) {
  const out: Any = {}
  for (const key of keys) {
    const value = props[key]
    if (value === undefined || value === null || value === false) {
      continue
    }
    out[`data-${key.replaceAll(/[A-Z]/gu, (c) => `-${c.toLowerCase()}`)}`] =
      value === '' ? 'true' : String(value)
  }
  return out
}

function uiAttributes(ui: unknown) {
  const out: Any = {}
  if (!ui || typeof ui !== 'object') {
    return out
  }
  for (const [slot, value] of Object.entries(ui as Any)) {
    if (typeof value === 'string' && value) {
      out[`data-ui-${slot.toLowerCase()}`] = value
    }
  }
  return out
}

function flattenItems(items: unknown): (MenuItem & { group: number })[] {
  if (!Array.isArray(items)) {
    return []
  }
  const groups = Array.isArray(items[0]) ? (items as MenuItem[][]) : [items as MenuItem[]]
  return groups.flatMap((group, index) => group.map((item) => ({ ...item, group: index })))
}

function renderItems(items: unknown) {
  const flat = flattenItems(items)
  if (!flat.length) {
    return null
  }
  return h(
    'div',
    { 'data-ui-items': '' },
    flat.map((item, index) =>
      item.type === 'label'
        ? h('span', { class: item.class, 'data-ui-item-label': '', key: index }, item.label)
        : item.type === 'separator'
          ? h('hr', { 'data-ui-item-separator': '', key: index })
          : h(
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
            ),
    ),
  )
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
        const ui = props.ui as Any | undefined
        const children: VNodeChild[] = []
        if (slots.leading) {
          children.push(h('span', { 'data-ui-slot': 'leading' }, slots.leading()))
        }
        if (!isNullish(props.label)) {
          children.push(h('span', { 'data-ui-label': '' }, String(props.label)))
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
            class: [attrs.class, ui?.base, ui?.root],
            'data-ui': name,
            disabled: tag === 'button' ? Boolean(props.disabled) : undefined,
            type: tag === 'button' ? 'button' : undefined,
            ...dataAttributes(props as Any, controlKeys),
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
      return () => {
        const ui = props.ui as Any | undefined
        const open = props.open !== false
        const content: VNodeChild[] = []
        if (open) {
          if (props.title) {
            content.push(h('h2', { 'data-ui-title': '' }, String(props.title)))
          }
          if (slots.header) {
            content.push(h('div', { 'data-ui-slot': 'header' }, slots.header({ close: () => {} })))
          }
          if (slots.content) {
            content.push(
              h('div', { 'data-ui-slot': 'content' }, slots.content({ close: () => {} })),
            )
          }
          if (slots.body) {
            content.push(h('div', { 'data-ui-slot': 'body' }, slots.body({ close: () => {} })))
          }
          if (slots.footer) {
            content.push(h('div', { 'data-ui-slot': 'footer' }, slots.footer({ close: () => {} })))
          }
        }
        const items = renderItems(props.items)
        return h(
          'div',
          {
            ...attrs,
            class: [attrs.class, ui?.root],
            'data-open': String(open),
            'data-ui': name,
            ...dataAttributes(props as Any, controlKeys),
            ...uiAttributes(props.ui),
          },
          [
            h(
              'div',
              { 'data-ui-trigger': '', onClick: () => emit('update:open', !open) },
              slots.default?.({ close: () => {}, open }),
            ),
            open
              ? h('div', { class: [ui?.content, ui?.body], 'data-ui-content': '' }, content)
              : null,
            items,
          ],
        )
      }
    },
  })
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
        const ui = props.ui as Any | undefined
        const shared = {
          ...attrs,
          class: [attrs.class, ui?.root, ui?.base],
          'data-ui': name,
          disabled: Boolean(props.disabled),
          ...dataAttributes(props as Any, controlKeys),
          ...uiAttributes(props.ui),
        }
        if (kind === 'select') {
          const items = (props.items as Array<{ label: string; value: unknown }> | undefined) ?? []
          return h(
            'select',
            {
              ...shared,
              onChange: (event: Event) =>
                emit('update:modelValue', (event.target as HTMLSelectElement).value),
              value: String(props.modelValue ?? ''),
            },
            items.map((item) =>
              h(
                'option',
                {
                  selected: String(item.value) === String(props.modelValue),
                  value: String(item.value),
                },
                item.label,
              ),
            ),
          )
        }
        if (kind === 'radio') {
          const items = (props.items as Array<{ label: string; value: unknown }> | undefined) ?? []
          return h(
            'div',
            { ...shared, role: 'radiogroup' },
            items.map((item) =>
              h('label', { 'data-ui-radio': String(item.value) }, [
                h('input', {
                  checked: String(item.value) === String(props.modelValue),
                  onChange: () => emit('update:modelValue', item.value),
                  type: 'radio',
                  value: String(item.value),
                }),
                item.label,
              ]),
            ),
          )
        }
        if (kind === 'checkbox') {
          return h('input', {
            ...shared,
            checked: props.modelValue === true,
            'data-indeterminate': props.modelValue === 'indeterminate' ? 'true' : undefined,
            onClick: () => emit('update:modelValue', props.modelValue !== true),
            type: 'checkbox',
          })
        }
        return h('span', { class: ui?.root, 'data-ui-wrap': name }, [
          h('input', {
            ...shared,
            onInput: (event: Event) => {
              const { value } = event.target as HTMLInputElement
              emit(
                'update:modelValue',
                kind === 'number' ? (value === '' ? undefined : Number(value)) : value,
              )
            },
            placeholder: props.placeholder,
            type: kind === 'number' ? 'number' : ((props.type as string | undefined) ?? 'text'),
            value: isNullish(props.modelValue) ? '' : String(props.modelValue),
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
      const ui = props.ui as Any | undefined
      return h(
        'nav',
        {
          ...attrs,
          class: [attrs.class, ui?.root],
          'data-items-per-page': String(props.itemsPerPage ?? ''),
          'data-page': String(page),
          'data-pages': String(pages),
          'data-total': String(props.total ?? ''),
          'data-ui': 'UPagination',
          ...dataAttributes(props as Any, controlKeys),
          ...uiAttributes(props.ui),
        },
        [
          h(
            'button',
            {
              class: ui?.first,
              'data-ui-page-first': '',
              onClick: () => emit('update:page', 1),
              type: 'button',
            },
            '«',
          ),
          h(
            'button',
            {
              class: ui?.prev,
              'data-ui-page-prev': '',
              disabled: page <= 1,
              onClick: () => emit('update:page', page - 1),
              type: 'button',
            },
            '‹',
          ),
          ...Array.from({ length: pages }, (_, index) =>
            h(
              'button',
              {
                class: ui?.item,
                'data-active': String(index + 1 === page),
                'data-ui-page': String(index + 1),
                onClick: () => emit('update:page', index + 1),
                type: 'button',
              },
              String(index + 1),
            ),
          ),
          h(
            'button',
            {
              class: ui?.next,
              'data-ui-page-next': '',
              disabled: page >= pages,
              onClick: () => emit('update:page', page + 1),
              type: 'button',
            },
            '›',
          ),
          h(
            'button',
            {
              class: ui?.last,
              'data-ui-page-last': '',
              onClick: () => emit('update:page', pages),
              type: 'button',
            },
            '»',
          ),
        ],
      )
    }
  },
})
