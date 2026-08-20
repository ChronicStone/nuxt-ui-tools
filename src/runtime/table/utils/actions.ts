import type { DropdownMenuItem } from '@nuxt/ui/components/DropdownMenu.vue'

import { isFunction, isNumber } from '../../shared/utils/predicate'
import type { TableInjectedRowActionScope } from '../composables/use-table-row-actions'
import type {
  GenericObject,
  TableRowAction,
  TableRuntimeRecord,
  TableApi,
  TableLayout,
  TableSchemaView,
  TableTextValue,
} from '../types'

type RowActionSchemaSource = {
  rowActions?: TableSchemaView['rowActions']
}

export function hasConfiguredTableActions(
  schema: Pick<TableSchemaView, 'actions' | 'toolbarActions' | 'rowActions'>,
) {
  return Boolean(schema.actions?.length)
}

export function resolveTableActionDefinitions(
  schema: Pick<TableSchemaView, 'actions' | 'toolbarActions'>,
) {
  return {
    bulkActions: schema.actions ?? [],
    toolbarActions: schema.toolbarActions ?? [],
  }
}

type ResolvedRowAction = TableRowAction<GenericObject, TableRuntimeRecord, TableRuntimeRecord>
type TableRowActionFactory = (params: {
  row: GenericObject
  context: TableRuntimeRecord
  pageContext: TableRuntimeRecord
  tableApi: TableApi
  layout: TableLayout
}) => ResolvedRowAction[]

export function resolveTableRowActions(options: {
  schema: RowActionSchemaSource
  scope: TableInjectedRowActionScope
}): ResolvedRowAction[] {
  const source = options.schema.rowActions

  if (!source) return []
  if (isRowActionResolver(source)) return source(options.scope)

  return source
}

export function resolveVisibleTableRowActions(options: {
  schema: RowActionSchemaSource
  scope: TableInjectedRowActionScope
}): ResolvedRowAction[] {
  return pruneTableRowActions({
    actions: resolveTableRowActions(options),
    scope: options.scope,
  })
}

export function hasVisibleTableRowActions(options: {
  schema: RowActionSchemaSource
  rows: GenericObject[]
  context: GenericObject
  pageContext: GenericObject
  tableApi: TableInjectedRowActionScope['tableApi']
  layout: TableInjectedRowActionScope['layout']
}) {
  return options.rows.some(
    (row, index) =>
      resolveVisibleTableRowActions({
        schema: options.schema,
        scope: {
          row,
          index,
          context: toPlainRecord(options.context),
          pageContext: toPlainRecord(options.pageContext),
          tableApi: options.tableApi,
          layout: options.layout,
        },
      }).length > 0,
  )
}

export function createRowActionDropdownItems(options: {
  actions: ResolvedRowAction[]
  scope: TableInjectedRowActionScope
}): DropdownMenuItem[] {
  return options.actions.map((action) =>
    mapRowActionToDropdownItem({ action, scope: options.scope }),
  )
}

function mapRowActionToDropdownItem(options: {
  action: ResolvedRowAction
  scope: TableInjectedRowActionScope
}): DropdownMenuItem {
  const children = options.action.children
    ? createRowActionDropdownItems({
        actions: options.action.children,
        scope: options.scope,
      })
    : undefined

  const item: DropdownMenuItem = {
    ...options.action,
    label: resolveActionLabel(options.action),
    disabled: resolveFlag({
      value: options.action.disabled,
      scope: options.scope,
    }),
    loading: resolveFlag({
      value: options.action.loading,
      scope: options.scope,
    }),
    children: children?.length ? children : undefined,
    onSelect: () => {
      void options.action.action?.(options.scope)
    },
  }

  delete item.condition
  delete item.action

  return item
}

function resolveActionLabel(action: ResolvedRowAction) {
  return resolveTableActionLabel(action.label)
}

export function resolveTableActionLabel(label: TableTextValue | undefined) {
  if (isFunction(label)) return String(label())
  if (isNumber(label)) return String(label)
  return label
}

function resolveConditionalBoolean(options: {
  value: boolean | ((scope: TableInjectedRowActionScope) => boolean) | undefined
  scope: TableInjectedRowActionScope
}) {
  if (isRowActionBooleanResolver(options.value)) return options.value(options.scope)
  return options.value ?? true
}

function resolveCondition(options: {
  value: boolean | ((scope: TableInjectedRowActionScope) => boolean) | undefined
  scope: TableInjectedRowActionScope
}) {
  return resolveConditionalBoolean(options)
}

function resolveFlag(options: {
  value: boolean | ((scope: TableInjectedRowActionScope) => boolean) | undefined
  scope: TableInjectedRowActionScope
}) {
  if (isRowActionBooleanResolver(options.value)) return options.value(options.scope)
  return options.value ?? false
}

function isRowActionResolver(value: TableSchemaView['rowActions']): value is TableRowActionFactory {
  return isFunction(value)
}

function isRowActionBooleanResolver(
  value: boolean | ((scope: TableInjectedRowActionScope) => boolean) | undefined,
): value is (scope: TableInjectedRowActionScope) => boolean {
  return isFunction(value)
}

function pruneTableRowActions(options: {
  actions: ResolvedRowAction[]
  scope: TableInjectedRowActionScope
}): ResolvedRowAction[] {
  return options.actions.flatMap((action) => {
    if (!resolveCondition({ value: action.condition, scope: options.scope })) return []

    const children: ResolvedRowAction[] | undefined = action.children
      ? pruneTableRowActions({
          actions: action.children,
          scope: options.scope,
        })
      : undefined

    const nextAction: ResolvedRowAction = children ? { ...action, children } : action
    if (!children?.length && !isActionItemSelectable(nextAction)) return []

    return [
      {
        ...nextAction,
        children: children?.length ? children : undefined,
      },
    ]
  })
}

function isActionItemSelectable(action: ResolvedRowAction) {
  if (action.action) return true
  if (action.href) return true
  if (action.to) return true
  if (action.type === 'checkbox') return true
  if (action.onUpdateChecked) return true
  return false
}

function toPlainRecord(value: GenericObject): TableRuntimeRecord {
  return Object.fromEntries(Object.entries(value))
}
