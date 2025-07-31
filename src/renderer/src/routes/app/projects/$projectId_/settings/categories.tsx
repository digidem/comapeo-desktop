import { useImportProjectConfig, useProjectSettings } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_GREY, DARK_GREY, DARK_ORANGE } from '../../../../../colors'
import { ErrorDialog } from '../../../../../components/error-dialog'
import { Icon } from '../../../../../components/icon'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../../../../lib/comapeo'
import { selectCategoriesFileMutationOptions } from '../../../../../lib/queries/file-system'

export const Route = createFileRoute(
	'/app/projects/$projectId_/settings/categories',
)({
	loader: async ({ context, params }) => {
		const { projectApi, queryClient } = context
		const { projectId } = params

		// TODO: Not ideal but requires changes in @comapeo/core-react
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

const DEFAULT_CATEGORIES_NAME = `@mapeo/default-config`

function RouteComponent() {
	const { formatMessage: t, formatDate } = useIntl()
	const router = useRouter()

	const { projectId } = Route.useParams()

	const { data: projectSettings } = useProjectSettings({ projectId })

	const selectCategoriesFile = useMutation(
		selectCategoriesFileMutationOptions(),
	)

	const importCategoriesFile = useImportProjectConfig({ projectId })

	const someMutationPending =
		selectCategoriesFile.status === 'pending' ||
		importCategoriesFile.status === 'pending'

	const errorDialogProps =
		selectCategoriesFile.status === 'error'
			? {
					open: true,
					errorMessage: selectCategoriesFile.error.message,
					onClose: () => {
						selectCategoriesFile.reset()
					},
				}
			: importCategoriesFile.status === 'error'
				? {
						open: true,
						errorMessage: importCategoriesFile.error.message,
						onClose: () => {
							selectCategoriesFile.reset()
						},
					}
				: { open: false, onClose: () => {} }

	return (
		<>
			<Stack direction="column" flex={1} overflow="auto">
				<Stack
					direction="row"
					alignItems="center"
					component="nav"
					gap={4}
					padding={4}
					borderBottom={`1px solid ${BLUE_GREY}`}
				>
					<IconButton
						onClick={() => {
							if (someMutationPending) {
								return
							}

							if (router.history.canGoBack()) {
								router.history.back()
								return
							}

							router.navigate({
								to: '/app/projects/$projectId/settings',
								params: { projectId },
								replace: true,
							})
						}}
					>
						<Icon name="material-arrow-back" size={30} />
					</IconButton>

					<Typography variant="h1" fontWeight={500}>
						{t(m.navTitle)}
					</Typography>
				</Stack>

				<Stack
					direction="column"
					flex={1}
					justifyContent="space-between"
					overflow="auto"
					padding={6}
					gap={6}
				>
					<Stack
						direction="column"
						borderRadius={2}
						border={`1px solid ${BLUE_GREY}`}
						flex={1}
						justifyContent="center"
						gap={5}
						padding={6}
					>
						<Box alignSelf="center">
							<Icon
								name="material-category"
								htmlColor={DARK_ORANGE}
								size={128}
							/>
						</Box>

						<Typography variant="h1" fontWeight={500} textAlign="center">
							{projectSettings.configMetadata?.name ||
								// TODO: Get confirmation about what this should be
								t(m.missingCategoriesName)}
						</Typography>

						{projectSettings.configMetadata?.importDate ? (
							<Typography
								textAlign="center"
								color="textSecondary"
								fontWeight={500}
							>
								{t(m.dateAdded, {
									date: formatDate(projectSettings.configMetadata.importDate, {
										year: 'numeric',
										month: 'long',
										day: 'numeric',
									}),
								})}
							</Typography>
						) : null}

						{projectSettings.configMetadata?.name ===
						DEFAULT_CATEGORIES_NAME ? (
							<List
								sx={{
									listStyleType: 'disc',
									paddingInline: 8,
									color: DARK_GREY,
								}}
							>
								<ListItem disablePadding sx={{ display: 'list-item' }}>
									<Typography color="textSecondary">
										{t(m.defaultCategoriesExplainer)}
									</Typography>
								</ListItem>

								<ListItem disablePadding sx={{ display: 'list-item' }}>
									<Typography color="textSecondary">
										{t(m.customCategoriesExplainer)}
									</Typography>
								</ListItem>
							</List>
						) : null}
					</Stack>

					<Box display="flex" flexDirection="row" justifyContent="center">
						<Button
							type="button"
							variant="outlined"
							size="large"
							fullWidth
							disableElevation
							loading={someMutationPending}
							loadingPosition="start"
							onClick={() => {
								selectCategoriesFile.mutate(undefined, {
									onError: (_err) => {
										// TODO: Report to Sentry
									},
									onSuccess: async (fileInfo) => {
										if (!fileInfo) {
											return
										}

										importCategoriesFile.mutate(
											{ configPath: fileInfo.path },
											{
												onError: (_err) => {
													// TODO: Report to Sentry
												},
												onSuccess: (_configErrors) => {
													// TODO: Surface config errors/warnings?
												},
											},
										)
									},
								})
							}}
							sx={{ maxWidth: 400 }}
						>
							{t(m.uploadNewSet)}
						</Button>
					</Box>
				</Stack>
			</Stack>

			<ErrorDialog {...errorDialogProps} />
		</>
	)
}

const m = defineMessages({
	navTitle: {
		id: 'routes.app.projects.$projectId_.settings.categories.navTitle',
		defaultMessage: 'Categories Set',
		description: 'Title of the categories set page.',
	},
	uploadNewSet: {
		id: 'routes.app.projects.$projectId_.settings.categories.uploadNewSet',
		defaultMessage: 'Upload New Set',
		description: 'Label for button to upload new categories set.',
	},
	missingCategoriesName: {
		id: 'routes.app.projects.$projectId_.settings.categories.missingCategoriesName',
		defaultMessage: 'No name found for categories set.',
		description: 'Text indicating that project is missing categories set name.',
	},
	dateAdded: {
		id: 'routes.app.projects.$projectId_.settings.categories.dateAdded',
		defaultMessage: 'Added {date}',
		description: 'Text indicating the date the categories set was added.',
	},
	defaultCategoriesExplainer: {
		id: 'routes.app.projects.$projectId_.settings.categories.defaultCategoriesExplainer',
		defaultMessage:
			'Default categories help you start organizing your observations instantly.',
		description: 'Explanation for default categories',
	},
	customCategoriesExplainer: {
		id: 'routes.app.projects.$projectId_.settings.categories.customCategoriesExplainer',
		defaultMessage:
			'Use custom categories by importing new categories set files below.',
		description: 'Explanation for custom categories',
	},
})
