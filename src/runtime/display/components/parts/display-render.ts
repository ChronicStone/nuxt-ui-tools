import type { FunctionalComponent } from 'vue'

import { renderVNode } from '../../../shared/utils/render'
import type { DisplayContent } from '../../types'

/**
 * Renders text, a lazy translation, a VNode, or a render function. A function runs while this
 * component renders, so its reactive reads belong to this component only.
 */
const DisplayRender: FunctionalComponent<{ content?: DisplayContent }> = (props) =>
  renderVNode(props.content)

DisplayRender.props = ['content']
DisplayRender.displayName = 'DisplayRender'

export default DisplayRender
