import { defineComponent, h } from 'vue'
import type { PropType, VNodeChild } from 'vue'

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
    out[`data-${key.replaceAll(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`] =
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
        if (slots.leading) children.push(h('span', { 'data-ui-slot': 'leading' }, slots.leading()))
        if (props.label != null)
          children.push(h('span', { 'data-ui-label': '' }, String(props.label)))
        if (slots.default) children.push(...(slots.default() ?? []))
        if (slots.trailing)
          children.push(h('span', { 'data-ui-slot': 'trailing' }, slots.trailing()))
        return h(
          tag,
          {
            ...attrs,
            type: tag === 'button' ? 'button' : undefined,
            disabled: tag === 'button' ? Boolean(props.disabled) : undefined,
            class: [attrs.class, ui?.base, ui?.root],
            'data-ui': name,
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
          if (props.title) content.push(h('h2', { 'data-ui-title': '' }, String(props.title)))
          if (slots.header)
            content.push(h('div', { 'data-ui-slot': 'header' }, slots.header({ close: () => {} })))
          if (slots.content)
            content.push(
              h('div', { 'data-ui-slot': 'content' }, slots.content({ close: () => {} })),
            )
          if (slots.body)
            content.push(h('div', { 'data-ui-slot': 'body' }, slots.body({ close: () => {} })))
          if (slots.footer)
            content.push(h('div', { 'data-ui-slot': 'footer' }, slots.footer({ close: () => {} })))
        }
        const items = renderItems(props.items)
        return h(
          'div',
          {
            ...attrs,
            class: [attrs.class, ui?.root],
            'data-ui': name,
            'data-open': String(open),
            ...dataAttributes(props as Any, controlKeys),
            ...uiAttributes(props.ui),
          },
          [
            h(
              'div',
              { 'data-ui-trigger': '', onClick: () => emit('update:open', !open) },
              slots.default?.({ open, close: () => {} }),
            ),
            open
              ? h('div', { 'data-ui-content': '', class: [ui?.content, ui?.body] }, content)
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
              value: String(props.modelValue ?? ''),
              onChange: (event: Event) =>
                emit('update:modelValue', (event.target as HTMLSelectElement).value),
            },
            items.map((item) =>
              h(
                'option',
                {
                  value: String(item.value),
                  selected: String(item.value) === String(props.modelValue),
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
                  type: 'radio',
                  value: String(item.value),
                  checked: String(item.value) === String(props.modelValue),
                  onChange: () => emit('update:modelValue', item.value),
                }),
                item.label,
              ]),
            ),
          )
        }
        if (kind === 'checkbox') {
          return h('input', {
            ...shared,
            type: 'checkbox',
            checked: props.modelValue === true,
            'data-indeterminate': props.modelValue === 'indeterminate' ? 'true' : undefined,
            onClick: () => emit('update:modelValue', props.modelValue !== true),
          })
        }
        return h('span', { 'data-ui-wrap': name, class: ui?.root }, [
          h('input', {
            ...shared,
            type: kind === 'number' ? 'number' : ((props.type as string | undefined) ?? 'text'),
            value: props.modelValue == null ? '' : String(props.modelValue),
            placeholder: props.placeholder,
            onInput: (event: Event) => {
              const value = (event.target as HTMLInputElement).value
              emit(
                'update:modelValue',
                kind === 'number' ? (value === '' ? undefined : Number(value)) : value,
              )
            },
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
          'data-ui': 'UPagination',
          'data-page': String(page),
          'data-pages': String(pages),
          'data-total': String(props.total ?? ''),
          'data-items-per-page': String(props.itemsPerPage ?? ''),
          class: [attrs.class, ui?.root],
          ...dataAttributes(props as Any, controlKeys),
          ...uiAttributes(props.ui),
        },
        [
          h(
            'button',
            {
              type: 'button',
              'data-ui-page-first': '',
              class: ui?.first,
              onClick: () => emit('update:page', 1),
            },
            '«',
          ),
          h(
            'button',
            {
              type: 'button',
              'data-ui-page-prev': '',
              class: ui?.prev,
              disabled: page <= 1,
              onClick: () => emit('update:page', page - 1),
            },
            '‹',
          ),
          ...Array.from({ length: pages }, (_, index) =>
            h(
              'button',
              {
                type: 'button',
                'data-ui-page': String(index + 1),
                'data-active': String(index + 1 === page),
                class: ui?.item,
                onClick: () => emit('update:page', index + 1),
              },
              String(index + 1),
            ),
          ),
          h(
            'button',
            {
              type: 'button',
              'data-ui-page-next': '',
              class: ui?.next,
              disabled: page >= pages,
              onClick: () => emit('update:page', page + 1),
            },
            '›',
          ),
          h(
            'button',
            {
              type: 'button',
              'data-ui-page-last': '',
              class: ui?.last,
              onClick: () => emit('update:page', pages),
            },
            '»',
          ),
        ],
      )
    }
  },
})
