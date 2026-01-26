import { useState, type MouseEventHandler } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Collapse from '@mui/material/Collapse'
import Dialog from '@mui/material/Dialog'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_GREY, DARK_GREY, LIGHT_GREY } from '../colors'
import { Icon } from './icon'

export type Props = {
	errorMessage?: string
	onClose: MouseEventHandler<HTMLButtonElement>
	open: boolean
}

export function ErrorDialog({ errorMessage, onClose, open }: Props) {
	const { formatMessage: t } = useIntl()

	const [advancedExpanded, setAdvancedExpanded] = useState(false)

	return (
		<Dialog open={open} maxWidth="sm">
			<Stack direction="column">
				<Stack direction="column" gap={10} flex={1} padding={20}>
					<Stack direction="column" alignItems="center" gap={4}>
						<Icon name="material-error" color="error" size={72} />

						<Typography variant="h1" fontWeight={500} textAlign="center">
							{t(m.somethingWentWrong)}
						</Typography>
					</Stack>

					{errorMessage ? (
						<Stack direction="column" flex={1} gap={2}>
							<ButtonBase
								disableRipple
								onClick={() => {
									setAdvancedExpanded((prev) => !prev)
								}}
								sx={{
									':hover, :focus': {
										backgroundColor: alpha(BLUE_GREY, 0.2),
										transition: (theme) =>
											theme.transitions.create('background-color'),
									},
									padding: 2,
									borderRadius: 2,
								}}
							>
								<Stack
									direction="row"
									flex={1}
									justifyContent={'space-between'}
									sx={{
										'&::marker': {
											content: 'none',
										},
									}}
								>
									<Typography color="textSecondary">{t(m.advanced)}</Typography>
									<Icon
										name={
											advancedExpanded
												? 'material-expand-less'
												: 'material-expand-more'
										}
										htmlColor={DARK_GREY}
									/>
								</Stack>
							</ButtonBase>

							<Collapse in={advancedExpanded}>
								<Box
									bgcolor={LIGHT_GREY}
									padding={4}
									border={`1px solid ${BLUE_GREY}`}
									maxHeight={300}
									overflow="auto"
									borderRadius={2}
								>
									<Typography
										component="pre"
										variant="body2"
										fontFamily="monospace"
										whiteSpace="pre-wrap"
										sx={{ overflowWrap: 'break-word' }}
									>
										{errorMessage}
									</Typography>
								</Box>
							</Collapse>
						</Stack>
					) : null}
				</Stack>

				<Box
					position="sticky"
					bottom={0}
					display="flex"
					justifyContent="center"
					padding={6}
				>
					<Button
						fullWidth
						variant="outlined"
						onClick={(event) => {
							setAdvancedExpanded(false)
							onClose(event)
						}}
						sx={{ maxWidth: 400, alignSelf: 'center' }}
					>
						{t(m.close)}
					</Button>
				</Box>
			</Stack>
		</Dialog>
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
		id: 'components.error-dialog.close',
		defaultMessage: 'Close',
		description: 'Button text for the close button in the error dialog.',
	},
	somethingWentWrong: {
		id: 'components.error-dialog.somethingWentWrong',
		defaultMessage: 'Something Went Wrong',
		description: 'Generic title text for the error dialog.',
	},
})
