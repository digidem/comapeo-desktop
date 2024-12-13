import { createStore, type StateCreator } from 'zustand'
import { persist } from 'zustand/middleware'

type PersistedStoreKey = 'ActiveProjectId'

export function createPersistedStore<T>(
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
