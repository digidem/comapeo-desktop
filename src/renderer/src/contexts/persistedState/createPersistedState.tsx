import { createContext, useContext, type ReactNode } from 'react'
import {
	createStore as createZustandStore,
	useStore,
	type StateCreator,
	type StoreApi,
} from 'zustand'
import { persist } from 'zustand/middleware'

type PersistedStoreKey = 'ActiveProjectId'

/**
 * Follows the pattern of injecting persisted state with a context. See
 * https://tkdodo.eu/blog/zustand-and-react-context. Allows for easier testing
 */
export function createPersistedStoreWithProvider<T>({
	slice,
	actions,
	persistedStoreKey,
}: {
	slice: T
	actions: StoreActions<T>
	persistedStoreKey: PersistedStoreKey
}) {
	const Context = createContext<ReturnType<typeof createStore<T>> | null>(null)

	const Provider = ({
		children,
		store,
	}: {
		children: ReactNode
		store: ReturnType<typeof createStore<T>>
	}) => {
		return <Context.Provider value={store}>{children}</Context.Provider>
	}

	function useCurrentContext() {
		const context = useContext(Context)
		if (!context) {
			throw new Error(`${persistedStoreKey} context not properly initialized`)
		}
		return context
	}

	// Hook to select store state
	function useCurrentStore<Selected>(selector: (state: T) => Selected) {
		const context = useCurrentContext()
		return useStore(context.store as StoreApi<T>, selector)
	}

	function useActions() {
		const context = useCurrentContext()
		return context.actions
	}

	return {
		Provider,
		createStore: ({ isPersisted }: { isPersisted: boolean }) => {
			return isPersisted
				? createStore({ isPersisted: true, persistedStoreKey, actions, slice })
				: createStore({ actions, slice, isPersisted: false })
		},
		useCurrentStore,
		useActions,
	}
}

function createPersistedStore<T>(
	...args: Parameters<typeof createPersistMiddleware<T>>
) {
	const store = createZustandStore<T>()(createPersistMiddleware(...args))
	store.setState((state) => ({
		...state,
		...args[0],
	}))

	return store
}

function createPersistMiddleware<State>(
	slice: StateCreator<State>,
	persistedStoreKey: PersistedStoreKey,
) {
	return persist(slice, {
		name: persistedStoreKey,
	})
}

type ActionCreator<T> = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	newState: any,
) => (set: StoreApi<T>['setState'], get: StoreApi<T>['getState']) => void

type StoreActions<T> = { [key: string]: ActionCreator<T> }

type createStoreProps<T> = {
	slice: T
	actions: StoreActions<T>
} & (
	| { isPersisted: false }
	| { isPersisted: true; persistedStoreKey: PersistedStoreKey }
)

export function createStore<T>(props: createStoreProps<T>) {
	let store: StoreApi<T>

	if (!props.isPersisted) {
		store = createZustandStore<T>()(() => ({ ...props.slice }))
	} else {
		store = createPersistedStore<T>(
			() => ({ ...props.slice }),
			props.persistedStoreKey,
		)
	}

	const actions = Object.fromEntries(
		Object.entries(props.actions).map(([key, action]) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const wrappedAction = (newState: any) => {
				return action(newState)(store.setState, store.getState) // Pass `setState` and `getState`
			}

			return [key, wrappedAction]
		}),
	) as StoreActions<T>

	return { store, actions }
}
