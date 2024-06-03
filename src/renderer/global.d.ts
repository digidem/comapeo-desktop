import type { ClientApi } from 'rpc-reflector/dist/client'

import { runtimeApi } from '../preload/main-window'
import type { MapeoCoreApi } from '../shared'

declare global {
  // Make changes here whenever you expose new things in the preload/ using exposeInMainWorld
  interface Window {
    runtime: typeof runtimeApi

    mapeo: ClientApi<MapeoCoreApi>
  }
}

export {}
