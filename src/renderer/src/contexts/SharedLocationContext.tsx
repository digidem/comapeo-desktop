import React, { createContext, useContext, useEffect, useState } from 'react'

interface Location {
	coords: {
		latitude: number
		longitude: number
	}
}
interface SharedLocationContextValue {
	location: Location | null
	error: Error | null
	isLoading: boolean
}

const SharedLocationContext = createContext<SharedLocationContextValue | null>(
	null,
)

export const SharedLocationContextProvider = ({
	children,
}: {
	children: React.ReactNode
}) => {
	const [location, setLocation] = useState<Location | null>(null)
	const [error, setError] = useState<Error | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		async function fetchLocation() {
			setIsLoading(true)

			if ('geolocation' in navigator) {
				navigator.geolocation.getCurrentPosition(
					(pos) => {
						setLocation({
							coords: {
								latitude: pos.coords.latitude,
								longitude: pos.coords.longitude,
							},
						})
						setIsLoading(false)
					},
					(err) => {
						console.warn('Geolocation failed, fallback to IP-based:', err)
						fetchIPLocation()
					},
					{ timeout: 5000 },
				)
			} else {
				fetchIPLocation()
			}
		}

		async function fetchIPLocation() {
			try {
				const res = await fetch('https://ipapi.co/json/')
				if (!res.ok) throw new Error('IP geolocation request failed')
				const data = await res.json()
				if (data && data.latitude && data.longitude) {
					setLocation({
						coords: { latitude: data.latitude, longitude: data.longitude },
					})
				} else {
					setError(new Error('Could not retrieve IP-based location'))
				}
			} catch (e: unknown) {
				setError(e as Error)
			} finally {
				setIsLoading(false)
			}
		}

		fetchLocation()
	}, [])

	return (
		<SharedLocationContext.Provider value={{ location, error, isLoading }}>
			{children}
		</SharedLocationContext.Provider>
	)
}

export function useSharedLocationContext() {
	const context = useContext(SharedLocationContext)
	if (!context) {
		throw new Error(
			'useSharedLocationContext must be used within a SharedLocationContextProvider',
		)
	}
	return context
}
