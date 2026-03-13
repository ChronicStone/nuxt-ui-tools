import { computed } from 'vue'

export function usePlaygroundNavigation() {
  const route = useRoute()
  const localePath = useLocalePath()

  const links = computed(() => {
    return [
      {
        to: localePath('/'),
        key: 'nav.overview',
        descriptionKey: 'nav.overviewDescription',
      },
      {
        to: localePath('/form'),
        key: 'nav.form',
        descriptionKey: 'nav.formDescription',
      },
      {
        to: localePath('/table-v2'),
        key: 'nav.table',
        descriptionKey: 'nav.tableDescription',
      },
      {
        to: localePath('/lab'),
        key: 'nav.lab',
        descriptionKey: 'nav.labDescription',
      },
    ]
  })

  const currentSection = computed(() => {
    return links.value.find((link) => link.to === route.path)
  })

  return {
    route,
    links,
    currentSection,
  }
}
