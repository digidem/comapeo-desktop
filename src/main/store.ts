import Store from 'electron-store'

import { getDevUserDataPath, isDevMode } from './utils'

export const store = new Store<{ locale: string }>({
  cwd: isDevMode() ? getDevUserDataPath() : undefined,
  schema: {
    locale: {
      type: 'string',
      default: 'en',
    },
  },
})
