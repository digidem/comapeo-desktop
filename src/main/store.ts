import path from 'node:path'
import Store from 'electron-store'

export const store = new Store<{
  projectName: string
  projectSuffix: string
  configName: string
  locale: string
}>({
  cwd: import.meta.env.DEV ? path.resolve(__dirname, '../../data') : undefined,
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
