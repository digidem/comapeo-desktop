import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { defineMessages, useIntl } from 'react-intl'

import { useIconSizeBasedOnTypography } from '../hooks/icon.ts'
import { Icon } from './icon.tsx'

export function DiscardEditsDialogContent({
	onCancel,
	onConfirm,
}: {
	onCancel: () => void
	onConfirm: () => void
}) {
	const intl = useIntl()

	const heroIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'heroHeader',
		multiplier: 3,
	})

	return (
		<Stack direction="column" sx={{ overflow: 'auto' }}>
			<Stack
				direction="column"
				sx={{ gap: 10, flex: 1, overflow: 'auto', padding: 20 }}
			>
				<Stack direction="column" sx={{ alignItems: 'center', gap: 4 }}>
					<Icon name="material-error" color="error" size={heroIconSize} />

					<Typography variant="heroHeader" sx={{ textAlign: 'center' }}>
						{intl.formatMessage(m.title)}
					</Typography>
				</Stack>
			</Stack>

			<Stack
				direction="row"
				sx={{ flexWrap: 'wrap', gap: 4, justifyContent: 'center', padding: 6 }}
			>
				<Button
					fullWidth
					variant="outlined"
					onClick={() => {
						onCancel()
					}}
				>
					{intl.formatMessage(m.cancelButton)}
				</Button>

				<Button
					fullWidth
					variant="contained"
					color="error"
					startIcon={<Icon name="material-symbols-delete" />}
					onClick={() => {
						onConfirm()
					}}
				>
					{intl.formatMessage(m.confirmButton)}
				</Button>
			</Stack>
		</Stack>
	)
}

const m = defineMessages({
	title: {
		id: '$1.components.discard-edits-dialog.title',
		defaultMessage: 'Discard Edits?',
		description:
			'Title of dialog displayed when trying to leave page while editing observation.',
	},
	cancelButton: {
		id: '$1.components.discard-edits-dialog.cancelButton',
		defaultMessage: 'Cancel',
		description: 'Text for button to cancel action.',
	},
	confirmButton: {
		id: '$1.components.discard-edits-dialog.confirmButton',
		defaultMessage: 'Yes, Discard',
		description: 'Text for button to confirm discarding changes.',
	},
})
