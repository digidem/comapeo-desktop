import type { Observation, Track } from '@comapeo/schema'
import { styled } from '@mui/material/styles'
import { defineMessages, useIntl } from 'react-intl'

import { ALMOST_BLACK, LIGHT_GREY, WHITE } from '../../colors'
import { Button } from '../Button'
import { Icon } from '../icon'
import { ObservationListItem } from './ObservationListItem'
import { TrackListItem } from './TrackListItem'

const m = defineMessages({
	exchange: {
		id: 'observationListView.button.exchange',
		defaultMessage: 'View Exchange',
	},
	team: {
		id: 'observationListView.button.team',
		defaultMessage: 'View Team',
	},
})

const Container = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	flex: 1,
	overflow: 'hidden',
	backgroundColor: WHITE,
})

const ContentWrapper = styled('div')({
	padding: 20,
	borderBottom: `1px solid ${LIGHT_GREY}`,
})

const ButtonsRow = styled('div')({
	display: 'flex',
	gap: 10,
})

const ListContainer = styled('div')({
	overflowY: 'auto',
	flex: 1,
	margin: 0,
	padding: '0 0 20px 0',
})

type CombinedData = Observation | Track

type ObservationListViewProps = {
	projectName?: string
	combinedData: Array<CombinedData>
	onViewExchange?: () => void
	onViewTeam?: () => void
	onSelectObservation?: (obsId: string) => void
	onSelectTrack?: (trackId: string) => void
	onEditProjectName?: () => void
}

export function ObservationListView({
	combinedData,
	onViewExchange,
	onViewTeam,
	onSelectObservation,
	onSelectTrack,
}: ObservationListViewProps) {
	const { formatMessage } = useIntl()

	return (
		<Container>
			<ContentWrapper>
				<ButtonsRow>
					<Button
						variant="darkOrange"
						style={{ flex: 1 }}
						startIcon={
							<Icon name="material-bolt" htmlColor={WHITE} size={16} />
						}
						onClick={onViewExchange}
					>
						{formatMessage(m.exchange)}
					</Button>
					<Button
						variant="outlined"
						style={{
							borderColor: LIGHT_GREY,
							color: ALMOST_BLACK,
							flex: 1,
						}}
						startIcon={
							<Icon
								name="material-person-add"
								htmlColor={ALMOST_BLACK}
								size={16}
							/>
						}
						onClick={onViewTeam}
					>
						{formatMessage(m.team)}
					</Button>
				</ButtonsRow>
			</ContentWrapper>

			<ListContainer as="ul">
				{combinedData.map((item) => (
					<li
						key={item.docId}
						style={{ listStyle: 'none', margin: 0, padding: 0 }}
					>
						{item.schemaName === 'observation' ? (
							<ObservationListItem
								key={item.docId}
								observation={item}
								onClick={
									onSelectObservation
										? () => onSelectObservation(item.docId)
										: undefined
								}
							/>
						) : (
							<TrackListItem
								key={item.docId}
								track={item}
								onClick={
									onSelectTrack ? () => onSelectTrack(item.docId) : undefined
								}
							/>
						)}
					</li>
				))}
			</ListContainer>
		</Container>
	)
}
