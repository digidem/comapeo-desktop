import type { MessageDescriptor } from 'react-intl'

import { type RuntimeApi } from '../preload/runtime.js'

declare global {
	// Make changes here whenever you expose new things in the preload/ using exposeInMainWorld
	interface Window {
		runtime: RuntimeApi
	}

	// ---
	// Adjusted vendored version of https://github.com/lacolaco/network-information-types/blob/17d082376d27ee834dc277dfa8e42c9de20440e7/index.d.ts
	// ---

	// W3C Spec Draft http://wicg.github.io/netinfo/
	// Edition: Draft Community Group Report 20 February 2019

	// http://wicg.github.io/netinfo/#navigatornetworkinformation-interface
	interface Navigator {
		readonly connection?: NetworkInformation
	}
	interface WorkerNavigator {
		readonly connection?: NetworkInformation
	}

	// http://wicg.github.io/netinfo/#connection-types
	type ConnectionType =
		| 'bluetooth'
		| 'cellular'
		| 'ethernet'
		| 'mixed'
		| 'none'
		| 'other'
		| 'unknown'
		| 'wifi'
		| 'wimax'

	// http://wicg.github.io/netinfo/#effectiveconnectiontype-enum
	type EffectiveConnectionType = '2g' | '3g' | '4g' | 'slow-2g'

	// http://wicg.github.io/netinfo/#dom-megabit
	type Megabit = number
	// http://wicg.github.io/netinfo/#dom-millisecond
	type Millisecond = number

	// http://wicg.github.io/netinfo/#networkinformation-interface
	interface NetworkInformation extends EventTarget {
		// http://wicg.github.io/netinfo/#type-attribute
		readonly type?: ConnectionType
		// http://wicg.github.io/netinfo/#effectivetype-attribute
		readonly effectiveType?: EffectiveConnectionType
		// http://wicg.github.io/netinfo/#downlinkmax-attribute
		readonly downlinkMax?: Megabit
		// http://wicg.github.io/netinfo/#downlink-attribute
		readonly downlink?: Megabit
		// http://wicg.github.io/netinfo/#rtt-attribute
		readonly rtt?: Millisecond
		// http://wicg.github.io/netinfo/#savedata-attribute
		readonly saveData?: boolean
		// http://wicg.github.io/netinfo/#handling-changes-to-the-underlying-connection
		onchange?: EventListener
	}
}

declare module '@tanstack/react-router' {
	interface StaticDataRouteOption {
		onboardingStepNumber?: 1 | 2
		getNavTitle?: () => MessageDescriptor
	}
}
