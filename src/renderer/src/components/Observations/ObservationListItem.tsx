import type { Observation } from '@comapeo/schema'
import { styled } from '@mui/material/styles'
import {
	FormattedDate,
	FormattedTime,
	defineMessages,
	useIntl,
} from 'react-intl'

import { VERY_LIGHT_GREY } from '../../colors'
import { useObservationWithPreset } from '../../hooks/useObservationWithPreset'
import { PresetCircleIcon } from '../PresetCircleIcon'
import { Text } from '../Text'

type Props = {
	observation: Observation
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

const PhotoContainer = styled('img')({
	width: 48,
	height: 48,
	borderRadius: 6,
	objectFit: 'cover',
})

const m = defineMessages({
	observation: {
		// Keep id stable for translations
		id: 'screens.Observation.ObservationView.observation',
		defaultMessage: 'Observation',
		description: 'Default name of observation with no matching preset',
	},
})

export function ObservationListItem({
	observation,
	projectId,
	onClick,
}: Props) {
	const { formatMessage } = useIntl()
	const preset = useObservationWithPreset(observation, projectId ?? '')
	const createdAt = observation.createdAt
		? new Date(observation.createdAt)
		: new Date()

	const photoAttachment = observation.attachments.find(
		(att) => att.type === 'photo',
	)
	const displayName = preset
		? formatMessage({
				id: `presets.${preset.docId}.name`,
				defaultMessage: preset.name,
			})
		: formatMessage(m.observation)

	return (
		<Container onClick={onClick}>
			<TextContainer>
				<Text style={{ fontWeight: 500 }}>{displayName}</Text>
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
