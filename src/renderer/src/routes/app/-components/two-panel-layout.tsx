import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import { alpha } from '@mui/material/styles'

import { BLACK } from '../../../colors.ts'

const BOX_SHADOW = `0px 5px 20px 0px ${alpha(BLACK, 0.25)}`

export function TwoPanelLayout({
	start,
	end,
}: {
	start: ReactNode
	end: ReactNode
}) {
	return (
		<Box sx={{ display: 'flex', flex: 1, overflow: 'auto' }}>
			<Box
				sx={{
					display: 'flex',
					overflow: 'auto',
					boxShadow: BOX_SHADOW,
					minWidth: 250,
					flex: 1,
					maxWidth: `min(calc(50%), 450px)`,
					zIndex: 1,
				}}
			>
				{start}
			</Box>

			<Box sx={{ display: 'flex', flex: 1, overflow: 'auto' }}>{end}</Box>
		</Box>
	)
}
