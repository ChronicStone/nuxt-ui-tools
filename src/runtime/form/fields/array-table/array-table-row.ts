import UButton from '@nuxt/ui/components/Button.vue'
import { computed, defineComponent, getCurrentInstance, h, nextTick, shallowRef, watch } from 'vue'

import { createFieldValueValidation } from '../../composables/use-field-control'
import { useFieldEffects } from '../../composables/use-field-effects'
import { provideFormFieldWatchOwner } from '../../composables/use-form-field-chrome'
import { useFormRuntimeContext } from '../../composables/use-form-runtime'
import type { FormField } from '../../types'
import type { FormArrayTableUi } from '../../types/ui'
import { resolveFormText } from '../../utils/text'
import { mergeFormUiClass } from '../../utils/ui'
import type { FormArrayCustomAction } from '../array-list/types'
import ArrayTableCell from './array-table-cell.vue'
import { renderButton, renderInertCell } from './inert/cells'
import type { InertEnvironment } from './inert/cells'

interface ArrayTableRowProps {
  index: number
  itemPath: readonly string[]
  columns: readonly FormField[]
  actions: boolean
  draggable: boolean
  canDelete: (index: number) => boolean
  customActions: readonly FormArrayCustomAction[]
  customVisible: (index: number, actionIndex: number) => boolean
  ui?: FormArrayTableUi
  dragLabel: string
  removeLabel: string
  /** Lets the row render inert until it is used, or renders it live from the start when `null`. */
  inert: InertEnvironment | null
}

const ROW_CLASS =
  'align-middle transition-colors hover:bg-elevated/35 [&>*]:border-b [&>*]:border-default [&:last-child>*]:border-b-0'
const CELL_CLASS = 'border-r border-default p-1.5 last:border-r-0'
const ACTIONS_CELL_CLASS =
  'sticky right-0 whitespace-nowrap border-l border-default bg-default px-1.5 py-1.5 text-right shadow-[-8px_0_12px_-10px_rgba(0,0,0,0.45)]'
const DRAG_HANDLE_CLASS = 'array-table-drag-handle cursor-grab active:cursor-grabbing'

/**
 * One row of an array table. Its props stay the same objects while the row is unchanged, so the
 * table can re-render without re-rendering every row.
 *
 * An inert row renders its cells as the markup their controls produce, without mounting the
 * controls, and renders them live once it is used: when a mouse or pen enters it, when focus
 * enters it (focus then moves to the matching live control), when a click reaches one of its
 * controls, as a tap or assistive technology does (the click is then repeated on the live
 * control), or when the form focuses one of its fields. It stays live afterwards. The row runs the
 * effects and live validation of its cells either way, so they behave the same live or inert.
 *
 * A row decides once, when it is created, and always renders live while it hydrates markup the
 * server rendered, since the server renders every row live and hydration must match it.
 */
