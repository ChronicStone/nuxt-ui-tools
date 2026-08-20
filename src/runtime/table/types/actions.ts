import type { DropdownMenuItem } from '@nuxt/ui/components/DropdownMenu.vue'

import type { TableSourceRequestContext } from './source'
import type { TableApi } from './table-api'
import type {
  GenericObject,
  MaybePromise,
  TableLayout,
  TableRowRenderParams,
  TableTextValue,
} from './utils'

export interface TableActionContext<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
> {
  selectedRows: TRow[]
  context: TContext
  pageContext: TPageContext
  request: TableSourceRequestContext<TRow, TContext>
}

export interface TableToolbarAction<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
> extends Omit<DropdownMenuItem, 'children' | 'disabled' | 'loading' | 'label' | 'onSelect'> {
  key: string
  label?: TableTextValue
  condition?: boolean | ((context: TContext) => boolean)
  disabled?: boolean | ((context: TableActionContext<TRow, TContext, TPageContext>) => boolean)
  loading?: boolean | ((context: TableActionContext<TRow, TContext, TPageContext>) => boolean)
  action?: (context: TableActionContext<TRow, TContext, TPageContext>) => MaybePromise<unknown>
}

export interface TableBulkAction<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
> extends TableToolbarAction<TRow, TContext, TPageContext> {
  requiresSelection?: boolean
}

/** Runtime state exposed for a configured toolbar or bulk action. */
export interface TableActionState {
  visible: boolean
  disabled: boolean
  loading: boolean
  running: boolean
}

/**
 * Headless action data for custom table toolbars.
 *
 * The action definition remains available alongside resolved state so a custom
 * renderer can keep package behavior while owning the actual button markup.
 */
export interface TableActionSlotProps<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
> {
  definition:
    | TableBulkAction<TRow, TContext, TPageContext>
    | TableToolbarAction<TRow, TContext, TPageContext>
  state: TableActionState
  running: boolean
  selection: TableApi['selection']
  execute: () => Promise<void>
}

export interface TableRowActionContext<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
> extends TableRowRenderParams<TRow, TContext, TPageContext> {
  layout: TableLayout
}

export interface TableRowAction<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
> extends Omit<DropdownMenuItem, 'children' | 'disabled' | 'loading' | 'label' | 'onSelect'> {
  key: string
  label?: TableTextValue
  condition?: boolean | ((context: TableRowActionContext<TRow, TContext, TPageContext>) => boolean)
  disabled?: boolean | ((context: TableRowActionContext<TRow, TContext, TPageContext>) => boolean)
  loading?: boolean | ((context: TableRowActionContext<TRow, TContext, TPageContext>) => boolean)
  children?: TableRowAction<TRow, TContext, TPageContext>[]
  action?: (context: TableRowActionContext<TRow, TContext, TPageContext>) => MaybePromise<unknown>
}
