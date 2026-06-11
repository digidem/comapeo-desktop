import { useRef, useState, type PropsWithChildren, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Fade from '@mui/material/Fade'
import List from '@mui/material/List'
import Popper from '@mui/material/Popper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { BLUE_GREY, DARK_GREY, WHITE } from '../../../../../colors.ts'
import { Icon } from '../../../../../components/icon.tsx'

// TODO: Fix issue where shift tabbing out does not close popper (should close popper, focus trigger)
// TODO: Fix issue where tabbing out does not close popper (should close popper, focus trigger)
export function FilterSelect({
	children,
	displayedValue,
	hiddenInput,
	footer,
	multiSelect,
}: PropsWithChildren<{
	displayedValue: string
	hiddenInput: ReactNode
	footer: ReactNode
	multiSelect?: boolean
}>) {
	const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null)

	const [lastFocusedItem, setLastFocusedItem] = useState<string | null>(null)

	const popperRef = useRef<HTMLDivElement | null>(null)
	const triggerRef = useRef<HTMLButtonElement | null>(null)
	const optionsListRef = useRef<HTMLUListElement>(null)

	function focusLastFocusedItem() {
		if (!optionsListRef.current) {
			return
		}

		if (lastFocusedItem) {
			const itemToFocus = optionsListRef.current.querySelector(
				`[role="option"][data-option-id="${lastFocusedItem}"]`,
			)

			if (itemToFocus instanceof HTMLElement) {
				itemToFocus.focus()
			}
		}
	}

	return (
		<ClickAwayListener
			onClickAway={() => {
				setAnchorElement(null)
			}}
		>
			<Box
				onKeyDown={(event) => {
					if (event.key === 'Escape') {
						setAnchorElement(null)
						triggerRef.current?.focus()
					}
				}}
				sx={{ display: 'flex', flex: 1 }}
			>
				<ButtonBase
					ref={triggerRef}
					type="button"
					aria-expanded={!!anchorElement}
					aria-haspopup="listbox"
					disableRipple
					disableTouchRipple
					role="combobox"
					onClick={(event) => {
						setAnchorElement((prev) => (prev ? null : event.currentTarget))
					}}
					onKeyDown={(event) => {
						if (event.key === 'Enter' && !anchorElement) {
							event.preventDefault()
							setAnchorElement(event.currentTarget)
							return
						}
					}}
					sx={{
						flex: 1,
						borderRadius: 2,
						justifyContent: 'flex-start',
						outline: (theme) =>
							anchorElement
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
							sx={{ transform: anchorElement ? 'rotate(180deg)' : undefined }}
							htmlColor={DARK_GREY}
						/>
					</Stack>

					{hiddenInput}
				</ButtonBase>

				<Popper
					transition
					ref={popperRef}
					role="presentation"
					placement="bottom-start"
					sx={{ zIndex: 1 }}
					modifiers={[
						{ name: 'offset', options: { offset: [0, 8] } },
						{ name: 'eventListeners', enabled: true },
						{
							name: 'focusOptionOnInit',
							enabled: true,
							phase: 'main',
							effect: () => {
								if (!optionsListRef.current) {
									return
								}

								const firstSelectedOption =
									optionsListRef.current.querySelector(
										`[role="option"][data-option-id][aria-selected="true"]`,
									)

								if (firstSelectedOption instanceof HTMLElement) {
									firstSelectedOption.focus()
									return
								}

								const firstOption = optionsListRef.current?.querySelector(
									`[role="option"][data-option-id]`,
								)

								if (firstOption instanceof HTMLElement) {
									firstOption.focus()
								}
							},
						},
					]}
					anchorEl={anchorElement}
					open={!!anchorElement}
				>
					{({ TransitionProps }) => {
						return (
							<Fade {...TransitionProps}>
								<Box
									sx={{
										overflow: 'hidden',
										bgcolor: WHITE,
										boxShadow: (theme) => theme.shadows[5],
										borderRadius: 2,
										scrollbarColor: 'initial',
									}}
								>
									<Stack
										direction="column"
										sx={{ maxHeight: '50dvh', position: 'relative' }}
									>
										<Stack
											component={List}
											disablePadding
											role="listbox"
											aria-multiselectable={multiSelect}
											ref={optionsListRef}
											sx={{ overflow: 'auto' }}
											tabIndex={0}
											onKeyDown={(event) => {
												switch (event.key) {
													case 'ArrowDown': {
														if (
															'nextElementSibling' in event.target &&
															event.target.nextElementSibling instanceof
																HTMLElement
														) {
															event.preventDefault()
															event.target.nextElementSibling.focus()
														}

														return
													}
													case 'ArrowUp': {
														if (
															'previousElementSibling' in event.target &&
															event.target.previousElementSibling instanceof
																HTMLElement
														) {
															event.preventDefault()
															event.target.previousElementSibling.focus()
														}

														return
													}
												}
											}}
											onFocus={(event) => {
												if (event.currentTarget === event.target) {
													event.preventDefault()

													if (
														event.currentTarget.contains(event.relatedTarget)
													) {
														setAnchorElement(null)
														triggerRef.current?.focus()
													} else {
														focusLastFocusedItem()
													}

													return
												}

												const itemId =
													event.target?.getAttribute('data-option-id')

												if (itemId) {
													event.preventDefault()
													setLastFocusedItem(itemId)
												}
											}}
										>
											{children}
										</Stack>

										<Box
											sx={{
												position: 'sticky',
												bottom: 0,
												right: 0,
												left: 0,
												padding: 2,
												backgroundColor: WHITE,
												borderTop: `1px solid ${BLUE_GREY}`,
											}}
											tabIndex={-1}
											onKeyDown={(event) => {
												// TODO: Kind of hacky and assumes only one focusable element in the footer
												if (event.key === 'Tab' && !event.shiftKey) {
													event.preventDefault()
													setAnchorElement(null)
													triggerRef.current?.focus()
												}
											}}
										>
											{footer}
										</Box>
									</Stack>
								</Box>
							</Fade>
						)
					}}
				</Popper>
			</Box>
		</ClickAwayListener>
	)
}
