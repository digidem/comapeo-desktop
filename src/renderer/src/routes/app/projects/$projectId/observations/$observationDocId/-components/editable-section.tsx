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
	BLUE_GREY,
	COMAPEO_BLUE,
	GREEN,
	LIGHT_COMAPEO_BLUE,
} from '#renderer/src/colors.ts'
import { Icon } from '#renderer/src/components/icon.tsx'
import { useIconSizeBasedOnTypography } from '#renderer/src/hooks/icon.ts'

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
	const iconSize = useIconSizeBasedOnTypography({
		multiplier: 0.7,
		typographyVariant: 'body1',
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
				':hover, :focus': {
					backgroundColor: alpha(LIGHT_COMAPEO_BLUE, 0.5),
					transition: (theme) => theme.transitions.create('background-color'),
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
			{typeof renderWhenIdle === 'function' ? renderWhenIdle() : renderWhenIdle}
		</ButtonBase>
	)

	return (
		<Stack direction="column" gap={4} flex={1} flexWrap="wrap">
			<Stack direction="row" gap={2}>
				<Typography
					component="h2"
					variant="body1"
					color={disabled ? 'textDisabled' : undefined}
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
							htmlColor={
								editState === 'active'
									? COMAPEO_BLUE
									: disabled
										? BLUE_GREY
										: undefined
							}
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
						{triggerButton}
					</Box>
				</Tooltip>
			)}
		</Stack>
	)
}
