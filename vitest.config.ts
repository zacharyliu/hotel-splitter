import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config'

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        miniflare: {
          // Minimal config for unit tests - we don't need the full worker runtime
          // for testing pure calculation functions
          compatibilityDate: '2025-11-09',
        },
      },
    },
  },
})



