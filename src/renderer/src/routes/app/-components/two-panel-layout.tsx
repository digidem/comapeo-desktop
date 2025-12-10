import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import { alpha } from '@mui/material/styles'

import { BLACK } from '../../../colors'

const BOX_SHADOW = `0px 5px 20px 0px ${alpha(BLACK, 0.25)}`

export function TwoPanelLayout({
	start,
	end,
}: {
	start: ReactNode
	end: ReactNode
}) {
	return (
		<Box display="flex" flex={1}>
			<Box
				display="flex"
				overflow="auto"
				boxShadow={BOX_SHADOW}
				minWidth={250}
				flex={1}
				maxWidth={`min(calc(50%), 450px)`}
				zIndex={1}
			>
				{start}
			</Box>
			<Box display="flex" flex={1} overflow="auto">
				{end}
			</Box>
		</Box>
	)
}
