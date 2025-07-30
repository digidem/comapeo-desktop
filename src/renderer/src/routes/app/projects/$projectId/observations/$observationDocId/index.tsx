import { Suspense } from 'react'
import {
	useIconUrl,
	useManyDocs,
	useSingleDocByDocId,
} from '@comapeo/core-react'
import type { Field, Preset } from '@comapeo/schema'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_GREY, DARKER_ORANGE } from '../../../../../../colors'
import { CategoryIconContainer } from '../../../../../../components/category-icon'
import { ErrorBoundary } from '../../../../../../components/error-boundary'
import { Icon } from '../../../../../../components/icon'
import { SuspenseImage } from '../../../../../../components/suspense-image'
import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	getMatchingCategoryForDocument,
	getRenderableFieldInfo,
} from '../../../../../../lib/comapeo'
import { formatCoords } from '../../../../../../lib/coordinate-format'
import {
	getCoordinateFormatQueryOptions,
	getLocaleStateQueryOptions,
} from '../../../../../../lib/queries/app-settings'

export const Route = createFileRoute(
	'/app/projects/$projectId/observations/$observationDocId/',
)({
	loader: async ({ context, params }) => {
		const {
			projectApi,
			queryClient,
			localeState: { value: lang },
		} = context
		const { projectId, observationDocId } = params

		try {
			// TODO: Not ideal but requires changes to core-react
			await queryClient.ensureQueryData({
				queryKey: [
					COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
					'projects',
					projectId,
					'observation',
					observationDocId,
					{ lang },
				],
				queryFn: async () => {
					return projectApi.observation.getByDocId(observationDocId, { lang })
				},
			})
		} catch {
			throw notFound()
		}

		await Promise.all([
			// TODO: Not ideal but requires changes to core-react
			queryClient.ensureQueryData({
				queryKey: [
					COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
					'projects',
					projectId,
					'preset',
					{ lang },
				],
				queryFn: async () => {
					return projectApi.preset.getMany({ lang })
				},
			}),
			// TODO: Not ideal but requires changes to core-react
			queryClient.ensureQueryData({
				queryKey: [
					COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
					'projects',
					projectId,
					'field',
					{ lang },
				],
				queryFn: async () => {
					return projectApi.field.getMany({ lang })
				},
			}),
		])
	},
	pendingComponent: () => {
		return (
			<Box
				display="flex"
				flexDirection="column"
				flex={1}
				justifyContent="center"
				alignItems="center"
			>
				<CircularProgress />
			</Box>
		)
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t, formatDate } = useIntl()
	const router = useRouter()

	const { projectId, observationDocId } = Route.useParams()

	const { data: lang } = useSuspenseQuery({
		...getLocaleStateQueryOptions(),
		select: ({ value }) => value,
	})

	const { data: coordinateFormat } = useSuspenseQuery(
		getCoordinateFormatQueryOptions(),
	)

	const { data: observation } = useSingleDocByDocId({
		projectId,
		docType: 'observation',
		docId: observationDocId,
		lang,
	})

	const { data: categories } = useManyDocs({
		projectId,
		docType: 'preset',
		lang,
	})

	const { data: fields } = useManyDocs({
		projectId,
		docType: 'field',
		lang,
	})

	const category = getMatchingCategoryForDocument(observation, categories)

	const fieldsToDisplay = category ? getFieldsToDisplay(category, fields) : []

	return (
		<Stack direction="column" flex={1} overflow="auto">
			<Stack
				direction="row"
				alignItems="center"
				component="nav"
				useFlexGap
				gap={4}
				padding={4}
				borderBottom={`1px solid ${BLUE_GREY}`}
			>
				<IconButton
					onClick={() => {
						if (router.history.canGoBack()) {
							router.history.back()
							return
						}

						router.navigate({
							to: '/app/projects/$projectId',
							params: { projectId },
							replace: true,
						})
					}}
				>
					<Icon name="material-arrow-back" size={30} />
				</IconButton>
				<Typography
					variant="h1"
					fontWeight={500}
					id="coordinate-system-selection-label"
				>
					{t(m.navTitle)}
				</Typography>
			</Stack>

			<Box padding={6} overflow="auto">
				<Stack direction="column" useFlexGap gap={6}>
					<Typography>
						{formatDate(observation.createdAt, {
							year: 'numeric',
							month: 'short',
							day: '2-digit',
							minute: '2-digit',
							hour: '2-digit',
							hourCycle: 'h12',
						})}
					</Typography>

					<Stack
						direction="column"
						border={`1px solid ${BLUE_GREY}`}
						borderRadius={2}
					>
						{category ? (
							<Stack
								direction="row"
								alignItems="center"
								useFlexGap
								gap={4}
								padding={4}
							>
								<CategoryIconContainer
									color={category.color || BLUE_GREY}
									applyBoxShadow
								>
									<Box
										flex={1}
										display="flex"
										justifyContent={'center'}
										alignItems={'center'}
										width={48}
										sx={{ aspectRatio: 1 }}
									>
										{category.iconRef?.docId ? (
											<CategoryIconImage
												categoryName={
													category.name || t(m.observationCategoryNameFallback)
												}
												iconDocumentId={category.iconRef.docId}
												projectId={projectId}
											/>
										) : (
											<Icon name="material-place" size={40} />
										)}
									</Box>
								</CategoryIconContainer>

								<Typography variant="h2" fontWeight={500}>
									{category.name}
								</Typography>
							</Stack>
						) : (
							<Stack
								direction="row"
								alignItems="center"
								useFlexGap
								gap={3}
								padding={4}
							>
								<CategoryIconContainer color={BLUE_GREY} applyBoxShadow>
									<Icon name="material-place" size={40} />
								</CategoryIconContainer>

								<Typography variant="h2" fontWeight={500}>
									{t(m.observationCategoryNameFallback)}
								</Typography>
							</Stack>
						)}

						<Divider variant="fullWidth" sx={{ color: BLUE_GREY }} />

						<Stack
							direction="row"
							alignItems="center"
							padding={4}
							useFlexGap
							gap={3}
						>
							<Icon name="material-fmd-good-filled" htmlColor={DARKER_ORANGE} />

							<Typography>
								{typeof observation.lon === 'number' &&
								typeof observation.lat === 'number'
									? formatCoords({
											lon: observation.lon,
											lat: observation.lat,
											format: coordinateFormat,
										})
									: t(m.noLocation)}
							</Typography>
						</Stack>
					</Stack>

					<Stack direction="column" useFlexGap gap={4}>
						<Typography
							component="h2"
							variant="body1"
							textTransform="uppercase"
						>
							{t(m.notesSectionTitle)}
						</Typography>

						<Typography>{observation.tags.notes}</Typography>
					</Stack>

					{/* TODO: Render attachments here */}
					<Stack direction="column" useFlexGap gap={2}></Stack>

					{fieldsToDisplay.length > 0 ? (
						<Stack direction="column" useFlexGap gap={4}>
							<Typography
								component="h2"
								variant="body1"
								textTransform="uppercase"
							>
								{t(m.detailsSectionTitle)}
							</Typography>

							<Stack direction="column" useFlexGap gap={3}>
								{fieldsToDisplay.map((field) => {
									const { label, answer } = getRenderableFieldInfo({
										field,
										tags: observation.tags,
										answerTypeToTranslatedString: {
											true: t(m.fieldAnswerTrue),
											false: t(m.fieldAnswerFalse),
											null: t(m.fieldAnswerNull),
										},
									})

									return (
										<Stack
											key={field.docId}
											direction="column"
											useFlexGap
											gap={2}
										>
											<Typography component="h3" variant="body1">
												{label}
											</Typography>

											<Typography
												fontStyle={answer.length === 0 ? 'italic' : undefined}
											>
												{answer.length > 0 ? answer : t(m.fieldAnswerNoAnswer)}
											</Typography>
										</Stack>
									)
								})}
							</Stack>
						</Stack>
					) : null}
				</Stack>
			</Box>
		</Stack>
	)
}

function CategoryIconImage({
	categoryName,
	iconDocumentId,
	projectId,
}: {
	categoryName: string
	iconDocumentId: string
	projectId: string
}) {
	const { formatMessage: t } = useIntl()

	const { data: iconUrl } = useIconUrl({
		projectId,
		iconId: iconDocumentId,
		mimeType: 'image/png',
		size: 'small',
		pixelDensity: 3,
	})

	return (
		<ErrorBoundary
			getResetKey={() => iconUrl}
			fallback={() => <Icon name="material-error" color="error" />}
		>
			<Suspense fallback={<CircularProgress disableShrink size={30} />}>
				<SuspenseImage
					src={iconUrl}
					alt={t(m.categoryIconAlt, { name: categoryName })}
				/>
			</Suspense>
		</ErrorBoundary>
	)
}

function getFieldsToDisplay(category: Preset, fields: Array<Field>) {
	const result: Array<Field> = []

	for (const { docId } of category.fieldRefs) {
		const match = fields.find((f) => f.docId === docId)

		if (match) {
			result.push(match)
		}
	}

	return result
}

const m = defineMessages({
	navTitle: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.navTitle',
		defaultMessage: 'Observation',
		description: 'Title of the observation details page.',
	},
	categoryIconAlt: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.categoryIconAlt',
		defaultMessage: 'Icon for {name} category',
		description:
			'Alt text for icon image displayed for category (used for accessibility tools).',
	},
	observationCategoryNameFallback: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.observationCategoryNameFallback',
		defaultMessage: 'Observation',
		description: 'Fallback name for observation without a matching category.',
	},
	noLocation: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.noLocation',
		defaultMessage: 'No location',
		description:
			'Fallback for location when observation does not have location specified.',
	},
	notesSectionTitle: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.notesSectionTitle',
		defaultMessage: 'Notes',
		description: 'Title for notes section.',
	},
	detailsSectionTitle: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.detailsSectionTitle',
		defaultMessage: 'Details',
		description: 'Title for details section.',
	},
	fieldAnswerNoAnswer: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.fieldAnswerNoAnswer',
		defaultMessage: 'No answer',
		description: 'Fallback text displayed if field has no meaningful value.',
	},
	fieldAnswerTrue: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.fieldAnswerTrue',
		defaultMessage: 'TRUE',
		description: 'Text displayed if a boolean field is answered with "true"',
	},
	fieldAnswerFalse: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.fieldAnswerFalse',
		defaultMessage: 'FALSE',
		description: 'Text displayed if a boolean field is answered with "false"',
	},
	fieldAnswerNull: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.fieldAnswerNull',
		defaultMessage: 'NULL',
		description: 'Text displayed if a field is answered with "null"',
	},
})
