import { useEffect, useEffectEvent, useMemo, useState } from 'react'

export function useNetworkAwareMapStyleUrl(url: string) {
	const [refreshToken, setRefreshToken] = useState<string | undefined>(
		undefined,
	)

	const handleOnOnline = useEffectEvent(() => {
		setRefreshToken(Date.now().toString())
	})

	useEffect(
		/**
		 * Update the refresh token when the network goes from disconnected to
		 * connected.
		 */
		function updateRefreshTokenWhenOnline() {
			window.addEventListener('online', handleOnOnline, { passive: true })

			return () => {
				window.removeEventListener('online', handleOnOnline)
			}
		},
		[],
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
