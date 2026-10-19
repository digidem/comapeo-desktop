import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Collapse from '@mui/material/Collapse'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { defineMessages, useIntl } from 'react-intl'

import { BLACK_02, BLACK_03, BLUE_05 } from '../../../shared/colors.ts'
import { useIconSizeBasedOnTypography } from '../hooks/icon.ts'
import { Icon } from './icon.tsx'

export function ErrorDialogContent({
	errorMessage,
	onClose,
}: {
	errorMessage: string
	onClose: () => void
}) {
	const intl = useIntl()

	const [advancedExpanded, setAdvancedExpanded] = useState(false)

	const errorIconSize = useIconSizeBasedOnTypography({
		variant: 'heroHeader',
		multiplier: 3,
	})

	return (
		<Stack direction="column" sx={{ overflow: 'auto' }}>
			<Stack
				direction="column"
				sx={{ flex: 1, gap: 10, overflow: 'auto', padding: 20 }}
			>
				<Stack direction="column" sx={{ alignItems: 'center', gap: 4 }}>
					<Icon name="material-error" color="error" size={errorIconSize} />

					<Typography
						component="h1"
						variant="heroHeader"
						sx={{ textAlign: 'center' }}
					>
						{intl.formatMessage(m.somethingWentWrong)}
					</Typography>
				</Stack>

				<Stack direction="column" sx={{ flex: 1, gap: 2 }}>
					<ButtonBase
						disableRipple
						onClick={() => {
							setAdvancedExpanded((prev) => !prev)
						}}
						sx={{
							':hover, :focus': {
								background: (theme) => theme.alpha(BLUE_05, 0.2),
								transition: (theme) =>
									theme.transitions.create('background-color'),
							},
							padding: 2,
							borderRadius: 2,
						}}
					>
						<Stack
							direction="row"
							sx={{
								alignItems: 'center',
								flex: 1,
								justifyContent: 'space-between',
								'&::marker': { content: 'none' },
							}}
						>
							<Typography>{intl.formatMessage(m.advanced)}</Typography>

							<Icon
								name={
									advancedExpanded
										? 'material-expand-less'
										: 'material-expand-more'
								}
								htmlColor={BLACK_02}
							/>
						</Stack>
					</ButtonBase>

					<Collapse in={advancedExpanded}>
						<Box
							sx={{
								background: BLACK_03,
								border: `1px solid ${BLUE_05}`,
								borderRadius: 2,
								maxHeight: 300,
								overflow: 'auto',
								padding: 4,
							}}
						>
							<Typography
								component="pre"
								variant="detailCopy"
								sx={{ overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}
							>
								{errorMessage}
							</Typography>
						</Box>
					</Collapse>
				</Stack>
			</Stack>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'row',
					justifyContent: 'center',
					padding: 6,
				}}
			>
				<Button
					fullWidth
					onClick={() => {
						onClose()
					}}
					startIcon={<Icon name="material-symbols-cancel" />}
					variant="outlined"
				>
					{intl.formatMessage(m.close)}
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
