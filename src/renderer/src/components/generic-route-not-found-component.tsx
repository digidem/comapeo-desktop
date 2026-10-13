import type { CSSProperties } from 'react'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useRouter, type NotFoundRouteProps } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'
import * as v from 'valibot'

import {
	CustomNotFoundDataSchema,
	buildDocumentReloadURL,
} from '../lib/navigation.ts'

const CustomNotFoundDataPropSchema = v.looseObject({
	data: CustomNotFoundDataSchema,
})

export function GenericRouteNotFoundComponent({
	backgroundColor,
	data,
}: Omit<NotFoundRouteProps, 'routeId' | 'isNotFound'> & {
	backgroundColor?: CSSProperties['backgroundColor']
}) {
	const router = useRouter()

	const intl = useIntl()

	return (
		<Stack
			direction="column"
			sx={{
				background: backgroundColor,
				flex: 1,
				gap: 6,
				height: '100%',
				overflow: 'auto',
			}}
		>
			<Stack direction="column" sx={{ flex: 1, gap: 6, padding: 6 }}>
				<Typography
					variant="heroHeader"
					sx={{
						overflowWrap: 'break-word',
						textAlign: 'center',
						whiteSpace: 'pre-wrap',
					}}
				>
					{intl.formatMessage(m.title)}
				</Typography>

				{v.is(CustomNotFoundDataPropSchema, data) ? (
					<Typography
						sx={{
							overflowWrap: 'break-word',
							textAlign: 'center',
							whiteSpace: 'pre-wrap',
						}}
					>
						{data.data.message}
					</Typography>
				) : null}
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
						router.invalidate()
					}}
					sx={{ alignSelf: 'center' }}
				>
					{intl.formatMessage(m.tryAgain)}
				</Button>

				{router.history.canGoBack() ? (
					<Button
						fullWidth
						variant="outlined"
						onClick={() => {
							router.history.back()
						}}
						sx={{ alignSelf: 'center' }}
					>
						{intl.formatMessage(m.goBack)}
					</Button>
				) : (
					<Button
						fullWidth
						variant="outlined"
						onClick={() => {
							router.navigate({
								href: buildDocumentReloadURL(router, '/'),
								reloadDocument: true,
							})
						}}
						sx={{ alignSelf: 'center' }}
					>
						{intl.formatMessage(m.reloadApp)}
					</Button>
				)}
			</Stack>
		</Stack>
	)
}

const m = defineMessages({
	title: {
		id: '$1.components.generic-route-not-found-component.title',
		defaultMessage: 'Page not found',
		description: 'Title text shown when page is not found.',
	},
	goBack: {
		id: '$1.components.generic-route-not-found-component.goBack',
		defaultMessage: 'Go back',
		description: 'Button text for back button.',
	},
	tryAgain: {
		id: '$1.components.generic-route-not-found-component.tryAgain',
		defaultMessage: 'Try Again',
		description: 'Button text for try again button.',
	},
	reloadApp: {
		id: '$1.components.generic-route-not-found-component.reloadApp',
		defaultMessage: 'Reload App',
		description: 'Button text for reload app button.',
	},
})
