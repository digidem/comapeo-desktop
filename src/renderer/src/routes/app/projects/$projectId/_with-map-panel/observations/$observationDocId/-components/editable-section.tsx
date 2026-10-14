import { useEffect, useState, type ReactElement, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import CircularProgress from '@mui/material/CircularProgress'
import Fade from '@mui/material/Fade'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'

import { BLUE_06 } from '../../../../../../../../../../shared/colors.ts'
import { Icon } from '../../../../../../../../components/icon.tsx'
import { useIconSizeBasedOnTypography } from '../../../../../../../../hooks/icon.ts'

type EditState = 'idle' | 'active' | 'success'

export function EditableSection({
	disabled,
	editIsPending,
	onStartEditMode,
	renderWhenEditing,
	renderWhenIdle,
	sectionTitle,
	tooltipText,
}: {
	disabled?: boolean
	editIsPending: boolean
	onStartEditMode: () => void
	renderWhenEditing: (props: {
		updateEditState: (state: EditState) => void
	}) => ReactElement
	renderWhenIdle: (() => ReactElement) | ReactNode
	sectionTitle: ReactNode
	tooltipText: string
}) {
	const editIconSize = useIconSizeBasedOnTypography({
		variant: 'sectionLabel',
	})

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

	const triggerButton = (
		<ButtonBase
			disabled={disabled || editIsPending}
			onClick={() => {
				setEditState('active')
				onStartEditMode()
			}}
			sx={{
				borderRadius: 1,
				display: 'inline-flex',
				flex: 1,
				justifyContent: 'flex-start',
				overflowWrap: 'anywhere',
				padding: 2,
				textAlign: 'start',
				':disabled': { color: (theme) => theme.palette.text.disabled },
				':hover, :focus': {
					background: alpha(BLUE_06, 0.5),
					transition: (theme) => theme.transitions.create('background-color'),
				},
			}}
		>
			{typeof renderWhenIdle === 'function' ? renderWhenIdle() : renderWhenIdle}
		</ButtonBase>
	)

	return (
		<Stack direction="column" sx={{ gap: 4, flex: 1, flexWrap: 'wrap' }}>
			<Stack direction="row" sx={{ gap: 2 }}>
				<Typography
					color={disabled ? 'textDisabled' : undefined}
					component="span"
				>
					{sectionTitle}
				</Typography>

				<Box
					sx={{
						alignItems: 'center',
						display: 'flex',
						justifyContent: 'center',
					}}
				>
					{editIsPending ? (
						<CircularProgress size={editIconSize} />
					) : editState === 'success' ? (
						<Icon
							color="success"
							name="material-check-circle-rounded"
							size={editIconSize}
						/>
					) : (
						<Icon
							color={
								editState === 'active'
									? 'primary'
									: disabled
										? 'disabled'
										: undefined
							}
							name="material-edit-filled"
							size={editIconSize}
						/>
					)}
				</Box>
			</Stack>

			{editState === 'active' ? (
				renderWhenEditing({
					updateEditState: (state) => {
						setEditState((prev) => (state === prev ? prev : state))
					},
				})
			) : disabled ? (
				triggerButton
			) : (
				<Tooltip title={tooltipText} slots={{ transition: Fade }}>
					<Box component="span" sx={{ display: 'flex' }}>
						{triggerButton}
					</Box>
				</Tooltip>
			)}
		</Stack>
	)
}
