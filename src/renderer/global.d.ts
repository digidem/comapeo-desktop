import { MapeoClientApi } from '@mapeo/ipc'

import { runtimeApi } from '../preload/main-window'

declare global {
  // Make changes here whenever you expose new things in the preload/ using exposeInMainWorld
  interface Window {
    runtime: typeof runtimeApi

    mapeo: MapeoClientApi
  }
}

export {}
