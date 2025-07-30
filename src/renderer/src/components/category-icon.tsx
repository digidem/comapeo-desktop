import type { ComponentProps, ReactNode } from 'react'
import Box from '@mui/material/Box'
import { alpha } from '@mui/material/styles'

import { WHITE } from '../colors'

export function CategoryIconContainer({
	children,
	applyBoxShadow,
	color,
	padding = 2,
}: {
	children: ReactNode
	color: string
	applyBoxShadow?: boolean
	padding?: ComponentProps<typeof Box>['padding']
}) {
	return (
		<Box
			display="flex"
			flexDirection="column"
			justifyContent="center"
			alignItems="center"
			// flex={1}
			bgcolor={WHITE}
			borderRadius="50%"
			padding={padding}
			overflow="hidden"
			border={`3px solid ${color}`}
			boxShadow={
				applyBoxShadow ? `0px 0px 10px ${alpha(color, 0.25)}` : undefined
			}
		>
			{children}
		</Box>
	)
}
