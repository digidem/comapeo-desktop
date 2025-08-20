import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import {
	useNavigate,
	useRouter,
	type NotFoundRouteProps,
} from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'
import * as v from 'valibot'

import { WHITE } from '../colors'
import { CustomNotFoundDataSchema } from '../lib/navigation'

const CustomNotFoundDataPropSchema = v.looseObject({
	data: CustomNotFoundDataSchema,
})

export function GenericRouteNotFoundComponent({ data }: NotFoundRouteProps) {
	const router = useRouter()
	const navigate = useNavigate()

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
					fontWeight={500}
					textAlign="center"
					whiteSpace="pre-wrap"
					sx={{ wordBreak: 'break-word' }}
				>
					{t(m.title)}
				</Typography>

				{v.is(CustomNotFoundDataPropSchema, data) ? (
					<Typography
						textAlign="center"
						whiteSpace="pre-wrap"
						sx={{ wordBreak: 'break-word' }}
					>
						{data.data.message}
					</Typography>
				) : null}
			</Stack>

			<Box position="sticky" bottom={0} padding={6} display="flex">
				<Stack direction="column" gap={4} flex={1}>
					<Button
						fullWidth
						onClick={() => {
							router.invalidate()
						}}
						sx={{ maxWidth: 400, alignSelf: 'center' }}
					>
						{t(m.tryAgain)}
					</Button>

					{router.history.canGoBack() ? (
						<Button
							fullWidth
							variant="outlined"
							onClick={() => {
								router.history.back()
							}}
							sx={{ maxWidth: 400, alignSelf: 'center' }}
						>
							{t(m.goBack)}
						</Button>
					) : (
						<Button
							fullWidth
							variant="outlined"
							onClick={() => {
								navigate({ to: '/', reloadDocument: true })
							}}
							sx={{ maxWidth: 400, alignSelf: 'center' }}
						>
							{t(m.reloadApp)}
						</Button>
					)}
				</Stack>
			</Box>
		</Stack>
	)
}

const m = defineMessages({
	title: {
		id: 'components.generic-route-not-found-component.notFoundDefault',
		defaultMessage: 'Page not found',
		description: 'Default message shown when page is not found.',
	},
	goBack: {
		id: 'components.generic-route-not-found-component.goBack',
		defaultMessage: 'Go back',
		description: 'Button text for back button.',
	},
	tryAgain: {
		id: 'components.generic-route-not-found-component.tryAgain',
		defaultMessage: 'Try Again',
		description: 'Button text for try again button.',
	},
	reloadApp: {
		id: 'components.generic-route-not-found-component.reloadApp',
		defaultMessage: 'Reload App',
		description: 'Button text for reload app button.',
	},
})
