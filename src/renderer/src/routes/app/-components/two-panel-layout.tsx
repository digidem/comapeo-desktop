import { type ReactNode } from 'react'
import { alpha } from '@mui/material/styles'
import {
	Group,
	Panel,
	Separator,
	useDefaultLayout,
} from 'react-resizable-panels'

import { BLACK } from '../../../colors.ts'

const BOX_SHADOW = `0px 5px 20px 0px ${alpha(BLACK, 0.25)}`

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

	return (
		<Group defaultLayout={defaultLayout} onLayoutChanged={onLayoutChanged}>
			<Panel
				id="start"
				minSize={280}
				defaultSize="30%"
				maxSize="75%"
				style={{ boxShadow: BOX_SHADOW, display: 'flex', zIndex: 1 }}
			>
				{start}
			</Panel>

			<Separator style={{ width: 1 }} />

			<Panel id="end" style={{ display: 'flex', flex: 1 }}>
				{end}
			</Panel>
		</Group>
	)
}
