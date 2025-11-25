import { useEffect, useState, type ReactElement, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import CircularProgress from '@mui/material/CircularProgress'
import Fade from '@mui/material/Fade'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'

import {
	COMAPEO_BLUE,
	GREEN,
	LIGHT_COMAPEO_BLUE,
} from '../../../../../../../colors'
import { Icon } from '../../../../../../../components/icon'
import { useGlobalEditingStateActions } from '../../../../../../../contexts/global-editing-state-store-context'
import { useIconSizeBasedOnTypography } from '../../../../../../../hooks/icon'

type EditState = 'idle' | 'active' | 'success'

export function EditableSection({
	editIsPending,
	renderWhenEditing,
	renderWhenIdle,
	sectionTitle,
	tooltipText,
}: {
	editIsPending: boolean
	renderWhenEditing: (props: {
		updateEditState: (state: EditState) => void
	}) => ReactElement
	renderWhenIdle: ReactNode
	sectionTitle: string
	tooltipText: string
}) {
	const iconSize = useIconSizeBasedOnTypography({
		multiplier: 0.7,
		typographyVariant: 'body1',
	})

	const globalEditingStateActions = useGlobalEditingStateActions()

	const [editState, setEditState] = useState<EditState>('idle')

	useEffect(() => {
		let timeoutId: number | undefined

		if (editState === 'success') {
			timeoutId = window.setTimeout(() => {
				setEditState('idle')
			}, 5_000)
		}

		return () => {
			if (timeoutId !== undefined) {
				clearTimeout(timeoutId)
			}
		}
	}, [editState, setEditState])

	return (
		<Stack
			direction="column"
			paddingInline={6}
			gap={4}
			flex={1}
			flexWrap="wrap"
		>
			<Stack direction="row" gap={2}>
				<Typography
					id="notes-section-title"
					component="h2"
					variant="body1"
					textTransform="uppercase"
				>
					{sectionTitle}
				</Typography>
				<Box display="flex" justifyContent="center" alignItems="center">
					{editIsPending ? (
						<CircularProgress disableShrink size={iconSize} />
					) : editState === 'success' ? (
						<Icon
							name="material-check-circle-rounded"
							sx={{ height: iconSize, width: iconSize }}
							htmlColor={GREEN}
						/>
					) : (
						<Icon
							name="material-edit-filled"
							sx={{ height: iconSize, width: iconSize }}
							htmlColor={editState === 'active' ? COMAPEO_BLUE : undefined}
						/>
					)}
				</Box>
			</Stack>

			{editState === 'active' ? (
				renderWhenEditing({
					updateEditState: (state) => {
						setEditState(state)
					},
				})
			) : (
				<Tooltip
					title={tooltipText}
					slots={{ transition: Fade }}
					slotProps={{
						tooltip: {
							sx: (theme) => ({
								backgroundColor: theme.palette.common.white,
								color: theme.palette.text.primary,
								boxShadow: theme.shadows[5],
							}),
						},
						popper: {
							disablePortal: true,
							modifiers: [{ name: 'offset', options: { offset: [0, -12] } }],
						},
					}}
				>
					<Box component="span" display="flex">
						<ButtonBase
							disabled={editIsPending}
							onClick={() => {
								setEditState('active')
								globalEditingStateActions.update(true)
							}}
							sx={{
								':hover, :focus': {
									backgroundColor: alpha(LIGHT_COMAPEO_BLUE, 0.5),
									transition: (theme) =>
										theme.transitions.create('background-color'),
								},
								':disabled': {
									color: (theme) => theme.palette.text.disabled,
								},
								padding: 2,
								display: 'inline-flex',
								justifyContent: 'flex-start',
								textAlign: 'start',
								borderRadius: 1,
								overflowWrap: 'anywhere',
								flex: 1,
							}}
						>
							{renderWhenIdle}
						</ButtonBase>
					</Box>
				</Tooltip>
			)}
		</Stack>
	)
}
