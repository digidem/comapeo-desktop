import type { Observation } from '@comapeo/schema'
import { styled } from '@mui/material/styles'
import { FormattedDate, FormattedTime } from 'react-intl'

import { VERY_LIGHT_GREY } from '../../colors'
import { useActiveProjectIdStoreState } from '../../contexts/ActiveProjectIdProvider'
import { useObservationWithPreset } from '../../hooks/useObservationWithPreset'
import { FormattedPresetName } from '../FormattedData'
import { PresetCircleIcon } from '../PresetCircleIcon'
import { Text } from '../Text'

type Props = {
	observation: Observation
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

const PhotoContainer = styled('img')({
	width: 48,
	height: 48,
	borderRadius: 6,
	objectFit: 'cover',
})

export function ObservationListItem({ observation, onClick }: Props) {
	const projectId = useActiveProjectIdStoreState((s) => s.activeProjectId)
	const preset = useObservationWithPreset(observation, projectId ?? '')
	const createdAt = observation.createdAt
		? new Date(observation.createdAt)
		: new Date()

	const photoAttachment = observation.attachments.find(
		(att) => att.type === 'photo',
	)

	return (
		<Container onClick={onClick}>
			<TextContainer>
				<Text style={{ fontWeight: 500 }}>
					<FormattedPresetName preset={preset} />
				</Text>
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
			{photoAttachment ? (
				<PhotoContainer src="/path/to/mock/photo.jpg" alt="Observation photo" />
			) : (
				<PresetCircleIcon
					projectId={projectId}
					iconId={preset?.iconRef?.docId}
					borderColor={preset?.color}
					size="medium"
				></PresetCircleIcon>
			)}
		</Container>
	)
}
