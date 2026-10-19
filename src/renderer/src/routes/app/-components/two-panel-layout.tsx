import { useRef, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import { alpha } from '@mui/material/styles'
import {
	Group,
	Panel,
	Separator,
	useDefaultLayout,
	usePanelRef,
} from 'react-resizable-panels'

import { BLACK, BLUE_GREY, LIGHT_GREY, WHITE } from '../../../colors.ts'

const BOX_SHADOW = `10px 0px 10px -10px ${alpha(BLACK, 0.1)}`

const PULL_TAB_DOT_STYLE = {
	backgroundColor: LIGHT_GREY,
	borderRadius: '50%',
	height: 8,
	width: 8,
} as const

const LOCALSTORAGE_SUFFIX = 'comapeo-project-panels'

export function TwoPanelLayout({
	start,
	end,
}: {
	start: ReactNode
	end: ReactNode
}) {
	const { defaultLayout, onLayoutChanged } = useDefaultLayout({
		id: LOCALSTORAGE_SUFFIX,
		storage: localStorage,
	})

	const separatorRef = useRef<HTMLDivElement | null>(null)
	const startPanelRef = usePanelRef()

	return (
		<Group
			defaultLayout={defaultLayout}
			onLayoutChanged={(layout, meta) => {
				onLayoutChanged(layout, meta)
			}}
			style={{ position: 'relative' }}
		>
			<Panel
				panelRef={startPanelRef}
				id="start"
				onResize={(panelSize) => {
					if (separatorRef?.current) {
						separatorRef.current.style.left = `${panelSize.inPixels}px`
					}
				}}
				minSize={280}
				defaultSize="30%"
				maxSize="75%"
				style={{
					borderRight: `1px solid ${BLUE_GREY}`,
					boxShadow: BOX_SHADOW,
					display: 'flex',
					zIndex: 2,
				}}
			>
				{start}
			</Panel>

			<Separator
				elementRef={separatorRef}
				// NOTE: Have to override default arrow key behavior due to absolute positioning
				onKeyDownCapture={(event) => {
					if (!startPanelRef.current) {
						return
					}

					if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
						return
					}

					event.stopPropagation()

					const currentSize = startPanelRef.current.getSize()

					const moveByPixels = event.key === 'ArrowRight' ? 50 : -50

					startPanelRef.current.resize(
						`${currentSize.inPixels + moveByPixels}px`,
					)
				}}
				style={{
					alignSelf: 'center',
					backgroundColor: WHITE,
					borderBottomRightRadius: 4,
					borderBottomWidth: 1,
					borderColor: BLUE_GREY,
					borderLeftWidth: 0,
					borderRightWidth: 1,
					borderStyle: 'solid',
					borderTopRightRadius: 4,
					borderTopWidth: 1,
					display: 'flex',
					justifyContent: 'center',
					margin: 'auto',
					position: 'absolute',
					zIndex: 1,
				}}
			>
				<Box
					sx={{
						columnGap: 1,
						display: 'grid',
						gridTemplateColumns: 'repeat(2, 1fr)',
						gridTemplateRows: 'repeat(3, auto)',
						paddingBlock: 6,
						paddingX: 1,
						placeItems: 'center',
						rowGap: 1,
					}}
				>
					<Box sx={PULL_TAB_DOT_STYLE} />
					<Box sx={PULL_TAB_DOT_STYLE} />
					<Box sx={PULL_TAB_DOT_STYLE} />
					<Box sx={PULL_TAB_DOT_STYLE} />
					<Box sx={PULL_TAB_DOT_STYLE} />
					<Box sx={PULL_TAB_DOT_STYLE} />
				</Box>
			</Separator>

			<Panel id="end" style={{ display: 'flex', flex: 1 }}>
				{end}
			</Panel>
		</Group>
	)
}
