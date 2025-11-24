import { createContext, use } from 'react'
import { createStore, useStore } from 'zustand'

export type GlobalEditingStateStore = ReturnType<
	typeof createGlobalEditingStateStore
>

export type GlobalEditingState = boolean

export function createGlobalEditingStateStore(opts?: {
	initialValue: GlobalEditingState
}) {
	const store = createStore<GlobalEditingState>(() => {
		return !!opts?.initialValue
	})

	const actions = {
		update: (value: GlobalEditingState) => {
			store.setState(value)
		},
	}

	return { instance: store, actions }
}

const GlobalEditingStateStoreContext =
	createContext<GlobalEditingStateStore | null>(null)
export const GlobalEditingStateStoreProvider =
	GlobalEditingStateStoreContext.Provider

function useGlobalEditingStateStore() {
	const value = use(GlobalEditingStateStoreContext)

	if (!value) {
		throw new Error('Must set up GlobalEditingStateStoreProvider first')
	}

	return value
}

export function useGlobalEditingState(): GlobalEditingState {
	const store = useGlobalEditingStateStore()
	return useStore(store.instance)
}

export function useGlobalEditingStateActions() {
	const store = useGlobalEditingStateStore()
	return store.actions
}
