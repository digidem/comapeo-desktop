import { Suspense, type ReactNode } from 'react'
import { useProjectSettings } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import List from '@mui/material/List'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { createFileRoute } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_GREY, DARKER_ORANGE, DARK_GREY } from '../../../../../colors'
import { Icon } from '../../../../../components/icon'
import {
	ListItemButtonLink,
	type ListItemButtonLinkComponentProps,
} from '../../../../../components/link'
import { useIconSizeBasedOnTypography } from '../../../../../hooks/icon'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../../../../lib/comapeo'

export const Route = createFileRoute('/app/projects/$projectId/settings/')({
	loader: async ({ context, params }) => {
		const { projectApi, queryClient } = context
		const { projectId } = params

		await queryClient.ensureQueryData({
			queryKey: [
				COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
				'projects',
				projectId,
				'project_settings',
			],
			queryFn: async () => {
				return projectApi.$getProjectSettings()
			},
		})
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()

	const { projectId } = Route.useParams()

	return (
		<Stack direction="column" flex={1} overflow="auto" padding={6} gap={10}>
			<Stack direction="column" alignItems="center" gap={4}>
				<Icon
					name="material-manage-accounts-filled"
					size={120}
					htmlColor={DARKER_ORANGE}
				/>

				<Typography variant="h1" fontWeight={500}>
					{t(m.navTitle)}
				</Typography>
			</Stack>

			<Suspense
				fallback={
					<Box display="flex" flexDirection="row" justifyContent="center">
						<CircularProgress disableShrink />
					</Box>
				}
			>
				<SettingsList projectId={projectId} />
			</Suspense>
		</Stack>
	)
}

function SettingsList({ projectId }: { projectId: string }) {
	const { formatMessage: t } = useIntl()

	const { data: projectSettings } = useProjectSettings({ projectId })

	const iconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'body1',
		multiplier: 1.25,
	})

	return (
		<Stack
			component={List}
			disablePadding
			direction="column"
			flexDirection="column"
			flex={1}
			gap={4}
		>
			<SettingRow
				to="/app/projects/$projectId/settings/info"
				params={{ projectId }}
				start={
					<Icon
						name="noun-project-notebook"
						htmlColor={DARK_GREY}
						size={iconSize}
					/>
				}
				end={
					<Typography color="primary">
						{t(m.projectSettingsActionLabel)}
					</Typography>
				}
				label={projectSettings.name || t(m.unnamedProject)}
			/>

			<SettingRow
				to="/app/projects/$projectId/settings/categories"
				params={{ projectId }}
				start={
					<Icon
						name="material-symbols-apps"
						htmlColor={DARK_GREY}
						size={iconSize}
					/>
				}
				end={
					<Typography color="primary">
						{t(m.categoriesSettingActionLabel)}
					</Typography>
				}
				label={
					projectSettings.configMetadata?.name || t(m.defaultCoMapeoCategories)
				}
			/>
		</Stack>
	)
}

function SettingRow({
	label,
	start,
	end,
	...linkProps
}: Pick<ListItemButtonLinkComponentProps, 'to' | 'params'> & {
	label: ReactNode
	start: ReactNode
	end: ReactNode
}) {
	return (
		<ListItemButtonLink
			{...linkProps}
			disableGutters
			disableTouchRipple
			sx={{
				borderRadius: 2,
				border: `1px solid ${BLUE_GREY}`,
				flexGrow: 0,
			}}
		>
			<Stack
				direction="row"
				flex={1}
				justifyContent="space-between"
				alignItems="center"
				overflow="auto"
				padding={4}
			>
				<Stack direction="row" alignItems="center" gap={3} overflow="auto">
					{start}

					<Typography
						textOverflow="ellipsis"
						whiteSpace="nowrap"
						overflow="hidden"
						flex={1}
						fontWeight={500}
					>
						{label}
					</Typography>
				</Stack>

				{end}
			</Stack>
		</ListItemButtonLink>
	)
}

const m = defineMessages({
	navTitle: {
		id: 'routes.app.projects.$projectId_.settings.index.navTitle',
		defaultMessage: 'Coordinator Tools',
		description: 'Title of the coordinator tools page.',
	},
	unnamedProject: {
		id: 'routes.app.projects.$projectId_.settings.index.unnamedProject',
		defaultMessage: 'Unnamed Project',
		description: 'Fallback for when current project is missing a name.',
	},
	projectSettingsActionLabel: {
		id: 'routes.app.projects.$projectId_.settings.index.projectSettingsActionLabel',
		defaultMessage: 'Edit',
		description: 'Text for action to update project info.',
	},
	defaultCoMapeoCategories: {
		id: 'routes.app.projects.$projectId_.settings.index.defaultCoMapeoCategories',
		defaultMessage: 'CoMapeo Categories',
		description: 'Name of the default CoMapeo categories set.',
	},
	categoriesSettingActionLabel: {
		id: 'routes.app.projects.$projectId_.settings.index.categoriesSettingActionLabel',
		defaultMessage: 'Update',
		description: 'Text for action to update categories set.',
	},
})
