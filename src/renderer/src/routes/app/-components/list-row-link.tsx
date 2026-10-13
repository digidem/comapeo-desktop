import type { ReactNode } from 'react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { BLUE_05 } from '../../../../../shared/colors.ts'
import {
	ListItemButtonLink,
	type ListItemButtonLinkComponentProps,
} from '../../../components/link.tsx'

export function ListRowLink({
	label,
	start,
	end,
	...linkProps
}: Pick<ListItemButtonLinkComponentProps, 'to' | 'params'> & {
	label: ReactNode
	start: ReactNode
	end: ReactNode
}) {
	return (
		<ListItemButtonLink
			{...linkProps}
			disableGutters
			disableTouchRipple
			sx={{ border: `1px solid ${BLUE_05}`, borderRadius: 2 }}
		>
			<Stack
				direction="row"
				sx={{
					alignItems: 'center',
					flex: 1,
					gap: 2,
					justifyContent: 'space-between',
					overflow: 'auto',
					padding: 4,
				}}
			>
				<Stack
					direction="row"
					sx={{ alignItems: 'center', gap: 3, overflow: 'auto' }}
				>
					{start}

					<Typography
						sx={{
							flex: 1,
							fontWeight: (theme) => theme.typography.fontWeightMedium,
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
						}}
					>
						{label}
					</Typography>
				</Stack>

				{end}
			</Stack>
		</ListItemButtonLink>
	)
}
