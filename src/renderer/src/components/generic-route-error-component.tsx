import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLACK_03, BLUE_05, WHITE_00 } from '../../../shared/colors.ts'
import { buildDocumentReloadURL } from '../lib/navigation.ts'

export function GenericRouteErrorComponent({ error }: ErrorComponentProps) {
	const router = useRouter()

	const intl = useIntl()

	const displayedError =
		error instanceof Error
			? error
			: new Error('Unknown Error', { cause: error })

	return (
		<Stack
			direction="column"
			sx={{
				background: WHITE_00,
				flex: 1,
				gap: 6,
				height: '100%',
				overflow: 'auto',
			}}
		>
			<Stack direction="column" sx={{ flex: 1, gap: 6, padding: 6 }}>
				<Typography
					color="error"
					variant="heroHeader"
					sx={{ textAlign: 'center' }}
				>
					{intl.formatMessage(m.somethingWentWrong)}
				</Typography>

				<Typography variant="heroSubheading">
					{intl.formatMessage(m.error)}
				</Typography>

				<Box
					sx={{
						background: BLACK_03,
						border: `1px solid ${BLUE_05}`,
						borderRadius: 2,
						overflow: 'auto',
						padding: 4,
					}}
				>
					<Typography
						component="pre"
						variant="detailCopy"
						sx={{ overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}
					>
						{displayedError.toString()}
					</Typography>
				</Box>

				<Typography component="h2" variant="heroSubheading">
					{intl.formatMessage(m.stackTrace)}
				</Typography>

				<Box
					sx={{
						background: BLACK_03,
						padding: 4,
						border: `1px solid ${BLUE_05}`,
						overflow: 'auto',
						borderRadius: 2,
					}}
				>
					<Typography
						component="pre"
						variant="detailCopy"
						sx={{
							fontFamily: 'monospace',
							whiteSpace: 'pre-wrap',
							overflowWrap: 'break-word',
						}}
					>
						{displayedError.stack}
					</Typography>
				</Box>
			</Stack>

			<Stack
				direction="column"
				sx={{
					alignItems: 'center',
					bottom: 0,
					gap: 4,
					padding: 6,
					position: 'sticky',
				}}
			>
				<Button
					fullWidth
					onClick={() => {
						router.navigate({
							href: buildDocumentReloadURL(router, '.'),
							reloadDocument: true,
						})
					}}
				>
					{intl.formatMessage(m.reload)}
				</Button>

				<Button
					fullWidth
					variant="outlined"
					onClick={() => {
						router.navigate({
							href: buildDocumentReloadURL(router, '/'),
							reloadDocument: true,
						})
					}}
					sx={{ maxWidth: 400 }}
				>
					{intl.formatMessage(m.restart)}
				</Button>
			</Stack>
		</Stack>
	)
}

const m = defineMessages({
	somethingWentWrong: {
		id: '$1.components.generic-route-error-component.somethingWentWrong',
		defaultMessage: 'Something went wrong',
		description: 'Title text of page error',
	},
	error: {
		id: '$1.components.generic-route-error-component.error',
		defaultMessage: 'Error',
		description: 'Label for error section',
	},
	stackTrace: {
		id: 'components.generic-route-error-component.stacktrace',
		defaultMessage: 'Stack trace',
		description: 'Label for stack trace section',
	},
	reload: {
		id: '$1.components.generic-route-error-component.reload',
		defaultMessage: 'Reload',
		description: 'Text for button to reload page.',
	},
	restart: {
		id: '$1.components.generic-route-error-component.restart',
		defaultMessage: 'Restart',
		description: 'Text for button to restart app.',
	},
})
