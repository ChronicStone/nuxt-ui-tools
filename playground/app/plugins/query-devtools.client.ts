import { QueryStateClient, registerQueryStateClient } from '#query-state'

const CHANNEL_NAME = '__query-state-devtools__'

export default defineNuxtPlugin(() => {
  const router = useRouter()

  const client = new QueryStateClient({ router })
  registerQueryStateClient(router, client)

  router.afterEach(() => {
    client.syncFromRoute()
  })

  // --- Devtools bridge via BroadcastChannel ---
  const channel = new BroadcastChannel(CHANNEL_NAME)

  function broadcastState() {
    channel.postMessage({ type: 'state', payload: client.__devtools__() })
  }

  // Push state on every mutation
  client.onDevtoolsUpdate(broadcastState)

  // Also push on route changes (catches back/forward)
  router.afterEach(() => {
    setTimeout(broadcastState, 50)
  })

  // Listen for commands from the devtools iframe
  channel.onmessage = (event) => {
    const { type, key, value } = event.data ?? {}

    if (type === 'request-state') {
      broadcastState()
    }

    if (type === 'set') {
      client.set(key, value || null, 'replace')
      setTimeout(broadcastState, 50)
    }

    if (type === 'remove') {
      client.set(key, null, 'replace')
      setTimeout(broadcastState, 50)
    }

    if (type === 'clear-cache') {
      client.clear()
      setTimeout(broadcastState, 50)
    }
  }

  // Send initial state
  broadcastState()
})
