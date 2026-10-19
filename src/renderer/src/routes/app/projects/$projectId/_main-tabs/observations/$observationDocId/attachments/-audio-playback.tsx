import Stack from '@mui/material/Stack'
import { styled } from '@mui/material/styles'
import {
	MediaControlBar,
	MediaController,
	MediaPlayButton,
	MediaTimeDisplay,
	MediaTimeRange,
} from 'media-chrome/react'
import { useMediaRef } from 'media-chrome/react/media-store'

import {
	BLACK,
	BLUE_GREY,
	COMAPEO_BLUE,
	WHITE,
} from '../../../../../../../../colors.ts'

const StyledMediaController = styled(MediaController)(({ theme }) => ({
	'--media-background-color': WHITE,
	'--media-control-hover-background': theme.palette.action.hover,
	'--media-focus-box-shadow': `inset 0 0 0 2px ${COMAPEO_BLUE}`,
	'--media-font-family': 'Rubik Variable, sans-serif',
	'--media-primary-color': BLACK,
	'--media-secondary-color': WHITE,
	padding: theme.spacing(2),
}))

const StyledMediaPlayButton = styled(MediaPlayButton)(() => ({
	'--media-control-height': '96px',
	alignSelf: 'center',
}))

const StyledMediaTimeRange = styled(MediaTimeRange)(() => ({
	'--media-range-bar-color': COMAPEO_BLUE,
	'--media-range-thumb-background': COMAPEO_BLUE,
	'--media-range-thumb': COMAPEO_BLUE,
	'--media-range-track-background': BLUE_GREY,
	'--media-range-track-border-radius': '8px',
}))

const StyledMediaTimeDisplay = styled(MediaTimeDisplay)(() => ({
	'--media-font-weight': 500,
}))

export function AudioPlayback({ src, lang }: { src: string; lang: string }) {
	const mediaRef = useMediaRef()

	return (
		<StyledMediaController audio lang={lang}>
			<audio ref={mediaRef} slot="media" src={src} />

			<Stack direction="column" sx={{ gap: 2 }}>
				<StyledMediaPlayButton noTooltip />

				<MediaControlBar>
					<StyledMediaTimeRange>
						<span slot="preview" />
					</StyledMediaTimeRange>
				</MediaControlBar>

				<StyledMediaTimeDisplay noToggle showDuration />
			</Stack>
		</StyledMediaController>
	)
}
