import { createPersistedStoreWithProvider } from './createPersistedState'

type PersistedActiveProjectId = { projectId: string }

const { Provider, createStore, useCurrentStore, useActions } =
	createPersistedStoreWithProvider<PersistedActiveProjectId>({
		slice: { projectId: 'newId' },
		actions: {
			setProjectId: (newProjectId: string) => (set) => {
				set({ projectId: newProjectId })
			},
		},
		persistedStoreKey: 'ActiveProjectId',
	})

export {
	Provider as PersistedActiveProjectIdProvider,
	createStore as createActiveProjectIdStore,
	useCurrentStore as usePersistedActiveProjectIdStore,
	useActions as usePersistedActiveProjectIdActions,
}
