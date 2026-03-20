import { createInjectionState } from '@vueuse/core'

const [useProvideGridRow, useGridRow] = createInjectionState((rowIndex: number) => rowIndex)

export { useGridRow, useProvideGridRow }
