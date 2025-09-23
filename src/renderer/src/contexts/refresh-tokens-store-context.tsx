import { createContext, use } from 'react'
import { createStore, useStore } from 'zustand'

export type RefreshTokensStore = ReturnType<typeof createRefreshTokensStore>

export type RefreshTokensState = { maps: string }

export function createRefreshTokensStore(opts?: {
	initialValue: RefreshTokensState
}) {
	const store = createStore<RefreshTokensState>(() => {
		return opts?.initialValue || { maps: Date.now().toString() }
	})

	const actions = {
		update: (key: keyof RefreshTokensState) => {
			store.setState({ [key]: Date.now().toString() })
		},
	}

	return { instance: store, actions }
}

const RefreshTokensStoreContext = createContext<RefreshTokensStore | null>(null)
export const RefreshTokensStoreProvider = RefreshTokensStoreContext.Provider

function useRefreshTokensStore() {
	const value = use(RefreshTokensStoreContext)

	if (!value) {
		throw new Error('Must set up RefreshTokensStoreProvider first')
	}

	return value
}

export function useRefreshTokensState(): RefreshTokensState
export function useRefreshTokensState<T>(
	selector: (state: RefreshTokensState) => T,
): T
export function useRefreshTokensState<T>(
	selector?: (state: RefreshTokensState) => T,
) {
	const store = useRefreshTokensStore()
	return useStore(store.instance, selector!)
}

export function useRefreshTokensActions() {
	const store = useRefreshTokensStore()
	return store.actions
}
