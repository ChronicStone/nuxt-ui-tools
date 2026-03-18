export default defineEventHandler(() => {
  return new Response(HTML, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
})

const HTML = /* html */ `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Query State Devtools</title>
  <style>
    :root {
      --bg: #0a0a0a;
      --bg-card: #141414;
      --bg-hover: #1a1a1a;
      --bg-badge: #1e1e1e;
      --border: #262626;
      --text: #e5e5e5;
      --text-dim: #737373;
      --text-muted: #525252;
      --accent: #22d3ee;
      --accent-dim: #0e7490;
      --green: #4ade80;
      --green-dim: #166534;
      --yellow: #facc15;
      --yellow-dim: #854d0e;
      --red: #f87171;
      --red-dim: #991b1b;
      --purple: #a78bfa;
      --orange: #fb923c;
      --font-mono: 'SF Mono', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace;
      --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: var(--font-sans);
      font-size: 13px;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      overflow-x: hidden;
    }

    /* Layout */
    .shell {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-bottom: 1px solid var(--border);
      background: var(--bg-card);
      flex-shrink: 0;
    }

    .toolbar-title {
      font-weight: 600;
      font-size: 13px;
      color: var(--text);
      margin-right: auto;
    }

    .toolbar-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 500;
      font-family: var(--font-mono);
    }

    .badge-green { background: var(--green-dim); color: var(--green); }
    .badge-yellow { background: var(--yellow-dim); color: var(--yellow); }
    .badge-red { background: var(--red-dim); color: var(--red); }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--bg-card);
      color: var(--text-dim);
      font-size: 11px;
      font-family: var(--font-sans);
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn:hover { background: var(--bg-hover); color: var(--text); border-color: var(--text-muted); }

    .tabs {
      display: flex;
      gap: 0;
      border-bottom: 1px solid var(--border);
      background: var(--bg-card);
      flex-shrink: 0;
    }

    .tab {
      padding: 8px 16px;
      font-size: 12px;
      font-weight: 500;
      color: var(--text-dim);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.15s;
    }
    .tab:hover { color: var(--text); background: var(--bg-hover); }
    .tab.active { color: var(--accent); border-bottom-color: var(--accent); }

    .content {
      flex: 1;
      overflow: auto;
      padding: 16px;
    }

    /* Table */
    .state-table {
      width: 100%;
      border-collapse: collapse;
    }

    .state-table th {
      text-align: left;
      padding: 6px 12px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      background: var(--bg);
    }

    .state-table td {
      padding: 6px 12px;
      border-bottom: 1px solid var(--border);
      font-size: 12px;
      vertical-align: top;
    }

    .state-table tr:hover td { background: var(--bg-hover); }

    .key {
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--accent);
      white-space: nowrap;
    }

    .value {
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--green);
    }

    .value-null {
      color: var(--text-muted);
      font-style: italic;
    }

    .value-input {
      font-family: var(--font-mono);
      font-size: 12px;
      background: var(--bg);
      color: var(--green);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 2px 6px;
      width: 100%;
      min-width: 120px;
    }
    .value-input:focus {
      outline: none;
      border-color: var(--accent);
    }

    /* Timeline */
    .timeline {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .timeline-entry {
      display: grid;
      grid-template-columns: 80px 140px 1fr 60px;
      gap: 8px;
      align-items: center;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-family: var(--font-mono);
    }
    .timeline-entry:hover { background: var(--bg-hover); }

    .timeline-time { color: var(--text-muted); font-size: 11px; }
    .timeline-key { color: var(--accent); }
    .timeline-value { color: var(--green); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .timeline-mode { font-size: 10px; }
    .mode-push { color: var(--orange); }
    .mode-replace { color: var(--purple); }

    /* Stats */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
    }

    .stat-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 4px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      font-family: var(--font-mono);
      color: var(--text);
    }

    /* Connection */
    .disconnected {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      color: var(--text-dim);
      flex-direction: column;
      gap: 8px;
    }
    .disconnected .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Section header */
    .section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 12px;
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: var(--text-muted);
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div id="app" class="shell">
    <!-- Disconnected state -->
    <div class="disconnected" v-if="!connected">
      <div class="spinner"></div>
      <div>Connecting to host app...</div>
    </div>

    <!-- Connected state -->
    <template v-else>
      <div class="toolbar">
        <div class="toolbar-title">Query State Inspector</div>
        <span class="toolbar-badge badge-green">{{ cacheSize }} cached</span>
        <span class="toolbar-badge badge-yellow" v-if="state.pendingUpdates.length">{{ state.pendingUpdates.length }} pending</span>
        <span class="toolbar-badge" style="background:#1e1e2e;color:var(--purple)">{{ state.subscriberCount }} subs</span>
        <button class="btn" @click="refresh">Refresh</button>
        <button class="btn" @click="clearCache" style="color:var(--red)">Clear Cache</button>
      </div>

      <div class="tabs">
        <div class="tab" :class="{ active: activeTab === 'state' }" @click="activeTab = 'state'">State</div>
        <div class="tab" :class="{ active: activeTab === 'cache' }" @click="activeTab = 'cache'">Cache</div>
        <div class="tab" :class="{ active: activeTab === 'timeline' }" @click="activeTab = 'timeline'">
          Timeline
          <span v-if="state.mutationLog.length" style="margin-left:4px;font-size:10px;color:var(--text-muted)">({{ state.mutationLog.length }})</span>
        </div>
      </div>

      <div class="content">
        <!-- State Tab -->
        <div v-if="activeTab === 'state'">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Cache Entries</div>
              <div class="stat-value">{{ cacheSize }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Subscribers</div>
              <div class="stat-value">{{ state.subscriberCount }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Mutations</div>
              <div class="stat-value">{{ state.mutationLog.length }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Route Params</div>
              <div class="stat-value">{{ routeParamCount }}</div>
            </div>
          </div>

          <div class="section-title">Current Route Query</div>
          <table class="state-table">
            <thead>
              <tr>
                <th style="width:200px">Key</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="[key, value] in routeEntries" :key="key">
                <td><span class="key">{{ key }}</span></td>
                <td><span class="value">{{ value }}</span></td>
              </tr>
              <tr v-if="!routeEntries.length">
                <td colspan="2" class="empty-state">No query parameters in URL</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Cache Tab -->
        <div v-if="activeTab === 'cache'">
          <table class="state-table">
            <thead>
              <tr>
                <th style="width:200px">Key</th>
                <th>Cached Value</th>
                <th style="width:200px">Edit</th>
                <th style="width:60px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="[key, value] in cacheEntries" :key="key">
                <td><span class="key">{{ key }}</span></td>
                <td>
                  <span v-if="value === null" class="value-null">null</span>
                  <span v-else class="value">{{ value }}</span>
                </td>
                <td>
                  <input
                    class="value-input"
                    :value="value ?? ''"
                    @keydown.enter="setParam(key, $event.target.value)"
                    placeholder="Enter value..."
                  />
                </td>
                <td>
                  <button class="btn" @click="removeParam(key)" style="color:var(--red);font-size:10px;padding:2px 6px">✕</button>
                </td>
              </tr>
              <tr v-if="!cacheEntries.length">
                <td colspan="4" class="empty-state">Cache is empty</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Timeline Tab -->
        <div v-if="activeTab === 'timeline'">
          <div v-if="!state.mutationLog.length" class="empty-state">
            No mutations recorded yet. Interact with the app to see mutations here.
          </div>
          <div class="timeline" v-else>
            <div class="timeline-entry" v-for="(entry, i) in reversedLog" :key="i">
              <span class="timeline-time">{{ formatTime(entry.timestamp) }}</span>
              <span class="timeline-key">{{ entry.key }}</span>
              <span class="timeline-value">
                <span v-if="entry.value === null" class="value-null">null (removed)</span>
                <span v-else>{{ entry.value }}</span>
              </span>
              <span class="timeline-mode" :class="'mode-' + entry.historyMode">{{ entry.historyMode }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>

  <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
  <script>
    const CHANNEL_NAME = '__query-state-devtools__'
    const { createApp, ref, computed, onMounted, onUnmounted } = Vue

    createApp({
      setup() {
        const connected = ref(false)
        const activeTab = ref('state')
        const state = ref({
          cache: {},
          pendingUpdates: [],
          subscriberCount: 0,
          mutationLog: [],
          routeQuery: {},
        })

        let channel = null
        let requestInterval = null

        function handleMessage(event) {
          const { type, payload } = event.data ?? {}
          if (type === 'state' && payload) {
            state.value = payload
            if (!connected.value) connected.value = true
          }
        }

        function send(msg) {
          if (channel) channel.postMessage(msg)
        }

        function refresh() {
          send({ type: 'request-state' })
        }

        function setParam(key, value) {
          send({ type: 'set', key, value: value || null })
        }

        function removeParam(key) {
          send({ type: 'remove', key })
        }

        function clearCache() {
          send({ type: 'clear-cache' })
        }

        function formatTime(ts) {
          const d = new Date(ts)
          return d.toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })
        }

        onMounted(() => {
          channel = new BroadcastChannel(CHANNEL_NAME)
          channel.onmessage = handleMessage

          // Request initial state, and keep requesting until connected
          refresh()
          requestInterval = setInterval(() => {
            if (!connected.value) refresh()
            else clearInterval(requestInterval)
          }, 500)
        })

        onUnmounted(() => {
          if (channel) channel.close()
          if (requestInterval) clearInterval(requestInterval)
        })

        const cacheEntries = computed(() =>
          Object.entries(state.value.cache).sort(([a], [b]) => a.localeCompare(b))
        )
        const cacheSize = computed(() => cacheEntries.value.length)
        const routeEntries = computed(() =>
          Object.entries(state.value.routeQuery).sort(([a], [b]) => a.localeCompare(b))
        )
        const routeParamCount = computed(() => routeEntries.value.length)
        const reversedLog = computed(() => [...state.value.mutationLog].reverse())

        return {
          connected, activeTab, state,
          cacheEntries, cacheSize, routeEntries, routeParamCount, reversedLog,
          refresh, setParam, removeParam, clearCache, formatTime,
        }
      },
    }).mount('#app')
  </script>
</body>
</html>`
