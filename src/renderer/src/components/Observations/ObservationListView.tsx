import React from 'react'
import type { Observation, Track } from '@comapeo/schema'
import { styled } from '@mui/material/styles'
import { defineMessages, useIntl } from 'react-intl'

import { DARK_ORANGE, DARK_TEXT, VERY_LIGHT_GREY, WHITE } from '../../colors'
import AddPersonIcon from '../../images/AddPerson.svg'
import LightningIcon from '../../images/Lightning.svg'
import PencilIcon from '../../images/pencil.png'
import { Button } from '../Button'
import { Text } from '../Text'
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
	unnamedProject: {
		id: 'observationListView.unnamedProject',
		defaultMessage: 'Unnamed Project',
	},
})

const Container = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	height: '100%',
	backgroundColor: WHITE,
})

const ContentWrapper = styled('div')({
	padding: 20,
	borderBottom: `1px solid ${VERY_LIGHT_GREY}`,
})

const TitleRow = styled('div')({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	marginTop: 20,
	marginBottom: 20,
})

const ButtonsRow = styled('div')({
	display: 'flex',
	gap: 10,
})

const PencilImg = styled('img')({
	width: 20,
	height: 20,
	cursor: 'pointer',
	marginLeft: 10,
})

const ListContainer = styled('div')({
	overflowY: 'auto',
	flex: 1,
	margin: 0,
	padding: 0,
})

type ObservationListViewProps = {
	projectName?: string
	projectId?: string
	observations?: Array<Observation>
	tracks?: Array<Track>
	onViewExchange?: () => void
	onViewTeam?: () => void
	onSelectObservation?: (obsId: string) => void
	onSelectTrack?: (trackId: string) => void
	onEditProjectName?: () => void
}

export function ObservationListView({
	projectName,
	projectId,
	observations,
	tracks,
	onViewExchange,
	onViewTeam,
	onSelectObservation,
	onSelectTrack,
	onEditProjectName,
}: ObservationListViewProps) {
	const { formatMessage } = useIntl()
	const name = projectName || formatMessage(m.unnamedProject)
	const combinedData = React.useMemo(() => {
		const mappableObservations = observations ?? []
		const mappableTracks = tracks ?? []
		const allDocs = [...mappableObservations, ...mappableTracks].sort((a, b) =>
			a.createdAt < b.createdAt ? 1 : -1,
		)
		return allDocs
	}, [observations, tracks])

	return (
		<Container>
			<ContentWrapper>
				<TitleRow>
					<Text kind="subtitle" style={{ fontSize: 16, fontWeight: 500 }}>
						{name}
					</Text>
					<PencilImg src={PencilIcon} alt="Edit" onClick={onEditProjectName} />
				</TitleRow>
				<ButtonsRow>
					<Button
						variant="contained"
						style={{
							backgroundColor: DARK_ORANGE,
							color: WHITE,
							minWidth: 170,
						}}
						startIcon={<LightningIcon color={WHITE} width={16} height={16} />}
						onClick={onViewExchange}
					>
						{formatMessage(m.exchange)}
					</Button>
					<Button
						variant="outlined"
						style={{
							borderColor: VERY_LIGHT_GREY,
							color: DARK_TEXT,
							minWidth: 170,
						}}
						startIcon={
							<AddPersonIcon fill={DARK_TEXT} width={16} height={16} />
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
								projectId={projectId}
								onClick={() => onSelectObservation?.(item.docId)}
							/>
						) : (
							<TrackListItem
								key={item.docId}
								track={item}
								onClick={() => onSelectTrack?.(item.docId)}
							/>
						)}
					</li>
				))}
			</ListContainer>
		</Container>
	)
}
