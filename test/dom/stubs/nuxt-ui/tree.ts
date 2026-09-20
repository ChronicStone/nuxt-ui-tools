import { defineComponent, h } from 'vue'
import type { VNode } from 'vue'

import { isFunction } from '#ui-tools/shared/utils/predicate'

import { asRecord, asRecords, asStrings, optional, scalarText } from './props'
import type { StubRecord, StubValue } from './props'

type KeyGetter = (item: StubRecord) => StubValue

function asKeyGetter(value: StubValue): KeyGetter | undefined {
  // SAFETY: UTree's get-key prop is authored as (item) => key by the field components under test.
  return isFunction(value) ? (value as KeyGetter) : undefined
}

export default defineComponent({
  emits: ['update:modelValue', 'update:expanded'],
  inheritAttrs: false,
  name: 'UTree',
  props: {
    bubbleSelect: optional,
    disabled: optional,
    expanded: optional,
    getKey: optional,
    items: optional,
    modelValue: optional,
    multiple: optional,
    propagateSelect: optional,
    selectionBehavior: optional,
    size: optional,
    ui: optional,
    virtualize: optional,
  },
  setup(props, { attrs, emit, slots }) {
    function keyOf(item: StubRecord) {
      const getKey = asKeyGetter(props.getKey)
      if (getKey) {
        return scalarText(getKey(item))
      }
      return scalarText(item.value ?? item.label)
    }
    function selectedKeys() {
      if (Array.isArray(props.modelValue)) {
        return asRecords(props.modelValue).map(keyOf)
      }
      const single = asRecord(props.modelValue)
      return single ? [keyOf(single)] : []
    }
    function isSelected(item: StubRecord) {
      return selectedKeys().includes(keyOf(item))
    }
    function select(item: StubRecord) {
      if (props.multiple) {
        const model = asRecords(props.modelValue)
        emit(
          'update:modelValue',
          isSelected(item)
            ? model.filter((entry) => keyOf(entry) !== keyOf(item))
            : [...model, item],
        )
        return
      }
      emit('update:modelValue', isSelected(item) ? undefined : item)
    }
    function toggle(key: string, expanded: boolean) {
      const current = asStrings(props.expanded)
      emit(
        'update:expanded',
        expanded ? current.filter((entry) => entry !== key) : [...current, key],
      )
    }
    function renderItems(items: StubRecord[], depth: number): VNode {
      return h(
        'ul',
        { 'data-depth': String(depth), role: depth === 0 ? 'tree' : 'group' },
        items.map((item) => {
          const key = keyOf(item)
          const children = asRecords(item.children)
          const expanded = asStrings(props.expanded).includes(key)
          const wrapper = slots['item-wrapper']
          const row = wrapper
            ? h(
                'div',
                { 'data-ui-tree-row': key },
                wrapper({
                  expanded,
                  handleToggle: () => toggle(key, expanded),
                  indeterminate: false,
                  item,
                  selected: isSelected(item),
                  ui: { link: () => '', linkLabel: () => '', linkTrailingIcon: () => '' },
                }),
              )
            : h(
                'button',
                {
                  'aria-selected': isSelected(item) ? 'true' : 'false',
                  disabled: Boolean(props.disabled) || item.disabled === true,
                  onClick: () => select(item),
                  type: 'button',
                },
                slots.item
                  ? slots.item({ item, selected: isSelected(item) })
                  : scalarText(item.label),
              )
          return h('li', { 'data-ui-tree-item': key, role: 'treeitem' }, [
            row,
            children.length && !wrapper
              ? h('button', {
                  'data-ui-tree-toggle': '',
                  onClick: () => toggle(key, expanded),
                  type: 'button',
                })
              : null,
            children.length && expanded ? renderItems(children, depth + 1) : null,
          ])
        }),
      )
    }
    return () =>
      h(
        'div',
        { ...attrs, 'data-multiple': props.multiple ? 'true' : undefined, 'data-ui': 'UTree' },
        renderItems(asRecords(props.items), 0),
      )
  },
})
