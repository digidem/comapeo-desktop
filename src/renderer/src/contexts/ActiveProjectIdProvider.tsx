import { createContext, type ReactNode } from 'react'
import { createStore, type StoreApi } from 'zustand'
import { persist as zustandPersist } from 'zustand/middleware'

import { createHooks } from './createStoreHooks'

const PERSISTED_ACTIVE_PROJECT_ID_KEY = 'ActiveProjectId'

type ActiveProjectId = { activeProjectId: string | undefined }

const initialActiveProjectId: ActiveProjectId = {
	activeProjectId: undefined,
}

type ActiveProjectIdStore = ReturnType<typeof createActiveProjectIdStore>

type ActiveProjectIdProviderProps = {
	children: ReactNode
	store: ActiveProjectIdStore
}

const ActiveProjectIdContext = createContext<ActiveProjectIdStore | null>(null)

export const ActiveProjectIdProvider = ({
	children,
	store,
}: ActiveProjectIdProviderProps) => {
	return (
		<ActiveProjectIdContext value={store}>{children}</ActiveProjectIdContext>
	)
}

const { useStoreActions, useStoreState } = createHooks(ActiveProjectIdContext)

export {
	useStoreActions as useActiveProjectIdStoreActions,
	useStoreState as useActiveProjectIdStoreState,
}

export function createActiveProjectIdStore({ persist }: { persist: boolean }) {
	let store: StoreApi<ActiveProjectId>

	if (!persist) {
		store = createStore(() => initialActiveProjectId)
	} else {
		store = createStore(
			zustandPersist(() => initialActiveProjectId, {
				name: PERSISTED_ACTIVE_PROJECT_ID_KEY,
			}),
		)
	}

	const actions = {
		setActiveProjectId: (newProjectId: string) =>
			store.setState({ activeProjectId: newProjectId }),
	}

	return { store, actions }
}
