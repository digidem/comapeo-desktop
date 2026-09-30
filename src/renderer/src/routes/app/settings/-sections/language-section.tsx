import { useId } from 'react'
import Fade from '@mui/material/Fade'
import MenuItem from '@mui/material/MenuItem'
import Select, { selectClasses } from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { captureException } from '@sentry/react'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import {
	defineMessages,
	useIntl,
	type MessageValue,
	type NoMessageValues,
} from 'react-intl'
import * as v from 'valibot'

import {
	SupportedLanguageTagSchema,
	type SupportedLanguageTag,
} from '../../../../../../shared/intl.ts'
import { DecentDialog } from '../../../../components/decent-dialog.tsx'
import { ErrorDialogContent } from '../../../../components/error-dialog.tsx'
import { Icon } from '../../../../components/icon.tsx'
import { TITLE_BAR_HEIGHT } from '../../../../lib/constants.ts'
import { getLanguageInfo, usableLanguages } from '../../../../lib/intl.ts'
import {
	getLocaleStateQueryOptions,
	setLocaleMutationOptions,
} from '../../../../lib/queries/app-settings.ts'

const SORTED_USABLE_LANGUAGES = usableLanguages.sort((a, b) => {
	return a.englishName.localeCompare(b.englishName)
})

const SELECT_SX = {
	[`& .${selectClasses.icon}`]: {
		transform: 'rotate(90deg)',
	},
	[`& .${selectClasses.iconOpen}`]: {
		transform: 'rotate(-90deg)',
	},
} as const

export function LanguageSection({
	headingIconSize,
}: {
	headingIconSize: string
}) {
	const intl = useIntl()

	const { data: localeState } = useSuspenseQuery(getLocaleStateQueryOptions())

	const setLocale = useMutation(setLocaleMutationOptions())

	const labelId = `label-${useId()}`

	const currentValue =
		localeState.source !== 'selected' ? 'system' : localeState.value

	return (
		<>
			<Stack component="section" direction="column" sx={{ gap: 4 }}>
				<Stack
					component="h2"
					direction="row"
					sx={{ alignItems: 'center', gap: 4, margin: 0 }}
				>
					<Icon name="material-language" size={headingIconSize} />

					<Typography
						id={labelId}
						variant="body2"
						sx={{ fontWeight: 500, textTransform: 'uppercase' }}
					>
						{intl.formatMessage(m.languageSectionTitle)}
					</Typography>
				</Stack>

				<Select<SupportedLanguageTag | 'system'>
					IconComponent={(props) => {
						return <Icon {...props} name="material-chevron-right-rounded" />
					}}
					MenuProps={{
						anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
						transformOrigin: { horizontal: 'center', vertical: 'top' },
						slots: { transition: Fade },
						slotProps: {
							list: { disablePadding: true },
							paper: {
								style: {
									// NOTE: Kind of hacky but prevents last item from getting cutoff by
									// bottom of window when overflow occurs.
									transform: `translateY(calc((${TITLE_BAR_HEIGHT}) * -1)`,
								},
							},
						},
					}}
					labelId={labelId}
					onChange={(event) => {
						const parsedValue = v.parse(
							v.union([
								v.pipe(v.literal('system')),
								SupportedLanguageTagSchema,
							]),
							event.target.value,
						)

						setLocale.mutate(
							parsedValue === 'system'
								? { useSystemPreferences: true, languageTag: null }
								: { useSystemPreferences: false, languageTag: parsedValue },
							{
								onError: (err) => {
									captureException(err)
								},
							},
						)
					}}
					renderValue={() => {
						const baseTag = localeState.value.split('-')[0]!

						// NOTE: We intentionally do not show the regional variant for now.
						// This will change in the future once we have
						// multiple language variants that we actually support.
						const match = getLanguageInfo(baseTag as SupportedLanguageTag)

						if (localeState.source === 'system') {
							return intl.formatMessage(m.languageFromSystemPreference, {
								name: match.nativeName,
							})
						}

						return match.nativeName
					}}
					sx={SELECT_SX}
					value={currentValue}
				>
					<MenuItem disableGutters value="system" sx={{ padding: 4 }}>
						<Typography
							component="span"
							variant="inherit"
							sx={{
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
							}}
						>
							<bdi lang={localeState.value}>
								{intl.formatMessage(m.languageFollowSystemOptionLabel)}
							</bdi>
						</Typography>
					</MenuItem>

					{SORTED_USABLE_LANGUAGES.map(
						({ languageTag, englishName, nativeName, baseLanguageInfo }) => {
							const labelText = baseLanguageInfo
								? {
										primary: baseLanguageInfo.nativeName,
										secondary: baseLanguageInfo.englishName,
									}
								: { primary: nativeName, secondary: englishName }

							return (
								<MenuItem
									disableGutters
									key={languageTag}
									selected={languageTag === currentValue}
									sx={{ gap: 4, padding: 4 }}
									value={languageTag}
								>
									<Typography
										component="span"
										variant="inherit"
										sx={{
											flex: 1,
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											whiteSpace: 'nowrap',
										}}
									>
										<bdi lang={languageTag}>{labelText.primary}</bdi>
									</Typography>

									<Typography
										component="span"
										variant="inherit"
										color="textSecondary"
										sx={{ fontStyle: 'italic' }}
									>
										{labelText.secondary}
									</Typography>
								</MenuItem>
							)
						},
					)}
				</Select>
			</Stack>

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

const m = defineMessages<{
	readonly languageSectionTitle: NoMessageValues
	readonly languageSettingsAccessibleLabel: NoMessageValues
	readonly languageFromSystemPreference: { readonly name: MessageValue }
	readonly languageFollowSystemOptionLabel: NoMessageValues
}>({
	languageSectionTitle: {
		id: '$1.routes.app.settings.index.languageSectionTitle',
		defaultMessage: 'Language',
		description: 'Section title for language settings.',
	},
	languageSettingsAccessibleLabel: {
		id: 'routes.app.settings.index.languageSettingsAccessibleLabel',
		defaultMessage: 'Go to language settings.',
		description:
			'Accessible label for link item that navigates to language settings page.',
	},
	languageFromSystemPreference: {
		id: '$1.routes.app.settings.index.languageFromSystemPreference',
		defaultMessage: '{name} (System Preference)',
		description: 'Label for selected language based on the system preferences.',
	},
	languageFollowSystemOptionLabel: {
		id: '$1.routes.app.settings.index.languageFollowSystemOptionLabel',
		defaultMessage: 'Follow system preferences',
		description: 'Option label for following system preference for language.',
	},
})
