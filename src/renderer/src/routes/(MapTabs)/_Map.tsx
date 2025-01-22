import { Suspense } from 'react'
import { CircularProgress, Paper } from '@mui/material'
import { styled } from '@mui/material/styles'
import { Outlet, createFileRoute } from '@tanstack/react-router'

import { VERY_LIGHT_GREY, WHITE } from '../../colors'
import { Map } from '../../components/Map'
import { Tabs } from '../../components/Tabs'

const Container = styled('div')({
	display: 'flex',
	backgroundColor: WHITE,
	height: '100%',
})

export const Route = createFileRoute('/(MapTabs)/_Map')({
	component: MapLayout,
})

export function MapLayout() {
	return (
		<Container>
			<Paper elevation={3} sx={{ display: 'flex' }}>
				<Tabs />
				<div
					style={{
						width: 380,
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
				<div style={{ flex: 1, position: 'relative' }}>
					<Map />
				</div>
			</Suspense>
		</Container>
	)
}
