import { createContext, use } from 'react'
import { createStore, useStore } from 'zustand'

export type GlobalEditingStateStore = ReturnType<
	typeof createGlobalEditingStateStore
>

export type GlobalEditingState = {
	activeEdits: Array<string>
}

export function createGlobalEditingStateStore() {
	const store = createStore<GlobalEditingState>(() => {
		return { activeEdits: [] }
	})

	const actions = {
		add: (value: string) => {
			store.setState((prev) => ({ activeEdits: [...prev.activeEdits, value] }))
		},
		remove: (value: string) => {
			store.setState((prev) => ({
				activeEdits: prev.activeEdits.filter((e) => e !== value),
			}))
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

function activeEditsSelector(state: GlobalEditingState) {
	return state.activeEdits
}

export function useGlobalEditingState(): GlobalEditingState['activeEdits'] {
	const store = useGlobalEditingStateStore()
	return useStore(store.instance, activeEditsSelector)
}

export function useGlobalEditingStateActions() {
	const store = useGlobalEditingStateStore()
	return store.actions
}
