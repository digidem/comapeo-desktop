import type { CSSProperties } from 'react'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useRouter, type NotFoundRouteProps } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'
import * as v from 'valibot'

import { BLUE_05 } from '../../../shared/colors.ts'
import {
	CustomNotFoundDataSchema,
	buildDocumentReloadURL,
} from '../lib/navigation.ts'
import { PanelBody, PanelHeader, PanelLayout } from './panel-layout.tsx'

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
			<PanelLayout>
				<PanelHeader title={intl.formatMessage(m.title)} />

				<PanelBody>
					{v.is(CustomNotFoundDataSchema, data) ? (
						<Typography
							sx={{
								overflowWrap: 'break-word',
								textAlign: 'center',
								whiteSpace: 'pre-wrap',
							}}
						>
							{data.message}
						</Typography>
					) : null}
				</PanelBody>
			</PanelLayout>

			<Stack
				direction="row"
				sx={{
					alignItems: 'center',
					borderTop: `1px solid ${BLUE_05}`,
					flexWrap: 'wrap',
					gap: 4,
					justifyContent: 'center',
					padding: 6,
				}}
			>
				{router.history.canGoBack() ? (
					<Button
						fullWidth
						onClick={() => {
							router.history.back()
						}}
						variant="outlined"
					>
						{intl.formatMessage(m.goBack)}
					</Button>
				) : (
					<Button
						fullWidth
						onClick={() => {
							router.navigate({
								href: buildDocumentReloadURL(router, '/'),
								reloadDocument: true,
							})
						}}
						variant="outlined"
					>
						{intl.formatMessage(m.reloadApp)}
					</Button>
				)}

				<Button
					fullWidth
					onClick={() => {
						router.invalidate()
					}}
					variant="contained"
				>
					{intl.formatMessage(m.tryAgain)}
				</Button>
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
