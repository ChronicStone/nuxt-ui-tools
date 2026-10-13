import type { FunctionalComponent } from 'vue'

import type { RenderableType } from '../../../shared'
import { renderVNode } from '../../../shared/utils/render'
import type { TableInjectedRowActionScope } from '../../composables/use-table-row-actions'

interface SummaryContentProps {
  params: TableInjectedRowActionScope
  render: (params: TableInjectedRowActionScope) => RenderableType
}

/**
 * Renders one of a summary row's schema callbacks. The callback runs while this component renders,
 * so each render gets fresh vnodes and the reactive reads inside it belong to this component only.
 */
const SummaryContent: FunctionalComponent<SummaryContentProps> = (props) =>
  renderVNode(props.render(props.params))

SummaryContent.props = ['params', 'render']
SummaryContent.displayName = 'DataListSummaryContent'

export default SummaryContent
