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
	displayedValue: string
	footer?: ReactNode
	header?: ReactNode
	hiddenInput: ReactNode
	multiSelect?: boolean
	onClose?: () => void
	onOpen?: () => void
}>) {
	const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null)

	const [isFocusWithinList, setIsFocusWithinList] = useState(false)
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
							<Fade
								{...TransitionProps}
								onEnter={() => {
									TransitionProps?.onEnter()
									onOpen?.()
								}}
								onExited={() => {
									TransitionProps?.onExited()
									onClose?.()
								}}
							>
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
										{header ? (
											<Box
												onKeyDown={(event) => {
													// TODO: Kind of hacky and assumes only one focusable element within
													if (event.key === 'Tab' && event.shiftKey) {
														event.preventDefault()
														setAnchorElement(null)
														triggerRef.current?.focus()
													}
												}}
												sx={{
													borderBottom: `1px solid ${BLUE_GREY}`,
													padding: 2,
												}}
											>
												{header}
											</Box>
										) : null}

										<Stack
											component={List}
											disablePadding
											role="listbox"
											aria-multiselectable={multiSelect}
											ref={optionsListRef}
											sx={{ flex: 1, overflow: 'auto' }}
											tabIndex={isFocusWithinList ? -1 : 0}
											onKeyDown={(event) => {
												if (!header) {
													if (event.key === 'Tab' && event.shiftKey) {
														event.preventDefault()
														setAnchorElement(null)
														triggerRef.current?.focus()
														return
													}
												}

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
											onBlur={() => {
												setIsFocusWithinList(false)
											}}
											onFocus={(event) => {
												const focusOnSelf = event.currentTarget === event.target

												const enteredFromOutside =
													!event.currentTarget.contains(event.relatedTarget)

												if (focusOnSelf) {
													if (enteredFromOutside) {
														focusLastFocusedItem()
													}
												} else {
													const isOption =
														event.target.getAttribute('role') === 'option'
													const itemId =
														event.target.getAttribute('data-option-id')

													if (isOption && itemId) {
														setLastFocusedItem(itemId)
													}
												}

												setIsFocusWithinList(true)
											}}
										>
											{children}
										</Stack>

										{footer ? (
											<Box
												onKeyDown={(event) => {
													// TODO: Kind of hacky and assumes only one focusable element within
													if (event.key === 'Tab' && !event.shiftKey) {
														event.preventDefault()
														setAnchorElement(null)
														triggerRef.current?.focus()
													}
												}}
												sx={{ borderTop: `1px solid ${BLUE_GREY}`, padding: 2 }}
											>
												{footer}
											</Box>
										) : null}
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
