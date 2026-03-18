import { computed, watch } from 'vue'

const themeModes = [
  { key: 'themeModes.light', value: 'light' as const, icon: 'i-lucide-sun-medium' },
  { key: 'themeModes.dark', value: 'dark' as const, icon: 'i-lucide-moon-star' },
  { key: 'themeModes.system', value: 'system' as const, icon: 'i-lucide-monitor' },
] as const

const primaryOptions = [
  { label: 'Red', value: 'red', swatch: 'bg-red-500' },
  { label: 'Orange', value: 'orange', swatch: 'bg-orange-500' },
  { label: 'Amber', value: 'amber', swatch: 'bg-amber-500' },
  { label: 'Yellow', value: 'yellow', swatch: 'bg-yellow-400' },
  { label: 'Lime', value: 'lime', swatch: 'bg-lime-500' },
  { label: 'Green', value: 'green', swatch: 'bg-green-500' },
  { label: 'Emerald', value: 'emerald', swatch: 'bg-emerald-500' },
  { label: 'Teal', value: 'teal', swatch: 'bg-teal-500' },
  { label: 'Cyan', value: 'cyan', swatch: 'bg-cyan-500' },
  { label: 'Sky', value: 'sky', swatch: 'bg-sky-500' },
  { label: 'Blue', value: 'blue', swatch: 'bg-blue-500' },
  { label: 'Indigo', value: 'indigo', swatch: 'bg-indigo-500' },
  { label: 'Violet', value: 'violet', swatch: 'bg-violet-500' },
  { label: 'Purple', value: 'purple', swatch: 'bg-purple-500' },
  { label: 'Fuchsia', value: 'fuchsia', swatch: 'bg-fuchsia-500' },
  { label: 'Pink', value: 'pink', swatch: 'bg-pink-500' },
  { label: 'Rose', value: 'rose', swatch: 'bg-rose-500' },
] as const

const neutralOptions = [
  { label: 'Slate', value: 'slate', swatch: 'bg-slate-400' },
  { label: 'Gray', value: 'gray', swatch: 'bg-gray-400' },
  { label: 'Zinc', value: 'zinc', swatch: 'bg-zinc-400' },
  { label: 'Neutral', value: 'neutral', swatch: 'bg-neutral-400' },
  { label: 'Stone', value: 'stone', swatch: 'bg-stone-400' },
] as const

const surfaceOptions = [
  { key: 'surfaceModes.mist', value: 'mist' as const },
  { key: 'surfaceModes.paper', value: 'paper' as const },
  { key: 'surfaceModes.night', value: 'night' as const },
] as const

const radiusOptions = [
  { label: '0', value: 'none' as const },
  { label: '0.25', value: 'sm' as const },
  { label: '0.5', value: 'md' as const },
  { label: '0.75', value: 'lg' as const },
  { label: '1', value: 'xl' as const },
] as const

const densityOptions = [
  { key: 'densityModes.airy', value: 'airy' as const },
  { key: 'densityModes.relaxed', value: 'relaxed' as const },
  { key: 'densityModes.compact', value: 'compact' as const },
] as const

const localeCodes = ['en', 'fr'] as const

type ThemeMode = (typeof themeModes)[number]['value']
type PrimaryPalette = (typeof primaryOptions)[number]['value']
type NeutralPalette = (typeof neutralOptions)[number]['value']
type SurfaceMode = (typeof surfaceOptions)[number]['value']
type RadiusMode = (typeof radiusOptions)[number]['value']
type DensityMode = (typeof densityOptions)[number]['value']
type LocaleCode = (typeof localeCodes)[number]
type AppearancePreferences = AppearanceHistory & {
  surface: SurfaceMode
  density: DensityMode
  locale: LocaleCode
}

type AppearanceHistory = {
  mode: ThemeMode
  primary: PrimaryPalette
  neutral: NeutralPalette
  radius: RadiusMode
}

