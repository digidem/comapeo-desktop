import React from 'react'
import { styled } from '@mui/material/styles'
import { useIntl } from 'react-intl'

import { BLUE_GREY, DARK_GREY, VERY_LIGHT_GREY, WHITE } from '../../colors'
import BustInSilhouette from '../../images/BustInSilhouette.svg'
import RedDot from '../../images/RedDot.svg'
import ChevronUp from '../../images/chevrondown-expanded.svg'
import ChevronDown from '../../images/chevrondown.svg'
import ClosedLockWithKey from '../../images/closed_lock_with_key.png'
import RaisedFistMediumSkinTone from '../../images/raised_fist_medium_skin_tone.png'
import { Text } from '../Text'
import { DiagnosticItem } from './DiagnosticItem'
import { PointContainer } from './PointContainer'
import { m } from './privacyPolicyMessages'

const Container = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	gap: '20px',
	padding: '20px',
	width: '100%',
	maxWidth: '800px',
	margin: '0 auto',
	overflowY: 'auto',
})

const Header = styled(Text)({
	marginBottom: '16px',
	textAlign: 'center',
})

const Subheader = styled(Text)({
	marginTop: 50,
	fontSize: 24,
	fontWeight: 'bold',
	marginBottom: 30,
})

const ContentBox = styled('div')({
	width: '70%',
	maxWidth: '800px',
	margin: '0 auto',
	padding: '20px',
	backgroundColor: WHITE,
	borderRadius: '10px',
})

const HorizontalLine = styled('div')({
	borderBottom: `1px solid ${BLUE_GREY}`,
	margin: '20px 0',
})

const OverviewBox = styled('div')({
	padding: 20,
	borderWidth: 1,
	borderColor: BLUE_GREY,
	borderRadius: 10,
	backgroundColor: VERY_LIGHT_GREY,
	marginBottom: 20,
})

const ToggleContainer = styled('div')(
	({ isTop, isBottom }: { isTop?: boolean; isBottom?: boolean }) => ({
		border: `1px solid ${BLUE_GREY}`,
		borderRadius: isTop ? '10px 10px 0 0' : isBottom ? '0 0 10px 10px' : '0',
		borderTopWidth: isBottom ? 0 : 1,
		padding: '20px 0',
		margin: 0,
		gap: 'unset',
	}),
)

const ToggleHeader = styled('div')({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	padding: '16px 20px',
	cursor: 'pointer',
	backgroundColor: WHITE,
})

const ToggleContent = styled('div')({
	padding: '16px 20px',
	backgroundColor: WHITE,
})

const ToggledText = styled(Text)(({ theme }) => ({
	color: DARK_GREY,
	fontSize: theme.typography.body2.fontSize,
}))

export function PrivacyPolicy() {
	const { formatMessage } = useIntl()
	const [awanaExpanded, setAwanaExpanded] = React.useState(false)
	const [openSourceExpanded, setOpenSourceExpanded] = React.useState(false)

	return (
		<Container>
			<Header kind="title">{formatMessage(m.privacyPolicyTitle)}</Header>
			<ContentBox>
				<OverviewBox>
					<Text>{formatMessage(m.overview)}</Text>
				</OverviewBox>
				<ToggleContainer isTop>
					<ToggleHeader onClick={() => setAwanaExpanded((prev) => !prev)}>
						<Text>{formatMessage(m.aboutAwana)}</Text>
						{awanaExpanded ? (
							<ChevronUp width={20} height={20} />
						) : (
							<ChevronDown width={20} height={20} />
						)}
					</ToggleHeader>
					{awanaExpanded && (
						<ToggleContent>
							<ToggledText>{formatMessage(m.aboutAwanaContent)}</ToggledText>
						</ToggleContent>
					)}
				</ToggleContainer>
				<ToggleContainer isBottom>
					<ToggleHeader onClick={() => setOpenSourceExpanded((prev) => !prev)}>
						<Text>{formatMessage(m.openSource)}</Text>
						{openSourceExpanded ? (
							<ChevronUp width={20} height={20} />
						) : (
							<ChevronDown width={20} height={20} />
						)}
					</ToggleHeader>
					{openSourceExpanded && (
						<ToggleContent>
							<ToggledText>{formatMessage(m.openSourceContent)}</ToggledText>
						</ToggleContent>
					)}
				</ToggleContainer>
				<Subheader>{formatMessage(m.comapeoPrivacyPolicy)}</Subheader>
				<PointContainer
					icon={RedDot}
					title={formatMessage(m.privateByDefault)}
					description={formatMessage(m.privateByDefaultDescription)}
				/>
				<PointContainer
					icon={BustInSilhouette}
					title={formatMessage(m.noPII)}
					description={formatMessage(m.noPIIDescription)}
				/>
				<PointContainer
					icon={ClosedLockWithKey}
					title={formatMessage(m.control)}
					description={formatMessage(m.controlDescription)}
				/>
				<HorizontalLine />
				<Header>{formatMessage(m.diagnosticsTitle)}</Header>
				<DiagnosticItem
					title={formatMessage(m.crashData)}
					description={formatMessage(m.crashDataDescription)}
				/>
				<DiagnosticItem
					title={formatMessage(m.appErrors)}
					description={formatMessage(m.appErrorsDescription)}
				/>
				<DiagnosticItem
					title={formatMessage(m.performanceData)}
					description={formatMessage(m.performanceDataDescription)}
				/>
			</ContentBox>
		</Container>
	)
}
