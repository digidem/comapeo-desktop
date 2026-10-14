import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_05 } from '../../../../../../shared/colors.ts'

export function AboutCoMapeoSection() {
	const intl = useIntl()

	return (
		<Stack component="section" direction="column" sx={{ gap: 4 }}>
			<Stack direction="column" sx={{ gap: 4 }}>
				<Typography component="h2" variant="sectionLabel">
					{intl.formatMessage(m.aboutComapeoSectionTitle)}
				</Typography>

				<Stack
					direction="column"
					sx={{
						border: `1px solid ${BLUE_05}`,
						borderRadius: 2,
						flex: 1,
						gap: 4,
					}}
				>
					<List sx={{ padding: 6 }}>
						<Stack
							component={ListItem}
							direction="column"
							sx={{ alignItems: 'flex-start', gap: 3 }}
						>
							<Typography
								component="h3"
								sx={{
									fontWeight: (theme) => theme.typography.fontWeightMedium,
								}}
							>
								{intl.formatMessage(m.aboutComapeoVersionLabel)}
							</Typography>

							<Typography>{window.runtime.getAppInfo().appVersion}</Typography>
						</Stack>
					</List>
				</Stack>
			</Stack>
		</Stack>
	)
}

const m = defineMessages({
	aboutComapeoSectionTitle: {
		id: '$1.routes.app.settings.index.aboutComapeoSectionTitle',
		defaultMessage: 'About CoMapeo',
		description: 'Text for data and privacy section title.',
	},
	aboutComapeoVersionLabel: {
		id: '$1.routes.app.settings.index.aboutComapeoVersionLabel',
		defaultMessage: 'CoMapeo Version',
		description: 'Label for CoMapeo version.',
	},
})
