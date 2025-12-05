import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import { alpha } from '@mui/material/styles'

import { BLACK } from '#renderer/src/colors.ts'

const BOX_SHADOW = `0px 5px 20px 0px ${alpha(BLACK, 0.25)}`

const PREFERRED_PANEL_WIDTH = '600px'

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
				flex={`0 1 ${PREFERRED_PANEL_WIDTH}`}
				zIndex={1}
			>
				{start}
			</Box>
			<Box display="flex" flex={`1 1 ${PREFERRED_PANEL_WIDTH}`} overflow="auto">
				{end}
			</Box>
		</Box>
	)
}
