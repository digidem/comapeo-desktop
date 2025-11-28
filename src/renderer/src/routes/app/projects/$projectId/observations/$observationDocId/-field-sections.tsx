import { useSingleDocByDocId, useUpdateDocument } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { defineMessages, useIntl } from 'react-intl'

import { ErrorDialog } from '../../../../../../components/error-dialog'
import {
	type ObservationTagValue,
	type TagValue,
} from '../../../../../../lib/comapeo'
import { getLocaleStateQueryOptions } from '../../../../../../lib/queries/app-settings'
import { createGlobalMutationsKey } from '../../../../../../lib/queries/global-mutations'
import { EditableSection } from './-components/editable-section'
import {
	MultiSelectFieldEditor,
	NumberFieldEditor,
	SingleSelectFieldEditor,
	TextFieldEditor,
} from './-field-editors'
import { getDisplayedTagValue, type EditableField } from './shared'

export function ReadOnlyFieldSection({
	label,
	value,
}: {
	label: string
	value: string | undefined
}) {
	const { formatMessage: t } = useIntl()

	return (
		<Stack direction="column" gap={2}>
			<Typography component="h3" variant="body1" fontWeight={450}>
				{label}
			</Typography>

			<Box padding={2}>
				<Typography fontStyle={value ? undefined : 'italic'}>
					{value || t(m.fieldAnswerNoAnswer)}
				</Typography>
			</Box>
		</Stack>
	)
}

export function EditableFieldSection({
	disabled,
	field,
	initialTagValue,
	observationDocId,
	onStartEditMode,
	onStopEditMode,
	projectId,
}: {
	disabled?: boolean
	field: EditableField
	initialTagValue: TagValue | undefined
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

	const { data: observation, isRefetching: observationsIsRefetching } =
		useSingleDocByDocId({
			projectId,
			docId: observationDocId,
			docType: 'observation',
			lang,
		})

	const updateObservationDocument = useUpdateDocument({
		projectId,
		docType: 'observation',
	})

	const updateObservationFieldMutationKey = createGlobalMutationsKey([
		'observations',
		observationDocId,
		'edit',
		'fields',
		field.docId,
		'update',
	])

	const updateObservationField = useMutation({
		mutationKey: updateObservationFieldMutationKey,
		mutationFn: async ({ value }: { value: ObservationTagValue }) => {
			return updateObservationDocument.mutateAsync({
				versionId: observation.versionId,
				value: {
					...observation,
					tags: { ...observation.tags, [field.tagKey]: value },
				},
			})
		},
	})

	const displayedReadOnlyTagValue =
		initialTagValue === undefined
			? undefined
			: getDisplayedTagValue({
					tagValue: initialTagValue,
					formatMessage: t,
					selectionOptions:
						field.type === 'selectOne' || field.type === 'selectMultiple'
							? field.options
							: undefined,
				})

	return (
		<>
			<EditableSection
				disabled={disabled}
				onStartEditMode={onStartEditMode}
				editIsPending={updateObservationField.status === 'pending'}
				renderWhenEditing={({ updateEditState }) => {
					function onCancel() {
						updateEditState('idle')
						onStopEditMode()
					}

					switch (field.type) {
						case 'text': {
							if (
								initialTagValue !== undefined &&
								typeof initialTagValue !== 'string'
							) {
								throw new Error(
									`Expected string type for initial tag value. Received ${typeof initialTagValue}`,
								)
							}

							return (
								<TextFieldEditor
									field={field}
									onCancel={onCancel}
									initialValue={initialTagValue}
									onSave={async (value) => {
										updateEditState('idle')

										try {
											if (value !== undefined) {
												await updateObservationField.mutateAsync({ value })
											}
											updateEditState('success')
										} finally {
											onStopEditMode()
										}
									}}
								/>
							)
						}
						case 'number': {
							if (
								initialTagValue !== undefined &&
								typeof initialTagValue !== 'number'
							) {
								throw new Error(
									`Expected number type for initial tag value. Received ${typeof initialTagValue}`,
								)
							}

							return (
								<NumberFieldEditor
									field={field}
									initialValue={initialTagValue}
									onCancel={onCancel}
									onSave={async (value) => {
										updateEditState('idle')

										try {
											if (value !== undefined) {
												await updateObservationField.mutateAsync({ value })
											}
											updateEditState('success')
										} finally {
											onStopEditMode()
										}
									}}
								/>
							)
						}
						case 'selectOne': {
							if (
								initialTagValue !== undefined &&
								Array.isArray(initialTagValue)
							) {
								throw new Error(
									'Expected non-array type for initial tag value.',
								)
							}

							return (
								<SingleSelectFieldEditor
									field={field}
									initialValue={initialTagValue}
									onCancel={onCancel}
									onSave={async (value) => {
										updateEditState('idle')

										try {
											if (value !== undefined) {
												await updateObservationField.mutateAsync({ value })
											}
											updateEditState('success')
										} finally {
											onStopEditMode()
										}
									}}
								/>
							)
						}
						case 'selectMultiple': {
							if (
								initialTagValue !== undefined &&
								!Array.isArray(initialTagValue)
							) {
								throw new Error(
									`Expected array value for initial tag value. Received ${typeof initialTagValue}`,
								)
							}

							return (
								<MultiSelectFieldEditor
									field={field}
									initialValue={
										initialTagValue === undefined ? [] : initialTagValue
									}
									onCancel={onCancel}
									onSave={async (value) => {
										updateEditState('idle')

										try {
											await updateObservationField.mutateAsync({ value })
											updateEditState('success')
										} finally {
											onStopEditMode()
										}
									}}
								/>
							)
						}
					}
				}}
				sectionTitle={
					<Typography component="span" variant="inherit" fontWeight={450}>
						{field.label}
					</Typography>
				}
				tooltipText={t(m.editNotesTooltip)}
				renderWhenIdle={() => {
					if (
						updateObservationField.status === 'pending' ||
						(updateObservationField.status === 'success' &&
							observationsIsRefetching)
					) {
						const displayedVariableValue = getDisplayedTagValue({
							tagValue: updateObservationField.variables.value,
							formatMessage: t,
							selectionOptions:
								field.type === 'selectOne' || field.type === 'selectMultiple'
									? field.options
									: undefined,
						})

						return (
							<Typography
								fontStyle={displayedVariableValue ? undefined : 'italic'}
							>
								{displayedVariableValue || t(m.fieldAnswerNoAnswer)}
							</Typography>
						)
					}

					return (
						<Typography
							fontStyle={displayedReadOnlyTagValue ? undefined : 'italic'}
						>
							{displayedReadOnlyTagValue || t(m.fieldAnswerNoAnswer)}
						</Typography>
					)
				}}
			/>

			<ErrorDialog
				open={updateObservationField.status === 'error'}
				errorMessage={updateObservationField.error?.toString()}
				onClose={() => {
					updateObservationField.reset()
				}}
			/>
		</>
	)
}

const m = defineMessages({
	fieldAnswerNoAnswer: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.-field-sections.fieldAnswerNoAnswer',
		defaultMessage: 'No answer',
		description: 'Fallback text displayed if field has no meaningful value.',
	},
	editNotesTooltip: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.-field-sections.editNotesTooltip',
		defaultMessage: 'Click to Edit',
		description: 'Text for tooltip when hovering over notes.',
	},
})
