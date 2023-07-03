import { contextBridge, ipcRenderer } from 'electron'

// We need to wait until the main world is ready to receive the message before
// sending the port. We create this promise in the preload so it's guaranteed
// to register the onload listener before the load event is fired.
const windowLoaded = new Promise((resolve) => {
  window.onload = resolve
})

export const runtimeApi = {
  // Setup
  init() {
    ipcRenderer.send('request-mapeo-port')
    ipcRenderer.once('provide-mapeo-port', async (event) => {
      await windowLoaded
      window.postMessage('mapeo-port', '*', event.ports)
    })
  },
  // Locale
  async getLocale() {
    const locale = await ipcRenderer.invoke('locale:get')
    if (typeof locale !== 'string') throw Error('Locale must be a string')
    return locale
  },
  updateLocale(l: string) {
    ipcRenderer.send('locale:update', l)
  },
}

contextBridge.exposeInMainWorld('runtime', runtimeApi)
