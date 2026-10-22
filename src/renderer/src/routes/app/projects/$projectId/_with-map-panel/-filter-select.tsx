import {
	useId,
	useState,
	type ComponentProps,
	type PropsWithChildren,
	type ReactNode,
} from 'react'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import MenuList from '@mui/material/MenuList'
import Paper from '@mui/material/Paper'
import Popper from '@mui/material/Popper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { BLACK_02 } from '../../../../../../../shared/colors.ts'
import { Icon } from '../../../../../components/icon.tsx'

export function FilterSelect({
	children,
	displayedValue,
	footer,
	header,
	hiddenInput,
	multiSelect,
	onClose,
	onOpen,
}: PropsWithChildren<{
	displayedValue: ReactNode
	footer?: ReactNode
	header?: ReactNode
	hiddenInput: ReactNode
	multiSelect?: boolean
	onClose?: () => void
	onOpen?: () => void
}>) {
	const [open, setOpen] = useState(false)

	const [anchorElement, setAnchorElement] = useState<HTMLButtonElement | null>(
		null,
	)

	const triggerId = useId()

	return (
		<>
			<ButtonBase
				id={triggerId}
				ref={(node) => {
					setAnchorElement(node)
				}}
				type="button"
				aria-expanded={open}
				aria-haspopup="listbox"
				disableRipple
				disableTouchRipple
				role="combobox"
				onClick={() => {
					setOpen((prevOpen) => !prevOpen)

					if (open) {
						onClose?.()
						anchorElement?.focus()
					} else {
						onOpen?.()
					}
				}}
				sx={{
					flex: 1,
					borderRadius: 2,
					justifyContent: 'flex-start',
					outline: (theme) =>
						open
							? `2px solid ${theme.palette.primary.main}`
							: `1px solid ${theme.palette.action.disabled}`,
					'&:focus': {
						outline: (theme) => `2px solid ${theme.palette.primary.main}`,
					},
				}}
			>
				<Stack
					direction="row"
					sx={{
						flex: 1,
						overflow: 'hidden',
						padding: 2,
						position: 'relative',
					}}
				>
					<Typography
						variant="button"
						sx={{
							flex: 1,
							overflow: 'hidden',
							whiteSpace: 'nowrap',
							textOverflow: 'ellipsis',
							textAlign: 'start',
						}}
					>
						{displayedValue}
					</Typography>

					<Icon
						name="material-expand-more-rounded"
						sx={{ transform: open ? 'rotate(180deg)' : undefined }}
						htmlColor={BLACK_02}
					/>
				</Stack>

				{hiddenInput}
			</ButtonBase>

			<Popper
				open={open}
				anchorEl={anchorElement}
				role="presentation"
				placement="bottom-start"
				modifiers={POPPER_MODIFIERS}
				sx={{ zIndex: (theme) => theme.zIndex.modal - 1 }}
			>
				<Paper
					elevation={4}
					sx={{
						display: 'flex',
						flexDirection: 'column',
						maxHeight: '50dvh',
						overflow: 'auto',
					}}
				>
					<ClickAwayListener
						mouseEvent="onPointerDown"
						onClickAway={(event) => {
							if (
								event.target instanceof HTMLElement &&
								anchorElement?.contains(event.target)
							) {
								return
							}

							setOpen(false)
							onClose?.()
							anchorElement?.focus()
						}}
					>
						<Stack
							direction="column"
							onKeyDown={(event) => {
								if (event.key === 'Tab') {
									event.preventDefault()
									setOpen(false)
									onClose?.()
									anchorElement?.focus()
								} else if (event.key === 'Escape') {
									setOpen(false)
									onClose?.()
									anchorElement?.focus()
								}
							}}
							sx={{
								display: 'flex',
								flex: 1,
								flexDirection: 'column',
								overflow: 'auto',
							}}
						>
							{header ? (
								<Box
									onKeyDown={(event) => {
										// NOTE: Assumes only one focusable element
										if (event.key === 'Tab' && !event.shiftKey) {
											event.stopPropagation()
										}
									}}
								>
									{header}
								</Box>
							) : null}

							<MenuList
								aria-multiselectable={!!multiSelect}
								autoFocusItem={open}
								onKeyDown={(event) => {
									if (event.key === 'Tab') {
										// NOTE: Assumes header has a focusable element
										if (event.shiftKey && header) {
											event.stopPropagation()
											return
										}

										// NOTE: Assumes footer has a focusable element
										if (!event.shiftKey && footer) {
											event.stopPropagation()
											return
										}
									}
								}}
								sx={{
									display: 'flex',
									flex: 1,
									flexDirection: 'column',
									overflow: 'auto',
								}}
							>
								{children}
							</MenuList>

							{footer ? (
								<Box
									onKeyDown={(event) => {
										// NOTE: Assumes only one focusable element
										if (event.key === 'Tab' && event.shiftKey) {
											event.stopPropagation()
										}
									}}
								>
									{footer}
								</Box>
							) : null}
						</Stack>
					</ClickAwayListener>
				</Paper>
			</Popper>
		</>
	)
}

const POPPER_MODIFIERS: ComponentProps<typeof Popper>['modifiers'] = [
	{ name: 'offset', options: { offset: [0, 8] } },
	// NOTE: Modifier for ensuring that the popper is at least the same width as the trigger
	{
		name: 'minWidth',
		enabled: true,
		phase: 'beforeWrite',
		requires: ['computeStyles'],
		fn: ({ state }) => {
			if (!('popper' in state.styles)) {
				console.warn('`popper` missing in state.styles')
				return
			}

			state.styles.popper.minWidth = `${state.rects.reference.width}px`
		},
		effect: ({ state }) => {
			if (!(state.elements.reference instanceof HTMLElement)) {
				console.warn(
					'Reference is not a HTMLElement: %o',
					state.elements.reference,
				)
				return
			}

			state.elements.popper.style.minWidth = `${
				state.elements.reference.offsetWidth
			}px`
		},
	},
]
