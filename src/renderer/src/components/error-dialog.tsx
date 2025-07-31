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

export function ErrorDialog({
	errorMessage,
	onClose,
	open,
}: {
	errorMessage?: string
	onClose: MouseEventHandler<HTMLButtonElement>
	open: boolean
}) {
	const { formatMessage: t } = useIntl()

	const [advancedExpanded, setAdvancedExpanded] = useState(false)

	return (
		<Dialog open={open}>
			<Stack
				direction="column"
				useFlexGap
				gap={10}
				paddingInline={10}
				paddingBlock={6}
				justifyContent="space-between"
				alignItems="center"
			>
				<Stack direction="column" alignItems="center" useFlexGap gap={4}>
					<Icon name="material-error" color="error" size={72} />

					<Typography variant="h1" fontWeight={500}>
						{t(m.somethingWentWrong)}
					</Typography>
				</Stack>

				{errorMessage ? (
					<Box display="flex" alignSelf="stretch" flex={1}>
						<Stack direction="column" flex={1} useFlexGap gap={2}>
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
								>
									<Typography>{errorMessage}</Typography>
								</Box>
							</Collapse>
						</Stack>
					</Box>
				) : null}

				<Button
					fullWidth
					variant="outlined"
					onClick={(event) => {
						setAdvancedExpanded(false)
						onClose(event)
					}}
					sx={{ maxWidth: 400 }}
				>
					{t(m.close)}
				</Button>
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
