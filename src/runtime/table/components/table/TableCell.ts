import type { FunctionalComponent, VNodeChild } from 'vue'

import type { GenericObject } from '../../types'

interface TableCellProps {
  index: number
  render: (params: { row: GenericObject; index: number }) => VNodeChild
  row: GenericObject
}

const TableCell: FunctionalComponent<TableCellProps> = (props) =>
  props.render({ index: props.index, row: props.row })

TableCell.props = ['index', 'render', 'row']
TableCell.displayName = 'DataListTableCell'

export default TableCell
