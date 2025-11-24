import { useEffect, useState } from 'react'
import { useSingleDocByDocId, useUpdateDocument } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import CircularProgress from '@mui/material/CircularProgress'
import Fade from '@mui/material/Fade'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { defineMessages, useIntl } from 'react-intl'
import * as v from 'valibot'

import {
	COMAPEO_BLUE,
	GREEN,
	LIGHT_COMAPEO_BLUE,
} from '../../../../../../colors'
import { ErrorDialog } from '../../../../../../components/error-dialog'
import { Icon } from '../../../../../../components/icon'
import { useGlobalEditingStateActions } from '../../../../../../contexts/global-editing-state-store-context'
import { useAppForm } from '../../../../../../hooks/forms'
import { useIconSizeBasedOnTypography } from '../../../../../../hooks/icon'
import { getLocaleStateQueryOptions } from '../../../../../../lib/queries/app-settings'
import { createGlobalMutationsKey } from '../../../../../../lib/queries/global-mutations'

export function ReadOnlyNotesSection({ notes }: { notes?: string }) {
	const { formatMessage: t } = useIntl()

	return (
		<Stack direction="column" paddingInline={6} gap={4}>
			<Typography
				id="notes-section-title"
				component="h2"
				variant="body1"
				textTransform="uppercase"
			>
				{t(m.title)}
			</Typography>

			<Box padding={2}>
				<Typography>
					{notes === undefined || notes.length === 0 ? t(m.noNotes) : notes}
				</Typography>
			</Box>
		</Stack>
	)
}

export function EditableNotesSection({
	observationDocId,
	projectId,
}: {
	observationDocId: string
	projectId: string
}) {
	const { formatMessage: t } = useIntl()

	const iconSize = useIconSizeBasedOnTypography({
		multiplier: 0.6,
		typographyVariant: 'body1',
	})

	const { data: lang } = useSuspenseQuery({
		...getLocaleStateQueryOptions(),
		select: ({ value }) => value,
	})

	const { data: observation, isRefetching: observationIsRefetching } =
		useSingleDocByDocId({
			projectId,
			docType: 'observation',
			docId: observationDocId,
			lang,
		})

	const updateObservationDocument = useUpdateDocument({
		projectId,
		docType: 'observation',
	})

	const updateObservationNotes = useMutation({
		mutationKey: UPDATE_OBSERVATION_NOTES_MUTATION_KEY,
		mutationFn: async ({ notes }: { notes: string }) => {
			return updateObservationDocument.mutateAsync({
				versionId: observation.versionId,
				value: {
					...observation,
					tags: {
						...observation.tags,
						notes,
					},
				},
			})
		},
	})

	const globalEditingStateActions = useGlobalEditingStateActions()

	const [editState, setEditState] = useState<'idle' | 'active' | 'success'>(
		'idle',
	)

	useEffect(() => {
		let timeoutId: number | undefined

		if (editState === 'success') {
			timeoutId = window.setTimeout(() => {
				setEditState('idle')
			}, 5_000)
		}

		return () => {
			if (timeoutId !== undefined) {
				clearTimeout(timeoutId)
			}
		}
	}, [editState, setEditState])

	return (
		<>
			<Stack
				direction="column"
				paddingInline={6}
				gap={4}
				flex={1}
				flexWrap="wrap"
			>
				<Stack direction="row" gap={2}>
					<Typography
						id="notes-section-title"
						component="h2"
						variant="body1"
						textTransform="uppercase"
					>
						{t(m.title)}
					</Typography>

					{updateObservationNotes.status === 'pending' ? (
						<Box display="flex" justifyContent="center" alignItems="center">
							<CircularProgress disableShrink size={iconSize} />
						</Box>
					) : editState === 'success' ? (
						<Icon
							name="material-check-circle-rounded"
							size={iconSize}
							htmlColor={GREEN}
						/>
					) : (
						<Icon
							name="material-edit-filled"
							size={iconSize}
							htmlColor={editState === 'active' ? COMAPEO_BLUE : undefined}
						/>
					)}
				</Stack>

				{editState === 'active' ? (
					<NotesEditor
						initialValue={observation.tags.notes}
						onCancel={() => {
							setEditState('idle')
							globalEditingStateActions.update(false)
						}}
						onSave={async (notes: string) => {
							setEditState('idle')

							try {
								await updateObservationNotes.mutateAsync({ notes })
								setEditState('success')
							} finally {
								globalEditingStateActions.update(false)
							}
						}}
					/>
				) : (
					<Tooltip
						title={t(m.editNotesTooltip)}
						slots={{ transition: Fade }}
						slotProps={{
							tooltip: {
								sx: (theme) => ({
									backgroundColor: theme.palette.common.white,
									color: theme.palette.text.primary,
									boxShadow: theme.shadows[5],
								}),
							},
							popper: {
								disablePortal: true,
								modifiers: [{ name: 'offset', options: { offset: [0, -12] } }],
							},
						}}
					>
						<Box component="span" display="flex">
							<ButtonBase
								disabled={updateObservationNotes.status === 'pending'}
								onClick={() => {
									setEditState('active')
									globalEditingStateActions.update(true)
								}}
								sx={{
									':hover, :focus': {
										backgroundColor: alpha(LIGHT_COMAPEO_BLUE, 0.5),
										transition: (theme) =>
											theme.transitions.create('background-color'),
									},
									':disabled': {
										color: (theme) => theme.palette.text.disabled,
									},
									padding: 2,
									display: 'inline-flex',
									justifyContent: 'flex-start',
									textAlign: 'start',
									borderRadius: 1,
									overflowWrap: 'anywhere',
									flex: 1,
								}}
							>
								{updateObservationNotes.status === 'pending' ||
								(updateObservationNotes.status === 'success' &&
									observationIsRefetching) ? (
									<Typography
										fontStyle={
											updateObservationNotes.variables.notes.length === 0
												? 'italic'
												: undefined
										}
									>
										{updateObservationNotes.variables.notes || t(m.noNotes)}
									</Typography>
								) : observation.tags.notes === undefined ||
								  observation.tags.notes === null ||
								  observation.tags.notes.toString().length === 0 ? (
									<Typography fontStyle="italic">{t(m.noNotes)}</Typography>
								) : (
									<Typography>{observation.tags.notes}</Typography>
								)}
							</ButtonBase>
						</Box>
					</Tooltip>
				)}
			</Stack>

			<ErrorDialog
				open={updateObservationNotes.status === 'error'}
				errorMessage={updateObservationNotes.error?.toString()}
				onClose={() => {
					updateObservationNotes.reset()
				}}
			/>
		</>
	)
}

