import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { defineMessages, useIntl } from 'react-intl'
import * as v from 'valibot'

import { Icon } from '../../../../../../components/icon'
import { useAppForm } from '../../../../../../hooks/forms'
import {
	getDisplayedTagValue,
	type EditableMultiSelectField,
	type EditableNumberField,
	type EditableSingleSelectField,
	type EditableTextField,
} from './-shared'

const TextFieldEditorSchema = v.object({
	answer: v.union([v.undefined(), v.pipe(v.string(), v.trim())]),
})

export function TextFieldEditor({
	field,
	initialValue,
	onCancel,
	onSave,
}: {
	field: EditableTextField
	initialValue: string | undefined
	onCancel: () => void
	onSave: (value: string | undefined) => Promise<void>
}) {
	const { formatMessage: t } = useIntl()

	const form = useAppForm({
		defaultValues: { answer: initialValue },
		validators: { onChange: TextFieldEditorSchema },
		onSubmit: async ({ value }) => {
			const parsedValue = v.parse(TextFieldEditorSchema, value)

			await onSave(parsedValue.answer)
		},
	})

	return (
		<Stack
			direction="column"
			gap={4}
			component="form"
			id={`${field.label}-form`}
			onSubmit={(event) => {
				event.preventDefault()
				if (form.state.isSubmitting) return
				form.handleSubmit()
			}}
		>
			<form.AppField name="answer">
				{(formField) => (
					<TextField
						fullWidth
						multiline={field.appearance !== 'singleline'}
						aria-label={field.label}
						autoFocus
						onFocus={(event) => {
							if (formField.state.value) {
								event.target.setSelectionRange(
									formField.state.value.length,
									formField.state.value.length,
								)
							}
						}}
						value={formField.state.value}
						error={!formField.state.meta.isValid}
						name={formField.name}
						onChange={(event) => {
							formField.handleChange(event.target.value)
						}}
						onBlur={formField.handleBlur}
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
								endIcon={<Icon name="material-check-circle-outline-rounded" />}
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
	)
}

const NumberFieldEditorSchema = v.object({
	answer: v.union([
		v.undefined(),
		v.pipe(v.string(), v.minLength(1), v.trim(), v.digits(), v.toNumber()),
	]),
})

export function NumberFieldEditor({
	field,
	initialValue,
	onCancel,
	onSave,
}: {
	field: EditableNumberField
	initialValue: number | undefined
	onCancel: () => void
	onSave: (value: number | undefined) => Promise<void>
}) {
	const { formatMessage: t } = useIntl()

	const form = useAppForm({
		defaultValues: { answer: initialValue?.toString() },
		validators: { onChange: NumberFieldEditorSchema },
		onSubmit: async ({ value }) => {
			const parsedValue = v.parse(NumberFieldEditorSchema, value)
			await onSave(parsedValue.answer)
		},
	})

	return (
		<Stack
			direction="column"
			gap={4}
			component="form"
			id={`${field.label}-form`}
			onSubmit={(event) => {
				event.preventDefault()
				if (form.state.isSubmitting) return
				form.handleSubmit()
			}}
		>
			<form.AppField name="answer">
				{(formField) => (
					<TextField
						fullWidth
						aria-label={field.label}
						autoFocus
						onFocus={(event) => {
							if (formField.state.value) {
								event.target.setSelectionRange(
									formField.state.value.length,
									formField.state.value.length,
								)
							}
						}}
						value={formField.state.value}
						error={!formField.state.meta.isValid}
						name={formField.name}
						onBlur={formField.handleBlur}
						inputMode="numeric"
						onChange={(event) => {
							if (
								event.target.value === '' ||
								v.is(v.pipe(v.string(), v.digits()), event.target.value)
							) {
								formField.handleChange(event.target.value)
							}
						}}
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
								endIcon={<Icon name="material-check-circle-outline-rounded" />}
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
	)
}

export function SingleSelectFieldEditor({
	field,
	initialValue,
	onCancel,
	onSave,
}: {
	field: EditableSingleSelectField
	initialValue: string | boolean | number | null | undefined
	onCancel: () => void
	onSave: (value: string | boolean | number | null | undefined) => Promise<void>
}) {
	const { formatMessage: t } = useIntl()

	const form = useAppForm({
		defaultValues: { answer: initialValue },
		onSubmit: async ({ value }) => {
			await onSave(value.answer)
		},
	})

	return (
		<Stack
			direction="column"
			gap={4}
			component="form"
			id={`${field.label}-form`}
			onSubmit={(event) => {
				event.preventDefault()
				if (form.state.isSubmitting) return
				form.handleSubmit()
			}}
		>
			<form.AppField name="answer">
				{(formField) => {
					const shouldShowOptionForInitialValue =
						initialValue !== undefined &&
						!(
							typeof initialValue === 'string' &&
							initialValue.trim().length === 0
						) &&
						!field.options.some((o) => o.value === initialValue)

					return (
						<FormControl>
							<RadioGroup>
								{shouldShowOptionForInitialValue ? (
									<FormControlLabel
										value={initialValue}
										checked={formField.state.value === initialValue}
										onChange={(event) => {
											formField.handleChange(
												(event.target as HTMLInputElement).value,
											)
										}}
										onBlur={formField.handleBlur}
										control={<Radio />}
										label={getDisplayedTagValue({
											tagValue: initialValue,
											formatMessage: t,
										})}
									/>
								) : null}

								{field.options.map((option) => (
									<FormControlLabel
										key={option.label}
										value={option.value}
										checked={formField.state.value === option.value}
										onChange={(event) => {
											formField.handleChange(
												(event.target as HTMLInputElement).value,
											)
										}}
										onBlur={formField.handleBlur}
										control={<Radio />}
										label={option.label}
									/>
								))}
							</RadioGroup>
						</FormControl>
					)
				}}
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
								endIcon={<Icon name="material-check-circle-outline-rounded" />}
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
	)
}

export function MultiSelectFieldEditor({
	field,
	initialValue,
	onCancel,
	onSave,
}: {
	field: EditableMultiSelectField
	initialValue: Array<string | boolean | number | null>
	onCancel: () => void
	onSave: (value: Array<string | boolean | number | null>) => Promise<void>
}) {
	const { formatMessage: t } = useIntl()

	const defaultValues: Record<string, boolean> = {}

	for (const option of field.options) {
		const selected = initialValue.includes(option.value)
		defaultValues[option.label] = selected
	}

	const form = useAppForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			const answers = []

			for (const [label, checked] of Object.entries(value)) {
				if (checked) {
					answers.push(field.options.find((o) => o.label === label)!.value)
				}
			}

			await onSave(answers)
		},
	})

	return (
		<Stack
			direction="column"
			gap={4}
			component="form"
			id={`${field.label}-form`}
			onSubmit={(event) => {
				event.preventDefault()
				if (form.state.isSubmitting) return
				form.handleSubmit()
			}}
		>
			<FormGroup>
				{field.options.map((option) => (
					<form.AppField name={option.label} key={option.label}>
						{(formField) => (
							<FormControlLabel
								key={option.label}
								value={option.value}
								checked={formField.state.value}
								onChange={(_event, checked) => {
									formField.handleChange(checked)
								}}
								onBlur={formField.handleBlur}
								control={<Checkbox />}
								label={option.label}
							/>
						)}
					</form.AppField>
				))}
			</FormGroup>

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
								endIcon={<Icon name="material-check-circle-outline-rounded" />}
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
	)
}

const m = defineMessages({
	saveButtonText: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.-field-editors.saveButtonText',
		defaultMessage: 'Save',
		description: 'Text for save button.',
	},
	cancelButtonText: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.-field-editors.cancelButtonText',
		defaultMessage: 'Cancel',
		description: 'Text for cancel button.',
	},
})
