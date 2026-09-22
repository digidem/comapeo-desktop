import type { ReactNode } from 'react'
import OutlinedInput, {
	type OutlinedInputProps,
} from '@mui/material/OutlinedInput'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export function DecentTextField({
	helperText,
	label,
	...muiOutlinedInputProps
}: {
	helperText: ReactNode
	label: string
} & Omit<OutlinedInputProps, 'label' | 'helperText'>) {
	return (
		<Stack direction="column" sx={{ gap: 2 }}>
			<Typography
				component="label"
				color={muiOutlinedInputProps.error ? 'error' : 'textPrimary'}
				htmlFor={muiOutlinedInputProps.id}
				sx={{ fontWeight: 500, textTransform: 'uppercase' }}
			>
				{label}
			</Typography>

			<OutlinedInput {...muiOutlinedInputProps} />

			{helperText}
		</Stack>
	)
}
