import { computed } from 'vue'

const playgroundPages = [
  {
    id: 'form',
    path: '/form',
    labelKey: 'nav.form',
    descriptionKey: 'nav.formDescription',
    icon: 'i-lucide-clipboard-list',
  },
  {
    id: 'table-remote',
    path: '/table-remote',
    labelKey: 'nav.tableRemote',
    descriptionKey: 'nav.tableRemoteDescription',
    icon: 'i-lucide-database-zap',
  },
  {
    id: 'table-client',
    path: '/table-client',
    labelKey: 'nav.tableClient',
    descriptionKey: 'nav.tableClientDescription',
    icon: 'i-lucide-table-properties',
  },
  {
    id: 'spreadsheet',
    path: '/spreadsheet',
    labelKey: 'nav.spreadsheet',
    descriptionKey: 'nav.spreadsheetDescription',
    icon: 'i-lucide-file-spreadsheet',
  },
] as const

function fallbackTitle(path: string) {
  const segment = path.split('/').filter(Boolean).at(-1)

  if (!segment) return 'Playground'

  return segment
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function usePlaygroundNavigation() {
  const route = useRoute()
  const router = useRouter()
  const { $i18n } = useNuxtApp()

  const homeLink = computed(() => ({
    label: $i18n.t('nav.home'),
    icon: 'i-lucide-house',
    to: '/',
  }))

  const pages = computed(() =>
    playgroundPages.map((page) => ({
      id: page.id,
      label: $i18n.t(page.labelKey),
      description: $i18n.t(page.descriptionKey),
      icon: page.icon,
      to: page.path,
    })),
  )

  const items = computed(() => [homeLink.value])

  const components = computed(() =>
    pages.value.map((page) => ({
      label: page.label,
      icon: page.icon,
      to: page.to,
    })),
  )

  const groups = computed(() => [
    {
      id: 'links',
      items: items.value,
    },
    {
      id: 'components',
      label: $i18n.t('nav.components'),
      items: pages.value.map((page) => ({
        label: page.label,
        icon: page.icon,
        to: page.to,
      })),
    },
  ])

  const currentPage = computed(() => {
    const matchedPage = pages.value.find((page) => page.to === route.path)

    if (matchedPage) return matchedPage

    return {
      id: route.path,
      label: fallbackTitle(route.path),
      description: '',
      icon: 'i-lucide-box',
      to: route.path,
    }
  })

  const pageIndex = computed(() => pages.value.findIndex((page) => page.to === route.path))

  function navigateToPage(index: number) {
    const nextPage = pages.value[index]

    if (!nextPage) return

    void router.push(nextPage.to)
  }

  return {
    components,
    currentPage,
    groups,
    homeLink,
    items,
    navigateToPage,
    pageIndex,
    pages,
    route,
  }
}
