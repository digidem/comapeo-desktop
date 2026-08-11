import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { defineMessages, useIntl } from 'react-intl'

import { AdvancedErrorDetails } from './advanced-error-details.tsx'
import { Icon } from './icon.tsx'

export function ErrorDialogContent({
	errorMessage,
	onClose,
}: {
	errorMessage: string
	onClose: () => void
}) {
	const { formatMessage: t } = useIntl()

	return (
		<Stack direction="column">
			<Stack direction="column" sx={{ gap: 10, flex: 1, padding: 20 }}>
				<Stack direction="column" sx={{ alignItems: 'center', gap: 4 }}>
					<Icon name="material-error" color="error" size={72} />

					<Typography
						variant="h1"
						sx={{ fontWeight: 500, textAlign: 'center' }}
					>
						{t(m.somethingWentWrong)}
					</Typography>
				</Stack>

				<AdvancedErrorDetails
					errorMessage={errorMessage}
					title={t(m.advanced)}
				/>
			</Stack>
			<Box
				sx={{
					position: 'sticky',
					bottom: 0,
					display: 'flex',
					justifyContent: 'center',
					padding: 6,
				}}
			>
				<Button
					fullWidth
					variant="outlined"
					onClick={() => {
						onClose()
					}}
					sx={{ maxWidth: 400, alignSelf: 'center' }}
				>
					{t(m.close)}
				</Button>
			</Box>
		</Stack>
	)
}

const m = defineMessages({
	advanced: {
		id: 'components.error-dialog.advanced',
		defaultMessage: 'Advanced',
		description:
			'Title text for the collapsible section that shows the actual error message.',
	},
	close: {
		id: '$1.components.error-dialog.close',
		defaultMessage: 'Close',
		description: 'Button text for the close button in the error dialog.',
	},
	somethingWentWrong: {
		id: '$1.components.error-dialog.somethingWentWrong',
		defaultMessage: 'Something Went Wrong',
		description: 'Generic title text for the error dialog.',
	},
})
