import { useContext } from 'react'
import { useStore, type StoreApi } from 'zustand'

export function createHooks<TStoreState, TStoreActions>(
	context: React.Context<{
		store: StoreApi<TStoreState>
		actions: TStoreActions
	} | null>,
) {
	function useContextValue() {
		const value = useContext(context)
		if (!value) {
			throw new Error('Must set up the provider first')
		}
		return value
	}

	function useStoreState(): TStoreState
	function useStoreState<S>(selector: (state: TStoreState) => S): S
	function useStoreState<S>(selector?: (state: TStoreState) => S) {
		const { store } = useContextValue()
		return useStore(store, selector!)
	}

	function useStoreActions() {
		const { actions } = useContextValue()
		return actions
	}

	return { useStoreState, useStoreActions }
}