export default defineComponent(
  (props: ArrayTableRowProps, { emit }) => {
    const form = useFormRuntimeContext()
    const row = shallowRef<HTMLTableRowElement | null>(null)
    const live = shallowRef<boolean>(rendersLive())
    const rowKey = computed(() => props.itemPath.join('.'))
    const cellPaths = computed(
      () => new Set(props.columns.map((column) => [...props.itemPath, column.key].join('.'))),
    )

    provideFormFieldWatchOwner((path) => cellPaths.value.has(path.join('.')))

    for (const column of props.columns) {
      useFieldEffects(
        () => column,
        () => [...props.itemPath, column.key],
      )
    }
    const validations = props.columns.map((column) =>
      createFieldValueValidation(form, {
        field: () => column,
        path: () => [...props.itemPath, column.key],
      }),
    )
    form.paint.afterPaint(() =>
      watch(
        () => props.columns.map((column) => form.getValue([...props.itemPath, column.key])),
        (values) => {
          for (const [index, value] of values.entries()) {
            void validations[index]?.(value)
          }
        },
        { deep: true },
      ),
    )

    watch(
      [rowKey, live],
      ([key, isLive], _previous, onCleanup) => {
        if (!isLive) {
          onCleanup(form.registerRowActivator(key, activate))
        }
      },
      { immediate: true },
    )

    function rendersLive() {
      if (!props.inert || getCurrentInstance()?.vnode.el) {
        return true
      }
      return props.inert.mode === 'auto' && form.paint.allowsLive()
    }

    function activate() {
      live.value = true
    }

    function onPointerenter(event: PointerEvent) {
      if (event.pointerType !== 'touch') {
        activate()
      }
    }

    function onFocusin(event: FocusEvent) {
      if (live.value) {
        return
      }
      const key = fieldKey(event.target)
      activate()
      if (key) {
        void nextTick(() => focusLiveControl(key))
      }
    }

    function onInertClick(event: MouseEvent) {
      const key = fieldKey(event.currentTarget)
      activate()
      if (key) {
        void nextTick(() => repeatClick(key))
      }
    }

    function liveControl(key: string) {
      return row.value?.querySelector<HTMLElement>(`[data-form-field="${CSS.escape(key)}"]`)
    }

    function focusLiveControl(key: string) {
      const control = liveControl(key)
      if (!control) {
        return
      }
      control.focus({ preventScroll: true })
      if (control instanceof HTMLInputElement) {
        control.select()
      }
    }

    function repeatClick(key: string) {
      const control = liveControl(key)
      if (control instanceof HTMLInputElement) {
        control.focus({ preventScroll: true })
        return
      }
      control?.click()
    }

    function renderCell(column: FormField) {
      const liveCell = () => h(ArrayTableCell, { field: column, itemPath: props.itemPath })
      if (live.value || !props.inert) {
        return liveCell()
      }
      return (
        renderInertCell(props.inert, {
          controlClass: props.ui?.control,
          field: column,
          onClick: onInertClick,
          path: [...props.itemPath, column.key],
        }) ?? liveCell()
      )
    }

    function renderActions() {
      const inert = !live.value && props.inert ? props.inert : null
      const children = []
      if (props.draggable) {
        children.push(
          inert
            ? renderButton(inert, {
                ariaLabel: props.dragLabel,
                class: mergeFormUiClass(DRAG_HANDLE_CLASS, props.ui?.action),
                color: 'neutral',
                icon: 'i-lucide-grip-vertical',
                size: 'xs',
                variant: 'ghost',
              })
            : h(UButton, {
                'aria-label': props.dragLabel,
                class: mergeFormUiClass(DRAG_HANDLE_CLASS, props.ui?.action),
                color: 'neutral',
                icon: 'i-lucide-grip-vertical',
                size: 'xs',
                variant: 'ghost',
              }),
        )
      }
      if (props.canDelete(props.index)) {
        const onClick = () => emit('remove', props.index)
        children.push(
          inert
            ? renderButton(inert, {
                ariaLabel: props.removeLabel,
                class: props.ui?.action,
                color: 'neutral',
                icon: 'i-lucide-trash-2',
                onClick,
                size: 'xs',
                variant: 'ghost',
              })
            : h(UButton, {
                'aria-label': props.removeLabel,
                class: props.ui?.action,
                color: 'neutral',
                icon: 'i-lucide-trash-2',
                onClick,
                size: 'xs',
                variant: 'ghost',
              }),
        )
      }
      for (const [actionIndex, action] of props.customActions.entries()) {
        const visible = props.customVisible(props.index, actionIndex)
        const onClick = () => emit('custom', props.index, actionIndex)
        const label = resolveFormText(action.label)
        const style = visible ? undefined : { display: 'none' }
        children.push(
          inert && action.icon
            ? h(
                renderButton(inert, {
                  class: props.ui?.action,
                  color: 'neutral',
                  icon: action.icon,
                  label,
                  onClick,
                  size: 'xs',
                  variant: 'ghost',
                }),
                { key: actionIndex, style },
              )
            : h(
                UButton,
                {
                  class: props.ui?.action,
                  color: 'neutral',
                  icon: action.icon,
                  key: actionIndex,
                  onClick,
                  size: 'xs',
                  style,
                  variant: 'ghost',
                },
                () => label,
              ),
        )
      }
      return children
    }

    return () =>
      h(
        'tr',
        {
          class: mergeFormUiClass(ROW_CLASS, props.ui?.row),
          'data-form-array-row': rowKey.value,
          'data-form-array-row-inert': live.value ? undefined : '',
          onFocusin,
          onPointerenter,
          ref: row,
        },
        [
          ...props.columns.map((column) =>
            h(
              'td',
              { class: mergeFormUiClass(CELL_CLASS, props.ui?.cell), key: column.key },
              renderCell(column),
            ),
          ),
          props.actions
            ? h(
                'td',
                { class: mergeFormUiClass(ACTIONS_CELL_CLASS, props.ui?.actionsCell) },
                renderActions(),
              )
            : null,
        ],
      )
  },
  {
    emits: ['remove', 'custom'],
    name: 'ArrayTableRow',
    props: [
      'index',
      'itemPath',
      'columns',
      'actions',
      'draggable',
      'canDelete',
      'customActions',
      'customVisible',
      'ui',
      'dragLabel',
      'removeLabel',
      'inert',
    ],
  },
)

function fieldKey(target: EventTarget | null) {
  return target instanceof Element
    ? (target.closest('[data-form-field]')?.getAttribute('data-form-field') ?? undefined)
    : undefined
}
