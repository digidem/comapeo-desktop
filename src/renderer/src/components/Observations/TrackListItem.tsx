import type { Track } from '@comapeo/schema'
import { styled } from '@mui/material/styles'
import {
	FormattedDate,
	FormattedTime,
	defineMessages,
	useIntl,
} from 'react-intl'

import { VERY_LIGHT_GREY } from '../../colors'
import TrackIcon from '../../images/Track.svg'
import { Text } from '../Text'

const m = defineMessages({
	track: {
		id: 'screens.ObservationList.TrackListItem.Track',
		defaultMessage: 'Track',
	},
})

type Props = {
	track: Track
	projectId?: string
	onClick?: () => void
}

const Container = styled('div')({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	borderBottom: `1px solid ${VERY_LIGHT_GREY}`,
	padding: '10px 20px',
	cursor: 'pointer',
	width: '100%',
	'&:hover': {
		backgroundColor: '#f9f9f9',
	},
})

const TextContainer = styled('div')({
	flex: 1,
	display: 'flex',
	flexDirection: 'column',
})

export function TrackListItem({ track, onClick }: Props) {
	const createdAt = track.createdAt ? new Date(track.createdAt) : new Date()
	const { formatMessage } = useIntl()

	return (
		<Container onClick={onClick}>
			<TextContainer>
				<Text style={{ fontWeight: 500 }}>{formatMessage(m.track)}</Text>
				<Text style={{ fontSize: 10, fontWeight: 400 }}>
					<FormattedDate
						value={createdAt}
						month="short"
						day="2-digit"
						year="numeric"
					/>
					{', '}
					<FormattedTime value={createdAt} hour="numeric" minute="2-digit" />
				</Text>
			</TextContainer>
			<TrackIcon />
		</Container>
	)
}
