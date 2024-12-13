import { createContext, useContext, type ReactNode } from 'react'

import { usePersistedProjectIdStore } from './persistedState/PersistedProjectId'

const ActiveProjectContext = createContext<string | null>(null)

/**
 * This provider guarantees a projectId in persisted state
 */
export const ActiveProjectContextProvider = ({
	children,
}: {
	children: ReactNode
}) => {
	const projectId = usePersistedProjectIdStore((store) => store.projectId)
	if (!projectId) {
		throw new Error('No Project Id set')
	}
	return (
		<ActiveProjectContext.Provider value={projectId}>
			{children}
		</ActiveProjectContext.Provider>
	)
}

export function useActiveProjectId() {
	const context = useContext(ActiveProjectContext)
	if (!context) {
		throw new Error('no active project')
	}
	return context
}
