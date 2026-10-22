import { defineNuxtPlugin, useAppConfig, useHead } from '#app'

import { resolveAppDisplayConfig } from '../utils/config'
import { buildDisplayToneCss } from '../utils/tone-css'

/** Injects the colors of the tones registered in `appConfig.nuxtUiTools.display.tones`. */
export default defineNuxtPlugin({
  name: 'nuxt-ui-tools:display-tones',
  setup() {
    const appConfig = useAppConfig()
    useHead({
      style: [
        {
          key: 'nut-display-tones',
          textContent: () => buildDisplayToneCss(resolveAppDisplayConfig(appConfig).tones),
        },
      ],
    })
  },
})
