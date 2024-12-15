import { Suspense } from 'react'
import { CircularProgress, Paper } from '@mui/material'
import { styled } from '@mui/material/styles'
import { Outlet, createFileRoute } from '@tanstack/react-router'

import { VERY_LIGHT_GREY, WHITE } from '../colors'
import { Tabs } from '../components/Tabs'

const Container = styled('div')({
	display: 'flex',
	backgroundColor: WHITE,
	height: '100%',
})

export const Route = createFileRoute('/_Map')({
	component: MapLayout,
})

export function MapLayout() {
	return (
		<Container>
			<Paper elevation={3} sx={{ display: 'flex' }}>
				<Tabs />
				<div
					style={{
						width: 300,
						borderLeftColor: VERY_LIGHT_GREY,
						borderLeftWidth: '1px',
						borderLeftStyle: 'solid',
					}}
				>
					<Suspense fallback={<CircularProgress />}>
						<Outlet />
					</Suspense>
				</div>
			</Paper>
			<Suspense fallback={<CircularProgress />}>
				<div>map component here</div>
			</Suspense>
		</Container>
	)
}
