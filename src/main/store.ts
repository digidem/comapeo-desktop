import Store from 'electron-store'

import { getUserDataPath, isDevMode } from './utils'

export const store = new Store<{ locale: string }>({
  cwd: isDevMode() ? getUserDataPath() : undefined,
  schema: {
    locale: {
      type: 'string',
      default: 'en',
    },
  },
})
