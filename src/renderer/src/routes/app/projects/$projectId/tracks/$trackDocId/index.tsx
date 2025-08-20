import { Suspense, useMemo } from 'react'
import {
	useDocumentCreatedBy,
	useManyDocs,
	useOwnDeviceInfo,
	useSingleDocByDocId,
} from '@comapeo/core-react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLACK, BLUE_GREY, COMAPEO_BLUE } from '../../../../../../colors'
import {
	CategoryIconContainer,
	CategoryIconImage,
} from '../../../../../../components/category-icon'
import { Icon } from '../../../../../../components/icon'
import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	getMatchingCategoryForDocument,
} from '../../../../../../lib/comapeo'
import { getLocaleStateQueryOptions } from '../../../../../../lib/queries/app-settings'

export const Route = createFileRoute(
	'/app/projects/$projectId/tracks/$trackDocId/',
)({
	loader: async ({ context, params }) => {
		const {
			projectApi,
			queryClient,
			localeState: { value: lang },
		} = context
		const { projectId, trackDocId } = params

		try {
			// TODO: Not ideal but requires changes to core-react
			await queryClient.ensureQueryData({
				queryKey: [
					COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
					'projects',
					projectId,
					'track',
					trackDocId,
					{ lang },
				],
				queryFn: async () => {
					return projectApi.track.getByDocId(trackDocId, { lang })
				},
			})
		} catch {
			throw notFound()
		}

		// TODO: Not ideal but requires changes to core-react
		await queryClient.ensureQueryData({
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
		})
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t, formatDate } = useIntl()

	const router = useRouter()

	const { projectId, trackDocId } = Route.useParams()

	const { data: lang } = useSuspenseQuery({
		...getLocaleStateQueryOptions(),
		select: ({ value }) => value,
	})

	const { data: track } = useSingleDocByDocId({
		projectId,
		docType: 'track',
		docId: trackDocId,
		lang,
	})

	const { data: categories } = useManyDocs({
		projectId,
		docType: 'preset',
		lang,
	})

	const category = getMatchingCategoryForDocument(track, categories)

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

			<Box overflow="auto" flex={1}>
				<Stack direction="column" paddingBlock={6} gap={6}>
					<Box paddingInline={6}>
						<Typography>
							{formatDate(track.createdAt, {
								year: 'numeric',
								month: 'short',
								day: '2-digit',
								minute: '2-digit',
								hour: '2-digit',
								hourCycle: 'h12',
							})}
						</Typography>
					</Box>
					<Stack direction="column" paddingInline={6}>
						<Box border={`1px solid ${BLUE_GREY}`} borderRadius={2}>
							<Stack direction="row" alignItems="center" gap={4} padding={4}>
								{category ? (
									<CategoryIconContainer
										color={category.color || BLUE_GREY}
										applyBoxShadow
									>
										{category.iconRef?.docId ? (
											<CategoryIconImage
												altText={t(m.categoryIconAlt, {
													name: category.name || t(m.tracks),
												})}
												iconDocumentId={category.iconRef.docId}
												projectId={projectId}
												imageStyle={{ width: 48, aspectRatio: 1 }}
											/>
										) : (
											<Icon name="material-hiking" size={40} />
										)}
									</CategoryIconContainer>
								) : (
									<CategoryIconContainer color={BLACK} applyBoxShadow>
										<Icon name="material-hiking" size={40} />
									</CategoryIconContainer>
								)}

								<Typography variant="h2" fontWeight={500}>
									{t(m.tracks)}
								</Typography>
							</Stack>
						</Box>
					</Stack>
					<Stack direction="column" paddingInline={6} gap={4}>
						<Typography
							component="h2"
							variant="body1"
							textTransform="uppercase"
						>
							{t(m.descriptionSectionTitle)}
						</Typography>

						<Typography>{track.tags.notes}</Typography>
					</Stack>

					<Stack direction="column" gap={2} overflow="auto"></Stack>
				</Stack>

				<Divider />

				<Stack direction="column" flex={1}>
					<Box padding={6}>
						<Typography
							component="h2"
							variant="body1"
							textTransform="uppercase"
						>
							{t(m.observationsSectionTitle, {
								count: track.observationRefs.length,
							})}
						</Typography>
					</Box>

					<Suspense
						fallback={
							<Box
								display="flex"
								flexDirection="column"
								justifyContent="center"
								alignItems="center"
							>
								<CircularProgress disableShrink size={40} />
							</Box>
						}
					>
						<TrackObservationsList
							projectId={projectId}
							trackObservationDocIds={track.observationRefs.map(
								({ docId }) => docId,
							)}
							lang={lang}
						/>
					</Suspense>
				</Stack>
			</Box>
		</Stack>
	)
}

const CATEGORY_CONTAINER_SIZE_PX = 64

