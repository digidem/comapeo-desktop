import { createContext, useContext, useState, type ReactNode } from 'react'
import { createStore, useStore, type StateCreator } from 'zustand'
import { persist } from 'zustand/middleware'

type PersistedStoreKey = 'ActiveProjectId'

export function createPersistedStoreWithProvider<T>(
	slice: StateCreator<T>,
	persistedStoreKey: PersistedStoreKey,
) {
	const store = createPersistedStore(slice, persistedStoreKey)
	const Context = createContext<typeof store | null>(null)

	const Provider = ({ children }: { children: ReactNode }) => {
		const [storeInstance] = useState(() => store)

		return <Context.Provider value={storeInstance}>{children}</Context.Provider>
	}

	const useStoreHook = <Selected,>(
		selector: (state: T) => Selected,
	): Selected => {
		const contextStore = useContext(Context)
		if (!contextStore) {
			throw new Error(
				`Missing provider for persisted store: ${persistedStoreKey}`,
			)
		}

		return useStore(contextStore, selector)
	}

	return { Provider, useStoreHook }
}

function createPersistedStore<T>(
	...args: Parameters<typeof createPersistMiddleware<T>>
) {
	const store = createStore<T>()(createPersistMiddleware(...args))
	store.setState((state) => ({
		...state,
		...args[0],
	}))

	return store
}

function createPersistMiddleware<State>(
	slice: StateCreator<State>,
	persistedStoreKey: PersistedStoreKey,
) {
	return persist(slice, {
		name: persistedStoreKey,
	})
}
