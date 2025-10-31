import { useState } from 'react'

import { useLocalPeersState } from '../contexts/local-peers-store-context'

/**
 * Applies specialized, context-specific behavior on top of `useLocalPeers()` by
 * only including peers that were _initially_ connected from the point of view
 * of the consuming component. If these included peers receive subsequent
 * updates (e.g. disconnecting), they are still returned. This hook only
 * prevents _initially_ returning peers that are disconnected.
 */
export function useInitiallyConnectedPeers() {
	const peers = useLocalPeersState()

	// Keeps track of peers who were initially seen as connected
	// eslint-disable-next-line @eslint-react/naming-convention/use-state
	const [relevantDeviceIds] = useState(() => {
		return new Set<string>(
			peers.filter((p) => p.status === 'connected').map((p) => p.deviceId),
		)
	})

	return peers.filter((peer) => {
		// We want to keep peers who were initially seen as connected,
		// even if they may no longer be connected.
		if (relevantDeviceIds.has(peer.deviceId)) {
			return true
		}

		if (peer.status === 'connected') {
			relevantDeviceIds.add(peer.deviceId)
			return true
		}

		return false
	})
}