function TrackObservationsList({
	projectId,
	trackObservationDocIds,
	lang,
}: {
	projectId: string
	trackObservationDocIds: Array<string>
	lang: string
}) {
	const { formatMessage: t, formatDate } = useIntl()
	const navigate = Route.useNavigate()

	const { data: allObservations } = useManyDocs({
		projectId,
		docType: 'observation',
		lang,
	})

	const { data: categories } = useManyDocs({
		projectId,
		docType: 'preset',
		lang,
	})

	const trackObservations = useMemo(() => {
		return allObservations
			.filter((o) => trackObservationDocIds.includes(o.docId))
			.map((o) => {
				return {
					document: o,
					category: getMatchingCategoryForDocument(o, categories),
				}
			})
			.sort((a, b) => {
				return a.document.createdAt < b.document.createdAt ? 1 : -1
			})
	}, [allObservations, categories, trackObservationDocIds])

	return (
		<List component="ul" disablePadding>
			{trackObservations.map(({ document, category }) => {
				const { createdAt, docId, originalVersionId } = document

				const title = category?.name || t(m.observationCategoryNameFallback)

				return (
					<ListItemButton
						key={docId}
						disableGutters
						disableTouchRipple
						onClick={() => {
							navigate({
								to: '/app/projects/$projectId/observations/$observationDocId',
								params: { observationDocId: docId },
							})
						}}
						sx={{ paddingInline: 6, paddingBlock: 4 }}
					>
						<Suspense>
							<SyncedIndicatorLine
								projectId={projectId}
								originalVersionId={originalVersionId}
							/>
						</Suspense>

						<Stack direction="row" flex={1} gap={2} overflow="auto">
							<Stack
								direction="column"
								flex={1}
								justifyContent="center"
								overflow="hidden"
							>
								<Typography
									fontWeight={500}
									textOverflow="ellipsis"
									whiteSpace="nowrap"
									overflow="hidden"
								>
									{title}
								</Typography>

								<Typography
									textOverflow="ellipsis"
									whiteSpace="nowrap"
									overflow="hidden"
								>
									{formatDate(createdAt, {
										year: 'numeric',
										month: 'short',
										day: '2-digit',
										minute: '2-digit',
										hour: '2-digit',
										hourCycle: 'h12',
									})}
								</Typography>
							</Stack>

							<Box
								display="flex"
								justifyContent="center"
								alignItems="center"
								width={CATEGORY_CONTAINER_SIZE_PX}
								sx={{ aspectRatio: 1 }}
							>
								<Box flex={1}>
									<Suspense
										fallback={
											<Box
												display="flex"
												justifyContent="center"
												alignItems="center"
											>
												<CircularProgress disableShrink size={30} />
											</Box>
										}
									>
										{category?.iconRef?.docId ? (
											<CategoryIconContainer
												color={category.color || BLUE_GREY}
											>
												<CategoryIconImage
													projectId={projectId}
													iconDocumentId={category.iconRef.docId}
													altText={t(m.categoryIconAlt, {
														name: category?.name || t(m.tracks),
													})}
													imageStyle={{ width: '100%', aspectRatio: 1 }}
												/>
											</CategoryIconContainer>
										) : (
											<CategoryIconContainer color={BLACK}>
												<Icon name="material-hiking" size={40} />
											</CategoryIconContainer>
										)}
									</Suspense>
								</Box>
							</Box>
						</Stack>
					</ListItemButton>
				)
			})}
		</List>
	)
}

function SyncedIndicatorLine({
	projectId,
	originalVersionId,
}: {
	projectId: string
	originalVersionId: string
}) {
	const { data: ownDeviceInfo } = useOwnDeviceInfo()

	const { data: createdBy } = useDocumentCreatedBy({
		projectId,
		originalVersionId,
	})

	return ownDeviceInfo.deviceId !== createdBy ? (
		<Box
			position="absolute"
			width={8}
			left={0}
			bottom={0}
			top={0}
			bgcolor={COMAPEO_BLUE}
		/>
	) : null
}

const m = defineMessages({
	navTitle: {
		id: 'routes.app.projects.$projectId.tracks.$trackDocId.index.navTitle',
		defaultMessage: 'Track',
		description: 'Displayed title.',
	},
	descriptionSectionTitle: {
		id: 'routes.app.projects.$projectId.tracks.$trackDocId.index.descriptionSectionTitle',
		defaultMessage: 'Description',
		description: 'Title for description section.',
	},
	tracks: {
		id: 'routes.app.projects.$projectId.tracks.$trackDocId.index.tracks',
		defaultMessage: 'Tracks',
		description: 'Displayed title next to category icon.',
	},
	observationsSectionTitle: {
		id: 'routes.app.projects.$projectId.tracks.$trackDocId.index.observationsSectionTitle',
		defaultMessage:
			'{count, plural, one {# Observation} other {# Observations}}',
		description: 'Title for the track observations section.',
	},
	observationCategoryNameFallback: {
		id: 'routes.app.projects.$projectId.tracks.$trackDocId.index.observationCategoryNameFallback',
		defaultMessage: 'Observation',
		description: 'Fallback name for observation without a matching category.',
	},
	categoryIconAlt: {
		id: 'routes.app.projects.$projectId.tracks.$trackDocId.index.categoryIconAlt',
		defaultMessage: 'Icon for {name} category',
		description:
			'Alt text for icon image displayed for category (used for accessibility tools).',
	},
})
