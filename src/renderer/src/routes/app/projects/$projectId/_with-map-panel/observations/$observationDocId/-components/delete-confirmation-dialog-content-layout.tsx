import type { ReactNode } from 'react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { Icon } from '../../../../../../../../components/icon.tsx'
import { useIconSizeBasedOnTypography } from '../../../../../../../../hooks/icon.ts'

export function DeleteConfirmationDialogContentLayout({
	actions,
	title,
}: {
	actions: ReactNode
	title: string
}) {
	const errorIconSize = useIconSizeBasedOnTypography({
		variant: 'heroHeader',
		multiplier: 3,
	})

	return (
		<Stack direction="column" sx={{ overflow: 'auto' }}>
			<Stack
				direction="column"
				sx={{
					flex: 1,
					gap: 10,
					justifyContent: 'center',
					overflow: 'auto',
					paddingBlock: 20,
					paddingInline: 6,
				}}
			>
				<Stack direction="column" sx={{ alignItems: 'center', gap: 4 }}>
					<Icon name="material-error" color="error" size={errorIconSize} />

					<Typography variant="heroHeader" sx={{ textAlign: 'center' }}>
						{title}
					</Typography>
				</Stack>
			</Stack>

			{actions}
		</Stack>
	)
}
