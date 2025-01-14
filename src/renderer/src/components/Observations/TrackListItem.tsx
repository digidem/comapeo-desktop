import type { Track } from '@comapeo/schema'
import { styled } from '@mui/material/styles'
import { FormattedDate, FormattedTime } from 'react-intl'

import { DARK_TEXT, VERY_LIGHT_GREY } from '../../colors'

// const m = defineMessages({
// 	trackLabel: {
// 		id: 'trackListItem.trackLabel',
// 		defaultMessage: 'Track',
// 	},
// })

type Props = {
	track: Track
	onClick?: () => void
}

const Container = styled('div')({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	borderBottom: `1px solid ${VERY_LIGHT_GREY}`,
	padding: '10px 0',
	cursor: 'pointer',
	'&:hover': {
		backgroundColor: '#f9f9f9',
	},
})

const TextContainer = styled('div')({
	flex: 1,
	display: 'flex',
	flexDirection: 'column',
})

const TitleRow = styled('div')({
	fontFamily: 'Rubik, sans-serif',
	fontSize: 12,
	fontWeight: 500,
	lineHeight: '14.22px',
	color: DARK_TEXT,
})

const DateRow = styled('div')({
	fontFamily: 'Rubik, sans-serif',
	fontSize: 10,
	fontWeight: 400,
	lineHeight: '11.85px',
	color: DARK_TEXT,
})

export function TrackListItem({ track, onClick }: Props) {
	const createdAt = track.createdAt ? new Date(track.createdAt) : new Date()

	return (
		<Container onClick={onClick}>
			<TextContainer>
				<TitleRow>{track.tags?.trackName || '[Track]'}</TitleRow>
				<DateRow>
					<FormattedDate
						value={createdAt}
						month="short"
						day="2-digit"
						year="numeric"
					/>
					{', '}
					<FormattedTime value={createdAt} hour="numeric" minute="2-digit" />
				</DateRow>
			</TextContainer>
		</Container>
	)
}
