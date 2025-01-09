import React from 'react'
import type { Observation } from '@comapeo/schema'
import { styled } from '@mui/material/styles'
import { FormattedDate, FormattedTime, defineMessages } from 'react-intl'

import { DARK_TEXT, VERY_LIGHT_GREY } from '../../colors'
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
	padding: '10px 0',
	cursor: 'pointer',
	// hover styling for entire row
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
	display: 'flex',
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

const IconContainer = styled('div')({
	minWidth: 48,
	minHeight: 48,
	borderRadius: 6,
	overflow: 'hidden',
	backgroundColor: VERY_LIGHT_GREY,
	marginLeft: 20,
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
})

const PhotoContainer = styled('img')({
	width: 48,
	height: 48,
	borderRadius: 6,
	objectFit: 'cover',
})

const m = defineMessages({
	untitledCategory: {
		id: 'observationListItem.untitledCategory',
		defaultMessage: '[Category Name]',
	},
})

export function ObservationListItem({ observation, onClick }: Props) {
	const categoryName =
		typeof observation.tags?.category === 'string'
			? observation.tags.category
			: undefined

	const createdAt = observation.createdAt
		? new Date(observation.createdAt)
		: new Date()

	const photoAttachment = observation.attachments.find(
		(att) => att.type === 'photo',
	)

	return (
		<Container onClick={onClick}>
			<TextContainer>
				<TitleRow>
					{categoryName ?? <Text message={m.untitledCategory} />}
				</TitleRow>
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
			{photoAttachment ? (
				<PhotoContainer src="/path/to/mock/photo.jpg" alt="Observation photo" />
			) : (
				<IconContainer></IconContainer>
			)}
		</Container>
	)
}
