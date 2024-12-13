import { createContext, useContext, useState, type ReactNode } from 'react'
import { useStore, type StateCreator } from 'zustand'

import { createPersistedStore } from './createPersistedState'

type ProjectIdSlice = {
	projectId: string | undefined
	setProjectId: (id?: string) => void
}

const projectIdSlice: StateCreator<ProjectIdSlice> = (set) => ({
	projectId: undefined,
	setProjectId: (projectId) => set({ projectId }),
})

const projectIdStore = createPersistedStore(projectIdSlice, 'ActiveProjectId')

const PersistedActiveProjectContext = createContext<
	typeof projectIdStore | null
>(null)

export const PersistedActiveProjectProvider = ({
	children,
}: {
	children: ReactNode
}) => {
	const [store] = useState(() => projectIdStore)

	return (
		<PersistedActiveProjectContext.Provider value={store}>
			{children}
		</PersistedActiveProjectContext.Provider>
	)
}

export function usePersistedProjectIdStore<Selected>(
	selector: (state: ProjectIdSlice) => Selected,
): Selected {
	const store = useContext(PersistedActiveProjectContext)
	if (!store) {
		throw new Error('Missing Persisted Project Id Store')
	}

	return useStore(store, selector)
}
