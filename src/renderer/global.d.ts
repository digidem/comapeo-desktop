import type { ClientApi } from 'rpc-reflector'

import { runtimeApi } from '../preload/main-window'
import type { MapeoCoreApi } from '../service/mapeo-core'

declare global {
  // Make changes here whenever you expose new things in the preload/ using exposeInMainWorld
  interface Window {
    runtime: typeof runtimeApi

    mapeo: ClientApi<MapeoCoreApi>
  }
}

export {}
