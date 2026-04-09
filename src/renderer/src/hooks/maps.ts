import { useEffect, useMemo, useState } from 'react'

export function useNetworkAwareMapStyleUrl(url: string) {
	const [refreshToken, setRefreshToken] = useState<string | undefined>(
		undefined,
	)

	useEffect(
		/**
		 * Update the refresh token when the network goes from disconnected to
		 * connected.
		 */
		function updateRefreshTokenWhenOnline() {
			let timeoutId: number | undefined

			function handleOnOnline() {
				// TODO: Should eventually remove this delay
				// https://github.com/digidem/comapeo-map-server/issues/44
				timeoutId = window.setTimeout(() => {
					setRefreshToken(Date.now().toString())
				}, 3_000)
			}

			window.addEventListener('online', handleOnOnline, { passive: true })

			return () => {
				window.removeEventListener('online', handleOnOnline)
				window.clearTimeout(timeoutId)
				timeoutId = undefined
			}
		},
		[setRefreshToken],
	)

	const result = useMemo(() => {
		if (!refreshToken) {
			return url
		}

		const u = new URL(url)

		// NOTE: There's already a `refresh_token` param on the url from core-react
		// but we want to avoid a situation where we incorrectly override it (e.g. invalidation occurs via write hook).
		// Simplest solution is to just use a different param altogether insted of trying to do something smarter.
		u.searchParams.set('online', refreshToken)

		return u.toString()
	}, [url, refreshToken])

	return result
}
