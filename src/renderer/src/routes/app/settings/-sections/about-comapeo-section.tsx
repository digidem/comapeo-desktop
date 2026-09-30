import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_GREY } from '../../../../colors.ts'

export function AboutCoMapeoSection() {
	const intl = useIntl()

	return (
		<Stack component="section" direction="column" sx={{ gap: 4 }}>
			<Stack direction="column" sx={{ gap: 4 }}>
				<Typography
					component="h2"
					variant="body2"
					sx={{ fontWeight: 500, textTransform: 'uppercase' }}
				>
					{intl.formatMessage(m.aboutComapeoSectionTitle)}
				</Typography>

				<Stack
					direction="column"
					sx={{
						border: `1px solid ${BLUE_GREY}`,
						borderRadius: 2,
						gap: 4,
						flex: 1,
					}}
				>
					<List>
						<ListItem>
							<Stack direction="column" sx={{ gap: 3 }}>
								<Typography
									component="h3"
									variant="body1"
									sx={{ fontWeight: 500 }}
								>
									{intl.formatMessage(m.aboutComapeoVersionLabel)}
								</Typography>

								<Typography>
									{window.runtime.getAppInfo().appVersion}
								</Typography>
							</Stack>
						</ListItem>
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
