import MaterialIcons from '@mui/icons-material/FiberManualRecord'
import { styled } from '@mui/material/styles'

import { Text } from '../../components/Text'

const Container = styled('div')({
	display: 'flex',
	alignItems: 'flex-start',
	gap: '8px',
})

export const DiagnosticItem = ({
	title,
	description,
}: {
	title: string
	description: string
}) => (
	<Container>
		<MaterialIcons fontSize="small" />
		<div>
			<Text kind="subtitle" bold>
				{title}:
			</Text>{' '}
			<Text kind="body">{description}</Text>
		</div>
	</Container>
)
