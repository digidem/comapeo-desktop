import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import PostAddIcon from '@mui/icons-material/PostAdd'
import SettingsIcon from '@mui/icons-material/Settings'
import Tab from '@mui/material/Tab'
import MuiTabs from '@mui/material/Tabs'
import { styled } from '@mui/material/styles'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import type { FileRoutesById } from '../routeTree.gen'
import { Text } from './Text'

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

const MapTabStyled = styled(MapTab)({
	width: 60,
	'& MuiButtonBase.Mui-selected': { color: '#000' },
})

export const Tabs = () => {
	const navigate = useNavigate()
	const { formatMessage } = useIntl()
	const location = useLocation()
	return (
		<MuiTabs
			sx={{
				pb: 20,
				pt: 20,
				'& .MuiTabs-flexContainer': {
					height: '100%',
				},
			}}
			onChange={(_, value) => navigate({ to: value as MapTabRoute })}
			orientation="vertical"
			value={location.pathname}
			TabIndicatorProps={{ style: { backgroundColor: 'transparent' } }}
		>
			<MapTabStyled
				data-testid="tab-observation"
				icon={<PostAddIcon />}
				value={'/main'}
			/>
			{/* This is needed to properly space the items. Originally used a div, but was causing console errors as the Parent component passes it props, which were invalid for non-tab components */}
			<Tab disabled={true} sx={{ flex: 1 }} />

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
		</MuiTabs>
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
