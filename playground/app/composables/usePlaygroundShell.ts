import { watch } from 'vue'

import type { DataListControlSize } from '#ui-tools/table'

export function usePlaygroundShell() {
  const route = useRoute()
  const navigationCollapsed = useState<boolean>('playground-navigation-collapsed', () => false)
  const mobileNavigationOpen = useState<boolean>('playground-mobile-navigation-open', () => false)
  const tableSize = useState<DataListControlSize>('playground-table-size', () => 'md')

  watch(
    () => route.path,
    () => {
      mobileNavigationOpen.value = false
    },
  )

  return {
    navigationCollapsed,
    mobileNavigationOpen,
    tableSize,
  }
}
