import type { ReactNode } from 'react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { BLUE_GREY } from '../../../colors.ts'
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
			sx={{ borderRadius: 2, border: `1px solid ${BLUE_GREY}` }}
		>
			<Stack
				direction="row"
				sx={{
					flex: 1,
					justifyContent: 'space-between',
					alignItems: 'center',
					overflow: 'auto',
					padding: 4,
					gap: 2,
				}}
			>
				<Stack
					direction="row"
					sx={{ alignItems: 'center', gap: 3, overflow: 'auto' }}
				>
					{start}

					<Typography
						sx={{
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
							overflow: 'hidden',
							flex: 1,
							fontWeight: 500,
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