const NotesEditorSchema = v.object({
	notes: v.pipe(v.string(), v.trim()),
})

const UPDATE_OBSERVATION_NOTES_MUTATION_KEY = createGlobalMutationsKey([
	'observation',
	'notes',
	'update',
])

const FORM_ID = 'observation-notes-editor-form'

function NotesEditor({
	initialValue,
	onCancel,
	onSave,
}: {
	initialValue: unknown
	onCancel: () => void
	onSave: (notes: string) => Promise<void>
}) {
	const { formatMessage: t } = useIntl()

	const form = useAppForm({
		defaultValues: { notes: initialValue?.toString() || '' },
		validators: { onChange: NotesEditorSchema },
		onSubmit: async ({ value }) => {
			const parsedValue = v.parse(NotesEditorSchema, value)
			await onSave(parsedValue.notes)
		},
	})

	return (
		<Box
			component="form"
			id={FORM_ID}
			onSubmit={(event) => {
				event.preventDefault()
				if (form.state.isSubmitting) return
				form.handleSubmit()
			}}
		>
			<Stack direction="column" gap={4}>
				<form.AppField name="notes">
					{(field) => (
						<field.TextField
							fullWidth
							multiline
							aria-label={t(m.accessibleNotesInputLabel)}
							autoFocus
							onFocus={(event) => {
								if (field.state.value) {
									event.target.setSelectionRange(
										field.state.value.length,
										field.state.value.length,
									)
								}
							}}
							value={field.state.value}
							error={!field.state.meta.isValid}
							name={field.name}
							onChange={(event) => {
								field.handleChange(event.target.value)
							}}
							onBlur={field.handleBlur}
						/>
					)}
				</form.AppField>

				<Stack direction="row" justifyContent="space-between" gap={2}>
					<form.Subscribe selector={(state) => state.isSubmitting}>
						{(isSubmitting) => (
							<>
								<form.SubmitButton
									type="submit"
									fullWidth
									sx={{ maxWidth: 400 }}
									loadingPosition="start"
									loading={isSubmitting}
									endIcon={
										<Icon name="material-check-circle-outline-rounded" />
									}
								>
									{t(m.saveButtonText)}
								</form.SubmitButton>

								<Button
									type="button"
									variant="outlined"
									fullWidth
									sx={{ maxWidth: 400 }}
									onClick={() => {
										if (isSubmitting) {
											return
										}

										onCancel()
									}}
								>
									{t(m.cancelButtonText)}
								</Button>
							</>
						)}
					</form.Subscribe>
				</Stack>
			</Stack>
		</Box>
	)
}

const m = defineMessages({
	title: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.-notes-section.title',
		defaultMessage: 'Notes',
		description: 'Title for notes section.',
	},
	noNotes: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.-notes-section.noNotes',
		defaultMessage: 'No notes.',
		description: 'Text for when notes are empty.',
	},
	accessibleNotesInputLabel: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.-notes-section.accessibleNotesInputLabel',
		defaultMessage: 'Notes',
		description: 'Accessible label for notes input field.',
	},
	saveButtonText: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.-notes-section.saveButtonText',
		defaultMessage: 'Save',
		description: 'Text for save button.',
	},
	cancelButtonText: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.-notes-section.cancelButtonText',
		defaultMessage: 'Cancel',
		description: 'Text for cancel button.',
	},
	editNotesTooltip: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.-notes-section.editNotesTooltip',
		defaultMessage: 'Click to Edit',
		description: 'Text for tooltip when hovering over notes.',
	},
})
