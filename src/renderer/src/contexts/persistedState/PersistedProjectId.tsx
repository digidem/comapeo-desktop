import { createPersistedStoreWithProvider } from './createPersistedState'

type PersistedProjectId = { projectId: string }

const {
	Provider: PersistedProjectIdProvider,
	createStore: createProjectIdStore,
	useCurrentStore: usePersistedProjectIdStore,
	useActions: usePersistedProjectIdActions,
} = createPersistedStoreWithProvider<PersistedProjectId>({
	slice: { projectId: 'newId' },
	actions: {
		setProjectId: (newProjectId: string) => (set) => {
			set({ projectId: newProjectId })
		},
	},
	persistedStoreKey: 'ActiveProjectId',
})

export {
	PersistedProjectIdProvider,
	createProjectIdStore,
	usePersistedProjectIdStore,
	usePersistedProjectIdActions,
}