const defaultAppearancePreferences: AppearancePreferences = {
  mode: 'system',
  primary: 'cyan',
  neutral: 'stone',
  surface: 'mist',
  radius: 'md',
  density: 'relaxed',
  locale: 'en',
}

function isOneOf<T extends readonly string[]>(values: T, value: unknown): value is T[number] {
  return typeof value === 'string' && values.includes(value as T[number])
}

export function usePlaygroundAppearance() {
  const route = useRoute()
  const appConfig = useAppConfig()
  const colorMode = useColorMode()
  const switchLocalePath = useSwitchLocalePath()
  const { locale, setLocale, t } = useI18n()
  const preferencesCookie = useCookie<AppearancePreferences>('playground-appearance', {
    default: () => ({ ...defaultAppearancePreferences }),
  })
  const preferencesInitialized = useState('playground-appearance-initialized', () => false)

  const previous = useState<AppearanceHistory>('playground-appearance-previous', () => ({
    mode: 'system',
    primary: 'cyan',
    neutral: 'stone',
    radius: 'md',
  }))

  const currentTheme = computed(() => ({
    primary: (appConfig.ui?.colors?.primary ?? 'cyan') as PrimaryPalette,
    neutral: (appConfig.ui?.colors?.neutral ?? 'stone') as NeutralPalette,
    surface: (appConfig.playground?.surface ?? 'mist') as SurfaceMode,
    radius: (appConfig.playground?.radius ?? 'md') as RadiusMode,
    density: (appConfig.playground?.density ?? 'relaxed') as DensityMode,
  }))

  const currentMode = computed<ThemeMode>(() => {
    const allowedModes = themeModes.map((item) => item.value) as readonly ThemeMode[]

    return isOneOf(allowedModes, colorMode.preference) ? colorMode.preference : 'system'
  })

  const selectedPrimary = computed(
    () =>
      primaryOptions.find((option) => option.value === currentTheme.value.primary) ??
      primaryOptions[8],
  )
  const selectedNeutral = computed(
    () =>
      neutralOptions.find((option) => option.value === currentTheme.value.neutral) ??
      neutralOptions[4],
  )
  const selectedRadius = computed(
    () =>
      radiusOptions.find((option) => option.value === currentTheme.value.radius) ??
      radiusOptions[2],
  )
  const previousPrimary = computed(
    () =>
      primaryOptions.find((option) => option.value === previous.value.primary) ?? primaryOptions[8],
  )
  const previousNeutral = computed(
    () =>
      neutralOptions.find((option) => option.value === previous.value.neutral) ?? neutralOptions[4],
  )
  const previousRadius = computed(
    () =>
      radiusOptions.find((option) => option.value === previous.value.radius) ?? radiusOptions[2],
  )

  const surfaceShellClass = computed(() => {
    const surfaceMap: Record<SurfaceMode, string[]> = {
      mist: [
        'bg-[radial-gradient(circle_at_top_left,rgba(8,145,178,0.08),transparent_26%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_22%)]',
        'bg-elevated/40 dark:bg-muted/10',
      ],
      paper: [
        'bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),rgba(255,255,255,0)_28%),radial-gradient(circle_at_top_right,rgba(231,229,228,0.8),rgba(231,229,228,0)_20%)]',
        'bg-default',
      ],
      night: [
        'bg-[radial-gradient(circle_at_top_left,rgba(8,145,178,0.12),transparent_22%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_18%)]',
        'bg-inverted/95 dark:bg-inverted',
      ],
    }

    return surfaceMap[currentTheme.value.surface]
  })

  const radiusClass = computed(() => {
    const radiusMap: Record<RadiusMode, string> = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
    }

    return radiusMap[currentTheme.value.radius]
  })

  const innerRadiusClass = computed(() => {
    const radiusMap: Record<RadiusMode, string> = {
      none: 'rounded-none',
      sm: 'rounded-xs',
      md: 'rounded-sm',
      lg: 'rounded-md',
      xl: 'rounded-lg',
    }

    return radiusMap[currentTheme.value.radius]
  })

  const densityClass = computed(() => {
    const densityMap: Record<
      DensityMode,
      { shell: string; panel: string; gap: string; nav: string }
    > = {
      airy: {
        shell: 'px-4 py-4 md:px-6 md:py-6 xl:px-8 xl:py-8',
        panel: 'p-6 md:p-7',
        gap: 'gap-7',
        nav: 'p-5',
      },
      relaxed: {
        shell: 'px-4 py-4 md:px-5 md:py-5 xl:px-6 xl:py-6',
        panel: 'p-5 md:p-6',
        gap: 'gap-6',
        nav: 'p-4',
      },
      compact: {
        shell: 'px-3 py-3 md:px-4 md:py-4 xl:px-5 xl:py-5',
        panel: 'p-4 md:p-5',
        gap: 'gap-4',
        nav: 'p-3.5',
      },
    }

    return densityMap[currentTheme.value.density]
  })

  const radiusCssValue = computed(() => {
    const radiusMap: Record<RadiusMode, string> = {
      none: '0rem',
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
    }

    return radiusMap[currentTheme.value.radius]
  })

  useHead({
    htmlAttrs: {
      style: computed(() => `--ui-radius: ${radiusCssValue.value};`),
    },
  })

  const classes = computed(() => ({
    shell: ['min-h-dvh w-full', surfaceShellClass.value, densityClass.value.shell],
    container: 'mx-auto flex w-full max-w-[1440px] flex-col gap-6',
    header: [
      'border border-default/70 bg-default/80 backdrop-blur-xl shadow-[0_24px_80px_-48px_rgba(0,0,0,0.45)]',
      radiusClass.value,
      densityClass.value.panel,
      densityClass.value.gap,
      'flex flex-col',
    ],
    eyebrowRow:
      'flex flex-wrap items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-toned',
    titleWrap: 'flex max-w-4xl flex-col gap-2',
    title:
      'm-0 text-3xl font-semibold tracking-tight text-highlighted text-balance sm:text-4xl xl:text-5xl',
    description: 'm-0 max-w-3xl text-sm leading-6 text-toned text-pretty sm:text-[15px]',
    headerActions: 'flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between',
    badgeRow: 'flex flex-wrap items-center gap-2',
    navGrid: 'grid gap-3 md:grid-cols-2 xl:grid-cols-4',
    navLink: [
      'flex min-w-0 flex-col gap-1.5 border border-default/70 bg-default/65 text-left shadow-sm transition',
      'hover:-translate-y-0.5 hover:border-primary/30 hover:bg-default/90',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
      innerRadiusClass.value,
      densityClass.value.nav,
    ],
    navLinkActive: 'border-primary/35 bg-primary/10',
    navLabel: 'truncate text-sm font-semibold text-highlighted',
    navDescription: 'text-sm leading-5 text-toned text-pretty',
    main: 'min-w-0',
    pageStack: 'grid gap-6',
    pageGrid: 'grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]',
    list: 'grid gap-4',
    panel: [
      'border border-default/70 bg-default/80 backdrop-blur-xl shadow-[0_18px_60px_-42px_rgba(0,0,0,0.4)]',
      radiusClass.value,
      densityClass.value.panel,
      densityClass.value.gap,
      'flex h-full flex-col',
    ],
    panelMeta: 'flex flex-wrap items-center gap-2',
    panelCopy: 'flex flex-col gap-3',
    panelTitle:
      'm-0 text-2xl font-semibold tracking-tight text-highlighted text-balance md:text-[2rem]',
    panelText: 'm-0 text-sm leading-6 text-toned text-pretty sm:text-[15px]',
    mono: 'font-mono text-xs uppercase tracking-[0.14em] text-toned',
    footer: 'mt-auto flex flex-wrap items-center gap-3 pt-1',
    controlsWrap: 'flex flex-col gap-6',
    controlsHeader: 'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between',
    controlsGrid: 'grid gap-4 sm:grid-cols-2',
    controlsWide: 'sm:col-span-2',
    field: 'flex flex-col gap-2',
    fieldLabel: 'text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-toned',
    previewRow: 'flex flex-wrap items-center gap-2',
    choiceGrid: 'grid gap-2 sm:grid-cols-3',
    neutralGrid: 'grid gap-2 sm:grid-cols-3',
    radiusGrid: 'grid grid-cols-5 gap-2',
    toneButton: [
      'justify-start border border-default/70 bg-default/60 text-default shadow-none',
      'hover:bg-default/90 hover:border-primary/30',
      innerRadiusClass.value,
      'px-3 py-2.5',
    ],
    toneButtonActive: 'bg-primary/10 border-primary/35 text-highlighted',
    modeGrid: 'grid grid-cols-3 gap-2',
    modeButton: [
      'justify-start border border-default/70 bg-default/60 text-default shadow-none',
      'hover:bg-default/90 hover:border-primary/30',
      innerRadiusClass.value,
      'px-3 py-2.5',
    ],
    modeButtonActive: 'bg-primary/10 border-primary/35 text-highlighted',
    historyCard: [
      'grid gap-3 border border-default/70 bg-default/55',
      innerRadiusClass.value,
      'p-3.5',
    ],
    historyGrid: 'grid gap-3 sm:grid-cols-2',
    exportBox: [
      'w-full border border-default/70 bg-elevated/50 font-mono text-xs leading-6 text-toned shadow-none',
      innerRadiusClass.value,
    ],
  }))

  const themeUi = computed(() => ({
    card: {
      root: 'border border-default/70 bg-default/80 backdrop-blur-xl shadow-[0_18px_60px_-42px_rgba(0,0,0,0.4)]',
      header: currentTheme.value.density === 'compact' ? 'p-4 pb-0' : 'p-5 pb-0 md:p-6 md:pb-0',
      body: currentTheme.value.density === 'compact' ? 'p-4 pt-0' : 'p-5 pt-0 md:p-6 md:pt-0',
      footer: currentTheme.value.density === 'compact' ? 'p-4 pt-0' : 'p-5 pt-0 md:p-6 md:pt-0',
    },
    button: {
      base: 'font-medium transition duration-200 ease-out active:scale-[0.98]',
    },
    selectMenu: {
      base: 'min-h-11 border-default/70 bg-default/85 shadow-none',
      content: 'border border-default/70 bg-default/95 p-1 shadow-xl backdrop-blur-xl',
      item: 'data-highlighted:bg-primary/10',
      viewport: 'p-0',
    },
    popover: {
      content: 'border border-default/70 bg-default/95 p-0 shadow-xl backdrop-blur-xl',
    },
    slideover: {
      content: 'border border-default/70 bg-default/95 shadow-2xl backdrop-blur-xl',
      header: 'border-b border-default/60',
    },
    textarea: {
      base: 'border-default/70 bg-elevated/50 font-mono text-xs leading-6 shadow-none',
    },
  }))

  const slideoverUi = computed(() => ({
    content: 'w-[min(42rem,100vw)]',
    body: 'p-0 sm:p-0',
    header: 'border-b border-default/60 px-4 py-4 sm:px-5',
    title: 'text-xl font-semibold tracking-tight',
    description: 'text-sm leading-6 text-toned',
  }))

  const headerBadges = computed(() => [
    { color: 'primary' as const, label: currentTheme.value.primary },
    { color: 'neutral' as const, label: currentTheme.value.neutral },
    { color: 'neutral' as const, label: locale.value.toUpperCase() },
  ])

  const localeOptions = computed(
    () =>
      [
        { label: t('locale.english'), value: 'en' },
        { label: t('locale.french'), value: 'fr' },
      ] satisfies Array<{ label: string; value: LocaleCode }>,
  )

  const exportConfigPreview = computed(() => {
    return `@import "tailwindcss";
@import "@nuxt/ui";

:root {
  --ui-radius: ${radiusCssValue.value};
}

export default defineAppConfig({
  ui: {
    colors: {
      primary: '${currentTheme.value.primary}',
      neutral: '${currentTheme.value.neutral}'
    }
  },
  playground: {
    surface: '${currentTheme.value.surface}',
    radius: '${currentTheme.value.radius}',
    density: '${currentTheme.value.density}'
  },
  colorMode: '${currentMode.value}'
})`
  })

  function normalizePreferences(
    value: Partial<AppearancePreferences> | null | undefined,
  ): AppearancePreferences {
    const modeValues = themeModes.map((item) => item.value) as readonly ThemeMode[]
    const primaryValues = primaryOptions.map((option) => option.value) as readonly PrimaryPalette[]
    const neutralValues = neutralOptions.map((option) => option.value) as readonly NeutralPalette[]
    const surfaceValues = surfaceOptions.map((option) => option.value) as readonly SurfaceMode[]
    const radiusValues = radiusOptions.map((option) => option.value) as readonly RadiusMode[]
    const densityValues = densityOptions.map((option) => option.value) as readonly DensityMode[]

    return {
      mode: isOneOf(modeValues, value?.mode) ? value.mode : defaultAppearancePreferences.mode,
      primary: isOneOf(primaryValues, value?.primary)
        ? value.primary
        : defaultAppearancePreferences.primary,
      neutral: isOneOf(neutralValues, value?.neutral)
        ? value.neutral
        : defaultAppearancePreferences.neutral,
      surface: isOneOf(surfaceValues, value?.surface)
        ? value.surface
        : defaultAppearancePreferences.surface,
      radius: isOneOf(radiusValues, value?.radius)
        ? value.radius
        : defaultAppearancePreferences.radius,
      density: isOneOf(densityValues, value?.density)
        ? value.density
        : defaultAppearancePreferences.density,
      locale: isOneOf(localeCodes, value?.locale)
        ? value.locale
        : defaultAppearancePreferences.locale,
    }
  }

  if (!preferencesInitialized.value) {
    const preferences = normalizePreferences(preferencesCookie.value)

    preferencesCookie.value = preferences
    preferencesInitialized.value = true

    if (colorMode.preference !== preferences.mode) {
      colorMode.preference = preferences.mode
    }

    if (locale.value !== preferences.locale) {
      void setLocale(preferences.locale)
    }

    if (
      appConfig.ui?.colors?.primary !== preferences.primary ||
      appConfig.ui?.colors?.neutral !== preferences.neutral ||
      appConfig.playground?.surface !== preferences.surface ||
      appConfig.playground?.radius !== preferences.radius ||
      appConfig.playground?.density !== preferences.density
    ) {
      updateAppConfig({
        ui: {
          colors: {
            primary: preferences.primary,
            neutral: preferences.neutral,
          },
        },
        playground: {
          surface: preferences.surface,
          radius: preferences.radius,
          density: preferences.density,
        },
      })
    }
  }

  watch(
    [currentMode, currentTheme, locale],
    ([mode, theme, activeLocale]) => {
      preferencesCookie.value = {
        mode,
        primary: theme.primary,
        neutral: theme.neutral,
        surface: theme.surface,
        radius: theme.radius,
        density: theme.density,
        locale: isOneOf(localeCodes, activeLocale)
          ? activeLocale
          : defaultAppearancePreferences.locale,
      }
    },
    { deep: true },
  )

  function remember<K extends keyof AppearanceHistory>(key: K, value: AppearanceHistory[K]) {
    previous.value = {
      ...previous.value,
      [key]: value,
    }
  }

  function setMode(mode: unknown) {
    const allowedModes = themeModes.map((item) => item.value) as readonly ThemeMode[]

    if (!isOneOf(allowedModes, mode) || mode === currentMode.value) {
      return
    }

    remember('mode', currentMode.value)
    colorMode.preference = mode
  }

  async function setLanguage(code: unknown) {
    if (!isOneOf(localeCodes, code) || locale.value === code) {
      return
    }

    const path = switchLocalePath(code)
    await setLocale(code)

    if (path && path !== route.fullPath) {
      await navigateTo(path)
    }
  }

  function updateColors(next: Partial<{ primary: PrimaryPalette; neutral: NeutralPalette }>) {
    updateAppConfig({
      ui: {
        colors: {
          primary: next.primary ?? currentTheme.value.primary,
          neutral: next.neutral ?? currentTheme.value.neutral,
        },
      },
    })
  }

  function updatePlayground(
    next: Partial<{ surface: SurfaceMode; radius: RadiusMode; density: DensityMode }>,
  ) {
    updateAppConfig({
      playground: {
        surface: next.surface ?? currentTheme.value.surface,
        radius: next.radius ?? currentTheme.value.radius,
        density: next.density ?? currentTheme.value.density,
      },
    })
  }

  function setPrimaryPalette(value: unknown) {
    const allowed = primaryOptions.map((option) => option.value) as readonly PrimaryPalette[]

    if (!isOneOf(allowed, value) || value === currentTheme.value.primary) {
      return
    }

    remember('primary', currentTheme.value.primary)
    updateColors({ primary: value })
  }

  function setNeutralPalette(value: unknown) {
    const allowed = neutralOptions.map((option) => option.value) as readonly NeutralPalette[]

    if (!isOneOf(allowed, value) || value === currentTheme.value.neutral) {
      return
    }

    remember('neutral', currentTheme.value.neutral)
    updateColors({ neutral: value })
  }

  function setSurfaceMode(value: unknown) {
    const allowed = surfaceOptions.map((option) => option.value) as readonly SurfaceMode[]

    if (isOneOf(allowed, value)) {
      updatePlayground({ surface: value })
    }
  }

  function setRadiusMode(value: unknown) {
    const allowed = radiusOptions.map((option) => option.value) as readonly RadiusMode[]

    if (!isOneOf(allowed, value) || value === currentTheme.value.radius) {
      return
    }

    remember('radius', currentTheme.value.radius)
    updatePlayground({ radius: value })
  }

  function setDensityMode(value: unknown) {
    const allowed = densityOptions.map((option) => option.value) as readonly DensityMode[]

    if (isOneOf(allowed, value)) {
      updatePlayground({ density: value })
    }
  }

  function resetAppearance() {
    previous.value = {
      mode: currentMode.value,
      primary: currentTheme.value.primary,
      neutral: currentTheme.value.neutral,
      radius: currentTheme.value.radius,
    }

    colorMode.preference = 'system'
    updateAppConfig({
      ui: {
        colors: {
          primary: 'cyan',
          neutral: 'stone',
        },
      },
      playground: {
        surface: 'mist',
        radius: 'md',
        density: 'relaxed',
      },
    })
  }

  return {
    classes,
    currentMode,
    currentTheme,
    exportConfigPreview,
    headerBadges,
    locale,
    localeOptions,
    neutralOptions,
    previous,
    previousNeutral,
    previousPrimary,
    previousRadius,
    primaryOptions,
    radiusOptions,
    selectedNeutral,
    selectedPrimary,
    selectedRadius,
    setDensityMode,
    setLanguage,
    setMode,
    setNeutralPalette,
    setPrimaryPalette,
    setRadiusMode,
    setSurfaceMode,
    slideoverUi,
    surfaceOptions,
    themeModes,
    themeUi,
    densityOptions,
    resetAppearance,
  }
}
