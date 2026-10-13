import type { ReactNode } from 'react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { GREEN_00 } from '../../../../../../../../../../shared/colors.ts'
import { Icon } from '../../../../../../../../components/icon.tsx'
import { useIconSizeBasedOnTypography } from '../../../../../../../../hooks/icon.ts'

export function DeleteSuccessPanelLayout({
	action,
	title,
}: {
	action: ReactNode
	title: string
}) {
	const iconSize = useIconSizeBasedOnTypography({
		variant: 'heroHeader',
		multiplier: 4,
	})

	return (
		<Stack
			direction="column"
			sx={{
				flex: 1,
				gap: 20,
				justifyContent: 'center',
				overflow: 'auto',
				padding: 6,
			}}
		>
			<Stack direction="column" sx={{ alignItems: 'center', gap: 6 }}>
				<Icon
					name="material-check-circle-rounded"
					htmlColor={GREEN_00}
					size={iconSize}
				/>

				<Typography variant="heroHeader" sx={{ textAlign: 'center' }}>
					{title}
				</Typography>
			</Stack>

			{action}
		</Stack>
	)
}
