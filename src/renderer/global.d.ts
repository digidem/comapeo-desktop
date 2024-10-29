import { type RuntimeApi } from '../preload/runtime'

declare global {
	// Make changes here whenever you expose new things in the preload/ using exposeInMainWorld
	interface Window {
		runtime: RuntimeApi
	}
}
