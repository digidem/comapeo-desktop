import CircleIcon from '@mui/icons-material/Circle'
import { styled } from '@mui/material/styles'

import { DARK_GREY } from '../../../colors'
import { Text } from '../../Text'

const DiagnosticsItem = styled('div')({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'flex-start',
	gap: 8,
	marginBottom: 12,
	paddingLeft: 12,
})
const DiagnosticsTitle = styled(Text)({
	fontWeight: 'bold',
	marginRight: 4,
	color: DARK_GREY,
	lineHeight: 1,
})
const DiagnosticsDescription = styled(Text)({
	display: 'inline',
})

export const DiagnosticItem = ({
	title,
	description,
}: {
	title: string
	description: string
}) => (
	<DiagnosticsItem>
		<CircleIcon
			fontSize="small"
			sx={{ fontSize: 6, color: DARK_GREY, marginTop: 1 }}
		/>
		<DiagnosticsTitle kind="subtitle">
			{title}:{' '}
			<DiagnosticsDescription kind="body">{description}</DiagnosticsDescription>
		</DiagnosticsTitle>
	</DiagnosticsItem>
)
