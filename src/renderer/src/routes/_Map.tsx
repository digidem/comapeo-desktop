import { Paper } from '@mui/material'
import { styled } from '@mui/material/styles'
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { PersistedProjectIdStore } from '../App'
import { VERY_LIGHT_GREY, WHITE } from '../colors'
import { Tabs } from '../components/Tabs'
import { GuaranteedActiveProjectIdProvider } from '../contexts/GuaranteedActiveProjectIdProvider'

const Container = styled('div')({
	display: 'flex',
	backgroundColor: WHITE,
	height: '100%',
})

export const Route = createFileRoute('/_Map')({
	component: MapLayout,
	beforeLoad: () => {
		const activeProjectId =
			PersistedProjectIdStore.store.getState().activeProjectId
		if (!activeProjectId) {
			throw redirect({ to: '/' })
		}
	},
})

export function MapLayout() {
	return (
		<GuaranteedActiveProjectIdProvider>
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
						<Outlet />
					</div>
				</Paper>
				<div>map component here</div>
			</Container>
		</GuaranteedActiveProjectIdProvider>
	)
}
