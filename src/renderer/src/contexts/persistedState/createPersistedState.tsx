import { createContext, useContext, useState, type ReactNode } from 'react'
import { createStore, useStore, type StateCreator } from 'zustand'
import { persist } from 'zustand/middleware'

type PersistedStoreKey = 'ActiveProjectId'

/**
 * @param slice The shape of you store including it inital values
 * @param persistedStoreKey A string used by local storage to index your store
 *   (must strongly typed in `type PersistedStoreKey`)
 *
 * @returns A Provider to be used by the app, a hook to consume a provider, and
 *   a context and non persisted store that can be used for testing
 */
export function createPersistedStoreWithProvider<T>(
	slice: StateCreator<T>,
	persistedStoreKey: PersistedStoreKey,
) {
	const persistedStore = createPersistedStore(slice, persistedStoreKey)
	// used for testing and injecting values into testing environment
	const nonPersistedStore = createStore(slice)
	// type persistedStore is a subset type of type nonPersistedStore
	const Context = createContext<typeof nonPersistedStore | null>(null)

	const Provider = ({ children }: { children: ReactNode }) => {
		const [storeInstance] = useState(() => persistedStore)

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

	return { Provider, useStoreHook, Context, nonPersistedStore }
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
