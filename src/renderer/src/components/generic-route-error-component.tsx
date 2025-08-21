import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_GREY, LIGHT_GREY, WHITE } from '../colors'

export function GenericRouteErrorComponent({ error }: ErrorComponentProps) {
	const router = useRouter()

	const { formatMessage: t } = useIntl()

	return (
		<Stack
			bgcolor={WHITE}
			direction="column"
			flex={1}
			gap={6}
			height="100%"
			overflow="auto"
		>
			<Stack direction="column" flex={1} gap={6} padding={6}>
				<Typography
					variant="h1"
					color="error"
					fontWeight={500}
					textAlign="center"
				>
					{t(m.somethingWentWrong)}
				</Typography>

				<Typography variant="h2" fontWeight={500}>
					{t(m.error)}
				</Typography>

				<Box
					bgcolor={LIGHT_GREY}
					padding={4}
					border={`1px solid ${BLUE_GREY}`}
					overflow="auto"
					borderRadius={2}
				>
					<Typography
						component="pre"
						variant="body2"
						fontFamily="monospace"
						whiteSpace="pre-wrap"
						sx={{ wordBreak: 'break-word' }}
					>
						{error.toString()}
					</Typography>
				</Box>

				<Typography variant="h2" fontWeight={500}>
					{t(m.stackTrace)}
				</Typography>

				<Box
					bgcolor={LIGHT_GREY}
					padding={4}
					border={`1px solid ${BLUE_GREY}`}
					overflow="auto"
					borderRadius={2}
				>
					<Typography
						component="pre"
						variant="body2"
						fontFamily="monospace"
						whiteSpace="pre-wrap"
						sx={{ wordBreak: 'break-word' }}
					>
						{error.stack}
					</Typography>
				</Box>
			</Stack>

			<Box
				position="sticky"
				bottom={0}
				padding={6}
				display="flex"
				flexDirection="column"
				alignItems="center"
			>
				<Button
					fullWidth
					onClick={() => {
						router.invalidate()
					}}
					sx={{ maxWidth: 400 }}
				>
					{t(m.reload)}
				</Button>
			</Box>
		</Stack>
	)
}

const m = defineMessages({
	somethingWentWrong: {
		id: 'components.generic-route-error-component.somethinWentWrong',
		defaultMessage: 'Something went wrong',
		description: 'Title text of page error',
	},
	error: {
		id: 'components.generic-route-error-component.error',
		defaultMessage: 'Error',
		description: 'Label for error section',
	},
	stackTrace: {
		id: 'components.generic-route-error-component.stacktrace',
		defaultMessage: 'Stack trace',
		description: 'Label for stack trace section',
	},
	reload: {
		id: 'components.generic-route-error-component.reload',
		defaultMessage: 'Reload',
		description: 'Text for button to reload page.',
	},
})
