import Container from '@mui/material/Container'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { captureException } from '@sentry/react'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'
import * as v from 'valibot'

import { DARK_GREY } from '../../../../colors.ts'
import { DecentDialog } from '../../../../components/decent-dialog.tsx'
import { ErrorDialogContent } from '../../../../components/error-dialog.tsx'
import {
	SupportedLanguageTagSchema,
	usableLanguages,
} from '../../../../lib/intl.ts'
import {
	getLocaleStateQueryOptions,
	setLocaleMutationOptions,
} from '../../../../lib/queries/app-settings.ts'

export const Route = createFileRoute('/app/settings/_nested/language')({
	staticData: {
		getNavTitle: () => {
			return m.navTitle
		},
	},
	loader: async ({ context }) => {
		const { queryClient } = context
		await queryClient.ensureQueryData(getLocaleStateQueryOptions())
	},
	component: RouteComponent,
})

const sortedUsableLanguages = usableLanguages.sort((a, b) => {
	return a.englishName.localeCompare(b.englishName)
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()
	const router = useRouter()

	const { data: localeState } = useSuspenseQuery(getLocaleStateQueryOptions())

	const setLocale = useMutation(setLocaleMutationOptions())

	return (
		<>
			<Container maxWidth="md" disableGutters>
				<Stack direction="column" sx={{ flex: 1, padding: 6 }}>
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
										? { useSystemPreferences: true, languageTag: null }
										: { useSystemPreferences: false, languageTag: parsedValue },
									{
										onError: (err) => {
											captureException(err)
										},
										onSuccess: () => {
											router.invalidate()
										},
									},
								)
							}}
						>
							<Stack direction="column" sx={{ gap: 6 }}>
								<FormControlLabel
									value="system"
									control={<Radio />}
									label={
										<RadioOptionLabel
											primaryText={t(m.followSystemOptionLabel)}
										/>
									}
								/>
								{sortedUsableLanguages.map(
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
				</Stack>
			</Container>

			<DecentDialog
				fullWidth
				maxWidth="sm"
				value={setLocale.status === 'error' ? setLocale.error : null}
			>
				{(error) => (
					<ErrorDialogContent
						errorMessage={error.toString()}
						onClose={() => {
							setLocale.reset()
						}}
					/>
				)}
			</DecentDialog>
		</>
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
			<Typography sx={{ fontWeight: 500 }}>{primaryText}</Typography>
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
