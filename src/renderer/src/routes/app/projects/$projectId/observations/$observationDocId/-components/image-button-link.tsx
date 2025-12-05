import type { ReactNode } from 'react'
import Box from '@mui/material/Box'

import {
	ButtonBaseLink,
	type ButtonBaseLinkComponentProps,
} from '#renderer/src/components/link.tsx'

// Adapted from https://mui.com/material-ui/react-button/#complex-button
export function ImageButtonLink({
	borderColor,
	children,
	height,
	...linkProps
}: Pick<ButtonBaseLinkComponentProps, 'to' | 'params' | 'onClick'> & {
	children: ReactNode
	height: number
	borderColor: string
}) {
	return (
		<ButtonBaseLink
			{...linkProps}
			focusRipple
			sx={{
				'&:hover': {
					'& .MuiImageBackdrop-root': {
						opacity: 0.15,
					},
				},
			}}
		>
			<Box
				height={height}
				position="relative"
				display="flex"
				overflow="hidden"
				borderRadius={2}
				border={`1px solid ${borderColor}`}
			>
				<Box
					component="span"
					className="MuiImageBackdrop-root"
					aria-hidden
					sx={{
						pointerEvents: 'none',
						position: 'absolute',
						left: 0,
						right: 0,
						top: 0,
						bottom: 0,
						opacity: 0,
						backgroundColor: (theme) => theme.palette.common.black,
						transition: (theme) => theme.transitions.create('opacity'),
					}}
				/>
				{children}
			</Box>
		</ButtonBaseLink>
	)
}
