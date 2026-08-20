import { computed, ref, type ComputedRef } from 'vue'

import { isFunction } from '../../shared/utils/predicate'
import type {
  TableActionSlotProps,
  TableActionState,
  TableActionContext,
  TableSchemaView,
  GenericObject,
  TableApi,
  TableRuntimeRecord,
} from '../types'
import { resolveTableActionDefinitions } from '../utils/actions'
import type { UseTableDataReturn } from './use-table-data'
import type { useTableSelection } from './use-table-selection'

type TableActionDefinition =
  | NonNullable<TableSchemaView['actions']>[number]
  | NonNullable<TableSchemaView['toolbarActions']>[number]

export interface TableActionController extends TableActionSlotProps<
  GenericObject,
  TableRuntimeRecord,
  TableRuntimeRecord
> {
  definition: TableActionDefinition
}

export interface UseTableActionsParams {
  schema: ComputedRef<TableSchemaView>
  queryContent: UseTableDataReturn
  selection: ReturnType<typeof useTableSelection>
  tableApi: { value: { selection: TableApi['selection'] } | null }
}

/** Owns normalized bulk/toolbar action state and execution for a table. */
export function useTableActions(options: UseTableActionsParams) {
  const runningKeys = ref<string[]>([])
  const tableApi = options.tableApi.value
  if (!tableApi) throw new Error('Table API is not ready')
  const selectionApi = tableApi.selection

  const resolvedDefinitions = computed(() => resolveTableActionDefinitions(options.schema.value))
  const bulkDefinitions = computed<TableActionDefinition[]>(
    () => resolvedDefinitions.value.bulkActions,
  )
  const toolbarDefinitions = computed<TableActionDefinition[]>(
    () => resolvedDefinitions.value.toolbarActions,
  )
  const definitions = computed<TableActionDefinition[]>(() => [
    ...bulkDefinitions.value,
    ...toolbarDefinitions.value,
  ])

  const context = computed<
    TableActionContext<GenericObject, TableRuntimeRecord, TableRuntimeRecord>
  >(() => ({
    selectedRows: options.selection.selectedRows.value,
    context: toPlainRecord(options.queryContent.contextData.value),
    pageContext: toPlainRecord(options.queryContent.pageContextData.value),
    request: {
      ...options.queryContent.requestContext.value,
      context: toPlainRecord(options.queryContent.requestContext.value.context),
    },
  }))

  function isRunning(key: string) {
    return runningKeys.value.includes(key)
  }

  function resolveState(definition: TableActionDefinition): TableActionState {
    const actionContext = context.value
    const condition = resolveCondition(definition.condition, actionContext.context)
    const disabled = resolveFlag(definition.disabled, actionContext)
    const loading = resolveFlag(definition.loading, actionContext)
    const requiresSelection = 'requiresSelection' in definition && definition.requiresSelection

    return {
      visible: condition,
      disabled: disabled || Boolean(requiresSelection && !actionContext.selectedRows.length),
      loading,
      running: isRunning(definition.key),
    }
  }

  async function execute(definition: TableActionDefinition) {
    const state = resolveState(definition)
    if (!state.visible || state.disabled || state.loading || state.running) return
    if (!definition.action) return

    runningKeys.value = [...runningKeys.value, definition.key]
    try {
      await definition.action(context.value)
    } finally {
      runningKeys.value = runningKeys.value.filter((key) => key !== definition.key)
    }
  }

  function resolveControllers(actionDefinitions: TableActionDefinition[]) {
    return actionDefinitions.flatMap((definition) => {
      const state = resolveState(definition)
      if (!state.visible) return []

      return [
        {
          definition,
          state,
          running: state.running,
          selection: selectionApi,
          execute: () => execute(definition),
        },
      ]
    })
  }

  const bulkActions = computed<TableActionController[]>(() =>
    resolveControllers(bulkDefinitions.value),
  )
  const toolbarActions = computed<TableActionController[]>(() =>
    resolveControllers(toolbarDefinitions.value),
  )
  const actions = computed<TableActionController[]>(() => [
    ...bulkActions.value,
    ...toolbarActions.value,
  ])

  return {
    definitions,
    actions,
    bulkActions,
    toolbarActions,
    runningKeys,
    execute,
  }
}

function resolveCondition(value: TableActionDefinition['condition'], context: TableRuntimeRecord) {
  return isBooleanResolver<TableRuntimeRecord>(value) ? value(context) : (value ?? true)
}

function resolveFlag(
  value:
    | boolean
    | ((
        context: TableActionContext<GenericObject, TableRuntimeRecord, TableRuntimeRecord>,
      ) => boolean)
    | undefined,
  context: TableActionContext<GenericObject, TableRuntimeRecord, TableRuntimeRecord>,
) {
  return isBooleanResolver<typeof context>(value) ? value(context) : (value ?? false)
}

type BooleanResolver<TContext> = boolean | ((context: TContext) => boolean) | undefined

function isBooleanResolver<TContext>(
  value: BooleanResolver<TContext>,
): value is (context: TContext) => boolean {
  return isFunction(value)
}

function toPlainRecord(value: GenericObject): TableRuntimeRecord {
  return Object.fromEntries(Object.entries(value))
}
