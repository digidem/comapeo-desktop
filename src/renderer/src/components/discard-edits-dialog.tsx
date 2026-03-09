import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { defineMessages, useIntl } from 'react-intl'

import { Icon } from './icon.tsx'

export function DiscardEditsDialogContent({
	onCancel,
	onConfirm,
}: {
	onCancel: () => void
	onConfirm: () => void
}) {
	const { formatMessage: t } = useIntl()

	return (
		<Stack direction="column">
			<Stack direction="column" gap={10} flex={1} padding={20}>
				<Stack direction="column" alignItems="center" gap={4}>
					<Icon name="material-error" color="error" size={72} />

					<Typography variant="h1" fontWeight={500} textAlign="center">
						{t(m.title)}
					</Typography>
				</Stack>
			</Stack>

			<Stack
				direction="row"
				position="sticky"
				bottom={0}
				display="flex"
				justifyContent="center"
				gap={4}
				padding={6}
			>
				<Button
					fullWidth
					variant="outlined"
					onClick={() => {
						onCancel()
					}}
					sx={{ maxWidth: 400 }}
				>
					{t(m.cancelButton)}
				</Button>

				<Button
					fullWidth
					variant="contained"
					color="error"
					startIcon={<Icon name="material-symbols-delete" />}
					onClick={() => {
						onConfirm()
					}}
					sx={{ maxWidth: 400 }}
				>
					{t(m.confirmButton)}
				</Button>
			</Stack>
		</Stack>
	)
}

const m = defineMessages({
	title: {
		id: 'components.discard-edits-dialog.title',
		defaultMessage: 'Discard Edits?',
		description:
			'Title of dialog displayed when trying to leave page while editing observation.',
	},
	cancelButton: {
		id: 'components.discard-edits-dialog.cancelButton',
		defaultMessage: 'Cancel',
		description: 'Text for button to cancel action.',
	},
	confirmButton: {
		id: 'components.discard-edits-dialog.confirmButton',
		defaultMessage: 'Yes, Discard',
		description: 'Text for button to confirm discarding changes.',
	},
})
