import {
	Suspense,
	type CSSProperties,
	type ComponentProps,
	type ReactNode,
} from 'react'
import { useIconUrl } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { alpha } from '@mui/material/styles'

import { WHITE } from '../colors'
import { ErrorBoundary } from './error-boundary'
import { Icon } from './icon'
import { SuspenseImage } from './suspense-image'

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

export function CategoryIconImage({
	altText,
	projectId,
	iconDocumentId,
	imageStyle,
}: {
	altText: string
	iconDocumentId: string
	projectId: string
	imageStyle?: CSSProperties
}) {
	const { data: iconUrl } = useIconUrl({
		projectId,
		iconId: iconDocumentId,
		mimeType: 'image/png',
		size: 'small',
		pixelDensity: 3,
	})

	return (
		<ErrorBoundary
			getResetKey={() => iconUrl}
			fallback={() => (
				<Box
					sx={imageStyle}
					display="flex"
					justifyContent="center"
					alignItems="center"
					flex={1}
				>
					<Icon name="material-error" color="error" />
				</Box>
			)}
		>
			<Suspense fallback={<CircularProgress disableShrink />}>
				<SuspenseImage src={iconUrl} alt={altText} style={imageStyle} />
			</Suspense>
		</ErrorBoundary>
	)
}
