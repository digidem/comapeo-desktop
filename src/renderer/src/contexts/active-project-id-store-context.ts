import { createContext, use } from 'react'
import { createStore } from 'zustand'

export type ActiveProjectIdStore = ReturnType<typeof createActiveProjectIdStore>
export type ActiveProjectIdState = string | undefined

export function createActiveProjectIdStore(opts?: {
	initialValue: ActiveProjectIdState
}) {
	const store = createStore(() => {
		return opts?.initialValue
	})

	const actions = {
		update: (projectId: string | undefined) => {
			store.setState(projectId, true)
		},
	}

	return { instance: store, actions }
}

const ActiveProjectIdStoreContext = createContext<ActiveProjectIdStore | null>(
	null,
)
export const ActiveProjectIdStoreProvider = ActiveProjectIdStoreContext.Provider

function useActiveProjectIdStore() {
	const value = use(ActiveProjectIdStoreContext)

	if (!value) {
		throw new Error('Must set up ActiveProjectIdStoreProvider first')
	}

	return value
}

export function useActiveProjectIdActions() {
	const store = useActiveProjectIdStore()
	return store.actions
}
