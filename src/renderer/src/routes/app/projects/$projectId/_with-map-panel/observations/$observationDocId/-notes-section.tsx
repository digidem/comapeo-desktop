import { useSingleDocByDocId, useUpdateDocument } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { captureException } from '@sentry/react'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { defineMessages, useIntl } from 'react-intl'
import * as v from 'valibot'

import { DecentDialog } from '../../../../../../../components/decent-dialog.tsx'
import { ErrorDialogContent } from '../../../../../../../components/error-dialog.tsx'
import { Icon } from '../../../../../../../components/icon.tsx'
import { useAppForm } from '../../../../../../../hooks/forms.ts'
import { getLocaleStateQueryOptions } from '../../../../../../../lib/queries/app-settings.ts'
import { createGlobalMutationsKey } from '../../../../../../../lib/queries/global-mutations.ts'
import { EditableSection } from './-components/editable-section.tsx'

export function ReadOnlyNotesSection({ notes }: { notes?: string }) {
	const intl = useIntl()

	return (
		<Stack direction="column" sx={{ paddingInline: 6, gap: 4 }}>
			<Typography component="h2" variant="sectionLabel">
				{intl.formatMessage(m.notesSectionTitle)}
			</Typography>

			<Box sx={{ padding: 2 }}>
				<Typography color="textTertiary">
					{notes === undefined || notes.length === 0
						? intl.formatMessage(m.notesSectionNoNotes)
						: notes}
				</Typography>
			</Box>
		</Stack>
	)
}

export function EditableNotesSection({
	disabled,
	observationDocId,
	onStartEditMode,
	onStopEditMode,
	projectId,
}: {
	disabled?: boolean
	observationDocId: string
	onStartEditMode: () => void
	onStopEditMode: () => void
	projectId: string
}) {
	const intl = useIntl()

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

	const updateObservationNotesMutationKey = createGlobalMutationsKey([
		'observations',
		observationDocId,
		'edit',
		'notes',
	])

	const updateObservationNotes = useMutation({
		mutationKey: updateObservationNotesMutationKey,
		mutationFn: async ({ notes }: { notes: string }) => {
			return updateObservationDocument.mutateAsync({
				versionId: observation.versionId,
				value: { ...observation, tags: { ...observation.tags, notes } },
			})
		},
	})

	return (
		<>
			<Box sx={{ paddingInline: 6 }}>
				<EditableSection
					disabled={disabled}
					sectionTitle={
						<Typography variant="sectionLabel">
							{intl.formatMessage(m.notesSectionTitle)}
						</Typography>
					}
					tooltipText={intl.formatMessage(m.notesSectionEditNotes)}
					editIsPending={updateObservationNotes.status === 'pending'}
					onStartEditMode={onStartEditMode}
					renderWhenEditing={({ updateEditState }) => (
						<NotesEditor
							initialValue={observation.tags.notes}
							onCancel={() => {
								updateEditState('idle')
								onStopEditMode()
							}}
							onSave={async (notes: string) => {
								updateEditState('idle')

								try {
									await updateObservationNotes.mutateAsync({ notes })
									updateEditState('success')
								} catch (err) {
									captureException(err)
								}

								onStopEditMode()
							}}
						/>
					)}
					renderWhenIdle={
						updateObservationNotes.status === 'pending' ||
						(updateObservationNotes.status === 'success' &&
							observationIsRefetching) ? (
							<Typography
								color={
									updateObservationNotes.variables.notes
										? 'textSecondary'
										: 'textTertiary'
								}
								sx={{
									fontStyle: updateObservationNotes.variables.notes
										? 'italic'
										: undefined,
								}}
							>
								{updateObservationNotes.variables.notes ||
									intl.formatMessage(m.notesSectionNoNotes)}
							</Typography>
						) : observation.tags.notes === undefined ||
						  observation.tags.notes === null ||
						  observation.tags.notes.toString().length === 0 ? (
							<Typography color="textTertiary" sx={{ fontStyle: 'italic' }}>
								{intl.formatMessage(m.notesSectionNoNotes)}
							</Typography>
						) : (
							<Typography color="textSecondary">
								{observation.tags.notes}
							</Typography>
						)
					}
				/>
			</Box>

			<DecentDialog
				fullWidth
				maxWidth="sm"
				value={
					updateObservationNotes.status === 'error'
						? updateObservationNotes.error
						: null
				}
			>
				{(error) => (
					<ErrorDialogContent
						errorMessage={error.toString()}
						onClose={() => {
							updateObservationNotes.reset()
						}}
					/>
				)}
			</DecentDialog>
		</>
	)
}

const NotesEditorSchema = v.object({ notes: v.pipe(v.string(), v.trim()) })

function NotesEditor({
	initialValue,
	onCancel,
	onSave,
}: {
	initialValue: unknown
	onCancel: () => void
	onSave: (notes: string) => Promise<void>
}) {
	const intl = useIntl()

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
			onSubmit={(event) => {
				event.preventDefault()
				if (form.state.isSubmitting) return
				form.handleSubmit()
			}}
		>
			<Stack direction="column" sx={{ gap: 4 }}>
				<form.AppField name="notes">
					{(field) => (
						<TextField
							fullWidth
							multiline
							aria-label={intl.formatMessage(
								m.notesSectionAccessibleNotesInputLabel,
							)}
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

				<Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
					<form.Subscribe selector={(state) => state.isSubmitting}>
						{(isSubmitting) => (
							<>
								<Button
									type="submit"
									fullWidth
									loadingPosition="start"
									loading={isSubmitting}
									startIcon={
										<Icon name="material-check-circle-outline-rounded" />
									}
								>
									{intl.formatMessage(m.notesSectionSave)}
								</Button>

								<Button
									type="button"
									variant="outlined"
									fullWidth
									onClick={() => {
										if (isSubmitting) {
											return
										}

										onCancel()
									}}
								>
									{intl.formatMessage(m.notesSectionCancel)}
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
	notesSectionTitle: {
		id: '$1.routes.app.projects.$projectId.observations.$observationDocId.notesSectionTitle',
		defaultMessage: 'Notes',
		description: 'Title for notes section.',
	},
	notesSectionNoNotes: {
		id: '$1.routes.app.projects.$projectId.observations.$observationDocId.notesSectionNoNotes',
		defaultMessage: 'No notes.',
		description: 'Text for when notes are empty.',
	},
	notesSectionAccessibleNotesInputLabel: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.notesSectionAccessibleNotesInputLabel',
		defaultMessage: 'Notes',
		description: 'Accessible label for notes input field.',
	},
	notesSectionSave: {
		id: '$1.routes.app.projects.$projectId.observations.$observationDocId.notesSectionSave',
		defaultMessage: 'Save',
		description: 'Text for save button.',
	},
	notesSectionCancel: {
		id: '$1.routes.app.projects.$projectId.observations.$observationDocId.notesSectionCancel',
		defaultMessage: 'Cancel',
		description: 'Text for cancel button.',
	},
	notesSectionEditNotes: {
		id: '$1.routes.app.projects.$projectId.observations.$observationDocId.notesSectionEditNotes',
		defaultMessage: 'Click to Edit',
		description: 'Text for tooltip when hovering over notes.',
	},
})
