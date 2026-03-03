/// <reference types="network-information-types/dist-types/" />

import { type RuntimeApi } from '../preload/runtime'

declare global {
	// Make changes here whenever you expose new things in the preload/ using exposeInMainWorld
	interface Window {
		runtime: RuntimeApi
	}
}

declare module '@tanstack/react-router' {
	interface StaticDataRouteOption {
		onboardingStepNumber?: 1 | 2
	}
}
