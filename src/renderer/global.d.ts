import { MapeoClientApi } from '@comapeo/ipc'

import { type RuntimeApi } from '../preload/main-window/runtime'

declare global {
	// Make changes here whenever you expose new things in the preload/ using exposeInMainWorld
	interface Window {
		runtime: RuntimeApi
		comapeo: MapeoClientApi
	}
}
