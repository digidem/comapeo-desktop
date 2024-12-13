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
} = createPersistedStoreWithProvider(projectIdSlice, 'ActiveProjectId')

// export const PersistedProjectIdProvider = ({
// 	children,
// }: {
// 	children: ReactNode
// }) => {
// 	const [store] = useState(() => projectIdStore)

// 	return (
// 		<PersistedProjectIdContext.Provider value={store}>
// 			{children}
// 		</PersistedProjectIdContext.Provider>
// 	)
// }

// export function usePersistedProjectIdStore<Selected>(
// 	selector: (state: ProjectIdSlice) => Selected,
// ): Selected {
// 	const store = useContext(PersistedProjectIdContext)
// 	if (!store) {
// 		throw new Error('Missing Persisted Project Id Store')
// 	}

// 	return useStore(store, selector)
// }
