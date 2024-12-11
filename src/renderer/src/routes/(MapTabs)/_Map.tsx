import { Suspense } from 'react'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import PostAddIcon from '@mui/icons-material/PostAdd'
import SettingsIcon from '@mui/icons-material/Settings'
import { Box, CircularProgress, Paper } from '@mui/material'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { styled } from '@mui/material/styles'
import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { VERY_LIGHT_GREY, WHITE } from '../../colors'
import { Text } from '../../components/Text'
import type { FileRoutesById } from '../../routeTree.gen'

const m = defineMessages({
	setting: {
		id: 'tabBar.label.settings',
		defaultMessage: 'Settings',
	},
	about: {
		id: 'tabBar.label.about',
		defaultMessage: 'About',
	},
})

const Container = styled('div')({
	display: 'flex',
	backgroundColor: WHITE,
	height: '100%',
})

const MapTabStyled = styled(MapTab)({
	width: 60,
})

export const Route = createFileRoute('/(MapTabs)/_Map')({
	component: MapLayout,
})

export function MapLayout() {
	const navigate = useNavigate()
	const { formatMessage } = useIntl()
	return (
		<Container>
			<Paper elevation={3} sx={{ display: 'flex' }}>
				<Tabs
					sx={{ '& .MuiTabs-flexContainer': { height: '100%' } }}
					onChange={(_, value) => navigate({ to: value as MapTabRoute })}
					orientation="vertical"
				>
					{/* PostAddIcon is a placeholder icon */}
					<MapTabStyled icon={<PostAddIcon />} value={'/tab1'} />
					<Box flexGrow={1} />

					<MapTabStyled
						icon={<SettingsIcon />}
						label={
							<Text style={{ fontSize: 10 }} kind="title">
								{formatMessage(m.setting)}
							</Text>
						}
						value={'/tab2'}
					/>
					<MapTabStyled
						icon={<InfoOutlinedIcon />}
						label={
							<Text style={{ fontSize: 10 }} kind="title">
								{formatMessage(m.about)}
							</Text>
						}
						value={'/tab2'}
					/>
				</Tabs>

				<Box
					sx={{
						width: 300,
						borderLeftColor: VERY_LIGHT_GREY,
						borderLeftWidth: '1px',
						borderLeftStyle: 'solid',
					}}
				>
					<Suspense fallback={<CircularProgress />}>
						<Outlet />
					</Suspense>
				</Box>
			</Paper>
			<Suspense fallback={<CircularProgress />}>
				<div>map component here</div>
			</Suspense>
		</Container>
	)
}

type TabProps = React.ComponentProps<typeof Tab>

type MapTabRoute = {
	[K in keyof FileRoutesById]: K extends `${'/(MapTabs)/_Map'}${infer Rest}`
		? Rest extends ''
			? never
			: `${Rest}`
		: never
}[keyof FileRoutesById]

type MapTabProps = Omit<TabProps, 'value'> & { value: MapTabRoute }

function MapTab(props: MapTabProps) {
	return <Tab {...props} />
}
