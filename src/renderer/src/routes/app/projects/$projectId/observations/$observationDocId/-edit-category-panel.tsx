import { Suspense } from 'react'
import {
	useManyDocs,
	usePresetsSelection,
	useSingleDocByDocId,
	useUpdateDocument,
} from '@comapeo/core-react'
import type { Observation, Preset } from '@comapeo/schema'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_GREY } from '../../../../../../colors'
import {
	CategoryIconContainer,
	CategoryIconImage,
} from '../../../../../../components/category-icon'
import { ErrorDialog } from '../../../../../../components/error-dialog'
import { Icon } from '../../../../../../components/icon'
import { getMatchingCategoryForDocument } from '../../../../../../lib/comapeo'
import { getLocaleStateQueryOptions } from '../../../../../../lib/queries/app-settings'
import { createGlobalMutationsKey } from '../../../../../../lib/queries/global-mutations'

export function EditCategoryPanel({
	projectId,
	observationDocId,
	onClose,
}: {
	projectId: string
	observationDocId: string
	onClose: (success: boolean) => void
}) {
	const { formatMessage: t } = useIntl()

	return (
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
						onClose(false)
					}}
				>
					<Icon name="material-close" size={30} />
				</IconButton>

				<Typography variant="h1" fontWeight={500}>
					{t(m.editCategoryPanelTitle)}
				</Typography>
			</Stack>

			<Box overflow="auto">
				<Suspense
					fallback={
						<Box
							display="flex"
							flexDirection="column"
							alignItems="center"
							padding={10}
						>
							<CircularProgress disableShrink />
						</Box>
					}
				>
					<CategoriesList
						projectId={projectId}
						observationDocId={observationDocId}
						onSuccess={() => {
							onClose(true)
						}}
					/>
				</Suspense>
			</Box>
		</Stack>
	)
}

const UPDATE_OBSERVATION_CATEGORY_MUTATION_KEY = createGlobalMutationsKey([
	'observations',
	'category',
	'update',
])

function CategoriesList({
	projectId,
	observationDocId,
	onSuccess,
}: {
	projectId: string
	observationDocId: string
	onSuccess: () => void
}) {
	const { formatMessage: t } = useIntl()

	const { data: lang } = useSuspenseQuery({
		...getLocaleStateQueryOptions(),
		select: ({ value }) => value,
	})

	const selectableCategories = usePresetsSelection({
		projectId,
		dataType: 'observation',
		lang,
	})

	const { data: allCategories } = useManyDocs({
		projectId,
		docType: 'preset',
		lang,
	})

	const { data: observation } = useSingleDocByDocId({
		projectId,
		docId: observationDocId,
		docType: 'observation',
	})

	const updateObservation = useUpdateDocument({
		docType: 'observation',
		projectId,
	})

	const currentCategory = getMatchingCategoryForDocument(
		observation,
		allCategories,
	)

	const updateObservationCategory = useMutation({
		mutationKey: UPDATE_OBSERVATION_CATEGORY_MUTATION_KEY,
		mutationFn: async ({ category }: { category: Preset }) => {
			let newTags: Observation['tags']

			if (currentCategory) {
				newTags = {
					...category.tags,
					...category.addTags,
				}

				// Apply tags from new category and remove tags from previous category
				for (const [key, value] of Object.entries(observation.tags)) {
					const tagWasFromPreviousPreset =
						currentCategory.tags[key] === value ||
						currentCategory.addTags[key] === value

					const shouldRemoveTag = category.removeTags[key] === value

					// Only keep tags that were not from the previous category and are not removed by the new category
					if (!tagWasFromPreviousPreset && !shouldRemoveTag) {
						newTags[key] = value
					}
				}
			} else {
				newTags = {
					...observation.tags,
					...category.tags,
					...category.addTags,
				}
			}

			return updateObservation.mutateAsync({
				versionId: observation.versionId,
				value: {
					...observation,
					presetRef: {
						docId: category.docId,
						versionId: category.versionId,
					},
					tags: newTags,
				},
			})
		},
	})

	return (
		<>
			<Box
				padding={6}
				display="grid"
				gridTemplateColumns={`repeat(auto-fill, minmax(120px, 33%))`}
				justifyItems="center"
				alignItems="self-start"
				justifyContent="space-around"
			>
				{selectableCategories.map((category) => {
					return (
						<ButtonBase
							key={category.docId}
							onClick={() => {
								if (updateObservationCategory.status === 'pending') {
									return
								}

								updateObservationCategory.mutate(
									{ category },
									{
										onSuccess: () => {
											onSuccess()
										},
									},
								)
							}}
							sx={{
								':hover, :focus': {
									backgroundColor: alpha(BLUE_GREY, 0.2),
									transition: (theme) =>
										theme.transitions.create('background-color'),
								},
								borderRadius: 2,
							}}
						>
							<Stack direction="column" alignItems="center" gap={2} padding={4}>
								<CategoryIconContainer
									color={category.color || BLUE_GREY}
									applyBoxShadow
								>
									{category.iconRef?.docId ? (
										<CategoryIconImage
											altText={t(m.categoryIconAlt, {
												name:
													category.name || t(m.observationCategoryNameFallback),
											})}
											iconDocumentId={category.iconRef.docId}
											projectId={projectId}
											imageStyle={{ width: 48, aspectRatio: 1 }}
										/>
									) : (
										<Icon name="material-place" size={40} />
									)}
								</CategoryIconContainer>

								<Typography fontWeight={450} textAlign="center">
									{category.name}
								</Typography>
							</Stack>
						</ButtonBase>
					)
				})}
			</Box>

			<ErrorDialog
				open={updateObservationCategory.status === 'error'}
				errorMessage={updateObservationCategory.error?.toString()}
				onClose={() => {
					updateObservationCategory.reset()
				}}
			/>
		</>
	)
}

const m = defineMessages({
	editCategoryPanelTitle: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.-edit-category-panel.editCategoryPanelTitle',
		defaultMessage: 'Change Category',
		description: 'Title for edit category panel.',
	},
	categoryIconAlt: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.-edit-category-panel.categoryIconAlt',
		defaultMessage: 'Icon for {name} category',
		description:
			'Alt text for icon image displayed for category (used for accessibility tools).',
	},
	observationCategoryNameFallback: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.-edit-category-panel.observationCategoryNameFallback',
		defaultMessage: 'Observation',
		description: 'Fallback name for observation without a matching category.',
	},
})
