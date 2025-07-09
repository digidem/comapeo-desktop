import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { createFileRoute } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { DARKER_ORANGE, DARK_GREY, LIGHT_GREY } from '../../colors'
import { Icon } from '../../components/icon'
import { TwoPanelLayout } from './-components/two-panel-layout'

export const Route = createFileRoute('/app/about')({
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()

	return (
		<TwoPanelLayout
			start={
				<Stack direction="column" gap={4} padding={6} useFlexGap flex={1}>
					<Stack
						direction="column"
						border={`1px solid ${DARK_GREY}`}
						borderRadius={2}
						useFlexGap
						gap={4}
						alignItems="center"
						padding={6}
					>
						<Icon
							name="material-symbols-info"
							size={100}
							htmlColor={DARKER_ORANGE}
						/>
						<Typography variant="h1" fontWeight={500}>
							{t(m.title)}
						</Typography>
					</Stack>
					<Stack
						direction="column"
						border={`1px solid ${DARK_GREY}`}
						borderRadius={2}
						useFlexGap
						gap={4}
						padding={6}
						flex={1}
						overflow="auto"
					>
						<List>
							<ListItem>
								<Stack direction="column" useFlexGap gap={3}>
									<Typography variant="h2" fontWeight={500}>
										{t(m.version)}
									</Typography>
									<Typography>
										{window.runtime.getAppInfo().appVersion}
									</Typography>
								</Stack>
							</ListItem>
						</List>
					</Stack>
				</Stack>
			}
			end={<Box bgcolor={LIGHT_GREY} display="flex" flex={1} />}
		/>
	)
}

const m = defineMessages({
	title: {
		id: 'routes.app.about.title',
		defaultMessage: 'About CoMapeo',
	},
	version: {
		id: 'routes.app.about.version',
		defaultMessage: 'CoMapeo Version',
	},
})
