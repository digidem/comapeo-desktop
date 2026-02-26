import {
	useImperativeHandle,
	useState,
	type ReactElement,
	type Ref,
} from 'react'
import Dialog, { type DialogProps } from '@mui/material/Dialog'

export type DecentDialogRef<Value> = {
	open: (value: NonNullable<Value>) => void
	close: () => void
}

export function DecentDialog<Value>({
	children,
	dialogActionsHandle,
	initialValue,
	...muiDialogProps
}: Omit<DialogProps, 'children' | 'open' | 'slotProps'> & {
	children: (
		value: NonNullable<Value>,
		actions: {
			close: () => void
			update: (value: NonNullable<Value>) => void
		},
	) => ReactElement
	dialogActionsHandle: Ref<DecentDialogRef<Value>>
	initialValue?: Value
}) {
	const [dialogState, dialogActions] = useDialogState<Value>(initialValue)

	// NOTE: This is explicitly recommended against in the React docs (https://react.dev/reference/react/useImperativeHandle)
	// but we do this anyways because I like imperative APIs and renderProps-based rendering.
	useImperativeHandle(dialogActionsHandle, () => {
		return {
			open: dialogActions.open,
			close: dialogActions.close,
		}
	}, [dialogActions])

	return (
		<Dialog
			{...muiDialogProps}
			open={!!dialogState?.showDialog}
			slotProps={{
				transition: {
					onExited: () => {
						dialogActions.handleExited()
					},
				},
			}}
		>
			{dialogState
				? children(dialogState.value, {
						close: dialogActions.close,
						update: dialogActions.open,
					})
				: null}
		</Dialog>
	)
}

function useDialogState<V>(initialValue?: V) {
	const [dialogState, setDialogState] = useState<
		{ showDialog: boolean; value: NonNullable<V> } | undefined
	>(() => {
		return initialValue ? { showDialog: true, value: initialValue } : undefined
	})

	return [
		dialogState,
		{
			open: (value: NonNullable<V>) => {
				setDialogState({ showDialog: true, value })
			},
			close: () => {
				setDialogState((prev) => (prev ? { ...prev, showDialog: false } : prev))
			},
			handleExited: () => {
				setDialogState(undefined)
			},
		},
	] as const
}
