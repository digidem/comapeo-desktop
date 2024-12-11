import { createContext, useContext, type PropsWithChildren } from 'react'
import { type MapeoClientApi } from '@comapeo/ipc'

const ApiContext = createContext<MapeoClientApi | null>(null)

export const ApiProvider = ({
	client,
	children,
}: PropsWithChildren<{ client: MapeoClientApi }>) => {
	return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>
}

export function useApi() {
	const api = useContext(ApiContext)

	if (!api) throw new Error('MapeoApiContext provider needs to be set up')

	return api
}
