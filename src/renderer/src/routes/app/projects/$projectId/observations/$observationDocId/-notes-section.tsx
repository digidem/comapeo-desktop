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

import { ErrorDialog } from '../../../../../../components/error-dialog'
import { Icon } from '../../../../../../components/icon'
import { useAppForm } from '../../../../../../hooks/forms'
import { getLocaleStateQueryOptions } from '../../../../../../lib/queries/app-settings'
import { createGlobalMutationsKey } from '../../../../../../lib/queries/global-mutations'
import { EditableSection } from './-components/editable-section'

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
	const { formatMessage: t } = useIntl()

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
				value: {
					...observation,
					tags: { ...observation.tags, notes },
				},
			})
		},
	})

	return (
		<>
			<Box paddingInline={6}>
				<EditableSection
					disabled={disabled}
					sectionTitle={
						<Typography variant="inherit" textTransform="uppercase">
							{t(m.title)}
						</Typography>
					}
					tooltipText={t(m.editNotesTooltip)}
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
								} finally {
									onStopEditMode()
								}
							}}
						/>
					)}
					renderWhenIdle={
						updateObservationNotes.status === 'pending' ||
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
						)
					}
				/>
			</Box>

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
						<TextField
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
								<Button
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
								</Button>

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
