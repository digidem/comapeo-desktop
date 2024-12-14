import { type StateCreator } from 'zustand'

import { createPersistedStoreWithProvider } from './createPersistedState'

type ProjectIdSlice = {
	projectId: string | undefined
	setProjectId: (id?: string) => void
}

const projectIdSlice: StateCreator<ProjectIdSlice> = (set) => ({
	projectId: undefined,
	setProjectId: (projectId) => set({ projectId }),
})

export const {
	Provider: PersistedProjectIdProvider,
	useStoreHook: usePersistedProjectIdStore,
	Context: PersistedProjectIdContext,
	nonPersistedStore: nonPersistedProjectIdStore,
} = createPersistedStoreWithProvider(projectIdSlice, 'ActiveProjectId')
