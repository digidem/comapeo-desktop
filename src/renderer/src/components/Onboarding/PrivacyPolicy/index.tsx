import React from 'react'
import { styled } from '@mui/material/styles'
import { useIntl } from 'react-intl'

import { BLUE_GREY, DARK_GREY, VERY_LIGHT_GREY, WHITE } from '../../../colors'
import BarChart from '../../../images/BarChart.svg'
import BustInSilhouette from '../../../images/BustInSilhouette.svg'
import Wrench from '../../../images/Wrench.svg'
import ChevronUp from '../../../images/chevrondown-expanded.svg'
import ChevronDown from '../../../images/chevrondown.svg'
import ClosedLockWithKey from '../../../images/closed_lock_with_key.png'
import RaisedFistMediumSkinTone from '../../../images/raised_fist_medium_skin_tone.png'
import RaisedHandMediumSkinTone from '../../../images/raised_hand_medium_skin_tone.png'
import RedDot from '../../../images/red_dot.png'
import { Text } from '../../Text'
import { DiagnosticItem } from './DiagnosticItem'
import { MetricsDiagnosticsPermissionToggle } from './MetricsDiagnosticsPermissionToggle'
import { PointContainer } from './PointContainer'
import { m } from './privacyPolicyMessages'

const Container = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	gap: 12,
	padding: 20,
	width: '100%',
	maxWidth: 800,
	margin: '0 auto',
	overflowY: 'auto',
})
const Header = styled(Text)({
	textAlign: 'center',
})
const Subheader = styled(Text)({
	marginTop: 12,
	fontSize: 24,
	fontWeight: 'bold',
	marginBottom: 12,
})
const ContentBox = styled('div')({
	width: '70%',
	maxWidth: 800,
	margin: '0 auto',
	padding: 12,
	backgroundColor: WHITE,
	borderRadius: 10,
})
const HorizontalLine = styled('div')({
	borderBottom: `1px solid ${BLUE_GREY}`,
	margin: '20px 0',
})
const OverviewBox = styled('div')({
	padding: 12,
	borderWidth: 1,
	borderColor: BLUE_GREY,
	borderRadius: 10,
	backgroundColor: VERY_LIGHT_GREY,
	marginBottom: 12,
})
const ToggleContainer = styled('div')(
	({ isTop, isBottom }: { isTop?: boolean; isBottom?: boolean }) => ({
		border: `1px solid ${BLUE_GREY}`,
		borderRadius: isTop ? '10px 10px 0 0' : isBottom ? '0 0 10px 10px' : '0',
		borderTopWidth: isBottom ? 0 : 1,
		padding: '12px 0',
		margin: 0,
		gap: 'unset',
	}),
)
const ToggleHeader = styled('div')({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	padding: 12,
	cursor: 'pointer',
	backgroundColor: WHITE,
})
const ToggleContent = styled('div')({
	padding: 12,
	backgroundColor: WHITE,
})
const ToggledText = styled(Text)(({ theme }) => ({
	color: DARK_GREY,
	fontSize: theme.typography.body2.fontSize,
}))
const DiagnosticsContainer = styled('div')({
	border: `1px solid ${BLUE_GREY}`,
	borderRadius: 10,
	marginBottom: 12,
	paddingBottom: 8,
})
const DiagnosticsContent = styled('div')({
	paddingLeft: 12,
})
const HorizontalLineSmall = styled('div')({
	borderBottom: `1px solid ${BLUE_GREY}`,
	margin: '20px 20px 20px 0',
})
const PermissionToggleContainer = styled('div')({
	flexDirection: 'row',
	alignItems: 'center',
	backgroundColor: WHITE,
	padding: 12,
	border: `1px solid ${BLUE_GREY}`,
	borderRadius: 10,
})

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
				<Subheader kind="title">{formatMessage(m.dataCollection)}</Subheader>
				<PointContainer
					icon={BarChart}
					title={formatMessage(m.whatIsCollected)}
					description={formatMessage(m.whatIsCollectedDescription)}
				/>
				<DiagnosticsContainer>
					<Text kind="subtitle" style={{ margin: 20 }}>
						{formatMessage(m.diagnosticsTitle)}
					</Text>
					<DiagnosticsContent>
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
						<DiagnosticItem
							title={formatMessage(m.deviceInfo)}
							description={formatMessage(m.deviceInfoDescription)}
						/>
						<DiagnosticItem
							title={formatMessage(m.appInfo)}
							description={formatMessage(m.appInfoDescription)}
						/>
						<HorizontalLineSmall />
						<Text kind="subtitle" style={{ margin: '20px 0px' }}>
							{formatMessage(m.appUsageTitle)}
						</Text>
						<DiagnosticItem
							title={formatMessage(m.userCount)}
							description={formatMessage(m.userCountDescription)}
						/>
					</DiagnosticsContent>
				</DiagnosticsContainer>
				<PointContainer
					icon={Wrench}
					title={formatMessage(m.whyCollected)}
					description={formatMessage(m.whyCollectedDescription)}
				/>
				<PointContainer
					icon={RaisedHandMediumSkinTone}
					title={formatMessage(m.notCollected)}
					description={formatMessage(m.notCollectedDescription)}
				/>
				<PointContainer
					icon={RaisedFistMediumSkinTone}
					title={formatMessage(m.thirdParty)}
					description={formatMessage(m.thirdPartyDescription)}
				/>
				<HorizontalLine />
				<Subheader kind="title">{formatMessage(m.permissionsTitle)}</Subheader>
				<PermissionToggleContainer>
					<MetricsDiagnosticsPermissionToggle />
				</PermissionToggleContainer>
			</ContentBox>
		</Container>
	)
}
