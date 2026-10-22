import { useAppConfig } from 'nuxt/app'
import { computed } from 'vue'
import type { ComputedRef } from 'vue'

import type { DisplayKind, DisplayUiConfig, DisplayUiMap } from '../types'
import { resolveAppDisplayConfig } from '../utils/config'

/** `appConfig.nuxtUiTools.display`: presets and slot classes. */
export function useDisplayConfig(): ComputedRef<DisplayUiConfig> {
  const appConfig = useAppConfig()
  return computed(() => resolveAppDisplayConfig(appConfig))
}

/** The app slot classes of one kind. */
export function useDisplayAppUi<TKind extends DisplayKind>(kind: TKind) {
  const config = useDisplayConfig()
  return computed<DisplayUiMap[TKind] | undefined>(() => config.value.ui?.[kind])
}
