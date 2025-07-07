import { useIconUrl } from '@comapeo/core-react'
import CircularProgress from '@mui/material/CircularProgress'
import { styled } from '@mui/material/styles'

import { hexToRgba } from '../lib/utils'

type IconSize = 'small' | 'medium' | 'large'

const sizeMap: Record<IconSize, number> = {
	small: 24,
	medium: 35,
	large: 50,
}

const Circle = styled('div')<{ radius?: number; borderColor?: string }>(
	({ radius = 25, borderColor = '#000' }) => ({
		width: radius * 2,
		height: radius * 2,
		borderRadius: '50%',
		boxShadow: `0px 2px 5px ${hexToRgba(borderColor, 0.3)}`,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		overflow: 'hidden',
	}),
)

const IconContainer = styled('div')<{
	radius?: number
	borderColor?: string
}>(({ radius = 25, borderColor }) => ({
	width: radius * 2,
	height: radius * 2,
	borderRadius: '50%',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	overflow: 'hidden',
	borderWidth: 3,
	borderStyle: 'solid',
	borderColor: borderColor || '#000',
}))

export function PresetCircleIcon({
	projectId,
	iconId,
	borderColor,
	size = 'medium',
}: {
	projectId?: string
	iconId?: string
	borderColor?: string
	size?: IconSize
}) {
	if (!projectId || !iconId) {
		return (
			<Circle radius={getRadius(size)}>
				<span style={{ fontSize: sizeMap[size] }}>📍</span>
			</Circle>
		)
	}

	return (
		<PresetCircleIconInner
			projectId={projectId}
			iconId={iconId}
			size={size}
			borderColor={borderColor}
		/>
	)
}

function PresetCircleIconInner({
	projectId,
	iconId,
	borderColor,
	size,
}: {
	projectId: string
	iconId: string
	borderColor?: string
	size: IconSize
}) {
	const {
		data: iconUrl,
		error,
		isRefetching,
	} = useIconUrl({
		projectId,
		iconId,
		mimeType: 'image/png',
		pixelDensity: 1,
		size: 'medium',
	})

	const radius = getRadius(size)

	if (error || !iconUrl) {
		return (
			<Circle radius={radius}>
				<span style={{ fontSize: sizeMap[size] }}>📍</span>
			</Circle>
		)
	}

	if (isRefetching) {
		return (
			<Circle radius={radius}>
				<CircularProgress size={sizeMap[size]} />
			</Circle>
		)
	}

	return (
		<Circle radius={radius} borderColor={borderColor}>
			<IconContainer borderColor={borderColor}>
				<img
					src={iconUrl}
					alt="Preset Icon"
					style={{
						width: sizeMap[size],
						height: sizeMap[size],
						objectFit: 'contain',
					}}
				/>
			</IconContainer>
		</Circle>
	)
}

function getRadius(size: IconSize) {
	return size === 'small' ? 15 : size === 'large' ? 35 : 25
}
