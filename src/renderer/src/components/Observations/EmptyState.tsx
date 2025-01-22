import { styled } from '@mui/material/styles'
import { defineMessages, useIntl } from 'react-intl'

import { ALMOST_BLACK, BLUE_GREY, VERY_LIGHT_GREY } from '../../colors'
import AddPersonIcon from '../../images/AddPerson.svg'
import EmptyStateImage from '../../images/empty_state.png'
import { Button } from '../Button'
import { Text } from '../Text'

const m = defineMessages({
	inviteDevices: {
		id: 'emptyState.inviteDevices',
		defaultMessage: 'Invite Devices',
	},
	noObservationsFound: {
		id: 'emptyState.noObservationsFound',
		defaultMessage: 'No Observations Found',
	},
})

const Container = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	padding: '25px 20px',
})

const DividerLine = styled('div')({
	width: '100%',
	height: 1,
	backgroundColor: VERY_LIGHT_GREY,
})

const Circle = styled('div')({
	width: 260,
	height: 260,
	borderRadius: '50%',
	backgroundColor: 'rgba(0, 102, 255, 0.1)',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
})

const StyledImage = styled('img')({
	width: 120,
	height: 120,
})

const LowerContainer = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	height: '75%',
	justifyContent: 'center',
	gap: 18,
})

type EmptyStateProps = {
	onInviteDevices?: () => void
}

export function EmptyState({ onInviteDevices }: EmptyStateProps) {
	const { formatMessage } = useIntl()

	return (
		<>
			<Container>
				<Button
					variant="outlined"
					style={{
						borderColor: BLUE_GREY,
						color: ALMOST_BLACK,
					}}
					onClick={() => onInviteDevices?.()}
					startIcon={<AddPersonIcon color={ALMOST_BLACK} />}
				>
					{formatMessage(m.inviteDevices)}
				</Button>
			</Container>
			<DividerLine />
			<LowerContainer>
				<Circle>
					<StyledImage src={EmptyStateImage} alt="Empty Observations List" />
				</Circle>
				<Text kind="body">{formatMessage(m.noObservationsFound)}</Text>
			</LowerContainer>
		</>
	)
}
