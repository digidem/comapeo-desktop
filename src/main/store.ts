import Store from 'electron-store'

import { getUserDataPath, isDevMode } from './utils'

export const store = new Store<{
  projectName: string
  projectSuffix: string
  configName: string
  locale: string
}>({
  cwd: isDevMode() ? getUserDataPath() : undefined,
  schema: {
    projectName: {
      type: 'string',
      default: 'Mapeo',
    },
    projectSuffix: {
      type: 'string',
      default: '',
    },
    configName: {
      type: 'string',
      default: 'mapeo-settings',
    },
    locale: {
      type: 'string',
      default: 'en',
    },
  },
})
