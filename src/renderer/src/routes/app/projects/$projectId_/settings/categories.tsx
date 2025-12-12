import {
	useImportProjectCategories,
	useProjectSettings,
} from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { captureException } from '@sentry/react'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_GREY, DARK_GREY, DARK_ORANGE } from '../../../../../colors'
import { ErrorDialog } from '../../../../../components/error-dialog'
import { Icon } from '../../../../../components/icon'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../../../../lib/comapeo'
import { selectFileMutationOptions } from '../../../../../lib/queries/file-system'
import { createGlobalMutationsKey } from '../../../../../lib/queries/global-mutations'

export const Route = createFileRoute(
	'/app/projects/$projectId/settings/categories',
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

const DEFAULT_CATEGORIES_NAME = 'CoMapeo Default Categories'

const SELECT_AND_IMPORT_CATEGORY_MUTATION_KEY = createGlobalMutationsKey([
	'category',
	'select-and-import',
])

function RouteComponent() {
	const { formatMessage: t, formatDate } = useIntl()
	const router = useRouter()

	const { projectId } = Route.useParams()

	const { data: projectSettings } = useProjectSettings({ projectId })

	const selectFile = useMutation(selectFileMutationOptions())

	const importCategoriesFile = useImportProjectCategories({ projectId })

	const selectAndImportMutation = useMutation({
		mutationKey: SELECT_AND_IMPORT_CATEGORY_MUTATION_KEY,
		mutationFn: async () => {
			const fileInfo = await selectFile.mutateAsync({
				extensionFilters: ['comapeocat'],
			})

			if (!fileInfo) {
				return
			}

			return importCategoriesFile.mutateAsync({ filePath: fileInfo.path })
		},
	})

	const displayedName =
		projectSettings.configMetadata?.name || t(m.fallbackCategoriesName)

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
						aria-label={t(m.goBackAccessibleLabel)}
						onClick={() => {
							if (selectAndImportMutation.status === 'pending') {
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
								name="material-symbols-apps"
								htmlColor={DARK_ORANGE}
								size={128}
							/>
						</Box>

						<Typography variant="h1" fontWeight={500} textAlign="center">
							{displayedName}
						</Typography>

						{projectSettings.configMetadata ? (
							<Stack direction="column" gap={2}>
								<Typography
									textAlign="center"
									color="textSecondary"
									fontWeight={500}
								>
									{t(m.dateCreated, {
										date: (
											<time
												key={`${projectSettings.configMetadata.name}@${projectSettings.configMetadata.fileVersion}`}
												dateTime={projectSettings.configMetadata.buildDate}
											>
												{formatDate(projectSettings.configMetadata.buildDate, {
													year: 'numeric',
													month: 'long',
													day: 'numeric',
												})}
											</time>
										),
									})}
								</Typography>

								<Typography
									textAlign="center"
									color="textSecondary"
									fontWeight={500}
								>
									{t(m.dateAdded, {
										date: (
											<time
												key={`${projectSettings.configMetadata.name}@${projectSettings.configMetadata.fileVersion}`}
												dateTime={projectSettings.configMetadata.importDate}
											>
												{formatDate(projectSettings.configMetadata.importDate, {
													year: 'numeric',
													month: 'long',
													day: 'numeric',
												})}
											</time>
										),
									})}
								</Typography>
							</Stack>
						) : null}

						{projectSettings.configMetadata?.name ===
						DEFAULT_CATEGORIES_NAME ? (
							<List
								sx={{
									alignSelf: 'center',
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
							fullWidth
							loading={selectAndImportMutation.status === 'pending'}
							loadingPosition="start"
							onClick={() => {
								selectAndImportMutation.mutate(undefined, {
									onError: (err) => {
										captureException(err)
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

			<ErrorDialog
				open={selectAndImportMutation.status === 'error'}
				errorMessage={selectAndImportMutation.error?.toString()}
				onClose={() => {
					selectAndImportMutation.reset()
				}}
			/>
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
	fallbackCategoriesName: {
		id: 'routes.app.projects.$projectId_.settings.categories.fallbackCategoriesName',
		defaultMessage: 'CoMapeo Categories',
		description: 'Fallback displayed name when project has no category set.',
	},
	dateAdded: {
		id: 'routes.app.projects.$projectId_.settings.categories.dateAdded',
		defaultMessage: 'Added {date}',
		description: 'Text indicating the date the categories set was added.',
	},
	dateCreated: {
		id: 'routes.app.projects.$projectId_.settings.categories.dateCreated',
		defaultMessage: 'Created {date}',
		description: 'Text indicating the date the categories set was created.',
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
	goBackAccessibleLabel: {
		id: 'routes.app.projects.$projectId_.settings.categories.goBackAccessibleLabel',
		defaultMessage: 'Go back.',
		description: 'Accessible label for back button.',
	},
})
