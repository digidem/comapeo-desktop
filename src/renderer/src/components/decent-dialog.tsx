import { useState, type ReactElement } from 'react'
import Dialog, { type DialogProps } from '@mui/material/Dialog'

/**
 * Dialog wrapper with more elegant close handling and child rendering.
 */
export function DecentDialog<Value = unknown>({
	children,
	value,
	...muiDialogProps
}: Omit<DialogProps, 'children' | 'open' | 'slotProps'> & {
	children: (value: NonNullable<Value>) => ReactElement
	value?: Value
}) {
	const [dialogState, setDialogState] = useState<
		| { status: 'opened' | 'closing'; value: NonNullable<Value> }
		| { status: 'closed' }
	>(() => {
		return value === undefined || value === null
			? { status: 'closed' }
			: { status: 'opened', value }
	})

	if (
		dialogState.status === 'closed' &&
		!(value === undefined || value === null)
	) {
		setDialogState({ status: 'opened', value })
	} else if (dialogState.status === 'opened') {
		if (value === undefined || value === null) {
			setDialogState({ status: 'closing', value: dialogState.value })
		}
		// NOTE: Relies on referential equality. Otherwise will run into infinite rerenders loop.
		else if (value !== dialogState.value) {
			setDialogState({ status: 'opened', value })
		}
	}

	return (
		<Dialog
			{...muiDialogProps}
			open={dialogState.status === 'opened'}
			slotProps={{
				transition: {
					onExited: () => {
						setDialogState({ status: 'closed' })
					},
				},
			}}
		>
			{dialogState.status !== 'closed' ? children(dialogState.value) : null}
		</Dialog>
	)
}
