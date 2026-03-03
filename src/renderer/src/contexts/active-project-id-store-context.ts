import { createContext, use } from 'react'
import { createStore, useStore } from 'zustand'

export type ActiveProjectIdStore = ReturnType<typeof createActiveProjectIdStore>

export function createActiveProjectIdStore(opts?: { initialValue?: string }) {
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

export function useActiveProjectId() {
	const { instance } = useActiveProjectIdStore()
	return useStore(instance)
}

export function useActiveProjectIdActions() {
	const store = useActiveProjectIdStore()
	return store.actions
}
