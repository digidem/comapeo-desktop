import { useState } from 'react'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Collapse from '@mui/material/Collapse'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { BLACK_02, BLACK_03, BLUE_05 } from '../../../shared/colors.ts'
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
						backgroundColor: (theme) => theme.alpha(BLUE_05, 0.2),
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
						htmlColor={BLACK_02}
					/>
				</Stack>
			</ButtonBase>

			<Collapse in={advancedExpanded}>
				<Box
					sx={{
						backgroundColor: BLACK_03,
						border: `1px solid ${BLUE_05}`,
						borderRadius: 2,
						maxHeight: 300,
						overflow: 'auto',
						padding: 4,
					}}
				>
					<Typography
						component="pre"
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
