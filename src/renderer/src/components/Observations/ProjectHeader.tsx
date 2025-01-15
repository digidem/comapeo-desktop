import { styled } from '@mui/material/styles'

import PencilIcon from '../../images/pencil.png'
import { Text } from '../Text'

const TitleRow = styled('div')({
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'space-between',
	margin: '20px 20px 0 20px',
})

const PencilImg = styled('img')({
	width: 20,
	height: 20,
	cursor: 'pointer',
	marginLeft: 10,
})

export function ProjectHeader({
	projectName,
	onEdit,
}: {
	projectName: string
	onEdit: () => void
}) {
	return (
		<TitleRow>
			<Text kind="subtitle" style={{ fontSize: 16, fontWeight: 500 }}>
				{projectName}
			</Text>
			<PencilImg src={PencilIcon} alt="Edit" onClick={onEdit} />
		</TitleRow>
	)
}
