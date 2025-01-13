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
	padding: 20,
	height: '100%',
	backgroundColor: WHITE,
})

const TitleRow = styled('div')({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	marginBottom: 10,
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

const DividerLine = styled('div')({
	width: '100%',
	height: 1,
	backgroundColor: VERY_LIGHT_GREY,
	marginTop: 20,
	marginBottom: 20,
})

const ListContainer = styled('div')({
	overflowY: 'auto',
	flex: 1,
})

type ObservationListViewProps = {
	projectName?: string
	projectId?: string
	observations: Array<Observation>
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
	tracks = [],
	onViewExchange,
	onViewTeam,
	onSelectObservation,
	onSelectTrack,
	onEditProjectName,
}: ObservationListViewProps) {
	const { formatMessage } = useIntl()
	const name = projectName || formatMessage(m.unnamedProject)
	const combined = React.useMemo(() => {
		const allDocs = [
			...observations.map((obs) => ({
				type: 'observation' as const,
				data: obs,
			})),
			...tracks.map((tr) => ({
				type: 'track' as const,
				data: tr,
			})),
		]
		allDocs.sort((a, b) => {
			// descending by createdAt
			const aTime = a.data.createdAt ?? '1970-01-01T00:00:00.000Z'
			const bTime = b.data.createdAt ?? '1970-01-01T00:00:00.000Z'
			return bTime.localeCompare(aTime) // most recent first
		})
		return allDocs
	}, [observations, tracks])

	return (
		<Container>
			<TitleRow>
				<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<Text kind="subtitle" style={{ fontSize: 16, fontWeight: 500 }}>
						{name}
					</Text>
					<PencilImg src={PencilIcon} alt="Edit" onClick={onEditProjectName} />
				</div>
			</TitleRow>
			<ButtonsRow>
				<Button
					variant="contained"
					style={{ backgroundColor: DARK_ORANGE, color: WHITE }}
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
					}}
					startIcon={<AddPersonIcon fill={DARK_TEXT} width={16} height={16} />}
					onClick={onViewTeam}
				>
					{formatMessage(m.team)}
				</Button>
			</ButtonsRow>

			<DividerLine />

			<ListContainer>
				{combined.map((item) => {
					if (item.type === 'observation') {
						return (
							<ObservationListItem
								key={item.data.docId}
								observation={item.data}
								projectId={projectId}
								onClick={() => onSelectObservation?.(item.data.docId)}
							/>
						)
					} else {
						return (
							<TrackListItem
								key={item.data.docId}
								track={item.data}
								onClick={() => onSelectTrack?.(item.data.docId)}
							/>
						)
					}
				})}
			</ListContainer>
		</Container>
	)
}
