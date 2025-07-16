import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'
import * as v from 'valibot'

import { BLUE_GREY, DARK_GREY } from '../../../colors'
import { Icon } from '../../../components/icon'
import { SupportedLanguageTagSchema, usableLanguages } from '../../../lib/intl'
import {
	getLocaleStateQueryOptions,
	setLocaleMutationOptions,
} from '../../../lib/queries/app-settings'

export const Route = createFileRoute('/app/settings/language')({
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()
	const router = useRouter()
	const queryClient = useQueryClient()

	const { data: localeState } = useSuspenseQuery(getLocaleStateQueryOptions())

	const setLocale = useMutation(setLocaleMutationOptions(queryClient))

	return (
		<Stack direction="column" flex={1}>
			<Stack
				direction="row"
				alignItems="center"
				component="nav"
				useFlexGap
				gap={4}
				padding={4}
				borderBottom={`1px solid ${BLUE_GREY}`}
			>
				<IconButton
					onClick={() => {
						if (router.history.canGoBack()) {
							router.history.back()
							return
						}

						router.navigate({ to: '/app/settings', replace: true })
					}}
				>
					<Icon name="material-arrow-back" size={30} />
				</IconButton>
				<Typography
					variant="h1"
					fontWeight={500}
					id="coordinate-system-selection-label"
				>
					{t(m.navTitle)}
				</Typography>
			</Stack>
			<Box padding={6} overflow="auto">
				<FormControl>
					<RadioGroup
						aria-labelledby="language-selection-label"
						value={
							localeState.source !== 'selected' ? 'system' : localeState.value
						}
						name="language"
						onChange={(event) => {
							const parsedValue = v.parse(
								v.union([
									v.pipe(v.literal('system')),
									SupportedLanguageTagSchema,
								]),
								event.currentTarget.value,
							)

							setLocale.mutate(
								parsedValue === 'system'
									? {
											useSystemPreferences: true,
											languageTag: null,
										}
									: {
											useSystemPreferences: false,
											languageTag: parsedValue,
										},
							)
						}}
					>
						<Stack direction="column" useFlexGap gap={6}>
							<FormControlLabel
								value="system"
								control={<Radio />}
								label={
									<RadioOptionLabel
										primaryText={t(m.followSystemOptionLabel)}
									/>
								}
							/>
							{usableLanguages.map(
								({ languageTag, nativeName, englishName }) => (
									<FormControlLabel
										key={languageTag}
										value={languageTag}
										control={<Radio />}
										label={
											<RadioOptionLabel
												primaryText={nativeName}
												secondaryText={englishName}
											/>
										}
									/>
								),
							)}
						</Stack>
					</RadioGroup>
				</FormControl>
			</Box>
		</Stack>
	)
}

function RadioOptionLabel({
	primaryText,
	secondaryText,
}: {
	primaryText: string
	secondaryText?: string
}) {
	return (
		<Stack direction="column">
			<Typography fontWeight={500}>{primaryText}</Typography>
			{secondaryText ? (
				<Typography color={DARK_GREY}>{secondaryText}</Typography>
			) : null}
		</Stack>
	)
}

const m = defineMessages({
	navTitle: {
		id: 'routes.app.settings.language.title',
		defaultMessage: 'Language',
		description: 'Title of the language settings page.',
	},
	followSystemOptionLabel: {
		id: 'routes.app.settings.language.followSystemOptionLabel',
		defaultMessage: 'Follow system preferences',
		description: 'Option label for following system preference for language.',
	},
})
