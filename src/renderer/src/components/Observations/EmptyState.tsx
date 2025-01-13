import React from 'react'
import { styled } from '@mui/material/styles'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_GREY, DARK_TEXT, VERY_LIGHT_GREY } from '../../colors'
import AddPersonIcon from '../../images/AddPerson.svg'
import EmptyStateImage from '../../images/empty_state.png'
import Pencil from '../../images/pencil.png'
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
	unnamedProject: {
		id: 'emptyState.unnamedProject',
		defaultMessage: 'Unnamed Project',
	},
})

const Container = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	padding: '25px 20px',
})

const TitleRow = styled('div')({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: 10,
})

const DividerLine = styled('div')({
	width: '100%',
	height: 1,
	backgroundColor: VERY_LIGHT_GREY,
	marginTop: 20,
	marginBottom: 20,
})

const Circle = styled('div')({
	width: 200,
	height: 200,
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
})

type EmptyStateProps = {
	projectName?: string
	onInviteDevices?: () => void
	onEditProjectName?: () => void
}

export function EmptyState({
	projectName,
	onInviteDevices,
	onEditProjectName,
}: EmptyStateProps) {
	const { formatMessage } = useIntl()
	const name = projectName || formatMessage(m.unnamedProject)

	return (
		<>
			<Container>
				<TitleRow>
					<Text kind="subtitle">{name}</Text>
					<img
						src={Pencil}
						alt="Edit"
						style={{ width: 20, height: 20, cursor: 'pointer' }}
						onClick={() => {
							onEditProjectName?.()
						}}
					/>
				</TitleRow>
				<Button
					variant="outlined"
					style={{
						marginTop: 18,
						borderColor: BLUE_GREY,
						color: DARK_TEXT,
					}}
					onClick={() => onInviteDevices?.()}
					startIcon={<AddPersonIcon color={DARK_TEXT} />}
				>
					{formatMessage(m.inviteDevices)}
				</Button>
			</Container>
			<DividerLine />
			<LowerContainer>
				<Circle>
					<StyledImage src={EmptyStateImage} alt="Empty Observations List" />
				</Circle>
				<Text
					kind="body"
					style={{
						marginTop: 18,
					}}
				>
					{formatMessage(m.noObservationsFound)}
				</Text>
			</LowerContainer>
		</>
	)
}
