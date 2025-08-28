import { useRef, useSyncExternalStore } from 'react'
import { useClientApi } from '@comapeo/core-react'
import type { PublicPeerInfo } from '@comapeo/core/dist/mapeo-manager'
import { type MapeoClientApi } from '@comapeo/ipc/client.js'
import { isEqual } from 'radashi'

export type LocalPeer = PublicPeerInfo

let localPeerState: ReturnType<typeof createLocalPeerState> | undefined

/**
 * @returns An array of local peers (includes peers that were previously
 *   connected but are no longer connected)
 */
export function useLocalPeers(): Array<LocalPeer> {
	const api = useClientApi()
	if (!localPeerState) {
		localPeerState = createLocalPeerState(api)
	}
	const { subscribe, getSnapshot } = localPeerState
	return useSyncExternalStore(subscribe, getSnapshot)
}

function createLocalPeerState(api: MapeoClientApi) {
	let state: Array<LocalPeer> = []
	let isSubscribedInternal = false
	let error: Error | undefined
	const peersById = new Map<string, LocalPeer>()
	const listeners = new Set<() => void>()

	function subscribeInternal() {
		isSubscribedInternal = true
		api.on('local-peers', onPeers)
		api
			.listLocalPeers()
			.then(onPeers)
			.catch((err) => {
				error = err
				listeners.forEach((listener) => listener())
			})
	}

	function unsubscribeInternal() {
		isSubscribedInternal = false
		api.off('local-peers', onPeers)
	}

	function onPeers(peers: Array<LocalPeer>) {
		error = undefined
		if (!isSubscribedInternal) return
		let stateUpdated = false
		for (const peer of peers) {
			const existing = peersById.get(peer.deviceId)
			const changed = !existing || !isEqual(existing, peer)
			if (changed) {
				peersById.set(peer.deviceId, peer)
				stateUpdated = true
			}
		}
		if (stateUpdated) {
			state = Array.from(peersById.values())
			listeners.forEach((listener) => listener())
		}
	}

	return {
		subscribe(listener: () => void) {
			listeners.add(listener)
			if (!isSubscribedInternal) subscribeInternal()
			return () => {
				listeners.delete(listener)
				if (listeners.size === 0) unsubscribeInternal()
			}
		},
		getSnapshot() {
			if (error) throw error
			return state
		},
	}
}

/**
 * Applies specialized, context-specific behavior on top of `useLocalPeers()` by
 * only including peers that were _initially_ connected from the point of view
 * of the consuming component. If these included peers receive subsequent
 * updates (e.g. disconnecting), they are still returned. This hook only
 * prevents _initially_ returning peers that are disconnected.
 */
export function useInitiallyConnectedPeers() {
	const peers = useLocalPeers()

	// Keeps track of peers who were initially seen as connected
	const relevantDeviceIds = useRef(
		new Set<string>(
			peers.filter((p) => p.status === 'connected').map((p) => p.deviceId),
		),
	)

	return peers.filter((peer) => {
		// We want to keep peers who were initially seen as connected,
		// even if they may no longer be connected.
		if (relevantDeviceIds.current.has(peer.deviceId)) {
			return true
		}

		if (peer.status === 'connected') {
			relevantDeviceIds.current.add(peer.deviceId)
			return true
		}

		return false
	})
}
