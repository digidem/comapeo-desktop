import { createContext, use } from 'react'
import type { PublicPeerInfo } from '@comapeo/core/dist/mapeo-manager'
import { type MapeoClientApi } from '@comapeo/ipc/client.js'
import { captureException } from '@sentry/react'
import { isEqual } from 'radashi'
import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

/**
 * Local peers (includes peers that were previously connected but are no longer
 * connected)
 */
export type LocalPeersState = Array<PublicPeerInfo>

export function createLocalPeersStore({
	clientApi,
}: {
	clientApi: MapeoClientApi
}) {
	const instance = createStore<LocalPeersState>(() => {
		return []
	})

	let isSubscribed = false
	const peersById = new Map<string, PublicPeerInfo>()

	function onPeers(peers: Array<PublicPeerInfo>) {
		if (!isSubscribed) return

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
			instance.setState(Array.from(peersById.values()), true)
		}
	}

	const actions = {
		subscribe: () => {
			isSubscribed = true

			clientApi
				.listLocalPeers()
				.then(onPeers)
				.catch((err) => {
					captureException(err)
				})

			clientApi.on('local-peers', onPeers)
		},
		unsubscribe: () => {
			isSubscribed = false

			clientApi.off('local-peers', onPeers)
		},
	}

	return { instance, actions }
}

export type LocalPeersStore = ReturnType<typeof createLocalPeersStore>

const LocalPeersStoreContext = createContext<LocalPeersStore | null>(null)
export const LocalPeersStoreProvider = LocalPeersStoreContext.Provider

function useLocalPeersStore() {
	const value = use(LocalPeersStoreContext)

	if (!value) {
		throw new Error('Must set up LocalPeersStoreProvider first')
	}

	return value
}

export function useLocalPeersState(): LocalPeersState
export function useLocalPeersState<T>(
	selector: (state: LocalPeersState) => T,
): T
export function useLocalPeersState<T>(
	selector?: (state: LocalPeersState) => T,
) {
	const store = useLocalPeersStore()
	return useStore(store.instance, selector!)
}

export function useLocalPeersActions() {
	const store = useLocalPeersStore()
	return store.actions
}
