import { useEffect, useRef, useSyncExternalStore } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { isEqual } from 'radashi'

import { getWifiConnectionsOptions } from '../lib/queries/system'

function createNetworkChangeSubscriber(callback: () => void) {
	window.addEventListener('online', callback, { passive: true })
	window.addEventListener('offline', callback, { passive: true })

	if (navigator.connection) {
		navigator.connection.addEventListener('change', callback, { passive: true })
	} else {
		console.warn('navigator.connection is not available')
	}

	return () => {
		window.removeEventListener('online', callback)
		window.removeEventListener('offline', callback)

		if (navigator.connection) {
			navigator.connection.removeEventListener('change', callback)
		} else {
			console.warn('navigator.connection is not available')
		}
	}
}

export function useNetworkConnectionChangeListener() {
	const queryClient = useQueryClient()

	useEffect(() => {
		const wifiConnectionsQueryKey = getWifiConnectionsOptions().queryKey

		const unsubscribe = createNetworkChangeSubscriber(() => {
			queryClient.invalidateQueries({
				queryKey: wifiConnectionsQueryKey,
			})
		})

		return () => {
			unsubscribe()
		}
	}, [queryClient])
}

type NetworkInformationReadableFields = Pick<
	NetworkInformation,
	'type' | 'effectiveType' | 'downlink' | 'downlinkMax' | 'rtt' | 'saveData'
>

export type BrowserNetInfo = NetworkInformationReadableFields & {
	online: boolean
}

export function useBrowserNetInfo(): BrowserNetInfo {
	const cache = useRef<BrowserNetInfo>({
		...getConnectionFields(),
		online: navigator.onLine,
	})

	return useSyncExternalStore(createNetworkChangeSubscriber, () => {
		const nextState = {
			...getConnectionFields(),
			online: navigator.onLine,
		}

		if (isEqual(cache.current, nextState)) {
			return cache.current
		} else {
			cache.current = nextState
			return nextState
		}
	})
}

function getConnectionFields(): NetworkInformationReadableFields {
	const { connection } = navigator

	return {
		downlink: connection?.downlink,
		downlinkMax: connection?.downlinkMax,
		effectiveType: connection?.effectiveType,
		rtt: connection?.rtt,
		saveData: connection?.saveData,
		type: connection?.type,
	}
}
