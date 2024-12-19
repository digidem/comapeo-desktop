import { createContext, useContext, type ReactNode } from 'react'

import { useActiveProjectIdStoreState } from './ActiveProjectIdProvider'

const GuaranteedActiveProjectIdContext = createContext<string | null>(null)

export const GuaranteedActiveProjectIdProvider = ({
	children,
}: {
	children: ReactNode
}) => {
	const activeProjectId = useActiveProjectIdStoreState(
		(store) => store.activeProjectId,
	)

	if (!activeProjectId) {
		throw new Error('No active project ID')
	}

	return (
		<GuaranteedActiveProjectIdContext.Provider value={activeProjectId}>
			{children}
		</GuaranteedActiveProjectIdContext.Provider>
	)
}

export const useGuaranteedActiveProjectId = () => {
	const context = useContext(GuaranteedActiveProjectIdContext)
	if (!context) {
		throw new Error(
			'useGuaranteedActiveProjectId must be used within a GuaranteedActiveProjectIdProvider',
		)
	}
	return context
}
