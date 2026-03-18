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
        to: localePath('/table-client'),
        key: 'nav.tableClient',
        descriptionKey: 'nav.tableClientDescription',
      },
      {
        to: localePath('/table-remote'),
        key: 'nav.tableRemote',
        descriptionKey: 'nav.tableRemoteDescription',
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
