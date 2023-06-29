import type { ClientApi } from 'rpc-reflector/dist/client'
import type { MapeoCoreApi } from '../shared'

declare global {
  // Make changes here whenever you expose new things in the preload/ using exposeInMainWorld
  interface Window {
    runtime: {
      init: () => Promise<MessagePort[]>
    }

    mapeo: ClientApi<MapeoCoreApi>
  }
}

export {}
