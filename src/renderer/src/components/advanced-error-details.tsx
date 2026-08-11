import { useState } from 'react'
import { Box, ButtonBase, Collapse, Stack, Typography } from '@mui/material'

import { BLUE_GREY, DARK_GREY, LIGHT_GREY } from '../colors.ts'
import { Icon } from './icon.tsx'

export function AdvancedErrorDetails({
	errorMessage,
	title,
}: {
	errorMessage: string
	title: string
}) {
	const [advancedExpanded, setAdvancedExpanded] = useState(false)

	return (
		<Stack direction="column" sx={{ flex: 1, gap: 2 }}>
			<ButtonBase
				disableRipple
				onClick={() => {
					setAdvancedExpanded((prev) => !prev)
				}}
				sx={{
					':hover, :focus': {
						backgroundColor: (theme) => theme.alpha(BLUE_GREY, 0.2),
						transition: (theme) => theme.transitions.create('background-color'),
					},
					borderRadius: 2,
					padding: 2,
				}}
			>
				<Stack
					direction="row"
					sx={{
						flex: 1,
						justifyContent: 'space-between',
						'&::marker': { content: 'none' },
					}}
				>
					<Typography color="textSecondary">{title}</Typography>

					<Icon
						name={
							advancedExpanded ? 'material-expand-less' : 'material-expand-more'
						}
						htmlColor={DARK_GREY}
					/>
				</Stack>
			</ButtonBase>

			<Collapse in={advancedExpanded}>
				<Box
					sx={{
						bgcolor: LIGHT_GREY,
						padding: 4,
						border: `1px solid ${BLUE_GREY}`,
						maxHeight: 300,
						overflow: 'auto',
						borderRadius: 2,
					}}
				>
					<Typography
						component="pre"
						variant="body2"
						sx={{
							fontFamily: 'monospace',
							overflowWrap: 'break-word',
							whiteSpace: 'pre-wrap',
						}}
					>
						{errorMessage}
					</Typography>
				</Box>
			</Collapse>
		</Stack>
	)
}
