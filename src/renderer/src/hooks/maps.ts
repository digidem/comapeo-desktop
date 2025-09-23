import { useEffect } from 'react'

import {
	useRefreshTokensActions,
	useRefreshTokensState,
	type RefreshTokensState,
} from '../contexts/refresh-tokens-store-context'

function mapsRefreshTokenSelector(state: RefreshTokensState) {
	return state.maps
}

export function useMapsRefreshToken() {
	const { update } = useRefreshTokensActions()

	useEffect(
		/**
		 * Update the refresh token when the network goes from disconnected to
		 * connected.
		 */
		function updateMapRefreshTokenWhenOnline() {
			function onChange() {
				update('maps')
			}

			window.addEventListener('online', onChange, { passive: true })

			return () => {
				window.removeEventListener('online', onChange)
			}
		},
		[update],
	)

	return useRefreshTokensState(mapsRefreshTokenSelector)
}
