import type { ReactNode } from 'react'
import Stack from '@mui/material/Stack'
import { Outlet, createFileRoute } from '@tanstack/react-router'

import { LIGHT_GREY } from '../../../colors'
import { GenericRouteNotFoundComponent } from '../../../components/generic-route-not-found-component'

export const Route = createFileRoute('/onboarding/project')({
	notFoundComponent: ({ data }) => {
		return (
			<Wrapper>
				<GenericRouteNotFoundComponent
					data={data}
					backgroundColor={LIGHT_GREY}
				/>
			</Wrapper>
		)
	},
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<Wrapper>
			<Outlet />
		</Wrapper>
	)
}

function Wrapper({ children }: { children: ReactNode }) {
	return (
		<Stack
			display="flex"
			direction="column"
			flex={1}
			bgcolor={LIGHT_GREY}
			padding={5}
			borderRadius={2}
			overflow="auto"
		>
			{children}
		</Stack>
	)
}
