import React from 'react'
import { styled } from '@mui/material/styles'

import { BLACK, DARK_GREY } from '../../colors'
import { Text } from '../Text'

const Container = styled('div')({
	gap: 20,
	paddingBottom: 20,
	displau: 'flex',
})

const PointHeader = styled('div')({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	gap: 10,
})

const PointTitle = styled(Text)({
	fontSize: 16,
	color: BLACK,
})

export function PointContainer({
	icon,
	title,
	description,
}: {
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>> | string
	title: string
	description: string
}) {
	const isSvg = typeof icon !== 'string'
	return (
		<Container>
			<PointHeader>
				{isSvg && icon ? (
					React.createElement(icon, { width: 18, height: 18 })
				) : (
					<img src={icon} alt="" width={18} height={18} />
				)}
				<PointTitle>{title}</PointTitle>
			</PointHeader>
			<Text kind="body" style={{ color: DARK_GREY, marginTop: 20 }}>
				{description}
			</Text>
		</Container>
	)
}
